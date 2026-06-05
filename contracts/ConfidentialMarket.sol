// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint64, euint128, ebool, externalEuint64, externalEbool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IERC7984} from "@openzeppelin/confidential-contracts/interfaces/IERC7984.sol";

/// @title ConfidentialMarket — encrypted bets, encrypted pools, K-anonymous public odds.
/// @notice Binary prediction market on Zama FHEVM. The amount and side of every
///         bet are encrypted on-chain. Aggregate odds are still public, but they
///         are released as DELAYED SNAPSHOTS gated by a K-anonymity threshold:
///         a snapshot can only be produced after at least `snapshotBatchK` new
///         bets have arrived, so an observer cannot diff pools across one bet
///         and attribute it to a wallet.
///
/// Privacy boundaries (matches the docs literally):
///   PUBLIC       — question/desc/category/deadline, market status, betCount,
///                  odds *as of last snapshot*, final outcome + final pools.
///   USER-PRIVATE — bet amount, bet side, per-wallet stakes, payout amount.
///   ANONYMOUS    — BetPlaced events carry no fields. Pool deltas across one
///                  bet are not observable on-chain (handles change every bet;
///                  ACL only opens at the snapshot trigger).
///
/// Collateral flow:
///   1) User wraps plain USDC → confidential cUSDC once. The wrap amount IS
///      public, but it is decoupled from per-bet amounts.
///   2) User authorizes the market as cUSDC operator.
///   3) placeBet() uses confidentialTransferFrom with an encrypted amount; the
///      wrapped balance moves confidentially, never as plaintext on-chain.
contract ConfidentialMarket is ZamaEthereumConfig {
    enum Status {
        Open,       // accepting encrypted bets
        Resolving,  // oracle has set outcome; awaiting public-decrypt of pools
        Resolved,   // pools finalized; users can claim
        Voided      // refunds open
    }

    // ─── Immutable / config ─────────────────────────────────────────────────
    IERC7984 public immutable cUsdc;
    address public immutable creator;
    address public immutable oracle;
    uint64 public immutable deadline;
    uint64 public immutable disputeWindow;
    /// @notice Minimum bets that must accumulate between odds-snapshots.
    /// Default 3 — a snapshot at t1 vs t2 only reveals an aggregate over ≥K bets,
    /// so an observer cannot tie any single tx to a wallet.
    uint8 public immutable snapshotBatchK;

    string public question;
    string public description;
    string public category;

    // ─── Public counters (NOT identifying) ──────────────────────────────────
    Status public status;
    bool public outcomeYes;
    uint256 public betCount;
    uint256 public lastSnapshotBetCount;
    uint64 public lastSnapshotAt;
    uint32 public snapshotCounter;

    // After resolution, the cleartext pools used for payout math.
    uint64 public yesPoolFinal;
    uint64 public noPoolFinal;

    // ─── Encrypted state ────────────────────────────────────────────────────
    euint64 private yesPoolEnc;
    euint64 private noPoolEnc;
    mapping(address => euint64) private userYesStake;
    mapping(address => euint64) private userNoStake;

    mapping(address => bool) public claimed;
    mapping(address => bool) public hasBet;

    // ─── Events ─────────────────────────────────────────────────────────────
    /// @notice Anonymous — emitted on every bet but carries no amount/side/who.
    /// Frontends use it as a "refresh" signal only.
    event BetPlaced();
    /// @notice The UI listens for this and calls publicDecrypt on the pool
    /// handles via the relayer to display refreshed odds.
    event OddsSnapshotReady(uint32 indexed snapshotId, uint256 betCountAtSnapshot);
    event MarketResolving(bool outcomeYes);
    event MarketResolved(bool outcomeYes, uint64 yesPool, uint64 noPool);
    event MarketVoided(string reason);
    event Claimed(address indexed user);
    /// @notice Anonymous — fired when a user exits a position pre-resolution.
    /// Carries no amount, no side, no address.
    event PositionClosed();

    // ─── Errors ─────────────────────────────────────────────────────────────
    error NotOpen();
    error PastDeadline();
    error BeforeDeadline();
    error NotOracle();
    error WrongStatus();
    error AlreadyClaimed();
    error NoPosition();
    error TooEarlyToVoid();
    error TooFewBetsSinceSnapshot();

    constructor(
        IERC7984 cUsdc_,
        address creator_,
        address oracle_,
        uint64 deadline_,
        uint64 disputeWindow_,
        uint8 snapshotBatchK_,
        string memory question_,
        string memory description_,
        string memory category_
    ) {
        require(address(cUsdc_) != address(0), "zero cUsdc");
        require(oracle_ != address(0), "zero oracle");
        require(deadline_ > block.timestamp, "deadline in past");
        require(snapshotBatchK_ >= 1, "k>=1");

        cUsdc = cUsdc_;
        creator = creator_;
        oracle = oracle_;
        deadline = deadline_;
        disputeWindow = disputeWindow_;
        snapshotBatchK = snapshotBatchK_;
        question = question_;
        description = description_;
        category = category_;

        status = Status.Open;
    }

    // ════════════════════════════════════════════════════════════════════════
    // BET — encrypted amount + encrypted side, no plaintext leaks
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Place a confidential bet. Caller must have wrapped USDC → cUSDC
    ///         and granted this market operator status on the wrapper.
    /// @param encAmount   external euint64 ciphertext for amount (6-dp USDC units)
    /// @param amountProof Zama input proof binding encAmount to msg.sender + this
    /// @param encSide     external ebool ciphertext (true = YES, false = NO)
    /// @param sideProof   Zama input proof for encSide
    function placeBet(
        externalEuint64 encAmount,
        bytes calldata amountProof,
        externalEbool encSide,
        bytes calldata sideProof
    ) external {
        if (status != Status.Open) revert NotOpen();
        if (block.timestamp >= deadline) revert PastDeadline();

        // 1. Bind external ciphertexts to this caller + contract (anti-replay).
        euint64 amount = FHE.fromExternal(encAmount, amountProof);
        ebool side = FHE.fromExternal(encSide, sideProof);

        // 2. Confidential pull from user's cUSDC balance. confidentialTransferFrom
        //    returns the encrypted ACTUAL amount transferred (it does NOT revert
        //    on insufficient balance; it moves min(amount, balance)). We credit
        //    pools with that returned value.
        FHE.allowTransient(amount, address(cUsdc));
        euint64 transferred = cUsdc.confidentialTransferFrom(msg.sender, address(this), amount);

        // 3. Split into yes/no via FHE.select — both branches evaluate, so
        //    calldata reveals nothing about which side was chosen.
        euint64 zero = FHE.asEuint64(uint64(0));
        euint64 yesPart = FHE.select(side, transferred, zero);
        euint64 noPart = FHE.select(side, zero, transferred);

        // 4. Accumulate pools. Each FHE.add returns a NEW ciphertext handle —
        //    a previous makePubliclyDecryptable ACL on the old handle does NOT
        //    carry over. That is exactly what gates the snapshot mechanism.
        yesPoolEnc = FHE.add(yesPoolEnc, yesPart);
        noPoolEnc = FHE.add(noPoolEnc, noPart);
        FHE.allowThis(yesPoolEnc);
        FHE.allowThis(noPoolEnc);

        // 5. Per-user stakes, ACL'd to the user so they can self-decrypt via EIP-712.
        userYesStake[msg.sender] = FHE.add(userYesStake[msg.sender], yesPart);
        userNoStake[msg.sender] = FHE.add(userNoStake[msg.sender], noPart);
        FHE.allowThis(userYesStake[msg.sender]);
        FHE.allowThis(userNoStake[msg.sender]);
        FHE.allow(userYesStake[msg.sender], msg.sender);
        FHE.allow(userNoStake[msg.sender], msg.sender);

        hasBet[msg.sender] = true;
        betCount++;
        emit BetPlaced();
    }

    // ════════════════════════════════════════════════════════════════════════
    // CASH OUT — exit a position before resolution, full stake refunded
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Withdraw your entire (encrypted) stake from this market before
    ///         it closes. Stake is subtracted from the encrypted pools and
    ///         confidentially transferred back to you in cUSDC. Pre-resolution
    ///         only; not allowed once the deadline has passed.
    /// @dev    No fee, no PnL — this is an early exit, not a secondary sale.
    ///         Public state changes (hasBet flips to false, betCount unchanged)
    ///         do not leak the cleared amount. Side is never disclosed.
    function cashOut() external {
        if (status != Status.Open) revert NotOpen();
        if (block.timestamp >= deadline) revert PastDeadline();
        if (!hasBet[msg.sender]) revert NoPosition();
        if (claimed[msg.sender]) revert AlreadyClaimed();

        euint64 yesStake = userYesStake[msg.sender];
        euint64 noStake = userNoStake[msg.sender];
        euint64 total = FHE.add(yesStake, noStake);

        // Subtract this user's encrypted stake from each encrypted pool. The
        // invariant (pool == sum of all user stakes) guarantees no underflow.
        yesPoolEnc = FHE.sub(yesPoolEnc, yesStake);
        noPoolEnc = FHE.sub(noPoolEnc, noStake);
        FHE.allowThis(yesPoolEnc);
        FHE.allowThis(noPoolEnc);

        // Zero this user's stakes so any future view reads return ciphertext-zero.
        euint64 zero = FHE.asEuint64(uint64(0));
        userYesStake[msg.sender] = zero;
        userNoStake[msg.sender] = zero;
        FHE.allowThis(userYesStake[msg.sender]);
        FHE.allowThis(userNoStake[msg.sender]);
        FHE.allow(userYesStake[msg.sender], msg.sender);
        FHE.allow(userNoStake[msg.sender], msg.sender);

        hasBet[msg.sender] = false;

        // Confidentially transfer the full stake back to the user.
        FHE.allowThis(total);
        FHE.allowTransient(total, address(cUsdc));
        cUsdc.confidentialTransfer(msg.sender, total);

        emit PositionClosed();
    }

    // ════════════════════════════════════════════════════════════════════════
    // ODDS SNAPSHOT — K-anonymous public reveal of the current pool sizes
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Mark the CURRENT pool ciphertexts publicly decryptable so the
    ///         relayer can serve cleartext odds. Gated by K-anonymity: at least
    ///         `snapshotBatchK` new bets must have arrived since the previous
    ///         snapshot. Permissionless (UI, indexer, or bot can call).
    function refreshOdds() external {
        if (status != Status.Open) revert NotOpen();
        if (block.timestamp >= deadline) revert PastDeadline();
        if (betCount - lastSnapshotBetCount < snapshotBatchK) revert TooFewBetsSinceSnapshot();

        FHE.makePubliclyDecryptable(yesPoolEnc);
        FHE.makePubliclyDecryptable(noPoolEnc);
        lastSnapshotBetCount = betCount;
        lastSnapshotAt = uint64(block.timestamp);
        unchecked { snapshotCounter++; }
        emit OddsSnapshotReady(snapshotCounter, betCount);
    }

    /// @notice Current YES pool ciphertext handle (relayer publicDecrypt target).
    function getYesPoolHandle() external view returns (bytes32) {
        return FHE.toBytes32(yesPoolEnc);
    }
    function getNoPoolHandle() external view returns (bytes32) {
        return FHE.toBytes32(noPoolEnc);
    }

    // ════════════════════════════════════════════════════════════════════════
    // RESOLUTION — two-phase: oracle picks outcome, then anyone finalizes pools
    // ════════════════════════════════════════════════════════════════════════

    function resolve(bool outcomeYes_) external {
        if (msg.sender != oracle) revert NotOracle();
        if (status != Status.Open) revert WrongStatus();
        if (block.timestamp < deadline) revert BeforeDeadline();

        outcomeYes = outcomeYes_;
        FHE.makePubliclyDecryptable(yesPoolEnc);
        FHE.makePubliclyDecryptable(noPoolEnc);
        status = Status.Resolving;
        emit MarketResolving(outcomeYes_);
    }

    /// @notice Permissionless finalize. Anyone fetches the cleartext pool values
    ///         from the Zama relayer along with a KMS proof, then submits them.
    function finalize(uint64 yesClear, uint64 noClear, bytes calldata decryptionProof) external {
        if (status != Status.Resolving) revert WrongStatus();

        bytes32[] memory handles = new bytes32[](2);
        handles[0] = FHE.toBytes32(yesPoolEnc);
        handles[1] = FHE.toBytes32(noPoolEnc);
        bytes memory cleartexts = abi.encode(yesClear, noClear);
        FHE.checkSignatures(handles, cleartexts, decryptionProof);

        yesPoolFinal = yesClear;
        noPoolFinal = noClear;

        uint64 winningPool = outcomeYes ? yesClear : noClear;
        if (winningPool == 0) {
            status = Status.Voided;
            emit MarketVoided("empty winning pool");
        } else {
            status = Status.Resolved;
            emit MarketResolved(outcomeYes, yesClear, noClear);
        }
    }

    /// @notice Emergency void if the oracle misses its window.
    function enableRefunds() external {
        if (status != Status.Open) revert WrongStatus();
        if (block.timestamp < deadline + disputeWindow) revert TooEarlyToVoid();
        status = Status.Voided;
        emit MarketVoided("oracle timeout");
    }

    // ════════════════════════════════════════════════════════════════════════
    // CLAIM — encrypted payout via confidentialTransfer
    // ════════════════════════════════════════════════════════════════════════

    function claim() external {
        if (claimed[msg.sender]) revert AlreadyClaimed();
        if (!hasBet[msg.sender]) revert NoPosition();

        euint64 payout;

        if (status == Status.Resolved) {
            // Widen to euint128 so winStake * totalPool can't overflow euint64.
            uint128 totalPool = uint128(yesPoolFinal) + uint128(noPoolFinal);
            uint128 winningPool = outcomeYes ? uint128(yesPoolFinal) : uint128(noPoolFinal);
            euint64 winStake64 = outcomeYes ? userYesStake[msg.sender] : userNoStake[msg.sender];
            euint128 winStake128 = FHE.asEuint128(winStake64);
            euint128 numer = FHE.mul(winStake128, totalPool);
            euint128 payout128 = FHE.div(numer, winningPool);
            payout = FHE.asEuint64(payout128);
        } else if (status == Status.Voided) {
            payout = FHE.add(userYesStake[msg.sender], userNoStake[msg.sender]);
        } else {
            revert WrongStatus();
        }

        claimed[msg.sender] = true;
        FHE.allowThis(payout);
        FHE.allowTransient(payout, address(cUsdc));
        cUsdc.confidentialTransfer(msg.sender, payout);

        emit Claimed(msg.sender);
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWS
    // ════════════════════════════════════════════════════════════════════════

    function getUserYesStake(address user) external view returns (euint64) {
        return userYesStake[user];
    }
    function getUserNoStake(address user) external view returns (euint64) {
        return userNoStake[user];
    }

    /// @notice Bets remaining until another odds-snapshot can be taken (0 = ready).
    function betsToNextSnapshot() external view returns (uint256) {
        uint256 since = betCount - lastSnapshotBetCount;
        return since >= snapshotBatchK ? 0 : (snapshotBatchK - since);
    }
}

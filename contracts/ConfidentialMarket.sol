// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, ebool, euint64, externalEuint64, externalEbool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IERC7984} from "@openzeppelin/confidential-contracts/interfaces/IERC7984.sol";

/// @title ConfidentialMarket
/// @notice A single binary prediction market where bet amounts and sides are
///         encrypted on-chain via Zama FHEVM. Pools are revealed only after the
///         market closes; individual positions remain encrypted forever and
///         payouts are decryptable only by the winner.
///
/// Lifecycle:
///   Open       → users place encrypted bets until `deadline`.
///   Resolving  → oracle picks YES/NO; pools made publicly decryptable.
///   Resolved   → cleartext pools landed via KMS proof; winners can claim.
///   Voided     → no bets on winning side OR oracle missed dispute window;
///                everyone refunds their full encrypted stake.
contract ConfidentialMarket is ZamaEthereumConfig {
    enum Status {
        Open,
        Resolving,
        Resolved,
        Voided
    }

    // ─── Immutable / config ─────────────────────────────────────────────────
    IERC7984 public immutable collateral;
    address public immutable creator;
    address public immutable oracle;
    uint64 public immutable deadline;
    uint64 public immutable disputeWindow;

    string public question;
    string public description;
    string public category;

    // ─── State ──────────────────────────────────────────────────────────────
    Status public status;
    bool public outcomeYes;
    uint64 public yesPoolClear;
    uint64 public noPoolClear;

    // Encrypted pools (during Open phase).
    euint64 private yesPool;
    euint64 private noPool;

    // Per-user encrypted stake on each side.
    mapping(address => euint64) private userYesStake;
    mapping(address => euint64) private userNoStake;

    mapping(address => bool) public claimed;
    mapping(address => bool) public hasBet;

    // ─── Events ─────────────────────────────────────────────────────────────
    event BetPlaced(address indexed bettor);
    event Resolved(bool outcomeYes, bytes32 yesHandle, bytes32 noHandle);
    event Finalized(uint64 yesPoolClear, uint64 noPoolClear);
    event Voided(string reason);
    event Claimed(address indexed bettor);

    // ─── Errors ─────────────────────────────────────────────────────────────
    error NotOpen();
    error PastDeadline();
    error BeforeDeadline();
    error NotOracle();
    error WrongStatus();
    error AlreadyClaimed();
    error NoPosition();
    error TooEarlyToVoid();

    constructor(
        IERC7984 collateral_,
        address creator_,
        address oracle_,
        uint64 deadline_,
        uint64 disputeWindow_,
        string memory question_,
        string memory description_,
        string memory category_
    ) {
        require(address(collateral_) != address(0), "zero collateral");
        require(oracle_ != address(0), "zero oracle");
        require(deadline_ > block.timestamp, "deadline in past");

        collateral = collateral_;
        creator = creator_;
        oracle = oracle_;
        deadline = deadline_;
        disputeWindow = disputeWindow_;
        question = question_;
        description = description_;
        category = category_;

        status = Status.Open;
    }

    // ════════════════════════════════════════════════════════════════════════
    // BETTING
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Place a confidential bet.
    /// @dev    Caller must first call `collateral.setOperator(market, expiry)`.
    ///         Both `encAmount` and `encSide` come from a single
    ///         `createEncryptedInput().add64(amount).addBool(side).encrypt()` call,
    ///         so they share one `inputProof`.
    function placeBet(
        externalEuint64 encAmount,
        externalEbool encSide,
        bytes calldata inputProof
    ) external {
        if (status != Status.Open) revert NotOpen();
        if (block.timestamp >= deadline) revert PastDeadline();

        euint64 amount = FHE.fromExternal(encAmount, inputProof);
        ebool side = FHE.fromExternal(encSide, inputProof);

        // Token contract internally does FHE.ge(balance, amount), so it needs
        // transient ACL on `amount`.
        FHE.allowTransient(amount, address(collateral));

        // Pull collateral. `transferred` == 0 if the user lacks funds — FHE
        // operations don't revert. We never know which side it went on.
        euint64 transferred = collateral.confidentialTransferFrom(msg.sender, address(this), amount);
        FHE.allowThis(transferred);

        euint64 yesPart = FHE.select(side, transferred, FHE.asEuint64(0));
        euint64 noPart = FHE.select(side, FHE.asEuint64(0), transferred);

        // Accumulate global pools.
        yesPool = FHE.add(yesPool, yesPart);
        noPool = FHE.add(noPool, noPart);
        FHE.allowThis(yesPool);
        FHE.allowThis(noPool);

        // Accumulate per-user stake on each side.
        userYesStake[msg.sender] = FHE.add(userYesStake[msg.sender], yesPart);
        userNoStake[msg.sender] = FHE.add(userNoStake[msg.sender], noPart);
        FHE.allowThis(userYesStake[msg.sender]);
        FHE.allowThis(userNoStake[msg.sender]);
        FHE.allow(userYesStake[msg.sender], msg.sender);
        FHE.allow(userNoStake[msg.sender], msg.sender);

        hasBet[msg.sender] = true;
        emit BetPlaced(msg.sender);
    }

    // ════════════════════════════════════════════════════════════════════════
    // RESOLUTION (two-phase: oracle marks → anyone finalizes with KMS proof)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Oracle records the outcome and marks pools as publicly decryptable.
    function resolve(bool outcomeYes_) external {
        if (msg.sender != oracle) revert NotOracle();
        if (status != Status.Open) revert WrongStatus();
        if (block.timestamp < deadline) revert BeforeDeadline();

        outcomeYes = outcomeYes_;
        status = Status.Resolving;

        FHE.makePubliclyDecryptable(yesPool);
        FHE.makePubliclyDecryptable(noPool);

        emit Resolved(outcomeYes_, FHE.toBytes32(yesPool), FHE.toBytes32(noPool));
    }

    /// @notice Anyone can complete resolution by supplying the KMS-signed
    ///         cleartext pools obtained from the relayer.
    function finalize(
        uint64 yesPoolClear_,
        uint64 noPoolClear_,
        bytes calldata decryptionProof
    ) external {
        if (status != Status.Resolving) revert WrongStatus();

        bytes32[] memory handles = new bytes32[](2);
        handles[0] = FHE.toBytes32(yesPool);
        handles[1] = FHE.toBytes32(noPool);
        bytes memory cleartexts = abi.encode(yesPoolClear_, noPoolClear_);
        FHE.checkSignatures(handles, cleartexts, decryptionProof);

        yesPoolClear = yesPoolClear_;
        noPoolClear = noPoolClear_;

        uint64 winningPool = outcomeYes ? yesPoolClear_ : noPoolClear_;
        if (winningPool == 0) {
            status = Status.Voided;
            emit Voided("empty winning pool");
        } else {
            status = Status.Resolved;
            emit Finalized(yesPoolClear_, noPoolClear_);
        }
    }

    /// @notice Emergency void: if oracle never resolves within the dispute
    ///         window, anyone can void the market so users can recover stakes.
    function enableRefunds() external {
        if (status != Status.Open) revert WrongStatus();
        if (block.timestamp < deadline + disputeWindow) revert TooEarlyToVoid();

        status = Status.Voided;
        emit Voided("oracle timeout");
    }

    // ════════════════════════════════════════════════════════════════════════
    // CLAIM
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Claim winnings (or refund if voided). Payout is paid in
    ///         confidential tokens — only the claimer can decrypt it.
    function claim() external {
        if (claimed[msg.sender]) revert AlreadyClaimed();
        if (!hasBet[msg.sender]) revert NoPosition();

        euint64 payout;

        if (status == Status.Resolved) {
            // Winning stake × totalPool ÷ winningPool. div requires plaintext
            // divisor, which is exactly why we revealed the pools first.
            uint64 totalPool = yesPoolClear + noPoolClear;
            uint64 winningPool = outcomeYes ? yesPoolClear : noPoolClear;
            euint64 winningStake = outcomeYes ? userYesStake[msg.sender] : userNoStake[msg.sender];

            // payout = winningStake * totalPool / winningPool
            euint64 numerator = FHE.mul(winningStake, totalPool);
            payout = FHE.div(numerator, winningPool);
        } else if (status == Status.Voided) {
            // Refund full stake regardless of which side it was on.
            payout = FHE.add(userYesStake[msg.sender], userNoStake[msg.sender]);
        } else {
            revert WrongStatus();
        }

        claimed[msg.sender] = true;
        FHE.allowThis(payout);
        FHE.allowTransient(payout, address(collateral));

        // Pay out. Recipient gains ACL on the transferred amount.
        collateral.confidentialTransfer(msg.sender, payout);

        emit Claimed(msg.sender);
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWS
    // ════════════════════════════════════════════════════════════════════════

    function getYesPool() external view returns (euint64) {
        return yesPool;
    }

    function getNoPool() external view returns (euint64) {
        return noPool;
    }

    function getUserYesStake(address user) external view returns (euint64) {
        return userYesStake[user];
    }

    function getUserNoStake(address user) external view returns (euint64) {
        return userNoStake[user];
    }
}

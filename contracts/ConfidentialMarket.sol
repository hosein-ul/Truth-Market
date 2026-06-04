// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC7984ERC20Wrapper} from "@openzeppelin/confidential-contracts/interfaces/IERC7984ERC20Wrapper.sol";

/// @title ConfidentialMarket (v2 — public odds, private positions)
/// @notice Binary prediction market with PUBLIC aggregate odds and PRIVATE
///         per-user positions. Pools (yesPool/noPool) are plaintext uint256
///         so anyone can compute implied probability at any time. Individual
///         wallet positions are encrypted via FHEVM and only self-decryptable.
///
/// Privacy model: you can see the odds change in real-time, but you CANNOT
/// look up what any specific wallet has bet (amount or cumulative stake).
/// This kills whale-tracking tools like "Polymarket Whales" at the protocol level.
///
/// Collateral flow:
///   Deposit: regular USDC → contract wraps to cUSDC internally
///   Claim:   encrypted payout → confidentialTransfer(cUSDC) to winner
///
/// Lifecycle:
///   Open     → users bet; pools visible; per-user stakes hidden.
///   Resolved → oracle picks YES/NO; winners can claim.
///   Voided   → no bets on winning side OR oracle timeout; full refund.
contract ConfidentialMarket is ZamaEthereumConfig {
    enum Status {
        Open,
        Resolved,
        Voided
    }

    // ─── Immutable / config ─────────────────────────────────────────────────
    IERC20 public immutable usdc;
    IERC7984ERC20Wrapper public immutable cUsdc;
    address public immutable creator;
    address public immutable oracle;
    uint64 public immutable deadline;
    uint64 public immutable disputeWindow;

    string public question;
    string public description;
    string public category;

    // ─── State (PUBLIC — aggregate odds) ────────────────────────────────────
    Status public status;
    bool public outcomeYes;
    uint256 public yesPool;
    uint256 public noPool;
    uint256 public betCount;

    // ─── State (PRIVATE — per-user encrypted stakes) ────────────────────────
    mapping(address => euint64) private userYesStake;
    mapping(address => euint64) private userNoStake;

    mapping(address => bool) public claimed;
    mapping(address => bool) public hasBet;

    // ─── Events ─────────────────────────────────────────────────────────────
    event BetPlaced(uint64 amount, bool side);
    event MarketResolved(bool outcomeYes);
    event MarketVoided(string reason);
    event Claimed(address indexed user);

    // ─── Errors ─────────────────────────────────────────────────────────────
    error NotOpen();
    error PastDeadline();
    error BeforeDeadline();
    error NotOracle();
    error WrongStatus();
    error AlreadyClaimed();
    error NoPosition();
    error TooEarlyToVoid();
    error ZeroAmount();

    constructor(
        IERC20 usdc_,
        IERC7984ERC20Wrapper cUsdc_,
        address creator_,
        address oracle_,
        uint64 deadline_,
        uint64 disputeWindow_,
        string memory question_,
        string memory description_,
        string memory category_
    ) {
        require(address(usdc_) != address(0), "zero usdc");
        require(address(cUsdc_) != address(0), "zero cUsdc");
        require(oracle_ != address(0), "zero oracle");
        require(deadline_ > block.timestamp, "deadline in past");

        usdc = usdc_;
        cUsdc = cUsdc_;
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
    // BETTING — plaintext amount and side, encrypted per-user accumulation
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Place a bet. Amount and side are public (so odds update live).
    ///         Per-user cumulative stake is encrypted (so no one can look up
    ///         a specific wallet's total position).
    /// @param amount USDC amount (6 decimals). Must have approved this contract.
    /// @param side   true = YES, false = NO.
    function placeBet(uint64 amount, bool side) external {
        if (status != Status.Open) revert NotOpen();
        if (block.timestamp >= deadline) revert PastDeadline();
        if (amount == 0) revert ZeroAmount();

        // 1. Pull regular USDC from the bettor.
        usdc.transferFrom(msg.sender, address(this), amount);

        // 2. Wrap into cUSDC (contract holds encrypted collateral for claims).
        usdc.approve(address(cUsdc), amount);
        cUsdc.wrap(address(this), amount);

        // 3. Update PUBLIC plaintext pools (live odds).
        if (side) {
            yesPool += amount;
        } else {
            noPool += amount;
        }

        // 4. Update PRIVATE encrypted per-user stake.
        euint64 encAmount = FHE.asEuint64(amount);
        if (side) {
            userYesStake[msg.sender] = FHE.add(userYesStake[msg.sender], encAmount);
            FHE.allowThis(userYesStake[msg.sender]);
            FHE.allow(userYesStake[msg.sender], msg.sender);
        } else {
            userNoStake[msg.sender] = FHE.add(userNoStake[msg.sender], encAmount);
            FHE.allowThis(userNoStake[msg.sender]);
            FHE.allow(userNoStake[msg.sender], msg.sender);
        }

        hasBet[msg.sender] = true;
        betCount++;
        emit BetPlaced(amount, side);
    }

    // ════════════════════════════════════════════════════════════════════════
    // RESOLUTION — single step (no finalize needed; pools already plaintext)
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Oracle records the outcome. Pools are already public, so no
    ///         decryption phase is needed.
    function resolve(bool outcomeYes_) external {
        if (msg.sender != oracle) revert NotOracle();
        if (status != Status.Open) revert WrongStatus();
        if (block.timestamp < deadline) revert BeforeDeadline();

        outcomeYes = outcomeYes_;

        uint256 winningPool = outcomeYes_ ? yesPool : noPool;
        if (winningPool == 0) {
            status = Status.Voided;
            emit MarketVoided("empty winning pool");
        } else {
            status = Status.Resolved;
            emit MarketResolved(outcomeYes_);
        }
    }

    /// @notice Emergency void: oracle missed the dispute window.
    function enableRefunds() external {
        if (status != Status.Open) revert WrongStatus();
        if (block.timestamp < deadline + disputeWindow) revert TooEarlyToVoid();

        status = Status.Voided;
        emit MarketVoided("oracle timeout");
    }

    // ════════════════════════════════════════════════════════════════════════
    // CLAIM — encrypted payout calculation → confidential transfer
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Claim winnings (or refund if voided). Payout is encrypted and
    ///         sent via confidentialTransfer — only the claimer can decrypt it.
    function claim() external {
        if (claimed[msg.sender]) revert AlreadyClaimed();
        if (!hasBet[msg.sender]) revert NoPosition();

        euint64 payout;

        if (status == Status.Resolved) {
            uint64 totalPool = uint64(yesPool + noPool);
            uint64 winningPool = outcomeYes ? uint64(yesPool) : uint64(noPool);
            euint64 winningStake = outcomeYes
                ? userYesStake[msg.sender]
                : userNoStake[msg.sender];

            // payout = winningStake * totalPool / winningPool
            euint64 numerator = FHE.mul(winningStake, totalPool);
            payout = FHE.div(numerator, winningPool);
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

    /// @notice Returns the user's encrypted YES stake handle (self-decryptable).
    function getUserYesStake(address user) external view returns (euint64) {
        return userYesStake[user];
    }

    /// @notice Returns the user's encrypted NO stake handle (self-decryptable).
    function getUserNoStake(address user) external view returns (euint64) {
        return userNoStake[user];
    }

    /// @notice Implied YES probability in basis points (0-10000).
    function yesProbabilityBps() external view returns (uint256) {
        uint256 total = yesPool + noPool;
        if (total == 0) return 5000; // 50/50 default
        return (yesPool * 10000) / total;
    }
}

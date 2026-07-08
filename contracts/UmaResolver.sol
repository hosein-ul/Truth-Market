// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

import {FinderInterface} from "./uma/interfaces/FinderInterface.sol";
import {OptimisticOracleV3Interface} from "./uma/interfaces/OptimisticOracleV3Interface.sol";
import {OptimisticOracleV3CallbackRecipientInterface} from
    "./uma/interfaces/OptimisticOracleV3CallbackRecipientInterface.sol";

/// @dev The slice of `ConfidentialMarket` this resolver drives. The resolver is
///      installed as a market's `oracle`, so it is the only address allowed to
///      call `resolve(bool)`. `status()` returns the Status enum (Open == 0).
interface IResolvableMarket {
    function resolve(bool outcomeYes) external;
    function question() external view returns (string memory);
    function deadline() external view returns (uint64);
    function status() external view returns (uint8);
    function oracle() external view returns (address);
}

/// @title UmaResolver — UMA Optimistic Oracle V3 adapter for TruthMarket.
/// @notice Optimistic-oracle resolution layer for `ConfidentialMarket`. The
///         resolver is set as a market's `oracle`. After a market's deadline,
///         anyone may *assert* its YES/NO outcome here by posting a bond. The
///         assertion goes to UMA's real OptimisticOracleV3 on Sepolia. If nobody
///         disputes it within the liveness window, settlement triggers
///         `assertionResolvedCallback`, which calls `market.resolve(outcome)` —
///         moving the market into its `Resolving` phase exactly as a trusted EOA
///         oracle would have, but now backed by UMA's economic-security game.
///
///         Pattern follows UMA's official "Prediction Market" tutorial:
///         constructor reads `finder` + OOV3 + `defaultCurrency`; outcomes are
///         asserted with `assertTruth`; resolution arrives via the callback.
///
/// @dev    SEPOLIA / DVM CAVEAT: UMA's Data Verification Mechanism (the dispute
///         voting layer) is NOT live on Sepolia. The happy path
///         (assert → liveness → settle, no dispute) is fully real. But if an
///         assertion IS disputed, there is no on-chain DVM to adjudicate it to a
///         final truth on testnet. This resolver therefore treats a disputed
///         assertion as "unresolved": the market stays Open and the outcome can
///         be re-asserted. See README for details.
contract UmaResolver is OptimisticOracleV3CallbackRecipientInterface {
    using SafeERC20 for IERC20;

    // ─── UMA wiring (resolved from the Finder, never hardcoded) ──────────────
    FinderInterface public immutable finder;
    OptimisticOracleV3Interface public immutable oo;
    /// @notice UMA-whitelisted bond currency (the oracle's own default).
    IERC20 public immutable currency;
    /// @notice DVM price-request identifier used if an assertion is disputed.
    bytes32 public immutable identifier;

    /// @dev Finder key for the live OOV3 implementation (UMA `OracleInterfaces`).
    bytes32 private constant OOV3_INTERFACE = "OptimisticOracleV3";

    // ─── Configurable economic parameters (NOT hardcoded) ────────────────────
    address public owner;
    /// @notice Seconds an assertion can be disputed before it can settle.
    uint64 public liveness;
    /// @notice Bond floor. Effective bond = max(bondAmount, OOV3 minimum bond).
    uint256 public bondAmount;

    // ─── Assertion bookkeeping ───────────────────────────────────────────────
    struct AssertedMarket {
        address asserter; // who posted the bond (receives it back on settlement)
        address market; // the ConfidentialMarket being resolved
        bool outcomeYes; // the asserted outcome
        bool resolved; // guard against a double resolve
    }

    /// @notice assertionId → asserted market data.
    mapping(bytes32 => AssertedMarket) public assertions;
    /// @notice market → its currently-pending assertionId (0 if none / cleared).
    mapping(address => bytes32) public marketAssertion;

    // ─── Events ──────────────────────────────────────────────────────────────
    event MarketAsserted(
        address indexed market, bool outcomeYes, bytes32 indexed assertionId, address indexed asserter, uint256 bond
    );
    event MarketResolvedViaUma(address indexed market, bool outcomeYes, bytes32 indexed assertionId);
    event AssertionFailed(address indexed market, bytes32 indexed assertionId);
    event AssertionDisputedEvent(address indexed market, bytes32 indexed assertionId);
    event ParamsUpdated(uint64 liveness, uint256 bondAmount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ─── Errors ──────────────────────────────────────────────────────────────
    error NotOwner();
    error NotOracleCaller();
    error AdapterNotMarketOracle();
    error MarketNotOpen();
    error BeforeDeadline();
    error AssertionPending();
    error UnknownAssertion();
    error AlreadyResolved();
    error ZeroAddress();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    /// @param finder_   UMA Finder on the target chain (Sepolia). The OOV3 and its
    ///                  default currency are read FROM it — addresses stay current
    ///                  even if UMA upgrades the oracle.
    /// @param liveness_ Dispute window in seconds. Pass 0 to inherit OOV3's default.
    /// @param bondAmount_ Bond floor in the default currency's smallest unit. The
    ///                  effective bond is raised to the OOV3 minimum if this is lower.
    constructor(address finder_, uint64 liveness_, uint256 bondAmount_) {
        if (finder_ == address(0)) revert ZeroAddress();
        finder = FinderInterface(finder_);

        OptimisticOracleV3Interface oo_ =
            OptimisticOracleV3Interface(finder.getImplementationAddress(OOV3_INTERFACE));
        if (address(oo_) == address(0)) revert ZeroAddress();
        oo = oo_;

        currency = oo_.defaultCurrency();
        identifier = oo_.defaultIdentifier();

        owner = msg.sender;
        liveness = liveness_ == 0 ? oo_.defaultLiveness() : liveness_;
        bondAmount = bondAmount_;

        emit OwnershipTransferred(address(0), msg.sender);
        emit ParamsUpdated(liveness, bondAmount_);
    }

    // ════════════════════════════════════════════════════════════════════════
    // ASSERT — post a bond and claim a market's outcome to UMA
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Assert the YES/NO outcome of a closed market. Permissionless: the
    ///         caller posts the bond and is refunded it on honest settlement.
    /// @dev    Caller must `approve` this resolver to pull `effectiveBond()` of the
    ///         bond `currency` first. The resolver escrows the bond and forwards
    ///         it to OOV3, naming the caller as `asserter` so UMA returns it to
    ///         them directly at settlement.
    /// @param market      ConfidentialMarket whose outcome is being asserted.
    /// @param outcomeYes  true = YES won, false = NO won.
    /// @return assertionId UMA assertion id (also used to settle later).
    function assertMarketOutcome(address market, bool outcomeYes) external returns (bytes32 assertionId) {
        IResolvableMarket m = IResolvableMarket(market);

        if (m.oracle() != address(this)) revert AdapterNotMarketOracle();
        if (m.status() != 0) revert MarketNotOpen(); // Status.Open == 0
        if (block.timestamp < m.deadline()) revert BeforeDeadline();
        if (marketAssertion[market] != bytes32(0)) revert AssertionPending();

        uint256 bond = effectiveBond();

        // Escrow the bond from the asserter, then let OOV3 pull it.
        currency.safeTransferFrom(msg.sender, address(this), bond);
        currency.forceApprove(address(oo), bond);

        bytes memory claim = _composeClaim(market, m.question(), outcomeYes, block.timestamp);

        assertionId = oo.assertTruth(
            claim,
            msg.sender, // asserter — receives the bond back at settlement
            address(this), // callbackRecipient — this resolver
            address(0), // no escalation manager
            liveness,
            currency,
            bond,
            identifier,
            bytes32(0) // no domain
        );

        assertions[assertionId] =
            AssertedMarket({asserter: msg.sender, market: market, outcomeYes: outcomeYes, resolved: false});
        marketAssertion[market] = assertionId;

        emit MarketAsserted(market, outcomeYes, assertionId, msg.sender, bond);
    }

    /// @notice Convenience pass-through to settle an assertion after its liveness
    ///         window. Anyone can call. Triggers `assertionResolvedCallback`.
    function settleAssertion(bytes32 assertionId) external {
        oo.settleAssertion(assertionId);
    }

    // ════════════════════════════════════════════════════════════════════════
    // CALLBACKS — only the OptimisticOracleV3 may call these
    // ════════════════════════════════════════════════════════════════════════

    /// @inheritdoc OptimisticOracleV3CallbackRecipientInterface
    /// @dev On `assertedTruthfully` we resolve the market. Otherwise the assertion
    ///      was disputed and ruled false: clear it so the outcome can be re-asserted.
    function assertionResolvedCallback(bytes32 assertionId, bool assertedTruthfully) external override {
        if (msg.sender != address(oo)) revert NotOracleCaller();

        AssertedMarket storage a = assertions[assertionId];
        if (a.market == address(0)) revert UnknownAssertion();
        if (a.resolved) revert AlreadyResolved();

        if (assertedTruthfully) {
            a.resolved = true;
            IResolvableMarket(a.market).resolve(a.outcomeYes);
            emit MarketResolvedViaUma(a.market, a.outcomeYes, assertionId);
        } else {
            address market = a.market;
            delete marketAssertion[market];
            delete assertions[assertionId];
            emit AssertionFailed(market, assertionId);
        }
    }

    /// @inheritdoc OptimisticOracleV3CallbackRecipientInterface
    /// @dev A dispute escalates to UMA's DVM. On Sepolia the DVM is not live, so a
    ///      disputed assertion cannot reach a real final resolution; we only record
    ///      it. The market stays Open and may be re-asserted once the (failed)
    ///      assertion settles.
    function assertionDisputedCallback(bytes32 assertionId) external override {
        if (msg.sender != address(oo)) revert NotOracleCaller();
        emit AssertionDisputedEvent(assertions[assertionId].market, assertionId);
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEWS / ADMIN
    // ════════════════════════════════════════════════════════════════════════

    /// @notice Bond actually required: the larger of the configured floor and the
    ///         live OOV3 minimum for the bond currency.
    function effectiveBond() public view returns (uint256) {
        uint256 minBond = oo.getMinimumBond(address(currency));
        return bondAmount > minBond ? bondAmount : minBond;
    }

    /// @notice Update the dispute window and/or bond floor. Pass liveness 0 to keep
    ///         the current value.
    function setParams(uint64 liveness_, uint256 bondAmount_) external onlyOwner {
        if (liveness_ != 0) liveness = liveness_;
        bondAmount = bondAmount_;
        emit ParamsUpdated(liveness, bondAmount_);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ─── internal ────────────────────────────────────────────────────────────

    /// @dev Human-readable claim disputers can evaluate. Includes the market
    ///      address + assertion timestamp so the statement is unambiguous.
    function _composeClaim(address market, string memory question, bool outcomeYes, uint256 timestamp)
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodePacked(
            "As of assertion timestamp ",
            Strings.toString(timestamp),
            ", the resolved outcome of TruthMarket prediction market ",
            Strings.toHexString(market),
            ' asking "',
            question,
            '" is: ',
            outcomeYes ? "YES" : "NO"
        );
    }
}

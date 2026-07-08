// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

// Vendored from UMAprotocol/protocol
//   packages/core/contracts/optimistic-oracle-v3/interfaces/OptimisticOracleV3Interface.sol
//
// Trimmed to the surface TruthMarket's resolver needs, PLUS two getters that the
// published interface omits but the deployed implementation exposes as public
// state variables: defaultCurrency() and defaultLiveness(). We use them so the
// resolver can read UMA's own bond currency / liveness defaults at deploy time.

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Optimistic Oracle V3 Interface that callers must use to assert truths about the world.
 */
interface OptimisticOracleV3Interface {
    // Struct for storing properties and lifecycle of an assertion.
    struct Assertion {
        // EscalationManagerSettings flattened away — not used by this integration.
        address asserter; // Address of the asserter.
        uint64 assertionTime; // Time of the assertion.
        bool settled; // True if the request is settled.
        IERC20 currency; // ERC20 token used to pay rewards and fees.
        uint64 expirationTime; // Unix timestamp when the assertion can no longer be disputed.
        bool settlementResolution; // Resolution of the assertion (false till resolved).
        bytes32 domainId;
        bytes32 identifier;
        uint256 bond;
        address callbackRecipient;
        address disputer;
    }

    /**
     * @notice Asserts a truth about the world, using a fully custom configuration.
     * @dev The caller must approve this contract to spend at least bond amount of currency.
     */
    function assertTruth(
        bytes memory claim,
        address asserter,
        address callbackRecipient,
        address escalationManager,
        uint64 liveness,
        IERC20 currency,
        uint256 bond,
        bytes32 identifier,
        bytes32 domainId
    ) external returns (bytes32);

    /**
     * @notice Resolves an assertion. If undisputed, resolves as true and returns the bond to the asserter.
     *         If disputed, resolution depends on the oracle (DVM) result.
     */
    function settleAssertion(bytes32 assertionId) external;

    /**
     * @notice Settles an assertion and returns the resolution.
     */
    function settleAndGetAssertionResult(bytes32 assertionId) external returns (bool);

    /**
     * @notice Fetches the resolution of a settled assertion. Reverts if not settled.
     */
    function getAssertionResult(bytes32 assertionId) external view returns (bool);

    /**
     * @notice Fetches information about a specific assertion.
     */
    function getAssertion(bytes32 assertionId) external view returns (Assertion memory);

    /**
     * @notice Returns the default identifier used by the Optimistic Oracle V3.
     */
    function defaultIdentifier() external view returns (bytes32);

    /**
     * @notice Returns the minimum bond amount required to make an assertion in `currency`.
     */
    function getMinimumBond(address currency) external view returns (uint256);

    // ── Public state-variable getters on the implementation (not in the canonical
    //    interface, but present on-chain). Used to inherit UMA's own defaults. ──

    /// @notice Default bond currency configured on the oracle.
    function defaultCurrency() external view returns (IERC20);

    /// @notice Default dispute window (seconds) configured on the oracle.
    function defaultLiveness() external view returns (uint64);

    event AssertionMade(
        bytes32 indexed assertionId,
        bytes32 domainId,
        bytes claim,
        address indexed asserter,
        address callbackRecipient,
        address escalationManager,
        address caller,
        uint64 expirationTime,
        IERC20 currency,
        uint256 bond,
        bytes32 indexed identifier
    );

    event AssertionDisputed(bytes32 indexed assertionId, address indexed caller, address indexed disputer);

    event AssertionSettled(
        bytes32 indexed assertionId,
        address indexed bondRecipient,
        bool disputed,
        bool settlementResolution,
        address settleCaller
    );
}

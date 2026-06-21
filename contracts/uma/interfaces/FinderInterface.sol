// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

// Vendored from UMAprotocol/protocol
//   packages/core/contracts/data-verification-mechanism/interfaces/FinderInterface.sol
// The Finder is UMA's stable on-chain registry: given an interface name it
// returns the address of the live contract implementing it. We read the current
// OptimisticOracleV3 address from it at deploy time instead of hardcoding it.

/**
 * @title Provides addresses of the live contracts implementing certain interfaces.
 * @dev Examples are the Oracle or Store interfaces.
 */
interface FinderInterface {
    /**
     * @notice Updates the address of the contract that implements `interfaceName`.
     */
    function changeImplementationAddress(bytes32 interfaceName, address implementationAddress) external;

    /**
     * @notice Gets the address of the contract that implements the given `interfaceName`.
     * @param interfaceName queried interface.
     * @return implementationAddress address of the deployed contract that implements the interface.
     */
    function getImplementationAddress(bytes32 interfaceName) external view returns (address);
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockUSDC - 6-decimal mintable ERC20 used as the public on-ramp asset.
/// @notice This token is the *only* thing TruthMarket users perceive. The confidential
///         wrapping (ERC7984) layer is hidden by the contract & UI.
contract MockUSDC is ERC20 {
    uint8 private constant _DECIMALS = 6;

    constructor() ERC20("Mock USDC", "USDC") {}

    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }

    /// @notice Public faucet for the testnet. Anyone can mint themselves test USDC.
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

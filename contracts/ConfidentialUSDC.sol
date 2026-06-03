// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {euint64} from "@fhevm/solidity/lib/FHE.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IERC7984} from "@openzeppelin/confidential-contracts/interfaces/IERC7984.sol";
import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
import {ERC7984ERC20Wrapper} from "@openzeppelin/confidential-contracts/token/ERC7984/extensions/ERC7984ERC20Wrapper.sol";

/// @title ConfidentialUSDC - encrypted ERC7984 wrapper around MockUSDC.
/// @dev    Implementation detail. End users never see or hear about this token.
///         The TruthMarket UI exposes only "Deposit/Withdraw USDC", which under
///         the hood calls `wrap()` / `unwrap()` here. Bets are always taken from
///         the confidential side, keeping amounts and positions encrypted.
contract ConfidentialUSDC is ERC7984, ERC7984ERC20Wrapper, ZamaEthereumConfig {
    constructor(
        IERC20 underlying_
    )
        ERC7984("Confidential USDC", "cUSDC", "")
        ERC7984ERC20Wrapper(underlying_)
    {}

    function decimals() public view override(ERC7984, ERC7984ERC20Wrapper) returns (uint8) {
        return ERC7984ERC20Wrapper.decimals();
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC7984, ERC7984ERC20Wrapper) returns (bool) {
        return ERC7984ERC20Wrapper.supportsInterface(interfaceId);
    }

    function _update(
        address from,
        address to,
        euint64 amount
    ) internal override(ERC7984, ERC7984ERC20Wrapper) returns (euint64) {
        return ERC7984ERC20Wrapper._update(from, to, amount);
    }
}

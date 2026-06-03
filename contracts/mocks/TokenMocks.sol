// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

// ─────────────────────────────────────────────────────────────────────────────
// TEST FIXTURES ONLY — NOT part of the deployed protocol.
//
// On Sepolia, TruthMarket uses Zama's official confidential tokens:
//   underlying USDC : 0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF
//   cUSDCMock wrapper: 0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639
//
// Those tokens only exist on Sepolia. The local FHEVM mock network (chainId
// 31337) used by the test suite has no such contracts, so these minimal
// stand-ins reproduce the exact same interfaces (a mintable 6-dp ERC20 and an
// ERC7984ERC20Wrapper) purely so tests can run offline. They are never
// deployed to a live network.
// ─────────────────────────────────────────────────────────────────────────────

import {euint64} from "@fhevm/solidity/lib/FHE.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
import {ERC7984ERC20Wrapper} from "@openzeppelin/confidential-contracts/token/ERC7984/extensions/ERC7984ERC20Wrapper.sol";

/// @dev Local stand-in for Zama's underlying USDC mock (mint(address,uint256), 6 dp).
contract ERC20Mintable is ERC20 {
    uint8 private constant _DECIMALS = 6;

    constructor() ERC20("USD Coin (mock)", "USDC") {}

    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/// @dev Local stand-in for Zama's cUSDCMock confidential wrapper.
contract ConfidentialWrapperMock is ERC7984, ERC7984ERC20Wrapper, ZamaEthereumConfig {
    constructor(
        IERC20 underlying_
    ) ERC7984("Confidential USD Coin (mock)", "cUSDCMock", "") ERC7984ERC20Wrapper(underlying_) {}

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

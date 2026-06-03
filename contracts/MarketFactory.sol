// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {IERC7984} from "@openzeppelin/confidential-contracts/interfaces/IERC7984.sol";
import {ConfidentialMarket} from "./ConfidentialMarket.sol";

/// @title MarketFactory - deploys ConfidentialMarket instances and indexes them.
/// @dev    Anyone can create a market. The factory is the canonical registry
///         the frontend reads to render the market feed.
contract MarketFactory {
    IERC7984 public immutable collateral;
    uint64 public defaultDisputeWindow = 7 days;

    struct MarketInfo {
        address market;
        address creator;
        address oracle;
        uint64 deadline;
        string question;
        string category;
    }

    MarketInfo[] private _markets;
    mapping(address => uint256) public marketIndex; // 1-based; 0 means unknown

    event MarketCreated(
        uint256 indexed id,
        address indexed market,
        address indexed creator,
        address oracle,
        uint64 deadline,
        string question,
        string category
    );

    constructor(IERC7984 collateral_) {
        require(address(collateral_) != address(0), "zero collateral");
        collateral = collateral_;
    }

    function createMarket(
        address oracle,
        uint64 deadline,
        string calldata question,
        string calldata description,
        string calldata category
    ) external returns (address market) {
        ConfidentialMarket m = new ConfidentialMarket(
            collateral,
            msg.sender,
            oracle,
            deadline,
            defaultDisputeWindow,
            question,
            description,
            category
        );
        market = address(m);

        _markets.push(
            MarketInfo({
                market: market,
                creator: msg.sender,
                oracle: oracle,
                deadline: deadline,
                question: question,
                category: category
            })
        );
        marketIndex[market] = _markets.length;

        emit MarketCreated(_markets.length - 1, market, msg.sender, oracle, deadline, question, category);
    }

    function marketsLength() external view returns (uint256) {
        return _markets.length;
    }

    function getMarket(uint256 id) external view returns (MarketInfo memory) {
        return _markets[id];
    }

    /// @notice Paginated market list. Returns markets[offset .. offset+limit).
    function listMarkets(uint256 offset, uint256 limit) external view returns (MarketInfo[] memory page) {
        uint256 total = _markets.length;
        if (offset >= total) return new MarketInfo[](0);
        uint256 end = offset + limit;
        if (end > total) end = total;
        page = new MarketInfo[](end - offset);
        for (uint256 i = offset; i < end; ++i) {
            page[i - offset] = _markets[i];
        }
    }
}

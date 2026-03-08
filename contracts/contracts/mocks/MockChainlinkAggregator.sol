// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @dev Chainlink aggregator mock for testing.
contract MockChainlinkAggregator {
    int256 private _price;
    uint8  private _decimals;
    uint256 private _updatedAt;

    constructor(int256 price, uint8 dec) {
        _price     = price;
        _decimals  = dec;
        _updatedAt = block.timestamp;
    }

    function setPrice(int256 price) external {
        _price     = price;
        _updatedAt = block.timestamp;
    }

    function setUpdatedAt(uint256 ts) external {
        _updatedAt = ts;
    }

    function decimals() external view returns (uint8) {
        return _decimals;
    }

    function description() external pure returns (string memory) {
        return "Mock Aggregator";
    }

    function version() external pure returns (uint256) {
        return 1;
    }

    function latestRoundData()
        external
        view
        returns (uint80, int256, uint256, uint256, uint80)
    {
        return (1, _price, block.timestamp, _updatedAt, 1);
    }
}

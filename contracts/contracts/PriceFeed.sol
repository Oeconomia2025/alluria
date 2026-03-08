// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IAggregatorV3.sol";

/// @title PriceFeed — Chainlink + fallback oracle for Alluria collateral pricing
/// @notice Returns USD prices with 18-decimal precision. Rejects stale prices
///         older than 1 hour. Supports a manual fallback oracle for assets
///         without reliable Chainlink coverage (e.g. WTAO).
contract PriceFeed is Ownable2Step, Pausable {

    // ──────────────────────────────── Constants ─────────────────────────────

    uint256 public constant PRICE_PRECISION = 1e18;
    uint256 public constant STALENESS_THRESHOLD = 1 hours;
    uint256 public constant MAX_PRICE_DEVIATION = 5000; // 50% max deviation between updates

    // ──────────────────────────────── Types ─────────────────────────────────

    struct OracleConfig {
        IAggregatorV3 chainlinkFeed;   // address(0) if no Chainlink
        uint256       manualPrice;     // fallback price (18 decimals)
        uint256       manualUpdatedAt; // timestamp of last manual update
        bool          useManual;       // true = manual-only asset
        bool          exists;
    }

    // ──────────────────────────────── State ─────────────────────────────────

    mapping(address => OracleConfig) public oracles;

    // ──────────────────────────────── Events ────────────────────────────────

    event OracleSet(address indexed collateral, address chainlinkFeed, bool useManual);
    event ManualPriceUpdated(address indexed collateral, uint256 price, uint256 timestamp);

    // ──────────────────────────────── Errors ────────────────────────────────

    error OracleNotSet();
    error StalePrice();
    error InvalidPrice();
    error PriceDeviationTooLarge();

    // ──────────────────────────────── Constructor ───────────────────────────

    constructor() Ownable(msg.sender) {}

    // ──────────────────────────────── Admin ─────────────────────────────────

    /// @notice Register or update the oracle for a collateral asset.
    /// @param collateral     Token address.
    /// @param chainlinkFeed  Chainlink aggregator (address(0) for manual-only).
    /// @param useManual      If true, only the manual price is used.
    function setOracle(
        address collateral,
        address chainlinkFeed,
        bool useManual
    ) external onlyOwner {
        oracles[collateral] = OracleConfig({
            chainlinkFeed:   IAggregatorV3(chainlinkFeed),
            manualPrice:     oracles[collateral].manualPrice,
            manualUpdatedAt: oracles[collateral].manualUpdatedAt,
            useManual:       useManual,
            exists:          true
        });
        emit OracleSet(collateral, chainlinkFeed, useManual);
    }

    /// @notice Manually set a USD price for a collateral asset.
    ///         Used for assets without Chainlink coverage (e.g. WTAO).
    /// @param collateral Token address.
    /// @param price      Price in 18-decimal USD (e.g. 500e18 = $500).
    function setManualPrice(address collateral, uint256 price) external onlyOwner {
        if (!oracles[collateral].exists) revert OracleNotSet();
        if (price == 0) revert InvalidPrice();

        // Deviation check against previous manual price
        uint256 prev = oracles[collateral].manualPrice;
        if (prev > 0) {
            uint256 deviation = price > prev
                ? ((price - prev) * 10000) / prev
                : ((prev - price) * 10000) / prev;
            if (deviation > MAX_PRICE_DEVIATION) revert PriceDeviationTooLarge();
        }

        oracles[collateral].manualPrice     = price;
        oracles[collateral].manualUpdatedAt  = block.timestamp;
        emit ManualPriceUpdated(collateral, price, block.timestamp);
    }

    /// @notice Pause the PriceFeed.
    function pause() external onlyOwner { _pause(); }

    /// @notice Unpause the PriceFeed.
    function unpause() external onlyOwner { _unpause(); }

    // ──────────────────────────────── Views ─────────────────────────────────

    /// @notice Get the current USD price for a collateral asset (18 decimals).
    /// @param collateral Token address.
    /// @return price USD price with 18 decimal precision.
    function getPrice(address collateral) external view whenNotPaused returns (uint256 price) {
        OracleConfig storage o = oracles[collateral];
        if (!o.exists) revert OracleNotSet();

        if (o.useManual) {
            return _getManualPrice(o);
        }
        return _getChainlinkPrice(o);
    }

    /// @notice Check whether the price for a collateral is stale.
    /// @param collateral Token address.
    /// @return True if the price is stale or unavailable.
    function isPriceStale(address collateral) external view returns (bool) {
        OracleConfig storage o = oracles[collateral];
        if (!o.exists) return true;

        if (o.useManual) {
            return (block.timestamp - o.manualUpdatedAt) > STALENESS_THRESHOLD;
        }

        try o.chainlinkFeed.latestRoundData() returns (
            uint80, int256 answer, uint256, uint256 updatedAt, uint80
        ) {
            if (answer <= 0) return true;
            return (block.timestamp - updatedAt) > STALENESS_THRESHOLD;
        } catch {
            return true;
        }
    }

    // ──────────────────────────────── Internal ──────────────────────────────

    function _getChainlinkPrice(OracleConfig storage o) internal view returns (uint256) {
        (
            ,
            int256 answer,
            ,
            uint256 updatedAt,
        ) = o.chainlinkFeed.latestRoundData();

        if (answer <= 0) revert InvalidPrice();
        if ((block.timestamp - updatedAt) > STALENESS_THRESHOLD) revert StalePrice();

        // Normalize to 18 decimals
        uint8 feedDecimals = o.chainlinkFeed.decimals();
        if (feedDecimals < 18) {
            return uint256(answer) * (10 ** (18 - feedDecimals));
        } else if (feedDecimals > 18) {
            return uint256(answer) / (10 ** (feedDecimals - 18));
        }
        return uint256(answer);
    }

    function _getManualPrice(OracleConfig storage o) internal view returns (uint256) {
        if (o.manualPrice == 0) revert InvalidPrice();
        if ((block.timestamp - o.manualUpdatedAt) > STALENESS_THRESHOLD) revert StalePrice();
        return o.manualPrice;
    }
}

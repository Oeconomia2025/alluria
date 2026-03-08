// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @title CollateralManager — Registry of supported collateral types
/// @notice Stores per-collateral parameters (ratios, fees, bonuses) and
///         allows the owner to add, update, or pause collateral types.
contract CollateralManager is Ownable2Step, Pausable {

    // ──────────────────────────────── Types ─────────────────────────────────

    struct CollateralParams {
        bool    exists;             // true once registered
        bool    paused;             // owner can pause a specific collateral
        uint256 minCollateralRatio; // e.g. 120% = 12000 (basis points, 10000 = 100%)
        uint256 liquidationRatio;   // e.g. 110% = 11000
        uint256 borrowingFee;       // one-time fee in bps, e.g. 50 = 0.5%
        uint256 liquidationBonus;   // bonus in bps, e.g. 1000 = 10%
    }

    // ──────────────────────────────── State ─────────────────────────────────

    mapping(address => CollateralParams) public collaterals;
    address[] public supportedCollaterals;

    // ──────────────────────────────── Events ────────────────────────────────

    event CollateralAdded(
        address indexed collateral,
        uint256 minCollateralRatio,
        uint256 liquidationRatio,
        uint256 borrowingFee,
        uint256 liquidationBonus
    );
    event CollateralUpdated(
        address indexed collateral,
        uint256 minCollateralRatio,
        uint256 liquidationRatio,
        uint256 borrowingFee,
        uint256 liquidationBonus
    );
    event CollateralPaused(address indexed collateral);
    event CollateralUnpaused(address indexed collateral);

    // ──────────────────────────────── Errors ────────────────────────────────

    error CollateralAlreadyExists();
    error CollateralNotFound();
    error InvalidParams();

    // ──────────────────────────────── Constructor ───────────────────────────

    constructor() Ownable(msg.sender) {}

    // ──────────────────────────────── Admin ─────────────────────────────────

    /// @notice Register a new collateral type.
    /// @param collateral       Token address.
    /// @param minColRatio      Minimum collateral ratio in bps (e.g. 12000 = 120%).
    /// @param liqRatio         Liquidation ratio in bps.
    /// @param fee              One-time borrowing fee in bps.
    /// @param liqBonus         Liquidation bonus in bps.
    function addCollateral(
        address collateral,
        uint256 minColRatio,
        uint256 liqRatio,
        uint256 fee,
        uint256 liqBonus
    ) external onlyOwner {
        if (collaterals[collateral].exists) revert CollateralAlreadyExists();
        _validateParams(minColRatio, liqRatio, fee, liqBonus);

        collaterals[collateral] = CollateralParams({
            exists:             true,
            paused:             false,
            minCollateralRatio: minColRatio,
            liquidationRatio:   liqRatio,
            borrowingFee:       fee,
            liquidationBonus:   liqBonus
        });
        supportedCollaterals.push(collateral);

        emit CollateralAdded(collateral, minColRatio, liqRatio, fee, liqBonus);
    }

    /// @notice Update parameters for an existing collateral.
    function updateCollateral(
        address collateral,
        uint256 minColRatio,
        uint256 liqRatio,
        uint256 fee,
        uint256 liqBonus
    ) external onlyOwner {
        if (!collaterals[collateral].exists) revert CollateralNotFound();
        _validateParams(minColRatio, liqRatio, fee, liqBonus);

        CollateralParams storage p = collaterals[collateral];
        p.minCollateralRatio = minColRatio;
        p.liquidationRatio   = liqRatio;
        p.borrowingFee       = fee;
        p.liquidationBonus   = liqBonus;

        emit CollateralUpdated(collateral, minColRatio, liqRatio, fee, liqBonus);
    }

    /// @notice Pause a specific collateral (blocks new trove openings).
    function pauseCollateral(address collateral) external onlyOwner {
        if (!collaterals[collateral].exists) revert CollateralNotFound();
        collaterals[collateral].paused = true;
        emit CollateralPaused(collateral);
    }

    /// @notice Unpause a specific collateral.
    function unpauseCollateral(address collateral) external onlyOwner {
        if (!collaterals[collateral].exists) revert CollateralNotFound();
        collaterals[collateral].paused = false;
        emit CollateralUnpaused(collateral);
    }

    /// @notice Pause the entire CollateralManager.
    function pause() external onlyOwner { _pause(); }

    /// @notice Unpause the entire CollateralManager.
    function unpause() external onlyOwner { _unpause(); }

    // ──────────────────────────────── Views ─────────────────────────────────

    /// @notice Get parameters for a collateral type.
    function getCollateralParams(address collateral)
        external
        view
        returns (CollateralParams memory)
    {
        if (!collaterals[collateral].exists) revert CollateralNotFound();
        return collaterals[collateral];
    }

    /// @notice Get all supported collateral addresses.
    function getSupportedCollaterals() external view returns (address[] memory) {
        return supportedCollaterals;
    }

    /// @notice Check if a collateral is registered and active.
    function isCollateralActive(address collateral) external view returns (bool) {
        return collaterals[collateral].exists && !collaterals[collateral].paused;
    }

    // ──────────────────────────────── Internal ──────────────────────────────

    function _validateParams(
        uint256 minColRatio,
        uint256 liqRatio,
        uint256 fee,
        uint256 liqBonus
    ) internal pure {
        // minColRatio must be > liquidationRatio > 10000 (100%)
        if (minColRatio <= liqRatio)  revert InvalidParams();
        if (liqRatio <= 10000)        revert InvalidParams();
        if (fee > 1000)               revert InvalidParams();   // max 10% fee
        if (liqBonus > 5000)          revert InvalidParams();   // max 50% bonus
    }
}

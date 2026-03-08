// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ALUD.sol";
import "./TroveManager.sol";
import "./StabilityPool.sol";
import "./CollateralManager.sol";
import "./PriceFeed.sol";
import "./EmissionsVault.sol";

/// @title AluriaLens — Read-only aggregator for Alluria protocol state
/// @notice Provides convenient view functions for frontends and indexers.
///         No state changes — pure reads from other Alluria contracts.
contract AluriaLens {

    // ──────────────────────────────── State ─────────────────────────────────

    ALUD              public alud;
    TroveManager      public troveManager;
    StabilityPool     public stabilityPool;
    CollateralManager public collateralManager;
    PriceFeed         public priceFeed;
    EmissionsVault    public emissionsVault;
    IERC20            public oec;

    // ──────────────────────────────── Types ─────────────────────────────────

    struct TroveInfo {
        address collateral;
        uint256 collateralAmount;
        uint256 debt;
        uint256 collateralRatio;  // basis points
        uint256 liquidationPrice; // 18-decimal USD
        uint256 collateralValueUSD;
    }

    struct CollateralStats {
        address collateral;
        uint256 totalCollateral;
        uint256 totalDebt;
        uint256 totalCollateralValueUSD;
        uint256 price;
        uint256 minCollateralRatio;
        uint256 liquidationRatio;
    }

    struct SystemStats {
        uint256 totalALUDSupply;
        uint256 totalCollateralValueUSD;
        uint256 stabilityPoolDeposits;
        uint256 oecVaultBalance;
        uint256 oecTotalReleased;
    }

    struct UserStabilityPosition {
        uint256 deposit;
        address[] gainTokens;
        uint256[] gainAmounts;
        uint256 pendingOEC;
    }

    // ──────────────────────────────── Constructor ───────────────────────────

    constructor(
        address _alud,
        address _troveManager,
        address _stabilityPool,
        address _collateralManager,
        address _priceFeed,
        address _emissionsVault,
        address _oec
    ) {
        alud              = ALUD(_alud);
        troveManager      = TroveManager(_troveManager);
        stabilityPool     = StabilityPool(_stabilityPool);
        collateralManager = CollateralManager(_collateralManager);
        priceFeed         = PriceFeed(_priceFeed);
        emissionsVault    = EmissionsVault(_emissionsVault);
        oec               = IERC20(_oec);
    }

    // ──────────────────────────────── Trove Views ───────────────────────────

    /// @notice Get health ratio for a specific trove.
    /// @param owner      Trove owner.
    /// @param collateral Collateral token.
    /// @return ratio Collateral ratio in basis points.
    function getTroveHealth(address owner, address collateral)
        external
        view
        returns (uint256 ratio)
    {
        return troveManager.getTroveHealth(owner, collateral);
    }

    /// @notice Get the liquidation price for a specific trove.
    /// @param owner      Trove owner.
    /// @param collateral Collateral token.
    /// @return price Liquidation price in 18-decimal USD.
    function getLiquidationPrice(address owner, address collateral)
        external
        view
        returns (uint256 price)
    {
        return troveManager.getLiquidationPrice(owner, collateral);
    }

    /// @notice Get all troves for a user across all supported collaterals.
    /// @param owner User address.
    /// @return infos Array of TroveInfo structs for active troves.
    function getAllUserTroves(address owner)
        external
        view
        returns (TroveInfo[] memory infos)
    {
        address[] memory collaterals = collateralManager.getSupportedCollaterals();

        // First pass: count active troves
        uint256 count = 0;
        for (uint256 i = 0; i < collaterals.length; i++) {
            (uint256 colAmt, , , bool exists) =
                troveManager.troves(owner, collaterals[i]);
            if (exists && colAmt > 0) count++;
        }

        infos = new TroveInfo[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < collaterals.length; i++) {
            (uint256 colAmt, uint256 debt, , bool exists) =
                troveManager.troves(owner, collaterals[i]);
            if (!exists || colAmt == 0) continue;

            uint256 colPrice = 0;
            uint256 ratio    = 0;
            uint256 liqPrice = 0;
            uint256 colValueUSD = 0;

            try priceFeed.getPrice(collaterals[i]) returns (uint256 p) {
                colPrice    = p;
                colValueUSD = (colAmt * p) / 1e18;
            } catch {}

            try troveManager.getTroveHealth(owner, collaterals[i]) returns (uint256 r) {
                ratio = r;
            } catch {}

            try troveManager.getLiquidationPrice(owner, collaterals[i]) returns (uint256 lp) {
                liqPrice = lp;
            } catch {}

            infos[idx] = TroveInfo({
                collateral:         collaterals[i],
                collateralAmount:   colAmt,
                debt:               debt,
                collateralRatio:    ratio,
                liquidationPrice:   liqPrice,
                collateralValueUSD: colValueUSD
            });
            idx++;
        }
    }

    // ──────────────────────────────── Stability Pool Views ──────────────────

    /// @notice Get stability pool statistics.
    /// @return deposits   Total ALUD deposited.
    /// @return oecBalance OEC remaining in EmissionsVault.
    /// @return oecReleased OEC already released from vault.
    function getStabilityPoolStats()
        external
        view
        returns (
            uint256 deposits,
            uint256 oecBalance,
            uint256 oecReleased
        )
    {
        deposits   = stabilityPool.totalDeposits();
        oecBalance = emissionsVault.getVaultBalance();
        oecReleased = emissionsVault.getTotalReleased();
    }

    /// @notice Get a user's full stability pool position.
    /// @param owner User address.
    /// @return position UserStabilityPosition struct.
    function getUserStabilityPoolPosition(address owner)
        external
        view
        returns (UserStabilityPosition memory position)
    {
        position.deposit = stabilityPool.deposits(owner);

        (address[] memory tokens, uint256[] memory amounts) =
            stabilityPool.getDepositorGains(owner);
        position.gainTokens  = tokens;
        position.gainAmounts = amounts;

        position.pendingOEC = stabilityPool.getDepositorOECRewards(owner);
    }

    // ──────────────────────────────── Collateral Views ──────────────────────

    /// @notice Get stats for a specific collateral type.
    /// @param collateral Token address.
    /// @return stats CollateralStats struct.
    function getCollateralStats(address collateral)
        external
        view
        returns (CollateralStats memory stats)
    {
        CollateralManager.CollateralParams memory params =
            collateralManager.getCollateralParams(collateral);

        uint256 totalCol  = troveManager.totalCollateral(collateral);
        uint256 totalDebt = troveManager.totalDebt(collateral);

        uint256 colPrice = 0;
        uint256 totalColValueUSD = 0;
        try priceFeed.getPrice(collateral) returns (uint256 p) {
            colPrice = p;
            totalColValueUSD = (totalCol * p) / 1e18;
        } catch {}

        stats = CollateralStats({
            collateral:              collateral,
            totalCollateral:         totalCol,
            totalDebt:               totalDebt,
            totalCollateralValueUSD: totalColValueUSD,
            price:                   colPrice,
            minCollateralRatio:      params.minCollateralRatio,
            liquidationRatio:        params.liquidationRatio
        });
    }

    // ──────────────────────────────── System Views ──────────────────────────

    /// @notice Get system-wide statistics.
    /// @return stats SystemStats struct.
    function getSystemStats() external view returns (SystemStats memory stats) {
        address[] memory collaterals = collateralManager.getSupportedCollaterals();

        uint256 totalColValueUSD = 0;
        for (uint256 i = 0; i < collaterals.length; i++) {
            uint256 totalCol = troveManager.totalCollateral(collaterals[i]);
            try priceFeed.getPrice(collaterals[i]) returns (uint256 p) {
                totalColValueUSD += (totalCol * p) / 1e18;
            } catch {}
        }

        stats = SystemStats({
            totalALUDSupply:         alud.totalSupply(),
            totalCollateralValueUSD: totalColValueUSD,
            stabilityPoolDeposits:   stabilityPool.totalDeposits(),
            oecVaultBalance:         emissionsVault.getVaultBalance(),
            oecTotalReleased:        emissionsVault.getTotalReleased()
        });
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ALUD.sol";
import "./PriceFeed.sol";
import "./CollateralManager.sol";

/// @title TroveManager — Core CDP engine for the Alluria protocol
/// @notice Manages isolated troves per collateral type. Users deposit collateral
///         and borrow ALUD stablecoin. Supports liquidation, redemption, and
///         one-time borrowing fees.
contract TroveManager is Ownable2Step, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ──────────────────────────────── Constants ─────────────────────────────

    uint256 public constant BPS = 10000;
    uint256 public constant PRICE_PRECISION = 1e18;
    uint256 public constant MIN_ALUD_MINT = 100e18;      // 100 ALUD minimum
    uint256 public constant MIN_COLLATERAL_USD = 200e18;  // $200 minimum
    uint256 public constant REDEMPTION_BASE_FEE = 50;     // 0.5% minimum

    // ──────────────────────────────── Types ─────────────────────────────────

    struct Trove {
        uint256 collateralAmount; // raw collateral deposited
        uint256 debt;             // ALUD debt outstanding
        uint256 openedAt;         // block.number when trove opened
        bool    exists;
    }

    // ──────────────────────────────── State ─────────────────────────────────

    ALUD               public alud;
    PriceFeed           public priceFeed;
    CollateralManager   public collateralManager;
    address             public stabilityPool;
    address             public feeRecipient;

    /// @dev troves[owner][collateral] → Trove
    mapping(address => mapping(address => Trove)) public troves;

    /// @dev Track total collateral and debt per collateral type
    mapping(address => uint256) public totalCollateral;
    mapping(address => uint256) public totalDebt;

    /// @dev Running total of redeemed ALUD (used for dynamic redemption fee)
    uint256 public totalRedeemed;

    /// @dev Minimum 2-block delay between price read and liquidation
    mapping(address => mapping(address => uint256)) public lastPriceReadBlock;

    // ──────────────────────────────── Events ────────────────────────────────

    event TroveOpened(
        address indexed owner,
        address indexed collateral,
        uint256 collateralAmount,
        uint256 debt,
        uint256 fee
    );
    event TroveClosed(address indexed owner, address indexed collateral);
    event CollateralAdded(address indexed owner, address indexed collateral, uint256 amount);
    event CollateralRemoved(address indexed owner, address indexed collateral, uint256 amount);
    event ALUDMinted(address indexed owner, address indexed collateral, uint256 amount, uint256 fee);
    event ALUDRepaid(address indexed owner, address indexed collateral, uint256 amount);
    event TroveLiquidated(
        address indexed owner,
        address indexed collateral,
        address indexed liquidator,
        uint256 collateralLiquidated,
        uint256 debtAbsorbed,
        uint256 bonus
    );
    event Redeemed(
        address indexed redeemer,
        address indexed collateral,
        uint256 alud_amount,
        uint256 collateralReturned,
        uint256 fee
    );
    event StabilityPoolSet(address indexed pool);
    event FeeRecipientSet(address indexed recipient);

    // ──────────────────────────────── Errors ────────────────────────────────

    error ZeroAddress();
    error ZeroAmount();
    error TroveAlreadyExists();
    error TroveNotFound();
    error BelowMinimumDebt();
    error BelowMinimumCollateral();
    error BelowMinimumRatio();
    error TroveHealthy();
    error LiquidationTooSoon();
    error InsufficientCollateral();
    error CollateralPaused();
    error StabilityPoolNotSet();

    // ──────────────────────────────── Constructor ───────────────────────────

    constructor(
        address _alud,
        address _priceFeed,
        address _collateralManager
    ) Ownable(msg.sender) {
        if (_alud == address(0) || _priceFeed == address(0) || _collateralManager == address(0))
            revert ZeroAddress();
        alud              = ALUD(_alud);
        priceFeed         = PriceFeed(_priceFeed);
        collateralManager = CollateralManager(_collateralManager);
        feeRecipient      = msg.sender;
    }

    // ──────────────────────────────── Admin ─────────────────────────────────

    function setStabilityPool(address _pool) external onlyOwner {
        if (_pool == address(0)) revert ZeroAddress();
        stabilityPool = _pool;
        emit StabilityPoolSet(_pool);
    }

    function setFeeRecipient(address _recipient) external onlyOwner {
        if (_recipient == address(0)) revert ZeroAddress();
        feeRecipient = _recipient;
        emit FeeRecipientSet(_recipient);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ──────────────────────────────── Trove Operations ──────────────────────

    /// @notice Open a new trove: deposit collateral and borrow ALUD.
    /// @param collateral       Collateral token address.
    /// @param collateralAmount Amount of collateral to deposit.
    /// @param alud_amount       Amount of ALUD to borrow (before fee).
    function openTrove(
        address collateral,
        uint256 collateralAmount,
        uint256 alud_amount
    ) external nonReentrant whenNotPaused {
        _requireCollateralActive(collateral);
        if (troves[msg.sender][collateral].exists) revert TroveAlreadyExists();
        if (collateralAmount == 0) revert ZeroAmount();
        if (alud_amount < MIN_ALUD_MINT) revert BelowMinimumDebt();

        // Check minimum collateral USD value
        uint256 colPrice = priceFeed.getPrice(collateral);
        uint256 colNorm = _normalize18(collateralAmount, collateral);
        uint256 colValueUSD = (colNorm * colPrice) / PRICE_PRECISION;
        if (colValueUSD < MIN_COLLATERAL_USD) revert BelowMinimumCollateral();

        // Calculate one-time fee
        CollateralManager.CollateralParams memory params = collateralManager.getCollateralParams(collateral);
        uint256 fee = (alud_amount * params.borrowingFee) / BPS;
        uint256 totalDebtForTrove = alud_amount + fee;

        // Check collateral ratio
        uint256 ratio = _computeRatio(collateralAmount, colPrice, totalDebtForTrove, collateral);
        if (ratio < params.minCollateralRatio) revert BelowMinimumRatio();

        // Transfer collateral in
        IERC20(collateral).safeTransferFrom(msg.sender, address(this), collateralAmount);

        // Create trove
        troves[msg.sender][collateral] = Trove({
            collateralAmount: collateralAmount,
            debt:             totalDebtForTrove,
            openedAt:         block.number,
            exists:           true
        });
        totalCollateral[collateral] += collateralAmount;
        totalDebt[collateral]       += totalDebtForTrove;

        // Mint ALUD: user gets alud_amount, fee goes to feeRecipient
        alud.mint(msg.sender, alud_amount);
        if (fee > 0) {
            alud.mint(feeRecipient, fee);
        }

        emit TroveOpened(msg.sender, collateral, collateralAmount, totalDebtForTrove, fee);
    }

    /// @notice Close a trove by repaying all debt. Returns collateral.
    /// @param collateral Collateral token address.
    function closeTrove(address collateral) external nonReentrant whenNotPaused {
        Trove storage t = troves[msg.sender][collateral];
        if (!t.exists) revert TroveNotFound();

        uint256 debt = t.debt;
        uint256 col  = t.collateralAmount;

        // Burn the full debt from user
        alud.burn(msg.sender, debt);

        // Update totals
        totalCollateral[collateral] -= col;
        totalDebt[collateral]       -= debt;

        // Delete trove
        delete troves[msg.sender][collateral];

        // Return collateral
        IERC20(collateral).safeTransfer(msg.sender, col);

        emit TroveClosed(msg.sender, collateral);
    }

    /// @notice Add more collateral to an existing trove.
    /// @param collateral Collateral token address.
    /// @param amount     Amount of collateral to add.
    function addCollateral(address collateral, uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        Trove storage t = troves[msg.sender][collateral];
        if (!t.exists) revert TroveNotFound();

        IERC20(collateral).safeTransferFrom(msg.sender, address(this), amount);
        t.collateralAmount += amount;
        totalCollateral[collateral] += amount;

        emit CollateralAdded(msg.sender, collateral, amount);
    }

    /// @notice Remove collateral from a trove (must stay above min ratio).
    /// @param collateral Collateral token address.
    /// @param amount     Amount of collateral to remove.
    function removeCollateral(address collateral, uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        Trove storage t = troves[msg.sender][collateral];
        if (!t.exists) revert TroveNotFound();
        if (amount > t.collateralAmount) revert InsufficientCollateral();

        uint256 newColAmount = t.collateralAmount - amount;
        uint256 colPrice = priceFeed.getPrice(collateral);
        CollateralManager.CollateralParams memory params = collateralManager.getCollateralParams(collateral);
        uint256 ratio = _computeRatio(newColAmount, colPrice, t.debt, collateral);
        if (ratio < params.minCollateralRatio) revert BelowMinimumRatio();

        // Check minimum collateral USD value
        uint256 colValueUSD = (_normalize18(newColAmount, collateral) * colPrice) / PRICE_PRECISION;
        if (colValueUSD < MIN_COLLATERAL_USD) revert BelowMinimumCollateral();

        t.collateralAmount = newColAmount;
        totalCollateral[collateral] -= amount;

        IERC20(collateral).safeTransfer(msg.sender, amount);
        emit CollateralRemoved(msg.sender, collateral, amount);
    }

    /// @notice Mint additional ALUD against an existing trove (one-time fee applied).
    /// @param collateral Collateral token address.
    /// @param amount     Amount of ALUD to mint (before fee).
    function mintALUD(address collateral, uint256 amount) external nonReentrant whenNotPaused {
        _requireCollateralActive(collateral);
        if (amount == 0) revert ZeroAmount();
        Trove storage t = troves[msg.sender][collateral];
        if (!t.exists) revert TroveNotFound();

        CollateralManager.CollateralParams memory params = collateralManager.getCollateralParams(collateral);
        uint256 fee = (amount * params.borrowingFee) / BPS;
        uint256 newDebt = t.debt + amount + fee;

        uint256 colPrice = priceFeed.getPrice(collateral);
        uint256 ratio = _computeRatio(t.collateralAmount, colPrice, newDebt, collateral);
        if (ratio < params.minCollateralRatio) revert BelowMinimumRatio();

        t.debt = newDebt;
        totalDebt[collateral] += (amount + fee);

        alud.mint(msg.sender, amount);
        if (fee > 0) {
            alud.mint(feeRecipient, fee);
        }

        emit ALUDMinted(msg.sender, collateral, amount, fee);
    }

    /// @notice Repay ALUD debt on an existing trove.
    /// @param collateral Collateral token address.
    /// @param amount     Amount of ALUD to repay.
    function repayALUD(address collateral, uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        Trove storage t = troves[msg.sender][collateral];
        if (!t.exists) revert TroveNotFound();
        if (amount > t.debt) amount = t.debt;

        alud.burn(msg.sender, amount);
        t.debt -= amount;
        totalDebt[collateral] -= amount;

        emit ALUDRepaid(msg.sender, collateral, amount);
    }

    // ──────────────────────────────── Liquidation ───────────────────────────

    /// @notice Liquidate an undercollateralized trove.
    /// @dev    Requires a 2-block delay from last price read for manipulation resistance.
    /// @param troveOwner Owner of the trove to liquidate.
    /// @param collateral Collateral token address.
    function liquidate(
        address troveOwner,
        address collateral
    ) external nonReentrant whenNotPaused {
        if (stabilityPool == address(0)) revert StabilityPoolNotSet();
        Trove storage t = troves[troveOwner][collateral];
        if (!t.exists) revert TroveNotFound();

        // 2-block delay check
        uint256 lastRead = lastPriceReadBlock[troveOwner][collateral];
        if (lastRead > 0 && block.number < lastRead + 2) revert LiquidationTooSoon();

        uint256 colPrice = priceFeed.getPrice(collateral);
        // Record price read block for manipulation resistance
        lastPriceReadBlock[troveOwner][collateral] = block.number;

        CollateralManager.CollateralParams memory params = collateralManager.getCollateralParams(collateral);
        uint256 ratio = _computeRatio(t.collateralAmount, colPrice, t.debt, collateral);
        if (ratio >= params.liquidationRatio) revert TroveHealthy();

        uint256 debtToAbsorb    = t.debt;
        uint256 colToLiquidate  = t.collateralAmount;
        uint256 bonus           = (colToLiquidate * params.liquidationBonus) / BPS;

        // Update totals
        totalCollateral[collateral] -= colToLiquidate;
        totalDebt[collateral]       -= debtToAbsorb;

        // Delete trove
        delete troves[troveOwner][collateral];

        // Send collateral to stability pool for distribution
        IERC20(collateral).safeTransfer(stabilityPool, colToLiquidate);

        // Notify stability pool to absorb the debt
        IStabilityPoolLiquidation(stabilityPool).absorbLiquidation(
            collateral,
            colToLiquidate,
            debtToAbsorb
        );

        emit TroveLiquidated(
            troveOwner,
            collateral,
            msg.sender,
            colToLiquidate,
            debtToAbsorb,
            bonus
        );
    }

    // ──────────────────────────────── Redemption ────────────────────────────

    /// @notice Redeem ALUD for collateral from the lowest-ratio troves.
    ///         Maintains ALUD peg by creating a $1 arbitrage floor.
    /// @param collateral Collateral token address.
    /// @param alud_amount Amount of ALUD to redeem.
    /// @param troveOwner Target trove to redeem against (lowest ratio first).
    function redeemCollateral(
        address collateral,
        uint256 alud_amount,
        address troveOwner
    ) external nonReentrant whenNotPaused {
        if (alud_amount == 0) revert ZeroAmount();
        Trove storage t = troves[troveOwner][collateral];
        if (!t.exists) revert TroveNotFound();

        // Cap redemption at trove's debt
        uint256 redeemAmount = alud_amount > t.debt ? t.debt : alud_amount;

        // Calculate redemption fee (Liquity-style: base + volume-based increase)
        uint256 fee = _computeRedemptionFee(redeemAmount);

        // Calculate collateral to return (in token's native decimals)
        uint256 colPrice = priceFeed.getPrice(collateral);
        // collateralEquivalent in 18 decimals first, then de-normalize to token decimals
        uint256 colEquiv18 = (redeemAmount * PRICE_PRECISION) / colPrice;
        uint8 tokenDec = IERC20Metadata(collateral).decimals();
        uint256 collateralEquivalent;
        if (tokenDec < 18) {
            collateralEquivalent = colEquiv18 / (10 ** (18 - tokenDec));
        } else if (tokenDec > 18) {
            collateralEquivalent = colEquiv18 * (10 ** (tokenDec - 18));
        } else {
            collateralEquivalent = colEquiv18;
        }
        uint256 feeInCollateral = (collateralEquivalent * fee) / BPS;
        uint256 collateralToReturn = collateralEquivalent - feeInCollateral;

        if (collateralToReturn > t.collateralAmount) revert InsufficientCollateral();

        // Burn redeemer's ALUD
        alud.burn(msg.sender, redeemAmount);

        // Update trove
        t.debt             -= redeemAmount;
        t.collateralAmount -= collateralEquivalent;
        totalDebt[collateral]       -= redeemAmount;
        totalCollateral[collateral] -= collateralEquivalent;

        // Close trove if fully redeemed
        if (t.debt == 0) {
            uint256 remainingCol = t.collateralAmount;
            delete troves[troveOwner][collateral];
            if (remainingCol > 0) {
                IERC20(collateral).safeTransfer(troveOwner, remainingCol);
            }
        }

        // Track total redeemed for fee calculation
        totalRedeemed += redeemAmount;

        // Transfer collateral to redeemer (minus fee)
        IERC20(collateral).safeTransfer(msg.sender, collateralToReturn);
        // Fee collateral stays in contract (benefit to remaining trove holders)

        emit Redeemed(msg.sender, collateral, redeemAmount, collateralToReturn, fee);
    }

    // ──────────────────────────────── Views ─────────────────────────────────

    /// @notice Get the current collateral ratio of a trove.
    /// @param troveOwner Owner address.
    /// @param collateral Collateral token address.
    /// @return ratio Collateral ratio in basis points (e.g. 15000 = 150%).
    function getTroveHealth(
        address troveOwner,
        address collateral
    ) external view returns (uint256 ratio) {
        Trove storage t = troves[troveOwner][collateral];
        if (!t.exists) revert TroveNotFound();
        if (t.debt == 0) return type(uint256).max;
        uint256 colPrice = priceFeed.getPrice(collateral);
        return _computeRatio(t.collateralAmount, colPrice, t.debt, collateral);
    }

    /// @notice Get the price at which a trove becomes liquidatable.
    /// @param troveOwner Owner address.
    /// @param collateral Collateral token address.
    /// @return price Liquidation price in 18-decimal USD.
    function getLiquidationPrice(
        address troveOwner,
        address collateral
    ) external view returns (uint256 price) {
        Trove storage t = troves[troveOwner][collateral];
        if (!t.exists) revert TroveNotFound();
        if (t.collateralAmount == 0) return type(uint256).max;

        CollateralManager.CollateralParams memory params = collateralManager.getCollateralParams(collateral);
        // liqPrice = (debt * liqRatio * PRECISION) / (colAmountNorm * BPS)
        uint256 colNorm = _normalize18(t.collateralAmount, collateral);
        return (t.debt * params.liquidationRatio * PRICE_PRECISION) / (colNorm * BPS);
    }

    // ──────────────────────────────── Internal ──────────────────────────────

    /// @dev Normalize a raw collateral amount to 18-decimal precision.
    function _normalize18(uint256 amount, address token) internal view returns (uint256) {
        uint8 dec = IERC20Metadata(token).decimals();
        if (dec < 18) return amount * (10 ** (18 - dec));
        if (dec > 18) return amount / (10 ** (dec - 18));
        return amount;
    }

    /// @dev Compute collateral ratio in basis points.
    ///      ratio = (colAmountNorm * colPrice * BPS) / (debt * PRECISION)
    function _computeRatio(
        uint256 colAmount,
        uint256 colPrice,
        uint256 debt,
        address collateral
    ) internal view returns (uint256) {
        if (debt == 0) return type(uint256).max;
        uint256 colNorm = _normalize18(colAmount, collateral);
        return (colNorm * colPrice * BPS) / (debt * PRICE_PRECISION);
    }

    /// @dev Compute redemption fee using Liquity-style formula.
    ///      Base fee of 0.5%, increases with cumulative redemption volume.
    function _computeRedemptionFee(uint256 /* amount */) internal view returns (uint256) {
        // Simple model: base fee + 0.5% per 1M ALUD redeemed historically
        uint256 volumeIncrease = (totalRedeemed * 50) / (1_000_000e18);
        uint256 fee = REDEMPTION_BASE_FEE + volumeIncrease;
        if (fee > 500) fee = 500; // Cap at 5%
        return fee;
    }

    function _requireCollateralActive(address collateral) internal view {
        if (!collateralManager.isCollateralActive(collateral)) revert CollateralPaused();
    }
}

// ──────────────────────────────── Interface ─────────────────────────────

/// @dev Minimal interface for StabilityPool liquidation callback.
interface IStabilityPoolLiquidation {
    function absorbLiquidation(
        address collateral,
        uint256 collateralAmount,
        uint256 debtToAbsorb
    ) external;
}

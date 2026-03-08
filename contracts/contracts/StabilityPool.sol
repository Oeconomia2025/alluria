// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ALUD.sol";

/// @title StabilityPool — Liquidation absorber & OEC reward distributor
/// @notice ALUD depositors provide a pool that absorbs liquidated trove debt.
///         In return they receive liquidated collateral (pro-rata) plus OEC
///         emission rewards dripped from EmissionsVault.
contract StabilityPool is Ownable2Step, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ──────────────────────────────── State ─────────────────────────────────

    ALUD   public alud;
    IERC20 public oec;
    address public troveManager;
    address public emissionsVault;

    /// @dev Total ALUD deposited in the pool.
    uint256 public totalDeposits;

    /// @dev Per-depositor ALUD balance.
    mapping(address => uint256) public deposits;

    // ── Collateral gains tracking (Liquity-style cumulative product) ──

    /// @dev All collateral tokens that have ever been distributed.
    address[] public gainTokens;
    mapping(address => bool) public isGainToken;

    /// @dev Cumulative collateral gain per unit of ALUD deposited (scaled by 1e18).
    ///      gainPerDeposit[collateral] accumulates over time.
    mapping(address => uint256) public gainPerDeposit;

    /// @dev Snapshot of gainPerDeposit at the time of each depositor's last action.
    ///      userGainSnapshot[user][collateral]
    mapping(address => mapping(address => uint256)) public userGainSnapshot;

    // ── OEC rewards tracking ──

    /// @dev Cumulative OEC reward per unit of ALUD deposited (scaled by 1e18).
    uint256 public oecRewardPerDeposit;

    /// @dev Snapshot of oecRewardPerDeposit at the time of each depositor's last action.
    mapping(address => uint256) public userOecSnapshot;

    // ──────────────────────────────── Events ────────────────────────────────

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event LiquidationAbsorbed(
        address indexed collateral,
        uint256 collateralAmount,
        uint256 debtAbsorbed
    );
    event CollateralGainsClaimed(address indexed user);
    event OECRewardsClaimed(address indexed user, uint256 amount);
    event OECRewardsReceived(uint256 amount);
    event TroveManagerSet(address indexed manager);
    event EmissionsVaultSet(address indexed vault);

    // ──────────────────────────────── Errors ────────────────────────────────

    error ZeroAddress();
    error ZeroAmount();
    error InsufficientDeposit();
    error NotTroveManager();
    error NotEmissionsVault();

    // ──────────────────────────────── Modifiers ─────────────────────────────

    modifier onlyTroveManager() {
        if (msg.sender != troveManager) revert NotTroveManager();
        _;
    }

    modifier onlyEmissionsVault() {
        if (msg.sender != emissionsVault) revert NotEmissionsVault();
        _;
    }

    // ──────────────────────────────── Constructor ───────────────────────────

    constructor(
        address _alud,
        address _oec
    ) Ownable(msg.sender) {
        if (_alud == address(0) || _oec == address(0)) revert ZeroAddress();
        alud = ALUD(_alud);
        oec  = IERC20(_oec);
    }

    // ──────────────────────────────── Admin ─────────────────────────────────

    function setTroveManager(address _manager) external onlyOwner {
        if (_manager == address(0)) revert ZeroAddress();
        troveManager = _manager;
        emit TroveManagerSet(_manager);
    }

    function setEmissionsVault(address _vault) external onlyOwner {
        if (_vault == address(0)) revert ZeroAddress();
        emissionsVault = _vault;
        emit EmissionsVaultSet(_vault);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ──────────────────────────────── Depositor Actions ─────────────────────

    /// @notice Deposit ALUD into the stability pool.
    /// @param amount Amount of ALUD to deposit.
    function depositALUD(uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert ZeroAmount();

        // Settle pending gains before changing deposit
        _settleGains(msg.sender);

        // Transfer ALUD from depositor
        alud.transferFrom(msg.sender, address(this), amount);

        deposits[msg.sender] += amount;
        totalDeposits         += amount;

        emit Deposited(msg.sender, amount);
    }

    /// @notice Withdraw ALUD from the stability pool.
    /// @param amount Amount of ALUD to withdraw.
    function withdrawALUD(uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        if (amount > deposits[msg.sender]) revert InsufficientDeposit();

        // Settle pending gains before changing deposit
        _settleGains(msg.sender);

        deposits[msg.sender] -= amount;
        totalDeposits         -= amount;

        alud.transfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Claim all accumulated collateral gains from liquidations.
    function claimCollateralGains() external nonReentrant whenNotPaused {
        _settleGains(msg.sender);

        // Gains are settled to user in _settleGains (called above)

        emit CollateralGainsClaimed(msg.sender);
    }

    /// @notice Claim accumulated OEC rewards.
    function claimOECRewards() external nonReentrant whenNotPaused {
        uint256 pending = _pendingOecReward(msg.sender);
        userOecSnapshot[msg.sender] = oecRewardPerDeposit;

        if (pending > 0) {
            oec.safeTransfer(msg.sender, pending);
            emit OECRewardsClaimed(msg.sender, pending);
        }
    }

    // ──────────────────────────────── TroveManager Callback ─────────────────

    /// @notice Called by TroveManager during liquidation. Burns ALUD from pool
    ///         and distributes collateral gains to depositors.
    /// @param collateral       The liquidated collateral token.
    /// @param collateralAmount Amount of collateral received (already transferred).
    /// @param debtToAbsorb     Amount of ALUD debt to absorb.
    function absorbLiquidation(
        address collateral,
        uint256 collateralAmount,
        uint256 debtToAbsorb
    ) external onlyTroveManager nonReentrant {
        if (totalDeposits == 0) {
            // If pool is empty, collateral is stuck — TroveManager should
            // handle redistribution. Revert here to signal empty pool.
            revert InsufficientDeposit();
        }

        // Register collateral token if first time
        if (!isGainToken[collateral]) {
            isGainToken[collateral] = true;
            gainTokens.push(collateral);
        }

        // Burn absorbed ALUD from pool balance
        uint256 absorbable = debtToAbsorb > totalDeposits ? totalDeposits : debtToAbsorb;
        alud.burn(address(this), absorbable);
        totalDeposits -= absorbable;

        // Accumulate collateral gain per deposit unit
        // gainPerDeposit += (collateralAmount * 1e18) / totalDepositsBeforeAbsorption
        // We use totalDeposits + absorbable because we already subtracted
        uint256 depositsBeforeAbsorb = totalDeposits + absorbable;
        gainPerDeposit[collateral] += (collateralAmount * 1e18) / depositsBeforeAbsorb;

        emit LiquidationAbsorbed(collateral, collateralAmount, absorbable);
    }

    // ──────────────────────────────── EmissionsVault Callback ───────────────

    /// @notice Called by EmissionsVault to distribute OEC rewards.
    ///         OEC tokens must already be transferred to this contract.
    /// @param amount Amount of OEC received.
    function receiveOECRewards(uint256 amount) external onlyEmissionsVault nonReentrant {
        if (totalDeposits == 0) {
            // No depositors — OEC stays in contract for future distribution
            return;
        }
        oecRewardPerDeposit += (amount * 1e18) / totalDeposits;
        emit OECRewardsReceived(amount);
    }

    // ──────────────────────────────── Views ─────────────────────────────────

    /// @notice Get pending collateral gains for a depositor.
    /// @param user Depositor address.
    /// @return tokens Array of collateral token addresses.
    /// @return amounts Array of pending gain amounts.
    function getDepositorGains(address user)
        external
        view
        returns (address[] memory tokens, uint256[] memory amounts)
    {
        tokens  = gainTokens;
        amounts = new uint256[](tokens.length);
        uint256 dep = deposits[user];
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 delta = gainPerDeposit[tokens[i]] - userGainSnapshot[user][tokens[i]];
            amounts[i] = (dep * delta) / 1e18;
        }
    }

    /// @notice Get pending OEC rewards for a depositor.
    /// @param user Depositor address.
    /// @return Pending OEC reward amount.
    function getDepositorOECRewards(address user) external view returns (uint256) {
        return _pendingOecReward(user);
    }

    /// @notice Get all registered gain tokens.
    function getGainTokens() external view returns (address[] memory) {
        return gainTokens;
    }

    // ──────────────────────────────── Internal ──────────────────────────────

    /// @dev Settle and transfer all pending collateral gains + update snapshots.
    function _settleGains(address user) internal {
        uint256 dep = deposits[user];
        if (dep == 0) {
            // Just set snapshots to current values
            _updateSnapshots(user);
            return;
        }

        for (uint256 i = 0; i < gainTokens.length; i++) {
            address token = gainTokens[i];
            uint256 delta = gainPerDeposit[token] - userGainSnapshot[user][token];
            uint256 gain  = (dep * delta) / 1e18;
            if (gain > 0) {
                IERC20(token).safeTransfer(user, gain);
            }
        }
        _updateSnapshots(user);
    }

    /// @dev Update all snapshots for a user to current cumulative values.
    function _updateSnapshots(address user) internal {
        for (uint256 i = 0; i < gainTokens.length; i++) {
            userGainSnapshot[user][gainTokens[i]] = gainPerDeposit[gainTokens[i]];
        }
        userOecSnapshot[user] = oecRewardPerDeposit;
    }

    /// @dev Calculate pending OEC reward for a user.
    function _pendingOecReward(address user) internal view returns (uint256) {
        uint256 dep = deposits[user];
        if (dep == 0) return 0;
        uint256 delta = oecRewardPerDeposit - userOecSnapshot[user];
        return (dep * delta) / 1e18;
    }
}

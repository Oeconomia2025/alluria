// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title EmissionsVault — OEC drip-feed to StabilityPool
/// @notice Holds OEC tokens and releases them to the Alluria StabilityPool
///         at a controlled rate. The owner triggers releases subject to a
///         7-day minimum interval and 500,000 OEC maximum per release.
/// @dev    No withdrawal functions besides release() — OEC can only flow
///         to the authorized StabilityPool address.
contract EmissionsVault is Ownable2Step, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ──────────────────────────────── Constants ─────────────────────────────

    uint256 public constant MIN_RELEASE_INTERVAL = 7 days;
    uint256 public constant MAX_RELEASE_AMOUNT   = 500_000e18; // 500,000 OEC (18 decimals)

    // ──────────────────────────────── State ─────────────────────────────────

    IERC20  public oec;
    address public stabilityPool;

    uint256 public lastReleaseTime;
    uint256 public totalReleased;

    // ──────────────────────────────── Events ────────────────────────────────

    event OECReleased(
        address indexed stabilityPool,
        uint256 amount,
        uint256 totalReleased,
        uint256 vaultBalance,
        uint256 timestamp
    );

    // ──────────────────────────────── Errors ────────────────────────────────

    error ZeroAddress();
    error ZeroAmount();
    error ReleaseTooSoon();
    error ExceedsMaxRelease();
    error InsufficientBalance();
    error StabilityPoolNotSet();

    // ──────────────────────────────── Constructor ───────────────────────────

    constructor(address _oec) Ownable(msg.sender) {
        if (_oec == address(0)) revert ZeroAddress();
        oec = IERC20(_oec);
    }

    // ──────────────────────────────── Admin ─────────────────────────────────

    /// @notice Set the StabilityPool address — the ONLY authorized recipient.
    /// @param _stabilityPool Address of the Alluria StabilityPool contract.
    function setStabilityPool(address _stabilityPool) external onlyOwner {
        if (_stabilityPool == address(0)) revert ZeroAddress();
        stabilityPool = _stabilityPool;
    }

    /// @notice Pause the vault (blocks releases).
    function pause() external onlyOwner { _pause(); }

    /// @notice Unpause the vault.
    function unpause() external onlyOwner { _unpause(); }

    // ──────────────────────────────── Release ───────────────────────────────

    /// @notice Release OEC to the StabilityPool.
    /// @dev    Subject to 7-day minimum interval and 500,000 OEC max per release.
    ///         Emits a detailed event for OECsplorer tracking.
    /// @param amount Amount of OEC to release (18 decimals).
    function release(uint256 amount) external onlyOwner nonReentrant whenNotPaused {
        if (stabilityPool == address(0)) revert StabilityPoolNotSet();
        if (amount == 0)                 revert ZeroAmount();
        if (amount > MAX_RELEASE_AMOUNT) revert ExceedsMaxRelease();

        // Enforce 7-day minimum interval
        if (lastReleaseTime > 0 && block.timestamp < lastReleaseTime + MIN_RELEASE_INTERVAL) {
            revert ReleaseTooSoon();
        }

        uint256 balance = oec.balanceOf(address(this));
        if (amount > balance) revert InsufficientBalance();

        lastReleaseTime = block.timestamp;
        totalReleased  += amount;

        // Transfer OEC to StabilityPool
        oec.safeTransfer(stabilityPool, amount);

        // Notify StabilityPool of incoming rewards
        IStabilityPoolRewards(stabilityPool).receiveOECRewards(amount);

        emit OECReleased(
            stabilityPool,
            amount,
            totalReleased,
            oec.balanceOf(address(this)),
            block.timestamp
        );
    }

    // ──────────────────────────────── Views ─────────────────────────────────

    /// @notice Get the current OEC balance in the vault.
    function getVaultBalance() external view returns (uint256) {
        return oec.balanceOf(address(this));
    }

    /// @notice Get the timestamp of the last release.
    function getLastReleaseTime() external view returns (uint256) {
        return lastReleaseTime;
    }

    /// @notice Get the earliest timestamp for the next allowed release.
    function getNextReleaseTime() external view returns (uint256) {
        if (lastReleaseTime == 0) return block.timestamp; // First release allowed anytime
        return lastReleaseTime + MIN_RELEASE_INTERVAL;
    }

    /// @notice Get total OEC released over the vault's lifetime.
    function getTotalReleased() external view returns (uint256) {
        return totalReleased;
    }
}

// ──────────────────────────────── Interface ─────────────────────────────

/// @dev Minimal interface for StabilityPool OEC reward callback.
interface IStabilityPoolRewards {
    function receiveOECRewards(uint256 amount) external;
}

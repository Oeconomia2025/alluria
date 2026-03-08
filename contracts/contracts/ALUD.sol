// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @title ALUD — Alluria USD Stablecoin
/// @notice ERC20 stablecoin minted against collateral via TroveManager.
///         Only authorized contracts can mint and burn.
/// @dev Transfers are pausable by the owner for emergencies.
contract ALUD is ERC20, Ownable2Step, Pausable {

    /// @notice The address permitted to mint and burn ALUD.
    address public troveManager;

    /// @notice The StabilityPool address, permitted to burn ALUD during liquidation absorption.
    address public stabilityPool;

    // ──────────────────────────────── Events ────────────────────────────────

    event TroveManagerSet(address indexed previousManager, address indexed newManager);
    event StabilityPoolSet(address indexed previousPool, address indexed newPool);

    // ──────────────────────────────── Errors ────────────────────────────────

    error NotAuthorized();
    error ZeroAddress();

    // ──────────────────────────────── Modifiers ─────────────────────────────

    modifier onlyTroveManager() {
        if (msg.sender != troveManager) revert NotAuthorized();
        _;
    }

    modifier onlyAuthorizedBurner() {
        if (msg.sender != troveManager && msg.sender != stabilityPool) revert NotAuthorized();
        _;
    }

    // ──────────────────────────────── Constructor ───────────────────────────

    constructor() ERC20("Alluria USD", "ALUD") Ownable(msg.sender) {}

    // ──────────────────────────────── Admin ─────────────────────────────────

    /// @notice Set the TroveManager address that is allowed to mint/burn.
    /// @param _troveManager Address of the TroveManager contract.
    function setTroveManager(address _troveManager) external onlyOwner {
        if (_troveManager == address(0)) revert ZeroAddress();
        emit TroveManagerSet(troveManager, _troveManager);
        troveManager = _troveManager;
    }

    /// @notice Set the StabilityPool address that is allowed to burn ALUD.
    /// @param _stabilityPool Address of the StabilityPool contract.
    function setStabilityPool(address _stabilityPool) external onlyOwner {
        if (_stabilityPool == address(0)) revert ZeroAddress();
        emit StabilityPoolSet(stabilityPool, _stabilityPool);
        stabilityPool = _stabilityPool;
    }

    /// @notice Pause all ALUD transfers.
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause all ALUD transfers.
    function unpause() external onlyOwner {
        _unpause();
    }

    // ──────────────────────────────── Mint / Burn ───────────────────────────

    /// @notice Mint ALUD to a recipient. Only callable by TroveManager.
    /// @param to   Recipient address.
    /// @param amount Amount of ALUD to mint (18 decimals).
    function mint(address to, uint256 amount) external onlyTroveManager {
        _mint(to, amount);
    }

    /// @notice Burn ALUD from an account. Callable by TroveManager or StabilityPool.
    /// @param from  Account to burn from.
    /// @param amount Amount of ALUD to burn (18 decimals).
    function burn(address from, uint256 amount) external onlyAuthorizedBurner {
        _burn(from, amount);
    }

    // ──────────────────────────────── Overrides ─────────────────────────────

    /// @dev Enforce pause on every transfer (including mint/burn).
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override whenNotPaused {
        super._update(from, to, value);
    }
}

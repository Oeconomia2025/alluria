# Trove Manager

Core contract managing collateralized debt positions (troves).

**Address (Sepolia):** `0x90CCA7d8B6cAb91d53e384E3c0cD3Ba34b7B8Cc2`

## Overview

The TroveManager handles the lifecycle of lending positions. Users deposit collateral to open a trove, mint ALUD stablecoin against it, and must maintain a minimum 110% collateral ratio to avoid liquidation.

## Collateral Ratios

| Threshold | Ratio  | Status       |
| --------- | ------ | ------------ |
| Minimum   | 110%   | Liquidation  |
| Warning   | 120%   | Critical     |
| Caution   | 150%   | At risk      |
| Safe      | 150%+  | Recommended  |
| Very safe | 200%+  | Conservative |

**Health Factor** = Collateral Ratio / 110

## User Functions

| Function                              | Description                              |
| ------------------------------------- | ---------------------------------------- |
| `openTrove(collateral, amount, alud)` | Create new position                      |
| `closeTrove(collateral)`              | Close position, return collateral        |
| `addCollateral(collateral, amount)`   | Increase collateral in existing trove    |
| `removeCollateral(collateral, amount)`| Decrease collateral (ratio must stay >110%) |
| `mintALUD(collateral, amount)`        | Borrow more ALUD against existing trove  |
| `repayALUD(collateral, amount)`       | Repay debt to improve ratio              |

## Liquidation

When a trove's collateral ratio drops below 110%:

1. Liquidator calls `liquidate(troveOwner, collateral)`
2. Stability Pool's ALUD absorbs the trove's debt
3. Stability Pool depositors receive the trove's collateral (at discount)
4. Trove is closed

## Read Functions (via AluriaLens)

| Function                          | Returns                                 |
| --------------------------------- | --------------------------------------- |
| `getSystemStats()`                | Total supply, TVL, stability pool size  |
| `getAllUserTroves(owner)`         | Array of trove details per collateral   |
| `getCollateralStats(token)`       | Price, total collateral, total debt     |

## Events

| Event                                    | Emitted When              |
| ---------------------------------------- | ------------------------- |
| `TroveOpened(owner, collateral, debt)`   | New trove created         |
| `TroveClosed(owner, collateral)`         | Trove fully repaid        |
| `CollateralAdded(owner, token, amount)`  | More collateral deposited |
| `ALUDMinted(owner, amount)`              | Additional ALUD borrowed  |
| `Liquidation(owner, collateral, debt)`   | Position liquidated       |

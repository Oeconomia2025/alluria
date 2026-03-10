# Stability Pool

Liquidation insurance pool where ALUD depositors earn collateral gains and OEC rewards.

**Address (Sepolia):** `0xB61a71C78e10C0C92e2dFF457C9F87dC71260c43`

## Overview

The Stability Pool absorbs debt from liquidated troves. In return, depositors receive the liquidated collateral (at a discount) and earn OEC governance token emissions.

## How It Works

1. Users deposit ALUD into the Stability Pool
2. When a trove is liquidated, the pool's ALUD is burned to cover the debt
3. The liquidated collateral is distributed pro-rata to all depositors
4. Since collateral is received at 110% ratio but valued at market price, depositors profit
5. OEC emissions are distributed continuously to depositors

## User Functions

| Function                 | Description                              |
| ------------------------ | ---------------------------------------- |
| `depositALUD(amount)`    | Deposit ALUD to the pool                 |
| `withdrawALUD(amount)`   | Withdraw ALUD from the pool              |
| `claimCollateralGains()` | Claim accumulated collateral from liquidations |
| `claimOECRewards()`      | Claim accumulated OEC emissions          |

## Read Functions

| Function                              | Returns                                    |
| ------------------------------------- | ------------------------------------------ |
| `getStabilityPoolStats()`             | Total deposits, OEC balance/released       |
| `getUserStabilityPoolPosition(owner)` | Deposit, gain tokens, gain amounts, pending OEC |

## Earnings

Stability Pool depositors earn from two sources:

| Source              | Asset Received | How                                    |
| ------------------- | -------------- | -------------------------------------- |
| Liquidation gains   | WBTC/WETH/LINK | Pro-rata share of liquidated collateral|
| Protocol emissions  | OEC            | Continuous distribution from EmissionsVault |

{% hint style="info" %}
**Net Positive:** Even though your ALUD is burned during liquidations, you receive collateral worth more than the ALUD burned (because troves are liquidated at 110% ratio). The net result is typically a profit.
{% endhint %}

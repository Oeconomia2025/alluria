# Stability Pool

Deposit ALUD for liquidation insurance, earn collateral gains and OEC rewards.

**Source:** `client/src/pages/stability-pool.tsx`

## Overview

The Stability Pool page lets users deposit and withdraw ALUD, claim accumulated collateral gains from liquidations, and claim OEC governance token emissions.

## Features

### Deposit ALUD

Enter an amount of ALUD to deposit. Your deposit provides liquidation insurance for the protocol — when troves are liquidated, your ALUD helps absorb the debt.

### Withdraw ALUD

Withdraw some or all of your deposited ALUD back to your wallet.

### Claim Collateral Gains

When liquidations occur, depositors receive the liquidated collateral proportional to their share of the pool. Gains accumulate across all three collateral types (WBTC, WETH, LINK).

### Claim OEC Rewards

OEC governance tokens are emitted continuously to Stability Pool depositors from the EmissionsVault contract.

## Display

| Field              | Description                              |
| ------------------ | ---------------------------------------- |
| Total Pool Size    | All ALUD deposited across all users      |
| Your Deposit       | Your ALUD in the pool                    |
| Your Share %       | deposit / totalPool × 100               |
| Pending Collateral | Accumulated gains by token type          |
| Pending OEC        | Accumulated OEC emissions                |

# Deposit & Borrow

Open a trove by depositing collateral and borrowing ALUD stablecoin.

**Source:** `client/src/pages/deposit.tsx`

## Overview

The Deposit page allows users to open new collateralized debt positions (troves) or add to existing ones. Users select a collateral type, deposit an amount, and borrow ALUD against it.

## Supported Collateral

| Token | Min Ratio | Oracle     |
| ----- | --------- | ---------- |
| WBTC  | 110%      | Chainlink  |
| WETH  | 110%      | Chainlink  |
| LINK  | 110%      | Chainlink  |

## Open Trove Flow

1. Select collateral type (WBTC, WETH, or LINK)
2. Enter collateral amount to deposit
3. Enter ALUD amount to borrow
4. Review:
   - Collateral ratio (must be > 110%, recommended > 150%)
   - Liquidation price
   - Health factor
5. Approve token spending if needed
6. Click **Open Trove** and confirm transaction

## UI Elements

- **Collateral selector** — Toggle between WBTC, WETH, LINK
- **Amount inputs** with percentage quick-select (25%, 50%, 75%, 100%)
- **Ratio indicator** — Color-coded (red < 120%, yellow 120-150%, green > 150%)
- **Liquidation price** — Red alert box showing at what price you'd be liquidated
- **Existing positions sidebar** — Shows your active troves if any

## Adding to Existing Troves

If you already have a trove for a collateral type:
- **Add Collateral** — Deposit more to improve ratio
- **Borrow More** — Mint additional ALUD (ratio must stay > 110%)

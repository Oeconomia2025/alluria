# Dashboard

Protocol overview with TVL, positions, and analytics charts.

**Source:** `client/src/pages/lend.tsx`

## Overview

The Dashboard (Lend page) is the landing page showing protocol-wide metrics, user positions, and analytics charts. Data refreshes every 15 seconds.

## Protocol Stats

| Metric              | Source                        |
| ------------------- | ----------------------------- |
| Total Value Locked  | `AluriaLens.getSystemStats()` |
| Total ALUD Borrowed | `AluriaLens.getSystemStats()` |
| System Collateral Ratio | Aggregate across all troves |
| Stability Pool Size | `getStabilityPoolStats()`     |

## User Positions

If connected, shows all open troves:
- Collateral type and amount
- ALUD debt
- Collateral ratio (color-coded)
- Liquidation price
- Health factor

## Charts

Six dashboard charts built with Recharts:

| Chart                      | Type       | Data                      |
| -------------------------- | ---------- | ------------------------- |
| TVL Over Time              | Area       | 30-day protocol TVL       |
| Collateral Distribution    | Donut/Pie  | WBTC vs WETH vs LINK      |
| ALUR Price                 | Area       | 30-day ALUR price history |
| ALUD Supply & Peg          | Area       | ALUD supply over time     |
| Daily Liquidations         | Bar        | Liquidation volume        |
| Liquidations by Collateral | Pie        | Which collateral types    |

{% hint style="info" %}
**Mock Data:** Dashboard charts currently use 30-day mock data for UI development. Production charts will source from an event indexer.
{% endhint %}

## Price Ticker

Sticky top bar displaying live prices:
- ALUR (from Eloqura DEX pool)
- ALUD ($1.00 peg)
- WETH, WBTC, LINK (from Chainlink Sepolia feeds)

Updates every 60 seconds.

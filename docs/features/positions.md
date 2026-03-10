# Positions Table

Global view of all active lending positions with risk filtering.

**Source:** `client/src/pages/positions.tsx`

## Overview

The Positions page shows a table of all active troves across the protocol, sortable and filterable by risk level.

## Table Columns

| Column           | Description                          |
| ---------------- | ------------------------------------ |
| Wallet           | Trove owner address                  |
| Collateral       | Token type (WBTC/WETH/LINK)         |
| Collateral Value | USD value of deposited collateral    |
| ALUD Debt        | Amount of ALUD borrowed              |
| Ratio            | Collateral ratio (%)                 |
| Status           | Risk level badge                     |

## Risk Filters

| Filter      | Ratio Range | Color   |
| ----------- | ----------- | ------- |
| Critical    | < 120%      | Red     |
| At Risk     | 120% - 150% | Orange  |
| Moderate    | 150% - 175% | Yellow  |
| Healthy     | 175% - 200% | Green   |
| Very Safe   | > 200%      | Emerald |

## Distribution Bar

A visual bar at the top shows the proportion of troves in each risk category, giving an at-a-glance view of overall protocol health.

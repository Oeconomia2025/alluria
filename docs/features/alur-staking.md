# ALUR Staking

Stake ALUR governance tokens to earn protocol fees.

**Source:** `client/src/pages/alur-staking.tsx`

## Overview

ALUR holders can stake their tokens to receive a share of protocol fees generated from borrowing and redemption operations.

## Display

| Field            | Description                      |
| ---------------- | -------------------------------- |
| Staking APY      | Current estimated yield (8.7%)   |
| Total Staked     | All ALUR staked across users     |
| Your Stake       | Your staked ALUR balance         |
| Claimable Fees   | Accumulated unclaimed fees       |

## Actions

- **Stake** — Deposit ALUR tokens to start earning
- **Unstake** — Withdraw staked ALUR
- **Claim Fees** — Collect accumulated protocol fees

## Fee Sources

Protocol fees flow to ALUR stakers from:
- Borrowing fees (when new ALUD is minted)
- Redemption fees (0.5% on ALUD → collateral redemptions)

# Tokens (ALUD & ALUR)

The two native tokens of the Alluria protocol.

## ALUD — Stablecoin

**Address (Sepolia):** `0x41B07704b9d671615A3E9f83c06D85CB38bbf4D9`

| Property   | Value                           |
| ---------- | ------------------------------- |
| Name       | Alluria Dollar                  |
| Symbol     | ALUD                            |
| Decimals   | 18                              |
| Peg        | $1.00 USD                       |
| Type       | CDP-backed stablecoin           |

**Minting:** ALUD is minted when users borrow against their collateral by opening or expanding a trove.

**Burning:** ALUD is burned when users repay debt, or when the Stability Pool absorbs liquidated trove debt.

**Redemption:** ALUD holders can redeem 1 ALUD for $1 worth of collateral (minus 0.5% fee) at any time, ensuring the peg holds.

## ALUR — Governance Token

| Property   | Value                           |
| ---------- | ------------------------------- |
| Name       | Alluria                         |
| Symbol     | ALUR                            |
| Decimals   | 18                              |
| Type       | Governance & fee-sharing token  |

**Staking:** ALUR holders can stake their tokens to earn a share of protocol fees generated from borrowing and redemptions.

**Price Feed:** ALUR price is derived from the Eloqura DEX ALUR/USDC pool reserves.

## Token Interactions

```
Collateral deposited → ALUD minted (borrow)
ALUD repaid → ALUD burned (close debt)
ALUD redeemed → Collateral returned (0.5% fee)
ALUD in Stability Pool → Absorbs liquidation debt
ALUR staked → Earns protocol fees
```

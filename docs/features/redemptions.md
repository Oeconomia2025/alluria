# Redemptions

Redeem ALUD for collateral at face value.

**Source:** `client/src/pages/redemptions.tsx`

## Overview

Any ALUD holder can redeem their tokens for $1 worth of collateral at any time. This mechanism helps maintain the ALUD peg — if ALUD drops below $1, arbitrageurs can buy it cheap and redeem for $1 of collateral.

## How It Works

1. Select which collateral to receive (WBTC, WETH, or LINK)
2. Enter ALUD amount to redeem
3. Preview the collateral amount you'll receive (minus 0.5% fee)
4. Confirm transaction

## Fee

| Parameter | Value |
| --------- | ----- |
| Redemption fee | 0.5% |

The fee is deducted from the collateral received. For example, redeeming 100 ALUD for WETH:
- $100 worth of WETH at market price
- Minus 0.5% fee = $99.50 worth of WETH received

## Redemption Target

Redemptions pull collateral from the trove with the **lowest collateral ratio** first, incentivizing all borrowers to maintain healthy ratios.

{% hint style="info" %}
**Peg Mechanism:** Redemptions are the primary mechanism keeping ALUD pegged to $1. If ALUD trades below $1, redemption becomes profitable, creating buy pressure until the peg is restored.
{% endhint %}

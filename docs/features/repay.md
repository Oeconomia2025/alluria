# Repay & Close

Repay ALUD debt or close troves entirely.

**Source:** `client/src/pages/repay.tsx`

## Overview

The Repay page lets users pay back borrowed ALUD to improve their collateral ratio or fully close a position to reclaim all collateral.

## Partial Repay

1. Select the trove (collateral type)
2. Enter ALUD amount to repay
3. Preview updated ratio and health factor
4. Confirm transaction

Partial repayment improves your collateral ratio without closing the position.

## Full Close

1. Select the trove to close
2. The full ALUD debt amount is shown
3. Confirm — all ALUD debt is burned and collateral is returned

{% hint style="info" %}
**ALUD Required:** You must hold enough ALUD in your wallet to cover the repayment amount. If you've traded or deposited your ALUD elsewhere, you'll need to acquire it back first.
{% endhint %}

## Display

- Current debt and collateral for each trove
- New ratio after repayment (preview)
- Health factor change
- Remaining debt after partial repay

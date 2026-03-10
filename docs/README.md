# Alluria Protocol

Decentralized lending protocol for the Oeconomia ecosystem. Deposit collateral, mint ALUD stablecoin, earn liquidation gains in the Stability Pool, and stake ALUR for protocol fees.

**Live:** [https://alluria.oeconomia.io](https://alluria.oeconomia.io)

## Key Features

| Feature          | Description                                                        |
| ---------------- | ------------------------------------------------------------------ |
| Multi-Collateral | Deposit WBTC, WETH, or LINK as collateral                         |
| ALUD Stablecoin  | Mint ALUD pegged to $1 against your collateral                     |
| 110% Min Ratio   | Capital-efficient borrowing with low collateral requirements       |
| Stability Pool   | Deposit ALUD to earn liquidation gains + OEC rewards               |
| ALUR Staking     | Stake governance token to earn protocol fees                       |
| Redemptions      | Redeem ALUD for collateral at face value (0.5% fee)               |
| Liquidations     | Automatic liquidation below 110% ratio via Stability Pool          |

## Contract Addresses (Sepolia)

| Contract           | Address                                      |
| ------------------ | -------------------------------------------- |
| TroveManager       | `0x90CCA7d8B6cAb91d53e384E3c0cD3Ba34b7B8Cc2` |
| StabilityPool      | `0xB61a71C78e10C0C92e2dFF457C9F87dC71260c43` |
| CollateralManager  | `0x6423C894371992594a7fE8e2e0E65BEF4EE5cABb` |
| PriceFeed          | `0x79A91c7659AA69A5F8722aB3786D44D367ADEeFe` |
| ALUD Token         | `0x41B07704b9d671615A3E9f83c06D85CB38bbf4D9` |
| AluriaLens         | `0x150485AC97153Ac772D43736564ccf7122d92bcf` |
| EmissionsVault     | `0x3b62AF3344830690770156033D127dE7186Cd9a1` |

## Tech Stack

| Layer      | Technology                                              |
| ---------- | ------------------------------------------------------- |
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS, Recharts      |
| Routing    | Wouter                                                  |
| Web3       | Wagmi 2, Viem 2                                         |
| State      | TanStack Query (React Query)                            |
| UI         | Radix UI (shadcn/ui), Lucide React, Framer Motion       |
| Oracles    | Chainlink (WBTC/WETH/LINK), Eloqura DEX (ALUR)         |
| Deployment | Netlify                                                 |

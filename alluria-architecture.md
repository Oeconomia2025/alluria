# Architecture & Scaffold

High-level overview of the Alluria lending protocol architecture and contract interactions.

## System Diagram

```
┌───────────────────────────────────────────────────────────┐
│                     React Frontend                         │
│  (Vite + TypeScript + Tailwind + Wagmi + Recharts)         │
│                                                            │
│  Dashboard │ Deposit │ Repay │ Stability │ Staking │ ...   │
└───┬────────────────────────────────────┬───────────────────┘
    │                                    │
    │  Contract Reads/Writes             │  Price Feeds
    │  (Wagmi / Viem)                    │  (Chainlink + Eloqura)
    ▼                                    ▼
┌────────────────────────┐    ┌──────────────────────────┐
│  Sepolia RPC (Alchemy) │    │  Price Oracles           │
│                        │    │                          │
│  ┌──────────────────┐  │    │  Chainlink Sepolia       │
│  │ TroveManager     │  │    │  - WETH/USD              │
│  │ 0x90CC...        │  │    │  - WBTC/USD              │
│  └──────────────────┘  │    │  - LINK/USD              │
│  ┌──────────────────┐  │    │                          │
│  │ StabilityPool    │  │    │  Eloqura DEX Pool        │
│  │ 0xB61a...        │  │    │  - ALUR/USDC reserves    │
│  └──────────────────┘  │    └──────────────────────────┘
│  ┌──────────────────┐  │
│  │ CollateralManager│  │
│  │ 0x6423...        │  │
│  └──────────────────┘  │
│  ┌──────────────────┐  │
│  │ AluriaLens       │  │
│  │ 0x1504...        │  │
│  └──────────────────┘  │
│  ┌──────────────────┐  │
│  │ ALUD Token       │  │
│  │ 0x41B0...        │  │
│  └──────────────────┘  │
└────────────────────────┘
```

## Lending Flow

```
User deposits collateral (WBTC, WETH, or LINK)
        │
        ▼
Opens a Trove (min 110% collateral ratio)
        │
        ▼
Mints ALUD stablecoin (pegged to $1)
        │
        ├── Use ALUD in DeFi (trade, LP, etc.)
        ├── Deposit ALUD in Stability Pool (earn liquidation gains + OEC)
        └── Repay ALUD debt to close trove and reclaim collateral
```

## Frontend Structure

```
client/src/
├── pages/
│   ├── lend.tsx              # Dashboard: TVL, positions, charts
│   ├── deposit.tsx           # Open trove & borrow ALUD
│   ├── repay.tsx             # Repay debt & close position
│   ├── stability-pool.tsx    # Deposit ALUD for gains + OEC
│   ├── alur-staking.tsx      # Stake ALUR for protocol fees
│   ├── redemptions.tsx       # Redeem ALUD for collateral
│   └── positions.tsx         # Global position table
├── components/
│   ├── layout.tsx            # Collapsible sidebar layout
│   ├── wallet-connect.tsx    # Multi-wallet connection
│   ├── ecosystem-sidebar.tsx # Right-edge protocol links
│   └── ui/                   # shadcn/ui components
├── hooks/
│   ├── use-alluria.ts        # Protocol state (polls every 15s)
│   └── use-alluria-actions.ts # Write transactions
├── services/
│   └── alluria-contracts.ts  # ABIs, addresses, read/write helpers
└── App.tsx                   # Router and providers
```

## Key Design Decisions

- **Liquity-style CDP model**: Collateralized debt positions with 110% minimum ratio
- **Multi-collateral**: WBTC, WETH, and LINK supported (unlike Liquity's ETH-only)
- **AluriaLens contract**: Single read-only contract aggregates all protocol stats to minimize RPC calls
- **15-second polling**: `use-alluria.ts` hook refreshes all protocol state every 15 seconds
- **Chainlink + Eloqura oracles**: Collateral priced via Chainlink, ALUR priced via Eloqura DEX pool

# Quick Start

Get Alluria Protocol running locally for development.

## Prerequisites

- Node.js 20+
- npm
- MetaMask or compatible wallet configured for Sepolia testnet

## Installation

```bash
cd alluria-claude-workspace
npm install
```

## Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5000`.

## Your First Trove

1. Connect your wallet to Sepolia testnet
2. Navigate to **Deposit & Borrow**
3. Select collateral type (WBTC, WETH, or LINK)
4. Enter collateral amount and ALUD to borrow
5. Ensure your ratio is above 110% (150%+ recommended)
6. Click **Open Trove** and confirm the transaction
7. Your ALUD will appear in your wallet

## Production Build

```bash
npx vite build --config vite.config.netlify.ts
```

Outputs to `dist/public/` for Netlify deployment. See [Deploy Guide](../deployment/deploy-guide.md).

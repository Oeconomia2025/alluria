# Environment Variables

Configuration for the Alluria Protocol frontend.

## Required

| Variable                        | Description                    | Required |
| ------------------------------- | ------------------------------ | -------- |
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud project ID | Yes      |

## Notes

- Alluria is a pure client-side dApp — no database or API keys required
- Contract addresses are hardcoded in `client/src/services/alluria-contracts.ts`
- Price feeds come directly from Chainlink oracles and Eloqura DEX pools on-chain
- To update contract addresses after redeployment, edit the contracts file and rebuild

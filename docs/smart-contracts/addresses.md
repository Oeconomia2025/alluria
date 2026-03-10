# Contract Addresses

All deployed contract addresses for the Alluria lending protocol.

## Core Contracts (Sepolia)

| Contract           | Address                                      | Description                    |
| ------------------ | -------------------------------------------- | ------------------------------ |
| TroveManager       | `0x90CCA7d8B6cAb91d53e384E3c0cD3Ba34b7B8Cc2` | Position management & liquidation |
| StabilityPool      | `0xB61a71C78e10C0C92e2dFF457C9F87dC71260c43` | ALUD deposits for liquidation insurance |
| CollateralManager  | `0x6423C894371992594a7fE8e2e0E65BEF4EE5cABb` | Collateral whitelisting & params |
| PriceFeed          | `0x79A91c7659AA69A5F8722aB3786D44D367ADEeFe` | Chainlink oracle aggregation |
| AluriaLens         | `0x150485AC97153Ac772D43736564ccf7122d92bcf` | Read-only aggregate data |
| EmissionsVault     | `0x3b62AF3344830690770156033D127dE7186Cd9a1` | OEC reward distribution |

## Token Contracts (Sepolia)

| Token | Address                                      | Decimals | Description        |
| ----- | -------------------------------------------- | -------- | ------------------ |
| ALUD  | `0x41B07704b9d671615A3E9f83c06D85CB38bbf4D9` | 18       | Stablecoin ($1)    |
| ALUR  | *(governance token)*                          | 18       | Protocol governance |

## Supported Collateral (Sepolia)

| Token | Address                                      | Decimals | Oracle         |
| ----- | -------------------------------------------- | -------- | -------------- |
| WBTC  | `0x29f2D40B0605204364af54EC677bD022dA425d03` | 8        | Chainlink      |
| WETH  | `0x34b11F6b8f78fa010bBCA71bC7FE79dAa811b89f` | 18       | Chainlink      |
| LINK  | `0x779877A7B0D9E8603169DdbD7836e478b4624789` | 18       | Chainlink      |

## ABI Source

All contract ABIs and read/write helpers are defined in `client/src/services/alluria-contracts.ts`.

{% hint style="warning" %}
**Testnet Only:** All contracts are currently deployed to Sepolia. Mainnet deployment addresses will be added after launch.
{% endhint %}

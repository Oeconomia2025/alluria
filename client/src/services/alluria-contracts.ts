import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  formatUnits,
  parseUnits,
  maxUint256,
  type Address,
  type PublicClient,
  type WalletClient,
} from "viem";
import { sepolia } from "viem/chains";

export type { Address } from "viem";

// =============================================================================
// Contract Addresses — TODO: Replace with deployed addresses
// =============================================================================

export const CONTRACTS = {
  TroveManager: "0x0000000000000000000000000000000000000000" as Address,
  StabilityPool: "0x0000000000000000000000000000000000000000" as Address,
  CollateralManager: "0x0000000000000000000000000000000000000000" as Address,
  PriceFeed: "0x0000000000000000000000000000000000000000" as Address,
  ALUD: "0x0000000000000000000000000000000000000000" as Address,
  AluriaLens: "0x0000000000000000000000000000000000000000" as Address,
  EmissionsVault: "0x0000000000000000000000000000000000000000" as Address,
} as const;

export const PLACEHOLDER_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

export function isPlaceholderAddress(addr: Address): boolean {
  return addr === PLACEHOLDER_ADDRESS;
}

export function areContractsDeployed(): boolean {
  return !isPlaceholderAddress(CONTRACTS.TroveManager);
}

// =============================================================================
// Collateral Token Metadata
// =============================================================================

export interface CollateralTokenMeta {
  symbol: string;
  name: string;
  address: Address;
  decimals: number;
  logo: string;
}

export const COLLATERAL_TOKENS: CollateralTokenMeta[] = [
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    address: "0x0000000000000000000000000000000000000000" as Address, // TODO: deployed address
    decimals: 8,
    logo: "https://tokens.1inch.io/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png",
  },
  {
    symbol: "WETH",
    name: "Wrapped Ethereum",
    address: "0x0000000000000000000000000000000000000000" as Address, // TODO: deployed address
    decimals: 18,
    logo: "https://tokens.1inch.io/0x2170ed0880ac9a755fd29b2688956bd959f933f8.png",
  },
  {
    symbol: "WBNB",
    name: "Wrapped BNB",
    address: "0x0000000000000000000000000000000000000000" as Address, // TODO: deployed address
    decimals: 18,
    logo: "https://tokens.1inch.io/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c.png",
  },
];

export function getCollateralMeta(address: Address): CollateralTokenMeta | undefined {
  return COLLATERAL_TOKENS.find(
    (t) => t.address.toLowerCase() === address.toLowerCase()
  );
}

// =============================================================================
// Minimal ABIs (as const for viem type safety)
// =============================================================================

export const AluriaLensABI = [
  {
    inputs: [],
    name: "getSystemStats",
    outputs: [
      {
        components: [
          { name: "totalALUDSupply", type: "uint256" },
          { name: "totalCollateralValueUSD", type: "uint256" },
          { name: "stabilityPoolDeposits", type: "uint256" },
          { name: "oecVaultBalance", type: "uint256" },
          { name: "oecTotalReleased", type: "uint256" },
        ],
        name: "stats",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "getAllUserTroves",
    outputs: [
      {
        components: [
          { name: "collateral", type: "address" },
          { name: "collateralAmount", type: "uint256" },
          { name: "debt", type: "uint256" },
          { name: "collateralRatio", type: "uint256" },
          { name: "liquidationPrice", type: "uint256" },
          { name: "collateralValueUSD", type: "uint256" },
        ],
        name: "infos",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "collateral", type: "address" }],
    name: "getCollateralStats",
    outputs: [
      {
        components: [
          { name: "collateral", type: "address" },
          { name: "totalCollateral", type: "uint256" },
          { name: "totalDebt", type: "uint256" },
          { name: "totalCollateralValueUSD", type: "uint256" },
          { name: "price", type: "uint256" },
          { name: "minCollateralRatio", type: "uint256" },
          { name: "liquidationRatio", type: "uint256" },
        ],
        name: "stats",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getStabilityPoolStats",
    outputs: [
      { name: "deposits", type: "uint256" },
      { name: "oecBalance", type: "uint256" },
      { name: "oecReleased", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "getUserStabilityPoolPosition",
    outputs: [
      {
        components: [
          { name: "deposit", type: "uint256" },
          { name: "gainTokens", type: "address[]" },
          { name: "gainAmounts", type: "uint256[]" },
          { name: "pendingOEC", type: "uint256" },
        ],
        name: "position",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const TroveManagerABI = [
  {
    inputs: [
      { name: "collateral", type: "address" },
      { name: "collateralAmount", type: "uint256" },
      { name: "alud_amount", type: "uint256" },
    ],
    name: "openTrove",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "collateral", type: "address" }],
    name: "closeTrove",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "collateral", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "addCollateral",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "collateral", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "removeCollateral",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "collateral", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "mintALUD",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "collateral", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "repayALUD",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "collateral", type: "address" },
      { name: "alud_amount", type: "uint256" },
      { name: "troveOwner", type: "address" },
    ],
    name: "redeemCollateral",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "", type: "address" },
      { name: "", type: "address" },
    ],
    name: "troves",
    outputs: [
      { name: "collateralAmount", type: "uint256" },
      { name: "debt", type: "uint256" },
      { name: "openedAt", type: "uint256" },
      { name: "exists", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const StabilityPoolABI = [
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "depositALUD",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "withdrawALUD",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "claimCollateralGains",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "claimOECRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "address" }],
    name: "deposits",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalDeposits",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "depositor", type: "address" }],
    name: "getDepositorGains",
    outputs: [
      { name: "tokens", type: "address[]" },
      { name: "amounts", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "depositor", type: "address" }],
    name: "getDepositorOECRewards",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const CollateralManagerABI = [
  {
    inputs: [{ name: "collateral", type: "address" }],
    name: "getCollateralParams",
    outputs: [
      {
        components: [
          { name: "exists", type: "bool" },
          { name: "paused", type: "bool" },
          { name: "minCollateralRatio", type: "uint256" },
          { name: "liquidationRatio", type: "uint256" },
          { name: "borrowingFee", type: "uint256" },
          { name: "liquidationBonus", type: "uint256" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getSupportedCollaterals",
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "collateral", type: "address" }],
    name: "isCollateralActive",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const PriceFeedABI = [
  {
    inputs: [{ name: "collateral", type: "address" }],
    name: "getPrice",
    outputs: [{ name: "price", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const ERC20ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// =============================================================================
// Viem Clients
// =============================================================================

let _publicClient: PublicClient | null = null;

export function getPublicClient(): PublicClient {
  if (!_publicClient) {
    _publicClient = createPublicClient({
      chain: sepolia,
      transport: http(),
    });
  }
  return _publicClient;
}

export function getWalletClient(): WalletClient {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No wallet provider found");
  }
  return createWalletClient({
    chain: sepolia,
    transport: custom(window.ethereum),
  });
}

// =============================================================================
// Types
// =============================================================================

export interface SystemStats {
  totalALUDSupply: bigint;
  totalCollateralValueUSD: bigint;
  stabilityPoolDeposits: bigint;
  oecVaultBalance: bigint;
  oecTotalReleased: bigint;
}

export interface TroveInfo {
  collateral: Address;
  collateralAmount: bigint;
  debt: bigint;
  collateralRatio: bigint;
  liquidationPrice: bigint;
  collateralValueUSD: bigint;
}

export interface CollateralStats {
  collateral: Address;
  totalCollateral: bigint;
  totalDebt: bigint;
  totalCollateralValueUSD: bigint;
  price: bigint;
  minCollateralRatio: bigint;
  liquidationRatio: bigint;
}

export interface StabilityPoolStats {
  totalDeposits: bigint;
  oecBalance: bigint;
  oecReleased: bigint;
}

export interface UserStabilityPosition {
  deposit: bigint;
  gainTokens: readonly Address[];
  gainAmounts: readonly bigint[];
  pendingOEC: bigint;
}

export interface CollateralParams {
  exists: boolean;
  paused: boolean;
  minCollateralRatio: bigint;
  liquidationRatio: bigint;
  borrowingFee: bigint;
  liquidationBonus: bigint;
}

// =============================================================================
// Read Functions
// =============================================================================

export async function getSystemStats(): Promise<SystemStats> {
  const client = getPublicClient();
  const result = await client.readContract({
    address: CONTRACTS.AluriaLens,
    abi: AluriaLensABI,
    functionName: "getSystemStats",
  });
  return result as unknown as SystemStats;
}

export async function getUserTroves(owner: Address): Promise<TroveInfo[]> {
  const client = getPublicClient();
  const result = await client.readContract({
    address: CONTRACTS.AluriaLens,
    abi: AluriaLensABI,
    functionName: "getAllUserTroves",
    args: [owner],
  });
  return result as unknown as TroveInfo[];
}

export async function getCollateralStatsForToken(
  collateral: Address
): Promise<CollateralStats> {
  const client = getPublicClient();
  const result = await client.readContract({
    address: CONTRACTS.AluriaLens,
    abi: AluriaLensABI,
    functionName: "getCollateralStats",
    args: [collateral],
  });
  return result as unknown as CollateralStats;
}

export async function getStabilityPoolStats(): Promise<StabilityPoolStats> {
  const client = getPublicClient();
  const [deposits, oecBalance, oecReleased] = await client.readContract({
    address: CONTRACTS.AluriaLens,
    abi: AluriaLensABI,
    functionName: "getStabilityPoolStats",
  });
  return { totalDeposits: deposits, oecBalance, oecReleased };
}

export async function getUserStabilityPoolPosition(
  owner: Address
): Promise<UserStabilityPosition> {
  const client = getPublicClient();
  const result = await client.readContract({
    address: CONTRACTS.AluriaLens,
    abi: AluriaLensABI,
    functionName: "getUserStabilityPoolPosition",
    args: [owner],
  });
  return result as unknown as UserStabilityPosition;
}

export async function getALUDBalance(account: Address): Promise<bigint> {
  const client = getPublicClient();
  return client.readContract({
    address: CONTRACTS.ALUD,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: [account],
  });
}

export async function getTokenBalance(
  token: Address,
  account: Address
): Promise<bigint> {
  const client = getPublicClient();
  return client.readContract({
    address: token,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: [account],
  });
}

export async function getTokenAllowance(
  token: Address,
  owner: Address,
  spender: Address
): Promise<bigint> {
  const client = getPublicClient();
  return client.readContract({
    address: token,
    abi: ERC20ABI,
    functionName: "allowance",
    args: [owner, spender],
  });
}

export async function getCollateralPrice(collateral: Address): Promise<bigint> {
  const client = getPublicClient();
  return client.readContract({
    address: CONTRACTS.PriceFeed,
    abi: PriceFeedABI,
    functionName: "getPrice",
    args: [collateral],
  });
}

export async function getCollateralParams(
  collateral: Address
): Promise<CollateralParams> {
  const client = getPublicClient();
  const result = await client.readContract({
    address: CONTRACTS.CollateralManager,
    abi: CollateralManagerABI,
    functionName: "getCollateralParams",
    args: [collateral],
  });
  return result as unknown as CollateralParams;
}

// =============================================================================
// Write Functions
// =============================================================================

async function getAccount(): Promise<Address> {
  const wallet = getWalletClient();
  const [address] = await wallet.requestAddresses();
  return address;
}

export async function approveToken(
  token: Address,
  spender: Address,
  amount?: bigint
): Promise<`0x${string}`> {
  const wallet = getWalletClient();
  const account = await getAccount();
  const hash = await wallet.writeContract({
    address: token,
    abi: ERC20ABI,
    functionName: "approve",
    args: [spender, amount ?? maxUint256],
    account,
    chain: sepolia,
  });
  const client = getPublicClient();
  await client.waitForTransactionReceipt({ hash });
  return hash;
}

export async function openTrove(
  collateral: Address,
  collateralAmount: bigint,
  aludAmount: bigint
): Promise<`0x${string}`> {
  const wallet = getWalletClient();
  const account = await getAccount();
  const hash = await wallet.writeContract({
    address: CONTRACTS.TroveManager,
    abi: TroveManagerABI,
    functionName: "openTrove",
    args: [collateral, collateralAmount, aludAmount],
    account,
    chain: sepolia,
  });
  const client = getPublicClient();
  await client.waitForTransactionReceipt({ hash });
  return hash;
}

export async function closeTrove(
  collateral: Address
): Promise<`0x${string}`> {
  const wallet = getWalletClient();
  const account = await getAccount();
  const hash = await wallet.writeContract({
    address: CONTRACTS.TroveManager,
    abi: TroveManagerABI,
    functionName: "closeTrove",
    args: [collateral],
    account,
    chain: sepolia,
  });
  const client = getPublicClient();
  await client.waitForTransactionReceipt({ hash });
  return hash;
}

export async function addCollateral(
  collateral: Address,
  amount: bigint
): Promise<`0x${string}`> {
  const wallet = getWalletClient();
  const account = await getAccount();
  const hash = await wallet.writeContract({
    address: CONTRACTS.TroveManager,
    abi: TroveManagerABI,
    functionName: "addCollateral",
    args: [collateral, amount],
    account,
    chain: sepolia,
  });
  const client = getPublicClient();
  await client.waitForTransactionReceipt({ hash });
  return hash;
}

export async function removeCollateral(
  collateral: Address,
  amount: bigint
): Promise<`0x${string}`> {
  const wallet = getWalletClient();
  const account = await getAccount();
  const hash = await wallet.writeContract({
    address: CONTRACTS.TroveManager,
    abi: TroveManagerABI,
    functionName: "removeCollateral",
    args: [collateral, amount],
    account,
    chain: sepolia,
  });
  const client = getPublicClient();
  await client.waitForTransactionReceipt({ hash });
  return hash;
}

export async function mintALUD(
  collateral: Address,
  amount: bigint
): Promise<`0x${string}`> {
  const wallet = getWalletClient();
  const account = await getAccount();
  const hash = await wallet.writeContract({
    address: CONTRACTS.TroveManager,
    abi: TroveManagerABI,
    functionName: "mintALUD",
    args: [collateral, amount],
    account,
    chain: sepolia,
  });
  const client = getPublicClient();
  await client.waitForTransactionReceipt({ hash });
  return hash;
}

export async function repayALUD(
  collateral: Address,
  amount: bigint
): Promise<`0x${string}`> {
  const wallet = getWalletClient();
  const account = await getAccount();
  const hash = await wallet.writeContract({
    address: CONTRACTS.TroveManager,
    abi: TroveManagerABI,
    functionName: "repayALUD",
    args: [collateral, amount],
    account,
    chain: sepolia,
  });
  const client = getPublicClient();
  await client.waitForTransactionReceipt({ hash });
  return hash;
}

export async function redeemCollateral(
  collateral: Address,
  aludAmount: bigint,
  troveOwner: Address
): Promise<`0x${string}`> {
  const wallet = getWalletClient();
  const account = await getAccount();
  const hash = await wallet.writeContract({
    address: CONTRACTS.TroveManager,
    abi: TroveManagerABI,
    functionName: "redeemCollateral",
    args: [collateral, aludAmount, troveOwner],
    account,
    chain: sepolia,
  });
  const client = getPublicClient();
  await client.waitForTransactionReceipt({ hash });
  return hash;
}

export async function depositToStabilityPool(
  amount: bigint
): Promise<`0x${string}`> {
  const wallet = getWalletClient();
  const account = await getAccount();
  const hash = await wallet.writeContract({
    address: CONTRACTS.StabilityPool,
    abi: StabilityPoolABI,
    functionName: "depositALUD",
    args: [amount],
    account,
    chain: sepolia,
  });
  const client = getPublicClient();
  await client.waitForTransactionReceipt({ hash });
  return hash;
}

export async function withdrawFromStabilityPool(
  amount: bigint
): Promise<`0x${string}`> {
  const wallet = getWalletClient();
  const account = await getAccount();
  const hash = await wallet.writeContract({
    address: CONTRACTS.StabilityPool,
    abi: StabilityPoolABI,
    functionName: "withdrawALUD",
    args: [amount],
    account,
    chain: sepolia,
  });
  const client = getPublicClient();
  await client.waitForTransactionReceipt({ hash });
  return hash;
}

export async function claimCollateralGains(): Promise<`0x${string}`> {
  const wallet = getWalletClient();
  const account = await getAccount();
  const hash = await wallet.writeContract({
    address: CONTRACTS.StabilityPool,
    abi: StabilityPoolABI,
    functionName: "claimCollateralGains",
    args: [],
    account,
    chain: sepolia,
  });
  const client = getPublicClient();
  await client.waitForTransactionReceipt({ hash });
  return hash;
}

export async function claimOECRewards(): Promise<`0x${string}`> {
  const wallet = getWalletClient();
  const account = await getAccount();
  const hash = await wallet.writeContract({
    address: CONTRACTS.StabilityPool,
    abi: StabilityPoolABI,
    functionName: "claimOECRewards",
    args: [],
    account,
    chain: sepolia,
  });
  const client = getPublicClient();
  await client.waitForTransactionReceipt({ hash });
  return hash;
}

// =============================================================================
// Formatting Helpers
// =============================================================================

const ALUD_DECIMALS = 18;
const USD_DECIMALS = 18; // PriceFeed returns 18-decimal USD values

export function formatALUD(amount: bigint): string {
  return formatUnits(amount, ALUD_DECIMALS);
}

export function formatCollateral(amount: bigint, decimals: number): string {
  return formatUnits(amount, decimals);
}

export function formatUSD(amount: bigint): string {
  return formatUnits(amount, USD_DECIMALS);
}

export function parseALUD(amount: string): bigint {
  const safe = Number(amount).toFixed(ALUD_DECIMALS);
  return parseUnits(safe, ALUD_DECIMALS);
}

export function parseCollateralAmount(
  amount: string,
  decimals: number
): bigint {
  const safe = Number(amount).toFixed(decimals);
  return parseUnits(safe, decimals);
}

export function formatUSDDisplay(amount: bigint): string {
  const num = Number(formatUnits(amount, USD_DECIMALS));
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toFixed(2)}`;
}

export function formatRatio(ratioBps: bigint): string {
  // Ratios from contract are in basis points (e.g., 15000 = 150%)
  return (Number(ratioBps) / 100).toFixed(1);
}

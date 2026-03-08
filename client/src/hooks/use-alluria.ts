import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount } from "wagmi";
import {
  areContractsDeployed,
  getSystemStats,
  getUserTroves,
  getStabilityPoolStats,
  getUserStabilityPoolPosition,
  getALUDBalance,
  getTokenBalance,
  getCollateralPrice,
  getCollateralStatsForToken,
  COLLATERAL_TOKENS,
  type SystemStats,
  type TroveInfo,
  type StabilityPoolStats,
  type UserStabilityPosition,
  type CollateralStats,
  type Address,
} from "@/services/alluria-contracts";

const POLL_INTERVAL = 15_000; // 15 seconds

export interface CollateralPriceMap {
  [address: string]: bigint;
}

export interface CollateralBalanceMap {
  [address: string]: bigint;
}

export interface CollateralStatsMap {
  [address: string]: CollateralStats;
}

export interface AluriaState {
  // Protocol-wide
  systemStats: SystemStats | null;
  stabilityPoolStats: StabilityPoolStats | null;
  collateralPrices: CollateralPriceMap;
  collateralStatsMap: CollateralStatsMap;

  // User-specific (null when not connected)
  userTroves: TroveInfo[];
  aludBalance: bigint;
  collateralBalances: CollateralBalanceMap;
  userStabilityPosition: UserStabilityPosition | null;

  // Meta
  isLoading: boolean;
  isConnected: boolean;
  userAddress: Address | undefined;
  contractsDeployed: boolean;

  // Actions
  refetch: () => void;
}

export function useAlluria(): AluriaState {
  const { address, isConnected } = useAccount();
  const deployed = areContractsDeployed();

  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [stabilityPoolStats, setStabilityPoolStats] =
    useState<StabilityPoolStats | null>(null);
  const [collateralPrices, setCollateralPrices] = useState<CollateralPriceMap>(
    {}
  );
  const [collateralStatsMap, setCollateralStatsMap] =
    useState<CollateralStatsMap>({});
  const [userTroves, setUserTroves] = useState<TroveInfo[]>([]);
  const [aludBalance, setAludBalance] = useState<bigint>(BigInt(0));
  const [collateralBalances, setCollateralBalances] =
    useState<CollateralBalanceMap>({});
  const [userStabilityPosition, setUserStabilityPosition] =
    useState<UserStabilityPosition | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchProtocolData = useCallback(async () => {
    if (!deployed) return;

    try {
      const [stats, spStats] = await Promise.all([
        getSystemStats(),
        getStabilityPoolStats(),
      ]);
      setSystemStats(stats);
      setStabilityPoolStats(spStats);

      // Fetch per-collateral data
      const priceResults: CollateralPriceMap = {};
      const statsResults: CollateralStatsMap = {};

      await Promise.all(
        COLLATERAL_TOKENS.map(async (token) => {
          try {
            const [price, cStats] = await Promise.all([
              getCollateralPrice(token.address),
              getCollateralStatsForToken(token.address),
            ]);
            priceResults[token.address] = price;
            statsResults[token.address] = cStats;
          } catch {
            // Skip tokens that fail
          }
        })
      );

      setCollateralPrices(priceResults);
      setCollateralStatsMap(statsResults);
    } catch (err) {
      console.error("Failed to fetch protocol data:", err);
    }
  }, [deployed]);

  const fetchUserData = useCallback(async () => {
    if (!deployed || !address) return;

    try {
      const [troves, alud, spPosition] = await Promise.all([
        getUserTroves(address),
        getALUDBalance(address),
        getUserStabilityPoolPosition(address),
      ]);
      setUserTroves(troves as TroveInfo[]);
      setAludBalance(alud);
      setUserStabilityPosition(spPosition as UserStabilityPosition);

      // Fetch collateral balances
      const balances: CollateralBalanceMap = {};
      await Promise.all(
        COLLATERAL_TOKENS.map(async (token) => {
          try {
            balances[token.address] = await getTokenBalance(
              token.address,
              address
            );
          } catch {
            // Skip
          }
        })
      );
      setCollateralBalances(balances);
    } catch (err) {
      console.error("Failed to fetch user data:", err);
    }
  }, [deployed, address]);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchProtocolData(), fetchUserData()]);
    setIsLoading(false);
  }, [fetchProtocolData, fetchUserData]);

  // Initial fetch + polling
  useEffect(() => {
    fetchAll();

    intervalRef.current = setInterval(fetchAll, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchAll]);

  // Refetch when wallet connects/disconnects
  useEffect(() => {
    if (isConnected && address) {
      fetchUserData();
    } else {
      setUserTroves([]);
      setAludBalance(BigInt(0));
      setCollateralBalances({});
      setUserStabilityPosition(null);
    }
  }, [isConnected, address, fetchUserData]);

  return {
    systemStats,
    stabilityPoolStats,
    collateralPrices,
    collateralStatsMap,
    userTroves,
    aludBalance,
    collateralBalances,
    userStabilityPosition,
    isLoading,
    isConnected,
    userAddress: address as Address | undefined,
    contractsDeployed: deployed,
    refetch: fetchAll,
  };
}

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { toast } from "@/hooks/use-toast";
import {
  areContractsDeployed,
  getTokenAllowance,
  approveToken,
  openTrove as openTroveContract,
  closeTrove as closeTroveContract,
  addCollateral as addCollateralContract,
  removeCollateral as removeCollateralContract,
  mintALUD as mintALUDContract,
  repayALUD as repayALUDContract,
  redeemCollateral as redeemCollateralContract,
  depositToStabilityPool as depositToSPContract,
  withdrawFromStabilityPool as withdrawFromSPContract,
  claimCollateralGains as claimGainsContract,
  claimOECRewards as claimOECContract,
  parseALUD,
  parseCollateralAmount,
  CONTRACTS,
  type Address,
} from "@/services/alluria-contracts";

export type PendingTx = string | null; // name of the pending operation

export interface AluriaActions {
  pendingTx: PendingTx;
  openTrove: (
    collateral: Address,
    collateralAmount: string,
    aludAmount: string,
    collateralDecimals: number,
    onSuccess?: () => void
  ) => Promise<void>;
  closeTrove: (collateral: Address, onSuccess?: () => void) => Promise<void>;
  addCollateral: (
    collateral: Address,
    amount: string,
    decimals: number,
    onSuccess?: () => void
  ) => Promise<void>;
  removeCollateral: (
    collateral: Address,
    amount: string,
    decimals: number,
    onSuccess?: () => void
  ) => Promise<void>;
  mintALUD: (
    collateral: Address,
    amount: string,
    onSuccess?: () => void
  ) => Promise<void>;
  repayALUD: (
    collateral: Address,
    amount: string,
    onSuccess?: () => void
  ) => Promise<void>;
  depositToStabilityPool: (
    amount: string,
    onSuccess?: () => void
  ) => Promise<void>;
  withdrawFromStabilityPool: (
    amount: string,
    onSuccess?: () => void
  ) => Promise<void>;
  claimCollateralGains: (onSuccess?: () => void) => Promise<void>;
  claimOECRewards: (onSuccess?: () => void) => Promise<void>;
  redeemCollateral: (
    collateral: Address,
    aludAmount: string,
    troveOwner: Address,
    onSuccess?: () => void
  ) => Promise<void>;
}

export function useAluriaActions(): AluriaActions {
  const { address } = useAccount();
  const [pendingTx, setPendingTx] = useState<PendingTx>(null);

  const executeTx = useCallback(
    async (
      label: string,
      fn: () => Promise<`0x${string}`>,
      onSuccess?: () => void
    ) => {
      if (!areContractsDeployed()) {
        toast({
          title: "Contracts Not Deployed",
          description:
            "Protocol contracts are not yet deployed. Addresses are placeholder.",
          variant: "destructive",
        });
        return;
      }
      if (!address) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your wallet to proceed.",
          variant: "destructive",
        });
        return;
      }

      setPendingTx(label);
      try {
        await fn();
        toast({ title: "Transaction Confirmed", description: label });
        onSuccess?.();
      } catch (err: any) {
        const message =
          err?.shortMessage || err?.message || "Transaction failed";
        toast({
          title: "Transaction Failed",
          description: message,
          variant: "destructive",
        });
      } finally {
        setTimeout(() => setPendingTx(null), 3000);
      }
    },
    [address]
  );

  const ensureAllowance = useCallback(
    async (token: Address, spender: Address, amount: bigint) => {
      if (!address) return;
      const allowance = await getTokenAllowance(token, address, spender);
      if (allowance < amount) {
        toast({
          title: "Approving Token",
          description: "Please confirm the approval in your wallet...",
        });
        await approveToken(token, spender);
      }
    },
    [address]
  );

  const openTrove = useCallback(
    async (
      collateral: Address,
      collateralAmount: string,
      aludAmount: string,
      collateralDecimals: number,
      onSuccess?: () => void
    ) => {
      await executeTx(
        `Opened trove with ${collateralAmount} collateral`,
        async () => {
          const colAmt = parseCollateralAmount(
            collateralAmount,
            collateralDecimals
          );
          const aludAmt = parseALUD(aludAmount);
          await ensureAllowance(collateral, CONTRACTS.TroveManager, colAmt);
          return openTroveContract(collateral, colAmt, aludAmt);
        },
        onSuccess
      );
    },
    [executeTx, ensureAllowance]
  );

  const closeTrove = useCallback(
    async (collateral: Address, onSuccess?: () => void) => {
      await executeTx(
        "Closed trove",
        async () => closeTroveContract(collateral),
        onSuccess
      );
    },
    [executeTx]
  );

  const addCollateralAction = useCallback(
    async (
      collateral: Address,
      amount: string,
      decimals: number,
      onSuccess?: () => void
    ) => {
      await executeTx(
        `Added ${amount} collateral`,
        async () => {
          const amt = parseCollateralAmount(amount, decimals);
          await ensureAllowance(collateral, CONTRACTS.TroveManager, amt);
          return addCollateralContract(collateral, amt);
        },
        onSuccess
      );
    },
    [executeTx, ensureAllowance]
  );

  const removeCollateralAction = useCallback(
    async (
      collateral: Address,
      amount: string,
      decimals: number,
      onSuccess?: () => void
    ) => {
      await executeTx(
        `Removed ${amount} collateral`,
        async () => {
          const amt = parseCollateralAmount(amount, decimals);
          return removeCollateralContract(collateral, amt);
        },
        onSuccess
      );
    },
    [executeTx]
  );

  const mintALUDAction = useCallback(
    async (
      collateral: Address,
      amount: string,
      onSuccess?: () => void
    ) => {
      await executeTx(
        `Minted ${amount} ALUD`,
        async () => {
          const amt = parseALUD(amount);
          return mintALUDContract(collateral, amt);
        },
        onSuccess
      );
    },
    [executeTx]
  );

  const repayALUDAction = useCallback(
    async (
      collateral: Address,
      amount: string,
      onSuccess?: () => void
    ) => {
      await executeTx(
        `Repaid ${amount} ALUD`,
        async () => {
          const amt = parseALUD(amount);
          await ensureAllowance(
            CONTRACTS.ALUD,
            CONTRACTS.TroveManager,
            amt
          );
          return repayALUDContract(collateral, amt);
        },
        onSuccess
      );
    },
    [executeTx, ensureAllowance]
  );

  const depositToStabilityPool = useCallback(
    async (amount: string, onSuccess?: () => void) => {
      await executeTx(
        `Deposited ${amount} ALUD to Stability Pool`,
        async () => {
          const amt = parseALUD(amount);
          await ensureAllowance(
            CONTRACTS.ALUD,
            CONTRACTS.StabilityPool,
            amt
          );
          return depositToSPContract(amt);
        },
        onSuccess
      );
    },
    [executeTx, ensureAllowance]
  );

  const withdrawFromStabilityPool = useCallback(
    async (amount: string, onSuccess?: () => void) => {
      await executeTx(
        `Withdrew ${amount} ALUD from Stability Pool`,
        async () => {
          const amt = parseALUD(amount);
          return withdrawFromSPContract(amt);
        },
        onSuccess
      );
    },
    [executeTx]
  );

  const claimCollateralGainsAction = useCallback(
    async (onSuccess?: () => void) => {
      await executeTx(
        "Claimed collateral gains",
        async () => claimGainsContract(),
        onSuccess
      );
    },
    [executeTx]
  );

  const claimOECRewardsAction = useCallback(
    async (onSuccess?: () => void) => {
      await executeTx(
        "Claimed OEC rewards",
        async () => claimOECContract(),
        onSuccess
      );
    },
    [executeTx]
  );

  const redeemCollateralAction = useCallback(
    async (
      collateral: Address,
      aludAmount: string,
      troveOwner: Address,
      onSuccess?: () => void
    ) => {
      await executeTx(
        `Redeemed ${aludAmount} ALUD for collateral`,
        async () => {
          const amt = parseALUD(aludAmount);
          await ensureAllowance(
            CONTRACTS.ALUD,
            CONTRACTS.TroveManager,
            amt
          );
          return redeemCollateralContract(collateral, amt, troveOwner);
        },
        onSuccess
      );
    },
    [executeTx, ensureAllowance]
  );

  return {
    pendingTx,
    openTrove,
    closeTrove,
    addCollateral: addCollateralAction,
    removeCollateral: removeCollateralAction,
    mintALUD: mintALUDAction,
    repayALUD: repayALUDAction,
    depositToStabilityPool,
    withdrawFromStabilityPool,
    claimCollateralGains: claimCollateralGainsAction,
    claimOECRewards: claimOECRewardsAction,
    redeemCollateral: redeemCollateralAction,
  };
}

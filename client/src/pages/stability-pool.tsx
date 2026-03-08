import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAlluria } from "@/hooks/use-alluria";
import { useAluriaActions } from "@/hooks/use-alluria-actions";
import {
  formatALUD,
  formatUSDDisplay,
  getCollateralMeta,
  formatCollateral,
} from "@/services/alluria-contracts";

const aludLogo = "https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/ALUD.png";

function StabilityPoolContent() {
  const [stabilityPoolAmount, setStabilityPoolAmount] = useState("");
  const {
    stabilityPoolStats,
    userStabilityPosition,
    aludBalance,
    systemStats,
    isConnected,
    contractsDeployed,
    refetch,
  } = useAlluria();
  const actions = useAluriaActions();

  const aludBalanceNum = Number(formatALUD(aludBalance));

  const handleStabilityPoolPercentageClick = (percentage: number) => {
    const amount = (aludBalanceNum * percentage) / 100;
    setStabilityPoolAmount(amount > 0 ? amount.toFixed(2) : "");
  };

  const userDeposit = userStabilityPosition
    ? Number(formatALUD(userStabilityPosition.deposit))
    : 0;
  const totalDeposits = stabilityPoolStats
    ? Number(formatALUD(stabilityPoolStats.totalDeposits))
    : 0;
  const userSharePct =
    totalDeposits > 0 ? ((userDeposit / totalDeposits) * 100).toFixed(2) : "0.00";
  const pendingOEC = userStabilityPosition
    ? Number(formatALUD(userStabilityPosition.pendingOEC))
    : 0;

  const handleDeposit = () => {
    if (!stabilityPoolAmount || parseFloat(stabilityPoolAmount) <= 0) return;
    actions.depositToStabilityPool(stabilityPoolAmount, () => {
      setStabilityPoolAmount("");
      refetch();
    });
  };

  const handleWithdraw = () => {
    if (!stabilityPoolAmount || parseFloat(stabilityPoolAmount) <= 0) return;
    actions.withdrawFromStabilityPool(stabilityPoolAmount, () => {
      setStabilityPoolAmount("");
      refetch();
    });
  };

  const handleClaimGains = () => {
    actions.claimCollateralGains(() => refetch());
  };

  const handleClaimOEC = () => {
    actions.claimOECRewards(() => refetch());
  };

  // Compute collateral gains display
  const collateralGains: { symbol: string; amount: string }[] = [];
  if (userStabilityPosition) {
    for (let i = 0; i < userStabilityPosition.gainTokens.length; i++) {
      const token = getCollateralMeta(userStabilityPosition.gainTokens[i]);
      const amt = userStabilityPosition.gainAmounts[i];
      if (amt > BigInt(0) && token) {
        collateralGains.push({
          symbol: token.symbol,
          amount: formatCollateral(amt, token.decimals),
        });
      }
    }
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="crypto-card border h-full">
                <CardContent className="p-6">
                  <div className="bg-[var(--crypto-dark)] rounded-lg p-6 border border-[var(--crypto-border)]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <img src={aludLogo} alt="ALUD" className="w-12 h-12 rounded-full border-half" />
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">Stability Pool</h3>
                          <p className="text-gray-400 text-sm">Deposit ALUD to earn liquidation rewards and OEC tokens</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-[var(--crypto-card)] rounded-lg p-4 border border-[var(--crypto-border)]">
                        <div className="text-sm text-gray-400 mb-1">Total Deposited</div>
                        <div className="text-lg font-bold text-white">
                          {contractsDeployed && stabilityPoolStats
                            ? formatUSDDisplay(stabilityPoolStats.totalDeposits)
                            : "$0.00"}
                        </div>
                      </div>
                      <div className="bg-[var(--crypto-card)] rounded-lg p-4 border border-[var(--crypto-border)]">
                        <div className="text-sm text-gray-400 mb-1">Your Share</div>
                        <div className="text-lg font-bold text-white">
                          {isConnected ? `${userSharePct}%` : "—"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {isConnected
                            ? userDeposit > 0
                              ? `${userDeposit.toFixed(2)} ALUD`
                              : "No deposit yet"
                            : "Connect wallet"}
                        </div>
                      </div>
                      <div className="bg-[var(--crypto-card)] rounded-lg p-4 border border-[var(--crypto-border)]">
                        <div className="text-sm text-gray-400 mb-1">Pending OEC Rewards</div>
                        <div className="text-lg font-bold text-white">
                          {isConnected ? `${pendingOEC.toFixed(4)} OEC` : "—"}
                        </div>
                        {collateralGains.length > 0 && (
                          <div className="text-xs text-green-400 mt-1">
                            +{collateralGains.map((g) => `${Number(g.amount).toFixed(4)} ${g.symbol}`).join(", ")}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Input
                          placeholder="0.0"
                          value={stabilityPoolAmount}
                          onChange={(e) => setStabilityPoolAmount(e.target.value)}
                          className="flex-1 bg-transparent border-none font-bold text-white placeholder-gray-500 p-0 m-0 h-12 focus-visible:ring-0 focus:outline-none focus:ring-0 focus:border-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                          style={{ padding: 0, margin: 0, fontSize: '2.25rem', lineHeight: '1', fontWeight: 'bold', outline: 'none', border: 'none', boxShadow: 'none' }}
                        />
                        <div className="bg-[var(--crypto-card)] border border-[var(--crypto-border)] text-white px-4 py-2 rounded-lg min-w-[140px] flex items-center justify-center space-x-2">
                          <img src={aludLogo} alt="ALUD" className="w-6 h-6 rounded-full" />
                          <span>ALUD</span>
                        </div>
                      </div>

                      {isConnected && (
                        <div className="flex items-center justify-between">
                          <div className="flex space-x-2">
                            {[25, 50, 75, 100].map((percentage) => (
                              <Button key={percentage} variant="outline" size="sm" onClick={() => handleStabilityPoolPercentageClick(percentage)}
                                className="text-xs bg-[var(--crypto-card)] border-[var(--crypto-border)] text-gray-400 hover:text-white hover:bg-[var(--crypto-dark)]"
                              >{percentage}%</Button>
                            ))}
                          </div>
                          <span className="text-sm text-gray-400">
                            Balance: {aludBalanceNum.toFixed(2)} ALUD
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-3">
                        <Button
                          onClick={handleDeposit}
                          disabled={!!actions.pendingTx || !isConnected || !stabilityPoolAmount || parseFloat(stabilityPoolAmount) <= 0}
                          className="h-12 text-lg bg-gradient-to-r from-crypto-blue to-crypto-purple hover:from-crypto-blue/80 hover:to-crypto-purple/80 text-white font-medium"
                        >
                          {actions.pendingTx?.includes("Deposited") ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                              <span>Depositing...</span>
                            </div>
                          ) : "Deposit"}
                        </Button>
                        <Button
                          onClick={handleWithdraw}
                          disabled={!!actions.pendingTx || !isConnected || !stabilityPoolAmount || parseFloat(stabilityPoolAmount) <= 0}
                          variant="outline"
                          className="h-12 text-lg border-[var(--crypto-border)] text-gray-400 hover:text-white hover:bg-[var(--crypto-dark)]"
                        >
                          {actions.pendingTx?.includes("Withdrew") ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                              <span>Withdrawing...</span>
                            </div>
                          ) : "Withdraw"}
                        </Button>
                        <Button
                          onClick={handleClaimGains}
                          disabled={!!actions.pendingTx || !isConnected}
                          variant="outline"
                          className="h-12 text-lg border-[var(--crypto-border)] text-gray-400 hover:text-white hover:bg-[var(--crypto-dark)]"
                        >
                          {actions.pendingTx?.includes("Claimed collateral") ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                              <span>Claiming...</span>
                            </div>
                          ) : "Claim Gains"}
                        </Button>
                      </div>

                      {isConnected && pendingOEC > 0 && (
                        <Button
                          onClick={handleClaimOEC}
                          disabled={!!actions.pendingTx}
                          variant="outline"
                          className="w-full h-10 border-[var(--crypto-border)] text-gray-400 hover:text-white hover:bg-[var(--crypto-dark)]"
                        >
                          {actions.pendingTx?.includes("Claimed OEC") ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                              <span>Claiming OEC...</span>
                            </div>
                          ) : `Claim ${pendingOEC.toFixed(4)} OEC Rewards`}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Protocol Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Value Locked</span>
                      <span className="font-medium">
                        {contractsDeployed && systemStats
                          ? formatUSDDisplay(systemStats.totalCollateralValueUSD)
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ALUD Circulating</span>
                      <span className="font-medium">
                        {contractsDeployed && systemStats
                          ? formatUSDDisplay(systemStats.totalALUDSupply)
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Stability Pool</span>
                      <span className="font-medium">
                        {contractsDeployed && systemStats
                          ? formatUSDDisplay(systemStats.stabilityPoolDeposits)
                          : "—"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function StabilityPool() {
  return <StabilityPoolContent />;
}

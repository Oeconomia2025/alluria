import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Lock, ChevronDown } from "lucide-react";
import { useAlluria } from "@/hooks/use-alluria";
import { useAluriaActions } from "@/hooks/use-alluria-actions";
import {
  formatALUD,
  formatCollateral,
  formatUSD,
  formatUSDDisplay,
  formatRatio,
  getCollateralMeta,
  type Address,
} from "@/services/alluria-contracts";

const aludLogo = "https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/ALUD.png";

interface DisplayPosition {
  id: string;
  collateralAddress: Address;
  collateralSymbol: string;
  collateralLogo: string;
  collateralAmount: number;
  collateralDecimals: number;
  borrowedAmount: number;
  collateralizationRatio: number;
  liquidationPrice: number;
}

function RepayContent() {
  const [, navigate] = useLocation();
  const [repayAmount, setRepayAmount] = useState("");
  const [selectedPosition, setSelectedPosition] = useState<DisplayPosition | null>(null);
  const [showAllPositions, setShowAllPositions] = useState(false);

  const {
    userTroves,
    aludBalance,
    collateralPrices,
    systemStats,
    isConnected,
    contractsDeployed,
    refetch,
  } = useAlluria();
  const actions = useAluriaActions();

  const aludBalanceNum = Number(formatALUD(aludBalance));

  // Build positions from live trove data
  const positions: DisplayPosition[] = userTroves.map((trove, i) => {
    const meta = getCollateralMeta(trove.collateral);
    return {
      id: `trove-${i}`,
      collateralAddress: trove.collateral,
      collateralSymbol: meta?.symbol ?? "???",
      collateralLogo: meta?.logo ?? "",
      collateralAmount: meta ? Number(formatCollateral(trove.collateralAmount, meta.decimals)) : 0,
      collateralDecimals: meta?.decimals ?? 18,
      borrowedAmount: Number(formatALUD(trove.debt)),
      collateralizationRatio: Number(formatRatio(trove.collateralRatio)),
      liquidationPrice: Number(formatUSD(trove.liquidationPrice)),
    };
  });

  // Auto-select lowest health position
  useEffect(() => {
    if (positions.length > 0 && !selectedPosition) {
      const lowest = positions.reduce((lo, cur) =>
        cur.collateralizationRatio < lo.collateralizationRatio ? cur : lo
      );
      setSelectedPosition(lowest);
    }
  }, [positions.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const getRatioColor = (ratio: number) => {
    if (ratio < 120) return "text-red-400";
    if (ratio < 150) return "text-yellow-400";
    return "text-green-400";
  };

  const handleRepayPercentageClick = (percentage: number) => {
    if (selectedPosition) {
      const amount = (selectedPosition.borrowedAmount * percentage / 100).toFixed(2);
      setRepayAmount(amount);
    }
  };

  const handleRepay = () => {
    if (!selectedPosition || !repayAmount || parseFloat(repayAmount) <= 0) return;
    const repayVal = parseFloat(repayAmount);
    const isFullRepay = repayVal >= selectedPosition.borrowedAmount * 0.999;

    if (isFullRepay) {
      actions.closeTrove(selectedPosition.collateralAddress, () => {
        setRepayAmount("");
        setSelectedPosition(null);
        refetch();
      });
    } else {
      actions.repayALUD(selectedPosition.collateralAddress, repayAmount, () => {
        setRepayAmount("");
        refetch();
      });
    }
  };

  // Post-repayment calculation
  const repayVal = parseFloat(repayAmount) || 0;
  const remainingDebt = selectedPosition
    ? Math.max(0, selectedPosition.borrowedAmount - repayVal)
    : 0;
  const newRatio = selectedPosition && remainingDebt > 0
    ? (selectedPosition.collateralAmount *
        (collateralPrices[selectedPosition.collateralAddress]
          ? Number(formatUSD(collateralPrices[selectedPosition.collateralAddress]))
          : 0)) /
      remainingDebt * 100
    : Infinity;

  return (
    <Layout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="crypto-card border h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold">Repay ALUD Debt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-0">
                  <div className="space-y-0">
                    {/* Select Position Section */}
                    <div className="bg-[var(--crypto-dark)] rounded-t-lg p-4 border border-[var(--crypto-border)]">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-gray-400 text-sm">Select Position</label>
                        <span className="text-sm text-gray-400">
                          {positions.length} active position{positions.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {!isConnected ? (
                          <div className="text-center py-4 text-gray-400">Connect wallet to view positions</div>
                        ) : positions.length === 0 ? (
                          <div className="text-center py-4 text-gray-400">No active positions to repay</div>
                        ) : !showAllPositions ? (
                          selectedPosition && (
                            <div
                              onClick={() => setShowAllPositions(true)}
                              className="flex items-center justify-between p-3 bg-[var(--crypto-card)] border border-[var(--crypto-border)] rounded-lg hover:bg-[var(--crypto-dark)] cursor-pointer transition-colors"
                            >
                              <div className="flex items-center space-x-3">
                                <img src={selectedPosition.collateralLogo} alt={selectedPosition.collateralSymbol} className="w-8 h-8 rounded-full" />
                                <div>
                                  <div className="font-medium text-white">{selectedPosition.collateralAmount.toFixed(6)} {selectedPosition.collateralSymbol}</div>
                                  <div className="text-sm text-gray-400">Borrowed: {selectedPosition.borrowedAmount.toFixed(2)} ALUD</div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="text-right">
                                  <div className={`text-sm font-bold ${getRatioColor(selectedPosition.collateralizationRatio)}`}>
                                    {selectedPosition.collateralizationRatio.toFixed(1)}%
                                  </div>
                                  <div className="text-xs text-gray-400">Health</div>
                                </div>
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              </div>
                            </div>
                          )
                        ) : (
                          positions.map((position) => (
                            <div
                              key={position.id}
                              onClick={() => { setSelectedPosition(position); setShowAllPositions(false); }}
                              className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                                selectedPosition?.id === position.id
                                  ? 'bg-[var(--crypto-dark)] border-crypto-blue/50'
                                  : 'bg-[var(--crypto-card)] border-[var(--crypto-border)] hover:bg-[var(--crypto-dark)]'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <img src={position.collateralLogo} alt={position.collateralSymbol} className="w-8 h-8 rounded-full" />
                                <div>
                                  <div className="font-medium text-white">{position.collateralAmount.toFixed(6)} {position.collateralSymbol}</div>
                                  <div className="text-sm text-gray-400">Borrowed: {position.borrowedAmount.toFixed(2)} ALUD</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`text-sm font-bold ${getRatioColor(position.collateralizationRatio)}`}>
                                  {position.collateralizationRatio.toFixed(1)}%
                                </div>
                                <div className="text-xs text-gray-400">Health</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Repayment Section */}
                    <div className="bg-[var(--crypto-dark)] rounded-b-lg p-4 border-l border-r border-b border-[var(--crypto-border)] -mt-px">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-gray-400 text-sm">Repay Amount</label>
                        <span className="text-sm text-gray-400">
                          Available: {isConnected ? `${aludBalanceNum.toFixed(2)} ALUD` : "—"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Input
                          placeholder="0.0"
                          value={repayAmount}
                          onChange={(e) => setRepayAmount(e.target.value)}
                          className="flex-1 bg-transparent border-none font-bold text-white placeholder-gray-500 p-0 m-0 h-12 focus-visible:ring-0 focus:outline-none focus:ring-0 focus:border-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                          style={{ padding: 0, margin: 0, fontSize: '2.25rem', lineHeight: '1', fontWeight: 'bold', outline: 'none', border: 'none', boxShadow: 'none' }}
                        />
                        <div className="bg-[var(--crypto-card)] border border-[var(--crypto-border)] text-white px-4 py-2 h-auto min-w-[140px] rounded-md">
                          <div className="flex items-center justify-center space-x-2">
                            <img src={aludLogo} alt="ALUD" className="w-6 h-6 rounded-full" />
                            <span>ALUD</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex space-x-2">
                          {[25, 50, 75, 100].map((percentage) => (
                            <Button key={percentage} variant="outline" size="sm" onClick={() => handleRepayPercentageClick(percentage)}
                              className="text-xs bg-[var(--crypto-card)] border-[var(--crypto-border)] text-gray-400 hover:text-white hover:bg-[var(--crypto-dark)]"
                            >{percentage}%</Button>
                          ))}
                        </div>
                        <div className="text-sm text-gray-500">
                          ≈ ${repayAmount ? (parseFloat(repayAmount) || 0).toFixed(2) : '0.00'} USD
                        </div>
                      </div>
                    </div>

                    {/* Repayment Impact */}
                    <div className="bg-[var(--crypto-dark)] rounded-lg p-4 border border-[var(--crypto-border)] mt-4">
                      <h4 className="font-medium text-gray-300 mb-3">After Repayment</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Remaining Debt</span>
                          <span className="text-gray-300">{remainingDebt.toFixed(2)} ALUD</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">New Health Factor</span>
                          <span className={newRatio === Infinity ? "text-green-400" : getRatioColor(newRatio)}>
                            {newRatio === Infinity ? "∞" : (newRatio / 110).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleRepay}
                      disabled={!selectedPosition || !repayAmount || parseFloat(repayAmount) <= 0 || !!actions.pendingTx || !isConnected}
                      className="w-full h-12 text-lg bg-gradient-to-r from-crypto-blue to-crypto-purple hover:from-crypto-blue/80 hover:to-crypto-purple/80 text-white font-medium"
                    >
                      {actions.pendingTx ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          <span>Processing...</span>
                        </div>
                      ) : !isConnected ? "Connect Wallet" : !selectedPosition
                        ? "Select Position to Repay"
                        : repayVal >= (selectedPosition?.borrowedAmount ?? 0) * 0.999
                          ? "Close Position & Return Collateral"
                          : `Repay ${repayAmount} ALUD`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Positions</CardTitle>
                </CardHeader>
                <CardContent>
                  {!isConnected ? (
                    <div className="text-center py-8">
                      <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">Connect wallet to view positions</p>
                    </div>
                  ) : positions.length === 0 ? (
                    <div className="text-center py-8">
                      <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">No active positions</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {positions.map((position) => (
                        <div key={position.id} className="p-4 border rounded-lg space-y-3 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <img src={position.collateralLogo} alt={position.collateralSymbol} className="w-6 h-6 rounded-full" />
                              <span className="font-medium">{position.collateralSymbol}</span>
                            </div>
                            <Badge variant={position.collateralizationRatio > 150 ? "default" : position.collateralizationRatio > 120 ? "secondary" : "destructive"}>
                              {position.collateralizationRatio.toFixed(1)}%
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Collateral</span>
                              <span>{position.collateralAmount.toFixed(6)} {position.collateralSymbol}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Borrowed</span>
                              <span>{position.borrowedAmount.toFixed(2)} ALUD</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Liquidation</span>
                              <span className="text-orange-400">${position.liquidationPrice.toFixed(0)}</span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => navigate("/deposit")}
                            className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white text-xs"
                          >
                            Go to Add Collateral
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

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

export default function Repay() {
  return <RepayContent />;
}

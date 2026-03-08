import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAlluria } from "@/hooks/use-alluria";
import {
  formatALUD,
  formatCollateral,
  formatUSD,
  formatUSDDisplay,
  formatRatio,
  getCollateralMeta,
  COLLATERAL_TOKENS,
} from "@/services/alluria-contracts";

const collateralLogos: Record<string, string> = {
  WBTC: "https://tokens.1inch.io/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png",
  WETH: "https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png",
  WBNB: "https://tokens.1inch.io/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c.png",
};

type RiskCategory = "critical" | "at-risk" | "moderate" | "healthy" | "very-safe";

function getRiskCategory(ratio: number): RiskCategory {
  if (ratio < 120) return "critical";
  if (ratio < 150) return "at-risk";
  if (ratio < 200) return "moderate";
  if (ratio < 300) return "healthy";
  return "very-safe";
}

function getRiskLabel(category: RiskCategory): string {
  switch (category) {
    case "critical": return "Critical";
    case "at-risk": return "At Risk";
    case "moderate": return "Moderate";
    case "healthy": return "Healthy";
    case "very-safe": return "Very Safe";
  }
}

function getRiskColor(category: RiskCategory): string {
  switch (category) {
    case "critical": return "text-red-400";
    case "at-risk": return "text-orange-400";
    case "moderate": return "text-yellow-400";
    case "healthy": return "text-green-400";
    case "very-safe": return "text-emerald-400";
  }
}

function getRiskBgColor(category: RiskCategory): string {
  switch (category) {
    case "critical": return "bg-red-500/10 border-red-500/30";
    case "at-risk": return "bg-orange-500/10 border-orange-500/30";
    case "moderate": return "bg-yellow-500/10 border-yellow-500/30";
    case "healthy": return "bg-green-500/10 border-green-500/30";
    case "very-safe": return "bg-emerald-500/10 border-emerald-500/30";
  }
}

function getRiskDot(category: RiskCategory): string {
  switch (category) {
    case "critical": return "bg-red-400";
    case "at-risk": return "bg-orange-400";
    case "moderate": return "bg-yellow-400";
    case "healthy": return "bg-green-400";
    case "very-safe": return "bg-emerald-400";
  }
}

const riskOrder: RiskCategory[] = ["critical", "at-risk", "moderate", "healthy", "very-safe"];

interface DisplayPosition {
  address: string;
  collateral: string;
  collateralLogo: string;
  collateralAmount: number;
  collateralValue: number;
  debt: number;
  ratio: number;
  lastActivity: string;
}

function PositionsContent() {
  const [activeFilter, setActiveFilter] = useState<RiskCategory | "all" | "mine">("all");

  const {
    userTroves,
    collateralPrices,
    systemStats,
    isConnected,
    contractsDeployed,
    userAddress,
  } = useAlluria();

  // Build "My Positions" from live user troves
  const myPositions: DisplayPosition[] = userTroves.map((trove) => {
    const meta = getCollateralMeta(trove.collateral);
    const colAmt = meta ? Number(formatCollateral(trove.collateralAmount, meta.decimals)) : 0;
    const price = collateralPrices[trove.collateral]
      ? Number(formatUSD(collateralPrices[trove.collateral]))
      : 0;
    return {
      address: userAddress
        ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`
        : "You",
      collateral: meta?.symbol ?? "???",
      collateralLogo: meta?.logo ?? "",
      collateralAmount: colAmt,
      collateralValue: colAmt * price,
      debt: Number(formatALUD(trove.debt)),
      ratio: Number(formatRatio(trove.collateralRatio)),
      lastActivity: "Now",
    };
  });

  // "All Positions" requires event indexing for a global trove list.
  // For now, show only user positions + placeholder message.
  const allPositions = myPositions; // Until event indexer is built

  const sortedPositions = [...allPositions].sort((a, b) => a.ratio - b.ratio);

  const filteredPositions = activeFilter === "all"
    ? sortedPositions
    : activeFilter === "mine"
    ? myPositions
    : sortedPositions.filter((p) => getRiskCategory(p.ratio) === activeFilter);

  const categoryCounts = riskOrder.reduce((acc, cat) => {
    acc[cat] = allPositions.filter((p) => getRiskCategory(p.ratio) === cat).length;
    return acc;
  }, {} as Record<RiskCategory, number>);

  const totalDebt = allPositions.reduce((sum, p) => sum + p.debt, 0);
  const totalCollateral = allPositions.reduce((sum, p) => sum + p.collateralValue, 0);
  const avgRatio = totalDebt > 0 ? (totalCollateral / totalDebt) * 100 : 0;

  return (
    <Layout>
      <div className="p-8 pb-0">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-4 gap-4">
                <Card className="crypto-card border">
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-400 mb-1">My Positions</div>
                    <div className="text-2xl font-bold text-white">
                      {isConnected ? myPositions.length : "—"}
                    </div>
                  </CardContent>
                </Card>
                <Card className="crypto-card border">
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-400 mb-1">Total Collateral</div>
                    <div className="text-2xl font-bold text-white">
                      {totalCollateral > 0
                        ? `$${(totalCollateral / 1000).toFixed(1)}K`
                        : "—"}
                    </div>
                  </CardContent>
                </Card>
                <Card className="crypto-card border">
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-400 mb-1">Total Debt</div>
                    <div className="text-2xl font-bold text-white">
                      {totalDebt > 0
                        ? `$${(totalDebt / 1000).toFixed(1)}K`
                        : "—"}
                    </div>
                  </CardContent>
                </Card>
                <Card className="crypto-card border">
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-400 mb-1">Avg. Collateral Ratio</div>
                    <div className="text-2xl font-bold text-green-400">
                      {avgRatio > 0 ? `${avgRatio.toFixed(1)}%` : "—"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sticky section: Risk Distribution + Filters + Table Header */}
              <div className="sticky top-[45px] z-20 pt-2 pb-0" style={{ backgroundColor: "var(--background)" }}>
                {/* Risk Distribution Bar */}
                {allPositions.length > 0 && (
                  <Card className="crypto-card border mb-4">
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-400 mb-3">Risk Distribution</div>
                      <div className="flex rounded-lg overflow-hidden h-4">
                        {riskOrder.map((cat) => {
                          const count = categoryCounts[cat];
                          const pct = allPositions.length > 0 ? (count / allPositions.length) * 100 : 0;
                          if (pct === 0) return null;
                          const colors: Record<RiskCategory, string> = {
                            "critical": "bg-red-500",
                            "at-risk": "bg-orange-500",
                            "moderate": "bg-yellow-500",
                            "healthy": "bg-green-500",
                            "very-safe": "bg-emerald-500",
                          };
                          return (
                            <div
                              key={cat}
                              className={`${colors[cat]} transition-all duration-300`}
                              style={{ width: `${pct}%` }}
                              title={`${getRiskLabel(cat)}: ${count} positions (${pct.toFixed(0)}%)`}
                            />
                          );
                        })}
                      </div>
                      <div className="flex justify-between mt-2">
                        {riskOrder.map((cat) => (
                          <div key={cat} className="flex items-center gap-1 text-xs text-gray-400">
                            <div className={`w-2 h-2 rounded-full ${getRiskDot(cat)}`} />
                            <span>{getRiskLabel(cat)} ({categoryCounts[cat]})</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Filter Buttons */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {[
                    { key: "all" as const, label: `All (${allPositions.length})` },
                    ...riskOrder.map((cat) => ({ key: cat as RiskCategory, label: `${getRiskLabel(cat)} (${categoryCounts[cat]})` })),
                    { key: "mine" as const, label: `My Positions (${myPositions.length})` },
                  ].map((item) => (
                    <Button
                      key={item.key}
                      variant={activeFilter === item.key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveFilter(item.key)}
                      className={`w-full ${activeFilter === item.key
                        ? "text-white border-0"
                        : "bg-[var(--crypto-card)] border-[var(--crypto-border)] text-gray-400 hover:text-white"}`}
                      style={activeFilter === item.key ? { background: "linear-gradient(to right, #c43419, #d4a853)" } : {}}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>

                {/* Table Header */}
                <div className="crypto-card border border-b-0 rounded-t-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--crypto-border)]" style={{ backgroundColor: "var(--card)" }}>
                        <th className="text-left text-xs text-gray-400 font-medium p-4">Wallet</th>
                        <th className="text-left text-xs text-gray-400 font-medium p-4">Collateral</th>
                        <th className="text-right text-xs text-gray-400 font-medium p-4">Value</th>
                        <th className="text-right text-xs text-gray-400 font-medium p-4">Debt (ALUD)</th>
                        <th className="text-right text-xs text-gray-400 font-medium p-4">Ratio</th>
                        <th className="text-center text-xs text-gray-400 font-medium p-4">Status</th>
                        <th className="text-right text-xs text-gray-400 font-medium p-4">Last Activity</th>
                      </tr>
                    </thead>
                  </table>
                </div>
              </div>

              {/* Table Body */}
              <div className="crypto-card border border-t-0 rounded-b-lg -mt-6 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <tbody>
                      {!isConnected ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-gray-400">
                            Connect wallet to view your positions
                          </td>
                        </tr>
                      ) : filteredPositions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-gray-400">
                            {activeFilter === "mine"
                              ? "No positions found. Open a trove on the Deposit page."
                              : "No positions in this category"}
                          </td>
                        </tr>
                      ) : (
                        filteredPositions.map((position, i) => {
                          const risk = getRiskCategory(position.ratio);
                          return (
                            <tr
                              key={i}
                              className="border-b border-[var(--crypto-border)] last:border-b-0 hover:bg-white/[0.02] transition-colors"
                            >
                              <td className="p-4">
                                <span className="font-mono text-sm text-white">{position.address}</span>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={position.collateralLogo || collateralLogos[position.collateral]}
                                    alt={position.collateral}
                                    className="w-6 h-6 rounded-full"
                                  />
                                  <span className="text-white text-sm">{position.collateralAmount.toFixed(6)} {position.collateral}</span>
                                </div>
                              </td>
                              <td className="p-4 text-right">
                                <span className="text-white text-sm">${position.collateralValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </td>
                              <td className="p-4 text-right">
                                <span className="text-white text-sm">{position.debt.toLocaleString(undefined, { maximumFractionDigits: 0 })} ALUD</span>
                              </td>
                              <td className="p-4 text-right">
                                <span className={`text-sm font-semibold ${getRiskColor(risk)}`}>
                                  {position.ratio.toFixed(1)}%
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getRiskBgColor(risk)} ${getRiskColor(risk)}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${getRiskDot(risk)}`} />
                                  {getRiskLabel(risk)}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <span className="text-gray-400 text-sm">{position.lastActivity}</span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                {isConnected && allPositions.length === 0 && (
                  <div className="p-6 text-center border-t border-[var(--crypto-border)]">
                    <p className="text-sm text-gray-400 mb-1">
                      All Positions view requires an event indexer for global trove data.
                    </p>
                    <p className="text-xs text-gray-500">
                      Currently showing your positions only. Global position data coming soon.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:sticky lg:top-[45px] lg:self-start lg:max-h-[calc(100vh-60px)] lg:overflow-y-auto scrollbar-hide space-y-6 pb-8">
              {/* Risk Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Risk Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {riskOrder.map((cat) => {
                    const count = categoryCounts[cat];
                    const pct = allPositions.length > 0 ? (count / allPositions.length) * 100 : 0;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${getRiskDot(cat)}`} />
                            <span className={getRiskColor(cat)}>{getRiskLabel(cat)}</span>
                          </div>
                          <span className="text-gray-400">{count} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="h-1.5 bg-[var(--crypto-dark)] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getRiskDot(cat)} rounded-full transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Thresholds Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Collateral Thresholds</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-red-400">Critical</span>
                      <span className="text-gray-400">&lt; 120%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-400">At Risk</span>
                      <span className="text-gray-400">120% - 150%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-400">Moderate</span>
                      <span className="text-gray-400">150% - 200%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-400">Healthy</span>
                      <span className="text-gray-400">200% - 300%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-400">Very Safe</span>
                      <span className="text-gray-400">&gt; 300%</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-[var(--crypto-dark)] rounded-lg border border-[var(--crypto-border)]">
                    <p className="text-xs text-gray-400">
                      Positions below 110% collateral ratio are eligible for liquidation. Maintaining a ratio above 150% is recommended to avoid liquidation during market volatility.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Protocol Stats */}
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
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Liquidation Threshold</span>
                      <span className="font-medium text-red-400">110%</span>
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

export default function Positions() {
  return <PositionsContent />;
}

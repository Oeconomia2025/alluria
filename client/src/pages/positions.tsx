import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Mock position data representing various wallets/troves in the protocol
const mockPositions = [
  // Critical (<120%)
  { address: "0x91c2...8d4a", collateral: "WETH", collateralAmount: 0.85, collateralValue: 2907.43, debt: 2600, ratio: 111.8, lastActivity: "45m ago" },
  { address: "0x7a3b...f91e", collateral: "WBTC", collateralAmount: 0.042, collateralValue: 2828.28, debt: 2450, ratio: 115.4, lastActivity: "2h ago" },
  { address: "0x44d1...e3a7", collateral: "WBNB", collateralAmount: 3.20, collateralValue: 2064.64, debt: 1800, ratio: 114.7, lastActivity: "20m ago" },
  { address: "0xee09...b1c5", collateral: "WETH", collateralAmount: 0.72, collateralValue: 2462.76, debt: 2150, ratio: 114.5, lastActivity: "10m ago" },
  { address: "0x33fa...d9e2", collateral: "WBTC", collateralAmount: 0.035, collateralValue: 2356.90, debt: 2100, ratio: 112.2, lastActivity: "5m ago" },
  { address: "0xab72...1f8d", collateral: "WBNB", collateralAmount: 2.90, collateralValue: 1871.18, debt: 1650, ratio: 113.4, lastActivity: "1h ago" },
  // At Risk (120%-150%)
  { address: "0xf4e8...12bc", collateral: "WBNB", collateralAmount: 4.12, collateralValue: 2658.14, debt: 2200, ratio: 120.8, lastActivity: "1h ago" },
  { address: "0x7bc4...a2f6", collateral: "WETH", collateralAmount: 1.05, collateralValue: 3591.53, debt: 2900, ratio: 123.8, lastActivity: "2h ago" },
  { address: "0x2d9f...a7c3", collateral: "WETH", collateralAmount: 1.25, collateralValue: 4275.63, debt: 3200, ratio: 133.6, lastActivity: "3h ago" },
  { address: "0xb83e...5f1d", collateral: "WBTC", collateralAmount: 0.08, collateralValue: 5387.20, debt: 3800, ratio: 141.8, lastActivity: "6h ago" },
  { address: "0xd5e1...74c8", collateral: "WBNB", collateralAmount: 5.80, collateralValue: 3742.36, debt: 2800, ratio: 133.7, lastActivity: "4h ago" },
  { address: "0x19a6...f3b0", collateral: "WBTC", collateralAmount: 0.065, collateralValue: 4377.10, debt: 3100, ratio: 141.2, lastActivity: "8h ago" },
  { address: "0xc8d2...56ea", collateral: "WETH", collateralAmount: 1.40, collateralValue: 4788.70, debt: 3500, ratio: 136.8, lastActivity: "5h ago" },
  { address: "0x62bf...d1a3", collateral: "WBNB", collateralAmount: 6.20, collateralValue: 4000.04, debt: 2750, ratio: 145.5, lastActivity: "7h ago" },
  { address: "0xfa47...89ce", collateral: "WBTC", collateralAmount: 0.072, collateralValue: 4848.48, debt: 3400, ratio: 142.6, lastActivity: "3h ago" },
  { address: "0x0e5d...b7f2", collateral: "WETH", collateralAmount: 1.10, collateralValue: 3762.55, debt: 2650, ratio: 142.0, lastActivity: "9h ago" },
  // Moderate (150%-200%)
  { address: "0x5c1a...d892", collateral: "WBNB", collateralAmount: 8.50, collateralValue: 5484.20, debt: 3600, ratio: 152.3, lastActivity: "12h ago" },
  { address: "0xe621...3b7f", collateral: "WETH", collateralAmount: 2.10, collateralValue: 7183.05, debt: 4500, ratio: 159.6, lastActivity: "1d ago" },
  { address: "0x48ad...c6e0", collateral: "WBTC", collateralAmount: 0.15, collateralValue: 10101.00, debt: 5800, ratio: 174.2, lastActivity: "2d ago" },
  { address: "0xa1f9...7de4", collateral: "WETH", collateralAmount: 3.40, collateralValue: 11629.70, debt: 6200, ratio: 187.6, lastActivity: "3h ago" },
  { address: "0x87e3...c4d1", collateral: "WBNB", collateralAmount: 10.50, collateralValue: 6775.70, debt: 4100, ratio: 165.3, lastActivity: "6h ago" },
  { address: "0x3cf9...a8e5", collateral: "WBTC", collateralAmount: 0.12, collateralValue: 8080.80, debt: 4800, ratio: 168.4, lastActivity: "1d ago" },
  { address: "0xb4a2...61fd", collateral: "WETH", collateralAmount: 2.60, collateralValue: 8893.30, debt: 5100, ratio: 174.4, lastActivity: "14h ago" },
  { address: "0x56d8...e2b7", collateral: "WBNB", collateralAmount: 14.00, collateralValue: 9033.80, debt: 5000, ratio: 180.7, lastActivity: "2d ago" },
  { address: "0xcd91...37f4", collateral: "WBTC", collateralAmount: 0.18, collateralValue: 12121.20, debt: 6400, ratio: 189.4, lastActivity: "1d ago" },
  { address: "0x1ea7...d5c0", collateral: "WETH", collateralAmount: 2.85, collateralValue: 9748.43, debt: 5500, ratio: 177.2, lastActivity: "10h ago" },
  { address: "0x72f0...4b9a", collateral: "WBNB", collateralAmount: 11.20, collateralValue: 7227.04, debt: 3800, ratio: 190.2, lastActivity: "18h ago" },
  { address: "0xae5c...f823", collateral: "WBTC", collateralAmount: 0.14, collateralValue: 9427.60, debt: 4900, ratio: 192.4, lastActivity: "1d ago" },
  // Healthy (200%-300%)
  { address: "0x3db7...e58c", collateral: "WBNB", collateralAmount: 12.80, collateralValue: 8258.56, debt: 4000, ratio: 206.5, lastActivity: "5h ago" },
  { address: "0xc94e...1a2b", collateral: "WBTC", collateralAmount: 0.25, collateralValue: 16835.00, debt: 7500, ratio: 224.5, lastActivity: "1d ago" },
  { address: "0x6f82...d3c9", collateral: "WETH", collateralAmount: 5.60, collateralValue: 19154.80, debt: 7200, ratio: 266.0, lastActivity: "4d ago" },
  { address: "0x9b14...c7e3", collateral: "WBNB", collateralAmount: 18.00, collateralValue: 11613.60, debt: 5400, ratio: 215.1, lastActivity: "2d ago" },
  { address: "0x41e8...d6f5", collateral: "WBTC", collateralAmount: 0.30, collateralValue: 20202.00, debt: 8500, ratio: 237.7, lastActivity: "3d ago" },
  { address: "0xf7a3...29b1", collateral: "WETH", collateralAmount: 4.50, collateralValue: 15392.25, debt: 6000, ratio: 256.5, lastActivity: "5d ago" },
  { address: "0x28dc...e4a9", collateral: "WBNB", collateralAmount: 20.50, collateralValue: 13230.70, debt: 4800, ratio: 275.6, lastActivity: "1d ago" },
  { address: "0x85f6...3ca2", collateral: "WBTC", collateralAmount: 0.22, collateralValue: 14814.60, debt: 6800, ratio: 217.9, lastActivity: "6d ago" },
  { address: "0xe3b9...a71d", collateral: "WETH", collateralAmount: 4.80, collateralValue: 16418.40, debt: 5900, ratio: 278.3, lastActivity: "2d ago" },
  { address: "0x5da4...82f7", collateral: "WBNB", collateralAmount: 16.40, collateralValue: 10582.96, debt: 4400, ratio: 240.5, lastActivity: "4d ago" },
  { address: "0x14c7...b5e0", collateral: "WBTC", collateralAmount: 0.28, collateralValue: 18856.80, debt: 6600, ratio: 285.7, lastActivity: "3d ago" },
  { address: "0xbc60...f193", collateral: "WETH", collateralAmount: 6.20, collateralValue: 21207.10, debt: 7800, ratio: 271.9, lastActivity: "1w ago" },
  // Very Safe (>300%)
  { address: "0xd1a5...84f7", collateral: "WBNB", collateralAmount: 22.00, collateralValue: 14194.40, debt: 4200, ratio: 338.0, lastActivity: "1w ago" },
  { address: "0x8b3c...f2e1", collateral: "WBTC", collateralAmount: 0.50, collateralValue: 33670.00, debt: 8000, ratio: 420.9, lastActivity: "2w ago" },
  { address: "0x12ef...9a6d", collateral: "WETH", collateralAmount: 10.00, collateralValue: 34205.00, debt: 6500, ratio: 526.2, lastActivity: "3w ago" },
  { address: "0xa9d3...7e14", collateral: "WBNB", collateralAmount: 28.00, collateralValue: 18067.60, debt: 5200, ratio: 347.5, lastActivity: "1w ago" },
  { address: "0x6ce1...b482", collateral: "WBTC", collateralAmount: 0.45, collateralValue: 30303.00, debt: 7000, ratio: 432.9, lastActivity: "2w ago" },
  { address: "0x2fb8...c9d6", collateral: "WETH", collateralAmount: 12.00, collateralValue: 41046.00, debt: 8500, ratio: 482.9, lastActivity: "3w ago" },
  { address: "0xd0e4...a5f3", collateral: "WBNB", collateralAmount: 35.00, collateralValue: 22586.50, debt: 5800, ratio: 389.4, lastActivity: "2w ago" },
  { address: "0x73b5...18dc", collateral: "WBTC", collateralAmount: 0.60, collateralValue: 40404.00, debt: 9000, ratio: 448.9, lastActivity: "1m ago" },
  { address: "0x4ea2...f7b9", collateral: "WETH", collateralAmount: 15.00, collateralValue: 51307.50, debt: 9500, ratio: 540.1, lastActivity: "1m ago" },
  { address: "0x97c6...2d0e", collateral: "WBNB", collateralAmount: 42.00, collateralValue: 27103.80, debt: 4500, ratio: 602.3, lastActivity: "1m ago" },
  { address: "0xf1a8...63b4", collateral: "WBTC", collateralAmount: 0.75, collateralValue: 50505.00, debt: 7200, ratio: 701.5, lastActivity: "2m ago" },
  { address: "0x5e29...dc71", collateral: "WETH", collateralAmount: 8.50, collateralValue: 29074.25, debt: 5600, ratio: 519.2, lastActivity: "3w ago" },
  { address: "0xba4f...0e83", collateral: "WBNB", collateralAmount: 30.00, collateralValue: 19359.00, debt: 6100, ratio: 317.4, lastActivity: "1w ago" },
  { address: "0x08d7...a4f6", collateral: "WBTC", collateralAmount: 1.00, collateralValue: 67340.00, debt: 10000, ratio: 673.4, lastActivity: "2m ago" },
  // My Positions
  { address: "0xBa26...e9DF", collateral: "WETH", collateralAmount: 4.20, collateralValue: 14366.10, debt: 5500, ratio: 261.2, lastActivity: "3h ago" },
];

const MY_WALLET = "0xBa26...e9DF";

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

const collateralLogos: Record<string, string> = {
  WBTC: "https://tokens.1inch.io/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png",
  WETH: "https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png",
  WBNB: "https://tokens.1inch.io/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c.png",
};

const riskOrder: RiskCategory[] = ["critical", "at-risk", "moderate", "healthy", "very-safe"];

function PositionsContent() {
  const [activeFilter, setActiveFilter] = useState<RiskCategory | "all" | "mine">("all");

  const sortedPositions = [...mockPositions].sort((a, b) => a.ratio - b.ratio);

  const myPositions = sortedPositions.filter((p) => p.address === MY_WALLET);

  const filteredPositions = activeFilter === "all"
    ? sortedPositions
    : activeFilter === "mine"
    ? myPositions
    : sortedPositions.filter((p) => getRiskCategory(p.ratio) === activeFilter);

  const categoryCounts = riskOrder.reduce((acc, cat) => {
    acc[cat] = mockPositions.filter((p) => getRiskCategory(p.ratio) === cat).length;
    return acc;
  }, {} as Record<RiskCategory, number>);

  const totalDebt = mockPositions.reduce((sum, p) => sum + p.debt, 0);
  const totalCollateral = mockPositions.reduce((sum, p) => sum + p.collateralValue, 0);
  const avgRatio = totalCollateral / totalDebt * 100;

  return (
    <Layout>
      <div className="p-8 pb-0">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Overview Stats - scrolls away normally */}
              <div className="grid grid-cols-4 gap-4">
                <Card className="crypto-card border">
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-400 mb-1">Active Positions</div>
                    <div className="text-2xl font-bold text-white">{mockPositions.length}</div>
                  </CardContent>
                </Card>
                <Card className="crypto-card border">
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-400 mb-1">Total Collateral</div>
                    <div className="text-2xl font-bold text-white">${(totalCollateral / 1000).toFixed(1)}K</div>
                  </CardContent>
                </Card>
                <Card className="crypto-card border">
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-400 mb-1">Total Debt</div>
                    <div className="text-2xl font-bold text-white">${(totalDebt / 1000).toFixed(1)}K</div>
                  </CardContent>
                </Card>
                <Card className="crypto-card border">
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-400 mb-1">Avg. Collateral Ratio</div>
                    <div className="text-2xl font-bold text-green-400">{avgRatio.toFixed(1)}%</div>
                  </CardContent>
                </Card>
              </div>

              {/* Sticky section: Risk Distribution + Filters + Table Header */}
              <div className="sticky top-[45px] z-20 pt-2 pb-0" style={{ backgroundColor: "var(--background)" }}>
                {/* Risk Distribution Bar */}
                <Card className="crypto-card border mb-4">
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-400 mb-3">Risk Distribution</div>
                    <div className="flex rounded-lg overflow-hidden h-4">
                      {riskOrder.map((cat) => {
                        const count = categoryCounts[cat];
                        const pct = (count / mockPositions.length) * 100;
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

                {/* Filter Buttons */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {[
                    { key: "all" as const, label: `All (${mockPositions.length})` },
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

                {/* Table Header (part of sticky block) */}
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

              {/* Scrollable Table Body */}
              <div className="crypto-card border border-t-0 rounded-b-lg -mt-6 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <tbody>
                      {filteredPositions.map((position, i) => {
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
                                  src={collateralLogos[position.collateral]}
                                  alt={position.collateral}
                                  className="w-6 h-6 rounded-full"
                                />
                                <div>
                                  <span className="text-white text-sm">{position.collateralAmount} {position.collateral}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <span className="text-white text-sm">${position.collateralValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                            </td>
                            <td className="p-4 text-right">
                              <span className="text-white text-sm">{position.debt.toLocaleString()} ALUD</span>
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
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Sidebar - sticky and independently scrollable */}
            <div className="lg:sticky lg:top-[45px] lg:self-start lg:max-h-[calc(100vh-60px)] lg:overflow-y-auto scrollbar-hide space-y-6 pb-8">
              {/* Risk Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Risk Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {riskOrder.map((cat) => {
                    const count = categoryCounts[cat];
                    const pct = (count / mockPositions.length) * 100;
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
                      <span className="font-medium">$24.7M</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ALUD Circulating</span>
                      <span className="font-medium">$18.2M</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Stability Pool</span>
                      <span className="font-medium">$6.5M</span>
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

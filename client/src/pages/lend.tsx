import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  Lock,
  Unlock,
  Shield,
  Activity,
  Users,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
} from "lucide-react";

const aludLogo = "https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/ALUD.png";

// --- Mock Data ---

const collateralTokens = [
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    logo: "https://tokens.1inch.io/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png",
    price: 67340.0,
  },
  {
    symbol: "WBNB",
    name: "Wrapped BNB",
    logo: "https://tokens.1inch.io/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c.png",
    price: 645.2,
  },
  {
    symbol: "WETH",
    name: "Wrapped Ethereum",
    logo: "https://tokens.1inch.io/0x2170ed0880ac9a755fd29b2688956bd959f933f8.png",
    price: 3420.5,
  },
];

// Generate 30-day TVL mock data
function generateTVLData() {
  const data = [];
  let tvl = 8_200_000;
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    tvl += (Math.random() - 0.35) * 400_000;
    tvl = Math.max(tvl, 5_000_000);
    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      tvl: Math.round(tvl),
    });
  }
  return data;
}

const tvlData = generateTVLData();

const collateralDistribution = [
  { name: "WBTC", value: 5_200_000, color: "#c43419" },
  { name: "WETH", value: 4_800_000, color: "#d4a853" },
  { name: "WBNB", value: 2_400_000, color: "#8b4c42" },
];

const mockPositions = [
  {
    id: "1",
    collateral: collateralTokens[0],
    collateralAmount: 0.05,
    collateralValue: 3367.0,
    borrowedAmount: 2450.0,
    collateralizationRatio: 137.5,
    liquidationPrice: 59000.0,
    healthFactor: 1.25,
  },
  {
    id: "2",
    collateral: collateralTokens[2],
    collateralAmount: 1.25,
    collateralValue: 4275.63,
    borrowedAmount: 3200.0,
    collateralizationRatio: 133.6,
    liquidationPrice: 2816.0,
    healthFactor: 1.21,
  },
];

const recentActivity = [
  { type: "deposit", user: "0x7a3b...f42d", amount: "2.5 WETH", value: "$8,551", time: "2 min ago" },
  { type: "borrow", user: "0x1c9e...a8b3", amount: "4,200 ALUD", value: "$4,200", time: "8 min ago" },
  { type: "repay", user: "0x5f2a...c91e", amount: "1,800 ALUD", value: "$1,800", time: "15 min ago" },
  { type: "liquidation", user: "0x9d4c...b7a2", amount: "0.02 WBTC", value: "$1,347", time: "23 min ago" },
  { type: "deposit", user: "0x3e8f...d5c1", amount: "8.4 WBNB", value: "$5,420", time: "31 min ago" },
  { type: "borrow", user: "0xb2d7...e6f9", amount: "6,500 ALUD", value: "$6,500", time: "45 min ago" },
  { type: "repay", user: "0x4a1c...89d3", amount: "3,100 ALUD", value: "$3,100", time: "1 hr ago" },
  { type: "deposit", user: "0x8e5b...a2c4", amount: "0.08 WBTC", value: "$5,387", time: "1.5 hr ago" },
];

// Generate 30-day ALUR price mock data
function generateALURData() {
  const data = [];
  let price = 0.058;
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    price += (Math.random() - 0.38) * 0.004;
    price = Math.max(price, 0.04);
    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      price: parseFloat(price.toFixed(4)),
    });
  }
  return data;
}

// Generate 30-day ALUD peg/supply mock data
function generateALUDData() {
  const data = [];
  let supply = 6_800_000;
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    supply += (Math.random() - 0.35) * 200_000;
    supply = Math.max(supply, 5_000_000);
    const peg = 1.0 + (Math.random() - 0.5) * 0.006;
    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      supply: Math.round(supply),
      peg: parseFloat(peg.toFixed(4)),
    });
  }
  return data;
}

// Generate 30-day liquidation mock data
function generateLiquidationData() {
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const count = Math.floor(Math.random() * 8);
    const volume = count * (Math.random() * 15000 + 5000);
    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count,
      volume: Math.round(volume),
    });
  }
  return data;
}

const alurData = generateALURData();
const aludData = generateALUDData();
const liquidationData = generateLiquidationData();

const liquidationsByCollateral = [
  { name: "WBTC", value: 42, color: "#c43419" },
  { name: "WETH", value: 35, color: "#d4a853" },
  { name: "WBNB", value: 23, color: "#8b4c42" },
];

// --- Chart configs ---

const alurChartConfig = {
  price: { label: "ALUR Price", color: "#d4a853" },
};

const aludChartConfig = {
  supply: { label: "ALUD Supply", color: "#c43419" },
  peg: { label: "ALUD Peg", color: "#d4a853" },
};

const liquidationChartConfig = {
  count: { label: "Liquidations", color: "#c43419" },
  volume: { label: "Volume", color: "#d4a853" },
};

const liqPieChartConfig = {
  WBTC: { label: "WBTC", color: "#c43419" },
  WETH: { label: "WETH", color: "#d4a853" },
  WBNB: { label: "WBNB", color: "#8b4c42" },
};

const tvlChartConfig = {
  tvl: {
    label: "TVL",
    color: "#d4a853",
  },
};

const pieChartConfig = {
  WBTC: { label: "WBTC", color: "#c43419" },
  WETH: { label: "WETH", color: "#d4a853" },
  WBNB: { label: "WBNB", color: "#8b4c42" },
};

// --- Helpers ---

function getHealthColor(hf: number) {
  if (hf < 1.15) return "text-red-400";
  if (hf < 1.35) return "text-yellow-400";
  return "text-green-400";
}

function getHealthBadge(hf: number) {
  if (hf < 1.15) return "destructive" as const;
  if (hf < 1.35) return "secondary" as const;
  return "default" as const;
}

function getActivityIcon(type: string) {
  switch (type) {
    case "deposit":
      return <ArrowDownRight className="w-4 h-4 text-green-400" />;
    case "borrow":
      return <ArrowUpRight className="w-4 h-4 text-blue-400" />;
    case "repay":
      return <ArrowDownRight className="w-4 h-4 text-purple-400" />;
    case "liquidation":
      return <Zap className="w-4 h-4 text-red-400" />;
    default:
      return <Activity className="w-4 h-4 text-gray-400" />;
  }
}

function getActivityColor(type: string) {
  switch (type) {
    case "deposit": return "text-green-400";
    case "borrow": return "text-blue-400";
    case "repay": return "text-purple-400";
    case "liquidation": return "text-red-400";
    default: return "text-gray-400";
  }
}

// --- Custom Tooltip for Pie ---

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const total = collateralDistribution.reduce((s, d) => s + d.value, 0);
  const pct = ((item.value / total) * 100).toFixed(1);
  return (
    <div className="rounded-lg px-3 py-2 text-xs shadow-xl border" style={{ backgroundColor: "#1a0d2e", borderColor: "#3d2050" }}>
      <div className="font-medium text-white">{item.name}</div>
      <div style={{ color: "#d4a853" }}>${(item.value / 1_000_000).toFixed(1)}M ({pct}%)</div>
    </div>
  );
}

// --- Custom Tooltip for Liquidation Pie ---

function LiqPieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const total = liquidationsByCollateral.reduce((s, d) => s + d.value, 0);
  const pct = ((item.value / total) * 100).toFixed(1);
  return (
    <div className="rounded-lg px-3 py-2 text-xs shadow-xl border" style={{ backgroundColor: "#1a0d2e", borderColor: "#3d2050" }}>
      <div className="font-medium text-white">{item.name}</div>
      <div style={{ color: "#d4a853" }}>{item.value} liquidations ({pct}%)</div>
    </div>
  );
}

type ChartTab = "tvl" | "alluria" | "liquidations";

// --- Component ---

function DashboardContent() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<ChartTab>("tvl");

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_240px] gap-6">
            {/* Main Content Area */}
            <div className="space-y-6">
              {/* Section 1: Protocol Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* TVL */}
                <Card className="crypto-card border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Total Value Locked</span>
                    </div>
                    <div className="text-xl font-bold text-white">$12.4M</div>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-green-400">+5.2%</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Total Borrowed */}
                <Card className="crypto-card border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Total Borrowed</span>
                    </div>
                    <div className="text-xl font-bold text-white">$8.2M</div>
                    <div className="flex items-center gap-1 mt-1">
                      <img src={aludLogo} alt="ALUD" className="w-3 h-3 rounded-full" />
                      <span className="text-xs text-muted-foreground">ALUD minted</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Collateral Ratio */}
                <Card className="crypto-card border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Collateral Ratio</span>
                    </div>
                    <div className="text-xl font-bold text-green-400">156%</div>
                    <div className="flex items-center gap-1 mt-1">
                      <Shield className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-muted-foreground">Protocol avg</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Active Positions */}
                <Card className="crypto-card border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Active Positions</span>
                    </div>
                    <div className="text-xl font-bold text-white">1,247</div>
                    <div className="flex items-center gap-1 mt-1">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-green-400">+12 today</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Liquidations (24h) */}
                <Card className="crypto-card border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Liquidations (24h)</span>
                    </div>
                    <div className="text-xl font-bold text-white">3</div>
                    <div className="flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3 h-3 text-yellow-400" />
                      <span className="text-xs text-muted-foreground">positions</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Chart Tab Navigation */}
              <div className="rounded-lg p-1.5 grid grid-cols-3 gap-1.5" style={{ backgroundColor: "#1a0d2e", border: "1px solid #3d2050" }}>
                {(["tvl", "alluria", "liquidations"] as ChartTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      activeTab === tab
                        ? "text-white shadow-lg"
                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                    }`}
                    style={
                      activeTab === tab
                        ? { background: "linear-gradient(to right, #c43419, #d4a853)" }
                        : {}
                    }
                  >
                    {tab === "tvl" ? "Total Value Locked" : tab === "alluria" ? "Alluria" : "Liquidations"}
                  </button>
                ))}
              </div>

              {/* Section 2: Charts (conditional based on active tab) */}
              <div className="grid md:grid-cols-2 gap-6">
                {activeTab === "tvl" && (
                  <>
                    {/* TVL Over Time */}
                    <Card className="crypto-card border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">TVL Over Time</CardTitle>
                        <div className="text-2xl font-bold text-white">$12.4M</div>
                      </CardHeader>
                      <CardContent className="px-2 pb-0">
                        <ChartContainer config={tvlChartConfig} className="h-[240px] w-full">
                          <AreaChart data={tvlData} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                            <defs>
                              <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#c43419" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="#d4a853" stopOpacity={0.05} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#3d2050" vertical={false} />
                            <XAxis
                              dataKey="date"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: "#6b7280" }}
                              interval="preserveStartEnd"
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: "#6b7280" }}
                              tickFormatter={(v) => `$${(v / 1_000_000).toFixed(0)}M`}
                              width={45}
                            />
                            <ChartTooltip
                              content={
                                <ChartTooltipContent
                                  formatter={(value) => [`$${(Number(value) / 1_000_000).toFixed(2)}M`, "TVL"]}
                                  className="border"
                                  style={{ backgroundColor: "#1a0d2e", borderColor: "#3d2050" } as any}
                                />
                              }
                            />
                            <Area
                              type="monotone"
                              dataKey="tvl"
                              stroke="#d4a853"
                              strokeWidth={2}
                              fill="url(#tvlGradient)"
                            />
                          </AreaChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>

                    {/* Collateral Distribution */}
                    <Card className="crypto-card border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Collateral Distribution</CardTitle>
                        <div className="text-2xl font-bold text-white">$12.4M</div>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer config={pieChartConfig} className="h-[200px] w-full">
                          <PieChart>
                            <ChartTooltip content={<PieTooltip />} />
                            <Pie
                              data={collateralDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={75}
                              paddingAngle={3}
                              dataKey="value"
                              nameKey="name"
                              strokeWidth={0}
                            >
                              {collateralDistribution.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ChartContainer>
                        <div className="flex justify-center gap-4 mt-2">
                          {collateralDistribution.map((item) => (
                            <div key={item.name} className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                              <span className="text-xs text-muted-foreground">{item.name}</span>
                              <span className="text-xs text-white font-medium">${(item.value / 1_000_000).toFixed(1)}M</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {activeTab === "alluria" && (
                  <>
                    {/* ALUR Price Over Time */}
                    <Card className="crypto-card border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">ALUR Price</CardTitle>
                        <div className="text-2xl font-bold text-white">${alurData[alurData.length - 1].price.toFixed(4)}</div>
                      </CardHeader>
                      <CardContent className="px-2 pb-0">
                        <ChartContainer config={alurChartConfig} className="h-[240px] w-full">
                          <AreaChart data={alurData} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                            <defs>
                              <linearGradient id="alurGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#d4a853" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="#c43419" stopOpacity={0.05} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#3d2050" vertical={false} />
                            <XAxis
                              dataKey="date"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: "#6b7280" }}
                              interval="preserveStartEnd"
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: "#6b7280" }}
                              tickFormatter={(v) => `$${v.toFixed(3)}`}
                              width={50}
                              domain={["dataMin - 0.005", "dataMax + 0.005"]}
                            />
                            <ChartTooltip
                              content={
                                <ChartTooltipContent
                                  formatter={(value) => [`$${Number(value).toFixed(4)}`, "ALUR"]}
                                  className="border"
                                  style={{ backgroundColor: "#1a0d2e", borderColor: "#3d2050" } as any}
                                />
                              }
                            />
                            <Area
                              type="monotone"
                              dataKey="price"
                              stroke="#d4a853"
                              strokeWidth={2}
                              fill="url(#alurGradient)"
                            />
                          </AreaChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>

                    {/* ALUD Supply & Peg */}
                    <Card className="crypto-card border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">ALUD Supply & Peg</CardTitle>
                        <div className="flex items-center gap-3">
                          <div className="text-2xl font-bold text-white">${(aludData[aludData.length - 1].supply / 1_000_000).toFixed(1)}M</div>
                          <Badge variant="outline" className="text-xs" style={{ borderColor: "#3d2050", color: "#d4a853" }}>
                            ${aludData[aludData.length - 1].peg.toFixed(4)} peg
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="px-2 pb-0">
                        <ChartContainer config={aludChartConfig} className="h-[240px] w-full">
                          <AreaChart data={aludData} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                            <defs>
                              <linearGradient id="aludGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#c43419" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="#d4a853" stopOpacity={0.05} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#3d2050" vertical={false} />
                            <XAxis
                              dataKey="date"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: "#6b7280" }}
                              interval="preserveStartEnd"
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: "#6b7280" }}
                              tickFormatter={(v) => `$${(v / 1_000_000).toFixed(0)}M`}
                              width={45}
                            />
                            <ChartTooltip
                              content={
                                <ChartTooltipContent
                                  formatter={(value) => [`$${(Number(value) / 1_000_000).toFixed(2)}M`, "Supply"]}
                                  className="border"
                                  style={{ backgroundColor: "#1a0d2e", borderColor: "#3d2050" } as any}
                                />
                              }
                            />
                            <Area
                              type="monotone"
                              dataKey="supply"
                              stroke="#c43419"
                              strokeWidth={2}
                              fill="url(#aludGradient)"
                            />
                          </AreaChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  </>
                )}

                {activeTab === "liquidations" && (
                  <>
                    {/* Daily Liquidations */}
                    <Card className="crypto-card border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Daily Liquidations</CardTitle>
                        <div className="text-2xl font-bold text-white">{liquidationData.reduce((s, d) => s + d.count, 0)} total</div>
                      </CardHeader>
                      <CardContent className="px-2 pb-0">
                        <ChartContainer config={liquidationChartConfig} className="h-[240px] w-full">
                          <BarChart data={liquidationData} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#3d2050" vertical={false} />
                            <XAxis
                              dataKey="date"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: "#6b7280" }}
                              interval="preserveStartEnd"
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: "#6b7280" }}
                              width={30}
                              allowDecimals={false}
                            />
                            <ChartTooltip
                              content={
                                <ChartTooltipContent
                                  formatter={(value) => [value, "Liquidations"]}
                                  className="border"
                                  style={{ backgroundColor: "#1a0d2e", borderColor: "#3d2050" } as any}
                                />
                              }
                            />
                            <Bar dataKey="count" fill="#c43419" radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>

                    {/* Liquidations by Collateral */}
                    <Card className="crypto-card border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Liquidations by Collateral</CardTitle>
                        <div className="text-2xl font-bold text-white">{liquidationsByCollateral.reduce((s, d) => s + d.value, 0)} total</div>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer config={liqPieChartConfig} className="h-[200px] w-full">
                          <PieChart>
                            <ChartTooltip content={<LiqPieTooltip />} />
                            <Pie
                              data={liquidationsByCollateral}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={75}
                              paddingAngle={3}
                              dataKey="value"
                              nameKey="name"
                              strokeWidth={0}
                            >
                              {liquidationsByCollateral.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ChartContainer>
                        <div className="flex justify-center gap-4 mt-2">
                          {liquidationsByCollateral.map((item) => (
                            <div key={item.name} className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                              <span className="text-xs text-muted-foreground">{item.name}</span>
                              <span className="text-xs text-white font-medium">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              {/* Section 3: Positions + Activity */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Your Positions */}
                <Card className="crypto-card border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Your Positions</CardTitle>
                      <Badge variant="outline" className="text-xs">{mockPositions.length} active</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mockPositions.map((pos) => (
                      <div key={pos.id} className="p-3 border rounded-lg space-y-2 hover:bg-muted/50 transition-colors" style={{ borderColor: "#3d2050" }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <img src={pos.collateral.logo} alt={pos.collateral.symbol} className="w-6 h-6 rounded-full" />
                            <span className="font-medium text-white">{pos.collateral.symbol}</span>
                          </div>
                          <Badge variant={getHealthBadge(pos.healthFactor)}>
                            HF {pos.healthFactor.toFixed(2)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Collateral</span>
                            <div className="text-white font-medium">{pos.collateralAmount} {pos.collateral.symbol}</div>
                            <div className="text-muted-foreground">${pos.collateralValue.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Borrowed</span>
                            <div className="text-white font-medium">{pos.borrowedAmount.toLocaleString()} ALUD</div>
                            <div className={getHealthColor(pos.healthFactor)}>
                              {pos.collateralizationRatio.toFixed(1)}% ratio
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1 border-t" style={{ borderColor: "#3d2050" }}>
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-orange-400" />
                            <span className="text-muted-foreground">Liq. Price:</span>
                            <span className="text-orange-400 font-medium">${pos.liquidationPrice.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Recent Protocol Activity */}
                <Card className="crypto-card border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Recent Activity</CardTitle>
                      <Activity className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {recentActivity.map((event, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#1a0d2e" }}>
                            {getActivityIcon(event.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-medium capitalize ${getActivityColor(event.type)}`}>
                                {event.type}
                              </span>
                              <span className="text-xs text-muted-foreground">{event.user}</span>
                            </div>
                            <div className="text-xs text-white">{event.amount}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-white font-medium">{event.value}</div>
                            <div className="text-xs text-muted-foreground">{event.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Protocol Stats */}
              <Card className="crypto-card border">
                <CardHeader>
                  <CardTitle className="text-lg">Protocol Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Value Locked</span>
                      <span className="font-medium text-white">$12.4M</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ALUD Circulating</span>
                      <span className="font-medium text-white">$8.2M</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Utilization Rate</span>
                      <span className="font-medium" style={{ color: "#d4a853" }}>66.1%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Stability Pool</span>
                      <span className="font-medium text-white">$4.2M</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Base Rate</span>
                      <span className="font-medium text-green-400">3.2% APR</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Min Collateral Ratio</span>
                      <span className="font-medium text-white">110%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="crypto-card border">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => navigate("/deposit")}
                    className="w-full justify-start gap-3"
                    style={{ background: "linear-gradient(to right, #c43419, #d4a853)" }}
                  >
                    <Lock className="w-4 h-4" />
                    Deposit Collateral
                  </Button>
                  <Button
                    onClick={() => navigate("/repay")}
                    variant="outline"
                    className="w-full justify-start gap-3 border hover:bg-muted/50"
                    style={{ borderColor: "#3d2050" }}
                  >
                    <Unlock className="w-4 h-4" />
                    Repay ALUD
                  </Button>
                  <Button
                    onClick={() => navigate("/stability-pool")}
                    variant="outline"
                    className="w-full justify-start gap-3 border hover:bg-muted/50"
                    style={{ borderColor: "#3d2050" }}
                  >
                    <Shield className="w-4 h-4" />
                    Stability Pool
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function Lend() {
  return <DashboardContent />;
}

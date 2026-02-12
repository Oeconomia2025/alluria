import { useState, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  ExternalLink,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// Protocol definitions
const protocols = [
  {
    slug: "staking",
    name: "OEC Staking",
    description: "Stake OEC tokens to earn yield and secure the network. Flexible and locked staking options with competitive APY.",
    category: "Staking",
    gradient: "from-cyan-500 to-blue-600",
    gradientCSS: "linear-gradient(135deg, #06b6d4, #2563eb)",
    accentColor: "#06b6d4",
    accentColor2: "#2563eb",
    logo: "/ecosystem/stake.png",
    url: "https://staking.oeconomia.io",
    tvl: "$2.4M",
    users: "1,247",
    apy: "12.5%",
    volume24h: "$185K",
  },
  {
    slug: "eloqura",
    name: "Eloqura",
    description: "Decentralized exchange with deep liquidity pools, token swaps, and yield farming across multiple trading pairs.",
    category: "DEX",
    gradient: "from-purple-500 to-pink-500",
    gradientCSS: "linear-gradient(135deg, #a855f7, #ec4899)",
    accentColor: "#a855f7",
    accentColor2: "#ec4899",
    logo: "/ecosystem/eloqura.png",
    url: "https://eloqura.oeconomia.io",
    tvl: "$5.1M",
    users: "3,892",
    apy: "18.2%",
    volume24h: "$720K",
  },
  {
    slug: "alluria",
    name: "Alluria",
    description: "Collateralized lending protocol. Deposit assets as collateral and borrow ALUD stablecoin at low interest rates.",
    category: "Lending",
    gradient: "from-green-500 to-teal-500",
    gradientCSS: "linear-gradient(135deg, #22c55e, #14b8a6)",
    accentColor: "#22c55e",
    accentColor2: "#14b8a6",
    logo: "/ecosystem/alur.png",
    url: "https://alluria.oeconomia.io",
    tvl: "$3.8M",
    users: "2,156",
    apy: "8.7%",
    volume24h: "$430K",
  },
  {
    slug: "artivya",
    name: "Artivya",
    description: "NFT marketplace and creator platform. Mint, trade, and showcase digital art with built-in royalty enforcement.",
    category: "NFT",
    gradient: "from-orange-500 to-red-500",
    gradientCSS: "linear-gradient(135deg, #f97316, #ef4444)",
    accentColor: "#f97316",
    accentColor2: "#ef4444",
    logo: "/ecosystem/art.png",
    url: "https://artivya.oeconomia.io",
    tvl: "$890K",
    users: "5,340",
    apy: "—",
    volume24h: "$95K",
  },
  {
    slug: "iridescia",
    name: "Iridescia",
    description: "Advanced DeFi aggregator with yield optimization, auto-compounding vaults, and cross-protocol strategies.",
    category: "DeFi",
    gradient: "from-pink-500 to-violet-500",
    gradientCSS: "linear-gradient(135deg, #ec4899, #8b5cf6)",
    accentColor: "#ec4899",
    accentColor2: "#8b5cf6",
    logo: "/ecosystem/ill.png",
    url: "https://iridescia.oeconomia.io",
    tvl: "$1.6M",
    users: "982",
    apy: "22.4%",
    volume24h: "$210K",
  },
];

// Chart styling
const chartTooltipStyle = {
  backgroundColor: "#1F2937",
  border: "1px solid #374151",
  borderRadius: "8px",
  color: "#F9FAFB",
  fontSize: "12px",
};

const chartMargin = { top: 10, right: 10, bottom: 0, left: -15 };

// Mock data generators
function generateTVLData(accent: string) {
  const base = 1000000 + Math.random() * 4000000;
  return Array.from({ length: 30 }, (_, i) => ({
    day: `Day ${i + 1}`,
    tvl: base + (base * 0.4 * (i / 30)) + (Math.random() - 0.3) * base * 0.08,
  }));
}

function generateVolumeData() {
  return Array.from({ length: 14 }, (_, i) => ({
    day: `Day ${i + 1}`,
    volume: 50000 + Math.random() * 200000,
  }));
}

function generateUsersData() {
  const base = 50 + Math.floor(Math.random() * 100);
  return Array.from({ length: 30 }, (_, i) => ({
    day: `Day ${i + 1}`,
    users: base + Math.floor(i * 2.5) + Math.floor(Math.random() * 20),
  }));
}

function generateRevenueData() {
  return Array.from({ length: 14 }, (_, i) => ({
    day: `Day ${i + 1}`,
    fees: 500 + Math.random() * 3000,
    rewards: 200 + Math.random() * 1500,
  }));
}

// Protocol card for overview grid
function ProtocolCard({ protocol, onClick }: { protocol: typeof protocols[0]; onClick: () => void }) {
  return (
    <Card
      className="group cursor-pointer border-gray-700/50 hover:border-gray-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-black/30 overflow-hidden"
      style={{ backgroundColor: "#0d1219" }}
      onClick={onClick}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-gray-700/50">
              <img src={protocol.logo} alt={protocol.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-gray-100">{protocol.name}</h3>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  background: `${protocol.accentColor}20`,
                  color: protocol.accentColor,
                  border: `1px solid ${protocol.accentColor}40`,
                }}
              >
                {protocol.category}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-400 mb-4 line-clamp-2">{protocol.description}</p>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-lg p-2.5">
            <p className="text-xs text-gray-500 mb-0.5">TVL</p>
            <p className="text-sm font-semibold text-white">{protocol.tvl}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-2.5">
            <p className="text-xs text-gray-500 mb-0.5">Users</p>
            <p className="text-sm font-semibold text-white">{protocol.users}</p>
          </div>
        </div>
      </div>

      {/* Bottom gradient accent */}
      <div className="h-1 w-full" style={{ background: protocol.gradientCSS }} />
    </Card>
  );
}

// Detail view for a single protocol
function ProtocolDetail({ protocol }: { protocol: typeof protocols[0] }) {
  const [, navigate] = useLocation();

  const tvlData = useMemo(() => generateTVLData(protocol.accentColor), [protocol.slug]);
  const volumeData = useMemo(() => generateVolumeData(), [protocol.slug]);
  const usersData = useMemo(() => generateUsersData(), [protocol.slug]);
  const revenueData = useMemo(() => generateRevenueData(), [protocol.slug]);

  const kpis = [
    { label: "Total Value Locked", value: protocol.tvl, icon: DollarSign, change: "+12.3%" },
    { label: "Active Users", value: protocol.users, icon: Users, change: "+8.1%" },
    { label: "24h Volume", value: protocol.volume24h, icon: Activity, change: "+5.7%" },
    { label: "APY", value: protocol.apy, icon: TrendingUp, change: protocol.apy === "—" ? "—" : "+2.1%" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Back button + header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/ecosystem")}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-700/50">
            <img src={protocol.logo} alt={protocol.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{protocol.name}</h1>
            <p className="text-sm text-gray-400">{protocol.description}</p>
          </div>
        </div>
        <a
          href={protocol.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
          style={{ background: protocol.gradientCSS }}
        >
          Visit dApp <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card
            key={kpi.label}
            className="p-4 border-gray-700/50"
            style={{ backgroundColor: "#0d1219" }}
          >
            <div className="flex items-center justify-between mb-2">
              <kpi.icon className="w-4 h-4 text-gray-500" />
              {kpi.change !== "—" && (
                <span className="text-xs font-medium text-green-400">{kpi.change}</span>
              )}
            </div>
            <p className="text-2xl font-bold text-white">{kpi.value}</p>
            <p className="text-xs text-gray-500 mt-1">{kpi.label}</p>
          </Card>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* TVL over time - Area Chart */}
        <Card className="p-4 border-gray-700/50" style={{ backgroundColor: "#0d1219" }}>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Total Value Locked (30d)</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tvlData} margin={chartMargin}>
                <defs>
                  <linearGradient id={`tvl-${protocol.slug}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={protocol.accentColor} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={protocol.accentColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} interval={6} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`$${(v / 1e6).toFixed(2)}M`, "TVL"]} />
                <Area type="monotone" dataKey="tvl" stroke={protocol.accentColor} strokeWidth={2} fill={`url(#tvl-${protocol.slug})`} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Volume - Bar Chart */}
        <Card className="p-4 border-gray-700/50" style={{ backgroundColor: "#0d1219" }}>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Daily Volume (14d)</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} interval={2} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`$${(v / 1000).toFixed(1)}K`, "Volume"]} />
                <Bar dataKey="volume" fill={protocol.accentColor2} radius={[4, 4, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Users growth - Line Chart */}
        <Card className="p-4 border-gray-700/50" style={{ backgroundColor: "#0d1219" }}>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Active Users (30d)</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={usersData} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} interval={6} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [v.toLocaleString(), "Users"]} />
                <Line type="monotone" dataKey="users" stroke={protocol.accentColor} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: protocol.accentColor }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Revenue breakdown - Composed Chart */}
        <Card className="p-4 border-gray-700/50" style={{ backgroundColor: "#0d1219" }}>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Revenue Breakdown (14d)</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueData} margin={chartMargin}>
                <defs>
                  <linearGradient id={`fees-${protocol.slug}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={protocol.accentColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={protocol.accentColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} interval={2} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}K`} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`$${v.toFixed(0)}`, undefined]} />
                <Area type="monotone" dataKey="fees" stroke={protocol.accentColor} fill={`url(#fees-${protocol.slug})`} strokeWidth={2} name="Fees" />
                <Line type="monotone" dataKey="rewards" stroke={protocol.accentColor2} strokeWidth={2} dot={false} name="Rewards" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Main Ecosystem page
export default function Ecosystem() {
  const [, navigate] = useLocation();
  const [matched, params] = useRoute("/ecosystem/:protocol");
  const selectedSlug = matched ? params?.protocol : null;
  const selectedProtocol = selectedSlug ? protocols.find((p) => p.slug === selectedSlug) : null;

  return (
    <Layout>
      {selectedProtocol ? (
        <ProtocolDetail protocol={selectedProtocol} />
      ) : (
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-white">Oeconomia Ecosystem</h1>
            <p className="text-sm text-gray-400 mt-1">
              Explore the protocols powering the Oeconomia DeFi ecosystem
            </p>
          </div>

          {/* Protocol grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {protocols.map((protocol) => (
              <ProtocolCard
                key={protocol.slug}
                protocol={protocol}
                onClick={() => navigate(`/ecosystem/${protocol.slug}`)}
              />
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}

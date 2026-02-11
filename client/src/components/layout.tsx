import { useState, ReactNode, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { WalletConnect } from "@/components/wallet-connect";
import { EcosystemSidebar } from "@/components/ecosystem-sidebar";

import {
  LayoutDashboard,
  Lock,
  Unlock,
  Shield,
  Coins,
  ArrowUpDown,
  Users,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Globe,
  Heart,
} from "lucide-react";
import { SiX, SiMedium, SiYoutube, SiDiscord, SiGithub, SiTelegram } from "react-icons/si";

interface LayoutProps {
  children: ReactNode;
}

const alurLogo = "https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/With%20Border/ALUR%20no%20Border.png";


export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebar-collapsed");
      return saved === "true";
    }
    return false;
  });

  // Live token prices
  const [tokenPrices, setTokenPrices] = useState<Record<string, number>>({
    ALUR: 0.0842,
    ALUD: 1.00,
    BTC: 0,
    ETH: 0,
    BNB: 0,
    TAO: 0,
  });

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,bittensor&vs_currencies=usd"
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setTokenPrices((prev) => ({
          ...prev,
          BTC: data.bitcoin?.usd ?? prev.BTC,
          ETH: data.ethereum?.usd ?? prev.ETH,
          BNB: data.binancecoin?.usd ?? prev.BNB,
          TAO: data.bittensor?.usd ?? prev.TAO,
        }));
      } catch (err) {
        console.error("CoinGecko fetch failed, trying fallback:", err);
        try {
          const res = await fetch(
            "https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC,ETH,BNB&tsyms=USD"
          );
          if (res.ok) {
            const data = await res.json();
            setTokenPrices((prev) => ({
              ...prev,
              BTC: data.BTC?.USD ?? prev.BTC,
              ETH: data.ETH?.USD ?? prev.ETH,
              BNB: data.BNB?.USD ?? prev.BNB,
            }));
          }
        } catch (fallbackErr) {
          console.error("Fallback fetch also failed:", fallbackErr);
        }
      }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number) => {
    if (price === 0) return "...";
    if (price >= 1000) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(2);
    if (price >= 0.01) return price.toFixed(4);
    return price.toFixed(6);
  };

  const [linksOpen, setLinksOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [donationStep, setDonationStep] = useState<"addresses" | "thankyou">("addresses");
  const [selectedDonationType, setSelectedDonationType] = useState<string>("");
  const [donorName, setDonorName] = useState("");

  const [location, navigate] = useLocation();
  const isNavigatingRef = useRef(false);
  const lockedCollapsedStateRef = useRef<boolean | null>(null);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Social links
  const socialLinks = [
    { name: "Twitter/X", icon: SiX, url: "https://x.com/Oeconomia2025", enabled: true },
    { name: "Medium", icon: SiMedium, url: "https://medium.com/@oeconomia2025", enabled: true },
    { name: "YouTube", icon: SiYoutube, url: "https://www.youtube.com/@Oeconomia2025", enabled: true },
    { name: "Discord", icon: SiDiscord, url: "https://discord.com/invite/XSgZgeVD", enabled: true },
    { name: "GitHub", icon: SiGithub, url: "https://github.com/Oeconomia2025", enabled: true },
    { name: "Telegram", icon: SiTelegram, url: "https://t.me/OeconomiaDAO", enabled: true },
  ];

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  // Enforce locked collapse state during navigation
  useEffect(() => {
    if (lockedCollapsedStateRef.current !== null && sidebarCollapsed !== lockedCollapsedStateRef.current) {
      setSidebarCollapsed(lockedCollapsedStateRef.current);
      localStorage.setItem("sidebar-collapsed", String(lockedCollapsedStateRef.current));
      setTimeout(() => {
        if (lockedCollapsedStateRef.current !== null) {
          setSidebarCollapsed(lockedCollapsedStateRef.current);
        }
      }, 0);
    }
  }, [sidebarCollapsed]);

  // Unlock after navigation completes
  useEffect(() => {
    if (isNavigatingRef.current) {
      setTimeout(() => {
        isNavigatingRef.current = false;
        lockedCollapsedStateRef.current = null;
      }, 100);
    }
  }, [location]);

  const handleNavigation = (path: string) => {
    const wasCollapsed = sidebarCollapsed;

    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      navigate(path);
      setSidebarOpen(false);
      return;
    }

    lockedCollapsedStateRef.current = wasCollapsed;
    isNavigatingRef.current = true;
    localStorage.setItem("sidebar-collapsed", String(wasCollapsed));
    navigate(path);
    setTimeout(() => {
      setSidebarCollapsed(wasCollapsed);
      localStorage.setItem("sidebar-collapsed", String(wasCollapsed));
    }, 1);
  };

  const toggleCollapsed = () => {
    isNavigatingRef.current = false;
    lockedCollapsedStateRef.current = null;
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/", active: location === "/" || location === "/lend" },
    { icon: Lock, label: "Deposit", path: "/deposit", active: location === "/deposit" },
    { icon: Unlock, label: "Repay", path: "/repay", active: location === "/repay" },
    { icon: Shield, label: "Stability Pool", path: "/stability-pool", active: location === "/stability-pool" },
    { icon: Coins, label: "ALUR Staking", path: "/alur-staking", active: location === "/alur-staking" },
    { icon: ArrowUpDown, label: "Redemptions", path: "/redemptions", active: location === "/redemptions" },
    { icon: Users, label: "Positions", path: "/positions", active: location === "/positions" },
  ];

  return (
    <>
      {/* Collapse/Expand button - outside all containers for true fixed positioning */}
      <button
        onClick={toggleCollapsed}
        className={`hidden lg:flex fixed top-[29px] z-[60] w-6 h-6 border rounded-full items-center justify-center hover:opacity-80 transition-all duration-300 ${
          sidebarCollapsed ? "left-[52px]" : "left-[180px]"
        }`}
        style={{ backgroundColor: "#2a1f3d", borderColor: "#c89a6d" }}
        title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {sidebarCollapsed ? <ChevronRight className="w-3 h-3" style={{ color: "#d4a853" }} /> : <ChevronLeft className="w-3 h-3" style={{ color: "#d4a853" }} />}
      </button>

      {/* Root: sidebar + main column */}
      <div className="min-h-screen bg-background text-foreground flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 ${
            sidebarCollapsed ? "w-16" : "w-48"
          } transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col shadow-xl shadow-black/70`}
          style={{ backgroundColor: "#10031d", borderRight: "1px solid #c89a6d" }}
        >
          {/* Sidebar header */}
          <div className="sticky top-0 z-10 flex items-center justify-between h-20 px-4 border-b-0" style={{ backgroundColor: "#10031d" }}>
            <div className={`flex items-center ${sidebarCollapsed ? "justify-center w-full" : "space-x-3"}`}>
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                <img src={alurLogo} alt="Alluria Logo" className="w-full h-full object-cover" />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <h2 className="text-lg font-bold text-white">Alluria</h2>
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Sidebar nav */}
          <div className="sticky top-20 z-10 border-b-0" style={{ backgroundColor: "#10031d" }}>
            <nav className="p-2">
              <ul className="space-y-2">
                {sidebarItems.map((item, i) => (
                  <li key={i}>
                    <button
                      onClick={() => handleNavigation(item.path)}
                      className={`w-full flex items-center ${
                        sidebarCollapsed ? "justify-center px-2" : "space-x-3 px-3"
                      } py-2 rounded-lg text-left transition-colors group relative ${
                        item.active
                          ? "text-white font-medium shadow-lg transition-all duration-200"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      }`}
                      style={item.active ? { background: "linear-gradient(to right, #c43419, #d4a853)" } : {}}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" style={item.active ? { color: "white" } : {}} />
                      {!sidebarCollapsed && <span className="whitespace-nowrap" style={item.active ? { color: "white" } : {}}>{item.label}</span>}
                      {sidebarCollapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-[var(--crypto-dark)] text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                          {item.label}
                        </div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Fill space */}
          <div className="flex-1 overflow-y-auto p-4" />

          {/* Bottom section */}
          <div className="sticky bottom-0 p-2 border-t-0 flex flex-col space-y-2" style={{ backgroundColor: "#10031d" }}>
            {/* Links Button */}
            <DropdownMenu onOpenChange={setLinksOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  className={`w-full flex items-center ${
                    sidebarCollapsed ? "justify-center px-2" : "space-x-3 px-3"
                  } py-2 rounded-lg text-left transition-colors group relative transition-all duration-200 ${
                    linksOpen ? "text-white font-medium shadow-lg" : "bg-gray-800 shadow-lg"
                  }`}
                  style={linksOpen ? { background: "linear-gradient(to right, #c43419, #d4a853)" } : {}}
                  onMouseEnter={(e) => { if (!linksOpen) e.currentTarget.style.background = "linear-gradient(to right, #c43419, #d4a853)"; }}
                  onMouseLeave={(e) => { if (!linksOpen) e.currentTarget.style.background = ""; }}
                  title={sidebarCollapsed ? "Links" : undefined}
                >
                  <Globe className="w-5 h-5 flex-shrink-0" style={{ color: "white" }} />
                  {!sidebarCollapsed && <span className="text-white">Links</span>}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-[var(--crypto-dark)] text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      Links
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className={`mb-2 ${sidebarCollapsed ? "w-[calc(4rem-1rem)]" : "w-[calc(12rem-1rem)]"}`}
                style={{ borderColor: "#c89a6d", backgroundColor: "#10031d" }}
              >
                <DropdownMenuItem
                  onClick={() => window.open("https://oeconomia.tech/", "_blank")}
                  className={`cursor-pointer rounded-md transition-all duration-200 focus:bg-transparent ${
                    sidebarCollapsed ? "justify-center px-2" : "px-3"
                  }`}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "linear-gradient(to right, #c43419, #d4a853)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
                >
                  <Globe className={`w-5 h-5 flex-shrink-0 ${sidebarCollapsed ? "" : "mr-3"}`} />
                  {!sidebarCollapsed && <span>Website</span>}
                </DropdownMenuItem>
                {socialLinks.map((link) => (
                  <DropdownMenuItem
                    key={link.name}
                    onClick={() => link.enabled && window.open(link.url, "_blank")}
                    className={`cursor-pointer rounded-md transition-all duration-200 focus:bg-transparent ${
                      !link.enabled ? "opacity-50" : ""
                    } ${sidebarCollapsed ? "justify-center px-2" : "px-3"}`}
                    disabled={!link.enabled}
                    onMouseEnter={(e) => { if (link.enabled) e.currentTarget.style.background = "linear-gradient(to right, #c43419, #d4a853)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
                  >
                    <link.icon className={`w-5 h-5 flex-shrink-0 ${sidebarCollapsed ? "" : "mr-3"}`} />
                    {!sidebarCollapsed && <span>{link.name}</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Oeconomia Button */}
            <button
              onClick={() => window.open("https://oeconomia.io/", "_blank")}
              className={`w-full flex items-center ${
                sidebarCollapsed ? "justify-center px-2" : "space-x-3 px-3"
              } py-2 rounded-lg text-left transition-colors group relative text-white hover:bg-white/5 transition-all duration-200`}
              style={{
                background: "linear-gradient(#10031d, #10031d) padding-box, linear-gradient(to right, #c43419, #d4a853) border-box",
                border: "2px solid transparent",
              }}
              title={sidebarCollapsed ? "Oeconomia" : undefined}
            >
              <img
                src="https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/images/OEC%20Logo%20Square.png"
                alt="OEC Logo"
                className="w-5 h-5 flex-shrink-0"
              />
              {!sidebarCollapsed && <span>Oeconomia</span>}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-[var(--crypto-dark)] text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  Oeconomia
                </div>
              )}
            </button>
            <WalletConnect collapsed={sidebarCollapsed} />
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main column */}
        <div className="flex-1 lg:ml-0 mr-9 relative flex flex-col">
          {/* Price pills bar */}
          <div
            className="sticky top-0 z-30 px-4 py-2 flex items-center shadow-xl shadow-black/70"
            style={{ backgroundColor: "#10031d", borderBottom: "1px solid #c89a6d", borderLeft: "1px solid #c89a6d" }}
          >
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="lg:hidden mr-2">
              <Menu className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1">
              {[
                { symbol: "ALUR", logo: "https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/With%20Border/ALUR%20no%20Border.png", group: "alluria" },
                { symbol: "ALUD", logo: "https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/ALUD.png", group: "alluria" },
                { symbol: "BTC", logo: "https://tokens.1inch.io/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png", group: "market" },
                { symbol: "ETH", logo: "https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png", group: "market" },
                { symbol: "BNB", logo: "https://tokens.1inch.io/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c.png", group: "market" },
                { symbol: "TAO", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/22974.png", group: "market" },
              ].map((token, i, arr) => (
                <div key={token.symbol} className="flex items-center gap-2">
                  {i > 0 && arr[i - 1].group !== token.group && (
                    <div className="w-px h-5 bg-gray-600 mx-6" />
                  )}
                  <div
                    className="flex items-center gap-1.5 rounded-full pl-[3px] pr-3 py-[3px] text-sm font-medium whitespace-nowrap"
                    style={{ backgroundColor: "rgba(200, 154, 109, 0.2)", border: "1px solid rgba(200, 154, 109, 0.4)" }}
                  >
                    <img src={token.logo} alt={token.symbol} className="w-5 h-5 rounded-full" />
                    <span className="text-gray-400">{token.symbol}</span>
                    <span style={{ color: "#d4a853" }}>${formatPrice(tokenPrices[token.symbol])}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Page content + footer */}
          <main className="flex-1">
            {children}
            <footer className="border-t-0 mt-8 py-6 px-6 text-center">
              <p className="text-sm text-muted-foreground">© 2025 Oeconomia. All rights reserved.</p>
            </footer>
          </main>
        </div>
      </div>

      {/* Ecosystem Sidebar */}
      <EcosystemSidebar />

      {/* Support Modal */}
      {supportOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSupportOpen(false)}
        >
          <Card
            className="max-w-4xl w-full bg-[var(--crypto-card)] border-crypto-border p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setSupportOpen(false);
                setTimeout(() => {
                  setDonationStep("addresses");
                  setSelectedDonationType("");
                  setDonorName("");
                }, 300);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {donationStep === "addresses" ? (
              <div className="animate-in fade-in duration-500">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500/20 to-red-500/20 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-pink-400 fill-current animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Support Development</h2>
                    <p className="text-sm text-gray-400">Help Oeconomia Grow</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <p className="text-gray-300">
                    Your support helps fund essential infrastructure including servers, databases, APIs, and
                    blockchain node operations.
                  </p>
                  <p className="text-gray-300">
                    Every contribution directly supports continued development and innovation.
                  </p>

                  <div className="bg-gradient-to-r from-cyan-500/10 to-purple-600/10 border border-cyan-500/30 rounded-lg p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-cyan-400 mb-2">Donation Addresses (Click to Copy):</h3>
                    <div className="space-y-3 text-sm">
                      {[
                        { label: "EVM Networks:", key: "evm", value: "0xD02dbe54454F6FE3c2F9F1F096C5460284E418Ed", type: "EVM Networks" },
                        { label: "Solana:", key: "sol", value: "HkJhW2X9xYw9n4sp3e9BBh33Np6iNghpU7gtDJ5ATqYx", type: "Solana" },
                        { label: "Sui Network:", key: "sui", value: "0xef000226f93506df5a3b1eaaae7835e919ff69c18d4929ed1537d656fb324dfe", type: "Sui Network" },
                        { label: "Bitcoin:", key: "btc", value: "bc1qwtzdtx6ghfzy065wmv3xfk8tyqqr2w87tnrx9r", type: "Bitcoin" },
                        { label: "CashApp:", key: "cashapp", value: "$oooJASONooo", type: "CashApp" },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center gap-4">
                          <span className="text-gray-400 font-medium min-w-[120px]">{item.label}</span>
                          <div
                            className={`font-mono text-xs p-2 rounded break-all cursor-pointer transition-all duration-300 flex-1 ${
                              copiedAddress === item.key
                                ? "bg-green-500/30 border border-green-500/50 text-green-300"
                                : "bg-black/30 hover:bg-black/50"
                            }`}
                            onClick={() => {
                              navigator.clipboard.writeText(item.value);
                              setCopiedAddress(item.key);
                              setSelectedDonationType(item.type);
                              setTimeout(() => setCopiedAddress(null), 2000);
                              setTimeout(() => setDonationStep("thankyou"), 2500);
                            }}
                            title="Click to copy"
                          >
                            {copiedAddress === item.key ? "Copied!" : item.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <p className="text-sm text-green-400">
                      <strong>Thank you for your support!</strong> Every contribution is deeply appreciated.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => setSupportOpen(false)}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white"
                >
                  Close
                </Button>
              </div>
            ) : (
              <div className="animate-in slide-in-from-right duration-700 ease-out">
                <div className="text-center space-y-6">
                  <div className="relative">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-pink-500/20 to-red-500/20 flex items-center justify-center animate-pulse">
                      <Heart className="w-10 h-10 text-pink-400 fill-current animate-bounce" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping" style={{ animationDelay: "0.5s" }}></div>
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                      Thank You!
                    </h2>
                    <p className="text-lg text-gray-300">
                      Your {selectedDonationType} donation address has been copied
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-4 space-y-3">
                    <p className="text-gray-300">Your support means the world to us! Every contribution helps fund:</p>
                    <ul className="text-sm text-gray-400 space-y-1 text-left">
                      <li>Server infrastructure & database operations</li>
                      <li>Live market data API subscriptions</li>
                      <li>New feature development</li>
                      <li>Community growth initiatives</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm text-gray-400">Want a personal thank you message? (Optional)</p>
                    <input
                      type="text"
                      placeholder="Your name or handle"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="w-full px-3 py-2 bg-black/30 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {donorName && (
                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-3">
                      <p className="text-green-400">
                        <span className="font-semibold">Dear {donorName},</span><br />
                        Your generosity will be remembered. When Oeconomia thrives, supporters like you will be among
                        the first to benefit from our success. Thank you for believing in our vision!
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={() => { setDonationStep("addresses"); setSelectedDonationType(""); }}
                      variant="outline"
                      className="flex-1 border-gray-600 hover:bg-gray-700"
                    >
                      Back to Addresses
                    </Button>
                    <Button
                      onClick={() => {
                        setSupportOpen(false);
                        setTimeout(() => { setDonationStep("addresses"); setSelectedDonationType(""); setDonorName(""); }, 300);
                      }}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      Complete
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAlluria } from "@/hooks/use-alluria";
import { useAluriaActions } from "@/hooks/use-alluria-actions";
import {
  COLLATERAL_TOKENS,
  formatALUD,
  formatCollateral,
  formatUSD,
  formatUSDDisplay,
  formatRatio,
  getCollateralMeta,
  type CollateralTokenMeta,
  type Address,
} from "@/services/alluria-contracts";

const aludLogo = "https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/ALUD.png";

import { AlertTriangle, Lock } from "lucide-react";

function DepositContent() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [collateralToken, setCollateralToken] = useState<CollateralTokenMeta | null>(null);
  const [collateralAmount, setCollateralAmount] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [lastEditedField, setLastEditedField] = useState<'collateral' | 'borrow'>('collateral');
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tokenSearchQuery, setTokenSearchQuery] = useState("");
  const [collateralizationRatio, setCollateralizationRatio] = useState(150);
  const [liquidationPrice, setLiquidationPrice] = useState(0);
  const [maxBorrowAmount, setMaxBorrowAmount] = useState(0);

  const {
    userTroves,
    collateralPrices,
    collateralBalances,
    systemStats,
    isConnected,
    contractsDeployed,
    refetch,
  } = useAlluria();
  const actions = useAluriaActions();

  // Default to WETH
  useEffect(() => {
    if (!collateralToken) {
      const weth = COLLATERAL_TOKENS.find((t) => t.symbol === "WETH");
      if (weth) setCollateralToken(weth);
    }
  }, [collateralToken]);

  // Get live price for selected token
  const livePrice = collateralToken && collateralPrices[collateralToken.address]
    ? Number(formatUSD(collateralPrices[collateralToken.address]))
    : 0;

  // Get live balance for selected token
  const liveBalance = collateralToken && collateralBalances[collateralToken.address]
    ? Number(formatCollateral(collateralBalances[collateralToken.address], collateralToken.decimals))
    : 0;

  // Recalculate ratios
  useEffect(() => {
    if (collateralToken && collateralAmount && livePrice > 0) {
      const collateralValue = parseFloat(collateralAmount) * livePrice;
      const maxBorrow = collateralValue / 1.10;
      setMaxBorrowAmount(maxBorrow);

      if (lastEditedField === 'collateral') {
        const borrowValue = collateralValue / (collateralizationRatio / 100);
        setBorrowAmount(borrowValue > 0 ? borrowValue.toFixed(2) : "");
      } else if (lastEditedField === 'borrow' && borrowAmount) {
        const borrowValue = parseFloat(borrowAmount);
        const requiredRatio = (collateralValue / borrowValue) * 100;
        setCollateralizationRatio(Math.max(110, requiredRatio));
      }

      if (borrowAmount) {
        const liqPrice = (parseFloat(borrowAmount) * 1.10) / parseFloat(collateralAmount);
        setLiquidationPrice(liqPrice);
      }
    }
  }, [collateralAmount, borrowAmount, collateralToken, lastEditedField, collateralizationRatio, livePrice]);

  const handleCollateralAmountChange = (value: string) => {
    setCollateralAmount(value);
    setLastEditedField('collateral');
  };

  const handleBorrowAmountChange = (value: string) => {
    setBorrowAmount(value);
    setLastEditedField('borrow');
  };

  const handlePercentageClick = (percentage: number) => {
    if (liveBalance > 0) {
      const amount = (liveBalance * percentage / 100).toFixed(6);
      setCollateralAmount(amount);
      setLastEditedField('collateral');
    }
  };

  const handleDeposit = async () => {
    if (!collateralToken || !collateralAmount || !borrowAmount) {
      toast({ title: "Missing Information", description: "Please select collateral token and enter amounts.", variant: "destructive" });
      return;
    }
    if (collateralizationRatio < 110) {
      toast({ title: "Insufficient Collateralization", description: "Collateralization ratio must be at least 110%.", variant: "destructive" });
      return;
    }

    actions.openTrove(
      collateralToken.address as Address,
      collateralAmount,
      borrowAmount,
      collateralToken.decimals,
      () => {
        setCollateralAmount("");
        setBorrowAmount("");
        setCollateralizationRatio(150);
        refetch();
      }
    );
  };

  const getRatioColor = (ratio: number) => {
    if (ratio < 120) return "text-red-400";
    if (ratio < 150) return "text-yellow-400";
    return "text-green-400";
  };

  const filteredTokens = COLLATERAL_TOKENS.filter(token =>
    token.symbol.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
    token.name.toLowerCase().includes(tokenSearchQuery.toLowerCase())
  );

  // Build position list from live data
  const positions = userTroves.map((trove, i) => {
    const meta = getCollateralMeta(trove.collateral);
    const price = collateralPrices[trove.collateral]
      ? Number(formatUSD(collateralPrices[trove.collateral]))
      : 0;
    const colAmt = meta ? Number(formatCollateral(trove.collateralAmount, meta.decimals)) : 0;
    const debt = Number(formatALUD(trove.debt));
    const ratio = Number(formatRatio(trove.collateralRatio));
    const liqPrice = Number(formatUSD(trove.liquidationPrice));
    return {
      id: `trove-${i}`,
      collateralToken: meta,
      collateralAmount: colAmt,
      collateralValue: colAmt * price,
      borrowedAmount: debt,
      collateralizationRatio: ratio,
      liquidationPrice: liqPrice,
    };
  });

  return (
    <Layout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Lending Interface */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="crypto-card border h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold">Deposit Collateral & Borrow ALUD</CardTitle>
                </CardHeader>
                <CardContent className="space-y-0">
                  <div className="space-y-0">
                    {/* Collateral Section */}
                    <div className="bg-[var(--crypto-dark)] rounded-t-lg p-4 border border-[var(--crypto-border)]">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-gray-400 text-sm">Collateral</label>
                        {isConnected && collateralToken && (
                          <span className="text-sm text-gray-400">
                            Balance: {liveBalance.toFixed(6)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <Input
                          placeholder="0.0"
                          value={collateralAmount}
                          onChange={(e) => handleCollateralAmountChange(e.target.value)}
                          className="flex-1 bg-transparent border-none font-bold text-white placeholder-gray-500 p-0 m-0 h-12 focus-visible:ring-0 focus:outline-none focus:ring-0 focus:border-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                          style={{ padding: 0, margin: 0, fontSize: '2.25rem', lineHeight: '1', fontWeight: 'bold', outline: 'none', border: 'none', boxShadow: 'none' }}
                        />
                        <Button
                          variant="outline"
                          onClick={() => { setTokenSearchQuery(""); setIsTokenModalOpen(true); }}
                          className="bg-[var(--crypto-card)] border-[var(--crypto-border)] text-white hover:bg-[var(--crypto-dark)] px-4 py-2 h-auto min-w-[140px]"
                        >
                          {collateralToken ? (
                            <div className="flex items-center justify-center space-x-2">
                              <img src={collateralToken.logo} alt={collateralToken.symbol} className="w-6 h-6 rounded-full" />
                              <span>{collateralToken.symbol}</span>
                            </div>
                          ) : "Select Token"}
                        </Button>
                      </div>
                      {isConnected && collateralToken && (
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex space-x-2">
                            {[25, 50, 75, 100].map((percentage) => (
                              <Button key={percentage} variant="outline" size="sm" onClick={() => handlePercentageClick(percentage)}
                                className="text-xs bg-[var(--crypto-card)] border-[var(--crypto-border)] text-gray-400 hover:text-white hover:bg-[var(--crypto-dark)]"
                              >{percentage}%</Button>
                            ))}
                          </div>
                          {collateralAmount && livePrice > 0 && (
                            <div className="text-sm text-gray-500">
                              ≈ ${(parseFloat(collateralAmount) * livePrice).toFixed(2)} USD
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Borrow Section */}
                    <div className="bg-[var(--crypto-dark)] rounded-b-lg p-4 border-l border-r border-b border-[var(--crypto-border)] -mt-px">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-gray-400 text-sm">Borrow ALUD</label>
                        <span className="text-sm text-gray-400">Max: ${maxBorrowAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Input
                          placeholder="0.0"
                          value={borrowAmount}
                          onChange={(e) => handleBorrowAmountChange(e.target.value)}
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
                    </div>

                    {/* Collateralization Ratio */}
                    {collateralAmount && borrowAmount && (
                      <div className="bg-[var(--crypto-dark)] rounded-lg p-4 border border-[var(--crypto-border)]">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-gray-400 text-sm">Collateralization Ratio</span>
                          <span className={`text-sm font-bold ${getRatioColor(collateralizationRatio)}`}>
                            {collateralizationRatio.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={Math.max(0, Math.min(((collateralizationRatio - 110) / (200 - 110)) * 100, 100))} className="h-2" />
                        <div className="grid grid-cols-3 gap-2 text-xs mt-3">
                          <div className="text-red-400"><div>Danger</div><div>&lt;120%</div></div>
                          <div className="text-yellow-400"><div>Warning</div><div>120-150%</div></div>
                          <div className="text-green-400"><div>Safe</div><div>&gt;150%</div></div>
                        </div>
                      </div>
                    )}

                    {/* Liquidation Price */}
                    {liquidationPrice > 0 && (
                      <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          <span className="text-sm font-medium text-gray-300">Liquidation Price</span>
                        </div>
                        <span className="text-sm font-bold text-red-400">${liquidationPrice.toFixed(2)}</span>
                      </div>
                    )}

                    {/* Transaction Details */}
                    {collateralAmount && borrowAmount && (
                      <div className="bg-[var(--crypto-dark)] rounded-lg p-4 border border-[var(--crypto-border)]">
                        <h4 className="font-medium text-gray-300 mb-3">Transaction Summary</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Collateral Value</span>
                            <span className="text-gray-300">
                              ${livePrice > 0 ? (parseFloat(collateralAmount) * livePrice).toFixed(2) : '0.00'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Borrowing</span>
                            <span className="text-gray-300">{borrowAmount} ALUD</span>
                          </div>
                          <div className="flex justify-between font-medium">
                            <span className="text-gray-400">Health Factor</span>
                            <span className={getRatioColor(collateralizationRatio)}>
                              {(collateralizationRatio / 110).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleDeposit}
                      disabled={!collateralToken || !collateralAmount || !borrowAmount || collateralizationRatio < 110 || !!actions.pendingTx || !isConnected}
                      className="w-full h-12 text-lg bg-gradient-to-r from-crypto-blue to-crypto-purple hover:from-crypto-blue/80 hover:to-crypto-purple/80 text-white font-medium"
                    >
                      {actions.pendingTx?.includes("Opened trove") ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          <span>Creating Position...</span>
                        </div>
                      ) : !isConnected ? "Connect Wallet" : "Create Lending Position"}
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
                              {position.collateralToken && (
                                <img src={position.collateralToken.logo} alt={position.collateralToken.symbol} className="w-6 h-6 rounded-full" />
                              )}
                              <span className="font-medium">{position.collateralToken?.symbol ?? "?"}</span>
                            </div>
                            <Badge variant={position.collateralizationRatio > 150 ? "default" : position.collateralizationRatio > 120 ? "secondary" : "destructive"}>
                              {position.collateralizationRatio.toFixed(1)}%
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Collateral</span>
                              <span>{position.collateralAmount.toFixed(6)} {position.collateralToken?.symbol}</span>
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
                            onClick={() => navigate("/repay")}
                            className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white text-xs"
                          >
                            Go to Repay
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
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Min Collateral Ratio</span>
                      <span className="font-medium text-white">110%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Token Selection Modal */}
          <Dialog open={isTokenModalOpen} onOpenChange={setIsTokenModalOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Select Collateral Token</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Search tokens..." value={tokenSearchQuery} onChange={(e) => setTokenSearchQuery(e.target.value)} />
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {filteredTokens.map((token) => {
                    const price = collateralPrices[token.address]
                      ? Number(formatUSD(collateralPrices[token.address]))
                      : 0;
                    const balance = collateralBalances[token.address]
                      ? Number(formatCollateral(collateralBalances[token.address], token.decimals))
                      : 0;
                    return (
                      <button
                        key={token.address}
                        onClick={() => { setCollateralToken(token); setIsTokenModalOpen(false); }}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <img src={token.logo} alt={token.symbol} className="w-8 h-8 rounded-full" />
                          <div className="text-left">
                            <div className="font-medium">{token.symbol}</div>
                            <div className="text-sm text-muted-foreground">{token.name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{price > 0 ? `$${price.toLocaleString()}` : "—"}</div>
                          {isConnected && balance > 0 && (
                            <div className="text-sm text-muted-foreground">{balance.toFixed(6)}</div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Layout>
  );
}

export default function Deposit() {
  return <DepositContent />;
}

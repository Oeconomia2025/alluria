import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAlluria } from "@/hooks/use-alluria";
import { useAluriaActions } from "@/hooks/use-alluria-actions";
import {
  COLLATERAL_TOKENS,
  formatALUD,
  formatCollateral,
  formatUSD,
  formatUSDDisplay,
  type CollateralTokenMeta,
  type Address,
  PLACEHOLDER_ADDRESS,
} from "@/services/alluria-contracts";

const aludLogo = "https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/ALUD.png";

function RedemptionsContent() {
  const [redemptionAmount, setRedemptionAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState<CollateralTokenMeta | null>(null);
  const [calculatedRedemptionAmount, setCalculatedRedemptionAmount] = useState(0);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tokenSearchQuery, setTokenSearchQuery] = useState("");

  const {
    aludBalance,
    collateralPrices,
    systemStats,
    isConnected,
    contractsDeployed,
    refetch,
  } = useAlluria();
  const actions = useAluriaActions();

  const aludBalanceNum = Number(formatALUD(aludBalance));

  // Default to WETH
  useEffect(() => {
    if (!selectedToken) {
      const weth = COLLATERAL_TOKENS.find((t) => t.symbol === "WETH");
      if (weth) setSelectedToken(weth);
    }
  }, [selectedToken]);

  // Get live price for selected token
  const livePrice = selectedToken && collateralPrices[selectedToken.address]
    ? Number(formatUSD(collateralPrices[selectedToken.address]))
    : 0;

  const calculateRedemptionAmount = (aludAmount: string, price: number) => {
    if (!aludAmount || parseFloat(aludAmount) <= 0 || price <= 0) {
      setCalculatedRedemptionAmount(0);
      return;
    }
    const aludValue = parseFloat(aludAmount);
    // Apply 0.5% redemption fee
    const afterFee = aludValue * 0.995;
    const assetAmount = afterFee / price;
    setCalculatedRedemptionAmount(assetAmount);
  };

  const handleRedemptionAmountChange = (value: string) => {
    setRedemptionAmount(value);
    calculateRedemptionAmount(value, livePrice);
  };

  // Recalculate when price changes
  useEffect(() => {
    calculateRedemptionAmount(redemptionAmount, livePrice);
  }, [livePrice]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePercentageClick = (percentage: number) => {
    const amount = (aludBalanceNum * percentage / 100).toFixed(2);
    handleRedemptionAmountChange(amount);
  };

  const handleRedeem = () => {
    if (!selectedToken || !redemptionAmount || parseFloat(redemptionAmount) <= 0) return;
    // For redemptions, the troveOwner is determined by the protocol (lowest ratio trove)
    // Using PLACEHOLDER_ADDRESS here — the contract selects the trove internally
    actions.redeemCollateral(
      selectedToken.address as Address,
      redemptionAmount,
      PLACEHOLDER_ADDRESS,
      () => {
        setRedemptionAmount("");
        setCalculatedRedemptionAmount(0);
        refetch();
      }
    );
  };

  const filteredTokens = COLLATERAL_TOKENS.filter(token =>
    token.symbol.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
    token.name.toLowerCase().includes(tokenSearchQuery.toLowerCase())
  );

  const redemptionFee = redemptionAmount ? (parseFloat(redemptionAmount) * 0.005).toFixed(2) : "0.00";

  return (
    <Layout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="crypto-card border h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold">Redeem ALUD for Collateral</CardTitle>
                </CardHeader>
                <CardContent className="space-y-0">
                  <div className="space-y-0">
                    {/* ALUD to Redeem Section */}
                    <div className="bg-[var(--crypto-dark)] rounded-t-lg p-4 border border-[var(--crypto-border)]">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-gray-400 text-sm">ALUD to Redeem</label>
                        <span className="text-sm text-gray-400">
                          Available: {isConnected ? `${aludBalanceNum.toFixed(2)} ALUD` : "—"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Input
                          placeholder="0.0"
                          value={redemptionAmount}
                          onChange={(e) => handleRedemptionAmountChange(e.target.value)}
                          className="flex-1 bg-transparent border-none font-bold text-white placeholder-gray-500 p-0 m-0 h-12 focus-visible:ring-0 focus:outline-none focus:ring-0 focus:border-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                          style={{ padding: 0, margin: 0, fontSize: '2.25rem', lineHeight: '1', fontWeight: 'bold', outline: 'none', border: 'none', boxShadow: 'none' }}
                        />
                        <div className="bg-[var(--crypto-card)] border border-[var(--crypto-border)] text-white px-4 py-2 rounded-lg h-auto min-w-[140px] flex items-center justify-center space-x-2">
                          <img src={aludLogo} alt="ALUD" className="w-6 h-6 rounded-full" />
                          <span className="font-medium">ALUD</span>
                        </div>
                      </div>
                      <div className="flex justify-between mt-3">
                        <div className="flex space-x-2">
                          {[25, 50, 75, 100].map((percentage) => (
                            <Button key={percentage} variant="outline" size="sm"
                              onClick={() => handlePercentageClick(percentage)}
                              className="text-xs bg-[var(--crypto-card)] border-[var(--crypto-border)] text-gray-400 hover:text-white hover:bg-[var(--crypto-dark)]"
                            >{percentage}%</Button>
                          ))}
                        </div>
                        <div className="text-sm text-gray-500">
                          ≈ ${redemptionAmount ? (parseFloat(redemptionAmount) || 0).toFixed(2) : '0.00'} USD
                        </div>
                      </div>
                    </div>

                    {/* Collateral to Receive Section */}
                    <div className="bg-[var(--crypto-dark)] rounded-b-lg p-4 border-l border-r border-b border-[var(--crypto-border)] -mt-px">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-gray-400 text-sm">Collateral to Receive</label>
                        <span className="text-sm text-gray-400">Est. from system</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 font-bold text-white text-4xl">
                          {calculatedRedemptionAmount.toFixed(6)}
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => { setTokenSearchQuery(""); setIsTokenModalOpen(true); }}
                          className="bg-[var(--crypto-card)] border-[var(--crypto-border)] text-white hover:bg-[var(--crypto-dark)] px-4 py-2 h-auto min-w-[140px]"
                        >
                          <div className="flex items-center justify-center space-x-2">
                            {selectedToken ? (
                              <>
                                <img src={selectedToken.logo} alt={selectedToken.symbol} className="w-6 h-6 rounded-full" />
                                <span className="font-medium">{selectedToken.symbol}</span>
                              </>
                            ) : (
                              <span className="font-medium">Select</span>
                            )}
                          </div>
                        </Button>
                      </div>
                      <div className="flex justify-between mt-3">
                        <div className="text-sm text-gray-500">
                          {selectedToken && livePrice > 0
                            ? `Redemption Rate: 1 ALUD = ${(1 / livePrice).toFixed(6)} ${selectedToken.symbol}`
                            : "Price unavailable"}
                        </div>
                        <div className="text-sm text-gray-500">
                          ≈ ${calculatedRedemptionAmount && livePrice > 0 ? (calculatedRedemptionAmount * livePrice).toFixed(2) : '0.00'} USD
                        </div>
                      </div>
                    </div>

                    {/* Redemption Details */}
                    <div className="bg-[var(--crypto-dark)] rounded-lg p-4 border border-[var(--crypto-border)] mt-4">
                      <h4 className="font-medium text-gray-300 mb-3">Redemption Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Redemption Fee</span>
                          <span className="text-gray-300">0.5% ({redemptionFee} ALUD)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">You'll Pay</span>
                          <span className="text-gray-300">{redemptionAmount || '0.00'} ALUD</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">You'll Receive</span>
                          <span className="text-green-400">
                            {calculatedRedemptionAmount.toFixed(6)} {selectedToken?.symbol || '—'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleRedeem}
                      disabled={!redemptionAmount || parseFloat(redemptionAmount) <= 0 || !!actions.pendingTx || !isConnected}
                      className="w-full h-12 text-lg bg-gradient-to-r from-crypto-blue to-crypto-purple hover:from-crypto-blue/80 hover:to-crypto-purple/80 text-white font-medium disabled:opacity-50"
                    >
                      {actions.pendingTx?.includes("Redeemed") ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          <span>Redeeming...</span>
                        </div>
                      ) : !isConnected
                        ? "Connect Wallet"
                        : !redemptionAmount || parseFloat(redemptionAmount) <= 0
                          ? "Enter Amount to Redeem"
                          : `Redeem ${redemptionAmount} ALUD`}
                    </Button>
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
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Redemption Fee</span>
                      <span className="font-medium text-white">0.5%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Collateral Prices */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Collateral Prices</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {COLLATERAL_TOKENS.map((token) => {
                    const price = collateralPrices[token.address]
                      ? Number(formatUSD(collateralPrices[token.address]))
                      : 0;
                    return (
                      <div key={token.symbol} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <img src={token.logo} alt={token.symbol} className="w-5 h-5 rounded-full" />
                          <span className="text-sm text-muted-foreground">{token.symbol}</span>
                        </div>
                        <span className="text-sm font-medium text-white">
                          {price > 0 ? `$${price.toLocaleString()}` : "—"}
                        </span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Token Selection Modal */}
          <Dialog open={isTokenModalOpen} onOpenChange={setIsTokenModalOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Select Redemption Token</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Search tokens..." value={tokenSearchQuery} onChange={(e) => setTokenSearchQuery(e.target.value)} />
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {filteredTokens.map((token) => {
                    const price = collateralPrices[token.address]
                      ? Number(formatUSD(collateralPrices[token.address]))
                      : 0;
                    return (
                      <button
                        key={token.address}
                        onClick={() => {
                          setSelectedToken(token);
                          calculateRedemptionAmount(redemptionAmount, price);
                          setIsTokenModalOpen(false);
                        }}
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

export default function Redemptions() {
  return <RedemptionsContent />;
}

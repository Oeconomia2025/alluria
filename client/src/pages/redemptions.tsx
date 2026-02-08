import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const aludLogo = "https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/ALUD.png";

interface CollateralToken {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logo: string;
  price: number;
  balance?: number;
}

const collateralTokens: CollateralToken[] = [
  {
    symbol: "WBTC", name: "Wrapped Bitcoin",
    address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", decimals: 8,
    logo: "https://tokens.1inch.io/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png",
    price: 67340.00, balance: 0.15234
  },
  {
    symbol: "WBNB", name: "Wrapped BNB",
    address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", decimals: 18,
    logo: "https://tokens.1inch.io/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c.png",
    price: 645.20, balance: 5.432
  },
  {
    symbol: "WETH", name: "Wrapped Ethereum",
    address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", decimals: 18,
    logo: "https://tokens.1inch.io/0x2170ed0880ac9a755fd29b2688956bd959f933f8.png",
    price: 3420.50, balance: 2.847
  }
];

function RedemptionsContent() {
  const [redemptionAmount, setRedemptionAmount] = useState("");
  const [selectedRedemptionToken, setSelectedRedemptionToken] = useState<CollateralToken | null>(null);
  const [calculatedRedemptionAmount, setCalculatedRedemptionAmount] = useState(0);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tokenSearchQuery, setTokenSearchQuery] = useState("");

  useEffect(() => {
    const defaultToken = collateralTokens.find(t => t.symbol === 'WETH');
    if (defaultToken && !selectedRedemptionToken) {
      setSelectedRedemptionToken(defaultToken);
    }
  }, []);

  const calculateRedemptionAmount = (aludAmount: string, token: CollateralToken | null) => {
    if (!aludAmount || !token || parseFloat(aludAmount) <= 0) {
      setCalculatedRedemptionAmount(0);
      return;
    }
    const aludValue = parseFloat(aludAmount);
    const assetAmount = aludValue / token.price;
    setCalculatedRedemptionAmount(assetAmount);
  };

  const handleRedemptionAmountChange = (value: string) => {
    setRedemptionAmount(value);
    calculateRedemptionAmount(value, selectedRedemptionToken);
  };

  const filteredTokens = collateralTokens.filter(token =>
    token.symbol.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
    token.name.toLowerCase().includes(tokenSearchQuery.toLowerCase())
  );

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
                        <span className="text-sm text-gray-400">Available: 1,245.67 ALUD</span>
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
                              onClick={() => { const amount = (1245.67 * percentage / 100).toString(); handleRedemptionAmountChange(amount); }}
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
                            {selectedRedemptionToken ? (
                              <>
                                <img src={selectedRedemptionToken.logo} alt={selectedRedemptionToken.symbol} className="w-6 h-6 rounded-full" />
                                <span className="font-medium">{selectedRedemptionToken.symbol}</span>
                              </>
                            ) : (
                              <>
                                <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png" alt="ETH" className="w-6 h-6 rounded-full" />
                                <span className="font-medium">ETH</span>
                              </>
                            )}
                          </div>
                        </Button>
                      </div>
                      <div className="flex justify-between mt-3">
                        <div className="text-sm text-gray-500">
                          {selectedRedemptionToken
                            ? `Redemption Rate: 1 ALUD = ${(1 / selectedRedemptionToken.price).toFixed(6)} ${selectedRedemptionToken.symbol}`
                            : `Redemption Rate: 1 ALUD = ${(1 / 3200).toFixed(6)} ETH`}
                        </div>
                        <div className="text-sm text-gray-500">
                          ≈ ${calculatedRedemptionAmount && selectedRedemptionToken ? (calculatedRedemptionAmount * selectedRedemptionToken.price).toFixed(2) : '0.00'} USD
                        </div>
                      </div>
                    </div>

                    {/* Redemption Impact */}
                    <div className="bg-[var(--crypto-dark)] rounded-lg p-4 border border-[var(--crypto-border)] mt-4">
                      <h4 className="font-medium text-gray-300 mb-3">Redemption Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Redemption Fee</span>
                          <span className="text-gray-300">0.5%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">You'll Pay</span>
                          <span className="text-gray-300">{redemptionAmount || '0.00'} ALUD</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">You'll Receive</span>
                          <span className="text-green-400">
                            {calculatedRedemptionAmount.toFixed(6)} {selectedRedemptionToken?.symbol || 'ETH'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Price Impact</span>
                          <span className="text-gray-300">&lt; 0.01%</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      disabled={!redemptionAmount || parseFloat(redemptionAmount) <= 0}
                      className="w-full h-12 text-lg bg-gradient-to-r from-crypto-blue to-crypto-purple hover:from-crypto-blue/80 hover:to-crypto-purple/80 text-white font-medium disabled:opacity-50"
                    >
                      {!redemptionAmount || parseFloat(redemptionAmount) <= 0
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
                      <span className="text-muted-foreground">Current Rate</span>
                      <span className="font-medium text-green-400">3.2% APR</span>
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
                <DialogTitle>Select Redemption Token</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Search tokens..." value={tokenSearchQuery} onChange={(e) => setTokenSearchQuery(e.target.value)} />
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {filteredTokens.map((token) => (
                    <button
                      key={token.address}
                      onClick={() => {
                        setSelectedRedemptionToken(token);
                        calculateRedemptionAmount(redemptionAmount, token);
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
                        <div className="font-medium">${token.price.toLocaleString()}</div>
                        {token.balance && <div className="text-sm text-muted-foreground">{token.balance}</div>}
                      </div>
                    </button>
                  ))}
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

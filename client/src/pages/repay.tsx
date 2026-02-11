import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Lock, ChevronDown } from "lucide-react";

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

interface LendingPosition {
  id: string;
  collateralToken: CollateralToken;
  collateralAmount: number;
  collateralValue: number;
  borrowedAmount: number;
  collateralizationRatio: number;
  liquidationPrice: number;
  interestRate: number;
  isActive: boolean;
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

function RepayContent() {
  const [, navigate] = useLocation();
  const [repayAmount, setRepayAmount] = useState("");
  const [selectedRepayPosition, setSelectedRepayPosition] = useState<LendingPosition | null>(null);
  const [showAllPositions, setShowAllPositions] = useState(false);
  const [positions, setPositions] = useState<LendingPosition[]>([]);

  useEffect(() => {
    const mockPositions: LendingPosition[] = [
      {
        id: "1", collateralToken: collateralTokens[0],
        collateralAmount: 0.05, collateralValue: 3367.00,
        borrowedAmount: 2450.00, collateralizationRatio: 137.5,
        liquidationPrice: 59000.00, interestRate: 3.2, isActive: true
      },
      {
        id: "2", collateralToken: collateralTokens[2],
        collateralAmount: 1.25, collateralValue: 4275.63,
        borrowedAmount: 3200.00, collateralizationRatio: 133.6,
        liquidationPrice: 2816.00, interestRate: 3.1, isActive: true
      }
    ];
    setPositions(mockPositions);
    const lowestHealth = mockPositions.reduce((lowest, current) =>
      current.collateralizationRatio < lowest.collateralizationRatio ? current : lowest
    );
    setSelectedRepayPosition(lowestHealth);
  }, []);

  const getRatioColor = (ratio: number) => {
    if (ratio < 120) return "text-red-400";
    if (ratio < 150) return "text-yellow-400";
    return "text-green-400";
  };

  const handleRepayPercentageClick = (percentage: number) => {
    if (selectedRepayPosition) {
      const amount = (selectedRepayPosition.borrowedAmount * percentage / 100).toString();
      setRepayAmount(amount);
    }
  };

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
                        {!showAllPositions ? (
                          selectedRepayPosition && (
                            <div
                              onClick={() => setShowAllPositions(true)}
                              className="flex items-center justify-between p-3 bg-[var(--crypto-card)] border border-[var(--crypto-border)] rounded-lg hover:bg-[var(--crypto-dark)] cursor-pointer transition-colors"
                            >
                              <div className="flex items-center space-x-3">
                                <img src={selectedRepayPosition.collateralToken.logo} alt={selectedRepayPosition.collateralToken.symbol} className="w-8 h-8 rounded-full" />
                                <div>
                                  <div className="font-medium text-white">{selectedRepayPosition.collateralAmount} {selectedRepayPosition.collateralToken.symbol}</div>
                                  <div className="text-sm text-gray-400">Borrowed: ${selectedRepayPosition.borrowedAmount.toFixed(2)} ALUD</div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="text-right">
                                  <div className={`text-sm font-bold ${getRatioColor(selectedRepayPosition.collateralizationRatio)}`}>
                                    {selectedRepayPosition.collateralizationRatio.toFixed(1)}%
                                  </div>
                                  <div className="text-xs text-gray-400">Health</div>
                                </div>
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              </div>
                            </div>
                          )
                        ) : (
                          positions.length > 0 ? (
                            positions.map((position) => (
                              <div
                                key={position.id}
                                onClick={() => { setSelectedRepayPosition(position); setShowAllPositions(false); }}
                                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                                  selectedRepayPosition?.id === position.id
                                    ? 'bg-[var(--crypto-dark)] border-crypto-blue/50'
                                    : 'bg-[var(--crypto-card)] border-[var(--crypto-border)] hover:bg-[var(--crypto-dark)]'
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <img src={position.collateralToken.logo} alt={position.collateralToken.symbol} className="w-8 h-8 rounded-full" />
                                  <div>
                                    <div className="font-medium text-white">{position.collateralAmount} {position.collateralToken.symbol}</div>
                                    <div className="text-sm text-gray-400">Borrowed: ${position.borrowedAmount.toFixed(2)} ALUD</div>
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
                          ) : (
                            <div className="text-center py-8 text-gray-400">No active positions to repay</div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Repayment Section */}
                    <div className="bg-[var(--crypto-dark)] rounded-b-lg p-4 border-l border-r border-b border-[var(--crypto-border)] -mt-px">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-gray-400 text-sm">Repay Amount</label>
                        <span className="text-sm text-gray-400">Available: $485.25 USDT</span>
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
                          <span className="text-gray-300">$0.00 ALUD</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">New Health Factor</span>
                          <span className="text-green-400">∞</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Interest Saved</span>
                          <span className="text-gray-300">$0.00</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      disabled={true}
                      className="w-full h-12 text-lg bg-gradient-to-r from-crypto-blue to-crypto-purple hover:from-crypto-blue/80 hover:to-crypto-purple/80 text-white font-medium opacity-50"
                    >
                      Select Position to Repay
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
                  {positions.length === 0 ? (
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
                              <img src={position.collateralToken.logo} alt={position.collateralToken.symbol} className="w-6 h-6 rounded-full" />
                              <span className="font-medium">{position.collateralToken.symbol}</span>
                            </div>
                            <Badge variant={position.collateralizationRatio > 150 ? "default" : position.collateralizationRatio > 120 ? "secondary" : "destructive"}>
                              {position.collateralizationRatio.toFixed(1)}%
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Collateral</span>
                              <span>{position.collateralAmount} {position.collateralToken.symbol}</span>
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
        </div>
      </div>
    </Layout>
  );
}

export default function Repay() {
  return <RepayContent />;
}

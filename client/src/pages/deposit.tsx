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

const aludLogo = "https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/ALUD.png";

import { AlertTriangle, Lock } from "lucide-react";

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
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    decimals: 8,
    logo: "https://tokens.1inch.io/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png",
    price: 67340.00,
    balance: 0.15234
  },
  {
    symbol: "WBNB",
    name: "Wrapped BNB",
    address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    decimals: 18,
    logo: "https://tokens.1inch.io/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c.png",
    price: 645.20,
    balance: 5.432
  },
  {
    symbol: "WETH",
    name: "Wrapped Ethereum",
    address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
    decimals: 18,
    logo: "https://tokens.1inch.io/0x2170ed0880ac9a755fd29b2688956bd959f933f8.png",
    price: 3420.50,
    balance: 2.847
  }
];

function DepositContent() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [collateralToken, setCollateralToken] = useState<CollateralToken | null>(null);
  const [collateralAmount, setCollateralAmount] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [lastEditedField, setLastEditedField] = useState<'collateral' | 'borrow'>('collateral');
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tokenSearchQuery, setTokenSearchQuery] = useState("");
  const [collateralizationRatio, setCollateralizationRatio] = useState(150);
  const [liquidationPrice, setLiquidationPrice] = useState(0);
  const [maxBorrowAmount, setMaxBorrowAmount] = useState(0);
  const [positions, setPositions] = useState<LendingPosition[]>([]);

  useEffect(() => {
    const wethToken = collateralTokens.find(token => token.symbol === 'WETH');
    if (wethToken && !collateralToken) {
      setCollateralToken(wethToken);
    }
  }, []);

  useEffect(() => {
    const mockPositions: LendingPosition[] = [
      {
        id: "1",
        collateralToken: collateralTokens[0],
        collateralAmount: 0.05,
        collateralValue: 3367.00,
        borrowedAmount: 2450.00,
        collateralizationRatio: 137.5,
        liquidationPrice: 59000.00,
        interestRate: 3.2,
        isActive: true
      },
      {
        id: "2",
        collateralToken: collateralTokens[2],
        collateralAmount: 1.25,
        collateralValue: 4275.63,
        borrowedAmount: 3200.00,
        collateralizationRatio: 133.6,
        liquidationPrice: 2816.00,
        interestRate: 3.1,
        isActive: true
      }
    ];
    setPositions(mockPositions);
  }, []);

  useEffect(() => {
    if (collateralToken && collateralAmount) {
      const collateralValue = parseFloat(collateralAmount) * collateralToken.price;
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
  }, [collateralAmount, borrowAmount, collateralToken, lastEditedField, collateralizationRatio]);

  const handleCollateralAmountChange = (value: string) => {
    setCollateralAmount(value);
    setLastEditedField('collateral');
  };

  const handleBorrowAmountChange = (value: string) => {
    setBorrowAmount(value);
    setLastEditedField('borrow');
  };

  const handlePercentageClick = (percentage: number) => {
    if (collateralToken?.balance) {
      const amount = (collateralToken.balance * percentage / 100).toFixed(6);
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

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast({ title: "Position Created", description: `Successfully deposited ${collateralAmount} ${collateralToken.symbol} and borrowed ${borrowAmount} ALUD.` });
      const newPosition: LendingPosition = {
        id: Date.now().toString(),
        collateralToken,
        collateralAmount: parseFloat(collateralAmount),
        collateralValue: parseFloat(collateralAmount) * collateralToken.price,
        borrowedAmount: parseFloat(borrowAmount),
        collateralizationRatio,
        liquidationPrice,
        interestRate: 3.2,
        isActive: true
      };
      setPositions(prev => [...prev, newPosition]);
      setCollateralAmount("");
      setBorrowAmount("");
      setCollateralizationRatio(150);
    }, 2000);
  };

  const getRatioColor = (ratio: number) => {
    if (ratio < 120) return "text-red-400";
    if (ratio < 150) return "text-yellow-400";
    return "text-green-400";
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
                        {collateralToken?.balance && (
                          <span className="text-sm text-gray-400">
                            Balance: {collateralToken.balance.toFixed(6)}
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
                      {collateralToken?.balance && (
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex space-x-2">
                            {[25, 50, 75, 100].map((percentage) => (
                              <Button key={percentage} variant="outline" size="sm" onClick={() => handlePercentageClick(percentage)}
                                className="text-xs bg-[var(--crypto-card)] border-[var(--crypto-border)] text-gray-400 hover:text-white hover:bg-[var(--crypto-dark)]"
                              >{percentage}%</Button>
                            ))}
                          </div>
                          {collateralToken && collateralAmount && (
                            <div className="text-sm text-gray-500">
                              ≈ ${(parseFloat(collateralAmount) * collateralToken.price).toFixed(2)} USD
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
                            <span className="text-gray-400">Interest Rate</span>
                            <span className="text-gray-300">3.2% APR</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Collateral Value</span>
                            <span className="text-gray-300">${collateralToken ? (parseFloat(collateralAmount) * collateralToken.price).toFixed(2) : '0.00'}</span>
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
                      disabled={!collateralToken || !collateralAmount || !borrowAmount || collateralizationRatio < 110 || isLoading}
                      className="w-full h-12 text-lg bg-gradient-to-r from-crypto-blue to-crypto-purple hover:from-crypto-blue/80 hover:to-crypto-purple/80 text-white font-medium"
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          <span>Creating Position...</span>
                        </div>
                      ) : "Create Lending Position"}
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
                <DialogTitle>Select Collateral Token</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Search tokens..." value={tokenSearchQuery} onChange={(e) => setTokenSearchQuery(e.target.value)} />
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {filteredTokens.map((token) => (
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

export default function Deposit() {
  return <DepositContent />;
}

import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const aludLogo = "https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/ALUD.png";

function StabilityPoolContent() {
  const [stabilityPoolAmount, setStabilityPoolAmount] = useState("");

  const handleStabilityPoolPercentageClick = (percentage: number) => {
    const availableAmount = 1000;
    const amount = (availableAmount * percentage / 100).toString();
    setStabilityPoolAmount(amount);
  };

  return (
    <Layout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="crypto-card border h-full">
                <CardContent className="p-6">
                  <div className="bg-[var(--crypto-dark)] rounded-lg p-6 border border-[var(--crypto-border)]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <img src={aludLogo} alt="ALUD" className="w-12 h-12 rounded-full border-half" />
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">Stability Pool</h3>
                          <p className="text-gray-400 text-sm">Deposit ALUD to earn liquidation rewards and ALUR tokens</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">12.5%</div>
                        <div className="text-sm text-gray-400">Current APY</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-[var(--crypto-card)] rounded-lg p-4 border border-[var(--crypto-border)]">
                        <div className="text-sm text-gray-400 mb-1">Total Deposited</div>
                        <div className="text-lg font-bold text-white">$2,485,920</div>
                        <div className="text-xs text-green-400">+5.2% this week</div>
                      </div>
                      <div className="bg-[var(--crypto-card)] rounded-lg p-4 border border-[var(--crypto-border)]">
                        <div className="text-sm text-gray-400 mb-1">Your Share</div>
                        <div className="text-lg font-bold text-white">0.00%</div>
                        <div className="text-xs text-gray-400">No deposit yet</div>
                      </div>
                      <div className="bg-[var(--crypto-card)] rounded-lg p-4 border border-[var(--crypto-border)]">
                        <div className="text-sm text-gray-400 mb-1">Pending Rewards</div>
                        <div className="text-lg font-bold text-white">0 ALUR</div>
                        <div className="text-xs text-gray-400">$0.00</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Input
                          placeholder="0.0"
                          value={stabilityPoolAmount}
                          onChange={(e) => setStabilityPoolAmount(e.target.value)}
                          className="flex-1 bg-transparent border-none font-bold text-white placeholder-gray-500 p-0 m-0 h-12 focus-visible:ring-0 focus:outline-none focus:ring-0 focus:border-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                          style={{ padding: 0, margin: 0, fontSize: '2.25rem', lineHeight: '1', fontWeight: 'bold', outline: 'none', border: 'none', boxShadow: 'none' }}
                        />
                        <div className="bg-[var(--crypto-card)] border border-[var(--crypto-border)] text-white px-4 py-2 rounded-lg min-w-[140px] flex items-center justify-center space-x-2">
                          <img src={aludLogo} alt="ALUD" className="w-6 h-6 rounded-full" />
                          <span>ALUD</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        {[25, 50, 75, 100].map((percentage) => (
                          <Button key={percentage} variant="outline" size="sm" onClick={() => handleStabilityPoolPercentageClick(percentage)}
                            className="text-xs bg-[var(--crypto-card)] border-[var(--crypto-border)] text-gray-400 hover:text-white hover:bg-[var(--crypto-dark)]"
                          >{percentage}%</Button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Button className="h-12 text-lg bg-gradient-to-r from-crypto-blue to-crypto-purple hover:from-crypto-blue/80 hover:to-crypto-purple/80 text-white font-medium">
                          Deposit to Stability Pool
                        </Button>
                        <Button variant="outline" className="h-12 text-lg border-[var(--crypto-border)] text-gray-400 hover:text-white hover:bg-[var(--crypto-dark)]">
                          Claim Fees
                        </Button>
                      </div>
                    </div>
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
        </div>
      </div>
    </Layout>
  );
}

export default function StabilityPool() {
  return <StabilityPoolContent />;
}

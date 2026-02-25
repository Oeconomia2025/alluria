import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Search, FlaskConical } from "lucide-react";
import { useState } from "react";
import { TestnetModal } from "./testnet-modal";

interface QuickActionsProps {
  contractAddress: string;
}

export function QuickActions({ contractAddress }: QuickActionsProps) {
  const [showTestnetModal, setShowTestnetModal] = useState(false);

  const pancakeSwapUrl = `https://app.uniswap.org/swap?outputCurrency=0xb62870F6861BF065F5a6782996AB070EB9385d05`;
  const etherscanUrl = `https://sepolia.etherscan.io/address/0x2b2fb8df4ac5d394f0d5674d7a54802e42a06aba`;

  return (
    <>
      <div className="mt-8">
        <Card className="crypto-card p-6 border">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              asChild
              variant="outline"
              className="bg-crypto-blue/10 hover:bg-crypto-blue/20 border-crypto-blue/30 rounded-lg p-4 h-auto flex-col space-y-2 group"
            >
              <a href={pancakeSwapUrl} target="_blank" rel="noopener noreferrer">
                <ArrowUpDown className="text-crypto-blue text-2xl group-hover:scale-110 transition-transform" />
                <div className="text-center">
                  <div className="font-medium">Trade on UniSwap</div>
                  <div className="text-sm text-gray-400">Buy/Sell OEC tokens</div>
                </div>
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              className="bg-crypto-green/10 hover:bg-crypto-green/20 border-crypto-green/30 rounded-lg p-4 h-auto flex-col space-y-2 group"
            >
              <a href={etherscanUrl} target="_blank" rel="noopener noreferrer">
                <Search className="text-crypto-green text-2xl group-hover:scale-110 transition-transform" />
                <div className="text-center">
                  <div className="font-medium">View on Etherscan</div>
                  <div className="text-sm text-gray-400">Explore transactions</div>
                </div>
              </a>
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowTestnetModal(true)}
              className="bg-crypto-gold/10 hover:bg-crypto-gold/20 border-crypto-gold/30 rounded-lg p-4 h-auto flex-col space-y-2 group"
            >
              <FlaskConical className="text-crypto-gold text-2xl group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <div className="font-medium">Testnet Version</div>
                <div className="text-sm text-gray-400">Test deployment info</div>
              </div>
            </Button>
          </div>
        </Card>
      </div>

      <TestnetModal 
        isOpen={showTestnetModal} 
        onClose={() => setShowTestnetModal(false)} 
      />
    </>
  );
}

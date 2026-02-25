import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Info, Zap } from "lucide-react";
import { useCopyToClipboard } from "@/hooks/use-copy-clipboard";
import { useNetworkStatus } from "@/hooks/use-token-data";
import { TONE_TOKEN_CONFIG } from "@shared/schema";
import type { TokenData, NetworkStatus } from "@shared/schema";

interface TokenInfoPanelProps {
  tokenData?: TokenData;
  isLoading: boolean;
}

export function TokenInfoPanel({ tokenData, isLoading }: TokenInfoPanelProps) {
  const { copyToClipboard } = useCopyToClipboard();
  const { data: networkStatus, isLoading: networkLoading } = useNetworkStatus();

  if (isLoading || networkLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="crypto-card p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const contractAddress = "0xb62870F6861BF065F5a6782996AB070EB9385d05";
  const deployerWallet = "0xBa2612DF1031bB7C7D31425d2b7968F86195e9DF";
  const operationsWallet = "0xD02dbe54454F6FE3c2F9F1F096C5460284E418Ed";
  const futureTeamWallet = "0x786d1118Df3cf720082dFD2b5b68ab99A8B4B111";
  const marketingWallet = "0x9D483e9AC94b970C117E85cF90c776CA8b2Fe126";
  const stakingWallet = "0xeDB8d746341c176d2754116A8E4967887447f537";
  const treasuryWallet = "0x28B1B5D29FDfC712162ca1dcbe2F977A9D5F963f";
  const leadDevLockedWallet = "0xD02dbe54454F6FE3c2F9F1F096C5460284E418Ed";

  return (
    <div className="space-y-6">
{/* Contract Information */}
<Card className="crypto-card p-6 border">
  <h3 className="text-lg font-semibold mb-4">Contract Information</h3>
  <div className="space-y-2">
    {[
      { label: "Contract Address", value: contractAddress },
      { label: "Deployer", value: deployerWallet },
      { label: "Operations Wallet", value: operationsWallet },
      { label: "Future Team", value: futureTeamWallet },
      { label: "Marketing", value: marketingWallet },
      { label: "Staking", value: stakingWallet },
      { label: "Treasury", value: treasuryWallet },
      { label: "Lead Dev Locked", value: leadDevLockedWallet },
    ].map((item, i) => (
      <div
        key={i}
        className="flex justify-between items-center p-2 rounded-md hover:bg-[var(--crypto-dark)] transition-colors"
      >
        <span className="text-gray-400 text-sm">{item.label}</span>
        <div className="flex items-center gap-2">
          <code className="bg-[var(--crypto-dark)] px-3 py-2 rounded text-sm font-mono text-white">
            {item.value}
          </code>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(item.value)}
            className="text-crypto-blue hover:text-crypto-blue/80 p-1"
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      </div>
    ))}

    <div className="flex justify-between p-2 rounded-md hover:bg-[var(--crypto-dark)] transition-colors">
      <span className="text-gray-400">Network</span>
      <span className="text-crypto-green">ETH</span>
    </div>
    <div className="flex justify-between p-2 rounded-md hover:bg-[var(--crypto-dark)] transition-colors">
      <span className="text-gray-400">Decimals</span>
      <span>18</span>
    </div>
  </div>
</Card>



      {/* Fee Structure */}
      <Card className="crypto-card p-6 border">
        <h3 className="text-lg font-semibold mb-4">Fee Structure</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Buy/Sell Fee</span>
            <span className="text-crypto-red">{TONE_TOKEN_CONFIG.buyFee}%</span>
          </div>
          <div className="bg-[var(--crypto-dark)] rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">→ Liquidity</span>
              <span className="text-crypto-blue">{TONE_TOKEN_CONFIG.liquidityFee}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">→ Operations</span>
              <span className="text-crypto-gold">{TONE_TOKEN_CONFIG.operationsFee}%</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Fees auto-convert to ETH/WETH
          </div>
        </div>
      </Card>

      {/* Network Status */}
      <Card className="crypto-card p-6 border">
        <h3 className="text-lg font-semibold mb-4">BSC Network</h3>
        {networkStatus ? (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Gas Price</span>
              <span className="text-crypto-green">{networkStatus.gasPrice} Gwei</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Block Number</span>
              <span>{networkStatus.blockNumber.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Network Health</span>
              <span className={`flex items-center gap-1 ${networkStatus.isHealthy ? 'text-crypto-green' : 'text-crypto-red'}`}>
                <div className={`w-2 h-2 rounded-full ${networkStatus.isHealthy ? 'bg-crypto-green' : 'bg-crypto-red'}`} />
                {networkStatus.isHealthy ? 'Healthy' : 'Issues'}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-400">
              <Zap className="w-4 h-4" />
              <span>Unable to fetch network status</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

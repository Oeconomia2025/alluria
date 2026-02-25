import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink } from "lucide-react";
import { useTransactions } from "@/hooks/use-token-data";
import type { Transaction } from "@shared/schema";

interface TransactionsTableProps {
  contractAddress: string;
}

export function TransactionsTable({ contractAddress }: TransactionsTableProps) {
  const { data: transactions, isLoading } = useTransactions(contractAddress);

  const formatAmount = (amount: number | undefined, symbol: string = "OEC") => {
    if (!amount && amount !== 0) {
      return `0 ${symbol}`;
    }
    const fixed = amount.toFixed(5);
    const formatted = parseFloat(fixed).toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 5 
    });
    return `${formatted} ${symbol}`;
  };

  const formatAddress = (address: string | undefined) => {
    if (!address) {
      return "Unknown Address";
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTime = (timestamp: string | undefined) => {
    if (!timestamp) {
      return "Unknown time";
    }
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return "Invalid time";
    }
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)}h ago`;
    } else {
      return `${Math.floor(diffMins / 1440)}d ago`;
    }
  };

  const getTypeColor = (type: Transaction['type']) => {
    switch (type) {
      case 'BUY':
        return 'bg-crypto-green/20 text-crypto-green';
      case 'SELL':
        return 'bg-crypto-red/20 text-crypto-red';
      case 'TRANSFER':
        return 'bg-crypto-blue/20 text-crypto-blue';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getBlockExplorerUrl = (hash: string) => {
    return `https://sepolia.etherscan.io/tx/${hash}`;
  };

  return (
    <div className="mt-8">
      <Card className="crypto-card p-6 border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Recent Transactions</h2>
          <a 
            href={`https://sepolia.etherscan.io/token/${contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-crypto-blue hover:text-crypto-blue/80 text-sm flex items-center gap-1"
          >
            View on Explorer <ExternalLink className="w-4 h-4" />
          </a>
        </div>
        
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 py-3">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Transaction data unavailable on static deployment</p>
            <p className="text-gray-500 text-sm mt-2">Requires live blockchain API access</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--crypto-border)]">
                  <th className="text-left py-3 text-gray-400 font-medium">Type</th>
                  <th className="text-left py-3 text-gray-400 font-medium">Amount</th>
                  <th className="text-left py-3 text-gray-400 font-medium">From/To</th>
                  <th className="text-left py-3 text-gray-400 font-medium">Time</th>
                  <th className="text-left py-3 text-gray-400 font-medium">Hash</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, index) => (
                  <tr key={`${tx.hash}-${index}`} className="border-b border-[var(--crypto-border)]/50 hover:bg-[var(--crypto-dark)]/30">
                    <td className="py-4">
                      <Badge className={`${getTypeColor(tx.type)} border-0`}>
                        {tx.type}
                      </Badge>
                    </td>
                    <td className="py-4 font-medium">{formatAmount(tx.amount)}</td>
                    <td className="py-4">
                      <code className="text-sm text-gray-400">
                        {tx.type === 'BUY' ? formatAddress(tx.to) : formatAddress(tx.from)}
                      </code>
                    </td>
                    <td className="py-4 text-gray-400">{formatTime(tx.timestamp)}</td>
                    <td className="py-4">
                      <a 
                        href={getBlockExplorerUrl(tx.hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-crypto-blue hover:text-crypto-blue/80 text-sm flex items-center gap-1"
                      >
                        {formatAddress(tx.hash)} <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

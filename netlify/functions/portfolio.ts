import type { Handler } from '@netlify/functions';

import { pancakeSwapApiService } from './lib/services/pancakeswap-api';
import { coinGeckoApiService } from './lib/services/coingecko-api';

export const handler: Handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  }

  try {
    // Extract wallet address from path
    const walletAddress = event.path.split('/').pop();
    const tokens = event.queryStringParameters?.tokens;
    
    if (!walletAddress) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Wallet address is required' }),
      };
    }

    if (!tokens) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([]),
      };
    }

    const tokenAddresses = tokens.split(',');
    const portfolio = [];

    for (const tokenAddress of tokenAddresses) {
      try {
        // Mock token balance since direct on-chain balance check was removed
        const balance = "1000";
        
        // Get token info from our existing API
        const [coinGeckoData, pancakeSwapData] = await Promise.all([
          coinGeckoApiService.getTokenDataByContract(tokenAddress).catch(() => null),
          pancakeSwapApiService.getTokenData(tokenAddress).catch(() => null),
        ]);

        const tokenInfo = {
          address: tokenAddress,
          name: coinGeckoData?.name || pancakeSwapData?.name || 'Unknown Token',
          symbol: coinGeckoData?.symbol || pancakeSwapData?.symbol || 'UNK',
          balance: balance || '0',
          price: coinGeckoData?.price || pancakeSwapData?.price || 0,
          value: parseFloat(balance || '0') * (coinGeckoData?.price || pancakeSwapData?.price || 0),
          priceChange24h: coinGeckoData?.priceChangePercent24h || 0,
        };

        portfolio.push(tokenInfo);
      } catch (error) {
        console.error(`Error fetching data for token ${tokenAddress}:`, error);
        // Continue with other tokens even if one fails
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(portfolio),
    };
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: "Failed to fetch portfolio",
        error: error instanceof Error ? error.message : "Unknown error"
      }),
    };
  }
};
interface NFTAsset {
  id: string;
  image_url: string | null;
  media_url: string | null;
  metadata: any;
  token: {
    address: string;
    name: string;
    symbol: string;
    type: string;
    total_supply: string;
    holders_count: string;
  };
  token_type: string;
  value: string;
  external_app_url: string | null;
}

interface IPAssetData {
  id: string;
  ipId: string;
  tokenContract: string;
  tokenId: string;
  nftMetadata?: {
    name?: string;
    imageUrl?: string;
  };
  childrenCount?: number;
  descendantCount?: number;
}

interface StoryScanTransaction {
  hash: string;
  from: {
    hash: string;
  };
  to: {
    hash: string;
    name?: string;
  };
  method: string;
  block_number: number;
  timestamp: string;
  status: string;
  value: string;
  gas_used: string;
  fee: {
    value: string;
  };
  decoded_input?: {
    method_call: string;
    method_id: string;
    parameters: Array<{
      name: string;
      type: string;
      value: string;
    }>;
  };
  has_error_in_internal_transactions: boolean;
  transaction_types?: string[];
  result?: string;
}

interface TokenTransfer {
  block_hash: string;
  block_number: number;
  from: {
    hash: string;
    name?: string;
  };
  to: {
    hash: string;
    name?: string;
  };
  token: {
    address: string;
    name: string;
    symbol: string;
    type: string;
    decimals: string;
  };
  total: {
    decimals: string;
    value: string;
  };
  transaction_hash: string;
  type: string;
}

interface PILStatus {
  hasPIL: boolean;
  licenseCount: number;
  loading: boolean;
  error?: string;
}

export class UserStatsService {
  // Fetch user's registered IP assets (excluding PILicenseTokens)
  static async fetchUserIPAssets(userAddress: string): Promise<IPAssetData[]> {
    try {
      console.log('Fetching wallet NFTs for user:', userAddress);
      
      // Fetch all NFTs from the wallet
      const response = await fetch(`/api/nfts/${userAddress}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch NFTs');
      }

      const data = await response.json();
      const allNFTs: NFTAsset[] = data.items || [];

      // Filter OUT PILicenseTokens (only get regular NFTs)
      const regularNFTs = allNFTs.filter((nft: NFTAsset) => 
        nft.token.symbol !== "PILicenseToken"
      );

      console.log('Filtered NFTs for IP checking:', {
        totalNFTs: allNFTs.length,
        regularNFTs: regularNFTs.length,
        filteredOutLicenseTokens: allNFTs.length - regularNFTs.length
      });

      // Check which NFTs are registered as IP assets
      if (regularNFTs.length === 0) {
        return [];
      }

      // Prepare batch request to check IP registration
      const tokenContractIds = regularNFTs.map(nft => nft.token.address);
      const tokenIds = regularNFTs.map(nft => nft.id);

      const ipResponse = await fetch('/api/ip-assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenContractIds,
          tokenIds
        })
      });

      if (!ipResponse.ok) {
        throw new Error('Failed to check IP registration status');
      }

      const ipData = await ipResponse.json();
      const registeredIPs: IPAssetData[] = ipData.data || [];

      console.log('Found registered IP assets:', {
        checkedNFTs: regularNFTs.length,
        registeredIPs: registeredIPs.length,
        ipIds: registeredIPs.map(ip => ip.ipId)
      });

      return registeredIPs;

    } catch (error) {
      console.error('Error fetching user IP assets:', error);
      return [];
    }
  }

  // Fetch PIL status for multiple IP assets
  static async fetchPILStatusForIPs(ipIds: string[]): Promise<number> {
    try {
      let totalPILCount = 0;

      // Fetch PIL status for each IP asset
      const pilPromises = ipIds.map(async (ipId) => {
        try {
          const licenseResponse = await fetch(`/api/licenses/ip/terms/${ipId}`);
          if (licenseResponse.ok) {
            const licenseData = await licenseResponse.json();
            const licenses = licenseData.data || [];
            return licenses.length;
          }
          return 0;
        } catch (error) {
          console.error(`Error fetching PIL status for IP ${ipId}:`, error);
          return 0;
        }
      });

      const pilCounts = await Promise.all(pilPromises);
      totalPILCount = pilCounts.reduce((sum, count) => sum + count, 0);

      console.log('PIL status summary:', {
        totalIPs: ipIds.length,
        totalPILs: totalPILCount,
        individualCounts: pilCounts
      });

      return totalPILCount;

    } catch (error) {
      console.error('Error fetching PIL status:', error);
      return 0;
    }
  }

  // Fetch user transactions and calculate claimed revenue
  static async fetchClaimedRevenue(userAddress: string): Promise<{ amount: string; currency: string; usdValue: string }> {
    try {
      console.log('Fetching transactions for claimed revenue calculation:', userAddress);

      // Fetch user transactions
      const response = await fetch(`/api/account-transactions/${userAddress}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      const data = await response.json();
      const transactions: StoryScanTransaction[] = data.items || [];
      
      console.log(`Found ${transactions.length} transactions for user`);

      // Filter transactions that are related to claiming
      const claimTransactions = transactions.filter(tx => {
        const method = tx.method?.toLowerCase() || '';
        const decoded = tx.decoded_input?.method_call?.toLowerCase() || '';
        
        return method.includes('claim') || 
               decoded.includes('claim') ||
               method.includes('collect') ||
               decoded.includes('collect');
      });

      console.log(`Found ${claimTransactions.length} claim-related transactions`);

      if (claimTransactions.length === 0) {
        return { amount: '0.00', currency: 'WIP', usdValue: '0.00' };
      }

      let totalClaimedValue = 0;
      let primaryCurrency = 'WIP';

      // For each claim transaction, fetch token transfers
      const transferPromises = claimTransactions.map(async (tx) => {
        try {
          const transferResponse = await fetch(`/api/token-transfers/${tx.hash}`);
          
          if (!transferResponse.ok) {
            console.warn(`Failed to fetch token transfers for tx ${tx.hash}`);
            return 0;
          }
          
          const transferData = await transferResponse.json();
          const transfers: TokenTransfer[] = transferData.items || [];
          
          // Calculate value from transfers where user is the recipient
          let txValue = 0;
          
          transfers.forEach(transfer => {
            if (transfer.to.hash.toLowerCase() === userAddress.toLowerCase()) {
              const value = parseFloat(transfer.total.value) / Math.pow(10, parseInt(transfer.token.decimals));
              txValue += value;
              
              // Track the primary currency (prefer WIP)
              if (transfer.token.symbol === 'WIP') {
                primaryCurrency = 'WIP';
              }
              
              console.log(`Found claimed transfer: ${value} ${transfer.token.symbol} in tx ${tx.hash}`);
            }
          });
          
          return txValue;
          
        } catch (error) {
          console.error(`Error fetching transfers for tx ${tx.hash}:`, error);
          return 0;
        }
      });

      const transferValues = await Promise.all(transferPromises);
      totalClaimedValue = transferValues.reduce((sum, value) => sum + value, 0);

      // Convert to USD
      const usdValue = await this.convertWIPtoUSD(totalClaimedValue);

      console.log('Claimed revenue calculation result:', {
        totalTransactions: transactions.length,
        claimTransactions: claimTransactions.length,
        totalClaimedValue,
        usdValue,
        primaryCurrency
      });

      return {
        amount: totalClaimedValue.toFixed(6),
        currency: primaryCurrency,
        usdValue: usdValue.toFixed(2)
      };

    } catch (error) {
      console.error('Error fetching claimed revenue:', error);
      return { amount: '0.00', currency: 'WIP', usdValue: '0.00' };
    }
  }

  // Convert WIP amount to USD (placeholder implementation)
  static async convertWIPtoUSD(wipAmount: number): Promise<number> {
    try {
      // This is a placeholder - you can integrate with a real price API
      // For now, using a fixed conversion rate (you should replace this with real data)
      const wipToUsdRate = 0.85; // Example: 1 WIP = $0.85
      return wipAmount * wipToUsdRate;
    } catch (error) {
      console.error('Error converting WIP to USD:', error);
      return 0;
    }
  }

  // Calculate total derivatives for all user IP assets
  static async fetchTotalDerivatives(ipAssets: IPAssetData[]): Promise<number> {
    try {
      const totalDerivatives = ipAssets.reduce((sum, asset) => {
        return sum + (asset.childrenCount || asset.descendantCount || 0);
      }, 0);

      console.log('Total derivatives calculation:', {
        totalIPs: ipAssets.length,
        totalDerivatives,
        breakdown: ipAssets.map(asset => ({
          ipId: asset.ipId,
          children: asset.childrenCount || asset.descendantCount || 0
        }))
      });

      return totalDerivatives;

    } catch (error) {
      console.error('Error calculating total derivatives:', error);
      return 0;
    }
  }

  // Get all user statistics in one call
  static async getAllUserStats(userAddress: string) {
    try {
      console.log('Fetching comprehensive user stats for:', userAddress);

      // First fetch IP assets
      const ipAssets = await this.fetchUserIPAssets(userAddress);
      const ipIds = ipAssets.map(asset => asset.ipId);

      // Then fetch other stats in parallel
      const [pilCount, claimedRevenue, totalDerivatives] = await Promise.all([
        ipIds.length > 0 ? this.fetchPILStatusForIPs(ipIds) : Promise.resolve(0),
        this.fetchClaimedRevenue(userAddress),
        this.fetchTotalDerivatives(ipAssets)
      ]);

      const stats = {
        totalIPAssets: ipAssets.length,
        activeLicenses: pilCount,
        claimedRevenue,
        totalDerivatives,
        ipAssets
      };

      console.log('Complete user stats:', stats);

      return stats;

    } catch (error) {
      console.error('Error fetching user stats:', error);
      return {
        totalIPAssets: 0,
        activeLicenses: 0,
        claimedRevenue: { amount: '0.00', currency: 'WIP', usdValue: '0.00' },
        totalDerivatives: 0,
        ipAssets: []
      };
    }
  }
}
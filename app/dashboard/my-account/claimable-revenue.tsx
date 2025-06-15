"use client";

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { claimable_revenue, batch_claim_all_revenue } from '../../../lib/story/royalty_functions/claim_revenue';
import { useStoryClient } from '../../../lib/story/main_functions/story-network';

interface ClaimableRevenueProps {
  userIpIds?: string[]; // Array of user's IP asset IDs
  userAddress?: string; // User's wallet address
  onClaimRevenue?: () => void;
}

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

interface RelationshipData {
  children: string[];
  parents: string[];
  childrenCount: number;
  parentCount: number;
  ancestorCount: number;
  descendantCount: number;
}

interface LicenseTermDetail {
  id: string;
  ipId: string;
  licenseTemplateId: string;
  terms: {
    royaltyPolicy: string;
    commercialUse: boolean;
    derivativesAllowed: boolean;
    [key: string]: any;
  };
}

export const ClaimableRevenue: React.FC<ClaimableRevenueProps> = ({
  userIpIds = [],
  userAddress,
  onClaimRevenue
}) => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [totalRevenue, setTotalRevenue] = useState<string>('0.0');
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tokenType, setTokenType] = useState<'WIP' | 'MERC20'>('WIP');
  const [error, setError] = useState<string | null>(null);
  const [ipAssets, setIpAssets] = useState<IPAssetData[]>([]);
  const [ipRelationships, setIpRelationships] = useState<Map<string, RelationshipData>>(new Map());
  const [ipLicenseTerms, setIpLicenseTerms] = useState<Map<string, LicenseTermDetail[]>>(new Map());
  const { getStoryClient } = useStoryClient();

  // Use connected wallet address or provided address
  const claimer = connectedAddress || userAddress;

  // Fetch IP relationships (children) for each IP asset
  const fetchIPRelationships = async (ipIds: string[]) => {
    try {
      console.log('Fetching relationships for IP assets:', ipIds);
      
      const relationshipMap = new Map<string, RelationshipData>();
      
      // Fetch relationships for each IP asset
      const relationshipPromises = ipIds.map(async (ipId) => {
        try {
          const response = await fetch('/api/ip-relationships', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ipId })
          });
          
          if (response.ok) {
            const data = await response.json();
            const relationshipData: RelationshipData = {
              children: data.children || [],
              parents: data.parents || [],
              childrenCount: data.childrenCount || 0,
              parentCount: data.parentCount || 0,
              ancestorCount: data.ancestorCount || 0,
              descendantCount: data.descendantCount || 0
            };
            
            relationshipMap.set(ipId, relationshipData);
            console.log(`IP ${ipId} has ${relationshipData.children.length} children:`, relationshipData.children);
          }
        } catch (error) {
          console.error(`Error fetching relationships for IP ${ipId}:`, error);
          relationshipMap.set(ipId, {
            children: [],
            parents: [],
            childrenCount: 0,
            parentCount: 0,
            ancestorCount: 0,
            descendantCount: 0
          });
        }
      });
      
      await Promise.all(relationshipPromises);
      setIpRelationships(relationshipMap);
      
    } catch (error) {
      console.error('Error fetching IP relationships:', error);
    }
  };

  // Fetch license terms for IP assets to get royalty policies
  const fetchIPLicenseTerms = async (ipIds: string[]) => {
    try {
      console.log('Fetching license terms for IP assets:', ipIds);
      
      const response = await fetch('/api/detailed-ip-license-terms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ipIds })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch IP license terms');
      }
      
      const data = await response.json();
      const licenseTerms: LicenseTermDetail[] = data.data || [];
      
      console.log('Fetched license terms:', licenseTerms);
      
      // Group license terms by IP ID
      const termsMap = new Map<string, LicenseTermDetail[]>();
      licenseTerms.forEach(term => {
        const existing = termsMap.get(term.ipId) || [];
        existing.push(term);
        termsMap.set(term.ipId, existing);
      });
      
      setIpLicenseTerms(termsMap);
      
    } catch (error) {
      console.error('Error fetching IP license terms:', error);
    }
  };

  // Fetch user's NFTs and filter for registered IP assets
  const fetchUserIPAssets = async () => {
    if (!isConnected || !claimer) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      console.log('Fetching wallet NFTs for claimable revenue...');
      
      // Fetch all NFTs from the wallet (same as My IP tab)
      const response = await fetch(`/api/nfts/${claimer}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch NFTs');
      }

      const data = await response.json();
      const allNFTs: NFTAsset[] = data.items || [];

      // Filter OUT PILicenseTokens (only get regular NFTs, same as My IP tab)
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
        setIpAssets([]);
        setLoading(false);
        setRefreshing(false);
        return;
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

      setIpAssets(registeredIPs);

      // Fetch relationships and license terms for registered IPs
      if (registeredIPs.length > 0) {
        const ipIds = registeredIPs.map(ip => ip.ipId);
        await Promise.all([
          fetchIPRelationships(ipIds),
          fetchIPLicenseTerms(ipIds)
        ]);
      }

    } catch (error) {
      console.error('Error fetching user IP assets:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch IP assets');
      setIpAssets([]);
    }
  };

  // Calculate claimable revenue for all IP assets
  const fetchClaimableRevenue = async () => {
    if (!claimer) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // First fetch the user's IP assets if we don't have them
    if (ipAssets.length === 0) {
      await fetchUserIPAssets();
    }

    if (ipAssets.length === 0) {
      setTotalRevenue('0.0');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setError(null);
    
    try {
      console.log(`Fetching claimable revenue for ${ipAssets.length} IP assets using ${tokenType} token`);
      
      let totalAmount = 0;

      // Fetch claimable revenue for each IP asset
      const revenuePromises = ipAssets.map(async (ipAsset) => {
        try {
          console.log(`Checking claimable revenue for IP: ${ipAsset.ipId}`);
          
          const client = await getStoryClient();
          const result = await claimable_revenue(
            ipAsset.ipId,     // royaltyVaultIpId (same as ipId)
            claimer,          // claimer (user wallet address)
            tokenType === 'WIP', // useWipToken based on toggle
            client
          );
          
          if (result?.amount) {
            // Convert from wei to ether (assuming the amount is in wei)
            const amountInEther = parseFloat(result.amount.toString()) / Math.pow(10, 18);
            console.log(`IP ${ipAsset.ipId}: ${amountInEther} ${tokenType}`);
            return amountInEther;
          }
          
          return 0;
        } catch (error) {
          console.error(`Error fetching revenue for IP ${ipAsset.ipId}:`, error);
          return 0;
        }
      });

      const amounts = await Promise.all(revenuePromises);
      totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);

      console.log(`Total claimable revenue: ${totalAmount} ${tokenType}`);
      setTotalRevenue(totalAmount.toFixed(6));

    } catch (error) {
      console.error('Error fetching claimable revenue:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch revenue');
      setTotalRevenue('0.0');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load: fetch IP assets and then revenue
  useEffect(() => {
    if (isConnected && claimer) {
      setLoading(true);
      fetchUserIPAssets().then(() => {
        // After IP assets are loaded, the revenue will be calculated in the next useEffect
      });
    } else {
      setIpAssets([]);
      setTotalRevenue('0.0');
      setLoading(false);
    }
  }, [claimer, isConnected]);

  // Re-fetch revenue when token type changes or IP assets are loaded
  useEffect(() => {
    if (ipAssets.length > 0) {
      fetchClaimableRevenue();
    }
  }, [tokenType, ipAssets.length]);

  const handleRefresh = () => {
    console.log('Refreshing claimable revenue data...');
    setRefreshing(true);
    // Refresh both IP assets and revenue
    fetchUserIPAssets().then(() => {
      fetchClaimableRevenue();
    });
  };

  const handleClaimAll = async () => {
    if (ipAssets.length === 0) {
      setError('No IP assets to claim revenue from');
      return;
    }

    if (!claimer) {
      setError('Wallet not connected');
      return;
    }

    setClaiming(true);
    setError(null);

    try {
      console.log('Starting batch claim for all revenue...');
      
      // Prepare batch claim requests with child IPs and royalty policies
      const claimRequests = ipAssets.map(ipAsset => {
        const relationships = ipRelationships.get(ipAsset.ipId);
        const licenseTerms = ipLicenseTerms.get(ipAsset.ipId) || [];
        
        // Get child IP IDs
        const childIpIds = relationships?.children || [];
        
        // Get royalty policies from license terms
        const royaltyPolicies = licenseTerms
          .map(term => term.terms.royaltyPolicy)
          .filter(policy => policy && policy !== '0x0000000000000000000000000000000000000000');
        
        // Ensure we have matching arrays - pad with empty values if needed
        const maxLength = Math.max(childIpIds.length, royaltyPolicies.length);
        const paddedChildIds = [...childIpIds];
        const paddedPolicies = [...royaltyPolicies];
        
        // Pad arrays to same length
        while (paddedChildIds.length < maxLength) {
          paddedChildIds.push('');
        }
        while (paddedPolicies.length < maxLength) {
          paddedPolicies.push('');
        }
        
        console.log(`IP ${ipAsset.ipId} claim request:`, {
          childIpIds: paddedChildIds,
          royaltyPolicies: paddedPolicies,
          useWipToken: tokenType === 'WIP'
        });
        
        return {
          ancestorIpId: ipAsset.ipId,
          claimer: claimer,
          childIpIds: paddedChildIds,
          royaltyPolicies: paddedPolicies,
          useWipToken: tokenType === 'WIP'
        };
      });

      console.log('Batch claim requests:', claimRequests);

      const client = await getStoryClient();
      const result = await batch_claim_all_revenue(claimRequests, client);
      
      if (result?.txHashes && result.txHashes.length > 0) {
        console.log('Batch claim successful!');
        console.log('Transaction hashes:', result.txHashes);
        console.log('Claimed tokens:', result.claimedTokens);
        
        // Refresh the revenue data after successful claim
        await fetchClaimableRevenue();
        
        // Call the callback if provided
        onClaimRevenue?.();
        
        // Show success message
        const txHashesText = result.txHashes.length > 1 
          ? `${result.txHashes.length} transactions completed`
          : `Transaction: ${result.txHashes[0]}`;
        
        alert(`Successfully claimed revenue from ${ipAssets.length} IP assets!\n${txHashesText}`);
      } else {
        throw new Error('Batch claim transaction failed - no transaction hashes returned');
      }

    } catch (error) {
      console.error('Error claiming revenue:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to claim revenue';
      setError(errorMessage);
      
      // Show detailed error message
      alert(`Failed to claim revenue: ${errorMessage}`);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4 hover:border-green-500/30 transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">Claimable Revenue</h3>
            <p className="text-xs text-zinc-400">
              From {ipAssets.length} IP Asset{ipAssets.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Token Type Toggle */}
        <div className="flex bg-zinc-800/30 rounded-lg p-1">
          <button
            onClick={() => setTokenType('WIP')}
            className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
              tokenType === 'WIP'
                ? 'bg-green-500/20 text-green-300'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            WIP
          </button>
          <button
            onClick={() => setTokenType('MERC20')}
            className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
              tokenType === 'MERC20'
                ? 'bg-green-500/20 text-green-300'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            MERC20
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Revenue Display */}
      <div className="mb-4">
        {loading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-zinc-400">Calculating...</span>
          </div>
        ) : (
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-green-400">{totalRevenue}</span>
            <span className="text-sm text-green-300">{tokenType}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-zinc-500">From derivative works & licensing</span>
          {!loading && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-1 text-green-400 hover:text-green-300 transition-colors duration-200 group"
              title="Refresh revenue data"
            >
              <svg 
                className={`w-3 h-3 transition-transform duration-200 ${
                  refreshing ? 'animate-spin' : 'group-hover:rotate-180'
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-xs">Refresh</span>
            </button>
          )}
        </div>
      </div>

      {/* Debug Info */}
      {!isConnected && (
        <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-xs text-yellow-400">Wallet not connected. Please connect to view claimable revenue.</p>
        </div>
      )}

      {isConnected && ipAssets.length === 0 && !loading && (
        <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-xs text-yellow-400">No registered IP assets found. Register your NFTs as IP assets to earn revenue.</p>
        </div>
      )}

      {/* Batch Claim Info */}
      {ipAssets.length > 0 && (
        <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-xs text-yellow-400">
            Will claim revenue from {ipAssets.length} IP asset{ipAssets.length !== 1 ? 's' : ''} and their derivatives in one batch transaction.
          </p>
        </div>
      )}

      {/* Claim Button */}
      <button
        onClick={handleClaimAll}
        disabled={claiming || loading || parseFloat(totalRevenue) === 0 || ipAssets.length === 0 || !isConnected}
        className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          claiming || loading || parseFloat(totalRevenue) === 0 || ipAssets.length === 0 || !isConnected
            ? 'bg-zinc-700/50 text-zinc-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white hover:shadow-lg'
        }`}
      >
        {claiming ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Claiming Revenue...</span>
          </div>
        ) : loading ? (
          'Loading...'
        ) : !isConnected ? (
          'Connect Wallet'
        ) : ipAssets.length === 0 ? (
          'No IP Assets'
        ) : parseFloat(totalRevenue) === 0 ? (
          'No Revenue to Claim'
        ) : (
          `Batch Claim All Revenue (${totalRevenue} ${tokenType})`
        )}
      </button>

      {/* Additional Info */}
      <div className="mt-3 text-xs text-zinc-500 flex justify-between">
        <p>Claimer: {claimer ? `${claimer.slice(0, 6)}...${claimer.slice(-4)}` : 'Not connected'}</p>
        {ipAssets.length > 0 && (
          <p>Checking {ipAssets.length} IP asset{ipAssets.length !== 1 ? 's' : ''}</p>
        )}
      </div>
    </div>
  );
};
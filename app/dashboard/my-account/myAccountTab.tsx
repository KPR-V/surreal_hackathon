"use client";

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { MyIPCard } from './myIPcard';
import { LicenseInfoModal } from './licenseTokeninfo';
import { TransactionTable } from './transactionTable';

interface IPAsset {
  id: string;
  name: string;
  type: string;
  status: string;
  pilAttached: boolean;
  revenue: string;
  derivatives: number;
  image: string;
  ipId: string;
  tokenContract: string;
  tokenId: string;
  blockNumber: string;
  nftMetadata: {
    name: string;
    imageUrl: string;
    tokenContract: string;
    tokenId: string;
    chainId?: string;
    tokenUri?: string;
  };
  // NEW: Additional details from individual API
  ancestorCount?: number;
  descendantCount?: number;
  childrenCount?: number;
  parentCount?: number;
  rootCount?: number;
  rootIpIds?: string[];
  blockTimestamp?: string;
  transactionHash?: string;
  isGroup?: boolean;
  latestArbitrationPolicy?: string;
  detailsLoaded?: boolean;
}

interface LicenseToken {
  id: string;
  licensorIpId: string;
  licenseTemplate: string;
  licenseTermsId: string;
  owner: string;
  transferable: string;
  blockNumber: string;
  blockTime: string;
  burntAt?: string;
}

interface LicenseTokenWithDetails extends LicenseToken {
  licensorName?: string;
  isActive: boolean;
  createdDate: string;
}

// Add this new service file for API calls
export class StoryAPIService {
  private static readonly API_BASE_URL = 'https://api.storyapis.com/api/v3';
  private static readonly API_KEY = process.env.NEXT_PUBLIC_STORY_API_KEY || 'MhBsxkU1z9fG6TofE59KqiiWV-YlYE8Q4awlLQehF3U';
  private static readonly CHAIN = 'story-aeneid';

  // Existing method
  static async fetchUserIPAssets(userWalletAddress: string): Promise<any[]> {
    try {
      const options = {
        method: 'POST',
        headers: {
          'X-Api-Key': this.API_KEY,
          'X-Chain': this.CHAIN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          options: {
            pagination: { limit: 10 }
          }
        })
      };

      const response = await fetch(`${this.API_BASE_URL}/assets`, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      const allAssets = data.data || [];
      console.log('All assets:', allAssets);
      
      return allAssets;
      
    } catch (error) {
      console.error('Error fetching user IP assets:', error);
      throw error;
    }
  }

  // NEW: Fetch individual IP Asset details
  static async fetchIPAssetDetails(assetId: string): Promise<any> {
    try {
      const options = {
        method: 'GET',
        headers: {
          'X-Api-Key': this.API_KEY,
          'X-Chain': this.CHAIN
        }
      };

      const response = await fetch(`${this.API_BASE_URL}/assets/${assetId}`, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Individual asset details:', data);
      return data.data || {};
    } catch (error) {
      console.error('Error fetching IP asset details:', error);
      throw error;
    }
  }

  // UPDATED: Fetch all license tokens with minimal options
  static async fetchAllLicenseTokens(): Promise<LicenseToken[]> {
    try {
      const options = {
        method: 'POST',
        headers: {
          'X-Api-Key': this.API_KEY,
          'X-Chain': this.CHAIN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          options: {
            pagination: { 
              limit: 50 
            }
          }
        })
      };

      console.log('Making license tokens request with options:', JSON.stringify({
        options: {
          pagination: { limit: 50 }
        }
      }, null, 2));

      const response = await fetch(`${this.API_BASE_URL}/licenses/tokens`, options);
      
      console.log('License tokens response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('License tokens error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('License tokens response:', data);
      return data.data || [];
    } catch (error) {
      console.error('Error fetching license tokens:', error);
      throw error;
    }
  }

  // UPDATED: Fetch user's license tokens with simpler approach
  static async fetchUserLicenseTokens(userAddress: string): Promise<LicenseToken[]> {
    try {
      // First, try to get all tokens and filter client-side
      const allTokens = await this.fetchAllLicenseTokens();
      console.log('All license tokens fetched:', allTokens.length);
      
      // Filter by owner on client side
      const userTokens = allTokens.filter(token => 
        token.owner && token.owner.toLowerCase() === userAddress.toLowerCase()
      );
      
      console.log('User tokens after filtering:', userTokens.length);
      return userTokens;
      
    } catch (error) {
      console.error('Error fetching user license tokens:', error);
      // If that fails, try a direct API call with where clause
      try {
        const options = {
          method: 'POST',
          headers: {
            'X-Api-Key': this.API_KEY,
            'X-Chain': this.CHAIN,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            options: {
              pagination: { limit: 100 },
              where: {
                owner: userAddress
              }
            }
          })
        };

        const response = await fetch(`${this.API_BASE_URL}/licenses/tokens`, options);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('User license tokens error response:', errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('User license tokens response:', data);
        return data.data || [];
      } catch (secondError) {
        console.error('Second attempt also failed:', secondError);
        throw secondError;
      }
    }
  }

  // NEW: Fetch individual license token details
  static async fetchLicenseTokenDetails(licenseTokenId: string): Promise<LicenseToken | null> {
    try {
      const options = {
        method: 'GET',
        headers: {
          'X-Api-Key': this.API_KEY,
          'X-Chain': this.CHAIN
        }
      };

      const response = await fetch(`${this.API_BASE_URL}/licenses/tokens/${licenseTokenId}`, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('License token details:', data);
      return data.data || null;
    } catch (error) {
      console.error('Error fetching license token details:', error);
      throw error;
    }
  }

  // Keep existing fetchAllIPAssets method
  static async fetchAllIPAssets(): Promise<any[]> {
    try {
      const options = {
        method: 'POST',
        headers: {
          'X-Api-Key': this.API_KEY,
          'X-Chain': this.CHAIN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          options: {
            pagination: { limit: 50 }
          }
        })
      };

      const response = await fetch(`${this.API_BASE_URL}/assets`, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching all IP assets:', error);
      throw error;
    }
  }
}

interface TabProps {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export const MyAccountTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('my-ip');

  const tabs: TabProps[] = [
    {
      id: 'my-ip',
      label: 'My IP',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 011-1h1m0 0V3a2 2 0 011-1h1" />
        </svg>
      )
    },
    {
      id: 'disputes',
      label: 'Disputes',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    {
      id: 'transactions',
      label: 'Transaction History',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 'license-tokens',
      label: 'License Tokens',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.243-6.243A6 6 0 0721 9z" />
        </svg>
      )
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'my-ip':
        return <MyIPContent />;
      case 'disputes':
        return <DisputesContent />;
      case 'transactions':
        return <TransactionHistoryContent />;
      case 'license-tokens':
        return <LicenseTokensContent />;
      default:
        return <MyIPContent />;
    }
  };

  return (
    <div className="mt-12">
      {/* Tab Navigation */}
      <div className="relative mb-12">
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/20 rounded-2xl p-3">
          <div className="flex space-x-3 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center space-x-3 px-8 py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500/10 to-pink-500/10 text-blue-300 border border-blue-400/20'
                    : 'text-zinc-500 hover:text-zinc-400 hover:bg-zinc-800/30'
                }`}
              >
                <div className={`transition-colors duration-300 ${
                  activeTab === tab.id ? 'text-blue-300' : 'text-zinc-600'
                }`}>
                  {tab.icon}
                </div>
                <span className="text-sm">{tab.label}</span>
                
                {/* Active tab indicator */}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-blue-400 to-pink-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {renderTabContent()}
      </div>
    </div>
  );
};

// Updated My IP Content Component with real API integration
const MyIPContent: React.FC = () => {
  const [ipAssets, setIPAssets] = useState<IPAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const testAddress = "0x34a817D5723A289E125b35aAac7e763b6097d38d";

  useEffect(() => {
    fetchUserIPAssets();
  }, []);

  const fetchUserIPAssets = async () => {
    const addressToUse = testAddress;
    
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching IP assets for address:', addressToUse);

      // Use the working POST method
      const rawAssets = await StoryAPIService.fetchUserIPAssets(addressToUse);

      console.log('Raw assets fetched:', rawAssets);

      // Transform the API response WITHOUT fetching detailed info (removed the Promise.all)
      const transformedAssets: IPAsset[] = rawAssets.map((asset: any, index: number) => {
        return {
          id: asset.id || asset.ipId || `asset-${index}`,
          name: asset.nftMetadata?.name || asset.name || `IP Asset #${index + 1}`,
          type: determineAssetType(asset.nftMetadata?.tokenUri || asset.metadataUri),
          status: 'Active',
          pilAttached: !!(asset.pilTerms || asset.licenseTerms || asset.pilPolicy),
          revenue: '$0',
          derivatives: asset.descendantCount || asset.childrenCount || 0,
          image: asset.nftMetadata?.imageUrl || asset.imageUrl || '/placeholder-image.jpg',
          ipId: asset.ipId || asset.id || '',
          tokenContract: asset.nftMetadata?.tokenContract || asset.tokenContract || '',
          tokenId: asset.nftMetadata?.tokenId || asset.tokenId || '',
          blockNumber: asset.blockNumber || '',
          nftMetadata: {
            name: asset.nftMetadata?.name || asset.name || '',
            imageUrl: asset.nftMetadata?.imageUrl || asset.imageUrl || '',
            tokenContract: asset.nftMetadata?.tokenContract || asset.tokenContract || '',
            tokenId: asset.nftMetadata?.tokenId || asset.tokenId || '',
            chainId: asset.nftMetadata?.chainId || '',
            tokenUri: asset.nftMetadata?.tokenUri || asset.metadataUri || ''
          },
          detailsLoaded: false // Always false since we're not loading details upfront
        };
      });

      console.log('Transformed assets:', transformedAssets);
      setIPAssets(transformedAssets);
    } catch (err) {
      console.error('Error fetching IP assets:', err);
      setError('Failed to load IP assets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const displayAddress = testAddress;
 
  const determineAssetType = (tokenUri?: string): string => {
    if (!tokenUri) return 'Digital Asset';
    
    const uri = tokenUri.toLowerCase();
    if (uri.includes('image') || uri.includes('.jpg') || uri.includes('.png') || uri.includes('.gif')) return 'Image';
    if (uri.includes('audio') || uri.includes('.mp3') || uri.includes('.wav')) return 'Audio';
    if (uri.includes('video') || uri.includes('.mp4') || uri.includes('.mov')) return 'Video';
    if (uri.includes('text') || uri.includes('.txt') || uri.includes('.doc')) return 'Document';
    return 'Digital Asset';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-light text-white">My IP Assets</h2>
          <div className="text-sm text-zinc-400">
            Test Address: {displayAddress ? `${displayAddress.slice(0, 6)}...${displayAddress.slice(-4)}` : 'Not connected'}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/20 rounded-2xl overflow-hidden">
              <div className="h-40 bg-zinc-800/50 animate-pulse"></div>
              <div className="p-8 space-y-4">
                <div className="h-4 bg-zinc-700/50 rounded animate-pulse"></div>
                <div className="h-3 bg-zinc-700/50 rounded w-2/3 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-light text-white">My IP Assets</h2>
          <div className="text-sm text-zinc-400">
            Test Address: {displayAddress ? `${displayAddress.slice(0, 6)}...${displayAddress.slice(-4)}` : 'Not connected'}
          </div>
        </div>
        
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
          <p className="text-red-400">{error}</p>
          <button 
            onClick={fetchUserIPAssets}
            className="mt-4 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-light text-white">My IP Assets (Showing All - For Testing)</h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-zinc-400">
            Test Address: {displayAddress ? `${displayAddress.slice(0, 6)}...${displayAddress.slice(-4)}` : 'Not connected'}
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-blue-500/20 to-pink-600/20 text-blue-300 rounded-xl hover:from-blue-500/30 hover:to-pink-600/30 transition-all duration-300 border border-blue-500/20 text-sm">
            Register New IP
          </button>
        </div>
      </div>
      
      {ipAssets.length === 0 ? (
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/20 rounded-2xl p-16 text-center">
          <div className="w-12 h-12 mx-auto mb-8 bg-blue-500/10 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 011-1h1m0 0V3a2 2 0 011-1h1" />
            </svg>
          </div>
          <h3 className="text-lg font-light text-white mb-4">No IP Assets Found</h3>
          <p className="text-zinc-500 text-sm mb-8">API returned no assets</p>
          <button 
            onClick={fetchUserIPAssets}
            className="px-6 py-3 bg-gradient-to-r from-blue-500/20 to-pink-600/20 text-blue-300 rounded-xl hover:from-blue-500/30 hover:to-pink-600/30 transition-all duration-300 border border-blue-500/20 text-sm"
          >
            Retry Fetch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {ipAssets.map((asset) => (
            <MyIPCard key={asset.id} asset={asset} />
          ))}
        </div>
      )}
    </div>
  );
};

// Disputes Content Component
const DisputesContent: React.FC = () => {
  return (
    <div className="space-y-12">
      <h2 className="text-xl font-light text-white">Dispute Management</h2>
      
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/20 rounded-2xl p-16 text-center">
        <div className="w-12 h-12 mx-auto mb-8 bg-yellow-500/10 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-light text-white mb-4">No Active Disputes</h3>
        <p className="text-zinc-500 text-sm">All your IP assets are currently dispute-free.</p>
      </div>
    </div>
  );
};

// Updated Transaction History Content Component
const TransactionHistoryContent: React.FC = () => {
  const { address } = useAccount();
  const testAddress = "0x34a817D5723A289E125b35aAac7e763b6097d38d";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-light text-white">Transaction History</h2>
        <div className="text-sm text-zinc-400">
          Test Address: {testAddress ? `${testAddress.slice(0, 6)}...${testAddress.slice(-4)}` : 'Not connected'}
        </div>
      </div>
      
      <TransactionTable userAddress={testAddress} />
    </div>
  );
};

// Updated License Tokens Content Component - Removed image references
const LicenseTokensContent: React.FC = () => {
  const [licenseTokens, setLicenseTokens] = useState<LicenseTokenWithDetails[]>([]);
  const [allTokens, setAllTokens] = useState<LicenseToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ipAssets, setIPAssets] = useState<IPAsset[]>([]);
  const [showMode, setShowMode] = useState<'user' | 'all' | 'sample'>('user');
  const [selectedOwner, setSelectedOwner] = useState<string>('');
  const [selectedToken, setSelectedToken] = useState<LicenseTokenWithDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { address, isConnected } = useAccount();
  const testAddress = "0x34a817D5723A289E125b35aAac7e763b6097d38d";

  useEffect(() => {
    fetchLicenseTokens();
  }, []);

  const fetchLicenseTokens = async () => {
    const addressToUse = testAddress;
    
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching license tokens for address:', addressToUse);

      let rawTokens: LicenseToken[] = [];
      let allAssets: any[] = [];
      
      try {
        // Fetch IP assets first
        allAssets = await StoryAPIService.fetchAllIPAssets();
        setIPAssets(allAssets);
        console.log('IP assets fetched successfully:', allAssets.length);
      } catch (assetError) {
        console.warn('Failed to fetch IP assets:', assetError);
      }

      try {
        // Fetch all license tokens
        const allTokens = await StoryAPIService.fetchAllLicenseTokens();
        console.log('All license tokens fetched:', allTokens);
        setAllTokens(allTokens);
        
        // Filter by user address
        const userTokens = allTokens.filter(token => 
          token.owner && token.owner.toLowerCase() === addressToUse.toLowerCase()
        );
        console.log('Filtered license tokens for user:', userTokens);
        
        rawTokens = userTokens;
        
      } catch (tokenError) {
        console.error('Failed to fetch license tokens:', tokenError);
        throw new Error('Unable to fetch license tokens. The API might be temporarily unavailable.');
      }

      // Transform the license tokens with additional details - Removed image references
      const transformedTokens: LicenseTokenWithDetails[] = rawTokens.map((token: LicenseToken) => {
        const licensorAsset = allAssets.find(asset => 
          asset.ipId === token.licensorIpId || asset.id === token.licensorIpId
        );

        return {
          ...token,
          licensorName: licensorAsset?.nftMetadata?.name || licensorAsset?.name || `IP Asset ${token.licensorIpId.slice(0, 8)}`,
          isActive: !token.burntAt || token.burntAt === "0",
          createdDate: token.blockTime ? new Date(parseInt(token.blockTime) * 1000).toLocaleDateString() : 'Unknown'
        };
      });

      console.log('Transformed license tokens:', transformedTokens);
      setLicenseTokens(transformedTokens);
    } catch (err) {
      console.error('Error in fetchLicenseTokens:', err);
      setError(err instanceof Error ? err.message : 'Failed to load license tokens. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showSampleTokens = () => {
    if (allTokens.length === 0) return;
    
    // Get unique owners from all tokens
    const uniqueOwners = [...new Set(allTokens.map(token => token.owner))];
    console.log('Unique owners found:', uniqueOwners);
    
    // Take tokens from the first few owners (limit to 6-9 tokens for display)
    const sampleTokens = allTokens.slice(0, 9);
    
    // Transform without image references
    const transformedTokens: LicenseTokenWithDetails[] = sampleTokens.map((token: LicenseToken) => {
      const licensorAsset = ipAssets.find(asset => 
        asset.ipId === token.licensorIpId || asset.id === token.licensorIpId
      );

      return {
        ...token,
        licensorName: licensorAsset?.nftMetadata?.name || licensorAsset?.name || `IP Asset ${token.licensorIpId.slice(0, 8)}`,
        isActive: !token.burntAt || token.burntAt === "0",
        createdDate: token.blockTime ? new Date(parseInt(token.blockTime) * 1000).toLocaleDateString() : 'Unknown'
      };
    });

    setLicenseTokens(transformedTokens);
    setShowMode('sample');
  };

  const showTokensForOwner = (ownerAddress: string) => {
    const ownerTokens = allTokens.filter(token => 
      token.owner && token.owner.toLowerCase() === ownerAddress.toLowerCase()
    );
    
    // Transform without image references
    const transformedTokens: LicenseTokenWithDetails[] = ownerTokens.map((token: LicenseToken) => {
      const licensorAsset = ipAssets.find(asset => 
        asset.ipId === token.licensorIpId || asset.id === token.licensorIpId
      );

      return {
        ...token,
        licensorName: licensorAsset?.nftMetadata?.name || licensorAsset?.name || `IP Asset ${token.licensorIpId.slice(0, 8)}`,
        isActive: !token.burntAt || token.burntAt === "0",
        createdDate: token.blockTime ? new Date(parseInt(token.blockTime) * 1000).toLocaleDateString() : 'Unknown'
      };
    });

    setLicenseTokens(transformedTokens);
    setSelectedOwner(ownerAddress);
    setShowMode('user');
  };

  const getUniqueOwners = () => {
    if (allTokens.length === 0) return [];
    const owners = [...new Set(allTokens.map(token => token.owner))].filter(Boolean);
    return owners.slice(0, 5); // Show first 5 unique owners
  };

  const truncateHash = (hash: string, length = 8) => {
    return `${hash.slice(0, length)}...${hash.slice(-length)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openModal = (token: LicenseTokenWithDetails) => {
    setSelectedToken(token);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedToken(null);
  };

  const displayAddress = testAddress;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-light text-white">License Tokens</h2>
          <div className="text-sm text-zinc-400">
            Test Address: {displayAddress ? `${displayAddress.slice(0, 6)}...${displayAddress.slice(-4)}` : 'Not connected'}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/20 rounded-2xl p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-32 bg-zinc-700/50 rounded"></div>
                <div className="h-4 bg-zinc-700/50 rounded w-3/4"></div>
                <div className="h-3 bg-zinc-700/50 rounded w-1/2"></div>
                <div className="h-3 bg-zinc-700/50 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-light text-white">License Tokens</h2>
          <div className="text-sm text-zinc-400">
            Test Address: {displayAddress ? `${displayAddress.slice(0, 6)}...${displayAddress.slice(-4)}` : 'Not connected'}
          </div>
        </div>
        
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-400 mb-2">API Error</h3>
          <p className="text-red-300 text-sm mb-4">{error}</p>
          <button 
            onClick={fetchLicenseTokens}
            className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-light text-white">License Tokens</h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-zinc-400">
            {showMode === 'sample' ? 'Sample Tokens' : 
             showMode === 'user' && selectedOwner ? `Owner: ${selectedOwner.slice(0, 6)}...${selectedOwner.slice(-4)}` :
             `Test Address: ${displayAddress ? `${displayAddress.slice(0, 6)}...${displayAddress.slice(-4)}` : 'Not connected'}`}
          </div>
          <div className="text-sm text-zinc-500">
            {licenseTokens.length} token{licenseTokens.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/20 rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={fetchLicenseTokens}
            className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
              showMode === 'user' && !selectedOwner
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/20'
                : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50'
            }`}
          >
            My Tokens ({testAddress.slice(0, 6)}...)
          </button>
          
          <button 
            onClick={showSampleTokens}
            className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
              showMode === 'sample'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/20'
                : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50'
            }`}
          >
            Show Sample Tokens ({allTokens.length} available)
          </button>

          {getUniqueOwners().length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-zinc-500">View by owner:</span>
              {getUniqueOwners().map((owner) => (
                <button
                  key={owner}
                  onClick={() => showTokensForOwner(owner)}
                  className={`px-3 py-1 rounded text-xs transition-all duration-200 ${
                    selectedOwner === owner
                      ? 'bg-green-500/20 text-green-300 border border-green-500/20'
                      : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50'
                  }`}
                >
                  {owner.slice(0, 4)}...{owner.slice(-4)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {licenseTokens.length === 0 ? (
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/20 rounded-2xl p-16 text-center">
          <div className="w-12 h-12 mx-auto mb-8 bg-purple-500/10 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.243-6.243A6 6 0 0721 9z" />
            </svg>
          </div>
          <h3 className="text-lg font-light text-white mb-4">No License Tokens Found</h3>
          <p className="text-zinc-500 text-sm mb-4">
            {showMode === 'user' && !selectedOwner 
              ? `The test address doesn't own any license tokens yet.`
              : showMode === 'user' && selectedOwner
              ? `This owner doesn't have any license tokens.`
              : 'No tokens available to display.'}
          </p>
          <div className="text-xs text-zinc-600 mb-6">
            <p>Available license tokens in the system: <strong>{allTokens.length}</strong></p>
            <p>Unique token owners: <strong>{getUniqueOwners().length}</strong></p>
          </div>
          {allTokens.length > 0 && (
            <button 
              onClick={showSampleTokens}
              className="px-6 py-3 bg-gradient-to-r from-purple-500/20 to-pink-600/20 text-purple-300 rounded-xl hover:from-purple-500/30 hover:to-pink-600/30 transition-all duration-300 border border-purple-500/20 text-sm"
            >
              Show Sample Tokens ({allTokens.length} available)
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {licenseTokens.map((token) => (
            <div key={token.id} className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/20 rounded-2xl overflow-hidden hover:border-zinc-600/30 transition-all duration-300 shadow-xl hover:shadow-2xl">
              {/* Token Header - Updated without gradient background */}
              <div className="h-32 bg-zinc-800/40 flex items-center justify-center relative overflow-hidden">
                <div className="flex items-center justify-center w-full h-full">
                  <svg className="w-12 h-12 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.243-6.243A6 6 0 0721 9z" />
                  </svg>
                </div>
                
                {/* Menu Icon */}
                <button
                  onClick={() => openModal(token)}
                  className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-sm rounded-lg hover:bg-black/80 transition-all duration-200 group"
                  title="View License Details"
                >
                  <svg className="w-4 h-4 text-white group-hover:text-blue-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 011 2zm0 7a1 1 0 110-2 1 1 0 011 2zm0 7a1 1 0 110-2 1 1 0 011 2z" />
                  </svg>
                </button>

                {/* Status Badge */}
                <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg">
                  <span className={`text-xs font-medium ${
                    token.isActive ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {token.isActive ? 'Active' : 'Burnt'}
                  </span>
                </div>

                {/* Transferable Badge */}
                {token.transferable === 'true' && (
                  <div className="absolute bottom-3 left-3 px-2 py-1 bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 rounded-lg">
                    <span className="text-xs text-blue-300 font-medium">Transferable</span>
                  </div>
                )}
              </div>

              <div className="p-4">
                {/* License Info */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-white mb-2 truncate">
                    {token.licensorName}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">Token ID:</span>
                      <button 
                        onClick={() => copyToClipboard(token.id)}
                        className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-mono"
                        title="Click to copy"
                      >
                        {truncateHash(token.id, 6)}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">Owner:</span>
                      <button 
                        onClick={() => copyToClipboard(token.owner)}
                        className="text-xs text-orange-400 hover:text-orange-300 transition-colors font-mono"
                        title="Click to copy"
                      >
                        {truncateHash(token.owner, 6)}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">Licensor:</span>
                      <button 
                        onClick={() => copyToClipboard(token.licensorIpId)}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-mono"
                        title="Click to copy"
                      >
                        {truncateHash(token.licensorIpId, 6)}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">Created:</span>
                      <span className="text-xs text-white">{token.createdDate}</span>
                    </div>
                  </div>
                </div>


                {/* Block Info */}
                {token.blockNumber && (
                  <div className="mt-3 pt-3 border-t border-zinc-700/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">Block:</span>
                      <span className="text-xs text-zinc-400 font-mono">{token.blockNumber}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* License Info Modal */}
      {selectedToken && (
        <LicenseInfoModal
          token={selectedToken}
          isOpen={isModalOpen}
          onClose={closeModal}
        />
      )}
    </div>
  );
};
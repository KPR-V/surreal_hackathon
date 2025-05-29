"use client";

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { MyIPCard } from './myIPcard';

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

// Add this new service file for API calls
// filepath: c:\Users\sehaj\OneDrive\Documents\Desktop\timelineForm\timeline-form\lib\storyAPI.ts
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

// Transaction History Content Component
const TransactionHistoryContent: React.FC = () => {
  const sampleTransactions = [
    {
      id: '1',
      type: 'License Purchase',
      amount: '$150',
      asset: 'Digital Art Collection #001',
      date: '2024-01-15',
      status: 'Completed'
    },
    {
      id: '2',
      type: 'PIL Attachment',
      amount: '$25',
      asset: 'Music Track - "Synthwave Dreams"',
      date: '2024-01-14',
      status: 'Completed'
    },
    {
      id: '3',
      type: 'IP Registration',
      amount: '$50',
      asset: 'Brand Logo Design',
      date: '2024-01-13',
      status: 'Pending'
    }
  ];

  return (
    <div className="space-y-12">
      <h2 className="text-xl font-light text-white">Transaction History</h2>
      
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/20 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-800/20">
              <tr>
                <th className="px-8 py-6 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Type</th>
                <th className="px-8 py-6 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Asset</th>
                <th className="px-8 py-6 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Amount</th>
                <th className="px-8 py-6 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Date</th>
                <th className="px-8 py-6 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700/20">
              {sampleTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-zinc-800/20 transition-colors duration-200">
                  <td className="px-8 py-6 text-sm text-white">{transaction.type}</td>
                  <td className="px-8 py-6 text-sm text-zinc-400">{transaction.asset}</td>
                  <td className="px-8 py-6 text-sm text-blue-400 font-medium">{transaction.amount}</td>
                  <td className="px-8 py-6 text-sm text-zinc-400">{transaction.date}</td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                      transaction.status === 'Completed' 
                        ? 'bg-green-500/10 text-green-400' 
                        : 'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// License Tokens Content Component
const LicenseTokensContent: React.FC = () => {
  return (
    <div className="space-y-12">
      <h2 className="text-xl font-light text-white">License Tokens</h2>
      
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/20 rounded-2xl p-16 text-center">
        <div className="w-12 h-12 mx-auto mb-8 bg-purple-500/10 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.243-6.243A6 6 0 0721 9z" />
          </svg>
        </div>
        <h3 className="text-lg font-light text-white mb-4">No License Tokens</h3>
        <p className="text-zinc-500 text-sm mb-8">You don't have any license tokens yet.</p>
        <button className="px-6 py-3 bg-gradient-to-r from-purple-500/20 to-pink-600/20 text-purple-300 rounded-xl hover:from-purple-500/30 hover:to-pink-600/30 transition-all duration-300 border border-purple-500/20 text-sm">
          Explore License Tokens
        </button>
      </div>
    </div>
  );
};
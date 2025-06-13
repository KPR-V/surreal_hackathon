"use client";

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { NFTCard } from './myIPcards2';
import {  MyTransactionsTable } from './myTransactionstable';
import { StoryAPIService, PaginatedResponse } from './apiService';
import { IPAsset, LicenseToken } from './types';
import { LicenseTokenCard } from './licensetokenCard';
import { MyRaisedDisputes } from './myRaisedDisputes';

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

interface MyAccountTabProps {
  onIPAssetsUpdate?: (ipIds: string[]) => void;
  refreshTrigger?: number;
}

export const MyAccountTab: React.FC<MyAccountTabProps> = ({ 
  onIPAssetsUpdate,
  refreshTrigger 
}) => {
  const [activeTab, setActiveTab] = useState<string>('my-ip');

  const tabs = [
    { id: 'my-ip', label: 'My IP', icon: '🏛️' },
    { id: 'disputes', label: 'Disputes', icon: '⚠️' },
    { id: 'transactions', label: 'Transaction History', icon: '📄' },
    { id: 'license-tokens', label: 'License Tokens', icon: '🔑' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'my-ip': 
        return (
          <MyIPContent 
            onIPAssetsUpdate={onIPAssetsUpdate}
            refreshTrigger={refreshTrigger}
            activeTab={activeTab}
          />
        );
      case 'disputes': return <DisputesContent />;
      case 'transactions': return <TransactionHistoryContent />;
      case 'license-tokens': return <LicenseTokensContent />;
      default: 
        return (
          <MyIPContent 
            onIPAssetsUpdate={onIPAssetsUpdate}
            refreshTrigger={refreshTrigger}
            activeTab={activeTab}
          />
        );
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
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-500/20'
                    : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/30'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="min-h-[500px]">
        {renderTabContent()}
      </div>
    </div>
  );
};

interface MyIPContentProps {
  onIPAssetsUpdate?: (ipIds: string[]) => void;
  refreshTrigger?: number;
  activeTab: string;
}

const MyIPContent: React.FC<MyIPContentProps> = ({ 
  onIPAssetsUpdate, 
  refreshTrigger, 
  activeTab 
}) => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [nftAssets, setNFTAssets] = useState<NFTAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{ 
    hasNext: boolean; 
    hasPrevious: boolean;
    next?: string;
    previous?: string;
    currentPage: number;
    totalPages?: number;
    currentCursor?: string;
  }>({
    hasNext: false,
    hasPrevious: false,
    currentPage: 1,
    totalPages: 0
  });

  const ITEMS_PER_PAGE = 12; // 3 rows × 4 cards

  useEffect(() => {
    if (isConnected && connectedAddress) {
      fetchWalletNFTs('initial');
    } else {
      // Clear data when wallet is disconnected
      setNFTAssets([]);
      setError(null);
      setLoading(false);
    }
  }, [connectedAddress, isConnected]);

  // Update parent component when NFT assets change
  useEffect(() => {
    if (activeTab === 'my-ip' && nftAssets.length > 0) {
      // Extract IP IDs from NFTs that are registered as IP assets
      // This would require checking each NFT's registration status
      onIPAssetsUpdate?.([]);
    }
  }, [nftAssets, activeTab, onIPAssetsUpdate]);

  // Re-fetch when refresh trigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0 && isConnected && connectedAddress) {
      fetchWalletNFTs('initial');
    }
  }, [refreshTrigger, isConnected, connectedAddress]);

  const fetchWalletNFTs = async (direction: 'next' | 'previous' | 'initial' = 'initial') => {
    if (!isConnected || !connectedAddress) {
      setError('Please connect your wallet to view your NFTs');
      return;
    }

    try {
      if (direction === 'next' || direction === 'previous') {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log('Fetching wallet NFTs for My IP tab, address:', connectedAddress);

      // Use the same API endpoint as secondary market
      const response = await fetch(`/api/nfts/${connectedAddress}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch NFTs');
      }

      const data = await response.json();
      const allNFTs = data.items || [];

      // Filter OUT PILicenseTokens from My IP tab (only show regular NFTs/IP Assets)
      const regularNFTs = allNFTs.filter((nft: NFTAsset) => 
        nft.token.symbol !== "PILicenseToken"
      );

      console.log('My IP NFTs filtered:', {
        totalNFTs: allNFTs.length,
        regularNFTs: regularNFTs.length,
        filteredOutLicenseTokens: allNFTs.length - regularNFTs.length,
        regularNFTSymbols: regularNFTs.map((nft: NFTAsset) => nft.token.symbol).slice(0, 5) // First 5 for debugging
      });

      // Calculate pagination for filtered results
      const totalPages = Math.ceil(regularNFTs.length / ITEMS_PER_PAGE);
      let currentPage = pagination.currentPage;

      if (direction === 'next' && currentPage < totalPages) {
        currentPage += 1;
      } else if (direction === 'previous' && currentPage > 1) {
        currentPage -= 1;
      } else if (direction === 'initial') {
        currentPage = 1;
      }

      // Get items for current page
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const pageNFTs = regularNFTs.slice(startIndex, endIndex);

      setNFTAssets(pageNFTs);

      setPagination({
        hasNext: currentPage < totalPages,
        hasPrevious: currentPage > 1,
        currentPage,
        totalPages,
        currentCursor: ''
      });

    } catch (err) {
      console.error('Error fetching wallet NFTs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch wallet NFTs');
      setNFTAssets([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const goToNextPage = () => {
    if (pagination.hasNext && !loadingMore) {
      console.log('Going to next page');
      fetchWalletNFTs('next');
    }
  };

  const goToPreviousPage = () => {
    if (pagination.hasPrevious && !loadingMore) {
      console.log('Going to previous page');
      fetchWalletNFTs('previous');
    }
  };

  const refreshCurrentPage = () => {
    if (!loading && !loadingMore && isConnected && connectedAddress) {
      console.log('Refreshing current page');
      fetchWalletNFTs('initial');
    }
  };

  // Show wallet connection prompt if not connected
  if (!isConnected) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <p className="text-gray-400 mb-2">Wallet Not Connected</p>
        <p className="text-gray-500 text-sm mb-4">Please connect your wallet to view your IP assets</p>
        <button 
          onClick={() => {
            // This would typically trigger your wallet connection modal
            // You can integrate with your existing wallet connection logic
            console.log('Trigger wallet connection');
          }}
          className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm border border-blue-500/20 transition-all duration-200"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-zinc-400">Loading your NFTs...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center bg-zinc-900/40 border border-zinc-700/20 rounded-xl p-6 max-w-md backdrop-blur-sm">
          <div className="bg-red-500/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 border border-red-500/20">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-zinc-300 font-medium mb-2 text-sm">Unable to Load NFTs</h3>
          <p className="text-zinc-500 text-xs mb-4">{error}</p>
          <button 
            onClick={refreshCurrentPage}
            className="bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with page info and refresh */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-light text-white">My IP Assets</h2>
          <div className="text-sm text-zinc-400">
            {connectedAddress ? `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}` : 'No wallet connected'}
          </div>
          <div className="text-sm text-zinc-400">
            Page {pagination.currentPage}
            {pagination.totalPages && ` of ${pagination.totalPages}`}
            {nftAssets.length > 0 && ` • ${nftAssets.length} NFTs`}
          </div>
        </div>
        
        <button
          onClick={refreshCurrentPage}
          disabled={loading || loadingMore}
          className="p-2 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-all duration-200 disabled:opacity-50"
          title="Refresh current page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* NFT Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[600px]">
        {nftAssets.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="bg-zinc-800/30 rounded-xl p-8">
              <svg className="w-16 h-16 text-zinc-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-zinc-400 mb-2">No IP Assets found in wallet</p>
              <p className="text-sm text-zinc-500">
                No NFTs (excluding license tokens) found for wallet: {connectedAddress ? `${connectedAddress.slice(0, 8)}...${connectedAddress.slice(-6)}` : 'Unknown'}
              </p>
              <p className="text-xs text-zinc-600 mt-2">
                Register your NFTs as IP Assets or mint new ones to see them here
              </p>
              
              {pagination.currentPage > 1 && (
                <button
                  onClick={() => fetchWalletNFTs('initial')}
                  className="mt-4 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm transition-all duration-200"
                >
                  Go to First Page
                </button>
              )}
            </div>
          </div>
        ) : (
          nftAssets.map((asset, index) => (
            <NFTCard 
              key={`${asset.token.address}-${asset.id}`} 
              asset={asset} 
              cardIndex={index}
            />
          ))
        )}
      </div>

      {/* Enhanced Pagination Controls */}
      {(nftAssets.length > 0 || pagination.hasPrevious) && (
        <div className="flex justify-center items-center space-x-4 pt-8">
          <div className="flex items-center space-x-2">
            {/* First Page Button */}
            <button
              onClick={() => fetchWalletNFTs('initial')}
              disabled={pagination.currentPage === 1 || loadingMore}
              className="px-3 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-300 hover:text-white rounded-lg transition-all duration-200 border border-zinc-700/20 text-sm"
              title="First Page"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>

            {/* Previous Page Button */}
            <button
              onClick={goToPreviousPage}
              disabled={!pagination.hasPrevious || loadingMore}
              className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-300 hover:text-white rounded-lg transition-all duration-200 border border-zinc-700/20 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Previous</span>
            </button>
          </div>
          
          {/* Page Info */}
          <div className="flex items-center space-x-3 px-4">
            <span className="text-sm text-zinc-400">
              Page {pagination.currentPage}
              {pagination.totalPages && ` of ${pagination.totalPages}`}
            </span>
            {loadingMore && (
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Next Page Button */}
            <button
              onClick={goToNextPage}
              disabled={!pagination.hasNext || loadingMore}
              className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-300 hover:text-white rounded-lg transition-all duration-200 border border-zinc-700/20 flex items-center space-x-2"
            >
              <span>Next</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Auto-refresh indicator */}
            {pagination.hasNext && (
              <div className="text-xs text-zinc-500 px-2">
                {nftAssets.length} loaded
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading overlay for pagination */}
      {loadingMore && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-zinc-800/90 backdrop-blur-xl border border-zinc-700/30 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-white">Loading next page...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DisputesContent: React.FC = () => (
  <div>
    <MyRaisedDisputes />
  </div>
);

const TransactionHistoryContent: React.FC = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <div className="space-y-6">
      
      <MyTransactionsTable height={600} />
    </div>
  );
};

const LicenseTokensContent: React.FC = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [nftAssets, setNFTAssets] = useState<NFTAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Add missing state variables
  const [selectedToken, setSelectedToken] = useState<LicenseToken | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [pagination, setPagination] = useState<{ 
    hasNext: boolean; 
    hasPrevious: boolean;
    next?: string;
    previous?: string;
    currentPage: number;
    totalPages?: number;
  }>({
    hasNext: false,
    hasPrevious: false,
    currentPage: 1,
    totalPages: 0
  });

  const ITEMS_PER_PAGE = 12; // 3 rows × 4 cards

  useEffect(() => {
    if (isConnected && connectedAddress) {
      fetchLicenseTokenNFTs();
    } else {
      setNFTAssets([]);
      setLoading(false);
    }
  }, [connectedAddress, isConnected]);

  const fetchLicenseTokenNFTs = async (direction: 'next' | 'previous' | 'initial' = 'initial') => {
    if (!isConnected || !connectedAddress) {
      setLoading(false);
      return;
    }

    try {
      if (direction === 'next' || direction === 'previous') {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      console.log('Fetching wallet NFTs for license tokens...');

      // Fetch all NFTs from the wallet
      const response = await fetch(`/api/nfts/${connectedAddress}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch NFTs');
      }

      const data = await response.json();
      const allNFTs = data.items || [];

      // Filter NFTs that have token.symbol === "PILicenseToken"
      const licenseTokenNFTs = allNFTs.filter((nft: NFTAsset) => 
        nft.token.symbol === "PILicenseToken"
      );

      console.log('Filtered license token NFTs:', {
        totalNFTs: allNFTs.length,
        licenseTokenNFTs: licenseTokenNFTs.length,
        filteredTokens: licenseTokenNFTs.map((nft: NFTAsset) => ({
          id: nft.id,
          symbol: nft.token.symbol,
          name: nft.token.name
        }))
      });

      // Calculate pagination for filtered results
      const totalPages = Math.ceil(licenseTokenNFTs.length / ITEMS_PER_PAGE);
      let currentPage = pagination.currentPage;

      if (direction === 'next' && currentPage < totalPages) {
        currentPage += 1;
      } else if (direction === 'previous' && currentPage > 1) {
        currentPage -= 1;
      } else if (direction === 'initial') {
        currentPage = 1;
      }

      // Get items for current page
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const pageNFTs = licenseTokenNFTs.slice(startIndex, endIndex);

      setNFTAssets(pageNFTs);

      setPagination({
        hasNext: currentPage < totalPages,
        hasPrevious: currentPage > 1,
        currentPage,
        totalPages,
      });

    } catch (err) {
      console.error('Error fetching license token NFTs:', err);
      setNFTAssets([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const goToNextPage = () => {
    if (pagination.hasNext && !loadingMore) {
      fetchLicenseTokenNFTs('next');
    }
  };

  const goToPreviousPage = () => {
    if (pagination.hasPrevious && !loadingMore) {
      fetchLicenseTokenNFTs('previous');
    }
  };

  const refreshCurrentPage = () => {
    if (!loading && !loadingMore && isConnected && connectedAddress) {
      fetchLicenseTokenNFTs('initial');
    }
  };

  // Show wallet connection prompt if not connected
  if (!isConnected) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.243-6.243A6 6 0 0121 9z" />
          </svg>
        </div>
        <p className="text-gray-400 mb-2">Wallet Not Connected</p>
        <p className="text-gray-500 text-sm mb-4">Please connect your wallet to view your license tokens</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-zinc-400">Loading your license tokens...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-light text-white">License Tokens</h2>
          <div className="text-sm text-zinc-400">
            {connectedAddress ? `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}` : 'No wallet connected'}
          </div>
          <div className="text-sm text-zinc-400">
            Page {pagination.currentPage}
            {pagination.totalPages && ` of ${pagination.totalPages}`}
            {nftAssets.length > 0 && ` • ${nftAssets.length} tokens`}
          </div>
        </div>
        
        <button
          onClick={refreshCurrentPage}
          disabled={loading || loadingMore}
          className="p-2 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-all duration-200 disabled:opacity-50"
          title="Refresh license tokens"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* License Token NFTs Grid - Using LicenseTokenCard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[600px]">
        {nftAssets.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="bg-zinc-800/30 rounded-xl p-8">
              <svg className="w-16 h-16 text-zinc-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.243-6.243A6 6 0 0121 9z" />
              </svg>
              <p className="text-zinc-400 mb-2">No License Tokens Found</p>
              <p className="text-sm text-zinc-500">
                No PILicenseTokens found in wallet: {connectedAddress ? `${connectedAddress.slice(0, 8)}...${connectedAddress.slice(-6)}` : 'Unknown'}
              </p>
              <p className="text-xs text-zinc-600 mt-2">
                License tokens will appear here when you mint or receive them
              </p>
              
              {pagination.currentPage > 1 && (
                <button
                  onClick={() => fetchLicenseTokenNFTs('initial')}
                  className="mt-4 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg text-sm transition-all duration-200"
                >
                  Go to First Page
                </button>
              )}
            </div>
          </div>
        ) : (
          nftAssets.map((asset: NFTAsset, index: number) => (
            <LicenseTokenCard 
              key={`${asset.token.address}-${asset.id}`} 
              asset={{
                ...asset,
                owner: connectedAddress || ''
              }} 
              cardIndex={index}
            />
          ))
        )}
      </div>

      {/* Enhanced Pagination Controls */}
      {(nftAssets.length > 0 || pagination.hasPrevious) && (
        <div className="flex justify-center items-center space-x-4 pt-8">
          <div className="flex items-center space-x-2">
            {/* First Page Button */}
            <button
              onClick={() => fetchLicenseTokenNFTs('initial')}
              disabled={pagination.currentPage === 1 || loadingMore}
              className="px-3 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-300 hover:text-white rounded-lg transition-all duration-200 border border-zinc-700/20 text-sm"
              title="First Page"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>

            {/* Previous Page Button */}
            <button
              onClick={goToPreviousPage}
              disabled={!pagination.hasPrevious || loadingMore}
              className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-300 hover:text-white rounded-lg transition-all duration-200 border border-zinc-700/20 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Previous</span>
            </button>
          </div>
          
          {/* Page Info */}
          <div className="flex items-center space-x-3 px-4">
            <span className="text-sm text-zinc-400">
              Page {pagination.currentPage}
              {pagination.totalPages && ` of ${pagination.totalPages}`}
            </span>
            {loadingMore && (
              <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Next Page Button */}
            <button
              onClick={goToNextPage}
              disabled={!pagination.hasNext || loadingMore}
              className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-300 hover:text-white rounded-lg transition-all duration-200 border border-zinc-700/20 flex items-center space-x-2"
            >
              <span>Next</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Token count indicator */}
            {pagination.hasNext && (
              <div className="text-xs text-zinc-500 px-2">
                {nftAssets.length} loaded
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading overlay for pagination */}
      {loadingMore && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-zinc-800/90 backdrop-blur-xl border border-zinc-700/30 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-white">Loading license tokens...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { NFTCard } from "./nftCards";
import { ListedRT } from "./listedRT";

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

export function SecondaryMarketTabs() {
  const [activeTab, setActiveTab] = useState("listings");
  const [listingsFilter, setListingsFilter] = useState("royalty");
  const [tokensFilter, setTokensFilter] = useState("royalty");

  const tabs = [
    { id: 'listings', label: 'Listings', icon: '📋' },
    { id: 'my-tokens', label: 'My Tokens', icon: '🎯' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'listings': 
        return <ListingsContent filter={listingsFilter} />;
      case 'my-tokens': 
        return <MyTokensContent filter={tokensFilter} />;
      default: 
        return <ListingsContent filter={listingsFilter} />;
    }
  };

  return (
    <div className="mt-12">
      {/* Tab Navigation */}
      <div className="relative mb-12">
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/20 rounded-2xl p-3">
          <div className="flex items-center justify-between">
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

            {/* Filter Dropdown */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-zinc-500">Filter:</span>
              {activeTab === "listings" && (
                <select
                  value={listingsFilter}
                  onChange={(e) => setListingsFilter(e.target.value)}
                  className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500/50 transition-colors duration-200"
                >
                  <option value="royalty">Royalty Tokens</option>
                  <option value="license">License Tokens</option>
                </select>
              )}
              
              {activeTab === "my-tokens" && (
                <select
                  value={tokensFilter}
                  onChange={(e) => setTokensFilter(e.target.value)}
                  className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500/50 transition-colors duration-200"
                >
                  <option value="royalty">Royalty Tokens</option>
                  <option value="license">License Tokens</option>
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-[500px]">
        {renderTabContent()}
      </div>
    </div>
  );
}

// Listings Content Component
const ListingsContent: React.FC<{ filter: string }> = ({ filter }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-light text-white">Available Listings</h2>
        <div className="text-sm text-zinc-400">
          Showing {filter === "royalty" ? "Royalty Tokens" : "License Tokens"}
        </div>
      </div>
      
      <ListedRT filter={filter} />
    </div>
  );
};

// My Tokens Content Component with Dynamic Wallet Address
const MyTokensContent: React.FC<{ filter: string }> = ({ filter }) => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [nfts, setNfts] = useState<NFTAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    currentPage: number;
    hasNext: boolean;
    hasPrevious: boolean;
    totalPages: number;
  }>({
    currentPage: 1,
    hasNext: false,
    hasPrevious: false,
    totalPages: 0
  });

  const ITEMS_PER_PAGE = 12; // 3 rows × 4 cards

  useEffect(() => {
    if (filter === "royalty" && isConnected && connectedAddress) {
      fetchNFTs('initial');
    }
  }, [filter, isConnected, connectedAddress]);

  const fetchNFTs = async (direction: 'next' | 'previous' | 'initial' = 'initial') => {
    if (filter !== "royalty") return;
    
    if (!isConnected || !connectedAddress) {
      setError('Please connect your wallet to view your tokens');
      return;
    }

    try {
      if (direction === 'next' || direction === 'previous') {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await fetch(`/api/nfts/${connectedAddress}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch NFTs');
      }

      const data = await response.json();
      const allNFTs = data.items || [];

      // Calculate pagination
      const totalPages = Math.ceil(allNFTs.length / ITEMS_PER_PAGE);
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
      const pageNFTs = allNFTs.slice(startIndex, endIndex);

      setNfts(pageNFTs);
      setPagination({
        currentPage,
        hasNext: currentPage < totalPages,
        hasPrevious: currentPage > 1,
        totalPages
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching NFTs:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const goToNextPage = () => {
    if (pagination.hasNext && !loadingMore) {
      fetchNFTs('next');
    }
  };

  const goToPreviousPage = () => {
    if (pagination.hasPrevious && !loadingMore) {
      fetchNFTs('previous');
    }
  };

  const refreshCurrentPage = () => {
    if (!loading && !loadingMore) {
      fetchNFTs('initial');
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
        <p className="text-gray-500 text-sm mb-4">Please connect your wallet to view your tokens</p>
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

  if (filter !== "royalty") {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 9l-6 6m6 0l-6-6" />
          </svg>
        </div>
        <p className="text-gray-400 mb-2">License Token Management</p>
        <p className="text-gray-500 text-sm">License token management coming soon!</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-zinc-400">Loading your tokens...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with page info, wallet address, and refresh */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-light text-white">My Tokens</h2>
          <div className="text-sm text-zinc-400">
            Page {pagination.currentPage}
            {pagination.totalPages > 0 && ` of ${pagination.totalPages}`}
            {nfts.length > 0 && ` • ${nfts.length} tokens`}
          </div>
          {/* Connected Wallet Address Display */}
          <div className="text-xs text-zinc-500 bg-zinc-800/30 px-2 py-1 rounded">
            {connectedAddress ? `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}` : 'Not connected'}
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

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-400 mb-2">Error loading tokens</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button 
            onClick={() => fetchNFTs('initial')}
            className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm border border-blue-500/20 transition-all duration-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* NFT Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[600px]">
        {nfts.length === 0 && !error ? (
          <div className="col-span-full text-center py-16">
            <div className="bg-zinc-800/30 rounded-xl p-8">
              <svg className="w-16 h-16 text-zinc-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-zinc-400 mb-2">No tokens found</p>
              <p className="text-sm text-zinc-500">
                No royalty tokens found for wallet: {connectedAddress ? `${connectedAddress.slice(0, 8)}...${connectedAddress.slice(-6)}` : 'Unknown'}
              </p>
              
              {pagination.currentPage > 1 && (
                <button
                  onClick={() => fetchNFTs('initial')}
                  className="mt-4 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm transition-all duration-200"
                >
                  Go to First Page
                </button>
              )}
            </div>
          </div>
        ) : (
          nfts.map((nft, index) => (
            <NFTCard key={`${nft.token.address}-${nft.id}`} asset={nft} cardIndex={index} />
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {(nfts.length > 0 || pagination.hasPrevious) && (
        <div className="flex justify-center items-center space-x-4 pt-8">
          <div className="flex items-center space-x-2">
            {/* First Page Button */}
            <button
              onClick={() => fetchNFTs('initial')}
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
              {pagination.totalPages > 0 && ` of ${pagination.totalPages}`}
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

            {/* Page info */}
            {pagination.hasNext && (
              <div className="text-xs text-zinc-500 px-2">
                {nfts.length} loaded
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
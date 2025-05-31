"use client";

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { MyIPCard } from './myIPcard';
import { LicenseInfoModal } from './licenseTokeninfo';
import { TransactionTable } from './transactionTable';
import { StoryAPIService, PaginatedResponse } from './apiService';
import { IPAsset, LicenseToken } from './types';

export const MyAccountTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('my-ip');

  const tabs = [
    { id: 'my-ip', label: 'My IP', icon: '🏛️' },
    { id: 'disputes', label: 'Disputes', icon: '⚠️' },
    { id: 'transactions', label: 'Transaction History', icon: '📄' },
    { id: 'license-tokens', label: 'License Tokens', icon: '🔑' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'my-ip': return <MyIPContent />;
      case 'disputes': return <DisputesContent />;
      case 'transactions': return <TransactionHistoryContent />;
      case 'license-tokens': return <LicenseTokensContent />;
      default: return <MyIPContent />;
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

const MyIPContent: React.FC = () => {
  const [ipAssets, setIPAssets] = useState<IPAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
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

  // Keep track of page history for better navigation
  const [pageHistory, setPageHistory] = useState<{
    cursors: string[];
    currentIndex: number;
  }>({
    cursors: [''], // Start with empty cursor for first page
    currentIndex: 0
  });

  const testAddress = "0x34a817D5723A289E125b35aAac7e763b6097d38d";

  useEffect(() => {
    fetchUserIPAssets('initial');
  }, []);

  const fetchUserIPAssets = async (direction: 'next' | 'previous' | 'initial' = 'initial') => {
    try {
      if (direction === 'next' || direction === 'previous') {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      let cursor = '';
      let newPageHistory = { ...pageHistory };

      if (direction === 'next' && pagination.next) {
        cursor = pagination.next;
        // Add to page history if not already there
        if (!pageHistory.cursors.includes(cursor)) {
          newPageHistory.cursors.push(cursor);
        }
        newPageHistory.currentIndex = newPageHistory.cursors.indexOf(cursor);
      } else if (direction === 'previous') {
        if (pageHistory.currentIndex > 0) {
          newPageHistory.currentIndex = pageHistory.currentIndex - 1;
          cursor = newPageHistory.cursors[newPageHistory.currentIndex];
        }
      } else {
        // Initial load
        cursor = '';
        newPageHistory = {
          cursors: [''],
          currentIndex: 0
        };
      }

      const paginationOptions = cursor 
        ? { after: cursor, limit: 12 } // Always fetch 12 items (3 rows × 4 cards)
        : { limit: 12 };

      console.log('Fetching IP assets with pagination:', paginationOptions);

      const response: PaginatedResponse<any> = await StoryAPIService.fetchAssets(
        {},
        paginationOptions
      );

      console.log('IP Assets response:', {
        dataLength: response.data?.length || 0,
        hasNext: response.hasNext,
        hasPrevious: response.hasPrevious,
        next: response.next,
        previous: response.previous
      });

      const transformedAssets: IPAsset[] = response.data.map((asset: any, index: number) => ({
        id: asset.id || `asset-${index}`,
        name: asset.nftMetadata?.name || `IP Asset ${index + 1}`,
        type: determineAssetType(asset.nftMetadata?.tokenUri),
        status: 'Active',
        pilAttached: !!asset.pilAttached,
        revenue: '0.00 ETH',
        derivatives: asset.childrenCount || 0,
        image: asset.nftMetadata?.imageUrl || '',
        ipId: asset.id,
        tokenContract: asset.nftMetadata?.tokenContract || asset.tokenContract,
        tokenId: asset.nftMetadata?.tokenId || asset.tokenId,
        blockNumber: asset.blockNumber,
        nftMetadata: {
          name: asset.nftMetadata?.name || '',
          imageUrl: asset.nftMetadata?.imageUrl || '',
          tokenContract: asset.nftMetadata?.tokenContract || asset.tokenContract,
          tokenId: asset.nftMetadata?.tokenId || asset.tokenId,
          chainId: asset.nftMetadata?.chainId,
          tokenUri: asset.nftMetadata?.tokenUri
        },
        ancestorCount: asset.ancestorCount || 0,
        descendantCount: asset.descendantCount || 0,
        childrenCount: asset.childrenCount || 0,
        parentCount: asset.parentCount || 0,
        blockTimestamp: asset.blockTimestamp,
        transactionHash: asset.transactionHash
      }));

      setIPAssets(transformedAssets);
      setPageHistory(newPageHistory);

      // Calculate estimated total pages (rough estimate)
      const estimatedTotalPages = response.total ? Math.ceil(response.total / 12) : undefined;

      setPagination({
        hasNext: response.hasNext,
        hasPrevious: newPageHistory.currentIndex > 0,
        next: response.next,
        previous: response.previous,
        currentPage: newPageHistory.currentIndex + 1,
        totalPages: estimatedTotalPages,
        currentCursor: cursor
      });

    } catch (err) {
      console.error('Error fetching IP assets:', err);
      // Show error state
      setIPAssets([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const goToNextPage = () => {
    if (pagination.hasNext && !loadingMore) {
      console.log('Going to next page with cursor:', pagination.next);
      fetchUserIPAssets('next');
    }
  };

  const goToPreviousPage = () => {
    if (pagination.hasPrevious && !loadingMore) {
      console.log('Going to previous page, current index:', pageHistory.currentIndex);
      fetchUserIPAssets('previous');
    }
  };

  const refreshCurrentPage = () => {
    if (!loading && !loadingMore) {
      console.log('Refreshing current page');
      setLoading(true);
      const currentCursor = pageHistory.cursors[pageHistory.currentIndex];
      
      const paginationOptions = currentCursor 
        ? { after: currentCursor, limit: 12 }
        : { limit: 12 };

      StoryAPIService.fetchAssets({}, paginationOptions)
        .then(response => {
          const transformedAssets: IPAsset[] = response.data.map((asset: any, index: number) => ({
            id: asset.id || `asset-${index}`,
            name: asset.nftMetadata?.name || `IP Asset ${index + 1}`,
            type: determineAssetType(asset.nftMetadata?.tokenUri),
            status: 'Active',
            pilAttached: !!asset.pilAttached,
            revenue: '0.00 ETH',
            derivatives: asset.childrenCount || 0,
            image: asset.nftMetadata?.imageUrl || '',
            ipId: asset.id,
            tokenContract: asset.nftMetadata?.tokenContract || asset.tokenContract,
            tokenId: asset.nftMetadata?.tokenId || asset.tokenId,
            blockNumber: asset.blockNumber,
            nftMetadata: {
              name: asset.nftMetadata?.name || '',
              imageUrl: asset.nftMetadata?.imageUrl || '',
              tokenContract: asset.nftMetadata?.tokenContract || asset.tokenContract,
              tokenId: asset.nftMetadata?.tokenId || asset.tokenId,
              chainId: asset.nftMetadata?.chainId,
              tokenUri: asset.nftMetadata?.tokenUri
            },
            ancestorCount: asset.ancestorCount || 0,
            descendantCount: asset.descendantCount || 0,
            childrenCount: asset.childrenCount || 0,
            parentCount: asset.parentCount || 0,
            blockTimestamp: asset.blockTimestamp,
            transactionHash: asset.transactionHash
          }));
          
          setIPAssets(transformedAssets);
        })
        .catch(err => console.error('Error refreshing page:', err))
        .finally(() => setLoading(false));
    }
  };

  const determineAssetType = (tokenUri?: string): string => {
    if (!tokenUri) return 'Digital Asset';
    const uri = tokenUri.toLowerCase();
    if (uri.includes('image') || uri.includes('.jpg') || uri.includes('.png')) return 'Image';
    if (uri.includes('audio') || uri.includes('.mp3')) return 'Audio';
    if (uri.includes('video') || uri.includes('.mp4')) return 'Video';
    return 'Digital Asset';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-zinc-400">Loading IP assets...</span>
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
            Page {pagination.currentPage}
            {pagination.totalPages && ` of ${pagination.totalPages}`}
            {ipAssets.length > 0 && ` • ${ipAssets.length} assets`}
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

      {/* IP Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[600px]">
        {ipAssets.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="bg-zinc-800/30 rounded-xl p-8">
              <svg className="w-16 h-16 text-zinc-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 011-1h1m0 0V3a2 2 0 011-1h1" />
              </svg>
              <p className="text-zinc-400 mb-2">No IP assets found</p>
              <p className="text-sm text-zinc-500">Your registered IP assets will appear here</p>
              
              {pagination.currentPage > 1 && (
                <button
                  onClick={() => fetchUserIPAssets('initial')}
                  className="mt-4 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm transition-all duration-200"
                >
                  Go to First Page
                </button>
              )}
            </div>
          </div>
        ) : (
          ipAssets.map((asset, index) => (
            <MyIPCard 
              key={asset.id} 
              asset={asset} 
              cardIndex={index}
            />
          ))
        )}
      </div>

      {/* Enhanced Pagination Controls */}
      {(ipAssets.length > 0 || pagination.hasPrevious) && (
        <div className="flex justify-center items-center space-x-4 pt-8">
          <div className="flex items-center space-x-2">
            {/* First Page Button */}
            <button
              onClick={() => fetchUserIPAssets('initial')}
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
                {ipAssets.length} loaded
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
  <div className="text-center py-16">
    <h2 className="text-xl font-light text-white mb-4">Disputes</h2>
    <p className="text-zinc-400">No disputes found</p>
  </div>
);

const TransactionHistoryContent: React.FC = () => {
  const testAddress = "0x34a817D5723A289E125b35aAac7e763b6097d38d";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-light text-white">Transaction History</h2>
        <div className="text-sm text-zinc-400">
          Test Address: {testAddress.slice(0, 6)}...{testAddress.slice(-4)}
        </div>
      </div>
      <TransactionTable userAddress={testAddress} />
    </div>
  );
};

const LicenseTokensContent: React.FC = () => {
  const [licenseTokens, setLicenseTokens] = useState<LicenseToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<{ 
    hasNext: boolean; 
    hasPrevious: boolean;
    next?: string;
    previous?: string;
    currentPage: number;
  }>({
    hasNext: false,
    hasPrevious: false,
    currentPage: 1
  });
  const [selectedToken, setSelectedToken] = useState<LicenseToken | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchLicenseTokens();
  }, []);

  const fetchLicenseTokens = async (cursor?: string, direction: 'next' | 'previous' | 'initial' = 'initial') => {
    try {
      if (direction === 'next') {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const paginationOptions = cursor 
        ? direction === 'next' 
          ? { after: cursor, limit: 12 } // Changed to 12
          : { before: cursor, limit: 12 } // Changed to 12
        : { limit: 12 }; // Changed to 12

      const response: PaginatedResponse<any> = await StoryAPIService.fetchLicenseTokens(
        {},
        paginationOptions
      );

      const transformedTokens: LicenseToken[] = response.data.map((token: any) => ({
        ...token,
        licensorName: `IP Asset ${token.licensorIpId?.slice(0, 8)}...`,
        isActive: !token.burntAt,
        createdDate: new Date(token.blockTime).toLocaleDateString()
      }));

      // Replace data instead of accumulating
      setLicenseTokens(transformedTokens);

      setPagination({
        hasNext: response.hasNext,
        hasPrevious: response.hasPrevious,
        next: response.next,
        previous: response.previous,
        currentPage: direction === 'next' ? pagination.currentPage + 1 : 
                    direction === 'previous' ? pagination.currentPage - 1 : 1
      });
    } catch (err) {
      console.error('Error fetching license tokens:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const goToNextPage = () => {
    if (pagination.next && !loadingMore) {
      fetchLicenseTokens(pagination.next, 'next');
    }
  };

  const goToPreviousPage = () => {
    if (pagination.previous && !loadingMore) {
      fetchLicenseTokens(pagination.previous, 'previous');
    }
  };

  const truncateHash = (hash: string, length = 8) => 
    `${hash.slice(0, length)}...${hash.slice(-length)}`;

  const openModal = (token: LicenseToken) => {
    setSelectedToken(token);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-light text-white">License Tokens</h2>
        <div className="text-sm text-zinc-400">
          Page {pagination.currentPage} • {licenseTokens.length} tokens
        </div>
      </div>

      {licenseTokens.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-zinc-400 mb-4">No license tokens found</p>
          <p className="text-sm text-zinc-500">Your license tokens will appear here</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {licenseTokens.map((token) => (
              <div
                key={token.id}
                onClick={() => openModal(token)}
                className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/20 rounded-2xl p-6 hover:border-zinc-600/30 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-3 h-3 rounded-full ${
                    token.isActive ? 'bg-green-400' : 'bg-red-400'
                  }`}></div>
                  <span className="text-xs text-zinc-500">
                    {token.createdDate}
                  </span>
                </div>

                <h3 className="text-lg font-medium text-white mb-2 group-hover:text-blue-300 transition-colors">
                  {token.licensorName}
                </h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Status:</span>
                    <span className={`font-medium ${
                      token.isActive ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {token.isActive ? 'Active' : 'Burnt'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Transferable:</span>
                    <span className="text-white">
                      {token.transferable === 'true' ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-700/20">
                  <p className="text-xs text-zinc-500 truncate">
                    Terms: {truncateHash(token.licenseTermsId)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-center items-center space-x-4 pt-8">
            <button
              onClick={goToPreviousPage}
              disabled={!pagination.hasPrevious || loadingMore}
              className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-300 hover:text-white rounded-lg transition-all duration-200 border border-zinc-700/20"
            >
              Previous Page
            </button>
            
            <span className="text-sm text-zinc-400">
              Page {pagination.currentPage}
            </span>
            
            <button
              onClick={goToNextPage}
              disabled={!pagination.hasNext || loadingMore}
              className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-300 hover:text-white rounded-lg transition-all duration-200 border border-zinc-700/20"
            >
              {loadingMore ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </div>
              ) : (
                'Next Page'
              )}
            </button>
          </div>
        </>
      )}

      {selectedToken && (
        <LicenseInfoModal
          token={selectedToken}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};
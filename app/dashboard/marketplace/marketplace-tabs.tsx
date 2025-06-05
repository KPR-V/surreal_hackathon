'use client'
import React, { useState, useEffect } from 'react'
import { IPCardMarketplace } from './ipCardMarketplace'
import { StoryAPIService, PaginatedResponse } from '../my-account/apiService'

interface IPAsset {
  id: string;
  name: string;
  type: string;
  status: string;
  image: string;
  ipId: string;
  tokenContract: string;
  tokenId: string;
  blockNumber: number;
  nftMetadata: {
    name: string;
    imageUrl: string;
    tokenContract: string;
    tokenId: string;
    chainId?: string;
    tokenUri?: string;
  };
  blockTimestamp: string;
  transactionHash: string;
}

// Enhanced Currency Service with IP token conversion
const CurrencyService = {
  convertWeiToIP(weiAmount: string | number): number {
    const wei = typeof weiAmount === 'string' ? parseFloat(weiAmount) : weiAmount;
    if (isNaN(wei) || wei === 0) return 0;
    
    // Convert wei to ETH first, then to USD, then to IP tokens
    const eth = wei / 1000000000000000000; // 1 ETH = 10^18 wei
    const usd = eth * 2500; // Approximate ETH price
    const ipTokens = usd / 4.15; // 1 IP = $4.15
    
    return ipTokens;
  },

  formatIPAmount(amount: number): string {
    if (amount === 0) return 'Free';
    if (amount < 0.0001) return `${amount.toExponential(2)} IP`;
    if (amount < 1) return `${amount.toFixed(4)} IP`;
    if (amount < 1000) return `${amount.toFixed(2)} IP`;
    return `${(amount / 1000).toFixed(2)}K IP`;
  }
};

const MarketplaceTabs = () => {
  const [ipAssets, setIPAssets] = useState<IPAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  
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
  })

  const [pageHistory, setPageHistory] = useState<{
    cursors: string[];
    currentIndex: number;
  }>({
    cursors: [''],
    currentIndex: 0
  })

  useEffect(() => {
    fetchGlobalIPAssets('initial')
  }, [])

  const fetchGlobalIPAssets = async (direction: 'next' | 'previous' | 'initial' = 'initial') => {
    try {
      if (direction === 'next' || direction === 'previous') {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

      let cursor = ''
      let newPageHistory = { ...pageHistory }

      if (direction === 'next' && pagination.next) {
        cursor = pagination.next
        if (!pageHistory.cursors.includes(cursor)) {
          newPageHistory.cursors.push(cursor)
        }
        newPageHistory.currentIndex = newPageHistory.cursors.indexOf(cursor)
      } else if (direction === 'previous') {
        if (pageHistory.currentIndex > 0) {
          newPageHistory.currentIndex = pageHistory.currentIndex - 1
          cursor = newPageHistory.cursors[newPageHistory.currentIndex]
        }
      } else {
        cursor = ''
        newPageHistory = {
          cursors: [''],
          currentIndex: 0
        }
      }

      const paginationOptions = cursor 
        ? { after: cursor, limit: 12 }
        : { limit: 12 }

      const response: PaginatedResponse<any> = await StoryAPIService.fetchAssets(
        {},
        paginationOptions
      )

      const transformedAssets: IPAsset[] = response.data.map((asset: any, index: number) => ({
        id: asset.id || `asset-${index}`,
        name: asset.nftMetadata?.name || `IP Asset ${index + 1}`,
        type: determineAssetType(asset.nftMetadata?.tokenUri),
        status: 'Active',
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
        blockTimestamp: asset.blockTimestamp,
        transactionHash: asset.transactionHash
      }))

      setIPAssets(transformedAssets)
      setPageHistory(newPageHistory)

      const estimatedTotalPages = response.total ? Math.ceil(response.total / 12) : undefined

      setPagination({
        hasNext: response.hasNext,
        hasPrevious: newPageHistory.currentIndex > 0,
        next: response.next,
        previous: response.previous,
        currentPage: newPageHistory.currentIndex + 1,
        totalPages: estimatedTotalPages
      })

    } catch (err) {
      console.error('Error fetching marketplace IP assets:', err)
      setIPAssets([])
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const determineAssetType = (tokenUri?: string): string => {
    if (!tokenUri) return 'Digital Asset'
    const uri = tokenUri.toLowerCase()
    if (uri.includes('image') || uri.includes('.jpg') || uri.includes('.png')) return 'Image'
    if (uri.includes('audio') || uri.includes('.mp3')) return 'Audio'
    if (uri.includes('video') || uri.includes('.mp4')) return 'Video'
    return 'Digital Asset'
  }

  const goToNextPage = () => {
    if (pagination.hasNext && !loadingMore) {
      fetchGlobalIPAssets('next')
    }
  }

  const goToPreviousPage = () => {
    if (pagination.hasPrevious && !loadingMore) {
      fetchGlobalIPAssets('previous')
    }
  }

  const refreshCurrentPage = () => {
    if (!loading && !loadingMore) {
      fetchGlobalIPAssets('initial')
    }
  }

  return (
    <div className="w-full">
      {/* Removed Tab Headers - Now just showing IP Assets directly */}
      <div className="space-y-6">
        {/* Header with page info and refresh */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-light text-white">Global IP Assets Marketplace</h2>
            <div className="text-sm text-zinc-400">
              Page {pagination.currentPage}
              {pagination.totalPages && ` of ${pagination.totalPages}`}
              {ipAssets.length > 0 && ` • ${ipAssets.length} assets`}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Refresh Button */}
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
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-zinc-400">Loading marketplace...</span>
            </div>
          </div>
        ) : (
          <>
            {/* IP Assets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[600px]">
              {ipAssets.length === 0 ? (
                <div className="col-span-full text-center py-16">
                  <div className="bg-zinc-800/30 rounded-xl p-8">
                    <svg className="w-16 h-16 text-zinc-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 011-1h1m0 0V3a2 2 0 011-1h1" />
                    </svg>
                    <p className="text-zinc-400 mb-2">No IP assets found</p>
                    <p className="text-sm text-zinc-500">Global IP assets will appear here</p>
                  </div>
                </div>
              ) : (
                ipAssets.map((asset, index) => (
                  <IPCardMarketplace 
                    key={asset.id} 
                    asset={asset} 
                    cardIndex={index}
                  />
                ))
              )}
            </div>

            {/* Pagination Controls */}
            {(ipAssets.length > 0 || pagination.hasPrevious) && (
              <div className="flex justify-center items-center space-x-4 pt-8">
                <div className="flex items-center space-x-2">
                  {/* First Page Button */}
                  <button
                    onClick={() => fetchGlobalIPAssets('initial')}
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
                </div>
              </div>
            )}
          </>
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
    </div>
  )
}

export { MarketplaceTabs }
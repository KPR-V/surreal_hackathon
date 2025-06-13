'use client'
import React, { useState, useEffect } from 'react'
import { IPCardMarketplace } from './ipCardMarketplace'
import { GlobalStats } from './GlobalStats'
import { StoryAPIService, PaginatedResponse } from '../my-account/apiService'
import { IPAssetSearchService } from '../../../lib/services/ipAssetSearchService'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<IPAsset[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false) // Track if user has actually searched
  
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

  // Smart search validation
  const isValidIPIdLength = (input: string) => {
    return input.trim().length === 42 && input.startsWith('0x')
  }

  const isValidIPIdFormat = (input: string) => {
    return IPAssetSearchService.isValidIPId(input.trim())
  }

  // Enhanced search function
  const searchIPAssetById = async (ipId: string) => {
    if (!ipId.trim()) {
      setSearchResults([])
      setSearchError(null)
      setHasSearched(false)
      return
    }

    setSearchLoading(true)
    setSearchError(null)
    setHasSearched(true) // Mark that user has actually performed a search

    try {
      console.log('Searching for IP ID using dedicated search API:', ipId)
      
      // Use the new search service
      const results = await IPAssetSearchService.comprehensiveSearch(ipId)

      if (results.length === 0) {
        setSearchError(`No IP assets found with ID "${ipId}"`);
        setSearchResults([]);
        return;
      }

      console.log(`Found ${results.length} matching assets using search API`);
      setSearchResults(results);

    } catch (error) {
      console.error('Error searching IP assets:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to search IP assets. Please try again.';
      setSearchError(errorMessage);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    searchIPAssetById(searchQuery)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setSearchError(null)
    setHasSearched(false) // Reset search state
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

  // Determine what to display: search results or regular assets
  const displayAssets = hasSearched && searchQuery.trim() ? searchResults : ipAssets
  const isSearchMode = hasSearched && searchQuery.trim().length > 0

  return (
    <div className="w-full">
      {/* Global Stats Container */}
      <GlobalStats />

      {/* Marketplace Assets Section */}
      <div className="space-y-6 mt-20">
        {/* Header with Search Bar and page info */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          {/* Left side - Title and Search */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 flex-1">
            <h2 className="text-xl font-light text-white">Global IP Assets Marketplace</h2>
            
            {/* Enhanced Smart Search Bar */}
            <div className="flex-1 max-w-lg">
              <form onSubmit={handleSearchSubmit} className="relative group">
                <div className="relative">
                  {/* Main Input Container */}
                  <div className="relative overflow-hidden rounded-xl bg-zinc-800/30 backdrop-blur-sm border border-zinc-800/50 transition-all duration-300 group-focus-within:border-zinc-600/50 group-focus-within:bg-zinc-900/50">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by IP ID (0x...)..."
                      className="w-full px-4 py-3 pl-11 pr-24 bg-transparent text-white placeholder-zinc-500 focus:outline-none text-sm font-light tracking-wide"
                    />
                    
                    {/* Search Icon */}
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors duration-200 group-focus-within:text-zinc-300">
                      <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    
                    {/* Right Side Actions */}
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                      {/* Clear Button */}
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={clearSearch}
                          className="p-1.5 text-zinc-500 hover:text-zinc-400 hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                          title="Clear search"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                      
                      {/* Smart Search Button */}
                      <button
                        type="submit"
                        disabled={!searchQuery.trim() || searchLoading}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 disabled:cursor-not-allowed border ${
                          isValidIPIdLength(searchQuery) && isValidIPIdFormat(searchQuery)
                            ? 'bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 hover:text-pink-300 border-pink-500/30 hover:border-pink-400/40'
                            : isValidIPIdLength(searchQuery) && !isValidIPIdFormat(searchQuery)
                            ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 hover:text-amber-300 border-amber-500/30 hover:border-amber-400/40'
                            : 'bg-zinc-800/50 hover:bg-zinc-700/60 disabled:bg-zinc-800/20 text-zinc-400 hover:text-zinc-300 disabled:text-zinc-500 border-zinc-700/30 hover:border-zinc-600/30'
                        }`}
                      >
                        {searchLoading ? (
                          <div className={`w-3 h-3 border rounded-full animate-spin ${
                            isValidIPIdLength(searchQuery) && isValidIPIdFormat(searchQuery)
                              ? 'border-pink-500 border-t-transparent'
                              : 'border-zinc-500 border-t-transparent'
                          }`}></div>
                        ) : (
                          <span>Search</span>
                        )}
                      </button>
                    </div>
                    
                    {/* Smart focus glow */}
                    <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 pointer-events-none ${
                      isValidIPIdLength(searchQuery) && isValidIPIdFormat(searchQuery)
                        ? 'bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-focus-within:opacity-100'
                        : 'bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 opacity-0 group-focus-within:opacity-100'
                    }`}></div>
                  </div>
                </div>
                
                {/* Smart Search Validation Helper */}
                {searchQuery.trim() && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-10">
                    {isValidIPIdLength(searchQuery) && isValidIPIdFormat(searchQuery) ? (
                      <div className="p-3 bg-zinc-900/95 backdrop-blur-xl border border-green-500/20 rounded-lg text-xs text-green-400 shadow-xl">
                        <div className="flex items-start space-x-2">
                          <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <div>
                            <p className="font-medium mb-1">Valid IP ID format</p>
                            <p className="text-zinc-500">Ready to search - press Enter or click Search</p>
                          </div>
                        </div>
                      </div>
                    ) : isValidIPIdLength(searchQuery) && !isValidIPIdFormat(searchQuery) ? (
                      <div className="p-3 bg-zinc-900/95 backdrop-blur-xl border border-amber-500/20 rounded-lg text-xs text-amber-400 shadow-xl">
                        <div className="flex items-start space-x-2">
                          <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <div>
                            <p className="font-medium mb-1">Invalid characters in IP ID</p>
                            <p className="text-zinc-500">Must contain only hexadecimal characters (0-9, a-f)</p>
                          </div>
                        </div>
                      </div>
                    ) : searchQuery.trim().length > 0 && searchQuery.trim().length < 42 ? (
                      <div className="p-3 bg-zinc-900/95 backdrop-blur-xl border border-blue-500/20 rounded-lg text-xs text-blue-400 shadow-xl">
                        <div className="flex items-start space-x-2">
                          <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="font-medium mb-1">Continue typing...</p>
                            <p className="text-zinc-500">{searchQuery.trim().length}/42 characters (IP ID: 0x + 40 hex chars)</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-zinc-900/95 backdrop-blur-xl border border-red-500/20 rounded-lg text-xs text-red-400 shadow-xl">
                        <div className="flex items-start space-x-2">
                          <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <div>
                            <p className="font-medium mb-1">Invalid IP ID format</p>
                            <p className="text-zinc-500">Enter a valid Ethereum address (0x + 40 hex characters)</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>
          </div>
          
          {/* Right side - Page info and controls */}
          <div className="flex items-center space-x-4">
            {!isSearchMode && (
              <div className="text-sm text-zinc-500 font-light">
                Page {pagination.currentPage}
                {pagination.totalPages && ` of ${pagination.totalPages}`}
                {ipAssets.length > 0 && (
                  <span className="text-zinc-600 ml-2">• {ipAssets.length} assets</span>
                )}
              </div>
            )}
            
            {isSearchMode && (
              <div className="text-sm font-light">
                {searchResults.length > 0 ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-400">{searchResults.length}</span>
                    <span className="text-zinc-500">result{searchResults.length === 1 ? '' : 's'}</span>
                    {searchResults.length === 1 && (
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full text-xs">exact</span>
                    )}
                  </div>
                ) : (
                  <span className="text-zinc-500">No results</span>
                )}
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              {/* Clear Search Button */}
              {(searchQuery.trim() || hasSearched) && (
                <button
                  onClick={clearSearch}
                  className="px-3 py-2 bg-zinc-800/30 hover:bg-zinc-800/50 text-zinc-500 hover:text-zinc-400 rounded-lg text-xs font-medium transition-all duration-200 border border-zinc-700/20 hover:border-zinc-600/30"
                >
                  Clear
                </button>
              )}
              
              {/* Refresh Button */}
              {!isSearchMode && (
                <button
                  onClick={refreshCurrentPage}
                  disabled={loading || loadingMore}
                  className="p-2 text-zinc-500 hover:text-zinc-400 hover:bg-zinc-800/30 rounded-lg transition-all duration-200 disabled:opacity-30"
                  title="Refresh current page"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search Loading State */}
        {searchLoading && (
          <div className="flex items-center justify-center h-24">
            <div className="flex items-center space-x-3">
              <div className={`w-5 h-5 border-2 rounded-full animate-spin ${
                isValidIPIdLength(searchQuery) && isValidIPIdFormat(searchQuery)
                  ? 'border-pink-600 border-t-pink-400'
                  : 'border-zinc-600 border-t-zinc-400'
              }`}></div>
              <span className="text-zinc-500 text-sm font-light">Searching assets...</span>
            </div>
          </div>
        )}

        {/* Search Error */}
        {searchError && hasSearched && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-red-400 text-sm font-medium">Search failed</p>
                <p className="text-red-300/70 text-xs mt-1">{searchError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!searchLoading && (
          <>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin"></div>
                  <span className="text-zinc-500 font-light">Loading marketplace...</span>
                </div>
              </div>
            ) : (
              <>
                {/* IP Assets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[600px]">
                  {displayAssets.length === 0 ? (
                    <div className="col-span-full text-center py-16">
                      <div className="bg-zinc-900/20 backdrop-blur-sm border border-zinc-800/30 rounded-2xl p-8">
                        {isSearchMode && hasSearched ? (
                          <>
                            <div className="w-16 h-16 bg-zinc-800/30 rounded-full flex items-center justify-center mx-auto mb-4">
                              <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            </div>
                            <p className="text-zinc-400 mb-2 font-light">No matching assets found</p>
                            <p className="text-sm text-zinc-600 mb-6">
                              No assets match "{searchQuery.slice(0, 20)}{searchQuery.length > 20 ? '...' : ''}"
                            </p>
                            <div className="space-y-2 text-xs text-zinc-700 mb-6">
                              <p>• Verify the IP ID is correct</p>
                              <p>• Ensure it starts with 0x</p>
                              <p>• Try a different search term</p>
                            </div>
                            <button
                              onClick={clearSearch}
                              className="px-4 py-2 bg-zinc-800/30 hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-300 rounded-lg text-sm font-medium transition-all duration-200 border border-zinc-700/20"
                            >
                              Clear Search
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="w-16 h-16 bg-zinc-800/30 rounded-full flex items-center justify-center mx-auto mb-4">
                              <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 011-1h1m0 0V3a2 2 0 011-1h1" />
                              </svg>
                            </div>
                            <p className="text-zinc-400 mb-2 font-light">No assets available</p>
                            <p className="text-sm text-zinc-600">Global IP assets will appear here</p>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    displayAssets.map((asset, index) => (
                      <IPCardMarketplace 
                        key={`${isSearchMode ? 'search' : 'regular'}-${asset.id}`} 
                        asset={asset} 
                        cardIndex={index}
                      />
                    ))
                  )}
                </div>

                {/* Pagination Controls - Only show when not in search mode */}
                {!isSearchMode && (ipAssets.length > 0 || pagination.hasPrevious) && (
                  <div className="flex justify-center items-center space-x-4 pt-8">
                    <div className="flex items-center space-x-2">
                      {/* First Page Button */}
                      <button
                        onClick={() => fetchGlobalIPAssets('initial')}
                        disabled={pagination.currentPage === 1 || loadingMore}
                        className="px-3 py-2 bg-zinc-900/30 hover:bg-zinc-800/50 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-500 hover:text-zinc-400 rounded-lg transition-all duration-200 border border-zinc-800/30 hover:border-zinc-700/30 text-sm"
                        title="First Page"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                      </button>

                      {/* Previous Page Button */}
                      <button
                        onClick={goToPreviousPage}
                        disabled={!pagination.hasPrevious || loadingMore}
                        className="px-4 py-2 bg-zinc-900/30 hover:bg-zinc-800/50 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-500 hover:text-zinc-400 rounded-lg transition-all duration-200 border border-zinc-800/30 hover:border-zinc-700/30 flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="text-sm font-light">Previous</span>
                      </button>
                    </div>
                    
                    {/* Page Info */}
                    <div className="flex items-center space-x-3 px-4">
                      <span className="text-sm text-zinc-500 font-light">
                        Page {pagination.currentPage}
                        {pagination.totalPages && ` of ${pagination.totalPages}`}
                      </span>
                      {loadingMore && (
                        <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin"></div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Next Page Button */}
                      <button
                        onClick={goToNextPage}
                        disabled={!pagination.hasNext || loadingMore}
                        className="px-4 py-2 bg-zinc-900/30 hover:bg-zinc-800/50 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-500 hover:text-zinc-400 rounded-lg transition-all duration-200 border border-zinc-800/30 hover:border-zinc-700/30 flex items-center space-x-2"
                      >
                        <span className="text-sm font-light">Next</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Loading overlay for pagination */}
        {loadingMore && (
          <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40 flex items-center justify-center">
            <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/50 rounded-xl p-6 shadow-2xl">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin"></div>
                <span className="text-zinc-400 font-light">Loading next page...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export { MarketplaceTabs }
"use client";

import React, { useState, useEffect } from 'react';
import { MarketplaceAssetDetails } from '../marketplace/marketplaceAssetDetails';
import { BuyRTModal } from './buyRTModal';

interface ListedRoyaltyToken {
  id: string;
  ipId: string;
  royaltyVaultAddress: string;
  nftAsset: {
    id: string;
    name: string;
    image_url?: string;
    token: {
      address: string;
      name: string;
      symbol: string;
    };
  };
  percentageToSell: number;
  pricePerTokenIP: number; // Updated to IP tokens
  listedAt: string;
  status: 'active' | 'sold' | 'cancelled';
}

interface ListedRTProps {
  filter: string;
}

// Mock IPAsset interface to match MarketplaceAssetDetails expectations
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

export const ListedRT: React.FC<ListedRTProps> = ({ filter }) => {
  const [listings, setListings] = useState<ListedRoyaltyToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAssetDetails, setSelectedAssetDetails] = useState<IPAsset | null>(null);
  const [isAssetDetailsOpen, setIsAssetDetailsOpen] = useState(false);
  const [selectedListingForPurchase, setSelectedListingForPurchase] = useState<ListedRoyaltyToken | null>(null);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);

  // IP token exchange rate
  const IP_TOKEN_USD_RATE = 4.15;

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = () => {
    setLoading(true);
    try {
      // Get listings from localStorage (in a real app, this would be an API call)
      const storedListings = JSON.parse(localStorage.getItem('royaltyTokenListings') || '[]');
      
      // Filter active listings and sanitize numeric values
      const activeListings = storedListings
        .filter((listing: ListedRoyaltyToken) => listing.status === 'active')
        .map((listing: ListedRoyaltyToken) => ({
          ...listing,
          // Ensure numeric values are properly converted
          percentageToSell: Number(listing.percentageToSell) || 0,
          pricePerTokenIP: Number(listing.pricePerTokenIP) || 0
        }))
        .filter((listing: ListedRoyaltyToken) => 
          // Filter out listings with invalid numeric values
          listing.percentageToSell > 0 && listing.pricePerTokenIP > 0
        );
      
      setListings(activeListings);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to safely format numbers
  const safeNumber = (value: any): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  // Helper function to safely format display values
  const formatPrice = (value: any, decimals: number = 2): string => {
    const num = safeNumber(value);
    return num.toFixed(decimals);
  };

  const handleBuy = async (listing: ListedRoyaltyToken) => {
    setSelectedListingForPurchase(listing);
    setIsBuyModalOpen(true);
  };

  const handlePurchaseComplete = (txHash: string) => {
    console.log('Purchase completed with txHash:', txHash);
    // Refresh listings to remove the sold item
    fetchListings();
  };

  const handleViewDetails = async (listing: ListedRoyaltyToken) => {
    try {
      // Fetch IP Asset details from the API using the ipId
      const response = await fetch(`/api/assets/${listing.ipId}`);
      
      if (response.ok) {
        const assetData = await response.json();
        
        // Transform the API response to match IPAsset interface
        const ipAsset: IPAsset = {
          id: assetData.id || listing.ipId,
          name: listing.nftAsset.name || assetData.name || 'IP Asset',
          type: assetData.type || 'Digital Asset',
          status: assetData.status || 'Active',
          image: listing.nftAsset.image_url || assetData.image || '',
          ipId: listing.ipId,
          tokenContract: listing.nftAsset.token.address || assetData.tokenContract || '',
          tokenId: listing.nftAsset.id || assetData.tokenId || '',
          blockNumber: assetData.blockNumber || 0,
          nftMetadata: {
            name: listing.nftAsset.name || assetData.nftMetadata?.name || '',
            imageUrl: listing.nftAsset.image_url || assetData.nftMetadata?.imageUrl || '',
            tokenContract: listing.nftAsset.token.address || assetData.nftMetadata?.tokenContract || '',
            tokenId: listing.nftAsset.id || assetData.nftMetadata?.tokenId || '',
            chainId: assetData.nftMetadata?.chainId || 'story-aeneid',
            tokenUri: assetData.nftMetadata?.tokenUri || ''
          },
          blockTimestamp: assetData.blockTimestamp || new Date().getTime().toString(),
          transactionHash: assetData.transactionHash || ''
        };
        
        setSelectedAssetDetails(ipAsset);
        setIsAssetDetailsOpen(true);
      } else {
        // If API fails, create a mock asset with available data
        const mockAsset: IPAsset = {
          id: listing.ipId,
          name: listing.nftAsset.name || 'IP Asset',
          type: 'Digital Asset',
          status: 'Active',
          image: listing.nftAsset.image_url || '',
          ipId: listing.ipId,
          tokenContract: listing.nftAsset.token.address,
          tokenId: listing.nftAsset.id,
          blockNumber: 0,
          nftMetadata: {
            name: listing.nftAsset.name || '',
            imageUrl: listing.nftAsset.image_url || '',
            tokenContract: listing.nftAsset.token.address,
            tokenId: listing.nftAsset.id,
            chainId: 'story-aeneid',
            tokenUri: ''
          },
          blockTimestamp: new Date().getTime().toString(),
          transactionHash: ''
        };
        
        setSelectedAssetDetails(mockAsset);
        setIsAssetDetailsOpen(true);
      }
    } catch (error) {
      console.error('Error fetching asset details:', error);
      
      // Create a fallback asset with available data
      const fallbackAsset: IPAsset = {
        id: listing.ipId,
        name: listing.nftAsset.name || 'IP Asset',
        type: 'Digital Asset',
        status: 'Active',
        image: listing.nftAsset.image_url || '',
        ipId: listing.ipId,
        tokenContract: listing.nftAsset.token.address,
        tokenId: listing.nftAsset.id,
        blockNumber: 0,
        nftMetadata: {
          name: listing.nftAsset.name || '',
          imageUrl: listing.nftAsset.image_url || '',
          tokenContract: listing.nftAsset.token.address,
          tokenId: listing.nftAsset.id,
          chainId: 'story-aeneid',
          tokenUri: ''
        },
        blockTimestamp: new Date().getTime().toString(),
        transactionHash: ''
      };
      
      setSelectedAssetDetails(fallbackAsset);
      setIsAssetDetailsOpen(true);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  // Filter listings based on the filter prop
  const filteredListings = filter === 'royalty' ? listings : [];

  if (filter !== 'royalty') {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 9l-6 6m6 0l-6-6" />
          </svg>
        </div>
        <p className="text-gray-400 mb-2">License Token Marketplace</p>
        <p className="text-gray-500 text-sm">License token trading coming soon!</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  if (filteredListings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>
        <p className="text-gray-400 mb-2">No Royalty Tokens Listed</p>
        <p className="text-gray-500 text-sm">Be the first to list your royalty tokens for sale!</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-lg font-medium text-white">Listed Royalty Tokens</h4>
            <p className="text-sm text-zinc-400">{filteredListings.length} active listing{filteredListings.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center space-x-3">
            {/* IP Token Rate Display */}
            <div className="text-xs bg-blue-500/10 border border-blue-500/20 rounded-lg px-2 py-1">
              <span className="text-blue-300 font-medium">1 IP = $4.15 USD</span>
            </div>
            <button 
              onClick={fetchListings}
              className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-lg text-sm transition-all duration-200"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="space-y-4">
          {filteredListings.map((listing) => {
            // Safely get numeric values for this listing
            const safePercentage = safeNumber(listing.percentageToSell);
            const safePrice = safeNumber(listing.pricePerTokenIP);
            const totalPrice = safePercentage * safePrice;
            
            return (
              <div 
                key={listing.id}
                className="bg-gradient-to-r from-purple-500/5 to-pink-500/5 border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/30 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <div className="flex items-center justify-between">
                  
                  {/* Left Section - NFT Info */}
                  <div className="flex items-center space-x-4 flex-1">
                    
                    {/* NFT Image */}
                    <div className="w-16 h-16 bg-gradient-to-br from-zinc-800/50 to-zinc-700/50 rounded-xl overflow-hidden flex-shrink-0">
                      {listing.nftAsset.image_url ? (
                        <img 
                          src={listing.nftAsset.image_url} 
                          alt={listing.nftAsset.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* NFT Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-sm font-medium text-white truncate">{listing.nftAsset.name}</h3>
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">
                          {listing.nftAsset.token.symbol}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mb-2">Token #{listing.nftAsset.id}</p>
                      
                      {/* Technical Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center space-x-1">
                          <span className="text-zinc-500">IP ID:</span>
                          <button 
                            onClick={() => navigator.clipboard.writeText(listing.ipId)}
                            className="text-blue-400 hover:text-blue-300 font-mono transition-colors"
                            title="Click to copy"
                          >
                            {truncateAddress(listing.ipId)}
                          </button>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-zinc-500">Contract:</span>
                          <button 
                            onClick={() => navigator.clipboard.writeText(listing.nftAsset.token.address)}
                            className="text-blue-400 hover:text-blue-300 font-mono transition-colors"
                            title="Click to copy"
                          >
                            {truncateAddress(listing.nftAsset.token.address)}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Center Section - Royalty Details */}
                  <div className="hidden md:flex flex-col items-center space-y-2 px-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-400">{formatPrice(safePercentage)}%</p>
                      <p className="text-xs text-zinc-400">Royalty Share</p>
                    </div>
                    <div className="w-px h-8 bg-zinc-700"></div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-blue-400">{formatPrice(safePrice, 3)} IP</p>
                      <p className="text-xs text-zinc-400">Per 1%</p>
                      <p className="text-xs text-zinc-500">(${formatPrice(safePrice * IP_TOKEN_USD_RATE, 3)})</p>
                    </div>
                  </div>

                  {/* Right Section - Price & Actions */}
                  <div className="flex flex-col items-end space-y-3">
                    
                    {/* Price Info */}
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-400 ml-2">
                            {formatPrice(totalPrice, 3)} IP
                          </div>
                          <div className="text-xs text-zinc-500 mr-2">
                            (~${formatPrice(totalPrice * IP_TOKEN_USD_RATE, 2)} USD)
                          </div>
                        </div>
                        <span className="text-xs text-zinc-500">Total</span>
                      </div>
                      <p className="text-xs text-zinc-400 mr-9">
                        Listed {formatTimeAgo(listing.listedAt)}
                      </p>
                    </div>

                    {/* Mobile Royalty Info */}
                    <div className="flex md:hidden items-center space-x-4 text-xs">
                      <div className="text-center">
                        <p className="text-purple-400 font-semibold">{formatPrice(safePercentage)}%</p>
                        <p className="text-zinc-500">Share</p>
                      </div>
                      <div className="text-center">
                        <p className="text-blue-400 font-semibold">{formatPrice(safePrice, 3)} IP</p>
                        <p className="text-zinc-500">Per 1%</p>
                        <p className="text-zinc-500">${formatPrice(safePrice * IP_TOKEN_USD_RATE, 3)}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      {/* Buy Button - Updated */}
                      <button
                        onClick={() => handleBuy(listing)}
                        className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-medium text-sm transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        <span>Buy Now</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Info Bar */}
                <div className="mt-4 pt-3 border-t border-zinc-700/30">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-zinc-400">Verified IP Asset</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-zinc-400">Story Protocol</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-blue-400 font-medium">IP</span>
                        <span className="text-zinc-400">Currency</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div>
                       <button
                        onClick={() => handleViewDetails(listing)}
                        className=" text-blue-300 hover:text-blue-200 font-medium text-xs transition-all duration-200 flex items-center space-x-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>View IP Details</span>
                      </button>
                      </div>
                      <div className="flex items-center space-x-1">
                      <span className="text-zinc-500">Vault:</span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(listing.royaltyVaultAddress)}
                        className="text-blue-400 hover:text-blue-300 font-mono transition-colors"
                        title="Click to copy vault address"
                      >
                        {truncateAddress(listing.royaltyVaultAddress)}
                      </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MarketplaceAssetDetails Modal */}
      {selectedAssetDetails && (
        <MarketplaceAssetDetails
          isOpen={isAssetDetailsOpen}
          onClose={() => {
            setIsAssetDetailsOpen(false);
            setSelectedAssetDetails(null);
          }}
          asset={selectedAssetDetails}
        />
      )}

      {/* BuyRT Modal */}
      {selectedListingForPurchase && (
        <BuyRTModal
          isOpen={isBuyModalOpen}
          onClose={() => {
            setIsBuyModalOpen(false);
            setSelectedListingForPurchase(null);
          }}
          listing={selectedListingForPurchase}
          onPurchaseComplete={handlePurchaseComplete}
        />
      )}
    </>
  );
};
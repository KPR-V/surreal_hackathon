"use client";

import React, { useState, useRef } from 'react';
import { IPDetailsModal } from '../my-account/ipDetailsModal';
import { SellRTModal } from './sellRTModal';

interface NFTToken {
  address: string;
  name: string;
  symbol: string;
  type: string;
  total_supply: string;
  holders_count: string;
}

interface NFTAsset {
  id: string;
  image_url: string | null;
  media_url: string | null;
  metadata: any;
  token: NFTToken;
  token_type: string;
  value: string;
  external_app_url: string | null;
}

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
  ancestorCount: number;
  descendantCount: number;
  childrenCount: number;
  parentCount: number;
  rootCount?: number;
  rootIpIds?: string[];
  blockTimestamp?: string;
  transactionHash?: string;
  isGroup?: boolean;
  latestArbitrationPolicy?: string;
  detailsLoaded?: boolean;
}

interface NFTCardProps {
  asset: NFTAsset;
  cardIndex: number;
}

export const NFTCard: React.FC<NFTCardProps> = ({ asset, cardIndex }) => {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [ipAsset, setIpAsset] = useState<IPAsset | null>(null);
  const [currentIpId, setCurrentIpId] = useState<string>('');
  const [loadingIpDetails, setLoadingIpDetails] = useState(false);
  const sellButtonRef = useRef<HTMLButtonElement>(null); // Changed from manageButtonRef
  const cardRef = useRef<HTMLDivElement>(null);

  const truncateHash = (hash?: string) => {
    if (!hash) return 'N/A';
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleSellClick = () => { // Changed from handleManageClick
    if (sellButtonRef.current) {
      const rect = sellButtonRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      // Use the same positioning logic as MyIPCard
      const isRightSide = (cardIndex % 4) >= 2;
      
      setTooltipPosition({
        top: rect.top + scrollTop - 80, // Position above the button
        left: isRightSide ? rect.left + scrollLeft - 250 : rect.left + scrollLeft, // Shift left for right-side cards
      });
    }
    setIsTooltipOpen(!isTooltipOpen);
  };

  const handleSellRoyaltyToken = () => {
    console.log('Opening sell modal for NFT:', asset.id);
    setIsTooltipOpen(false);
    
    // If we have the IP ID from previous fetch, use it; otherwise fetch it
    if (currentIpId) {
      setIsSellModalOpen(true);
    } else {
      // Fetch IP ID first, then open sell modal
      fetchIpIdAndOpenSellModal();
    }
  };

  const fetchIpIdAndOpenSellModal = async () => {
    setLoadingIpDetails(true);
    try {
      const response = await fetch('/api/ip-assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenContractIds: [asset.token.address],
          tokenIds: [asset.id]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch IP asset details');
      }

      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        const ipData = data.data[0];
        setCurrentIpId(ipData.ipId);
        setIsSellModalOpen(true);
      } else {
        alert('This NFT is not registered as an IP Asset in Story Protocol');
      }
    } catch (error) {
      console.error('Error fetching IP asset details:', error);
      alert('Failed to fetch IP asset details');
    } finally {
      setLoadingIpDetails(false);
    }
  };

  const handleViewDetails = async () => {
    setLoadingIpDetails(true);
    try {
      // Fetch IP asset details using token contract and token ID
      const response = await fetch('/api/ip-assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenContractIds: [asset.token.address],
          tokenIds: [asset.id]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch IP asset details');
      }

      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        const ipData = data.data[0];
        setCurrentIpId(ipData.ipId); // Store IP ID for sell modal
        
        // Convert API response to IPAsset format
        const convertedIpAsset: IPAsset = {
          id: ipData.id,
          name: ipData.nftMetadata?.name || getName(),
          type: "IP Asset",
          status: "Active",
          pilAttached: true,
          revenue: "$0",
          derivatives: ipData.childrenCount || 0,
          image: ipData.nftMetadata?.imageUrl || getImageUrl() || '',
          ipId: ipData.ipId,
          tokenContract: asset.token.address,
          tokenId: asset.id,
          blockNumber: ipData.blockNumber,
          nftMetadata: {
            name: ipData.nftMetadata?.name || getName(),
            imageUrl: ipData.nftMetadata?.imageUrl || getImageUrl() || '',
            tokenContract: asset.token.address,
            tokenId: asset.id,
            chainId: ipData.nftMetadata?.chainId || 'story-aeneid',
            tokenUri: ipData.nftMetadata?.tokenUri
          },
          ancestorCount: ipData.ancestorCount || 0,
          descendantCount: ipData.descendantCount || 0,
          childrenCount: ipData.childrenCount || 0,
          parentCount: ipData.parentCount || 0,
          rootCount: ipData.rootCount,
          rootIpIds: ipData.rootIpIds,
          blockTimestamp: ipData.blockTimestamp,
          transactionHash: ipData.transactionHash,
          isGroup: ipData.isGroup,
          latestArbitrationPolicy: ipData.latestArbitrationPolicy,
          detailsLoaded: true
        };

        setIpAsset(convertedIpAsset);
        setIsModalOpen(true);
      } else {
        // If no IP asset found, show a message or create a basic asset for viewing
        alert('This NFT is not registered as an IP Asset in Story Protocol');
      }
    } catch (error) {
      console.error('Error fetching IP asset details:', error);
      alert('Failed to fetch IP asset details');
    } finally {
      setLoadingIpDetails(false);
    }
  };

  const getImageUrl = () => {
    if (asset.image_url) return asset.image_url;
    if (asset.media_url) return asset.media_url;
    if (asset.metadata?.image) return asset.metadata.image;
    return null;
  };

  const getName = () => {
    if (asset.metadata?.name) return asset.metadata.name;
    return `${asset.token.name} #${asset.id}`;
  };

  const getDescription = () => {
    if (asset.metadata?.description) return asset.metadata.description;
    return `${asset.token.symbol} Token`;
  };

  return (
    <>
      <div ref={cardRef} className="relative group">
        <div className="relative bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/20 rounded-2xl overflow-hidden hover:border-zinc-600/30 transition-all duration-300 shadow-xl hover:shadow-2xl">
          {/* Image */}
          <div className="h-40 bg-gradient-to-br from-zinc-800/50 to-zinc-700/50 flex items-center justify-center relative overflow-hidden">
            {getImageUrl() ? (
              <img 
                src={getImageUrl()!} 
                alt={getName()}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`${getImageUrl() ? 'hidden' : ''} flex items-center justify-center w-full h-full`}>
              <svg className="w-12 h-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            
            {/* Token Type Badge */}
            <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg">
              <span className="text-xs text-zinc-300 font-medium">{asset.token_type}</span>
            </div>

            {/* Royalty Badge */}
            <div className="absolute top-3 right-3 px-2 py-1 bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 rounded-lg">
              <span className="text-xs text-blue-300 font-medium">Royalty</span>
            </div>
          </div>

          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-light text-white group-hover:text-blue-300 transition-colors duration-300 truncate">
                  {getName()}
                </h3>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs text-zinc-500">Token ID:</span>
                  <button 
                    onClick={() => copyToClipboard(asset.id)}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                    title="Click to copy"
                  >
                    #{asset.id}
                  </button>
                </div>
              </div>
              
              <div className="px-3 py-1 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                Available
              </div>
            </div>

            {/* Contract Info */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                  <span className="text-xs text-zinc-400">
                    {asset.token.symbol}
                  </span>
                </div>
              </div>
              
              <span className="text-xs text-zinc-500">
                Supply: {asset.token.total_supply}
              </span>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button 
                onClick={handleViewDetails}
                disabled={loadingIpDetails}
                className="flex-1 px-3 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-300 rounded-lg text-xs font-medium transition-all duration-200 border border-zinc-700/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
              >
                {loadingIpDetails ? (
                  <>
                    <div className="w-3 h-3 border border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  <span>View Details</span>
                )}
              </button>
              
              {/* Sell Button - Updated ref and onClick */}
              <button 
                ref={sellButtonRef}
                onClick={handleSellClick}
                className="px-3 py-2 bg-gradient-to-r from-blue-500/10 to-pink-500/10 hover:from-blue-500/20 hover:to-pink-500/20 text-blue-400 rounded-lg text-xs font-medium transition-all duration-200 border border-blue-500/20 flex items-center space-x-1"
              >
                <span>Sell</span>
                <svg 
                  className={`w-3 h-3 transition-transform duration-200 ${
                    isTooltipOpen ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip for Sell Option - Now positioned like MyIPCard tooltip */}
      {isTooltipOpen && (
        <>
          {/* Click outside to close tooltip */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsTooltipOpen(false)}
          ></div>

          {/* Tooltip positioned absolutely */}
          <div 
            className="absolute z-50 w-64"
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left,
            }}
          >
            <div className="bg-zinc-800/95 backdrop-blur-xl border border-zinc-700/30 rounded-xl p-3 shadow-2xl">
              <button
                onClick={handleSellRoyaltyToken}
                disabled={loadingIpDetails}
                className="w-full p-3 bg-zinc-700/40 hover:bg-zinc-600/40 border border-zinc-600/20 hover:border-zinc-500/30 rounded-lg transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                    {loadingIpDetails ? (
                      <div className="w-4 h-4 border border-green-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white group-hover:text-green-300 transition-colors">
                      {loadingIpDetails ? 'Loading...' : 'Sell Royalty Token'}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {loadingIpDetails ? 'Fetching IP details...' : 'List this NFT for sale in the marketplace'}
                    </p>
                  </div>
                </div>
              </button>
            </div>
            
            {/* Dynamic Tooltip Arrow based on position */}
            <div 
              className={`absolute w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-700/30 ${
                (cardIndex % 4) >= 2 
                  ? 'top-full right-6' // Arrow on right for left-positioned tooltips
                  : 'top-full left-4'  // Arrow on left for right-positioned tooltips
              }`}
            ></div>
          </div>
        </>
      )}

      {/* IP Details Modal - Centered in viewport like MyIPCard */}
      {isModalOpen && ipAsset && (
        <IPDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          asset={ipAsset}
        />
      )}

      {/* Sell RT Modal - Centered in viewport like UpdateMetadataModal */}
      {isSellModalOpen && currentIpId && (
        <SellRTModal
          isOpen={isSellModalOpen}
          onClose={() => setIsSellModalOpen(false)}
          nftAsset={{
            id: asset.id,
            name: getName(),
            image_url: getImageUrl(),
            token: asset.token
          }}
          ipId={currentIpId}
          onList={(data) => {
            console.log('Royalty tokens listed:', data);
            // Optionally trigger a refresh of listings
          }}
        />
      )}
    </>
  );
};
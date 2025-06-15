"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MetadataService } from '../../../lib/services/metadataService';
import { SellRTModal } from './sellRTModal';
import { IPDetailsModal } from '../my-account/ipDetailsModal';

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

// Update IPAsset interface to match IPDetailsModal requirements
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
  ancestorCount: number;        // Changed from number | undefined to number
  descendantCount: number;      // Changed from number | undefined to number
  childrenCount: number;        // Changed from number | undefined to number
  parentCount: number;          // Changed from number | undefined to number
  rootCount?: number;
  rootIpIds?: string[];
  blockTimestamp?: string;
  transactionHash?: string;
  isGroup?: boolean;
  latestArbitrationPolicy?: string;
  detailsLoaded?: boolean;
}

interface EnhancedMetadata {
  loading: boolean;
  nftImage?: string;
  nftName?: string;
  nftDescription?: string;
  ipTitle?: string;
  ipDescription?: string;
  animationUrl?: string;
  error?: string;
}

interface PILStatus {
  hasPIL: boolean;
  licenseCount: number;
  loading: boolean;
  error?: string;
}

interface NFTCardProps {
  asset: NFTAsset;
  cardIndex: number;
}

export const NFTCard: React.FC<NFTCardProps> = ({ asset, cardIndex }) => {
  const [ipAsset, setIpAsset] = useState<IPAsset | null>(null);
  const [isRegisteredIP, setIsRegisteredIP] = useState(false);
  const [enhancedMetadata, setEnhancedMetadata] = useState<EnhancedMetadata>({ loading: true });
  const [pilStatus, setPilStatus] = useState<PILStatus>({ hasPIL: false, licenseCount: 0, loading: true });
  const [isSellRTModalOpen, setIsSellRTModalOpen] = useState(false);
  const [isIPDetailsModalOpen, setIsIPDetailsModalOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    checkIPRegistration();
  }, [asset]);

  const checkIPRegistration = async () => {
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

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          const ipData = data.data[0];
          setIsRegisteredIP(true);
          
          // Create IP asset object with guaranteed number values
          const convertedIpAsset: IPAsset = {
            id: ipData.id,
            name: ipData.nftMetadata?.name || getName(),
            type: 'Digital Asset',
            status: 'Active',
            pilAttached: false,
            revenue: '0.0',
            derivatives: ipData.descendantCount || 0,
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
            // Ensure all count properties are numbers, not undefined
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
          
          // Fetch enhanced metadata and PIL status for registered IPs
          if (ipData.ipId) {
            fetchEnhancedMetadata(ipData.ipId);
            fetchPILStatus(ipData.ipId);
          }
        }
      }
    } catch (error) {
      console.error('Error checking IP registration:', error);
    }
  };

  // Fetch enhanced metadata from IP asset metadata and NFT token URI
  const fetchEnhancedMetadata = async (ipId: string) => {
    try {
      setEnhancedMetadata(prev => ({ ...prev, loading: true }));

      const { ipMetadata, ipAssetData, nftMetadata } = await MetadataService.getCompleteAssetMetadata(ipId);
      
      console.log('Enhanced metadata fetched for IP:', ipId, { ipMetadata, ipAssetData, nftMetadata });

      setEnhancedMetadata({
        loading: false,
        nftImage: MetadataService.getImageUrl(nftMetadata?.image) || undefined,
        nftName: nftMetadata?.name || undefined,
        nftDescription: nftMetadata?.description || undefined,
        ipTitle: ipAssetData?.title || undefined,
        ipDescription: ipAssetData?.description || undefined,
        animationUrl: nftMetadata?.animation_url || undefined
      });

    } catch (error) {
      console.error('Error fetching enhanced metadata:', error);
      setEnhancedMetadata({
        loading: false,
        error: 'Failed to load metadata'
      });
    }
  };

  const fetchPILStatus = async (ipId: string) => {
    try {
      setPilStatus(prev => ({ ...prev, loading: true }));
      
      // Check for license terms
      const licenseResponse = await fetch(`/api/licenses/ip/terms/${ipId}`);
      if (licenseResponse.ok) {
        const licenseData = await licenseResponse.json();
        const licenses = licenseData.data || [];
        
        setPilStatus({
          hasPIL: licenses.length > 0,
          licenseCount: licenses.length,
          loading: false
        });
      } else {
        setPilStatus({
          hasPIL: false,
          licenseCount: 0,
          loading: false,
          error: 'Failed to fetch PIL status'
        });
      }
    } catch (error) {
      console.error('Error fetching PIL status:', error);
      setPilStatus({
        hasPIL: false,
        licenseCount: 0,
        loading: false,
        error: 'Error fetching PIL status'
      });
    }
  };

  // Helper functions
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

  const truncateHash = (hash?: string) => {
    if (!hash) return 'N/A';
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Use enhanced metadata for display
  const displayName = isRegisteredIP 
    ? enhancedMetadata.nftName || enhancedMetadata.ipTitle || getName()
    : getName();
    
  const displayImage = isRegisteredIP 
    ? enhancedMetadata.nftImage || getImageUrl()
    : getImageUrl();

  // Determine media type (image or video)
  const getMediaInfo = () => {
    if (isRegisteredIP && enhancedMetadata.loading) return { type: 'loading', url: null };
    
    // Check if image field contains video
    if (displayImage && (
      displayImage.toLowerCase().includes('.mp4') ||
      displayImage.toLowerCase().includes('.webm') ||
      displayImage.toLowerCase().includes('.mov')
    )) {
      return { type: 'video', url: displayImage };
    }
    
    // Check animation_url for video (only for registered IPs)
    if (isRegisteredIP && enhancedMetadata.animationUrl && (
      enhancedMetadata.animationUrl.toLowerCase().includes('.mp4') ||
      enhancedMetadata.animationUrl.toLowerCase().includes('.webm') ||
      enhancedMetadata.animationUrl.toLowerCase().includes('.mov')
    )) {
      return { type: 'video', url: enhancedMetadata.animationUrl };
    }
    
    // Otherwise it's an image or fallback
    if (displayImage) {
      return { type: 'image', url: displayImage };
    }
    
    return { type: 'fallback', url: null };
  };

  const getPILStatusDisplay = () => {
    if (pilStatus.loading) {
      return {
        dot: 'bg-zinc-400 animate-pulse',
        text: 'Checking PIL...',
        textColor: 'text-zinc-400'
      };
    }
    
    if (pilStatus.error) {
      return {
        dot: 'bg-red-400',
        text: 'PIL Error',
        textColor: 'text-red-400'
      };
    }
    
    if (pilStatus.hasPIL) {
      return {
        dot: 'bg-green-400',
        text: `PIL Available (${pilStatus.licenseCount})`,
        textColor: 'text-green-400'
      };
    }
    
    return {
      dot: 'bg-orange-400',
      text: 'No PIL',
      textColor: 'text-orange-400'
    };
  };

  const mediaInfo = getMediaInfo();
  const pilStatusDisplay = getPILStatusDisplay();

  const handleViewDetails = async () => {
    if (isRegisteredIP && ipAsset) {
      setIsLoadingDetails(true);
      // Small delay to show loading state
      setTimeout(() => {
        setIsIPDetailsModalOpen(true);
        setIsLoadingDetails(false);
      }, 500);
    } else {
      alert('This NFT is not registered as an IP Asset in Story Protocol');
    }
  };

  const handleSellRoyaltyToken = () => {
    if (isRegisteredIP && ipAsset) {
      setIsSellRTModalOpen(true);
    } else {
      alert('This NFT must be registered as an IP Asset to sell royalty tokens');
    }
  };

  const handleSellRTClose = () => {
    setIsSellRTModalOpen(false);
  };

  const handleSellRTList = (data: any) => {
    console.log('Royalty tokens listed:', data);
    // You can add additional logic here, like refreshing the marketplace
  };

  // Prepare NFT asset data for the modal
  const nftAssetForModal = {
    id: asset.id,
    name: displayName,
    image_url: displayImage,
    token: asset.token
  };

  return (
    <>
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-blue-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-sm"></div>
        
        <div className="relative bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/20 rounded-2xl overflow-hidden hover:border-zinc-600/30 transition-all duration-300 shadow-xl hover:shadow-2xl">
          {/* Image/Video section */}
          <div className="h-40 bg-gradient-to-br from-zinc-800/50 to-zinc-700/50 flex items-center justify-center relative overflow-hidden">
            {mediaInfo.type === 'loading' ? (
              <div className="flex items-center justify-center w-full h-full">
                <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : mediaInfo.type === 'video' && mediaInfo.url ? (
              <video 
                src={mediaInfo.url}
                className="w-full h-full object-cover"
                controls
                muted
                loop
                preload="metadata"
                onError={(e) => {
                  console.error('Video failed to load:', e);
                  const target = e.target as HTMLVideoElement;
                  target.style.display = 'none';
                }}
              >
                Your browser does not support the video tag.
              </video>
            ) : mediaInfo.type === 'image' && mediaInfo.url ? (
              <img 
                src={mediaInfo.url}
                alt={displayName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <svg className="w-12 h-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            
            {/* IP Registration Badge */}
            <div className="absolute top-2 right-2">
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                isRegisteredIP 
                  ? 'bg-green-500/80 text-white' 
                  : 'bg-gray-500/80 text-white'
              }`}>
                {isRegisteredIP ? 'IP Asset' : 'NFT'}
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Header section */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-light text-white group-hover:text-blue-300 transition-colors duration-300 truncate" title={displayName}>
                  {displayName}
                </h3>
                
                {/* Show description if available for registered IPs */}
                {isRegisteredIP && (enhancedMetadata.nftDescription || enhancedMetadata.ipDescription) && (
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2" title={enhancedMetadata.nftDescription || enhancedMetadata.ipDescription}>
                    {enhancedMetadata.nftDescription || enhancedMetadata.ipDescription}
                  </p>
                )}
                
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs text-zinc-500">
                    {isRegisteredIP ? 'IP ID:' : 'Token ID:'}
                  </span>
                  <button 
                    onClick={() => copyToClipboard(isRegisteredIP && ipAsset ? ipAsset.ipId : `#${asset.id}`)}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                    title="Click to copy"
                  >
                    {isRegisteredIP && ipAsset ? truncateHash(ipAsset.ipId) : `#${asset.id}`}
                  </button>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-medium text-white">
                  {asset.value || 'Not Listed'}
                </div>
                <div className="text-xs text-zinc-400">
                  {asset.token.symbol}
                </div>
              </div>
            </div>

            {/* Status Info section */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                {/* PIL Status */}
                {isRegisteredIP ? (
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${pilStatusDisplay.dot}`}></div>
                    <span className={`text-xs ${pilStatusDisplay.textColor}`}>
                      {pilStatusDisplay.text}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-zinc-600"></div>
                    <span className="text-xs text-zinc-400">No PIL</span>
                  </div>
                )}
              </div>
              
              <span className="text-xs text-zinc-500">
                {asset.token.symbol}
              </span>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button 
                onClick={handleViewDetails}
                disabled={isLoadingDetails}
                className="flex-1 px-3 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-300 rounded-lg text-xs font-medium transition-all duration-200 border border-zinc-700/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoadingDetails ? (
                  <>
                    <div className="w-3 h-3 border border-zinc-400 border-t-transparent rounded-full animate-spin mr-1"></div>
                    Loading...
                  </>
                ) : (
                  'View Details'
                )}
              </button>
              
              <button 
                onClick={handleSellRoyaltyToken}
                disabled={!isRegisteredIP}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 border ${
                  isRegisteredIP
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-400 hover:text-purple-300 border-purple-500/20'
                    : 'bg-zinc-800/30 text-zinc-600 border-zinc-700/30 cursor-not-allowed'
                }`}
                title={isRegisteredIP ? 'Sell royalty tokens for this IP asset' : 'Only registered IP assets can sell royalty tokens'}
              >
                <div className="flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <span>Sell RT</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sell Royalty Token Modal */}
      {isRegisteredIP && ipAsset && (
        <SellRTModal
          isOpen={isSellRTModalOpen}
          onClose={handleSellRTClose}
          nftAsset={nftAssetForModal}
          ipId={ipAsset.ipId}
          onList={handleSellRTList}
        />
      )}

      {/* IP Details Modal */}
      {isRegisteredIP && ipAsset && (
        <IPDetailsModal
          isOpen={isIPDetailsModalOpen}
          onClose={() => setIsIPDetailsModalOpen(false)}
          asset={ipAsset}
        />
      )}
    </>
  );
};
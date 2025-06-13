"use client";

import React, { useState, useEffect } from 'react';
import { LicenseTokenInfoModal } from './licenseTokeninfo';

interface LicenseTokenMetadata {
  attributes: Array<{
    trait_type: string;
    value: string | number | boolean;
    max_value?: number;
  }>;
  description: string;
  external_url: string;
  image: string;
  name: string;
}

interface LicenseTokenAsset {
  id: string;
  image_url: string | null;
  media_url: string | null;
  metadata: LicenseTokenMetadata;
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
  owner: string | null;
}

interface LicenseTokenCardProps {
  asset: LicenseTokenAsset;
  cardIndex: number;
}

interface EnhancedMetadata {
  loading: boolean;
  imageUrl?: string;
  animationUrl?: string;
  error?: string;
}

export const LicenseTokenCard: React.FC<LicenseTokenCardProps> = ({ asset, cardIndex }) => {
  const [imageError, setImageError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [enhancedMetadata, setEnhancedMetadata] = useState<EnhancedMetadata>({ loading: true });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  // Enhanced image URL resolution (similar to myIPcard2.tsx)
  const getImageUrl = () => {
    // Priority order: media_url > image_url > metadata.image
    if (asset.media_url) return asset.media_url;
    if (asset.image_url) return asset.image_url;
    if (asset.metadata?.image) return asset.metadata.image;
    return null;
  };

  // Convert IPFS URLs to HTTP URLs (same as myIPcard2.tsx)
  const resolveImageUrl = (url: string): string => {
    if (!url) return url;
    
    // Handle IPFS URLs
    if (url.startsWith('ipfs://')) {
      return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    
    // Handle GitHub raw URLs
    if (url.includes('github.com') && url.includes('/blob/')) {
      return url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    }
    
    // Handle regular URLs
    if (url.startsWith('http')) {
      return url;
    }
    
    // Handle relative IPFS paths
    if (url.startsWith('Qm') || url.startsWith('baf')) {
      return `https://ipfs.io/ipfs/${url}`;
    }
    
    return url;
  };

  // Effect to resolve and validate image URL (similar to myIPcard2.tsx)
  useEffect(() => {
    const fetchEnhancedMetadata = async () => {
      try {
        setEnhancedMetadata({ loading: true });

        const originalUrl = getImageUrl();
        let resolvedImageUrl = null;
        let animationUrl = null;

        if (originalUrl) {
          resolvedImageUrl = resolveImageUrl(originalUrl);
        }

        // Check for animation_url in metadata
        if (asset.metadata?.external_url) {
          animationUrl = resolveImageUrl(asset.metadata.external_url);
        }

        setEnhancedMetadata({
          loading: false,
          imageUrl: resolvedImageUrl || undefined,
          animationUrl: animationUrl || undefined
        });

      } catch (error) {
        console.error('Error processing license token metadata:', error);
        setEnhancedMetadata({
          loading: false,
          error: 'Failed to load metadata'
        });
      }
    };

    fetchEnhancedMetadata();
  }, [asset.media_url, asset.image_url, asset.metadata?.image, asset.metadata?.external_url]);

  const getName = () => {
    return asset.metadata?.name || `${asset.token.name} #${asset.id}`;
  };

  const getDescription = () => {
    return asset.metadata?.description || 'License agreement stating the terms of a Story Protocol IPAsset';
  };

  // Extract key license attributes
  const getLicenseAttributes = () => {
    const attributes = asset.metadata?.attributes || [];
    const keyAttributes = {
      licensor: attributes.find(attr => attr.trait_type === 'Licensor')?.value as string,
      licenseTemplate: attributes.find(attr => attr.trait_type === 'License Template')?.value as string,
      licenseTermsId: attributes.find(attr => attr.trait_type === 'License Terms ID')?.value,
      commercialUse: attributes.find(attr => attr.trait_type === 'Commercial Use')?.value,
      derivativesAllowed: attributes.find(attr => attr.trait_type === 'Derivatives Allowed')?.value,
      transferable: attributes.find(attr => attr.trait_type === 'Transferable')?.value,
      revoked: attributes.find(attr => attr.trait_type === 'Revoked')?.value,
      royaltyPolicy: attributes.find(attr => attr.trait_type === 'Royalty Policy')?.value as string,
      commercialRevenueShare: attributes.find(attr => attr.trait_type === 'Commercial Revenue Share')?.value,
      expiration: attributes.find(attr => attr.trait_type === 'Expiration')?.value,
      defaultMintingFee: attributes.find(attr => attr.trait_type === 'Default Minting Fee')?.value,
    };
    return keyAttributes;
  };

  const licenseAttrs = getLicenseAttributes();

  // Check if token is burnt (no owner)
  const isBurnt = !asset.owner || asset.owner === '0x0000000000000000000000000000000000000000';

  const handleExplore = () => {
    setIsModalOpen(true);
  };

  // Get media info for display (same logic as myIPcard2.tsx)
  const getMediaInfo = () => {
    if (enhancedMetadata.loading) return { type: 'loading', url: null };
    
    // Check if image field contains video
    if (enhancedMetadata.imageUrl && (
      enhancedMetadata.imageUrl.toLowerCase().includes('.mp4') ||
      enhancedMetadata.imageUrl.toLowerCase().includes('.webm') ||
      enhancedMetadata.imageUrl.toLowerCase().includes('.mov') ||
      enhancedMetadata.imageUrl.toLowerCase().includes('.gif')
    )) {
      return { type: 'video', url: enhancedMetadata.imageUrl };
    }
    
    // Check animation_url for video
    if (enhancedMetadata.animationUrl && (
      enhancedMetadata.animationUrl.toLowerCase().includes('.mp4') ||
      enhancedMetadata.animationUrl.toLowerCase().includes('.webm') ||
      enhancedMetadata.animationUrl.toLowerCase().includes('.mov')
    )) {
      return { type: 'video', url: enhancedMetadata.animationUrl };
    }
    
    // Otherwise it's an image or fallback
    if (enhancedMetadata.imageUrl) {
      return { type: 'image', url: enhancedMetadata.imageUrl };
    }
    
    return { type: 'fallback', url: null };
  };

  const mediaInfo = getMediaInfo();

  // Debug logging
  useEffect(() => {
    console.log(`License Token #${asset.id} media info:`, {
      id: asset.id,
      media_url: asset.media_url,
      image_url: asset.image_url,
      metadata_image: asset.metadata?.image,
      enhancedMetadata,
      mediaInfo,
      imageError
    });
  }, [asset.id, asset.media_url, asset.image_url, asset.metadata?.image, enhancedMetadata, mediaInfo, imageError]);

  return (
    <>
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-green-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-sm"></div>
        
        <div className="relative bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/20 rounded-2xl overflow-hidden hover:border-zinc-600/30 transition-all duration-300 shadow-xl hover:shadow-2xl">
          {/* Image/Media section - Updated to match myIPcard2.tsx */}
          <div className="h-40 bg-gradient-to-br from-zinc-800/20 to-zinc-800/20 flex items-center justify-center relative overflow-hidden">
            {mediaInfo.type === 'loading' ? (
              <div className="flex items-center justify-center w-full h-full">
                <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
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
                  setImageError(true);
                }}
              >
                Your browser does not support the video tag.
              </video>
            ) : mediaInfo.type === 'image' && mediaInfo.url ? (
              <img 
                src={mediaInfo.url}
                alt={getName()}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Image failed to load:', mediaInfo.url);
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  setImageError(true);
                }}
                onLoad={() => {
                  setImageError(false);
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full">
                <div className="bg-purple-500/10 rounded-full p-3 mb-2 border border-purple-500/20">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.243-6.243A6 6 0 0121 9z" />
                  </svg>
                </div>
                <span className="text-xs text-purple-300">License Token</span>
                {imageError && (
                  <span className="text-xs text-red-300 mt-1">Media unavailable</span>
                )}
              </div>
            )}
            
            {/* Status badges */}
            <div className="absolute top-2 left-2 flex flex-col space-y-1">
              <div className="px-3 py-1 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {asset.token.symbol}
              </div>
              {isBurnt && (
                <span className="px-2 py-1 bg-red-500/80 text-white rounded text-xs font-medium backdrop-blur-sm">
                  Burnt
                </span>
              )}
            </div>

            {/* License Terms ID badge */}
            {licenseAttrs.licenseTermsId && (
              <div className="absolute top-2 right-2">
                <span className="px-2 py-1 bg-black/60 text-blue-300 rounded text-xs font-medium backdrop-blur-sm">
                  Terms #{licenseAttrs.licenseTermsId}
                </span>
              </div>
            )}
          </div>

          <div className="p-6">
            {/* Header section */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-light text-white group-hover:text-purple-300 transition-colors duration-300 truncate" title={getName()}>
                  {getName()}
                </h3>
                
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2" title={getDescription()}>
                  {getDescription()}
                </p>
                
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
              
              
            </div>

            {/* License Status Info */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                {/* Commercial Use Status */}
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${licenseAttrs.commercialUse ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span className="text-xs text-zinc-400">
                    {licenseAttrs.commercialUse ? 'Commercial' : 'Non-Commercial'}
                  </span>
                </div>

                {/* Derivatives Status */}
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${licenseAttrs.derivativesAllowed ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span className="text-xs text-zinc-400">
                    {licenseAttrs.derivativesAllowed ? 'Derivatives OK' : 'No Derivatives'}
                  </span>
                </div>
              </div>
              
              <span className="text-xs text-zinc-500">
                {asset.token_type}
              </span>
            </div>

            

            {/* Actions */}
            <div className="flex space-x-2">
              <button 
                onClick={handleExplore}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 text-purple-400 hover:text-purple-300 rounded-lg text-xs font-medium transition-all duration-200 border border-purple-500/20 flex items-center justify-center space-x-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>Explore</span>
              </button>
              
              <button 
                onClick={() => copyToClipboard(asset.token.address)}
                className="px-3 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-300 rounded-lg text-xs font-medium transition-all duration-200 border border-zinc-700/20 flex items-center space-x-1"
                title="Copy contract address"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* License Token Info Modal */}
      <LicenseTokenInfoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        licenseTokenId={asset.id}
        asset={asset}
      />
    </>
  );
};
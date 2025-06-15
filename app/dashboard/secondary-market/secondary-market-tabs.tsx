"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { NFTCard } from "./nftCards";
import { ListedRT } from "./listedRT";
import { LicenseTokenInfoModal } from "../my-account/licenseTokeninfo";
import { SecondaryDataCards } from "./secondary-data-cards";

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

interface LicenseTokenAsset {
  id: string;
  image_url: string | null;
  media_url: string | null;
  metadata: {
    attributes: Array<{
      trait_type: string;
      value: string | number | boolean;
      max_value?: number;
    }>;
    description: string;
    external_url: string;
    image: string;
    name: string;
  };
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

export function SecondaryMarketTabs() {
  const [activeTab, setActiveTab] = useState("listings");
  const [listingsFilter, setListingsFilter] = useState("royalty");
  const [tokensFilter, setTokensFilter] = useState("royalty");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const tabs = [
    { id: 'listings', label: 'Listings', icon: '📋' },
    { id: 'my-tokens', label: 'My Tokens', icon: '🎯' },
  ];

  // Function to trigger refresh of data cards
  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'listings': 
        return (
          <div className="space-y-8">
            {/* Data Cards for Listings Tab */}
            <SecondaryDataCards 
              filter={listingsFilter as 'royalty' | 'license'} 
              refreshTrigger={refreshTrigger}
            />
            <ListedRT filter={listingsFilter} onPurchaseComplete={triggerRefresh} />
          </div>
        );
      case 'my-tokens': 
        return <MyTokensContent filter={tokensFilter} />;
      default: 
        return (
          <div className="space-y-8">
            <SecondaryDataCards 
              filter={listingsFilter as 'royalty' | 'license'} 
              refreshTrigger={refreshTrigger}
            />
            <ListedRT filter={listingsFilter} onPurchaseComplete={triggerRefresh} />
          </div>
        );
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
                  onChange={(e) => {
                    setListingsFilter(e.target.value);
                    triggerRefresh(); // Refresh data cards when filter changes
                  }}
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

// Update ListingsContent to remove redundant data cards
const ListingsContent: React.FC<{ filter: string; onPurchaseComplete?: () => void }> = ({ filter, onPurchaseComplete }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-light text-white">Available Listings</h2>
        <div className="text-sm text-zinc-400">
          Showing {filter === "royalty" ? "Royalty Tokens" : "License Tokens"}
        </div>
      </div>
      
      <ListedRT filter={filter} onPurchaseComplete={onPurchaseComplete} />
    </div>
  );
};

// Secondary Market License Token Card Component
const SecondaryMarketLicenseTokenCard: React.FC<{
  asset: LicenseTokenAsset;
  cardIndex: number;
  onSellLicenseToken: (asset: LicenseTokenAsset) => void;
}> = ({ asset, cardIndex, onSellLicenseToken }) => {
  const [imageError, setImageError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [enhancedMetadata, setEnhancedMetadata] = useState<{
    loading: boolean;
    imageUrl?: string;
    animationUrl?: string;
    error?: string;
  }>({ loading: true });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  // Enhanced image URL resolution
  const getImageUrl = () => {
    if (asset.media_url) return asset.media_url;
    if (asset.image_url) return asset.image_url;
    if (asset.metadata?.image) return asset.metadata.image;
    return null;
  };

  // Convert IPFS URLs to HTTP URLs
  const resolveImageUrl = (url: string): string => {
    if (!url) return url;
    
    if (url.startsWith('ipfs://')) {
      return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    
    if (url.includes('github.com') && url.includes('/blob/')) {
      return url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    }
    
    if (url.startsWith('http')) {
      return url;
    }
    
    if (url.startsWith('Qm') || url.startsWith('baf')) {
      return `https://ipfs.io/ipfs/${url}`;
    }
    
    return url;
  };

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

  // Check if token is burnt
  const isBurnt = !asset.owner || asset.owner === '0x0000000000000000000000000000000000000000';

  const handleViewDetails = () => {
    setIsModalOpen(true);
  };

  const handleSellLicenseToken = () => {
    onSellLicenseToken(asset);
  };

  // Get media info for display
  const getMediaInfo = () => {
    if (enhancedMetadata.loading) return { type: 'loading', url: null };
    
    if (enhancedMetadata.imageUrl && (
      enhancedMetadata.imageUrl.toLowerCase().includes('.mp4') ||
      enhancedMetadata.imageUrl.toLowerCase().includes('.webm') ||
      enhancedMetadata.imageUrl.toLowerCase().includes('.mov') ||
      enhancedMetadata.imageUrl.toLowerCase().includes('.gif')
    )) {
      return { type: 'video', url: enhancedMetadata.imageUrl };
    }
    
    if (enhancedMetadata.animationUrl && (
      enhancedMetadata.animationUrl.toLowerCase().includes('.mp4') ||
      enhancedMetadata.animationUrl.toLowerCase().includes('.webm') ||
      enhancedMetadata.animationUrl.toLowerCase().includes('.mov')
    )) {
      return { type: 'video', url: enhancedMetadata.animationUrl };
    }
    
    if (enhancedMetadata.imageUrl) {
      return { type: 'image', url: enhancedMetadata.imageUrl };
    }
    
    return { type: 'fallback', url: null };
  };

  const mediaInfo = getMediaInfo();

  return (
    <>
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-green-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-sm"></div>
        
        <div className="relative bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/20 rounded-2xl overflow-hidden hover:border-zinc-600/30 transition-all duration-300 shadow-xl hover:shadow-2xl">
          {/* Image/Media section */}
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

            {/* Actions - Updated to match the requirement */}
            <div className="flex space-x-2">
              <button 
                onClick={handleViewDetails}
                className="flex-1 px-3 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-300 rounded-lg text-xs font-medium transition-all duration-200 border border-zinc-700/20 flex items-center justify-center space-x-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>View Details</span>
              </button>
              
              <button 
                onClick={handleSellLicenseToken}
                disabled={isBurnt}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 border flex items-center space-x-1 ${
                  isBurnt
                    ? 'bg-zinc-800/30 text-zinc-600 border-zinc-700/30 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500/20 to-blue-500/20 hover:from-green-500/30 hover:to-blue-500/30 text-green-400 hover:text-green-300 border-green-500/20'
                }`}
                title={isBurnt ? 'Cannot sell burnt license token' : 'Sell this license token'}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>Sell LT</span>
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

// My Tokens Content Component with Dynamic Wallet Address
const MyTokensContent: React.FC<{ filter: string }> = ({ filter }) => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [nfts, setNfts] = useState<NFTAsset[]>([]);
  const [licenseTokens, setLicenseTokens] = useState<LicenseTokenAsset[]>([]);
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
    if (isConnected && connectedAddress) {
      if (filter === "royalty") {
        fetchNFTs('initial');
      } else if (filter === "license") {
        fetchLicenseTokens('initial');
      }
    }
  }, [filter, isConnected, connectedAddress]);

  const fetchNFTs = async (direction: 'next' | 'previous' | 'initial' = 'initial') => {
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

      // Filter out license tokens for royalty view
      const regularNFTs = allNFTs.filter((nft: NFTAsset) => 
        nft.token.symbol !== "PILicenseToken"
      );

      // Calculate pagination
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

  const fetchLicenseTokens = async (direction: 'next' | 'previous' | 'initial' = 'initial') => {
    if (!isConnected || !connectedAddress) {
      setError('Please connect your wallet to view your license tokens');
      return;
    }

    try {
      if (direction === 'next' || direction === 'previous') {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log('Fetching license tokens for wallet:', connectedAddress);

      const response = await fetch(`/api/nfts/${connectedAddress}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch NFTs');
      }

      const data = await response.json();
      const allNFTs = data.items || [];

      // Filter for license tokens only
      const licenseTokenNFTs = allNFTs.filter((nft: any) => 
        nft.token.symbol === "PILicenseToken"
      ).map((nft: any) => ({
        ...nft,
        owner: connectedAddress // Set owner to connected address
      }));

      console.log('Filtered license tokens:', {
        totalNFTs: allNFTs.length,
        licenseTokens: licenseTokenNFTs.length,
        tokens: licenseTokenNFTs.map((token: any) => ({
          id: token.id,
          name: token.metadata?.name,
          symbol: token.token.symbol
        }))
      });

      // Calculate pagination
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
      const pageTokens = licenseTokenNFTs.slice(startIndex, endIndex);

      setLicenseTokens(pageTokens);
      setPagination({
        currentPage,
        hasNext: currentPage < totalPages,
        hasPrevious: currentPage > 1,
        totalPages
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching license tokens:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const goToNextPage = () => {
    if (pagination.hasNext && !loadingMore) {
      if (filter === "royalty") {
        fetchNFTs('next');
      } else {
        fetchLicenseTokens('next');
      }
    }
  };

  const goToPreviousPage = () => {
    if (pagination.hasPrevious && !loadingMore) {
      if (filter === "royalty") {
        fetchNFTs('previous');
      } else {
        fetchLicenseTokens('previous');
      }
    }
  };

  const refreshCurrentPage = () => {
    if (!loading && !loadingMore) {
      if (filter === "royalty") {
        fetchNFTs('initial');
      } else {
        fetchLicenseTokens('initial');
      }
    }
  };

  const handleSellLicenseToken = (asset: LicenseTokenAsset) => {
    console.log('Sell license token clicked:', asset);
    // TODO: Implement sell license token modal/functionality
    alert(`Sell License Token functionality for ${asset.metadata?.name || asset.id} will be implemented soon!`);
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
          <div className={`w-6 h-6 border-2 ${filter === "license" ? "border-purple-500" : "border-blue-500"} border-t-transparent rounded-full animate-spin`}></div>
          <span className="text-zinc-400">
            Loading your {filter === "license" ? "license tokens" : "tokens"}...
          </span>
        </div>
      </div>
    );
  }

  const currentItems = filter === "license" ? licenseTokens : nfts;
  const itemType = filter === "license" ? "license tokens" : "royalty tokens";

  return (
    <div className="space-y-6">
      {/* Header with page info, wallet address, and refresh */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-light text-white">My Tokens</h2>
          <div className="text-sm text-zinc-400">
            Page {pagination.currentPage}
            {pagination.totalPages > 0 && ` of ${pagination.totalPages}`}
            {currentItems.length > 0 && ` • ${currentItems.length} ${itemType}`}
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
          <p className="text-red-400 mb-2">Error loading {itemType}</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button 
            onClick={refreshCurrentPage}
            className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm border border-blue-500/20 transition-all duration-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[600px]">
        {currentItems.length === 0 && !error ? (
          <div className="col-span-full text-center py-16">
            <div className="bg-zinc-800/30 rounded-xl p-8">
              <svg className={`w-16 h-16 text-zinc-600 mx-auto mb-4 ${filter === "license" ? "text-purple-600" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {filter === "license" ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.243-6.243A6 6 0 0121 9z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                )}
              </svg>
              <p className="text-zinc-400 mb-2">No {itemType} found</p>
              <p className="text-sm text-zinc-500">
                No {itemType} found for wallet: {connectedAddress ? `${connectedAddress.slice(0, 8)}...${connectedAddress.slice(-6)}` : 'Unknown'}
              </p>
              
              {pagination.currentPage > 1 && (
                <button
                  onClick={refreshCurrentPage}
                  className="mt-4 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm transition-all duration-200"
                >
                  Go to First Page
                </button>
              )}
            </div>
          </div>
        ) : filter === "license" ? (
          licenseTokens.map((token, index) => (
            <SecondaryMarketLicenseTokenCard
              key={`${token.token.address}-${token.id}`}
              asset={token}
              cardIndex={index}
              onSellLicenseToken={handleSellLicenseToken}
            />
          ))
        ) : (
          nfts.map((nft, index) => (
            <NFTCard key={`${nft.token.address}-${nft.id}`} asset={nft} cardIndex={index} />
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {(currentItems.length > 0 || pagination.hasPrevious) && (
        <div className="flex justify-center items-center space-x-4 pt-8">
          <div className="flex items-center space-x-2">
            {/* First Page Button */}
            <button
              onClick={refreshCurrentPage}
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
              <div className={`w-4 h-4 border-2 ${filter === "license" ? "border-purple-400" : "border-blue-400"} border-t-transparent rounded-full animate-spin`}></div>
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
                {currentItems.length} loaded
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
              <div className={`w-6 h-6 border-2 ${filter === "license" ? "border-purple-400" : "border-blue-400"} border-t-transparent rounded-full animate-spin`}></div>
              <span className="text-white">Loading next page...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
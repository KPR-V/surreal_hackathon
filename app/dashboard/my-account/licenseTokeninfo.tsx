"use client";

import React, { useState, useEffect } from 'react';

interface LicenseTokenInfo {
  id: string;
  licensorIpId: string;
  licenseTemplate: string;
  licenseTermsId: string;
  transferable: string;
  owner: string;
  burntAt: string;
  blockNumber: string;
  blockTime: string;
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

interface LicenseTokenInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  licenseTokenId: string;
  asset: LicenseTokenAsset;
}

export const LicenseTokenInfoModal: React.FC<LicenseTokenInfoModalProps> = ({
  isOpen,
  onClose,
  licenseTokenId,
  asset
}) => {
  const [licenseInfo, setLicenseInfo] = useState<LicenseTokenInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (isOpen && licenseTokenId) {
      fetchLicenseTokenInfo();
    }
  }, [isOpen, licenseTokenId]);

  const fetchLicenseTokenInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`https://api.storyapis.com/api/v3/licenses/tokens/${licenseTokenId}`, {
        method: 'GET',
        headers: {
          'X-Api-Key': 'MhBsxkU1z9fG6TofE59KqiiWV-YlYE8Q4awlLQehF3U',
          'X-Chain': 'story-aeneid'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch license token info: ${response.status}`);
      }

      const data = await response.json();
      setLicenseInfo(data.data);
    } catch (err) {
      console.error('Error fetching license token info:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch license token info');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const truncateHash = (hash: string, length = 8) => {
    return `${hash.slice(0, length)}...${hash.slice(-length)}`;
  };

  const getImageUrl = () => {
    if (asset.media_url) return asset.media_url;
    if (asset.image_url) return asset.image_url;
    if (asset.metadata?.image) return asset.metadata.image;
    return null;
  };

  const isVideoUrl = (url: string) => {
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.gif'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  const getLicenseAttributes = () => {
    const attributes = asset.metadata?.attributes || [];
    return {
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
      commercialAttribution: attributes.find(attr => attr.trait_type === 'Commercial Attribution')?.value,
      commercialRevenueCeiling: attributes.find(attr => attr.trait_type === 'Commercial Revenue Ceiling')?.value,
      commercializerChecker: attributes.find(attr => attr.trait_type === 'Commercializer Checker')?.value as string,
      derivativesAttribution: attributes.find(attr => attr.trait_type === 'Derivatives Attribution')?.value,
      derivativesRevenueCeiling: attributes.find(attr => attr.trait_type === 'Derivatives Revenue Ceiling')?.value,
      derivativesApproval: attributes.find(attr => attr.trait_type === 'Derivatives Approval')?.value,
      derivativesReciprocal: attributes.find(attr => attr.trait_type === 'Derivatives Reciprocal')?.value,
      currency: attributes.find(attr => attr.trait_type === 'Currency')?.value as string,
      uri: attributes.find(attr => attr.trait_type === 'URI')?.value as string,
    };
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp || timestamp === '0') return 'N/A';
    try {
      const date = new Date(parseInt(timestamp) * 1000);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
      return 'Invalid date';
    }
  };

  const isBurnt = licenseInfo?.burntAt !== '0';
  const licenseAttrs = getLicenseAttributes();
  const imageUrl = getImageUrl();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative h-full flex items-center justify-center p-4">
        <div className="relative bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-6xl h-[90vh] overflow-hidden shadow-2xl flex flex-col">
          
          {/* Fixed Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-zinc-800/50 bg-zinc-950/95 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className="text-lg font-medium text-white truncate">
                    {asset.metadata?.name || `License Token #${licenseTokenId}`}
                  </h2>
                  <span className="px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-xs">
                    PIL Token
                  </span>
                  {isBurnt && (
                    <span className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-xs">
                      Burnt
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-zinc-500">Token ID:</span>
                  <button 
                    onClick={() => copyToClipboard(licenseTokenId)}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-mono"
                    title="Click to copy"
                  >
                    #{licenseTokenId}
                  </button>
                </div>
              </div>
              
              <button 
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-zinc-400">Loading license token details...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="bg-red-500/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 border border-red-500/20">
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-zinc-400 mb-2">Failed to load license details</p>
                    <p className="text-zinc-500 text-sm">{error}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Left Column - Media and Basic Info */}
                  <div className="space-y-6">
                    {/* Media Section */}
                    <div className="bg-zinc-900/40 rounded-lg overflow-hidden">
                      <div className="h-64 bg-gradient-to-br from-purple-800/20 to-blue-800/20 flex items-center justify-center relative">
                        {imageUrl && !imageError ? (
                          isVideoUrl(imageUrl) ? (
                            <video 
                              src={imageUrl}
                              className="w-full h-full object-cover"
                              controls
                              muted
                              loop
                              preload="metadata"
                              onError={() => setImageError(true)}
                            >
                              Your browser does not support the video tag.
                            </video>
                          ) : (
                            <img 
                              src={imageUrl}
                              alt={asset.metadata?.name || 'License Token'}
                              className="w-full h-full object-cover"
                              onError={() => setImageError(true)}
                            />
                          )
                        ) : (
                          <div className="flex flex-col items-center justify-center">
                            <div className="bg-purple-500/10 rounded-full p-4 mb-3 border border-purple-500/20">
                              <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.243-6.243A6 6 0 0121 9z" />
                              </svg>
                            </div>
                            <span className="text-sm text-purple-300">License Token Media</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Basic Information */}
                    <div className="bg-zinc-900/40 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-white mb-3">Basic Information</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">Description</p>
                          <p className="text-sm text-zinc-300">
                            {asset.metadata?.description || 'License agreement stating the terms of a Story Protocol IPAsset'}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-zinc-500 mb-1">Contract</p>
                            <button 
                              onClick={() => copyToClipboard(asset.token.address)}
                              className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-mono break-all cursor-pointer"
                              title="Click to copy"
                            >
                              {truncateHash(asset.token.address)}
                            </button>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-500 mb-1">Token Type</p>
                            <p className="text-xs text-zinc-300">{asset.token_type}</p>
                          </div>
                        </div>

                        {licenseInfo && (
                          <div className="grid grid-cols-1 gap-3 mt-4">
                            <div>
                              <p className="text-xs text-zinc-500 mb-1">Owner</p>
                              <button 
                                onClick={() => copyToClipboard(licenseInfo.owner)}
                                className="text-xs text-green-400 hover:text-green-300 transition-colors font-mono break-all cursor-pointer"
                                title="Click to copy owner address"
                              >
                                {truncateHash(licenseInfo.owner)}
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-zinc-500 mb-1">Block Number</p>
                                <p className="text-xs text-zinc-300">{licenseInfo.blockNumber}</p>
                              </div>
                              <div>
                                <p className="text-xs text-zinc-500 mb-1">Block Time</p>
                                <p className="text-xs text-zinc-300">{formatTimestamp(licenseInfo.blockTime)}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - License Details */}
                  <div className="space-y-6">
                    
                    {/* License Details Grid */}
                    {licenseInfo && (
                      <div className="bg-zinc-900/40 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-white mb-3">License Details</h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-zinc-500 mb-1">Licensor IP ID</p>
                            <button 
                              onClick={() => copyToClipboard(licenseInfo.licensorIpId)}
                              className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-mono break-all cursor-pointer"
                              title="Click to copy licensor IP ID"
                            >
                              {truncateHash(licenseInfo.licensorIpId, 6)}
                            </button>
                          </div>
                          
                          <div>
                            <p className="text-xs text-zinc-500 mb-1">License Template</p>
                            <button 
                              onClick={() => copyToClipboard(licenseInfo.licenseTemplate)}
                              className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-mono break-all cursor-pointer"
                              title="Click to copy license template"
                            >
                              {truncateHash(licenseInfo.licenseTemplate, 6)}
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-zinc-500 mb-1">License Terms ID</p>
                              <p className="text-xs text-zinc-300">#{licenseInfo.licenseTermsId}</p>
                            </div>
                            <div>
                              <p className="text-xs text-zinc-500 mb-1">Transferable</p>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                licenseInfo.transferable === 'true' 
                                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}>
                                {licenseInfo.transferable === 'true' ? 'Yes' : 'No'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Additional License Attributes */}
                    <div className="bg-zinc-900/40 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-white mb-3">License Terms</h3>
                      <div className="space-y-3">
                        
                        {/* Commercial Use Section */}
                        <div className="border border-zinc-700/30 rounded-lg p-3">
                          <h4 className="text-xs font-medium text-zinc-300 mb-2">Commercial Terms</h4>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-zinc-500">Commercial Use:</span>
                              <span className={`ml-2 ${licenseAttrs.commercialUse ? 'text-green-400' : 'text-red-400'}`}>
                                {licenseAttrs.commercialUse ? 'Allowed' : 'Not Allowed'}
                              </span>
                            </div>
                            <div>
                              <span className="text-zinc-500">Revenue Share:</span>
                              <span className="ml-2 text-green-400">
                                {licenseAttrs.commercialRevenueShare || 0}%
                              </span>
                            </div>
                            <div>
                              <span className="text-zinc-500">Attribution:</span>
                              <span className={`ml-2 ${licenseAttrs.commercialAttribution ? 'text-green-400' : 'text-red-400'}`}>
                                {licenseAttrs.commercialAttribution ? 'Required' : 'Not Required'}
                              </span>
                            </div>
                            <div>
                              <span className="text-zinc-500">Revenue Ceiling:</span>
                              <span className="ml-2 text-zinc-300">
                                {licenseAttrs.commercialRevenueCeiling || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Derivatives Section */}
                        <div className="border border-zinc-700/30 rounded-lg p-3">
                          <h4 className="text-xs font-medium text-zinc-300 mb-2">Derivatives Terms</h4>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-zinc-500">Derivatives:</span>
                              <span className={`ml-2 ${licenseAttrs.derivativesAllowed ? 'text-green-400' : 'text-red-400'}`}>
                                {licenseAttrs.derivativesAllowed ? 'Allowed' : 'Not Allowed'}
                              </span>
                            </div>
                            <div>
                              <span className="text-zinc-500">Attribution:</span>
                              <span className={`ml-2 ${licenseAttrs.derivativesAttribution ? 'text-green-400' : 'text-red-400'}`}>
                                {licenseAttrs.derivativesAttribution ? 'Required' : 'Not Required'}
                              </span>
                            </div>
                            <div>
                              <span className="text-zinc-500">Approval:</span>
                              <span className={`ml-2 ${licenseAttrs.derivativesApproval ? 'text-green-400' : 'text-red-400'}`}>
                                {licenseAttrs.derivativesApproval ? 'Required' : 'Not Required'}
                              </span>
                            </div>
                            <div>
                              <span className="text-zinc-500">Reciprocal:</span>
                              <span className={`ml-2 ${licenseAttrs.derivativesReciprocal ? 'text-green-400' : 'text-red-400'}`}>
                                {licenseAttrs.derivativesReciprocal ? 'Yes' : 'No'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Additional Terms */}
                        <div className="border border-zinc-700/30 rounded-lg p-3">
                          <h4 className="text-xs font-medium text-zinc-300 mb-2">Additional Terms</h4>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Expiration:</span>
                              <span className="text-zinc-300">
                                {licenseAttrs.expiration || 'Never'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Minting Fee:</span>
                              <span className="text-zinc-300">
                                {licenseAttrs.defaultMintingFee || '0'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Currency:</span>
                              <span className="text-zinc-300">
                                {licenseAttrs.currency ? truncateHash(licenseAttrs.currency) : 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Royalty Policy:</span>
                              <span className="text-zinc-300">
                                {licenseAttrs.royaltyPolicy ? truncateHash(licenseAttrs.royaltyPolicy) : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex flex-wrap gap-2 mt-4">
                          {licenseAttrs.transferable && (
                            <span className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs">
                              Transferable
                            </span>
                          )}
                          {licenseAttrs.revoked && (
                            <span className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs">
                              Revoked
                            </span>
                          )}
                          {isBurnt && (
                            <span className="px-2 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full text-xs">
                              Burnt
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(39, 39, 42, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(113, 113, 122, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(113, 113, 122, 0.7);
        }
      `}</style>
    </div>
  );
};
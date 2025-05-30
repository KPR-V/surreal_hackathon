"use client";

import React, { useState, useEffect } from 'react';
import { DisputeInfo } from './types';
import { FamilyTreeVisualization } from './familyTreeVisualization';
import { LicensingInfo } from './licensingInfo';
import { DisputeInfoComponent } from './disputeInfo';

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
  disputeInfo?: DisputeInfo;
}

interface IPAssetDetails {
  basicInfo: {
    id: string;
    name: string;
    type: string;
    status: string;
    owner: string;
    created: string;
    lastModified: string;
  };
  technicalDetails: {
    blockNumber: string;
    transactionHash: string;
    contractAddress: string;
    tokenId: string;
    chainId: string;
    metadataUri?: string;
  };
  pilInfo: {
    attached: boolean;
    licenseTemplate?: string;
    licenseTerms?: string;
    royaltyPolicy?: string;
  };
  statistics: {
    derivatives: number;
    revenue: string;
    relationships: {
      parents: number;
      children: number;
      ancestors: number;
      descendants: number;
    };
  };
}

interface IPDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: IPAsset;
}

const StoryAPIService = {
  async getFullIPDetails(ipId: string): Promise<IPAssetDetails | null> {
    try {
      console.log('Fetching full IP details for:', ipId);
      
      const response = await fetch(`/api/assets/${ipId}`);
      
      if (!response.ok) {
        console.error('Failed to fetch IP details:', response.status);
        return null;
      }
      
      const data = await response.json();
      console.log('IP details response:', data);
      
      // Transform the API response to our expected structure
      const ipData = data.data || data;
      
      return {
        basicInfo: {
          id: ipData.id || ipId,
          name: ipData.nftMetadata?.name || `IP Asset ${ipId.slice(0, 8)}`,
          type: ipData.type || 'Unknown',
          status: 'Active',
          owner: ipData.owner || 'Unknown',
          created: ipData.blockTimestamp ? new Date(parseInt(ipData.blockTimestamp) * 1000).toISOString() : 'Unknown',
          lastModified: ipData.blockTimestamp ? new Date(parseInt(ipData.blockTimestamp) * 1000).toISOString() : 'Unknown'
        },
        technicalDetails: {
          blockNumber: ipData.blockNumber || 'Unknown',
          transactionHash: ipData.transactionHash || 'Unknown',
          contractAddress: ipData.nftMetadata?.tokenContract || ipData.tokenContract || 'Unknown',
          tokenId: ipData.nftMetadata?.tokenId || ipData.tokenId || 'Unknown',
          chainId: ipData.nftMetadata?.chainId || ipData.chainId || 'story-aeneid',
          metadataUri: ipData.nftMetadata?.tokenUri
        },
        pilInfo: {
          attached: !!ipData.pilAttached,
          licenseTemplate: ipData.licenseTemplate,
          licenseTerms: ipData.licenseTerms,
          royaltyPolicy: ipData.royaltyPolicy
        },
        statistics: {
          derivatives: ipData.childrenCount || ipData.descendantCount || 0,
          revenue: ipData.revenue || '0',
          relationships: {
            parents: ipData.parentCount || 0,
            children: ipData.childrenCount || 0,
            ancestors: ipData.ancestorCount || 0,
            descendants: ipData.descendantCount || 0
          }
        }
      };
    } catch (error) {
      console.error('Error fetching IP details:', error);
      return null;
    }
  }
};

export const IPDetailsModal: React.FC<IPDetailsModalProps> = ({ isOpen, onClose, asset }) => {
  const [activeDetailTab, setActiveDetailTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [fullDetails, setFullDetails] = useState<IPAssetDetails | null>(null);

  useEffect(() => {
    if (isOpen && asset.ipId && !asset.detailsLoaded) {
      fetchFullDetails();
    }
  }, [isOpen, asset.ipId]);

  const fetchFullDetails = async () => {
    setLoading(true);
    try {
      const details = await StoryAPIService.getFullIPDetails(asset.ipId);
      setFullDetails(details);
    } catch (error) {
      console.error('Error fetching full details:', error);
    } finally {
      setLoading(false);
    }
  };

  const truncateHash = (hash: string, length = 8) => {
    return `${hash.slice(0, length)}...${hash.slice(-length)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const detailTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'family', label: 'Family' },
    { id: 'licensing', label: 'Licensing' },
    { id: 'disputes', label: 'Disputes' },
    { id: 'technical', label: 'Technical' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative h-full flex items-center justify-center p-4">
        <div className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/30 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
          
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-zinc-700/30">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className="text-xl font-medium text-white truncate">{asset.name}</h2>
                  <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-xs">
                    {asset.type}
                  </span>
                  {asset.disputeInfo?.hasDisputes && (
                    <span className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-xs">
                      {asset.disputeInfo.activeDisputes.length > 0 ? 'Dispute' : 'Past Disputes'}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-zinc-500">IP ID:</span>
                  <button 
                    onClick={() => copyToClipboard(asset.ipId)}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-mono"
                    title="Click to copy"
                  >
                    {truncateHash(asset.ipId, 8)}
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

          {/* Tab Navigation */}
          <div className="px-6 pt-4 flex-shrink-0">
            <div className="flex space-x-1 bg-zinc-800/30 rounded-lg p-1">
              {detailTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDetailTab(tab.id)}
                  className={`px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${
                    activeDetailTab === tab.id
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700/30'
                  }`}
                >
                  {tab.label}
                  {tab.id === 'disputes' && asset.disputeInfo?.activeDisputes && asset.disputeInfo.activeDisputes.length > 0 && (
                    <span className="ml-1 w-1.5 h-1.5 bg-red-400 rounded-full inline-block"></span>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-auto px-6 py-4">
            {/* Overview Tab */}
            {activeDetailTab === 'overview' && (
              <div className="space-y-4">
                {/* Asset Image and Basic Info */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* NFT Image */}
                  <div className="lg:col-span-1">
                    <div className="aspect-square bg-gradient-to-br from-zinc-800/50 to-zinc-700/50 rounded-lg overflow-hidden flex items-center justify-center">
                      {asset.nftMetadata?.imageUrl ? (
                        <img 
                          src={asset.nftMetadata.imageUrl} 
                          alt={asset.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`${asset.nftMetadata?.imageUrl ? 'hidden' : ''} flex items-center justify-center w-full h-full`}>
                        <svg className="w-16 h-16 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Asset Details */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Asset Name and Description */}
                    <div className="bg-zinc-800/30 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-white mb-2">{asset.name}</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zinc-400">Type:</span>
                          <span className="text-sm text-white">{asset.type}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zinc-400">NFT Name:</span>
                          <span className="text-sm text-white">{asset.nftMetadata?.name || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zinc-400">Chain:</span>
                          <span className="text-sm text-white">{asset.nftMetadata?.chainId || 'story-aeneid'}</span>
                        </div>
                        {asset.isGroup && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-400">Group Asset:</span>
                            <span className="px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-xs">
                              Yes
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status and Core Metrics */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-zinc-800/30 rounded-lg p-3">
                        <p className="text-xs text-zinc-500 mb-1">Status</p>
                        <div className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                          asset.status === 'Active' 
                            ? 'bg-green-500/10 text-green-400' 
                            : 'bg-yellow-500/10 text-yellow-400'
                        }`}>
                          {asset.status}
                        </div>
                      </div>
                      
                      <div className="bg-zinc-800/30 rounded-lg p-3">
                        <p className="text-xs text-zinc-500 mb-1">PIL Attached</p>
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${
                            asset.pilAttached ? 'bg-blue-400' : 'bg-zinc-600'
                          }`}></div>
                          <span className="text-xs text-white">
                            {asset.pilAttached ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Revenue and Derivatives */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <h4 className="text-sm font-medium text-blue-400">Revenue</h4>
                    </div>
                    <p className="text-xl font-bold text-white">{asset.revenue}</p>
                    <p className="text-xs text-blue-300 mt-1">Total earned from licensing</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <h4 className="text-sm font-medium text-pink-400">Derivatives</h4>
                    </div>
                    <p className="text-xl font-bold text-white">{asset.derivatives}</p>
                    <p className="text-xs text-pink-300 mt-1">Works created from this IP</p>
                  </div>
                </div>


                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-zinc-400">Loading additional details...</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Family Tree Tab */}
            {activeDetailTab === 'family' && (
              <FamilyTreeVisualization currentAsset={{
                ...asset,
                ancestorCount: asset.ancestorCount || 0,
                descendantCount: asset.descendantCount || 0,
                childrenCount: asset.childrenCount || 0,
                parentCount: asset.parentCount || 0
              }} />
            )}

            {/* Licensing Tab */}
            {activeDetailTab === 'licensing' && (
              <LicensingInfo ipId={asset.ipId} />
            )}

            {/* Disputes Tab */}
            {activeDetailTab === 'disputes' && (
              <DisputeInfoComponent ipId={asset.ipId} />
            )}

            {/* Technical Tab */}
            {activeDetailTab === 'technical' && (
              <div className="space-y-4">
                <div className="bg-zinc-800/30 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-white mb-3">Technical Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-zinc-500">Block Number:</span>
                      <p className="text-sm text-white font-mono">{asset.blockNumber}</p>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-500">Token ID:</span>
                      <p className="text-sm text-white font-mono">{asset.tokenId}</p>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-500">Contract:</span>
                      <button 
                        onClick={() => copyToClipboard(asset.tokenContract)}
                        className="block text-sm text-blue-400 hover:text-blue-300 transition-colors font-mono"
                        title="Click to copy"
                      >
                        {truncateHash(asset.tokenContract)}
                      </button>
                    </div>
                    {asset.blockTimestamp && (
                      <div>
                        <span className="text-xs text-zinc-500">Created:</span>
                        <p className="text-sm text-white">
                          {new Date(parseInt(asset.blockTimestamp) * 1000).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-zinc-800/30 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-white mb-3">NFT Metadata</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-zinc-500">Name:</span>
                      <p className="text-sm text-white">{asset.nftMetadata?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-500">Chain:</span>
                      <p className="text-sm text-white">{asset.nftMetadata?.chainId || 'story-aeneid'}</p>
                    </div>
                    {asset.nftMetadata?.tokenUri && (
                      <div className="md:col-span-2">
                        <span className="text-xs text-zinc-500">Token URI:</span>
                        <a 
                          href={asset.nftMetadata.tokenUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-sm text-blue-400 hover:text-blue-300 transition-colors break-all"
                        >
                          {asset.nftMetadata.tokenUri}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
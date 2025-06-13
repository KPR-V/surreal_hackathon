"use client";

import React, { useState, useEffect } from 'react';
import { DisputeInfo } from './types';
import { FamilyTreeVisualization } from './familyTreeVisualization';
import { LicensingInfo } from './licensingInfo';
import { MetadataService } from '../../../lib/services/metadataService';
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

interface EnhancedMetadata {
  loading: boolean;
  nftImage?: string;
  nftName?: string;
  nftDescription?: string;
  ipTitle?: string;
  ipDescription?: string;
  animationUrl?: string;
  nftAttributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  externalUrl?: string;
  backgroundColor?: string;
  error?: string;
}

interface IPDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: IPAsset;
}

const StoryAPIService = {
  async getFullIPDetails(ipId: string): Promise<IPAssetDetails | null> {
    try {
      const response = await fetch(`/api/ip-assets/${ipId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch IP details:', response.status);
        return null;
      }
      
      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error fetching full IP details:', error);
      return null;
    }
  }
};

// Add PIL status interface at the top with other interfaces
interface PILStatus {
  hasPIL: boolean;
  licenseCount: number;
  loading: boolean;
  error?: string;
}

export const IPDetailsModal: React.FC<IPDetailsModalProps> = ({ isOpen, onClose, asset }) => {
  const [activeDetailTab, setActiveDetailTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [fullDetails, setFullDetails] = useState<IPAssetDetails | null>(null);
  const [enhancedMetadata, setEnhancedMetadata] = useState<EnhancedMetadata>({ loading: true });
  const [completeMetadata, setCompleteMetadata] = useState<{
    ipMetadata: any;
    ipAssetData: any;
    nftMetadata: any;
  } | null>(null);
  
  // Add dispute info state to track disputes within the modal
  const [disputeInfo, setDisputeInfo] = useState<DisputeInfo>({
    hasDisputes: asset.disputeInfo?.hasDisputes || false,
    activeDisputes: asset.disputeInfo?.activeDisputes || [],
    resolvedDisputes: asset.disputeInfo?.resolvedDisputes || [],
    totalDisputes: asset.disputeInfo?.totalDisputes || 0,
    isInitiator: asset.disputeInfo?.isInitiator || false,
    isTarget: asset.disputeInfo?.isTarget || false
  });
  
  // Add PIL status state
  const [pilStatus, setPilStatus] = useState<PILStatus>({ hasPIL: false, licenseCount: 0, loading: true });

  useEffect(() => {
    if (isOpen && asset.ipId) {
      fetchFullDetails();
      fetchEnhancedMetadata();
      fetchPILStatus(asset.ipId); 
      // Add fetchDisputeInfo call here to ensure disputes are fetched when modal opens
      fetchDisputeInfo(asset.ipId);
    }
    
    // Update local dispute info when asset.disputeInfo changes
    if (asset.disputeInfo) {
      setDisputeInfo(asset.disputeInfo);
    }
  }, [isOpen, asset.ipId, asset.disputeInfo]);


  const fetchDisputeInfo = async (ipId: string) => {
    try {
      // First check if this IP is a target of a dispute
      const response = await fetch('/api/disputes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          options: {
            where: {
              targetIpId: ipId
            }
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dispute data');
      }
      
      const data = await response.json();
      const disputes = data.data || [];
      
      // Also check if this IP initiated any disputes
      const initiatedResponse = await fetch('/api/disputes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          options: {
            where: {
              initiator: ipId
            }
          }
        })
      });
      
      if (!initiatedResponse.ok) {
        throw new Error('Failed to fetch initiated dispute data');
      }
      
      const initiatedData = await initiatedResponse.json();
      const initiatedDisputes = initiatedData.data || [];
      
      // Combine both types of disputes
      const allDisputes = [...disputes, ...initiatedDisputes];
      
      // Separate active and resolved disputes
      const activeDisputes = allDisputes.filter(dispute => dispute.status === 'ACTIVE' || dispute.status === 'PENDING');
      const resolvedDisputes = allDisputes.filter(dispute => dispute.status === 'RESOLVED' || dispute.status === 'DISMISSED');
      
      setDisputeInfo({
        hasDisputes: allDisputes.length > 0,
        activeDisputes: activeDisputes,
        resolvedDisputes: resolvedDisputes,
        totalDisputes: allDisputes.length,
        isInitiator: initiatedDisputes.length > 0,
        isTarget: disputes.length > 0
      });
    } catch (error) {
      console.error('Error fetching dispute data in modal:', error);
      // Don't reset dispute info on error to keep any existing data
    }
  };


  const fetchEnhancedMetadata = async () => {
    try {
      setEnhancedMetadata(prev => ({ ...prev, loading: true }));

      const metadata = await MetadataService.getCompleteAssetMetadata(asset.ipId);
      
      // Ensure creators is always an array or null
      if (metadata?.ipAssetData?.creators) {
        if (!Array.isArray(metadata.ipAssetData.creators)) {
          metadata.ipAssetData.creators = [metadata.ipAssetData.creators];
        }
        
        metadata.ipAssetData.creators = metadata.ipAssetData.creators.map((creator: any) => {
          if (typeof creator === 'string') {
            return { name: creator, address: '0x0000000000000000000000000000000000000000' };
          }
          if (typeof creator === 'object' && creator !== null) {
            return {
              name: creator.name || creator.email || creator.uuid || 'Anonymous',
              address: creator.address || '0x0000000000000000000000000000000000000000'
            };
          }
          return { name: 'Anonymous Creator', address: '0x0000000000000000000000000000000000000000' };
        });
      }

      setCompleteMetadata(metadata);
      setEnhancedMetadata({
        loading: false,
        nftImage: MetadataService.getImageUrl(metadata?.nftMetadata?.image) || asset.nftMetadata?.imageUrl,
        nftName: metadata?.nftMetadata?.name || undefined,
        nftDescription: metadata?.nftMetadata?.description || undefined,
        ipTitle: metadata?.ipAssetData?.title || undefined,
        ipDescription: metadata?.ipAssetData?.description || undefined,
        animationUrl: metadata?.nftMetadata?.animation_url || undefined,
        nftAttributes: metadata?.nftMetadata?.attributes || undefined,
        externalUrl: metadata?.nftMetadata?.external_url || undefined,
        backgroundColor: metadata?.nftMetadata?.background_color || undefined
      });

    } catch (error) {
      console.error('Error fetching enhanced metadata:', error);
      setEnhancedMetadata({
        loading: false,
        error: 'Failed to load metadata',
        nftImage: asset.nftMetadata?.imageUrl
      });
    }
  };

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

  // Add the fetchPILStatus function
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

  // Add the getPILStatusDisplay function
  const getPILStatusDisplay = () => {
    if (pilStatus.loading) {
      return {
        color: 'text-zinc-400',
        bgColor: 'bg-zinc-500/10',
        borderColor: 'border-zinc-500/20',
        text: 'Checking PIL...'
      };
    }
    
    if (pilStatus.error) {
      return {
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
        text: 'PIL Error'
      };
    }
    
    if (pilStatus.hasPIL) {
      return {
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        text: `PIL Available (${pilStatus.licenseCount})`
      };
    }
    
    return {
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      text: 'No PIL'
    };
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

  // Use enhanced metadata for display
  const displayName = enhancedMetadata.nftName || enhancedMetadata.ipTitle || asset.name || 'Unnamed Asset';
  const displayImage = enhancedMetadata.nftImage || asset.nftMetadata?.imageUrl;
  const displayDescription = enhancedMetadata.nftDescription || enhancedMetadata.ipDescription;
  const pilStatusDisplay = getPILStatusDisplay(); // Add this line

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative h-full flex items-center justify-center p-4">
        <div className="relative bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
          
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-zinc-800/50">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className="text-lg font-medium text-white truncate">{displayName}</h2>
                  <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-xs">
                    {asset.type}
                  </span>
                  {asset.disputeInfo?.hasDisputes && (
                    <span className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-xs">
                      {asset.disputeInfo.activeDisputes.length > 0 ? 'Dispute' : 'Past Disputes'}
                    </span>
                  )}
                  <span className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded text-xs">
                    {asset.status}
                  </span>
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

          {/* Tab Navigation - Fixed height */}
          <div className="px-6 pt-3 pb-2 flex-shrink-0">
            <div className="flex space-x-1 bg-zinc-900/30 rounded-lg p-1">
              {detailTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDetailTab(tab.id)}
                  className={`px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${
                    activeDetailTab === tab.id
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/30'
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
          
          {/* Content - Scrollable area with fixed height */}
          <div className="flex-1 min-h-0 px-6 pb-4">
            {/* OVERVIEW TAB - Update the PIL status section */}
            {activeDetailTab === 'overview' && (
              <div className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800">
                <div className="space-y-4">
                  {/* Compact Main Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Left: Media + Quick Info */}
                    <div className="space-y-3">
                      {/* Media Container - Enhanced Video Support */}
                      <div className="aspect-video bg-gradient-to-br from-zinc-800/50 to-zinc-700/50 rounded-lg overflow-hidden relative group">
                        {enhancedMetadata.loading ? (
                          <div className="flex items-center justify-center w-full h-full">
                            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                            <span className="ml-2 text-zinc-400 text-sm">Loading...</span>
                          </div>
                        ) : (() => {
                          // Check if the image field contains a video file (mp4, webm, mov)
                          const imageIsVideo = displayImage && (
                            displayImage.toLowerCase().includes('.mp4') ||
                            displayImage.toLowerCase().includes('.webm') ||
                            displayImage.toLowerCase().includes('.mov')
                          );
                          
                          // Check animation_url for video
                          const videoUrl = enhancedMetadata.animationUrl || 
                                         (completeMetadata?.nftMetadata?.external_url?.includes('.mp4') ? completeMetadata.nftMetadata.external_url : null) ||
                                         (imageIsVideo ? displayImage : null);
                          
                          if (videoUrl) {
                            return (
                              <video 
                                src={videoUrl}
                                className="w-full h-full object-cover"
                                controls
                                autoPlay
                                muted
                                loop
                                preload="metadata"
                                onError={(e) => {
                                  console.error('Video failed to load:', e);
                                  const target = e.target as HTMLVideoElement;
                                  target.style.display = 'none';
                                  const nextSibling = target.nextElementSibling as HTMLElement;
                                  if (nextSibling) {
                                    nextSibling.classList.remove('hidden');
                                  }
                                }}
                              >
                                Your browser does not support the video tag.
                              </video>
                            );
                          } else if (displayImage && !imageIsVideo) {
                            return (
                              <img 
                                src={displayImage} 
                                alt={displayName}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            );
                          } else {
                            return (
                              <div className="flex items-center justify-center w-full h-full">
                                <svg className="w-12 h-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            );
                          }
                        })()}
                        
                        {/* Media Type Indicator - Enhanced */}
                        {!enhancedMetadata.loading && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded">
                            <span className="text-xs text-white font-medium flex items-center">
                              {(() => {
                                const imageIsVideo = displayImage && (
                                  displayImage.toLowerCase().includes('.mp4') ||
                                  displayImage.toLowerCase().includes('.webm') ||
                                  displayImage.toLowerCase().includes('.mov')
                                );
                                
                                if (enhancedMetadata.animationUrl || imageIsVideo) {
                                  return (
                                    <>
                                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z"/>
                                      </svg>
                                      Video
                                    </>
                                  );
                                } else if (displayImage) {
                                  return (
                                    <>
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      Image
                                    </>
                                  );
                                } else {
                                  return 'Document';
                                }
                              })()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Quick Actions - Enhanced for video */}
                      {(displayImage || enhancedMetadata.animationUrl) && (
                        <div className="grid grid-cols-2 gap-2">
                          {enhancedMetadata.externalUrl && (
                            <a 
                              href={enhancedMetadata.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded text-xs font-medium transition-all duration-200 flex items-center justify-center"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              Original
                            </a>
                          )}
                          {completeMetadata?.ipMetadata?.nftTokenUri && (
                            <a 
                              href={completeMetadata.ipMetadata.nftTokenUri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded text-xs font-medium transition-all duration-200 flex items-center justify-center"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              Metadata
                            </a>
                          )}
                        </div>
                      )}

                      
                    </div>
                    
                    {/* Right: Asset Information - Enhanced for video */}
                    <div className="space-y-3">
                      {/* Title and Basic Info - Enhanced */}
                      <div className="bg-zinc-900/40 rounded-lg p-4">
                        <h1 className="text-lg font-bold text-white mb-2 leading-tight">{displayName}</h1>
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1 mb-3">
                          <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-xs font-medium">
                            {(() => {
                              const imageIsVideo = displayImage && (
                                displayImage.toLowerCase().includes('.mp4') ||
                                displayImage.toLowerCase().includes('.webm') ||
                                displayImage.toLowerCase().includes('.mov')
                              );
                              
                              if (enhancedMetadata.animationUrl || imageIsVideo) return 'Video NFT';
                              if (displayImage) return 'Image NFT';
                              return 'Digital Asset';
                            })()}
                          </span>
                          <span className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded text-xs font-medium">
                            {asset.status}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${pilStatusDisplay.bgColor} ${pilStatusDisplay.color} border ${pilStatusDisplay.borderColor}`}>
                             {pilStatusDisplay.text}
                          </span>
                        </div>

                        {/* Description - Compact */}
                        {displayDescription && (
                          <div className="mb-3">
                            <div className="max-h-24 overflow-y-auto bg-zinc-800/30 rounded p-2 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800">
                              <p className="text-xs text-zinc-300 leading-relaxed">
                                {displayDescription}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Creators - Compact */}
                      {(completeMetadata?.ipAssetData?.creators || completeMetadata?.nftMetadata?.properties?.creator) && (
                        <div className="bg-zinc-900/40 rounded-lg p-3">
                          <h4 className="text-sm font-medium text-white mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-1 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Creators
                          </h4>
                          <div className="space-y-2 max-h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
                            {completeMetadata?.ipAssetData?.creators && Array.isArray(completeMetadata.ipAssetData.creators) ? (
                              completeMetadata.ipAssetData.creators.slice(0, 2).map((creator: any, index: number) => (
                                <div key={index} className="flex items-center justify-between py-1 bg-zinc-800/30 rounded px-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-white truncate">
                                      {typeof creator === 'string' ? creator : 
                                       creator?.name || creator?.email || creator?.uuid || 'Anonymous Creator'}
                                    </p>
                                  </div>
                                  <span className="px-1 py-0.5 bg-yellow-500/10 text-yellow-400 rounded text-xs flex-shrink-0">
                                    {(typeof creator === 'object' && creator?.role) ? creator.role : 'Creator'}
                                  </span>
                                </div>
                              )))
                            : completeMetadata?.nftMetadata?.properties?.creator ? (
                              <div className="flex items-center justify-between py-1 bg-zinc-800/30 rounded px-2">
                                <p className="text-xs font-medium text-white truncate flex-1">
                                  {typeof completeMetadata.nftMetadata.properties.creator === 'string' ? 
                                   completeMetadata.nftMetadata.properties.creator : 
                                   'Anonymous Creator'}
                                </p>
                                <span className="px-1 py-0.5 bg-yellow-500/10 text-yellow-400 rounded text-xs flex-shrink-0">Creator</span>
                              </div>
                            ) : (
                              <div className="text-center py-2">
                                <p className="text-xs text-zinc-500">No creator information</p>
                              </div>
                            )}
                            {completeMetadata?.ipAssetData?.creators && completeMetadata.ipAssetData.creators.length > 2 && (
                              <p className="text-xs text-zinc-500 text-center">
                                +{completeMetadata.ipAssetData.creators.length - 2} more
                              </p>
                            )}
                          </div>

                          {/* Rights - Compact */}
                          {(completeMetadata?.ipAssetData?.commercialRights !== undefined || completeMetadata?.ipAssetData?.derivativeRights !== undefined) && (
                            <div className="mt-2 pt-2 border-t border-zinc-700/30">
                              <div className="grid grid-cols-2 gap-1">
                                <div className="text-center p-1 bg-zinc-800/30 rounded">
                                  <div className={`w-1.5 h-1.5 rounded-full mx-auto mb-1 ${completeMetadata?.ipAssetData?.commercialRights ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                  <p className="text-xs text-zinc-400">Commercial</p>
                                </div>
                                <div className="text-center p-1 bg-zinc-800/30 rounded">
                                  <div className={`w-1.5 h-1.5 rounded-full mx-auto mb-1 ${completeMetadata?.ipAssetData?.derivativeRights ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                  <p className="text-xs text-zinc-400">Derivatives</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                     {/* Revenue and Derivatives info in a compact view */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-3">
                          <p className="text-xs text-zinc-500 mb-1 flex items-center">
                            <svg className="w-3 h-3 mr-1 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                            Revenue
                          </p>
                          <p className="text-lg font-bold text-blue-400">{asset.revenue}</p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20 rounded-lg p-3">
                          <p className="text-xs text-zinc-500 mb-1 flex items-center">
                            <svg className="w-3 h-3 mr-1 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                            Derivatives
                          </p>
                          <p className="text-lg font-bold text-pink-400">{asset.derivatives}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Data Sources - Compact */}
                  {(completeMetadata?.ipMetadata?.nftTokenUri || completeMetadata?.ipMetadata?.metadataUri) && (
                    <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-blue-400 mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Data Sources
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {completeMetadata?.ipMetadata?.nftTokenUri && (
                          <div className="flex items-center justify-between p-2 bg-zinc-800/30 rounded">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-white">NFT Metadata</p>
                            </div>
                            <a 
                              href={completeMetadata.ipMetadata.nftTokenUri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded text-xs transition-colors"
                            >
                              View
                            </a>
                          </div>
                        )}
                        
                        {completeMetadata?.ipMetadata?.metadataUri && (
                          <div className="flex items-center justify-between p-2 bg-zinc-800/30 rounded">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-white">IP Metadata</p>
                            </div>
                            <a 
                              href={completeMetadata.ipMetadata.metadataUri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded text-xs transition-colors"
                            >
                              View
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* External Resources - Compact */}
                  {(enhancedMetadata.externalUrl || enhancedMetadata.animationUrl) && (
                    <div className="bg-zinc-900/40 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-white mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        External Links
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {enhancedMetadata.externalUrl && (
                          <a 
                            href={enhancedMetadata.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2 bg-gradient-to-r from-green-500/10 to-blue-500/10 hover:from-green-500/20 hover:to-blue-500/20 border border-green-500/20 rounded transition-all duration-200 group"
                          >
                            <p className="text-xs font-medium text-white group-hover:text-green-300 transition-colors">Website</p>
                            <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                        {enhancedMetadata.animationUrl && enhancedMetadata.animationUrl !== enhancedMetadata.externalUrl && (
                          <a 
                            href={enhancedMetadata.animationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-500/20 rounded transition-all duration-200 group"
                          >
                            <p className="text-xs font-medium text-white group-hover:text-purple-300 transition-colors">Animation</p>
                            <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* NFT Properties & Traits - if available */}
                  {enhancedMetadata.nftAttributes && Array.isArray(enhancedMetadata.nftAttributes) && enhancedMetadata.nftAttributes.length > 0 && (
                    <div className="bg-zinc-900/40 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-white mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Properties & Traits
                      </h3>
                      <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900 pr-2">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {enhancedMetadata.nftAttributes.map((attr: any, index: number) => (
                            <div key={index} className="bg-gradient-to-br from-zinc-800/40 to-zinc-700/40 rounded-lg p-3 border border-zinc-700/20">
                              <p className="text-xs text-zinc-500 mb-1 truncate" title={String(attr.trait_type || 'Property')}>
                                {String(attr.trait_type || 'Property')}
                              </p>
                              <p className="text-sm text-white font-medium truncate" title={String(attr.value || 'N/A')}>
                                {String(attr.value || 'N/A')}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {loading && (
                    <div className="flex items-center justify-center py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-zinc-400">Loading...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Family Tree Tab */}
            {activeDetailTab === 'family' && (
              <div className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800">
                <FamilyTreeVisualization currentAsset={asset} />
              </div>
            )}

            {/* Licensing Tab */}
            {activeDetailTab === 'licensing' && (
              <div className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800">
                <LicensingInfo ipId={asset.ipId} />
              </div>
            )}

            {/* Disputes Tab - Fix the condition check */}
{activeDetailTab === 'disputes' && (
  <div className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800">
    <DisputeInfoComponent ipId={asset.ipId} />
  </div>
)}

            {/* Technical Tab - Enhanced */}
            {activeDetailTab === 'technical' && (
              <div className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800">
                <div className="space-y-4">
                  <div className="bg-zinc-900/40 rounded-lg p-4">
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
                      <div>
                        <span className="text-xs text-zinc-500">Transaction:</span>
                        <button 
                          onClick={() => copyToClipboard(asset.transactionHash || '')}
                          className="block text-sm text-blue-400 hover:text-blue-300 transition-colors font-mono"
                          title="Click to copy"
                        >
                          {truncateHash(asset.transactionHash || 'N/A')}
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
                      <div>
                        <span className="text-xs text-zinc-500">Chain:</span>
                        <p className="text-sm text-white">{asset.nftMetadata?.chainId || 'story-aeneid'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Technical Information with metadata hashes */}
                  {completeMetadata?.ipMetadata && (
                    <div className="bg-zinc-900/40 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-white mb-3">Metadata Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {completeMetadata.ipMetadata.metadataHash && (
                          <div>
                            <span className="text-xs text-zinc-500">Metadata Hash:</span>
                            <button 
                              onClick={() => copyToClipboard(completeMetadata.ipMetadata.metadataHash)}
                              className="block text-sm text-blue-400 hover:text-blue-300 transition-colors font-mono"
                              title="Click to copy"
                            >
                              {truncateHash(completeMetadata.ipMetadata.metadataHash)}
                            </button>
                          </div>
                        )}
                        {completeMetadata.ipMetadata.nftMetadataHash && (
                          <div>
                            <span className="text-xs text-zinc-500">NFT Metadata Hash:</span>
                            <button 
                              onClick={() => copyToClipboard(completeMetadata.ipMetadata.nftMetadataHash)}
                              className="block text-sm text-blue-400 hover:text-blue-300 transition-colors font-mono"
                              title="Click to copy"
                            >
                              {truncateHash(completeMetadata.ipMetadata.nftMetadataHash)}
                            </button>
                          </div>
                        )}
                        {completeMetadata.ipMetadata.metadataUri && (
                          <div className="md:col-span-2">
                            <span className="text-xs text-zinc-500">IP Metadata URI:</span>
                            <a 
                              href={completeMetadata.ipMetadata.metadataUri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-sm text-blue-400 hover:text-blue-300 transition-colors break-all"
                            >
                              {completeMetadata.ipMetadata.metadataUri}
                            </a>
                          </div>
                        )}
                        {completeMetadata.ipMetadata.nftTokenUri && (
                          <div className="md:col-span-2">
                            <span className="text-xs text-zinc-500">NFT Token URI:</span>
                            <a 
                              href={completeMetadata.ipMetadata.nftTokenUri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-sm text-blue-400 hover:text-blue-300 transition-colors break-all"
                            >
                              {completeMetadata.ipMetadata.nftTokenUri}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* IP Relationships - Technical View */}
                  <div className="bg-zinc-900/40 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-white mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      IP Relationships
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-zinc-800/30 p-3 rounded">
                        <p className="text-xs text-zinc-500 mb-1">Ancestry</p>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-xs text-zinc-400">Parents:</span>
                            <span className="text-xs font-medium text-indigo-400">{asset.parentCount || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-zinc-400">Ancestors:</span>
                            <span className="text-xs font-medium text-blue-400">{asset.ancestorCount || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-zinc-400">Root Assets:</span>
                            <span className="text-xs font-medium text-purple-400">{asset.rootCount || 0}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-zinc-800/30 p-3 rounded">
                        <p className="text-xs text-zinc-500 mb-1">Derivatives</p>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-xs text-zinc-400">Children:</span>
                            <span className="text-xs font-medium text-pink-400">{asset.childrenCount || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-zinc-400">Descendants:</span>
                            <span className="text-xs font-medium text-rose-400">{asset.descendantCount || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-zinc-400">Total:</span>
                            <span className="text-xs font-medium text-purple-400">{(asset.childrenCount || 0) + (asset.descendantCount || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* NFT Properties & Traits */}
                  {enhancedMetadata.nftAttributes && Array.isArray(enhancedMetadata.nftAttributes) && enhancedMetadata.nftAttributes.length > 0 && (
                    <div className="bg-zinc-900/40 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-white mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        NFT Properties & Traits
                      </h3>
                      <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
                        <div className="grid grid-cols-2 gap-3 pr-2">
                          {enhancedMetadata.nftAttributes.map((attr: any, index: number) => (
                            <div key={index} className="bg-gradient-to-br from-zinc-800/40 to-zinc-700/40 rounded-lg p-3 border border-zinc-700/20">
                              <p className="text-xs text-zinc-500 mb-1 truncate" title={String(attr.trait_type || 'Property')}>
                                {String(attr.trait_type || 'Property')}
                              </p>
                              <p className="text-sm text-white font-medium truncate" title={String(attr.value || 'N/A')}>
                                {String(attr.value || 'N/A')}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
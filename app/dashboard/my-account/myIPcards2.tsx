"use client";

import React, { useState, useEffect, useRef } from 'react';
import { getIPRelationships, hasActiveDisputes, getIPDisputes } from './ipEdgesService';
import { DisputeInfo } from './types';
import { IPDetailsModal } from './ipDetailsModal';
import { FulfillLicenseTermsModal } from './fulfillLicenseTerms';
import { UpdateMetadataModal } from './update-metadataModal';
import { ClaimRevenueMyIPModal } from './claimRevenuemyIP';
import { ClaimRevenueChildIPModal } from './claimRevenueChildip';
import { MetadataService } from '../../../lib/services/metadataService';

// Add PIL status interface similar to ipCardMarketplace.tsx
interface PILStatus {
  hasPIL: boolean;
  licenseCount: number;
  loading: boolean;
  error?: string;
}

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
  ancestorCount?: number;
  descendantCount?: number;
  childrenCount?: number;
  parentCount?: number;
  rootCount?: number;
  rootIpIds?: string[];
  blockTimestamp?: string;
  transactionHash?: string;
  isGroup?: boolean;
  latestArbitrationPolicy?: string;
  detailsLoaded?: boolean;
  disputeInfo?: DisputeInfo;
}

interface NFTCardProps {
  asset: NFTAsset;
  cardIndex: number;
}

interface RelationshipCounts {
  parents: number;
  children: number;
}

interface ClaimedRevenueData {
  totalWipTokens: string;
  totalMerc20Tokens: string;
  totalValue: string;
  lastUpdated: number;
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

export const NFTCard: React.FC<NFTCardProps> = ({ asset, cardIndex }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [isFulfillModalOpen, setIsFulfillModalOpen] = useState(false);
  const [isUpdateMetadataModalOpen, setIsUpdateMetadataModalOpen] = useState(false);
  const [isClaimMyIPModalOpen, setIsClaimMyIPModalOpen] = useState(false);
  const [isClaimChildIPModalOpen, setIsClaimChildIPModalOpen] = useState(false);
  const [ipAsset, setIpAsset] = useState<IPAsset | null>(null);
  const [loadingIpDetails, setLoadingIpDetails] = useState(false);
  const [relationships, setRelationships] = useState<RelationshipCounts>({ parents: 0, children: 0 });
  const [loadingRelationships, setLoadingRelationships] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isPilAttached, setIsPilAttached] = useState(false);
  const [isRegisteredIP, setIsRegisteredIP] = useState(false);
  const [enhancedMetadata, setEnhancedMetadata] = useState<EnhancedMetadata>({ loading: true });
  
  const [claimedRevenue, setClaimedRevenue] = useState<ClaimedRevenueData>({
    totalWipTokens: '0',
    totalMerc20Tokens: '0',
    totalValue: '$0.00',
    lastUpdated: 0
  });
  
  const manageButtonRef = useRef<HTMLButtonElement>(null);
  
  const [disputeInfo, setDisputeInfo] = useState<DisputeInfo>({
    hasDisputes: false,
    activeDisputes: [],
    resolvedDisputes: [],
    totalDisputes: 0,
    isInitiator: false,
    isTarget: false
  });
  const [loadingDisputes, setLoadingDisputes] = useState(false);

  // Add PIL status state
  const [pilStatus, setPilStatus] = useState<PILStatus>({ hasPIL: false, licenseCount: 0, loading: true });

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
          setIsPilAttached(!!ipData.pilAttached);
          
          // Create IP asset for potential modal use
          const convertedIpAsset: IPAsset = {
            id: ipData.id,
            name: ipData.nftMetadata?.name || getName(),
            type: "IP Asset",
            status: "Active",
            pilAttached: !!ipData.pilAttached,
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
          
          // Fetch additional data for registered IPs
          if (ipData.ipId) {
            fetchRelationshipCounts(ipData.ipId);
            fetchDisputeInfo(ipData.ipId);
            loadClaimedRevenue(ipData.ipId);
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

  const fetchRelationshipCounts = async (ipId: string) => {
    setLoadingRelationships(true);
    try {
      const relationshipData = await getIPRelationships(ipId);
      setRelationships({
        parents: relationshipData.ancestorCount || 0,
        children: relationshipData.descendantCount || 0
      });
    } catch (error) {
      console.error('Error fetching relationship counts:', error);
      setRelationships({
        parents: 0,
        children: 0
      });
    } finally {
      setLoadingRelationships(false);
    }
  };

  const fetchDisputeInfo = async (ipId: string) => {
    setLoadingDisputes(true);
    try {
      // Use the existing disputes API endpoint to check for disputes
      const response = await fetch('/api/disputes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          options: {
            where: {
              targetIpId: ipId // Check if this IP is a target of a dispute
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
              initiator: ipId // Check if this IP initiated any disputes
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
      const activeDisputes = allDisputes.filter(dispute => dispute.status === 'ACTIVE' || dispute.status === 'PENDING' || dispute.status === 'RAISED');
      const resolvedDisputes = allDisputes.filter(dispute => dispute.status === 'RESOLVED' || dispute.status === 'DISMISSED');
      
      const newDisputeInfo = {
        hasDisputes: allDisputes.length > 0,
        activeDisputes: activeDisputes,
        resolvedDisputes: resolvedDisputes,
        totalDisputes: allDisputes.length,
        isInitiator: initiatedDisputes.length > 0,
        isTarget: disputes.length > 0
      };
      
      setDisputeInfo(newDisputeInfo);
      
      // Also update ipAsset with dispute info
      setIpAsset(prevAsset => {
        if (prevAsset) {
          return {
            ...prevAsset,
            disputeInfo: newDisputeInfo
          };
        }
        return prevAsset;
      });
      
      // Debug logging to check if there are disputes
      console.log(`[DEBUG] IP Asset ${ipId} dispute info:`, newDisputeInfo);
      if (activeDisputes.length > 0) {
        console.log(`[DEBUG] IP Asset ${ipId} has ${activeDisputes.length} active disputes`);
      }
      
    } catch (error) {
      console.error('Error fetching dispute data:', error);
      setDisputeInfo({
        hasDisputes: false,
        activeDisputes: [],
        resolvedDisputes: [],
        totalDisputes: 0,
        isInitiator: false,
        isTarget: false
      });
    } finally {
      setLoadingDisputes(false);
    }
  };

  const loadClaimedRevenue = (ipId: string) => {
    try {
      const storageKey = `claimedRevenue_${ipId}`;
      const savedData = localStorage.getItem(storageKey);
      
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setClaimedRevenue(parsed);
      } else {
        setClaimedRevenue({
          totalWipTokens: '0',
          totalMerc20Tokens: '0',
          totalValue: '$0.00',
          lastUpdated: Date.now()
        });
      }
    } catch (error) {
      console.error('Error loading claimed revenue:', error);
      setClaimedRevenue({
        totalWipTokens: '0',
        totalMerc20Tokens: '0',
        totalValue: '$0.00',
        lastUpdated: Date.now()
      });
    }
  };

  const saveClaimedRevenue = (data: ClaimedRevenueData, ipId: string) => {
    try {
      const storageKey = `claimedRevenue_${ipId}`;
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving claimed revenue:', error);
    }
  };

  const updateClaimedRevenue = (wipAmount: string = '0', merc20Amount: string = '0') => {
    if (!ipAsset?.ipId) return;
    
    const newData = {
      totalWipTokens: (parseFloat(claimedRevenue.totalWipTokens) + parseFloat(wipAmount)).toString(),
      totalMerc20Tokens: (parseFloat(claimedRevenue.totalMerc20Tokens) + parseFloat(merc20Amount)).toString(),
      totalValue: '',
      lastUpdated: Date.now()
    };
    
    newData.totalValue = calculateTotalValue(newData.totalWipTokens, newData.totalMerc20Tokens);
    
    setClaimedRevenue(newData);
    saveClaimedRevenue(newData, ipAsset.ipId);
  };

  const calculateTotalValue = (wipAmount: string, merc20Amount: string): string => {
    try {
      const wip = parseFloat(wipAmount) || 0;
      const merc20 = parseFloat(merc20Amount) || 0;
      
      const wipValue = wip * 0.10;
      const merc20Value = merc20 * 0.05;
      const totalUSD = wipValue + merc20Value;
      
      if (totalUSD < 0.01) return '< $0.01';
      if (totalUSD < 1) return `$${totalUSD.toFixed(3)}`;
      return `$${totalUSD.toFixed(2)}`;
    } catch (error) {
      return '$0.00';
    }
  };

  const truncateHash = (hash?: string) => {
    if (!hash) return 'N/A';
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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

  const determineAssetType = (tokenUri?: string, metadata?: any): string => {
    // Check if the image field contains a video file
    if (metadata?.image && typeof metadata.image === 'string') {
      const imageUrl = metadata.image.toLowerCase();
      if (imageUrl.includes('.mp4') || imageUrl.includes('.webm') || imageUrl.includes('.mov')) {
        return 'Video';
      }
    }
    
    // Check animation_url for video
    if (metadata?.animation_url && typeof metadata.animation_url === 'string') {
      const animationUrl = metadata.animation_url.toLowerCase();
      if (animationUrl.includes('.mp4') || animationUrl.includes('.webm') || animationUrl.includes('.mov')) {
        return 'Video';
      }
    }
    
    // Fallback to tokenUri check
    if (!tokenUri) return 'Digital Asset';
    const uri = tokenUri.toLowerCase();
    if (uri.includes('video') || uri.includes('.mp4') || uri.includes('.webm') || uri.includes('.mov')) return 'Video';
    if (uri.includes('image') || uri.includes('.jpg') || uri.includes('.png') || uri.includes('.gif')) return 'Image';
    if (uri.includes('audio') || uri.includes('.mp3') || uri.includes('.wav')) return 'Audio';
    return 'Digital Asset';
  };

  const handleViewDetails = async () => {
    if (isRegisteredIP && ipAsset) {
      setIsModalOpen(true);
    } else {
      alert('This NFT is not registered as an IP Asset in Story Protocol');
    }
  };

  const handleManageClick = () => {
    if (manageButtonRef.current) {
      const rect = manageButtonRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      const isRightSide = (cardIndex % 4) >= 2;
      
      setTooltipPosition({
        top: rect.top + scrollTop - 160,
        left: isRightSide ? rect.left - 250 : rect.left,
      });
    }
    setIsTooltipOpen(!isTooltipOpen);
  };

  // Create normalized asset for modal
  const normalizedAssetForModal = ipAsset ? {
    ...ipAsset,
    disputeInfo,
    ancestorCount: ipAsset.ancestorCount || 0,
    descendantCount: ipAsset.descendantCount || 0,
    childrenCount: ipAsset.childrenCount || 0,
    parentCount: ipAsset.parentCount || 0,
    rootCount: ipAsset.rootCount || 0,
    rootIpIds: ipAsset.rootIpIds || [],
    blockTimestamp: ipAsset.blockTimestamp || '',
    transactionHash: ipAsset.transactionHash || '',
    latestArbitrationPolicy: ipAsset.latestArbitrationPolicy || '',
    detailsLoaded: ipAsset.detailsLoaded || false
  } : null;

  const handleFulfillLicense = (data: any) => {
    console.log('Fulfill license terms:', data);
  };

  const handleUpdateMetadata = (data: any) => {
    console.log('Update metadata:', data);
    if (ipAsset?.ipId) {
      setTimeout(() => fetchRelationshipCounts(ipAsset.ipId), 2000);
    }
  };

  const handleClaimMyIP = (data: any) => {
    console.log('Claim my IP revenue:', data);
    const wipAmount = '1.5';
    const merc20Amount = '0.8';
    updateClaimedRevenue(wipAmount, merc20Amount);
  };

  const handleClaimChildIP = (data: any) => {
    console.log('Claim child IP revenue:', data);
    const wipAmount = '0.5';
    const merc20Amount = '0.3';
    updateClaimedRevenue(wipAmount, merc20Amount);
  };

  // Use enhanced metadata for display (similar to ipCardMarketplace)
  const displayName = isRegisteredIP 
    ? enhancedMetadata.nftName || enhancedMetadata.ipTitle || getName()
    : getName();
    
  const displayImage = isRegisteredIP 
    ? enhancedMetadata.nftImage || getImageUrl()
    : getImageUrl();

  // Determine if we have a video (check image field for mp4)
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

  const mediaInfo = getMediaInfo();

  // Add the fetchPILStatus function from ipCardMarketplace.tsx
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

  // Add the getPILStatusDisplay function from ipCardMarketplace.tsx
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

  const pilStatusDisplay = getPILStatusDisplay();

  return (
    <>
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-blue-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-sm"></div>
        
        <div className="relative bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/20 rounded-2xl overflow-hidden hover:border-zinc-600/30 transition-all duration-300 shadow-xl hover:shadow-2xl">
          {/* Image/Video section remains the same... */}
          <div className="h-40 bg-gradient-to-br from-zinc-800/50 to-zinc-700/50 flex items-center justify-center relative overflow-hidden">
            {/* Dispute flag - only show if registered and has active disputes */}
            {isRegisteredIP && disputeInfo && disputeInfo.activeDisputes && disputeInfo.activeDisputes.length > 0 && (
              <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-red-500/80 rounded text-xs text-white font-medium shadow-md">
                <div className="flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{disputeInfo.activeDisputes.length > 1 ? `${disputeInfo.activeDisputes.length} Disputes` : 'Disputed'}</span>
                </div>
              </div>
            )}
            
            {/* Also show past disputes indicator if there are resolved disputes but no active ones */}
            {isRegisteredIP && disputeInfo.activeDisputes.length === 0 && disputeInfo.resolvedDisputes.length > 0 && (
              <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-yellow-500/80 rounded text-xs text-white font-medium shadow-md">
                <div className="flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Past Disputes</span>
                </div>
              </div>
            )}

            {/* Rest of the media section */}
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
            
            {/* Badges remain the same... */}
          </div>

          <div className="p-6">
            {/* Header section remains the same... */}
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
              
              <div className={`px-3 py-1 rounded-lg text-xs font-medium ${
                isRegisteredIP 
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                  : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
              }`}>
                {isRegisteredIP ? 'Registered' : 'Not Registered'}
              </div>
            </div>

            {/* Update Status Info section to include PIL status display */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                {/* Replace the old PIL Status with the new dynamic one */}
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

                {/* Dispute Status */}
                {isRegisteredIP && (
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      disputeInfo.activeDisputes.length > 0 
                        ? 'bg-red-400' 
                        : disputeInfo.hasDisputes 
                          ? 'bg-yellow-400' 
                          : 'bg-green-400'
                    }`}></div>
                    <span className="text-xs text-zinc-400">
                      {loadingDisputes 
                        ? 'Checking...' 
                        : disputeInfo.activeDisputes.length > 0 
                          ? `${disputeInfo.activeDisputes.length} Active Dispute${disputeInfo.activeDisputes.length > 1 ? 's' : ''}`
                          : disputeInfo.hasDisputes 
                            ? 'Past Disputes' 
                            : 'No Disputes'
                      }
                    </span>
                  </div>
                )}
              </div>
              
              <span className="text-xs text-zinc-500">
                {asset.token.symbol}
              </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Revenue Card */}
              <div className="bg-zinc-800/30 rounded-lg p-3 relative">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Revenue</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-400">
                    {isRegisteredIP ? claimedRevenue.totalValue : '$0.00'}
                  </p>
                </div>
              </div>

              {/* Derivatives Card */}
              <div className="bg-zinc-800/30 rounded-lg p-3 relative">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Derivatives</p>
                  {loadingRelationships && (
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-pink-400">
                    {isRegisteredIP ? relationships.children : 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button 
                onClick={handleViewDetails}
                disabled={loadingIpDetails}
                className="flex-1 px-3 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-300 rounded-lg text-xs font-medium transition-all duration-200 border border-zinc-700/20 disabled:opacity-50"
              >
                View Details
              </button>
              
              {/* Manage Button with Dynamic Arrow */}
              <button 
                ref={manageButtonRef}
                onClick={handleManageClick}
                disabled={!isRegisteredIP}
                className="px-3 py-2 bg-gradient-to-r from-blue-500/10 to-pink-500/10 hover:from-blue-500/20 hover:to-pink-500/20 text-blue-400 rounded-lg text-xs font-medium transition-all duration-200 border border-blue-500/20 flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Manage</span>
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

      {/* Tooltip, Modals, and rest of the component remain the same... */}
      {isTooltipOpen && isRegisteredIP && (
        <>
          {/* Click outside to close tooltip */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsTooltipOpen(false)}
          ></div>

          {/* Tooltip positioned absolutely */}
          <div 
            className="absolute z-50 w-72"
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left,
            }}
          >
            <div className="bg-zinc-800/95 backdrop-blur-xl border border-zinc-700/30 rounded-xl p-3 shadow-2xl">
              <div className="space-y-2">
                {/* Fulfill License Terms Card */}
                <button
                  onClick={() => {
                    setIsFulfillModalOpen(true);
                    setIsTooltipOpen(false);
                  }}
                  className="w-full p-3 bg-zinc-700/40 hover:bg-zinc-600/40 border border-zinc-600/20 hover:border-zinc-500/30 rounded-lg transition-all duration-200 text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
                      <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white group-hover:text-orange-300 transition-colors">
                        Fulfill License Terms
                      </p>
                      <p className="text-xs text-zinc-400">
                        Pay royalties on behalf of another party
                      </p>
                    </div>
                  </div>
                </button>

                {/* Update Metadata Card */}
                <button
                  onClick={() => {
                    setIsUpdateMetadataModalOpen(true);
                    setIsTooltipOpen(false);
                  }}
                  className="w-full p-3 bg-zinc-700/40 hover:bg-zinc-600/40 border border-zinc-600/20 hover:border-zinc-500/30 rounded-lg transition-all duration-200 text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-cyan-500/10 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                      <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">
                        Update Metadata
                      </p>
                      <p className="text-xs text-zinc-400">
                        Modify IP Asset metadata information
                      </p>
                    </div>
                  </div>
                </button>

                {/* Claim My IP Revenue Card */}
                <button
                  onClick={() => {
                    setIsClaimMyIPModalOpen(true);
                    setIsTooltipOpen(false);
                  }}
                  className="w-full p-3 bg-zinc-700/40 hover:bg-zinc-600/40 border border-zinc-600/20 hover:border-zinc-500/30 rounded-lg transition-all duration-200 text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white group-hover:text-green-300 transition-colors">
                        Claim My IP Revenue
                      </p>
                      <p className="text-xs text-zinc-400">
                        Collect revenue generated by this IP
                      </p>
                    </div>
                  </div>
                </button>

                {/* Claim Child IP Revenue Card */}
                <button
                  onClick={() => {
                    setIsClaimChildIPModalOpen(true);
                    setIsTooltipOpen(false);
                  }}
                  className="w-full p-3 bg-zinc-700/40 hover:bg-zinc-600/40 border border-zinc-600/20 hover:border-zinc-500/30 rounded-lg transition-all duration-200 text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">
                        Claim Child IP Revenue
                      </p>
                      <p className="text-xs text-zinc-400">
                        Collect revenue from derivative works
                      </p>
                    </div>
                  </div>
                </button>
              </div>
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

      {/* All Modals */}
      {normalizedAssetForModal && (
        <>
          <IPDetailsModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            asset={normalizedAssetForModal}
          />

          <FulfillLicenseTermsModal
            isOpen={isFulfillModalOpen}
            onClose={() => setIsFulfillModalOpen(false)}
            currentIpId={normalizedAssetForModal.ipId}
            onFulfill={handleFulfillLicense}
          />

          <UpdateMetadataModal
            isOpen={isUpdateMetadataModalOpen}
            onClose={() => setIsUpdateMetadataModalOpen(false)}
            currentIpId={normalizedAssetForModal.ipId}
            onUpdate={handleUpdateMetadata}
          />

          <ClaimRevenueMyIPModal
            isOpen={isClaimMyIPModalOpen}
            onClose={() => setIsClaimMyIPModalOpen(false)}
            currentIpId={normalizedAssetForModal.ipId}
            onClaim={handleClaimMyIP}
          />

          <ClaimRevenueChildIPModal
            isOpen={isClaimChildIPModalOpen}
            onClose={() => setIsClaimChildIPModalOpen(false)}
            currentIpId={normalizedAssetForModal.ipId}
            onClaim={handleClaimChildIP}
          />
        </>
      )}
    </>
  );
};
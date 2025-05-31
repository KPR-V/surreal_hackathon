"use client";

import React, { useState, useEffect, useRef } from 'react';
import { getIPRelationships, hasActiveDisputes,getIPDisputes } from './ipEdgesService';
import { DisputeInfo } from './types';
import { IPDetailsModal } from './ipDetailsModal';
import { FulfillLicenseTermsModal } from './fulfillLicenseTerms';
import { UpdateMetadataModal } from './update-metadataModal';
import { ClaimRevenueMyIPModal } from './claimRevenuemyIP';
import { ClaimRevenueChildIPModal } from './claimRevenueChildip';

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

interface MyIPCardProps {
  asset: IPAsset;
  cardIndex: number;
}

interface RelationshipCounts {
  parents: number;
  children: number;
}

interface ClaimedRevenueData {
  // Total claimed amounts (simplified)
  totalWipTokens: string;
  totalMerc20Tokens: string;
  totalValue: string;
  lastUpdated: number;
}

export const MyIPCard: React.FC<MyIPCardProps> = ({ asset, cardIndex }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [isFulfillModalOpen, setIsFulfillModalOpen] = useState(false);
  const [isUpdateMetadataModalOpen, setIsUpdateMetadataModalOpen] = useState(false);
  const [isClaimMyIPModalOpen, setIsClaimMyIPModalOpen] = useState(false);
  const [isClaimChildIPModalOpen, setIsClaimChildIPModalOpen] = useState(false);
  const [relationships, setRelationships] = useState<RelationshipCounts>({ parents: 0, children: 0 });
  const [loadingRelationships, setLoadingRelationships] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  
  // Simplified state for tracking only total claimed revenue
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

  useEffect(() => {
    fetchRelationshipCounts();
    fetchDisputeInfo();
    loadClaimedRevenue();
    
    // Set up intervals for real-time updates
    const relationshipInterval = setInterval(fetchRelationshipCounts, 60000); // Update every minute
    
    return () => {
      clearInterval(relationshipInterval);
    };
  }, [asset.ipId]);

  // Add this useEffect to fetch dispute data for the card
  useEffect(() => {
    const fetchDisputeData = async () => {
      setLoadingDisputes(true);
      try {
        // Quick check for active disputes
        const hasActiveDisputesCheck = await hasActiveDisputes(asset.ipId);
        
        if (hasActiveDisputesCheck) {
          // If there are active disputes, fetch full dispute info
          const disputeInfo = await getIPDisputes(asset.ipId);
          setDisputeInfo(disputeInfo);
        } else {
          // No active disputes found
          setDisputeInfo({
            hasDisputes: false,
            activeDisputes: [],
            resolvedDisputes: [],
            totalDisputes: 0,
            isInitiator: false,
            isTarget: false
          });
        }
      } catch (error) {
        console.error('Error fetching dispute data for card:', error);
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

    fetchDisputeData();
  }, [asset.ipId]);

  const fetchRelationshipCounts = async () => {
    setLoadingRelationships(true);
    try {
      const relationshipData = await getIPRelationships(asset.ipId);
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

  // Load claimed revenue from localStorage or initialize
  const loadClaimedRevenue = () => {
    try {
      const storageKey = `claimedRevenue_${asset.ipId}`;
      const savedData = localStorage.getItem(storageKey);
      
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setClaimedRevenue(parsed);
      } else {
        // Initialize with zeros
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

  // Save claimed revenue to localStorage
  const saveClaimedRevenue = (data: ClaimedRevenueData) => {
    try {
      const storageKey = `claimedRevenue_${asset.ipId}`;
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving claimed revenue:', error);
    }
  };

  // Simplified update function - just add to totals
  const updateClaimedRevenue = (wipAmount: string = '0', merc20Amount: string = '0') => {
    const newData = {
      totalWipTokens: (parseFloat(claimedRevenue.totalWipTokens) + parseFloat(wipAmount)).toString(),
      totalMerc20Tokens: (parseFloat(claimedRevenue.totalMerc20Tokens) + parseFloat(merc20Amount)).toString(),
      totalValue: '',
      lastUpdated: Date.now()
    };
    
    // Calculate total USD value
    newData.totalValue = calculateTotalValue(newData.totalWipTokens, newData.totalMerc20Tokens);
    
    setClaimedRevenue(newData);
    saveClaimedRevenue(newData);
  };

  const formatTokenAmount = (amount: string | number | bigint): string => {
    try {
      let numAmount: number;
      if (typeof amount === 'bigint') {
        numAmount = Number(amount);
      } else if (typeof amount === 'string') {
        numAmount = parseFloat(amount);
      } else {
        numAmount = amount;
      }
      
      if (isNaN(numAmount) || numAmount === 0) return '0';
      
      // Convert from wei if it's a very large number
      if (numAmount > 1e15) {
        return (numAmount / 1e18).toFixed(4);
      }
      
      return numAmount.toFixed(4);
    } catch (error) {
      return '0';
    }
  };

  const calculateTotalValue = (wipAmount: string, merc20Amount: string): string => {
    try {
      const wip = parseFloat(wipAmount) || 0;
      const merc20 = parseFloat(merc20Amount) || 0;
      
      // Simple calculation - in reality you'd want to fetch token prices
      // For now, assuming 1 WIP = $0.10 and 1 MERC20 = $0.05
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

  const fetchDisputeInfo = async () => {
    setLoadingDisputes(true);
    try {
      const disputes = await getIPDisputes(asset.ipId);
      setDisputeInfo(disputes);
    } catch (error) {
      console.error('Error fetching dispute info:', error);
    } finally {
      setLoadingDisputes(false);
    }
  };

  const truncateHash = (hash?: string) => {
    if (!hash) return 'N/A';
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Create normalized asset with default values for modal
  const normalizedAssetForModal = {
    ...asset,
    disputeInfo,
    ancestorCount: asset.ancestorCount || 0,
    descendantCount: asset.descendantCount || 0,
    childrenCount: asset.childrenCount || 0,
    parentCount: asset.parentCount || 0,
    rootCount: asset.rootCount || 0,
    rootIpIds: asset.rootIpIds || [],
    blockTimestamp: asset.blockTimestamp || '',
    transactionHash: asset.transactionHash || '',
    latestArbitrationPolicy: asset.latestArbitrationPolicy || '',
    detailsLoaded: asset.detailsLoaded || false
  };

  const handleFulfillLicense = (data: any) => {
    console.log('Fulfill license terms:', data);
    // License fulfillment doesn't directly affect claimed revenue for this IP
  };

  const handleUpdateMetadata = (data: any) => {
    console.log('Update metadata:', data);
    // Metadata updates don't affect revenue, but might affect relationships
    setTimeout(fetchRelationshipCounts, 2000);
  };

  const handleClaimMyIP = (data: any) => {
    console.log('Claim my IP revenue:', data);
    
    // Parse amounts from transaction result
    // For now, using example amounts - replace with actual parsed amounts
    const wipAmount = '1.5';
    const merc20Amount = '0.8';
    
    updateClaimedRevenue(wipAmount, merc20Amount);
  };

  const handleClaimChildIP = (data: any) => {
    console.log('Claim child IP revenue:', data);
    
    // Parse amounts from transaction result
    // For now, using example amounts - replace with actual parsed amounts
    const wipAmount = '0.5';
    const merc20Amount = '0.3';
    
    updateClaimedRevenue(wipAmount, merc20Amount);
  };

  const handleManageClick = () => {
    if (manageButtonRef.current) {
      const rect = manageButtonRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // Determine if this card is on the right side (assuming 4 cards per row)
      const isRightSide = (cardIndex % 4) >= 2;
      
      setTooltipPosition({
        top: rect.top + scrollTop - 160, // Position above the button with more space
        left: isRightSide ? rect.left - 250 : rect.left, // Shift left for right-side cards
      });
    }
    setIsTooltipOpen(!isTooltipOpen);
  };

  const getTimeSinceUpdate = () => {
    if (claimedRevenue.lastUpdated === 0) return '';
    const seconds = Math.floor((Date.now() - claimedRevenue.lastUpdated) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <>
      <div className="relative group">
        <div className="relative bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/20 rounded-2xl overflow-hidden hover:border-zinc-600/30 transition-all duration-300 shadow-xl hover:shadow-2xl">
          {/* Image */}
          <div className="h-40 bg-gradient-to-br from-zinc-800/50 to-zinc-700/50 flex items-center justify-center relative overflow-hidden">
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
              <svg className="w-12 h-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            
            {/* Asset Type Badge */}
            <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg">
              <span className="text-xs text-zinc-300 font-medium">{asset.type}</span>
            </div>

            {/* Group Badge */}
            {asset.isGroup && (
              <div className="absolute top-3 right-3 px-2 py-1 bg-purple-500/20 backdrop-blur-sm border border-purple-500/30 rounded-lg">
                <span className="text-xs text-purple-300 font-medium">Group</span>
              </div>
            )}

            {/* Dispute Badge */}
            {disputeInfo.hasDisputes && (
              <div className="absolute top-3 right-3 z-10">
                <div className={`px-2 py-1 rounded-full text-xs font-medium border ${
                  disputeInfo.activeDisputes.length > 0
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                }`}>
                  {disputeInfo.activeDisputes.length > 0 ? 'In Dispute' : 'Past Disputes'}
                </div>
              </div>
            )}

          </div>

          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-light text-white group-hover:text-blue-300 transition-colors duration-300 truncate">
                  {asset.name}
                </h3>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs text-zinc-500">ID:</span>
                  <button 
                    onClick={() => copyToClipboard(asset.ipId)}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                    title="Click to copy"
                  >
                    {truncateHash(asset.ipId)}
                  </button>
                </div>
              </div>
              
              <div className={`px-3 py-1 rounded-lg text-xs font-medium ${
                asset.status === 'Active' 
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                  : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
              }`}>
                {asset.status}
              </div>
            </div>

            {/* PIL Status & Chain Info & Dispute Status */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                {/* PIL Status */}
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    asset.pilAttached ? 'bg-blue-400' : 'bg-zinc-600'
                  }`}></div>
                  <span className="text-xs text-zinc-400">
                    {asset.pilAttached ? 'PIL Attached' : 'No PIL'}
                  </span>
                </div>

                {/* Dispute Status */}
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
              </div>
              
              {asset.nftMetadata?.chainId && (
                <span className="text-xs text-zinc-500">
                  Chain: {asset.nftMetadata.chainId}
                </span>
              )}
            </div>

            {/* Simplified Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Simplified Claimed Revenue Card */}
              <div className="bg-zinc-800/30 rounded-lg p-3 relative">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Revenue</p>
          
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-400">{claimedRevenue.totalValue}</p>
                </div>
              </div>

              {/* Derivatives Card - unchanged */}
              <div className="bg-zinc-800/30 rounded-lg p-3 relative">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Derivatives</p>
                  {loadingRelationships && (
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-pink-400">{relationships.children}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex-1 px-3 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-300 rounded-lg text-xs font-medium transition-all duration-200 border border-zinc-700/20"
              >
                View Details
              </button>
              
              {/* Manage Button with Dynamic Arrow */}
              <button 
                ref={manageButtonRef}
                onClick={handleManageClick}
                className="px-3 py-2 bg-gradient-to-r from-blue-500/10 to-pink-500/10 hover:from-blue-500/20 hover:to-pink-500/20 text-blue-400 rounded-lg text-xs font-medium transition-all duration-200 border border-blue-500/20 flex items-center space-x-1"
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

      {/* Enhanced Tooltip with 4 Cards */}
      {isTooltipOpen && (
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
      <IPDetailsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        asset={normalizedAssetForModal}
      />

      <FulfillLicenseTermsModal
        isOpen={isFulfillModalOpen}
        onClose={() => setIsFulfillModalOpen(false)}
        currentIpId={asset.ipId}
        onFulfill={handleFulfillLicense}
      />

      <UpdateMetadataModal
        isOpen={isUpdateMetadataModalOpen}
        onClose={() => setIsUpdateMetadataModalOpen(false)}
        currentIpId={asset.ipId}
        onUpdate={handleUpdateMetadata}
      />

      <ClaimRevenueMyIPModal
        isOpen={isClaimMyIPModalOpen}
        onClose={() => setIsClaimMyIPModalOpen(false)}
        currentIpId={asset.ipId}
        onClaim={handleClaimMyIP}
      />

      <ClaimRevenueChildIPModal
        isOpen={isClaimChildIPModalOpen}
        onClose={() => setIsClaimChildIPModalOpen(false)}
        currentIpId={asset.ipId}
        onClaim={handleClaimChildIP}
      />
    </>
  );
};
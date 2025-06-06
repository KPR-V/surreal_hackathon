"use client";

import React, { useState, useRef, useEffect } from 'react';
import { MarketplaceAssetDetails } from './marketplaceAssetDetails';
import { TipIpAssetModal } from './tipIpAsset';
import { RaiseDisputeModal } from './raiseDispute';

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

interface IPCardMarketplaceProps {
  asset: IPAsset;
  cardIndex: number;
}

interface PILStatus {
  hasPIL: boolean;
  licenseCount: number;
  loading: boolean;
  error?: string;
}

export const IPCardMarketplace: React.FC<IPCardMarketplaceProps> = ({ asset, cardIndex }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [pilStatus, setPilStatus] = useState<PILStatus>({ hasPIL: false, licenseCount: 0, loading: true });
  const actionsButtonRef = useRef<HTMLButtonElement>(null);

  // Fetch real-time PIL status
  useEffect(() => {
    const fetchPILStatus = async () => {
      try {
        setPilStatus(prev => ({ ...prev, loading: true }));
        
        // Check for license terms
        const licenseResponse = await fetch(`/api/licenses/ip/terms/${asset.ipId}`);
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

    if (asset.ipId) {
      fetchPILStatus();
    }
  }, [asset.ipId]);

  const truncateHash = (hash?: string) => {
    if (!hash) return 'N/A';
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const determineAssetType = (tokenUri?: string): string => {
    if (!tokenUri) return 'Digital Asset';
    const uri = tokenUri.toLowerCase();
    if (uri.includes('image') || uri.includes('.jpg') || uri.includes('.png')) return 'Image';
    if (uri.includes('audio') || uri.includes('.mp3')) return 'Audio';
    if (uri.includes('video') || uri.includes('.mp4')) return 'Video';
    return 'Digital Asset';
  };

  const handleViewDetails = () => {
    setIsModalOpen(true);
  };

  const handleActionsClick = () => {
    if (actionsButtonRef.current) {
      const rect = actionsButtonRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // Determine if this card is on the right side (assuming 4 cards per row)
      const isRightSide = (cardIndex % 4) >= 2;
      
      setTooltipPosition({
        top: rect.top + scrollTop - 120, // Position above the button
        left: isRightSide ? rect.left - 200 : rect.left, // Shift left for right-side cards
      });
    }
    setIsActionsOpen(!isActionsOpen);
  };

  const handleTipAsset = () => {
    console.log('Tip IP Asset:', asset.ipId);
    setIsActionsOpen(false);
    setIsTipModalOpen(true);
  };

  const handleRaiseDispute = () => {
    console.log('Raise Dispute:', asset.ipId);
    setIsActionsOpen(false);
    setIsDisputeModalOpen(true);
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

  const pilStatusDisplay = getPILStatusDisplay();

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
              <span className="text-xs text-zinc-300 font-medium">{determineAssetType(asset.nftMetadata?.tokenUri)}</span>
            </div>
          </div>

          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-light text-white group-hover:text-blue-300 transition-colors duration-300 truncate">
                  {asset.name || 'Unnamed Asset'}
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
              
              <div className="px-3 py-1 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                Active
              </div>
            </div>

            {/* PIL Status */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${pilStatusDisplay.dot}`}></div>
                  <span className={`text-xs ${pilStatusDisplay.textColor}`}>
                    {pilStatusDisplay.text}
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500">Token ID</span>
                <span className="text-xs text-zinc-300 font-mono">
                  {asset.tokenId || 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500">Contract</span>
                <span className="text-xs text-zinc-300 font-mono">
                  {truncateHash(asset.tokenContract)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500">Block Number</span>
                <span className="text-xs text-zinc-300 font-mono">
                  {asset.blockNumber}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button 
                onClick={handleViewDetails}
                className="flex-1 px-3 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-300 rounded-lg text-xs font-medium transition-all duration-200 border border-zinc-700/20"
              >
                View Details
              </button>
              
              {/* Enhanced Actions Button */}
              <button 
                ref={actionsButtonRef}
                onClick={handleActionsClick}
                className="px-3 py-2 bg-gradient-to-br from-zinc-800/60 to-zinc-700/60 hover:from-zinc-700/70 hover:to-zinc-600/70 text-zinc-300 hover:text-white rounded-lg transition-all duration-200 border border-zinc-600/30 hover:border-zinc-500/50 flex items-center justify-center group"
                title="More actions"
              >
                <svg className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="2"/>
                  <circle cx="12" cy="12" r="2"/>
                  <circle cx="12" cy="19" r="2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Actions Tooltip */}
      {isActionsOpen && (
        <>
          {/* Click outside to close tooltip */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsActionsOpen(false)}
          ></div>

          {/* Tooltip positioned absolutely */}
          <div 
            className="absolute z-50 w-64"
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left,
            }}
          >
            <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/40 rounded-xl p-3 shadow-2xl ring-1 ring-white/5">
              <div className="space-y-2">
                {/* Tip IP Asset Card */}
                <button
                  onClick={handleTipAsset}
                  className="w-full p-3 bg-gradient-to-br from-zinc-800/40 to-zinc-700/40 hover:from-zinc-700/50 hover:to-zinc-600/50 border border-zinc-600/20 hover:border-zinc-500/40 rounded-lg transition-all duration-200 text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-lg group-hover:from-yellow-500/20 group-hover:to-amber-500/20 transition-all duration-200 border border-yellow-500/20">
                      <svg className="w-4 h-4 text-yellow-400 group-hover:text-yellow-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white group-hover:text-yellow-200 transition-colors">
                        Tip IP Asset
                      </p>
                      <p className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">
                        Send a tip to the IP creator
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Raise Dispute Card */}
                <button
                  onClick={handleRaiseDispute}
                  className="w-full p-3 bg-gradient-to-br from-zinc-800/40 to-zinc-700/40 hover:from-zinc-700/50 hover:to-zinc-600/50 border border-zinc-600/20 hover:border-zinc-500/40 rounded-lg transition-all duration-200 text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-red-500/10 to-rose-500/10 rounded-lg group-hover:from-red-500/20 group-hover:to-rose-500/20 transition-all duration-200 border border-red-500/20">
                      <svg className="w-4 h-4 text-red-400 group-hover:text-red-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white group-hover:text-red-200 transition-colors">
                        Raise Dispute
                      </p>
                      <p className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">
                        Report an issue with this IP asset
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              </div>
            </div>
            
            {/* Enhanced Tooltip Arrow */}
            <div 
              className={`absolute w-0 h-0 ${
                (cardIndex % 4) >= 2 
                  ? 'top-full right-6 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-zinc-700/40' 
                  : 'top-full left-4 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-zinc-700/40'
              }`}
            ></div>
          </div>
        </>
      )}

      {/* Asset Details Modal - Only loads data when opened */}
      <MarketplaceAssetDetails
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        asset={asset}
      />

      {/* Tip IP Asset Modal */}
      <TipIpAssetModal
        isOpen={isTipModalOpen}
        onClose={() => setIsTipModalOpen(false)}
        assetId={asset.ipId}
        ipId={asset.ipId}
        assetName={asset.name || 'Unnamed Asset'}
      />

      {/* Raise Dispute Modal */}
      <RaiseDisputeModal
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        assetId={asset.ipId}
        ipId={asset.ipId}
        assetName={asset.name || 'Unnamed Asset'}
      />
    </>
  );
};
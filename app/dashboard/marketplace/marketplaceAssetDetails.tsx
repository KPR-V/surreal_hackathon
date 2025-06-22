"use client";

import React, { useState, useEffect, useRef } from 'react';
import { LicenseConfigurationModal } from './licensingConfiguration';
import { FamilyTreeVisualization } from '../my-account/familyTreeVisualization';
import { IPAssetService, ServiceIPAssetDetails } from '../../../lib/services/ipAssetService';

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

interface LocalIPAssetDetails {
  basicInfo: {
    id: string;
    name: string;
    type: string;
    status: string;
    owner?: string;
    created: string;
    lastModified?: string;
  };
  technicalDetails: {
    blockNumber: string;
    transactionHash: string;
    contractAddress: string;
    tokenId: string;
    chainId: string;
    metadataUri?: string;
  };
  statistics: {
    relationships: {
      parents: number;
      children: number;
      ancestors: number;
      descendants: number;
    };
  };
}

interface MarketplaceAssetDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  asset: IPAsset;
  enhancedMetadata?: EnhancedMetadata;
}

const StoryAPIService = {
  async getFullIPDetails(ipId: string): Promise<LocalIPAssetDetails | null> {
    try {
      const response = await fetch(`/api/assets/${ipId}`, {
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

// Currency conversion service with real IP token rate
const CurrencyService = {
  getIPTokenRate(): number {
    return 0.000000000000000602; // 1 WEI to IP tokens
  },

  convertWeiToIP(weiAmount: string | number): number {
    const wei = typeof weiAmount === 'string' ? parseFloat(weiAmount) : weiAmount;
    if (isNaN(wei) || wei === 0) return 0;
    
    const eth = wei / 1000000000000000000;
    const usd = eth * 2500;
    const ipTokens = usd / 4.15;
    
    return ipTokens;
  },

  formatIPAmount(amount: number): string {
    if (amount === 0) return 'Free';
    if (amount < 0.0001) return `${amount.toExponential(2)} IP`;
    if (amount < 1) return `${amount.toFixed(4)} IP`;
    if (amount < 1000) return `${amount.toFixed(2)} IP`;
    return `${(amount / 1000).toFixed(2)}K IP`;
  },

  getUSDValue(ipAmount: number): string {
    const usd = ipAmount * 4.15;
    if (usd < 0.01) return '$0.00';
    if (usd < 1) return `$${usd.toFixed(3)}`;
    return `$${usd.toFixed(2)}`;
  }
};

// Update the MarketplaceFamilyTree component
const MarketplaceFamilyTree: React.FC<{ currentAsset: IPAsset; onViewAssetDetails?: (ipId: string) => void }> = ({ 
  currentAsset, 
  onViewAssetDetails 
}) => {
  const [assetDetails, setAssetDetails] = useState<ServiceIPAssetDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssetDetails();
  }, [currentAsset.ipId]);

  const fetchAssetDetails = async () => {
    setLoading(true);
    try {
      const details = await IPAssetService.getIPAssetDetails(currentAsset.ipId);
      setAssetDetails(details);
    } catch (error) {
      console.error('Error fetching asset details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-zinc-400">Loading family tree...</span>
        </div>
      </div>
    );
  }

  // Use the enhanced FamilyTreeVisualization component with callback
  return (
    <FamilyTreeVisualization 
      currentAsset={{
        id: currentAsset.id,
        name: currentAsset.name,
        ipId: currentAsset.ipId,
        ancestorCount: assetDetails?.ancestorCount || 0,
        parentCount: assetDetails?.parentCount || 0,
        childrenCount: assetDetails?.childrenCount || 0,
        descendantCount: assetDetails?.descendantCount || 0,
        rootIpIds: assetDetails?.rootIpIds || []
      }}
      onViewAssetDetails={onViewAssetDetails}
    />
  );
};

// Enhanced LicensingInfo component with simplified display and smaller text
export const MarketplaceLicensingInfo: React.FC<{ ipId: string }> = ({ ipId }) => {
  const [licenseTerms, setLicenseTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLicense, setSelectedLicense] = useState<any>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch license terms
        const licenseResponse = await fetch(`/api/licenses/ip/terms/${ipId}`);
        if (licenseResponse.ok) {
          const data = await licenseResponse.json();
          setLicenseTerms(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching license info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ipId]);

  const formatMintingFee = (fee: string, currency?: string) => {
    try {
      const feeNumber = parseFloat(fee);
      if (feeNumber === 0) return { display: 'Free', usd: '$0.00' };
      
      // Convert to IP tokens
      const ipTokens = CurrencyService.convertWeiToIP(feeNumber);
      const formattedIP = CurrencyService.formatIPAmount(ipTokens);
      const usdValue = CurrencyService.getUSDValue(ipTokens);
      
      return {
        display: formattedIP,
        usd: usdValue
      };
    } catch {
      return { display: fee || 'N/A', usd: '$0.00' };
    }
  };

  const getLicenseTypeIcon = (term: any) => {
    if (term.commercialUse && term.derivativesAllowed) return '🔓'; // Full license
    if (term.commercialUse) return '💼'; // Commercial only
    if (term.derivativesAllowed) return '🔄'; // Derivatives only
    return '📄'; // Basic license
  };

  const getLicenseTypeName = (term: any) => {
    if (term.commercialUse && term.derivativesAllowed) return 'Commercial + Derivatives';
    if (term.commercialUse) return 'Commercial Use';
    if (term.derivativesAllowed) return 'Derivatives';
    return 'Basic License';
  };

  const handleLicenseSelect = (term: any) => {
    setSelectedLicense(term);
    setIsConfigModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-zinc-400">Loading licensing info...</span>
        </div>
      </div>
    );
  }

  if (licenseTerms.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="bg-zinc-900/40 rounded-lg p-4">
          <svg className="w-8 h-8 text-zinc-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <p className="text-xs text-zinc-400 mb-1">No License Terms</p>
          <p className="text-xs text-zinc-500">This asset has no attached license terms</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* License Header */}
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-400">Available Licenses</h3>
            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
              {licenseTerms.length} option{licenseTerms.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-blue-300">Choose the licensing option that best fits your needs</p>
        </div>

        {/* Simplified License Cards */}
        <div className="grid gap-3">
          {licenseTerms.map((term, index) => {
            const feeInfo = formatMintingFee(term.mintingFee || '0', term.currency);
            
            return (
              <div key={term.id || index} className="bg-zinc-900/40 rounded-lg p-4 border border-zinc-700/20 hover:border-zinc-600/30 transition-all duration-300 group">
                {/* License Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="text-lg">{getLicenseTypeIcon(term)}</div>
                    <div>
                      <h4 className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">
                        {getLicenseTypeName(term)}
                      </h4>
                      <p className="text-xs text-zinc-500">License #{index + 1}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-bold text-blue-300">{feeInfo.display}</div>
                    <div className="text-xs text-zinc-500">{feeInfo.usd}</div>
                  </div>
                </div>

                {/* Quick License Features */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="flex items-center space-x-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${term.commercialUse ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className="text-xs text-zinc-400">Commercial</span>
                    <span className={`text-xs ${term.commercialUse ? 'text-green-400' : 'text-red-400'}`}>
                      {term.commercialUse ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${term.derivativesAllowed ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className="text-xs text-zinc-400">Derivatives</span>
                    <span className={`text-xs ${term.derivativesAllowed ? 'text-green-400' : 'text-red-400'}`}>
                      {term.derivativesAllowed ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                {/* License Action */}
                <button 
                  onClick={() => handleLicenseSelect(term)}
                  className="w-full px-3 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-400/30 hover:border-blue-400/50 text-blue-300 hover:text-blue-200 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center space-x-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.243-6.243A6 6 0 0121 9z" />
                  </svg>
                  <span>License This Asset</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>

        {/* Licensing Guide */}
        <div className="bg-zinc-900/30 rounded-lg p-3 border border-zinc-700/20">
          <h5 className="text-xs font-medium text-zinc-300 mb-2 flex items-center">
            <svg className="w-3 h-3 mr-1 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Quick Guide
          </h5>
          <div className="text-xs text-zinc-500 space-y-1">
            <p>• Click "License This Asset" to see detailed terms and pricing</p>
            <p>• Each license defines specific rights for commercial use and derivatives</p>
            <p>• All payments are processed in IP tokens (1 IP = $4.15 USD)</p>
            <p>• License tokens are minted to your wallet after successful payment</p>
          </div>
        </div>
      </div>

      {/* License Configuration Modal */}
      <LicenseConfigurationModal
        isOpen={isConfigModalOpen}
        onClose={() => {
          setIsConfigModalOpen(false);
          setSelectedLicense(null);
        }}
        selectedLicense={selectedLicense}
        ipId={ipId}
      />
    </>
  );
};

export function AssetDetails({ asset }: { asset: IPAsset }) {
  return (
    <div className="space-y-8">
      {/* Basic Info */}
      <div className="bg-zinc-800/30 rounded-lg p-6 border border-zinc-700/20">
        <h2 className="text-xl font-semibold text-white mb-4">Asset Details</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-zinc-300 mb-2">Basic Information</h3>
            <div className="bg-zinc-900/30 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:space-x-4">
                <div className="flex-1">
                  <p className="text-xs text-zinc-400">Name</p>
                  <p className="text-lg font-semibold text-white">{asset.name}</p>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-zinc-400">Type</p>
                  <p className="text-lg font-semibold text-white">{asset.type}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-xs text-zinc-400">Status</p>
                <p className="text-lg font-semibold text-white">{asset.status}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-zinc-300 mb-2">Technical Details</h3>
            <div className="bg-zinc-900/30 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:space-x-4">
                <div className="flex-1">
                  <p className="text-xs text-zinc-400">IP ID</p>
                  <p className="text-lg font-semibold text-white">{asset.ipId}</p>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-zinc-400">Token ID</p>
                  <p className="text-lg font-semibold text-white">{asset.tokenId}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-xs text-zinc-400">Contract Address</p>
                <p className="text-lg font-semibold text-white">{asset.tokenContract}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Family Tree and Licensing Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Family Tree Visualization */}
        <div className="bg-zinc-800/30 rounded-lg p-6 border border-zinc-700/20">
          <h2 className="text-xl font-semibold text-white mb-4">Family Tree</h2>
          <MarketplaceFamilyTree currentAsset={asset} />
        </div>

        {/* Licensing Information */}
        <div className="bg-zinc-800/30 rounded-lg p-6 border border-zinc-700/20">
          <h2 className="text-xl font-semibold text-white mb-4">Licensing Information</h2>
          <MarketplaceLicensingInfo ipId={asset.ipId} />
        </div>
      </div>
    </div>
  );
}

// Add this export at the end of the file
export const MarketplaceAssetDetails: React.FC<MarketplaceAssetDetailsProps> = ({ 
  isOpen, 
  onClose, 
  asset, 
  enhancedMetadata 
}) => {
  const [activeDetailTab, setActiveDetailTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [fullDetails, setFullDetails] = useState<LocalIPAssetDetails | null>(null);
  const [completeMetadata, setCompleteMetadata] = useState<{
    ipMetadata: any;
    ipAssetData: any;
    nftMetadata: any;
  } | null>(null);
  
  // State for nested asset details modal
  const [nestedAssetId, setNestedAssetId] = useState<string | null>(null);
  const [nestedAssetData, setNestedAssetData] = useState<IPAsset | null>(null);
  const [loadingNestedAsset, setLoadingNestedAsset] = useState(false);

  useEffect(() => {
    if (isOpen && asset.ipId) {
      fetchFullDetails();
      fetchCompleteMetadata();
    }
  }, [isOpen, asset.ipId]);

  // Handle viewing details of related assets
  const handleViewAssetDetails = async (ipId: string) => {
    if (ipId === asset.ipId) {
      // Don't open modal for the same asset
      return;
    }

    setLoadingNestedAsset(true);
    try {
      // Fetch basic asset info to create mock IPAsset for the modal
      const assetDetails = await IPAssetService.getIPAssetDetails(ipId);
      
      if (assetDetails) {
        const mockAsset: IPAsset = {
          id: assetDetails.id || ipId,
          name: assetDetails.name || 'Related Asset',
          type: 'IP Asset',
          status: 'active',
          image: assetDetails.nftMetadata?.imageUrl || '/placeholder-ip.png',
          ipId: ipId,
          tokenContract: assetDetails.tokenContract || '0x0000000000000000000000000000000000000000',
          tokenId: assetDetails.tokenId || '0',
          blockNumber: parseInt(assetDetails.blockNumber) || 0,
          nftMetadata: {
            name: assetDetails.name || 'Related Asset',
            imageUrl: assetDetails.nftMetadata?.imageUrl || '/placeholder-ip.png',
            tokenContract: assetDetails.tokenContract || '0x0000000000000000000000000000000000000000',
            tokenId: assetDetails.tokenId || '0',
            chainId: '11155420'
          },
          blockTimestamp: assetDetails.blockTimestamp || '0',
          transactionHash: assetDetails.transactionHash || '0x0000000000000000000000000000000000000000000000000000000000000000'
        };

        setNestedAssetData(mockAsset);
        setNestedAssetId(ipId);
      } else {
        console.error('Could not fetch asset details for:', ipId);
      }
    } catch (error) {
      console.error('Error fetching nested asset details:', error);
    } finally {
      setLoadingNestedAsset(false);
    }
  };

  const fetchCompleteMetadata = async () => {
    try {
      const { MetadataService } = await import('../../../lib/services/metadataService');
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
    } catch (error) {
      console.error('Error fetching complete metadata:', error);
      setCompleteMetadata(null);
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
    { id: 'technical', label: 'Technical' }
  ];

  if (!isOpen) return null;

  // Use enhanced metadata for display
  const displayName = enhancedMetadata?.nftName || enhancedMetadata?.ipTitle || asset.name || 'Unnamed Asset';
  const displayImage = enhancedMetadata?.nftImage || asset.nftMetadata?.imageUrl;
  const displayDescription = enhancedMetadata?.nftDescription || enhancedMetadata?.ipDescription;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
        
        <div className="relative h-full flex items-center justify-center p-4">
          {/* FIXED SIZE MODAL - Max width 5xl, Fixed height */}
          <div className="relative bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            
            {/* Header - Fixed height */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-zinc-800/50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-lg font-medium text-white truncate">{displayName}</h2>
                    <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-xs">
                      {asset.type}
                    </span>
                    <span className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded text-xs">
                      Available
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
                  </button>
                ))}
              </div>
            </div>
            
            {/* Content - Scrollable area with fixed height */}
            <div className="flex-1 min-h-0 px-6 pb-4">
              {/* OVERVIEW TAB - Compact Layout */}
              {activeDetailTab === 'overview' && (
                <div className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800">
                  <div className="space-y-4">
                    {/* Compact Main Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Left: Media + Quick Info */}
                      <div className="space-y-3">
                        {/* Media Container - Enhanced Video Support */}
                        <div className="aspect-video bg-gradient-to-br from-zinc-800/50 to-zinc-700/50 rounded-lg overflow-hidden relative group">
                          {enhancedMetadata?.loading ? (
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
                            const videoUrl = completeMetadata?.nftMetadata?.animation_url || 
                                           (completeMetadata?.nftMetadata?.external_url?.includes('.mp4') ? completeMetadata?.nftMetadata?.external_url : null) ||
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
                          {!enhancedMetadata?.loading && (
                            <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded">
                              <span className="text-xs text-white font-medium flex items-center">
                                {(() => {
                                  const imageIsVideo = displayImage && (
                                    displayImage.toLowerCase().includes('.mp4') ||
                                    displayImage.toLowerCase().includes('.webm') ||
                                    displayImage.toLowerCase().includes('.mov')
                                  );
                                  
                                  if (completeMetadata?.nftMetadata?.animation_url || imageIsVideo) {
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
                        {(displayImage || completeMetadata?.nftMetadata?.animation_url) && (
                          <div className="grid grid-cols-2 gap-2">
                            {completeMetadata?.nftMetadata?.external_url && (
                              <a 
                                href={completeMetadata.nftMetadata.external_url}
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
                                
                                if (completeMetadata?.nftMetadata?.animation_url || imageIsVideo) return 'Video NFT';
                                if (displayImage) return 'Image NFT';
                                return 'Digital Asset';
                              })()}
                            </span>
                            <span className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded text-xs font-medium">
                              Available
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
                      </div>
                    </div>

                    {/* Data Sources - Compact */}
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

                    {/* External Resources - Compact */}
                    {(completeMetadata?.nftMetadata?.external_url || completeMetadata?.nftMetadata?.animation_url) && (
                      <div className="bg-zinc-900/40 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-white mb-2 flex items-center">
                          <svg className="w-4 h-4 mr-1 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          External Links
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {completeMetadata.nftMetadata.external_url && (
                            <a 
                              href={completeMetadata.nftMetadata.external_url}
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
                          {completeMetadata.nftMetadata.animation_url && completeMetadata.nftMetadata.animation_url !== completeMetadata.nftMetadata.external_url && (
                            <a 
                              href={completeMetadata.nftMetadata.animation_url}
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

              {/* Other tabs with proper scrolling */}
              {activeDetailTab === 'family' && (
                <div className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800">
                  <MarketplaceFamilyTree 
                    currentAsset={asset} 
                    onViewAssetDetails={handleViewAssetDetails}
                  />
                  
                  {/* Loading indicator for nested asset */}
                  {loadingNestedAsset && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
                      <div className="bg-zinc-900 rounded-lg p-4 flex items-center space-x-3">
                        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-white">Loading asset details...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeDetailTab === 'licensing' && (
                <div className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800">
                  <MarketplaceLicensingInfo ipId={asset.ipId} />
                </div>
              )}

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
                            onClick={() => copyToClipboard(asset.transactionHash)}
                            className="block text-sm text-blue-400 hover:text-blue-300 transition-colors font-mono"
                            title="Click to copy"
                          >
                            {truncateHash(asset.transactionHash)}
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

                    {/* NFT Properties & Traits - MOVED to Technical Tab */}
                    {completeMetadata?.nftMetadata?.attributes && Array.isArray(completeMetadata.nftMetadata.attributes) && completeMetadata.nftMetadata.attributes.length > 0 && (
                      <div className="bg-zinc-900/40 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-white mb-3 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          NFT Properties & Traits
                        </h3>
                        <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
                          <div className="grid grid-cols-2 gap-3 pr-2">
                            {completeMetadata.nftMetadata.attributes.map((attr: any, index: number) => (
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
                        {completeMetadata.nftMetadata.attributes.length > 12 && (
                          <div className="mt-3 text-center">
                            <p className="text-xs text-zinc-500">
                              Showing all {completeMetadata.nftMetadata.attributes.length} properties
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Nested Asset Details Modal */}
      {nestedAssetId && nestedAssetData && (
        <MarketplaceAssetDetails
          isOpen={!!nestedAssetId}
          onClose={() => {
            setNestedAssetId(null);
            setNestedAssetData(null);
          }}
          asset={nestedAssetData}
          enhancedMetadata={undefined}
        />
      )}
    </>
  );
};

interface IPEdge {
  id: string;
  parentIpId: string;
  childIpId: string;
  licenseTemplate?: string;
  licenseTermsId?: string;
  blockNumber: string;
  blockTimestamp?: string;
  transactionHash?: string;
}

interface FamilyNode {
  id: string;
  name: string;
  type: 'ancestor' | 'parent' | 'current' | 'child' | 'descendant';
  level: number;
  x?: number;
  y?: number;
  children?: FamilyNode[];
  parents?: FamilyNode[];
  edge?: IPEdge;
}

interface EnhancedMetadata {
  loading: boolean;
  nftImage?: string;
  nftName?: string;
  nftDescription?: string;
  ipTitle?: string;
  ipDescription?: string;
  nftAttributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  externalUrl?: string;
  animationUrl?: string;
  backgroundColor?: string;
  error?: string;
}
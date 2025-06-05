"use client";

import React, { useState, useEffect } from 'react';
import { LicenseConfigurationModal } from './licensingConfiguration';

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

interface IPAssetDetails {
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
}

const StoryAPIService = {
  async getFullIPDetails(ipId: string): Promise<IPAssetDetails | null> {
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

// Enhanced FamilyTreeVisualization with real-time data
const MarketplaceFamilyTree: React.FC<{ currentAsset: IPAsset }> = ({ currentAsset }) => {
  const [relationships, setRelationships] = useState<{
    parents: number;
    children: number;
    ancestors: number;
    descendants: number;
  }>({ parents: 0, children: 0, ancestors: 0, descendants: 0 });
  const [loading, setLoading] = useState(true);
  const [relationshipData, setRelationshipData] = useState<any>(null);

  useEffect(() => {
    const fetchRelationships = async () => {
      try {
        setLoading(true);
        
        // Fetch real-time relationship data
        const response = await fetch(`/api/ip-edges?action=relationships&ipId=${currentAsset.ipId}`);
        if (response.ok) {
          const data = await response.json();
          setRelationshipData(data);
          
          // Calculate relationship counts
          const parents = data.parents?.length || 0;
          const children = data.children?.length || 0;
          
          // Calculate ancestors and descendants by traversing the tree
          const ancestors = new Set();
          const descendants = new Set();
          
          // Add direct parents to ancestors
          data.parents?.forEach((edge: any) => {
            ancestors.add(edge.parentIpId);
          });
          
          // Add direct children to descendants
          data.children?.forEach((edge: any) => {
            descendants.add(edge.ipId);
          });
          
          setRelationships({
            parents,
            children,
            ancestors: ancestors.size,
            descendants: descendants.size
          });
        }
      } catch (error) {
        console.error('Error fetching relationships:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentAsset.ipId) {
      fetchRelationships();
    }
  }, [currentAsset.ipId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-zinc-400">Loading family tree...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-zinc-900/40 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-400 mb-1">{relationships.parents}</div>
          <div className="text-xs text-zinc-400">Parents</div>
        </div>
        <div className="bg-zinc-900/40 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-purple-400 mb-1">{relationships.children}</div>
          <div className="text-xs text-zinc-400">Children</div>
        </div>
        <div className="bg-zinc-900/40 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-green-400 mb-1">{relationships.ancestors}</div>
          <div className="text-xs text-zinc-400">Ancestors</div>
        </div>
        <div className="bg-zinc-900/40 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-yellow-400 mb-1">{relationships.descendants}</div>
          <div className="text-xs text-zinc-400">Descendants</div>
        </div>
      </div>

      {relationshipData && (relationshipData.parents?.length > 0 || relationshipData.children?.length > 0) && (
        <div className="space-y-3">
          {relationshipData.parents?.length > 0 && (
            <div className="bg-zinc-900/40 rounded-lg p-3">
              <h4 className="text-xs font-medium text-blue-400 mb-2">Parent IPs ({relationshipData.parents.length})</h4>
              <div className="space-y-1">
                {relationshipData.parents.slice(0, 5).map((edge: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-mono">{edge.parentIpId.slice(0, 8)}...{edge.parentIpId.slice(-6)}</span>
                    <span className="text-zinc-500">Block {edge.blockNumber}</span>
                  </div>
                ))}
                {relationshipData.parents.length > 5 && (
                  <div className="text-xs text-zinc-500 text-center">
                    +{relationshipData.parents.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}

          {relationshipData.children?.length > 0 && (
            <div className="bg-zinc-900/40 rounded-lg p-3">
              <h4 className="text-xs font-medium text-purple-400 mb-2">Child IPs ({relationshipData.children.length})</h4>
              <div className="space-y-1">
                {relationshipData.children.slice(0, 5).map((edge: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-mono">{edge.ipId.slice(0, 8)}...{edge.ipId.slice(-6)}</span>
                    <span className="text-zinc-500">Block {edge.blockNumber}</span>
                  </div>
                ))}
                {relationshipData.children.length > 5 && (
                  <div className="text-xs text-zinc-500 text-center">
                    +{relationshipData.children.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {relationships.parents === 0 && relationships.children === 0 && (
        <div className="text-center py-6">
          <div className="bg-zinc-900/40 rounded-lg p-4">
            <svg className="w-8 h-8 text-zinc-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <p className="text-xs text-zinc-400 mb-1">Independent Asset</p>
            <p className="text-xs text-zinc-500">This IP has no parent or child relationships</p>
          </div>
        </div>
      )}
    </div>
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
export const MarketplaceAssetDetails: React.FC<MarketplaceAssetDetailsProps> = ({ isOpen, onClose, asset }) => {
  const [activeDetailTab, setActiveDetailTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [fullDetails, setFullDetails] = useState<IPAssetDetails | null>(null);

  useEffect(() => {
    if (isOpen && asset.ipId) {
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
    { id: 'technical', label: 'Technical' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative h-full flex items-center justify-center p-4">
        <div className="relative bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-4xl min-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
          
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-zinc-800/50">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className="text-xl font-medium text-white truncate">{asset.name || 'IP Asset Details'}</h2>
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

          {/* Tab Navigation */}
          <div className="px-6 pt-4 flex-shrink-0">
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
                            const nextSibling = target.nextElementSibling as HTMLElement;
                            if (nextSibling) {
                              nextSibling.classList.remove('hidden');
                            }
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
                    <div className="bg-zinc-900/40 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-white mb-2">{asset.name || 'Unnamed Asset'}</h3>
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
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zinc-400">Block Number:</span>
                          <span className="text-sm text-white font-mono">{asset.blockNumber}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status and Core Metrics */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-zinc-900/40 rounded-lg p-3">
                        <p className="text-xs text-zinc-500 mb-1">Status</p>
                        <div className="inline-flex px-2 py-1 rounded text-xs font-medium bg-green-500/10 text-green-400">
                          Available
                        </div>
                      </div>
                      
                      <div className="bg-zinc-900/40 rounded-lg p-3">
                        <p className="text-xs text-zinc-500 mb-1">Asset Type</p>
                        <span className="text-xs text-white">
                          {asset.nftMetadata?.tokenUri?.toLowerCase().includes('image') ? 'Image' : 
                           asset.nftMetadata?.tokenUri?.toLowerCase().includes('video') ? 'Video' :
                           asset.nftMetadata?.tokenUri?.toLowerCase().includes('audio') ? 'Audio' : 'Digital Asset'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Technical Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h4 className="text-sm font-medium text-blue-400">Contract Details</h4>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-xs text-zinc-400">Contract:</span>
                        <button 
                          onClick={() => copyToClipboard(asset.tokenContract)}
                          className="text-xs text-blue-300 hover:text-blue-200 font-mono"
                          title="Click to copy"
                        >
                          {truncateHash(asset.tokenContract)}
                        </button>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-zinc-400">Token ID:</span>
                        <span className="text-xs text-zinc-300 font-mono">{asset.tokenId}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <h4 className="text-sm font-medium text-purple-400">Blockchain Info</h4>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-xs text-zinc-400">Transaction:</span>
                        <button 
                          onClick={() => copyToClipboard(asset.transactionHash)}
                          className="text-xs text-purple-300 hover:text-purple-200 font-mono"
                          title="Click to copy"
                        >
                          {truncateHash(asset.transactionHash)}
                        </button>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-zinc-400">Timestamp:</span>
                        <span className="text-xs text-zinc-300">
                          {asset.blockTimestamp ? new Date(parseInt(asset.blockTimestamp) * 1000).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
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
              <MarketplaceFamilyTree currentAsset={asset} />
            )}

            {/* Licensing Tab */}
            {activeDetailTab === 'licensing' && (
              <MarketplaceLicensingInfo ipId={asset.ipId} />
            )}

            {/* Technical Tab */}
            {activeDetailTab === 'technical' && (
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

                <div className="bg-zinc-900/40 rounded-lg p-4">
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
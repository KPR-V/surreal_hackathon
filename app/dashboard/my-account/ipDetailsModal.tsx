import React, { useState, useEffect } from 'react';

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
}

interface IPAssetDetails {
  // Basic asset details
  id: string;
  ipId: string;
  ancestorCount: number;
  descendantCount: number;
  childrenCount: number;
  parentCount: number;
  rootCount: number;
  rootIpIds: string[];
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
  isGroup: boolean;
  latestArbitrationPolicy: string;
  nftMetadata: {
    chainId: string;
    imageUrl: string;
    name: string;
    tokenContract: string;
    tokenId: string;
    tokenUri: string;
  };
  // Metadata details
  metadata?: {
    id: string;
    metadataHash: string;
    metadataJson: any;
    metadataUri: string;
    nftMetadataHash: string;
    nftTokenUri: string;
    registrationDate: string;
  };
}

interface IPDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: IPAsset;
}

// Enhanced StoryAPIService for modal
class StoryAPIService {
  private static readonly API_BASE_URL = 'https://api.storyapis.com/api/v3';
  private static readonly API_KEY = process.env.NEXT_PUBLIC_STORY_API_KEY || 'MhBsxkU1z9fG6TofE59KqiiWV-YlYE8Q4awlLQehF3U';
  private static readonly CHAIN = 'story-aeneid';

  static async fetchIPAssetDetails(assetId: string): Promise<any> {
    try {
      console.log(`Making API call to: ${this.API_BASE_URL}/assets/${assetId}`);
      
      const options = {
        method: 'GET',
        headers: {
          'X-Api-Key': this.API_KEY,
          'X-Chain': this.CHAIN
        }
      };

      const response = await fetch(`${this.API_BASE_URL}/assets/${assetId}`, options);
      
      console.log(`Asset details response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Asset details response:', data);
      return data.data || {};
    } catch (error) {
      console.error('Error fetching IP asset details:', error);
      throw error;
    }
  }

  static async fetchIPAssetMetadata(assetId: string): Promise<any> {
    try {
      console.log(`Making metadata API call to: ${this.API_BASE_URL}/assets/${assetId}/metadata`);
      
      const options = {
        method: 'GET',
        headers: {
          'X-Api-Key': this.API_KEY,
          'X-Chain': this.CHAIN
        }
      };

      const response = await fetch(`${this.API_BASE_URL}/assets/${assetId}/metadata`, options);
      
      console.log(`Metadata response status: ${response.status}`);
      
      if (!response.ok) {
        // Don't throw error for metadata - it might not exist for all assets
        console.warn(`Metadata not found for asset ${assetId}: ${response.status}`);
        return null;
      }
      
      const data = await response.json();
      console.log('Metadata response:', data);
      return data || {};
    } catch (error) {
      console.warn('Error fetching IP asset metadata (non-critical):', error);
      return null;
    }
  }
}

export const IPDetailsModal: React.FC<IPDetailsModalProps> = ({ isOpen, onClose, asset }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assetDetails, setAssetDetails] = useState<IPAssetDetails | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState('overview');

  useEffect(() => {
    if (isOpen && asset.ipId) {
      fetchAssetDetails();
    }
  }, [isOpen, asset.ipId]);

  const fetchAssetDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching detailed information for asset: ${asset.ipId}`);
      console.log('Full asset object:', asset);
      
      // First, try to fetch basic asset details
      const details = await StoryAPIService.fetchIPAssetDetails(asset.ipId);
      
      // Then try to fetch metadata (this might fail and that's okay)
      const metadata = await StoryAPIService.fetchIPAssetMetadata(asset.ipId);

      console.log('Asset details:', details);
      console.log('Asset metadata:', metadata);

      const combinedDetails: IPAssetDetails = {
        ...details,
        metadata: metadata
      };

      setAssetDetails(combinedDetails);
    } catch (err) {
      console.error('Error fetching asset details:', err);
      setError('Failed to load asset details. The asset might not exist or the API might be temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return 'N/A';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  const truncateHash = (hash?: string, length = 8) => {
    if (!hash) return 'N/A';
    return `${hash.slice(0, length)}...${hash.slice(-length)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const renderMetadataJson = (json: any) => {
    if (!json) return 'No metadata available';
    
    try {
      return JSON.stringify(json, null, 2);
    } catch {
      return 'Invalid JSON data';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/30 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-zinc-700/20">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-pink-500/20 rounded-xl flex items-center justify-center border border-blue-500/20">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 011-1h1m0 0V3a2 2 0 011-1h1" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-light text-white">{asset.name}</h2>
              <p className="text-sm text-zinc-400">Asset Details</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-300 transition-colors rounded-lg hover:bg-zinc-800/50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-8 pt-6">
          <div className="flex space-x-1 bg-zinc-800/30 rounded-xl p-1">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'family', label: 'IP Family' },
              { id: 'metadata', label: 'Metadata' },
              { id: 'technical', label: 'Technical' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveDetailTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeDetailTab === tab.id
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-zinc-400">Loading asset details...</span>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <div className="text-sm text-zinc-500 mb-4">
                <p>Asset ID: {asset.ipId}</p>
                <p>This might be a test asset or the API endpoint might have changed.</p>
              </div>
              <button 
                onClick={fetchAssetDetails}
                className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all duration-200"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overview Tab */}
              {activeDetailTab === 'overview' && (
                <div className="space-y-6">
                  {/* Asset Image and Basic Info */}
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/3">
                      <div className="aspect-square bg-gradient-to-br from-zinc-800/50 to-zinc-700/50 rounded-xl flex items-center justify-center overflow-hidden">
                        {(assetDetails?.nftMetadata?.imageUrl || asset.nftMetadata?.imageUrl) ? (
                          <img 
                            src={assetDetails?.nftMetadata?.imageUrl || asset.nftMetadata?.imageUrl} 
                            alt={asset.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg className="w-16 h-16 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                    </div>
                    
                    <div className="md:w-2/3 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-800/30 rounded-xl p-4">
                          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Asset Type</p>
                          <p className="text-white font-medium">{asset.type}</p>
                        </div>
                        <div className="bg-zinc-800/30 rounded-xl p-4">
                          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Status</p>
                          <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-medium ${
                            asset.status === 'Active' 
                              ? 'bg-green-500/10 text-green-400' 
                              : 'bg-yellow-500/10 text-yellow-400'
                          }`}>
                            {asset.status}
                          </span>
                        </div>
                        <div className="bg-zinc-800/30 rounded-xl p-4">
                          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">PIL Status</p>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              asset.pilAttached ? 'bg-blue-400' : 'bg-zinc-600'
                            }`}></div>
                            <span className="text-white text-sm">
                              {asset.pilAttached ? 'Attached' : 'Not Attached'}
                            </span>
                          </div>
                        </div>
                        <div className="bg-zinc-800/30 rounded-xl p-4">
                          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Group Asset</p>
                          <span className="text-white text-sm">
                            {assetDetails?.isGroup || asset.isGroup ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Asset IDs */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-500">IP Asset ID:</span>
                          <button 
                            onClick={() => copyToClipboard(asset.ipId)}
                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-mono"
                            title="Click to copy"
                          >
                            {truncateHash(asset.ipId, 12)}
                          </button>
                        </div>
                        
                        {(assetDetails?.nftMetadata?.tokenContract || asset.tokenContract) && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-500">Token Contract:</span>
                            <button 
                              onClick={() => copyToClipboard(assetDetails?.nftMetadata?.tokenContract || asset.tokenContract)}
                              className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-mono"
                              title="Click to copy"
                            >
                              {truncateHash(assetDetails?.nftMetadata?.tokenContract || asset.tokenContract, 12)}
                            </button>
                          </div>
                        )}
                        
                        {(assetDetails?.nftMetadata?.tokenId || asset.tokenId) && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-500">Token ID:</span>
                            <span className="text-sm text-white font-mono">
                              {assetDetails?.nftMetadata?.tokenId || asset.tokenId}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* IP Family Tab */}
              {activeDetailTab === 'family' && (
                <div className="space-y-6">
                  {/* Family Tree Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-zinc-800/30 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-green-400 mb-1">
                        {assetDetails?.ancestorCount || asset.ancestorCount || 0}
                      </div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider">Ancestors</p>
                    </div>
                    <div className="bg-zinc-800/30 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-orange-400 mb-1">
                        {assetDetails?.parentCount || asset.parentCount || 0}
                      </div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider">Parents</p>
                    </div>
                    <div className="bg-zinc-800/30 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-blue-400 mb-1">
                        {assetDetails?.childrenCount || asset.childrenCount || 0}
                      </div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider">Children</p>
                    </div>
                    <div className="bg-zinc-800/30 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-purple-400 mb-1">
                        {assetDetails?.descendantCount || asset.descendantCount || 0}
                      </div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider">Descendants</p>
                    </div>
                  </div>

                  {/* Root IPs */}
                  {(assetDetails?.rootIpIds || asset.rootIpIds) && (assetDetails?.rootIpIds || asset.rootIpIds)!.length > 0 && (
                    <div className="bg-zinc-800/30 rounded-xl p-6">
                      <h3 className="text-lg font-medium text-white mb-4">Root IP Assets</h3>
                      <div className="space-y-2">
                        {(assetDetails?.rootIpIds || asset.rootIpIds)!.map((rootId, index) => (
                          <div key={index} className="flex justify-between items-center py-2 px-3 bg-zinc-700/30 rounded-lg">
                            <span className="text-sm text-zinc-400">Root IP #{index + 1}:</span>
                            <button 
                              onClick={() => copyToClipboard(rootId)}
                              className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-mono"
                              title="Click to copy"
                            >
                              {truncateHash(rootId, 12)}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Family Tree Visualization Placeholder */}
                  <div className="bg-zinc-800/30 rounded-xl p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-zinc-700/50 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 5v4" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 5v4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Family Tree Visualization</h3>
                    <p className="text-sm text-zinc-500">Interactive family tree coming soon</p>
                  </div>
                </div>
              )}

              {/* Metadata Tab */}
              {activeDetailTab === 'metadata' && (
                <div className="space-y-6">
                  {assetDetails?.metadata ? (
                    <>
                      {/* Metadata Overview */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium text-white">Metadata Information</h3>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-zinc-500">Metadata Hash:</span>
                              <button 
                                onClick={() => copyToClipboard(assetDetails.metadata?.metadataHash || '')}
                                className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-mono"
                                title="Click to copy"
                              >
                                {truncateHash(assetDetails.metadata?.metadataHash)}
                              </button>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-zinc-500">NFT Metadata Hash:</span>
                              <button 
                                onClick={() => copyToClipboard(assetDetails.metadata?.nftMetadataHash || '')}
                                className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-mono"
                                title="Click to copy"
                              >
                                {truncateHash(assetDetails.metadata?.nftMetadataHash)}
                              </button>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-zinc-500">Registration Date:</span>
                              <span className="text-sm text-white">
                                {formatDate(assetDetails.metadata?.registrationDate)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium text-white">URI Information</h3>
                          
                          <div className="space-y-3">
                            <div>
                              <span className="text-sm text-zinc-500 block mb-1">Metadata URI:</span>
                              <div className="bg-zinc-800/50 rounded-lg p-3">
                                <button 
                                  onClick={() => copyToClipboard(assetDetails.metadata?.metadataUri || '')}
                                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors break-all"
                                  title="Click to copy"
                                >
                                  {assetDetails.metadata?.metadataUri || 'N/A'}
                                </button>
                              </div>
                            </div>
                            
                            <div>
                              <span className="text-sm text-zinc-500 block mb-1">NFT Token URI:</span>
                              <div className="bg-zinc-800/50 rounded-lg p-3">
                                <button 
                                  onClick={() => copyToClipboard(assetDetails.metadata?.nftTokenUri || '')}
                                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors break-all"
                                  title="Click to copy"
                                >
                                  {assetDetails.metadata?.nftTokenUri || 'N/A'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Metadata JSON */}
                      {assetDetails.metadata.metadataJson && (
                        <div>
                          <h3 className="text-lg font-medium text-white mb-4">Metadata JSON</h3>
                          <div className="bg-zinc-800/50 rounded-xl p-4">
                            <pre className="text-sm text-zinc-300 overflow-x-auto whitespace-pre-wrap">
                              {renderMetadataJson(assetDetails.metadata.metadataJson)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-zinc-800/30 rounded-xl p-8 text-center">
                      <p className="text-zinc-400 mb-4">No metadata available for this asset</p>
                      <p className="text-sm text-zinc-500">
                        The metadata endpoint returned a 404 error. This might be normal for certain types of assets.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Technical Tab */}
              {activeDetailTab === 'technical' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Blockchain Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white">Blockchain Information</h3>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-500">Block Number:</span>
                          <span className="text-sm text-white font-mono">
                            {assetDetails?.blockNumber || asset.blockNumber || 'N/A'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-500">Block Timestamp:</span>
                          <span className="text-sm text-white">
                            {formatTimestamp(assetDetails?.blockTimestamp || asset.blockTimestamp)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-500">Chain ID:</span>
                          <span className="text-sm text-white">
                            {assetDetails?.nftMetadata?.chainId || asset.nftMetadata?.chainId || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Policy Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white">Policy Information</h3>
                      
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-zinc-500 block mb-1">Latest Arbitration Policy:</span>
                          <div className="bg-zinc-800/50 rounded-lg p-3">
                            <button 
                              onClick={() => copyToClipboard(assetDetails?.latestArbitrationPolicy || asset.latestArbitrationPolicy || '')}
                              className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-mono break-all"
                              title="Click to copy"
                            >
                              {(assetDetails?.latestArbitrationPolicy || asset.latestArbitrationPolicy) ? 
                                truncateHash(assetDetails?.latestArbitrationPolicy || asset.latestArbitrationPolicy, 16) : 
                                'N/A'
                              }
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Information */}
                  {(assetDetails?.transactionHash || asset.transactionHash) && (
                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">Transaction Information</h3>
                      <div className="bg-zinc-800/30 rounded-xl p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-500">Transaction Hash:</span>
                          <button 
                            onClick={() => copyToClipboard(assetDetails?.transactionHash || asset.transactionHash || '')}
                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-mono"
                            title="Click to copy"
                          >
                            {truncateHash(assetDetails?.transactionHash || asset.transactionHash, 16)}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 border-t border-zinc-700/20 flex justify-between items-center">
          <div className="text-sm text-zinc-500">
            Asset ID: {truncateHash(asset.ipId, 12)}
          </div>
          
          <div className="flex space-x-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-300 rounded-lg text-sm font-medium transition-all duration-200 border border-zinc-700/20"
            >
              Close
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-pink-500/20 hover:from-blue-500/30 hover:to-pink-500/30 text-blue-300 rounded-lg text-sm font-medium transition-all duration-200 border border-blue-500/20">
              Manage Asset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
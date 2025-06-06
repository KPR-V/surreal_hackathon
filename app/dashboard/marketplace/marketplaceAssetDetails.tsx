"use client";

import React, { useState, useEffect, useRef } from 'react';
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

// Update the MarketplaceFamilyTree component to match the enhanced version from ipDetailsModal
const MarketplaceFamilyTree: React.FC<{ currentAsset: IPAsset }> = ({ currentAsset }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [familyTree, setFamilyTree] = useState<FamilyNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [relationships, setRelationships] = useState<{
    parents: IPEdge[];
    children: IPEdge[];
  }>({ parents: [], children: [] });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRealRelationships();
  }, [currentAsset.ipId]);

  const fetchRealRelationships = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching real relationships for:', currentAsset.ipId);
      
      const response = await fetch(`/api/ip-edges?action=relationships&ipId=${currentAsset.ipId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch relationships: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Relationship data received:', data);
      
      const parentEdges = data.parents || [];
      const childEdges = data.children || [];
      
      setRelationships({
        parents: parentEdges,
        children: childEdges
      });
      
      // Generate family tree with real data
      generateRealFamilyTree(parentEdges, childEdges);
      
    } catch (error) {
      console.error('Error fetching relationships:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      
      // Generate empty tree on error
      generateRealFamilyTree([], []);
    } finally {
      setLoading(false);
    }
  };

  const generateRealFamilyTree = (parentEdges: IPEdge[], childEdges: IPEdge[]) => {
    const tree: FamilyNode = {
      id: currentAsset.ipId,
      name: currentAsset.name || 'Current Asset',
      type: 'current',
      level: 0,
      children: [],
      parents: []
    };

    // Generate parents from real data
    if (parentEdges.length > 0) {
      tree.parents = parentEdges.map((edge) => ({
        id: edge.parentIpId,
        name: `IP Asset ${edge.parentIpId.slice(0, 8)}...`,
        type: 'parent' as const,
        level: -1,
        children: [],
        edge: edge
      }));
    }

    // Generate children from real data
    if (childEdges.length > 0) {
      tree.children = childEdges.map((edge) => ({
        id: edge.childIpId,
        name: `IP Asset ${edge.childIpId.slice(0, 8)}...`,
        type: 'child' as const,
        level: 1,
        children: [],
        edge: edge
      }));
    }

    setFamilyTree(tree);
    layoutTree(tree);
  };

  const layoutTree = (tree: FamilyNode) => {
    const width = 800;
    const height = 500;
    const nodeWidth = 140;
    const nodeHeight = 60;
    const levelHeight = 120;
    const padding = 80;

    const parentCount = tree.parents?.length || 0;
    const childCount = tree.children?.length || 0;
    
    // Position current node in center
    tree.x = width / 2;
    tree.y = padding + levelHeight;

    // Position parents above current node
    if (tree.parents && tree.parents.length > 0) {
      const parentSpacing = Math.min(200, (width - 100) / tree.parents.length);
      const startX = width / 2 - ((tree.parents.length - 1) * parentSpacing) / 2;
      
      tree.parents.forEach((parent, index) => {
        parent.x = startX + index * parentSpacing;
        parent.y = padding;
      });
    }

    // Position children below current node
    if (tree.children && tree.children.length > 0) {
      const childSpacing = Math.min(160, (width - 100) / tree.children.length);
      const startX = width / 2 - ((tree.children.length - 1) * childSpacing) / 2;
      
      tree.children.forEach((child, index) => {
        child.x = startX + index * childSpacing;
        child.y = tree.y! + levelHeight;
      });
    }

    // Calculate required height
    const maxY = Math.max(
      tree.y!,
      ...(tree.parents?.map(p => p.y!) || [0]),
      ...(tree.children?.map(c => c.y!) || [0])
    );
    
    const actualHeight = maxY + nodeHeight + padding;
    (tree as any).svgHeight = Math.max(actualHeight, 300);
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'current': return { bg: 'bg-blue-500/20', border: 'border-blue-400', text: 'text-blue-300' };
      case 'parent': return { bg: 'bg-green-500/20', border: 'border-green-400', text: 'text-green-300' };
      case 'child': return { bg: 'bg-orange-500/20', border: 'border-orange-400', text: 'text-orange-300' };
      default: return { bg: 'bg-zinc-500/20', border: 'border-zinc-400', text: 'text-zinc-300' };
    }
  };

  const truncateText = (text: string, maxLength: number = 12) => {
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  const renderConnections = (tree: FamilyNode) => {
    const connections: React.JSX.Element[] = [];

    // Parent connections
    if (tree.parents) {
      tree.parents.forEach((parent, index) => {
        connections.push(
          <line
            key={`parent-connection-${index}`}
            x1={parent.x}
            y1={parent.y! + 30}
            x2={tree.x}
            y2={tree.y! - 30}
            stroke="rgb(113 113 122 / 0.4)"
            strokeWidth="2"
            strokeDasharray="4,4"
          />
        );
      });
    }

    // Child connections
    if (tree.children) {
      tree.children.forEach((child, index) => {
        connections.push(
          <line
            key={`child-connection-${index}`}
            x1={tree.x}
            y1={tree.y! + 30}
            x2={child.x}
            y2={child.y! - 30}
            stroke="rgb(113 113 122 / 0.4)"
            strokeWidth="2"
          />
        );
      });
    }

    return connections;
  };

  const renderNode = (node: FamilyNode) => {
    const colors = getNodeColor(node.type);
    const isSelected = selectedNode === node.id;
    const isCurrent = node.type === 'current';
    
    return (
      <g
        key={node.id}
        className="cursor-pointer transition-all duration-200"
        onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
      >
        <rect
          x={node.x! - 70}
          y={node.y! - 30}
          width="140"
          height="60"
          className={`${colors.bg} ${colors.border} ${isSelected ? 'opacity-100' : 'opacity-80'} ${
            isCurrent ? 'stroke-2' : 'stroke-1'
          }`}
          fill="currentColor"
          stroke="currentColor"
          rx="8"
          style={{
            filter: isSelected ? 'drop-shadow(0 0 10px rgb(59 130 246 / 0.5))' : 'none'
          }}
        />

        <text
          x={node.x}
          y={node.y! - 5}
          textAnchor="middle"
          className={`fill-current text-xs font-medium ${colors.text}`}
        >
          {truncateText(node.name)}
        </text>

        <text
          x={node.x}
          y={node.y! + 10}
          textAnchor="middle"
          className="fill-current text-xs text-zinc-500"
        >
          {node.type}
        </text>

        {isCurrent && (
          <circle
            cx={node.x! + 55}
            cy={node.y! - 20}
            r="4"
            className="fill-blue-400"
          />
        )}
      </g>
    );
  };

  const getSelectedNodeDetails = () => {
    if (!selectedNode || !familyTree) return null;
    
    const findNode = (node: FamilyNode): FamilyNode | null => {
      if (node.id === selectedNode) return node;
      
      const fromParents = node.parents?.find(p => p.id === selectedNode);
      if (fromParents) return fromParents;
      
      const fromChildren = node.children?.find(c => c.id === selectedNode);
      if (fromChildren) return fromChildren;
      
      return null;
    };

    return findNode(familyTree);
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toLocaleDateString();
    } catch {
      return 'N/A';
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

  if (error) {
    return (
      <div className="text-center py-6">
        <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/20">
          <svg className="w-8 h-8 text-red-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-xs text-red-400 mb-1">Failed to Load Relationships</p>
          <p className="text-xs text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!familyTree) {
    return (
      <div className="text-center py-6">
        <div className="bg-zinc-900/40 rounded-lg p-4">
          <svg className="w-8 h-8 text-zinc-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <p className="text-xs text-zinc-400 mb-1">No family tree data available</p>
        </div>
      </div>
    );
  }

  const selectedNodeDetails = getSelectedNodeDetails();

  return (
    <div className="space-y-4">
      {/* Relationship Statistics - Only Parents and Children */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900/40 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-green-400 mb-1">{relationships.parents.length}</div>
          <div className="text-xs text-zinc-400">Parents</div>
        </div>
        <div className="bg-zinc-900/40 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-orange-400 mb-1">{relationships.children.length}</div>
          <div className="text-xs text-zinc-400">Children</div>
        </div>
      </div>

      {/* Family Tree Visualization */}
      {(relationships.parents.length > 0 || relationships.children.length > 0) ? (
        <>
          <div className="bg-zinc-900/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-white mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Family Tree Visualization
            </h4>
            
            {/* SVG Container */}
            <div className="relative overflow-auto rounded-lg bg-zinc-900/50 border border-zinc-700/20 max-h-80">
              <svg
                ref={svgRef}
                width="800"
                height={(familyTree as any).svgHeight || 300}
                className="w-full h-full"
              >
                {renderConnections(familyTree)}
                {renderNode(familyTree)}
                {familyTree.parents?.map(renderNode)}
                {familyTree.children?.map(renderNode)}
              </svg>
            </div>
          </div>

          {/* Selected Node Details */}
          {selectedNodeDetails && (
            <div className="bg-zinc-900/40 rounded-lg p-4 border border-zinc-600/30">
              <h4 className="text-sm font-medium text-white mb-2">{selectedNodeDetails.name}</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-zinc-500">Type:</span>
                  <span className="text-zinc-300 ml-1">{selectedNodeDetails.type}</span>
                </div>
                <div>
                  <span className="text-zinc-500">ID:</span>
                  <span className="text-zinc-300 ml-1 font-mono">{selectedNodeDetails.id.slice(0, 8)}...</span>
                </div>
                {selectedNodeDetails.edge && (
                  <>
                    <div>
                      <span className="text-zinc-500">License:</span>
                      <span className="text-zinc-300 ml-1">{selectedNodeDetails.edge.licenseTemplate || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Block:</span>
                      <span className="text-zinc-300 ml-1">{selectedNodeDetails.edge.blockNumber}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-6">
          <div className="bg-zinc-900/40 rounded-lg p-6">
            <svg className="w-12 h-12 text-zinc-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <p className="text-sm text-zinc-400 mb-1">Independent Asset</p>
            <p className="text-xs text-zinc-500">This IP has no parent or child relationships</p>
          </div>
        </div>
      )}

      {/* Detailed Relationship Lists - unchanged */}
      {(relationships.parents.length > 0 || relationships.children.length > 0) && (
        <div className="space-y-3">
          {/* Parent IPs */}
          {relationships.parents.length > 0 && (
            <div className="bg-zinc-900/40 rounded-lg p-3">
              <h4 className="text-xs font-medium text-green-400 mb-2">Parent IPs ({relationships.parents.length})</h4>
              <div className="space-y-1">
                {relationships.parents.slice(0, 5).map((edge, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-mono">{edge.parentIpId.slice(0, 8)}...{edge.parentIpId.slice(-6)}</span>
                    <span className="text-zinc-500">Block {edge.blockNumber}</span>
                  </div>
                ))}
                {relationships.parents.length > 5 && (
                  <div className="text-xs text-zinc-500 text-center">
                    +{relationships.parents.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Child IPs */}
          {relationships.children.length > 0 && (
            <div className="bg-zinc-900/40 rounded-lg p-3">
              <h4 className="text-xs font-medium text-orange-400 mb-2">Child IPs ({relationships.children.length})</h4>
              <div className="space-y-1">
                {relationships.children.slice(0, 5).map((edge, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-mono">{edge.childIpId.slice(0, 8)}...{edge.childIpId.slice(-6)}</span>
                    <span className="text-zinc-500">Block {edge.blockNumber}</span>
                  </div>
                ))}
                {relationships.children.length > 5 && (
                  <div className="text-xs text-zinc-500 text-center">
                    +{relationships.children.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
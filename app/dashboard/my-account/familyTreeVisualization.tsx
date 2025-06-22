"use client";

import React, {useState, useEffect, useRef } from 'react';
import { IPAssetService, ServiceIPAssetDetails, IPEdge as ServiceIPEdge } from '../../../lib/services/ipAssetService';

interface FamilyNode {
  id: string;
  name: string;
  type: 'ancestor' | 'parent' | 'current' | 'child' | 'descendant';
  level: number;
  x?: number;
  y?: number;
  children?: FamilyNode[];
  parents?: FamilyNode[];
  edge?: ServiceIPEdge;
  assetData?: any;
}

interface FamilyTreeVisualizationProps {
  currentAsset: {
    id: string;
    name: string;
    ipId: string;
    ancestorCount: number;
    parentCount: number;
    childrenCount: number;
    descendantCount: number;
    rootIpIds?: string[];
  };
  onViewAssetDetails?: (ipId: string) => void;
}

export const FamilyTreeVisualization: React.FC<FamilyTreeVisualizationProps> = ({ 
  currentAsset, 
  onViewAssetDetails 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [familyTree, setFamilyTree] = useState<FamilyNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [relationships, setRelationships] = useState<{
    parentEdges: ServiceIPEdge[];
    childEdges: ServiceIPEdge[];
    parentAssets: any[];
    childAssets: any[];
  }>({
    parentEdges: [],
    childEdges: [],
    parentAssets: [],
    childAssets: []
  });
  const [showParentsList, setShowParentsList] = useState(false);
  const [showChildrenList, setShowChildrenList] = useState(false);

  useEffect(() => {
    fetchRealRelationships();
  }, [currentAsset]);

  const fetchRealRelationships = async () => {
    setLoading(true);
    try {
      console.log('Fetching real relationships for:', currentAsset.ipId);
      
      // Fetch parent and child edges using the enhanced service
      const [parentEdges, childEdges] = await Promise.all([
        IPAssetService.getParentEdges(currentAsset.ipId),
        IPAssetService.getChildEdges(currentAsset.ipId)
      ]);

      console.log('Fetched parent edges:', parentEdges);
      console.log('Fetched child edges:', childEdges);

      // Fetch detailed info for parent and child assets
      const parentAssets = await Promise.all(
        parentEdges.map(async (edge) => {
          const assetInfo = await IPAssetService.getIPAssetDetails(edge.parentIpId);
          return {
            ...assetInfo,
            edge,
            ipId: edge.parentIpId
          };
        })
      );

      const childAssets = await Promise.all(
        childEdges.map(async (edge) => {
          const assetInfo = await IPAssetService.getIPAssetDetails(edge.ipId);
          return {
            ...assetInfo,
            edge,
            ipId: edge.ipId
          };
        })
      );

      const relationshipData = {
        parentEdges,
        childEdges,
        parentAssets: parentAssets.filter(Boolean),
        childAssets: childAssets.filter(Boolean)
      };

      setRelationships(relationshipData);
      
      // Use real data if available, otherwise fall back to mock
      if (relationshipData.parentEdges.length > 0 || relationshipData.childEdges.length > 0) {
        console.log('Generating real family tree with data:', relationshipData);
        generateRealFamilyTree(relationshipData);
      } else {
        console.log('No real relationships found, using mock data');
        generateFamilyTree();
      }
    } catch (error) {
      console.error('Error fetching relationships:', error);
      // Fallback to mock data
      console.log('Falling back to mock data due to error');
      generateFamilyTree();
    } finally {
      setLoading(false);
    }
  };

  const generateRealFamilyTree = (relationshipData: {
    parentEdges: ServiceIPEdge[];
    childEdges: ServiceIPEdge[];
    parentAssets: any[];
    childAssets: any[];
  }) => {
    const tree: FamilyNode = {
      id: currentAsset.ipId,
      name: currentAsset.name,
      type: 'current',
      level: 0,
      children: [],
      parents: []
    };

    // Generate real parents from assets data
    if (relationshipData.parentAssets.length > 0) {
      tree.parents = relationshipData.parentAssets.map((asset, index) => ({
        id: asset.ipId,
        name: asset.name || `Parent Asset ${index + 1}`,
        type: 'parent' as const,
        level: -1,
        children: [],
        edge: asset.edge,
        assetData: asset
      }));
    }

    // Generate real children from assets data
    if (relationshipData.childAssets.length > 0) {
      tree.children = relationshipData.childAssets.map((asset, index) => ({
        id: asset.ipId,
        name: asset.name || `Child Asset ${index + 1}`,
        type: 'child' as const,
        level: 1,
        children: [],
        edge: asset.edge,
        assetData: asset
      }));
    }

    setFamilyTree(tree);
    layoutTree(tree);
  };

  const generateFamilyTree = () => {
    // Fallback mock data generation
    const tree: FamilyNode = {
      id: currentAsset.ipId,
      name: currentAsset.name,
      type: 'current',
      level: 0,
      children: [],
      parents: []
    };

    // Generate mock ancestors/parents
    if (currentAsset.parentCount > 0) {
      for (let i = 0; i < Math.min(currentAsset.parentCount, 3); i++) {
        tree.parents!.push({
          id: `parent-${i}`,
          name: `Parent Asset ${i + 1}`,
          type: 'parent',
          level: -1,
          children: []
        });
      }
    }

    // Generate mock children
    if (currentAsset.childrenCount > 0) {
      for (let i = 0; i < Math.min(currentAsset.childrenCount, 5); i++) {
        tree.children!.push({
          id: `child-${i}`,
          name: `Child Asset ${i + 1}`,
          type: 'child',
          level: 1,
          children: []
        });
      }
    }

    setFamilyTree(tree);
    layoutTree(tree);
  };

  const layoutTree = (tree: FamilyNode) => {
    // Smaller dimensions for compact nodes
    const nodeWidth = 120;
    const nodeHeight = 45;
    const levelHeight = 100;
    const horizontalSpacing = 140;
    const padding = 60;
    
    const parentCount = tree.parents?.length || 0;
    const childCount = tree.children?.length || 0;
    
    // Calculate total width needed
    const maxNodesInLevel = Math.max(parentCount, 1, childCount);
    const totalWidth = Math.max(800, maxNodesInLevel * horizontalSpacing + padding * 2);
    
    // Position current node in center
    tree.x = totalWidth / 2;
    tree.y = padding + levelHeight;

    // Position parents above the current node
    if (tree.parents && tree.parents.length > 0) {
      const parentSpacing = Math.min(horizontalSpacing, (totalWidth - padding * 2) / tree.parents.length);
      const startX = tree.x! - ((tree.parents.length - 1) * parentSpacing) / 2;
      
      tree.parents.forEach((parent, index) => {
        parent.x = startX + index * parentSpacing;
        parent.y = padding; // Above current node
      });
    }

    // Position children below the current node
    if (tree.children && tree.children.length > 0) {
      const childSpacing = Math.min(horizontalSpacing, (totalWidth - padding * 2) / tree.children.length);
      const startX = tree.x! - ((tree.children.length - 1) * childSpacing) / 2;
      
      tree.children.forEach((child, index) => {
        child.x = startX + index * childSpacing;
        child.y = tree.y! + levelHeight; // Below current node
      });
    }

    // Calculate SVG dimensions
    const maxY = Math.max(
      tree.y!,
      ...(tree.parents?.map(p => p.y!) || [0]),
      ...(tree.children?.map(c => c.y!) || [0])
    );
    
    const minY = Math.min(
      tree.y!,
      ...(tree.parents?.map(p => p.y!) || [tree.y!]),
      ...(tree.children?.map(c => c.y!) || [tree.y!])
    );
    
    const actualHeight = maxY - minY + nodeHeight + (padding * 2);
    
    // Store dimensions for SVG
    (tree as any).svgWidth = totalWidth;
    (tree as any).svgHeight = Math.max(actualHeight, 300);
    (tree as any).nodeWidth = nodeWidth;
    (tree as any).nodeHeight = nodeHeight;
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'current': return { bg: 'fill-blue-500/20', border: 'stroke-blue-400', text: 'text-blue-300' };
      case 'parent': return { bg: 'fill-green-500/20', border: 'stroke-green-400', text: 'text-green-300' };
      case 'child': return { bg: 'fill-orange-500/20', border: 'stroke-orange-400', text: 'text-orange-300' };
      case 'descendant': return { bg: 'fill-purple-500/20', border: 'stroke-purple-400', text: 'text-purple-300' };
      default: return { bg: 'fill-zinc-500/20', border: 'stroke-zinc-400', text: 'text-zinc-300' };
    }
  };

  const truncateText = (text: string, maxLength: number = 12) => {
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  const truncateHash = (hash: string, length = 8) => {
    return `${hash.slice(0, length)}...${hash.slice(-length)}`;
  };

  const renderConnections = (tree: FamilyNode) => {
    const connections: React.JSX.Element[] = [];
    const nodeHeight = (tree as any).nodeHeight || 45;

    if (tree.parents) {
      tree.parents.forEach((parent, index) => {
        connections.push(
          <line
            key={`parent-connection-${index}`}
            x1={parent.x}
            y1={parent.y! + nodeHeight/2 + 10}
            x2={tree.x}
            y2={tree.y! - nodeHeight/2 - 10}
            stroke="rgb(113 113 122 / 0.3)"
            strokeWidth="1.5"
            strokeDasharray="3,3"
          />
        );
      });
    }

    if (tree.children) {
      tree.children.forEach((child, index) => {
        connections.push(
          <line
            key={`child-connection-${index}`}
            x1={tree.x}
            y1={tree.y! + nodeHeight/2 + 10}
            x2={child.x}
            y2={child.y! - nodeHeight/2 - 10}
            stroke="rgb(113 113 122 / 0.3)"
            strokeWidth="1.5"
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
    const nodeWidth = (familyTree as any)?.nodeWidth || 120;
    const nodeHeight = (familyTree as any)?.nodeHeight || 45;
    
    return (
      <g
        key={node.id}
        className="cursor-pointer transition-all duration-200"
        onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
      >
        <rect
          x={node.x! - nodeWidth/2}
          y={node.y! - nodeHeight/2}
          width={nodeWidth}
          height={nodeHeight}
          className={`${colors.bg} ${colors.border} transition-all duration-200`}
          strokeWidth={isCurrent ? "2" : "1"}
          rx="6"
          style={{
            filter: isSelected ? 'drop-shadow(0 0 8px rgb(59 130 246 / 0.4))' : 'none',
            opacity: isSelected ? 1 : 0.85
          }}
        />

        <text
          x={node.x}
          y={node.y! - 5}
          textAnchor="middle"
          className={`fill-current text-xs font-medium ${colors.text}`}
        >
          {truncateText(node.name, 16)}
        </text>

        <text
          x={node.x}
          y={node.y! + 8}
          textAnchor="middle"
          className="fill-current text-xs text-zinc-500 capitalize"
        >
          {node.type}
        </text>

        {isCurrent && (
          <circle
            cx={node.x! + nodeWidth/2 - 8}
            cy={node.y! - nodeHeight/2 + 8}
            r="2.5"
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

  // Enhanced handleViewDetails function to work with the marketplace modal
  const handleViewDetails = async (ipId: string) => {
    if (ipId === currentAsset.ipId) {
      // Don't open modal for the same asset
      return;
    }

    if (onViewAssetDetails) {
      try {
        console.log('Opening asset details for:', ipId);
        onViewAssetDetails(ipId);
      } catch (error) {
        console.error('Error opening asset details:', error);
      }
    } else {
      console.warn('onViewAssetDetails callback not provided');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-zinc-400">Loading family tree...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!familyTree) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <svg className="w-12 h-12 text-zinc-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-zinc-400">No family tree data available</p>
          </div>
        </div>
      </div>
    );
  }

  const selectedNodeDetails = getSelectedNodeDetails();
  const svgWidth = (familyTree as any).svgWidth || 800;
  const svgHeight = (familyTree as any).svgHeight || 300;

  return (
    <div className="space-y-4">
      {/* Enhanced Stats with Dropdowns */}
      <div className="grid grid-cols-2 gap-3">
        {/* Parents Card */}
        <div className="bg-zinc-900/40 rounded-lg border border-zinc-700/20">
          <div 
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-800/30 transition-colors rounded-lg"
            onClick={() => setShowParentsList(!showParentsList)}
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-sm font-medium text-white">Parents</span>
              <span className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full text-xs font-medium">
                {relationships.parentAssets.length}
              </span>
            </div>
            <svg 
              className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${showParentsList ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          {showParentsList && (
            <div className="border-t border-zinc-700/20 max-h-32 overflow-y-auto">
              {relationships.parentAssets.length > 0 ? (
                relationships.parentAssets.map((parent, index) => (
                  <div key={index} className="p-2 hover:bg-zinc-800/30 transition-colors border-b border-zinc-700/10 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{parent.name || 'Unnamed Asset'}</p>
                        <p className="text-xs text-zinc-500 font-mono">{truncateHash(parent.ipId)}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNode(parent.ipId);
                        }}
                        className="ml-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center">
                  <p className="text-xs text-zinc-500">No parent assets</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Children Card */}
        <div className="bg-zinc-900/40 rounded-lg border border-zinc-700/20">
          <div 
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-800/30 transition-colors rounded-lg"
            onClick={() => setShowChildrenList(!showChildrenList)}
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-orange-400"></div>
              <span className="text-sm font-medium text-white">Children</span>
              <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded-full text-xs font-medium">
                {relationships.childAssets.length}
              </span>
            </div>
            <svg 
              className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${showChildrenList ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          {showChildrenList && (
            <div className="border-t border-zinc-700/20 max-h-32 overflow-y-auto">
              {relationships.childAssets.length > 0 ? (
                relationships.childAssets.map((child, index) => (
                  <div key={index} className="p-2 hover:bg-zinc-800/30 transition-colors border-b border-zinc-700/10 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{child.name || 'Unnamed Asset'}</p>
                        <p className="text-xs text-zinc-500 font-mono">{truncateHash(child.ipId)}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNode(child.ipId);
                        }}
                        className="ml-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center">
                  <p className="text-xs text-zinc-500">No child assets</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SVG Container - Enhanced with both vertical and horizontal scrolling */}
      <div 
        ref={containerRef}
        className="relative rounded-lg bg-zinc-900/30 border border-zinc-700/20 overflow-auto"
        style={{ 
          height: '320px', // Fixed height for vertical scrolling
          width: '100%'
        }}
      >
        <svg
          ref={svgRef}
          width={svgWidth}
          height={svgHeight}
          className="min-w-full min-h-full"
          style={{
            minWidth: `${svgWidth}px`,
            minHeight: `${svgHeight}px`
          }}
        >
          {renderConnections(familyTree)}
          {renderNode(familyTree)}
          {familyTree.parents?.map(renderNode)}
          {familyTree.children?.map(renderNode)}
        </svg>
      </div>

      {/* Enhanced Selected Node Details */}
      {selectedNodeDetails && (
        <div className="bg-gradient-to-br from-zinc-900/60 to-zinc-800/40 rounded-lg border border-zinc-700/30 p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-white mb-1">{selectedNodeDetails.name}</h4>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedNodeDetails.type === 'current' ? 'bg-blue-500/10 text-blue-400' :
                  selectedNodeDetails.type === 'parent' ? 'bg-green-500/10 text-green-400' :
                  'bg-orange-500/10 text-orange-400'
                }`}>
                  {selectedNodeDetails.type}
                </span>
                {selectedNodeDetails.type === 'current' && (
                  <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded-full text-xs font-medium">
                    Current Asset
                  </span>
                )}
              </div>
            </div>
            
            {selectedNodeDetails.type !== 'current' && (
              <button
                onClick={() => handleViewDetails(selectedNodeDetails.id)}
                className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 hover:border-blue-400/50 text-blue-300 hover:text-blue-200 rounded-lg text-xs font-medium transition-all duration-200 flex items-center space-x-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>View Details</span>
              </button>
            )}
          </div>

          {/* Asset Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-2">
              <div>
                <span className="text-zinc-500">IP ID:</span>
                <p className="text-zinc-300 font-mono mt-0.5 break-all">{selectedNodeDetails.id}</p>
              </div>
              
              {selectedNodeDetails.assetData?.tokenContract && (
                <div>
                  <span className="text-zinc-500">Contract:</span>
                  <p className="text-zinc-300 font-mono mt-0.5">{truncateHash(selectedNodeDetails.assetData.tokenContract)}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              {selectedNodeDetails.assetData?.tokenId && (
                <div>
                  <span className="text-zinc-500">Token ID:</span>
                  <p className="text-zinc-300 font-mono mt-0.5">{selectedNodeDetails.assetData.tokenId}</p>
                </div>
              )}
              
              {selectedNodeDetails.assetData?.blockNumber && (
                <div>
                  <span className="text-zinc-500">Block:</span>
                  <p className="text-zinc-300 font-mono mt-0.5">{selectedNodeDetails.assetData.blockNumber}</p>
                </div>
              )}
            </div>
          </div>

          {/* Relationship Info */}
          {selectedNodeDetails.assetData?.edge && (
            <div className="mt-3 pt-3 border-t border-zinc-700/30">
              <h5 className="text-xs font-medium text-zinc-400 mb-2">Relationship Details</h5>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-zinc-500">License Template:</span>
                  <p className="text-zinc-300 mt-0.5">{selectedNodeDetails.assetData.edge.licenseTemplate || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-zinc-500">License Terms ID:</span>
                  <p className="text-zinc-300 font-mono mt-0.5">{selectedNodeDetails.assetData.edge.licenseTermsId || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-zinc-900/20 rounded-lg p-3 border border-zinc-700/10">
        <p className="text-xs text-zinc-500 text-center">
          Click on any node to view details • Use the dropdown arrows to browse all parents and children • Scroll to explore the family tree • Click "View Details" to open full asset information
        </p>
      </div>
    </div>
  );
};
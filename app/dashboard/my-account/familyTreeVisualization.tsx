import React, {JSX, useEffect, useRef, useState } from 'react';
import { IPEdgesService, IPEdge } from './ipEdgesService';

interface FamilyNode {
  id: string;
  name: string;
  type: 'ancestor' | 'parent' | 'current' | 'child' | 'descendant';
  level: number;
  x?: number;
  y?: number;
  children?: FamilyNode[];
  parents?: FamilyNode[];
  edge?: IPEdge; // Store the actual edge data
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
}

export const FamilyTreeVisualization: React.FC<FamilyTreeVisualizationProps> = ({ currentAsset }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [familyTree, setFamilyTree] = useState<FamilyNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [relationships, setRelationships] = useState<{parents: IPEdge[], children: IPEdge[]}>({parents: [], children: []});

  useEffect(() => {
    fetchRealRelationships();
  }, [currentAsset]);

 const fetchRealRelationships = async () => {
  setLoading(true);
  try {
    console.log('Fetching real relationships for:', currentAsset.ipId);
    
    // Test API connection first
    const isConnected = await IPEdgesService.testConnection();
    if (!isConnected) {
      console.log('API connection test failed, using mock data');
      generateFamilyTree();
      return;
    }
    
    const relationshipData = await IPEdgesService.getIPRelationships(currentAsset.ipId);
    console.log('Relationship data received:', relationshipData);
    
    setRelationships(relationshipData);
    
    // Use real data if available, otherwise fall back to mock
    if (relationshipData.parents.length > 0 || relationshipData.children.length > 0) {
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

  const generateRealFamilyTree = (relationshipData: {parents: IPEdge[], children: IPEdge[]}) => {
    const tree: FamilyNode = {
      id: currentAsset.ipId,
      name: currentAsset.name,
      type: 'current',
      level: 0,
      children: [],
      parents: []
    };

    // Generate real parents from edges data
    if (relationshipData.parents.length > 0) {
      tree.parents = relationshipData.parents.map((edge, index) => ({
        id: edge.parentIpId,
        name: `IP Asset ${edge.parentIpId.slice(0, 8)}...`,
        type: 'parent' as const,
        level: -1,
        children: [],
        edge: edge
      }));
    }

    // Generate real children from edges data
    if (relationshipData.children.length > 0) {
      tree.children = relationshipData.children.map((edge, index) => ({
        id: edge.ipId,
        name: `IP Asset ${edge.ipId.slice(0, 8)}...`,
        type: 'child' as const,
        level: 1,
        children: [],
        edge: edge
      }));
    }

    setFamilyTree(tree);
    layoutTree(tree);
  };

  const generateFamilyTree = () => {
    // Fallback mock data generation (keep existing implementation)
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
    const width = 800;
    const height = 600;
    const nodeWidth = 140;
    const nodeHeight = 60;
    const levelHeight = 120;
    const padding = 80;

    const parentCount = tree.parents?.length || 0;
    const childCount = tree.children?.length || 0;
    const hasDescendants = tree.children?.some(child => child.children && child.children.length > 0);
    
    const levels = hasDescendants ? 3 : (childCount > 0 ? 2 : (parentCount > 0 ? 2 : 1));
    const requiredHeight = levels * levelHeight + (padding * 2);
    
    tree.x = width / 2;
    tree.y = padding + levelHeight;

    if (tree.parents && tree.parents.length > 0) {
      const parentSpacing = Math.min(200, (width - 100) / tree.parents.length);
      const startX = width / 2 - ((tree.parents.length - 1) * parentSpacing) / 2;
      
      tree.parents.forEach((parent, index) => {
        parent.x = startX + index * parentSpacing;
        parent.y = padding;
      });
    }

    if (tree.children && tree.children.length > 0) {
      const childSpacing = Math.min(160, (width - 100) / tree.children.length);
      const startX = width / 2 - ((tree.children.length - 1) * childSpacing) / 2;
      
      tree.children.forEach((child, index) => {
        child.x = startX + index * childSpacing;
        child.y = tree.y! + levelHeight;
      });
    }

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
      case 'descendant': return { bg: 'bg-purple-500/20', border: 'border-purple-400', text: 'text-purple-300' };
      default: return { bg: 'bg-zinc-500/20', border: 'border-zinc-400', text: 'text-zinc-300' };
    }
  };

  const truncateText = (text: string, maxLength: number = 12) => {
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  const renderConnections = (tree: FamilyNode) => {
    const connections: JSX.Element[] = [];

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
          className={`${colors.text} text-xs font-medium fill-current`}
        >
          {truncateText(node.name)}
        </text>
        
        <text
          x={node.x}
          y={node.y! + 10}
          textAnchor="middle"
          className="text-zinc-500 text-xs fill-current"
        >
          {node.type.charAt(0).toUpperCase() + node.type.slice(1)}
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

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toLocaleDateString();
    } catch {
      return 'N/A';
    }
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

  if (loading) {
    return (
      <div className="bg-zinc-800/30 rounded-xl p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-zinc-500">Loading family tree relationships...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!familyTree) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-500">Generating family tree...</div>
      </div>
    );
  }

  const selectedNodeDetails = getSelectedNodeDetails();

  return (
    <div className="bg-zinc-800/30 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-white">Family Tree Visualization</h3>
          <p className="text-sm text-zinc-500">
            {relationships.parents.length + relationships.children.length} real relationships found
          </p>
        </div>
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500/20 border border-green-400 rounded"></div>
            <span className="text-zinc-400">Parents ({relationships.parents.length})</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500/20 border-2 border-blue-400 rounded"></div>
            <span className="text-zinc-400">Current</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500/20 border border-orange-400 rounded"></div>
            <span className="text-zinc-400">Children ({relationships.children.length})</span>
          </div>
        </div>
      </div>

      {/* SVG Container */}
      <div className="relative overflow-auto rounded-lg bg-zinc-900/50 border border-zinc-700/20 max-h-80 scrollbar-hide">
        <svg
          ref={svgRef}
          width="800"
          height={(familyTree as any)?.svgHeight || 400}
          viewBox={`0 0 800 ${(familyTree as any)?.svgHeight || 400}`}
          className="block"
          style={{ minWidth: '800px' }}
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgb(113 113 122 / 0.1)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {renderConnections(familyTree)}
          {familyTree.parents?.map(renderNode)}
          {renderNode(familyTree)}
          {familyTree.children?.map(renderNode)}
        </svg>
      </div>

      {/* Enhanced Stats */}
      <div className="mt-4 grid grid-cols-4 gap-3">
        <div className="bg-zinc-700/30 rounded-lg p-2 text-center">
          <div className="text-sm font-bold text-green-400">{relationships.parents.length}</div>
          <div className="text-xs text-zinc-500">Direct Parents</div>
        </div>
        <div className="bg-zinc-700/30 rounded-lg p-2 text-center">
          <div className="text-sm font-bold text-blue-400">1</div>
          <div className="text-xs text-zinc-500">Current Asset</div>
        </div>
        <div className="bg-zinc-700/30 rounded-lg p-2 text-center">
          <div className="text-sm font-bold text-orange-400">{relationships.children.length}</div>
          <div className="text-xs text-zinc-500">Direct Children</div>
        </div>
        <div className="bg-zinc-700/30 rounded-lg p-2 text-center">
          <div className="text-sm font-bold text-purple-400">{relationships.parents.length + relationships.children.length}</div>
          <div className="text-xs text-zinc-500">Total Relations</div>
        </div>
      </div>

      {/* Enhanced Selected Node Info */}
      {selectedNodeDetails && (
        <div className="mt-3 p-4 bg-zinc-700/20 rounded-lg border border-zinc-600/30">
          <h4 className="text-sm font-medium text-white mb-2">Selected Asset Details</h4>
          <div className="text-xs text-zinc-400 space-y-1">
            <p><span className="text-zinc-500">ID:</span> {selectedNodeDetails.id}</p>
            <p><span className="text-zinc-500">Type:</span> {selectedNodeDetails.type}</p>
            {selectedNodeDetails.edge && (
              <>
                <p><span className="text-zinc-500">License Terms:</span> {selectedNodeDetails.edge.licenseTermsId || 'N/A'}</p>
                <p><span className="text-zinc-500">License Template:</span> {selectedNodeDetails.edge.licenseTemplate || 'N/A'}</p>
                <p><span className="text-zinc-500">Created:</span> {formatTimestamp(selectedNodeDetails.edge.blockTime)}</p>
                <p><span className="text-zinc-500">Transaction:</span> {selectedNodeDetails.edge.transactionHash.slice(0, 10)}...</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
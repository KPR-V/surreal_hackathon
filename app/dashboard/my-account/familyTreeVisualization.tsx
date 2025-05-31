"use client";

import React, {JSX, useState, useEffect, useRef } from 'react';
import { IPEdge } from './types';
import { getIPRelationships, testConnection } from './ipEdgesService';

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
  const [relationships, setRelationships] = useState<{parentEdges: IPEdge[], childEdges: IPEdge[]}>({parentEdges: [], childEdges: []});

  useEffect(() => {
    fetchRealRelationships();
  }, [currentAsset]);

  const fetchRealRelationships = async () => {
    setLoading(true);
    try {
      console.log('Fetching real relationships for:', currentAsset.ipId);
      
      // Test API connection first
      const isConnected = await testConnection();
      if (!isConnected) {
        console.log('API connection test failed, using mock data');
        generateFamilyTree();
        return;
      }
      
      const relationshipData = await getIPRelationships(currentAsset.ipId);
      console.log('Relationship data received:', relationshipData);
      
      setRelationships(relationshipData);
      
      // Use real data if available, otherwise fall back to mock
      if (relationshipData.parentEdges.length > 0 || relationshipData.childEdges.length > 0) {
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

  const generateRealFamilyTree = (relationshipData: {parentEdges: IPEdge[], childEdges: IPEdge[]}) => {
    const tree: FamilyNode = {
      id: currentAsset.ipId,
      name: currentAsset.name,
      type: 'current',
      level: 0,
      children: [],
      parents: []
    };

    // Generate real parents from edges data
    if (relationshipData.parentEdges.length > 0) {
      tree.parents = relationshipData.parentEdges.map((edge, index) => ({
        id: edge.parentIpId,
        name: `IP Asset ${edge.parentIpId.slice(0, 8)}...`,
        type: 'parent' as const,
        level: -1,
        children: [],
        edge: edge
      }));
    }

    // Generate real children from edges data
    if (relationshipData.childEdges.length > 0) {
      tree.children = relationshipData.childEdges.map((edge, index) => ({
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
        <div className="flex items-center justify-center h-32">
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
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-400">No family tree data available</p>
      </div>
    );
  }

  const selectedNodeDetails = getSelectedNodeDetails();

  return (
    <div className="bg-zinc-800/30 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-white">IP Family Tree</h3>
        <div className="text-sm text-zinc-400">
          {relationships.parentEdges.length + relationships.childEdges.length} relationships
        </div>
      </div>

      {/* SVG Container */}
      <div className="relative overflow-auto rounded-lg bg-zinc-900/50 border border-zinc-700/20 max-h-80 scrollbar-hide">
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

      {/* Enhanced Stats */}
      <div className="mt-4 grid grid-cols-4 gap-3">
        <div className="bg-zinc-700/30 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-green-400">{relationships.parentEdges.length}</p>
          <p className="text-xs text-zinc-500">Parents</p>
        </div>
        <div className="bg-zinc-700/30 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-orange-400">{relationships.childEdges.length}</p>
          <p className="text-xs text-zinc-500">Children</p>
        </div>
        <div className="bg-zinc-700/30 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-blue-400">{currentAsset.ancestorCount}</p>
          <p className="text-xs text-zinc-500">Ancestors</p>
        </div>
        <div className="bg-zinc-700/30 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-purple-400">{currentAsset.descendantCount}</p>
          <p className="text-xs text-zinc-500">Descendants</p>
        </div>
      </div>

      {/* Enhanced Selected Node Info */}
      {selectedNodeDetails && (
        <div className="mt-3 p-4 bg-zinc-700/20 rounded-lg border border-zinc-600/30">
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
    </div>
  );
};
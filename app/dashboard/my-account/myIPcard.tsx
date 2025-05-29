import React, { useState, useEffect } from 'react';
import { IPDetailsModal } from './ipDetailsModal';
import { IPEdgesService } from './ipEdgesService';

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

interface MyIPCardProps {
  asset: IPAsset;
}

interface RelationshipCounts {
  parents: number;
  children: number;
}

export const MyIPCard: React.FC<MyIPCardProps> = ({ asset }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [relationships, setRelationships] = useState<RelationshipCounts>({ parents: 0, children: 0 });
  const [loadingRelationships, setLoadingRelationships] = useState(false);

  useEffect(() => {
    fetchRelationshipCounts();
  }, [asset.ipId]);

  const fetchRelationshipCounts = async () => {
    setLoadingRelationships(true);
    try {
      const relationshipData = await IPEdgesService.getIPRelationships(asset.ipId);
      setRelationships({
        parents: relationshipData.parents.length,
        children: relationshipData.children.length
      });
    } catch (error) {
      console.error('Error fetching relationship counts:', error);
    } finally {
      setLoadingRelationships(false);
    }
  };

  const truncateHash = (hash?: string) => {
    if (!hash) return 'N/A';
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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

            {/* PIL Status & Chain Info */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  asset.pilAttached ? 'bg-blue-400' : 'bg-zinc-600'
                }`}></div>
                <span className="text-xs text-zinc-400">
                  {asset.pilAttached ? 'PIL Attached' : 'No PIL'}
                </span>
              </div>
              
              {asset.nftMetadata?.chainId && (
                <span className="text-xs text-zinc-500">
                  Chain: {asset.nftMetadata.chainId}
                </span>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-zinc-800/30 rounded-lg p-3">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Revenue</p>
                <p className="text-sm font-medium text-blue-400">{asset.revenue}</p>
              </div>
              <div className="bg-zinc-800/30 rounded-lg p-3">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Derivatives</p>
                <p className="text-sm font-medium text-pink-400">{asset.derivatives}</p>
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
              <button className="px-3 py-2 bg-gradient-to-r from-blue-500/10 to-pink-500/10 hover:from-blue-500/20 hover:to-pink-500/20 text-blue-400 rounded-lg text-xs font-medium transition-all duration-200 border border-blue-500/20">
                Manage
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <IPDetailsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        asset={asset}
      />
    </>
  );
};
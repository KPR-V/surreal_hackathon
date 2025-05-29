import React, { useState, useEffect } from 'react';
import { DisputeInfo, Dispute, getIPDisputes } from './ipEdgesService';

interface DisputeInfoProps {
  ipId: string;
}

export const DisputeInfoComponent: React.FC<DisputeInfoProps> = ({ ipId }) => {
  const [loading, setLoading] = useState(true);
  const [disputeData, setDisputeData] = useState<DisputeInfo>({
    hasDisputes: false,
    activeDisputes: [],
    resolvedDisputes: [],
    totalDisputes: 0,
    isInitiator: false,
    isTarget: false
  });

  useEffect(() => {
    fetchDisputeInfo();
  }, [ipId]);

  const fetchDisputeInfo = async () => {
    setLoading(true);
    try {
      const data = await getIPDisputes(ipId);
      setDisputeData(data);
    } catch (error) {
      console.error('Error fetching dispute info:', error);
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

  const formatTimestamp = (timestamp: number) => {
    try {
      return new Date(timestamp * 1000).toLocaleString();
    } catch {
      return 'N/A';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'resolved':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'dismissed':
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      case 'disputed':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
    }
  };

  const renderDispute = (dispute: Dispute, index: number) => (
    <div key={dispute.id} className="bg-zinc-700/30 rounded-lg p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="text-sm font-medium text-white mb-1">Dispute #{index + 1}</h4>
          <span className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${getStatusColor(dispute.status)}`}>
            {dispute.status}
          </span>
        </div>
        <div className="text-xs text-zinc-500">
          {formatTimestamp(dispute.disputeTimestamp)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <div>
          <span className="text-xs text-zinc-500">Dispute ID:</span>
          <button 
            onClick={() => copyToClipboard(dispute.id)}
            className="block text-sm text-blue-400 hover:text-blue-300 transition-colors font-mono"
            title="Click to copy"
          >
            {truncateHash(dispute.id)}
          </button>
        </div>

        <div>
          <span className="text-xs text-zinc-500">Initiator:</span>
          <button 
            onClick={() => copyToClipboard(dispute.initiator)}
            className="block text-sm text-orange-400 hover:text-orange-300 transition-colors font-mono"
            title="Click to copy"
          >
            {truncateHash(dispute.initiator)}
          </button>
        </div>

        <div>
          <span className="text-xs text-zinc-500">Target Tag:</span>
          <p className="text-sm text-white">{dispute.targetTag || 'N/A'}</p>
        </div>

        <div>
          <span className="text-xs text-zinc-500">Current Tag:</span>
          <p className="text-sm text-white">{dispute.currentTag || 'N/A'}</p>
        </div>
      </div>

      {/* Evidence Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        {dispute.evidenceHash && (
          <div>
            <span className="text-xs text-zinc-500">Evidence Hash:</span>
            <button 
              onClick={() => copyToClipboard(dispute.evidenceHash)}
              className="block text-sm text-purple-400 hover:text-purple-300 transition-colors font-mono"
              title="Click to copy"
            >
              {truncateHash(dispute.evidenceHash)}
            </button>
          </div>
        )}

        {dispute.counterEvidenceHash && (
          <div>
            <span className="text-xs text-zinc-500">Counter Evidence:</span>
            <button 
              onClick={() => copyToClipboard(dispute.counterEvidenceHash)}
              className="block text-sm text-purple-400 hover:text-purple-300 transition-colors font-mono"
              title="Click to copy"
            >
              {truncateHash(dispute.counterEvidenceHash)}
            </button>
          </div>
        )}
      </div>

      {/* Arbitration Policy */}
      {dispute.arbitrationPolicy && (
        <div className="mb-3">
          <span className="text-xs text-zinc-500">Arbitration Policy:</span>
          <button 
            onClick={() => copyToClipboard(dispute.arbitrationPolicy)}
            className="block text-sm text-green-400 hover:text-green-300 transition-colors font-mono"
            title="Click to copy"
          >
            {truncateHash(dispute.arbitrationPolicy, 12)}
          </button>
        </div>
      )}

      {/* UMA Link */}
      {dispute.umaLink && (
        <div className="mb-3">
          <span className="text-xs text-zinc-500">UMA Link:</span>
          <a 
            href={dispute.umaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-blue-400 hover:text-blue-300 transition-colors break-all"
          >
            {dispute.umaLink}
          </a>
        </div>
      )}

      {/* Transaction & Block Info */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <span className="text-zinc-500">Transaction:</span>
          <button 
            onClick={() => copyToClipboard(dispute.transactionHash)}
            className="block text-zinc-400 hover:text-zinc-300 transition-colors font-mono"
            title="Click to copy"
          >
            {truncateHash(dispute.transactionHash)}
          </button>
        </div>
        <div>
          <span className="text-zinc-500">Block:</span>
          <p className="text-zinc-400">{dispute.blockNumber}</p>
        </div>
      </div>

      {/* Liveness indicator */}
      {dispute.liveness && (
        <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded">
          <div className="flex justify-between items-center">
            <span className="text-xs text-blue-400">Liveness Period:</span>
            <span className="text-xs text-blue-300">{dispute.liveness} blocks</span>
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="bg-zinc-800/30 rounded-xl p-6">
        <div className="flex items-center justify-center h-32">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-zinc-400">Loading dispute information...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dispute Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-800/30 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Total Disputes</p>
          <p className="text-2xl font-bold text-blue-400">{disputeData.totalDisputes}</p>
        </div>
        <div className="bg-zinc-800/30 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Active Disputes</p>
          <p className="text-2xl font-bold text-red-400">{disputeData.activeDisputes.length}</p>
        </div>
        <div className="bg-zinc-800/30 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Resolved</p>
          <p className="text-2xl font-bold text-green-400">{disputeData.resolvedDisputes.length}</p>
        </div>
        <div className="bg-zinc-800/30 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Status</p>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              disputeData.activeDisputes.length > 0 
                ? 'bg-red-400' 
                : disputeData.hasDisputes 
                  ? 'bg-yellow-400' 
                  : 'bg-green-400'
            }`}></div>
            <p className="text-sm font-medium text-white">
              {disputeData.activeDisputes.length > 0 
                ? 'In Dispute' 
                : disputeData.hasDisputes 
                  ? 'Past Disputes' 
                  : 'No Disputes'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Active Disputes */}
      {disputeData.activeDisputes.length > 0 && (
        <div className="bg-zinc-800/30 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>Active Disputes</span>
          </h3>
          <div className="space-y-4">
            {disputeData.activeDisputes.map((dispute, index) => renderDispute(dispute, index))}
          </div>
        </div>
      )}

      {/* Resolved Disputes */}
      {disputeData.resolvedDisputes.length > 0 && (
        <div className="bg-zinc-800/30 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4">Resolved Disputes</h3>
          <div className="space-y-4">
            {disputeData.resolvedDisputes.map((dispute, index) => renderDispute(dispute, index))}
          </div>
        </div>
      )}

      {/* No Disputes */}
      {!disputeData.hasDisputes && (
        <div className="bg-zinc-800/30 rounded-xl p-8 text-center">
          <svg className="w-16 h-16 text-green-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-zinc-400 mb-2">No disputes found</p>
          <p className="text-sm text-zinc-500">This asset has not been involved in any disputes.</p>
        </div>
      )}
    </div>
  );
};
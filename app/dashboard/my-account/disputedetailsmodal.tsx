"use client";

import React, { useState, useEffect } from 'react';
import { ResolveDisputeModal } from './resolveAndcancelDispute';
import { CancelDisputeModal } from './resolveAndcancelDispute';

interface DisputeDetails {
  id: number;
  targetIpId: string;
  targetTag: string;
  currentTag: string;
  arbitrationPolicy: string;
  evidenceHash: string;
  initiator: string;
  data: string;
  blockNumber: number;
  blockTimestamp: number;
  disputeTimestamp: number;
  transactionHash: string;
  deletedAt: null | string;
  logIndex: number;
  status: string;
  umaLink: string;
  counterEvidenceHash: string;
  liveness: null | number;
}

interface DisputeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  disputeId: number;
}

// Helper function to format timestamps
const formatDate = (timestamp: number): string => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Helper function to decode target tag
const decodeTag = (hexTag: string): string => {
  try {
    if (!hexTag || hexTag === '') return 'No specific tag';
    
    const cleanHex = hexTag.startsWith('0x') ? hexTag.slice(2) : hexTag;
    let result = '';
    for (let i = 0; i < cleanHex.length; i += 2) {
      const byte = parseInt(cleanHex.substr(i, 2), 16);
      if (byte > 0 && byte < 127) {
        result += String.fromCharCode(byte);
      }
    }
    
    return result.replace(/\u0000/g, '').trim() || 'System generated tag';
  } catch (error) {
    return 'Unable to decode tag';
  }
};

// Helper function to get status info
const getStatusInfo = (status: string) => {
  switch (status.toLowerCase()) {
    case 'raised':
      return {
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/20',
        description: 'Your dispute has been submitted and is awaiting review by the dispute resolution system.'
      };
    case 'resolved':
      return {
        color: 'text-green-400',
        bg: 'bg-green-500/10',
        border: 'border-green-500/20',
        description: 'The dispute has been resolved. The outcome has been determined by the arbitration system.'
      };
    case 'dismissed':
      return {
        color: 'text-gray-400',
        bg: 'bg-gray-500/10',
        border: 'border-gray-500/20',
        description: 'The dispute was dismissed. This could be due to insufficient evidence or procedural issues.'
      };
    case 'active':
      return {
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        description: 'The dispute is currently under active review by the arbitration oracles.'
      };
    default:
      return {
        color: 'text-zinc-400',
        bg: 'bg-zinc-500/10',
        border: 'border-zinc-500/20',
        description: 'Status information not available.'
      };
  }
};

export const DisputeDetailsModal: React.FC<DisputeDetailsModalProps> = ({
  isOpen,
  onClose,
  disputeId
}) => {
  const [disputeDetails, setDisputeDetails] = useState<DisputeDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  useEffect(() => {
    if (isOpen && disputeId) {
      fetchDisputeDetails();
    }
  }, [isOpen, disputeId]);

  const fetchDisputeDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/disputes/${disputeId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch dispute details');
      }
      
      const result = await response.json();
      setDisputeDetails(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dispute details');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleResolveClick = () => {
    setShowResolveModal(true);
  };

  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  if (!isOpen) return null;

  const statusInfo = disputeDetails ? getStatusInfo(disputeDetails.status) : null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-700/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500/20 to-red-500/20 rounded-xl flex items-center justify-center border border-yellow-500/20">
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Dispute Details</h2>
                <p className="text-sm text-zinc-400">ID: #{disputeId}</p>
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

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-zinc-400">Loading dispute details...</span>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="bg-red-500/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 border border-red-500/20">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            ) : disputeDetails && statusInfo ? (
              <div className="space-y-6">
                {/* Status Section */}
                <div className={`${statusInfo.bg} ${statusInfo.border} border rounded-xl p-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${statusInfo.color} ${statusInfo.bg} border ${statusInfo.border}`}>
                      {disputeDetails.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-zinc-500">
                      Submitted {formatDate(disputeDetails.disputeTimestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-300">{statusInfo.description}</p>
                </div>

                {/* Main Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-zinc-800/30 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-zinc-300 mb-2">Target IP Asset</h3>
                    <p className="text-xs text-zinc-500 mb-1">The IP asset this dispute challenges</p>
                    <a 
                      href={`/dashboard/ip/${disputeDetails.targetIpId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors font-mono text-sm break-all"
                    >
                      {disputeDetails.targetIpId}
                    </a>
                  </div>

                  <div className="bg-zinc-800/30 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-zinc-300 mb-2">Dispute Reason</h3>
                    <p className="text-xs text-zinc-500 mb-1">What this dispute is about</p>
                    <p className="text-sm text-zinc-300">{decodeTag(disputeDetails.targetTag)}</p>
                  </div>

                  <div className="bg-zinc-800/30 rounded-xl p-4 md:col-span-2">
                    <h3 className="text-sm font-medium text-zinc-300 mb-2">Evidence Hash</h3>
                    <p className="text-xs text-zinc-500 mb-2">Supporting documentation identifier</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-zinc-300 font-mono break-all flex-1">
                        {disputeDetails.evidenceHash || 'No evidence provided'}
                      </p>
                      {disputeDetails.evidenceHash && (
                        <button
                          onClick={() => copyToClipboard(disputeDetails.evidenceHash)}
                          className="p-2 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700/50 rounded-lg transition-all duration-200"
                          title="Copy to clipboard"
                        >
                          {copiedHash ? (
                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-zinc-800/30 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-zinc-300 mb-2">Block Information</h3>
                    <p className="text-xs text-zinc-500 mb-1">Blockchain confirmation details</p>
                    <p className="text-sm text-zinc-300">Block #{disputeDetails.blockNumber}</p>
                    <p className="text-xs text-zinc-500">{formatDate(disputeDetails.blockTimestamp)}</p>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="bg-zinc-800/20 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-zinc-300 mb-3">Additional Information</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-500">Arbitration Policy:</span>
                      <span className="text-xs text-zinc-300 font-mono">{disputeDetails.arbitrationPolicy.slice(0, 10)}...{disputeDetails.arbitrationPolicy.slice(-6)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-500">Transaction Hash:</span>
                      <a 
                        href={`https://explorer.storyprotocol.xyz/tx/${disputeDetails.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 font-mono"
                      >
                        {disputeDetails.transactionHash.slice(0, 10)}...{disputeDetails.transactionHash.slice(-6)}
                      </a>
                    </div>
                    {disputeDetails.umaLink && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-zinc-500">Oracle Review:</span>
                        <a 
                          href={disputeDetails.umaLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-purple-400 hover:text-purple-300"
                        >
                          View in UMA Oracle
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-700/20">
                  <div className="flex space-x-3">
                    {disputeDetails.status.toLowerCase() === 'raised' && (
                      <>
                        <button 
                          onClick={handleCancelClick}
                          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium transition-all duration-200"
                        >
                          Cancel Dispute
                        </button>
                        
                      </>
                    )}
                  </div>
                  <button 
                          onClick={handleResolveClick}
                          className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg text-sm font-medium transition-all duration-200"
                        >
                          Resolve Dispute
                        </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Resolve and Cancel Modals */}
      {disputeDetails && showResolveModal && (
        <ResolveDisputeModal
          isOpen={showResolveModal}
          onClose={() => setShowResolveModal(false)}
          disputeDetails={disputeDetails}
        />
      )}

      {disputeDetails && showCancelModal && (
        <CancelDisputeModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          disputeDetails={disputeDetails}
        />
      )}
    </>
  );
};
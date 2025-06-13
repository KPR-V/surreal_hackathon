"use client";

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { cancelDispute, resolveDispute } from '@/lib/story/dispute_functions/dispute_functions';
import { useStoryClient } from '../../../lib/story/main_functions/story-network';

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

interface ResolveDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  disputeDetails: DisputeDetails;
}

interface CancelDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  disputeDetails: DisputeDetails;
}

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

export const ResolveDisputeModal: React.FC<ResolveDisputeModalProps> = ({
  isOpen,
  onClose,
  disputeDetails
}) => {
  const { address } = useAccount();
  const { getStoryClient, isReady } = useStoryClient(); // Move hook to component level
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleResolve = async () => {
    if (!address) {
      setError('Please connect your wallet');
      return;
    }

    if (!isReady) {
      setError('Story client not ready. Please try again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = await getStoryClient();
      console.log('Attempting to resolve dispute:', disputeDetails.id);

      // Just pass the dispute ID to the function
      const result = await resolveDispute(disputeDetails.id, client);
      
      if (result?.txHash) {
        setTxHash(result.txHash);
        setSuccess(true);
      } else {
        throw new Error('Failed to resolve dispute - no transaction hash returned');
      }
    } catch (err) {
      console.error('Resolve dispute error:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('0x048a9640')) {
          setError('Access denied: You may not have permission to resolve this dispute or it may not be in a resolvable state.');
        } else if (err.message.includes('revert')) {
          setError('Transaction failed: The dispute cannot be resolved at this time.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to resolve dispute');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/30 rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700/20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center border border-green-500/20">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Resolve Dispute</h2>
              <p className="text-sm text-zinc-400">Finalize dispute resolution</p>
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
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Dispute Resolved Successfully!</h3>
              <p className="text-sm text-zinc-400 mb-4">The dispute has been resolved on the blockchain.</p>
              {txHash && (
                <a 
                  href={`https://explorer.storyprotocol.xyz/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 font-mono"
                >
                  View Transaction: {txHash.slice(0, 10)}...{txHash.slice(-6)}
                </a>
              )}
            </div>
          ) : (
            <>
              {/* Warning Notice */}
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-orange-400 mb-1">Important Notice</h4>
                    <p className="text-xs text-orange-300/80">
                      Resolving this dispute will finalize the decision. This action cannot be undone once confirmed on the blockchain.
                    </p>
                  </div>
                </div>
              </div>

              {/* Dispute Summary */}
              <div className="bg-zinc-800/30 rounded-xl p-4 mb-6">
                <h3 className="text-sm font-medium text-zinc-300 mb-3">Dispute Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500">Dispute ID:</span>
                    <span className="text-sm text-zinc-300 font-mono">#{disputeDetails.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500">Target IP:</span>
                    <span className="text-sm text-zinc-300 font-mono">{disputeDetails.targetIpId.slice(0, 10)}...{disputeDetails.targetIpId.slice(-6)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500">Reason:</span>
                    <span className="text-sm text-zinc-300">{decodeTag(disputeDetails.targetTag)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500">Status:</span>
                    <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded text-xs">
                      {disputeDetails.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolve}
                  disabled={loading || !isReady}
                  className="flex-1 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Resolving...</span>
                    </div>
                  ) : !isReady ? (
                    'Wallet Loading...'
                  ) : (
                    'Confirm Resolve'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const CancelDisputeModal: React.FC<CancelDisputeModalProps> = ({
  isOpen,
  onClose,
  disputeDetails
}) => {
  const { address } = useAccount();
  const { getStoryClient, isReady } = useStoryClient(); // Move hook to component level
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleCancel = async () => {
    if (!address) {
      setError('Please connect your wallet');
      return;
    }

    if (!isReady) {
      setError('Story client not ready. Please try again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = await getStoryClient();
      console.log('Attempting to cancel dispute:', disputeDetails.id);

      // Just pass the dispute ID to the function
      const result = await cancelDispute(disputeDetails.id, client);
      
      if (result?.txHash) {
        setTxHash(result.txHash);
        setSuccess(true);
      } else {
        throw new Error('Failed to cancel dispute - no transaction hash returned');
      }
    } catch (err) {
      console.error('Cancel dispute error:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('0x048a9640')) {
          setError('Access denied: You may not have permission to cancel this dispute or it may not be in a cancellable state.');
        } else if (err.message.includes('revert')) {
          setError('Transaction failed: The dispute cannot be cancelled at this time.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to cancel dispute');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/30 rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700/20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500/20 to-rose-500/20 rounded-xl flex items-center justify-center border border-red-500/20">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Cancel Dispute</h2>
              <p className="text-sm text-zinc-400">Withdraw your dispute</p>
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
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Dispute Cancelled Successfully!</h3>
              <p className="text-sm text-zinc-400 mb-4">The dispute has been withdrawn from the system.</p>
              {txHash && (
                <a 
                  href={`https://explorer.storyprotocol.xyz/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 font-mono"
                >
                  View Transaction: {txHash.slice(0, 10)}...{txHash.slice(-6)}
                </a>
              )}
            </div>
          ) : (
            <>
              {/* Warning Notice */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-red-400 mb-1">Warning</h4>
                    <p className="text-xs text-red-300/80">
                      Cancelling this dispute will withdraw your claim. Any bonds or fees paid may not be refundable.
                    </p>
                  </div>
                </div>
              </div>

              {/* Dispute Summary */}
              <div className="bg-zinc-800/30 rounded-xl p-4 mb-6">
                <h3 className="text-sm font-medium text-zinc-300 mb-3">Dispute Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500">Dispute ID:</span>
                    <span className="text-sm text-zinc-300 font-mono">#{disputeDetails.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500">Target IP:</span>
                    <span className="text-sm text-zinc-300 font-mono">{disputeDetails.targetIpId.slice(0, 10)}...{disputeDetails.targetIpId.slice(-6)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500">Reason:</span>
                    <span className="text-sm text-zinc-300">{decodeTag(disputeDetails.targetTag)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500">Status:</span>
                    <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded text-xs">
                      {disputeDetails.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
                >
                  Keep Dispute
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading || !isReady}
                  className="flex-1 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Cancelling...</span>
                    </div>
                  ) : !isReady ? (
                    'Wallet Loading...'
                  ) : (
                    'Confirm Cancel'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
"use client";

import React, { useState } from 'react';
import { raiseDispute } from '../../../lib/story/dispute_functions/dispute_functions';
import { useStoryClient } from '../../../lib/story/main_functions/story-network';

interface RaiseDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  ipId: string;
  assetName: string;
  assetId: string;
}

const disputeReasons = [
  {
    tag: 'IMPROPER_REGISTRATION',
    title: 'Improper Registration',
    description: 'The IP asset was registered incorrectly or without proper authorization'
  },
  {
    tag: 'IMPROPER_USAGE',
    title: 'Improper Usage',
    description: 'The IP asset is being used in violation of its terms or license'
  },
  {
    tag: 'IMPROPER_PAYMENT',
    title: 'Payment Issues',
    description: 'Problems with royalty payments or licensing fees'
  },
  {
    tag: 'CONTENT_STANDARDS_VIOLATION',
    title: 'Content Violation',
    description: 'The content violates community standards or platform policies'
  },
  {
    tag: 'IN_DISPUTE',
    title: 'Already in Dispute',
    description: 'This asset is currently under dispute resolution'
  }
];

export const RaiseDisputeModal: React.FC<RaiseDisputeModalProps> = ({
  isOpen,
  onClose,
  ipId,
  assetName
}) => {
  const [selectedTag, setSelectedTag] = useState('');
  const [evidenceCid, setEvidenceCid] = useState('');
  const [bondAmount, setBondAmount] = useState('0.1');
  const [livenessHours, setLivenessHours] = useState('24');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [disputeId, setDisputeId] = useState('');
  const [error, setError] = useState('');
  
  const { getStoryClient } = useStoryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = await getStoryClient();
    if (!client) {
      setError('Story client not initialized');
      return;
    }

    if (!selectedTag) {
      setError('Please select a dispute reason');
      return;
    }

    if (!evidenceCid) {
      setError('Please provide evidence CID');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const livenessSeconds = parseInt(livenessHours) * 3600;
      const result = await raiseDispute(
        ipId,
        evidenceCid,
        selectedTag,
        bondAmount,
        livenessSeconds,
        client
      );
      
      if (result) {
        setTxHash(result.txHash || '');
        setDisputeId(result.disputeId?.toString() || '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to raise dispute');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedTag('');
    setEvidenceCid('');
    setBondAmount('0.1');
    setLivenessHours('24');
    setDescription('');
    setTxHash('');
    setDisputeId('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/40 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700/30 sticky top-0 bg-zinc-900/95 backdrop-blur-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-red-500/20 to-rose-500/20 rounded-lg border border-red-500/30">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-medium text-white">Raise Dispute</h2>
              <p className="text-sm text-zinc-400">Report an issue with this IP asset</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Asset Info */}
        <div className="px-6 py-4 bg-zinc-800/30 border-b border-zinc-700/30">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{assetName}</p>
              <p className="text-xs text-zinc-400 font-mono">{ipId.slice(0, 10)}...{ipId.slice(-8)}</p>
            </div>
          </div>
        </div>

        {!txHash ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Dispute Reason */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-zinc-300">
                What's the issue? <span className="text-red-400">*</span>
              </label>
              <div className="grid gap-3">
                {disputeReasons.map((reason) => (
                  <button
                    key={reason.tag}
                    type="button"
                    onClick={() => setSelectedTag(reason.tag)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                      selectedTag === reason.tag
                        ? 'border-red-500/50 bg-red-500/10 text-red-300'
                        : 'border-zinc-700/50 bg-zinc-800/30 text-zinc-300 hover:border-zinc-600/50 hover:bg-zinc-700/30'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-3 h-3 rounded-full mt-1 ${selectedTag === reason.tag ? 'bg-red-400' : 'bg-zinc-600'}`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{reason.title}</p>
                        <p className="text-xs mt-1 opacity-70">{reason.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Evidence CID */}
            <div className="space-y-3">
              <label htmlFor="evidence" className="block text-sm font-medium text-zinc-300">
                Evidence CID <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="evidence"
                value={evidenceCid}
                onChange={(e) => setEvidenceCid(e.target.value)}
                placeholder="QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all font-mono text-sm"
                required
              />
              <p className="text-xs text-zinc-500">
                Upload your evidence to IPFS and provide the Content Identifier (CID)
              </p>
            </div>

            {/* Bond Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label htmlFor="bond" className="block text-sm font-medium text-zinc-300">
                  Bond Amount (ETH)
                </label>
                <input
                  type="number"
                  id="bond"
                  value={bondAmount}
                  onChange={(e) => setBondAmount(e.target.value)}
                  placeholder="0.1"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all"
                  required
                />
                <p className="text-xs text-zinc-500">
                  Security deposit for the dispute
                </p>
              </div>

              <div className="space-y-3">
                <label htmlFor="liveness" className="block text-sm font-medium text-zinc-300">
                  Resolution Time (Hours)
                </label>
                <select
                  id="liveness"
                  value={livenessHours}
                  onChange={(e) => setLivenessHours(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all"
                >
                  <option value="24">24 hours</option>
                  <option value="48">48 hours</option>
                  <option value="72">72 hours</option>
                  <option value="168">1 week</option>
                </select>
                <p className="text-xs text-zinc-500">
                  Time allowed for dispute resolution
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <label htmlFor="description" className="block text-sm font-medium text-zinc-300">
                Additional Details (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide additional context or details about the dispute..."
                rows={4}
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all resize-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Warning */}
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-yellow-300">Important Notice</p>
                  <p className="text-xs text-yellow-400/80 mt-1">
                    False disputes may result in loss of your bond. Ensure you have valid evidence before proceeding.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 hover:text-white rounded-lg transition-all duration-200 border border-zinc-700/50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !selectedTag || !evidenceCid}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span>Raise Dispute</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Success State */
          <div className="p-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Dispute Raised Successfully!</h3>
              <p className="text-sm text-zinc-400 mb-4">
                Your dispute has been submitted and is now under review.
              </p>
              <div className="space-y-3">
                <div className="p-3 bg-zinc-800/30 rounded-lg">
                  <p className="text-xs text-zinc-500 mb-1">Dispute ID:</p>
                  <p className="text-sm text-green-400 font-mono">{disputeId}</p>
                </div>
                <div className="p-3 bg-zinc-800/30 rounded-lg">
                  <p className="text-xs text-zinc-500 mb-1">Transaction Hash:</p>
                  <p className="text-xs text-blue-400 font-mono break-all">{txHash}</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium rounded-lg transition-all duration-200"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
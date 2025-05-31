"use client";

import React, { useState } from 'react';
import { Dispute } from './types';

interface DisputeAssertionModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispute: Dispute | null;
  currentIpId: string;
  onSubmit?: (data: DisputeAssertionData) => void;
}

interface DisputeAssertionData {
  ipId: string;
  disputeId: number;
  counterEvidenceCID: string;
}

export const DisputeAssertionModal: React.FC<DisputeAssertionModalProps> = ({
  isOpen,
  onClose,
  dispute,
  currentIpId,
  onSubmit
}) => {
  const [formData, setFormData] = useState<DisputeAssertionData>({
    ipId: currentIpId,
    disputeId: 0,
    counterEvidenceCID: ''
  });
 

  
  

  const [errors, setErrors] = useState<Partial<DisputeAssertionData>>({});
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (dispute) {
      setFormData(prev => ({
        ...prev,
        disputeId: parseInt(dispute.id.toString())
      }));
    }
  }, [dispute]);

  const validateForm = () => {
    const newErrors: Partial<DisputeAssertionData> = {};
    
    if (!formData.counterEvidenceCID || formData.counterEvidenceCID.trim().length === 0) {
      newErrors.counterEvidenceCID = 'Counter evidence CID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setSubmitting(true);
      try {
        onSubmit?.(formData);
        // Reset form after successful submission
        setFormData(prev => ({ ...prev, counterEvidenceCID: '' }));
        onClose();
      } catch (error) {
        console.error('Error submitting dispute assertion:', error);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleInputChange = (field: keyof DisputeAssertionData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
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
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'resolved':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'dismissed':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'disputed':
        return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      default:
        return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
    }
  };

  if (!isOpen || !dispute) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative h-full flex items-center justify-center p-4">
        <div className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/30 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden shadow-2xl">
          
          {/* Fixed Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-zinc-700/30 bg-zinc-900/95">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-medium text-white">Challenge Dispute #{dispute.id}</h2>
                  <p className="text-xs text-zinc-400">Submit counter evidence to dispute the assertion</p>
                </div>
              </div>
              
              <button 
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-6 space-y-6">
              
              {/* Dispute Information - Compact Layout */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                <h3 className="text-sm font-medium text-red-300 mb-3 flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Dispute Summary</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-red-400">ID:</span>
                      <span className="text-white font-mono">#{dispute.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-400">Status:</span>
                      <span className={`px-2 py-0.5 text-xs rounded border ${getStatusColor(dispute.status)}`}>
                        {dispute.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-400">Date:</span>
                      <span className="text-white">{formatTimestamp(dispute.disputeTimestamp)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-red-400 text-xs">Initiated by:</span>
                      <button 
                        onClick={() => copyToClipboard(dispute.initiator)}
                        className="block text-orange-400 hover:text-orange-300 transition-colors font-mono text-sm"
                        title="Click to copy"
                      >
                        {truncateHash(dispute.initiator)}
                      </button>
                    </div>
                    <div>
                      <span className="text-red-400 text-xs">Evidence:</span>
                      <button 
                        onClick={() => copyToClipboard(dispute.evidenceHash)}
                        className="block text-purple-400 hover:text-purple-300 transition-colors font-mono text-sm"
                        title="Click to copy"
                      >
                        {truncateHash(dispute.evidenceHash, 8)}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Claim Description */}
                <div className="mt-3 pt-3 border-t border-red-500/20">
                  <span className="text-red-400 text-xs">Claim:</span>
                  <p className="text-white text-sm mt-1">{dispute.data}</p>
                </div>

                {/* UMA Link */}
                {dispute.umaLink && (
                  <div className="mt-3">
                    <a 
                      href={dispute.umaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors text-sm"
                    >
                      <span>View on UMA Oracle</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>

              {/* Challenge Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Info Banner */}
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-xs">
                      <p className="text-orange-300 font-medium mb-1">About Dispute Challenges</p>
                      <p className="text-orange-200">
                        Submit counter evidence to prove the original assertion is incorrect. 
                        This initiates arbitration through the UMA oracle system.
                      </p>
                    </div>
                  </div>
                </div>

                {/* IP Account (Read-only) */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-white uppercase tracking-wider">
                    Your IP Account
                  </label>
                  <input
                    type="text"
                    value={formData.ipId}
                    readOnly
                    className="w-full px-3 py-2 bg-zinc-700/30 border border-zinc-700/50 rounded-lg text-zinc-400 font-mono text-xs cursor-not-allowed"
                  />
                </div>

                {/* Counter Evidence CID */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-white uppercase tracking-wider">
                    Counter Evidence CID <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={formData.counterEvidenceCID}
                    onChange={(e) => handleInputChange('counterEvidenceCID', e.target.value)}
                    placeholder="QmYourCounterEvidenceHashHere... or provide detailed counter evidence"
                    rows={4}
                    className={`w-full px-3 py-2 bg-zinc-800/50 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-1 transition-all duration-200 font-mono text-xs resize-y ${
                      errors.counterEvidenceCID 
                        ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                        : 'border-zinc-700/50 focus:border-orange-500/50 focus:ring-orange-500/20'
                    }`}
                  />
                  {errors.counterEvidenceCID && (
                    <p className="text-xs text-red-400">{errors.counterEvidenceCID}</p>
                  )}
                  <p className="text-xs text-zinc-500">
                    IPFS CID of your counter evidence or detailed explanation defending your IP Asset
                  </p>
                </div>

                {/* Evidence Guidelines */}
                <div className="bg-zinc-800/30 rounded-lg p-3">
                  <h5 className="text-sm font-medium text-white mb-2">Counter Evidence Guidelines:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-start space-x-2">
                      <svg className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-zinc-300">Clear IP ownership documentation</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <svg className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-zinc-300">Timestamps and creation dates</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <svg className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-zinc-300">IPFS storage for immutability</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <svg className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-zinc-300">Legal agreements or licenses</span>
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div className="text-xs">
                      <p className="text-yellow-300 font-medium mb-1">Important:</p>
                      <p className="text-yellow-200">
                        You can only challenge once. Ensure your evidence is comprehensive and accurate. 
                        Gas fees apply for the transaction.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-zinc-700/30 bg-zinc-900/95">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 hover:text-white rounded-lg transition-all duration-200 border border-zinc-700/20 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-lg transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </div>
                ) : (
                  'Submit Challenge'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
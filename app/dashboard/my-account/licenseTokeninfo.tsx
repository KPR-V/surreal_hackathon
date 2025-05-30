"use client";

import React, { useState, useEffect } from 'react';
import { StoryAPIService } from './apiService';

interface LicenseInfoModalProps {
  token: any;
  isOpen: boolean;
  onClose: () => void;
}

export const LicenseInfoModal: React.FC<LicenseInfoModalProps> = ({ token, isOpen, onClose }) => {
  const [licenseTerms, setLicenseTerms] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && token.licenseTermsId) {
      fetchLicenseTerms();
    }
  }, [isOpen, token.licenseTermsId]);

  const fetchLicenseTerms = async () => {
    try {
      setLoading(true);
      const terms = await StoryAPIService.fetchLicenseTerms(token.licenseTermsId);
      setLicenseTerms(terms);
    } catch (err) {
      console.error('Error fetching license terms:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/20 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-700/20 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-white">License Information</h2>
            <p className="text-sm text-zinc-400">Token #{token.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800/50 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Token Info */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-white mb-4">Token Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-800/30 rounded-lg p-3">
                <p className="text-xs text-zinc-500 mb-1">Owner</p>
                <button 
                  onClick={() => copyToClipboard(token.owner)}
                  className="text-sm text-orange-400 hover:text-orange-300 transition-colors font-mono"
                  title="Click to copy"
                >
                  {token.owner.slice(0, 8)}...{token.owner.slice(-8)}
                </button>
              </div>
              <div className="bg-zinc-800/30 rounded-lg p-3">
                <p className="text-xs text-zinc-500 mb-1">Status</p>
                <span className={`text-sm font-medium ${
                  token.isActive ? 'text-green-400' : 'text-red-400'
                }`}>
                  {token.isActive ? 'Active' : 'Burnt'}
                </span>
              </div>
              <div className="bg-zinc-800/30 rounded-lg p-3 md:col-span-2">
                <p className="text-xs text-zinc-500 mb-1">License Terms ID</p>
                <button 
                  onClick={() => copyToClipboard(token.licenseTermsId)}
                  className="text-sm text-green-400 hover:text-green-300 transition-colors font-mono break-all"
                  title="Click to copy"
                >
                  {token.licenseTermsId}
                </button>
              </div>
            </div>
          </div>

          {/* License Terms */}
          <div>
            <h3 className="text-sm font-medium text-white mb-4">License Terms</h3>
            
            {loading && (
              <div className="bg-zinc-800/30 rounded-lg p-6 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-zinc-400">Loading license terms...</p>
              </div>
            )}

            {licenseTerms && (
              <div className="space-y-4">
                <div className="bg-zinc-800/30 rounded-lg p-4">
                  <h4 className="text-xs font-medium text-zinc-300 mb-3 uppercase tracking-wider">Commercial Usage</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">Commercial Use</span>
                      <span className={`text-xs font-medium ${
                        licenseTerms.terms?.commercialUse ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {licenseTerms.terms?.commercialUse ? 'Allowed' : 'Not Allowed'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">Derivatives</span>
                      <span className={`text-xs font-medium ${
                        licenseTerms.terms?.derivativesAllowed ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {licenseTerms.terms?.derivativesAllowed ? 'Allowed' : 'Not Allowed'}
                      </span>
                    </div>
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
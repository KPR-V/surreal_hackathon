"use client";

import React, { useState, useEffect } from 'react';

interface LicenseTokenWithDetails {
  id: string;
  licensorIpId: string;
  licenseTemplate: string;
  licenseTermsId: string;
  owner: string;
  transferable: string;
  blockNumber: string;
  blockTime: string;
  burntAt?: string;
  licensorName?: string;
  isActive: boolean;
  createdDate: string;
}

interface LicenseTerms {
  blockNumber: string;
  blockTime: string;
  id: string;
  licenseTemplate: string;
  licenseTerms: any[];
  terms: {
    commercialAttribution: boolean;
    commercialRevCeiling: number;
    commercialRevShare: number;
    commercialUse: boolean;
    commercializerChecker: string;
    commercializerCheckerData: string;
    currency: string;
    defaultMintingFee: number;
    derivativeRevCeiling: number;
    derivativesAllowed: boolean;
    derivativesApproval: boolean;
    derivativesAttribution: boolean;
    derivativesReciprocal: boolean;
    expiration: number;
    royaltyPolicy: string;
    transferable: boolean;
    uri: string;
  };
}

// License API Service
class LicenseAPIService {
  private static readonly API_BASE_URL = 'https://api.storyapis.com/api/v3';
  private static readonly API_KEY = process.env.NEXT_PUBLIC_STORY_API_KEY || 'MhBsxkU1z9fG6TofE59KqiiWV-YlYE8Q4awlLQehF3U';
  private static readonly CHAIN = 'story-aeneid';

  // Fetch license terms details
  static async fetchLicenseTerms(licenseTermId: string): Promise<LicenseTerms | null> {
    try {
      const options = {
        method: 'GET',
        headers: {
          'X-Api-Key': this.API_KEY,
          'X-Chain': this.CHAIN
        }
      };

      const response = await fetch(`${this.API_BASE_URL}/licenses/terms/${licenseTermId}`, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('License terms details:', data);
      return data.data || null;
    } catch (error) {
      console.error('Error fetching license terms:', error);
      throw error;
    }
  }
}

interface LicenseInfoModalProps {
  token: LicenseTokenWithDetails;
  isOpen: boolean;
  onClose: () => void;
}

export const LicenseInfoModal: React.FC<LicenseInfoModalProps> = ({ token, isOpen, onClose }) => {
  const [licenseTerms, setLicenseTerms] = useState<LicenseTerms | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && token.licenseTermsId) {
      fetchLicenseTerms();
    }
  }, [isOpen, token.licenseTermsId]);

  const fetchLicenseTerms = async () => {
    try {
      setLoading(true);
      setError(null);
      const terms = await LicenseAPIService.fetchLicenseTerms(token.licenseTermsId);
      setLicenseTerms(terms);
    } catch (err) {
      console.error('Error fetching license terms:', err);
      setError('Failed to load license terms');
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
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/20 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-700/20 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-white">License Information</h2>
            <p className="text-sm text-zinc-400">Token #{token.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800/50 rounded-lg transition-colors"
          >
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
      <p className="text-xs text-zinc-500 mb-1">Licensor Asset</p>
      <p className="text-sm text-white font-mono">{token.licensorName}</p>
    </div>
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
    <div className="bg-zinc-800/30 rounded-lg p-3">
      <p className="text-xs text-zinc-500 mb-1">Created</p>
      <p className="text-sm text-white">{token.createdDate}</p>
    </div>
    {/* NEW: License Terms ID */}
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

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
                <button 
                  onClick={fetchLicenseTerms}
                  className="mt-2 px-3 py-1 bg-red-500/20 text-red-300 rounded text-xs hover:bg-red-500/30 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {licenseTerms && (
              <div className="space-y-4">
                {/* Commercial Terms */}
                <div className="bg-zinc-800/30 rounded-lg p-4">
                  <h4 className="text-xs font-medium text-zinc-300 mb-3 uppercase tracking-wider">Commercial Usage</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">Commercial Use</span>
                      <span className={`text-xs font-medium ${
                        licenseTerms.terms.commercialUse ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {licenseTerms.terms.commercialUse ? 'Allowed' : 'Not Allowed'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">Attribution Required</span>
                      <span className={`text-xs font-medium ${
                        licenseTerms.terms.commercialAttribution ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {licenseTerms.terms.commercialAttribution ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {licenseTerms.terms.commercialRevShare > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-500">Revenue Share</span>
                        <span className="text-xs text-blue-400 font-mono">
                          {licenseTerms.terms.commercialRevShare}%
                        </span>
                      </div>
                    )}
                    {licenseTerms.terms.defaultMintingFee > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-500">Minting Fee</span>
                        <span className="text-xs text-purple-400 font-mono">
                          {licenseTerms.terms.defaultMintingFee} {licenseTerms.terms.currency || 'tokens'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Derivatives Terms */}
                <div className="bg-zinc-800/30 rounded-lg p-4">
                  <h4 className="text-xs font-medium text-zinc-300 mb-3 uppercase tracking-wider">Derivatives</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">Derivatives Allowed</span>
                      <span className={`text-xs font-medium ${
                        licenseTerms.terms.derivativesAllowed ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {licenseTerms.terms.derivativesAllowed ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">Approval Required</span>
                      <span className={`text-xs font-medium ${
                        licenseTerms.terms.derivativesApproval ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {licenseTerms.terms.derivativesApproval ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">Attribution Required</span>
                      <span className={`text-xs font-medium ${
                        licenseTerms.terms.derivativesAttribution ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {licenseTerms.terms.derivativesAttribution ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">Reciprocal License</span>
                      <span className={`text-xs font-medium ${
                        licenseTerms.terms.derivativesReciprocal ? 'text-blue-400' : 'text-zinc-400'
                      }`}>
                        {licenseTerms.terms.derivativesReciprocal ? 'Required' : 'Not Required'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transfer & Expiration */}
                <div className="bg-zinc-800/30 rounded-lg p-4">
                  <h4 className="text-xs font-medium text-zinc-300 mb-3 uppercase tracking-wider">Transfer & Expiration</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">Transferable</span>
                      <span className={`text-xs font-medium ${
                        licenseTerms.terms.transferable ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {licenseTerms.terms.transferable ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">Expiration</span>
                      <span className="text-xs text-zinc-400">
                        {licenseTerms.terms.expiration > 0 
                          ? new Date(licenseTerms.terms.expiration * 1000).toLocaleDateString()
                          : 'Never'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Technical Details */}
                <div className="bg-zinc-800/30 rounded-lg p-4">
                  <h4 className="text-xs font-medium text-zinc-300 mb-3 uppercase tracking-wider">Technical Details</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">License Template</span>
                      <button 
                        onClick={() => copyToClipboard(licenseTerms.licenseTemplate)}
                        className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors font-mono"
                        title="Click to copy"
                      >
                        {licenseTerms.licenseTemplate.slice(0, 8)}...{licenseTerms.licenseTemplate.slice(-8)}
                      </button>
                    </div>
                    {licenseTerms.terms.royaltyPolicy && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-500">Royalty Policy</span>
                        <button 
                          onClick={() => copyToClipboard(licenseTerms.terms.royaltyPolicy)}
                          className="text-xs text-pink-400 hover:text-pink-300 transition-colors font-mono"
                          title="Click to copy"
                        >
                          {licenseTerms.terms.royaltyPolicy.slice(0, 8)}...{licenseTerms.terms.royaltyPolicy.slice(-8)}
                        </button>
                      </div>
                    )}
                    {licenseTerms.terms.uri && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-500">Terms URI</span>
                        <a 
                          href={licenseTerms.terms.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          View Terms
                        </a>
                      </div>
                    )}
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
"use client";

import React, { useState, useEffect } from 'react';
import { ComprehensiveLicensingInfo } from './types';
import { getComprehensiveLicensingInfo } from './ipEdgesService';

interface LicensingInfoProps {
  ipId: string;
}

export const LicensingInfo: React.FC<LicensingInfoProps> = ({ ipId }) => {
  const [loading, setLoading] = useState(true);
  const [licensingData, setLicensingData] = useState<ComprehensiveLicensingInfo>({
    basicLicenses: [],
    licenseTerms: [],
    detailedTerms: [],
    licenseTemplates: [],
    licenseTermsIds: [],
    totalLicenses: 0,
    commercialUseAllowed: false,
    derivativesAllowed: false,
    totalRevShare: 0,
    mintingFees: []
  });

  useEffect(() => {
    fetchComprehensiveLicensingInfo();
  }, [ipId]);

  const fetchComprehensiveLicensingInfo = async () => {
    setLoading(true);
    try {
      const data = await getComprehensiveLicensingInfo(ipId);
      setLicensingData(data);
    } catch (error) {
      console.error('Error fetching comprehensive licensing info:', error);
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

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  const formatCurrency = (amount: string) => {
    if (!amount || amount === '0') return '0';
    try {
      // Convert from wei to ETH if it's a large number
      const num = parseFloat(amount);
      if (num > 1000000000000000000) {
        return `${(num / 1000000000000000000).toFixed(4)} ETH`;
      }
      return amount;
    } catch {
      return amount;
    }
  };

  if (loading) {
    return (
      <div className="bg-zinc-800/30 rounded-xl p-6">
        <div className="flex items-center justify-center h-32">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-zinc-400">Loading comprehensive licensing information...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Licensing Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-800/30 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Total Licenses</p>
          <p className="text-2xl font-bold text-blue-400">{licensingData.totalLicenses}</p>
        </div>
        <div className="bg-zinc-800/30 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Commercial Use</p>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              licensingData.commercialUseAllowed ? 'bg-green-400' : 'bg-red-400'
            }`}></div>
            <p className="text-sm font-medium text-white">
              {licensingData.commercialUseAllowed ? 'Allowed' : 'Not Allowed'}
            </p>
          </div>
        </div>
        <div className="bg-zinc-800/30 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Derivatives</p>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              licensingData.derivativesAllowed ? 'bg-green-400' : 'bg-red-400'
            }`}></div>
            <p className="text-sm font-medium text-white">
              {licensingData.derivativesAllowed ? 'Allowed' : 'Not Allowed'}
            </p>
          </div>
        </div>
        <div className="bg-zinc-800/30 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Rev Share</p>
          <p className="text-2xl font-bold text-purple-400">{licensingData.totalRevShare}%</p>
        </div>
      </div>

      {/* License Terms Summary */}
      {licensingData.licenseTerms.length > 0 && (
        <div className="bg-zinc-800/30 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4">License Terms</h3>
          <div className="space-y-4">
            {licensingData.licenseTerms.map((term: any, index: any) => (
              <div key={index} className="bg-zinc-700/30 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-white">License Terms ID:</span>
                      <button 
                        onClick={() => copyToClipboard(term.licenseTermsId)}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-mono"
                        title="Click to copy"
                      >
                        {truncateHash(term.licenseTermsId)}
                      </button>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-zinc-500">Template:</span>
                      <button 
                        onClick={() => copyToClipboard(term.licenseTemplate)}
                        className="text-sm text-green-400 hover:text-green-300 transition-colors font-mono"
                        title="Click to copy"
                      >
                        {truncateHash(term.licenseTemplate)}
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-500">Created:</span>
                      <span className="text-sm text-white">{formatTimestamp(term.blockTime)}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-zinc-500">Revenue Share:</span>
                      <span className="text-sm font-medium text-purple-400">
                        {term.licensingConfig?.commercialRevShare || 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-zinc-500">Minting Fee:</span>
                      <span className="text-sm text-yellow-400">
                        {formatCurrency(term.licensingConfig?.mintingFee || '0')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-500">Status:</span>
                      <span className={`text-sm ${term.disabled ? 'text-red-400' : 'text-green-400'}`}>
                        {term.disabled ? 'Disabled' : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed License Terms */}
      {licensingData.detailedTerms.length > 0 && (
        <div className="bg-zinc-800/30 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4">Detailed License Terms</h3>
          <div className="space-y-4">
            {licensingData.detailedTerms.map((detailedTerm: any, index: any) => (
              <div key={index} className="bg-zinc-700/30 rounded-lg p-4">
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-white">IP Asset:</span>
                    <button 
                      onClick={() => copyToClipboard(detailedTerm.ipId)}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-mono"
                      title="Click to copy"
                    >
                      {truncateHash(detailedTerm.ipId)}
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-500">Template Name:</span>
                    <span className="text-sm text-green-400">{detailedTerm.licenseTemplate?.name || 'N/A'}</span>
                  </div>
                </div>

                {/* Commercial Terms */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div className="bg-zinc-800/30 rounded-lg p-3">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Commercial Use</p>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        detailedTerm.licenseTerms?.commercialUse ? 'bg-green-400' : 'bg-red-400'
                      }`}></div>
                      <span className="text-sm text-white">
                        {detailedTerm.licenseTerms?.commercialUse ? 'Allowed' : 'Not Allowed'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-zinc-800/30 rounded-lg p-3">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Derivatives</p>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        detailedTerm.licenseTerms?.derivativesAllowed ? 'bg-green-400' : 'bg-red-400'
                      }`}></div>
                      <span className="text-sm text-white">
                        {detailedTerm.licenseTerms?.derivativesAllowed ? 'Allowed' : 'Not Allowed'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-zinc-800/30 rounded-lg p-3">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Revenue Share</p>
                    <span className="text-sm font-medium text-purple-400">
                      {detailedTerm.licenseTerms?.commercialRevShare || 0}%
                    </span>
                  </div>
                </div>

                {/* Additional Terms */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-zinc-500">Attribution Required:</span>
                    <p className={`${detailedTerm.licenseTerms?.commercialAttribution ? 'text-green-400' : 'text-red-400'}`}>
                      {detailedTerm.licenseTerms?.commercialAttribution ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Transferable:</span>
                    <p className={`${detailedTerm.licenseTerms?.transferable ? 'text-green-400' : 'text-red-400'}`}>
                      {detailedTerm.licenseTerms?.transferable ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Derivatives Approval:</span>
                    <p className={`${detailedTerm.licenseTerms?.derivativesApproval ? 'text-yellow-400' : 'text-green-400'}`}>
                      {detailedTerm.licenseTerms?.derivativesApproval ? 'Required' : 'Not Required'}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Minting Fee:</span>
                    <p className="text-yellow-400">
                      {formatCurrency(detailedTerm.licenseTerms?.mintingFee || '0')}
                    </p>
                  </div>
                </div>

                {/* Revenue Ceiling */}
                {detailedTerm.licenseTerms?.commercialRevCeiling && detailedTerm.licenseTerms.commercialRevCeiling !== '0' && (
                  <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-yellow-400">Revenue Ceiling:</span>
                      <span className="text-sm font-medium text-yellow-300">
                        {formatCurrency(detailedTerm.licenseTerms.commercialRevCeiling)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Minting Fees Summary */}
      {licensingData.mintingFees.length > 0 && (
        <div className="bg-zinc-800/30 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4">Minting Fees</h3>
          <div className="space-y-2">
            {licensingData.mintingFees.map((fee: any, index: any) => (
              <div key={index} className="flex justify-between items-center py-2 px-3 bg-zinc-700/30 rounded-lg">
                <span className="text-sm text-zinc-400">Fee #{index + 1}:</span>
                <span className="text-sm text-yellow-400 font-medium">
                  {formatCurrency(fee)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Basic Licensing Activity */}
      {licensingData.basicLicenses.length > 0 && (
        <div className="bg-zinc-800/30 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4">Recent Licensing Activity</h3>
          <div className="space-y-3">
            {licensingData.basicLicenses.slice(0, 5).map((license: any, index: any) => (
              <div key={index} className="bg-zinc-700/30 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm text-white">
                    {license.parentIpId ? 'Licensed from Parent' : 'Licensed to Child'}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {formatTimestamp(license.blockTime)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-zinc-500">Asset ID:</span>
                    <p className="text-blue-400 font-mono">{truncateHash(license.ipId)}</p>
                  </div>
                  {license.parentIpId && (
                    <div>
                      <span className="text-zinc-500">Parent ID:</span>
                      <p className="text-green-400 font-mono">{truncateHash(license.parentIpId)}</p>
                    </div>
                  )}
                  {license.licenseTokenId && (
                    <div>
                      <span className="text-zinc-500">License Token:</span>
                      <p className="text-purple-400 font-mono">{truncateHash(license.licenseTokenId)}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-zinc-500">Transaction:</span>
                    <p className="text-zinc-400 font-mono">{truncateHash(license.transactionHash)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Licensing Data */}
      {licensingData.totalLicenses === 0 && (
        <div className="bg-zinc-800/30 rounded-xl p-8 text-center">
          <p className="text-zinc-400 mb-2">No licensing information found</p>
          <p className="text-sm text-zinc-500">This asset may not have any licensing relationships or terms configured yet.</p>
        </div>
      )}
    </div>
  );
};
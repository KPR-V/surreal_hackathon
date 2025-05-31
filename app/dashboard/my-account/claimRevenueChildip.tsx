"use client";

import React, { useState } from 'react';
import { claim_revenue_from_childip } from '../../../lib/story/royalty_functions/claim_revenue';

interface ClaimRevenueChildIPProps {
  isOpen: boolean;
  onClose: () => void;
  currentIpId: string;
  onClaim?: (data: ClaimChildIPData) => void;
}

interface ClaimChildIPData {
  ipId: string;
  childIpId: string;
  useWipToken: boolean;
  royaltyPolicy: string;
  autoUnwrapIpTokens: boolean;
}

export const ClaimRevenueChildIPModal: React.FC<ClaimRevenueChildIPProps> = ({
  isOpen,
  onClose,
  currentIpId,
  onClaim
}) => {
  const [formData, setFormData] = useState<ClaimChildIPData>({
    ipId: currentIpId,
    childIpId: '',
    useWipToken: true,
    royaltyPolicy: '',
    autoUnwrapIpTokens: true
  });

  const [errors, setErrors] = useState<Partial<ClaimChildIPData>>({});
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const validateForm = () => {
    const newErrors: Partial<ClaimChildIPData> = {};
    
    if (!formData.childIpId || formData.childIpId.length < 40) {
      newErrors.childIpId = 'Please enter a valid child IP Account ID';
    }
    
    if (!formData.royaltyPolicy || formData.royaltyPolicy.length < 40) {
      newErrors.royaltyPolicy = 'Please enter a valid royalty policy address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsClaiming(true);
    setClaimResult(null);

    try {
      const result = await claim_revenue_from_childip(
        formData.ipId,
        formData.childIpId,
        formData.useWipToken,
        formData.royaltyPolicy,
        formData.autoUnwrapIpTokens
      );

      if (result && result.txHash) {
        setClaimResult({
          success: true,
          message: `Child IP revenue claimed successfully!`,
          details: result
        });
        
        onClaim?.(formData);
        
        // Auto-close after 4 seconds on success
        setTimeout(() => {
          onClose();
          setClaimResult(null);
        }, 4000);
      } else {
        throw new Error('Failed to claim child IP revenue - no transaction hash returned');
      }
    } catch (error) {
      console.error('Child IP revenue claim failed:', error);
      setClaimResult({
        success: false,
        message: `Claim failed: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const handleInputChange = (field: keyof ClaimChildIPData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative h-full flex items-center justify-center p-4">
        <div className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/30 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
          
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-zinc-700/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-medium text-white">Claim Revenue from Child IP</h2>
                  <p className="text-xs text-zinc-400">Collect revenue from a specific derivative work</p>
                </div>
              </div>
              
              <button 
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                disabled={isClaiming}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Claim Result Display */}
          {claimResult && (
            <div className={`mx-6 mt-4 p-3 rounded-lg border ${
              claimResult.success
                ? 'bg-green-500/10 border-green-500/30 text-green-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}>
              <div className="flex items-start space-x-2">
                <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  claimResult.success ? 'text-green-400' : 'text-red-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {claimResult.success ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
                <div className="flex-1">
                  <p className="text-xs break-all mb-2">{claimResult.message}</p>
                  {claimResult.success && claimResult.details && (
                    <div className="space-y-2">
                      {claimResult.details.txHash && (
                        <div className="p-2 bg-black/20 rounded border">
                          <p className="text-xs text-green-200 mb-1">Transaction Hash:</p>
                          <p className="text-xs font-mono text-green-100 break-all">
                            {Array.isArray(claimResult.details.txHash) 
                              ? claimResult.details.txHash.join(', ')
                              : claimResult.details.txHash}
                          </p>
                        </div>
                      )}
                      {claimResult.details.claimedTokens && (
                        <div className="p-2 bg-black/20 rounded border">
                          <p className="text-xs text-green-200 mb-1">Claimed Tokens:</p>
                          <p className="text-xs font-mono text-green-100">
                            {JSON.stringify(claimResult.details.claimedTokens, null, 2)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Info Banner */}
              <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <svg className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-xs">
                    <p className="text-purple-300 font-medium mb-1">What is Child IP Revenue?</p>
                    <p className="text-purple-200">
                      This function claims revenue generated by a specific child IP Asset (derivative work) 
                      that you're entitled to receive based on your parent IP's royalty policy.
                    </p>
                  </div>
                </div>
              </div>

              {/* Token Type Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-white uppercase tracking-wider">Revenue Token Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleInputChange('useWipToken', true)}
                    disabled={isClaiming}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      formData.useWipToken
                        ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                        : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-700/30'
                    } ${isClaiming ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="text-left">
                      <p className="text-sm font-medium">WIP Token</p>
                      <p className="text-xs opacity-75">Story Protocol native token</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('useWipToken', false)}
                    disabled={isClaiming}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      !formData.useWipToken
                        ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                        : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-700/30'
                    } ${isClaiming ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="text-left">
                      <p className="text-sm font-medium">MERC20 Token</p>
                      <p className="text-xs opacity-75">Custom ERC-20 token</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Parent IP Account (Read-only) */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-white uppercase tracking-wider">
                  Parent IP Account
                  <span className="text-zinc-500 font-normal ml-1 normal-case">(your asset)</span>
                </label>
                <input
                  type="text"
                  value={formData.ipId}
                  readOnly
                  className="w-full px-3 py-2.5 bg-zinc-700/30 border border-zinc-700/50 rounded-lg text-zinc-400 font-mono text-xs cursor-not-allowed"
                />
                <p className="text-xs text-zinc-500">
                  Your IP Account that will claim revenue from its child (automatically filled)
                </p>
              </div>

              {/* Child IP Account */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-white uppercase tracking-wider">
                  Child IP Account
                  <span className="text-red-400 ml-1">*</span>
                  <span className="text-zinc-500 font-normal ml-1 normal-case">(derivative work)</span>
                </label>
                <input
                  type="text"
                  value={formData.childIpId}
                  onChange={(e) => handleInputChange('childIpId', e.target.value)}
                  placeholder="0x..."
                  disabled={isClaiming}
                  className={`w-full px-3 py-2.5 bg-zinc-800/50 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-1 transition-all duration-200 font-mono text-xs ${
                    errors.childIpId 
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-zinc-700/50 focus:border-purple-500/50 focus:ring-purple-500/20'
                  } ${isClaiming ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {errors.childIpId && (
                  <p className="text-xs text-red-400">{errors.childIpId}</p>
                )}
                <p className="text-xs text-zinc-500">
                  The child IP Account from which you want to claim revenue (42-character address)
                </p>
              </div>

              {/* Royalty Policy */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-white uppercase tracking-wider">
                  Royalty Policy Address
                  <span className="text-red-400 ml-1">*</span>
                  <span className="text-zinc-500 font-normal ml-1 normal-case">(defines revenue rules)</span>
                </label>
                <input
                  type="text"
                  value={formData.royaltyPolicy}
                  onChange={(e) => handleInputChange('royaltyPolicy', e.target.value)}
                  placeholder="0x..."
                  disabled={isClaiming}
                  className={`w-full px-3 py-2.5 bg-zinc-800/50 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-1 transition-all duration-200 font-mono text-xs ${
                    errors.royaltyPolicy 
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-zinc-700/50 focus:border-purple-500/50 focus:ring-purple-500/20'
                  } ${isClaiming ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {errors.royaltyPolicy && (
                  <p className="text-xs text-red-400">{errors.royaltyPolicy}</p>
                )}
                <p className="text-xs text-zinc-500">
                  The royalty policy contract that governs revenue sharing for this relationship
                </p>
              </div>

              {/* Auto-unwrap Setting */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-white uppercase tracking-wider">Token Unwrapping</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleInputChange('autoUnwrapIpTokens', true)}
                    disabled={isClaiming}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      formData.autoUnwrapIpTokens
                        ? 'bg-green-500/20 border-green-500/30 text-green-300'
                        : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-700/30'
                    } ${isClaiming ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="text-left">
                      <p className="text-sm font-medium">Auto-unwrap</p>
                      <p className="text-xs opacity-75">Convert to base tokens</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('autoUnwrapIpTokens', false)}
                    disabled={isClaiming}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      !formData.autoUnwrapIpTokens
                        ? 'bg-orange-500/20 border-orange-500/30 text-orange-300'
                        : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-700/30'
                    } ${isClaiming ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="text-left">
                      <p className="text-sm font-medium">Keep as IP tokens</p>
                      <p className="text-xs opacity-75">Maintain IP token format</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* How it Works */}
              <div className="bg-zinc-800/30 rounded-lg p-4">
                <h5 className="text-sm font-medium text-white mb-3">How Child IP Revenue Works:</h5>
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <span className="text-purple-400 text-xs font-bold mt-0.5">1.</span>
                    <span className="text-xs text-zinc-300">Child IP generates revenue through licensing or usage</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-purple-400 text-xs font-bold mt-0.5">2.</span>
                    <span className="text-xs text-zinc-300">Royalty policy determines your share as parent IP owner</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-purple-400 text-xs font-bold mt-0.5">3.</span>
                    <span className="text-xs text-zinc-300">Revenue accumulates in the child IP's account</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-purple-400 text-xs font-bold mt-0.5">4.</span>
                    <span className="text-xs text-zinc-300">This function claims your entitled portion</span>
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
                    <ul className="text-yellow-200 space-y-0.5 text-xs">
                      <li>• Ensure the child IP actually owes revenue to your parent IP</li>
                      <li>• Verify the royalty policy address is correct</li>
                      <li>• Only claimable revenue will be processed</li>
                      <li>• Gas fees will be deducted from your wallet</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isClaiming}
                  className={`flex-1 px-4 py-2.5 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 hover:text-white rounded-lg transition-all duration-200 border border-zinc-700/20 text-sm ${
                    isClaiming ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isClaiming}
                  className={`flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 font-medium text-sm flex items-center justify-center space-x-2 ${
                    isClaiming ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isClaiming ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Claiming...</span>
                    </>
                  ) : (
                    <span>Claim Child Revenue</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
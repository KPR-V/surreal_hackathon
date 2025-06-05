"use client";

import React, { useState } from 'react';
import { tipIpAsset } from '../../../lib/story/royalty_functions/pay_ipa';
import { useStoryClient } from '../../../lib/story/main_functions/story-network';

interface TipIpAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  ipId: string;
  assetName: string;
  assetId: string;
}

export const TipIpAssetModal: React.FC<TipIpAssetModalProps> = ({
  isOpen,
  onClose,
  ipId,
  assetName
}) => {
  const [amount, setAmount] = useState('');
  const [useWipToken, setUseWipToken] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  
  const { getStoryClient } = useStoryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = await getStoryClient();
    if (!client) {
      setError('Story client not initialized');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid tip amount');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const result = await tipIpAsset(ipId, amount, useWipToken, client);
      
      if (result.success) {
        setTxHash(result.txHash || '');
      } else {
        setError(result.error || 'Transaction failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send tip');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setUseWipToken(true);
    setTxHash('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/40 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700/30">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-lg border border-yellow-500/30">
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-medium text-white">Tip IP Asset</h2>
              <p className="text-sm text-zinc-400">Send a tip to the creator</p>
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
            {/* Token Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-zinc-300">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUseWipToken(true)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                    useWipToken
                      ? 'border-blue-500/50 bg-blue-500/10 text-blue-300'
                      : 'border-zinc-700/50 bg-zinc-800/30 text-zinc-400 hover:border-zinc-600/50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${useWipToken ? 'bg-blue-400' : 'bg-zinc-600'}`}></div>
                    <span className="font-medium">WIP Token</span>
                  </div>
                  <p className="text-xs mt-1 opacity-70">Story Protocol native token</p>
                </button>
                
                <button
                  type="button"
                  onClick={() => setUseWipToken(false)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                    !useWipToken
                      ? 'border-blue-500/50 bg-blue-500/10 text-blue-300'
                      : 'border-zinc-700/50 bg-zinc-800/30 text-zinc-400 hover:border-zinc-600/50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${!useWipToken ? 'bg-blue-400' : 'bg-zinc-600'}`}></div>
                    <span className="font-medium">MERC20</span>
                  </div>
                  <p className="text-xs mt-1 opacity-70">Alternative token</p>
                </button>
              </div>
            </div>

            {/* Token Balance Info */}
            <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-500/30">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h5 className="text-xs font-medium text-blue-300">Important</h5>
                  <p className="mt-1 text-xs text-blue-200/70">
                    Ensure you have sufficient {useWipToken ? 'WIP' : 'MERC20'} tokens in your wallet. 
                    The transaction may require token approval before proceeding.
                  </p>
                </div>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-3">
              <label htmlFor="amount" className="block text-sm font-medium text-zinc-300">
                Tip Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                  {useWipToken ? 'WIP' : 'MERC20'}
                </div>
              </div>
              <p className="text-xs text-zinc-500">
                This tip will be sent directly to the IP asset creator. Make sure you have enough tokens plus gas fees.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

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
                disabled={isLoading || !amount}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Sending Tip...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>Send Tip</span>
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
              <h3 className="text-lg font-medium text-white mb-2">Tip Sent Successfully!</h3>
              <p className="text-sm text-zinc-400 mb-4">
                Your tip of {amount} {useWipToken ? 'WIP' : 'MERC20'} tokens has been sent to the creator.
              </p>
              <div className="p-3 bg-zinc-800/30 rounded-lg">
                <p className="text-xs text-zinc-500 mb-1">Transaction Hash:</p>
                <p className="text-xs text-blue-400 font-mono break-all">{txHash}</p>
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
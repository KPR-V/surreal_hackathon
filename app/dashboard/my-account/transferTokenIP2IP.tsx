"use client";

import React, { useState } from 'react';
import { transfer_ipaccount_to_ipaccount } from '../../../lib/story/IP_account/transfer_ipa_to_ipa';
import { useStoryClient } from '../../../lib/story/main_functions/story-network';
interface TransferTokenIP2IPProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer?: (data: TransferData) => void;
}

interface TransferData {
  amount: string;
  ipid: string;
  receiver_address: string;
  useWipToken: boolean;
}

export const TransferTokenIP2IP: React.FC<TransferTokenIP2IPProps> = ({
  isOpen,
  onClose,
  onTransfer
}) => {
  const { getStoryClient } = useStoryClient();
  const [formData, setFormData] = useState<TransferData>({
    amount: '',
    ipid: '',
    receiver_address: '',
    useWipToken: true
  });

  const [errors, setErrors] = useState<Partial<TransferData>>({});
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferResult, setTransferResult] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors: Partial<TransferData> = {};
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0';
    }
    
    if (!formData.ipid || formData.ipid.length < 40) {
      newErrors.ipid = 'Please enter a valid IP Account ID';
    }
    
    if (!formData.receiver_address || formData.receiver_address.length < 40) {
      newErrors.receiver_address = 'Please enter a valid receiver address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsTransferring(true);
    setTransferResult(null);

    try {
      const client = await getStoryClient();
      const result = await transfer_ipaccount_to_ipaccount(
        formData.amount,
        formData.ipid,
        formData.receiver_address,
        formData.useWipToken,
        client
      );

      if (result) {
        setTransferResult(result);
        onTransfer?.(formData);
        
        // Auto-close after 3 seconds on success
        setTimeout(() => {
          onClose();
          setTransferResult(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Transfer failed:', error);
      setTransferResult('Transfer failed. Please try again.');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleInputChange = (field: keyof TransferData, value: string | boolean) => {
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
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-medium text-white">Transfer IP Account Tokens</h2>
                  <p className="text-xs text-zinc-400">Transfer ERC-20 tokens between IP Accounts</p>
                </div>
              </div>
              
              <button 
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                disabled={isTransferring}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Transfer Result Display */}
          {transferResult && (
            <div className={`mx-6 mt-4 p-3 rounded-lg border ${
              transferResult.includes('failed') || transferResult.includes('error')
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-green-500/10 border-green-500/30 text-green-300'
            }`}>
              <div className="flex items-start space-x-2">
                <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  transferResult.includes('failed') || transferResult.includes('error')
                    ? 'text-red-400'
                    : 'text-green-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {transferResult.includes('failed') || transferResult.includes('error') ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  )}
                </svg>
                <p className="text-xs break-all">{transferResult}</p>
              </div>
            </div>
          )}

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Token Type Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-white uppercase tracking-wider">Token Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleInputChange('useWipToken', true)}
                    disabled={isTransferring}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      formData.useWipToken
                        ? 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                        : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-700/30'
                    } ${isTransferring ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="text-left">
                      <p className="text-sm font-medium">WIP Token</p>
                      <p className="text-xs opacity-75">Story Protocol native</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('useWipToken', false)}
                    disabled={isTransferring}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      !formData.useWipToken
                        ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                        : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-700/30'
                    } ${isTransferring ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="text-left">
                      <p className="text-sm font-medium">MERC20 Token</p>
                      <p className="text-xs opacity-75">Custom ERC-20</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-white uppercase tracking-wider">
                  Amount
                  <span className="text-zinc-500 font-normal ml-1 normal-case">(in token units)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    placeholder="0.0"
                    disabled={isTransferring}
                  className={`w-full px-3 py-2.5 bg-zinc-800/50 border rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      errors.amount 
                        ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                        : 'border-zinc-700/50 focus:border-blue-500/50 focus:ring-blue-500/20'
                    } ${isTransferring ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  <div className="absolute right-3 top-2.5 text-xs text-zinc-400">
                    {formData.useWipToken ? 'WIP' : 'MERC20'}
                  </div>
                </div>
                {errors.amount && (
                  <p className="text-xs text-red-400">{errors.amount}</p>
                )}
                <p className="text-xs text-zinc-500">
                  Enter amount to transfer (e.g., 1.5 for 1.5 tokens)
                </p>
              </div>

              {/* Sender IP Account ID */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-white uppercase tracking-wider">
                  Sender IP ID
                  <span className="text-zinc-500 font-normal ml-1 normal-case">(your account)</span>
                </label>
                <input
                  type="text"
                  value={formData.ipid}
                  onChange={(e) => handleInputChange('ipid', e.target.value)}
                  placeholder="0x..."
                  disabled={isTransferring}
                  className={`w-full px-3 py-2.5 bg-zinc-800/50 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-1 transition-all duration-200 font-mono text-xs ${
                    errors.ipid 
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-zinc-700/50 focus:border-blue-500/50 focus:ring-blue-500/20'
                  } ${isTransferring ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {errors.ipid && (
                  <p className="text-xs text-red-400">{errors.ipid}</p>
                )}
                <p className="text-xs text-zinc-500">
                  IP Account address that owns the tokens (42-character address starting with 0x)
                </p>
              </div>

              {/* Receiver Address */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-white uppercase tracking-wider">
                  Receiver IP ID
                  <span className="text-zinc-500 font-normal ml-1 normal-case">(destination)</span>
                </label>
                <input
                  type="text"
                  value={formData.receiver_address}
                  onChange={(e) => handleInputChange('receiver_address', e.target.value)}
                  placeholder="0x..."
                  disabled={isTransferring}
                  className={`w-full px-3 py-2.5 bg-zinc-800/50 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-1 transition-all duration-200 font-mono text-xs ${
                    errors.receiver_address 
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-zinc-700/50 focus:border-blue-500/50 focus:ring-blue-500/20'
                  } ${isTransferring ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {errors.receiver_address && (
                  <p className="text-xs text-red-400">{errors.receiver_address}</p>
                )}
                <p className="text-xs text-zinc-500">
                  IP Account address that will receive the tokens (42-character address starting with 0x)
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-xs">
                    <p className="text-blue-300 font-medium mb-1">Important Notes:</p>
                    <ul className="text-blue-200 space-y-0.5 text-xs">
                      <li>• Ensure sender account has sufficient token balance</li>
                      <li>• Both addresses must be valid IP Account addresses</li>
                      <li>• Transaction will require gas fees to be paid</li>
                      <li>• This action cannot be undone once confirmed</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isTransferring}
                  className={`flex-1 px-4 py-2.5 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 hover:text-white rounded-lg transition-all duration-200 border border-zinc-700/20 text-sm ${
                    isTransferring ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTransferring}
                  className={`flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 font-medium text-sm flex items-center justify-center space-x-2 ${
                    isTransferring ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isTransferring ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Transferring...</span>
                    </>
                  ) : (
                    <span>Transfer Tokens</span>
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
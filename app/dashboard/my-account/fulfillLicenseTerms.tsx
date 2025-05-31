"use client";

import React, { useState } from 'react';
import { fulfillLicenseTerms } from '../../../lib/story/royalty_functions/pay_ipa';
import { useStoryClient } from '../../../lib/story/main_functions/story-network';
interface FulfillLicenseTermsProps {
  isOpen: boolean;
  onClose: () => void;
  currentIpId: string;
  onFulfill?: (data: FulfillmentData) => void;
}

interface FulfillmentData {
  receiverIpId: string;
  payerIpId: string;
  amount: string;
  useWipToken: boolean;
}

export const FulfillLicenseTermsModal: React.FC<FulfillLicenseTermsProps> = ({
  isOpen,
  onClose,
  currentIpId,
  onFulfill
}) => {
  const { getStoryClient } = useStoryClient();
  const [formData, setFormData] = useState<FulfillmentData>({
    receiverIpId: '',
    payerIpId: currentIpId,
    amount: '',
    useWipToken: true
  });

  const [errors, setErrors] = useState<Partial<FulfillmentData>>({});
  const [isFulfilling, setIsFulfilling] = useState(false);
  const [fulfillmentResult, setFulfillmentResult] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors: Partial<FulfillmentData> = {};
    
    if (!formData.receiverIpId || formData.receiverIpId.length < 40) {
      newErrors.receiverIpId = 'Please enter a valid receiver IP Account ID';
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsFulfilling(true);
    setFulfillmentResult(null);

    try {
      const client = await getStoryClient();
      const result = await fulfillLicenseTerms(
        formData.receiverIpId,
        formData.payerIpId,
        formData.amount,
        formData.useWipToken,
        client
      );

      if (result) {
        setFulfillmentResult(result);
        onFulfill?.(formData);
        
        // Auto-close after 3 seconds on success
        setTimeout(() => {
          onClose();
          setFulfillmentResult(null);
        }, 3000);
      }
    } catch (error) {
      console.error('License fulfillment failed:', error);
      setFulfillmentResult('License fulfillment failed. Please try again.');
    } finally {
      setIsFulfilling(false);
    }
  };

  const handleInputChange = (field: keyof FulfillmentData, value: string | boolean) => {
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
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-medium text-white">Fulfill License Terms</h2>
                  <p className="text-xs text-zinc-400">Pay royalties on behalf of another IP Account</p>
                </div>
              </div>
              
              <button 
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                disabled={isFulfilling}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Fulfillment Result Display */}
          {fulfillmentResult && (
            <div className={`mx-6 mt-4 p-3 rounded-lg border ${
              fulfillmentResult.includes('failed') || fulfillmentResult.includes('error')
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-green-500/10 border-green-500/30 text-green-300'
            }`}>
              <div className="flex items-start space-x-2">
                <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  fulfillmentResult.includes('failed') || fulfillmentResult.includes('error')
                    ? 'text-red-400'
                    : 'text-green-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {fulfillmentResult.includes('failed') || fulfillmentResult.includes('error') ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  )}
                </svg>
                <p className="text-xs break-all">{fulfillmentResult}</p>
              </div>
            </div>
          )}

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Info Banner */}
              <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <svg className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-xs">
                    <p className="text-orange-300 font-medium mb-1">What is License Fulfillment?</p>
                    <p className="text-orange-200">
                      This allows you to pay royalties to another IP Account on behalf of a third party. 
                      Useful for covering licensing costs or fulfilling derivative work obligations.
                    </p>
                  </div>
                </div>
              </div>

              {/* Token Type Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-white uppercase tracking-wider">Payment Token</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleInputChange('useWipToken', true)}
                    disabled={isFulfilling}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      formData.useWipToken
                        ? 'bg-orange-500/20 border-orange-500/30 text-orange-300'
                        : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-700/30'
                    } ${isFulfilling ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="text-left">
                      <p className="text-sm font-medium">WIP Token</p>
                      <p className="text-xs opacity-75">Story Protocol native</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('useWipToken', false)}
                    disabled={isFulfilling}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      !formData.useWipToken
                        ? 'bg-orange-500/20 border-orange-500/30 text-orange-300'
                        : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-700/30'
                    } ${isFulfilling ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="text-left">
                      <p className="text-sm font-medium">MERC20 Token</p>
                      <p className="text-xs opacity-75">Custom ERC-20</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Receiver IP Account */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-white uppercase tracking-wider">
                  Receiver IP Account
                  <span className="text-red-400 ml-1">*</span>
                  <span className="text-zinc-500 font-normal ml-1 normal-case">(who receives payment)</span>
                </label>
                <input
                  type="text"
                  value={formData.receiverIpId}
                  onChange={(e) => handleInputChange('receiverIpId', e.target.value)}
                  placeholder="0x..."
                  disabled={isFulfilling}
                  className={`w-full px-3 py-2.5 bg-zinc-800/50 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-1 transition-all duration-200 font-mono text-xs ${
                    errors.receiverIpId 
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-zinc-700/50 focus:border-orange-500/50 focus:ring-orange-500/20'
                  } ${isFulfilling ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {errors.receiverIpId && (
                  <p className="text-xs text-red-400">{errors.receiverIpId}</p>
                )}
                <p className="text-xs text-zinc-500">
                  The IP Account that will receive the royalty payment (42-character address starting with 0x)
                </p>
              </div>

              {/* Payer IP Account (Read-only) */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-white uppercase tracking-wider">
                  Payer IP Account
                  <span className="text-zinc-500 font-normal ml-1 normal-case">(your account)</span>
                </label>
                <input
                  type="text"
                  value={formData.payerIpId}
                  readOnly
                  className="w-full px-3 py-2.5 bg-zinc-700/30 border border-zinc-700/50 rounded-lg text-zinc-400 font-mono text-xs cursor-not-allowed"
                />
                <p className="text-xs text-zinc-500">
                  Your IP Account that will make the payment (automatically filled)
                </p>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-white uppercase tracking-wider">
                  Payment Amount
                  <span className="text-red-400 ml-1">*</span>
                  <span className="text-zinc-500 font-normal ml-1 normal-case">(in token units)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    placeholder="0.0"
                    disabled={isFulfilling}
                    className={`w-full px-3 py-2.5 bg-zinc-800/50 border rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      errors.amount 
                        ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                        : 'border-zinc-700/50 focus:border-orange-500/50 focus:ring-orange-500/20'
                    } ${isFulfilling ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  <div className="absolute right-3 top-2.5 text-xs text-zinc-400">
                    {formData.useWipToken ? 'WIP' : 'MERC20'}
                  </div>
                </div>
                {errors.amount && (
                  <p className="text-xs text-red-400">{errors.amount}</p>
                )}
                <p className="text-xs text-zinc-500">
                  Amount of royalty to pay (e.g., 1.5 for 1.5 tokens)
                </p>
              </div>

              {/* Warning Box */}
              <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <svg className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="text-xs">
                    <p className="text-yellow-300 font-medium mb-1">Important Considerations:</p>
                    <ul className="text-yellow-200 space-y-0.5 text-xs">
                      <li>• Ensure your account has sufficient token balance</li>
                      <li>• This payment is made on behalf of another party</li>
                      <li>• Transaction cannot be reversed once confirmed</li>
                      <li>• Gas fees will be deducted from your account</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isFulfilling}
                  className={`flex-1 px-4 py-2.5 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 hover:text-white rounded-lg transition-all duration-200 border border-zinc-700/20 text-sm ${
                    isFulfilling ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isFulfilling}
                  className={`flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg transition-all duration-200 font-medium text-sm flex items-center justify-center space-x-2 ${
                    isFulfilling ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isFulfilling ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Fulfilling...</span>
                    </>
                  ) : (
                    <span>Pay Royalty</span>
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
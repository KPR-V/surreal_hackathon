"use client";

import React, { useState, useEffect } from 'react';
import { get_royalty_vault_address } from '../../../lib/story/royalty_functions/claim_revenue';
import { useStoryClient } from '../../../lib/story/main_functions/story-network';

interface SellRTModalProps {
  isOpen: boolean;
  onClose: () => void;
  nftAsset: {
    id: string;
    name: string;
    image_url?: string;
    token: {
      address: string;
      name: string;
      symbol: string;
    };
  };
  ipId: string;
  onList?: (data: SellRTData) => void;
}

interface SellRTData {
  ipId: string;
  royaltyVaultAddress: string;
  nftAsset: any;
  percentageToSell: number;
  pricePerTokenIP: number;
}

export const SellRTModal: React.FC<SellRTModalProps> = ({
  isOpen,
  onClose,
  nftAsset,
  ipId,
  onList
}) => {
  const { getStoryClient, isReady } = useStoryClient();
  const [formData, setFormData] = useState({
    percentageToSell: '',  // Changed to string to preserve leading zeros
    pricePerTokenIP: ''    // Changed to string to preserve leading zeros
  });
  
  const [royaltyVaultAddress, setRoyaltyVaultAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListing, setIsListing] = useState(false);
  const [listResult, setListResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // IP token exchange rate
  const IP_TOKEN_USD_RATE = 4.15;

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Fetch royalty vault address when modal opens
  useEffect(() => {
    if (isOpen && ipId && isReady) {
      fetchRoyaltyVaultAddress();
    }
  }, [isOpen, ipId, isReady]);

  const fetchRoyaltyVaultAddress = async () => {
    if (!isReady) {
      setListResult({
        success: false,
        message: 'Wallet not connected. Please connect your wallet first.'
      });
      return;
    }

    setIsLoading(true);
    try {
      const client = await getStoryClient();
      const vaultAddress = await get_royalty_vault_address(ipId, client);
      if (vaultAddress) {
        setRoyaltyVaultAddress(vaultAddress);
      } else {
        throw new Error('No royalty vault found for this IP');
      }
    } catch (error) {
      console.error('Error fetching royalty vault address:', error);
      setListResult({
        success: false,
        message: `Failed to fetch royalty vault: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const percentageValue = parseFloat(formData.percentageToSell);
    const priceValue = parseFloat(formData.pricePerTokenIP);
    
    if (isNaN(percentageValue) || percentageValue <= 0 || percentageValue > 100) {
      setListResult({
        success: false,
        message: 'Percentage must be between 1 and 100'
      });
      return;
    }

    if (isNaN(priceValue) || priceValue <= 0) {
      setListResult({
        success: false,
        message: 'Price per token must be greater than 0 IP'
      });
      return;
    }

    setIsListing(true);
    setListResult(null);

    try {
      // Create listing data - ensure numbers are properly converted
      const listingData: SellRTData = {
        ipId,
        royaltyVaultAddress,
        nftAsset,
        percentageToSell: Number(percentageValue.toFixed(3)), // Ensure it's a proper number
        pricePerTokenIP: Number(priceValue.toFixed(6))        // Ensure it's a proper number with precision
      };

      // Store in localStorage for now (in a real app, this would go to a backend)
      const existingListings = JSON.parse(localStorage.getItem('royaltyTokenListings') || '[]');
      const newListing = {
        id: Date.now().toString(),
        ...listingData,
        listedAt: new Date().toISOString(),
        status: 'active'
      };
      existingListings.push(newListing);
      localStorage.setItem('royaltyTokenListings', JSON.stringify(existingListings));

      setListResult({
        success: true,
        message: `Successfully listed ${percentageValue}% of royalty tokens for ${priceValue} IP each!`
      });

      onList?.(listingData);

      // Auto-close after 3 seconds on success
      setTimeout(() => {
        onClose();
        setListResult(null);
        setFormData({ percentageToSell: '', pricePerTokenIP: '' });
      }, 3000);

    } catch (error) {
      console.error('Listing failed:', error);
      setListResult({
        success: false,
        message: `Listing failed: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
      });
    } finally {
      setIsListing(false);
    }
  };

  const handleInputChange = (field: 'percentageToSell' | 'pricePerTokenIP', value: string) => {
    // Allow empty string, numbers, and decimal points
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Helper function to get numeric values for calculations
  const getNumericValue = (stringValue: string): number => {
    const num = parseFloat(stringValue);
    return isNaN(num) ? 0 : num;
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Modal positioned in center of viewport */}
      <div className="relative h-full flex items-center justify-center p-4">
        <div className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/30 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
          
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-zinc-700/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-medium text-white">Sell Royalty Tokens</h2>
                  <p className="text-xs text-zinc-400">List your royalty tokens for sale on the marketplace</p>
                </div>
              </div>
              
              <button 
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                disabled={isListing}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* List Result Display */}
          {listResult && (
            <div className={`mx-6 mt-4 p-3 rounded-lg border ${
              listResult.success
                ? 'bg-green-500/10 border-green-500/30 text-green-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}>
              <div className="flex items-start space-x-2">
                <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  listResult.success ? 'text-green-400' : 'text-red-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {listResult.success ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
                <p className="text-xs break-all">{listResult.message}</p>
              </div>
            </div>
          )}

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            
            {/* NFT Asset Info */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-zinc-800/50 to-zinc-700/50 rounded-lg overflow-hidden flex-shrink-0">
                  {nftAsset.image_url ? (
                    <img 
                      src={nftAsset.image_url} 
                      alt={nftAsset.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white mb-1">{nftAsset.name}</h3>
                  <p className="text-xs text-zinc-400 mb-2">{nftAsset.token.symbol} • Token #{nftAsset.id}</p>
                  <div className="text-xs text-purple-300">
                    Contract: {truncateAddress(nftAsset.token.address)}
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Info Banner */}
              <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <svg className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-xs">
                    <p className="text-purple-300 font-medium mb-1">What are Royalty Tokens?</p>
                    <p className="text-purple-200">
                      Royalty tokens represent your share of future revenue from this IP Asset. 
                      When you sell these tokens, buyers will receive the percentage of future royalties you specify.
                    </p>
                  </div>
                </div>
              </div>

              {/* IP Token Info Banner */}
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <div className="text-xs">
                    <p className="text-blue-300 font-medium mb-1">IP Token Pricing</p>
                    <p className="text-blue-200">
                      All prices are set in IP tokens. Current exchange rate: <span className="font-semibold">1 IP = $4.15 USD</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* IP Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-white uppercase tracking-wider">
                    IP Asset ID
                  </label>
                  <div className="px-3 py-2.5 bg-zinc-700/30 border border-zinc-700/50 rounded-lg">
                    <p className="text-xs font-mono text-zinc-300">{truncateAddress(ipId)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-white uppercase tracking-wider">
                    Royalty Vault Address
                  </label>
                  <div className="px-3 py-2.5 bg-zinc-700/30 border border-zinc-700/50 rounded-lg">
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 border border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs text-zinc-400">Loading...</span>
                      </div>
                    ) : royaltyVaultAddress ? (
                      <p className="text-xs font-mono text-zinc-300">{truncateAddress(royaltyVaultAddress)}</p>
                    ) : (
                      <p className="text-xs text-red-400">Failed to load</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Percentage to Sell */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-white uppercase tracking-wider">
                  Percentage of Royalty Tokens to Sell
                  <span className="text-zinc-500 font-normal ml-1 normal-case">(1-100%)</span>
                </label>
                <input
                  type="text"  // Changed from "number" to "text"
                  value={formData.percentageToSell}
                  onChange={(e) => handleInputChange('percentageToSell', e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-800/30 border border-zinc-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50 focus:bg-zinc-700/30 transition-all duration-200"
                  placeholder="Enter percentage (e.g., 25.5)"
                  disabled={isListing || isLoading}
                />
                <p className="text-xs text-zinc-500">
                  This percentage of all future royalties from this IP will be transferred to the buyer
                </p>
              </div>

              {/* Price per Token in IP */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-white uppercase tracking-wider">
                  Price Per Token (IP)
                  <span className="text-zinc-500 font-normal ml-1 normal-case">(per 1% of royalty)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-blue-400 text-sm font-medium">IP</span>
                  </div>
                  <input
                    type="text"  // Changed from "number" to "text"
                    value={formData.pricePerTokenIP}
                    onChange={(e) => handleInputChange('pricePerTokenIP', e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 bg-zinc-800/30 border border-zinc-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50 focus:bg-zinc-700/30 transition-all duration-200"
                    placeholder="Enter price per 1% (e.g., 0.07)"
                    disabled={isListing || isLoading}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">
                    USD equivalent: ${(getNumericValue(formData.pricePerTokenIP) * IP_TOKEN_USD_RATE).toFixed(3)} per 1%
                  </span>
                  <span className="text-zinc-500">
                    Total: {(getNumericValue(formData.percentageToSell) * getNumericValue(formData.pricePerTokenIP)).toFixed(3)} IP
                  </span>
                </div>
              </div>

              {/* Revenue Calculation */}
              {getNumericValue(formData.percentageToSell) > 0 && getNumericValue(formData.pricePerTokenIP) > 0 && (
                <div className="bg-zinc-800/30 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-white mb-3">Listing Summary:</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-400">Royalty percentage for sale:</span>
                      <span className="text-xs text-white font-medium">{formData.percentageToSell}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-400">Price per 1% royalty:</span>
                      <span className="text-xs text-white font-medium">{formData.pricePerTokenIP} IP</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-400">USD equivalent per 1%:</span>
                      <span className="text-xs text-zinc-300">${(getNumericValue(formData.pricePerTokenIP) * IP_TOKEN_USD_RATE).toFixed(3)}</span>
                    </div>
                    <div className="border-t border-zinc-700/50 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-300 font-medium">Total listing value:</span>
                        <div className="text-right">
                          <div className="text-sm text-blue-400 font-bold">
                            {(getNumericValue(formData.percentageToSell) * getNumericValue(formData.pricePerTokenIP)).toFixed(3)} IP
                          </div>
                          <div className="text-xs text-zinc-400">
                            (${(getNumericValue(formData.percentageToSell) * getNumericValue(formData.pricePerTokenIP) * IP_TOKEN_USD_RATE).toFixed(3)} USD)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Important Notes */}
              <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <svg className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="text-xs">
                    <p className="text-yellow-300 font-medium mb-1">Important Considerations:</p>
                    <ul className="text-yellow-200 space-y-0.5 text-xs">
                      <li>• Once sold, you'll permanently lose that percentage of future royalties</li>
                      <li>• Buyers will receive their share of all future revenue from this IP</li>
                      <li>• All transactions are conducted in IP tokens (1 IP = $4.15 USD)</li>
                      <li>• This listing will be visible to all marketplace users</li>
                      <li>• You can cancel the listing anytime before it's purchased</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isListing}
                  className={`flex-1 px-4 py-2.5 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 hover:text-white rounded-lg transition-all duration-200 border border-zinc-700/20 text-sm ${
                    isListing ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isListing || isLoading || !royaltyVaultAddress || getNumericValue(formData.percentageToSell) <= 0 || getNumericValue(formData.pricePerTokenIP) <= 0}
                  className={`flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all duration-200 font-medium text-sm flex items-center justify-center space-x-2 ${
                    (isListing || isLoading || !royaltyVaultAddress || getNumericValue(formData.percentageToSell) <= 0 || getNumericValue(formData.pricePerTokenIP) <= 0) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isListing ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Listing...</span>
                    </>
                  ) : (
                    <span>List for Sale</span>
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
"use client";

import React, { useState } from 'react';
import { createSpgNftCollection } from '../../../lib/story/nft_functions/create_new_nftcollection';
import { Address } from 'viem';
import { useStoryClient } from '../../../lib/story/main_functions/story-network';
interface CreateNFTCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (data: CollectionData, contractAddress?: string) => void;
}

interface CollectionData {
  name: string;
  symbol: string;
  mintFeeRecipient: string;
  isPublicMinting: boolean;
  mintOpen: boolean;
}

export const CreateNFTCollectionModal: React.FC<CreateNFTCollectionModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const { getStoryClient } = useStoryClient();
  const [activeTab, setActiveTab] = useState<'preview' | 'create'>('preview');
  const [formData, setFormData] = useState<CollectionData>({
    name: 'My Custom Collection',
    symbol: 'MCC',
    mintFeeRecipient: '0x0000000000000000000000000000000000000000',
    isPublicMinting: false,
    mintOpen: true
  });

  const [errors, setErrors] = useState<Partial<CollectionData>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [creationResult, setCreationResult] = useState<{
    success: boolean;
    message: string;
    contractAddress?: string;
  } | null>(null);

  const validateForm = () => {
    const newErrors: Partial<CollectionData> = {};
    
    if (!formData.name || formData.name.length < 3) {
      newErrors.name = 'Collection name must be at least 3 characters';
    }
    
    if (!formData.symbol || formData.symbol.length < 2) {
      newErrors.symbol = 'Symbol must be at least 2 characters';
    }
    
    if (!formData.mintFeeRecipient || formData.mintFeeRecipient.length !== 42) {
      newErrors.mintFeeRecipient = 'Please enter a valid Ethereum address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsCreating(true);
    setCreationResult(null);

    try {
      const client = await getStoryClient();
      const contractAddress = await createSpgNftCollection(
        client,
        formData.mintFeeRecipient as Address,
        formData.name,
        formData.symbol,
        formData.mintFeeRecipient as Address,
        formData.isPublicMinting,
        formData.mintOpen
      );

      if (contractAddress) {
        setCreationResult({
          success: true,
          message: `Collection created successfully! Contract: ${contractAddress}`,
          contractAddress:contractAddress.spgNftContract
        });
        
        onCreate?.(formData, contractAddress.spgNftContract);
        
        // Auto-close after 4 seconds on success
        setTimeout(() => {
          onClose();
          setCreationResult(null);
        }, 4000);
      } else {
        throw new Error('Failed to create collection - no contract address returned');
      }
    } catch (error) {
      console.error('Collection creation failed:', error);
      setCreationResult({
        success: false,
        message: `Creation failed: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (field: keyof CollectionData, value: string | boolean) => {
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
        <div className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/30 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
          
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-zinc-700/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-medium text-white">Create SPG NFT Collection</h2>
                  <p className="text-xs text-zinc-400">Set up a new NFT collection for IP Assets</p>
                </div>
              </div>
              
              <button 
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                disabled={isCreating}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Creation Result Display */}
          {creationResult && (
            <div className={`mx-6 mt-4 p-3 rounded-lg border ${
              creationResult.success
                ? 'bg-green-500/10 border-green-500/30 text-green-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}>
              <div className="flex items-start space-x-2">
                <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  creationResult.success ? 'text-green-400' : 'text-red-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {creationResult.success ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
                <div className="flex-1">
                  <p className="text-xs break-all">{creationResult.message}</p>
                  {creationResult.success && creationResult.contractAddress && (
                    <div className="mt-2 p-2 bg-black/20 rounded border">
                      <p className="text-xs text-green-200 mb-1">Contract Address:</p>
                      <p className="text-xs font-mono text-green-100 break-all">{creationResult.contractAddress}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="px-6 pt-4 flex-shrink-0">
            <div className="flex space-x-1 bg-zinc-800/30 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('preview')}
                disabled={isCreating}
                className={`px-3 py-2 rounded text-xs font-medium transition-all duration-200 ${
                  activeTab === 'preview'
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700/30'
                } ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Collection Preview
              </button>
              <button
                onClick={() => setActiveTab('create')}
                disabled={isCreating}
                className={`px-3 py-2 rounded text-xs font-medium transition-all duration-200 ${
                  activeTab === 'create'
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700/30'
                } ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Configuration
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto px-6 py-6">
            {activeTab === 'preview' ? (
              /* Preview Tab */
              <div className="space-y-5">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-medium text-white mb-1">Collection Preview</h3>
                  <p className="text-sm text-zinc-400">See what your NFT collection will look like</p>
                </div>

                {/* Collection Card Preview */}
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
                  <div className="flex items-center space-x-4 mb-5">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <span className="text-lg font-bold text-white">{formData.symbol}</span>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-1">{formData.name}</h4>
                      <p className="text-purple-300 text-xs">SPG NFT Collection</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Collection Details */}
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-white mb-2">Collection Details</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-zinc-400">Symbol:</span>
                          <span className="text-xs text-white font-mono">{formData.symbol}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-zinc-400">Type:</span>
                          <span className="text-xs text-purple-300">SPG NFT Collection</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-zinc-400">Blockchain:</span>
                          <span className="text-xs text-white">Story Network</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-zinc-400">Standard:</span>
                          <span className="text-xs text-white">ERC-721</span>
                        </div>
                      </div>
                    </div>

                    {/* Minting Configuration */}
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-white mb-2">Minting Settings</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-zinc-400">Public Minting:</span>
                          <div className={`px-2 py-1 rounded text-xs ${
                            formData.isPublicMinting 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-orange-500/20 text-orange-400'
                          }`}>
                            {formData.isPublicMinting ? 'Enabled' : 'Restricted'}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-zinc-400">Mint Open:</span>
                          <div className={`px-2 py-1 rounded text-xs ${
                            formData.mintOpen 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {formData.mintOpen ? 'Open' : 'Closed'}
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-zinc-400">Fee Recipient:</span>
                          <span className="text-xs text-white font-mono">
                            {formData.mintFeeRecipient.slice(0, 6)}...{formData.mintFeeRecipient.slice(-4)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="bg-zinc-800/30 rounded-lg p-5">
                  <h5 className="text-sm font-medium text-white mb-3">What you'll get:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-start space-x-2">
                      <svg className="w-4 h-4 text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <p className="text-white text-xs font-medium">Smart Contract Address</p>
                        <p className="text-zinc-400 text-xs">Unique contract address for your collection</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <svg className="w-4 h-4 text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <p className="text-white text-xs font-medium">Transaction Hash</p>
                        <p className="text-zinc-400 text-xs">Proof of collection creation on blockchain</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <svg className="w-4 h-4 text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <p className="text-white text-xs font-medium">Minting Capabilities</p>
                        <p className="text-zinc-400 text-xs">Ability to create NFTs in this collection</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <svg className="w-4 h-4 text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <p className="text-white text-xs font-medium">IP Asset Registration</p>
                        <p className="text-zinc-400 text-xs">NFTs can be registered as IP Assets</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Configuration Tab */
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-medium text-white mb-1">Collection Configuration</h3>
                  <p className="text-sm text-zinc-400">Set up your NFT collection parameters</p>
                </div>

                {/* Basic Information */}
                <div className="bg-zinc-800/30 rounded-lg p-5 space-y-5">
                  <h4 className="text-sm font-medium text-white">Basic Information</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-white uppercase tracking-wider">
                        Collection Name
                        <span className="text-red-400 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="My Custom Collection"
                        disabled={isCreating}
                        className={`w-full px-3 py-2.5 bg-zinc-700/50 border rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 transition-all duration-200 ${
                          errors.name 
                            ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                            : 'border-zinc-600/50 focus:border-purple-500/50 focus:ring-purple-500/20'
                        } ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                      {errors.name && (
                        <p className="text-xs text-red-400">{errors.name}</p>
                      )}
                      <p className="text-xs text-zinc-500">The display name for your collection</p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-white uppercase tracking-wider">
                        Symbol
                        <span className="text-red-400 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.symbol}
                        onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                        placeholder="MCC"
                        maxLength={10}
                        disabled={isCreating}
                        className={`w-full px-3 py-2.5 bg-zinc-700/50 border rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 transition-all duration-200 uppercase ${
                          errors.symbol 
                            ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                            : 'border-zinc-600/50 focus:border-purple-500/50 focus:ring-purple-500/20'
                        } ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                      {errors.symbol && (
                        <p className="text-xs text-red-400">{errors.symbol}</p>
                      )}
                      <p className="text-xs text-zinc-500">Short identifier (e.g., MCC, ART, GAME)</p>
                    </div>
                  </div>
                </div>

                {/* Minting Configuration */}
                <div className="bg-zinc-800/30 rounded-lg p-5 space-y-5">
                  <h4 className="text-sm font-medium text-white">Minting Configuration</h4>
                  
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-white uppercase tracking-wider">
                        Mint Fee Recipient Address
                        <span className="text-red-400 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.mintFeeRecipient}
                        onChange={(e) => handleInputChange('mintFeeRecipient', e.target.value)}
                        placeholder="0x0000000000000000000000000000000000000000"
                        disabled={isCreating}
                        className={`w-full px-3 py-2.5 bg-zinc-700/50 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-1 transition-all duration-200 font-mono text-xs ${
                          errors.mintFeeRecipient 
                            ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                            : 'border-zinc-600/50 focus:border-purple-500/50 focus:ring-purple-500/20'
                        } ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                      {errors.mintFeeRecipient && (
                        <p className="text-xs text-red-400">{errors.mintFeeRecipient}</p>
                      )}
                      <p className="text-xs text-zinc-500">
                        Address that will receive minting fees. Use zero address (0x0000...) for no fees
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-3">
                        <label className="block text-xs font-medium text-white uppercase tracking-wider">Public Minting</label>
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => handleInputChange('isPublicMinting', true)}
                            disabled={isCreating}
                            className={`w-full p-3 rounded-lg border transition-all duration-200 text-left ${
                              formData.isPublicMinting
                                ? 'bg-green-500/20 border-green-500/30 text-green-300'
                                : 'bg-zinc-700/30 border-zinc-600/30 text-zinc-400 hover:bg-zinc-600/30'
                            } ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <div className="text-sm font-medium">Public (Enabled)</div>
                            <div className="text-xs opacity-75">Anyone can mint from this collection</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInputChange('isPublicMinting', false)}
                            disabled={isCreating}
                            className={`w-full p-3 rounded-lg border transition-all duration-200 text-left ${
                              !formData.isPublicMinting
                                ? 'bg-orange-500/20 border-orange-500/30 text-orange-300'
                                : 'bg-zinc-700/30 border-zinc-600/30 text-zinc-400 hover:bg-zinc-600/30'
                            } ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <div className="text-sm font-medium">Restricted (Disabled)</div>
                            <div className="text-xs opacity-75">Only authorized addresses can mint</div>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="block text-xs font-medium text-white uppercase tracking-wider">Mint Status</label>
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => handleInputChange('mintOpen', true)}
                            disabled={isCreating}
                            className={`w-full p-3 rounded-lg border transition-all duration-200 text-left ${
                              formData.mintOpen
                                ? 'bg-green-500/20 border-green-500/30 text-green-300'
                                : 'bg-zinc-700/30 border-zinc-600/30 text-zinc-400 hover:bg-zinc-600/30'
                            } ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <div className="text-sm font-medium">Open</div>
                            <div className="text-xs opacity-75">Minting is available from creation</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInputChange('mintOpen', false)}
                            disabled={isCreating}
                            className={`w-full p-3 rounded-lg border transition-all duration-200 text-left ${
                              !formData.mintOpen
                                ? 'bg-red-500/20 border-red-500/30 text-red-300'
                                : 'bg-zinc-700/30 border-zinc-600/30 text-zinc-400 hover:bg-zinc-600/30'
                            } ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <div className="text-sm font-medium">Closed</div>
                            <div className="text-xs opacity-75">Minting will be disabled initially</div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-xs">
                      <p className="text-purple-300 font-medium mb-1">Important Information:</p>
                      <ul className="text-purple-200 space-y-0.5 text-xs">
                        <li>• Collection creation requires gas fees to be paid</li>
                        <li>• Once created, some parameters cannot be changed</li>
                        <li>• The collection will be deployed on Story Network</li>
                        <li>• You'll receive the contract address after successful creation</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isCreating}
                    className={`flex-1 px-4 py-2.5 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 hover:text-white rounded-lg transition-all duration-200 border border-zinc-700/20 text-sm ${
                      isCreating ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className={`flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 font-medium text-sm flex items-center justify-center space-x-2 ${
                      isCreating ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isCreating ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Creating Collection...</span>
                      </>
                    ) : (
                      <span>Create Collection</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
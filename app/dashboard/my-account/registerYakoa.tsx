"use client";

import React, { useState, useEffect } from 'react';
import { X, Shield, Upload, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useAccount } from 'wagmi';
import { usePublicClient } from 'wagmi';

interface RegisterYakoaModalProps {
  isOpen: boolean;
  onClose: () => void;
  ipAsset: {
    ipId: string;
    name: string;
    image: string;
    transactionHash?: string;
    blockNumber?: string;
    blockTimestamp?: string;
  };
  onRegister: (data: any) => void;
}

interface FormData {
  name: string;
  mediaUrl: string;
  mediaHash: string;
  trustReason: {
    type: string;
    platform_name: string;
  };
  licenseParents: Array<{
    license_id: string;
    token_id: string;
  }>;
  authorizations: Array<{
    authorization_id: string;
    token_id: string;
  }>;
}

async function calculateFileHashFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    console.error('Error calculating hash from URL:', error);
    throw error;
  }
}

export const RegisterYakoaModal: React.FC<RegisterYakoaModalProps> = ({
  isOpen,
  onClose,
  ipAsset,
  onRegister
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    mediaUrl: '',
    mediaHash: '',
    trustReason: {
      type: 'trusted_platform',
      platform_name: 'Mint Matrix'
    },
    licenseParents: [],
    authorizations: []
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCalculatingHash, setIsCalculatingHash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { address } = useAccount();
  const publicClient = usePublicClient();

  useEffect(() => {
    if (isOpen && ipAsset) {
      setFormData(prev => ({
        ...prev,
        name: ipAsset.name || '',
        mediaUrl: ipAsset.image || ''
      }));
      setError(null);
      setSuccess(false);
      
      // Auto-calculate hash if media URL is available
      if (ipAsset.image) {
        calculateHash(ipAsset.image);
      }
    }
  }, [isOpen, ipAsset]);

  const calculateHash = async (url: string) => {
    if (!url) return;
    
    setIsCalculatingHash(true);
    try {
      const hash = await calculateFileHashFromUrl(url);
      setFormData(prev => ({
        ...prev,
        mediaHash: hash
      }));
    } catch (error) {
      console.error('Failed to calculate hash:', error);
      setError('Failed to calculate media hash. Please enter manually.');
    } finally {
      setIsCalculatingHash(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => {
        // Fix: Handle nested objects properly
        if (parent === 'trustReason') {
          return {
            ...prev,
            trustReason: {
              ...prev.trustReason,
              [child]: value
            }
          };
        }
        return prev;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const addLicenseParent = () => {
    setFormData(prev => ({
      ...prev,
      licenseParents: [...prev.licenseParents, { license_id: '', token_id: '' }]
    }));
  };

  const removeLicenseParent = (index: number) => {
    setFormData(prev => ({
      ...prev,
      licenseParents: prev.licenseParents.filter((_, i) => i !== index)
    }));
  };

  const updateLicenseParent = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      licenseParents: prev.licenseParents.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addAuthorization = () => {
    setFormData(prev => ({
      ...prev,
      authorizations: [...prev.authorizations, { authorization_id: '', token_id: '' }]
    }));
  };

  const removeAuthorization = (index: number) => {
    setFormData(prev => ({
      ...prev,
      authorizations: prev.authorizations.filter((_, i) => i !== index)
    }));
  };

  const updateAuthorization = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      authorizations: prev.authorizations.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const isFormValid = () => {
    return formData.name.trim() && 
           formData.mediaUrl.trim() && 
           formData.mediaHash.trim() && 
           address &&
           ipAsset.transactionHash &&
           ipAsset.blockNumber;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      if (!publicClient) {
        throw new Error("Could not get public client");
      }

      // Get transaction receipt to ensure we have the correct block number
      let blockNumber = ipAsset.blockNumber;
      if (ipAsset.transactionHash) {
        try {
          const receipt = await publicClient.waitForTransactionReceipt({ 
            hash: ipAsset.transactionHash as `0x${string}` 
          });
          blockNumber = receipt.blockNumber.toString();
        } catch (receiptError) {
          console.warn('Could not fetch receipt, using provided block number:', receiptError);
        }
      }

      const timestamp = ipAsset.blockTimestamp 
        ? new Date(parseInt(ipAsset.blockTimestamp) * 1000).toISOString()
        : new Date().toISOString();

      const payload = {
        network: "story-aeneid",
        id: ipAsset.ipId,
        creator_id: address,
        registration_tx: {
          hash: ipAsset.transactionHash,
          block_number: parseInt(blockNumber || '0'),
          timestamp: timestamp,
        },
        metadata: {
          name: formData.name,
        },
        media: [
          {
            media_id: `media_${Date.now()}`,
            url: formData.mediaUrl,
            hash: formData.mediaHash,
            trust_reason: formData.trustReason,
          },
        ],
        license_parents: formData.licenseParents.length > 0 ? formData.licenseParents : undefined,
        authorizations: formData.authorizations.length > 0 ? formData.authorizations : undefined,
      };

      console.log('Registering to Yakoa with payload:', payload);

      const response = await fetch('/api/yakoa/register-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.response) {
        console.log('Yakoa registration successful:', data.response);
        setSuccess(true);
        
        // Show success alert
        alert(`🎉 Yakoa Registration Successful! 🎉

✅ IP Asset: ${formData.name}
✅ Token ID: ${ipAsset.ipId}
✅ Network: Story Protocol
✅ Creator: ${address}

Your IP asset has been successfully registered with Yakoa for infringement protection monitoring.`);
        
        onRegister(data);
        
        // Close modal after a delay
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw new Error(data.error || data.details || 'Registration failed');
      }
    } catch (error) {
      console.error('Yakoa registration failed:', error);
      setError(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-medium text-white">Register to Yakoa</h2>
                <p className="text-sm text-zinc-400">Protect your IP with infringement monitoring</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[calc(90vh-200px)] overflow-y-auto">
          <div className="space-y-6">
            
            {/* Info Banner */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-blue-300 mb-1">About Yakoa Registration</h3>
                  <p className="text-xs text-zinc-400">
                    Yakoa provides infringement monitoring for your IP assets across multiple platforms. 
                    Registration enables automatic detection of unauthorized use of your intellectual property.
                  </p>
                </div>
              </div>
            </div>

            {/* IP Asset Info */}
            <div className="bg-zinc-900/40 rounded-lg p-4">
              <h3 className="text-sm font-medium text-white mb-3">IP Asset Information</h3>
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-800/50 flex-shrink-0">
                  {ipAsset.image ? (
                    <img src={ipAsset.image} alt={ipAsset.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Shield className="w-6 h-6 text-zinc-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{ipAsset.name}</p>
                  <p className="text-xs text-zinc-400 mt-1">IP ID: {ipAsset.ipId}</p>
                  <p className="text-xs text-zinc-400">Creator: {address}</p>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="bg-zinc-900/40 rounded-lg p-4">
              <h3 className="text-sm font-medium text-white mb-3">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">
                    Asset Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter asset name"
                    className="w-full bg-zinc-800/70 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">
                    Media URL <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="url"
                    value={formData.mediaUrl}
                    onChange={(e) => {
                      handleInputChange('mediaUrl', e.target.value);
                      if (e.target.value) {
                        calculateHash(e.target.value);
                      }
                    }}
                    placeholder="https://ipfs.io/ipfs/..."
                    className="w-full bg-zinc-800/70 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">
                    Media Hash <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.mediaHash}
                      onChange={(e) => handleInputChange('mediaHash', e.target.value)}
                      placeholder="SHA-256 hash of the media file"
                      className="w-full bg-zinc-800/70 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
                    />
                    {isCalculatingHash && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Hash will be calculated automatically when you enter a media URL
                  </p>
                </div>
              </div>
            </div>

            {/* Trust Reason */}
            <div className="bg-zinc-900/40 rounded-lg p-4">
              <h3 className="text-sm font-medium text-white mb-3">Trust Reason</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">Type</label>
                  <select
                    value={formData.trustReason.type}
                    onChange={(e) => handleInputChange('trustReason.type', e.target.value)}
                    className="w-full bg-zinc-800/70 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="trusted_platform">Trusted Platform</option>
                    <option value="verified_creator">Verified Creator</option>
                    <option value="manual_verification">Manual Verification</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">Platform Name</label>
                  <input
                    type="text"
                    value={formData.trustReason.platform_name}
                    onChange={(e) => handleInputChange('trustReason.platform_name', e.target.value)}
                    placeholder="e.g., Mint Matrix"
                    className="w-full bg-zinc-800/70 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* License Parents (Optional) */}
            <div className="bg-zinc-900/40 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white">License Parents (Optional)</h3>
                <button
                  onClick={addLicenseParent}
                  className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30 transition-colors"
                >
                  Add Parent
                </button>
              </div>
              {formData.licenseParents.map((parent, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={parent.license_id}
                    onChange={(e) => updateLicenseParent(index, 'license_id', e.target.value)}
                    placeholder="License ID"
                    className="flex-1 bg-zinc-800/70 border border-zinc-700/50 rounded px-2 py-1 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={parent.token_id}
                    onChange={(e) => updateLicenseParent(index, 'token_id', e.target.value)}
                    placeholder="Token ID"
                    className="flex-1 bg-zinc-800/70 border border-zinc-700/50 rounded px-2 py-1 text-xs text-white"
                  />
                  <button
                    onClick={() => removeLicenseParent(index)}
                    className="text-red-400 hover:text-red-300 text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-3 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-red-400 text-sm">
                  <p className="font-medium">Registration Failed</p>
                  <p className="text-xs mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Success Display */}
            {success && (
              <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-3 flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <div className="text-green-400 text-sm">
                  <p className="font-medium">Registration Successful!</p>
                  <p className="text-xs mt-1">Your IP asset has been registered with Yakoa.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800/50 flex justify-between">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-zinc-400 hover:text-zinc-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isFormValid() || isProcessing || isCalculatingHash}
            className={`px-6 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
              isFormValid() && !isProcessing && !isCalculatingHash
                ? 'bg-gradient-to-r from-blue-500/80 to-blue-600/80 hover:from-blue-500 hover:to-blue-600 text-white'
                : 'bg-zinc-800/50 text-zinc-500 cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Registering...</span>
              </>
            ) : isCalculatingHash ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Calculating Hash...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Register to Yakoa</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
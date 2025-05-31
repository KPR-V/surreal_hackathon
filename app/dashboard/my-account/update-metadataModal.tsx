"use client";

import React, { useState } from 'react';

interface UpdateMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentIpId: string;
  onUpdate?: (data: MetadataData) => void;
}

interface MetadataData {
  ipId: string;
  metadataURI: string;
  metadataHash: string;
}

export const UpdateMetadataModal: React.FC<UpdateMetadataModalProps> = ({
  isOpen,
  onClose,
  currentIpId,
  onUpdate
}) => {
  const [formData, setFormData] = useState<MetadataData>({
    ipId: currentIpId,
    metadataURI: '',
    metadataHash: ''
  });

  const [errors, setErrors] = useState<Partial<MetadataData>>({});

  const validateForm = () => {
    const newErrors: Partial<MetadataData> = {};
    
    if (!formData.metadataURI || !formData.metadataURI.startsWith('http')) {
      newErrors.metadataURI = 'Please enter a valid HTTP/HTTPS URL';
    }
    
    if (!formData.metadataHash || formData.metadataHash.length < 10) {
      newErrors.metadataHash = 'Please enter a valid metadata hash';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onUpdate?.(formData);
      onClose();
    }
  };

  const handleInputChange = (field: keyof MetadataData, value: string) => {
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
                <div className="p-2 bg-cyan-500/10 rounded-lg">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-medium text-white">Update IP Metadata</h2>
                  <p className="text-xs text-zinc-400">Modify the metadata associated with your IP Asset</p>
                </div>
              </div>
              
              <button 
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Info Banner */}
              <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <svg className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-xs">
                    <p className="text-cyan-300 font-medium mb-1">What is IP Metadata?</p>
                    <p className="text-cyan-200">
                      Metadata contains descriptive information about your IP Asset, such as title, description, 
                      image, attributes, and other properties. It's stored off-chain and referenced via URI.
                    </p>
                  </div>
                </div>
              </div>

              {/* IP Account (Read-only) */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-white uppercase tracking-wider">
                  IP Account ID
                  <span className="text-zinc-500 font-normal ml-1 normal-case">(your asset)</span>
                </label>
                <input
                  type="text"
                  value={formData.ipId}
                  readOnly
                  className="w-full px-3 py-2.5 bg-zinc-700/30 border border-zinc-700/50 rounded-lg text-zinc-400 font-mono text-xs cursor-not-allowed"
                />
                <p className="text-xs text-zinc-500">
                  The IP Account whose metadata will be updated (automatically filled)
                </p>
              </div>

              {/* Metadata URI */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-white uppercase tracking-wider">
                  Metadata URI
                  <span className="text-red-400 ml-1">*</span>
                  <span className="text-zinc-500 font-normal ml-1 normal-case">(location of metadata)</span>
                </label>
                <input
                  type="url"
                  value={formData.metadataURI}
                  onChange={(e) => handleInputChange('metadataURI', e.target.value)}
                  placeholder="https://example.com/metadata.json"
                  className={`w-full px-3 py-2.5 bg-zinc-800/50 border rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 transition-all duration-200 ${
                    errors.metadataURI 
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-zinc-700/50 focus:border-cyan-500/50 focus:ring-cyan-500/20'
                  }`}
                />
                {errors.metadataURI && (
                  <p className="text-xs text-red-400">{errors.metadataURI}</p>
                )}
                <p className="text-xs text-zinc-500">
                  URL pointing to your metadata JSON file (IPFS, HTTP, or HTTPS supported)
                </p>
              </div>

              {/* Metadata Hash */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-white uppercase tracking-wider">
                  Metadata Hash
                  <span className="text-red-400 ml-1">*</span>
                  <span className="text-zinc-500 font-normal ml-1 normal-case">(content verification)</span>
                </label>
                <input
                  type="text"
                  value={formData.metadataHash}
                  onChange={(e) => handleInputChange('metadataHash', e.target.value)}
                  placeholder="0x... or hash without 0x prefix"
                  className={`w-full px-3 py-2.5 bg-zinc-800/50 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-1 transition-all duration-200 font-mono text-xs ${
                    errors.metadataHash 
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-zinc-700/50 focus:border-cyan-500/50 focus:ring-cyan-500/20'
                  }`}
                />
                {errors.metadataHash && (
                  <p className="text-xs text-red-400">{errors.metadataHash}</p>
                )}
                <p className="text-xs text-zinc-500">
                  Cryptographic hash of the metadata content for integrity verification (SHA-256, Keccak256, etc.)
                </p>
              </div>

              {/* Metadata Structure Guide */}
              <div className="bg-zinc-800/30 rounded-lg p-4">
                <h5 className="text-sm font-medium text-white mb-2">Metadata JSON Structure:</h5>
                <div className="bg-zinc-900/50 rounded p-3 text-xs font-mono text-zinc-300">
                  <pre>{`{
  "name": "Asset Name",
  "description": "Asset Description",
  "image": "https://...",
  "attributes": [
    {
      "trait_type": "Category",
      "value": "Art"
    }
  ],
  "external_url": "https://...",
  "animation_url": "https://..."
}`}</pre>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <div className="text-xs">
                    <p className="text-blue-300 font-medium mb-1">Pro Tips:</p>
                    <ul className="text-blue-200 space-y-0.5 text-xs">
                      <li>• Use IPFS for decentralized, permanent storage</li>
                      <li>• Ensure the URI is publicly accessible</li>
                      <li>• Generate hash using tools like SHA-256 or Keccak256</li>
                      <li>• Test the URI in browser before submitting</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 hover:text-white rounded-lg transition-all duration-200 border border-zinc-700/20 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-lg transition-all duration-200 font-medium text-sm"
                >
                  Update Metadata
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
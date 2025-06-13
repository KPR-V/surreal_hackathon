"use client";

import React, { useState, useEffect } from 'react';
import { raiseDispute } from '../../../lib/story/dispute_functions/dispute_functions';
import { useStoryClient } from '../../../lib/story/main_functions/story-network';

interface RaiseDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  ipId: string;
  assetName: string;
  assetId: string;
}

// Bond calculation service
class BondCalculatorService {
  // Approximate conversion rates (these should ideally come from an API)
  static readonly ETH_TO_USD = 2500; // $2500 per ETH
  static readonly IP_TO_USD = 4.15;  // $4.15 per IP token
  static readonly MIN_BOND_ETH = 0.1; // Minimum bond amount in ETH

  static ethToUsd(ethAmount: number): number {
    return ethAmount * this.ETH_TO_USD;
  }

  static ethToIpTokens(ethAmount: number): number {
    const usdValue = this.ethToUsd(ethAmount);
    return usdValue / this.IP_TO_USD;
  }

  static formatCurrency(amount: number, decimals: number = 2): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(amount);
  }

  static formatTokenAmount(amount: number, symbol: string, decimals: number = 2): string {
    if (amount < 0.0001) {
      return `${amount.toExponential(2)} ${symbol}`;
    }
    if (amount < 1) {
      return `${amount.toFixed(4)} ${symbol}`;
    }
    if (amount < 1000) {
      return `${amount.toFixed(decimals)} ${symbol}`;
    }
    return `${(amount / 1000).toFixed(2)}K ${symbol}`;
  }

  static getBondRecommendations() {
    return [
      { eth: 0.1, label: 'Minimum', recommended: true },
      { eth: 0.25, label: 'Standard', recommended: false },
      { eth: 0.5, label: 'High Priority', recommended: false },
      { eth: 1.0, label: 'Maximum Impact', recommended: false }
    ];
  }

  static validateBondAmount(ethAmount: number): { valid: boolean; message?: string } {
    if (ethAmount < this.MIN_BOND_ETH) {
      return {
        valid: false,
        message: `Minimum bond amount is ${this.MIN_BOND_ETH} ETH`
      };
    }
    if (ethAmount > 10) {
      return {
        valid: false,
        message: 'Bond amount seems unusually high. Please verify.'
      };
    }
    return { valid: true };
  }
}

const disputeReasons = [
  {
    tag: 'IMPROPER_REGISTRATION',
    title: 'Improper Registration',
    description: 'The IP asset was registered incorrectly or without proper authorization',
    evidenceTypes: ['documents', 'images'],
    evidenceHint: 'Upload documents proving ownership, registration certificates, or comparison images',
    recommendedBond: 0.1
  },
  {
    tag: 'IMPROPER_USAGE',
    title: 'Improper Usage',
    description: 'The IP asset is being used in violation of its terms or license',
    evidenceTypes: ['images', 'documents', 'urls'],
    evidenceHint: 'Provide screenshots, license documents, or links showing unauthorized usage',
    recommendedBond: 0.25
  },
  {
    tag: 'IMPROPER_PAYMENT',
    title: 'Payment Issues',
    description: 'Problems with royalty payments or licensing fees',
    evidenceTypes: ['documents'],
    evidenceHint: 'Upload payment records, invoices, transaction receipts, or correspondence',
    recommendedBond: 0.5
  },
  {
    tag: 'CONTENT_STANDARDS_VIOLATION',
    title: 'Content Violation',
    description: 'The content violates community standards or platform policies',
    evidenceTypes: ['images', 'documents'],
    evidenceHint: 'Provide screenshots of violations or policy documents',
    recommendedBond: 0.15
  },
  {
    tag: 'IN_DISPUTE',
    title: 'Already in Dispute',
    description: 'This asset is currently under dispute resolution',
    evidenceTypes: ['documents'],
    evidenceHint: 'Upload proof of existing dispute proceedings or court documents',
    recommendedBond: 0.1
  }
];

interface EvidenceFile {
  file: File;
  preview?: string;
  type: 'image' | 'document';
}

interface EvidenceData {
  files: EvidenceFile[];
  urls: string[];
  description: string;
}

export const RaiseDisputeModal: React.FC<RaiseDisputeModalProps> = ({
  isOpen,
  onClose,
  ipId,
  assetName
}) => {
  const [selectedTag, setSelectedTag] = useState('');
  const [evidence, setEvidence] = useState<EvidenceData>({
    files: [],
    urls: [],
    description: ''
  });
  const [bondAmount, setBondAmount] = useState('0.1');
  const [livenessHours, setLivenessHours] = useState('24');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [txHash, setTxHash] = useState('');
  const [disputeId, setDisputeId] = useState('');
  const [error, setError] = useState('');
  const [bondValidation, setBondValidation] = useState<{ valid: boolean; message?: string }>({ valid: true });
  
  const { getStoryClient } = useStoryClient();

  const selectedReason = disputeReasons.find(reason => reason.tag === selectedTag);
  const bondAmountNum = parseFloat(bondAmount) || 0;
  const bondInUsd = BondCalculatorService.ethToUsd(bondAmountNum);
  const bondInIpTokens = BondCalculatorService.ethToIpTokens(bondAmountNum);

  // Update bond amount when dispute reason changes
  useEffect(() => {
    if (selectedReason) {
      setBondAmount(selectedReason.recommendedBond.toString());
    }
  }, [selectedTag, selectedReason]);

  // Validate bond amount when it changes
  useEffect(() => {
    const validation = BondCalculatorService.validateBondAmount(bondAmountNum);
    setBondValidation(validation);
  }, [bondAmountNum]);

  // Handle preset bond amounts
  const handlePresetBond = (ethAmount: number) => {
    setBondAmount(ethAmount.toString());
  };

  // Handle file uploads
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(file => {
      const fileType = file.type.startsWith('image/') ? 'image' : 'document';
      const evidenceFile: EvidenceFile = {
        file,
        type: fileType
      };

      // Create preview for images
      if (fileType === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => {
          evidenceFile.preview = e.target?.result as string;
          setEvidence(prev => ({
            ...prev,
            files: [...prev.files, evidenceFile]
          }));
        };
        reader.readAsDataURL(file);
      } else {
        setEvidence(prev => ({
          ...prev,
          files: [...prev.files, evidenceFile]
        }));
      }
    });
  };

  // Remove file from evidence
  const removeFile = (index: number) => {
    setEvidence(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  // Add URL evidence
  const addUrl = () => {
    setEvidence(prev => ({
      ...prev,
      urls: [...prev.urls, '']
    }));
  };

  // Update URL evidence
  const updateUrl = (index: number, url: string) => {
    setEvidence(prev => ({
      ...prev,
      urls: prev.urls.map((u, i) => i === index ? url : u)
    }));
  };

  // Remove URL evidence
  const removeUrl = (index: number) => {
    setEvidence(prev => ({
      ...prev,
      urls: prev.urls.filter((_, i) => i !== index)
    }));
  };

  // Upload evidence to IPFS
  const uploadEvidenceToIPFS = async (): Promise<string> => {
    try {
      setUploadProgress(0);
      
      // Create evidence package
      const evidencePackage = {
        dispute_reason: selectedTag,
        asset_id: ipId,
        asset_name: assetName,
        description: evidence.description,
        urls: evidence.urls.filter(url => url.trim()),
        timestamp: new Date().toISOString(),
        files: [] as Array<{ name: string; type: "image" | "document"; cid: string; url: string; }>
      };

      let uploadedFiles = 0;
      const totalUploads = evidence.files.length + 1; // +1 for the final package

      // Upload each file first
      for (const evidenceFile of evidence.files) {
        const formData = new FormData();
        formData.append('file', evidenceFile.file);

        const response = await fetch('/api/upload-to-ipfs', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Failed to upload file: ${evidenceFile.file.name}`);
        }

        const { cid } = await response.json();
        evidencePackage.files.push({
          name: evidenceFile.file.name,
          type: evidenceFile.type,
          cid: cid,
          url: `https://ipfs.io/ipfs/${cid}`
        });

        uploadedFiles++;
        setUploadProgress((uploadedFiles / totalUploads) * 100);
      }

      // Upload the complete evidence package
      const packageBlob = new Blob([JSON.stringify(evidencePackage, null, 2)], {
        type: 'application/json'
      });
      const packageFormData = new FormData();
      packageFormData.append('file', packageBlob, `dispute_evidence_${Date.now()}.json`);

      const packageResponse = await fetch('/api/upload-to-ipfs', {
        method: 'POST',
        body: packageFormData
      });

      if (!packageResponse.ok) {
        throw new Error('Failed to upload evidence package');
      }

      const { cid: packageCid } = await packageResponse.json();
      setUploadProgress(100);
      
      return packageCid;

    } catch (error) {
      console.error('Evidence upload error:', error);
      throw new Error(`Failed to upload evidence: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = await getStoryClient();
    if (!client) {
      setError('Story client not initialized');
      return;
    }

    if (!selectedTag) {
      setError('Please select a dispute reason');
      return;
    }

    if (!bondValidation.valid) {
      setError(bondValidation.message || 'Invalid bond amount');
      return;
    }

    if (evidence.files.length === 0 && evidence.urls.filter(u => u.trim()).length === 0 && !evidence.description.trim()) {
      setError('Please provide evidence (files, URLs, or description)');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      // Upload evidence to IPFS
      const evidenceCid = await uploadEvidenceToIPFS();
      
      const livenessSeconds = parseInt(livenessHours) * 3600;

      console.log('Submitting dispute with:', {
      targetIpId: ipId,
      evidenceCid: evidenceCid,
      targetTag: selectedTag,
      bondAmount: bondAmount,
      livenessSeconds: livenessSeconds, // Log this to verify
      livenessHours: livenessHours
    });

      const result = await raiseDispute(
        ipId,
        evidenceCid,
        selectedTag,
        bondAmount,
        livenessSeconds,
        client
      );
      
      if (result) {
        setTxHash(result.txHash || '');
        setDisputeId(result.disputeId?.toString() || '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to raise dispute');
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setSelectedTag('');
    setEvidence({ files: [], urls: [], description: '' });
    setBondAmount('0.1');
    setLivenessHours('24');
    setTxHash('');
    setDisputeId('');
    setError('');
    setUploadProgress(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/40 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700/30 sticky top-0 bg-zinc-900/95 backdrop-blur-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-red-500/20 to-rose-500/20 rounded-lg border border-red-500/30">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-medium text-white">Raise Dispute</h2>
              <p className="text-sm text-zinc-400">Report an issue with this IP asset</p>
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
            {/* Dispute Reason */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-zinc-300">
                What's the issue? <span className="text-red-400">*</span>
              </label>
              <div className="grid gap-3">
                {disputeReasons.map((reason) => (
                  <button
                    key={reason.tag}
                    type="button"
                    onClick={() => setSelectedTag(reason.tag)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                      selectedTag === reason.tag
                        ? 'border-red-500/50 bg-red-500/10 text-red-300'
                        : 'border-zinc-700/50 bg-zinc-800/30 text-zinc-300 hover:border-zinc-600/50 hover:bg-zinc-700/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`w-3 h-3 rounded-full mt-1 ${selectedTag === reason.tag ? 'bg-red-400' : 'bg-zinc-600'}`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{reason.title}</p>
                          <p className="text-xs mt-1 opacity-70">{reason.description}</p>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-xs text-zinc-500">Recommended Bond</div>
                        <div className="text-sm font-medium text-amber-400">{reason.recommendedBond} ETH</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Evidence Collection - Smart based on selected reason */}
            {selectedReason && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <label className="block text-sm font-medium text-zinc-300">
                    Evidence <span className="text-red-400">*</span>
                  </label>
                  <div className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                    {selectedReason.title}
                  </div>
                </div>
                
                <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/30">
                  <p className="text-sm text-zinc-400 mb-4">
                    <span className="text-zinc-300 font-medium">Evidence needed:</span> {selectedReason.evidenceHint}
                  </p>

                  {/* File Upload */}
                  {(selectedReason.evidenceTypes.includes('documents') || selectedReason.evidenceTypes.includes('images')) && (
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-300">
                          Upload Files ({selectedReason.evidenceTypes.join(', ')})
                        </span>
                        <label className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-xs cursor-pointer transition-colors border border-blue-500/30">
                          <input
                            type="file"
                            multiple
                            accept={selectedReason.evidenceTypes.includes('images') ? 'image/*,.pdf,.doc,.docx,.txt' : '.pdf,.doc,.docx,.txt'}
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          Add Files
                        </label>
                      </div>

                      {/* Uploaded Files Display */}
                      {evidence.files.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {evidence.files.map((file, index) => (
                            <div key={index} className="p-3 bg-zinc-700/30 rounded-lg border border-zinc-600/30">
                              <div className="flex items-start space-x-3">
                                {file.preview ? (
                                  <img src={file.preview} alt="Preview" className="w-12 h-12 object-cover rounded" />
                                ) : (
                                  <div className="w-12 h-12 bg-zinc-600/50 rounded flex items-center justify-center">
                                    <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-zinc-300 truncate">{file.file.name}</p>
                                  <p className="text-xs text-zinc-500">
                                    {(file.file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFile(index)}
                                  className="text-red-400 hover:text-red-300 p-1"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* URL Evidence */}
                  {selectedReason.evidenceTypes.includes('urls') && (
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-300">Reference URLs</span>
                        <button
                          type="button"
                          onClick={addUrl}
                          className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-xs transition-colors border border-green-500/30"
                        >
                          Add URL
                        </button>
                      </div>

                      {evidence.urls.map((url, index) => (
                        <div key={index} className="flex space-x-2">
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => updateUrl(index, e.target.value)}
                            placeholder="https://example.com/evidence"
                            className="flex-1 px-3 py-2 bg-zinc-700/50 border border-zinc-600/50 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeUrl(index)}
                            className="px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Description */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-zinc-300">
                      Additional Details
                    </label>
                    <textarea
                      value={evidence.description}
                      onChange={(e) => setEvidence(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Provide additional context, timeline, or details about the dispute..."
                      rows={4}
                      className="w-full px-3 py-2 bg-zinc-700/50 border border-zinc-600/50 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Uploading evidence to IPFS...</span>
                  <span className="text-blue-400">{uploadProgress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Smart Bond Amount Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <label className="block text-sm font-medium text-zinc-300">
                  Bond Amount <span className="text-red-400">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs text-zinc-500">Security deposit at stake</span>
                </div>
              </div>

              {/* Bond Calculator Display */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Bond Input */}
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="number"
                      value={bondAmount}
                      onChange={(e) => setBondAmount(e.target.value)}
                      placeholder="0.1"
                      step="0.01"
                      min="0.1"
                      className={`w-full px-4 py-3 pr-16 bg-zinc-800/50 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 transition-all ${
                        bondValidation.valid 
                          ? 'border-zinc-700/50 focus:ring-amber-500/50 focus:border-amber-500/50' 
                          : 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50'
                      }`}
                      required
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 text-sm font-medium">
                      ETH
                    </div>
                  </div>

                  {/* Bond Validation */}
                  {!bondValidation.valid && (
                    <div className="flex items-center space-x-2 text-red-400 text-xs">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{bondValidation.message}</span>
                    </div>
                  )}

                  {/* Preset Bond Amounts */}
                  <div className="flex flex-wrap gap-2">
                    {BondCalculatorService.getBondRecommendations().map((preset) => (
                      <button
                        key={preset.eth}
                        type="button"
                        onClick={() => handlePresetBond(preset.eth)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          parseFloat(bondAmount) === preset.eth
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-zinc-700/30 text-zinc-400 border border-zinc-600/30 hover:bg-zinc-600/30 hover:text-zinc-300'
                        }`}
                      >
                        {preset.eth} ETH
                        {preset.recommended && (
                          <span className="ml-1 text-green-400">★</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bond Conversion Display */}
                <div className="space-y-3">
                  <div className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-lg border border-amber-500/20">
                    <div className="space-y-3">
                      
                      

                      <div className="pt-2 border-t border-amber-500/20">
                        <div className="text-xs text-amber-300/80 space-y-1">
                          <p>• If you win: Get bond back + 50% of opponent's bond</p>
                          <p>• If you lose: Forfeit entire bond amount</p>
                          <p>• Conversion: 1 ETH ≈ {BondCalculatorService.formatTokenAmount(BondCalculatorService.ethToIpTokens(1), 'IP')}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Risk Assessment */}
                  <div className={`p-3 rounded-lg border text-xs ${
                    bondAmountNum <= 0.25 
                      ? 'bg-green-500/10 border-green-500/20 text-green-400'
                      : bondAmountNum <= 0.5
                      ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        bondAmountNum <= 0.25 ? 'bg-green-400' 
                        : bondAmountNum <= 0.5 ? 'bg-yellow-400' 
                        : 'bg-red-400'
                      }`}></div>
                      <span className="font-medium">
                        {bondAmountNum <= 0.25 ? 'Low Risk' 
                         : bondAmountNum <= 0.5 ? 'Medium Risk' 
                         : 'High Risk'}
                      </span>
                    </div>
                    <p className="mt-1 opacity-80">
                      {bondAmountNum <= 0.25 
                        ? 'Minimum bond with lower potential returns'
                        : bondAmountNum <= 0.5
                        ? 'Balanced risk with moderate potential returns'
                        : 'High stakes with maximum potential returns'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Resolution Time */}
            <div className="space-y-3">
              <label htmlFor="liveness" className="block text-sm font-medium text-zinc-300">
                Resolution Time <span className="text-red-400">*</span>
              </label>
              <select
                id="liveness"
                value={livenessHours}
                onChange={(e) => setLivenessHours(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all"
              >
                <option value="24">24 hours</option>
                <option value="48">48 hours</option>
                <option value="72">72 hours</option>
                <option value="168">1 week</option>
              </select>
              <p className="text-xs text-zinc-500">
                Time window for counter-disputes and resolution
              </p>
              <span className="text-blue-400 font-mono">
               {parseInt(livenessHours) * 3600} seconds
               </span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Warning */}
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-yellow-300">Financial Risk Warning</p>
                </div>
              </div>
            </div>

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
                disabled={isLoading || !selectedTag || !bondValidation.valid || (evidence.files.length === 0 && evidence.urls.filter(u => u.trim()).length === 0 && !evidence.description.trim())}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>{uploadProgress > 0 ? 'Uploading...' : 'Submitting...'}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span>Stake & Raise Dispute</span>
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
              <h3 className="text-lg font-medium text-white mb-2">Dispute Raised Successfully!</h3>
              <p className="text-sm text-zinc-400 mb-4">
                Your dispute has been submitted and is now under review.
              </p>
              <div className="space-y-3">
                <div className="p-3 bg-zinc-800/30 rounded-lg">
                  <p className="text-xs text-zinc-500 mb-1">Dispute ID:</p>
                  <p className="text-sm text-green-400 font-mono">{disputeId}</p>
                </div>
                <div className="p-3 bg-zinc-800/30 rounded-lg">
                  <p className="text-xs text-zinc-500 mb-1">Bond Staked:</p>
                  <p className="text-sm text-amber-400 font-medium">
                    {bondAmount} ETH 
                  </p>
                </div>
                <div className="p-3 bg-zinc-800/30 rounded-lg">
                  <p className="text-xs text-zinc-500 mb-1">Transaction Hash:</p>
                  <p className="text-xs text-blue-400 font-mono break-all">{txHash}</p>
                </div>
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
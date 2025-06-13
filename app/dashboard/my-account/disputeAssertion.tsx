"use client";

import React, { useState } from 'react';
import { Dispute } from './types';
import { disputeAssertion } from '../../../lib/story/dispute_functions/dispute_functions';
import { useStoryClient } from '../../../lib/story/main_functions/story-network';

interface DisputeAssertionModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispute: Dispute | null;
  currentIpId: string;
  onSubmit?: (data: DisputeAssertionData) => void;
}

interface DisputeAssertionData {
  ipId: string;
  disputeId: number;
  counterEvidenceCID: string;
}

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

export const DisputeAssertionModal: React.FC<DisputeAssertionModalProps> = ({
  isOpen,
  onClose,
  dispute,
  currentIpId,
  onSubmit
}) => {
  const [formData, setFormData] = useState<DisputeAssertionData>({
    ipId: currentIpId,
    disputeId: 0,
    counterEvidenceCID: ''
  });
  
  const [evidence, setEvidence] = useState<EvidenceData>({
    files: [],
    urls: [],
    description: ''
  });

  const [errors, setErrors] = useState<Partial<DisputeAssertionData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);
  
  // Get the Story Protocol client from context
   const { getStoryClient } = useStoryClient();

  React.useEffect(() => {
    if (dispute) {
      setFormData(prev => ({
        ...prev,
        disputeId: parseInt(dispute.id.toString())
      }));
    }
  }, [dispute]);

  const validateForm = () => {
    const newErrors: Partial<DisputeAssertionData> = {};
    
    // Evidence validation
    if (evidence.files.length === 0 && evidence.urls.filter(u => u.trim()).length === 0 && !evidence.description.trim()) {
      newErrors.counterEvidenceCID = 'Please provide at least one form of evidence (files, URLs, or description)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
    
    // Clear any previous errors when files are added
    if (errors.counterEvidenceCID) {
      setErrors(prev => ({ ...prev, counterEvidenceCID: undefined }));
    }
  };

  const removeFile = (index: number) => {
    setEvidence(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const addUrl = () => {
    setEvidence(prev => ({
      ...prev,
      urls: [...prev.urls, '']
    }));
    
    // Clear any previous errors when URL is added
    if (errors.counterEvidenceCID) {
      setErrors(prev => ({ ...prev, counterEvidenceCID: undefined }));
    }
  };

  const updateUrl = (index: number, url: string) => {
    setEvidence(prev => ({
      ...prev,
      urls: prev.urls.map((u, i) => i === index ? url : u)
    }));
  };

  const removeUrl = (index: number) => {
    setEvidence(prev => ({
      ...prev,
      urls: prev.urls.filter((_, i) => i !== index)
    }));
  };

  // Upload evidence to IPFS
  const uploadEvidenceToIPFS = async (): Promise<string> => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Create evidence package
      const evidencePackage = {
        dispute_id: dispute?.id,
        counter_evidence_for: dispute?.evidenceHash,
        asset_id: currentIpId,
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
      packageFormData.append('file', packageBlob, `counter_evidence_${Date.now()}.json`);

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
      throw new Error(`Failed to upload counter evidence: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !getStoryClient) return;

    setSubmitting(true);
    setSubmissionError(null);
    setSubmissionSuccess(false);
    
    try {
      // Upload evidence to IPFS first to get CID
      const evidenceCid = await uploadEvidenceToIPFS();
      
      // Set the CID in the form data
      const submissionData = {
        ...formData,
        counterEvidenceCID: evidenceCid
      };
      
      // Get the Story Protocol client instance
      const storyClient = await getStoryClient();
      
      // Call the disputeAssertion function from dispute_functions.ts
      const result = await disputeAssertion(
        currentIpId,
        submissionData.disputeId,
        evidenceCid,
        storyClient
      );
      
      if (!result || !result.txHash) {
        throw new Error('Failed to submit dispute assertion. Transaction failed.');
      }
      
      // Set success state
      setSubmissionSuccess(true);
      
      // Submit the data to the parent component
      onSubmit?.(submissionData);
      
      // Reset form after successful submission
      setEvidence({
        files: [],
        urls: [],
        description: ''
      });
      
      // Close the modal after a small delay to show success feedback
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Error submitting dispute assertion:', error);
      setSubmissionError(error instanceof Error ? error.message : 'Failed to submit counter evidence');
      setErrors({
        counterEvidenceCID: error instanceof Error ? error.message : 'Failed to submit counter evidence'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEvidence(prev => ({ ...prev, description: e.target.value }));
    
    // Clear any previous errors when description is added
    if (errors.counterEvidenceCID && e.target.value.trim()) {
      setErrors(prev => ({ ...prev, counterEvidenceCID: undefined }));
    }
  };

  const truncateHash = (hash: string, length = 8) => {
    return `${hash.slice(0, length)}...${hash.slice(-length)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatTimestamp = (timestamp: number) => {
    try {
      return new Date(timestamp * 1000).toLocaleString();
    } catch {
      return 'N/A';
    }
  };

  const formatDispureData = (data: string) => {
    // Try to parse as hex if it starts with 0x or has many zeros
    if (data.startsWith('0x') || data.includes('000000')) {
      try {
        // Remove leading 0x if present
        const cleanData = data.startsWith('0x') ? data.substring(2) : data;
        
        // Try to decode as UTF-8 text if it's hex encoded
        let decoded = '';
        for (let i = 0; i < cleanData.length; i += 2) {
          const hexPair = cleanData.substring(i, i + 2);
          const num = parseInt(hexPair, 16);
          if (num >= 32 && num <= 126) { // Printable ASCII range
            decoded += String.fromCharCode(num);
          }
        }
        
        // If we got some valid text, return it
        if (decoded.length > 0 && /[a-zA-Z]/.test(decoded)) {
          return decoded;
        }
      } catch (e) {
        // Fall back to original if decoding fails
      }
    }
    
    // If it's a long string of numbers/hex, truncate it
    if ((data.length > 30) && /^[0-9x]+$/.test(data)) {
      return truncateHash(data, 12);
    }
    
    return data;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'pending':
      case 'raised':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'resolved':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'dismissed':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'disputed':
        return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      default:
        return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
    }
  };

  if (!isOpen || !dispute) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      {/* Add success message when submissionSuccess is true */}
      {submissionSuccess && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[70] bg-green-500/20 border border-green-500/30 rounded-lg shadow-lg py-3 px-6 animate-fade-in-down">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-green-400 font-medium">Counter evidence submitted successfully!</p>
          </div>
        </div>
      )}
      
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative min-h-full flex items-center justify-center p-4">
        <div className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/30 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
          
          {/* Fixed Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-zinc-700/30 bg-zinc-900/95 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-lg border border-red-500/30">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-medium text-white flex items-center space-x-2">
                    <span>Challenge Dispute</span>
                    <span className="px-2 py-0.5 bg-zinc-800/80 text-blue-400 border border-zinc-700/60 rounded text-xs font-mono">
                      #{dispute.id}
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-400">Submit counter evidence to defend your IP asset</p>
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

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              
            {/* Dispute Information - Compact Layout */}
            <div className="bg-gradient-to-br from-red-500/5 to-orange-500/5 border border-red-500/20 rounded-xl p-5">
              <h3 className="text-sm font-medium text-white mb-4 flex items-center space-x-2">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>Dispute Information</span>
              </h3>
              
              {/* Display dispute ID and IP ID in a prominent way */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-zinc-800/40 rounded-lg p-3 border border-zinc-700/40">
                  <p className="text-xs text-zinc-500 mb-1">Dispute ID</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-blue-400 font-mono">#{dispute.id}</span>
                    <button 
                      onClick={() => navigator.clipboard.writeText(dispute.id.toString())}
                      className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                      title="Copy to clipboard"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="bg-zinc-800/40 rounded-lg p-3 border border-zinc-700/40">
                  <p className="text-xs text-zinc-500 mb-1">Target IP ID</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white font-mono truncate mr-2">
                      {dispute.targetIpId}
                    </span>
                    <button 
                      onClick={() => navigator.clipboard.writeText(dispute.targetIpId)}
                      className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0"
                      title="Copy to clipboard"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-800/40 rounded-lg p-4 border border-zinc-700/40">
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-zinc-500">Status:</span>
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded border ${getStatusColor(dispute.status)}`}>
                        {dispute.status === 'raised' ? 'Active' : dispute.status}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-xs text-zinc-500">Created:</span>
                      <span className="ml-2 text-sm text-white">{formatTimestamp(dispute.disputeTimestamp)}</span>
                    </div>
                    
                    <div>
                      <span className="text-xs text-zinc-500 block mb-1">Initiated by:</span>
                      <button 
                        onClick={() => copyToClipboard(dispute.initiator)}
                        className="text-blue-400 hover:text-blue-300 transition-colors font-mono text-sm"
                        title="Click to copy"
                      >
                        {truncateHash(dispute.initiator, 10)}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-zinc-800/40 rounded-lg p-4 border border-zinc-700/40">
                  <span className="text-xs text-zinc-500 block mb-1">Evidence Hash:</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-green-400 truncate">
                      {truncateHash(dispute.evidenceHash, 12)}
                    </span>
                    <button
                      onClick={() => copyToClipboard(dispute.evidenceHash)}
                      className="p-1 text-zinc-400 hover:text-zinc-300"
                      title="Copy to clipboard"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                  
                  {dispute.umaLink && (
                    <div className="mt-4">
                      <a 
                        href={dispute.umaLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors text-xs"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span>View on UMA Oracle Portal</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Target Tag if available */}
              {dispute.targetTag && (
                <div className="mt-4 bg-zinc-800/40 rounded-lg p-4 border border-zinc-700/40">
                  <span className="text-xs text-zinc-500 block mb-1">Target Tag:</span>
                  <div className="font-mono text-xs text-pink-400 break-all">
                    {formatDispureData(dispute.targetTag)}
                  </div>
                </div>
              )}
            </div>

            <div className="border-b border-zinc-700/30 my-4"></div>

            {/* Counter Evidence Form */}
            <form className="space-y-5">
              <div>
                <h3 className="text-base font-medium text-white mb-3">Submit Your Counter Evidence</h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Provide evidence that counters the original dispute claim. Be thorough and include all relevant details.
                </p>
              </div>
              
              {/* Evidence Collection */}
              <div className="space-y-5">
                {/* File Upload */}
                <div className="bg-zinc-800/30 rounded-xl border border-zinc-700/40 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-white">
                      Upload Evidence Files
                    </label>
                    <label className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-xs cursor-pointer transition-colors border border-blue-500/30">
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      Add Files
                    </label>
                  </div>

                  {/* Uploaded Files Display */}
                  {evidence.files.length > 0 ? (
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
                  ) : (
                    <div className="p-6 border border-dashed border-zinc-700/50 rounded-lg text-center">
                      <svg className="w-8 h-8 text-zinc-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-zinc-400">Drag files here or click "Add Files" to upload</p>
                      <p className="text-xs text-zinc-500 mt-1">Supports images, PDFs, and documents</p>
                    </div>
                  )}
                </div>

                {/* URL References */}
                <div className="bg-zinc-800/30 rounded-xl border border-zinc-700/40 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-white">
                      Reference URLs
                    </label>
                    <button
                      type="button"
                      onClick={addUrl}
                      className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-xs transition-colors border border-green-500/30"
                    >
                      Add URL
                    </button>
                  </div>

                  {evidence.urls.length > 0 ? (
                    <div className="space-y-2">
                      {evidence.urls.map((url, index) => (
                        <div key={index} className="flex space-x-2">
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => updateUrl(index, e.target.value)}
                            placeholder="https://example.com/evidence"
                            className="flex-1 px-3 py-2 bg-zinc-700/50 border border-zinc-600/50 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-green-500/30 text-sm"
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
                  ) : (
                    <div className="p-4 border border-dashed border-zinc-700/50 rounded-lg text-center">
                      <p className="text-sm text-zinc-400">No URLs added yet</p>
                      <p className="text-xs text-zinc-500 mt-1">Add links to external resources supporting your case</p>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="bg-zinc-800/30 rounded-xl border border-zinc-700/40 p-5 space-y-4">
                  <label className="block text-sm font-medium text-white">
                    Detailed Explanation
                  </label>
                  <textarea
                    value={evidence.description}
                    onChange={handleDescriptionChange}
                    placeholder="Explain why the dispute is invalid and provide detailed context to support your case..."
                    rows={5}
                    className="w-full px-4 py-3 bg-zinc-700/50 border border-zinc-600/50 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 text-sm resize-none"
                  />
                </div>
              </div>
              
              {/* Upload Progress */}
              {uploadProgress > 0 && isUploading && (
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

              {/* Error Message */}
              {errors.counterEvidenceCID && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">{errors.counterEvidenceCID}</p>
                </div>
              )}

              {/* Global Error Message */}
              {submissionError && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start space-x-3">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-red-400 font-medium">Transaction Error</p>
                    <p className="text-sm text-red-300 mt-1">{submissionError}</p>
                  </div>
                </div>
              )}

              {/* Info Banner */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-blue-300 font-medium mb-1">About Counter Evidence</p>
                    <p className="text-blue-200 text-sm">
                      Your counter evidence will be stored on IPFS for immutable record-keeping.
                      This initiates arbitration through the UMA oracle system, where the dispute 
                      will be reviewed by token holders who vote on the correct outcome.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Fixed Footer */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-zinc-700/30 bg-zinc-900/95 sticky bottom-0">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting || isUploading}
                className="flex-1 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 hover:text-white rounded-lg transition-all duration-200 border border-zinc-700/20 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={submitting || isUploading || !getStoryClient || (evidence.files.length === 0 && evidence.urls.filter(u => u.trim()).length === 0 && !evidence.description.trim())}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting || isUploading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{isUploading ? 'Uploading...' : 'Submitting to Blockchain...'}</span>
                  </div>
                ) : (
                  'Submit Counter Evidence'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
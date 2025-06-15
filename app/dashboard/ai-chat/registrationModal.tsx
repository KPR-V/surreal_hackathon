"use client";
import React, { useState, useEffect } from "react";
import { X, Info, ChevronDown, ChevronRight, Plus, Sparkles, Shield, Globe, AlertCircle, Upload, Copy, CheckCircle } from "lucide-react";
import { PILModal } from "../../../components/ui/PILModal";
import { mintandregisterip } from "../../../lib/story/mint_functions/mint_register";
import { mint_register_pilterms } from "../../../lib/story/mint_functions/mint_register_pilterms";
import { useStoryClient } from "../../../lib/story/main_functions/story-network";
import {uploadFilesToPinata} from "../../../lib/story/main_functions/uploadimagetoipfs"
import { useAccount } from "wagmi";
import { usePublicClient } from "wagmi";
interface GeneratedContent {
  id: string;
  type: "image" | "video" | "audio";
  prompt: string;
  url: string;
  timestamp: Date;
  metadata?: {
    apiUsed?: string;
    jobId?: string;
    generationTime?: string;
    videoFrames?: string;
    videoFPS?: string;
    samplingRate?: string;
    maxTokens?: string;
    conditioningMelody?: string;
  };
}

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: GeneratedContent | null;
  onRegister: (data: any) => void;
}

interface FormData {
  ipTitle: string;
  ipDescription: string;
  ipExternalUrl: string;
  ipImageUrl: string; 
  nftName: string;
  nftDescription: string;
  nftExternalUrl: string;
  nftImageUrl: string; 
  useSameImageForNFT: boolean; 
  mediaHash?: string;
  attachPIL: boolean;
  pilTerms?: any;
}

const register_to_yakoa = async (tokenId: string, creatorId: string, name: string, mediaId: string,blockNumber: number,transaction_hash: string ,url: string, media_hash: string,  trust_reason?: {type: string, platform_name: string},  timestamp?: string, licenseParents?: {license_id: string, token_id: string}[], authorizations?: {authorization_id: string, token_id: string}[]) => {
  if (!tokenId || !creatorId || !transaction_hash || !blockNumber || !mediaId || !url || !media_hash) {
    console.error("Missing required parameters:", { tokenId, creatorId, transaction_hash, blockNumber, mediaId, url, media_hash });
    throw new Error("Missing required parameters for Yakoa registration");
  }
 
 
  const payload = {
    network: "story-aeneid",
    id: tokenId,
    creator_id: creatorId,
    registration_tx: {
      hash: transaction_hash,
      block_number: blockNumber,
      timestamp: timestamp || "",
    },
    metadata: {
      name: name,
    },
    media: [
      {
        media_id: mediaId,
        url: url,
        hash: media_hash,
        trust_reason: trust_reason || {type: "", platform_name: ""},
      },
    ],
    license_parents: licenseParents,
    authorizations: authorizations,
  };
  console.log("🚀 -----------------------------------------------------🚀")
  console.log("🚀 ~ :75 ~ const register_to_yakoa= ~ payload:", payload)
  console.log("🚀 -----------------------------------------------------🚀")

  
  try{
  const response = await fetch('/api/yakoa/register-token', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  console.log("🚀 -------------------------------------------------------🚀")
  console.log("🚀 ~ :85 ~ const register_to_yakoa= ~ response:", response)
  console.log("🚀 -------------------------------------------------------🚀")

  
  if (!response.ok) {
    console.error("Yakoa API Error Response:", await response.text());
    throw new Error(`Yakoa API returned status ${response.status}`);
  }
  const data = await response.json();
  console.log("Response from yakoa:", data);
  return data;
  } catch (error) {
    console.error("Error registering to yakoa:", error);
  }
};

async function calculateFileHashFromBlob(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');  
  return hashHex;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  content,
  onRegister,
}) => {
  const [currentStep, setCurrentStep] = useState<"form" | "summary">("form");
  const [formData, setFormData] = useState<FormData>({
    ipTitle: "",
    ipDescription: "",
    ipExternalUrl: "",
    ipImageUrl: "",
    nftName: "",
    nftDescription: "",
    nftExternalUrl: "",
    nftImageUrl: "",
    useSameImageForNFT: true,
    attachPIL: false,
    mediaHash: "",
  });
  
  const [isPILModalOpen, setIsPILModalOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["ip"]));
  const [isUploadingIP, setIsUploadingIP] = useState(false);
  const [isUploadingNFT, setIsUploadingNFT] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { getStoryClient, isLoading: isClientLoading, isReady } = useStoryClient();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const uploadToIPFS = async (file: File | Blob): Promise<string> => {
    try {
    const response = await uploadFilesToPinata([file as File]);

      if (!response.cid) {
        throw new Error('Failed to upload to IPFS');
      }

      return `https://ipfs.io/ipfs/${response.cid}`;
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw error;
    }
  };

  const dataURLToBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  useEffect(() => {
    if (isOpen && content) {
      setFormData({
        ipTitle: "",
        ipDescription: "",
        ipExternalUrl: "",
        ipImageUrl: "",
        nftName: "",
        nftDescription: "",
        nftExternalUrl: "",
        nftImageUrl: "",
        useSameImageForNFT: true,
        attachPIL: false,
        mediaHash: "",
      });
      setUploadError(null);
      setCurrentStep("form");
      uploadGeneratedContentToIPFS();
    }
  }, [isOpen, content]);

  const uploadGeneratedContentToIPFS = async () => {
    if (!content) return;
    
    setIsUploadingIP(true);
    setUploadError(null);
    try {
      let blob: Blob;
      let filename: string;

      if (content.url.startsWith('data:')) {
        blob = dataURLToBlob(content.url);
        filename = `generated-${content.type}-${content.id}.${content.type === 'video' ? 'mp4' : content.type === 'audio' ? 'wav' : 'png'}`;
      } else {
        const response = await fetch(content.url);
        blob = await response.blob();
        filename = `generated-${content.type}-${content.id}.${content.type === 'video' ? 'mp4' : content.type === 'audio' ? 'wav' : 'png'}`;
      }
      const fileHash = await calculateFileHashFromBlob(blob);
      const ipfsUrl = await uploadToIPFS(blob);
      if (!fileHash || !ipfsUrl) {
        throw new Error("Failed to get a valid hash or URL from IPFS.");
    }
      setFormData(prev => ({
        ...prev,
        ipImageUrl: ipfsUrl,
        mediaHash: fileHash
      }));
    } catch (error) {
      console.error('Failed to upload generated content to IPFS:', error);
      setUploadError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsUploadingIP(false);
    }
  };

  const handleNFTImageUpload = async (file: File) => {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, GIF, WebP, or SVG)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setIsUploadingNFT(true);
    try {
      const ipfsUrl = await uploadToIPFS(file);
      setFormData(prev => ({
        ...prev,
        nftImageUrl: ipfsUrl,
        useSameImageForNFT: false
      }));
    } catch (error) {
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploadingNFT(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (!isOpen || !content) return null;

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleToggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const handlePILAttach = (pilTerms: any) => {
    setFormData(prev => ({
      ...prev,
      pilTerms
    }));
    setIsPILModalOpen(false);
  };

  const isFormValid = () => {
    if (!formData.ipTitle.trim() || !formData.ipDescription.trim()) {
      return false;
    }
    
    if (!formData.nftName.trim() || !formData.nftDescription.trim()) {
      return false;
    }
    
    if (formData.attachPIL && !formData.pilTerms) {
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;
    
    if (!isReady) {
      alert("Please connect your wallet first");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const client = await getStoryClient();

      const ipMetadata = {
        title: formData.ipTitle,
        description: formData.ipDescription,
        ipType: content.type,
        relationships: [],
        attributes: [
          {
            key: "AI Generated",
            value: "true"
          },
          {
            key: "Content Type",
            value: content.type
          },
          {
            key: "Generation Time",
            value: content.metadata?.generationTime || "Unknown"
          }
        ],
        ...(formData.ipExternalUrl && { externalURL: formData.ipExternalUrl })
      };

      const nftMetadata = {
        name: formData.nftName,
        description: formData.nftDescription,
        image: formData.useSameImageForNFT ? formData.ipImageUrl : formData.nftImageUrl,
        attributes: [
          {
            trait_type: "Content Type",
            value: content.type
          },
          {
            trait_type: "AI Generated",
            value: "Yes"
          },
          {
            trait_type: "Generation Date",
            value: content.timestamp.toISOString().split('T')[0]
          }
        ],
        ...(formData.nftExternalUrl && { external_url: formData.nftExternalUrl })
      };

      let result;

if (formData.attachPIL) {
  console.log("🚀 Minting NFT, registering IP, and attaching PIL terms...");
  console.log("PIL Terms being sent:", formData.pilTerms);
  
  if (!formData.pilTerms) {
    throw new Error("PIL terms are required but not found");
  }
  const adjustedPilTerms = {
    ...formData.pilTerms,
    commercialRevShare: formData.pilTerms.commercialRevShare > 100 
      ? Math.round(formData.pilTerms.commercialRevShare / 1_000_000) 
      : formData.pilTerms.commercialRevShare,
    derivativesAttribution: formData.pilTerms.derivativesAllowed ? formData.pilTerms.derivativesAttribution : false,
    derivativesApproval: formData.pilTerms.derivativesAllowed ? formData.pilTerms.derivativesApproval : false,
    derivativesReciprocal: formData.pilTerms.derivativesAllowed ? formData.pilTerms.derivativesReciprocal : false,
    commercialAttribution: formData.pilTerms.commercialUse ? formData.pilTerms.commercialAttribution : false,
    commercialRevCeiling: formData.pilTerms.commercialUse ? formData.pilTerms.commercialRevCeiling : 0n,
    derivativeRevCeiling: formData.pilTerms.derivativesAllowed ? formData.pilTerms.derivativeRevCeiling : 0n,
  };
  
  console.log("Adjusted PIL Terms:", adjustedPilTerms);
  const pilResult = await mint_register_pilterms(
    adjustedPilTerms,
    client,
    undefined, 
    ipMetadata,
    nftMetadata
  );
  
  if (!pilResult) {
    throw new Error("Registration failed - the mint_register_pilterms function returned undefined");
  }
  if (!publicClient) {
    throw new Error("Could not get public client");
  }
  const media_hash = formData.mediaHash || "fallback_hash";
  const timestamp = new Date().toISOString();
  const receipt = await publicClient.waitForTransactionReceipt({ 
    hash: pilResult.txHash! 
  });
  
  const blockNumber = Number(receipt.blockNumber);
  const response = await register_to_yakoa(pilResult.ipId!,address!,formData.ipTitle,`media_${Date.now()}`,blockNumber,pilResult.txHash!,formData.ipImageUrl,media_hash,{type:"trusted_platform",platform_name:"Mint Matrix"},timestamp,[],[]);
  
  result = {
    ...pilResult,
    yakoaResponse: response,
    explorerUrl: pilResult.ipId 
      ? `https://aeneid.explorer.story.foundation/ipa/${pilResult.ipId}`
      : undefined
  };
      } else {
        console.log("🚀 Minting NFT and registering IP...");
        console.log("Using metadata:", { ipMetadata, nftMetadata });
        
        result = await mintandregisterip(
          client,
          ipMetadata,
          nftMetadata
        );
        
        if (result && result.txHash && !result.ipId) {
          console.log("Transaction submitted but no ipId returned yet. Transaction hash:", result.txHash);
          
          try {
            // alert(`Transaction submitted! It may take a few minutes for your IP to be registered. You can check the transaction status using the hash: ${result.txHash}`);
          } catch (txError) {
            console.error("Error checking transaction:", txError);
          }
        }
      }

      if (result && (result.ipId || result.tokenId || result.txHash)) {
        console.log("✅ Registration successful:", result);
        
        const successDetails = [
          result.ipId ? `IP ID: ${result.ipId}` : '',
          result.tokenId ? `Token ID: ${result.tokenId}` : '',
          result.txHash ? `Transaction: ${result.txHash}` : '',
          result.explorerUrl ? `Explorer: ${result.explorerUrl}` : result.ipId ? `Explorer: https://aeneid.explorer.story.foundation/ipa/${result.ipId}` : ''
        ].filter(Boolean).join('\n');
        
        // alert(`Registration successful!\n${successDetails}`);
        
        if (!publicClient) {
          throw new Error("Could not get public client");
        }
        const media_hash = formData.mediaHash || "fallback_hash";
        const timestamp = new Date().toISOString();
        const receipt = await publicClient.waitForTransactionReceipt({ 
          hash: result.txHash! 
        });
        
        const blockNumber = Number(receipt.blockNumber);
        const response = await register_to_yakoa(result.ipId!,address!,formData.ipTitle,`media_${Date.now()}`,blockNumber,result.txHash!,formData.ipImageUrl,media_hash,{type:"trusted_platform",platform_name:"Mint Matrix"},timestamp,[],[]);
        console.log("Response from yakoa:", response);
        onRegister({
          content,
          formData,
          result,
          registrationType: getRegistrationType()
        });
        
        onClose();
      } else {
        throw new Error("Registration failed - no valid response received");
      }
    } catch (error) {
      console.error("❌ Registration failed:", error);
      alert(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getRegistrationType = () => {
    if (formData.attachPIL) {
      return "mintAndRegisterWithPIL";
    } else {
      return "mintAndRegister";
    }
  };

  const getRegistrationTypeDescription = () => {
    return formData.attachPIL
      ? "Create NFT, register as IP, and attach PIL terms in one transaction"
      : "Create NFT and register as IP in one transaction";
  };

  if (currentStep === "summary") {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="relative bg-black/40 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          
          <div className="px-6 py-5 border-b border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-medium text-white">Registration Summary</h2>
                <p className="text-sm text-white/60 mt-1">{getRegistrationTypeDescription()}</p>
              </div>
              <button
                onClick={onClose}
                className="text-white/40 hover:text-white/80 transition-colors p-2 hover:bg-white/10 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="space-y-6">
              <div className="bg-white/[0.05] border border-white/[0.1] rounded-xl p-4">
                <h3 className="text-sm font-medium text-white/80 mb-3">Content to Register</h3>
                <div className="flex items-start space-x-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-black/40 flex-shrink-0">
                    {content.type === "image" && (
                      <img src={content.url} alt="Content" className="w-full h-full object-cover" />
                    )}
                    {content.type === "video" && (
                      <video src={content.url} className="w-full h-full object-cover" muted />
                    )}
                    {content.type === "audio" && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-8 h-8 bg-purple-400/20 rounded-full flex items-center justify-center">
                          <div className="w-4 h-4 bg-purple-400 rounded-full"></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/90 text-sm font-medium mb-1">
                      {content.type.charAt(0).toUpperCase() + content.type.slice(1)} Content
                    </p>
                    <p className="text-white/60 text-xs line-clamp-2">{content.prompt}</p>
                    <p className="text-white/40 text-xs mt-1">
                      Generated {content.timestamp.toLocaleDateString()}
                    </p>
                    {formData.ipImageUrl && (
                      <p className="text-green-400 text-xs mt-1">✅ Uploaded to IPFS</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white/[0.05] border border-white/[0.1] rounded-xl p-4">
                <h3 className="text-sm font-medium text-white/80 mb-3">IP Asset Details</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-white/50">Title</p>
                    <p className="text-white/90 text-sm">{formData.ipTitle}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/50">Description</p>
                    <p className="text-white/90 text-sm">{formData.ipDescription}</p>
                  </div>
                  {formData.ipExternalUrl && (
                    <div>
                      <p className="text-xs text-white/50">External URL</p>
                      <p className="text-white/90 text-sm break-all">{formData.ipExternalUrl}</p>
                    </div>
                  )}
                  {formData.ipImageUrl && (
                    <div>
                      <p className="text-xs text-white/50">IPFS Image URL</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-green-400 text-xs break-all font-mono flex-1">{formData.ipImageUrl}</p>
                        <button
                          onClick={() => copyToClipboard(formData.ipImageUrl)}
                          className="text-white/40 hover:text-white/80 transition-colors"
                        >
                          {copiedToClipboard ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/[0.05] border border-white/[0.1] rounded-xl p-4">
                <h3 className="text-sm font-medium text-white/80 mb-3">NFT Details</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-white/50">Name</p>
                    <p className="text-white/90 text-sm">{formData.nftName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/50">Description</p>
                    <p className="text-white/90 text-sm">{formData.nftDescription}</p>
                  </div>
                  {formData.nftExternalUrl && (
                    <div>
                      <p className="text-xs text-white/50">External URL</p>
                      <p className="text-white/90 text-sm break-all">{formData.nftExternalUrl}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-white/50">NFT Image</p>
                    {formData.useSameImageForNFT ? (
                      <p className="text-blue-400 text-xs">Using same image as IP asset</p>
                    ) : formData.nftImageUrl ? (
                      <div className="flex items-center space-x-2">
                        <p className="text-green-400 text-xs break-all font-mono flex-1">{formData.nftImageUrl}</p>
                        <button
                          onClick={() => copyToClipboard(formData.nftImageUrl)}
                          className="text-white/40 hover:text-white/80 transition-colors"
                        >
                          {copiedToClipboard ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    ) : (
                      <p className="text-orange-400 text-xs">No custom image provided</p>
                    )}
                  </div>
                </div>
              </div>

              {formData.attachPIL && formData.pilTerms && (
                <div className="bg-white/[0.05] border border-white/[0.1] rounded-xl p-4">
                  <h3 className="text-sm font-medium text-white/80 mb-3">PIL Terms</h3>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div className="text-center">
                      <div className={`w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center ${
                        formData.pilTerms.commercialUse ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'
                      }`}>
                        {formData.pilTerms.commercialUse ? '✓' : '✗'}
                      </div>
                      <p className="text-white/60">Commercial Use</p>
                    </div>
                    <div className="text-center">
                      <div className={`w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center ${
                        formData.pilTerms.derivativesAllowed ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'
                      }`}>
                        {formData.pilTerms.derivativesAllowed ? '✓' : '✗'}
                      </div>
                      <p className="text-white/60">Derivatives</p>
                    </div>
                    <div className="text-center">
                      <div className={`w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center ${
                        formData.pilTerms.commercialAttribution ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'
                      }`}>
                        {formData.pilTerms.commercialAttribution ? '✓' : '✗'}
                      </div>
                      <p className="text-white/60">Attribution</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Wallet Connection Status */}
              {!isReady && (
                <div className="bg-orange-500/10 border border-orange-400/30 rounded-lg p-3 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div className="text-orange-400 text-sm">
                    <p className="font-medium mb-1">Wallet Connection Required</p>
                    <p className="text-xs">Please connect your wallet to proceed with registration</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/20 flex justify-between">
            <button
              onClick={() => setCurrentStep("form")}
              disabled={isProcessing}
              className="px-4 py-2 text-white/70 hover:text-white transition-colors disabled:opacity-50"
            >
              ← Back to Edit
            </button>
            <button
              onClick={handleSubmit}
              disabled={isProcessing || !isReady}
              className={`px-6 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                isProcessing || !isReady
                  ? 'bg-white/5 text-white/40 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-500/80 to-purple-500/80 hover:from-pink-500 hover:to-purple-500 text-white'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin w-4 h-4 border border-white border-t-transparent rounded-full"></div>
                  <span>Processing...</span>
                </>
              ) : !isReady ? (
                <>
                  <AlertCircle className="w-4 h-4" />
                  <span>Connect Wallet</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Confirm Registration</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative bg-black/40 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        
        <div className="px-6 py-5 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-medium text-white">Register as IP Asset</h2>
              <p className="text-sm text-white/60 mt-1">Transform your generated content into protected intellectual property</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white/80 transition-colors p-2 hover:bg-white/10 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          <div className="space-y-6">
            
            {!isReady && (
              <div className="bg-orange-500/10 border border-orange-400/30 rounded-lg p-3 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                <div className="text-orange-400 text-sm">
                  <p className="font-medium mb-1">Wallet Connection Required</p>
                  <p className="text-xs">Please connect your wallet to register your content as an IP asset</p>
                </div>
              </div>
            )}

            <div className="bg-gradient-to-r from-white/[0.05] to-white/[0.02] border border-white/[0.1] rounded-xl p-4">
              <h3 className="text-sm font-medium text-white/80 mb-3 flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-pink-400" />
                Your Generated Content
              </h3>
              <div className="flex items-start space-x-4">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-black/40 flex-shrink-0">
                  {content.type === "image" && <img src={content.url} alt="Generated content" className="w-full h-full object-cover" />}
                  {content.type === "video" && <video src={content.url} className="w-full h-full object-cover" muted />}
                  {content.type === "audio" && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-12 h-12 bg-purple-400/20 rounded-full flex items-center justify-center">
                        <div className="w-6 h-6 bg-purple-400 rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                      content.type === "image" ? "bg-pink-500/20 text-pink-300" :
                      content.type === "video" ? "bg-blue-500/20 text-blue-300" :
                      "bg-purple-500/20 text-purple-300"
                    }`}>
                      {content.type.toUpperCase()}
                    </span>
                    <span className="text-xs text-white/40">
                      {content.timestamp.toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-white/70 text-sm mb-2">{content.prompt}</p>
                  {content.metadata?.generationTime && (
                    <p className="text-xs text-white/40">Generated in {content.metadata.generationTime}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white/[0.05] border border-white/[0.1] rounded-xl overflow-hidden">
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer"
                  onClick={() => handleToggleSection("ip")}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <Shield className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white">IP Asset Information</h3>
                      <p className="text-xs text-white/60">Define your intellectual property details</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-white/40 transition-transform ${expandedSections.has("ip") ? "rotate-90" : ""}`} />
                </div>
                
                {expandedSections.has("ip") && (
                  <div className="px-4 pb-4 space-y-4 border-t border-white/[0.1]">
                    <div className="pt-4 space-y-4">
                      <div>
                        <label className="text-sm font-medium text-white/80 mb-2 block">Asset Title *</label>
                        <input type="text" value={formData.ipTitle} onChange={(e) => handleInputChange('ipTitle', e.target.value)} placeholder="e.g., Ethereal Dragon Artwork" className="w-full px-3 py-2 bg-white/[0.05] border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all" />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-white/80 mb-2 block">Description *</label>
                        <textarea value={formData.ipDescription} onChange={(e) => handleInputChange('ipDescription', e.target.value)} placeholder="Describe your intellectual property..." rows={3} className="w-full px-3 py-2 bg-white/[0.05] border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none" />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-white/80 mb-2 block">External URL (Optional)</label>
                        <input type="url" value={formData.ipExternalUrl} onChange={(e) => handleInputChange('ipExternalUrl', e.target.value)} placeholder="https://your-website.com" className="w-full px-3 py-2 bg-white/[0.05] border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all" />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-white/80 mb-2 block">IP Asset Image</label>
                        <div className="bg-white/[0.05] border border-white/20 rounded-lg p-3">
                          {/* --- START: Key Change --- */}
                          {isUploadingIP ? (
                            <div className="flex items-center space-x-2 text-blue-400">
                              <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                              <span className="text-sm">Uploading content to IPFS...</span>
                            </div>
                          ) : uploadError ? (
                            <div className="flex items-center space-x-2 text-red-400">
                              <AlertCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">{uploadError}</span>
                            </div>
                          ) : formData.ipImageUrl ? (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2 text-green-400">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">Successfully uploaded to IPFS</span>
                              </div>
                              <p className="text-xs text-white/60 break-all font-mono bg-white/[0.05] p-2 rounded border">
                                {formData.ipImageUrl}
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 text-orange-400">
                                <AlertCircle className="w-4 h-4" />
                                <span>Waiting for upload...</span>
                            </div>
                          )}
                          {/* --- END: Key Change --- */}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-white/[0.05] border border-white/[0.1] rounded-xl overflow-hidden">
                <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => handleToggleSection("nft")}>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <Globe className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white">NFT Details</h3>
                      <p className="text-xs text-white/60">Define your NFT for blockchain registration</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-white/40 transition-transform ${expandedSections.has("nft") ? "rotate-90" : ""}`} />
                </div>
                
                {expandedSections.has("nft") && (
                  <div className="px-4 pb-4 space-y-4 border-t border-white/[0.1]">
                    <div className="pt-4 space-y-4">
                      <div>
                        <label className="text-sm font-medium text-white/80 mb-2 block">NFT Name *</label>
                        <input type="text" value={formData.nftName} onChange={(e) => handleInputChange('nftName', e.target.value)} placeholder="e.g., Ethereal Dragon #001" className="w-full px-3 py-2 bg-white/[0.05] border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all" />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-white/80 mb-2 block">NFT Description *</label>
                        <textarea value={formData.nftDescription} onChange={(e) => handleInputChange('nftDescription', e.target.value)} placeholder="Describe your NFT for collectors..." rows={3} className="w-full px-3 py-2 bg-white/[0.05] border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all resize-none" />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-white/80 mb-2 block">NFT External URL (Optional)</label>
                        <input type="url" value={formData.nftExternalUrl} onChange={(e) => handleInputChange('nftExternalUrl', e.target.value)} placeholder="https://collection-website.com" className="w-full px-3 py-2 bg-white/[0.05] border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all" />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-white/80 mb-2 block">NFT Image</label>
                        <div className="flex items-center space-x-3 mb-3">
                          <button onClick={() => handleInputChange('useSameImageForNFT', !formData.useSameImageForNFT)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formData.useSameImageForNFT ? 'bg-blue-500' : 'bg-white/20'}`}>
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${formData.useSameImageForNFT ? 'translate-x-5' : 'translate-x-1'}`} />
                          </button>
                          <span className="text-sm text-white/70">Use same image as IP asset</span>
                        </div>
                        {formData.useSameImageForNFT ? (
                          <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                            <div className="flex items-center space-x-2 text-blue-400"><CheckCircle className="w-4 h-4" /><span className="text-sm font-medium">Using IP asset image for NFT</span></div>
                            <p className="text-xs text-white/60 mt-1">The same IPFS link will be used for both IP asset and NFT metadata</p>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center">
                            {/* Custom NFT image upload logic here */}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white/[0.05] border border-white/[0.1] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center"><Shield className="w-4 h-4 text-emerald-400" /></div>
                    <div>
                      <h3 className="text-sm font-medium text-white">Attach PIL Terms</h3>
                      <p className="text-xs text-white/60">Define how others can use your IP</p>
                    </div>
                  </div>
                  <button onClick={() => handleInputChange('attachPIL', !formData.attachPIL)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.attachPIL ? 'bg-emerald-500' : 'bg-white/20'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.attachPIL ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                {formData.attachPIL && (
                  <div className="pt-4 border-t border-white/[0.1]">
                    {formData.pilTerms ? (
                      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-emerald-300 text-sm font-medium">PIL Terms Ready</span>
                          <button onClick={() => setIsPILModalOpen(true)} className="text-emerald-400 hover:text-emerald-300 text-xs transition-colors">Edit</button>
                        </div>
                        {/* ...PIL terms summary... */}
                      </div>
                    ) : (
                      <button onClick={() => setIsPILModalOpen(true)} className="w-full p-3 border-2 border-dashed border-emerald-500/30 rounded-lg text-emerald-300 hover:text-emerald-200 hover:border-emerald-500/50 transition-colors flex items-center justify-center space-x-2">
                        <Plus className="w-4 h-4" /><span>Create PIL Terms</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {!isFormValid() && (
              <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-3 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-red-400 text-sm">
                  <p className="font-medium mb-1">Please complete the following:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    {!formData.ipTitle.trim() && <li>IP Asset Title is required</li>}
                    {!formData.ipDescription.trim() && <li>IP Asset Description is required</li>}
                    {!formData.nftName.trim() && <li>NFT Name is required</li>}
                    {!formData.nftDescription.trim() && <li>NFT Description is required</li>}
                    {!formData.mediaHash?.trim() && <li>IPFS upload must complete successfully</li>}
                    {formData.attachPIL && !formData.pilTerms && <li>PIL Terms must be created</li>}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/20 flex justify-between">
          <button onClick={onClose} className="px-4 py-2 text-white/70 hover:text-white transition-colors">Cancel</button>
          <button
            onClick={() => setCurrentStep("summary")}
            // --- START: Key Change ---
            disabled={!isFormValid() || isUploadingIP || !isReady || !!uploadError}
            className={`px-6 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
              isFormValid() && !isUploadingIP && isReady && !uploadError
                ? 'bg-gradient-to-r from-pink-500/80 to-purple-500/80 hover:from-pink-500 hover:to-purple-500 text-white'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
            // --- END: Key Change ---
          >
            {isUploadingIP ? (
              <><div className="animate-spin w-4 h-4 border border-white border-t-transparent rounded-full"></div><span>Uploading...</span></>
            ) : !isReady ? (
              <><AlertCircle className="w-4 h-4" /><span>Connect Wallet</span></>
            ) : (
              <><><span>Review Summary</span><ChevronRight className="w-4 h-4" /></></>
            )}
          </button>
        </div>
      </div>
    </div>

    <PILModal
      isOpen={isPILModalOpen}
      onClose={() => setIsPILModalOpen(false)}
      onAttachPIL={handlePILAttach}
    />
  </>
  );
};
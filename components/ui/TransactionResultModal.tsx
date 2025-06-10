"use client";
import React, { useState } from 'react';
import { X, Check, Copy, ExternalLink } from 'lucide-react';

interface TransactionResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  result: {
    ipId?: string;
    tokenId?: string | bigint;
    txHash?: string;
    explorerUrl?: string;
    licenseTermsIds?: any[];
    [key: string]: any;
  };
  registrationType?: string;
}

export const TransactionResultModal: React.FC<TransactionResultModalProps> = ({
  isOpen,
  onClose,
  title,
  result,
  registrationType
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Debug rendering
  console.log("TransactionResultModal rendering:", { isOpen, hasResult: !!result });
  
  if (!isOpen) {
    console.log("TransactionResultModal not showing because isOpen is false");
    return null;
  }
  
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-black/60 border border-white/20 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-4 h-4 text-green-400" />
            </div>
            <h3 className="text-white text-lg font-medium">{title}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-5">
          <div className="mb-4">
            <p className="text-white/80 text-sm">
              Your registration was successful! Below are the details of your transaction:
            </p>
          </div>
          
          <div className="space-y-3 mb-6">
            {result.ipId && (
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-white/60">IP Asset ID</span>
                  <button 
                    onClick={() => copyToClipboard(result.ipId!, 'ipId')}
                    className="text-white/60 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copiedField === 'ipId' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <p className="text-white text-sm font-mono break-all">{result.ipId}</p>
              </div>
            )}
            
            {result.tokenId && (
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-white/60">NFT Token ID</span>
                  <button 
                    onClick={() => copyToClipboard(String(result.tokenId), 'tokenId')}
                    className="text-white/60 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                  >
                    {copiedField === 'tokenId' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <p className="text-white text-sm font-mono break-all">{String(result.tokenId)}</p>
              </div>
            )}
            
            {result.txHash && (
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-white/60">Transaction Hash</span>
                  <button 
                    onClick={() => copyToClipboard(result.txHash!, 'txHash')}
                    className="text-white/60 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                  >
                    {copiedField === 'txHash' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <p className="text-white text-sm font-mono break-all">{result.txHash}</p>
              </div>
            )}
            
            {result.licenseTermsIds && result.licenseTermsIds.length > 0 && (
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-white/60">License Terms ID</span>
                  <button 
                    onClick={() => {
                      if (result.licenseTermsIds && result.licenseTermsIds.length > 0) {
                        copyToClipboard(String(result.licenseTermsIds[0]), 'licenseTerms');
                      }
                    }}
                    className="text-white/60 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                  >
                    {copiedField === 'licenseTerms' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <p className="text-white text-sm font-mono break-all">
                  {result.licenseTermsIds && result.licenseTermsIds.length > 0 
                    ? String(result.licenseTermsIds[0]) 
                    : ''}
                </p>
              </div>
            )}

            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-white/60">Registration Type</span>
              </div>
              <p className="text-white text-sm">{registrationType === "mintAndRegisterWithPIL" ? "IP + PIL Terms" : "IP Only"}</p>
            </div>
          </div>

          <div className="flex justify-between space-x-3">
            {result.explorerUrl && (
              <a
                href={result.explorerUrl}
                target="_blank"
                rel="noopener noreferrer" 
                className="flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium flex-1 hover:from-pink-600 hover:to-purple-600 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>View on Explorer</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-medium flex-1 hover:bg-white/20 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
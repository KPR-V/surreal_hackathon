"use client";

import React, { useState, useEffect } from 'react';

interface Transaction {
  id: string;
  txHash: string;
  actionType: string;
  blockNumber: string;
  blockTimestamp: string;
  createdAt: string;
  initiator: string;
  ipId?: string;
  logIndex: string;
  resourceId: string;
  resourceType: string;
  transactionIndex: string;
  result?: string;
  gas_used?: string;
  fee?: string;
  method?: string;
  has_error?: boolean;
  decoded_input?: {
    method_call: string;
    method_id: string;
    parameters: Array<{
      name: string;
      type: string;
      value: string;
    }>;
  };
  transaction_types?: string[];
  value?: string;
}

interface TransactionInfoModalProps {
  transaction: Transaction;
  isOpen: boolean;
  onClose: () => void;
  tableHeight: number;
}

export const TransactionInfoModal: React.FC<TransactionInfoModalProps> = ({ 
  transaction, 
  isOpen, 
  onClose, 
  tableHeight 
}) => {
  const [detailedTransaction, setDetailedTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && transaction.id) {
      fetchTransactionDetails();
    }
  }, [isOpen, transaction.id]);

  const fetchTransactionDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First attempt to fetch more details (if needed)
      try {
        const response = await fetch(`/api/transactions/${transaction.txHash}`);
        if (response.ok) {
          const data = await response.json();
          // Merge the detailed data with the original transaction
          setDetailedTransaction({
            ...transaction,
            ...data
          });
        } else {
          // Fall back to using the original transaction data
          setDetailedTransaction(transaction);
        }
      } catch (err) {
        // If fetching fails, still show the original transaction data
        setDetailedTransaction(transaction);
      }
      
    } catch (err) {
      console.error('Error fetching transaction details:', err);
      setError('Failed to load transaction details');
      // Still use the basic transaction data we have
      setDetailedTransaction(transaction);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (timestamp: string) => {
    try {
      // Check if this is a timestamp in seconds (blockchain standard)
      const isSeconds = timestamp.length <= 10;
      const date = new Date(isSeconds ? parseInt(timestamp) * 1000 : timestamp);
      
      return {
        full: date.toLocaleString(),
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString()
      };
    } catch {
      return {
        full: timestamp,
        date: timestamp,
        time: 'N/A'
      };
    }
  };

  const getActionTypeInfo = (actionType: string) => {
    const type = actionType?.toLowerCase() || '';
    
    if (type.includes('mint')) {
      return {
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/20',
        description: 'Token Minting Operation'
      };
    } else if (type.includes('register')) {
      return {
        color: 'text-pink-400',
        bgColor: 'bg-pink-500/10',
        borderColor: 'border-pink-500/20',
        description: 'IP Asset Registration'
      };
    } else if (type.includes('license')) {
      return {
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        description: 'License Operation'
      };
    } else if (type.includes('attach')) {
      return {
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/20',
        description: 'Policy Attachment'
      };
    } else if (type.includes('transfer')) {
      return {
        color: 'text-violet-400',
        bgColor: 'bg-violet-500/10',
        borderColor: 'border-violet-500/20',
        description: 'Asset Transfer'
      };
    } else if (type.includes('dispute')) {
      return {
        color: 'text-rose-400',
        bgColor: 'bg-rose-500/10',
        borderColor: 'border-rose-500/20',
        description: 'Dispute Action'
      };
    } 
    
    return {
      color: 'text-purple-300',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      description: 'Contract Interaction'
    };
  };

  const getResourceTypeInfo = (resourceType: string) => {
    const type = resourceType?.toLowerCase() || '';
    
    if (type.includes('contract')) {
      return {
        color: 'text-blue-400',
        description: 'Smart Contract'
      };
    } else if (type.includes('nft')) {
      return {
        color: 'text-green-400',
        description: 'Non-Fungible Token'
      };
    } else if (type.includes('ip')) {
      return {
        color: 'text-blue-400',
        description: 'Intellectual Property Asset'
      };
    } else if (type.includes('license')) {
      return {
        color: 'text-purple-400',
        description: 'License Token'
      };
    } else if (type.includes('policy')) {
      return {
        color: 'text-pink-400',
        description: 'Policy Configuration'
      };
    }
    
    return {
      color: 'text-neutral-400',
      description: 'Blockchain Resource'
    };
  };

  // Format ETH values
  const formatEthValue = (value: string) => {
    try {
      const valueInWei = BigInt(value);
      // Convert to ETH (18 decimal places)
      const valueInEth = Number(valueInWei) / 1e18;
      
      if (valueInEth === 0) return '0 ETH';
      
      // Format based on size
      if (valueInEth < 0.000001) {
        return '< 0.000001 ETH';
      } else if (valueInEth < 0.001) {
        return `${valueInEth.toFixed(6)} ETH`;
      } else {
        return `${valueInEth.toFixed(4)} ETH`;
      }
    } catch (error) {
      console.error('Error formatting ETH value:', error);
      return 'Unknown ETH';
    }
  };

  if (!isOpen) return null;

  const displayTransaction = detailedTransaction || transaction;
  const actionInfo = getActionTypeInfo(displayTransaction.actionType);
  const resourceInfo = getResourceTypeInfo(displayTransaction.resourceType);
  const dateInfo = formatDate(displayTransaction.blockTimestamp || displayTransaction.createdAt);

  // Calculate modal position to be centered on the page rather than relative to the table
  const modalWidth = 440; // Fixed width
  const modalHeight = Math.min(window.innerHeight - 100, 650); // Limit height to fit screen

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
      {/* Modal position fixed to center of screen */}
      <div 
        className="relative bg-zinc-950/95 backdrop-blur-xl border-2 border-neutral-950/60 rounded-xl shadow-2xl overflow-hidden"
        style={{ 
          width: modalWidth,
          maxHeight: modalHeight,
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-900/20 flex items-center justify-between bg-zinc-900/10">
          <div>
            <h2 className="text-sm font-medium text-neutral-100">Transaction Details</h2>
            <p className="text-xs text-purple-300 font-mono mt-0.5">
              {displayTransaction.txHash.slice(0, 12)}...
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-pink-500/20 rounded-lg transition-colors border border-pink-500/20"
          >
            <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto" style={{ maxHeight: modalHeight - 70 }}>
          <div className="p-4 space-y-3">
            {loading && (
              <div className="bg-purple-500/10 rounded-lg p-4 text-center border border-purple-500/20">
                <div className="animate-spin w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-xs text-purple-300">Loading details...</p>
              </div>
            )}

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
                <p className="text-rose-400 text-xs">{error}</p>
              </div>
            )}

            {/* Action Type Section */}
            <div className={`${actionInfo.bgColor} border ${actionInfo.borderColor} rounded-lg p-3`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-neutral-400 uppercase tracking-wider font-medium">Action</span>
                <span className={`text-sm font-medium ${actionInfo.color}`}>
                  {displayTransaction.actionType}
                </span>
              </div>
              <p className="text-xs text-neutral-500">{actionInfo.description}</p>
            </div>

            {/* Transaction Hash */}
            <div className="bg-zinc-900/30 rounded-lg p-3 border border-zinc-800/30">
              <p className="text-xs text-neutral-400 mb-2 font-medium uppercase tracking-wider">Transaction Hash</p>
              <button 
                onClick={() => copyToClipboard(displayTransaction.txHash)}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-mono break-all bg-blue-500/10 p-2 rounded-md w-full text-left hover:bg-blue-500/20 border border-blue-500/20"
                title="Click to copy"
              >
                {displayTransaction.txHash}
              </button>
            </div>

            {/* Value & Fee */}
            {(displayTransaction.value || displayTransaction.fee) && (
              <div className="grid grid-cols-2 gap-3">
                {displayTransaction.value && (
                  <div className="bg-zinc-900/30 rounded-lg p-3 border border-zinc-800/30">
                    <p className="text-xs text-neutral-400 mb-1 font-medium">Value</p>
                    <span className="text-sm text-neutral-300">
                      {formatEthValue(displayTransaction.value)}
                    </span>
                  </div>
                )}
                
                {displayTransaction.fee && (
                  <div className="bg-zinc-900/30 rounded-lg p-3 border border-zinc-800/30">
                    <p className="text-xs text-neutral-400 mb-1 font-medium">Fee</p>
                    <span className="text-sm text-neutral-300">
                      {formatEthValue(displayTransaction.fee)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Block Information */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
                <p className="text-xs text-neutral-400 mb-1 font-medium">Block</p>
                <span className="text-sm text-purple-300 font-mono">
                  {displayTransaction.blockNumber}
                </span>
              </div>
              
              <div className="bg-pink-500/10 rounded-lg p-3 border border-pink-500/20">
                <p className="text-xs text-neutral-400 mb-1 font-medium">Status</p>
                <span className={`text-sm ${displayTransaction.has_error ? 'text-red-400' : 'text-green-300'}`}>
                                               {transaction.has_error ? 'Failed' : (transaction.result || 'Success')}

                </span>
              </div>
            </div>

            {/* Timing */}
            <div className="bg-zinc-900/30 rounded-lg p-3 border border-zinc-800/30">
              <p className="text-xs text-neutral-400 mb-2 font-medium uppercase tracking-wider">Timestamp</p>
              <div className="space-y-1">
                <p className="text-sm text-neutral-200">{dateInfo.date}</p>
                <p className="text-xs text-neutral-500">{dateInfo.time}</p>
              </div>
            </div>

            {/* From/To Section */}
            <div className="space-y-3">
              <div className="bg-neutral-500/10 rounded-lg p-3 border border-neutral-500/20">
                <p className="text-xs text-neutral-400 mb-2 font-medium uppercase tracking-wider">From</p>
                <button 
                  onClick={() => copyToClipboard(displayTransaction.initiator)}
                  className="text-xs text-pink-400 hover:text-pink-300 transition-colors font-mono break-all bg-pink-500/20 p-2 rounded-md w-full text-left hover:bg-pink-500/30 border border-pink-500/30"
                  title="Click to copy"
                >
                  {displayTransaction.initiator}
                </button>
              </div>

              <div className="bg-neutral-500/10 rounded-lg p-3 border border-neutral-500/20">
                <p className="text-xs text-neutral-400 mb-2 font-medium uppercase tracking-wider">To</p>
                <button 
                  onClick={() => copyToClipboard(displayTransaction.resourceId)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-mono break-all bg-blue-500/20 p-2 rounded-md w-full text-left hover:bg-blue-500/30 border border-blue-500/30"
                  title="Click to copy"
                >
                  {displayTransaction.resourceId}
                </button>
              </div>
            </div>

            {/* Method Information */}
            {displayTransaction.decoded_input && (
              <div className="bg-zinc-900/20 border border-zinc-800/20 rounded-lg p-3">
                <h4 className="text-xs font-medium text-neutral-300 mb-3 uppercase tracking-wider">Method Details</h4>
                <div className="space-y-3">
                  {/* Method Name */}
                  <div className="bg-zinc-900/30 rounded-lg p-2 border border-zinc-800/40">
                    <p className="text-xs text-neutral-500 mb-1">Method</p>
                    <p className="text-sm text-green-400 font-mono break-all">
                      {displayTransaction.decoded_input.method_call}
                    </p>
                  </div>
                  
                  {/* Method Parameters */}
                  {displayTransaction.decoded_input.parameters && 
                   displayTransaction.decoded_input.parameters.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-neutral-400">Parameters:</p>
                      <div className="max-h-40 overflow-y-auto bg-zinc-900/30 rounded-lg p-1 border border-zinc-800/40">
                        {displayTransaction.decoded_input.parameters.map((param, index) => (
                          <div key={index} className="p-2 hover:bg-zinc-800/30 transition-colors">
                            <div className="flex justify-between">
                              <span className="text-xs text-blue-400">{param.name}</span>
                              <span className="text-xs text-neutral-500">{param.type}</span>
                            </div>
                            <p className="text-xs text-neutral-300 font-mono mt-1 break-all">
                              {param.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Transaction Types */}
            {displayTransaction.transaction_types && displayTransaction.transaction_types.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {displayTransaction.transaction_types.map((type, index) => (
                  <span 
                    key={index} 
                    className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs"
                  >
                    {type}
                  </span>
                ))}
              </div>
            )}

            {/* IP Asset ID - Only if available */}
            {displayTransaction.ipId && (
              <div className="bg-neutral-500/10 rounded-lg p-3 border border-neutral-500/20">
                <p className="text-xs text-neutral-400 mb-2 font-medium uppercase tracking-wider">IP Asset ID</p>
                <button 
                  onClick={() => displayTransaction.ipId && copyToClipboard(displayTransaction.ipId)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-mono break-all bg-blue-500/20 p-2 rounded-md w-full text-left hover:bg-blue-500/30 border border-blue-500/30"
                  title="Click to copy"
                >
                  {displayTransaction.ipId}
                </button>
              </div>
            )}
            
            {/* Gas Used */}
            {displayTransaction.gas_used && (
              <div className="bg-zinc-900/20 border border-zinc-800/20 rounded-lg p-3">
                <h4 className="text-xs font-medium text-neutral-300 mb-2 uppercase tracking-wider">Gas Used</h4>
                <p className="text-sm text-neutral-300 font-mono">{displayTransaction.gas_used}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
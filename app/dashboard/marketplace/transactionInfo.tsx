"use client";

import React, { useState, useEffect } from 'react';

interface Transaction {
  actionType: string;
  blockNumber: string;
  blockTimestamp: string;
  createdAt: string;
  id: string;
  initiator: string;
  ipId: string;
  logIndex: string;
  resourceId: string;
  resourceType: string;
  transactionIndex: string;
  txHash: string;
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
      setDetailedTransaction(transaction);
    } catch (err) {
      console.error('Error fetching transaction details:', err);
      setError('Failed to load transaction details');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(parseInt(timestamp) * 1000);
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
    switch (actionType.toLowerCase()) {
      case 'register':
      case 'registration':
        return {
          color: 'text-pink-400',
          bgColor: 'bg-zinc-500/10',
          borderColor: 'border-zinc-500/20',
          description: 'IP Asset Registration'
        };
      case 'license':
      case 'licensing':
        return {
          color: 'text-blue-400',
          bgColor: 'bg-zinc-500/10',
          borderColor: 'border-zinc-500/20',
          description: 'License Operation'
        };
      case 'attach':
      case 'attachment':
        return {
          color: 'text-purple-400',
          bgColor: 'bg-zinc-500/10',
          borderColor: 'border-zinc-500/20',
          description: 'Policy Attachment'
        };
      case 'transfer':
        return {
          color: 'text-violet-400',
          bgColor: 'bg-zinc-500/10',
          borderColor: 'border-zinc-500/20',
          description: 'Asset Transfer'
        };
      case 'dispute':
        return {
          color: 'text-rose-400',
          bgColor: 'bg-zinc-500/10',
          borderColor: 'border-zinc-500/20',
          description: 'Dispute Action'
        };
      default:
        return {
          color: 'text-purple-300',
          bgColor: 'bg-zinc-500/10',
          borderColor: 'border-zinc-500/20',
          description: 'Unknown Action'
        };
    }
  };

  const getResourceTypeInfo = (resourceType: string) => {
    switch (resourceType.toLowerCase()) {
      case 'ipasset':
      case 'ip_asset':
        return {
          color: 'text-blue-400',
          description: 'Intellectual Property Asset'
        };
      case 'license':
        return {
          color: 'text-purple-400',
          description: 'License Token'
        };
      case 'policy':
        return {
          color: 'text-pink-400',
          description: 'Policy Configuration'
        };
      default:
        return {
          color: 'text-neutral-400',
          description: 'Unknown Resource'
        };
    }
  };

  if (!isOpen) return null;

  const displayTransaction = detailedTransaction || transaction;
  const actionInfo = getActionTypeInfo(displayTransaction.actionType);
  const resourceInfo = getResourceTypeInfo(displayTransaction.resourceType);
  const dateInfo = formatDate(displayTransaction.blockTimestamp);

  // Calculate modal dimensions to fit within table
  const modalHeight = Math.min(tableHeight - 60, 600); // Leave 60px margin from table edges
  const modalWidth = 400; // Fixed width that should fit in most table layouts

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-sm">
      {/* Modal positioned within table bounds */}
      <div 
        className="relative bg-zinc-950/95 backdrop-blur-xl border-2 border-neutral-950/60 rounded-xl shadow-2xl overflow-hidden"
        style={{ 
          width: modalWidth,
          height: modalHeight,
          maxHeight: modalHeight
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-900/20 flex items-center justify-between bg-zinc-900/10">
          <div>
            <h2 className="text-sm font-medium text-neutral-100">Transaction Details</h2>
            <p className="text-xs text-purple-300 font-mono mt-0.5">
              {displayTransaction.id.slice(0, 12)}...
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
        <div className="overflow-y-auto" style={{ height: modalHeight - 70 }}>
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

            {/* Block Information */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
                <p className="text-xs text-neutral-400 mb-1 font-medium">Block</p>
                <span className="text-sm text-purple-300 font-mono">
                  {displayTransaction.blockNumber}
                </span>
              </div>
              
              <div className="bg-pink-500/10 rounded-lg p-3 border border-pink-500/20">
                <p className="text-xs text-neutral-400 mb-1 font-medium">Index</p>
                <span className="text-sm text-pink-300 font-mono">
                  {displayTransaction.transactionIndex}
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

            {/* Initiator */}
            <div className="bg-neutral-500/10 rounded-lg p-3 border border-neutral-500/20">
              <p className="text-xs text-neutral-400 mb-2 font-medium uppercase tracking-wider">Initiator</p>
              <button 
                onClick={() => copyToClipboard(displayTransaction.initiator)}
                className="text-xs text-pink-400 hover:text-pink-300 transition-colors font-mono break-all bg-pink-500/20 p-2 rounded-md w-full text-left hover:bg-pink-500/30 border border-pink-500/30"
                title="Click to copy"
              >
                {displayTransaction.initiator}
              </button>
            </div>

            {/* Resource Information */}
            <div className="space-y-3">
              <div className="bg-neutral-500/10 rounded-lg p-3 border border-neutral-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-neutral-400 uppercase tracking-wider font-medium">Resource</span>
                  <span className={`text-sm font-medium ${resourceInfo.color}`}>
                    {displayTransaction.resourceType || 'N/A'}
                  </span>
                </div>
                <p className="text-xs text-neutral-500">{resourceInfo.description}</p>
              </div>

              {displayTransaction.resourceId && (
                <div className="bg-neutral-500/10 rounded-lg p-3 border border-neutral-500/20">
                  <p className="text-xs text-neutral-400 mb-2 font-medium uppercase tracking-wider">Resource ID</p>
                  <button 
                    onClick={() => copyToClipboard(displayTransaction.resourceId)}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-mono break-all bg-purple-500/20 p-2 rounded-md w-full text-left hover:bg-purple-500/30 border border-purple-500/30"
                    title="Click to copy"
                  >
                    {displayTransaction.resourceId}
                  </button>
                </div>
              )}

              {displayTransaction.ipId && (
                <div className="bg-neutral-500/10 rounded-lg p-3 border border-neutral-500/20">
                  <p className="text-xs text-neutral-400 mb-2 font-medium uppercase tracking-wider">IP Asset ID</p>
                  <button 
                    onClick={() => copyToClipboard(displayTransaction.ipId)}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-mono break-all bg-blue-500/20 p-2 rounded-md w-full text-left hover:bg-blue-500/30 border border-blue-500/30"
                    title="Click to copy"
                  >
                    {displayTransaction.ipId}
                  </button>
                </div>
              )}
            </div>

            {/* Technical Details */}
            <div className="bg-zinc-900/20 border border-zinc-800/20 rounded-lg p-3">
              <h4 className="text-xs font-medium text-neutral-300 mb-3 uppercase tracking-wider">Technical Info</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Log Index:</span>
                  <span className="text-neutral-300 font-mono">{displayTransaction.logIndex}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Block Time:</span>
                  <span className="text-neutral-300 font-mono">{displayTransaction.blockTimestamp}</span>
                </div>
                {displayTransaction.createdAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">Created:</span>
                    <span className="text-neutral-300 font-mono">{displayTransaction.createdAt}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
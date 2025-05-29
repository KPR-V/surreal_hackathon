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
}

export const TransactionInfoModal: React.FC<TransactionInfoModalProps> = ({ transaction, isOpen, onClose }) => {
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
      
      // For now, we'll use the provided transaction data
      // In a real implementation, you might fetch additional details
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
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
          description: 'IP Asset Registration'
        };
      case 'license':
      case 'licensing':
        return {
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
          description: 'License Operation'
        };
      case 'attach':
      case 'attachment':
        return {
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/10',
          borderColor: 'border-purple-500/20',
          description: 'Policy Attachment'
        };
      case 'transfer':
        return {
          color: 'text-orange-400',
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-500/20',
          description: 'Asset Transfer'
        };
      case 'dispute':
        return {
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          description: 'Dispute Action'
        };
      default:
        return {
          color: 'text-zinc-300',
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
          color: 'text-cyan-400',
          description: 'Intellectual Property Asset'
        };
      case 'license':
        return {
          color: 'text-indigo-400',
          description: 'License Token'
        };
      case 'policy':
        return {
          color: 'text-pink-400',
          description: 'Policy Configuration'
        };
      default:
        return {
          color: 'text-zinc-400',
          description: 'Unknown Resource'
        };
    }
  };

  if (!isOpen) return null;

  const displayTransaction = detailedTransaction || transaction;
  const actionInfo = getActionTypeInfo(displayTransaction.actionType);
  const resourceInfo = getResourceTypeInfo(displayTransaction.resourceType);
  const dateInfo = formatDate(displayTransaction.blockTimestamp);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/20 rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-700/20 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-white">Transaction Details</h2>
            <p className="text-sm text-zinc-400">ID: {displayTransaction.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800/50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading && (
            <div className="bg-zinc-800/30 rounded-lg p-6 text-center mb-6">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-zinc-400">Loading transaction details...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Action Type Section */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-white mb-4">Action Information</h3>
            <div className={`${actionInfo.bgColor} border ${actionInfo.borderColor} rounded-lg p-4`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Action Type</span>
                <span className={`text-sm font-medium ${actionInfo.color}`}>
                  {displayTransaction.actionType}
                </span>
              </div>
              <p className="text-xs text-zinc-400">{actionInfo.description}</p>
            </div>
          </div>

          {/* Basic Transaction Info */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-white mb-4">Transaction Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-800/30 rounded-lg p-4">
                <p className="text-xs text-zinc-500 mb-1">Transaction Hash</p>
                <button 
                  onClick={() => copyToClipboard(displayTransaction.txHash)}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-mono break-all"
                  title="Click to copy"
                >
                  {displayTransaction.txHash}
                </button>
              </div>
              
              <div className="bg-zinc-800/30 rounded-lg p-4">
                <p className="text-xs text-zinc-500 mb-1">Block Number</p>
                <span className="text-sm text-white font-mono">
                  {displayTransaction.blockNumber}
                </span>
              </div>

              <div className="bg-zinc-800/30 rounded-lg p-4">
                <p className="text-xs text-zinc-500 mb-1">Transaction Index</p>
                <span className="text-sm text-white font-mono">
                  {displayTransaction.transactionIndex}
                </span>
              </div>

              <div className="bg-zinc-800/30 rounded-lg p-4">
                <p className="text-xs text-zinc-500 mb-1">Log Index</p>
                <span className="text-sm text-white font-mono">
                  {displayTransaction.logIndex}
                </span>
              </div>
            </div>
          </div>

          {/* Timing Information */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-white mb-4">Timing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-800/30 rounded-lg p-4">
                <p className="text-xs text-zinc-500 mb-1">Block Timestamp</p>
                <div className="space-y-1">
                  <p className="text-sm text-white">{dateInfo.date}</p>
                  <p className="text-xs text-zinc-400">{dateInfo.time}</p>
                </div>
              </div>
              
              <div className="bg-zinc-800/30 rounded-lg p-4">
                <p className="text-xs text-zinc-500 mb-1">Created At</p>
                <span className="text-sm text-white">
                  {displayTransaction.createdAt || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-white mb-4">Participants</h3>
            <div className="bg-zinc-800/30 rounded-lg p-4">
              <p className="text-xs text-zinc-500 mb-1">Initiator</p>
              <button 
                onClick={() => copyToClipboard(displayTransaction.initiator)}
                className="text-sm text-orange-400 hover:text-orange-300 transition-colors font-mono break-all"
                title="Click to copy"
              >
                {displayTransaction.initiator}
              </button>
            </div>
          </div>

          {/* Resource Information */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-white mb-4">Resource Details</h3>
            <div className="space-y-4">
              <div className="bg-zinc-800/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider">Resource Type</span>
                  <span className={`text-sm font-medium ${resourceInfo.color}`}>
                    {displayTransaction.resourceType || 'N/A'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">{resourceInfo.description}</p>
              </div>

              {displayTransaction.resourceId && (
                <div className="bg-zinc-800/30 rounded-lg p-4">
                  <p className="text-xs text-zinc-500 mb-1">Resource ID</p>
                  <button 
                    onClick={() => copyToClipboard(displayTransaction.resourceId)}
                    className="text-sm text-purple-400 hover:text-purple-300 transition-colors font-mono break-all"
                    title="Click to copy"
                  >
                    {displayTransaction.resourceId}
                  </button>
                </div>
              )}

              {displayTransaction.ipId && (
                <div className="bg-zinc-800/30 rounded-lg p-4">
                  <p className="text-xs text-zinc-500 mb-1">IP Asset ID</p>
                  <button 
                    onClick={() => copyToClipboard(displayTransaction.ipId)}
                    className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-mono break-all"
                    title="Click to copy"
                  >
                    {displayTransaction.ipId}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Technical Details */}
          <div className="bg-zinc-800/20 rounded-lg p-4">
            <h4 className="text-xs font-medium text-zinc-300 mb-3 uppercase tracking-wider">Technical Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Transaction ID:</span>
                <span className="text-zinc-300 font-mono">{displayTransaction.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Block Timestamp:</span>
                <span className="text-zinc-300 font-mono">{displayTransaction.blockTimestamp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Transaction Index:</span>
                <span className="text-zinc-300 font-mono">{displayTransaction.transactionIndex}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Log Index:</span>
                <span className="text-zinc-300 font-mono">{displayTransaction.logIndex}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
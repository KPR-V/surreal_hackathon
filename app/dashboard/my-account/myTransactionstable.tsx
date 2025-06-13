"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { TransactionInfoModal } from './myTransactioninfo';

interface StoryScanTransaction {
  hash: string;
  from: {
    hash: string;
  };
  to: {
    hash: string;
    name?: string;
  };
  method: string;
  block_number: number;
  timestamp: string;
  status: string;
  value: string;
  gas_used: string;
  fee: {
    value: string;
  };
  decoded_input?: {
    method_call: string;
    method_id: string;
    parameters: Array<{
      name: string;
      type: string;
      value: string;
    }>;
  };
  has_error_in_internal_transactions: boolean;
  transaction_types?: string[];
  result?: string;
}

// Convert StoryScan transaction to our Transaction format
const convertToTransaction = (tx: StoryScanTransaction) => {
  return {
    id: tx.hash,
    txHash: tx.hash,
    actionType: tx.method || 'Transaction',
    initiator: tx.from.hash,
    blockNumber: tx.block_number.toString(),
    blockTimestamp: new Date(tx.timestamp).getTime() / 1000 + '', // Convert to seconds timestamp
    createdAt: tx.timestamp,
    logIndex: '0',
    transactionIndex: '0',
    resourceType: tx.to.name || 'Contract',
    resourceId: tx.to.hash,
    ipId: '',  // Not available in StoryScan API
    result: tx.result || tx.status,
    value: tx.value,
    gas_used: tx.gas_used,
    fee: tx.fee.value,
    method: tx.method,
    has_error: tx.has_error_in_internal_transactions,
    decoded_input: tx.decoded_input,
    transaction_types: tx.transaction_types || []
  };
};

interface MyTransactionsTableProps {
  compact?: boolean;
  height?: number;
}

export const MyTransactionsTable: React.FC<MyTransactionsTableProps> = ({ 
  compact = false, 
  height = 400 
}) => {
  const { address: connectedAddress } = useAccount();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (connectedAddress) {
      fetchTransactions();
    }
  }, [connectedAddress, page]);

  const fetchTransactions = async () => {
    if (!connectedAddress) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/account-transactions/${connectedAddress}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.items || !Array.isArray(data.items)) {
        throw new Error('Invalid response format');
      }
      
      // Convert and set transactions
      const formattedTransactions = data.items.map(convertToTransaction);
      setTransactions(formattedTransactions);
      
      // Check if there are more pages
      setHasMorePages(data.items.length >= 20); // Assuming 20 items per page
      
    } catch (err) {
      console.error('Error fetching account transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const refreshTransactions = () => {
    setPage(1);
    fetchTransactions();
  };

  const loadMoreTransactions = () => {
    setPage(prev => prev + 1);
    setLoadingMore(true);
  };

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (compact) {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const formatHash = (hash: string, length = 8) => 
    hash ? `${hash.slice(0, length)}...${hash.slice(-length)}` : 'N/A';

  const getActionTypeInfo = (actionType: string) => {
    const type = actionType?.toLowerCase() || '';
    
    if (type.includes('mint')) {
      return {
        color: 'text-fuchsia-300',
        bgColor: 'bg-fuchsia-500/10',
        borderColor: 'border-fuchsia-500/20'
      };
    } else if (type.includes('license')) {
      return {
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20'
      };
    } else if (type.includes('register')) {
      return {
        color: 'text-pink-400',
        bgColor: 'bg-pink-500/10',
        borderColor: 'border-pink-500/20'
      };
    } else if (type.includes('attach')) {
      return {
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/20'
      };
    } else if (type.includes('transfer')) {
      return {
        color: 'text-violet-400',
        bgColor: 'bg-violet-500/10',
        borderColor: 'border-violet-500/20'
      };
    } else if (type.includes('dispute')) {
      return {
        color: 'text-rose-400',
        bgColor: 'bg-rose-500/10',
        borderColor: 'border-rose-500/20'
      };
    } 
    // Default fallback
    return {
      color: 'text-orange-300',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20'
    };
  };

  const getActionTypeIcon = (actionType: string) => {
    const type = actionType?.toLowerCase() || '';
    
    if (type.includes('mint')) {
      return "M12 6v6m0 0v6m0-6h6m-6 0H6";
    } else if (type.includes('register')) {
      return "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z";
    } else if (type.includes('license')) {
      return "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.243-6.243A6 6 0 0121 9z";
    } else if (type.includes('attach')) {
      return "M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13";
    } else if (type.includes('transfer')) {
      return "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4";
    } else if (type.includes('dispute')) {
      return "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
    }
    
    return "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
  };

  if (!connectedAddress) {
    return (
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/20 rounded-2xl p-6 text-center">
        <svg className="w-12 h-12 mx-auto text-zinc-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h3 className="text-white text-lg mb-2">Wallet Not Connected</h3>
        <p className="text-zinc-400">Connect your wallet to view your transactions</p>
      </div>
    );
  }

  return (
    <div ref={tableRef} className="relative flex flex-col bg-zinc-950/20 backdrop-blur-sm border border-zinc-800/25 rounded-xl overflow-hidden shadow-xl" style={{ height }}>
      {/* Header */}
      <div className="bg-zinc-950/25 border-b border-zinc-800/25 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-pink-500/10 rounded-lg p-2 border border-pink-500/20">
              <svg className="w-4 h-4 text-pink-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-neutral-100 font-medium text-sm">My Transactions</h3>
              <p className="text-neutral-500 text-xs">{formatHash(connectedAddress || '', 6)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-zinc-500/10 border border-zinc-500/20 rounded-lg px-2.5 py-1">
              <span className="text-xs font-medium text-neutral-100">
                {transactions.length} transactions
              </span>
            </div>
            <button 
              onClick={refreshTransactions}
              className="p-1.5 bg-zinc-800/30 hover:bg-zinc-800/60 rounded-lg transition-colors text-zinc-400 hover:text-zinc-300"
              disabled={loading}
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      {loading && transactions.length === 0 ? (
        <div className="flex items-center justify-center flex-1">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-8 h-8 border-2 border-zinc-800/50 border-t-purple-500/60 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-8 h-8 border-2 border-transparent border-r-pink-400/30 rounded-full animate-spin" style={{ animationDelay: '0.15s' }}></div>
            </div>
            <div className="text-center">
              <p className="text-neutral-200 font-medium text-xs">Loading Transactions</p>
              <p className="text-neutral-500 text-xs">Fetching your transaction history...</p>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center flex-1">
          <div className="text-center bg-zinc-950/20 border border-zinc-800/25 rounded-xl p-6 max-w-md mx-auto">
            <div className="bg-rose-500/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 border border-rose-500/20">
              <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-neutral-300 font-medium mb-2 text-xs">Error Loading Transactions</h3>
            <p className="text-neutral-500 text-xs mb-4">{error}</p>
            <button 
              onClick={refreshTransactions}
              className="bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex items-center justify-center flex-1">
          <div className="text-center bg-zinc-950/20 border border-zinc-800/25 rounded-xl p-6 max-w-md mx-auto">
            <div className="bg-purple-500/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 border border-purple-500/20">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-neutral-300 font-medium mb-2 text-xs">No Transactions Found</h3>
            <p className="text-neutral-500 text-xs">No transactions found for your wallet</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <table className="w-full">
              {/* Table Header */}
              <thead className="bg-zinc-900/70 backdrop-blur-sm border-b border-zinc-800/30 sticky top-0 z-10">
                <tr>
                  <th className={`text-left font-medium text-neutral-200 uppercase tracking-wider ${compact ? 'px-3 py-2.5 text-xs' : 'px-4 py-3 text-xs'}`}>
                    <div className="flex items-center space-x-1.5">
                      <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Action</span>
                    </div>
                  </th>
                  {!compact && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-200 uppercase tracking-wider">
                      <div className="flex items-center space-x-1.5">
                        <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 011-1h1m0 0V3a2 2 0 011-1h1" />
                        </svg>
                        <span>To</span>
                      </div>
                    </th>
                  )}
                  <th className={`text-left font-medium text-neutral-200 uppercase tracking-wider ${compact ? 'px-3 py-2.5 text-xs' : 'px-4 py-3 text-xs'}`}>
                    <div className="flex items-center space-x-1.5">
                      <svg className="w-3 h-3 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 011-1h1m0 0V3a2 2 0 011-1h1" />
                      </svg>
                      <span>Block</span>
                    </div>
                  </th>
                  <th className={`text-left font-medium text-neutral-200 uppercase tracking-wider ${compact ? 'px-3 py-2.5 text-xs' : 'px-4 py-3 text-xs'}`}>
                    <div className="flex items-center space-x-1.5">
                      <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Date</span>
                    </div>
                  </th>
                  <th className={`text-left font-medium text-neutral-200 uppercase tracking-wider ${compact ? 'px-3 py-2.5 text-xs' : 'px-4 py-3 text-xs'}`}>
                    <div className="flex items-center space-x-1.5">
                      <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Status</span>
                    </div>
                  </th>
                  <th className={`text-left font-medium text-neutral-200 uppercase tracking-wider ${compact ? 'px-3 py-2.5 text-xs' : 'px-4 py-3 text-xs'}`}>
                    <div className="flex items-center space-x-1.5">
                      <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Info</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/20">
                {transactions.map((transaction, index) => {
                  const actionInfo = getActionTypeInfo(transaction.actionType);
                  return (
                    <tr key={transaction.id} className="hover:bg-zinc-950/30 transition-all duration-200 group">
                      <td className={compact ? 'px-3 py-2.5' : 'px-4 py-3'}>
                        <div className="flex items-center space-x-2.5">
                          <div className={`${actionInfo.bgColor} ${actionInfo.borderColor} border rounded-md p-1.5`}>
                            <svg className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} ${actionInfo.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={getActionTypeIcon(transaction.actionType)} />
                            </svg>
                          </div>
                          <div>
                            <span className={`${compact ? 'text-xs' : 'text-xs'} font-medium ${actionInfo.color}`}>
                              {transaction.actionType || 'Unknown'}
                            </span>
                            <div className={`${compact ? 'text-xs' : 'text-xs'} text-neutral-500 font-mono mt-0.5`}>
                              {formatHash(transaction.txHash, compact ? 4 : 6)}
                            </div>
                          </div>
                        </div>
                      </td>
                      {!compact && (
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {formatHash(transaction.resourceId, 6)}
                          </span>
                        </td>
                      )}
                      <td className={compact ? 'px-3 py-2.5' : 'px-4 py-3'}>
                        <span className={`${compact ? 'text-xs' : 'text-xs'} text-neutral-300 font-mono px-2 py-1`}>
                          {transaction.blockNumber}
                        </span>
                      </td>
                      <td className={compact ? 'px-3 py-2.5' : 'px-4 py-3'}>
                        <span className={`${compact ? 'text-xs' : 'text-xs'} text-neutral-400`}>
                          {formatDate(transaction.createdAt)}
                        </span>
                      </td>
                      <td className={compact ? 'px-3 py-2.5' : 'px-4 py-3'}>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                          transaction.has_error ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
                        }`}>
                              {transaction.has_error ? 'Failed' : (transaction.result || 'Success')}
                        </span>
                      </td>
                      <td className={compact ? 'px-3 py-2.5' : 'px-4 py-3'}>
                        <button
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setIsModalOpen(true);
                          }}
                          className="group-hover:scale-105 transition-transform duration-200 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 p-1.5 rounded-md"
                        >
                          <svg className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-blue-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Load More Button */}
      {transactions.length > 0 && hasMorePages && (
        <div className="flex justify-center p-4 border-t border-zinc-800/20">
          <button
            onClick={loadMoreTransactions}
            disabled={loadingMore}
            className="px-4 py-2 bg-neutral-500/10 hover:bg-neutral-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-purple-300 hover:text-purple-200 rounded-lg transition-all duration-200 border border-purple-500/20 hover:border-purple-500/30 disabled:hover:border-purple-500/20 font-medium text-xs"
          >
            {loadingMore ? (
              <div className="flex items-center space-x-1.5">
                <div className="w-3 h-3 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5">
                <span>Load More</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            )}
          </button>
        </div>
      )}

      {/* Transaction Info Modal */}
      {selectedTransaction && (
        <TransactionInfoModal
          transaction={selectedTransaction}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          tableHeight={tableRef.current?.clientHeight || height}
        />
      )}
    </div>
  );
};
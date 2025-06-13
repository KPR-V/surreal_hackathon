"use client";

import React, { useState, useEffect, forwardRef } from 'react';
import { TransactionInfoModal } from './transactionInfo';
import { StoryAPIService } from '../my-account/apiService';
import { Transaction } from '../my-account/types';

interface TransactionTableProps {
  userAddress?: string;
  compact?: boolean;
  height?: number;
}

export const TransactionTable = React.forwardRef<{ refresh: () => void }, TransactionTableProps>(
  ({ compact = false, height = 400 }, ref) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pagination, setPagination] = useState<{ 
    hasNext: boolean; 
    hasPrevious: boolean;
    next?: string;
    previous?: string;
    currentPage: number;
  }>({
    hasNext: false,
    hasPrevious: false,
    currentPage: 1
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async (cursor?: string, direction: 'next' | 'previous' | 'initial' = 'initial') => {
    try {
      if (direction === 'next' || direction === 'previous') {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const limit = compact ? 15 : 25;
      const paginationOptions = cursor 
        ? direction === 'next' 
          ? { after: cursor, limit }
          : { before: cursor, limit }
        : { limit };

      const result = await StoryAPIService.fetchTransactions({}, 'all', paginationOptions);
      
      setTransactions(result.data || []);
      
      setPagination({
        hasNext: result.hasNext,
        hasPrevious: result.hasPrevious,
        next: result.next,
        previous: result.previous,
        currentPage: direction === 'next' ? pagination.currentPage + 1 : 
                    direction === 'previous' ? pagination.currentPage - 1 : 1
      });
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const goToNextPage = () => {
    if (pagination.next && !loadingMore) {
      fetchTransactions(pagination.next, 'next');
    }
  };

  const goToPreviousPage = () => {
    if (pagination.previous && !loadingMore) {
      fetchTransactions(pagination.previous, 'previous');
    }
  };

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(parseInt(timestamp) * 1000);
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
    switch (type) {
      case 'register':
      case 'registration':
        return {
          color: 'text-pink-400',
          bgColor: 'bg-pink-500/10',
          borderColor: 'border-pink-500/20'
        };
      case 'license':
      case 'licensing':
        return {
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20'
        };
      case 'attach':
      case 'attachment':
        return {
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/10',
          borderColor: 'border-purple-500/20'
        };
      case 'transfer':
        return {
          color: 'text-violet-400',
          bgColor: 'bg-violet-500/10',
          borderColor: 'border-violet-500/20'
        };
      case 'dispute':
        return {
          color: 'text-rose-400',
          bgColor: 'bg-rose-500/10',
          borderColor: 'border-rose-500/20'
        };
      default:
        return {
          color: 'text-purple-300',
          bgColor: 'bg-purple-500/10',
          borderColor: 'border-purple-500/20'
        };
    }
  };

  const getActionTypeIcon = (actionType: string) => {
    const icons: Record<string, string> = {
      register: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      registration: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      license: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.243-6.243A6 6 0 0121 9z",
      licensing: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.243-6.243A6 6 0 0121 9z",
      attach: "M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13",
      attachment: "M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13",
      transfer: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
      dispute: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    };
    
    const key = actionType?.toLowerCase() || '';
    return icons[key] || "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-8 h-8 border-2 border-zinc-800/50 border-t-purple-500/60 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-8 h-8 border-2 border-transparent border-r-pink-400/30 rounded-full animate-spin" style={{ animationDelay: '0.15s' }}></div>
          </div>
          <div className="text-center">
            <p className="text-neutral-200 font-medium text-xs">Loading Transactions</p>
            <p className="text-neutral-500 text-xs">Fetching network activity...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col bg-zinc-950/20 backdrop-blur-sm border border-zinc-800/25 rounded-xl overflow-hidden shadow-xl" style={{ height }}>
      {/* Ultra-Minimalist Header */}
      <div className="bg-zinc-950/25 border-b border-zinc-800/25 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-pink-500/10 rounded-lg p-2 border border-pink-500/20">
              <svg className="w-4 h-4 text-pink-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h3 className="text-neutral-100 font-medium text-sm">Network Transactions</h3>
              <p className="text-neutral-500 text-xs">Real-time blockchain activity</p>
            </div>
          </div>
          <div className="bg-zinc-500/10 border border-zinc-500/20 rounded-lg px-2.5 py-1">
            <span className="text-xs font-medium text-neutral-100">
              {transactions.length} transactions
            </span>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      {transactions.length === 0 ? (
        <div className="flex items-center justify-center flex-1">
          <div className="text-center bg-zinc-950/20 border border-zinc-800/25 rounded-xl p-6 max-w-md mx-auto">
            <div className="bg-purple-500/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 border border-purple-500/20">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-neutral-300 font-medium mb-2 text-xs">No Transactions Found</h3>
            <p className="text-neutral-500 text-xs">Transaction data will appear here when available</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              <table className="w-full">
                {/* Refined Table Header */}
                <thead className="bg-zinc-950/30 border-b border-zinc-800/20 sticky top-0 z-10">
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
                          <span>Resource</span>
                        </div>
                      </th>
                    )}
                    <th className={`text-left font-medium text-neutral-200 uppercase tracking-wider ${compact ? 'px-3 py-2.5 text-xs' : 'px-4 py-3 text-xs'}`}>
                      <div className="flex items-center space-x-1.5">
                        <svg className="w-3 h-3 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{compact ? 'From' : 'Initiator'}</span>
                      </div>
                    </th>
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
                              {transaction.resourceType || 'N/A'}
                            </span>
                          </td>
                        )}
                        <td className={compact ? 'px-3 py-2.5' : 'px-4 py-3'}>
                          <span className={`${compact ? 'text-xs' : 'text-xs'} text-neutral-400 font-mono px-2 py-1`}>
                            {formatHash(transaction.initiator, compact ? 4 : 6)}
                          </span>
                        </td>
                        <td className={compact ? 'px-3 py-2.5' : 'px-4 py-3'}>
                          <span className={`${compact ? 'text-xs' : 'text-xs'} text-neutral-300 font-mono px-2 py-1`}>
                            {transaction.blockNumber}
                          </span>
                        </td>
                        <td className={compact ? 'px-3 py-2.5' : 'px-4 py-3'}>
                          <span className={`${compact ? 'text-xs' : 'text-xs'} text-neutral-400`}>
                            {formatDate(transaction.blockTimestamp)}
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
          
          {/* Refined Pagination Controls */}
          <div className={`flex justify-center items-center space-x-3 bg-zinc-950/25 backdrop-blur-sm border-t border-zinc-800/20 ${compact ? 'p-2.5' : 'p-3'}`}>
            <button
              onClick={goToPreviousPage}
              disabled={!pagination.hasPrevious || loadingMore}
              className={`${compact ? 'px-3 py-1.5 text-xs' : 'px-3 py-2 text-xs'} bg-zinc-500/10 hover:bg-zinc-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-300 hover:text-neutral-200 rounded-lg transition-all duration-200 border border-zinc-500/20 hover:border-zinc-500/30 disabled:hover:-neutral-500/20 font-medium`}
            >
              <div className="flex items-center space-x-1.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Previous</span>
              </div>
            </button>
            
            <div className="bg-neutral-500/10 border border-zinc-500/20 rounded-lg px-3 py-1.5">
              <span className={`${compact ? 'text-xs' : 'text-xs'} font-medium text-neutral-400`}>
                Page {pagination.currentPage}
              </span>
            </div>
            
            <button
              onClick={goToNextPage}
              disabled={!pagination.hasNext || loadingMore}
              className={`${compact ? 'px-3 py-1.5 text-xs' : 'px-3 py-2 text-xs'} bg-neutral-500/10 hover:bg-neutral-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-purple-300 hover:text-purple-200 rounded-lg transition-all duration-200 border border-purple-500/20 hover:border-purple-500/30 disabled:hover:border-purple-500/20 font-medium`}
            >
              {loadingMore ? (
                <div className="flex items-center space-x-1.5">
                  <div className={`${compact ? 'w-3 h-3' : 'w-3 h-3'} border-2 border-neutral-400 border-t-transparent rounded-full animate-spin`}></div>
                  <span>Loading...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5">
                  <span>Next</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </button>
          </div>
        </>
      )}

      {selectedTransaction && (
        <TransactionInfoModal
          transaction={selectedTransaction}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          tableHeight={height}
        />
      )}
    </div>
  );
});
"use client";

import React, { useState, useEffect } from 'react';
import { TransactionInfoModal } from './transactionInfo';
import { StoryAPIService } from './apiService';
import { Transaction } from './types';

interface TransactionTableProps {
  userAddress?: string;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({ userAddress }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewMode, setViewMode] = useState<'latest' | 'all'>('latest');
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
  }, [viewMode]);

  const fetchTransactions = async (cursor?: string, direction: 'next' | 'previous' | 'initial' = 'initial') => {
    try {
      if (direction === 'next') {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const paginationOptions = cursor 
        ? direction === 'next' 
          ? { after: cursor, limit: 20 }
          : { before: cursor, limit: 20 }
        : { limit: 20 };

      const result = await StoryAPIService.fetchTransactions({}, viewMode, paginationOptions);
      
      // Replace data instead of accumulating
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
      return new Date(parseInt(timestamp) * 1000).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const formatHash = (hash: string, length = 8) => 
    hash ? `${hash.slice(0, length)}...${hash.slice(-length)}` : 'N/A';

  const getActionTypeColor = (actionType: string) => {
    const colors: Record<string, string> = {
      register: 'text-green-400',
      registration: 'text-green-400',
      license: 'text-blue-400',
      licensing: 'text-blue-400',
      attach: 'text-purple-400',
      attachment: 'text-purple-400',
      transfer: 'text-orange-400',
      dispute: 'text-red-400'
    };
    
    const key = actionType?.toLowerCase() || '';
    return colors[key] || 'text-zinc-300';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/20 rounded-2xl p-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              setViewMode('latest');
              setPagination(prev => ({ ...prev, currentPage: 1 }));
            }}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${
              viewMode === 'latest'
                ? 'bg-green-500/20 text-green-300 border border-green-500/20'
                : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50'
            }`}
          >
            Latest Transactions
          </button>
          
          <button 
            onClick={() => {
              setViewMode('all');
              setPagination(prev => ({ ...prev, currentPage: 1 }));
            }}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${
              viewMode === 'all'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/20'
                : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50'
            }`}
          >
            All Transactions
          </button>

          <div className="ml-auto text-sm text-zinc-500">
            Page {pagination.currentPage} • {transactions.length} transactions
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      {transactions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-zinc-400">No transactions found</p>
        </div>
      ) : (
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/20 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800/20">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">Action</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">Resource</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">Initiator</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">Block</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-700/20">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`text-sm font-medium ${getActionTypeColor(transaction.actionType)}`}>
                          {transaction.actionType || 'Unknown'}
                        </span>
                        <span className="text-xs text-zinc-500 font-mono">
                          {formatHash(transaction.txHash, 6)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-cyan-400">
                        {transaction.resourceType || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-orange-400 font-mono">
                        {formatHash(transaction.initiator, 6)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-zinc-400 font-mono">
                        {transaction.blockNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-zinc-400">
                        {formatDate(transaction.blockTimestamp)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setIsModalOpen(true);
                        }}
                        className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          <div className="flex justify-center items-center space-x-4 p-4 border-t border-zinc-700/20">
            <button
              onClick={goToPreviousPage}
              disabled={!pagination.hasPrevious || loadingMore}
              className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-300 hover:text-white rounded-lg transition-all duration-200 border border-zinc-700/20"
            >
              Previous Page
            </button>
            
            <span className="text-sm text-zinc-400">
              Page {pagination.currentPage}
            </span>
            
            <button
              onClick={goToNextPage}
              disabled={!pagination.hasNext || loadingMore}
              className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-300 hover:text-white rounded-lg transition-all duration-200 border border-zinc-700/20"
            >
              {loadingMore ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </div>
              ) : (
                'Next Page'
              )}
            </button>
          </div>
        </div>
      )}

      {selectedTransaction && (
        <TransactionInfoModal
          transaction={selectedTransaction}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};
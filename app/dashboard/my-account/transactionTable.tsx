"use client";

import React, { useState, useEffect } from 'react';
import { TransactionInfoModal } from './transactionInfo';

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

interface TransactionTableProps {
  userAddress?: string;
}

// Transaction API Service
class TransactionAPIService {
  private static readonly API_BASE_URL = 'https://api.storyapis.com/api/v3';
  private static readonly API_KEY = process.env.NEXT_PUBLIC_STORY_API_KEY || 'MhBsxkU1z9fG6TofE59KqiiWV-YlYE8Q4awlLQehF3U';
  private static readonly CHAIN = 'story-aeneid';

  // Fetch all transactions
  static async fetchAllTransactions(limit: number = 50): Promise<{ data: Transaction[], hasNextPage: boolean }> {
    try {
      const options = {
        method: 'POST',
        headers: {
          'X-Api-Key': this.API_KEY,
          'X-Chain': this.CHAIN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          options: {
            pagination: { limit }
          }
        })
      };

      const response = await fetch(`${this.API_BASE_URL}/transactions`, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('All transactions error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      
      const data = await response.json();
      return {
        data: data.data || [],
        hasNextPage: data.hasNextPage || false
      };
    } catch (error) {
      console.error('Error fetching all transactions:', error);
      throw error;
    }
  }

  // Fetch latest transactions
  static async fetchLatestTransactions(limit: number = 20): Promise<{ data: Transaction[], hasNextPage: boolean }> {
    try {
      const options = {
        method: 'POST',
        headers: {
          'X-Api-Key': this.API_KEY,
          'X-Chain': this.CHAIN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          options: {
            pagination: { limit }
          }
        })
      };

      const response = await fetch(`${this.API_BASE_URL}/transactions/latest`, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Latest transactions error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      
      const data = await response.json();
      return {
        data: data.data || [],
        hasNextPage: data.hasNextPage || false
      };
    } catch (error) {
      console.error('Error fetching latest transactions:', error);
      throw error;
    }
  }

  // Fetch user transactions - Updated to filter client-side
  static async fetchUserTransactions(userAddress: string, limit: number = 50): Promise<{ data: Transaction[], hasNextPage: boolean }> {
    try {
      // First, try to get all transactions and filter client-side
      const allTransactions = await this.fetchAllTransactions(100); // Get more to filter from
      console.log('All transactions fetched:', allTransactions.data.length);
      
      // Filter by initiator on client side
      const userTransactions = allTransactions.data.filter(transaction => 
        transaction.initiator && transaction.initiator.toLowerCase() === userAddress.toLowerCase()
      );
      
      console.log('User transactions after filtering:', userTransactions.length);
      return {
        data: userTransactions.slice(0, limit), // Limit the results
        hasNextPage: userTransactions.length > limit
      };
      
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      // If that fails, try a direct API call with simple structure
      try {
        const options = {
          method: 'POST',
          headers: {
            'X-Api-Key': this.API_KEY,
            'X-Chain': this.CHAIN,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            options: {
              pagination: { limit }
            }
          })
        };

        const response = await fetch(`${this.API_BASE_URL}/transactions`, options);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('User transactions error response:', errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Filter client-side as fallback
        const filteredData = (data.data || []).filter((transaction: Transaction) => 
          transaction.initiator && transaction.initiator.toLowerCase() === userAddress.toLowerCase()
        );
        
        return {
          data: filteredData,
          hasNextPage: data.hasNextPage || false
        };
      } catch (secondError) {
        console.error('Second attempt also failed:', secondError);
        throw secondError;
      }
    }
  }

  // Fetch single transaction details
  static async fetchTransactionDetails(txId: string): Promise<Transaction | null> {
    try {
      const options = {
        method: 'GET',
        headers: {
          'X-Api-Key': this.API_KEY,
          'X-Chain': this.CHAIN
        }
      };

      const response = await fetch(`${this.API_BASE_URL}/transactions/${txId}`, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data?.[0] || null;
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      throw error;
    }
  }
}

export const TransactionTable: React.FC<TransactionTableProps> = ({ userAddress }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'user' | 'latest' | 'all'>('latest'); // Start with latest instead of user
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const testAddress = "0x34a817D5723A289E125b35aAac7e763b6097d38d";

  useEffect(() => {
    fetchTransactions();
  }, [viewMode]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`Fetching ${viewMode} transactions...`);

      let result;
      switch (viewMode) {
        case 'user':
          result = await TransactionAPIService.fetchUserTransactions(testAddress);
          break;
        case 'latest':
          result = await TransactionAPIService.fetchLatestTransactions();
          break;
        case 'all':
          result = await TransactionAPIService.fetchAllTransactions();
          break;
        default:
          result = await TransactionAPIService.fetchLatestTransactions();
      }

      setTransactions(result.data);
      console.log(`${viewMode} transactions fetched:`, result.data.length);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(`Failed to load ${viewMode} transactions. ${err instanceof Error ? err.message : 'Please try again.'}`);
      
      // If user transactions fail, automatically switch to latest
      if (viewMode === 'user') {
        console.log('User transactions failed, switching to latest transactions...');
        setViewMode('latest');
      }
    } finally {
      setLoading(false);
    }
  };

  const openModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
  };

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(parseInt(timestamp) * 1000);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const formatHash = (hash: string, length: number = 8) => {
    if (!hash) return 'N/A';
    return `${hash.slice(0, length)}...${hash.slice(-length)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getActionTypeColor = (actionType: string) => {
    switch (actionType.toLowerCase()) {
      case 'register':
      case 'registration':
        return 'text-green-400';
      case 'license':
      case 'licensing':
        return 'text-blue-400';
      case 'attach':
      case 'attachment':
        return 'text-purple-400';
      case 'transfer':
        return 'text-orange-400';
      case 'dispute':
        return 'text-red-400';
      default:
        return 'text-zinc-300';
    }
  };

  const getResourceTypeColor = (resourceType: string) => {
    switch (resourceType.toLowerCase()) {
      case 'ipasset':
      case 'ip_asset':
        return 'text-cyan-400';
      case 'license':
        return 'text-indigo-400';
      case 'policy':
        return 'text-pink-400';
      default:
        return 'text-zinc-400';
    }
  };

  if (loading) {
    return (
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/20 rounded-2xl overflow-hidden">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-zinc-700/50 rounded w-1/4"></div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex space-x-4">
                <div className="h-4 bg-zinc-700/50 rounded flex-1"></div>
                <div className="h-4 bg-zinc-700/50 rounded w-20"></div>
                <div className="h-4 bg-zinc-700/50 rounded w-24"></div>
                <div className="h-4 bg-zinc-700/50 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-red-400 mb-2">Error Loading Transactions</h3>
        <p className="text-red-300 text-sm mb-4">{error}</p>
        <div className="flex justify-center space-x-2">
          <button 
            onClick={fetchTransactions}
            className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all duration-200"
          >
            Retry
          </button>
          {viewMode !== 'latest' && (
            <button 
              onClick={() => setViewMode('latest')}
              className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-all duration-200"
            >
              Try Latest
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/20 rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={() => setViewMode('latest')}
            className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
              viewMode === 'latest'
                ? 'bg-green-500/20 text-green-300 border border-green-500/20'
                : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50'
            }`}
          >
            Latest Transactions
          </button>

          <button 
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
              viewMode === 'all'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/20'
                : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50'
            }`}
          >
            All Transactions
          </button>

          <button 
            onClick={() => setViewMode('user')}
            className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
              viewMode === 'user'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/20'
                : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50'
            }`}
          >
            My Transactions ({testAddress.slice(0, 6)}...)
          </button>

          <div className="ml-auto text-sm text-zinc-500">
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} found
          </div>
        </div>
        
        {viewMode === 'user' && (
          <div className="mt-2 text-xs text-zinc-600">
            Showing transactions where initiator matches {testAddress}
          </div>
        )}
      </div>

      {/* Transaction Table */}
      {transactions.length === 0 ? (
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/20 rounded-2xl p-16 text-center">
          <div className="w-12 h-12 mx-auto mb-8 bg-zinc-500/10 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-light text-white mb-4">No Transactions Found</h3>
          <p className="text-zinc-500 text-sm mb-4">
            {viewMode === 'user' 
              ? `No transactions found for the test address.`
              : `No ${viewMode} transactions available.`}
          </p>
          {viewMode === 'user' && (
            <button 
              onClick={() => setViewMode('latest')}
              className="px-6 py-3 bg-gradient-to-r from-green-500/20 to-blue-600/20 text-green-300 rounded-xl hover:from-green-500/30 hover:to-blue-600/30 transition-all duration-300 border border-green-500/20 text-sm"
            >
              View Latest Transactions Instead
            </button>
          )}
        </div>
      ) : (
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/20 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800/20">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Resource</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Initiator</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Block</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-700/20">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-zinc-800/20 transition-colors duration-200">
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
                      <div className="flex flex-col">
                        <span className={`text-sm ${getResourceTypeColor(transaction.resourceType)}`}>
                          {transaction.resourceType || 'N/A'}
                        </span>
                        {transaction.ipId && (
                          <button 
                            onClick={() => copyToClipboard(transaction.ipId)}
                            className="text-xs text-zinc-500 hover:text-zinc-400 font-mono transition-colors text-left"
                            title="Click to copy IP ID"
                          >
                            {formatHash(transaction.ipId, 4)}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => copyToClipboard(transaction.initiator)}
                        className="text-sm text-orange-400 hover:text-orange-300 font-mono transition-colors"
                        title="Click to copy"
                      >
                        {formatHash(transaction.initiator, 6)}
                      </button>
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
                        onClick={() => openModal(transaction)}
                        className="p-2 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-lg transition-all duration-200 group"
                        title="View Details"
                      >
                        <svg className="w-4 h-4 text-zinc-400 group-hover:text-blue-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 011 2zm0 7a1 1 0 110-2 1 1 0 011 2zm0 7a1 1 0 110-2 1 1 0 011 2z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <TransactionInfoModal
          transaction={selectedTransaction}
          isOpen={isModalOpen}
          onClose={closeModal}
        />
      )}
    </div>
  );
};
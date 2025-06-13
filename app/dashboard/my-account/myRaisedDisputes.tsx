"use client";

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { DisputeDetailsModal } from './disputedetailsmodal';

// Define interface for dispute data
interface DisputeData {
  id: number;
  targetIpId: string;
  targetTag: string;
  currentTag: string;
  arbitrationPolicy: string;
  evidenceHash: string;
  initiator: string;
  data: string;
  blockNumber: number;
  blockTimestamp: number;
  disputeTimestamp: number;
  transactionHash: string;
  deletedAt: null | string;
  logIndex: number;
  status: string;
  umaLink: string;
  counterEvidenceHash: string;
  liveness: null | number;
}

interface DisputesResponse {
  data: DisputeData[];
}

// Helper function to format timestamps
const formatDate = (timestamp: number): string => {
  if (!timestamp) return 'N/A';
  
  const date = new Date(timestamp * 1000); // Convert from seconds to milliseconds
  return date.toLocaleString();
};

// Helper function to truncate long strings
const truncateString = (str: string, length: number = 6): string => {
  if (!str) return 'N/A';
  return str.length > 12
    ? `${str.substring(0, length)}...${str.substring(str.length - 4)}`
    : str;
};

// Helper function to decode target tag (hex to ASCII)
const decodeTag = (hexTag: string): string => {
  try {
    if (!hexTag || hexTag === '') return 'None';
    
    // Remove '0x' prefix if present
    const cleanHex = hexTag.startsWith('0x') ? hexTag.slice(2) : hexTag;
    
    // Convert hex to bytes, then to ASCII
    let result = '';
    for (let i = 0; i < cleanHex.length; i += 2) {
      const byte = parseInt(cleanHex.substr(i, 2), 16);
      // Only include printable ASCII characters
      if (byte > 0 && byte < 127) {
        result += String.fromCharCode(byte);
      }
    }
    
    // Clean up null bytes and trim
    return result.replace(/\u0000/g, '').trim();
    
  } catch (error) {
    console.error('Error decoding tag:', error);
    return 'Invalid tag';
  }
};

// Helper function to get status badge styling
const getStatusBadgeStyle = (status: string) => {
  switch (status.toLowerCase()) {
    case 'raised':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'resolved':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'dismissed':
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    case 'expired':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'active':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    default:
      return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
  }
};

// Function to fetch disputes for a wallet
const fetchDisputesForWallet = async (walletAddress: string, setDisputes: React.Dispatch<React.SetStateAction<DisputeData[]>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, setError: React.Dispatch<React.SetStateAction<string | null>>) => {
  if (!walletAddress) return;
  
  setLoading(true);
  setError(null);
  
  try {
    console.log('Fetching disputes for wallet:', walletAddress);
    
    const response = await fetch('/api/disputes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        address: walletAddress.toLowerCase() // Send wallet address to filter by initiator
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API response error:', response.status, errorText);
      throw new Error(`Failed to fetch dispute data: ${response.status} ${response.statusText}`);
    }
    
    const responseData: DisputesResponse = await response.json();
    console.log('Received disputes data:', responseData);
    
    if (responseData.data && Array.isArray(responseData.data)) {
      // Filter to ensure we only show disputes where this wallet is the initiator
      const filteredDisputes = responseData.data.filter(dispute => 
        dispute.initiator.toLowerCase() === walletAddress.toLowerCase()
      );
      
      setDisputes(filteredDisputes);
      console.log(`Found ${filteredDisputes.length} disputes initiated by this wallet`);
    } else {
      console.warn('Unexpected response format from disputes API:', responseData);
      setDisputes([]);
    }
  } catch (err) {
    console.error('Error fetching disputes:', err);
    setError(err instanceof Error ? err.message : 'Failed to fetch dispute data');
    setDisputes([]);
  } finally {
    setLoading(false);
  }
};

export const MyRaisedDisputes: React.FC = () => {
  const { address: walletAddress } = useAccount();
  const [disputes, setDisputes] = useState<DisputeData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDisputeId, setSelectedDisputeId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      fetchDisputesForWallet(walletAddress, setDisputes, setLoading, setError);
    }
  }, [walletAddress]);

  const handleViewDetails = (disputeId: number) => {
    setSelectedDisputeId(disputeId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDisputeId(null);
  };

  if (!walletAddress) {
    return (
      <div className="text-center py-12">
        <div className="bg-zinc-800/30 rounded-xl p-8 max-w-lg mx-auto">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-500/20 to-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-gray-400 mb-2 text-lg">Wallet Not Connected</p>
          <p className="text-gray-500 text-sm">Please connect your wallet to view your raised disputes</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-zinc-400">Loading your disputes...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center bg-zinc-900/40 border border-zinc-700/20 rounded-xl p-6 max-w-md backdrop-blur-sm">
          <div className="bg-red-500/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 border border-red-500/20">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-zinc-300 font-medium mb-2 text-sm">Error Loading Disputes</h3>
          <p className="text-zinc-500 text-xs mb-4">{error}</p>
          <button 
            onClick={() => fetchDisputesForWallet(walletAddress, setDisputes, setLoading, setError)}
            className="bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* About Disputes Section - Moved above table */}
      <div className="bg-gradient-to-r from-zinc-900/60 via-zinc-800/40 to-zinc-900/60 rounded-xl p-5 backdrop-blur-sm border border-zinc-700/10">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center border border-blue-500/20">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white">About Disputes</h3>
        </div>
        
        <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
          Disputes allow you to challenge IP assets that may violate protocol rules or infringe on existing rights. 
          Each dispute is reviewed by decentralized oracles to ensure fair resolution.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-zinc-800/40 rounded-lg p-3 border border-zinc-700/20">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-xs font-medium text-yellow-400">Raised</span>
            </div>
            <p className="text-xs text-zinc-500">Submitted and pending review</p>
          </div>
          
          <div className="bg-zinc-800/40 rounded-lg p-3 border border-zinc-700/20">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-xs font-medium text-blue-400">Active</span>
            </div>
            <p className="text-xs text-zinc-500">Under oracle review</p>
          </div>
          
          <div className="bg-zinc-800/40 rounded-lg p-3 border border-zinc-700/20">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-xs font-medium text-green-400">Resolved</span>
            </div>
            <p className="text-xs text-zinc-500">Decision finalized</p>
          </div>
          
          <div className="bg-zinc-800/40 rounded-lg p-3 border border-zinc-700/20">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-xs font-medium text-gray-400">Dismissed</span>
            </div>
            <p className="text-xs text-zinc-500">Rejected or withdrawn</p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-light text-white">My Raised Disputes</h2>
          <div className="text-sm text-zinc-400">
            {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'No wallet connected'}
          </div>
          <div className="text-sm text-zinc-400">
            {disputes.length} {disputes.length === 1 ? 'dispute' : 'disputes'} found
          </div>
        </div>
        
        <button
          onClick={() => fetchDisputesForWallet(walletAddress, setDisputes, setLoading, setError)}
          disabled={loading}
          className="p-2 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-all duration-200 disabled:opacity-50"
          title="Refresh disputes"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Disputes Table */}
      {disputes.length === 0 ? (
        <div className="text-center py-12 bg-zinc-800/30 rounded-xl">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-400 mb-2">No Disputes Found</p>
          <p className="text-gray-500 text-sm">
            You haven&apos;t initiated any disputes with this wallet
          </p>
        </div>
      ) : (
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/20 rounded-2xl overflow-hidden hover:border-zinc-600/30 transition-all duration-300 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-400 uppercase bg-zinc-800/50">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Target IP</th>
                  <th className="px-4 py-3">Target Tag</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {disputes.map((dispute) => (
                  <tr key={dispute.id} className="border-t border-zinc-700/20 hover:bg-zinc-800/20">
                    <td className="px-4 py-3 font-medium text-white">
                      {dispute.id}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs inline-block ${getStatusBadgeStyle(dispute.status)} border`}>
                        {dispute.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      <a 
                        href={`/dashboard/ip/${dispute.targetIpId}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                      >
                        {truncateString(dispute.targetIpId, 6)}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      <span title={dispute.targetTag}>
                        {decodeTag(dispute.targetTag) || 'None'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {formatDate(dispute.disputeTimestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleViewDetails(dispute.id)}
                        className="p-2 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                        title="View details"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
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

      {/* Dispute Details Modal */}
      {selectedDisputeId && (
        <DisputeDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          disputeId={selectedDisputeId}
        />
      )}
    </div>
  );
};
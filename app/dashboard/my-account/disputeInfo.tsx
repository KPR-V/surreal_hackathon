"use client";

import React, { useState, useEffect } from 'react';
import { DisputeInfo, Dispute } from './types';
import { getIPDisputes } from './ipEdgesService'; // Import the function with dummy data
import { DisputeAssertionModal } from './disputeAssertion';

interface DisputeInfoProps {
  ipId: string;
}

export const DisputeInfoComponent: React.FC<DisputeInfoProps> = ({ ipId }) => {
  const [loading, setLoading] = useState(true);
  const [disputeData, setDisputeData] = useState<DisputeInfo>({
    hasDisputes: false,
    activeDisputes: [],
    resolvedDisputes: [],
    totalDisputes: 0,
    isInitiator: false,
    isTarget: false
  });
  const [allDisputes, setAllDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);

  useEffect(() => {
    fetchDisputeInfo();
  }, [ipId]);

  const fetchDisputeInfo = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching real-time dispute data for IP:', ipId);
      
      // Use the updated getIPDisputes function with real API
      const disputeInfo = await getIPDisputes(ipId);
      
      console.log('Dispute info received:', disputeInfo);
      
      setDisputeData(disputeInfo);
      
      // Combine all disputes for the table - include ALL disputes regardless of status
      const allCurrentDisputes = [
        ...disputeInfo.activeDisputes,
        ...disputeInfo.resolvedDisputes
      ];
      setAllDisputes(allCurrentDisputes);
      
      // Log dispute details for debugging
      if (allCurrentDisputes.length > 0) {
        console.log('Found disputes:', allCurrentDisputes.map(d => ({
          id: d.id,
          status: d.status,
          initiator: d.initiator,
          targetIpId: d.targetIpId
        })));
      } else {
        console.log('No disputes found for this IP asset');
      }
      
    } catch (error) {
      console.error('Error fetching dispute info:', error);
      // Set empty state on error
      setDisputeData({
        hasDisputes: false,
        activeDisputes: [],
        resolvedDisputes: [],
        totalDisputes: 0,
        isInitiator: false,
        isTarget: false
      });
      setAllDisputes([]);
    } finally {
      setLoading(false);
    }
  };

  const truncateHash = (hash: string, length = 8) => {
    return `${hash.slice(0, length)}...${hash.slice(-length)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatTimestamp = (timestamp: number) => {
    try {
      return new Date(timestamp * 1000).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'pending':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'resolved':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'dismissed':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'disputed':
        return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      default:
        return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
    }
  };

  const canChallengeDispute = (dispute: Dispute) => {
    // Only allow challenging if:
    // 1. This IP is the target of the dispute
    // 2. The dispute status is 'active' or 'pending'
    // 3. No counter evidence has been submitted yet
    return dispute.targetIpId === ipId && 
           (dispute.status.toLowerCase() === 'active' || dispute.status.toLowerCase() === 'pending') &&
           !dispute.counterEvidenceHash;
  };

  const handleChallengeDispute = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setIsChallengeModalOpen(true);
  };

  const handleDisputeAssertion = (data: any) => {
    console.log('Disputing assertion:', data);
    // TODO: Call disputeAssertion function
    
    // Refresh the dispute data after submission
    fetchDisputeInfo();
  };

  const getDisputeActionButton = (dispute: Dispute) => {
    if (canChallengeDispute(dispute)) {
      return (
        <button
          onClick={() => handleChallengeDispute(dispute)}
          className="px-3 py-1.5 bg-gradient-to-r from-red-500/20 to-orange-500/20 hover:from-red-500/30 hover:to-orange-500/30 text-red-400 hover:text-red-300 border border-red-500/30 rounded text-xs font-medium transition-all duration-200 w-full"
        >
          Challenge
        </button>
      );
    }

    // Show appropriate status for non-challengeable disputes
    if (dispute.counterEvidenceHash) {
      return (
        <div className="text-center">
          <span className="text-xs text-cyan-400 block">Challenged</span>
          <span className="text-xs text-zinc-500">Counter evidence submitted</span>
        </div>
      );
    }

    if (dispute.status.toLowerCase() === 'resolved') {
      return (
        <span className="text-xs text-green-400 block text-center">Resolved</span>
      );
    }

    if (dispute.status.toLowerCase() === 'dismissed') {
      return (
        <span className="text-xs text-yellow-400 block text-center">Dismissed</span>
      );
    }

    if (dispute.status.toLowerCase() === 'disputed') {
      return (
        <span className="text-xs text-orange-400 block text-center">Under Review</span>
      );
    }

    // For any other inactive status
    return (
      <span className="text-xs text-zinc-500 block text-center">—</span>
    );
  };

  if (loading) {
    return (
      <div className="bg-zinc-800/30 rounded-xl p-6">
        <div className="flex items-center justify-center h-32">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-zinc-400">Loading dispute information...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Dispute Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-800/30 rounded-xl p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Total Disputes</p>
            <p className="text-2xl font-bold text-blue-400">{disputeData.totalDisputes}</p>
          </div>
          <div className="bg-zinc-800/30 rounded-xl p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Active Disputes</p>
            <p className="text-2xl font-bold text-red-400">{disputeData.activeDisputes.length}</p>
          </div>
          <div className="bg-zinc-800/30 rounded-xl p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Resolved</p>
            <p className="text-2xl font-bold text-green-400">{disputeData.resolvedDisputes.length}</p>
          </div>
          <div className="bg-zinc-800/30 rounded-xl p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Status</p>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                disputeData.activeDisputes.length > 0 
                  ? 'bg-red-400' 
                  : disputeData.hasDisputes 
                    ? 'bg-yellow-400' 
                    : 'bg-green-400'
              }`}></div>
              <p className="text-sm font-medium text-white">
                {disputeData.activeDisputes.length > 0 
                  ? 'In Dispute' 
                  : disputeData.hasDisputes 
                    ? 'Past Disputes' 
                    : 'No Disputes'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Disputes Table */}
        {disputeData.hasDisputes ? (
          <div className="bg-zinc-800/30 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-700/30">
              <h3 className="text-lg font-medium text-white flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>All Disputes ({allDisputes.length})</span>
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Showing all disputes regardless of status. Scroll down to see more.
              </p>
            </div>

            {/* Enhanced scrollable table container */}
            <div className="max-h-[500px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-track-zinc-800 scrollbar-thumb-zinc-600 hover:scrollbar-thumb-zinc-500">
              <table className="w-full table-fixed">
                <thead className="bg-zinc-700/30 sticky top-0 z-10 backdrop-blur-sm">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider w-[35%]">
                      Dispute Details
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider w-[15%]">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider w-[20%]">
                      Initiator
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider w-[15%]">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider w-[15%]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-700/30">
                  {allDisputes.map((dispute: Dispute, index) => (
                    <tr 
                      key={dispute.id} 
                      className={`hover:bg-zinc-700/20 transition-colors ${
                        index % 2 === 0 ? 'bg-zinc-800/10' : 'bg-zinc-800/20'
                      }`}
                    >
                      <td className="px-4 py-4 w-[35%]">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-white">#{dispute.id}</span>
                            {canChallengeDispute(dispute) && (
                              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-medium">
                                Challengeable
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-zinc-400 break-words pr-2">
                            {dispute.data}
                          </div>
                          {dispute.evidenceHash && (
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-zinc-500">Evidence:</span>
                              <button 
                                onClick={() => copyToClipboard(dispute.evidenceHash)}
                                className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-mono"
                                title="Click to copy evidence hash"
                              >
                                {truncateHash(dispute.evidenceHash, 6)}
                              </button>
                            </div>
                          )}
                          {dispute.counterEvidenceHash && (
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-zinc-500">Counter:</span>
                              <button 
                                onClick={() => copyToClipboard(dispute.counterEvidenceHash)}
                                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                                title="Click to copy counter evidence hash"
                              >
                                {truncateHash(dispute.counterEvidenceHash, 6)}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 w-[15%]">
                        <div className="space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded border ${getStatusColor(dispute.status)}`}>
                            {dispute.status}
                          </span>
                          {dispute.counterEvidenceHash && (
                            <div className="text-xs text-cyan-400">Challenged</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 w-[20%]">
                        <div className="space-y-1">
                          <button 
                            onClick={() => copyToClipboard(dispute.initiator)}
                            className="text-sm text-orange-400 hover:text-orange-300 transition-colors font-mono break-all"
                            title="Click to copy initiator address"
                          >
                            {truncateHash(dispute.initiator, 8)}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4 w-[15%]">
                        <div className="space-y-1">
                          <div className="text-sm text-zinc-300">
                            {formatTimestamp(dispute.disputeTimestamp)}
                          </div>
                          {dispute.umaLink && (
                            <a 
                              href={dispute.umaLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center space-x-1"
                            >
                              <span>UMA</span>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 w-[15%]">
                        <div className="flex flex-col space-y-1">
                          {getDisputeActionButton(dispute)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Scroll indicator at bottom */}
              {allDisputes.length > 5 && (
                <div className="sticky bottom-0 bg-gradient-to-t from-zinc-800/30 to-transparent p-2 text-center">
                  <div className="text-xs text-zinc-500 flex items-center justify-center space-x-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <span>Scroll to see all {allDisputes.length} disputes</span>
                  </div>
                </div>
              )}
            </div>

            {/* Summary footer */}
            <div className="px-6 py-3 border-t border-zinc-700/30 bg-zinc-800/20">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">
                  Total: {allDisputes.length} disputes
                </span>
                <div className="flex space-x-4">
                  <span className="text-red-400">
                    {disputeData.activeDisputes.length} Active
                  </span>
                  <span className="text-green-400">
                    {allDisputes.filter(d => d.status.toLowerCase() === 'resolved').length} Resolved
                  </span>
                  <span className="text-yellow-400">
                    {allDisputes.filter(d => d.status.toLowerCase() === 'dismissed').length} Dismissed
                  </span>
                  <span className="text-orange-400">
                    {allDisputes.filter(d => d.status.toLowerCase() === 'disputed').length} Under Review
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-800/30 rounded-xl p-8 text-center">
            <svg className="w-16 h-16 text-green-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-zinc-400 mb-2">No disputes found</p>
            <p className="text-sm text-zinc-500">This asset has not been involved in any disputes.</p>
          </div>
        )}
      </div>

      {/* Dispute Assertion Modal */}
      <DisputeAssertionModal
        isOpen={isChallengeModalOpen}
        onClose={() => {
          setIsChallengeModalOpen(false);
          setSelectedDispute(null);
        }}
        dispute={selectedDispute}
        currentIpId={ipId}
        onSubmit={handleDisputeAssertion}
      />
    </>
  );
};
"use client";

import React, { useState, useEffect } from 'react';
import { DisputeInfo } from './types';
import { DisputeAssertionModal } from './disputeAssertion';
import { Toast } from '@radix-ui/react-toast'; // Adjust the import based on your project structure

interface DisputeInfoProps {
  ipId: string;
}

export const DisputeInfoComponent: React.FC<DisputeInfoProps> = ({ ipId }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [disputeInfo, setDisputeInfo] = useState<DisputeInfo>({
    hasDisputes: false,
    activeDisputes: [],
    resolvedDisputes: [],
    totalDisputes: 0,
    isInitiator: false,
    isTarget: false
  });
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | number | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  
  // Add state for dispute assertion modal
  const [isDisputeAssertionModalOpen, setIsDisputeAssertionModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (ipId) {
      fetchDisputeInfo(ipId);
    }
  }, [ipId]);

  const fetchDisputeInfo = async (ipId: string) => {
    setLoading(true);
    try {
      // Check if this IP is a target of a dispute
      const response = await fetch('/api/disputes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          options: {
            where: {
              targetIpId: ipId
            }
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dispute data');
      }
      
      const data = await response.json();
      const disputes = data.data || [];
      
      // Also check if this IP initiated any disputes
      const initiatedResponse = await fetch('/api/disputes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          options: {
            where: {
              initiator: ipId
            }
          }
        })
      });
      
      if (!initiatedResponse.ok) {
        throw new Error('Failed to fetch initiated dispute data');
      }
      
      const initiatedData = await initiatedResponse.json();
      const initiatedDisputes = initiatedData.data || [];
      
      // Combine both types of disputes
      const allDisputes = [...disputes, ...initiatedDisputes];
      
      // Separate active and resolved disputes
      const activeDisputes = allDisputes.filter(dispute => 
        dispute.status === 'raised' || 
        dispute.status === 'ACTIVE' || 
        dispute.status === 'PENDING'
      );
      const resolvedDisputes = allDisputes.filter(dispute => 
        dispute.status === 'RESOLVED' || 
        dispute.status === 'DISMISSED' ||
        dispute.status === 'resolved' ||
        dispute.status === 'dismissed'
      );
      
      setDisputeInfo({
        hasDisputes: allDisputes.length > 0,
        activeDisputes: activeDisputes,
        resolvedDisputes: resolvedDisputes,
        totalDisputes: allDisputes.length,
        isInitiator: initiatedDisputes.length > 0,
        isTarget: disputes.length > 0
      });
    } catch (error) {
      console.error('Error fetching dispute data:', error);
      setDisputeInfo({
        hasDisputes: false,
        activeDisputes: [],
        resolvedDisputes: [],
        totalDisputes: 0,
        isInitiator: false,
        isTarget: false
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTargetTag = (tag: string): string => {
    if (!tag) return 'N/A';
    
    // Common dispute tags that we can decode
    const knownTags: Record<string, string> = {
      '494d50524f5045525f524547495354524154494f4e0000000000000000000000': 'IMPROPER REGISTRATION',
      '494d50524f5045525f55534147450000000000000000000000000000000000': 'IMPROPER USAGE',
      '494d50524f5045525f5041594d454e5400000000000000000000000000000000': 'IMPROPER PAYMENT',
      '494e56414c49445f49505f434c41494d000000000000000000000000000000': 'INVALID IP CLAIM',
      '494e4652494e47454d454e5400000000000000000000000000000000000000': 'INFRINGEMENT',
      '434f4e54454e545f5354414e44415244535f56494f4c4154494f4e0000000000': 'CONTENT STANDARDS VIOLATION',
      '434f505952494748545f56494f4c4154494f4e0000000000000000000000000000': 'COPYRIGHT VIOLATION',
      '494e5f44495350555445000000000000000000000000000000000000000000': 'IN DISPUTE'
    };
    
    // Check if it's a known tag
    if (knownTags[tag]) {
      return knownTags[tag];
    }
    
    // If it looks like hex, try to decode
    if (tag.match(/^[0-9a-f]+$/i)) {
      try {
        let decoded = '';
        for (let i = 0; i < tag.length; i += 2) {
          const hexPair = tag.substring(i, i + 2);
          const num = parseInt(hexPair, 16);
          if (num >= 32 && num <= 126) { // Printable ASCII range
            decoded += String.fromCharCode(num);
          }
        }
        
        // Clean up the string by removing null bytes and trimming
        decoded = decoded.replace(/\0/g, '').trim();
        
        if (decoded.length > 0) {
          return decoded;
        }
      } catch (e) {
        // Fall back on truncation
      }
    }
    
    // Just truncate if we can't decode
    return truncateAddress(tag);
  };

  const fetchDisputeDetails = async (disputeId: string | number) => {
    setLoadingDetails(true); // Set loading state to true before fetching
    
    try {
      const response = await fetch(`/api/disputes/${disputeId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dispute details: ${response.status}`);
      }
      
      const responseData = await response.json();
      const disputeData = responseData.data;
      
      setSelectedDispute(disputeData);
    } catch (error) {
      console.error('Error fetching dispute details:', error);
      setSelectedDispute(null);
    } finally {
      setLoadingDetails(false); // Always set loading to false when done
    }
  };

  const handleBackToList = () => {
    setSelectedDisputeId(null);
    setSelectedDispute(null);
  };

  const viewDisputeDetails = (disputeId: string | number) => {
    setSelectedDisputeId(disputeId);
    setLoadingDetails(true); // Set loading state to true before fetching
    fetchDisputeDetails(disputeId);
  };

  const handleDisputeAssertion = () => {
    setIsDisputeAssertionModalOpen(true);
  };
  
  const handleDisputeAssertionSubmit = async (data: any) => {
    console.log('Dispute assertion submitted with data:', data);
    
    // No need to make an API call here as the disputeAssertion function is already 
    // called in the DisputeAssertionModal component
    
    // Close the modal
    setIsDisputeAssertionModalOpen(false);
    
    // Refresh the dispute data to show the latest status
    if (selectedDisputeId) {
      fetchDisputeDetails(selectedDisputeId);
    }
    
    // Show a notification or feedback to the user
    console.log('Dispute assertion successfully submitted');
  };

  const formatDate = (timestamp: number): string => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp * 1000);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const truncateAddress = (address: string): string => {
    if (!address || address.length < 16) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Enhanced function to check for counter evidence
  const hasCounterEvidence = (dispute: any): boolean => {
    // Check if counterEvidenceHash exists and is not empty
    if (dispute.counterEvidenceHash && dispute.counterEvidenceHash.trim() !== '') {
      return true;
    }
    
    // Check for counterEvidenceCID as an alternative property name
    if (dispute.counterEvidenceCID && dispute.counterEvidenceCID.trim() !== '') {
      return true;
    }
    
    // Check for any property that might indicate counter evidence
    if (dispute.counterEvidence || dispute.hasCounterEvidence === true) {
      return true;
    }
    
    return false;
  };

  // Update the getStatusBadge function to show counter evidence status
  const getStatusBadge = (status: string, dispute: any) => {
    const hasCountered = hasCounterEvidence(dispute);
    
    switch (status?.toLowerCase()) {
      case 'active':
      case 'raised':
      case 'pending':
        return (
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-xs">
              {status === 'raised' ? 'Active' : status}
            </span>
            {hasCountered && (
              <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs">
                Countered
              </span>
            )}
          </div>
        );
      case 'resolved':
        return (
          <span className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded text-xs">
            Resolved
          </span>
        );
      case 'dismissed':
        return (
          <span className="px-2 py-1 bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 rounded text-xs">
            Dismissed
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-xs">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-sm text-zinc-400">Loading dispute information...</p>
        </div>
      </div>
    );
  }

  // Updated Dispute Detail View
  if (selectedDisputeId && selectedDispute) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={handleBackToList} 
            className="flex items-center text-blue-400 hover:text-blue-300 transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Disputes
          </button>
          
          {/* Challenge Dispute button */}
          {selectedDispute.targetIpId === ipId && selectedDispute.status.toLowerCase() === 'raised' && (
            hasCounterEvidence(selectedDispute) ? (
              <div className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l-2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Counter Evidence Submitted
              </div>
            ) : (
              <button
                onClick={handleDisputeAssertion}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 hover:from-red-500/30 hover:to-orange-500/30 text-red-400 border border-red-500/20 rounded-lg text-sm transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Challenge This Dispute
              </button>
            )
          )}
        </div>
        
        {/* Enhanced dispute header with counter-evidence status */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 rounded-xl p-6 border border-zinc-700/30">
            <div className="flex flex-col md:flex-row md:items-start justify-between">
              <div className="mb-4 md:mb-0">
                <div className="flex items-center mb-2">
                  <h2 className="text-xl font-bold text-white mr-3">Dispute</h2>
                  <span className="px-3 py-1 bg-zinc-800/80 text-blue-400 border border-zinc-700/50 rounded-md text-sm font-mono">
                    #{selectedDispute.id}
                  </span>
                  <span className="ml-3">{getStatusBadge(selectedDispute.status, selectedDispute)}</span>
                </div>
                
                {/* Add counter-evidence indicator in header if present */}
                {hasCounterEvidence(selectedDispute) && selectedDispute.targetIpId === ipId && (
                  <div className="inline-flex items-center px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md mt-2">
                    <span className="text-xs text-blue-400">Counter evidence submitted</span>
                  </div>
                )}
                
                <p className="text-sm text-zinc-400 mb-2 mt-2">
                  Created: {formatDate(selectedDispute.disputeTimestamp)}
                </p>
                
                {/* Target Tag summary display in header */}
                {selectedDispute.targetTag && (
                  <div className="inline-flex items-center px-3 py-1 bg-zinc-800/80 border border-zinc-700/50 rounded-md">
                    <span className="text-xs text-zinc-500 mr-2">Reason:</span>
                    <span className="text-xs text-pink-400 font-medium">
                      {formatTargetTag(selectedDispute.targetTag)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col space-y-2">
                {selectedDispute.umaLink && (
                  <a 
                    href={selectedDispute.umaLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-sm font-medium transition-all duration-200 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    UMA Oracle Portal
                  </a>
                )}
                
                <button
                  onClick={() => navigator.clipboard.writeText(selectedDispute.id.toString())}
                  className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-300 border border-zinc-700/30 rounded-lg text-sm font-medium transition-all duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Dispute ID
                </button>
              </div>
            </div>
          </div>

          {/* Tabbed interface for dispute details */}
         {/* Cleaner Dispute Details Container */}
<div className="bg-gradient-to-br from-zinc-900/50 via-zinc-800/30 to-zinc-900/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-zinc-700/20 shadow-2xl">
  {/* Minimal Header */}
  <div className="bg-zinc-900/30 border-b border-zinc-700/20 px-6 py-4">
    <h3 className="text-white font-medium flex items-center">
      <div className="w-2 h-2 rounded-full bg-blue-400 mr-3"></div>
      Dispute Details
    </h3>
  </div>
  
  {/* Clean Content Layout */}
  <div className="p-8">
    <div className="space-y-8">
      
      {/* Parties Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Target IP */}
        <div className="group">
          <div className="flex items-center mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 mr-3"></div>
            <h4 className="text-sm font-medium text-zinc-300">Target IP Asset</h4>
          </div>
          <div className="bg-zinc-800/20 rounded-xl p-5 border border-zinc-700/10 hover:border-zinc-600/20 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <code className="text-sm font-mono text-blue-400 break-all flex-1 mr-4">
                {selectedDispute.targetIpId}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(selectedDispute.targetIpId)}
                className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-700/30 rounded-lg transition-all duration-200"
                title="Copy address"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              {ipId === selectedDispute.targetIpId ? "🎯 Your IP Asset" : "Target of dispute"}
            </p>
          </div>
        </div>

        {/* Initiator */}
        <div className="group">
          <div className="flex items-center mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-3"></div>
            <h4 className="text-sm font-medium text-zinc-300">Dispute Initiator</h4>
          </div>
          <div className="bg-zinc-800/20 rounded-xl p-5 border border-zinc-700/10 hover:border-zinc-600/20 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <code className="text-sm font-mono text-amber-400 break-all flex-1 mr-4">
                {selectedDispute.initiator}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(selectedDispute.initiator)}
                className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-700/30 rounded-lg transition-all duration-200"
                title="Copy address"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              {ipId === selectedDispute.initiator ? "🚀 You initiated this dispute" : "Filed the dispute"}
            </p>
          </div>
        </div>
      </div>

      {/* Dispute Reason */}
      <div>
        <div className="flex items-center mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-pink-400 mr-3"></div>
          <h4 className="text-sm font-medium text-zinc-300">Dispute Reason</h4>
        </div>
        <div className="bg-zinc-800/20 rounded-xl p-5 border border-zinc-700/10">
          <div className="flex items-center justify-between">
            <div>
              <span className="inline-flex items-center px-3 py-1.5 bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-lg text-sm font-medium">
                {formatTargetTag(selectedDispute.targetTag)}
              </span>
              <p className="text-xs text-zinc-500 mt-2 font-mono">
                {selectedDispute.targetTag}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Section */}
      <div>
        <div className="flex items-center mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-3"></div>
          <h4 className="text-sm font-medium text-zinc-300">Evidence</h4>
        </div>
        
        <div className="space-y-4">
          {/* Original Evidence */}
          <div className="bg-gradient-to-r from-emerald-500/5 to-green-500/5 rounded-xl p-5 border border-emerald-500/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-emerald-400 uppercase tracking-wide">Original Evidence</span>
              <button
                onClick={() => navigator.clipboard.writeText(selectedDispute.evidenceHash)}
                className="p-1.5 text-emerald-400/70 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all duration-200"
                title="Copy hash"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <code className="text-xs font-mono text-emerald-300 break-all block">
              {selectedDispute.evidenceHash}
            </code>
          </div>

          {/* Counter Evidence */}
          {selectedDispute.counterEvidenceHash ? (
            <div className="bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-xl p-5 border border-blue-500/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-medium text-blue-400 uppercase tracking-wide">Counter Evidence</span>
                  {selectedDispute.targetIpId === ipId && (
                    <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded-full">
                      Your Response
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(selectedDispute.counterEvidenceHash)}
                    className="p-1.5 text-blue-400/70 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all duration-200"
                    title="Copy hash"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <a 
                    href={`https://ipfs.io/ipfs/${selectedDispute.counterEvidenceHash}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-1.5 text-blue-400/70 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all duration-200"
                    title="View on IPFS"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
              <code className="text-xs font-mono text-blue-300 break-all block">
                {selectedDispute.counterEvidenceHash}
              </code>
            </div>
          ) : (
            selectedDispute.targetIpId === ipId && selectedDispute.status.toLowerCase() === 'raised' && (
              <div className="bg-zinc-800/20 rounded-xl p-6 border border-zinc-700/10 border-dashed text-center">
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-sm text-zinc-400 mb-4">No response submitted yet</p>
                <button
                  onClick={handleDisputeAssertion}
                  className="inline-flex items-center px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  Submit Response
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {/* Arbitration Policy - Minimal */}
      <div>
        <div className="flex items-center mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-3"></div>
          <h4 className="text-sm font-medium text-zinc-300">Arbitration Policy</h4>
        </div>
        <div className="bg-zinc-800/20 rounded-xl p-5 border border-zinc-700/10">
          <code className="text-xs font-mono text-indigo-400 break-all">
            {selectedDispute.arbitrationPolicy}
          </code>
        </div>
      </div>

      {/* Technical Details - Collapsible */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer py-3 text-sm font-medium text-zinc-400 hover:text-zinc-300 transition-colors">
          <div className="flex items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 mr-3"></div>
            <span>Technical Details</span>
          </div>
          <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        
        <div className="mt-4 bg-zinc-800/20 rounded-xl p-5 border border-zinc-700/10">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-zinc-500 mb-1">Block Number</p>
                <p className="text-sm text-zinc-300 font-mono">#{selectedDispute.blockNumber}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Block Timestamp</p>
                <p className="text-sm text-zinc-300">{formatDate(selectedDispute.blockTimestamp)}</p>
              </div>
            </div>
            
            <div>
              <p className="text-xs text-zinc-500 mb-2">Transaction Hash</p>
              <div className="flex items-center justify-between bg-zinc-900/30 rounded-lg p-3">
                <code className="text-xs font-mono text-zinc-400 break-all flex-1 mr-3">
                  {selectedDispute.transactionHash}
                </code>
                <a 
                  href={`https://explorer.storyprotocol.xyz/tx/${selectedDispute.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-zinc-700/30 rounded-lg transition-all duration-200"
                  title="View on Explorer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>

            {selectedDispute.data && (
              <div>
                <p className="text-xs text-zinc-500 mb-2">Raw Data</p>
                <div className="bg-zinc-900/30 rounded-lg p-3 max-h-32 overflow-auto">
                  <pre className="text-xs font-mono text-zinc-500 whitespace-pre-wrap">{selectedDispute.data}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </details>

    </div>
  </div>
</div>
        </div>

        {/* Add DisputeAssertionModal */}
        <DisputeAssertionModal
          isOpen={isDisputeAssertionModalOpen}
          onClose={() => setIsDisputeAssertionModalOpen(false)}
          dispute={selectedDispute}
          currentIpId={ipId}
          onSubmit={handleDisputeAssertionSubmit}
        />
      </div>
    );
  }

  if (!disputeInfo.hasDisputes) {
    return (
      <div className="p-6">
        <div className="bg-zinc-900/60 rounded-xl p-6 border border-zinc-800/60 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-500/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No Disputes Found</h3>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            This IP asset is not currently involved in any disputes. It has no active disputes and no history of resolved disputes.
          </p>
          <button 
            onClick={() => fetchDisputeInfo(ipId)}
            className="mt-4 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded text-sm font-medium transition-all duration-200"
          >
            Refresh Dispute Status
          </button>
        </div>
      </div>
    );
  }

  // Disputes List View
  return (
    <div className="p-4">
      {/* Summary Header */}
      <div className="mb-6">
        <h2 className="text-lg font-medium text-white mb-2">Dispute Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-zinc-900/60 p-4 rounded-lg border border-zinc-800/60">
            <p className="text-sm text-zinc-400 mb-1">Total Disputes</p>
            <p className="text-2xl font-bold text-white">{disputeInfo.totalDisputes}</p>
          </div>
          <div className="bg-zinc-900/60 p-4 rounded-lg border border-zinc-800/60">
            <p className="text-sm text-zinc-400 mb-1">Active Disputes</p>
            <p className="text-2xl font-bold text-red-400">{disputeInfo.activeDisputes.length}</p>
          </div>
          <div className="bg-zinc-900/60 p-4 rounded-lg border border-zinc-800/60">
            <p className="text-sm text-zinc-400 mb-1">Resolved Disputes</p>
            <p className="text-2xl font-bold text-green-400">{disputeInfo.resolvedDisputes.length}</p>
          </div>
        </div>
      </div>

      {/* Active Disputes Section - Fixed headers and rows */}
      {disputeInfo.activeDisputes.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-medium text-white mb-3 flex items-center">
            <svg className="w-4 h-4 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Active Disputes
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-400 uppercase bg-zinc-900/60">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">ID</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Evidence</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {disputeInfo.activeDisputes.map((dispute: any, index: number) => (
                  <tr 
                    key={dispute.id} 
                    className={`border-b border-zinc-800/20 ${index % 2 === 0 ? 'bg-zinc-900/30' : 'bg-zinc-900/10'} hover:bg-zinc-800/30 transition-colors`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-blue-400">
                      #{dispute.id}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(dispute.status, dispute)}
                    </td>
                    <td className="px-4 py-3 text-xs text-pink-400">
                      {dispute.targetTag ? formatTargetTag(dispute.targetTag) : 'N/A'}
                    </td>
                    {/* Evidence column */}
                    <td className="px-4 py-3">
                      {dispute.targetIpId === ipId && hasCounterEvidence(dispute) ? (
                        <div className="flex items-center space-x-1">
                          <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs">
                            <svg className="w-3 h-3 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Countered
                          </span>
                        </div>
                      ) : dispute.targetIpId === ipId ? (
                        <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full text-xs">
                          No Response
                        </span>
                      ) : hasCounterEvidence(dispute) ? (
                        <span className="px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-xs">
                          Contested
                        </span>
                      ) : (
                        <span className="text-zinc-500 text-xs">Uncontested</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {formatDate(dispute.disputeTimestamp || dispute.blockTimestamp)}
                    </td>
                    <td className="px-4 py-3">
                      {loadingDetails && selectedDisputeId === dispute.id ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs text-zinc-400">Loading...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <button 
                            className="px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded text-xs flex items-center transition-all duration-200"
                            onClick={() => viewDisputeDetails(dispute.id)}
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Details
                          </button>
                          
                          {/* Add Challenge button in table if target and not yet countered */}
                          {dispute.targetIpId === ipId && !hasCounterEvidence(dispute) && dispute.status.toLowerCase() === 'raised' && (
                            <button 
                              className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-xs flex items-center transition-all duration-200"
                              onClick={() => {
                                setSelectedDisputeId(dispute.id);
                                setSelectedDispute(dispute);
                                handleDisputeAssertion();
                              }}
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                              Challenge
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resolved Disputes Section - Also updated with the same headers */}
      {disputeInfo.resolvedDisputes.length > 0 && (
        <div>
          <h3 className="text-base font-medium text-white mb-3 flex items-center">
            <svg className="w-4 h-4 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Resolved Disputes
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-400 uppercase bg-zinc-900/60">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">ID</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Evidence</th>
                  <th className="px-4 py-3">Resolved</th>
                  <th className="px-4 py-3 rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {disputeInfo.resolvedDisputes.map((dispute: any, index: number) => (
                  <tr 
                    key={dispute.id} 
                    className={`border-b border-zinc-800/20 ${index % 2 === 0 ? 'bg-zinc-900/30' : 'bg-zinc-900/10'} hover:bg-zinc-800/30 transition-colors`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-blue-400">
                      #{dispute.id}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(dispute.status, dispute)}
                    </td>
                    <td className="px-4 py-3 text-xs text-pink-400">
                      {dispute.targetTag ? formatTargetTag(dispute.targetTag) : 'N/A'}
                    </td>
                    {/* Evidence status for resolved disputes */}
                    <td className="px-4 py-3">
                      {hasCounterEvidence(dispute) ? (
                        <span className="px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-xs">
                          Contested
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 rounded-full text-xs">
                          Uncontested
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {formatDate(dispute.updatedAt || dispute.blockTimestamp)}
                    </td>
                    <td className="px-4 py-3">
                      {loadingDetails && selectedDisputeId === dispute.id ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs text-zinc-400">Loading...</span>
                        </div>
                      ) : (
                        <button 
                          className="px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded text-xs flex items-center transition-all duration-200"
                          onClick={() => viewDisputeDetails(dispute.id)}
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
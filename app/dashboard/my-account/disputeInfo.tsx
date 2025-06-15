"use client";

import React, { useState, useEffect } from 'react';
import { DisputeInfo } from './types';
import { DisputeAssertionModal } from './disputeAssertion';
import { DisputeDetailsModal } from './disputedetailsmodal';

interface DisputeInfoProps {
  ipId: string;
}

// Enhanced countdown timer component with better visibility
const DisputeCountdownTimer: React.FC<{ 
  disputeTimestamp: number; 
  isExpired?: (expired: boolean) => void;
  size?: 'small' | 'medium' | 'large';
}> = ({ disputeTimestamp, isExpired, size = 'medium' }) => {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = Date.now();
      const disputeTime = disputeTimestamp * 1000; // Convert to milliseconds
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
      const endTime = disputeTime + thirtyDaysInMs;
      const remaining = endTime - now;

      if (remaining <= 0) {
        const newState = { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
        setTimeRemaining(newState);
        if (isExpired) isExpired(true);
        return;
      }

      const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
      const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

      const newState = { days, hours, minutes, seconds, expired: false };
      setTimeRemaining(newState);
      if (isExpired) isExpired(false);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [disputeTimestamp, isExpired]);

  const isUrgent = timeRemaining.days < 3;
  const isCritical = timeRemaining.days < 1;

  // Size configurations
  const sizeConfig = {
    small: {
      container: 'px-2 py-1.5',
      icon: 'w-3 h-3',
      text: 'text-xs',
      label: 'text-xs'
    },
    medium: {
      container: 'px-3 py-2',
      icon: 'w-4 h-4',
      text: 'text-xs',
      label: 'text-xs'
    },
    large: {
      container: 'px-4 py-3',
      icon: 'w-5 h-5',
      text: 'text-sm',
      label: 'text-sm'
    }
  };

  const config = sizeConfig[size];

  if (timeRemaining.expired) {
    return (
      <div className={`flex items-center space-x-2 ${config.container} bg-red-500/10 border border-red-500/20 rounded-lg max-w-full`}>
        <svg className={`${config.icon} text-red-400 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className={`${config.text} text-red-400 font-medium truncate`}>
          {size === 'small' ? 'Expired' : 'Challenge Period Expired'}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${config.container} rounded-lg border max-w-full ${
      isCritical 
        ? 'bg-red-500/10 border-red-500/20' 
        : isUrgent 
        ? 'bg-yellow-500/10 border-yellow-500/20' 
        : 'bg-blue-500/10 border-blue-500/20'
    }`}>
      <svg className={`${config.icon} flex-shrink-0 ${
        isCritical ? 'text-red-400' : isUrgent ? 'text-yellow-400' : 'text-blue-400'
      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center space-x-1">
          <span className={`${config.text} font-mono font-bold ${
            isCritical ? 'text-red-400' : isUrgent ? 'text-yellow-400' : 'text-blue-400'
          } truncate`}>
            {size === 'small' 
              ? `${timeRemaining.days}d ${String(timeRemaining.hours).padStart(2, '0')}h`
              : `${timeRemaining.days}d ${String(timeRemaining.hours).padStart(2, '0')}h ${String(timeRemaining.minutes).padStart(2, '0')}m ${String(timeRemaining.seconds).padStart(2, '0')}s`
            }
          </span>
        </div>
        <span className={`${config.label} text-zinc-500 truncate`}>
          {size === 'small' 
            ? (isCritical ? 'URGENT!' : isUrgent ? 'Running out' : 'Time left')
            : (isCritical ? 'URGENT - Challenge expires soon!' : isUrgent ? 'Time running out' : 'Time left to challenge')
          }
        </span>
      </div>
    </div>
  );
};

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
  // Add state for dispute details modal
  const [isDisputeDetailsModalOpen, setIsDisputeDetailsModalOpen] = useState<boolean>(false);

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
    setLoadingDetails(true);
    
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
      setLoadingDetails(false);
    }
  };

  const handleBackToList = () => {
    setSelectedDisputeId(null);
    setSelectedDispute(null);
  };

  const viewDisputeDetails = (disputeId: string | number) => {
    setSelectedDisputeId(disputeId);
    setLoadingDetails(true);
    fetchDisputeDetails(disputeId);
  };

  const handleDisputeAssertion = () => {
    setIsDisputeAssertionModalOpen(true);
  };

  // New handler for challenge button that opens dispute details
  const handleChallengeDispute = (dispute: any) => {
    setSelectedDisputeId(dispute.id);
    setSelectedDispute(dispute);
    setIsDisputeDetailsModalOpen(true);
  };
  
  const handleDisputeAssertionSubmit = async (data: any) => {
    console.log('Dispute assertion submitted with data:', data);
    
    setIsDisputeAssertionModalOpen(false);
    
    if (selectedDisputeId) {
      fetchDisputeDetails(selectedDisputeId);
    }
    
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
    if (dispute.counterEvidenceHash && dispute.counterEvidenceHash.trim() !== '') {
      return true;
    }
    
    if (dispute.counterEvidenceCID && dispute.counterEvidenceCID.trim() !== '') {
      return true;
    }
    
    if (dispute.counterEvidence || dispute.hasCounterEvidence === true) {
      return true;
    }
    
    return false;
  };

  // Helper function to check if challenge period is still active
  const isChallengeActive = (disputeTimestamp: number): boolean => {
    const now = Date.now();
    const disputeTime = disputeTimestamp * 1000;
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    return (now - disputeTime) < thirtyDaysInMs;
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

  // Updated Dispute Detail View with prominent countdown timer
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
        </div>

        {/* Prominent Timer Section for Disputes You Can Challenge */}
        {selectedDispute.targetIpId === ipId && selectedDispute.status.toLowerCase() === 'raised' && (
          <div className="mb-6 p-6 bg-gradient-to-r from-zinc-900/80 to-zinc-800/80 rounded-xl border border-zinc-700/50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-white mb-2 flex items-center">
                  <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Challenge Deadline
                </h3>
                <p className="text-sm text-zinc-400 mb-4">
                  You have a limited time to respond to this dispute. The countdown shows time remaining to submit your counter-evidence.
                </p>
                
                {/* Large Prominent Timer */}
                <div className="mb-4">
                  <DisputeCountdownTimer 
                    disputeTimestamp={selectedDispute.disputeTimestamp || selectedDispute.blockTimestamp}
                    size="large"
                  />
                </div>
              </div>
              
              <div className="ml-6">
                {hasCounterEvidence(selectedDispute) ? (
                  <div className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-sm">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l-2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Counter Evidence Submitted
                  </div>
                ) : isChallengeActive(selectedDispute.disputeTimestamp || selectedDispute.blockTimestamp) ? (
                  <button
                    onClick={handleDisputeAssertion}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-red-500/20 to-orange-500/20 hover:from-red-500/30 hover:to-orange-500/30 text-red-400 border border-red-500/20 rounded-lg text-sm transition-all duration-200 font-medium"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Challenge This Dispute
                  </button>
                ) : (
                  <div className="flex items-center px-6 py-3 bg-zinc-700/20 text-zinc-500 border border-zinc-600/20 rounded-lg text-sm">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Challenge Period Expired
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Dispute Details Content */}
        <div className="space-y-6">
          <div className="bg-zinc-900/60 rounded-xl p-6 border border-zinc-800/60">
            <h3 className="text-lg font-medium text-white mb-4">Dispute Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-zinc-400 mb-1">Dispute ID</p>
                <p className="text-white font-mono">#{selectedDispute.id}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400 mb-1">Status</p>
                {getStatusBadge(selectedDispute.status, selectedDispute)}
              </div>
              <div>
                <p className="text-sm text-zinc-400 mb-1">Target Tag</p>
                <p className="text-pink-400 text-sm">{formatTargetTag(selectedDispute.targetTag)}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400 mb-1">Created</p>
                <p className="text-white text-sm">{formatDate(selectedDispute.disputeTimestamp || selectedDispute.blockTimestamp)}</p>
              </div>
            </div>
          </div>
        </div>
        
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

  // Disputes List View with enhanced countdown timers
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

      {/* Active Disputes Section with enhanced timer column */}
      {disputeInfo.activeDisputes.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-medium text-white mb-3 flex items-center">
            <svg className="w-4 h-4 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Active Disputes
          </h3>
          
          {/* Responsive container with proper scrolling */}
          <div className="bg-zinc-900/30 rounded-xl border border-zinc-800/60 overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[1200px]"> {/* Minimum width to ensure proper layout */}
                <table className="w-full text-sm">
                  <thead className="bg-zinc-900/80 border-b border-zinc-800/40">
                    <tr>
                      <th className="px-3 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider w-[80px]">
                        ID
                      </th>
                      <th className="px-3 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider w-[120px]">
                        Status
                      </th>
                      <th className="px-3 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider w-[140px]">
                        Reason
                      </th>
                      <th className="px-3 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider w-[100px]">
                        Evidence
                      </th>
                      <th className="px-3 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider w-[280px]">
                        Challenge Timer
                      </th>
                      <th className="px-3 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider w-[140px]">
                        Created
                      </th>
                      <th className="px-3 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider w-[120px]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/30">
                    {disputeInfo.activeDisputes.map((dispute: any, index: number) => (
                      <tr 
                        key={dispute.id} 
                        className={`${index % 2 === 0 ? 'bg-zinc-900/20' : 'bg-transparent'} hover:bg-zinc-800/30 transition-colors duration-150`}
                      >
                        <td className="px-3 py-4 w-[80px]">
                          <div className="text-xs font-mono text-blue-400 truncate">
                            #{dispute.id}
                          </div>
                        </td>
                        
                        <td className="px-3 py-4 w-[120px]">
                          <div className="flex flex-col space-y-1">
                            {getStatusBadge(dispute.status, dispute)}
                          </div>
                        </td>
                        
                        <td className="px-3 py-4 w-[140px]">
                          <div className="text-xs text-pink-400">
                            <div className="truncate" title={dispute.targetTag ? formatTargetTag(dispute.targetTag) : 'N/A'}>
                              {dispute.targetTag ? formatTargetTag(dispute.targetTag) : 'N/A'}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-3 py-4 w-[100px]">
                          <div className="flex flex-col space-y-1">
                            {dispute.targetIpId === ipId && hasCounterEvidence(dispute) ? (
                              <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs text-center">
                                <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Countered
                              </span>
                            ) : dispute.targetIpId === ipId ? (
                              <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full text-xs text-center">
                                No Response
                              </span>
                            ) : hasCounterEvidence(dispute) ? (
                              <span className="px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-xs text-center">
                                Contested
                              </span>
                            ) : (
                              <span className="text-zinc-500 text-xs text-center">Uncontested</span>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-3 py-4 w-[280px]">
                          <div className="flex items-center justify-start">
                            {dispute.targetIpId === ipId && !hasCounterEvidence(dispute) ? (
                              <div className="max-w-full">
                                <DisputeCountdownTimer 
                                  disputeTimestamp={dispute.disputeTimestamp || dispute.blockTimestamp}
                                  size="small"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center px-3 py-2 bg-zinc-800/20 rounded-lg border border-zinc-700/30">
                                <span className="text-xs text-zinc-500">Timer N/A</span>
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-3 py-4 w-[140px]">
                          <div className="text-xs text-zinc-400">
                            <div className="flex flex-col">
                              <span>{formatDate(dispute.disputeTimestamp || dispute.blockTimestamp).split(',')[0]}</span>
                              <span className="text-zinc-500 text-xs">{formatDate(dispute.disputeTimestamp || dispute.blockTimestamp).split(',')[1]}</span>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-3 py-4 w-[120px]">
                          <div className="flex flex-col space-y-1">
                            {/* Only show Challenge button for disputes you can challenge */}
                            {dispute.targetIpId === ipId && !hasCounterEvidence(dispute) && dispute.status.toLowerCase() === 'raised' && isChallengeActive(dispute.disputeTimestamp || dispute.blockTimestamp) ? (
                              <button 
                                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md text-xs flex items-center justify-center transition-all duration-200 border border-red-500/20 hover:border-red-500/30"
                                onClick={() => handleChallengeDispute(dispute)}
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                Challenge
                              </button>
                            ) : (
                              <div className="flex items-center justify-center px-3 py-1.5 bg-zinc-800/20 rounded-md border border-zinc-700/20">
                                <span className="text-xs text-zinc-500">No Actions</span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Mobile view indicator */}
            <div className="block md:hidden p-4 bg-zinc-900/40 border-t border-zinc-800/40">
              <p className="text-xs text-zinc-500 text-center">
                ← Scroll horizontally to view all columns →
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Resolved Disputes Section */}
      {disputeInfo.resolvedDisputes.length > 0 && (
        <div>
          <h3 className="text-base font-medium text-white mb-3 flex items-center">
            <svg className="w-4 h-4 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Resolved Disputes
          </h3>
          
          <div className="bg-zinc-900/30 rounded-xl border border-zinc-800/60 overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[1000px]"> {/* Minimum width for resolved disputes */}
                <table className="w-full text-sm">
                  <thead className="bg-zinc-900/80 border-b border-zinc-800/40">
                    <tr>
                      <th className="px-3 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider w-[80px]">
                        ID
                      </th>
                      <th className="px-3 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider w-[120px]">
                        Status
                      </th>
                      <th className="px-3 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider w-[160px]">
                        Reason
                      </th>
                      <th className="px-3 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider w-[120px]">
                        Evidence
                      </th>
                      <th className="px-3 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider w-[140px]">
                        Resolved
                      </th>
                      <th className="px-3 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider w-[120px]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/30">
                    {disputeInfo.resolvedDisputes.map((dispute: any, index: number) => (
                      <tr 
                        key={dispute.id} 
                        className={`${index % 2 === 0 ? 'bg-zinc-900/20' : 'bg-transparent'} hover:bg-zinc-800/30 transition-colors duration-150`}
                      >
                        <td className="px-3 py-4 w-[80px]">
                          <div className="text-xs font-mono text-blue-400 truncate">
                            #{dispute.id}
                          </div>
                        </td>
                        
                        <td className="px-3 py-4 w-[120px]">
                          <div className="flex flex-col space-y-1">
                            {getStatusBadge(dispute.status, dispute)}
                          </div>
                        </td>
                        
                        <td className="px-3 py-4 w-[160px]">
                          <div className="text-xs text-pink-400">
                            <div className="truncate" title={dispute.targetTag ? formatTargetTag(dispute.targetTag) : 'N/A'}>
                              {dispute.targetTag ? formatTargetTag(dispute.targetTag) : 'N/A'}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-3 py-4 w-[120px]">
                          <div className="flex flex-col space-y-1">
                            {hasCounterEvidence(dispute) ? (
                              <span className="px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-xs text-center">
                                Contested
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 rounded-full text-xs text-center">
                                Uncontested
                              </span>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-3 py-4 w-[140px]">
                          <div className="text-xs text-zinc-400">
                            <div className="flex flex-col">
                              <span>{formatDate(dispute.updatedAt || dispute.blockTimestamp).split(',')[0]}</span>
                              <span className="text-zinc-500 text-xs">{formatDate(dispute.updatedAt || dispute.blockTimestamp).split(',')[1]}</span>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-3 py-4 w-[120px]">
                          <div className="flex items-center justify-center px-3 py-1.5 bg-zinc-800/20 rounded-md border border-zinc-700/20">
                            <span className="text-xs text-zinc-500">No Actions</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Mobile view indicator */}
            <div className="block md:hidden p-4 bg-zinc-900/40 border-t border-zinc-800/40">
              <p className="text-xs text-zinc-500 text-center">
                ← Scroll horizontally to view all columns →
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Details Modal */}
      {selectedDisputeId && (
        <DisputeDetailsModal
          isOpen={isDisputeDetailsModalOpen}
          onClose={() => {
            setIsDisputeDetailsModalOpen(false);
            setSelectedDisputeId(null);
            setSelectedDispute(null);
          }}
          disputeId={selectedDisputeId as number}
        />
      )}

      {/* Dispute Assertion Modal */}
      <DisputeAssertionModal
        isOpen={isDisputeAssertionModalOpen}
        onClose={() => setIsDisputeAssertionModalOpen(false)}
        dispute={selectedDispute}
        currentIpId={ipId}
        onSubmit={handleDisputeAssertionSubmit}
      />
    </div>
  );
};
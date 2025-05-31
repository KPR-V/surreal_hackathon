"use client";

import React, { useState, useEffect } from 'react';

interface ClaimableRevenueProps {
  onClaimRevenue?: () => void;
}

export const ClaimableRevenue: React.FC<ClaimableRevenueProps> = ({
  onClaimRevenue
}) => {
  const [totalRevenue, setTotalRevenue] = useState<string>('0.0');
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tokenType, setTokenType] = useState<'WIP' | 'MERC20'>('WIP');

  const fetchClaimableRevenue = async () => {
    setLoading(true);
    try {
      // TODO: Call claimable_revenue function here
      // const revenue = await claimable_revenue(ipId, claimer, useWipToken);
      
      // Mock data for now
      setTimeout(() => {
        setTotalRevenue('2.47');
        setLoading(false);
        setRefreshing(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching claimable revenue:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClaimableRevenue();
  }, [tokenType]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchClaimableRevenue();
  };

  const handleClaimAll = async () => {
    setClaiming(true);
    try {
      // TODO: Call batch_claim_all_revenue function here
      // const result = await batch_claim_all_revenue(requests);
      
      console.log('Claiming all revenue...');
      onClaimRevenue?.();
      
      // Mock success
      setTimeout(() => {
        setTotalRevenue('0.0');
        setClaiming(false);
      }, 2000);
    } catch (error) {
      console.error('Error claiming revenue:', error);
      setClaiming(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4 hover:border-green-500/30 transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">Claimable Revenue</h3>
            <p className="text-xs text-zinc-400">Total earnings from all IP Assets</p>
          </div>
        </div>

        {/* Token Type Toggle */}
        <div className="flex bg-zinc-800/30 rounded-lg p-1">
          <button
            onClick={() => setTokenType('WIP')}
            className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
              tokenType === 'WIP'
                ? 'bg-green-500/20 text-green-300'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            WIP
          </button>
          <button
            onClick={() => setTokenType('MERC20')}
            className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
              tokenType === 'MERC20'
                ? 'bg-green-500/20 text-green-300'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            MERC20
          </button>
        </div>
      </div>

      {/* Revenue Display */}
      <div className="mb-4">
        {loading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-zinc-400">Calculating...</span>
          </div>
        ) : (
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-green-400">{totalRevenue}</span>
            <span className="text-sm text-green-300">{tokenType}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-zinc-500">From derivative works & licensing</span>
          {!loading && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-1 text-green-400 hover:text-green-300 transition-colors duration-200 group"
              title="Refresh revenue data"
            >
              <svg 
                className={`w-3 h-3 transition-transform duration-200 ${
                  refreshing ? 'animate-spin' : 'group-hover:rotate-180'
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-xs">Refresh</span>
            </button>
          )}
        </div>
      </div>

      {/* Claim Button */}
      <button
        onClick={handleClaimAll}
        disabled={claiming || loading || parseFloat(totalRevenue) === 0}
        className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          claiming || loading || parseFloat(totalRevenue) === 0
            ? 'bg-zinc-700/50 text-zinc-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white hover:shadow-lg'
        }`}
      >
        {claiming ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Claiming...</span>
          </div>
        ) : loading ? (
          'Loading...'
        ) : parseFloat(totalRevenue) === 0 ? (
          'No Revenue to Claim'
        ) : (
          `Claim All Revenue (${totalRevenue} ${tokenType})`
        )}
      </button>
    </div>
  );
};
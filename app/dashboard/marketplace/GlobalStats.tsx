"use client";

import React, { useState, useRef } from 'react';
import { TransactionTable } from './transactionTable';
import { TransactionChart } from './transactionchart';
import { StatsCards } from './statsCards';

const GlobalStats: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stats' | 'transactions'>('stats');
  const [refreshing, setRefreshing] = useState<'stats' | 'transactions' | null>(null);
  
  // Refs to trigger refresh in child components
  const statsCardsRef = useRef<{ refresh: () => Promise<void> }>(null);
  const transactionChartRef = useRef<{ refresh: () => void }>(null);
  const transactionTableRef = useRef<{ refresh: () => void }>(null);

  const containerHeight = 520;

  const handleRefresh = async (tabType: 'stats' | 'transactions') => {
    setRefreshing(tabType);
    
    try {
      if (tabType === 'stats') {
        // Trigger stats refresh
        if (statsCardsRef.current?.refresh) {
          await statsCardsRef.current.refresh();
        }
      } else {
        // Trigger transaction analytics refresh
        const promises = [];
        if (transactionChartRef.current?.refresh) {
          promises.push(transactionChartRef.current.refresh());
        }
        if (transactionTableRef.current?.refresh) {
          promises.push(transactionTableRef.current.refresh());
        }
        await Promise.all(promises);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      // Add a small delay to show the refresh animation
      setTimeout(() => {
        setRefreshing(null);
      }, 500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, tabType: 'stats' | 'transactions') => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      handleRefresh(tabType);
    }
  };

  return (
    <div className="bg-zinc-800/10 backdrop-blur-xl border border-zinc-800/30 rounded-xl overflow-hidden mb-8 shadow-2xl">
      {/* Ultra-Minimalist Tab Headers */}
      <div className="bg-zinc-950/30 backdrop-blur-sm border-b border-zinc-800/25">
        <div className="flex">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-5 py-3.5 text-sm font-medium transition-all duration-300 relative group ${
              activeTab === 'stats'
                ? 'text-neutral-100 bg-zinc-950/30'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-zinc-950/20'
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Global Statistics</span>
              {activeTab === 'stats' && (
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => handleKeyDown(e, 'stats')}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRefresh('stats');
                  }}
                  className="ml-2 p-1 rounded-md hover:bg-blue-500/10 transition-all duration-200 group-hover:scale-105"
                  title="Refresh statistics"
                >
                  <svg 
                    className={`w-3 h-3 text-blue-400 hover:text-blue-300 transition-all duration-200 ${
                      refreshing === 'stats' ? 'animate-spin' : 'hover:rotate-180'
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              )}
            </div>
            {activeTab === 'stats' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"></div>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-5 py-3.5 text-sm font-medium transition-all duration-300 relative group ${
              activeTab === 'transactions'
                ? 'text-neutral-100 bg-zinc-950/30'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-zinc-950/20'
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>Transaction Analytics</span>
              {activeTab === 'transactions' && (
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => handleKeyDown(e, 'transactions')}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRefresh('transactions');
                  }}
                  className="ml-2 p-1 rounded-md hover:bg-pink-500/10 transition-all duration-200 group-hover:scale-105"
                  title="Refresh transaction analytics"
                >
                  <svg 
                    className={`w-3 h-3 text-pink-400 hover:text-pink-300 transition-all duration-200 ${
                      refreshing === 'transactions' ? 'animate-spin' : 'hover:rotate-180'
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              )}
            </div>
            {activeTab === 'transactions' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500 rounded-full"></div>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-5" style={{ height: containerHeight }}>
        {activeTab === 'stats' ? (
          <StatsCards ref={statsCardsRef} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 h-full">
            <div className="h-full">
              <TransactionChart ref={transactionChartRef} height={containerHeight - 40} />
            </div>
            <div className="h-full">
              <TransactionTable ref={transactionTableRef} compact={true} height={containerHeight - 40} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { GlobalStats };
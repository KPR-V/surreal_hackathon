"use client";

import React from 'react';
import { ClaimableRevenue } from './claimable-revenue';

interface MiscellaneousProps {
  onTransferTokens?: () => void;
  onCreateCollection?: () => void;
  onClaimRevenue?: () => void;
}

export const Miscellaneous: React.FC<MiscellaneousProps> = ({
  onTransferTokens,
  onCreateCollection,
  onClaimRevenue
}) => {
  const handleTransferTokens = () => {
    console.log('Transfer IP Account tokens clicked');
    onTransferTokens?.();
  };

  const handleCreateCollection = () => {
    console.log('Create SPG NFT Collection clicked');
    onCreateCollection?.();
  };

  const handleClaimRevenue = () => {
    console.log('Claim all revenue clicked');
    onClaimRevenue?.();
  };

  return (
    <div className="bg-zinc-900/30 backdrop-blur-xl border border-zinc-700/20 rounded-2xl p-6 mb-8">
      <h3 className="text-lg font-medium text-white mb-4">Quick Actions</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Claimable Revenue Card */}
        <ClaimableRevenue onClaimRevenue={handleClaimRevenue} />

        {/* Action Buttons */}
        <div className="lg:col-span-2 space-y-3">
          {/* Transfer IP Account Tokens */}
          <button
            onClick={handleTransferTokens}
            className="w-full flex items-center justify-between p-4 bg-zinc-800/40 hover:bg-zinc-700/40 border border-zinc-700/30 hover:border-zinc-600/30 rounded-xl transition-all duration-200 group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-white font-medium group-hover:text-blue-300 transition-colors">
                  Transfer IP Account Tokens
                </p>
                <p className="text-sm text-zinc-400">
                  Transfer ERC-20 tokens between IP Accounts
                </p>
              </div>
            </div>
            <svg className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Create SPG NFT Collection */}
          <button
            onClick={handleCreateCollection}
            className="w-full flex items-center justify-between p-4 bg-zinc-800/40 hover:bg-zinc-700/40 border border-zinc-700/30 hover:border-zinc-600/30 rounded-xl transition-all duration-200 group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-white font-medium group-hover:text-purple-300 transition-colors">
                  Create SPG NFT Collection
                </p>
                <p className="text-sm text-zinc-400">
                  Create a new NFT collection for minting IP Assets
                </p>
              </div>
            </div>
            <svg className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
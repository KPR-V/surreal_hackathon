"use client";

import React, { useState } from 'react';
import { ClaimableRevenue } from './claimable-revenue';
import { DeBridgeModal } from './deBridgeModal';

interface MiscellaneousProps {
  userIpIds?: string[];
  userAddress?: string;
  onTransferTokens?: () => void;
  onCreateCollection?: () => void;
  onClaimRevenue?: () => void;
}

export const Miscellaneous: React.FC<MiscellaneousProps> = ({
  userIpIds = [],
  userAddress,
  onTransferTokens,
  onCreateCollection,
  onClaimRevenue
}) => {
  const [isDeBridgeModalOpen, setIsDeBridgeModalOpen] = useState(false);

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

  const handleDeBridge = () => {
    console.log('deBridge modal clicked');
    setIsDeBridgeModalOpen(true);
  };

  return (
    <>
      <div className="bg-zinc-900/30 backdrop-blur-xl border border-zinc-700/20 rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-medium text-white mb-6">Quick Actions</h3>
        
        {/* Improved Layout: Better grid distribution */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Claimable Revenue Card - Takes 2 columns on XL screens */}
          <div className="xl:col-span-2">
            <ClaimableRevenue 
              userIpIds={userIpIds}
              userAddress={userAddress}
              onClaimRevenue={handleClaimRevenue}
            />
          </div>

          {/* Action Buttons - Takes 3 columns on XL screens */}
          <div className="xl:col-span-3 flex flex-col gap-4">
            {/* Transfer IP Account Tokens */}
            <button
              onClick={handleTransferTokens}
              className="flex-1 flex items-center justify-between p-5 bg-zinc-800/40 hover:bg-zinc-700/40 border border-zinc-700/30 hover:border-zinc-600/30 rounded-xl transition-all duration-200 group"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-white font-medium group-hover:text-blue-300 transition-colors text-base">
                    Transfer IP Account Tokens
                  </p>
                  <p className="text-sm text-zinc-400 mt-1">
                    Transfer ERC-20 tokens between IP Accounts
                  </p>
                </div>
              </div>
              <svg className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Create SPG NFT Collection */}
            <button
              onClick={handleCreateCollection}
              className="flex-1 flex items-center justify-between p-5 bg-zinc-800/40 hover:bg-zinc-700/40 border border-zinc-700/30 hover:border-zinc-600/30 rounded-xl transition-all duration-200 group"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 011-1h1m0 0V3a2 2 0 011-1h1" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-white font-medium group-hover:text-purple-300 transition-colors text-base">
                    Create SPG NFT Collection
                  </p>
                  <p className="text-sm text-zinc-400 mt-1">
                    Create a new NFT collection for minting IP Assets
                  </p>
                </div>
              </div>
              <svg className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* deBridge Cross-Chain Bridge */}
            <button
              onClick={handleDeBridge}
              className="flex-1 flex items-center justify-between p-5 bg-zinc-800/40 hover:bg-zinc-700/40 border border-zinc-700/30 hover:border-zinc-600/30 rounded-xl transition-all duration-200 group"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-500/10 rounded-xl group-hover:bg-green-500/20 transition-colors">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-white font-medium group-hover:text-green-300 transition-colors text-base">
                    deBridge Cross-Chain Bridge
                  </p>
                  <p className="text-sm text-zinc-400 mt-1">
                    Don't have enough IP tokens? Use deBridge to transfer tokens across chains
                  </p>
                </div>
              </div>
              <svg className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Alternative layout for medium screens */}
        <style jsx>{`
          @media (min-width: 768px) and (max-width: 1279px) {
            .grid.xl\\:grid-cols-5 {
              grid-template-columns: 1fr 1fr;
            }
            .xl\\:col-span-2 {
              grid-column: span 1;
            }
            .xl\\:col-span-3 {
              grid-column: span 1;
            }
          }
        `}</style>
      </div>

      {/* deBridge Modal */}
      <DeBridgeModal 
        isOpen={isDeBridgeModalOpen}
        onClose={() => setIsDeBridgeModalOpen(false)}
      />
    </>
  );
};
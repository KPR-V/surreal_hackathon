"use client";

import { SecondaryMarketTabs } from "./secondary-market-tabs";
import { SecondaryDataCards } from "./secondary-data-cards";
import { useAccountModal } from "@tomo-inc/tomo-evm-kit";

export default function SecondaryMarketplace() {
    const { openAccountModal } = useAccountModal()
  return (
    <div className="min-h-screen bg-neutral-950 text-white px-16 py-12 ">
      {/* Header */}
      <div className="flex justify-between items-start p-8 pb-4">
        <div>
          <h1 className="text-5xl font-thin text-white mb-6 font-redHatDisplay">
            Secondary Marketplace
          </h1>
          {/*Subtitle*/}
          <p className="text-gray-400 text-base font-light max-w-2xl">
            Discover a World of Token Trading: Your Gateway to Secondary Market Transactions
          </p>
        </div>
        
        <button 
            onClick={openAccountModal} 
            className="px-4 py-2 my-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-lg text-white transition-all duration-200 text-sm font-medium"
          >
            Account
          </button>
      </div>

      {/* Data Cards */}
      <div className="px-8 mb-8">
        <SecondaryDataCards />
      </div>

      {/* Tabs */}
      <div className="px-8">
        <SecondaryMarketTabs />
      </div>
    </div>
  );
}
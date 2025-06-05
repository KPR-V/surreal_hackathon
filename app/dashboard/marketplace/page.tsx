"use client"

import { useState, useEffect } from "react"
import { useAccountModal } from "@tomo-inc/tomo-evm-kit"
import { MarketplaceTabs } from "./marketplace-tabs"

export default function MarketplacePage() {
  const { openAccountModal } = useAccountModal()

  const get_token_from_yakoa = async (tokenId: string) => {
    try {
      const response = await fetch('/api/yakoa/get-token', {
        method: 'GET',
        body: JSON.stringify({
          network: "story-aeneid",
          tokenId: tokenId,
        }),
      });
      const data = await response.json();
      console.log("Response from yakoa:", data);
      return data;
    } catch (error) {
      console.error("Error getting token from yakoa:", error);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl md:text-5xl font-light font-redHatDisplay text-white">
            Marketplace
          </h1>
          
          <button
            onClick={openAccountModal}
            className={`
              group px-6 py-3 text-white font-medium rounded-lg relative overflow-hidden
              transition-all duration-300
              bg-gradient-to-r from-neutral-900 to-neutral-900 hover:from-neutral-800 hover:to-neutral-800
              before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-blue-500/10 before:to-transparent
              before:translate-x-[-200%] hover:before:animate-[shimmer_1.5s_ease-in-out]
              after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-pink-500/10 after:to-transparent
              after:translate-x-[-200%] hover:after:animate-[shimmer_1.5s_ease-in-out_0.2s]
            `}
          >
            <span className="relative z-10">Account</span>
          </button>
        </div>

        {/* Tabs */}
        <MarketplaceTabs />

        <style jsx>{`
          @keyframes shimmer {
            0% { transform: translateX(-200%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
      </div>
    </div>
  )
}

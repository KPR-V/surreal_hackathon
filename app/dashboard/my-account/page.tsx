'use client'
import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { DataCard } from './dataCard'
import { MyAccountTab } from './myAccountTab'
import { Miscellaneous } from './miscellaneous'
import { TransferTokenIP2IP } from './transferTokenIP2IP'
import { CreateNFTCollectionModal } from './createNFTcollectionModal'
import { UserStatsService } from '../../../lib/services/userStatsService'
import { useAccountModal } from "@tomo-inc/tomo-evm-kit";

const page = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [userIpIds, setUserIpIds] = useState<string[]>([]); // Track user's IP assets
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userStats, setUserStats] = useState({
    totalIPAssets: 0,
    activeLicenses: 0,
    claimedRevenue: { amount: '0.00', currency: 'WIP', usdValue: '0.00' },
    totalDerivatives: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const { openAccountModal } = useAccountModal();

  // Use connected wallet address or fallback
  const userAddress = connectedAddress;

  // Fetch user statistics
  useEffect(() => {
    if (userAddress) {
      fetchUserStats();
    }
  }, [userAddress, refreshTrigger]);

  const fetchUserStats = async () => {
    try {
      setLoadingStats(true);
      console.log('Fetching user stats for:', userAddress);
      
      if (!userAddress) return;
      const stats = await UserStatsService.getAllUserStats(userAddress);
      setUserStats(stats);
      
      // Update userIpIds for other components
      const ipIds = stats.ipAssets.map(asset => asset.ipId);
      setUserIpIds(ipIds);
      
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Badge information for each statistic type
  const getCardInfo = (type: string) => {
    const cardInfo = {
      assets: {
        badge: "Story Protocol",
        badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20"
      },
      licenses: {
        badge: "PIL Active",
        badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20"
      },
      revenue: {
        badge: "Lifetime Earnings",
        badgeColor: "bg-green-500/10 text-green-400 border-green-500/20"
      },
      derivatives: {
        badge: "Creative Impact",
        badgeColor: "bg-orange-500/10 text-orange-400 border-orange-500/20"
      }
    };
    
    return cardInfo[type as keyof typeof cardInfo];
  };

  // Dynamic statistics data based on real user data
  const accountStats = [
    {
      title: "Total IP Assets",
      value: loadingStats ? "..." : userStats.totalIPAssets.toString(),
      subtitle: "Registered on Story Protocol",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 011-1h1m0 0V3a2 2 0 011-1h1" />
        </svg>
      ),
      badge: getCardInfo('assets').badge,
      badgeColor: getCardInfo('assets').badgeColor
    },
    {
      title: "Active Licenses",
      value: loadingStats ? "..." : userStats.activeLicenses.toString(),
      subtitle: "PIL Terms Attached",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      badge: getCardInfo('licenses').badge,
      badgeColor: getCardInfo('licenses').badgeColor
    },
    {
      title: "Revenue Claimed",
      value: loadingStats 
        ? "..." 
        : `${userStats.claimedRevenue.amount} ${userStats.claimedRevenue.currency}`,
      subtitle: `≈ $${userStats.claimedRevenue.usdValue} USD`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      badge: getCardInfo('revenue').badge,
      badgeColor: getCardInfo('revenue').badgeColor
    },
    {
      title: "Total Derivatives",
      value: loadingStats ? "..." : userStats.totalDerivatives.toString(),
      subtitle: "Created from your IPs",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
      ),
      badge: getCardInfo('derivatives').badge,
      badgeColor: getCardInfo('derivatives').badgeColor
    }
  ]

  const handleTransferTokens = () => {
    setIsTransferModalOpen(true);
  };

  const handleCreateCollection = () => {
    setIsCollectionModalOpen(true);
  };

  const handleTransferSubmit = (data: any) => {
    console.log('Transfer data:', data);
    // Here you would call the actual transfer function
  };

  const handleCollectionSubmit = (data: any) => {
    console.log('Collection data:', data);
    // Here you would call the actual createSpgNftCollection function
  };

  const handleClaimRevenue = () => {
    // Function to handle claimable revenue claiming
    console.log('Claim all revenue function called');
    // Trigger a refresh of the statistics or IP assets
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRevenueClaimSuccess = () => {
    console.log('Revenue claimed successfully!');
    // Trigger a refresh of the statistics or IP assets
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white px-16 py-12">
      {/* Header */}
      <div className="flex justify-between items-start p-8 pb-4">
        <div>
          <h1 className="text-5xl font-thin text-white mb-6 font-redHatDisplay">
            My Dashboard
          </h1>
          {/* Show connected wallet info */}
          <div className="flex items-center space-x-2 text-sm text-zinc-400">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-orange-400'}`}></div>
            <span>
              {isConnected 
                ? `Connected: ${userAddress?.slice(0, 6)}...${userAddress?.slice(-4)}`
                : `Viewing: ${userAddress?.slice(0, 6)}...${userAddress?.slice(-4)}`
              }
            </span>
            {loadingStats && (
              <div className="flex items-center space-x-1 ml-4">
                <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs">Updating stats...</span>
              </div>
            )}
          </div>
        </div>
        
        <button 
          onClick={openAccountModal} 
          className="px-4 py-2 my-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-lg text-white transition-all duration-200 text-sm font-medium"
        >
          Account
        </button>
      </div>

      {/* Data Cards Grid */}
      <div className="px-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {accountStats.map((stat, index) => (
            <DataCard
              key={index}
              title={stat.title}
              value={stat.value}
              subtitle={stat.subtitle}
              icon={stat.icon}
              badge={stat.badge}
              badgeColor={stat.badgeColor}
            />
          ))}
        </div>
      </div>

      {/* Refresh Button */}
      <div className="px-8 mb-4">
        <button
          onClick={() => setRefreshTrigger(prev => prev + 1)}
          disabled={loadingStats}
          className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <svg 
            className={`w-4 h-4 ${loadingStats ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{loadingStats ? 'Refreshing...' : 'Refresh Stats'}</span>
        </button>
      </div>

      {/* Miscellaneous Actions - Contains ClaimableRevenue */}
      <div className="px-8">
        <Miscellaneous 
          userIpIds={userIpIds}
          userAddress={userAddress}
          onTransferTokens={handleTransferTokens}
          onCreateCollection={handleCreateCollection}
          onClaimRevenue={handleRevenueClaimSuccess}
        />
      </div>

      {/* Tab Component */}
      <div className="px-8">
        <MyAccountTab 
          onIPAssetsUpdate={setUserIpIds}
          refreshTrigger={refreshTrigger}
        />
      </div>

      {/* Modals */}
      <TransferTokenIP2IP
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onTransfer={handleTransferSubmit}
      />

      <CreateNFTCollectionModal
        isOpen={isCollectionModalOpen}
        onClose={() => setIsCollectionModalOpen(false)}
        onCreate={handleCollectionSubmit}
      />
    </div>
  )
}

export default page
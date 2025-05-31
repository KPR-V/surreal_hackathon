'use client'
import React, { useState } from 'react'
import { DataCard } from './dataCard'
import { MyAccountTab } from './myAccountTab'
import { Miscellaneous } from './miscellaneous'
import { TransferTokenIP2IP } from './transferTokenIP2IP'
import { CreateNFTCollectionModal } from './createNFTcollectionModal'

const page = () => {
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [userIpIds, setUserIpIds] = useState<string[]>([]); // Track user's IP assets
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Sample statistics data - you can replace with actual data from your API
  const accountStats = [
    {
      title: "Total Assets",
      value: userIpIds.length.toString(),
      subtitle: "Registered IPs",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 011-1h1m0 0V3a2 2 0 011-1h1" />
        </svg>
      ),
      trend: "+2.4%",
      trendUp: true
    },
    {
      title: "Active Licenses",
      value: "8",
      subtitle: "PIL Attached",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      trend: "+12.5%",
      trendUp: true
    },
    {
      title: "Revenue Earned",
      value: "$2,847",
      subtitle: "This Month",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      trend: "+18.2%",
      trendUp: true
    },
    {
      title: "Derivative Works",
      value: "34",
      subtitle: "Created from my IPs",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
      ),
      trend: "-5.1%",
      trendUp: false
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
    <div className="min-h-screen bg-neutral-950 p-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-light font-redHatDisplay text-white mb-8">
            My Account
          </h1>
        </div>

        {/* Data Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10 mb-12">
          {accountStats.map((stat, index) => (
            <DataCard
              key={index}
              title={stat.title}
              value={stat.value}
              subtitle={stat.subtitle}
              icon={stat.icon}
              trend={stat.trend}
              trendUp={stat.trendUp}
            />
          ))}
        </div>

        {/* Miscellaneous Actions - Contains ClaimableRevenue */}
        <Miscellaneous 
          userIpIds={userIpIds}
          userAddress="0x34a817D5723A289E125b35aAac7e763b6097d38d"
          onTransferTokens={handleTransferTokens}
          onCreateCollection={handleCreateCollection}
          onClaimRevenue={handleRevenueClaimSuccess}
        />

        {/* Tab Component */}
        <MyAccountTab 
          onIPAssetsUpdate={setUserIpIds}
          refreshTrigger={refreshTrigger}
        />

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
    </div>
  )
}

export default page
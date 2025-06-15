"use client";

import React, { useState, useEffect } from 'react';

interface DataCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

interface MarketData {
  activeListings: number;
  totalVolumeIP: number;
  totalVolumeUSD: number;
  averagePriceIP: number;
  averagePriceUSD: number;
  totalTrades: number;
  trend: {
    listings: number;
    volume: number;
    price: number;
    trades: number;
  };
}

interface SecondaryDataCardsProps {
  filter: 'royalty' | 'license';
  refreshTrigger?: number;
}

const DataCard: React.FC<DataCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendUp
}) => {
  return (
    <div className="relative group">
      {/* Subtle glow on hover */}
      <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-blue-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 blur-lg"></div>
      
      <div className="relative bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/20 rounded-3xl px-10 py-4 hover:border-zinc-600/30 transition-all duration-500 shadow-xl hover:shadow-2xl hover:bg-zinc-900/60">
        
        {/* Header with Icon */}
        <div className="flex items-center justify-between mb-6">
          <div className="p-2 bg-gradient-to-br from-zinc-800/40 to-zinc-700/40 rounded-xl border border-zinc-600/20">
            <div className="text-zinc-400 group-hover:text-zinc-300 transition-colors duration-500">
              {icon}
            </div>
          </div>
          
          {trend && (
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-medium ${
              trendUp 
                ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              <svg 
                className={`w-3 h-3 ${trendUp ? 'rotate-0' : 'rotate-180'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l-5-5 5 5" />
              </svg>
              <span>{trend}</span>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="space-y-2">
          <h3 className="text-zinc-500 text-xs font-medium uppercase tracking-widest">
            {title}
          </h3>
          
          <div className="flex items-baseline space-x-3">
            <span className="text-2xl font-light text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-pink-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-500">
              {value}
            </span>
          </div>
          
          <p className="text-zinc-600 text-xs leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Subtle bottom border accent */}
        <div className="absolute bottom-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent"></div>
      </div>
    </div>
  );
};

export function SecondaryDataCards({ filter, refreshTrigger }: SecondaryDataCardsProps) {
  const [marketData, setMarketData] = useState<MarketData>({
    activeListings: 0,
    totalVolumeIP: 0,
    totalVolumeUSD: 0,
    averagePriceIP: 0,
    averagePriceUSD: 0,
    totalTrades: 0,
    trend: {
      listings: 0,
      volume: 0,
      price: 0,
      trades: 0
    }
  });

  const IP_TOKEN_USD_RATE = 4.15;

  // Helper function to safely convert to number
  const safeNumber = (value: any): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  // Calculate market data based on current listings and filter
  const calculateMarketData = () => {
    try {
      if (filter === 'royalty') {
        // Get royalty token listings
        const storedListings = JSON.parse(localStorage.getItem('royaltyTokenListings') || '[]');
        const activeListings = storedListings.filter((listing: any) => listing.status === 'active');

        // Get purchase history for volume and trades calculation
        const purchaseHistory = JSON.parse(localStorage.getItem('royaltyTokenPurchases') || '[]');
        
        // Get previous data for trend calculation
        const previousData = JSON.parse(localStorage.getItem('previousRoyaltyMarketData') || '{}');

        // Calculate active listings
        const currentActiveListings = activeListings.length;

        // Calculate total volume from purchases
        const totalVolumeIP = purchaseHistory.reduce((sum: number, purchase: any) => {
          const percentage = safeNumber(purchase.percentageToSell);
          const price = safeNumber(purchase.pricePerTokenIP);
          return sum + (percentage * price);
        }, 0);

        const totalVolumeUSD = totalVolumeIP * IP_TOKEN_USD_RATE;

        // Calculate average price from active listings
        let averagePriceIP = 0;
        if (activeListings.length > 0) {
          const totalPrice = activeListings.reduce((sum: number, listing: any) => {
            const percentage = safeNumber(listing.percentageToSell);
            const price = safeNumber(listing.pricePerTokenIP);
            return sum + (percentage * price);
          }, 0);
          averagePriceIP = totalPrice / activeListings.length;
        }

        const averagePriceUSD = averagePriceIP * IP_TOKEN_USD_RATE;

        // Total trades
        const totalTrades = purchaseHistory.length;

        // Calculate trends (comparing with previous data)
        const listingsTrend = previousData.activeListings ? 
          ((currentActiveListings - previousData.activeListings) / previousData.activeListings) * 100 : 0;
        const volumeTrend = previousData.totalVolumeIP ? 
          ((totalVolumeIP - previousData.totalVolumeIP) / previousData.totalVolumeIP) * 100 : 0;
        const priceTrend = previousData.averagePriceIP ? 
          ((averagePriceIP - previousData.averagePriceIP) / previousData.averagePriceIP) * 100 : 0;
        const tradesTrend = previousData.totalTrades ? 
          ((totalTrades - previousData.totalTrades) / previousData.totalTrades) * 100 : 0;

        const newData: MarketData = {
          activeListings: currentActiveListings,
          totalVolumeIP,
          totalVolumeUSD,
          averagePriceIP,
          averagePriceUSD,
          totalTrades,
          trend: {
            listings: listingsTrend,
            volume: volumeTrend,
            price: priceTrend,
            trades: tradesTrend
          }
        };

        // Store current data as previous for next calculation
        localStorage.setItem('previousRoyaltyMarketData', JSON.stringify({
          activeListings: currentActiveListings,
          totalVolumeIP,
          averagePriceIP,
          totalTrades
        }));

        setMarketData(newData);

      } else if (filter === 'license') {
        // For license tokens (placeholder data since not fully implemented)
        // You can implement similar logic when license token trading is ready
        const placeholderData: MarketData = {
          activeListings: 0,
          totalVolumeIP: 0,
          totalVolumeUSD: 0,
          averagePriceIP: 0,
          averagePriceUSD: 0,
          totalTrades: 0,
          trend: {
            listings: 0,
            volume: 0,
            price: 0,
            trades: 0
          }
        };
        setMarketData(placeholderData);
      }
    } catch (error) {
      console.error('Error calculating market data:', error);
      // Set default data on error
      setMarketData({
        activeListings: 0,
        totalVolumeIP: 0,
        totalVolumeUSD: 0,
        averagePriceIP: 0,
        averagePriceUSD: 0,
        totalTrades: 0,
        trend: {
          listings: 0,
          volume: 0,
          price: 0,
          trades: 0
        }
      });
    }
  };

  // Recalculate when filter changes or refresh is triggered
  useEffect(() => {
    calculateMarketData();
  }, [filter, refreshTrigger]);

  // Format numbers for display
  const formatNumber = (num: number, decimals: number = 0): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(decimals);
  };

  const formatTrend = (trend: number): { text: string; positive: boolean } => {
    if (trend === 0) return { text: '0%', positive: true };
    const isPositive = trend > 0;
    return {
      text: `${isPositive ? '+' : ''}${trend.toFixed(1)}%`,
      positive: isPositive
    };
  };

  const marketStats = [
    {
      title: `Active ${filter === 'royalty' ? 'RT' : 'LT'} Listings`,
      value: marketData.activeListings.toString(),
      subtitle: "Currently Available",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      trend: marketData.trend.listings !== 0 ? formatTrend(marketData.trend.listings).text : undefined,
      trendUp: formatTrend(marketData.trend.listings).positive
    },
    {
      title: "Total Volume",
      value: marketData.totalVolumeIP > 0 ? `${formatNumber(marketData.totalVolumeIP, 2)} IP` : '$0',
      subtitle: marketData.totalVolumeUSD > 0 ? 
        `~$${formatNumber(marketData.totalVolumeUSD, 2)} USD • All Time` : 
        "All Time",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      trend: marketData.trend.volume !== 0 ? formatTrend(marketData.trend.volume).text : undefined,
      trendUp: formatTrend(marketData.trend.volume).positive
    },
    {
      title: "Average Price",
      value: marketData.averagePriceIP > 0 ? `${formatNumber(marketData.averagePriceIP, 3)} IP` : '$0',
      subtitle: marketData.averagePriceUSD > 0 ? 
        `~$${formatNumber(marketData.averagePriceUSD, 2)} USD • Per Token` : 
        "Per Token",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2h-2a2 2 0 01-2-2v-8a2 2 0 012-2h2z" />
        </svg>
      ),
      trend: marketData.trend.price !== 0 ? formatTrend(marketData.trend.price).text : undefined,
      trendUp: formatTrend(marketData.trend.price).positive
    },
    {
      title: "Total Trades",
      value: formatNumber(marketData.totalTrades),
      subtitle: "All Time",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      trend: marketData.trend.trades !== 0 ? formatTrend(marketData.trend.trades).text : undefined,
      trendUp: formatTrend(marketData.trend.trades).positive
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {marketStats.map((stat, index) => (
        <DataCard
          key={`${filter}-${index}`}
          title={stat.title}
          value={stat.value}
          subtitle={stat.subtitle}
          icon={stat.icon}
          trend={stat.trend}
          trendUp={stat.trendUp}
        />
      ))}
    </div>
  );
}
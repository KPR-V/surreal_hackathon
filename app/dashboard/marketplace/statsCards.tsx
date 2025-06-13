"use client";

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

interface StatsData {
  average_block_time: number;
  coin_image: string;
  coin_price: string;
  coin_price_change_percentage: number | null;
  gas_price_updated_at: string;
  gas_prices: {
    slow: number;
    average: number;
    fast: number;
  };
  gas_prices_update_in: number;
  gas_used_today: string;
  market_cap: string;
  network_utilization_percentage: number;
  secondary_coin_image: string | null;
  secondary_coin_price: string | null;
  static_gas_price: number | null;
  total_addresses: string;
  total_blocks: string;
  total_gas_used: string;
  total_transactions: string;
  transactions_today: string;
  tvl: string | null;
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  badge: {
    text: string;
    color: string;
  };
  tooltip: string;
  cardIndex: number;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  badge,
  tooltip,
  cardIndex
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Determine tooltip position based on specific card requirements
  const getTooltipPosition = () => {
    switch (cardIndex) {
      case 0: // 1st card - right and below
        return {
          containerClass: "absolute top-full left-full transform -translate-x-1/4 mt-2 z-50",
          arrowClass: "absolute bottom-full left-1/4 transform -translate-x-1/2",
          arrowElement: <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-zinc-900/95"></div>
        };
      case 1: // 2nd card - below
      case 2: // 3rd card - below
        return {
          containerClass: "absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50",
          arrowClass: "absolute bottom-full left-1/2 transform -translate-x-1/2",
          arrowElement: <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-zinc-900/95"></div>
        };
      case 3: // 4th card - left and below
        return {
          containerClass: "absolute top-full right-full transform translate-x-1/4 mt-2 z-50",
          arrowClass: "absolute bottom-full right-1/4 transform translate-x-1/2",
          arrowElement: <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-zinc-900/95"></div>
        };
      case 4: // 5th card - right
        return {
          containerClass: "absolute left-full top-1/2 transform -translate-y-1/2 ml-2 z-50",
          arrowClass: "absolute right-full top-1/2 transform -translate-y-1/2",
          arrowElement: <div className="w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-zinc-900/95"></div>
        };
      case 5: // 6th card - above
      case 6: // 7th card - above
        return {
          containerClass: "absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50",
          arrowClass: "absolute top-full left-1/2 transform -translate-x-1/2",
          arrowElement: <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900/95"></div>
        };
      case 7: // 8th card - left and above
        return {
          containerClass: "absolute bottom-full right-full transform translate-x-1/4 mb-2 z-50",
          arrowClass: "absolute top-full right-1/4 transform translate-x-1/2",
          arrowElement: <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900/95"></div>
        };
      case 8: // 9th card - right and above
        return {
          containerClass: "absolute bottom-full left-full transform -translate-x-1/4 mb-2 z-50",
          arrowClass: "absolute top-full left-1/4 transform -translate-x-1/2",
          arrowElement: <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900/95"></div>
        };
      case 9: // 10th card - above
      default:
        return {
          containerClass: "absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50",
          arrowClass: "absolute top-full left-1/2 transform -translate-x-1/2",
          arrowElement: <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900/95"></div>
        };
    }
  };

  const tooltipPosition = getTooltipPosition();

  return (
    <div className="relative group">
      {/* Subtle glow on hover */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-blue-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-sm"></div>
      
      <div className="relative bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/20 rounded-xl px-4 py-3 hover:border-zinc-600/30 transition-all duration-300 shadow-lg hover:shadow-xl hover:bg-zinc-900/60">
        
        {/* Header with Icon and Info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-gradient-to-br from-zinc-800/40 to-zinc-700/40 rounded-lg border border-zinc-600/20">
              <div className="text-zinc-400 group-hover:text-zinc-300 transition-colors duration-300">
                {icon}
              </div>
            </div>
            
            {/* Info Icon with Tooltip */}
            <div className="relative">
              <button
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors duration-200"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              
              {/* Tooltip */}
              {showTooltip && (
                <div className={tooltipPosition.containerClass}>
                  <div className="bg-zinc-900/95 backdrop-blur-sm border border-zinc-700/30 rounded-lg px-3 py-2 text-xs text-zinc-300 shadow-xl w-64">
                    <p className="leading-relaxed whitespace-normal">
                      {tooltip}
                    </p>
                    {/* Tooltip arrow */}
                    <div className={tooltipPosition.arrowClass}>
                      {tooltipPosition.arrowElement}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Static Badge */}
          <div className={`px-2 py-0.5 rounded-full text-xs font-medium border ${badge.color}`}>
            <span>{badge.text}</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-1.5">
          <h3 className="text-zinc-500 text-xs font-medium uppercase tracking-widest">
            {title}
          </h3>
          
          <div className="flex items-baseline">
            <span className="text-lg font-light text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-pink-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-300">
              {value}
            </span>
          </div>
          
          <p className="text-zinc-600 text-xs leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Subtle bottom border accent */}
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent"></div>
      </div>
    </div>
  );
};

export const StatsCards = forwardRef<{ refresh: () => Promise<void> }>((props, ref) => {
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data only once on mount
  useEffect(() => {
    fetchStatsData();
  }, []); // Empty dependency array - only run once

  const fetchStatsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('https://www.storyscan.io/api/v2/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats data');
      }
      
      const data = await response.json();
      setStatsData(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  // Expose refresh function to parent
  useImperativeHandle(ref, () => ({
    refresh: async () => {
      await fetchStatsData();
    }
  }));

  const formatNumber = (num: string | number) => {
    const value = typeof num === 'string' ? parseFloat(num) : num;
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
    return value.toLocaleString();
  };

  const formatPrice = (price: string) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const formatMarketCap = (marketCap: string) => {
    const value = parseFloat(marketCap);
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };

  const formatBlockTime = (milliseconds: number) => {
    const seconds = milliseconds / 1000;
    return `${seconds.toFixed(1)}s`;
  };

  const formatUtilization = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-8 h-8 border-2 border-zinc-800/50 border-t-purple-500/60 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-8 h-8 border-2 border-transparent border-r-pink-400/30 rounded-full animate-spin" style={{ animationDelay: '0.15s' }}></div>
          </div>
          <div className="text-center">
            <p className="text-zinc-300 font-medium text-sm">Loading Statistics</p>
            <p className="text-zinc-500 text-xs">Fetching network data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center bg-zinc-900/40 border border-zinc-700/20 rounded-xl p-6 max-w-md backdrop-blur-sm">
          <div className="bg-red-500/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 border border-red-500/20">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-zinc-300 font-medium mb-2 text-sm">Unable to Load Statistics</h3>
          <p className="text-zinc-500 text-xs mb-4">{error}</p>
          <button 
            onClick={fetchStatsData}
            className="bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!statsData) return null;

  const statsCards = [
    // Price Data
    {
      title: "Token Price",
      value: formatPrice(statsData.coin_price),
      subtitle: "Current market price",
      badge: {
        text: "LIVE",
        color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      },
      tooltip: "Real-time price of Story Protocol's native token (IP) from market data aggregators. Price changes reflect market sentiment and trading activity.",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      )
    },
    
    // Market Cap
    {
      title: "Market Cap",
      value: formatMarketCap(statsData.market_cap),
      subtitle: "Total market value",
      badge: {
        text: "HOT",
        color: "bg-orange-500/10 text-orange-400 border-orange-500/20"
      },
      tooltip: "Market capitalization calculated as current token price multiplied by circulating supply. Indicates the total value of all IP tokens in circulation.",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },

    // Total Transactions
    {
      title: "Total Transactions",
      value: formatNumber(statsData.total_transactions),
      subtitle: "All-time transaction count",
      badge: {
        text: "TOTAL",
        color: "bg-blue-500/10 text-blue-400 border-blue-500/20"
      },
      tooltip: "Cumulative number of all transactions processed on the Story Protocol network since genesis. Includes IP registrations, licensing, transfers, and other operations.",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      )
    },

    // Today's Transactions
    {
      title: "Daily Transactions",
      value: formatNumber(statsData.transactions_today),
      subtitle: "Transactions today",
      badge: {
        text: "24H",
        color: "bg-purple-500/10 text-purple-400 border-purple-500/20"
      },
      tooltip: "Number of transactions processed in the last 24 hours. Higher activity indicates increased network usage and ecosystem growth.",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },

    // Total Addresses
    {
      title: "Total Addresses",
      value: formatNumber(statsData.total_addresses),
      subtitle: "Unique wallet addresses",
      badge: {
        text: "USERS",
        color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
      },
      tooltip: "Number of unique wallet addresses that have interacted with the Story Protocol network. Represents user adoption and ecosystem participation.",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },

    // Total Blocks
    {
      title: "Total Blocks",
      value: formatNumber(statsData.total_blocks),
      subtitle: "Blocks mined",
      badge: {
        text: "CHAIN",
        color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
      },
      tooltip: "Total number of blocks validated and added to the Story Protocol blockchain. Each block contains multiple transactions and maintains network security.",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 011-1h1m0 0V3a2 2 0 011-1h1" />
        </svg>
      )
    },

    // Average Block Time
    {
      title: "Avg Block Time",
      value: formatBlockTime(statsData.average_block_time),
      subtitle: "Block generation time",
      badge: {
        text: "SPEED",
        color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      },
      tooltip: "Average time between consecutive blocks. Lower block times indicate faster transaction processing and better network performance.",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },

    // Network Utilization
    {
      title: "Network Usage",
      value: formatUtilization(statsData.network_utilization_percentage),
      subtitle: "Current network load",
      badge: {
        text: "LOAD",
        color: "bg-rose-500/10 text-rose-400 border-rose-500/20"
      },
      tooltip: "Percentage of network capacity currently being utilized. Higher utilization indicates increased demand for blockchain resources and potential congestion.",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },

    // Gas Price Average
    {
      title: "Avg Gas Price",
      value: `${statsData.gas_prices.average} gwei`,
      subtitle: "Standard transaction cost",
      badge: {
        text: "GAS",
        color: "bg-amber-500/10 text-amber-400 border-amber-500/20"
      },
      tooltip: "Average gas price for standard-speed transactions. Gas prices fluctuate based on network demand and determine transaction processing priority and cost.",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 716.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        </svg>
      )
    },

    // Gas Used Today
    {
      title: "Daily Gas Used",
      value: formatNumber(statsData.gas_used_today),
      subtitle: "Gas consumed today",
      badge: {
        text: "USAGE",
        color: "bg-teal-500/10 text-teal-400 border-teal-500/20"
      },
      tooltip: "Total computational units (gas) consumed by all transactions in the last 24 hours. Higher gas usage indicates more complex operations and network activity.",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    }
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {statsCards.map((card, index) => (
            <StatCard
              key={index}
              cardIndex={index}
              title={card.title}
              value={card.value}
              subtitle={card.subtitle}
              icon={card.icon}
              badge={card.badge}
              tooltip={card.tooltip}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

StatsCards.displayName = 'StatsCards';
"use client";

import React, { useState, useEffect, forwardRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TransactionChartService } from '../../../lib/services/transactionChartService';

interface TransactionChartData {
  date: string;
  count: number;
}

interface TransactionChartProps {
  height?: number;
}

export const TransactionChart = forwardRef<{ refresh: () => void }, TransactionChartProps>(({ height = 400 }, ref) => {  const [chartData, setChartData] = useState<TransactionChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await TransactionChartService.fetchTransactionChart();
      setChartData(data);
    } catch (err) {
      console.error('Failed to fetch chart data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  };

  const getMaxValue = () => {
    if (chartData.length === 0) return 100;
    const max = Math.max(...chartData.map(d => d.count));
    return isNaN(max) ? 100 : max;
  };

  const getAverageValue = () => {
    if (chartData.length === 0) return 0;
    const sum = chartData.reduce((acc, d) => acc + d.count, 0);
    const avg = sum / chartData.length;
    return isNaN(avg) ? 0 : Math.round(avg);
  };

  const getTotalValue = () => {
    if (chartData.length === 0) return 0;
    const total = chartData.reduce((acc, d) => acc + d.count, 0);
    return isNaN(total) ? 0 : total;
  };

  // Prepare data for Recharts
  const chartDataFormatted = chartData.map(d => ({
    date: TransactionChartService.formatDate(d.date),
    count: d.count,
    displayDate: TransactionChartService.formatDate(d.date)
  }));

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-950/95 border border-zinc-800/50 rounded-xl p-3 backdrop-blur-xl shadow-2xl">
          <p className="text-neutral-100 text-xs font-medium mb-1">{label}</p>
          <p className="text-zinc-400 text-xs font-semibold">
            {payload[0].value.toLocaleString()} transactions
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-10 h-10 border-2 border-zinc-800/50 border-t-blue-500/60 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-10 h-10 border-2 border-transparent border-r-blue-400/30 rounded-full animate-spin" style={{ animationDelay: '0.15s' }}></div>
          </div>
          <div className="text-center">
            <p className="text-neutral-200 font-medium text-xs">Loading Analytics</p>
            <p className="text-neutral-500 text-xs mt-1">Fetching transaction data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-center bg-zinc-950/30 border border-zinc-800/30 rounded-xl p-6 max-w-md backdrop-blur-sm">
          <div className="bg-red-500/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-red-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-neutral-200 font-medium mb-2 text-xs">Unable to Load Chart</h3>
          <p className="text-neutral-400 text-xs mb-4">{error}</p>
          <button 
            onClick={fetchChartData}
            className="bg-zinc-900/60 hover:bg-zinc-800/60 border border-zinc-700/40 text-neutral-300 hover:text-neutral-200 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 hover:scale-[1.02]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-center bg-zinc-950/20 border border-zinc-800/25 rounded-xl p-6 max-w-md backdrop-blur-sm">
          <div className="bg-zinc-800/25 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-neutral-300 font-medium mb-2 text-xs">No Data Available</h3>
          <p className="text-neutral-500 text-xs">Transaction data will appear here when available</p>
        </div>
      </div>
    );
  }

  const chartHeight = height - 120;

  return (
    <div className="space-y-4" style={{ height }}>
      {/* Ultra-Minimalist Chart Header */}
      <div className="bg-zinc-950/25 border border-zinc-800/30 rounded-xl p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500/10 rounded-lg p-2">
              <svg className="w-4 h-4 text-blue-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-neutral-100 font-medium text-sm">Transaction Volume</h3>
              <p className="text-neutral-500 text-xs mt-0.5">Daily network activity</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-neutral-100 mb-0.5">
              {chartData[chartData.length - 1]?.count.toLocaleString() || '0'}
            </div>
            <div className="text-xs text-neutral-500 font-medium">Latest</div>
          </div>
        </div>
      </div>

      {/* Sleek Chart Container */}
      <div className="bg-zinc-950/20 border border-zinc-800/25 rounded-xl p-4 backdrop-blur-sm">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <AreaChart
            data={chartDataFormatted}
            margin={{ top: 8, right: 20, left: 15, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorTransactions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.01}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="2 2" 
              stroke="#3f3f46" 
              strokeOpacity={0.15}
            />
            <XAxis 
              dataKey="date"
              stroke="#71717a"
              fontSize={9}
              tickLine={{ stroke: '#52525b', strokeWidth: 1 }}
              axisLine={{ stroke: '#52525b', strokeWidth: 1 }}
            />
            <YAxis 
              stroke="#71717a"
              fontSize={9}
              tickLine={{ stroke: '#52525b', strokeWidth: 1 }}
              axisLine={{ stroke: '#52525b', strokeWidth: 1 }}
              label={{ 
                value: 'Transactions', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: '#71717a', fontSize: '9px' }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#3B82F6"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#colorTransactions)"
              dot={false}
              activeDot={{ r: 3, stroke: '#3B82F6', strokeWidth: 2, fill: '#1E40AF' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Refined Statistics Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-950/20 border border-zinc-800/25 rounded-lg p-3 backdrop-blur-sm hover:bg-zinc-950/30 transition-all duration-300 hover:scale-[1.01]">
          <div className="flex items-center space-x-2.5">
            <div className="bg-emerald-500/10 rounded-md p-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-neutral-100">
                {getMaxValue().toLocaleString()}
              </div>
              <div className="text-xs text-neutral-500 font-medium">Peak</div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-950/20 border border-zinc-800/25 rounded-lg p-3 backdrop-blur-sm hover:bg-zinc-950/30 transition-all duration-300 hover:scale-[1.01]">
          <div className="flex items-center space-x-2.5">
            <div className="bg-blue-500/10 rounded-md p-1.5">
              <svg className="w-3.5 h-3.5 text-blue-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-neutral-100">
                {getAverageValue().toLocaleString()}
              </div>
              <div className="text-xs text-neutral-500 font-medium">Average</div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-950/20 border border-zinc-800/25 rounded-lg p-3 backdrop-blur-sm hover:bg-zinc-950/30 transition-all duration-300 hover:scale-[1.01]">
          <div className="flex items-center space-x-2.5">
            <div className="bg-violet-500/10 rounded-md p-1.5">
              <svg className="w-3.5 h-3.5 text-violet-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-neutral-100">
                {getTotalValue().toLocaleString()}
              </div>
              <div className="text-xs text-neutral-500 font-medium">Total</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
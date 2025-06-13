import React from 'react'

interface DataCardProps {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  trend?: string
  trendUp?: boolean
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l5-5 5 5" />
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
  )
}

export function SecondaryDataCards() {
  const marketStats = [
    {
      title: "Active Listings",
      value: "247",
      subtitle: "Currently Available",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      trend: "+15.3%",
      trendUp: true
    },
    {
      title: "Total Volume",
      value: "$24.8K",
      subtitle: "Last 30 Days",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      trend: "+22.7%",
      trendUp: true
    },
    {
      title: "Average Price",
      value: "$186",
      subtitle: "Per Token",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      trend: "+8.4%",
      trendUp: true
    },
    {
      title: "Total Trades",
      value: "1,284",
      subtitle: "All Time",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      trend: "+31.2%",
      trendUp: true
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {marketStats.map((stat, index) => (
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
  );
}
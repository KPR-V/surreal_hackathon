import React from 'react'

interface DataCardProps {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  trend?: string
  trendUp?: boolean
}

export const DataCard: React.FC<DataCardProps> = ({
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
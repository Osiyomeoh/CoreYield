// BalanceCard.tsx
import React from 'react'

interface BalanceCardProps {
  title: string
  value: string
  subtitle: string
  icon: string
  gradient: string
  borderColor: string
  change?: string
  isActive?: boolean
  onClick?: () => void
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  gradient,
  borderColor,
  change,
  isActive,
  onClick
}) => {
  return (
    <div 
      className={`bg-gradient-to-br ${gradient} border ${borderColor} rounded-xl p-4 sm:p-6 transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:scale-105' : ''
      } ${isActive ? 'ring-2 ring-blue-500/50' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{icon}</span>
          {change && (
            <div className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
              {change}
            </div>
          )}
          {isActive && (
            <div className="text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full">
              Active
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <p className="text-2xl sm:text-3xl font-bold text-white">{value}</p>
        <p className="text-gray-400 text-sm">{subtitle}</p>
      </div>
      
      {onClick && (
        <div className="mt-2 text-xs text-gray-500 flex items-center">
          <span>Click to manage</span>
          <svg className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  )
}
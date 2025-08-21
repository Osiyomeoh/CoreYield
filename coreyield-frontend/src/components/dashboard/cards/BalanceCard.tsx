import React from 'react'

interface BalanceCardProps {
  title: string
  balance: string
  usdValue: string
  icon: string
  gradient: string
  borderColor: string
  textColor: string
  subtitle?: string
  onClick?: () => void
  actions?: React.ReactNode
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  title,
  balance,
  usdValue,
  icon,
  gradient,
  borderColor,
  textColor,
  subtitle,
  onClick,
  actions
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick()
    }
  }

  return (
    <div 
      className={`bg-gradient-to-br ${gradient} border ${borderColor} rounded-xl p-4 sm:p-6 backdrop-blur-sm hover-lift transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:scale-105' : ''
      }`}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>

      {/* Balance */}
      <div className="space-y-2">
        <p className="text-2xl font-bold text-white">{balance}</p>
        <p className="text-gray-400 text-sm">{usdValue}</p>
        {subtitle && (
          <p className={`text-xs ${textColor}`}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Actions */}
      {actions && (
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          {actions}
        </div>
      )}

      {/* Hover Effect Indicator */}
      {onClick && (
        <div className="mt-4 flex items-center justify-center">
          <div className="w-2 h-2 bg-gray-500 rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
        </div>
      )}
    </div>
  )
}
import React from 'react'
import { StatusIndicator } from './StatusIndicator'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  change?: {
    value: number
    period: string
    type: 'increase' | 'decrease' | 'neutral'
  }
  icon?: React.ReactNode
  status?: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  trend?: 'up' | 'down' | 'stable'
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'highlighted' | 'minimal'
  className?: string
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  change,
  icon,
  status,
  trend,
  size = 'md',
  variant = 'default',
  className = ''
}) => {
  const sizeConfig = {
    sm: {
      padding: 'p-3',
      title: 'text-xs',
      value: 'text-lg',
      subtitle: 'text-xs',
      icon: 'w-6 h-6'
    },
    md: {
      padding: 'p-4',
      title: 'text-sm',
      value: 'text-xl',
      subtitle: 'text-sm',
      icon: 'w-8 h-8'
    },
    lg: {
      padding: 'p-6',
      title: 'text-base',
      value: 'text-2xl',
      subtitle: 'text-sm',
      icon: 'w-10 h-10'
    }
  }

  const variantConfig = {
    default: 'bg-gray-800/50 border border-gray-700/50 hover:border-gray-600/50',
    highlighted: 'bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30',
    minimal: 'bg-transparent border border-gray-700/30'
  }

  const trendConfig = {
    up: {
      color: 'text-green-400',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    down: {
      color: 'text-red-400',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      )
    },
    stable: {
      color: 'text-gray-400',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
      )
    }
  }

  const sizeClasses = sizeConfig[size]
  const variantClasses = variantConfig[variant]

  return (
    <div className={`${variantClasses} ${sizeClasses.padding} rounded-xl transition-all duration-200 hover:shadow-lg ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center space-x-2 mb-2">
            {icon && (
              <div className={`${sizeClasses.icon} text-gray-400`}>
                {icon}
              </div>
            )}
            <h3 className={`${sizeClasses.title} text-gray-400 font-medium`}>
              {title}
            </h3>
            {status && (
              <StatusIndicator status={status} size="sm" variant="dot" />
            )}
          </div>

          {/* Value */}
          <div className="mb-1">
            <span className={`${sizeClasses.value} font-bold text-white`}>
              {value}
            </span>
          </div>

          {/* Subtitle */}
          {subtitle && (
            <p className={`${sizeClasses.subtitle} text-gray-400`}>
              {subtitle}
            </p>
          )}

          {/* Change Indicator */}
          {change && (
            <div className="flex items-center space-x-2 mt-2">
              <div className={`flex items-center space-x-1 ${change.type === 'increase' ? 'text-green-400' : change.type === 'decrease' ? 'text-red-400' : 'text-gray-400'}`}>
                {change.type === 'increase' && trendConfig.up.icon}
                {change.type === 'decrease' && trendConfig.down.icon}
                {change.type === 'neutral' && trendConfig.stable.icon}
                <span className={`${sizeClasses.subtitle} font-medium`}>
                  {change.type === 'increase' ? '+' : ''}{change.value}%
                </span>
              </div>
              <span className={`${sizeClasses.subtitle} text-gray-500`}>
                {change.period}
              </span>
            </div>
          )}
        </div>

        {/* Trend Indicator */}
        {trend && !change && (
          <div className={`${trendConfig[trend].color}`}>
            {trendConfig[trend].icon}
          </div>
        )}
      </div>
    </div>
  )
}

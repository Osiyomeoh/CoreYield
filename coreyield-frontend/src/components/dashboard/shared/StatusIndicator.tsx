import React from 'react'

interface StatusIndicatorProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  text?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'dot' | 'badge' | 'pill'
  className?: string
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  text,
  size = 'md',
  variant = 'dot',
  className = ''
}) => {
  const statusConfig = {
    success: {
      color: 'bg-green-500',
      textColor: 'text-green-400',
      borderColor: 'border-green-500/30',
      bgColor: 'bg-green-500/10'
    },
    warning: {
      color: 'bg-yellow-500',
      textColor: 'text-yellow-400',
      borderColor: 'border-yellow-500/30',
      bgColor: 'bg-yellow-500/10'
    },
    error: {
      color: 'bg-red-500',
      textColor: 'text-red-400',
      borderColor: 'border-red-500/30',
      bgColor: 'bg-red-500/10'
    },
    info: {
      color: 'bg-blue-500',
      textColor: 'text-blue-400',
      borderColor: 'border-blue-500/30',
      bgColor: 'bg-blue-500/10'
    },
    neutral: {
      color: 'bg-gray-500',
      textColor: 'text-gray-400',
      borderColor: 'border-gray-500/30',
      bgColor: 'bg-gray-500/10'
    }
  }

  const sizeConfig = {
    sm: {
      dot: 'w-2 h-2',
      text: 'text-xs',
      padding: 'px-2 py-1'
    },
    md: {
      dot: 'w-3 h-3',
      text: 'text-sm',
      padding: 'px-3 py-1.5'
    },
    lg: {
      dot: 'w-4 h-4',
      text: 'text-base',
      padding: 'px-4 py-2'
    }
  }

  const config = statusConfig[status]
  const sizeClasses = sizeConfig[size]

  const renderContent = () => {
    switch (variant) {
      case 'dot':
        return (
          <div className="flex items-center space-x-2">
            <div className={`${sizeClasses.dot} ${config.color} rounded-full`} />
            {text && <span className={`${sizeClasses.text} ${config.textColor}`}>{text}</span>}
          </div>
        )
      
      case 'badge':
        return (
          <div className={`inline-flex items-center space-x-2 ${sizeClasses.padding} ${config.bgColor} ${config.borderColor} border rounded-lg`}>
            <div className={`${sizeClasses.dot} ${config.color} rounded-full`} />
            {text && <span className={`${sizeClasses.text} ${config.textColor} font-medium`}>{text}</span>}
          </div>
        )
      
      case 'pill':
        return (
          <div className={`inline-flex items-center space-x-2 ${sizeClasses.padding} ${config.bgColor} ${config.borderColor} border rounded-full`}>
            <div className={`${sizeClasses.dot} ${config.color} rounded-full`} />
            {text && <span className={`${sizeClasses.text} ${config.textColor} font-medium`}>{text}</span>}
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className={`inline-flex ${className}`}>
      {renderContent()}
    </div>
  )
}

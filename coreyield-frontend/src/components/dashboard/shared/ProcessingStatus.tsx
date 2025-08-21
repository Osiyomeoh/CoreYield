import React from 'react'

interface ProcessingStatusProps {
  isProcessing: boolean
  operation?: string
  progress?: number
  className?: string
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  isProcessing,
  operation = 'Processing...',
  progress,
  className = ''
}) => {
  if (!isProcessing) return null

  return (
    <div className={`bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 ${className}`}>
      <div className="flex items-center space-x-4">
        {/* Loading Spinner */}
        <div className="flex-shrink-0">
          <svg className="animate-spin h-6 w-6 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>

        {/* Status Content */}
        <div className="flex-1">
          <h4 className="text-blue-300 font-medium">{operation}</h4>
          <p className="text-blue-200 text-sm mt-1">
            Please wait while your transaction is being processed...
          </p>
          
          {/* Progress Bar */}
          {progress !== undefined && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-blue-300 mb-1">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-blue-900/30 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Status Icon */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-4 pt-4 border-t border-blue-500/20">
        <div className="flex items-center justify-between text-xs text-blue-300">
          <span>Transaction Status</span>
          <span className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span>Processing</span>
          </span>
        </div>
      </div>
    </div>
  )
}
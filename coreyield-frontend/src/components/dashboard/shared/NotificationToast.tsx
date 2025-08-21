// NotificationToast.tsx
import React, { useEffect, useState } from 'react'

interface NotificationProps {
  type: 'success' | 'error' | 'info'
  title: string
  message: string
  hash?: string
}

interface NotificationToastProps {
  notification: NotificationProps | null
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notification }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (notification) {
      setIsVisible(true)
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  if (!notification || !isVisible) return null

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'success':
        return { icon: '✓', bg: 'bg-green-500', text: 'text-white' }
      case 'error':
        return { icon: '✕', bg: 'bg-red-500', text: 'text-white' }
      default:
        return { icon: 'i', bg: 'bg-blue-500', text: 'text-white' }
    }
  }

  const { icon, bg, text } = getNotificationIcon()

  return (
    <div className="fixed bottom-6 right-6 max-w-md z-50">
      <div className="bg-gray-800 border border-gray-700/50 rounded-2xl p-4 shadow-2xl backdrop-blur-sm animate-slide-up">
        <div className="flex items-start space-x-3">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${bg} ${text}`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white">
              {notification.title}
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {notification.message}
            </div>
            {notification.hash && (
              <a
                href={`https://scan.test.btcs.network/tx/${notification.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 mt-2 inline-flex items-center space-x-1 font-medium"
              >
                <span>View transaction</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
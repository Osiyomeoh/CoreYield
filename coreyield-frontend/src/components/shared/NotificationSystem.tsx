import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  dismissible?: boolean
}

interface NotificationSystemProps {
  notifications: Notification[]
  onDismiss: (id: string) => void
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ notifications, onDismiss }) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />
      case 'error':
        return <XCircleIcon className="w-6 h-6 text-red-500" />
      case 'warning':
        return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />
      case 'info':
        return <InformationCircleIcon className="w-6 h-6 text-blue-500" />
      default:
        return <InformationCircleIcon className="w-6 h-6 text-gray-500" />
    }
  }

  const getBackgroundColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getTextColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-800'
      case 'error':
        return 'text-red-800'
      case 'warning':
        return 'text-yellow-800'
      case 'info':
        return 'text-blue-800'
      default:
        return 'text-gray-800'
    }
  }

  const getActionColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white'
      case 'error':
        return 'bg-red-600 hover:bg-red-700 text-white'
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white'
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 text-white'
      default:
        return 'bg-gray-600 hover:bg-gray-700 text-white'
    }
  }

  return createPortal(
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
          getIcon={getIcon}
          getBackgroundColor={getBackgroundColor}
          getTextColor={getTextColor}
          getActionColor={getActionColor}
        />
      ))}
    </div>,
    document.body
  )
}

interface NotificationItemProps {
  notification: Notification
  onDismiss: (id: string) => void
  getIcon: (type: Notification['type']) => React.ReactNode
  getBackgroundColor: (type: Notification['type']) => string
  getTextColor: (type: Notification['type']) => string
  getActionColor: (type: Notification['type']) => string
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onDismiss,
  getIcon,
  getBackgroundColor,
  getTextColor,
  getActionColor
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, notification.duration)

      return () => clearTimeout(timer)
    }
  }, [notification.duration])

  const handleDismiss = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      onDismiss(notification.id)
    }, 300)
  }

  if (!isVisible) return null

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
        ${getBackgroundColor(notification.type)}
        border rounded-lg shadow-lg p-4 max-w-sm w-full
      `}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${getTextColor(notification.type)}`}>
            {notification.title}
          </div>
          <div className={`mt-1 text-sm ${getTextColor(notification.type)} opacity-90`}>
            {notification.message}
          </div>
          
          {notification.action && (
            <div className="mt-3">
              <button
                onClick={notification.action.onClick}
                className={`
                  inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md
                  transition-colors duration-200
                  ${getActionColor(notification.type)}
                `}
              >
                {notification.action.label}
              </button>
            </div>
          )}
        </div>
        
        {(notification.dismissible !== false) && (
          <div className="flex-shrink-0">
            <button
              onClick={handleDismiss}
              className={`
                inline-flex items-center justify-center w-5 h-5 rounded-md
                ${getTextColor(notification.type)} opacity-60 hover:opacity-100
                transition-opacity duration-200
              `}
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationSystem

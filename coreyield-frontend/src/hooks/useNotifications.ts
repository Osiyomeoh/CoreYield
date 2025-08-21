import { useState, useCallback } from 'react'
import { Notification } from '../components/shared/NotificationSystem'

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newNotification: Notification = { ...notification, id }
    
    setNotifications(prev => [newNotification, ...prev])
    
    // Auto-remove after duration or default to 5 seconds
    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(id)
      }, notification.duration || 5000)
    }
    
    return id
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const showSuccess = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'success',
      title,
      message,
      duration: 4000,
      ...options
    })
  }, [addNotification])

  const showError = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'error',
      title,
      message,
      duration: 6000, // Errors stay longer
      ...options
    })
  }, [addNotification])

  const showWarning = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      duration: 5000,
      ...options
    })
  }, [addNotification])

  const showInfo = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'info',
      title,
      message,
      duration: 4000,
      ...options
    })
  }, [addNotification])

  const showTransactionNotification = useCallback((
    type: 'pending' | 'success' | 'failed',
    hash: string,
    message: string,
    options?: Partial<Notification>
  ) => {
    const baseOptions = {
      duration: type === 'pending' ? 0 : (type === 'success' ? 4000 : 6000),
      dismissible: type !== 'pending',
      action: type === 'pending' ? {
        label: 'View on Explorer',
        onClick: () => {
          // Open explorer in new tab
          window.open(`https://scan.test2.btcs.network/tx/${hash}`, '_blank')
        }
      } : undefined
    }

    switch (type) {
      case 'pending':
        return showInfo('Transaction Submitted', message, { ...baseOptions, ...options })
      case 'success':
        return showSuccess('Transaction Successful', message, { ...baseOptions, ...options })
      case 'failed':
        return showError('Transaction Failed', message, { ...baseOptions, ...options })
      default:
        return showInfo('Transaction Update', message, { ...baseOptions, ...options })
    }
  }, [showInfo, showSuccess, showError])

  const showApprovalNotification = useCallback((
    type: 'pending' | 'success' | 'failed',
    token: string,
    spender: string,
    options?: Partial<Notification>
  ) => {
    const message = `Approving ${token} for ${spender}`
    
    switch (type) {
      case 'pending':
        return showInfo('Approval Submitted', message, { duration: 0, ...options })
      case 'success':
        return showSuccess('Approval Successful', message, { duration: 3000, ...options })
      case 'failed':
        return showError('Approval Failed', message, { duration: 6000, ...options })
      default:
        return showInfo('Approval Update', message, options)
    }
  }, [showInfo, showSuccess, showError])

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showTransactionNotification,
    showApprovalNotification
  }
}

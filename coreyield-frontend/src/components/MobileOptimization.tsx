import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'

import { ASSET_METADATA } from '@contracts/addresses'


interface MobileQuickAction {
  id: string
  title: string
  description: string
  icon: string
  action: () => void
  color: string
}

interface MobileNotification {
  id: string
  type: 'success' | 'warning' | 'info' | 'error'
  title: string
  message: string
  timestamp: Date
  isRead: boolean
}

export const MobileOptimization: React.FC = () => {
  const { address, isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'actions' | 'notifications' | 'settings'>('dashboard')
  const [selectedAsset, setSelectedAsset] = useState<'stCORE' | 'lstBTC' | 'dualCORE'>('stCORE')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)



  // Mobile quick actions
  const [quickActions] = useState<MobileQuickAction[]>([
    {
      id: '1',
      title: 'Quick Deposit',
      description: 'Deposit assets in one tap',
      icon: '💰',
      action: () => console.log('Quick deposit'),
      color: 'from-green-500 to-green-600'
    },
    {
      id: '2',
      title: 'Split Tokens',
      description: 'Split SY into PT and YT',
      icon: '✂️',
      action: () => console.log('Split tokens'),
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: '3',
      title: 'Claim Yield',
      description: 'Claim accumulated yield',
      icon: '🎯',
      action: () => console.log('Claim yield'),
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: '4',
      title: 'Portfolio View',
      description: 'View your positions',
      icon: '📊',
      action: () => console.log('Portfolio view'),
      color: 'from-orange-500 to-orange-600'
    }
  ])

  // Mobile notifications
  const [notifications] = useState<MobileNotification[]>([
    {
      id: '1',
      type: 'success',
      title: 'Yield Claimed!',
      message: 'Successfully claimed 15.2 CORE from your YT tokens',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isRead: false
    },
    {
      id: '2',
      type: 'info',
      title: 'New Market Available',
      message: 'dualCORE market is now live with 18.5% APY',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      isRead: true
    },
    {
      id: '3',
      type: 'warning',
      title: 'Low Balance Alert',
      message: 'Your stCORE balance is below 100 tokens',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
      isRead: true
    }
  ])

  // Touch/swipe handling
  useEffect(() => {
    let startX = 0
    let startY = 0

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX
      const endY = e.changedTouches[0].clientY
      
      const diffX = startX - endX
      const diffY = startY - endY
      
      // Only handle horizontal swipes
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0) {
          setSwipeDirection('left')
          // Swipe left - next tab
          const tabs = ['dashboard', 'actions', 'notifications', 'settings']
          const currentIndex = tabs.indexOf(activeTab)
          const nextIndex = (currentIndex + 1) % tabs.length
          setActiveTab(tabs[nextIndex] as any)
        } else {
          setSwipeDirection('right')
          // Swipe right - previous tab
          const tabs = ['dashboard', 'actions', 'notifications', 'settings']
          const currentIndex = tabs.indexOf(activeTab)
          const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length
          setActiveTab(tabs[prevIndex] as any)
        }
        
        // Reset swipe direction after animation
        setTimeout(() => setSwipeDirection(null), 300)
      }
    }

    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [activeTab])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅'
      case 'warning': return '⚠️'
      case 'info': return 'ℹ️'
      case 'error': return '❌'
      default: return '📢'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-500 bg-green-500/10'
      case 'warning': return 'border-yellow-500 bg-yellow-500/10'
      case 'info': return 'border-blue-500 bg-blue-500/10'
      case 'error': return 'border-red-500 bg-red-500/10'
      default: return 'border-gray-500 bg-gray-500/10'
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">📱</span>
          </div>
          <h2 className="text-2xl font-bold mb-4">Connect Wallet for Mobile Experience</h2>
          <p className="text-gray-400 text-center">Connect your wallet to access the mobile-optimized CoreYield interface</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-gray-900 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-white"
          >
            <span className="text-xl">☰</span>
          </button>
          
          <h1 className="text-lg font-bold text-white">CoreYield</h1>
          
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-sm font-bold">💰</span>
          </div>
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="flex border-b border-gray-700 bg-gray-900 sticky top-16 z-40">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: '📊' },
          { id: 'actions', label: 'Actions', icon: '⚡' },
          { id: 'notifications', label: 'Alerts', icon: '🔔' },
          { id: 'settings', label: 'Settings', icon: '⚙️' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/10'
                : 'text-gray-400'
            }`}
          >
            <span className="text-lg mb-1">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content with Swipe Animation */}
      <div className={`transition-transform duration-300 ${
        swipeDirection === 'left' ? 'translate-x-full' : 
        swipeDirection === 'right' ? '-translate-x-full' : 'translate-x-0'
      }`}>
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="p-4 space-y-6">
            {/* Asset Selector */}
            <div className="flex space-x-2 p-1 bg-gray-800 rounded-xl overflow-x-auto">
              {Object.entries(ASSET_METADATA).map(([key, asset]) => (
                <button
                  key={key}
                  onClick={() => setSelectedAsset(key as any)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                    selectedAsset === key
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {asset.name}
                </button>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-2xl text-center">
                <p className="text-green-100 text-sm">Current APY</p>
                <p className="text-white text-2xl font-bold">12.5%</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl text-center">
                <p className="text-blue-100 text-sm">Total Value</p>
 <p className="text-white text-2xl font-bold">$1.2K</p>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={action.action}
                  className={`bg-gradient-to-br ${action.color} p-4 rounded-2xl text-center transition-transform active:scale-95`}
                >
                  <div className="text-3xl mb-2">{action.icon}</div>
                  <h3 className="text-white font-semibold text-sm mb-1">{action.title}</h3>
                  <p className="text-white/80 text-xs">{action.description}</p>
                </button>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800 rounded-2xl p-4">
              <h3 className="text-white font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-green-400 text-sm">💰</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">Yield claimed: 15.2 CORE</p>
                    <p className="text-gray-400 text-xs">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-blue-400 text-sm">✂️</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">Split 100 SY tokens</p>
                    <p className="text-gray-400 text-xs">5 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions Tab */}
        {activeTab === 'actions' && (
          <div className="p-4 space-y-6">
            <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
            
            {/* Action Cards */}
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">Deposit Assets</h3>
                    <p className="text-gray-400 text-sm">Deposit your assets to start earning yield</p>
                  </div>
                  <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">
                    Deposit
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">✂️</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">Split Tokens</h3>
                    <p className="text-gray-400 text-sm">Split SY tokens into PT and YT</p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
                    Split
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">Claim Yield</h3>
                    <p className="text-gray-400 text-sm">Claim your accumulated yield</p>
                  </div>
                  <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium">
                    Claim
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="p-4 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Notifications</h2>
              <button className="text-blue-400 text-sm">Mark all read</button>
            </div>
            
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border rounded-2xl p-4 ${getNotificationColor(notification.type)} ${
                    !notification.isRead ? 'ring-2 ring-blue-500/50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-white font-semibold">{notification.title}</h3>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm mb-2">{notification.message}</p>
                      <p className="text-gray-400 text-xs">
                        {notification.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="p-4 space-y-6">
            <h2 className="text-xl font-semibold text-white">Settings</h2>
            
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-2xl p-4">
                <h3 className="text-white font-semibold mb-4">Preferences</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Push Notifications</span>
                    <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Dark Mode</span>
                    <div className="w-12 h-6 bg-gray-600 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Auto-claim Yield</span>
                    <div className="w-12 h-6 bg-gray-600 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-2xl p-4">
                <h3 className="text-white font-semibold mb-4">Account</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Wallet Address</span>
                    <span className="text-blue-400 text-sm">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Network</span>
                    <span className="text-green-400 text-sm">CoreDAO</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-2xl p-4">
                <h3 className="text-white font-semibold mb-4">Support</h3>
                <div className="space-y-3">
                  <button className="w-full text-left text-gray-300 hover:text-white py-2">
                    📚 Documentation
                  </button>
                  <button className="w-full text-left text-gray-300 hover:text-white py-2">
                    💬 Help Center
                  </button>
                  <button className="w-full text-left text-gray-300 hover:text-white py-2">
                    🐛 Report Bug
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-2">
        <div className="flex justify-around">
          {[
            { id: 'dashboard', icon: '📊', label: 'Home' },
            { id: 'actions', icon: '⚡', label: 'Actions' },
            { id: 'notifications', icon: '🔔', label: 'Alerts' },
            { id: 'settings', icon: '⚙️', label: 'Settings' }
          ].map((item) => (
            <button
              key={item.id}
                              onClick={() => setActiveTab(item.id as 'dashboard' | 'actions' | 'notifications' | 'settings')}
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-colors ${
                activeTab === item.id
                  ? 'text-blue-400 bg-blue-400/10'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Swipe Indicator */}
      {swipeDirection && (
        <div className={`fixed top-1/2 transform -translate-y-1/2 z-50 text-6xl opacity-50 ${
          swipeDirection === 'left' ? 'right-8' : 'left-8'
        }`}>
          {swipeDirection === 'left' ? '👈' : '👉'}
        </div>
      )}
    </div>
  )
} 
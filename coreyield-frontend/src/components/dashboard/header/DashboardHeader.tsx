import React from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { IconComponent } from '../shared/IconComponent'

interface DashboardHeaderProps {
  currentView: 'markets' | 'trade' | 'portfolio' | 'pools'
  setCurrentView: (view: 'markets' | 'trade' | 'portfolio' | 'pools') => void
  autoRefresh: boolean
  setAutoRefresh: (enabled: boolean) => void
  showUSD: boolean
  setShowUSD: (show: boolean) => void
  globalStats: {
    totalTVL: string
    totalVolume24h: string
    activeMarkets: number
    totalUsers: string
  }
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  currentView,
  setCurrentView,
  autoRefresh,
  setAutoRefresh,
  showUSD,
  setShowUSD,
  globalStats
}) => {
  const navigationItems = [
    { id: 'markets', label: 'Markets', icon: 'ChartBarIcon' },
    { id: 'trade', label: 'Trade', icon: 'CurrencyDollarIcon' },
    { id: 'portfolio', label: 'Portfolio', icon: 'BriefcaseIcon' },
    { id: 'pools', label: 'Pools', icon: 'SwimmingPoolIcon' }
  ] as const

  return (
    <div className="bg-gray-900/95 backdrop-blur-md border-b border-gray-800/50 sticky top-0 z-50 w-full">
      {/* Main Header - Full Width */}
      <div className="w-full px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo Section - Left Side */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">CY</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">CoreYield</h1>
                <p className="text-xs text-gray-400">Core Network Yield Protocol</p>
              </div>
            </div>
          </div>

          {/* Center Navigation - Main Navigation Items */}
          <nav className="hidden xl:flex items-center space-x-1">
            {[
              { id: 'markets', label: 'Markets', icon: 'ChartBarIcon' },
              { id: 'pools', label: 'Pools', icon: 'SwimmingPoolIcon' },
              { id: 'points', label: 'Points Markets', icon: 'TargetIcon' },
              { id: 'dashboard', label: 'Dashboard', icon: 'TrendingUpIcon' },
              { id: 'vecore', label: 'veCORE', icon: 'LockClosedIcon' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                  currentView === item.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <IconComponent iconName={item.icon} className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Right Side - Actions and Wallet */}
          <div className="flex items-center space-x-3">
            {/* Action Buttons */}
            <button className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-sm">
              CoreSwap
            </button>
            <button className="px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-white font-medium rounded-lg transition-all duration-200 border border-gray-700/50 text-sm flex items-center space-x-2">
              <span>⚡</span>
              <span>Deploy Pool</span>
            </button>
            {/* Settings - Minimalist Approach */}
            <div className="relative group">
              <button className="p-3 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              
              {/* Clean Settings Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-56 bg-gray-800/95 backdrop-blur-md border border-gray-700/50 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Auto-refresh</span>
                    <button
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${
                        autoRefresh ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform absolute top-1 ${
                        autoRefresh ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Show USD</span>
                    <button
                      onClick={() => setShowUSD(!showUSD)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${
                        showUSD ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform absolute top-1 ${
                        showUSD ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Wallet Connection - Clean Design */}
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                mounted,
              }) => {
                const ready = mounted
                const connected = ready && account && chain

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      'style': {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                          >
                            Connect Wallet
                          </button>
                        )
                      }

                      if (chain.unsupported) {
                        return (
                          <button
                            onClick={openChainModal}
                            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors"
                          >
                            Wrong network
                          </button>
                        )
                      }

                      return (
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={openChainModal}
                            className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-white rounded-lg transition-colors border border-gray-700/50"
                          >
                            {chain.hasIcon && (
                              <div
                                style={{
                                  background: chain.iconBackground,
                                  width: 16,
                                  height: 16,
                                  borderRadius: 999,
                                  overflow: 'hidden',
                                }}
                              >
                                {chain.iconUrl && (
                                  <img
                                    alt={chain.name ?? 'Chain icon'}
                                    src={chain.iconUrl}
                                    style={{ width: 16, height: 16 }}
                                  />
                                )}
                              </div>
                            )}
                            <span className="text-sm">{chain.name}</span>
                          </button>

                          <button
                            onClick={openAccountModal}
                            className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-white rounded-lg transition-colors border border-gray-700/50"
                          >
                            <span className="text-sm font-medium">
                              {account.displayName}
                            </span>
                            {account.displayBalance && (
                              <span className="text-xs text-gray-400">
                                {account.displayBalance}
                              </span>
                            )}
                          </button>
                        </div>
                      )
                    })()}
                  </div>
                )
              }}
            </ConnectButton.Custom>
          </div>
        </div>

        {/* Mobile Navigation - Only show on mobile */}
        <div className="xl:hidden pb-4">
          <div className="flex items-center space-x-2 overflow-x-auto">
            {[
              { id: 'markets', label: 'Markets', icon: '📊' },
              { id: 'pools', label: 'Pools', icon: '🏊‍♂️' },
              { id: 'points', label: 'Points', icon: '🎯' },
              { id: 'dashboard', label: 'Dashboard', icon: '📈' },
              { id: 'vecore', label: 'veCORE', icon: '🔒' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as any)}
                className={`flex-shrink-0 px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 text-sm ${
                  currentView === item.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Navigation Bar - For additional actions */}
      <div className="border-t border-gray-800/50 bg-gray-900/50">
        <div className="w-full px-6 py-2">
          <div className="flex items-center justify-between">
            {/* Left side - Quick stats */}
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">TVL</span>
                <span className="text-white font-semibold">{globalStats.totalTVL}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">24h Volume</span>
                <span className="text-white font-semibold">{globalStats.totalVolume24h}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">Markets</span>
                <span className="text-white font-semibold">{globalStats.activeMarkets}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">Users</span>
                <span className="text-white font-semibold">{globalStats.totalUsers}</span>
              </div>
            </div>

            {/* Right side - Additional actions */}
            <div className="flex items-center space-x-3">
              <button className="px-3 py-1 bg-gray-800/50 hover:bg-gray-700/50 text-white text-xs rounded border border-gray-700/50 transition-colors">
                Analytics
              </button>
              <button className="px-3 py-1 bg-gray-800/50 hover:bg-gray-700/50 text-white text-xs rounded border border-gray-700/50 transition-colors">
                Docs
              </button>
            </div>
          </div>
        </div>
      </div>


    </div>
  )
}
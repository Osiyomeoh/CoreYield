import React, { useState, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useYieldProtocol } from '../hooks/useYieldProtocol'
import { useContractRead } from 'wagmi'
import { CONTRACTS, ASSET_METADATA } from '../../contracts/addresses'

interface MainDashboardProps {
  onBackToLanding: () => void
  onShowEducation?: (level?: 'beginner' | 'intermediate' | 'advanced') => void
  onOpenMobileMenu?: () => void
}

export const MainDashboard: React.FC<MainDashboardProps> = ({ onBackToLanding, onShowEducation, onOpenMobileMenu }) => {
  const [selectedAsset, setSelectedAsset] = useState<'stCORE' | 'lstBTC' | 'dualCORE'>('stCORE')
  const [amount, setAmount] = useState('')
  const [activeView, setActiveView] = useState<'markets' | 'pools' | 'dashboard'>('dashboard')
  const [dashboardTab, setDashboardTab] = useState<'invest' | 'portfolio' | 'earn' | 'manage' | 'transactions' | 'education'>('invest')
  const [assetFilter, setAssetFilter] = useState<'all' | 'pt' | 'yt' | 'lp'>('all')
  const [displayMode, setDisplayMode] = useState<'usd' | 'underlying'>('usd')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [lastAction, setLastAction] = useState<string>('')

  // Get real protocol stats
  const { data: protocolStats } = useContractRead({
    address: CONTRACTS.FACTORY as `0x${string}`,
    abi: [
      {
        name: 'getProtocolStats',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [
          { name: 'totalMarkets', type: 'uint256' },
          { name: 'activeMarkets', type: 'uint256' },
          { name: 'totalValueLocked', type: 'uint256' }
        ],
      },
    ],
    functionName: 'getProtocolStats',
  })

  // Get real data for all assets
  const stCOREHook = useYieldProtocol('stCORE')
  const lstBTCHook = useYieldProtocol('lstBTC')
  const dualCOREHook = useYieldProtocol('dualCORE')

  const currentHook = selectedAsset === 'stCORE' ? stCOREHook : 
                     selectedAsset === 'lstBTC' ? lstBTCHook : dualCOREHook

  // Refresh all balances after successful transactions
  useEffect(() => {
    if (currentHook.notification?.type === 'success') {
      // Refresh all hooks to update balances
      stCOREHook.refreshBalances()
      lstBTCHook.refreshBalances()
      dualCOREHook.refreshBalances()
    }
  }, [currentHook.notification, stCOREHook, lstBTCHook, dualCOREHook])

  const {
    isConnected,
    address,
    notification,
    assetBalance,
    syBalance,
    accumulatedYield,
    isMinting,
    isApproving,
    isDepositing,
    isWithdrawing,
    isClaimingYield,
    formatBalance,
    needsApproval,

    handleMintTestTokens,
    handleApprove,
    handleDeposit,
    handleWithdraw,
    handleClaimYield,
  } = currentHook

  if (!isConnected) {
    return (
                      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                  <div className="max-w-md w-full p-8 bg-gray-800 rounded-2xl border border-gray-700 text-center space-y-6 shadow-lg">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto">
                      <span className="text-white font-bold text-xl">CY</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">Connect Wallet</h2>
                      <p className="text-gray-400 text-sm">Connect your wallet to access CoreYield Protocol</p>
                    </div>
                    <ConnectButton />
                    <button onClick={onBackToLanding} className="text-gray-400 hover:text-white text-sm transition-colors">
                      ← Back to Landing
                    </button>
                  </div>
                </div>
    )
  }

  const hasTokens = assetBalance && (assetBalance as bigint) > 0n
  const hasSYTokens = syBalance && (syBalance as bigint) > 0n
  const hasYield = accumulatedYield && (accumulatedYield as bigint) > 0n

  // Calculate real metrics
  const totalPortfolioValue = (Number(stCOREHook.assetBalance || 0) + Number(lstBTCHook.assetBalance || 0) + Number(dualCOREHook.assetBalance || 0)) / 1e18
  const totalSYValue = (Number(stCOREHook.syBalance || 0) + Number(lstBTCHook.syBalance || 0) + Number(dualCOREHook.syBalance || 0)) / 1e18
  const totalClaimableYield = (Number(stCOREHook.accumulatedYield || 0) + Number(lstBTCHook.accumulatedYield || 0) + Number(dualCOREHook.accumulatedYield || 0)) / 1e18

                return (
                <div className="min-h-screen bg-gray-900 text-white">
                  {/* Exact Pendle Header */}
                  <header className="border-b border-gray-800 bg-gray-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-8">
                          <button onClick={onBackToLanding} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-teal-500 rounded-xl flex items-center justify-center">
                              <span className="text-white font-bold text-sm">CY</span>
                            </div>
                            <span className="text-white font-medium text-lg">CoreYield</span>
                          </button>

                          {/* Exact Pendle Navigation */}
                          <nav className="hidden md:flex items-center space-x-1">
                            {[
                              { id: 'markets', label: 'Markets', icon: '📈' },
                              { id: 'pools', label: 'Pools', icon: '🏊' },  
                              { id: 'dashboard', label: 'Dashboard', icon: '📊' }
                            ].map((tab) => (
                              <button
                                key={tab.id}
                                onClick={() => setActiveView(tab.id as any)}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                  activeView === tab.id
                                    ? 'bg-gray-800 text-white shadow-sm'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                                }`}
                              >
                                <span>{tab.label}</span>
                              </button>
                            ))}
                          </nav>
                        </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span>Core Testnet2</span>
              </div>
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Button - Positioned on far left */}
      <div className="relative">
        <button
          onClick={onOpenMobileMenu}
                                    className="fixed top-4 left-4 w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-white border border-gray-700 z-40 shadow-lg"
        >
          ☰
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Markets View - Exact Pendle Style */}
        {activeView === 'markets' && (
          <>
            {/* Page Header with Real Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Markets</h1>
                <p className="text-gray-400 text-sm sm:text-base">Discover yield opportunities across Core ecosystem</p>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-xl sm:text-2xl font-bold text-white">
                  {protocolStats ? Number(protocolStats[1]) : Object.keys(ASSET_METADATA).length}
                </div>
                <div className="text-sm text-gray-400">Active Markets</div>
              </div>
            </div>

            {/* Real Protocol Metrics - Pendle Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Total Value Locked */}
              <div className="bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-700/50 shadow-sm">
                <div className="flex items-center space-x-3 mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm text-gray-400 mb-1">Total Value Locked</div>
                    <div className="text-lg sm:text-2xl font-bold text-white">
                      ${(totalSYValue * 1.05).toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-green-400">Real protocol TVL</div>
              </div>

              {/* Active Markets */}
              <div className="bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-700/50 shadow-sm">
                <div className="flex items-center space-x-3 mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm text-gray-400 mb-1">Active Markets</div>
                    <div className="text-lg sm:text-2xl font-bold text-white">
                      {Object.keys(ASSET_METADATA).length}
                    </div>
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-blue-400">All assets available</div>
              </div>

              {/* Total Yield Generated */}
              <div className="bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-700/50 shadow-sm">
                <div className="flex items-center space-x-3 mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm text-gray-400 mb-1">Total Yield Generated</div>
                    <div className="text-lg sm:text-2xl font-bold text-white">
                      ${(totalClaimableYield * 1.05).toFixed(4)}
                    </div>
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-purple-400">Real yield earned</div>
              </div>
            </div>

            {/* Asset Markets - Real Data */}
            <div className="space-y-6">
              {Object.entries(ASSET_METADATA).map(([key, asset]) => {
                const hook = key === 'stCORE' ? stCOREHook : key === 'lstBTC' ? lstBTCHook : dualCOREHook
                const balance = Number(hook.assetBalance || 0) / 1e18
                const syTotalSupply = Number(hook.syBalance || 0) / 1e18

                return (
                  <div key={key} className="bg-gray-800 rounded-2xl border border-gray-700/50 overflow-hidden">
                    {/* Asset Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center -space-x-2">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full border-2 border-gray-800 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{asset.symbol.slice(0, 2)}</span>
                          </div>
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full border-2 border-gray-800 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">SY</span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-white">{asset.symbol}</h3>
                          <p className="text-gray-400 text-sm">{asset.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <div className="text-sm text-gray-400">Available Balance</div>
                          <div className="text-lg font-semibold text-white">
                            {balance.toFixed(2)} {asset.symbol}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">SY Balance</div>
                          <div className="text-lg font-semibold text-white">
                            {syTotalSupply.toFixed(2)} SY
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Market Table Header */}
                    <div className="px-6 py-4 bg-gray-850">
                      <div className="grid grid-cols-12 gap-4 text-sm text-gray-400 font-medium">
                        <div className="col-span-4">Market</div>
                        <div className="col-span-2 text-center">Your Balance</div>
                        <div className="col-span-2 text-center">APY</div>
                        <div className="col-span-2 text-center">Yield Earned</div>
                        <div className="col-span-2 text-center">Actions</div>
                      </div>
                    </div>

                    {/* Market Row with Real Data */}
                    <div className="px-6 py-4 hover:bg-gray-750 transition-colors">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-4 flex items-center space-x-3">
                          <div className="flex items-center -space-x-1">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full border border-gray-700 flex items-center justify-center text-xs font-bold text-white">
                              {asset.symbol[0]}
                            </div>
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full border border-gray-700 flex items-center justify-center text-xs font-bold text-white">
                              $
                            </div>
                          </div>
                          <div>
                            <div className="text-white font-medium">SY-{asset.symbol}</div>
                            <div className="text-xs text-gray-400">Perpetual • Core</div>
                          </div>
                        </div>

                        <div className="col-span-2 text-center">
                          <div className="text-white font-semibold">
                            {balance.toFixed(3)} {asset.symbol}
                          </div>
                          <div className="text-xs text-gray-400">
                            {syTotalSupply.toFixed(3)} SY
                          </div>
                        </div>

                        <div className="col-span-2 text-center">
                          <div className="text-green-400 font-semibold">{asset.apy}%</div>
                          <div className="text-xs text-gray-400">Current yield</div>
                        </div>

                        <div className="col-span-2 text-center">
                          <div className="text-purple-400 font-semibold">
                            {hook.formatBalance(hook.accumulatedYield as bigint)} SY
                          </div>
                          <div className="text-xs text-gray-400">Claimable</div>
                        </div>

                        <div className="col-span-2 text-center">
                          <button
                            onClick={() => {
                              setSelectedAsset(key as any)
                              setActiveView('dashboard')
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                          >
                            Manage
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Pools View */}
        {activeView === 'pools' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Liquidity Pools</h1>
                <p className="text-gray-400">Provide liquidity to earn trading fees and rewards</p>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-2xl p-12 border border-gray-700/50 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 opacity-60">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">Liquidity Pools Coming Soon</h3>
              <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                Advanced liquidity provisioning features are under development for enhanced yield opportunities
              </p>
              <div className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-600/30">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Q2 2025</span>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard View - Exact Pendle Clone with Real Data */}
        {activeView === 'dashboard' && (
          <div className="space-y-6 sm:space-y-8">
            {/* User Profile - Pendle Style */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg sm:text-xl">
                    {address?.slice(2, 4).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold text-white">
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Dashboard'}
                  </h1>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-400 text-xs sm:text-sm">Updated just now • Core Testnet</span>
                    {lastAction && (
                      <div className="flex items-center space-x-1 text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full ml-2">
                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                        <span>{lastAction}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="relative w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Go to wallet address"
                    className="w-full sm:w-80 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                  <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Enhanced Balance Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Current Balance - Enhanced */}
                              <div className="bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300 group">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div className="text-blue-400 font-medium text-sm sm:text-base">Portfolio Value</div>
                    </div>
                    <div className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                      +2.4%
                    </div>
                  </div>
                  <div className="text-2xl sm:text-4xl font-bold text-white mb-2">
                    ${(totalPortfolioValue * 1.05).toFixed(2)}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-400 mb-3">Across all assets</div>
                
                {/* Quick Asset Breakdown */}
                <div className="space-y-1">
                  {Object.entries(ASSET_METADATA).map(([key, asset]) => {
                    const hook = key === 'stCORE' ? stCOREHook : key === 'lstBTC' ? lstBTCHook : dualCOREHook
                    const balance = Number(hook.assetBalance || 0) / 1e18
                    return balance > 0 ? (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1">
                          <span>{asset.icon}</span>
                          <span className="text-gray-300">{asset.symbol}</span>
                        </div>
                        <span className="text-gray-400">${(balance * 1.05).toFixed(2)}</span>
                      </div>
                    ) : null
                  })}
                </div>
              </div>

              {/* Claimable Yield */}
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12z" />
                      </svg>
                    </div>
                    <div className="text-purple-400 font-medium">Claimable Yield</div>
                  </div>
                </div>
                <div className="text-4xl font-bold text-white mb-2">
                  ${(totalClaimableYield * 1.05).toFixed(4)}
                </div>
                <div className="text-sm text-gray-400 mb-3">From yield farming positions</div>
                
                {/* Asset Yield Carousel */}
                {totalClaimableYield > 0 && (() => {
                  const assetsWithYield = Object.entries(ASSET_METADATA).filter(([key, asset]) => {
                    const hook = key === 'stCORE' ? stCOREHook : key === 'lstBTC' ? lstBTCHook : dualCOREHook
                    return Number(hook.accumulatedYield || 0) / 1e18 > 0
                  })
                  
                  if (assetsWithYield.length === 0) return null
                  
                  return (
                    <div className="mt-3">
                      {/* Carousel Navigation Dots */}
                      <div className="flex justify-center space-x-1 mb-2">
                        {assetsWithYield.map(([key], index) => (
                          <button
                            key={key}
                            onClick={() => setSelectedAsset(key as any)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              selectedAsset === key ? 'bg-purple-500' : 'bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      
                      {/* Carousel Content */}
                      <div className="bg-gray-750/50 rounded-lg p-3">
                        {assetsWithYield.map(([key, asset]) => {
                          const hook = key === 'stCORE' ? stCOREHook : key === 'lstBTC' ? lstBTCHook : dualCOREHook
                          const assetYield = Number(hook.accumulatedYield || 0) / 1e18
                          
                          return (
                            <div
                              key={key}
                              className={`transition-all duration-300 ${
                                selectedAsset === key ? 'block' : 'hidden'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <span className="text-lg">{asset.icon}</span>
                                  <div>
                                    <div className="text-white font-medium">{asset.symbol}</div>
                                    <div className="text-gray-400 text-sm">${(assetYield * 1.05).toFixed(4)}</div>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => handleClaimYield()}
                                  disabled={isClaimingYield}
                                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                  {isClaimingYield ? 'Claiming...' : 'Claim Yield'}
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* SY Token Value - Enhanced */}
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700/50 hover:border-orange-500/30 transition-all duration-300 group cursor-pointer" onClick={() => setActiveView('pools')}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <div className="text-orange-400 font-medium">SY Positions</div>
                  </div>
                  <div className="text-xs text-orange-400 bg-orange-400/10 px-2 py-1 rounded-full">
                    Active
                  </div>
                </div>
                <div className="text-4xl font-bold text-white mb-2">
                  ${(totalSYValue * 1.05).toFixed(2)}
                </div>
                <div className="text-sm text-gray-400 mb-3">Earning yield positions</div>
                
                {/* Yield Rate Indicator */}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400">Avg APY</div>
                  <div className="text-sm font-semibold text-green-400">
                    {(() => {
                      const totalAPY = Object.values(ASSET_METADATA).reduce((sum, asset) => sum + asset.apy, 0)
                      const avgAPY = totalAPY / Object.keys(ASSET_METADATA).length
                      return avgAPY.toFixed(1) + '%'
                    })()}
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-gray-500 flex items-center">
                  <span>Click to manage positions</span>
                  <svg className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>





            {/* Main Dashboard Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex flex-wrap items-center gap-1 sm:space-x-1">
                {[
                  { id: 'invest', label: 'Invest', icon: '🚀' },
                  { id: 'portfolio', label: 'Portfolio', icon: '💼' },
                  { id: 'earn', label: 'Earn', icon: '💰' },
                  { id: 'manage', label: 'Manage', icon: '⚙️' },
                  { id: 'transactions', label: 'History', icon: '📋' },
                  { id: 'education', label: 'Learn', icon: '📚' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setDashboardTab(tab.id as any)}
                    className={`px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base ${
                      dashboardTab === tab.id
                        ? 'bg-gray-800 text-white border border-gray-700/50 shadow-sm'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    <span className="text-sm sm:text-base">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                {/* Asset Filter */}
                <div className="flex items-center space-x-1 bg-gray-800 rounded-xl p-1 border border-gray-700/50">
                  {[
                    { id: 'all', label: 'All Assets' },
                    { id: 'pt', label: 'PT' },
                    { id: 'yt', label: 'YT' },
                    { id: 'lp', label: 'LP' }
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setAssetFilter(filter.id as any)}
                      className={`px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                        assetFilter === filter.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* USD/Underlying Toggle */}
                <div className="flex items-center space-x-1 bg-gray-800 rounded-xl p-1 border border-gray-700/50">
                  <button 
                    onClick={() => setDisplayMode('usd')}
                    className={`px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                      displayMode === 'usd'
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    USD
                  </button>
                  <button 
                    onClick={() => setDisplayMode('underlying')}
                    className={`px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                      displayMode === 'underlying'
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Underlying
                  </button>
                </div>
              </div>
            </div>

                        {/* Tab Content */}
            <div className="bg-gray-800 rounded-2xl border border-gray-700/50 overflow-hidden">
              {/* Invest Tab - Conversion Focused */}
              {dashboardTab === 'invest' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-white mb-2">Start Investing</h3>
                    <p className="text-gray-400">Choose your assets and start earning yield today</p>
                  </div>
                  
                  {/* Portfolio Summary Cards */}
                  <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gray-750 rounded-xl p-4 border border-gray-700/50">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-white font-medium">Total Value</div>
                          <div className="text-2xl font-bold text-blue-400">${(totalPortfolioValue * 1.05).toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-750 rounded-xl p-4 border border-gray-700/50">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-white font-medium">Claimable Yield</div>
                          <div className="text-2xl font-bold text-purple-400">${(totalClaimableYield * 1.05).toFixed(4)}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-750 rounded-xl p-4 border border-gray-700/50">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-white font-medium">SY Positions</div>
                          <div className="text-2xl font-bold text-green-400">${(totalSYValue * 1.05).toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-750 rounded-xl p-4 border border-gray-700/50">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-white font-medium">Chain Balance</div>
                          <div className="text-2xl font-bold text-orange-400">{formatBalance(currentHook.coreBalance?.value as bigint)} CORE</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Investment Opportunities */}
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    {Object.entries(ASSET_METADATA)
                      .filter(([key, asset]) => {
                        if (assetFilter === 'all') return true
                        if (assetFilter === 'pt') return asset.symbol.includes('PT')
                        if (assetFilter === 'yt') return asset.symbol.includes('YT')
                        if (assetFilter === 'lp') return asset.symbol.includes('LP')
                        return true
                      })
                      .map(([key, asset]) => (
                      <div key={key} className="bg-gray-750 rounded-xl p-6 border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{asset.symbol.slice(0, 2)}</span>
                          </div>
                          <div>
                            <div className="text-white font-semibold">{asset.symbol}</div>
                            <div className="text-gray-400 text-sm">{asset.name}</div>
                          </div>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                          <div className="flex justify-between">
                            <span className="text-gray-400">APY</span>
                            <span className="text-green-400 font-semibold">{asset.apy}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Available</span>
                            <span className="text-white">{(() => {
                              const hook = key === 'stCORE' ? stCOREHook : key === 'lstBTC' ? lstBTCHook : dualCOREHook
                              return hook.formatBalance(hook.assetBalance as bigint) + ' ' + asset.symbol
                            })()}</span>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => {
                            setSelectedAsset(key as any)
                            setDashboardTab('manage')
                          }}
                          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                        >
                          Invest in {asset.symbol}
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="bg-gray-750 rounded-xl p-6 border border-gray-700/50">
                    <h4 className="text-lg font-semibold text-white mb-4">Why Invest with CoreYield?</h4>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400 mb-2">Up to 15%</div>
                        <div className="text-gray-400">Annual Yield</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400 mb-2">Instant</div>
                        <div className="text-gray-400">Liquidity</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400 mb-2">Secure</div>
                        <div className="text-gray-400">Smart Contracts</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Portfolio Tab */}
              {dashboardTab === 'portfolio' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-white mb-2">My Portfolio</h3>
                    <p className="text-gray-400">Your active yield farming positions</p>
                  </div>
                  
                  {hasSYTokens ? (
                    <div className="space-y-4">
                      {Object.entries(ASSET_METADATA).map(([key, asset]) => {
                        const hook = key === 'stCORE' ? stCOREHook : key === 'lstBTC' ? lstBTCHook : dualCOREHook
                        const balance = hook.syBalance
                        const accumulatedYield = hook.accumulatedYield
                        
                        if (!balance || balance === 0n) return null

                        return (
                          <div key={key} className="bg-gray-750 rounded-xl p-4 border border-gray-700/50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                  <span className="text-white font-bold text-sm">{asset.symbol.slice(0, 2)}</span>
                                </div>
                                <div>
                                  <div className="text-white font-medium">sy{asset.symbol}</div>
                                  <div className="text-gray-400 text-sm">{asset.name}</div>
                                </div>
                              </div>
                                                        <div className="text-right">
                            <div className="text-white font-semibold">
                              {displayMode === 'usd' ? `$${(Number(balance) / 1e18 * 1.05).toFixed(2)}` : `${hook.formatBalance(balance as bigint)} SY`}
                            </div>
                            <div className="text-sm text-green-400">+{asset.apy}% APY</div>
                          </div>
                          <div className="text-right">
                            <div className="text-purple-400 font-semibold">
                              {displayMode === 'usd' ? `$${(Number(accumulatedYield) / 1e18 * 1.05).toFixed(4)}` : `${hook.formatBalance(accumulatedYield as bigint)}`}
                            </div>
                            <div className="text-xs text-gray-400">Claimable</div>
                          </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6 opacity-60">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-semibold text-white mb-3">No Active Positions</h3>
                      <p className="text-gray-400 text-lg mb-6">Start earning yield by depositing your assets</p>
                      <button 
                        onClick={() => setDashboardTab('invest')}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
                      >
                        Start Investing
                      </button>
                    </div>
                  )}
                </div>
              )}



              {/* Earn Tab */}
              {dashboardTab === 'earn' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-white mb-2">Earn Yield</h3>
                    <p className="text-gray-400">View and claim your accumulated yield</p>
                  </div>
                  
                  {totalClaimableYield > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(ASSET_METADATA).map(([key, asset]) => {
                        const hook = key === 'stCORE' ? stCOREHook : key === 'lstBTC' ? lstBTCHook : dualCOREHook
                        const assetYield = Number(hook.accumulatedYield || 0) / 1e18
                        
                        if (assetYield === 0) return null
                        
                        return (
                          <div key={key} className="bg-gray-750 rounded-xl p-4 border border-gray-700/50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className="text-2xl">{asset.icon}</span>
                                <div>
                                  <div className="text-white font-medium">{asset.symbol}</div>
                                  <div className="text-gray-400 text-sm">{asset.name}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-semibold text-purple-400">
                                  {displayMode === 'usd' ? `$${(assetYield * 1.05).toFixed(4)}` : `${assetYield.toFixed(6)} SY`}
                                </div>
                                <div className="text-sm text-gray-400">Claimable Yield</div>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedAsset(key as any)
                                  handleClaimYield()
                                }}
                                disabled={isClaimingYield}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                              >
                                {isClaimingYield ? 'Claiming...' : 'Claim'}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6 opacity-60">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-semibold text-white mb-3">No Claimable Yield</h3>
                      <p className="text-gray-400 text-lg">Start earning yield by depositing assets</p>
                    </div>
                  )}
                </div>
              )}

              {/* Manage Tab */}
              {dashboardTab === 'manage' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-white mb-2">Manage Assets</h3>
                    <p className="text-gray-400">Deposit, withdraw, and manage your positions</p>
                  </div>
                  
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Asset Management</h3>
                    <select
                      value={selectedAsset}
                      onChange={(e) => setSelectedAsset(e.target.value as any)}
                      className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      {Object.entries(ASSET_METADATA).map(([key, asset]) => (
                        <option key={key} value={key}>{asset.symbol}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Deposit Section */}
                    <div className="space-y-4">
                      <h4 className="text-white font-medium flex items-center space-x-2">
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Deposit & Earn</span>
                      </h4>
                      
                      <div className="bg-gray-750 rounded-xl p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Available</span>
                          <span className="text-sm text-white">{formatBalance(assetBalance as bigint)} {ASSET_METADATA[selectedAsset].symbol}</span>
                        </div>
                        
                        <div className="space-y-3">
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.0"
                            className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                          />
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setAmount(formatBalance(assetBalance as bigint))}
                              className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm transition-colors"
                            >
                              Max
                            </button>
                          </div>
                          
                          {!hasTokens ? (
                            <button
                              onClick={handleMintTestTokens}
                              disabled={isMinting}
                              className="w-full px-4 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                            >
                              {isMinting ? 'Minting...' : `🎯 Mint 1,000 ${ASSET_METADATA[selectedAsset].symbol}`}
                            </button>
                          ) : needsApproval(amount) ? (
                            <button
                              onClick={() => handleApprove(amount)}
                              disabled={!amount || isApproving}
                              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                            >
                              {isApproving ? 'Approving...' : `Approve ${ASSET_METADATA[selectedAsset].symbol}`}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeposit(amount)}
                              disabled={!amount || isDepositing}
                              className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                            >
                              {isDepositing ? 'Depositing...' : `Deposit & Earn ${ASSET_METADATA[selectedAsset].apy}% APY`}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Withdraw Section */}
                    <div className="space-y-4">
                      <h4 className="text-white font-medium flex items-center space-x-2">
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                        <span>Withdraw</span>
                      </h4>
                      
                      <div className="bg-gray-750 rounded-xl p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">SY Balance</span>
                          <span className="text-sm text-white">{formatBalance(syBalance as bigint)} sy{ASSET_METADATA[selectedAsset].symbol}</span>
                        </div>
                        
                        {hasSYTokens ? (
                          <div className="space-y-3">
                            <input
                              type="number"
                              value={withdrawAmount}
                              onChange={(e) => setWithdrawAmount(e.target.value)}
                              placeholder="0.0"
                              max={formatBalance(syBalance as bigint)}
                              className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                            />
                            
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setWithdrawAmount((Number(formatBalance(syBalance as bigint)) * 0.25).toString())}
                                className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm transition-colors"
                              >
                                25%
                              </button>
                              <button
                                onClick={() => setWithdrawAmount((Number(formatBalance(syBalance as bigint)) * 0.5).toString())}
                                className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm transition-colors"
                              >
                                50%
                              </button>
                              <button
                                onClick={() => setWithdrawAmount(formatBalance(syBalance as bigint))}
                                className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm transition-colors"
                              >
                                Max
                              </button>
                            </div>
                            
                            <button
                              onClick={() => handleWithdraw(withdrawAmount)}
                              disabled={!withdrawAmount || parseFloat(withdrawAmount) > parseFloat(formatBalance(syBalance as bigint)) || isWithdrawing}
                              className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors"
                            >
                              {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
                            </button>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="text-gray-400 mb-2">No sy{ASSET_METADATA[selectedAsset].symbol} to withdraw</div>
                            <div className="text-sm text-gray-500">Deposit some {ASSET_METADATA[selectedAsset].symbol} first</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Claim Yield Section */}
                  {!!hasYield && (
                    <div className="mt-6 p-4 bg-purple-600/10 border border-purple-600/30 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-purple-400 font-medium">Claimable Yield Available</div>
                          <div className="text-2xl font-bold text-white mt-1">
                            {formatBalance(accumulatedYield as bigint)} sy{ASSET_METADATA[selectedAsset].symbol}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleClaimYield}
                            disabled={isClaimingYield || !accumulatedYield || accumulatedYield === 0n}
                            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                          >
                            {isClaimingYield ? 'Claiming...' : 'Claim Yield'}
                          </button>
                          <button
                            onClick={() => {
                              stCOREHook.refreshBalances()
                              lstBTCHook.refreshBalances()
                              dualCOREHook.refreshBalances()
                            }}
                            className="px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-semibold transition-colors"
                          >
                            ↻ Refresh
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Transactions Tab */}
              {dashboardTab === 'transactions' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-white mb-2">Transaction History</h3>
                    <p className="text-gray-400">Your recent transactions and activity</p>
                  </div>
                  
                  <div className="space-y-4">
                    {(() => {
                      // Show real transaction data when available
                      const hasRealTransactions = false // TODO: Implement real transaction tracking
                      
                      if (!hasRealTransactions) {
                        return (
                          <div className="text-center py-12">
                            <div className="w-20 h-20 bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6 opacity-60">
                              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <h3 className="text-2xl font-semibold text-white mb-3">No Transactions Yet</h3>
                            <p className="text-gray-400 text-lg mb-6">Your transaction history will appear here once you start using the protocol</p>
                            <button 
                              onClick={() => setDashboardTab('invest')}
                              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
                            >
                              Start Investing
                            </button>
                          </div>
                        )
                      }
                      
                      return [] // Return empty array for now - will be replaced with real transaction data
                    })()}
                  </div>
                </div>
              )}

              {/* Education Tab */}
              {dashboardTab === 'education' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-white mb-2">Education Center</h3>
                    <p className="text-gray-400">Learn about yield farming and CoreYield protocol</p>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gray-750 rounded-xl p-6 border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                          <span className="text-white text-xl">🌱</span>
                        </div>
                        <div>
                          <div className="text-white font-semibold">Beginner</div>
                          <div className="text-gray-400 text-sm">Learn the basics</div>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm mb-4">
                        Understand yield farming fundamentals, CoreYield protocol basics, and how to get started safely.
                      </p>
                      <button 
                        onClick={() => {
                          if (onShowEducation) {
                            onShowEducation('beginner')
                          } else {
                            // Fallback: open in new tab
                            window.open('https://coreyield-protocol.vercel.app/education?level=beginner', '_blank')
                          }
                        }}
                        className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                      >
                        Start Learning
                      </button>
                    </div>

                    <div className="bg-gray-750 rounded-xl p-6 border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                          <span className="text-white text-xl">📚</span>
                        </div>
                        <div>
                          <div className="text-white font-semibold">Intermediate</div>
                          <div className="text-gray-400 text-sm">Advanced strategies</div>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm mb-4">
                        Dive deeper into SY tokens, yield generation mechanisms, and risk management strategies.
                      </p>
                      <button 
                        onClick={() => {
                          if (onShowEducation) {
                            onShowEducation('intermediate')
                          } else {
                            // Fallback: open in new tab
                            window.open('https://coreyield-protocol.vercel.app/education?level=intermediate', '_blank')
                          }
                        }}
                        className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                      >
                        Learn More
                      </button>
                    </div>

                    <div className="bg-gray-750 rounded-xl p-6 border border-gray-700/50 hover:border-orange-500/30 transition-all duration-300">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                          <span className="text-white text-xl">🎓</span>
                        </div>
                        <div>
                          <div className="text-white font-semibold">Advanced</div>
                          <div className="text-gray-400 text-sm">Protocol mechanics</div>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm mb-4">
                        Master smart contract architecture, yield calculation mechanics, and optimization strategies.
                      </p>
                      <button 
                        onClick={() => {
                          if (onShowEducation) {
                            onShowEducation('advanced')
                          } else {
                            // Fallback: open in new tab
                            window.open('https://coreyield-protocol.vercel.app/education?level=advanced', '_blank')
                          }
                        }}
                        className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
                      >
                        Master Level
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-750 rounded-xl p-6 border border-gray-700/50">
                    <h4 className="text-lg font-semibold text-white mb-4">Quick Learning Path</h4>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                        <div className="flex-1">
                          <div className="text-white font-medium">Understand Yield Farming Basics</div>
                          <div className="text-gray-400 text-sm">Learn what yield farming is and how it works</div>
                        </div>
                        <div className="text-green-400 text-sm">5 min</div>
                      </div>
                      
                      <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                        <div className="flex-1">
                          <div className="text-white font-medium">Explore CoreYield Protocol</div>
                          <div className="text-gray-400 text-sm">Understand how SY tokens work</div>
                        </div>
                        <div className="text-green-400 text-sm">8 min</div>
                      </div>
                      
                      <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                        <div className="flex-1">
                          <div className="text-white font-medium">Start Your First Investment</div>
                          <div className="text-gray-400 text-sm">Deposit assets and start earning yield</div>
                        </div>
                        <div className="text-green-400 text-sm">3 min</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            
          </div>
        )}
      </div>

      {/* Notifications - Exact Pendle Style */}
      {notification && (
        <div className="fixed bottom-6 right-6 max-w-md z-50">
          <div className="bg-gray-800 border border-gray-700/50 rounded-2xl p-4 shadow-2xl backdrop-blur-sm">
            <div className="flex items-start space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                notification.type === 'success' ? 'bg-green-500 text-white' :
                notification.type === 'error' ? 'bg-red-500 text-white' :
                'bg-blue-500 text-white'
              }`}>
                {notification.type === 'success' ? '✓' : notification.type === 'error' ? '✕' : 'i'}
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
                    href={`https://scan.test2.btcs.network/tx/${notification.hash}`}
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
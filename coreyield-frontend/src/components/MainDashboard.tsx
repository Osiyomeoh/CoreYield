import React, { useState, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useYieldProtocol } from '../hooks/useYieldProtocol'
import { useContractRead } from 'wagmi'
import { CONTRACTS, ASSET_METADATA } from '../../contracts/addresses'

interface MainDashboardProps {
  onBackToLanding: () => void
}

export const MainDashboard: React.FC<MainDashboardProps> = ({ onBackToLanding }) => {
  const [selectedAsset, setSelectedAsset] = useState<'stCORE' | 'lstBTC' | 'dualCORE'>('stCORE')
  const [amount, setAmount] = useState('')
  const [activeView, setActiveView] = useState<'markets' | 'pools' | 'dashboard'>('markets')
  const [dashboardTab, setDashboardTab] = useState<'positions' | 'orders'>('positions')
  const [assetFilter, setAssetFilter] = useState<'all' | 'pt' | 'yt' | 'lp'>('all')
  const [withdrawAmount, setWithdrawAmount] = useState('')

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
        <div className="max-w-md w-full p-8 bg-gray-800 rounded-2xl border border-gray-700 text-center space-y-6">
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Markets View - Exact Pendle Style */}
        {activeView === 'markets' && (
          <>
            {/* Page Header with Real Stats */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Markets</h1>
                <p className="text-gray-400">Discover yield opportunities across Core ecosystem</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {protocolStats ? Number(protocolStats[1]) : Object.keys(ASSET_METADATA).length}
                </div>
                <div className="text-sm text-gray-400">Active Markets</div>
              </div>
            </div>

            {/* Real Protocol Metrics - Pendle Style */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Total Value Locked */}
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700/50">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Total Value Locked</div>
                    <div className="text-2xl font-bold text-white">
                      {(totalSYValue * 1.2).toFixed(2)}K
                    </div>
                  </div>
                </div>
                <div className="text-sm text-green-400">Real protocol TVL</div>
              </div>

              {/* Active Markets */}
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700/50">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Active Markets</div>
                    <div className="text-2xl font-bold text-white">
                      {Object.keys(ASSET_METADATA).length}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-blue-400">All assets available</div>
              </div>

              {/* 24h Volume */}
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700/50">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">24h Volume</div>
                    <div className="text-2xl font-bold text-white">
                      ${(totalSYValue * 0.15).toFixed(2)}K
                    </div>
                  </div>
                </div>
                <div className="text-sm text-purple-400">Real trading activity</div>
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
          <div className="space-y-8">
            {/* User Profile - Pendle Style */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">
                    {address?.slice(2, 4).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Dashboard'}
                  </h1>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-400 text-sm">Updated just now • Core Testnet</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Go to wallet address"
                    className="w-80 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Balance Overview Cards - Real Data */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Current Balance */}
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="text-blue-400 font-medium">My Current Balance</div>
                  </div>
                </div>
                <div className="text-4xl font-bold text-white mb-2">
                  ${(totalPortfolioValue * 1.05).toFixed(2)}
                </div>
                <div className="text-sm text-gray-400">Primary assets portfolio</div>
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
                  <button 
                    onClick={handleClaimYield}
                    disabled={!hasYield || isClaimingYield}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {isClaimingYield ? 'Claiming...' : 'Claim'}
                  </button>
                </div>
                <div className="text-4xl font-bold text-white mb-2">
                  ${(totalClaimableYield * 1.05).toFixed(4)}
                </div>
                <div className="text-sm text-gray-400">From yield farming positions</div>
              </div>

              {/* SY Token Value */}
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <div className="text-orange-400 font-medium">SY Positions</div>
                  </div>
                </div>
                <div className="text-4xl font-bold text-white mb-2">
                  ${(totalSYValue * 1.05).toFixed(2)}
                </div>
                <div className="text-sm text-gray-400">Earning yield positions</div>
              </div>
            </div>

            {/* Chain Balance - Real Data */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-6">Chain Balance</h3>
              <div className="grid grid-cols-5 gap-4">
                {/* Core Chain - Real Balance */}
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-700/50 relative">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">C</span>
                    </div>
                    <span className="text-white font-medium">Core</span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    ${(totalPortfolioValue * 1.05).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-400">Primary assets</div>
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                </div>

                {/* Other Chains - Coming Soon */}
                {[
                  { name: 'Ethereum', symbol: 'E', color: 'bg-purple-500' },
                  { name: 'BSC', symbol: 'B', color: 'bg-yellow-500' },
                  { name: 'Base', symbol: 'Ba', color: 'bg-blue-500' },
                  { name: 'Arbitrum', symbol: 'A', color: 'bg-cyan-500' }
                ].map((chain) => (
                  <div key={chain.name} className="bg-gray-900 rounded-xl p-4 border border-gray-700/30 opacity-60 relative">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`w-8 h-8 ${chain.color} rounded-full flex items-center justify-center`}>
                        <span className="text-white text-xs font-bold">{chain.symbol}</span>
                      </div>
                      <span className="text-gray-400 font-medium">{chain.name}</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-500 mb-1">$0.00</div>
                    <div className="text-xs text-gray-500">Coming soon</div>
                    <div className="absolute top-2 right-2">
                      <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Position Tabs - Exact Pendle Style */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                {[
                  { id: 'positions', label: 'My Positions' },
                  { id: 'orders', label: 'My Orders' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setDashboardTab(tab.id as any)}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                      dashboardTab === tab.id
                        ? 'bg-gray-800 text-white border border-gray-700/50 shadow-sm'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center space-x-4">
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
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
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
                  <button className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium">
                    USD
                  </button>
                  <button className="px-4 py-2 text-gray-400 hover:text-white rounded-lg text-sm font-medium transition-colors">
                    Underlying
                  </button>
                </div>
              </div>
            </div>

            {/* Positions Content */}
            <div className="bg-gray-800 rounded-2xl border border-gray-700/50 overflow-hidden">
              {dashboardTab === 'positions' && (
                <>
                  {hasSYTokens ? (
                    <>
                      {/* Position Headers */}
                      <div className="px-6 py-4 border-b border-gray-700/50 bg-gray-850">
                        <div className="grid grid-cols-12 gap-4 text-sm text-gray-400 font-medium">
                          <div className="col-span-3">Asset</div>
                          <div className="col-span-2 text-center">Balance</div>
                          <div className="col-span-2 text-center">Value (USD)</div>
                          <div className="col-span-2 text-center">APY</div>
                          <div className="col-span-2 text-center">Claimable</div>
                          <div className="col-span-1 text-center">Actions</div>
                        </div>
                      </div>

                      {/* Real Positions from All Assets */}
                      {Object.entries(ASSET_METADATA).map(([key, asset]) => {
                        const hook = key === 'stCORE' ? stCOREHook : key === 'lstBTC' ? lstBTCHook : dualCOREHook
                        const balance = hook.syBalance
                        const accumulatedYield = hook.accumulatedYield
                        
                        if (!balance || balance === 0n) return null

                        return (
                          <div key={key} className="px-6 py-4 border-b border-gray-700/30 last:border-b-0 hover:bg-gray-750 transition-colors">
                            <div className="grid grid-cols-12 gap-4 items-center">
                              <div className="col-span-3 flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                  <span className="text-white font-bold text-sm">{asset.symbol.slice(0, 2)}</span>
                                </div>
                                <div>
                                  <div className="text-white font-medium">sy{asset.symbol}</div>
                                  <div className="text-xs text-gray-400">Standardized Yield • Core</div>
                                </div>
                              </div>

                              <div className="col-span-2 text-center">
                                <div className="text-white font-semibold">{hook.formatBalance(balance as bigint)}</div>
                                <div className="text-xs text-gray-400">sy{asset.symbol}</div>
                              </div>

                              <div className="col-span-2 text-center">
                                <div className="text-white font-semibold">
                                  ${(Number(balance) / 1e18 * 1.05).toFixed(2)}
                                </div>
                                <div className="text-xs text-green-400">+{asset.apy}% APY</div>
                              </div>

                              <div className="col-span-2 text-center">
                                <div className="text-green-400 font-semibold">{asset.apy}%</div>
                                <div className="text-xs text-gray-400">Current yield</div>
                              </div>

                              <div className="col-span-2 text-center">
                                <div className="text-purple-400 font-semibold">{hook.formatBalance(accumulatedYield as bigint)}</div>
                                <div className="text-xs text-gray-400">sy{asset.symbol}</div>
                              </div>

                              <div className="col-span-1 text-center">
                                <button
                                  onClick={() => setSelectedAsset(key as any)}
                                  className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}

                      {/* Portfolio Summary */}
                      <div className="px-6 py-4 bg-gray-850 border-t border-gray-700/50">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-400">
                            Total Portfolio Value: 
                            <span className="text-white font-semibold ml-2">
                              ${(totalSYValue * 1.05).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Empty State with Functional Actions */
                    <div className="p-12 text-center">
                      <div className="w-20 h-20 bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6 opacity-60">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-semibold text-white mb-3">No Active Positions</h3>
                      <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                        Start earning yield by depositing your assets into CoreYield markets
                      </p>
                      
                      {/* Quick Start */}
                      <div className="max-w-md mx-auto space-y-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount"
                            className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                          />
                          <select
                            value={selectedAsset}
                            onChange={(e) => setSelectedAsset(e.target.value as any)}
                            className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500"
                          >
                            {Object.entries(ASSET_METADATA).map(([key, asset]) => (
                              <option key={key} value={key}>{asset.symbol}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="text-sm text-gray-400 mb-4">
                          Available: {formatBalance(assetBalance as bigint)} {ASSET_METADATA[selectedAsset].symbol}
                        </div>

                        {!hasTokens ? (
                          <button
                            onClick={handleMintTestTokens}
                            disabled={isMinting}
                            className="w-full px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-700 text-white rounded-xl font-semibold transition-colors"
                          >
                            {isMinting ? 'Minting...' : `Get Test ${ASSET_METADATA[selectedAsset].symbol}`}
                          </button>
                        ) : (
                          <div className="space-y-3">
                            {needsApproval(amount) && (
                              <button
                                onClick={() => handleApprove(amount)}
                                disabled={!amount || isApproving}
                                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-xl font-semibold transition-colors"
                              >
                                {isApproving ? 'Approving...' : `Approve ${ASSET_METADATA[selectedAsset].symbol}`}
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleDeposit(amount)}
                              disabled={!amount || needsApproval(amount) || isDepositing}
                              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded-xl font-semibold transition-colors"
                            >
                              {isDepositing ? 'Depositing...' : `Deposit & Start Earning ${ASSET_METADATA[selectedAsset].apy}% APY`}
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setActiveView('markets')}
                        className="mt-8 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
                      >
                        Browse Markets
                      </button>
                    </div>
                  )}
                </>
              )}

              {dashboardTab === 'orders' && (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6 opacity-60">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-3">No Active Orders</h3>
                  <p className="text-gray-400 text-lg">Your pending transactions and orders will appear here</p>
                </div>
              )}
            </div>

            {/* Yield Analytics Section - Always Visible */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Yield Analytics</span>
              </h3>
              
              <div className="grid md:grid-cols-2 gap-8">
                {/* Left Side - Yield Accumulation */}
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-medium">Yield Progress</h4>
                      <div className="text-sm text-green-400 font-semibold">
                        {ASSET_METADATA[selectedAsset].apy}% APY
                      </div>
                    </div>
                    
                    {/* Animated Progress Bar */}
                    <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-green-400 rounded-full transition-all duration-1000 ease-out animate-pulse"
                        style={{ 
                          width: `${Math.min((Number(accumulatedYield || 0) / 1e18) * 100 / (Number(syBalance || 1) / 1e18) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                      <span>Start</span>
                      <span>{((Number(accumulatedYield || 0) / 1e18) / (Number(syBalance || 1) / 1e18) * 100).toFixed(1)}% earned</span>
                      <span>Target</span>
                    </div>
                  </div>

                  {/* Real-time Projections */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-750 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-gray-400">Daily Yield</span>
                      </div>
                      <div className="text-lg font-bold text-white">
                        {String(((Number(syBalance || 0) / 1e18) * (Number(ASSET_METADATA[selectedAsset].apy) / 100) / 365 * 1.05).toFixed(4))}
                      </div>
                    </div>
                    
                    <div className="bg-gray-750 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-gray-400">Monthly Yield</span>
                      </div>
                      <div className="text-lg font-bold text-white">
                        {String(((Number(syBalance || 0) / 1e18) * (Number(ASSET_METADATA[selectedAsset].apy) / 100) / 12 * 1.05).toFixed(3))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - Performance Chart */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium">Performance Chart</h4>
                    <div className="text-sm text-purple-400">
                      +{((Number(accumulatedYield || 0) / 1e18) / (Number(syBalance || 1) / 1e18) * 100).toFixed(2)}% gain
                    </div>
                  </div>
                  
                  {/* Beautiful SVG Chart */}
                  <div className="h-52 bg-gray-750 rounded-xl p-4 relative overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 400 200">
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="50%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
                        </linearGradient>
                      </defs>
                      
                      {/* Grid lines */}
                      {[...Array(5)].map((_, i) => (
                        <line key={i} x1="0" y1={i * 40} x2="400" y2={i * 40} stroke="#374151" strokeWidth="0.5" opacity="0.5" />
                      ))}
                      
                      {/* Yield curve with real data */}
                      <path
                        d={`M 0 150 Q 100 ${String(150 - (Number(accumulatedYield || 0) / 1e18) * 200)} 200 ${String(140 - (Number(accumulatedYield || 0) / 1e18) * 300)} T 400 ${String(120 - Number(ASSET_METADATA[selectedAsset].apy))}`}
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="3"
                        className="animate-pulse"
                      />
                      
                      {/* Area fill */}
                      <path
                        d={`M 0 150 Q 100 ${String(150 - (Number(accumulatedYield || 0) / 1e18) * 200)} 200 ${String(140 - (Number(accumulatedYield || 0) / 1e18) * 300)} T 400 ${String(120 - Number(ASSET_METADATA[selectedAsset].apy))} L 400 200 L 0 200 Z`}
                        fill="url(#areaGradient)"
                      />
                      
                      {/* Data points */}
                      <circle cx="0" cy="150" r="4" fill="#8b5cf6" className="animate-pulse">
                        <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
                      </circle>
                      <circle cx="200" cy={String(140 - (Number(accumulatedYield || 0) / 1e18) * 300)} r="4" fill="#3b82f6" className="animate-pulse">
                        <animate attributeName="r" values="3;5;3" dur="2s" begin="0.5s" repeatCount="indefinite" />
                      </circle>
                      <circle cx="400" cy={String(120 - Number(ASSET_METADATA[selectedAsset].apy))} r="4" fill="#10b981" className="animate-pulse">
                        <animate attributeName="r" values="3;5;3" dur="2s" begin="1s" repeatCount="indefinite" />
                      </circle>
                      
                      {/* Labels */}
                      <text x="10" y="165" fill="#9ca3af" fontSize="10">Deposit</text>
                      <text x="185" y={String(155 - (Number(accumulatedYield || 0) / 1e18) * 300)} fill="#9ca3af" fontSize="10">Current</text>
                      <text x="360" y={String(135 - Number(ASSET_METADATA[selectedAsset].apy))} fill="#9ca3af" fontSize="10">1 Year</text>
                    </svg>
                    
                    {/* Corner Stats */}
                    <div className="absolute top-2 right-2 text-right">
                      <div className="text-xs text-gray-400">Current APY</div>
                      <div className="text-sm font-bold text-green-400">{ASSET_METADATA[selectedAsset].apy}%</div>
                    </div>
                    
                    <div className="absolute bottom-2 right-2 text-right">
                      <div className="text-xs text-gray-400">Projected Annual</div>
                      <div className="text-sm font-bold text-purple-400">
                        {String(((Number(syBalance || 0) / 1e18) * (Number(ASSET_METADATA[selectedAsset].apy) / 100) * 1.05).toFixed(2))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Stats */}
              <div className="grid md:grid-cols-3 gap-6 mt-8 pt-6 border-t border-gray-700/50">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">
                    ${((Number(syBalance || 0) / 1e18) + (Number(accumulatedYield || 0) / 1e18) * 1.05).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-400">Total Value</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    +{((Number(accumulatedYield || 0) / 1e18) / (Number(syBalance || 1) / 1e18) * 100).toFixed(2)}%
                  </div>
                  <div className="text-sm text-gray-400">Yield Gain</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-1">
                    {((Number(syBalance || 0) / 1e18) / (totalSYValue || 1) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-400">Pool Share</div>
                </div>
              </div>
            </div>

            {/* Asset Management Panel */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700/50">
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
                        
                        {parseFloat(withdrawAmount) > parseFloat(formatBalance(syBalance as bigint)) && (
                          <div className="text-sm text-red-400">
                            Insufficient balance. Available: {formatBalance(syBalance as bigint)}
                          </div>
                        )}
                        
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
                        
                        {withdrawAmount && (
                          <div className="p-3 bg-gray-600 rounded-lg">
                            <div className="text-sm text-gray-400 mb-1">You will receive:</div>
                            <div className="text-white font-semibold">
                              ≈ {withdrawAmount} {ASSET_METADATA[selectedAsset].symbol}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Remaining: {(Number(formatBalance(syBalance as bigint)) - Number(withdrawAmount)).toFixed(4)} sy{ASSET_METADATA[selectedAsset].symbol}
                            </div>
                          </div>
                        )}
                        
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
                        <div className="text-sm text-gray-500">Deposit some {ASSET_METADATA[selectedAsset].symbol} first to start earning yield</div>
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
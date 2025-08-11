import React, { useState, useEffect, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { formatUnits } from 'viem'
import { ASSET_METADATA } from '@contracts/addresses'
import { useYieldProtocol } from '../hooks/useYieldProtocol'

interface YieldData {
  timestamp: number
  apy: number
  tvl: number
  volume: number
}

interface ProtocolStats {
  totalMarkets: number
  activeMarkets: number
  totalValueLocked: number
  totalYieldDistributed: number
  averageAPY: number
  uniqueUsers: number
}

export const Analytics: React.FC = () => {
  const { address, isConnected } = useAccount()
  const [selectedAsset, setSelectedAsset] = useState<'stCORE' | 'lstBTC' | 'dualCORE'>('stCORE')
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '1y'>('7d')
  const [yieldData, setYieldData] = useState<YieldData[]>([])


  // Get hooks for all assets
  const stCOREHook = useYieldProtocol('stCORE')
  const lstBTCHook = useYieldProtocol('lstBTC')
  const dualCOREHook = useYieldProtocol('dualCORE')

  const currentHook = selectedAsset === 'stCORE' ? stCOREHook : selectedAsset === 'lstBTC' ? lstBTCHook : dualCOREHook

  // Mock protocol stats (in real implementation, fetch from contracts)
  const protocolStats: ProtocolStats = useMemo(() => ({
    totalMarkets: 3,
    activeMarkets: 3,
    totalValueLocked: 1250000, // $1.25M
    totalYieldDistributed: 45000, // $45K
    averageAPY: 12.5,
    uniqueUsers: 127
  }), [])

  // Generate mock yield data for demonstration
  useEffect(() => {
    const generateYieldData = () => {
      const now = Date.now()
      const data: YieldData[] = []
      
      for (let i = 0; i < 30; i++) {
        const timestamp = now - (29 - i) * 24 * 60 * 60 * 1000
        const baseAPY = 12.5
        const volatility = (Math.random() - 0.5) * 4 // ±2% volatility
        const apy = Math.max(0, baseAPY + volatility)
        
        data.push({
          timestamp,
          apy: parseFloat(apy.toFixed(2)),
          tvl: 1000000 + Math.random() * 500000, // $1M - $1.5M
          volume: 50000 + Math.random() * 100000 // $50K - $150K
        })
      }
      
      setYieldData(data)
    }

    generateYieldData()
  }, [timeRange])

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    if (yieldData.length === 0) return null

    const currentAPY = yieldData[yieldData.length - 1]?.apy || 0
    const previousAPY = yieldData[0]?.apy || 0
    const apyChange = currentAPY - previousAPY
    const apyChangePercent = previousAPY > 0 ? (apyChange / previousAPY) * 100 : 0

    const avgAPY = yieldData.reduce((sum, data) => sum + data.apy, 0) / yieldData.length
    const maxAPY = Math.max(...yieldData.map(d => d.apy))
    const minAPY = Math.min(...yieldData.map(d => d.apy))

    return {
      currentAPY,
      apyChange,
      apyChangePercent,
      avgAPY: parseFloat(avgAPY.toFixed(2)),
      maxAPY,
      minAPY,
      volatility: parseFloat(((maxAPY - minAPY) / avgAPY * 100).toFixed(2))
    }
  }, [yieldData])

  /**
   * Calculate user's portfolio performance metrics
   * Combines SY, PT, and YT balances to provide comprehensive portfolio view
   * Includes yield accumulation and estimated APY calculations
   */
  const userPortfolio = useMemo(() => {
    if (!isConnected || !address) return null

    // Ensure we have valid bigint values with explicit typing
    const syBalance: bigint = (currentHook?.syBalance as bigint) ?? 0n
    const ptBalance: bigint = (currentHook?.ptBalance as bigint) ?? 0n
    const ytBalance: bigint = (currentHook?.ytBalance as bigint) ?? 0n
    const accumulatedYield: bigint = (currentHook?.accumulatedYield as bigint) ?? 0n

    const totalValue = (Number(formatUnits(syBalance, 18)) * 1) + // Assuming 1:1 ratio for demo
                      (Number(formatUnits(ptBalance, 18)) * 0.95) + // PT slightly discounted
                      (Number(formatUnits(ytBalance, 18)) * 0.05) // YT value from yield

    return {
      syBalance: formatUnits(syBalance, 18),
      ptBalance: formatUnits(ptBalance, 18),
      ytBalance: formatUnits(ytBalance, 18),
      accumulatedYield: formatUnits(accumulatedYield, 18),
      totalValue: parseFloat(totalValue.toFixed(2)),
      estimatedAPY: performanceMetrics?.currentAPY || 0
    }
  }, [isConnected, address, currentHook, performanceMetrics])

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Wallet to View Analytics</h2>
          <p className="text-gray-400">Connect your wallet to access detailed yield analytics and performance metrics</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">CoreYield Analytics</h1>
          <p className="text-gray-400 text-lg">Comprehensive yield farming analytics and performance tracking</p>
        </div>

        {/* Asset Selector */}
        <div className="mb-8">
          <div className="flex space-x-2 p-1 bg-gray-800 rounded-xl">
            {Object.entries(ASSET_METADATA).map(([key, asset]) => (
              <button
                key={key}
                onClick={() => setSelectedAsset(key as 'stCORE' | 'lstBTC' | 'dualCORE')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  selectedAsset === key
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {asset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Protocol Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Value Locked</p>
                <p className="text-white text-2xl font-bold">${(protocolStats.totalValueLocked / 1000000).toFixed(2)}M</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/30 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-700 p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Average APY</p>
                <p className="text-white text-2xl font-bold">{protocolStats.averageAPY}%</p>
              </div>
              <div className="w-12 h-12 bg-green-500/30 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Yield Distributed</p>
                <p className="text-white text-2xl font-bold">${(protocolStats.totalYieldDistributed / 1000).toFixed(1)}K</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/30 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-600 to-orange-700 p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Active Users</p>
                <p className="text-white text-2xl font-bold">{protocolStats.uniqueUsers}</p>
              </div>
              <div className="w-12 h-12 bg-orange-500/30 rounded-xl flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* APY Chart */}
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">APY Performance</h3>
              <div className="flex space-x-2">
                {(['24h', '7d', '30d', '1y'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      timeRange === range
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-64 flex items-end justify-between space-x-1">
              {yieldData.map((data, index) => (
                <div
                  key={index}
                  className="flex-1 bg-gradient-to-t from-blue-500 to-blue-600 rounded-t"
                  style={{
                    height: `${(data.apy / 20) * 100}%`, // Scale to max 20% APY
                    minHeight: '4px'
                  }}
                  title={`${data.apy}% APY on ${new Date(data.timestamp).toLocaleDateString()}`}
                />
              ))}
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-gray-400 text-sm">APY over time</p>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-6">Performance Metrics</h3>
            
            {performanceMetrics && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Current APY</span>
                  <span className="text-2xl font-bold text-green-400">{performanceMetrics.currentAPY}%</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">APY Change</span>
                  <span className={`text-lg font-semibold ${
                    performanceMetrics.apyChangePercent >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {performanceMetrics.apyChangePercent >= 0 ? '+' : ''}{performanceMetrics.apyChangePercent.toFixed(2)}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Average APY</span>
                  <span className="text-lg font-semibold text-blue-400">{performanceMetrics.avgAPY}%</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Volatility</span>
                  <span className="text-lg font-semibold text-orange-400">{performanceMetrics.volatility}%</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Range</span>
                  <span className="text-sm text-gray-300">
                    {performanceMetrics.minAPY}% - {performanceMetrics.maxAPY}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Portfolio */}
        {userPortfolio && (
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 mb-8">
            <h3 className="text-xl font-semibold text-white mb-6">Your Portfolio</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">💎</span>
                </div>
                <p className="text-gray-400 text-sm">SY Balance</p>
                <p className="text-white text-xl font-bold">{userPortfolio.syBalance}</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🔒</span>
                </div>
                <p className="text-gray-400 text-sm">PT Balance</p>
                <p className="text-white text-xl font-bold">{userPortfolio.ptBalance}</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🎯</span>
                </div>
                <p className="text-gray-400 text-sm">YT Balance</p>
                <p className="text-white text-xl font-bold">{userPortfolio.ytBalance}</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">💰</span>
                </div>
                <p className="text-gray-400 text-sm">Total Value</p>
                <p className="text-white text-xl font-bold">${userPortfolio.totalValue}</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gray-700/50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Estimated Annual Yield</span>
                <span className="text-2xl font-bold text-green-400">
                  ${(userPortfolio.totalValue * userPortfolio.estimatedAPY / 100).toFixed(2)}
                </span>
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Based on current APY of {userPortfolio.estimatedAPY}%
              </div>
            </div>
          </div>
        )}

        {/* Market Comparison */}
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-6">Market Comparison</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Asset</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Current APY</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">TVL</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Volume (24h)</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(ASSET_METADATA).map(([key, asset]) => (
                  <tr key={key} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-bold">{asset.symbol[0]}</span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{asset.name}</p>
                          <p className="text-gray-400 text-sm">{asset.symbol}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-green-400 font-semibold">
                        {(12.5 + Math.random() * 5).toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white">
                      ${(Math.random() * 500000 + 200000).toFixed(0)}
                    </td>
                    <td className="py-3 px-4 text-white">
                      ${(Math.random() * 100000 + 50000).toFixed(0)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        key === 'stCORE' ? 'bg-green-500/20 text-green-400' :
                        key === 'lstBTC' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-orange-500/20 text-orange-400'
                      }`}>
                        {key === 'stCORE' ? 'Low' : key === 'lstBTC' ? 'Medium' : 'High'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
} 
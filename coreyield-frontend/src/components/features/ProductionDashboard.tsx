import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  DollarSign, 
  Shield, 
  Zap,
  BarChart3,
  PieChart,
  Activity,
  Users,
  Coins,
  ArrowUpRight,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useAccount } from 'wagmi'

const ProductionDashboard: React.FC = () => {
  const { isConnected } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [viewMode, setViewMode] = useState<'overview' | 'markets' | 'portfolio' | 'analytics'>('overview')
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  
  const [markets, setMarkets] = useState([
    { id: 'stCORE-30D', name: 'Staked CORE 30 Day', apy: 8.5, tvl: '1250000', users: 156, change24h: 0.8 },
    { id: 'lstBTC-90D', name: 'Liquid Staked BTC 90 Day', apy: 12.2, tvl: '890000', users: 89, change24h: 1.2 },
    { id: 'dualCORE-180D', name: 'Dual CORE 180 Day', apy: 15.8, tvl: '2100000', users: 234, change24h: 2.1 }
  ])
  
  const [protocolStats, setProtocolStats] = useState({
    totalValueLocked: '4240000',
    totalMarkets: 3,
    activeUsers: 479,
    averageAPY: 12.17,
    change24h: 12.5,
    change7d: 8.2
  })

  const updateData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setMarkets(prev => prev.map(market => ({
        ...market,
        apy: market.apy + (Math.random() - 0.5) * 0.2,
        tvl: (parseInt(market.tvl) + (Math.random() - 0.5) * 50000).toString(),
        users: market.users + Math.floor((Math.random() - 0.5) * 5)
      })))
      
      setProtocolStats(prev => ({
        ...prev,
        totalValueLocked: (parseInt(prev.totalValueLocked) + (Math.random() - 0.5) * 100000).toString(),
        averageAPY: prev.averageAPY + (Math.random() - 0.5) * 0.1
      }))
      
      setLastUpdated(new Date())
    } catch (err) {
      setError('Failed to refresh data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(updateData, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, updateData])

  useEffect(() => {
    updateData()
  }, [updateData])

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600">Please connect your wallet to access the CoreYield Dashboard</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-2"
              >
                <Zap className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">CoreYield</h1>
              </motion.div>
              <span className="text-sm text-gray-500">Production Dashboard</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Auto-refresh toggle */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="autoRefresh" className="text-sm text-gray-600">Auto-refresh</label>
              </div>
              
              {/* Last updated indicator */}
              <div className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
              
              <button
                onClick={updateData}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border-l-4 border-red-400 p-4"
        >
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
      
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'markets', label: 'Markets', icon: PieChart },
              { id: 'portfolio', label: 'Portfolio', icon: Coins },
              { id: 'analytics', label: 'Analytics', icon: Activity }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setViewMode(item.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  viewMode === item.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {viewMode === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Protocol Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Value Locked</p>
                    <p className="text-2xl font-bold text-gray-900">${(parseInt(protocolStats.totalValueLocked) / 1000000).toFixed(2)}M</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-green-600">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  <span>+{protocolStats.change24h}% from last week</span>
                </div>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Markets</p>
                    <p className="text-2xl font-bold text-gray-900">{protocolStats.totalMarkets}</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <PieChart className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-green-600">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  <span>+1 new market this week</span>
                </div>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900">{protocolStats.activeUsers}</p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-green-600">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  <span>+{protocolStats.change7d}% from last week</span>
                </div>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average APY</p>
                    <p className="text-2xl font-bold text-gray-900">{protocolStats.averageAPY.toFixed(2)}%</p>
                  </div>
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-green-600">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  <span>+2.1% from last week</span>
                </div>
              </motion.div>
            </div>
            
            {/* Market Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Market Overview</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {markets.map((market) => (
                    <motion.div
                      key={market.id}
                      whileHover={{ scale: 1.02 }}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{market.name}</h4>
                        <span className="px-2 py-1 rounded-full text-xs font-medium text-green-500 bg-green-100">
                          <CheckCircle className="w-4 h-4 inline mr-1" />
                          Active
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">APY:</span>
                          <span className="font-medium text-green-600">{market.apy.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">TVL:</span>
                          <span className="font-medium">${(parseInt(market.tvl) / 1000).toFixed(0)}K</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Users:</span>
                          <span className="font-medium">{market.users}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">24h Change:</span>
                          <span className={`font-medium ${market.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      
                      <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                        Invest Now
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Markets Tab */}
        {viewMode === 'markets' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">All Markets</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">APY</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TVL</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">24h Change</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {markets.map((market) => (
                      <tr key={market.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{market.name}</div>
                            <div className="text-sm text-gray-500">{market.id}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-green-600">{market.apy.toFixed(2)}%</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${(parseInt(market.tvl) / 1000).toFixed(0)}K</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{market.users}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${market.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-green-500 bg-green-100">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900">Invest</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Portfolio Tab */}
        {viewMode === 'portfolio' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Portfolio</h3>
              <div className="text-center text-gray-500">
                <Coins className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p>Portfolio tracking coming soon</p>
                <p className="text-sm">Connect your wallet to see your positions</p>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Analytics Tab */}
        {viewMode === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics Dashboard</h3>
              <div className="text-center text-gray-500">
                <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p>Advanced analytics coming soon</p>
                <p className="text-sm">Real-time charts and performance metrics</p>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}

export default ProductionDashboard 
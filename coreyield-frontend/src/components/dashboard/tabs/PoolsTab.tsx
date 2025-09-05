import React, { useState, useEffect, useMemo } from 'react'
import { useCoreYield } from '../../../hooks/useCoreYield'
import { CONTRACTS } from '@contracts/addresses'
import { formatUnits, parseEther } from 'viem'

// Custom CSS for professional slider
const sliderStyles = `
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    cursor: pointer;
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
    transition: all 0.2s ease;
  }
  
  .slider::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 12px rgba(59, 130, 246, 0.4);
  }
  
  .slider::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    cursor: pointer;
    border: none;
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
    transition: all 0.2s ease;
  }
  
  .slider::-moz-range-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 12px rgba(59, 130, 246, 0.4);
  }
`

const PoolsTab: React.FC = () => {
  const { 
    poolData, 
    createYieldStrategy, 
    harvestYield, 
    enableAutoCompound,
    getPortfolioAnalytics,
    addLiquidity,
    isLoading 
  } = useCoreYield()

  // For now, use console.error instead of toast since it's not available
  const showError = (message: string) => {
    console.error(message)
    // In a real app, you'd use a proper toast system
  }

  const [selectedAsset, setSelectedAsset] = useState('stCORE')
  const [strategyType, setStrategyType] = useState(1)
  const [targetAPY, setTargetAPY] = useState('8.5')
  const [riskTolerance, setRiskTolerance] = useState(5)
  const [rebalanceFrequency, setRebalanceFrequency] = useState(86400) // 1 day
  const [autoRebalance, setAutoRebalance] = useState(true)
  const [portfolioAnalytics, setPortfolioAnalytics] = useState<any>(null)
  
  // Liquidity state
  const [selectedPool, setSelectedPool] = useState('')
  const [ptAmount, setPtAmount] = useState('')
  const [ytAmount, setYtAmount] = useState('')
  const [showLiquidityModal, setShowLiquidityModal] = useState(false)
  
  // Filtering state
  const [selectedNetworks, setSelectedNetworks] = useState(['core'])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showFavorites, setShowFavorites] = useState(false)
  const [showPrime, setShowPrime] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [collapsedMarkets, setCollapsedMarkets] = useState<Record<string, boolean>>({})
  
  // Yield Strategy dropdown state
  const [showYieldStrategy, setShowYieldStrategy] = useState(false)

  // Network options
  const networks = [
    { id: 'core', name: 'Core', icon: '🔥', active: true },
    { id: 'ethereum', name: 'Ethereum', icon: '⚡', active: false },
    { id: 'arbitrum', name: 'Arbitrum', icon: '🔵', active: false },
    { id: 'polygon', name: 'Polygon', icon: '🟣', active: false },
    { id: 'optimism', name: 'Optimism', icon: '🔴', active: false },
    { id: 'base', name: 'Base', icon: '🔷', active: false },
    { id: 'bsc', name: 'BSC', icon: '🟡', active: false },
    { id: 'avalanche', name: 'Avalanche', icon: '🔺', active: false }
  ]

  // Category options
  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'stablecoin', name: 'Stablecoin' },
    { id: 'defi', name: 'DeFi' },
    { id: 'gaming', name: 'Gaming' },
    { id: 'meme', name: 'Meme' },
    { id: 'yield', name: 'Yield' }
  ]

  // Filtered pool data
  const filteredPoolData = useMemo(() => {
    let filtered = Object.entries(poolData)
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(([key, pool]) => 
        key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pool.underlying.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Network filter
    if (selectedNetworks.length > 0) {
      filtered = filtered.filter(([key, pool]) => 
        selectedNetworks.includes('core') // For now, all our pools are on Core
      )
    }
    
    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(([key, pool]) => {
        if (selectedCategory === 'stablecoin') return key.includes('stCORE')
        if (selectedCategory === 'defi') return key.includes('lstBTC')
        if (selectedCategory === 'yield') return key.includes('dualCORE')
        return true
      })
    }
    
    // Prime filter (show only high TVL pools)
    if (showPrime) {
      filtered = filtered.filter(([key, pool]) => {
        const tvl = parseFloat(pool.tvl.replace('$', '').replace(',', ''))
        return tvl > 1000000 // $1M+ TVL
      })
    }
    
    return filtered
  }, [poolData, searchQuery, selectedNetworks, selectedCategory, showPrime])

  // Group pools by underlying asset
  const groupedPools = useMemo(() => {
    const groups: Record<string, Array<[string, any]>> = {}
    
    filteredPoolData.forEach(([key, pool]) => {
      const underlying = pool.underlying
      if (!groups[underlying]) {
        groups[underlying] = []
      }
      groups[underlying].push([key, pool])
    })
    
    return groups
  }, [filteredPoolData])

  // Toggle market collapse
  const toggleMarketCollapse = (underlying: string) => {
    setCollapsedMarkets(prev => ({
      ...prev,
      [underlying]: !prev[underlying]
    }))
  }

  // Clear all filters
  const clearFilters = () => {
    setSelectedNetworks(['core'])
    setSelectedCategory('all')
    setShowFavorites(false)
    setShowPrime(false)
    setSearchQuery('')
  }

  // Strategy types mapping
  const strategyTypes = [
    { id: 1, name: 'Buy & Hold', description: 'Long-term yield accumulation' },
    { id: 2, name: 'Yield Farming', description: 'Active yield optimization' },
    { id: 3, name: 'Arbitrage', description: 'Cross-market yield opportunities' },
    { id: 4, name: 'Hedging', description: 'Risk-managed yield strategies' },
    { id: 5, name: 'Momentum', description: 'Trend-following yield strategies' },
    { id: 6, name: 'Mean Reversion', description: 'Counter-trend yield strategies' },
    { id: 7, name: 'Grid Trading', description: 'Automated yield grid strategies' }
  ]

  // Fetch portfolio analytics
  const fetchPortfolioAnalytics = async () => {
    const analytics = await getPortfolioAnalytics()
    setPortfolioAnalytics(analytics)
  }

  useEffect(() => {
    fetchPortfolioAnalytics()
  }, [])

  // Create yield strategy
  const handleCreateStrategy = async () => {
    const assets = [CONTRACTS.MOCK_ASSETS[selectedAsset as keyof typeof CONTRACTS.MOCK_ASSETS]]
    const allocations = [100] // 100% allocation to selected asset
    
    await createYieldStrategy(
      strategyType,
      assets,
      allocations,
      parseFloat(targetAPY),
      riskTolerance,
      rebalanceFrequency,
      autoRebalance
    )
  }

  // Harvest yield
  const handleHarvestYield = async () => {
    await harvestYield(selectedAsset)
  }

  // Toggle auto-compound
  const handleToggleAutoCompound = async (enabled: boolean) => {
    await enableAutoCompound(selectedAsset, enabled)
  }

  // Add liquidity to a pool
  const handleAddLiquidity = async (asset: string) => {
    setSelectedPool(asset)
    setShowLiquidityModal(true)
  }

  // Submit liquidity addition
  const handleSubmitLiquidity = async () => {
    if (!ptAmount || !ytAmount) {
      showError('Please enter both PT and YT amounts')
      return
    }

    try {
      await addLiquidity(selectedPool, ptAmount, ytAmount)
      setShowLiquidityModal(false)
      setPtAmount('')
      setYtAmount('')
    } catch (error) {
      console.error('Failed to add liquidity:', error)
    }
  }

  return (
    <>
      <style>{sliderStyles}</style>
      <div className="space-y-8">
        {/* Main Content */}
        <div className="space-y-8">
          {/* Professional Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-3">Yield Strategies</h1>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed">
              Create and manage automated yield strategies for maximum returns. 
              Optimize your portfolio with advanced yield farming techniques.
            </p>
          </div>

          {/* Strategy Overview Cards - More Compact */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">🚀</div>
              <h3 className="text-white font-semibold text-base mb-1">Strategy Creation</h3>
              <p className="text-blue-200 text-xs">Build custom yield strategies</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">💰</div>
              <h3 className="text-white font-semibold text-base mb-1">Yield Harvesting</h3>
              <p className="text-green-200 text-xs">Collect earned yields</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">🔄</div>
              <h3 className="text-white font-semibold text-base mb-1">Auto-Compound</h3>
              <p className="text-purple-200 text-xs">Automated reinvestment</p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 border border-orange-500/30 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="text-white font-semibold text-base mb-1">Analytics</h3>
              <p className="text-orange-200 text-xs">Performance tracking</p>
            </div>
          </div>

          {/* Professional Strategy Creation Panel - More Compact */}
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden">
            {/* Collapsible Header */}
            <div 
              className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-700/30 transition-all"
              onClick={() => setShowYieldStrategy(!showYieldStrategy)}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-3">
                  <span className="text-xl">🎯</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Create Yield Strategy</h2>
                  <p className="text-gray-400 text-sm">Configure your strategy parameters</p>
                </div>
              </div>
              <button className="p-2 hover:bg-gray-700/50 rounded-lg transition-all">
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    showYieldStrategy ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {/* Collapsible Content */}
            {showYieldStrategy && (
              <div className="border-t border-gray-700/30 p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Strategy Configuration */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Asset</label>
                        <select 
                          value={selectedAsset}
                          onChange={(e) => setSelectedAsset(e.target.value)}
                          className="w-full bg-gray-800/80 border border-gray-600/50 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                        >
                          <option value="stCORE">stCORE</option>
                          <option value="lstBTC">lstBTC</option>
                          <option value="dualCORE">dualCORE</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Strategy Type</label>
                        <select 
                          value={strategyType}
                          onChange={(e) => setStrategyType(parseInt(e.target.value))}
                          className="w-full bg-gray-800/80 border border-gray-600/50 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                        >
                          {strategyTypes.map(type => (
                            <option key={type.id} value={type.id}>
                              {type.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Target APY (%)</label>
                      <input 
                        type="number"
                        value={targetAPY}
                        onChange={(e) => setTargetAPY(e.target.value)}
                        className="w-full bg-gray-800/80 border border-gray-600/50 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                        placeholder="8.5"
                        step="0.1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Risk Tolerance: {riskTolerance}/10</label>
                      <div className="relative">
                        <input 
                          type="range"
                          min="1"
                          max="10"
                          value={riskTolerance}
                          onChange={(e) => setRiskTolerance(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>Conservative</span>
                          <span>Balanced</span>
                          <span>Aggressive</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Rebalance Frequency</label>
                      <select 
                        value={rebalanceFrequency}
                        onChange={(e) => setRebalanceFrequency(parseInt(e.target.value))}
                        className="w-full bg-gray-800/80 border border-gray-600/50 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      >
                        <option value={3600}>1 Hour</option>
                        <option value={86400}>1 Day</option>
                        <option value={604800}>1 Week</option>
                        <option value={2592000}>1 Month</option>
                      </select>
                    </div>

                    <div className="flex items-center p-3 bg-gray-800/50 rounded-lg border border-gray-700/30">
                      <input 
                        type="checkbox"
                        checked={autoRebalance}
                        onChange={(e) => setAutoRebalance(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <label className="ml-2 text-sm font-medium text-gray-300">Enable Auto-rebalancing</label>
                    </div>

                    <button 
                      onClick={handleCreateStrategy}
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-4 rounded-xl transition-all transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed shadow-lg text-sm"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating Strategy...
                        </div>
                      ) : (
                        '🚀 Create Strategy'
                      )}
                    </button>
                  </div>

                  {/* Right Column - Strategy Preview & Management - More Compact */}
                  <div className="space-y-4">
                    {/* Strategy Preview */}
                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
                      <h3 className="text-base font-semibold text-white mb-3 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Strategy Preview
                      </h3>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center py-1 border-b border-gray-700/30">
                          <span className="text-gray-400">Asset:</span>
                          <span className="text-white font-medium">{selectedAsset}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-gray-700/30">
                          <span className="text-gray-400">Type:</span>
                          <span className="text-white font-medium">{strategyTypes.find(t => t.id === strategyType)?.name}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-gray-700/30">
                          <span className="text-gray-400">Target APY:</span>
                          <span className="text-green-400 font-medium">{targetAPY}%</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-gray-700/30">
                          <span className="text-gray-400">Risk Level:</span>
                          <span className={`font-medium ${
                            riskTolerance <= 3 ? 'text-green-400' : 
                            riskTolerance <= 7 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {riskTolerance <= 3 ? 'Low' : riskTolerance <= 7 ? 'Medium' : 'High'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-400">Auto-rebalance:</span>
                          <span className={`font-medium ${autoRebalance ? 'text-green-400' : 'text-red-400'}`}>
                            {autoRebalance ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions - More Compact */}
                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
                      <h3 className="text-base font-semibold text-white mb-3 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Quick Actions
                      </h3>
                      
                      <div className="space-y-2">
                        <button 
                          onClick={handleHarvestYield}
                          disabled={isLoading}
                          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium py-2 px-3 rounded-lg transition-all transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed text-sm"
                        >
                          💰 Harvest Yield
                        </button>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => handleToggleAutoCompound(true)}
                            disabled={isLoading}
                            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium py-2 px-3 rounded-lg transition-all transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed text-sm"
                          >
                            🔄 Enable
                          </button>
                          
                          <button 
                            onClick={() => handleToggleAutoCompound(false)}
                            disabled={isLoading}
                            className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium py-3 px-4 rounded-xl transition-all transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed text-sm"
                          >
                            ⏹️ Disable
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Professional Analytics Dashboard - More Compact */}
          {portfolioAnalytics && (
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-3">
                  <span className="text-xl">📊</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Portfolio Analytics</h2>
                  <p className="text-gray-400 text-sm">Real-time performance metrics</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xl">💰</div>
                    <div className="text-blue-400 text-xs">Total Value</div>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    ${portfolioAnalytics.totalValue || '0.00'}
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xl">📈</div>
                    <div className="text-green-400 text-xs">Total APY</div>
                  </div>
                  <div className="text-2xl font-bold text-green-400">
                    {portfolioAnalytics.totalAPY || '0.00'}%
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 border border-orange-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xl">⚠️</div>
                    <div className="text-orange-400 text-xs">Risk Score</div>
                  </div>
                  <div className="text-2xl font-bold text-orange-400">
                    {portfolioAnalytics.totalRisk || '0'}/10
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Filtering System */}
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mr-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Pool Discovery</h2>
                  <p className="text-gray-400">Find the best liquidity pools</p>
                </div>
              </div>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-all"
              >
                Clear Filters
              </button>
            </div>

            {/* Network Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Networks</h3>
              <div className="flex flex-wrap gap-3">
                {networks.map((network) => (
                  <button
                    key={network.id}
                    onClick={() => {
                      if (network.id === 'core') {
                        setSelectedNetworks(['core'])
                      }
                    }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all ${
                      selectedNetworks.includes(network.id)
                        ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                        : 'border-gray-600 bg-gray-700/50 text-gray-400 hover:border-gray-500'
                    } ${!network.active ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!network.active}
                  >
                    <span className="text-lg">{network.icon}</span>
                    <span className="font-medium">{network.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-gray-800/80 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPrime}
                    onChange={(e) => setShowPrime(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-300">Prime Only</span>
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search pools..."
                    className="w-full bg-gray-800/80 border border-gray-600/50 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Results Summary */}
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">
                  Showing <span className="text-white font-medium">{filteredPoolData.length}</span> pools
                </span>
                <span className="text-gray-400">
                  Total TVL: <span className="text-white font-medium">
                    ${Object.values(poolData).reduce((total, pool) => {
                      const tvl = parseFloat(pool.tvl.replace('$', '').replace(',', '') || '0')
                      return total + tvl
                    }, 0).toLocaleString()}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Professional Liquidity Pools */}
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mr-4">
                  <span className="text-2xl">💧</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Liquidity Pools</h2>
                  <p className="text-gray-400">Manage your liquidity positions</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const allCollapsed = Object.keys(groupedPools).every(key => collapsedMarkets[key])
                    const newState: Record<string, boolean> = {}
                    Object.keys(groupedPools).forEach(key => {
                      newState[key] = !allCollapsed
                    })
                    setCollapsedMarkets(newState)
                  }}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-all text-sm"
                >
                  {Object.keys(groupedPools).every(key => collapsedMarkets[key]) ? 'Expand All' : 'Collapse All'}
                </button>
              </div>
            </div>
            
            {viewMode === 'list' ? (
              /* List View - Similar to Pendle */
              <div className="space-y-4">
                {Object.entries(groupedPools).map(([underlying, pools]) => (
                  <div key={underlying} className="bg-gray-800/50 rounded-2xl border border-gray-700/30 overflow-hidden">
                    {/* Main Asset Header */}
                    <div 
                      className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-700/30 transition-all"
                      onClick={() => toggleMarketCollapse(underlying)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {underlying === '0xCf5Eb1CEcf54f792A89C81d3EF636AAc6f4F7B1A' ? '₿' : '🔥'}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-white">
                            {underlying === '0xCf5Eb1CEcf54f792A89C81d3EF636AAc6f4F7B1A' ? 'lstBTC' : 'stCORE'}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {pools.length} Market{pools.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-white font-medium">
                            ${pools.reduce((total, [key, pool]) => {
                              const tvl = parseFloat(pool.tvl.replace('$', '').replace(',', '') || '0')
                              return total + tvl
                            }, 0).toLocaleString()}
                          </div>
                          <div className="text-gray-400 text-sm">Total TVL</div>
                        </div>
                        <button className="p-2 hover:bg-gray-700/50 rounded-lg transition-all">
                          <svg 
                            className={`w-5 h-5 text-gray-400 transition-transform ${
                              collapsedMarkets[underlying] ? 'rotate-180' : ''
                            }`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Sub-markets (Collapsible) */}
                    {!collapsedMarkets[underlying] && (
                      <div className="border-t border-gray-700/30">
                        {pools.map(([marketKey, pool]) => (
                          <div key={marketKey} className="p-6 border-b border-gray-700/30 last:border-b-0 hover:bg-gray-700/30 transition-all">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                                  <span className="text-white text-sm font-bold">PT</span>
                                </div>
                                <div>
                                  <div className="text-white font-medium">{marketKey}</div>
                                  <div className="text-gray-400 text-sm">
                                    {new Date(pool.maturity * 1000).toLocaleDateString()} ({Math.ceil((pool.maturity - Date.now() / 1000) / 86400)} days)
                                  </div>
                                </div>
                              </div>
                              
                              <div className="text-center">
                                <div className="text-white font-medium">$0.00</div>
                                <div className="text-gray-400 text-sm">24h Volume</div>
                              </div>
                              
                              <div className="text-center">
                                <div className="text-white font-medium">{pool.tvl}</div>
                                <div className="text-gray-400 text-sm">Liquidity</div>
                                <div className="text-gray-500 text-xs">Total TVL: {pool.tvl}</div>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="text-center">
                                  <div className="text-green-400 font-medium">{pool.apy}</div>
                                  <div className="text-gray-400 text-sm">Best LP APY</div>
                                </div>
                                <button 
                                  onClick={() => handleAddLiquidity(marketKey)}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all text-sm"
                                >
                                  Add Liquidity
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* Grid View - Original Design */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(poolData).map(([asset, pool]) => (
                  <div key={asset} className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 border border-gray-600/50 rounded-2xl p-6 hover:border-gray-500/50 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xl font-semibold text-white">{pool.asset}</h4>
                      <span className="text-sm bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30">
                        PT/YT
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                        <span className="text-gray-400 text-sm">TVL:</span>
                        <span className="text-white font-medium">{pool.tvl}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                        <span className="text-gray-400 text-sm">Volume 24h:</span>
                        <span className="text-white font-medium">{pool.volume24h}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                        <span className="text-gray-400 text-sm">APY:</span>
                        <span className="text-green-400 font-medium">{pool.apy}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                        <span className="text-gray-400 text-sm">PT Reserves:</span>
                        <span className="text-white font-medium">{pool.ptReserves}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-400 text-sm">YT Reserves:</span>
                        <span className="text-white font-medium">{pool.ytReserves}</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleAddLiquidity(asset)}
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium py-3 px-4 rounded-xl transition-all transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed shadow-lg"
                    >
                      {isLoading ? 'Adding...' : 'Add Liquidity'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Liquidity Modal */}
          {showLiquidityModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800/90 rounded-2xl p-8 w-full max-w-md">
                <h3 className="text-2xl font-bold text-white mb-4">Add Liquidity to {selectedPool}</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">PT Amount</label>
                    <input 
                      type="number"
                      value={ptAmount}
                      onChange={(e) => setPtAmount(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="0.0"
                      step="0.000000000000000001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">YT Amount</label>
                    <input 
                      type="number"
                      value={ytAmount}
                      onChange={(e) => setYtAmount(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="0.0"
                      step="0.000000000000000001"
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button 
                      onClick={() => setShowLiquidityModal(false)}
                      className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSubmitLiquidity}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium py-3 px-6 rounded-xl transition-all"
                    >
                      {isLoading ? 'Adding...' : 'Add Liquidity'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default PoolsTab
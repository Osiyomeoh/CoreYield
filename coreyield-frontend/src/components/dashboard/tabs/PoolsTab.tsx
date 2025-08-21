import React, { useState, useEffect } from 'react'
import { useCoreYield } from '../../../hooks/useCoreYield'
import { CONTRACTS } from '@contracts/addresses'
import { formatUnits, parseEther } from 'viem'

const PoolsTab: React.FC = () => {
  const { 
    poolData, 
    createYieldStrategy, 
    harvestYield, 
    enableAutoCompound,
    getPortfolioAnalytics,
    isLoading 
  } = useCoreYield()

  const [selectedAsset, setSelectedAsset] = useState('stCORE')
  const [strategyType, setStrategyType] = useState(1)
  const [targetAPY, setTargetAPY] = useState('8.5')
  const [riskTolerance, setRiskTolerance] = useState(5)
  const [rebalanceFrequency, setRebalanceFrequency] = useState(86400) // 1 day
  const [autoRebalance, setAutoRebalance] = useState(true)
  const [portfolioAnalytics, setPortfolioAnalytics] = useState<any>(null)

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

  return (
    <div className="space-y-6">
      {/* Pools Header - Pendle Style */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Yield Strategies</h1>
        <p className="text-gray-400 text-base max-w-2xl mx-auto">
          Create and manage automated yield strategies for maximum returns. 
          Optimize your portfolio with advanced yield farming techniques.
        </p>
      </div>

      {/* Yield Optimization Panel */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🎯 Yield Optimization Panel</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strategy Creation */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-300">Create Yield Strategy</h4>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Asset</label>
              <select 
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="stCORE">stCORE</option>
                <option value="lstBTC">lstBTC</option>
                <option value="dualCORE">dualCORE</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Strategy Type</label>
              <select 
                value={strategyType}
                onChange={(e) => setStrategyType(parseInt(e.target.value))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                {strategyTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name} - {type.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Target APY (%)</label>
              <input 
                type="number"
                value={targetAPY}
                onChange={(e) => setTargetAPY(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                placeholder="8.5"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Risk Tolerance (1-10)</label>
              <input 
                type="range"
                min="1"
                max="10"
                value={riskTolerance}
                onChange={(e) => setRiskTolerance(parseInt(e.target.value))}
                className="w-full"
              />
              <span className="text-sm text-gray-400">{riskTolerance}/10</span>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Rebalance Frequency (seconds)</label>
              <select 
                value={rebalanceFrequency}
                onChange={(e) => setRebalanceFrequency(parseInt(e.target.value))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value={3600}>1 Hour</option>
                <option value={86400}>1 Day</option>
                <option value={604800}>1 Week</option>
                <option value={2592000}>1 Month</option>
              </select>
            </div>

            <div className="flex items-center">
              <input 
                type="checkbox"
                checked={autoRebalance}
                onChange={(e) => setAutoRebalance(e.target.checked)}
                className="mr-2"
              />
              <label className="text-sm text-gray-400">Auto-rebalance</label>
            </div>

            <button 
              onClick={handleCreateStrategy}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {isLoading ? 'Creating Strategy...' : '🚀 Create Strategy'}
            </button>
          </div>

          {/* Yield Management */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-300">Yield Management</h4>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Selected Asset</label>
              <div className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white">
                {selectedAsset}
              </div>
            </div>

            <button 
              onClick={handleHarvestYield}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {isLoading ? 'Harvesting...' : '💰 Harvest Yield'}
            </button>

            <div className="space-y-2">
              <button 
                onClick={() => handleToggleAutoCompound(true)}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {isLoading ? 'Enabling...' : '🔄 Enable Auto-Compound'}
              </button>
              
              <button 
                onClick={() => handleToggleAutoCompound(false)}
                disabled={isLoading}
                className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {isLoading ? 'Disabling...' : '⏹️ Disable Auto-Compound'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Analytics */}
      {portfolioAnalytics && (
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">📊 Portfolio Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Total Value</div>
              <div className="text-xl font-bold text-white">
                ${portfolioAnalytics.totalValue || '0.00'}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Total APY</div>
              <div className="text-xl font-bold text-green-400">
                {portfolioAnalytics.totalAPY || '0.00'}%
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Risk Score</div>
              <div className="text-xl font-bold text-orange-400">
                {portfolioAnalytics.totalRisk || '0'}/10
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Strategy Info */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">📈 Strategy Information</h3>
        <div className="text-gray-300 space-y-2">
          <p>• <strong>Buy & Hold:</strong> Long-term yield accumulation with minimal rebalancing</p>
          <p>• <strong>Yield Farming:</strong> Active yield optimization across multiple protocols</p>
          <p>• <strong>Arbitrage:</strong> Cross-market yield opportunities and price differences</p>
          <p>• <strong>Hedging:</strong> Risk-managed yield strategies with downside protection</p>
          <p>• <strong>Momentum:</strong> Trend-following yield strategies based on market movements</p>
          <p>• <strong>Mean Reversion:</strong> Counter-trend yield strategies for market corrections</p>
          <p>• <strong>Grid Trading:</strong> Automated yield grid strategies with systematic rebalancing</p>
        </div>
      </div>

      {/* Liquidity Pools */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">💧 Liquidity Pools</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(CONTRACTS.MARKETS).map(([asset, market]) => (
            <div key={asset} className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-white">{asset}</h4>
                <span className="text-sm text-gray-400">PT/YT</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">TVL:</span>
                  <span className="text-white">$0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Volume 24h:</span>
                  <span className="text-white">$0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">APY:</span>
                  <span className="text-green-400">0.00%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">My Liquidity:</span>
                  <span className="text-white">$0.00</span>
                </div>
              </div>
              
              <button className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                Add Liquidity
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PoolsTab
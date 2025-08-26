import React, { useState, useEffect } from 'react'
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
    <>
      <style>{sliderStyles}</style>
      <div className="space-y-8">
      {/* Professional Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-3">Yield Strategies</h1>
        <p className="text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed">
          Create and manage automated yield strategies for maximum returns. 
          Optimize your portfolio with advanced yield farming techniques.
        </p>
      </div>

      {/* Strategy Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-2xl p-6 text-center">
          <div className="text-3xl mb-3">🚀</div>
          <h3 className="text-white font-semibold text-lg mb-2">Strategy Creation</h3>
          <p className="text-blue-200 text-sm">Build custom yield strategies</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-2xl p-6 text-center">
          <div className="text-3xl mb-3">💰</div>
          <h3 className="text-white font-semibold text-lg mb-2">Yield Harvesting</h3>
          <p className="text-green-200 text-sm">Collect earned yields</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-2xl p-6 text-center">
          <div className="text-3xl mb-3">🔄</div>
          <h3 className="text-white font-semibold text-lg mb-2">Auto-Compound</h3>
          <p className="text-purple-200 text-sm">Automated reinvestment</p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 border border-orange-500/30 rounded-2xl p-6 text-center">
          <div className="text-3xl mb-3">📊</div>
          <h3 className="text-white font-semibold text-lg mb-2">Analytics</h3>
          <p className="text-orange-200 text-sm">Performance tracking</p>
        </div>
      </div>

      {/* Professional Strategy Creation Panel */}
      <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mr-4">
            <span className="text-2xl">🎯</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Create Yield Strategy</h2>
            <p className="text-gray-400">Configure your strategy parameters</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Strategy Configuration */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Asset</label>
                <select 
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  className="w-full bg-gray-800/80 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="stCORE">stCORE</option>
                  <option value="lstBTC">lstBTC</option>
                  <option value="dualCORE">dualCORE</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Strategy Type</label>
                <select 
                  value={strategyType}
                  onChange={(e) => setStrategyType(parseInt(e.target.value))}
                  className="w-full bg-gray-800/80 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
              <label className="block text-sm font-medium text-gray-300 mb-3">Target APY (%)</label>
              <input 
                type="number"
                value={targetAPY}
                onChange={(e) => setTargetAPY(e.target.value)}
                className="w-full bg-gray-800/80 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="8.5"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Risk Tolerance: {riskTolerance}/10</label>
              <div className="relative">
                <input 
                  type="range"
                  min="1"
                  max="10"
                  value={riskTolerance}
                  onChange={(e) => setRiskTolerance(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>Conservative</span>
                  <span>Balanced</span>
                  <span>Aggressive</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Rebalance Frequency</label>
              <select 
                value={rebalanceFrequency}
                onChange={(e) => setRebalanceFrequency(parseInt(e.target.value))}
                className="w-full bg-gray-800/80 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value={3600}>1 Hour</option>
                <option value={86400}>1 Day</option>
                <option value={604800}>1 Week</option>
                <option value={2592000}>1 Month</option>
              </select>
            </div>

            <div className="flex items-center p-4 bg-gray-800/50 rounded-xl border border-gray-700/30">
              <input 
                type="checkbox"
                checked={autoRebalance}
                onChange={(e) => setAutoRebalance(e.target.checked)}
                className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label className="ml-3 text-sm font-medium text-gray-300">Enable Auto-rebalancing</label>
            </div>

            <button 
              onClick={handleCreateStrategy}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Strategy...
                </div>
              ) : (
                '🚀 Create Strategy'
              )}
            </button>
          </div>

          {/* Right Column - Strategy Preview & Management */}
          <div className="space-y-6">
            {/* Strategy Preview */}
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/30">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Strategy Preview
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                  <span className="text-gray-400">Asset:</span>
                  <span className="text-white font-medium">{selectedAsset}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white font-medium">{strategyTypes.find(t => t.id === strategyType)?.name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                  <span className="text-gray-400">Target APY:</span>
                  <span className="text-green-400 font-medium">{targetAPY}%</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                  <span className="text-gray-400">Risk Level:</span>
                  <span className={`font-medium ${
                    riskTolerance <= 3 ? 'text-green-400' : 
                    riskTolerance <= 7 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {riskTolerance <= 3 ? 'Low' : riskTolerance <= 7 ? 'Medium' : 'High'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-400">Auto-rebalance:</span>
                  <span className={`font-medium ${autoRebalance ? 'text-green-400' : 'text-red-400'}`}>
                    {autoRebalance ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/30">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Quick Actions
              </h3>
              
              <div className="space-y-3">
                <button 
                  onClick={handleHarvestYield}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium py-3 px-4 rounded-xl transition-all transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                >
                  💰 Harvest Yield
                </button>
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleToggleAutoCompound(true)}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium py-3 px-4 rounded-xl transition-all transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                  >
                    🔄 Enable
                  </button>
                  
                  <button 
                    onClick={() => handleToggleAutoCompound(false)}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium py-3 px-4 rounded-xl transition-all transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                  >
                    ⏹️ Disable
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Analytics Dashboard */}
      {portfolioAnalytics && (
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mr-4">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Portfolio Analytics</h2>
              <p className="text-gray-400">Real-time performance metrics</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-2xl">💰</div>
                <div className="text-blue-400 text-sm">Total Value</div>
              </div>
              <div className="text-3xl font-bold text-white">
                ${portfolioAnalytics.totalValue || '0.00'}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-2xl">📈</div>
                <div className="text-green-400 text-sm">Total APY</div>
              </div>
              <div className="text-3xl font-bold text-green-400">
                {portfolioAnalytics.totalAPY || '0.00'}%
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 border border-orange-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-2xl">⚠️</div>
                <div className="text-orange-400 text-sm">Risk Score</div>
              </div>
              <div className="text-3xl font-bold text-orange-400">
                {portfolioAnalytics.totalRisk || '0'}/10
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Professional Strategy Guide */}
      <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4">
            <span className="text-2xl">📚</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Strategy Guide</h2>
            <p className="text-gray-400">Learn about different strategy types</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {strategyTypes.map((strategy) => (
            <div key={strategy.id} className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/30 hover:border-gray-600/50 transition-all">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">{strategy.name}</h3>
                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                  #{strategy.id}
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">{strategy.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Professional Liquidity Pools */}
      <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mr-4">
            <span className="text-2xl">💧</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Liquidity Pools</h2>
            <p className="text-gray-400">Manage your liquidity positions</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(CONTRACTS.MARKETS).map(([asset, market]) => (
            <div key={asset} className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 border border-gray-600/50 rounded-2xl p-6 hover:border-gray-500/50 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-semibold text-white">{asset}</h4>
                <span className="text-sm bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30">
                  PT/YT
                </span>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                  <span className="text-gray-400 text-sm">TVL:</span>
                  <span className="text-white font-medium">$0.00</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                  <span className="text-gray-400 text-sm">Volume 24h:</span>
                  <span className="text-white font-medium">$0.00</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
                  <span className="text-gray-400 text-sm">APY:</span>
                  <span className="text-green-400 font-medium">0.00%</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-400 text-sm">My Liquidity:</span>
                  <span className="text-white font-medium">$0.00</span>
                </div>
              </div>
              
              <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-4 rounded-xl transition-all transform hover:scale-105 shadow-lg">
                Add Liquidity
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  )
}

export default PoolsTab
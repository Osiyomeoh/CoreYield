import React, { useState, useEffect } from 'react'
import { useCoreYield } from '../../../hooks/useCoreYield'
import { CONTRACTS } from '@contracts/addresses'

const PortfolioTab: React.FC = () => {
  const { 
    portfolioData, 
    getPortfolioAnalytics, 
    getRiskAssessment,
    userStrategies,
    bridgeRequests,
    isLoading 
  } = useCoreYield()

  const [portfolioAnalytics, setPortfolioAnalytics] = useState<any>(null)
  const [riskProfile, setRiskProfile] = useState<any>(null)
  const [activeStrategies, setActiveStrategies] = useState<any[]>([])
  const [bridgeHistory, setBridgeHistory] = useState<any[]>([])

  // Fetch portfolio data
  const fetchPortfolioData = async () => {
    try {
      const analytics = await getPortfolioAnalytics()
      const risk = await getRiskAssessment()
      
      setPortfolioAnalytics(analytics)
      setRiskProfile(risk)
    } catch (error) {
      console.error('Failed to fetch portfolio data:', error)
    }
  }

  useEffect(() => {
    fetchPortfolioData()
  }, [])

  // Update strategies and bridge data when they change
  useEffect(() => {
    if (userStrategies) {
      setActiveStrategies(userStrategies as any[] || [])
    }
  }, [userStrategies])

  useEffect(() => {
    if (bridgeRequests) {
      setBridgeHistory(bridgeRequests as any[] || [])
    }
  }, [bridgeRequests])

  // Calculate portfolio metrics
  const calculatePortfolioMetrics = () => {
    if (!portfolioAnalytics) return null

    const totalValue = parseFloat(portfolioAnalytics.totalValue || '0')
    const totalAPY = parseFloat(portfolioAnalytics.totalAPY || '0')
    const totalRisk = parseInt(portfolioAnalytics.totalRisk || '0')

    return {
      totalValue,
      totalAPY,
      totalRisk,
      riskLevel: totalRisk <= 3 ? 'Low' : totalRisk <= 7 ? 'Medium' : 'High',
      riskColor: totalRisk <= 3 ? 'text-green-400' : totalRisk <= 7 ? 'text-yellow-400' : 'text-red-400'
    }
  }

  const metrics = calculatePortfolioMetrics()

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">📊 Portfolio Overview</h3>
        
        {metrics ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Total Portfolio Value</div>
              <div className="text-2xl font-bold text-white">
                ${metrics.totalValue.toFixed(2)}
              </div>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Total APY</div>
              <div className="text-2xl font-bold text-green-400">
                {metrics.totalAPY.toFixed(2)}%
              </div>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Risk Score</div>
              <div className={`text-2xl font-bold ${metrics.riskColor}`}>
                {metrics.totalRisk}/10
              </div>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Risk Level</div>
              <div className={`text-2xl font-bold ${metrics.riskColor}`}>
                {metrics.riskLevel}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400">Loading portfolio data...</div>
          </div>
        )}
      </div>

      {/* Asset Allocation */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🎯 Asset Allocation</h3>
        
        {portfolioAnalytics?.positions ? (
          <div className="space-y-4">
            {portfolioAnalytics.positions.map((position: any, index: number) => (
              <div key={index} className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">{position.token}</div>
                    <div className="text-sm text-gray-400">
                      Balance: {position.balance} | APY: {position.apy}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">${position.usdValue}</div>
                    <div className="text-sm text-gray-400">
                      Risk: {position.riskLevel}/10
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400">No asset positions found</div>
          </div>
        )}
      </div>

      {/* Active Strategies */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🚀 Active Strategies</h3>
        
        {activeStrategies.length > 0 ? (
          <div className="space-y-4">
            {activeStrategies.map((strategy: any, index: number) => (
              <div key={index} className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">Strategy #{strategy.id}</div>
                    <div className="text-sm text-gray-400">
                      Type: {strategy.strategyType} | Target APY: {strategy.targetAPY}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">${strategy.totalValue}</div>
                    <div className="text-sm text-gray-400">
                      Risk: {strategy.riskTolerance}/10
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Status:</span>
                      <span className="ml-2 text-green-400">Active</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Auto-rebalance:</span>
                      <span className="ml-2 text-white">
                        {strategy.autoRebalance ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400">No active strategies</div>
            <div className="text-sm text-gray-500 mt-2">
              Create your first yield strategy in the Pools tab
            </div>
          </div>
        )}
      </div>

      {/* Risk Assessment */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">⚠️ Risk Assessment</h3>
        
        {riskProfile ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400">Portfolio Risk</div>
                <div className="text-xl font-bold text-white">
                  {riskProfile.riskScore || '0'}/10
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400">Volatility</div>
                <div className="text-xl font-bold text-orange-400">
                  {riskProfile.volatility || '0'}%
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400">Max Drawdown</div>
                <div className="text-xl font-bold text-red-400">
                  {riskProfile.maxDrawdown || '0'}%
                </div>
              </div>
            </div>
            
            {riskProfile.recommendations && (
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-2">Risk Recommendations</div>
                <div className="text-white">
                  {riskProfile.recommendations}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400">Risk assessment data not available</div>
          </div>
        )}
      </div>

      {/* Bridge History */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🌉 Bridge History</h3>
        
        {bridgeHistory.length > 0 ? (
          <div className="space-y-4">
            {bridgeHistory.map((bridge: any, index: number) => (
              <div key={index} className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">
                      {bridge.sourceChain} → {bridge.targetChain}
                    </div>
                    <div className="text-sm text-gray-400">
                      Asset: {bridge.asset} | Amount: {bridge.amount}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">
                      {bridge.status === 'completed' ? '✅' : 
                       bridge.status === 'pending' ? '⏳' : '❌'} {bridge.status}
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(bridge.timestamp * 1000).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400">No bridge transactions</div>
            <div className="text-sm text-gray-500 mt-2">
              Bridge assets to other chains using the Bridge tab
            </div>
          </div>
        )}
      </div>

      {/* Performance Chart Placeholder */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">📈 Performance Chart</h3>
        <div className="text-center py-12">
          <div className="text-gray-400">Chart integration coming soon</div>
          <div className="text-sm text-gray-500 mt-2">
            Historical performance and yield tracking
          </div>
        </div>
      </div>
    </div>
  )
}

export default PortfolioTab
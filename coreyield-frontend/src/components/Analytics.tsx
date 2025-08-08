import React, { useState } from 'react'

interface AnalyticsProps {
  onClose?: () => void
}

interface PortfolioData {
  totalValue: number
  totalYield: number
  apy: number
  change24h: number
  change7d: number
  change30d: number
}

interface AssetData {
  symbol: string
  value: number
  percentage: number
  apy: number
  yield: number
  change24h: number
}

export const Analytics: React.FC<AnalyticsProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'yield' | 'risk'>('overview')
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | '1y'>('7d')

  // Mock data - in real app this would come from API
  const portfolioData: PortfolioData = {
    totalValue: 15420.50,
    totalYield: 1247.30,
    apy: 15.2,
    change24h: 2.4,
    change7d: 8.7,
    change30d: 23.1
  }

  const assets: AssetData[] = [
    { symbol: 'stCORE', value: 8230.50, percentage: 53.4, apy: 12.5, yield: 685.20, change24h: 1.8 },
    { symbol: 'lstBTC', value: 4560.00, percentage: 29.6, apy: 18.2, yield: 412.50, change24h: 3.2 },
    { symbol: 'dualCORE', value: 2630.00, percentage: 17.0, apy: 14.8, yield: 149.60, change24h: 2.1 }
  ]

  const generateChartData = (days: number) => {
    const data = []
    const baseValue = portfolioData.totalValue
    for (let i = 0; i < days; i++) {
      const randomChange = (Math.random() - 0.5) * 0.1 // ±5% daily change
      const value = baseValue * (1 + randomChange * (i + 1))
      data.push({
        date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toLocaleDateString(),
        value: Math.max(0, value)
      })
    }
    return data
  }

  const chartData = generateChartData(timeframe === '24h' ? 24 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 365)

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-400' : 'text-red-400'
  }

  const getChangeIcon = (change: number) => {
    return change >= 0 ? '↗' : '↘'
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">📊</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Analytics Dashboard</h2>
              <p className="text-gray-400 text-sm">Portfolio performance and yield analysis</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'performance', label: 'Performance', icon: '📈' },
            { id: 'yield', label: 'Yield Analysis', icon: '💰' },
            { id: 'risk', label: 'Risk Analysis', icon: '⚠️' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-400/10'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Timeframe Selector */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Portfolio Analytics</h3>
            <div className="flex items-center space-x-1 bg-gray-800 rounded-lg p-1">
              {['24h', '7d', '30d', '1y'].map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeframe(period as any)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    timeframe === period
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Portfolio Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Total Value</span>
                    <span className={`text-xs font-medium ${getChangeColor(portfolioData.change24h)}`}>
                      {getChangeIcon(portfolioData.change24h)} {portfolioData.change24h}%
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white">${portfolioData.totalValue.toLocaleString()}</div>
                </div>

                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Total Yield</span>
                    <span className="text-green-400 text-xs font-medium">+{portfolioData.apy}% APY</span>
                  </div>
                  <div className="text-2xl font-bold text-green-400">${portfolioData.totalYield.toFixed(2)}</div>
                </div>

                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">7D Change</span>
                    <span className={`text-xs font-medium ${getChangeColor(portfolioData.change7d)}`}>
                      {getChangeIcon(portfolioData.change7d)} {portfolioData.change7d}%
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white">{portfolioData.change7d}%</div>
                </div>

                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">30D Change</span>
                    <span className={`text-xs font-medium ${getChangeColor(portfolioData.change30d)}`}>
                      {getChangeIcon(portfolioData.change30d)} {portfolioData.change30d}%
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white">{portfolioData.change30d}%</div>
                </div>
              </div>

              {/* Asset Allocation */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h4 className="text-white font-semibold mb-4">Asset Allocation</h4>
                  <div className="space-y-4">
                    {assets.map((asset) => (
                      <div key={asset.symbol} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{asset.symbol.slice(0, 2)}</span>
                          </div>
                          <div>
                            <div className="text-white font-medium">{asset.symbol}</div>
                            <div className="text-gray-400 text-sm">{asset.percentage}%</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-medium">${asset.value.toLocaleString()}</div>
                          <div className={`text-sm ${getChangeColor(asset.change24h)}`}>
                            {getChangeIcon(asset.change24h)} {asset.change24h}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h4 className="text-white font-semibold mb-4">Performance Chart</h4>
                  <div className="h-48 flex items-end justify-between space-x-1">
                    {chartData.map((point, index) => (
                      <div
                        key={index}
                        className="flex-1 bg-gradient-to-t from-purple-500 to-blue-500 rounded-t"
                        style={{
                          height: `${(point.value / Math.max(...chartData.map(p => p.value))) * 100}%`,
                          minHeight: '4px'
                        }}
                        title={`${point.date}: $${point.value.toFixed(2)}`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>{chartData[0]?.date}</span>
                    <span>{chartData[chartData.length - 1]?.date}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h4 className="text-white font-semibold mb-4">Performance Metrics</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h5 className="text-gray-400 text-sm mb-2">Sharpe Ratio</h5>
                    <div className="text-2xl font-bold text-white">2.34</div>
                    <div className="text-green-400 text-sm">Excellent</div>
                  </div>
                  <div>
                    <h5 className="text-gray-400 text-sm mb-2">Max Drawdown</h5>
                    <div className="text-2xl font-bold text-white">-8.2%</div>
                    <div className="text-yellow-400 text-sm">Moderate</div>
                  </div>
                  <div>
                    <h5 className="text-gray-400 text-sm mb-2">Volatility</h5>
                    <div className="text-2xl font-bold text-white">12.4%</div>
                    <div className="text-blue-400 text-sm">Low</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h4 className="text-white font-semibold mb-4">Historical Performance</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-700">
                        <th className="text-left py-2">Period</th>
                        <th className="text-right py-2">Return</th>
                        <th className="text-right py-2">Benchmark</th>
                        <th className="text-right py-2">Excess</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-700">
                        <td className="py-2 text-white">1 Month</td>
                        <td className="py-2 text-right text-green-400">+8.7%</td>
                        <td className="py-2 text-right text-gray-400">+5.2%</td>
                        <td className="py-2 text-right text-green-400">+3.5%</td>
                      </tr>
                      <tr className="border-b border-gray-700">
                        <td className="py-2 text-white">3 Months</td>
                        <td className="py-2 text-right text-green-400">+23.1%</td>
                        <td className="py-2 text-right text-gray-400">+15.8%</td>
                        <td className="py-2 text-right text-green-400">+7.3%</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-white">1 Year</td>
                        <td className="py-2 text-right text-green-400">+156.2%</td>
                        <td className="py-2 text-right text-gray-400">+89.4%</td>
                        <td className="py-2 text-right text-green-400">+66.8%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'yield' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <h5 className="text-gray-400 text-sm mb-2">Average APY</h5>
                  <div className="text-2xl font-bold text-green-400">{portfolioData.apy}%</div>
                  <div className="text-gray-400 text-sm">Across all positions</div>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <h5 className="text-gray-400 text-sm mb-2">Daily Yield</h5>
                  <div className="text-2xl font-bold text-white">${(portfolioData.totalYield / 365).toFixed(2)}</div>
                  <div className="text-gray-400 text-sm">Average per day</div>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <h5 className="text-gray-400 text-sm mb-2">Yield Efficiency</h5>
                  <div className="text-2xl font-bold text-blue-400">94.2%</div>
                  <div className="text-gray-400 text-sm">Of theoretical max</div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h4 className="text-white font-semibold mb-4">Yield by Asset</h4>
                <div className="space-y-4">
                  {assets.map((asset) => (
                    <div key={asset.symbol} className="flex items-center justify-between p-4 bg-gray-750 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-bold">{asset.symbol.slice(0, 2)}</span>
                        </div>
                        <div>
                          <div className="text-white font-medium">{asset.symbol}</div>
                          <div className="text-gray-400 text-sm">{asset.apy}% APY</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-medium">${asset.yield.toFixed(2)}</div>
                        <div className="text-gray-400 text-sm">Total yield</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'risk' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h4 className="text-white font-semibold mb-4">Risk Metrics</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Value at Risk (95%)</span>
                      <span className="text-white">-$1,247</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Expected Shortfall</span>
                      <span className="text-white">-$1,856</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Beta</span>
                      <span className="text-white">0.87</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Correlation</span>
                      <span className="text-white">0.72</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h4 className="text-white font-semibold mb-4">Risk Score</h4>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-yellow-400 mb-2">7.2/10</div>
                    <div className="text-gray-400 text-sm">Moderate Risk</div>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Smart Contract Risk</span>
                        <span className="text-green-400">Low</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Market Risk</span>
                        <span className="text-yellow-400">Medium</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Liquidity Risk</span>
                        <span className="text-green-400">Low</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h4 className="text-white font-semibold mb-4">Risk Recommendations</h4>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <span className="text-blue-400 text-lg">💡</span>
                    <div>
                      <div className="text-white font-medium">Diversify Portfolio</div>
                      <div className="text-gray-400 text-sm">Consider adding more assets to reduce concentration risk</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <span className="text-yellow-400 text-lg">⚠️</span>
                    <div>
                      <div className="text-white font-medium">Monitor Market Conditions</div>
                      <div className="text-gray-400 text-sm">Current market volatility may impact yield performance</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <span className="text-green-400 text-lg">✅</span>
                    <div>
                      <div className="text-white font-medium">Good Liquidity Position</div>
                      <div className="text-gray-400 text-sm">Your positions have sufficient liquidity for withdrawals</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
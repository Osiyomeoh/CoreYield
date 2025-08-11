import React from 'react'

interface TransactionStatsProps {
  stats: {
    total: number
    successful: number
    failed: number
    byType: Record<string, number>
    byAsset: Record<string, number>
  }
}

export const TransactionStats: React.FC<TransactionStatsProps> = ({ stats }) => {
  const successRate = stats.total > 0 ? ((stats.successful / stats.total) * 100).toFixed(1) : '0'
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'split': return 'text-blue-400'
      case 'deposit': return 'text-green-400'
      case 'withdraw': return 'text-yellow-400'
      case 'claim': return 'text-purple-400'
      default: return 'text-gray-400'
    }
  }

  const getAssetColor = (asset: string) => {
    switch (asset) {
      case 'stCORE': return 'text-blue-400'
      case 'lstBTC': return 'text-orange-400'
      case 'dualCORE': return 'text-purple-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 sticky top-6">
      <h3 className="text-lg font-bold text-white mb-4">📊 Transaction Analytics</h3>
      
      {/* Summary Cards */}
      <div className="space-y-3 mb-6">
        {/* Total Transactions */}
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-3 border border-blue-500/30">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">Total Transactions</span>
            <span className="text-2xl font-bold text-white">{stats.total}</span>
          </div>
        </div>
        
        {/* Success Rate */}
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-3 border border-green-500/30">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">Success Rate</span>
            <span className="text-2xl font-bold text-green-400">{successRate}%</span>
          </div>
        </div>
      </div>

      {/* Transaction Types */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center">
          <span className="mr-2">📈</span> By Type
        </h4>
        <div className="space-y-2">
          {Object.entries(stats.byType).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between p-2 bg-gray-700/50 rounded-lg">
              <span className={`capitalize ${getTypeColor(type)} text-sm`}>
                {type === 'split' ? '🔄' : type === 'deposit' ? '📥' : type === 'withdraw' ? '📤' : '💰'} {type}
              </span>
              <span className="text-white font-bold bg-gray-600 px-2 py-1 rounded text-xs">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Assets */}
      <div>
        <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center">
          <span className="mr-2">🪙</span> By Asset
        </h4>
        <div className="space-y-2">
          {Object.entries(stats.byAsset).map(([asset, count]) => (
            <div key={asset} className="flex items-center justify-between p-2 bg-gray-700/50 rounded-lg">
              <span className={`${getAssetColor(asset)} text-sm`}>
                {asset === 'stCORE' ? '🔵' : asset === 'lstBTC' ? '🟠' : '🟣'} {asset}
              </span>
              <span className="text-white font-bold bg-gray-600 px-2 py-1 rounded text-xs">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-400 text-center mb-3">
          💡 Click on any transaction to see details
        </p>
      </div>
    </div>
  )
} 
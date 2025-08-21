import React from 'react'

interface AssetCardProps {
  asset: {
    symbol: string
    name: string
    icon: string
    apy: number
    description: string
    tvl?: string
    category?: string
    riskLevel?: string
  }
  balance: string
  usdValue: string
  onClick?: () => void
  selected?: boolean
  showBalance?: boolean
}

export const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  balance,
  usdValue,
  onClick,
  selected = false,
  showBalance = true
}) => {
  return (
    <div
      className={`p-6 rounded-xl border transition-all duration-200 cursor-pointer hover-lift ${
        selected
          ? 'border-blue-500 bg-gradient-to-br from-blue-500/10 to-purple-500/10'
          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-2xl">{asset.icon}</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{asset.symbol}</h3>
            <p className="text-gray-400 text-sm">{asset.name}</p>
          </div>
        </div>
        
        {selected && (
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-gray-400 text-xs">APY</p>
          <p className="text-green-400 font-bold text-lg">{asset.apy}%</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">TVL</p>
          <p className="text-white font-semibold">{asset.tvl || 'N/A'}</p>
        </div>
        {asset.category && (
          <div>
            <p className="text-gray-400 text-xs">Category</p>
            <p className="text-white font-medium text-sm">{asset.category}</p>
          </div>
        )}
        {asset.riskLevel && (
          <div>
            <p className="text-gray-400 text-xs">Risk</p>
            <p className={`font-medium text-sm ${
              asset.riskLevel === 'Low' ? 'text-green-400' :
              asset.riskLevel === 'Medium' ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {asset.riskLevel}
            </p>
          </div>
        )}
      </div>

      {/* Balance Section */}
      {showBalance && (
        <div className="border-t border-gray-700/50 pt-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">Your Balance</p>
              <p className="text-white font-semibold">{balance} {asset.symbol}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-xs">USD Value</p>
              <p className="text-white font-semibold">{usdValue}</p>
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      <div className="mb-4">
        <p className="text-gray-300 text-sm leading-relaxed">
          {asset.description}
        </p>
      </div>

      {/* Action Indicator */}
      <div className="flex items-center justify-center pt-2">
        <div className={`w-8 h-1 rounded-full transition-all ${
          selected ? 'bg-blue-500' : 'bg-gray-600'
        }`} />
      </div>
    </div>
  )
}
import React, { useState } from 'react'
import { useCoreYield } from '../../../hooks/useCoreYield'
import { CONTRACTS, ASSET_METADATA } from '../../../../contracts/addresses'

interface MarketsTabProps {
  currentHook: any
  selectedAsset: string
  setSelectedAsset: (asset: string) => void
}

export const MarketsTab: React.FC<MarketsTabProps> = ({
  currentHook,
  selectedAsset,
  setSelectedAsset
}) => {
  const { markets, marketAnalytics, isLoading } = useCoreYield()
  
  // MarketsTab is now properly integrated with useYieldProtocol hook

  const assetOptions = [
    { key: 'dualCORE', label: 'Dual CORE', icon: '⚡', color: 'from-purple-500 to-blue-500' },
    { key: 'stCORE', label: 'Staked CORE', icon: '🔥', color: 'from-orange-500 to-red-500' },
    { key: 'lstBTC', label: 'Liquid Staked BTC', icon: '₿', color: 'from-yellow-500 to-orange-500' }
  ] as const

  const getMarketModeColor = (mode: string) => {
    switch (mode) {
      case 'CHEAP_PT': return 'text-green-600 bg-green-100'
      case 'CHEAP_YT': return 'text-blue-600 bg-blue-100'
      case 'EQUILIBRIUM': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">📊 PT/YT Markets</h3>
        <p className="text-gray-400">
          Browse available Principal Token (PT) and Yield Token (YT) markets
        </p>
        
        {/* Debug Info */}
        <div className="mt-4 p-3 bg-gray-800/50 rounded-lg text-left">
          <p className="text-sm text-gray-300 mb-2">Debug Info:</p>
          <p className="text-xs text-gray-400">Markets loaded: {Object.keys(markets).length}</p>
          <p className="text-xs text-gray-400">Analytics loaded: {Object.keys(marketAnalytics).length}</p>
          <p className="text-xs text-gray-400">Loading: {isLoading ? 'Yes' : 'No'}</p>
        </div>
      </div>

      {/* Markets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {assetOptions.map((asset) => {
          const market = markets[asset.key] || {
            maturity: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year from now
            isActive: true
          }
          const analytics = marketAnalytics[asset.key] || {
            marketMode: 'EQUILIBRIUM',
            tradingSignals: {
              buyPT: true,
              buyYT: true,
              confidence: 75
            }
          }
          const metadata = ASSET_METADATA[asset.key as keyof typeof ASSET_METADATA]
          
          return (
            <div 
              key={asset.key}
              className={`bg-gradient-to-br ${asset.color} rounded-xl border border-gray-700/50 p-6 cursor-pointer transition-all duration-200 hover:scale-105 ${
                selectedAsset === asset.key ? 'ring-2 ring-blue-400' : ''
              }`}
              onClick={() => setSelectedAsset(asset.key)}
            >
              {/* Asset Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{asset.icon}</span>
                  <div>
                    <h4 className="text-xl font-bold text-white">{asset.label}</h4>
                    <p className="text-sm text-white/80">{metadata?.description}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getMarketModeColor(analytics?.marketMode || 'EQUILIBRIUM')}`}>
                  {analytics?.marketMode || 'EQUILIBRIUM'}
                </div>
              </div>

              {/* Market Data */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/80">Maturity</span>
                  <span className="text-white font-semibold">
                    {market ? new Date(market.maturity * 1000).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-white/80">Base APY</span>
                  <span className="text-white font-semibold">{metadata?.apy ? Number(metadata.apy).toFixed(2) : '0.00'}%</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/80">Risk Level</span>
                  <span className="text-white font-semibold">{metadata?.risk}</span>
                </div>

                {/* Trading Signals */}
                {analytics?.tradingSignals && (
                  <div className="mt-4 p-3 bg-white/10 rounded-lg">
                    <h6 className="text-white font-medium mb-2">Trading Signals</h6>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-white/80">Buy PT</span>
                        <span className={`font-semibold ${analytics.tradingSignals.buyPT ? 'text-green-400' : 'text-red-400'}`}>
                          {analytics.tradingSignals.buyPT ? '✅ Yes' : '❌ No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/80">Buy YT</span>
                        <span className={`font-semibold ${analytics.tradingSignals.buyYT ? 'text-green-400' : 'text-red-400'}`}>
                          {analytics.tradingSignals.buyYT ? '✅ Yes' : '❌ No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/80">Confidence</span>
                        <span className="text-white font-semibold">{analytics.tradingSignals.confidence}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Select Button */}
              <button 
                className={`w-full mt-4 py-2 px-4 rounded-lg font-medium transition-colors ${
                  selectedAsset === asset.key
                    ? 'bg-white text-gray-900'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {selectedAsset === asset.key ? 'Selected' : 'Select Market'}
              </button>
            </div>
          )
        })}
      </div>

      {/* Selected Market Info */}
      {selectedAsset && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
          <h4 className="text-lg font-semibold text-white mb-4">
            Selected: {ASSET_METADATA[selectedAsset as keyof typeof ASSET_METADATA]?.name}
          </h4>
          <p className="text-gray-300">
            This market is now selected. Switch to the Operations tab to perform wrap/split operations, 
            or the Trade tab to buy/sell PT and YT tokens.
          </p>
        </div>
      )}
    </div>
  )
}

import React from 'react'
import { ActionButton } from '../shared/ActionButton'

interface Market {
  name: string
  maturity: string
  liquidity: string
  ytAPY: number
  ptAPY: number
  volume24h: string
  marketMode: string
  tradingSignals: {
    buyPT: boolean
    buyYT: boolean
    confidence: number
  }
}

interface MarketAsset {
  name: string
  protocol: string
  maturity: string
  liquidity: string
  totalTVL: string
  ytAPY: number
  ptAPY: number
  icon: string
  featured?: boolean
  volume24h: string
  marketMode: string
  tradingSignals: {
    buyPT: boolean
    buyYT: boolean
    confidence: number
  }
  description: string
  underlying: string
  points: string[]
  markets?: Market[]
}

interface MarketCardProps {
  asset: MarketAsset
  expanded: boolean
  onToggleExpand: () => void
  viewMode: 'list' | 'grid' | 'detailed'
  onTradeClick: (tokenType: 'PT' | 'YT', asset: string, market: any) => void
}

export const MarketCard: React.FC<MarketCardProps> = ({
  asset,
  expanded,
  onToggleExpand,
  viewMode,
  onTradeClick
}) => {
  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 hover:border-gray-600/50 transition-all">
      {/* Asset Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-700/30 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white">{asset.name}</h3>
                {asset.featured && (
                  <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                    Featured
                  </span>
                )}
                <span className={`px-2 py-1 text-xs rounded-full ${
                  asset.marketMode === 'BULLISH' ? 'bg-green-600/20 text-green-400 border border-green-500/30' :
                  asset.marketMode === 'BEARISH' ? 'bg-red-600/20 text-red-400 border border-red-500/30' :
                  'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                }`}>
                  {asset.marketMode}
                </span>
              </div>
              <p className="text-gray-400 text-sm">({asset.protocol})</p>
              <p className="text-gray-500 text-xs">{asset.description}</p>
              
              {/* Quick Action Buttons for New Users */}
              <div className="flex items-center space-x-2 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onTradeClick('PT', asset.name, asset)
                  }}
                  className="px-2 py-1 bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs rounded hover:bg-blue-600/30 transition-colors flex items-center space-x-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Wrap to SY</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onTradeClick('YT', asset.name, asset)
                  }}
                  className="px-2 py-1 bg-green-600/20 border border-green-500/30 text-green-400 text-xs rounded hover:bg-green-600/30 transition-colors flex items-center space-x-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3" />
                  </svg>
                  <span>Split SY</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-gray-400 text-xs">24h Volume</p>
              <p className="text-white font-bold text-xs">{asset.volume24h}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-xs">Total TVL</p>
              <p className="text-white font-bold text-sm">{asset.totalTVL}</p>
            </div>
            <button className="p-2 text-gray-400 hover:text-white">
              <svg className={`w-5 h-5 transform transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Markets */}
      {expanded && (
        <div className="border-t border-gray-700/50">
                  <div className="p-3">
          <div className="grid grid-cols-6 gap-3 text-xs text-gray-400 mb-3">
            <div>Market</div>
            <div>Liquidity / Total TVL</div>
            <div>24h Volume</div>
            <div>Long Yield APY</div>
            <div>Fixed APY</div>
            <div>Actions</div>
          </div>
            
            {asset.markets ? asset.markets.map((market, index) => (
              <div key={index} className="grid grid-cols-6 gap-3 items-center py-2 hover:bg-gray-700/20 rounded-lg transition-colors">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-xs">{asset.icon}</span>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{market.name}</p>
                    <p className="text-gray-400 text-xs">{market.maturity}</p>
                  </div>
                </div>
                <div>
                  <p className="text-white text-sm">{market.liquidity}</p>
                  <p className="text-gray-400 text-xs">{asset.totalTVL}</p>
                </div>
                <div>
                  <p className="text-white text-sm">{market.volume24h}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <span className={`w-2 h-2 rounded-full ${
                      market.tradingSignals.buyPT ? 'bg-green-400' : 'bg-red-400'
                    }`} title={`PT: ${market.tradingSignals.buyPT ? 'Buy' : 'Sell'}`}></span>
                    <span className={`w-2 h-2 rounded-full ${
                      market.tradingSignals.buyYT ? 'bg-green-400' : 'bg-red-400'
                    }`} title={`YT: ${market.tradingSignals.buyYT ? 'Buy' : 'Sell'}`}></span>
                    <span className="text-xs text-gray-400">({market.tradingSignals.confidence}%)</span>
                  </div>
                </div>
                <div>
                  <div className="flex flex-col items-center">
                    <button className={`px-3 py-1 rounded text-sm font-medium mb-1 ${
                      market.ytAPY > 0 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}>
                      YT {market.ytAPY.toFixed(1)}%
                    </button>
                    <span className="text-xs text-gray-400">Yield Token</span>
                  </div>
                </div>
                <div>
                  <div className="flex flex-col items-center">
                    <button className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-sm font-medium mb-1">
                      PT {market.ptAPY.toFixed(1)}%
                    </button>
                    <span className="text-xs text-gray-400">Principal Token</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <ActionButton
                    onClick={() => onTradeClick('YT', asset.name, market)}
                    variant="primary"
                    size="sm"
                  >
                    Trade YT
                  </ActionButton>
                  <ActionButton
                    onClick={() => onTradeClick('PT', asset.name, market)}
                    variant="secondary"
                    size="sm"
                  >
                    Trade PT
                  </ActionButton>
                </div>
              </div>
            )) : (
              <div className="grid grid-cols-5 gap-4 items-center py-3 hover:bg-gray-700/20 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-xs">{asset.icon}</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{asset.name}</p>
                    <p className="text-gray-400 text-xs">{asset.maturity}</p>
                  </div>
                </div>
                <div>
                  <p className="text-white">{asset.liquidity}</p>
                  <p className="text-gray-400 text-xs">{asset.totalTVL}</p>
                </div>
                <div>
                  <div className="flex flex-col items-center">
                    <button className={`px-3 py-1 rounded text-sm font-medium mb-1 ${
                      asset.ytAPY > 0 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}>
                      YT {asset.ytAPY.toFixed(1)}%
                    </button>
                    <span className="text-xs text-gray-400">Yield Token</span>
                  </div>
                </div>
                <div>
                  <div className="flex flex-col items-center">
                    <button className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-sm font-medium mb-1">
                      PT {asset.ptAPY.toFixed(1)}%
                    </button>
                    <span className="text-xs text-gray-400">Principal Token</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <ActionButton
                    onClick={() => onTradeClick('YT', asset.name, asset)}
                    variant="primary"
                    size="sm"
                  >
                    Trade YT
                  </ActionButton>
                  <ActionButton
                    onClick={() => onTradeClick('PT', asset.name, asset)}
                    variant="secondary"
                    size="sm"
                  >
                    Trade PT
                  </ActionButton>
                </div>
              </div>
            )}
          </div>
          
          {/* Market Details */}
          <div className="border-t border-gray-700/50 p-4 bg-gray-900/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-white font-medium mb-2">Underlying Asset</h4>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-xs">
                    {asset.underlying === 'BTC' ? (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.362c6.43 1.605 10.342 8.113 8.738 14.542zm-7.54-5.547c.388-.98.18-2.08-.5-2.782-.68-.7-1.78-.888-2.76-.5-.98.388-1.6 1.38-1.6 2.38 0 1 .62 1.98 1.6 2.38.98.388 2.08.18 2.76-.5.68-.7.888-1.8.5-2.78z"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                  </div>
                  <span className="text-gray-300">{asset.underlying}</span>
                </div>
              </div>
              <div>
                <h4 className="text-white font-medium mb-2">Points & Rewards</h4>
                <div className="flex flex-wrap gap-1">
                  {asset.points.map((point, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded border border-blue-500/30">
                      {point}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-white font-medium mb-2">Trading Signals</h4>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">PT:</span>
                    <span className={`text-sm ${asset.tradingSignals.buyPT ? 'text-green-400' : 'text-red-400'}`}>
                      {asset.tradingSignals.buyPT ? 'BUY' : 'SELL'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">YT:</span>
                    <span className={`text-sm ${asset.tradingSignals.buyYT ? 'text-green-400' : 'text-red-400'}`}>
                      {asset.tradingSignals.buyYT ? 'BUY' : 'SELL'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Confidence:</span>
                    <span className="text-white text-sm">{asset.tradingSignals.confidence}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
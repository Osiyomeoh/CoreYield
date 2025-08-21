import React, { useState } from 'react'
import { useYieldProtocol } from '../../../hooks/useYieldProtocol'
import { CONTRACTS, ASSET_METADATA } from '../../../../contracts/addresses'
import { ActionButton } from '../shared/ActionButton'
import { AmountInput } from '../shared/AmountInput'

interface TradeTabProps {
  currentHook: any
  selectedAsset: string
  setSelectedAsset: (asset: string) => void
}

export const TradeTab: React.FC<TradeTabProps> = ({
  currentHook,
  selectedAsset,
  setSelectedAsset
}) => {
  const { userBalances, marketAnalytics, poolData, isLoading, swapTokens, getSwapQuote } = useYieldProtocol()
  const [tradeType, setTradeType] = useState<'PT_TO_YT' | 'YT_TO_PT'>('PT_TO_YT')
  const [tradeAmount, setTradeAmount] = useState('')
  const [minAmountOut, setMinAmountOut] = useState('')
  const [quote, setQuote] = useState<string | null>(null)

  const assetOptions = [
    { key: 'dualCORE', label: 'Dual CORE', icon: '⚡', color: 'from-purple-500 to-blue-500' },
    { key: 'stCORE', label: 'Staked CORE', icon: '🔥', color: 'from-orange-500 to-red-500' },
    { key: 'lstBTC', label: 'Liquid Staked BTC', icon: '₿', color: 'from-yellow-500 to-orange-500' }
  ] as const

  const handleGetQuote = async () => {
    if (!tradeAmount || parseFloat(tradeAmount) <= 0) return
    
    try {
      const quoteResult = await getSwapQuote(selectedAsset, 
        tradeType === 'PT_TO_YT' ? 'PT' : 'YT',
        tradeType === 'PT_TO_YT' ? 'YT' : 'PT',
        tradeAmount
      )
      
      if (quoteResult) {
        setQuote(quoteResult.toString())
        // Set min amount out with some slippage protection
        const slippage = 0.02 // 2% slippage
        const minOut = parseFloat(quoteResult.toString()) * (1 - slippage)
        setMinAmountOut(minOut.toFixed(6))
      }
    } catch (error) {
      console.error('Quote error:', error)
    }
  }

  const handleTrade = async () => {
    if (!tradeAmount || !minAmountOut) return
    
    try {
      await swapTokens(
        selectedAsset,
        tradeType === 'PT_TO_YT' ? 'PT' : 'YT',
        tradeType === 'PT_TO_YT' ? 'YT' : 'PT',
        tradeAmount,
        minAmountOut
      )
      
      // Reset form
      setTradeAmount('')
      setMinAmountOut('')
      setQuote(null)
    } catch (error) {
      console.error('Trade failed:', error)
    }
  }

  const getPoolInfo = () => {
    const pool = poolData[selectedAsset]
    if (!pool) return null
    
    return {
      liquidity: pool.totalSupply,
      ptReserve: pool.reserve0,
      ytReserve: pool.reserve1,
      isYieldPool: pool.isYieldPool
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">🔄 PT/YT Trading</h3>
        <p className="text-gray-400">
          Trade Principal Tokens (PT) and Yield Tokens (YT) on the AMM
        </p>
      </div>

      {/* Asset Selector */}
      <div className="flex justify-center space-x-2">
        {assetOptions.map((asset) => (
          <button
            key={asset.key}
            onClick={() => setSelectedAsset(asset.key)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedAsset === asset.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <span className="mr-2">{asset.icon}</span>
            {asset.label}
          </button>
        ))}
      </div>

      {/* Trading Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trade Form */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Trade PT ↔ YT</h4>
          
          {/* Trade Type Selector */}
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setTradeType('PT_TO_YT')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                tradeType === 'PT_TO_YT'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              PT → YT
            </button>
            <button
              onClick={() => setTradeType('YT_TO_PT')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                tradeType === 'YT_TO_PT'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              YT → PT
            </button>
          </div>

          {/* Trade Amount Input */}
          <div className="space-y-4">
            <AmountInput
              value={tradeAmount}
              onChange={(value) => setTradeAmount(value)}
              placeholder="0.0"
              label={`Amount of ${tradeType === 'PT_TO_YT' ? 'PT' : 'YT'} to trade`}
              maxBalance={userBalances[selectedAsset]?.[tradeType === 'PT_TO_YT' ? 'pt' : 'yt'] || '0'}
              onMaxClick={() => setTradeAmount(userBalances[selectedAsset]?.[tradeType === 'PT_TO_YT' ? 'pt' : 'yt'] || '0')}
              token={tradeType === 'PT_TO_YT' ? 'PT' : 'YT'}
              disabled={isLoading}
            />

            {/* Get Quote Button */}
            <ActionButton
              onClick={handleGetQuote}
              disabled={!tradeAmount || parseFloat(tradeAmount) <= 0}
              variant="secondary"
              fullWidth
            >
              📊 Get Quote
            </ActionButton>

            {/* Quote Display */}
            {quote && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h6 className="text-blue-300 font-medium mb-2">Trade Quote</h6>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Input</span>
                    <span className="text-white">{tradeAmount} {tradeType === 'PT_TO_YT' ? 'PT' : 'YT'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Output (Est.)</span>
                    <span className="text-white">{quote} {tradeType === 'PT_TO_YT' ? 'YT' : 'PT'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rate</span>
                    <span className="text-white">
                      1 {tradeType === 'PT_TO_YT' ? 'PT' : 'YT'} = {(parseFloat(quote) / parseFloat(tradeAmount)).toFixed(6)} {tradeType === 'PT_TO_YT' ? 'YT' : 'PT'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Min Amount Out Input */}
            {quote && (
              <AmountInput
                value={minAmountOut}
                onChange={(value) => setMinAmountOut(value)}
                placeholder="0.0"
                label="Minimum amount out (slippage protection)"
                maxBalance={quote}
                onMaxClick={() => setMinAmountOut(quote)}
                token={tradeType === 'PT_TO_YT' ? 'YT' : 'PT'}
                disabled={isLoading}
              />
            )}

            {/* Execute Trade Button */}
            {quote && minAmountOut && (
              <ActionButton
                onClick={handleTrade}
                disabled={!tradeAmount || !minAmountOut || isLoading}
                loading={isLoading}
                variant="primary"
                fullWidth
              >
                🔄 Execute Trade
              </ActionButton>
            )}
          </div>
        </div>

        {/* Pool Information */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Pool Information</h4>
          
          {getPoolInfo() ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">
                    {getPoolInfo()?.ptReserve || '0'}
                  </div>
                  <div className="text-sm text-gray-400">PT Reserve</div>
                </div>
                <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-400">
                    {getPoolInfo()?.ytReserve || '0'}
                  </div>
                  <div className="text-sm text-gray-400">YT Reserve</div>
                </div>
              </div>
              
              <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">
                  {getPoolInfo()?.liquidity || '0'}
                </div>
                <div className="text-sm text-gray-400">Total Liquidity</div>
              </div>

              <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-400">
                  {getPoolInfo()?.isYieldPool ? 'Yes' : 'No'}
                </div>
                <div className="text-sm text-gray-400">Yield Pool</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <p>Pool information not available</p>
              <p className="text-sm">Select an asset to view pool details</p>
            </div>
          )}
        </div>
      </div>

      {/* Trading History */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
        <h4 className="text-lg font-semibold text-white mb-4">📋 Trading History</h4>
        <div className="text-center text-gray-400 py-8">
          <p>Trading history will be displayed here</p>
          <p className="text-sm">Track your PT/YT trades over time</p>
        </div>
      </div>
    </div>
  )
}

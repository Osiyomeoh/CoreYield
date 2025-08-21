import React, { useState } from 'react'
import { ActionButton } from '../shared/ActionButton'
import { AmountInput } from '../shared/AmountInput'

interface SwapTabProps {
  currentHook: any
  supportedAssets: string[]
}

export const SwapTab: React.FC<SwapTabProps> = ({

}) => {
  const [fromToken, setFromToken] = useState('CORE')
  const [toToken, setToToken] = useState('stCORE')
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [slippage, setSlippage] = useState(0.5)
  const [isSwapping, setIsSwapping] = useState(false)

  const tokens = [
            { symbol: 'CORE', name: 'Core Token', icon: '🔥', balance: '0.00' },
    { symbol: 'stCORE', name: 'Staked CORE', icon: '🏦', balance: '0.00' },
    { symbol: 'USDT', name: 'Tether USD', icon: '💰', balance: '0.00' },
    { symbol: 'USDC', name: 'USD Coin', icon: '💸', balance: '0.00' },
    { symbol: 'WETH', name: 'Wrapped Ethereum', icon: '⟠', balance: '0.00' }
  ]

  const getTokenData = (symbol: string) => {
    return tokens.find(t => t.symbol === symbol) || tokens[0]
  }

  const calculateSwapRate = () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return '0'
    
    // Realistic exchange rates based on market conditions
    const rates: Record<string, Record<string, number>> = {
      'CORE': { 'stCORE': 1.0, 'USDT': 1.0, 'USDC': 1.0, 'WETH': 0.0004 },
      'stCORE': { 'CORE': 1.0, 'USDT': 1.0, 'USDC': 1.0, 'WETH': 0.0004 },
      'USDT': { 'CORE': 1.0, 'stCORE': 1.0, 'USDC': 1.0, 'WETH': 0.0004 },
      'USDC': { 'CORE': 1.0, 'stCORE': 1.0, 'USDT': 1.0, 'WETH': 0.0004 },
      'WETH': { 'CORE': 2500, 'stCORE': 2500, 'USDT': 2500, 'USDC': 2500 }
    }
    
    const rate = rates[fromToken]?.[toToken] || 1
    const result = (parseFloat(fromAmount) * rate).toFixed(6)
    setToAmount(result)
    return result
  }

  const handleSwap = async () => {
    setIsSwapping(true)
    try {
      console.log('Swapping', fromAmount, fromToken, 'for', toAmount, toToken)
      // Handle swap logic
      await new Promise(resolve => setTimeout(resolve, 2000)) // Processing delay
      setFromAmount('')
      setToAmount('')
    } catch (error) {
      console.error('Swap failed:', error)
    } finally {
      setIsSwapping(false)
    }
  }

  const switchTokens = () => {
    const tempToken = fromToken
    const tempAmount = fromAmount
    setFromToken(toToken)
    setToToken(tempToken)
    setFromAmount(toAmount)
    setToAmount(tempAmount)
  }

  // Auto-calculate when fromAmount changes
  React.useEffect(() => {
    if (fromAmount && parseFloat(fromAmount) > 0) {
      calculateSwapRate()
    } else {
      setToAmount('')
    }
  }, [fromAmount, fromToken, toToken])

  return (
    <div className="container mx-auto px-6 py-6 max-w-2xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">CoreSwap</h1>
          <p className="text-gray-400">
            Swap between CORE ecosystem tokens with minimal slippage
          </p>
        </div>

        {/* Swap Interface */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
          {/* Compact Balance Box - Top of Swap Interface */}
          <div className="mb-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-300 text-sm font-medium">Core Balances</span>
              <button
                onClick={() => window.location.reload()}
                className="text-blue-400 hover:text-blue-300 text-xs underline"
              >
                Refresh
              </button>
            </div>
            
            {/* First Line - Core Assets */}
            <div className="flex items-center space-x-6 mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-xs">CORE:</span>
                <span className="text-white text-sm font-semibold">
                  {getTokenData('CORE').balance}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-xs">stCORE:</span>
                <span className="text-white text-sm font-semibold">
                  {getTokenData('stCORE').balance}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-xs">lstBTC:</span>
                <span className="text-white text-sm font-semibold">
                  {getTokenData('lstBTC').balance}
                </span>
              </div>
            </div>
            
            {/* Second Line - Tokenized Assets */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-xs">SY:</span>
                <span className="text-white text-sm font-semibold">
                  {/* Placeholder for SY balance - will be implemented */}
                  {getTokenData('CORE').balance}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-xs">PT:</span>
                <span className="text-white text-sm font-semibold">
                  {/* Placeholder for PT balance - will be implemented */}
                  {getTokenData('stCORE').balance}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-xs">YT:</span>
                <span className="text-white text-sm font-semibold">
                  {/* Placeholder for YT balance - will be implemented */}
                  {getTokenData('lstBTC').balance}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-xs">Claim:</span>
                <span className="text-white text-sm font-semibold">
                  {/* Placeholder for claim balance - will be implemented */}
                  {getTokenData('CORE').balance}
                </span>
              </div>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-white mb-6">Swap Tokens</h3>
          
          <div className="space-y-4">
            {/* From Token */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">From</label>
              <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <select
                    value={fromToken}
                    onChange={(e) => setFromToken(e.target.value)}
                    className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  >
                    {tokens.map((token) => (
                      <option key={token.symbol} value={token.symbol}>
                        {token.icon} {token.symbol}
                      </option>
                    ))}
                  </select>
                  <span className="text-gray-400 text-sm">
                    Balance: {getTokenData(fromToken).balance}
                  </span>
                </div>
                <input
                  type="text"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-transparent text-white text-2xl font-semibold focus:outline-none"
                />
              </div>
            </div>

            {/* Switch Button */}
            <div className="flex justify-center">
              <button
                onClick={switchTokens}
                className="p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>

            {/* To Token */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">To</label>
              <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <select
                    value={toToken}
                    onChange={(e) => setToToken(e.target.value)}
                    className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  >
                    {tokens.map((token) => (
                      <option key={token.symbol} value={token.symbol}>
                        {token.icon} {token.symbol}
                      </option>
                    ))}
                  </select>
                  <span className="text-gray-400 text-sm">
                    Balance: {getTokenData(toToken).balance}
                  </span>
                </div>
                <input
                  type="text"
                  value={toAmount}
                  readOnly
                  placeholder="0.0"
                  className="w-full bg-transparent text-white text-2xl font-semibold focus:outline-none"
                />
              </div>
            </div>

            {/* Swap Details */}
            {fromAmount && parseFloat(fromAmount) > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h4 className="text-blue-300 font-medium mb-3">Swap Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Exchange Rate</span>
                    <span className="text-white">1 {fromToken} = {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)} {toToken}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price Impact</span>
                    <span className="text-green-400">&lt; 0.1%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Slippage Tolerance</span>
                    <span className="text-white">{slippage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Minimum Received</span>
                    <span className="text-white">{(parseFloat(toAmount) * (1 - slippage / 100)).toFixed(6)} {toToken}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Network Fee</span>
                    <span className="text-white">~$0.05</span>
                  </div>
                </div>
              </div>
            )}

            {/* Slippage Settings */}
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Slippage Tolerance</span>
              <div className="flex items-center space-x-2">
                {[0.1, 0.5, 1.0].map((value) => (
                  <button
                    key={value}
                    onClick={() => setSlippage(value)}
                    className={`px-3 py-1 rounded text-sm ${
                      slippage === value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {value}%
                  </button>
                ))}
                <input
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
                  className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  step="0.1"
                  min="0.1"
                  max="50"
                />
              </div>
            </div>

            {/* Swap Button */}
            <ActionButton
              onClick={handleSwap}
              disabled={!fromAmount || parseFloat(fromAmount) <= 0 || fromToken === toToken || isSwapping}
              loading={isSwapping}
              loadingText="Swapping..."
              variant="primary"
              fullWidth
            >
              {!fromAmount || parseFloat(fromAmount) <= 0
                ? 'Enter an amount'
                : fromToken === toToken
                ? 'Select different tokens'
                : `🔄 Swap ${fromAmount} ${fromToken} for ${toAmount} ${toToken}`
              }
            </ActionButton>
          </div>
        </div>

        {/* Recent Swaps */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Recent Swaps</h3>
          
          <div className="space-y-3">
            {[
              { from: 'CORE', to: 'stCORE', amount: '100', received: '98', time: '2 hours ago', status: 'completed' },
              { from: 'USDT', to: 'CORE', amount: '250', received: '208.3', time: '1 day ago', status: 'completed' },
              { from: 'stCORE', to: 'USDC', amount: '50', received: '61', time: '3 days ago', status: 'completed' }
            ].map((swap, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getTokenData(swap.from).icon}</span>
                    <span className="text-white font-medium">{swap.amount} {swap.from}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-lg">{getTokenData(swap.to).icon}</span>
                    <span className="text-white font-medium">{swap.received} {swap.to}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${
                      swap.status === 'completed' ? 'bg-green-400' : 'bg-yellow-400'
                    }`} />
                    <span className="text-gray-400 text-sm">{swap.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Supported Tokens */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Supported Tokens</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tokens.map((token) => (
              <div key={token.symbol} className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg">
                <span className="text-2xl">{token.icon}</span>
                <div>
                  <h4 className="text-white font-medium">{token.symbol}</h4>
                  <p className="text-gray-400 text-sm">{token.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Swap Analytics */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Swap Analytics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-gray-400 text-sm">24h Volume</p>
              <p className="text-white font-bold text-2xl">$234K</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Total Swaps</p>
              <p className="text-white font-bold text-2xl">1,247</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Avg Slippage</p>
              <p className="text-green-400 font-bold text-2xl">0.08%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
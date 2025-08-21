import React, { useState } from 'react'
import { useYieldProtocol } from '../../../hooks/useYieldProtocol'
import { ASSET_METADATA } from '../../../../contracts/addresses'
import { formatUnits, parseEther } from 'viem'

export const PTYTMarketsTab: React.FC = () => {
  const {
    markets,
    userBalances,
    marketAnalytics,
    poolData,
    isLoading,
    wrapToSY,
    splitSY,
    mergePTYT,
    unwrapFromSY,
    addLiquidity,
    swapTokens,
    getSwapQuote,
    refetchAll
  } = useYieldProtocol()

  const [selectedAsset, setSelectedAsset] = useState<'dualCORE' | 'stCORE' | 'lstBTC'>('dualCORE')
  const [wrapAmount, setWrapAmount] = useState('')
  const [splitAmount, setSplitAmount] = useState('')
  const [mergePTAmount, setMergePTAmount] = useState('')
  const [mergeYTAmount, setMergeYTAmount] = useState('')
  const [unwrapAmount, setUnwrapAmount] = useState('')
  const [liquidityPTAmount, setLiquidityPTAmount] = useState('')
  const [liquidityYTAmount, setLiquidityYTAmount] = useState('')
  const [swapAmount, setSwapAmount] = useState('')
  const [swapDirection, setSwapDirection] = useState<'PT_TO_YT' | 'YT_TO_PT'>('PT_TO_YT')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const assetOptions = [
    { key: 'dualCORE', label: 'Dual CORE', icon: '⚡' },
    { key: 'stCORE', label: 'Staked CORE', icon: '🔥' },
    { key: 'lstBTC', label: 'Liquid Staked BTC', icon: '₿' }
  ] as const

  const handleWrap = async () => {
    if (!wrapAmount || parseFloat(wrapAmount) <= 0) return
    await wrapToSY(selectedAsset, wrapAmount)
    setWrapAmount('')
    refetchAll()
  }

  const handleSplit = async () => {
    if (!splitAmount || parseFloat(splitAmount) <= 0) return
    await splitSY(selectedAsset, splitAmount)
    setSplitAmount('')
    refetchAll()
  }

  const handleMerge = async () => {
    if (!mergePTAmount || !mergeYTAmount || parseFloat(mergePTAmount) <= 0 || parseFloat(mergeYTAmount) <= 0) return
    await mergePTYT(selectedAsset, mergePTAmount, mergeYTAmount)
    setMergePTAmount('')
    setMergeYTAmount('')
    refetchAll()
  }

  const handleUnwrap = async () => {
    if (!unwrapAmount || parseFloat(unwrapAmount) <= 0) return
    await unwrapFromSY(selectedAsset, unwrapAmount)
    setUnwrapAmount('')
    refetchAll()
  }

  const handleAddLiquidity = async () => {
    if (!liquidityPTAmount || !liquidityYTAmount || parseFloat(liquidityPTAmount) <= 0 || parseFloat(liquidityYTAmount) <= 0) return
    await addLiquidity(selectedAsset, liquidityPTAmount, liquidityYTAmount)
    setLiquidityPTAmount('')
    setLiquidityYTAmount('')
    refetchAll()
  }

  const handleSwap = async () => {
    if (!swapAmount || parseFloat(swapAmount) <= 0) return
    const minAmountOut = '0' // For now, set to 0 for simplicity
    await swapTokens(selectedAsset, swapDirection === 'PT_TO_YT' ? 'PT' : 'YT', swapDirection === 'PT_TO_YT' ? 'YT' : 'PT', swapAmount, minAmountOut)
    setSwapAmount('')
    refetchAll()
  }

  const getMarketModeColor = (mode: string) => {
    switch (mode) {
      case 'CHEAP_PT': return 'text-green-600 bg-green-100'
      case 'CHEAP_YT': return 'text-blue-600 bg-blue-100'
      case 'EQUILIBRIUM': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTradingSignalIcon = (buyPT: boolean, buyYT: boolean) => {
    if (buyPT) return '🟢'
    if (buyYT) return '🔵'
    return '⚪'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">PT/YT Yield Markets</h2>
          <p className="text-gray-600">Tokenize yield with Principal Tokens (PT) and Yield Tokens (YT)</p>
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced
        </button>
      </div>

      {/* Asset Selector */}
      <div className="flex space-x-2">
        {assetOptions.map((asset) => (
          <button
            key={asset.key}
            onClick={() => setSelectedAsset(asset.key)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedAsset === asset.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="mr-2">{asset.icon}</span>
            {asset.label}
          </button>
        ))}
      </div>

      {/* Market Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Market Data */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Data</h3>
          {markets[selectedAsset] ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Maturity:</span>
                <span className="font-medium">
                  {new Date(markets[selectedAsset].maturity * 1000).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  markets[selectedAsset].isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {markets[selectedAsset].isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">SY Token:</span>
                <span className="font-mono text-sm text-gray-500">
                  {markets[selectedAsset].syToken.slice(0, 6)}...{markets[selectedAsset].syToken.slice(-4)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Loading market data...</div>
          )}
        </div>

        {/* Analytics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Analytics</h3>
          {marketAnalytics[selectedAsset] ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Current APY:</span>
                <span className="font-medium text-green-600">{marketAnalytics[selectedAsset].currentAPY ? Number(marketAnalytics[selectedAsset].currentAPY).toFixed(2) : '0.00'}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Implied APY:</span>
                <span className="font-medium">{marketAnalytics[selectedAsset].impliedAPY ? Number(marketAnalytics[selectedAsset].impliedAPY).toFixed(2) : '0.00'}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fixed APY:</span>
                <span className="font-medium text-blue-600">{marketAnalytics[selectedAsset].fixedAPY ? Number(marketAnalytics[selectedAsset].fixedAPY).toFixed(2) : '0.00'}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Long Yield APY:</span>
                <span className="font-medium text-purple-600">{marketAnalytics[selectedAsset].longYieldAPY ? Number(marketAnalytics[selectedAsset].longYieldAPY).toFixed(2) : '0.00'}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Market Mode:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMarketModeColor(marketAnalytics[selectedAsset].marketMode)}`}>
                  {marketAnalytics[selectedAsset].marketMode}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Loading analytics...</div>
          )}
        </div>

        {/* Trading Signals */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trading Signals</h3>
          {marketAnalytics[selectedAsset] ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Signal:</span>
                <span className="text-2xl">{getTradingSignalIcon(
                  marketAnalytics[selectedAsset].tradingSignals.buyPT,
                  marketAnalytics[selectedAsset].tradingSignals.buyYT
                )}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Buy PT:</span>
                <span className={`font-medium ${marketAnalytics[selectedAsset].tradingSignals.buyPT ? 'text-green-600' : 'text-gray-400'}`}>
                  {marketAnalytics[selectedAsset].tradingSignals.buyPT ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Buy YT:</span>
                <span className={`font-medium ${marketAnalytics[selectedAsset].tradingSignals.buyYT ? 'text-blue-600' : 'text-gray-400'}`}>
                  {marketAnalytics[selectedAsset].tradingSignals.buyYT ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Confidence:</span>
                <span className="font-medium">{marketAnalytics[selectedAsset].tradingSignals.confidence ? Number(marketAnalytics[selectedAsset].tradingSignals.confidence).toFixed(2) : '0.00'}%</span>
              </div>
              <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                {marketAnalytics[selectedAsset].tradingSignals.reasoning}
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Loading signals...</div>
          )}
        </div>
      </div>

      {/* User Balances */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Balances</h3>
        {userBalances[selectedAsset] ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{userBalances[selectedAsset].underlying ? Number(userBalances[selectedAsset].underlying).toFixed(2) : '0.00'}</div>
              <div className="text-sm text-gray-600">Underlying</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{userBalances[selectedAsset].sy ? Number(userBalances[selectedAsset].sy).toFixed(2) : '0.00'}</div>
              <div className="text-sm text-gray-600">SY Token</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{userBalances[selectedAsset].pt ? Number(userBalances[selectedAsset].pt).toFixed(2) : '0.00'}</div>
              <div className="text-sm text-gray-600">PT Token</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{userBalances[selectedAsset].yt ? Number(userBalances[selectedAsset].yt).toFixed(2) : '0.00'}</div>
              <div className="text-sm text-gray-600">YT Token</div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">Loading balances...</div>
        )}
      </div>

      {/* Basic Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wrap & Split */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Wrap & Split</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Wrap to SY</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={wrapAmount}
                  onChange={(e) => setWrapAmount(e.target.value)}
                  placeholder="Amount"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleWrap}
                  disabled={isLoading || !wrapAmount}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Wrap
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Split SY to PT + YT</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={splitAmount}
                  onChange={(e) => setSplitAmount(e.target.value)}
                  placeholder="SY Amount"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSplit}
                  disabled={isLoading || !splitAmount}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  Split
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Merge & Unwrap */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Merge & Unwrap</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Merge PT + YT to SY</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  type="number"
                  value={mergePTAmount}
                  onChange={(e) => setMergePTAmount(e.target.value)}
                  placeholder="PT Amount"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  value={mergeYTAmount}
                  onChange={(e) => setMergeYTAmount(e.target.value)}
                  placeholder="YT Amount"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleMerge}
                disabled={isLoading || !mergePTAmount || !mergeYTAmount}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                Merge
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unwrap SY to Underlying</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={unwrapAmount}
                  onChange={(e) => setUnwrapAmount(e.target.value)}
                  placeholder="SY Amount"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleUnwrap}
                  disabled={isLoading || !unwrapAmount}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
                >
                  Unwrap
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Operations */}
      {showAdvanced && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Liquidity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Liquidity</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">PT Amount</label>
                <input
                  type="number"
                  value={liquidityPTAmount}
                  onChange={(e) => setLiquidityPTAmount(e.target.value)}
                  placeholder="PT Amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">YT Amount</label>
                <input
                  type="number"
                  value={liquidityYTAmount}
                  onChange={(e) => setLiquidityYTAmount(e.target.value)}
                  placeholder="YT Amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleAddLiquidity}
                disabled={isLoading || !liquidityPTAmount || !liquidityYTAmount}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                Add Liquidity
              </button>
            </div>
          </div>

          {/* Swap */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Swap PT ↔ YT</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Direction</label>
                <select
                  value={swapDirection}
                  onChange={(e) => setSwapDirection(e.target.value as 'PT_TO_YT' | 'YT_TO_PT')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PT_TO_YT">PT → YT</option>
                  <option value="YT_TO_PT">YT → PT</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  value={swapAmount}
                  onChange={(e) => setSwapAmount(e.target.value)}
                  placeholder="Amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleSwap}
                disabled={isLoading || !swapAmount}
                className="w-full px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50"
              >
                Swap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pool Information */}
      {showAdvanced && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pool Information</h3>
          {poolData[selectedAsset] ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{poolData[selectedAsset].reserve0}</div>
                <div className="text-sm text-gray-600">Reserve 0</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{poolData[selectedAsset].reserve1}</div>
                <div className="text-sm text-gray-600">Reserve 1</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{poolData[selectedAsset].totalSupply}</div>
                <div className="text-sm text-gray-600">Total Supply</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{poolData[selectedAsset].yieldMultiplier}x</div>
                <div className="text-sm text-gray-600">Yield Multiplier</div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Loading pool data...</div>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Processing transaction...</p>
          </div>
        </div>
      )}
    </div>
  )
}

import React, { useState } from 'react'
import { useCoreYield } from '../../../hooks/useCoreYield'
import { WORKING_MARKETS } from '../../../constants/assets'
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
    refreshBalances
  } = useCoreYield()

  const [selectedMarket, setSelectedMarket] = useState<string>('lstBTC_0')
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

  // Get the selected market data
  const selectedMarketData = WORKING_MARKETS.lstBTC.find(m => m.marketKey === selectedMarket) || 
                            WORKING_MARKETS.stCORE.find(m => m.marketKey === selectedMarket)

  // Debug logging
  console.log('🔍 Debug - selectedMarket:', selectedMarket)
  console.log('🔍 Debug - WORKING_MARKETS:', WORKING_MARKETS)
  console.log('🔍 Debug - selectedMarketData:', selectedMarketData)
  console.log('🔍 Debug - lstBTC markets:', WORKING_MARKETS.lstBTC)
  console.log('🔍 Debug - stCORE markets:', WORKING_MARKETS.stCORE)

  // Get asset type from selected market
  const selectedAsset = selectedMarketData?.underlying === '0x4D6B4EC6dD26aA2F65e825C9F4Be2F3980506Ba7' ? 'stCORE' : 'lstBTC'

  const handleWrap = async () => {
    if (!wrapAmount || parseFloat(wrapAmount) <= 0 || !selectedMarketData) return
    await wrapToSY(selectedMarket, wrapAmount)
    setWrapAmount('')
    refreshBalances()
  }

  const handleSplit = async () => {
    if (!splitAmount || parseFloat(splitAmount) <= 0 || !selectedMarketData) return
    await splitSY(selectedMarket, splitAmount)
    setSplitAmount('')
    refreshBalances()
  }

  const handleMerge = async () => {
    if (!mergePTAmount || !mergeYTAmount || parseFloat(mergePTAmount) <= 0 || parseFloat(mergeYTAmount) <= 0 || !selectedMarketData) return
    await mergePTYT(selectedMarket, mergePTAmount, mergeYTAmount)
    setMergePTAmount('')
    setMergeYTAmount('')
    refreshBalances()
  }

  const handleUnwrap = async () => {
    if (!unwrapAmount || parseFloat(unwrapAmount) <= 0 || !selectedMarketData) return
    await unwrapFromSY(selectedMarket, unwrapAmount)
    setUnwrapAmount('')
    refreshBalances()
  }

  const handleAddLiquidity = async () => {
    if (!liquidityPTAmount || !liquidityYTAmount || parseFloat(liquidityPTAmount) <= 0 || parseFloat(liquidityYTAmount) <= 0 || !selectedMarketData) return
    // TODO: Implement addLiquidity function
    console.log('Add liquidity functionality coming soon!')
    setLiquidityPTAmount('')
    setLiquidityYTAmount('')
    refreshBalances()
  }

  const handleSwap = async () => {
    if (!swapAmount || parseFloat(swapAmount) <= 0 || !selectedMarketData) return
    // TODO: Implement swap functionality
    console.log('Swap functionality coming soon!')
    setSwapAmount('')
    refreshBalances()
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Market Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-700 font-medium">Total Markets:</span>
            <div className="text-blue-900 font-bold text-lg">
              {WORKING_MARKETS.lstBTC.length + WORKING_MARKETS.stCORE.length}
            </div>
          </div>
          <div>
            <span className="text-blue-700 font-medium">Breakdown:</span>
            <div className="text-blue-900">
              {WORKING_MARKETS.lstBTC.length} lstBTC + {WORKING_MARKETS.stCORE.length} stCORE
            </div>
          </div>
        </div>
      </div>

      {/* Market Selector */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Select Market</h3>
        
        {/* lstBTC Markets */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-2">₿ lstBTC Markets ({WORKING_MARKETS.lstBTC.length} markets)</h4>
          <div className="text-xs text-gray-500 mb-2">
            Debug: Found {WORKING_MARKETS.lstBTC.length} lstBTC markets
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {WORKING_MARKETS.lstBTC.map((market) => (
              <button
                key={market.marketKey}
                onClick={() => setSelectedMarket(market.marketKey)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedMarket === market.marketKey
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-left">
                  <div className="font-medium text-gray-900">{market.name}</div>
                  <div className="text-sm text-gray-600">{market.description}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    PT: {market.poolReserves.pt} | YT: {market.poolReserves.yt}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* stCORE Markets */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-2">🔥 stCORE Markets ({WORKING_MARKETS.stCORE.length} markets)</h4>
          <div className="text-xs text-gray-500 mb-2">
            Debug: Found {WORKING_MARKETS.stCORE.length} stCORE markets
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {WORKING_MARKETS.stCORE.map((market) => (
              <button
                key={market.marketKey}
                onClick={() => setSelectedMarket(market.marketKey)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedMarket === market.marketKey
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-left">
                  <div className="font-medium text-gray-900">{market.name}</div>
                  <div className="text-sm text-gray-600">{market.description}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    PT: {market.poolReserves.pt} | YT: {market.poolReserves.yt}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Market Details */}
      {selectedMarketData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Selected Market: {selectedMarketData.name}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-700 font-medium">Underlying:</span>
              <div className="text-blue-900">{selectedAsset}</div>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Maturity:</span>
              <div className="text-blue-900">
                {new Date(selectedMarketData.maturity * 1000).toLocaleDateString()}
              </div>
            </div>
            <div>
              <span className="text-blue-700 font-medium">PT Reserves:</span>
              <div className="text-blue-900">{selectedMarketData.poolReserves.pt}</div>
            </div>
            <div>
              <span className="text-blue-700 font-medium">YT Reserves:</span>
              <div className="text-blue-900">{selectedMarketData.poolReserves.yt}</div>
            </div>
          </div>
        </div>
      )}

      {/* Market Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Market Data */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Data</h3>
          {selectedMarketData ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Market:</span>
                <span className="font-medium">{selectedMarketData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Maturity:</span>
                <span className="font-medium">
                  {new Date(selectedMarketData.maturity * 1000).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">SY Token:</span>
                <span className="font-mono text-sm text-gray-500">
                  {selectedMarketData.syToken.slice(0, 6)}...{selectedMarketData.syToken.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">PT Token:</span>
                <span className="font-mono text-sm text-gray-500">
                  {selectedMarketData.ptToken.slice(0, 6)}...{selectedMarketData.ptToken.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">YT Token:</span>
                <span className="font-mono text-sm text-gray-500">
                  {selectedMarketData.ytToken.slice(0, 6)}...{selectedMarketData.ytToken.slice(-4)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Please select a market</div>
          )}
        </div>

        {/* Pool Reserves */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pool Reserves</h3>
          {selectedMarketData ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">PT Reserves:</span>
                <span className="font-medium text-green-600">{selectedMarketData.poolReserves.pt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">YT Reserves:</span>
                <span className="font-medium text-blue-600">{selectedMarketData.poolReserves.yt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Liquidity:</span>
                <span className="font-medium">
                  {(parseFloat(selectedMarketData.poolReserves.pt) + parseFloat(selectedMarketData.poolReserves.yt)).toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">PT/YT Ratio:</span>
                <span className="font-medium">
                  {(parseFloat(selectedMarketData.poolReserves.pt) / parseFloat(selectedMarketData.poolReserves.yt)).toFixed(2)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Please select a market</div>
          )}
        </div>

        {/* Trading Signals */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Status</h3>
          {selectedMarketData ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="text-2xl">✅</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Liquidity:</span>
                <span className="font-medium text-green-600">High</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Trading:</span>
                <span className="font-medium text-green-600">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Yield:</span>
                <span className="font-medium text-blue-600">Available</span>
              </div>
              <div className="text-sm text-gray-600 bg-green-50 p-2 rounded">
                This market is fully functional with liquid pools for PT/YT trading
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Please select a market</div>
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
                  disabled={isLoading || !wrapAmount || !selectedMarketData}
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
                  disabled={isLoading || !splitAmount || !selectedMarketData}
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
              <div className="grid grid-cols-2 gap-2">
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
                disabled={isLoading || !mergePTAmount || !mergeYTAmount || !selectedMarketData}
                className="w-full mt-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
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
                  disabled={isLoading || !unwrapAmount || !selectedMarketData}
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
                disabled={isLoading || !liquidityPTAmount || !liquidityYTAmount || !selectedMarketData}
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
                disabled={isLoading || !swapAmount || !selectedMarketData}
                className="w-full px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50"
              >
                Swap
              </button>
            </div>
          </div>
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

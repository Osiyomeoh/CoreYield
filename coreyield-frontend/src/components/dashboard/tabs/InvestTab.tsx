import React, { useState } from 'react'
import { AssetCard } from '../cards/AssetCard'
import { AssetSelector } from '../shared/AssetSelector'
import { ActionButton } from '../shared/ActionButton'
import { AmountInput } from '../shared/AmountInput'

interface InvestTabProps {
  currentHook: any
  selectedAsset: string
  setSelectedAsset: (asset: string) => void
}

// Dynamic asset data based on real contract data
const getAvailableAssets = (currentHook: any) => {
  const baseAPY = currentHook?.portfolioData?.totalAPY ? parseFloat(currentHook.portfolioData.totalAPY) : 8.5
  
  return {
    stCORE: {
      symbol: 'stCORE',
      name: 'Staked CORE',
      icon: '🔥',
      apy: baseAPY,
      description: 'Liquid staking token from Core Network',
      tvl: '$890K',
      category: 'Liquid Staking',
      riskLevel: 'Low'
    }
  } as const
}

export const InvestTab: React.FC<InvestTabProps> = ({
  currentHook,
  selectedAsset,
  setSelectedAsset
}) => {
  const [investAmount, setInvestAmount] = useState('')
  const [isInvesting, setIsInvesting] = useState(false)

  // Safe access to hook data with fallbacks
  const assetBalance = currentHook?.assetBalance || '0'
  const syBalance = currentHook?.syBalance || '0'
  const ptBalance = currentHook?.ptBalance || '0'
  const ytBalance = currentHook?.ytBalance || '0'

  // Safe formatting functions
  const formatBalance = (balance: string) => {
    try {
      return currentHook?.formatBalance ? currentHook.formatBalance(balance) : parseFloat(balance || '0').toFixed(4)
    } catch {
      return '0.0000'
    }
  }

  const formatBalanceUSD = (balance: string) => {
    try {
      return currentHook?.formatBalanceUSD ? currentHook.formatBalanceUSD(balance) : '$0.00'
    } catch {
      return '$0.00'
    }
  }

  // Calculate total portfolio value safely
  const getTotalValue = () => {
    try {
      const total = parseFloat(assetBalance || '0') + 
                   parseFloat(syBalance || '0') + 
                   parseFloat(ptBalance || '0') + 
                   parseFloat(ytBalance || '0')
      return total.toFixed(4)
    } catch {
      return '0.0000'
    }
  }

  const availableAssets = getAvailableAssets(currentHook)
  const selectedAssetData = availableAssets[selectedAsset as keyof typeof availableAssets] || availableAssets.stCORE

  const handleInvest = async () => {
    if (!investAmount || parseFloat(investAmount) <= 0) return
    
    setIsInvesting(true)
    try {
      // Call your investment function here
      if (currentHook?.handleDeposit) {
        await currentHook.handleDeposit(investAmount)
      }
      setInvestAmount('')
    } catch (error) {
      console.error('Investment failed:', error)
    } finally {
      setIsInvesting(false)
    }
  }

  const handleMaxClick = () => {
    setInvestAmount(formatBalance(assetBalance))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">🚀 Invest in Yield Assets</h3>
        <p className="text-gray-400">
          Choose assets to invest in and start earning yield on your positions
        </p>
      </div>

      {/* Portfolio Overview */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-white mb-4">📊 Portfolio Overview</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-gray-400 text-sm">Total Value</p>
            <p className="text-white font-bold text-xl">{formatBalanceUSD(getTotalValue())}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Available Balance</p>
            <p className="text-white font-bold text-xl">{formatBalance(assetBalance)}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Invested Amount</p>
            <p className="text-white font-bold text-xl">{formatBalance(syBalance)}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Current APY</p>
            <p className="text-green-400 font-bold text-xl">{selectedAssetData.apy}%</p>
          </div>
        </div>
      </div>

      {/* Asset Selection */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Choose Asset</h4>
        
        <AssetSelector
          selectedAsset={selectedAsset}
          onAssetSelect={setSelectedAsset}
          assets={availableAssets}
        />

        {/* Selected Asset Details */}
        <div className="mt-6">
          <AssetCard
            asset={selectedAssetData}
            balance={formatBalance(assetBalance)}
            usdValue={formatBalanceUSD(assetBalance)}
            onClick={() => {}} // Optional click handler
          />
        </div>
      </div>

      {/* Investment Interface */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
        <h4 className="text-lg font-semibold text-white mb-4">💰 Invest in {selectedAssetData.symbol}</h4>
        
        <div className="space-y-4">
          <AmountInput
            value={investAmount}
            onChange={setInvestAmount}
            placeholder="0.0"
            label="Amount to Invest"
            maxBalance={formatBalance(assetBalance)}
            onMaxClick={handleMaxClick}
            token={selectedAssetData.symbol}
            disabled={isInvesting}
          />

          {/* Investment Preview */}
          {investAmount && parseFloat(investAmount) > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h5 className="text-blue-300 font-medium mb-3">Investment Preview</h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">You're Investing</p>
                  <p className="text-white font-semibold">{investAmount} {selectedAssetData.symbol}</p>
                </div>
                <div>
                  <p className="text-gray-400">Expected APY</p>
                  <p className="text-green-400 font-semibold">{selectedAssetData.apy}%</p>
                </div>
                <div>
                  <p className="text-gray-400">You'll Receive</p>
                  <p className="text-white font-semibold">{investAmount} SY-{selectedAssetData.symbol}</p>
                </div>
                <div>
                  <p className="text-gray-400">Risk Level</p>
                  <p className="text-yellow-400 font-semibold">{selectedAssetData.riskLevel}</p>
                </div>
              </div>
            </div>
          )}

          {/* Investment Button */}
          <ActionButton
            onClick={handleInvest}
            disabled={!investAmount || parseFloat(investAmount) <= 0 || parseFloat(investAmount) > parseFloat(assetBalance) || isInvesting}
            loading={isInvesting}
            loadingText="Processing Investment..."
            variant="primary"
            fullWidth
          >
            {!investAmount || parseFloat(investAmount) <= 0 
              ? 'Enter amount to invest'
              : parseFloat(investAmount) > parseFloat(assetBalance)
              ? 'Insufficient balance'
              : `🚀 Invest ${investAmount} ${selectedAssetData.symbol}`
            }
          </ActionButton>
        </div>
      </div>

      {/* Investment Opportunities */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
        <h4 className="text-lg font-semibold text-white mb-4">🌟 Featured Opportunities</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(availableAssets).map(([key, asset]) => (
            <div
              key={key}
              className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6 hover:border-gray-600 transition-colors cursor-pointer"
              onClick={() => setSelectedAsset(key)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{asset.icon}</span>
                  <div>
                    <h5 className="text-white font-semibold">{asset.name}</h5>
                    <p className="text-gray-400 text-sm">{asset.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold text-lg">{asset.apy}%</p>
                  <p className="text-gray-400 text-xs">{asset.riskLevel} Risk</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm mb-4">{asset.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">TVL: {asset.tvl}</span>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                  Invest Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Educational Note */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-white mb-3">💡 How Investment Works</h4>
        <div className="space-y-3 text-sm text-gray-300">
          <div className="flex items-start space-x-3">
            <span className="text-blue-400 mt-1">1.</span>
            <p><strong>Deposit:</strong> You deposit your {selectedAssetData.symbol} tokens into the yield protocol</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-blue-400 mt-1">2.</span>
            <p><strong>Wrap:</strong> Your tokens are wrapped into SY-{selectedAssetData.symbol} (yield-bearing tokens)</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-blue-400 mt-1">3.</span>
            <p><strong>Split:</strong> SY tokens can be split into PT (Principal) and YT (Yield) tokens</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-blue-400 mt-1">4.</span>
            <p><strong>Earn:</strong> Your investment earns {selectedAssetData.apy}% APY automatically</p>
          </div>
        </div>
      </div>
    </div>
  )
}
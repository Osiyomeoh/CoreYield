import React, { useState } from 'react'
import { useYieldProtocol } from '../../../hooks/useYieldProtocol'
import { CONTRACTS, ASSET_METADATA } from '../../../../contracts/addresses'
import { ActionButton } from '../shared/ActionButton'

interface YieldTabProps {
  currentHook: any
  selectedAsset: string
  setSelectedAsset: (asset: string) => void
}

export const YieldTab: React.FC<YieldTabProps> = ({
  currentHook,
  selectedAsset,
  setSelectedAsset
}) => {
  const { userBalances, marketAnalytics, isLoading } = useYieldProtocol()
  const [claimAmount, setClaimAmount] = useState('')

  const assetOptions = [
    { key: 'dualCORE', label: 'Dual CORE', icon: '⚡', color: 'from-purple-500 to-blue-500' },
    { key: 'stCORE', label: 'Staked CORE', icon: '🔥', color: 'from-orange-500 to-red-500' },
    { key: 'lstBTC', label: 'Liquid Staked BTC', icon: '₿', color: 'from-yellow-500 to-orange-500' }
  ] as const

  const handleClaimYield = async (asset: string) => {
    try {
      // TODO: Implement actual yield claiming from YT tokens
      console.log(`Claiming yield for ${asset}`)
      // This would call the YT token's claimYield function
    } catch (error) {
      console.error('Yield claiming failed:', error)
    }
  }

  const calculateYieldEarned = (asset: string) => {
    // TODO: Calculate actual yield earned from YT position
    // This would involve tracking the initial investment vs current value
    return '0.00'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">💰 Yield Management</h3>
        <p className="text-gray-400">
          Claim and track yield from your YT (Yield Token) positions
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

      {/* Yield Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Yield Earned */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-3xl">💰</span>
            <div>
              <h4 className="text-xl font-bold text-white">Total Yield Earned</h4>
              <p className="text-green-100">Across all positions</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-white">
            {assetOptions.reduce((total, asset) => {
              return total + parseFloat(calculateYieldEarned(asset.key))
            }, 0).toFixed(2)} CORE
          </div>
        </div>

        {/* YT Positions */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-3xl">📈</span>
            <div>
              <h4 className="text-xl font-bold text-white">YT Positions</h4>
              <p className="text-blue-100">Active yield positions</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-white">
            {assetOptions.filter(asset => 
              parseFloat(userBalances[asset.key]?.yt || '0') > 0
            ).length}
          </div>
        </div>

        {/* Average APY */}
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-3xl">📊</span>
            <div>
              <h4 className="text-xl font-bold text-white">Average APY</h4>
              <p className="text-orange-100">Weighted by position</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-white">
            {assetOptions.reduce((total, asset) => {
              const metadata = ASSET_METADATA[asset.key as keyof typeof ASSET_METADATA]
              return total + (metadata?.apy || 0)
            }, 0) / assetOptions.length}%
          </div>
        </div>
      </div>

      {/* Selected Asset Yield Details */}
      {selectedAsset && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
          <h4 className="text-lg font-semibold text-white mb-4">
            Yield Details: {ASSET_METADATA[selectedAsset as keyof typeof ASSET_METADATA]?.label}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* YT Position Info */}
            <div className="space-y-4">
              <h5 className="text-blue-400 font-medium">YT Position</h5>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">YT Balance</span>
                  <span className="text-white font-semibold">
                    {userBalances[selectedAsset]?.yt || '0.00'} YT
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Yield Earned</span>
                  <span className="text-green-400 font-semibold">
                    {calculateYieldEarned(selectedAsset)} {selectedAsset}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Current APY</span>
                  <span className="text-white font-semibold">
                    {ASSET_METADATA[selectedAsset as keyof typeof ASSET_METADATA]?.apy}%
                  </span>
                </div>
              </div>
            </div>

            {/* Yield Claiming */}
            <div className="space-y-4">
              <h5 className="text-green-400 font-medium">Claim Yield</h5>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Available to Claim</span>
                  <span className="text-green-400 font-semibold">
                    {calculateYieldEarned(selectedAsset)} {selectedAsset}
                  </span>
                </div>
                <ActionButton
                  onClick={() => handleClaimYield(selectedAsset)}
                  disabled={parseFloat(calculateYieldEarned(selectedAsset)) <= 0 || isLoading}
                  loading={isLoading}
                  variant="success"
                  fullWidth
                >
                  {parseFloat(calculateYieldEarned(selectedAsset)) <= 0 
                    ? 'No Yield to Claim' 
                    : `💰 Claim ${calculateYieldEarned(selectedAsset)} ${selectedAsset}`
                  }
                </ActionButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Yield History */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
        <h4 className="text-lg font-semibold text-white mb-4">📋 Yield History</h4>
        <div className="text-center text-gray-400 py-8">
          <p>Yield claiming history will be displayed here</p>
          <p className="text-sm">Track your yield earnings over time</p>
        </div>
      </div>
    </div>
  )
}

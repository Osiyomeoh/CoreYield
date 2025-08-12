import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Zap, Clock } from 'lucide-react'

interface YieldDemoProps {
  selectedAsset: {
    name: string
    symbol: string
    apy: number
    icon: string
    color: string
  }
  ptBalance: bigint | undefined
  ytBalance: bigint | undefined
  ytClaimableYield: bigint | undefined
  formatBalance: (balance: bigint | undefined, decimals?: number) => string
  onAddYieldSnapshot?: (amount: string) => void
}

export const YieldDemo: React.FC<YieldDemoProps> = ({
  selectedAsset,
  ptBalance,
  ytBalance,
  ytClaimableYield,
  formatBalance,
  onAddYieldSnapshot
}) => {
  const [yieldAmount, setYieldAmount] = useState('0.1')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const hasPTTokens = ptBalance && ptBalance > 0n
  const hasYTTokens = ytBalance && ytBalance > 0n
  const hasClaimableYield = ytClaimableYield && ytClaimableYield > 0n

  const calculatePTImpliedYield = (ptAmount: bigint, daysHeld: number = 30): number => {
    if (!ptAmount || ptAmount === 0n) return 0
    const ptBalance = Number(ptAmount) / 1e18
    const assetAPY = selectedAsset.apy / 100
    const dailyRate = assetAPY / 365
    return ptBalance * dailyRate * daysHeld
  }

  const calculateYTYield = (ytAmount: bigint, daysHeld: number = 30): number => {
    if (!ytAmount || ytAmount === 0n) return 0
    const ytBalance = Number(ytAmount) / 1e18
    const assetAPY = selectedAsset.apy / 100
    const dailyRate = assetAPY / 365
    return ytBalance * dailyRate * daysHeld
  }

  const getExpectedYieldRate = (): string => {
    const assetAPY = selectedAsset.apy
    const dailyRate = assetAPY / 365
    const weeklyRate = dailyRate * 7
    const monthlyRate = dailyRate * 30
    
    return `${assetAPY}% APY (${dailyRate.toFixed(4)}% daily, ${weeklyRate.toFixed(3)}% weekly, ${monthlyRate.toFixed(2)}% monthly)`
  }

  const ptImpliedYield = calculatePTImpliedYield(ptBalance || 0n)
  const ytCalculatedYield = calculateYTYield(ytBalance || 0n)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-2xl p-6 border border-gray-700/50 shadow-lg"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 bg-gradient-to-br ${selectedAsset.color} rounded-xl flex items-center justify-center text-2xl`}>
            {selectedAsset.icon}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Yield Demo - {selectedAsset.symbol}</h3>
            <p className="text-gray-400 text-sm">Demonstrate PT/YT yield functionality</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300 transition-colors"
        >
          {showAdvanced ? 'Hide' : 'Advanced'}
        </button>
      </div>

      {/* Current Token Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-750 rounded-xl p-4 border border-gray-600/50">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span className="text-blue-400 font-medium">PT Balance</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {hasPTTokens ? formatBalance(ptBalance) : '0.0000'}
          </div>
          <div className="text-xs text-gray-400">Principal Tokens</div>
        </div>

        <div className="bg-gray-750 rounded-xl p-4 border border-gray-600/50">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12z" />
              </svg>
            </div>
            <span className="text-purple-400 font-medium">YT Balance</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {hasYTTokens ? formatBalance(ytBalance) : '0.0000'}
          </div>
          <div className="text-xs text-gray-400">Yield Tokens</div>
        </div>

        <div className="bg-gray-750 rounded-xl p-4 border border-gray-600/50">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-green-400 font-medium">Claimable Yield</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {hasClaimableYield ? formatBalance(ytClaimableYield) : '0.0000'}
          </div>
          <div className="text-xs text-gray-400">Ready to Claim</div>
        </div>
      </div>

      {/* Yield Calculations */}
      <div className="bg-gray-750 rounded-xl p-4 border border-gray-600/50 mb-6">
        <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span>Yield Calculations (30-day projection)</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-400 mb-1">PT Implied Yield (Fixed)</div>
            <div className="text-lg font-semibold text-blue-300">
              {ptImpliedYield.toFixed(6)} {selectedAsset.symbol}
            </div>
            <div className="text-xs text-gray-500">Based on {selectedAsset.apy}% APY</div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">YT Calculated Yield (Variable)</div>
            <div className="text-lg font-semibold text-purple-300">
              {ytCalculatedYield.toFixed(6)} {selectedAsset.symbol}
            </div>
            <div className="text-xs text-gray-500">Based on {selectedAsset.apy}% APY</div>
          </div>
        </div>
        <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="text-sm text-blue-300 font-medium">Expected Yield Rate</div>
          <div className="text-xs text-blue-400">{getExpectedYieldRate()}</div>
        </div>
      </div>

      {/* Add Yield Snapshot */}
      {onAddYieldSnapshot && (
        <div className="bg-gray-750 rounded-xl p-4 border border-gray-600/50 mb-6">
          <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-orange-400" />
            <span>Add Yield Snapshot (Demo)</span>
          </h4>
          <p className="text-gray-400 text-sm mb-4">
            This adds a yield snapshot to YT tokens, making yield claimable. In production, this would happen automatically.
          </p>
          
          <div className="flex items-center space-x-3">
            <input
              type="number"
              value={yieldAmount}
              onChange={(e) => setYieldAmount(e.target.value)}
              placeholder="0.1"
              step="0.01"
              min="0.01"
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => onAddYieldSnapshot(yieldAmount)}
              disabled={!hasYTTokens}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Add Yield</span>
            </button>
          </div>
          
          {!hasYTTokens && (
            <div className="mt-2 text-xs text-orange-400">
              ⚠️ You need YT tokens first. Split your SY tokens to get PT + YT.
            </div>
          )}
        </div>
      )}

      {/* Advanced Info */}
      {showAdvanced && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-gray-750 rounded-xl p-4 border border-gray-600/50"
        >
          <h4 className="text-white font-medium mb-3">How It Works</h4>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
              <div>
                <span className="text-blue-400 font-medium">PT (Principal Token):</span> Guaranteed principal, earns fixed yield over time
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
              <div>
                <span className="text-purple-400 font-medium">YT (Yield Token):</span> Variable yield, can be claimed anytime
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
              <div>
                <span className="text-green-400 font-medium">Yield Snapshots:</span> Track yield accumulation over time for YT tokens
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Status Messages */}
      {!hasPTTokens && !hasYTTokens && (
        <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center space-x-2 text-yellow-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="font-medium">No PT/YT tokens yet</span>
          </div>
          <p className="text-yellow-300 text-sm mt-1">
            Deposit your {selectedAsset.symbol} tokens and split them into PT + YT to start earning yield!
          </p>
        </div>
      )}

      {hasYTTokens && !hasClaimableYield && (
        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center space-x-2 text-blue-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">YT tokens ready</span>
          </div>
          <p className="text-blue-300 text-sm mt-1">
            You have YT tokens but no yield to claim yet. Add a yield snapshot above to see yield accumulation!
          </p>
        </div>
      )}
    </motion.div>
  )
} 
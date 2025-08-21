import React from 'react'
import { ActionButton } from '../shared/ActionButton'

interface PTTokenCardProps {
  asset: any
  balance: number
  displayMode: 'usd' | 'underlying'
  hook: any
  onRedeem: () => void
}

export const PTTokenCard: React.FC<PTTokenCardProps> = ({
  asset,
  balance,
  displayMode,
  hook,
  onRedeem
}) => {
  return (
    <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <div className="text-xl font-bold text-purple-300">PT-{asset.symbol}</div>
            <div className="text-sm text-gray-400">Principal Token</div>
          </div>
        </div>
        <div className="px-4 py-2 bg-purple-500/20 rounded-full border border-purple-500/30">
          <span className="text-sm text-purple-300 font-semibold">FIXED RETURN</span>
        </div>
      </div>
      
      {/* Balance Display */}
      <div className="text-3xl font-bold text-purple-200 mb-4">
        {displayMode === 'usd' ? `$${(balance * 1.05).toFixed(2)}` : `${balance.toFixed(4)} PT`}
      </div>
      
      {/* PT Token Explanation */}
      <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
        <div className="text-xs text-purple-300 space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-blue-400">🔒</span>
            <span><strong>PT tokens represent the underlying asset value</strong></span>
          </div>
          <div className="text-xs text-purple-200">
            Redeemable 1:1 for {asset.symbol} at maturity ({asset.maturity})
          </div>
        </div>
      </div>

      {balance > 0 ? (
        <div className="space-y-4">
          {/* Token Details */}
          <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-300 font-medium">Maturity Date</span>
              <span className="text-white font-bold">{asset.maturity}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-300 font-medium">Redemption Value</span>
              <span className="text-white font-bold">1:1 {asset.symbol}</span>
            </div>
            <div className="text-xs text-purple-300">
              Current trading at ~{((balance * 0.98) / balance * 100).toFixed(1)}% of face value
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-purple-500/10 p-3 rounded-xl border border-purple-500/20">
              <div className="text-purple-300 font-medium">Current Price</div>
              <div className="text-white font-bold">$0.98</div>
            </div>
            <div className="bg-purple-500/10 p-3 rounded-xl border border-purple-500/20">
              <div className="text-purple-300 font-medium">Face Value</div>
              <div className="text-white font-bold">$1.00</div>
            </div>
          </div>

          {/* Value Breakdown */}
          <div className="bg-purple-500/10 p-4 rounded-xl border border-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-300 font-medium">Current Value</span>
              <span className="text-white font-bold">${(balance * 0.98).toFixed(4)}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-300 font-medium">Maturity Value</span>
              <span className="text-green-400 font-bold">${(balance * 1.00).toFixed(4)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-purple-300 font-medium">Potential Gain</span>
              <span className="text-green-400 font-bold">+${(balance * 0.02).toFixed(4)}</span>
            </div>
          </div>

          {/* Redeem Button */}
          <ActionButton
            onClick={onRedeem}
            disabled={hook?.isRedeemingPT}
            loading={hook?.isRedeemingPT}
            loadingText="Redeeming..."
            className="w-full"
            variant="primary"
          >
            <div className="flex items-center justify-center space-x-2">
              <span>🔓</span>
              <span>Redeem {balance.toFixed(4)} PT → {balance.toFixed(4)} {asset.symbol}</span>
            </div>
          </ActionButton>

          {/* Information Note */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <div className="text-xs text-blue-300">
              <div className="flex items-center space-x-2 mb-1">
                <span>ℹ️</span>
                <span><strong>Redemption Info</strong></span>
              </div>
              <div>
                PT tokens can be redeemed for the underlying {asset.symbol} at any time before or at maturity.
                Early redemption may result in a slight discount compared to holding until maturity.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="text-gray-400 mb-2">No PT tokens yet</div>
          <div className="text-xs text-purple-300 bg-purple-500/10 p-2 rounded-lg border border-purple-500/20">
            PT Address: {hook?.ptTokenAddress ? `${hook.ptTokenAddress.slice(0, 10)}...` : 'Not found'}
          </div>
        </div>
      )}
    </div>
  )
}
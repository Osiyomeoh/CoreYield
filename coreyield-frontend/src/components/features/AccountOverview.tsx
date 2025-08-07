import React from 'react'
import { motion } from 'framer-motion'
import { Zap, DollarSign, Target, Gift, Loader2 } from 'lucide-react'
import { formatEther } from 'viem'
import type { YieldAsset } from '@/types'

interface AccountOverviewProps {
  isConnected: boolean
  coreBalance: bigint | undefined
  syBalance: string
  selectedAsset: YieldAsset
  isMinting: boolean
  onMintTestTokens: () => void
}

const AccountOverview: React.FC<AccountOverviewProps> = ({
  isConnected,
  coreBalance,
  syBalance,
  selectedAsset,
  isMinting,
  onMintTestTokens
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Account Overview</h3>
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
      </div>
      
      {isConnected ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <DollarSign className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-400">CORE Balance</span>
              </div>
              <div className="text-sm font-medium">
                {coreBalance ? parseFloat(formatEther(coreBalance)).toFixed(4) : '0.0000'} CORE
              </div>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Target className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-gray-400">Total SY</span>
              </div>
              <div className="text-sm font-medium text-purple-400">
                {syBalance} SY
              </div>
            </div>
          </div>
          
          <button
            onClick={onMintTestTokens}
            disabled={isMinting}
            className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-sm font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center space-x-2">
              {isMinting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Gift className="w-4 h-4" />
              )}
              <span>
                {isMinting ? 'Minting...' : `Get 1000 ${selectedAsset.name}`}
              </span>
            </div>
          </button>
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Zap className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-400 text-sm mb-4">Connect your wallet to start earning yield</p>
        </div>
      )}
    </motion.div>
  )
}

export default AccountOverview
import React from 'react'
import { BalanceCard } from '../cards/BalanceCard'
import { useCoreYield } from '../../../hooks/useCoreYield'
import { formatUnits } from 'viem'

interface BalanceOverviewProps {
  currentHook?: any
  selectedAsset?: string
}

export const BalanceOverview: React.FC<BalanceOverviewProps> = ({
  currentHook,
  selectedAsset
}) => {
  const coreYield = useCoreYield()

  // Use real CoreYield data with better fallbacks
  const coreBalance = coreYield.coreBalance ? formatUnits(coreYield.coreBalance.value, coreYield.coreBalance.decimals) : '0'
  const stCoreBalance = coreYield.stCoreBalance ? formatUnits(coreYield.stCoreBalance.value, coreYield.stCoreBalance.decimals) : '0'
  const portfolioValue = coreYield.portfolioData.totalValue || '0'
  const portfolioAPY = coreYield.portfolioData.totalAPY || '0'
  const stakedAmount = coreYield.stakingData.stakedAmount || '0'
  const totalRewards = coreYield.stakingData.totalRewards || '0'

  // Safe formatting functions with fallbacks
  const formatBalance = (balance: string) => {
    try {
      const num = parseFloat(balance || '0')
      if (num === 0) return '0.0000'
      if (num < 0.0001) return '< 0.0001'
      return num.toFixed(4)
    } catch {
      return '0.0000'
    }
  }

  const formatBalanceUSD = (balance: string) => {
    try {
      // For now, use a simple conversion (1 CORE = $1 for demo)
      const usdValue = parseFloat(balance || '0') * 1
      if (usdValue === 0) return '$0.00'
      if (usdValue < 0.01) return '< $0.01'
      return `$${usdValue.toFixed(2)}`
    } catch {
      return '$0.00'
    }
  }

  const formatAPY = (apy: string) => {
    try {
      const num = parseFloat(apy || '0')
      if (num === 0) return '0.00%'
      return `${num.toFixed(2)}%`
    } catch {
      return '0.00%'
    }
  }

  // Get asset symbol safely
  const assetSymbol = selectedAsset || 'stCORE'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Portfolio Overview</h2>
        <p className="text-gray-400">
          Manage your {assetSymbol} yield positions and track your earnings
        </p>
      </div>

      {/* Balance Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* CORE Balance Card */}
        <BalanceCard
          title="CORE"
          balance={formatBalance(coreBalance)}
          usdValue={formatBalanceUSD(coreBalance)}
          icon="⚡"
          gradient="from-yellow-500/10 to-orange-500/10"
          borderColor="border-yellow-500/20"
          textColor="text-yellow-400"
          subtitle="Core Token Balance"
        />

        {/* stCORE Balance Card */}
        <BalanceCard
          title="stCORE"
          balance={formatBalance(stCoreBalance)}
          usdValue={formatBalanceUSD(stCoreBalance)}
          icon="🔥"
          gradient="from-orange-500/10 to-red-500/10"
          borderColor="border-orange-500/20"
          textColor="text-orange-400"
          subtitle="Liquid Staked CORE"
        />

        {/* Portfolio Value Card */}
        <BalanceCard
          title="Portfolio"
          balance={formatBalance(portfolioValue)}
          usdValue={formatBalanceUSD(portfolioValue)}
          icon="📊"
          gradient="from-blue-500/10 to-cyan-500/10"
          borderColor="border-blue-500/20"
          textColor="text-blue-400"
          subtitle={`APY: ${formatAPY(portfolioAPY)}`}
        />

        {/* Staking Rewards Card */}
        <BalanceCard
          title="Rewards"
          balance={formatBalance(totalRewards)}
          usdValue={formatBalanceUSD(totalRewards)}
          icon="🎁"
          gradient="from-green-500/10 to-emerald-500/10"
          borderColor="border-green-500/20"
          textColor="text-green-400"
          subtitle="Total Staking Rewards"
        />
      </div>

      {/* Additional Portfolio Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <div className="text-center">
            <p className="text-gray-400 text-sm">Total Staked</p>
            <p className="text-white text-lg font-semibold">{formatBalance(stakedAmount)} CORE</p>
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <div className="text-center">
            <p className="text-gray-400 text-sm">Portfolio Risk</p>
            <p className="text-white text-lg font-semibold">{coreYield.riskData.riskScore}/10</p>
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <div className="text-center">
            <div className="text-gray-400 text-sm">Active Strategies</div>
            <div className="text-white text-lg font-semibold">{coreYield.portfolioData.strategyCount}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
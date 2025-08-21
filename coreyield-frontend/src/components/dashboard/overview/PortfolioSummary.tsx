import React from 'react'
import { useCoreYield } from '../../../hooks/useCoreYield'
import { formatUnits } from 'viem'

interface PortfolioSummaryProps {
  allHooks?: any
  displayMode?: 'usd' | 'underlying'
}

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = () => {
  const coreYield = useCoreYield()

  const calculateTotals = () => {
    // Use real CoreYield data with better fallbacks
    const totalPortfolioValue = parseFloat(coreYield.portfolioData.totalValue || '0')
    const totalAPY = parseFloat(coreYield.portfolioData.totalAPY || '0')
    const totalRisk = parseInt(coreYield.portfolioData.totalRisk || '0')
    const strategyCount = coreYield.portfolioData.strategyCount || 0
    const bridgeRequestCount = coreYield.portfolioData.bridgeRequestCount || 0

    // Calculate individual asset values with proper fallbacks
    const coreBalance = coreYield.coreBalance ? parseFloat(formatUnits(coreYield.coreBalance.value, coreYield.coreBalance.decimals)) : 0
    const stCoreBalance = coreYield.stCoreBalance ? parseFloat(formatUnits(coreYield.stCoreBalance.value, coreYield.stCoreBalance.decimals)) : 0
    const stakedAmount = parseFloat(coreYield.stakingData.stakedAmount || '0')
    const totalRewards = parseFloat(coreYield.stakingData.totalRewards || '0')

    // Debug logging
    console.log('PortfolioSummary Debug:', {
      coreBalance,
      stCoreBalance,
      stakedAmount,
      totalRewards,
      totalPortfolioValue,
      totalAPY
    })

    return {
      totalPortfolioValue,
      totalAPY,
      totalRisk,
      strategyCount,
      bridgeRequestCount,
      coreBalance,
      stCoreBalance,
      stakedAmount,
      totalRewards
    }
  }

  const totals = calculateTotals()

  return (
    <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-blue-300">Portfolio Summary</h3>
        <div className="text-right">
          <div className="text-3xl font-bold text-white">${totals.totalPortfolioValue.toFixed(2)}</div>
          <div className="text-sm text-gray-400">Total Portfolio Value</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
          <div className="text-blue-300 font-medium mb-2">CORE Balance</div>
          <div className="text-2xl font-bold text-white">{totals.coreBalance.toFixed(4)}</div>
          <div className="text-sm text-blue-300">Core Tokens</div>
        </div>

        <div className="bg-orange-500/10 p-4 rounded-xl border border-orange-500/20">
          <div className="text-orange-300 font-medium mb-2">stCORE Balance</div>
          <div className="text-2xl font-bold text-white">{totals.stCoreBalance.toFixed(4)}</div>
          <div className="text-sm text-orange-300">Liquid Staked</div>
        </div>

        <div className="bg-purple-500/10 p-4 rounded-xl border border-purple-500/20">
          <div className="text-purple-300 font-medium mb-2">Total Staked</div>
          <div className="text-2xl font-bold text-white">{totals.stakedAmount.toFixed(4)}</div>
          <div className="text-sm text-purple-300">Staking Position</div>
        </div>

        <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/20">
          <div className="text-green-300 font-medium mb-2">Portfolio APY</div>
          <div className="text-2xl font-bold text-white">{totals.totalAPY}%</div>
          <div className="text-sm text-green-300">Annual Yield</div>
        </div>
      </div>

      {/* Additional Portfolio Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/20">
          <div className="text-yellow-300 font-medium mb-2">Risk Score</div>
          <div className="text-2xl font-bold text-white">{totals.totalRisk}/10</div>
          <div className="text-sm text-yellow-300">Portfolio Risk</div>
        </div>

        <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20">
          <div className="text-indigo-300 font-medium mb-2">Active Strategies</div>
          <div className="text-2xl font-bold text-white">{totals.strategyCount}</div>
          <div className="text-sm text-indigo-300">Yield Strategies</div>
        </div>

        <div className="bg-pink-500/10 p-4 rounded-xl border border-pink-500/20">
          <div className="text-pink-300 font-medium mb-2">Bridge Requests</div>
          <div className="text-2xl font-bold text-white">{totals.bridgeRequestCount}</div>
          <div className="text-sm text-pink-300">Cross-chain</div>
        </div>
      </div>

      {totals.totalRewards > 0 && (
        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-green-300 font-medium">Total Staking Rewards</div>
              <div className="text-sm text-green-200">Accumulated from staking</div>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {totals.totalRewards.toFixed(6)} stCORE
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
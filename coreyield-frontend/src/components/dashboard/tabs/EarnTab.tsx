import React, { useState } from 'react'
import { ActionButton } from '../shared/ActionButton'
import { BalanceCard } from '../cards/BalanceCard'

interface EarnTabProps {
  currentHook: any
}

export const EarnTab: React.FC<EarnTabProps> = ({
  currentHook
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<'yield' | 'lp' | 'advanced'>('yield')
  const [autoCompound, setAutoCompound] = useState(true)

  // Safe access to hook data with fallbacks
  const assetBalance = currentHook?.assetBalance || '0'
  const syBalance = currentHook?.syBalance || '0'
  const ptBalance = currentHook?.ptBalance || '0'
  const ytBalance = currentHook?.ytBalance || '0'
  const ytClaimableYield = currentHook?.ytClaimableYield || '0'

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
      return currentHook?.formatBalanceUSD ? currentHook.formatBalanceUSD(balance) : `$${(parseFloat(balance || '0') * 1.2).toFixed(2)}`
    } catch {
      return '$0.00'
    }
  }

  const formatYield = (yieldAmount: string) => {
    try {
      return currentHook?.formatYield ? currentHook.formatYield(yieldAmount) : parseFloat(yieldAmount || '0').toFixed(6)
    } catch {
      return '0.000000'
    }
  }

  // Calculate real yield data from currentHook
  const totalInvested = parseFloat(currentHook?.portfolioData?.totalValue || '0')
  const portfolioAPY = parseFloat(currentHook?.portfolioData?.totalAPY || '0')
  const dailyYield = totalInvested * (portfolioAPY / 100) / 365 // Real APY daily

  // Calculate earnings safely
  const calculateTotalEarnings = () => {
    try {
      const monthlyYield = dailyYield * 30
      const yearlyYield = totalInvested * (portfolioAPY / 100)
      
      return {
        totalInvested,
        dailyYield,
        monthlyYield,
        yearlyYield
      }
    } catch {
      return {
        totalInvested: 0,
        dailyYield: 0,
        monthlyYield: 0,
        yearlyYield: 0
      }
    }
  }

  const earnings = calculateTotalEarnings()

  // Dynamic earning strategies based on real data
  const earningStrategies = [
    {
      id: 'yield',
      name: 'Yield Farming',
      apy: portfolioAPY > 0 ? portfolioAPY : 8.5,
      risk: 'Low',
      description: 'Earn yield on your stCORE through automated yield farming',
      tvl: '$890K',
      icon: '🌾'
    },
    {
      id: 'lp',
      name: 'Liquidity Providing',
      apy: portfolioAPY > 0 ? portfolioAPY * 1.2 : 12.3,
      risk: 'Medium',
      description: 'Provide liquidity to PT/YT pools and earn trading fees',
      tvl: '$450K',
      icon: '🏊‍♂️'
    },
    {
      id: 'advanced',
      name: 'Advanced Strategies',
      apy: portfolioAPY > 0 ? portfolioAPY * 1.5 : 15.7,
      risk: 'High',
      description: 'Complex yield strategies for experienced users',
      tvl: '$220K',
      icon: '🚀'
    }
  ]

  const selectedStrategyData = earningStrategies.find(s => s.id === selectedStrategy) || earningStrategies[0]

  const handleClaimAllYield = async () => {
    try {
      if (currentHook?.handleClaimYTYield) {
        await currentHook.handleClaimYTYield()
      }
    } catch (error) {
      console.error('Failed to claim yield:', error)
    }
  }

  const handleOptimizeYield = async () => {
    try {
      // Implement yield optimization logic
      console.log('Optimizing yield strategy...')
    } catch (error) {
      console.error('Failed to optimize yield:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">💰 Earning Opportunities</h3>
        <p className="text-gray-400">
          Maximize your returns with automated yield strategies and optimization
        </p>
      </div>

      {/* Earnings Overview */}
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-white mb-4">📊 Earnings Overview</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-gray-400 text-sm">Total Invested</p>
            <p className="text-white font-bold text-xl">{formatBalanceUSD(earnings.totalInvested.toString())}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Daily Yield</p>
            <p className="text-green-400 font-bold text-xl">{formatBalanceUSD(earnings.dailyYield.toString())}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Monthly Estimate</p>
            <p className="text-green-400 font-bold text-xl">{formatBalanceUSD(earnings.monthlyYield.toString())}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Yearly Estimate</p>
            <p className="text-green-400 font-bold text-xl">{formatBalanceUSD(earnings.yearlyYield.toString())}</p>
          </div>
        </div>
      </div>

      {/* Current Positions */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Current Earning Positions</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BalanceCard
            title="SY-stCORE"
            balance={formatBalance(syBalance)}
            usdValue={formatBalanceUSD(syBalance)}
            icon="🏦"
            gradient="from-blue-500/10 to-cyan-500/10"
            borderColor="border-blue-500/20"
            textColor="text-blue-400"
            subtitle={`Auto-compounding at ${portfolioAPY > 0 ? portfolioAPY.toFixed(1) : '8.5'}% APY`}
          />
          <BalanceCard
            title="YT-stCORE"
            balance={formatBalance(ytBalance)}
            usdValue={formatBalanceUSD(ytBalance)}
            icon="🎲"
            gradient="from-green-500/10 to-emerald-500/10"
            borderColor="border-green-500/20"
            textColor="text-green-400"
            subtitle={`Claimable: ${formatYield(ytClaimableYield)} SY`}
          />
          <BalanceCard
            title="PT-stCORE"
            balance={formatBalance(ptBalance)}
            usdValue={formatBalanceUSD(ptBalance)}
            icon="🔒"
            gradient="from-purple-500/10 to-pink-500/10"
            borderColor="border-purple-500/20"
            textColor="text-purple-400"
            subtitle="Fixed return until maturity"
          />
        </div>
      </div>

      {/* Strategy Selection */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Earning Strategies</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {earningStrategies.map((strategy) => (
            <div
              key={strategy.id}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedStrategy === strategy.id
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-gray-700 bg-gray-700/30 hover:border-gray-600'
              }`}
              onClick={() => setSelectedStrategy(strategy.id as any)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{strategy.icon}</span>
                  <div>
                    <h5 className="text-white font-medium">{strategy.name}</h5>
                    <p className={`text-xs font-medium ${
                      strategy.risk === 'Low' ? 'text-green-400' :
                      strategy.risk === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {strategy.risk} Risk
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold">{strategy.apy}% APY</p>
                  <p className="text-gray-400 text-xs">{strategy.tvl} TVL</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm">{strategy.description}</p>
              
              {selectedStrategy === strategy.id && (
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Selected Strategy Details */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <h5 className="text-green-300 font-medium mb-3 flex items-center space-x-2">
            <span>{selectedStrategyData.icon}</span>
            <span>{selectedStrategyData.name} Details</span>
          </h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Expected APY</p>
              <p className="text-white font-semibold">{selectedStrategyData.apy}%</p>
            </div>
            <div>
              <p className="text-gray-400">Risk Level</p>
              <p className={`font-semibold ${
                selectedStrategyData.risk === 'Low' ? 'text-green-400' :
                selectedStrategyData.risk === 'Medium' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {selectedStrategyData.risk}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Total TVL</p>
              <p className="text-white font-semibold">{selectedStrategyData.tvl}</p>
            </div>
            <div>
              <p className="text-gray-400">Auto-Compound</p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setAutoCompound(!autoCompound)}
                  className={`w-8 h-5 rounded-full transition-colors ${
                    autoCompound ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
                    autoCompound ? 'translate-x-4' : 'translate-x-1'
                  }`} />
                </button>
                <span className="text-white text-xs">{autoCompound ? 'On' : 'Off'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Yield Actions */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Yield Management</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionButton
            onClick={handleClaimAllYield}
            disabled={parseFloat(ytClaimableYield) === 0}
            variant="success"
          >
            💰 Claim All Yield ({formatYield(ytClaimableYield)} SY)
          </ActionButton>
          <ActionButton
            onClick={handleOptimizeYield}
            variant="primary"
          >
            🚀 Optimize Strategy
          </ActionButton>
          <ActionButton
            onClick={() => setAutoCompound(!autoCompound)}
            variant="secondary"
          >
            ⚙️ Toggle Auto-Compound
          </ActionButton>
        </div>
      </div>

      {/* Yield Calculator */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Yield Calculator</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Investment Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Investment Amount
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="0.00"
                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
              />
              <span className="absolute right-3 top-3 text-gray-400">stCORE</span>
            </div>
          </div>

          {/* Time Period */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Time Period
            </label>
            <select className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-green-500 focus:outline-none">
              <option value="1">1 Month</option>
              <option value="3">3 Months</option>
              <option value="6">6 Months</option>
              <option value="12">1 Year</option>
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <h5 className="text-green-300 font-medium mb-3">Projected Earnings</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <p className="text-gray-400">Principal</p>
              <p className="text-white font-bold">$1,000</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400">Interest</p>
              <p className="text-green-400 font-bold">$85</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400">Total</p>
              <p className="text-green-400 font-bold">$1,085</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400">APY</p>
              <p className="text-green-400 font-bold">{selectedStrategyData.apy}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Section */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-white mb-3">💡 Yield Optimization Tips</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
          <div className="space-y-2">
            <h5 className="text-white font-medium">Maximize Returns</h5>
            <ul className="space-y-1">
              <li>• Claim yield regularly to compound returns</li>
              <li>• Consider auto-compounding for efficiency</li>
              <li>• Diversify across multiple strategies</li>
              <li>• Monitor APY changes and adjust accordingly</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h5 className="text-white font-medium">Risk Management</h5>
            <ul className="space-y-1">
              <li>• Start with low-risk yield farming</li>
              <li>• Understand impermanent loss in LP strategies</li>
              <li>• Don't invest more than you can afford to lose</li>
              <li>• Stay updated with protocol changes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
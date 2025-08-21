import React from 'react'
import { ActionButton } from '../shared/ActionButton'
import { useCoreYield } from '../../../hooks/useCoreYield'
import { formatUnits } from 'viem'

interface QuickActionsProps {
  setDashboardTab: (tab: 'stake' | 'invest' | 'portfolio' | 'earn' | 'manage' | 'transactions' | 'education' | 'swap') => void
  currentHook: any
  allHooks: {
    stCOREHook: any
    lstBTCHook: any
    dualCOREHook: any
  }
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  setDashboardTab
}) => {
  const coreYield = useCoreYield()

  // Check if user has any claimable yield
  const hasClaimableYield = parseFloat(coreYield.stakingData.totalRewards || '0') > 0

  // Check if user has any tokens to manage
  const hasTokensToManage = (coreYield.coreBalance && parseFloat(formatUnits(coreYield.coreBalance.value, 18)) > 0) ||
                           (coreYield.stCoreBalance && parseFloat(formatUnits(coreYield.stCoreBalance.value, 18)) > 0)

  // Check if user has any strategies
  const hasStrategies = coreYield.portfolioData.strategyCount > 0

  // Check if user has any bridge requests
  const hasBridgeRequests = coreYield.portfolioData.bridgeRequestCount > 0

  const quickActions = [
    {
      id: 'stake',
      title: 'Stake CORE',
      description: 'Convert CORE to stCORE tokens',
      icon: '🔥',
      color: 'from-orange-500 to-red-500',
      available: hasTokensToManage,
      action: () => setDashboardTab('stake')
    },
    {
      id: 'swap',
      title: 'Swap Tokens',
      description: 'Trade between CORE and stCORE',
      icon: '🔄',
      color: 'from-blue-500 to-cyan-500',
      available: hasTokensToManage,
      action: () => setDashboardTab('swap')
    },
    {
      id: 'strategies',
      title: 'Yield Strategies',
      description: 'Create and manage yield strategies',
      icon: '📈',
      color: 'from-green-500 to-emerald-500',
      available: true,
      action: () => setDashboardTab('earn')
    },
    {
      id: 'bridge',
      title: 'Cross-chain Bridge',
      description: 'Bridge tokens to other chains',
      icon: '🌉',
      color: 'from-purple-500 to-pink-500',
      available: hasTokensToManage,
      action: () => setDashboardTab('manage')
    }
  ]

  return (
    <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
      <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <div
            key={action.id}
            className={`relative p-4 rounded-xl border transition-all duration-300 cursor-pointer hover-lift ${
              action.available 
                ? 'border-gray-600 hover:border-blue-500/50' 
                : 'border-gray-700 opacity-50'
            }`}
            onClick={action.available ? action.action : undefined}
          >
            <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center mb-3 ${
              action.available ? '' : 'grayscale'
            }`}>
              <span className="text-2xl">{action.icon}</span>
            </div>
            
            <div className="mb-2">
              <h4 className="text-white font-semibold">{action.title}</h4>
              <p className="text-gray-400 text-sm">{action.description}</p>
            </div>

            {action.available ? (
              <div className="flex items-center text-blue-400 text-sm">
                <span>Click to start</span>
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">
                {action.id === 'stake' && 'No CORE tokens available'}
                {action.id === 'swap' && 'No tokens to swap'}
                {action.id === 'strategies' && 'Create your first strategy'}
                {action.id === 'bridge' && 'No tokens to bridge'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Portfolio Status */}
      <div className="mt-6 p-4 bg-gray-700/30 rounded-xl border border-gray-600/50">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-white font-medium">Portfolio Status</h4>
            <p className="text-gray-400 text-sm">
              {coreYield.riskData.isAcceptable ? '✅ Portfolio risk is acceptable' : '⚠️ Portfolio risk needs attention'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-white">
              {coreYield.portfolioData.totalValue} CORE
            </div>
            <div className="text-sm text-gray-400">
              APY: {coreYield.portfolioData.totalAPY}%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
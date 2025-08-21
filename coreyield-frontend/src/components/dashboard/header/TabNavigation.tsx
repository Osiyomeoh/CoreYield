import React from 'react'

interface TabNavigationProps {
  dashboardTab: 'markets' | 'yield' | 'trade' | 'portfolio' | 'operations' | 'stake' | 'swap'
  setDashboardTab: (tab: 'markets' | 'yield' | 'trade' | 'portfolio' | 'operations' | 'stake' | 'swap') => void
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  dashboardTab,
  setDashboardTab
}) => {
  const tabs = [
    { id: 'markets', label: 'Markets', icon: '📊', description: 'Browse PT/YT markets and APY' },
    { id: 'yield', label: 'Yield', icon: '💰', description: 'Claim and track yield from YT positions' },
    { id: 'trade', label: 'Trade', icon: '🔄', description: 'Buy/sell PT and YT tokens' },
    { id: 'portfolio', label: 'Portfolio', icon: '📈', description: 'Manage individual positions' },
    { id: 'operations', label: 'Operations', icon: '⚙️', description: 'Wrap, split, merge operations' },
    { id: 'stake', label: 'Stake', icon: '🔥', description: 'Stake CORE for stCORE' },
    { id: 'swap', label: 'Swap', icon: '💱', description: 'Trade between tokens' }
  ] as const

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-2">
      <div className="flex flex-wrap items-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setDashboardTab(tab.id)}
            className={`group relative px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
              dashboardTab === tab.id
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="hidden sm:block">{tab.label}</span>
            
            {/* Tooltip for mobile */}
            <div className="sm:hidden absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
              {tab.label}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </button>
        ))}
      </div>
      
      {/* Tab Description */}
      <div className="mt-3 px-2">
        <p className="text-sm text-gray-400">
          {tabs.find(tab => tab.id === dashboardTab)?.description}
        </p>
      </div>
    </div>
  )
}
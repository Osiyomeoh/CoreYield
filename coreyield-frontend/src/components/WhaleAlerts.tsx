import React, { useState, useEffect } from 'react'

interface WhaleAlertsProps {
  onClose?: () => void
}

interface WhaleTransaction {
  id: string
  type: 'deposit' | 'withdraw' | 'claim' | 'transfer'
  asset: string
  amount: number
  value: number
  from: string
  to: string
  timestamp: Date
  isWhale: boolean
  impact: 'high' | 'medium' | 'low'
  txHash: string
}

interface AlertSettings {
  minAmount: number
  showDeposits: boolean
  showWithdrawals: boolean
  showClaims: boolean
  showTransfers: boolean
  soundEnabled: boolean
  pushEnabled: boolean
}

export const WhaleAlerts: React.FC<WhaleAlertsProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'live' | 'history' | 'settings'>('live')
  const [filter, setFilter] = useState<'all' | 'whale' | 'high-impact'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [settings, setSettings] = useState<AlertSettings>({
    minAmount: 0,
    showDeposits: true,
    showWithdrawals: true,
    showClaims: true,
    showTransfers: true,
    soundEnabled: true,
    pushEnabled: true
  })

  // TODO: Replace with real data from blockchain events
  const [transactions, setTransactions] = useState<WhaleTransaction[]>([])

  // TODO: Replace with real blockchain event listening
  // For now, no fake data generation
  useEffect(() => {
    // Implement real blockchain event listening here
    console.log('Whale alerts initialized - implement real blockchain event listening')
  }, [])

  const filteredTransactions = transactions.filter(tx => {
    // Filter by type
    if (!settings[`show${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}s` as keyof AlertSettings]) {
      return false
    }

    // Filter by amount
    if (tx.value < settings.minAmount) {
      return false
    }

    // Filter by whale/impact
    if (filter === 'whale' && !tx.isWhale) return false
    if (filter === 'high-impact' && tx.impact !== 'high') return false

    // Filter by search
    if (searchQuery && !tx.asset.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !tx.from.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !tx.to.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    return true
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit': return '📥'
      case 'withdraw': return '📤'
      case 'claim': return '💰'
      case 'transfer': return '🔄'
      default: return '📊'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-400'
      case 'medium': return 'text-yellow-400'
      case 'low': return 'text-green-400'
      default: return 'text-gray-400'
    }
  }

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const formatAddress = (address: string) => {
    if (address.length > 10) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`
    }
    return address
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">🐋</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Whale Alerts</h2>
              <p className="text-gray-400 text-sm">Monitor large transactions and whale movements</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {[
            { id: 'live', label: 'Live Feed', icon: '📡' },
            { id: 'history', label: 'History', icon: '📊' },
            { id: 'settings', label: 'Settings', icon: '⚙️' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-orange-400 border-b-2 border-orange-400 bg-orange-400/10'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'live' && (
            <div className="p-6">
              {/* Filters and Search */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex items-center space-x-2">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                  >
                    <option value="all">All Transactions</option>
                    <option value="whale">Whale Only</option>
                    <option value="high-impact">High Impact</option>
                  </select>
                </div>
                
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search by asset, address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Live Feed */}
              <div className="space-y-4">
                {filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className={`p-4 rounded-xl border transition-all duration-200 ${
                      tx.isWhale 
                        ? 'bg-orange-500/10 border-orange-500/30' 
                        : 'bg-gray-800 border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getTypeIcon(tx.type)}</span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-medium capitalize">{tx.type}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-blue-400 font-medium">{tx.asset}</span>
                            {tx.isWhale && (
                              <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full font-medium">
                                WHALE
                              </span>
                            )}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {getTimeAgo(tx.timestamp)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-white font-bold text-lg">
                          ${tx.value.toLocaleString()}
                        </div>
                        <div className={`text-sm font-medium ${getImpactColor(tx.impact)}`}>
                          {tx.impact.toUpperCase()} Impact
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">From:</span>
                        <span className="text-white ml-2 font-mono">{formatAddress(tx.from)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">To:</span>
                        <span className="text-white ml-2 font-mono">{formatAddress(tx.to)}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-gray-400 text-sm">
                        Amount: {tx.amount.toLocaleString()} {tx.asset}
                      </div>
                      <a
                        href={`https://scan.test2.btcs.network/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors"
                      >
                        View Transaction →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Transaction History</h3>
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-700">
                        <th className="text-left py-2">Type</th>
                        <th className="text-left py-2">Asset</th>
                        <th className="text-right py-2">Amount</th>
                        <th className="text-right py-2">Value</th>
                        <th className="text-left py-2">From</th>
                        <th className="text-left py-2">To</th>
                        <th className="text-left py-2">Time</th>
                        <th className="text-center py-2">Impact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.slice(0, 20).map((tx) => (
                        <tr key={tx.id} className="border-b border-gray-700">
                          <td className="py-2">
                            <div className="flex items-center space-x-2">
                              <span>{getTypeIcon(tx.type)}</span>
                              <span className="text-white capitalize">{tx.type}</span>
                            </div>
                          </td>
                          <td className="py-2 text-blue-400">{tx.asset}</td>
                          <td className="py-2 text-right text-white">{tx.amount.toLocaleString()}</td>
                          <td className="py-2 text-right text-white">${tx.value.toLocaleString()}</td>
                          <td className="py-2 text-gray-300 font-mono">{formatAddress(tx.from)}</td>
                          <td className="py-2 text-gray-300 font-mono">{formatAddress(tx.to)}</td>
                          <td className="py-2 text-gray-400">{getTimeAgo(tx.timestamp)}</td>
                          <td className="py-2 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(tx.impact)}`}>
                              {tx.impact}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Alert Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-white font-medium">Transaction Types</h4>
                  <div className="space-y-3">
                    {[
                      { key: 'showDeposits', label: 'Deposits', icon: '📥' },
                      { key: 'showWithdrawals', label: 'Withdrawals', icon: '📤' },
                      { key: 'showClaims', label: 'Claims', icon: '💰' },
                      { key: 'showTransfers', label: 'Transfers', icon: '🔄' }
                    ].map((setting) => (
                      <label key={setting.key} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings[setting.key as keyof AlertSettings] as boolean}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            [setting.key]: e.target.checked
                          }))}
                          className="w-4 h-4 text-orange-500 bg-gray-800 border-gray-600 rounded focus:ring-orange-500"
                        />
                        <span className="text-lg">{setting.icon}</span>
                        <span className="text-white">{setting.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-white font-medium">Alert Thresholds</h4>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Minimum Transaction Value ($)
                    </label>
                    <input
                      type="number"
                      value={settings.minAmount}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        minAmount: parseInt(e.target.value) || 0
                      }))}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-white font-medium">Notifications</h4>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.soundEnabled}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          soundEnabled: e.target.checked
                        }))}
                        className="w-4 h-4 text-orange-500 bg-gray-800 border-gray-600 rounded focus:ring-orange-500"
                      />
                      <span className="text-white">Sound Alerts</span>
                    </label>
                    
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.pushEnabled}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          pushEnabled: e.target.checked
                        }))}
                        className="w-4 h-4 text-orange-500 bg-gray-800 border-gray-600 rounded focus:ring-orange-500"
                      />
                      <span className="text-white">Push Notifications</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
import React, { useState, useEffect } from 'react'
import { useCoreYield } from '../../../hooks/useCoreYield'
import { CONTRACTS } from '@contracts/addresses'

const BridgeTab: React.FC = () => {
  const { 
    bridgeAssets,
    bridgeRequests,
    isLoading 
  } = useCoreYield()

  const [bridgeForm, setBridgeForm] = useState({
    sourceChain: 1114, // Core Testnet
    targetChain: 1, // Ethereum Mainnet
    asset: 'CORE',
    amount: '',
    recipient: ''
  })

  const [bridgeHistory, setBridgeHistory] = useState<any[]>([])
  const [selectedBridge, setSelectedBridge] = useState<any>(null)

  // Update bridge history when bridgeRequests changes
  useEffect(() => {
    if (bridgeRequests) {
      setBridgeHistory(bridgeRequests as any[] || [])
    }
  }, [bridgeRequests])

  // Handle bridge assets
  const handleBridgeAssets = async () => {
    if (!bridgeForm.amount || !bridgeForm.recipient) {
      alert('Please fill in all fields')
      return
    }

    try {
      await bridgeAssets(
        bridgeForm.sourceChain,
        bridgeForm.targetChain,
        bridgeForm.asset,
        bridgeForm.amount,
        bridgeForm.recipient
      )
      
      // Reset form
      setBridgeForm({
        sourceChain: 1114,
        targetChain: 1,
        asset: 'CORE',
        amount: '',
        recipient: ''
      })
    } catch (error) {
      console.error('Bridge failed:', error)
    }
  }

  // Get chain name by ID
  const getChainName = (chainId: number) => {
    switch (chainId) {
      case 1: return 'Ethereum Mainnet'
      case 1114: return 'Core Testnet'
      case 137: return 'Polygon'
      case 56: return 'BSC'
      case 42161: return 'Arbitrum'
      case 10: return 'Optimism'
      default: return `Chain ${chainId}`
    }
  }

  // Get chain icon
  const getChainIcon = (chainId: number) => {
    switch (chainId) {
      case 1: return '🔷'
      case 1114: return '🔥'
      case 137: return '💜'
      case 56: return '🟡'
      case 42161: return '🔵'
      case 10: return '🔴'
      default: return '⛓️'
    }
  }

  // Get asset icon
  const getAssetIcon = (asset: string) => {
    switch (asset) {
      case 'CORE': return '🔥'
      case 'stCORE': return '🔒'
      case 'USDC': return '💵'
      case 'ETH': return '💎'
      case 'BTC': return '₿'
      default: return '🪙'
    }
  }

  // Get bridge status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400'
      case 'pending': return 'text-yellow-400'
      case 'failed': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  // Get bridge status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅'
      case 'pending': return '⏳'
      case 'failed': return '❌'
      default: return '❓'
    }
  }

  return (
    <div className="space-y-6">
      {/* Bridge Header - Pendle Style */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Cross-Chain Bridge</h1>
        <p className="text-gray-400 text-base max-w-2xl mx-auto">
          Bridge your assets across different blockchain networks seamlessly. 
          Transfer CORE, stCORE, and other tokens between chains.
        </p>
      </div>

      {/* Bridge Overview */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🌉 Cross-Chain Bridge</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-sm text-gray-400">Total Bridges</div>
            <div className="text-2xl font-bold text-white">
              {bridgeHistory.length}
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-sm text-gray-400">Pending</div>
            <div className="text-2xl font-bold text-yellow-400">
              {bridgeHistory.filter(b => b.status === 'pending').length}
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-sm text-gray-400">Completed</div>
            <div className="text-2xl font-bold text-green-400">
              {bridgeHistory.filter(b => b.status === 'completed').length}
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-sm text-gray-400">Failed</div>
            <div className="text-2xl font-bold text-red-400">
              {bridgeHistory.filter(b => b.status === 'failed').length}
            </div>
          </div>
        </div>
      </div>

      {/* Bridge Form */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🚀 Bridge Assets</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Source Chain</label>
              <select 
                value={bridgeForm.sourceChain}
                onChange={(e) => setBridgeForm(prev => ({ ...prev, sourceChain: parseInt(e.target.value) }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value={1114}>Core Testnet</option>
                <option value={1}>Ethereum Mainnet</option>
                <option value={137}>Polygon</option>
                <option value={56}>BSC</option>
                <option value={42161}>Arbitrum</option>
                <option value={10}>Optimism</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Target Chain</label>
              <select 
                value={bridgeForm.targetChain}
                onChange={(e) => setBridgeForm(prev => ({ ...prev, targetChain: parseInt(e.target.value) }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value={1}>Ethereum Mainnet</option>
                <option value={1114}>Core Testnet</option>
                <option value={137}>Polygon</option>
                <option value={56}>BSC</option>
                <option value={42161}>Arbitrum</option>
                <option value={10}>Optimism</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Asset</label>
              <select 
                value={bridgeForm.asset}
                onChange={(e) => setBridgeForm(prev => ({ ...prev, asset: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="CORE">CORE</option>
                <option value="stCORE">stCORE</option>
                <option value="USDC">USDC</option>
                <option value="ETH">ETH</option>
                <option value="BTC">BTC</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Amount</label>
              <input 
                type="number"
                value={bridgeForm.amount}
                onChange={(e) => setBridgeForm(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                placeholder="0.0"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Recipient Address</label>
              <input 
                type="text"
                value={bridgeForm.recipient}
                onChange={(e) => setBridgeForm(prev => ({ ...prev, recipient: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                placeholder="0x..."
              />
            </div>

            <button 
              onClick={handleBridgeAssets}
              disabled={isLoading || !bridgeForm.amount || !bridgeForm.recipient}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {isLoading ? 'Bridging...' : '🌉 Bridge Assets'}
            </button>
          </div>
        </div>

        {/* Bridge Preview */}
        {bridgeForm.amount && bridgeForm.recipient && (
          <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h4 className="text-blue-300 font-medium mb-3">Bridge Preview</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">From:</span>
                <span className="ml-2 text-white">
                  {getChainIcon(bridgeForm.sourceChain)} {getChainName(bridgeForm.sourceChain)}
                </span>
              </div>
              <div>
                <span className="text-gray-400">To:</span>
                <span className="ml-2 text-white">
                  {getChainIcon(bridgeForm.targetChain)} {getChainName(bridgeForm.targetChain)}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Asset:</span>
                <span className="ml-2 text-white">
                  {getAssetIcon(bridgeForm.asset)} {bridgeForm.amount} {bridgeForm.asset}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bridge History */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">📜 Bridge History</h3>
        
        {bridgeHistory.length > 0 ? (
          <div className="space-y-4">
            {bridgeHistory.map((bridge: any, index: number) => (
              <div key={index} className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex items-center space-x-2">
                        <span>{getChainIcon(bridge.sourceChain)}</span>
                        <span className="text-gray-400">→</span>
                        <span>{getChainIcon(bridge.targetChain)}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(bridge.status)}`}>
                        {getStatusIcon(bridge.status)} {bridge.status}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-400 mb-1">
                      {getAssetIcon(bridge.asset)} {bridge.amount} {bridge.asset}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Recipient: {bridge.recipient} • 
                      {new Date(bridge.timestamp * 1000).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Status</div>
                    <div className={`font-medium ${getStatusColor(bridge.status)}`}>
                      {bridge.status}
                    </div>
                  </div>
                </div>
                
                {bridge.status === 'pending' && (
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <div className="flex items-center justify-center space-x-2 text-sm text-yellow-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                      <span>Processing bridge transaction...</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400">No bridge transactions</div>
            <div className="text-sm text-gray-500 mt-2">
              Bridge your first asset to another chain
            </div>
          </div>
        )}
      </div>

      {/* Supported Chains */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">⛓️ Supported Chains</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { id: 1, name: 'Ethereum', icon: '🔷', status: 'Active' },
            { id: 1114, name: 'Core Testnet', icon: '🔥', status: 'Active' },
            { id: 137, name: 'Polygon', icon: '💜', status: 'Active' },
            { id: 56, name: 'BSC', icon: '🟡', status: 'Active' },
            { id: 42161, name: 'Arbitrum', icon: '🔵', status: 'Coming Soon' },
            { id: 10, name: 'Optimism', icon: '🔴', status: 'Coming Soon' }
          ].map((chain) => (
            <div key={chain.id} className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">{chain.icon}</div>
              <div className="font-medium text-white text-sm">{chain.name}</div>
              <div className={`text-xs ${
                chain.status === 'Active' ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {chain.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bridge Fees */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">💰 Bridge Fees</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-medium text-gray-300 mb-3">Fee Structure</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Base Bridge Fee:</span>
                <span className="text-white">0.1%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Gas Fee:</span>
                <span className="text-white">Network dependent</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Processing Time:</span>
                <span className="text-white">5-30 minutes</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-md font-medium text-gray-300 mb-3">Security Features</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✅</span>
                <span className="text-gray-400">Multi-sig validation</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✅</span>
                <span className="text-gray-400">24h timelock</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✅</span>
                <span className="text-gray-400">Emergency pause</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BridgeTab

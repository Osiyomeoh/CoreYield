import React, { useState, useEffect } from 'react'
import { useCoreYield } from '../../../hooks/useCoreYield'
import { CONTRACTS } from '@contracts/addresses'

const GovernanceTab: React.FC = () => {
  const { 
    getRiskAssessment,
    bridgeAssets,
    isLoading 
  } = useCoreYield()

  const [riskProfile, setRiskProfile] = useState<any>(null)
  const [governanceProposals, setGovernanceProposals] = useState<any[]>([])
  const [userVotes, setUserVotes] = useState<any[]>([])
  const [bridgeForm, setBridgeForm] = useState({
    sourceChain: 1114, // Core Testnet
    targetChain: 1, // Ethereum Mainnet
    asset: 'CORE',
    amount: '',
    recipient: ''
  })

  // Fetch risk assessment
  const fetchRiskAssessment = async () => {
    try {
      const risk = await getRiskAssessment()
      setRiskProfile(risk)
    } catch (error) {
      console.error('Failed to fetch risk assessment:', error)
    }
  }

  useEffect(() => {
    fetchRiskAssessment()
  }, [])

  // Mock governance proposals (replace with real contract calls)
  useEffect(() => {
    setGovernanceProposals([
      {
        id: 1,
        title: 'Increase Protocol Fee to 0.5%',
        description: 'Proposal to increase the protocol fee from 0.3% to 0.5% to improve sustainability',
        proposer: '0x1234...5678',
        forVotes: 1500000,
        againstVotes: 500000,
        status: 'active',
        endTime: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
        category: 'fee'
      },
      {
        id: 2,
        title: 'Add New Asset: USDC',
        description: 'Proposal to add USDC as a supported asset for yield tokenization',
        proposer: '0x8765...4321',
        forVotes: 2000000,
        againstVotes: 300000,
        status: 'active',
        endTime: Date.now() + 5 * 24 * 60 * 60 * 1000, // 5 days from now
        category: 'asset'
      },
      {
        id: 3,
        title: 'Emergency Pause Protocol',
        description: 'Emergency proposal to pause all protocol operations due to security concerns',
        proposer: '0x9999...8888',
        forVotes: 500000,
        againstVotes: 2500000,
        status: 'active',
        endTime: Date.now() + 1 * 24 * 60 * 60 * 1000, // 1 day from now
        category: 'emergency'
      }
    ])
  }, [])

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

  // Calculate proposal progress
  const calculateProposalProgress = (proposal: any) => {
    const totalVotes = proposal.forVotes + proposal.againstVotes
    if (totalVotes === 0) return 0
    return (proposal.forVotes / totalVotes) * 100
  }

  // Get time remaining
  const getTimeRemaining = (endTime: number) => {
    const now = Date.now()
    const remaining = endTime - now
    
    if (remaining <= 0) return 'Ended'
    
    const days = Math.floor(remaining / (24 * 60 * 60 * 1000))
    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    
    if (days > 0) return `${days}d ${hours}h remaining`
    return `${hours}h remaining`
  }

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'fee': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'asset': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'emergency': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <div className="space-y-6">
      {/* Governance Overview */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🏛️ Governance Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-sm text-gray-400">Active Proposals</div>
            <div className="text-2xl font-bold text-white">
              {governanceProposals.filter(p => p.status === 'active').length}
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-sm text-gray-400">Total Votes Cast</div>
            <div className="text-2xl font-bold text-blue-400">
              {governanceProposals.reduce((sum, p) => sum + p.forVotes + p.againstVotes, 0).toLocaleString()}
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-sm text-gray-400">Your Voting Power</div>
            <div className="text-2xl font-bold text-green-400">
              0 CORE
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-sm text-gray-400">Participation Rate</div>
            <div className="text-2xl font-bold text-purple-400">
              0%
            </div>
          </div>
        </div>
      </div>

      {/* Active Proposals */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🗳️ Active Proposals</h3>
        
        <div className="space-y-4">
          {governanceProposals.filter(p => p.status === 'active').map((proposal) => (
            <div key={proposal.id} className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-white">{proposal.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs border ${getCategoryColor(proposal.category)}`}>
                      {proposal.category}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">{proposal.description}</p>
                  <div className="text-xs text-gray-500">
                    Proposed by {proposal.proposer} • {getTimeRemaining(proposal.endTime)}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-400">Progress</div>
                  <div className="text-lg font-bold text-white">
                    {calculateProposalProgress(proposal).toFixed(1)}%
                  </div>
                </div>
              </div>
              
              {/* Voting Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>For: {proposal.forVotes.toLocaleString()}</span>
                  <span>Against: {proposal.againstVotes.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${calculateProposalProgress(proposal)}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Voting Buttons */}
              <div className="flex space-x-3">
                <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                  ✅ Vote For
                </button>
                <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                  ❌ Vote Against
                </button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                  📊 View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Management Panel */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">⚠️ Risk Management</h3>
        
        {riskProfile ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400">Portfolio Risk</div>
                <div className="text-xl font-bold text-white">
                  {riskProfile.riskScore || '0'}/10
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400">Volatility</div>
                <div className="text-xl font-bold text-orange-400">
                  {riskProfile.volatility || '0'}%
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400">Max Drawdown</div>
                <div className="text-xl font-bold text-red-400">
                  {riskProfile.maxDrawdown || '0'}%
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                🚨 Emergency Exit
              </button>
              <button className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                📊 Risk Report
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                ⚙️ Adjust Strategy
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400">Risk assessment data not available</div>
          </div>
        )}
      </div>

      {/* Cross-Chain Bridge */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🌉 Cross-Chain Bridge</h3>
        
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
      </div>

      {/* Governance History */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">📜 Governance History</h3>
        
        <div className="space-y-4">
          {governanceProposals.filter(p => p.status !== 'active').map((proposal) => (
            <div key={proposal.id} className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">{proposal.title}</h4>
                  <div className="text-sm text-gray-400">
                    {proposal.status === 'passed' ? '✅ Passed' : '❌ Failed'} • 
                    Ended {new Date(proposal.endTime).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Final Result</div>
                  <div className={`font-medium ${proposal.status === 'passed' ? 'text-green-400' : 'text-red-400'}`}>
                    {calculateProposalProgress(proposal).toFixed(1)}% For
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default GovernanceTab
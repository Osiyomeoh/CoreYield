import React, { useState, useEffect } from 'react'
import { useCoreYield } from '../../../hooks/useCoreYield'
import { CONTRACTS } from '@contracts/addresses'
import { useAccount, useReadContract, useWriteContract } from 'wagmi'
import { parseEther, formatUnits } from 'viem'
import toast from 'react-hot-toast'

// CoreGovernance ABI (actual deployed contract functions)
const CoreGovernanceABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "user", "type": "address"}
    ],
    "name": "userVotingPower",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "title", "type": "string"},
      {"internalType": "string", "name": "description", "type": "string"},
      {"internalType": "uint256", "name": "duration", "type": "uint256"}
    ],
    "name": "createProposal",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "proposalId", "type": "uint256"},
      {"internalType": "bool", "name": "support", "type": "bool"},
      {"internalType": "string", "name": "reason", "type": "string"}
    ],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "proposalId", "type": "uint256"}],
    "name": "executeProposal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "proposalId", "type": "uint256"}],
    "name": "cancelProposal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "proposalId", "type": "uint256"}],
    "name": "getProposalInfo",
    "outputs": [
      {"internalType": "address", "name": "proposer", "type": "address"},
      {"internalType": "string", "name": "title", "type": "string"},
      {"internalType": "string", "name": "description", "type": "string"},
      {"internalType": "uint256", "name": "forVotes", "type": "uint256"},
      {"internalType": "uint256", "name": "againstVotes", "type": "uint256"},
      {"internalType": "uint256", "name": "startTime", "type": "uint256"},
      {"internalType": "uint256", "name": "endTime", "type": "uint256"},
      {"internalType": "bool", "name": "executed", "type": "bool"},
      {"internalType": "bool", "name": "canceled", "type": "bool"},
      {"internalType": "uint256", "name": "quorum", "type": "uint256"},
      {"internalType": "uint256", "name": "minVotingPower", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "proposalId", "type": "uint256"}],
    "name": "getProposalStatus",
    "outputs": [
      {"internalType": "bool", "name": "isActive", "type": "bool"},
      {"internalType": "bool", "name": "isPassed", "type": "bool"},
      {"internalType": "bool", "name": "isExecuted", "type": "bool"},
      {"internalType": "bool", "name": "isCanceled", "type": "bool"},
      {"internalType": "uint256", "name": "timeRemaining", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getActiveProposals",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "proposalId", "type": "uint256"},
      {"internalType": "address", "name": "user", "type": "address"}
    ],
    "name": "getUserVote",
    "outputs": [
      {"internalType": "bool", "name": "support", "type": "bool"},
      {"internalType": "uint256", "name": "votingPower", "type": "uint256"},
      {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"internalType": "string", "name": "reason", "type": "string"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const

interface Proposal {
  id: number
  proposer: string
  title: string
  description: string
  forVotes: bigint
  againstVotes: bigint
  startTime: bigint
  endTime: bigint
  executed: boolean
  canceled: boolean
  quorum: bigint
  minVotingPower: bigint
  status?: string
  timeRemaining?: string
  userVote?: boolean | null
}

const GovernanceTab: React.FC = () => {
  const { address, isConnected } = useAccount()
  
  // Governance state
  const [proposalTitle, setProposalTitle] = useState('')
  const [proposalDescription, setProposalDescription] = useState('')
  const [proposalDuration, setProposalDuration] = useState('7') // days
  const [isCreatingProposal, setIsCreatingProposal] = useState(false)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [isLoadingProposals, setIsLoadingProposals] = useState(false)
  const [votingProposal, setVotingProposal] = useState<number | null>(null)

  // Get user's voting power from governance contract
  const { data: userVotingPower } = useReadContract({
    address: CONTRACTS.CORE_GOVERNANCE as `0x${string}`,
    abi: CoreGovernanceABI,
    functionName: 'userVotingPower',
    args: [address as `0x${string}`],
    query: { enabled: !!address }
  })

  // Get active proposals
  const { data: activeProposals, refetch: refetchActiveProposals } = useReadContract({
    address: CONTRACTS.CORE_GOVERNANCE as `0x${string}`,
    abi: CoreGovernanceABI,
    functionName: 'getActiveProposals',
    query: { enabled: !!address }
  })

  // Contract write functions
  const { writeContract: writeGovernance } = useWriteContract()

  // Fetch proposal details when activeProposals changes
  useEffect(() => {
    if (activeProposals && Array.isArray(activeProposals) && activeProposals.length > 0) {
      fetchProposalDetails(activeProposals)
    } else {
      setProposals([])
    }
  }, [activeProposals])

  const fetchProposalDetails = async (proposalIds: bigint[]) => {
    setIsLoadingProposals(true)
    try {
      const proposalDetails: Proposal[] = []
      
      for (const proposalId of proposalIds) {
        try {
          const proposalInfo = await fetchProposalInfo(Number(proposalId))
          const proposalStatus = await fetchProposalStatus(Number(proposalId))
          const userVote = await fetchUserVote(Number(proposalId))
          
          proposalDetails.push({
            ...proposalInfo,
            status: proposalStatus.isActive ? 'Active' : proposalStatus.isPassed ? 'Passed' : 'Failed',
            timeRemaining: formatTimeRemaining(proposalStatus.timeRemaining),
            userVote: userVote.support
          })
        } catch (error) {
          console.error(`Failed to fetch proposal ${proposalId}:`, error)
        }
      }
      
      setProposals(proposalDetails)
    } catch (error) {
      console.error('Failed to fetch proposal details:', error)
    } finally {
      setIsLoadingProposals(false)
    }
  }

  const fetchProposalInfo = async (proposalId: number): Promise<Proposal> => {
    // For now, return mock data since we need to implement proper contract calls
    // TODO: Replace with actual contract calls to getProposalInfo
    return {
      id: proposalId,
      proposer: '0x0000000000000000000000000000000000000000',
      title: `Proposal #${proposalId}`,
      description: 'Proposal description will be fetched from contract',
      forVotes: 0n,
      againstVotes: 0n,
      startTime: 0n,
      endTime: 0n,
      executed: false,
      canceled: false,
      quorum: 0n,
      minVotingPower: 0n
    }
  }

  const fetchProposalStatus = async (proposalId: number) => {
    // For now, return mock data since we need to implement proper contract calls
    // TODO: Replace with actual contract calls to getProposalStatus
    return {
      isActive: true,
      isPassed: false,
      isExecuted: false,
      isCanceled: false,
      timeRemaining: BigInt(7 * 24 * 60 * 60) // 7 days in seconds
    }
  }

  const fetchUserVote = async (proposalId: number) => {
    if (!address) return { support: false, votingPower: 0n, timestamp: 0n, reason: '' }
    // For now, return mock data since we need to implement proper contract calls
    // TODO: Replace with actual contract calls to getUserVote
    return { support: false, votingPower: 0n, timestamp: 0n, reason: '' }
  }

  const formatTimeRemaining = (seconds: bigint): string => {
    const totalSeconds = Number(seconds)
    if (totalSeconds <= 0) return 'Ended'
    
    const days = Math.floor(totalSeconds / (24 * 60 * 60))
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60))
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60)
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const proposalDurations = [
    { value: '1', label: '1 Day' },
    { value: '3', label: '3 Days' },
    { value: '7', label: '1 Week' },
    { value: '14', label: '2 Weeks' },
    { value: '30', label: '1 Month' }
  ]

  const handleCreateProposal = async () => {
    if (!proposalTitle.trim() || !proposalDescription.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      setIsCreatingProposal(true)
      
      writeGovernance({
        address: CONTRACTS.CORE_GOVERNANCE as `0x${string}`,
        abi: CoreGovernanceABI,
        functionName: 'createProposal',
        args: [
          proposalTitle,
          proposalDescription,
          BigInt(parseInt(proposalDuration) * 24 * 60 * 60) // Convert days to seconds
        ]
      })

      toast.success('Proposal creation transaction submitted!')
      setProposalTitle('')
      setProposalDescription('')
      setProposalDuration('7')
      setIsCreatingProposal(false)
      
      // Refresh proposals after creation
      setTimeout(() => refetchActiveProposals(), 3000)
      
    } catch (error) {
      console.error('Proposal creation failed:', error)
      toast.error('Failed to create proposal. Please try again.')
      setIsCreatingProposal(false)
    }
  }

  const handleVote = async (proposalId: number, support: boolean) => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      setVotingProposal(proposalId)
      
      writeGovernance({
        address: CONTRACTS.CORE_GOVERNANCE as `0x${string}`,
        abi: CoreGovernanceABI,
        functionName: 'vote',
        args: [BigInt(proposalId), support, 'Voted via CoreYield UI']
      })

      toast.success(`Vote ${support ? 'for' : 'against'} submitted!`)
      
      // Refresh proposals after voting
      setTimeout(() => refetchActiveProposals(), 3000)
      
    } catch (error) {
      console.error('Vote failed:', error)
      toast.error('Failed to submit vote. Please try again.')
    } finally {
      setVotingProposal(null)
    }
  }

  const formatVotingPower = (power: bigint | undefined) => {
    if (!power) return '0'
    return formatUnits(power, 18)
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <button className="text-gray-400 hover:text-white mb-4 flex items-center transition-colors">
        <span>←</span>
        <span className="ml-2">Back</span>
      </button>

      {/* Governance Overview */}
      <div className="bg-gray-900/50 border border-blue-500/30 rounded-xl p-8 backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">CoreYield Governance</h1>
        
        {/* User Voting Power */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 mb-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-2">Your Voting Power</h2>
            <div className="text-4xl font-bold text-blue-400 mb-2">
              {formatVotingPower(userVotingPower)} veCORE
            </div>
            <p className="text-gray-400 text-sm">
              {parseFloat(formatVotingPower(userVotingPower)) > 0 
                ? 'You can participate in governance decisions'
                : 'Lock CORE tokens to gain voting power (veCORE contract not yet deployed)'}
            </p>
          </div>
        </div>

        {/* Create Proposal Section */}
        <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Create New Proposal</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Proposal Title</label>
              <input
                type="text"
                value={proposalTitle}
                onChange={(e) => setProposalTitle(e.target.value)}
                placeholder="Enter proposal title..."
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                disabled={isCreatingProposal}
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-300 mb-2">Description</label>
              <textarea
                value={proposalDescription}
                onChange={(e) => setProposalDescription(e.target.value)}
                placeholder="Describe your proposal in detail..."
                rows={4}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none"
                disabled={isCreatingProposal}
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-300 mb-2">Duration</label>
              <select
                value={proposalDuration}
                onChange={(e) => setProposalDuration(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                disabled={isCreatingProposal}
              >
                {proposalDurations.map((duration) => (
                  <option key={duration.value} value={duration.value}>
                    {duration.label}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={handleCreateProposal}
              disabled={!proposalTitle.trim() || !proposalDescription.trim() || isCreatingProposal}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isCreatingProposal ? 'Creating Proposal...' : 'Create Proposal'}
            </button>
          </div>
        </div>

        {/* Active Proposals */}
        <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Active Proposals</h3>
            <button
              onClick={() => refetchActiveProposals()}
              disabled={isLoadingProposals}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoadingProposals ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          
          {isLoadingProposals ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-gray-400">Loading proposals...</p>
            </div>
          ) : proposals.length > 0 ? (
            <div className="space-y-4">
              {proposals.map((proposal) => (
                <div key={proposal.id} className="bg-gray-700/50 border border-gray-600/30 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-white">{proposal.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        proposal.status === 'Active' ? 'bg-green-500/20 text-green-400' :
                        proposal.status === 'Passed' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {proposal.status}
                      </span>
                    </div>
                    
                    <p className="text-gray-300 text-sm">{proposal.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Proposer:</span>
                        <p className="text-white font-mono">{formatAddress(proposal.proposer)}</p>
                      </div>
                                               <div>
                           <span className="text-gray-400">For Votes:</span>
                           <p className="text-green-400 font-medium">{formatVotingPower(proposal.forVotes as bigint)}</p>
                         </div>
                         <div>
                           <span className="text-gray-400">Against Votes:</span>
                           <p className="text-red-400 font-medium">{formatVotingPower(proposal.againstVotes as bigint)}</p>
                         </div>
                      <div>
                        <span className="text-gray-400">Time Remaining:</span>
                        <p className="text-white font-medium">{proposal.timeRemaining}</p>
                      </div>
                    </div>
                    
                    {proposal.status === 'Active' && (
                      <div className="flex items-center justify-between pt-3 border-t border-gray-600/30">
                        <div className="text-sm text-gray-400">
                          {proposal.userVote !== null ? (
                            <span className={`${proposal.userVote ? 'text-green-400' : 'text-red-400'}`}>
                              You voted {proposal.userVote ? 'FOR' : 'AGAINST'} this proposal
                            </span>
                          ) : (
                            'You haven\'t voted yet'
                          )}
                        </div>
                        
                        {proposal.userVote === null && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleVote(proposal.id, true)}
                              disabled={votingProposal === proposal.id}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              {votingProposal === proposal.id ? 'Voting...' : 'Vote For'}
                            </button>
                            <button
                              onClick={() => handleVote(proposal.id, false)}
                              disabled={votingProposal === proposal.id}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              {votingProposal === proposal.id ? 'Voting...' : 'Vote Against'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📋</div>
              <h4 className="text-lg font-medium text-white mb-2">No Active Proposals</h4>
              <p className="text-gray-400">Be the first to create a proposal!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GovernanceTab
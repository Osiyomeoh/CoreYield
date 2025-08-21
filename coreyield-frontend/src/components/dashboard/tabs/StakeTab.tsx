import React, { useState, useEffect } from 'react'
import { useCoreYield } from '../../../../src/hooks/useCoreYield'
import { AmountInput } from '../shared/AmountInput'
import { ActionButton } from '../shared/ActionButton'
import { formatUnits } from 'viem'
import { CONTRACTS } from '../../../../contracts/addresses'

interface StakeTabProps {
  selectedAsset: string
  setDashboardTab: (tab: 'markets' | 'yield' | 'trade' | 'portfolio' | 'operations' | 'stake' | 'swap') => void
}

export const StakeTab: React.FC<StakeTabProps> = ({ 
  selectedAsset, 
  setDashboardTab 
}) => {
  const currentHook = useCoreYield()
  const [stakeAmount, setStakeAmount] = useState('')
  const [hasStakedTokens, setHasStakedTokens] = useState(false)
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'approving' | 'staking' | 'success' | 'failed'>('idle')

  // Get balances from the hook
  const coreBalance = currentHook.coreBalance ? formatUnits(currentHook.coreBalance.value, currentHook.coreBalance.decimals) : '0'
  const stCoreBalance = currentHook.stCoreBalance ? formatUnits(currentHook.stCoreBalance.value, currentHook.stCoreBalance?.decimals || 18) : '0'

  // Check if user has staked tokens
  useEffect(() => {
    if (parseFloat(stCoreBalance) > 0) {
      setHasStakedTokens(true)
    }
  }, [stCoreBalance])

  // Reset transaction status when staking completes
  useEffect(() => {
    if (transactionStatus === 'success') {
      setTimeout(() => setTransactionStatus('idle'), 3000)
    }
  }, [transactionStatus])

  // Format balance helper function
  const formatBalance = (balance: string) => {
    const num = parseFloat(balance)
    if (num === 0) return '0'
    if (num < 0.001) return '< 0.001'
    if (num < 1) return num.toFixed(4)
    if (num < 1000) return num.toFixed(2)
    if (num < 1000000) return `${(num / 1000).toFixed(2)}K`
    return `${(num / 1000000).toFixed(2)}M`
  }

  // Format balance in USD helper function
  const formatBalanceUSD = (balance: string) => {
    const num = parseFloat(balance)
    if (num === 0) return '$0'
    // Assuming 1 CORE = $1 for now - in real app this would come from price feed
    const usdValue = num * 1
    if (usdValue < 1) return `$${usdValue.toFixed(4)}`
    if (usdValue < 1000) return `$${usdValue.toFixed(2)}`
    if (usdValue < 1000000) return `$${(usdValue / 1000).toFixed(2)}K`
    return `$${(usdValue / 1000000).toFixed(2)}M`
  }

  const isValidAmount = stakeAmount && parseFloat(stakeAmount) > 0 && parseFloat(stakeAmount) <= parseFloat(coreBalance)

  const handleStake = async () => {
    if (!isValidAmount) return
    
    try {
      setTransactionStatus('approving')
      await currentHook.stake(stakeAmount, CONTRACTS.MOCK_ASSETS.dualCORE as `0x${string}`)
      setTransactionStatus('staking')
      
      // Wait for the transaction to be processed
      setTimeout(() => {
        setTransactionStatus('success')
        setStakeAmount('')
        setHasStakedTokens(true)
      }, 3000)
      
    } catch (error) {
      console.error('Staking failed:', error)
      setTransactionStatus('failed')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">🔥 Stake CORE</h3>
        <p className="text-gray-400">
          Stake your CORE tokens to earn stCORE and participate in yield strategies. <strong>Note: Two transactions required (approval + staking)</strong>
        </p>
      </div>

      {/* Compact Balance Box - Top of Stake Interface */}
      <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-300 text-sm font-medium">Core Balances</span>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-400 hover:text-blue-300 text-xs underline"
          >
            Refresh
          </button>
        </div>
        
        {/* First Line - Core Assets */}
        <div className="flex items-center space-x-6 mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-xs">CORE:</span>
            <span className="text-white text-sm font-semibold">
              {formatBalance(coreBalance)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-xs">stCORE:</span>
            <span className="text-white text-sm font-semibold">
              {formatBalance(stCoreBalance)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-xs">lstBTC:</span>
            <span className="text-white text-sm font-semibold">
              {/* Placeholder for lstBTC balance */}
              0
            </span>
          </div>
        </div>
        
        {/* Second Line - Tokenized Assets */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-xs">SY:</span>
            <span className="text-white text-sm font-semibold">
              {/* Placeholder for SY balance */}
              {formatBalance(coreBalance)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-xs">PT:</span>
            <span className="text-white text-sm font-semibold">
              {/* Placeholder for PT balance */}
              {formatBalance(stCoreBalance)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-xs">YT:</span>
            <span className="text-white text-sm font-semibold">
              {/* Placeholder for YT balance */}
              0
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-xs">Claim:</span>
            <span className="text-white text-sm font-semibold">
              {/* Placeholder for claim balance */}
              {formatBalance(coreBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CORE Balance Card */}
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-semibold">CORE Balance</h4>
            <span className="text-2xl">🔥</span>
          </div>
          <div className="text-2xl font-bold text-white mb-2">
            {formatBalance(coreBalance)}
          </div>
          <div className="text-gray-400 text-sm">≈ {formatBalanceUSD(coreBalance)}</div>
          {parseFloat(coreBalance) === 0 && (
            <div className="mt-2">
              <a
                href="https://faucet.test.btcs.network/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm underline"
              >
                Get from Core Testnet Faucet →
              </a>
            </div>
          )}
        </div>

        {/* stCORE Balance Card */}
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-semibold">stCORE Balance</h4>
            <span className="text-2xl">🏦</span>
          </div>
          <div className="text-2xl font-bold text-white mb-2">
            {formatBalance(stCoreBalance)}
          </div>
          <div className="text-gray-400 text-sm">≈ {formatBalanceUSD(stCoreBalance)}</div>
          <div className="text-green-400 text-sm">
            +{currentHook.portfolioData?.totalAPY ? `${currentHook.portfolioData.totalAPY}%` : '8.5%'} APY
          </div>
        </div>
      </div>

      {/* Staking Interface */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Stake CORE → Get stCORE</h4>
        
        <div className="space-y-4">
          {/* Amount Input */}
          <AmountInput
            value={stakeAmount}
            onChange={setStakeAmount}
            label="Amount to Stake"
            placeholder="0.0"
            maxBalance={coreBalance}
            onMaxClick={() => setStakeAmount(coreBalance)}
            token="CORE"
            disabled={currentHook.isStakingPending}
          />

          {/* Staking Preview */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-900/50 rounded-lg">
            <div className="text-center">
              <p className="text-gray-400 text-xs">You'll Receive</p>
              <p className="text-white font-semibold">{stakeAmount || '0'} stCORE</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs">Exchange Rate</p>
              <p className="text-white font-semibold">1:1</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs">APY</p>
              <p className="text-green-400 font-semibold">
                {currentHook.portfolioData?.totalAPY ? `${currentHook.portfolioData.totalAPY}%` : '8.5%'}
              </p>
            </div>
          </div>

          {/* Stake Button */}
          <ActionButton
            onClick={handleStake}
            disabled={!isValidAmount || currentHook.isStakingPending || transactionStatus !== 'idle'}
            loading={currentHook.isStakingPending || transactionStatus === 'approving'}
            loadingText={
              transactionStatus === 'approving' ? 'Approving...' : 
              transactionStatus === 'staking' ? 'Staking...' : 
              'Staking...'
            }
            className="w-full"
          >
            {transactionStatus === 'success' ? '✅ Staking Successful!' :
             transactionStatus === 'failed' ? '❌ Staking Failed' :
             !stakeAmount || parseFloat(stakeAmount) === 0 
              ? 'Enter amount to stake'
              : parseFloat(stakeAmount) > parseFloat(coreBalance)
              ? 'Insufficient CORE balance'
              : `🔥 Stake ${stakeAmount} CORE → ${stakeAmount} stCORE`
            }
          </ActionButton>

          {/* Transaction Status Messages */}
          {transactionStatus === 'approving' && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-blue-400 text-sm">
                ⏳ <strong>Step 1: Token Approval</strong><br/>
                Please confirm the approval transaction in your wallet. This allows the CoreYield Router to spend your CORE tokens for staking.
              </p>
            </div>
          )}

          {transactionStatus === 'staking' && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-400 text-sm">
                🔥 <strong>Step 2: Staking Transaction</strong><br/>
                Please confirm the staking transaction in your wallet. This will stake your CORE tokens and mint stCORE tokens.
              </p>
            </div>
          )}

          {transactionStatus === 'success' && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-400 text-sm">
                ✅ <strong>Staking Successful!</strong><br/>
                Your CORE tokens have been staked and you've received stCORE tokens. Your balances will update shortly.
              </p>
            </div>
          )}

          {transactionStatus === 'failed' && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">
                ❌ <strong>Staking Failed</strong><br/>
                Please try again or check your wallet for transaction status. Make sure you have enough CORE tokens and gas fees.
              </p>
            </div>
          )}

          {/* Success Message */}
          {hasStakedTokens && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-400 text-sm">
                ✅ Great! You now have stCORE tokens. Head to the "Manage" tab to wrap and split them for yield opportunities.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Information Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <h5 className="text-blue-400 font-semibold mb-2">💡 What is Staking?</h5>
          <p className="text-blue-300 text-sm">
            Staking locks your CORE tokens to help secure the network and earn rewards. You receive stCORE tokens that represent your staked position.
          </p>
        </div>
        
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <h5 className="text-purple-400 font-semibold mb-2">🚀 Staking Process</h5>
          <p className="text-purple-300 text-sm">
            <strong>Step 1:</strong> Approve CoreYield Router to spend your CORE tokens<br/>
            <strong>Step 2:</strong> Confirm staking transaction to receive stCORE tokens<br/>
            <strong>Next:</strong> Wrap stCORE into SY tokens, then split into PT + YT
          </p>
        </div>
      </div>
    </div>
  )
}
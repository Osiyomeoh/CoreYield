import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowDownUp, 
  ArrowRight, 
  CheckCircle, 
  Loader2, 
  TrendingUp,
  Zap,
  Shield,
  Coins,
  BarChart3
} from 'lucide-react'
import { useYieldProtocol } from '../../hooks/useYieldProtocol'
import { CONTRACTS, ASSET_METADATA } from '@contracts/addresses'
import { formatUnits } from 'viem'
import toast from 'react-hot-toast'

interface UnifiedManageInterfaceProps {
  selectedAsset: 'stCORE' | 'lstBTC' | 'dualCORE'
  onAssetChange: (asset: 'stCORE' | 'lstBTC' | 'dualCORE') => void
}

export const UnifiedManageInterface: React.FC<UnifiedManageInterfaceProps> = ({
  selectedAsset,
  onAssetChange
}) => {
  const [amount, setAmount] = useState('')
  const [actionType, setActionType] = useState<'deposit' | 'split' | 'withdraw' | 'claim'>('deposit')
  const [isProcessing, setIsProcessing] = useState(false)
  
  const currentHook = useYieldProtocol(selectedAsset)
  const assetMetadata = ASSET_METADATA[selectedAsset]

  // Get real-time balances
  const assetBalance = currentHook.assetBalance ? formatUnits(currentHook.assetBalance as bigint, 18) : '0'
  const syBalance = currentHook.syBalance ? formatUnits(currentHook.syBalance as bigint, 18) : '0'
  const ptBalance = currentHook.ptBalance ? formatUnits(currentHook.ptBalance as bigint, 18) : '0'
  const ytBalance = currentHook.ytBalance ? formatUnits(currentHook.ytBalance as bigint, 18) : '0'
  const accumulatedYield = currentHook.accumulatedYield ? formatUnits(currentHook.accumulatedYield as bigint, 18) : '0'

  // Check if user has any tokens
  const hasAssetTokens = Number(assetBalance) > 0
  const hasSYTokens = Number(syBalance) > 0
  const hasPTYTTokens = Number(ptBalance) > 0 || Number(ytBalance) > 0

  // Auto-approval and execution function
  const executeAction = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setIsProcessing(true)
    
    try {
      switch (actionType) {
        case 'deposit':
          await handleDeposit()
          break
        case 'split':
          await handleSplit()
          break
        case 'withdraw':
          await handleWithdraw()
          break
        case 'claim':
          await handleClaim()
          break
      }
    } catch (error) {
      console.error('Action execution failed:', error)
      toast.error('Operation failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle deposit with auto-approval
  const handleDeposit = async () => {
    try {
      // Check if approval is needed
      if (currentHook.needsApproval(amount)) {
        console.log('🔐 Auto-approving asset for deposit...')
        toast.info('Approving tokens for deposit...')
        
        await currentHook.approveAsset(amount)
        
        // Wait for approval confirmation
        let attempts = 0
        while (attempts < 30 && currentHook.needsApproval(amount)) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          attempts++
          currentHook.refreshAllowanceData()
        }
        
        if (currentHook.needsApproval(amount)) {
          throw new Error('Approval timeout')
        }
        
        toast.success('Approval successful! Proceeding with deposit...')
      }

      // Execute deposit
      await currentHook.wrapAsset(amount, false)
      toast.success('Deposit initiated!')
      
    } catch (error) {
      console.error('Deposit failed:', error)
      throw error
    }
  }

  // Handle split with auto-approval
  const handleSplit = async () => {
    try {
      // First ensure we have SY tokens
      if (!hasSYTokens) {
        // Auto-deposit first, then split
        console.log('🔄 Auto-depositing before split...')
        await handleDeposit()
        
        // Wait for deposit to complete
        let attempts = 0
        while (attempts < 30 && Number(currentHook.syBalance || 0) === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          attempts++
          currentHook.refetchSyBalance()
        }
      }

      // Check SY approval for splitting
      if (currentHook.needsSYApproval(amount)) {
        console.log('🔐 Auto-approving SY tokens for splitting...')
        toast.info('Approving SY tokens for splitting...')
        
        await currentHook.approveSYTokens(amount)
        
        // Wait for approval confirmation
        let attempts = 0
        while (attempts < 30 && currentHook.needsSYApproval(amount)) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          attempts++
          currentHook.refreshAllowanceData()
        }
        
        if (currentHook.needsSYApproval(amount)) {
          throw new Error('SY approval timeout')
        }
        
        toast.success('SY approval successful! Proceeding with split...')
      }

      // Execute split
      await currentHook.splitTokens(amount)
      toast.success('Split initiated!')
      
    } catch (error) {
      console.error('Split failed:', error)
      throw error
    }
  }

  // Handle withdraw
  const handleWithdraw = async () => {
    try {
      await currentHook.handleWithdraw(amount)
      toast.success('Withdrawal initiated!')
    } catch (error) {
      console.error('Withdrawal failed:', error)
      throw error
    }
  }

  // Handle yield claim
  const handleClaim = async () => {
    try {
      await currentHook.claimYield()
      toast.success('Yield claim initiated!')
    } catch (error) {
      console.error('Yield claim failed:', error)
      throw error
    }
  }

  // Set max amount based on action type
  const setMaxAmount = () => {
    switch (actionType) {
      case 'deposit':
        setAmount(assetBalance)
        break
      case 'split':
        setAmount(syBalance)
        break
      case 'withdraw':
        setAmount(syBalance)
        break
      case 'claim':
        setAmount(accumulatedYield)
        break
    }
  }

  // Get available balance for current action
  const getAvailableBalance = () => {
    switch (actionType) {
      case 'deposit':
        return assetBalance
      case 'split':
        return syBalance
      case 'withdraw':
        return syBalance
      case 'claim':
        return accumulatedYield
    }
  }

  // Check if action is available
  const isActionAvailable = () => {
    switch (actionType) {
      case 'deposit':
        return hasAssetTokens
      case 'split':
        return hasSYTokens
      case 'withdraw':
        return hasSYTokens
      case 'claim':
        return Number(accumulatedYield) > 0
      default:
        return false
    }
  }

  // Get action button text
  const getActionButtonText = () => {
    if (isProcessing) {
      return (
        <div className="flex items-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Processing...</span>
        </div>
      )
    }

    switch (actionType) {
      case 'deposit':
        return `💰 Deposit ${assetMetadata.symbol}`
      case 'split':
        return `🎲 Split to PT + YT`
      case 'withdraw':
        return `💸 Withdraw ${assetMetadata.symbol}`
      case 'claim':
        return `🌾 Claim Yield`
      default:
        return 'Execute Action'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
    >
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">Unified Asset Management</h3>
        <p className="text-gray-400">One interface for all your asset operations with automatic approval handling</p>
      </div>

      {/* Asset Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Select Asset</label>
        <select
          value={selectedAsset}
          onChange={(e) => onAssetChange(e.target.value as any)}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500"
        >
          {Object.entries(ASSET_METADATA).map(([key, asset]) => (
            <option key={key} value={key}>
              {asset.symbol} - {asset.name}
            </option>
          ))}
        </select>
      </div>

      {/* Action Type Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Select Action</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'deposit', label: 'Deposit', icon: '💰', color: 'from-blue-500 to-blue-600' },
            { key: 'split', label: 'Split', icon: '🎲', color: 'from-purple-500 to-purple-600' },
            { key: 'withdraw', label: 'Withdraw', icon: '💸', color: 'from-red-500 to-red-600' },
            { key: 'claim', label: 'Claim Yield', icon: '🌾', color: 'from-green-500 to-green-600' }
          ].map((action) => (
            <button
              key={action.key}
              onClick={() => setActionType(action.key as any)}
              disabled={!isActionAvailable()}
              className={`p-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                actionType === action.key
                  ? `bg-gradient-to-r ${action.color} text-white shadow-lg`
                  : isActionAvailable()
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Amount Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Amount ({actionType === 'deposit' ? assetMetadata.symbol : actionType === 'withdraw' ? assetMetadata.symbol : 'SY'})
        </label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors pr-16"
          />
          <button
            onClick={setMaxAmount}
            className="absolute right-3 top-3 text-blue-400 text-sm hover:text-blue-300 transition-colors font-medium"
          >
            MAX
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-1 flex justify-between">
          <span>Available: {getAvailableBalance()} {actionType === 'deposit' ? assetMetadata.symbol : 'SY'}</span>
          {actionType === 'claim' && (
            <span className="text-green-400">🌾 Yield: {accumulatedYield} SY</span>
          )}
        </div>
      </div>

      {/* Current Balances Display */}
      <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Current Balances</h4>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">{assetMetadata.symbol}:</span>
            <span className="text-white">{assetBalance}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">SY Tokens:</span>
            <span className="text-white">{syBalance}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">PT Tokens:</span>
            <span className="text-white">{ptBalance}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">YT Tokens:</span>
            <span className="text-white">{ytBalance}</span>
          </div>
        </div>
      </div>

      {/* Execute Button */}
      <button
        onClick={executeAction}
        disabled={!amount || Number(amount) <= 0 || !isActionAvailable() || isProcessing}
        className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl font-semibold transition-all duration-300 disabled:cursor-not-allowed"
      >
        {getActionButtonText()}
      </button>

      {/* Info Panel */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <div className="text-blue-400 font-medium mb-2">✨ Automatic Approval Handling</div>
            <div className="text-blue-300 space-y-1 text-xs">
              <div>• No separate approval buttons needed</div>
              <div>• Approvals are handled automatically when executing actions</div>
              <div>• All operations are optimized for gas efficiency</div>
              <div>• Real-time balance updates and transaction tracking</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Explanation */}
      <div className="mt-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
        <h4 className="text-sm font-medium text-gray-300 mb-2">What this action does:</h4>
        <div className="text-xs text-gray-400 space-y-1">
          {actionType === 'deposit' && (
            <>
              <div>• Wraps your {assetMetadata.symbol} into SY tokens</div>
              <div>• SY tokens automatically accumulate yield over time</div>
              <div>• You can later split SY tokens into PT + YT for advanced strategies</div>
            </>
          )}
          {actionType === 'split' && (
            <>
              <div>• Splits SY tokens into Principal (PT) + Yield (YT) tokens</div>
              <div>• PT tokens: Fixed-rate, principal-protected yield</div>
              <div>• YT tokens: Pure yield exposure with higher risk/reward</div>
            </>
          )}
          {actionType === 'withdraw' && (
            <>
              <div>• Unwraps SY tokens back to {assetMetadata.symbol}</div>
              <div>• You'll receive your original {assetMetadata.symbol} plus accumulated yield</div>
              <div>• Withdrawal is instant and doesn't affect your PT/YT positions</div>
            </>
          )}
          {actionType === 'claim' && (
            <>
              <div>• Claims accumulated yield from your SY tokens</div>
              <div>• Yield is distributed as additional SY tokens</div>
              <div>• You can then split or withdraw these yield tokens</div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

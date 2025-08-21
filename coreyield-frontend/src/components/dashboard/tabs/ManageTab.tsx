import React, { useState, useEffect } from 'react'
import { AmountInput } from '../shared/AmountInput'
import { ActionButton } from '../shared/ActionButton'
import { ProcessingStatus } from '../shared/ProcessingStatus'
import { formatUnits } from 'viem'
import { useCoreYield } from '../../../hooks/useCoreYield'
import { CONTRACTS } from '../../../../contracts/addresses'
import toast from 'react-hot-toast'

interface ManageTabProps {
  currentHook: any
}

export const ManageTab: React.FC<ManageTabProps> = ({
  currentHook
}) => {
  const [activeOperation, setActiveOperation] = useState<'wrap' | 'split' | 'merge' | 'unwrap' | 'claim' | 'trade'>('wrap')
  const [wrapAmount, setWrapAmount] = useState('')
  const [splitAmount, setSplitAmount] = useState('')
  const [unwrapAmount, setUnwrapAmount] = useState('')
  const [mergePTAmount, setMergePTAmount] = useState('')
  const [mergeYTAmount, setMergeYTAmount] = useState('')
  const [claimAmount, setClaimAmount] = useState('')
  const [tradeAmount, setTradeAmount] = useState('')
  const [tradeDirection, setTradeDirection] = useState<'PT_TO_YT' | 'YT_TO_PT'>('PT_TO_YT')
  const [selectedAsset, setSelectedAsset] = useState<'dualCORE' | 'stCORE' | 'lstBTC'>('dualCORE')

  // Use the PT/YT protocol hook
  const {
    userBalances,
    marketAnalytics,
    isLoading,
    address,
    isConnected,
    wrapToSY,
    splitSY,
    mergePTYT,
    unwrapFromSY,
    // refetchAll removed - function doesn't exist
    mintTokens
  } = useCoreYield()

  // Asset options for PT/YT operations
  const assetOptions = [
    { key: 'dualCORE', label: 'Dual CORE', icon: '⚡' },
    { key: 'stCORE', label: 'Staked CORE', icon: '🔥' },
    { key: 'lstBTC', label: 'Liquid Staked BTC', icon: '₿' }
  ] as const

  // Safe access to hook data with fallbacks - using actual available properties
  const coreBalance = currentHook?.coreBalance ? formatUnits(currentHook.coreBalance.value, currentHook.coreBalance.decimals) : '0'
  const stCoreBalance = currentHook?.stCoreBalance ? formatUnits(currentHook.stCoreBalance.value, currentHook.stCoreBalance.decimals) : '0'
  const portfolioValue = currentHook?.portfolioData?.totalValue || '0'
  const portfolioAPY = currentHook?.portfolioData?.totalAPY || '0'
  const stakedAmount = currentHook?.stakingData?.stakedAmount || '0'
  const totalRewards = currentHook?.stakingData?.totalRewards || '0'

  // Safe access to loading states
  const isStakingPending = currentHook?.isStakingPending || false
  const isStrategyPending = currentHook?.isStrategyPending || false
  const isRouterPending = currentHook?.isRouterPending || false

  // Safe formatting functions
  const formatBalance = (balance: string) => {
    try {
      const num = parseFloat(balance || '0')
      if (num === 0) return '0.0000'
      if (num < 0.0001) return '< 0.0001'
      return num.toFixed(4)
    } catch {
      return '0.0000'
    }
  }

  const formatBalanceUSD = (balance: string) => {
    try {
      // For now, use a simple conversion (1 CORE = $1 for demo)
      const usdValue = parseFloat(balance || '0') * 1
      if (usdValue === 0) return '$0.00'
      if (usdValue < 0.01) return '< $0.01'
      return `$${usdValue.toFixed(2)}`
    } catch {
      return '$0.00'
    }
  }

  const formatYield = (yieldAmount: string) => {
    try {
      const num = parseFloat(yieldAmount || '0')
      if (num === 0) return '0.000000'
      if (num < 0.000001) return '< 0.000001'
      return num.toFixed(6)
    } catch {
      return '0.000000'
    }
  }

  // Asset symbol with fallback
  const assetSymbol = 'stCORE' // Default to stCORE since that's what we're working with

  // Handler functions - now using real PT/YT functionality
  const handleWrap = async () => {
    if (!wrapAmount || parseFloat(wrapAmount) <= 0) return
    
    try {
      await wrapToSY(selectedAsset, wrapAmount)
      setWrapAmount('')
      // TODO: Implement refresh functionality
    } catch (error) {
      console.error('Wrap failed:', error)
    }
  }

  const handleSplit = async () => {
    if (!splitAmount || parseFloat(splitAmount) <= 0) return
    
    try {
      await splitSY(selectedAsset, splitAmount)
      setSplitAmount('')
      // TODO: Implement refresh functionality
    } catch (error) {
      console.error('Split failed:', error)
    }
  }

  const handleMerge = async () => {
    if (!mergePTAmount || !mergeYTAmount || parseFloat(mergePTAmount) <= 0 || parseFloat(mergeYTAmount) <= 0) return
    
    try {
      await mergePTYT(selectedAsset, mergePTAmount, mergeYTAmount)
      setMergePTAmount('')
      setMergeYTAmount('')
      // TODO: Implement refresh functionality
    } catch (error) {
      console.error('Merge failed:', error)
    }
  }

  const handleUnwrap = async () => {
    if (!unwrapAmount || parseFloat(unwrapAmount) <= 0) return
    
    try {
      await unwrapFromSY(selectedAsset, unwrapAmount)
      setUnwrapAmount('')
      // TODO: Implement refresh functionality
    } catch (error) {
      console.error('Unwrap failed:', error)
    }
  }

  const handleClaimYield = async () => {
    try {
      // Call the harvestAndTrack function from CoreYieldRouter to claim yield
      if (currentHook?.harvestAndTrack) {
        // Claim yield from stCORE asset
        await currentHook.harvestAndTrack('0x92535aBF6A7d9af69335cAc4419f0EFEa3a23990') // stCORE token address
      }
    } catch (error) {
      console.error('Claim yield failed:', error)
    }
  }

  const handleClaimStakingRewards = async () => {
    try {
      // Call the claimRewards function from CoreStaking
      if (currentHook?.claimStakingRewards) {
        await currentHook.claimStakingRewards()
      }
    } catch (error) {
      console.error('Claim staking rewards failed:', error)
    }
  }

  const handleMintTokens = async (asset: 'dualCORE' | 'stCORE' | 'lstBTC') => {
    try {
      const amount = asset === 'lstBTC' ? '0.01' : '0.01'
      await mintTokens(asset, amount)
    } catch (error) {
      console.error('Minting failed:', error)
      toast.error(`Failed to mint ${asset} tokens`)
    }
  }

  // Debug logging
  console.log('ManageTab Debug:', {
    coreBalance,
    stCoreBalance,
    portfolioValue,
    portfolioAPY,
    stakedAmount,
    totalRewards,
    currentHook: {
      portfolioData: currentHook?.portfolioData,
      stakingData: currentHook?.stakingData,
      coreBalance: currentHook?.coreBalance,
      stCoreBalance: currentHook?.stCoreBalance
    }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">⚙️ Manage Positions</h3>
        <p className="text-gray-400">
          Wrap, split, and manage your {assetSymbol} yield positions
        </p>

      </div>

      {/* Current Balances Overview */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Current Balances</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-gray-400 text-sm">CORE Balance</p>
            <p className="text-white font-bold text-lg">{formatBalance(coreBalance)}</p>
            <p className="text-gray-400 text-xs">{formatBalanceUSD(coreBalance)}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">stCORE Balance</p>
            <p className="text-white font-bold text-lg">{formatBalance(stCoreBalance)}</p>
            <p className="text-gray-400 text-xs">{formatBalanceUSD(stCoreBalance)}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Portfolio Value</p>
            <p className="text-white font-bold text-lg">{formatBalance(portfolioValue)}</p>
            <p className="text-gray-400 text-xs">{formatBalanceUSD(portfolioValue)}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Total Rewards</p>
            <p className="text-white font-bold text-lg">{formatBalance(totalRewards)}</p>
            <p className="text-gray-400 text-xs">Available to claim</p>
          </div>
        </div>
      </div>

      {/* Asset Selector */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 mb-6">
        <h4 className="text-lg font-semibold text-white mb-4">Select Asset for PT/YT Operations</h4>
        <div className="flex space-x-2">
          {assetOptions.map((asset) => (
            <button
              key={asset.key}
              onClick={() => setSelectedAsset(asset.key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedAsset === asset.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span className="mr-2">{asset.icon}</span>
              {asset.label}
            </button>
          ))}
        </div>
        
        {/* Asset Balances */}
        {userBalances[selectedAsset] && (
          <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-white">{userBalances[selectedAsset].underlying}</div>
              <div className="text-sm text-gray-400">Underlying</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-400">{userBalances[selectedAsset].sy}</div>
              <div className="text-sm text-gray-400">SY Token</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-400">{userBalances[selectedAsset].pt}</div>
              <div className="text-sm text-gray-400">PT Token</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-400">{userBalances[selectedAsset].yt}</div>
              <div className="text-sm text-gray-400">YT Token</div>
            </div>
          </div>
        )}

        {/* Mint Test Tokens Section */}
        <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <h5 className="text-green-300 font-medium mb-3">🧪 Mint Test Tokens</h5>
          <p className="text-green-200 text-sm mb-3">
            Mint test tokens to your address to test PT/YT functionality
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => handleMintTokens('dualCORE')}
              disabled={isLoading}
              className="px-3 py-2 text-sm font-medium text-green-700 bg-green-200 border border-green-300 rounded-md hover:bg-green-300 disabled:opacity-50"
            >
                              Mint 0.01 dualCORE
            </button>
            <button
              onClick={() => handleMintTokens('stCORE')}
              disabled={isLoading}
              className="px-3 py-2 text-sm font-medium text-green-700 bg-green-200 border border-green-300 rounded-md hover:bg-green-300 disabled:opacity-50"
            >
                              Mint 0.01 stCORE
            </button>
            <button
              onClick={() => handleMintTokens('lstBTC')}
              disabled={isLoading}
              className="px-3 py-2 text-sm font-medium text-green-700 bg-green-200 border border-green-300 rounded-md hover:bg-green-300 disabled:opacity-50"
            >
              Mint 100 lstBTC
            </button>
          </div>
        </div>

        {/* User Info Section */}
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <h6 className="text-blue-300 font-medium mb-2">👤 User Info</h6>
          <div className="text-xs text-blue-200 space-y-1">
            <div>Network: Core Testnet (Chain ID: 1114)</div>
            <div>Wallet: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}</div>
            <div>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</div>
          </div>
        </div>
      </div>

      {/* Operation Selector */}
      <div className="flex items-center justify-center space-x-2">
        {[
          { id: 'wrap', label: 'Wrap', icon: '💰', description: 'Wrap to SY token' },
          { id: 'split', label: 'Split', icon: '✂️', description: 'Split SY to PT + YT' },
          { id: 'merge', label: 'Merge', icon: '🔗', description: 'Merge PT + YT to SY' },
          { id: 'unwrap', label: 'Unwrap', icon: '🔓', description: 'Unwrap SY to underlying' },
          { id: 'claim', label: 'Claim Yield', icon: '🎯', description: 'Claim available yield' },
          { id: 'trade', label: 'Trade PT/YT', icon: '🔄', description: 'Trade PT/YT tokens' }
        ].map((op) => (
          <button
            key={op.id}
            onClick={() => setActiveOperation(op.id as any)}
            className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 flex flex-col items-center space-y-1 ${
              activeOperation === op.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <span className="text-xl">{op.icon}</span>
            <span className="text-sm">{op.label}</span>
            <span className="text-xs opacity-75">{op.description}</span>
          </button>
        ))}
      </div>

      {/* Wrap Operation */}
      {activeOperation === 'wrap' && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <span>💰</span>
            <span>Wrap {selectedAsset} → SY Token</span>
          </h4>
          
          <div className="space-y-4">
            <AmountInput
              value={wrapAmount}
              onChange={(value) => setWrapAmount(value)}
              placeholder="0.0"
              label={`Amount to Wrap`}
              maxBalance={userBalances[selectedAsset]?.underlying || '0'}
              onMaxClick={() => setWrapAmount(userBalances[selectedAsset]?.underlying || '0')}
              token={selectedAsset}
              disabled={isLoading}
            />

            {wrapAmount && parseFloat(wrapAmount) > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h5 className="text-blue-300 font-medium mb-2">Transaction Preview</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">You're Wrapping</p>
                    <p className="text-white font-semibold">{wrapAmount} {selectedAsset}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">You'll Receive</p>
                    <p className="text-white font-semibold">{wrapAmount} SY Token</p>
                  </div>
                </div>
              </div>
            )}

            <ActionButton
              onClick={handleWrap}
              disabled={!wrapAmount || parseFloat(wrapAmount) <= 0 || parseFloat(wrapAmount) > parseFloat(userBalances[selectedAsset]?.underlying || '0') || isLoading}
              loading={isLoading}
              loadingText="Wrapping..."
              variant="primary"
              fullWidth
            >
              {!wrapAmount || parseFloat(wrapAmount) <= 0 
                ? 'Enter amount to wrap'
                : parseFloat(wrapAmount) > parseFloat(userBalances[selectedAsset]?.underlying || '0')
                ? `Insufficient ${selectedAsset} balance`
                : `💰 Wrap ${wrapAmount} ${selectedAsset} → SY Token`
              }
            </ActionButton>
          </div>
        </div>
      )}

      {/* Split Operation */}
      {activeOperation === 'split' && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <span>✂️</span>
            <span>Split SY Token → PT + YT</span>
          </h4>
          
          <div className="space-y-4">
            <AmountInput
              value={splitAmount}
              onChange={(value) => setSplitAmount(value)}
              placeholder="0.0"
              label="SY Amount to Split"
              maxBalance={userBalances[selectedAsset]?.sy || '0'}
              onMaxClick={() => setSplitAmount(userBalances[selectedAsset]?.sy || '0')}
              token="SY"
              disabled={isLoading}
            />

            {splitAmount && parseFloat(splitAmount) > 0 && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <h5 className="text-green-300 font-medium mb-2">Split Preview</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Input</p>
                    <p className="text-white font-semibold">{splitAmount} SY Token</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Output</p>
                    <p className="text-white font-semibold">{splitAmount} PT + {splitAmount} YT</p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-green-300">
                  <p>• PT (Principal Token): Fixed yield until maturity</p>
                  <p>• YT (Yield Token): Variable yield exposure</p>
                </div>
              </div>
            )}

            <ActionButton
              onClick={handleSplit}
              disabled={!splitAmount || parseFloat(splitAmount) <= 0 || parseFloat(splitAmount) > parseFloat(userBalances[selectedAsset]?.sy || '0') || isLoading}
              loading={isLoading}
              loadingText="Splitting..."
              variant="primary"
              fullWidth
            >
              {!splitAmount || parseFloat(splitAmount) <= 0 
                ? 'Enter SY amount to split'
                : parseFloat(splitAmount) > parseFloat(userBalances[selectedAsset]?.sy || '0')
                ? 'Insufficient SY balance'
                : `✂️ Split ${splitAmount} SY → PT + YT`
              }
            </ActionButton>
          </div>
        </div>
      )}

      {/* Merge Operation */}
      {activeOperation === 'merge' && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <span>🔗</span>
            <span>Merge PT + YT → SY Token</span>
          </h4>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <AmountInput
                value={mergePTAmount}
                onChange={(value) => setMergePTAmount(value)}
                placeholder="0.0"
                label="PT Amount"
                maxBalance={userBalances[selectedAsset]?.pt || '0'}
                onMaxClick={() => setMergePTAmount(userBalances[selectedAsset]?.pt || '0')}
                token="PT"
                disabled={isLoading}
              />
              <AmountInput
                value={mergeYTAmount}
                onChange={(value) => setMergeYTAmount(value)}
                placeholder="0.0"
                label="YT Amount"
                maxBalance={userBalances[selectedAsset]?.yt || '0'}
                onMaxClick={() => setMergeYTAmount(userBalances[selectedAsset]?.yt || '0')}
                token="YT"
                disabled={isLoading}
              />
            </div>

            {mergePTAmount && mergeYTAmount && parseFloat(mergePTAmount) > 0 && parseFloat(mergeYTAmount) > 0 && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                <h5 className="text-purple-300 font-medium mb-2">Merge Preview</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Input</p>
                    <p className="text-white font-semibold">{mergePTAmount} PT + {mergeYTAmount} YT</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Output</p>
                    <p className="text-white font-semibold">{Math.min(parseFloat(mergePTAmount), parseFloat(mergeYTAmount))} SY Token</p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-purple-300">
                  <p>• Merges equal amounts of PT and YT back to SY</p>
                  <p>• Output is limited by the smaller of PT or YT amounts</p>
                </div>
              </div>
            )}

            <ActionButton
              onClick={handleMerge}
              disabled={!mergePTAmount || !mergeYTAmount || parseFloat(mergePTAmount) <= 0 || parseFloat(mergeYTAmount) <= 0 || isLoading}
              loading={isLoading}
              loadingText="Merging..."
              variant="primary"
              fullWidth
            >
              {!mergePTAmount || !mergeYTAmount || parseFloat(mergePTAmount) <= 0 || parseFloat(mergeYTAmount) <= 0
                ? 'Enter PT and YT amounts'
                : `🔗 Merge ${mergePTAmount} PT + ${mergeYTAmount} YT → SY Token`
              }
            </ActionButton>
          </div>
        </div>
      )}

      {/* Unwrap Operation */}
      {activeOperation === 'unwrap' && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <span>🔓</span>
            <span>Unwrap SY Token → {selectedAsset}</span>
          </h4>
          
          <div className="space-y-4">
            <AmountInput
              value={unwrapAmount}
              onChange={(value) => setUnwrapAmount(value)}
              placeholder="0.0"
              label="SY Amount to Unwrap"
              maxBalance={userBalances[selectedAsset]?.sy || '0'}
              onMaxClick={() => setUnwrapAmount(userBalances[selectedAsset]?.sy || '0')}
              token="SY"
              disabled={isLoading}
            />

            {unwrapAmount && parseFloat(unwrapAmount) > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                <h5 className="text-orange-300 font-medium mb-2">Unwrap Preview</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Input</p>
                    <p className="text-white font-semibold">{unwrapAmount} SY Token</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Output</p>
                    <p className="text-white font-semibold">{unwrapAmount} {selectedAsset}</p>
                  </div>
                </div>
              </div>
            )}

            <ActionButton
              onClick={handleUnwrap}
              disabled={!unwrapAmount || parseFloat(unwrapAmount) <= 0 || parseFloat(unwrapAmount) > parseFloat(userBalances[selectedAsset]?.sy || '0') || isLoading}
              loading={isLoading}
              loadingText="Unwrapping..."
              variant="primary"
              fullWidth
            >
              {!unwrapAmount || parseFloat(unwrapAmount) <= 0 
                ? 'Enter SY amount to unwrap'
                : parseFloat(unwrapAmount) > parseFloat(userBalances[selectedAsset]?.sy || '0')
                ? 'Insufficient SY balance'
                : `🔓 Unwrap ${unwrapAmount} SY → ${unwrapAmount} ${selectedAsset}`
              }
            </ActionButton>
          </div>
        </div>
      )}

      {/* Yield Claiming Section - Always show for debugging */}
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <span>🎯</span>
          <span>Claim Available Yield</span>
        </h4>
        
        {/* Debug Info */}
        <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
          <p className="text-gray-300 text-sm">
            <strong>Debug Info:</strong><br/>
            Total Rewards: {totalRewards} CORE<br/>
            Staked Amount: {stakedAmount} CORE<br/>
            Portfolio Value: {portfolioValue} CORE<br/>
            stCORE Balance: {stCoreBalance} stCORE
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-green-400 text-2xl font-bold">{formatYield(totalRewards)} CORE</p>
              <p className="text-gray-400 text-sm">Available to claim from staking rewards</p>
            </div>
            
            <ActionButton
              onClick={handleClaimStakingRewards}
              disabled={isStakingPending || parseFloat(totalRewards) <= 0}
              loading={isStakingPending}
              loadingText="Claiming..."
              variant="success"
              className="px-6"
            >
              {parseFloat(totalRewards) <= 0 ? 'No Rewards to Claim' : '💰 Claim Staking Rewards'}
            </ActionButton>
          </div>

          {/* Additional yield claiming from strategies */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h5 className="text-blue-300 font-medium mb-2">Strategy Yield</h5>
            <p className="text-gray-300 text-sm mb-3">
              Harvest yield from your yield strategies and liquidity positions
            </p>
            <ActionButton
              onClick={handleClaimYield}
              disabled={isRouterPending}
              loading={isRouterPending}
              loadingText="Harvesting..."
              variant="primary"
              className="w-full"
            >
              🌾 Harvest Strategy Yield
            </ActionButton>
          </div>
        </div>
      </div>

      {/* Process Flow Visualization */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-white mb-4">🔄 Process Flow</h4>
        <div className="flex items-center justify-center space-x-4 overflow-x-auto">
          {[
            { step: assetSymbol, desc: 'Original Asset' },
            { step: `SY-${assetSymbol}`, desc: 'Wrapped (Yield-bearing)' },
            { step: 'PT + YT', desc: 'Split (Principal + Yield)' }
          ].map((item, index) => (
            <React.Fragment key={item.step}>
              <div className="flex-shrink-0 text-center">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 mb-2">
                  <span className="text-white font-medium text-sm">{item.step}</span>
                </div>
                <span className="text-gray-400 text-xs">{item.desc}</span>
              </div>
              {index < 2 && (
                <div className="flex-shrink-0 text-gray-400 text-xl">→</div>
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="text-center text-gray-400 text-sm mt-4">
          Transform your assets through wrapping and splitting for maximum yield potential
        </p>
      </div>

      {/* Processing Status */}
      {(isStakingPending || isStrategyPending || isRouterPending) && (
        <ProcessingStatus
          isProcessing={isStakingPending || isStrategyPending || isRouterPending}
          operation={
            isStakingPending ? 'Staking tokens...' :
            isStrategyPending ? 'Creating strategy...' :
            isRouterPending ? 'Processing transaction...' : ''
          }
        />
      )}

      {/* Educational Section */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-white mb-3">💡 Management Guide</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
          <div className="space-y-2">
            <h5 className="text-white font-medium flex items-center space-x-1">
              <span>💰</span>
              <span>Wrapping</span>
            </h5>
            <ul className="space-y-1">
              <li>• Convert {assetSymbol} to SY-{assetSymbol}</li>
              <li>• Start earning yield immediately</li>
              <li>• 1:1 conversion ratio</li>
              <li>• Reversible process</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h5 className="text-white font-medium flex items-center space-x-1">
              <span>✨</span>
              <span>Splitting</span>
            </h5>
            <ul className="space-y-1">
              <li>• Split SY into PT + YT tokens</li>
              <li>• PT = Principal, YT = Yield rights</li>
              <li>• Enables advanced strategies</li>
              <li>• Can be combined back to SY</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h5 className="text-white font-medium flex items-center space-x-1">
              <span>🔓</span>
              <span>Unwrapping</span>
            </h5>
            <ul className="space-y-1">
              <li>• Convert SY back to {assetSymbol}</li>
              <li>• Exit your yield position</li>
              <li>• 1:1 conversion ratio</li>
              <li>• Access original asset</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
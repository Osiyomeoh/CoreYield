import React, { useState } from 'react'
import { useYieldProtocol } from '../../../hooks/useYieldProtocol'
import { CONTRACTS, ASSET_METADATA } from '../../../../contracts/addresses'
import { AmountInput } from '../shared/AmountInput'
import { ActionButton } from '../shared/ActionButton'
import toast from 'react-hot-toast'

interface OperationsTabProps {
  currentHook: any
}

export const OperationsTab: React.FC<OperationsTabProps> = ({
  currentHook
}) => {
  const [activeOperation, setActiveOperation] = useState<'wrap' | 'split' | 'merge' | 'unwrap'>('wrap')
  const [selectedAsset, setSelectedAsset] = useState<'dualCORE' | 'stCORE' | 'lstBTC'>('dualCORE')
  const [wrapAmount, setWrapAmount] = useState('')
  const [splitAmount, setSplitAmount] = useState('')
  const [mergePTAmount, setMergePTAmount] = useState('')
  const [mergeYTAmount, setMergeYTAmount] = useState('')
  const [unwrapAmount, setUnwrapAmount] = useState('')

  const {
    userBalances,
    isLoading,
    wrapToSY,
    splitSY,
    mergePTYT,
    unwrapFromSY,
    mintTokens,
    refetchAll
  } = useYieldProtocol()

  const assetOptions = [
    { key: 'dualCORE', label: 'Dual CORE', icon: '⚡' },
    { key: 'stCORE', label: 'Staked CORE', icon: '🔥' },
    { key: 'lstBTC', label: 'Liquid Staked BTC', icon: '₿' }
  ] as const

  const handleMintTokens = async (asset: 'dualCORE' | 'stCORE' | 'lstBTC') => {
    try {
      const amount = asset === 'lstBTC' ? '0.01' : '0.01'
      await mintTokens(asset, amount)
    } catch (error) {
      console.error('Minting failed:', error)
      toast.error(`Failed to mint ${asset} tokens`)
    }
  }

  const handleWrap = async () => {
    if (!wrapAmount || parseFloat(wrapAmount) <= 0) return
    try {
      await wrapToSY(selectedAsset, wrapAmount)
      setWrapAmount('')
      refetchAll()
    } catch (error) {
      console.error('Wrap failed:', error)
    }
  }

  const handleSplit = async () => {
    if (!splitAmount || parseFloat(splitAmount) <= 0) return
    try {
      await splitSY(selectedAsset, splitAmount)
      setSplitAmount('')
      refetchAll()
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
      refetchAll()
    } catch (error) {
      console.error('Merge failed:', error)
    }
  }

  const handleUnwrap = async () => {
    if (!unwrapAmount || parseFloat(unwrapAmount) <= 0) return
    try {
      await unwrapFromSY(selectedAsset, unwrapAmount)
      setUnwrapAmount('')
      refetchAll()
    } catch (error) {
      console.error('Unwrap failed:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">⚙️ PT/YT Operations</h3>
        <p className="text-gray-400">
          Wrap, split, merge, and unwrap your yield positions
        </p>
      </div>

      {/* Asset Selector */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4">
        <h4 className="text-lg font-semibold text-white mb-4">Select Asset</h4>
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

        {/* Mint Test Tokens */}
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <h5 className="text-green-300 font-medium mb-3">🧪 Mint Test Tokens</h5>
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
      </div>

      {/* Operation Selector */}
      <div className="flex items-center justify-center space-x-2">
        {[
          { id: 'wrap', label: 'Wrap', icon: '💰', description: 'Wrap to SY token' },
          { id: 'split', label: 'Split', icon: '✂️', description: 'Split SY to PT + YT' },
          { id: 'merge', label: 'Merge', icon: '🔗', description: 'Merge PT + YT to SY' },
          { id: 'unwrap', label: 'Unwrap', icon: '🔓', description: 'Unwrap SY to underlying' }
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
    </div>
  )
}

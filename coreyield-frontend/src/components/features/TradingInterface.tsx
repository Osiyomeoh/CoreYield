import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDownUp, ArrowRight, CheckCircle, Loader2, TrendingUp } from 'lucide-react'
import type { YieldAsset, TabType } from '@/types'

interface TradingInterfaceProps {
  selectedAsset: YieldAsset
  amount: string
  setAmount: (amount: string) => void
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  isConnected: boolean
  needsApproval: boolean
  canExecuteAction: boolean
  isApproving: boolean
  isDepositing: boolean
  isRedeeming: boolean
  onApprove: () => void
  onDeposit: () => void
  onWithdraw: () => void
  onSetMaxAmount: () => void
  availableBalance: string
}

const TradingInterface: React.FC<TradingInterfaceProps> = ({
  selectedAsset,
  amount,
  setAmount,
  activeTab,
  setActiveTab,
  isConnected,
  needsApproval,
  canExecuteAction,
  isApproving,
  isDepositing,
  isRedeeming,
  onApprove,
  onDeposit,
  onWithdraw,
  onSetMaxAmount,
  availableBalance
}) => {
  const isLoading = isApproving || isDepositing || isRedeeming

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
    >
      {/* Tab Navigation */}
      <div className="flex items-center space-x-1 mb-6 bg-gray-800/50 rounded-xl p-1">
        {(['deposit', 'withdraw'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
              activeTab === tab
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              {tab === 'deposit' ? (
                <ArrowDownUp className="w-4 h-4 rotate-180" />
              ) : (
                <ArrowDownUp className="w-4 h-4" />
              )}
              <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Amount ({activeTab === 'deposit' ? selectedAsset.name : `SY-${selectedAsset.name}`})
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
              onClick={onSetMaxAmount}
              className="absolute right-3 top-3 text-blue-400 text-sm hover:text-blue-300 transition-colors font-medium"
            >
              MAX
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-1 flex justify-between">
            <span>
              Available: {availableBalance}
            </span>
            <span>
              ≈ ${(parseFloat(amount || '0') * 1850).toFixed(2)} USD
            </span>
          </div>
        </div>

        {/* Preview Card */}
        {amount && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl"
          >
            <h4 className="text-sm font-medium text-blue-400 mb-3">Transaction Preview</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">You {activeTab}:</span>
                <span className="text-white font-medium">
                  {amount} {activeTab === 'deposit' ? selectedAsset.name : `SY-${selectedAsset.name}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">You receive:</span>
                <span className="text-blue-400 font-medium">
                  ~{amount} {activeTab === 'deposit' ? `SY-${selectedAsset.name}` : selectedAsset.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">APY:</span>
                <span className="text-green-400 font-medium">{selectedAsset.apy}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Network fee:</span>
                <span className="text-gray-300">~0.001 CORE</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {activeTab === 'deposit' && needsApproval && (
            <button
              onClick={onApprove}
              disabled={!canExecuteAction || isApproving}
              className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center space-x-2">
                {isApproving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>
                  {isApproving ? 'Approving...' : `Approve ${selectedAsset.name}`}
                </span>
              </div>
            </button>
          )}

          <button
            onClick={activeTab === 'deposit' ? onDeposit : onWithdraw}
            disabled={
              !isConnected || 
              !amount || 
              !canExecuteAction || 
              (activeTab === 'deposit' && needsApproval) ||
              isLoading
            }
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-500/25"
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center space-x-2"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {activeTab === 'deposit' 
                      ? (isDepositing ? 'Confirming...' : 'Depositing...')
                      : (isRedeeming ? 'Confirming...' : 'Withdrawing...')
                    }
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="default"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center space-x-2"
                >
                  <span>
                    {!isConnected 
                      ? 'Connect Wallet First' 
                      : !canExecuteAction
                      ? 'Insufficient Balance'
                      : `${activeTab === 'deposit' ? 'Deposit' : 'Withdraw'} ${selectedAsset.name}`
                    }
                  </span>
                  {isConnected && canExecuteAction && <ArrowRight className="w-4 h-4" />}
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Yield Projection */}
        {amount && activeTab === 'deposit' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl"
          >
            <h4 className="text-sm font-medium text-green-400 mb-3 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Yield Projection</span>
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Daily yield:</span>
                <span className="text-white">
                  {(parseFloat(amount) * selectedAsset.apy / 365 / 100).toFixed(6)} {selectedAsset.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Monthly yield:</span>
                <span className="text-white">
                  {(parseFloat(amount) * selectedAsset.apy / 12 / 100).toFixed(4)} {selectedAsset.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Yearly yield:</span>
                <span className="text-green-400 font-medium">
                  {(parseFloat(amount) * selectedAsset.apy / 100).toFixed(4)} {selectedAsset.name}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-green-500/20">
                <span className="text-gray-400">Total after 1 year:</span>
                <span className="text-green-400 font-bold">
                  {(parseFloat(amount) * (1 + selectedAsset.apy / 100)).toFixed(4)} {selectedAsset.name}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default TradingInterface
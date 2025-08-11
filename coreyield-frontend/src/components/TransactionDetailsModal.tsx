import React from 'react'
import { Transaction } from '../hooks/useTransactionHistory'

interface TransactionDetailsModalProps {
  transaction: Transaction | null
  isOpen: boolean
  onClose: () => void
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  transaction,
  isOpen,
  onClose
}) => {
  if (!isOpen || !transaction) return null

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'split': return 'text-blue-400'
      case 'deposit': return 'text-green-400'
      case 'withdraw': return 'text-yellow-400'
      case 'claim': return 'text-purple-400'
      default: return 'text-gray-400'
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'split': return '🔄'
      case 'deposit': return '📥'
      case 'withdraw': return '📤'
      case 'claim': return '💰'
      default: return '📋'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getTransactionIcon(transaction.type)}</span>
            <h3 className="text-xl font-bold text-white">Transaction Details</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Transaction Info */}
        <div className="space-y-4">
          {/* Type and Status */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Type</span>
            <span className={`font-medium ${getTransactionTypeColor(transaction.type)}`}>
              {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400">Status</span>
            <span className={`flex items-center space-x-2 ${
              transaction.status === 'success' ? 'text-green-400' : 'text-red-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                transaction.status === 'success' ? 'bg-green-400' : 'bg-red-400'
              }`} />
              <span className="font-medium capitalize">{transaction.status}</span>
            </span>
          </div>

          {/* Asset */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Asset</span>
            <span className="text-white font-medium">{transaction.asset}</span>
          </div>

          {/* Amount */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Amount</span>
            <span className="text-white font-medium text-right max-w-xs break-words">
              {transaction.amount}
            </span>
          </div>

          {/* Transaction Hash */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Transaction Hash</span>
            <span className="text-blue-400 font-mono text-sm break-all">
              {transaction.txHash}
            </span>
          </div>

          {/* Block Number */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Block Number</span>
            <span className="text-white font-mono">{transaction.blockNumber.toLocaleString()}</span>
          </div>

          {/* Timestamp */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Timestamp</span>
            <span className="text-white">
              {transaction.timestamp.toLocaleString()}
            </span>
          </div>

          {/* Details */}
          <div className="pt-4 border-t border-gray-700">
            <span className="text-gray-400 block mb-2">Details</span>
            <p className="text-white text-sm leading-relaxed">
              {transaction.details}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-700">
          <button
            onClick={() => {
              navigator.clipboard.writeText(transaction.txHash)
              // You could add a toast notification here
            }}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Copy Hash
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
} 
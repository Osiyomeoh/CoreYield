import React, { useState } from 'react'
import { TransactionCard } from '../cards/TransactionCard'

interface Transaction {
  id: string
  type: 'split' | 'deposit' | 'withdraw' | 'claim'
  asset: string
  amount: string
  timestamp: Date
  status: 'success' | 'failed'
  txHash: string
  details: string
  blockNumber: number
  user: string
}

interface TransactionsTabProps {
  transactions?: Transaction[]
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions = []
}) => {
  const [filter, setFilter] = useState<'all' | 'split' | 'deposit' | 'withdraw' | 'claim'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount'>('newest')

  // Filter and sort transactions
  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true
    return transaction.type === filter
  })

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      case 'oldest':
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      case 'amount':
        return parseFloat(b.amount) - parseFloat(a.amount)
      default:
        return 0
    }
  })

  // Get transaction type icon and color
  const getTransactionInfo = (type: string) => {
    switch (type) {
      case 'split':
        return { label: 'Split', color: 'text-blue-400', bgColor: 'bg-blue-500/20' }
      case 'deposit':
        return { label: 'Deposit', color: 'text-green-400', bgColor: 'bg-green-500/20' }
      case 'withdraw':
        return { label: 'Withdraw', color: 'text-orange-400', bgColor: 'bg-orange-500/20' }
      case 'claim':
        return { label: 'Claim', color: 'text-purple-400', bgColor: 'bg-purple-500/20' }
      default:
        return { label: 'Unknown', color: 'text-gray-400', bgColor: 'bg-gray-500/20' }
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  }

  // Calculate transaction statistics
  const transactionStats = {
    total: filteredTransactions.length,
    successful: filteredTransactions.filter(tx => tx.status === 'success').length,
    failed: filteredTransactions.filter(tx => tx.status === 'failed').length,
    totalValue: filteredTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">📋 Transaction History</h3>
        <p className="text-gray-400">
          View and track all your yield protocol transactions
        </p>
      </div>

      {/* Transaction Statistics */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
        <h4 className="text-lg font-semibold text-white mb-4">📊 Transaction Overview</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-gray-400 text-sm">Total Transactions</p>
            <p className="text-white font-bold text-xl">{transactionStats.total}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Successful</p>
            <p className="text-green-400 font-bold text-xl">{transactionStats.successful}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Pending</p>
            <p className="text-yellow-400 font-bold text-xl">0</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Total Value</p>
            <p className="text-white font-bold text-xl">{transactionStats.totalValue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        {/* Transaction Type Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-gray-400 text-sm">Filter:</span>
          {(['all', 'split', 'deposit', 'withdraw', 'claim'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filter === type
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Sort Options */}
        <div className="flex items-center space-x-2">
          <span className="text-gray-400 text-sm">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-1 text-white text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount">Highest Amount</option>
          </select>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-4">
        {sortedTransactions.length > 0 ? (
          sortedTransactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              onClick={() => {
                if (transaction.txHash) {
                  window.open(`https://scan.test.btcs.network/tx/${transaction.txHash}`, '_blank')
                }
              }}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-gray-400 text-lg mb-2">No Transactions Found</h3>
            <p className="text-gray-500 text-sm">
              {filter === 'all' 
                ? 'You haven\'t made any transactions yet. Start by wrapping some tokens!'
                : `No ${filter} transactions found. Try changing the filter.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Transaction Details Modal Placeholder */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-white mb-3">💡 Transaction Tips</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
          <div className="space-y-2">
            <h5 className="text-white font-medium">Understanding Transactions</h5>
            <ul className="space-y-1">
              <li>• <strong>Wrap:</strong> Convert assets to yield-bearing tokens</li>
              <li>• <strong>Split:</strong> Separate SY into PT and YT tokens</li>
              <li>• <strong>Claim:</strong> Collect earned yield rewards</li>
              <li>• <strong>Unwrap:</strong> Convert back to original assets</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h5 className="text-white font-medium">Transaction Status</h5>
            <ul className="space-y-1">
              <li>• <span className="text-green-400">Success:</span> Transaction completed</li>
              <li>• <span className="text-yellow-400">Pending:</span> Processing on blockchain</li>
              <li>• <span className="text-red-400">Failed:</span> Transaction reverted</li>
              <li>• Click transaction hash to view on explorer</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Export/Download Options */}
      <div className="flex justify-center">
        <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm">
          📥 Export Transaction History
        </button>
      </div>
    </div>
  )
}
import React, { useState, useMemo } from 'react'
import { useTransactionHistory } from '../../../hooks/useTransactionHistory'
import { formatDistanceToNow } from 'date-fns'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

const TransactionHistory: React.FC = () => {
  const {
    transactions,
    filters,
    setFilters,
    getFilteredTransactions,
    getTransactionStats,
    clearTransactions
  } = useTransactionHistory()

  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTransactions = useMemo(() => {
    let filtered = getFilteredTransactions()
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(tx => 
        tx.asset.toLowerCase().includes(query) ||
        tx.type.toLowerCase().includes(query) ||
        tx.hash.toLowerCase().includes(query) ||
        (tx.tokenIn && tx.tokenIn.toLowerCase().includes(query)) ||
        (tx.tokenOut && tx.tokenOut.toLowerCase().includes(query))
      )
    }
    
    return filtered
  }, [getFilteredTransactions, searchQuery])

  const stats = getTransactionStats()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />
      case 'failed':
        return <XCircleIcon className="w-5 h-5 text-red-500" />
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />
      case 'cancelled':
        return <ExclamationTriangleIcon className="w-5 h-5 text-gray-500" />
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'wrap':
        return '🔄'
      case 'split':
        return '✂️'
      case 'merge':
        return '🔗'
      case 'unwrap':
        return '🔄'
      case 'swap':
        return '🔄'
      case 'addLiquidity':
        return '💧'
      case 'removeLiquidity':
        return '💧'
      case 'stake':
        return '🔒'
      case 'unstake':
        return '🔓'
      case 'claim':
        return '💰'
      case 'mint':
        return '🪙'
      default:
        return '📝'
    }
  }

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount)
    if (isNaN(num)) return amount
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`
    return num.toFixed(4)
  }

  const handleFilterChange = (key: string, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }))
  }

  const clearAllFilters = () => {
    setFilters({})
    setSearchQuery('')
  }

  const hasActiveFilters = Object.keys(filters).length > 0 || searchQuery

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
            <p className="text-sm text-gray-500">
              {stats.total} transactions • {stats.successRate}% success rate
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FunnelIcon className="w-4 h-4 mr-2" />
              Filters
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <XMarkIcon className="w-4 h-4 mr-2" />
                Clear
              </button>
            )}
            <button
              onClick={clearTransactions}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.successful}</div>
            <div className="text-sm text-gray-500">Successful</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-gray-500">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalVolume}</div>
            <div className="text-sm text-gray-500">Volume</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="wrap">Wrap</option>
                <option value="split">Split</option>
                <option value="merge">Merge</option>
                <option value="unwrap">Unwrap</option>
                <option value="swap">Swap</option>
                <option value="addLiquidity">Add Liquidity</option>
                <option value="removeLiquidity">Remove Liquidity</option>
                <option value="stake">Stake</option>
                <option value="unstake">Unstake</option>
                <option value="claim">Claim</option>
                <option value="mint">Mint</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
              <select
                value={filters.asset || ''}
                onChange={(e) => handleFilterChange('asset', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Assets</option>
                <option value="dualCORE">dualCORE</option>
                <option value="stCORE">stCORE</option>
                <option value="lstBTC">lstBTC</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className="overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-gray-400 mb-4">
              <ArrowPathIcon className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-500">
              {hasActiveFilters 
                ? 'Try adjusting your filters or search terms'
                : 'Your transaction history will appear here'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">{getTypeIcon(transaction.type)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {transaction.type}
                        </span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">{transaction.asset}</span>
                        {transaction.tokenIn && transaction.tokenOut && (
                          <>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">
                              {transaction.tokenIn} → {transaction.tokenOut}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        {transaction.amount}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{formatDistanceToNow(transaction.timestamp, { addSuffix: true })}</span>
                        {transaction.blockNumber && (
                          <>
                            <span>•</span>
                            <span>Block {transaction.blockNumber}</span>
                          </>
                        )}
                        {transaction.gasUsed && (
                          <>
                            <span>•</span>
                            <span>{formatAmount(transaction.gasUsed)} gas</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                      {getStatusIcon(transaction.status)}
                      <span className="ml-1 capitalize">{transaction.status}</span>
                    </div>
                    
                    {transaction.hash && transaction.hash.startsWith('0x') && (
                      <button
                        onClick={() => window.open(`https://scan.test2.btcs.network/tx/${transaction.hash}`, '_blank')}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        View
                      </button>
                    )}
                  </div>
                </div>
                
                {transaction.error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="text-sm text-red-800">
                      <strong>Error:</strong> {transaction.error}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TransactionHistory

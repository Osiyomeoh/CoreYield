import React from 'react'

interface Transaction {
  id: string
  type: 'split' | 'deposit' | 'withdraw' | 'claim'
  amount: string
  asset: string
  timestamp: Date
  status: 'success' | 'failed'
  txHash: string
  details: string
  blockNumber: number
  user: string
}

interface TransactionCardProps {
  transaction: Transaction
  onClick?: () => void
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onClick
}) => {
  // Get transaction type information
  const getTransactionInfo = (type: string) => {
    switch (type) {
      case 'split':
        return { 
          icon: '✨', 
          color: 'text-purple-400',
          bgColor: 'from-purple-500/10 to-pink-500/10',
          borderColor: 'border-purple-500/20',
          label: 'Split',
          description: 'Split into PT + YT tokens'
        }
      case 'deposit':
        return { 
          icon: '💰', 
          color: 'text-blue-400', 
          bgColor: 'from-blue-500/10 to-cyan-500/10',
          borderColor: 'border-blue-500/20',
          label: 'Deposit',
          description: 'Deposited tokens for yield'
        }
      case 'withdraw':
        return { 
          icon: '🔓', 
          color: 'text-orange-400',
          bgColor: 'from-orange-500/10 to-red-500/10',
          borderColor: 'border-orange-500/20',
          label: 'Withdraw',
          description: 'Withdrew yield tokens'
        }
      case 'claim':
        return { 
          icon: '💎', 
          color: 'text-green-400',
          bgColor: 'from-green-500/10 to-emerald-500/10',
          borderColor: 'border-green-500/20',
          label: 'Claim',
          description: 'Claimed yield rewards'
        }
      default:
        return { 
          icon: '📄', 
          color: 'text-gray-400',
          bgColor: 'from-gray-500/10 to-gray-600/10',
          borderColor: 'border-gray-500/20',
          label: 'Unknown',
          description: 'Unknown transaction'
        }
    }
  }

  // Get status information
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'success':
        return { 
          color: 'text-green-400', 
          bgColor: 'bg-green-500/20',
          icon: '✅',
          label: 'Success'
        }
      case 'failed':
        return { 
          color: 'text-red-400',
          bgColor: 'bg-red-500/20',
          icon: '❌',
          label: 'Failed'
        }
      default:
        return { 
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/20',
          icon: '❓',
          label: 'Unknown'
        }
    }
  }

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
    }
  }

  // Format transaction hash
  const formatHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`
  }

  const txInfo = getTransactionInfo(transaction.type)
  const statusInfo = getStatusInfo(transaction.status)

  return (
    <div 
      className={`bg-gradient-to-r ${txInfo.bgColor} border ${txInfo.borderColor} rounded-xl p-4 transition-all duration-200 hover-lift ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
            <span className="text-lg">{txInfo.icon}</span>
          </div>
          <div>
            <h4 className={`font-semibold ${txInfo.color}`}>{txInfo.label}</h4>
            <p className="text-gray-400 text-sm">{txInfo.description}</p>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          transaction.status === 'success' 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-red-500/20 text-red-400'
        }`}>
          {transaction.status === 'success' ? '✅ Success' : '❌ Failed'}
        </div>
      </div>

      {/* Transaction Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-gray-400">Amount</p>
          <p className="text-white font-semibold">{transaction.amount} {transaction.asset}</p>
        </div>
        <div>
          <p className="text-gray-400">Time</p>
          <p className="text-white font-semibold">{formatTimestamp(transaction.timestamp)}</p>
        </div>
        <div>
          <p className="text-gray-400">Hash</p>
          <p className="text-white font-semibold">
            {transaction.txHash ? formatHash(transaction.txHash) : 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-gray-400">Details</p>
          <p className="text-white font-semibold">{transaction.details}</p>
        </div>
      </div>

      {/* Additional Details for specific transaction types */}
      {transaction.type === 'split' && (
        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Split Result:</span>
            <div className="flex items-center space-x-4">
              <span className="text-purple-400">PT: {transaction.amount}</span>
              <span className="text-green-400">YT: {transaction.amount}</span>
            </div>
          </div>
        </div>
      )}

      {transaction.type === 'claim' && (
        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Yield Claimed:</span>
            <span className="text-green-400">{transaction.amount} SY</span>
          </div>
        </div>
      )}

      {/* Action Button */}
      {transaction.txHash && (
        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <button
            onClick={(e) => {
              e.stopPropagation()
              window.open(`https://scan.test.btcs.network/tx/${transaction.txHash}`, '_blank')
            }}
            className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <span>🔗</span>
            <span>View on Explorer</span>
          </button>
        </div>
      )}
    </div>
  )
}
import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { type Address } from 'viem'

export interface Transaction {
  id: string
  hash: string
  type: 'wrap' | 'split' | 'merge' | 'unwrap' | 'swap' | 'addLiquidity' | 'removeLiquidity' | 'stake' | 'unstake' | 'claim' | 'mint'
  status: 'pending' | 'success' | 'failed' | 'cancelled'
  asset: string
  amount: string
  tokenIn?: string
  tokenOut?: string
  amountIn?: string
  amountOut?: string
  timestamp: number
  blockNumber?: number
  gasUsed?: string
  gasPrice?: string
  error?: string
  metadata?: {
    market?: string
    pool?: string
    strategy?: string
    apy?: string
    maturity?: string
  }
}

export interface TransactionFilters {
  type?: Transaction['type']
  status?: Transaction['status']
  asset?: string
  dateRange?: {
    start: number
    end: number
  }
}

export const useTransactionHistory = () => {
  // Always call useAccount at the top level (Rules of Hooks)
  const accountData = useAccount()
  const address = accountData?.address
  
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState<TransactionFilters>({})

  // Load transactions from localStorage on mount
  useEffect(() => {
    if (address) {
      loadTransactions()
    }
  }, [address])

  const loadTransactions = useCallback(() => {
    if (!address) return
    
    try {
      const stored = localStorage.getItem(`transactions_${address}`)
      if (stored) {
        setTransactions(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Failed to load transactions:', error)
    }
  }, [address])

  const saveTransactions = useCallback((newTransactions: Transaction[]) => {
    if (!address) return
    
    try {
      localStorage.setItem(`transactions_${address}`, JSON.stringify(newTransactions))
    } catch (error) {
      console.error('Failed to save transactions:', error)
    }
  }, [address])

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
    if (!address) return

    const newTransaction: Transaction = {
      ...transaction,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }

    const updatedTransactions = [newTransaction, ...transactions]
    setTransactions(updatedTransactions)
    saveTransactions(updatedTransactions)
  }, [address, transactions, saveTransactions])

  const updateTransaction = useCallback((hash: string, updates: Partial<Transaction>) => {
    const updatedTransactions = transactions.map(tx => 
      tx.hash === hash ? { ...tx, ...updates } : tx
    )
    setTransactions(updatedTransactions)
    saveTransactions(updatedTransactions)
  }, [transactions, saveTransactions])

  const removeTransaction = useCallback((id: string) => {
    const updatedTransactions = transactions.filter(tx => tx.id !== id)
    setTransactions(updatedTransactions)
    saveTransactions(updatedTransactions)
  }, [transactions, saveTransactions])

  const clearTransactions = useCallback(() => {
    setTransactions([])
    if (address) {
      localStorage.removeItem(`transactions_${address}`)
    }
  }, [address])

  const getFilteredTransactions = () => {
    return transactions.filter(tx => {
      if (filters.type && tx.type !== filters.type) return false
      if (filters.status && tx.status !== filters.status) return false
      if (filters.asset && tx.asset !== filters.asset) return false
      if (filters.dateRange) {
        if (tx.timestamp < filters.dateRange.start || tx.timestamp > filters.dateRange.end) return false
      }
      return true
    })
  }

  const getTransactionStats = () => {
    const total = transactions.length
    const successful = transactions.filter(tx => tx.status === 'success').length
    const failed = transactions.filter(tx => tx.status === 'failed').length
    const pending = transactions.filter(tx => tx.status === 'pending').length

    const totalVolume = transactions
      .filter(tx => tx.status === 'success')
      .reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0)

    return {
      total,
      successful,
      failed,
      pending,
      totalVolume: totalVolume.toFixed(2),
      successRate: total > 0 ? ((successful / total) * 100).toFixed(1) : '0'
    }
  }

  const getRecentTransactions = (limit: number = 5) => {
    return transactions.slice(0, limit)
  }

  const getTransactionsByAsset = (asset: string) => {
    return transactions.filter(tx => tx.asset === asset)
  }

  const getTransactionsByType = (type: Transaction['type']) => {
    return transactions.filter(tx => tx.type === type)
  }

  return {
    // State
    transactions,
    isLoading,
    filters,
    
    // Actions
    addTransaction,
    updateTransaction,
    removeTransaction,
    clearTransactions,
    setFilters,
    
    // Queries
    getFilteredTransactions,
    getTransactionStats,
    getRecentTransactions,
    getTransactionsByAsset,
    getTransactionsByType,
    
    // Utilities
    loadTransactions,
    saveTransactions
  }
} 
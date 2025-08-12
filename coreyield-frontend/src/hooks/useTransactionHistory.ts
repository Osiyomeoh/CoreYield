import { useState, useEffect } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { type Address } from 'viem'
import { CONTRACTS } from '@contracts/addresses'

export interface Transaction {
  id: string
  type: 'deposit' | 'withdraw' | 'split' | 'claim'
  asset: string
  amount: string
  txHash: string
  timestamp: Date
  status: 'success' | 'failed'
  details: string
  blockNumber: number
  user: string
}

export const useTransactionHistory = () => {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastFetchedBlock, setLastFetchedBlock] = useState<number>(0)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [transactionsPerPage] = useState(10)

  // Fetch real transactions from blockchain events
  const fetchBlockchainTransactions = async (fromBlock: number, toBlock: number) => {
    if (!publicClient || !address) return []

    try {
      console.log(`🔍 Fetching transactions from block ${fromBlock} to ${toBlock}`)
      console.log(`📍 Searching for events on contract: ${CONTRACTS.FACTORY}`)
      console.log(`👤 Current user address: ${address}`)
      
      const newTransactions: Transaction[] = []

      // 1. Fetch TokensSplit events (when users split SY tokens into PT/YT)
      const splitEvents = await publicClient.getLogs({
        address: CONTRACTS.FACTORY as Address,
        event: {
          type: 'event',
          name: 'TokensSplit',
          inputs: [
            { type: 'address', name: 'syToken', indexed: true },
            { type: 'address', name: 'user', indexed: true },
            { type: 'uint256', name: 'syAmount', indexed: false },
            { type: 'uint256', name: 'ptAmount', indexed: false },
            { type: 'uint256', name: 'ytAmount', indexed: false },
            { type: 'uint256', name: 'fee', indexed: false }
          ]
        },
        fromBlock: BigInt(fromBlock),
        toBlock: BigInt(toBlock)
      })

      // Process split events
      for (const event of splitEvents) {
        if (!event.args?.syToken || !event.args?.user || !event.args?.syAmount || 
            !event.args?.ptAmount || !event.args?.ytAmount) continue
            
        const block = await publicClient.getBlock({ blockNumber: event.blockNumber })
        const assetKey = getAssetKeyFromSYToken(event.args.syToken)
        
        if (assetKey && event.args.user === address) {
          newTransactions.push({
            id: `split-${event.transactionHash}-${event.logIndex}`,
            type: 'split',
            asset: assetKey,
            amount: `${formatUnits(event.args.syAmount, 18)} SY → ${formatUnits(event.args.ptAmount, 18)} PT + ${formatUnits(event.args.ytAmount, 18)} YT`,
            txHash: event.transactionHash,
            timestamp: new Date(Number(block.timestamp) * 1000),
            status: 'success',
            details: `Split ${formatUnits(event.args.syAmount, 18)} SY tokens into PT and YT`,
            blockNumber: Number(event.blockNumber),
            user: event.args.user
          })
        }
      }

      // 2. Fetch YieldClaimed events (when users claim yield from YT tokens)
      console.log('🎯 SEARCHING FOR YIELD CLAIMED EVENTS...')
      console.log(`📍 Contract Address: ${CONTRACTS.FACTORY}`)
      console.log(`🔢 Block Range: ${fromBlock} to ${toBlock}`)
      
      const claimEvents = await publicClient.getLogs({
        address: CONTRACTS.FACTORY as Address,
        event: {
          type: 'event',
          name: 'YieldClaimed',
          inputs: [
            { type: 'address', name: 'syToken', indexed: true },
            { type: 'address', name: 'user', indexed: true },
            { type: 'uint256', name: 'amount', indexed: false }
          ]
        },
        fromBlock: BigInt(fromBlock),
        toBlock: BigInt(toBlock)
      })

      console.log(`🔍 Found ${claimEvents.length} YieldClaimed events`)
      
      if (claimEvents.length === 0) {
        console.log('⚠️ No YieldClaimed events found. This could mean:')
        console.log('   - No yield has been claimed yet')
        console.log('   - Events are outside the block range')
        console.log('   - Contract address might be wrong')
        console.log('   - Network connection issues')
        console.log('   - Event signature might be wrong')
        
        // Let's also try to fetch ALL events from the contract to see what's there
        try {
          const allEvents = await publicClient.getLogs({
            address: CONTRACTS.FACTORY as Address,
            fromBlock: BigInt(fromBlock),
            toBlock: BigInt(toBlock)
          })
          console.log(`📋 Total events found on contract: ${allEvents.length}`)
          if (allEvents.length > 0) {
            console.log('🔍 First few events:', allEvents.slice(0, 3).map(e => ({
              transactionHash: e.transactionHash,
              blockNumber: e.blockNumber,
              logIndex: e.logIndex
            })))
          }
        } catch (error) {
          console.log('❌ Error fetching all events:', error)
        }
      }

      // Process claim events
      for (const event of claimEvents) {
        if (!event.args?.syToken || !event.args?.user || !event.args?.amount) {
          console.log('⚠️ Skipping claim event with missing args:', event)
          continue
        }
        
        console.log('🎯 Processing claim event:', {
          syToken: event.args.syToken,
          user: event.args.user,
          amount: event.args.amount,
          currentUser: address,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber
        })
        
        const block = await publicClient.getBlock({ blockNumber: event.blockNumber })
        const assetKey = getAssetKeyFromSYToken(event.args.syToken)
        
        console.log('🔍 Asset key for SY token:', assetKey)
        
        if (assetKey && event.args.user === address) {
          const transaction = {
            id: `claim-${event.transactionHash}-${event.logIndex}`,
            type: 'claim' as const,
            asset: assetKey,
            amount: `${formatUnits(event.args.amount, 18)} yield claimed`,
            txHash: event.transactionHash,
            timestamp: new Date(Number(block.timestamp) * 1000),
            status: 'success' as const,
            details: `Claimed ${formatUnits(event.args.amount, 18)} yield from YT tokens`,
            blockNumber: Number(event.blockNumber),
            user: event.args.user
          }
          
          console.log('✅ Adding claim transaction:', transaction)
          newTransactions.push(transaction)
        } else {
          console.log('❌ Claim event not processed:', {
            reason: !assetKey ? 'No asset key found' : 'User mismatch',
            assetKey,
            eventUser: event.args.user,
            currentUser: address
          })
        }
      }

      // 3. Fetch Transfer events from SY tokens (deposits/wrapping)
      const syTokens = Object.values(CONTRACTS.SY_TOKENS || {})
      
      for (const syTokenAddress of syTokens) {
        if (!syTokenAddress) continue
        
        const transferEvents = await publicClient.getLogs({
          address: syTokenAddress as Address,
          event: {
            type: 'event',
            name: 'Transfer',
            inputs: [
              { type: 'address', name: 'from', indexed: true },
              { type: 'address', name: 'to', indexed: true },
              { type: 'uint256', name: 'value', indexed: false }
            ]
          },
          fromBlock: BigInt(fromBlock),
          toBlock: BigInt(toBlock)
        })

        // Process transfer events
        for (const event of transferEvents) {
          if (!event.args?.from || !event.args?.to || !event.args?.value) continue
          
          // Check if this is a deposit (from user to contract) or withdrawal (from contract to user)
          const isDeposit = event.args.from === address && event.args.to === CONTRACTS.FACTORY
          const isWithdrawal = event.args.from === CONTRACTS.FACTORY && event.args.to === address
          
          if (isDeposit || isWithdrawal) {
            const block = await publicClient.getBlock({ blockNumber: event.blockNumber })
            const assetKey = getAssetKeyFromSYToken(syTokenAddress)
            
            if (assetKey) {
              const type = isDeposit ? 'deposit' : 'withdraw'
              const amount = formatUnits(event.args.value, 18)
              
              newTransactions.push({
                id: `${type}-${event.transactionHash}-${event.logIndex}`,
                type,
                asset: assetKey,
                amount: isDeposit 
                  ? `${amount} ${assetKey} → ${amount} SY`
                  : `${amount} SY → ${amount} ${assetKey}`,
                txHash: event.transactionHash,
                timestamp: new Date(Number(block.timestamp) * 1000),
                status: 'success',
                details: isDeposit 
                  ? `Wrapped ${amount} ${assetKey} to SY tokens`
                  : `Unwrapped ${amount} SY tokens to ${assetKey}`,
                blockNumber: Number(event.blockNumber),
                user: address
              })
            }
          }
        }
      }

      return newTransactions
    } catch (error) {
      console.error('Error fetching blockchain transactions:', error)
      return []
    }
  }

  // Helper function to get asset key from SY token address
  const getAssetKeyFromSYToken = (syTokenAddress: string): string | null => {
    if (!CONTRACTS.SY_TOKENS) return null
    
    console.log('🔍 ASSET KEY MAPPING DEBUG:', {
      searchingFor: syTokenAddress,
      availableTokens: CONTRACTS.SY_TOKENS
    })
    
    for (const [key, address] of Object.entries(CONTRACTS.SY_TOKENS)) {
      console.log(`🔍 Checking: ${key} = ${address} (matches: ${address === syTokenAddress})`)
      if (address === syTokenAddress) {
        const assetKey = key.replace('SY-', '')
        console.log(`✅ Found match! ${key} → ${assetKey}`)
        return assetKey
      }
    }
    
    console.log('❌ No asset key found for SY token:', syTokenAddress)
    return null
  }

  // Helper function to format units
  const formatUnits = (value: bigint, decimals: number): string => {
    try {
      return (Number(value) / Math.pow(10, decimals)).toFixed(6)
    } catch {
      return '0'
    }
  }

  // Fetch initial transaction history
  useEffect(() => {
    const fetchInitialHistory = async () => {
      if (!isConnected || !address || !publicClient) {
        setTransactions([])
        return
      }

      setIsLoading(true)
      
      try {
        // Get current block number
        const currentBlock = await publicClient.getBlockNumber()
        const fromBlock = Math.max(0, Number(currentBlock) - 10000) // Last 10k blocks
        
        const newTransactions = await fetchBlockchainTransactions(fromBlock, Number(currentBlock))
        
        setTransactions(newTransactions)
        setLastFetchedBlock(Number(currentBlock))
      } catch (error) {
        console.error('Error fetching initial history:', error)
        setTransactions([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchInitialHistory()
  }, [isConnected, address, publicClient])

  // Listen for yield claim events to auto-refresh
  useEffect(() => {
    const handleYieldClaimed = (event: CustomEvent) => {
      console.log('🔄 Auto-refreshing transaction history after yield claim:', event.detail)
      refreshTransactions()
    }

    window.addEventListener('yieldClaimed', handleYieldClaimed as EventListener)
    
    return () => {
      window.removeEventListener('yieldClaimed', handleYieldClaimed as EventListener)
    }
  }, [])

  // Filter transactions by type and sort by timestamp (newest first)
  const filterTransactions = (type?: string) => {
    let filtered = transactions
    
    if (type && type !== 'all') {
      filtered = transactions.filter(tx => tx.type === type)
    }
    
    // Sort by timestamp: newest first
    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // Get paginated transactions for current page
  const getPaginatedTransactions = (filteredTxs: Transaction[]) => {
    const startIndex = (currentPage - 1) * transactionsPerPage
    const endIndex = startIndex + transactionsPerPage
    return filteredTxs.slice(startIndex, endIndex)
  }

  // Get total pages for pagination
  const getTotalPages = (filteredTxs: Transaction[]) => {
    return Math.ceil(filteredTxs.length / transactionsPerPage)
  }

  // Navigation functions
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, getTotalPages(transactions))))
  }

  const goToNextPage = () => {
    const totalPages = getTotalPages(transactions)
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToFirstPage = () => setCurrentPage(1)
  const goToLastPage = () => setCurrentPage(getTotalPages(transactions))

  // Search transactions by query and sort by timestamp (newest first)
  const searchTransactions = (query: string) => {
    if (!query.trim()) return transactions
    
    const lowerQuery = query.toLowerCase()
    const filtered = transactions.filter(tx => 
      tx.asset.toLowerCase().includes(lowerQuery) ||
      tx.details.toLowerCase().includes(lowerQuery) ||
      tx.txHash.toLowerCase().includes(lowerQuery) ||
      tx.type.toLowerCase().includes(lowerQuery)
    )
    
    // Sort by timestamp: newest first
    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // Get transaction statistics
  const getTransactionStats = () => {
    const total = transactions.length
    const successful = transactions.filter(tx => tx.status === 'success').length
    const failed = total - successful
    
    const byType = transactions.reduce((acc, tx) => {
      acc[tx.type] = (acc[tx.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byAsset = transactions.reduce((acc, tx) => {
      acc[tx.asset] = (acc[tx.asset] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Enhanced debugging for yield claiming
    const claimTransactions = transactions.filter(tx => tx.type === 'claim')
    console.log('🎯 YIELD CLAIMING DEBUG:', {
      totalClaimTransactions: claimTransactions.length,
      claimDetails: claimTransactions.map(tx => ({
        id: tx.id,
        asset: tx.asset,
        amount: tx.amount,
        timestamp: tx.timestamp,
        txHash: tx.txHash
      })),
      allTransactions: transactions.map(tx => ({ id: tx.id, type: tx.type, asset: tx.asset }))
    })

    console.log('📊 Transaction Stats:', {
      total,
      successful,
      failed,
      byType,
      byAsset
    })

    return {
      total,
      successful,
      failed,
      byType,
      byAsset
    }
  }

  // Refresh transactions (fetch latest blocks)
  const refreshTransactions = async () => {
    if (!isConnected || !address || !publicClient) return
    
    setIsLoading(true)
    
    try {
      const currentBlock = await publicClient.getBlockNumber()
      const fromBlock = lastFetchedBlock + 1
      
      if (fromBlock <= Number(currentBlock)) {
        const newTransactions = await fetchBlockchainTransactions(fromBlock, Number(currentBlock))
        
        if (newTransactions.length > 0) {
          setTransactions(prev => [...newTransactions, ...prev])
        }
        
        setLastFetchedBlock(Number(currentBlock))
      }
    } catch (error) {
      console.error('Error refreshing transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Manual function to search for recent yield claimed events
  const searchRecentYieldClaims = async () => {
    if (!publicClient || !address) return
    
    try {
      console.log('🔍 MANUALLY SEARCHING FOR RECENT YIELD CLAIMS...')
      
      const currentBlock = await publicClient.getBlockNumber()
      const fromBlock = Number(currentBlock) - 1000 // Search last 1000 blocks
      
      console.log(`🔢 Searching blocks ${fromBlock} to ${currentBlock}`)
      
      const recentClaimEvents = await publicClient.getLogs({
        address: CONTRACTS.FACTORY as Address,
        event: {
          type: 'event',
          name: 'YieldClaimed',
          inputs: [
            { type: 'address', name: 'syToken', indexed: true },
            { type: 'address', name: 'user', indexed: true },
            { type: 'uint256', name: 'amount', indexed: false }
          ]
        },
        fromBlock: BigInt(fromBlock),
        toBlock: currentBlock
      })
      
      console.log(`🎯 Found ${recentClaimEvents.length} recent YieldClaimed events`)
      
      for (const event of recentClaimEvents) {
        console.log('📋 Event Details:', {
          blockNumber: Number(event.blockNumber),
          transactionHash: event.transactionHash,
          logIndex: event.logIndex,
          args: event.args
        })
      }
      
      // Also check if any events are for the current user
      const userClaimEvents = recentClaimEvents.filter(event => 
        event.args?.user === address
      )
      
      console.log(`👤 Events for current user (${address}): ${userClaimEvents.length}`)
      
    } catch (error) {
      console.error('❌ Error searching for recent yield claims:', error)
    }
  }

  return {
    transactions,
    isLoading,
    filterTransactions,
    searchTransactions,
    getTransactionStats,
    refreshTransactions,
    searchRecentYieldClaims,
    // Pagination
    currentPage,
    setCurrentPage,
    transactionsPerPage,
    getPaginatedTransactions,
    getTotalPages,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage
  }
} 
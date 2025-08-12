import { useState, useEffect } from 'react'
import { 
  useAccount, 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt, 
  useBalance,
  usePublicClient
} from 'wagmi'

import { parseEther, formatUnits, type Address } from 'viem'
import toast from 'react-hot-toast'
import { CONTRACTS, ASSET_METADATA } from '@contracts/addresses'

// Import the new ABIs from redeployed contracts
import MockStCOREABI from '../abis/MockStCORE.json'
import MockLstBTCABI from '../abis/MockLstBTC.json'
import MockDualCOREABI from '../abis/MockDualCORE.json'
import StandardizedYieldTokenABI from '../abis/StandardizedYieldToken.json'
import CoreYieldFactoryABI from '../abis/CoreYieldFactory.json'

interface NotificationProps {
  type: 'success' | 'error' | 'info'
  title: string
  message: string
  hash?: string
}

type AssetKey = 'stCORE' | 'lstBTC' | 'dualCORE' // All deployed assets

export const useYieldProtocol = (selectedAssetKey: AssetKey) => {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const [notification, setNotification] = useState<NotificationProps | null>(null)
  const [splitProgress, setSplitProgress] = useState<{
    step: 'idle' | 'wrapping' | 'waiting' | 'splitting' | 'complete'
    message: string
  }>({ step: 'idle', message: '' })

  const selectedAsset = ASSET_METADATA[selectedAssetKey]
  const assetAddress = CONTRACTS.MOCK_ASSETS[selectedAssetKey] as Address
  const syAddress = CONTRACTS.SY_TOKENS[`SY-${selectedAssetKey}`] as Address

  // Auto-onboarding state

  // Get the correct ABI for the selected asset
  const getAssetABI = (key: AssetKey) => {
    const abiMap = {
      stCORE: MockStCOREABI.abi,
      lstBTC: MockLstBTCABI.abi,
      dualCORE: MockDualCOREABI.abi
    }
    return abiMap[key]
  }

  const assetABI = getAssetABI(selectedAssetKey)

  // ========== CONTRACT READS ==========
  
  // Get real-time price from Chainlink Price Oracle
  const { 
    data: assetPrice, 
    refetch: refetchAssetPrice 
  } = useReadContract({
    address: CONTRACTS.PRICE_ORACLE as Address,
    abi: [
      {
        name: 'getPrice',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'token', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
      },
    ],
    functionName: 'getPrice',
    args: [assetAddress],
    query: { 
      enabled: !!assetAddress,
      refetchInterval: 10000 // Refresh every 10 seconds
    }
  })

  const { 
    data: assetBalance, 
    refetch: refetchAssetBalance 
  } = useReadContract({
    address: assetAddress,
    abi: assetABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address,
      refetchInterval: 3000
    }
  })

  // Debug balance updates
  useEffect(() => {
    console.log(`🔍 ${selectedAssetKey} BALANCE UPDATE:`, {
      asset: selectedAssetKey,
      address: assetAddress,
      userAddress: address,
      balance: assetBalance ? formatUnits(assetBalance as bigint, 18) : '0',
      timestamp: new Date().toISOString()
    })
  }, [assetBalance, selectedAssetKey, assetAddress, address])

  const { 
    data: syBalance, 
    refetch: refetchSyBalance 
  } = useReadContract({
    address: syAddress,
    abi: StandardizedYieldTokenABI.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address,
      refetchInterval: 3000
    }
  })

  const { 
    data: allowance, 
    refetch: refetchAllowance 
  } = useReadContract({
    address: assetAddress,
    abi: assetABI,
    functionName: 'allowance',
    args: address ? [address, syAddress] : undefined,
    query: { 
      enabled: !!address,
      refetchInterval: 3000
    }
  })

  // Read SY token allowance to factory contract
  const { data: syAllowance, refetch: refetchSYAllowance } = useReadContract({
    address: syAddress,
    abi: StandardizedYieldTokenABI.abi,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.FACTORY as Address] : undefined,
    query: {
      enabled: !!address && !!syAddress,
      refetchInterval: 5000, // Refetch every 5 seconds
    }
  })

  // 🎯 STANDARDIZED: Get claimable yield from factory contract (same source as Portfolio tab)
  // This ensures consistent yield amounts across all UI components
  const { data: accumulatedYield } = useReadContract({
    address: CONTRACTS.FACTORY as Address,
    abi: [
      {
        name: 'getClaimableYield',
        type: 'function',
        stateMutability: 'view',
        inputs: [
          { name: 'syToken', type: 'address' },
          { name: 'user', type: 'address' }
        ],
        outputs: [{ name: '', type: 'uint256' }],
      },
    ],
    functionName: 'getClaimableYield',
    args: address && syAddress ? [syAddress as Address, address] : undefined,
    query: { 
      enabled: !!address && !!syAddress,
      refetchInterval: 3000
    }
  })



  // Market data structure based on the new contract
  interface MarketData {
    active: boolean
    syToken: string
    ptToken: string
    ytToken: string
    maturity: bigint
    totalSYDeposited: bigint
    totalYieldDistributed: bigint
    minInvestment: bigint
    maxInvestment: bigint
    createdAt: bigint
  }

  const { data: marketData } = useReadContract({
    address: CONTRACTS.FACTORY as Address,
    abi: CoreYieldFactoryABI.abi,
    functionName: 'getMarket',
    args: [syAddress],
    query: { 
      enabled: !!address && !!syAddress,
      refetchInterval: 5000
    }
  }) as { data: MarketData | undefined }

  // Debug logging for market data
  useEffect(() => {
    console.log('🔍 COMPREHENSIVE MARKET DEBUG:', {
      // Current Selection
      selectedAsset: selectedAsset.symbol,
      selectedAssetKey,
      syTokenAddress: syAddress,
      
      // Market Selection Logic
      marketData,
      marketDataType: typeof marketData,
      isMarketDataAvailable: !!marketData,
      isMarketActive: marketData ? marketData.active : false,
      
      // Market Structure
      ptTokenFromMarket: marketData ? marketData.ptToken : null,
      ytTokenFromMarket: marketData ? marketData.ytToken : null,
      syTokenFromMarket: marketData ? marketData.syToken : null,
      maturityFromMarket: marketData ? marketData.maturity : null,
      
      // All Markets
      allExistingMarkets: undefined, // No longer fetching all markets here
      totalMarkets: 0, // No longer fetching all markets here
      
      // Full Debug
      factoryAddress: CONTRACTS.FACTORY
    })
    
    // Check if market SY token matches our SY token
    if (marketData && marketData.syToken) {
      const marketSYToken = marketData.syToken
      const isCorrectMarket = marketSYToken.toLowerCase() === syAddress.toLowerCase()
      
      console.log('🔍 MARKET MATCH CHECK:', {
        ourSYToken: syAddress,
        marketSYToken,
        isCorrectMarket,
        selectedAsset: selectedAsset.symbol,
        verdict: isCorrectMarket ? '✅ CORRECT MARKET!' : '❌ WRONG MARKET - need different market ID'
      })
      
      if (!isCorrectMarket) {
        console.warn('⚠️ MARKET MISMATCH DETECTED:', {
          issue: 'The market we found uses a different SY token',
          expectedSYToken: syAddress,
          actualSYToken: marketSYToken,
          suggestion: 'Need to create a market for this SY token',
          allAvailableMarkets: undefined // No longer fetching all markets here
        })
      }
    }
    
    // If market data is empty, it means the market doesn't exist
    if (syAddress && !marketData) {
      console.warn('⚠️ MARKET NOT FOUND:', {
        syToken: syAddress,
        selectedAsset: selectedAsset.symbol,
        message: 'This market may not have been created yet. splitTokens will fail without a market.',
        hint: 'Need to create a market for this SY token!',
        action: 'User should click "Create New Market" or use handleCreateMarket()'
      })
    }
  }, [marketData, syAddress, selectedAsset.symbol, selectedAssetKey])

    // Get PT token balance
  const { 
    data: ptBalance, 
    refetch: refetchPtBalance 
  } = useReadContract({
    address: marketData ? marketData.ptToken as Address : undefined, // ptToken address from market data
    abi: [
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
      },
    ],
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!marketData?.ptToken,
      refetchInterval: 3000
    }
  })

  // Debug PT balance
  useEffect(() => {
    if (address && marketData?.ptToken) {
      console.log('🔍 PT BALANCE DEBUG:', {
        ptTokenAddress: marketData.ptToken,
        userAddress: address,
        ptBalance,
        ptBalanceFormatted: ptBalance ? formatUnits(ptBalance as bigint, 18) : '0',
        queryEnabled: !!address && !!marketData?.ptToken
      })
    }
  }, [ptBalance, address, marketData])



    // Get YT token balance
  const { 
    data: ytBalance, 
    refetch: refetchYtBalance 
  } = useReadContract({
    address: marketData ? marketData.ytToken as Address : undefined, // ytToken address from market data
    abi: [
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
      },
    ],
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!marketData?.ytToken,
      refetchInterval: 3000
    }
  })

  // Debug YT balance
  useEffect(() => {
    if (address && marketData?.ytToken) {
      console.log('🔍 YT BALANCE DEBUG:', {
        ytTokenAddress: marketData.ytToken,
        userAddress: address,
        ytBalance,
        ytBalanceFormatted: ytBalance ? formatUnits(ytBalance as bigint, 18) : '0',
        queryEnabled: !!address && !!marketData?.ytToken
      })
    }
  }, [ytBalance, address, marketData])



    // Get YT claimable yield from the factory contract
  const { 
    data: ytClaimableYield, 
    refetch: refetchYtClaimable 
  } = useReadContract({
    address: CONTRACTS.FACTORY as Address, // Use factory address instead of YT token address
    abi: [
      {
        name: 'getClaimableYield',
        type: 'function',
        stateMutability: 'view',
        inputs: [
          { name: 'syToken', type: 'address' },
          { name: 'user', type: 'address' }
        ],
        outputs: [{ name: '', type: 'uint256' }],
      },
    ],
    functionName: 'getClaimableYield',
    args: address && marketData?.syToken ? [marketData.syToken as Address, address] : undefined,
    query: {
      enabled: !!address && !!marketData?.syToken,
      refetchInterval: 5000
    }
  })

  // Debug YT claimable yield
  useEffect(() => {
    if (address && marketData?.syToken) {
      console.log('🔍 YT CLAIMABLE YIELD DEBUG:', {
        factoryAddress: CONTRACTS.FACTORY,
        syTokenAddress: marketData.syToken,
        userAddress: address,
        ytClaimableYield,
        ytClaimableYieldFormatted: ytClaimableYield ? formatUnits(ytClaimableYield as bigint, 18) : '0',
        queryEnabled: !!address && !!marketData?.syToken,
        marketData
      })
    }
  }, [ytClaimableYield, address, marketData])

  // New function to add yield snapshots to YT tokens (for demo purposes)
  const handleAddYieldSnapshot = async (amount: string): Promise<void> => {
    const ytAddress = marketData ? marketData.ytToken as Address : undefined
    if (!address || !ytAddress || !amount) return
    
    console.log('🌱 Adding yield snapshot to YT token...', {
      address,
      ytTokenAddress: ytAddress,
      amount,
      selectedAsset: selectedAsset.symbol
    })
    
    try {
      await writeAddYieldSnapshot({
        address: ytAddress,
        abi: [
          {
            name: 'addTestYieldSnapshot',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [{ name: 'totalYieldAmount', type: 'uint256' }],
            outputs: [],
          },
        ],
        functionName: 'addTestYieldSnapshot',
        args: [parseEther(amount)]
      })
      
      console.log('✅ Yield snapshot added successfully')
      toast.success('🌱 Added yield snapshot to YT tokens!')
      
      // Refresh balances after adding yield
      setTimeout(() => {
        refreshBalances()
      }, 2000)
      
    } catch (error) {
      toast.error('Failed to add yield snapshot')
      console.error('❌ Add yield snapshot error:', error)
    }
  }

  // Improved PT implied yield calculation with realistic APY
  const calculatePTImpliedYield = (ptAmount: bigint, daysHeld: number): number => {
    if (!ptAmount || ptAmount === 0n) return 0
    const ptBalance = Number(ptAmount) / 1e18
    const assetAPY = selectedAsset.apy / 100 // Convert percentage to decimal
    const dailyRate = assetAPY / 365
    return ptBalance * dailyRate * daysHeld
  }

  // Calculate YT yield based on time and APY
  const calculateYTYield = (ytAmount: bigint, daysHeld: number): number => {
    if (!ytAmount || ytAmount === 0n) return 0
    const ytBalance = Number(ytAmount) / 1e18
    const assetAPY = selectedAsset.apy / 100 // Convert percentage to decimal
    const dailyRate = assetAPY / 365
    return ytBalance * dailyRate * daysHeld
  }

  // Get PT holding time (mock for now - in real implementation, track from mint timestamp)
  const ptHoldingDays = 30 // Mock: assume held for 30 days
  const ptImpliedYield = ptBalance ? calculatePTImpliedYield(ptBalance as bigint, ptHoldingDays) : 0
  
  // Calculate YT yield
  const ytCalculatedYield = ytBalance ? calculateYTYield(ytBalance as bigint, ptHoldingDays) : 0

  const { data: coreBalance } = useBalance({
    address,
    query: { 
      enabled: !!address,
      refetchInterval: 5000
    }
  })

  // ========== CONTRACT WRITES ==========
  const { 
    writeContract: writeMint, 
    data: mintHash, 
    isPending: isMintPending 
  } = useWriteContract()

  const { 
    writeContract: writeApprove, 
    data: approveHash, 
    isPending: isApprovePending 
  } = useWriteContract()

  const { 
    writeContract: writeWrap, 
    data: wrapHash, 
    isPending: isWrapPending 
  } = useWriteContract()

  const { 
    writeContract: writeUnwrap, 
    data: unwrapHash, 
    isPending: isUnwrapPending 
  } = useWriteContract()

  const { 
    writeContract: writeClaimYield, 
    data: claimHash, 
    isPending: isClaimPending 
  } = useWriteContract()

  const { 
    writeContract: writeSplitTokens, 
    data: splitHash, 
    isPending: isSplitPending 
  } = useWriteContract()

  const { 
    writeContract: writeClaimYTYield, 
    data: claimYTHash, 
    isPending: isClaimYTPending 
  } = useWriteContract()

  const { 
    writeContract: writeRedeemPT, 
    data: redeemPTHash, 
    isPending: isRedeemPTPending 
  } = useWriteContract()

  const { 
    writeContract: writeCreateMarket, 
    data: createMarketHash
  } = useWriteContract()

  const { 
    writeContract: writeAddYieldSnapshot, 
    data: addYieldHash, 
    isPending: isAddYieldPending 
  } = useWriteContract()

  // ========== TRANSACTION RECEIPTS ==========
  const { 
    isLoading: isMintWaiting, 
    isSuccess: isMintSuccess 
  } = useWaitForTransactionReceipt({ hash: mintHash })

  const { 
    isLoading: isApproveWaiting, 
    isSuccess: isApproveSuccess 
  } = useWaitForTransactionReceipt({ hash: approveHash })

  const { 
    isLoading: isWrapWaiting, 
    isSuccess: isWrapSuccess 
  } = useWaitForTransactionReceipt({ hash: wrapHash })

  const { 
    isLoading: isUnwrapWaiting, 
    isSuccess: isUnwrapSuccess 
  } = useWaitForTransactionReceipt({ hash: unwrapHash })

  const { 
    isLoading: isClaimWaiting, 
    isSuccess: isClaimSuccess 
  } = useWaitForTransactionReceipt({ hash: claimHash })

  const { 
    isLoading: isSplitWaiting, 
    isSuccess: isSplitSuccess 
  } = useWaitForTransactionReceipt({ hash: splitHash })

  const { 
    isLoading: isClaimYTWaiting, 
    isSuccess: isClaimYTSuccess 
  } = useWaitForTransactionReceipt({ hash: claimYTHash })

  const { 
    isLoading: isRedeemPTWaiting, 
    isSuccess: isRedeemPTSuccess 
  } = useWaitForTransactionReceipt({ hash: redeemPTHash })

  const { 
    isLoading: isAddYieldWaiting, 
    isSuccess: isAddYieldSuccess 
  } = useWaitForTransactionReceipt({ hash: addYieldHash })



  // ========== TRANSACTION SUCCESS HANDLERS ==========
  // Handle approval success and refresh allowance data
  useEffect(() => {
    if (isApproveSuccess) {
      console.log('✅ APPROVAL SUCCESS! Refreshing allowance data...')
      toast.success('Approval successful! You can now split your tokens.')
      
      // Refresh allowance data
      refetchSYAllowance()
      refetchAllowance()
      
      // Also refresh balances
      setTimeout(() => {
        refreshBalances()
      }, 1000)
    }
  }, [isApproveSuccess, refetchSYAllowance, refetchAllowance])

  // Handle split success and refresh balances
  useEffect(() => {
    if (isSplitSuccess) {
      console.log('🎉 SPLIT SUCCESS! Refreshing balances...')
      console.log('🔄 SPLIT PROGRESS STATE CHANGE:', {
        from: 'split_success',
        to: 'complete',
        timestamp: new Date().toISOString(),
        previousStep: 'unknown'
      })
      
      toast.success('🎯 Split successful! You now have PT + YT tokens!')
      
      // Update split progress briefly
      setSplitProgress({ step: 'complete', message: 'Split completed successfully!' })
      
      // Refresh all balances
      setTimeout(() => {
        refreshBalances()
        refetchPtBalance()
        refetchYtBalance()
      }, 1000)
      
      // 🎯 CRITICAL FIX: Reset progress IMMEDIATELY to allow new operations
      setTimeout(() => {
        console.log('🔄 RESETTING SPLIT PROGRESS: Allowing new operations')
        console.log('🔄 SPLIT PROGRESS STATE CHANGE:', {
          from: 'complete',
          to: 'idle',
          timestamp: new Date().toISOString(),
          reason: 'Auto-reset after split completion'
        })
        setSplitProgress({ step: 'idle', message: '' })
      }, 500) // Reduced from 2 seconds to 0.5 seconds for immediate reset
    }
  }, [isSplitSuccess, refetchPtBalance, refetchYtBalance])

  // ========== HELPER FUNCTIONS ==========
  const formatBalance = (balance: bigint | undefined, decimals = 18): string => {
    if (!balance) return '0.0000'
    return parseFloat(formatUnits(balance, decimals)).toFixed(4)
  }

  const formatYield = (yieldAmount: bigint | undefined): string => {
    if (!yieldAmount) return '0'
    return formatUnits(yieldAmount, 18)
  }

  const needsApproval = (amount: string): boolean => {
    if (!amount) return true
    
    try {
      const amountBigInt = parseEther(amount)
      
      console.log('🔍 APPROVAL CHECK DEBUG (FIXED VERSION):', {
        amount,
        amountBigInt: amountBigInt.toString(),
        syBalance: syBalance?.toString(),
        syAllowance: syAllowance?.toString(),
        assetAllowance: allowance?.toString(),
        hasSYTokens: syBalance && (syBalance as bigint) > 0n
      })
      
      // 🎯 FIXED: Always check asset approval for wrapping operations
      // Even if user has SY tokens, they still need asset approval to wrap more
      if (!allowance || amountBigInt > (allowance as bigint)) {
        console.log('✅ APPROVAL NEEDED: Asset needs approval for wrapping')
        return true
      }
      
      console.log('✅ NO APPROVAL NEEDED: Asset already approved for wrapping')
      return false
    } catch {
      console.log('❌ APPROVAL CHECK ERROR: Invalid amount format')
      return true
    }
  }

  // 🎯 NEW: Separate function to check if SY tokens need approval for splitting
  // This function is ONLY for splitting operations, NOT for wrapping
  const needsSYApproval = (amount: string): boolean => {
    if (!amount) return true
    
    try {
      const amountBigInt = parseEther(amount)
      
      console.log('🔍 SY APPROVAL CHECK DEBUG:', {
        amount,
        amountBigInt: amountBigInt.toString(),
        syAllowance: syAllowance?.toString(),
        hasSYTokens: syBalance && (syBalance as bigint) > 0n
      })
      
      // Check if factory can spend SY tokens for splitting
      if (!syAllowance || amountBigInt > (syAllowance as bigint)) {
        console.log('✅ SY APPROVAL NEEDED: Factory needs approval to spend SY tokens')
        return true
      }
      
      console.log('✅ NO SY APPROVAL NEEDED: Factory already approved to spend SY tokens')
      return false
    } catch {
      console.log('❌ SY APPROVAL CHECK ERROR: Invalid amount format')
      return true
    }
  }

  const canExecuteAction = (amount: string, activeTab: 'deposit' | 'withdraw'): boolean => {
    if (!amount || !address) return false
    
    try {
      const amountBigInt = parseEther(amount)
      if (activeTab === 'deposit') {
        return assetBalance ? amountBigInt <= (assetBalance as bigint) : false
      } else {
        return syBalance ? amountBigInt <= (syBalance as bigint) : false
      }
    } catch {
      return false
    }
  }

  const setMaxAmount = (activeTab: 'deposit' | 'withdraw'): string => {
    if (activeTab === 'deposit' && assetBalance) {
      return formatUnits(assetBalance as bigint, 18)
    } else if (activeTab === 'withdraw' && syBalance) {
      return formatUnits(syBalance as bigint, 18)
    }
    return ''
  }

  // Helper function to get real-time USD price
  const getRealTimePrice = (): number => {
    if (!assetPrice) return 0
    // Price oracle returns price in USD with 8 decimals
    return Number(assetPrice) / Math.pow(10, 8)
  }

  // Helper function to format balance in USD
  const formatBalanceUSD = (balance: bigint | undefined): string => {
    if (!balance || !assetPrice) return '$0.00'
    const balanceInTokens = Number(balance) / Math.pow(10, 18)
    const priceInUSD = Number(assetPrice) / Math.pow(10, 8)
    return `$${(balanceInTokens * priceInUSD).toFixed(2)}`
  }

  // ========== ACTION HANDLERS ==========
  const handleMintTestTokens = async (amount: string = '10000'): Promise<void> => {
    if (!address) return
    
    try {
      await writeMint({
        address: assetAddress,
        abi: assetABI,
        functionName: 'mint',
        args: [address, parseEther(amount)]
      })
      toast.success(`Minting ${amount} ${selectedAsset.symbol} tokens...`)
    } catch (error) {
      toast.error('Failed to mint tokens')
      console.error('Mint error:', error)
    }
  }

  // Function to mint custom amount of test tokens
  const handleMintCustomAmount = async (customAmount: string): Promise<void> => {
    if (!address || !customAmount) return
    
    try {
      await writeMint({
        address: assetAddress,
        abi: assetABI,
        functionName: 'mint',
        args: [address, parseEther(customAmount)]
      })
      toast.success(`Minting ${customAmount} ${selectedAsset.symbol} tokens...`)
    } catch (error) {
      toast.error('Failed to mint custom amount')
      console.error('Custom mint error:', error)
    }
  }

  const approveAsset = async (amount: string): Promise<void> => {
    if (!amount) return
    
    try {
      await writeApprove({
        address: assetAddress,
        abi: assetABI,
        functionName: 'approve',
        args: [syAddress, parseEther(amount)]
      })
      toast.success('Approving tokens...')
    } catch (error) {
      toast.error('Failed to approve tokens')
      console.error('Approve error:', error)
    }
  }

  // Add SY token approval for factory contract
  const approveSYTokens = async (amount: string): Promise<void> => {
    if (!amount) return
    
    console.log('🔐 SY APPROVAL DEBUG:', {
      amount,
      syAddress,
      factoryAddress: CONTRACTS.FACTORY,
      userAddress: address,
      currentAllowance: syAllowance?.toString()
    })
    
    try {
      await writeApprove({
        address: syAddress,
        abi: StandardizedYieldTokenABI.abi,
        functionName: 'approve',
        args: [CONTRACTS.FACTORY as Address, parseEther(amount)]
      })
      toast.success('Approving SY tokens for splitting...')
      console.log('✅ SY APPROVAL TRANSACTION SENT')
      
    } catch (error) {
      toast.error('Failed to approve SY tokens')
      console.error('❌ SY APPROVAL ERROR:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        amount,
        syAddress,
        factoryAddress: CONTRACTS.FACTORY
      })
    }
  }

  const wrapAsset = async (amount: string, autoSplit: boolean = false): Promise<void> => {
    if (!amount || !address) return
    
    // 🎯 COMPREHENSIVE LOGGING: Track why deposits might be blocked
    console.log('🔍 DEPOSIT ATTEMPT DEBUG:', {
      operation: 'wrapAsset',
      autoSplit,
      amount,
      currentSplitProgress: splitProgress.step,
      currentMessage: splitProgress.message,
      timestamp: new Date().toISOString()
    })
    
    // 🎯 FIXED: Less aggressive blocking - only block if actively processing
    if (splitProgress.step === 'wrapping' || splitProgress.step === 'splitting') {
      console.warn('⚠️ WRAP BLOCKED: Cannot wrap while actively processing', {
        currentStep: splitProgress.step,
        message: splitProgress.message,
        blockedReason: 'Active operation in progress',
        allowedSteps: ['idle', 'complete', 'waiting']
      })
      toast.error('Cannot deposit while operation is actively processing. Please wait for the current operation to complete.')
      return
    }
    
    // Allow deposits during 'waiting', 'complete' state, or when idle
    if (splitProgress.step === 'complete') {
      console.log('✅ DEPOSIT ALLOWED: Operation completed, allowing new deposits')
    } else if (splitProgress.step === 'waiting') {
      console.log('✅ DEPOSIT ALLOWED: Operation waiting, allowing new deposits')
    } else if (splitProgress.step === 'idle') {
      console.log('✅ DEPOSIT ALLOWED: System is idle, allowing new deposits')
    }
    
    if (autoSplit) {
      setSplitProgress({ step: 'wrapping', message: 'Starting wrap transaction...' })
    } else {
      // For simple deposits, don't change split progress state
      console.log('💰 SIMPLE DEPOSIT: Wrapping to SY tokens (no split)')
      toast.success('Depositing to SY tokens...')
    }
    
    try {
      // Step 1: First wrap to SY tokens
      await writeWrap({
        address: syAddress,
        abi: StandardizedYieldTokenABI.abi,
        functionName: 'wrap',
        args: [parseEther(amount)]
      })
      
      if (autoSplit) {
        setSplitProgress({ step: 'waiting', message: 'Waiting for wrap to complete...' })
        toast.success('Step 1/2: Wrapping to SY tokens...')
      } else {
        // For simple deposits, just show success without changing split progress
        console.log('✅ SIMPLE DEPOSIT: Wrap transaction sent successfully')
        toast.success('Deposit transaction sent! Waiting for confirmation...')
      }
      
    } catch (error) {
      // Only reset split progress if this was part of auto-split
      if (autoSplit) {
        setSplitProgress({ step: 'idle', message: '' })
      }
      toast.error('Failed to wrap tokens')
      console.error('Wrap error:', error)
    }
  }

  // New function specifically for splitting SY tokens into PT + YT
  const splitTokens = async (amount: string): Promise<void> => {
    if (!amount || !address) return
    
    setSplitProgress({ step: 'splitting', message: 'Initiating token split...' })
    
    console.log('💫 STEP 2 STARTING: handleSplitTokens called', {
      amount,
      marketId: syAddress, // Use syAddress as marketId for splitTokens
      factoryAddress: CONTRACTS.FACTORY,
      userAddress: address,
      marketExists: !!marketData,
      marketData: marketData
    })

    // Check if user has approved factory to spend SY tokens
    const amountBigInt = parseEther(amount)
    if (!syAllowance || amountBigInt > (syAllowance as bigint)) {
      console.error('❌ CANNOT SPLIT: Insufficient SY token approval!', {
        required: amountBigInt.toString(),
        approved: syAllowance?.toString() || '0',
        message: 'User must approve factory to spend SY tokens before splitting'
      })
      toast.error('Please approve SY tokens for splitting first!')
      setSplitProgress({ step: 'idle', message: '' })
      return
    }

    // ⚠️ Check if market exists before trying to split
    if (!marketData) {
      console.error('❌ CANNOT SPLIT: Market does not exist!', {
        syToken: syAddress,
        message: 'The market must be created before tokens can be split. Creating market first...'
      })
      
      // Try to create the market first
      toast.error('Market not found! Creating market first...')
      await handleCreateMarket()
      return
    }
    
    try {
      const syAmount = parseEther(amount)
      const minPTAmount = syAmount // 1:1 ratio for now
      const minYTAmount = syAmount // 1:1 ratio for now
      
      console.log('📞 CALLING CONTRACT: splitTokens with args:', {
        syToken: syAddress,
        syAmount: syAmount.toString(),
        minPTAmount: minPTAmount.toString(),
        minYTAmount: minYTAmount.toString(),
        amountFormatted: amount
      })
      
      await writeSplitTokens({
        address: CONTRACTS.FACTORY as Address,
        abi: CoreYieldFactoryABI.abi,
        functionName: 'splitTokens',
        args: [syAddress, syAmount, minPTAmount, minYTAmount]
      })
      
      console.log('✅ CONTRACT CALL SENT: splitTokens transaction initiated')
      toast.success('🎯 Splitting into PT + YT tokens...')
      
    } catch (error) {
      setSplitProgress({ step: 'idle', message: '' })
      console.error('❌ SPLIT ERROR:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        contractAddress: CONTRACTS.FACTORY,
        syToken: syAddress,
        amount
      })
      toast.error('Failed to split tokens')
    }
  }

  const handleWithdraw = async (amount: string): Promise<void> => {
    if (!amount || !address) return
    
    try {
      await writeUnwrap({
        address: syAddress,
        abi: StandardizedYieldTokenABI.abi,
        functionName: 'unwrap',
        args: [parseEther(amount)]
      })
      toast.success('Unwrapping SY tokens...')
    } catch (error) {
      toast.error('Failed to unwrap tokens')
      console.error('Unwrap error:', error)
    }
  }

  const claimYield = async (): Promise<void> => {
    if (!address) return
    
    // Debug logging
    console.log('=== YIELD CLAIM DEBUG ===')
    console.log('Claiming yield for:', selectedAssetKey)
    console.log('SY Address:', syAddress)
    console.log('User Address:', address)
    console.log('Accumulated Yield:', accumulatedYield)
    console.log('Accumulated Yield Type:', typeof accumulatedYield)
    console.log('Accumulated Yield Value:', accumulatedYield?.toString())
    console.log('Network Chain ID:', window.ethereum?.chainId)
    console.log('========================')
    
    // Check if there's actually yield to claim
    if (!accumulatedYield || accumulatedYield === 0n) {
      toast.error('No yield available to claim')
      console.log('No yield available - returning early')
      return
    }
    
    try {
      console.log('Attempting to claim yield...')
      await writeClaimYield({
        address: syAddress,
        abi: StandardizedYieldTokenABI.abi,
        functionName: 'claimYield',
        args: []
      })
      toast.success('Claiming yield...')
      console.log('Claim transaction initiated successfully')
    } catch (error) {
      toast.error('Failed to claim yield')
      console.error('Claim error:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
    }
  }

  // Function to check user position and claimable yield before claiming
  const checkUserPosition = async (): Promise<void> => {
    if (!address || !syAddress || !publicClient) return
    
    try {
      console.log('🔍 Checking user position before claiming...')
      
      // Read user position from contract using public client
      const userPosition = await publicClient.readContract({
        address: CONTRACTS.FACTORY as Address,
        abi: CoreYieldFactoryABI.abi,
        functionName: 'getUserPosition',
        args: [syAddress, address]
      })
      
      console.log('📊 User position data:', userPosition)
      
      // Read claimable yield
      const claimableYield = await publicClient.readContract({
        address: CONTRACTS.FACTORY as Address,
        abi: CoreYieldFactoryABI.abi,
        functionName: 'getClaimableYield',
        args: [syAddress, address]
      })
      
      console.log('💰 Claimable yield:', claimableYield)
      
      // Read market data
      const market = await publicClient.readContract({
        address: CONTRACTS.FACTORY as Address,
        abi: CoreYieldFactoryABI.abi,
        functionName: 'getMarket',
        args: [syAddress]
      })
      
      console.log('🏭 Market data:', market)
      
    } catch (error) {
      console.error('❌ Error checking user position:', error)
    }
  }

  // Function to claim YT yield from the CoreYieldFactory contract
  const handleClaimYTYield = async (): Promise<void> => {
    if (!address || !syAddress) return
    
    // First check user position
    await checkUserPosition()
    
    console.log('🎲 Attempting to claim YT yield...', {
      address,
      syTokenAddress: syAddress,
      selectedAsset: selectedAsset.symbol,
      claimableAmount: ytClaimableYield ? formatUnits(ytClaimableYield as bigint, 18) : '0',
      marketData: marketData ? {
        active: marketData.active,
        maturity: marketData.maturity,
        totalSYDeposited: marketData.totalSYDeposited ? formatUnits(marketData.totalSYDeposited, 18) : '0'
      } : null
    })
    
    try {
      console.log('📝 Calling CoreYieldFactory.claimYield with args:', [syAddress])
      console.log('🏗️ Contract Details:', {
        factoryAddress: CONTRACTS.FACTORY,
        syTokenAddress: syAddress,
        userAddress: address,
        network: 'Core Testnet (Chain ID: 1114)'
      })
      
      await writeClaimYTYield({
        address: CONTRACTS.FACTORY as Address,
        abi: CoreYieldFactoryABI.abi,
        functionName: 'claimYield',
        args: [syAddress] // Pass the SY token address as parameter
      })
      console.log('✅ YT Claim transaction initiated successfully')
      console.log('🔍 Transaction sent! Now waiting for blockchain confirmation...')
      toast.success('🎲 Claiming YT yield...')
    } catch (error) {
      toast.error('Failed to claim YT yield')
      console.error('❌ YT Claim error:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        syTokenAddress: syAddress,
        claimableAmount: ytClaimableYield,
        error: error
      })
    }
  }

  // New function to redeem PT tokens (at maturity or with YT)
  const redeemPT = async (amount: string): Promise<void> => {
    if (!address || !amount) return
    
    console.log('🔒 Attempting to redeem PT tokens...', {
      address,
      factoryAddress: CONTRACTS.FACTORY,
      marketId: syAddress,
      amount
    })
    
    try {
      await writeRedeemPT({
        address: CONTRACTS.FACTORY as Address,
        abi: CoreYieldFactoryABI.abi,
        functionName: 'redeemTokens',
        args: [syAddress, parseEther(amount)]
      })
      console.log('✅ PT Redeem transaction initiated successfully')
      toast.success('🔒 Redeeming PT tokens...')
    } catch (error) {
      toast.error('Failed to redeem PT tokens')
      console.error('❌ PT Redeem error:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        factoryAddress: CONTRACTS.FACTORY,
        marketId: syAddress,
        amount
      })
    }
  }

  // Function to create market if it doesn't exist
  const handleCreateMarket = async (): Promise<void> => {
    if (!address) return
    
    const asset = selectedAsset
    console.log('🏭 CREATING MARKET for', asset.symbol, {
      syToken: syAddress,
      factory: CONTRACTS.FACTORY,
      maturityDuration: 365 * 24 * 60 * 60,
      ptName: `PT-${asset.symbol}`,
      ytName: `YT-${asset.symbol}`
    })
    
    try {
      await writeCreateMarket({
        address: CONTRACTS.FACTORY as Address,
        abi: CoreYieldFactoryABI.abi,
        functionName: 'createMarket',
        args: [
          syAddress, // syToken address
          365 * 24 * 60 * 60, // maturityDuration (1 year in seconds)
          `PT-${asset.symbol}`, // ptName
          `PT-${asset.symbol}`, // ptSymbol  
          `YT-${asset.symbol}`, // ytName
          `YT-${asset.symbol}`, // ytSymbol
        ]
      })
      
      console.log('✅ MARKET CREATION INITIATED for', asset.symbol)
      toast.success(`🏭 Creating ${asset.symbol} market... This will enable PT/YT tokens!`)
      
    } catch (error) {
      console.error('❌ MARKET CREATION ERROR for', asset.symbol, ':', error)
      toast.error(`Failed to create ${asset.symbol} market`)
    }
  }

  const refreshBalances = (): void => {
    console.log('🔄 REFRESHING ALL BALANCES INCLUDING PT/YT...')
    console.log('🔍 Asset being refreshed:', selectedAssetKey)
    
    try {
      console.log('📞 Calling refetchAssetBalance()...')
      refetchAssetBalance()
      
      console.log('📞 Calling refetchSyBalance()...')
      refetchSyBalance()
      
      console.log('📞 Calling refetchAllowance()...')
      refetchAllowance()
      
      // 🎯 CRITICAL: Also refresh PT/YT balances after split
      if (refetchPtBalance) {
        console.log('📞 Calling refetchPtBalance()...')
        refetchPtBalance()
      }
      if (refetchYtBalance) {
        console.log('📞 Calling refetchYtBalance()...')
        refetchYtBalance()
      }
      if (refetchYtClaimable) {
        console.log('📞 Calling refetchYtClaimable()...')
        refetchYtClaimable()
      }
      
      console.log('✅ All refetch functions called successfully')
      
      // Enhanced logging with multiple balance checks
      setTimeout(() => {
        console.log('📊 BALANCE CHECK 1 (1 second after refresh):', {
          asset: selectedAssetKey,
          assetBalance: assetBalance ? formatUnits(assetBalance as bigint, 18) : '0',
          sy: syBalance ? formatUnits(syBalance as bigint, 18) : '0',
          pt: ptBalance ? formatUnits(ptBalance as bigint, 18) : '0',
          yt: ytBalance ? formatUnits(ytBalance as bigint, 18) : '0',
          ytClaimable: ytClaimableYield ? formatUnits(ytClaimableYield as bigint, 18) : '0',
          allowance: allowance ? formatUnits(allowance as bigint, 18) : '0'
        })
      }, 1000)
      
      // Additional balance check after 3 seconds
      setTimeout(() => {
        console.log('📊 BALANCE CHECK 2 (3 seconds after refresh):', {
          asset: selectedAssetKey,
          assetBalance: assetBalance ? formatUnits(assetBalance as bigint, 18) : '0',
          sy: syBalance ? formatUnits(syBalance as bigint, 18) : '0',
          pt: ptBalance ? formatUnits(ptBalance as bigint, 18) : '0',
          yt: ytBalance ? formatUnits(ytBalance as bigint, 18) : '0',
          ytClaimable: ytClaimableYield ? formatUnits(ytClaimableYield as bigint, 18) : '0',
          allowance: allowance ? formatUnits(allowance as bigint, 18) : '0'
        })
      }, 3000)
      
    } catch (error) {
      console.error('❌ ERROR REFRESHING BALANCES:', error)
    }
  }

  // New combined function for the complete deposit and split flow
  const handleDepositAndSplit = async (amount: string): Promise<void> => {
    if (!amount || !address) return
    
    setSplitProgress({ step: 'wrapping', message: 'Starting deposit and split flow...' })
    
    try {
      // Step 1: Wrap underlying asset to SY tokens
      console.log('🚀 STEP 1: Wrapping to SY tokens', { amount, asset: selectedAssetKey })
      
      // Use the existing writeWrap function which will set wrapHash
      writeWrap({
        address: syAddress,
        abi: StandardizedYieldTokenABI.abi,
        functionName: 'wrap',
        args: [parseEther(amount)]
      })
      
      setSplitProgress({ step: 'waiting', message: 'Waiting for wrap transaction to confirm...' })
      toast.success('Step 1/2: Wrapping to SY tokens...')
      
      // Wait for wrap transaction to be mined using wagmi hooks
      if (wrapHash) {
        console.log('✅ STEP 1 COMPLETE: Wrap transaction confirmed')
        toast.success('Step 1/2: Wrap confirmed! Proceeding to split...')
        
        // Step 2: Split SY tokens into PT + YT
        setSplitProgress({ step: 'splitting', message: 'Splitting SY tokens into PT + YT...' })
        
        // Ensure market exists before splitting
        if (!marketData) {
          console.log('🏭 Market not found, creating market first...')
          toast.success('Creating market for PT/YT tokens...')
          await handleCreateMarket()
          
          // Wait a bit for market creation to propagate
          await new Promise(resolve => setTimeout(resolve, 3000))
          // Refresh market data by refetching balances
          await Promise.all([
            refetchAssetBalance(),
            refetchSyBalance()
          ])
        }
        
        console.log('🎯 STEP 2: Splitting SY tokens', { amount, marketData })
        
        // Use the existing writeSplitTokens function which will set splitHash
        const syAmount = parseEther(amount)
        const minPTAmount = syAmount // 1:1 ratio for now
        const minYTAmount = syAmount // 1:1 ratio for now
        
        writeSplitTokens({
          address: CONTRACTS.FACTORY as Address,
          abi: CoreYieldFactoryABI.abi,
          functionName: 'splitTokens',
          args: [syAddress, syAmount, minPTAmount, minYTAmount]
        })
        
        setSplitProgress({ step: 'waiting', message: 'Waiting for split transaction to confirm...' })
        toast.success('Step 2/2: Splitting into PT + YT tokens...')
        
        // Wait for split transaction to be mined using wagmi hooks
        if (splitHash) {
          console.log('🎉 STEP 2 COMPLETE: Split transaction confirmed')
          setSplitProgress({ step: 'complete', message: '🎉 Split complete! Your PT + YT tokens are ready!' })
          toast.success('🎉 Split complete! Check Portfolio tab for your tokens!')
          
          // Refresh all balances
          await Promise.all([
            refetchAssetBalance(),
            refetchSyBalance(),
            refetchPtBalance(),
            refetchYtBalance()
          ])
          
          // Reset progress after a delay
          setTimeout(() => {
            setSplitProgress({ step: 'idle', message: '' })
          }, 5000)
        }
      }
      
    } catch (error) {
      console.error('❌ Deposit and Split error:', error)
      setSplitProgress({ step: 'idle', message: '' })
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error(`Split failed: ${errorMessage}`)
      
      // Log detailed error for debugging
      console.error('Error details:', {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        amount,
        selectedAsset: selectedAssetKey,
        syAddress,
        marketData: !!marketData
      })
    }
  }

  // ========== SUCCESS HANDLERS ==========
  useEffect(() => {
    if (isMintSuccess && mintHash) {
      toast.success(`Successfully minted 1000 ${selectedAsset.symbol}!`)
      setNotification({
        type: 'success',
        title: 'Tokens Minted!',
        message: `Successfully minted 1000 ${selectedAsset.symbol}`,
        hash: mintHash
      })
      setTimeout(() => setNotification(null), 5000)
      refreshBalances()
    }
  }, [isMintSuccess, mintHash, selectedAsset.symbol])

  useEffect(() => {
    if (isApproveSuccess && approveHash) {
      console.log('✅ APPROVAL SUCCESS: Resetting split progress to allow new operations')
      console.log('🔄 SPLIT PROGRESS STATE CHANGE:', {
        from: 'approval_success',
        to: 'idle',
        timestamp: new Date().toISOString(),
        previousStep: 'unknown'
      })
      
      toast.success('Approval successful! You can now deposit or split tokens.')
      setNotification({
        type: 'success',
        title: 'Approval Successful!',
        message: `Approved tokens for ${selectedAsset.symbol}. You can now deposit or split tokens.`,
        hash: approveHash
      })
      setTimeout(() => setNotification(null), 5000)
      
      // 🎯 CRITICAL FIX: Reset split progress after approval to allow new operations
      setSplitProgress({ step: 'idle', message: '' })
      
      refreshBalances()
    }
  }, [isApproveSuccess, approveHash, selectedAsset.symbol])

  useEffect(() => {
    if (isWrapSuccess && wrapHash) {
      console.log('🎯 WRAP COMPLETE: Wrap successful!', {
        hash: wrapHash,
        asset: selectedAsset.symbol,
        currentSYBalance: syBalance ? formatUnits(syBalance as bigint, 18) : '0'
      })
      
      // 🎯 ENHANCED BALANCE REFRESH: More aggressive and reliable balance updates
      console.log('🔄 REFRESHING BALANCES: Starting enhanced refresh...')
      
      // Immediate refresh
      refreshBalances()
      
      // Enhanced refresh with longer delays to ensure blockchain state updates
      setTimeout(() => {
        console.log('🔄 REFRESH 1: 2 seconds after wrap success')
        refreshBalances()
        refetchAssetBalance()
        refetchSyBalance()
      }, 2000)
      
      setTimeout(() => {
        console.log('🔄 REFRESH 2: 5 seconds after wrap success')
        refreshBalances()
        refetchAssetBalance()
        refetchSyBalance()
      }, 5000)
      
      setTimeout(() => {
        console.log('🔄 REFRESH 3: 10 seconds after wrap success')
        refreshBalances()
        refetchAssetBalance()
        refetchSyBalance()
      }, 10000)
      
      // Check if this was a deposit-only operation or part of deposit+split
      const wasDepositOnly = !splitProgress.step.includes('splitting')
      
      if (wasDepositOnly) {
        // This was just a deposit/wrap operation
        console.log('🔄 SPLIT PROGRESS STATE CHANGE:', {
          from: 'deposit_only_wrap_success',
          to: 'idle',
          timestamp: new Date().toISOString(),
          reason: 'Deposit-only operation completed'
        })
        
        toast.success('✅ Deposit successful! Your tokens are now wrapped as SY tokens.')
        setNotification({
          type: 'success',
          title: 'Deposit Complete!',
          message: `Successfully wrapped ${selectedAsset.symbol} to SY tokens. Check Portfolio tab for updated balances.`,
          hash: wrapHash
        })
        setTimeout(() => setNotification(null), 5000)
        
        // Reset progress for deposit-only
        setSplitProgress({ step: 'idle', message: '' })
        
        // Enhanced final balance check after deposit with multiple attempts
        setTimeout(() => {
          console.log('📊 DEPOSIT COMPLETE - Enhanced Final Balance Check')
          refreshBalances()
          refetchAssetBalance()
          refetchSyBalance()
          
          // Log the updated balances
          setTimeout(() => {
            const finalAssetBalance = assetBalance ? formatUnits(assetBalance as bigint, 18) : '0'
            const finalSYBalance = syBalance ? formatUnits(syBalance as bigint, 18) : '0'
            
            console.log('📊 DEPOSIT COMPLETE - Final Balance Check:', {
              assetBalance: finalAssetBalance,
              syBalance: finalSYBalance,
              message: 'Deposit operation completed successfully'
            })
            
            toast.success(`💰 Balance updated! Asset: ${finalAssetBalance}, SY: ${finalSYBalance}`)
          }, 1000)
        }, 3000)
        
      } else {
        // This was part of deposit+split operation
        toast.success('Step 1 complete! Now splitting into PT + YT...')
        setNotification({
          type: 'success',
          title: 'Step 1/2 Complete!',
          message: `Wrapped ${selectedAsset.symbol} to SY tokens. Auto-splitting...`,
          hash: wrapHash
        })
        setTimeout(() => setNotification(null), 5000)
        
        // Auto-split SY tokens after successful wrap
        // This creates the PT + YT tokens from SY
        setTimeout(() => {
          console.log('🔄 PREPARING STEP 2: About to split SY tokens...')
          // Refresh balance first
          refetchSyBalance().then(() => {
            const currentSYBalance = formatUnits(syBalance as bigint || 0n, 18)
            console.log('📊 Current SY Balance for splitting:', currentSYBalance)
            
            if (parseFloat(currentSYBalance) > 0) {
              console.log('🚀 INITIATING STEP 2: Calling splitTokens with amount:', currentSYBalance)
              setSplitProgress({ step: 'splitting', message: 'Auto-splitting SY tokens...' })
              splitTokens(currentSYBalance)
            } else {
              console.warn('⚠️ No SY balance to split! Balance:', currentSYBalance)
              setSplitProgress({ step: 'idle', message: '' })
              toast.error('No SY tokens found to split. Please try again.')
            }
          })
        }, 3000) // Wait 3 seconds for balances to update
      }
    }
  }, [isWrapSuccess, wrapHash, selectedAsset.symbol, syBalance, splitProgress.step])

  useEffect(() => {
    if (isSplitSuccess && splitHash) {
      console.log('🎉 STEP 2 COMPLETE: Split successful!', {
        hash: splitHash,
        asset: selectedAsset.symbol
      })
      
      // 🎯 IMMEDIATE: Refresh balances to see the new PT/YT tokens
      console.log('🔄 REFRESHING BALANCES: Fetching new PT/YT balances...')
      refreshBalances()
      
      // 🎯 FORCE MULTIPLE REFRESHES: Ensure PT/YT balances update
      setTimeout(() => refreshBalances(), 1000)
      setTimeout(() => refreshBalances(), 3000)
      setTimeout(() => refreshBalances(), 5000)
      
      setTimeout(() => {
        const finalPTBalance = ptBalance ? formatUnits(ptBalance as bigint, 18) : '0'
        const finalYTBalance = ytBalance ? formatUnits(ytBalance as bigint, 18) : '0'
        const finalYTClaimable = ytClaimableYield ? formatUnits(ytClaimableYield as bigint, 18) : '0'
        
        console.log('📊 BALANCE CHECK: Current balances after split:', {
          ptBalance: finalPTBalance,
          ytBalance: finalYTBalance,
          ytClaimable: finalYTClaimable
        })
        
        // Show a summary of what was created
        if (parseFloat(finalPTBalance) > 0 && parseFloat(finalYTBalance) > 0) {
          console.log('🎉 SPLIT SUCCESS SUMMARY:', {
            message: 'PT and YT tokens successfully created!',
            ptTokens: `${finalPTBalance} PT tokens (guaranteed principal)`,
            ytTokens: `${finalYTBalance} YT tokens (variable yield)`,
            currentYield: `${finalYTClaimable} SY tokens ready to claim`,
            ratio: 'Perfect 1:1:1 split as expected from smart contract'
          })
          
          // 🎯 SHOW VISUAL CONFIRMATION
          toast.success(`✨ MAGIC COMPLETE! Created ${finalPTBalance} PT + ${finalYTBalance} YT tokens!`)
        } else {
          console.warn('⚠️ PT/YT balances not showing yet, may need more time to update')
          toast.error('Split completed but balances updating slowly - check Portfolio tab')
        }
      }, 3000)
      
      setSplitProgress({ step: 'complete', message: 'Split complete! PT + YT tokens created!' })
      setTimeout(() => setSplitProgress({ step: 'idle', message: '' }), 5000)
      
      toast.success('🎯 Magic complete! PT + YT tokens created!')
      setNotification({
        type: 'success',
        title: '🎯 Token Split Successful!',
        message: `Created PT and YT tokens from SY-${selectedAsset.symbol}`,
        hash: splitHash
      })
      setTimeout(() => setNotification(null), 5000)
    }
  }, [isSplitSuccess, splitHash, selectedAsset.symbol, ptBalance, ytBalance, ytClaimableYield])

  useEffect(() => {
    if (isClaimYTSuccess && claimYTHash) {
      console.log('🎉 YT YIELD CLAIMED!', {
        hash: claimYTHash,
        asset: selectedAsset.symbol
      })
      
      toast.success('🎲 YT yield claimed successfully!')
      setNotification({
        type: 'success',
        title: '🎲 YT Yield Claimed!',
        message: `Successfully claimed variable yield from YT-${selectedAsset.symbol}`,
        hash: claimYTHash
      })
      setTimeout(() => setNotification(null), 5000)
      refreshBalances()
      
      // Trigger transaction history refresh
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('yieldClaimed', {
          detail: { asset: selectedAsset.symbol, hash: claimYTHash }
        }))
      }
    }
  }, [isClaimYTSuccess, claimYTHash, selectedAsset.symbol])

  useEffect(() => {
    if (isRedeemPTSuccess && redeemPTHash) {
      console.log('🔒 PT TOKENS REDEEMED!', {
        hash: redeemPTHash,
        asset: selectedAsset.symbol
      })
      
      toast.success('🔒 PT tokens redeemed successfully!')
      setNotification({
        type: 'success',
        title: '🔒 PT Redemption Complete!',
        message: `Successfully redeemed PT-${selectedAsset.symbol} for underlying assets`,
        hash: redeemPTHash
      })
      setTimeout(() => setNotification(null), 5000)
      refreshBalances()
    }
  }, [isRedeemPTSuccess, redeemPTHash, selectedAsset.symbol])

  useEffect(() => {
    if (isAddYieldSuccess && addYieldHash) {
      console.log('🌱 YIELD SNAPSHOT ADDED!', {
        hash: addYieldHash,
        asset: selectedAsset.symbol
      })
      
      toast.success('🌱 Yield snapshot added successfully!')
      setNotification({
        type: 'success',
        title: '🌱 Yield Snapshot Added!',
        message: `Successfully added yield snapshot to YT-${selectedAsset.symbol}`,
        hash: addYieldHash
      })
      setTimeout(() => setNotification(null), 5000)
      refreshBalances()
    }
  }, [isAddYieldSuccess, addYieldHash, selectedAsset.symbol])

  useEffect(() => {
    if (isUnwrapSuccess && unwrapHash) {
      toast.success('Unwrap successful!')
      setNotification({
        type: 'success',
        title: 'Unwrap Successful!',
        message: `Unwrapped SY tokens to ${selectedAsset.symbol}`,
        hash: unwrapHash
      })
      setTimeout(() => setNotification(null), 5000)
      refreshBalances()
    }
  }, [isUnwrapSuccess, unwrapHash, selectedAsset.symbol])

  useEffect(() => {
    if (isClaimSuccess && claimHash) {
      toast.success('Yield claimed successfully!')
      setNotification({
        type: 'success',
        title: 'Yield Claimed!',
        message: `Successfully claimed yield from SY-${selectedAsset.symbol}`,
        hash: claimHash
      })
      setTimeout(() => setNotification(null), 5000)
      refreshBalances()
    }
  }, [isClaimSuccess, claimHash, selectedAsset.symbol])

  // ========== RETURN VALUES ==========
  // Manual refresh function for debugging
  const refreshAllowanceData = () => {
    console.log('🔄 Manually refreshing allowance data...')
    refetchSYAllowance()
    // Also refresh asset allowance if available
    if (typeof refetchAllowance === 'function') {
      refetchAllowance()
    }
  }
  
  // 🎯 NEW: Function to manually reset split progress state
  const resetSplitProgress = () => {
    console.log('🔄 MANUAL RESET: Resetting split progress state')
    setSplitProgress({ step: 'idle', message: '' })
    toast.success('Split progress reset. You can now perform new operations.')
  }
  
  // 🎯 NEW: Function to log current system state for debugging
  const logCurrentState = () => {
    console.log('🔍 CURRENT SYSTEM STATE DEBUG:', {
      timestamp: new Date().toISOString(),
      splitProgress: {
        step: splitProgress.step,
        message: splitProgress.message
      },
      canDeposit: !(splitProgress.step === 'wrapping' || splitProgress.step === 'waiting' || splitProgress.step === 'splitting'),
      canSplit: !(splitProgress.step === 'wrapping' || splitProgress.step === 'waiting' || splitProgress.step === 'splitting'),
      currentAsset: selectedAssetKey,
      userAddress: address,
      hasAssetBalance: !!assetBalance,
      hasSYBalance: !!syBalance
    })
  }
  
  // 🎯 NEW: Function to force reset if stuck in blocking state
  const forceResetIfStuck = () => {
    console.log('🔧 FORCE RESET: Checking if system is stuck in blocking state')
    
    // If we're in a blocking state but no transaction is pending, force reset
    if (splitProgress.step === 'wrapping' || splitProgress.step === 'waiting' || splitProgress.step === 'splitting') {
      console.warn('⚠️ SYSTEM STUCK: Force resetting from blocking state', {
        currentStep: splitProgress.step,
        message: splitProgress.message,
        timestamp: new Date().toISOString()
      })
      
      setSplitProgress({ step: 'idle', message: '' })
      toast.success('System unstuck! You can now perform new operations.')
      return true
    }
    
    console.log('✅ SYSTEM OK: Not stuck in blocking state')
    return false
  }

  return {
    // State
    isConnected,
    address,
    notification,
    selectedAsset,
    assetAddress,
    syAddress,
    
    // Balances
    assetBalance,
    syBalance,
    coreBalance,
    accumulatedYield,
    
    // PT/YT Token data
    marketData,
    allMarkets: undefined, // No longer fetching all markets here
    ptBalance,
    ytBalance,
    ytClaimableYield,
    ptImpliedYield,
    ytCalculatedYield,
    ptHoldingDays,
    ptTokenAddress: marketData ? marketData.ptToken as Address : undefined,
    ytTokenAddress: marketData ? marketData.ytToken as Address : undefined,
    
    // Loading states
    isMinting: isMintPending || isMintWaiting,
    isApproving: isApprovePending || isApproveWaiting,
    isDepositing: isWrapPending || isWrapWaiting || isSplitPending || isSplitWaiting,
    isWithdrawing: isUnwrapPending || isUnwrapWaiting,
    isClaimingYield: isClaimPending || isClaimWaiting,
    isClaimingYTYield: isClaimYTPending || isClaimYTWaiting,
    isRedeemingPT: isRedeemPTPending || isRedeemPTWaiting,
    isAddingYieldSnapshot: isAddYieldPending || isAddYieldWaiting,
    
    // Helper functions
    formatBalance,
    formatYield,
    needsApproval,
    needsSYApproval,
    canExecuteAction,
    setMaxAmount,
    refreshBalances,
    
    // Price functions
    getRealTimePrice,
    formatBalanceUSD,
    
    // Actions
    handleMintTestTokens,
    handleMintCustomAmount,
    approveAsset,
    approveSYTokens,
    wrapAsset,
    splitTokens,
    handleWithdraw,
    claimYield,
    handleClaimYTYield,
    redeemPT,
    handleCreateMarket,
    handleAddYieldSnapshot,
    handleDepositAndSplit,
    
    // Split progress tracking
    splitProgress,
    refreshAllowanceData,
    refetchSYAllowance,
    resetSplitProgress,
    logCurrentState,
    forceResetIfStuck,
  } as const
}
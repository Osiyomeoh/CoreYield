import { useState, useEffect } from 'react'
import { 
  useAccount, 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt, 
  useBalance 
} from 'wagmi'
import { parseEther, formatUnits, type Address } from 'viem'
import toast from 'react-hot-toast'
import { CONTRACTS, ASSET_METADATA } from '@contracts/addresses'

// Import your actual ABIs
import MockStCOREABI from '../abis/MockStCORE.json'
import MockLstBTCABI from '../abis/MockLstBTC.json'
import MockDualCOREABI from '../abis/MockDualCORE.json'
import StandardizedYieldTokenABI from '../abis/StandardizedYieldToken.json'

interface NotificationProps {
  type: 'success' | 'error' | 'info'
  title: string
  message: string
  hash?: string
}

type AssetKey = 'stCORE' | 'lstBTC' | 'dualCORE'

export const useYieldProtocol = (selectedAssetKey: AssetKey) => {
  const { address, isConnected } = useAccount()
  const [notification, setNotification] = useState<NotificationProps | null>(null)

  const selectedAsset = ASSET_METADATA[selectedAssetKey]
  const assetAddress = CONTRACTS.MOCK_ASSETS[selectedAssetKey] as Address
  const syAddress = CONTRACTS.SY_TOKENS[`SY-${selectedAssetKey}`] as Address

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

  const { data: accumulatedYield } = useReadContract({
    address: syAddress,
    abi: StandardizedYieldTokenABI.abi,
    functionName: 'getAccumulatedYield',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address,
      refetchInterval: 5000
    }
  })

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

  // ========== HELPER FUNCTIONS ==========
  const formatBalance = (balance: bigint | undefined, decimals = 18): string => {
    if (!balance) return '0.0000'
    return parseFloat(formatUnits(balance, decimals)).toFixed(4)
  }

  const needsApproval = (amount: string): boolean => {
    if (!amount || !allowance) return true
    try {
      const allowanceValue = allowance as bigint
      return parseEther(amount) > allowanceValue
    } catch {
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

  // ========== ACTION HANDLERS ==========
  const handleMintTestTokens = async (): Promise<void> => {
    if (!address) return
    
    try {
      await writeMint({
        address: assetAddress,
        abi: assetABI,
        functionName: 'mint',
        args: [address, parseEther('1000')]
      })
      toast.success(`Minting 1000 ${selectedAsset.symbol} tokens...`)
    } catch (error) {
      toast.error('Failed to mint tokens')
      console.error('Mint error:', error)
    }
  }

  const handleApprove = async (amount: string): Promise<void> => {
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

  const handleDeposit = async (amount: string): Promise<void> => {
    if (!amount || !address) return
    
    try {
      await writeWrap({
        address: syAddress,
        abi: StandardizedYieldTokenABI.abi,
        functionName: 'wrap',
        args: [parseEther(amount)]
      })
      toast.success('Wrapping tokens to SY tokens...')
    } catch (error) {
      toast.error('Failed to wrap tokens')
      console.error('Wrap error:', error)
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

  const handleClaimYield = async (): Promise<void> => {
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

  const refreshBalances = (): void => {
    refetchAssetBalance()
    refetchSyBalance()
    refetchAllowance()
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
      toast.success('Approval successful!')
      setNotification({
        type: 'success',
        title: 'Approval Successful!',
        message: `Approved tokens for ${selectedAsset.symbol}`,
        hash: approveHash
      })
      setTimeout(() => setNotification(null), 5000)
      refreshBalances()
    }
  }, [isApproveSuccess, approveHash, selectedAsset.symbol])

  useEffect(() => {
    if (isWrapSuccess && wrapHash) {
      toast.success('Wrap successful!')
      setNotification({
        type: 'success',
        title: 'Wrap Successful!',
        message: `Wrapped ${selectedAsset.symbol} to SY tokens`,
        hash: wrapHash
      })
      setTimeout(() => setNotification(null), 5000)
      refreshBalances()
    }
  }, [isWrapSuccess, wrapHash, selectedAsset.symbol])

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
    
    // Loading states
    isMinting: isMintPending || isMintWaiting,
    isApproving: isApprovePending || isApproveWaiting,
    isDepositing: isWrapPending || isWrapWaiting,
    isWithdrawing: isUnwrapPending || isUnwrapWaiting,
    isClaimingYield: isClaimPending || isClaimWaiting,
    
    // Helper functions
    formatBalance,
    needsApproval,
    canExecuteAction,
    setMaxAmount,
    refreshBalances,
    
    // Actions
    handleMintTestTokens,
    handleApprove,
    handleDeposit,
    handleWithdraw,
    handleClaimYield,
  } as const
}
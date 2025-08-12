import React from 'react'
import { useReadContract } from 'wagmi'
import { CONTRACTS } from '@contracts/addresses'
import type { Address } from 'viem'

interface PriceDisplayProps {
  assetAddress: Address
  balance?: bigint
  showUSD?: boolean
  className?: string
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({ 
  assetAddress, 
  balance, 
  showUSD = true,
  className = '' 
}) => {
  const { 
    data: assetPrice, 
    isLoading: priceLoading,
    error: priceError
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
      refetchInterval: 10000
    }
  })

  const getRealTimePrice = (): number => {
    if (!assetPrice) return 0
    return Number(assetPrice) / Math.pow(10, 8)
  }

  const getUSDValue = (): string => {
    if (!balance || !assetPrice) return '$0.00'
    const balanceInTokens = Number(balance) / Math.pow(10, 18)
    const priceInUSD = Number(assetPrice) / Math.pow(10, 8)
    return `$${(balanceInTokens * priceInUSD).toFixed(2)}`
  }

  const currentPrice = getRealTimePrice()
  const usdValue = getUSDValue()

  if (priceLoading) {
    return (
      <div className={`text-gray-400 ${className}`}>
        <span className="animate-pulse">Loading price...</span>
      </div>
    )
  }

  if (priceError) {
    return (
      <div className={`text-red-400 ${className}`}>
        <span>Price error</span>
      </div>
    )
  }

  if (showUSD) {
    return (
      <div className={className}>
        <div className="text-white font-semibold">{usdValue}</div>
        <div className="text-xs text-gray-400">
          Price: ${currentPrice.toFixed(6)} • Updates every 10s
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="text-white font-semibold">${currentPrice.toFixed(6)}</div>
      <div className="text-xs text-gray-400">Live price • Updates every 10s</div>
    </div>
  )
} 
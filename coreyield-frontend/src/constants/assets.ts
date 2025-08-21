import { CONTRACTS } from '@contracts/addresses'
import type { YieldAsset } from '@/types'

// Note: APY values will be fetched dynamically from contracts
// These are fallback values when contract data is not available
export const YIELD_ASSETS: YieldAsset[] = [
  {
    name: 'stCORE',
    address: CONTRACTS.MOCK_ASSETS.stCORE as `0x${string}`,
    syAddress: CONTRACTS.SY_TOKENS['SY-stCORE'] as `0x${string}`,
    apy: 0, // Will be fetched from CoreStaking contract
    description: 'Liquid staked CORE with MEV rewards',
    color: 'from-orange-500 to-red-500',
    icon: '🔥',
    risk: 'Low',
    maturity: '6M'
  },
  {
    name: 'lstBTC',
    address: CONTRACTS.MOCK_ASSETS.lstBTC as `0x${string}`,
    syAddress: CONTRACTS.SY_TOKENS['SY-lstBTC'] as `0x${string}`,
    apy: 0, // Will be fetched from CoreStaking contract
    description: 'Liquid staked Bitcoin yield',
    color: 'from-yellow-500 to-orange-500',
    icon: '₿',
    risk: 'Low',
    maturity: '1Y'
  },
  {
    name: 'dualCORE',
    address: CONTRACTS.MOCK_ASSETS.dualCORE as `0x${string}`,
    syAddress: CONTRACTS.SY_TOKENS['SY-dualCORE'] as `0x${string}`,
    apy: 0, // Will be fetched from CoreStaking contract
    description: 'Dual CORE yield strategy with higher returns',
    color: 'from-purple-500 to-blue-500',
    icon: '⚡',
    risk: 'Medium',
    maturity: '3M'
  }
]
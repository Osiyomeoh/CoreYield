import { CONTRACTS } from '@contracts/addresses'
import type { YieldAsset } from '@/types'

export const YIELD_ASSETS: YieldAsset[] = [
  {
    name: 'stCORE',
    address: CONTRACTS.MOCK_ASSETS.stCORE as `0x${string}`,
    syAddress: CONTRACTS.SY_TOKENS['SY-stCORE'] as `0x${string}`,
    apy: 8.5,
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
    apy: 4.2,
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
    apy: 12.1,
    description: 'Dual token yield farming',
    color: 'from-purple-500 to-pink-500',
    icon: '⚡',
    risk: 'Medium',
    maturity: '3M'
  }
]
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
    maturity: '1Y'
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
    maturity: '1Y'
  }
]

// Working markets with pool data
export const WORKING_MARKETS = {
  lstBTC: [
    {
      name: 'lstBTC Market 1',
      marketKey: 'lstBTC_0',
      ...CONTRACTS.MARKETS.lstBTC_0,
      description: 'High liquidity lstBTC market with 105.0 PT + 95.3 YT reserves'
    },
    {
      name: 'lstBTC Market 2',
      marketKey: 'lstBTC_1',
      ...CONTRACTS.MARKETS.lstBTC_1,
      description: 'Balanced lstBTC market with 64.0 PT + 39.1 YT reserves'
    },
    {
      name: 'lstBTC Market 3',
      marketKey: 'lstBTC_2',
      ...CONTRACTS.MARKETS.lstBTC_2,
      description: 'YT-heavy lstBTC market with 35.8 PT + 64.0 YT reserves'
    },
    {
      name: 'lstBTC Market 4',
      marketKey: 'lstBTC_3',
      ...CONTRACTS.MARKETS.lstBTC_3,
      description: 'Balanced lstBTC market with 64.0 PT + 39.1 YT reserves'
    },
    {
      name: 'lstBTC Market 5',
      marketKey: 'lstBTC_4',
      ...CONTRACTS.MARKETS.lstBTC_4,
      description: 'Balanced lstBTC market with 64.0 PT + 39.1 YT reserves'
    }
  ],
  stCORE: [
    {
      name: 'stCORE Market 1',
      marketKey: 'stCORE_0',
      ...CONTRACTS.MARKETS.stCORE_0,
      description: 'YT-heavy stCORE market with 37.4 PT + 63.0 YT reserves'
    },
    {
      name: 'stCORE Market 2',
      marketKey: 'stCORE_1',
      ...CONTRACTS.MARKETS.stCORE_1,
      description: 'Balanced stCORE market with 63.0 PT + 39.7 YT reserves'
    }
  ]
} as const

export type WorkingMarket = typeof WORKING_MARKETS.lstBTC[0] | typeof WORKING_MARKETS.stCORE[0]
export type MarketKey = WorkingMarket['marketKey']
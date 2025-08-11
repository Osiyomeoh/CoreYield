// CoreYield Protocol - Deployed Contract Addresses
// Network: Core Testnet (Chain ID: 1114)
// Deployment Date: 2025-08-11 (Updated with yield claiming fixes)

export const CONTRACTS = {
  FACTORY: '0xdCDDf32c0a871d0ec431102Bb2EaD837959bba98',
  AMM: '0xdCDDf32c0a871d0ec431102Bb2EaD837959bba98', // Factory also acts as AMM
  LIQUIDITY_MINING: '0xdCDDf32c0a871d0ec431102Bb2EaD837959bba98', // Factory also handles LM
  MOCK_ASSETS: {
    stCORE: '0x3D6355e7637fdefBf734c053B28F64848Fd08f7b',
    lstBTC: '0x04Fdb265D4BEa2649c6eed5EC94c41C5317B88f9',
    dualCORE: '0x8de905f721A8CB31A5CA9D0DB01dEf1A4df34581',
  },
  SY_TOKENS: {
    'SY-stCORE': '0x0231Ca3b6993353ad4Fba8E4484190252B15c603',
    'SY-lstBTC': '0x5c44c0ED83Cc1b2B12FA5C268Ec469146d667a85',
    'SY-dualCORE': '0x4300f010a1Bff1a7019351314049e42690Ab8c44',
  },
  MARKETS: {
    stCORE: {
      syToken: '0x0231Ca3b6993353ad4Fba8E4484190252B15c603',
      ptToken: '0x0000000000000000000000000000000000000000', // Will be created when market is used
      ytToken: '0x0000000000000000000000000000000000000000', // Will be created when market is used
    },
    lstBTC: {
      syToken: '0x5c44c0ED83Cc1b2B12FA5C268Ec469146d667a85',
      ptToken: '0x0000000000000000000000000000000000000000', // Will be created when market is used
      ytToken: '0x0000000000000000000000000000000000000000', // Will be created when market is used
    },
    dualCORE: {
      syToken: '0x4300f010a1Bff1a7019351314049e42690Ab8c44',
      ptToken: '0x0000000000000000000000000000000000000000', // Will be created when market is used
      ytToken: '0x0000000000000000000000000000000000000000', // Will be created when market is used
    },
  },
  PRICE_ORACLE: '0xcD457F5A16D6f6eE2996b8344DB8d55d382229B2',
  DEPLOYER: '0xCE09931EeBd7d57c10BDcE6dBfA51a1139ec3663',
  CHAIN_ID: 1114,
  NETWORK: 'coreTestnet',
} as const

export const CHAIN_CONFIG = {
  chainId: 1114,
  name: 'Core Testnet',
  rpcUrl: 'https://rpc.test2.btcs.network',
  explorerUrl: 'https://scan.test2.btcs.network',
} as const

// Asset Metadata - This was missing!
export const ASSET_METADATA = {
  stCORE: {
    name: 'Liquid Staked CORE',
    symbol: 'stCORE',
    decimals: 18,
    apy: 8.5,
    description: 'Liquid staked CORE with MEV rewards',
    icon: '🔥',
    color: 'from-orange-500 to-red-500',
    risk: 'Low',
    maturity: '6M',
  },
  lstBTC: {
    name: 'Liquid Staked Bitcoin',
    symbol: 'lstBTC', 
    decimals: 18,
    apy: 4.2,
    description: 'Liquid staked Bitcoin yield',
    icon: '₿',
    color: 'from-yellow-500 to-orange-500',
    risk: 'Low',
    maturity: '1Y',
  },
  dualCORE: {
    name: 'Dual CORE Strategy',
    symbol: 'dualCORE',
    decimals: 18,
    apy: 12.1,
    description: 'Dual CORE yield strategy with higher returns',
    icon: '⚡',
    color: 'from-purple-500 to-blue-500',
    risk: 'Medium',
    maturity: '3M',
  },
} as const

// Type definitions for TypeScript
export type AssetKey = keyof typeof ASSET_METADATA
export type ContractAddresses = typeof CONTRACTS
export type AssetMetadata = typeof ASSET_METADATA
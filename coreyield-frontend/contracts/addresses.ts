// CoreYield Protocol - Deployed Contract Addresses
// Network: Core Testnet2 (Chain ID: 1114)
// Deployment Date: 2025-08-05T10:09:38.384Z

export const CONTRACTS = {
  FACTORY: '0x5fB9552177B6FE33ca4e6E55B2B1c9Dfc3BDbfD0',
  MOCK_ASSETS: {
    stCORE: '0x14fB00c3C7a9269393782f55E1e3cA61449F6b4E',
    lstBTC: '0xcFE7106a80cE3621b3e05Ab93ce88fC06624e028',
    dualCORE: '0x1fc1E64a9bF538a6C3FF92Cb85ffA35AC52d6DCD',
  },
  SY_TOKENS: {
    'SY-stCORE': '0x7d33476ae3F000eD60178686d64583FC82CdF3d2',
    'SY-lstBTC': '0x712D2147699aa2152EC69296f15b5f16bCD84D3B',
    'SY-dualCORE': '0xAB92A4b44f3b321c68Db3716ce546DC365D46838',
  },
  MARKETS: {
    stCORE: '0x09aed8827c178f65e9b7978c674d15a3dbc6d456ea5f469c692eca3ac94d2e0f',
    lstBTC: '0xf734c7a32b7c93139b6ba8023d71c93264889923c45c212855e477cbe875ef14',
    dualCORE: '0x1926beb3b680af2572c9ce72f9da8bcd6d4c71bf96773a5458e7d19c46e5c202',
  },
  DEPLOYER: '0xCE09931EeBd7d57c10BDcE6dBfA51a1139ec3663',
  CHAIN_ID: 1114,
  NETWORK: 'coreTestnet2',
} as const

export const CHAIN_CONFIG = {
  chainId: 1114,
  name: 'Core Testnet2',
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
    name: 'Dual Token CORE',
    symbol: 'dualCORE',
    decimals: 18,
    apy: 12.1,
    description: 'Dual token yield farming',
    icon: '⚡',
    color: 'from-purple-500 to-pink-500',
    risk: 'Medium',
    maturity: '3M',
  },
} as const

// Type definitions for TypeScript
export type AssetKey = keyof typeof ASSET_METADATA
export type ContractAddresses = typeof CONTRACTS
export type AssetMetadata = typeof ASSET_METADATA
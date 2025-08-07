// CoreYield Protocol - Deployed Contract Addresses
// Network: Core Testnet2 (Chain ID: 1114)
// Deployment Date: 2025-08-05T10:09:38.384Z

export const CONTRACTS = {
  FACTORY: '0xf2b1fEb0594e026BedD86d2789Ec6338E5A7Cd87',
  MOCK_ASSETS: {
    stCORE: '0x0a72CA08dAd53E763C015f7673f1A020E24C5144',
    lstBTC: '0xaa656275E40059C700Fc66Aac7eaeb4946FE00eE',
    dualCORE: '0xA6359543A7a6b56859b6A9878C5bDbdcbA4619b2',
  },
  SY_TOKENS: {
    'SY-stCORE': '0x1312dA39BC0cb496031066ef01A6D099b0429b6c',
    'SY-lstBTC': '0x00869bEBb73fA457a0e1afF98582CE009DE7b63B',
    'SY-dualCORE': '0x650fD85B5411377e9CE96cdD0cf0F1cF85d76Aa8',
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
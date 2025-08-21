
export const CONTRACTS = {
  // CoreYield deployed contracts (Updated for PT/YT system)
  CORE_YIELD_ROUTER: '0x7F963A75D1aF655EB24454eDd307C977C7133835',
  CORE_YIELD_MARKET_FACTORY: '0x07A6bDCa8040904148a39ed733bA7EDd2f2B32f6',
  CORE_YIELD_TOKEN_OPERATIONS: '0xf7bE7FE18D5A3733519aEF7D6c1aC5D09d244136',
  CORE_YIELD_ANALYTICS: '0x583d1FDfa01E70640074582fEEaFaaA41b1957F4',
  CORE_YIELD_AMM: '0x7CAfa70c3497C8F2dc09fBE6Cb27aD7c1A3FF89A',
  
  // Core contracts
  CORE_STAKING: '0xfa60eA709b10C24B444977E485cBC3461E78a741',
  PORTFOLIO_TRACKER: '0xa06Fcc614ae88912711362E7cC58d4910e3bBFF5',
  YIELD_HARVESTER: '0x6A65316538369E79956cEad3fAe11AA7EdaE1d97',
  RISK_MANAGER: '0xc27A19412302614ff032b97DEabfA9144DaaABd9',
  CORE_GOVERNANCE: '0x625Fb5D74e10C72CAEA982362A913fa77df1639a',
  CORE_YIELD_STRATEGY: '0xE8A3A02A014D094279c2626D7dd4eedfa067802B',
  CORE_YIELD_BRIDGE: '0xbdFcb85B83114ab02671eF987217d4b2893d06c9',
  
  // Mock tokens (Updated for testnet deployment)
  MOCK_ASSETS: {
    stCORE: '0x56EFa059C6264Db5E2155C832c0cb94268195d37',
    lstBTC: '0xf06eC44501B1D902c0286fF1c1730b63c331AcfB',
    dualCORE: '0x9f84d02e68C6Ad8782C9511B860Dc39699ed072B',
  },
  
  // New PT/YT Markets (Updated for testnet deployment)
  MARKETS: {
    dualCORE: {
      syToken: '0xe8D17fd05b135D47b138F7178C8bD62348D8454E',
      ptToken: '0x6eABaaAb0730F05726B1b124C9E2cA2b61059bA3',
      ytToken: '0x169Cc2b8B4afF6abA639A1c193E3888f2F1441E3',
      underlying: '0x9f84d02e68C6Ad8782C9511B860Dc39699ed072B',
      maturity: 1787139257, // Updated to match deployment
    },
    stCORE: {
      syToken: '0x7D26d45a304B9ebEeB5E87c36B21Ccd8535A2de1',
      ptToken: '0xe0DB359D7cf01c5CD1f06845F4182843a6a4C7a7',
      ytToken: '0x2700Ed66B67e62295b71240c32Ffae5A49B4b325',
      underlying: '0x56EFa059C6264Db5E2155C832c0cb94268195d37',
      maturity: 1787139257, // Updated to match deployment
    },
    lstBTC: {
      syToken: '0x409a383ddC8c8B6A0DA902D8aC6e71A07C1E4062',
      ptToken: '0xb22343689047c8361aCB67d891A9a02f94ca634D',
      ytToken: '0x45D1A4bD656B072999229890c6B5cE3011E441e7',
      underlying: '0xf06eC44501B1D902c0286fF1c1730b63c331AcfB',
      maturity: 1787139257, // Updated to match deployment
    },
  },
  
  // Legacy contracts (keeping for compatibility)
  FACTORY: '0x07A6bDCa8040904148a39ed733bA7EDd2f2B32f6',
  AMM: '0x7CAfa70c3497C8F2dc09fBE6Cb27aD7c1A3FF89A',
  LIQUIDITY_MINING: '0x7CAfa70c3497C8F2dc09fBE6Cb27aD7c1A3FF89A',
  
  // Legacy SY tokens (keeping for compatibility)
  SY_TOKENS: {
    'SY-stCORE': '0x7D26d45a304B9ebEeB5E87c36B21Ccd8535A2de1',
    'SY-lstBTC': '0x409a383ddC8c8B6A0DA902D8aC6e71A07C1E4062',
    'SY-dualCORE': '0xe8D17fd05b135D47b138F7178C8bD62348D8454E',
  },
  
  PRICE_ORACLE: '0xcD457F5A16D6f6eE2996b8344DB8d55d382229B2',
  DEPLOYER: '0xCE09931EeBd7d57c10BDcE6dBfA51a1139ec3663',
  
  YIELD_SOURCES: {
    LIDO_STAKING: '0x7cE86A2060dc4dc59eFDC7FFf7aEfC8264f86EC3',
    AAVE_LENDING: '0xf09BfA699430aD29b0e4391f1619aaDd924aA8A1',
    CURVE_LP: '0xF2e659fD3ea0Aa7B6f8eDB6D7CC9af80A4528cD1',
  },
  
  CHAIN_ID: 1114,
  NETWORK: 'coreTestnet',
} as const

export const CHAIN_CONFIG = {
  chainId: 1114,
  name: 'Core Testnet',
  rpcUrl: 'https://rpc.test2.btcs.network',
  explorerUrl: 'https://scan.test2.btcs.network',
} as const

export const ASSET_METADATA = {
  stCORE: {
    name: 'Liquid Staked CORE',
    symbol: 'stCORE',
    decimals: 18,
    apy: 0, // Will be fetched from contracts
    description: 'Liquid staked CORE with yield tokenization (PT/YT)',
    icon: '🔥',
    color: 'from-orange-500 to-red-500',
    risk: 'Low',
    maturity: '1Y', // Updated to match deployed contract
    marketMode: 'equilibrium',
    tradingSignals: {
      buyPT: false,
      buyYT: false,
      confidence: 0,
      reasoning: 'Will be calculated from real market data'
    }
  },
  lstBTC: {
    name: 'Liquid Staked Bitcoin',
    symbol: 'lstBTC', 
    decimals: 8, // Updated to match deployed contract
    apy: 0, // Will be fetched from contracts
    description: 'Liquid staked Bitcoin with yield tokenization (PT/YT)',
    icon: '₿',
    color: 'from-yellow-500 to-orange-500',
    risk: 'Low',
    maturity: '1Y', // Updated to match deployed contract
    marketMode: 'equilibrium',
    tradingSignals: {
      buyPT: false,
      buyYT: false,
      confidence: 0,
      reasoning: 'Will be calculated from real market data'
    }
  },
  dualCORE: {
    name: 'Dual CORE Strategy',
    symbol: 'dualCORE',
    decimals: 18,
    apy: 0, // Will be fetched from contracts
    description: 'Dual CORE yield strategy with PT/YT tokenization',
    icon: '⚡',
    color: 'from-purple-500 to-blue-500',
    risk: 'Medium',
    maturity: '1Y', // Updated to match deployed contract
    marketMode: 'equilibrium',
    tradingSignals: {
      buyPT: false,
      buyYT: false,
      confidence: 0,
      reasoning: 'Will be calculated from real market data'
    }
  },
} as const

export type AssetKey = keyof typeof ASSET_METADATA
export type ContractAddresses = typeof CONTRACTS
export type AssetMetadata = typeof ASSET_METADATA

export const CONTRACTS = {
  // CoreYield deployed contracts (Updated for working testnet deployment)
  CORE_YIELD_ROUTER: '0xF1F1C951036D9cCD9297Da837201970eEc88495e',
  CORE_YIELD_MARKET_FACTORY: '0x5C9239dDBAa092F53670E459f2193950Cd310276',
  CORE_YIELD_TOKEN_OPERATIONS: '0x50B653F00B5e15D25A9413e156833DC0c84Dd3F9',
  CORE_YIELD_ANALYTICS: '0x583d1FDfa01E70640074582fEEaFaaA41b1957F4',
  CORE_YIELD_AMM: '0xD1463554796b05CB128A0d890c739909695147B6',
  
  // Core contracts
  CORE_STAKING: '0xE4d4bdb6BF9FA8b137340288d5d4e2fC07331d59',
  PORTFOLIO_TRACKER: '0xa06Fcc614ae88912711362E7cC58d4910e3bBFF5',
  YIELD_HARVESTER: '0x6A65316538369E79956cEad3fAe11AA7EdaE1d97',
  RISK_MANAGER: '0xc27A19412302614ff032b97DEabfA9144DaaABd9',
  CORE_GOVERNANCE: '0x625Fb5D74e10C72CAEA982362A913fa77df1639a',
  CORE_YIELD_STRATEGY: '0xE8A3A02A014D094279c2626D7dd4eedfa067802B',
  CORE_YIELD_BRIDGE: '0xbdFcb85B83114ab02671eF987217d4b2893d06c9',
  
  // Mock tokens (Updated for working testnet deployment)
  MOCK_ASSETS: {
    stCORE: '0x4D6B4EC6dD26aA2F65e825C9F4Be2F3980506Ba7',
    lstBTC: '0xCf5Eb1CEcf54f792A89C81d3EF636AAc6f4F7B1A',
    dualCORE: '0xCf5Eb1CEcf54f792A89C81d3EF636AAc6f4F7B1A',
  },
  
  // Working PT/YT Markets (Updated for working testnet deployment)
  MARKETS: {
    // lstBTC Markets (5 working markets)
    lstBTC_0: {
      syToken: '0x2462695096d3578aBd371C704bd12c5BA7702F48',
      ptToken: '0xd840c9363f6A71E3cfBE6f043577736D7FDb3EEE',
      ytToken: '0xFC5CA3B14BdBcEda9F27b9253381805Bc2FBbDaE',
      underlying: '0xCf5Eb1CEcf54f792A89C81d3EF636AAc6f4F7B1A',
      maturity: 1787139257,
      poolReserves: { pt: '105.0', yt: '95.3' }
    },
    lstBTC_1: {
      syToken: '0x379103dF58731cd59aa3448826C15FA27Ed80D9a',
      ptToken: '0xb522F59D354FC12D4584Ba47BF9224CC59A6BC21',
      ytToken: '0xe4838BA09645038130f63b602f003A34ccfF8f3f',
      underlying: '0xCf5Eb1CEcf54f792A89C81d3EF636AAc6f4F7B1A',
      maturity: 1787139257,
      poolReserves: { pt: '64.0', yt: '39.1' }
    },
    lstBTC_2: {
      syToken: '0xF5E8A5101df703d0207bb134C9E76ca2033208D1',
      ptToken: '0xb3981A2aA51D3523799D49EAF562326ACEDBdA1c',
      ytToken: '0x570AA53C698f4baaE3dc34b0b6fD364518aa64b0',
      underlying: '0xCf5Eb1CEcf54f792A89C81d3EF636AAc6f4F7B1A',
      maturity: 1787139257,
      poolReserves: { pt: '35.8', yt: '64.0' }
    },
    lstBTC_3: {
      syToken: '0x505e1f6ACaF6e7C1DBc973d989A82d8F9efea67B',
      ptToken: '0x3be44874bcFEdd6d2202f01A6948183e89BFe679',
      ytToken: '0x57D5fc391d83B492a9605b966698600Fa3A4E5B8',
      underlying: '0xCf5Eb1CEcf54f792A89C81d3EF636AAc6f4F7B1A',
      maturity: 1787139257,
      poolReserves: { pt: '64.0', yt: '39.1' }
    },
    lstBTC_4: {
      syToken: '0x01ce3b0709C49f0c8FC84a50252F8A22e53d208e',
      ptToken: '0x5676e608Eb6350d90239c1032304C7EFd99dC3aC',
      ytToken: '0x7EfEcEDb940362E366E89b8cD13A1A3d6ab7BCEB',
      underlying: '0xCf5Eb1CEcf54f792A89C81d3EF636AAc6f4F7B1A',
      maturity: 1787139257,
      poolReserves: { pt: '64.0', yt: '39.1' }
    },
    
    // stCORE Markets (2 working markets)
    stCORE_0: {
      syToken: '0xd77Ec1b359063e8aa0A0810F0F004e84B156300B',
      ptToken: '0x4f13B431a493FB0Dc78c57eB309A78692D42eF8a',
      ytToken: '0x26a3e8273338CB1fF835431AD4F2B16beE101928',
      underlying: '0x4D6B4EC6dD26aA2F65e825C9F4Be2F3980506Ba7',
      maturity: 1787139257,
      poolReserves: { pt: '37.4', yt: '63.0' }
    },
    stCORE_1: {
      syToken: '0xdC4EE2200b0C305f723559101bC33ef80d6F9D16',
      ptToken: '0x0CcB786FcE2e0cB367b7CF1f8605BEDfe6102018',
      ytToken: '0x67153d28CC1f517Bf14be61ccB8c6f97e5BC5d9C',
      underlying: '0x4D6B4EC6dD26aA2F65e825C9F4Be2F3980506Ba7',
      maturity: 1787139257,
      poolReserves: { pt: '63.0', yt: '39.7' }
    },
  },
  
  // Legacy contracts (keeping for compatibility)
  FACTORY: '0x5C9239dDBAa092F53670E459f2193950Cd310276',
  AMM: '0xD1463554796b05CB128A0d890c739909695147B6',
  LIQUIDITY_MINING: '0xD1463554796b05CB128A0d890c739909695147B6',
  
  // Legacy SY tokens (keeping for compatibility)
  SY_TOKENS: {
    'SY-stCORE': '0xd77Ec1b359063e8aa0A0810F0F004e84B156300B',
    'SY-lstBTC': '0x2462695096d3578aBd371C704bd12c5BA7702F48',
    'SY-dualCORE': '0x2462695096d3578aBd371C704bd12c5BA7702F48',
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
    maturity: '1Y',
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
    decimals: 18, // Updated to match deployed contract
    apy: 0, // Will be fetched from contracts
    description: 'Liquid staked Bitcoin with yield tokenization (PT/YT)',
    icon: '₿',
    color: 'from-yellow-500 to-orange-500',
    risk: 'Low',
    maturity: '1Y',
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
    maturity: '1Y',
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

export const CONTRACTS = {
  FACTORY: '0x89f07f11887f2436C53FdEf22b34832C82d797DE',
  AMM: '0x89f07f11887f2436C53FdEf22b34832C82d797DE',
  LIQUIDITY_MINING: '0x89f07f11887f2436C53FdEf22b34832C82d797DE',
  MOCK_ASSETS: {
    stCORE: '0x415cDc9111c4A57a1E5599716E876bFa5f75B69D',
    lstBTC: '0x138d153ba2435F3AF3Da30684034Cfb9b1b2f47A',
    dualCORE: '0x1854dA2464a036517511418ff57218b25eb6976B',
  },
  SY_TOKENS: {
    'SY-stCORE': '0x58Ecee33932D5C1CDe558f028E79C722d0B8ebd9',
    'SY-lstBTC': '0xe2Fc813E0a3893A6F6E673c31bBB63829AD9fADF',
    'SY-dualCORE': '0xb9eaf48C9c7F19216A54D0cCADC3709a4CB7f9D6',
  },
  MARKETS: {
    stCORE: {
      syToken: '0x58Ecee33932D5C1CDe558f028E79C722d0B8ebd9',
      ptToken: '0xA72A9a3D187e17F2D13C6531f1EbAa953C39a57E',
      ytToken: '0x0d5931Cc06a28aEBd44c4a99028158EC6D3E46DB',
    },
    lstBTC: {
      syToken: '0xe2Fc813E0a3893A6F6E673c31bBB63829AD9fADF',
      ptToken: '0xb3E5E8640cA609e7Da2C7aE048CB6235Ea51f29D',
      ytToken: '0xA1E636968247baA355d317dce14eCc8c608d08e9',
    },
    dualCORE: {
      syToken: '0xb9eaf48C9c7F19216A54D0cCADC3709a4CB7f9D6',
      ptToken: '0x2262bf987E5E80aAC9f8A67E2E7cB9B06AD16102',
      ytToken: '0x45214e47C13723B6eBBdd6f83776D47e6CFd59Ee',
    },
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

export type AssetKey = keyof typeof ASSET_METADATA
export type ContractAddresses = typeof CONTRACTS
export type AssetMetadata = typeof ASSET_METADATA
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { Chain } from 'viem'

export const coreTestnet: Chain = {
  id: 1114,
  name: 'Core Testnet2',
  nativeCurrency: {
    decimals: 18,
    name: 'Core',
    symbol: 'CORE',
  },
  rpcUrls: {
    default: {
      // Use proxy in development, fallback RPC URLs in production
      http: import.meta.env.DEV 
        ? ['/rpc'] 
        : [
            'https://rpc.test2.btcs.network',
            'https://1114.rpc.thirdweb.com',
            'https://rpc.test.btcs.network'
          ],
    },
    public: {
      http: import.meta.env.DEV 
        ? ['/rpc'] 
        : [
            'https://rpc.test2.btcs.network',
            'https://1114.rpc.thirdweb.com', 
            'https://rpc.test.btcs.network'
          ],
    },
  },
  blockExplorers: {
    default: { name: 'CoreScan', url: 'https://scan.test2.btcs.network' },
  },
  testnet: true,
} as const

export const config = getDefaultConfig({
  appName: 'CoreYield Protocol',
  projectId: process.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [coreTestnet],
  ssr: false,
})
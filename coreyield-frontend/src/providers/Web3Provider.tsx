import React from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'

// Core Testnet chain
const coreTestnet = {
  id: 1114,
  name: 'Core Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Core',
    symbol: 'CORE',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.test2.btcs.network'],
    },
  },
  blockExplorers: {
    default: { name: 'Core Scan', url: 'https://scan.test2.btcs.network' },
  },
  testnet: true,
} as const

// Simple config without custom theme
const config = getDefaultConfig({
  appName: 'CoreYield Protocol',
  projectId: 'c4f79cc821944d9680842e34466bfabc', // Public demo project ID
  chains: [coreTestnet],
  ssr: false,
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

interface Web3ProviderProps {
  children: React.ReactNode
}

export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider modalSize="compact">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
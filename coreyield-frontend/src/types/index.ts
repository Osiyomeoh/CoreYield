export interface YieldAsset {
    name: string
    address: `0x${string}`
    syAddress: `0x${string}`
    apy: number
    description: string
    color: string
    icon: string
    risk: 'Low' | 'Medium' | 'High'
    maturity: string
  }
  
  export interface NotificationProps {
    type: 'success' | 'error' | 'info'
    title: string
    message: string
    hash?: string
  }
  
  export type TabType = 'deposit' | 'withdraw'
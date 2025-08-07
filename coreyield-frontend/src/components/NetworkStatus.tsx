import React from 'react'
import { useAccount, useChainId } from 'wagmi'


export const NetworkStatus: React.FC = () => {
  const chainId = useChainId()
  const { address, isConnected } = useAccount()

  return (
    <div className="fixed top-4 right-4 bg-gray-800 border border-gray-700 rounded-lg p-4 text-sm text-white z-50">
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        
        {isConnected && (
          <>
            <div>
              <span className="text-gray-400">Network: </span>
              <span className={chainId === 1114 ? 'text-green-400' : 'text-red-400'}>
                {chainId === 1114 ? 'Core Testnet2' : 'Unknown'}
              </span>
            </div>
            
            <div>
              <span className="text-gray-400">Chain ID: </span>
              <span className={chainId === 1114 ? 'text-green-400' : 'text-red-400'}>
                {chainId || 'Unknown'}
              </span>
            </div>
            
            <div>
              <span className="text-gray-400">Expected: </span>
              <span className="text-blue-400">Core Testnet2 (1114)</span>
            </div>
            
            <div className="text-xs text-gray-500">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'No address'}
            </div>
            
            {chainId !== 1114 && (
              <div className="text-red-400 text-xs">
                ⚠️ Wrong network! Switch to Core Testnet2
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
} 
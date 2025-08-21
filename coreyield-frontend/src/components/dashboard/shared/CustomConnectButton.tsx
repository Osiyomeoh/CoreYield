import React, { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useDisconnect } from 'wagmi'

export const CustomConnectButton: React.FC = () => {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  if (!isConnected || !address) {
    return <ConnectButton />
  }

  // Optimize address display: show first 4 and last 4 characters
  const optimizedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address)
      console.log('Address copied to clipboard')
    } catch (error) {
      console.error('Failed to copy address:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = address
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      console.log('Address copied to clipboard (fallback)')
    }
  }

  const handleViewOnExplorer = () => {
    // Open in Core Testnet explorer
    const explorerUrl = `https://scan.test2.btcs.network/address/${address}`
    window.open(explorerUrl, '_blank')
  }

  const handleDisconnect = () => {
    disconnect()
    setIsDropdownOpen(false)
  }

  return (
    <div className="relative">
      <button 
        className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors text-sm border border-gray-700 flex items-center space-x-2"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <span>{optimizedAddress}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
          <div className="p-2">
            <button 
              onClick={handleCopyAddress}
              className="w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded text-sm transition-colors"
            >
              Copy Address
            </button>
            <button 
              onClick={handleViewOnExplorer}
              className="w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded text-sm transition-colors"
            >
              View on Explorer
            </button>
            <div className="border-t border-gray-700 my-1"></div>
            <button 
              onClick={handleDisconnect}
              className="w-full text-left px-3 py-2 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded text-sm transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
      
      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  )
}

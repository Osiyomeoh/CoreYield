import React, { useState } from 'react'

interface TokenRequestModalProps {
  isOpen: boolean
  onClose: () => void
  userAddress: string
  onRequestTokens: (amount: string) => void
}

export const TokenRequestModal: React.FC<TokenRequestModalProps> = ({
  isOpen,
  onClose,
  userAddress,
  onRequestTokens
}) => {
  const [amount, setAmount] = useState('10000')
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const command = `npx hardhat run scripts/mint-all-tokens.js --network coreTestnet ${userAddress} ${amount}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.log('Could not copy to clipboard')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mr-4">
              <span className="text-2xl">🪙</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Request Test Tokens</h2>
              <p className="text-gray-300">Get CORE tokens for testing the application</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* User Address */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Address
            </label>
            <div className="bg-gray-700 rounded-lg p-3 text-white font-mono text-sm break-all">
              {userAddress}
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount to Request
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="10000"
              />
              <button
                onClick={() => setAmount('10000')}
                className="px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors"
              >
                Default
              </button>
            </div>
          </div>

          {/* Command Display */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Run this command in your terminal:
            </label>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between">
                <code className="text-green-400 text-sm font-mono break-all">
                  {command}
                </code>
                <button
                  onClick={copyToClipboard}
                  className={`ml-4 px-3 py-1 rounded text-xs font-medium transition-colors ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-600 hover:bg-gray-500 text-white'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
            <h3 className="text-blue-300 font-semibold mb-2">📋 Instructions:</h3>
            <ol className="text-blue-200 text-sm space-y-1 list-decimal list-inside">
              <li>Open your terminal in the CoreYield project directory</li>
              <li>Run the command above (it's already copied to your clipboard)</li>
              <li>Wait for the transaction to complete</li>
              <li><strong>Click "🔄 Refresh Balances" button</strong> to see your new balance</li>
              <li>Start testing the application!</li>
            </ol>
          </div>

          {/* What you get */}
          <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4">
            <h3 className="text-green-300 font-semibold mb-2">🎁 What you'll get:</h3>
            <ul className="text-green-200 text-sm space-y-1">
              <li>• {amount} CORE tokens (can be used as CORE, stCORE, or lstBTC)</li>
              <li>• Ability to stake, wrap, and split tokens</li>
              <li>• Access to all trading and liquidity features</li>
              <li>• Perfect for testing the complete application flow</li>
              <li>• <strong>Remember to click "Refresh Balances" after minting!</strong></li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={() => onRequestTokens(amount)}
              className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all duration-200"
            >
              Show Instructions in Console
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

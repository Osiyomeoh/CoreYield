import React, { useState } from 'react'
import { CONTRACTS } from '@contracts/addresses'

export const ContractTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([])

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const testContractConnection = async () => {
    setTestResults([])
    addResult('Testing contract connections...')
    
    try {
      // Test SY-stCORE contract
      const syStCOREAddress = CONTRACTS.SY_TOKENS['SY-stCORE']
      addResult(`SY-stCORE Address: ${syStCOREAddress}`)
      
      // Test factory contract
      addResult(`Factory Address: ${CONTRACTS.FACTORY}`)
      
      // Test mock assets
      addResult(`Mock stCORE: ${CONTRACTS.MOCK_ASSETS.stCORE}`)
      addResult(`Mock lstBTC: ${CONTRACTS.MOCK_ASSETS.lstBTC}`)
      addResult(`Mock dualCORE: ${CONTRACTS.MOCK_ASSETS.dualCORE}`)
      
      addResult('✅ Contract addresses loaded successfully')
      
    } catch (error) {
      addResult(`❌ Contract test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="fixed bottom-4 left-4 bg-gray-800 border border-gray-700 rounded-lg p-4 text-sm text-white z-50 max-w-md">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Contract Test</h3>
        <button
          onClick={testContractConnection}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
        >
          Test
        </button>
      </div>
      
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {testResults.map((result, index) => (
          <div key={index} className="text-xs">
            {result}
          </div>
        ))}
      </div>
    </div>
  )
} 
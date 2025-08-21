import React from 'react'

interface Chain {
  id: string
  name: string
  icon: string
  balance: string
}

interface ChainSelectorProps {
  chains: Chain[]
  selectedChains: string[]
  onChainToggle: (chainId: string) => void
}

export const ChainSelector: React.FC<ChainSelectorProps> = ({
  chains,
  selectedChains,
  onChainToggle
}) => {
  return (
    <div className="flex items-center space-x-4 overflow-x-auto pb-2">
      {chains.map((chain) => (
        <button
          key={chain.id}
          className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all border-2 ${
            selectedChains.includes(chain.id) 
              ? 'bg-blue-600 border-blue-400 shadow-lg scale-110' 
              : 'bg-gray-700 hover:bg-gray-600 border-transparent hover:border-gray-500'
          }`}
          onClick={() => onChainToggle(chain.id)}
          title={`${chain.name} - ${chain.balance}`}
        >
          <span>{chain.icon}</span>
        </button>
      ))}
    </div>
  )
}
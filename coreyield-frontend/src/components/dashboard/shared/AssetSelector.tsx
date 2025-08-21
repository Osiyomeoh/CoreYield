import React, { useState } from 'react'

interface Asset {
  symbol: string
  name: string
  icon: string
  apy: number
  description: string
  tvl?: string
  category?: string
  riskLevel?: string
}

interface AssetSelectorProps {
  selectedAsset: string
  onAssetSelect: (asset: string) => void
  assets: Record<string, Asset>
  className?: string
}

export const AssetSelector: React.FC<AssetSelectorProps> = ({
  selectedAsset,
  onAssetSelect,
  assets,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const selectedAssetData = assets[selectedAsset] || Object.values(assets)[0]

  const handleAssetSelect = (assetKey: string) => {
    onAssetSelect(assetKey)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      {/* Selected Asset Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-800 border border-gray-600 rounded-lg hover:border-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
      >
        <div className="flex items-center space-x-3">
          <span className="text-xl">{selectedAssetData.icon}</span>
          <div className="text-left">
            <h4 className="text-white font-medium">{selectedAssetData.symbol}</h4>
            <p className="text-gray-400 text-sm">{selectedAssetData.name}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-green-400 font-semibold">{selectedAssetData.apy}% APY</p>
            <p className="text-gray-400 text-sm">{selectedAssetData.category}</p>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
          {Object.entries(assets).map(([key, asset]) => (
            <button
              key={key}
              onClick={() => handleAssetSelect(key)}
              className={`w-full flex items-center justify-between p-4 text-left hover:bg-gray-700/50 transition-colors ${
                selectedAsset === key ? 'bg-blue-500/10 border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">{asset.icon}</span>
                <div>
                  <h4 className="text-white font-medium">{asset.symbol}</h4>
                  <p className="text-gray-400 text-sm">{asset.name}</p>
                  <p className="text-gray-300 text-xs mt-1">{asset.description}</p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-green-400 font-semibold">{asset.apy}% APY</p>
                <p className="text-gray-400 text-sm">{asset.tvl || 'N/A'} TVL</p>
                {asset.riskLevel && (
                  <p className={`text-xs font-medium ${
                    asset.riskLevel === 'Low' ? 'text-green-400' :
                    asset.riskLevel === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {asset.riskLevel} Risk
                  </p>
                )}
              </div>
              
              {selectedAsset === key && (
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center ml-3">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
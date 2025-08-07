import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'
import type { YieldAsset } from '@/types'

interface AssetCardProps {
  asset: YieldAsset
  isSelected: boolean
  onSelect: (asset: YieldAsset) => void
  assetBalance: string
  syBalance: string
  syTotalSupply: string
  index: number
}

const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  isSelected,
  onSelect,
  assetBalance,
  syBalance,
  syTotalSupply,
  index
}) => {
  return (
    <motion.div
      onClick={() => onSelect(asset)}
      className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-[1.01] ${
        isSelected
          ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
          : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
      }`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${asset.color} flex items-center justify-center text-2xl shadow-lg`}>
            {asset.icon}
          </div>
          <div>
            <h3 className="text-xl font-bold">{asset.name}</h3>
            <p className="text-gray-400 mb-2">{asset.description}</p>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">Balance:</span>
                <span className="text-white font-medium">
                  {assetBalance} {asset.name}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">SY Balance:</span>
                <span className="text-blue-400 font-medium">
                  {syBalance} SY
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3 mt-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                asset.risk === 'Low' ? 'bg-green-500/20 text-green-400' :
                asset.risk === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                Risk: {asset.risk}
              </span>
              <span className="text-xs bg-gray-700 px-2 py-1 rounded-full text-gray-300">
                Maturity: {asset.maturity}
              </span>
              <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
                TVL: {syTotalSupply ? `${syTotalSupply} SY` : 'Loading...'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-3xl font-bold text-green-400">{asset.apy}%</div>
          <div className="text-sm text-gray-400">Current APY</div>
          <div className="flex items-center space-x-1 mt-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-xs text-green-400">+2.1%</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default AssetCard
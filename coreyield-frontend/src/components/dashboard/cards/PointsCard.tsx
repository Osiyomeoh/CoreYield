import React from 'react'
import { ActionButton } from '../shared/ActionButton'

interface PointsMarket {
  asset: string
  maturity: string
  points: string[]
  multiplier: string
  fixedYield: number
  lpYield: number
  icon: string
}

interface PointsCardProps {
  market: PointsMarket
  onTrade: () => void
}

export const PointsCard: React.FC<PointsCardProps> = ({
  market,
  onTrade
}) => {
  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6 hover:border-gray-600/50 transition-all hover-lift">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xl">
            {market.icon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{market.asset}</h3>
            <p className="text-gray-400 text-sm">{market.maturity}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="px-2 py-1 bg-purple-500/20 rounded-full">
            <span className="text-purple-300 text-xs font-medium">{market.multiplier}</span>
          </div>
        </div>
      </div>

      {/* Points */}
      <div className="mb-4">
        <p className="text-gray-400 text-sm mb-2">Earning Points:</p>
        <div className="flex flex-wrap gap-2">
          {market.points.map((point, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30"
            >
              {point}
            </span>
          ))}
        </div>
      </div>

      {/* Yields */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <p className="text-gray-400 text-xs">Fixed Yield</p>
          <p className="text-teal-400 font-bold text-lg">{market.fixedYield}%</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-xs">LP Yield</p>
          <p className="text-green-400 font-bold text-lg">{market.lpYield}%</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <ActionButton
          onClick={onTrade}
          variant="primary"
          size="sm"
          fullWidth
        >
          Trade YT
        </ActionButton>
        <ActionButton
          onClick={onTrade}
          variant="success"
          size="sm"
          fullWidth
        >
          Trade PT
        </ActionButton>
      </div>

      {/* Additional Info */}
      <div className="mt-4 pt-4 border-t border-gray-700/50">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Points Multiplier</span>
          <span className="text-purple-300 font-medium">{market.multiplier}</span>
        </div>
      </div>
    </div>
  )
}
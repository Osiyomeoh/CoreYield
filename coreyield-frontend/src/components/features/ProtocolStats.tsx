import React from 'react'
import { motion } from 'framer-motion'
import { Activity } from 'lucide-react'

const ProtocolStats: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
    >
      <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
        <Activity className="w-5 h-5 text-blue-400" />
        <span>Protocol Metrics</span>
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-400">3</div>
          <div className="text-xs text-gray-400">Active Markets</div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-400">$126M</div>
          <div className="text-xs text-gray-400">Total TVL</div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-purple-400">8.3%</div>
          <div className="text-xs text-gray-400">Avg APY</div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-orange-400">2.8K</div>
          <div className="text-xs text-gray-400">Users</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">24h Volume:</span>
          <span className="text-white font-medium">$8.9M</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-gray-400">Protocol Fee:</span>
          <span className="text-white font-medium">0.1%</span>
        </div>
      </div>
    </motion.div>
  )
}

export default ProtocolStats
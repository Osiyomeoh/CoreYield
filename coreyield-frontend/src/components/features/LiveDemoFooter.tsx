import React from 'react'
import { motion } from 'framer-motion'

interface LiveDemoFooterProps {
  assetCount: number
}

const LiveDemoFooter: React.FC<LiveDemoFooterProps> = ({ assetCount }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mt-16"
    >
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-8 text-center backdrop-blur-xl">
        <div className="inline-flex items-center space-x-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-6">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-sm text-green-300">Live on Core Testnet</span>
        </div>
        
        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Protocol Successfully Deployed!
        </h2>
        
        <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
          The CoreYield Protocol is fully functional with {assetCount} yield-bearing assets, 
          3 active markets, and advanced tokenization features ready for testing.
        </p>
        
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2 text-gray-400">
            <div className="w-2 h-2 bg-blue-400 rounded-full" />
            <span>Chain ID: 1114</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-400">
            <div className="w-2 h-2 bg-purple-400 rounded-full" />
            <span>Gas: ~17M used</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-400">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span>Contracts Verified</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default LiveDemoFooter
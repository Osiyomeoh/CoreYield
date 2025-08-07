import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, Activity } from 'lucide-react'
import type { NotificationProps } from '@/types'

const Notification: React.FC<NotificationProps> = ({ type, title, message, hash }) => {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Activity
  }
  
  const colors = {
    success: 'from-green-500 to-emerald-500',
    error: 'from-red-500 to-pink-500',
    info: 'from-blue-500 to-purple-500'
  }

  const Icon = icons[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-6 right-6 max-w-sm bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-2xl z-50"
    >
      <div className="flex items-start space-x-3">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${colors[type]} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-white">{title}</h4>
          <p className="text-sm text-gray-300 mt-1">{message}</p>
          {hash && (
            <a
              href={`https://scan.test.btcs.network/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 mt-2 inline-block"
            >
              View on Explorer →
            </a>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default Notification
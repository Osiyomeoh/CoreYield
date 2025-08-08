import React, { useState } from 'react'

interface CalculatorProps {
  onClose?: () => void
}

export const Calculator: React.FC<CalculatorProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'apy' | 'yield' | 'compound'>('apy')
  const [principal, setPrincipal] = useState('')
  const [apy, setApy] = useState('')
  const [timeframe, setTimeframe] = useState('365')
  const [compoundFrequency, setCompoundFrequency] = useState('1')

  const calculateAPY = () => {
    if (!principal || !apy) return null
    
    const p = parseFloat(principal)
    const r = parseFloat(apy) / 100
    const t = parseFloat(timeframe) / 365
    const n = parseFloat(compoundFrequency)
    
    const amount = p * Math.pow(1 + r/n, n * t)
    const interest = amount - p
    const effectiveAPY = ((Math.pow(1 + r/n, n) - 1) * 100)
    
    return {
      principal: p,
      interest,
      total: amount,
      effectiveAPY
    }
  }

  const calculateYield = () => {
    if (!principal || !apy) return null
    
    const p = parseFloat(principal)
    const r = parseFloat(apy) / 100
    const t = parseFloat(timeframe) / 365
    
    const amount = p * Math.pow(1 + r, t)
    const interest = amount - p
    
    return {
      principal: p,
      interest,
      total: amount,
      dailyYield: (p * r) / 365,
      weeklyYield: (p * r) / 52,
      monthlyYield: (p * r) / 12
    }
  }

  const calculateCompound = () => {
    if (!principal || !apy) return null
    
    const p = parseFloat(principal)
    const r = parseFloat(apy) / 100
    const t = parseFloat(timeframe) / 365
    const n = parseFloat(compoundFrequency)
    
    const amount = p * Math.pow(1 + r/n, n * t)
    const interest = amount - p
    
    return {
      principal: p,
      interest,
      total: amount,
      compoundEffect: interest - (p * r * t)
    }
  }

  const result = activeTab === 'apy' ? calculateAPY() : 
                 activeTab === 'yield' ? calculateYield() : 
                 calculateCompound()

  // Type guards for better TypeScript support
  const isAPYResult = (result: any): result is { principal: number; interest: number; total: number; effectiveAPY: number } => {
    return result && 'effectiveAPY' in result
  }

  const isYieldResult = (result: any): result is { principal: number; interest: number; total: number; dailyYield: number; weeklyYield: number; monthlyYield: number } => {
    return result && 'dailyYield' in result
  }

  const isCompoundResult = (result: any): result is { principal: number; interest: number; total: number; compoundEffect: number } => {
    return result && 'compoundEffect' in result
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-base sm:text-lg">🧮</span>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Yield Calculator</h2>
              <p className="text-gray-400 text-xs sm:text-sm">Calculate APY, yields, and compound effects</p>
            </div>
          </div>
          {onClose && (
                      <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {[
            { id: 'apy', label: 'APY Converter', icon: '📊' },
            { id: 'yield', label: 'Yield Calculator', icon: '💰' },
            { id: 'compound', label: 'Compound Effect', icon: '📈' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/10'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Input Fields */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Principal Amount ($)
              </label>
              <input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                placeholder="1000"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                APY (%)
              </label>
              <input
                type="number"
                value={apy}
                onChange={(e) => setApy(e.target.value)}
                placeholder="15"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Timeframe (days)
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="180">180 days</option>
                <option value="365">1 year</option>
                <option value="730">2 years</option>
              </select>
            </div>
            
            {activeTab === 'apy' && (
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Compound Frequency
                </label>
                <select
                  value={compoundFrequency}
                  onChange={(e) => setCompoundFrequency(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="1">Annually</option>
                  <option value="2">Semi-annually</option>
                  <option value="4">Quarterly</option>
                  <option value="12">Monthly</option>
                  <option value="365">Daily</option>
                </select>
              </div>
            )}
          </div>

          {/* Results */}
          {result && (
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Results</h3>
              
                             {activeTab === 'apy' && isAPYResult(result) && (
                 <div className="grid md:grid-cols-2 gap-6">
                   <div className="space-y-3">
                     <div className="flex justify-between">
                       <span className="text-gray-400">Principal:</span>
                       <span className="text-white font-medium">${result.principal.toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-400">Interest Earned:</span>
                       <span className="text-green-400 font-medium">${result.interest.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-400">Total Amount:</span>
                       <span className="text-white font-medium">${result.total.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-400">Effective APY:</span>
                       <span className="text-blue-400 font-medium">{result.effectiveAPY.toFixed(2)}%</span>
                     </div>
                   </div>
                  <div className="bg-gray-750 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">APY Comparison</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Simple Interest:</span>
                        <span className="text-gray-300">${(result.principal * parseFloat(apy) / 100 * parseFloat(timeframe) / 365).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Compound Interest:</span>
                        <span className="text-green-400">${result.interest.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Difference:</span>
                        <span className="text-blue-400">${(result.interest - (result.principal * parseFloat(apy) / 100 * parseFloat(timeframe) / 365)).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
                             {activeTab === 'yield' && isYieldResult(result) && (
                 <div className="grid md:grid-cols-2 gap-6">
                   <div className="space-y-3">
                     <div className="flex justify-between">
                       <span className="text-gray-400">Principal:</span>
                       <span className="text-white font-medium">${result.principal.toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-400">Total Interest:</span>
                       <span className="text-green-400 font-medium">${result.interest.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-400">Final Amount:</span>
                       <span className="text-white font-medium">${result.total.toFixed(2)}</span>
                     </div>
                   </div>
                   <div className="bg-gray-750 rounded-lg p-4">
                     <h4 className="text-white font-medium mb-2">Yield Breakdown</h4>
                     <div className="space-y-2 text-sm">
                       <div className="flex justify-between">
                         <span className="text-gray-400">Daily Yield:</span>
                         <span className="text-gray-300">${result.dailyYield.toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-400">Weekly Yield:</span>
                         <span className="text-gray-300">${result.weeklyYield.toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-400">Monthly Yield:</span>
                         <span className="text-gray-300">${result.monthlyYield.toFixed(2)}</span>
                       </div>
                     </div>
                   </div>
                 </div>
               )}
              
                             {activeTab === 'compound' && isCompoundResult(result) && (
                 <div className="grid md:grid-cols-2 gap-6">
                   <div className="space-y-3">
                     <div className="flex justify-between">
                       <span className="text-gray-400">Principal:</span>
                       <span className="text-white font-medium">${result.principal.toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-400">Compound Interest:</span>
                       <span className="text-green-400 font-medium">${result.interest.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-400">Final Amount:</span>
                       <span className="text-white font-medium">${result.total.toFixed(2)}</span>
                     </div>
                   </div>
                   <div className="bg-gray-750 rounded-lg p-4">
                     <h4 className="text-white font-medium mb-2">Compound Effect</h4>
                     <div className="space-y-2 text-sm">
                       <div className="flex justify-between">
                         <span className="text-gray-400">Simple Interest:</span>
                         <span className="text-gray-300">${(result.interest - result.compoundEffect).toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-400">Compound Bonus:</span>
                         <span className="text-blue-400">${result.compoundEffect.toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-400">Total Gain:</span>
                         <span className="text-green-400">${result.interest.toFixed(2)}</span>
                       </div>
                     </div>
                   </div>
                 </div>
               )}
            </div>
          )}

          {/* Quick Examples */}
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                setPrincipal('10000')
                setApy('12')
                setTimeframe('365')
              }}
              className="p-4 bg-gray-800 hover:bg-gray-750 rounded-lg border border-gray-700 text-left transition-colors"
            >
              <div className="text-blue-400 font-medium text-sm">Example 1</div>
              <div className="text-gray-300 text-xs mt-1">$10,000 at 12% APY</div>
            </button>
            <button
              onClick={() => {
                setPrincipal('5000')
                setApy('8')
                setTimeframe('180')
              }}
              className="p-4 bg-gray-800 hover:bg-gray-750 rounded-lg border border-gray-700 text-left transition-colors"
            >
              <div className="text-purple-400 font-medium text-sm">Example 2</div>
              <div className="text-gray-300 text-xs mt-1">$5,000 at 8% APY (6 months)</div>
            </button>
            <button
              onClick={() => {
                setPrincipal('25000')
                setApy('15')
                setTimeframe('730')
              }}
              className="p-4 bg-gray-800 hover:bg-gray-750 rounded-lg border border-gray-700 text-left transition-colors"
            >
              <div className="text-green-400 font-medium text-sm">Example 3</div>
              <div className="text-gray-300 text-xs mt-1">$25,000 at 15% APY (2 years)</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 
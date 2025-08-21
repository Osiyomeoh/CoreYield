import React from 'react'

interface StatsOverviewProps {
  topFixedAPY: Array<{
    asset: string
    days: number
    apy: number
    icon: string
    protocol: string
  }>
  topNewMarkets: Array<{
    asset: string
    days: number
    volume: string
    icon: string
    protocol: string
  }>
  trendingMarkets: Array<{
    asset: string
    days: number
    apy: number
    icon: string
    protocol: string
  }>
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  topFixedAPY,
  topNewMarkets,
  trendingMarkets
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Top Fixed APY */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Stablecoin Top Fixed APY</h3>
          <button className="text-blue-400 hover:text-blue-300 text-sm">See All &gt;</button>
        </div>
        <div className="space-y-3">
          {topFixedAPY.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium">{item.asset}</p>
                  <p className="text-gray-400 text-xs">{item.days} days</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-green-400 font-bold">{item.apy}%</p>
                <p className="text-gray-400 text-xs">fixed APY</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top New Markets */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Stablecoin Top New Markets</h3>
          <button className="text-blue-400 hover:text-blue-300 text-sm">See All &gt;</button>
        </div>
        <div className="space-y-3">
          {topNewMarkets.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium">{item.asset}</p>
                  <p className="text-gray-400 text-xs">{item.days} days</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold">{item.volume}</p>
                <p className="text-gray-400 text-xs">24h volume</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Markets */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Trending Markets</h3>
          <button className="text-blue-400 hover:text-blue-300 text-sm">See All &gt;</button>
        </div>
        <div className="space-y-3">
          {trendingMarkets.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium">{item.asset}</p>
                  <p className="text-gray-400 text-xs">{item.days} days</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-green-400 font-bold">{item.apy}%</p>
                <p className="text-gray-400 text-xs">fixed APY</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
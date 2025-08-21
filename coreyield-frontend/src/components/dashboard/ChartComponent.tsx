import React, { useEffect, useState } from 'react'
import { LoadingSpinner } from './shared/LoadingSpinner'

interface ChartData {
  timestamp: number
  value: number
  metric: string
}

interface ChartComponentProps {
  data: ChartData[]
  metric: 'apy' | 'price' | 'volume'
  timeframe: string
  tokenType: string
  asset: string
}

export const ChartComponent: React.FC<ChartComponentProps> = ({
  data,
  metric,
  timeframe,
  tokenType,
  asset
}) => {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Generate mock data based on metric and timeframe
  useEffect(() => {
    setIsLoading(true)
    
    // Simulate backend data fetching
    const generateMockData = () => {
      const now = Date.now()
      const points = timeframe === '1m' ? 60 : timeframe === '1H' ? 24 : timeframe === '1D' ? 7 : 30
      const interval = timeframe === '1m' ? 60000 : timeframe === '1H' ? 3600000 : timeframe === '1D' ? 86400000 : 86400000
      
      const mockData: ChartData[] = []
      let baseValue = 0
      
      if (metric === 'apy') {
        baseValue = tokenType === 'YT' ? 8.5 : 6.2
      } else if (metric === 'price') {
        baseValue = 0.993
      } else if (metric === 'volume') {
        baseValue = 145000
      }
      
      for (let i = points; i >= 0; i--) {
        const timestamp = now - (i * interval)
        const volatility = 0.1
        const randomChange = (Math.random() - 0.5) * volatility
        const value = baseValue * (1 + randomChange)
        
        mockData.push({
          timestamp,
          value: Math.max(0, value),
          metric
        })
      }
      
      return mockData
    }
    
    // Simulate API delay
    setTimeout(() => {
      setChartData(generateMockData())
      setIsLoading(false)
    }, 500)
  }, [metric, timeframe, tokenType])

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <LoadingSpinner 
          size="lg" 
          variant="default" 
          color="blue" 
          text="Loading chart data..." 
        />
      </div>
    )
  }

  if (!chartData.length) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-sm">No data available</div>
        </div>
      </div>
    )
  }

  // Calculate chart statistics
  const values = chartData.map(d => d.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const currentValue = values[values.length - 1]
  const previousValue = values[values.length - 2] || currentValue
  const change = currentValue - previousValue
  const changePercent = (change / previousValue) * 100

  // Simple SVG chart rendering
  const chartWidth = 400
  const chartHeight = 200
  const padding = 40
  
  const xScale = (timestamp: number) => {
    const timeRange = chartData[chartData.length - 1].timestamp - chartData[0].timestamp
    return padding + ((timestamp - chartData[0].timestamp) / timeRange) * (chartWidth - 2 * padding)
  }
  
  const yScale = (value: number) => {
    const valueRange = maxValue - minValue
    return chartHeight - padding - ((value - minValue) / valueRange) * (chartHeight - 2 * padding)
  }

  // Generate SVG path for the chart line
  const generatePath = () => {
    if (chartData.length < 2) return ''
    
    let path = `M ${xScale(chartData[0].timestamp)} ${yScale(chartData[0].value)}`
    
    for (let i = 1; i < chartData.length; i++) {
      path += ` L ${xScale(chartData[i].timestamp)} ${yScale(chartData[i].value)}`
    }
    
    return path
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div>
          <div className="text-white font-medium text-lg">
            {metric.toUpperCase()} Chart
          </div>
          <div className="text-gray-400 text-sm">
            {tokenType} {asset} - {timeframe}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {metric === 'apy' ? `${currentValue.toFixed(2)}%` : 
             metric === 'price' ? `$${currentValue.toFixed(3)}` : 
             `$${(currentValue / 1000).toFixed(1)}K`}
          </div>
          <div className={`text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {change >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="flex-1 flex items-center justify-center">
        <svg width={chartWidth} height={chartHeight} className="w-full h-full">
          {/* Chart background */}
          <rect width={chartWidth} height={chartHeight} fill="transparent" />
          
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => (
            <g key={i}>
              <line
                x1={padding}
                y1={padding + (i * (chartHeight - 2 * padding)) / 4}
                x2={chartWidth - padding}
                y2={padding + (i * (chartHeight - 2 * padding)) / 4}
                stroke="#374151"
                strokeWidth="0.5"
                opacity="0.3"
              />
              <line
                x1={padding + (i * (chartWidth - 2 * padding)) / 4}
                y1={padding}
                x2={padding + (i * (chartWidth - 2 * padding)) / 4}
                y2={chartHeight - padding}
                stroke="#374151"
                strokeWidth="0.5"
                opacity="0.3"
              />
            </g>
          ))}
          
          {/* Chart line */}
          <path
            d={generatePath()}
            stroke="#3B82F6"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Area fill */}
          <path
            d={`${generatePath()} L ${xScale(chartData[chartData.length - 1].timestamp)} ${chartHeight - padding} L ${xScale(chartData[0].timestamp)} ${chartHeight - padding} Z`}
            fill="url(#gradient)"
            opacity="0.1"
          />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Data points */}
          {chartData.map((point, i) => (
            <circle
              key={i}
              cx={xScale(point.timestamp)}
              cy={yScale(point.value)}
              r="2"
              fill="#3B82F6"
              className="hover:r-3 transition-all duration-200"
            />
          ))}
        </svg>
      </div>

      {/* Chart Legend */}
      <div className="flex items-center justify-center space-x-6 mt-4 px-2">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-gray-400 text-xs">Current</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
          <span className="text-gray-400 text-xs">Historical</span>
        </div>
        <div className="text-gray-400 text-xs">
          {chartData.length} data points
        </div>
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'

interface LoadingScreenProps {
  onComplete: () => void
  isVisible: boolean
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete, isVisible }) => {
  const [progress, setProgress] = useState(0)
  const [loadingText, setLoadingText] = useState('Initializing CoreYield...')
  const [isComplete, setIsComplete] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ 
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1 
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const loadingSteps = [
      { progress: 5, text: 'Connecting to Core Network...' },
      { progress: 25, text: 'Loading smart contracts...' },
      { progress: 50, text: 'Initializing yield protocols...' },
      { progress: 75, text: 'Setting up trading interface...' },
      { progress: 100, text: 'Launching CoreYield...' }
    ]

    let currentStep = 0
    const interval = setInterval(() => {
      if (currentStep < loadingSteps.length) {
        const step = loadingSteps[currentStep]
        setProgress(step.progress)
        setLoadingText(step.text)
        currentStep++
      } else {
        clearInterval(interval)
        setIsComplete(true)
        // Intentional delay to ensure app fully loads (3-5 seconds total)
        setTimeout(() => {
          onComplete()
        }, 1000)
      }
    }, 1000) // 1 second between each step for 4-5 second total loading

    return () => clearInterval(interval)
  }, [isVisible, onComplete])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-gray-900 text-white z-50 overflow-hidden">
      {/* Same animated background as landing page but blurred */}
      <div className="fixed inset-0 pointer-events-none blur-sm opacity-40">
        {/* Flowing Networks */}
        <svg className="absolute inset-0 w-full h-full opacity-40 dark:opacity-60">
          <defs>
            <linearGradient id="networkGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="networkGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#10B981" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.4" />
            </linearGradient>
            <radialGradient id="pulseGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </radialGradient>
          </defs>
          
          {/* Dynamic flowing network paths */}
          <path
            d={`M 0,${250 + mousePosition.y * 60} Q ${300 + mousePosition.x * 120},${150 + mousePosition.y * 90} ${700 + mousePosition.x * 140},${200 + mousePosition.y * 70} T 1400,${130 + mousePosition.y * 50}`}
            stroke="url(#networkGradient1)"
            strokeWidth="3"
            fill="none"
            className="animate-pulse"
          />
          
          <path
            d={`M 0,${450 + mousePosition.y * 90} Q ${500 + mousePosition.x * 160},${350 + mousePosition.y * 110} ${900 + mousePosition.x * 90},${400 + mousePosition.y * 80} T 1400,${330 + mousePosition.y * 70}`}
            stroke="url(#networkGradient2)"
            strokeWidth="2.5"
            fill="none"
            className="animate-pulse"
            style={{ animationDelay: '1.5s' }}
          />

          {/* Additional intersecting paths for more complexity */}
          <path
            d={`M ${200 + mousePosition.x * 80},0 Q ${600 + mousePosition.x * 100},${300 + mousePosition.y * 120} ${400 + mousePosition.x * 60},${600 + mousePosition.y * 100} T ${800 + mousePosition.x * 40},800`}
            stroke="url(#networkGradient1)"
            strokeWidth="2"
            fill="none"
            opacity="0.6"
            className="animate-pulse"
            style={{ 
              animationDelay: '0.8s',
              animationDuration: '4s'
            }}
          />
          
          {/* Enhanced particle network */}
          {Array.from({length: 80}).map((_, i) => (
            <g key={i}>
              <circle
                cx={100 + (i % 12) * 120 + mousePosition.x * (i % 15)}
                cy={80 + Math.floor(i / 12) * 100 + mousePosition.y * (i % 10)}
                r="2"
                fill="#F59E0B"
                opacity="0.8"
                className="animate-pulse"
                style={{
                  animationDelay: `${i * 0.05}s`,
                  animationDuration: '2s'
                }}
              />
              {/* Connection lines between particles */}
              {i % 3 === 0 && (
                <line
                  x1={100 + (i % 12) * 120}
                  y1={80 + Math.floor(i / 12) * 100}
                  x2={100 + ((i + 1) % 12) * 120}
                  y2={80 + Math.floor((i + 1) / 12) * 100}
                  stroke="#3B82F6"
                  strokeWidth="1"
                  opacity="0.3"
                  className="animate-pulse"
                  style={{animationDelay: `${i * 0.1}s`}}
                />
              )}
            </g>
          ))}

          {/* Pulsing energy nodes */}
          {Array.from({length: 6}).map((_, i) => (
            <circle
              key={`node-${i}`}
              cx={200 + i * 200 + mousePosition.x * 20}
              cy={300 + (i % 2) * 200 + mousePosition.y * 15}
              r="40"
              fill="url(#pulseGradient)"
              className="animate-pulse"
              style={{
                animationDelay: `${i * 0.3}s`,
                animationDuration: '3s'
              }}
            />
          ))}
        </svg>

        {/* CoreYield Geometric Elements */}
        <div 
          className="absolute top-32 left-1/6 w-96 h-96 opacity-30 dark:opacity-50"
          style={{
            transform: `translate(${mousePosition.x * 40}px, ${mousePosition.y * 25}px)`,
          }}
        >
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <defs>
              <polygon id="hexagon" points="50,0 150,0 200,87 150,173 50,173 0,87" />
            </defs>
            
            <g className="animate-spin-slow" style={{transformOrigin: '200px 200px'}}>
              {Array.from({length: 7}).map((_, i) => (
                <use
                  key={i}
                  href="#hexagon"
                  x={100 + (i % 3) * 80}
                  y={50 + Math.floor(i / 3) * 100}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2"
                  opacity={0.6 - i * 0.08}
                  className="animate-pulse"
                  style={{
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </g>
            
            <circle cx="200" cy="200" r="15" fill="#F59E0B" className="animate-pulse" />
            <text x="200" y="208" textAnchor="middle" fill="#F59E0B" fontSize="16" fontWeight="bold" className="animate-pulse">Y</text>
          </svg>
        </div>

        {/* Right side diamond lattice */}
        <div 
          className="absolute top-40 right-1/6 w-80 h-80 opacity-25 dark:opacity-40"
          style={{
            transform: `translate(${mousePosition.x * -35}px, ${mousePosition.y * 40}px)`,
          }}
        >
          <svg viewBox="0 0 300 300" className="w-full h-full">
            <defs>
              <pattern id="diamondPattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 25,0 L 50,25 L 25,50 L 0,25 Z" fill="none" stroke="#EF4444" strokeWidth="1" opacity="0.7"/>
              </pattern>
            </defs>
            
            <rect width="300" height="300" fill="url(#diamondPattern)" />
            
            {/* Animated center diamonds */}
            {Array.from({length: 5}).map((_, i) => (
              <path
                key={i}
                d={`M ${150 + i * 5},${100 + i * 20} L ${180 + i * 5},${125 + i * 20} L ${150 + i * 5},${150 + i * 20} L ${120 + i * 5},${125 + i * 20} Z`}
                fill="none"
                stroke="#EF4444"
                strokeWidth="2"
                opacity={0.8 - i * 0.15}
                className="animate-pulse"
                style={{
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: '2.5s'
                }}
              />
            ))}
          </svg>
        </div>

        {/* Large background wave pattern */}
        <div 
          className="absolute bottom-20 left-1/2 w-[800px] h-[600px] opacity-15 dark:opacity-25 transform -translate-x-1/2"
          style={{
            transform: `translateX(-50%) translate(${mousePosition.x * 25}px, ${mousePosition.y * 20}px)`,
          }}
        >
          <svg viewBox="0 0 800 600" className="w-full h-full">
            <defs>
              <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            
            {/* Flowing wave patterns */}
            {Array.from({length: 8}).map((_, i) => (
              <path
                key={i}
                d={`M 0,${200 + i * 30} Q 200,${150 + i * 25} 400,${200 + i * 30} T 800,${200 + i * 30}`}
                stroke="url(#waveGradient)"
                strokeWidth="2"
                fill="none"
                opacity={0.7 - i * 0.08}
                className="animate-pulse"
                style={{
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '4s'
                }}
              />
            ))}
          </svg>
        </div>
      </div>

      {/* Loading Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="text-center">
          {/* Logo */}
          <div className="mb-8">
            <div className="relative group">
              <div className="w-24 h-24 bg-gray-800 rounded-2xl flex items-center justify-center transform transition-all duration-300 mx-auto mb-4 shadow-2xl border border-gray-700">
                <img src="/logo2.png" alt="CoreYield" className="w-12 h-12" />
                <div className="absolute inset-0 bg-gray-800 rounded-2xl blur-lg opacity-50"></div>
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-amber-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              CoreYield
            </h1>
            <p className="text-gray-400 text-lg">Next-Gen Yield Protocol</p>
          </div>

          {/* Progress Bar */}
          <div className="w-80 mx-auto mb-6">
            <div className="flex justify-between text-sm text-gray-300 mb-2">
              <span>Loading...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden backdrop-blur-sm">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 via-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Loading Text */}
          <div className="mb-8">
            <p className="text-white text-lg font-medium mb-2">{loadingText}</p>
            <div className="flex justify-center space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full animate-bounce ${
                    progress >= (i + 1) * 33 ? 'bg-amber-400' : 'bg-gray-500'
                  }`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>

          {/* Network Status */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 backdrop-blur-sm">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm font-medium">Connected to Core Network</span>
            </div>
            <p className="text-gray-400 text-xs">Chain ID: 1114 (Core Testnet)</p>
          </div>

          {/* Completion Animation */}
          {isComplete && (
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-blue-500/20 to-purple-500/20 flex items-center justify-center animate-pulse backdrop-blur-sm">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 via-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-white text-xl font-bold">Ready!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

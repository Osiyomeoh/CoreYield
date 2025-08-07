import React, { useState, useEffect, useRef } from 'react'
import { ThemeToggle } from './ThemeProvider'

interface LandingPageProps {
  onLaunchApp: () => void
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchApp }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [scrollY, setScrollY] = useState(0)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ 
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1 
      })
    }

    const handleScroll = () => setScrollY(window.scrollY)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white relative overflow-hidden transition-colors duration-300">
      {/* Enhanced Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* More Visible Flowing Networks */}
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
            style={{ 
              transform: `translateY(${scrollY * -0.4}px)`,
              transition: 'all 0.2s ease-out'
            }}
          />
          
          <path
            d={`M 0,${450 + mousePosition.y * 90} Q ${500 + mousePosition.x * 160},${350 + mousePosition.y * 110} ${900 + mousePosition.x * 90},${400 + mousePosition.y * 80} T 1400,${330 + mousePosition.y * 70}`}
            stroke="url(#networkGradient2)"
            strokeWidth="2.5"
            fill="none"
            className="animate-pulse"
            style={{ 
              transform: `translateY(${scrollY * -0.6}px)`,
              transition: 'all 0.2s ease-out',
              animationDelay: '1.5s'
            }}
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

        {/* Unique CoreYield Geometric Elements */}
        <div 
          className="absolute top-32 left-1/6 w-96 h-96 opacity-30 dark:opacity-50"
          style={{
            transform: `translate(${mousePosition.x * 40}px, ${mousePosition.y * 25}px) translateY(${scrollY * -0.5}px)`,
            transition: 'transform 0.2s ease-out'
          }}
        >
          <div className="relative w-full h-full">
            {/* CoreYield signature hexagonal pattern */}
            <div className="absolute inset-0">
              <svg viewBox="0 0 400 400" className="w-full h-full">
                <defs>
                  <polygon id="hexagon" points="50,0 150,0 200,87 150,173 50,173 0,87" />
                </defs>
                
                {/* Rotating hexagonal grid */}
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
                        animationDirection: i % 2 === 0 ? 'normal' : 'reverse'
                      }}
                    />
                  ))}
                </g>
                
                {/* Central yield symbol */}
                <circle cx="200" cy="200" r="15" fill="#F59E0B" className="animate-pulse" />
                <text x="200" y="208" textAnchor="middle" fill="#F59E0B" fontSize="16" fontWeight="bold" className="animate-pulse">Y</text>
              </svg>
            </div>
          </div>
        </div>

        {/* Right side diamond lattice */}
        <div 
          className="absolute top-40 right-1/6 w-80 h-80 opacity-25 dark:opacity-40"
          style={{
            transform: `translate(${mousePosition.x * -35}px, ${mousePosition.y * 40}px) translateY(${scrollY * -0.7}px)`,
            transition: 'transform 0.2s ease-out'
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
            transform: `translateX(-50%) translate(${mousePosition.x * 25}px, ${mousePosition.y * 20}px) translateY(${scrollY * -0.3}px)`,
            transition: 'transform 0.2s ease-out'
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

      {/* Header */}
      <header className="relative z-50 p-6">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
                <span className="text-white font-bold text-lg">CY</span>
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-blue-500 to-purple-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-80 transition-opacity duration-300"></div>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-amber-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                CoreYield
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Next-Gen Yield Protocol</p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#protocol" className="text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors font-medium">
                Protocol
              </a>
              <a href="#assets" className="text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors font-medium">
                Assets
              </a>
              <a href="#metrics" className="text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors font-medium">
                Metrics
              </a>
            </nav>
            <ThemeToggle />
            <button
              onClick={onLaunchApp}
              className="group relative px-8 py-3 bg-gradient-to-r from-amber-500 via-blue-500 to-purple-600 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden"
            >
              <span className="relative z-10">Launch Protocol</span>
              <div className="absolute inset-0 bg-white/20 transform translate-x-full group-hover:translate-x-0 transition-transform duration-500 skew-x-12"></div>
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section ref={heroRef} className="relative z-10 px-6 pt-20 pb-20 text-center">
        <div className="max-w-6xl mx-auto">
          {/* Main Headline with more visible background */}
          <div className="mb-16 animate-fadeInUp relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-200/20 via-blue-200/20 to-purple-200/20 dark:from-amber-900/20 dark:via-blue-900/20 dark:to-purple-900/20 rounded-3xl blur-3xl"></div>
            
            <div className="relative">
              <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight">
                <span className="block bg-gradient-to-r from-amber-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                  Tokenize
                </span>
                <span className="block bg-gradient-to-r from-purple-600 via-blue-600 to-amber-600 bg-clip-text text-transparent">
                  Future Returns
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
                Transform your yield-bearing assets into tradeable tokens and unlock advanced DeFi strategies on Core blockchain
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-24 animate-fadeInUp" style={{animationDelay: '400ms'}}>
            <button
              onClick={onLaunchApp}
              className="group relative px-12 py-4 bg-gradient-to-r from-amber-500 via-blue-500 to-purple-600 text-white rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden"
            >
              <span className="relative z-10">Start Earning</span>
              <div className="absolute inset-0 bg-white/20 transform translate-x-full group-hover:translate-x-0 transition-transform duration-700 skew-x-12"></div>
            </button>

            <button className="group flex items-center space-x-2 px-12 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold text-lg hover:text-gray-900 dark:hover:text-white hover:border-gray-500 dark:hover:border-gray-400 transition-all duration-300 rounded-2xl hover:shadow-lg">
              <span>Learn More</span>
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section id="metrics" className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-amber-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              PROTOCOL METRICS
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">Real-time data from CoreYield Protocol</p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              { value: "$ 2.14 M", label: "Total Value Locked", gradient: "from-amber-500 to-orange-400", icon: "🔒" },
              { value: "$ 8.92 M", label: "Trading Volume", gradient: "from-blue-500 to-cyan-400", icon: "📊" },
              { value: "$ 1.85 M", label: "Yield Generated", gradient: "from-purple-500 to-pink-400", icon: "💰" }
            ].map((stat, i) => (
              <div
                key={i}
                className="group relative p-8 bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-3xl backdrop-blur-sm hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-500 hover:-translate-y-2 shadow-lg hover:shadow-2xl"
                style={{animationDelay: `${i * 200}ms`}}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-500`}></div>
                
                <div className="relative z-10 text-center">
                  <div className="text-4xl mb-4">{stat.icon}</div>
                  <div className={`text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                    {stat.value}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 text-lg font-medium">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Second Row Stats */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { value: "3", label: "Core Ecosystem Partners", icon: "🤝" },
              { value: "12", label: "Active Markets", icon: "🏪" },
              { value: "2,470", label: "Unique Users", icon: "👥" }
            ].map((stat, i) => (
              <div
                key={i}
                className="group relative p-8 bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-3xl backdrop-blur-sm hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-500 hover:-translate-y-2 shadow-lg hover:shadow-2xl"
                style={{animationDelay: `${(i + 3) * 200}ms`}}
              >
                <div className="relative z-10 text-center">
                  <div className="text-4xl mb-4">{stat.icon}</div>
                  <div className="text-4xl md:text-5xl font-bold mb-3 text-gray-900 dark:text-white">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 text-lg font-medium">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 bg-gradient-to-r from-amber-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            POWERED BY CORE ECOSYSTEM
          </h2>
          
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60">
            {[
              "CORE DAO", "BTCS", "COREDAO LABS", "CORE FOUNDATION", "SATOSHI PROTOCOL"
            ].map((partner, i) => (
              <div
                key={i}
                className="text-2xl font-bold text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors duration-300 cursor-default"
                style={{animationDelay: `${i * 100}ms`}}
              >
                {partner}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Protocol Section */}
      <section id="protocol" className="relative z-10 px-6 py-32">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-amber-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              HOW COREYIELD WORKS
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Revolutionary yield tokenization technology built for the Core blockchain ecosystem
            </p>
          </div>

          {/* Single Protocol Showcase */}
          <div className="text-center">
            <div className="relative mb-12">
              {/* Unique CoreYield Visualization */}
              <div className="w-96 h-96 mx-auto relative">
                <div className="absolute inset-0">
                  <svg viewBox="0 0 400 400" className="w-full h-full">
                    <defs>
                      <linearGradient id="coreGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.9" />
                        <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.7" />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.5" />
                      </linearGradient>
                    </defs>
                    
                    {/* Central yield tokenization core */}
                    <circle cx="200" cy="200" r="80" fill="url(#coreGradient)" className="animate-pulse" />
                    
                    {/* Orbiting asset tokens */}
                    {Array.from({length: 6}).map((_, i) => (
                      <g key={i} className="animate-spin-slow" style={{transformOrigin: '200px 200px', animationDuration: `${10 + i * 2}s`}}>
                        <circle
                          cx={200 + 140 * Math.cos((i * Math.PI * 2) / 6)}
                          cy={200 + 140 * Math.sin((i * Math.PI * 2) / 6)}
                          r="25"
                          fill="none"
                          stroke="#F59E0B"
                          strokeWidth="3"
                          className="animate-pulse"
                          style={{animationDelay: `${i * 0.3}s`}}
                        />
                        <text
                          x={200 + 140 * Math.cos((i * Math.PI * 2) / 6)}
                          y={200 + 140 * Math.sin((i * Math.PI * 2) / 6) + 5}
                          textAnchor="middle"
                          fill="#F59E0B"
                          fontSize="14"
                          fontWeight="bold"
                        >
                          SY
                        </text>
                      </g>
                    ))}
                    
                    {/* Connection lines */}
                    {Array.from({length: 6}).map((_, i) => (
                      <line
                        key={i}
                        x1="200"
                        y1="200"
                        x2={200 + 140 * Math.cos((i * Math.PI * 2) / 6)}
                        y2={200 + 140 * Math.sin((i * Math.PI * 2) / 6)}
                        stroke="#3B82F6"
                        strokeWidth="2"
                        opacity="0.5"
                        className="animate-pulse"
                        style={{animationDelay: `${i * 0.2}s`}}
                      />
                    ))}
                    
                    {/* Center label */}
                    <text x="200" y="205" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">
                      CORE
                    </text>
                  </svg>
                </div>
              </div>
            </div>

            <h3 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
              <span className="bg-gradient-to-r from-amber-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                CoreYield Protocol
              </span>
            </h3>

            <p className="text-gray-600 dark:text-gray-300 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
              Deposit your yield-bearing assets and receive SY tokens that represent your future yield. 
              Trade, leverage, or hold — unlock the full potential of your DeFi positions.
            </p>

            <div className="flex gap-6 justify-center">
              <button
                onClick={onLaunchApp}
                className="px-10 py-4 bg-gradient-to-r from-amber-500 via-blue-500 to-purple-600 hover:from-amber-600 hover:via-blue-600 hover:to-purple-700 text-white rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-2xl"
              >
                Try CoreYield
              </button>
              <button className="px-10 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:border-gray-500 dark:hover:border-gray-400 rounded-2xl font-semibold transition-all duration-300 hover:shadow-lg">
                Read Docs
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-16 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">CY</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-amber-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                    CoreYield Protocol
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tokenizing the future of yield</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 max-w-md leading-relaxed">
                The first advanced yield tokenization protocol built specifically for Core blockchain, 
                enabling sophisticated DeFi strategies through innovative token mechanics.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Protocol</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors text-sm">Documentation</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors text-sm">Whitepaper</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors text-sm">Security</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors text-sm">Governance</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Community</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors text-sm">Discord</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors text-sm">Twitter</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors text-sm">Telegram</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors text-sm">GitHub</a></li>
              </ul>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <button
                onClick={onLaunchApp}
                className="px-6 py-2 bg-gradient-to-r from-amber-500 via-blue-500 to-purple-600 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105"
              >
                Launch Protocol
              </button>
            </div>

            <div className="flex items-center space-x-4">
              {/* Social Icons */}
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>


    </div>
  )
}
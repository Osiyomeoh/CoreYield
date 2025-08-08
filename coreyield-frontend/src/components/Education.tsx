import React, { useState } from 'react'
import { ASSET_METADATA } from '../../contracts/addresses'

interface EducationProps {
  onBackToLanding?: () => void
  onLaunchApp?: () => void
  onBackToDashboard?: () => void
  isStandalone?: boolean
  onOpenMobileMenu?: () => void
}

type LearningLevel = 'beginner' | 'intermediate' | 'advanced'

interface StoryCharacter {
  name: string
  avatar: string
  background: string
  goal: string
  journey: string[]
}

export const Education: React.FC<EducationProps> = ({ 
  onBackToLanding, 
  onLaunchApp, 
  onBackToDashboard,
  isStandalone = false,
  onOpenMobileMenu
}) => {
  const [selectedLevel, setSelectedLevel] = useState<LearningLevel>('beginner')
  const [currentPage, setCurrentPage] = useState(0)
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null)
  const [calculatorInputs, setCalculatorInputs] = useState({
    initialAmount: 1000,
    apy: 12.1,
    timePeriod: 12,
    monthlyContribution: 100
  })
  // Removed unused simulationResults state
  const [isAnimating, setIsAnimating] = useState(false)

  // Real people storylines
  const characters: StoryCharacter[] = [
    {
      name: "Sarah Chen",
      avatar: "👩‍💼",
      background: "Software Engineer, 28, wants to grow her savings",
      goal: "Earn passive income while learning DeFi",
      journey: [
        "Sarah has $5,000 in savings and wants to earn more than traditional banks offer",
        "She discovers CoreYield and learns about yield farming",
        "Sarah starts with $1,000 in stCORE to test the waters",
        "After 3 months, she's earning 8.5% APY and decides to invest more",
        "Sarah diversifies into lstBTC and dualCORE for better returns",
        "One year later, Sarah has earned $1,200 in yield and is a DeFi expert!"
      ]
    },
    {
      name: "Marcus Rodriguez",
      avatar: "👨‍💻",
      background: "Crypto enthusiast, 32, experienced trader",
      goal: "Maximize yield through advanced strategies",
      journey: [
        "Marcus has been trading crypto for 3 years and wants to optimize his portfolio",
        "He researches CoreYield's advanced yield generation mechanisms",
        "Marcus implements dollar-cost averaging with $500 monthly deposits",
        "He uses the yield calculator to project his earnings over 5 years",
        "Marcus rebalances his portfolio based on APY changes",
        "His optimized strategy earns him 15% more than basic yield farming!"
      ]
    },
    {
      name: "Aisha Patel",
      avatar: "👩‍🎓",
      background: "Finance student, 22, learning about DeFi",
      goal: "Understand the technical aspects of yield protocols",
      journey: [
        "Aisha is studying finance and wants to understand DeFi protocols",
        "She dives deep into CoreYield's smart contract architecture",
        "Aisha learns about SY tokens and yield calculation mechanics",
        "She experiments with gas optimization strategies",
        "Aisha builds a portfolio tracking spreadsheet",
        "She becomes a DeFi educator and helps others understand yield farming!"
      ]
    }
  ]

  const learningContent = {
    beginner: {
      title: "Beginner's Guide to Yield Farming",
      description: "Learn the basics of DeFi and yield farming through real stories",
      pages: [
        {
          title: "Meet Our Learners",
          type: "story-intro",
          content: "Follow real people as they learn yield farming with CoreYield"
        },
        {
          title: "What is Yield Farming?",
          type: "lesson",
          content: `Yield farming is a way to earn passive income by providing liquidity to DeFi protocols. Think of it like earning interest on your savings, but with much higher potential returns.

When you deposit your assets into a yield farming protocol, you're essentially lending them to the protocol, which then uses them to generate yield through various strategies like lending, trading, or staking.`,
          icon: "🌱"
        },
        {
          title: "Sarah's Journey: Getting Started",
          type: "story",
          character: characters[0],
          content: "Follow Sarah as she discovers yield farming and makes her first investment"
        },
        {
          title: "Understanding CoreYield Protocol",
          type: "lesson",
          content: `CoreYield is a yield farming protocol built on the Core blockchain that allows you to earn yield on your assets by depositing them into standardized yield tokens (SY tokens).

The protocol automatically manages your assets and generates yield through various strategies, while you simply hold SY tokens that represent your share of the yield-generating pool.`,
          icon: "⚡"
        },
        {
          title: "Yield Calculator",
          type: "calculator",
          content: "Calculate your potential earnings with our interactive calculator"
        },
        {
          title: "Key Concepts",
          type: "lesson",
          content: `• **Assets**: The tokens you deposit (stCORE, lstBTC, dualCORE)
• **SY Tokens**: Standardized yield tokens that represent your share
• **APY**: Annual Percentage Yield - the rate at which you earn yield
• **Liquidity**: How easily you can withdraw your funds
• **Risk**: The potential for loss vs. the potential for gain`,
          icon: "📚"
        },
        {
          title: "Why Choose CoreYield?",
          type: "lesson",
          content: `• **High APY**: Earn up to 15% annual yield
• **Instant Liquidity**: Withdraw your funds anytime
• **Security**: Audited smart contracts
• **Simplicity**: Easy-to-use interface
• **Transparency**: All transactions are on-chain`,
          icon: "🎯"
        }
      ]
    },
    intermediate: {
      title: "Intermediate: Advanced Yield Strategies",
      description: "Dive deeper into yield farming mechanics and strategies",
      pages: [
        {
          title: "Marcus's Strategy",
          type: "story",
          character: characters[1],
          content: "Learn advanced strategies from Marcus's experience"
        },
        {
          title: "How SY Tokens Work",
          type: "lesson",
          content: `SY (Standardized Yield) tokens are ERC-20 tokens that represent your share of a yield-generating pool. When you deposit assets, you receive SY tokens in return.

The value of your SY tokens increases over time as the underlying assets generate yield. You can:
• Hold SY tokens to earn yield
• Trade SY tokens on DEXs
• Use SY tokens as collateral for loans
• Claim accumulated yield anytime`,
          icon: "🪙"
        },
        {
          title: "Advanced Calculator",
          type: "advanced-calculator",
          content: "Calculate compound interest and portfolio optimization"
        },
                            {
                      title: "Yield Generation Mechanisms",
                      type: "lesson",
                      content: `CoreYield generates yield through multiple strategies:

• **Staking Rewards**: Earning rewards from staking CORE tokens
• **MEV Extraction**: Capturing value from blockchain transactions
• **Liquidity Provision**: Providing liquidity to DEXs for trading fees
• **Lending**: Earning interest from lending assets
• **Arbitrage**: Profiting from price differences across exchanges`,
                      icon: "📈"
                    },
        {
          title: "Portfolio Simulation",
          type: "simulation",
          content: "Simulate different investment strategies and see the results"
        },
                            {
                      title: "Risk Management",
                      type: "lesson",
                      content: `While yield farming can be profitable, it comes with risks:

• **Smart Contract Risk**: Bugs or exploits in the protocol
• **Impermanent Loss**: Loss from providing liquidity to volatile assets
• **Market Risk**: Asset prices can decrease
• **Liquidity Risk**: Difficulty withdrawing during market stress
• **APY Volatility**: Yield rates can change over time

Always diversify your investments and never invest more than you can afford to lose.`,
                      icon: "⚠️"
                    },
                            {
                      title: "Advanced Strategies",
                      type: "lesson",
                      content: `• **Dollar-Cost Averaging**: Invest small amounts regularly
• **Rebalancing**: Adjust your portfolio based on performance
• **Yield Optimization**: Move funds to higher-yielding assets
• **Tax Efficiency**: Consider tax implications of frequent trading
• **Portfolio Diversification**: Spread risk across multiple assets`,
                      icon: "🎛️"
                    }
      ]
    },
    advanced: {
      title: "Advanced: Protocol Mechanics & Optimization",
      description: "Master the technical aspects and optimization strategies",
      pages: [
        {
          title: "Aisha's Deep Dive",
          type: "story",
          character: characters[2],
          content: "Follow Aisha as she explores the technical aspects"
        },
                            {
                      title: "Smart Contract Architecture",
                      type: "lesson",
                      content: `CoreYield uses a sophisticated smart contract architecture:

• **CoreYieldFactory**: Creates and manages SY token markets
• **StandardizedYieldToken**: The SY token contract with yield tracking
• **Mock Assets**: Test tokens for stCORE, lstBTC, and dualCORE
• **Yield Calculation**: Real-time yield accumulation and distribution
• **Gas Optimization**: Efficient contract design for lower transaction costs`,
                      icon: "🏗️"
                    },
        {
          title: "Gas Cost Simulator",
          type: "gas-simulator",
          content: "Simulate gas costs for different transaction strategies"
        },
                            {
                      title: "Yield Calculation Mechanics",
                      type: "lesson",
                      content: `Yield is calculated using a sophisticated algorithm:

• **Accumulated Yield**: Tracks total yield earned per user
• **Yield Rate**: Dynamic APY based on protocol performance
• **Compounding**: Yield can be reinvested for compound growth
• **Distribution**: Yield is distributed proportionally to SY token holders
• **Real-time Updates**: Yield calculations update with each block`,
                      icon: "🧮"
                    },
                            {
                      title: "Gas Optimization Strategies",
                      type: "lesson",
                      content: `Minimize transaction costs with these strategies:

• **Batch Transactions**: Combine multiple operations
• **Optimal Timing**: Execute during low gas periods
• **Efficient Approvals**: Use infinite approvals when safe
• **Smart Routing**: Choose optimal transaction paths
• **MEV Protection**: Protect against front-running`,
                      icon: "⛽"
                    },
                            {
                      title: "Protocol Integration",
                      type: "lesson",
                      content: `CoreYield integrates with the broader DeFi ecosystem:

• **DEX Integration**: Trade SY tokens on decentralized exchanges
• **Lending Protocols**: Use SY tokens as collateral
• **Yield Aggregators**: Automate yield optimization
• **Cross-chain Bridges**: Move assets between blockchains
• **API Access**: Programmatic access to protocol data`,
                      icon: "🔗"
                    }
      ]
    }
  }

  const currentContent = learningContent[selectedLevel]
  const currentPageData = currentContent.pages[currentPage]
  const totalPages = currentContent.pages.length

  // Calculate yield projections
  const calculateYield = () => {
    const { initialAmount, apy, timePeriod, monthlyContribution } = calculatorInputs
    const monthlyRate = apy / 100 / 12
    let balance = initialAmount
    const projections = []

    for (let month = 1; month <= timePeriod; month++) {
      const monthlyYield = balance * monthlyRate
      balance += monthlyYield + monthlyContribution
      projections.push({
        month,
        balance: balance.toFixed(2),
        yield: monthlyYield.toFixed(2),
        totalYield: (balance - initialAmount - (monthlyContribution * month)).toFixed(2)
      })
    }

    return projections
  }

  // Gas cost simulation
  const simulateGasCosts = () => {
    const gasPrices = [20, 30, 50, 100, 200] // gwei
    const operations = [
      { name: 'Approve', gas: 46000 },
      { name: 'Deposit', gas: 120000 },
      { name: 'Claim Yield', gas: 85000 },
      { name: 'Withdraw', gas: 95000 }
    ]

    return operations.map(op => ({
      operation: op.name,
      costs: gasPrices.map(price => ({
        gasPrice: price,
        cost: (op.gas * price * 0.000000001 * 2000).toFixed(4) // ETH price $2000
      }))
    }))
  }

  const handlePageChange = (newPage: number) => {
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentPage(newPage)
      setIsAnimating(false)
    }, 200)
  }

  const handleLevelChange = (newLevel: LearningLevel) => {
    setIsAnimating(true)
    setTimeout(() => {
      setSelectedLevel(newLevel)
      setCurrentPage(0)
      setIsAnimating(false)
    }, 200)
  }

  const renderPageContent = () => {
    switch (currentPageData.type) {
      case 'story-intro':
        return (
          <div className={`text-center space-y-8 transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            <div className="mb-8">
              <h3 className="text-4xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Meet Our Learners
              </h3>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Follow real people as they learn yield farming with CoreYield
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {characters.map((character, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedCharacter(character)}
                  className="group relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-500 cursor-pointer transform hover:scale-105 hover:shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-300">{character.avatar}</div>
                    <h4 className="text-2xl font-bold text-white mb-3">{character.name}</h4>
                    <p className="text-gray-400 text-sm mb-4 leading-relaxed">{character.background}</p>
                    <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-3">
                      <p className="text-blue-300 text-sm font-medium">{character.goal}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'story':
        const character = currentPageData.character || selectedCharacter
        if (!character) return null

        return (
          <div className={`space-y-8 transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            <div className="flex items-center space-x-6 mb-8">
              <div className="text-6xl transform hover:scale-110 transition-transform duration-300">{character.avatar}</div>
              <div>
                <h3 className="text-3xl font-bold text-white mb-2">{character.name}'s Journey</h3>
                <p className="text-gray-400 text-lg">{character.background}</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700/50">
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 mb-6">
                <h4 className="text-xl font-semibold text-blue-300 mb-2">Goal</h4>
                <p className="text-white text-lg">{character.goal}</p>
              </div>
              <div className="space-y-6">
                {character.journey.map((step: string, index: number) => (
                  <div key={index} className="flex items-start space-x-6 p-6 bg-gray-800/50 rounded-xl border border-gray-700/30 hover:border-blue-500/30 transition-all duration-300 transform hover:scale-[1.02]">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-gray-200 leading-relaxed text-lg">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'calculator':
        const projections = calculateYield()
        return (
          <div className={`space-y-8 transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-white mb-4">Yield Calculator</h3>
              <p className="text-gray-400 text-lg">Calculate your potential earnings with our interactive calculator</p>
            </div>
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700/50">
                <h4 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <span className="mr-3">📊</span>
                  Input Parameters
                </h4>
                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-300 text-sm mb-3 font-medium">Initial Investment ($)</label>
                    <input
                      type="number"
                      value={calculatorInputs.initialAmount}
                      onChange={(e) => setCalculatorInputs(prev => ({ ...prev, initialAmount: Number(e.target.value) }))}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white text-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-3 font-medium">APY (%)</label>
                    <input
                      type="number"
                      value={calculatorInputs.apy}
                      onChange={(e) => setCalculatorInputs(prev => ({ ...prev, apy: Number(e.target.value) }))}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white text-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-3 font-medium">Time Period (months)</label>
                    <input
                      type="number"
                      value={calculatorInputs.timePeriod}
                      onChange={(e) => setCalculatorInputs(prev => ({ ...prev, timePeriod: Number(e.target.value) }))}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white text-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-3 font-medium">Monthly Contribution ($)</label>
                    <input
                      type="number"
                      value={calculatorInputs.monthlyContribution}
                      onChange={(e) => setCalculatorInputs(prev => ({ ...prev, monthlyContribution: Number(e.target.value) }))}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white text-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700/50">
                <h4 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <span className="mr-3">📈</span>
                  Projections
                </h4>
                <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                  {projections.map((proj, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-gray-800/50 rounded-xl border border-gray-700/30 hover:border-blue-500/30 transition-all duration-200">
                      <span className="text-gray-300 font-medium">Month {proj.month}</span>
                      <div className="text-right">
                        <div className="text-white font-semibold text-lg">${proj.balance}</div>
                        <div className="text-green-400 text-sm">+${proj.yield}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl">
                  <div className="text-green-400 font-bold text-xl">
                    Total Yield: ${projections[projections.length - 1]?.totalYield || '0'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'simulation':
        return (
          <div className={`space-y-8 transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-white mb-4">Portfolio Simulation</h3>
              <p className="text-gray-400 text-lg">Simulate different investment strategies and see the results</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {Object.entries(ASSET_METADATA).map(([key, asset]) => (
                <div key={key} className="group bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-500 transform hover:scale-105">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                      <span className="text-white font-bold text-lg">{asset.symbol.slice(0, 2)}</span>
                    </div>
                    <div>
                      <div className="text-white font-bold text-xl">{asset.symbol}</div>
                      <div className="text-green-400 font-semibold text-lg">{asset.apy}% APY</div>
                    </div>
                  </div>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                      <span className="text-gray-400">Risk Level</span>
                      <span className="text-orange-400 font-semibold">{asset.risk}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                      <span className="text-gray-400">Maturity</span>
                      <span className="text-blue-400 font-semibold">{asset.maturity}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl">
                    <div className="text-blue-300 text-center font-semibold">
                      Simulated 1-year return: ${(1000 * asset.apy / 100).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'gas-simulator':
        const gasCosts = simulateGasCosts()
        return (
          <div className={`space-y-8 transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-white mb-4">Gas Cost Simulator</h3>
              <p className="text-gray-400 text-lg">Simulate gas costs for different transaction strategies</p>
            </div>
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700/50">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left text-gray-300 py-4 px-4 font-semibold">Operation</th>
                      {[20, 30, 50, 100, 200].map(price => (
                        <th key={price} className="text-right text-gray-300 py-4 px-4 font-semibold">{price} gwei</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gasCosts.map((op, index) => (
                      <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors duration-200">
                        <td className="text-white py-4 px-4 font-medium">{op.operation}</td>
                        {op.costs.map((cost, costIndex) => (
                          <td key={costIndex} className="text-right text-gray-300 py-4 px-4">
                            ${cost.cost}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className={`flex items-start space-x-6 mb-6 transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
              {currentPageData.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-3xl font-bold text-white mb-4">{currentPageData.title}</h3>
              <div className="prose prose-invert max-w-none">
                <div className="text-gray-200 leading-relaxed text-lg">
                  {currentPageData.content.split('\n').map((line, index) => {
                    // Handle lines that start with ** and end with ** (standalone bold terms)
                    if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
                      const text = line.trim().slice(2, -2)
                      return (
                        <div key={index} className="mb-3">
                          <span className="font-bold text-blue-400">{text}</span>
                        </div>
                      )
                    } 
                    // Handle bullet points with bold terms: • **Term**: Description
                    else if (line.includes('• **') && line.includes('**:')) {
                      const match = line.match(/• \*\*(.*?)\*\*: (.*)/)
                      if (match) {
                        return (
                          <div key={index} className="flex items-start space-x-2 mb-2">
                            <span className="text-blue-400 mt-1">•</span>
                            <div>
                              <span className="font-semibold text-blue-300">{match[1]}</span>
                              <span className="text-gray-300">: {match[2]}</span>
                            </div>
                          </div>
                        )
                      }
                    }
                    // Handle regular bullet points: • Description
                    else if (line.trim().startsWith('• ')) {
                      return (
                        <div key={index} className="flex items-start space-x-2 mb-2">
                          <span className="text-blue-400 mt-1">•</span>
                          <span className="text-gray-300">{line.trim().slice(2)}</span>
                        </div>
                      )
                    }
                    // Handle empty lines
                    else if (line.trim() === '') {
                      return <div key={index} className="h-4"></div>
                    }
                    // Handle regular text with potential bold terms
                    else {
                      // Process any remaining ** terms in regular text
                      const processedLine = line.replace(/\*\*(.*?)\*\*/g, (_, text) => {
                        return `<span class="font-bold text-blue-400">${text}</span>`
                      })
                      
                      return (
                        <div key={index} className="mb-3 text-gray-200" 
                             dangerouslySetInnerHTML={{ __html: processedLine }} />
                      )
                    }
                  })}
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              {isStandalone && onBackToLanding && (
                <button onClick={onBackToLanding} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-teal-500 rounded-2xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">CY</span>
                  </div>
                  <span className="text-white font-semibold text-xl">CoreYield</span>
                </button>
              )}
              
                                        <div>
                            <h1 className="text-3xl font-bold text-white">Education Center</h1>
                            <p className="text-gray-400">Master yield farming and CoreYield protocol</p>
                          </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              {onOpenMobileMenu && (
                <button
                  onClick={onOpenMobileMenu}
                  className="fixed top-4 left-4 w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-white border border-gray-700 z-40"
                >
                  ☰
                </button>
              )}
              
                                        {onBackToDashboard && (
                            <button
                              onClick={onBackToDashboard}
                              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                            >
                              ← Back to Dashboard
                            </button>
                          )}
                          {onLaunchApp && (
                            <button
                              onClick={onLaunchApp}
                              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                            >
                              Launch App
                            </button>
                          )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Learning Level Selector */}
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-2 bg-gray-800/50 backdrop-blur-sm rounded-2xl p-2 border border-gray-700/50">
            {(['beginner', 'intermediate', 'advanced'] as LearningLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => handleLevelChange(level)}
                className={`px-4 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 sm:space-x-3 transform hover:scale-105 w-full sm:w-auto ${
                  selectedLevel === level
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <span className="text-lg sm:text-xl">
                  {level === 'beginner' ? '🌱' : level === 'intermediate' ? '📚' : '🎓'}
                </span>
                <span className="capitalize text-base sm:text-lg">{level}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 font-medium">Progress</span>
            <span className="text-gray-400 font-medium">{currentPage + 1} / {totalPages}</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Learning Content */}
        <div className="space-y-12">
          {/* Level Header */}
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {currentContent.title}
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">{currentContent.description}</p>
          </div>

          {/* Page Content */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-3xl p-12 border border-gray-700/50 min-h-96">
            {renderPageContent()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="flex items-center space-x-3 px-8 py-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Previous</span>
            </button>

            <div className="flex items-center space-x-3">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i)}
                  className={`w-4 h-4 rounded-full transition-all duration-200 transform hover:scale-125 ${
                    i === currentPage ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => handlePageChange(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-800 disabled:opacity-50 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <span>Next</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Interactive Elements */}
          {currentPage === 0 && selectedLevel === 'beginner' && (
            <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-3xl p-12 border border-blue-600/30 backdrop-blur-sm">
              <h3 className="text-3xl font-bold text-white mb-6 text-center">🚀 Ready to Start?</h3>
              <p className="text-gray-300 text-xl mb-8 text-center max-w-2xl mx-auto leading-relaxed">
                Now that you understand the basics, you're ready to start earning yield with CoreYield!
              </p>
              <div className="flex items-center justify-center space-x-6">
                {onLaunchApp && (
                  <button
                    onClick={onLaunchApp}
                    className="px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Start Investing Now
                  </button>
                )}
                <button
                  onClick={() => handlePageChange(1)}
                  className="px-10 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  Continue Learning
                </button>
              </div>
            </div>
          )}

          {currentPage === totalPages - 1 && selectedLevel === 'intermediate' && (
            <div className="bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-3xl p-12 border border-purple-600/30 backdrop-blur-sm">
              <h3 className="text-3xl font-bold text-white mb-6 text-center">📚 Ready for Advanced Topics?</h3>
              <p className="text-gray-300 text-xl mb-8 text-center max-w-2xl mx-auto leading-relaxed">
                Master the technical aspects and optimization strategies to maximize your yield.
              </p>
              <div className="flex items-center justify-center space-x-6">
                <button
                  onClick={() => handleLevelChange('advanced')}
                  className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Advanced Topics
                </button>
                {onLaunchApp && (
                  <button
                    onClick={onLaunchApp}
                    className="px-10 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                  >
                    Apply Knowledge
                  </button>
                )}
              </div>
            </div>
          )}

          {currentPage === totalPages - 1 && selectedLevel === 'advanced' && (
            <div className="bg-gradient-to-br from-green-600/10 to-teal-600/10 rounded-3xl p-12 border border-green-600/30 backdrop-blur-sm">
              <h3 className="text-3xl font-bold text-white mb-6 text-center">🎓 You're a CoreYield Expert!</h3>
              <p className="text-gray-300 text-xl mb-8 text-center max-w-2xl mx-auto leading-relaxed">
                You now have comprehensive knowledge of the CoreYield protocol. Time to put your expertise to work!
              </p>
              <div className="flex items-center justify-center space-x-6">
                {onLaunchApp && (
                  <button
                    onClick={onLaunchApp}
                    className="px-10 py-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Start Optimizing
                  </button>
                )}
                <button
                  onClick={() => handleLevelChange('beginner')}
                  className="px-10 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  Review Basics
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <div className="flex flex-col space-y-4">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center"
              title="Back to Dashboard"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
          )}
          {onLaunchApp && (
            <button
              onClick={onLaunchApp}
              className="w-14 h-14 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center"
              title="Launch App"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
} 
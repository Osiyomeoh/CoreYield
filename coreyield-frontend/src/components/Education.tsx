import React, { useState } from 'react'
import { ASSET_METADATA } from '../../contracts/addresses'

interface EducationProps {
  onBackToLanding?: () => void
  onLaunchApp?: () => void
  onBackToDashboard?: () => void
  isStandalone?: boolean
  onOpenMobileMenu?: () => void
}

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
  const [currentPage, setCurrentPage] = useState(0)
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null)
  const [calculatorInputs, setCalculatorInputs] = useState({
    initialAmount: 1000,
    apy: 12.1,
    timePeriod: 12,
    monthlyContribution: 100
  })
  const [isAnimating, setIsAnimating] = useState(false)

  const characters: StoryCharacter[] = [
    {
      name: "Sarah Chen",
      avatar: "👩‍💼",
      background: "Software Engineer, 28, wants to grow her savings",
      goal: "Earn passive income through CoreYield's yield farming",
      journey: [
        "Sarah has $5,000 in savings and wants to earn more than traditional banks offer",
        "She discovers CoreYield and learns about the CORE token ecosystem",
        "Sarah starts by minting CORE tokens and staking them to get stCORE",
        "She then wraps her stCORE to get lstBTC and dualCORE tokens",
        "Sarah creates markets and wraps assets to Standardized Yield (SY) tokens",
        "She splits SY into Principal Tokens (PT) and Yield Tokens (YT) for maximum yield",
        "One year later, Sarah has earned significant yield and is a DeFi expert!"
      ]
    },
    {
      name: "Marcus Rodriguez",
      avatar: "👨‍💻",
      background: "Crypto enthusiast, 32, experienced trader",
      goal: "Maximize yield through advanced PT/YT strategies",
      journey: [
        "Marcus has been trading crypto for 3 years and wants to optimize his portfolio",
        "He researches CoreYield's advanced yield generation mechanisms",
        "Marcus implements the full user flow: Mint → Stake → Wrap → Create Markets → Split",
        "He uses the yield calculator to project his earnings over different time periods",
        "Marcus adds liquidity to PT/YT pools and trades between them for optimal returns",
        "His optimized strategy earns him 15% more than basic yield farming!"
      ]
    },
    {
      name: "Aisha Patel",
      avatar: "👩‍🎓",
      background: "Finance student, 22, learning about DeFi",
      goal: "Understand CoreYield's smart contract architecture",
      journey: [
        "Aisha is studying finance and wants to understand DeFi protocols",
        "She dives deep into CoreYield's smart contract architecture",
        "Aisha learns about SY tokens, PT/YT mechanics, and yield calculation",
        "She experiments with different market creation strategies",
        "Aisha builds a portfolio tracking system using CoreYield's analytics",
        "She becomes a DeFi educator and helps others understand yield farming!"
      ]
    }
  ]

  const learningContent = {
    title: "Learn CoreYield - Made Simple",
    description: "Understand how CoreYield works in simple terms that anyone can follow",
    pages: [
      {
        title: "Meet Our Learners",
        type: "story-intro",
        content: "Follow real people as they master the CoreYield ecosystem"
      },
      {
        title: "What is CoreYield?",
        type: "lesson",
        content: `CoreYield is like a smart money garden where your money grows automatically!

**What it does:**
- Helps you earn money while you sleep
- Works like a bank, but better
- Gives you more control over your money

**How it works:**
- You put your money (tokens) into special pools
- The pools use your money to make more money
- You get a share of the profits
- You can take your money out anytime

**Why it's special:**
- Higher interest rates than regular banks
- You can see exactly where your money is
- No middleman taking your profits
- Works 24/7, even when you're sleeping

**What you need to know:**
- Start with small amounts
- Learn how it works step by step
- Don't put in money you can't afford to lose
- Ask questions if something isn't clear`
      },
              {
          title: "Understanding Tokens - Made Simple",
          type: "lesson",
          content: `Think of tokens like different types of money that work together to make you richer!

**What are tokens?**
- Tokens are like digital money
- Each token has a special job
- You can trade one token for another

**The main tokens in CoreYield:**
- **CORE**: The main money you start with
- **stCORE**: CORE tokens that are working to earn money
- **lstBTC**: A special token that represents Bitcoin
- **dualCORE**: A token that can earn money in two ways

**How they work together:**
- You start with CORE tokens
- You can turn CORE into stCORE to start earning
- You can trade stCORE for other tokens
- Each token helps you earn money in different ways

**Why this is cool:**
- You can choose how you want to earn money
- You can change your mind and try different strategies
- You can see exactly how much each token is earning
- You're in control of your money`
        },
              {
          title: "Where Your Money Works - Markets",
          type: "lesson",
          content: `Markets are like different "jobs" where your money can work to earn more money!

**What are markets?**
- Markets are places where your tokens work
- Each market has different rules and rewards
- You can choose which markets to use

**The main markets in CoreYield:**
- **CORE Market**: Where your CORE tokens work to earn money
- **Bitcoin Market**: Where you can earn money with Bitcoin-style tokens
- **Mixed Market**: Where you can earn money in multiple ways at once

**How markets work:**
- You put your tokens into a market
- The market uses your tokens to make money
- You get a share of the profits
- You can move your tokens between markets

**Why markets are helpful:**
- You can try different ways to earn money
- If one market isn't working well, you can try another
- You can spread your money across different markets
- You can find the best opportunities to earn more

**Remember:**
- Start with one market to learn
- Don't put all your money in one place
- Watch how your money performs
- Ask for help if you're confused`
        },
              {
          title: "How CoreYield Works - Simple Steps",
          type: "lesson",
          content: `Think of CoreYield like a smart piggy bank that grows your money automatically! Here's how it works:

**Step 1: Put Money In**
- You start with CORE tokens (like putting money in a bank)
- You can also use other tokens like stCORE or lstBTC
- The app helps you put your money in the right places

**Step 2: Watch It Grow**
- Your money earns interest automatically (called "yield")
- You can see how much you're earning in real-time
- The more money you put in, the more you can earn

**Step 3: Choose Your Strategy**
- **Safe Option**: Keep your money in stable pools for steady growth
- **Growth Option**: Put money in higher-risk pools for bigger rewards
- **Mix Both**: Put some money in safe places and some in growth places

**Step 4: Manage Your Money**
- Add more money when you want to earn more
- Take money out when you need it
- Move money between different pools to get the best returns

**Step 5: Stay Safe**
- Don't put all your money in one place
- Check your earnings regularly
- Start with small amounts to learn how it works`
        },
      {
        title: "Getting Started",
        type: "action",
        content: "Ready to start your CoreYield journey? Follow these steps:"
      }
    ]
  }

  const currentPageData = learningContent.pages[currentPage]
  const totalPages = learningContent.pages.length

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

  const handlePageChange = (newPage: number) => {
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentPage(newPage)
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
                Follow real people as they master the CoreYield ecosystem
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

      case 'lesson':
        return (
          <div className={`space-y-8 transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-white mb-4">{currentPageData.title}</h3>
            </div>
            <div className="max-w-none">
              <div className="text-gray-200 text-lg leading-relaxed">
                {currentPageData.content.split('\n').map((line, index) => {
                  if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
                    // Handle bold headers
                    const text = line.trim().slice(2, -2)
                    return (
                      <div key={index} className="mb-4">
                        <h4 className="text-xl font-bold text-blue-400 mb-3">{text}</h4>
                      </div>
                    )
                  } else if (line.trim().startsWith('- **') && line.includes('**:')) {
                    // Handle bullet points with bold labels
                    const match = line.match(/- \*\*(.*?)\*\*: (.*)/)
                    if (match) {
                      return (
                        <div key={index} className="flex items-start space-x-3 mb-3">
                          <span className="text-blue-400 mt-1">•</span>
                          <div>
                            <span className="font-semibold text-blue-300">{match[1]}</span>
                            <span className="text-gray-300">: {match[2]}</span>
                          </div>
                        </div>
                      )
                    }
                  } else if (line.trim().startsWith('- ')) {
                    // Handle regular bullet points
                    return (
                      <div key={index} className="flex items-start space-x-3 mb-3">
                        <span className="text-blue-400 mt-1">•</span>
                        <span className="text-gray-300">{line.trim().slice(2)}</span>
                      </div>
                    )
                  } else if (line.trim() === '') {
                    // Handle empty lines
                    return <div key={index} className="h-4"></div>
                  } else {
                    // Handle regular text
                    return (
                      <div key={index} className="mb-3 text-gray-200">
                        {line}
                      </div>
                    )
                  }
                })}
              </div>
            </div>
          </div>
        )

      case 'action':
        return (
          <div className={`text-center space-y-8 transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            <div className="mb-8">
              <h3 className="text-3xl font-bold text-white mb-4">Ready to Start?</h3>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                {currentPageData.content}
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-8">
                <div className="text-4xl mb-4">🚀</div>
                <h4 className="text-xl font-bold text-white mb-3">Launch App</h4>
                <p className="text-gray-300 mb-4">Start your CoreYield journey with the main application</p>
                {onLaunchApp && (
                  <button
                    onClick={onLaunchApp}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105"
                  >
                    Launch CoreYield
                  </button>
                )}
              </div>
              <div className="bg-gradient-to-br from-green-600/20 to-teal-600/20 border border-green-500/30 rounded-2xl p-8">
                <div className="text-4xl mb-4">📚</div>
                <h4 className="text-xl font-bold text-white mb-3">Learn More</h4>
                <p className="text-gray-300 mb-4">Explore the complete CoreYield documentation</p>
                <a
                  href="https://coreyield-protocol.vercel.app/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 inline-block text-center"
                >
                  View Documentation
                </a>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Content coming soon...</p>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20">
      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Logo */}
              {isStandalone && (
                <button className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
                  <span className="text-2xl">🔥</span>
                  <span className="text-white font-semibold text-xl">CoreYield</span>
                </button>
              )}
              
              <div>
                <h1 className="text-3xl font-bold text-white">Education Center</h1>
                <p className="text-gray-400">Master the CoreYield ecosystem</p>
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
          {/* Content Header */}
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {learningContent.title}
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">{learningContent.description}</p>
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
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    i === currentPage 
                      ? 'bg-blue-500 scale-125' 
                      : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => handlePageChange(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
            >
              <span>Next</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 
import React from 'react'
import { ActionButton } from '../shared/ActionButton'

interface EducationTabProps {
  onShowEducation?: (level?: 'beginner' | 'intermediate' | 'advanced') => void
}

export const EducationTab: React.FC<EducationTabProps> = ({ onShowEducation }) => {
  const educationLevels = [
    {
      level: 'beginner',
      title: 'Beginner',
      subtitle: 'Learn the basics',
      description: 'Understand yield farming fundamentals, CoreYield protocol basics, and how to get started safely.',
      icon: '🌱',
      color: 'from-green-500 to-emerald-500',
      borderColor: 'border-green-500/30',
      bgColor: 'bg-green-500/10',
      estimatedTime: '15 min',
      topics: [
        'What is yield farming?',
        'Understanding staking vs farming',
        'CoreYield protocol overview',
        'Safety best practices'
      ]
    },
    {
      level: 'intermediate',
      title: 'Intermediate',
      subtitle: 'Advanced strategies',
      description: 'Dive deeper into SY tokens, yield generation mechanisms, and risk management strategies.',
      icon: '📚',
      color: 'from-purple-500 to-pink-500',
      borderColor: 'border-purple-500/30',
      bgColor: 'bg-purple-500/10',
      estimatedTime: '25 min',
      topics: [
        'SY token mechanics',
        'PT vs YT strategies',
        'Risk management',
        'Yield optimization'
      ]
    },
    {
      level: 'advanced',
      title: 'Advanced',
      subtitle: 'Protocol mechanics',
      description: 'Master smart contract architecture, yield calculation mechanics, and optimization strategies.',
      icon: '🎓',
      color: 'from-orange-500 to-red-500',
      borderColor: 'border-orange-500/30',
      bgColor: 'bg-orange-500/10',
      estimatedTime: '40 min',
      topics: [
        'Smart contract deep dive',
        'Yield calculation formulas',
        'Advanced trading strategies',
        'Protocol governance'
      ]
    }
  ]

  const handleEducationClick = (level: 'beginner' | 'intermediate' | 'advanced') => {
    if (onShowEducation) {
      onShowEducation(level)
    } else {
      // Fallback: open in new tab
      window.open(`https://coreyield-protocol.vercel.app/education?level=${level}`, '_blank')
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h3 className="text-3xl font-bold text-white mb-2">📚 Education Center</h3>
        <p className="text-gray-400 text-lg">Master CoreYield protocol and advanced yield farming strategies</p>
      </div>

      {/* Education Levels */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {educationLevels.map((edu) => (
          <div
            key={edu.level}
            className={`${edu.bgColor} rounded-xl p-6 border ${edu.borderColor} hover:border-opacity-60 transition-all duration-300 hover-lift`}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${edu.color} rounded-xl flex items-center justify-center`}>
                <span className="text-white text-xl">{edu.icon}</span>
              </div>
              <div>
                <div className="text-white font-semibold text-lg">{edu.title}</div>
                <div className="text-gray-400 text-sm">{edu.subtitle}</div>
              </div>
            </div>
            
            <p className="text-gray-300 text-sm mb-4">
              {edu.description}
            </p>

            {/* Topics List */}
            <div className="mb-4">
              <h5 className="text-white font-medium text-sm mb-2">What you'll learn:</h5>
              <ul className="space-y-1">
                {edu.topics.map((topic, index) => (
                  <li key={index} className="text-gray-300 text-xs flex items-center">
                    <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                    {topic}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-400">Estimated time: {edu.estimatedTime}</span>
              <span className="text-xs text-gray-400">Interactive</span>
            </div>
            
            <ActionButton
              onClick={() => handleEducationClick(edu.level as any)}
              className="w-full"
              variant="primary"
            >
              Start {edu.title} Course
            </ActionButton>
          </div>
        ))}
      </div>

      {/* Quick Learning Path */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 mb-8">
        <h4 className="text-lg font-semibold text-white mb-4">🎯 Recommended Learning Path</h4>
        <div className="space-y-4">
          {[
            {
              step: 1,
              title: 'Understand Yield Farming Basics',
              description: 'Learn what yield farming is and how it works',
              time: '5 min',
              status: 'start'
            },
            {
              step: 2,
              title: 'Explore CoreYield Protocol',
              description: 'Understand how SY, PT, and YT tokens work',
              time: '8 min',
              status: 'next'
            },
            {
              step: 3,
              title: 'Practice with Testnet',
              description: 'Try the protocol with test tokens',
              time: '10 min',
              status: 'practice'
            },
            {
              step: 4,
              title: 'Advanced Strategies',
              description: 'Master optimization techniques',
              time: '15 min',
              status: 'advanced'
            }
          ].map((step) => (
            <div key={step.step} className="flex items-center space-x-4 p-4 bg-gray-700/30 rounded-lg">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                step.status === 'start' ? 'bg-green-500' :
                step.status === 'next' ? 'bg-blue-500' :
                step.status === 'practice' ? 'bg-purple-500' :
                'bg-orange-500'
              }`}>
                {step.step}
              </div>
              <div className="flex-1">
                <div className="text-white font-medium">{step.title}</div>
                <div className="text-gray-400 text-sm">{step.description}</div>
              </div>
              <div className="text-green-400 text-sm">{step.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Demo */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-blue-300 font-semibold text-lg">🔬 Interactive Protocol Demo</h4>
            <p className="text-blue-200 text-sm">See CoreYield in action with live examples</p>
          </div>
          <div className="text-blue-400 text-sm bg-blue-500/20 px-3 py-1 rounded-full">
            Live Demo
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
            <div className="text-blue-300 font-medium">Token Flow</div>
            <div className="text-blue-200 text-sm">Watch tokens transform through the protocol</div>
          </div>
          <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/20">
            <div className="text-purple-300 font-medium">Yield Calculation</div>
            <div className="text-purple-200 text-sm">Real-time yield generation simulation</div>
          </div>
          <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
            <div className="text-green-300 font-medium">Risk Analysis</div>
            <div className="text-green-200 text-sm">Interactive risk assessment tools</div>
          </div>
        </div>

        <ActionButton
          onClick={() => window.open('https://coreyield-protocol.vercel.app/demo', '_blank')}
          variant="primary"
          className="w-full"
        >
          🚀 Launch Interactive Demo
        </ActionButton>
      </div>

      {/* Help Section */}
      <div className="mt-8 text-center">
        <h4 className="text-white font-semibold mb-2">Need Help?</h4>
        <p className="text-gray-400 text-sm mb-4">
          Join our community for support and discussion
        </p>
        <div className="flex justify-center space-x-4">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
            📱 Discord
          </button>
          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors">
            📖 Documentation
          </button>
          <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors">
            ❓ FAQ
          </button>
        </div>
      </div>
    </div>
  )
}
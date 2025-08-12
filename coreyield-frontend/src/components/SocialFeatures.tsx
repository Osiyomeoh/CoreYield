import React, { useState } from 'react'
import { useAccount } from 'wagmi'
import { ASSET_METADATA } from '@contracts/addresses'


interface SocialStrategy {
  id: string
  name: string
  description: string
  creator: string
  creatorAvatar: string
  apy: number
  tvl: number
  participants: number
  riskLevel: 'low' | 'medium' | 'high'
  tags: string[]
  isFollowing: boolean
  performance: {
    daily: number
    weekly: number
    monthly: number
  }
}

interface CommunityPost {
  id: string
  author: string
  authorAvatar: string
  content: string
  timestamp: Date
  likes: number
  comments: number
  shares: number
  isLiked: boolean
  tags: string[]
}

export const SocialFeatures: React.FC = () => {
  const { isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState<'strategies' | 'community' | 'leaderboard'>('strategies')
  const [selectedAsset, setSelectedAsset] = useState<'stCORE' | 'lstBTC' | 'dualCORE'>('stCORE')
  const [searchQuery, setSearchQuery] = useState('')

  const [socialStrategies] = useState<SocialStrategy[]>([
    {
      id: '1',
      name: 'Conservative Yield Stack',
      description: 'A low-risk strategy focusing on stable yields with principal protection',
      creator: '0x1234...5678',
      creatorAvatar: '👨‍💼',
      apy: 8.5,
      tvl: 250000,
      participants: 45,
      riskLevel: 'low',
      tags: ['conservative', 'stable', 'low-risk'],
      isFollowing: false,
      performance: { daily: 0.23, weekly: 1.6, monthly: 6.8 }
    },
    {
      id: '2',
      name: 'Aggressive Growth',
      description: 'High-risk, high-reward strategy for experienced yield farmers',
      creator: '0x8765...4321',
      creatorAvatar: '🚀',
      apy: 18.2,
      tvl: 180000,
      participants: 23,
      riskLevel: 'high',
      tags: ['aggressive', 'high-reward', 'experienced'],
      isFollowing: true,
      performance: { daily: 0.45, weekly: 3.2, monthly: 14.5 }
    },
    {
      id: '3',
      name: 'Balanced Portfolio',
      description: 'Medium-risk strategy balancing yield and stability',
      creator: '0x9999...8888',
      creatorAvatar: '⚖️',
      apy: 12.8,
      tvl: 320000,
      participants: 67,
      riskLevel: 'medium',
      tags: ['balanced', 'diversified', 'moderate'],
      isFollowing: false,
      performance: { daily: 0.34, weekly: 2.4, monthly: 10.2 }
    }
  ])

  const [communityPosts] = useState<CommunityPost[]>([
    {
      id: '1',
      author: '0x1234...5678',
      authorAvatar: '👨‍💼',
      content: 'Just hit 15% APY on my stCORE strategy! The CoreYield protocol is really delivering. Anyone else seeing similar results?',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      likes: 24,
      comments: 8,
      shares: 3,
      isLiked: false,
      tags: ['stCORE', 'success', '15%APY']
    },
    {
      id: '2',
      author: '0x8765...4321',
      authorAvatar: '🚀',
      content: 'New yield farming strategy: combining PT and YT tokens for maximum efficiency. Riskier but the rewards are worth it!',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      likes: 18,
      comments: 12,
      shares: 7,
      isLiked: true,
      tags: ['strategy', 'PT+YT', 'efficiency']
    },
    {
      id: '3',
      author: '0x9999...8888',
      authorAvatar: '⚖️',
      content: 'What do you think about the new dualCORE market? Seems like a good opportunity for diversification.',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
      likes: 15,
      comments: 6,
      shares: 2,
      isLiked: false,
      tags: ['dualCORE', 'diversification', 'discussion']
    }
  ])

  const [leaderboard] = useState([
    { rank: 1, address: '0x1234...5678', avatar: '👑', tvl: 125000, apy: 16.8, followers: 89 },
    { rank: 2, address: '0x8765...4321', avatar: '🥈', tvl: 98000, apy: 15.2, followers: 67 },
    { rank: 3, address: '0x9999...8888', avatar: '🥉', tvl: 87000, apy: 14.5, followers: 54 },
    { rank: 4, address: '0x1111...2222', avatar: '💎', tvl: 76000, apy: 13.8, followers: 42 },
    { rank: 5, address: '0x3333...4444', avatar: '🚀', tvl: 65000, apy: 12.9, followers: 38 }
  ])

  const handleFollowStrategy = (strategyId: string) => {
    console.log(`Following strategy: ${strategyId}`)
  }

  const handleLikePost = (postId: string) => {
    console.log(`Liked post: ${postId}`)
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500/20 text-green-400'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400'
      case 'high': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Wallet to Access Social Features</h2>
          <p className="text-gray-400">Connect your wallet to join the CoreYield community</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">CoreYield Social</h1>
          <p className="text-gray-400 text-lg">Connect, share strategies, and grow together with the community</p>
        </div>

        {/* Asset Selector */}
        <div className="mb-8">
          <div className="flex space-x-2 p-1 bg-gray-800 rounded-xl">
            {Object.entries(ASSET_METADATA).map(([key, asset]) => (
              <button
                key={key}
                onClick={() => setSelectedAsset(key as 'stCORE' | 'lstBTC' | 'dualCORE')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  selectedAsset === key
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {asset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700 mb-8">
          {[
            { id: 'strategies', label: 'Social Strategies', icon: '📊' },
            { id: 'community', label: 'Community', icon: '💬' },
            { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/10'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search strategies, posts, or users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Content */}
        {activeTab === 'strategies' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-white">Social Yield Strategies</h2>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                + Create Strategy
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {socialStrategies.map((strategy) => (
                <div key={strategy.id} className="bg-gray-800 rounded-2xl border border-gray-700 p-6 hover:border-blue-500/50 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
                        {strategy.creatorAvatar}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{strategy.name}</h3>
                        <p className="text-gray-400 text-sm">{strategy.creator}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleFollowStrategy(strategy.id)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        strategy.isFollowing
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {strategy.isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>

                  <p className="text-gray-300 text-sm mb-4">{strategy.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {strategy.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-lg">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-gray-400 text-sm">APY</p>
                      <p className="text-green-400 text-xl font-bold">{strategy.apy}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-sm">TVL</p>
                      <p className="text-white text-lg font-semibold">${(strategy.tvl / 1000).toFixed(0)}K</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(strategy.riskLevel)}`}>
                      {strategy.riskLevel.toUpperCase()} RISK
                    </span>
                    <span className="text-gray-400 text-sm">{strategy.participants} participants</span>
                  </div>

                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Daily: +{strategy.performance.daily}%</span>
                      <span className="text-gray-400">Weekly: +{strategy.performance.weekly}%</span>
                      <span className="text-gray-400">Monthly: +{strategy.performance.monthly}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'community' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-white">Community Feed</h2>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                + New Post
              </button>
            </div>

            <div className="space-y-6">
              {communityPosts.map((post) => (
                <div key={post.id} className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center text-2xl">
                      {post.authorAvatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-white font-semibold">{post.author}</p>
                          <p className="text-gray-400 text-sm">
                            {post.timestamp.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          {post.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-lg">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-300 text-base leading-relaxed">{post.content}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                    <div className="flex items-center space-x-6">
                      <button
                        onClick={() => handleLikePost(post.id)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                          post.isLiked
                            ? 'bg-red-500/20 text-red-400'
                            : 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
                        }`}
                      >
                        <span>{post.isLiked ? '❤️' : '🤍'}</span>
                        <span>{post.likes}</span>
                      </button>
                      <button className="flex items-center space-x-2 px-3 py-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                        <span>💬</span>
                        <span>{post.comments}</span>
                      </button>
                      <button className="flex items-center space-x-2 px-3 py-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors">
                        <span>📤</span>
                        <span>{post.shares}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white">Yield Farming Leaderboard</h2>
            
            <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">Top Yield Farmers</h3>
                <p className="text-gray-400 text-sm">Ranked by Total Value Locked and Performance</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-750">
                    <tr>
                      <th className="text-left py-4 px-6 text-gray-400 font-medium">Rank</th>
                      <th className="text-left py-4 px-6 text-gray-400 font-medium">Farmer</th>
                      <th className="text-left py-4 px-6 text-gray-400 font-medium">TVL</th>
                      <th className="text-left py-4 px-6 text-gray-400 font-medium">APY</th>
                      <th className="text-left py-4 px-6 text-gray-400 font-medium">Followers</th>
                      <th className="text-left py-4 px-6 text-gray-400 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((farmer) => (
                      <tr key={farmer.rank} className="border-b border-gray-700/50 hover:bg-gray-750/50">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{farmer.avatar}</span>
                            <span className="text-white font-bold">#{farmer.rank}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-white font-medium">{farmer.address}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-white">${(farmer.tvl / 1000).toFixed(0)}K</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-green-400 font-semibold">{farmer.apy}%</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-gray-300">{farmer.followers}</span>
                        </td>
                        <td className="py-4 px-6">
                          <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
                            Follow
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
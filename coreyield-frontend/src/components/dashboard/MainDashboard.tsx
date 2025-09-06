import React, { useState, useEffect, useMemo } from 'react'
import { useCoreYield } from '../../hooks/useCoreYield'
import { useTransactionHistory } from '../../hooks/useTransactionHistory'
import { useNotifications } from '../../hooks/useNotifications'
import { useReadContract } from 'wagmi'
import { CustomConnectButton } from './shared/CustomConnectButton'
import { CONTRACTS, ASSET_METADATA } from '../../../contracts/addresses'
import { formatUnits } from 'viem'
import NotificationSystem from '../shared/NotificationSystem'
import TransactionHistory from './shared/TransactionHistory'

// Header Components
import { DashboardHeader } from './header/DashboardHeader'
// Overview Components
import { BalanceOverview } from './overview/BalanceOverview'
import { PortfolioSummary } from './overview/PortfolioSummary'
import { QuickActions } from './overview/QuickActions'
import { StatsOverview } from './overview/StatsOverview'

// Tab Components
import PoolsTab from './tabs/PoolsTab'
import PortfolioTab from './tabs/PortfolioTab'
import GovernanceTab from './tabs/GovernanceTab'
import { StakeTab } from './tabs/StakeTab'
import BridgeTab from './tabs/BridgeTab'


// Card Components
import { BalanceCard } from './cards/BalanceCard'
import { PTTokenCard } from './cards/PTTokenCard'
import { YTTokenCard } from './cards/YTTokenCard'
import { AssetCard } from './cards/AssetCard'
import { TransactionCard } from './cards/TransactionCard'
import { MarketCard } from './cards/MarketCard'
import { PointsCard } from './cards/PointsCard'

// Shared Components
import { NotificationToast } from './shared/NotificationToast'
import { AssetSelector } from './shared/AssetSelector'
import { ActionButton } from './shared/ActionButton'
import { AmountInput } from './shared/AmountInput'
import { ProcessingStatus } from './shared/ProcessingStatus'
import { ChainSelector } from './shared/ChainSelector'
import { FilterControls } from './shared/FilterControls'

// Chart Component
import { ChartComponent } from './ChartComponent'

// Contract ABIs
import CoreYieldRouterABI from '../../abis/CoreYieldRouter.json'
import CoreStakingABI from '../../abis/CoreStaking.json'
import AnalyticsEngineABI from '../../abis/AnalyticsEngine.json'



interface MainDashboardProps {
  onShowEducation?: (level?: 'beginner' | 'intermediate' | 'advanced') => void
}

type DashboardView = 'markets' | 'pools' | 'dashboard' | 'trading'
type MarketFilter = 'all' | 'prime' | 'favorites' | 'new'
type SortOption = 'default' | 'apy' | 'tvl' | 'volume' | 'maturity'
type ViewMode = 'list' | 'grid' | 'detailed'

export const MainDashboard: React.FC<MainDashboardProps> = ({ onShowEducation }) => {
  // Main Navigation State
  const [currentView, setCurrentView] = useState<'dashboard' | 'markets' | 'pools' | 'trading'>('dashboard')
  
  // Market State
  const [marketFilter, setMarketFilter] = useState<MarketFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('default')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedAssets, setExpandedAssets] = useState<string[]>(['stCORE', 'sUSDe'])
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  
  // Advanced Features State
  const [showMarketProperties, setShowMarketProperties] = useState(false)
  const [selectedChains, setSelectedChains] = useState<string[]>(['core', 'ethereum'])
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [showUSD, setShowUSD] = useState(true)
  
  // Portfolio State
  const [portfolioTab, setPortfolioTab] = useState<'positions' | 'orders'>('positions')
  const [assetFilter, setAssetFilter] = useState<'all' | 'pt' | 'yt' | 'lp'>('all')
  const [displayMode, setDisplayMode] = useState<'usd' | 'underlying'>('usd')
  
  // Governance State
  const [governanceView, setGovernanceView] = useState<'overview' | 'dashboard' | 'lock' | 'vote' | 'app'>('overview')
  const [lockAmount, setLockAmount] = useState('')
  const [lockDuration, setLockDuration] = useState(365)
  
  // Points State
  const [pointsView, setPointsView] = useState<'earn' | 'predict' | 'trade'>('earn')
  
  // Transaction History State
  const [showTransactionHistory, setShowTransactionHistory] = useState(false)
  
  // Tools Input State
  const [wrapAmount, setWrapAmount] = useState('')
  const [splitAmount, setSplitAmount] = useState('')
  const [mergePtAmount, setMergePtAmount] = useState('')
  const [mergeYtAmount, setMergeYtAmount] = useState('')
  const [unwrapAmount, setUnwrapAmount] = useState('')
  const [mintAmount, setMintAmount] = useState('')
  const [redeemAmount, setRedeemAmount] = useState('')
  const [swapAmount, setSwapAmount] = useState('')
  const [swapDirection, setSwapDirection] = useState<'pt-to-yt' | 'yt-to-pt'>('pt-to-yt')
  const [limitOrderType, setLimitOrderType] = useState<'buy' | 'sell'>('buy')
  const [limitPrice, setLimitPrice] = useState('')
  const [limitAmount, setLimitAmount] = useState('')
  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  
  // Trading State
  const [tradingView, setTradingView] = useState<{
    isActive: boolean
    tokenType: 'PT' | 'YT'
    asset: string
    market: any
  }>({
    isActive: false,
    tokenType: 'PT',
    asset: '',
    market: null
  })
  
  const [toolsTab, setToolsTab] = useState<'stake' | 'wrap' | 'split' | 'merge' | 'unwrap' | 'unstake' | 'claim' | 'redeem' | 'mint'>('stake')
  const [tradingTab, setTradingTab] = useState<'swap' | 'limit' | 'tools'>('tools')
  const [leftPanelTab, setLeftPanelTab] = useState<'Market Info' | 'Charts' | 'Book'>('Charts')
  
  // Chart State Variables
  const [chartMetric, setChartMetric] = useState<'apy' | 'price' | 'volume'>('apy')
  const [chartTimeframe, setChartTimeframe] = useState<string>('1D')
  
  // Chart Data State
  const [chartData, setChartData] = useState<any[]>([])
  
  // Tutorial System State
  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialStep, setTutorialStep] = useState(0)
  const [userHasPositions, setUserHasPositions] = useState(false)
  
  // User Progress Tracking
  const [userProgress, setUserProgress] = useState({
    hasStaked: false,
    hasWrapped: false,
    hasSplit: false,
    hasTraded: false,
    totalPositions: 0
  })
  
  // Selected Asset State
  const [selectedAsset, setSelectedAsset] = useState('stCORE')
  const [selectedMarket, setSelectedMarket] = useState('stCORE_0') // Default to first stCORE market
  const coreYield = useCoreYield()
  const { transactions } = useTransactionHistory()
  const { notifications, removeNotification } = useNotifications()

  // Get real protocol stats from contracts
  const { data: protocolStats } = useReadContract({
    address: CONTRACTS.CORE_YIELD_ROUTER as `0x${string}`,
    abi: CoreYieldRouterABI.abi as any,
    functionName: 'getProtocolStats',
    query: { refetchInterval: 30000 }
  })

  // Get real staking stats
  const { data: stakingStats } = useReadContract({
    address: CONTRACTS.CORE_STAKING as `0x${string}`,
    abi: CoreStakingABI.abi as any,
    functionName: 'getStakingStats',
    query: { refetchInterval: 30000 }
  })

  // Get real analytics data
  const { data: analyticsData } = useReadContract({
    address: CONTRACTS.CORE_YIELD_ANALYTICS as `0x${string}`,
    abi: AnalyticsEngineABI.abi as any,
    functionName: 'getGlobalAnalytics',
    query: { refetchInterval: 30000 }
  })

  // Dynamic global stats based on real contract data
  const globalStats = useMemo(() => {
    if (!protocolStats || !Array.isArray(protocolStats) || !stakingStats || !Array.isArray(stakingStats)) {
    return {
        totalTVL: '$0',
        totalVolume24h: '$0',
        activeMarkets: 0,
        totalUsers: '0',
        totalRevenue: '$0',
        veCOREFees: '$0',
        historicalAPR: '0%',
        totalveCORE: '0',
        lockedCORE: '0',
        avgLockDuration: '0 days'
      }
    }

    // Safe array access with type guards
    const protocolStatsArray = protocolStats as bigint[]
    const stakingStatsArray = stakingStats as bigint[]
    const analyticsDataArray = Array.isArray(analyticsData) ? analyticsData as bigint[] : []

    return {
      totalTVL: `$${protocolStatsArray[0] ? formatUnits(protocolStatsArray[0], 18) : '0'}`,
      totalVolume24h: `$${analyticsDataArray[0] ? formatUnits(analyticsDataArray[0], 18) : '0'}`,
      activeMarkets: protocolStatsArray[1] ? Number(protocolStatsArray[1]) : 0,
      totalUsers: protocolStatsArray[2] ? Number(protocolStatsArray[2]).toString() : '0',
      totalRevenue: `$${stakingStatsArray[3] ? formatUnits(stakingStatsArray[3], 18) : '0'}`,
      veCOREFees: `$${stakingStatsArray[4] ? formatUnits(stakingStatsArray[4], 18) : '0'}`,
      historicalAPR: `${stakingStatsArray[0] ? Number(formatUnits(stakingStatsArray[0], 2)) : 0}%`,
      totalveCORE: stakingStatsArray[5] ? formatUnits(stakingStatsArray[5], 18) : '0',
      lockedCORE: stakingStatsArray[6] ? formatUnits(stakingStatsArray[6], 18) : '0',
      avgLockDuration: stakingStatsArray[7] ? `${Math.floor(Number(stakingStatsArray[7]) / 86400)} days` : '0 days'
    }
  }, [protocolStats, stakingStats, analyticsData])

  // TODO: Replace with real data from contracts
  const topFixedAPY = useMemo(() => {
    // Return empty array until real contract data is available
    return []
  }, [])

  // TODO: Replace with real data from contracts
  const topNewMarkets = useMemo(() => {
    // Return empty array until real contract data is available
    return []
  }, [])

  // TODO: Replace with real data from contracts
  const trendingMarkets = useMemo(() => {
    // Return empty array until real contract data is available
    return []
  }, [])

  // TODO: Replace with real data from contracts
  const pointsMarkets = useMemo(() => {
    // Return empty array until real contract data is available
    return [] as Array<{
      asset: string
      maturity: string
      points: string[]
      multiplier: string
      fixedYield: number
      lpYield: number
      icon: string
    }>
  }, [])

  const coreYieldMarkets = useMemo(() => {
    // Use actual markets from CONTRACTS.MARKETS instead of hardcoded data
    const markets = Object.entries(CONTRACTS.MARKETS).map(([marketKey, market]) => {
      const isLstBTC = marketKey.startsWith('lstBTC')
      const isStCORE = marketKey.startsWith('stCORE')
      
      return {
        name: marketKey,
        protocol: 'CoreYield',
        maturity: new Date(market.maturity * 1000).toLocaleDateString(), // Keep as string for MarketAsset compatibility
        liquidity: '$0.00',
        totalTVL: '$0.00',
        ptAPY: 0,
        ytAPY: 0,
        icon: isLstBTC ? '₿' : isStCORE ? '🔥' : '⚡',
        featured: true,
        volume24h: '$0.00',
        marketMode: 'NEUTRAL',
        tradingSignals: {
          buyPT: false,
          buyYT: false,
          confidence: 0
        },
        description: `${isLstBTC ? 'lstBTC' : isStCORE ? 'stCORE' : 'dualCORE'} yield market`,
        underlying: isLstBTC ? 'BTC' : 'CORE',
        points: ['Yield', 'Liquidity', 'Trading'],
        marketKey: marketKey,
        poolReserves: market.poolReserves,
        // Store raw market data for trading view
        rawMarket: market
      }
    })

    return markets
  }, [])

  const supportedChains = useMemo(() => {
    if (!coreYield.portfolioData) return []
    
    return [
      { 
        id: 'core', 
        name: 'Core', 
        icon: 'CORE', 
        balance: `$${coreYield.portfolioData.totalValue || '0'}` 
      }
    ].filter(chain => parseFloat(chain.balance.replace('$', '')) > 0)
  }, [coreYield.portfolioData])

  // Filter and sort markets
  const filteredMarkets = useMemo(() => {
    let filtered = coreYieldMarkets

    if (marketFilter === 'prime') {
      filtered = filtered.filter(market => market.featured)
    } else if (marketFilter === 'favorites') {
      filtered = filtered.filter(market => ['stCORE', 'btcsCORE'].includes(market.name))
    } else if (marketFilter === 'new') {
      filtered = filtered.slice(0, 2)
    }

    if (searchQuery) {
      filtered = filtered.filter(market => 
        market.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        market.protocol.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'apy': return b.ptAPY - a.ptAPY
        case 'tvl': return parseFloat(b.totalTVL.replace(/[$KM]/g, '')) - parseFloat(a.totalTVL.replace(/[$KM]/g, ''))
        default: return 0
      }
    })
  }, [marketFilter, searchQuery, sortBy])

  const toggleAssetExpansion = (assetName: string) => {
    setExpandedAssets(prev => 
      prev.includes(assetName) 
        ? prev.filter(name => name !== assetName)
        : [...prev, assetName]
    )
  }

  const handleTradeClick = (tokenType: 'PT' | 'YT', asset: string, market: any) => {
    console.log('🔍 handleTradeClick Debug - tokenType:', tokenType);
    console.log('🔍 handleTradeClick Debug - asset:', asset);
    console.log('🔍 handleTradeClick Debug - market:', market);
    
    // If market is a MarketAsset, we need to find the corresponding raw market data
    let tradingMarket = market;
    
    if (market && market.rawMarket) {
      // If it has rawMarket, use that
      tradingMarket = market.rawMarket;
    } else if (market && market.marketKey) {
      // If it's a MarketAsset, find the raw market data from CONTRACTS.MARKETS
      const marketKey = market.marketKey as keyof typeof CONTRACTS.MARKETS;
      tradingMarket = CONTRACTS.MARKETS[marketKey];
      console.log('🔍 handleTradeClick Debug - found raw market:', tradingMarket);
    }
    
    if (!tradingMarket) {
      console.error('❌ handleTradeClick Error - No market data found for:', market);
      return;
    }
    
    setTradingView({
      isActive: true,
      tokenType,
      asset,
      market: tradingMarket
    })
    setCurrentView('trading')
    
    console.log('🔍 handleTradeClick Debug - tradingView set:', {
      isActive: true,
      tokenType,
      asset,
      market: tradingMarket
    });
  }

  // Render Pendle-style Header
  const renderPendleHeader = () => (
    <div className="bg-gray-900/95 backdrop-blur-md border-b border-gray-800/50 sticky top-0 z-50">
              <div className="w-full px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
                <img src="/logo2.png" alt="CoreYield" className="w-4 h-4" />
                </div>
              <div>
                <span className="text-lg font-bold text-white">CoreYield</span>
                <p className="text-xs text-gray-400">PT/YT Yield Tokenization</p>
              </div>
            </div>
          </div>

                    {/* Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
                        <button 
              onClick={() => onShowEducation?.()}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Education
            </button>

            {[
              { id: 'markets', label: 'Markets' },
              { id: 'pools', label: 'Pools' },
              { id: 'dashboard', label: 'Dashboard' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as DashboardView)}
                className={`font-medium transition-colors ${
                  currentView === item.id ? 'text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Side */}
                    <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowTransactionHistory(true)}
              className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              📋 History
            </button>
            <CustomConnectButton />
              </div>
          </div>
          </div>
    </div>
  )

  // Render Markets View (Main Pendle-style interface)
  const renderMarketsView = () => (
    <div className="w-full px-6 py-6 space-y-6">
      {/* Markets Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Yield Markets</h1>
        <p className="text-gray-400 text-base max-w-2xl mx-auto">
          Trade Principal Tokens (PT) and Yield Tokens (YT) for maximum yield optimization. 
          Split, merge, and trade yield-bearing assets independently.
              </p>
            </div>

              {/* Market Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">🔥</div>
            <h3 className="text-white font-semibold text-base mb-1">Total Markets</h3>
            <p className="text-2xl font-bold text-blue-400">{coreYieldMarkets.length}</p>
            <p className="text-gray-400 text-xs">Active PT/YT markets</p>
                </div>
          <div className="bg-gradient-to-r from-green-600/20 to-teal-600/20 border border-green-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">📈</div>
            <h3 className="text-white font-semibold text-base mb-1">Highest YT APY</h3>
            <p className="text-2xl font-bold text-green-400">
              {Math.max(...coreYieldMarkets.map(m => m.ytAPY)).toFixed(1)}%
            </p>
            <p className="text-gray-400 text-xs">Best yield opportunity</p>
          </div>
          <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">💰</div>
            <h3 className="text-white font-semibold text-base mb-1">Total TVL</h3>
            <p className="text-2xl font-bold text-orange-400">
              ${coreYieldMarkets.reduce((sum, m) => sum + parseFloat(m.totalTVL.replace(/[$,]/g, '')), 0).toLocaleString()}
            </p>
            <p className="text-gray-400 text-xs">Across all markets</p>
          </div>
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">📊</div>
            <h3 className="text-white font-semibold text-base mb-1">24h Volume</h3>
            <p className="text-2xl font-bold text-purple-400">
              ${coreYieldMarkets.reduce((sum, m) => sum + parseFloat(m.volume24h.replace(/[$,]/g, '')), 0).toLocaleString()}
            </p>
            <p className="text-gray-400 text-xs">Trading activity</p>
          </div>
              </div>

      {/* Top Stats Cards */}
      <StatsOverview 
        topFixedAPY={topFixedAPY}
        topNewMarkets={topNewMarkets}
        trendingMarkets={trendingMarkets}
      />

      {/* Chain Selector */}
      <ChainSelector 
        chains={supportedChains}
        selectedChains={selectedChains}
        onChainToggle={(chainId) => {
          setSelectedChains(prev => 
            prev.includes(chainId) 
              ? prev.filter(id => id !== chainId)
              : [...prev, chainId]
          )
        }}
      />

      {/* Filter Controls */}
      <FilterControls
        marketFilter={marketFilter}
        setMarketFilter={setMarketFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showMarketProperties={showMarketProperties}
        setShowMarketProperties={setShowMarketProperties}
              />

        {/* Quick Actions */}
        <div className="flex space-x-2 mb-4">
          <button 
            onClick={() => {
              setTradingView({
                isActive: true,
                tokenType: 'PT',
                asset: 'stCORE',
                market: { name: 'stCORE', maturity: '30 Dec 2025', apy: 0 }
              })
              setCurrentView('trading')
              setTradingTab('tools')
              setToolsTab('wrap')
            }}
            className="px-3 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-colors text-center text-xs"
          >
            🔒 Wrap to SY
          </button>
          <button 
            onClick={() => {
              setTradingView({
                isActive: true,
                tokenType: 'YT',
                asset: 'stCORE',
                market: { name: 'stCORE', maturity: '30 Dec 2025', apy: 0 }
              })
              setCurrentView('trading')
              setTradingTab('tools')
              setToolsTab('split')
            }}
            className="px-3 py-2 bg-green-600/20 border border-green-500/30 rounded-lg hover:bg-green-600/30 transition-colors text-center text-xs"
          >
            📈 Split SY
          </button>
          <button 
            onClick={() => {
              setTradingView({
                isActive: true,
                tokenType: 'PT',
                asset: 'stCORE',
                market: { name: 'stCORE', maturity: '30 Dec 2025', apy: 8.5 }
              })
              setCurrentView('trading')
              setTradingTab('tools')
              setToolsTab('merge')
            }}
            className="px-3 py-2 bg-purple-600/20 border border-purple-500/30 rounded-lg hover:bg-purple-600/30 transition-colors text-center text-xs"
          >
            ⚖️ Merge PT+YT
          </button>
          <button 
            onClick={() => {
              setTradingView({
                isActive: true,
                tokenType: 'YT',
                asset: 'stCORE',
                market: { name: 'stCORE', maturity: '30 Dec 2025', apy: 0 }
              })
              setCurrentView('trading')
              setTradingTab('tools')
              setToolsTab('claim')
            }}
            className="px-3 py-2 bg-orange-600/20 border border-orange-500/30 rounded-lg hover:bg-orange-600/30 transition-colors text-center text-xs"
          >
            💰 Claim Yield
          </button>
          <button 
            onClick={() => setCurrentView('dashboard')}
            className="px-3 py-2 bg-red-600/20 border border-red-500/30 rounded-lg hover:bg-red-600/30 transition-colors text-center text-xs"
          >
            🔥 Stake CORE
          </button>
        </div>



      {/* Markets List */}
      <div className="space-y-4">
        {filteredMarkets.map((asset) => (
          <MarketCard
            key={asset.name}
            asset={asset}
            expanded={expandedAssets.includes(asset.name)}
            onToggleExpand={() => toggleAssetExpansion(asset.name)}
            viewMode={viewMode}
            onTradeClick={handleTradeClick}
          />
        ))}
      </div>

        {/* How PT/YT Works */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 mt-6">
          <h3 className="text-lg font-semibold text-white mb-3">How PT/YT Yield Tokenization Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-xl">🔒</span>
            </div>
              <h4 className="text-white font-medium mb-1 text-sm">Principal Token (PT)</h4>
              <p className="text-gray-400 text-xs">
                Represents your locked capital. Redeem 1:1 with underlying asset at maturity.
              </p>
          </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-xl">📈</span>
              </div>
              <h4 className="text-white font-medium mb-1 text-sm">Yield Token (YT)</h4>
              <p className="text-gray-400 text-xs">
                Represents yield rights. Claim yield continuously until maturity.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-xl">⚖️</span>
              </div>
              <h4 className="text-white font-medium mb-1 text-sm">1 SY = 1 PT + 1 YT</h4>
              <p className="text-gray-400 text-xs">
                Split your yield-bearing position or merge PT+YT back to underlying.
              </p>
            </div>
          </div>
        </div>
      </div>
    )




      {/* Chain Selector for Points */}
      <ChainSelector 
        chains={supportedChains}
        selectedChains={selectedChains}
        onChainToggle={(chainId) => {
          setSelectedChains(prev => 
            prev.includes(chainId) 
              ? prev.filter(id => id !== chainId)
              : [...prev, chainId]
          )
        }}
      />

      {/* Points Filter */}
          <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {[
            { id: 'prime', label: 'Prime', icon: '👑' },
            { id: 'favorites', label: 'Favorites', icon: '⭐' },
            { id: 'new', label: 'New', icon: '🆕' }
          ].map((filter) => (
                  <button 
              key={filter.id}
              onClick={() => setMarketFilter(filter.id as MarketFilter)}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                marketFilter === filter.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span>{filter.icon}</span>
              <span>{filter.label}</span>
                  </button>
                ))}
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            <option value="default">Sort by: Default</option>
            <option value="apy">Sort by APY</option>
            <option value="tvl">Sort by TVL</option>
          </select>
                </div>

        <input
          type="text"
          placeholder="Search name or paste address"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 w-64"
        />
            </div>

      {/* Portfolio Integration Section */}
      <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">📊 Portfolio Integration</h3>
        <p className="text-gray-400 mb-4">Track your portfolio performance and asset allocation across all markets</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
            <div className="text-center">
              <div className="text-2xl mb-2">📈</div>
              <div className="text-gray-400 text-sm">Portfolio Value</div>
              <div className="text-white font-semibold">$0.00</div>
              <div className="text-green-400 text-xs">+0.00%</div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
            <div className="text-center">
              <div className="text-2xl mb-2">🎯</div>
              <div className="text-gray-400 text-sm">Total APY</div>
              <div className="text-white font-semibold">0.00%</div>
              <div className="text-blue-400 text-xs">Across all assets</div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
            <div className="text-center">
              <div className="text-2xl mb-2">⚖️</div>
              <div className="text-gray-400 text-sm">Risk Score</div>
              <div className="text-white font-semibold">Low</div>
              <div className="text-blue-400 text-xs">Conservative</div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            View Full Portfolio
          </button>
        </div>
      </div>



  // Render Dashboard (Portfolio) View
  const renderDashboardView = () => (
    <div className="w-full px-6 py-6 space-y-6">
      {/* User Profile Header */}
      <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl">👤</span>
                </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Portfolio Overview</h1>
            <p className="text-gray-400">Your yield strategy dashboard</p>
                </div>
                </div>
        <button className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
          Go to wallet address 🔍
              </button>
              </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={() => setCurrentView('pools')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-xl transition-colors flex items-center justify-center space-x-3"
        >
          <span className="text-2xl">🚀</span>
          <div className="text-left">
            <div className="font-semibold">Create Strategy</div>
            <div className="text-sm text-blue-200">Build yield strategies</div>
          </div>
        </button>
        
        <button 
          onClick={() => setCurrentView('markets')}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-4 px-6 rounded-xl transition-colors flex items-center justify-center space-x-3"
        >
          <span className="text-2xl">📊</span>
          <div className="text-left">
            <div className="font-semibold">View Markets</div>
            <div className="text-sm text-green-200">Trade PT/YT</div>
          </div>
        </button>
        
        <button 
          onClick={() => setCurrentView('markets')}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-4 px-6 rounded-xl transition-colors flex items-center justify-center space-x-3"
        >
          <span className="text-2xl">📊</span>
          <div className="text-left">
            <div className="font-semibold">View Markets</div>
            <div className="text-sm text-purple-200">Explore yield opportunities</div>
          </div>
        </button>
      </div>

      {/* Clean Portfolio Overview */}
      <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">
              ${coreYield.portfolioData?.totalValue || '0.00'}
            </div>
            <div className="text-gray-400 text-sm">Portfolio Value</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {coreYield.portfolioData?.totalAPY || '0.00'}%
            </div>
            <div className="text-gray-400 text-sm">Total APY</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {coreYield.portfolioData?.strategyCount || '0'}
            </div>
            <div className="text-gray-400 text-sm">Strategies</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-400 mb-2">
              {coreYield.riskData?.riskScore || '0'}/10
            </div>
            <div className="text-gray-400 text-sm">Risk Score</div>
          </div>
        </div>
      </div>

      {/* Active Strategies */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">💼 Active Strategies</h3>
          <button 
            onClick={() => setCurrentView('pools')}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            Manage
          </button>
        </div>
        
        {coreYield.userStrategies && Array.isArray(coreYield.userStrategies) && coreYield.userStrategies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(coreYield.userStrategies as any[]).map((strategy: any, index: number) => (
              <div key={index} className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🚀</span>
                    <div>
                      <div className="font-medium text-white">Strategy #{strategy.id}</div>
                      <div className="text-sm text-gray-400">{strategy.strategyType}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">${strategy.totalValue}</div>
                    <div className="text-sm text-green-400">{strategy.targetAPY}% APY</div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Risk:</span>
                    <span className="text-white">{strategy.riskTolerance}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-green-400">Active</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">No active strategies yet</div>
            <div className="text-sm text-gray-500 mb-4">Start building your yield portfolio</div>
            <button 
              onClick={() => setCurrentView('pools')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              🚀 Create First Strategy
            </button>
          </div>
        )}
      </div>

      {/* Quick Summary - Simplified */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-4">📊 Portfolio Summary</h3>
          <p className="text-gray-400 text-sm mb-4">
            View detailed positions and orders in the Markets tab
          </p>
          <button 
            onClick={() => setCurrentView('markets')}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            📊 View Markets
          </button>
        </div>
      </div>

      {/* Portfolio Tabs - DISABLED (Too Complex) */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700/50">
        <div className="border-b border-gray-700/50">
          <div className="flex items-center space-x-8 px-6">
                <button
              onClick={() => setPortfolioTab('positions')}
              className={`py-4 font-medium transition-colors border-b-2 ${
                portfolioTab === 'positions'
                  ? 'text-white border-blue-500'
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              My Positions
                </button>
                <button
              onClick={() => setPortfolioTab('orders')}
              className={`py-4 font-medium transition-colors border-b-2 ${
                portfolioTab === 'orders'
                  ? 'text-white border-blue-500'
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              My Orders
                </button>
              </div>
            </div>

        <div className="p-6">
          {portfolioTab === 'positions' && (
            <div>
              {/* Asset Filter */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  {[
                    { id: 'all', label: 'All Assets' },
                    { id: 'pt', label: 'PT' },
                    { id: 'yt', label: 'YT' },
                    { id: 'lp', label: 'LP' }
                  ].map((filter) => (
        <button
                      key={filter.id}
                      onClick={() => setAssetFilter(filter.id as any)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        assetFilter === filter.id
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {filter.label}
        </button>
                  ))}
              </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setDisplayMode('usd')}
                    className={`px-3 py-1 rounded ${
                      displayMode === 'usd' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    USD
                  </button>
                  <button
                    onClick={() => setDisplayMode('underlying')}
                    className={`px-3 py-1 rounded ${
                      displayMode === 'underlying' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    Underlying
                  </button>
                </div>
              </div>

              {/* Portfolio Grid */}
              <PortfolioSummary 
                displayMode={displayMode}
              />
            </div>
          )}

          {portfolioTab === 'orders' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📋</span>
              </div>
              <h3 className="text-gray-400 text-lg mb-2">No Orders Found</h3>
              <p className="text-gray-500 text-sm">
                You haven't placed any orders yet. Start trading to see your order history here.
              </p>
            </div>
          )}
                              </div>
                            </div>
                          </div>
  )

  // Render Governance (veCORE) View
  const renderGovernanceView = () => (
    <div className="w-full px-6 py-6 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-6">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'lock', label: 'Lock' },
            { id: 'vote', label: 'Vote' },
            { id: 'app', label: 'App' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setGovernanceView(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                governanceView === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <CustomConnectButton />
      </div>

      {/* Tab Content */}
      {governanceView === 'overview' && (
        <>
          {/* veDashboard Header */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-8 text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">veDashboard</h1>
            <p className="text-gray-300 text-lg mb-6 max-w-3xl mx-auto">
              Lock your CORE to get veCORE. Boost rewards, channel incentives and participate in governance with veCORE.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-green-600 transition-all">
                Buy CORE
              </button>
              <button className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all">
                Claim Rewards
              </button>
            </div>
          </div>

          {/* Key Metrics Section */}
          <div className="grid grid-cols-6 gap-4 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">0</div>
              <div className="text-gray-400 text-sm">My veCORE</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">0</div>
              <div className="text-gray-400 text-sm">My Locked CORE</div>
              <div className="text-gray-500 text-xs">$0</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">N/A</div>
              <div className="text-gray-400 text-sm">Unlock Date</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">0</div>
              <div className="text-gray-400 text-sm">My CORE</div>
              <div className="text-gray-500 text-xs">$0</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">$0</div>
              <div className="text-gray-400 text-sm">My Rewards</div>
              <div className="text-gray-500 text-xs">All-time: $0</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">$0</div>
              <div className="text-gray-400 text-sm">Total Revenue</div>
              <div className="text-gray-500 text-xs">Protocol</div>
            </div>
          </div>

          <div className="text-center text-gray-400 mb-8">
            Next Reward Distribution: 15 September 2025
          </div>

          {/* Two Panel Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Panel - My Vote */}
            <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">My Vote</h3>
              <div className="text-center py-8">
                <div className="text-4xl font-bold text-blue-400 mb-2">0 veCORE</div>
                <div className="text-gray-400 mb-6">Current voting power</div>
                <div className="w-24 h-24 bg-blue-600/20 border border-blue-500/30 rounded-lg mx-auto mb-6 flex items-center justify-center">
                  <div className="text-3xl">🗳️</div>
                </div>
                <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-green-600 transition-all">
                  Revote
                </button>
              </div>
            </div>

            {/* Right Panel - My veCORE Balance */}
            <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">My veCORE Balance</h3>
              <div className="text-center py-8">
                <div className="text-4xl font-bold text-green-400 mb-2">0</div>
                <div className="text-gray-400 mb-6">Current balance</div>
                <div className="w-24 h-24 bg-green-600/20 border border-green-500/30 rounded-lg mx-auto mb-6 flex items-center justify-center">
                  <div className="text-3xl">🔒</div>
                </div>
                <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-green-600 transition-all">
                  Lock CORE
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {governanceView === 'dashboard' && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">veCORE Dashboard</h1>
            <p className="text-gray-400">Detailed metrics and governance statistics</p>
          </div>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-900/50 rounded-xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">veCORE Fees since 31 Jul 2025</h3>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-3xl font-bold text-white">{globalStats.veCOREFees}</span>
                <span className="text-blue-400">📈</span>
              </div>
            </div>
            
            <div className="bg-gray-900/50 rounded-xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">veCORE Historical APR</h3>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-3xl font-bold text-white">{globalStats.historicalAPR}</span>
                <span className="text-green-400">🔄</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-gray-400 text-sm">Revenue (Aug '25)</p>
              <p className="text-white font-bold text-lg">$0.00</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Total veCORE</p>
              <p className="text-white font-bold text-lg">{globalStats.totalveCORE}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Total Locked CORE</p>
              <p className="text-white font-bold text-lg">{globalStats.lockedCORE}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Avg Lock Duration</p>
              <p className="text-white font-bold text-lg">{globalStats.avgLockDuration}</p>
            </div>
          </div>
        </div>
      )}

      {governanceView === 'lock' && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Lock CORE for veCORE</h1>
            <p className="text-gray-400">Lock your CORE tokens to receive veCORE and participate in governance</p>
          </div>
          <GovernanceTab />
        </div>
      )}

      {governanceView === 'vote' && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Governance Voting</h1>
            <p className="text-gray-400">Participate in protocol governance with your veCORE tokens</p>
          </div>
          
          <div className="bg-gray-900/50 rounded-xl border border-gray-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Active Proposals</h3>
            <div className="space-y-4">
              {[
                { id: 1, title: 'Increase yield farming rewards for stCORE pools', status: 'Active', ends: '0 days', votes: '0 veCORE' },
                { id: 2, title: 'Add new BTCS staking markets', status: 'Active', ends: '0 days', votes: '0 veCORE' },
                { id: 3, title: 'Protocol fee adjustment for Point Markets', status: 'Pending', ends: '0 days', votes: '0 veCORE' }
              ].map((proposal) => (
                <div key={proposal.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium mb-1">{proposal.title}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          proposal.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {proposal.status}
                        </span>
                        <span>Ends in {proposal.ends}</span>
                        <span>{proposal.votes} total votes</span>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                      Vote
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {governanceView === 'app' && (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-white mb-4">Back to CoreYield</h2>
          <p className="text-gray-400 mb-6">Return to the main CoreYield application</p>
          <button 
            onClick={() => setCurrentView('dashboard')}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-green-600 transition-all"
          >
            Go to CoreYield
          </button>
        </div>
      )}
    </div>
  )

  // Render Staking View
  const renderStakingView = () => (
    <div className="w-full px-6 py-6 space-y-6">
      {/* Staking Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">🔥 CORE Staking</h1>
        <p className="text-gray-400 text-base max-w-2xl mx-auto">
          Stake your CORE tokens to earn stCORE and unlock the full power of yield tokenization. 
          This is your entry point to the CoreYield ecosystem.
        </p>
                            </div>

      {/* Staking Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-500/30 rounded-xl p-4 text-center">
          <div className="text-2xl mb-1">
            <svg className="w-8 h-8 mx-auto text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
                            </div>
          <h3 className="text-white font-semibold text-base mb-1">Network APY</h3>
          <p className="text-2xl font-bold text-orange-400">8.5%</p>
          <p className="text-gray-400 text-xs">Base staking rewards</p>
                            </div>
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-4 text-center">
          <div className="text-2xl mb-1">
            <svg className="w-8 h-8 mx-auto text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
                            </div>
          <h3 className="text-white font-semibold text-base mb-1">Total Staked</h3>
                          <p className="text-2xl font-bold text-blue-400">$0.00</p>
          <p className="text-gray-400 text-xs">Across all validators</p>
                          </div>
        <div className="bg-gradient-to-r from-green-600/20 to-teal-600/20 border border-green-500/30 rounded-xl p-4 text-center">
          <div className="text-2xl mb-1">
            <svg className="w-8 h-8 mx-auto text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-white font-semibold text-base mb-1">Your Rewards</h3>
                          <p className="text-2xl font-bold text-green-400">$0.00</p>
          <p className="text-gray-400 text-xs">Start staking to earn</p>
                        </div>
                      </div>

      {/* Staking Flow */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🚀 Your Staking Journey</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
                              </div>
            <h4 className="text-white font-medium text-sm">Stake CORE</h4>
            <p className="text-gray-400 text-xs">Lock tokens for rewards</p>
                              </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
                              </div>
            <h4 className="text-white font-medium text-sm">Get stCORE</h4>
            <p className="text-gray-400 text-xs">Receive staked tokens</p>
                              </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h4 className="text-white font-medium text-sm">Wrap to SY</h4>
            <p className="text-gray-400 text-xs">Convert to yield tokens</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-white font-medium text-sm">Split PT+YT</h4>
            <p className="text-gray-400 text-xs">Separate yield rights</p>
                            </div>
                          </div>
                          
        {/* Quick Actions */}
        <div className="flex space-x-3 mb-6">
                <button
            onClick={() => setCurrentView('dashboard')}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors flex items-center"
                >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Start Staking
                </button>
                <button
            onClick={() => setCurrentView('markets')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Go to Markets
                            </button>
                            <button 
            onClick={() => setShowTutorial(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.168 18.477 18.582 18 16.836 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Learn More
                </button>
                          </div>
              </div>

      {/* Staking Interface */}
      <StakeTab 
        selectedAsset={selectedAsset}
        setDashboardTab={() => {}} // Not needed in this context
      />
            </div>
  )

  // Render Pools View
  const renderPoolsView = () => (
    <PoolsTab />
  )

  // Render Bridge View
  const renderBridgeView = () => (
    <BridgeTab />
  )

  // Render Swap View
  const renderSwapView = () => (
    <div className="w-full px-6 py-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">CoreSwap</h1>
        <p className="text-gray-400">Swap tokens on CoreDAO</p>
          </div>
      <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6 text-center">
        <p className="text-gray-400">Swap functionality coming soon...</p>
        </div>
    </div>
  )

  // Tutorial Component
  const renderTutorial = () => {
    const tutorialSteps = [
      {
        title: "Welcome to CoreYield!",
        description: "Let's get you started with yield tokenization. This is how you can separate your yield from your principal.",
        action: "Get Started",
        icon: (
          <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )
      },
      {
        title: "Step 1: Stake CORE",
        description: "First, stake your CORE tokens to earn stCORE. This gives you the yield-bearing asset needed for tokenization.",
        action: "Go to Staking",
        icon: (
          <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      },
      {
        title: "Step 2: Wrap to SY",
        description: "Convert your stCORE tokens to Standardized Yield tokens (SY). This is your entry point to yield tokenization.",
        action: "Go to Markets",
        icon: (
          <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        )
      },
      {
        title: "Step 3: Split SY",
        description: "Split your SY tokens into Principal Tokens (PT) and Yield Tokens (YT). PT = your capital, YT = your yield rights.",
        action: "Learn More",
        icon: (
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      {
        title: "Step 4: Trade & Earn",
        description: "Hold PT for stability, trade YT for yield optimization, or claim yield continuously from your YT positions.",
        action: "Start Trading",
        icon: (
          <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      }
    ]
    
    const currentStep = tutorialSteps[tutorialStep]
    
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-600 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">{currentStep.icon}</div>
          <h2 className="text-2xl font-bold text-white mb-4">{currentStep.title}</h2>
          <p className="text-gray-300 mb-6 leading-relaxed">{currentStep.description}</p>
          
          <div className="flex space-x-3 mb-6">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === tutorialStep ? 'bg-blue-500' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
          
          <div className="flex space-x-3">
            {tutorialStep > 0 && (
        <button
                onClick={() => setTutorialStep(prev => prev - 1)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
        >
                Previous
        </button>
      )}

            {tutorialStep < tutorialSteps.length - 1 ? (
              <button
                onClick={() => setTutorialStep(prev => prev + 1)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {currentStep.action}
              </button>
            ) : (
                              <button 
                                onClick={() => {
                  setShowTutorial(false)
                  setTutorialStep(0)
                  setCurrentView('dashboard')
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Start Staking!
                              </button>
            )}
              </div>

          <button
            onClick={() => setShowTutorial(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
                          </div>
                    </div>
                  )
  }

    const renderTradingView = () => {
    const { tokenType, asset, market } = tradingView
    const isYT = tokenType === 'YT'

    return (
      <div className="w-full px-4 py-2 space-y-2">
        {/* Trading Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentView('markets')}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
                <div>
              <h1 className="text-xl font-bold text-white">{tokenType} {market?.name || asset}</h1>
              <p className="text-gray-400 text-sm">Trade {tokenType} tokens on CoreDAO</p>
                </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-white hover:bg-gray-600 transition-colors text-sm">
              Specs
            </button>
            <button className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
            <div className="text-right">
              <div className="text-white font-medium">
                {market?.maturity ? new Date(market.maturity * 1000).toLocaleDateString() : 'N/A'}
              </div>
              <div className="text-gray-400 text-sm">
                {market?.maturity ? Math.ceil((market.maturity - Math.floor(Date.now() / 1000)) / (24 * 60 * 60)) : 'N/A'} days
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 h-[600px]">
          {/* Left Panel - Market Info & Charts (Balanced Height) */}
          <div className="lg:col-span-2 space-y-2">
                        {/* Sub Navigation */}
            <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1">
              {['Market Info', 'Charts', 'Book'].map((tab) => (
                  <button
                  key={tab}
                  onClick={() => setLeftPanelTab(tab as 'Market Info' | 'Charts' | 'Book')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    leftPanelTab === tab ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab}
                  </button>
              ))}
              </div>
              
                        {/* Dynamic Content Based on Selected Tab */}
            {leftPanelTab === 'Market Info' && (
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 h-[520px] overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl font-bold text-green-400">
                      {isYT ? '8.5%' : '6.2%'}
                    </div>
                    <div className="text-green-400 text-sm">
                      +2.1% (Past 7d)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium text-sm">Market Mode</div>
                    <div className="text-green-400 text-xs">BULLISH</div>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  1 {tokenType} {market?.name || asset} gives the yield and points of 1 {market?.underlying || asset} staked in Core until maturity.
                </p>
                
                {/* Enhanced Market Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1">Liquidity</div>
                    <div className="text-white font-bold text-lg">$0.00</div>
                    <div className="text-green-400 text-xs">+12.5%</div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1">Volume 24h</div>
                    <div className="text-white font-bold text-lg">$0.00</div>
                    <div className="text-red-400 text-xs">-3.2%</div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1">Maturity</div>
                    <div className="text-white font-bold text-lg">
                      {market?.maturity ? Math.ceil((market.maturity - Math.floor(Date.now() / 1000)) / (24 * 60 * 60)) : 'N/A'} days
                    </div>
                    <div className="text-blue-400 text-xs">
                      {market?.maturity ? new Date(market.maturity * 1000).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1">Pool Reserves</div>
                    <div className="text-white font-bold text-lg">
                      PT: {market?.poolReserves?.pt || '0'} | YT: {market?.poolReserves?.yt || '0'}
                    </div>
                    <div className="text-green-400 text-xs">Active Market</div>
                  </div>
                </div>

                {/* Trading Signals */}
                <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-3 mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-blue-300 font-medium">Trading Signal</span>
                  </div>
                  <p className="text-blue-200 text-sm">Strong buy signal for {tokenType} {market?.name || asset}. APY trending upward with increasing liquidity.</p>
                </div>

                {/* Risk Assessment */}
                <div className="bg-orange-600/10 border border-orange-500/20 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-orange-300 font-medium">Risk Level</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div key={level} className={`w-3 h-3 rounded-full ${level <= 2 ? 'bg-green-500' : level <= 4 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                      ))}
                    </div>
                    <span className="text-orange-200 text-sm">Low Risk (2/5)</span>
                  </div>
                </div>
              </div>
            )}

            {leftPanelTab === 'Charts' && (
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 h-[520px]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <select 
                      value={chartMetric} 
                      onChange={(e) => setChartMetric(e.target.value as 'apy' | 'price' | 'volume')}
                      className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 text-white text-sm"
                    >
                      <option value="apy">APY</option>
                      <option value="price">Price</option>
                      <option value="volume">Volume</option>
                    </select>
                    <div className="flex space-x-1">
                      <button className="p-1 hover:bg-gray-700/50 rounded transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                      <button className="p-1 hover:bg-gray-700/50 rounded transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    {['1m', '1H', '1D', '1W'].map((timeframe) => (
                  <button
                        key={timeframe}
                        onClick={() => setChartTimeframe(timeframe)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          chartTimeframe === timeframe ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                        {timeframe}
                  </button>
                    ))}
                </div>
              </div>
                
                {/* Real Chart Implementation */}
                <div className="h-[450px] bg-gray-900/50 rounded-lg border border-gray-700/50 p-2">
                  <ChartComponent 
                    data={chartData}
                    metric={chartMetric}
                    timeframe={chartTimeframe}
                    tokenType={tokenType}
                    asset={asset}
                  />
            </div>
              </div>
            )}

            {leftPanelTab === 'Book' && (
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 h-[520px] overflow-y-auto">
                <div className="text-center mb-3">
                  <div className="text-white font-medium text-lg">Order Book</div>
                  <div className="text-gray-400 text-sm">Live market depth</div>
              </div>
                
                {/* Market Summary */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center">
                    <div className="text-gray-400 text-xs">Spread</div>
                    <div className="text-white font-medium">0.003</div>
              </div>
                  <div className="text-center">
                    <div className="text-gray-400 text-xs">Mid Price</div>
                    <div className="text-white font-medium">0.993</div>
              </div>
                  <div className="text-center">
                    <div className="text-gray-400 text-xs">Depth</div>
                    <div className="text-white font-medium">$0.00</div>
              </div>
            </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-400">Price</span>
                    <span className="text-gray-400">Size</span>
                    <span className="text-gray-400">Total</span>
                  </div>
                  
                  {/* Sell Orders */}
                  <div className="space-y-1">
                    {[
                      { price: 0.995, size: 100 },
                      { price: 0.994, size: 150 },
                      { price: 0.993, size: 200 },
                      { price: 0.992, size: 250 },
                      { price: 0.991, size: 300 }
                    ].map((order, i) => (
                      <div key={i} className="flex justify-between text-xs text-red-400 hover:bg-red-500/10 p-1 rounded cursor-pointer">
                        <span>{order.price.toFixed(3)}</span>
                        <span>{order.size.toFixed(0)}</span>
                        <span>{(order.price * order.size).toFixed(1)}</span>
                              </div>
                    ))}
                              </div>
                  
                  <div className="border-t border-gray-600 my-2"></div>
                  
                  {/* Buy Orders */}
                  <div className="space-y-1">
                    {[
                      { price: 0.990, size: 180 },
                      { price: 0.989, size: 220 },
                      { price: 0.988, size: 270 },
                      { price: 0.987, size: 320 },
                      { price: 0.986, size: 370 }
                    ].map((order, i) => (
                      <div key={i} className="flex justify-between text-xs text-green-400 hover:bg-green-500/10 p-1 rounded cursor-pointer">
                        <span>{order.price.toFixed(3)}</span>
                        <span>{order.size.toFixed(0)}</span>
                        <span>{(order.price * order.size).toFixed(1)}</span>
                            </div>
                    ))}
                              </div>
                            </div>
              </div>
            )}
                          </div>
                          
          {/* Right Panel - Trading Interface (Balanced Height) */}
          <div className="space-y-2 h-[520px] overflow-y-auto">
            {/* Compact Balance Box - Top of Swap Interface */}
            <div className="p-3 bg-gray-700/50 rounded-lg border border-gray-600/30">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-gray-300 text-sm font-medium">Core Balances</span>
                  <div className="text-gray-500 text-xs">
                    {(() => {
                      console.log('🔍 Core Balances Debug - currentView:', currentView);
                      console.log('🔍 Core Balances Debug - tradingView:', tradingView);
                      console.log('🔍 Core Balances Debug - asset:', tradingView.asset);
                      console.log('🔍 Core Balances Debug - market:', tradingView.market);
                      
                      return currentView === 'trading' && tradingView.asset 
                        ? `${tradingView.asset} Market` 
                        : 'stCORE Market';
                    })()}
                  </div>
                  {/* Debug info */}
                  <div className="text-xs text-red-400 mt-1">
                    Debug: currentView={currentView}, asset={tradingView.asset || 'none'}
                  </div>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="text-blue-400 hover:text-blue-300 text-xs underline"
                >
                  Refresh
                </button>
              </div>
              
              {/* First Line - Core Assets */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-600/30">
                  <div className="text-gray-400 text-xs mb-1">CORE</div>
                  <div className="text-white text-sm font-semibold">
                    {coreYield.isLoadingBalances ? (
                      <div className="flex items-center space-x-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
                        <span className="text-xs text-gray-400">...</span>
                      </div>
                    ) : (
                      parseFloat(coreYield.userBalances?.dualCORE?.underlying || '0.00').toFixed(2)
                    )}
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-600/30">
                  <div className="text-gray-400 text-xs mb-1">stCORE</div>
                  <div className="text-white text-sm font-semibold">
                    {coreYield.isLoadingBalances ? (
                      <div className="flex items-center space-x-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-400"></div>
                        <span className="text-xs text-gray-400">...</span>
                      </div>
                    ) : (
                      parseFloat(coreYield.userBalances?.stCORE?.underlying || '0.00').toFixed(2)
                    )}
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-600/30">
                  <div className="text-gray-400 text-xs mb-1">lstBTC</div>
                  <div className="text-white text-sm font-semibold">
                    {coreYield.isLoadingBalances ? (
                      <div className="flex items-center space-x-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-400"></div>
                        <span className="text-xs text-gray-400">...</span>
                      </div>
                    ) : (
                      (() => {
                        const value = coreYield.userBalances?.lstBTC?.underlying || '0.00';
                        console.log('🔍 MainDashboard Debug - lstBTC value:', value);
                        return parseFloat(value).toFixed(2);
                      })()
                    )}
                  </div>
                </div>
              </div>

              {/* Second Line - Tokenized Assets */}
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-600/30">
                  <div className="text-gray-400 text-xs mb-1">
                    SY ({currentView === 'trading' && tradingView.asset 
                      ? tradingView.asset.startsWith('lstBTC') ? 'lstBTC' : 'stCORE'
                      : 'stCORE'
                    })
                  </div>
                  <div className="text-white text-sm font-semibold">
                    {coreYield.isLoadingBalances ? (
                      <div className="flex items-center space-x-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-400"></div>
                        <span className="text-xs text-gray-400">...</span>
                      </div>
                    ) : (
                      (() => {
                        // Show data for the currently selected market
                        if (currentView === 'trading' && tradingView.asset) {
                          const marketName = tradingView.asset;
                          if (marketName.startsWith('lstBTC')) {
                            return parseFloat(coreYield.userBalances?.lstBTC?.sy || '0').toFixed(2);
                          } else if (marketName.startsWith('stCORE')) {
                            return parseFloat(coreYield.userBalances?.stCORE?.sy || '0').toFixed(2);
                          }
                        }
                        // Default to stCORE
                        return parseFloat(coreYield.userBalances?.stCORE?.sy || '0').toFixed(2);
                      })()
                    )}
                  </div>
                  <div className="mt-1">
                    <button
                      onClick={() => coreYield.refreshTokenBalances()}
                      className="text-blue-400 hover:text-blue-300 text-xs underline"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-600/30">
                  <div className="text-gray-400 text-xs mb-1">
                    PT ({currentView === 'trading' && tradingView.asset 
                      ? tradingView.asset.startsWith('lstBTC') ? 'lstBTC' : 'stCORE'
                      : 'stCORE'
                    })
                  </div>
                  <div className="text-white text-sm font-semibold">
                    {coreYield.isLoadingBalances ? (
                      <div className="flex items-center space-x-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
                        <span className="text-xs text-gray-400">...</span>
                      </div>
                    ) : (
                      (() => {
                        // Show data for the currently selected market
                        if (currentView === 'trading' && tradingView.asset) {
                          const marketName = tradingView.asset;
                          if (marketName.startsWith('lstBTC')) {
                            return parseFloat(coreYield.userBalances?.lstBTC?.pt || '0').toFixed(2);
                          } else if (marketName.startsWith('stCORE')) {
                            return parseFloat(coreYield.userBalances?.stCORE?.pt || '0').toFixed(2);
                          }
                        }
                        // Default to stCORE
                        return parseFloat(coreYield.userBalances?.stCORE?.pt || '0').toFixed(2);
                      })()
                    )}
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-600/30">
                  <div className="text-gray-400 text-xs mb-1">
                    YT ({currentView === 'trading' && tradingView.asset 
                      ? tradingView.asset.startsWith('lstBTC') ? 'lstBTC' : 'stCORE'
                      : 'stCORE'
                    })
                  </div>
                  <div className="text-white text-sm font-semibold">
                    {coreYield.isLoadingBalances ? (
                      <div className="flex items-center space-x-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-400"></div>
                        <span className="text-xs text-gray-400">...</span>
                      </div>
                    ) : (
                      (() => {
                        // Show data for the currently selected market
                        if (currentView === 'trading' && tradingView.asset) {
                          const marketName = tradingView.asset;
                          if (marketName.startsWith('lstBTC')) {
                            return parseFloat(coreYield.userBalances?.lstBTC?.yt || '0').toFixed(2);
                          } else if (marketName.startsWith('stCORE')) {
                            return parseFloat(coreYield.userBalances?.stCORE?.yt || '0').toFixed(2);
                          }
                        }
                        // Default to stCORE
                        return parseFloat(coreYield.userBalances?.stCORE?.yt || '0').toFixed(2);
                      })()
                    )}
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-600/30">
                  <div className="text-gray-400 text-xs mb-1">Claim</div>
                  <div className="text-white text-sm font-semibold">
                    {coreYield.isLoadingBalances ? (
                      <div className="flex items-center space-x-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-400"></div>
                        <span className="text-xs text-gray-400">...</span>
                      </div>
                    ) : (
                      (() => {
                        // Show claimable yield for the currently selected market
                        if (currentView === 'trading' && tradingView.asset) {
                          const marketName = tradingView.asset;
                          if (marketName.startsWith('lstBTC')) {
                            // For lstBTC markets, show 0 claimable (no staking rewards)
                            return '0.0000';
                          } else if (marketName.startsWith('stCORE')) {
                            // For stCORE markets, show staking rewards
                            const claimable = coreYield.userBalances?.stCORE?.claimableYield || '0.00';
                            return parseFloat(claimable).toFixed(4);
                          }
                        }
                        // Default to stCORE claimable yield
                        const claimable = coreYield.userBalances?.stCORE?.claimableYield || '0.00';
                        return parseFloat(claimable).toFixed(4);
                      })()
                    )}
                  </div>
                </div>
              </div>
                          </div>
                          
            {/* Token Type Selection */}
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-2">
              <div className="flex space-x-2 mb-2">
                            <button 
                  className={`flex-1 py-1 px-2 rounded-lg font-medium transition-colors text-sm ${
                    tokenType === 'PT' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  onClick={() => setTradingView(prev => ({ ...prev, tokenType: 'PT' }))}
                >
                  PT
                            </button>
                            <button 
                  className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                    tokenType === 'YT' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  onClick={() => setTradingView(prev => ({ ...prev, tokenType: 'YT' }))}
                >
                  YT
                            </button>
              </div>
              <button className="w-full py-1 px-3 bg-gray-700 border border-gray-600 rounded-lg text-white hover:bg-gray-600 transition-colors text-sm">
                Go to LP
              </button>
            </div>

                          {/* Trading Controls */}
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex space-x-1">
                    {[
                      { id: 'swap', label: 'Swap' },
                      { id: 'limit', label: 'Limit' },
                      { id: 'tools', label: 'Tools' }
                    ].map((tab) => (
                            <button 
                        key={tab.id}
                        onClick={() => setTradingTab(tab.id as 'swap' | 'limit' | 'tools')}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                          tradingTab === tab.id 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                            : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/70 hover:text-white border border-gray-600/30'
                        }`}
                      >
                        {tab.label}
                            </button>
                    ))}
                  </div>
                <div className="flex space-x-2">
                  <button className="p-2 hover:bg-gray-700/50 rounded transition-colors">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <button className="p-2 hover:bg-gray-700/50 rounded transition-colors">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                    </div>
                  </div>
                  
              {/* Tools Tab Content */}
              {tradingTab === 'tools' && (
                <div className="space-y-2">
                  {/* Enhanced Tools Sub-tabs - Complete Yield Journey */}
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    {[
                      { id: 'stake', label: 'Stake', color: 'bg-blue-600', icon: '🔒' },
                      { id: 'wrap', label: 'Wrap', color: 'bg-purple-600', icon: '📦' },
                      { id: 'split', label: 'Split', color: 'bg-green-600', icon: '✂️' }
                    ].map((subTab) => (
                            <button 
                        key={subTab.id}
                        onClick={() => setToolsTab(subTab.id as 'stake' | 'wrap' | 'split' | 'merge' | 'unwrap' | 'unstake')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                          toolsTab === subTab.id 
                            ? subTab.color + ' text-white shadow-lg' 
                            : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/70 hover:text-white border border-gray-600/30'
                        }`}
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span className="text-xs">{subTab.icon}</span>
                          <span>{subTab.label}</span>
                        </div>
                            </button>
                    ))}
                          </div>
                  
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    {[
                      { id: 'merge', label: 'Merge', color: 'bg-orange-600', icon: '🔗' },
                      { id: 'unwrap', label: 'Unwrap', color: 'bg-indigo-600', icon: '📤' },
                      { id: 'unstake', label: 'Unstake', color: 'bg-red-600', icon: '🔓' }
                    ].map((subTab) => (
                      <button
                        key={subTab.id}
                        onClick={() => setToolsTab(subTab.id as 'stake' | 'wrap' | 'split' | 'merge' | 'unwrap' | 'unstake' | 'mint')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                          toolsTab === subTab.id 
                            ? subTab.color + ' text-white shadow-lg' 
                            : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/70 hover:text-white border border-gray-600/30'
                        }`}
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span className="text-xs">{subTab.icon}</span>
                          <span>{subTab.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    {[
                      { id: 'claim', label: 'Claim', color: 'bg-green-600', icon: '💰' },
                      { id: 'redeem', label: 'Redeem', color: 'bg-amber-600', icon: '🔓' },
                      { id: 'mint', label: 'Mint', color: 'bg-yellow-600', icon: '🪙' }
                    ].map((subTab) => (
                      <button
                        key={subTab.id}
                        onClick={() => setToolsTab(subTab.id as 'stake' | 'wrap' | 'split' | 'merge' | 'unwrap' | 'unstake' | 'claim' | 'mint')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                          toolsTab === subTab.id 
                            ? subTab.color + ' text-white shadow-lg' 
                            : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/70 hover:text-white border border-gray-600/30'
                        }`}
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span className="text-xs">{subTab.icon}</span>
                          <span>{subTab.label}</span>
                              </div>
                      </button>
                    ))}
                                </div>



              {/* Dynamic Input/Output Section Based on Tool Type */}
              {toolsTab === 'stake' && (
                <div className="space-y-2">
                  <div className="bg-gray-700/50 rounded-xl p-2 border border-gray-600/30">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-gray-300 text-xs font-medium">Stake CORE</label>
                      <div className="text-gray-400 text-xs">
                        Balance: {coreYield.userBalances.dualCORE?.underlying || '0'}
                            </div>
                    </div>
                    <input
                      type="number"
                      placeholder="0"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      className="w-full bg-transparent text-white text-sm font-medium outline-none"
                    />
                    <div className="text-gray-400 text-xs mt-0.5">
                      ${parseFloat(stakeAmount || '0') * 1.05}
                    </div>
                  </div>
                              <button 
                    onClick={() => coreYield.stake(stakeAmount, CONTRACTS.MOCK_ASSETS.dualCORE as `0x${string}`)}
                    disabled={!stakeAmount || parseFloat(stakeAmount) <= 0 || coreYield.transactionStatuses.stake === 'pending'}
                    className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 text-sm"
                  >
                    {coreYield.transactionStatuses.stake === 'pending' ? 'Processing...' : 'Stake CORE'}
                              </button>
                </div>
              )}

              {toolsTab === 'wrap' && (
                <div className="space-y-2">
                  <div className="bg-gray-700/50 rounded-xl p-2 border border-gray-600/30">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-gray-300 text-xs font-medium">Wrap to SY</label>
                      <div className="text-gray-400 text-xs">
                        Balance: {coreYield.userBalances[selectedAsset]?.sy || '0'}
                      </div>
                    </div>
                    <input
                      type="number"
                      placeholder="0"
                      value={wrapAmount}
                      onChange={(e) => setWrapAmount(e.target.value)}
                      className="w-full bg-transparent text-white text-sm font-medium outline-none"
                    />
                    <div className="text-gray-400 text-xs mt-0.5">
                      ${parseFloat(wrapAmount || '0') * 1.25}
                    </div>
                  </div>
                              <button 
                    onClick={() => coreYield.wrapToSY(getMarketKey(selectedAsset), wrapAmount)}
                    disabled={!wrapAmount || parseFloat(wrapAmount) <= 0 || coreYield.transactionStatuses.wrap === 'pending'}
                    className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 text-sm"
                  >
                    {coreYield.transactionStatuses.wrap === 'pending' ? 'Processing...' : 'Wrap to SY'}
                              </button>
                            </div>
              )}

              {toolsTab === 'split' && (
                <div className="space-y-2">
                  <div className="bg-gray-700/50 rounded-xl p-2 border border-gray-600/30">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-gray-300 text-xs font-medium">Split SY</label>
                      <div className="text-gray-400 text-xs">
                        Balance: {(() => {
                          const balance = coreYield.userBalances[selectedAsset]?.sy || '0';
                          console.log(`🔍 MainDashboard Split SY Balance Debug - selectedAsset: ${selectedAsset}, balance: ${balance}`);
                          console.log('🔍 MainDashboard Split SY Balance Debug - full userBalances:', coreYield.userBalances);
                          return balance;
                        })()}
                          </div>
                        </div>
                    <input
                      type="number"
                      placeholder="0"
                      value={splitAmount}
                      onChange={(e) => setSplitAmount(e.target.value)}
                      className="w-full bg-transparent text-white text-sm font-medium outline-none"
                    />
                    <div className="text-gray-400 text-xs mt-0.5">
                      ${parseFloat(splitAmount || '0') * 1.25}
                    </div>
            </div>
                  <div className="bg-gray-700/50 rounded-xl p-2 border border-gray-600/30">
                    <div className="text-gray-300 text-xs font-medium mb-1">Output (PT + YT)</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center space-x-1">
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">🔒</div>
                        <span className="text-white">PT</span>
                        <span className="text-gray-400">{splitAmount || '0'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">📈</div>
                        <span className="text-white">YT</span>
                        <span className="text-gray-400">{splitAmount || '0'}</span>
                      </div>
                    </div>
                </div>
                <button 
                    onClick={() => coreYield.splitSY(getMarketKey(selectedAsset), splitAmount)}
                    disabled={!splitAmount || parseFloat(splitAmount) <= 0 || coreYield.transactionStatuses.split === 'pending'}
                    className="w-full py-2 px-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 text-sm"
                >
                    {coreYield.transactionStatuses.split === 'pending' ? 'Processing...' : 'Split SY'}
                </button>
              </div>
              )}

              {toolsTab === 'merge' && (
                <div className="space-y-2">
                  <div className="bg-gray-700/50 rounded-xl p-2 border border-gray-600/30">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-gray-300 text-xs font-medium">Merge PT + YT</label>
                      <div className="text-gray-400 text-xs">
                        PT: {coreYield.userBalances[selectedAsset]?.pt || '0'} | YT: {coreYield.userBalances[selectedAsset]?.yt || '0'}
                          </div>
                        </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div className="flex items-center space-x-1">
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">🔒</div>
                        <span className="text-white">PT</span>
                        <input 
                          type="number" 
                          placeholder="0" 
                          value={mergePtAmount}
                          onChange={(e) => setMergePtAmount(e.target.value)}
                          className="w-16 bg-transparent text-white text-xs outline-none" 
                        />
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">📈</div>
                        <span className="text-white">YT</span>
                        <input 
                          type="number" 
                          placeholder="0" 
                          value={mergeYtAmount}
                          onChange={(e) => setMergeYtAmount(e.target.value)}
                          className="w-16 bg-transparent text-white text-xs outline-none" 
                        />
                      </div>
                    </div>
                  </div>
                        <button 
                    onClick={() => coreYield.mergePTYT(getMarketKey(selectedAsset), mergePtAmount, mergeYtAmount)}
                    disabled={!mergePtAmount || !mergeYtAmount || parseFloat(mergePtAmount) <= 0 || parseFloat(mergeYtAmount) <= 0 || coreYield.transactionStatuses.merge === 'pending'}
                    className="w-full py-2 px-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 text-sm"
                  >
                    {coreYield.transactionStatuses.merge === 'pending' ? 'Processing...' : 'Merge to SY'}
                        </button>
                      </div>
              )}

              {toolsTab === 'unwrap' && (
                <div className="space-y-2">
                  <div className="bg-gray-700/50 rounded-xl p-2 border border-gray-600/30">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-gray-300 text-xs font-medium">Unwrap from SY</label>
                      <div className="text-gray-400 text-xs">
                        Balance: {coreYield.userBalances[selectedAsset]?.sy || '0'}
              </div>
            </div>
                    <input
                      type="number"
                      placeholder="0"
                      value={unwrapAmount}
                      onChange={(e) => setUnwrapAmount(e.target.value)}
                      className="w-full bg-transparent text-white text-sm font-medium outline-none"
                    />
                    <div className="text-gray-400 text-xs mt-0.5">
                      ${parseFloat(unwrapAmount || '0') * 1.25}
                    </div>
                  </div>
                  <button 
                    onClick={() => coreYield.unwrapFromSY(getMarketKey(selectedAsset), unwrapAmount)}
                    disabled={!unwrapAmount || parseFloat(unwrapAmount) <= 0 || coreYield.transactionStatuses.unwrap === 'pending'}
                    className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 text-sm"
                  >
                    {coreYield.transactionStatuses.unwrap === 'pending' ? 'Processing...' : 'Unwrap to Asset'}
                  </button>
          </div>
        )}

              {toolsTab === 'unstake' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-300 text-xs font-medium">Unstake stCORE</label>
                    <input
                      type="number"
                      placeholder="0.0"
                      className="w-full mt-1 px-3 py-2 bg-gray-800/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={unstakeAmount}
                      onChange={(e) => setUnstakeAmount(e.target.value)}
                    />
                    <div className="text-gray-400 text-xs mt-0.5">${parseFloat(unstakeAmount || '0') * 1.05}</div>
                  </div>
                  
                  {/* Lock Period Information */}
                  {lockPeriodInfo && (
                    <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-600/20">
                      {lockPeriodInfo.isLocked ? (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                            <span className="text-yellow-400 text-sm font-medium">Unstake Locked</span>
                          </div>
                          <div className="text-gray-300 text-sm">
                            Available in <span className="font-semibold text-yellow-400">{lockPeriodInfo.remainingDays} day(s)</span>
                          </div>
                          <div className="text-gray-400 text-xs">
                            Unlocks on {lockPeriodInfo.unlockDate.toLocaleDateString()} at {lockPeriodInfo.unlockDate.toLocaleTimeString()}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-green-400 text-sm font-medium">Unstake Available</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <button 
                    onClick={() => coreYield.unstake(selectedAsset, unstakeAmount)}
                    disabled={!unstakeAmount || parseFloat(unstakeAmount) <= 0 || coreYield.transactionStatuses.unstake === 'pending' || (lockPeriodInfo?.isLocked)}
                    className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 text-sm"
                  >
                    {coreYield.transactionStatuses.unstake === 'pending' ? 'Processing...' : 
                     lockPeriodInfo?.isLocked ? 'Unstake Locked' : 'Unstake to CORE'}
                  </button>
                </div>
              )}

              {toolsTab === 'claim' && (
                <div className="space-y-2">
                  <div className="bg-gray-700/50 rounded-xl p-2 border border-gray-600/30">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-gray-300 text-xs font-medium">Claim Yield</label>
                      <div className="text-gray-400 text-xs">
                        Available: {(() => {
                        const claimable = coreYield.userBalances[selectedAsset as keyof typeof coreYield.userBalances]?.claimableYield || '0';
                        return parseFloat(claimable).toFixed(4);
                      })()}
                      </div>
                    </div>
                    <div className="text-gray-400 text-xs">
                      {parseFloat(coreYield.userBalances[selectedAsset as keyof typeof coreYield.userBalances]?.claimableYield || '0') > 0 
                        ? `Ready to claim ${(() => {
                            const claimable = coreYield.userBalances[selectedAsset as keyof typeof coreYield.userBalances]?.claimableYield || '0';
                            return parseFloat(claimable).toFixed(4);
                          })()} ${selectedAsset}`
                        : 'No yield available to claim'
                      }
                    </div>


                  </div>
                  <button 
                    onClick={() => coreYield.claimYield(selectedAsset)}
                    disabled={coreYield.transactionStatuses.claim === 'pending' || parseFloat(coreYield.userBalances[selectedAsset as keyof typeof coreYield.userBalances]?.claimableYield || '0') <= 0}
                    className="w-full py-2 px-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 text-sm"
                  >
                    {coreYield.transactionStatuses.claim === 'pending' ? 'Processing...' : 'Claim Yield'}
                  </button>
                </div>
              )}

              {toolsTab === 'redeem' && (
                <div className="space-y-2">
                  <div className="bg-gray-700/50 rounded-xl p-2 border border-gray-600/30">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-gray-300 text-xs font-medium">Redeem PT for Underlying</label>
                      <div className="text-gray-400 text-xs">Asset: {selectedAsset}</div>
                    </div>
                    <div className="text-gray-400 text-xs mb-2">
                      PT Balance: {coreYield.userBalances[selectedAsset]?.pt || '0'}
                    </div>
                    <div className="text-gray-400 text-xs mb-2">
                      {(() => {
                        // Check if market is matured (this would need to come from contract)
                        const isMatured = false; // TODO: Get from contract
                        return isMatured ? '✅ Market matured - Ready to redeem' : '⏳ Market not matured yet';
                      })()}
                    </div>
                    <input
                      type="number"
                      placeholder="0"
                      value={redeemAmount}
                      onChange={(e) => setRedeemAmount(e.target.value)}
                      className="w-full bg-transparent text-white text-sm font-medium outline-none"
                    />
                    <div className="text-gray-400 text-xs mt-0.5">
                      Redeem {redeemAmount || '0'} PT for underlying {selectedAsset}
                    </div>
                  </div>
                  <button 
                    onClick={() => coreYield.redeemPT(selectedAsset, redeemAmount)}
                    disabled={!redeemAmount || parseFloat(redeemAmount) <= 0 || coreYield.transactionStatuses.redeem === 'pending'}
                    className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 text-sm"
                  >
                    {coreYield.transactionStatuses.redeem === 'pending' ? 'Processing...' : 'Redeem PT'}
                  </button>
                </div>
              )}

              {toolsTab === 'mint' && (
                <div className="space-y-2">
                  <div className="bg-gray-700/50 rounded-xl p-2 border border-gray-600/30">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-gray-300 text-xs font-medium">Mint Test Tokens</label>
                      <div className="text-gray-400 text-xs">Asset: {selectedAsset}</div>
                  </div>
                    <input
                      type="number"
                      placeholder="0"
                      value={mintAmount}
                      onChange={(e) => setMintAmount(e.target.value)}
                      className="w-full bg-transparent text-white text-sm font-medium outline-none"
                    />
                    <div className="text-gray-400 text-xs mt-0.5">
                      Mint {mintAmount || '0'} {selectedAsset} tokens for testing
                    </div>
                  </div>
                  <button 
                    onClick={() => coreYield.mintTokens(selectedAsset as 'dualCORE' | 'stCORE' | 'lstBTC', mintAmount)}
                    disabled={!mintAmount || parseFloat(mintAmount) <= 0 || coreYield.transactionStatuses.mint === 'pending'}
                    className="w-full py-2 px-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 text-sm"
                  >
                    {coreYield.transactionStatuses.mint === 'pending' ? 'Processing...' : 'Mint Tokens'}
                  </button>
                </div>
              )}
              </div>
              )}

              {/* Swap Tab Content */}
              {tradingTab === 'swap' && (
                <div className="space-y-2">
                  <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-2">
                    <p className="text-blue-300 text-sm text-center">
                      Swap PT and YT tokens directly
                    </p>
                  </div>
                  
                  {/* Swap Direction Selection */}
                  <div className="bg-gray-700/50 rounded-xl p-3 border border-gray-600/30">
                    <div className="flex space-x-2 mb-3">
                      <button 
                        onClick={() => setSwapDirection('pt-to-yt')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                          swapDirection === 'pt-to-yt' 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        }`}
                      >
                        🔒 PT → 📈 YT
                      </button>
                      <button 
                        onClick={() => setSwapDirection('yt-to-pt')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                          swapDirection === 'yt-to-pt' 
                            ? 'bg-green-600 text-white shadow-lg shadow-green-600/25' 
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        }`}
                      >
                        📈 YT → 🔒 PT
                      </button>
                    </div>
                  </div>

                  {/* From Token */}
                  <div className="bg-gray-700/50 rounded-xl p-3 border border-gray-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-gray-300 text-xs font-medium">From</label>
                      <div className="text-gray-400 text-xs">
                        Balance: {(() => {
                          if (swapDirection === 'pt-to-yt') {
                            return coreYield.userBalances[selectedAsset]?.pt || '0'
                          } else {
                            return coreYield.userBalances[selectedAsset]?.yt || '0'
                          }
                        })()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs text-white ${
                        swapDirection === 'pt-to-yt' ? 'bg-blue-500' : 'bg-green-500'
                      }`}>
                        {swapDirection === 'pt-to-yt' ? '🔒' : '📈'}
                      </div>
                      <span className="text-white font-medium text-sm">
                        {swapDirection === 'pt-to-yt' ? 'PT' : 'YT'} {selectedAsset}
                      </span>
                      <button 
                        onClick={() => {
                          const balance = swapDirection === 'pt-to-yt' 
                            ? coreYield.userBalances[selectedAsset]?.pt || '0'
                            : coreYield.userBalances[selectedAsset]?.yt || '0'
                          setSwapAmount(balance)
                        }}
                        className="px-2 py-1 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-500 transition-all duration-200"
                      >
                        Max
                      </button>
                    </div>
                    <input
                      type="number"
                      placeholder="0"
                      value={swapAmount}
                      onChange={(e) => {
                        console.log('🔍 Debug: Input changed, new value:', e.target.value)
                        setSwapAmount(e.target.value)
                      }}
                      className="w-full bg-transparent text-white text-lg font-medium outline-none"
                    />
                  </div>

                  {/* Swap Arrow */}
                  <div className="flex justify-center">
                    <div className="w-10 h-10 bg-gray-700/70 rounded-full flex items-center justify-center border border-gray-600/30 hover:bg-gray-600/70 transition-all duration-200">
                      <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </div>
                  </div>

                  {/* To Token */}
                  <div className="bg-gray-700/50 rounded-xl p-3 border border-gray-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-gray-300 text-xs font-medium">To</label>
                      <div className="text-gray-400 text-xs">
                        Balance: {(() => {
                          if (swapDirection === 'pt-to-yt') {
                            return coreYield.userBalances[selectedAsset]?.yt || '0'
                          } else {
                            return coreYield.userBalances[selectedAsset]?.pt || '0'
                          }
                        })()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs text-white ${
                        swapDirection === 'pt-to-yt' ? 'bg-green-500' : 'bg-blue-500'
                      }`}>
                        {swapDirection === 'pt-to-yt' ? '📈' : '🔒'}
                      </div>
                      <span className="text-white font-medium text-sm">
                        {swapDirection === 'pt-to-yt' ? 'YT' : 'PT'} {selectedAsset}
                      </span>
                    </div>
                    <div className="text-white text-lg font-medium">
                      {swapAmount ? parseFloat(swapAmount).toFixed(4) : '0.0000'}
                    </div>
                  </div>

                  {/* Swap Button */}
                  <button 
                    onClick={() => coreYield.swapPTYT(selectedAsset, swapAmount, swapDirection)}
                    disabled={!swapAmount || parseFloat(swapAmount) <= 0 || coreYield.transactionStatuses.swap === 'pending'}
                    className="w-full py-2 px-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 text-sm shadow-lg shadow-green-600/25 hover:shadow-green-600/40"
                  >
                    {coreYield.transactionStatuses.swap === 'pending' ? 'Processing...' : 'Swap Tokens'}
                  </button>
                  

                </div>
              )}

              {/* Limit Tab Content */}
              {tradingTab === 'limit' && (
                <div className="space-y-2">
                  <div className="bg-purple-600/10 border border-purple-500/20 rounded-lg p-3">
                    <p className="text-purple-300 text-sm text-center">
                      Place limit orders for PT and YT
                    </p>
            </div>
                  <div className="bg-gray-700/50 rounded-xl p-3 border border-gray-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-gray-300 text-xs font-medium">Order Type</label>
              </div>
                    <div className="flex space-x-2">
                      <button className="flex-1 py-2 px-3 bg-green-600 text-white text-sm rounded-lg font-medium">
                        Buy
                      </button>
                      <button className="flex-1 py-2 px-3 bg-gray-600 text-gray-300 text-sm rounded-lg font-medium hover:bg-gray-500">
                        Sell
                      </button>
              </div>
            </div>
                  <div className="bg-gray-700/50 rounded-xl p-3 border border-gray-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-gray-300 text-xs font-medium">Limit Price</label>
                      <div className="text-gray-400 text-xs">USD per token</div>
                    </div>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(e.target.value)}
                      className="w-full bg-transparent text-white text-lg font-medium outline-none"
                    />
                  </div>

                  {/* Amount Input */}
                  <div className="bg-gray-700/50 rounded-xl p-3 border border-gray-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-gray-300 text-xs font-medium">Amount</label>
                      <div className="text-gray-400 text-xs">
                        Balance: {(() => {
                          if (limitOrderType === 'buy') {
                            return coreYield.userBalances[selectedAsset]?.pt || '0'
                          } else {
                            return coreYield.userBalances[selectedAsset]?.yt || '0'
                          }
                        })()}
                      </div>
                    </div>
                    <input
                      type="number"
                      placeholder="0"
                      value={limitAmount}
                      onChange={(e) => setLimitAmount(e.target.value)}
                      className="w-full bg-transparent text-white text-lg font-medium outline-none"
                    />
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gray-700/50 rounded-xl p-3 border border-gray-600/30">
                    <div className="text-gray-300 text-xs font-medium mb-2">Order Summary</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Type:</span>
                        <span className="text-white">{limitOrderType === 'buy' ? 'Buy PT' : 'Sell YT'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Price:</span>
                        <span className="text-white">${limitPrice || '0.00'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Amount:</span>
                        <span className="text-white">{limitAmount || '0'} tokens</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Value:</span>
                        <span className="text-white">
                          ${(() => {
                            const price = parseFloat(limitPrice) || 0
                            const amount = parseFloat(limitAmount) || 0
                            return (price * amount).toFixed(2)
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      await coreYield.placeLimitOrder(selectedAsset, limitOrderType, limitPrice, limitAmount)
                      if (coreYield.transactionStatuses.limitOrder === 'success') {
                        setLimitPrice('')
                        setLimitAmount('')
                      }
                    }}
                    disabled={!limitPrice || !limitAmount || parseFloat(limitPrice) <= 0 || parseFloat(limitAmount) <= 0 || coreYield.transactionStatuses.limitOrder === 'pending'}
                    className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 text-sm shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40"
                  >
                    {coreYield.transactionStatuses.limitOrder === 'pending' ? 'Processing...' : 'Place Limit Order'}
                  </button>
          </div>
        )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Get the market key for the selected asset
  const getMarketKey = (asset: string) => {
    if (asset === 'stCORE') return 'stCORE_0'
    if (asset === 'lstBTC') return 'lstBTC_0'
    if (asset === 'dualCORE') return 'dualCORE_0'
    return 'stCORE_0' // Default fallback
  }

  // State for lock period info
  const [lockPeriodInfo, setLockPeriodInfo] = useState<any>(null)
  
  // Get lock period info when component mounts or user changes
  useEffect(() => {
    const fetchLockPeriodInfo = async () => {
      if (coreYield.address) {
        const info = await coreYield.getLockPeriodInfo()
        setLockPeriodInfo(info)
      }
    }
    
    fetchLockPeriodInfo()
    const interval = setInterval(fetchLockPeriodInfo, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [coreYield.address, coreYield.getLockPeriodInfo])

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Tutorial Modal */}
      {showTutorial && renderTutorial()}
      
      {/* Pendle-style Header */}
      {renderPendleHeader()}

      {/* Main View Router */}
      {currentView === 'markets' && renderMarketsView()}
      {currentView === 'pools' && renderPoolsView()}
      
      {currentView === 'trading' && renderTradingView()}
      
      {/* Dashboard View - PT/YT Interface */}
      {currentView === 'dashboard' && (
        <div className="w-full px-6 py-6">
        {/* Dashboard content always visible */}
        {(
          <>
            {/* User Profile Section */}
            <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            {/* Profile Picture */}
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700">
              <img src="/logo2.png" alt="CoreYield" className="w-8 h-8" />
            </div>

            {/* Wallet Info */}
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-white font-medium text-lg">0xce0...3663</span>
                <button className="text-gray-400 hover:text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2h-2m-6-4l2 2m0 0l2-2m-2 2V8" />
                  </svg>
                </button>
                <button className="text-gray-400 hover:text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center space-x-2 text-gray-400 text-sm">
                <span>Updated &gt;1 day ago</span>
                <button className="text-gray-400 hover:text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
            </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Go to wallet address"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* User Progress Indicator */}
        {!userHasPositions && (
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-4 mb-6">
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Your CoreYield Journey
              <button 
                onClick={() => setShowTutorial(true)}
                className="ml-auto px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
              >
                Restart Tutorial
              </button>
            </h3>
            <div className="grid grid-cols-5 gap-2">
              <div className="text-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 ${
                  userProgress.hasStaked ? 'bg-green-500' : 'bg-gray-600'
                }`}>
                  {userProgress.hasStaked ? (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-white text-sm font-medium">1</span>
                  )}
                </div>
                <p className="text-xs text-gray-400">Stake CORE</p>
              </div>
              <div className="text-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 ${
                  userProgress.hasWrapped ? 'bg-green-500' : 'bg-gray-600'
                }`}>
                  {userProgress.hasWrapped ? (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-white text-sm font-medium">2</span>
                  )}
                </div>
                <p className="text-xs text-gray-400">Wrap to SY</p>
              </div>
              <div className="text-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 ${
                  userProgress.hasSplit ? 'bg-green-500' : 'bg-gray-600'
                }`}>
                  {userProgress.hasSplit ? (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-white text-sm font-medium">3</span>
                  )}
                </div>
                <p className="text-xs text-gray-400">Split SY</p>
              </div>
              <div className="text-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 ${
                  userProgress.hasTraded ? 'bg-green-500' : 'bg-gray-600'
                }`}>
                  {userProgress.hasTraded ? (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-white text-sm font-medium">4</span>
                  )}
                </div>
                <p className="text-xs text-gray-400">Trade</p>
              </div>
              <div className="text-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 ${
                  userProgress.totalPositions > 0 ? 'bg-green-500' : 'bg-gray-600'
                }`}>
                  {userProgress.totalPositions > 0 ? (
                    <span className="text-white text-sm font-medium">{userProgress.totalPositions}</span>
                  ) : (
                    <span className="text-white text-sm font-medium">5</span>
                  )}
                </div>
                <p className="text-xs text-gray-400">Positions</p>
              </div>
            </div>
            <p className="text-gray-400 text-xs mt-2 text-center">
              Complete these steps to unlock the full power of yield tokenization!
            </p>
          </div>
        )}

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Current Balance */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <span className="text-green-400 text-lg">$</span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">My Current Balance</h3>
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">$0</div>
            <p className="text-gray-400 text-xs">Total portfolio value</p>
            {!userHasPositions && ( // Show for new users
              <div className="mt-2 p-1 bg-blue-500/10 border border-blue-500/20 rounded text-center">
                <p className="text-blue-300 text-xs">
                  New to CoreYield? 
                  <button onClick={() => setShowTutorial(true)} className="underline hover:text-blue-200 mx-1">Start Tutorial</button>
                  or 
                  <button onClick={() => setCurrentView('dashboard')} className="underline hover:text-blue-200 mx-1">Start Staking</button>
                  or 
                  <button onClick={() => setCurrentView('markets')} className="underline hover:text-blue-200 mx-1">Go to Markets</button>
                </p>
              </div>
              )}
            </div>

          {/* Claimable Yield */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                          <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-blue-400 text-lg">🤲</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">My Claimable Yield & Rewards</h3>
                </div>
              </div>
            <div className="text-2xl font-bold text-white mb-1">
              {(() => {
                const totalClaimable = Object.values(coreYield.userBalances).reduce((total, balance) => {
                  return total + parseFloat(balance.claimableYield || '0')
                }, 0)
                return totalClaimable > 0 ? `${totalClaimable.toFixed(4)} ${selectedAsset}` : 'Nothing to Claim'
              })()}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-xs">Available to claim</p>
              <button 
                onClick={() => {
                  const totalClaimable = Object.values(coreYield.userBalances).reduce((total, balance) => {
                    return total + parseFloat(balance.claimableYield || '0')
                  }, 0)
                  if (totalClaimable > 0) {
                    coreYield.claimYield(selectedAsset)
                  }
                }}
                disabled={(() => {
                  const totalClaimable = Object.values(coreYield.userBalances).reduce((total, balance) => {
                    return total + parseFloat(balance.claimableYield || '0')
                  }, 0)
                  return totalClaimable <= 0 || coreYield.transactionStatuses.claim === 'pending'
                })()}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs font-medium rounded transition-colors"
              >
                {coreYield.transactionStatuses.claim === 'pending' ? 'Processing...' : 'Claim'}
              </button>
            </div>
          </div>

          {/* Additional Rewards */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <span className="text-purple-400 text-lg">🤲</span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Additional Rewards</h3>
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">Nothing to Claim</div>
            <p className="text-gray-400 text-xs">No additional rewards available</p>
          </div>
        </div>

        {/* Pendle-Style Portfolio Integration */}
        <div className="mb-6 space-y-6">
          {/* Portfolio Overview - Like Pendle */}
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">📊 Portfolio Overview</h3>
              <button 
                onClick={() => setCurrentView('pools')}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                Manage Strategies
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400">Total Value</div>
                <div className="text-2xl font-bold text-white">
                  ${coreYield.portfolioData?.totalValue || '0.00'}
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400">Total APY</div>
                <div className="text-2xl font-bold text-green-400">
                  {coreYield.portfolioData?.totalAPY || '0.00'}%
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400">Risk Score</div>
                <div className="text-2xl font-bold text-orange-400">
                  {coreYield.riskData?.riskScore || '0'}/10
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400">Strategies</div>
                <div className="text-2xl font-bold text-blue-400">
                  {coreYield.portfolioData?.strategyCount || '0'}
                </div>
              </div>
            </div>

            {/* Quick Portfolio Actions - Pendle Style */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => setCurrentView('pools')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                🚀 Create Strategy
              </button>
              <button 
                onClick={() => setCurrentView('pools')}
                className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                🚀 Strategy Management
              </button>
              <button 
                onClick={() => setCurrentView('markets')}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                📊 View Markets
              </button>
            </div>
          </div>

          {/* Active Positions - Pendle Style */}
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">💼 Active Positions</h3>
              <button 
                onClick={() => setCurrentView('markets')}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
              >
                View Markets
              </button>
            </div>
            
            {coreYield.userStrategies && Array.isArray(coreYield.userStrategies) && coreYield.userStrategies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(coreYield.userStrategies as any[]).map((strategy: any, index: number) => (
                  <div key={index} className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">🚀</span>
                        <div>
                          <div className="font-medium text-white">Strategy #{strategy.id}</div>
                          <div className="text-sm text-gray-400">{strategy.strategyType}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium">${strategy.totalValue}</div>
                        <div className="text-sm text-green-400">{strategy.targetAPY}% APY</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Risk:</span>
                        <span className="text-white">{strategy.riskTolerance}/10</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className="text-green-400">Active</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Auto-rebalance:</span>
                        <span className="text-white">
                          {strategy.autoRebalance ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">No active strategies yet</div>
                <div className="text-sm text-gray-500 mb-4">Start building your yield portfolio</div>
                <div className="flex space-x-3 justify-center">
                  <button 
                    onClick={() => setCurrentView('pools')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    🚀 Create Strategy
                  </button>
                  <button 
                    onClick={() => setCurrentView('markets')}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                  >
                    📊 View Markets
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Risk & Bridge Summary - Pendle Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Risk Summary */}
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">⚠️ Risk Overview</h3>
                <button 
                  onClick={() => setCurrentView('pools')}
                  className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-lg transition-colors"
                >
                  Manage Strategy
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Risk Level:</span>
                  <span className={`font-medium ${
                    (coreYield.riskData?.riskScore || 0) <= 3 ? 'text-green-400' : 
                    (coreYield.riskData?.riskScore || 0) <= 7 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {(coreYield.riskData?.riskScore || 0) <= 3 ? 'Low' : 
                     (coreYield.riskData?.riskScore || 0) <= 7 ? 'Medium' : 'High'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Status:</span>
                  <span className={`font-medium ${
                    coreYield.riskData?.isAcceptable ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {coreYield.riskData?.isAcceptable ? 'Acceptable' : 'High Risk'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bridge Summary */}
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">📊 Market Status</h3>
                <button 
                  onClick={() => setCurrentView('markets')}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                >
                  View Markets
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total:</span>
                  <span className="text-white font-medium">
                    {Array.isArray(coreYield.bridgeRequests) ? coreYield.bridgeRequests.length : '0'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Pending:</span>
                  <span className="text-yellow-400 font-medium">
                    {Array.isArray(coreYield.bridgeRequests) ? coreYield.bridgeRequests.filter((b: any) => b.status === 'pending').length : '0'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Supported Chains Grid */}
        <div className="mb-6">
          <h3 className="text-base font-semibold text-white mb-2">EVM-Compatible Chains</h3>
          <p className="text-gray-400 text-xs mb-3">Currently deployed on CoreDAO, with plans to expand to other EVM chains</p>
          <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {[
              { name: 'CoreDAO', icon: '🔥', color: 'border-green-500', status: 'active', balance: '$0' },
              { name: 'Ethereum', icon: '⚡', color: 'border-gray-400', status: 'coming-soon', balance: 'Coming Soon' },
              { name: 'Base', icon: '🔵', color: 'border-blue-500', status: 'coming-soon', balance: 'Coming Soon' },
              { name: 'Arbitrum', icon: '🔷', color: 'border-blue-400', status: 'coming-soon', balance: 'Coming Soon' },
              { name: 'Optimism', icon: '🔴', color: 'border-red-500', status: 'coming-soon', balance: 'Coming Soon' },
              { name: 'Polygon', icon: '🟣', color: 'border-purple-500', status: 'coming-soon', balance: 'Coming Soon' },
              { name: 'BSC', icon: '🟡', color: 'border-yellow-500', status: 'coming-soon', balance: 'Coming Soon' },
              { name: 'Avalanche', icon: '🔴', color: 'border-red-400', status: 'coming-soon', balance: 'Coming Soon' },
              { name: 'Fantom', icon: '🔵', color: 'border-blue-300', status: 'coming-soon', balance: 'Coming Soon' },
              { name: 'Cronos', icon: '🟠', color: 'border-orange-500', status: 'coming-soon', balance: 'Coming Soon' }
            ].map((chain, index) => (
              <div key={index} className={`bg-gray-800/50 border ${chain.color} rounded-lg p-2 text-center cursor-pointer hover:bg-gray-700/50 transition-colors relative ${
                chain.status === 'active' ? 'ring-1 ring-green-500/50' : 'opacity-75'
              }`}>
                {chain.status === 'active' && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
          </div>
        )}
                <div className="text-base mb-1">{chain.icon}</div>
                <div className="text-white font-medium text-xs">{chain.name}</div>
                <div className={`text-xs ${
                  chain.status === 'active' ? 'text-green-400' : 'text-gray-500'
                }`}>
                  {chain.balance}
                </div>
                {chain.status === 'coming-soon' && (
                  <div className="text-xs text-gray-500 mt-1">Q2 2025</div>
                )}
              </div>
            ))}
          </div>
      </div>

        {/* Positions and Orders Section */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex space-x-1">
              <button 
                onClick={() => setPortfolioTab('positions')}
                className={`px-3 py-1 font-medium rounded text-sm transition-colors ${
                  portfolioTab === 'positions' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                My Positions
              </button>
              <button 
                onClick={() => setPortfolioTab('orders')}
                className={`px-3 py-1 font-medium rounded text-sm transition-colors ${
                  portfolioTab === 'orders' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                My Orders
              </button>
            </div>
            <div className="flex space-x-1">
              <button 
                onClick={() => setDisplayMode('usd')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  displayMode === 'usd' 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                USD
              </button>
              <button 
                onClick={() => setDisplayMode('underlying')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  displayMode === 'underlying' 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                Underlying
              </button>
            </div>
          </div>
          
          {/* Sub-tabs */}
          <div className="flex space-x-1 mb-3">
            {[
              { key: 'all', label: 'All Assets' },
              { key: 'pt', label: 'PT' },
              { key: 'yt', label: 'YT' },
              { key: 'lp', label: 'LP' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setAssetFilter(tab.key as 'all' | 'pt' | 'yt' | 'lp')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  assetFilter === tab.key
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Content based on selected tab */}
          {portfolioTab === 'positions' ? (
            assetFilter === 'all' ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">📊</span>
                </div>
                <div className="text-white text-lg font-semibold mb-2">No positions yet</div>
                <p className="text-gray-400 text-sm mb-4">Start by exploring markets and creating PT/YT positions</p>
                <button 
                  onClick={() => setCurrentView('markets')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors text-sm"
                >
                  🚀 Go to Markets
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">
                    {assetFilter === 'pt' ? '🔒' : assetFilter === 'yt' ? '📈' : '💧'}
                  </span>
                </div>
                <div className="text-white text-lg font-semibold mb-2">
                  No {assetFilter.toUpperCase()} positions yet
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  {assetFilter === 'pt' ? 'Principal Tokens represent your locked capital' :
                   assetFilter === 'yt' ? 'Yield Tokens represent your yield rights' :
                   'Liquidity Provider tokens for AMM pools'}
                </p>
                <button 
                  onClick={() => setCurrentView('markets')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors text-sm"
                >
                  🚀 Explore Markets
                </button>
    </div>
  )
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">📋</span>
              </div>
              <div className="text-white text-lg font-semibold mb-2">No orders yet</div>
              <p className="text-gray-400 text-sm mb-4">Your trading orders will appear here</p>
              <button 
                onClick={() => setCurrentView('markets')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors text-sm"
              >
                🚀 Start Trading
              </button>
            </div>
          )}
          
          {/* Debug Info - Show current selections */}
          <div className="mt-4 p-2 bg-gray-900/50 rounded text-center text-xs text-gray-400">
            <span>Tab: {portfolioTab} | Filter: {assetFilter} | Display: {displayMode}</span>
          </div>
        </div>
        </>
        )}


        </div>
      )}

      {/* Notification System */}
      <NotificationSystem 
        notifications={notifications}
        onDismiss={removeNotification}
      />
      
      {/* Transaction History Modal */}
      {showTransactionHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
                <button
                  onClick={() => setShowTransactionHistory(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="overflow-auto max-h-[calc(90vh-120px)]">
              <TransactionHistory />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
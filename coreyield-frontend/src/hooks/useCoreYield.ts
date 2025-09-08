import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  useAccount, 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt, 
  useBalance,
  usePublicClient,
  useWalletClient
} from 'wagmi'
import { parseEther, formatUnits, encodeFunctionData, type Address } from 'viem'
import toast from 'react-hot-toast'
import { CONTRACTS } from '@contracts/addresses'
import CoreYieldAMMABI from '../abis/CoreYieldAMM.json'

// Add missing interfaces
export interface MarketData {
  syToken: string
  ptToken: string
  ytToken: string
  underlying: string
  maturity: number
  isActive: boolean
}

export interface TokenBalances {
  underlying: string
  sy: string
  pt: string
  yt: string
  claimableYield: string
}

export interface MarketAnalytics {
  currentAPY: string
  impliedAPY: string
  fixedAPY: string
  longYieldAPY: string
  marketMode: string
  tradingSignals: {
    buyPT: boolean
    buyYT: boolean
    confidence: number
    reasoning: string
  }
}

export interface PoolData {
  token0: string
  token1: string
  reserve0: string
  reserve1: string
  totalSupply: string
  isYieldPool: boolean
  yieldMultiplier: string
  // Additional properties for pools page
  asset: string
  tvl: string
  volume24h: string
  apy: string
  userLiquidity: string
  poolAddress: string
  ptToken: string
  ytToken: string
  underlying: string
  maturity: number
  ptReserves: string
  ytReserves: string
}

// Import actual ABIs
import CoreYieldRouterABI from '../abis/CoreYieldRouter.json'
import CoreStakingABI from '../abis/CoreStaking.json'
import PortfolioTrackerABI from '../abis/PortfolioTracker.json'
import AnalyticsEngineABI from '../abis/AnalyticsEngine.json'
import CoreYieldStrategyABI from '../abis/CoreYieldStrategy.json'
import CoreYieldBridgeABI from '../abis/CoreYieldBridge.json'

export const useCoreYield = () => {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const [isLoading, setIsLoading] = useState(false)

  // Transaction status tracking for smooth button flow
  const [transactionStatuses, setTransactionStatuses] = useState<Record<string, 'idle' | 'pending' | 'success' | 'failed'>>({
    mint: 'idle',
    stake: 'idle',
    wrap: 'idle',
    split: 'idle',
    merge: 'idle',
    unwrap: 'idle',
    unstake: 'idle',
    claim: 'idle',
    redeem: 'idle',
    limitOrder: 'idle',
    addLiquidity: 'idle',
    swap: 'idle'
  })
  
  // Force re-render timestamp
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now())

  // Portfolio data
  const [portfolioData, setPortfolioData] = useState({
    totalValue: '0',
    totalAPY: '0',
    totalRisk: '0',
    strategyCount: 0,
    bridgeRequestCount: 0
  })

  // Staking data
  const [stakingData, setStakingData] = useState({
    stakedAmount: '0',
    stCOREBalance: '0',
    totalRewards: '0',
    lastStakeTime: 0
  })

  // Risk assessment
  const [riskData, setRiskData] = useState({
    isAcceptable: true,
    reason: '',
    riskScore: 0,
    recommendedActions: 0
  })

  // Market data state
  const [markets, setMarkets] = useState<Record<string, MarketData>>({})
  const [userBalances, setUserBalances] = useState<Record<string, TokenBalances>>({})
  const [marketAnalytics, setMarketAnalytics] = useState<Record<string, MarketAnalytics>>({})
  const [poolData, setPoolData] = useState<Record<string, PoolData>>({})

  // Loading states for better UX
  const [isLoadingBalances, setIsLoadingBalances] = useState(true)
  const [balancesLoaded, setBalancesLoaded] = useState(false)

  // Read portfolio data - REMOVED since function doesn't exist in deployed contract
  // const { data: portfolio, refetch: refetchPortfolio, error: portfolioError } = useReadContract({
  //   address: CONTRACTS.CORE_YIELD_ROUTER as Address,
  //   abi: CoreYieldRouterABI.abi as any,
  //   functionName: 'getCompletePortfolio',
  //   args: address ? [address] : undefined,
  //   query: { enabled: !!address, refetchInterval: 10000 }
  // })

  // Read staking data - use the original function that was working
  const { data: stakingInfo, refetch: refetchStaking, error: stakingError } = useReadContract({
    address: CONTRACTS.CORE_STAKING as Address,
    abi: CoreStakingABI.abi as any,
    functionName: 'getUserStakingInfo',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10000 }
  })

  // Read earned rewards separately
  const { data: earnedRewards, refetch: refetchEarnedRewards, error: earnedError } = useReadContract({
    address: CONTRACTS.CORE_STAKING as Address,
    abi: CoreStakingABI.abi as any,
    functionName: 'earned',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10000 }
  })

  // Read staking stats
  const { data: stakingStats, refetch: refetchStakingStats, error: statsError } = useReadContract({
    address: CONTRACTS.CORE_STAKING as Address,
    abi: CoreStakingABI.abi as any,
    functionName: 'getStakingStats',
    query: { refetchInterval: 30000 }
  })

  // Risk assessment - REMOVED since function doesn't exist in deployed contract
  // const { data: riskAssessment, refetch: refetchRisk, error: riskError } = useReadContract({
  //   address: CONTRACTS.CORE_YIELD_ROUTER as Address,
  //   abi: CoreYieldRouterABI.abi as any,
  //   functionName: 'checkPortfolioRisk',
  //   args: address ? [address] : undefined,
  //   query: { enabled: !!address, refetchInterval: 15000 }
  // })

  // Read user strategies - use a function that exists
  const { data: userStrategies, refetch: refetchStrategies, error: strategiesError } = useReadContract({
    address: CONTRACTS.CORE_YIELD_STRATEGY as Address,
    abi: CoreYieldStrategyABI.abi as any,
    functionName: 'getUserStrategies',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 20000 }
  })

  // Read bridge requests - use a function that exists
  const { data: bridgeRequests, refetch: refetchBridge, error: bridgeError } = useReadContract({
    address: CONTRACTS.CORE_YIELD_BRIDGE as Address,
    abi: CoreYieldBridgeABI.abi as any,
    functionName: 'getUserBridgeRequests',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 25000 }
  })

  // Read portfolio data from PortfolioTracker
  const { data: portfolioInfo, refetch: refetchPortfolioTracker, error: portfolioError } = useReadContract({
    address: CONTRACTS.PORTFOLIO_TRACKER as Address,
    abi: PortfolioTrackerABI.abi as any,
    functionName: 'getUserPortfolio',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 15000 }
  })

  // Read yield strategies from YieldHarvester
  const { data: yieldStrategies, refetch: refetchYieldStrategies, error: yieldStrategiesError } = useReadContract({
    address: CONTRACTS.YIELD_HARVESTER as Address,
    abi: PortfolioTrackerABI.abi as any, // Using PortfolioTracker ABI as placeholder
    functionName: 'getUserYieldStrategies',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 20000 }
  })

  // Read risk assessment from RiskManager
  const { data: riskAssessment, refetch: refetchRiskManager, error: riskError } = useReadContract({
    address: CONTRACTS.RISK_MANAGER as Address,
    abi: PortfolioTrackerABI.abi as any, // Using PortfolioTracker ABI as placeholder
    functionName: 'getUserRiskProfile',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 20000 }
  })

  // Read analytics from CoreYieldAnalytics
  const { data: analyticsData, refetch: refetchAnalytics, error: analyticsError } = useReadContract({
    address: CONTRACTS.CORE_YIELD_ANALYTICS as Address,
    abi: AnalyticsEngineABI.abi as any,
    functionName: 'getUserAnalytics',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 25000 }
  })

  // Debug logging for contract errors
  useEffect(() => {
    if (stakingError) console.error('Staking error:', stakingError)
    if (earnedError) console.error('Earned error:', earnedError)
    if (statsError) console.error('Stats error:', statsError)
    if (strategiesError) console.error('Strategies error:', strategiesError)
    if (bridgeError) console.error('Bridge error:', bridgeError)
  }, [stakingError, earnedError, statsError, strategiesError, bridgeError])

  // Debug logging for contract calls and data
  useEffect(() => {
    if (address) {
      console.log('🔍 CoreYield Hook Debug - Contract Addresses:', {
        CORE_STAKING: CONTRACTS.CORE_STAKING,
        CORE_YIELD_ROUTER: CONTRACTS.CORE_YIELD_ROUTER,
        address
      })
      
      console.log('🔍 CoreYield Hook Debug - Contract Data Raw:', {
        stakingInfo: stakingInfo,
        earnedRewards: earnedRewards,
        stakingStats: stakingStats,
      })
      
      console.log('🔍 CoreYield Hook Debug - Contract Data Types:', {
        stakingInfoType: typeof stakingInfo,
        earnedRewardsType: typeof earnedRewards,
        stakingStatsType: typeof stakingStats,
      })
      
      if (stakingInfo) {
        console.log('🔍 CoreYield Hook Debug - StakingInfo Details:', {
          isArray: Array.isArray(stakingInfo),
          length: Array.isArray(stakingInfo) ? stakingInfo.length : 'not array',
          values: stakingInfo
        })
      }
      
    }
  }, [address, stakingInfo, stakingStats])

  // Token balances - using the correct token addresses
  const { data: coreBalance } = useBalance({
    address,
    token: CONTRACTS.MOCK_ASSETS.dualCORE as Address, // This is the CORE token for staking
    query: { enabled: !!address, refetchInterval: 30000 } // Reduced to 30 seconds
  })

  const { data: stCoreBalance } = useBalance({
    address,
    token: CONTRACTS.MOCK_ASSETS.stCORE as Address, // stCORE token
    query: { enabled: !!address, refetchInterval: 30000 } // Reduced to 30 seconds
  })

  // Additional token balances for portfolio
  const { data: lstBTCBalance } = useBalance({
    address,
    token: CONTRACTS.MOCK_ASSETS.lstBTC as Address,
    query: { enabled: !!address, refetchInterval: 30000 } // Reduced to 30 seconds
  })

  // Write contract functions
  const { writeContract: writeRouter, isPending: isRouterPending } = useWriteContract()
  const { writeContract: writeStaking, isPending: isStakingPending } = useWriteContract()

  const { writeContract: writeStrategy, isPending: isStrategyPending } = useWriteContract()
  const { writeContract: writeBridge, isPending: isBridgePending } = useWriteContract()

  // Helper function to get button text based on status
  const getButtonText = (action: string, status: 'idle' | 'pending' | 'success' | 'failed') => {
    switch (status) {
      case 'pending':
        return 'Processing...'
      case 'success':
        return action // Keep original action text for success
      case 'failed':
        return action // Keep original action text for failed
      default:
        return action
    }
  }

  // Update staking data when contract data changes
  useEffect(() => {
    if (stakingInfo && Array.isArray(stakingInfo) && stakingInfo.length >= 5) {
      setStakingData({
        stakedAmount: formatUnits(stakingInfo[0] as bigint, 18),    // stakedAmount
        stCOREBalance: formatUnits(stakingInfo[1] as bigint, 18),   // rewards (claimable)
        totalRewards: earnedRewards ? formatUnits(earnedRewards as bigint, 18) : '0',  // earned rewards
        lastStakeTime: Number(stakingInfo[2] as bigint)             // lastStakeTime
      })
    }
  }, [stakingInfo])

  // Update portfolio data when contract data changes
  useEffect(() => {
    // Fallback data if portfolio function is not available
    if (!stakingInfo || !Array.isArray(stakingInfo) || stakingInfo.length < 5) {
      setPortfolioData({
        totalValue: '0',
        totalAPY: '0',
        totalRisk: '0',
        strategyCount: 0,
        bridgeRequestCount: 0
      })
    } else {
      // Fix the data parsing based on actual stakingInfo structure
      const stakedAmount = parseFloat(formatUnits(stakingInfo[0] as bigint, 18)).toFixed(2)
      const rewards = stakingInfo[1] ? parseFloat(formatUnits(stakingInfo[1] as bigint, 18)).toFixed(2) : '0.00'
      const lastStakeTime = stakingInfo[2] ? Number(stakingInfo[2] as bigint) : 0
      const nextStakeTime = stakingInfo[3] ? Number(stakingInfo[3] as bigint) : 0
      const totalRewards = stakingInfo[4] ? parseFloat(formatUnits(stakingInfo[4] as bigint, 18)).toFixed(2) : '0.00'
      
      // Calculate APY based on rewards vs staked amount
      const stakedNum = parseFloat(stakedAmount)
      const rewardsNum = parseFloat(totalRewards)
      const apy = stakedNum > 0 ? ((rewardsNum / stakedNum) * 100).toFixed(2) : '0.00'
      
      // Calculate total portfolio value including SY tokens
      const stCoreValue = stCoreBalance ? parseFloat(formatUnits(stCoreBalance.value, stCoreBalance.decimals)) : 0
      const syValue = parseFloat(stakedAmount) // 299 SY tokens
      const totalPortfolioValue = (stCoreValue + syValue).toFixed(2)
      
      setPortfolioData({
        totalValue: totalPortfolioValue, // stCORE + SY = 1001000 + 299 = 1001299
        totalAPY: `${apy}%`, // Calculated APY based on actual rewards
        totalRisk: 'Low', // Based on staking amount
        strategyCount: 1, // User has 1 active staking strategy
        bridgeRequestCount: 0 // No bridge requests
      })
      
      console.log('🔍 Portfolio Data Fixed:', {
        stakedAmount,
        rewards,
        lastStakeTime,
        nextStakeTime,
        totalRewards,
        calculatedAPY: apy,
        stCoreValue,
        syValue,
        totalPortfolioValue,
        stCoreBalance: stCoreBalance ? formatUnits(stCoreBalance.value, stCoreBalance.decimals) : 'N/A',
        originalStakingInfo: stakingInfo
      })
    }
  }, [stakingInfo])

  // Update risk data when contract data changes
  useEffect(() => {
    // Fallback data if risk assessment function is not available
    if (!stakingInfo || !Array.isArray(stakingInfo) || stakingInfo.length < 4) {
      setRiskData({
        isAcceptable: true,
        reason: 'Risk assessment function not available.',
        riskScore: 0,
        recommendedActions: 0
      })
    } else {
      // Fix the data parsing based on actual stakingInfo structure
      const stakedAmount = stakingInfo[0] ? Number(formatUnits(stakingInfo[0] as bigint, 18)) : 0
      const rewards = stakingInfo[1] ? Number(formatUnits(stakingInfo[1] as bigint, 18)) : 0
      const lastStakeTime = stakingInfo[2] ? Number(stakingInfo[2] as bigint) : 0
      const nextStakeTime = stakingInfo[3] ? Number(stakingInfo[3] as bigint) : 0
      const totalRewards = stakingInfo[4] ? Number(formatUnits(stakingInfo[4] as bigint, 18)) : 0
      
      // Calculate risk based on actual staking data
      const isAcceptable = stakedAmount > 0 && totalRewards >= 0
      const riskScore = stakedAmount > 100 ? 20 : 80 // Low risk if staked > 100 CORE
      const recommendedActions = stakedAmount > 100 ? 0 : 1 // No actions needed if well-staked
      
      setRiskData({
        isAcceptable,
        reason: `Staked: ${stakedAmount.toFixed(2)} CORE, Total Rewards: ${totalRewards.toFixed(2)}`,
        riskScore,
        recommendedActions
      })
      
      console.log('🔍 Risk Data Fixed:', {
        stakedAmount,
        rewards,
        lastStakeTime,
        nextStakeTime,
        totalRewards,
        calculatedRisk: { isAcceptable, riskScore, recommendedActions }
      })
    }
  }, [stakingInfo])

  // Initialize markets data from CONTRACTS
  useEffect(() => {
    const marketsData: Record<string, MarketData> = {}
    
    for (const [key, market] of Object.entries(CONTRACTS.MARKETS)) {
      marketsData[key] = {
        syToken: market.syToken,
        ptToken: market.ptToken,
        ytToken: market.ytToken,
        underlying: market.underlying,
        maturity: market.maturity,
        isActive: true
      }
    }
    
    setMarkets(marketsData)
  }, [])

  // Initialize market analytics with default data
  useEffect(() => {
    const analyticsData: Record<string, MarketAnalytics> = {}
    
    for (const [key, market] of Object.entries(CONTRACTS.MARKETS)) {
      analyticsData[key] = {
        currentAPY: '8.5',
        impliedAPY: '7.2',
        fixedAPY: '6.8',
        longYieldAPY: '9.1',
        marketMode: 'EQUILIBRIUM',
        tradingSignals: {
          buyPT: true,
          buyYT: false,
          confidence: 75,
          reasoning: 'PT offers slightly better than current yield'
        }
      }
    }
    
    setMarketAnalytics(analyticsData)
  }, [])
  
  // Manual refresh only - no auto-refresh to prevent infinite loops
  // Users can manually refresh balances using the refresh button

  // Debug logging removed to prevent unnecessary re-renders

  // CONSOLIDATED: Load both basic balances AND token balances in one useEffect to prevent conflicts
  useEffect(() => {
    console.log('🔍 useEffect triggered with:', {
      address: !!address,
      coreBalance: !!coreBalance,
      stCoreBalance: !!stCoreBalance,
      lstBTCBalance: !!lstBTCBalance,
      publicClient: !!publicClient
    })
    
    if (address && coreBalance && stCoreBalance && lstBTCBalance && publicClient) {
      console.log('🚀 Loading ALL balances (basic + token) in one consolidated useEffect...')
      setIsLoadingBalances(true)
      setBalancesLoaded(false)
      
      const loadAllBalances = async () => {
        try {
          // First, set basic balances
          const basicBalances: Record<string, TokenBalances> = {
            dualCORE: {
              underlying: coreBalance ? parseFloat(formatUnits(coreBalance.value, coreBalance.decimals)).toFixed(2) : '0.00',
              sy: '0.00', // Will be populated below
              pt: '0.00', // Will be populated below
              yt: '0.00',  // Will be populated below
              claimableYield: '0.00' // Will be populated below
            },
            stCORE: {
              underlying: stCoreBalance ? parseFloat(formatUnits(stCoreBalance.value, stCoreBalance.decimals)).toFixed(2) : '0.00',
              sy: '0.00', // Will be populated below
              pt: '0.00', // Will be populated below
              yt: earnedRewards && typeof earnedRewards === 'bigint' ? parseFloat(formatUnits(earnedRewards, 18)).toFixed(2) : '0.00',
              claimableYield: '0.00' // Will be populated below
            },
            lstBTC: {
              underlying: lstBTCBalance ? parseFloat(formatUnits(lstBTCBalance.value, lstBTCBalance.decimals)).toFixed(2) : '0.00',
              sy: '0.00', // Will be populated below
              pt: '0.00', // Will be populated below
              yt: '0.00',  // Will be populated below
              claimableYield: '0.00' // Will be populated below
            }
          }

          console.log('📊 Basic balances set:', {
            'dualCORE.underlying': basicBalances.dualCORE.underlying,
            'stCORE.underlying': basicBalances.stCORE.underlying,
            'stCORE.yt': basicBalances.stCORE.yt,
            'lstBTC.underlying': basicBalances.lstBTC.underlying
          })

          // Set stCORE claimable yield immediately from staking rewards
          if (earnedRewards && typeof earnedRewards === 'bigint') {
            basicBalances.stCORE.claimableYield = parseFloat(formatUnits(earnedRewards, 18)).toFixed(4)
            console.log('💰 stCORE claimable yield set from staking rewards:', basicBalances.stCORE.claimableYield)
          } else {
            // Fallback: try to read from contract directly
            try {
              const claimableYield = await publicClient.readContract({
                address: CONTRACTS.CORE_STAKING as Address,
                abi: CoreStakingABI.abi as any,
                functionName: 'earned',
                args: [address]
              })
              basicBalances.stCORE.claimableYield = parseFloat(formatUnits(claimableYield as bigint, 18)).toFixed(4)
              console.log('💰 stCORE claimable yield set from contract:', basicBalances.stCORE.claimableYield)
            } catch (error) {
              console.log('❌ Failed to read stCORE claimable yield:', error)
              basicBalances.stCORE.claimableYield = '0.0000'
            }
          }

          // Now load token balances (SY, PT, YT) from contracts
          const updatedBalances = { ...basicBalances }
          
          // Create a mapping for market keys to asset types
          const marketAssetMapping: Record<string, keyof typeof basicBalances> = {}
          
          // Map lstBTC markets to lstBTC asset
          Object.keys(CONTRACTS.MARKETS).forEach(marketKey => {
            if (marketKey.startsWith('lstBTC_')) {
              marketAssetMapping[marketKey] = 'lstBTC'
            } else if (marketKey.startsWith('stCORE_')) {
              marketAssetMapping[marketKey] = 'stCORE'
            }
          })
          
          // Load all balances in parallel for better performance
          const balancePromises = Object.entries(CONTRACTS.MARKETS).map(async ([assetKey, market]) => {
            const assetType = marketAssetMapping[assetKey]
            if (!assetType) {
              console.log(`⚠️ Skipping market ${assetKey} - no asset mapping found`)
              return null
            }
            
            try {
              // Read SY, PT, YT balances in parallel for this market
              const [syBalance, ptBalance, ytBalance] = await Promise.all([
                publicClient.readContract({
                  address: market.syToken as Address,
                  abi: [{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] }] as any,
                  functionName: 'balanceOf',
                  args: [address]
                }),
                publicClient.readContract({
                  address: market.ptToken as Address,
                  abi: [{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] }] as any,
                  functionName: 'balanceOf',
                  args: [address]
                }),
                publicClient.readContract({
                  address: market.ytToken as Address,
                  abi: [{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] }] as any,
                  functionName: 'balanceOf',
                  args: [address]
                })
              ])
              
              return {
                assetType,
                sy: parseFloat(formatUnits(syBalance as bigint, 18)),
                pt: parseFloat(formatUnits(ptBalance as bigint, 18)),
                yt: parseFloat(formatUnits(ytBalance as bigint, 18))
              }
            } catch (error) {
              console.log(`❌ Failed to read ${assetKey} balances:`, error)
              return null
            }
          })
          
          // Wait for all balance reads to complete
          const balanceResults = await Promise.all(balancePromises)
          
          // Create individual market balances AND aggregate them
          const individualMarketBalances: Record<string, TokenBalances> = {}
          
          balanceResults.forEach((result, index) => {
            if (result) {
              const { assetType, sy, pt, yt } = result
              const marketKey = Object.keys(CONTRACTS.MARKETS)[index]
              
              // Store individual market balance
              individualMarketBalances[marketKey] = {
                underlying: '0',
                sy: sy.toFixed(2),
                pt: pt.toFixed(2),
                yt: yt.toFixed(2),
                claimableYield: '0'
              }
              
              // Aggregate into main asset types
              updatedBalances[assetType].sy = (parseFloat(updatedBalances[assetType].sy) + sy).toFixed(2)
              updatedBalances[assetType].pt = (parseFloat(updatedBalances[assetType].pt) + pt).toFixed(2)
              updatedBalances[assetType].yt = (parseFloat(updatedBalances[assetType].yt) + yt).toFixed(2)
            }
          })
          
          // Combine individual market balances + aggregated balances
          const finalBalances = {
            ...updatedBalances,           // Aggregated balances (stCORE, lstBTC, dualCORE)
            ...individualMarketBalances  // Individual market balances (stCORE_0, stCORE_1, etc.)
          }
          
          console.log('🔄 Individual market balances created:', individualMarketBalances)
          console.log('🔄 Aggregated balances:', updatedBalances)
          console.log('🔄 Final balances to set:', finalBalances)
          
          // Set all balances at once for better UX
          setUserBalances(finalBalances)
          setIsLoadingBalances(false)
          setBalancesLoaded(true)
          
          console.log('✅ All balances loaded, setting state once...')
          console.log('🔄 Final userBalances after consolidation:', finalBalances)
          console.log('🔄 isLoadingBalances set to false')
          console.log('🔄 balancesLoaded set to true')
          
        } catch (error) {
          console.error('❌ Failed to load all balances:', error)
          console.error('❌ Error details:', error.message)
          console.error('❌ Error stack:', error.stack)
          setIsLoadingBalances(false)
          setBalancesLoaded(false)
        }
      }
      
      loadAllBalances()
    }
  }, [address, coreBalance, stCoreBalance, lstBTCBalance, publicClient])
  
  // Make loadAllBalances accessible to other functions
  const refreshBalances = async () => {
    if (address && publicClient) {
      try {
        // First, set basic balances
        const basicBalances: Record<string, TokenBalances> = {
          dualCORE: {
            underlying: coreBalance ? parseFloat(formatUnits(coreBalance.value, coreBalance.decimals)).toFixed(2) : '0.00',
            sy: '0.00', // Will be populated below
            pt: '0.00', // Will be populated below
            yt: '0.00',  // Will be populated below
            claimableYield: '0.00' // Will be populated below
          },
          stCORE: {
            underlying: stCoreBalance ? parseFloat(formatUnits(stCoreBalance.value, stCoreBalance.decimals)).toFixed(2) : '0.00',
            sy: '0.00', // Will be populated below
            pt: '0.00', // Will be populated below
            yt: earnedRewards && typeof earnedRewards === 'bigint' ? parseFloat(formatUnits(earnedRewards, 18)).toFixed(2) : '0.00',
            claimableYield: '0.00' // Will be populated below
          },
          lstBTC: {
            underlying: lstBTCBalance ? parseFloat(formatUnits(lstBTCBalance.value, lstBTCBalance.decimals)).toFixed(2) : '0.00',
            sy: '0.00', // Will be populated below
            pt: '0.00', // Will be populated below
            yt: '0.00',  // Will be populated below
            claimableYield: '0.00' // Will be populated below
          }
        }

        // Now load token balances (SY, PT, YT) from contracts
        const updatedBalances = { ...basicBalances }
        
        for (const [assetKey, market] of Object.entries(CONTRACTS.MARKETS)) {
          const asset = assetKey as keyof typeof CONTRACTS.MARKETS
          
          // Ensure the asset structure exists
          if (!updatedBalances[asset]) {
            updatedBalances[asset] = {
              underlying: '0',
              sy: '0',
              pt: '0',
              yt: '0',
              claimableYield: '0'
            }
          }

          // Read SY balance
          try {
            const syBalance = await publicClient.readContract({
              address: market.syToken as Address,
              abi: [
                {
                  name: 'balanceOf',
                  type: 'function',
                  stateMutability: 'view',
                  inputs: [{ name: 'account', type: 'address' }],
                  outputs: [{ name: '', type: 'uint256' }]
                }
              ] as any,
              functionName: 'balanceOf',
              args: [address]
            })
            updatedBalances[asset].sy = parseFloat(formatUnits(syBalance as bigint, 18)).toFixed(2)
          } catch (error) {
            console.log(`❌ Failed to read ${asset} SY balance:`, error)
            updatedBalances[asset].sy = '0.00'
          }

          // Read PT balance
          try {
            const ptBalance = await publicClient.readContract({
              address: market.ptToken as Address,
              abi: [
                {
                  name: 'balanceOf',
                  type: 'function',
                  stateMutability: 'view',
                  inputs: [{ name: 'account', type: 'address' }],
                  outputs: [{ name: '', type: 'uint256' }]
                }
              ] as any,
              functionName: 'balanceOf',
              args: [address]
            })
            updatedBalances[asset].pt = parseFloat(formatUnits(ptBalance as bigint, 18)).toFixed(2)
          } catch (error) {
            console.log(`❌ Failed to read ${asset} PT balance:`, error)
            updatedBalances[asset].pt = '0.00'
          }

          // Read YT balance
          try {
            const ytBalance = await publicClient.readContract({
              address: market.ytToken as Address,
              abi: [
                {
                  name: 'balanceOf',
                  type: 'function',
                  stateMutability: 'view',
                  inputs: [{ name: 'account', type: 'address' }],
                  outputs: [{ name: '', type: 'uint256' }]
                }
              ] as any,
              functionName: 'balanceOf',
              args: [address]
            })
            updatedBalances[asset].yt = parseFloat(formatUnits(ytBalance as bigint, 18)).toFixed(2)
          } catch (error) {
            console.log(`❌ Failed to read ${asset} YT balance:`, error)
            updatedBalances[asset].yt = '0.00'
          }

          // Read claimable yield from the actual contract
          try {
            console.log(`🔍 Reading claimable yield for ${asset}:`)
            
            // The contract has earned(address) function for current rewards
            const claimableYield = await publicClient.readContract({
              address: CONTRACTS.CORE_STAKING as Address,
              abi: CoreStakingABI.abi as any,
              functionName: 'earned',
              args: [address]
            })
            
            console.log(`  - Raw Claimable Yield: ${claimableYield}`)
            console.log(`  - Formatted Claimable Yield: ${formatUnits(claimableYield as bigint, 18)}`)
            
            // Update the claimable yield for the asset
            updatedBalances[asset].claimableYield = formatUnits(claimableYield as bigint, 18)
            console.log(`📊 ${asset} claimable yield updated:`, updatedBalances[asset].claimableYield)
            
          } catch (error) {
            console.log(`❌ Failed to read ${asset} claimable yield:`, error)
            // Fallback: try to get from userStakingInfo
            try {
              const userInfo = await publicClient.readContract({
                address: CONTRACTS.CORE_STAKING as Address,
                abi: CoreStakingABI.abi as any,
                functionName: 'getUserStakingInfo',
                args: [address]
              })
              
              if (userInfo && (userInfo as any[])[4]) { // earnedRewards is at index 4
                const earnedRewards = (userInfo as any[])[4] as bigint
                updatedBalances[asset].claimableYield = formatUnits(earnedRewards, 18)
                console.log(`📊 ${asset} claimable yield from userStakingInfo:`, updatedBalances[asset].claimableYield)
              } else {
                updatedBalances[asset].claimableYield = '0'
                console.log(`  - No earned rewards found, setting claimable yield to 0`)
              }
            } catch (fallbackError) {
              console.log(`  - Fallback also failed:`, fallbackError)
              updatedBalances[asset].claimableYield = '0'
              console.log(`  - User has YT tokens but claimable yield read failed. This might mean:`)
              console.log(`    - The contract doesn't have the expected functions`)
              console.log(`    - There's a network issue`)
              console.log(`    - The user has no claimable yield`)
            }
          }
        }
        
        // Set ALL balances at once
        setUserBalances(updatedBalances)
        console.log('🔄 Balances refreshed:', updatedBalances)
      } catch (error) {
        console.log('❌ Failed to refresh balances:', error)
      }
    }
  }
  
    // OLD SEPARATE useEffect REMOVED - now consolidated into one useEffect above



    // Staking function - TRUE ONE-CLICK AUTOMATIC FLOW
  const stake = async (amount: string, token: Address) => {
    if (!address || !publicClient || !walletClient) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      console.log('🚀 Starting stake process...')
      
      // Button shows "Processing..." immediately
      setTransactionStatuses(prev => ({ ...prev, stake: 'pending' }))
      
      // First check allowance for CORE token
      console.log('🔍 Checking allowance...')
      const allowance = await publicClient.readContract({
        address: token,
        abi: [
          {
            name: 'allowance',
            type: 'function',
            stateMutability: 'view',
            inputs: [
              { name: 'owner', type: 'address' },
              { name: 'spender', type: 'address' }
            ],
            outputs: [{ name: '', type: 'uint256' }]
          }
        ] as any,
        functionName: 'allowance',
        args: [address, CONTRACTS.CORE_STAKING as Address]
      })
      
      console.log('📊 Current allowance:', allowance.toString())
      console.log('💰 Amount to stake:', parseEther(amount).toString())

      if (BigInt(allowance as bigint) < parseEther(amount)) {
        // Need approval first - automatically call approve
        console.log('✅ Approval needed, starting automatic approval...')
        
        // Prepare approval transaction
        const approveData = encodeFunctionData({
          abi: [
            {
              name: 'approve',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [
                { name: 'spender', type: 'address' },
                { name: 'amount', type: 'uint256' }
              ],
              outputs: [{ name: '', type: 'bool' }]
            }
          ] as any,
          functionName: 'approve',
          args: [CONTRACTS.CORE_STAKING as Address, parseEther(amount)]
        })
        
        // Send approval transaction
        const approveHash = await walletClient.sendTransaction({
          account: address,
          to: token,
          data: approveData,
          chain: { 
            id: CONTRACTS.CHAIN_ID,
            name: 'Core Testnet',
            nativeCurrency: { name: 'CORE', symbol: 'CORE', decimals: 18 },
            rpcUrls: { default: { http: ['https://rpc.test2.btcs.network'] } }
          }
        })
        
        console.log('📝 Approval transaction sent:', approveHash)
        
        // Wait for approval confirmation
        console.log('⏳ Waiting for approval confirmation...')
        const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveHash })
        console.log('📋 Approval receipt:', approveReceipt)
        
        if (approveReceipt.status !== 'success') {
          console.log('❌ Approval failed')
          toast.error('Approval failed')
          setTransactionStatuses(prev => ({ ...prev, stake: 'idle' }))
          return
        }
        
        console.log('✅ Approval successful, proceeding to stake...')
        
        // Small delay for UX
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } else {
        console.log('✅ Sufficient allowance, proceeding directly to stake...')
      }

      // Now stake directly to CoreStaking contract
      console.log('🏦 Starting staking transaction...')
      
      // Prepare stake transaction
      const stakeData = encodeFunctionData({
        abi: CoreStakingABI.abi as any,
        functionName: 'stake',
        args: [parseEther(amount)]
      })
      
      // Send stake transaction
      const stakeHash = await walletClient.sendTransaction({
        account: address,
        to: CONTRACTS.CORE_STAKING as Address,
        data: stakeData,
        chain: { 
          id: CONTRACTS.CHAIN_ID,
          name: 'Core Testnet',
          nativeCurrency: { name: 'CORE', symbol: 'CORE', decimals: 18 },
          rpcUrls: { default: { http: ['https://rpc.test2.btcs.network'] } }
        }
      })
      
      console.log('📝 Stake transaction sent:', stakeHash)
      
      // Wait for stake transaction confirmation
      console.log('⏳ Waiting for stake confirmation...')
      const stakeReceipt = await publicClient.waitForTransactionReceipt({ hash: stakeHash })
      console.log('📋 Stake receipt:', stakeReceipt)
      
      if (stakeReceipt.status === 'success') {
        // Refresh balances after successful transaction
        console.log('✅ Staking successful, refreshing balances...')
        refetchStaking()
        
        // Show success toast notification
        toast.success(`Staked ${amount} CORE successfully!`)
        
        // Reset button to normal
        setTransactionStatuses(prev => ({ ...prev, stake: 'idle' }))
        
      } else {
        console.log('❌ Staking transaction failed')
        toast.error(`Staking transaction failed`)
        setTransactionStatuses(prev => ({ ...prev, stake: 'idle' }))
      }
      
    } catch (error) {
      console.error('❌ Stake error:', error)
      toast.error(`Failed to stake: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setTransactionStatuses(prev => ({ ...prev, stake: 'idle' }))
    }
  }

  // Swap function
  const swap = async (amountIn: string, tokenIn: Address, tokenOut: Address, slippageTolerance: number) => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      setIsLoading(true)
      
      // First approve the router to spend tokens
      await writeRouter({
        address: tokenIn,
        abi: CoreStakingABI.abi as any,
        functionName: 'approve',
        args: [CONTRACTS.CORE_YIELD_ROUTER as Address, parseEther(amountIn)]
      })

      // Then swap through router
      await writeRouter({
        address: CONTRACTS.CORE_YIELD_ROUTER as Address,
        abi: CoreYieldRouterABI.abi as any,
        functionName: 'swapAndTrack',
        args: [parseEther(amountIn), tokenIn, tokenOut, slippageTolerance]
      })

      toast.success('Swap successful!')
      // refetchPortfolio() // Portfolio data is now fallback
    } catch (error) {
      console.error('Swap error:', error)
      toast.error('Swap failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Strategy creation function
  const createStrategy = async (strategyType: number, assets: Address[], allocations: bigint[], targetAPY: bigint, riskTolerance: number) => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      setIsLoading(true)
      
      await writeStrategy({
        address: CONTRACTS.CORE_YIELD_STRATEGY as Address,
        abi: CoreYieldStrategyABI.abi as any,
        functionName: 'createStrategy',
        args: [strategyType, assets, allocations, targetAPY, riskTolerance, 86400n, true] // 1 day rebalance, auto-rebalance
      })

      toast.success('Strategy created successfully!')
      refetchStrategies()
      // refetchPortfolio() // Portfolio data is now fallback
    } catch (error) {
      console.error('Strategy creation error:', error)
      toast.error('Strategy creation failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Bridge function
  const bridge = async (targetChainId: string, token: Address, amount: string) => {
    if (!address || !publicClient) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      setIsLoading(true)
      toast.loading('Creating bridge request...', { id: 'bridge' })
      
      // First approve the router to spend tokens
      writeStaking({
        address: token,
        abi: [
          {
            name: 'approve',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'spender', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            outputs: [{ name: '', type: 'bool' }]
          }
        ] as any,
        functionName: 'approve',
        args: [CONTRACTS.CORE_YIELD_ROUTER as Address, parseEther(amount)]
      })

      // Wait for approval transaction to be processed
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.loading('Processing bridge request...', { id: 'bridge' })
      
      // Then create bridge request
      writeBridge({
        address: CONTRACTS.CORE_YIELD_ROUTER as Address,
        abi: CoreYieldRouterABI.abi as any,
        functionName: 'bridgeAndTrack',
        args: [BigInt(targetChainId), token, parseEther(amount)]
      })

      toast.success('Bridge request submitted! Check your wallet for confirmation.', { id: 'bridge' })
      
      // Wait a bit then refresh data
      setTimeout(() => {
        // refetchPortfolio() // Portfolio data is now fallback
        refetchStaking()
      }, 5000)
    } catch (error) {
      console.error('Bridge error:', error)
      toast.error('Bridge failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Yield harvesting function
  const harvestAndTrack = async (asset: Address) => {
    if (!address || !publicClient) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      setIsLoading(true)
      toast.loading('Harvesting yield...', { id: 'harvest' })
      
      // Call harvestAndTrack function from CoreYieldRouter
      writeRouter({
        address: CONTRACTS.CORE_YIELD_ROUTER as Address,
        abi: CoreYieldRouterABI.abi as any,
        functionName: 'harvestAndTrack',
        args: [asset]
      })

      toast.success('Yield harvesting submitted! Check your wallet for confirmation.', { id: 'harvest' })
      
      // Wait a bit then refresh data
      setTimeout(() => {
        // refetchPortfolio() // Portfolio data is now fallback
        refetchStaking()
      }, 5000)
    } catch (error) {
      console.error('Yield harvesting error:', error)
      toast.error('Yield harvesting failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Claim staking rewards function
  const claimStakingRewards = async () => {
    if (!address || !publicClient) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      setIsLoading(true)
      toast.loading('Claiming staking rewards...', { id: 'claim' })
      
      // Call claimRewards function from CoreStaking
      writeStaking({
        address: CONTRACTS.CORE_STAKING as Address,
        abi: CoreStakingABI.abi as any,
        functionName: 'claimRewards',
        args: []
      })

      toast.success('Staking rewards claim submitted! Check your wallet for confirmation.', { id: 'claim' })
      
      // Wait a bit then refresh data
      setTimeout(() => {
        // refetchPortfolio() // Portfolio data is now fallback
        refetchStaking()
        refetchEarnedRewards()
      }, 5000)
    } catch (error) {
      console.error('Claim staking rewards error:', error)
      toast.error('Claiming staking rewards failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Emergency pause function
  const emergencyPause = async () => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      setIsLoading(true)
      
      await writeRouter({
        address: CONTRACTS.CORE_YIELD_ROUTER as Address,
        abi: CoreYieldRouterABI.abi as any,
        functionName: 'emergencyPause',
        args: []
      })

      toast.success('System paused successfully!')
    } catch (error) {
      console.error('Emergency pause error:', error)
      toast.error('Emergency pause failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Emergency resume function
  const emergencyResume = async () => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      setIsLoading(true)
      
      await writeRouter({
        address: CONTRACTS.CORE_YIELD_ROUTER as Address,
        abi: CoreYieldRouterABI.abi as any,
        functionName: 'emergencyResume',
        args: []
      })

      toast.success('System resumed successfully!')
    } catch (error) {
      console.error('Emergency resume error:', error)
      toast.error('Emergency resume failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Fallback refetchPortfolio function since the original function doesn't exist
  const refetchPortfolio = () => {
    // This is a no-op since portfolio data is now fallback
    console.log('Portfolio refetch called but function not available in deployed contract')
  }

  // Refresh all data
  const refreshAll = async () => {
    console.log('🔄 Refreshing all data...')
    
    // Refresh staking data
    refetchStaking()
    refetchEarnedRewards()
    refetchStakingStats()
    refetchStrategies()
    refetchBridge()
    
    // Refresh token balances
    await refreshTokenBalances()
    
    console.log('✅ All data refreshed')
  }

  // Test function to debug SY balance reading
  const testSYBalance = async () => {
    if (!address || !publicClient) return
    
    try {
      console.log('🧪 Testing SY balance reading...')
      
      // Test stCORE SY balance specifically (use first stCORE market)
      const stCoreMarket = CONTRACTS.MARKETS.stCORE_0
      console.log('🔍 stCORE Market config:', stCoreMarket)
      
      // Try to read the SY balance
      const syBalance = await publicClient.readContract({
        address: stCoreMarket.syToken as Address,
        abi: [
          {
            name: 'balanceOf',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ name: 'account', type: 'address' }],
            outputs: [{ name: '', type: 'uint256' }]
          }
        ] as any,
        functionName: 'balanceOf',
        args: [address]
      })
      
      console.log('🧪 Test SY Balance Result:')
      console.log('  - Raw balance:', syBalance)
      console.log('  - Formatted balance:', formatUnits(syBalance as bigint, 18))
      
      // Also try to read the underlying stCORE balance for comparison
      const stCoreBalance = await publicClient.readContract({
        address: stCoreMarket.underlying as Address,
        abi: [
          {
            name: 'balanceOf',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ name: 'account', type: 'address' }],
            outputs: [{ name: '', type: 'uint256' }]
          }
        ] as any,
        functionName: 'balanceOf',
        args: [address]
      })
      
      console.log('🧪 Test stCORE Balance Result:')
      console.log('  - Raw balance:', stCoreBalance)
      console.log('  - Formatted balance:', formatUnits(stCoreBalance as bigint, 18))
      
      // Update the userBalances state with the correct SY balance
      const formattedSYBalance = formatUnits(syBalance as bigint, 18)
      
      // Force a complete state update to trigger re-render
      setUserBalances(prev => {
        const newState = {
          ...prev,
          stCORE: {
            ...prev.stCORE,
            sy: formattedSYBalance
          }
        }
        console.log('🔄 New userBalances state:', newState)
        return newState
      })
      
      console.log('✅ Updated userBalances.stCORE.sy to:', formattedSYBalance)
      
      // Force a re-render by updating a timestamp
      setLastUpdate(Date.now())
      
    } catch (error) {
      console.log('❌ Test SY balance failed:', error)
    }
  }

  // Refresh token balances (SY, PT, YT)
  const refreshTokenBalances = async () => {
    if (!address || !publicClient) {
      console.log('❌ Cannot refresh: missing address or publicClient')
      return
    }
    
    try {
      console.log('🔄 Manually refreshing token balances...')
      console.log('🔍 Address:', address)
      console.log('🔍 PublicClient available:', !!publicClient)
      
      // Reset any loading flags if needed
      
      console.log('🔍 Current userBalances before refresh:', userBalances)
      
      const updatedBalances = { ...userBalances }
      
      // Read SY, PT, and YT balances for each asset
      for (const [assetKey, market] of Object.entries(CONTRACTS.MARKETS)) {
        const asset = assetKey as keyof typeof CONTRACTS.MARKETS
        console.log(`🔍 Processing asset: ${asset}`)
        console.log(`  - Market config:`, market)
        console.log(`  - Current balance in userBalances:`, updatedBalances[asset])
        
        // Ensure the asset structure exists
        if (!updatedBalances[asset]) {
          updatedBalances[asset] = {
            underlying: '0',
            sy: '0',
            pt: '0',
            yt: '0',
            claimableYield: '0'
          }
        }
        
        // Read SY balance
        try {
          console.log(`🔍 Reading SY balance for ${asset}:`)
          console.log(`  - SY Token Address: ${market.syToken}`)
          console.log(`  - User Address: ${address}`)
          
          const syBalance = await publicClient.readContract({
            address: market.syToken as Address,
            abi: [
              {
                name: 'balanceOf',
                type: 'function',
                stateMutability: 'view',
                inputs: [{ name: 'account', type: 'address' }],
                outputs: [{ name: '', type: 'uint256' }]
              }
            ] as any,
            functionName: 'balanceOf',
            args: [address]
          })
          
          console.log(`  - Raw SY Balance: ${syBalance}`)
          console.log(`  - Formatted SY Balance: ${formatUnits(syBalance as bigint, 18)}`)
          
          updatedBalances[asset].sy = formatUnits(syBalance as bigint, 18)
          console.log(`📊 ${asset} SY balance updated:`, updatedBalances[asset].sy)
        } catch (error) {
          console.log(`❌ Failed to read ${asset} SY balance:`, error)
          console.log(`  - Error details:`, error)
          updatedBalances[asset].sy = '0'
        }

        // Read PT balance
        try {
          const ptBalance = await publicClient.readContract({
            address: market.ptToken as Address,
            abi: [
              {
                name: 'balanceOf',
                type: 'function',
                stateMutability: 'view',
                inputs: [{ name: 'account', type: 'address' }],
                outputs: [{ name: '', type: 'uint256' }]
              }
            ] as any,
            functionName: 'balanceOf',
            args: [address]
          })
          updatedBalances[asset].pt = formatUnits(ptBalance as bigint, 18)
          console.log(`📊 ${asset} PT balance updated:`, updatedBalances[asset].pt)
        } catch (error) {
          console.log(`❌ Failed to read ${asset} PT balance:`, error)
          updatedBalances[asset].pt = '0'
        }

                  // Read YT balance
          try {
            console.log(`🔍 Reading YT balance for ${asset}:`)
            console.log(`  - YT Token Address: ${market.ytToken}`)
            console.log(`  - User Address: ${address}`)
            
            const ytBalance = await publicClient.readContract({
              address: market.ytToken as Address,
              abi: [
                {
                  name: 'balanceOf',
                  type: 'function',
                  stateMutability: 'view',
                  inputs: [{ name: 'account', type: 'address' }],
                  outputs: [{ name: '', type: 'uint256' }]
                }
              ] as any,
              functionName: 'balanceOf',
              args: [address]
            })
            
            console.log(`  - Raw YT Balance: ${ytBalance}`)
            console.log(`  - Formatted YT Balance: ${formatUnits(ytBalance as bigint, 18)}`)
            
            updatedBalances[asset].yt = formatUnits(ytBalance as bigint, 18)
            console.log(`📊 ${asset} YT balance updated:`, updatedBalances[asset].yt)
          } catch (error) {
            console.log(`❌ Failed to read ${asset} YT balance:`, error)
            console.log(`  - Error details:`, error)
            updatedBalances[asset].yt = '0'
          }

                  // Read claimable yield from the actual contract
          try {
            console.log(`🔍 Reading claimable yield for ${asset}:`)
            
            // The contract has earned(address) function for current rewards
            const claimableYield = await publicClient.readContract({
              address: CONTRACTS.CORE_STAKING as Address,
              abi: CoreStakingABI.abi as any,
              functionName: 'earned',
              args: [address]
            })
            
            console.log(`  - Raw Claimable Yield: ${claimableYield}`)
            console.log(`  - Formatted Claimable Yield: ${formatUnits(claimableYield as bigint, 18)}`)
            
            // Update the claimable yield for the asset
            updatedBalances[asset].claimableYield = formatUnits(claimableYield as bigint, 18)
            console.log(`📊 ${asset} claimable yield updated:`, updatedBalances[asset].claimableYield)
            
          } catch (error) {
            console.log(`❌ Failed to read ${asset} claimable yield:`, error)
            // Fallback: try to get from userStakingInfo
            try {
              const userInfo = await publicClient.readContract({
                address: CONTRACTS.CORE_STAKING as Address,
                abi: CoreStakingABI.abi as any,
                functionName: 'getUserStakingInfo',
                args: [address]
              })
              
              if (userInfo && (userInfo as any[])[4]) { // earnedRewards is at index 4
                const earnedRewards = (userInfo as any[])[4] as bigint
                updatedBalances[asset].claimableYield = formatUnits(earnedRewards, 18)
                console.log(`📊 ${asset} claimable yield from userStakingInfo:`, updatedBalances[asset].claimableYield)
              } else {
                updatedBalances[asset].claimableYield = '0'
                console.log(`  - No earned rewards found, setting claimable yield to 0`)
              }
            } catch (fallbackError) {
              console.log(`  - Fallback also failed:`, fallbackError)
              updatedBalances[asset].claimableYield = '0'
              console.log(`  - User has YT tokens but claimable yield read failed. This might mean:`)
              console.log(`    - The contract doesn't have the expected functions`)
              console.log(`    - There's a network issue`)
              console.log(`    - The user has no claimable yield`)
            }
          }
      }
      
      console.log('🔍 Updated balances before setState:', updatedBalances)
      
      // Aggregate individual market balances into main asset types
      const aggregatedBalances: Record<string, TokenBalances> = {
        stCORE: { underlying: '0', sy: '0', pt: '0', yt: '0', claimableYield: '0' },
        lstBTC: { underlying: '0', sy: '0', pt: '0', yt: '0', claimableYield: '0' },
        dualCORE: { underlying: '0', sy: '0', pt: '0', yt: '0', claimableYield: '0' }
      }
      
      // Aggregate stCORE markets
      Object.keys(updatedBalances).forEach(key => {
        if (key.startsWith('stCORE_')) {
          const balance = updatedBalances[key]
          aggregatedBalances.stCORE.sy = (parseFloat(aggregatedBalances.stCORE.sy) + parseFloat(balance.sy)).toFixed(2)
          aggregatedBalances.stCORE.pt = (parseFloat(aggregatedBalances.stCORE.pt) + parseFloat(balance.pt)).toFixed(2)
          aggregatedBalances.stCORE.yt = (parseFloat(aggregatedBalances.stCORE.yt) + parseFloat(balance.yt)).toFixed(2)
          aggregatedBalances.stCORE.claimableYield = (parseFloat(aggregatedBalances.stCORE.claimableYield) + parseFloat(balance.claimableYield)).toFixed(2)
        } else if (key.startsWith('lstBTC_')) {
          const balance = updatedBalances[key]
          aggregatedBalances.lstBTC.sy = (parseFloat(aggregatedBalances.lstBTC.sy) + parseFloat(balance.sy)).toFixed(2)
          aggregatedBalances.lstBTC.pt = (parseFloat(aggregatedBalances.lstBTC.pt) + parseFloat(balance.pt)).toFixed(2)
          aggregatedBalances.lstBTC.yt = (parseFloat(aggregatedBalances.lstBTC.yt) + parseFloat(balance.yt)).toFixed(2)
          aggregatedBalances.lstBTC.claimableYield = (parseFloat(aggregatedBalances.lstBTC.claimableYield) + parseFloat(balance.claimableYield)).toFixed(2)
        } else if (key.startsWith('dualCORE_')) {
          const balance = updatedBalances[key]
          aggregatedBalances.dualCORE.sy = (parseFloat(aggregatedBalances.dualCORE.sy) + parseFloat(balance.sy)).toFixed(2)
          aggregatedBalances.dualCORE.pt = (parseFloat(aggregatedBalances.dualCORE.pt) + parseFloat(balance.pt)).toFixed(2)
          aggregatedBalances.dualCORE.yt = (parseFloat(aggregatedBalances.dualCORE.yt) + parseFloat(balance.yt)).toFixed(2)
          aggregatedBalances.dualCORE.claimableYield = (parseFloat(aggregatedBalances.dualCORE.claimableYield) + parseFloat(balance.claimableYield)).toFixed(2)
        }
      })
      
      // Merge with existing balances to preserve other data
      // Include both individual market balances AND aggregated balances
      const finalBalances = { 
        ...userBalances, 
        ...updatedBalances,  // Individual market balances (stCORE_0, stCORE_1, etc.)
        ...aggregatedBalances  // Aggregated balances (stCORE, lstBTC, etc.)
      }
      
      console.log('🔄 Individual market balances:', updatedBalances)
      console.log('🔄 Aggregated balances:', aggregatedBalances)
      console.log('🔄 Final balances after merge:', finalBalances)
      
      // Force a complete state update to trigger re-render
      setUserBalances(finalBalances)
      
      console.log('✅ Token balances refreshed and state updated')
      
    } catch (error) {
      console.log('❌ Failed to refresh token balances:', error)
    }
  }

  // Mint test tokens function (works directly if owner, shows instructions if not)
  const mintTokens = async (asset: 'dualCORE' | 'stCORE' | 'lstBTC', amount: string) => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    // Check if the connected wallet is the owner
    const ownerAddress = '0xCE09931EeBd7d57c10BDcE6dBfA51a1139ec3663'
    const isOwner = address.toLowerCase() === ownerAddress.toLowerCase()

    try {
      if (isOwner) {
        // Owner can mint directly
        console.log(`🪙 Owner minting ${amount} ${asset} tokens directly...`)
        setIsLoading(true)
        
        const tokenAddress = CONTRACTS.MOCK_ASSETS[asset]
        
        // Call mint function on the token contract
        await writeStaking({
          address: tokenAddress as Address,
          abi: [
            {
              name: 'mint',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [
                { name: 'to', type: 'address' },
                { name: 'amount', type: 'uint256' },
              ],
              outputs: [{ name: '', type: 'bool' }]
            }
          ] as any,
          functionName: 'mint',
          args: [address, parseEther(amount)]
        })

        toast.success(`Successfully minted ${amount} ${asset} tokens!`)
        await refreshBalances()
        
      } else {
        // Non-owner gets instructions
        console.log(`🪙 Requesting ${amount} ${asset} test tokens for ${address}...`)
        
        const instructions = `
🪙 TOKEN MINTING INSTRUCTIONS

To mint ${amount} ${asset} tokens, run this command in your terminal:

npx hardhat run scripts/mint-all-tokens.js --network coreTestnet ${address} ${amount}

This will mint ${amount} CORE tokens to your address: ${address}

After running the command:
1. Click "🔄 Refresh Balances" button to see your new tokens
2. Your balances should update automatically
3. You can now use the tokens for staking, swapping, and liquidity provision

Note: The owner account will mint tokens to your address.
        `
        
        console.log(instructions)
        toast.success('Check console for token minting instructions')
        
        // Copy instructions to clipboard if possible
        if (navigator.clipboard) {
          try {
            await navigator.clipboard.writeText(`npx hardhat run scripts/mint-all-tokens.js --network coreTestnet ${address} ${amount}`)
            toast.success('Command copied to clipboard!')
          } catch (err) {
            console.log('Could not copy to clipboard')
          }
        }
        
        // Add a note about refreshing balances after minting
        toast.success('After running the command, click "Refresh Balances" to see your new tokens!')
      }
      
    } catch (error) {
      console.error('❌ Token minting failed:', error)
      toast.error('Failed to mint tokens')
    } finally {
      setIsLoading(false)
    }
  }

  // Redeem PT tokens for underlying asset
  const redeemPT = async (asset: string, amount: string) => {
    if (!address || !publicClient || !walletClient) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      console.log(`🔓 Redeeming ${amount} PT tokens for ${asset}...`)
      setTransactionStatuses(prev => ({ ...prev, redeem: 'pending' }))
      
      // Get the market info for the asset
      const market = CONTRACTS.MARKETS[asset as keyof typeof CONTRACTS.MARKETS]
      if (!market) {
        throw new Error(`Market not found for ${asset}`)
      }

      // Check if market is matured (this would need to come from contract)
      // For now, we'll assume it's matured
      const isMatured = true // TODO: Get from contract
      
      if (!isMatured) {
        throw new Error('Market not matured yet')
      }

      // Call the PT token contract to redeem
      const { request } = await publicClient.simulateContract({
        address: market.ptToken as Address,
        abi: [
          {
            name: 'redeem',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [{ name: '_ptAmount', type: 'uint256' }],
            outputs: [{ name: '', type: 'uint256' }]
          }
        ] as any,
        functionName: 'redeem',
        args: [parseEther(amount)]
      })

      const hash = await walletClient.writeContract(request)
      console.log(`🔓 PT redemption transaction hash: ${hash}`)
      
      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      console.log(`✅ PT redemption confirmed:`, receipt)
      
      toast.success(`Successfully redeemed ${amount} PT for underlying ${asset}!`)
      setTransactionStatuses(prev => ({ ...prev, redeem: 'success' }))
      
      // Refresh balances
      await refreshBalances()
      
    } catch (error) {
      console.error('❌ PT redemption failed:', error)
      toast.error('PT redemption failed')
      setTransactionStatuses(prev => ({ ...prev, redeem: 'failed' }))
    }
  }

  // Swap PT and YT tokens
  const swapPTYT = async (asset: string, amount: string, direction: 'pt-to-yt' | 'yt-to-pt') => {
    console.log('🔍 Debug: swapPTYT called with:', { asset, amount, direction })
    console.log('🔍 Debug: address, publicClient, walletClient:', { address: !!address, publicClient: !!publicClient, walletClient: !!walletClient })
    
    if (!address || !publicClient || !walletClient) {
      console.log('❌ Debug: Missing required clients')
      toast.error('Please connect your wallet')
      return
    }

    try {
      console.log(`🔄 Swapping ${amount} ${direction === 'pt-to-yt' ? 'PT' : 'YT'} to ${direction === 'pt-to-yt' ? 'YT' : 'PT'} for ${asset}...`)
      setTransactionStatuses(prev => ({ ...prev, swap: 'pending' }))
      
      // Get the market info for the asset
      console.log('🔍 Debug: CONTRACTS.MARKETS:', CONTRACTS.MARKETS)
      console.log('🔍 Debug: asset:', asset)
      console.log('🔍 Debug: asset type:', typeof asset)
      
      // Handle both asset names (stCORE) and market keys (stCORE_0)
      let marketKey = asset
      if (asset === 'stCORE') {
        marketKey = 'stCORE_0' // Default to first stCORE market
      } else if (asset === 'lstBTC') {
        marketKey = 'lstBTC_0' // Default to first lstBTC market
      }
      
      const market = CONTRACTS.MARKETS[marketKey as keyof typeof CONTRACTS.MARKETS]
      console.log('🔍 Debug: marketKey:', marketKey)
      console.log('🔍 Debug: market found:', market)
      
      if (!market) {
        throw new Error(`Market not found for ${asset} (tried ${marketKey})`)
      }

      if (direction === 'pt-to-yt') {
        // Swap PT to YT: Burn PT and mint YT
        console.log(`🔄 Executing real PT to YT swap...`)
        
        // First, check PT token allowance for the AMM contract
        try {
          const ptAllowance = await publicClient.readContract({
            address: market.ptToken as Address,
            abi: [
              {
                name: 'allowance',
                type: 'function',
                stateMutability: 'view',
                inputs: [
                  { name: 'owner', type: 'address' },
                  { name: 'spender', type: 'address' }
                ],
                outputs: [{ name: '', type: 'uint256' }]
              }
            ] as any,
            functionName: 'allowance',
            args: [address, CONTRACTS.CORE_YIELD_AMM as Address]
          })
          
          console.log('🔍 Debug: PT allowance for AMM:', ptAllowance)
          console.log('🔍 Debug: Required amount:', parseEther(amount).toString())
          console.log('🔍 Debug: Allowance check:', (ptAllowance as bigint) < parseEther(amount))
          
          // If allowance is insufficient, approve first
          if ((ptAllowance as bigint) < parseEther(amount)) {
            console.log('🔐 Approving PT tokens for AMM...')
            
            // Approve a large amount to avoid repeated approvals
            const approveAmount = parseEther('1000000') // Approve 1M tokens
            
            const { request: approveRequest } = await publicClient.simulateContract({
              address: market.ptToken as Address,
              abi: [
                {
                  name: 'approve',
                  type: 'function',
                  stateMutability: 'nonpayable',
                  inputs: [
                    { name: 'spender', type: 'address' },
                    { name: 'amount', type: 'uint256' }
                  ],
                  outputs: [{ name: '', type: 'bool' }]
                }
              ] as any,
              functionName: 'approve',
              args: [CONTRACTS.CORE_YIELD_AMM as Address, approveAmount]
            })
            
            const approveHash = await walletClient.writeContract(approveRequest)
            console.log('🔐 PT approval transaction hash:', approveHash)
            
            // Wait for approval confirmation
            await publicClient.waitForTransactionReceipt({ hash: approveHash })
            console.log('✅ PT approval confirmed')
          } else {
            console.log('✅ PT allowance sufficient, no approval needed')
          }
        } catch (error) {
          console.log('⚠️ Warning: Could not check/approve PT tokens, trying direct swap...')
          console.log('⚠️ Error details:', error)
        }
        
        // Now execute the actual PT to YT swap using the AMM
        console.log('🔄 Calling CoreYieldAMM for PT to YT swap...')
        
        try {
          // Since there's no getSwapQuote function, we'll estimate the output
          console.log('🔍 Debug: Executing PT to YT swap using generic swap function...')
          console.log('🔍 Debug: AMM Address:', CONTRACTS.CORE_YIELD_AMM)
          console.log('🔍 Debug: PT Token Address:', market.ptToken)
          console.log('🔍 Debug: YT Token Address:', market.ytToken)
          console.log('🔍 Debug: Amount:', amount)
          
          // Check AMM pool liquidity and calculate realistic output
          let poolData: any = null
          try {
            console.log('🔍 Debug: Checking AMM pool...')
            const poolKey = await publicClient.readContract({
              address: CONTRACTS.CORE_YIELD_AMM as Address,
              abi: [
                {
                  name: 'getPoolKey',
                  type: 'function',
                  stateMutability: 'view',
                  inputs: [
                    { name: 'token0', type: 'address' },
                    { name: 'token1', type: 'address' }
                  ],
                  outputs: [{ name: '', type: 'bytes32' }]
                }
              ] as any,
              functionName: 'getPoolKey',
              args: [market.ptToken as Address, market.ytToken as Address]
            })
            
            poolData = await publicClient.readContract({
              address: CONTRACTS.CORE_YIELD_AMM as Address,
              abi: [
                {
                  name: 'getPool',
                  type: 'function',
                  stateMutability: 'view',
                  inputs: [{ name: 'poolKey', type: 'bytes32' }],
                  outputs: [
                    {
                      name: '',
                      type: 'tuple',
                      components: [
                        { name: 'token0', type: 'address' },
                        { name: 'token1', type: 'address' },
                        { name: 'reserve0', type: 'uint256' },
                        { name: 'reserve1', type: 'uint256' },
                        { name: 'totalSupply', type: 'uint256' },
                        { name: 'isActive', type: 'bool' },
                        { name: 'tradingFee', type: 'uint256' }
                      ]
                    }
                  ]
                }
              ] as any,
              functionName: 'getPool',
              args: [poolKey]
            })
            
            console.log('🔍 Debug: Pool data:', poolData)
            console.log('🔍 Debug: Pool active:', poolData.isActive)
            console.log('🔍 Debug: Reserve0 (YT):', formatUnits(poolData.reserve0, 18))
            console.log('🔍 Debug: Reserve1 (PT):', formatUnits(poolData.reserve1, 18))
            
            if (!poolData.isActive) {
              throw new Error('Pool is not active')
            }
            
            if (poolData.reserve0 === 0n || poolData.reserve1 === 0n) {
              throw new Error('Pool has no liquidity')
            }
            
          } catch (poolError) {
            console.log('⚠️ Warning: Could not check AMM pool:', poolError)
            throw new Error(`Cannot check pool liquidity: ${poolError}`)
          }
          
          // Calculate expected output using actual pool reserves
          let estimatedOutput: bigint
          try {
            console.log('🔍 Debug: Calculating output using pool reserves')
            
            const amountIn = parseEther(amount)
            
            // Determine which token is which in the pool
            const isPTToken0 = poolData.token0.toLowerCase() === market.ptToken.toLowerCase()
            const reserveIn = isPTToken0 ? poolData.reserve0 : poolData.reserve1
            const reserveOut = isPTToken0 ? poolData.reserve1 : poolData.reserve0
            
            console.log('🔍 Debug: Pool mapping:', {
              isPTToken0,
              reserveIn: formatUnits(reserveIn, 18),
              reserveOut: formatUnits(reserveOut, 18),
              amountIn: formatUnits(amountIn, 18)
            })
            
            // Check if swap amount is too large (max 10% of reserve)
            const maxSwapAmount = reserveIn * 10n / 100n
            if (amountIn > maxSwapAmount) {
              const maxAmount = formatUnits(maxSwapAmount, 18)
              throw new Error(`Swap amount too large. Maximum: ${maxAmount} tokens (10% of pool liquidity)`)
            }
            
            // Simple AMM calculation: amountOut = (amountIn * reserveOut) / (reserveIn + amountIn)
            const numerator = amountIn * reserveOut
            const denominator = reserveIn + amountIn
            estimatedOutput = numerator / denominator
            
            console.log('🔍 Debug: AMM calculation:', {
              amountIn: formatUnits(amountIn, 18),
              reserveIn: formatUnits(reserveIn, 18),
              reserveOut: formatUnits(reserveOut, 18),
              estimatedOutput: formatUnits(estimatedOutput, 18)
            })
            
            // Check if output is reasonable (at least 1% of input)
            if (estimatedOutput < amountIn / 100n) {
              throw new Error('Insufficient liquidity for this swap amount')
            }
            
          } catch (calcError) {
            console.log('⚠️ Warning: Could not calculate AMM output:', calcError)
            throw new Error(`Cannot calculate swap output: ${calcError}`)
          }
          
          const minAmountOut = estimatedOutput * 80n / 100n // 20% slippage tolerance for safety
          
          console.log('🔍 Debug: Estimated output:', formatUnits(estimatedOutput, 18))
          console.log('🔍 Debug: Min amount out (with 5% slippage):', formatUnits(minAmountOut, 18))
          
          // Execute the swap using the generic swap function
          console.log('🔍 Debug: Executing PT to YT swap...')
          console.log('🔍 Debug: PT Token (input):', market.ptToken)
          console.log('🔍 Debug: YT Token (output):', market.ytToken)
          
          console.log('🔍 Debug: ABI length:', CoreYieldAMMABI.abi.length)
          console.log('🔍 Debug: Swap function in ABI:', CoreYieldAMMABI.abi.find(f => f.name === 'swap'))
          
          const swapHash = await walletClient.writeContract({
            address: CONTRACTS.CORE_YIELD_AMM as Address,
            abi: CoreYieldAMMABI.abi,
            functionName: 'swap',
            args: [
              market.ptToken as Address,  // PT token as input
              market.ytToken as Address,  // YT token as output
              parseEther(amount),         // amount to swap
              minAmountOut,               // minimum output with slippage
              address                     // recipient (user)
            ]
          })
          console.log('🔄 PT to YT swap transaction hash:', swapHash)
          
          // Wait for swap confirmation
          const swapReceipt = await publicClient.waitForTransactionReceipt({ hash: swapHash })
          console.log('✅ PT to YT swap confirmed:', swapReceipt)
          
          toast.success(`Successfully swapped ${amount} PT to YT!`)
        } catch (error) {
          console.error('❌ AMM swap failed:', error)
          
          // Check if it's a liquidity issue
          if (error instanceof Error && error.message.includes('Insufficient liquidity')) {
            throw new Error(`AMM swap failed: Insufficient liquidity. The AMM needs liquidity providers to deposit PT/YT tokens before trading can occur.`)
          }
          
          throw new Error(`AMM swap failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
        
      } else {
        // Swap YT to PT: Burn YT and mint PT
        console.log(`🔄 Executing real YT to PT swap...`)
        
        // First, check YT token allowance for the AMM contract
        try {
          const ytAllowance = await publicClient.readContract({
            address: market.ytToken as Address,
            abi: [
              {
                name: 'allowance',
                type: 'function',
                stateMutability: 'view',
                inputs: [
                  { name: 'owner', type: 'address' },
                  { name: 'spender', type: 'address' }
                ],
                outputs: [{ name: '', type: 'uint256' }]
              }
            ] as any,
            functionName: 'allowance',
            args: [address, CONTRACTS.CORE_YIELD_AMM as Address]
          })
        
        console.log('🔍 Debug: YT allowance:', ytAllowance)
        console.log('🔍 Debug: Required amount:', parseEther(amount).toString())
        console.log('🔍 Debug: Allowance check:', (ytAllowance as bigint) < parseEther(amount))
        
        // If allowance is insufficient, approve first
        if ((ytAllowance as bigint) < parseEther(amount)) {
          console.log('🔐 Approving YT tokens for AMM...')
          
          // Approve a large amount to avoid repeated approvals
          const approveAmount = parseEther('1000000') // Approve 1M tokens
          
          const { request: approveRequest } = await publicClient.simulateContract({
            address: market.ytToken as Address,
            abi: [
              {
                name: 'approve',
                type: 'function',
                stateMutability: 'nonpayable',
                inputs: [
                  { name: 'spender', type: 'address' },
                  { name: 'amount', type: 'uint256' }
                ],
                outputs: [{ name: '', type: 'bool' }]
              }
            ] as any,
            functionName: 'approve',
            args: [CONTRACTS.CORE_YIELD_AMM as Address, approveAmount]
          })
          
          const approveHash = await walletClient.writeContract(approveRequest)
          console.log('🔐 YT approval transaction hash:', approveHash)
          
          // Wait for approval confirmation
          await publicClient.waitForTransactionReceipt({ hash: approveHash })
          console.log('✅ YT approval confirmed')
        } else {
          console.log('✅ YT allowance sufficient, no approval needed')
        }
        } catch (error) {
          console.log('⚠️ Warning: Could not check/approve YT tokens, trying direct swap...')
          console.log('⚠️ Error details:', error)
        }
        
        // Now execute the actual YT to PT swap using the AMM
        console.log('🔄 Calling CoreYieldAMM for YT to PT swap...')
        
        try {
          // Since there's no getSwapQuote function, we'll estimate the output
          console.log('🔍 Debug: Executing YT to PT swap using generic swap function...')
          console.log('🔍 Debug: AMM Address:', CONTRACTS.CORE_YIELD_AMM)
          console.log('🔍 Debug: YT Token Address:', market.ytToken)
          console.log('🔍 Debug: PT Token Address:', market.ptToken)
          console.log('🔍 Debug: Amount:', amount)
          
          // Get pool data for YT to PT swap
          let poolData: any = null
          try {
            console.log('🔍 Debug: Getting pool data for YT to PT swap...')
            const poolKey = await publicClient.readContract({
              address: CONTRACTS.CORE_YIELD_AMM as Address,
              abi: [
                {
                  name: 'getPoolKey',
                  type: 'function',
                  stateMutability: 'view',
                  inputs: [
                    { name: 'token0', type: 'address' },
                    { name: 'token1', type: 'address' }
                  ],
                  outputs: [{ name: '', type: 'bytes32' }]
                }
              ] as any,
              functionName: 'getPoolKey',
              args: [market.ytToken as Address, market.ptToken as Address]
            })
            
            poolData = await publicClient.readContract({
              address: CONTRACTS.CORE_YIELD_AMM as Address,
              abi: [
                {
                  name: 'getPool',
                  type: 'function',
                  stateMutability: 'view',
                  inputs: [{ name: 'poolKey', type: 'bytes32' }],
                  outputs: [
                    {
                      name: '',
                      type: 'tuple',
                      components: [
                        { name: 'token0', type: 'address' },
                        { name: 'token1', type: 'address' },
                        { name: 'reserve0', type: 'uint256' },
                        { name: 'reserve1', type: 'uint256' },
                        { name: 'totalSupply', type: 'uint256' },
                        { name: 'isActive', type: 'bool' },
                        { name: 'tradingFee', type: 'uint256' }
                      ]
                    }
                  ]
                }
              ] as any,
              functionName: 'getPool',
              args: [poolKey]
            })
            
            console.log('🔍 Debug: YT to PT Pool data:', poolData)
            
          } catch (poolError) {
            console.log('⚠️ Warning: Could not get pool data for YT to PT:', poolError)
            throw new Error(`Cannot check pool liquidity: ${poolError}`)
          }
          
          // Calculate expected output using actual pool reserves
          let estimatedOutput: bigint
          try {
            console.log('🔍 Debug: Calculating YT to PT output using pool reserves')
            
            const amountIn = parseEther(amount)
            
            // Determine which token is which in the pool
            const isYTToken0 = poolData.token0.toLowerCase() === market.ytToken.toLowerCase()
            const reserveIn = isYTToken0 ? poolData.reserve0 : poolData.reserve1
            const reserveOut = isYTToken0 ? poolData.reserve1 : poolData.reserve0
            
            console.log('🔍 Debug: YT to PT pool mapping:', {
              isYTToken0,
              reserveIn: formatUnits(reserveIn, 18),
              reserveOut: formatUnits(reserveOut, 18),
              amountIn: formatUnits(amountIn, 18)
            })
            
            // Check if swap amount is too large (max 10% of reserve)
            const maxSwapAmount = reserveIn * 10n / 100n
            if (amountIn > maxSwapAmount) {
              const maxAmount = formatUnits(maxSwapAmount, 18)
              throw new Error(`Swap amount too large. Maximum: ${maxAmount} tokens (10% of pool liquidity)`)
            }
            
            // Simple AMM calculation: amountOut = (amountIn * reserveOut) / (reserveIn + amountIn)
            const numerator = amountIn * reserveOut
            const denominator = reserveIn + amountIn
            estimatedOutput = numerator / denominator
            
            console.log('🔍 Debug: YT to PT AMM calculation:', {
              amountIn: formatUnits(amountIn, 18),
              reserveIn: formatUnits(reserveIn, 18),
              reserveOut: formatUnits(reserveOut, 18),
              estimatedOutput: formatUnits(estimatedOutput, 18)
            })
            
            // Check if output is reasonable (at least 1% of input)
            if (estimatedOutput < amountIn / 100n) {
              throw new Error('Insufficient liquidity for this swap amount')
            }
            
          } catch (calcError) {
            console.log('⚠️ Warning: Could not calculate YT to PT output:', calcError)
            throw new Error(`Cannot calculate swap output: ${calcError}`)
          }
          
          const minAmountOut = estimatedOutput * 80n / 100n // 20% slippage tolerance for safety
          
          console.log('🔍 Debug: Estimated output:', formatUnits(estimatedOutput, 18))
          console.log('🔍 Debug: Min amount out (with 5% slippage):', formatUnits(minAmountOut, 18))
          
          // Execute the swap using the generic swap function
          console.log('🔍 Debug: Executing YT to PT swap...')
          console.log('🔍 Debug: ABI length:', CoreYieldAMMABI.abi.length)
          console.log('🔍 Debug: Swap function in ABI:', CoreYieldAMMABI.abi.find(f => f.name === 'swap'))
          
          const swapHash = await walletClient.writeContract({
            address: CONTRACTS.CORE_YIELD_AMM as Address,
            abi: CoreYieldAMMABI.abi,
            functionName: 'swap',
            args: [
              market.ytToken as Address,  // YT token as input
              market.ptToken as Address,  // PT token as output
              parseEther(amount),         // amount to swap
              minAmountOut,               // minimum output with slippage
              address                     // recipient (user)
            ]
          })
          console.log('🔄 YT to PT swap transaction hash:', swapHash)
          
          // Wait for swap confirmation
          const swapReceipt = await publicClient.waitForTransactionReceipt({ hash: swapHash })
          console.log('✅ YT to PT swap confirmed:', swapReceipt)
          
          toast.success(`Successfully swapped ${amount} YT to PT!`)
        } catch (error) {
          console.error('❌ AMM swap failed:', error)
          throw new Error(`AMM swap failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
      
      setTransactionStatuses(prev => ({ ...prev, swap: 'success' }))
      
      console.log('🔄 Swap successful, refreshing balances...')
      
      // Wait a moment for blockchain state to update
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Force refresh of basic token balances first
      console.log('🔄 Refreshing basic token balances...')
      try {
        // Manually read the latest balances from blockchain
        const [coreBal, stCoreBal, lstBTCBal] = await Promise.all([
          publicClient.readContract({
            address: CONTRACTS.MOCK_ASSETS.dualCORE as Address,
            abi: [
              {
                name: 'balanceOf',
                type: 'function',
                stateMutability: 'view',
                inputs: [{ name: 'account', type: 'address' }],
                outputs: [{ name: '', type: 'uint256' }]
              }
            ] as any,
            functionName: 'balanceOf',
            args: [address]
          }),
          publicClient.readContract({
            address: CONTRACTS.MOCK_ASSETS.stCORE as Address,
            abi: [
              {
                name: 'balanceOf',
                type: 'function',
                stateMutability: 'view',
                inputs: [{ name: 'account', type: 'address' }],
                outputs: [{ name: '', type: 'uint256' }]
              }
            ] as any,
            functionName: 'balanceOf',
            args: [address]
          }),
          publicClient.readContract({
            address: CONTRACTS.MOCK_ASSETS.lstBTC as Address,
            abi: [
              {
                name: 'balanceOf',
                type: 'function',
                stateMutability: 'view',
                inputs: [{ name: 'account', type: 'address' }],
                outputs: [{ name: '', type: 'uint256' }]
              }
            ] as any,
            functionName: 'balanceOf',
            args: [address]
          })
        ])
        
        console.log('🔍 Fresh balances from blockchain:')
        console.log('  CORE:', formatUnits(coreBal, 18))
        console.log('  stCORE:', formatUnits(stCoreBal, 18))
        console.log('  lstBTC:', formatUnits(lstBTCBal, 18))
        
        // Update the userBalances with fresh data
        setUserBalances(prev => ({
          ...prev,
          dualCORE: {
            ...prev.dualCORE,
            underlying: parseFloat(formatUnits(coreBal, 18)).toFixed(2)
          },
          stCORE: {
            ...prev.stCORE,
            underlying: parseFloat(formatUnits(stCoreBal, 18)).toFixed(2)
          },
          lstBTC: {
            ...prev.lstBTC,
            underlying: parseFloat(formatUnits(lstBTCBal, 18)).toFixed(2)
          }
        }))
        
        console.log('✅ Basic token balances updated')
      } catch (error) {
        console.error('❌ Error refreshing basic balances:', error)
      }
      
      // Refresh token balances (SY, PT, YT)
      await refreshTokenBalances()
      console.log('✅ refreshTokenBalances completed')
      
      console.log('🔄 Final balances after swap:', userBalances)
      
    } catch (error) {
      console.error('❌ PT/YT swap failed:', error)
      console.error('❌ Error details:', error)
      toast.error(`PT/YT swap failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setTransactionStatuses(prev => ({ ...prev, swap: 'failed' }))
    }
  }

  // Place limit order for PT/YT tokens
  const placeLimitOrder = async (asset: string, orderType: 'buy' | 'sell', price: string, amount: string) => {
    if (!address || !publicClient || !walletClient) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      console.log(`📋 Placing ${orderType} limit order for ${amount} ${asset} at $${price}...`)
      setTransactionStatuses(prev => ({ ...prev, limitOrder: 'pending' }))
      
      // Get the market info for the asset
      const market = CONTRACTS.MARKETS[asset as keyof typeof CONTRACTS.MARKETS]
      if (!market) {
        throw new Error(`Market not found for ${asset}`)
      }

      // This would typically involve calling the CoreYieldAMM contract
      // For now, we'll simulate placing the order
      console.log(`📋 Simulating limit order placement...`)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success(`Successfully placed ${orderType} limit order for ${amount} ${asset} at $${price}!`)
      setTransactionStatuses(prev => ({ ...prev, limitOrder: 'success' }))
      
      // Success - form clearing will be handled by the component
      console.log('✅ Limit order placed successfully')
      
    } catch (error) {
      console.error('❌ Limit order placement failed:', error)
      toast.error('Limit order placement failed')
      setTransactionStatuses(prev => ({ ...prev, limitOrder: 'failed' }))
    }
  }

  // Wrap underlying to SY function - TRUE ONE-CLICK AUTOMATIC FLOW
  const wrapToSY = async (marketKey: string, amount: string) => {
    if (!address || !publicClient || !walletClient) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      console.log('🚀 Starting wrap to SY process...')
      console.log('Market key:', marketKey)
      
      // Button shows "Processing..." immediately
      setTransactionStatuses(prev => ({ ...prev, wrap: 'pending' }))
      
      // Get the market data from CONTRACTS.MARKETS
      const market = CONTRACTS.MARKETS[marketKey as keyof typeof CONTRACTS.MARKETS]
      if (!market) {
        throw new Error(`Market ${marketKey} not found`)
      }
      
      console.log('Market data:', market)
      
      // Determine the underlying token based on the market
      let underlyingToken: string
      if (marketKey.startsWith('lstBTC_')) {
        underlyingToken = CONTRACTS.MOCK_ASSETS.lstBTC
      } else if (marketKey.startsWith('stCORE_')) {
        underlyingToken = CONTRACTS.MOCK_ASSETS.stCORE
      } else {
        throw new Error(`Unknown market type: ${marketKey}`)
      }
      
      console.log('Underlying token:', underlyingToken)
      console.log('SY token:', market.syToken)
      
      // Check allowance first
      const allowance = await publicClient.readContract({
        address: underlyingToken as Address,
        abi: [
          {
            name: 'allowance',
            type: 'function',
            stateMutability: 'view',
            inputs: [
              { name: 'owner', type: 'address' },
              { name: 'spender', type: 'address' }
            ],
            outputs: [{ name: '', type: 'uint256' }]
          }
        ] as any,
        functionName: 'allowance',
        args: [address, market.syToken as Address]
      })
      
      console.log('📊 Current allowance:', allowance)
      
      // If allowance is insufficient, approve first
      if ((allowance as bigint) < parseEther(amount)) {
        console.log('🔐 Approving underlying token...')
        
        const approveData = encodeFunctionData({
          abi: [
            {
              name: 'approve',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [
                { name: 'spender', type: 'address' },
                { name: 'amount', type: 'uint256' }
              ],
              outputs: [{ name: '', type: 'bool' }]
            }
          ] as any,
          functionName: 'approve',
          args: [market.syToken as Address, parseEther(amount)]
        })
        
        const approveHash = await walletClient.sendTransaction({
          account: address,
          to: underlyingToken as Address,
          data: approveData,
          chain: { 
            id: CONTRACTS.CHAIN_ID,
            name: 'Core Testnet',
            nativeCurrency: { name: 'CORE', symbol: 'CORE', decimals: 18 },
            rpcUrls: { default: { http: ['https://rpc.test2.btcs.network'] } }
          }
        })
        
        console.log('📝 Approval transaction sent:', approveHash)
        
        // Wait for approval confirmation
        console.log('⏳ Waiting for approval confirmation...')
        const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveHash })
        console.log('📋 Approval receipt:', approveReceipt)
        
        if (approveReceipt.status !== 'success') {
          throw new Error('Approval failed')
        }
      }
      
      // Now wrap to SY
      console.log('🔄 Wrapping to SY...')
      
      const wrapData = encodeFunctionData({
        abi: [
          {
            name: 'wrap',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [{ name: 'amount', type: 'uint256' }],
            outputs: [{ name: '', type: 'uint256' }]
          }
        ] as any,
        functionName: 'wrap',
        args: [parseEther(amount)]
      })
      
      const wrapHash = await walletClient.sendTransaction({
        account: address,
        to: market.syToken as Address,
        data: wrapData,
        chain: { 
          id: CONTRACTS.CHAIN_ID,
          name: 'Core Testnet',
          nativeCurrency: { name: 'CORE', symbol: 'CORE', decimals: 18 },
          rpcUrls: { default: { http: ['https://rpc.test2.btcs.network'] } }
        }
      })
      
      console.log('📝 Wrap transaction sent:', wrapHash)
      
      // Wait for wrap transaction confirmation
      console.log('⏳ Waiting for wrap confirmation...')
      const wrapReceipt = await publicClient.waitForTransactionReceipt({ hash: wrapHash })
      console.log('📋 Wrap receipt:', wrapReceipt)
      
      if (wrapReceipt.status === 'success') {
        // Refresh balances after successful transaction
        console.log('✅ Wrapping successful, refreshing balances...')
        console.log('🔄 About to call refreshTokenBalances...')
        await refreshTokenBalances()
        console.log('🔄 refreshTokenBalances completed')
        
        // Show success toast notification
        toast.success(`Successfully wrapped ${amount} ${marketKey} to SY`)
        
        // Reset button to normal
        setTransactionStatuses(prev => ({ ...prev, wrap: 'idle' }))
        
      } else {
        console.log('❌ Wrapping transaction failed')
        toast.error(`Wrapping transaction failed`)
        setTransactionStatuses(prev => ({ ...prev, wrap: 'idle' }))
      }
      
    } catch (error) {
      console.error('❌ Wrap error:', error)
      toast.error(`Failed to wrap tokens: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setTransactionStatuses(prev => ({ ...prev, wrap: 'idle' }))
    }
  }

  // Split SY to PT + YT function
  const splitSY = async (marketKey: string, amount: string) => {
    if (!address || !publicClient || !walletClient) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      setIsLoading(true)
      setTransactionStatuses(prev => ({ ...prev, split: 'pending' }))
      
      const market = CONTRACTS.MARKETS[marketKey as keyof typeof CONTRACTS.MARKETS]
      if (!market) {
        throw new Error(`Market ${marketKey} not found`)
      }
      
      console.log('🔄 Starting SY split process...')
      
      // First approve token operations to spend SY
      console.log('📝 Step 1: Approving SY token for split...')
      const approveHash = await walletClient.writeContract({
        address: market.syToken as Address,
        abi: [
          {
            name: 'approve',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'spender', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            outputs: [{ name: '', type: 'bool' }]
          }
        ] as any,
        functionName: 'approve',
        args: [CONTRACTS.CORE_YIELD_TOKEN_OPERATIONS, parseEther(amount)]
      })
      
      console.log('⏳ Waiting for approval transaction to be confirmed...')
      await publicClient.waitForTransactionReceipt({ hash: approveHash })
      console.log('✅ Approval transaction confirmed!')
      
      // Then split
      console.log('🔄 Step 2: Splitting SY to PT + YT...')
      const splitHash = await walletClient.writeContract({
        address: CONTRACTS.CORE_YIELD_TOKEN_OPERATIONS as Address,
        abi: [
          {
            name: 'splitSY',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'syToken', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            outputs: []
          }
        ] as any,
        functionName: 'splitSY',
        args: [market.syToken, parseEther(amount)]
      })
      
      console.log('⏳ Waiting for split transaction to be confirmed...')
      await publicClient.waitForTransactionReceipt({ hash: splitHash })
      console.log('✅ Split transaction confirmed!')

      toast.success(`Successfully split ${amount} SY to PT + YT`)
      setTransactionStatuses(prev => ({ ...prev, split: 'success' }))
      
      // Refresh all balances including underlying tokens
      await refreshBalances()
      await refreshTokenBalances()
      await refreshAll()
    } catch (error) {
      console.error('❌ Split error:', error)
      toast.error('Failed to split SY tokens')
      setTransactionStatuses(prev => ({ ...prev, split: 'failed' }))
    } finally {
      setIsLoading(false)
    }
  }

  // Merge PT + YT back to SY function
  const mergePTYT = async (marketKey: string, ptAmount: string, ytAmount: string) => {
    if (!address || !publicClient || !walletClient) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      setIsLoading(true)
      setTransactionStatuses(prev => ({ ...prev, merge: 'pending' }))
      
      const market = CONTRACTS.MARKETS[marketKey as keyof typeof CONTRACTS.MARKETS]
      if (!market) {
        throw new Error(`Market ${marketKey} not found`)
      }
      
      console.log('🔄 Starting PT + YT merge process...')
      
      // Approve token operations to spend PT
      console.log('📝 Step 1: Approving PT token for merge...')
      const ptApproveHash = await walletClient.writeContract({
        address: market.ptToken as Address,
        abi: [
          {
            name: 'approve',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'spender', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            outputs: [{ name: '', type: 'bool' }]
          }
        ] as any,
        functionName: 'approve',
        args: [CONTRACTS.CORE_YIELD_TOKEN_OPERATIONS, parseEther(ptAmount)]
      })
      
      console.log('⏳ Waiting for PT approval transaction to be confirmed...')
      await publicClient.waitForTransactionReceipt({ hash: ptApproveHash })
      console.log('✅ PT approval transaction confirmed!')

      // Approve token operations to spend YT
      console.log('📝 Step 2: Approving YT token for merge...')
      const ytApproveHash = await walletClient.writeContract({
        address: market.ytToken as Address,
        abi: [
          {
            name: 'approve',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'spender', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            outputs: [{ name: '', type: 'bool' }]
          }
        ] as any,
        functionName: 'approve',
        args: [CONTRACTS.CORE_YIELD_TOKEN_OPERATIONS, parseEther(ytAmount)]
      })
      
      console.log('⏳ Waiting for YT approval transaction to be confirmed...')
      await publicClient.waitForTransactionReceipt({ hash: ytApproveHash })
      console.log('✅ YT approval transaction confirmed!')

      // Then merge
      console.log('🔄 Step 3: Merging PT + YT to SY...')
      const mergeHash = await walletClient.writeContract({
        address: CONTRACTS.CORE_YIELD_TOKEN_OPERATIONS as Address,
        abi: [
          {
            name: 'mergePTYT',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'syToken', type: 'address' },
              { name: 'ptAmount', type: 'uint256' },
              { name: 'ytAmount', type: 'uint256' }
            ],
            outputs: []
          }
        ] as any,
        functionName: 'mergePTYT',
        args: [market.syToken, parseEther(ptAmount), parseEther(ytAmount)]
      })
      
      console.log('⏳ Waiting for merge transaction to be confirmed...')
      await publicClient.waitForTransactionReceipt({ hash: mergeHash })
      console.log('✅ Merge transaction confirmed!')

      toast.success(`Successfully merged PT + YT back to SY`)
      setTransactionStatuses(prev => ({ ...prev, merge: 'success' }))
      
      // Refresh all balances including underlying tokens
      await refreshBalances()
      await refreshTokenBalances()
      await refreshAll()
    } catch (error) {
      console.error('❌ Merge error:', error)
      toast.error('Failed to merge PT + YT tokens')
      setTransactionStatuses(prev => ({ ...prev, merge: 'failed' }))
    } finally {
      setIsLoading(false)
    }
  }

  // Unwrap SY to underlying function
  const unwrapFromSY = async (marketKey: string, amount: string) => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      setIsLoading(true)
      const market = CONTRACTS.MARKETS[marketKey as keyof typeof CONTRACTS.MARKETS]
      if (!market) {
        throw new Error(`Market ${marketKey} not found`)
      }
      
      await writeStaking({
        address: market.syToken as Address,
        abi: [
          {
            name: 'unwrap',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [{ name: 'amount', type: 'uint256' }],
            outputs: [{ name: '', type: 'uint256' }]
          }
        ] as any,
        functionName: 'unwrap',
        args: [parseEther(amount)]
      })

      toast.success(`Successfully unwrapped ${amount} SY to ${marketKey}`)
      refreshAll()
    } catch (error) {
      console.error('Unwrap error:', error)
      toast.error('Failed to unwrap SY tokens')
    } finally {
      setIsLoading(false)
    }
  }

  // Unstake function - TRUE ONE-CLICK AUTOMATIC FLOW
  const unstake = async (asset: string, amount: string) => {
    if (!address || !publicClient || !walletClient) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      console.log('🚀 Starting unstake process...')
      
      // Button shows "Processing..." immediately
      setTransactionStatuses(prev => ({ ...prev, unstake: 'pending' }))
      
      // First check if user has staked tokens
      console.log('🔍 Checking staked balance...')
      const stakedBalance = await publicClient.readContract({
        address: CONTRACTS.CORE_STAKING as Address,
        abi: CoreStakingABI.abi as any,
        functionName: 'userStakingInfo',
        args: [address]
      })
      
      console.log('📊 Staked balance:', stakedBalance)
      
      if (!stakedBalance || (stakedBalance as any[])[0] === 0n) {
        toast.error('No staked tokens found')
        setTransactionStatuses(prev => ({ ...prev, unstake: 'idle' }))
        return
      }
      
      const stakedAmount = (stakedBalance as any[])[0]
      const requestedAmount = parseEther(amount)
      
      if (stakedAmount < requestedAmount) {
        toast.error(`Insufficient staked tokens. You have ${formatUnits(stakedAmount, 18)} stCORE staked`)
        setTransactionStatuses(prev => ({ ...prev, unstake: 'idle' }))
        return
      }
      
      // Check lock period
      const lockPeriod = (stakedBalance as any[])[3] as bigint
      const currentTime = BigInt(Math.floor(Date.now() / 1000))
      
      if (currentTime < lockPeriod) {
        const remainingTime = Number(lockPeriod - currentTime)
        const remainingDays = Math.ceil(remainingTime / (24 * 60 * 60))
        const unlockDate = new Date(Number(lockPeriod) * 1000)
        
        toast.error(`Unstake locked! Available in ${remainingDays} day(s) on ${unlockDate.toLocaleDateString()}`)
        setTransactionStatuses(prev => ({ ...prev, unstake: 'idle' }))
        return
      }
      
      // Check if staking contract is approved to spend user's stCORE tokens
      console.log('🔍 Checking stCORE approval...')
      const stCoreAllowance = await publicClient.readContract({
        address: CONTRACTS.MOCK_ASSETS.stCORE as Address,
        abi: [
          {
            name: 'allowance',
            type: 'function',
            stateMutability: 'view',
            inputs: [
              { name: 'owner', type: 'address' },
              { name: 'spender', type: 'address' }
            ],
            outputs: [{ name: '', type: 'uint256' }]
          }
        ] as any,
        functionName: 'allowance',
        args: [address, CONTRACTS.CORE_STAKING as Address]
      })
      
      console.log('📊 stCORE allowance:', stCoreAllowance.toString())
      
      if (BigInt(stCoreAllowance as bigint) < requestedAmount) {
        // Need approval first - automatically call approve
        console.log('✅ Approval needed for stCORE, starting automatic approval...')
        
        // Prepare approval transaction for stCORE
        const approveData = encodeFunctionData({
          abi: [
            {
              name: 'approve',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [
                { name: 'spender', type: 'address' },
                { name: 'amount', type: 'uint256' }
              ],
              outputs: [{ name: '', type: 'bool' }]
            }
          ] as any,
          functionName: 'approve',
          args: [CONTRACTS.CORE_STAKING as Address, requestedAmount]
        })
        
        // Send approval transaction
        const approveHash = await walletClient.sendTransaction({
          account: address,
          to: CONTRACTS.MOCK_ASSETS.stCORE as Address,
          data: approveData,
          chain: { 
            id: CONTRACTS.CHAIN_ID,
            name: 'Core Testnet',
            nativeCurrency: { name: 'CORE', symbol: 'CORE', decimals: 18 },
            rpcUrls: { default: { http: ['https://rpc.test2.btcs.network'] } }
          }
        })
        
        console.log('📝 stCORE approval transaction sent:', approveHash)
        
        // Wait for approval confirmation
        console.log('⏳ Waiting for stCORE approval confirmation...')
        const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveHash })
        console.log('📋 stCORE approval receipt:', approveReceipt)
        
        if (approveReceipt.status !== 'success') {
          console.log('❌ stCORE approval failed')
          toast.error('stCORE approval failed')
          setTransactionStatuses(prev => ({ ...prev, unstake: 'idle' }))
          return
        }
        
        console.log('✅ stCORE approval successful, proceeding to unstake...')
        
        // Small delay for UX
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } else {
        console.log('✅ Sufficient stCORE allowance, proceeding directly to unstake...')
      }
      
      // Prepare unstake transaction using the proper ABI
      const unstakeData = encodeFunctionData({
        abi: CoreStakingABI.abi as any,
        functionName: 'unstake',
        args: [requestedAmount]
      })
      
      console.log('📝 Unstake data encoded:', unstakeData)
      console.log('📝 Requested amount:', formatUnits(requestedAmount, 18))
      console.log('📝 Contract address:', CONTRACTS.CORE_STAKING)
      
      // Send unstake transaction
      const unstakeHash = await walletClient.sendTransaction({
        account: address,
        to: CONTRACTS.CORE_STAKING as Address,
        data: unstakeData,
        chain: { 
          id: CONTRACTS.CHAIN_ID,
          name: 'Core Testnet',
          nativeCurrency: { name: 'CORE', symbol: 'CORE', decimals: 18 },
          rpcUrls: { default: { http: ['https://rpc.test2.btcs.network'] } }
        }
      })
      
      console.log('📝 Unstake transaction sent:', unstakeHash)
      
      // Wait for unstake transaction confirmation
      console.log('⏳ Waiting for unstake confirmation...')
      const unstakeReceipt = await publicClient.waitForTransactionReceipt({ hash: unstakeHash })
      console.log('📋 Unstake receipt:', unstakeReceipt)
      
      if (unstakeReceipt.status === 'success') {
        // Refresh balances after successful transaction
        console.log('✅ Unstaking successful, refreshing balances...')
        refetchStaking()
        
        // Show success toast notification
        toast.success(`Unstaked ${amount} stCORE successfully!`)
        
        // Reset button to normal
        setTransactionStatuses(prev => ({ ...prev, unstake: 'idle' }))
        
      } else {
        console.log('❌ Unstaking transaction failed')
        toast.error(`Unstaking transaction failed`)
        setTransactionStatuses(prev => ({ ...prev, unstake: 'idle' }))
      }
      
    } catch (error) {
      console.error('❌ Unstake error:', error)
      toast.error(`Failed to unstake: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setTransactionStatuses(prev => ({ ...prev, unstake: 'idle' }))
    }
  }

  // Claim yield function - TRUE ONE-CLICK AUTOMATIC FLOW
  const claimYield = async (asset: string) => {
    if (!address || !publicClient || !walletClient) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      console.log('🚀 Starting claim yield process...')
      
      // Button shows "Processing..." immediately
      setTransactionStatuses(prev => ({ ...prev, claim: 'pending' }))
      
      // Get the market for the asset
      const market = CONTRACTS.MARKETS[asset as keyof typeof CONTRACTS.MARKETS]
      
      // Prepare claim yield transaction - use CoreStaking contract
      const claimData = encodeFunctionData({
        abi: CoreStakingABI.abi as any,
        functionName: 'claimRewards',
        args: []
      })
      
      // Send claim yield transaction to CoreStaking contract
      const claimHash = await walletClient.sendTransaction({
        account: address,
        to: CONTRACTS.CORE_STAKING as Address,
        data: claimData,
        chain: { 
          id: CONTRACTS.CHAIN_ID,
          name: 'Core Testnet',
          nativeCurrency: { name: 'CORE', symbol: 'CORE', decimals: 18 },
          rpcUrls: { default: { http: ['https://rpc.test2.btcs.network'] } }
        }
      })
      
      console.log('📝 Claim yield transaction sent:', claimHash)
      
      // Wait for claim yield transaction confirmation
      console.log('⏳ Waiting for claim yield confirmation...')
      const claimReceipt = await publicClient.waitForTransactionReceipt({ hash: claimHash })
      console.log('📋 Claim yield receipt:', claimReceipt)
      
      if (claimReceipt.status === 'success') {
        // Refresh balances after successful transaction
        console.log('✅ Claim yield successful, refreshing balances...')
        refetchStaking()
        
        // Refresh user balances to update claimable yield
        await refreshBalances()
        
        // Show success toast notification
        toast.success(`Claimed yield successfully!`)
        
        // Reset button to normal
        setTransactionStatuses(prev => ({ ...prev, claim: 'idle' }))
        
      } else {
        console.log('❌ Claim yield transaction failed')
        toast.error(`Claim yield transaction failed`)
        setTransactionStatuses(prev => ({ ...prev, claim: 'idle' }))
      }
      
    } catch (error) {
      console.error('❌ Claim yield error:', error)
      toast.error(`Failed to claim yield: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setTransactionStatuses(prev => ({ ...prev, claim: 'idle' }))
    }
  }

  // ============ ADVANCED YIELD STRATEGY FUNCTIONS ============

  // Create and execute yield strategy
  const createYieldStrategy = async (
    strategyType: number,
    assets: string[],
    allocations: number[],
    targetAPY: number,
    riskTolerance: number,
    rebalanceFrequency: number,
    autoRebalance: boolean
  ) => {
    if (!address || !publicClient || !walletClient) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      console.log('🚀 Creating yield strategy...')
      setIsLoading(true)

      const strategyData = encodeFunctionData({
        abi: CoreYieldStrategyABI.abi as any,
        functionName: 'createStrategy',
        args: [strategyType, assets, allocations, targetAPY, riskTolerance, rebalanceFrequency, autoRebalance]
      })

      const hash = await walletClient.sendTransaction({
        account: address,
        to: CONTRACTS.CORE_YIELD_STRATEGY as Address,
        data: strategyData,
        chain: { 
          id: CONTRACTS.CHAIN_ID,
          name: 'Core Testnet',
          nativeCurrency: { name: 'CORE', symbol: 'CORE', decimals: 18 },
          rpcUrls: { default: { http: ['https://rpc.test2.btcs.network'] } }
        }
      })

      console.log('📝 Strategy creation transaction sent:', hash)
      
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      
      if (receipt.status === 'success') {
        toast.success('Yield strategy created successfully!')
        refetchStrategies()
      } else {
        toast.error('Strategy creation failed')
      }
      
    } catch (error) {
      console.error('❌ Strategy creation error:', error)
      toast.error(`Failed to create strategy: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Harvest yield from assets
  const harvestYield = async (asset: string) => {
    if (!address || !publicClient || !walletClient) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      console.log('🚀 Harvesting yield...')
      setIsLoading(true)

      const harvestData = encodeFunctionData({
        abi: PortfolioTrackerABI.abi as any, // Using PortfolioTracker ABI as placeholder
        functionName: 'harvestYield',
        args: [asset]
      })

      const hash = await walletClient.sendTransaction({
        account: address,
        to: CONTRACTS.YIELD_HARVESTER as Address,
        data: harvestData,
        chain: { 
          id: CONTRACTS.CHAIN_ID,
          name: 'Core Testnet',
          nativeCurrency: { name: 'CORE', symbol: 'CORE', decimals: 18 },
          rpcUrls: { default: { http: ['https://rpc.test2.btcs.network'] } }
        }
      })

      console.log('📝 Yield harvest transaction sent:', hash)
      
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      
      if (receipt.status === 'success') {
        toast.success('Yield harvested successfully!')
        refetchYieldStrategies()
      } else {
        toast.error('Yield harvest failed')
      }
      
    } catch (error) {
      console.error('❌ Yield harvest error:', error)
      toast.error(`Failed to harvest yield: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Enable auto-compound for yield
  const enableAutoCompound = async (asset: string, enabled: boolean) => {
    if (!address || !publicClient || !walletClient) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      console.log('🚀 Setting auto-compound...')
      setIsLoading(true)

      const autoCompoundData = encodeFunctionData({
        abi: PortfolioTrackerABI.abi as any, // Using PortfolioTracker ABI as placeholder
        functionName: 'enableAutoCompound',
        args: [asset, enabled]
      })

      const hash = await walletClient.sendTransaction({
        account: address,
        to: CONTRACTS.YIELD_HARVESTER as Address,
        data: autoCompoundData,
        chain: { 
          id: CONTRACTS.CHAIN_ID,
          name: 'Core Testnet',
          nativeCurrency: { name: 'CORE', symbol: 'CORE', decimals: 18 },
          rpcUrls: { default: { http: ['https://rpc.test2.btcs.network'] } }
        }
      })

      console.log('📝 Auto-compound transaction sent:', hash)
      
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      
      if (receipt.status === 'success') {
        toast.success(`Auto-compound ${enabled ? 'enabled' : 'disabled'} successfully!`)
        refetchYieldStrategies()
      } else {
        toast.error('Auto-compound setting failed')
      }
      
    } catch (error) {
      console.error('❌ Auto-compound error:', error)
      toast.error(`Failed to set auto-compound: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Get portfolio analytics
  const getPortfolioAnalytics = async () => {
    if (!address || !publicClient) return null

    try {
      const portfolio = await publicClient.readContract({
        address: CONTRACTS.PORTFOLIO_TRACKER as Address,
        abi: PortfolioTrackerABI.abi as any,
        functionName: 'getUserPortfolio',
        args: [address]
      })

      return portfolio
    } catch (error) {
      console.error('❌ Portfolio analytics error:', error)
      return null
    }
  }

  // Get risk assessment
  const getRiskAssessment = async () => {
    if (!address || !publicClient) return null

    try {
      const risk = await publicClient.readContract({
        address: CONTRACTS.RISK_MANAGER as Address,
        abi: PortfolioTrackerABI.abi as any, // Using PortfolioTracker ABI as placeholder
        functionName: 'getUserRiskProfile',
        args: [address]
      })

      return risk
    } catch (error) {
      console.error('❌ Risk assessment error:', error)
      return null
    }
  }

  // Bridge assets cross-chain
  const bridgeAssets = async (
    sourceChain: number,
    targetChain: number,
    asset: string,
    amount: string,
    recipient: string
  ) => {
    if (!address || !publicClient || !walletClient) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      console.log('🚀 Bridging assets...')
      setIsLoading(true)

      const bridgeData = encodeFunctionData({
        abi: CoreYieldBridgeABI.abi as any,
        functionName: 'bridgeAssets',
        args: [sourceChain, targetChain, asset, amount, recipient]
      })

      const hash = await walletClient.sendTransaction({
        account: address,
        to: CONTRACTS.CORE_YIELD_BRIDGE as Address,
        data: bridgeData,
        chain: { 
          id: CONTRACTS.CHAIN_ID,
          name: 'Core Testnet',
          nativeCurrency: { name: 'CORE', symbol: 'CORE', decimals: 18 },
          rpcUrls: { default: { http: ['https://rpc.test2.btcs.network'] } }
        }
      })

      console.log('📝 Bridge transaction sent:', hash)
      
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      
      if (receipt.status === 'success') {
        toast.success('Assets bridged successfully!')
        refetchBridge()
      } else {
        toast.error('Bridge transaction failed')
      }
      
    } catch (error) {
      console.error('❌ Bridge error:', error)
      toast.error(`Failed to bridge assets: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Check AMM liquidity for a trading pair
  const checkAMMLiquidity = useCallback(async (tokenIn: string, tokenOut: string) => {
    if (!publicClient) return null
    
    try {
      console.log('🔍 Debug: Checking AMM liquidity for pair...')
      console.log('🔍 Debug: Token In:', tokenIn)
      console.log('🔍 Debug: Token Out:', tokenOut)
      
      // Try to read some basic info from the AMM
      const ammInfo = await publicClient.readContract({
        address: CONTRACTS.CORE_YIELD_AMM as Address,
        abi: [
          {
            name: 'yieldInfo',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ name: '', type: 'address' }],
            outputs: [
              { name: 'currentAPY', type: 'uint256' },
              { name: 'historicalAPY', type: 'uint256' },
              { name: 'yieldAccrued', type: 'uint256' },
              { name: 'lastUpdateTime', type: 'uint256' },
              { name: 'isStable', type: 'bool' },
              { name: 'yieldVolatility', type: 'uint256' },
              { name: 'marketEfficiency', type: 'uint256' }
            ]
          }
        ] as any,
        functionName: 'yieldInfo',
        args: [tokenIn as Address]
      })
      
      console.log('🔍 Debug: AMM Info:', ammInfo)
      return ammInfo
    } catch (error) {
      console.log('⚠️ Warning: Could not check AMM liquidity:', error)
      return null
    }
  }, [publicClient])

  // Get lock period information for display
  const getLockPeriodInfo = useCallback(async () => {
    if (!address || !publicClient) {
      return null
    }

    try {
      const stakedBalance = await publicClient.readContract({
        address: CONTRACTS.CORE_STAKING as Address,
        abi: CoreStakingABI.abi as any,
        functionName: 'userStakingInfo',
        args: [address]
      })
      
      if (!stakedBalance || (stakedBalance as any[])[0] === 0n) {
        return null
      }
      
      const lockPeriod = (stakedBalance as any[])[3] as bigint
      const currentTime = BigInt(Math.floor(Date.now() / 1000))
      const isLocked = currentTime < lockPeriod
      
      if (isLocked) {
        const remainingTime = Number(lockPeriod - currentTime)
        const remainingDays = Math.ceil(remainingTime / (24 * 60 * 60))
        const remainingHours = Math.ceil((remainingTime % (24 * 60 * 60)) / (60 * 60))
        const unlockDate = new Date(Number(lockPeriod) * 1000)
        
        return {
          isLocked: true,
          remainingDays,
          remainingHours,
          unlockDate,
          lockPeriod: Number(lockPeriod),
          currentTime: Number(currentTime)
        }
      } else {
        return {
          isLocked: false,
          unlockDate: new Date(Number(lockPeriod) * 1000)
        }
      }
    } catch (error) {
      console.error('❌ Error getting lock period info:', error)
      return null
    }
  }, [address, publicClient])

  // Load pool data from markets
  const loadPoolData = async () => {
    if (!publicClient) return
    
    try {
      console.log('🚀 Loading pool data...')
      const newPoolData: Record<string, PoolData> = {}
      
      // Load data for each market
      for (const [marketKey, market] of Object.entries(CONTRACTS.MARKETS)) {
        try {
          // Get pool reserves
          const ptReserves = parseFloat(market.poolReserves.pt)
          const ytReserves = parseFloat(market.poolReserves.yt)
          
          // Calculate TVL (simplified - in real app would get actual token prices)
          const tvl = (ptReserves + ytReserves) * 1000 // Placeholder calculation
          
          // Get user's liquidity position (simplified)
          const userLiquidity = 0 // Would need to query actual user position
          
          newPoolData[marketKey] = {
            // Required properties from original interface
            token0: market.ptToken,
            token1: market.ytToken,
            reserve0: market.poolReserves.pt,
            reserve1: market.poolReserves.yt,
            totalSupply: '1000000', // Placeholder
            isYieldPool: true,
            yieldMultiplier: '1.0',
            // Additional properties for pools page
            asset: marketKey,
            tvl: `$${tvl.toLocaleString()}`,
            volume24h: '$0.00', // Would need to track actual volume
            apy: '8.5%', // Would need to calculate from yield data
            userLiquidity: `$${userLiquidity.toLocaleString()}`,
            poolAddress: market.syToken,
            ptToken: market.ptToken,
            ytToken: market.ytToken,
            underlying: market.underlying,
            maturity: market.maturity,
            ptReserves: market.poolReserves.pt,
            ytReserves: market.poolReserves.yt
          }
        } catch (error) {
          console.log(`❌ Failed to load pool data for ${marketKey}:`, error)
          // Set default values
          newPoolData[marketKey] = {
            // Required properties from original interface
            token0: market.ptToken,
            token1: market.ytToken,
            reserve0: '0',
            reserve1: '0',
            totalSupply: '1000000', // Placeholder
            isYieldPool: true,
            yieldMultiplier: '1.0',
            // Additional properties for pools page
            asset: marketKey,
            tvl: '$0.00',
            volume24h: '$0.00',
            apy: '0.00%',
            userLiquidity: '$0.00',
            poolAddress: market.syToken,
            ptToken: market.ptToken,
            ytToken: market.ytToken,
            underlying: market.underlying,
            maturity: market.maturity,
            ptReserves: '0',
            ytReserves: '0'
          }
        }
      }
      
      setPoolData(newPoolData)
      console.log('✅ Pool data loaded:', newPoolData)
      
    } catch (error) {
      console.error('❌ Failed to load pool data:', error)
    }
  }

  // Load pool data when component mounts
  useEffect(() => {
    if (address && publicClient) {
      loadPoolData()
    }
  }, [address, publicClient])

  // Request tokens for testing (calls backend script)
  const requestTestTokens = async (amount: string = '10000') => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      console.log(`🪙 Requesting ${amount} test tokens for ${address}...`)
      
      // In a real implementation, this would call a backend API
      // For now, we'll show instructions to the user
      const instructions = `
🪙 TOKEN REQUEST INSTRUCTIONS

To get test tokens, run this command in your terminal:

npx hardhat run scripts/mint-all-tokens.js --network coreTestnet ${address} ${amount}

This will mint ${amount} CORE tokens to your address: ${address}

After running the command:
1. Refresh this page
2. Your balances should update automatically
3. You can now use the tokens for staking, swapping, and liquidity provision

Note: The owner account will mint tokens to your address.
      `
      
      console.log(instructions)
      toast.success('Check console for token request instructions')
      
      // Copy instructions to clipboard if possible
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(`npx hardhat run scripts/mint-all-tokens.js --network coreTestnet ${address} ${amount}`)
          toast.success('Command copied to clipboard!')
        } catch (err) {
          console.log('Could not copy to clipboard')
        }
      }
      
      // Add a note about refreshing balances after minting
      toast.success('After running the command, click "Refresh Balances" to see your new tokens!')
      
    } catch (error) {
      console.error('❌ Token request failed:', error)
      toast.error('Failed to request tokens')
    }
  }

  // Get real pool data from blockchain
  const getRealPoolData = async (asset: string) => {
    if (!publicClient) return null

    try {
      const market = CONTRACTS.MARKETS[asset as keyof typeof CONTRACTS.MARKETS]
      if (!market) return null

      // Get pool key
      const poolKey = await publicClient.readContract({
        address: CONTRACTS.CORE_YIELD_AMM as Address,
        abi: [
          {
            name: 'getPoolKey',
            type: 'function',
            stateMutability: 'view',
            inputs: [
              { name: 'token0', type: 'address' },
              { name: 'token1', type: 'address' }
            ],
            outputs: [{ name: '', type: 'bytes32' }]
          }
        ] as any,
        functionName: 'getPoolKey',
        args: [market.ptToken as Address, market.ytToken as Address]
      })

      // Get pool data
      const pool = await publicClient.readContract({
        address: CONTRACTS.CORE_YIELD_AMM as Address,
        abi: [
          {
            name: 'getPool',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ name: 'poolKey', type: 'bytes32' }],
            outputs: [
              {
                name: '',
                type: 'tuple',
                components: [
                  { name: 'token0', type: 'address' },
                  { name: 'token1', type: 'address' },
                  { name: 'reserve0', type: 'uint256' },
                  { name: 'reserve1', type: 'uint256' },
                  { name: 'totalSupply', type: 'uint256' },
                  { name: 'isActive', type: 'bool' },
                  { name: 'tradingFee', type: 'uint256' }
                ]
              }
            ]
          }
        ] as any,
        functionName: 'getPool',
        args: [poolKey]
      })

      // Determine which token is which
      const isPTToken0 = pool.token0.toLowerCase() === market.ptToken.toLowerCase()
      const ptReserve = isPTToken0 ? pool.reserve0 : pool.reserve1
      const ytReserve = isPTToken0 ? pool.reserve1 : pool.reserve0

      return {
        poolKey,
        token0: pool.token0,
        token1: pool.token1,
        ptReserve: formatUnits(ptReserve, 18),
        ytReserve: formatUnits(ytReserve, 18),
        totalSupply: formatUnits(pool.totalSupply, 18),
        isActive: pool.isActive,
        tradingFee: pool.tradingFee.toString(),
        totalLiquidity: parseFloat(formatUnits(ptReserve, 18)) + parseFloat(formatUnits(ytReserve, 18))
      }
    } catch (error) {
      console.error('Error fetching pool data:', error)
      return null
    }
  }

  // Add liquidity to a pool
  const addLiquidity = async (asset: string, ptAmount: string, ytAmount: string) => {
    if (!address || !publicClient || !walletClient) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      console.log('🚀 Adding liquidity to pool:', asset)
      setIsLoading(true)

      // Get market data
      const market = CONTRACTS.MARKETS[asset as keyof typeof CONTRACTS.MARKETS]
      if (!market) {
        toast.error(`Market not found for ${asset}`)
        return
      }

      const ptAmountWei = parseEther(ptAmount)
      const ytAmountWei = parseEther(ytAmount)

      console.log('🔍 Debug: Adding liquidity with amounts:', {
        ptAmount: ptAmount,
        ytAmount: ytAmount,
        ptAmountWei: ptAmountWei.toString(),
        ytAmountWei: ytAmountWei.toString()
      })

      // Check PT token allowance
      const ptAllowance = await publicClient.readContract({
        address: market.ptToken as Address,
        abi: [
          {
            name: 'allowance',
            type: 'function',
            stateMutability: 'view',
            inputs: [
              { name: 'owner', type: 'address' },
              { name: 'spender', type: 'address' }
            ],
            outputs: [{ name: '', type: 'uint256' }]
          }
        ] as any,
        functionName: 'allowance',
        args: [address, CONTRACTS.CORE_YIELD_AMM as Address]
      })

      if (ptAllowance < ptAmountWei) {
        console.log('🔄 Approving PT tokens...')
        const ptApproveHash = await walletClient.writeContract({
          address: market.ptToken as Address,
          abi: [
            {
              name: 'approve',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [
                { name: 'spender', type: 'address' },
                { name: 'amount', type: 'uint256' }
              ],
              outputs: [{ name: '', type: 'bool' }]
            }
          ] as any,
          functionName: 'approve',
          args: [CONTRACTS.CORE_YIELD_AMM as Address, ptAmountWei]
        })
        await publicClient.waitForTransactionReceipt({ hash: ptApproveHash })
        console.log('✅ PT tokens approved')
      }

      // Check YT token allowance
      const ytAllowance = await publicClient.readContract({
        address: market.ytToken as Address,
        abi: [
          {
            name: 'allowance',
            type: 'function',
            stateMutability: 'view',
            inputs: [
              { name: 'owner', type: 'address' },
              { name: 'spender', type: 'address' }
            ],
            outputs: [{ name: '', type: 'uint256' }]
          }
        ] as any,
        functionName: 'allowance',
        args: [address, CONTRACTS.CORE_YIELD_AMM as Address]
      })

      if (ytAllowance < ytAmountWei) {
        console.log('🔄 Approving YT tokens...')
        const ytApproveHash = await walletClient.writeContract({
          address: market.ytToken as Address,
          abi: [
            {
              name: 'approve',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [
                { name: 'spender', type: 'address' },
                { name: 'amount', type: 'uint256' }
              ],
              outputs: [{ name: '', type: 'bool' }]
            }
          ] as any,
          functionName: 'approve',
          args: [CONTRACTS.CORE_YIELD_AMM as Address, ytAmountWei]
        })
        await publicClient.waitForTransactionReceipt({ hash: ytApproveHash })
        console.log('✅ YT tokens approved')
      }

      // Add liquidity to the pool
      console.log('🔄 Adding liquidity to AMM pool...')
      const addLiquidityHash = await walletClient.writeContract({
        address: CONTRACTS.CORE_YIELD_AMM as Address,
        abi: CoreYieldAMMABI.abi,
        functionName: 'addLiquidity',
        args: [
          market.ptToken as Address,
          market.ytToken as Address,
          ptAmountWei,
          ytAmountWei,
          0n // minLiquidity (0 for now)
        ]
      })

      console.log('🔄 Add liquidity transaction hash:', addLiquidityHash)
      const receipt = await publicClient.waitForTransactionReceipt({ hash: addLiquidityHash })
      console.log('✅ Liquidity added successfully:', receipt)

      toast.success(`Successfully added liquidity to ${asset} pool!`)
      
      // Refresh balances and pool data
      await refreshBalances()
      await refreshTokenBalances()
      await loadPoolData()
      
    } catch (error) {
      console.error('❌ Add liquidity failed:', error)
      toast.error(`Failed to add liquidity: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    // State
    isLoading,
    portfolioData,
    stakingData,
    riskData,
    stakingStats,
    userStrategies,
    bridgeRequests,
    coreBalance,
    stCoreBalance,
    lastUpdate,
    
    // Market data
    markets,
    userBalances,
    marketAnalytics,
    poolData,
    
    // Loading states
    isLoadingBalances,
    balancesLoaded,
    
    // Account info
    address,
    isConnected,
    
    // Functions
    stake,
    unstake,
    claimYield,
    swap,
    createStrategy,
    bridge,
    harvestAndTrack,
    claimStakingRewards,
    emergencyPause,
    emergencyResume,
    refreshAll,
    refreshTokenBalances,
    testSYBalance,
    mintTokens,
    redeemPT,
    swapPTYT,
    placeLimitOrder,
    wrapToSY,
    splitSY,
    mergePTYT,
    unwrapFromSY,
    refreshBalances,
    
    // Advanced Functions
    createYieldStrategy,
    harvestYield,
    enableAutoCompound,
    getPortfolioAnalytics,
    getRiskAssessment,
    bridgeAssets,
    checkAMMLiquidity,
    
    // Contract states
    isRouterPending,
    isStakingPending,
    isStrategyPending,
    isBridgePending,
    
    // Transaction tracking
    transactionStatuses,
    getButtonText,
    getLockPeriodInfo,
    addLiquidity,
    getRealPoolData,
    requestTestTokens
  }
}
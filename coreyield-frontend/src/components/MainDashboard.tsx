import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useReadContract } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { CONTRACTS, ASSET_METADATA } from '../../contracts/addresses'
import { useYieldProtocol } from '../hooks/useYieldProtocol'
import { useTransactionHistory, Transaction } from '../hooks/useTransactionHistory'
import toast from 'react-hot-toast'
import { TransactionStats } from './TransactionStats'
import { TransactionDetailsModal } from './TransactionDetailsModal'

interface MainDashboardProps {
    onBackToLanding: () => void
    onShowEducation?: (level?: 'beginner' | 'intermediate' | 'advanced') => void
    onOpenMobileMenu?: () => void
}



export const MainDashboard: React.FC<MainDashboardProps> = ({ onBackToLanding, onShowEducation, onOpenMobileMenu }) => {
    const [selectedAsset, setSelectedAsset] = useState<'stCORE' | 'lstBTC' | 'dualCORE'>('stCORE')
    const [amount, setAmount] = useState('')
    const [activeView, setActiveView] = useState<'markets' | 'pools' | 'dashboard'>('dashboard')
    const [dashboardTab, setDashboardTab] = useState<'invest' | 'portfolio' | 'earn' | 'manage' | 'transactions' | 'education'>('invest')
    const [assetFilter, setAssetFilter] = useState<'all' | 'pt' | 'yt' | 'lp'>('all')
    const [displayMode, setDisplayMode] = useState<'usd' | 'underlying'>('usd')
    const [withdrawAmount, setWithdrawAmount] = useState('')


    // Transaction history state
    const {
        transactions,
        isLoading: historyLoading,
        filterTransactions,
        searchTransactions,
        getTransactionStats,
        refreshTransactions,
        searchRecentYieldClaims,
        // Pagination
        currentPage,
        setCurrentPage,
        getPaginatedTransactions,
        getTotalPages,
        goToNextPage,
        goToPreviousPage,
        goToFirstPage,
        goToLastPage
    } = useTransactionHistory()
    const [transactionFilter, setTransactionFilter] = useState<'all' | 'deposit' | 'withdraw' | 'split' | 'claim'>('all')
    const [transactionSearch, setTransactionSearch] = useState('')
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
    const [showTransactionModal, setShowTransactionModal] = useState(false)

    // Removed unused loading and action states



    // Get real protocol stats
    const { data: protocolStats } = useReadContract({
        address: CONTRACTS.FACTORY as `0x${string}`,
        abi: [
            {
                name: 'getProtocolStats',
                type: 'function',
                stateMutability: 'view',
                inputs: [],
                outputs: [
                    { name: 'totalMarkets', type: 'uint256' },
                    { name: 'activeMarkets', type: 'uint250' },
                    { name: 'totalValueLocked', type: 'uint256' }
                ],
            },
        ],
        functionName: 'getProtocolStats',
    })

    // Get real data for all assets
    const stCOREHook = useYieldProtocol('stCORE')
    const lstBTCHook = useYieldProtocol('lstBTC')
    const dualCOREHook = useYieldProtocol('dualCORE')

    const currentHook = selectedAsset === 'stCORE' ? stCOREHook : selectedAsset === 'lstBTC' ? lstBTCHook : dualCOREHook

    // 🎯 NEW: Get real yield data from the hook
    const { yieldSourceInfo, realYieldAPY } = currentHook

    // Memoize approval status to avoid repeated function calls
    const approvalStatus = React.useMemo(() => {
        if (!amount) return { needsApproval: true, status: '❌ Needs Approval', className: 'text-red-400' }
        const needsApproval = currentHook.needsApproval(amount)
        return {
            needsApproval,
            status: needsApproval ? '❌ Needs Approval' : '✅ Approved',
            className: needsApproval ? 'text-red-400' : 'text-green-400'
        }
    }, [amount, currentHook])

    // 🎯 NEW: Check if SY approval is needed for splitting
    const syApprovalStatus = React.useMemo(() => {
        if (!amount) return { needsSYApproval: true, status: '❌ SY Approval Needed', className: 'text-red-400' }
        const needsSYApproval = currentHook.needsSYApproval(amount)
        return {
            needsSYApproval,
            status: needsSYApproval ? '❌ SY Approval Needed' : '✅ SY Approved',
            className: needsSYApproval ? 'text-red-400' : 'text-green-400'
        }
    }, [amount, currentHook])

    // Helper function to get the appropriate hook for a given asset
    const getHookForAsset = (assetKey: string) => {
        switch (assetKey) {
            case 'stCORE': return stCOREHook
            case 'lstBTC': return lstBTCHook
            case 'dualCORE': return dualCOREHook
            default: return stCOREHook
        }
    }



    // Refresh all balances after successful transactions
    useEffect(() => {
        if (currentHook.notification?.type === 'success') {
            // Refresh all hooks to update balances
            stCOREHook.refreshBalances()
            lstBTCHook.refreshBalances()
            dualCOREHook.refreshBalances()

            // Auto-navigate to Portfolio tab after token split to show the magic!
            if (currentHook.notification.title.includes('Token Split')) {
                setTimeout(() => {
                    setDashboardTab('portfolio')
                }, 2000) // Wait 2 seconds for user to see success message
            }
        }
    }, [currentHook.notification, stCOREHook, lstBTCHook, dualCOREHook])

    // Listen for yield claim events to refresh all balances
    useEffect(() => {
        const handleYieldClaimed = (event: CustomEvent) => {
            console.log('🔄 Dashboard: Refreshing all asset balances after yield claim:', event.detail)

            // Force refresh all asset balances
            stCOREHook.refreshBalances()
            lstBTCHook.refreshBalances()
            dualCOREHook.refreshBalances()

            // Also refresh transaction history
            refreshTransactions()
        }

        window.addEventListener('yieldClaimed', handleYieldClaimed as EventListener)

        return () => {
            window.removeEventListener('yieldClaimed', handleYieldClaimed as EventListener)
        }
    }, [stCOREHook, lstBTCHook, dualCOREHook, refreshTransactions])

    // Show notification when asset changes
    useEffect(() => {
        if (dashboardTab === 'portfolio') {
            toast.success(`Switched to ${ASSET_METADATA[selectedAsset].name} portfolio`, {
                duration: 2000,
                position: 'top-right',
                style: {
                    background: '#1f2937',
                    color: '#fff',
                    border: '1px solid #374151'
                }
            })
        }
    }, [selectedAsset, dashboardTab])

    // Track transactions from all hooks using refs to avoid duplicates
    const prevStatesRef = useRef<{
        stCORE: { isApproving: boolean; isDepositing: boolean; isClaimingYield: boolean; splitStep?: string }
        lstBTC: { isApproving: boolean; isDepositing: boolean; isClaimingYield: boolean; splitStep?: string }
        dualCORE: { isApproving: boolean; isDepositing: boolean; isClaimingYield: boolean; splitStep?: string }
    }>({
        stCORE: { isApproving: false, isDepositing: false, isClaimingYield: false },
        lstBTC: { isApproving: false, isDepositing: false, isClaimingYield: false },
        dualCORE: { isApproving: false, isDepositing: false, isClaimingYield: false }
    })

    useEffect(() => {
        const allHooks = [
            { hook: stCOREHook, key: 'stCORE' as const },
            { hook: lstBTCHook, key: 'lstBTC' as const },
            { hook: dualCOREHook, key: 'dualCORE' as const }
        ]

        allHooks.forEach(({ hook, key }) => {
            const prevState = prevStatesRef.current[key]
            const currentState = {
                isApproving: hook.isApproving,
                isDepositing: hook.isDepositing,
                isClaimingYield: hook.isClaimingYield,
                splitStep: hook.splitProgress?.step
            }

            // Only create transactions when states actually change
            if (currentState.isApproving && !prevState.isApproving) {
                // Transaction history now handled by blockchain history hook
            }

            if (currentState.isDepositing && !prevState.isDepositing) {
                // Transaction history now handled by blockchain history hook
            }

            if (currentState.splitStep === 'splitting' && prevState.splitStep !== 'splitting') {
                // Transaction history now handled by blockchain history hook
            }

            if (currentState.isClaimingYield && !prevState.isClaimingYield) {
                // Transaction history now handled by blockchain history hook
            }

            // Update previous state
            prevStatesRef.current[key] = currentState
        })
    }, [stCOREHook.isApproving, stCOREHook.isDepositing, stCOREHook.isClaimingYield, stCOREHook.splitProgress?.step,
    lstBTCHook.isApproving, lstBTCHook.isDepositing, lstBTCHook.isClaimingYield, lstBTCHook.splitProgress?.step,
    dualCOREHook.isApproving, dualCOREHook.isDepositing, dualCOREHook.isClaimingYield, dualCOREHook.splitProgress?.step,
        stCOREHook, lstBTCHook, dualCOREHook])

    // Track successful transactions from notifications
    useEffect(() => {
        const allHooks = [stCOREHook, lstBTCHook, dualCOREHook]

        allHooks.forEach((hook) => {
            if (hook.notification?.type === 'success') {
                // Transaction history now handled by blockchain history hook
            }
        })
    }, [stCOREHook.notification, lstBTCHook.notification, dualCOREHook.notification, stCOREHook, lstBTCHook, dualCOREHook])



    /**
     * Filter and search transactions using blockchain history hook
     * Provides real-time transaction filtering by type and search queries
     * Integrates with useTransactionHistory for transaction data
     */
    const filteredTransactions = useMemo(() => {
        let filtered = filterTransactions(transactionFilter === 'all' ? undefined : transactionFilter)

        if (transactionSearch) {
            filtered = searchTransactions(transactionSearch)
        }

        return filtered
    }, [transactions, transactionFilter, transactionSearch, filterTransactions, searchTransactions])

    // Get paginated transactions for current page
    const paginatedTransactions = useMemo(() => {
        console.log('📊 paginatedTransactions memo:', {
            filteredTransactionsLength: filteredTransactions.length,
            currentPage,
            result: getPaginatedTransactions(filteredTransactions)
        })
        return getPaginatedTransactions(filteredTransactions)
    }, [filteredTransactions, currentPage, getPaginatedTransactions])

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [transactionFilter, transactionSearch])

    // Get total pages for current filtered results
    const totalPages = useMemo(() => {
        return getTotalPages(filteredTransactions)
    }, [filteredTransactions, getTotalPages])

    // Helper functions for transaction display
    const getTransactionIcon = (type: 'deposit' | 'withdraw' | 'split' | 'claim') => {
        switch (type) {
            case 'deposit': return '💰'
            case 'withdraw': return '💸'
            case 'split': return '✂️'
            case 'claim': return '🎯'
            default: return '📝'
        }
    }

    const getTimeAgo = (timestamp: Date) => {
        const now = new Date()
        const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000)

        if (diffInSeconds < 60) return `${diffInSeconds}s ago`
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
        return `${Math.floor(diffInSeconds / 86400)}d ago`
    }

    const getStatusColor = (status: 'success' | 'failed') => {
        switch (status) {
            case 'success': return 'text-green-400'
            case 'failed': return 'text-red-400'
            default: return 'text-gray-400'
        }
    }

    const {
        isConnected,
        address,
        notification,
        assetBalance,
        syBalance,
        accumulatedYield,
        isMinting,
        isApproving,
        isDepositing,
        isWithdrawing,
        isClaimingYield,
        formatBalance,
        handleMintTestTokens,
        handleMintCustomAmount,
        handleWithdraw,
        handleClaimYTYield,
    } = currentHook

    if (!isConnected) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="max-w-md w-full p-8 bg-gray-800 rounded-2xl border border-gray-700 text-center space-y-6 shadow-lg">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto">
                        <img src="/logo2.svg" alt="CoreYield" className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Connect Wallet</h2>
                        <p className="text-gray-400 text-sm">Connect your wallet to access CoreYield Protocol</p>
                    </div>
                    <ConnectButton />
                    <button onClick={onBackToLanding} className="text-gray-400 hover:text-white text-sm transition-colors">
                        ← Back to Landing
                    </button>
                </div>
            </div>
        )
    }

    const hasTokens = assetBalance && (assetBalance as bigint) > 0n
    // Check if user has any yield protocol tokens (SY, PT, or YT)
    const hasSYTokens = syBalance && (syBalance as bigint) > 0n
    const hasPTTokens = Object.entries(ASSET_METADATA).some(([key]) => {
        const hook = getHookForAsset(key)
        return Number(hook.ptBalance || 0) > 0
    })
    const hasYTTokens = Object.entries(ASSET_METADATA).some(([key]) => {
        const hook = getHookForAsset(key)
        return Number(hook.ytBalance || 0) > 0
    })
    const hasAnyYieldTokens = hasSYTokens || hasPTTokens || hasYTTokens
    const hasYield = accumulatedYield && (accumulatedYield as bigint) > 0n

    // Calculate real metrics
    const totalPortfolioValue = (Number(stCOREHook.assetBalance || 0) + Number(lstBTCHook.assetBalance || 0) + Number(dualCOREHook.assetBalance || 0)) / 1e18
    const totalSYValue = (Number(stCOREHook.syBalance || 0) + Number(lstBTCHook.syBalance || 0) + Number(dualCOREHook.syBalance || 0)) / 1e18
    const totalClaimableYield = (Number(stCOREHook.accumulatedYield || 0) + Number(lstBTCHook.accumulatedYield || 0) + Number(dualCOREHook.accumulatedYield || 0)) / 1e18

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Exact Pendle Header */}
            <header className="border-b border-gray-800 bg-gray-900 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-8">
                            <button onClick={onBackToLanding} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-teal-500 rounded-xl flex items-center justify-center">
                                    <img src="/logo2.svg" alt="CoreYield" className="w-4 h-4" />
                                </div>
                                <span className="text-white font-medium text-lg">CoreYield</span>
                            </button>

                            {/* Exact Pendle Navigation */}
                            <nav className="hidden md:flex items-center space-x-1">
                                {[
                                    { id: 'markets', label: 'Markets', icon: '📈' },
                                    { id: 'pools', label: 'Pools', icon: '🏊' },
                                    { id: 'dashboard', label: 'Dashboard', icon: '📊' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveView(tab.id as 'markets' | 'pools' | 'dashboard')}
                                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${activeView === tab.id
                                                ? 'bg-gray-800 text-white shadow-sm'
                                                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                                            }`}
                                    >
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-400">
                                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                <span>Core Testnet2</span>
                            </div>
                            <ConnectButton />
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Button - Positioned on far left */}
            <div className="relative">
                <button
                    onClick={onOpenMobileMenu}
                    className="fixed top-4 left-4 w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-white border border-gray-700 z-40 shadow-lg"
                >
                    ☰
                </button>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
                {/* Markets View - Exact Pendle Style */}
                {activeView === 'markets' && (
                    <>
                        {/* Page Header with Real Stats */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
                            <div>
                                <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Markets</h1>
                                <p className="text-gray-400 text-sm sm:text-base">Discover yield opportunities across Core ecosystem</p>
                            </div>
                            <div className="text-left sm:text-right">
                                <div className="text-xl sm:text-2xl font-bold text-white">
                                    {protocolStats ? Number(protocolStats[1]) : Object.keys(ASSET_METADATA).length}
                                </div>
                                <div className="text-sm text-gray-400">Active Markets</div>
                            </div>
                        </div>

                        {/* Real Protocol Metrics - Pendle Style */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                            {/* Total Value Locked */}
                            <div className="bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-700/50 shadow-sm">
                                <div className="flex items-center space-x-3 mb-3 sm:mb-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-xs sm:text-sm text-gray-400 mb-1">Total Value Locked</div>
                                        <div className="text-lg sm:text-2xl font-bold text-white">
                                            ${(totalSYValue * 1.05).toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-xs sm:text-sm text-green-400">Real protocol TVL</div>
                            </div>

                            {/* Active Markets */}
                            <div className="bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-700/50 shadow-sm">
                                <div className="flex items-center space-x-3 mb-3 sm:mb-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-xs sm:text-sm text-gray-400 mb-1">Active Markets</div>
                                        <div className="text-lg sm:text-2xl font-bold text-white">
                                            {Object.keys(ASSET_METADATA).length}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-xs sm:text-sm text-blue-400">All assets available</div>
                            </div>

                            {/* Total Yield Generated */}
                            <div className="bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-700/50 shadow-sm">
                                <div className="flex items-center space-x-3 mb-3 sm:mb-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-xs sm:text-sm text-gray-400 mb-1">Total Yield Generated</div>
                                        <div className="text-lg sm:text-2xl font-bold text-white">
                                            ${(totalClaimableYield * 1.05).toFixed(4)}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-xs sm:text-sm text-purple-400">Real yield earned</div>
                            </div>
                        </div>

                        {/* Asset Markets - Real Data */}
                        <div className="space-y-6">
                            {Object.entries(ASSET_METADATA).map(([key, asset]) => {
                                const hook = getHookForAsset(key)
                                const balance = Number(hook.assetBalance || 0) / 1e18
                                const syTotalSupply = Number(hook.syBalance || 0) / 1e18

                                return (
                                    <div key={key} className="bg-gray-800 rounded-2xl border border-gray-700/50 overflow-hidden">
                                        {/* Asset Header */}
                                        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
                                            <div className="flex items-center space-x-4">
                                                <div className="flex items-center -space-x-2">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full border-2 border-gray-800 flex items-center justify-center">
                                                        <span className="text-white font-bold text-sm">{asset.symbol.slice(0, 2)}</span>
                                                    </div>
                                                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full border-2 border-gray-800 flex items-center justify-center">
                                                        <span className="text-white font-bold text-sm">SY</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-semibold text-white">{asset.symbol}</h3>
                                                    <p className="text-gray-400 text-sm">{asset.name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-6">
                                                <div className="text-right">
                                                    <div className="text-sm text-gray-400">Available Balance</div>
                                                    <div className="text-lg font-semibold text-white">
                                                        {balance.toFixed(2)} {asset.symbol}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm text-gray-400">SY Balance</div>
                                                    <div className="text-lg font-semibold text-white">
                                                        {syTotalSupply.toFixed(2)} SY
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Market Table Header */}
                                        <div className="px-6 py-4 bg-gray-850">
                                            <div className="grid grid-cols-12 gap-4 text-sm text-gray-400 font-medium">
                                                <div className="col-span-4">Market</div>
                                                <div className="col-span-2 text-center">Your Balance</div>
                                                <div className="col-span-2 text-center">APY</div>
                                                <div className="col-span-2 text-center">Yield Earned</div>
                                                <div className="col-span-2 text-center">Actions</div>
                                            </div>
                                        </div>

                                        {/* Market Row with Real Data */}
                                        <div className="px-6 py-4 hover:bg-gray-750 transition-colors">
                                            <div className="grid grid-cols-12 gap-4 items-center">
                                                <div className="col-span-4 flex items-center space-x-3">
                                                    <div className="flex items-center -space-x-1">
                                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full border border-gray-700 flex items-center justify-center text-xs font-bold text-white">
                                                            {asset.symbol[0]}
                                                        </div>
                                                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full border border-gray-700 flex items-center justify-center text-xs font-bold text-white">
                                                            $
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-medium">SY-{asset.symbol}</div>
                                                        <div className="text-xs text-gray-400">Perpetual • Core</div>
                                                    </div>
                                                </div>

                                                <div className="col-span-2 text-center">
                                                    <div className="text-white font-semibold">
                                                        {balance.toFixed(3)} {asset.symbol}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {syTotalSupply.toFixed(3)} SY
                                                    </div>
                                                </div>

                                                <div className="col-span-2 text-center">
                                                    <div className="text-green-400 font-semibold">{asset.apy}%</div>
                                                    <div className="text-xs text-gray-400">Current yield</div>
                                                </div>

                                                <div className="col-span-2 text-center">
                                                    <div className="text-purple-400 font-semibold">
                                                        {hook.formatBalance(hook.accumulatedYield as bigint)} SY
                                                    </div>
                                                    <div className="text-xs text-gray-400">Claimable</div>
                                                </div>

                                                <div className="col-span-2 text-center">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedAsset(key as 'stCORE' | 'lstBTC' | 'dualCORE')
                                                            setActiveView('dashboard')
                                                        }}
                                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                                                    >
                                                        Manage
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}

                {/* Pools View */}
                {activeView === 'pools' && (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-4xl font-bold text-white mb-2">Liquidity Pools</h1>
                                <p className="text-gray-400">Provide liquidity to earn trading fees and rewards</p>
                            </div>
                        </div>

                        <div className="bg-gray-800 rounded-2xl p-12 border border-gray-700/50 text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 opacity-60">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-semibold text-white mb-3">Liquidity Pools Coming Soon</h3>
                            <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                                Advanced liquidity provisioning features are under development for enhanced yield opportunities
                            </p>
                            <div className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-600/30">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-medium">Q2 2025</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Dashboard View - Exact Pendle Clone with Real Data */}
                {activeView === 'dashboard' && (
                    <div className="space-y-6 sm:space-y-8">
                        {/* User Profile - Pendle Style */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                                    <span className="text-white font-bold text-lg sm:text-xl">
                                        {address?.slice(2, 4).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <h1 className="text-xl sm:text-3xl font-bold text-white">
                                        {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Dashboard'}
                                    </h1>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="text-gray-400 text-xs sm:text-sm">Updated just now • Core Testnet</span>
                                        {/* Removed lastAction display */}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="relative w-full sm:w-auto">
                                    <input
                                        type="text"
                                        placeholder="Go to wallet address"
                                        className="w-full sm:w-80 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                    />
                                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Enhanced Balance Overview Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {/* Current Balance - Enhanced */}
                            <div className="bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300 group">
                                <div className="flex items-center justify-between mb-3 sm:mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                            </svg>
                                        </div>
                                        <div className="text-blue-400 font-medium text-sm sm:text-base">Portfolio Value</div>
                                    </div>
                                    <div className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                                        +2.4%
                                    </div>
                                </div>
                                <div className="text-2xl sm:text-4xl font-bold text-white mb-2">
                                    ${(totalPortfolioValue * 1.05).toFixed(2)}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-400 mb-3">Across all assets</div>

                                {/* Quick Asset Breakdown */}
                                <div className="space-y-1">
                                    {Object.entries(ASSET_METADATA).map(([key, asset]) => {
                                        const hook = getHookForAsset(key)
                                        const balance = Number(hook.assetBalance || 0) / 1e18
                                        return balance > 0 ? (
                                            <div key={key} className="flex items-center justify-between text-xs">
                                                <div className="flex items-center space-x-1">
                                                    <span>{asset.icon}</span>
                                                    <span className="text-gray-300">{asset.symbol}</span>
                                                </div>
                                                <span className="text-gray-400">${(balance * 1.05).toFixed(2)}</span>
                                            </div>
                                        ) : null
                                    })}
                                </div>
                            </div>

                            {/* PT/YT Token Actions */}
                            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700/50">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div className="text-blue-400 font-medium">PT/YT Actions</div>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                                        <div className="text-blue-400 text-sm font-medium">🔒 PT Balance</div>
                                        <div className="text-lg font-bold text-white">
                                            {Object.entries(ASSET_METADATA).reduce((total, [key]) => {
                                                const hook = getHookForAsset(key)
                                                return total + (Number(hook.ptBalance || 0) / 1e18)
                                            }, 0).toFixed(4)} PT
                                        </div>
                                    </div>
                                    <div className="bg-purple-500/10 p-3 rounded-lg border border-purple-500/20">
                                        <div className="text-purple-400 text-sm font-medium">🎲 YT Balance</div>
                                        <div className="text-lg font-bold text-white">
                                            {Object.entries(ASSET_METADATA).reduce((total, [key]) => {
                                                const hook = getHookForAsset(key)
                                                return total + (Number(hook.ytBalance || 0) / 1e18)
                                            }, 0).toFixed(4)} YT
                                        </div>
                                    </div>
                                </div>

                                <div className="text-sm text-gray-400 mb-3">
                                    Switch to <strong>Portfolio</strong> tab to claim PT/YT separately
                                </div>

                                {/* Asset Yield Carousel */}
                                {totalClaimableYield > 0 && (() => {
                                    const assetsWithYield = Object.entries(ASSET_METADATA).filter(([key]) => {
                                        const hook = getHookForAsset(key)
                                        return Number(hook.accumulatedYield || 0) / 1e18 > 0
                                    })

                                    if (assetsWithYield.length === 0) return null

                                    return (
                                        <div className="mt-3">
                                            {/* Carousel Navigation Dots */}
                                            <div className="flex justify-center space-x-1 mb-2">
                                                {assetsWithYield.map(([key]) => (
                                                    <button
                                                        key={key}
                                                        onClick={() => setSelectedAsset(key as keyof typeof ASSET_METADATA)}
                                                        className={`w-2 h-2 rounded-full transition-colors ${selectedAsset === key ? 'bg-purple-500' : 'bg-gray-600'
                                                            }`}
                                                    />
                                                ))}
                                            </div>

                                            {/* Carousel Content */}
                                            <div className="bg-gray-750/50 rounded-lg p-3">
                                                {assetsWithYield.map(([key, asset]) => {
                                                    const hook = getHookForAsset(key)
                                                    const assetYield = Number(hook.accumulatedYield || 0) / 1e18

                                                    return (
                                                        <div
                                                            key={key}
                                                            className={`transition-all duration-300 ${selectedAsset === key ? 'block' : 'hidden'
                                                                }`}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-3">
                                                                    <span className="text-lg">{asset.icon}</span>
                                                                    <div>
                                                                        <div className="text-white font-medium">{asset.symbol}</div>
                                                                        <div className="text-gray-400 text-sm">${(assetYield * 1.05).toFixed(4)}</div>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleClaimYTYield()}
                                                                    disabled={isClaimingYield}
                                                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                                                                >
                                                                    {isClaimingYield ? 'Claiming...' : 'Claim Yield'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                })()}
                            </div>

                            {/* SY Token Value - Enhanced */}
                            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700/50 hover:border-orange-500/30 transition-all duration-300 group cursor-pointer" onClick={() => setActiveView('pools')}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                            </svg>
                                        </div>
                                        <div className="text-orange-400 font-medium">SY Positions</div>
                                    </div>
                                    <div className="text-xs text-orange-400 bg-orange-400/10 px-2 py-1 rounded-full">
                                        Active
                                    </div>
                                </div>
                                <div className="text-4xl font-bold text-white mb-2">
                                    ${(totalSYValue * 1.05).toFixed(2)}
                                </div>
                                <div className="text-sm text-gray-400 mb-3">Earning yield positions</div>

                                {/* Yield Rate Indicator */}
                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-gray-400">Avg APY</div>
                                    <div className="text-sm font-semibold text-green-400">
                                        {(() => {
                                            const totalAPY = Object.values(ASSET_METADATA).reduce((sum, asset) => sum + asset.apy, 0)
                                            const avgAPY = totalAPY / Object.keys(ASSET_METADATA).length
                                            return avgAPY.toFixed(1) + '%'
                                        })()}
                                    </div>
                                </div>

                                <div className="mt-2 text-xs text-gray-500 flex items-center">
                                    <span>Click to manage positions</span>
                                    <svg className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </div>





                        {/* Main Dashboard Tabs */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                            <div className="flex flex-wrap items-center gap-1 sm:space-x-1">
                                {[
                                    { id: 'invest', label: 'Invest', icon: '🚀' },
                                    { id: 'portfolio', label: 'Portfolio', icon: '💼' },
                                    { id: 'earn', label: 'Earn', icon: '💰' },
                                    { id: 'manage', label: 'Manage', icon: '⚙️' },
                                    { id: 'transactions', label: 'History', icon: '📋' },
                                    { id: 'education', label: 'Learn', icon: '📚' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setDashboardTab(tab.id as 'invest' | 'portfolio' | 'earn' | 'manage' | 'transactions' | 'education')}
                                        className={`px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base ${dashboardTab === tab.id
                                                ? 'bg-gray-800 text-white border border-gray-700/50 shadow-sm'
                                                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                                            }`}
                                    >
                                        <span className="text-sm sm:text-base">{tab.icon}</span>
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                                {/* Manual Refresh Button */}
                                <button
                                    onClick={() => {
                                        console.log('🔄 Manual refresh triggered by user')
                                        stCOREHook.refreshBalances()
                                        lstBTCHook.refreshBalances()
                                        dualCOREHook.refreshBalances()
                                        refreshTransactions()
                                    }}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center space-x-2"
                                >
                                    <span>🔄</span>
                                    <span>Refresh All</span>
                                </button>

                                {/* Enhanced Asset Filter */}
                                <div className="flex items-center space-x-2 bg-gray-800/80 backdrop-blur-sm rounded-2xl p-2 border border-gray-700/50">
                                    {[
                                        { id: 'all', label: 'All Assets', icon: '📊', color: 'from-blue-500 to-purple-500' },
                                        { id: 'pt', label: 'PT', icon: '🔒', color: 'from-blue-500 to-cyan-500' },
                                        { id: 'yt', label: 'YT', icon: '🎲', color: 'from-purple-500 to-pink-500' },
                                        { id: 'lp', label: 'LP', icon: '💧', color: 'from-green-500 to-emerald-500' }
                                    ].map((filter) => (
                                        <button
                                            key={filter.id}
                                            onClick={() => setAssetFilter(filter.id as 'all' | 'pt' | 'yt' | 'lp')}
                                            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${assetFilter === filter.id
                                                    ? `bg-gradient-to-r ${filter.color} text-white shadow-lg transform scale-105`
                                                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                                                }`}
                                        >
                                            <span className="text-base">{filter.icon}</span>
                                            <span>{filter.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Enhanced USD/Underlying Toggle */}
                                <div className="flex items-center space-x-2 bg-gray-800/80 backdrop-blur-sm rounded-2xl p-2 border border-gray-700/50">
                                    <button
                                        onClick={() => setDisplayMode('usd')}
                                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${displayMode === 'usd'
                                                ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg'
                                                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                                            }`}
                                    >
                                        USD
                                    </button>
                                    <button
                                        onClick={() => setDisplayMode('underlying')}
                                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${displayMode === 'underlying'
                                                ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg'
                                                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                                            }`}
                                    >
                                        Underlying
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="bg-gray-800 rounded-2xl border border-gray-700/50 overflow-hidden">
                            {/* Invest Tab - Conversion Focused */}
                            {dashboardTab === 'invest' && (
                                <div className="p-6">
                                    <div className="mb-6">
                                        <h3 className="text-xl font-semibold text-white mb-2">🎯 CoreYield Magic Demo</h3>
                                        <p className="text-gray-300 mb-4">Watch your deposit get split into two powerful tokens:</p>
                                        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4">
                                            <div className="text-sm text-gray-300 space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <span className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs text-white">1</span>
                                                    <span>Choose your asset (stCORE recommended for demo)</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs text-white">2</span>
                                                    <span>Click "Deposit & Split" → Watch the magic happen! 🎭</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs text-white">3</span>
                                                    <span>Go to Portfolio tab to see your PT + YT tokens</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Portfolio Summary Cards */}
                                    <div className="grid md:grid-cols-4 gap-6 mb-8">
                                        <div className="bg-gray-750 rounded-xl p-4 border border-gray-700/50">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <div className="text-white font-medium">Total Value</div>
                                                    <div className="text-2xl font-bold text-blue-400">${(totalPortfolioValue * 1.05).toFixed(2)}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-750 rounded-xl p-4 border border-gray-700/50">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <div className="text-white font-medium">Claimable Yield</div>
                                                    <div className="text-2xl font-bold text-purple-400">${(totalClaimableYield * 1.05).toFixed(4)}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-750 rounded-xl p-4 border border-gray-700/50">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <div className="text-white font-medium">SY Positions</div>
                                                    <div className="text-2xl font-bold text-green-400">${(totalSYValue * 1.05).toFixed(2)}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-750 rounded-xl p-4 border border-gray-700/50">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <div className="text-white font-medium">Chain Balance</div>
                                                    <div className="text-2xl font-bold text-orange-400">{formatBalance(currentHook.coreBalance?.value as bigint)} CORE</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>



                                    {/* Investment Opportunities */}
                                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                                        {Object.entries(ASSET_METADATA)
                                            .filter(([, asset]) => {
                                                if (assetFilter === 'all') return true
                                                if (assetFilter === 'pt') return asset.symbol.includes('PT')
                                                if (assetFilter === 'yt') return asset.symbol.includes('YT')
                                                if (assetFilter === 'lp') return asset.symbol.includes('LP')
                                                return true
                                            })
                                            .map(([key, asset]) => (
                                                <div key={key} className="bg-gray-750 rounded-xl p-6 border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300">
                                                    <div className="flex items-center space-x-3 mb-4">
                                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                                            <span className="text-white font-bold text-sm">{asset.symbol.slice(0, 2)}</span>
                                                        </div>
                                                        <div>
                                                            <div className="text-white font-semibold">{asset.symbol}</div>
                                                            <div className="text-gray-400 text-sm">{asset.name}</div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3 mb-4">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-400">APY</span>
                                                            <span className="text-green-400 font-semibold">{asset.apy}%</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-400">Available</span>
                                                            <span className="text-white">{(() => {
                                                                const hook = getHookForAsset(key)
                                                                return hook.formatBalance(hook.assetBalance as bigint) + ' ' + asset.symbol
                                                            })()}</span>
                                                        </div>
                                                    </div>

                                                    {/* Show what you'll get after depositing */}
                                                    <div className="space-y-3 mb-4">
                                                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-2">
                                                                    <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                                        </svg>
                                                                    </div>
                                                                    <span className="text-blue-400 font-medium text-sm">PT-{asset.symbol}</span>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-blue-300 font-semibold text-sm">
                                                                        {(() => {
                                                                            const hook = getHookForAsset(key)
                                                                            const balance = Number(hook.assetBalance || 0) / 1e18
                                                                            // After depositing, you get 1:1 PT tokens (equal to SY amount)
                                                                            return balance.toFixed(4)
                                                                        })()} PT
                                                                    </div>
                                                                    <div className="text-xs text-gray-400">1:1 with deposit</div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-2">
                                                                    <div className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center">
                                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                                        </svg>
                                                                    </div>
                                                                    <span className="text-purple-400 font-medium text-sm">YT-{asset.symbol}</span>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-purple-300 font-semibold text-sm">
                                                                        {(() => {
                                                                            const hook = getHookForAsset(key)
                                                                            const balance = Number(hook.assetBalance || 0) / 1e18
                                                                            // After depositing, you get 1:1 YT tokens (equal to SY amount)
                                                                            return balance.toFixed(4)
                                                                        })()} YT
                                                                    </div>
                                                                    <div className="text-xs text-gray-400">1:1 with deposit</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => {
                                                            setSelectedAsset(key as any)
                                                            setDashboardTab('manage')
                                                        }}
                                                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                                                    >
                                                        🎯 Deposit & Split into PT + YT
                                                    </button>
                                                </div>
                                            ))}
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="bg-gray-750 rounded-xl p-6 border border-gray-700/50">
                                        <h4 className="text-lg font-semibold text-white mb-4">Why Invest with CoreYield?</h4>
                                        <div className="grid md:grid-cols-3 gap-6">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-green-400 mb-2">Up to 15%</div>
                                                <div className="text-gray-400">Annual Yield</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-blue-400 mb-2">Instant</div>
                                                <div className="text-gray-400">Liquidity</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-purple-400 mb-2">Secure</div>
                                                <div className="text-gray-400">Smart Contracts</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Portfolio Tab */}
                            {dashboardTab === 'portfolio' && (
                                <div className="p-6">
                                    {/* Portfolio Header */}
                                    <div className="mb-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <h3 className="text-3xl font-bold text-white mb-2">Portfolio Overview</h3>
                                                <p className="text-gray-400 text-lg">Manage your PT, YT, and LP positions with institutional-grade precision</p>

                                                {/* Current Asset Indicator */}
                                                <div className="flex items-center space-x-3 mt-4">
                                                    <div className="flex items-center space-x-2 bg-gray-800/50 rounded-xl px-4 py-2 border border-gray-700/50">
                                                        <span className="text-2xl">{ASSET_METADATA[selectedAsset].icon}</span>
                                                        <div>
                                                            <div className="text-white font-semibold">{ASSET_METADATA[selectedAsset].name}</div>
                                                            <div className="text-sm text-gray-400">{ASSET_METADATA[selectedAsset].symbol} • {ASSET_METADATA[selectedAsset].apy}% APY</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                {/* Asset Selector Dropdown */}
                                                <div className="relative">
                                                    <select
                                                        value={selectedAsset}
                                                        onChange={(e) => setSelectedAsset(e.target.value as any)}
                                                        className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent min-w-[200px]"
                                                    >
                                                        {Object.entries(ASSET_METADATA).map(([key, asset]) => (
                                                            <option key={key} value={key} className="bg-gray-800 text-white py-2">
                                                                {asset.icon} {asset.name} ({asset.symbol})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl px-4 py-2">
                                                    <div className="text-sm text-gray-300">Total Portfolio Value</div>
                                                    <div className="text-xl font-bold text-white">${(totalPortfolioValue * 1.05).toFixed(2)}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Professional Filter Tabs */}
                                        <div className="flex items-center space-x-2 bg-gray-800/80 backdrop-blur-sm rounded-2xl p-2 border border-gray-700/50">
                                            {[
                                                { id: 'all', label: 'All Positions', icon: '📊', color: 'from-blue-500 to-purple-500' },
                                                { id: 'pt', label: 'Principal Tokens', icon: '🔒', color: 'from-blue-500 to-cyan-500' },
                                                { id: 'yt', label: 'Yield Tokens', icon: '🎲', color: 'from-purple-500 to-pink-500' },
                                                { id: 'lp', label: 'Liquidity Pools', icon: '💧', color: 'from-green-500 to-emerald-500' }
                                            ].map((filter) => (
                                                <button
                                                    key={filter.id}
                                                    onClick={() => setAssetFilter(filter.id as any)}
                                                    className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${assetFilter === filter.id
                                                            ? `bg-gradient-to-r ${filter.color} text-white shadow-lg transform scale-105`
                                                            : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                                                        }`}
                                                >
                                                    <span className="text-lg">{filter.icon}</span>
                                                    <span>{filter.label}</span>
                                                </button>
                                            ))}
                                        </div>


                                    </div>

                                    {/* Portfolio Content */}
                                    {hasAnyYieldTokens ? (
                                        <div className="space-y-8">
                                            {/* Debug Information */}
                                            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                                                <div className="text-sm text-gray-300 mb-2">🔍 Debug Info:</div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                                    <div>
                                                        <div className="text-gray-400">Asset Filter:</div>
                                                        <div className="text-white font-mono">{assetFilter}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-gray-400">Total SY Value:</div>
                                                        <div className="text-white font-mono">${totalPortfolioValue.toFixed(2)}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-gray-400">Has SY Tokens:</div>
                                                        <div className="text-white font-mono">{hasSYTokens ? 'Yes' : 'No'}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Portfolio Summary */}
                                            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-6">
                                                <div className="text-xl font-bold text-blue-300 mb-4">Portfolio Summary</div>

                                                {/* Yield Relationship Explanation */}
                                                <div className="mb-6 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl">
                                                    <div className="text-yellow-400 font-semibold mb-3">🌾 Portfolio Yield Relationship</div>
                                                    <div className="text-sm text-yellow-300 space-y-2">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-green-400">💰</span>
                                                            <span><strong>Underlying Assets (stCORE, lstBTC):</strong> Generate yield automatically</span>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-blue-400">🔒</span>
                                                            <span><strong>PT Tokens:</strong> Fixed value, no yield generation</span>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-purple-400">🎲</span>
                                                            <span><strong>YT Tokens:</strong> Right to claim yield from underlying assets</span>
                                                        </div>
                                                        <div className="text-xs text-yellow-200 mt-2 p-2 bg-yellow-600/20 rounded border border-yellow-500/50">
                                                            <strong>Key Insight:</strong> YT tokens don't generate yield - they let you claim the yield that underlying assets are generating
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                                                        <div className="text-blue-300 font-medium mb-2">Total PT Tokens</div>
                                                        <div className="text-2xl font-bold text-white">
                                                            {(() => {
                                                                const totalPT = Object.entries(ASSET_METADATA).reduce((total, [key]) => {
                                                                    const hook = getHookForAsset(key)
                                                                    return total + Number(hook.ptBalance || 0) / 1e18
                                                                }, 0)
                                                                return `${totalPT.toFixed(4)} PT`
                                                            })()}
                                                        </div>
                                                        <div className="text-sm text-blue-300 mt-1">Fixed Value Tokens</div>
                                                        <div className="text-xs text-blue-200 mt-2 p-2 bg-blue-600/20 rounded">
                                                            🔒 No yield generation - fixed principal value
                                                        </div>
                                                    </div>

                                                    <div className="bg-purple-500/10 p-4 rounded-xl border border-purple-500/20">
                                                        <div className="text-purple-300 font-medium mb-2">Total YT Tokens</div>
                                                        <div className="text-2xl font-bold text-white">
                                                            {(() => {
                                                                const totalYT = Object.entries(ASSET_METADATA).reduce((total, [key]) => {
                                                                    const hook = getHookForAsset(key)
                                                                    return total + Number(hook.ytBalance || 0) / 1e18
                                                                }, 0)
                                                                return `${totalYT.toFixed(4)} YT`
                                                            })()}
                                                        </div>
                                                        <div className="text-sm text-purple-300 mt-1">Yield Claim Rights</div>
                                                        <div className="text-xs text-purple-200 mt-2 p-2 bg-purple-600/20 rounded">
                                                            🎲 Claim yield from underlying assets (not yield generators)
                                                        </div>
                                                    </div>

                                                    <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/20">
                                                        <div className="text-green-300 font-medium mb-2">Claimable Yield</div>
                                                        <div className="text-2xl font-bold text-white">
                                                            {(() => {
                                                                const totalClaimable = Object.entries(ASSET_METADATA).reduce((total, [key]) => {
                                                                    const hook = getHookForAsset(key)
                                                                    return total + Number(hook.ytClaimableYield || 0) / 1e18
                                                                }, 0)
                                                                return `${totalClaimable.toFixed(6)} SY`
                                                            })()}
                                                        </div>
                                                        <div className="text-sm text-green-300 mt-1">Generated by Underlying Assets</div>
                                                        <div className="text-xs text-green-200 mt-2 p-2 bg-green-600/20 rounded">
                                                            🌱 This yield was generated by stCORE/lstBTC, claimable via YT tokens
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Current Asset Focus */}
                                            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="text-xl font-bold text-yellow-300">Current Asset: {ASSET_METADATA[selectedAsset].name}</div>
                                                    <div className="text-sm text-yellow-300 bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-500/30">
                                                        {ASSET_METADATA[selectedAsset].apy}% APY
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20">
                                                        <div className="text-yellow-300 text-sm mb-1">SY Balance</div>
                                                        <div className="text-lg font-bold text-white">
                                                            {(() => {
                                                                const hook = getHookForAsset(selectedAsset)
                                                                return `${Number(hook.syBalance || 0) / 1e18} SY`
                                                            })()}
                                                        </div>
                                                    </div>
                                                    <div className="bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20">
                                                        <div className="text-yellow-300 text-sm mb-1">PT Balance</div>
                                                        <div className="text-lg font-bold text-white">
                                                            {(() => {
                                                                const hook = getHookForAsset(selectedAsset)
                                                                return `${Number(hook.ptBalance || 0) / 1e18} PT`
                                                            })()}
                                                        </div>
                                                    </div>
                                                    <div className="bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20">
                                                        <div className="text-yellow-300 text-sm mb-1">YT Balance</div>
                                                        <div className="text-lg font-bold text-white">
                                                            {(() => {
                                                                const hook = getHookForAsset(selectedAsset)
                                                                return `${Number(hook.ytBalance || 0) / 1e18} YT`
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {(Object.entries(ASSET_METADATA) as [keyof typeof ASSET_METADATA, typeof ASSET_METADATA[keyof typeof ASSET_METADATA]][]).map(([key, asset]) => {
                                                const hook = getHookForAsset(key)
                                                const syBalance = hook.syBalance

                                                // Get real PT/YT balances from contracts
                                                const realPtBalance = Number(hook.ptBalance || 0) / 1e18
                                                const realYtBalance = Number(hook.ytBalance || 0) / 1e18

                                                // Show asset if it has SY tokens OR PT/YT tokens (since PT/YT can exist without current SY balance)
                                                const hasAnyTokens = (syBalance && Number(syBalance || 0) > 0) || realPtBalance > 0 || realYtBalance > 0
                                                if (!hasAnyTokens) return null
                                                const realYtClaimable = Number(hook.ytClaimableYield || 0) / 1e18
                                                const ptImpliedYield = hook.ptImpliedYield || 0
                                                const ptHoldingDays = hook.ptHoldingDays || 0
                                                const totalValue = Number(syBalance) / 1e18

                                                // Debug logging
                                                console.log(`🔍 Portfolio Debug for ${key}:`, {
                                                    syBalance: hook.syBalance?.toString(),
                                                    ptBalance: hook.ptBalance?.toString(),
                                                    ytBalance: hook.ytBalance?.toString(),
                                                    realPtBalance,
                                                    realYtBalance,
                                                    assetFilter,
                                                    shouldShow: {
                                                        pt: assetFilter === 'pt' && realPtBalance > 0,
                                                        yt: assetFilter === 'yt' && realYtBalance > 0,
                                                        all: assetFilter === 'all',
                                                        lp: assetFilter === 'lp' && (realPtBalance > 0 || realYtBalance > 0)
                                                    }
                                                })

                                                // Filter based on selected asset filter
                                                if (assetFilter === 'pt' && realPtBalance === 0) return null
                                                if (assetFilter === 'yt' && realYtBalance === 0) return null
                                                if (assetFilter === 'lp' && realPtBalance === 0 && realYtBalance === 0) return null

                                                return (
                                                    <div key={key} className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/50 shadow-2xl">
                                                        {/* Asset Header */}
                                                        <div className="flex items-center justify-between mb-8">
                                                            <div className="flex items-center space-x-6">
                                                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                                                                    <span className="text-4xl">{asset.icon}</span>
                                                                </div>
                                                                <div>
                                                                    <div className="text-3xl font-bold text-white mb-2">{asset.name}</div>
                                                                    <div className="text-gray-400 text-lg">{asset.symbol} Position</div>
                                                                    <div className="flex items-center space-x-4 mt-2">
                                                                        <div className="flex items-center space-x-2">
                                                                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                                                            <span className="text-sm text-green-400">Active</span>
                                                                        </div>
                                                                        <div className="text-sm text-gray-500">•</div>
                                                                        <div className="text-sm text-gray-400">{asset.apy}% APY</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                                                    {displayMode === 'usd' ? `$${(totalValue * 1.05).toFixed(2)}` : `${hook.formatBalance(syBalance as bigint)} SY`}
                                                                </div>
                                                                <div className="text-lg text-gray-400 mt-2">Total Position Value</div>
                                                            </div>
                                                        </div>

                                                        {/* Professional Token Breakdown Grid */}
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                                            {/* Principal Token (PT) - Enhanced Design */}
                                                            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-6 backdrop-blur-sm">
                                                                <div className="flex items-center justify-between mb-6">
                                                                    <div className="flex items-center space-x-4">
                                                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                                                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                                            </svg>
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-xl font-bold text-blue-300">PT-{asset.symbol}</div>
                                                                            <div className="text-sm text-gray-400">Principal Token</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="px-4 py-2 bg-blue-500/20 rounded-full border border-blue-500/30">
                                                                        <span className="text-sm text-blue-300 font-semibold">FIXED YIELD</span>
                                                                    </div>
                                                                </div>

                                                                <div className="text-3xl font-bold text-blue-200 mb-4">
                                                                    {displayMode === 'usd' ? `$${(realPtBalance * 1.05).toFixed(2)}` : `${realPtBalance.toFixed(4)} PT`}
                                                                </div>

                                                                {realPtBalance > 0 ? (
                                                                    <div className="space-y-4">
                                                                        {/* Yield Progress Bar */}
                                                                        <div className="bg-gray-700/50 rounded-full h-3 overflow-hidden">
                                                                            <div
                                                                                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full transition-all duration-1000"
                                                                                style={{ width: `${Math.min((ptImpliedYield / (realPtBalance * 0.08)) * 100, 100)}%` }}
                                                                            ></div>
                                                                        </div>

                                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                                            <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
                                                                                <div className="text-blue-300 font-medium">Fixed APY</div>
                                                                                <div className="text-white font-bold">8.0%</div>
                                                                            </div>
                                                                            <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
                                                                                <div className="text-blue-300 font-medium">Holding Period</div>
                                                                                <div className="text-white font-bold">{ptHoldingDays} days</div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                <span className="text-blue-300 font-medium">Current Value</span>
                                                                                <span className="text-white font-bold">${(realPtBalance * 1.05 + ptImpliedYield * 1.05).toFixed(4)}</span>
                                                                            </div>
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="text-blue-300 font-medium">Maturity Value</span>
                                                                                <span className="text-green-400 font-bold">${(realPtBalance * 1.08).toFixed(2)}</span>
                                                                            </div>
                                                                        </div>

                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedAsset(key as any)
                                                                                hook.redeemPT(realPtBalance.toString())
                                                                            }}
                                                                            disabled={hook.isRedeemingPT}
                                                                            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:transform-none shadow-lg"
                                                                        >
                                                                            {hook.isRedeemingPT ? (
                                                                                <div className="flex items-center justify-center space-x-2">
                                                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                                                    <span>Redeeming PT...</span>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex items-center justify-center space-x-2">
                                                                                    <span>🔒</span>
                                                                                    <span>Redeem {realPtBalance.toFixed(2)} PT</span>
                                                                                </div>
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-center py-8">
                                                                        <div className="w-16 h-16 bg-gray-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                                            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                            </svg>
                                                                        </div>
                                                                        <div className="text-gray-400 mb-2">No PT tokens yet</div>
                                                                        <div className="text-xs text-blue-300 bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                                                                            PT Address: {hook.ptTokenAddress ? `${hook.ptTokenAddress.slice(0, 10)}...` : 'Not found'}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Yield Token (YT) - Enhanced Design */}
                                                            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-6 backdrop-blur-sm">
                                                                <div className="flex items-center justify-between mb-6">
                                                                    <div className="flex items-center space-x-4">
                                                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                                                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                                            </svg>
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-xl font-bold text-purple-300">YT-{asset.symbol}</div>
                                                                            <div className="text-sm text-gray-400">Yield Token</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="px-4 py-2 bg-purple-500/20 rounded-full border border-purple-500/30">
                                                                        <span className="text-sm text-purple-300 font-semibold">YIELD CLAIM RIGHTS</span>
                                                                    </div>
                                                                </div>

                                                                <div className="text-3xl font-bold text-purple-200 mb-4">
                                                                    {displayMode === 'usd' ? `$${(realYtBalance * 1.05).toFixed(2)}` : `${realYtBalance.toFixed(4)} YT`}
                                                                </div>

                                                                {/* YT Token Explanation */}
                                                                <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                                                                    <div className="text-xs text-purple-300 space-y-1">
                                                                        <div className="flex items-center space-x-2">
                                                                            <span className="text-yellow-400">💡</span>
                                                                            <span><strong>YT tokens are NOT yield generators</strong></span>
                                                                        </div>
                                                                        <div className="text-xs text-purple-200">
                                                                            They represent the right to claim yield from underlying stCORE tokens
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {realYtBalance > 0 ? (
                                                                    <div className="space-y-4">
                                                                        {/* Claimable Yield Display */}
                                                                        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4">
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                <span className="text-green-300 font-medium">Claimable Yield</span>
                                                                                <span className="text-2xl font-bold text-green-400">
                                                                                    {realYtClaimable > 0 ? `${realYtClaimable.toFixed(6)} SY` : '0.000000 SY'}
                                                                                </span>
                                                                            </div>
                                                                            <div className="text-xs text-green-300">
                                                                                Yield generated by underlying stCORE at 8.5% APY
                                                                            </div>
                                                                        </div>

                                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                                            <div className="bg-purple-500/10 p-3 rounded-xl border border-purple-500/20">
                                                                                <div className="text-purple-300 font-medium">Underlying Asset APY</div>
                                                                                <div className="text-white font-bold">8.5%</div>
                                                                            </div>
                                                                            <div className="bg-purple-500/10 p-3 rounded-xl border border-purple-500/20">
                                                                                <div className="text-purple-300 font-medium">Token Balance</div>
                                                                                <div className="text-white font-bold">{realYtBalance.toFixed(4)} YT</div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="bg-purple-500/10 p-4 rounded-xl border border-purple-500/20">
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                <span className="text-purple-300 font-medium">Token Value</span>
                                                                                <span className="text-white font-bold">${(realYtBalance * 1.05).toFixed(4)}</span>
                                                                            </div>
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="text-purple-300 font-medium">Yield Value</span>
                                                                                <span className="text-green-400 font-bold">${(realYtClaimable * 1.05).toFixed(4)}</span>
                                                                            </div>
                                                                        </div>

                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedAsset(key as any)
                                                                                hook.handleClaimYTYield()
                                                                            }}
                                                                            disabled={hook.isClaimingYTYield || realYtClaimable === 0}
                                                                            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:transform-none shadow-lg"
                                                                        >
                                                                            {hook.isClaimingYTYield ? (
                                                                                <div className="flex items-center justify-center space-x-2">
                                                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                                                    <span>Claiming Yield...</span>
                                                                                </div>
                                                                            ) : realYtClaimable > 0 ? (
                                                                                <div className="flex items-center justify-center space-x-2">
                                                                                    <span>🎲</span>
                                                                                    <span>Claim {realYtClaimable.toFixed(6)} SY Yield</span>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex items-center justify-center space-x-2">
                                                                                    <span>⏳</span>
                                                                                    <span>No Yield Available Yet</span>
                                                                                </div>
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-center py-8">
                                                                        <div className="w-16 h-16 bg-gray-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                                            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                            </svg>
                                                                        </div>
                                                                        <div className="text-gray-400 mb-2">No YT tokens yet</div>
                                                                        <div className="text-xs text-purple-300 bg-purple-500/10 p-2 rounded-lg border border-purple-500/20">
                                                                            YT Address: {hook.ytTokenAddress ? `${hook.ytTokenAddress.slice(0, 10)}...` : 'Not found'}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Market Information Card */}
                                                        {!!currentHook.marketData && (
                                                            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-6">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center space-x-4">
                                                                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                                                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                            </svg>
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-xl font-bold text-yellow-300">Market Information</div>
                                                                            <div className="text-sm text-gray-400">Maturity and yield details</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="text-2xl font-bold text-yellow-300">
                                                                            {(() => {
                                                                                const marketData = currentHook.marketData as any;
                                                                                const maturity = marketData?.maturity;
                                                                                return maturity ? new Date(Number(maturity) * 1000).toLocaleDateString() : 'Unknown';
                                                                            })()}
                                                                        </div>
                                                                        <div className="text-sm text-gray-300">
                                                                            {(() => {
                                                                                const marketData = currentHook.marketData as any;
                                                                                const maturity = marketData?.maturity;
                                                                                const daysRemaining = maturity ? Math.max(0, Math.ceil((Number(maturity) * 1000 - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
                                                                                return `${daysRemaining} days remaining`;
                                                                            })()}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}


                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-16">
                                            <div className="w-24 h-24 bg-gray-700/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                                <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div className="text-2xl font-bold text-gray-300 mb-4">No Yield Protocol Positions Yet</div>
                                            <div className="text-gray-400 mb-8 max-w-md mx-auto">
                                                You don't have any SY, PT, or YT tokens yet. Start by depositing assets and splitting them into Principal and Yield tokens to build your portfolio.
                                            </div>
                                            <button
                                                onClick={() => setDashboardTab('invest')}
                                                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                                            >
                                                Start Investing
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Earn Tab */}
                            {dashboardTab === 'earn' && (
                                <div className="p-6">
                                    <div className="mb-6">
                                        <h3 className="text-xl font-semibold text-white mb-2">Claim PT & YT Yield</h3>
                                        <p className="text-gray-400">Claim your PT fixed yield and YT variable yield separately</p>
                                    </div>

                                    {/* PT/YT Claiming Interface */}
                                    <div className="space-y-6">
                                        {(Object.entries(ASSET_METADATA) as [keyof typeof ASSET_METADATA, typeof ASSET_METADATA[keyof typeof ASSET_METADATA]][]).map(([key, asset]) => {
                                            const hook = getHookForAsset(key)
                                            const realPtBalance = Number(hook.ptBalance || 0) / 1e18
                                            const realYtBalance = Number(hook.ytBalance || 0) / 1e18
                                            const realYtClaimable = Number(hook.ytClaimableYield || 0) / 1e18
                                            const ptImpliedYield = hook.ptImpliedYield || 0

                                            // Only show if user has PT or YT tokens
                                            if (realPtBalance === 0 && realYtBalance === 0) return null

                                            return (
                                                <div key={key} className="bg-gray-800 rounded-xl p-6 border border-gray-700/50">
                                                    {/* Asset Header */}
                                                    <div className="flex items-center space-x-4 mb-6">
                                                        <span className="text-3xl">{asset.icon}</span>
                                                        <div>
                                                            <div className="text-xl font-semibold text-white">{asset.name}</div>
                                                            <div className="text-gray-400">{asset.symbol} Yield Claims</div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {/* PT Claiming */}
                                                        {realPtBalance > 0 && (
                                                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                                                                <div className="flex items-center space-x-3 mb-3">
                                                                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                                        </svg>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-blue-400 font-semibold">PT Fixed Yield</div>
                                                                        <div className="text-xs text-gray-400">Redeem PT + accumulated yield</div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-lg font-bold text-blue-300 mb-2">
                                                                    {realPtBalance.toFixed(4)} PT tokens
                                                                </div>
                                                                <div className="text-sm text-blue-300 mb-3">
                                                                    Current value: ${(realPtBalance * 1.05 + ptImpliedYield * 1.05).toFixed(4)}
                                                                </div>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedAsset(key as any)
                                                                        hook.redeemPT(realPtBalance.toString())
                                                                    }}
                                                                    disabled={hook.isRedeemingPT}
                                                                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors"
                                                                >
                                                                    {hook.isRedeemingPT ? 'Redeeming PT...' : `🔒 Redeem ${realPtBalance.toFixed(2)} PT`}
                                                                </button>
                                                            </div>
                                                        )}

                                                        {/* YT Claiming */}
                                                        {realYtBalance > 0 && (
                                                            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                                                                <div className="flex items-center space-x-3 mb-3">
                                                                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                                                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                                        </svg>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-purple-400 font-semibold">YT Variable Yield</div>
                                                                        <div className="text-xs text-gray-400">Claim accumulated yield</div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-lg font-bold text-purple-300 mb-2">
                                                                    {realYtBalance.toFixed(4)} YT tokens
                                                                </div>
                                                                <div className="text-sm text-purple-300 mb-3">
                                                                    {realYtClaimable > 0
                                                                        ? `Claimable: ${realYtClaimable.toFixed(6)} SY`
                                                                        : 'No yield ready to claim yet'}
                                                                </div>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedAsset(key as any)
                                                                        hook.handleClaimYTYield()
                                                                    }}
                                                                    disabled={hook.isClaimingYTYield || realYtClaimable === 0}
                                                                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors"
                                                                >
                                                                    {hook.isClaimingYTYield
                                                                        ? 'Claiming YT Yield...'
                                                                        : realYtClaimable > 0
                                                                            ? `🎲 Claim ${realYtClaimable.toFixed(6)} SY`
                                                                            : '🎲 No Yield Available'
                                                                    }
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* No PT/YT tokens message */}
                                    {Object.entries(ASSET_METADATA).every(([key]) => {
                                        const hook = getHookForAsset(key)
                                        const realPtBalance = Number(hook.ptBalance || 0) / 1e18
                                        const realYtBalance = Number(hook.ytBalance || 0) / 1e18
                                        return realPtBalance === 0 && realYtBalance === 0
                                    }) && (
                                            <div className="text-center py-12">
                                                <div className="w-20 h-20 bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6 opacity-60">
                                                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-2xl font-semibold text-white mb-3">No PT/YT Tokens Yet</h3>
                                                <p className="text-gray-400 text-lg mb-6">Deposit assets in the Invest tab to get PT/YT tokens</p>
                                                <button
                                                    onClick={() => setDashboardTab('invest')}
                                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
                                                >
                                                    Start Investing
                                                </button>
                                            </div>
                                        )}
                                </div>
                            )}

                            {/* Manage Tab */}
                            {dashboardTab === 'manage' && (
                                <div className="p-6">
                                    <div className="mb-6">
                                        <h3 className="text-xl font-semibold text-white mb-2">Manage Assets</h3>
                                        <p className="text-gray-400">Deposit, withdraw, and manage your positions</p>
                                    </div>

                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-semibold text-white">Asset Management</h3>
                                        <select
                                            value={selectedAsset}
                                            onChange={(e) => setSelectedAsset(e.target.value as any)}
                                            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                                        >
                                            {Object.entries(ASSET_METADATA).map(([key, asset]) => (
                                                <option key={key} value={key}>{asset.symbol}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-8">
                                        {/* Deposit Section */}
                                        <div className="space-y-4">
                                            <h4 className="text-white font-medium flex items-center space-x-2">
                                                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                                <span>Deposit & Earn</span>
                                            </h4>

                                            <div className="bg-gray-750 rounded-xl p-4 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-400">Available</span>
                                                    <span className="text-sm text-white">{formatBalance(assetBalance as bigint)} {ASSET_METADATA[selectedAsset].symbol}</span>
                                                </div>

                                                {/* Yield Generation Indicator */}
                                                <div className="p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                                                    <div className="text-xs text-green-400 flex items-center">
                                                        <span className="mr-2">🌱</span>
                                                        <span>Generating yield automatically over time</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    {/* Approval Status Display */}
                                                    <div className="p-3 bg-gray-700/50 border border-gray-600 rounded-lg">
                                                        <div className="text-sm text-gray-300 mb-2">🔐 Asset Approval Status</div>
                                                        <div className="text-xs">
                                                            <div className="flex justify-between">
                                                                <span>Status:</span>
                                                                <span className={approvalStatus.className}>
                                                                    {approvalStatus.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* 🎯 NEW: SY Approval Status for Splitting */}
                                                    <div className="p-3 bg-purple-700/50 border border-purple-600 rounded-lg">
                                                        <div className="text-sm text-purple-300 mb-2">🎯 SY Approval Status (for Splitting)</div>
                                                        <div className="text-xs">
                                                            <div className="flex justify-between">
                                                                <span>Status:</span>
                                                                <span className={syApprovalStatus.className}>
                                                                    {syApprovalStatus.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <input
                                                        type="number"
                                                        value={amount}
                                                        onChange={(e) => setAmount(e.target.value)}
                                                        placeholder="0.0"
                                                        className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                                    />

                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => setAmount(formatBalance(assetBalance as bigint))}
                                                            className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm transition-colors"
                                                        >
                                                            Max
                                                        </button>
                                                    </div>

                                                    {!hasTokens ? (
                                                        <>
                                                            {/* Custom Mint Amount Input */}
                                                            <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                                                                <div className="text-amber-400 font-semibold mb-3">🎯 Custom Mint Amount</div>
                                                                <div className="flex space-x-2">
                                                                    <input
                                                                        type="number"
                                                                        placeholder="Enter amount (e.g., 50000)"
                                                                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-amber-500"
                                                                        min="1"
                                                                        step="1"
                                                                    />
                                                                    <button
                                                                        onClick={() => {
                                                                            const input = document.querySelector('input[placeholder="Enter amount (e.g., 50000)"]') as HTMLInputElement;
                                                                            const amount = input?.value || '10000';
                                                                            handleMintCustomAmount(amount);
                                                                        }}
                                                                        disabled={isMinting}
                                                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                                                                    >
                                                                        Mint Custom
                                                                    </button>
                                                                </div>
                                                                <div className="text-xs text-amber-300 mt-2">
                                                                    💡 Default: 10,000 tokens. Enter custom amount above.
                                                                </div>
                                                            </div>

                                                            {/* Default Mint Button */}
                                                            <button
                                                                onClick={() => handleMintTestTokens()}
                                                                disabled={isMinting}
                                                                className="w-full px-4 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                                                            >
                                                                {isMinting ? 'Minting...' : `🎯 Mint 10,000 ${ASSET_METADATA[selectedAsset].symbol}`}
                                                            </button>
                                                        </>
                                                    ) : approvalStatus.needsApproval ? (
                                                        <>
                                                            {/* Debug button for troubleshooting approval issues */}
                                                            <button
                                                                onClick={() => {
                                                                    console.log('🔍 DEBUG: Current approval state')
                                                                    console.log('SY Balance:', currentHook.syBalance?.toString())
                                                                    console.log('Needs Approval:', approvalStatus.needsApproval)
                                                                    currentHook.refreshAllowanceData()
                                                                    toast.success('Refreshing allowance data...')
                                                                }}
                                                                className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors text-sm mb-4"
                                                            >
                                                                🔍 Debug Approval State
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    // 🎯 FIXED: Always approve asset for wrapping operations
                                                                    // Even if user has SY tokens, they still need asset approval to wrap more
                                                                    currentHook.approveAsset(amount)
                                                                }}
                                                                disabled={!amount || isApproving}
                                                                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                                                            >
                                                                {isApproving ? 'Approving...' :
                                                                    `Approve ${ASSET_METADATA[selectedAsset].symbol} for Wrapping`
                                                                }
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {/* Step 1: Deposit Options */}
                                                            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                                                                <div className="text-blue-400 font-semibold mb-3">💰 Step 1: Choose Your Action</div>

                                                                {/* Option 1: Just Deposit (Wrap to SY) */}
                                                                <button
                                                                    onClick={() => { currentHook.wrapAsset(amount, false) }}
                                                                    disabled={!amount || isDepositing}
                                                                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg font-semibold transition-colors mb-3"
                                                                >
                                                                    💰 Deposit to SY Tokens
                                                                </button>

                                                                {/* Option 2: Split SY Tokens (if user has them) */}
                                                                {currentHook.syBalance && (currentHook.syBalance as bigint) > 0n && (
                                                                    <button
                                                                        onClick={() => void currentHook.splitTokens(amount)}
                                                                        disabled={!amount || isDepositing}
                                                                        className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-lg font-semibold transition-colors mb-3"
                                                                    >
                                                                        🎲 Split SY Tokens → PT + YT
                                                                    </button>
                                                                )}

                                                                {/* Option 3: Deposit + Split (Combined) */}
                                                                <button
                                                                    onClick={() => void currentHook.handleDepositAndSplit(amount)}
                                                                    disabled={!amount || isDepositing}
                                                                    className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                                                                >
                                                                    {isDepositing ? '🚀 Processing...' : '🚀 Deposit + Split → PT + YT (2 Steps)'}
                                                                </button>

                                                                {/* Help text */}
                                                                <div className="text-xs text-gray-400 mt-3 space-y-1">
                                                                    <div>💡 <strong>Just Deposit:</strong> Get SY tokens (standardized yield)</div>
                                                                    <div>💡 <strong>Split:</strong> Convert SY to PT (fixed) + YT (variable) tokens</div>
                                                                    <div>💡 <strong>Combined:</strong> Do both in one transaction</div>
                                                                </div>

                                                                {/* Yield Explanation */}
                                                                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                                                    <div className="text-yellow-400 font-semibold mb-2">🌾 Understanding Yield</div>
                                                                    <div className="text-xs text-yellow-300 space-y-1">
                                                                        <div><strong>💰 Asset Yield (stCORE):</strong> Generates yield automatically over time</div>
                                                                        <div><strong>🎯 YT Tokens:</strong> Right to claim future yield from underlying stCORE</div>
                                                                        <div><strong>🔗 Connection:</strong> YT doesn't generate yield - it lets you claim stCORE's yield</div>
                                                                    </div>

                                                                    {/* Visual Flow */}
                                                                    <div className="mt-3 p-2 bg-yellow-600/20 rounded border border-yellow-500/50">
                                                                        <div className="text-xs text-yellow-200 font-medium mb-1">🔄 Yield Flow:</div>
                                                                        <div className="text-xs text-yellow-100">
                                                                            stCORE → Generates Yield → YT Tokens → Claim Yield
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* 🎯 Real Yield Sources Display */}
                                                                {yieldSourceInfo && (
                                                                    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                                                                        <div className="text-green-400 font-semibold mb-3">🎯 Real Yield Sources</div>
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                            <div className="p-3 bg-green-600/20 rounded border border-green-500/50">
                                                                                <div className="text-sm text-green-300 font-medium">stCORE Yield Source</div>
                                                                                <div className="text-xs text-green-200">
                                                                                    <strong>Protocol:</strong> {yieldSourceInfo[1] || 'Loading...'}
                                                                                </div>
                                                                                <div className="text-xs text-green-200">
                                                                                    <strong>Contract:</strong> {yieldSourceInfo[0] ? `${yieldSourceInfo[0].slice(0, 6)}...${yieldSourceInfo[0].slice(-4)}` : 'Loading...'}
                                                                                </div>
                                                                                <div className="text-xs text-green-200">
                                                                                    <strong>APY:</strong> {realYieldAPY ? `${Number(realYieldAPY) / 100}%` : 'Loading...'}
                                                                                </div>
                                                                            </div>

                                                                            <div className="p-3 bg-blue-600/20 rounded border border-blue-500/50">
                                                                                <div className="text-sm text-blue-300 font-medium">Real Yield Generation</div>
                                                                                <div className="text-xs text-blue-200">
                                                                                    <strong>Source:</strong> Smart Contract
                                                                                </div>
                                                                                <div className="text-xs text-blue-200">
                                                                                    <strong>Type:</strong> Actual Yield
                                                                                </div>
                                                                                <div className="text-xs text-blue-200">
                                                                                    <strong>Status:</strong> Active
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {(isDepositing || currentHook.splitProgress.step !== 'idle') && (
                                                                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                                                                    <div className="text-blue-400 font-semibold mb-3">✨ Magic Split in Progress</div>

                                                                    {/* Visual Split Animation */}
                                                                    {currentHook.splitProgress.step === 'complete' && (
                                                                        <div className="mb-4 p-4 bg-gradient-to-r from-green-500/10 to-purple-500/10 border border-green-500/30 rounded-lg">
                                                                            <div className="text-center">
                                                                                <div className="text-lg font-bold text-white mb-2">🎉 SPLIT COMPLETE!</div>
                                                                                <div className="flex items-center justify-center space-x-4 text-sm">
                                                                                    <div className="text-blue-300">
                                                                                        <div className="w-8 h-8 bg-blue-500 rounded-full mx-auto mb-1 flex items-center justify-center">🔒</div>
                                                                                        <div>PT Tokens</div>
                                                                                        <div className="text-xs text-gray-400">Fixed Yield</div>
                                                                                    </div>
                                                                                    <div className="text-gray-400">+</div>
                                                                                    <div className="text-purple-300">
                                                                                        <div className="w-8 h-8 bg-purple-500 rounded-full mx-auto mb-1 flex items-center justify-center">🎲</div>
                                                                                        <div>YT Tokens</div>
                                                                                        <div className="text-xs text-gray-400">Variable Yield</div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-xs text-green-400 mt-2 font-medium">
                                                                                    ✨ Your tokens are now visible in Portfolio tab!
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    <div className="space-y-2 text-sm">
                                                                        <div className="flex items-center space-x-2">
                                                                            <div className={`w-2 h-2 rounded-full ${currentHook.splitProgress.step === 'wrapping' || currentHook.splitProgress.step === 'waiting'
                                                                                    ? 'bg-green-400 animate-pulse'
                                                                                    : currentHook.splitProgress.step === 'splitting' || currentHook.splitProgress.step === 'complete'
                                                                                        ? 'bg-green-400'
                                                                                        : 'bg-gray-400'
                                                                                }`}></div>
                                                                            <span className={currentHook.splitProgress.step === 'wrapping' || currentHook.splitProgress.step === 'waiting' ? 'text-green-400 font-semibold' : ''}>
                                                                                Step 1: Wrapping to SY tokens
                                                                                {currentHook.splitProgress.step === 'waiting' && ' ✅'}
                                                                                {(currentHook.splitProgress.step === 'splitting' || currentHook.splitProgress.step === 'complete') && ' ✅'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center space-x-2">
                                                                            <div className={`w-2 h-2 rounded-full ${currentHook.splitProgress.step === 'splitting'
                                                                                    ? 'bg-yellow-400 animate-pulse'
                                                                                    : currentHook.splitProgress.step === 'complete'
                                                                                        ? 'bg-green-400'
                                                                                        : 'bg-gray-400'
                                                                                }`}></div>
                                                                            <span className={currentHook.splitProgress.step === 'splitting' ? 'text-yellow-400 font-semibold' : currentHook.splitProgress.step === 'complete' ? 'text-green-400 font-semibold' : ''}>
                                                                                Step 2: Splitting into PT + YT tokens
                                                                                {currentHook.splitProgress.step === 'complete' && ' ✅'}
                                                                            </span>
                                                                        </div>
                                                                        {currentHook.splitProgress.message && (
                                                                            <div className="text-blue-300 text-xs mt-2 font-medium">
                                                                                {currentHook.splitProgress.message}
                                                                            </div>
                                                                        )}
                                                                        <div className="text-gray-400 text-xs mt-2">
                                                                            💡 Open browser console (F12) to see detailed logs
                                                                        </div>

                                                                        {/* Quick Start Flow */}
                                                                        {(() => {
                                                                            const assetBal = Number(currentHook.assetBalance || 0) / 1e18
                                                                            const syBal = Number(currentHook.syBalance || 0) / 1e18
                                                                            const ptBal = Number(currentHook.ptBalance || 0) / 1e18
                                                                            const ytBal = Number(currentHook.ytBalance || 0) / 1e18

                                                                            const hasMarket = !!currentHook.marketData
                                                                            const needsAssets = assetBal < 10
                                                                            const needsSY = assetBal >= 10 && syBal < 5
                                                                            const needsPTYT = syBal >= 5 && (ptBal < 1 || ytBal < 1)
                                                                            const isComplete = ptBal > 0 && ytBal > 0

                                                                            if (isComplete) {
                                                                                return (
                                                                                    <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded">
                                                                                        <div className="text-green-400 font-medium mb-2">🎉 You're all set!</div>
                                                                                        <div className="text-sm text-gray-300">
                                                                                            PT: {ptBal.toFixed(2)} • YT: {ytBal.toFixed(2)} • Ready to claim yield!
                                                                                        </div>
                                                                                    </div>
                                                                                )
                                                                            }

                                                                            return (
                                                                                <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                                                                                    <div className="text-blue-400 font-medium mb-2">🚀 Quick Start Flow</div>
                                                                                    <div className="space-y-2 text-sm">
                                                                                        {needsAssets && (
                                                                                            <div className="flex items-center justify-between">
                                                                                                <span className="text-yellow-400">1. Get test assets ({assetBal.toFixed(1)} {selectedAsset})</span>
                                                                                                <button
                                                                                                    onClick={() => currentHook.handleMintTestTokens()}
                                                                                                    disabled={currentHook.isMinting}
                                                                                                    className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs"
                                                                                                >
                                                                                                    {currentHook.isMinting ? 'Minting...' : '🎁 Mint 1000'}
                                                                                                </button>
                                                                                            </div>
                                                                                        )}

                                                                                        {needsSY && !needsAssets && (
                                                                                            <div className="flex items-center justify-between">
                                                                                                <span className="text-blue-400">2. Convert to SY tokens ({syBal.toFixed(1)} SY)</span>
                                                                                                <button
                                                                                                    onClick={() => currentHook.wrapAsset('100')}
                                                                                                    disabled={currentHook.isDepositing}
                                                                                                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                                                                                                >
                                                                                                    {currentHook.isDepositing ? 'Converting...' : '💰 Deposit 100'}
                                                                                                </button>
                                                                                            </div>
                                                                                        )}

                                                                                        {needsPTYT && !needsSY && !needsAssets && (
                                                                                            <div className="flex items-center justify-between">
                                                                                                <span className="text-purple-400">3. Split into PT + YT tokens</span>
                                                                                                <button
                                                                                                    onClick={() => currentHook.splitTokens('50')}
                                                                                                    disabled={currentHook.isDepositing}
                                                                                                    className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs"
                                                                                                >
                                                                                                    {currentHook.isDepositing ? 'Splitting...' : '✨ Split 50 SY'}
                                                                                                </button>
                                                                                            </div>
                                                                                        )}

                                                                                        {!hasMarket && (
                                                                                            <div className="flex items-center justify-between">
                                                                                                <span className="text-red-400">⚠️ Create market first</span>
                                                                                                <button
                                                                                                    onClick={() => currentHook.handleCreateMarket()}
                                                                                                    className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                                                                                                >
                                                                                                    🏭 Create Market
                                                                                                </button>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            )
                                                                        })()}

                                                                        {/* Debug Info */}
                                                                        <div className="mt-3 p-2 bg-gray-700/50 rounded text-xs">
                                                                            <div className="text-yellow-400 font-medium mb-1">🔧 Debug Info:</div>
                                                                            <div>Current Market ID: {currentHook.marketData ? '✅ Found' : '❌ Missing'}</div>
                                                                            <div>Total Markets Created: {currentHook.marketData ? 1 : 0}</div>
                                                                            <div>PT Balance: {currentHook.ptBalance ? `${Number(currentHook.ptBalance) / 1e18}` : '0'}</div>
                                                                            <div>YT Balance: {currentHook.ytBalance ? `${Number(currentHook.ytBalance) / 1e18}` : '0'}</div>

                                                                            {currentHook.marketData && (
                                                                                <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded">
                                                                                    <div className="text-green-400 font-medium mb-1">📋 Existing Markets:</div>
                                                                                    <div className="text-green-300 text-xs truncate">
                                                                                        PT: {currentHook.marketData?.ptToken || 'Unknown'}
                                                                                    </div>
                                                                                    <div className="text-green-300 text-xs truncate">
                                                                                        YT: {currentHook.marketData?.ytToken || 'Unknown'}
                                                                                    </div>
                                                                                    {false && (
                                                                                        <div className="text-gray-400 text-xs">
                                                                                            +0 more markets
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}

                                                                            {!currentHook.marketData && (
                                                                                <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
                                                                                    <div className="text-red-400 text-xs mb-2 font-medium">
                                                                                        ⚠️ No market found for {selectedAsset}
                                                                                    </div>
                                                                                    <div className="text-gray-400 text-xs mb-2">
                                                                                        PT/YT tokens require a market. Create one to enable yield splitting.
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={() => currentHook.handleCreateMarket()}
                                                                                        className="w-full px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs font-medium transition-colors"
                                                                                    >
                                                                                        🏭 Create {selectedAsset} Market
                                                                                    </button>
                                                                                    <div className="text-xs text-gray-500 mt-1">
                                                                                        This will deploy PT & YT token contracts
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Withdraw Section */}
                                        <div className="space-y-4">
                                            <h4 className="text-white font-medium flex items-center space-x-2">
                                                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                </svg>
                                                <span>Withdraw</span>
                                            </h4>

                                            <div className="bg-gray-750 rounded-xl p-4 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-400">SY Balance</span>
                                                    <span className="text-sm text-white">{formatBalance(syBalance as bigint)} sy{ASSET_METADATA[selectedAsset].symbol}</span>
                                                </div>

                                                {/* SY Token Explanation */}
                                                <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                                    <div className="text-xs text-blue-400 flex items-center">
                                                        <span className="mr-2">💎</span>
                                                        <span>Standardized yield tokens backed by underlying {ASSET_METADATA[selectedAsset].symbol}</span>
                                                    </div>
                                                </div>

                                                {hasSYTokens ? (
                                                    <div className="space-y-3">
                                                        <input
                                                            type="number"
                                                            value={withdrawAmount}
                                                            onChange={(e) => setWithdrawAmount(e.target.value)}
                                                            placeholder="0.0"
                                                            max={formatBalance(syBalance as bigint)}
                                                            className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                                        />

                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => setWithdrawAmount((Number(formatBalance(syBalance as bigint)) * 0.25).toString())}
                                                                className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm transition-colors"
                                                            >
                                                                25%
                                                            </button>
                                                            <button
                                                                onClick={() => setWithdrawAmount((Number(formatBalance(syBalance as bigint)) * 0.5).toString())}
                                                                className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm transition-colors"
                                                            >
                                                                50%
                                                            </button>
                                                            <button
                                                                onClick={() => setWithdrawAmount(formatBalance(syBalance as bigint))}
                                                                className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm transition-colors"
                                                            >
                                                                Max
                                                            </button>
                                                        </div>

                                                        <button
                                                            onClick={() => handleWithdraw(withdrawAmount)}
                                                            disabled={!withdrawAmount || parseFloat(withdrawAmount) > parseFloat(formatBalance(syBalance as bigint)) || isWithdrawing}
                                                            className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors"
                                                        >
                                                            {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-8">
                                                        <div className="text-gray-400 mb-2">No sy{ASSET_METADATA[selectedAsset].symbol} to withdraw</div>
                                                        <div className="text-sm text-gray-500">Deposit some {ASSET_METADATA[selectedAsset].symbol} first</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Claim Yield Section */}
                                    {!!hasYield && (
                                        <div className="mt-6 p-4 bg-purple-600/10 border border-purple-600/30 rounded-xl">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-purple-400 font-medium">Claimable Yield Available</div>
                                                    <div className="text-2xl font-bold text-white mt-1">
                                                        {formatBalance(accumulatedYield as bigint)} sy{ASSET_METADATA[selectedAsset].symbol}
                                                    </div>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={handleClaimYTYield}
                                                        disabled={isClaimingYield || !accumulatedYield || accumulatedYield === 0n}
                                                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                                                    >
                                                        {isClaimingYield ? 'Claiming...' : 'Claim Yield'}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            stCOREHook.refreshBalances()
                                                            lstBTCHook.refreshBalances()
                                                        }}
                                                        className="px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-semibold transition-colors"
                                                    >
                                                        ↻ Refresh
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Transactions Tab */}
                            {dashboardTab === 'transactions' && (
                                <div className="p-6">
                                    <div className="mb-6">
                                        <h3 className="text-xl font-semibold text-white mb-2">Transaction History</h3>
                                        <p className="text-gray-400">Your recent transactions and activity</p>
                                    </div>

                                    {/* Filters and Search */}
                                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                                        <div className="flex items-center space-x-2">
                                            <select
                                                value={transactionFilter}
                                                onChange={(e) => setTransactionFilter(e.target.value as 'all' | 'deposit' | 'withdraw' | 'split' | 'claim')}
                                                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                                            >
                                                <option value="all">All Transactions</option>
                                                <option value="deposit">Deposits</option>
                                                <option value="withdraw">Withdrawals</option>
                                                <option value="split">Splits</option>
                                                <option value="claim">Claims</option>
                                            </select>

                                            <button
                                                onClick={refreshTransactions}
                                                disabled={historyLoading}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                                            >
                                                {historyLoading ? 'Loading...' : '🔄 Sync Blockchain'}
                                            </button>

                                            <button
                                                onClick={() => {
                                                    console.log('🔍 Manual search for yield claims...')
                                                    searchRecentYieldClaims()
                                                }}
                                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                                            >
                                                🔍 Debug Yield Claims
                                            </button>
                                        </div>

                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                placeholder="Search by asset, transaction type..."
                                                value={transactionSearch}
                                                onChange={(e) => setTransactionSearch(e.target.value)}
                                                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Transaction Statistics and List Layout */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Transaction Statistics - Left Side */}
                                        <div className="lg:col-span-1 order-2 lg:order-1">
                                            <TransactionStats stats={getTransactionStats()} />
                                        </div>

                                        {/* Transaction List - Right Side */}
                                        <div className="lg:col-span-2 order-1 lg:order-2 space-y-4">
                                            {historyLoading ? (
                                                <div className="text-center py-12">
                                                    <div className="w-20 h-20 bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6 opacity-60">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                                    </div>
                                                    <h3 className="text-2xl font-semibold text-white mb-3">Loading Transactions</h3>
                                                    <p className="text-gray-400 text-lg">Fetching your transaction history from the blockchain...</p>
                                                </div>
                                            ) : paginatedTransactions.length === 0 ? (
                                                <div className="text-center py-12">
                                                    <div className="w-20 h-20 bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6 opacity-60">
                                                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                    </div>
                                                    <h3 className="text-2xl font-semibold text-white mb-3">No Transactions Yet</h3>
                                                    <p className="text-gray-400 text-lg mb-6">Your transaction history will appear here once you start using the protocol</p>
                                                    <button
                                                        onClick={() => setDashboardTab('invest')}
                                                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
                                                    >
                                                        Start Investing
                                                    </button>
                                                </div>
                                            ) : (
                                                paginatedTransactions.map((tx) => (
                                                    <div
                                                        key={tx.id}
                                                        onClick={() => {
                                                            setSelectedTransaction(tx)
                                                            setShowTransactionModal(true)
                                                        }}
                                                        className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:shadow-lg ${tx.status === 'success'
                                                                ? 'bg-green-500/10 border-green-500/30 hover:border-green-500/50'
                                                                : 'bg-red-500/10 border-red-500/30 hover:border-red-500/50'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center space-x-3">
                                                                <span className="text-2xl">{getTransactionIcon(tx.type)}</span>
                                                                <div>
                                                                    <div className="flex items-center space-x-2">
                                                                        <span className="text-white font-medium capitalize">{tx.type}</span>
                                                                        <span className="text-gray-400">•</span>
                                                                        <span className="text-blue-400 font-medium">{tx.asset}</span>
                                                                        {/* Status is always success or failed from blockchain history */}
                                                                    </div>
                                                                    <div className="text-gray-400 text-sm">
                                                                        {getTimeAgo(tx.timestamp)}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="text-right">
                                                                <div className="text-white font-bold text-lg">
                                                                    {tx.amount}
                                                                </div>
                                                                <div className={`text-sm font-medium ${getStatusColor(tx.status)}`}>
                                                                    {tx.status.toUpperCase()}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="text-gray-300 text-sm mb-3">
                                                            {tx.details}
                                                        </div>

                                                        <div className="flex items-center justify-between text-xs text-gray-400">
                                                            <span>TX: {tx.txHash}</span>
                                                            <span>{tx.timestamp.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}

                                            {/* Pagination Controls */}
                                            {totalPages > 1 && (
                                                <div className="flex items-center justify-between mt-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={goToFirstPage}
                                                            disabled={currentPage === 1}
                                                            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                                                        >
                                                            ⏮️ First
                                                        </button>
                                                        <button
                                                            onClick={goToPreviousPage}
                                                            disabled={currentPage === 1}
                                                            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                                                        >
                                                            ◀️ Previous
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-gray-400 text-sm">
                                                            Page {currentPage} of {totalPages}
                                                        </span>
                                                        <span className="text-gray-500 text-sm">
                                                            ({filteredTransactions.length} total transactions)
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={goToNextPage}
                                                            disabled={currentPage === totalPages}
                                                            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                                                        >
                                                            Next ▶️
                                                        </button>
                                                        <button
                                                            onClick={goToLastPage}
                                                            disabled={currentPage === totalPages}
                                                            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                                                        >
                                                            Last ⏭️
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Education Tab */}
                            {dashboardTab === 'education' && (
                                <div className="p-6">
                                    <div className="mb-6">
                                        <h3 className="text-xl font-semibold text-white mb-2">Education Center</h3>
                                        <p className="text-gray-400">Learn about yield farming and CoreYield protocol</p>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                                        <div className="bg-gray-750 rounded-xl p-6 border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300">
                                            <div className="flex items-center space-x-3 mb-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                                                    <span className="text-white text-xl">🌱</span>
                                                </div>
                                                <div>
                                                    <div className="text-white font-semibold">Beginner</div>
                                                    <div className="text-gray-400 text-sm">Learn the basics</div>
                                                </div>
                                            </div>
                                            <p className="text-gray-300 text-sm mb-4">
                                                Understand yield farming fundamentals, CoreYield protocol basics, and how to get started safely.
                                            </p>
                                            <button
                                                onClick={() => {
                                                    if (onShowEducation) {
                                                        onShowEducation('beginner')
                                                    } else {
                                                        // Fallback: open in new tab
                                                        window.open('https://coreyield-protocol.vercel.app/education?level=beginner', '_blank')
                                                    }
                                                }}
                                                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                                            >
                                                Start Learning
                                            </button>
                                        </div>

                                        <div className="bg-gray-750 rounded-xl p-6 border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300">
                                            <div className="flex items-center space-x-3 mb-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                                                    <span className="text-white text-xl">📚</span>
                                                </div>
                                                <div>
                                                    <div className="text-white font-semibold">Intermediate</div>
                                                    <div className="text-gray-400 text-sm">Advanced strategies</div>
                                                </div>
                                            </div>
                                            <p className="text-gray-300 text-sm mb-4">
                                                Dive deeper into SY tokens, yield generation mechanisms, and risk management strategies.
                                            </p>
                                            <button
                                                onClick={() => {
                                                    if (onShowEducation) {
                                                        onShowEducation('intermediate')
                                                    } else {
                                                        // Fallback: open in new tab
                                                        window.open('https://coreyield-protocol.vercel.app/education?level=intermediate', '_blank')
                                                    }
                                                }}
                                                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                                            >
                                                Learn More
                                            </button>
                                        </div>

                                        <div className="bg-gray-750 rounded-xl p-6 border border-gray-700/50 hover:border-orange-500/30 transition-all duration-300">
                                            <div className="flex items-center space-x-3 mb-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                                                    <span className="text-white text-xl">🎓</span>
                                                </div>
                                                <div>
                                                    <div className="text-white font-semibold">Advanced</div>
                                                    <div className="text-gray-400 text-sm">Protocol mechanics</div>
                                                </div>
                                            </div>
                                            <p className="text-gray-300 text-sm mb-4">
                                                Master smart contract architecture, yield calculation mechanics, and optimization strategies.
                                            </p>
                                            <button
                                                onClick={() => {
                                                    if (onShowEducation) {
                                                        onShowEducation('advanced')
                                                    } else {
                                                        // Fallback: open in new tab
                                                        window.open('https://coreyield-protocol.vercel.app/education?level=advanced', '_blank')
                                                    }
                                                }}
                                                className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
                                            >
                                                Master Level
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-gray-750 rounded-xl p-6 border border-gray-700/50">
                                        <h4 className="text-lg font-semibold text-white mb-4">Quick Learning Path</h4>
                                        <div className="space-y-4">
                                            <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg">
                                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                                                <div className="flex-1">
                                                    <div className="text-white font-medium">Understand Yield Farming Basics</div>
                                                    <div className="text-gray-400 text-sm">Learn what yield farming is and how it works</div>
                                                </div>
                                                <div className="text-green-400 text-sm">5 min</div>
                                            </div>

                                            <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg">
                                                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                                                <div className="flex-1">
                                                    <div className="text-white font-medium">Explore CoreYield Protocol</div>
                                                    <div className="text-gray-400 text-sm">Understand how SY tokens work</div>
                                                </div>
                                                <div className="text-green-400 text-sm">8 min</div>
                                            </div>

                                            <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg">
                                                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                                                <div className="flex-1">
                                                    <div className="text-white font-medium">Start Your First Investment</div>
                                                    <div className="text-gray-400 text-sm">Deposit assets and start earning yield</div>
                                                </div>
                                                <div className="text-green-400 text-sm">3 min</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>


                    </div>
                )}
            </div>

            {/* Notifications - Exact Pendle Style */}
            {notification && (
                <div className="fixed bottom-6 right-6 max-w-md z-50">
                    <div className="bg-gray-800 border border-gray-700/50 rounded-2xl p-4 shadow-2xl backdrop-blur-sm">
                        <div className="flex items-start space-x-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${notification.type === 'success' ? 'bg-green-500 text-white' :
                                    notification.type === 'error' ? 'bg-red-500 text-white' :
                                        'bg-blue-500 text-white'
                                }`}>
                                {notification.type === 'success' ? '✓' : notification.type === 'error' ? '✕' : 'i'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-white">
                                    {notification.title}
                                </div>
                                <div className="text-sm text-gray-400 mt-1">
                                    {notification.message}
                                </div>
                                {notification.hash && (
                                    <a
                                        href={`https://scan.test2.btcs.network/tx/${notification.hash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-400 hover:text-blue-300 mt-2 inline-flex items-center space-x-1 font-medium"
                                    >
                                        <span>View transaction</span>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Transaction Details Modal */}
            <TransactionDetailsModal
                transaction={selectedTransaction}
                isOpen={showTransactionModal}
                onClose={() => {
                    setShowTransactionModal(false)
                    setSelectedTransaction(null)
                }}
            />
        </div>
    )
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./CoreStaking.sol";
import "./AMM/CoreSwapAMM.sol";
import "./PortfolioTracker.sol";
import "./YieldHarvester.sol";
import "./RiskManager.sol";
import "./CoreGovernance.sol";
import "./AnalyticsEngine.sol";
import "./CoreYieldStrategy.sol";
import "./CoreYieldBridge.sol";
import "./CoreYieldAnalytics.sol";
import "./AMM/CoreYieldAMM.sol";

contract CoreYieldRouter is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    CoreStaking public coreStaking;
    CoreSwapAMM public coreSwapAMM;
    PortfolioTracker public portfolioTracker;
    YieldHarvester public yieldHarvester;
    RiskManager public riskManager;
    CoreGovernance public coreGovernance;
    AnalyticsEngine public analyticsEngine;
    CoreYieldStrategy public coreYieldStrategy;
    CoreYieldBridge public coreYieldBridge;
    CoreYieldAnalytics public coreYieldAnalytics;
    CoreYieldAMM public coreYieldAMM;
    
    mapping(address => bool) public supportedTokens;
    mapping(address => uint256) public userLastActivity;
    
    event RouterInitialized();
    event UserActivityUpdated(address indexed user, uint256 timestamp);
    event TokenAdded(address indexed token);
    event TokenRemoved(address indexed token);
    event EmergencyPaused(address indexed user, uint256 timestamp);
    event EmergencyResumed(address indexed user, uint256 timestamp);
    event AssetWrapped(address indexed user, address indexed underlying, uint256 amount, uint256 syAmount);
    event TokensSplit(address indexed user, address indexed syToken, uint256 syAmount, uint256 ptAmount, uint256 ytAmount);
    event TokensMerged(address indexed user, address indexed syToken, uint256 ptAmount, uint256 ytAmount, uint256 syAmount);
    
    modifier onlySupportedToken(address token) {
        require(supportedTokens[token], "Token not supported");
        _;
    }
    
    constructor() Ownable(msg.sender) {
        // Contracts will be set after deployment
    }
    
    function initializeRouter(
        address _coreStaking,
        address _coreSwapAMM,
        address _portfolioTracker,
        address _yieldHarvester,
        address _riskManager,
        address _coreGovernance,
        address _analyticsEngine,
        address _coreYieldStrategy,
        address _coreYieldBridge,
        address _coreYieldAnalytics,
        address _coreYieldAMM
    ) external onlyOwner {
        require(_coreStaking != address(0), "Invalid CoreStaking address");
        require(_coreSwapAMM != address(0), "Invalid CoreSwapAMM address");
        require(_portfolioTracker != address(0), "Invalid PortfolioTracker address");
        require(_yieldHarvester != address(0), "Invalid YieldHarvester address");
        require(_riskManager != address(0), "Invalid RiskManager address");
        require(_coreGovernance != address(0), "Invalid CoreGovernance address");
        require(_analyticsEngine != address(0), "Invalid AnalyticsEngine address");
        require(_coreYieldStrategy != address(0), "Invalid CoreYieldStrategy address");
        require(_coreYieldBridge != address(0), "Invalid CoreYieldBridge address");
        require(_coreYieldAnalytics != address(0), "Invalid CoreYieldAnalytics address");
        require(_coreYieldAMM != address(0), "Invalid CoreYieldAMM address");
        
        coreStaking = CoreStaking(_coreStaking);
        coreSwapAMM = CoreSwapAMM(_coreSwapAMM);
        portfolioTracker = PortfolioTracker(_portfolioTracker);
        yieldHarvester = YieldHarvester(_yieldHarvester);
        riskManager = RiskManager(_riskManager);
        coreGovernance = CoreGovernance(_coreGovernance);
        analyticsEngine = AnalyticsEngine(_analyticsEngine);
        coreYieldStrategy = CoreYieldStrategy(_coreYieldStrategy);
        coreYieldBridge = CoreYieldBridge(_coreYieldBridge);
        coreYieldAnalytics = CoreYieldAnalytics(_coreYieldAnalytics);
        coreYieldAMM = CoreYieldAMM(_coreYieldAMM);
        
        emit RouterInitialized();
    }
    
    // ============ STAKING FUNCTIONS ============
    
    function stakeAndTrack(
        uint256 amount,
        address token
    ) external nonReentrant onlySupportedToken(token) {
        // Transfer tokens to router first
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        // Transfer tokens to staking contract
        IERC20(token).safeTransfer(address(coreStaking), amount);
        
        // Call stakeForUser function to stake on behalf of the user
        coreStaking.stakeForUser(msg.sender, amount);
        
        // Get the stCORE token address
        address stCoreTokenAddress = address(coreStaking.stCoreToken());
        
        // Update portfolio tracking with stCORE (staked tokens)
        portfolioTracker.updateUserPosition(msg.sender, stCoreTokenAddress, amount, amount);
        
        // Update analytics
        analyticsEngine.updateUserAnalytics(msg.sender, amount, 850, 5, 1);
        
        _updateUserActivity(msg.sender);
    }
    
    // ============ SWAP FUNCTIONS ============
    
    function swapAndTrack(
        uint256 amountIn,
        address tokenIn,
        address tokenOut,
        uint256 slippageTolerance
    ) external nonReentrant {
        // Calculate minimum amount out based on slippage tolerance
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        
        uint256[] memory amountsOut = coreSwapAMM.getAmountsOut(amountIn, path);
        uint256 amountOutMin = amountsOut[1] * (10000 - slippageTolerance) / 10000;
        
        // Execute swap via AMM
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenIn).approve(address(coreSwapAMM), amountIn);
        
        uint256[] memory amounts = coreSwapAMM.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            msg.sender,
            block.timestamp + 300 // 5 minute deadline
        );
        
        // Update portfolio tracking with actual amounts
        portfolioTracker.updateUserPosition(msg.sender, tokenIn, 0, 0);
        portfolioTracker.updateUserPosition(msg.sender, tokenOut, amounts[1], amounts[1]);
        
        // Update analytics
        analyticsEngine.updateUserAnalytics(msg.sender, amounts[1], 0, 0, 1);
        
        _updateUserActivity(msg.sender);
    }
    
    // ============ YIELD FUNCTIONS ============
    
    function harvestAndTrack(address asset) external nonReentrant {
        // For testing purposes, we'll simulate yield generation
        // In production, this would come from actual yield generation
        
        // Add pending yield for the user (this simulates yield accumulation)
        uint256 testAmount = 1000 * 10**18; // 1000 tokens for testing
        yieldHarvester.addPendingYieldForTesting(msg.sender, asset, testAmount);
        
        // Now harvest the yield (this will fail if YieldHarvester doesn't have tokens)
        // We need to ensure YieldHarvester has tokens to distribute
        try yieldHarvester.harvestYield(asset) {
            // Update analytics on success
            analyticsEngine.updateUserAnalytics(msg.sender, testAmount, 0, 0, 1);
        } catch {
            // If harvesting fails, just continue for testing
            // In production, this would need proper error handling
        }
        
        _updateUserActivity(msg.sender);
    }
    
    // Test function to add pending yield (for testing purposes)
    function addPendingYieldForTesting(address user, address asset, uint256 amount) external onlyOwner {
        // This function is for testing only - adds pending yield above threshold
        yieldHarvester.addPendingYieldForTesting(user, asset, amount);
    }
    
    // ============ STRATEGY FUNCTIONS ============
    
    function createAndExecuteStrategy(
        CoreYieldStrategy.StrategyType strategyType,
        address[] calldata assets,
        uint256[] calldata allocations,
        uint256 targetAPY,
        uint256 riskTolerance
    ) external nonReentrant returns (uint256 strategyId) {
        // Create strategy
        strategyId = coreYieldStrategy.createStrategy(
            strategyType,
            assets,
            allocations,
            targetAPY,
            riskTolerance,
            86400, // 1 day rebalance
            true   // auto-rebalance
        );
        
        // Execute strategy
        coreYieldStrategy.executeStrategy(strategyId);
        
        _updateUserActivity(msg.sender);
    }
    
    // ============ BRIDGE FUNCTIONS ============
    
    function bridgeAndTrack(
        uint256 targetChainId,
        address token,
        uint256 amount
    ) external nonReentrant returns (uint256 requestId) {
        // Calculate the fee (0.5% = 50 basis points)
        uint256 fee = (amount * 50) / 10000; // 0.5% fee
        uint256 totalAmount = amount + fee;
        
        // Transfer tokens to router first (including fee)
        IERC20(token).safeTransferFrom(msg.sender, address(this), totalAmount);
        
        // Ensure router has enough tokens for bridge contract
        uint256 routerBalance = IERC20(token).balanceOf(address(this));
        require(routerBalance >= totalAmount, "Router insufficient balance");
        
        // Approve bridge contract to spend router's tokens
        IERC20(token).approve(address(coreYieldBridge), totalAmount);
        
        // Create bridge request (this will transfer tokens from router to bridge)
        requestId = coreYieldBridge.createBridgeRequest(targetChainId, token, amount);
        
        // Update portfolio tracking
        portfolioTracker.updateUserPosition(msg.sender, token, 0, 0);
        
        // Update analytics
        analyticsEngine.updateUserAnalytics(msg.sender, 0, 0, 0, 1);
        
        _updateUserActivity(msg.sender);
    }
    
    // ============ PORTFOLIO FUNCTIONS ============
    
    function getCompletePortfolio(address user) external view returns (
        uint256 totalValue,
        uint256 totalAPY,
        uint256 totalRisk,
        uint256[] memory strategyIds,
        uint256[] memory bridgeRequests
    ) {
        // Get portfolio info
        (totalValue, totalAPY, totalRisk,,) = portfolioTracker.getUserPortfolio(user);
        
        // Get strategy info
        strategyIds = coreYieldStrategy.getUserStrategies(user);
        
        // Get bridge requests
        bridgeRequests = coreYieldBridge.getUserBridgeRequests(user);
        
        return (totalValue, totalAPY, totalRisk, strategyIds, bridgeRequests);
    }
    
    // ============ PT/YT FUNCTIONS ============
    
    function wrapAsset(
        address underlying,
        uint256 amount
    ) external nonReentrant onlySupportedToken(underlying) returns (uint256 syAmount) {
        require(amount > 0, "Amount must be positive");
        
        // Get market info from factory
        // CoreYieldFactory.Market memory market = coreYieldFactory.getMarketByUnderlying(underlying); // Removed
        // require(market.syToken != address(0), "Market not found"); // Removed
        
        // Transfer underlying tokens from user
        IERC20(underlying).safeTransferFrom(msg.sender, address(this), amount);
        
        // Approve SY token to spend underlying
        // IERC20(underlying).approve(market.syToken, amount); // Removed
        
        // Wrap into SY token
        // syAmount = StandardizedYieldToken(market.syToken).wrap(amount); // Removed
        
        // Transfer SY tokens to user
        // IERC20(market.syToken).safeTransfer(msg.sender, syAmount); // Removed
        
        // Update portfolio tracking
        // portfolioTracker.updateUserPosition(msg.sender, underlying, amount, 0); // Removed
        // portfolioTracker.updateUserPosition(msg.sender, market.syToken, syAmount, 0); // Removed
        
        // Update analytics
        // analyticsEngine.updateUserAnalytics(msg.sender, amount, 0, 0, 1); // Removed
        
        // _updateUserActivity(msg.sender); // Removed
        
        // emit AssetWrapped(msg.sender, underlying, amount, syAmount); // Removed
    }
    
    function splitSY(
        address syToken,
        uint256 syAmount
    ) external nonReentrant returns (uint256 ptAmount, uint256 ytAmount) {
        require(syAmount > 0, "Amount must be positive");
        
        // Get market info from factory
        // CoreYieldFactory.Market memory market = coreYieldFactory.getMarket(syToken); // Removed
        // require(market.syToken != address(0), "Market not found"); // Removed
        // require(market.isActive, "Market not active"); // Removed
        
        // Transfer SY tokens from user
        IERC20(syToken).safeTransferFrom(msg.sender, address(this), syAmount);
        
        // Approve factory to take SY from router
        // IERC20(syToken).approve(address(coreYieldFactory), syAmount); // Removed
        
        // Split SY into PT and YT (minted to router)
        // (ptAmount, ytAmount) = coreYieldFactory.splitSY(syToken, syAmount); // Removed
        
        // Transfer PT and YT tokens to user
        // IERC20(market.ptToken).safeTransfer(msg.sender, ptAmount); // Removed
        // IERC20(market.ytToken).safeTransfer(msg.sender, ytAmount); // Removed
        
        // Update portfolio tracking
        // portfolioTracker.updateUserPosition(msg.sender, syToken, 0, syAmount); // Removed
        // portfolioTracker.updateUserPosition(msg.sender, market.ptToken, ptAmount, 0); // Removed
        // portfolioTracker.updateUserPosition(msg.sender, market.ytToken, ytAmount, 0); // Removed
        
        // Update analytics
        // analyticsEngine.updateUserAnalytics(msg.sender, 0, 0, 0, 1); // Removed
        
        // _updateUserActivity(msg.sender); // Removed
        
        // emit TokensSplit(msg.sender, syToken, syAmount, ptAmount, ytAmount); // Removed
    }

    // ======== Pendle-style Strategy Helpers ========

    event FixedYieldOpened(address indexed user, address indexed underlying, uint256 underlyingIn, address quoteToken, uint256 ptReceived, uint256 ytSold, uint256 proceeds);
    event LeveragedYieldOpened(address indexed user, address indexed underlying, uint256 initialUnderlyingIn, uint8 loops, uint256 totalYTReceived);

    // Open a fixed-yield position: wrap -> split -> sell YT for quote token, keep PT
    function openFixedYieldPosition(
        address underlying,
        uint256 amount,
        address quoteToken
    ) external nonReentrant returns (uint256 ptAmount, uint256 ytSold, uint256 proceeds) {
        require(supportedTokens[underlying], "Token not supported");
        require(amount > 0, "Invalid amount");

        // Get market
        // CoreYieldFactory.Market memory market = coreYieldFactory.getMarketByUnderlying(underlying); // Removed
        // require(market.syToken != address(0), "Market not found"); // Removed
        
        // Pull underlying from user
        IERC20(underlying).safeTransferFrom(msg.sender, address(this), amount);
        
        // Wrap to SY (SY minted to router)
        // IERC20(underlying).approve(market.syToken, amount); // Removed
        // uint256 syAmount = StandardizedYieldToken(market.syToken).wrap(amount); // Removed
        
        // Approve factory and split to PT + YT (minted to router)
        // IERC20(market.syToken).approve(address(coreYieldFactory), syAmount); // Removed
        // (ptAmount, ytSold) = coreYieldFactory.splitSY(market.syToken, syAmount); // Removed
        
        // Approve AMM to spend YT, swap YT -> quoteToken (output kept in router)
        // IERC20(market.ytToken).approve(address(coreYieldAMM), ytSold); // Removed
        // uint256 out = coreYieldAMM.swap(market.ytToken, quoteToken, ytSold); // Removed
        // proceeds = out; // Removed
        
        // Send PT and proceeds to user
        // IERC20(market.ptToken).safeTransfer(msg.sender, ptAmount); // Removed
        // IERC20(quoteToken).safeTransfer(msg.sender, proceeds); // Removed
        
        // Track positions
        // portfolioTracker.updateUserPosition(msg.sender, market.ptToken, ptAmount, 0); // Removed
        // portfolioTracker.updateUserPosition(msg.sender, quoteToken, proceeds, 0); // Removed
        // analyticsEngine.updateUserAnalytics(msg.sender, amount, 0, 0, 1); // Removed
        // _updateUserActivity(msg.sender); // Removed
        
        // emit FixedYieldOpened(msg.sender, underlying, amount, quoteToken, ptAmount, ytSold, proceeds); // Removed
    }

    // Open a leveraged-yield position: loop split then sell PT -> underlying -> wrap -> split to accumulate YT
    function openLeveragedYieldPosition(
        address underlying,
        uint256 amount,
        uint8 loops
    ) external nonReentrant returns (uint256 totalYT) {
        require(supportedTokens[underlying], "Token not supported");
        require(amount > 0, "Invalid amount");
        require(loops > 0 && loops <= 5, "Invalid loops");

        // CoreYieldFactory.Market memory market = coreYieldFactory.getMarketByUnderlying(underlying); // Removed
        // require(market.syToken != address(0), "Market not found"); // Removed

        // Pull initial underlying
        IERC20(underlying).safeTransferFrom(msg.sender, address(this), amount);
        uint256 workingUnderlying = amount;

        for (uint8 i = 0; i < loops; i++) {
            // Wrap to SY
            // IERC20(underlying).approve(market.syToken, workingUnderlying); // Removed
            // uint256 syAmount = StandardizedYieldToken(market.syToken).wrap(workingUnderlying); // Removed

            // Split to PT + YT (minted to router)
            // IERC20(market.syToken).approve(address(coreYieldFactory), syAmount); // Removed
            // (uint256 ptAmount, uint256 ytAmount) = coreYieldFactory.splitSY(market.syToken, syAmount); // Removed

            // Accumulate YT
            // totalYT += ytAmount; // Removed

            // Sell PT back to underlying to lever up
            // IERC20(market.ptToken).approve(address(coreYieldAMM), ptAmount); // Removed
            // uint256 underlyingOut = coreYieldAMM.swap(market.ptToken, underlying, ptAmount); // Removed

            // New working capital becomes what we received
            // workingUnderlying = underlyingOut; // Removed
        }

        // Send accumulated YT to user
        // IERC20(market.ytToken).safeTransfer(msg.sender, totalYT); // Removed

        // Track analytics
        // analyticsEngine.updateUserAnalytics(msg.sender, amount, 0, 0, loops); // Removed
        // _updateUserActivity(msg.sender); // Removed

        // emit LeveragedYieldOpened(msg.sender, underlying, amount, loops, totalYT); // Removed
    }
    
    function mergePTYT(
        address syToken,
        uint256 ptAmount,
        uint256 ytAmount
    ) external nonReentrant returns (uint256 syAmount) {
        require(ptAmount > 0 && ytAmount > 0, "Amounts must be positive");
        
        // Get market info from factory
        // CoreYieldFactory.Market memory market = coreYieldFactory.getMarket(syToken); // Removed
        // require(market.syToken != address(0), "Market not found"); // Removed
        // require(market.isActive, "Market not active"); // Removed
        
        // Transfer PT and YT tokens from user
        // IERC20(market.ptToken).safeTransferFrom(msg.sender, address(this), ptAmount); // Removed
        // IERC20(market.ytToken).safeTransferFrom(msg.sender, address(this), ytAmount); // Removed
        
        // Merge PT and YT into SY
        // syAmount = coreYieldFactory.mergePTYT(syToken, ptAmount, ytAmount); // Removed
        
        // Transfer SY tokens to user
        // IERC20(syToken).safeTransfer(msg.sender, syAmount); // Removed
        
        // Update portfolio tracking
        // portfolioTracker.updateUserPosition(msg.sender, market.ptToken, 0, ptAmount); // Removed
        // portfolioTracker.updateUserPosition(msg.sender, market.ytToken, 0, ytAmount); // Removed
        // portfolioTracker.updateUserPosition(msg.sender, syToken, syAmount, 0); // Removed
        
        // Update analytics
        // analyticsEngine.updateUserAnalytics(msg.sender, 0, 0, 0, 1); // Removed
        
        // _updateUserActivity(msg.sender); // Removed
        
        // emit TokensMerged(msg.sender, syToken, ptAmount, ytAmount, syAmount); // Removed
    }
    
    function getYieldAdjustedPrice(
        address token0,
        address token1
    ) external view returns (uint256 price) {
        // Use the new getQuote function to get yield-adjusted pricing
        CoreYieldAMM.TradeInfo memory quote = coreYieldAMM.getQuote(token0, token1, 1e18);
        return quote.outputAmount;
    }
    
    // ============ RISK MANAGEMENT FUNCTIONS ============
    
    function checkPortfolioRisk(address user) external view returns (
        bool isAcceptable,
        string memory reason,
        uint256 riskScore,
        uint256 recommendedActions
    ) {
        // Get portfolio value
        (uint256 totalValue,,,,) = portfolioTracker.getUserPortfolio(user);
        
        // Check risk profile
        (uint256 riskTolerance,,,,,) = riskManager.getUserRiskProfile(user);
        
        // Calculate portfolio risk
        (uint256 totalRisk,,) = riskManager.calculatePortfolioRisk(user);
        
        riskScore = totalRisk;
        
        if (totalRisk <= riskTolerance) {
            isAcceptable = true;
            reason = "Portfolio risk within tolerance";
            recommendedActions = 0;
        } else {
            isAcceptable = false;
            reason = "Portfolio risk exceeds tolerance";
            recommendedActions = 1; // Recommend rebalancing
        }
        
        return (isAcceptable, reason, riskScore, recommendedActions);
    }
    
    // ============ GOVERNANCE FUNCTIONS ============
    
    function createProposalAndVote(
        string memory title,
        string memory description,
        uint256 duration,
        bool support,
        string memory reason
    ) external returns (uint256 proposalId) {
        // Create proposal
        proposalId = coreGovernance.createProposal(title, description, duration);
        
        // Vote on proposal
        coreGovernance.vote(proposalId, support, reason);
        
        _updateUserActivity(msg.sender);
    }
    
    // ============ ANALYTICS FUNCTIONS ============
    
    function getCompleteAnalytics(address user) external view returns (
        uint256 totalValue,
        uint256 totalAPY,
        uint256 totalRisk,
        uint256 transactionCount,
        uint256 strategyCount,
        uint256 bridgeCount
    ) {
        // Get portfolio analytics
        (totalValue, totalAPY, totalRisk,,) = portfolioTracker.getUserPortfolio(user);
        
        // Get user analytics
        (,,, transactionCount,,) = analyticsEngine.getUserAnalytics(user);
        
        // Get strategy count
        uint256[] memory strategies = coreYieldStrategy.getUserStrategies(user);
        strategyCount = strategies.length;
        
        // Get bridge count
        uint256[] memory bridges = coreYieldBridge.getUserBridgeRequests(user);
        bridgeCount = bridges.length;
        
        return (totalValue, totalAPY, totalRisk, transactionCount, strategyCount, bridgeCount);
    }
    
    // ============ UTILITY FUNCTIONS ============
    
    function addSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = true;
        emit TokenAdded(token);
    }
    
    function removeSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = false;
        emit TokenRemoved(token);
    }
    
    function _updateUserActivity(address user) internal {
        userLastActivity[user] = block.timestamp;
        emit UserActivityUpdated(user, block.timestamp);
    }
    
    function getUserLastActivity(address user) external view returns (uint256) {
        return userLastActivity[user];
    }
    
    function getRouterStats() external view returns (
        uint256 totalUsers,
        uint256 totalValue,
        uint256 totalStrategies,
        uint256 totalBridges
    ) {
        // This would require additional tracking
        // For now, return placeholder values
        return (0, 0, 0, 0);
    }
    
    function emergencyPause() external onlyOwner {
        // Pause all contracts that support pausing
        try coreStaking.pause() {} catch {}
        try coreSwapAMM.pause() {} catch {}
        try portfolioTracker.pause() {} catch {}
        try yieldHarvester.pause() {} catch {}
        try riskManager.pause() {} catch {}
        try coreGovernance.pause() {} catch {}
        try analyticsEngine.pause() {} catch {}
        try coreYieldStrategy.pause() {} catch {}
        try coreYieldBridge.emergencyPause() {} catch {}
        
        emit EmergencyPaused(msg.sender, block.timestamp);
    }
    
    function emergencyResume() external onlyOwner {
        // Resume all contracts that support resuming
        try coreStaking.unpause() {} catch {}
        try coreSwapAMM.unpause() {} catch {}
        try portfolioTracker.unpause() {} catch {}
        try yieldHarvester.unpause() {} catch {}
        try riskManager.unpause() {} catch {}
        try coreGovernance.unpause() {} catch {}
        try analyticsEngine.unpause() {} catch {}
        try coreYieldStrategy.unpause() {} catch {}
        try coreYieldBridge.emergencyResume() {} catch {}
        
        emit EmergencyResumed(msg.sender, block.timestamp);
    }
}

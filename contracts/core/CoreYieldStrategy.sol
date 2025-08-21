// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract CoreYieldStrategy is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;
    
    enum StrategyType {
        BuyAndHold,
        YieldFarming,
        Arbitrage,
        Hedging,
        Momentum,
        MeanReversion,
        GridTrading
    }
    
    enum StrategyStatus {
        Active,
        Paused,
        Completed,
        Failed
    }
    
    struct Strategy {
        uint256 id;
        address user;
        StrategyType strategyType;
        address[] assets;
        uint256[] allocations;
        uint256 totalValue;
        uint256 targetAPY;
        uint256 riskTolerance;
        StrategyStatus status;
        uint256 startTime;
        uint256 lastRebalance;
        uint256 rebalanceFrequency;
        uint256 maxDrawdown;
        bool autoRebalance;
    }
    
    struct StrategyPerformance {
        uint256 totalReturn;
        uint256 currentAPY;
        uint256 maxDrawdown;
        uint256 sharpeRatio;
        uint256 lastUpdateTime;
    }
    
    mapping(uint256 => Strategy) public strategies;
    mapping(uint256 => StrategyPerformance) public strategyPerformance;
    mapping(address => uint256[]) public userStrategies;
    
    uint256 public strategyCount;
    uint256 public totalValueLocked;
    
    event StrategyCreated(uint256 indexed strategyId, address indexed user, StrategyType strategyType);
    event StrategyExecuted(uint256 indexed strategyId, uint256 totalValue, uint256 currentAPY);
    event StrategyRebalanced(uint256 indexed strategyId, address[] newAssets, uint256[] newAllocations);
    event StrategyCompleted(uint256 indexed strategyId, uint256 finalValue, uint256 totalReturn);
    
    modifier onlyStrategyOwner(uint256 strategyId) {
        require(strategies[strategyId].user == msg.sender, "Not strategy owner");
        _;
    }
    
    modifier strategyActive(uint256 strategyId) {
        require(strategies[strategyId].status == StrategyStatus.Active, "Strategy not active");
        _;
    }
    
    constructor() Ownable(msg.sender) {
        strategyCount = 0;
    }
    
    function createStrategy(
        StrategyType _strategyType,
        address[] calldata _assets,
        uint256[] calldata _allocations,
        uint256 _targetAPY,
        uint256 _riskTolerance,
        uint256 _rebalanceFrequency,
        bool _autoRebalance
    ) external returns (uint256 strategyId) {
        require(_assets.length > 0, "No assets specified");
        require(_assets.length == _allocations.length, "Array length mismatch");
        require(_targetAPY > 0, "Invalid target APY");
        require(_riskTolerance <= 10, "Invalid risk tolerance");
        
        strategyId = ++strategyCount;
        
        strategies[strategyId] = Strategy({
            id: strategyId,
            user: msg.sender,
            strategyType: _strategyType,
            assets: _assets,
            allocations: _allocations,
            totalValue: 0,
            targetAPY: _targetAPY,
            riskTolerance: _riskTolerance,
            status: StrategyStatus.Active,
            startTime: block.timestamp,
            lastRebalance: block.timestamp,
            rebalanceFrequency: _rebalanceFrequency,
            maxDrawdown: 0,
            autoRebalance: _autoRebalance
        });
        
        userStrategies[msg.sender].push(strategyId);
        
        emit StrategyCreated(strategyId, msg.sender, _strategyType);
    }
    
    function executeStrategy(uint256 strategyId) external nonReentrant strategyActive(strategyId) {
        Strategy storage strategy = strategies[strategyId];
        
        // Execute strategy based on type
        if (strategy.strategyType == StrategyType.YieldFarming) {
            _executeYieldFarming(strategyId);
        } else if (strategy.strategyType == StrategyType.Arbitrage) {
            _executeArbitrage(strategyId);
        } else if (strategy.strategyType == StrategyType.Hedging) {
            _executeHedging(strategyId);
        } else if (strategy.strategyType == StrategyType.GridTrading) {
            _executeGridTrading(strategyId);
        }
        
        // Update performance
        _updateStrategyPerformance(strategyId);
        
        emit StrategyExecuted(strategyId, strategy.totalValue, strategy.targetAPY);
    }
    
    function rebalanceStrategy(
        uint256 strategyId,
        address[] calldata newAssets,
        uint256[] calldata newAllocations
    ) external onlyStrategyOwner(strategyId) strategyActive(strategyId) {
        require(newAssets.length > 0, "No assets specified");
        require(newAssets.length == newAllocations.length, "Array length mismatch");
        
        Strategy storage strategy = strategies[strategyId];
        require(block.timestamp >= strategy.lastRebalance + strategy.rebalanceFrequency, "Too early to rebalance");
        
        strategy.assets = newAssets;
        strategy.allocations = newAllocations;
        strategy.lastRebalance = block.timestamp;
        
        emit StrategyRebalanced(strategyId, newAssets, newAllocations);
    }
    
    function autoRebalance(uint256 strategyId) external {
        Strategy storage strategy = strategies[strategyId];
        require(strategy.autoRebalance, "Auto-rebalance not enabled");
        require(block.timestamp >= strategy.lastRebalance + strategy.rebalanceFrequency, "Too early to rebalance");
        
        // Auto-rebalance logic based on strategy type
        if (strategy.strategyType == StrategyType.Momentum) {
            _autoRebalanceMomentum(strategyId);
        } else if (strategy.strategyType == StrategyType.MeanReversion) {
            _autoRebalanceMeanReversion(strategyId);
        }
    }
    
    function pauseStrategy(uint256 strategyId) external onlyStrategyOwner(strategyId) {
        strategies[strategyId].status = StrategyStatus.Paused;
    }
    
    function resumeStrategy(uint256 strategyId) external onlyStrategyOwner(strategyId) {
        strategies[strategyId].status = StrategyStatus.Active;
    }
    
    function completeStrategy(uint256 strategyId) external onlyStrategyOwner(strategyId) {
        Strategy storage strategy = strategies[strategyId];
        require(strategy.status == StrategyStatus.Active, "Strategy not active");
        
        strategy.status = StrategyStatus.Completed;
        
        // Calculate final returns
        StrategyPerformance storage performance = strategyPerformance[strategyId];
        uint256 totalReturn = performance.totalReturn;
        
        emit StrategyCompleted(strategyId, strategy.totalValue, totalReturn);
    }
    
    function getStrategyInfo(uint256 strategyId) external view returns (
        address user,
        StrategyType strategyType,
        address[] memory assets,
        uint256[] memory allocations,
        uint256 totalValue,
        uint256 targetAPY,
        uint256 riskTolerance,
        StrategyStatus status,
        uint256 startTime,
        uint256 lastRebalance
    ) {
        Strategy storage strategy = strategies[strategyId];
        return (
            strategy.user,
            strategy.strategyType,
            strategy.assets,
            strategy.allocations,
            strategy.totalValue,
            strategy.targetAPY,
            strategy.riskTolerance,
            strategy.status,
            strategy.startTime,
            strategy.lastRebalance
        );
    }
    
    function getStrategyPerformance(uint256 strategyId) external view returns (
        uint256 totalReturn,
        uint256 currentAPY,
        uint256 maxDrawdown,
        uint256 sharpeRatio,
        uint256 lastUpdateTime
    ) {
        StrategyPerformance storage performance = strategyPerformance[strategyId];
        return (
            performance.totalReturn,
            performance.currentAPY,
            performance.maxDrawdown,
            performance.sharpeRatio,
            performance.lastUpdateTime
        );
    }
    
    function getUserStrategies(address user) external view returns (uint256[] memory) {
        return userStrategies[user];
    }
    
    function _executeYieldFarming(uint256 strategyId) internal {
        Strategy storage strategy = strategies[strategyId];
        
        // Yield farming logic: deposit assets into various yield protocols
        for (uint256 i = 0; i < strategy.assets.length; i++) {
            address asset = strategy.assets[i];
            uint256 allocation = strategy.allocations[i];
            
            // This would interact with actual yield protocols
            // For now, simulate yield farming
            strategy.totalValue += allocation;
        }
    }
    
    function _executeArbitrage(uint256 strategyId) internal {
        Strategy storage strategy = strategies[strategyId];
        
        // Arbitrage logic: find price differences between exchanges
        // This would require price oracle integration
        // For now, simulate arbitrage execution
        
        strategy.totalValue += strategy.totalValue * 5 / 1000; // 0.5% arbitrage profit
    }
    
    function _executeHedging(uint256 strategyId) internal {
        Strategy storage strategy = strategies[strategyId];
        
        // Hedging logic: use derivatives to hedge positions
        // This would require options/futures integration
        // For now, simulate hedging
        
        strategy.maxDrawdown = strategy.maxDrawdown * 80 / 100; // Reduce max drawdown by 20%
    }
    
    function _executeGridTrading(uint256 strategyId) internal {
        Strategy storage strategy = strategies[strategyId];
        
        // Grid trading logic: place buy/sell orders at different price levels
        // This would require AMM integration
        // For now, simulate grid trading
        
        strategy.totalValue += strategy.totalValue * 3 / 1000; // 0.3% grid trading profit
    }
    
    function _autoRebalanceMomentum(uint256 strategyId) internal {
        Strategy storage strategy = strategies[strategyId];
        
        // Momentum strategy: increase allocation to assets with positive momentum
        // This would require price trend analysis
        // For now, simulate momentum rebalancing
        
        strategy.lastRebalance = block.timestamp;
    }
    
    function _autoRebalanceMeanReversion(uint256 strategyId) internal {
        Strategy storage strategy = strategies[strategyId];
        
        // Mean reversion strategy: buy assets below average, sell above average
        // This would require statistical analysis
        // For now, simulate mean reversion rebalancing
        
        strategy.lastRebalance = block.timestamp;
    }
    
    function _updateStrategyPerformance(uint256 strategyId) internal {
        Strategy storage strategy = strategies[strategyId];
        StrategyPerformance storage performance = strategyPerformance[strategyId];
        
        // Update performance metrics
        performance.totalReturn = strategy.totalValue;
        performance.currentAPY = strategy.targetAPY;
        performance.lastUpdateTime = block.timestamp;
        
        // Calculate Sharpe ratio (simplified)
        performance.sharpeRatio = 100; // Placeholder
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract RiskManager is Ownable, Pausable {
    
    struct RiskMetrics {
        uint256 volatility; // in basis points
        uint256 correlation; // correlation with market (0-10000)
        uint256 maxDrawdown; // maximum historical drawdown
        uint256 sharpeRatio; // risk-adjusted return
        uint256 lastUpdateTime;
        bool isActive;
    }
    
    struct UserRiskProfile {
        address user;
        uint256 riskTolerance; // 1-10 scale
        uint256 maxPositionSize; // max % of portfolio in single asset
        uint256 maxLeverage; // maximum leverage allowed
        bool stopLossEnabled;
        uint256 stopLossThreshold; // in basis points
        uint256 lastUpdateTime;
    }
    
    mapping(address => RiskMetrics) public assetRiskMetrics;
    mapping(address => UserRiskProfile) public userRiskProfiles;
    mapping(address => bool) public supportedAssets;
    
    address[] public assetList;
    uint256 public totalAssets;
    
    // Risk thresholds
    uint256 public constant MAX_VOLATILITY = 10000; // 100%
    uint256 public constant MAX_CORRELATION = 10000; // 100%
    uint256 public constant MAX_RISK_TOLERANCE = 10;
    uint256 public constant MAX_POSITION_SIZE = 5000; // 50%
    
    event AssetRiskUpdated(address indexed asset, uint256 volatility, uint256 correlation);
    event UserRiskProfileUpdated(address indexed user, uint256 riskTolerance, uint256 maxPositionSize);
    event StopLossTriggered(address indexed user, address indexed asset, uint256 amount);
    
    constructor() Ownable(msg.sender) {
        totalAssets = 0;
    }
    
    modifier onlySupportedAsset(address asset) {
        require(supportedAssets[asset], "Asset not supported");
        _;
    }
    
    function addAsset(address asset) external onlyOwner {
        require(asset != address(0), "Invalid asset address");
        require(!supportedAssets[asset], "Asset already supported");
        
        supportedAssets[asset] = true;
        assetList.push(asset);
        totalAssets++;
        
        // Initialize with default risk metrics
        assetRiskMetrics[asset] = RiskMetrics({
            volatility: 2000, // 20% default
            correlation: 5000, // 50% default
            maxDrawdown: 1000, // 10% default
            sharpeRatio: 100, // 1.0 default
            lastUpdateTime: block.timestamp,
            isActive: true
        });
    }
    
    function updateAssetRiskMetrics(
        address asset,
        uint256 volatility,
        uint256 correlation,
        uint256 maxDrawdown,
        uint256 sharpeRatio
    ) external onlyOwner onlySupportedAsset(asset) {
        require(volatility <= MAX_VOLATILITY, "Volatility too high");
        require(correlation <= MAX_CORRELATION, "Correlation too high");
        
        RiskMetrics storage metrics = assetRiskMetrics[asset];
        metrics.volatility = volatility;
        metrics.correlation = correlation;
        metrics.maxDrawdown = maxDrawdown;
        metrics.sharpeRatio = sharpeRatio;
        metrics.lastUpdateTime = block.timestamp;
        
        emit AssetRiskUpdated(asset, volatility, correlation);
    }
    
    function setUserRiskProfile(
        uint256 riskTolerance,
        uint256 maxPositionSize,
        uint256 maxLeverage,
        bool stopLossEnabled,
        uint256 stopLossThreshold
    ) external {
        require(riskTolerance >= 1 && riskTolerance <= MAX_RISK_TOLERANCE, "Invalid risk tolerance");
        require(maxPositionSize <= MAX_POSITION_SIZE, "Position size too high");
        require(maxLeverage <= 10, "Leverage too high");
        require(stopLossThreshold <= 5000, "Stop loss too high"); // Max 50%
        
        UserRiskProfile storage profile = userRiskProfiles[msg.sender];
        profile.user = msg.sender;
        profile.riskTolerance = riskTolerance;
        profile.maxPositionSize = maxPositionSize;
        profile.maxLeverage = maxLeverage;
        profile.stopLossEnabled = stopLossEnabled;
        profile.stopLossThreshold = stopLossThreshold;
        profile.lastUpdateTime = block.timestamp;
        
        emit UserRiskProfileUpdated(msg.sender, riskTolerance, maxPositionSize);
    }
    
    function calculateAssetRisk(address asset) external view onlySupportedAsset(asset) returns (uint256 riskScore) {
        RiskMetrics storage metrics = assetRiskMetrics[asset];
        
        // Calculate risk score based on multiple factors
        uint256 volatilityScore = (metrics.volatility * 40) / 100; // 40% weight
        uint256 correlationScore = (metrics.correlation * 30) / 100; // 30% weight
        uint256 drawdownScore = (metrics.maxDrawdown * 20) / 100; // 20% weight
        uint256 sharpeScore = (10000 - metrics.sharpeRatio * 10) / 100; // 10% weight
        
        riskScore = (volatilityScore + correlationScore + drawdownScore + sharpeScore) / 100;
        
        // Normalize to 1-10 scale
        riskScore = (riskScore * 10) / 10000;
        if (riskScore == 0) riskScore = 1;
        if (riskScore > 10) riskScore = 10;
        
        return riskScore;
    }
    

    
    function getUserRiskProfile(address user) external view returns (
        uint256 riskTolerance,
        uint256 maxPositionSize,
        uint256 maxLeverage,
        bool stopLossEnabled,
        uint256 stopLossThreshold,
        uint256 lastUpdateTime
    ) {
        UserRiskProfile storage profile = userRiskProfiles[user];
        return (
            profile.riskTolerance,
            profile.maxPositionSize,
            profile.maxLeverage,
            profile.stopLossEnabled,
            profile.stopLossThreshold,
            profile.lastUpdateTime
        );
    }
    
    function calculateRiskAdjustedAPY(
        address asset,
        uint256 baseAPY
    ) external view onlySupportedAsset(asset) returns (uint256 riskAdjustedAPY) {
        uint256 riskScore = this.calculateAssetRisk(asset);
        
        // Risk adjustment: higher risk = lower risk-adjusted APY
        uint256 riskAdjustment = (10000 - (riskScore * 1000)) / 100; // 0-90% adjustment
        
        riskAdjustedAPY = (baseAPY * riskAdjustment) / 100;
        
        return riskAdjustedAPY;
    }
    
    function checkPositionRisk(
        address user,
        address asset,
        uint256 positionSize,
        uint256 portfolioValue
    ) external view returns (bool isAcceptable, string memory reason) {
        if (!supportedAssets[asset]) {
            return (false, "Asset not supported");
        }
        
        UserRiskProfile storage profile = userRiskProfiles[user];
        if (profile.user == address(0)) {
            return (false, "User risk profile not set");
        }
        
        // Check position size limit
        uint256 positionPercentage = (positionSize * 10000) / portfolioValue;
        if (positionPercentage > profile.maxPositionSize) {
            return (false, "Position size exceeds limit");
        }
        
        // Check risk tolerance vs asset risk
        uint256 assetRisk = this.calculateAssetRisk(asset);
        if (assetRisk > profile.riskTolerance) {
            return (false, "Asset risk exceeds tolerance");
        }
        
        return (true, "Position risk acceptable");
    }
    
    function calculatePortfolioRisk(address user) external view returns (
        uint256 totalRisk,
        uint256 weightedRisk,
        uint256 diversificationScore
    ) {
        UserRiskProfile storage profile = userRiskProfiles[user];
        if (profile.user == address(0)) {
            return (0, 0, 0);
        }
        
        // This would typically calculate portfolio-level risk metrics
        // For now, return basic metrics
        totalRisk = profile.riskTolerance;
        weightedRisk = profile.riskTolerance;
        diversificationScore = 5000; // 50% default
        
        return (totalRisk, weightedRisk, diversificationScore);
    }
    
    function emergencyStopLoss(
        address user,
        address asset,
        uint256 amount
    ) external onlyOwner {
        UserRiskProfile storage profile = userRiskProfiles[user];
        require(profile.stopLossEnabled, "Stop loss not enabled");
        
        // Trigger stop loss logic
        emit StopLossTriggered(user, asset, amount);
    }
    
    function getSupportedAssets() external view returns (address[] memory) {
        return assetList;
    }
    
    function removeAsset(address asset) external onlyOwner onlySupportedAsset(asset) {
        supportedAssets[asset] = false;
        assetRiskMetrics[asset].isActive = false;
        
        // Remove from asset list
        for (uint256 i = 0; i < assetList.length; i++) {
            if (assetList[i] == asset) {
                assetList[i] = assetList[assetList.length - 1];
                assetList.pop();
                break;
            }
        }
        
        totalAssets--;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Additional features from UI
    struct RiskAlert {
        address user;
        address asset;
        uint256 riskLevel;
        string alertType;
        uint256 timestamp;
        bool isActive;
    }
    
    mapping(address => RiskAlert[]) public userRiskAlerts;
    mapping(address => uint256) public userRiskScore;
    
    function getRiskAlerts(address user) external view returns (RiskAlert[] memory) {
        return userRiskAlerts[user];
    }
    
    function getUserRiskScore(address user) external view returns (uint256) {
        return userRiskScore[user];
    }
    
    function getRiskMetrics(address asset) external view onlySupportedAsset(asset) returns (
        uint256 volatility,
        uint256 correlation,
        uint256 maxDrawdown,
        uint256 sharpeRatio,
        uint256 lastUpdateTime,
        uint256 marketCap,
        uint256 volume24h
    ) {
        RiskMetrics storage metrics = assetRiskMetrics[asset];
        return (
            metrics.volatility,
            metrics.correlation,
            metrics.maxDrawdown,
            metrics.sharpeRatio,
            metrics.lastUpdateTime,
            0, // marketCap would need price oracle integration
            0  // volume24h would need trading data
        );
    }
    
    function setRiskAlert(
        address asset,
        uint256 riskThreshold,
        string memory alertType
    ) external {
        UserRiskProfile storage profile = userRiskProfiles[msg.sender];
        require(profile.user != address(0), "Risk profile not set");
        
        RiskAlert memory alert = RiskAlert({
            user: msg.sender,
            asset: asset,
            riskLevel: riskThreshold,
            alertType: alertType,
            timestamp: block.timestamp,
            isActive: true
        });
        
        userRiskAlerts[msg.sender].push(alert);
    }
    
    function getRiskComparison(address asset1, address asset2) external view returns (
        uint256 risk1,
        uint256 risk2,
        uint256 correlation,
        string memory recommendation
    ) {
        risk1 = this.calculateAssetRisk(asset1);
        risk2 = this.calculateAssetRisk(asset2);
        
        // Get correlation between assets
        RiskMetrics storage metrics1 = assetRiskMetrics[asset1];
        RiskMetrics storage metrics2 = assetRiskMetrics[asset2];
        correlation = (metrics1.correlation + metrics2.correlation) / 2;
        
        // Simple recommendation logic
        if (risk1 < risk2) {
            recommendation = "Asset 1 is lower risk";
        } else if (risk2 < risk1) {
            recommendation = "Asset 2 is lower risk";
        } else {
            recommendation = "Both assets have similar risk";
        }
        
        return (risk1, risk2, correlation, recommendation);
    }
    
    function getRiskAdjustedMetrics(address asset, uint256 baseAPY) external view returns (
        uint256 riskAdjustedAPY,
        uint256 riskScore,
        uint256 volatility,
        uint256 sharpeRatio
    ) {
        riskScore = this.calculateAssetRisk(asset);
        RiskMetrics storage metrics = assetRiskMetrics[asset];
        
        // Risk adjustment: higher risk = lower risk-adjusted APY
        uint256 riskAdjustment = (10000 - (riskScore * 1000)) / 100; // 0-90% adjustment
        riskAdjustedAPY = (baseAPY * riskAdjustment) / 100;
        
        return (riskAdjustedAPY, riskScore, metrics.volatility, metrics.sharpeRatio);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract AnalyticsEngine is Ownable, Pausable {
    
    struct MarketStats {
        uint256 totalTVL;
        uint256 totalVolume24h;
        uint256 totalUsers;
        uint256 totalTransactions;
        uint256 averageAPY;
        uint256 lastUpdateTime;
    }
    
    struct AssetAnalytics {
        address asset;
        uint256 price;
        uint256 volume24h;
        uint256 marketCap;
        uint256 apy;
        uint256 volatility;
        uint256 lastUpdateTime;
    }
    
    struct UserAnalytics {
        address user;
        uint256 totalValue;
        uint256 totalAPY;
        uint256 totalRisk;
        uint256 transactionCount;
        uint256 lastActivity;
        uint256 portfolioGrowth;
    }
    
    struct PerformanceMetrics {
        uint256 dailyReturn;
        uint256 weeklyReturn;
        uint256 monthlyReturn;
        uint256 yearlyReturn;
        uint256 sharpeRatio;
        uint256 maxDrawdown;
        uint256 lastUpdateTime;
    }
    
    mapping(address => MarketStats) public marketStats;
    mapping(address => AssetAnalytics) public assetAnalytics;
    mapping(address => UserAnalytics) public userAnalytics;
    mapping(address => PerformanceMetrics) public userPerformance;
    mapping(address => bool) public supportedAssets;
    
    address[] public assetList;
    uint256 public totalAssets;
    
    event MarketStatsUpdated(address indexed asset, uint256 tvl, uint256 volume, uint256 users);
    event AssetAnalyticsUpdated(address indexed asset, uint256 price, uint256 volume, uint256 apy);
    event UserAnalyticsUpdated(address indexed user, uint256 totalValue, uint256 totalAPY);
    
    modifier onlySupportedAsset(address asset) {
        require(supportedAssets[asset], "Asset not supported");
        _;
    }
    
    constructor() Ownable(msg.sender) {
        totalAssets = 0;
    }
    
    function addAsset(address asset) external onlyOwner {
        require(asset != address(0), "Invalid asset address");
        require(!supportedAssets[asset], "Asset already supported");
        
        supportedAssets[asset] = true;
        assetList.push(asset);
        totalAssets++;
        
        // Initialize analytics
        assetAnalytics[asset] = AssetAnalytics({
            asset: asset,
            price: 0,
            volume24h: 0,
            marketCap: 0,
            apy: 0,
            volatility: 0,
            lastUpdateTime: block.timestamp
        });
    }
    
    function updateMarketStats(
        address asset,
        uint256 tvl,
        uint256 volume24h,
        uint256 users,
        uint256 transactions
    ) external onlyOwner onlySupportedAsset(asset) {
        marketStats[asset] = MarketStats({
            totalTVL: tvl,
            totalVolume24h: volume24h,
            totalUsers: users,
            totalTransactions: transactions,
            averageAPY: 0, // Would be calculated from asset data
            lastUpdateTime: block.timestamp
        });
        
        emit MarketStatsUpdated(asset, tvl, volume24h, users);
    }
    
    function updateAssetAnalytics(
        address asset,
        uint256 price,
        uint256 volume24h,
        uint256 marketCap,
        uint256 apy,
        uint256 volatility
    ) external onlyOwner onlySupportedAsset(asset) {
        assetAnalytics[asset] = AssetAnalytics({
            asset: asset,
            price: price,
            volume24h: volume24h,
            marketCap: marketCap,
            apy: apy,
            volatility: volatility,
            lastUpdateTime: block.timestamp
        });
        
        emit AssetAnalyticsUpdated(asset, price, volume24h, apy);
    }
    
    function updateUserAnalytics(
        address user,
        uint256 totalValue,
        uint256 totalAPY,
        uint256 totalRisk,
        uint256 transactionCount
    ) external onlyOwner {
        userAnalytics[user] = UserAnalytics({
            user: user,
            totalValue: totalValue,
            totalAPY: totalAPY,
            totalRisk: totalRisk,
            transactionCount: transactionCount,
            lastActivity: block.timestamp,
            portfolioGrowth: 0 // Would be calculated over time
        });
        
        emit UserAnalyticsUpdated(user, totalValue, totalAPY);
    }
    
    function updateUserPerformance(
        address user,
        uint256 dailyReturn,
        uint256 weeklyReturn,
        uint256 monthlyReturn,
        uint256 yearlyReturn,
        uint256 sharpeRatio,
        uint256 maxDrawdown
    ) external onlyOwner {
        userPerformance[user] = PerformanceMetrics({
            dailyReturn: dailyReturn,
            weeklyReturn: weeklyReturn,
            monthlyReturn: monthlyReturn,
            yearlyReturn: yearlyReturn,
            sharpeRatio: sharpeRatio,
            maxDrawdown: maxDrawdown,
            lastUpdateTime: block.timestamp
        });
    }
    
    function getMarketStats(address asset) external view onlySupportedAsset(asset) returns (
        uint256 totalTVL,
        uint256 totalVolume24h,
        uint256 totalUsers,
        uint256 totalTransactions,
        uint256 averageAPY,
        uint256 lastUpdateTime
    ) {
        MarketStats storage stats = marketStats[asset];
        return (
            stats.totalTVL,
            stats.totalVolume24h,
            stats.totalUsers,
            stats.totalTransactions,
            stats.averageAPY,
            stats.lastUpdateTime
        );
    }
    
    function getAssetAnalytics(address asset) external view onlySupportedAsset(asset) returns (
        uint256 price,
        uint256 volume24h,
        uint256 marketCap,
        uint256 apy,
        uint256 volatility,
        uint256 lastUpdateTime
    ) {
        AssetAnalytics storage analytics = assetAnalytics[asset];
        return (
            analytics.price,
            analytics.volume24h,
            analytics.marketCap,
            analytics.apy,
            analytics.volatility,
            analytics.lastUpdateTime
        );
    }
    
    function getUserAnalytics(address user) external view returns (
        uint256 totalValue,
        uint256 totalAPY,
        uint256 totalRisk,
        uint256 transactionCount,
        uint256 lastActivity,
        uint256 portfolioGrowth
    ) {
        UserAnalytics storage analytics = userAnalytics[user];
        return (
            analytics.totalValue,
            analytics.totalAPY,
            analytics.totalRisk,
            analytics.transactionCount,
            analytics.lastActivity,
            analytics.portfolioGrowth
        );
    }
    
    function getUserPerformance(address user) external view returns (
        uint256 dailyReturn,
        uint256 weeklyReturn,
        uint256 monthlyReturn,
        uint256 yearlyReturn,
        uint256 sharpeRatio,
        uint256 maxDrawdown,
        uint256 lastUpdateTime
    ) {
        PerformanceMetrics storage performance = userPerformance[user];
        return (
            performance.dailyReturn,
            performance.weeklyReturn,
            performance.monthlyReturn,
            performance.yearlyReturn,
            performance.sharpeRatio,
            performance.maxDrawdown,
            performance.lastUpdateTime
        );
    }
    
    function getGlobalStats() external view returns (
        uint256 totalTVL,
        uint256 totalVolume24h,
        uint256 totalUsers,
        uint256 totalAssets,
        uint256 averageAPY
    ) {
        totalTVL = 0;
        totalVolume24h = 0;
        totalUsers = 0;
        averageAPY = 0;
        
        for (uint256 i = 0; i < assetList.length; i++) {
            address asset = assetList[i];
            if (supportedAssets[asset]) {
                MarketStats storage stats = marketStats[asset];
                totalTVL += stats.totalTVL;
                totalVolume24h += stats.totalVolume24h;
                totalUsers += stats.totalUsers;
                
                AssetAnalytics storage analytics = assetAnalytics[asset];
                averageAPY += analytics.apy;
            }
        }
        
        if (totalAssets > 0) {
            averageAPY = averageAPY / totalAssets;
        }
        
        return (totalTVL, totalVolume24h, totalUsers, totalAssets, averageAPY);
    }
    
    function getTopPerformers(uint256 limit) external view returns (
        address[] memory users,
        uint256[] memory values,
        uint256[] memory apys
    ) {
        // This would require additional storage and logic to track top performers
        // For now, return empty arrays
        return (new address[](0), new uint256[](0), new uint256[](0));
    }
    
    function getAssetPerformance(address asset, uint256 timeframe) external view returns (
        uint256[] memory prices,
        uint256[] memory volumes,
        uint256[] memory timestamps
    ) {
        // This would require historical data storage
        // For now, return empty arrays
        return (new uint256[](0), new uint256[](0), new uint256[](0));
    }
    
    function calculateImpermanentLoss(
        address asset,
        uint256 initialValue,
        uint256 currentValue
    ) external pure returns (uint256 loss) {
        if (currentValue >= initialValue) {
            return 0;
        }
        
        loss = ((initialValue - currentValue) * 10000) / initialValue;
        return loss;
    }
    
    function getYieldCurve(address asset) external view returns (
        uint256[] memory apys,
        uint256[] memory durations
    ) {
        // This would require yield curve data
        // For now, return empty arrays
        return (new uint256[](0), new uint256[](0));
    }
    
    function getSupportedAssets() external view returns (address[] memory) {
        return assetList;
    }
    
    function removeAsset(address asset) external onlyOwner onlySupportedAsset(asset) {
        supportedAssets[asset] = false;
        
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
    
    function batchUpdateAnalytics(
        address[] calldata assets,
        uint256[] calldata prices,
        uint256[] calldata volumes,
        uint256[] calldata apys
    ) external onlyOwner {
        require(
            assets.length == prices.length &&
            prices.length == volumes.length &&
            volumes.length == apys.length,
            "Array lengths mismatch"
        );
        
        for (uint256 i = 0; i < assets.length; i++) {
            if (supportedAssets[assets[i]]) {
                AssetAnalytics storage analytics = assetAnalytics[assets[i]];
                analytics.price = prices[i];
                analytics.volume24h = volumes[i];
                analytics.apy = apys[i];
                analytics.lastUpdateTime = block.timestamp;
                
                emit AssetAnalyticsUpdated(assets[i], prices[i], volumes[i], apys[i]);
            }
        }
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}

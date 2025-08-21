// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract PortfolioTracker is Ownable, Pausable {
    
    struct Asset {
        address token;
        string symbol;
        string name;
        uint256 decimals;
        bool isActive;
        uint256 riskLevel; // 1-10 scale
        uint256 apy;
        uint256 lastUpdateTime;
    }
    
    struct UserPosition {
        address token;
        uint256 balance;
        uint256 usdValue;
        uint256 apy;
        uint256 riskLevel;
        uint256 lastUpdateTime;
    }
    
    struct Portfolio {
        address user;
        uint256 totalValue;
        uint256 totalAPY;
        uint256 totalRisk;
        uint256 lastUpdateTime;
        UserPosition[] positions;
    }
    
    mapping(address => Asset) public supportedAssets;
    mapping(address => mapping(address => UserPosition)) public userPositions;
    mapping(address => Portfolio) public userPortfolios;
    mapping(address => bool) public isAssetSupported;
    
    address[] public assetList;
    uint256 public totalAssets;
    
    event AssetAdded(address indexed token, string symbol, string name);
    event AssetUpdated(address indexed token, uint256 apy, uint256 riskLevel);
    event PositionUpdated(address indexed user, address indexed token, uint256 balance, uint256 usdValue);
    event PortfolioUpdated(address indexed user, uint256 totalValue, uint256 totalAPY);
    
    constructor() Ownable(msg.sender) {
        totalAssets = 0;
    }
    
    modifier onlySupportedAsset(address token) {
        require(isAssetSupported[token], "Asset not supported");
        _;
    }
    
    function addAsset(
        address token,
        string memory symbol,
        string memory name,
        uint256 decimals,
        uint256 riskLevel,
        uint256 apy
    ) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(!isAssetSupported[token], "Asset already supported");
        require(riskLevel >= 1 && riskLevel <= 10, "Invalid risk level");
        
        supportedAssets[token] = Asset({
            token: token,
            symbol: symbol,
            name: name,
            decimals: decimals,
            isActive: true,
            riskLevel: riskLevel,
            apy: apy,
            lastUpdateTime: block.timestamp
        });
        
        isAssetSupported[token] = true;
        assetList.push(token);
        totalAssets++;
        
        emit AssetAdded(token, symbol, name);
    }
    
    function updateAsset(
        address token,
        uint256 newAPY,
        uint256 newRiskLevel
    ) external onlyOwner onlySupportedAsset(token) {
        require(newRiskLevel >= 1 && newRiskLevel <= 10, "Invalid risk level");
        
        Asset storage asset = supportedAssets[token];
        asset.apy = newAPY;
        asset.riskLevel = newRiskLevel;
        asset.lastUpdateTime = block.timestamp;
        
        emit AssetUpdated(token, newAPY, newRiskLevel);
    }
    
    function updateUserPosition(
        address user,
        address token,
        uint256 balance,
        uint256 usdValue
    ) public onlySupportedAsset(token) {
        Asset storage asset = supportedAssets[token];
        
        UserPosition storage position = userPositions[user][token];
        position.token = token;
        position.balance = balance;
        position.usdValue = usdValue;
        position.apy = asset.apy;
        position.riskLevel = asset.riskLevel;
        position.lastUpdateTime = block.timestamp;
        
        emit PositionUpdated(user, token, balance, usdValue);
        
        _updateUserPortfolio(user);
    }
    
    function getUserPortfolio(address user) external view returns (
        uint256 totalValue,
        uint256 totalAPY,
        uint256 totalRisk,
        uint256 lastUpdateTime,
        uint256 positionCount
    ) {
        Portfolio storage portfolio = userPortfolios[user];
        return (
            portfolio.totalValue,
            portfolio.totalAPY,
            portfolio.totalRisk,
            portfolio.lastUpdateTime,
            portfolio.positions.length
        );
    }
    
    function getUserPositions(address user) external view returns (UserPosition[] memory) {
        Portfolio storage portfolio = userPortfolios[user];
        return portfolio.positions;
    }
    
    function calculateTotalValue(address user) external view returns (uint256) {
        uint256 totalValue = 0;
        
        for (uint256 i = 0; i < assetList.length; i++) {
            address token = assetList[i];
            if (isAssetSupported[token]) {
                UserPosition storage position = userPositions[user][token];
                totalValue += position.usdValue;
            }
        }
        
        return totalValue;
    }
    
    function getAssetAPY(address token) external view onlySupportedAsset(token) returns (uint256) {
        return supportedAssets[token].apy;
    }
    
    function getRiskLevel(address token) external view onlySupportedAsset(token) returns (uint256) {
        return supportedAssets[token].riskLevel;
    }
    
    function getAssetInfo(address token) external view onlySupportedAsset(token) returns (
        string memory symbol,
        string memory name,
        uint256 decimals,
        bool isActive,
        uint256 riskLevel,
        uint256 apy,
        uint256 lastUpdateTime
    ) {
        Asset storage asset = supportedAssets[token];
        return (
            asset.symbol,
            asset.name,
            asset.decimals,
            asset.isActive,
            asset.riskLevel,
            asset.apy,
            asset.lastUpdateTime
        );
    }
    
    function getSupportedAssets() external view returns (address[] memory) {
        return assetList;
    }
    
    function _updateUserPortfolio(address user) internal {
        Portfolio storage portfolio = userPortfolios[user];
        portfolio.user = user;
        portfolio.totalValue = 0;
        portfolio.totalAPY = 0;
        portfolio.totalRisk = 0;
        
        // Clear existing positions
        delete portfolio.positions;
        
        uint256 totalWeightedAPY = 0;
        uint256 totalWeightedRisk = 0;
        
        for (uint256 i = 0; i < assetList.length; i++) {
            address token = assetList[i];
            if (isAssetSupported[token]) {
                UserPosition storage position = userPositions[user][token];
                
                if (position.balance > 0) {
                    portfolio.totalValue += position.usdValue;
                    totalWeightedAPY += position.usdValue * position.apy;
                    totalWeightedRisk += position.usdValue * position.riskLevel;
                    
                    portfolio.positions.push(position);
                }
            }
        }
        
        if (portfolio.totalValue > 0) {
            portfolio.totalAPY = totalWeightedAPY / portfolio.totalValue;
            portfolio.totalRisk = totalWeightedRisk / portfolio.totalValue;
        }
        
        portfolio.lastUpdateTime = block.timestamp;
        
        emit PortfolioUpdated(user, portfolio.totalValue, portfolio.totalAPY);
    }
    
    function batchUpdatePositions(
        address[] calldata users,
        address[] calldata tokens,
        uint256[] calldata balances,
        uint256[] calldata usdValues
    ) external onlyOwner {
        require(
            users.length == tokens.length &&
            tokens.length == balances.length &&
            balances.length == usdValues.length,
            "Array lengths mismatch"
        );
        
        for (uint256 i = 0; i < users.length; i++) {
            updateUserPosition(users[i], tokens[i], balances[i], usdValues[i]);
        }
    }
    
    function removeAsset(address token) external onlyOwner onlySupportedAsset(token) {
        require(isAssetSupported[token], "Asset not supported");
        
        isAssetSupported[token] = false;
        supportedAssets[token].isActive = false;
        
        // Remove from asset list
        for (uint256 i = 0; i < assetList.length; i++) {
            if (assetList[i] == token) {
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
    
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }
    
    // Additional features from UI
    struct PortfolioMetrics {
        uint256 totalValue;
        uint256 totalAPY;
        uint256 totalRisk;
        uint256 dailyChange;
        uint256 weeklyChange;
        uint256 monthlyChange;
        uint256 lastUpdateTime;
    }
    
    mapping(address => PortfolioMetrics) public userPortfolioMetrics;
    
    function getPortfolioMetrics(address user) external view returns (PortfolioMetrics memory) {
        return userPortfolioMetrics[user];
    }
    
    function getPortfolioPerformance(address user, uint256 timeframe) external view returns (
        uint256[] memory values,
        uint256[] memory timestamps
    ) {
        // Return portfolio performance over time
        return (new uint256[](0), new uint256[](0));
    }
    
    function getAssetAllocation(address user) external view returns (
        address[] memory tokens,
        uint256[] memory percentages
    ) {
        Portfolio storage portfolio = userPortfolios[user];
        tokens = new address[](portfolio.positions.length);
        percentages = new uint256[](portfolio.positions.length);
        
        for (uint256 i = 0; i < portfolio.positions.length; i++) {
            tokens[i] = portfolio.positions[i].token;
            if (portfolio.totalValue > 0) {
                percentages[i] = (portfolio.positions[i].usdValue * 10000) / portfolio.totalValue;
            }
        }
        
        return (tokens, percentages);
    }
    
    function getPortfolioRiskScore(address user) external view returns (uint256 riskScore) {
        Portfolio storage portfolio = userPortfolios[user];
        if (portfolio.totalValue == 0) return 0;
        
        // Calculate weighted risk score
        uint256 totalWeightedRisk = 0;
        for (uint256 i = 0; i < portfolio.positions.length; i++) {
            uint256 weight = (portfolio.positions[i].usdValue * 10000) / portfolio.totalValue;
            totalWeightedRisk += portfolio.positions[i].riskLevel * weight;
        }
        
        riskScore = totalWeightedRisk / 10000;
        return riskScore;
    }
    
    function getPortfolioAPY(address user) external view returns (uint256 weightedAPY) {
        Portfolio storage portfolio = userPortfolios[user];
        if (portfolio.totalValue == 0) return 0;
        
        // Calculate weighted APY
        uint256 totalWeightedRisk = 0;
        for (uint256 i = 0; i < portfolio.positions.length; i++) {
            uint256 weight = (portfolio.positions[i].usdValue * 10000) / portfolio.totalValue;
            totalWeightedRisk += portfolio.positions[i].apy * weight;
        }
        
        weightedAPY = totalWeightedRisk / 10000;
        return weightedAPY;
    }
    
    function getPortfolioSummary(address user) external view returns (
        uint256 totalValue,
        uint256 totalAPY,
        uint256 totalRisk,
        uint256 assetCount,
        uint256 lastUpdateTime
    ) {
        Portfolio storage portfolio = userPortfolios[user];
        return (
            portfolio.totalValue,
            portfolio.totalAPY,
            portfolio.totalRisk,
            portfolio.positions.length,
            portfolio.lastUpdateTime
        );
    }
}

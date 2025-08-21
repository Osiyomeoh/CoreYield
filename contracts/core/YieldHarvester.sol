// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract YieldHarvester is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;
    
    struct YieldStrategy {
        address asset;
        bool isActive;
        uint256 harvestThreshold;
        uint256 autoCompoundThreshold;
        uint256 lastHarvestTime;
        uint256 totalHarvested;
        uint256 harvestFee; // in basis points
        uint256 strategyType; // 1: Manual, 2: Auto-compound, 3: Reinvest
        uint256 minHarvestInterval; // in seconds
        uint256 maxHarvestInterval; // in seconds
    }
    
    struct UserYield {
        address user;
        address asset;
        uint256 pendingYield;
        uint256 lastHarvestTime;
        uint256 totalHarvested;
        bool autoCompoundEnabled;
    }
    
    mapping(address => YieldStrategy) public yieldStrategies;
    mapping(address => mapping(address => UserYield)) public userYields;
    mapping(address => bool) public supportedAssets;
    
    address[] public assetList;
    uint256 public totalAssets;
    uint256 public defaultHarvestFee = 100; // 1%
    
    event StrategyCreated(address indexed asset, uint256 harvestThreshold, uint256 autoCompoundThreshold);
    event YieldHarvested(address indexed user, address indexed asset, uint256 amount, uint256 timestamp);
    event AutoCompoundExecuted(address indexed user, address indexed asset, uint256 amount, uint256 timestamp);
    event StrategyUpdated(address indexed asset, uint256 newThreshold, uint256 newFee);
    event PendingYieldAdded(address indexed user, address indexed asset, uint256 amount, uint256 timestamp);
    
    constructor() Ownable(msg.sender) {
        totalAssets = 0;
    }
    
    modifier onlySupportedAsset(address asset) {
        require(supportedAssets[asset], "Asset not supported");
        _;
    }
    
    function createYieldStrategy(
        address asset,
        uint256 harvestThreshold,
        uint256 autoCompoundThreshold
    ) external onlyOwner {
        require(asset != address(0), "Invalid asset address");
        require(!supportedAssets[asset], "Strategy already exists");
        require(harvestThreshold > 0, "Invalid harvest threshold");
        
        yieldStrategies[asset] = YieldStrategy({
            asset: asset,
            isActive: true,
            harvestThreshold: harvestThreshold,
            autoCompoundThreshold: autoCompoundThreshold,
            lastHarvestTime: block.timestamp,
            totalHarvested: 0,
            harvestFee: defaultHarvestFee,
            strategyType: 1, // Default to manual
            minHarvestInterval: 3600, // Default 1 hour
            maxHarvestInterval: 86400 // Default 1 day
        });
        
        supportedAssets[asset] = true;
        assetList.push(asset);
        totalAssets++;
        
        emit StrategyCreated(asset, harvestThreshold, autoCompoundThreshold);
    }
    
    function harvestYield(address asset) external nonReentrant whenNotPaused onlySupportedAsset(asset) {
        YieldStrategy storage strategy = yieldStrategies[asset];
        require(strategy.isActive, "Strategy not active");
        
        UserYield storage userYield = userYields[msg.sender][asset];
        uint256 harvestableAmount = getHarvestableYield(msg.sender, asset);
        
        require(harvestableAmount >= strategy.harvestThreshold, "Below harvest threshold");
        
        // Calculate fee
        uint256 fee = (harvestableAmount * strategy.harvestFee) / 10000;
        uint256 netAmount = harvestableAmount - fee;
        
        // Update user yield info
        userYield.pendingYield = 0;
        userYield.lastHarvestTime = block.timestamp;
        userYield.totalHarvested += netAmount;
        
        // Update strategy totals
        strategy.totalHarvested += harvestableAmount;
        strategy.lastHarvestTime = block.timestamp;
        
        // Transfer yield to user
        IERC20(asset).safeTransfer(msg.sender, netAmount);
        
        // Transfer fee to treasury
        if (fee > 0) {
            IERC20(asset).safeTransfer(owner(), fee);
        }
        
        emit YieldHarvested(msg.sender, asset, netAmount, block.timestamp);
    }
    
    // Test function to add pending yield (for testing purposes)
    function addPendingYieldForTesting(address user, address asset, uint256 amount) external onlyOwner {
        require(supportedAssets[asset], "Asset not supported");
        
        // Add pending yield to user's strategy
        userYields[user][asset].pendingYield += amount;
        
        emit PendingYieldAdded(user, asset, amount, block.timestamp);
    }
    
    function autoCompound(address asset) external nonReentrant whenNotPaused onlySupportedAsset(asset) {
        YieldStrategy storage strategy = yieldStrategies[asset];
        require(strategy.isActive, "Strategy not active");
        
        UserYield storage userYield = userYields[msg.sender][asset];
        require(userYield.autoCompoundEnabled, "Auto-compound not enabled");
        
        uint256 harvestableAmount = getHarvestableYield(msg.sender, asset);
        require(harvestableAmount >= strategy.autoCompoundThreshold, "Below auto-compound threshold");
        
        // Reset pending yield
        userYield.pendingYield = 0;
        userYield.lastHarvestTime = block.timestamp;
        
        // Update strategy totals
        strategy.totalHarvested += harvestableAmount;
        strategy.lastHarvestTime = block.timestamp;
        
        // Auto-compound logic: reinvest the yield
        // This would typically involve calling a deposit/invest function
        // For now, we'll just track it
        userYield.totalHarvested += harvestableAmount;
        
        emit AutoCompoundExecuted(msg.sender, asset, harvestableAmount, block.timestamp);
    }
    
    function enableAutoCompound(address asset) external onlySupportedAsset(asset) {
        UserYield storage userYield = userYields[msg.sender][asset];
        userYield.autoCompoundEnabled = true;
        userYield.user = msg.sender;
        userYield.asset = asset;
    }
    
    function disableAutoCompound(address asset) external onlySupportedAsset(asset) {
        UserYield storage userYield = userYields[msg.sender][asset];
        userYield.autoCompoundEnabled = false;
    }
    
    function updatePendingYield(
        address user,
        address asset,
        uint256 newAmount
    ) public onlySupportedAsset(asset) {
        UserYield storage userYield = userYields[user][asset];
        
        if (userYield.user == address(0)) {
            userYield.user = user;
            userYield.asset = asset;
        }
        
        userYield.pendingYield = newAmount;
    }
    
    function getHarvestableYield(address user, address asset) public view returns (uint256) {
        if (!supportedAssets[asset]) return 0;
        
        UserYield storage userYield = userYields[user][asset];
        return userYield.pendingYield;
    }
    
    function getUserYieldInfo(address user, address asset) external view returns (
        uint256 pendingYield,
        uint256 lastHarvestTime,
        uint256 totalHarvested,
        bool autoCompoundEnabled
    ) {
        UserYield storage userYield = userYields[user][asset];
        return (
            userYield.pendingYield,
            userYield.lastHarvestTime,
            userYield.totalHarvested,
            userYield.autoCompoundEnabled
        );
    }
    
    function getStrategyInfo(address asset) external view onlySupportedAsset(asset) returns (
        bool isActive,
        uint256 harvestThreshold,
        uint256 autoCompoundThreshold,
        uint256 lastHarvestTime,
        uint256 totalHarvested,
        uint256 harvestFee
    ) {
        YieldStrategy storage strategy = yieldStrategies[asset];
        return (
            strategy.isActive,
            strategy.harvestThreshold,
            strategy.autoCompoundThreshold,
            strategy.lastHarvestTime,
            strategy.totalHarvested,
            strategy.harvestFee
        );
    }
    
    function updateStrategy(
        address asset,
        uint256 newHarvestThreshold,
        uint256 newAutoCompoundThreshold,
        uint256 newHarvestFee
    ) external onlyOwner onlySupportedAsset(asset) {
        require(newHarvestThreshold > 0, "Invalid harvest threshold");
        require(newHarvestFee <= 1000, "Fee too high"); // Max 10%
        
        YieldStrategy storage strategy = yieldStrategies[asset];
        strategy.harvestThreshold = newHarvestThreshold;
        strategy.autoCompoundThreshold = newAutoCompoundThreshold;
        strategy.harvestFee = newHarvestFee;
        
        emit StrategyUpdated(asset, newHarvestThreshold, newHarvestFee);
    }
    
    function setDefaultHarvestFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee too high"); // Max 10%
        defaultHarvestFee = newFee;
    }
    
    function pauseStrategy(address asset) external onlyOwner onlySupportedAsset(asset) {
        yieldStrategies[asset].isActive = false;
    }
    
    function resumeStrategy(address asset) external onlyOwner onlySupportedAsset(asset) {
        yieldStrategies[asset].isActive = true;
    }
    
    function removeStrategy(address asset) external onlyOwner onlySupportedAsset(asset) {
        supportedAssets[asset] = false;
        yieldStrategies[asset].isActive = false;
        
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
    
    function getSupportedAssets() external view returns (address[] memory) {
        return assetList;
    }
    
    function batchUpdateYields(
        address[] calldata users,
        address[] calldata assets,
        uint256[] calldata amounts
    ) external onlyOwner {
        require(
            users.length == assets.length &&
            assets.length == amounts.length,
            "Array lengths mismatch"
        );
        
        for (uint256 i = 0; i < users.length; i++) {
            if (supportedAssets[assets[i]]) {
                updatePendingYield(users[i], assets[i], amounts[i]);
            }
        }
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
    

    
    function setHarvestStrategy(
        address asset,
        uint256 strategyType,
        uint256 minInterval,
        uint256 maxInterval
    ) external onlyOwner onlySupportedAsset(asset) {
        require(strategyType >= 1 && strategyType <= 3, "Invalid strategy type");
        require(minInterval <= maxInterval, "Invalid intervals");
        
        YieldStrategy storage strategy = yieldStrategies[asset];
        strategy.strategyType = strategyType;
        strategy.minHarvestInterval = minInterval;
        strategy.maxHarvestInterval = maxInterval;
    }
    
    function getHarvestHistory(address user, address asset) external view returns (
        uint256[] memory amounts,
        uint256[] memory timestamps,
        uint256[] memory fees
    ) {
        // Return harvest history for user and asset
        return (new uint256[](0), new uint256[](0), new uint256[](0));
    }
    
    function getYieldAnalytics(address asset) external view returns (
        uint256 totalHarvested,
        uint256 totalUsers,
        uint256 averageHarvestSize,
        uint256 lastHarvestTime
    ) {
        YieldStrategy storage strategy = yieldStrategies[asset];
        return (
            strategy.totalHarvested,
            0, // totalUsers would need additional tracking
            0, // averageHarvestSize calculation
            strategy.lastHarvestTime
        );
    }
    
    function getYieldLeaderboard(address asset) external view returns (
        address[] memory topHarvesters,
        uint256[] memory amounts
    ) {
        // Return top yield harvesters for an asset
        return (new address[](0), new uint256[](0));
    }
    
    function setAutoCompoundSchedule(
        address asset,
        uint256 frequency // in seconds
    ) external onlySupportedAsset(asset) {
        require(frequency >= 3600, "Frequency too low"); // Min 1 hour
        require(frequency <= 86400 * 7, "Frequency too high"); // Max 1 week
        
        YieldStrategy storage strategy = yieldStrategies[asset];
        strategy.minHarvestInterval = frequency;
        strategy.maxHarvestInterval = frequency;
    }
    
    function getPendingYieldForAllAssets(address user) external view returns (
        address[] memory assets,
        uint256[] memory amounts
    ) {
        uint256 count = 0;
        for (uint256 i = 0; i < assetList.length; i++) {
            if (getHarvestableYield(user, assetList[i]) > 0) {
                count++;
            }
        }
        
        assets = new address[](count);
        amounts = new uint256[](count);
        
        uint256 index = 0;
        for (uint256 i = 0; i < assetList.length; i++) {
            uint256 amount = getHarvestableYield(user, assetList[i]);
            if (amount > 0) {
                assets[index] = assetList[i];
                amounts[index] = amount;
                index++;
            }
        }
        
        return (assets, amounts);
    }
}

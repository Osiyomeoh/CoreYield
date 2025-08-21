// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./StandardizedYieldToken.sol";
import "./PrincipalToken.sol";
import "./YieldToken.sol";

contract CoreYieldAnalytics is Ownable {
    using Math for uint256;

    // Market structure reference
    struct Market {
        address syToken;
        address ptToken;
        address ytToken;
        address underlying;
        uint256 maturity;
        bool isActive;
    }

    // Yield analytics structure
    struct YieldAnalytics {
        uint256 currentAPY;           // Current underlying APY
        uint256 impliedAPY;           // Market-implied APY from PT/YT prices
        uint256 fixedAPY;             // Fixed yield from PT redemption
        uint256 longYieldAPY;         // Long yield potential from YT
        uint256 historicalAPY;        // Historical average APY
        uint256 volatility;           // APY volatility measure
        uint256 lastUpdateTime;       // Last update timestamp
        MarketMode marketMode;        // Current market mode
    }

    // Market mode enumeration
    enum MarketMode {
        CHEAP_PT,      // PT is undervalued, good to buy
        CHEAP_YT,      // YT is undervalued, good to buy
        EQUILIBRIUM,   // Balanced pricing
        UNKNOWN        // Not enough data
    }

    // Trading strategy signals
    struct TradingSignals {
        bool buyPT;                   // Should buy PT tokens
        bool buyYT;                   // Should buy YT tokens
        bool sellPT;                  // Should sell PT tokens
        bool sellYT;                  // Should sell YT tokens
        uint256 confidence;           // Signal confidence (0-100)
        string reasoning;             // Reasoning for the signal
    }

    // Historical data structure
    struct HistoricalData {
        uint256 timestamp;
        uint256 apy;
        uint256 ptPrice;
        uint256 ytPrice;
        uint256 volume;
    }

    // State variables
    address public marketFactory;
    address public tokenOperations;
    
    // Analytics storage
    mapping(address => YieldAnalytics) public marketAnalytics;
    mapping(address => HistoricalData[]) public historicalData;
    mapping(address => uint256) public lastAnalyticsUpdate;
    
    // Configuration
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MIN_CONFIDENCE = 30;
    uint256 public constant MAX_HISTORICAL_ENTRIES = 1000;
    uint256 public constant UPDATE_INTERVAL = 1 hours;
    
    // Events
    event AnalyticsUpdated(
        address indexed market,
        uint256 currentAPY,
        uint256 impliedAPY,
        MarketMode marketMode
    );
    
    event TradingSignal(
        address indexed market,
        bool buyPT,
        bool buyYT,
        uint256 confidence,
        string reasoning
    );

    constructor() Ownable(msg.sender) {}

    // Set market factory and token operations
    function setContracts(address _marketFactory, address _tokenOperations) external onlyOwner {
        marketFactory = _marketFactory;
        tokenOperations = _tokenOperations;
    }

    // Update analytics for a market
    function updateAnalytics(address _syToken) external {
        require(marketFactory != address(0), "Contracts not set");
        require(block.timestamp >= lastAnalyticsUpdate[_syToken] + UPDATE_INTERVAL, "Too soon to update");
        
        // Get market info
        Market memory market = _getMarketInfo(_syToken);
        require(market.isActive, "Market not active");
        
        // Calculate current APY
        uint256 currentAPY = _calculateCurrentAPY(_syToken);
        
        // Calculate implied APY from PT/YT prices
        uint256 impliedAPY = _calculateImpliedAPY(_syToken);
        
        // Calculate fixed APY from PT
        uint256 fixedAPY = _calculateFixedAPY(_syToken);
        
        // Calculate long yield APY from YT
        uint256 longYieldAPY = _calculateLongYieldAPY(_syToken);
        
        // Determine market mode
        MarketMode marketMode = _determineMarketMode(currentAPY, impliedAPY, fixedAPY, longYieldAPY);
        
        // Calculate volatility
        uint256 volatility = _calculateVolatility(_syToken);
        
        // Update analytics
        YieldAnalytics memory analytics = YieldAnalytics({
            currentAPY: currentAPY,
            impliedAPY: impliedAPY,
            fixedAPY: fixedAPY,
            longYieldAPY: longYieldAPY,
            historicalAPY: _calculateHistoricalAPY(_syToken),
            volatility: volatility,
            lastUpdateTime: block.timestamp,
            marketMode: marketMode
        });
        
        marketAnalytics[_syToken] = analytics;
        lastAnalyticsUpdate[_syToken] = block.timestamp;
        
        // Store historical data
        _storeHistoricalData(_syToken, currentAPY, impliedAPY, fixedAPY, longYieldAPY);
        
        emit AnalyticsUpdated(_syToken, currentAPY, impliedAPY, marketMode);
    }

    // Get trading signals for a market
    function getTradingSignals(address _syToken) external view returns (TradingSignals memory) {
        YieldAnalytics memory analytics = marketAnalytics[_syToken];
        require(analytics.lastUpdateTime > 0, "Analytics not available");
        
        bool buyPT = false;
        bool buyYT = false;
        bool sellPT = false;
        bool sellYT = false;
        uint256 confidence = 0;
        string memory reasoning = "";
        
        if (analytics.marketMode == MarketMode.CHEAP_PT) {
            buyPT = true;
            confidence = _calculateConfidence(analytics.currentAPY, analytics.impliedAPY);
            reasoning = "PT is undervalued - good time to lock in fixed yield";
        } else if (analytics.marketMode == MarketMode.CHEAP_YT) {
            buyYT = true;
            confidence = _calculateConfidence(analytics.currentAPY, analytics.impliedAPY);
            reasoning = "YT is undervalued - good time to long yield";
        } else if (analytics.marketMode == MarketMode.EQUILIBRIUM) {
            // In equilibrium, look for smaller opportunities
            if (analytics.fixedAPY > analytics.currentAPY * 110 / 100) {
                buyPT = true;
                confidence = 60;
                reasoning = "PT offers slightly better than current yield";
            } else if (analytics.longYieldAPY > analytics.currentAPY * 120 / 100) {
                buyYT = true;
                confidence = 70;
                reasoning = "YT offers significantly better yield potential";
            }
        }
        
        return TradingSignals({
            buyPT: buyPT,
            buyYT: buyYT,
            sellPT: sellPT,
            sellYT: sellYT,
            confidence: confidence,
            reasoning: reasoning
        });
    }

    // Get market mode for a specific market
    function getMarketMode(address _syToken) external view returns (MarketMode) {
        return marketAnalytics[_syToken].marketMode;
    }

    // Get comprehensive analytics for a market
    function getMarketAnalytics(address _syToken) external view returns (YieldAnalytics memory) {
        return marketAnalytics[_syToken];
    }

    // Get historical data for a market
    function getHistoricalData(address _syToken, uint256 _limit) external view returns (HistoricalData[] memory) {
        HistoricalData[] memory data = historicalData[_syToken];
        uint256 length = Math.min(_limit, data.length);
        
        HistoricalData[] memory result = new HistoricalData[](length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = data[data.length - 1 - i]; // Return most recent first
        }
        return result;
    }

    // Internal functions

    function _getMarketInfo(address _syToken) internal view returns (Market memory) {
        (bool success, bytes memory data) = marketFactory.staticcall(
            abi.encodeWithSignature("getMarket(address)", _syToken)
        );
        require(success, "Market not found");
        return abi.decode(data, (Market));
    }

    function _calculateCurrentAPY(address _syToken) internal view returns (uint256) {
        StandardizedYieldToken sy = StandardizedYieldToken(_syToken);
        return sy.yieldRate(); // Returns APY in basis points
    }

    function _calculateImpliedAPY(address _syToken) internal view returns (uint256) {
        // This would typically use AMM prices for PT/YT
        // For now, return a reasonable estimate based on current APY
        uint256 currentAPY = _calculateCurrentAPY(_syToken);
        return currentAPY * 95 / 100; // Assume 5% discount for market pricing
    }

    function _calculateFixedAPY(address _syToken) internal view returns (uint256) {
        Market memory market = _getMarketInfo(_syToken);
        uint256 timeToMaturity = market.maturity > block.timestamp ? 
            market.maturity - block.timestamp : 0;
        
        if (timeToMaturity == 0) return 0;
        
        // Calculate fixed APY based on time to maturity and current rates
        uint256 currentAPY = _calculateCurrentAPY(_syToken);
        uint256 timeInYear = 365 days;
        
        // Simple calculation: fixed APY = current APY * (1 + time premium)
        uint256 timePremium = (timeToMaturity * 1000) / timeInYear; // Basis points
        return currentAPY + (timePremium / 10); // Add time premium
    }

    function _calculateLongYieldAPY(address _syToken) internal view returns (uint256) {
        uint256 currentAPY = _calculateCurrentAPY(_syToken);
        uint256 impliedAPY = _calculateImpliedAPY(_syToken);
        
        if (impliedAPY >= currentAPY) return 0; // No profit potential
        
        // Calculate potential APY from YT
        uint256 yieldDiscount = currentAPY - impliedAPY;
        return currentAPY + (yieldDiscount * 150 / 100); // 1.5x leverage on yield discount
    }

    function _determineMarketMode(
        uint256 _currentAPY,
        uint256 _impliedAPY,
        uint256 _fixedAPY,
        uint256 _longYieldAPY
    ) internal pure returns (MarketMode) {
        if (_impliedAPY > _currentAPY * 110 / 100) {
            return MarketMode.CHEAP_PT; // PT is undervalued
        } else if (_impliedAPY < _currentAPY * 90 / 100) {
            return MarketMode.CHEAP_YT; // YT is undervalued
        } else {
            return MarketMode.EQUILIBRIUM; // Balanced pricing
        }
    }

    function _calculateVolatility(address _syToken) internal view returns (uint256) {
        HistoricalData[] memory data = historicalData[_syToken];
        if (data.length < 2) return 0;
        
        uint256 sum = 0;
        uint256 count = 0;
        
        for (uint256 i = 1; i < data.length; i++) {
            if (data[i].apy > 0 && data[i-1].apy > 0) {
                uint256 change = data[i].apy > data[i-1].apy ? 
                    data[i].apy - data[i-1].apy : 
                    data[i-1].apy - data[i].apy;
                sum += change;
                count++;
            }
        }
        
        return count > 0 ? sum / count : 0;
    }

    function _calculateHistoricalAPY(address _syToken) internal view returns (uint256) {
        HistoricalData[] memory data = historicalData[_syToken];
        if (data.length == 0) return 0;
        
        uint256 sum = 0;
        uint256 count = 0;
        
        for (uint256 i = 0; i < data.length; i++) {
            if (data[i].apy > 0) {
                sum += data[i].apy;
                count++;
            }
        }
        
        return count > 0 ? sum / count : 0;
    }

    function _calculateConfidence(uint256 _currentAPY, uint256 _impliedAPY) internal pure returns (uint256) {
        if (_currentAPY == 0) return 0;
        
        uint256 difference = _currentAPY > _impliedAPY ? 
            _currentAPY - _impliedAPY : 
            _impliedAPY - _currentAPY;
        
        uint256 percentage = (difference * 100) / _currentAPY;
        
        // Higher confidence for larger discrepancies
        if (percentage > 20) return 90;
        if (percentage > 15) return 80;
        if (percentage > 10) return 70;
        if (percentage > 5) return 60;
        return 50;
    }

    function _storeHistoricalData(
        address _syToken,
        uint256 _currentAPY,
        uint256 _impliedAPY,
        uint256 _fixedAPY,
        uint256 _longYieldAPY
    ) internal {
        HistoricalData[] storage data = historicalData[_syToken];
        
        // Create new entry
        HistoricalData memory newEntry = HistoricalData({
            timestamp: block.timestamp,
            apy: _currentAPY,
            ptPrice: _fixedAPY, // Use fixed APY as proxy for PT price
            ytPrice: _longYieldAPY, // Use long yield APY as proxy for YT price
            volume: 0 // Would need to track actual trading volume
        });
        
        data.push(newEntry);
        
        // Limit historical entries to prevent excessive storage
        if (data.length > MAX_HISTORICAL_ENTRIES) {
            // Remove oldest entry
            for (uint256 i = 0; i < data.length - 1; i++) {
                data[i] = data[i + 1];
            }
            data.pop();
        }
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ICoreYieldFactory {
    // Events
    event MarketCreated(
        address indexed syToken,
        address indexed ptToken,
        address indexed ytToken,
        uint256 maturity
    );
    
    event TokensSplit(
        address indexed syToken,
        address indexed user,
        uint256 syAmount,
        uint256 ptAmount,
        uint256 ytAmount,
        uint256 fee
    );
    
    event TokensRedeemed(
        address indexed syToken,
        address indexed user,
        uint256 ptAmount,
        uint256 ytAmount,
        uint256 syAmount
    );
    
    event YieldClaimed(
        address indexed syToken,
        address indexed user,
        uint256 amount
    );
    
    event YieldDistributed(
        address indexed syToken,
        uint256 amount,
        uint256 timestamp
    );
    
    event MarketPaused(address indexed syToken, address indexed by);
    event MarketResumed(address indexed syToken, address indexed by);
    
    struct Market {
        bool active;
        address syToken;
        address ptToken;
        address ytToken;
        uint256 maturity;
        uint256 totalSYDeposited;
        uint256 totalYieldDistributed;
        uint256 minInvestment;
        uint256 maxInvestment;
        uint256 createdAt;
    }
    
    struct UserPosition {
        uint256 syAmount;
        uint256 ptAmount;
        uint256 ytAmount;
        uint256 lastInteraction;
        uint256 totalYieldClaimed;
        uint256 lastYieldClaim;
    }
    
    function createMarket(
        address syToken,
        uint256 maturityDuration,
        string memory ptName,
        string memory ptSymbol,
        string memory ytName,
        string memory ytSymbol,
        uint256 minInvestment,
        uint256 maxInvestment
    ) external returns (address ptToken, address ytToken);
    
    function splitTokens(
        address syToken, 
        uint256 syAmount,
        uint256 minPTAmount,
        uint256 minYTAmount
    ) external;
    
    function redeemTokens(
        address syToken, 
        uint256 amount,
        uint256 minSYAmount
    ) external;
    
    function claimYield(address syToken) external;
    
    function distributeYieldFromSource(
        address syToken,
        uint256 yieldAmount,
        address yieldSource
    ) external;
    
    function batchDistributeYield(
        address[] memory syTokens,
        uint256[] memory yieldAmounts,
        address yieldSource
    ) external;
    
    function getMarket(address syToken) external view returns (Market memory);
    function getAllMarkets() external view returns (address[] memory);
    function getUserMarkets(address user) external view returns (address[] memory);
    function getUserPosition(address syToken, address user) external view returns (UserPosition memory);
    function getMarketCount() external view returns (uint256);
    function isMarketActive(address syToken) external view returns (bool);
    
    function getMarketAnalytics(address syToken) external view returns (
        uint256 totalDeposited,
        uint256 daysToMaturity,
        bool isActive,
        bool isExpired,
        uint256 totalYieldDistributed,
        uint256 lastYieldDistribution,
        uint256 minInvestment,
        uint256 maxInvestment
    );
    
    function getUserAnalytics(address user) external view returns (
        uint256 totalMarkets,
        uint256 activePTBalance,
        uint256 activeYTBalance,
        uint256 totalSYInvested,
        uint256 lastActivityTime,
        uint256 totalYieldClaimed
    );
    
    function getClaimableYield(address syToken, address user) external view returns (uint256);
    function getMarketValue(address syToken, address user) external view returns (uint256);
    
    function getProtocolStats() external view returns (
        uint256 totalMarkets,
        uint256 activeMarkets,
        uint256 totalValueLocked,
        uint256 totalYieldDistributed,
        uint256 lastGlobalYieldDistribution
    );
}
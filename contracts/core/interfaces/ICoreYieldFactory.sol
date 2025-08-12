pragma solidity ^0.8.19;

interface ICoreYieldFactory {
    struct Market {
        address syToken;
        address ptToken;
        address ytToken;
        uint256 totalYieldDistributed;
        uint256 lastYieldDistribution;
        bool isActive;
    }

    function markets(address syToken) external view returns (Market memory);
    function createMarket(address syToken) external returns (address ptToken, address ytToken);
    function splitTokens(address syToken, uint256 amount) external returns (uint256 ptAmount, uint256 ytAmount);
    function redeemTokens(address syToken, uint256 ptAmount, uint256 ytAmount) external returns (uint256 syAmount);
    function distributeYieldFromSource(address syToken, uint256 amount) external;
    function getMarket(address syToken) external view returns (Market memory);
    function isMarket(address syToken) external view returns (bool);
} 
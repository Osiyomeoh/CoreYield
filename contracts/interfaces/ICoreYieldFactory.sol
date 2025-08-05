// contracts/interfaces/ICoreYieldFactory.sol (Fixed)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ICoreYieldFactory {
    struct Market {
        address syToken;
        address ptToken;
        address ytToken;
        uint256 maturity;
        uint256 totalSYDeposited;
        bool active;
        uint256 createdAt;
    }
    
    function createMarket(
        address syToken,
        uint256 maturityDuration,
        string memory ptName,
        string memory ptSymbol,
        string memory ytName,
        string memory ytSymbol
    ) external returns (bytes32);
    
    function splitTokens(bytes32 marketId, uint256 syAmount) external;
    function redeemTokens(bytes32 marketId, uint256 amount) external;
    function claimYield(bytes32 marketId) external;
    function getMarket(bytes32 marketId) external view returns (Market memory);
}
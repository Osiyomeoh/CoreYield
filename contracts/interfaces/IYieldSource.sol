pragma solidity ^0.8.19;

interface IYieldSource {
    function getCurrentAPY() external view returns (uint256);
    function getAccruedYield(address user) external view returns (uint256);
    function getTotalValue() external view returns (uint256);
} 
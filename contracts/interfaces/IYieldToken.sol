// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IYieldToken {
    function claimYield() external returns (uint256);
    function claimableYield(address user) external view returns (uint256);
    function distributeYield(uint256 amount) external;
    function getExpectedYieldRate() external view returns (uint256);
    function isExpired() external view returns (bool);
    function timeToMaturity() external view returns (uint256);
}
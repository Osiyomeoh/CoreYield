pragma solidity ^0.8.19;

interface IStakingToken {
    function getRewardRate() external view returns (uint256);
    function earned(address account) external view returns (uint256);
    function getReward() external returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
}
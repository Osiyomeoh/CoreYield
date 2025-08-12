pragma solidity ^0.8.19;

interface ILiquidityMining {
    struct PoolInfo {
        address pool;
        uint256 rewardRate;
        uint256 lastUpdateTime;
        uint256 rewardPerTokenStored;
        bool isActive;
    }

    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
        uint256 lastClaimTime;
    }

    function addPool(address pool, uint256 rewardRate) external;
    function removePool(address pool) external;
    function stake(address pool, uint256 amount) external;
    function unstake(address pool, uint256 amount) external;
    function claimRewards(address pool) external;
    function pendingRewards(address pool, address user) external view returns (uint256);
    function getPoolAPY(address pool) external view returns (uint256);
    function updateRewardRate(address pool, uint256 newRate) external;
    function getActivePools() external view returns (address[] memory);
    function getUserStakedAmount(address pool, address user) external view returns (uint256);
} 
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "../AMM/CoreYieldAMM.sol";

/**
 * @title LiquidityMining
 * @notice Liquidity mining incentives for CoreYield AMM pools
 * @dev Distributes rewards to liquidity providers based on their share and time
 */
contract LiquidityMining is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Math for uint256;
    
    // Pool reward structure
    struct PoolRewards {
        address rewardToken;       // Token distributed as rewards
        uint256 rewardRate;        // Rewards per second
        uint256 lastUpdateTime;    // Last time rewards were updated
        uint256 rewardPerTokenStored; // Accumulated rewards per token
        uint256 totalStaked;       // Total staked liquidity
    }
    
    // User reward structure
    struct UserRewards {
        uint256 rewardPerTokenPaid; // User's last reward per token
        uint256 rewards;            // User's accumulated rewards
        uint256 lastStakeTime;      // Last time user staked
        uint256 totalStaked;        // Total amount staked by user
    }
    
    // Events
    event PoolAdded(address indexed syToken, address indexed rewardToken, uint256 rewardRate);
    event PoolRemoved(address indexed syToken);
    event Staked(address indexed user, address indexed syToken, uint256 amount);
    event Unstaked(address indexed user, address indexed syToken, uint256 amount);
    event RewardsClaimed(address indexed user, address indexed rewardToken, uint256 amount);
    event RewardRateUpdated(address indexed syToken, uint256 newRate);
    
    // State variables
    mapping(address => PoolRewards) public poolRewards;
    mapping(address => mapping(address => UserRewards)) public userRewards;
    mapping(address => bool) public supportedPools;
    
    address[] public activePools;
    CoreYieldAMM public immutable amm;
    
    uint256 public constant PRECISION = 1e18;
    uint256 public constant MIN_STAKE_AMOUNT = 1e18; // 1 token minimum
    
    constructor(address _amm) Ownable(msg.sender) {
        require(_amm != address(0), "Invalid AMM address");
        amm = CoreYieldAMM(_amm);
    }
    
    /**
     * @notice Add a new pool for liquidity mining
     * @param syToken SY token address
     * @param rewardToken Token to distribute as rewards
     * @param rewardRate Rewards per second
     */
    function addPool(
        address syToken,
        address rewardToken,
        uint256 rewardRate
    ) external onlyOwner {
        require(syToken != address(0), "Invalid SY token");
        require(rewardToken != address(0), "Invalid reward token");
        require(!supportedPools[syToken], "Pool already exists");
        require(rewardRate > 0, "Invalid reward rate");
        
        poolRewards[syToken] = PoolRewards({
            rewardToken: rewardToken,
            rewardRate: rewardRate,
            lastUpdateTime: block.timestamp,
            rewardPerTokenStored: 0,
            totalStaked: 0
        });
        
        supportedPools[syToken] = true;
        activePools.push(syToken);
        
        emit PoolAdded(syToken, rewardToken, rewardRate);
    }
    
    /**
     * @notice Remove a pool from liquidity mining
     * @param syToken SY token address
     */
    function removePool(address syToken) external onlyOwner {
        require(supportedPools[syToken], "Pool not found");
        require(poolRewards[syToken].totalStaked == 0, "Pool has staked liquidity");
        
        supportedPools[syToken] = false;
        
        // Remove from active pools array
        for (uint256 i = 0; i < activePools.length; i++) {
            if (activePools[i] == syToken) {
                activePools[i] = activePools[activePools.length - 1];
                activePools.pop();
                break;
            }
        }
        
        emit PoolRemoved(syToken);
    }
    
    /**
     * @notice Stake liquidity tokens to earn rewards
     * @param syToken SY token address
     * @param amount Amount of liquidity tokens to stake
     */
    function stake(address syToken, uint256 amount) external nonReentrant {
        require(supportedPools[syToken], "Pool not supported");
        require(amount >= MIN_STAKE_AMOUNT, "Amount too small");
        
        PoolRewards storage pool = poolRewards[syToken];
        UserRewards storage user = userRewards[syToken][msg.sender];
        
        // Update rewards before staking
        _updateRewards(syToken);
        _updateUserRewards(syToken, msg.sender);
        
        // Transfer liquidity tokens from user
        // Note: This assumes the AMM has a liquidity token or we're staking the LP position
        // For now, we'll use a simplified approach
        (uint256 ptReserves, uint256 ytReserves) = amm.getPoolReserves(syToken);
        require(ptReserves > 0, "Pool not initialized");
        
        // Update user rewards
        user.rewardPerTokenPaid = pool.rewardPerTokenStored;
        user.lastStakeTime = block.timestamp;
        user.totalStaked += amount;
        
        // Update pool totals
        pool.totalStaked += amount;
        
        emit Staked(msg.sender, syToken, amount);
    }
    
    /**
     * @notice Unstake liquidity tokens
     * @param syToken SY token address
     * @param amount Amount of liquidity tokens to unstake
     */
    function unstake(address syToken, uint256 amount) external nonReentrant {
        require(supportedPools[syToken], "Pool not supported");
        require(amount > 0, "Invalid amount");
        
        PoolRewards storage pool = poolRewards[syToken];
        UserRewards storage user = userRewards[syToken][msg.sender];
        
        require(user.totalStaked >= amount, "Insufficient staked amount");
        
        // Update rewards before unstaking
        _updateRewards(syToken);
        _updateUserRewards(syToken, msg.sender);
        
        // Update user rewards
        user.rewardPerTokenPaid = pool.rewardPerTokenStored;
        user.totalStaked -= amount;
        
        // Update pool totals
        pool.totalStaked -= amount;
        
        emit Unstaked(msg.sender, syToken, amount);
    }
    
    /**
     * @notice Claim accumulated rewards
     * @param syToken SY token address
     */
    function claimRewards(address syToken) external nonReentrant returns (uint256 rewardAmount) {
        require(supportedPools[syToken], "Pool not supported");
        
        PoolRewards storage pool = poolRewards[syToken];
        UserRewards storage user = userRewards[syToken][msg.sender];
        
        // Update rewards
        _updateRewards(syToken);
        _updateUserRewards(syToken, msg.sender);
        
        // Calculate user's rewards
        rewardAmount = user.rewards;
        require(rewardAmount > 0, "No rewards to claim");
        
        // Reset user rewards
        user.rewards = 0;
        user.rewardPerTokenPaid = pool.rewardPerTokenStored;
        
        // Transfer rewards to user
        IERC20(pool.rewardToken).safeTransfer(msg.sender, rewardAmount);
        
        emit RewardsClaimed(msg.sender, pool.rewardToken, rewardAmount);
        
        return rewardAmount;
    }
    
    /**
     * @notice Update rewards for a specific pool
     * @param syToken SY token address
     */
    function _updateRewards(address syToken) internal {
        PoolRewards storage pool = poolRewards[syToken];
        
        if (pool.totalStaked == 0) {
            pool.lastUpdateTime = block.timestamp;
            return;
        }
        
        uint256 timeElapsed = block.timestamp - pool.lastUpdateTime;
        if (timeElapsed == 0) return;
        
        uint256 newRewards = pool.rewardRate * timeElapsed;
        pool.rewardPerTokenStored += (newRewards * PRECISION) / pool.totalStaked;
        pool.lastUpdateTime = block.timestamp;
    }
    
    /**
     * @notice Update rewards for a specific user in a pool
     * @param syToken SY token address
     * @param user User address
     */
    function _updateUserRewards(address syToken, address user) internal {
        PoolRewards storage pool = poolRewards[syToken];
        UserRewards storage userReward = userRewards[syToken][user];
        
        if (pool.totalStaked == 0) return;
        
        uint256 timeElapsed = block.timestamp - pool.lastUpdateTime;
        uint256 newRewards = pool.rewardRate * timeElapsed;
        uint256 rewardPerToken = pool.rewardPerTokenStored + (newRewards * PRECISION) / pool.totalStaked;
        
        uint256 pending = (userReward.totalStaked * (rewardPerToken - userReward.rewardPerTokenPaid)) / PRECISION;
        userReward.rewards += pending;
        userReward.rewardPerTokenPaid = rewardPerToken;
    }
    
    /**
     * @notice Calculate pending rewards for a user
     * @param syToken SY token address
     * @param user User address
     */
    function pendingRewards(address syToken, address user) external view returns (uint256) {
        if (!supportedPools[syToken]) return 0;
        
        PoolRewards storage pool = poolRewards[syToken];
        UserRewards storage userReward = userRewards[syToken][user];
        
        if (pool.totalStaked == 0) return userReward.rewards;
        
        uint256 timeElapsed = block.timestamp - pool.lastUpdateTime;
        uint256 newRewards = pool.rewardRate * timeElapsed;
        uint256 rewardPerToken = pool.rewardPerTokenStored + (newRewards * PRECISION) / pool.totalStaked;
        
        uint256 pending = (userReward.totalStaked * (rewardPerToken - userReward.rewardPerTokenPaid)) / PRECISION;
        return userReward.rewards + pending;
    }
    
    /**
     * @notice Get APY for a specific pool
     * @param syToken SY token address
     */
    function getPoolAPY(address syToken) external view returns (uint256) {
        if (!supportedPools[syToken]) return 0;
        
        PoolRewards storage pool = poolRewards[syToken];
        if (pool.totalStaked == 0) return 0;
        
        // Calculate annual rewards
        uint256 annualRewards = pool.rewardRate * 365 days;
        
        // Calculate APY based on total staked
        uint256 apy = (annualRewards * PRECISION) / pool.totalStaked;
        
        return apy;
    }
    
    /**
     * @notice Update reward rate for a pool
     * @param syToken SY token address
     * @param newRate New reward rate per second
     */
    function updateRewardRate(address syToken, uint256 newRate) external onlyOwner {
        require(supportedPools[syToken], "Pool not found");
        require(newRate >= 0, "Invalid rate");
        
        // Update rewards before changing rate
        _updateRewards(syToken);
        
        poolRewards[syToken].rewardRate = newRate;
        
        emit RewardRateUpdated(syToken, newRate);
    }
    
    /**
     * @notice Get all active pools
     */
    function getActivePools() external view returns (address[] memory) {
        return activePools;
    }
    
    /**
     * @notice Get user's staked amount in a pool
     * @param syToken SY token address
     * @param user User address
     */
    function getUserStakedAmount(address syToken, address user) external view returns (uint256) {
        return userRewards[syToken][user].totalStaked;
    }
    
    /**
     * @notice Emergency function to recover stuck tokens
     * @param token Token address to recover
     * @param amount Amount to recover
     */
    function emergencyRecover(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
} 
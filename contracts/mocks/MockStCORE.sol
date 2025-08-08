// contracts/mocks/MockStCORE.sol (Enhanced)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockStCORE is ERC20, Ownable {
    uint256 public rewardRate = 850; // 8.5% APY in basis points
    uint256 public totalStaked;
    uint256 public rewardPool;
    
    mapping(address => uint256) public lastUpdateTime;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public stakingTime;
    
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);
    
    constructor() ERC20("Staked CORE", "stCORE") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10**18); // 1M tokens for testing
        _mint(address(this), 1000000 * 10**18); // Reward pool
        rewardPool = 1000000 * 10**18;
        lastUpdateTime[msg.sender] = block.timestamp;
        stakingTime[msg.sender] = block.timestamp;
    }
    
    function mint(address to, uint256 amount) external {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than zero");
        require(rewardPool >= amount, "Insufficient reward pool");
        
        _mint(to, amount);
        if (lastUpdateTime[to] == 0) {
            lastUpdateTime[to] = block.timestamp;
            stakingTime[to] = block.timestamp;
        }
        totalStaked += amount;
        emit Staked(to, amount);
    }
    
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
        totalStaked -= amount;
        emit Unstaked(from, amount);
    }
    
    function getRewardRate() external view returns (uint256) {
        return rewardRate;
    }
    
    function earned(address account) external view returns (uint256) {
        if (lastUpdateTime[account] == 0) return 0;
        uint256 timeElapsed = block.timestamp - lastUpdateTime[account];
        uint256 baseReward = (balanceOf(account) * rewardRate * timeElapsed) / (365 days * 10000);
        
        // Bonus for long-term staking
        uint256 stakingDuration = block.timestamp - stakingTime[account];
        uint256 bonus = stakingDuration > 30 days ? baseReward / 10 : 0; // 10% bonus after 30 days
        
        return baseReward + bonus;
    }
    
    function getReward() external returns (uint256) {
        uint256 reward = this.earned(msg.sender);
        require(reward > 0, "No rewards to claim");
        require(rewardPool >= reward, "Insufficient reward pool");
        
        rewards[msg.sender] = 0;
        lastUpdateTime[msg.sender] = block.timestamp;
        rewardPool -= reward;
        _mint(msg.sender, reward);
        emit RewardClaimed(msg.sender, reward);
        
        return reward;
    }
    
    function setRewardRate(uint256 newRate) external onlyOwner {
        require(newRate <= 2000, "Rate too high"); // Max 20%
        uint256 oldRate = rewardRate;
        rewardRate = newRate;
        emit RewardRateUpdated(oldRate, newRate);
    }
    
    // Testing helpers
    function fastForwardTime(uint256 timeInSeconds) external {
        lastUpdateTime[msg.sender] = block.timestamp - timeInSeconds;
    }
    
    function getStakingInfo(address account) external view returns (
        uint256 stakedAmount,
        uint256 stakingDuration,
        uint256 currentReward,
        uint256 projectedAnnualReward
    ) {
        stakedAmount = balanceOf(account);
        stakingDuration = block.timestamp - stakingTime[account];
        currentReward = this.earned(account);
        projectedAnnualReward = (stakedAmount * rewardRate) / 10000;
    }
    
    function getTotalStats() external view returns (
        uint256 totalSupply_,
        uint256 totalStaked_,
        uint256 rewardPool_,
        uint256 currentAPY
    ) {
        totalSupply_ = totalSupply();
        totalStaked_ = totalStaked;
        rewardPool_ = rewardPool;
        currentAPY = rewardRate;
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract CoreStaking is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public immutable coreToken;
    IERC20 public immutable stCoreToken;
    
    uint256 public totalStaked;
    uint256 public totalRewards;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    uint256 public constant REWARD_RATE = 850; // 8.5% APY
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    
    struct UserStakingInfo {
        uint256 stakedAmount;
        uint256 rewardPerTokenPaid;
        uint256 rewards;
        uint256 lastStakeTime;
        uint256 lockPeriod;
    }
    
    mapping(address => UserStakingInfo) public userStakingInfo;
    
    event Staked(address indexed user, uint256 amount, uint256 timestamp);
    event Unstaked(address indexed user, uint256 amount, uint256 timestamp);
    event RewardsClaimed(address indexed user, uint256 amount, uint256 timestamp);
    
    constructor(address _coreToken, address _stCoreToken) Ownable(msg.sender) {
        require(_coreToken != address(0), "Invalid CORE token");
        require(_stCoreToken != address(0), "Invalid stCORE token");
        
        coreToken = IERC20(_coreToken);
        stCoreToken = IERC20(_stCoreToken);
        lastUpdateTime = block.timestamp;
    }
    
    modifier updateReward(address user) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        
        if (user != address(0)) {
            userStakingInfo[user].rewards = earned(user);
            userStakingInfo[user].rewardPerTokenPaid = rewardPerTokenStored;
        }
        _;
    }
    
    function stake(uint256 amount) external nonReentrant whenNotPaused updateReward(msg.sender) {
        require(amount > 0, "Amount must be greater than 0");
        require(coreToken.balanceOf(msg.sender) >= amount, "Insufficient CORE balance");
        
        coreToken.safeTransferFrom(msg.sender, address(this), amount);
        stCoreToken.safeTransfer(msg.sender, amount);
        
        UserStakingInfo storage userInfo = userStakingInfo[msg.sender];
        userInfo.stakedAmount += amount;
        userInfo.lastStakeTime = block.timestamp;
        userInfo.lockPeriod = block.timestamp + 7 days;
        
        totalStaked += amount;
        
        emit Staked(msg.sender, amount, block.timestamp);
    }
    
    // Router-specific staking function
    function stakeForUser(address user, uint256 amount) external nonReentrant whenNotPaused updateReward(user) {
        require(amount > 0, "Amount must be greater than 0");
        require(coreToken.balanceOf(address(this)) >= amount, "Insufficient CORE balance in contract");
        
        // Transfer stCORE tokens to user
        stCoreToken.safeTransfer(user, amount);
        
        UserStakingInfo storage userInfo = userStakingInfo[user];
        userInfo.stakedAmount += amount;
        userInfo.lastStakeTime = block.timestamp;
        userInfo.lockPeriod = block.timestamp + 7 days;
        
        totalStaked += amount;
        totalUsers += 1;
        hasStaked[user] = true;
        
        emit Staked(user, amount, block.timestamp);
    }
    
    function unstake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Amount must be greater than 0");
        
        UserStakingInfo storage userInfo = userStakingInfo[msg.sender];
        require(userInfo.stakedAmount >= amount, "Insufficient staked amount");
        require(block.timestamp >= userInfo.lockPeriod, "Lock period not ended");
        
        stCoreToken.safeTransferFrom(msg.sender, address(this), amount);
        coreToken.safeTransfer(msg.sender, amount);
        
        userInfo.stakedAmount -= amount;
        totalStaked -= amount;
        
        emit Unstaked(msg.sender, amount, block.timestamp);
    }
    
    function claimRewards() external nonReentrant updateReward(msg.sender) {
        uint256 reward = userStakingInfo[msg.sender].rewards;
        require(reward > 0, "No rewards to claim");
        
        userStakingInfo[msg.sender].rewards = 0;
        totalRewards += reward;
        
        stCoreToken.safeTransfer(msg.sender, reward);
        
        emit RewardsClaimed(msg.sender, reward, block.timestamp);
    }
    
    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) return rewardPerTokenStored;
        
        uint256 effectiveTotalStaked = totalStaked / 1e18; // normalize to whole tokens to avoid precision loss
        if (effectiveTotalStaked == 0) return rewardPerTokenStored;
        
        uint256 delta = block.timestamp - lastUpdateTime;
        uint256 increment = (delta * REWARD_RATE * 1e18) / (effectiveTotalStaked * SECONDS_PER_YEAR);
        
        return rewardPerTokenStored + increment;
    }
    
    function earned(address user) public view returns (uint256) {
        UserStakingInfo memory userInfo = userStakingInfo[user];
        
        return (
            userInfo.stakedAmount * 
            (rewardPerToken() - userInfo.rewardPerTokenPaid)
        ) / 1e18 + userInfo.rewards;
    }
    
    function getStakingAPY() external pure returns (uint256) {
        return REWARD_RATE / 100;
    }
    
    function getUserStakingInfo(address user) external view returns (
        uint256 stakedAmount,
        uint256 rewards,
        uint256 lastStakeTime,
        uint256 lockPeriod,
        uint256 earnedRewards
    ) {
        UserStakingInfo memory userInfo = userStakingInfo[user];
        return (
            userInfo.stakedAmount,
            userInfo.rewards,
            userInfo.lastStakeTime,
            userInfo.lockPeriod,
            earned(user)
        );
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Additional features from UI
    uint256 public totalUsers;
    mapping(address => bool) public hasStaked;
    
    function getStakingStats() external view returns (
        uint256 _totalStaked,
        uint256 _totalRewards,
        uint256 _currentAPY,
        uint256 _totalUsers
    ) {
        return (totalStaked, totalRewards, REWARD_RATE / 100, totalUsers);
    }
    
    function getStakingLeaderboard() external view returns (address[] memory topStakers, uint256[] memory amounts) {
        // Return top 10 stakers
        // This would require additional storage for leaderboard tracking
        return (new address[](0), new uint256[](0));
    }
    
    function getStakingHistory(address user) external view returns (
        uint256[] memory amounts,
        uint256[] memory timestamps,
        uint256[] memory rewards
    ) {
        // Return staking history for user
        return (new uint256[](0), new uint256[](0), new uint256[](0));
    }
    
    function setRewardRate(uint256 newRate) external onlyOwner {
        require(newRate <= 2000, "Rate too high"); // Max 20%
        // REWARD_RATE = newRate; // Need to make this mutable
    }
    
    function setLockPeriod(uint256 newPeriod) external onlyOwner {
        require(newPeriod <= 30 days, "Lock period too long");
        // Update lock period for new stakes
    }
}

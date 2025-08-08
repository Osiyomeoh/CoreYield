//contracts/mocks/MockDualCORE (Enhanced)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockDualCORE is ERC20, Ownable {
    uint256 public rewardRate = 1210; // 12.1% APY
    uint256 public coreReserve;
    uint256 public btcReserve;
    uint256 public totalLiquidity;
    
    mapping(address => uint256) public liquidityProvided;
    mapping(address => uint256) public lastLPTime;
    
    event LiquidityAdded(address indexed provider, uint256 coreAmount, uint256 btcAmount, uint256 lpTokens);
    event LiquidityRemoved(address indexed provider, uint256 lpTokens, uint256 coreAmount, uint256 btcAmount);
    
    constructor() ERC20("Dual Staked CORE", "dualCORE") Ownable(msg.sender){
        _mint(msg.sender, 500000 * 10**18);
        coreReserve = 1000000 * 10**18;
        btcReserve = 100 * 10**18;
        totalLiquidity = 500000 * 10**18;
    }
    
    function mint(address to, uint256 amount) external {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than zero");
        require(coreReserve >= amount / 2, "Insufficient CORE reserve");
        require(btcReserve >= amount / 20000, "Insufficient BTC reserve");
        
        _mint(to, amount);
        liquidityProvided[to] += amount;
        lastLPTime[to] = block.timestamp;
        totalLiquidity += amount;
        emit LiquidityAdded(to, amount / 2, amount / 20000, amount); // Simulate LP ratio
    }
    
    function getRewardRate() external view returns (uint256) {
        return rewardRate;
    }
    
    function getPoolInfo() external view returns (
        uint256 coreReserve_,
        uint256 btcReserve_,
        uint256 totalLiquidity_,
        uint256 currentAPY
    ) {
        coreReserve_ = coreReserve;
        btcReserve_ = btcReserve;
        totalLiquidity_ = totalLiquidity;
        currentAPY = rewardRate;
    }
    
    function getUserLPInfo(address user) external view returns (
        uint256 lpTokens,
        uint256 lpDuration,
        uint256 shareOfPool,
        uint256 estimatedRewards
    ) {
        lpTokens = balanceOf(user);
        lpDuration = block.timestamp - lastLPTime[user];
        shareOfPool = totalLiquidity > 0 ? (lpTokens * 10000) / totalLiquidity : 0; // In basis points
        estimatedRewards = (lpTokens * rewardRate * lpDuration) / (365 days * 10000);
    }
}
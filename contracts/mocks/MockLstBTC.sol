// contracts/mocks/MockLstBTC.sol (Enhanced)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockLstBTC is ERC20, Ownable {
    uint256 public rewardRate = 420; // 4.2% APY
    uint256 public exchangeRate = 1 ether; // 1:1 initially
    uint256 public lastRateUpdate;
    
    mapping(address => uint256) public depositTime;
    
    event ExchangeRateUpdated(uint256 oldRate, uint256 newRate);
    event BTCDeposited(address indexed user, uint256 btcAmount, uint256 lstBTCAmount);
    
    constructor() ERC20("Liquid Staked BTC", "lstBTC") Ownable(msg.sender) {
        _mint(msg.sender, 100 * 10**18); // 100 BTC for testing
        lastRateUpdate = block.timestamp;
    }
    
    function mint(address to, uint256 amount) external {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than zero");
        
        _mint(to, amount);
        if (depositTime[to] == 0) {
            depositTime[to] = block.timestamp;
        }
        emit BTCDeposited(to, amount, amount);
    }
    
    function getRewardRate() external view returns (uint256) {
        return rewardRate;
    }
    
    function updateExchangeRate() external {
        uint256 timeElapsed = block.timestamp - lastRateUpdate;
        if (timeElapsed > 0) {
            // Simulate BTC staking rewards increasing exchange rate
            uint256 rateIncrease = (exchangeRate * rewardRate * timeElapsed) / (365 days * 10000);
            exchangeRate += rateIncrease;
            lastRateUpdate = block.timestamp;
            emit ExchangeRateUpdated(exchangeRate - rateIncrease, exchangeRate);
        }
    }
    
    function getBTCValue(uint256 lstBTCAmount) external view returns (uint256) {
        return (lstBTCAmount * exchangeRate) / 1 ether;
    }
    
    function getLstBTCAmount(uint256 btcAmount) external view returns (uint256) {
        return (btcAmount * 1 ether) / exchangeRate;
    }
}
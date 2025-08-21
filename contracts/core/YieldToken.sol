// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./StandardizedYieldToken.sol";
import "./CoreYieldTokenOperations.sol";

contract YieldToken is ERC20, Ownable {
    using SafeERC20 for IERC20;
    using Math for uint256;

    // Token structure
    address public immutable underlying;
    uint256 public immutable maturity;
    address public syToken; // Reference to the SY token
    address public marketManager; // Reference to the market manager
    
    // Yield tracking
    uint256 public totalYieldAccrued;
    uint256 public lastUpdateTime;
    uint256 public yieldRate; // APY in basis points
    
    // User yield tracking
    mapping(address => uint256) public userYieldAccrued;
    mapping(address => uint256) public userLastUpdateTime;
    mapping(address => uint256) public userYieldRate;
    
    // Fee structure
    struct FeeConfig {
        uint256 claimFee;           // Fee on yield claims
        uint256 transferFee;        // Fee on transfers
        uint256 yieldFee;           // Fee on yield accrual
        address feeCollector;       // Fee collector address
    }
    
    FeeConfig public feeConfig;
    uint256 public constant BASIS_POINTS = 10000;
    
    // Events
    event YieldAccrued(
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );
    
    event YieldClaimed(
        address indexed user,
        uint256 amount,
        uint256 fee
    );
    
    event FeesCollected(
        address indexed user,
        uint256 amount,
        string operation
    );

    constructor(
        string memory _name,
        string memory _symbol,
        address _underlying,
        uint256 _maturity
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        underlying = _underlying;
        maturity = _maturity;
        lastUpdateTime = block.timestamp;
        yieldRate = 500; // Default 5% APY
        
        feeConfig = FeeConfig({
            claimFee: 100,           // 1%
            transferFee: 50,         // 0.5%
            yieldFee: 50,            // 0.5%
            feeCollector: msg.sender
        });
    }

    // Set SY token and token operations references (called by factory)
    function setSYTokenAndTokenOperations(address _syToken, address _tokenOperations) external onlyOwner {
        require(syToken == address(0), "Already set");
        syToken = _syToken;
        marketManager = _tokenOperations;
    }

    // Mint YT tokens (called by factory)
    function mint(address _to, uint256 _amount) external onlyOwner {
        _mint(_to, _amount);
        _initializeUserYield(_to);
    }

    // Burn YT tokens (called by factory)
    function emergencyBurn(uint256 _amount) external onlyOwner {
        _burn(msg.sender, _amount);
    }

    // Accrue yield for a specific user
    function accrueYield(address _user) public {
        require(block.timestamp < maturity, "Market matured");
        require(balanceOf(_user) > 0, "No YT balance");
        
        uint256 timeElapsed = block.timestamp - userLastUpdateTime[_user];
        if (timeElapsed == 0) return;
        
        // Calculate yield based on user's balance and rate
        uint256 userYield = _calculateUserYield(_user, timeElapsed);
        
        if (userYield > 0) {
            userYieldAccrued[_user] += userYield;
            totalYieldAccrued += userYield;
            userLastUpdateTime[_user] = block.timestamp;
            
            emit YieldAccrued(_user, userYield, block.timestamp);
        }
    }

    // Claim accrued yield
    function claimYield() external returns (uint256 claimedAmount) {
        require(block.timestamp < maturity, "Market matured");
        require(syToken != address(0), "SY token not set");
        require(marketManager != address(0), "Market manager not set");
        
        // Accrue yield first
        accrueYield(msg.sender);
        
        claimedAmount = userYieldAccrued[msg.sender];
        require(claimedAmount > 0, "No yield to claim");
        
        // Calculate and collect claim fee
        uint256 feeAmount = (claimedAmount * feeConfig.claimFee) / BASIS_POINTS;
        uint256 netAmount = claimedAmount - feeAmount;
        
        // Reset user yield
        userYieldAccrued[msg.sender] = 0;
        
        // Call token operations to distribute yield
        CoreYieldTokenOperations(marketManager).distributeYield(syToken, msg.sender, claimedAmount);
        
        // Transfer underlying tokens to user (they should now be in this contract)
        IERC20(underlying).safeTransfer(msg.sender, netAmount);
        
        // Transfer fee to collector
        if (feeAmount > 0) {
            IERC20(underlying).safeTransfer(feeConfig.feeCollector, feeAmount);
            emit FeesCollected(msg.sender, feeAmount, "claim");
        }
        
        emit YieldClaimed(msg.sender, claimedAmount, feeAmount);
    }

    // Calculate user yield
    function _calculateUserYield(address _user, uint256 _timeElapsed) internal view returns (uint256) {
        uint256 userBalance = balanceOf(_user);
        uint256 userRate = userYieldRate[_user] > 0 ? userYieldRate[_user] : yieldRate;
        
        uint256 annualYield = (userBalance * userRate) / BASIS_POINTS;
        uint256 timeInYear = 365 days;
        
        return (annualYield * _timeElapsed) / timeInYear;
    }

    // Initialize user yield tracking
    function _initializeUserYield(address _user) internal {
        if (userLastUpdateTime[_user] == 0) {
            userLastUpdateTime[_user] = block.timestamp;
            userYieldRate[_user] = yieldRate;
        }
    }

    // Set yield rate for a specific user
    function setUserYieldRate(address _user, uint256 _newRate) external onlyOwner {
        require(_newRate <= 2000, "Rate too high"); // Max 20%
        userYieldRate[_user] = _newRate;
    }

    // Set global yield rate
    function setYieldRate(uint256 _newRate) external onlyOwner {
        require(_newRate <= 2000, "Rate too high"); // Max 20%
        yieldRate = _newRate;
    }

    // Update fee configuration
    function updateFeeConfig(
        uint256 _claimFee,
        uint256 _transferFee,
        uint256 _yieldFee,
        address _feeCollector
    ) external onlyOwner {
        feeConfig.claimFee = _claimFee;
        feeConfig.transferFee = _transferFee;
        feeConfig.yieldFee = _yieldFee;
        feeConfig.feeCollector = _feeCollector;
    }

    // View functions
    function getClaimableYield(address _user) external view returns (uint256) {
        if (balanceOf(_user) == 0) return userYieldAccrued[_user];
        
        uint256 timeElapsed = block.timestamp - userLastUpdateTime[_user];
        uint256 pendingYield = _calculateUserYield(_user, timeElapsed);
        
        return userYieldAccrued[_user] + pendingYield;
    }

    function getTotalYieldAccrued() external view returns (uint256) {
        return totalYieldAccrued;
    }

    function getCurrentAPY() external view returns (uint256) {
        return yieldRate;
    }

    function getUserAPY(address _user) external view returns (uint256) {
        return userYieldRate[_user] > 0 ? userYieldRate[_user] : yieldRate;
    }

    function getTimeToMaturity() external view returns (uint256) {
        if (block.timestamp >= maturity) return 0;
        return maturity - block.timestamp;
    }

    function getYieldStats(address _user) external view returns (
        uint256 claimableYield,
        uint256 totalAccrued,
        uint256 lastUpdate,
        uint256 userRate
    ) {
        claimableYield = this.getClaimableYield(_user);
        totalAccrued = userYieldAccrued[_user];
        lastUpdate = userLastUpdateTime[_user];
        userRate = userYieldRate[_user];
    }

    // Emergency functions
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(owner(), _amount);
    }
}

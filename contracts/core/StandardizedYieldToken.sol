// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./PrincipalToken.sol";
import "./YieldToken.sol";

contract StandardizedYieldToken is ERC20, Ownable {
    using SafeERC20 for IERC20;
    using Math for uint256;

    // Token structure
    address public immutable underlying;
    uint256 public immutable maturity;
    uint256 public exchangeRate;
    
    // Factory and associated tokens
    address public factory;
    address public ptToken;
    address public ytToken;
    
    // Yield tracking
    uint256 public totalYieldAccrued;
    uint256 public lastUpdateTime;
    uint256 public yieldRate; // APY in basis points
    
    // Fee structure
    struct FeeConfig {
        uint256 wrapFee;           // Fee on wrap operations
        uint256 unwrapFee;         // Fee on unwrap operations
        uint256 yieldFee;          // Fee on yield accrual
        address feeCollector;      // Fee collector address
    }
    
    FeeConfig public feeConfig;
    uint256 public constant BASIS_POINTS = 10000;
    
    // Events
    event TokensSplit(
        address indexed user,
        uint256 syAmount,
        uint256 ptAmount,
        uint256 ytAmount
    );
    
    event YieldAccrued(
        uint256 amount,
        uint256 newExchangeRate,
        uint256 timestamp
    );
    
    event FeesCollected(
        address indexed user,
        uint256 amount,
        string operation
    );

    constructor(
        address _underlying,
        string memory _name,
        string memory _symbol,
        uint256 _maturity,
        uint256 _initialExchangeRate
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        underlying = _underlying;
        maturity = _maturity;
        exchangeRate = _initialExchangeRate;
        lastUpdateTime = block.timestamp;
        yieldRate = 500; // Default 5% APY
        
        feeConfig = FeeConfig({
            wrapFee: 50,            // 0.5%
            unwrapFee: 50,          // 0.5%
            yieldFee: 100,          // 1%
            feeCollector: msg.sender
        });
    }

    // Set factory and associated tokens
    function setFactoryAndTokens(
        address _factory,
        address _ptToken,
        address _ytToken
    ) external onlyOwner {
        require(factory == address(0), "Already set");
        factory = _factory;
        ptToken = _ptToken;
        ytToken = _ytToken;
    }

    // Wrap underlying asset to SY
    function wrap(uint256 _amount) external returns (uint256 syAmount) {
        require(block.timestamp < maturity, "Market matured");
        require(_amount > 0, "Amount must be positive");
        
        // Calculate and collect wrap fee
        uint256 feeAmount = (_amount * feeConfig.wrapFee) / BASIS_POINTS;
        uint256 netAmount = _amount - feeAmount;
        
        // Calculate SY amount based on current exchange rate (1:1 initially)
        syAmount = netAmount; // Simple 1:1 ratio for now
        
        // Transfer underlying tokens from user
        IERC20(underlying).safeTransferFrom(msg.sender, address(this), _amount);
        
        // Mint SY tokens to user
        _mint(msg.sender, syAmount);
        
        // Transfer fee to collector
        if (feeAmount > 0) {
            IERC20(underlying).safeTransfer(feeConfig.feeCollector, feeAmount);
            emit FeesCollected(msg.sender, feeAmount, "wrap");
        }
        
        // Update exchange rate
        _updateExchangeRate();
    }

    // Unwrap SY to underlying asset
    function unwrap(uint256 _syAmount) external returns (uint256 underlyingAmount) {
        require(block.timestamp < maturity, "Market matured");
        require(_syAmount > 0, "Amount must be positive");
        require(balanceOf(msg.sender) >= _syAmount, "Insufficient SY balance");
        
        // Calculate underlying amount (1:1 ratio)
        underlyingAmount = _syAmount;
        
        // Calculate and collect unwrap fee
        uint256 feeAmount = (underlyingAmount * feeConfig.unwrapFee) / BASIS_POINTS;
        uint256 netAmount = underlyingAmount - feeAmount;
        
        // Burn SY tokens
        _burn(msg.sender, _syAmount);
        
        // Transfer underlying tokens to user
        IERC20(underlying).safeTransfer(msg.sender, netAmount);
        
        // Transfer fee to collector
        if (feeAmount > 0) {
            IERC20(underlying).safeTransfer(feeConfig.feeCollector, feeAmount);
            emit FeesCollected(msg.sender, feeAmount, "unwrap");
        }
        
        // Update exchange rate
        _updateExchangeRate();
    }

    // Split SY to PT + YT (called by factory)
    function split(
        address _user,
        uint256 _ptAmount,
        uint256 _ytAmount
    ) external {
        require(msg.sender == factory, "Only factory can call");
        require(_ptAmount == _ytAmount, "PT and YT amounts must be equal");
        
        // Burn SY tokens
        _burn(_user, _ptAmount);
        
        // Mint PT and YT tokens
        PrincipalToken(ptToken).mint(_user, _ptAmount);
        YieldToken(ytToken).mint(_user, _ytAmount);
        
        emit TokensSplit(_user, _ptAmount, _ptAmount, _ytAmount);
    }

    // Accrue yield
    function accrueYield() external {
        require(block.timestamp < maturity, "Market matured");
        
        uint256 timeElapsed = block.timestamp - lastUpdateTime;
        if (timeElapsed == 0) return;
        
        // Calculate yield based on current rate and time
        uint256 yieldAmount = _calculateYieldAccrual(timeElapsed);
        
        if (yieldAmount > 0) {
            // For now, keep exchange rate at 1:1
            exchangeRate = 1e18;
            
            totalYieldAccrued += yieldAmount;
            lastUpdateTime = block.timestamp;
            
            emit YieldAccrued(yieldAmount, exchangeRate, block.timestamp);
        }
    }

    // Calculate yield accrual
    function _calculateYieldAccrual(uint256 _timeElapsed) internal view returns (uint256) {
        uint256 totalUnderlying = IERC20(underlying).balanceOf(address(this));
        uint256 annualYield = (totalUnderlying * yieldRate) / BASIS_POINTS;
        uint256 timeInYear = 365 days;
        
        return (annualYield * _timeElapsed) / timeInYear;
    }

    // Update exchange rate
    function _updateExchangeRate() internal {
        // Keep exchange rate at 1:1 for simplicity
        exchangeRate = 1e18;
    }

    // Set yield rate
    function setYieldRate(uint256 _newRate) external onlyOwner {
        require(_newRate <= 2000, "Rate too high"); // Max 20%
        yieldRate = _newRate;
    }

    // Update fee configuration
    function updateFeeConfig(
        uint256 _wrapFee,
        uint256 _unwrapFee,
        uint256 _yieldFee,
        address _feeCollector
    ) external onlyOwner {
        feeConfig.wrapFee = _wrapFee;
        feeConfig.unwrapFee = _unwrapFee;
        feeConfig.yieldFee = _yieldFee;
        feeConfig.feeCollector = _feeCollector;
    }

    // View functions
    function getYieldAccrued() external view returns (uint256) {
        return totalYieldAccrued;
    }

    function getCurrentAPY() external view returns (uint256) {
        return yieldRate;
    }

    function getTimeToMaturity() external view returns (uint256) {
        if (block.timestamp >= maturity) return 0;
        return maturity - block.timestamp;
    }

    function getUnderlyingBalance() external view returns (uint256) {
        return IERC20(underlying).balanceOf(address(this));
    }

    function getExchangeRate() external view returns (uint256) {
        return exchangeRate;
    }

    // Emergency functions
    function emergencyMint(address _to, uint256 _amount) external onlyOwner {
        _mint(_to, _amount);
    }

    // Mint function for factory
    function mint(address _to, uint256 _amount) external onlyOwner {
        _mint(_to, _amount);
    }

    function emergencyBurn(uint256 _amount) external {
        _burn(msg.sender, _amount);
    }

    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(owner(), _amount);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./StandardizedYieldToken.sol";
import "./PrincipalToken.sol";
import "./YieldToken.sol";

contract CoreYieldTokenOperations is Ownable {
    using SafeERC20 for IERC20;
    
    // Market structure reference
    struct Market {
        address syToken;
        address ptToken;
        address ytToken;
        address underlying;
        uint256 maturity;
        bool isActive;
    }
    
    // Market factory reference
    address public marketFactory;
    
    // Events
    event TokensSplit(address indexed user, address indexed syToken, uint256 ptAmount, uint256 ytAmount);
    event TokensMerged(address indexed user, address indexed syToken, uint256 syAmount);
    event YieldDistributed(address indexed user, address indexed syToken, uint256 amount);
    
    constructor() Ownable(msg.sender) {}
    
    // Set market factory
    function setMarketFactory(address _marketFactory) external onlyOwner {
        require(marketFactory == address(0), "Already set");
        marketFactory = _marketFactory;
    }
    
    // Split SY to PT + YT
    function splitSY(address _syToken, uint256 _syAmount) external returns (uint256 ptAmount, uint256 ytAmount) {
        // Get market info from factory
        (bool success, bytes memory data) = marketFactory.staticcall(
            abi.encodeWithSignature("getMarket(address)", _syToken)
        );
        require(success, "Market not found");
        
        Market memory market = abi.decode(data, (Market));
        require(market.isActive, "Market not active");
        require(block.timestamp < market.maturity, "Market matured");
        
        // Calculate amounts (1 SY = 1 PT + 1 YT)
        ptAmount = _syAmount;
        ytAmount = _syAmount;
        
        // Transfer SY tokens from user to this contract
        StandardizedYieldToken(_syToken).transferFrom(msg.sender, address(this), _syAmount);
        
        // Burn SY tokens
        StandardizedYieldToken(_syToken).emergencyBurn(_syAmount);
        
        // Mint PT and YT tokens directly to user
        PrincipalToken(market.ptToken).mint(msg.sender, _syAmount);
        YieldToken(market.ytToken).mint(msg.sender, _syAmount);
        
        emit TokensSplit(msg.sender, _syToken, _syAmount, _syAmount);
    }
    
    // Merge PT + YT back to SY
    function mergePTYT(address _syToken, uint256 _ptAmount, uint256 _ytAmount) external returns (uint256 syAmount) {
        // Get market info from factory
        (bool success, bytes memory data) = marketFactory.staticcall(
            abi.encodeWithSignature("getMarket(address)", _syToken)
        );
        require(success, "Market not found");
        
        Market memory market = abi.decode(data, (Market));
        require(market.isActive, "Market not active");
        require(block.timestamp < market.maturity, "Market matured");
        require(_ptAmount == _ytAmount, "PT and YT amounts must be equal for 1:1:1 merge");
        
        syAmount = _ptAmount;
        
        // Transfer PT and YT tokens from user
        PrincipalToken(market.ptToken).transferFrom(msg.sender, address(this), _ptAmount);
        YieldToken(market.ytToken).transferFrom(msg.sender, address(this), _ytAmount);
        
        // Burn PT and YT tokens
        PrincipalToken(market.ptToken).emergencyBurn(_ptAmount);
        YieldToken(market.ytToken).emergencyBurn(_ptAmount);
        
        // Mint SY tokens to user
        StandardizedYieldToken(_syToken).mint(msg.sender, _ptAmount);
        
        emit TokensMerged(msg.sender, _syToken, _ptAmount);
    }
    
    // Distribute yield from SY token to YT token
    function distributeYield(address _syToken, address _user, uint256 _amount) external {
        // Get market info from factory
        (bool success, bytes memory data) = marketFactory.staticcall(
            abi.encodeWithSignature("getMarket(address)", _syToken)
        );
        require(success, "Market not found");
        
        Market memory market = abi.decode(data, (Market));
        require(market.isActive, "Market not active");
        require(msg.sender == market.ytToken, "Only YT token can call");
        
        // Withdraw underlying tokens from SY token
        StandardizedYieldToken(_syToken).emergencyWithdraw(market.underlying, _amount);
        
        // Transfer underlying tokens to YT token
        IERC20(market.underlying).safeTransfer(msg.sender, _amount);
        
        emit YieldDistributed(_user, _syToken, _amount);
    }
}

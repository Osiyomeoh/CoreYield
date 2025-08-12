pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MockPriceOracle is Ownable {
    mapping(address => uint256) public tokenPrices;
    
    uint256 public constant DEFAULT_PRICE = 1e18;
    
    event PriceUpdated(address indexed token, uint256 oldPrice, uint256 newPrice);
    
    constructor() Ownable(msg.sender) {
        tokenPrices[address(0)] = 1e18;
    }
    
    function getPrice(address token) external view returns (uint256) {
        uint256 price = tokenPrices[token];
        return price > 0 ? price : DEFAULT_PRICE;
    }
    
    function getPriceInUSD(address token) external view returns (uint256) {
        return this.getPrice(token);
    }
    
    function setPrice(address token, uint256 price) external onlyOwner {
        require(price > 0, "Invalid price");
        uint256 oldPrice = tokenPrices[token];
        tokenPrices[token] = price;
        emit PriceUpdated(token, oldPrice, price);
    }
    
    function setMultiplePrices(
        address[] calldata tokens,
        uint256[] calldata prices
    ) external onlyOwner {
        require(tokens.length == prices.length, "Array length mismatch");
        
        for (uint256 i = 0; i < tokens.length; i++) {
            if (prices[i] > 0) {
                uint256 oldPrice = tokenPrices[tokens[i]];
                tokenPrices[tokens[i]] = prices[i];
                emit PriceUpdated(tokens[i], oldPrice, prices[i]);
            }
        }
    }
} 
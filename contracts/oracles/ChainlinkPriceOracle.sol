pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

interface AggregatorV3Interface {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
    
    function decimals() external view returns (uint8);
    function description() external view returns (string memory);
    function version() external view returns (uint256);
}

contract ChainlinkPriceOracle is Ownable {
    mapping(address => address) public priceFeeds;
    mapping(address => uint8) public priceDecimals;
    
    mapping(address => uint256) public fallbackPrices;
    
    event PriceFeedUpdated(address indexed token, address indexed feed, uint8 decimals);
    event FallbackPriceUpdated(address indexed token, uint256 oldPrice, uint256 newPrice);
    
    constructor() Ownable(msg.sender) {
    }
    
    /**
     * @dev Get the latest price from Chainlink price feed
     * @param token The token address to get price for
     * @return price The latest price in 18 decimals
     */
    function getPrice(address token) external view returns (uint256) {
        address feed = priceFeeds[token];
        
        if (feed != address(0)) {
            try this._getChainlinkPrice(feed, priceDecimals[token]) returns (uint256 chainlinkPrice) {
                return chainlinkPrice;
            } catch {
                return fallbackPrices[token];
            }
        }
        
        uint256 fallbackPrice = fallbackPrices[token];
        if (fallbackPrice == 0) {
            fallbackPrice = 1e18;
        }
        return fallbackPrice;
    }
    
    /**
     * @dev Get price in USD (same as getPrice for now, but can be extended)
     * @param token The token address to get USD price for
     * @return price The latest USD price in 18 decimals
     */
    function getPriceInUSD(address token) external view returns (uint256) {
        return this.getPrice(token);
    }
    
    /**
     * @dev Internal function to get Chainlink price
     * @param feed The Chainlink price feed address
     * @param decimals The price feed decimals
     * @return price The price in 18 decimals
     */
    function _getChainlinkPrice(address feed, uint8 decimals) external view returns (uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(feed);
        
        (
            /* uint80 roundID */,
            int256 price,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = priceFeed.latestRoundData();
        
        require(price > 0, "Invalid price from Chainlink");
        
        if (decimals < 18) {
            return uint256(price) * (10 ** (18 - decimals));
        } else if (decimals > 18) {
            return uint256(price) / (10 ** (decimals - 18));
        }
        
        return uint256(price);
    }
    
    /**
     * @dev Set a Chainlink price feed for a token
     * @param token The token address
     * @param feed The Chainlink price feed address
     * @param decimals The price feed decimals
     */
    function setPriceFeed(address token, address feed, uint8 decimals) external onlyOwner {
        require(feed != address(0), "Invalid feed address");
        require(decimals <= 18, "Decimals too high");
        
        priceFeeds[token] = feed;
        priceDecimals[token] = decimals;
        
        emit PriceFeedUpdated(token, feed, decimals);
    }
    
    /**
     * @dev Set fallback price for a token
     * @param token The token address
     * @param price The fallback price in 18 decimals
     */
    function setFallbackPrice(address token, uint256 price) external onlyOwner {
        require(price > 0, "Invalid price");
        
        uint256 oldPrice = fallbackPrices[token];
        fallbackPrices[token] = price;
        
        emit FallbackPriceUpdated(token, oldPrice, price);
    }
    
    /**
     * @dev Batch set price feeds
     * @param tokens Array of token addresses
     * @param feeds Array of price feed addresses
     * @param decimalsArray Array of price feed decimals
     */
    function setMultiplePriceFeeds(
        address[] calldata tokens,
        address[] calldata feeds,
        uint8[] calldata decimalsArray
    ) external onlyOwner {
        require(
            tokens.length == feeds.length && tokens.length == decimalsArray.length,
            "Array length mismatch"
        );
        
        for (uint256 i = 0; i < tokens.length; i++) {
            if (feeds[i] != address(0)) {
                priceFeeds[tokens[i]] = feeds[i];
                priceDecimals[tokens[i]] = decimalsArray[i];
                emit PriceFeedUpdated(tokens[i], feeds[i], decimalsArray[i]);
            }
        }
    }
    
    /**
     * @dev Get price feed info for a token
     * @param token The token address
     * @return feed The price feed address
     * @return decimals The price feed decimals
     * @return hasFeed Whether the token has a price feed
     */
    function getPriceFeedInfo(address token) external view returns (
        address feed,
        uint8 decimals,
        bool hasFeed
    ) {
        feed = priceFeeds[token];
        decimals = priceDecimals[token];
        hasFeed = feed != address(0);
    }
} 
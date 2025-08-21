// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./StandardizedYieldToken.sol";
import "./PrincipalToken.sol";
import "./YieldToken.sol";

contract CoreYieldMarketFactory is Ownable {
    
    // Token operations contract reference
    address public tokenOperations;
    // Market structure
    struct Market {
        address syToken;
        address ptToken;
        address ytToken;
        address underlying;
        uint256 maturity;
        bool isActive;
    }
    
    // State variables
    mapping(address => Market) public markets;
    address[] public allMarkets;
    
    // Events
    event MarketCreated(
        address indexed syToken,
        address indexed underlying,
        address syTokenAddr,
        address ptToken,
        address ytToken,
        uint256 maturity
    );
    
    constructor() Ownable(msg.sender) {}
    
    // Set token operations contract
    function setTokenOperations(address _tokenOperations) external onlyOwner {
        tokenOperations = _tokenOperations;
    }
    
    // Create market
    function createMarket(
        address _underlying,
        string memory _name,
        string memory _symbol,
        uint256 _maturity,
        uint256 _initialExchangeRate
    ) external returns (address syToken, address ptToken, address ytToken) {
        require(_maturity > block.timestamp, "Invalid maturity");
        require(_underlying != address(0), "Invalid underlying");
        
        // Deploy SY token
        syToken = address(new StandardizedYieldToken(
            _underlying,
            _name,
            _symbol,
            _maturity,
            _initialExchangeRate
        ));
        
        // Deploy PT token
        ptToken = address(new PrincipalToken(
            string(abi.encodePacked("PT ", _symbol)),
            string(abi.encodePacked("PT", _symbol)),
            _maturity
        ));
        
        // Deploy YT token
        ytToken = address(new YieldToken(
            string(abi.encodePacked("YT ", _symbol)),
            string(abi.encodePacked("YT", _symbol)),
            _underlying,
            _maturity
        ));
        
        // Set factory and tokens in SY
        StandardizedYieldToken(syToken).setFactoryAndTokens(msg.sender, ptToken, ytToken);
        
        // Set up YT token if token operations is set
        if (tokenOperations != address(0)) {
            YieldToken(ytToken).setSYTokenAndTokenOperations(syToken, tokenOperations);
            // Transfer ownership of SY, PT, YT tokens to token operations for split/merge operations
            StandardizedYieldToken(syToken).transferOwnership(tokenOperations);
            PrincipalToken(ptToken).transferOwnership(tokenOperations);
            YieldToken(ytToken).transferOwnership(tokenOperations);
        }
        
        // Create market record
        Market memory newMarket = Market({
            syToken: syToken,
            ptToken: ptToken,
            ytToken: ytToken,
            underlying: _underlying,
            maturity: _maturity,
            isActive: true
        });
        
        markets[syToken] = newMarket;
        allMarkets.push(syToken);
        
        emit MarketCreated(syToken, _underlying, syToken, ptToken, ytToken, _maturity);
    }
    
    // View functions
    function getMarket(address _syToken) external view returns (Market memory) {
        return markets[_syToken];
    }
    
    function getMarketByUnderlying(address _underlying) external view returns (Market memory) {
        for (uint256 i = 0; i < allMarkets.length; i++) {
            if (markets[allMarkets[i]].underlying == _underlying) {
                return markets[allMarkets[i]];
            }
        }
        return Market({
            syToken: address(0),
            ptToken: address(0),
            ytToken: address(0),
            underlying: address(0),
            maturity: 0,
            isActive: false
        });
    }
    
    function getAllMarkets() external view returns (address[] memory) {
        return allMarkets;
    }
}

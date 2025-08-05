// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract CorePrincipalToken is ERC20, ERC20Permit, Pausable {
    address public immutable syToken;
    uint256 public immutable maturity;
    address public immutable factory;
    
    uint256 public totalRedeemed;
    uint256 public impliedAPY;
    bool public earlyRedemptionEnabled;
    uint256 public earlyRedemptionPenalty = 500;
    
    mapping(address => uint256) public redemptionHistory;
    mapping(address => uint256) public mintTimestamp;
    
    event TokensMinted(address indexed to, uint256 amount, uint256 timestamp);
    event TokensBurned(address indexed from, uint256 amount, uint256 timestamp);
    event EarlyRedemption(address indexed user, uint256 amount, uint256 penalty);
    
    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory can mint/burn");
        _;
    }
    
    constructor(
        string memory name,
        string memory symbol,
        address _syToken,
        uint256 _maturity
    ) ERC20(name, symbol) ERC20Permit(name) {
        require(_syToken != address(0), "Invalid SY token");
        require(_maturity > block.timestamp, "Invalid maturity");
        
        syToken = _syToken;
        maturity = _maturity;
        factory = msg.sender;
        
        uint256 timeToMaturity = _maturity - block.timestamp;
        impliedAPY = timeToMaturity > 0 ? (365 days * 10000) / (timeToMaturity / 86400) : 0;
    }
    
    function mint(address to, uint256 amount) external onlyFactory whenNotPaused {
        _mint(to, amount);
        mintTimestamp[to] = block.timestamp;
        emit TokensMinted(to, amount, block.timestamp);
    }
    
    function burn(address from, uint256 amount) external onlyFactory whenNotPaused {
        _burn(from, amount);
        totalRedeemed += amount;
        redemptionHistory[from] += amount;
        emit TokensBurned(from, amount, block.timestamp);
    }
    
    function isExpired() external view returns (bool) {
        return block.timestamp >= maturity;
    }
    
    function timeToMaturity() external view returns (uint256) {
        if (block.timestamp >= maturity) return 0;
        return maturity - block.timestamp;
    }
    
    function getMaturity() external view returns (uint256) {
        return maturity;
    }
    
    function getSYToken() external view returns (address) {
        return syToken;
    }
    
    function getImpliedAPY() external view returns (uint256) {
        if (block.timestamp >= maturity) return 0;
        uint256 timeLeft = maturity - block.timestamp;
        return timeLeft > 0 ? (365 days * 10000) / (timeLeft / 1 days) : 0;
    }
    
    function getTokenInfo() external view returns (
        string memory tokenName,
        string memory tokenSymbol,
        address tokenSY,
        uint256 tokenMaturity,
        bool expired,
        uint256 timeLeft,
        uint256 currentImpliedAPY,
        uint256 totalSupply_,
        uint256 totalRedeemed_
    ) {
        tokenName = name();
        tokenSymbol = symbol();
        tokenSY = syToken;
        tokenMaturity = maturity;
        expired = block.timestamp >= maturity;
        timeLeft = expired ? 0 : maturity - block.timestamp;
        currentImpliedAPY = this.getImpliedAPY();
        totalSupply_ = totalSupply();
        totalRedeemed_ = totalRedeemed;
    }
    
    function getUserInfo(address user) external view returns (
        uint256 balance,
        uint256 mintTime,
        uint256 holdingDuration,
        uint256 redemptionHistory_,
        uint256 potentialValue,
        bool canRedeemEarly
    ) {
        balance = balanceOf(user);
        mintTime = mintTimestamp[user];
        holdingDuration = block.timestamp - mintTime;
        redemptionHistory_ = redemptionHistory[user];
        potentialValue = balance;
        canRedeemEarly = earlyRedemptionEnabled && balance > 0;
    }
    
    function pause() external onlyFactory {
        _pause();
    }
    
    function unpause() external onlyFactory {
        _unpause();
    }
}
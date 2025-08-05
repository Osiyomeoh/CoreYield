// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CoreYieldToken is ERC20, ERC20Permit, Pausable, ReentrancyGuard {
    address public immutable syToken;
    uint256 public immutable maturity;
    address public immutable factory;
    
    uint256 public totalYieldClaimed;
    uint256 public totalYieldDistributed;
    uint256 public baseYieldRate;
    uint256 public yieldMultiplier = 10000;
    
    mapping(address => uint256) public userYieldClaimed;
    mapping(address => uint256) public mintTimestamp;
    mapping(address => uint256) public lastYieldClaim;
    
    struct YieldSnapshot {
        uint256 timestamp;
        uint256 yieldPerToken;
        uint256 totalSupply;
        uint256 cumulativeYieldPerToken;
    }
    
    YieldSnapshot[] public yieldSnapshots;
    mapping(address => uint256) public lastClaimIndex;
    
    bool public compoundingEnabled = true;
    uint256 public minClaimAmount = 1e15;
    
    event YieldClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event YieldDistributed(uint256 totalAmount, uint256 yieldPerToken, uint256 timestamp);
    event TokensMinted(address indexed to, uint256 amount, uint256 timestamp);
    event TokensBurned(address indexed from, uint256 amount, uint256 timestamp);
    
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
        baseYieldRate = 850;
        
        yieldSnapshots.push(YieldSnapshot({
            timestamp: block.timestamp,
            yieldPerToken: 0,
            totalSupply: 0,
            cumulativeYieldPerToken: 0
        }));
    }
    
    function mint(address to, uint256 amount) external onlyFactory whenNotPaused {
        _mint(to, amount);
        mintTimestamp[to] = block.timestamp;
        lastYieldClaim[to] = block.timestamp;
        emit TokensMinted(to, amount, block.timestamp);
    }
    
    function burn(address from, uint256 amount) external onlyFactory whenNotPaused {
        _burn(from, amount);
        emit TokensBurned(from, amount, block.timestamp);
    }
    
    function claimableYield(address user) external view returns (uint256) {
        uint256 userBalance = balanceOf(user);
        if (userBalance == 0) return 0;
        
        uint256 claimable = 0;
        uint256 userLastIndex = lastClaimIndex[user];
        
        for (uint256 i = userLastIndex + 1; i < yieldSnapshots.length; i++) {
            YieldSnapshot memory snapshot = yieldSnapshots[i];
            claimable += (userBalance * snapshot.yieldPerToken) / 1e18;
        }
        
        claimable = (claimable * yieldMultiplier) / 10000;
        return claimable;
    }
    
    function claimYield() external nonReentrant returns (uint256) {
        uint256 claimable = this.claimableYield(msg.sender);
        require(claimable > 0, "No yield to claim");
        require(claimable >= minClaimAmount, "Below minimum claim amount");
        
        userYieldClaimed[msg.sender] += claimable;
        lastClaimIndex[msg.sender] = yieldSnapshots.length - 1;
        lastYieldClaim[msg.sender] = block.timestamp;
        totalYieldClaimed += claimable;
        
        emit YieldClaimed(msg.sender, claimable, block.timestamp);
        return claimable;
    }
    
    function addTestYieldSnapshot(uint256 totalYieldAmount) external {
        require(totalSupply() > 0, "No tokens to distribute to");
        require(totalYieldAmount > 0, "Invalid yield amount");
        
        uint256 yieldPerToken = (totalYieldAmount * 1e18) / totalSupply();
        uint256 previousCumulative = yieldSnapshots.length > 0 ? 
            yieldSnapshots[yieldSnapshots.length - 1].cumulativeYieldPerToken : 0;
        
        yieldSnapshots.push(YieldSnapshot({
            timestamp: block.timestamp,
            yieldPerToken: yieldPerToken,
            totalSupply: totalSupply(),
            cumulativeYieldPerToken: previousCumulative + yieldPerToken
        }));
        
        totalYieldDistributed += totalYieldAmount;
        emit YieldDistributed(totalYieldAmount, yieldPerToken, block.timestamp);
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
    
    function getExpectedYieldRate() external view returns (uint256) {
        return baseYieldRate;
    }
    
    function getBasicTokenInfo() external view returns (
        string memory tokenName,
        string memory tokenSymbol,
        address tokenSY,
        uint256 tokenMaturity,
        bool expired,
        uint256 timeLeft
    ) {
        tokenName = name();
        tokenSymbol = symbol();
        tokenSY = syToken;
        tokenMaturity = maturity;
        expired = block.timestamp >= maturity;
        timeLeft = expired ? 0 : maturity - block.timestamp;
    }
    
    function getYieldTokenInfo() external view returns (
        uint256 expectedYield,
        uint256 currentYieldRate,
        uint256 totalSupply_,
        uint256 totalYieldClaimed_,
        uint256 totalYieldDistributed_
    ) {
        expectedYield = baseYieldRate;
        currentYieldRate = baseYieldRate;
        totalSupply_ = totalSupply();
        totalYieldClaimed_ = totalYieldClaimed;
        totalYieldDistributed_ = totalYieldDistributed;
    }
    
    function pause() external onlyFactory {
        _pause();
    }
    
    function unpause() external onlyFactory {
        _unpause();
    }
}
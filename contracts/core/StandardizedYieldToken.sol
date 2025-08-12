pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StandardizedYieldToken is ERC20, ReentrancyGuard, Pausable, Ownable {
    IERC20 public immutable underlyingAsset;
    uint256 public yieldRate;
    uint256 public totalYieldAccumulated;
    uint256 public lastGlobalUpdate;
    uint256 public maxSupply;
    uint256 public minWrapAmount;
    
    mapping(address => uint256) public userYieldDebt;
    mapping(address => uint256) public userLastUpdate;
    mapping(address => uint256) public userTotalYieldClaimed;
    
    mapping(address => bool) public flashMintApproved;
    uint256 public flashMintFee = 5;
    
    event YieldAccumulated(address indexed user, uint256 amount);
    event AssetWrapped(address indexed user, uint256 amount);
    event AssetUnwrapped(address indexed user, uint256 amount);
    event YieldRateUpdated(uint256 oldRate, uint256 newRate);
    event FlashMint(address indexed user, uint256 amount, uint256 fee);
    event BatchWrapExecuted(uint256 totalAmount, uint256 userCount);
    event MaxSupplyUpdated(uint256 oldMax, uint256 newMax);
    event MinWrapAmountUpdated(uint256 oldMin, uint256 newMin);
    
    error InsufficientBalance(uint256 requested, uint256 available);
    error InvalidAmount(uint256 amount);
    error YieldRateTooHigh(uint256 rate);
    error FlashMintNotApproved(address user);
    error MaxSupplyExceeded(uint256 requested, uint256 maxAllowed);
    
    constructor(
        string memory name,
        string memory symbol,
        address _underlyingAsset,
        uint256 _yieldRate
    ) ERC20(name, symbol) Ownable(msg.sender) {
        require(_underlyingAsset != address(0), "Invalid underlying asset");
        require(_yieldRate > 0 && _yieldRate <= 10000, "Invalid yield rate");
        
        underlyingAsset = IERC20(_underlyingAsset);
        yieldRate = _yieldRate;
        lastGlobalUpdate = block.timestamp;
        maxSupply = type(uint256).max;
        minWrapAmount = 1e15;
    }
    
    
    function wrap(uint256 amount) external nonReentrant whenNotPaused returns (uint256) {
        if (amount == 0) revert InvalidAmount(amount);
        if (amount < minWrapAmount) revert InvalidAmount(amount);
        if (totalSupply() + amount > maxSupply) revert MaxSupplyExceeded(totalSupply() + amount, maxSupply);
        
        _updateUserYield(msg.sender);
        
        require(underlyingAsset.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        _mint(msg.sender, amount);
        
        userLastUpdate[msg.sender] = block.timestamp;
        
        emit AssetWrapped(msg.sender, amount);
        return amount;
    }
    
    function unwrap(uint256 amount) external nonReentrant whenNotPaused returns (uint256) {
        if (amount == 0) revert InvalidAmount(amount);
        uint256 userBalance = balanceOf(msg.sender);
        if (userBalance < amount) revert InsufficientBalance(amount, userBalance);
        
        _updateUserYield(msg.sender);
        
        _burn(msg.sender, amount);
        require(underlyingAsset.transfer(msg.sender, amount), "Transfer failed");
        
        emit AssetUnwrapped(msg.sender, amount);
        return amount;
    }
    
    function claimYield() external nonReentrant whenNotPaused returns (uint256) {
        _updateUserYield(msg.sender);
        
        uint256 yieldAmount = userYieldDebt[msg.sender];
        require(yieldAmount > 0, "No yield to claim");
        
        userYieldDebt[msg.sender] = 0;
        userTotalYieldClaimed[msg.sender] += yieldAmount;
        
        _mint(msg.sender, yieldAmount);
        
        emit YieldAccumulated(msg.sender, yieldAmount);
        return yieldAmount;
    }
    
    
    function batchWrap(uint256[] memory amounts, address[] memory recipients) external nonReentrant whenNotPaused {
        require(amounts.length == recipients.length, "Arrays length mismatch");
        require(amounts.length <= 50, "Too many operations");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(underlyingAsset.transferFrom(msg.sender, address(this), totalAmount), "Transfer failed");
        
        for (uint256 i = 0; i < amounts.length; i++) {
            if (amounts[i] > 0) {
                _updateUserYield(recipients[i]);
                _mint(recipients[i], amounts[i]);
                userLastUpdate[recipients[i]] = block.timestamp;
                emit AssetWrapped(recipients[i], amounts[i]);
            }
        }
        
        emit BatchWrapExecuted(totalAmount, amounts.length);
    }
    
    function flashMint(uint256 amount, bytes calldata data) external nonReentrant whenNotPaused {
        if (!flashMintApproved[msg.sender]) revert FlashMintNotApproved(msg.sender);
        
        uint256 fee = (amount * flashMintFee) / 10000;
        uint256 balanceBefore = balanceOf(msg.sender);
        
        _mint(msg.sender, amount);
        
        (bool success, ) = msg.sender.call(data);
        require(success, "Flash mint callback failed");
        
        uint256 balanceAfter = balanceOf(msg.sender);
        require(balanceAfter >= balanceBefore + fee, "Flash mint not repaid");
        
        _burn(msg.sender, amount);
        
        if (fee > 0) {
            _transfer(msg.sender, owner(), fee);
        }
        
        emit FlashMint(msg.sender, amount, fee);
    }
    
    
    function getAccumulatedYield(address user) external view returns (uint256) {
        if (balanceOf(user) == 0) return userYieldDebt[user];
        
        uint256 timeElapsed = block.timestamp - userLastUpdate[user];
        uint256 pendingYield = (balanceOf(user) * yieldRate * timeElapsed) / (365 days * 10000);
        
        return userYieldDebt[user] + pendingYield;
    }
    
    function getCurrentAPY() external view returns (uint256) {
        return yieldRate;
    }
    
    function getYieldProjection(address user, uint256 timeHorizon) external view returns (uint256) {
        uint256 userBalance = balanceOf(user);
        if (userBalance == 0) return 0;
        
        return (userBalance * yieldRate * timeHorizon) / (365 days * 10000);
    }
    
    function getUserStats(address user) external view returns (
        uint256 balance,
        uint256 yieldDebt,
        uint256 totalYieldClaimed,
        uint256 lastUpdate,
        uint256 pendingYield,
        uint256 projectedAnnualYield
    ) {
        balance = balanceOf(user);
        yieldDebt = userYieldDebt[user];
        totalYieldClaimed = userTotalYieldClaimed[user];
        lastUpdate = userLastUpdate[user];
        
        uint256 timeElapsed = block.timestamp - userLastUpdate[user];
        pendingYield = balance > 0 ? (balance * yieldRate * timeElapsed) / (365 days * 10000) : 0;
        projectedAnnualYield = (balance * yieldRate) / 10000;
    }
    
    function getProtocolStats() external view returns (
        uint256 totalSupply_,
        uint256 totalYieldAccumulated_,
        uint256 currentYieldRate,
        uint256 maxSupply_,
        uint256 utilizationRate,
        uint256 averageYieldPerToken
    ) {
        totalSupply_ = totalSupply();
        totalYieldAccumulated_ = totalYieldAccumulated;
        currentYieldRate = yieldRate;
        maxSupply_ = maxSupply;
        utilizationRate = maxSupply > 0 ? (totalSupply_ * 10000) / maxSupply : 0;
        averageYieldPerToken = totalSupply_ > 0 ? totalYieldAccumulated_ / totalSupply_ : 0;
    }
    
    
    function _updateUserYield(address user) internal {
        if (balanceOf(user) > 0) {
            uint256 timeElapsed = block.timestamp - userLastUpdate[user];
            if (timeElapsed > 0) {
                uint256 newYield = (balanceOf(user) * yieldRate * timeElapsed) / (365 days * 10000);
                userYieldDebt[user] += newYield;
                totalYieldAccumulated += newYield;
            }
        }
        userLastUpdate[user] = block.timestamp;
    }
    
    function _update(address from, address to, uint256 value) internal override {
        if (from != address(0)) _updateUserYield(from);
        if (to != address(0)) _updateUserYield(to);
        super._update(from, to, value);
    }
    
    
    function setYieldRate(uint256 newRate) external onlyOwner {
        if (newRate > 10000) revert YieldRateTooHigh(newRate);
        uint256 oldRate = yieldRate;
        yieldRate = newRate;
        emit YieldRateUpdated(oldRate, newRate);
    }
    
    function setMaxSupply(uint256 newMaxSupply) external onlyOwner {
        uint256 oldMax = maxSupply;
        maxSupply = newMaxSupply;
        emit MaxSupplyUpdated(oldMax, newMaxSupply);
    }
    
    function setMinWrapAmount(uint256 newMinAmount) external onlyOwner {
        uint256 oldMin = minWrapAmount;
        minWrapAmount = newMinAmount;
        emit MinWrapAmountUpdated(oldMin, newMinAmount);
    }
    
    function setFlashMintApproval(address user, bool approved) external onlyOwner {
        flashMintApproved[user] = approved;
    }
    
    function setFlashMintFee(uint256 newFee) external onlyOwner {
        require(newFee <= 100, "Fee too high");
        flashMintFee = newFee;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(token != address(underlyingAsset), "Cannot withdraw underlying");
        IERC20(token).transfer(owner(), amount);
    }
    
    
    function simulateTimePass(uint256 timeInSeconds) external {
        userLastUpdate[msg.sender] = block.timestamp - timeInSeconds;
    }
    
    function forceYieldUpdate(address user) external {
        _updateUserYield(user);
    }
    
    function getDetailedYieldInfo(address user) external view returns (
        uint256 balance,
        uint256 yieldDebt,
        uint256 lastUpdate,
        uint256 timeElapsed,
        uint256 pendingYield,
        uint256 totalYield,
        uint256 yieldRate_,
        uint256 annualProjection
    ) {
        balance = balanceOf(user);
        yieldDebt = userYieldDebt[user];
        lastUpdate = userLastUpdate[user];
        timeElapsed = block.timestamp - userLastUpdate[user];
        pendingYield = balance > 0 ? (balance * yieldRate * timeElapsed) / (365 days * 10000) : 0;
        totalYield = yieldDebt + pendingYield;
        yieldRate_ = yieldRate;
        annualProjection = (balance * yieldRate) / 10000;
    }
}
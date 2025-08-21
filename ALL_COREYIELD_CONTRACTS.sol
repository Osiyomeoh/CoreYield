// ============================================================================
// COREYIELD PROTOCOL - ALL SMART CONTRACTS
// ============================================================================
// This file contains all smart contracts from the CoreYield protocol
// Organized by category for easy reference
// ============================================================================

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Import OpenZeppelin contracts
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

// ============================================================================
// INTERFACE CONTRACTS (Must be defined before main contracts)
// ============================================================================

// ============================================================================
// ICoreYieldFactory.sol
// ============================================================================

interface ICoreYieldFactory {
    struct Market {
        bool active;
        address syToken;
        address ptToken;
        address ytToken;
        uint256 maturity;
        uint256 totalSYDeposited;
        uint256 totalYieldDistributed;
        uint256 minInvestment;
        uint256 maxInvestment;
        uint256 createdAt;
    }
    
    struct UserPosition {
        uint256 syAmount;
        uint256 ptAmount;
        uint256 ytAmount;
        uint256 lastInteraction;
        uint256 totalYieldClaimed;
        uint256 lastYieldClaim;
    }

    function getMarket(address syToken) external view returns (Market memory);
    function isMarketActive(address syToken) external view returns (bool);
}

// ============================================================================
// ICoreYieldAMM.sol
// ============================================================================

interface ICoreYieldAMM {
    function getPoolReserves(address syToken) external view returns (uint256 ptReserves, uint256 ytReserves);
}

// ============================================================================
// IYieldSource.sol
// ============================================================================

interface IYieldSource {
    function getCurrentAPY() external view returns (uint256);
    function getAccruedYield(address user) external view returns (uint256);
    function getTotalValue() external view returns (uint256);
}

// ============================================================================
// IYieldToken.sol
// ============================================================================

interface IYieldToken {
    function claimYield() external returns (uint256);
    function claimableYield(address user) external view returns (uint256);
    function distributeYield(uint256 amount) external;
    function getExpectedYieldRate() external view returns (uint256);
    function isExpired() external view returns (bool);
    function timeToMaturity() external view returns (uint256);
}

// ============================================================================
// IStakingToken.sol
// ============================================================================

interface IStakingToken {
    function getRewardRate() external view returns (uint256);
    function earned(address account) external view returns (uint256);
    function getReward() external returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
}

// ============================================================================
// IStandardizedYieldToken.sol
// ============================================================================

interface IStandardizedYieldToken is IERC20 {
    function wrap(uint256 amount) external returns (uint256);
    function unwrap(uint256 amount) external returns (uint256);
    function claimYield() external returns (uint256);
    function getAccumulatedYield(address user) external view returns (uint256);
    function getCurrentAPY() external view returns (uint256);
    function underlyingAsset() external view returns (IERC20);
    function yieldRate() external view returns (uint256);
}

// ============================================================================
// CORE PROTOCOL CONTRACTS
// ============================================================================

// ============================================================================
// CoreYieldFactory.sol
// ============================================================================

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract CoreYieldFactory is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    mapping(address => Market) public markets;
    address[] public allMarkets;
    mapping(address => address[]) public userMarkets;
    mapping(address => mapping(address => UserPosition)) public userPositions;
    
    uint256 public constant MARKET_CREATION_FEE = 1000;
    uint256 public constant FEE_DENOMINATOR = 1000000;
    
    mapping(address => address) public yieldSources;
    mapping(address => uint256) public yieldRates;
    mapping(address => string) public yieldSourceNames;
    
    struct Market {
        bool active;
        address syToken;
        address ptToken;
        address ytToken;
        uint256 maturity;
        uint256 totalSYDeposited;
        uint256 totalYieldDistributed;
        uint256 minInvestment;
        uint256 maxInvestment;
        uint256 createdAt;
    }
    
    struct UserPosition {
        uint256 syAmount;
        uint256 ptAmount;
        uint256 ytAmount;
        uint256 lastInteraction;
        uint256 totalYieldClaimed;
        uint256 lastYieldClaim;
    }

    constructor() Ownable(msg.sender) {}

    function createMarket(
        address syToken,
        uint256 maturityDuration,
        string memory ptName,
        string memory ptSymbol,
        string memory ytName,
        string memory ytSymbol,
        uint256 _minInvestment,
        uint256 _maxInvestment
    ) external returns (address ptToken, address ytToken) {
        require(syToken != address(0), "Invalid SY token");
        require(maturityDuration >= 1 days && maturityDuration <= 365 days, "Invalid duration");
        require(_minInvestment > 0, "Invalid min investment");
        require(_maxInvestment > _minInvestment, "Invalid max investment");
        
        require(!markets[syToken].active, "Market exists");
        
        uint256 maturity = block.timestamp + maturityDuration;
        markets[syToken] = Market({
            active: true,
            syToken: syToken,
            ptToken: address(0),
            ytToken: address(0),
            maturity: maturity,
            totalSYDeposited: 0,
            totalYieldDistributed: 0,
            minInvestment: _minInvestment,
            maxInvestment: _maxInvestment,
            createdAt: block.timestamp
        });
        
        CorePrincipalToken pt = new CorePrincipalToken(
            ptName,
            ptSymbol,
            syToken,
            maturity
        );
        
        CoreYieldToken yt = new CoreYieldToken(
            ytName,
            ytSymbol,
            syToken,
            maturity
        );
        
        pt.transferOwnership(address(this));
        yt.transferOwnership(address(this));
        
        markets[syToken].ptToken = address(pt);
        markets[syToken].ytToken = address(yt);
        
        allMarkets.push(syToken);
        
        emit MarketCreated(syToken, address(pt), address(yt), maturity);
        
        return (address(pt), address(yt));
    }

    function splitTokens(
        address syToken, 
        uint256 syAmount,
        uint256 minPTAmount,
        uint256 minYTAmount
    ) external nonReentrant {
        require(syAmount > 0, "Invalid amount");
        require(markets[syToken].active, "Market inactive");
        require(block.timestamp < markets[syToken].maturity, "Market expired");
        
        Market storage market = markets[syToken];
        
        IERC20(syToken).safeTransferFrom(msg.sender, address(this), syAmount);
        
        uint256 ptAmount = syAmount;
        uint256 ytAmount = syAmount;
        
        require(ptAmount >= minPTAmount, "Insufficient PT amount");
        require(ytAmount >= minYTAmount, "Insufficient YT amount");
        
        CorePrincipalToken pt = CorePrincipalToken(market.ptToken);
        CoreYieldToken yt = CoreYieldToken(market.ytToken);
        
        pt.mint(msg.sender, ptAmount);
        yt.mint(msg.sender, ytAmount);
        
        UserPosition storage userPos = userPositions[syToken][msg.sender];
        userPos.ptAmount += ptAmount;
        userPos.ytAmount += ytAmount;
        userPos.lastInteraction = block.timestamp;
        
        if (userPos.lastYieldClaim == 0) {
            userPos.lastYieldClaim = block.timestamp;
        }
        
        if (userMarkets[msg.sender].length == 0 || 
            userMarkets[msg.sender][userMarkets[msg.sender].length - 1] != syToken) {
            userMarkets[msg.sender].push(syToken);
        }
        
        market.totalSYDeposited += syAmount;
        
        emit TokensSplit(syToken, msg.sender, syAmount, ptAmount, ytAmount, 0);
    }

    function redeemTokens(
        address syToken, 
        uint256 amount,
        uint256 minSYAmount
    ) external nonReentrant {
        require(amount > 0, "Invalid amount");
        require(markets[syToken].active, "Market inactive");
        require(block.timestamp >= markets[syToken].maturity, "Market not expired");
        
        Market storage market = markets[syToken];
        UserPosition storage userPos = userPositions[syToken][msg.sender];
        
        require(userPos.ptAmount >= amount, "Insufficient PT balance");
        require(userPos.ytAmount >= amount, "Insufficient YT balance");
        
        CorePrincipalToken pt = CorePrincipalToken(market.ptToken);
        CoreYieldToken yt = CoreYieldToken(market.ytToken);
        
        pt.burn(msg.sender, amount);
        yt.burn(msg.sender, amount);
        
        uint256 syAmount = amount;
        require(syAmount >= minSYAmount, "Insufficient SY amount");
        
        IERC20(syToken).safeTransfer(msg.sender, syAmount);
        
        userPos.ptAmount -= amount;
        userPos.ytAmount -= amount;
        userPos.lastInteraction = block.timestamp;
        
        market.totalSYDeposited -= syAmount;
        
        emit TokensRedeemed(syToken, msg.sender, amount, amount, syAmount);
    }

    function claimYield(address syToken) external nonReentrant {
        require(markets[syToken].active, "Market inactive");
        
        UserPosition storage userPos = userPositions[syToken][msg.sender];
        require(userPos.ytAmount > 0, "No YT tokens");
        
        uint256 claimableYield = getClaimableYield(syToken, msg.sender);
        require(claimableYield > 0, "No yield to claim");
        
        userPos.totalYieldClaimed += claimableYield;
        userPos.lastYieldClaim = block.timestamp;
        
        IERC20(syToken).safeTransfer(msg.sender, claimableYield);
        
        emit YieldClaimed(syToken, msg.sender, claimableYield);
    }

    function distributeYieldFromSource(
        address syToken,
        uint256 yieldAmount,
        address yieldSource
    ) external {
        require(markets[syToken].active, "Market inactive");
        require(yieldAmount > 0, "Invalid yield amount");
        
        IERC20(syToken).safeTransferFrom(yieldSource, address(this), yieldAmount);
        
        markets[syToken].totalYieldDistributed += yieldAmount;
        
        emit YieldDistributed(syToken, yieldAmount, block.timestamp);
    }

    function batchDistributeYield(
        address[] memory syTokens,
        uint256[] memory yieldAmounts,
        address yieldSource
    ) external {
        require(syTokens.length == yieldAmounts.length, "Array length mismatch");
        
        for (uint256 i = 0; i < syTokens.length; i++) {
            if (yieldAmounts[i] > 0) {
                this.distributeYieldFromSource(syTokens[i], yieldAmounts[i], yieldSource);
            }
        }
    }

    function pauseMarket(address syToken) external onlyOwner {
        require(markets[syToken].syToken != address(0), "Market does not exist");
        markets[syToken].active = false;
        emit MarketPaused(syToken, msg.sender);
    }
    
    function resumeMarket(address syToken) external onlyOwner {
        require(markets[syToken].syToken != address(0), "Market does not exist");
        markets[syToken].active = true;
        emit MarketResumed(syToken, msg.sender);
    }

    function getMarket(address syToken) external view returns (Market memory) {
        return markets[syToken];
    }
    
    function getAllMarkets() external view returns (address[] memory) {
        return allMarkets;
    }
    
    function getUserMarkets(address user) external view returns (address[] memory) {
        return userMarkets[user];
    }
    
    function getUserPosition(address syToken, address user) external view returns (UserPosition memory) {
        return userPositions[syToken][user];
    }
    
    function getMarketCount() external view returns (uint256) {
        return allMarkets.length;
    }
    
    function isMarketActive(address syToken) external view returns (bool) {
        Market storage market = markets[syToken];
        return market.active && block.timestamp < market.maturity;
    }

    function getMarketAnalytics(address syToken) external view returns (
        uint256 totalDeposited,
        uint256 daysToMaturity,
        bool isActive,
        bool isExpired,
        uint256 totalYieldDistributed,
        uint256 lastYieldDistribution,
        uint256 minInvestment,
        uint256 maxInvestment
    ) {
        Market storage market = markets[syToken];
        return (
            market.totalSYDeposited,
            market.maturity > block.timestamp ? (market.maturity - block.timestamp) / 1 days : 0,
            market.active,
            block.timestamp >= market.maturity,
            market.totalYieldDistributed,
            market.createdAt,
            market.minInvestment,
            market.maxInvestment
        );
    }
    
    function getUserAnalytics(address user) external view returns (
        uint256 totalMarkets,
        uint256 activePTBalance,
        uint256 activeYTBalance,
        uint256 totalSYInvested,
        uint256 lastActivityTime,
        uint256 totalYieldClaimed
    ) {
        uint256 totalPT = 0;
        uint256 totalYT = 0;
        uint256 totalSY = 0;
        uint256 lastActivity = 0;
        uint256 totalYield = 0;
        
        for (uint256 i = 0; i < userMarkets[user].length; i++) {
            address syToken = userMarkets[user][i];
            UserPosition storage pos = userPositions[syToken][user];
            
            totalPT += pos.ptAmount;
            totalYT += pos.ytAmount;
            totalSY += pos.syAmount;
            if (pos.lastInteraction > lastActivity) {
                lastActivity = pos.lastInteraction;
            }
            totalYield += pos.totalYieldClaimed;
        }
        
        return (
            userMarkets[user].length,
            totalPT,
            totalYT,
            totalSY,
            lastActivity,
            totalYield
        );
    }
    
    function getClaimableYield(address syToken, address user) public view returns (uint256) {
        UserPosition storage userPos = userPositions[syToken][user];
        if (userPos.ytAmount == 0) return 0;
        
        address yieldSource = yieldSources[syToken];
        if (yieldSource != address(0)) {
            try IYieldSource(yieldSource).getAccruedYield(user) returns (uint256 realYield) {
                return realYield;
            } catch {
                return getSyntheticYield(syToken, user);
            }
        }
        
        return getSyntheticYield(syToken, user);
    }
    
    function getSyntheticYield(address syToken, address user) internal view returns (uint256) {
        UserPosition storage userPos = userPositions[syToken][user];
        
        uint256 timeSinceLastClaim;
        if (userPos.lastYieldClaim == 0) {
            timeSinceLastClaim = block.timestamp - userPos.lastInteraction;
        } else {
            timeSinceLastClaim = block.timestamp - userPos.lastYieldClaim;
        }
        
        uint256 yieldRate = 850;
        return (userPos.ytAmount * yieldRate * timeSinceLastClaim) / (365 days * 10000);
    }
    
    function getMarketValue(address syToken, address user) external view returns (uint256) {
        UserPosition storage userPos = userPositions[syToken][user];
        return userPos.ptAmount + userPos.ytAmount;
    }
    
    function setYieldSource(address asset, address yieldContract, string memory sourceName) external onlyOwner {
        require(asset != address(0), "Invalid asset");
        require(yieldContract != address(0), "Invalid yield contract");
        
        yieldSources[asset] = yieldContract;
        yieldSourceNames[asset] = sourceName;
        
        try IYieldSource(yieldContract).getCurrentAPY() returns (uint256 apy) {
            yieldRates[asset] = apy;
        } catch {
            yieldRates[asset] = 0;
        }
        
        emit YieldSourceSet(asset, yieldContract, sourceName);
    }
    
    function getYieldSource(address asset) external view returns (address, string memory, uint256) {
        return (yieldSources[asset], yieldSourceNames[asset], yieldRates[asset]);
    }
    
    function getRealYieldAPY(address asset) external view returns (uint256) {
        address yieldSource = yieldSources[asset];
        if (yieldSource == address(0)) return 0;
        
        try IYieldSource(yieldSource).getCurrentAPY() returns (uint256 apy) {
            return apy;
        } catch {
            return 0;
        }
    }

    function getProtocolStats() external view returns (
        uint256 totalMarkets,
        uint256 activeMarkets,
        uint256 totalValueLocked,
        uint256 totalYieldDistributed,
        uint256 lastGlobalYieldDistribution
    ) {
        uint256 tvl = 0;
        uint256 totalYield = 0;
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < allMarkets.length; i++) {
            address syToken = allMarkets[i];
            Market storage market = markets[syToken];
            tvl += market.totalSYDeposited;
            totalYield += market.totalYieldDistributed;
            if (market.active && block.timestamp < market.maturity) {
                activeCount++;
            }
        }
        
        return (allMarkets.length, activeCount, tvl, totalYield, block.timestamp);
    }

    function emergencyPause() external onlyOwner {
        for (uint256 i = 0; i < allMarkets.length; i++) {
            markets[allMarkets[i]].active = false;
        }
    }
    
    function emergencyResume() external onlyOwner {
        for (uint256 i = 0; i < allMarkets.length; i++) {
            markets[allMarkets[i]].active = true;
        }
    }

    // Events
    event MarketCreated(
        address indexed syToken,
        address indexed ptToken,
        address indexed ytToken,
        uint256 maturity
    );
    
    event TokensSplit(
        address indexed syToken,
        address indexed user,
        uint256 syAmount,
        uint256 ptAmount,
        uint256 ytAmount,
        uint256 fee
    );
    
    event TokensRedeemed(
        address indexed syToken,
        address indexed user,
        uint256 ptAmount,
        uint256 ytAmount,
        uint256 syAmount
    );
    
    event YieldClaimed(
        address indexed syToken,
        address indexed user,
        uint256 amount
    );
    
    event YieldDistributed(
        address indexed syToken,
        uint256 amount,
        uint256 timestamp
    );
    
    event MarketPaused(address indexed syToken, address indexed by);
    event MarketResumed(address indexed syToken, address indexed by);
    event YieldSourceSet(address indexed asset, address indexed yieldContract, string sourceName);
}

// ============================================================================
// YIELD SOURCE CONTRACTS
// ============================================================================

// ============================================================================
// AaveLendingYield.sol
// ============================================================================

contract AaveLendingYield is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public lendingToken;
    uint256 public totalLent;
    uint256 public interestRate = 380;
    uint256 public lastUpdateTime;
    uint256 public interestPerTokenStored;
    
    mapping(address => uint256) public userLent;
    mapping(address => uint256) public userInterestPerTokenPaid;
    mapping(address => uint256) public userInterest;
    
    event Lent(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event InterestPaid(address indexed user, uint256 interest);
    
    constructor(address _lendingToken) Ownable(msg.sender) {
        lendingToken = IERC20(_lendingToken);
        lastUpdateTime = block.timestamp;
    }
    
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot lend 0");
        
        updateInterest(msg.sender);
        
        lendingToken.safeTransferFrom(msg.sender, address(this), amount);
        userLent[msg.sender] += amount;
        totalLent += amount;
        
        emit Lent(msg.sender, amount);
    }
    
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot withdraw 0");
        require(userLent[msg.sender] >= amount, "Insufficient balance");
        
        updateInterest(msg.sender);
        
        userLent[msg.sender] -= amount;
        totalLent -= amount;
        
        lendingToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }
    
    function claimInterest() external nonReentrant {
        updateInterest(msg.sender);
        
        uint256 interest = userInterest[msg.sender];
        if (interest > 0) {
            userInterest[msg.sender] = 0;
            lendingToken.safeTransfer(msg.sender, interest);
            emit InterestPaid(msg.sender, interest);
        }
    }
    
    function updateInterest(address user) internal {
        interestPerTokenStored = interestPerToken();
        lastUpdateTime = block.timestamp;
        
        if (user != address(0)) {
            userInterest[user] = earned(user);
            userInterestPerTokenPaid[user] = interestPerTokenStored;
        }
    }
    
    function interestPerToken() public view returns (uint256) {
        if (totalLent == 0) {
            return interestPerTokenStored;
        }
        return interestPerTokenStored + (
            ((block.timestamp - lastUpdateTime) * interestRate * 1e18) / (365 days * 10000)
        );
    }
    
    function earned(address user) public view returns (uint256) {
        return (
            userLent[user] * (interestPerToken() - userInterestPerTokenPaid[user])
        ) / 1e18 + userInterest[user];
    }
    
    function getCurrentAPY() external view returns (uint256) {
        return interestRate;
    }
    
    function getAccruedYield(address user) external view returns (uint256) {
        return earned(user);
    }
    
    function getTotalLent() external view returns (uint256) {
        return totalLent;
    }
}

// ============================================================================
// CurveLPYield.sol
// ============================================================================

contract CurveLPYield is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public lpToken;
    uint256 public totalLiquidity;
    uint256 public feeRate = 1210;
    uint256 public lastUpdateTime;
    uint256 public feePerTokenStored;
    
    mapping(address => uint256) public userLiquidity;
    mapping(address => uint256) public userFeePerTokenPaid;
    mapping(address => uint256) public userFees;
    
    event LiquidityAdded(address indexed user, uint256 amount);
    event LiquidityRemoved(address indexed user, uint256 amount);
    event FeesPaid(address indexed user, uint256 fees);
    
    constructor(address _lpToken) Ownable(msg.sender) {
        lpToken = IERC20(_lpToken);
        lastUpdateTime = block.timestamp;
    }
    
    function addLiquidity(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot add 0 liquidity");
        
        updateFees(msg.sender);
        
        lpToken.safeTransferFrom(msg.sender, address(this), amount);
        userLiquidity[msg.sender] += amount;
        totalLiquidity += amount;
        
        emit LiquidityAdded(msg.sender, amount);
    }
    
    function removeLiquidity(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot remove 0 liquidity");
        require(userLiquidity[msg.sender] >= amount, "Insufficient balance");
        
        updateFees(msg.sender);
        
        userLiquidity[msg.sender] -= amount;
        totalLiquidity -= amount;
        
        lpToken.safeTransfer(msg.sender, amount);
        emit LiquidityRemoved(msg.sender, amount);
    }
    
    function claimFees() external nonReentrant {
        updateFees(msg.sender);
        
        uint256 fees = userFees[msg.sender];
        if (fees > 0) {
            userFees[msg.sender] = 0;
            lpToken.safeTransfer(msg.sender, fees);
            emit FeesPaid(msg.sender, fees);
        }
    }
    
    function updateFees(address user) internal {
        feePerTokenStored = feePerToken();
        lastUpdateTime = block.timestamp;
        
        if (user != address(0)) {
            userFees[user] = earned(user);
            userFeePerTokenPaid[user] = feePerTokenStored;
        }
    }
    
    function feePerToken() public view returns (uint256) {
        if (totalLiquidity == 0) {
            return feePerTokenStored;
        }
        return feePerTokenStored + (
            ((block.timestamp - lastUpdateTime) * feeRate * 1e18) / (365 days * 10000)
        );
    }
    
    function earned(address user) public view returns (uint256) {
        return (
            userLiquidity[user] * (feePerToken() - userFeePerTokenPaid[user])
        ) / 1e18 + userFees[user];
    }
    
    function getCurrentAPY() external view returns (uint256) {
        return feeRate;
    }
    
    function getAccruedYield(address user) external view returns (uint256) {
        return earned(user);
    }
    
    function getTotalLiquidity() external view returns (uint256) {
        return totalLiquidity;
    }
}

// ============================================================================
// LidoStakingYield.sol
// ============================================================================

contract LidoStakingYield is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public stakingToken;
    uint256 public totalStaked;
    uint256 public rewardRate = 520;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    
    mapping(address => uint256) public userStaked;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public userRewards;
    
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    
    constructor(address _stakingToken) Ownable(msg.sender) {
        stakingToken = IERC20(_stakingToken);
        lastUpdateTime = block.timestamp;
    }
    
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot stake 0");
        
        updateReward(msg.sender);
        
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        userStaked[msg.sender] += amount;
        totalStaked += amount;
        
        emit Staked(msg.sender, amount);
    }
    
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot withdraw 0");
        require(userStaked[msg.sender] >= amount, "Insufficient balance");
        
        updateReward(msg.sender);
        
        userStaked[msg.sender] -= amount;
        totalStaked -= amount;
        
        stakingToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }
    
    function claimRewards() external nonReentrant {
        updateReward(msg.sender);
        
        uint256 reward = userRewards[msg.sender];
        if (reward > 0) {
            userRewards[msg.sender] = 0;
            stakingToken.safeTransfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }
    
    function updateReward(address user) internal {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        
        if (user != address(0)) {
            userRewards[user] = earned(user);
            userRewardPerTokenPaid[user] = rewardPerTokenStored;
        }
    }
    
    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerTokenStored;
        }
        return rewardPerTokenStored + (
            ((block.timestamp - lastUpdateTime) * rewardRate * 1e18) / (365 days * 10000)
        );
    }
    
    function earned(address user) public view returns (uint256) {
        return (
            userStaked[user] * (rewardPerToken() - userRewardPerTokenPaid[user])
        ) / 1e18 + userRewards[user];
    }
    
    function getCurrentAPY() external view returns (uint256) {
        return rewardRate;
    }
    
    function getAccruedYield(address user) external view returns (uint256) {
        return earned(user);
    }
    
    function getTotalStaked() external view returns (uint256) {
        return totalStaked;
    }
}

// ============================================================================
// StandardizedYieldToken.sol
// ============================================================================

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

// ============================================================================
// AMM & TRADING CONTRACTS
// ============================================================================

// ============================================================================
// CoreYieldAMM.sol
// ============================================================================

contract CoreYieldAMM is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Math for uint256;
    
    struct Pool {
        address syToken;
        address ptToken;
        address ytToken;
        uint256 ptReserves;
        uint256 ytReserves;
        uint256 totalLiquidity;
        uint256 lastUpdate;
        bool active;
    }
    
    struct LiquidityPosition {
        uint256 liquidity;
        uint256 ptAmount;
        uint256 ytAmount;
        uint256 lastClaim;
    }
    
    event PoolCreated(address indexed syToken, address indexed ptToken, address indexed ytToken);
    event LiquidityAdded(address indexed user, address indexed syToken, uint256 ptAmount, uint256 ytAmount, uint256 liquidity);
    event LiquidityRemoved(address indexed user, address indexed syToken, uint256 ptAmount, uint256 ytAmount, uint256 liquidity);
    event SwapExecuted(address indexed user, address indexed syToken, bool ptToYt, uint256 amountIn, uint256 amountOut, uint256 fee);
    event FeesCollected(address indexed syToken, uint256 ptFees, uint256 ytFees);
    
    mapping(address => Pool) public pools;
    mapping(address => mapping(address => LiquidityPosition)) public userPositions;
    mapping(address => bool) public supportedSYTokens;
    
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public swapFee = 30;
    uint256 public protocolFee = 10;
    address public feeRecipient;
    
    ICoreYieldFactory public immutable coreYieldFactory;
    
    constructor(address _coreYieldFactory, address _feeRecipient) Ownable(msg.sender) {
        require(_coreYieldFactory != address(0), "Invalid factory address");
        require(_feeRecipient != address(0), "Invalid fee recipient");
        
        coreYieldFactory = ICoreYieldFactory(_coreYieldFactory);
        feeRecipient = _feeRecipient;
    }
    
    function createPool(
        address syToken,
        uint256 initialPTAmount,
        uint256 initialYTAmount
    ) external onlyOwner {
        require(syToken != address(0), "Invalid SY token");
        require(!pools[syToken].active, "Pool already exists");
        require(initialPTAmount > 0 && initialYTAmount > 0, "Invalid amounts");
        
        ICoreYieldFactory.Market memory market = coreYieldFactory.getMarket(syToken);
        require(market.active, "Market not active");
        
        pools[syToken] = Pool({
            syToken: syToken,
            ptToken: market.ptToken,
            ytToken: market.ytToken,
            ptReserves: initialPTAmount,
            ytReserves: initialYTAmount,
            totalLiquidity: Math.sqrt(initialPTAmount * initialYTAmount),
            lastUpdate: block.timestamp,
            active: true
        });
        
        supportedSYTokens[syToken] = true;
        
        IERC20(market.ptToken).safeTransferFrom(msg.sender, address(this), initialPTAmount);
        IERC20(market.ytToken).safeTransferFrom(msg.sender, address(this), initialYTAmount);
        
        emit PoolCreated(syToken, market.ptToken, market.ytToken);
    }
    
    function addLiquidity(
        address syToken,
        uint256 ptAmount,
        uint256 ytAmount,
        uint256 minLiquidity
    ) external nonReentrant returns (uint256 liquidity) {
        Pool storage pool = pools[syToken];
        require(pool.active, "Pool not active");
        require(ptAmount > 0 && ytAmount > 0, "Invalid amounts");
        
        uint256 ptReserves = pool.ptReserves;
        uint256 ytReserves = pool.ytReserves;
        
        if (pool.totalLiquidity == 0) {
            liquidity = Math.sqrt(ptAmount * ytAmount);
        } else {
            uint256 liquidityPT = (ptAmount * pool.totalLiquidity) / ptReserves;
            uint256 liquidityYT = (ytAmount * pool.totalLiquidity) / ytReserves;
            liquidity = Math.min(liquidityPT, liquidityYT);
        }
        
        require(liquidity >= minLiquidity, "Insufficient liquidity");
        
        pool.ptReserves += ptAmount;
        pool.ytReserves += ytAmount;
        pool.totalLiquidity += liquidity;
        pool.lastUpdate = block.timestamp;
        
        LiquidityPosition storage position = userPositions[syToken][msg.sender];
        position.liquidity += liquidity;
        position.ptAmount += ptAmount;
        position.ytAmount += ytAmount;
        position.lastClaim = block.timestamp;
        
        IERC20(pool.ptToken).safeTransferFrom(msg.sender, address(this), ptAmount);
        IERC20(pool.ytToken).safeTransferFrom(msg.sender, address(this), ytAmount);
        
        emit LiquidityAdded(msg.sender, syToken, ptAmount, ytAmount, liquidity);
    }
    
    function removeLiquidity(
        address syToken,
        uint256 liquidity,
        uint256 minPTAmount,
        uint256 minYTAmount
    ) external nonReentrant returns (uint256 ptAmount, uint256 ytAmount) {
        Pool storage pool = pools[syToken];
        require(pool.active, "Pool not active");
        
        LiquidityPosition storage position = userPositions[syToken][msg.sender];
        require(position.liquidity >= liquidity, "Insufficient liquidity");
        
        ptAmount = (liquidity * pool.ptReserves) / pool.totalLiquidity;
        ytAmount = (liquidity * pool.ytReserves) / pool.totalLiquidity;
        
        require(ptAmount >= minPTAmount, "Insufficient PT amount");
        require(ytAmount >= minYTAmount, "Insufficient YT amount");
        
        pool.ptReserves -= ptAmount;
        pool.ytReserves -= ytAmount;
        pool.totalLiquidity -= liquidity;
        pool.lastUpdate = block.timestamp;
        
        position.liquidity -= liquidity;
        position.ptAmount -= ptAmount;
        position.ytAmount -= ytAmount;
        
        IERC20(pool.ptToken).safeTransfer(msg.sender, ptAmount);
        IERC20(pool.ytToken).safeTransfer(msg.sender, ytAmount);
        
        emit LiquidityRemoved(msg.sender, syToken, ptAmount, ytAmount, liquidity);
    }
    
    function swapPTForYT(
        address syToken,
        uint256 ptAmountIn,
        uint256 minYTAmountOut
    ) external nonReentrant returns (uint256 ytAmountOut) {
        require(ptAmountIn > 0, "Invalid input amount");
        
        ytAmountOut = _swap(syToken, true, ptAmountIn, minYTAmountOut);
        
        emit SwapExecuted(msg.sender, syToken, true, ptAmountIn, ytAmountOut, swapFee);
    }
    
    function swapYTForPT(
        address syToken,
        uint256 ytAmountIn,
        uint256 minPTAmountOut
    ) external nonReentrant returns (uint256 ptAmountOut) {
        require(ytAmountIn > 0, "Invalid input amount");
        
        ptAmountOut = _swap(syToken, false, ytAmountIn, minPTAmountOut);
        
        emit SwapExecuted(msg.sender, syToken, false, ytAmountIn, ptAmountOut, swapFee);
    }
    
    function _swap(
        address syToken,
        bool ptToYt,
        uint256 amountIn,
        uint256 minAmountOut
    ) internal returns (uint256 amountOut) {
        Pool storage pool = pools[syToken];
        require(pool.active, "Pool not active");
        
        uint256 inputReserve = ptToYt ? pool.ptReserves : pool.ytReserves;
        uint256 outputReserve = ptToYt ? pool.ytReserves : pool.ptReserves;
        
        uint256 feeAmount = (amountIn * swapFee) / FEE_DENOMINATOR;
        uint256 amountInAfterFee = amountIn - feeAmount;
        
        amountOut = (amountInAfterFee * outputReserve) / (inputReserve + amountInAfterFee);
        
        require(amountOut >= minAmountOut, "Insufficient output amount");
        require(amountOut < outputReserve, "Insufficient liquidity");
        
        if (ptToYt) {
            pool.ptReserves += amountIn;
            pool.ytReserves -= amountOut;
        } else {
            pool.ytReserves += amountIn;
            pool.ptReserves -= amountOut;
        }
        
        pool.lastUpdate = block.timestamp;
        
        address inputToken = ptToYt ? pool.ptToken : pool.ytToken;
        address outputToken = ptToYt ? pool.ytToken : pool.ptToken;
        
        IERC20(inputToken).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(outputToken).safeTransfer(msg.sender, amountOut);
        
        return amountOut;
    }
    
    function getPoolReserves(address syToken) external view returns (uint256 ptReserves, uint256 ytReserves) {
        Pool storage pool = pools[syToken];
        return (pool.ptReserves, pool.ytReserves);
    }
    
    function getSwapQuote(
        address syToken,
        bool ptToYt,
        uint256 amountIn
    ) external view returns (uint256 amountOut, uint256 fee) {
        Pool storage pool = pools[syToken];
        require(pool.active, "Pool not active");
        
        uint256 inputReserve = ptToYt ? pool.ptReserves : pool.ytReserves;
        uint256 outputReserve = ptToYt ? pool.ytReserves : pool.ptReserves;
        
        fee = (amountIn * swapFee) / FEE_DENOMINATOR;
        uint256 amountInAfterFee = amountIn - fee;
        
        amountOut = (amountInAfterFee * outputReserve) / (inputReserve + amountInAfterFee);
    }
    
    function updateSwapFee(uint256 newFee) external onlyOwner {
        require(newFee <= 500, "Fee too high");
        swapFee = newFee;
    }
    
    function updateProtocolFee(uint256 newFee) external onlyOwner {
        require(newFee <= 100, "Fee too high");
        protocolFee = newFee;
    }
    
    function updateFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid address");
        feeRecipient = newRecipient;
    }
}

// ============================================================================
// TOKEN CONTRACTS
// ============================================================================

// ============================================================================
// CorePrincipalToken.sol
// ============================================================================

contract CorePrincipalToken is ERC20, Ownable {
    address public immutable syToken;
    uint256 public immutable maturity;
    
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    
    constructor(
        string memory name,
        string memory symbol,
        address _syToken,
        uint256 _maturity
    ) ERC20(name, symbol) Ownable(msg.sender) {
        syToken = _syToken;
        maturity = _maturity;
    }
    
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
    
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
        emit TokensBurned(from, amount);
    }
    
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        require(block.timestamp < maturity, "Market expired");
        return super.transfer(to, amount);
    }
    
    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
        require(block.timestamp < maturity, "Market expired");
        return super.transferFrom(from, to, amount);
    }
}

// ============================================================================
// CoreYieldToken.sol
// ============================================================================

contract CoreYieldToken is ERC20, Ownable {
    address public immutable syToken;
    uint256 public immutable maturity;
    
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    
    constructor(
        string memory name,
        string memory symbol,
        address _syToken,
        uint256 _maturity
    ) ERC20(name, symbol) Ownable(msg.sender) {
        syToken = _syToken;
        maturity = _maturity;
    }
    
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
    
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
        emit TokensBurned(from, amount);
    }
    
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        require(block.timestamp < maturity, "Market expired");
        return super.transfer(to, amount);
    }
    
    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
        require(block.timestamp < maturity, "Market expired");
        return super.transferFrom(from, to, amount);
    }
}

// ============================================================================
// INCENTIVE CONTRACTS
// ============================================================================

// ============================================================================
// LiquidityMining.sol
// ============================================================================

contract LiquidityMining is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Math for uint256;
    
    struct PoolRewards {
        address rewardToken;
        uint256 rewardRate;
        uint256 lastUpdateTime;
        uint256 rewardPerTokenStored;
        uint256 totalStaked;
    }
    
    struct UserRewards {
        uint256 rewardPerTokenPaid;
        uint256 rewards;
        uint256 lastStakeTime;
        uint256 totalStaked;
    }
    
    event PoolAdded(address indexed syToken, address indexed rewardToken, uint256 rewardRate);
    event PoolRemoved(address indexed syToken);
    event Staked(address indexed user, address indexed syToken, uint256 amount);
    event Unstaked(address indexed user, address indexed syToken, uint256 amount);
    event RewardsClaimed(address indexed user, address indexed rewardToken, uint256 amount);
    event RewardRateUpdated(address indexed syToken, uint256 newRate);
    
    mapping(address => PoolRewards) public poolRewards;
    mapping(address => mapping(address => UserRewards)) public userRewards;
    mapping(address => bool) public supportedPools;
    
    address[] public activePools;
    CoreYieldAMM public immutable amm;
    
    uint256 public constant PRECISION = 1e18;
    uint256 public constant MIN_STAKE_AMOUNT = 1e18;
    
    constructor(address _amm) Ownable(msg.sender) {
        require(_amm != address(0), "Invalid AMM address");
        amm = CoreYieldAMM(_amm);
    }
    
    function addPool(
        address syToken,
        address rewardToken,
        uint256 rewardRate
    ) external onlyOwner {
        require(syToken != address(0), "Invalid SY token");
        require(rewardToken != address(0), "Invalid reward token");
        require(!supportedPools[syToken], "Pool already exists");
        require(rewardRate > 0, "Invalid reward rate");
        
        poolRewards[syToken] = PoolRewards({
            rewardToken: rewardToken,
            rewardRate: rewardRate,
            lastUpdateTime: block.timestamp,
            rewardPerTokenStored: 0,
            totalStaked: 0
        });
        
        supportedPools[syToken] = true;
        activePools.push(syToken);
        
        emit PoolAdded(syToken, rewardToken, rewardRate);
    }
    
    function removePool(address syToken) external onlyOwner {
        require(supportedPools[syToken], "Pool not found");
        require(poolRewards[syToken].totalStaked == 0, "Pool has staked liquidity");
        
        supportedPools[syToken] = false;
        
        for (uint256 i = 0; i < activePools.length; i++) {
            if (activePools[i] == syToken) {
                activePools[i] = activePools[activePools.length - 1];
                activePools.pop();
                break;
            }
        }
        
        emit PoolRemoved(syToken);
    }
    
    function stake(address syToken, uint256 amount) external nonReentrant {
        require(supportedPools[syToken], "Pool not supported");
        require(amount >= MIN_STAKE_AMOUNT, "Amount too small");
        
        PoolRewards storage pool = poolRewards[syToken];
        UserRewards storage user = userRewards[syToken][msg.sender];
        
        _updateRewards(syToken);
        _updateUserRewards(syToken, msg.sender);
        
        (uint256 ptReserves, uint256 ytReserves) = amm.getPoolReserves(syToken);
        require(ptReserves > 0, "Pool not initialized");
        
        user.rewardPerTokenPaid = pool.rewardPerTokenStored;
        user.lastStakeTime = block.timestamp;
        user.totalStaked += amount;
        
        pool.totalStaked += amount;
        
        emit Staked(msg.sender, syToken, amount);
    }
    
    function unstake(address syToken, uint256 amount) external nonReentrant {
        require(supportedPools[syToken], "Pool not supported");
        require(amount > 0, "Invalid amount");
        
        PoolRewards storage pool = poolRewards[syToken];
        UserRewards storage user = userRewards[syToken][msg.sender];
        
        require(user.totalStaked >= amount, "Insufficient staked amount");
        
        _updateRewards(syToken);
        _updateUserRewards(syToken, msg.sender);
        
        user.rewardPerTokenPaid = pool.rewardPerTokenStored;
        user.totalStaked -= amount;
        
        pool.totalStaked -= amount;
        
        emit Unstaked(msg.sender, syToken, amount);
    }
    
    function claimRewards(address syToken) external nonReentrant returns (uint256 rewardAmount) {
        require(supportedPools[syToken], "Pool not supported");
        
        PoolRewards storage pool = poolRewards[syToken];
        UserRewards storage user = userRewards[syToken][msg.sender];
        
        _updateRewards(syToken);
        _updateUserRewards(syToken, msg.sender);
        
        rewardAmount = user.rewards;
        require(rewardAmount > 0, "No rewards to claim");
        
        user.rewards = 0;
        user.rewardPerTokenPaid = pool.rewardPerTokenStored;
        
        IERC20(pool.rewardToken).safeTransfer(msg.sender, rewardAmount);
        
        emit RewardsClaimed(msg.sender, pool.rewardToken, rewardAmount);
        
        return rewardAmount;
    }
    
    function _updateRewards(address syToken) internal {
        PoolRewards storage pool = poolRewards[syToken];
        
        if (pool.totalStaked == 0) {
            pool.lastUpdateTime = block.timestamp;
            return;
        }
        
        uint256 timeElapsed = block.timestamp - pool.lastUpdateTime;
        if (timeElapsed == 0) return;
        
        uint256 newRewards = pool.rewardRate * timeElapsed;
        pool.rewardPerTokenStored += (newRewards * PRECISION) / pool.totalStaked;
        pool.lastUpdateTime = block.timestamp;
    }
    
    function _updateUserRewards(address syToken, address user) internal {
        PoolRewards storage pool = poolRewards[syToken];
        UserRewards storage userReward = userRewards[syToken][user];
        
        if (pool.totalStaked == 0) return;
        
        uint256 timeElapsed = block.timestamp - pool.lastUpdateTime;
        uint256 newRewards = pool.rewardRate * timeElapsed;
        uint256 rewardPerToken = pool.rewardPerTokenStored + (newRewards * PRECISION) / pool.totalStaked;
        
        uint256 pending = (userReward.totalStaked * (rewardPerToken - userReward.rewardPerTokenPaid)) / PRECISION;
        userReward.rewards += pending;
        userReward.rewardPerTokenPaid = rewardPerToken;
    }
    
    function pendingRewards(address syToken, address user) external view returns (uint256) {
        if (!supportedPools[syToken]) return 0;
        
        PoolRewards storage pool = poolRewards[syToken];
        UserRewards storage userReward = userRewards[syToken][user];
        
        if (pool.totalStaked == 0) return userReward.rewards;
        
        uint256 timeElapsed = block.timestamp - pool.lastUpdateTime;
        uint256 newRewards = pool.rewardRate * timeElapsed;
        uint256 rewardPerToken = pool.rewardPerTokenStored + (newRewards * PRECISION) / pool.totalStaked;
        
        uint256 pending = (userReward.totalStaked * (rewardPerToken - userReward.rewardPerTokenPaid)) / PRECISION;
        return userReward.rewards + pending;
    }
    
    function getPoolAPY(address syToken) external view returns (uint256) {
        if (!supportedPools[syToken]) return 0;
        
        PoolRewards storage pool = poolRewards[syToken];
        if (pool.totalStaked == 0) return 0;
        
        uint256 annualRewards = pool.rewardRate * 365 days;
        
        uint256 apy = (annualRewards * PRECISION) / pool.totalStaked;
        
        return apy;
    }
    
    function updateRewardRate(address syToken, uint256 newRate) external onlyOwner {
        require(supportedPools[syToken], "Pool not found");
        require(newRate >= 0, "Invalid rate");
        
        _updateRewards(syToken);
        
        poolRewards[syToken].rewardRate = newRate;
        
        emit RewardRateUpdated(syToken, newRate);
    }
    
    function getActivePools() external view returns (address[] memory) {
        return activePools;
    }
    
    function getUserStakedAmount(address syToken, address user) external view returns (uint256) {
        return userRewards[syToken][user].totalStaked;
    }
    
    function emergencyRecover(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}

// ============================================================================
// ORACLE CONTRACTS
// ============================================================================

// ============================================================================
// ChainlinkPriceOracle.sol
// ============================================================================

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
    
    function getPriceInUSD(address token) external view returns (uint256) {
        return this.getPrice(token);
    }
    
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
    
    function setPriceFeed(address token, address feed, uint8 decimals) external onlyOwner {
        require(feed != address(0), "Invalid feed address");
        require(decimals <= 18, "Decimals too high");
        
        priceFeeds[token] = feed;
        priceDecimals[token] = decimals;
        
        emit PriceFeedUpdated(token, feed, decimals);
    }
    
    function setFallbackPrice(address token, uint256 price) external onlyOwner {
        require(price > 0, "Invalid price");
        
        uint256 oldPrice = fallbackPrices[token];
        fallbackPrices[token] = price;
        
        emit FallbackPriceUpdated(token, oldPrice, price);
    }
    
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

// ============================================================================
// LIBRARY CONTRACTS
// ============================================================================

// ============================================================================
// LibYieldMath.sol
// ============================================================================

library LibYieldMath {
    uint256 public constant PRECISION = 1e18;
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant MAX_YIELD_RATE = 10000;
    
    struct YieldCurve {
        uint256[] maturities;
        uint256[] rates;
        uint256 volatility;
        uint256 lastUpdate;
    }
    
    function calculatePTPrice(
        uint256 syAmount,
        uint256 maturity,
        uint256 currentTime,
        uint256 yieldRate
    ) internal pure returns (uint256 ptPrice, uint256 ytPrice) {
        require(maturity > currentTime, "Invalid maturity");
        require(yieldRate <= MAX_YIELD_RATE, "Yield rate too high");
        
        uint256 timeToMaturity = maturity - currentTime;
        uint256 annualizedTime = (timeToMaturity * PRECISION) / SECONDS_PER_YEAR;
        
        uint256 yieldRateDecimal = (yieldRate * PRECISION) / 10000;
        uint256 discountFactor = PRECISION + yieldRateDecimal;
        
        ptPrice = (syAmount * PRECISION) / discountFactor;
        ytPrice = syAmount - ptPrice;
        
        return (ptPrice, ytPrice);
    }
    
    function calculateYieldAccrual(
        uint256 ytAmount,
        uint256 timeElapsed,
        uint256 yieldRate
    ) internal pure returns (uint256 yield) {
        require(yieldRate <= MAX_YIELD_RATE, "Yield rate too high");
        
        uint256 yieldRateDecimal = (yieldRate * PRECISION) / 10000;
        uint256 annualizedTime = (timeElapsed * PRECISION) / SECONDS_PER_YEAR;
        
        yield = (ytAmount * yieldRateDecimal * annualizedTime) / PRECISION;
        return yield;
    }
    
    function interpolateYieldCurve(
        YieldCurve memory curve,
        uint256 targetMaturity
    ) internal view returns (uint256 interpolatedRate) {
        require(curve.maturities.length >= 2, "Insufficient curve points");
        require(targetMaturity > block.timestamp, "Invalid target maturity");
        
        uint256 lowerMaturity = 0;
        uint256 upperMaturity = type(uint256).max;
        uint256 lowerRate = 0;
        uint256 upperRate = 0;
        
        for (uint256 i = 0; i < curve.maturities.length; i++) {
            if (curve.maturities[i] <= targetMaturity && curve.maturities[i] > lowerMaturity) {
                lowerMaturity = curve.maturities[i];
                lowerRate = curve.rates[i];
            }
            if (curve.maturities[i] >= targetMaturity && curve.maturities[i] < upperMaturity) {
                upperMaturity = curve.maturities[i];
                upperRate = curve.rates[i];
            }
        }
        
        if (upperMaturity == type(uint256).max) {
            return lowerRate;
        }
        
        uint256 maturityDiff = upperMaturity - lowerMaturity;
        uint256 targetDiff = targetMaturity - lowerMaturity;
        
        interpolatedRate = lowerRate + (
            (upperRate - lowerRate) * targetDiff / maturityDiff
        );
        
        return interpolatedRate;
    }
    
    function calculateVolatilityAdjustedYield(
        uint256 baseYield,
        uint256 volatility,
        uint256 timeToMaturity
    ) internal pure returns (uint256 adjustedYield) {
        require(baseYield <= MAX_YIELD_RATE, "Base yield too high");
        require(volatility <= MAX_YIELD_RATE, "Volatility too high");
        
        uint256 annualizedTime = (timeToMaturity * PRECISION) / SECONDS_PER_YEAR;
        uint256 volatilityAdjustment = (volatility * annualizedTime) / PRECISION;
        
        adjustedYield = baseYield + volatilityAdjustment;
        
        if (adjustedYield > MAX_YIELD_RATE) {
            adjustedYield = MAX_YIELD_RATE;
        }
        
        return adjustedYield;
    }
    
    function calculateOptimalSplitRatio(
        uint256 syAmount,
        uint256 maturity,
        uint256 currentTime,
        uint256 yieldRate,
        uint256 userRiskProfile
    ) internal pure returns (uint256 ptRatio, uint256 ytRatio) {
        require(userRiskProfile <= 100, "Invalid risk profile");
        
        (uint256 ptPrice, uint256 ytPrice) = calculatePTPrice(
            syAmount,
            maturity,
            currentTime,
            yieldRate
        );
        
        uint256 basePTRatio = (ptPrice * 10000) / syAmount;
        
        uint256 riskAdjustment = userRiskProfile * 100;
        
        ptRatio = basePTRatio + riskAdjustment;
        ytRatio = 10000 - ptRatio;
        
        if (ptRatio > 10000) {
            ptRatio = 10000;
            ytRatio = 0;
        }
        
        return (ptRatio, ytRatio);
    }
}

// ============================================================================
// MOCK CONTRACTS
// ============================================================================

// ============================================================================
// MockDualCORE.sol
// ============================================================================

contract MockDualCORE is ERC20, Ownable {
    uint256 public rewardRate = 1210;
    uint256 public coreReserve;
    uint256 public btcReserve;
    uint256 public totalLiquidity;
    
    mapping(address => uint256) public liquidityProvided;
    mapping(address => uint256) public lastLPTime;
    
    event LiquidityAdded(address indexed provider, uint256 coreAmount, uint256 btcAmount, uint256 lpTokens);
    event LiquidityRemoved(address indexed provider, uint256 lpTokens, uint256 coreAmount, uint256 btcAmount);
    
    constructor() ERC20("Dual Staked CORE", "dualCORE") Ownable(msg.sender){
        _mint(msg.sender, 500000 * 10**18);
        coreReserve = 1000000 * 10**18;
        btcReserve = 100 * 10**18;
        totalLiquidity = 500000 * 10**18;
    }
    
    function mint(address to, uint256 amount) external {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than zero");
        require(coreReserve >= amount / 2, "Insufficient CORE reserve");
        require(btcReserve >= amount / 20000, "Insufficient BTC reserve");
        
        _mint(to, amount);
        liquidityProvided[to] += amount;
        lastLPTime[to] = block.timestamp;
        totalLiquidity += amount;
        emit LiquidityAdded(to, amount / 2, amount / 20000, amount);
    }
    
    function getRewardRate() external view returns (uint256) {
        return rewardRate;
    }
    
    function getPoolInfo() external view returns (
        uint256 coreReserve_,
        uint256 btcReserve_,
        uint256 totalLiquidity_,
        uint256 currentAPY
    ) {
        coreReserve_ = coreReserve;
        btcReserve_ = btcReserve;
        totalLiquidity_ = totalLiquidity;
        currentAPY = rewardRate;
    }
    
    function getUserLPInfo(address user) external view returns (
        uint256 lpTokens,
        uint256 lpDuration,
        uint256 shareOfPool,
        uint256 estimatedRewards
    ) {
        lpTokens = balanceOf(user);
        lpDuration = block.timestamp - lastLPTime[user];
        shareOfPool = totalLiquidity > 0 ? (lpTokens * 10000) / totalLiquidity : 0;
        estimatedRewards = (lpTokens * rewardRate * lpDuration) / (365 days * 10000);
    }
}

// ============================================================================
// MockLstBTC.sol
// ============================================================================

contract MockLstBTC is ERC20, Ownable {
    uint256 public rewardRate = 420;
    uint256 public exchangeRate = 1 ether;
    uint256 public lastRateUpdate;
    
    mapping(address => uint256) public depositTime;
    
    event ExchangeRateUpdated(uint256 oldRate, uint256 newRate);
    event BTCDeposited(address indexed user, uint256 btcAmount, uint256 lstBTCAmount);
    
    constructor() ERC20("Liquid Staked BTC", "lstBTC") Ownable(msg.sender) {
        _mint(msg.sender, 100 * 10**18);
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

// ============================================================================
// MockStCORE.sol
// ============================================================================

contract MockStCORE is ERC20, Ownable {
    uint256 public rewardRate = 850;
    uint256 public totalStaked;
    uint256 public rewardPool;
    
    mapping(address => uint256) public lastUpdateTime;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public stakingTime;
    
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);
    
    constructor() ERC20("Staked CORE", "stCORE") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10**18);
        _mint(address(this), 1000000 * 10**18);
        rewardPool = 1000000 * 10**18;
        lastUpdateTime[msg.sender] = block.timestamp;
        stakingTime[msg.sender] = block.timestamp;
    }
    
    function mint(address to, uint256 amount) external {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than zero");
        require(rewardPool >= amount, "Insufficient reward pool");
        
        _mint(to, amount);
        if (lastUpdateTime[to] == 0) {
            lastUpdateTime[to] = block.timestamp;
            stakingTime[to] = block.timestamp;
        }
        totalStaked += amount;
        emit Staked(to, amount);
    }
    
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
        totalStaked -= amount;
        emit Unstaked(from, amount);
    }
    
    function getRewardRate() external view returns (uint256) {
        return rewardRate;
    }
    
    function earned(address account) external view returns (uint256) {
        if (lastUpdateTime[account] == 0) return 0;
        uint256 timeElapsed = block.timestamp - lastUpdateTime[account];
        uint256 baseReward = (balanceOf(account) * rewardRate * timeElapsed) / (365 days * 10000);
        
        uint256 stakingDuration = block.timestamp - stakingTime[account];
        uint256 bonus = stakingDuration > 30 days ? baseReward / 10 : 0;
        
        return baseReward + bonus;
    }
    
    function getReward() external returns (uint256) {
        uint256 reward = this.earned(msg.sender);
        require(reward > 0, "No rewards to claim");
        require(rewardPool >= reward, "Insufficient reward pool");
        
        rewards[msg.sender] = 0;
        lastUpdateTime[msg.sender] = block.timestamp;
        rewardPool -= reward;
        _mint(msg.sender, reward);
        emit RewardClaimed(msg.sender, reward);
        
        return reward;
    }
    
    function setRewardRate(uint256 newRate) external onlyOwner {
        require(newRate <= 2000, "Rate too high");
        uint256 oldRate = rewardRate;
        rewardRate = newRate;
        emit RewardRateUpdated(oldRate, newRate);
    }
    
    function fastForwardTime(uint256 timeInSeconds) external {
        lastUpdateTime[msg.sender] = block.timestamp - timeInSeconds;
    }
    
    function getStakingInfo(address account) external view returns (
        uint256 stakedAmount,
        uint256 stakingDuration,
        uint256 currentReward,
        uint256 projectedAnnualReward
    ) {
        stakedAmount = balanceOf(account);
        stakingDuration = block.timestamp - stakingTime[account];
        currentReward = this.earned(account);
        projectedAnnualReward = (stakedAmount * rewardRate) / 10000;
    }
    
    function getTotalStats() external view returns (
        uint256 totalSupply_,
        uint256 totalStaked_,
        uint256 rewardPool_,
        uint256 currentAPY
    ) {
        totalSupply_ = totalSupply();
        totalStaked_ = totalStaked;
        rewardPool_ = rewardPool;
        currentAPY = rewardRate;
    }
}

// ============================================================================
// MockPriceOracle.sol
// ============================================================================

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

// ============================================================================
// LibDiamond.sol
// ============================================================================

library LibDiamond {
    bytes32 constant DIAMOND_STORAGE_POSITION = keccak256("diamond.standard.diamond.storage");
    
    struct DiamondStorage {
        mapping(address => ICoreYieldFactory.Market) markets;
        mapping(address => mapping(address => ICoreYieldFactory.UserPosition)) userPositions;
        mapping(address => address[]) userMarkets;
        
        address[] allMarkets;
        uint256 protocolFeeRate;
        uint256 maxProtocolFeeRate;
        address feeRecipient;
        address priceOracle;
    }
    
    function diamondStorage() internal pure returns (DiamondStorage storage ds) {
        bytes32 position = DIAMOND_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }
}

// ============================================================================
// END OF ALL COREYIELD CONTRACTS
// ============================================================================

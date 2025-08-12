pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/ICoreYieldFactory.sol";
import "../interfaces/IYieldSource.sol";
import "../tokens/CorePrincipalToken.sol";
import "../tokens/CoreYieldToken.sol";


contract CoreYieldFactory is Ownable, ReentrancyGuard, ICoreYieldFactory {
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
} 
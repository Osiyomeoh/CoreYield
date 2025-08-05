// contracts/core/CoreYieldFactory.sol (Fixed - All Imports Working)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/ICoreYieldFactory.sol";

// Forward declarations to avoid circular imports
interface IERC20Token {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface IStandardizedYieldToken is IERC20Token {
    function wrap(uint256 amount) external returns (uint256);
    function unwrap(uint256 syAmount) external returns (uint256);
    function getAccumulatedYield(address user) external view returns (uint256);
}

interface ICorePrincipalToken is IERC20Token {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
    function isExpired() external view returns (bool);
}

interface ICoreYieldTokenContract is IERC20Token {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
    function claimYield() external returns (uint256);
    function claimableYield(address user) external view returns (uint256);
}

contract CoreYieldFactory is Ownable, ReentrancyGuard, ICoreYieldFactory {
    
    // Use Market struct from interface - no duplicate declaration
    struct UserPosition {
        uint256 syAmount;
        uint256 ptAmount;
        uint256 ytAmount;
        uint256 lastInteraction;
    }
    
    mapping(bytes32 => Market) public markets;
    mapping(bytes32 => mapping(address => UserPosition)) public userPositions;
    mapping(address => bytes32[]) public userMarkets;
    
    bytes32[] public allMarkets;
    uint256 public constant MIN_MATURITY = 1 days;
    uint256 public constant MAX_MATURITY = 365 days;
    uint256 public protocolFeeRate = 50; // 0.5%
    address public feeRecipient;
    
    event MarketCreated(
        bytes32 indexed marketId,
        address indexed syToken,
        address indexed creator,
        address ptToken,
        address ytToken,
        uint256 maturity
    );
    
    event TokensSplit(
        bytes32 indexed marketId,
        address indexed user,
        uint256 syAmount,
        uint256 ptAmount,
        uint256 ytAmount
    );
    
    event TokensRedeemed(
        bytes32 indexed marketId,
        address indexed user,
        uint256 amount,
        bool isMatured
    );
    
    event YieldClaimed(
        bytes32 indexed marketId,
        address indexed user,
        uint256 yieldAmount
    );

    constructor(address _feeRecipient) Ownable(msg.sender) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
    }
    
    function createMarket(
        address syToken,
        uint256 maturityDuration,
        string memory ptName,
        string memory ptSymbol,
        string memory ytName,
        string memory ytSymbol
    ) external override returns (bytes32 marketId) {
        require(syToken != address(0), "Invalid SY token");
        require(maturityDuration >= MIN_MATURITY && maturityDuration <= MAX_MATURITY, "Invalid maturity");
        require(bytes(ptName).length > 0 && bytes(ytName).length > 0, "Invalid token names");
        
        uint256 maturity = block.timestamp + maturityDuration;
        marketId = keccak256(abi.encodePacked(syToken, maturity, block.timestamp, msg.sender));
        require(markets[marketId].syToken == address(0), "Market exists");
        
        // Deploy PT and YT contracts using CREATE2 for deterministic addresses
        bytes32 salt = keccak256(abi.encodePacked(marketId, "PT"));
        address ptTokenAddress = _deployPTContract(ptName, ptSymbol, syToken, maturity, salt);
        
        bytes32 ytSalt = keccak256(abi.encodePacked(marketId, "YT"));
        address ytTokenAddress = _deployYTContract(ytName, ytSymbol, syToken, maturity, ytSalt);
        
        require(ptTokenAddress != address(0), "PT deployment failed");
        require(ytTokenAddress != address(0), "YT deployment failed");
        
        markets[marketId] = Market({
            syToken: syToken,
            ptToken: ptTokenAddress,
            ytToken: ytTokenAddress,
            maturity: maturity,
            totalSYDeposited: 0,
            active: true,
            createdAt: block.timestamp
        });
        
        allMarkets.push(marketId);
        emit MarketCreated(marketId, syToken, msg.sender, ptTokenAddress, ytTokenAddress, maturity);
        return marketId;
    }
    
    function splitTokens(bytes32 marketId, uint256 syAmount) external override nonReentrant {
        Market storage market = markets[marketId];
        require(market.active, "Market not active");
        require(block.timestamp < market.maturity, "Market expired");
        require(syAmount > 0, "Invalid amount");
        
        IStandardizedYieldToken sy = IStandardizedYieldToken(market.syToken);
        ICorePrincipalToken pt = ICorePrincipalToken(market.ptToken);
        ICoreYieldTokenContract yt = ICoreYieldTokenContract(market.ytToken);
        
        // Calculate protocol fee
        uint256 fee = (syAmount * protocolFeeRate) / 10000;
        uint256 netAmount = syAmount - fee;
        
        // Transfer SY tokens from user
        require(sy.transferFrom(msg.sender, address(this), syAmount), "SY transfer failed");
        
        // Transfer fee if applicable
        if (fee > 0) {
            require(sy.transfer(feeRecipient, fee), "Fee transfer failed");
        }
        
        // Mint PT and YT tokens
        pt.mint(msg.sender, netAmount);
        yt.mint(msg.sender, netAmount);
        
        // Update tracking
        market.totalSYDeposited += netAmount;
        UserPosition storage userPos = userPositions[marketId][msg.sender];
        userPos.syAmount += netAmount;
        userPos.ptAmount += netAmount;
        userPos.ytAmount += netAmount;
        userPos.lastInteraction = block.timestamp;
        
        // Add to user markets if first time
        if (userPos.syAmount == netAmount) {
            userMarkets[msg.sender].push(marketId);
        }
        
        emit TokensSplit(marketId, msg.sender, netAmount, netAmount, netAmount);
    }
    
    function redeemTokens(bytes32 marketId, uint256 amount) external override nonReentrant {
        Market storage market = markets[marketId];
        require(market.active, "Market not active");
        require(amount > 0, "Invalid amount");
        
        IStandardizedYieldToken sy = IStandardizedYieldToken(market.syToken);
        ICorePrincipalToken pt = ICorePrincipalToken(market.ptToken);
        ICoreYieldTokenContract yt = ICoreYieldTokenContract(market.ytToken);
        
        bool isMatured = block.timestamp >= market.maturity;
        
        if (isMatured) {
            require(pt.balanceOf(msg.sender) >= amount, "Insufficient PT");
            pt.burn(msg.sender, amount);
        } else {
            require(pt.balanceOf(msg.sender) >= amount, "Insufficient PT");
            require(yt.balanceOf(msg.sender) >= amount, "Insufficient YT");
            pt.burn(msg.sender, amount);
            yt.burn(msg.sender, amount);
        }
        
        require(sy.transfer(msg.sender, amount), "SY transfer failed");
        
        // Update tracking
        market.totalSYDeposited = market.totalSYDeposited > amount ? market.totalSYDeposited - amount : 0;
        UserPosition storage userPos = userPositions[marketId][msg.sender];
        userPos.syAmount = userPos.syAmount > amount ? userPos.syAmount - amount : 0;
        if (!isMatured) {
            userPos.ptAmount = userPos.ptAmount > amount ? userPos.ptAmount - amount : 0;
            userPos.ytAmount = userPos.ytAmount > amount ? userPos.ytAmount - amount : 0;
        } else {
            userPos.ptAmount = userPos.ptAmount > amount ? userPos.ptAmount - amount : 0;
        }
        userPos.lastInteraction = block.timestamp;
        
        emit TokensRedeemed(marketId, msg.sender, amount, isMatured);
    }
    
    function claimYield(bytes32 marketId) external override nonReentrant {
        Market storage market = markets[marketId];
        require(market.active, "Market not active");
        
        ICoreYieldTokenContract yt = ICoreYieldTokenContract(market.ytToken);
        require(yt.balanceOf(msg.sender) > 0, "No YT tokens");
        
        uint256 claimedAmount = yt.claimYield();
        
        if (claimedAmount > 0) {
            userPositions[marketId][msg.sender].lastInteraction = block.timestamp;
            emit YieldClaimed(marketId, msg.sender, claimedAmount);
        }
    }
    
    // ========== VIEW FUNCTIONS ==========
    
    function getMarket(bytes32 marketId) external view override returns (Market memory) {
        return markets[marketId];
    }
    
    function getAllMarkets() external view returns (bytes32[] memory) {
        return allMarkets;
    }
    
    function getUserMarkets(address user) external view returns (bytes32[] memory) {
        return userMarkets[user];
    }
    
    function getUserPosition(bytes32 marketId, address user) external view returns (UserPosition memory) {
        return userPositions[marketId][user];
    }
    
    function getMarketCount() external view returns (uint256) {
        return allMarkets.length;
    }
    
    function isMarketActive(bytes32 marketId) external view returns (bool) {
        Market storage market = markets[marketId];
        return market.active && block.timestamp < market.maturity;
    }
    
    function getMarketAnalytics(bytes32 marketId) external view returns (
        uint256 totalDeposited,
        uint256 daysToMaturity,
        bool isActive,
        bool isExpired
    ) {
        Market storage market = markets[marketId];
        require(market.syToken != address(0), "Market does not exist");
        
        totalDeposited = market.totalSYDeposited;
        isExpired = block.timestamp >= market.maturity;
        daysToMaturity = isExpired ? 0 : (market.maturity - block.timestamp) / 1 days;
        isActive = market.active && !isExpired;
    }
    
    function getUserAnalytics(address user) external view returns (
        uint256 totalMarkets,
        uint256 activePTBalance,
        uint256 activeYTBalance,
        uint256 totalSYInvested,
        uint256 lastActivityTime
    ) {
        bytes32[] memory userMarketsList = userMarkets[user];
        totalMarkets = userMarketsList.length;
        
        for (uint256 i = 0; i < userMarketsList.length; i++) {
            UserPosition memory pos = userPositions[userMarketsList[i]][user];
            Market storage market = markets[userMarketsList[i]];
            
            if (market.active && block.timestamp < market.maturity) {
                activePTBalance += pos.ptAmount;
                activeYTBalance += pos.ytAmount;
            }
            
            totalSYInvested += pos.syAmount;
            
            if (pos.lastInteraction > lastActivityTime) {
                lastActivityTime = pos.lastInteraction;
            }
        }
    }
    
    function getClaimableYield(bytes32 marketId, address user) external view returns (uint256) {
        Market storage market = markets[marketId];
        if (!market.active) return 0;
        
        try ICoreYieldTokenContract(market.ytToken).claimableYield(user) returns (uint256 claimable) {
            return claimable;
        } catch {
            return 0;
        }
    }
    
    // ========== INTERNAL DEPLOYMENT FUNCTIONS ==========
    
    function _deployPTContract(
        string memory name,
        string memory symbol,
        address syToken,
        uint256 maturity,
        bytes32 salt
    ) internal returns (address) {
        // Deploy using inline bytecode to avoid import conflicts
        bytes memory bytecode = abi.encodePacked(
            type(SimplePTToken).creationCode,
            abi.encode(name, symbol, syToken, maturity)
        );
        
        address deployed;
        assembly {
            deployed := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }
        return deployed;
    }
    
    function _deployYTContract(
        string memory name,
        string memory symbol,
        address syToken,
        uint256 maturity,
        bytes32 salt
    ) internal returns (address) {
        bytes memory bytecode = abi.encodePacked(
            type(SimpleYTToken).creationCode,
            abi.encode(name, symbol, syToken, maturity)
        );
        
        address deployed;
        assembly {
            deployed := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }
        return deployed;
    }
    
    // ========== ADMIN FUNCTIONS ==========
    
    function setProtocolFeeRate(uint256 newFeeRate) external onlyOwner {
        require(newFeeRate <= 1000, "Fee too high"); // Max 10%
        protocolFeeRate = newFeeRate;
    }
    
    function setFeeRecipient(address newFeeRecipient) external onlyOwner {
        require(newFeeRecipient != address(0), "Invalid address");
        feeRecipient = newFeeRecipient;
    }
    
    function emergencyPause(bytes32 marketId) external onlyOwner {
        require(markets[marketId].syToken != address(0), "Market does not exist");
        markets[marketId].active = false;
    }
    
    function reactivateMarket(bytes32 marketId) external onlyOwner {
        require(markets[marketId].syToken != address(0), "Market does not exist");
        require(block.timestamp < markets[marketId].maturity, "Market expired");
        markets[marketId].active = true;
    }
    
    // ========== TESTING HELPERS ==========
    
    function createTestMarket(address syToken, uint256 durationInDays) external returns (bytes32) {
        require(durationInDays >= 1 && durationInDays <= 365, "Invalid duration");
        
        string memory suffix = _toString(durationInDays);
        return this.createMarket(
            syToken,
            durationInDays * 1 days,
            string(abi.encodePacked("PT-", suffix, "D")),
            string(abi.encodePacked("PT", suffix)),
            string(abi.encodePacked("YT-", suffix, "D")),
            string(abi.encodePacked("YT", suffix))
        );
    }
    
    function getProtocolStats() external view returns (
        uint256 totalMarkets,
        uint256 activeMarkets,
        uint256 totalValueLocked
    ) {
        totalMarkets = allMarkets.length;
        
        for (uint256 i = 0; i < allMarkets.length; i++) {
            Market storage market = markets[allMarkets[i]];
            if (market.active && block.timestamp < market.maturity) {
                activeMarkets++;
            }
            totalValueLocked += market.totalSYDeposited;
        }
    }
    
    // Helper function for string conversion
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}

// ========== SIMPLE TOKEN CONTRACTS FOR DEPLOYMENT ==========

contract SimplePTToken {
    string public name;
    string public symbol;
    address public syToken;
    uint256 public maturity;
    address public factory;
    
    mapping(address => uint256) private _balances;
    uint256 private _totalSupply;
    
    constructor(string memory _name, string memory _symbol, address _syToken, uint256 _maturity) {
        name = _name;
        symbol = _symbol;
        syToken = _syToken;
        maturity = _maturity;
        factory = msg.sender;
    }
    
    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }
    
    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }
    
    function mint(address to, uint256 amount) external {
        require(msg.sender == factory, "Only factory");
        _balances[to] += amount;
        _totalSupply += amount;
    }
    
    function burn(address from, uint256 amount) external {
        require(msg.sender == factory, "Only factory");
        require(_balances[from] >= amount, "Insufficient balance");
        _balances[from] -= amount;
        _totalSupply -= amount;
    }
    
    function isExpired() external view returns (bool) {
        return block.timestamp >= maturity;
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        require(_balances[msg.sender] >= amount, "Insufficient balance");
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        return true;
    }
    
    function approve(address, uint256) external pure returns (bool) {
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(_balances[from] >= amount, "Insufficient balance");
        _balances[from] -= amount;
        _balances[to] += amount;
        return true;
    }
}

contract SimpleYTToken {
    string public name;
    string public symbol;
    address public syToken;
    uint256 public maturity;
    address public factory;
    
    mapping(address => uint256) private _balances;
    mapping(address => uint256) public lastClaimTime;
    mapping(address => uint256) public totalClaimed;
    uint256 private _totalSupply;
    
    constructor(string memory _name, string memory _symbol, address _syToken, uint256 _maturity) {
        name = _name;
        symbol = _symbol;
        syToken = _syToken;
        maturity = _maturity;
        factory = msg.sender;
    }
    
    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }
    
    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }
    
    function mint(address to, uint256 amount) external {
        require(msg.sender == factory, "Only factory");
        _balances[to] += amount;
        _totalSupply += amount;
        lastClaimTime[to] = block.timestamp;
    }
    
    function burn(address from, uint256 amount) external {
        require(msg.sender == factory, "Only factory");
        require(_balances[from] >= amount, "Insufficient balance");
        _balances[from] -= amount;
        _totalSupply -= amount;
    }
    
    function claimableYield(address user) external view returns (uint256) {
        if (_balances[user] == 0) return 0;
        uint256 timeElapsed = block.timestamp - lastClaimTime[user];
        return (_balances[user] * 850 * timeElapsed) / (365 days * 10000); // 8.5% APY
    }
    
    function claimYield() external returns (uint256) {
        uint256 claimable = this.claimableYield(msg.sender);
        if (claimable > 0) {
            totalClaimed[msg.sender] += claimable;
            lastClaimTime[msg.sender] = block.timestamp;
        }
        return claimable;
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        require(_balances[msg.sender] >= amount, "Insufficient balance");
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        return true;
    }
    
    function approve(address, uint256) external pure returns (bool) {
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(_balances[from] >= amount, "Insufficient balance");
        _balances[from] -= amount;
        _balances[to] += amount;
        return true;
    }
}
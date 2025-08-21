// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract CoreSwapAMM is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;
    using Math for uint256;

    struct Pool {
        address token0;
        address token1;
        uint256 reserve0;
        uint256 reserve1;
        uint256 totalSupply;
        uint256 fee;
        uint256 lastUpdateTime;
    }

    struct SwapInfo {
        uint256 amountIn;
        uint256 amountOut;
        uint256 priceImpact;
        uint256 fee;
    }

    mapping(bytes32 => Pool) public pools;
    mapping(address => bool) public supportedTokens;
    mapping(address => mapping(address => bytes32)) public poolKeys;
    
    uint256 public constant MINIMUM_LIQUIDITY = 1000;
    uint256 public constant MAX_FEE = 500; // 5%
    uint256 public defaultFee = 30; // 0.3%
    
    event PoolCreated(address indexed token0, address indexed token1, bytes32 indexed poolKey);
    event SwapExecuted(address indexed user, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);
    event LiquidityAdded(address indexed user, bytes32 indexed poolKey, uint256 amount0, uint256 amount1, uint256 liquidity);
    event LiquidityRemoved(address indexed user, bytes32 indexed poolKey, uint256 amount0, uint256 amount1, uint256 liquidity);

    constructor() Ownable(msg.sender) {
        // Initialize with common tokens
        supportedTokens[address(0)] = true; // Native token placeholder
    }

    modifier validPool(bytes32 poolKey) {
        require(pools[poolKey].token0 != address(0), "Pool does not exist");
        _;
    }

    function createPool(address token0, address token1) external onlyOwner returns (bytes32 poolKey) {
        require(token0 != token1, "Identical tokens");
        require(token0 < token1, "Token order");
        require(supportedTokens[token0] && supportedTokens[token1], "Both tokens must be supported");

        poolKey = keccak256(abi.encodePacked(token0, token1));
        require(pools[poolKey].token0 == address(0), "Pool already exists");

        pools[poolKey] = Pool({
            token0: token0,
            token1: token1,
            reserve0: 0,
            reserve1: 0,
            totalSupply: 0,
            fee: defaultFee,
            lastUpdateTime: block.timestamp
        });

        poolKeys[token0][token1] = poolKey;
        poolKeys[token1][token0] = poolKey;

        emit PoolCreated(token0, token1, poolKey);
    }

    function addLiquidity(
        address token0,
        address token1,
        uint256 amount0Desired,
        uint256 amount1Desired,
        uint256 amount0Min,
        uint256 amount1Min
    ) external nonReentrant whenNotPaused returns (uint256 liquidity) {
        bytes32 poolKey = poolKeys[token0][token1];
        require(poolKey != bytes32(0), "Pool not found");

        Pool storage pool = pools[poolKey];
        require(pool.token0 == token0 && pool.token1 == token1, "Invalid pool");

        uint256 amount0;
        uint256 amount1;

        if (pool.totalSupply == 0) {
            // Initial liquidity: use constant product formula
            liquidity = Math.sqrt(amount0Desired * amount1Desired) - MINIMUM_LIQUIDITY;
            amount0 = amount0Desired;
            amount1 = amount1Desired;
            pool.totalSupply = liquidity + MINIMUM_LIQUIDITY;
        } else {
            liquidity = Math.min(
                (amount0Desired * pool.totalSupply) / pool.reserve0,
                (amount1Desired * pool.totalSupply) / pool.reserve1
            );
            amount0 = (liquidity * pool.reserve0) / pool.totalSupply;
            amount1 = (liquidity * pool.reserve1) / pool.totalSupply;
        }

        require(liquidity > 0, "Insufficient liquidity minted");

        require(amount0 >= amount0Min && amount1 >= amount1Min, "Insufficient amounts");

        IERC20(token0).safeTransferFrom(msg.sender, address(this), amount0);
        IERC20(token1).safeTransferFrom(msg.sender, address(this), amount1);

        pool.reserve0 += amount0;
        pool.reserve1 += amount1;
        pool.lastUpdateTime = block.timestamp;

        emit LiquidityAdded(msg.sender, poolKey, amount0, amount1, liquidity);
    }

    function removeLiquidity(
        address token0,
        address token1,
        uint256 liquidity,
        uint256 amount0Min,
        uint256 amount1Min
    ) external nonReentrant whenNotPaused returns (uint256 amount0, uint256 amount1) {
        bytes32 poolKey = poolKeys[token0][token1];
        require(poolKey != bytes32(0), "Pool not found");

        Pool storage pool = pools[poolKey];
        require(pool.token0 == token0 && pool.token1 == token1, "Invalid pool");

        amount0 = (liquidity * pool.reserve0) / pool.totalSupply;
        amount1 = (liquidity * pool.reserve1) / pool.totalSupply;

        require(amount0 >= amount0Min && amount1 >= amount1Min, "Insufficient amounts");

        pool.reserve0 -= amount0;
        pool.reserve1 -= amount1;
        pool.totalSupply -= liquidity;
        pool.lastUpdateTime = block.timestamp;

        IERC20(token0).safeTransfer(msg.sender, amount0);
        IERC20(token1).safeTransfer(msg.sender, amount1);

        emit LiquidityRemoved(msg.sender, poolKey, amount0, amount1, liquidity);
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external nonReentrant whenNotPaused returns (uint256[] memory amounts) {
        require(deadline >= block.timestamp, "Expired");
        require(path.length >= 2, "Invalid path");

        amounts = new uint256[](path.length);
        amounts[0] = amountIn;

        for (uint256 i = 0; i < path.length - 1; i++) {
            bytes32 poolKey = poolKeys[path[i]][path[i + 1]];
            require(poolKey != bytes32(0), "Pool not found");

            (uint256 amountOut, uint256 priceImpact) = _getAmountOut(amounts[i], path[i], path[i + 1]);
            amounts[i + 1] = amountOut;

            IERC20(path[i]).safeTransferFrom(msg.sender, address(this), amounts[i]);
            IERC20(path[i + 1]).safeTransfer(to, amountOut);

            emit SwapExecuted(msg.sender, path[i], path[i + 1], amounts[i], amountOut);
        }

        require(amounts[amounts.length - 1] >= amountOutMin, "Insufficient output amount");
    }

    function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory amounts) {
        require(path.length >= 2, "Invalid path");

        amounts = new uint256[](path.length);
        amounts[0] = amountIn;

        for (uint256 i = 0; i < path.length - 1; i++) {
            bytes32 poolKey = poolKeys[path[i]][path[i + 1]];
            require(poolKey != bytes32(0), "Pool not found");

            (uint256 amountOut,) = _getAmountOut(amounts[i], path[i], path[i + 1]);
            amounts[i + 1] = amountOut;
        }
    }

    function getAmountsIn(uint256 amountOut, address[] calldata path) external view returns (uint256[] memory amounts) {
        require(path.length >= 2, "Invalid path");

        amounts = new uint256[](path.length);
        amounts[amounts.length - 1] = amountOut;

        for (uint256 i = path.length - 1; i > 0; i--) {
            bytes32 poolKey = poolKeys[path[i - 1]][path[i]];
            require(poolKey != bytes32(0), "Pool not found");

            amounts[i - 1] = _getAmountIn(amounts[i], path[i - 1], path[i]);
        }
    }

    function _getAmountOut(uint256 amountIn, address tokenIn, address tokenOut) internal view returns (uint256 amountOut, uint256 priceImpact) {
        bytes32 poolKey = poolKeys[tokenIn][tokenOut];
        Pool storage pool = pools[poolKey];

        // Determine direction to use correct reserves
        bool isTokenInToken0 = (tokenIn == pool.token0);
        uint256 reserveIn = isTokenInToken0 ? pool.reserve0 : pool.reserve1;
        uint256 reserveOut = isTokenInToken0 ? pool.reserve1 : pool.reserve0;

        require(reserveIn > 0 && reserveOut > 0, "Empty reserves");

        uint256 amountInWithFee = amountIn * (10000 - pool.fee);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 10000) + amountInWithFee;

        amountOut = numerator / denominator;
        // Price impact in basis points relative to the input-side reserve
        priceImpact = (amountIn * 10000) / reserveIn;
    }

    function _getAmountIn(uint256 amountOut, address tokenIn, address tokenOut) internal view returns (uint256 amountIn) {
        bytes32 poolKey = poolKeys[tokenIn][tokenOut];
        Pool storage pool = pools[poolKey];

        // Determine direction to use correct reserves
        bool isTokenInToken0 = (tokenIn == pool.token0);
        uint256 reserveIn = isTokenInToken0 ? pool.reserve0 : pool.reserve1;
        uint256 reserveOut = isTokenInToken0 ? pool.reserve1 : pool.reserve0;

        require(reserveIn > 0 && reserveOut > 0, "Empty reserves");
        require(amountOut < reserveOut, "Insufficient liquidity");

        uint256 numerator = reserveIn * amountOut * 10000;
        uint256 denominator = (reserveOut - amountOut) * (10000 - pool.fee);

        amountIn = (numerator / denominator) + 1; // Add 1 for rounding
    }

    function calculatePriceImpact(uint256 amountIn, address tokenIn, address tokenOut) external view returns (uint256) {
        bytes32 poolKey = poolKeys[tokenIn][tokenOut];
        require(poolKey != bytes32(0), "Pool not found");

        Pool storage pool = pools[poolKey];
        bool isTokenInToken0 = (tokenIn == pool.token0);
        uint256 reserveIn = isTokenInToken0 ? pool.reserve0 : pool.reserve1;
        require(reserveIn > 0, "Empty reserves");
        return (amountIn * 10000) / reserveIn;
    }

    function getPoolInfo(address token0, address token1) external view returns (
        uint256 reserve0,
        uint256 reserve1,
        uint256 totalSupply,
        uint256 fee,
        uint256 lastUpdateTime
    ) {
        bytes32 poolKey = poolKeys[token0][token1];
        require(poolKey != bytes32(0), "Pool not found");

        Pool storage pool = pools[poolKey];
        return (
            pool.reserve0,
            pool.reserve1,
            pool.totalSupply,
            pool.fee,
            pool.lastUpdateTime
        );
    }

    function setDefaultFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_FEE, "Fee too high");
        defaultFee = newFee;
    }

    function setPoolFee(address token0, address token1, uint256 newFee) external onlyOwner {
        bytes32 poolKey = poolKeys[token0][token1];
        require(poolKey != bytes32(0), "Pool not found");
        require(newFee <= MAX_FEE, "Fee too high");

        pools[poolKey].fee = newFee;
    }

    function addSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = true;
    }

    function removeSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = false;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Additional features from UI
    struct SwapHistory {
        address user;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
        uint256 timestamp;
        uint256 slippage;
        uint256 priceImpact;
    }
    
    mapping(address => SwapHistory[]) public userSwapHistory;
    mapping(address => uint256) public userSwapCount;
    
    function getSwapHistory(address user) external view returns (SwapHistory[] memory) {
        return userSwapHistory[user];
    }
    
    function getSwapAnalytics() external view returns (
        uint256 totalVolume24h,
        uint256 totalSwaps,
        uint256 averageSlippage,
        uint256 totalFees
    ) {
        // Calculate 24h volume and other metrics
        return (0, 0, 0, 0);
    }
    
    function getTokenPrice(address token) external view returns (uint256 price) {
        // Get token price relative to a stable token
        return 0;
    }
    
    function getSlippageProtection(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 slippageTolerance
    ) external view returns (uint256 minAmountOut) {
        (uint256 amountOut,) = _getAmountOut(amountIn, tokenIn, tokenOut);
        minAmountOut = amountOut * (10000 - slippageTolerance) / 10000;
        return minAmountOut;
    }
    
    function batchSwap(
        address[] calldata tokens,
        uint256[] calldata amounts,
        uint256 slippageTolerance
    ) external nonReentrant whenNotPaused returns (uint256[] memory amountsOut) {
        require(tokens.length >= 2 && amounts.length == tokens.length - 1, "Invalid input");
        require(slippageTolerance <= 1000, "Slippage too high");
        
        amountsOut = new uint256[](tokens.length);
        amountsOut[0] = amounts[0];
        
        for (uint256 i = 0; i < tokens.length - 1; i++) {
            bytes32 poolKey = poolKeys[tokens[i]][tokens[i + 1]];
            require(poolKey != bytes32(0), "Pool not found");
            
            (uint256 amountOut, uint256 priceImpact) = _getAmountOut(amountsOut[i], tokens[i], tokens[i + 1]);
            amountsOut[i + 1] = amountOut;
            
            IERC20(tokens[i]).safeTransferFrom(msg.sender, address(this), amountsOut[i]);
            IERC20(tokens[i + 1]).safeTransfer(msg.sender, amountOut);
            
            // Record swap history
            SwapHistory memory swap = SwapHistory({
                user: msg.sender,
                tokenIn: tokens[i],
                tokenOut: tokens[i + 1],
                amountIn: amountsOut[i],
                amountOut: amountOut,
                timestamp: block.timestamp,
                slippage: slippageTolerance,
                priceImpact: priceImpact
            });
            
            userSwapHistory[msg.sender].push(swap);
            userSwapCount[msg.sender]++;
            
            emit SwapExecuted(msg.sender, tokens[i], tokens[i + 1], amountsOut[i], amountOut);
        }
    }
}

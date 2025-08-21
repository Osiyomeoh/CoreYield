// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "../CoreYieldAnalytics.sol";

contract CoreYieldAMM is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Math for uint256;

    // Pool structure
    struct Pool {
        address token0;
        address token1;
        uint256 reserve0;
        uint256 reserve1;
        uint256 totalSupply;
        bool isYieldPool;
        bool isActive;
        uint256 lastUpdateTime;
        uint256 cumulativeYield0;
        uint256 cumulativeYield1;
        uint256 fee0;
        uint256 fee1;
        uint256 tradingFee;          // Trading fee for this pool
        uint256 yieldMultiplier;     // Yield adjustment factor
        uint256 volatilityIndex;     // Market volatility measure
        uint256 lastPriceUpdate;     // Last price update timestamp
    }

    // Fee structure
    struct FeeConfig {
        uint256 tradingFee;           // Trading fee (basis points)
        uint256 yieldFee;             // Yield fee (basis points)
        uint256 liquidityFee;         // Liquidity fee (basis points)
        uint256 slippageTolerance;    // Slippage tolerance (basis points)
        uint256 dynamicFeeMultiplier; // Dynamic fee adjustment
        address feeCollector;         // Fee collector address
    }

    // Yield tracking
    struct YieldInfo {
        uint256 currentAPY;
        uint256 historicalAPY;
        uint256 yieldAccrued;
        uint256 lastUpdateTime;
        bool isStable;
        uint256 yieldVolatility;      // Yield volatility measure
        uint256 marketEfficiency;     // Market efficiency score
    }

    // Advanced trading structure
    struct TradeInfo {
        uint256 inputAmount;
        uint256 outputAmount;
        uint256 fee;
        uint256 slippage;
        uint256 yieldAdjustment;
        uint256 priceImpact;
        bool isYieldOptimized;
    }

    // State variables
    mapping(bytes32 => Pool) public pools;
    mapping(address => mapping(address => bytes32)) public poolKeys;
    mapping(address => YieldInfo) public yieldInfo;
    mapping(bytes32 => uint256) public poolVolumes;
    mapping(bytes32 => uint256) public lastVolumeUpdate;
    
    // Analytics integration
    CoreYieldAnalytics public analytics;
    
    // Configuration
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MIN_LIQUIDITY = 1000; // 0.0001 tokens
    uint256 public constant MAX_FEE = 500; // 5%
    uint256 public constant YIELD_UPDATE_INTERVAL = 1 hours;
    uint256 public constant VOLATILITY_WINDOW = 24 hours;
    
    // Events
    event PoolCreated(
        bytes32 indexed poolKey,
        address indexed token0,
        address indexed token1,
        bool isYieldPool
    );
    
    event LiquidityAdded(
        bytes32 indexed poolKey,
        address indexed provider,
        uint256 amount0,
        uint256 amount1,
        uint256 liquidity
    );
    
    event LiquidityRemoved(
        bytes32 indexed poolKey,
        address indexed provider,
        uint256 amount0,
        uint256 amount1,
        uint256 liquidity
    );
    
    event Swap(
        bytes32 indexed poolKey,
        address indexed sender,
        address indexed recipient,
        uint256 amount0In,
        uint256 amount1In,
        uint256 amount0Out,
        uint256 amount1Out,
        uint256 fee,
        uint256 yieldAdjustment
    );
    
    event YieldUpdated(
        address indexed token,
        uint256 newAPY,
        uint256 volatility,
        uint256 marketEfficiency
    );

    constructor() Ownable(msg.sender) {}

    // Set analytics contract
    function setAnalytics(address _analytics) external onlyOwner {
        analytics = CoreYieldAnalytics(_analytics);
    }

    // Create a new pool
    function createPool(
        address _token0,
        address _token1,
        bool _isYieldPool
    ) external onlyOwner returns (bytes32 poolKey) {
        require(_token0 != _token1, "Identical tokens");
        require(_token0 != address(0) && _token1 != address(0), "Zero address");
        
        // Sort tokens
        (address token0, address token1) = _token0 < _token1 ? 
            (_token0, _token1) : (_token1, _token0);
        
        poolKey = keccak256(abi.encodePacked(token0, token1));
        require(pools[poolKey].token0 == address(0), "Pool exists");
        
        pools[poolKey] = Pool({
            token0: token0,
            token1: token1,
            reserve0: 0,
            reserve1: 0,
            totalSupply: 0,
            isYieldPool: _isYieldPool,
            isActive: true,
            lastUpdateTime: block.timestamp,
            cumulativeYield0: 0,
            cumulativeYield1: 0,
            fee0: 0,
            fee1: 0,
            tradingFee: 30, // 0.3% default trading fee
            yieldMultiplier: _isYieldPool ? 1200 : 1000, // 20% premium for yield pools
            volatilityIndex: 1000, // Base volatility
            lastPriceUpdate: block.timestamp
        });
        
        poolKeys[token0][token1] = poolKey;
        poolKeys[token1][token0] = poolKey;
        
        emit PoolCreated(poolKey, token0, token1, _isYieldPool);
    }

    // Add liquidity to a pool
    function addLiquidity(
        address _token0,
        address _token1,
        uint256 _amount0,
        uint256 _amount1,
        uint256 _minLiquidity
    ) external nonReentrant returns (uint256 liquidity) {
        bytes32 poolKey = poolKeys[_token0][_token1];
        require(poolKey != bytes32(0), "Pool not found");
        
        Pool storage pool = pools[poolKey];
        require(pool.isActive, "Pool not active");
        
        // Sort amounts and tokens
        (uint256 amount0, uint256 amount1) = _token0 < _token1 ? 
            (_amount0, _amount1) : (_amount1, _amount0);
        (address token0, address token1) = _token0 < _token1 ? 
            (_token0, _token1) : (_token1, _token0);
        
        uint256 _reserve0 = pool.reserve0;
        uint256 _reserve1 = pool.reserve1;
        
        if (_reserve0 == 0 && _reserve1 == 0) {
            // First liquidity
            liquidity = Math.sqrt(amount0 * amount1) - MIN_LIQUIDITY;
            pool.totalSupply = MIN_LIQUIDITY;
        } else {
            // Subsequent liquidity
            liquidity = Math.min(
                (amount0 * pool.totalSupply) / _reserve0,
                (amount1 * pool.totalSupply) / _reserve1
            );
        }
        
        require(liquidity >= _minLiquidity, "Insufficient liquidity");
        
        // Transfer tokens
        IERC20(_token0).safeTransferFrom(msg.sender, address(this), _amount0);
        IERC20(_token1).safeTransferFrom(msg.sender, address(this), _amount1);
        
        // Update reserves
        pool.reserve0 = _reserve0 + amount0;
        pool.reserve1 = _reserve1 + amount1;
        pool.totalSupply += liquidity;
        pool.lastUpdateTime = block.timestamp;
        
        // Mint LP tokens
        _mint(msg.sender, liquidity);
        
        // Update yield info if this is a yield pool
        if (pool.isYieldPool) {
            _updateYieldInfo(token0, token1);
        }
        
        emit LiquidityAdded(poolKey, msg.sender, amount0, amount1, liquidity);
    }

    // Remove liquidity from a pool
    function removeLiquidity(
        address _token0,
        address _token1,
        uint256 _liquidity
    ) external nonReentrant returns (uint256 amount0, uint256 amount1) {
        bytes32 poolKey = poolKeys[_token0][_token1];
        require(poolKey != bytes32(0), "Pool not found");
        
        Pool storage pool = pools[poolKey];
        require(pool.isActive, "Pool not active");
        require(_liquidity > 0, "Invalid liquidity");
        
        // Sort tokens
        (address token0, address token1) = _token0 < _token1 ? 
            (_token0, _token1) : (_token1, _token0);
        
        uint256 _reserve0 = pool.reserve0;
        uint256 _reserve1 = pool.reserve1;
        
        // Calculate amounts
        amount0 = (_liquidity * _reserve0) / pool.totalSupply;
        amount1 = (_liquidity * _reserve1) / pool.totalSupply;
        
        require(amount0 > 0 && amount1 > 0, "Insufficient liquidity burned");
        
        // Burn LP tokens
        _burn(msg.sender, _liquidity);
        
        // Update reserves
        pool.reserve0 = _reserve0 - amount0;
        pool.reserve1 = _reserve1 - amount1;
        pool.totalSupply -= _liquidity;
        pool.lastUpdateTime = block.timestamp;
        
        // Transfer tokens
        IERC20(token0).safeTransfer(msg.sender, amount0);
        IERC20(token1).safeTransfer(msg.sender, amount1);
        
        emit LiquidityRemoved(poolKey, msg.sender, amount0, amount1, _liquidity);
    }

    // Swap tokens with yield-adjusted pricing
    function swap(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _minAmountOut,
        address _recipient
    ) external nonReentrant returns (uint256 amountOut) {
        bytes32 poolKey = poolKeys[_tokenIn][_tokenOut];
        require(poolKey != bytes32(0), "Pool not found");
        
        Pool storage pool = pools[poolKey];
        require(pool.isActive, "Pool not active");
        require(_amountIn > 0, "Invalid amount");
        
        // Sort tokens
        (address token0, address token1) = _tokenIn < _tokenOut ? 
            (_tokenIn, _tokenOut) : (_tokenOut, _tokenIn);
        
        uint256 _reserve0 = pool.reserve0;
        uint256 _reserve1 = pool.reserve1;
        
        // Calculate output amount with yield adjustment
        amountOut = _getAmountOut(_amountIn, _reserve0, _reserve1, pool);
        
        require(amountOut >= _minAmountOut, "Insufficient output");
        
        // Calculate fees
        uint256 fee = _calculateDynamicFee(_amountIn, pool);
        uint256 yieldAdjustment = _calculateYieldAdjustment(_tokenIn, _tokenOut, pool);
        
        // Apply yield adjustment
        if (yieldAdjustment > 0) {
            amountOut = amountOut + (amountOut * yieldAdjustment) / BASIS_POINTS;
        }
        
        // Transfer input tokens
        IERC20(_tokenIn).safeTransferFrom(msg.sender, address(this), _amountIn);
        
        // Transfer output tokens
        IERC20(_tokenOut).safeTransfer(_recipient, amountOut);
        
        // Update reserves
        if (_tokenIn < _tokenOut) {
            pool.reserve0 = _reserve0 + _amountIn;
            pool.reserve1 = _reserve1 - amountOut;
        } else {
            pool.reserve0 = _reserve0 - amountOut;
            pool.reserve1 = _reserve1 + _amountIn;
        }
        
        pool.lastUpdateTime = block.timestamp;
        pool.lastPriceUpdate = block.timestamp;
        
        // Update volume
        _updateVolume(poolKey, _amountIn);
        
        // Update yield info if this is a yield pool
        if (pool.isYieldPool) {
            _updateYieldInfo(token0, token1);
        }
        
        emit Swap(
            poolKey,
            msg.sender,
            _recipient,
            _tokenIn < _tokenOut ? _amountIn : 0,
            _tokenIn < _tokenOut ? 0 : _amountIn,
            _tokenIn < _tokenOut ? 0 : amountOut,
            _tokenIn < _tokenOut ? amountOut : 0,
            fee,
            yieldAdjustment
        );
    }

    // Get quote for swap
    function getQuote(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn
    ) external view returns (TradeInfo memory) {
        bytes32 poolKey = poolKeys[_tokenIn][_tokenOut];
        require(poolKey != bytes32(0), "Pool not found");
        
        Pool storage pool = pools[poolKey];
        require(pool.isActive, "Pool not active");
        
        uint256 _reserve0 = pool.reserve0;
        uint256 _reserve1 = pool.reserve1;
        
        // Calculate base output
        uint256 outputAmount = _getAmountOut(_amountIn, _reserve0, _reserve1, pool);
        
        // Calculate fees
        uint256 fee = _calculateDynamicFee(_amountIn, pool);
        uint256 yieldAdjustment = _calculateYieldAdjustment(_tokenIn, _tokenOut, pool);
        
        // Apply yield adjustment
        if (yieldAdjustment > 0) {
            outputAmount = outputAmount + (outputAmount * yieldAdjustment) / BASIS_POINTS;
        }
        
        // Calculate slippage and price impact
        uint256 slippage = _calculateSlippage(_amountIn, _reserve0, _reserve1);
        uint256 priceImpact = _calculatePriceImpact(_amountIn, _reserve0, _reserve1);
        
        return TradeInfo({
            inputAmount: _amountIn,
            outputAmount: outputAmount,
            fee: fee,
            slippage: slippage,
            yieldAdjustment: yieldAdjustment,
            priceImpact: priceImpact,
            isYieldOptimized: pool.isYieldPool
        });
    }

    // Internal functions

    function _getAmountOut(
        uint256 _amountIn,
        uint256 _reserve0,
        uint256 _reserve1,
        Pool storage _pool
    ) internal view returns (uint256) {
        require(_amountIn > 0, "Invalid amount");
        require(_reserve0 > 0 && _reserve1 > 0, "Insufficient liquidity");
        
        uint256 amountInWithFee = _amountIn * (BASIS_POINTS - _pool.tradingFee);
        uint256 numerator = amountInWithFee * _reserve1;
        uint256 denominator = (_reserve0 * BASIS_POINTS) + amountInWithFee;
        
        return numerator / denominator;
    }

    function _calculateDynamicFee(
        uint256 _amountIn,
        Pool storage _pool
    ) internal view returns (uint256) {
        uint256 baseFee = _pool.tradingFee;
        
        // Adjust fee based on volatility
        uint256 volatilityMultiplier = _pool.volatilityIndex / 1000;
        if (volatilityMultiplier > 1500) { // High volatility
            baseFee = baseFee * 120 / 100; // 20% increase
        } else if (volatilityMultiplier < 500) { // Low volatility
            baseFee = baseFee * 80 / 100; // 20% decrease
        }
        
        return (baseFee * _amountIn) / BASIS_POINTS;
    }

    function _calculateYieldAdjustment(
        address _tokenIn,
        address _tokenOut,
        Pool storage _pool
    ) internal view returns (uint256) {
        if (!_pool.isYieldPool) return 0;
        
        // Get yield info from analytics if available
        if (address(analytics) != address(0)) {
            try analytics.getMarketMode(_tokenIn) returns (CoreYieldAnalytics.MarketMode mode) {
                if (mode == CoreYieldAnalytics.MarketMode.CHEAP_PT) {
                    return 200; // 2% bonus for PT trades
                } else if (mode == CoreYieldAnalytics.MarketMode.CHEAP_YT) {
                    return 300; // 3% bonus for YT trades
                }
            } catch {
                // Analytics not available, use default
            }
        }
        
        // Default yield adjustment based on pool yield multiplier
        return (_pool.yieldMultiplier - 1000) / 10; // Convert to basis points
    }

    function _calculateSlippage(
        uint256 _amountIn,
        uint256 _reserve0,
        uint256 _reserve1
    ) internal pure returns (uint256) {
        if (_reserve0 == 0 || _reserve1 == 0) return 0;
        
        uint256 priceBefore = (_reserve1 * BASIS_POINTS) / _reserve0;
        uint256 priceAfter = ((_reserve1 * BASIS_POINTS) / (_reserve0 + _amountIn));
        
        if (priceBefore > priceAfter) {
            return ((priceBefore - priceAfter) * BASIS_POINTS) / priceBefore;
        }
        return 0;
    }

    function _calculatePriceImpact(
        uint256 _amountIn,
        uint256 _reserve0,
        uint256 _reserve1
    ) internal pure returns (uint256) {
        if (_reserve0 == 0) return 0;
        
        return (_amountIn * BASIS_POINTS) / (_reserve0 + _amountIn);
    }

    function _updateVolume(bytes32 _poolKey, uint256 _amount) internal {
        poolVolumes[_poolKey] += _amount;
        lastVolumeUpdate[_poolKey] = block.timestamp;
    }

    function _updateYieldInfo(address _token0, address _token1) internal {
        if (address(analytics) == address(0)) return;
        
        try analytics.updateAnalytics(_token0) {
            // Successfully updated analytics for token0
        } catch {
            // Analytics update failed
        }
        
        try analytics.updateAnalytics(_token1) {
            // Successfully updated analytics for token1
        } catch {
            // Analytics update failed
        }
    }

    // View functions
    function getPool(bytes32 _poolKey) external view returns (Pool memory) {
        return pools[_poolKey];
    }

    function getPoolKey(address _token0, address _token1) external view returns (bytes32) {
        return poolKeys[_token0][_token1];
    }

    function getYieldInfo(address _token) external view returns (YieldInfo memory) {
        return yieldInfo[_token];
    }

    function getPoolVolume(bytes32 _poolKey) external view returns (uint256) {
        return poolVolumes[_poolKey];
    }

    // Admin functions
    function setPoolActive(bytes32 _poolKey, bool _active) external onlyOwner {
        pools[_poolKey].isActive = _active;
    }

    function setTradingFee(bytes32 _poolKey, uint256 _fee) external onlyOwner {
        require(_fee <= MAX_FEE, "Fee too high");
        pools[_poolKey].tradingFee = _fee;
    }

    function setYieldMultiplier(bytes32 _poolKey, uint256 _multiplier) external onlyOwner {
        require(_multiplier >= 800 && _multiplier <= 2000, "Invalid multiplier");
        pools[_poolKey].yieldMultiplier = _multiplier;
    }

    // Emergency functions
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(msg.sender, _amount);
    }

    // Mock mint/burn functions for LP tokens (simplified)
    function _mint(address _to, uint256 _amount) internal {
        // In a real implementation, this would mint ERC20 LP tokens
    }

    function _burn(address _from, uint256 _amount) internal {
        // In a real implementation, this would burn ERC20 LP tokens
    }
}

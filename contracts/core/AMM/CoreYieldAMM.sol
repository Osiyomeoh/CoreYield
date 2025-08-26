// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract CoreYieldAMM is Ownable, ReentrancyGuard {
    constructor() Ownable(msg.sender) {}
    using SafeERC20 for IERC20;
    using Math for uint256;

    // Simplified Pool structure - only essential fields
    struct Pool {
        address token0;
        address token1;
        uint256 reserve0;
        uint256 reserve1;
        uint256 totalSupply;
        bool isActive;
        uint256 tradingFee;
    }

    // State variables
    mapping(bytes32 => Pool) public pools;
    mapping(address => mapping(address => bytes32)) public poolKeys;
    mapping(address => uint256) public lpBalances; // LP token balances
    
    // Configuration
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MIN_LIQUIDITY = 1000; // 0.0001 tokens
    uint256 public constant MAX_FEE = 500; // 5%
    
    // Events
    event PoolCreated(
        bytes32 indexed poolKey,
        address indexed token0,
        address indexed token1
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
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    // Create a new pool
    function createPool(
        address _token0,
        address _token1
    ) external onlyOwner returns (bytes32 poolKey) {
        require(_token0 != _token1, "Identical tokens");
        require(_token0 != address(0) && _token1 != address(0), "Zero address");
        
        // Sort tokens
        (address token0, address token1) = _token0 < _token1 ? 
            (_token0, _token1) : (_token1, _token0);
        
        poolKey = keccak256(abi.encode(token0, token1));
        require(pools[poolKey].token0 == address(0), "Pool exists");
        
        pools[poolKey] = Pool({
            token0: token0,
            token1: token1,
            reserve0: 0,
            reserve1: 0,
            totalSupply: 0,
            isActive: true,
            tradingFee: 30 // 0.3% default trading fee
        });
        
        poolKeys[token0][token1] = poolKey;
        poolKeys[token1][token0] = poolKey;
        
        emit PoolCreated(poolKey, token0, token1);
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
        
        // Mint LP tokens
        _mint(msg.sender, liquidity);
        
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
        require(lpBalances[msg.sender] >= _liquidity, "Insufficient LP tokens");
        
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
        
        // Transfer tokens
        IERC20(token0).safeTransfer(msg.sender, amount0);
        IERC20(token1).safeTransfer(msg.sender, amount1);
        
        emit LiquidityRemoved(poolKey, msg.sender, amount0, amount1, _liquidity);
    }

    // Swap tokens
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
        require(pool.reserve0 > 0 && pool.reserve1 > 0, "Insufficient liquidity");
        
        // Sort tokens
        (address token0, address token1) = _tokenIn < _tokenOut ? 
            (_tokenIn, _tokenOut) : (_tokenOut, _tokenIn);
        
        uint256 _reserve0 = pool.reserve0;
        uint256 _reserve1 = pool.reserve1;
        
        // Calculate output amount
        amountOut = _getAmountOut(_amountIn, _reserve0, _reserve1, pool.tradingFee);
        
        require(amountOut >= _minAmountOut, "Insufficient output");
        
        // Transfer input tokens
        IERC20(_tokenIn).safeTransferFrom(msg.sender, address(this), _amountIn);
        
        // Update reserves
        if (_tokenIn < _tokenOut) {
            pool.reserve0 = _reserve0 + _amountIn;
            pool.reserve1 = _reserve1 - amountOut;
        } else {
            pool.reserve0 = _reserve0 - amountOut;
            pool.reserve1 = _reserve1 + _amountIn;
        }
        
        // Transfer output tokens
        IERC20(_tokenOut).safeTransfer(_recipient, amountOut);
        
        emit Swap(poolKey, msg.sender, _recipient, _tokenIn, _tokenOut, _amountIn, amountOut);
    }

    // Calculate output amount for a swap
    function _getAmountOut(
        uint256 _amountIn,
        uint256 _reserve0,
        uint256 _reserve1,
        uint256 _tradingFee
    ) internal pure returns (uint256) {
        require(_amountIn > 0, "Invalid amount");
        require(_reserve0 > 0 && _reserve1 > 0, "Insufficient liquidity");
        
        uint256 amountInWithFee = _amountIn * (BASIS_POINTS - _tradingFee);
        uint256 numerator = amountInWithFee * _reserve1;
        uint256 denominator = (_reserve0 * BASIS_POINTS) + amountInWithFee;
        
        return numerator / denominator;
    }

    // Mock mint/burn functions for LP tokens (simplified)
    function _mint(address _to, uint256 _amount) internal {
        lpBalances[_to] += _amount;
    }

    function _burn(address _from, uint256 _amount) internal {
        require(lpBalances[_from] >= _amount, "Insufficient LP balance");
        lpBalances[_from] -= _amount;
    }

    // View functions
    function getPool(bytes32 _poolKey) external view returns (Pool memory) {
        return pools[_poolKey];
    }

    function getPoolKey(address _token0, address _token1) external view returns (bytes32) {
        return poolKeys[_token0][_token1];
    }

    function getLPBalance(address _user) external view returns (uint256) {
        return lpBalances[_user];
    }

    // Admin functions
    function setPoolActive(bytes32 _poolKey, bool _active) external onlyOwner {
        pools[_poolKey].isActive = _active;
    }

    function setTradingFee(bytes32 _poolKey, uint256 _fee) external onlyOwner {
        require(_fee <= MAX_FEE, "Fee too high");
        pools[_poolKey].tradingFee = _fee;
    }

    // Emergency functions
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(msg.sender, _amount);
    }
}

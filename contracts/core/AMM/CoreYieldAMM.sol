pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "../../interfaces/ICoreYieldFactory.sol";
import "../libraries/LibYieldMath.sol";

/**
 * @title CoreYieldAMM
 * @notice Automated Market Maker for CoreYield PT/YT token pairs
 * @dev Implements constant product AMM with yield-adjusted pricing
 */
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
    
    /**
     * @notice Create a new AMM pool for PT/YT tokens
     * @param syToken SY token address
     * @param initialPTAmount Initial PT token amount
     * @param initialYTAmount Initial YT token amount
     */
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
    
    /**
     * @notice Add liquidity to a pool
     * @param syToken SY token address
     * @param ptAmount PT token amount to add
     * @param ytAmount YT token amount to add
     * @param minLiquidity Minimum liquidity tokens to receive
     */
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
    
    /**
     * @notice Remove liquidity from a pool
     * @param syToken SY token address
     * @param liquidity Liquidity tokens to burn
     * @param minPTAmount Minimum PT tokens to receive
     * @param minYTAmount Minimum YT tokens to receive
     */
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
    
    /**
     * @notice Swap PT tokens for YT tokens
     * @param syToken SY token address
     * @param ptAmountIn PT tokens to swap
     * @param minYTAmountOut Minimum YT tokens to receive
     */
    function swapPTForYT(
        address syToken,
        uint256 ptAmountIn,
        uint256 minYTAmountOut
    ) external nonReentrant returns (uint256 ytAmountOut) {
        require(ptAmountIn > 0, "Invalid input amount");
        
        ytAmountOut = _swap(syToken, true, ptAmountIn, minYTAmountOut);
        
        emit SwapExecuted(msg.sender, syToken, true, ptAmountIn, ytAmountOut, swapFee);
    }
    
    /**
     * @notice Swap YT tokens for PT tokens
     * @param syToken SY token address
     * @param ytAmountIn YT tokens to swap
     * @param minPTAmountOut Minimum PT tokens to receive
     */
    function swapYTForPT(
        address syToken,
        uint256 ytAmountIn,
        uint256 minPTAmountOut
    ) external nonReentrant returns (uint256 ptAmountOut) {
        require(ytAmountIn > 0, "Invalid input amount");
        
        ptAmountOut = _swap(syToken, false, ytAmountIn, minPTAmountOut);
        
        emit SwapExecuted(msg.sender, syToken, false, ytAmountIn, ptAmountOut, swapFee);
    }
    
    /**
     * @notice Internal swap function
     * @param syToken SY token address
     * @param ptToYt True if swapping PT to YT, false otherwise
     * @param amountIn Input token amount
     * @param minAmountOut Minimum output amount
     */
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
    
    /**
     * @notice Get current pool reserves
     * @param syToken SY token address
     */
    function getPoolReserves(address syToken) external view returns (uint256 ptReserves, uint256 ytReserves) {
        Pool storage pool = pools[syToken];
        return (pool.ptReserves, pool.ytReserves);
    }
    
    /**
     * @notice Get swap quote
     * @param syToken SY token address
     * @param ptToYt True if swapping PT to YT, false otherwise
     * @param amountIn Input token amount
     */
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
    
    /**
     * @notice Update swap fee (owner only)
     * @param newFee New swap fee in basis points
     */
    function updateSwapFee(uint256 newFee) external onlyOwner {
        require(newFee <= 500, "Fee too high");
        swapFee = newFee;
    }
    
    /**
     * @notice Update protocol fee (owner only)
     * @param newFee New protocol fee in basis points
     */
    function updateProtocolFee(uint256 newFee) external onlyOwner {
        require(newFee <= 100, "Fee too high");
        protocolFee = newFee;
    }
    
    /**
     * @notice Update fee recipient (owner only)
     * @param newRecipient New fee recipient address
     */
    function updateFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid address");
        feeRecipient = newRecipient;
    }
} 
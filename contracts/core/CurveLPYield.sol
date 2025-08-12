pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

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
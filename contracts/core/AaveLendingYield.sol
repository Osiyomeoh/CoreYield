pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

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
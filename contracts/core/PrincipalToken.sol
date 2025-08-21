// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract PrincipalToken is ERC20, Ownable {
    using SafeERC20 for IERC20;
    using Math for uint256;

    // Token structure
    uint256 public immutable maturity;
    
    // Principal tracking
    uint256 public totalPrincipalAmount;
    uint256 public totalRedeemed;
    mapping(address => uint256) public userPrincipal;
    mapping(address => uint256) public userRedeemed;
    
    // Fee structure
    struct FeeConfig {
        uint256 mintFee;            // Fee on minting
        uint256 redeemFee;          // Fee on redemption
        uint256 transferFee;        // Fee on transfers
        address feeCollector;       // Fee collector address
    }
    
    FeeConfig public feeConfig;
    uint256 public constant BASIS_POINTS = 10000;
    
    // Events
    event PrincipalMinted(
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );
    
    event PrincipalRedeemed(
        address indexed user,
        uint256 amount,
        uint256 underlyingAmount,
        uint256 fee
    );
    
    event FeesCollected(
        address indexed user,
        uint256 amount,
        string operation
    );

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _maturity
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        maturity = _maturity;
        
        feeConfig = FeeConfig({
            mintFee: 50,             // 0.5%
            redeemFee: 100,          // 1%
            transferFee: 30,         // 0.3%
            feeCollector: msg.sender
        });
    }

    // Mint PT tokens (called by factory)
    function mint(address _to, uint256 _amount) external onlyOwner {
        _mint(_to, _amount);
        _updateUserPrincipal(_to, _amount, true);
        
        emit PrincipalMinted(_to, _amount, block.timestamp);
    }

    // Burn PT tokens (called by factory)
    function emergencyBurn(uint256 _amount) external onlyOwner {
        _burn(msg.sender, _amount);
        // Note: emergencyBurn doesn't update principal tracking since it's an emergency function
    }

    // Redeem PT for underlying asset (after maturity)
    function redeem(uint256 _ptAmount) external returns (uint256 underlyingAmount) {
        require(block.timestamp >= maturity, "Market not matured");
        require(_ptAmount > 0, "Amount must be positive");
        require(balanceOf(msg.sender) >= _ptAmount, "Insufficient PT balance");
        require(userPrincipal[msg.sender] >= _ptAmount, "Insufficient principal");
        
        // Calculate underlying amount (1:1 ratio)
        underlyingAmount = _ptAmount;
        
        // Calculate and collect redeem fee
        uint256 feeAmount = (underlyingAmount * feeConfig.redeemFee) / BASIS_POINTS;
        uint256 netAmount = underlyingAmount - feeAmount;
        
        // Burn PT tokens
        _burn(msg.sender, _ptAmount);
        
        // Update principal tracking
        _updateUserPrincipal(msg.sender, _ptAmount, false);
        userRedeemed[msg.sender] += _ptAmount;
        totalRedeemed += _ptAmount;
        
        // Transfer underlying tokens to user
        // Note: This assumes the underlying asset is available in the contract
        // In practice, you'd need to integrate with the SY token or underlying vault
        
        emit PrincipalRedeemed(msg.sender, _ptAmount, underlyingAmount, feeAmount);
    }

    // Update user principal tracking
    function _updateUserPrincipal(address _user, uint256 _amount, bool _isMint) internal {
        if (_isMint) {
            userPrincipal[_user] += _amount;
            totalPrincipalAmount += _amount;
        } else {
            userPrincipal[_user] -= _amount;
            totalPrincipalAmount -= _amount;
        }
    }

    // Set fee configuration
    function updateFeeConfig(
        uint256 _mintFee,
        uint256 _redeemFee,
        uint256 _transferFee,
        address _feeCollector
    ) external onlyOwner {
        feeConfig.mintFee = _mintFee;
        feeConfig.redeemFee = _redeemFee;
        feeConfig.transferFee = _transferFee;
        feeConfig.feeCollector = _feeCollector;
    }

    // View functions
    function getPrincipal(address _user) external view returns (uint256) {
        return userPrincipal[_user];
    }

    function getRedeemed(address _user) external view returns (uint256) {
        return userRedeemed[_user];
    }

    function getRemainingPrincipal(address _user) external view returns (uint256) {
        return userPrincipal[_user] - userRedeemed[_user];
    }

    function getTotalRemainingPrincipal() external view returns (uint256) {
        return totalPrincipalAmount - totalRedeemed;
    }

    function getTimeToMaturity() external view returns (uint256) {
        if (block.timestamp >= maturity) return 0;
        return maturity - block.timestamp;
    }

    function isMatured() external view returns (bool) {
        return block.timestamp >= maturity;
    }

    function getPrincipalStats(address _user) external view returns (
        uint256 userPrincipalAmount,
        uint256 redeemed,
        uint256 remaining,
        bool matured
    ) {
        userPrincipalAmount = userPrincipal[_user];
        redeemed = userRedeemed[_user];
        remaining = userPrincipalAmount - redeemed;
        matured = block.timestamp >= maturity;
    }

    // Emergency functions
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(owner(), _amount);
    }
}

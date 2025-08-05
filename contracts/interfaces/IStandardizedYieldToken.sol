// contracts/interfaces/IStandardizedYieldToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IStandardizedYieldToken
 * @dev Interface for Standardized Yield Tokens
 */
interface IStandardizedYieldToken is IERC20 {
    /**
     * @dev Wrap underlying asset into SY tokens
     * @param amount Amount to wrap
     * @return Amount of SY tokens minted
     */
    function wrap(uint256 amount) external returns (uint256);
    
    /**
     * @dev Unwrap SY tokens back to underlying asset
     * @param amount Amount to unwrap
     * @return Amount of underlying asset returned
     */
    function unwrap(uint256 amount) external returns (uint256);
    
    /**
     * @dev Claim accumulated yield
     * @return Amount of yield claimed
     */
    function claimYield() external returns (uint256);
    
    /**
     * @dev Get accumulated yield for a user
     * @param user User address
     * @return Accumulated yield amount
     */
    function getAccumulatedYield(address user) external view returns (uint256);
    
    /**
     * @dev Get current APY
     * @return Annual percentage yield in basis points
     */
    function getCurrentAPY() external view returns (uint256);
    
    /**
     * @dev Get underlying asset address
     * @return Address of underlying asset
     */
    function underlyingAsset() external view returns (IERC20);
    
    /**
     * @dev Get yield rate
     * @return Yield rate in basis points
     */
    function yieldRate() external view returns (uint256);
}
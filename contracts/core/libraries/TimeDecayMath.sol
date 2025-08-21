// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/math/Math.sol";

library TimeDecayMath {
    using Math for uint256;
    
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant PRECISION = 1e18;
    
    /**
     * @notice Calculate PT price with time decay
     * @param currentTime Current timestamp
     * @param expiry Expiry timestamp
     * @param basePrice Base price of underlying asset
     * @param yieldRate Annual yield rate (in basis points)
     * @return ptPrice PT token price
     */
    function calculatePTPrice(
        uint256 currentTime,
        uint256 expiry,
        uint256 basePrice,
        uint256 yieldRate
    ) external pure returns (uint256 ptPrice) {
        require(currentTime < expiry, "Already expired");
        
        uint256 timeToExpiry = expiry - currentTime;
        uint256 yearsToExpiry = (timeToExpiry * PRECISION) / SECONDS_PER_YEAR;
        
        // PT price = basePrice * (1 + yieldRate)^yearsToExpiry
        uint256 yieldMultiplier = calculateYieldMultiplier(yieldRate, yearsToExpiry);
        ptPrice = (basePrice * yieldMultiplier) / PRECISION;
        
        return ptPrice;
    }
    
    /**
     * @notice Calculate YT yield with time decay
     * @param currentTime Current timestamp
     * @param expiry Expiry timestamp
     * @param baseYield Base yield rate
     * @param timeElapsed Time elapsed since start
     * @return ytYield YT token yield
     */
    function calculateYTYield(
        uint256 currentTime,
        uint256 expiry,
        uint256 baseYield,
        uint256 timeElapsed
    ) external pure returns (uint256 ytYield) {
        require(currentTime < expiry, "Already expired");
        
        uint256 totalDuration = expiry - timeElapsed;
        uint256 remainingTime = expiry - currentTime;
        
        // YT yield decreases as we approach expiry
        ytYield = (baseYield * remainingTime) / totalDuration;
        
        return ytYield;
    }
    
    /**
     * @notice Calculate yield multiplier for compound interest
     * @param yieldRate Annual yield rate (in basis points)
     * @param timePeriod Time period in years (with precision)
     * @return multiplier Yield multiplier
     */
    function calculateYieldMultiplier(
        uint256 yieldRate,
        uint256 timePeriod
    ) internal pure returns (uint256 multiplier) {
        // Convert yield rate from basis points to decimal
        uint256 yieldDecimal = (yieldRate * PRECISION) / 10000;
        
        // Calculate compound interest: (1 + r)^t
        // For small rates, we can approximate: 1 + r*t + (r*t)^2/2
        uint256 timeInYears = timePeriod / PRECISION;
        uint256 yieldTime = (yieldDecimal * timeInYears) / PRECISION;
        
        multiplier = PRECISION + yieldTime;
        
        // Add quadratic term for accuracy
        uint256 quadraticTerm = (yieldTime * yieldTime) / (2 * PRECISION);
        multiplier += quadraticTerm;
        
        return multiplier;
    }
    
    /**
     * @notice Calculate impermanent loss for LP positions
     * @param initialValue Initial portfolio value
     * @param currentValue Current portfolio value
     * @param timeElapsed Time elapsed since position opened
     * @param totalDuration Total position duration
     * @return ilPercentage Impermanent loss percentage
     */
    function calculateImpermanentLoss(
        uint256 initialValue,
        uint256 currentValue,
        uint256 timeElapsed,
        uint256 totalDuration
    ) external pure returns (uint256 ilPercentage) {
        if (currentValue >= initialValue) {
            return 0;
        }
        
        // IL increases with time
        uint256 timeMultiplier = (timeElapsed * PRECISION) / totalDuration;
        uint256 baseIL = ((initialValue - currentValue) * PRECISION) / initialValue;
        
        ilPercentage = (baseIL * timeMultiplier) / PRECISION;
        
        return ilPercentage;
    }
    
    /**
     * @notice Calculate optimal rebalancing frequency
     * @param volatility Asset volatility (in basis points)
     * @param transactionCost Transaction cost (in basis points)
     * @return frequency Optimal rebalancing frequency in days
     */
    function calculateOptimalRebalancing(
        uint256 volatility,
        uint256 transactionCost
    ) external pure returns (uint256 frequency) {
        // Higher volatility = more frequent rebalancing
        // Higher transaction cost = less frequent rebalancing
        
        uint256 volatilityFactor = (volatility * 365) / 10000; // Convert to annual
        uint256 costFactor = (transactionCost * 365) / 10000;
        
        frequency = (volatilityFactor * 30) / (costFactor + 1); // Base 30 days
        
        // Clamp between 1 day and 90 days
        if (frequency < 1) frequency = 1;
        if (frequency > 90) frequency = 90;
        
        return frequency;
    }
    
    /**
     * @notice Calculate Sharpe ratio
     * @param returnValues Array of return values
     * @param riskFreeRate Risk-free rate (in basis points)
     * @return sharpeRatio Sharpe ratio
     */
    function calculateSharpeRatio(
        uint256[] memory returnValues,
        uint256 riskFreeRate
    ) external pure returns (uint256 sharpeRatio) {
        if (returnValues.length == 0) return 0;
        
        uint256 totalReturn = 0;
        uint256 totalSquaredReturn = 0;
        
        for (uint256 i = 0; i < returnValues.length; i++) {
            totalReturn += returnValues[i];
            totalSquaredReturn += returnValues[i] * returnValues[i];
        }
        
        uint256 averageReturn = totalReturn / returnValues.length;
        uint256 variance = (totalSquaredReturn / returnValues.length) - (averageReturn * averageReturn / PRECISION);
        uint256 standardDeviation = sqrt(variance);
        
        if (standardDeviation == 0) return 0;
        
        uint256 excessReturn = averageReturn > riskFreeRate ? averageReturn - riskFreeRate : 0;
        sharpeRatio = (excessReturn * PRECISION) / standardDeviation;
        
        return sharpeRatio;
    }
    
    /**
     * @notice Calculate square root using Newton's method
     * @param x Input value
     * @return result Square root
     */
    function sqrt(uint256 x) internal pure returns (uint256 result) {
        if (x == 0) return 0;
        
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        
        return y;
    }
}

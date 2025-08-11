// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title LibYieldMath
 * @notice Advanced yield mathematics library for CoreYield Protocol
 * @dev Implements time value of money, yield curves, and pricing models
 */
library LibYieldMath {
    // Constants for precision
    uint256 public constant PRECISION = 1e18;
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant MAX_YIELD_RATE = 10000; // 100% in basis points
    
    // Yield curve structure
    struct YieldCurve {
        uint256[] maturities;      // Array of maturity timestamps
        uint256[] rates;           // Corresponding yield rates (basis points)
        uint256 volatility;        // Market volatility (basis points)
        uint256 lastUpdate;        // Last curve update timestamp
    }
    
    /**
     * @notice Calculate PT token price based on time value of money
     * @param syAmount Amount of SY tokens
     * @param maturity Maturity timestamp
     * @param currentTime Current timestamp
     * @param yieldRate Annual yield rate (basis points)
     * @return ptPrice Price of PT tokens
     * @return ytPrice Price of YT tokens
     */
    function calculatePTPrice(
        uint256 syAmount,
        uint256 maturity,
        uint256 currentTime,
        uint256 yieldRate
    ) internal pure returns (uint256 ptPrice, uint256 ytPrice) {
        require(maturity > currentTime, "Invalid maturity");
        require(yieldRate <= MAX_YIELD_RATE, "Yield rate too high");
        
        uint256 timeToMaturity = maturity - currentTime;
        uint256 annualizedTime = (timeToMaturity * PRECISION) / SECONDS_PER_YEAR;
        
        // Calculate present value using compound interest formula
        // PV = FV / (1 + r)^t
        uint256 yieldRateDecimal = (yieldRate * PRECISION) / 10000;
        uint256 discountFactor = PRECISION + yieldRateDecimal;
        
        // For simplicity, we'll use a linear approximation for now
        // In production, this would use a more sophisticated exponential function
        ptPrice = (syAmount * PRECISION) / discountFactor;
        ytPrice = syAmount - ptPrice;
        
        return (ptPrice, ytPrice);
    }
    
    /**
     * @notice Calculate yield accrual for YT tokens
     * @param ytAmount Amount of YT tokens
     * @param timeElapsed Time elapsed since last update
     * @param yieldRate Annual yield rate (basis points)
     * @return yield Accumulated yield
     */
    function calculateYieldAccrual(
        uint256 ytAmount,
        uint256 timeElapsed,
        uint256 yieldRate
    ) internal pure returns (uint256 yield) {
        require(yieldRate <= MAX_YIELD_RATE, "Yield rate too high");
        
        uint256 yieldRateDecimal = (yieldRate * PRECISION) / 10000;
        uint256 annualizedTime = (timeElapsed * PRECISION) / SECONDS_PER_YEAR;
        
        yield = (ytAmount * yieldRateDecimal * annualizedTime) / PRECISION;
        return yield;
    }
    
    /**
     * @notice Calculate yield curve interpolation
     * @param curve Yield curve data
     * @param targetMaturity Target maturity timestamp
     * @return interpolatedRate Interpolated yield rate
     */
    function interpolateYieldCurve(
        YieldCurve memory curve,
        uint256 targetMaturity
    ) internal view returns (uint256 interpolatedRate) {
        require(curve.maturities.length >= 2, "Insufficient curve points");
        require(targetMaturity > block.timestamp, "Invalid target maturity");
        
        // Find the two closest maturity points
        uint256 lowerMaturity = 0;
        uint256 upperMaturity = type(uint256).max;
        uint256 lowerRate = 0;
        uint256 upperRate = 0;
        
        for (uint256 i = 0; i < curve.maturities.length; i++) {
            if (curve.maturities[i] <= targetMaturity && curve.maturities[i] > lowerMaturity) {
                lowerMaturity = curve.maturities[i];
                lowerRate = curve.rates[i];
            }
            if (curve.maturities[i] >= targetMaturity && curve.maturities[i] < upperMaturity) {
                upperMaturity = curve.maturities[i];
                upperRate = curve.rates[i];
            }
        }
        
        // Linear interpolation
        if (upperMaturity == type(uint256).max) {
            return lowerRate; // Extrapolate using last known rate
        }
        
        uint256 maturityDiff = upperMaturity - lowerMaturity;
        uint256 targetDiff = targetMaturity - lowerMaturity;
        
        interpolatedRate = lowerRate + (
            (upperRate - lowerRate) * targetDiff / maturityDiff
        );
        
        return interpolatedRate;
    }
    
    /**
     * @notice Calculate volatility-adjusted yield
     * @param baseYield Base yield rate (basis points)
     * @param volatility Market volatility (basis points)
     * @param timeToMaturity Time to maturity
     * @return adjustedYield Volatility-adjusted yield
     */
    function calculateVolatilityAdjustedYield(
        uint256 baseYield,
        uint256 volatility,
        uint256 timeToMaturity
    ) internal pure returns (uint256 adjustedYield) {
        require(baseYield <= MAX_YIELD_RATE, "Base yield too high");
        require(volatility <= MAX_YIELD_RATE, "Volatility too high");
        
        uint256 annualizedTime = (timeToMaturity * PRECISION) / SECONDS_PER_YEAR;
        uint256 volatilityAdjustment = (volatility * annualizedTime) / PRECISION;
        
        // Volatility increases yield for longer maturities
        adjustedYield = baseYield + volatilityAdjustment;
        
        if (adjustedYield > MAX_YIELD_RATE) {
            adjustedYield = MAX_YIELD_RATE;
        }
        
        return adjustedYield;
    }
    
    /**
     * @notice Calculate optimal split ratio for PT/YT tokens
     * @param syAmount Amount of SY tokens
     * @param maturity Maturity timestamp
     * @param currentTime Current timestamp
     * @param yieldRate Annual yield rate (basis points)
     * @param userRiskProfile User's risk tolerance (0-100)
     * @return ptRatio Optimal PT token ratio (basis points)
     * @return ytRatio Optimal YT token ratio (basis points)
     */
    function calculateOptimalSplitRatio(
        uint256 syAmount,
        uint256 maturity,
        uint256 currentTime,
        uint256 yieldRate,
        uint256 userRiskProfile
    ) internal pure returns (uint256 ptRatio, uint256 ytRatio) {
        require(userRiskProfile <= 100, "Invalid risk profile");
        
        (uint256 ptPrice, uint256 ytPrice) = calculatePTPrice(
            syAmount,
            maturity,
            currentTime,
            yieldRate
        );
        
        // Base ratio based on time value of money
        uint256 basePTRatio = (ptPrice * 10000) / syAmount;
        
        // Adjust based on user risk profile
        uint256 riskAdjustment = userRiskProfile * 100; // 0-10000 basis points
        
        ptRatio = basePTRatio + riskAdjustment;
        ytRatio = 10000 - ptRatio;
        
        // Ensure ratios are within bounds
        if (ptRatio > 10000) {
            ptRatio = 10000;
            ytRatio = 0;
        }
        
        return (ptRatio, ytRatio);
    }
} 
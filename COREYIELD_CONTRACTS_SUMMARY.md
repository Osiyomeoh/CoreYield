# CoreYield Smart Contracts - Complete Summary

This document contains a comprehensive summary of all smart contracts in the CoreYield protocol, organized by category and functionality.

## Table of Contents
1. [Core Protocol Contracts](#core-protocol-contracts)
2. [Yield Source Contracts](#yield-source-contracts)
3. [AMM & Trading Contracts](#amm--trading-contracts)
4. [Incentive Contracts](#incentive-contracts)
5. [Token Contracts](#token-contracts)
6. [Oracle Contracts](#oracle-contracts)
7. [Interface Contracts](#interface-contracts)
8. [Library Contracts](#library-contracts)
9. [Mock Contracts](#mock-contracts)

---

## Core Protocol Contracts

### CoreYieldFactory.sol
**Purpose**: Main factory contract for creating and managing yield markets
**Key Features**:
- Creates PT (Principal Token) and YT (Yield Token) markets
- Manages token splitting and redemption
- Handles yield distribution from various sources
- Provides market analytics and user position tracking
- Supports both synthetic and real yield sources

**Main Functions**:
- `createMarket()` - Creates new PT/YT markets
- `splitTokens()` - Splits SY tokens into PT and YT tokens
- `redeemTokens()` - Redeems PT and YT tokens back to SY tokens
- `claimYield()` - Claims accumulated yield for YT token holders
- `distributeYieldFromSource()` - Distributes yield from external sources

---

## Yield Source Contracts

### AaveLendingYield.sol
**Purpose**: Yield source contract for Aave lending protocol
**Key Features**:
- 3.8% APY interest rate
- Lending and withdrawal functionality
- Interest accrual and claiming
- Reentrancy protection

**Main Functions**:
- `deposit()` - Lend tokens to earn interest
- `withdraw()` - Withdraw lent tokens
- `claimInterest()` - Claim accumulated interest
- `getCurrentAPY()` - Get current annual yield rate

### CurveLPYield.sol
**Purpose**: Yield source contract for Curve LP token staking
**Key Features**:
- 12.1% APY fee generation
- Liquidity provision and removal
- Fee distribution to liquidity providers
- Automated fee accrual

**Main Functions**:
- `addLiquidity()` - Add liquidity to earn fees
- `removeLiquidity()` - Remove liquidity and claim fees
- `claimFees()` - Claim accumulated fees
- `getCurrentAPY()` - Get current annual yield rate

### LidoStakingYield.sol
**Purpose**: Yield source contract for Lido staking rewards
**Key Features**:
- 5.2% APY staking rewards
- Staking and unstaking functionality
- Reward accrual and claiming
- Time-based reward calculation

**Main Functions**:
- `stake()` - Stake tokens to earn rewards
- `withdraw()` - Unstake tokens
- `claimRewards()` - Claim accumulated rewards
- `getCurrentAPY()` - Get current annual yield rate

### StandardizedYieldToken.sol
**Purpose**: Wrapper token that standardizes yield-bearing assets
**Key Features**:
- Configurable yield rates
- Wrap/unwrap underlying assets
- Flash minting capabilities
- Batch operations support
- Advanced yield mathematics

**Main Functions**:
- `wrap()` - Wrap underlying asset into SY tokens
- `unwrap()` - Unwrap SY tokens back to underlying
- `claimYield()` - Claim accumulated yield
- `flashMint()` - Flash mint for arbitrage opportunities
- `batchWrap()` - Batch wrap operations for multiple users

---

## AMM & Trading Contracts

### CoreYieldAMM.sol
**Purpose**: Automated Market Maker for PT/YT token pairs
**Key Features**:
- Constant product AMM with yield-adjusted pricing
- Liquidity provision and removal
- PT ↔ YT token swapping
- Configurable fees (0.3% swap fee, 0.1% protocol fee)
- Pool management and analytics

**Main Functions**:
- `createPool()` - Create new AMM pools
- `addLiquidity()` - Add liquidity to pools
- `removeLiquidity()` - Remove liquidity from pools
- `swapPTForYT()` / `swapYTForPT()` - Token swapping
- `getSwapQuote()` - Get swap quotes and fees

---

## Incentive Contracts

### LiquidityMining.sol
**Purpose**: Liquidity mining incentives for AMM pools
**Key Features**:
- Reward distribution based on liquidity provision
- Configurable reward rates per pool
- Staking and unstaking mechanisms
- APY calculations and analytics

**Main Functions**:
- `addPool()` - Add new mining pools
- `stake()` - Stake liquidity tokens to earn rewards
- `unstake()` - Unstake liquidity tokens
- `claimRewards()` - Claim accumulated rewards
- `getPoolAPY()` - Get current pool APY

---

## Token Contracts

### CorePrincipalToken.sol
**Purpose**: Principal Token representing fixed principal value
**Key Features**:
- ERC20 standard with maturity restrictions
- Minting/burning controlled by factory
- Transfer restrictions after maturity
- Immutable maturity timestamp

**Main Functions**:
- `mint()` - Mint new PT tokens (owner only)
- `burn()` - Burn PT tokens (owner only)
- `transfer()` - Transfer with maturity check

### CoreYieldToken.sol
**Purpose**: Yield Token representing yield rights
**Key Features**:
- ERC20 standard with maturity restrictions
- Minting/burning controlled by factory
- Transfer restrictions after maturity
- Immutable maturity timestamp

**Main Functions**:
- `mint()` - Mint new YT tokens (owner only)
- `burn()` - Burn YT tokens (owner only)
- `transfer()` - Transfer with maturity check

---

## Oracle Contracts

### ChainlinkPriceOracle.sol
**Purpose**: Price oracle using Chainlink price feeds
**Key Features**:
- Chainlink price feed integration
- Fallback price mechanisms
- Configurable price feeds per token
- Batch operations support
- Decimal handling for different price feeds

**Main Functions**:
- `getPrice()` - Get token price from Chainlink
- `setPriceFeed()` - Set Chainlink price feed
- `setFallbackPrice()` - Set fallback prices
- `getPriceFeedInfo()` - Get price feed information

---

## Interface Contracts

### ICoreYieldFactory.sol
**Purpose**: Interface for CoreYieldFactory contract
**Key Features**:
- Complete function signatures
- Event definitions
- Struct definitions for Market and UserPosition
- Comprehensive market management interface

### ICoreYieldAMM.sol
**Purpose**: Interface for CoreYieldAMM contract
**Key Features**:
- Pool management functions
- Liquidity operations
- Trading functions
- Pool information queries

### ILiquidityMining.sol
**Purpose**: Interface for LiquidityMining contract
**Key Features**:
- Pool management interface
- Staking operations
- Reward claiming
- Analytics functions

### IYieldSource.sol
**Purpose**: Interface for yield source contracts
**Key Features**:
- APY queries
- Yield accrual tracking
- Total value queries

### IYieldToken.sol
**Purpose**: Interface for yield token contracts
**Key Features**:
- Yield claiming
- Expiration checks
- Yield distribution
- Rate queries

### IStakingToken.sol
**Purpose**: Interface for staking token contracts
**Key Features**:
- Reward rate queries
- Earned rewards calculation
- Reward claiming
- Balance queries

### IStandardizedYieldToken.sol
**Purpose**: Interface for standardized yield tokens
**Key Features**:
- Wrap/unwrap operations
- Yield claiming
- APY queries
- Underlying asset access

---

## Library Contracts

### LibDiamond.sol
**Purpose**: Diamond storage pattern implementation
**Key Features**:
- Diamond storage positioning
- Market and user position storage
- Protocol configuration storage
- Upgradeable storage pattern

### LibYieldMath.sol
**Purpose**: Advanced yield mathematics library
**Key Features**:
- Time value of money calculations
- Yield curve interpolation
- Volatility-adjusted yield calculations
- Optimal split ratio calculations
- PT/YT pricing models

**Main Functions**:
- `calculatePTPrice()` - Calculate PT/YT token prices
- `calculateYieldAccrual()` - Calculate yield accumulation
- `interpolateYieldCurve()` - Interpolate yield curves
- `calculateVolatilityAdjustedYield()` - Adjust yields for volatility
- `calculateOptimalSplitRatio()` - Calculate optimal PT/YT ratios

---

## Mock Contracts

### MockDualCORE.sol
**Purpose**: Mock contract for dual staked CORE tokens
**Key Features**:
- 12.1% APY reward rate
- CORE/BTC dual token system
- Liquidity provision simulation
- Pool information queries

### MockLstBTC.sol
**Purpose**: Mock contract for liquid staked BTC
**Key Features**:
- 4.2% APY reward rate
- Exchange rate updates
- BTC value calculations
- Staking simulation

### MockPriceOracle.sol
**Purpose**: Mock price oracle for testing
**Key Features**:
- Configurable token prices
- Default price fallbacks
- Batch price updates
- Price querying

### MockStCORE.sol
**Purpose**: Mock contract for staked CORE tokens
**Key Features**:
- 8.5% APY reward rate
- Staking and unstaking
- Time-based rewards
- Bonus rewards for long-term stakers

---

## Contract Architecture Overview

The CoreYield protocol follows a modular architecture with the following key components:

1. **Factory Pattern**: CoreYieldFactory creates and manages all markets
2. **Token Standardization**: StandardizedYieldToken provides consistent yield-bearing token interface
3. **Yield Sources**: Multiple yield source contracts for different DeFi protocols
4. **AMM Integration**: CoreYieldAMM enables trading of PT/YT token pairs
5. **Incentive Mechanisms**: LiquidityMining encourages participation
6. **Oracle Integration**: ChainlinkPriceOracle provides price feeds
7. **Mathematical Libraries**: LibYieldMath handles complex yield calculations

## Security Features

- Reentrancy protection on all external functions
- Access control with Ownable pattern
- Pausable functionality for emergency situations
- SafeERC20 for token transfers
- Input validation and bounds checking
- Emergency pause/resume functions

## Gas Optimization

- Efficient storage patterns
- Batch operations support
- Minimal external calls
- Optimized mathematical calculations
- Diamond storage pattern for upgradeability

---

*This summary covers all smart contracts in the CoreYield protocol as of the current implementation.*

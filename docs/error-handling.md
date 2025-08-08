# 🔒 Error Handling Guide - CoreYield Protocol

This document outlines the comprehensive error handling implemented across the CoreYield Protocol smart contracts and frontend.

## 🏗️ Smart Contract Error Handling

### **MockStCORE.sol**

#### **Input Validation**
```solidity
function mint(address to, uint256 amount) external {
    require(to != address(0), "Cannot mint to zero address");
    require(amount > 0, "Amount must be greater than zero");
    require(rewardPool >= amount, "Insufficient reward pool");
    // ... rest of function
}
```

**Error Scenarios:**
- ❌ **Zero Address**: Attempting to mint to `address(0)`
- ❌ **Zero Amount**: Attempting to mint 0 tokens
- ❌ **Insufficient Pool**: Minting more than available reward pool

#### **Reward Claiming**
```solidity
function getReward() external returns (uint256) {
    uint256 reward = this.earned(msg.sender);
    require(reward > 0, "No rewards to claim");
    require(rewardPool >= reward, "Insufficient reward pool");
    // ... rest of function
}
```

**Error Scenarios:**
- ❌ **No Rewards**: Attempting to claim when no rewards available
- ❌ **Insufficient Pool**: Claiming more than reward pool contains

#### **Rate Management**
```solidity
function setRewardRate(uint256 newRate) external onlyOwner {
    require(newRate <= 2000, "Rate too high"); // Max 20%
    // ... rest of function
}
```

**Error Scenarios:**
- ❌ **Excessive Rate**: Setting APY above 20% limit

### **MockLstBTC.sol**

#### **Input Validation**
```solidity
function mint(address to, uint256 amount) external {
    require(to != address(0), "Cannot mint to zero address");
    require(amount > 0, "Amount must be greater than zero");
    // ... rest of function
}
```

**Error Scenarios:**
- ❌ **Zero Address**: Attempting to mint to `address(0)`
- ❌ **Zero Amount**: Attempting to mint 0 tokens

### **MockDualCORE.sol**

#### **Input Validation**
```solidity
function mint(address to, uint256 amount) external {
    require(to != address(0), "Cannot mint to zero address");
    require(amount > 0, "Amount must be greater than zero");
    require(coreReserve >= amount / 2, "Insufficient CORE reserve");
    require(btcReserve >= amount / 20000, "Insufficient BTC reserve");
    // ... rest of function
}
```

**Error Scenarios:**
- ❌ **Zero Address**: Attempting to mint to `address(0)`
- ❌ **Zero Amount**: Attempting to mint 0 tokens
- ❌ **Insufficient CORE**: Minting more than available CORE reserve
- ❌ **Insufficient BTC**: Minting more than available BTC reserve

### **CoreYieldFactory.sol**

#### **Market Creation**
```solidity
function createMarket(
    address syToken,
    uint256 maturityDuration,
    string memory ptName,
    string memory ptSymbol,
    string memory ytName,
    string memory ytSymbol
) external override returns (bytes32 marketId) {
    require(syToken != address(0), "Invalid SY token");
    require(maturityDuration >= MIN_MATURITY && maturityDuration <= MAX_MATURITY, "Invalid maturity");
    // ... rest of function
}
```

**Error Scenarios:**
- ❌ **Invalid SY Token**: Providing zero address for SY token
- ❌ **Invalid Maturity**: Maturity outside allowed range (1 day - 365 days)

#### **Constructor Validation**
```solidity
constructor(address _feeRecipient) Ownable(msg.sender) {
    require(_feeRecipient != address(0), "Invalid fee recipient");
    feeRecipient = _feeRecipient;
}
```

**Error Scenarios:**
- ❌ **Invalid Fee Recipient**: Deploying with zero address fee recipient

## 🎨 Frontend Error Handling

### **Web3 Connection Errors**

#### **Wallet Connection**
```typescript
try {
  const { address, isConnected } = useAccount();
  if (!isConnected) {
    throw new Error("Wallet not connected");
  }
} catch (error) {
  console.error("Wallet connection error:", error);
  // Show user-friendly error message
}
```

**Error Scenarios:**
- ❌ **No Wallet**: User doesn't have a wallet installed
- ❌ **Wrong Network**: User connected to wrong network
- ❌ **Connection Failed**: Wallet connection timeout

#### **Contract Interaction Errors**
```typescript
try {
  const { data, error, isLoading } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'balanceOf',
    args: [userAddress],
  });
  
  if (error) {
    throw new Error(`Contract read failed: ${error.message}`);
  }
} catch (error) {
  console.error("Contract interaction error:", error);
  // Show user-friendly error message
}
```

**Error Scenarios:**
- ❌ **Contract Not Found**: Contract address doesn't exist
- ❌ **Function Not Found**: ABI doesn't match deployed contract
- ❌ **RPC Error**: Network connection issues
- ❌ **User Rejected**: User rejected transaction

### **Transaction Error Handling**

#### **Write Contract Errors**
```typescript
const { writeContract, isPending, error } = useWriteContract();

const handleMint = async (amount: string) => {
  try {
    await writeContract({
      address: mockStCOREAddress,
      abi: mockStCOREABI,
      functionName: 'mint',
      args: [userAddress, parseEther(amount)],
    });
  } catch (error) {
    if (error.message.includes("Cannot mint to zero address")) {
      showError("Invalid recipient address");
    } else if (error.message.includes("Amount must be greater than zero")) {
      showError("Please enter a valid amount");
    } else if (error.message.includes("Insufficient reward pool")) {
      showError("Insufficient tokens available for minting");
    } else {
      showError("Transaction failed. Please try again.");
    }
  }
};
```

**Error Scenarios:**
- ❌ **Insufficient Gas**: User doesn't have enough gas
- ❌ **Insufficient Balance**: User doesn't have enough tokens
- ❌ **Contract Revert**: Smart contract validation failed
- ❌ **Network Congestion**: Transaction stuck in mempool

### **Input Validation Errors**

#### **Amount Validation**
```typescript
const validateAmount = (amount: string): string | null => {
  if (!amount || amount === "0") {
    return "Please enter a valid amount";
  }
  
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return "Amount must be greater than zero";
  }
  
  if (numAmount > maxAmount) {
    return `Amount cannot exceed ${formatEther(maxAmount)}`;
  }
  
  return null; // No error
};
```

**Error Scenarios:**
- ❌ **Empty Input**: User submits empty amount
- ❌ **Invalid Number**: User enters non-numeric value
- ❌ **Zero Amount**: User enters 0 or negative value
- ❌ **Exceeds Balance**: User enters amount larger than balance

## 🧪 Testing Error Scenarios

### **Smart Contract Tests**
```typescript
describe("Error Handling", function () {
  it("Should reject minting to zero address", async function () {
    const amount = ethers.parseEther("1000");
    await expect(
      mockStCORE.mint(ethers.ZeroAddress, amount)
    ).to.be.revertedWith("Cannot mint to zero address");
  });

  it("Should reject minting zero amount", async function () {
    await expect(
      mockStCORE.mint(user1.address, 0)
    ).to.be.revertedWith("Amount must be greater than zero");
  });

  it("Should handle insufficient reward pool", async function () {
    const largeAmount = ethers.parseEther("2000000");
    await expect(
      mockStCORE.mint(user1.address, largeAmount)
    ).to.be.revertedWith("Insufficient reward pool");
  });
});
```

### **Frontend Error Tests**
```typescript
describe("Error Handling", () => {
  it("Should show error for invalid amount", () => {
    render(<MintForm />);
    const input = screen.getByPlaceholderText("Enter amount");
    fireEvent.change(input, { target: { value: "0" } });
    fireEvent.click(screen.getByText("Mint"));
    
    expect(screen.getByText("Amount must be greater than zero")).toBeInTheDocument();
  });

  it("Should handle wallet connection errors", () => {
    // Mock wallet connection failure
    mockUseAccount.mockReturnValue({ isConnected: false });
    
    render(<Dashboard />);
    expect(screen.getByText("Please connect your wallet")).toBeInTheDocument();
  });
});
```

## 🚨 Error Recovery Strategies

### **Smart Contract Recovery**
1. **Pause Mechanism**: Emergency pause for critical issues
2. **Upgradeable Contracts**: Ability to fix bugs via upgrades
3. **Timelock**: Delayed execution for admin functions
4. **Multi-sig**: Multiple signatures required for critical operations

### **Frontend Recovery**
1. **Retry Logic**: Automatic retry for failed transactions
2. **Fallback RPC**: Multiple RPC endpoints for redundancy
3. **Local Storage**: Cache user preferences and balances
4. **Offline Mode**: Basic functionality when network is down

## 📊 Error Monitoring

### **Smart Contract Events**
```solidity
event ErrorOccurred(
    address indexed user,
    string indexed errorType,
    string message,
    uint256 timestamp
);

function logError(string memory errorType, string memory message) internal {
    emit ErrorOccurred(msg.sender, errorType, message, block.timestamp);
}
```

### **Frontend Error Tracking**
```typescript
const trackError = (error: Error, context: string) => {
  console.error(`[${context}] Error:`, error);
  
  // Send to error tracking service
  analytics.track('error', {
    message: error.message,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  });
};
```

## 🔧 Best Practices

### **Smart Contract Best Practices**
1. ✅ **Fail Fast**: Revert early with clear error messages
2. ✅ **Input Validation**: Validate all external inputs
3. ✅ **Access Control**: Proper role-based permissions
4. ✅ **Reentrancy Protection**: Use ReentrancyGuard
5. ✅ **Gas Optimization**: Efficient error handling

### **Frontend Best Practices**
1. ✅ **User-Friendly Messages**: Clear, actionable error messages
2. ✅ **Graceful Degradation**: App works even with errors
3. ✅ **Loading States**: Show loading during operations
4. ✅ **Retry Options**: Allow users to retry failed operations
5. ✅ **Error Boundaries**: Catch and handle React errors

## 📈 Error Metrics

### **Key Metrics to Track**
- **Error Rate**: Percentage of failed transactions
- **Error Types**: Most common error categories
- **User Impact**: How errors affect user experience
- **Recovery Rate**: Percentage of errors that users recover from

### **Monitoring Dashboard**
```typescript
const ErrorMetrics = {
  totalErrors: 0,
  errorTypes: {},
  userRecoveryRate: 0,
  averageResolutionTime: 0,
  
  trackError(type: string) {
    this.totalErrors++;
    this.errorTypes[type] = (this.errorTypes[type] || 0) + 1;
  }
};
```

---

**This comprehensive error handling ensures the CoreYield Protocol is robust, user-friendly, and production-ready! 🚀** 
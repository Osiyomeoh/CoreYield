# 🚀 CoreYield Testnet Deployment Checklist

## 📋 Pre-Deployment Checklist

### 🔐 Environment Setup
- [ ] **Private Key**: Ensure `PRIVATE_KEY` is set in `.env` file
- [ ] **Network Configuration**: Verify Core Testnet2 RPC URL is correct
- [ ] **Gas Estimation**: Ensure sufficient CORE tokens for deployment (~0.1 CORE)
- [ ] **Account Balance**: Deployer account has enough CORE for all transactions

### 🧪 Pre-Deployment Testing
- [ ] **Local Testing**: All contracts tested locally (✅ COMPLETED)
- [ ] **Contract Compilation**: All contracts compile without errors
- [ ] **Gas Optimization**: Contracts optimized for testnet deployment
- [ ] **Integration Tests**: All user flows tested successfully

### 📁 File Preparation
- [ ] **Deployment Script**: `scripts/deploy-testnet.ts` ready
- [ ] **Testing Script**: `scripts/test-testnet-deployment.ts` ready
- [ ] **Hardhat Config**: Network configuration verified
- [ ] **Contract Artifacts**: All contract ABIs generated

## 🎯 Deployment Process

### Phase 1: Mock Tokens
- [ ] Deploy MockDualCORE (CORE token)
- [ ] Deploy MockStCORE (stCORE token)
- [ ] Verify token contracts are working

### Phase 2: Core Contracts
- [ ] Deploy CoreStaking
- [ ] Deploy CoreSwapAMM
- [ ] Deploy PortfolioTracker
- [ ] Deploy YieldHarvester
- [ ] Deploy RiskManager
- [ ] Deploy CoreGovernance
- [ ] Deploy AnalyticsEngine
- [ ] Deploy CoreYieldStrategy
- [ ] Deploy CoreYieldBridge
- [ ] Deploy CoreYieldRouter (main router)

### Phase 3: Initial Configuration
- [ ] Seed staking contract with stCORE rewards
- [ ] Add tokens to PortfolioTracker
- [ ] Add tokens to RiskManager
- [ ] Add tokens to AnalyticsEngine
- [ ] Add tokens to CoreSwapAMM

### Phase 4: AMM Pool Creation
- [ ] Create initial liquidity pool
- [ ] Add initial liquidity (1000 tokens each)
- [ ] Verify pool creation

### Phase 5: Governance Setup
- [ ] Set initial voting power for deployer
- [ ] Verify governance contract configuration

### Phase 6: Market Stats Update
- [ ] Update market statistics
- [ ] Set initial APY and risk levels

### Phase 7: Bridge Setup
- [ ] Add supported chains (Polygon, Ethereum)
- [ ] Verify bridge configuration

### Phase 8: Yield Strategy Setup
- [ ] Create initial yield strategy
- [ ] Verify strategy parameters

### Phase 9: Router Initialization
- [ ] Add supported tokens to router
- [ ] Transfer ownership of all contracts to router
- [ ] Verify router has full control

### Phase 10: Verification & Testing
- [ ] Test staking functionality
- [ ] Test swapping functionality
- [ ] Test portfolio tracking
- [ ] Test emergency functions

## 🧪 Post-Deployment Testing

### Comprehensive Testing
- [ ] Run `scripts/test-testnet-deployment.ts`
- [ ] Verify all 14 test phases pass
- [ ] Check gas usage optimization
- [ ] Validate error handling

### Test Coverage
- [ ] **Basic Functionality**: Token minting, approvals
- [ ] **Core Features**: Staking, swapping, portfolio tracking
- [ ] **Advanced Features**: Risk management, governance, yield strategies
- [ ] **Emergency Functions**: Pause/resume functionality
- [ ] **Edge Cases**: Zero amounts, insufficient balances
- [ ] **Integration**: Complete user flows

## 📊 Success Criteria

### Minimum Requirements
- [ ] **Success Rate**: ≥95% of tests pass
- [ ] **Critical Functions**: All emergency and core functions working
- [ ] **Gas Efficiency**: Reasonable gas usage for all operations
- [ ] **Error Handling**: Proper error messages and revert handling

### Production Readiness
- [ ] **Stability**: No critical failures during testing
- [ ] **Integration**: All contracts work together seamlessly
- [ ] **User Experience**: Smooth user flows without errors
- [ ] **Security**: Proper access controls and ownership

## 🔍 Verification Steps

### Contract Verification
- [ ] Verify all contracts on Core Testnet2 Explorer
- [ ] Check contract bytecode matches source code
- [ ] Verify constructor parameters
- [ ] Confirm ownership transfers

### Functionality Verification
- [ ] Test staking with real transactions
- [ ] Test swapping with real transactions
- [ ] Verify portfolio tracking accuracy
- [ ] Test emergency pause/resume

### Integration Verification
- [ ] Verify router coordinates all contracts
- [ ] Check token flow between contracts
- [ ] Validate cross-contract calls
- [ ] Test complete user journeys

## 📝 Documentation

### Deployment Records
- [ ] Save deployment addresses to JSON file
- [ ] Record gas usage for each deployment
- [ ] Document any deployment issues
- [ ] Save test results and recommendations

### User Documentation
- [ ] Update frontend configuration
- [ ] Document contract addresses
- [ ] Create user testing guide
- [ ] Prepare feedback collection

## 🚨 Emergency Procedures

### If Deployment Fails
- [ ] Save error logs and transaction hashes
- [ ] Analyze failure point
- [ ] Fix issues in contracts
- [ ] Redeploy with corrections

### If Testing Reveals Issues
- [ ] Document all failures
- [ ] Prioritize critical issues
- [ ] Fix and redeploy affected contracts
- [ ] Re-run comprehensive tests

## 🎯 Post-Deployment Actions

### Immediate Actions
- [ ] Share contract addresses with team
- [ ] Update frontend configuration
- [ ] Begin user testing phase
- [ ] Monitor contract performance

### Ongoing Monitoring
- [ ] Track gas usage patterns
- [ ] Monitor user interactions
- [ ] Collect feedback and bug reports
- [ ] Plan optimizations for mainnet

## 📋 Deployment Commands

### 1. Deploy to Testnet
```bash
npx hardhat run scripts/deploy-testnet.ts --network coreTestnet
```

### 2. Test Deployment
```bash
npx hardhat run scripts/test-testnet-deployment.ts --network coreTestnet
```

### 3. Verify Contracts (if needed)
```bash
npx hardhat verify --network coreTestnet <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## 🎉 Success Indicators

### Deployment Success
- ✅ All contracts deployed without errors
- ✅ All ownership transfers completed
- ✅ Initial configuration successful
- ✅ Basic functionality verified

### Testing Success
- ✅ ≥95% test success rate
- ✅ All critical functions working
- ✅ Emergency functions operational
- ✅ Integration tests passing

### Production Readiness
- ✅ System stable under load
- ✅ User flows working smoothly
- ✅ Error handling robust
- ✅ Ready for user feedback

---

## 🚀 Ready for Deployment?

**Before proceeding, ensure:**
1. All local tests pass (✅ COMPLETED)
2. Environment properly configured
3. Sufficient testnet CORE tokens
4. Team ready for testing phase
5. Emergency procedures understood

**Deployment Status: READY** 🎯

**Estimated Deployment Time:** 15-20 minutes
**Estimated Testing Time:** 10-15 minutes
**Total Time:** 25-35 minutes

**Confidence Level:** 95% (based on local testing success)

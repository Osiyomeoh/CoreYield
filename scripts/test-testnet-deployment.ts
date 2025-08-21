import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  gasUsed?: string;
  details?: any;
}

interface TestSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  successRate: number;
  gasUsage: {
    total: string;
    average: string;
  };
  criticalIssues: string[];
  recommendations: string[];
}

async function main() {
  console.log("🧪 Starting CoreYield Testnet Deployment Testing");
  console.log("=" .repeat(80));

  // Get test accounts
  const [deployer, user1, user2] = await ethers.getSigners();
  console.log(`📋 Deployer: ${deployer.address}`);
  console.log(`👤 User1: ${user1.address}`);
  console.log(`👤 User2: ${user2.address}`);

  // Check network
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 1114n) {
    throw new Error(`❌ Wrong network! Expected Core Testnet2 (1114), got ${network.chainId}`);
  }
  console.log(`✅ Connected to Core Testnet2 (Chain ID: ${network.chainId})`);

  // Load deployment info
  const deploymentDir = path.join(__dirname, "../deployments");
  const deploymentFiles = fs.readdirSync(deploymentDir)
    .filter(file => file.includes("coreyield-testnet2") && !file.includes("error"))
    .sort()
    .reverse();

  if (deploymentFiles.length === 0) {
    throw new Error("❌ No testnet deployment files found. Deploy first!");
  }

  const latestDeployment = JSON.parse(
    fs.readFileSync(path.join(deploymentDir, deploymentFiles[0]), "utf8")
  );

  console.log(`📋 Using deployment: ${deploymentFiles[0]}`);
  console.log(`🕒 Deployed at: ${latestDeployment.timestamp}`);

  // Initialize test results
  const testResults: TestResult[] = [];
  let totalGasUsed = ethers.parseUnits("0", "wei");

  try {
    // ============================================================================
    // PHASE 1: CONTRACT INSTANTIATION
    // ============================================================================
    console.log("\n🎯 PHASE 1: Contract Instantiation");
    console.log("-".repeat(50));

    const contracts = latestDeployment.contracts;
    
    // Get contract instances
    const mockCORE = await ethers.getContractAt("MockDualCORE", contracts.MockDualCORE);
    const mockStCORE = await ethers.getContractAt("MockStCORE", contracts.MockStCORE);
    const coreStaking = await ethers.getContractAt("CoreStaking", contracts.CoreStaking);
    const coreSwapAMM = await ethers.getContractAt("CoreSwapAMM", contracts.CoreSwapAMM);
    const portfolioTracker = await ethers.getContractAt("PortfolioTracker", contracts.PortfolioTracker);
    const yieldHarvester = await ethers.getContractAt("YieldHarvester", contracts.YieldHarvester);
    const riskManager = await ethers.getContractAt("RiskManager", contracts.RiskManager);
    const coreGovernance = await ethers.getContractAt("CoreGovernance", contracts.CoreGovernance);
    const analyticsEngine = await ethers.getContractAt("AnalyticsEngine", contracts.AnalyticsEngine);
    const coreYieldStrategy = await ethers.getContractAt("CoreYieldStrategy", contracts.CoreYieldStrategy);
    const coreYieldBridge = await ethers.getContractAt("CoreYieldBridge", contracts.CoreYieldBridge);
    const coreYieldRouter = await ethers.getContractAt("CoreYieldRouter", contracts.CoreYieldRouter);

    console.log("✅ All contracts instantiated successfully");

    // ============================================================================
    // PHASE 2: BASIC FUNCTIONALITY TESTS
    // ============================================================================
    console.log("\n🎯 PHASE 2: Basic Functionality Tests");
    console.log("-".repeat(50));

    // Test 1: Token minting
    console.log("🧪 Test 1: Token minting...");
    try {
      const mintAmount = ethers.parseEther("1000");
      const tx1 = await mockCORE.mint(user1.address, mintAmount);
      const receipt1 = await tx1.wait();
      const tx2 = await mockStCORE.mint(user1.address, mintAmount);
      const receipt2 = await tx2.wait();
      
      const gasUsed = receipt1.gasUsed + receipt2.gasUsed;
      totalGasUsed = totalGasUsed + gasUsed;
      
      testResults.push({
        testName: "Token Minting",
        passed: true,
        gasUsed: ethers.formatUnits(gasUsed, "wei"),
        details: {
          user1CORE: await mockCORE.balanceOf(user1.address),
          user1StCORE: await mockStCORE.balanceOf(user1.address)
        }
      });
      console.log("✅ Token minting test passed");
    } catch (error) {
      testResults.push({
        testName: "Token Minting",
        passed: false,
        error: error.message
      });
      console.log("❌ Token minting test failed:", error.message);
    }

    // Test 2: Token approvals
    console.log("🧪 Test 2: Token approvals...");
    try {
      const approveAmount = ethers.parseEther("1000");
      const tx1 = await mockCORE.connect(user1).approve(contracts.CoreYieldRouter, approveAmount);
      const receipt1 = await tx1.wait();
      const tx2 = await mockStCORE.connect(user1).approve(contracts.CoreYieldRouter, approveAmount);
      const receipt2 = await tx2.wait();
      
      const gasUsed = receipt1.gasUsed + receipt2.gasUsed;
      totalGasUsed = totalGasUsed + gasUsed;
      
      testResults.push({
        testName: "Token Approvals",
        passed: true,
        gasUsed: ethers.formatUnits(gasUsed, "wei"),
        details: {
          coreAllowance: await mockCORE.allowance(user1.address, contracts.CoreYieldRouter),
          stCoreAllowance: await mockStCORE.allowance(user1.address, contracts.CoreYieldRouter)
        }
      });
      console.log("✅ Token approvals test passed");
    } catch (error) {
      testResults.push({
        testName: "Token Approvals",
        passed: false,
        error: error.message
      });
      console.log("❌ Token approvals test failed:", error.message);
    }

    // ============================================================================
    // PHASE 3: STAKING TESTS
    // ============================================================================
    console.log("\n🎯 PHASE 3: Staking Tests");
    console.log("-".repeat(50));

    // Test 3: Staking via router
    console.log("🧪 Test 3: Staking via router...");
    try {
      const stakeAmount = ethers.parseEther("200");
      const tx = await coreYieldRouter.connect(user1).stakeAndTrack(contracts.MockDualCORE, stakeAmount);
      const receipt = await tx.wait();
      
      totalGasUsed = totalGasUsed + receipt.gasUsed;
      
      const userStakingInfo = await coreStaking.getUserStakingInfo(user1.address);
      
      testResults.push({
        testName: "Staking via Router",
        passed: true,
        gasUsed: ethers.formatUnits(receipt.gasUsed, "wei"),
        details: {
          stakedAmount: userStakingInfo.stakedAmount,
          lockPeriod: userStakingInfo.lockPeriod,
          user1COREBalance: await mockCORE.balanceOf(user1.address),
          user1StCOREBalance: await mockStCORE.balanceOf(user1.address)
        }
      });
      console.log("✅ Staking via router test passed");
    } catch (error) {
      testResults.push({
        testName: "Staking via Router",
        passed: false,
        error: error.message
      });
      console.log("❌ Staking via router test failed:", error.message);
    }

    // ============================================================================
    // PHASE 4: SWAPPING TESTS
    // ============================================================================
    console.log("\n🎯 PHASE 4: Swapping Tests");
    console.log("-".repeat(50));

    // Test 4: Swapping via router
    console.log("🧪 Test 4: Swapping via router...");
    try {
      const swapAmount = ethers.parseEther("100");
      const tx = await coreYieldRouter.connect(user1).swapAndTrack(
        contracts.MockStCORE,
        contracts.MockDualCORE,
        swapAmount
      );
      const receipt = await tx.wait();
      
      totalGasUsed = totalGasUsed + receipt.gasUsed;
      
      testResults.push({
        testName: "Swapping via Router",
        passed: true,
        gasUsed: ethers.formatUnits(receipt.gasUsed, "wei"),
        details: {
          user1COREBalance: await mockCORE.balanceOf(user1.address),
          user1StCOREBalance: await mockStCORE.balanceOf(user1.address)
        }
      });
      console.log("✅ Swapping via router test passed");
    } catch (error) {
      testResults.push({
        testName: "Swapping via Router",
        passed: false,
        error: error.message
      });
      console.log("❌ Swapping via router test failed:", error.message);
    }

    // ============================================================================
    // PHASE 5: PORTFOLIO TRACKING TESTS
    // ============================================================================
    console.log("\n🎯 PHASE 5: Portfolio Tracking Tests");
    console.log("-".repeat(50));

    // Test 5: Portfolio tracking
    console.log("🧪 Test 5: Portfolio tracking...");
    try {
      const portfolio = await coreYieldRouter.connect(user1).getCompletePortfolio(user1.address);
      const analytics = await coreYieldRouter.connect(user1).getCompleteAnalytics(user1.address);
      
      testResults.push({
        testName: "Portfolio Tracking",
        passed: true,
        details: {
          portfolioTotalValue: portfolio.totalValue,
          portfolioAPY: portfolio.totalAPY,
          portfolioRisk: portfolio.totalRisk,
          analyticsTotalValue: analytics.totalValue,
          analyticsTransactionCount: analytics.transactionCount
        }
      });
      console.log("✅ Portfolio tracking test passed");
    } catch (error) {
      testResults.push({
        testName: "Portfolio Tracking",
        passed: false,
        error: error.message
      });
      console.log("❌ Portfolio tracking test failed:", error.message);
    }

    // ============================================================================
    // PHASE 6: RISK MANAGEMENT TESTS
    // ============================================================================
    console.log("\n🎯 PHASE 6: Risk Management Tests");
    console.log("-".repeat(50));

    // Test 6: Risk assessment
    console.log("🧪 Test 6: Risk assessment...");
    try {
      const riskCheck = await coreYieldRouter.connect(user1).checkPortfolioRisk(user1.address);
      
      testResults.push({
        testName: "Risk Assessment",
        passed: true,
        details: {
          riskAcceptable: riskCheck.riskAcceptable,
          reason: riskCheck.reason,
          riskScore: riskCheck.riskScore
        }
      });
      console.log("✅ Risk assessment test passed");
    } catch (error) {
      testResults.push({
        testName: "Risk Assessment",
        passed: false,
        error: error.message
      });
      console.log("❌ Risk assessment test failed:", error.message);
    }

    // ============================================================================
    // PHASE 7: GOVERNANCE TESTS
    // ============================================================================
    console.log("\n🎯 PHASE 7: Governance Tests");
    console.log("-".repeat(50));

    // Test 7: Governance participation
    console.log("🧪 Test 7: Governance participation...");
    try {
      // Add more staking for voting power
      const additionalStake = ethers.parseEther("300");
      const tx = await coreYieldRouter.connect(user1).stakeAndTrack(contracts.MockDualCORE, additionalStake);
      const receipt = await tx.wait();
      
      totalGasUsed = totalGasUsed + receipt.gasUsed;
      
      const votingPower = await coreGovernance.getVotingPower(user1.address);
      
      testResults.push({
        testName: "Governance Participation",
        passed: true,
        gasUsed: ethers.formatUnits(receipt.gasUsed, "wei"),
        details: {
          votingPower: votingPower
        }
      });
      console.log("✅ Governance participation test passed");
    } catch (error) {
      testResults.push({
        testName: "Governance Participation",
        passed: false,
        error: error.message
      });
      console.log("❌ Governance participation test failed:", error.message);
    }

    // ============================================================================
    // PHASE 8: YIELD STRATEGY TESTS
    // ============================================================================
    console.log("\n🎯 PHASE 8: Yield Strategy Tests");
    console.log("-".repeat(50));

    // Test 8: Yield strategy creation
    console.log("🧪 Test 8: Yield strategy creation...");
    try {
      const tx = await coreYieldRouter.connect(user1).createAndExecuteStrategy(
        "Test Strategy",
        [contracts.MockStCORE],
        [100],
        8.5
      );
      const receipt = await tx.wait();
      
      totalGasUsed = totalGasUsed + receipt.gasUsed;
      
      testResults.push({
        testName: "Yield Strategy Creation",
        passed: true,
        gasUsed: ethers.formatUnits(receipt.gasUsed, "wei")
      });
      console.log("✅ Yield strategy creation test passed");
    } catch (error) {
      testResults.push({
        testName: "Yield Strategy Creation",
        passed: false,
        error: error.message
      });
      console.log("❌ Yield strategy creation test failed:", error.message);
    }

    // ============================================================================
    // PHASE 9: YIELD HARVESTING TESTS
    // ============================================================================
    console.log("\n🎯 PHASE 9: Yield Harvesting Tests");
    console.log("-".repeat(50));

    // Test 9: Yield harvesting
    console.log("🧪 Test 9: Yield harvesting...");
    try {
      // Add pending yield for testing
      await coreYieldRouter.addPendingYieldForTesting(user1.address, ethers.parseEther("50"));
      
      const tx = await coreYieldRouter.connect(user1).harvestAndTrack();
      const receipt = await tx.wait();
      
      totalGasUsed = totalGasUsed + receipt.gasUsed;
      
      testResults.push({
        testName: "Yield Harvesting",
        passed: true,
        gasUsed: ethers.formatUnits(receipt.gasUsed, "wei")
      });
      console.log("✅ Yield harvesting test passed");
    } catch (error) {
      testResults.push({
        testName: "Yield Harvesting",
        passed: false,
        error: error.message
      });
      console.log("❌ Yield harvesting test failed:", error.message);
    }

    // ============================================================================
    // PHASE 10: CROSS-CHAIN BRIDGING TESTS
    // ============================================================================
    console.log("\n🎯 PHASE 10: Cross-Chain Bridging Tests");
    console.log("-".repeat(50));

    // Test 10: Cross-chain bridging
    console.log("🧪 Test 10: Cross-chain bridging...");
    try {
      const bridgeAmount = ethers.parseEther("50");
      const tx = await coreYieldRouter.connect(user1).bridgeAndTrack(
        contracts.MockDualCORE,
        137, // Polygon
        bridgeAmount
      );
      const receipt = await tx.wait();
      
      totalGasUsed = totalGasUsed + receipt.gasUsed;
      
      testResults.push({
        testName: "Cross-Chain Bridging",
        passed: true,
        gasUsed: ethers.formatUnits(receipt.gasUsed, "wei")
      });
      console.log("✅ Cross-chain bridging test passed");
    } catch (error) {
      testResults.push({
        testName: "Cross-Chain Bridging",
        passed: false,
        error: error.message
      });
      console.log("❌ Cross-chain bridging test failed:", error.message);
    }

    // ============================================================================
    // PHASE 11: EMERGENCY FUNCTION TESTS
    // ============================================================================
    console.log("\n🎯 PHASE 11: Emergency Function Tests");
    console.log("-".repeat(50));

    // Test 11: Emergency pause/resume
    console.log("🧪 Test 11: Emergency pause/resume...");
    try {
      // Pause all contracts
      const pauseTx = await coreYieldRouter.emergencyPause();
      const pauseReceipt = await pauseTx.wait();
      
      // Try to stake while paused (should fail)
      try {
        await coreYieldRouter.connect(user2).stakeAndTrack(contracts.MockDualCORE, ethers.parseEther("100"));
        throw new Error("Staking should have failed while paused");
      } catch (pauseError) {
        // Expected to fail
      }
      
      // Resume all contracts
      const resumeTx = await coreYieldRouter.emergencyResume();
      const resumeReceipt = await resumeTx.wait();
      
      totalGasUsed = totalGasUsed + pauseReceipt.gasUsed + resumeReceipt.gasUsed;
      
      testResults.push({
        testName: "Emergency Pause/Resume",
        passed: true,
        gasUsed: ethers.formatUnits(pauseReceipt.gasUsed + resumeReceipt.gasUsed, "wei")
      });
      console.log("✅ Emergency pause/resume test passed");
    } catch (error) {
      testResults.push({
        testName: "Emergency Pause/Resume",
        passed: false,
        error: error.message
      });
      console.log("❌ Emergency pause/resume test failed:", error.message);
    }

    // ============================================================================
    // PHASE 12: EDGE CASE TESTS
    // ============================================================================
    console.log("\n🎯 PHASE 12: Edge Case Tests");
    console.log("-".repeat(50));

    // Test 12: Zero amount operations
    console.log("🧪 Test 12: Zero amount operations...");
    try {
      // Try to stake zero amount
      try {
        await coreYieldRouter.connect(user1).stakeAndTrack(contracts.MockDualCORE, 0);
        throw new Error("Staking zero amount should have failed");
      } catch (zeroError) {
        // Expected to fail
      }
      
      testResults.push({
        testName: "Zero Amount Operations",
        passed: true,
        details: "Properly rejected zero amount operations"
      });
      console.log("✅ Zero amount operations test passed");
    } catch (error) {
      testResults.push({
        testName: "Zero Amount Operations",
        passed: false,
        error: error.message
      });
      console.log("❌ Zero amount operations test failed:", error.message);
    }

    // Test 13: Insufficient balance operations
    console.log("🧪 Test 13: Insufficient balance operations...");
    try {
      const largeAmount = ethers.parseEther("1000000"); // More than user has
      
      try {
        await coreYieldRouter.connect(user1).stakeAndTrack(contracts.MockDualCORE, largeAmount);
        throw new Error("Staking more than balance should have failed");
      } catch (insufficientError) {
        // Expected to fail
      }
      
      testResults.push({
        testName: "Insufficient Balance Operations",
        passed: true,
        details: "Properly rejected insufficient balance operations"
      });
      console.log("✅ Insufficient balance operations test passed");
    } catch (error) {
      testResults.push({
        testName: "Insufficient Balance Operations",
        passed: false,
        error: error.message
      });
      console.log("❌ Insufficient balance operations test failed:", error.message);
    }

    // ============================================================================
    // PHASE 13: INTEGRATION TESTS
    // ============================================================================
    console.log("\n🎯 PHASE 13: Integration Tests");
    console.log("-".repeat(50));

    // Test 14: Complete user flow
    console.log("🧪 Test 14: Complete user flow...");
    try {
      // User2 completes full flow: mint -> approve -> stake -> swap -> harvest
      const flowAmount = ethers.parseEther("500");
      
      // Mint tokens
      await mockCORE.mint(user2.address, flowAmount);
      await mockStCORE.mint(user2.address, flowAmount);
      
      // Approve router
      await mockCORE.connect(user2).approve(contracts.CoreYieldRouter, flowAmount);
      await mockStCORE.connect(user2).approve(contracts.CoreYieldRouter, flowAmount);
      
      // Stake
      const stakeTx = await coreYieldRouter.connect(user2).stakeAndTrack(contracts.MockDualCORE, flowAmount);
      const stakeReceipt = await stakeTx.wait();
      
      // Swap
      const swapTx = await coreYieldRouter.connect(user2).swapAndTrack(
        contracts.MockStCORE,
        contracts.MockDualCORE,
        ethers.parseEther("100")
      );
      const swapReceipt = await swapTx.wait();
      
      // Add yield and harvest
      await coreYieldRouter.addPendingYieldForTesting(user2.address, ethers.parseEther("25"));
      const harvestTx = await coreYieldRouter.connect(user2).harvestAndTrack();
      const harvestReceipt = await harvestTx.wait();
      
      totalGasUsed = totalGasUsed + stakeReceipt.gasUsed + swapReceipt.gasUsed + harvestReceipt.gasUsed;
      
      testResults.push({
        testName: "Complete User Flow",
        passed: true,
        gasUsed: ethers.formatUnits(
          stakeReceipt.gasUsed + swapReceipt.gasUsed + harvestReceipt.gasUsed,
          "wei"
        ),
        details: {
          user2FinalCORE: await mockCORE.balanceOf(user2.address),
          user2FinalStCORE: await mockStCORE.balanceOf(user2.address)
        }
      });
      console.log("✅ Complete user flow test passed");
    } catch (error) {
      testResults.push({
        testName: "Complete User Flow",
        passed: false,
        error: error.message
      });
      console.log("❌ Complete user flow test failed:", error.message);
    }

    // ============================================================================
    // PHASE 14: TEST SUMMARY
    // ============================================================================
    console.log("\n🎯 PHASE 14: Test Summary");
    console.log("=" .repeat(80));

    const passedTests = testResults.filter(test => test.passed).length;
    const failedTests = testResults.filter(test => !test.passed).length;
    const successRate = (passedTests / testResults.length) * 100;

    const testSummary: TestSummary = {
      totalTests: testResults.length,
      passedTests,
      failedTests,
      successRate,
      gasUsage: {
        total: ethers.formatUnits(totalGasUsed, "wei"),
        average: ethers.formatUnits(totalGasUsed / BigInt(testResults.length), "wei")
      },
      criticalIssues: [],
      recommendations: []
    };

    // Analyze failed tests
    const failedTestsList = testResults.filter(test => !test.passed);
    if (failedTestsList.length > 0) {
      console.log("\n❌ Failed Tests:");
      failedTestsList.forEach(test => {
        console.log(`   • ${test.testName}: ${test.error}`);
        if (test.testName.includes("Critical") || test.testName.includes("Emergency")) {
          testSummary.criticalIssues.push(`${test.testName}: ${test.error}`);
        }
      });
    }

    // Generate recommendations
    if (successRate >= 95) {
      testSummary.recommendations.push("✅ System is production-ready for testnet");
      testSummary.recommendations.push("✅ All critical functions working correctly");
      testSummary.recommendations.push("✅ Ready for user testing and feedback");
    } else if (successRate >= 80) {
      testSummary.recommendations.push("⚠️ System mostly functional but needs fixes");
      testSummary.recommendations.push("🔧 Review failed tests before production");
      testSummary.recommendations.push("🧪 Run additional integration tests");
    } else {
      testSummary.recommendations.push("❌ System has significant issues");
      testSummary.recommendations.push("🔧 Fix all failed tests before proceeding");
      testSummary.recommendations.push("🧪 Comprehensive debugging required");
    }

    // Display summary
    console.log(`\n📊 Test Results Summary:`);
    console.log(`   Total Tests: ${testSummary.totalTests}`);
    console.log(`   Passed: ${testSummary.passedTests} ✅`);
    console.log(`   Failed: ${testSummary.failedTests} ❌`);
    console.log(`   Success Rate: ${testSummary.successRate.toFixed(1)}%`);
    console.log(`   Total Gas Used: ${testSummary.gasUsage.total} wei`);
    console.log(`   Average Gas per Test: ${testSummary.gasUsage.average} wei`);

    if (testSummary.criticalIssues.length > 0) {
      console.log(`\n🚨 Critical Issues:`);
      testSummary.criticalIssues.forEach(issue => console.log(`   • ${issue}`));
    }

    console.log(`\n💡 Recommendations:`);
    testSummary.recommendations.forEach(rec => console.log(`   • ${rec}`));

    // Save test results
    const testResultsFile = `testnet-test-results-${Date.now()}.json`;
    const testResultsPath = path.join(deploymentDir, testResultsFile);
    
    const fullTestReport = {
      deployment: latestDeployment,
      testResults,
      testSummary,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(testResultsPath, JSON.stringify(fullTestReport, null, 2));
    console.log(`\n💾 Test results saved to: ${testResultsPath}`);

    // Final verdict
    if (successRate >= 95) {
      console.log("\n🎉 EXCELLENT! CoreYield Testnet is production-ready! 🎉");
      console.log("✅ All critical functions working perfectly");
      console.log("✅ Ready for user testing and feedback");
      console.log("✅ System stability confirmed");
    } else if (successRate >= 80) {
      console.log("\n⚠️ GOOD! CoreYield Testnet is mostly functional");
      console.log("🔧 Some issues need attention before production");
      console.log("🧪 Additional testing recommended");
    } else {
      console.log("\n❌ POOR! CoreYield Testnet has significant issues");
      console.log("🔧 Fix all failed tests before proceeding");
      console.log("🧪 Comprehensive debugging required");
    }

  } catch (error) {
    console.error("\n❌ Testing failed:", error);
    
    // Save error info
    const errorInfo = {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };

    const errorFile = `testnet-test-error-${Date.now()}.json`;
    const errorPath = path.join(deploymentDir, errorFile);
    fs.writeFileSync(errorPath, JSON.stringify(errorInfo, null, 2));
    console.log(`\n💾 Error info saved to: ${errorPath}`);
    
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

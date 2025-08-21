import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeploymentInfo {
  network: string;
  timestamp: string;
  deployer: string;
  contracts: {
    [key: string]: string;
  };
  verification: {
    [key: string]: boolean;
  };
  testResults: {
    [key: string]: boolean;
  };
}

async function main() {
  console.log("🚀 Starting CoreYield Testnet Deployment to Core Testnet2");
  console.log("=" .repeat(80));

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`📋 Deployer: ${deployer.address}`);
  console.log(`💰 Deployer balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);

  // Check network
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 1114n) {
    throw new Error(`❌ Wrong network! Expected Core Testnet2 (1114), got ${network.chainId}`);
  }
  console.log(`✅ Connected to Core Testnet2 (Chain ID: ${network.chainId})`);

  // Initialize deployment info
  const deploymentInfo: DeploymentInfo = {
    network: "coreTestnet2",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {},
    verification: {},
    testResults: {}
  };

  try {
    // ============================================================================
    // PHASE 1: DEPLOY MOCK TOKENS
    // ============================================================================
    console.log("\n🎯 PHASE 1: Deploying Mock Tokens");
    console.log("-".repeat(50));

    const MockDualCORE = await ethers.getContractFactory("MockDualCORE");
    const mockCORE = await MockDualCORE.deploy();
    await mockCORE.waitForDeployment();
    const mockCOREAddress = await mockCORE.getAddress();
    deploymentInfo.contracts.MockDualCORE = mockCOREAddress;
    console.log(`✅ Mock CORE deployed to: ${mockCOREAddress}`);

    const MockStCORE = await ethers.getContractFactory("MockStCORE");
    const mockStCORE = await MockStCORE.deploy();
    await mockStCORE.waitForDeployment();
    const mockStCOREAddress = await mockStCORE.getAddress();
    deploymentInfo.contracts.MockStCORE = mockStCOREAddress;
    console.log(`✅ Mock stCORE deployed to: ${mockStCOREAddress}`);

    // ============================================================================
    // PHASE 2: DEPLOY CORE CONTRACTS
    // ============================================================================
    console.log("\n🎯 PHASE 2: Deploying Core Contracts");
    console.log("-".repeat(50));

    // Deploy CoreStaking
    const CoreStaking = await ethers.getContractFactory("CoreStaking");
    const coreStaking = await CoreStaking.deploy(mockCOREAddress, mockStCOREAddress);
    await coreStaking.waitForDeployment();
    const coreStakingAddress = await coreStaking.getAddress();
    deploymentInfo.contracts.CoreStaking = coreStakingAddress;
    console.log(`✅ CoreStaking deployed to: ${coreStakingAddress}`);

    // Deploy CoreSwapAMM
    const CoreSwapAMM = await ethers.getContractFactory("CoreSwapAMM");
    const coreSwapAMM = await CoreSwapAMM.deploy();
    await coreSwapAMM.waitForDeployment();
    const coreSwapAMMAddress = await coreSwapAMM.getAddress();
    deploymentInfo.contracts.CoreSwapAMM = coreSwapAMMAddress;
    console.log(`✅ CoreSwapAMM deployed to: ${coreSwapAMMAddress}`);

    // Deploy PortfolioTracker
    const PortfolioTracker = await ethers.getContractFactory("PortfolioTracker");
    const portfolioTracker = await PortfolioTracker.deploy();
    await portfolioTracker.waitForDeployment();
    const portfolioTrackerAddress = await portfolioTracker.getAddress();
    deploymentInfo.contracts.PortfolioTracker = portfolioTrackerAddress;
    console.log(`✅ PortfolioTracker deployed to: ${portfolioTrackerAddress}`);

    // Deploy YieldHarvester
    const YieldHarvester = await ethers.getContractFactory("YieldHarvester");
    const yieldHarvester = await YieldHarvester.deploy();
    await yieldHarvester.waitForDeployment();
    const yieldHarvesterAddress = await yieldHarvester.getAddress();
    deploymentInfo.contracts.YieldHarvester = yieldHarvesterAddress;
    console.log(`✅ YieldHarvester deployed to: ${yieldHarvesterAddress}`);

    // Deploy RiskManager
    const RiskManager = await ethers.getContractFactory("RiskManager");
    const riskManager = await RiskManager.deploy();
    await riskManager.waitForDeployment();
    const riskManagerAddress = await riskManager.getAddress();
    deploymentInfo.contracts.RiskManager = riskManagerAddress;
    console.log(`✅ RiskManager deployed to: ${riskManagerAddress}`);

    // Deploy CoreGovernance
    const CoreGovernance = await ethers.getContractFactory("CoreGovernance");
    const coreGovernance = await CoreGovernance.deploy();
    await coreGovernance.waitForDeployment();
    const coreGovernanceAddress = await coreGovernance.getAddress();
    deploymentInfo.contracts.CoreGovernance = coreGovernanceAddress;
    console.log(`✅ CoreGovernance deployed to: ${coreGovernanceAddress}`);

    // Deploy AnalyticsEngine
    const AnalyticsEngine = await ethers.getContractFactory("AnalyticsEngine");
    const analyticsEngine = await AnalyticsEngine.deploy();
    await analyticsEngine.waitForDeployment();
    const analyticsEngineAddress = await analyticsEngine.getAddress();
    deploymentInfo.contracts.AnalyticsEngine = analyticsEngineAddress;
    console.log(`✅ AnalyticsEngine deployed to: ${analyticsEngineAddress}`);

    // Deploy CoreYieldStrategy
    const CoreYieldStrategy = await ethers.getContractFactory("CoreYieldStrategy");
    const coreYieldStrategy = await CoreYieldStrategy.deploy();
    await coreYieldStrategy.waitForDeployment();
    const coreYieldStrategyAddress = await coreYieldStrategy.getAddress();
    deploymentInfo.contracts.CoreYieldStrategy = coreYieldStrategyAddress;
    console.log(`✅ CoreYieldStrategy deployed to: ${coreYieldStrategyAddress}`);

    // Deploy CoreYieldBridge
    const CoreYieldBridge = await ethers.getContractFactory("CoreYieldBridge");
    const coreYieldBridge = await CoreYieldBridge.deploy();
    await coreYieldBridge.waitForDeployment();
    const coreYieldBridgeAddress = await coreYieldBridge.getAddress();
    deploymentInfo.contracts.CoreYieldBridge = coreYieldBridgeAddress;
    console.log(`✅ CoreYieldBridge deployed to: ${coreYieldBridgeAddress}`);

    // Deploy CoreYieldRouter
    const CoreYieldRouter = await ethers.getContractFactory("CoreYieldRouter");
    const coreYieldRouter = await CoreYieldRouter.deploy();
    await coreYieldRouter.waitForDeployment();
    const coreYieldRouterAddress = await coreYieldRouter.getAddress();
    deploymentInfo.contracts.CoreYieldRouter = coreYieldRouterAddress;
    console.log(`✅ CoreYieldRouter deployed to: ${coreYieldRouterAddress}`);
    
    // Initialize router with contract addresses
    await coreYieldRouter.initializeRouter(
      coreStakingAddress,
      coreSwapAMMAddress,
      portfolioTrackerAddress,
      yieldHarvesterAddress,
      riskManagerAddress,
      coreGovernanceAddress,
      analyticsEngineAddress,
      coreYieldStrategyAddress,
      coreYieldBridgeAddress
    );
    console.log("✅ Router initialized with contract addresses");

    // ============================================================================
    // PHASE 3: INITIAL CONFIGURATION
    // ============================================================================
    console.log("\n🎯 PHASE 3: Initial Configuration");
    console.log("-".repeat(50));

    // Seed staking contract with stCORE for rewards
    console.log("🌱 Seeding staking contract with stCORE for rewards...");
    const mintAmount = ethers.parseEther("10000"); // 10,000 stCORE for rewards
    await mockStCORE.mint(coreStakingAddress, mintAmount);
    console.log(`✅ Minted ${ethers.formatEther(mintAmount)} stCORE to staking contract`);

    // Add tokens to PortfolioTracker
    console.log("📊 Adding tokens to PortfolioTracker...");
    await portfolioTracker.addAsset(mockCOREAddress, "CORE", "Core Token", 18, 5, 850); // 8.5% = 850 basis points
    await portfolioTracker.addAsset(mockStCOREAddress, "stCORE", "Staked Core", 18, 5, 850); // 8.5% = 850 basis points
    console.log("✅ Tokens added to PortfolioTracker");

    // Add tokens to RiskManager
    console.log("⚠️ Adding tokens to RiskManager...");
    await riskManager.addAsset(mockCOREAddress);
    await riskManager.addAsset(mockStCOREAddress);
    console.log("✅ Tokens added to RiskManager");

    // Add tokens to AnalyticsEngine
    console.log("📈 Adding tokens to AnalyticsEngine...");
    await analyticsEngine.addAsset(mockCOREAddress);
    await analyticsEngine.addAsset(mockStCOREAddress);
    console.log("✅ Tokens added to AnalyticsEngine");

    // Add tokens to CoreSwapAMM
    console.log("🔄 Adding tokens to CoreSwapAMM...");
    await coreSwapAMM.addSupportedToken(mockCOREAddress);
    await coreSwapAMM.addSupportedToken(mockStCOREAddress);
    console.log("✅ Tokens added to CoreSwapAMM");

    // ============================================================================
    // PHASE 4: AMM POOL CREATION
    // ============================================================================
    console.log("\n🎯 PHASE 4: Creating AMM Pool");
    console.log("-".repeat(50));

    // Create pool with initial liquidity
    console.log("🏊 Creating pool with initial liquidity...");
    // Ensure tokens are in ascending order (token0 < token1)
    const token0 = mockStCOREAddress < mockCOREAddress ? mockStCOREAddress : mockCOREAddress;
    const token1 = mockStCOREAddress < mockCOREAddress ? mockCOREAddress : mockStCOREAddress;
    const initialLiquidity = ethers.parseEther("1000"); // 1000 tokens each
    
    // Mint tokens to deployer for initial liquidity
    await mockStCORE.mint(deployer.address, initialLiquidity);
    await mockCORE.mint(deployer.address, initialLiquidity);
    console.log("✅ Minted tokens for initial liquidity");

    // Approve tokens for AMM (in the correct order)
    const token0Contract = token0 === mockStCOREAddress ? mockStCORE : mockCORE;
    const token1Contract = token1 === mockStCOREAddress ? mockStCORE : mockCORE;
    
    await token0Contract.approve(coreSwapAMMAddress, initialLiquidity);
    await token1Contract.approve(coreSwapAMMAddress, initialLiquidity);
    console.log("✅ Approved tokens for AMM");

    // Create pool first
    await coreSwapAMM.createPool(token0, token1);
    console.log("✅ Pool created");
    
    // Add initial liquidity (must use same token order as pool creation)
    await coreSwapAMM.addLiquidity(
      token0, 
      token1, 
      initialLiquidity, 
      initialLiquidity, 
      0, 
      0
    );
    console.log("✅ Initial liquidity added to pool");
    
    // Log the pool details for verification
    console.log(`📊 Pool created: ${token0} <-> ${token1}`);
    console.log(`💰 Initial liquidity: ${ethers.formatEther(initialLiquidity)} tokens each`);

    // ============================================================================
    // PHASE 5: GOVERNANCE SETUP
    // ============================================================================
    console.log("\n🎯 PHASE 5: Governance Setup");
    console.log("-".repeat(50));

    // Set initial voting power for deployer (CoreGovernance doesn't have setVotingPower, it's set through staking)
    console.log("✅ Voting power will be set through staking");

    // ============================================================================
    // PHASE 6: MARKET STATS UPDATE
    // ============================================================================
    console.log("\n🎯 PHASE 6: Market Stats Update");
    console.log("-".repeat(50));

    // Update market stats (PortfolioTracker doesn't have updateMarketStats, it's handled in addAsset)
    console.log("✅ Market stats set during asset addition");

    // ============================================================================
    // PHASE 7: BRIDGE SETUP
    // ============================================================================
    console.log("\n🎯 PHASE 7: Bridge Setup");
    console.log("-".repeat(50));

    // Add supported chain to bridge
    await coreYieldBridge.addSupportedChain(137, ethers.parseEther("0.1"), ethers.parseEther("1000"), 3600, deployer.address); // Polygon
    await coreYieldBridge.addSupportedChain(1, ethers.parseEther("0.1"), ethers.parseEther("1000"), 3600, deployer.address);  // Ethereum
    console.log("✅ Supported chains added to bridge");

    // ============================================================================
    // PHASE 8: YIELD STRATEGY SETUP
    // ============================================================================
    console.log("\n🎯 PHASE 8: Yield Strategy Setup");
    console.log("-".repeat(50));

    // Create initial yield strategy
    const strategyAssets = [mockStCOREAddress];
    const strategyWeights = [100]; // 100% allocation
    await coreYieldStrategy.createStrategy(
      0, // StrategyType.BuyAndHold
      strategyAssets, 
      strategyWeights, 
      850, // targetAPY (8.5% = 850 basis points)
      5, // riskTolerance
      86400, // rebalanceFrequency (1 day)
      false // autoRebalance
    );
    console.log("✅ Initial yield strategy created");

    // ============================================================================
    // PHASE 9: ROUTER INITIALIZATION
    // ============================================================================
    console.log("\n🎯 PHASE 9: Router Initialization");
    console.log("-".repeat(50));

    // Initialize router with supported tokens
    await coreYieldRouter.addSupportedToken(mockCOREAddress);
    await coreYieldRouter.addSupportedToken(mockStCOREAddress);
    console.log("✅ Supported tokens added to router");

    // Transfer ownership of all contracts to router
    console.log("🔐 Transferring ownership to router...");
    await coreStaking.transferOwnership(coreYieldRouterAddress);
    await coreSwapAMM.transferOwnership(coreYieldRouterAddress);
    await portfolioTracker.transferOwnership(coreYieldRouterAddress);
    await yieldHarvester.transferOwnership(coreYieldRouterAddress);
    await riskManager.transferOwnership(coreYieldRouterAddress);
    await coreGovernance.transferOwnership(coreYieldRouterAddress);
    await analyticsEngine.transferOwnership(coreYieldRouterAddress);
    await coreYieldStrategy.transferOwnership(coreYieldRouterAddress);
    await coreYieldBridge.transferOwnership(coreYieldRouterAddress);
    console.log("✅ Ownership transferred to router");

    // ============================================================================
    // PHASE 10: VERIFICATION & TESTING
    // ============================================================================
    console.log("\n🎯 PHASE 10: Verification & Testing");
    console.log("-".repeat(50));

    // Test basic functionality
    console.log("🧪 Testing basic functionality...");
    
    // Test staking
    const testAmount = ethers.parseEther("100");
    await mockCORE.mint(deployer.address, testAmount);
    await mockCORE.approve(coreYieldRouterAddress, testAmount);
    
    try {
      await coreYieldRouter.stakeAndTrack(testAmount, mockCOREAddress);
      deploymentInfo.testResults.staking = true;
      console.log("✅ Staking test passed");
    } catch (error) {
      deploymentInfo.testResults.staking = false;
      console.log("❌ Staking test failed:", (error as Error).message);
    }

    // Test swapping
    try {
      await mockStCORE.approve(coreYieldRouterAddress, testAmount);
      await coreYieldRouter.swapAndTrack(testAmount, mockStCOREAddress, mockCOREAddress, 500); // 5% slippage
      deploymentInfo.testResults.swapping = true;
      console.log("✅ Swapping test passed");
    } catch (error) {
      deploymentInfo.testResults.swapping = false;
      console.log("❌ Swapping test failed:", (error as Error).message);
    }

    // Test portfolio tracking
    try {
      const portfolio = await coreYieldRouter.getCompletePortfolio(deployer.address);
      deploymentInfo.testResults.portfolioTracking = true;
      console.log("✅ Portfolio tracking test passed");
    } catch (error) {
      deploymentInfo.testResults.portfolioTracking = false;
      console.log("❌ Portfolio tracking test failed:", (error as Error).message);
    }

    // Test emergency functions
    try {
      await coreYieldRouter.emergencyPause();
      await coreYieldRouter.emergencyResume();
      deploymentInfo.testResults.emergencyFunctions = true;
      console.log("✅ Emergency functions test passed");
    } catch (error) {
      deploymentInfo.testResults.emergencyFunctions = false;
      console.log("❌ Emergency functions test failed:", (error as Error).message);
    }

    // ============================================================================
    // PHASE 11: DEPLOYMENT COMPLETE
    // ============================================================================
    console.log("\n🎯 PHASE 11: Deployment Complete");
    console.log("=" .repeat(80));

    console.log("🎉 CoreYield Testnet Deployment Successful!");
    console.log("\n📋 Contract Addresses:");
    console.log(`CoreYieldRouter: ${coreYieldRouterAddress}`);
    console.log(`CoreStaking: ${coreStakingAddress}`);
    console.log(`CoreSwapAMM: ${coreSwapAMMAddress}`);
    console.log(`PortfolioTracker: ${portfolioTrackerAddress}`);
    console.log(`YieldHarvester: ${yieldHarvesterAddress}`);
    console.log(`RiskManager: ${riskManagerAddress}`);
    console.log(`CoreGovernance: ${coreGovernanceAddress}`);
    console.log(`AnalyticsEngine: ${analyticsEngineAddress}`);
    console.log(`CoreYieldStrategy: ${coreYieldStrategyAddress}`);
    console.log(`CoreYieldBridge: ${coreYieldBridgeAddress}`);
    console.log(`MockDualCORE: ${mockCOREAddress}`);
    console.log(`MockStCORE: ${mockStCOREAddress}`);

    // Save deployment info
    const deploymentDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    const filename = `coreyield-testnet2-${Date.now()}.json`;
    const filepath = path.join(deploymentDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n💾 Deployment info saved to: ${filepath}`);

    // ============================================================================
    // PHASE 12: NEXT STEPS
    // ============================================================================
    console.log("\n🎯 PHASE 12: Next Steps");
    console.log("-".repeat(50));
    console.log("1. 🔍 Verify contracts on Core Testnet2 Explorer");
    console.log("2. 🧪 Run comprehensive integration tests");
    console.log("3. 🌐 Update frontend configuration");
    console.log("4. 📱 Test user flows on testnet");
    console.log("5. 🚀 Prepare for mainnet deployment");

    console.log("\n🎊 Deployment completed successfully! 🎊");

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    
    // Save error info
    const deploymentDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    const errorInfo = {
      ...deploymentInfo,
      error: (error as Error).message,
      stack: (error as Error).stack
    };

    const filename = `coreyield-testnet2-error-${Date.now()}.json`;
    const filepath = path.join(deploymentDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(errorInfo, null, 2));
    console.log(`\n💾 Error info saved to: ${filepath}`);
    
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

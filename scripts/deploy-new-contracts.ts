import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy mock tokens FIRST
  console.log("\n=== Deploying Mock Tokens ===");
  const MockCoreToken = await ethers.getContractFactory("MockDualCORE");
  const mockCoreToken = await MockCoreToken.deploy();
  await mockCoreToken.waitForDeployment();
  console.log("Mock CORE token deployed to:", await mockCoreToken.getAddress());
  
  const MockStCoreToken = await ethers.getContractFactory("MockStCORE");
  const mockStCoreToken = await MockStCoreToken.deploy();
  await mockStCoreToken.waitForDeployment();
  console.log("Mock stCORE token deployed to:", await mockStCoreToken.getAddress());

  // Deploy CoreStaking
  console.log("\n=== Deploying CoreStaking ===");
  const CoreStaking = await ethers.getContractFactory("CoreStaking");
  const coreStaking = await CoreStaking.deploy(
    await mockCoreToken.getAddress(), // CORE token address
    await mockStCoreToken.getAddress()  // stCORE token address
  );
  await coreStaking.waitForDeployment();
  console.log("CoreStaking deployed to:", await coreStaking.getAddress());

  // Deploy CoreSwapAMM
  console.log("\n=== Deploying CoreSwapAMM ===");
  const CoreSwapAMM = await ethers.getContractFactory("CoreSwapAMM");
  const coreSwapAMM = await CoreSwapAMM.deploy();
  await coreSwapAMM.waitForDeployment();
  console.log("CoreSwapAMM deployed to:", await coreSwapAMM.getAddress());

  // Deploy PortfolioTracker
  console.log("\n=== Deploying PortfolioTracker ===");
  const PortfolioTracker = await ethers.getContractFactory("PortfolioTracker");
  const portfolioTracker = await PortfolioTracker.deploy();
  await portfolioTracker.waitForDeployment();
  console.log("PortfolioTracker deployed to:", await portfolioTracker.getAddress());

  // Deploy YieldHarvester
  console.log("\n=== Deploying YieldHarvester ===");
  const YieldHarvester = await ethers.getContractFactory("YieldHarvester");
  const yieldHarvester = await YieldHarvester.deploy();
  await yieldHarvester.waitForDeployment();
  console.log("YieldHarvester deployed to:", await yieldHarvester.getAddress());

  // Deploy RiskManager
  console.log("\n=== Deploying RiskManager ===");
  const RiskManager = await ethers.getContractFactory("RiskManager");
  const riskManager = await RiskManager.deploy();
  await riskManager.waitForDeployment();
  console.log("RiskManager deployed to:", await riskManager.getAddress());

  // Deploy CoreGovernance
  console.log("\n=== Deploying CoreGovernance ===");
  const CoreGovernance = await ethers.getContractFactory("CoreGovernance");
  const coreGovernance = await CoreGovernance.deploy();
  await coreGovernance.waitForDeployment();
  console.log("CoreGovernance deployed to:", await coreGovernance.getAddress());

  // Deploy AnalyticsEngine
  console.log("\n=== Deploying AnalyticsEngine ===");
  const AnalyticsEngine = await ethers.getContractFactory("AnalyticsEngine");
  const analyticsEngine = await AnalyticsEngine.deploy();
  await analyticsEngine.waitForDeployment();
  console.log("AnalyticsEngine deployed to:", await analyticsEngine.getAddress());

  // Deploy CoreYieldStrategy
  console.log("\n=== Deploying CoreYieldStrategy ===");
  const CoreYieldStrategy = await ethers.getContractFactory("CoreYieldStrategy");
  const coreYieldStrategy = await CoreYieldStrategy.deploy();
  await coreYieldStrategy.waitForDeployment();
  console.log("CoreYieldStrategy deployed to:", await coreYieldStrategy.getAddress());

  // Seed staking contract with stCORE for rewards
  console.log("Seeding staking contract with stCORE for rewards...");
  await mockStCoreToken.mint(await coreStaking.getAddress(), ethers.parseEther("1000000"));

  // Deploy CoreYieldBridge
  console.log("\n=== Deploying CoreYieldBridge ===");
  const CoreYieldBridge = await ethers.getContractFactory("CoreYieldBridge");
  const coreYieldBridge = await CoreYieldBridge.deploy();
  await coreYieldBridge.waitForDeployment();
  console.log("CoreYieldBridge deployed to:", await coreYieldBridge.getAddress());

  // Deploy CoreYieldRouter
  console.log("\n=== Deploying CoreYieldRouter ===");
  const CoreYieldRouter = await ethers.getContractFactory("CoreYieldRouter");
  const coreYieldRouter = await CoreYieldRouter.deploy();
  await coreYieldRouter.waitForDeployment();
  console.log("CoreYieldRouter deployed to:", await coreYieldRouter.getAddress());

  // Step 1: Add supported tokens to all contracts before transferring ownership
  console.log("\n=== Setting up initial configuration ===");
  
  // Add tokens to PortfolioTracker
  console.log("Adding CORE token to PortfolioTracker...");
  await portfolioTracker.addAsset(
    await mockCoreToken.getAddress(),
    "CORE",
    "Core Token",
    18,
    5, // risk level
    850 // 8.5% APY
  );
  
  console.log("Adding stCORE token to PortfolioTracker...");
  await portfolioTracker.addAsset(
    await mockStCoreToken.getAddress(),
    "stCORE",
    "Staked CORE",
    18,
    5, // risk level
    850 // 8.5% APY
  );
  
  // Add tokens to RiskManager
  console.log("Adding CORE token to RiskManager...");
  await riskManager.addAsset(await mockCoreToken.getAddress());
  
  console.log("Adding stCORE token to RiskManager...");
  await riskManager.addAsset(await mockStCoreToken.getAddress());
  
  // Add tokens to AnalyticsEngine
  console.log("Adding CORE token to AnalyticsEngine...");
  await analyticsEngine.addAsset(await mockCoreToken.getAddress());
  
  console.log("Adding stCORE token to AnalyticsEngine...");
  await analyticsEngine.addAsset(await mockStCoreToken.getAddress());
  
  // Add tokens to CoreSwapAMM
  console.log("Adding CORE token to CoreSwapAMM...");
  await coreSwapAMM.addSupportedToken(await mockCoreToken.getAddress());
  
  console.log("Adding stCORE token to CoreSwapAMM...");
  await coreSwapAMM.addSupportedToken(await mockStCoreToken.getAddress());
  
  // Step 2: Create AMM pool and seed initial liquidity
  console.log("\n=== Creating AMM pool and seeding liquidity ===");
  
  // Ensure proper token ordering (token0 < token1)
  let token0 = await mockCoreToken.getAddress();
  let token1 = await mockStCoreToken.getAddress();
  if (token0 > token1) {
    [token0, token1] = [token1, token0];
  }
  
  console.log("Creating pool with tokens:", token0, token1);
  await coreSwapAMM.createPool(token0, token1);
  
  // Mint tokens to deployer for initial liquidity
  console.log("Minting tokens to deployer for initial liquidity...");
  await mockCoreToken.mint(deployer.address, ethers.parseEther("10000"));
  await mockStCoreToken.mint(deployer.address, ethers.parseEther("10000"));
  
  // Approve tokens for AMM
  console.log("Approving tokens for AMM...");
  await mockCoreToken.approve(await coreSwapAMM.getAddress(), ethers.parseEther("5000"));
  await mockStCoreToken.approve(await coreSwapAMM.getAddress(), ethers.parseEther("5000"));
  
  // Add initial liquidity
  console.log("Adding initial liquidity to pool...");
  await coreSwapAMM.addLiquidity(
    token0,
    token1,
    ethers.parseEther("1000"),
    ethers.parseEther("1000"),
    0,
    0
  );
  
  // Step 3: Set up governance voting power
  console.log("\n=== Setting up governance ===");
  await coreGovernance.updateVotingPower(deployer.address, 1000);
  
  // Step 4: Update market stats
  console.log("\n=== Updating market stats ===");
  await analyticsEngine.updateMarketStats(
    await mockCoreToken.getAddress(),
    1000000, // TVL
    1000000, // Volume
    850,     // APY
    5        // Risk level
  );
  
  // Step 5: Add supported chain for bridge
  console.log("\n=== Setting up bridge ===");
  await coreYieldBridge.addSupportedChain(
    137, // Polygon
    0,   // Chain type
    ethers.parseEther("1000000000"), // Max amount
    0,   // Min amount
    deployer.address // Bridge operator
  );
  
  // Step 6: Create yield strategy
  console.log("\n=== Creating yield strategy ===");
  await yieldHarvester.createYieldStrategy(
    await mockCoreToken.getAddress(),
    1000, // harvest threshold
    500   // auto-compound threshold
  );

  // Initialize the router with all contract addresses
  console.log("\n=== Initializing CoreYieldRouter ===");
  await coreYieldRouter.initializeRouter(
    await coreStaking.getAddress(),
    await coreSwapAMM.getAddress(),
    await portfolioTracker.getAddress(),
    await yieldHarvester.getAddress(),
    await riskManager.getAddress(),
    await coreGovernance.getAddress(),
    await analyticsEngine.getAddress(),
    await coreYieldStrategy.getAddress(),
    await coreYieldBridge.getAddress()
  );

  // Step 7: Add supported tokens to router
  console.log("\n=== Adding supported tokens to router ===");
  await coreYieldRouter.addSupportedToken(await mockCoreToken.getAddress());
  await coreYieldRouter.addSupportedToken(await mockStCoreToken.getAddress());
  
  // Step 8: Transfer ownership of managed contracts to router
  console.log("\n=== Transferring ownership to router ===");
  console.log("Transferring CoreStaking ownership...");
  await coreStaking.transferOwnership(await coreYieldRouter.getAddress());
  
  console.log("Transferring CoreSwapAMM ownership...");
  await coreSwapAMM.transferOwnership(await coreYieldRouter.getAddress());
  
  console.log("Transferring PortfolioTracker ownership...");
  await portfolioTracker.transferOwnership(await coreYieldRouter.getAddress());
  
  console.log("Transferring YieldHarvester ownership...");
  await yieldHarvester.transferOwnership(await coreYieldRouter.getAddress());
  
  console.log("Transferring RiskManager ownership...");
  await riskManager.transferOwnership(await coreYieldRouter.getAddress());
  
  console.log("Transferring CoreGovernance ownership...");
  await coreGovernance.transferOwnership(await coreYieldRouter.getAddress());
  
  console.log("Transferring AnalyticsEngine ownership...");
  await analyticsEngine.transferOwnership(await coreYieldRouter.getAddress());
  
  console.log("Transferring CoreYieldStrategy ownership...");
  await coreYieldStrategy.transferOwnership(await coreYieldRouter.getAddress());
  
  console.log("Transferring CoreYieldBridge ownership...");
  await coreYieldBridge.transferOwnership(await coreYieldRouter.getAddress());

  console.log("\n=== Deployment Complete! ===");
  console.log("CoreYieldRouter:", await coreYieldRouter.getAddress());
  console.log("CoreStaking:", await coreStaking.getAddress());
  console.log("CoreSwapAMM:", await coreSwapAMM.getAddress());
  console.log("PortfolioTracker:", await portfolioTracker.getAddress());
  console.log("YieldHarvester:", await yieldHarvester.getAddress());
  console.log("RiskManager:", await riskManager.getAddress());
  console.log("CoreGovernance:", await coreGovernance.getAddress());
  console.log("AnalyticsEngine:", await analyticsEngine.getAddress());
  console.log("CoreYieldStrategy:", await coreYieldStrategy.getAddress());
  console.log("CoreYieldBridge:", await coreYieldBridge.getAddress());
  console.log("\n=== Initial Setup Complete ===");
  console.log("✅ Supported tokens added to all contracts");
  console.log("✅ AMM pool created with initial liquidity");
  console.log("✅ Governance voting power set");
  console.log("✅ Market stats updated");
  console.log("✅ Bridge chain added");
  console.log("✅ Yield strategy created");
  console.log("✅ Router initialized and ownership transferred");

  // Save deployment addresses
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    network: network.name,
    timestamp: new Date().toISOString(),
    contracts: {
      coreYieldRouter: await coreYieldRouter.getAddress(),
      coreStaking: await coreStaking.getAddress(),
      coreSwapAMM: await coreSwapAMM.getAddress(),
      portfolioTracker: await portfolioTracker.getAddress(),
      yieldHarvester: await yieldHarvester.getAddress(),
      riskManager: await riskManager.getAddress(),
      coreGovernance: await coreGovernance.getAddress(),
      analyticsEngine: await analyticsEngine.getAddress(),
      coreYieldStrategy: await coreYieldStrategy.getAddress(),
      coreYieldBridge: await coreYieldBridge.getAddress(),
      mockCoreToken: await mockCoreToken.getAddress(),
      mockStCoreToken: await mockStCoreToken.getAddress()
    }
  };

  // Save to file
  const fs = require("fs");
  const deploymentPath = `deployments/coreyield-${network.name}-${Date.now()}.json`;
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment info saved to: ${deploymentPath}`);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

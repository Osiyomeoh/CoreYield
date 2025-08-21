import { ethers } from "hardhat";
import { writeFileSync } from "fs";
import { join } from "path";

async function main() {
  console.log("🚀 Deploying Enhanced CoreYield PT/YT Contracts to Testnet...");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Deploy mock tokens
  console.log("\n📦 Deploying mock tokens...");
  const MockDualCORE = await ethers.getContractFactory("MockDualCORE");
  const dualCore = await MockDualCORE.deploy();
  await dualCore.waitForDeployment();
  const dualCoreAddr = await dualCore.getAddress();
  console.log("DualCORE:", dualCoreAddr);

  const MockStCORE = await ethers.getContractFactory("MockStCORE");
  const stCore = await MockStCORE.deploy();
  await stCore.waitForDeployment();
  const stCoreAddr = await stCore.getAddress();
  console.log("stCORE:", stCoreAddr);

  const MockLstBTC = await ethers.getContractFactory("MockLstBTC");
  const lstBTC = await MockLstBTC.deploy();
  await lstBTC.waitForDeployment();
  const lstBTCAddr = await lstBTC.getAddress();
  console.log("lstBTC:", lstBTCAddr);

  // Mint some tokens to deployer for testing
  const mintAmount = ethers.parseEther("1000000");
  const mintAmountBTC = ethers.parseUnits("1000", 8); // BTC has 8 decimals
  await (await dualCore.mint(deployer.address, mintAmount)).wait();
  await (await stCore.mint(deployer.address, mintAmount)).wait();
  await (await lstBTC.mint(deployer.address, mintAmountBTC)).wait();
  console.log("Minted test balances");

  // Deploy CoreYieldMarketFactory
  console.log("\n🏗️ Deploying CoreYieldMarketFactory...");
  const CoreYieldMarketFactory = await ethers.getContractFactory("CoreYieldMarketFactory");
  const marketFactory = await CoreYieldMarketFactory.deploy();
  await marketFactory.waitForDeployment();
  const marketFactoryAddr = await marketFactory.getAddress();
  console.log("CoreYieldMarketFactory:", marketFactoryAddr);

  // Deploy CoreYieldTokenOperations
  console.log("\n⚙️ Deploying CoreYieldTokenOperations...");
  const CoreYieldTokenOperations = await ethers.getContractFactory("CoreYieldTokenOperations");
  const tokenOperations = await CoreYieldTokenOperations.deploy();
  await tokenOperations.waitForDeployment();
  const tokenOperationsAddr = await tokenOperations.getAddress();
  console.log("CoreYieldTokenOperations:", tokenOperationsAddr);

  // Deploy CoreYieldAnalytics
  console.log("\n📊 Deploying CoreYieldAnalytics...");
  const CoreYieldAnalytics = await ethers.getContractFactory("CoreYieldAnalytics");
  const analytics = await CoreYieldAnalytics.deploy();
  await analytics.waitForDeployment();
  const analyticsAddr = await analytics.getAddress();
  console.log("CoreYieldAnalytics:", analyticsAddr);

  // Deploy CoreYieldAMM
  console.log("\n🔄 Deploying CoreYieldAMM...");
  const CoreYieldAMM = await ethers.getContractFactory("CoreYieldAMM");
  const coreYieldAMM = await CoreYieldAMM.deploy();
  await coreYieldAMM.waitForDeployment();
  const ammAddr = await coreYieldAMM.getAddress();
  console.log("CoreYieldAMM:", ammAddr);

  // Deploy CoreStaking
  console.log("\n🔒 Deploying CoreStaking...");
  const CoreStaking = await ethers.getContractFactory("CoreStaking");
  const coreStaking = await CoreStaking.deploy(
    dualCoreAddr,
    stCoreAddr
  );
  await coreStaking.waitForDeployment();
  const stakingAddr = await coreStaking.getAddress();
  console.log("CoreStaking:", stakingAddr);

  // Deploy PortfolioTracker
  console.log("\n📈 Deploying PortfolioTracker...");
  const PortfolioTracker = await ethers.getContractFactory("PortfolioTracker");
  const portfolioTracker = await PortfolioTracker.deploy();
  await portfolioTracker.waitForDeployment();
  const portfolioAddr = await portfolioTracker.getAddress();
  console.log("PortfolioTracker:", portfolioAddr);

  // Deploy YieldHarvester
  console.log("\n🌾 Deploying YieldHarvester...");
  const YieldHarvester = await ethers.getContractFactory("YieldHarvester");
  const yieldHarvester = await YieldHarvester.deploy();
  await yieldHarvester.waitForDeployment();
  const harvesterAddr = await yieldHarvester.getAddress();
  console.log("YieldHarvester:", harvesterAddr);

  // Deploy RiskManager
  console.log("\n⚠️ Deploying RiskManager...");
  const RiskManager = await ethers.getContractFactory("RiskManager");
  const riskManager = await RiskManager.deploy();
  await riskManager.waitForDeployment();
  const riskAddr = await riskManager.getAddress();
  console.log("RiskManager:", riskAddr);

  // Deploy CoreGovernance
  console.log("\n🗳️ Deploying CoreGovernance...");
  const CoreGovernance = await ethers.getContractFactory("CoreGovernance");
  const coreGovernance = await CoreGovernance.deploy();
  await coreGovernance.waitForDeployment();
  const governanceAddr = await coreGovernance.getAddress();
  console.log("CoreGovernance:", governanceAddr);

  // Deploy AnalyticsEngine
  console.log("\n📊 Deploying AnalyticsEngine...");
  const AnalyticsEngine = await ethers.getContractFactory("AnalyticsEngine");
  const analyticsEngine = await AnalyticsEngine.deploy();
  await analyticsEngine.waitForDeployment();
  const analyticsEngineAddr = await analyticsEngine.getAddress();
  console.log("AnalyticsEngine:", analyticsEngineAddr);

  // Deploy CoreYieldStrategy
  console.log("\n🎯 Deploying CoreYieldStrategy...");
  const CoreYieldStrategy = await ethers.getContractFactory("CoreYieldStrategy");
  const coreYieldStrategy = await CoreYieldStrategy.deploy();
  await coreYieldStrategy.waitForDeployment();
  const strategyAddr = await coreYieldStrategy.getAddress();
  console.log("CoreYieldStrategy:", strategyAddr);

  // Deploy CoreYieldBridge
  console.log("\n🌉 Deploying CoreYieldBridge...");
  const CoreYieldBridge = await ethers.getContractFactory("CoreYieldBridge");
  const coreYieldBridge = await CoreYieldBridge.deploy();
  await coreYieldBridge.waitForDeployment();
  const bridgeAddr = await coreYieldBridge.getAddress();
  console.log("CoreYieldBridge:", bridgeAddr);

  // Deploy CoreYieldRouter
  console.log("\n🔄 Deploying CoreYieldRouter...");
  const CoreYieldRouter = await ethers.getContractFactory("CoreYieldRouter");
  const coreYieldRouter = await CoreYieldRouter.deploy();
  await coreYieldRouter.waitForDeployment();
  const routerAddr = await coreYieldRouter.getAddress();
  console.log("CoreYieldRouter:", routerAddr);

  // Configure contracts
  console.log("\n🔧 Configuring contracts...");
  
  // Set token operations in market factory
  await (await marketFactory.setTokenOperations(tokenOperationsAddr)).wait();
  console.log("Set token operations in market factory");

  // Set market factory in token operations
  await (await tokenOperations.setMarketFactory(marketFactoryAddr)).wait();
  console.log("Set market factory in token operations");

  // Set analytics in AMM
  await (await coreYieldAMM.setAnalytics(analyticsAddr)).wait();
  console.log("Set analytics in AMM");

  // Set contracts in analytics
  await (await analytics.setContracts(marketFactoryAddr, tokenOperationsAddr)).wait();
  console.log("Set contracts in analytics");

  // Initialize router
  await (await coreYieldRouter.initializeRouter(
    dualCoreAddr,
    stCoreAddr,
    stakingAddr,
    ammAddr,
    portfolioAddr,
    harvesterAddr,
    riskAddr,
    governanceAddr,
    analyticsEngineAddr,
    strategyAddr,
    bridgeAddr
  )).wait();
  console.log("Initialized router");

  // Create markets
  console.log("\n🎯 Creating markets...");
  const latestBlock = await ethers.provider.getBlock('latest');
  const chainNow = Number(latestBlock?.timestamp || Math.floor(Date.now() / 1000));
  const oneYear = 365 * 24 * 60 * 60;
  const maturityTime = chainNow + oneYear + 3600; // +1y +1h buffer

  // Create dualCORE market
  console.log("Creating dualCORE market...");
  await (await marketFactory.createMarket(
    dualCoreAddr,
    "Standardized Yield dualCORE",
    "SY-dualCORE",
    maturityTime,
    1500 // 15% APY bps
  )).wait();

  let marketDual = await marketFactory.getMarketByUnderlying(dualCoreAddr);
  console.log("dualCORE market SY:", marketDual.syToken);
  console.log("dualCORE market PT:", marketDual.ptToken);
  console.log("dualCORE market YT:", marketDual.ytToken);

  // Create stCORE market
  console.log("Creating stCORE market...");
  await (await marketFactory.createMarket(
    stCoreAddr,
    "Standardized Yield stCORE",
    "SY-stCORE",
    maturityTime,
    850 // 8.5% APY bps
  )).wait();

  let marketSt = await marketFactory.getMarketByUnderlying(stCoreAddr);
  console.log("stCORE market SY:", marketSt.syToken);
  console.log("stCORE market PT:", marketSt.ptToken);
  console.log("stCORE market YT:", marketSt.ytToken);

  // Create lstBTC market
  console.log("Creating lstBTC market...");
  await (await marketFactory.createMarket(
    lstBTCAddr,
    "Standardized Yield lstBTC",
    "SY-lstBTC",
    maturityTime,
    1200 // 12% APY bps
  )).wait();

  let marketBTC = await marketFactory.getMarketByUnderlying(lstBTCAddr);
  console.log("lstBTC market SY:", marketBTC.syToken);
  console.log("lstBTC market PT:", marketBTC.ptToken);
  console.log("lstBTC market YT:", marketBTC.ytToken);

  // Create AMM pools
  console.log("\n🏊 Creating AMM pools...");
  
  // Create yield pools for PT/YT
  await (await coreYieldAMM.createPool(marketDual.ptToken, marketDual.ytToken, true)).wait();
  console.log("Created PT/YT pool for dualCORE");
  
  await (await coreYieldAMM.createPool(marketSt.ptToken, marketSt.ytToken, true)).wait();
  console.log("Created PT/YT pool for stCORE");
  
  await (await coreYieldAMM.createPool(marketBTC.ptToken, marketBTC.ytToken, true)).wait();
  console.log("Created PT/YT pool for lstBTC");

  // Create cross-asset pools
  await (await coreYieldAMM.createPool(dualCoreAddr, stCoreAddr, false)).wait();
  console.log("Created CORE/stCORE pool");
  
  await (await coreYieldAMM.createPool(dualCoreAddr, lstBTCAddr, false)).wait();
  console.log("Created CORE/lstBTC pool");

  // Seed staking contract
  console.log("\n🌱 Seeding staking contract...");
  await (await stCore.mint(stakingAddr, mintAmount)).wait();
  console.log("Seeded staking contract with stCORE");

  // Add supported tokens to portfolio tracker
  console.log("\n📊 Adding supported tokens to portfolio tracker...");
  await (await portfolioTracker.addAsset(dualCoreAddr, "CORE", "Mock Dual CORE", 18, 3, 1500)).wait();
  await (await portfolioTracker.addAsset(stCoreAddr, "stCORE", "Mock Staked CORE", 18, 2, 850)).wait();
  await (await portfolioTracker.addAsset(lstBTCAddr, "lstBTC", "Mock Liquid Staked BTC", 8, 4, 1200)).wait();
  await (await portfolioTracker.addAsset(marketDual.syToken, "SY-dualCORE", "Standardized Yield dualCORE", 18, 3, 1500)).wait();
  await (await portfolioTracker.addAsset(marketDual.ptToken, "PT-dualCORE", "Principal Token dualCORE", 18, 1, 0)).wait();
  await (await portfolioTracker.addAsset(marketDual.ytToken, "YT-dualCORE", "Yield Token dualCORE", 18, 5, 1500)).wait();
  await (await portfolioTracker.addAsset(marketSt.syToken, "SY-stCORE", "Standardized Yield stCORE", 18, 2, 850)).wait();
  await (await portfolioTracker.addAsset(marketSt.ptToken, "PT-stCORE", "Principal Token stCORE", 18, 1, 0)).wait();
  await (await portfolioTracker.addAsset(marketSt.ytToken, "YT-stCORE", "Yield Token stCORE", 18, 4, 850)).wait();
  await (await portfolioTracker.addAsset(marketBTC.syToken, "SY-lstBTC", "Standardized Yield lstBTC", 8, 4, 1200)).wait();
  await (await portfolioTracker.addAsset(marketBTC.ptToken, "PT-lstBTC", "Principal Token lstBTC", 8, 1, 0)).wait();
  await (await portfolioTracker.addAsset(marketBTC.ytToken, "YT-lstBTC", "Yield Token lstBTC", 8, 6, 1200)).wait();
  console.log("Added all supported tokens to portfolio tracker");

  // Transfer ownership of key contracts to router
  console.log("\n🔑 Transferring ownership to router...");
  await (await marketFactory.transferOwnership(routerAddr)).wait();
  await (await tokenOperations.transferOwnership(routerAddr)).wait();
  await (await analytics.transferOwnership(routerAddr)).wait();
  await (await coreYieldAMM.transferOwnership(routerAddr)).wait();
  await (await coreStaking.transferOwnership(routerAddr)).wait();
  await (await portfolioTracker.transferOwnership(routerAddr)).wait();
  await (await yieldHarvester.transferOwnership(routerAddr)).wait();
  await (await riskManager.transferOwnership(routerAddr)).wait();
  await (await coreGovernance.transferOwnership(routerAddr)).wait();
  await (await analyticsEngine.transferOwnership(routerAddr)).wait();
  await (await coreYieldStrategy.transferOwnership(routerAddr)).wait();
  await (await coreYieldBridge.transferOwnership(routerAddr)).wait();
  console.log("Transferred ownership of all contracts to router");

  // Save deployment info
  const deployment = {
    network: "coreTestnet2",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      MockDualCORE: dualCoreAddr,
      MockStCORE: stCoreAddr,
      MockLstBTC: lstBTCAddr,
      CoreYieldMarketFactory: marketFactoryAddr,
      CoreYieldTokenOperations: tokenOperationsAddr,
      CoreYieldAnalytics: analyticsAddr,
      CoreYieldAMM: ammAddr,
      CoreStaking: stakingAddr,
      PortfolioTracker: portfolioAddr,
      YieldHarvester: harvesterAddr,
      RiskManager: riskAddr,
      CoreGovernance: governanceAddr,
      AnalyticsEngine: analyticsEngineAddr,
      CoreYieldStrategy: strategyAddr,
      CoreYieldBridge: bridgeAddr,
      CoreYieldRouter: routerAddr
    },
    markets: {
      dualCORE: {
        underlying: dualCoreAddr,
        syToken: marketDual.syToken,
        ptToken: marketDual.ptToken,
        ytToken: marketDual.ytToken,
        maturity: maturityTime
      },
      stCORE: {
        underlying: stCoreAddr,
        syToken: marketSt.syToken,
        ptToken: marketSt.ptToken,
        ytToken: marketSt.ytToken,
        maturity: maturityTime
      },
      lstBTC: {
        underlying: lstBTCAddr,
        syToken: marketBTC.syToken,
        ptToken: marketBTC.ptToken,
        ytToken: marketBTC.ytToken,
        maturity: maturityTime
      }
    },
    verification: {},
    testResults: {
      staking: false,
      swapping: false,
      portfolioTracking: false,
      emergencyFunctions: false
    }
  };

  const deploymentPath = join(__dirname, "..", "deployments", `coreyield-testnet2-${Date.now()}.json`);
  writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log(`\n📄 Deployment info saved to: ${deploymentPath}`);

  console.log("\n✅ Enhanced CoreYield PT/YT system deployed successfully!");
  console.log("\n🔗 Contract Addresses:");
  console.log("Router:", routerAddr);
  console.log("Market Factory:", marketFactoryAddr);
  console.log("Token Operations:", tokenOperationsAddr);
  console.log("Analytics:", analyticsAddr);
  console.log("AMM:", ammAddr);
  console.log("Staking:", stakingAddr);
  console.log("Portfolio Tracker:", portfolioAddr);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

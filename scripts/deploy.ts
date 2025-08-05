// scripts/deploy.ts
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

interface DeploymentResult {
  network: any;
  deployer: string;
  timestamp: string;
  contracts: {
    mockStCORE: string;
    mockLstBTC: string;
    mockDualCORE: string;
    syStCORE: string;
    syLstBTC: string;
    syDualCORE: string;
    factory: string;
  };
  markets: {
    stCOREMarketId: string;
    lstBTCMarketId: string;
    dualCOREMarketId: string;
  };
  gasUsed: {
    total: bigint;
    mockAssets: bigint;
    syTokens: bigint;
    factory: bigint;
    markets: bigint;
  };
}

async function main(): Promise<DeploymentResult> {
  console.log("🚀 Deploying CoreYield Protocol to Core Testnet2...");
  console.log("=" .repeat(60));
  
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const initialBalance = await ethers.provider.getBalance(deployer.address);
  
  console.log("📊 Deployment Info:");
  console.log("  Network:", network.name, `(Chain ID: ${network.chainId})`);
  console.log("  Deployer:", deployer.address);
  console.log("  Initial Balance:", ethers.formatEther(initialBalance), "CORE");
  console.log("  Timestamp:", new Date().toISOString());
  console.log("");

  // Initialize gas tracking
  let totalGasUsed = 0n;
  let mockAssetsGas = 0n;
  let syTokensGas = 0n;
  let factoryGas = 0n;
  let marketsGas = 0n;

  // ===========================================
  // PHASE 1: DEPLOY MOCK ASSETS
  // ===========================================
  console.log("📦 Phase 1: Deploying Mock Assets...");
  console.log("-".repeat(40));

  // Deploy MockStCORE
  console.log("  ⏳ Deploying MockStCORE (8.5% APY)...");
  const MockStCORE = await ethers.getContractFactory("MockStCORE");
  const mockStCORE = await MockStCORE.deploy();
  await mockStCORE.waitForDeployment();
  const mockStCOREReceipt = await ethers.provider.getTransactionReceipt(mockStCORE.deploymentTransaction()!.hash);
  mockAssetsGas += mockStCOREReceipt!.gasUsed;
  console.log("  ✅ MockStCORE deployed:", await mockStCORE.getAddress());
  console.log("     Gas used:", mockStCOREReceipt!.gasUsed.toString());

  // Deploy MockLstBTC  
  console.log("  ⏳ Deploying MockLstBTC (4.2% APY)...");
  const MockLstBTC = await ethers.getContractFactory("MockLstBTC");
  const mockLstBTC = await MockLstBTC.deploy();
  await mockLstBTC.waitForDeployment();
  const mockLstBTCReceipt = await ethers.provider.getTransactionReceipt(mockLstBTC.deploymentTransaction()!.hash);
  mockAssetsGas += mockLstBTCReceipt!.gasUsed;
  console.log("  ✅ MockLstBTC deployed:", await mockLstBTC.getAddress());
  console.log("     Gas used:", mockLstBTCReceipt!.gasUsed.toString());

  // Deploy MockDualCORE
  console.log("  ⏳ Deploying MockDualCORE (12.1% APY)...");
  const MockDualCORE = await ethers.getContractFactory("MockDualCORE");
  const mockDualCORE = await MockDualCORE.deploy();
  await mockDualCORE.waitForDeployment();
  const mockDualCOREReceipt = await ethers.provider.getTransactionReceipt(mockDualCORE.deploymentTransaction()!.hash);
  mockAssetsGas += mockDualCOREReceipt!.gasUsed;
  console.log("  ✅ MockDualCORE deployed:", await mockDualCORE.getAddress());
  console.log("     Gas used:", mockDualCOREReceipt!.gasUsed.toString());

  console.log("  📊 Mock Assets Phase Complete - Total Gas:", mockAssetsGas.toString());
  console.log("");

  // ===========================================
  // PHASE 2: DEPLOY SY TOKENS
  // ===========================================
  console.log("🔄 Phase 2: Deploying Standardized Yield Tokens...");
  console.log("-".repeat(40));

  const StandardizedYieldToken = await ethers.getContractFactory("StandardizedYieldToken");

  // Deploy SY-stCORE
  console.log("  ⏳ Deploying SY-stCORE...");
  const syStCORE = await StandardizedYieldToken.deploy(
    "SY-stCORE",
    "SY-stCORE",
    await mockStCORE.getAddress(),
    850 // 8.5% APY
  );
  await syStCORE.waitForDeployment();
  const syStCOREReceipt = await ethers.provider.getTransactionReceipt(syStCORE.deploymentTransaction()!.hash);
  syTokensGas += syStCOREReceipt!.gasUsed;
  console.log("  ✅ SY-stCORE deployed:", await syStCORE.getAddress());
  console.log("     Underlying asset:", await mockStCORE.getAddress());
  console.log("     APY:", "8.5%");

  // Deploy SY-lstBTC
  console.log("  ⏳ Deploying SY-lstBTC...");
  const syLstBTC = await StandardizedYieldToken.deploy(
    "SY-lstBTC",
    "SY-lstBTC",
    await mockLstBTC.getAddress(),
    420 // 4.2% APY
  );
  await syLstBTC.waitForDeployment();
  const syLstBTCReceipt = await ethers.provider.getTransactionReceipt(syLstBTC.deploymentTransaction()!.hash);
  syTokensGas += syLstBTCReceipt!.gasUsed;
  console.log("  ✅ SY-lstBTC deployed:", await syLstBTC.getAddress());
  console.log("     Underlying asset:", await mockLstBTC.getAddress());
  console.log("     APY:", "4.2%");

  // Deploy SY-dualCORE
  console.log("  ⏳ Deploying SY-dualCORE...");
  const syDualCORE = await StandardizedYieldToken.deploy(
    "SY-dualCORE",
    "SY-dualCORE",
    await mockDualCORE.getAddress(),
    1210 // 12.1% APY
  );
  await syDualCORE.waitForDeployment();
  const syDualCOREReceipt = await ethers.provider.getTransactionReceipt(syDualCORE.deploymentTransaction()!.hash);
  syTokensGas += syDualCOREReceipt!.gasUsed;
  console.log("  ✅ SY-dualCORE deployed:", await syDualCORE.getAddress());
  console.log("     Underlying asset:", await mockDualCORE.getAddress());
  console.log("     APY:", "12.1%");

  console.log("  📊 SY Tokens Phase Complete - Total Gas:", syTokensGas.toString());
  console.log("");

  // ===========================================
  // PHASE 3: DEPLOY FACTORY
  // ===========================================
  console.log("🏭 Phase 3: Deploying CoreYield Factory...");
  console.log("-".repeat(40));

  console.log("  ⏳ Deploying CoreYieldFactory...");
  const CoreYieldFactory = await ethers.getContractFactory("CoreYieldFactory");
  const factory = await CoreYieldFactory.deploy(deployer.address);
  await factory.waitForDeployment();
  const factoryReceipt = await ethers.provider.getTransactionReceipt(factory.deploymentTransaction()!.hash);
  factoryGas += factoryReceipt!.gasUsed;
  console.log("  ✅ CoreYieldFactory deployed:", await factory.getAddress());
  console.log("     Fee recipient:", deployer.address);
  console.log("     Gas used:", factoryReceipt!.gasUsed.toString());
  console.log("");

  // ===========================================
  // PHASE 4: CREATE MARKETS
  // ===========================================
  console.log("🏪 Phase 4: Creating Yield Tokenization Markets...");
  console.log("-".repeat(40));

  // Create stCORE Market (6 months)
  console.log("  ⏳ Creating stCORE Market (6 months maturity)...");
  const stCOREMarketTx = await factory.createMarket(
    await syStCORE.getAddress(),
    180 * 24 * 60 * 60, // 6 months in seconds
    "PT-stCORE-6M",
    "PT-stCORE",
    "YT-stCORE-6M", 
    "YT-stCORE"
  );
  const stCOREReceipt = await stCOREMarketTx.wait();
  marketsGas += stCOREReceipt!.gasUsed;
  
  let stCOREMarketId = "";
  if (stCOREReceipt?.logs) {
    for (const log of stCOREReceipt.logs) {
      try {
        const parsedLog = factory.interface.parseLog(log);
        if (parsedLog?.name === "MarketCreated") {
          stCOREMarketId = parsedLog.args.marketId;
          break;
        }
      } catch {
        continue;
      }
    }
  }
  console.log("  ✅ stCORE Market created:", stCOREMarketId);
  console.log("     Maturity: 6 months");

  // Create lstBTC Market (1 year)
  console.log("  ⏳ Creating lstBTC Market (1 year maturity)...");
  const lstBTCMarketTx = await factory.createMarket(
    await syLstBTC.getAddress(),
    365 * 24 * 60 * 60, // 1 year in seconds
    "PT-lstBTC-1Y",
    "PT-lstBTC", 
    "YT-lstBTC-1Y",
    "YT-lstBTC"
  );
  const lstBTCReceipt = await lstBTCMarketTx.wait();
  marketsGas += lstBTCReceipt!.gasUsed;
  
  let lstBTCMarketId = "";
  if (lstBTCReceipt?.logs) {
    for (const log of lstBTCReceipt.logs) {
      try {
        const parsedLog = factory.interface.parseLog(log);
        if (parsedLog?.name === "MarketCreated") {
          lstBTCMarketId = parsedLog.args.marketId;
          break;
        }
      } catch {
        continue;
      }
    }
  }
  console.log("  ✅ lstBTC Market created:", lstBTCMarketId);
  console.log("     Maturity: 1 year");

  // Create dualCORE Market (3 months)
  console.log("  ⏳ Creating dualCORE Market (3 months maturity)...");
  const dualCOREMarketTx = await factory.createMarket(
    await syDualCORE.getAddress(),
    90 * 24 * 60 * 60, // 3 months in seconds
    "PT-dualCORE-3M",
    "PT-dualCORE",
    "YT-dualCORE-3M", 
    "YT-dualCORE"
  );
  const dualCOREReceipt = await dualCOREMarketTx.wait();
  marketsGas += dualCOREReceipt!.gasUsed;
  
  let dualCOREMarketId = "";
  if (dualCOREReceipt?.logs) {
    for (const log of dualCOREReceipt.logs) {
      try {
        const parsedLog = factory.interface.parseLog(log);
        if (parsedLog?.name === "MarketCreated") {
          dualCOREMarketId = parsedLog.args.marketId;
          break;
        }
      } catch {
        continue;
      }
    }
  }
  console.log("  ✅ dualCORE Market created:", dualCOREMarketId);
  console.log("     Maturity: 3 months");

  console.log("  📊 Markets Phase Complete - Total Gas:", marketsGas.toString());
  console.log("");

  // ===========================================
  // PHASE 5: VERIFICATION & SUMMARY
  // ===========================================
  console.log("🔍 Phase 5: Verification & Testing...");
  console.log("-".repeat(40));

  // Test basic functionality
  console.log("  🧪 Testing basic protocol functionality...");
  
  // Check initial balances
  const ownerStCOREBalance = await mockStCORE.balanceOf(deployer.address);
  console.log("  📊 Initial stCORE balance:", ethers.formatEther(ownerStCOREBalance));

  // Test small wrap operation
  const testAmount = ethers.parseEther("100");
  await mockStCORE.approve(await syStCORE.getAddress(), testAmount);
  await syStCORE.wrap(testAmount);
  
  const syBalance = await syStCORE.balanceOf(deployer.address);
  console.log("  ✅ Test wrap successful - SY balance:", ethers.formatEther(syBalance));

  // Get protocol stats
  const protocolStats = await factory.getProtocolStats();
  console.log("  📈 Protocol Statistics:");
  console.log("     Total Markets:", protocolStats.totalMarkets.toString());
  console.log("     Active Markets:", protocolStats.activeMarkets.toString());
  console.log("     TVL:", ethers.formatEther(protocolStats.totalValueLocked), "tokens");

  // Calculate final costs
  totalGasUsed = mockAssetsGas + syTokensGas + factoryGas + marketsGas;
  const finalBalance = await ethers.provider.getBalance(deployer.address);
  const deploymentCost = initialBalance - finalBalance;

  console.log("");
  console.log("🎉 COREYIELD PROTOCOL DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("");
  console.log("📋 DEPLOYMENT SUMMARY:");
  console.log("  Network:", network.name, `(Chain ID: ${network.chainId})`);
  console.log("  Deployer:", deployer.address);
  console.log("  Deployment Cost:", ethers.formatEther(deploymentCost), "CORE");
  console.log("  Total Gas Used:", totalGasUsed.toString());
  console.log("");
  console.log("📦 DEPLOYED CONTRACTS:");
  console.log("  Mock Assets:");
  console.log("    MockStCORE:", await mockStCORE.getAddress());
  console.log("    MockLstBTC:", await mockLstBTC.getAddress());
  console.log("    MockDualCORE:", await mockDualCORE.getAddress());
  console.log("  SY Tokens:");
  console.log("    SY-stCORE:", await syStCORE.getAddress());
  console.log("    SY-lstBTC:", await syLstBTC.getAddress());
  console.log("    SY-dualCORE:", await syDualCORE.getAddress());
  console.log("  Core Protocol:");
  console.log("    CoreYieldFactory:", await factory.getAddress());
  console.log("");
  console.log("🏪 CREATED MARKETS:");
  console.log("  stCORE Market (6M):", stCOREMarketId);
  console.log("  lstBTC Market (1Y):", lstBTCMarketId);
  console.log("  dualCORE Market (3M):", dualCOREMarketId);
  console.log("");
  console.log("⚡ GAS BREAKDOWN:");
  console.log("  Mock Assets:", mockAssetsGas.toString());
  console.log("  SY Tokens:", syTokensGas.toString());
  console.log("  Factory:", factoryGas.toString());
  console.log("  Markets:", marketsGas.toString());
  console.log("  TOTAL:", totalGasUsed.toString());
  console.log("");
  console.log("🚀 NEXT STEPS:");
  console.log("  1. Save contract addresses for frontend integration");
  console.log("  2. Verify contracts on Core Explorer (optional)");
  console.log("  3. Create demo video showing live functionality");
  console.log("  4. Submit to buildathon with live testnet deployment!");
  console.log("");
  console.log("🏆 CoreYield Protocol is LIVE on Core Testnet2!");

  // Prepare deployment result
  const deploymentResult: DeploymentResult = {
    network: {
      name: network.name,
      chainId: network.chainId,
      rpc: "https://rpc.test.btcs.network"
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      mockStCORE: await mockStCORE.getAddress(),
      mockLstBTC: await mockLstBTC.getAddress(),
      mockDualCORE: await mockDualCORE.getAddress(),
      syStCORE: await syStCORE.getAddress(),
      syLstBTC: await syLstBTC.getAddress(),
      syDualCORE: await syDualCORE.getAddress(),
      factory: await factory.getAddress()
    },
    markets: {
      stCOREMarketId,
      lstBTCMarketId,
      dualCOREMarketId
    },
    gasUsed: {
      total: totalGasUsed,
      mockAssets: mockAssetsGas,
      syTokens: syTokensGas,
      factory: factoryGas,
      markets: marketsGas
    }
  };

  // Save deployment info to file
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentFile = path.join(deploymentsDir, `coreyield-${network.chainId}-${Date.now()}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentResult, null, 2));
  console.log("💾 Deployment info saved to:", deploymentFile);

  return deploymentResult;
}

// Handle script execution
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    });
}

export default main;
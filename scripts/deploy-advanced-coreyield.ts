import { ethers } from "hardhat";
import { parseEther } from "ethers";

async function main() {
  console.log("🚀 Deploying Advanced CoreYield Protocol...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider?.getBalance(deployer.address))?.toString());

  // Deploy CoreYieldFactory first (if not already deployed)
  console.log("\n📋 Deploying CoreYieldFactory...");
  const CoreYieldFactory = await ethers.getContractFactory("CoreYieldFactory");
  const coreYieldFactory = await CoreYieldFactory.deploy();
  await coreYieldFactory.waitForDeployment();
  console.log("✅ CoreYieldFactory deployed to:", await coreYieldFactory.getAddress());

  // Deploy CoreYieldAMM
  console.log("\n🏊 Deploying CoreYieldAMM...");
  const CoreYieldAMM = await ethers.getContractFactory("CoreYieldAMM");
  const coreYieldAMM = await CoreYieldAMM.deploy(
    await coreYieldFactory.getAddress(),
    deployer.address // fee recipient
  );
  await coreYieldAMM.waitForDeployment();
  console.log("✅ CoreYieldAMM deployed to:", await coreYieldAMM.getAddress());

  // Deploy LiquidityMining
  console.log("\n⛏️ Deploying LiquidityMining...");
  const LiquidityMining = await ethers.getContractFactory("LiquidityMining");
  const liquidityMining = await LiquidityMining.deploy(
    await coreYieldAMM.getAddress()
  );
  await liquidityMining.waitForDeployment();
  console.log("✅ LiquidityMining deployed to:", await liquidityMining.getAddress());

  // Deploy mock tokens for testing
  console.log("\n🪙 Deploying mock tokens...");
  
  const MockDualCORE = await ethers.getContractFactory("MockDualCORE");
  const mockDualCORE = await MockDualCORE.deploy();
  await mockDualCORE.waitForDeployment();
  console.log("✅ MockDualCORE deployed to:", await mockDualCORE.getAddress());

  const MockStCORE = await ethers.getContractFactory("MockStCORE");
  const mockStCORE = await MockStCORE.deploy();
  await mockStCORE.waitForDeployment();
  console.log("✅ MockStCORE deployed to:", await mockStCORE.getAddress());

  const MockLstBTC = await ethers.getContractFactory("MockLstBTC");
  const mockLstBTC = await MockLstBTC.deploy();
  await mockLstBTC.waitForDeployment();
  console.log("✅ MockLstBTC deployed to:", await mockLstBTC.getAddress());

  // Deploy StandardizedYieldToken for stCORE
  console.log("\n📊 Deploying StandardizedYieldToken (stCORE)...");
  const StandardizedYieldToken = await ethers.getContractFactory("StandardizedYieldToken");
  const syStCORE = await StandardizedYieldToken.deploy(
    "Standardized Yield stCORE",
    "SY-stCORE",
    await mockStCORE.getAddress(),
    800 // 8% yield rate
  );
  await syStCORE.waitForDeployment();
  console.log("✅ SY-stCORE deployed to:", await syStCORE.getAddress());

  // Deploy StandardizedYieldToken for lstBTC
  console.log("\n📊 Deploying StandardizedYieldToken (lstBTC)...");
  const syLstBTC = await StandardizedYieldToken.deploy(
    "Standardized Yield lstBTC",
    "SY-lstBTC",
    await mockLstBTC.getAddress(),
    1200 // 12% yield rate
  );
  await syLstBTC.waitForDeployment();
  console.log("✅ SY-lstBTC deployed to:", await syLstBTC.getAddress());

  // Create markets
  console.log("\n🏪 Creating markets...");
  
  await coreYieldFactory.createMarket(
    await syStCORE.getAddress(),
    30 * 24 * 60 * 60, // 30 days
    "Principal Token stCORE",
    "PT-stCORE",
    "Yield Token stCORE",
    "YT-stCORE",
    parseEther("100"),  // min investment
    parseEther("1000000") // max investment
  );
  console.log("✅ Market 1 created");

  await coreYieldFactory.createMarket(
    await syLstBTC.getAddress(),
    60 * 24 * 60 * 60, // 60 days
    "Principal Token lstBTC",
    "PT-lstBTC",
    "Yield Token lstBTC",
    "YT-lstBTC",
    parseEther("0.1"),  // min investment
    parseEther("1000")  // max investment
  );
  console.log("✅ Market 2 created");

  // Create AMM pools
  console.log("\n🏊 Creating AMM pools...");
  
  // Mint initial tokens for pool creation
  await mockStCORE.mint(deployer.address, parseEther("10000"));
  await mockLstBTC.mint(deployer.address, parseEther("100"));
  
  // Wrap tokens to get SY tokens
  await mockStCORE.approve(await syStCORE.getAddress(), parseEther("10000"));
  await mockLstBTC.approve(await syLstBTC.getAddress(), parseEther("100"));
  
  await syStCORE.wrap(parseEther("1000"));
  await syLstBTC.wrap(parseEther("10"));
  
  // Split tokens to get PT and YT
  await syStCORE.approve(await coreYieldFactory.getAddress(), parseEther("1000"));
  await syLstBTC.approve(await coreYieldFactory.getAddress(), parseEther("10"));
  
  await coreYieldFactory.splitTokens(
    await syStCORE.getAddress(),
    parseEther("500"),
    0,
    0
  );
  
  await coreYieldFactory.splitTokens(
    await syLstBTC.getAddress(),
    parseEther("5"),
    0,
    0
  );
  
  // Get PT and YT token addresses
  const market1Data = await coreYieldFactory.getMarket(await syStCORE.getAddress());
  const market2Data = await coreYieldFactory.getMarket(await syLstBTC.getAddress());
  
  console.log("Market 1 data:", {
    syToken: market1Data.syToken,
    ptToken: market1Data.ptToken,
    ytToken: market1Data.ytToken,
    active: market1Data.active
  });
  
  console.log("Market 2 data:", {
    syToken: market2Data.syToken,
    ptToken: market2Data.ptToken,
    ytToken: market2Data.ytToken,
    active: market2Data.active
  });
  
  // Approve AMM to spend PT and YT tokens
  const ptStCORE = await ethers.getContractAt("CorePrincipalToken", market1Data.ptToken);
  const ytStCORE = await ethers.getContractAt("CoreYieldToken", market1Data.ytToken);
  const ptLstBTC = await ethers.getContractAt("CorePrincipalToken", market2Data.ptToken);
  const ytLstBTC = await ethers.getContractAt("CoreYieldToken", market2Data.ytToken);
  
  // Check deployer's balances
  console.log("Deployer balances after splitTokens:");
  console.log("PT-stCORE:", await ptStCORE.balanceOf(deployer.address));
  console.log("YT-stCORE:", await ytStCORE.balanceOf(deployer.address));
  console.log("PT-lstBTC:", await ptLstBTC.balanceOf(deployer.address));
  console.log("YT-lstBTC:", await ytLstBTC.balanceOf(deployer.address));
  
  await ptStCORE.approve(await coreYieldAMM.getAddress(), parseEther("1000"));
  await ytStCORE.approve(await coreYieldAMM.getAddress(), parseEther("1000"));
  await ptLstBTC.approve(await coreYieldAMM.getAddress(), parseEther("1000"));
  await ytLstBTC.approve(await coreYieldAMM.getAddress(), parseEther("1000"));
  
  // Create AMM pools
  await coreYieldAMM.createPool(
    await syStCORE.getAddress(),
    parseEther("250"),
    parseEther("250")
  );
  console.log("✅ AMM Pool 1 (stCORE) created");
  
  await coreYieldAMM.createPool(
    await syLstBTC.getAddress(),
    parseEther("2.5"),
    parseEther("2.5")
  );
  console.log("✅ AMM Pool 2 (lstBTC) created");

  // Setup liquidity mining
  console.log("\n⛏️ Setting up liquidity mining...");
  
  // Add pools to liquidity mining
  await liquidityMining.addPool(
    await syStCORE.getAddress(),
    await mockDualCORE.getAddress(),
    parseEther("0.1") // 0.1 CORE per second
  );
  
  await liquidityMining.addPool(
    await syLstBTC.getAddress(),
    await mockDualCORE.getAddress(),
    parseEther("0.05") // 0.05 CORE per second
  );
  
  console.log("✅ Liquidity mining pools configured");

  // Mint some CORE tokens for rewards
  await mockDualCORE.mint(await liquidityMining.getAddress(), parseEther("10000"));
  console.log("✅ CORE tokens minted for liquidity mining rewards");

  console.log("\n🎉 Advanced CoreYield Protocol deployment complete!");
  console.log("\n📋 Contract Addresses:");
  console.log("CoreYieldFactory:", await coreYieldFactory.getAddress());
  console.log("CoreYieldAMM:", await coreYieldAMM.getAddress());
  console.log("LiquidityMining:", await liquidityMining.getAddress());
  console.log("SY-stCORE:", await syStCORE.getAddress());
  console.log("SY-lstBTC:", await syLstBTC.getAddress());
  console.log("MockDualCORE:", await mockDualCORE.getAddress());
  console.log("MockStCORE:", await mockStCORE.getAddress());
  console.log("MockLstBTC:", await mockLstBTC.getAddress());
  
  console.log("\n🚀 Ready for testing and production!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 
import { ethers } from "hardhat";
import { writeFileSync } from "fs";
import { join } from "path";

async function main() {
  console.log("🚀 Deploying CoreYield PT/YT Contracts (local)...");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Deploy mocks
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

  // Mint some tokens to deployer for testing
  const mintAmount = ethers.parseEther("1000000");
  await (await dualCore.mint(deployer.address, mintAmount)).wait();
  await (await stCore.mint(deployer.address, mintAmount)).wait();
  console.log("Minted test balances");

  // Deploy CoreYieldFactory
  console.log("\n🏗️ Deploying CoreYieldFactory...");
  const CoreYieldFactory = await ethers.getContractFactory("CoreYieldFactory");
  const coreYieldFactory = await CoreYieldFactory.deploy();
  await coreYieldFactory.waitForDeployment();
  const factoryAddr = await coreYieldFactory.getAddress();
  console.log("CoreYieldFactory:", factoryAddr);

  // Deploy CoreYieldAMM
  console.log("\n🔄 Deploying CoreYieldAMM...");
  const CoreYieldAMM = await ethers.getContractFactory("CoreYieldAMM");
  const coreYieldAMM = await CoreYieldAMM.deploy(factoryAddr);
  await coreYieldAMM.waitForDeployment();
  const ammAddr = await coreYieldAMM.getAddress();
  console.log("CoreYieldAMM:", ammAddr);

  // Create markets for dualCORE and stCORE
  const latestBlock = await ethers.provider.getBlock('latest');
  const chainNow = Number(latestBlock?.timestamp || Math.floor(Date.now() / 1000));
  const oneYear = 365 * 24 * 60 * 60;
  const maturityTime = chainNow + oneYear + 3600; // +1y +1h buffer

  console.log("\n🎯 Creating dualCORE market...");
  await (await coreYieldFactory.createMarket(
    dualCoreAddr,
    maturityTime,
    "Standardized Yield dualCORE",
    "SY-dualCORE",
    "Principal Token dualCORE",
    "PT-dualCORE",
    "Yield Token dualCORE",
    "YT-dualCORE",
    1500 // 15% APY bps
  )).wait();

  let marketDual = await coreYieldFactory.getMarketByUnderlying(dualCoreAddr);
  console.log("dualCORE market SY:", marketDual.syToken);
  console.log("dualCORE market PT:", marketDual.ptToken);
  console.log("dualCORE market YT:", marketDual.ytToken);

  console.log("\n🎯 Creating stCORE market...");
  await (await coreYieldFactory.createMarket(
    stCoreAddr,
    maturityTime,
    "Standardized Yield stCORE",
    "SY-stCORE",
    "Principal Token stCORE",
    "PT-stCORE",
    "Yield Token stCORE",
    "YT-stCORE",
    850 // 8.5% APY bps
  )).wait();

  let marketSt = await coreYieldFactory.getMarketByUnderlying(stCoreAddr);
  console.log("stCORE market SY:", marketSt.syToken);
  console.log("stCORE market PT:", marketSt.ptToken);
  console.log("stCORE market YT:", marketSt.ytToken);

  // Create AMM pools (PT/YT)
  console.log("\n🏊 Register supported tokens & create PT/YT pools...");
  // Add supported tokens
  for (const addr of [
    dualCoreAddr,
    stCoreAddr,
    marketDual.syToken,
    marketDual.ptToken,
    marketDual.ytToken,
    marketSt.syToken,
    marketSt.ptToken,
    marketSt.ytToken
  ]) {
    await (await coreYieldAMM.addSupportedToken(addr as string)).wait();
  }

  // Create pools (PT/YT) for both markets
  // Ensure tokens are in ascending order for AMM
  const dualPT = marketDual.ptToken;
  const dualYT = marketDual.ytToken;
  const stPT = marketSt.ptToken;
  const stYT = marketSt.ytToken;
  
  console.log("Creating pools with tokens:");
  console.log("dualPT:", dualPT);
  console.log("dualYT:", dualYT);
  console.log("stPT:", stPT);
  console.log("stYT:", stYT);
  
  // Create pools with proper token ordering
  if (dualPT < dualYT) {
    console.log("Creating dualCORE PT/YT pool (PT < YT)");
    await (await coreYieldAMM.createPool(dualPT, dualYT, true)).wait();
    console.log("✅ dualCORE pool created");
  } else {
    console.log("Creating dualCORE PT/YT pool (YT < PT)");
    await (await coreYieldAMM.createPool(dualYT, dualPT, true)).wait();
    console.log("✅ dualCORE pool created");
  }
  
  if (stPT < stYT) {
    console.log("Creating stCORE PT/YT pool (PT < YT)");
    await (await coreYieldAMM.createPool(stPT, stYT, true)).wait();
    console.log("✅ stCORE pool created");
  } else {
    console.log("Creating stCORE PT/YT pool (YT < PT)");
    await (await coreYieldAMM.createPool(stYT, stPT, true)).wait();
    console.log("✅ stCORE pool created");
  }
  
  // Verify pools were created
  console.log("\nVerifying pools...");
  const dualPoolKey = ethers.keccak256(ethers.solidityPacked(
    ["address", "address"],
    [dualPT < dualYT ? dualPT : dualYT, dualPT < dualYT ? dualYT : dualPT]
  ));
  const stPoolKey = ethers.keccak256(ethers.solidityPacked(
    ["address", "address"],
    [stPT < stYT ? stPT : stYT, stPT < stYT ? stYT : stPT]
  ));
  
  const dualPool = await coreYieldAMM.pools(dualPoolKey);
  const stPool = await coreYieldAMM.pools(stPoolKey);
  
  console.log("dualCORE pool exists:", dualPool.token0 !== ethers.ZeroAddress);
  console.log("stCORE pool exists:", stPool.token0 !== ethers.ZeroAddress);
  
  console.log("✅ PT/YT pools created and verified");

  // Save deployment info
  const deployment = {
    CoreYieldFactory: factoryAddr,
    CoreYieldAMM: ammAddr,
    tokens: {
      dualCORE: dualCoreAddr,
      stCORE: stCoreAddr
    },
    markets: {
      dualCORE: {
        syToken: marketDual.syToken,
        ptToken: marketDual.ptToken,
        ytToken: marketDual.ytToken
      },
      stCORE: {
        syToken: marketSt.syToken,
        ptToken: marketSt.ptToken,
        ytToken: marketSt.ytToken
      }
    },
    network: "localhost",
    timestamp: new Date().toISOString()
  };

  const outPath = join(__dirname, "../deployment-ptyt.local.json");
  writeFileSync(outPath, JSON.stringify(deployment, null, 2));
  console.log("\n📄 Wrote:", outPath);
  console.log("🎉 Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

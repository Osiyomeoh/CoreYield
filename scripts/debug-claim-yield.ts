import { ethers } from "hardhat";
import { readFileSync } from "fs";
import { join } from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("🔍 Debugging Claim Yield Issue...");
  console.log("Test User:", deployer.address);

  // Load deployment info
  const deploymentPath = join(__dirname, "../deployment-ptyt.local.json");
  const deployment = JSON.parse(readFileSync(deploymentPath, "utf8"));
  
  console.log("\n📋 Loaded deployment info from:", deploymentPath);

  // Load contract instances
  const coreYieldTokenOperations = await ethers.getContractAt("CoreYieldTokenOperations", deployment.CoreYieldTokenOperations);
  const dualCore = await ethers.getContractAt("MockDualCORE", deployment.tokens.dualCORE);
  
  // Load SY, PT, YT tokens
  const dualCoreSY = await ethers.getContractAt("StandardizedYieldToken", deployment.markets.dualCORE.syToken);
  const dualCorePT = await ethers.getContractAt("PrincipalToken", deployment.markets.dualCORE.ptToken);
  const dualCoreYT = await ethers.getContractAt("YieldToken", deployment.markets.dualCORE.ytToken);
  
  console.log("🔍 Contract instances loaded");

  // Test 1: Wrap CORE to SY
  console.log("\n=== PHASE 1: Wrap CORE to SY ===");
  const wrapAmount = ethers.parseEther("100");
  
  await (await dualCore.approve(deployment.markets.dualCORE.syToken, wrapAmount)).wait();
  console.log("✅ Approved SY token to spend CORE");
  
  await (await dualCoreSY.wrap(wrapAmount)).wait();
  console.log("✅ Wrapped 100.0 CORE to SY");
  
  const syBalance = await dualCoreSY.balanceOf(deployer.address);
  console.log("SY balance:", ethers.formatEther(syBalance));

  // Test 2: Split SY to PT + YT
  console.log("\n=== PHASE 2: Split SY to PT + YT ===");
  
  await (await dualCoreSY.approve(deployment.CoreYieldTokenOperations, syBalance)).wait();
  console.log("✅ Approved token operations to spend SY");
  
  await (await coreYieldTokenOperations.splitSY(deployment.markets.dualCORE.syToken, syBalance)).wait();
  console.log("✅ Split SY to PT + YT");
  
  // Check PT and YT balances
  let ptBalance = await dualCorePT.balanceOf(deployer.address);
  let ytBalance = await dualCoreYT.balanceOf(deployer.address);
  console.log("PT balance:", ethers.formatEther(ptBalance));
  console.log("YT balance:", ethers.formatEther(ytBalance));

  // Test 3: Simulate Yield Accrual
  console.log("\n=== PHASE 3: Simulate Yield Accrual ===");
  
  // Fast forward time (7 days)
  await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
  await ethers.provider.send("evm_mine", []);
  console.log("✅ Fast forwarded 7 days");
  
  // Accrue yield on YT token
  await (await dualCoreYT.accrueYield(deployer.address)).wait();
  const yieldAccrued = await dualCoreYT.getClaimableYield(deployer.address);
  console.log("YT yield accrued:", ethers.formatEther(yieldAccrued));

  // Check balances BEFORE claiming yield
  console.log("\n📊 Balances BEFORE claiming yield:");
  ptBalance = await dualCorePT.balanceOf(deployer.address);
  ytBalance = await dualCoreYT.balanceOf(deployer.address);
  console.log("PT balance:", ethers.formatEther(ptBalance));
  console.log("YT balance:", ethers.formatEther(ytBalance));
  
  // Check PT token owner
  const ptOwner = await dualCorePT.owner();
  console.log("PT token owner:", ptOwner);
  console.log("Token operations:", deployment.CoreYieldTokenOperations);

  // Test 4: Claim Yield
  console.log("\n=== PHASE 4: Claim Yield ===");
  
  // Claim yield
  await (await dualCoreYT.claimYield()).wait();
  console.log("✅ Claimed yield");

  // Check balances AFTER claiming yield
  console.log("\n📊 Balances AFTER claiming yield:");
  ptBalance = await dualCorePT.balanceOf(deployer.address);
  ytBalance = await dualCoreYT.balanceOf(deployer.address);
  console.log("PT balance:", ethers.formatEther(ptBalance));
  console.log("YT balance:", ethers.formatEther(ytBalance));
  
  // Check if PT token has been affected
  const ptTotalSupply = await dualCorePT.totalSupply();
  console.log("PT total supply:", ethers.formatEther(ptTotalSupply));
  
  // Check if there are any PT tokens stuck somewhere
  const tokenOpsBalance = await dualCorePT.balanceOf(deployment.CoreYieldTokenOperations);
  console.log("PT balance in token operations:", ethers.formatEther(tokenOpsBalance));
  
  const factoryBalance = await dualCorePT.balanceOf(deployment.CoreYieldMarketFactory);
  console.log("PT balance in factory:", ethers.formatEther(factoryBalance));

  console.log("\n🎉 Debug completed!");
}

main().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exitCode = 1;
});

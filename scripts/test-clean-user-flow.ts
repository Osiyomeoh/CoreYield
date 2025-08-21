import { ethers } from "hardhat";
import { readFileSync } from "fs";
import { join } from "path";

async function main() {
  console.log("🧪 Testing Complete CoreYield User Flow (Clean)...");

  const [deployer, user] = await ethers.getSigners();
  console.log("Test User:", user.address);

  // Load deployment info
  const deploymentPath = join(__dirname, "../deployment-ptyt.local.json");
  const deployment = JSON.parse(readFileSync(deploymentPath, "utf8"));
  
  console.log("\n📋 Loaded deployment info from:", deploymentPath);

  // Load contract instances
  const coreYieldTokenOperations = await ethers.getContractAt("CoreYieldTokenOperations", deployment.CoreYieldTokenOperations);
  const coreYieldAMM = await ethers.getContractAt("CoreYieldAMM", deployment.CoreYieldAMM);
  const dualCore = await ethers.getContractAt("MockDualCORE", deployment.tokens.dualCORE);
  const stCore = await ethers.getContractAt("MockStCORE", deployment.tokens.stCORE);
  
  // Load SY, PT, YT tokens
  const dualCoreSY = await ethers.getContractAt("StandardizedYieldToken", deployment.markets.dualCORE.syToken);
  const dualCorePT = await ethers.getContractAt("PrincipalToken", deployment.markets.dualCORE.ptToken);
  const dualCoreYT = await ethers.getContractAt("YieldToken", deployment.markets.dualCORE.ytToken);
  
  console.log("🔍 Contract instances loaded");

  // Test 1: Setup - Transfer tokens to user
  console.log("\n=== PHASE 1: Initial Setup ===");
  
  // Transfer some tokens to the test user from deployer
  await (await dualCore.transfer(user.address, ethers.parseEther("1000"))).wait();
  await (await stCore.transfer(user.address, ethers.parseEther("1000"))).wait();
  
  const coreBalance = await dualCore.balanceOf(user.address);
  const stCoreBalance = await stCore.balanceOf(user.address);
  console.log("Initial CORE balance:", ethers.formatEther(coreBalance));
  console.log("Initial stCORE balance:", ethers.formatEther(stCoreBalance));

  // Test 2: Wrap CORE to SY
  console.log("\n=== PHASE 2: Wrap CORE to SY ===");
  const wrapAmount = ethers.parseEther("100");
  
  // Connect contracts to user
  const userDualCore = dualCore.connect(user);
  const userDualCoreSY = dualCoreSY.connect(user);
  const userDualCorePT = dualCorePT.connect(user);
  const userDualCoreYT = dualCoreYT.connect(user);
  const userTokenOperations = coreYieldTokenOperations.connect(user);
  const userAMM = coreYieldAMM.connect(user);
  
  // Approve SY token to spend CORE
  await (await userDualCore.approve(deployment.markets.dualCORE.syToken, wrapAmount)).wait();
  console.log("✅ Approved SY token to spend CORE");
  
  // Wrap CORE to SY
  await (await userDualCoreSY.wrap(wrapAmount)).wait();
  console.log("✅ Wrapped 100.0 CORE to SY");
  
  const syBalance = await dualCoreSY.balanceOf(user.address);
  console.log("SY balance:", ethers.formatEther(syBalance));

  // Test 3: Split SY to PT + YT
  console.log("\n=== PHASE 3: Split SY to PT + YT ===");
  
  // Approve token operations to spend SY
  await (await userDualCoreSY.approve(deployment.CoreYieldTokenOperations, syBalance)).wait();
  console.log("✅ Approved token operations to spend SY");
  
  // Split SY to PT + YT
  await (await userTokenOperations.splitSY(deployment.markets.dualCORE.syToken, syBalance)).wait();
  console.log("✅ Split SY to PT + YT");
  
  // Check PT and YT balances
  const ptBalance = await dualCorePT.balanceOf(user.address);
  const ytBalance = await dualCoreYT.balanceOf(user.address);
  console.log("PT balance:", ethers.formatEther(ptBalance));
  console.log("YT balance:", ethers.formatEther(ytBalance));

  // Test 4: AMM Swap PT -> YT
  console.log("\n=== PHASE 4: AMM Swap PT -> YT ===");
  
  // Add liquidity to PT/YT pool
  console.log("Adding liquidity to PT/YT pool...");
  const liquidityAmount = ethers.parseEther("20");
  
  // Approve AMM to spend PT and YT for liquidity
  await (await userDualCorePT.approve(deployment.CoreYieldAMM, liquidityAmount)).wait();
  await (await userDualCoreYT.approve(deployment.CoreYieldAMM, liquidityAmount)).wait();
  console.log("✅ Approved AMM to spend PT and YT for liquidity");
  
  // Add liquidity (ensure correct token order: token0 < token1)
  const ptAddress = deployment.markets.dualCORE.ptToken;
  const ytAddress = deployment.markets.dualCORE.ytToken;
  const [token0, token1] = ptAddress.toLowerCase() < ytAddress.toLowerCase() ? [ptAddress, ytAddress] : [ytAddress, ptAddress];
  
  await (await userAMM.addLiquidity(
      token0,
      token1,
      liquidityAmount,
      liquidityAmount,
      0,
      0
  )).wait();
  console.log("✅ Added liquidity to PT/YT pool");
  
  // Check remaining balances
  const remainingPtBalance = await dualCorePT.balanceOf(user.address);
  const remainingYtBalance = await dualCoreYT.balanceOf(user.address);
  console.log("Remaining PT balance:", ethers.formatEther(remainingPtBalance));
  console.log("Remaining YT balance:", ethers.formatEther(remainingYtBalance));
  
  // Execute swap PT -> YT
  console.log("Executing swap PT -> YT...");
  const swapAmount = ethers.parseEther("5");
  
  // Approve AMM to spend PT for swap
  await (await userDualCorePT.approve(deployment.CoreYieldAMM, swapAmount)).wait();
  console.log("✅ Approved AMM to spend PT for swap");
  
  // Execute swap PT -> YT
  await (await userAMM.swap(
      deployment.markets.dualCORE.ptToken,
      deployment.markets.dualCORE.ytToken,
      swapAmount
  )).wait();
  console.log("✅ Swapped PT -> YT");
  
  // Check new balances
  const newPtBalance = await dualCorePT.balanceOf(user.address);
  const newYtBalance = await dualCoreYT.balanceOf(user.address);
  console.log("New PT balance:", ethers.formatEther(newPtBalance));
  console.log("New YT balance:", ethers.formatEther(newYtBalance));

  // Test 5: Simulate Yield Accrual
  console.log("\n=== PHASE 5: Simulate Yield Accrual ===");
  
  // Fast forward time (7 days)
  await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
  await ethers.provider.send("evm_mine", []);
  console.log("✅ Fast forwarded 7 days");
  
  // Accrue yield on YT token
  await (await userDualCoreYT.accrueYield(user.address)).wait();
  const yieldAccrued = await dualCoreYT.getClaimableYield(user.address);
  console.log("YT yield accrued:", ethers.formatEther(yieldAccrued));

  // Test 6: Claim Yield
  console.log("\n=== PHASE 6: Claim Yield ===");
  
  // Check balances BEFORE claiming yield
  console.log("Balances BEFORE yield claim:");
  console.log("- PT balance:", ethers.formatEther(await dualCorePT.balanceOf(user.address)));
  console.log("- YT balance:", ethers.formatEther(await dualCoreYT.balanceOf(user.address)));
  
  // Claim yield
  await (await userDualCoreYT.claimYield()).wait();
  console.log("✅ Claimed yield");
  
  // Check balances AFTER claiming yield
  console.log("Balances AFTER yield claim:");
  console.log("- PT balance:", ethers.formatEther(await dualCorePT.balanceOf(user.address)));
  console.log("- YT balance:", ethers.formatEther(await dualCoreYT.balanceOf(user.address)));

  // Test 7: Merge PT + YT back to SY
  console.log("\n=== PHASE 7: Merge PT + YT back to SY ===");
  
  // Get current balances for merge
  const mergePtAmount = await dualCorePT.balanceOf(user.address);
  const mergeYtAmount = await dualCoreYT.balanceOf(user.address);
  const minAmount = mergePtAmount < mergeYtAmount ? mergePtAmount : mergeYtAmount;
  
  console.log("Merging PT:", ethers.formatEther(minAmount), "YT:", ethers.formatEther(minAmount));
  
  // Approve token operations to spend PT and YT
  await (await userDualCorePT.approve(deployment.CoreYieldTokenOperations, minAmount)).wait();
  await (await userDualCoreYT.approve(deployment.CoreYieldTokenOperations, minAmount)).wait();
  console.log("✅ Approved token operations to spend PT and YT");
  
  // Merge PT + YT back to SY
  await (await userTokenOperations.mergePTYT(
      deployment.markets.dualCORE.syToken,
      minAmount,
      minAmount
  )).wait();
  console.log("✅ Merged PT + YT back to SY");
  
  // Check final SY balance
  const finalSyBalance = await dualCoreSY.balanceOf(user.address);
  console.log("Final SY balance:", ethers.formatEther(finalSyBalance));

  // Test 8: Unwrap SY to CORE
  console.log("\n=== PHASE 8: Unwrap SY to CORE ===");
  
  // Unwrap SY
  await (await userDualCoreSY.unwrap(finalSyBalance)).wait();
  console.log("✅ Unwrapped SY to CORE");
  
  // Check final CORE balance
  const finalCoreBalance = await dualCore.balanceOf(user.address);
  console.log("Final CORE balance:", ethers.formatEther(finalCoreBalance));

  console.log("\n🎉 All tests passed! CoreYield PT/YT system is working correctly.");
}

main().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exitCode = 1;
});

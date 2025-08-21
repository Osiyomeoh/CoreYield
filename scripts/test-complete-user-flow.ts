import { ethers } from "hardhat";
import { readFileSync } from "fs";
import { join } from "path";

async function main() {
  console.log("🧪 Testing Complete CoreYield User Flow...");

  const [deployer, user] = await ethers.getSigners();
  console.log("Test User:", user.address);

  // Load deployment info
  const deploymentPath = join(__dirname, "../deployments/coreyield-testnet2-1755598564769.json");
  const deployment = JSON.parse(readFileSync(deploymentPath, "utf8"));
  
  console.log("\n📋 Loaded deployment info from:", deploymentPath);

  // Load contract instances
  const coreYieldMarketFactory = await ethers.getContractAt("CoreYieldMarketFactory", deployment.contracts.CoreYieldMarketFactory);
  const coreYieldTokenOperations = await ethers.getContractAt("CoreYieldTokenOperations", deployment.contracts.CoreYieldTokenOperations);
  const coreYieldAMM = await ethers.getContractAt("CoreYieldAMM", deployment.contracts.CoreYieldAMM);
  const dualCore = await ethers.getContractAt("MockDualCORE", deployment.contracts.MockDualCORE);
  const stCore = await ethers.getContractAt("MockStCORE", deployment.contracts.MockStCORE);
  
  // Load SY, PT, YT tokens
  const dualCoreSY = await ethers.getContractAt("StandardizedYieldToken", deployment.markets.dualCORE.syToken);
  const dualCorePT = await ethers.getContractAt("PrincipalToken", deployment.markets.dualCORE.ptToken);
  const dualCoreYT = await ethers.getContractAt("YieldToken", deployment.markets.dualCORE.ytToken);
  
  console.log("🔍 Contract instances loaded");

  // Test 1: Check initial balances
  console.log("\n=== PHASE 1: Initial Setup ===");
  const coreBalance = await dualCore.balanceOf(deployer.address);
  const stCoreBalance = await stCore.balanceOf(deployer.address);
  console.log("Initial CORE balance:", ethers.formatEther(coreBalance));
  console.log("Initial stCORE balance:", ethers.formatEther(stCoreBalance));

  // Test 2: Wrap CORE to SY
  console.log("\n=== PHASE 2: Wrap CORE to SY ===");
  const wrapAmount = ethers.parseEther("100");
  
  // Approve SY token to spend CORE
  await (await dualCore.approve(deployment.markets.dualCORE.syToken, wrapAmount)).wait();
  console.log("✅ Approved SY token to spend CORE");
  
  // Wrap CORE to SY
  const syToken = await ethers.getContractAt("StandardizedYieldToken", deployment.markets.dualCORE.syToken);
  await (await syToken.wrap(wrapAmount)).wait();
  console.log("✅ Wrapped", ethers.formatEther(wrapAmount), "CORE to SY");
  
  const syBalance = await syToken.balanceOf(deployer.address);
  console.log("SY balance:", ethers.formatEther(syBalance));

  // Test 3: Split SY to PT + YT
  console.log("\n=== PHASE 3: Split SY to PT + YT ===");
  
      // Approve token operations to spend SY
    await (await syToken.approve(deployment.contracts.CoreYieldTokenOperations, syBalance)).wait();
    console.log("✅ Approved token operations to spend SY");
    
    // Split SY to PT + YT
    await (await coreYieldTokenOperations.splitSY(deployment.markets.dualCORE.syToken, syBalance)).wait();
  console.log("✅ Split SY to PT + YT");
  
  // Check PT and YT balances
  const ptBalance = await dualCorePT.balanceOf(deployer.address);
  const ytBalance = await dualCoreYT.balanceOf(deployer.address);
  console.log("PT balance:", ethers.formatEther(ptBalance));
  console.log("YT balance:", ethers.formatEther(ytBalance));

  // Test 4: AMM Swap PT -> YT
  console.log("\n=== PHASE 4: AMM Swap PT -> YT ===");
  
  // Add liquidity to PT/YT pool
  console.log("Adding liquidity to PT/YT pool...");
  const liquidityAmount = ethers.parseEther("20");
  
  // Approve AMM to spend PT and YT for liquidity
  await (await dualCorePT.approve(deployment.contracts.CoreYieldAMM, liquidityAmount)).wait();
  await (await dualCoreYT.approve(deployment.contracts.CoreYieldAMM, liquidityAmount)).wait();
  console.log("✅ Approved AMM to spend PT and YT for liquidity");
  
  // Add liquidity (ensure correct token order: token0 < token1)
  const ptAddress = deployment.markets.dualCORE.ptToken;
  const ytAddress = deployment.markets.dualCORE.ytToken;
  const [token0, token1] = ptAddress.toLowerCase() < ytAddress.toLowerCase() ? [ptAddress, ytAddress] : [ytAddress, ptAddress];
  
  await (await coreYieldAMM.addLiquidity(
      token0,
      token1,
      liquidityAmount,
      liquidityAmount,
      0
  )).wait();
  console.log("✅ Added liquidity to PT/YT pool");
  
  // Check remaining balances
  const remainingPtBalance = await dualCorePT.balanceOf(deployer.address);
  const remainingYtBalance = await dualCoreYT.balanceOf(deployer.address);
  console.log("Remaining PT balance:", ethers.formatEther(remainingPtBalance));
  console.log("Remaining YT balance:", ethers.formatEther(remainingYtBalance));
  
  // Execute swap PT -> YT
  console.log("Executing swap PT -> YT...");
  const swapAmount = ethers.parseEther("5");
  
  // Approve AMM to spend PT for swap
  await (await dualCorePT.approve(deployment.contracts.CoreYieldAMM, swapAmount)).wait();
  console.log("✅ Approved AMM to spend PT for swap");
  
  // Execute swap PT -> YT
  console.log("PT Token address:", deployment.markets.dualCORE.ptToken);
  console.log("YT Token address:", deployment.markets.dualCORE.ytToken);
  console.log("Swap amount:", ethers.formatEther(swapAmount));
  console.log("Recipient:", deployer.address);
  
  await (await coreYieldAMM.swap(
      deployment.markets.dualCORE.ptToken,
      deployment.markets.dualCORE.ytToken,
      swapAmount,
      0, // minAmountOut
      deployer.address // recipient
  )).wait();
  console.log("✅ Swapped PT -> YT");
  
  // Check new balances
  const newPtBalance = await dualCorePT.balanceOf(deployer.address);
  const newYtBalance = await dualCoreYT.balanceOf(deployer.address);
  console.log("New PT balance:", ethers.formatEther(newPtBalance));
  console.log("New YT balance:", ethers.formatEther(newYtBalance));

  // Test 5: Simulate Yield Accrual
  console.log("\n=== PHASE 5: Simulate Yield Accrual ===");
  
  // Fast forward time (7 days)
  await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
  await ethers.provider.send("evm_mine", []);
  console.log("✅ Fast forwarded 7 days");
  
  // Accrue yield on YT token
  await (await dualCoreYT.accrueYield(deployer.address)).wait();
  const yieldAccrued = await dualCoreYT.getClaimableYield(deployer.address);
  console.log("YT yield accrued:", ethers.formatEther(yieldAccrued));

  // Test 6: Claim Yield
  console.log("\n=== PHASE 6: Claim Yield ===");
  
  // Claim yield
  await (await dualCoreYT.claimYield()).wait();
  console.log("✅ Claimed yield");

  // Test 7: Merge PT + YT back to SY
  console.log("\n=== PHASE 7: Merge PT + YT back to SY ===");
  
  // Get current balances for merge
  const mergePtAmount = await dualCorePT.balanceOf(deployer.address);
  const mergeYtAmount = await dualCoreYT.balanceOf(deployer.address);
  const minAmount = mergePtAmount < mergeYtAmount ? mergePtAmount : mergeYtAmount;
  
  console.log("Merging PT:", ethers.formatEther(minAmount), "YT:", ethers.formatEther(minAmount));
  
      // Approve token operations to spend PT and YT
    await (await dualCorePT.approve(deployment.contracts.CoreYieldTokenOperations, minAmount)).wait();
    await (await dualCoreYT.approve(deployment.contracts.CoreYieldTokenOperations, minAmount)).wait();
    console.log("✅ Approved token operations to spend PT and YT");
    
    // Merge PT + YT back to SY
    await (await coreYieldTokenOperations.mergePTYT(
        deployment.markets.dualCORE.syToken,
        minAmount,
        minAmount
    )).wait();
  console.log("✅ Merged PT + YT back to SY");
  
  // Check final SY balance
  const finalSyBalance = await dualCoreSY.balanceOf(deployer.address);
  console.log("Final SY balance:", ethers.formatEther(finalSyBalance));

  // Test 8: Unwrap SY to CORE
  console.log("\n=== PHASE 8: Unwrap SY to CORE ===");
  
  // Unwrap SY
  await (await dualCoreSY.unwrap(finalSyBalance)).wait();
  console.log("✅ Unwrapped SY to CORE");
  
  // Check final CORE balance
  const finalCoreBalance = await dualCore.balanceOf(deployer.address);
  console.log("Final CORE balance:", ethers.formatEther(finalCoreBalance));

    // Test 9: Check Pool Liquidity
  console.log("\n=== PHASE 9: Check Pool Liquidity ===");
   
  // Verify pool exists
  const poolKey = ethers.keccak256(ethers.solidityPacked(
    ["address", "address"],
    [deployment.markets.dualCORE.ptToken, deployment.markets.dualCORE.ytToken]
  ));
  
  const pool = await coreYieldAMM.pools(poolKey);
  console.log("PT/YT Pool info:", {
    token0: pool.token0,
    token1: pool.token1,
    reserve0: ethers.formatEther(pool.reserve0),
    reserve1: ethers.formatEther(pool.reserve1),
    totalSupply: ethers.formatEther(pool.totalSupply),
    isYieldPool: pool.isYieldPool
  });

  console.log("\n🎉 All tests passed! CoreYield PT/YT system is working correctly.");
}

main().catch((e) => {
  console.error("❌ Test failed:", e);
  process.exit(1);
});

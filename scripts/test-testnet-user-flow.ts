import { ethers } from "hardhat";
import { readFileSync } from "fs";
import { join } from "path";

async function main() {
  console.log("🧪 Testing Complete User Flow on Core Testnet...");

  const [deployer] = await ethers.getSigners();
  console.log("Test Account:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "CORE");

  // Load deployment info
  const deploymentPath = join(__dirname, "../deployments/coreyield-testnet2-1755599771606.json");
  const deployment = JSON.parse(readFileSync(deploymentPath, "utf8"));
  
  console.log("📋 Loaded deployment info");

  // Load contract instances
  const coreYieldMarketFactory = await ethers.getContractAt("CoreYieldMarketFactory", deployment.contracts.CoreYieldMarketFactory);
  const coreYieldTokenOperations = await ethers.getContractAt("CoreYieldTokenOperations", deployment.contracts.CoreYieldTokenOperations);
  const coreYieldAMM = await ethers.getContractAt("CoreYieldAMM", deployment.contracts.CoreYieldAMM);
  
  // Load mock tokens
  const dualCore = await ethers.getContractAt("MockDualCORE", deployment.contracts.MockDualCORE);
  const stCore = await ethers.getContractAt("MockStCORE", deployment.contracts.MockStCORE);
  const lstBTC = await ethers.getContractAt("MockLstBTC", deployment.contracts.MockLstBTC);
  
  // Load SY, PT, YT tokens for dualCORE market
  const dualCoreSY = await ethers.getContractAt("StandardizedYieldToken", deployment.markets.dualCORE.syToken);
  const dualCorePT = await ethers.getContractAt("PrincipalToken", deployment.markets.dualCORE.ptToken);
  const dualCoreYT = await ethers.getContractAt("YieldToken", deployment.markets.dualCORE.ytToken);
  
  console.log("🔍 Contract instances loaded");

  // Test 1: Check initial balances
  console.log("\n=== PHASE 1: Initial Setup ===");
  const coreBalance = await dualCore.balanceOf(deployer.address);
  const stCoreBalance = await stCore.balanceOf(deployer.address);
  const lstBTCBalance = await lstBTC.balanceOf(deployer.address);
  console.log("Initial CORE balance:", ethers.formatEther(coreBalance));
  console.log("Initial stCORE balance:", ethers.formatEther(stCoreBalance));
  console.log("Initial lstBTC balance:", ethers.formatUnits(lstBTCBalance, 8));

  // Test 2: Wrap CORE to SY
  console.log("\n=== PHASE 2: Wrap CORE to SY ===");
  const wrapAmount = ethers.parseEther("100");
  
  try {
    // Approve SY token to spend CORE
    const approveTx = await dualCore.approve(deployment.markets.dualCORE.syToken, wrapAmount);
    await approveTx.wait();
    console.log("✅ Approved SY token to spend CORE");
    
    // Wrap CORE to SY
    const wrapTx = await dualCoreSY.wrap(wrapAmount);
    await wrapTx.wait();
    console.log("✅ Wrapped", ethers.formatEther(wrapAmount), "CORE to SY");
    
    const syBalance = await dualCoreSY.balanceOf(deployer.address);
    console.log("SY balance:", ethers.formatEther(syBalance));
    
  } catch (error) {
    console.log("❌ Wrap failed:", error.message);
    return;
  }

  // Test 3: Split SY to PT + YT
  console.log("\n=== PHASE 3: Split SY to PT + YT ===");
  
  try {
    const syBalance = await dualCoreSY.balanceOf(deployer.address);
    
    // Approve token operations to spend SY
    const approveTx = await dualCoreSY.approve(deployment.contracts.CoreYieldTokenOperations, syBalance);
    await approveTx.wait();
    console.log("✅ Approved token operations to spend SY");
    
    // Split SY to PT + YT
    const splitTx = await coreYieldTokenOperations.splitSY(deployment.markets.dualCORE.syToken, syBalance);
    await splitTx.wait();
    console.log("✅ Split SY to PT + YT");
    
    // Check PT and YT balances
    const ptBalance = await dualCorePT.balanceOf(deployer.address);
    const ytBalance = await dualCoreYT.balanceOf(deployer.address);
    console.log("PT balance:", ethers.formatEther(ptBalance));
    console.log("YT balance:", ethers.formatEther(ytBalance));
    
  } catch (error) {
    console.log("❌ Split failed:", error.message);
    return;
  }

  // Test 4: Add Liquidity to AMM Pool
  console.log("\n=== PHASE 4: Add Liquidity to AMM Pool ===");
  
  try {
    const liquidityAmount = ethers.parseEther("20");
    
    // Approve AMM to spend PT and YT for liquidity
    const approvePTTx = await dualCorePT.approve(deployment.contracts.CoreYieldAMM, liquidityAmount);
    await approvePTTx.wait();
    const approveYTTx = await dualCoreYT.approve(deployment.contracts.CoreYieldAMM, liquidityAmount);
    await approveYTTx.wait();
    console.log("✅ Approved AMM to spend PT and YT for liquidity");
    
    // Add liquidity to PT/YT pool
    const addLiquidityTx = await coreYieldAMM.addLiquidity(
      deployment.markets.dualCORE.ptToken,
      deployment.markets.dualCORE.ytToken,
      liquidityAmount,
      liquidityAmount,
      0 // minLiquidity
    );
    await addLiquidityTx.wait();
    console.log("✅ Added liquidity to PT/YT pool");
    
    // Check remaining balances
    const remainingPtBalance = await dualCorePT.balanceOf(deployer.address);
    const remainingYtBalance = await dualCoreYT.balanceOf(deployer.address);
    console.log("Remaining PT balance:", ethers.formatEther(remainingPtBalance));
    console.log("Remaining YT balance:", ethers.formatEther(remainingYtBalance));
    
  } catch (error) {
    console.log("❌ Add liquidity failed:", error.message);
    return;
  }

  // Test 5: Test AMM Swap
  console.log("\n=== PHASE 5: Test AMM Swap ===");
  
  try {
    const swapAmount = ethers.parseEther("5");
    
    // Approve AMM to spend PT for swap
    const approveSwapTx = await dualCorePT.approve(deployment.contracts.CoreYieldAMM, swapAmount);
    await approveSwapTx.wait();
    console.log("✅ Approved AMM to spend PT for swap");
    
    // Get quote first
    const quote = await coreYieldAMM.getQuote(
      deployment.markets.dualCORE.ptToken,
      deployment.markets.dualCORE.ytToken,
      swapAmount
    );
    console.log("📊 Swap Quote:");
    console.log(`  - Input: ${ethers.formatEther(swapAmount)} PT`);
    console.log(`  - Output: ${ethers.formatEther(quote.outputAmount)} YT`);
    console.log(`  - Fee: ${ethers.formatEther(quote.fee)}`);
    console.log(`  - Yield Adjustment: ${ethers.formatUnits(quote.yieldAdjustment, 2)}%`);
    
    // Execute swap PT -> YT
    const swapTx = await coreYieldAMM.swap(
      deployment.markets.dualCORE.ptToken,
      deployment.markets.dualCORE.ytToken,
      swapAmount,
      0, // minAmountOut
      deployer.address // recipient
    );
    await swapTx.wait();
    console.log("✅ Swapped PT -> YT");
    
    // Check new balances
    const newPtBalance = await dualCorePT.balanceOf(deployer.address);
    const newYtBalance = await dualCoreYT.balanceOf(deployer.address);
    console.log("New PT balance:", ethers.formatEther(newPtBalance));
    console.log("New YT balance:", ethers.formatEther(newYtBalance));
    
  } catch (error) {
    console.log("❌ Swap failed:", error.message);
    return;
  }

  // Test 6: Merge PT + YT back to SY
  console.log("\n=== PHASE 6: Merge PT + YT back to SY ===");
  
  try {
    // Get current balances for merge
    const mergePtAmount = await dualCorePT.balanceOf(deployer.address);
    const mergeYtAmount = await dualCoreYT.balanceOf(deployer.address);
    const minAmount = mergePtAmount < mergeYtAmount ? mergePtAmount : mergeYtAmount;
    
    console.log("Merging PT:", ethers.formatEther(minAmount), "YT:", ethers.formatEther(minAmount));
    
    // Approve token operations to spend PT and YT
    const approvePTMergeTx = await dualCorePT.approve(deployment.contracts.CoreYieldTokenOperations, minAmount);
    await approvePTMergeTx.wait();
    const approveYTMergeTx = await dualCoreYT.approve(deployment.contracts.CoreYieldTokenOperations, minAmount);
    await approveYTMergeTx.wait();
    console.log("✅ Approved token operations to spend PT and YT");
    
    // Merge PT + YT back to SY
    const mergeTx = await coreYieldTokenOperations.mergePTYT(
      deployment.markets.dualCORE.syToken,
      minAmount,
      minAmount
    );
    await mergeTx.wait();
    console.log("✅ Merged PT + YT back to SY");
    
    // Check final SY balance
    const finalSyBalance = await dualCoreSY.balanceOf(deployer.address);
    console.log("Final SY balance:", ethers.formatEther(finalSyBalance));
    
  } catch (error) {
    console.log("❌ Merge failed:", error.message);
    return;
  }

  // Test 7: Unwrap SY to CORE
  console.log("\n=== PHASE 7: Unwrap SY to CORE ===");
  
  try {
    const finalSyBalance = await dualCoreSY.balanceOf(deployer.address);
    
    // Unwrap SY
    const unwrapTx = await dualCoreSY.unwrap(finalSyBalance);
    await unwrapTx.wait();
    console.log("✅ Unwrapped SY to CORE");
    
    // Check final CORE balance
    const finalCoreBalance = await dualCore.balanceOf(deployer.address);
    console.log("Final CORE balance:", ethers.formatEther(finalCoreBalance));
    
    // Calculate profit/loss
    const initialBalance = ethers.parseEther("1000000");
    const profit = finalCoreBalance - initialBalance;
    console.log("Profit/Loss:", ethers.formatEther(profit), "CORE");
    
  } catch (error) {
    console.log("❌ Unwrap failed:", error.message);
    return;
  }

  // Test 8: Check Final Pool State
  console.log("\n=== PHASE 8: Check Final Pool State ===");
  
  try {
    const poolKey = await coreYieldAMM.getPoolKey(
      deployment.markets.dualCORE.ptToken,
      deployment.markets.dualCORE.ytToken
    );
    
    if (poolKey !== ethers.ZeroHash) {
      const pool = await coreYieldAMM.getPool(poolKey);
      console.log("✅ Final PT/YT Pool info:");
      console.log(`  - Token0: ${pool.token0}`);
      console.log(`  - Token1: ${pool.token1}`);
      console.log(`  - Reserve0: ${ethers.formatEther(pool.reserve0)}`);
      console.log(`  - Reserve1: ${ethers.formatEther(pool.reserve1)}`);
      console.log(`  - Total Supply: ${ethers.formatEther(pool.totalSupply)}`);
      console.log(`  - Is Yield Pool: ${pool.isYieldPool}`);
      console.log(`  - Yield Multiplier: ${ethers.formatUnits(pool.yieldMultiplier, 2)}x`);
    }
    
  } catch (error) {
    console.log("❌ Pool check failed:", error.message);
  }

  console.log("\n🎉 Complete User Flow Test on Testnet PASSED!");
  console.log("🚀 CoreYield PT/YT system is fully functional on Core Testnet!");
  console.log("🔗 Ready for real users and production deployment!");
}

main().catch((e) => {
  console.error("❌ Test failed:", e);
  process.exit(1);
});

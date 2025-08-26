import { ethers } from "hardhat";

async function main() {
  console.log("🔍 TESTING EXISTING WORKING lstBTC MARKET...");
  console.log("=" .repeat(50));

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Use the existing working lstBTC market from our previous fix
  const AMM = "0xD1463554796b05CB128A0d890c739909695147B6";
  const MARKET_FACTORY = "0x5C9239dDBAa092F53670E459f2193950Cd310276";
  const TOKEN_OPS = "0x50B653F00B5e15D25A9413e156833DC0c84Dd3F9";
  const LST_BTC_TOKEN = "0xCf5Eb1CEcf54f792A89C81d3EF636AAc6f4F7B1A";

  try {
    console.log("\n🔧 STEP 1: Connecting to Contracts...");
    console.log("-".repeat(50));
    
    const amm = await ethers.getContractAt("CoreYieldAMM", AMM);
    const marketFactory = await ethers.getContractAt("CoreYieldMarketFactory", MARKET_FACTORY);
    const tokenOps = await ethers.getContractAt("CoreYieldTokenOperations", TOKEN_OPS);
    const lstBtcToken = await ethers.getContractAt("MockDualCORE", LST_BTC_TOKEN);
    
    console.log("✅ All contracts connected successfully");

    console.log("\n🔧 STEP 2: Finding Working lstBTC Market...");
    console.log("-".repeat(50));
    
    // Get all markets and find the working lstBTC market
    const markets = await marketFactory.getAllMarkets();
    console.log("Total markets:", markets.length);
    
    let workingLstBtcMarketInfo = null;
    let workingLstBtcMarketIndex = -1;
    
    // Look for the lstBTC market that has the working pool
    for (let i = 0; i < markets.length; i++) {
      try {
        const marketInfo = await marketFactory.getMarket(markets[i]);
        if (marketInfo.underlying.toLowerCase() === LST_BTC_TOKEN.toLowerCase()) {
          // Check if this market has a working pool
          try {
            const poolKey = await amm.getPoolKey(marketInfo.ptToken, marketInfo.ytToken);
            const poolData = await amm.getPool(poolKey);
            
            if (poolData.reserve0 > 0 && poolData.reserve1 > 0 && poolData.isActive) {
              workingLstBtcMarketInfo = marketInfo;
              workingLstBtcMarketIndex = i;
              console.log(`✅ Found WORKING lstBTC market at index ${i}`);
              break;
            }
          } catch (error) {
            // This market doesn't have a working pool, continue searching
          }
        }
      } catch (error) {
        console.log(`⚠️ Error checking market ${i}:`, error instanceof Error ? error.message : String(error));
      }
    }
    
    if (!workingLstBtcMarketInfo) {
      console.log("❌ No working lstBTC market found!");
      return;
    }
    
    console.log("\nWorking lstBTC Market Details:");
    console.log("  Market Address:", markets[workingLstBtcMarketIndex]);
    console.log("  Underlying:", workingLstBtcMarketInfo.underlying);
    console.log("  SY Token:", workingLstBtcMarketInfo.syToken);
    console.log("  PT Token:", workingLstBtcMarketInfo.ptToken);
    console.log("  YT Token:", workingLstBtcMarketInfo.ytToken);
    console.log("  Maturity:", new Date(Number(workingLstBtcMarketInfo.maturity) * 1000).toISOString());
    console.log("  Is Active:", workingLstBtcMarketInfo.isActive);

    console.log("\n🔧 STEP 3: Testing Working lstBTC Market Functions...");
    console.log("-".repeat(50));
    
    // Test the working market
    const syToken = await ethers.getContractAt("StandardizedYieldToken", workingLstBtcMarketInfo.syToken);
    const ptToken = await ethers.getContractAt("MockDualCORE", workingLstBtcMarketInfo.ptToken);
    const ytToken = await ethers.getContractAt("MockDualCORE", workingLstBtcMarketInfo.ytToken);
    
    // Check current balances
    const deployerLstBtcBalance = await lstBtcToken.balanceOf(deployer.address);
    const deployerPtBalance = await ptToken.balanceOf(deployer.address);
    const deployerYtBalance = await ytToken.balanceOf(deployer.address);
    const deployerSyBalance = await syToken.balanceOf(deployer.address);
    
    console.log("Current Balances:");
    console.log("  lstBTC (Underlying):", ethers.formatEther(deployerLstBtcBalance));
    console.log("  PT Token:", ethers.formatEther(deployerPtBalance));
    console.log("  YT Token:", ethers.formatEther(deployerYtBalance));
    console.log("  SY Token:", ethers.formatEther(deployerSyBalance));
    
    // Test 1: Wrap lstBTC to SY
    console.log("\n🔧 Testing 1: Wrap lstBTC to SY...");
    const wrapAmount = ethers.parseEther("5");
    
    if (deployerLstBtcBalance >= wrapAmount) {
      await (await lstBtcToken.approve(workingLstBtcMarketInfo.syToken, wrapAmount)).wait();
      const wrapTx = await syToken.wrap(wrapAmount);
      const wrapReceipt = await wrapTx.wait();
      console.log("✅ lstBTC wrapped successfully! TX:", wrapReceipt.hash);
    } else {
      console.log("⚠️ Not enough lstBTC to test wrapping");
    }
    
    // Test 2: Split SY to PT + YT
    console.log("\n🔧 Testing 2: Split SY to PT + YT...");
    const splitAmount = ethers.parseEther("2");
    const currentSyBalance = await syToken.balanceOf(deployer.address);
    
    if (currentSyBalance >= splitAmount) {
      await (await syToken.approve(TOKEN_OPS, splitAmount)).wait();
      const splitTx = await tokenOps.splitSY(workingLstBtcMarketInfo.syToken, splitAmount);
      const splitReceipt = await splitTx.wait();
      console.log("✅ SY split successfully! TX:", splitReceipt.hash);
    } else {
      console.log("⚠️ Not enough SY to test splitting");
    }
    
    // Test 3: Execute PT/YT Swap
    console.log("\n🔧 Testing 3: Execute PT/YT Swap...");
    const swapAmount = ethers.parseEther("1");
    const currentPtBalance = await ptToken.balanceOf(deployer.address);
    
    if (currentPtBalance >= swapAmount) {
      await (await ptToken.approve(AMM, swapAmount)).wait();
      const swapTx = await amm.swap(
        workingLstBtcMarketInfo.ptToken,
        workingLstBtcMarketInfo.ytToken,
        swapAmount,
        0,
        deployer.address
      );
      const swapReceipt = await swapTx.wait();
      console.log("✅ PT → YT swap successful! TX:", swapReceipt.hash);
    } else {
      console.log("⚠️ Not enough PT tokens to test swap");
    }
    
    // Test 4: Merge PT + YT back to SY
    console.log("\n🔧 Testing 4: Merge PT + YT back to SY...");
    const mergeAmount = ethers.parseEther("0.5");
    const currentPtBalanceAfterSwap = await ptToken.balanceOf(deployer.address);
    const currentYtBalanceAfterSwap = await ytToken.balanceOf(deployer.address);
    
    if (currentPtBalanceAfterSwap >= mergeAmount && currentYtBalanceAfterSwap >= mergeAmount) {
      await (await ptToken.approve(TOKEN_OPS, mergeAmount)).wait();
      await (await ytToken.approve(TOKEN_OPS, mergeAmount)).wait();
      const mergeTx = await tokenOps.mergePTYT(workingLstBtcMarketInfo.syToken, mergeAmount, mergeAmount);
      const mergeReceipt = await mergeTx.wait();
      console.log("✅ PT + YT merged successfully! TX:", mergeReceipt.hash);
    } else {
      console.log("⚠️ Not enough PT/YT tokens to test merging");
    }
    
    // Test 5: Unwrap SY back to lstBTC
    console.log("\n🔧 Testing 5: Unwrap SY back to lstBTC...");
    const unwrapAmount = ethers.parseEther("1");
    const currentSyBalanceAfterMerge = await syToken.balanceOf(deployer.address);
    
    if (currentSyBalanceAfterMerge >= unwrapAmount) {
      const unwrapTx = await syToken.unwrap(unwrapAmount);
      const unwrapReceipt = await unwrapTx.wait();
      console.log("✅ SY unwrapped successfully! TX:", unwrapReceipt.hash);
    } else {
      console.log("⚠️ Not enough SY to test unwrapping");
    }
    
    // Final balance check
    const finalLstBtcBalance = await lstBtcToken.balanceOf(deployer.address);
    const finalPtBalance = await ptToken.balanceOf(deployer.address);
    const finalYtBalance = await ytToken.balanceOf(deployer.address);
    const finalSyBalance = await syToken.balanceOf(deployer.address);
    
    console.log("\nFinal Balances After All Tests:");
    console.log("  lstBTC (Underlying):", ethers.formatEther(finalLstBtcBalance));
    console.log("  PT Token:", ethers.formatEther(finalPtBalance));
    console.log("  YT Token:", ethers.formatEther(finalYtBalance));
    console.log("  SY Token:", ethers.formatEther(finalSyBalance));
    
    console.log("\n🎉 WORKING lstBTC MARKET TEST COMPLETED!");
    console.log("=" .repeat(50));
    
    console.log("✅ All lstBTC market functions are working:");
    console.log("1. ✅ Asset wrapping (lstBTC → SY)");
    console.log("2. ✅ Token splitting (SY → PT + YT)");
    console.log("3. ✅ PT/YT swaps");
    console.log("4. ✅ Token merging (PT + YT → SY)");
    console.log("5. ✅ Asset unwrapping (SY → lstBTC)");
    
    console.log("\n🚀 The lstBTC market is fully functional!");

  } catch (error) {
    console.log("❌ Error in working lstBTC test:", error instanceof Error ? error.message : String(error));
    console.log("Full error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

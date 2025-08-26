import { ethers } from "hardhat";

async function main() {
  console.log("🔍 DEBUGGING lstBTC MARKET ISSUES...");
  console.log("=" .repeat(50));

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Contract addresses
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

    console.log("\n🔧 STEP 2: Finding lstBTC Market...");
    console.log("-".repeat(50));
    
    // Get all markets and find lstBTC market
    const markets = await marketFactory.getAllMarkets();
    console.log("Total markets:", markets.length);
    
    let lstBtcMarketInfo = null;
    let lstBtcMarketIndex = -1;
    
    for (let i = 0; i < markets.length; i++) {
      try {
        const marketInfo = await marketFactory.getMarket(markets[i]);
        if (marketInfo.underlying.toLowerCase() === LST_BTC_TOKEN.toLowerCase()) {
          lstBtcMarketInfo = marketInfo;
          lstBtcMarketIndex = i;
          console.log(`✅ Found lstBTC market at index ${i}`);
          break;
        }
      } catch (error) {
        console.log(`⚠️ Error checking market ${i}:`, error instanceof Error ? error.message : String(error));
      }
    }
    
    if (!lstBtcMarketInfo) {
      console.log("❌ lstBTC market not found!");
      return;
    }
    
    console.log("\nlstBTC Market Details:");
    console.log("  Market Address:", markets[lstBtcMarketIndex]);
    console.log("  Underlying:", lstBtcMarketInfo.underlying);
    console.log("  SY Token:", lstBtcMarketInfo.syToken);
    console.log("  PT Token:", lstBtcMarketInfo.ptToken);
    console.log("  YT Token:", lstBtcMarketInfo.ytToken);
    console.log("  Maturity:", new Date(Number(lstBtcMarketInfo.maturity) * 1000).toISOString());
    console.log("  Is Active:", lstBtcMarketInfo.isActive);

    console.log("\n🔧 STEP 3: Checking Pool Status...");
    console.log("-".repeat(50));
    
    // Check if pool exists
    try {
      const poolKey = await amm.getPoolKey(lstBtcMarketInfo.ptToken, lstBtcMarketInfo.ytToken);
      console.log("✅ Pool key generated:", poolKey);
      
      const poolData = await amm.getPool(poolKey);
      console.log("\nPool Data:");
      console.log("  Token0:", poolData.token0);
      console.log("  Token1:", poolData.token1);
      console.log("  Reserve0:", ethers.formatEther(poolData.reserve0));
      console.log("  Reserve1:", ethers.formatEther(poolData.reserve1));
      console.log("  Total Supply:", ethers.formatEther(poolData.totalSupply));
      console.log("  Is Active:", poolData.isActive);
      console.log("  Trading Fee:", poolData.tradingFee);
      
      // Check which token is which
      const ptToken = await ethers.getContractAt("MockDualCORE", lstBtcMarketInfo.ptToken);
      const ytToken = await ethers.getContractAt("MockDualCORE", lstBtcMarketInfo.ytToken);
      
      const ptSymbol = await ptToken.symbol();
      const ytSymbol = await ytToken.symbol();
      
      console.log("\nToken Mapping:");
      console.log("  Reserve0 (", ptSymbol, "):", ethers.formatEther(poolData.reserve0));
      console.log("  Reserve1 (", ytSymbol, "):", ethers.formatEther(poolData.reserve1));
      
      if (poolData.reserve0 > 0 || poolData.reserve1 > 0) {
        console.log("✅ Pool has some liquidity");
      } else {
        console.log("❌ Pool has NO liquidity!");
      }
      
    } catch (error) {
      console.log("❌ Error checking pool:", error instanceof Error ? error.message : String(error));
    }

    console.log("\n🔧 STEP 4: Checking Token Balances...");
    console.log("-".repeat(50));
    
    // Check deployer balances
    const deployerLstBtcBalance = await lstBtcToken.balanceOf(deployer.address);
    const deployerPtBalance = await (await ethers.getContractAt("MockDualCORE", lstBtcMarketInfo.ptToken)).balanceOf(deployer.address);
    const deployerYtBalance = await (await ethers.getContractAt("MockDualCORE", lstBtcMarketInfo.ytToken)).balanceOf(deployer.address);
    
    console.log("Deployer Balances:");
    console.log("  lstBTC (Underlying):", ethers.formatEther(deployerLstBtcBalance));
    console.log("  PT Token:", ethers.formatEther(deployerPtBalance));
    console.log("  YT Token:", ethers.formatEther(deployerYtBalance));
    
    // Check AMM balances
    const ammLstBtcBalance = await lstBtcToken.balanceOf(AMM);
    const ammPtBalance = await (await ethers.getContractAt("MockDualCORE", lstBtcMarketInfo.ptToken)).balanceOf(AMM);
    const ammYtBalance = await (await ethers.getContractAt("MockDualCORE", lstBtcMarketInfo.ytToken)).balanceOf(AMM);
    
    console.log("\nAMM Contract Balances:");
    console.log("  lstBTC (Underlying):", ethers.formatEther(ammLstBtcBalance));
    console.log("  PT Token:", ethers.formatEther(ammPtBalance));
    console.log("  YT Token:", ethers.formatEther(ammYtBalance));

    console.log("\n🔧 STEP 5: Checking SY Token Status...");
    console.log("-".repeat(50));
    
    // Check SY token
    const syToken = await ethers.getContractAt("StandardizedYieldToken", lstBtcMarketInfo.syToken);
    const deployerSyBalance = await syToken.balanceOf(deployer.address);
    const syTotalSupply = await syToken.totalSupply();
    
    console.log("SY Token Status:");
    console.log("  Deployer SY Balance:", ethers.formatEther(deployerSyBalance));
    console.log("  SY Total Supply:", ethers.formatEther(syTotalSupply));

    console.log("\n🔧 STEP 6: Testing Basic Functions...");
    console.log("-".repeat(50));
    
    // Test if we can call basic functions
    try {
      console.log("Testing PT token transfer...");
      const ptToken = await ethers.getContractAt("MockDualCORE", lstBtcMarketInfo.ptToken);
      const transferAmount = ethers.parseEther("1");
      
      if (deployerPtBalance >= transferAmount) {
        console.log("✅ Have enough PT tokens to test transfer");
        
        // Try to transfer 1 PT token to AMM
        await (await ptToken.approve(AMM, transferAmount)).wait();
        console.log("✅ PT tokens approved for AMM");
        
        // Try to estimate gas for a swap
        try {
          const gasEstimate = await amm.swap.estimateGas(
            lstBtcMarketInfo.ptToken,
            lstBtcMarketInfo.ytToken,
            transferAmount,
            0,
            deployer.address
          );
          console.log("✅ Gas estimation successful:", gasEstimate.toString());
        } catch (error) {
          console.log("❌ Gas estimation failed:", error instanceof Error ? error.message : String(error));
        }
      } else {
        console.log("❌ Not enough PT tokens to test transfer");
      }
    } catch (error) {
      console.log("❌ Error testing basic functions:", error instanceof Error ? error.message : String(error));
    }

    console.log("\n🔧 STEP 7: Summary of Issues...");
    console.log("-".repeat(50));
    
    console.log("Based on the investigation, here are the likely issues:");

    console.log("\n🔧 STEP 8: Recommended Fixes...");
    console.log("-".repeat(50));
    
    console.log("To fix the lstBTC market:");
    console.log("1. 🔧 Re-add liquidity to the existing pool");
    console.log("2. 🔧 Or remove the pool and recreate it");
    console.log("3. 🔧 Ensure proper token approvals before liquidity addition");
    console.log("4. 🔧 Verify token transfers actually occur");

  } catch (error) {
    console.log("❌ Error in debug script:", error instanceof Error ? error.message : String(error));
    console.log("Full error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

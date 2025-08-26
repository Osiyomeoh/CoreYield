import { ethers } from "hardhat";

async function main() {
  console.log("🔍 INVESTIGATING LSTBTC MARKETS AND POOLS!");
  console.log("=" .repeat(50));

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Contract addresses
  const ROUTER = "0xF1F1C951036D9cCD9297Da837201970eEc88495e";
  const AMM = "0xD1463554796b05CB128A0d890c739909695147B6";
  const MARKET_FACTORY = "0x5C9239dDBAa092F53670E459f2193950Cd310276";
  const LST_BTC_TOKEN = "0xCf5Eb1CEcf54f792A89C81d3EF636AAc6f4F7B1A";

  try {
    console.log("\n🔧 STEP 1: Connecting to Contracts...");
    console.log("-".repeat(40));
    
    const router = await ethers.getContractAt("CoreYieldRouter", ROUTER);
    const amm = await ethers.getContractAt("CoreYieldAMM", AMM);
    const marketFactory = await ethers.getContractAt("CoreYieldMarketFactory", MARKET_FACTORY);
    const lstBtcToken = await ethers.getContractAt("MockDualCORE", LST_BTC_TOKEN);
    
    console.log("✅ All contracts connected successfully");

    console.log("\n🔧 STEP 2: Finding lstBTC Markets...");
    console.log("-".repeat(40));
    
    // Get all markets and find lstBTC ones
    const markets = await marketFactory.getAllMarkets();
    console.log("Total markets available:", markets.length);
    
    let lstBtcMarkets = [];
    
    for (let i = 0; i < markets.length; i++) {
      try {
        const marketInfo = await marketFactory.getMarket(markets[i]);
        
        // Check if this is an lstBTC market
        if (marketInfo.underlying.toLowerCase() === LST_BTC_TOKEN.toLowerCase()) {
          lstBtcMarkets.push({
            index: i,
            marketAddress: markets[i],
            marketInfo: marketInfo
          });
          console.log(`✅ lstBTC market found at index ${i}`);
        }
      } catch (error) {
        // Skip markets with errors
      }
    }
    
    console.log(`\nFound ${lstBtcMarkets.length} lstBTC markets`);
    
    if (lstBtcMarkets.length === 0) {
      console.log("❌ No lstBTC markets found!");
      return;
    }

    console.log("\n🔧 STEP 3: Analyzing lstBTC Market Details...");
    console.log("-".repeat(40));
    
    // Analyze each lstBTC market
    for (let marketIndex = 0; marketIndex < lstBtcMarkets.length; marketIndex++) {
      const market = lstBtcMarkets[marketIndex];
      
      console.log(`\n🔧 lstBTC Market ${marketIndex + 1} (Index ${market.index})...`);
      console.log("-".repeat(35));
      
      console.log("Market Address:", market.marketAddress);
      console.log("Underlying Token:", market.marketInfo.underlying);
      console.log("SY Token:", market.marketInfo.syToken);
      console.log("PT Token:", market.marketInfo.ptToken);
      console.log("YT Token:", market.marketInfo.ytToken);
      console.log("Maturity:", new Date(Number(market.marketInfo.maturity) * 1000).toISOString());
      
      // Check pool status
      try {
        const poolKey = await amm.getPoolKey(market.marketInfo.ptToken, market.marketInfo.ytToken);
        console.log("Pool Key:", poolKey);
        
        if (poolKey !== ethers.ZeroAddress) {
          const poolData = await amm.getPool(poolKey);
          console.log("\nPool Data:");
          console.log("  Token0:", poolData.token0);
          console.log("  Token1:", poolData.token1);
          console.log("  Reserve0:", ethers.formatEther(poolData.reserve0));
          console.log("  Reserve1:", ethers.formatEther(poolData.reserve1));
          console.log("  Total Supply:", ethers.formatEther(poolData.totalSupply));
          console.log("  Is Active:", poolData.isActive);
          console.log("  Trading Fee:", poolData.tradingFee);
          
          if (poolData.reserve0 > 0 && poolData.reserve1 > 0 && poolData.isActive) {
            console.log("✅ Pool is ACTIVE and has LIQUIDITY!");
          } else if (poolData.reserve0 === 0n && poolData.reserve1 === 0n) {
            console.log("⚠️ Pool exists but has NO LIQUIDITY");
          } else if (!poolData.isActive) {
            console.log("❌ Pool exists but is INACTIVE");
          }
        } else {
          console.log("❌ Pool Key is ZERO - No pool created!");
        }
      } catch (error) {
        console.log("❌ Error checking pool:", error instanceof Error ? error.message : String(error));
      }
      
      // Check token balances
      try {
        const syToken = await ethers.getContractAt("StandardizedYieldToken", market.marketInfo.syToken);
        const ptToken = await ethers.getContractAt("MockDualCORE", market.marketInfo.ptToken);
        const ytToken = await ethers.getContractAt("MockDualCORE", market.marketInfo.ytToken);
        
        const deployerSyBalance = await syToken.balanceOf(deployer.address);
        const deployerPtBalance = await ptToken.balanceOf(deployer.address);
        const deployerYtBalance = await ytToken.balanceOf(deployer.address);
        
        console.log("\nDeployer Token Balances:");
        console.log("  SY Token:", ethers.formatEther(deployerSyBalance));
        console.log("  PT Token:", ethers.formatEther(deployerPtBalance));
        console.log("  YT Token:", ethers.formatEther(deployerYtBalance));
        
        // Check if we can test basic operations
        if (deployerSyBalance > 0) {
          console.log("✅ Can test SY operations");
        } else {
          console.log("⚠️ No SY tokens to test operations");
        }
        
        if (deployerPtBalance > 0 && deployerYtBalance > 0) {
          console.log("✅ Can test PT/YT operations");
        } else {
          console.log("⚠️ No PT/YT tokens to test operations");
        }
        
      } catch (error) {
        console.log("❌ Error checking token balances:", error instanceof Error ? error.message : String(error));
      }
    }

    console.log("\n🔧 STEP 4: Testing lstBTC Market Operations...");
    console.log("-".repeat(40));
    
    // Test the first lstBTC market if it has liquidity
    if (lstBtcMarkets.length > 0) {
      const firstMarket = lstBtcMarkets[0];
      
      try {
        const poolKey = await amm.getPoolKey(firstMarket.marketInfo.ptToken, firstMarket.marketInfo.ytToken);
        
        if (poolKey !== ethers.ZeroAddress) {
          const poolData = await amm.getPool(poolKey);
          
          if (poolData.reserve0 > 0 && poolData.reserve1 > 0 && poolData.isActive) {
            console.log("\n🎯 Testing lstBTC Market Operations...");
            
            // Test wrap
            const syToken = await ethers.getContractAt("StandardizedYieldToken", firstMarket.marketInfo.syToken);
            const underlyingToken = await ethers.getContractAt("MockDualCORE", firstMarket.marketInfo.underlying);
            
            const wrapAmount = ethers.parseEther("1");
            const currentBalance = await underlyingToken.balanceOf(deployer.address);
            
            if (currentBalance >= wrapAmount) {
              console.log("Testing wrap operation...");
              await (await underlyingToken.approve(firstMarket.marketInfo.syToken, wrapAmount)).wait();
              const wrapTx = await syToken.wrap(wrapAmount);
              await wrapTx.wait();
              console.log("✅ Wrap operation successful!");
            } else {
              console.log("⚠️ Not enough underlying tokens to test wrap");
            }
            
          } else {
            console.log("\n⚠️ lstBTC market pool has no liquidity - cannot test operations");
            console.log("This explains why it wasn't in the working markets list!");
          }
        } else {
          console.log("\n❌ lstBTC market has no pool - cannot test operations");
        }
        
      } catch (error) {
        console.log("❌ Error testing lstBTC operations:", error instanceof Error ? error.message : String(error));
      }
    }

    console.log("\n🔍 LSTBTC INVESTIGATION COMPLETE!");
    console.log("=" .repeat(50));

  } catch (error) {
    console.log("❌ Error in lstBTC investigation:", error instanceof Error ? error.message : String(error));
    console.log("Full error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

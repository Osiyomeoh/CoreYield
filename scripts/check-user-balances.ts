import { ethers } from "hardhat";

async function main() {
  console.log("🔍 CHECKING USER BALANCES FOR DEBUGGING!");
  console.log("=" .repeat(50));

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Contract addresses
  const CORE_TOKEN = "0xCf5Eb1CEcf54f792A89C81d3EF636AAc6f4F7B1A";
  const ST_CORE_TOKEN = "0x4D6B4EC6dD26aA2F65e825C9F4Be2F3980506Ba7";
  const MARKET_FACTORY = "0x5C9239dDBAa092F53670E459f2193950Cd310276";

  try {
    console.log("\n🔧 STEP 1: Checking Token Balances...");
    console.log("-".repeat(40));
    
    const coreToken = await ethers.getContractAt("MockDualCORE", CORE_TOKEN);
    const stCoreToken = await ethers.getContractAt("MockDualCORE", ST_CORE_TOKEN);
    
    const coreBalance = await coreToken.balanceOf(deployer.address);
    const stCoreBalance = await stCoreToken.balanceOf(deployer.address);
    
    console.log("Token Balances:");
    console.log("  CORE:", ethers.formatEther(coreBalance));
    console.log("  stCORE:", ethers.formatEther(stCoreBalance));

    console.log("\n🔧 STEP 2: Checking SY Token Balances...");
    console.log("-".repeat(40));
    
    const marketFactory = await ethers.getContractAt("CoreYieldMarketFactory", MARKET_FACTORY);
    const markets = await marketFactory.getAllMarkets();
    
    console.log(`Found ${markets.length} markets`);
    
    for (let i = 0; i < Math.min(3, markets.length); i++) {
      try {
        const market = await marketFactory.getMarket(markets[i]);
        const syToken = await ethers.getContractAt("StandardizedYieldToken", market.syToken);
        const syBalance = await syToken.balanceOf(deployer.address);
        
        console.log(`Market ${i}:`);
        console.log(`  SY Token: ${market.syToken}`);
        console.log(`  SY Balance: ${ethers.formatEther(syBalance)}`);
        console.log(`  Underlying: ${market.underlying}`);
      } catch (error) {
        console.log(`Market ${i}: Error - ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    console.log("\n🔧 STEP 3: Checking Token Allowances...");
    console.log("-".repeat(40));
    
    // Check allowances for the first market
    if (markets.length > 0) {
      const firstMarket = await marketFactory.getMarket(markets[0]);
      const syToken = await ethers.getContractAt("StandardizedYieldToken", firstMarket.syToken);
      
      const coreAllowance = await coreToken.allowance(deployer.address, firstMarket.syToken);
      const stCoreAllowance = await stCoreToken.allowance(deployer.address, firstMarket.syToken);
      
      console.log("Allowances for first market:");
      console.log("  CORE allowance:", ethers.formatEther(coreAllowance));
      console.log("  stCORE allowance:", ethers.formatEther(stCoreAllowance));
    }

    console.log("\n🔧 STEP 4: Network Information...");
    console.log("-".repeat(40));
    
    const network = await ethers.provider.getNetwork();
    console.log("Connected Network:");
    console.log("  Chain ID:", network.chainId);
    console.log("  Name:", network.name);
    
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log("  Current Block:", blockNumber);

    console.log("\n🎯 FRONTEND DEBUGGING INFO:");
    console.log("=" .repeat(50));
    console.log("✅ If you see token balances above, the issue is:");
    console.log("   1. Frontend not connected to correct account");
    console.log("   2. Frontend not connected to Core Testnet");
    console.log("   3. Frontend needs refresh after contract updates");
    console.log("\n🔧 To fix:");
    console.log("   1. Connect wallet to Core Testnet (Chain ID: 1114)");
    console.log("   2. Make sure account matches:", deployer.address);
    console.log("   3. Refresh frontend and reconnect wallet");

  } catch (error) {
    console.log("❌ Error checking balances:", error instanceof Error ? error.message : String(error));
    console.log("Full error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

import { ethers } from "hardhat";

async function main() {
  console.log("🪙 MINTING TOKENS FOR FRONTEND TESTING!");
  console.log("=" .repeat(50));

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Contract addresses from our working deployment
  const CORE_TOKEN = "0xCf5Eb1CEcf54f792A89C81d3EF636AAc6f4F7B1A";
  const ST_CORE_TOKEN = "0x4D6B4EC6dD26aA2F65e825C9F4Be2F3980506Ba7";
  const ROUTER = "0xF1F1C951036D9cCD9297Da837201970eEc88495e";

  try {
    console.log("\n🔧 STEP 1: Connecting to Token Contracts...");
    console.log("-".repeat(40));
    
    const coreToken = await ethers.getContractAt("MockDualCORE", CORE_TOKEN);
    const stCoreToken = await ethers.getContractAt("MockDualCORE", ST_CORE_TOKEN);
    const router = await ethers.getContractAt("CoreYieldRouter", ROUTER);
    
    console.log("✅ All contracts connected successfully");

    console.log("\n🔧 STEP 2: Checking Current Balances...");
    console.log("-".repeat(40));
    
    const currentCoreBalance = await coreToken.balanceOf(deployer.address);
    const currentStCoreBalance = await stCoreToken.balanceOf(deployer.address);
    
    console.log("Current Balances:");
    console.log("  CORE:", ethers.formatEther(currentCoreBalance));
    console.log("  stCORE:", ethers.formatEther(currentStCoreBalance));

    console.log("\n🔧 STEP 3: Minting Tokens for Testing...");
    console.log("-".repeat(40));
    
    // Mint substantial amounts for testing
    const mintAmount = ethers.parseEther("10000"); // 10,000 tokens
    
    console.log("Minting CORE tokens...");
    const coreMintTx = await coreToken.mint(deployer.address, mintAmount);
    await coreMintTx.wait();
    console.log("✅ CORE tokens minted successfully!");
    
    console.log("Minting stCORE tokens...");
    const stCoreMintTx = await stCoreToken.mint(deployer.address, mintAmount);
    await stCoreMintTx.wait();
    console.log("✅ stCORE tokens minted successfully!");

    console.log("\n🔧 STEP 4: Verifying New Balances...");
    console.log("-".repeat(40));
    
    const newCoreBalance = await coreToken.balanceOf(deployer.address);
    const newStCoreBalance = await stCoreToken.balanceOf(deployer.address);
    
    console.log("New Balances:");
    console.log("  CORE:", ethers.formatEther(newCoreBalance));
    console.log("  stCORE:", ethers.formatEther(newStCoreBalance));

    console.log("\n🔧 STEP 5: Testing Basic Operations...");
    console.log("-".repeat(40));
    
    // Test wrapping some CORE to SY
    const testAmount = ethers.parseEther("100");
    
    // Get the first working lstBTC market for testing
    const marketFactory = await ethers.getContractAt("CoreYieldMarketFactory", "0x5C9239dDBAa092F53670E459f2193950Cd310276");
    const markets = await marketFactory.getAllMarkets();
    const firstMarket = await marketFactory.getMarket(markets[0]);
    
    console.log("Testing wrap operation with first market...");
    console.log("Market SY Token:", firstMarket.syToken);
    
    // Approve and wrap
    await (await coreToken.approve(firstMarket.syToken, testAmount)).wait();
    const syToken = await ethers.getContractAt("StandardizedYieldToken", firstMarket.syToken);
    const wrapTx = await syToken.wrap(testAmount);
    await wrapTx.wait();
    
    const syBalance = await syToken.balanceOf(deployer.address);
    console.log("✅ Wrapped CORE to SY successfully!");
    console.log("  SY Balance:", ethers.formatEther(syBalance));

    console.log("\n🎉 TOKEN MINTING AND TESTING COMPLETED! 🎉");
    console.log("=" .repeat(50));
    
    console.log("✅ Frontend should now show:");
    console.log("  CORE: ~10,000 tokens");
    console.log("  stCORE: ~10,000 tokens");
    console.log("  SY (lstBTC): ~100 tokens");
    console.log("\n🚀 You can now test the frontend with real token balances!");

  } catch (error) {
    console.log("❌ Error in token minting:", error instanceof Error ? error.message : String(error));
    console.log("Full error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

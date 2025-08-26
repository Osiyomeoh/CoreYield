import { ethers } from "hardhat";

async function main() {
  console.log("🎯 Getting Tokens for Liquidity...");
  console.log("=" .repeat(45));

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const TOKEN_OWNER = "0x3d6A972038C071238Da0D9984c6f95aE956ca726";
  const PT_TOKEN = "0xf2fFE9D7226F440f3763Fb63A4Dc5483ab675098";
  const YT_TOKEN = "0xADeC3c3A2d07D02a2718E10c311121eA9a94C601";

  try {
    console.log("\n🔍 Checking Token Owner Balances...");
    console.log("-".repeat(40));
    
    // Check if the token owner has tokens
    for (const token of [
      { name: "PT Token", address: PT_TOKEN },
      { name: "YT Token", address: YT_TOKEN }
    ]) {
      try {
        const mockToken = await ethers.getContractAt("MockDualCORE", token.address);
        const balance = await mockToken.balanceOf(TOKEN_OWNER);
        const symbol = await mockToken.symbol();
        console.log(`${token.name} (${symbol}): ${ethers.formatEther(balance)}`);
      } catch (error) {
        console.log(`❌ Error checking ${token.name}:`, error instanceof Error ? error.message : String(error));
      }
    }

    console.log("\n🤝 Attempting to Get Tokens from Owner...");
    console.log("-".repeat(40));
    
    // Check if we can impersonate the token owner (for testing)
    console.log("Token Owner:", TOKEN_OWNER);
    console.log("Deployer:", deployer.address);
    
    // Try to get some tokens by asking the owner to mint for us
    console.log("\n📝 Checking if we can get tokens...");
    
    // Option 1: Check if deployer can somehow get tokens
    try {
      const ptToken = await ethers.getContractAt("MockDualCORE", PT_TOKEN);
      const ytToken = await ethers.getContractAt("MockDualCORE", YT_TOKEN);
      
      // Check if deployer has any tokens
      const ptBalance = await ptToken.balanceOf(deployer.address);
      const ytBalance = await ytToken.balanceOf(deployer.address);
      
      console.log(`Deployer PT Balance: ${ethers.formatEther(ptBalance)}`);
      console.log(`Deployer YT Balance: ${ethers.formatEther(ytBalance)}`);
      
      if (ptBalance > 0 || ytBalance > 0) {
        console.log("✅ Deployer already has some tokens!");
      } else {
        console.log("❌ Deployer has no tokens");
      }
      
    } catch (error) {
      console.log("❌ Error checking deployer balances:", error instanceof Error ? error.message : String(error));
    }

    // Option 2: Check if we can use a different account
    console.log("\n🔍 Checking Other Accounts...");
    console.log("-".repeat(40));
    
    // Get all signers
    const signers = await ethers.getSigners();
    console.log(`Found ${signers.length} signers`);
    
    for (let i = 0; i < Math.min(signers.length, 5); i++) {
      const signer = signers[i];
      try {
        const ptToken = await ethers.getContractAt("MockDualCORE", PT_TOKEN);
        const ytToken = await ethers.getContractAt("MockDualCORE", YT_TOKEN);
        
        const ptBalance = await ptToken.balanceOf(signer.address);
        const ytBalance = await ytToken.balanceOf(signer.address);
        
        if (ptBalance > 0 || ytBalance > 0) {
          console.log(`✅ Signer ${i} (${signer.address}) has tokens:`);
          console.log(`   PT: ${ethers.formatEther(ptBalance)}`);
          console.log(`   YT: ${ethers.formatEther(ytBalance)}`);
          
          // This signer can be used to add liquidity
          console.log(`   🎯 Use this signer to add liquidity!`);
        }
      } catch (error) {
        console.log(`❌ Error checking signer ${i}:`, error instanceof Error ? error.message : String(error));
      }
    }

    // Option 3: Check if we can create a simple test scenario
    console.log("\n🧪 Creating Test Scenario...");
    console.log("-".repeat(40));
    
    console.log("If no signers have tokens, we can:");
    console.log("1. Deploy new mock tokens with minting capability");
    console.log("2. Create simple test pools with these tokens");
    console.log("3. Test the swap functionality");
    console.log("4. Then apply the same logic to real tokens");

    console.log("\n💡 RECOMMENDED NEXT STEPS:");
    console.log("1. Check if any signer has tokens");
    console.log("2. If yes, use that signer to add liquidity");
    console.log("3. If no, create a simple test scenario");
    console.log("4. Test swaps with test tokens first");

  } catch (error) {
    console.log("❌ Error in main process:", error instanceof Error ? error.message : String(error));
    console.log("Full error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

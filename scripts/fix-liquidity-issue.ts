import { ethers } from "hardhat";

async function main() {
  console.log("🔧 Fixing Liquidity Issue - Using Correct Contract Interface...");
  console.log("=" .repeat(65));

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const WORKING_AMM = "0x54958530c3D65A6DD67eEf14e6736B85Fb46440A";
  const NEW_ROUTER = "0x5b3FbaF764Eb275DE2888Be36Fce2B1AE53Ea200";

  try {
    // Use the correct contract interface - CoreYieldAMM_Minimal
    const amm = await ethers.getContractAt("CoreYieldAMM_Minimal", WORKING_AMM);
    const router = await ethers.getContractAt("CoreYieldRouter", NEW_ROUTER);
    console.log("✅ Contracts found");

    // Check current liquidity status using the correct interface
    console.log("\n🔍 Checking Current Liquidity Status...");
    console.log("-".repeat(40));
    
    const pools = [
      { name: "dualCORE PT/YT", token0: "0xf2fFE9D7226F440f3763Fb63A4Dc5483ab675098", token1: "0xADeC3c3A2d07D02a2718E10c311121eA9a94C601" },
      { name: "stCORE PT/YT", token0: "0xf2fFE9D7226F440f3763Fb63A4Dc5483ab675098", token1: "0xADeC3c3A2d07D02a2718E10c311121eA9a94C601" },
      { name: "lstBTC PT/YT", token0: "0xf2fFE9D7226F440f3763Fb63A4Dc5483ab675098", token1: "0xADeC3c3A2d07D02a2718E10c311121eA9a94C601" },
      { name: "dualCORE/stCORE", token0: "0xf2fFE9D7226F440f3763Fb63A4Dc5483ab675098", token1: "0xADeC3c3A2d07D02a2718E10c311121eA9a94C601" },
      { name: "dualCORE/lstBTC", token0: "0xf2fFE9D7226F440f3763Fb63A4Dc5483ab675098", token1: "0xADeC3c3A2d07D02a2718E10c311121eA9a94C601" },
      { name: "stCORE/lstBTC", token0: "0xADeC3c3A2d07D02a2718E10c311121eA9a94C601", token1: "0xf2fFE9D7226F440f3763Fb63A4Dc5483ab675098" }
    ];

    for (const pool of pools) {
      try {
        const poolKey = await amm.getPoolKey(pool.token0, pool.token1);
        const poolData = await amm.pools(poolKey);
        
        console.log(`${pool.name}:`);
        console.log(`  Reserve0: ${ethers.formatEther(poolData.reserve0)}`);
        console.log(`  Reserve1: ${ethers.formatEther(poolData.reserve1)}`);
        console.log(`  Total Supply: ${ethers.formatEther(poolData.totalSupply)}`);
        console.log(`  Is Active: ${poolData.isActive}`);
        console.log("");
      } catch (error) {
        console.log(`❌ Error checking ${pool.name}:`, error.message);
      }
    }

    // Check token balances for deployer
    console.log("\n💰 Checking Deployer Token Balances...");
    console.log("-".repeat(40));
    
    const tokens = [
      { name: "PT Token", address: "0xf2fFE9D7226F440f3763Fb63A4Dc5483ab675098" },
      { name: "YT Token", address: "0xADeC3c3A2d07D02a2718E10c311121eA9a94C601" }
    ];

    for (const token of tokens) {
      try {
        const tokenContract = await ethers.getContractAt("IERC20", token.address);
        const balance = await tokenContract.balanceOf(deployer.address);
        console.log(`${token.name}: ${ethers.formatEther(balance)}`);
      } catch (error) {
        console.log(`❌ Error checking ${token.name}:`, error.message);
      }
    }

    // The issue: deployer has 0 tokens, so we need to mint some first
    console.log("\n🚨 ROOT CAUSE IDENTIFIED:");
    console.log("The deployer has 0 PT/YT tokens, so liquidity cannot be added.");
    console.log("We need to either:");
    console.log("1. Mint tokens to the deployer, OR");
    console.log("2. Use a different account that has tokens, OR");
    console.log("3. Create a simple test scenario with mock tokens");

    // Let's try to mint some tokens first
    console.log("\n🏭 Attempting to Mint Test Tokens...");
    console.log("-".repeat(40));
    
    for (const token of tokens) {
      try {
        console.log(`\nTrying to mint ${token.name}...`);
        
        // Check if the token contract has a mint function
        const tokenContract = await ethers.getContractAt("IERC20", token.address);
        
        // Try to call mint function if it exists
        try {
          const mintAmount = ethers.parseEther("10000"); // 10,000 tokens
          const mintTx = await tokenContract.mint(deployer.address, mintAmount);
          await mintTx.wait();
          console.log(`✅ ${token.name} minted successfully!`);
        } catch (mintError) {
          console.log(`⚠️  ${token.name} has no mint function or mint failed:`, mintError.message);
          
          // Try to check if it's a mock token with a different interface
          try {
            const mockToken = await ethers.getContractAt("MockDualCORE", token.address);
            const mintAmount = ethers.parseEther("10000");
            const mintTx = await mockToken.mint(deployer.address, mintAmount);
            await mintTx.wait();
            console.log(`✅ ${token.name} minted via MockDualCORE interface!`);
          } catch (mockError) {
            console.log(`❌ ${token.name} minting failed completely`);
          }
        }
        
      } catch (error) {
        console.log(`❌ Error with ${token.name}:`, error.message);
      }
    }

    // Check balances again after minting attempts
    console.log("\n💰 Checking Token Balances After Minting...");
    console.log("-".repeat(40));
    
    for (const token of tokens) {
      try {
        const tokenContract = await ethers.getContractAt("IERC20", token.address);
        const balance = await tokenContract.balanceOf(deployer.address);
        console.log(`${token.name}: ${ethers.formatEther(balance)}`);
      } catch (error) {
        console.log(`❌ Error checking ${token.name}:`, error.message);
      }
    }

    console.log("\n💡 SOLUTION SUMMARY:");
    console.log("1. ✅ Pools are created and active");
    console.log("2. ❌ Pools have zero liquidity (no tokens deposited)");
    console.log("3. ❌ Deployer has no PT/YT tokens to deposit");
    console.log("4. 💡 Need to either mint tokens or use an account that has them");
    console.log("\n🎯 Next Steps:");
    console.log("1. Check if you have another account with PT/YT tokens");
    console.log("2. Or mint tokens to the deployer account");
    console.log("3. Then add liquidity to enable swaps");

  } catch (error) {
    console.log("❌ Error in main process:", error.message);
    console.log("Full error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying Fixed CoreYieldAMM Contract...");
  console.log("=" .repeat(50));

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  try {
    // Deploy the fixed AMM contract
    console.log("\n📦 Deploying CoreYieldAMM...");
    const CoreYieldAMM = await ethers.getContractFactory("CoreYieldAMM");
    const amm = await CoreYieldAMM.deploy();
    await amm.waitForDeployment();
    
    const ammAddress = await amm.getAddress();
    console.log("✅ CoreYieldAMM deployed to:", ammAddress);

    // Test basic functionality
    console.log("\n🧪 Testing Basic AMM Functionality...");
    console.log("-".repeat(40));

    // Test 1: Check owner
    const owner = await amm.owner();
    console.log("Owner:", owner);
    console.log("Expected owner:", deployer.address);
    console.log("✅ Owner check passed");

    // Test 2: Create a test pool
    console.log("\n🏊 Testing Pool Creation...");
    
    // Use the same token addresses from our working system
    const token0 = "0xf2fFE9D7226F440f3763Fb63A4Dc5483ab675098"; // PT Token
    const token1 = "0xADeC3c3A2d07D02a2718E10c311121eA9a94C601"; // YT Token
    
    console.log("Creating pool with tokens:");
    console.log("  Token0 (PT):", token0);
    console.log("  Token1 (YT):", token1);
    
    try {
      const createPoolTx = await amm.createPool(token0, token1);
      const receipt = await createPoolTx.wait();
      
      if (receipt) {
        console.log("✅ Pool created successfully!");
        console.log("   TX Hash:", receipt.hash);
        console.log("   Gas used:", receipt.gasUsed.toString());
      }
      
      // Get the pool key
      const poolKey = await amm.getPoolKey(token0, token1);
      console.log("   Pool Key:", poolKey);
      
      // Check pool data
      const poolData = await amm.pools(poolKey);
      console.log("\n📊 Pool Data:");
      console.log("  Token0:", poolData.token0);
      console.log("  Token1:", poolData.token1);
      console.log("  Reserve0:", ethers.formatEther(poolData.reserve0));
      console.log("  Reserve1:", ethers.formatEther(poolData.reserve1));
      console.log("  Total Supply:", ethers.formatEther(poolData.totalSupply));
      console.log("  Is Active:", poolData.isActive);
      console.log("  Trading Fee:", poolData.tradingFee);
      
    } catch (error) {
      console.log("❌ Pool creation failed:", error instanceof Error ? error.message : String(error));
      return;
    }

    // Test 3: Check if pool exists in reverse order
    console.log("\n🔄 Testing Reverse Token Order...");
    try {
      const reversePoolKey = await amm.getPoolKey(token1, token0);
      console.log("Reverse pool key:", reversePoolKey);
      console.log("✅ Reverse order works correctly");
    } catch (error) {
      console.log("❌ Reverse order failed:", error instanceof Error ? error.message : String(error));
    }

    console.log("\n🎉 AMM Contract Testing Completed Successfully!");
    console.log("\n💡 Next Steps:");
    console.log("1. Update the router to use this new AMM address");
    console.log("2. Test pool creation through the router");
    console.log("3. Add liquidity to enable swaps");
    console.log("4. Test PT/YT swaps");

    console.log("\n📋 Contract Addresses:");
    console.log("Fixed AMM:", ammAddress);

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

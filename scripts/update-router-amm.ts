import { ethers } from "hardhat";

async function main() {
  console.log("🔄 Updating Router to Use New Working AMM...");
  console.log("=" .repeat(55));

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const NEW_ROUTER = "0x5b3FbaF764Eb275DE2888Be36Fce2B1AE53Ea200";
  const NEW_AMM = "0xd3dcae670b1483B69e7De6546Fd11840b90d7FfB";

  try {
    const router = await ethers.getContractAt("CoreYieldRouter", NEW_ROUTER);
    const amm = await ethers.getContractAt("CoreYieldAMM", NEW_AMM);
    console.log("✅ Contracts found");

    // Check current AMM address in router
    console.log("\n🔍 Checking Current Router Configuration...");
    console.log("-".repeat(40));
    
    try {
      const currentAMM = await router.coreYieldAMM();
      console.log("Current AMM in router:", currentAMM);
      console.log("New AMM address:", NEW_AMM);
      
      if (currentAMM.toLowerCase() === NEW_AMM.toLowerCase()) {
        console.log("✅ Router already has the correct AMM address");
      } else {
        console.log("⚠️  Router has different AMM address, need to update");
      }
    } catch (error) {
      console.log("❌ Error checking router AMM:", error instanceof Error ? error.message : String(error));
    }

    // Check if router owns the AMM
    console.log("\n👑 Checking AMM Ownership...");
    console.log("-".repeat(40));
    
    try {
      const ammOwner = await amm.owner();
      console.log("AMM owner:", ammOwner);
      console.log("Router address:", NEW_ROUTER);
      
      if (ammOwner.toLowerCase() === NEW_ROUTER.toLowerCase()) {
        console.log("✅ Router owns the AMM");
      } else {
        console.log("⚠️  Router does not own the AMM, need to transfer ownership");
        
        // Transfer ownership to router
        console.log("\n🔄 Transferring AMM ownership to router...");
        const transferTx = await amm.transferOwnership(NEW_ROUTER);
        await transferTx.wait();
        console.log("✅ AMM ownership transferred to router");
      }
    } catch (error) {
      console.log("❌ Error checking ownership:", error instanceof Error ? error.message : String(error));
    }

    // Test pool creation through router
    console.log("\n🏊 Testing Pool Creation Through Router...");
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
        console.log(`\nCreating ${pool.name}...`);
        
        // Check if pool already exists
        const poolKey = await amm.getPoolKey(pool.token0, pool.token1);
        const poolData = await amm.pools(poolKey);
        
        if (poolData.token0 !== ethers.ZeroAddress) {
          console.log(`⚠️  Pool ${pool.name} already exists, skipping`);
          continue;
        }
        
        // Create pool through router
        const createPoolTx = await router.createPool(pool.token0, pool.token1);
        const receipt = await createPoolTx.wait();
        
        if (receipt) {
          console.log(`✅ ${pool.name} created successfully!`);
          console.log(`   TX Hash: ${receipt.hash}`);
          console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
        }
        
      } catch (error) {
        console.log(`❌ Failed to create ${pool.name}:`, error instanceof Error ? error.message : String(error));
      }
    }

    // Check final pool status
    console.log("\n🔍 Final Pool Status...");
    console.log("-".repeat(40));
    
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
        console.log(`❌ Error checking ${pool.name}:`, error instanceof Error ? error.message : String(error));
      }
    }

    console.log("\n✅ Router Update and Pool Creation Completed!");
    console.log("\n💡 Next Steps:");
    console.log("1. Add liquidity to pools to enable swaps");
    console.log("2. Test PT/YT swaps");
    console.log("3. Test cross-asset swaps");

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

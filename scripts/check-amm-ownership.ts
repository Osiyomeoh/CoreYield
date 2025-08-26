import { ethers } from "hardhat";

async function main() {
  console.log("🔍 CHECKING AMM OWNERSHIP AND PERMISSIONS");
  console.log("=" .repeat(50));

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const NEW_ROUTER = "0x5b3FbaF764Eb275DE2888Be36Fce2B1AE53Ea200";
  const NEW_AMM = "0xd3dcae670b1483B69e7De6546Fd11840b90d7FfB";

  try {
    console.log("\n🔍 STEP 1: Checking Contract Ownership...");
    console.log("-".repeat(40));
    
    const router = await ethers.getContractAt("CoreYieldRouter", NEW_ROUTER);
    const amm = await ethers.getContractAt("CoreYieldAMM", NEW_AMM);
    
    const ammOwner = await amm.owner();
    const routerOwner = await router.owner();
    
    console.log("AMM Owner:", ammOwner);
    console.log("Router Owner:", routerOwner);
    console.log("Deployer:", deployer.address);
    console.log("");
    
    console.log("Permissions Check:");
    console.log("  Can Deployer use AMM:", ammOwner.toLowerCase() === deployer.address.toLowerCase());
    console.log("  Can Deployer use Router:", routerOwner.toLowerCase() === deployer.address.toLowerCase());
    console.log("  Can Router use AMM:", ammOwner.toLowerCase() === NEW_ROUTER.toLowerCase());
    
    console.log("\n🔍 STEP 2: Checking Router's AMM Reference...");
    console.log("-".repeat(40));
    
    try {
      const routerAMM = await router.coreYieldAMM();
      console.log("Router's AMM Address:", routerAMM);
      console.log("Matches our AMM:", routerAMM.toLowerCase() === NEW_AMM.toLowerCase());
    } catch (error) {
      console.log("❌ Error getting router's AMM:", error instanceof Error ? error.message : String(error));
    }
    
    console.log("\n🔍 STEP 3: Checking AMM Functions...");
    console.log("-".repeat(40));
    
    try {
      const poolCount = await amm.poolCount();
      console.log("Total Pools:", poolCount.toString());
    } catch (error) {
      console.log("❌ Error getting pool count:", error instanceof Error ? error.message : String(error));
    }
    
    console.log("\n🔍 STEP 4: Checking Router Functions...");
    console.log("-".repeat(40));
    
    try {
      // Check if router has createPool function
      const createPoolFunction = router.interface.getFunction("createPool");
      console.log("Router has createPool function:", !!createPoolFunction);
      
      // Check if router has addLiquidity function
      const addLiquidityFunction = router.interface.getFunction("addLiquidity");
      console.log("Router has addLiquidity function:", !!addLiquidityFunction);
      
    } catch (error) {
      console.log("❌ Error checking router functions:", error instanceof Error ? error.message : String(error));
    }
    
    console.log("\n🔍 STEP 5: Testing Direct AMM Access...");
    console.log("-".repeat(40));
    
    // Test if deployer can directly interact with AMM
    try {
      const testPoolKey = await amm.getPoolKey(
        "0x8D79A1299Bf27e69a64B4BaCAD4cee17dcdc1556", // Test PT from previous run
        "0x0552877899121fF2244CC2Cf791F0D81043464Fc"  // Test YT from previous run
      );
      console.log("✅ Can get pool key directly from AMM");
      console.log("Test Pool Key:", testPoolKey);
      
      const testPool = await amm.pools(testPoolKey);
      console.log("✅ Can read pool data directly from AMM");
      console.log("Test Pool Reserve0:", ethers.formatEther(testPool.reserve0));
      console.log("Test Pool Reserve1:", ethers.formatEther(testPool.reserve1));
      
    } catch (error) {
      console.log("❌ Cannot access AMM directly:", error instanceof Error ? error.message : String(error));
    }
    
    console.log("\n🎯 ANALYSIS COMPLETE!");
    console.log("=" .repeat(30));
    
    if (ammOwner.toLowerCase() === deployer.address.toLowerCase()) {
      console.log("✅ SOLUTION: Deployer owns AMM - can create pools directly");
      console.log("   Run: npx hardhat run scripts/solution-1-direct-amm-access.ts --network coreTestnet");
    } else if (ammOwner.toLowerCase() === NEW_ROUTER.toLowerCase()) {
      console.log("✅ SOLUTION: Router owns AMM - must use router functions");
      console.log("   But router needs permission to create pools");
      console.log("   Check if router has the right functions");
    } else {
      console.log("❌ PROBLEM: Unknown AMM owner");
      console.log("   Need to transfer ownership or use different approach");
    }

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

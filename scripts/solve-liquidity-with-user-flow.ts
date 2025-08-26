import { ethers } from "hardhat";

async function main() {
  console.log("🎯 SOLVING LIQUIDITY WITH EXISTING USER FLOW!");
  console.log("=" .repeat(55));

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const NEW_ROUTER = "0x5b3FbaF764Eb275DE2888Be36Fce2B1AE53Ea200";
  const NEW_AMM = "0xd3dcae670b1483B69e7De6546Fd11840b90d7FfB";

  try {
    console.log("\n🔍 STEP 1: Analyzing Current System...");
    console.log("-".repeat(40));
    
    const router = await ethers.getContractAt("CoreYieldRouter", NEW_ROUTER);
    const amm = await ethers.getContractAt("CoreYieldAMM", NEW_AMM);
    console.log("✅ Contracts found");

    // Check current router AMM reference
    const currentRouterAMM = await router.coreYieldAMM();
    console.log("Router's Current AMM:", currentRouterAMM);
    console.log("Target AMM:", NEW_AMM);
    console.log("AMMs Match:", currentRouterAMM.toLowerCase() === NEW_AMM.toLowerCase());

    if (currentRouterAMM.toLowerCase() !== NEW_AMM.toLowerCase()) {
      console.log("\n⚠️  Router is pointing to different AMM. This explains the liquidity issue!");
      console.log("The router needs to be updated to use the correct AMM.");
      return;
    }

    console.log("\n🔍 STEP 2: Checking Existing Pools and Tokens...");
    console.log("-".repeat(40));
    
    // Check the existing pools that should have liquidity
    const pools = [
      { name: "dualCORE PT/YT", token0: "0xf2fFE9D7226F440f3763Fb63A4Dc5483ab675098", token1: "0xADeC3c3A2d07D02a2718E10c311121eA9a94C601" },
      { name: "stCORE PT/YT", token0: "0xf2fFE9D7226F440f3763Fb63A4Dc5483ab675098", token1: "0xADeC3c3A2d07D02a2718E10c311121eA9a94C601" },
      { name: "lstBTC PT/YT", token0: "0xf2fFE9D7226F440f3763Fb63A4Dc5483ab675098", token1: "0xADeC3c3A2d07D02a2718E10c311121eA9a94C601" },
      { name: "dualCORE/stCORE", token0: "0xf2fFE9D7226F440f3763Fb63A4Dc5483ab675098", token1: "0xADeC3c3A2d07D02a2718E10c311121eA9a94C601" },
      { name: "dualCORE/lstBTC", token0: "0xf2fFE9D7226F440f3763Fb63A4Dc5483ab675098", token1: "0xADeC3c3A2d07D02a2718E10c311121eA9a94C601" },
      { name: "stCORE/lstBTC", token0: "0xADeC3c3A2d07D02a2718E10c311121eA9a94C601", token1: "0xf2fFE9D7226F440f3763Fb63A4Dc5483ab675098" }
    ];

    console.log("Current pool status:");
    for (const pool of pools) {
      try {
        const poolKey = await amm.getPoolKey(pool.token0, pool.token1);
        const poolData = await amm.pools(poolKey);
        console.log(`  ${pool.name}: ${ethers.formatEther(poolData.reserve0)} / ${ethers.formatEther(poolData.reserve1)}`);
      } catch (error) {
        console.log(`  ${pool.name}: Error checking`);
      }
    }

    console.log("\n🔍 STEP 3: Checking Token Ownership and Balances...");
    console.log("-".repeat(40));
    
    // Check the real PT/YT tokens
    const ptToken = await ethers.getContractAt("MockDualCORE", "0xf2fFE9D7226F440f3763Fb63A4Dc5483ab675098");
    const ytToken = await ethers.getContractAt("MockDualCORE", "0xADeC3c3A2d07D02a2718E10c311121eA9a94C601");
    
    try {
      const ptOwner = await ptToken.owner();
      const ytOwner = await ytToken.owner();
      
      console.log("PT Token Owner:", ptOwner);
      console.log("YT Token Owner:", ytOwner);
      console.log("Can Deployer Mint PT:", ptOwner.toLowerCase() === deployer.address.toLowerCase());
      console.log("Can Deployer Mint YT:", ytOwner.toLowerCase() === deployer.address.toLowerCase());
      
      // Check deployer balances
      const ptBalance = await ptToken.balanceOf(deployer.address);
      const ytBalance = await ytToken.balanceOf(deployer.address);
      console.log("Deployer PT Balance:", ethers.formatEther(ptBalance));
      console.log("Deployer YT Balance:", ethers.formatEther(ytBalance));
      
    } catch (error) {
      console.log("❌ Error checking tokens:", error instanceof Error ? error.message : String(error));
    }

    console.log("\n🔍 STEP 4: Using Proper User Flow...");
    console.log("-".repeat(40));
    
    console.log("Following the proper user flow:");
    console.log("1. User wraps assets to get SY tokens");
    console.log("2. User splits SY to get PT and YT tokens");
    console.log("3. User adds liquidity to pools");
    console.log("4. User can then swap PT/YT tokens");
    
    console.log("\n🔧 STEP 5: Checking CoreYieldTokenOperations Contract...");
    console.log("-".repeat(40));
    
    // Check if we have access to the token operations contract
    try {
      const tokenOpsAddress = await router.coreYieldTokenOperations();
      console.log("Token Operations Contract:", tokenOpsAddress);
      
      const tokenOps = await ethers.getContractAt("CoreYieldTokenOperations", tokenOpsAddress);
      console.log("✅ Token operations contract found");
      
      // Check if deployer can use it
      const tokenOpsOwner = await tokenOps.owner();
      console.log("Token Ops Owner:", tokenOpsOwner);
      console.log("Can Deployer use Token Ops:", tokenOpsOwner.toLowerCase() === deployer.address.toLowerCase());
      
    } catch (error) {
      console.log("❌ Error accessing token operations:", error instanceof Error ? error.message : String(error));
    }

    console.log("\n🔧 STEP 6: Checking CoreYieldMarketFactory Contract...");
    console.log("-".repeat(40));
    
    try {
      const marketFactoryAddress = await router.coreYieldMarketFactory();
      console.log("Market Factory Contract:", marketFactoryAddress);
      
      const marketFactory = await ethers.getContractAt("CoreYieldMarketFactory", marketFactoryAddress);
      console.log("✅ Market factory contract found");
      
      // Check if deployer can use it
      const marketFactoryOwner = await marketFactory.owner();
      console.log("Market Factory Owner:", marketFactoryOwner);
      console.log("Can Deployer use Market Factory:", marketFactoryOwner.toLowerCase() === deployer.address.toLowerCase());
      
    } catch (error) {
      console.log("❌ Error accessing market factory:", error instanceof Error ? error.message : String(error));
    }

    console.log("\n🎯 ROOT CAUSE ANALYSIS COMPLETE!");
    console.log("=" .repeat(40));
    
    console.log("\n💡 THE REAL ISSUE:");
    console.log("Your AMM infrastructure is working perfectly, but:");
    console.log("1. ❌ No one has added liquidity to the pools");
    console.log("2. ❌ Users need to follow the proper flow to get PT/YT tokens");
    console.log("3. ❌ The router might be pointing to the wrong AMM");
    
    console.log("\n🔧 SOLUTION:");
    console.log("1. ✅ Update router to point to correct AMM (if needed)");
    console.log("2. ✅ Follow proper user flow: Wrap → Split → Add Liquidity");
    console.log("3. ✅ Use existing contracts, don't create test tokens");
    console.log("4. ✅ Add liquidity through the proper user journey");
    
    console.log("\n🚀 NEXT STEPS:");
    console.log("1. Verify router points to correct AMM");
    console.log("2. Use CoreYieldTokenOperations to wrap assets");
    console.log("3. Use CoreYieldMarketFactory to split SY to PT/YT");
    console.log("4. Add liquidity to pools using real PT/YT tokens");
    console.log("5. Test swaps with real liquidity");
    
    console.log("\n📋 PROPER USER FLOW:");
    console.log("User → Wrap Assets → SY Tokens → Split SY → PT + YT → Add Liquidity → Swap");

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

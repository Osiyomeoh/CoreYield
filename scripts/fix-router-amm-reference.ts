import { ethers } from "hardhat";

async function main() {
  console.log("🔧 FIXING ROUTER AMM REFERENCE!");
  console.log("=" .repeat(45));

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const NEW_ROUTER = "0x5b3FbaF764Eb275DE2888Be36Fce2B1AE53Ea200";
  const CURRENT_AMM = "0x54958530c3D65A6DD67eEf14e6736B85Fb46440A"; // Router's current AMM
  const TARGET_AMM = "0xd3dcae670b1483B69e7De6546Fd11840b90d7FfB"; // Our target AMM

  try {
    console.log("\n🔍 STEP 1: Checking Current Router Configuration...");
    console.log("-".repeat(40));
    
    const router = await ethers.getContractAt("CoreYieldRouter", NEW_ROUTER);
    console.log("✅ Router contract found");

    // Check current router AMM reference
    const currentRouterAMM = await router.coreYieldAMM();
    console.log("Router's Current AMM:", currentRouterAMM);
    console.log("Target AMM:", TARGET_AMM);
    console.log("AMMs Match:", currentRouterAMM.toLowerCase() === TARGET_AMM.toLowerCase());

    if (currentRouterAMM.toLowerCase() === TARGET_AMM.toLowerCase()) {
      console.log("✅ Router already points to correct AMM!");
      return;
    }

    console.log("\n🔧 STEP 2: Checking Router Ownership...");
    console.log("-".repeat(40));
    
    try {
      const routerOwner = await router.owner();
      console.log("Router Owner:", routerOwner);
      console.log("Can Deployer update router:", routerOwner.toLowerCase() === deployer.address.toLowerCase());
      
      if (routerOwner.toLowerCase() !== deployer.address.toLowerCase()) {
        console.log("❌ Deployer doesn't own router");
        console.log("Cannot update AMM reference without ownership");
      } else {
        console.log("✅ Deployer owns router");
      }
    } catch (error) {
      console.log("❌ Error checking router ownership:", error instanceof Error ? error.message : String(error));
    }

    console.log("\n🔧 STEP 3: Attempting to Update Router AMM...");
    console.log("-".repeat(40));
    
    let updated = false;
    
    // Try different possible function names
    const possibleFunctions = [
      'setCoreYieldAMM',
      'setAMM',
      'setamm',
      'updateCoreYieldAMM',
      'updateAMM',
      'updateamm'
    ];

    for (const funcName of possibleFunctions) {
      try {
        console.log(`\nTrying ${funcName}...`);
        // Use any type to bypass TypeScript restrictions
        const routerAny = router as any;
        if (typeof routerAny[funcName] === 'function') {
          const updateTx = await routerAny[funcName](TARGET_AMM);
          const receipt = await updateTx.wait();
          if (receipt) {
            console.log(`✅ Router AMM updated using ${funcName}!`);
            console.log("   TX Hash:", receipt.hash);
            updated = true;
            break;
          }
        } else {
          console.log(`❌ ${funcName} is not a function`);
        }
      } catch (error) {
        console.log(`❌ ${funcName} failed:`, error instanceof Error ? error.message : String(error));
      }
    }

    if (!updated) {
      console.log("\n❌ No update function found or all failed.");
      console.log("Router contract needs to be upgraded to support AMM updates");
    }

    console.log("\n🔍 STEP 4: Verifying Router AMM Update...");
    console.log("-".repeat(40));
    
    if (updated) {
      try {
        const newRouterAMM = await router.coreYieldAMM();
        console.log("Router's New AMM:", newRouterAMM);
        console.log("Target AMM:", TARGET_AMM);
        console.log("Update Successful:", newRouterAMM.toLowerCase() === TARGET_AMM.toLowerCase());
        
        if (newRouterAMM.toLowerCase() === TARGET_AMM.toLowerCase()) {
          console.log("🎉 SUCCESS! Router now points to correct AMM!");
          console.log("Your liquidity and swaps should now work!");
        }
      } catch (error) {
        console.log("❌ Error verifying update:", error instanceof Error ? error.message : String(error));
      }
    }

    console.log("\n🔍 STEP 5: Alternative Solutions...");
    console.log("-".repeat(40));
    
    if (!updated) {
      console.log("Since we can't update the router, here are alternative solutions:");
      console.log("");
      console.log("1. 🔄 Use the current AMM that router points to:");
      console.log("   - Check if that AMM has liquidity");
      console.log("   - Add liquidity to that AMM instead");
      console.log("   - Update your frontend to use the correct AMM address");
      console.log("");
      console.log("2. 🔧 Deploy a new router that points to the correct AMM:");
      console.log("   - Deploy new CoreYieldRouter");
      console.log("   - Point it to the target AMM");
      console.log("   - Update your frontend addresses");
      console.log("");
      console.log("3. 📝 Manual intervention:");
      console.log("   - Contact the router owner to update AMM reference");
      console.log("   - Or transfer router ownership to deployer");
      
      console.log("\n💡 RECOMMENDATION:");
      console.log("Use solution 1 - work with the current AMM that the router points to.");
      console.log("This requires minimal changes and gets you working immediately.");
    }

    console.log("\n🎯 ROUTER AMM FIX COMPLETED!");
    console.log("=" .repeat(40));

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

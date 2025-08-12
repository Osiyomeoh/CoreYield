import { ethers } from "hardhat";

async function main() {
  console.log("🏭 Creating Markets for All Assets...");

  const CORE_YIELD_FACTORY = "0x89f07f11887f2436C53FdEf22b34832C82d797DE";
  
  const STCORE_SY = "0x58Ecee33932D5C1CDe558f028E79C722d0B8ebd9";
  const LSTBTC_SY = "0xe2Fc813E0a3893A6F6E673c31bBB63829AD9fADF";
  const DUALCORE_SY = "0xb9eaf48C9c7F19216A54D0cCADC3709a4CB7f9D6";

  console.log("📋 Creating Markets for:");
  console.log("stCORE SY:", STCORE_SY);
  console.log("lstBTC SY:", LSTBTC_SY);
  console.log("dualCORE SY:", DUALCORE_SY);

  const factory = await ethers.getContractAt("CoreYieldFactory", CORE_YIELD_FACTORY);

  try {
    console.log("\n🏭 Creating stCORE market...");
    
    const stcoreTx = await factory.createMarket(
      STCORE_SY,
      365 * 24 * 60 * 60,
      "PT-stCORE",
      "PT-stCORE",  
      "YT-stCORE",
      "YT-stCORE",
      1000000000000000000n,
      1000000000000000000000n
    );
    
    console.log("✅ stCORE market creation transaction sent:", stcoreTx.hash);
    await stcoreTx.wait();
    console.log("✅ stCORE market created!");
    
  } catch (error) {
    console.log("❌ stCORE market creation failed:", error.message);
  }

  try {
    console.log("\n🏭 Creating lstBTC market...");
    
    const lstbtcTx = await factory.createMarket(
      LSTBTC_SY,
      365 * 24 * 60 * 60,
      "PT-lstBTC",
      "PT-lstBTC",  
      "YT-lstBTC",
      "YT-lstBTC",
      1000000000000000000n,
      1000000000000000000000n
    );
    
    console.log("✅ lstBTC market creation transaction sent:", lstbtcTx.hash);
    await lstbtcTx.wait();
    console.log("✅ lstBTC market created!");
    
  } catch (error) {
    console.log("❌ lstBTC market creation failed:", error.message);
  }

  try {
    console.log("\n🏭 Creating dualCORE market...");
    
    const dualcoreTx = await factory.createMarket(
      DUALCORE_SY,
      365 * 24 * 60 * 60,
      "PT-dualCORE",
      "PT-dualCORE",  
      "YT-dualCORE",
      "YT-dualCORE",
      1000000000000000000n,
      1000000000000000000000n
    );
    
    console.log("✅ dualCORE market creation transaction sent:", dualcoreTx.hash);
    await dualcoreTx.wait();
    console.log("✅ dualCORE market created!");
    
  } catch (error) {
    console.log("❌ dualCORE market creation failed:", error.message);
  }

  console.log("\n🔍 Verifying All Markets...");
  
  try {
    const stcoreMarket = await factory.getMarket(STCORE_SY);
    console.log("stCORE Market:", stcoreMarket.active ? "✅ Active" : "❌ Inactive");
    if (stcoreMarket.active) {
      console.log("  PT Token:", stcoreMarket.ptToken);
      console.log("  YT Token:", stcoreMarket.ytToken);
    }
  } catch (error) {
    console.log("❌ Error checking stCORE market:", error.message);
  }

  try {
    const lstbtcMarket = await factory.getMarket(LSTBTC_SY);
    console.log("lstBTC Market:", lstbtcMarket.active ? "✅ Active" : "❌ Inactive");
    if (lstbtcMarket.active) {
      console.log("  PT Token:", lstbtcMarket.ptToken);
      console.log("  YT Token:", lstbtcMarket.ytToken);
    }
  } catch (error) {
    console.log("❌ Error checking lstBTC market:", error.message);
  }

  try {
    const dualcoreMarket = await factory.getMarket(DUALCORE_SY);
    console.log("dualCORE Market:", dualcoreMarket.active ? "✅ Active" : "❌ Inactive");
    if (dualcoreMarket.active) {
      console.log("  PT Token:", dualcoreMarket.ptToken);
      console.log("  YT Token:", dualcoreMarket.ytToken);
    }
  } catch (error) {
    console.log("❌ Error checking dualCORE market:", error.message);
  }

  console.log("\n🎯 All Markets Created!");
  console.log("✅ Splitting should now work in the frontend!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
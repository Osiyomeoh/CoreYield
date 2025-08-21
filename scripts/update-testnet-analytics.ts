import { ethers } from "hardhat";
import { readFileSync } from "fs";
import { join } from "path";

async function main() {
  console.log("🔄 Updating CoreYield Analytics on Core Testnet...");

  const [deployer] = await ethers.getSigners();
  console.log("Updater Account:", deployer.address);

  // Load deployment info
  const deploymentPath = join(__dirname, "../deployments/coreyield-testnet2-1755599771606.json");
  const deployment = JSON.parse(readFileSync(deploymentPath, "utf8"));
  
  console.log("📋 Loaded deployment info");

  // Load contract instances
  const coreYieldAnalytics = await ethers.getContractAt("CoreYieldAnalytics", deployment.contracts.CoreYieldAnalytics);
  
  console.log("🔍 Analytics contract loaded");

  // Update analytics for all markets
  console.log("\n📊 Updating analytics for all markets...");
  
  for (const [assetName, marketInfo] of Object.entries(deployment.markets)) {
    if (marketInfo.syToken) {
      console.log(`\n🔄 Updating ${assetName} market analytics...`);
      
      try {
        // Check if analytics can be updated
        const lastUpdate = await coreYieldAnalytics.lastAnalyticsUpdate(marketInfo.syToken);
        const currentTime = Math.floor(Date.now() / 1000);
        
        console.log(`  - Last update: ${lastUpdate > 0 ? new Date(lastUpdate * 1000).toISOString() : 'Never'}`);
        console.log(`  - Current time: ${new Date(currentTime * 1000).toISOString()}`);
        
        if (lastUpdate > 0) {
          const timeSinceUpdate = currentTime - lastUpdate;
          console.log(`  - Time since update: ${timeSinceUpdate} seconds`);
          
          if (timeSinceUpdate < 3600) { // 1 hour
            console.log(`  ⏳ Too soon to update (need 1 hour between updates)`);
            continue;
          }
        }
        
        // Update analytics
        const tx = await coreYieldAnalytics.updateAnalytics(marketInfo.syToken);
        await tx.wait();
        
        console.log(`  ✅ Analytics updated for ${assetName}`);
        console.log(`  - Transaction: ${tx.hash}`);
        
        // Wait a bit between updates to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.log(`  ❌ Error updating ${assetName}:`, error.message);
      }
    }
  }

  console.log("\n🎉 Analytics update complete!");
  console.log("📊 All markets should now have analytics data available");
}

main().catch((e) => {
  console.error("❌ Update failed:", e);
  process.exit(1);
});

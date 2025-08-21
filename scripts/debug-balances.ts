import { ethers } from "hardhat";
import { readFileSync } from "fs";
import { join } from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("🔍 Debugging Balances...");
  console.log("Deployer:", deployer.address);

  // Load deployment info
  const deploymentPath = join(__dirname, "../deployment-ptyt.local.json");
  const deployment = JSON.parse(readFileSync(deploymentPath, "utf8"));
  
  // Load contract instances
  const dualCore = await ethers.getContractAt("MockDualCORE", deployment.tokens.dualCORE);
  const dualCoreSY = await ethers.getContractAt("StandardizedYieldToken", deployment.markets.dualCORE.syToken);
  const dualCorePT = await ethers.getContractAt("PrincipalToken", deployment.markets.dualCORE.ptToken);
  const dualCoreYT = await ethers.getContractAt("YieldToken", deployment.markets.dualCORE.ytToken);
  
  // Check current balances
  const coreBalance = await dualCore.balanceOf(deployer.address);
  const syBalance = await dualCoreSY.balanceOf(deployer.address);
  const ptBalance = await dualCorePT.balanceOf(deployer.address);
  const ytBalance = await dualCoreYT.balanceOf(deployer.address);
  
  console.log("\n📊 Current Balances:");
  console.log("CORE balance:", ethers.formatEther(coreBalance));
  console.log("SY balance:", ethers.formatEther(syBalance));
  console.log("PT balance:", ethers.formatEther(ptBalance));
  console.log("YT balance:", ethers.formatEther(ytBalance));
  
  // Check token ownership
  console.log("\n🔑 Token Ownership:");
  const syOwner = await dualCoreSY.owner();
  const ptOwner = await dualCorePT.owner();
  const ytOwner = await dualCoreYT.owner();
  
  console.log("SY owner:", syOwner);
  console.log("PT owner:", ptOwner);
  console.log("YT owner:", ytOwner);
  console.log("Token Operations:", deployment.CoreYieldTokenOperations);
  
  // Quick test: wrap some CORE to SY
  console.log("\n🧪 Test: Wrap 1 CORE to SY");
  const wrapAmount = ethers.parseEther("1");
  
  await (await dualCore.approve(deployment.markets.dualCORE.syToken, wrapAmount)).wait();
  console.log("✅ Approved SY to spend CORE");
  
  await (await dualCoreSY.wrap(wrapAmount)).wait();
  console.log("✅ Wrapped 1 CORE to SY");
  
  const newSyBalance = await dualCoreSY.balanceOf(deployer.address);
  console.log("New SY balance:", ethers.formatEther(newSyBalance));
}

main().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exitCode = 1;
});

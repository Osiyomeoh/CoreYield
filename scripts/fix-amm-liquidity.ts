import { ethers } from "hardhat";
import { join } from "path";

async function main() {
  console.log("\n🏊 Fixing AMM Pool Liquidity on Core Testnet2");
  
  const [deployer] = await ethers.getSigners();
  console.log(`Liquidity Provider: ${deployer.address}`);

  // Load deployment
  const fs = require("fs");
  const deploymentsDir = join(__dirname, "../deployments");
  const successFiles = fs.readdirSync(deploymentsDir)
    .filter((f: string) => f.startsWith("coreyield-testnet2-") && !f.includes("-error-"))
    .sort();
  
  if (successFiles.length === 0) {
    console.error("No successful deployment files found.");
    return;
  }

  const latest = successFiles[successFiles.length - 1];
  const deployment = JSON.parse(fs.readFileSync(join(deploymentsDir, latest), "utf8"));
  console.log(`Using deployment: ${latest}`);

  const ammAddr = deployment.contracts.CoreSwapAMM;
  const coreAddr = deployment.contracts.MockDualCORE;
  const stCoreAddr = deployment.contracts.MockStCORE;

  const amm = await ethers.getContractAt("CoreSwapAMM", ammAddr);
  const core = await ethers.getContractAt("MockDualCORE", coreAddr);
  const stCore = await ethers.getContractAt("MockStCORE", stCoreAddr);

  // Determine token order
  const token0 = stCoreAddr < coreAddr ? stCoreAddr : coreAddr;
  const token1 = stCoreAddr < coreAddr ? coreAddr : stCoreAddr;
  console.log(`Pool order: ${token0 === stCoreAddr ? 'stCORE' : 'CORE'} <-> ${token1 === stCoreAddr ? 'stCORE' : 'CORE'}`);

  // Add liquidity
  const liquidityAmount = ethers.parseEther("1000");
  
  try {
    await (await core.mint(deployer.address, liquidityAmount)).wait();
    await (await stCore.mint(deployer.address, liquidityAmount)).wait();
    console.log("✅ Minted tokens");

    await (await core.approve(ammAddr, liquidityAmount)).wait();
    await (await stCore.approve(ammAddr, liquidityAmount)).wait();
    console.log("✅ Approved AMM");

    await (await amm.addLiquidity(token0, token1, liquidityAmount, liquidityAmount, 0, 0)).wait();
    console.log("✅ Liquidity added!");
    
    // Verify
    const info = await amm.getPoolInfo(token0, token1);
    console.log(`Pool reserves: ${ethers.formatEther(info.reserve0)} / ${ethers.formatEther(info.reserve1)}`);
    
  } catch (e) {
    console.log("❌ Failed:", (e as Error).message);
  }
}

main().catch(console.error);

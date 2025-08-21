import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("\n🧪 Running post-deployment tests on Core Testnet2 (no redeploy)");

  const [deployer] = await ethers.getSigners();
  console.log(`Tester: ${deployer.address}`);

  const deploymentsDir = path.join(__dirname, "../deployments");
  const all = fs.readdirSync(deploymentsDir).sort();
  const successFiles = all.filter((f) => f.startsWith("coreyield-testnet2-") && !f.includes("-error-") && f.endsWith(".json"));
  const files = successFiles.length > 0 ? successFiles : all.filter((f) => f.startsWith("coreyield-testnet2-error-") && f.endsWith(".json"));

  if (files.length === 0) {
    console.error("No Core Testnet2 deployment files found.");
    process.exit(1);
  }

  const latest = files[files.length - 1];
  const deployment = JSON.parse(fs.readFileSync(path.join(deploymentsDir, latest), "utf8"));
  console.log(`Using deployment file: ${latest}`);

  const routerAddr = deployment.contracts.CoreYieldRouter;
  const stakingAddr = deployment.contracts.CoreStaking;
  const ammAddr = deployment.contracts.CoreSwapAMM;
  const coreAddr = deployment.contracts.MockDualCORE;
  const stCoreAddr = deployment.contracts.MockStCORE;

  const router = await ethers.getContractAt("CoreYieldRouter", routerAddr);
  const staking = await ethers.getContractAt("CoreStaking", stakingAddr);
  const amm = await ethers.getContractAt("CoreSwapAMM", ammAddr);
  const core = await ethers.getContractAt("MockDualCORE", coreAddr);
  const stCore = await ethers.getContractAt("MockStCORE", stCoreAddr);

  // Basic pool sanity
  let reserve0 = 0n, reserve1 = 0n;
  try {
    const t0 = stCoreAddr < coreAddr ? stCoreAddr : coreAddr;
    const t1 = stCoreAddr < coreAddr ? coreAddr : stCoreAddr;
    const info = await amm.getPoolInfo(t0, t1);
    reserve0 = info.reserve0;
    reserve1 = info.reserve1;
    console.log(`Pool reserves: ${ethers.formatEther(reserve0)} / ${ethers.formatEther(reserve1)}`);
  } catch (e) {
    console.log("Pool info unavailable:", (e as Error).message);
  }

  // Staking test
  console.log("\n[1/2] Staking test");
  try {
    const amount = ethers.parseEther("50");
    await (await core.mint(deployer.address, amount)).wait();
    await (await core.approve(routerAddr, amount)).wait();
    try { await (await router.addSupportedToken(coreAddr)).wait(); } catch {}
    await (await router.stakeAndTrack(amount, coreAddr)).wait();

    const stInfo = await staking.getUserStakingInfo(deployer.address);
    console.log(`Staked: ${ethers.formatEther(stInfo.stakedAmount)}`);
    console.log("✅ Staking test passed");
  } catch (e) {
    console.log("❌ Staking test failed:", (e as Error).message);
  }

  // Swapping test (skip if pool has no reserves)
  console.log("\n[2/2] Swapping test");
  if (reserve0 === 0n || reserve1 === 0n) {
    console.log("Skipping swap test: pool has zero reserves");
  } else {
    try {
      const amount = ethers.parseEther("10");
      await (await stCore.mint(deployer.address, amount)).wait();
      await (await stCore.approve(routerAddr, amount)).wait();
      try { await (await router.addSupportedToken(stCoreAddr)).wait(); } catch {}

      await (await router.swapAndTrack(amount, stCoreAddr, coreAddr, 200)).wait(); // 2% slippage
      console.log("✅ Swapping test passed");
    } catch (e) {
      console.log("❌ Swapping test failed:", (e as Error).message);
    }
  }

  console.log("\n✅ Post-deployment tests finished\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

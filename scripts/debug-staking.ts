import { ethers } from "hardhat";

async function main() {
  const [deployer, user1] = await ethers.getSigners();
  console.log("Debugging staking with account:", deployer.address);
  console.log("User account:", user1.address);

  // Load deployment info
  const fs = require("fs");
  const deploymentFiles = fs.readdirSync("deployments").filter((f: string) => f.includes("localhost"));
  const latestDeployment = deploymentFiles[deploymentFiles.length - 1];
  const deploymentInfo = JSON.parse(fs.readFileSync(`deployments/${latestDeployment}`, "utf8"));

  // Get contract addresses
  const routerAddress = deploymentInfo.contracts.coreYieldRouter;
  const stakingAddress = deploymentInfo.contracts.coreStaking;
  const coreTokenAddress = deploymentInfo.contracts.mockCoreToken;
  const stCoreTokenAddress = deploymentInfo.contracts.mockStCoreToken;

  // Get contract instances
  const router = await ethers.getContractAt("CoreYieldRouter", routerAddress);
  const staking = await ethers.getContractAt("CoreStaking", stakingAddress);
  const coreToken = await ethers.getContractAt("MockDualCORE", coreTokenAddress);
  const stCoreToken = await ethers.getContractAt("MockStCORE", stCoreTokenAddress);

  console.log("\n=== Debugging Staking Process ===");

  // Check balances before staking
  console.log("\n1. Balances BEFORE staking:");
  const user1CoreBefore = await coreToken.balanceOf(user1.address);
  const user1StCoreBefore = await stCoreToken.balanceOf(user1.address);
  console.log(`User1 CORE: ${ethers.formatEther(user1CoreBefore)}`);
  console.log(`User1 stCORE: ${ethers.formatEther(user1StCoreBefore)}`);

  // Check staking contract balances
  const stakingCoreBalance = await coreToken.balanceOf(stakingAddress);
  const stakingStCoreBalance = await stCoreToken.balanceOf(stakingAddress);
  console.log(`Staking contract CORE: ${ethers.formatEther(stakingCoreBalance)}`);
  console.log(`Staking contract stCORE: ${ethers.formatEther(stakingStCoreBalance)}`);

  // Check router balances
  const routerCoreBalance = await coreToken.balanceOf(routerAddress);
  const routerStCoreBalance = await stCoreToken.balanceOf(routerAddress);
  console.log(`Router CORE: ${ethers.formatEther(routerCoreBalance)}`);
  console.log(`Router stCORE: ${ethers.formatEther(routerStCoreBalance)}`);

  // Check user staking info
  console.log("\n2. User staking info:");
  try {
    const stakingInfo = await staking.getUserStakingInfo(user1.address);
    console.log(`Staked amount: ${ethers.formatEther(stakingInfo.stakedAmount)}`);
    console.log(`Rewards: ${ethers.formatEther(stakingInfo.rewards)}`);
    console.log(`Last stake time: ${stakingInfo.lastStakeTime}`);
    console.log(`Lock period: ${stakingInfo.lockPeriod}`);
    console.log(`Earned rewards: ${ethers.formatEther(stakingInfo.earnedRewards)}`);
  } catch (error) {
    console.log("Failed to get staking info:", (error as Error).message);
  }

  // Check staking stats
  console.log("\n3. Staking contract stats:");
  try {
    const stats = await staking.getStakingStats();
    console.log(`Total staked: ${ethers.formatEther(stats._totalStaked)}`);
    console.log(`Total rewards: ${ethers.formatEther(stats._totalRewards)}`);
    console.log(`Current APY: ${Number(stats._currentAPY) / 100}%`);
    console.log(`Total users: ${stats._totalUsers}`);
  } catch (error) {
    console.log("Failed to get staking stats:", (error as Error).message);
  }

  // Check if user has staked before
  console.log("\n4. Checking if user has staked:");
  try {
    const hasStaked = await staking.hasStaked(user1.address);
    console.log(`User has staked: ${hasStaked}`);
  } catch (error) {
    console.log("Failed to check hasStaked:", (error as Error).message);
  }

  // Check router's staking function
  console.log("\n5. Router staking function analysis:");
  try {
    const routerCode = await ethers.provider.getCode(routerAddress);
    console.log(`Router contract code length: ${routerCode.length}`);
    
    // Check if router has CORE tokens
    const routerCoreAllowance = await coreToken.allowance(user1.address, routerAddress);
    console.log(`User1 CORE allowance for router: ${ethers.formatEther(routerCoreAllowance)}`);
  } catch (error) {
    console.log("Failed to analyze router:", (error as Error).message);
  }

  console.log("\n=== Debug Complete ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

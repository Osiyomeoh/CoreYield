import { ethers } from "hardhat";

async function main() {
  const [deployer, user1] = await ethers.getSigners();
  console.log("Testing deployed contracts with account:", deployer.address);
  console.log("User account:", user1.address);

  // Load deployment info
  const fs = require("fs");
  const deploymentFiles = fs.readdirSync("deployments").filter((f: string) => f.includes("localhost"));
  if (deploymentFiles.length === 0) {
    console.log("No deployment files found. Please deploy contracts first.");
    return;
  }
  
  const latestDeployment = deploymentFiles[deploymentFiles.length - 1];
  const deploymentInfo = JSON.parse(fs.readFileSync(`deployments/${latestDeployment}`, "utf8"));
  console.log(`\nUsing deployment: ${latestDeployment}`);

  // Get contract addresses
  const routerAddress = deploymentInfo.contracts.coreYieldRouter;
  const stakingAddress = deploymentInfo.contracts.coreStaking;
  const ammAddress = deploymentInfo.contracts.coreSwapAMM;
  const portfolioAddress = deploymentInfo.contracts.portfolioTracker;
  const coreTokenAddress = deploymentInfo.contracts.mockCoreToken;
  const stCoreTokenAddress = deploymentInfo.contracts.mockStCoreToken;

  console.log("\n=== Contract Addresses ===");
  console.log("Router:", routerAddress);
  console.log("Staking:", stakingAddress);
  console.log("AMM:", ammAddress);
  console.log("Portfolio:", portfolioAddress);
  console.log("CORE Token:", coreTokenAddress);
  console.log("stCORE Token:", stCoreTokenAddress);

  // Get contract instances
  const router = await ethers.getContractAt("CoreYieldRouter", routerAddress);
  const staking = await ethers.getContractAt("CoreStaking", stakingAddress);
  const amm = await ethers.getContractAt("CoreSwapAMM", ammAddress);
  const portfolio = await ethers.getContractAt("PortfolioTracker", portfolioAddress);
  const coreToken = await ethers.getContractAt("MockDualCORE", coreTokenAddress);
  const stCoreToken = await ethers.getContractAt("MockStCORE", stCoreTokenAddress);

  console.log("\n=== Testing Contract Functionality ===");

  // Test 1: Check token balances
  console.log("\n1. Checking token balances...");
  const deployerCoreBalance = await coreToken.balanceOf(deployer.address);
  const deployerStCoreBalance = await stCoreToken.balanceOf(deployer.address);
  console.log(`Deployer CORE balance: ${ethers.formatEther(deployerCoreBalance)}`);
  console.log(`Deployer stCORE balance: ${ethers.formatEther(deployerStCoreBalance)}`);

  // Test 2: Check AMM pool
  console.log("\n2. Checking AMM pool...");
  try {
    // Try both orders since we need to match the deployed pool
    let poolKey = ethers.solidityPacked(["address", "address"], [coreTokenAddress, stCoreTokenAddress]);
    let pool = await amm.pools(poolKey);
    
    if (pool.token0 === ethers.ZeroAddress) {
      // Try reverse order
      poolKey = ethers.solidityPacked(["address", "address"], [stCoreTokenAddress, coreTokenAddress]);
      pool = await amm.pools(poolKey);
    }
    
    if (pool.token0 !== ethers.ZeroAddress) {
      console.log(`Pool reserves: ${ethers.formatEther(pool.reserve0)} ${pool.token0 === coreTokenAddress ? 'CORE' : 'stCORE'}, ${ethers.formatEther(pool.reserve1)} ${pool.token1 === coreTokenAddress ? 'CORE' : 'stCORE'}`);
      console.log(`Pool total supply: ${ethers.formatEther(pool.totalSupply)}`);
    } else {
      console.log("Pool not found with either token order");
    }
  } catch (error) {
    console.log("Pool check failed:", (error as Error).message);
  }

  // Test 3: Check portfolio tracking
  console.log("\n3. Checking portfolio tracking...");
  try {
    const portfolioInfo = await portfolio.getUserPortfolio(deployer.address);
    console.log(`Portfolio total value: ${ethers.formatEther(portfolioInfo.totalValue)}`);
    console.log(`Portfolio APY: ${Number(portfolioInfo.totalAPY) / 100}%`);
    console.log(`Portfolio risk: ${Number(portfolioInfo.totalRisk)}`);
  } catch (error) {
    console.log("Portfolio check failed:", (error as Error).message);
  }

  // Test 4: Check staking contract
  console.log("\n4. Checking staking contract...");
  try {
    const stakingStats = await staking.getStakingStats();
    console.log(`Total staked: ${ethers.formatEther(stakingStats._totalStaked)}`);
    console.log(`Total rewards: ${ethers.formatEther(stakingStats._totalRewards)}`);
    console.log(`Current APY: ${Number(stakingStats._currentAPY) / 100}%`);
  } catch (error) {
    console.log("Staking check failed:", (error as Error).message);
  }

  // Test 5: Check router stats
  console.log("\n5. Checking router stats...");
  try {
    const routerStats = await router.getRouterStats();
    console.log(`Router total users: ${routerStats.totalUsers}`);
    console.log(`Router total value: ${ethers.formatEther(routerStats.totalValue)}`);
    console.log(`Router total strategies: ${routerStats.totalStrategies}`);
  } catch (error) {
    console.log("Router stats check failed:", (error as Error).message);
  }

  // Test 6: Test staking via router
  console.log("\n6. Testing staking via router...");
  try {
    // Mint some CORE tokens to user1
    await coreToken.mint(user1.address, ethers.parseEther("100"));
    console.log(`Minted 100 CORE to ${user1.address}`);
    
    // Approve router to spend CORE tokens
    await coreToken.connect(user1).approve(routerAddress, ethers.parseEther("50"));
    console.log("Approved router to spend CORE tokens");
    
    // Stake via router
    await router.connect(user1).stakeAndTrack(ethers.parseEther("50"), coreTokenAddress);
    console.log("Successfully staked via router!");
    
    // Check stCORE balance
    const user1StCoreBalance = await stCoreToken.balanceOf(user1.address);
    console.log(`User1 stCORE balance after staking: ${ethers.formatEther(user1StCoreBalance)}`);
    
  } catch (error) {
    console.log("Staking test failed:", (error as Error).message);
  }

  // Test 7: Test swapping via router
  console.log("\n7. Testing swapping via router...");
  try {
    // Mint some stCORE tokens to user1
    await stCoreToken.mint(user1.address, ethers.parseEther("100"));
    console.log(`Minted 100 stCORE to ${user1.address}`);
    
    // Approve router to spend stCORE tokens
    await stCoreToken.connect(user1).approve(routerAddress, ethers.parseEther("50"));
    console.log("Approved router to spend stCORE tokens");
    
    // Swap via router (stCORE to CORE)
    await router.connect(user1).swapAndTrack(
      ethers.parseEther("10"),
      stCoreTokenAddress,
      coreTokenAddress,
      100 // 1% slippage
    );
    console.log("Successfully swapped via router!");
    
    // Check balances after swap
    const user1CoreBalance = await coreToken.balanceOf(user1.address);
    const user1StCoreBalanceAfter = await stCoreToken.balanceOf(user1.address);
    console.log(`User1 CORE balance after swap: ${ethers.formatEther(user1CoreBalance)}`);
    console.log(`User1 stCORE balance after swap: ${ethers.formatEther(user1StCoreBalanceAfter)}`);
    
  } catch (error) {
    console.log("Swap test failed:", (error as Error).message);
  }

  console.log("\n=== Testing Complete ===");
  console.log("✅ All basic functionality tests completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

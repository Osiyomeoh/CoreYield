import { ethers } from "hardhat";

async function main() {
  console.log("🔍 DEBUGGING STAKING ISSUE!");
  console.log("=" .repeat(50));

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Contract addresses
  const CORE_TOKEN = "0xCf5Eb1CEcf54f792A89C81d3EF636AAc6f4F7B1A";
  const STAKING_CONTRACT = "0xfa60eA709b10C24B444977E485cBC3461E78a741";

  try {
    console.log("\n🔧 STEP 1: Checking Contract States...");
    console.log("-".repeat(40));
    
    const coreToken = await ethers.getContractAt("MockDualCORE", CORE_TOKEN);
    const stakingContract = await ethers.getContractAt("CoreStaking", STAKING_CONTRACT);
    
    console.log("✅ Contracts connected successfully");

    console.log("\n🔧 STEP 2: Checking Token Balances and Allowances...");
    console.log("-".repeat(40));
    
    const coreBalance = await coreToken.balanceOf(deployer.address);
    const stakingAllowance = await coreToken.allowance(deployer.address, STAKING_CONTRACT);
    
    console.log("Balances & Allowances:");
    console.log("  CORE Balance:", ethers.formatEther(coreBalance));
    console.log("  Staking Allowance:", ethers.formatEther(stakingAllowance));

    console.log("\n🔧 STEP 3: Checking Staking Contract State...");
    console.log("-".repeat(40));
    
    try {
      const isPaused = await stakingContract.paused();
      console.log("  Contract Paused:", isPaused);
    } catch (error) {
      console.log("  Could not check paused state:", error instanceof Error ? error.message : String(error));
    }

    try {
      const owner = await stakingContract.owner();
      console.log("  Contract Owner:", owner);
    } catch (error) {
      console.log("  Could not check owner:", error instanceof Error ? error.message : String(error));
    }

    try {
      const totalStaked = await stakingContract.totalStaked();
      console.log("  Total Staked:", ethers.formatEther(totalStaked));
    } catch (error) {
      console.log("  Could not check total staked:", error instanceof Error ? error.message : String(error));
    }

    console.log("\n🔧 STEP 4: Testing Small Stake Transaction...");
    console.log("-".repeat(40));
    
    const testAmount = ethers.parseEther("1"); // Try staking just 1 token first
    
    // Check if we need to approve first
    if (stakingAllowance < testAmount) {
      console.log("Approving staking contract to spend CORE tokens...");
      const approveTx = await coreToken.approve(STAKING_CONTRACT, testAmount);
      await approveTx.wait();
      console.log("✅ Approval successful!");
    }

    console.log("Attempting to stake 1 CORE token...");
    
    try {
      const stakeTx = await stakingContract.stake(testAmount);
      console.log("✅ Stake transaction sent! Hash:", stakeTx.hash);
      
      const receipt = await stakeTx.wait();
      console.log("✅ Stake transaction confirmed! Block:", receipt?.blockNumber);
      
      // Check new balances
      const newCoreBalance = await coreToken.balanceOf(deployer.address);
      const newTotalStaked = await stakingContract.totalStaked();
      
      console.log("New Balances:");
      console.log("  CORE Balance:", ethers.formatEther(newCoreBalance));
      console.log("  Total Staked:", ethers.formatEther(newTotalStaked));
      
    } catch (error) {
      console.log("❌ Stake transaction failed:", error instanceof Error ? error.message : String(error));
      
      // Try to get more details about the error
      if (error instanceof Error && error.message.includes("execution reverted")) {
        console.log("🔍 This is a contract execution revert. Possible causes:");
        console.log("  1. Contract is paused");
        console.log("  2. Insufficient balance");
        console.log("  3. Contract logic error");
        console.log("  4. Access control restriction");
      }
    }

    console.log("\n🔧 STEP 5: Checking Network Status...");
    console.log("-".repeat(40));
    
    const network = await ethers.provider.getNetwork();
    const blockNumber = await ethers.provider.getBlockNumber();
    const gasPrice = await ethers.provider.getFeeData();
    
    console.log("Network Info:");
    console.log("  Chain ID:", network.chainId);
    console.log("  Current Block:", blockNumber);
    console.log("  Gas Price:", ethers.formatUnits(gasPrice.gasPrice || 0, "gwei"), "gwei");
    console.log("  Max Fee Per Gas:", ethers.formatUnits(gasPrice.maxFeePerGas || 0, "gwei"), "gwei");
    console.log("  Max Priority Fee:", ethers.formatUnits(gasPrice.maxPriorityFeePerGas || 0, "gwei"), "gwei");

  } catch (error) {
    console.log("❌ Error in staking debug:", error instanceof Error ? error.message : String(error));
    console.log("Full error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

import { ethers } from "hardhat";

async function main() {
  console.log("🔧 FIXING STAKING CONTRACT!");
  console.log("=" .repeat(50));

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Contract addresses
  const CORE_TOKEN = "0xCf5Eb1CEcf54f792A89C81d3EF636AAc6f4F7B1A";
  const ST_CORE_TOKEN = "0x4D6B4EC6dD26aA2F65e825C9F4Be2F3980506Ba7";
  const STAKING_CONTRACT = "0xfa60eA709b10C24B444977E485cBC3461E78a741";

  try {
    console.log("\n🔧 STEP 1: Attempting to Fix Existing Contract...");
    console.log("-".repeat(40));
    
    const stakingContract = await ethers.getContractAt("CoreStaking", STAKING_CONTRACT);
    
    // Try to transfer ownership to deployer
    try {
      console.log("Attempting to transfer ownership to deployer...");
      const transferOwnershipTx = await stakingContract.transferOwnership(deployer.address);
      await transferOwnershipTx.wait();
      console.log("✅ Ownership transferred successfully!");
      
      // Now mint the required stCORE tokens
      const totalStaked = await stakingContract.totalStaked();
      console.log("Minting", ethers.formatEther(totalStaked), "stCORE tokens to staking contract...");
      
      const stCoreToken = await ethers.getContractAt("MockDualCORE", ST_CORE_TOKEN);
      const mintTx = await stCoreToken.mint(STAKING_CONTRACT, totalStaked);
      await mintTx.wait();
      console.log("✅ stCORE tokens minted successfully!");
      
      // Verify the fix
      const newContractStCoreBalance = await stCoreToken.balanceOf(STAKING_CONTRACT);
      console.log("New stCORE balance:", ethers.formatEther(newContractStCoreBalance));
      
      console.log("🎉 Staking contract fixed! Users can now stake successfully.");
      
    } catch (error) {
      console.log("❌ Could not transfer ownership:", error instanceof Error ? error.message : String(error));
      console.log("This means the owner has restricted ownership transfer.");
      
      console.log("\n🔧 STEP 2: Redeploying Staking Contract...");
      console.log("-".repeat(40));
      
      // Deploy new staking contract
      console.log("Deploying new CoreStaking contract...");
      const CoreStaking = await ethers.getContractFactory("CoreStaking");
      const newStakingContract = await CoreStaking.deploy(CORE_TOKEN, ST_CORE_TOKEN);
      await newStakingContract.waitForDeployment();
      
      const newStakingAddress = await newStakingContract.getAddress();
      console.log("✅ New staking contract deployed at:", newStakingAddress);
      
      // Mint initial stCORE tokens to the new contract
      const stCoreToken = await ethers.getContractAt("MockDualCORE", ST_CORE_TOKEN);
      const initialAmount = ethers.parseEther("10000"); // 10,000 stCORE tokens
      
      console.log("Minting initial", ethers.formatEther(initialAmount), "stCORE tokens to new contract...");
      const mintTx = await stCoreToken.mint(newStakingAddress, initialAmount);
      await mintTx.wait();
      console.log("✅ Initial stCORE tokens minted!");
      
      // Verify the setup
      const contractStCoreBalance = await stCoreToken.balanceOf(newStakingAddress);
      console.log("New contract stCORE balance:", ethers.formatEther(contractStCoreBalance));
      
      console.log("\n🔧 STEP 3: Updating Frontend Configuration...");
      console.log("-".repeat(40));
      
      console.log("⚠️ IMPORTANT: You need to update the frontend with the new staking contract address!");
      console.log("Old staking contract:", STAKING_CONTRACT);
      console.log("New staking contract:", newStakingAddress);
      
      console.log("\nUpdate these files:");
      console.log("1. coreyield-frontend/contracts/addresses.ts - CORE_STAKING");
      console.log("2. Any other files referencing the old staking contract");
      
      console.log("\n🎉 New staking contract is ready for use!");
      
    }

  } catch (error) {
    console.log("❌ Error fixing staking contract:", error instanceof Error ? error.message : String(error));
    console.log("Full error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

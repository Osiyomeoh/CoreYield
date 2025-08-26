import { ethers } from "hardhat";

async function main() {
  console.log("🧪 TESTING NEW STAKING CONTRACT!");
  console.log("=" .repeat(50));

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const CORE_TOKEN = "0xCf5Eb1CEcf54f792A89C81d3EF636AAc6f4F7B1A";
  const NEW_STAKING_CONTRACT = "0xE4d4bdb6BF9FA8b137340288d5d4e2fC07331d59";

  try {
    const coreToken = await ethers.getContractAt("MockDualCORE", CORE_TOKEN);
    const newStakingContract = await ethers.getContractAt("CoreStaking", NEW_STAKING_CONTRACT);
    
    console.log("✅ Contracts connected successfully");

    const contractStCoreBalance = await coreToken.balanceOf(NEW_STAKING_CONTRACT);
    const totalStaked = await newStakingContract.totalStaked();
    
    console.log("New Staking Contract State:");
    console.log("  stCORE Balance:", ethers.formatEther(contractStCoreBalance));
    console.log("  Total Staked:", ethers.formatEther(totalStaked));
    
    const stakeAmount = ethers.parseEther("10");
    const allowance = await coreToken.allowance(deployer.address, NEW_STAKING_CONTRACT);
    
    if (allowance < stakeAmount) {
      console.log("Approving staking contract...");
      const approveTx = await coreToken.approve(NEW_STAKING_CONTRACT, stakeAmount);
      await approveTx.wait();
      console.log("✅ Approval successful!");
    }
    
    console.log("Staking 10 CORE tokens...");
    const stakeTx = await newStakingContract.stake(stakeAmount);
    await stakeTx.wait();
    console.log("✅ Staking successful!");
    
    console.log("🎉 NEW STAKING CONTRACT IS WORKING! 🎉");

  } catch (error) {
    console.log("❌ Error:", error instanceof Error ? error.message : String(error));
  }
}

main().then(() => process.exit(0)).catch(console.error);

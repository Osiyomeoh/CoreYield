import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Checking CoreStaking contract state...");
  
  // Contract addresses from the frontend
  const CORE_STAKING_ADDRESS = "0xE4d4bdb6BF9FA8b137340288d5d4e2fC07331d59";
  const STCORE_TOKEN_ADDRESS = "0x4D6B4EC6dD26aA2F65e825C9F4Be2F3980506Ba7";
  const CORE_TOKEN_ADDRESS = "0xCf5Eb1CEcf54f792A89C81d3EF636AAc6f4F7B1A";
  
  try {
    // Check if contract exists
    console.log("📋 Checking contract existence...");
    const code = await ethers.provider.getCode(CORE_STAKING_ADDRESS);
    
    if (code === "0x") {
      console.log("❌ Contract does not exist at address:", CORE_STAKING_ADDRESS);
      return;
    }
    
    console.log("✅ Contract exists at address:", CORE_STAKING_ADDRESS);
    console.log("📏 Contract code size:", code.length, "bytes");
    
    // Try to get basic contract info using simple calls
    console.log("📊 Getting basic contract info...");
    
    // Check if we can get the contract instance
    try {
      const CoreStaking = await ethers.getContractFactory("CoreStaking");
      const stakingContract = CoreStaking.attach(CORE_STAKING_ADDRESS);
      
      console.log("✅ Successfully attached to CoreStaking contract");
      
      // Try to call basic view functions
      try {
        const totalStaked = await stakingContract.totalStaked();
        console.log("💰 Total staked:", ethers.formatEther(totalStaked));
      } catch (error) {
        console.log("⚠️ Could not call totalStaked():", error);
      }
      
      try {
        const paused = await stakingContract.paused();
        console.log("⏸️ Contract paused:", paused);
      } catch (error) {
        console.log("⚠️ Could not call paused():", error);
      }
      
      // Check user staking info
      const USER_ADDRESS = "0xCE09931EeBd7d57c10BDcE6dBfA51a1139ec3663";
      console.log("👤 Checking user staking info for:", USER_ADDRESS);
      
      try {
        const userInfo = await stakingContract.userStakingInfo(USER_ADDRESS);
        console.log("📊 User staking info:");
        console.log("  - Staked amount:", ethers.formatEther(userInfo.stakedAmount));
        console.log("  - Rewards:", ethers.formatEther(userInfo.rewards));
        console.log("  - Last stake time:", new Date(Number(userInfo.lastStakeTime) * 1000));
        console.log("  - Lock period:", new Date(Number(userInfo.lockPeriod) * 1000));
      } catch (error) {
        console.log("⚠️ Could not get user staking info:", error);
      }
      
      // Check stCORE token balance
      try {
        const MockStCORE = await ethers.getContractFactory("MockStCORE");
        const stCoreContract = MockStCORE.attach(STCORE_TOKEN_ADDRESS);
        const stCoreBalance = await stCoreContract.balanceOf(USER_ADDRESS);
        console.log("🪙 User stCORE balance:", ethers.formatEther(stCoreBalance));
        
        const stCoreAllowance = await stCoreContract.allowance(USER_ADDRESS, CORE_STAKING_ADDRESS);
        console.log("✅ stCORE allowance for staking contract:", ethers.formatEther(stCoreAllowance));
      } catch (error) {
        console.log("⚠️ Could not check stCORE info:", error);
      }
      
    } catch (error) {
      console.log("❌ Could not attach to contract:", error);
    }
    
  } catch (error) {
    console.error("❌ Error checking contract:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

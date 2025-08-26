import { ethers } from "hardhat";

async function main() {
  console.log("🔍 CHECKING STAKING CONTRACT BALANCES!");
  console.log("=" .repeat(50));

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Contract addresses
  const CORE_TOKEN = "0xCf5Eb1CEcf54f792A89C81d3EF636AAc6f4F7B1A";
  const ST_CORE_TOKEN = "0x4D6B4EC6dD26aA2F65e825C9F4Be2F3980506Ba7";
  const STAKING_CONTRACT = "0xfa60eA709b10C24B444977E485cBC3461E78a741";

  try {
    console.log("\n🔧 STEP 1: Checking Contract Token Balances...");
    console.log("-".repeat(40));
    
    const coreToken = await ethers.getContractAt("MockDualCORE", CORE_TOKEN);
    const stCoreToken = await ethers.getContractAt("MockDualCORE", ST_CORE_TOKEN);
    const stakingContract = await ethers.getContractAt("CoreStaking", STAKING_CONTRACT);
    
    console.log("✅ Contracts connected successfully");

    // Check balances
    const contractCoreBalance = await coreToken.balanceOf(STAKING_CONTRACT);
    const contractStCoreBalance = await stCoreToken.balanceOf(STAKING_CONTRACT);
    
    console.log("Staking Contract Balances:");
    console.log("  CORE Balance:", ethers.formatEther(contractCoreBalance));
    console.log("  stCORE Balance:", ethers.formatEther(contractStCoreBalance));

    console.log("\n🔧 STEP 2: Checking Token Supply...");
    console.log("-".repeat(40));
    
    const totalCoreSupply = await coreToken.totalSupply();
    const totalStCoreSupply = await stCoreToken.totalSupply();
    
    console.log("Token Supply:");
    console.log("  Total CORE Supply:", ethers.formatEther(totalCoreSupply));
    console.log("  Total stCORE Supply:", ethers.formatEther(totalStCoreSupply));

    console.log("\n🔧 STEP 3: Checking Staking Contract State...");
    console.log("-".repeat(40));
    
    const totalStaked = await stakingContract.totalStaked();
    const owner = await stakingContract.owner();
    
    console.log("Staking Contract State:");
    console.log("  Total Staked:", ethers.formatEther(totalStaked));
    console.log("  Owner:", owner);
    console.log("  Deployer:", deployer.address);

    console.log("\n🔧 STEP 4: Analyzing the Problem...");
    console.log("-".repeat(40));
    
    if (contractStCoreBalance < totalStaked) {
      console.log("❌ PROBLEM IDENTIFIED!");
      console.log("  The staking contract needs", ethers.formatEther(totalStaked), "stCORE tokens");
      console.log("  But it only has", ethers.formatEther(contractStCoreBalance), "stCORE tokens");
      console.log("  Shortfall:", ethers.formatEther(totalStaked - contractStCoreBalance), "stCORE tokens");
      
      console.log("\n🔧 STEP 5: Fixing the Issue...");
      console.log("-".repeat(40));
      
      const shortfall = totalStaked - contractStCoreBalance;
      
      if (deployer.address === owner) {
        console.log("✅ Deployer is the owner, can fix this!");
        console.log("Minting", ethers.formatEther(shortfall), "stCORE tokens to staking contract...");
        
        const mintTx = await stCoreToken.mint(STAKING_CONTRACT, shortfall);
        await mintTx.wait();
        console.log("✅ stCORE tokens minted to staking contract!");
        
        // Verify the fix
        const newContractStCoreBalance = await stCoreToken.balanceOf(STAKING_CONTRACT);
        console.log("New stCORE balance:", ethers.formatEther(newContractStCoreBalance));
        
      } else {
        console.log("❌ Deployer is not the owner, cannot fix directly");
        console.log("The owner needs to mint stCORE tokens to the staking contract");
      }
      
    } else {
      console.log("✅ Staking contract has sufficient stCORE tokens");
      console.log("The issue might be elsewhere...");
    }

  } catch (error) {
    console.log("❌ Error checking staking contract:", error instanceof Error ? error.message : String(error));
    console.log("Full error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

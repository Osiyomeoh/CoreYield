import { ethers } from "hardhat";

async function main() {
  console.log("💰 Adding Initial Liquidity to All Pools...");
  console.log("=" .repeat(55));

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const WORKING_AMM = "0x54958530c3D65A6DD67eEf14e6736B85Fb46440A";
  const NEW_ROUTER = "0x5b3FbaF764Eb275DE2888Be36Fce2B1AE53Ea200";

  try {
    const amm = await ethers.getContractAt("CoreYieldAMM", WORKING_AMM);
    const router = await ethers.getContractAt("CoreYieldRouter", NEW_ROUTER);
    console.log("✅ Contracts found");

    // Check current liquidity status
    console.log("\n🔍 Checking Current Liquidity Status...");
    console.log("-".repeat(40));
    
    const pools = [
      { name: "dualCORE PT/YT", token0: "0xf2fFE9D7226F440f3763Fb63A4Dc5483ab675098", token1: "0xADeC3c3A2d07D02a2718E10c311121eA9a94C601" },
      { name: "stCORE PT/YT", token0: "0xf2fFE9D7226F440f3763Fb63A4Dc5483ab675098", token1: "0xADeC3c3A2d07D02a2718E10c311121eA9a94C601" },
      { name: "lstBTC PT/YT", token0: "0xf2fFE9D7226F440f3763Fb63A4Dc5483ab675098", token1: "0xADeC3c3A2d07D02a2718E10c311121eA9a94C601" },
      { name: "dualCORE/stCORE", token0: "0xf2fFE9D7226F440f3763Fb63A4Dc5483ab675098", token1: "0xADeC3c3A2d07D02a2718E10c311121eA9a94C601" },
      { name: "dualCORE/lstBTC", token0: "0xf2fFE9D7226F440f3763Fb63A4Dc5483ab675098", token1: "0xADeC3c3A2d07D02a2718E10c311121eA9a94C601" },
      { name: "stCORE/lstBTC", token0: "0xADeC3c3A2d07D02a2718E10c311121eA9a94C601", token1: "0xf2fFE9D7226F440f3763Fb63A4Dc5483ab675098" }
    ];

    for (const pool of pools) {
      try {
        const poolKey = await amm.getPoolKey(pool.token0, pool.token1);
        const poolData = await amm.pools(poolKey);
        
        console.log(`${pool.name}:`);
        console.log(`  Reserve0: ${ethers.formatEther(poolData.reserve0)}`);
        console.log(`  Reserve1: ${ethers.formatEther(poolData.reserve1)}`);
        console.log(`  Total Supply: ${ethers.formatEther(poolData.totalSupply)}`);
        console.log(`  Is Active: ${poolData.isActive}`);
        console.log("");
      } catch (error) {
        console.log(`❌ Error checking ${pool.name}:`, error.message);
      }
    }

    // Check token balances for deployer
    console.log("\n💰 Checking Deployer Token Balances...");
    console.log("-".repeat(40));
    
    const tokens = [
      { name: "PT Token", address: "0xf2fFE9D7226F440f3763Fb63A4Dc5483ab675098" },
      { name: "YT Token", address: "0xADeC3c3A2d07D02a2718E10c311121eA9a94C601" }
    ];

    for (const token of tokens) {
      try {
        const tokenContract = await ethers.getContractAt("IERC20", token.address);
        const balance = await tokenContract.balanceOf(deployer.address);
        const symbol = await tokenContract.symbol();
        console.log(`${token.name} (${symbol}): ${ethers.formatEther(balance)}`);
      } catch (error) {
        console.log(`❌ Error checking ${token.name}:`, error.message);
      }
    }

    // Add initial liquidity to pools
    console.log("\n🏊 Adding Initial Liquidity...");
    console.log("-".repeat(40));
    
    // Amount to add to each pool (in wei)
    const liquidityAmount = ethers.parseEther("1000"); // 1000 tokens
    
    for (const pool of pools) {
      try {
        console.log(`\nAdding liquidity to ${pool.name}...`);
        
        // Check if we have enough tokens
        const token0Contract = await ethers.getContractAt("IERC20", pool.token0);
        const token1Contract = await ethers.getContractAt("IERC20", pool.token1);
        
        const balance0 = await token0Contract.balanceOf(deployer.address);
        const balance1 = await token1Contract.balanceOf(deployer.address);
        
        if (balance0 < liquidityAmount || balance1 < liquidityAmount) {
          console.log(`⚠️  Insufficient tokens for ${pool.name}`);
          console.log(`  Token0 balance: ${ethers.formatEther(balance0)}`);
          console.log(`  Token1 balance: ${ethers.formatEther(balance1)}`);
          console.log(`  Required: ${ethers.formatEther(liquidityAmount)} each`);
          continue;
        }
        
        // Approve router to spend tokens
        console.log("Approving tokens...");
        await (await token0Contract.approve(NEW_ROUTER, liquidityAmount)).wait();
        await (await token1Contract.approve(NEW_ROUTER, liquidityAmount)).wait();
        console.log("✅ Tokens approved");
        
        // Add liquidity
        console.log("Adding liquidity...");
        const tx = await router.addLiquidity(
          pool.token0,
          pool.token1,
          liquidityAmount,
          liquidityAmount,
          0 // min liquidity
        );
        
        const receipt = await tx.wait();
        console.log(`✅ Liquidity added! TX: ${receipt.hash}`);
        console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
        
      } catch (error) {
        console.log(`❌ Failed to add liquidity to ${pool.name}:`, error.message);
      }
    }

    // Check final liquidity status
    console.log("\n🔍 Final Liquidity Status...");
    console.log("-".repeat(40));
    
    for (const pool of pools) {
      try {
        const poolKey = await amm.getPoolKey(pool.token0, pool.token1);
        const poolData = await amm.pools(poolKey);
        
        console.log(`${pool.name}:`);
        console.log(`  Reserve0: ${ethers.formatEther(poolData.reserve0)}`);
        console.log(`  Reserve1: ${ethers.formatEther(poolData.reserve1)}`);
        console.log(`  Total Supply: ${ethers.formatEther(poolData.totalSupply)}`);
        console.log("");
      } catch (error) {
        console.log(`❌ Error checking ${pool.name}:`, error.message);
      }
    }

    console.log("\n✅ Initial Liquidity Addition Completed!");
    console.log("\n💡 Next Steps:");
    console.log("1. Test PT/YT swaps - they should now work!");
    console.log("2. Test cross-asset swaps");
    console.log("3. Verify yield harvesting functionality");

  } catch (error) {
    console.log("❌ Error in main process:", error.message);
    console.log("Full error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

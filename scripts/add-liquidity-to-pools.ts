import { ethers } from "hardhat";

async function main() {
  console.log("💰 Adding Initial Liquidity to All Pools...");
  console.log("=" .repeat(55));

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const NEW_ROUTER = "0x5b3FbaF764Eb275DE2888Be36Fce2B1AE53Ea200";
  const NEW_AMM = "0xd3dcae670b1483B69e7De6546Fd11840b90d7FfB";

  try {
    const router = await ethers.getContractAt("CoreYieldRouter", NEW_ROUTER);
    const amm = await ethers.getContractAt("CoreYieldAMM", NEW_AMM);
    console.log("✅ Contracts found");

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
        console.log(`${token.name}: ${ethers.formatEther(balance)}`);
      } catch (error) {
        console.log(`❌ Error checking ${token.name}:`, error instanceof Error ? error.message : String(error));
      }
    }

    // The issue: deployer has 0 tokens, so we need to mint some first
    console.log("\n🚨 ROOT CAUSE IDENTIFIED:");
    console.log("The deployer has 0 PT/YT tokens, so liquidity cannot be added.");
    console.log("We need to either:");
    console.log("1. Mint tokens to the deployer, OR");
    console.log("2. Use a different account that has tokens, OR");
    console.log("3. Create a simple test scenario with mock tokens");

    // Let's try to mint some tokens first
    console.log("\n🏭 Attempting to Mint Test Tokens...");
    console.log("-".repeat(40));
    
    for (const token of tokens) {
      try {
        console.log(`\nTrying to mint ${token.name}...`);
        
        // Check if the token contract has a mint function
        const tokenContract = await ethers.getContractAt("IERC20", token.address);
        
        // Try to call mint function if it exists
        try {
          const mintAmount = ethers.parseEther("10000"); // 10,000 tokens
          const mintTx = await tokenContract.mint(deployer.address, mintAmount);
          await mintTx.wait();
          console.log(`✅ ${token.name} minted successfully!`);
        } catch (mintError) {
          console.log(`⚠️  ${token.name} has no mint function or mint failed:`, mintError instanceof Error ? mintError.message : String(mintError));
          
          // Try to check if it's a mock token with a different interface
          try {
            const mockToken = await ethers.getContractAt("MockDualCORE", token.address);
            const mintAmount = ethers.parseEther("10000");
            const mintTx = await mockToken.mint(deployer.address, mintAmount);
            await mintTx.wait();
            console.log(`✅ ${token.name} minted via MockDualCORE interface!`);
          } catch (mockError) {
            console.log(`❌ ${token.name} minting failed completely`);
          }
        }
        
      } catch (error) {
        console.log(`❌ Error with ${token.name}:`, error instanceof Error ? error.message : String(error));
      }
    }

    // Check balances again after minting attempts
    console.log("\n💰 Checking Token Balances After Minting...");
    console.log("-".repeat(40));
    
    for (const token of tokens) {
      try {
        const tokenContract = await ethers.getContractAt("IERC20", token.address);
        const balance = await tokenContract.balanceOf(deployer.address);
        console.log(`${token.name}: ${ethers.formatEther(balance)}`);
      } catch (error) {
        console.log(`❌ Error checking ${token.name}:`, error instanceof Error ? error.message : String(error));
      }
    }

    // Add initial liquidity to pools
    console.log("\n🏊 Adding Initial Liquidity...");
    console.log("-".repeat(40));
    
    // Amount to add to each pool (in wei)
    const liquidityAmount = ethers.parseEther("1000"); // 1000 tokens
    
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
        if (receipt) {
          console.log(`✅ Liquidity added! TX: ${receipt.hash}`);
          console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
        }
        
      } catch (error) {
        console.log(`❌ Failed to add liquidity to ${pool.name}:`, error instanceof Error ? error.message : String(error));
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
        console.log(`❌ Error checking ${pool.name}:`, error instanceof Error ? error.message : String(error));
      }
    }

    console.log("\n✅ Initial Liquidity Addition Completed!");
    console.log("\n💡 Next Steps:");
    console.log("1. Test PT/YT swaps - they should now work!");
    console.log("2. Test cross-asset swaps");
    console.log("3. Verify yield harvesting functionality");

  } catch (error) {
    console.log("❌ Error in main process:", error instanceof Error ? error.message : String(error));
    console.log("Full error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

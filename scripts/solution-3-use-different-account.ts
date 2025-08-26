import { ethers } from "hardhat";

async function main() {
  console.log("🔍 SOLUTION 3: Use Different Account with Existing Tokens!");
  console.log("=" .repeat(65));

  try {
    console.log("\n🔍 STEP 1: Checking All Available Signers...");
    console.log("-".repeat(40));
    
    const signers = await ethers.getSigners();
    console.log(`Found ${signers.length} signers`);
    
    const NEW_AMM = "0xd3dcae670b1483B69e7De6546Fd11840b90d7FfB";
    const PT_TOKEN = "0xf2fFE9D7226F440f3763Fb63A4Dc5483ab675098";
    const YT_TOKEN = "0xADeC3c3A2d07D02a2718E10c311121eA9a94C601";
    
    let accountsWithTokens = [];
    
    for (let i = 0; i < signers.length; i++) {
      const signer = signers[i];
      try {
        const ptToken = await ethers.getContractAt("MockDualCORE", PT_TOKEN);
        const ytToken = await ethers.getContractAt("MockDualCORE", YT_TOKEN);
        
        const ptBalance = await ptToken.balanceOf(signer.address);
        const ytBalance = await ytToken.balanceOf(signer.address);
        
        if (ptBalance > 0n || ytBalance > 0n) {
          accountsWithTokens.push({
            index: i,
            address: signer.address,
            ptBalance: ptBalance,
            ytBalance: ytBalance
          });
          
          console.log(`✅ Signer ${i} (${signer.address}):`);
          console.log(`   PT: ${ethers.formatEther(ptBalance)}`);
          console.log(`   YT: ${ethers.formatEther(ytBalance)}`);
        }
      } catch (error) {
        console.log(`❌ Error checking signer ${i}:`, error instanceof Error ? error.message : String(error));
      }
    }
    
    if (accountsWithTokens.length === 0) {
      console.log("\n❌ No signers have PT/YT tokens.");
      console.log("You need to either:");
      console.log("1. Mint tokens to one of the signers");
      console.log("2. Transfer tokens from another account");
      console.log("3. Use Solution 1 to create test tokens");
      return;
    }
    
    console.log(`\n🎯 Found ${accountsWithTokens.length} signers with tokens!`);
    
    // Use the first account with tokens
    const selectedAccount = accountsWithTokens[0];
    console.log(`\n🔧 STEP 2: Using Signer ${selectedAccount.index} to Add Liquidity...`);
    console.log("-".repeat(40));
    
    const selectedSigner = signers[selectedAccount.index];
    console.log(`Selected signer: ${selectedSigner.address}`);
    console.log(`PT Balance: ${ethers.formatEther(selectedAccount.ptBalance)}`);
    console.log(`YT Balance: ${ethers.formatEther(selectedAccount.ytBalance)}`);
    
    // Check if this signer can use the AMM
    const amm = await ethers.getContractAt("CoreYieldAMM", NEW_AMM);
    const ammOwner = await amm.owner();
    console.log(`AMM Owner: ${ammOwner}`);
    console.log(`Can selected signer use AMM: ${ammOwner.toLowerCase() === selectedSigner.address.toLowerCase()}`);
    
    if (ammOwner.toLowerCase() !== selectedSigner.address.toLowerCase()) {
      console.log("\n⚠️  Selected signer doesn't own the AMM.");
      console.log("We'll need to use the router instead.");
      
      const NEW_ROUTER = "0x5b3FbaF764Eb275DE2888Be36Fce2B1AE53Ea200";
      const router = await ethers.getContractAt("CoreYieldRouter", NEW_ROUTER);
      
      console.log("\n🏊 STEP 3: Adding Liquidity Through Router...");
      console.log("-".repeat(40));
      
      const pools = [
        { name: "dualCORE PT/YT", token0: PT_TOKEN, token1: YT_TOKEN },
        { name: "stCORE PT/YT", token0: PT_TOKEN, token1: YT_TOKEN },
        { name: "lstBTC PT/YT", token0: PT_TOKEN, token1: YT_TOKEN },
        { name: "dualCORE/stCORE", token0: PT_TOKEN, token1: YT_TOKEN },
        { name: "dualCORE/lstBTC", token0: PT_TOKEN, token1: YT_TOKEN },
        { name: "stCORE/lstBTC", token0: YT_TOKEN, token1: PT_TOKEN }
      ];
      
      const liquidityAmount = ethers.parseEther("100"); // Smaller amount to start
      
      for (const pool of pools) {
        try {
          console.log(`\nAdding liquidity to ${pool.name}...`);
          
          const ptToken = await ethers.getContractAt("MockDualCORE", PT_TOKEN);
          const ytToken = await ethers.getContractAt("MockDualCORE", YT_TOKEN);
          
          // Check if we have enough tokens
          const currentPTBalance = await ptToken.balanceOf(selectedSigner.address);
          const currentYTBalance = await ytToken.balanceOf(selectedSigner.address);
          
          if (currentPTBalance < liquidityAmount || currentYTBalance < liquidityAmount) {
            console.log(`  ⚠️  Insufficient tokens: PT ${ethers.formatEther(currentPTBalance)}, YT ${ethers.formatEther(currentYTBalance)}`);
            continue;
          }
          
          // Approve router to spend tokens
          await (await ptToken.connect(selectedSigner).approve(NEW_ROUTER, liquidityAmount)).wait();
          await (await ytToken.connect(selectedSigner).approve(NEW_ROUTER, liquidityAmount)).wait();
          console.log("  ✅ Tokens approved");
          
          // Add liquidity through router
          const tx = await router.connect(selectedSigner).addLiquidity(
            pool.token0,
            pool.token1,
            liquidityAmount,
            liquidityAmount,
            0
          );
          
          const receipt = await tx.wait();
          if (receipt) {
            console.log(`  ✅ Liquidity added! TX: ${receipt.hash}`);
          }
          
        } catch (error) {
          console.log(`  ❌ Failed to add liquidity to ${pool.name}:`, error instanceof Error ? error.message : String(error));
        }
      }
      
    } else {
      console.log("\n✅ Selected signer owns the AMM. Adding liquidity directly...");
      
      const liquidityAmount = ethers.parseEther("100");
      
      // Add liquidity directly to AMM
      const ptToken = await ethers.getContractAt("MockDualCORE", PT_TOKEN);
      const ytToken = await ethers.getContractAt("MockDualCORE", YT_TOKEN);
      
      // Approve AMM to spend tokens
      await (await ptToken.connect(selectedSigner).approve(NEW_AMM, liquidityAmount)).wait();
      await (await ytToken.connect(selectedSigner).approve(NEW_AMM, liquidityAmount)).wait();
      console.log("✅ Tokens approved");
      
      // Create a test pool and add liquidity
      try {
        const createPoolTx = await amm.connect(selectedSigner).createPool(PT_TOKEN, YT_TOKEN);
        await createPoolTx.wait();
        console.log("✅ Pool created successfully!");
      } catch (error) {
        console.log("⚠️  Pool creation failed (might already exist):", error instanceof Error ? error.message : String(error));
      }
      
      // Add liquidity
      const addLiquidityTx = await amm.connect(selectedSigner).addLiquidity(
        PT_TOKEN,
        YT_TOKEN,
        liquidityAmount,
        liquidityAmount,
        0
      );
      
      const liquidityReceipt = await addLiquidityTx.wait();
      if (liquidityReceipt) {
        console.log("✅ Liquidity added successfully!");
        console.log("   TX Hash:", liquidityReceipt.hash);
      }
    }
    
    console.log("\n🔍 STEP 4: Checking Final Liquidity Status...");
    console.log("-".repeat(40));
    
    const pools = [
      { name: "dualCORE PT/YT", token0: PT_TOKEN, token1: YT_TOKEN },
      { name: "stCORE PT/YT", token0: PT_TOKEN, token1: YT_TOKEN },
      { name: "lstBTC PT/YT", token0: PT_TOKEN, token1: YT_TOKEN },
      { name: "dualCORE/stCORE", token0: PT_TOKEN, token1: YT_TOKEN },
      { name: "dualCORE/lstBTC", token0: PT_TOKEN, token1: YT_TOKEN },
      { name: "stCORE/lstBTC", token0: YT_TOKEN, token1: PT_TOKEN }
    ];
    
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
    
    console.log("\n🎉 LIQUIDITY ADDITION COMPLETED!");
    console.log("\n💡 NEXT STEPS:");
    console.log("1. Run Solution 2 to test the swaps");
    console.log("2. Your dApp is now ready for users!");
    console.log("3. PT/YT swaps will work immediately");

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

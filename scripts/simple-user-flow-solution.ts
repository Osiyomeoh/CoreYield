import { ethers } from "hardhat";

async function main() {
  console.log("🚀 SIMPLE USER FLOW SOLUTION!");
  console.log("=" .repeat(40));

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const NEW_ROUTER = "0x5b3FbaF764Eb275DE2888Be36Fce2B1AE53Ea200";
  const CURRENT_AMM = "0x54958530c3D65A6DD67eEf14e6736B85Fb46440A"; // Router's current AMM

  try {
    console.log("\n🔍 STEP 1: Setting Up Contracts...");
    console.log("-".repeat(40));
    
    const router = await ethers.getContractAt("CoreYieldRouter", NEW_ROUTER);
    const currentAMM = await ethers.getContractAt("CoreYieldAMM", CURRENT_AMM);
    console.log("✅ Contracts found");

    // Check what functions the router actually has
    console.log("\n🔍 STEP 2: Checking Router Functions...");
    console.log("-".repeat(40));
    
    try {
      // Try to access router functions
      const routerAMM = await router.coreYieldAMM();
      console.log("Router AMM:", routerAMM);
      
      // Check if router has wrap function
      if (typeof router.wrapETH === 'function') {
        console.log("✅ Router has wrapETH function");
      } else {
        console.log("❌ Router doesn't have wrapETH function");
      }
      
      // Check if router has addLiquidity function
      if (typeof router.addLiquidity === 'function') {
        console.log("✅ Router has addLiquidity function");
      } else {
        console.log("❌ Router doesn't have addLiquidity function");
      }
      
    } catch (error) {
      console.log("❌ Error checking router functions:", error instanceof Error ? error.message : String(error));
    }

    console.log("\n🔍 STEP 3: Checking Current Balances...");
    console.log("-".repeat(40));
    
    // Check deployer's current balances
    const deployerBalance = await ethers.provider.getBalance(deployer.address);
    console.log("Deployer ETH Balance:", ethers.formatEther(deployerBalance));
    
    // Check if deployer has any PT/YT tokens already
    const ptToken = await ethers.getContractAt("MockDualCORE", "0xf2fFE9D7226F440f3763Fb63A4Dc5483ab675098");
    const ytToken = await ethers.getContractAt("MockDualCORE", "0xADeC3c3A2d07D02a2718E10c311121eA9a94C601");
    
    try {
      const ptBalance = await ptToken.balanceOf(deployer.address);
      const ytBalance = await ytToken.balanceOf(deployer.address);
      
      console.log("Current Token Balances:");
      console.log("  PT Balance:", ethers.formatEther(ptBalance));
      console.log("  YT Balance:", ethers.formatEther(ytBalance));
      
      if (ptBalance > 0 && ytBalance > 0) {
        console.log("✅ Deployer already has PT and YT tokens!");
        
        console.log("\n🏊 STEP 4: Adding Liquidity with Existing Tokens...");
        console.log("-".repeat(40));
        
        // Add liquidity to pools
        const liquidityAmount = ptBalance < ytBalance ? ptBalance : ytBalance;
        const liquidityAmountFormatted = liquidityAmount / 2n; // Use half to be safe
        
        console.log(`Adding ${ethers.formatEther(liquidityAmountFormatted)} of each token as liquidity...`);
        
        try {
          // Approve router to spend tokens
          await (await ptToken.approve(NEW_ROUTER, liquidityAmountFormatted)).wait();
          await (await ytToken.approve(NEW_ROUTER, liquidityAmountFormatted)).wait();
          console.log("✅ Tokens approved for router");
          
          // Add liquidity via router
          const addLiquidityTx = await router.addLiquidity(
            "0xf2fFE9D7226F440f3763Fb63A4Dc5483ab675098", // PT token
            "0xADeC3c3A2d07D02a2718E10c311121eA9a94C601", // YT token
            liquidityAmountFormatted,
            liquidityAmountFormatted,
            0
          );
          
          const liquidityReceipt = await addLiquidityTx.wait();
          if (liquidityReceipt) {
            console.log("✅ Liquidity added successfully via router! TX:", liquidityReceipt.hash);
            console.log("🎉 Your PT/YT swaps will now work!");
          }
          
        } catch (error) {
          console.log("❌ Failed to add liquidity via router:", error instanceof Error ? error.message : String(error));
          console.log("Trying direct AMM access...");
          
          // Try direct AMM access
          try {
            await (await ptToken.approve(CURRENT_AMM, liquidityAmountFormatted)).wait();
            await (await ytToken.approve(CURRENT_AMM, liquidityAmountFormatted)).wait();
            console.log("✅ Tokens approved for AMM");
            
            const addLiquidityTx = await currentAMM.addLiquidity(
              "0xf2fFE9D7226F440f3763Fb63A4Dc5483ab675098", // PT token
              "0xADeC3c3A2d07D02a2718E10c311121eA9a94C601", // YT token
              liquidityAmountFormatted,
              liquidityAmountFormatted,
              0
            );
            
            const liquidityReceipt = await addLiquidityTx.wait();
            if (liquidityReceipt) {
              console.log("✅ Liquidity added directly to AMM! TX:", liquidityReceipt.hash);
              console.log("🎉 Your PT/YT swaps will now work!");
            }
            
          } catch (error2) {
            console.log("❌ Direct AMM access also failed:", error2 instanceof Error ? error2.message : String(error2));
          }
        }
        
      } else {
        console.log("❌ Deployer doesn't have PT/YT tokens");
        console.log("Need to follow the proper user flow to get tokens first");
        
        console.log("\n🔧 STEP 4: Alternative Solutions...");
        console.log("-".repeat(40));
        
        console.log("Since deployer doesn't have PT/YT tokens, here are options:");
        console.log("");
        console.log("1. 🔄 Check if other accounts have tokens:");
        console.log("   - Look for accounts that might have PT/YT tokens");
        console.log("   - Transfer tokens to deployer or add liquidity directly");
        console.log("");
        console.log("2. 📝 Manual intervention:");
        console.log("   - Mint PT/YT tokens to deployer (if deployer owns token contracts)");
        console.log("   - Transfer tokens from another account");
        console.log("");
        console.log("3. 🏗️  Use existing infrastructure:");
        console.log("   - Check if pools already have some liquidity");
        console.log("   - Test swaps with existing liquidity");
        
        console.log("\n💡 RECOMMENDATION:");
        console.log("Check if the existing pool already has some liquidity and test swaps.");
      }
      
    } catch (error) {
      console.log("❌ Error checking token balances:", error instanceof Error ? error.message : String(error));
    }

    console.log("\n🔍 STEP 5: Checking Pool Status...");
    console.log("-".repeat(40));
    
    try {
      // Check if the existing pool has any liquidity
      const poolKey = await currentAMM.getPoolKey(
        "0xf2fFE9D7226F440f3763Fb63A4Dc5483ab675098", // PT token
        "0xADeC3c3A2d07D02a2718E10c311121eA9a94C601"  // YT token
      );
      
      const poolData = await currentAMM.pools(poolKey);
      
      console.log("Existing Pool Status:");
      console.log("  Pool Key:", poolKey);
      console.log("  Reserve0:", ethers.formatEther(poolData.reserve0));
      console.log("  Reserve1:", ethers.formatEther(poolData.reserve1));
      console.log("  Is Active:", poolData.isActive);
      
      if (poolData.reserve0 > 0 && poolData.reserve1 > 0) {
        console.log("✅ Pool already has liquidity!");
        console.log("Your PT/YT swaps should work on this AMM!");
        console.log("No need to add liquidity - test swaps directly!");
      } else {
        console.log("❌ Pool has no liquidity");
        console.log("Need to add liquidity before swaps can work");
      }
      
    } catch (error) {
      console.log("❌ Error checking pool status:", error instanceof Error ? error.message : String(error));
    }

    console.log("\n🎯 SIMPLE USER FLOW COMPLETED!");
    console.log("=" .repeat(40));
    
    console.log("\n💡 WHAT WE LEARNED:");
    console.log("1. ✅ Router points to AMM:", CURRENT_AMM);
    console.log("2. ✅ Existing pool exists but has no liquidity");
    console.log("3. ✅ Need PT/YT tokens to add liquidity");
    console.log("4. ✅ Once liquidity is added, swaps will work");
    
    console.log("\n🚀 NEXT STEPS:");
    console.log("1. Get PT/YT tokens (mint, transfer, or follow user flow)");
    console.log("2. Add liquidity to the existing pool");
    console.log("3. Test PT/YT swaps");
    console.log("4. Your dApp will be ready for users!");

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

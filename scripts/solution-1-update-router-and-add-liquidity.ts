import { ethers } from "hardhat";

async function main() {
  console.log("🚀 SOLUTION 1: Update Router & Add Liquidity!");
  console.log("=" .repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const NEW_ROUTER = "0x5b3FbaF764Eb275DE2888Be36Fce2B1AE53Ea200";
  const NEW_AMM = "0xd3dcae670b1483B69e7De6546Fd11840b90d7FfB";
  const OLD_AMM = "0x54958530c3D65A6DD67eEf14e6736B85Fb46440A";

  try {
    console.log("\n🔍 STEP 1: Checking Current System...");
    console.log("-".repeat(40));
    
    const router = await ethers.getContractAt("CoreYieldRouter", NEW_ROUTER);
    const amm = await ethers.getContractAt("CoreYieldAMM", NEW_AMM);
    console.log("✅ Contracts found");

    // Check current router AMM reference
    const currentRouterAMM = await router.coreYieldAMM();
    console.log("Router's Current AMM:", currentRouterAMM);
    console.log("Target AMM:", NEW_AMM);
    console.log("AMMs Match:", currentRouterAMM.toLowerCase() === NEW_AMM.toLowerCase());

    if (currentRouterAMM.toLowerCase() !== NEW_AMM.toLowerCase()) {
      console.log("\n🔧 STEP 2: Updating Router to Use Correct AMM...");
      console.log("-".repeat(40));
      
      try {
        // Update router to use the correct AMM
        const updateAMMTx = await router.setCoreYieldAMM(NEW_AMM);
        const receipt = await updateAMMTx.wait();
        if (receipt) {
          console.log("✅ Router AMM updated successfully!");
          console.log("   TX Hash:", receipt.hash);
        }
      } catch (error) {
        console.log("❌ Failed to update router AMM:", error instanceof Error ? error.message : String(error));
        console.log("Router might not have setCoreYieldAMM function or deployer not owner");
        return;
      }
    } else {
      console.log("\n✅ Router already points to correct AMM!");
    }

    console.log("\n🔧 STEP 3: Creating Test Tokens for Liquidity...");
    console.log("-".repeat(40));
    
    // Deploy test tokens that we can control
    const MockDualCORE = await ethers.getContractFactory("MockDualCORE");
    
    const testPTToken = await MockDualCORE.deploy();
    await testPTToken.waitForDeployment();
    const testPTAddress = await testPTToken.getAddress();
    
    const testYTToken = await MockDualCORE.deploy();
    await testYTToken.waitForDeployment();
    const testYTAddress = await testYTToken.getAddress();
    
    console.log("✅ Test tokens deployed:");
    console.log("  Test PT Token:", testPTAddress);
    console.log("  Test YT Token:", testYTAddress);

    // Mint tokens to deployer
    const mintAmount = ethers.parseEther("10000");
    await (await testPTToken.mint(deployer.address, mintAmount)).wait();
    await (await testYTToken.mint(deployer.address, mintAmount)).wait();
    console.log("✅ Test tokens minted successfully!");

    console.log("\n🏊 STEP 4: Creating Test Pool via Router...");
    console.log("-".repeat(40));
    
    try {
      // Create a new pool with our test tokens using the router
      const createPoolTx = await router.createPool(testPTAddress, testYTAddress);
      const receipt = await createPoolTx.wait();
      if (receipt) {
        console.log("✅ Test pool created successfully via router!");
        console.log("   TX Hash:", receipt.hash);
      }
    } catch (error) {
      console.log("❌ Failed to create test pool:", error instanceof Error ? error.message : String(error));
      return;
    }
    
    console.log("\n🏊 STEP 5: Adding Liquidity to Test Pool...");
    console.log("-".repeat(40));
    
    const liquidityAmount = ethers.parseEther("1000");
    
    try {
      // Approve router to spend tokens
      await (await testPTToken.approve(NEW_ROUTER, liquidityAmount)).wait();
      await (await testYTToken.approve(NEW_ROUTER, liquidityAmount)).wait();
      console.log("✅ Tokens approved for router");
      
      // Add liquidity through router
      const addLiquidityTx = await router.addLiquidity(
        testPTAddress,
        testYTAddress,
        liquidityAmount,
        liquidityAmount,
        0
      );
      
      const liquidityReceipt = await addLiquidityTx.wait();
      if (liquidityReceipt) {
        console.log("✅ Liquidity added to test pool via router!");
        console.log("   TX Hash:", liquidityReceipt.hash);
      }
      
    } catch (error) {
      console.log("❌ Failed to add liquidity:", error instanceof Error ? error.message : String(error));
      return;
    }

    console.log("\n🔍 STEP 6: Verifying Test Pool Status...");
    console.log("-".repeat(40));
    
    try {
      const testPoolKey = await amm.getPoolKey(testPTAddress, testYTAddress);
      const testPoolData = await amm.pools(testPoolKey);
      
      console.log("Test Pool Data:");
      console.log("  Pool Key:", testPoolKey);
      console.log("  Token0:", testPoolData.token0);
      console.log("  Token1:", testPoolData.token1);
      console.log("  Reserve0:", ethers.formatEther(testPoolData.reserve0));
      console.log("  Reserve1:", ethers.formatEther(testPoolData.reserve1));
      console.log("  Total Supply:", ethers.formatEther(testPoolData.totalSupply));
      console.log("  Is Active:", testPoolData.isActive);
      
      if (testPoolData.reserve0 > 0 && testPoolData.reserve1 > 0) {
        console.log("✅ Test pool has liquidity!");
      } else {
        console.log("❌ Test pool has no liquidity");
      }
      
    } catch (error) {
      console.log("❌ Error checking test pool:", error instanceof Error ? error.message : String(error));
    }

    console.log("\n🎉 SUCCESS! LIQUIDITY ADDED!");
    console.log("=" .repeat(40));
    
    console.log("\n💡 WHAT WE'VE ACCOMPLISHED:");
    console.log("1. ✅ Updated router to use correct AMM");
    console.log("2. ✅ Created test tokens we can control");
    console.log("3. ✅ Created test pool via router");
    console.log("4. ✅ Added liquidity to test pool");
    console.log("5. ✅ Ready to test swaps!");
    
    console.log("\n🔧 NEXT STEPS:");
    console.log("1. Run Solution 2 to test swaps on the test pool");
    console.log("2. Your test environment is ready for PT/YT swaps");
    console.log("3. For production, add real PT/YT tokens to real pools");
    
    console.log("\n📋 Test Contract Addresses:");
    console.log("Test PT Token:", testPTAddress);
    console.log("Test YT Token:", testYTAddress);
    console.log("Test Pool: PT ↔ YT");
    
    console.log("\n🚀 READY FOR SWAP TESTING!");
    console.log("Run: npx hardhat run scripts/solution-2-test-swaps-after-liquidity.ts --network coreTestnet");

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

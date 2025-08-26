import { ethers } from "hardhat";

async function main() {
  console.log("🔍 DEBUGGING MERGE FUNCTION...");
  console.log("=" .repeat(50));

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Use the contract addresses from the latest test
  const TOKEN_OPS = "0x50B653F00B5e15D25A9413e156833DC0c84Dd3F9";
  const SY_TOKEN = "0xAC3c7D32e18f4516bF11d34e01405A1b4AF3ED51";
  const PT_TOKEN = "0x17f090b76D064118d92a468d73DF8ce1296c68C9";
  const YT_TOKEN = "0x209B8a47319241CB38c5Ac8AD9F4BbB3c8205a73";

  try {
    const tokenOps = await ethers.getContractAt("CoreYieldTokenOperations", TOKEN_OPS);
    const syToken = await ethers.getContractAt("StandardizedYieldToken", SY_TOKEN);
    const ptToken = await ethers.getContractAt("MockDualCORE", PT_TOKEN);
    const ytToken = await ethers.getContractAt("MockDualCORE", YT_TOKEN);
    
    console.log("✅ All contracts connected successfully");

    // Check current balances
    const ptBalance = await ptToken.balanceOf(deployer.address);
    const ytBalance = await ytToken.balanceOf(deployer.address);
    const syBalance = await syToken.balanceOf(deployer.address);
    
    console.log("Current Balances:");
    console.log("  PT:", ethers.formatEther(ptBalance));
    console.log("  YT:", ethers.formatEther(ytBalance));
    console.log("  SY:", ethers.formatEther(syBalance));

    // Check if we have enough tokens to merge
    const mergeAmount = ethers.parseEther("50");
    
    if (ptBalance < mergeAmount) {
      console.log("❌ Not enough PT tokens for merge. Need:", ethers.formatEther(mergeAmount));
      return;
    }
    
    if (ytBalance < mergeAmount) {
      console.log("❌ Not enough YT tokens for merge. Need:", ethers.formatEther(mergeAmount));
      return;
    }

    console.log("\n🔧 Testing mergePTYT function...");
    console.log("Merge amount:", ethers.formatEther(mergeAmount));

    // Check if the function exists
    console.log("Checking if mergePTYT function exists...");
    const functionExists = await tokenOps.mergePTYT.staticCall;
    console.log("Function exists:", !!functionExists);

    // Try to estimate gas for the merge
    try {
      console.log("Estimating gas for merge...");
      const gasEstimate = await tokenOps.mergePTYT.estimateGas(
        SY_TOKEN,
        mergeAmount,
        mergeAmount
      );
      console.log("✅ Gas estimate successful:", gasEstimate.toString());
    } catch (error) {
      console.log("❌ Gas estimation failed:", error instanceof Error ? error.message : String(error));
    }

    // Check if we need to approve tokens
    console.log("\nChecking token approvals...");
    const ptAllowance = await ptToken.allowance(deployer.address, TOKEN_OPS);
    const ytAllowance = await ytToken.allowance(deployer.address, TOKEN_OPS);
    
    console.log("PT Allowance for TokenOps:", ethers.formatEther(ptAllowance));
    console.log("YT Allowance for TokenOps:", ethers.formatEther(ytAllowance));

    if (ptAllowance < mergeAmount) {
      console.log("Approving PT tokens...");
      await (await ptToken.approve(TOKEN_OPS, mergeAmount)).wait();
      console.log("✅ PT tokens approved");
    }

    if (ytAllowance < mergeAmount) {
      console.log("Approving YT tokens...");
      await (await ytToken.approve(TOKEN_OPS, mergeAmount)).wait();
      console.log("✅ YT tokens approved");
    }

    // Now try the actual merge
    console.log("\n🔧 Executing mergePTYT...");
    
    try {
      const mergeTx = await tokenOps.mergePTYT(
        SY_TOKEN,
        mergeAmount,
        mergeAmount
      );
      
      console.log("✅ Merge transaction sent! TX:", mergeTx.hash);
      
      const mergeReceipt = await mergeTx.wait();
      if (mergeReceipt) {
        console.log("✅ Merge successful! Block:", mergeReceipt.blockNumber);
        
        // Check final balances
        const finalPTBalance = await ptToken.balanceOf(deployer.address);
        const finalYTBalance = await ytToken.balanceOf(deployer.address);
        const finalSYBalance = await syToken.balanceOf(deployer.address);
        
        console.log("Final Balances After Merge:");
        console.log("  PT:", ethers.formatEther(finalPTBalance));
        console.log("  YT:", ethers.formatEther(finalYTBalance));
        console.log("  SY:", ethers.formatEther(finalSYBalance));
        
        console.log("\n🎉 MERGE FUNCTION WORKING PERFECTLY!");
      }
    } catch (error) {
      console.log("❌ Merge execution failed:", error instanceof Error ? error.message : String(error));
      console.log("Full error:", error);
    }

  } catch (error) {
    console.log("❌ Error in debug script:", error instanceof Error ? error.message : String(error));
    console.log("Full error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

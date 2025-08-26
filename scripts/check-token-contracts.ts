import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Examining Token Contracts to Understand Token Supply...");
  console.log("=" .repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const tokens = [
    { name: "PT Token", address: "0xf2fFE9D7226F440f3763Fb63A4Dc5483ab675098" },
    { name: "YT Token", address: "0xADeC3c3A2d07D02a2718E10c311121eA9a94C601" }
  ];

  try {
    for (const token of tokens) {
      console.log(`\n🔍 Examining ${token.name}...`);
      console.log("-".repeat(40));
      
      try {
        const tokenContract = await ethers.getContractAt("IERC20", token.address);
        
        // Basic token info
        const name = await tokenContract.name();
        const symbol = await tokenContract.symbol();
        const decimals = await tokenContract.decimals();
        const totalSupply = await tokenContract.totalSupply();
        
        console.log(`Name: ${name}`);
        console.log(`Symbol: ${symbol}`);
        console.log(`Decimals: ${decimals}`);
        console.log(`Total Supply: ${ethers.formatUnits(totalSupply, decimals)}`);
        
        // Check deployer balance
        const deployerBalance = await tokenContract.balanceOf(deployer.address);
        console.log(`Deployer Balance: ${ethers.formatUnits(deployerBalance, decimals)}`);
        
        // Check if deployer is owner/minter
        try {
          const owner = await tokenContract.owner();
          console.log(`Owner: ${owner}`);
          console.log(`Is Deployer Owner: ${owner.toLowerCase() === deployer.address.toLowerCase()}`);
        } catch (error) {
          console.log(`Owner function not available`);
        }
        
        // Check for mint function
        try {
          const mintFunction = tokenContract.interface.getFunction("mint");
          console.log(`Mint function: Available`);
          
          // Try to mint some tokens
          if (owner.toLowerCase() === deployer.address.toLowerCase()) {
            console.log("Attempting to mint tokens...");
            const mintAmount = ethers.parseUnits("10000", decimals);
            const mintTx = await tokenContract.mint(deployer.address, mintAmount);
            await mintTx.wait();
            console.log("✅ Tokens minted successfully!");
            
            // Check new balance
            const newBalance = await tokenContract.balanceOf(deployer.address);
            console.log(`New Balance: ${ethers.formatUnits(newBalance, decimals)}`);
          }
        } catch (error) {
          console.log(`Mint function: Not available`);
        }
        
        // Check for other functions that might give tokens
        const functions = [
          "transferFrom", "transfer", "approve", "allowance",
          "mint", "burn", "pause", "unpause", "renounceOwnership"
        ];
        
        console.log("\nAvailable functions:");
        for (const funcName of functions) {
          try {
            const func = tokenContract.interface.getFunction(funcName);
            console.log(`  ✅ ${funcName}`);
          } catch (error) {
            console.log(`  ❌ ${funcName}`);
          }
        }
        
      } catch (error) {
        console.log(`❌ Error examining ${token.name}:`, error instanceof Error ? error.message : String(error));
      }
    }

    // Check if these are mock tokens
    console.log("\n🤖 Checking if these are Mock Tokens...");
    console.log("-".repeat(40));
    
    for (const token of tokens) {
      try {
        // Try to get as MockDualCORE
        const mockToken = await ethers.getContractAt("MockDualCORE", token.address);
        console.log(`\n${token.name} is a MockDualCORE token!`);
        
        // Check if deployer can mint
        try {
          const owner = await mockToken.owner();
          console.log(`Mock Owner: ${owner}`);
          console.log(`Can Deployer Mint: ${owner.toLowerCase() === deployer.address.toLowerCase()}`);
          
          if (owner.toLowerCase() === deployer.address.toLowerCase()) {
            console.log("Attempting to mint via MockDualCORE...");
            const mintAmount = ethers.parseEther("10000");
            const mintTx = await mockToken.mint(deployer.address, mintAmount);
            await mintTx.wait();
            console.log("✅ Mock tokens minted successfully!");
          }
        } catch (error) {
          console.log(`Mock mint failed:`, error instanceof Error ? error.message : String(error));
        }
        
      } catch (error) {
        console.log(`${token.name} is not a MockDualCORE token`);
      }
    }

    console.log("\n💡 SUMMARY:");
    console.log("1. We need to understand how these tokens work");
    console.log("2. We need to get some tokens to add liquidity");
    console.log("3. Once we have tokens, we can add liquidity to pools");
    console.log("4. Then swaps will work!");

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

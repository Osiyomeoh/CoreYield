import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Debugging CoreYield Protocol Deployment...");
  console.log("=" .repeat(60));
  
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("📊 Network Info:");
  console.log("  Network:", network.name, `(Chain ID: ${network.chainId})`);
  console.log("  Deployer:", deployer.address);
  console.log("");

  // Contract addresses from deployment
  const FACTORY_ADDRESS = "0x60d80A4d4040d50384C30856B914688deECfB072";
  const SY_STCORE_ADDRESS = "0x58Ecee33932D5C1CDe558f028E79C722d0B8ebd9";
  const SY_LSTBTC_ADDRESS = "0xe2Fc813E0a3893A6F6E673c31bBB63829AD9fADF";
  const SY_DUALCORE_ADDRESS = "0xb9eaf48C9c7F19216A54D0cCADC3709a4CB7f9D6";

  try {
    // Get factory contract
    const factory = await ethers.getContractAt("CoreYieldFactory", FACTORY_ADDRESS);
    console.log("✅ Factory contract loaded:", await factory.getAddress());
    
    // Check if markets exist
    console.log("\n🏪 Checking Markets...");
    
    // Check stCORE market
    console.log("\n  📍 stCORE Market:");
    try {
      const stCOREMarket = await factory.getMarket(SY_STCORE_ADDRESS);
      console.log("    ✅ Market found!");
      console.log("      Active:", stCOREMarket.active);
      console.log("      SY Token:", stCOREMarket.syToken);
      console.log("      PT Token:", stCOREMarket.ptToken);
      console.log("      YT Token:", stCOREMarket.ytToken);
      console.log("      Maturity:", new Date(Number(stCOREMarket.maturity) * 1000).toISOString());
      console.log("      Total SY Deposited:", ethers.formatEther(stCOREMarket.totalSYDeposited));
    } catch (error) {
      console.log("    ❌ Market not found or error:", error.message);
    }
    
    // Check lstBTC market
    console.log("\n  📍 lstBTC Market:");
    try {
      const lstBTCMarket = await factory.getMarket(SY_LSTBTC_ADDRESS);
      console.log("    ✅ Market found!");
      console.log("      Active:", lstBTCMarket.active);
      console.log("      SY Token:", lstBTCMarket.syToken);
      console.log("      PT Token:", lstBTCMarket.ptToken);
      console.log("      YT Token:", lstBTCMarket.ytToken);
      console.log("      Maturity:", new Date(Number(lstBTCMarket.maturity) * 1000).toISOString());
      console.log("      Total SY Deposited:", ethers.formatEther(lstBTCMarket.totalSYDeposited));
    } catch (error) {
      console.log("    ❌ Market not found or error:", error.message);
    }
    
    // Check dualCORE market
    console.log("\n  📍 dualCORE Market:");
    try {
      const dualCOREMarket = await factory.getMarket(SY_DUALCORE_ADDRESS);
      console.log("    ✅ Market found!");
      console.log("      Active:", dualCOREMarket.active);
      console.log("      SY Token:", dualCOREMarket.syToken);
      console.log("      PT Token:", dualCOREMarket.ptToken);
      console.log("      YT Token:", dualCOREMarket.ytToken);
      console.log("      Maturity:", new Date(Number(dualCOREMarket.maturity) * 1000).toISOString());
      console.log("      Total SY Deposited:", ethers.formatEther(dualCOREMarket.totalSYDeposited));
    } catch (error) {
      console.log("    ❌ Market not found or error:", error.message);
    }
    
    // Test a simple split operation
    console.log("\n🧪 Testing Split Operation...");
    try {
      // Get some test tokens first
      const mockStCORE = await ethers.getContractAt("MockStCORE", "0x415cDc9111c4A57a1E5599716E876bFa5f75B69D");
      const syStCORE = await ethers.getContractAt("StandardizedYieldToken", SY_STCORE_ADDRESS);
      
      console.log("    📊 Current balances:");
      const deployerStCORE = await mockStCORE.balanceOf(deployer.address);
      const deployerSY = await syStCORE.balanceOf(deployer.address);
      console.log("      stCORE:", ethers.formatEther(deployerStCORE));
      console.log("      SY-stCORE:", ethers.formatEther(deployerSY));
      
      if (deployerStCORE > 0) {
        console.log("    🔄 Testing split with existing stCORE...");
        const splitAmount = ethers.parseEther("10");
        
        // Approve first
        await mockStCORE.approve(SY_STCORE_ADDRESS, splitAmount);
        console.log("      ✅ Approved SY contract to spend stCORE");
        
        // Try to split
        const splitTx = await factory.splitTokens(SY_STCORE_ADDRESS, splitAmount);
        console.log("      ✅ Split transaction sent:", splitTx.hash);
        
        const receipt = await splitTx.wait();
        console.log("      ✅ Split transaction confirmed!");
        
        // Check new balances
        const newSY = await syStCORE.balanceOf(deployer.address);
        console.log("      📊 New SY balance:", ethers.formatEther(newSY));
        
                 // Check PT/YT balances
         const stCOREMarket = await factory.getMarket(SY_STCORE_ADDRESS);
         const ptToken = await ethers.getContractAt("CorePrincipalToken", stCOREMarket.ptToken);
         const ytToken = await ethers.getContractAt("CoreYieldToken", stCOREMarket.ytToken);
        
        const ptBalance = await ptToken.balanceOf(deployer.address);
        const ytBalance = await ytToken.balanceOf(deployer.address);
        
        console.log("      📊 PT Balance:", ethers.formatEther(ptBalance));
        console.log("      📊 YT Balance:", ethers.formatEther(ytBalance));
        
      } else {
        console.log("    ⚠️ No stCORE balance to test with");
      }
      
    } catch (error) {
      console.log("    ❌ Split test failed:", error.message);
      console.log("      Error details:", error);
    }
    
  } catch (error) {
    console.error("❌ Debug failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
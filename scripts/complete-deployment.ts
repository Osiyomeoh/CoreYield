import { ethers } from "hardhat";
import { parseEther } from "ethers";

async function main() {
  console.log("🚀 Completing CoreYield deployment...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  // Get deployed contract addresses
  const coreYieldFactory = await ethers.getContractAt("CoreYieldFactory", "0xF2c5f2db5D363586A460eEE635e32928000bE4E4");
  const coreYieldAMM = await ethers.getContractAt("CoreYieldAMM", "0xB0654cF5Ea5538D816271beA125F57f74ec46151");
  const liquidityMining = await ethers.getContractAt("LiquidityMining", "0x2717E1015E2e5865887D05E212fd3ABa1DB5a50F");
  
  const mockStCORE = await ethers.getContractAt("MockStCORE", "0x73FBFEAD08A12c2bFabBAe388a859EEf5099FcF5");
  const mockLstBTC = await ethers.getContractAt("MockLstBTC", "0x26d23E098DfAfd8b62B3D12D840f01fc4a17ee2E");
  const mockDualCORE = await ethers.getContractAt("MockDualCORE", "0x647B6493a9D8674cd2Ca78DBF5551CB3e0a26Fbf");
  
  const syStCORE = await ethers.getContractAt("StandardizedYieldToken", "0x9eD4CB7BD83aE12a5Bc8E9df001ee145117b1A3C");
  const syLstBTC = await ethers.getContractAt("StandardizedYieldToken", "0x5826809a694d980fD5f15eb561E52B954028881D");
  
  console.log("\n📊 Current state:");
  console.log("SY-stCORE balance:", await syStCORE.balanceOf(deployer.address));
  console.log("SY-lstBTC balance:", await syLstBTC.balanceOf(deployer.address));
  
  // Step 1: Wrap tokens to get SY tokens
  console.log("\n🔄 Step 1: Wrapping tokens...");
  
  await mockStCORE.approve(await syStCORE.getAddress(), parseEther("10000"));
  await mockLstBTC.approve(await syLstBTC.getAddress(), parseEther("100"));
  
  console.log("Approvals set for wrapping...");
  
  try {
    const wrapStCORE = await syStCORE.wrap(parseEther("1000"));
    await wrapStCORE.wait();
    console.log("✅ Wrapped 1000 stCORE to SY-stCORE");
  } catch (error) {
    console.log("❌ Failed to wrap stCORE:", error.message);
  }
  
  try {
    const wrapLstBTC = await syLstBTC.wrap(parseEther("10"));
    await wrapLstBTC.wait();
    console.log("✅ Wrapped 10 lstBTC to SY-lstBTC");
  } catch (error) {
    console.log("❌ Failed to wrap lstBTC:", error.message);
  }
  
  console.log("\n📊 After wrapping:");
  console.log("SY-stCORE balance:", await syStCORE.balanceOf(deployer.address));
  console.log("SY-lstBTC balance:", await syLstBTC.balanceOf(deployer.address));
  
  // Step 2: Split tokens to get PT and YT
  console.log("\n✂️ Step 2: Splitting tokens...");
  
  await syStCORE.approve(await coreYieldFactory.getAddress(), parseEther("1000"));
  await syLstBTC.approve(await coreYieldFactory.getAddress(), parseEther("10"));
  
  console.log("Approvals set for splitting...");
  
  try {
    const splitStCORE = await coreYieldFactory.splitTokens(
      await syStCORE.getAddress(),
      parseEther("500"),
      0,
      0
    );
    await splitStCORE.wait();
    console.log("✅ Split 500 SY-stCORE to PT + YT");
  } catch (error) {
    console.log("❌ Failed to split stCORE:", error.message);
  }
  
  try {
    const splitLstBTC = await coreYieldFactory.splitTokens(
      await syLstBTC.getAddress(),
      parseEther("5"),
      0,
      0
    );
    await splitLstBTC.wait();
    console.log("✅ Split 5 SY-lstBTC to PT + YT");
  } catch (error) {
    console.log("❌ Failed to split lstBTC:", error.message);
  }
  
  // Step 3: Check PT/YT balances
  console.log("\n🎯 Step 3: Checking PT/YT balances...");
  
  const market1 = await coreYieldFactory.getMarket(await syStCORE.getAddress());
  const market2 = await coreYieldFactory.getMarket(await syLstBTC.getAddress());
  
  const ptStCORE = await ethers.getContractAt("CorePrincipalToken", market1.ptToken);
  const ytStCORE = await ethers.getContractAt("CoreYieldToken", market1.ytToken);
  const ptLstBTC = await ethers.getContractAt("CorePrincipalToken", market2.ptToken);
  const ytLstBTC = await ethers.getContractAt("CoreYieldToken", market2.ytToken);
  
  console.log("PT-stCORE balance:", await ptStCORE.balanceOf(deployer.address));
  console.log("YT-stCORE balance:", await ytStCORE.balanceOf(deployer.address));
  console.log("PT-lstBTC balance:", await ptLstBTC.balanceOf(deployer.address));
  console.log("YT-lstBTC balance:", await ytLstBTC.balanceOf(deployer.address));
  
  // Step 4: Create AMM pools
  console.log("\n🏊 Step 4: Creating AMM pools...");
  
  await ptStCORE.approve(await coreYieldAMM.getAddress(), parseEther("1000"));
  await ytStCORE.approve(await coreYieldAMM.getAddress(), parseEther("1000"));
  await ptLstBTC.approve(await coreYieldAMM.getAddress(), parseEther("1000"));
  await ytLstBTC.approve(await coreYieldAMM.getAddress(), parseEther("1000"));
  
  console.log("Approvals set for AMM...");
  
  try {
    const pool1 = await coreYieldAMM.createPool(
      await syStCORE.getAddress(),
      parseEther("250"),
      parseEther("250")
    );
    await pool1.wait();
    console.log("✅ AMM Pool 1 (stCORE) created");
  } catch (error) {
    console.log("❌ Failed to create pool 1:", error.message);
  }
  
  try {
    const pool2 = await coreYieldAMM.createPool(
      await syLstBTC.getAddress(),
      parseEther("2.5"),
      parseEther("2.5")
    );
    await pool2.wait();
    console.log("✅ AMM Pool 2 (lstBTC) created");
  } catch (error) {
    console.log("❌ Failed to create pool 2:", error.message);
  }
  
  // Step 5: Setup liquidity mining
  console.log("\n⛏️ Step 5: Setting up liquidity mining...");
  
  try {
    await liquidityMining.addPool(
      await syStCORE.getAddress(),
      await mockDualCORE.getAddress(),
      parseEther("0.1") // 0.1 CORE per second
    );
    console.log("✅ Added stCORE pool to liquidity mining");
  } catch (error) {
    console.log("❌ Failed to add stCORE pool:", error.message);
  }
  
  try {
    await liquidityMining.addPool(
      await syLstBTC.getAddress(),
      await mockDualCORE.getAddress(),
      parseEther("0.05") // 0.05 CORE per second
    );
    console.log("✅ Added lstBTC pool to liquidity mining");
  } catch (error) {
    console.log("❌ Failed to add lstBTC pool:", error.message);
  }
  
  // Mint CORE tokens for rewards
  try {
    await mockDualCORE.mint(await liquidityMining.getAddress(), parseEther("10000"));
    console.log("✅ Minted 10,000 CORE tokens for liquidity mining rewards");
  } catch (error) {
    console.log("❌ Failed to mint CORE tokens:", error.message);
  }
  
  console.log("\n🎉 Deployment completion script finished!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
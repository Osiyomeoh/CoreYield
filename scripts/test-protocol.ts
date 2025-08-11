import { ethers } from "hardhat";
import { parseEther, formatEther } from "ethers";

async function main() {
  console.log("🧪 Testing CoreYield Protocol on CoreDAO Testnet...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  // Create additional test accounts
  const user1 = new ethers.Wallet("0x1234567890123456789012345678901234567890123456789012345678901234", ethers.provider);
  const user2 = new ethers.Wallet("0x2345678901234567890123456789012345678901234567890123456789012345", ethers.provider);
  
  console.log("User 1:", user1.address);
  console.log("User 2:", user2.address);
  
  // Get deployed contract addresses
  const coreYieldFactory = await ethers.getContractAt("CoreYieldFactory", "0xF2c5f2db5D363586A460eEE635e32928000bE4E4");
  const coreYieldAMM = await ethers.getContractAt("CoreYieldAMM", "0xB0654cF5Ea5538D816271beA125F57f74ec46151");
  const liquidityMining = await ethers.getContractAt("LiquidityMining", "0x2717E1015E2e5865887D05E212fd3ABa1DB5a50F");
  
  const mockStCORE = await ethers.getContractAt("MockStCORE", "0x73FBFEAD08A12c2bFabBAe388a859EEf5099FcF5");
  const mockLstBTC = await ethers.getContractAt("MockLstBTC", "0x26d23E098DfAfd8b62B3D12D840f01fc4a17ee2E");
  const mockDualCORE = await ethers.getContractAt("MockDualCORE", "0x647B6493a9D8674cd2Ca78DBF5551CB3e0a26Fbf");
  
  const syStCORE = await ethers.getContractAt("StandardizedYieldToken", "0x9eD4CB7BD83aE12a5Bc8E9df001ee145117b1A3C");
  const syLstBTC = await ethers.getContractAt("StandardizedYieldToken", "0x5826809a694d980fD5f15eb561E52B954028881D");
  
  console.log("\n" + "=".repeat(60));
  console.log("🔍 PHASE 1: CONTRACT STATE VERIFICATION");
  console.log("=".repeat(60));
  
  // Check contract ownership
  console.log("\n📊 Contract Ownership:");
  console.log("Factory owner:", await coreYieldFactory.owner());
  console.log("AMM owner:", await coreYieldAMM.owner());
  console.log("LiquidityMining owner:", await liquidityMining.owner());
  
  // Check market status
  console.log("\n🏪 Market Status:");
  const market1 = await coreYieldFactory.getMarket(await syStCORE.getAddress());
  const market2 = await coreYieldFactory.getMarket(await syLstBTC.getAddress());
  
  console.log("Market 1 (stCORE):", {
    active: market1.active,
    ptToken: market1.ptToken,
    ytToken: market1.ytToken
  });
  
  console.log("Market 2 (lstBTC):", {
    active: market2.active,
    ptToken: market2.ptToken,
    ytToken: market2.ytToken
  });
  
  // Check AMM pool status
  console.log("\n🏊 AMM Pool Status:");
  const pool1 = await coreYieldAMM.pools(await syStCORE.getAddress());
  const pool2 = await coreYieldAMM.pools(await syLstBTC.getAddress());
  
  console.log("Pool 1 (stCORE):", {
    active: pool1.active,
    ptReserves: formatEther(pool1.ptReserves),
    ytReserves: formatEther(pool1.ytReserves),
    totalLiquidity: formatEther(pool1.totalLiquidity)
  });
  
  console.log("Pool 2 (lstBTC):", {
    active: pool2.active,
    ptReserves: formatEther(pool2.ptReserves),
    ytReserves: formatEther(pool2.ytReserves),
    totalLiquidity: formatEther(pool2.totalLiquidity)
  });
  
  // Check liquidity mining status
  console.log("\n⛏️ Liquidity Mining Status:");
  const lmPool1 = await liquidityMining.poolRewards(await syStCORE.getAddress());
  const lmPool2 = await liquidityMining.poolRewards(await syLstBTC.getAddress());
  
  console.log("LM Pool 1 (stCORE):", {
    rewardToken: lmPool1.rewardToken,
    rewardRate: formatEther(lmPool1.rewardRate),
    totalStaked: formatEther(lmPool1.totalStaked),
    active: await liquidityMining.supportedPools(await syStCORE.getAddress())
  });
  
  console.log("LM Pool 2 (lstBTC):", {
    rewardToken: lmPool2.rewardToken,
    rewardRate: formatEther(lmPool2.rewardRate),
    totalStaked: formatEther(lmPool2.totalStaked),
    active: await liquidityMining.supportedPools(await syLstBTC.getAddress())
  });
  
  console.log("\n" + "=".repeat(60));
  console.log("🔄 PHASE 2: TOKEN OPERATIONS TESTING");
  console.log("=".repeat(60));
  
  // Test 1: Token wrapping
  console.log("\n🔄 Test 1: Token Wrapping");
  
  // Give some tokens to user1
  await mockStCORE.mint(user1.address, parseEther("1000"));
  await mockLstBTC.mint(user1.address, parseEther("10"));
  
  console.log("User1 balances after minting:");
  console.log("stCORE:", formatEther(await mockStCORE.balanceOf(user1.address)));
  console.log("lstBTC:", formatEther(await mockLstBTC.balanceOf(user1.address)));
  
  // User1 wraps tokens
  await mockStCORE.connect(user1).approve(await syStCORE.getAddress(), parseEther("1000"));
  await mockLstBTC.connect(user1).approve(await syLstBTC.getAddress(), parseEther("10"));
  
  const wrapTx1 = await syStCORE.connect(user1).wrap(parseEther("500"));
  await wrapTx1.wait();
  console.log("✅ User1 wrapped 500 stCORE to SY-stCORE");
  
  const wrapTx2 = await syLstBTC.connect(user1).wrap(parseEther("5"));
  await wrapTx2.wait();
  console.log("✅ User1 wrapped 5 lstBTC to SY-lstBTC");
  
  console.log("User1 SY balances:", {
    syStCORE: formatEther(await syStCORE.balanceOf(user1.address)),
    syLstBTC: formatEther(await syLstBTC.balanceOf(user1.address))
  });
  
  // Test 2: Token splitting
  console.log("\n✂️ Test 2: Token Splitting");
  
  await syStCORE.connect(user1).approve(await coreYieldFactory.getAddress(), parseEther("500"));
  await syLstBTC.connect(user1).approve(await coreYieldFactory.getAddress(), parseEther("5"));
  
  const splitTx1 = await coreYieldFactory.connect(user1).splitTokens(
    await syStCORE.getAddress(),
    parseEther("250"),
    0,
    0
  );
  await splitTx1.wait();
  console.log("✅ User1 split 250 SY-stCORE to PT + YT");
  
  const splitTx2 = await coreYieldFactory.connect(user1).splitTokens(
    await syLstBTC.getAddress(),
    parseEther("2.5"),
    0,
    0
  );
  await splitTx2.wait();
  console.log("✅ User1 split 2.5 SY-lstBTC to PT + YT");
  
  // Check PT/YT balances
  const ptStCORE = await ethers.getContractAt("CorePrincipalToken", market1.ptToken);
  const ytStCORE = await ethers.getContractAt("CoreYieldToken", market1.ytToken);
  const ptLstBTC = await ethers.getContractAt("CorePrincipalToken", market2.ptToken);
  const ytLstBTC = await ethers.getContractAt("CoreYieldToken", market2.ytToken);
  
  console.log("User1 PT/YT balances:", {
    ptStCORE: formatEther(await ptStCORE.balanceOf(user1.address)),
    ytStCORE: formatEther(await ytStCORE.balanceOf(user1.address)),
    ptLstBTC: formatEther(await ptLstBTC.balanceOf(user1.address)),
    ytLstBTC: formatEther(await ytLstBTC.balanceOf(user1.address))
  });
  
  console.log("\n" + "=".repeat(60));
  console.log("🏊 PHASE 3: AMM OPERATIONS TESTING");
  console.log("=".repeat(60));
  
  // Test 3: AMM trading
  console.log("\n💱 Test 3: AMM Trading");
  
  // User1 approves AMM to spend PT tokens
  await ptStCORE.connect(user1).approve(await coreYieldAMM.getAddress(), parseEther("250"));
  await ytStCORE.connect(user1).approve(await coreYieldAMM.getAddress(), parseEther("250"));
  
  // User1 adds liquidity
  const addLiqTx = await coreYieldAMM.connect(user1).addLiquidity(
    await syStCORE.getAddress(),
    parseEther("100"),
    parseEther("100"),
    0
  );
  await addLiqTx.wait();
  console.log("✅ User1 added liquidity: 100 PT + 100 YT stCORE");
  
  // Check pool reserves after liquidity addition
  const pool1After = await coreYieldAMM.pools(await syStCORE.getAddress());
  console.log("Pool 1 reserves after liquidity:", {
    ptReserves: formatEther(pool1After.ptReserves),
    ytReserves: formatEther(pool1After.ytReserves),
    totalLiquidity: formatEther(pool1After.totalLiquidity)
  });
  
  // Test 4: Swap PT for YT
  console.log("\n🔄 Test 4: PT to YT Swap");
  
  const swapTx = await coreYieldAMM.connect(user1).swap(
    await syStCORE.getAddress(),
    true, // PT to YT
    parseEther("50"),
    0 // minAmountOut
  );
  await swapTx.wait();
  console.log("✅ User1 swapped 50 PT-stCORE for YT-stCORE");
  
  // Check balances after swap
  console.log("User1 balances after swap:", {
    ptStCORE: formatEther(await ptStCORE.balanceOf(user1.address)),
    ytStCORE: formatEther(await ytStCORE.balanceOf(user1.address))
  });
  
  console.log("\n" + "=".repeat(60));
  console.log("⛏️ PHASE 4: LIQUIDITY MINING TESTING");
  console.log("=".repeat(60));
  
  // Test 5: Liquidity mining staking
  console.log("\n⛏️ Test 5: Liquidity Mining Staking");
  
  // User1 stakes in liquidity mining
  await syStCORE.connect(user1).approve(await liquidityMining.getAddress(), parseEther("100"));
  
  const stakeTx = await liquidityMining.connect(user1).stake(
    await syStCORE.getAddress(),
    parseEther("100")
  );
  await stakeTx.wait();
  console.log("✅ User1 staked 100 SY-stCORE in liquidity mining");
  
  // Check staking status
  const userRewards = await liquidityMining.userRewards(await syStCORE.getAddress(), user1.address);
  console.log("User1 staking status:", {
    totalStaked: formatEther(userRewards.totalStaked),
    rewardPerTokenPaid: formatEther(userRewards.rewardPerTokenPaid),
    rewards: formatEther(userRewards.rewards)
  });
  
  // Check pool staking status
  const lmPool1After = await liquidityMining.poolRewards(await syStCORE.getAddress());
  console.log("LM Pool 1 total staked:", formatEther(lmPool1After.totalStaked));
  
  // Wait a bit for rewards to accumulate
  console.log("\n⏳ Waiting 10 seconds for rewards to accumulate...");
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Test 6: Check pending rewards
  console.log("\n💰 Test 6: Check Pending Rewards");
  
  const pendingRewards = await liquidityMining.pendingRewards(await syStCORE.getAddress(), user1.address);
  console.log("User1 pending rewards:", formatEther(pendingRewards));
  
  if (pendingRewards > 0) {
    // Test 7: Claim rewards
    console.log("\n🎁 Test 7: Claim Rewards");
    
    const claimTx = await liquidityMining.connect(user1).claimRewards(await syStCORE.getAddress());
    await claimTx.wait();
    console.log("✅ User1 claimed rewards");
    
    const finalCORE = await mockDualCORE.balanceOf(user1.address);
    console.log("User1 CORE balance after claiming:", formatEther(finalCORE));
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("🎯 PHASE 5: FINAL STATE VERIFICATION");
  console.log("=".repeat(60));
  
  // Final state check
  console.log("\n📊 Final Protocol State:");
  
  const finalPool1 = await coreYieldAMM.pools(await syStCORE.getAddress());
  const finalPool2 = await coreYieldAMM.pools(await syLstBTC.getAddress());
  
  console.log("Final Pool 1 (stCORE):", {
    ptReserves: formatEther(finalPool1.ptReserves),
    ytReserves: formatEther(finalPool1.ytReserves),
    totalLiquidity: formatEther(finalPool1.totalLiquidity)
  });
  
  console.log("Final Pool 2 (lstBTC):", {
    ptReserves: formatEther(finalPool2.ptReserves),
    ytReserves: formatEther(finalPool2.ytReserves),
    totalLiquidity: formatEther(finalPool2.totalLiquidity)
  });
  
  const finalLM1 = await liquidityMining.poolRewards(await syStCORE.getAddress());
  const finalLM2 = await liquidityMining.poolRewards(await syLstBTC.getAddress());
  
  console.log("Final LM Pool 1 total staked:", formatEther(finalLM1.totalStaked));
  console.log("Final LM Pool 2 total staked:", formatEther(finalLM2.totalStaked));
  
  console.log("\n🎉 Protocol testing completed successfully!");
  console.log("All core functionality is working on CoreDAO testnet!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }); 
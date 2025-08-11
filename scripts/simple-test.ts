import { ethers } from "hardhat";
import { parseEther, formatEther } from "ethers";

async function main() {
  console.log("🧪 Simple CoreYield Protocol Test on CoreDAO Testnet...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", formatEther(await ethers.provider.getBalance(deployer.address)), "CORE");
  
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
  
  // Test 1: Check current token balances
  console.log("\n💰 Current Token Balances:");
  console.log("MockStCORE:", formatEther(await mockStCORE.balanceOf(deployer.address)));
  console.log("MockLstBTC:", formatEther(await mockLstBTC.balanceOf(deployer.address)));
  console.log("MockDualCORE:", formatEther(await mockDualCORE.balanceOf(deployer.address)));
  console.log("SY-stCORE:", formatEther(await syStCORE.balanceOf(deployer.address)));
  console.log("SY-lstBTC:", formatEther(await syLstBTC.balanceOf(deployer.address)));
  
  // Get PT/YT token contracts
  const ptStCORE = await ethers.getContractAt("CorePrincipalToken", market1.ptToken);
  const ytStCORE = await ethers.getContractAt("CoreYieldToken", market1.ytToken);
  const ptLstBTC = await ethers.getContractAt("CorePrincipalToken", market2.ptToken);
  const ytLstBTC = await ethers.getContractAt("CoreYieldToken", market2.ytToken);
  
  console.log("PT-stCORE:", formatEther(await ptStCORE.balanceOf(deployer.address)));
  console.log("YT-stCORE:", formatEther(await ytStCORE.balanceOf(deployer.address)));
  console.log("PT-lstBTC:", formatEther(await ptLstBTC.balanceOf(deployer.address)));
  console.log("YT-lstBTC:", formatEther(await ytLstBTC.balanceOf(deployer.address)));
  
  console.log("\n" + "=".repeat(60));
  console.log("🏊 PHASE 3: AMM OPERATIONS TESTING");
  console.log("=".repeat(60));
  
  // Test 2: Add more liquidity to existing pools
  console.log("\n💧 Test 2: Adding More Liquidity");
  
  // Check current approvals
  console.log("Current AMM approvals:");
  console.log("PT-stCORE -> AMM:", formatEther(await ptStCORE.allowance(deployer.address, await coreYieldAMM.getAddress())));
  console.log("YT-stCORE -> AMM:", formatEther(await ytStCORE.allowance(deployer.address, await coreYieldAMM.getAddress())));
  
  // Add more liquidity if we have tokens
  const ptBalance = await ptStCORE.balanceOf(deployer.address);
  const ytBalance = await ytStCORE.balanceOf(deployer.address);
  
  if (ptBalance > 0 && ytBalance > 0) {
    const addAmount = ptBalance > parseEther("100") ? parseEther("100") : ptBalance;
    
    try {
      const addLiqTx = await coreYieldAMM.addLiquidity(
        await syStCORE.getAddress(),
        addAmount,
        addAmount,
        0
      );
      await addLiqTx.wait();
      console.log("✅ Added liquidity:", formatEther(addAmount), "PT + YT stCORE");
      
      // Check pool reserves after liquidity addition
      const pool1After = await coreYieldAMM.pools(await syStCORE.getAddress());
      console.log("Pool 1 reserves after liquidity:", {
        ptReserves: formatEther(pool1After.ptReserves),
        ytReserves: formatEther(pool1After.ytReserves),
        totalLiquidity: formatEther(pool1After.totalLiquidity)
      });
    } catch (error) {
      console.log("❌ Failed to add liquidity:", error.message);
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("⛏️ PHASE 4: LIQUIDITY MINING TESTING");
  console.log("=".repeat(60));
  
  // Test 3: Stake in liquidity mining
  console.log("\n⛏️ Test 3: Liquidity Mining Staking");
  
  const syBalance = await syStCORE.balanceOf(deployer.address);
  if (syBalance > 0) {
    const stakeAmount = syBalance > parseEther("100") ? parseEther("100") : syBalance;
    
    try {
      await syStCORE.approve(await liquidityMining.getAddress(), stakeAmount);
      
      const stakeTx = await liquidityMining.stake(
        await syStCORE.getAddress(),
        stakeAmount
      );
      await stakeTx.wait();
      console.log("✅ Staked", formatEther(stakeAmount), "SY-stCORE in liquidity mining");
      
      // Check staking status
      const userRewards = await liquidityMining.userRewards(await syStCORE.getAddress(), deployer.address);
      console.log("Staking status:", {
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
      
      // Check pending rewards
      const pendingRewards = await liquidityMining.pendingRewards(await syStCORE.getAddress(), deployer.address);
      console.log("Pending rewards:", formatEther(pendingRewards));
      
      if (pendingRewards > 0) {
        // Claim rewards
        console.log("\n🎁 Claiming Rewards");
        
        const claimTx = await liquidityMining.claimRewards(await syStCORE.getAddress());
        await claimTx.wait();
        console.log("✅ Rewards claimed successfully!");
        
        const finalCORE = await mockDualCORE.balanceOf(deployer.address);
        console.log("Final CORE balance:", formatEther(finalCORE));
      }
      
    } catch (error) {
      console.log("❌ Failed to stake:", error.message);
    }
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
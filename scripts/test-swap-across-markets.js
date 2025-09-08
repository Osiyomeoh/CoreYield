const hre = require("hardhat");
const { ethers } = hre;
const CoreYieldAMMABI = require("../coreyield-frontend/src/abis/CoreYieldAMM.json");

const CONTRACTS = {
  CORE_YIELD_AMM: '0xD1463554796b05CB128A0d890c739909695147B6',
  MARKETS: {
    stCORE_0: {
      syToken: '0xd77Ec1b359063e8aa0A0810F0F004e84B156300B',
      ptToken: '0x4f13B431a493FB0Dc78c57eB309A78692D42eF8a',
      ytToken: '0x26a3e8273338CB1fF835431AD4F2B16beE101928',
      underlying: '0x4D6B4EC6dD26aA2F65e825C9F4Be2F3980506Ba7',
      maturity: 1787139257,
      poolReserves: { pt: '37.4', yt: '63.0' }
    },
    stCORE_1: {
      syToken: '0xdC4EE2200b0C305f723559101bC33ef80d6F9D16',
      ptToken: '0x0CcB786FcE2e0cB367b7CF1f8605BEDfe6102018',
      ytToken: '0x67153d28CC1f517Bf14be61ccB8c6f97e5BC5d9C',
      underlying: '0x4D6B4EC6dD26aA2F65e825C9F4Be2F3980506Ba7',
      maturity: 1787139257,
      poolReserves: { pt: '63.0', yt: '39.7' }
    },
    lstBTC_0: {
      syToken: '0x2462695096d3578aBd371C704bd12c5BA7702F48',
      ptToken: '0xd840c9363f6A71E3cfBE6f043577736D7FDb3EEE',
      ytToken: '0xFC5CA3B14BdBcEda9F27b9253381805Bc2FBbDaE',
      underlying: '0xCf5Eb1CEcf54f792A89C81d3EF636AAc6f4F7B1A',
      maturity: 1787139257,
      poolReserves: { pt: '105.0', yt: '95.3' }
    },
    lstBTC_1: {
      syToken: '0x379103dF58731cd59aa3448826C15FA27Ed80D9a',
      ptToken: '0xb522F59D354FC12D4584Ba47BF9224CC59A6BC21',
      ytToken: '0xe4838BA09645038130f63b602f003A34ccfF8f3f',
      underlying: '0xCf5Eb1CEcf54f792A89C81d3EF636AAc6f4F7B1A',
      maturity: 1787139257,
      poolReserves: { pt: '64.0', yt: '39.1' }
    }
  }
};

const erc20ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

// Use the actual ABI from the JSON file
const ammABI = CoreYieldAMMABI.abi;

async function testSwapForMarket(marketKey, market, signer, provider) {
  console.log(`\n🔄 Testing swap for ${marketKey}:`);
  console.log(`   PT Token: ${market.ptToken}`);
  console.log(`   YT Token: ${market.ytToken}`);
  
  try {
    // Check user balances
    const ptContract = new ethers.Contract(market.ptToken, erc20ABI, provider);
    const ytContract = new ethers.Contract(market.ytToken, erc20ABI, provider);
    
    const userAddress = await signer.getAddress();
    const ptBalance = await ptContract.balanceOf(userAddress);
    const ytBalance = await ytContract.balanceOf(userAddress);
    
    console.log(`   User PT Balance: ${ethers.formatEther(ptBalance)}`);
    console.log(`   User YT Balance: ${ethers.formatEther(ytBalance)}`);
    
    if (ptBalance === 0n && ytBalance === 0n) {
      console.log(`   ⚠️  No tokens to swap for ${marketKey}`);
      return { success: false, reason: 'No tokens' };
    }
    
    // Check AMM pool
    const ammContract = new ethers.Contract(CONTRACTS.CORE_YIELD_AMM, ammABI, provider);
    
    try {
      const poolKey = await ammContract.getPoolKey(market.ptToken, market.ytToken);
      console.log(`   Pool Key: ${poolKey}`);
      console.log(`   ✅ Pool exists for ${marketKey}`);
      
    } catch (poolError) {
      console.log(`   ❌ Pool check failed: ${poolError.message}`);
      return { success: false, reason: 'Pool error' };
    }
    
    // Try a small swap (PT to YT)
    const swapAmount = ethers.parseEther("1"); // 1 token
    console.log(`   Testing PT → YT swap: ${ethers.formatEther(swapAmount)} PT`);
    
    // Check allowance
    const ptAllowance = await ptContract.allowance(userAddress, CONTRACTS.CORE_YIELD_AMM);
    console.log(`   PT Allowance: ${ethers.formatEther(ptAllowance)}`);
    
    if (ptAllowance < swapAmount) {
      console.log(`   Approving PT tokens...`);
      const approveTx = await ptContract.connect(signer).approve(CONTRACTS.CORE_YIELD_AMM, swapAmount);
      await approveTx.wait();
      console.log(`   ✅ PT approved`);
    }
    
    // Use a simple calculation for min amount out (5% slippage)
    const minAmountOut = swapAmount * 95n / 100n; // 5% slippage
    console.log(`   Swap Amount: ${ethers.formatEther(swapAmount)} PT`);
    console.log(`   Min Amount Out: ${ethers.formatEther(minAmountOut)} YT`);
    
    // Execute swap
    console.log(`   Executing swap...`);
    const swapTx = await ammContract.connect(signer).swap(
      market.ptToken,
      market.ytToken,
      swapAmount,
      minAmountOut,
      userAddress
    );
    
    console.log(`   Swap transaction sent: ${swapTx.hash}`);
    const receipt = await swapTx.wait();
    
    if (receipt.status === 1) {
      console.log(`   ✅ Swap successful! Gas used: ${receipt.gasUsed}`);
      return { success: true, txHash: swapTx.hash, gasUsed: receipt.gasUsed.toString() };
    } else {
      console.log(`   ❌ Swap failed in transaction`);
      return { success: false, reason: 'Transaction failed' };
    }
    
  } catch (error) {
    console.log(`   ❌ Swap error: ${error.message}`);
    return { success: false, reason: error.message };
  }
}

async function main() {
  const [signer] = await ethers.getSigners();
  const provider = hre.ethers.provider;
  
  console.log("🧪 Testing swaps across all markets...");
  console.log(`👤 User Address: ${await signer.getAddress()}`);
  console.log(`🏦 AMM Address: ${CONTRACTS.CORE_YIELD_AMM}\n`);
  
  const results = {};
  
  for (const [marketKey, market] of Object.entries(CONTRACTS.MARKETS)) {
    results[marketKey] = await testSwapForMarket(marketKey, market, signer, provider);
  }
  
  console.log("\n📊 SWAP TEST RESULTS:");
  console.log("====================");
  
  let successCount = 0;
  let totalCount = 0;
  
  for (const [marketKey, result] of Object.entries(results)) {
    totalCount++;
    if (result.success) {
      successCount++;
      console.log(`✅ ${marketKey}: SUCCESS (Gas: ${result.gasUsed})`);
    } else {
      console.log(`❌ ${marketKey}: FAILED (${result.reason})`);
    }
  }
  
  console.log(`\n🎯 Summary: ${successCount}/${totalCount} markets working`);
  
  if (successCount > 0) {
    console.log("\n✅ Working markets:");
    Object.entries(results).forEach(([market, result]) => {
      if (result.success) {
        console.log(`   - ${market}`);
      }
    });
  }
  
  if (successCount < totalCount) {
    console.log("\n❌ Failed markets:");
    Object.entries(results).forEach(([market, result]) => {
      if (!result.success) {
        console.log(`   - ${market}: ${result.reason}`);
      }
    });
  }
}

main().catch(console.error);

const hre = require("hardhat");
const { ethers } = hre;

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
    }
  }
};

// Correct ABI based on the actual contract
const ammABI = [
  "function owner() view returns (address)",
  "function poolKeys(address, address) view returns (bytes32)",
  "function pools(bytes32) view returns (address, address, uint256, uint256, uint256, uint256, uint256)",
  "function swapExactTokensForTokens(uint256, uint256, address[], address, uint256) returns (uint256[])",
  "function getAmountsOut(uint256, address[]) view returns (uint256[])",
  "function getPoolInfo(address, address) view returns (uint256, uint256, uint256, uint256, uint256)"
];

const erc20ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

async function testCorrectAMM() {
  const [signer] = await ethers.getSigners();
  const provider = hre.ethers.provider;
  const userAddress = await signer.getAddress();
  
  console.log("🔍 Testing with correct AMM contract interface...");
  console.log(`👤 User Address: ${userAddress}`);
  console.log(`🏦 AMM Address: ${CONTRACTS.CORE_YIELD_AMM}\n`);
  
  const market = CONTRACTS.MARKETS.stCORE_0;
  const ammContract = new ethers.Contract(CONTRACTS.CORE_YIELD_AMM, ammABI, provider);
  
  try {
    // 1. Check contract owner
    console.log("📋 Step 1: Checking contract owner...");
    const owner = await ammContract.owner();
    console.log(`   Owner: ${owner}`);
    
    // 2. Check pool key
    console.log("\n🔑 Step 2: Getting pool key...");
    const poolKey = await ammContract.poolKeys(market.ptToken, market.ytToken);
    console.log(`   Pool Key: ${poolKey}`);
    
    if (poolKey === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      console.log("❌ Pool does not exist for PT/YT pair");
      return;
    }
    
    // 3. Check pool data using correct struct
    console.log("\n🏊 Step 3: Getting pool data...");
    const pool = await ammContract.pools(poolKey);
    console.log(`   Token0: ${pool[0]}`);
    console.log(`   Token1: ${pool[1]}`);
    console.log(`   Reserve0: ${ethers.formatEther(pool[2])}`);
    console.log(`   Reserve1: ${ethers.formatEther(pool[3])}`);
    console.log(`   TotalSupply: ${ethers.formatEther(pool[4])}`);
    console.log(`   Fee: ${pool[5]} (${pool[5] / 100}%)`);
    console.log(`   LastUpdateTime: ${pool[6]}`);
    
    // 4. Check using getPoolInfo
    console.log("\n📊 Step 4: Using getPoolInfo...");
    const poolInfo = await ammContract.getPoolInfo(market.ptToken, market.ytToken);
    console.log(`   Reserve0: ${ethers.formatEther(poolInfo[0])}`);
    console.log(`   Reserve1: ${ethers.formatEther(poolInfo[1])}`);
    console.log(`   TotalSupply: ${ethers.formatEther(poolInfo[2])}`);
    console.log(`   Fee: ${poolInfo[3]} (${poolInfo[3] / 100}%)`);
    console.log(`   LastUpdateTime: ${poolInfo[4]}`);
    
    // 5. Check user balances
    console.log("\n💰 Step 5: Checking user balances...");
    const ptContract = new ethers.Contract(market.ptToken, erc20ABI, provider);
    const ytContract = new ethers.Contract(market.ytToken, erc20ABI, provider);
    
    const ptBalance = await ptContract.balanceOf(userAddress);
    const ytBalance = await ytContract.balanceOf(userAddress);
    
    console.log(`   PT Balance: ${ethers.formatEther(ptBalance)}`);
    console.log(`   YT Balance: ${ethers.formatEther(ytBalance)}`);
    
    // 6. Check allowance
    console.log("\n🔐 Step 6: Checking allowance...");
    const ptAllowance = await ptContract.allowance(userAddress, CONTRACTS.CORE_YIELD_AMM);
    console.log(`   PT Allowance: ${ethers.formatEther(ptAllowance)}`);
    
    // 7. Test getAmountsOut
    console.log("\n🧮 Step 7: Testing getAmountsOut...");
    const swapAmount = ethers.parseEther("1");
    const path = [market.ptToken, market.ytToken];
    
    try {
      const amountsOut = await ammContract.getAmountsOut(swapAmount, path);
      console.log(`   Input: ${ethers.formatEther(swapAmount)} PT`);
      console.log(`   Output: ${ethers.formatEther(amountsOut[1])} YT`);
    } catch (error) {
      console.log(`   ❌ getAmountsOut failed: ${error.message}`);
    }
    
    // 8. Try a small swap
    console.log("\n🔄 Step 8: Testing small swap...");
    const smallAmount = ethers.parseEther("0.1");
    const minAmountOut = ethers.parseEther("0.05");
    const deadline = Math.floor(Date.now() / 1000) + 300; // 5 minutes
    
    try {
      const swapTx = await ammContract.connect(signer).swapExactTokensForTokens(
        smallAmount,
        minAmountOut,
        path,
        userAddress,
        deadline
      );
      
      console.log(`   ✅ Swap transaction sent: ${swapTx.hash}`);
      
      const receipt = await swapTx.wait();
      console.log(`   ✅ Swap successful! Gas used: ${receipt.gasUsed}`);
      
      // Check new balances
      const newPtBalance = await ptContract.balanceOf(userAddress);
      const newYtBalance = await ytContract.balanceOf(userAddress);
      
      console.log(`   New PT Balance: ${ethers.formatEther(newPtBalance)}`);
      console.log(`   New YT Balance: ${ethers.formatEther(newYtBalance)}`);
      console.log(`   PT Change: ${ethers.formatEther(ptBalance - newPtBalance)}`);
      console.log(`   YT Change: ${ethers.formatEther(newYtBalance - ytBalance)}`);
      
    } catch (swapError) {
      console.log(`   ❌ Swap failed: ${swapError.message}`);
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }
}

async function main() {
  await testCorrectAMM();
}

main().catch(console.error);

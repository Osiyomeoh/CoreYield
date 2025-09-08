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

const erc20ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

const ammABI = [
  "function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, address to) returns (uint256)",
  "function getPoolKey(address tokenA, address tokenB) view returns (bytes32)",
  "function getPool(bytes32 poolKey) view returns (tuple(address token0, address token1, uint256 reserve0, uint256 reserve1, uint256 totalSupply, bool isYieldPool, bool isActive, uint256 lastUpdateTime, uint256 cumulativeYield0, uint256 cumulativeYield1, uint256 fee0, uint256 fee1, uint256 tradingFee, uint256 yieldMultiplier, uint256 volatilityIndex, uint256 lastPriceUpdate))",
  "function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) pure returns (uint256)"
];

async function debugSwap() {
  const [signer] = await ethers.getSigners();
  const provider = hre.ethers.provider;
  const userAddress = await signer.getAddress();
  
  console.log("🔍 Debugging frontend swap issue...");
  console.log(`👤 User Address: ${userAddress}`);
  console.log(`🏦 AMM Address: ${CONTRACTS.CORE_YIELD_AMM}\n`);
  
  const market = CONTRACTS.MARKETS.stCORE_0;
  const swapAmount = ethers.parseEther("100"); // Same as frontend
  
  try {
    // 1. Check user balances
    console.log("📊 Step 1: Checking user balances...");
    const ptContract = new ethers.Contract(market.ptToken, erc20ABI, provider);
    const ytContract = new ethers.Contract(market.ytToken, erc20ABI, provider);
    
    const ptBalance = await ptContract.balanceOf(userAddress);
    const ytBalance = await ytContract.balanceOf(userAddress);
    
    console.log(`   PT Balance: ${ethers.formatEther(ptBalance)}`);
    console.log(`   YT Balance: ${ethers.formatEther(ytBalance)}`);
    console.log(`   Swap Amount: ${ethers.formatEther(swapAmount)}`);
    
    if (ptBalance < swapAmount) {
      console.log("❌ Insufficient PT balance for swap");
      return;
    }
    
    // 2. Check allowance
    console.log("\n🔐 Step 2: Checking allowance...");
    const ptAllowance = await ptContract.allowance(userAddress, CONTRACTS.CORE_YIELD_AMM);
    console.log(`   PT Allowance: ${ethers.formatEther(ptAllowance)}`);
    console.log(`   Required: ${ethers.formatEther(swapAmount)}`);
    console.log(`   Sufficient: ${ptAllowance >= swapAmount ? '✅' : '❌'}`);
    
    // 3. Check AMM pool
    console.log("\n🏊 Step 3: Checking AMM pool...");
    const ammContract = new ethers.Contract(CONTRACTS.CORE_YIELD_AMM, ammABI, provider);
    
    const poolKey = await ammContract.getPoolKey(market.ptToken, market.ytToken);
    console.log(`   Pool Key: ${poolKey}`);
    
    const pool = await ammContract.getPool(poolKey);
    console.log(`   Pool Active: ${pool.isActive}`);
    console.log(`   Pool Reserves - Token0: ${ethers.formatEther(pool.reserve0)}`);
    console.log(`   Pool Reserves - Token1: ${ethers.formatEther(pool.reserve1)}`);
    
    // 4. Calculate expected output
    console.log("\n🧮 Step 4: Calculating expected output...");
    const isPTToken0 = pool.token0.toLowerCase() === market.ptToken.toLowerCase();
    const reserveIn = isPTToken0 ? pool.reserve0 : pool.reserve1;
    const reserveOut = isPTToken0 ? pool.reserve1 : pool.reserve0;
    
    console.log(`   Token0: ${pool.token0} (${isPTToken0 ? 'PT' : 'YT'})`);
    console.log(`   Token1: ${pool.token1} (${isPTToken0 ? 'YT' : 'PT'})`);
    console.log(`   Reserve In: ${ethers.formatEther(reserveIn)}`);
    console.log(`   Reserve Out: ${ethers.formatEther(reserveOut)}`);
    
    try {
      const expectedOutput = await ammContract.getAmountOut(swapAmount, reserveIn, reserveOut);
      console.log(`   Expected Output: ${ethers.formatEther(expectedOutput)} YT`);
      
      const minAmountOut = expectedOutput * 80n / 100n; // 20% slippage
      console.log(`   Min Amount Out: ${ethers.formatEther(minAmountOut)} YT`);
      
      // 5. Try the swap
      console.log("\n🔄 Step 5: Attempting swap...");
      console.log(`   Input: ${ethers.formatEther(swapAmount)} PT`);
      console.log(`   Min Output: ${ethers.formatEther(minAmountOut)} YT`);
      
      const swapTx = await ammContract.connect(signer).swap(
        market.ptToken,
        market.ytToken,
        swapAmount,
        minAmountOut,
        userAddress
      );
      
      console.log(`   ✅ Swap transaction sent: ${swapTx.hash}`);
      
      const receipt = await swapTx.wait();
      console.log(`   ✅ Swap successful! Gas used: ${receipt.gasUsed}`);
      
      // 6. Check new balances
      console.log("\n📊 Step 6: Checking new balances...");
      const newPtBalance = await ptContract.balanceOf(userAddress);
      const newYtBalance = await ytContract.balanceOf(userAddress);
      
      console.log(`   New PT Balance: ${ethers.formatEther(newPtBalance)}`);
      console.log(`   New YT Balance: ${ethers.formatEther(newYtBalance)}`);
      console.log(`   PT Change: ${ethers.formatEther(ptBalance - newPtBalance)}`);
      console.log(`   YT Change: ${ethers.formatEther(newYtBalance - ytBalance)}`);
      
    } catch (swapError) {
      console.log(`   ❌ Swap failed: ${swapError.message}`);
      
      // Try with smaller amount
      console.log("\n🔄 Step 6: Trying with smaller amount (10 PT)...");
      const smallAmount = ethers.parseEther("10");
      const smallExpectedOutput = await ammContract.getAmountOut(smallAmount, reserveIn, reserveOut);
      const smallMinAmountOut = smallExpectedOutput * 80n / 100n;
      
      console.log(`   Small Amount: ${ethers.formatEther(smallAmount)} PT`);
      console.log(`   Expected Output: ${ethers.formatEther(smallExpectedOutput)} YT`);
      console.log(`   Min Output: ${ethers.formatEther(smallMinAmountOut)} YT`);
      
      try {
        const smallSwapTx = await ammContract.connect(signer).swap(
          market.ptToken,
          market.ytToken,
          smallAmount,
          smallMinAmountOut,
          userAddress
        );
        
        console.log(`   ✅ Small swap successful: ${smallSwapTx.hash}`);
        
        const smallReceipt = await smallSwapTx.wait();
        console.log(`   ✅ Small swap confirmed! Gas: ${smallReceipt.gasUsed}`);
        
      } catch (smallSwapError) {
        console.log(`   ❌ Small swap also failed: ${smallSwapError.message}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Debug failed: ${error.message}`);
    console.log(`Stack trace: ${error.stack}`);
  }
}

main().catch(console.error);

async function main() {
  await debugSwap();
}

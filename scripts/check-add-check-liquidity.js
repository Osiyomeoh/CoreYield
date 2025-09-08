const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const AMM_ADDRESS = '0xD1463554796b05CB128A0d890c739909695147B6';
  const PT_TOKEN = '0x4f13B431a493FB0Dc78c57eB309A78692D42eF8a'; // stCORE_0 PT
  const YT_TOKEN = '0x26a3e8273338CB1fF835431AD4F2B16beE101928'; // stCORE_0 YT
  
  const [deployer] = await hre.ethers.getSigners();
  
  console.log('🔍 LIQUIDITY TEST: Check → Add → Check');
  console.log('User:', deployer.address);
  console.log('PT Token:', PT_TOKEN);
  console.log('YT Token:', YT_TOKEN);
  console.log('AMM Address:', AMM_ADDRESS);
  
  // Create contracts
  const ammContract = new ethers.Contract(AMM_ADDRESS, [
    'function getPoolKey(address,address) view returns (bytes32)',
    'function getPool(bytes32) view returns (tuple(address,address,uint256,uint256,uint256,bool,uint256))',
    'function addLiquidity(address,address,uint256,uint256,uint256) returns (uint256)',
    'function getLPBalance(address) view returns (uint256)'
  ], deployer);
  
  const ptContract = new ethers.Contract(PT_TOKEN, [
    'function balanceOf(address) view returns (uint256)',
    'function allowance(address,address) view returns (uint256)',
    'function approve(address,uint256) returns (bool)'
  ], deployer);
  
  const ytContract = new ethers.Contract(YT_TOKEN, [
    'function balanceOf(address) view returns (uint256)',
    'function allowance(address,address) view returns (uint256)',
    'function approve(address,uint256) returns (bool)'
  ], deployer);
  
  // Function to check pool state
  const checkPoolState = async (label) => {
    console.log(`\n📊 ${label} POOL STATE:`);
    
    try {
      // Get pool key
      const poolKey = await ammContract.getPoolKey(PT_TOKEN, YT_TOKEN);
      console.log('Pool Key:', poolKey);
      
      // Get pool data
      const pool = await ammContract.getPool(poolKey);
      console.log('Pool Data:');
      console.log('  Token0 (YT):', pool[0]);
      console.log('  Token1 (PT):', pool[1]);
      console.log('  Reserve0 (YT):', ethers.formatEther(pool[2]));
      console.log('  Reserve1 (PT):', ethers.formatEther(pool[3]));
      console.log('  Total Supply:', ethers.formatEther(pool[4]));
      console.log('  Is Active:', pool[5]);
      console.log('  Trading Fee:', pool[6].toString());
      
      // Calculate total liquidity value (simple sum)
      const totalLiquidity = parseFloat(ethers.formatEther(pool[2])) + parseFloat(ethers.formatEther(pool[3]));
      console.log('  Total Liquidity Value:', totalLiquidity.toFixed(6));
      
      return pool;
    } catch (error) {
      console.error('❌ Error checking pool state:', error.message);
      return null;
    }
  };
  
  // Function to check user balances
  const checkUserBalances = async (label) => {
    console.log(`\n💰 ${label} USER BALANCES:`);
    
    const ptBalance = await ptContract.balanceOf(deployer.address);
    const ytBalance = await ytContract.balanceOf(deployer.address);
    const lpBalance = await ammContract.getLPBalance(deployer.address);
    
    console.log('PT Balance:', ethers.formatEther(ptBalance));
    console.log('YT Balance:', ethers.formatEther(ytBalance));
    console.log('LP Balance:', ethers.formatEther(lpBalance));
    
    return { ptBalance, ytBalance, lpBalance };
  };
  
  // STEP 1: Check initial state
  console.log('\n' + '='.repeat(60));
  console.log('STEP 1: CHECKING INITIAL POOL STATE');
  console.log('='.repeat(60));
  
  const initialPool = await checkPoolState('INITIAL');
  const initialBalances = await checkUserBalances('INITIAL');
  
  if (!initialPool) {
    console.log('❌ Failed to get initial pool state');
    return;
  }
  
  // STEP 2: Add liquidity
  console.log('\n' + '='.repeat(60));
  console.log('STEP 2: ADDING LIQUIDITY');
  console.log('='.repeat(60));
  
  const addAmount = ethers.parseEther('2'); // Add 2 PT and 2 YT
  
  console.log(`Adding ${ethers.formatEther(addAmount)} PT and ${ethers.formatEther(addAmount)} YT...`);
  
  try {
    // Check allowances
    const ptAllowance = await ptContract.allowance(deployer.address, AMM_ADDRESS);
    const ytAllowance = await ytContract.allowance(deployer.address, AMM_ADDRESS);
    
    console.log('PT Allowance:', ethers.formatEther(ptAllowance));
    console.log('YT Allowance:', ethers.formatEther(ytAllowance));
    
    // Approve if needed
    if (ptAllowance < addAmount) {
      console.log('🔄 Approving PT tokens...');
      const ptApproveTx = await ptContract.approve(AMM_ADDRESS, addAmount);
      await ptApproveTx.wait();
      console.log('✅ PT approved');
    }
    
    if (ytAllowance < addAmount) {
      console.log('🔄 Approving YT tokens...');
      const ytApproveTx = await ytContract.approve(AMM_ADDRESS, addAmount);
      await ytApproveTx.wait();
      console.log('✅ YT approved');
    }
    
    // Add liquidity
    console.log('🔄 Adding liquidity to pool...');
    const addLiquidityTx = await ammContract.addLiquidity(
      PT_TOKEN,
      YT_TOKEN,
      addAmount, // PT amount
      addAmount, // YT amount
      0 // minLiquidity
    );
    
    console.log('Transaction hash:', addLiquidityTx.hash);
    const receipt = await addLiquidityTx.wait();
    console.log('✅ Liquidity added successfully!');
    console.log('Gas used:', receipt.gasUsed.toString());
    
  } catch (error) {
    console.error('❌ Add liquidity failed:', error.message);
    return;
  }
  
  // STEP 3: Check final state
  console.log('\n' + '='.repeat(60));
  console.log('STEP 3: CHECKING FINAL POOL STATE');
  console.log('='.repeat(60));
  
  const finalPool = await checkPoolState('FINAL');
  const finalBalances = await checkUserBalances('FINAL');
  
  if (!finalPool) {
    console.log('❌ Failed to get final pool state');
    return;
  }
  
  // STEP 4: Calculate improvements
  console.log('\n' + '='.repeat(60));
  console.log('STEP 4: LIQUIDITY IMPROVEMENTS');
  console.log('='.repeat(60));
  
  const ytIncrease = parseFloat(ethers.formatEther(finalPool[2])) - parseFloat(ethers.formatEther(initialPool[2]));
  const ptIncrease = parseFloat(ethers.formatEther(finalPool[3])) - parseFloat(ethers.formatEther(initialPool[3]));
  const totalSupplyIncrease = parseFloat(ethers.formatEther(finalPool[4])) - parseFloat(ethers.formatEther(initialPool[4]));
  
  console.log('📈 IMPROVEMENTS:');
  console.log(`YT Reserve: +${ytIncrease.toFixed(6)} tokens`);
  console.log(`PT Reserve: +${ptIncrease.toFixed(6)} tokens`);
  console.log(`Total Supply: +${totalSupplyIncrease.toFixed(6)} LP tokens`);
  
  const totalLiquidityIncrease = ytIncrease + ptIncrease;
  console.log(`Total Liquidity: +${totalLiquidityIncrease.toFixed(6)} tokens`);
  
  // Calculate percentage improvements
  const ytPercentIncrease = (ytIncrease / parseFloat(ethers.formatEther(initialPool[2]))) * 100;
  const ptPercentIncrease = (ptIncrease / parseFloat(ethers.formatEther(initialPool[3]))) * 100;
  
  console.log('\n📊 PERCENTAGE IMPROVEMENTS:');
  console.log(`YT Reserve: +${ytPercentIncrease.toFixed(2)}%`);
  console.log(`PT Reserve: +${ptPercentIncrease.toFixed(2)}%`);
  
  console.log('\n🎉 LIQUIDITY TEST COMPLETED SUCCESSFULLY!');
  console.log('The pool now has significantly more liquidity for better swaps!');
}

main().catch(console.error);

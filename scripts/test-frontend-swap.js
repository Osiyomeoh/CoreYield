const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const AMM_ADDRESS = '0xD1463554796b05CB128A0d890c739909695147B6';
  const PT_TOKEN = '0x4f13B431a493FB0Dc78c57eB309A78692D42eF8a'; // stCORE_0 PT
  const YT_TOKEN = '0x26a3e8273338CB1fF835431AD4F2B16beE101928'; // stCORE_0 YT
  const USER_ADDRESS = '0xCE09931EeBd7d57c10BDcE6dBfA51a1139ec3663'; // Deployer address
  
  const provider = hre.ethers.provider;
  const [deployer] = await hre.ethers.getSigners();
  const wallet = deployer;
  
  console.log('🔍 Testing frontend-style swap...');
  console.log('User:', USER_ADDRESS);
  console.log('PT Token:', PT_TOKEN);
  console.log('YT Token:', YT_TOKEN);
  
  // Check user balances
  const ptContract = new ethers.Contract(PT_TOKEN, [
    'function balanceOf(address) view returns (uint256)',
    'function allowance(address,address) view returns (uint256)',
    'function approve(address,uint256) returns (bool)'
  ], wallet);
  
  const ytContract = new ethers.Contract(YT_TOKEN, [
    'function balanceOf(address) view returns (uint256)',
    'function allowance(address,address) view returns (uint256)',
    'function approve(address,uint256) returns (bool)'
  ], wallet);
  
  console.log('\n📊 Checking balances...');
  const ptBalance = await ptContract.balanceOf(USER_ADDRESS);
  const ytBalance = await ytContract.balanceOf(USER_ADDRESS);
  
  console.log('PT Balance:', ethers.formatEther(ptBalance));
  console.log('YT Balance:', ethers.formatEther(ytBalance));
  
  if (ptBalance < ethers.parseEther('1')) {
    console.log('❌ Insufficient PT balance for test');
    return;
  }
  
  // Check allowance
  console.log('\n🔍 Checking allowance...');
  const ptAllowance = await ptContract.allowance(USER_ADDRESS, AMM_ADDRESS);
  console.log('PT Allowance:', ethers.formatEther(ptAllowance));
  
  if (ptAllowance < ethers.parseEther('1')) {
    console.log('🔄 Approving PT tokens...');
    const approveTx = await ptContract.approve(AMM_ADDRESS, ethers.parseEther('1000'));
    await approveTx.wait();
    console.log('✅ PT approved');
  }
  
  // Test swap
  console.log('\n🔄 Testing swap...');
  const ammContract = new ethers.Contract(AMM_ADDRESS, [
    'function swap(address,address,uint256,uint256,address) returns (bool)'
  ], wallet);
  
  const swapAmount = ethers.parseEther('1'); // 1 PT
  const minAmountOut = ethers.parseEther('0.1'); // Very low minimum for testing
  
  try {
    console.log('Executing swap...');
    const swapTx = await ammContract.swap(
      PT_TOKEN,    // tokenIn
      YT_TOKEN,    // tokenOut  
      swapAmount,  // amountIn
      minAmountOut, // minAmountOut
      USER_ADDRESS // recipient
    );
    
    console.log('Swap transaction hash:', swapTx.hash);
    const receipt = await swapTx.wait();
    console.log('✅ Swap successful!');
    console.log('Gas used:', receipt.gasUsed.toString());
    
    // Check new balances
    const newPtBalance = await ptContract.balanceOf(USER_ADDRESS);
    const newYtBalance = await ytContract.balanceOf(USER_ADDRESS);
    
    console.log('\n📊 New balances:');
    console.log('PT Balance:', ethers.formatEther(newPtBalance));
    console.log('YT Balance:', ethers.formatEther(newYtBalance));
    
  } catch (error) {
    console.error('❌ Swap failed:', error.message);
    
    // Try to decode the error
    if (error.data) {
      console.log('Error data:', error.data);
    }
  }
}

main().catch(console.error);

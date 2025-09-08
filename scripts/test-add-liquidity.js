const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const AMM_ADDRESS = '0xD1463554796b05CB128A0d890c739909695147B6';
  const PT_TOKEN = '0x4f13B431a493FB0Dc78c57eB309A78692D42eF8a'; // stCORE_0 PT
  const YT_TOKEN = '0x26a3e8273338CB1fF835431AD4F2B16beE101928'; // stCORE_0 YT
  
  const [deployer] = await hre.ethers.getSigners();
  
  console.log('🔍 Testing addLiquidity function...');
  console.log('User:', deployer.address);
  console.log('PT Token:', PT_TOKEN);
  console.log('YT Token:', YT_TOKEN);
  
  // Check user balances
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
  
  console.log('\n📊 Checking balances...');
  const ptBalance = await ptContract.balanceOf(deployer.address);
  const ytBalance = await ytContract.balanceOf(deployer.address);
  
  console.log('PT Balance:', ethers.formatEther(ptBalance));
  console.log('YT Balance:', ethers.formatEther(ytBalance));
  
  if (ptBalance < ethers.parseEther('1') || ytBalance < ethers.parseEther('1')) {
    console.log('❌ Insufficient balance for test');
    return;
  }
  
  // Check allowances
  console.log('\n🔍 Checking allowances...');
  const ptAllowance = await ptContract.allowance(deployer.address, AMM_ADDRESS);
  const ytAllowance = await ytContract.allowance(deployer.address, AMM_ADDRESS);
  
  console.log('PT Allowance:', ethers.formatEther(ptAllowance));
  console.log('YT Allowance:', ethers.formatEther(ytAllowance));
  
  // Approve tokens if needed
  const testAmount = ethers.parseEther('1');
  
  if (ptAllowance < testAmount) {
    console.log('🔄 Approving PT tokens...');
    const ptApproveTx = await ptContract.approve(AMM_ADDRESS, testAmount);
    await ptApproveTx.wait();
    console.log('✅ PT approved');
  }
  
  if (ytAllowance < testAmount) {
    console.log('🔄 Approving YT tokens...');
    const ytApproveTx = await ytContract.approve(AMM_ADDRESS, testAmount);
    await ytApproveTx.wait();
    console.log('✅ YT approved');
  }
  
  // Test addLiquidity
  console.log('\n🔄 Testing addLiquidity...');
  const ammContract = new ethers.Contract(AMM_ADDRESS, [
    'function addLiquidity(address,address,uint256,uint256,uint256) returns (uint256)',
    'function getLPBalance(address) view returns (uint256)'
  ], deployer);
  
  try {
    console.log('Adding 1 PT and 1 YT to pool...');
    const addLiquidityTx = await ammContract.addLiquidity(
      PT_TOKEN,
      YT_TOKEN,
      testAmount, // PT amount
      testAmount, // YT amount
      0 // minLiquidity
    );
    
    console.log('Add liquidity transaction hash:', addLiquidityTx.hash);
    const receipt = await addLiquidityTx.wait();
    console.log('✅ Add liquidity successful!');
    console.log('Gas used:', receipt.gasUsed.toString());
    
    // Check LP balance
    const lpBalance = await ammContract.getLPBalance(deployer.address);
    console.log('LP Balance:', ethers.formatEther(lpBalance));
    
    // Check new token balances
    const newPtBalance = await ptContract.balanceOf(deployer.address);
    const newYtBalance = await ytContract.balanceOf(deployer.address);
    
    console.log('\n📊 New balances:');
    console.log('PT Balance:', ethers.formatEther(newPtBalance));
    console.log('YT Balance:', ethers.formatEther(newYtBalance));
    
  } catch (error) {
    console.error('❌ Add liquidity failed:', error.message);
  }
}

main().catch(console.error);

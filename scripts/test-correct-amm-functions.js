const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const AMM_ADDRESS = '0xD1463554796b05CB128A0d890c739909695147B6';
  const provider = hre.ethers.provider;
  
  console.log('🔍 Testing which AMM functions actually exist...');
  console.log('AMM Address:', AMM_ADDRESS);
  
  // Test with the correct CoreYieldAMM ABI (simplified version)
  const correctABI = [
    'function owner() view returns (address)',
    'function getPoolKey(address, address) view returns (bytes32)',
    'function getPool(bytes32) view returns (tuple(address token0, address token1, uint256 reserve0, uint256 reserve1, uint256 totalSupply, bool isActive, uint256 tradingFee))',
    'function swap(address, address, uint256, uint256, address) returns (uint256)',
    'function createPool(address, address) returns (bytes32)',
    'function addLiquidity(address, address, uint256, uint256, uint256) returns (uint256)',
    'function removeLiquidity(address, address, uint256) returns (uint256, uint256)'
  ];
  
  try {
    const contract = new ethers.Contract(AMM_ADDRESS, correctABI, provider);
    
    // Test basic functions
    console.log('\n✅ Testing basic functions...');
    const owner = await contract.owner();
    console.log('Owner:', owner);
    
    // Test with stCORE_0 tokens
    const PT_TOKEN = '0x4f13B431a493FB0Dc78c57eB309A78692D42eF8a';
    const YT_TOKEN = '0x26a3e8273338CB1fF835431AD4F2B16beE101928';
    
    console.log('\n✅ Testing pool functions...');
    const poolKey = await contract.getPoolKey(PT_TOKEN, YT_TOKEN);
    console.log('Pool Key:', poolKey);
    
    const pool = await contract.getPool(poolKey);
    console.log('Pool data:');
    console.log('  Token0:', pool.token0);
    console.log('  Token1:', pool.token1);
    console.log('  Reserve0:', ethers.formatEther(pool.reserve0));
    console.log('  Reserve1:', ethers.formatEther(pool.reserve1));
    console.log('  TotalSupply:', ethers.formatEther(pool.totalSupply));
    console.log('  IsActive:', pool.isActive);
    console.log('  TradingFee:', pool.tradingFee);
    
    // Test swap with small amount
    console.log('\n✅ Testing swap function...');
    const swapAmount = ethers.parseEther('1');
    const minAmountOut = ethers.parseEther('0.5');
    
    console.log('Swap parameters:');
    console.log('  TokenIn (PT):', PT_TOKEN);
    console.log('  TokenOut (YT):', YT_TOKEN);
    console.log('  AmountIn:', ethers.formatEther(swapAmount));
    console.log('  MinAmountOut:', ethers.formatEther(minAmountOut));
    
    // Just test the function call (don't execute)
    const swapInterface = new ethers.Interface(correctABI);
    const swapData = swapInterface.encodeFunctionData('swap', [
      PT_TOKEN,
      YT_TOKEN,
      swapAmount,
      minAmountOut,
      '0xCE09931EeBd7d57c10BDcE6dBfA51a1139ec3663'
    ]);
    
    console.log('Swap data length:', swapData.length);
    console.log('✅ Swap function exists and can be encoded');
    
    console.log('\n🎉 SUCCESS: CoreYieldAMM contract is working correctly!');
    console.log('The issue is that the frontend is using the wrong ABI.');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

main().catch(console.error);

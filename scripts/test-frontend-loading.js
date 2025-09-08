const hre = require("hardhat");
const { ethers } = hre;

// Test if the frontend can load balances
async function testFrontendLoading() {
  console.log('🔍 Testing frontend balance loading...')
  
  const provider = ethers.provider;
  const USER_ADDRESS = '0xCE09931EeBd7d57c10BDcE6dBfA51a1139ec3663';
  
  // Test one market to see if it works
  const testMarket = {
    syToken: '0xdC4EE2200b0C305f723559101bC33ef80d6F9D16',
    ptToken: '0x0CcB786FcE2e0cB367b7CF1f8605BEDfe6102018',
    ytToken: '0x67153d28CC1f517Bf14be61ccB8c6f97e5BC5d9C'
  };
  
  const erc20ABI = [
    {
      "inputs": [{"name": "account", "type": "address"}],
      "name": "balanceOf",
      "outputs": [{"name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    }
  ];
  
  try {
    console.log('📊 Testing stCORE_1 market...');
    
    // Test PT balance
    const ptContract = new ethers.Contract(testMarket.ptToken, erc20ABI, provider);
    const ptBalance = await ptContract.balanceOf(USER_ADDRESS);
    const ptFormatted = parseFloat(ethers.formatEther(ptBalance)).toFixed(2);
    
    // Test YT balance  
    const ytContract = new ethers.Contract(testMarket.ytToken, erc20ABI, provider);
    const ytBalance = await ytContract.balanceOf(USER_ADDRESS);
    const ytFormatted = parseFloat(ethers.formatEther(ytBalance)).toFixed(2);
    
    console.log('✅ PT Balance:', ptFormatted);
    console.log('✅ YT Balance:', ytFormatted);
    
    console.log('\n🎯 This is what the frontend should show:');
    console.log('PT (stCORE):', ptFormatted);
    console.log('YT (stCORE):', ytFormatted);
    
  } catch (error) {
    console.error('❌ Error loading balances:', error.message);
  }
}

testFrontendLoading()
  .then(() => {
    console.log('\n✅ Test completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });

const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const AMM_ADDRESS = '0xD1463554796b05CB128A0d890c739909695147B6';
  const provider = hre.ethers.provider;
  
  console.log('🔍 Debugging AMM contract...');
  console.log('AMM Address:', AMM_ADDRESS);
  
  // Check if contract exists
  const code = await provider.getCode(AMM_ADDRESS);
  console.log('Contract code length:', code.length);
  
  if (code === '0x') {
    console.log('❌ No contract at this address');
    return;
  }
  
  // Try different ABI variations
  const abiVariations = [
    // Standard AMM ABI
    [
      'function owner() view returns (address)',
      'function getPoolKey(address, address) view returns (bytes32)',
      'function getPool(bytes32) view returns (uint256, uint256, uint256)',
      'function swap(address, address, uint256, uint256, address) returns (uint256)'
    ],
    // Alternative ABI
    [
      'function owner() view returns (address)',
      'function getPool(address, address) view returns (uint256, uint256)',
      'function swap(address, address, uint256, uint256, address) returns (uint256)'
    ],
    // Simple ABI
    [
      'function owner() view returns (address)'
    ]
  ];
  
  for (let i = 0; i < abiVariations.length; i++) {
    console.log(`\n🧪 Testing ABI variation ${i + 1}:`);
    
    try {
      const contract = new ethers.Contract(AMM_ADDRESS, abiVariations[i], provider);
      
      // Try owner function
      try {
        const owner = await contract.owner();
        console.log('✅ Owner:', owner);
      } catch (e) {
        console.log('❌ Owner failed:', e.message);
      }
      
      // Try pool functions if available
      if (abiVariations[i].includes('getPoolKey')) {
        const PT_TOKEN = '0x0CcB786FcE2e0cB367b7CF1f8605BEDfe6102018';
        const YT_TOKEN = '0x67153d28CC1f517Bf14be61ccB8c6f97e5BC5d9C';
        
        try {
          const poolKey = await contract.getPoolKey(PT_TOKEN, YT_TOKEN);
          console.log('✅ Pool key:', poolKey);
          
          if (abiVariations[i].includes('getPool(bytes32)')) {
            const pool = await contract.getPool(poolKey);
            console.log('✅ Pool data:', pool);
          }
        } catch (e) {
          console.log('❌ Pool functions failed:', e.message);
        }
      }
      
    } catch (error) {
      console.log('❌ ABI variation failed:', error.message);
    }
  }
  
  // Try raw call to see what happens
  console.log('\n🔍 Raw contract call test:');
  try {
    const result = await provider.call({
      to: AMM_ADDRESS,
      data: '0x8da5cb5b' // owner() function selector
    });
    console.log('Raw owner call result:', result);
  } catch (e) {
    console.log('Raw call failed:', e.message);
  }
}

main().catch(console.error);

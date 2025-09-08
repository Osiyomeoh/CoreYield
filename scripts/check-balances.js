const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log('🔍 BALANCE CHECKER SCRIPT');
  console.log('========================');
  console.log('Deployer (Owner):', deployer.address);
  
  // Use the address you mentioned
  const userAddress = '0x00224492F572944500AB4eb91E413cfA34770c60';
  
  console.log('Checking balances for:', userAddress);
  console.log('');
  
  // Get contract instances
  const MockDualCORE = await ethers.getContractFactory("MockDualCORE");
  const dualCORE = await MockDualCORE.attach("0x4D6B4EC6dD26aA2F65e825C9F4Be2F3980506Ba7");
  
  const MockStCORE = await ethers.getContractFactory("MockStCORE");
  const stCORE = await MockStCORE.attach("0x4D6B4EC6dD26aA2F65e825C9F4Be2F3980506Ba7"); // Same address for testing
  
  const MockLstBTC = await ethers.getContractFactory("MockLstBTC");
  const lstBTC = await MockLstBTC.attach("0x0165878A5942620D5F5D97D775426B7B14B73234");
  
  try {
    // Check CORE (dualCORE) balance
    console.log('--- CORE (dualCORE) Balance ---');
    let balance = await dualCORE.balanceOf(userAddress);
    const coreBalance = ethers.formatEther(balance);
    console.log('CORE Balance:', coreBalance, 'CORE');
    console.log('Is this 54100.07?', coreBalance === '54100.0' || coreBalance === '54100.07');
    
    // Check stCORE balance
    console.log('\n--- stCORE Balance ---');
    balance = await stCORE.balanceOf(userAddress);
    const stCoreBalance = ethers.formatEther(balance);
    console.log('stCORE Balance:', stCoreBalance, 'stCORE');
    console.log('Is this 54100.07?', stCoreBalance === '54100.0' || stCoreBalance === '54100.07');
    
    // Check lstBTC balance
    console.log('\n--- lstBTC Balance ---');
    balance = await lstBTC.balanceOf(userAddress);
    const lstBTCBalance = ethers.formatUnits(balance, 8); // lstBTC has 8 decimals
    console.log('lstBTC Balance:', lstBTCBalance, 'lstBTC');
    console.log('Is this 54100.07?', lstBTCBalance === '54100.0' || lstBTCBalance === '54100.07');
    
    console.log('\n🎯 SUMMARY:');
    console.log('===========');
    if (coreBalance === '54100.0' || coreBalance === '54100.07') {
      console.log('✅ The balance 54100.07 belongs to CORE (dualCORE) tokens');
    } else if (stCoreBalance === '54100.0' || stCoreBalance === '54100.07') {
      console.log('✅ The balance 54100.07 belongs to stCORE tokens');
    } else if (lstBTCBalance === '54100.0' || lstBTCBalance === '54100.07') {
      console.log('✅ The balance 54100.07 belongs to lstBTC tokens');
    } else {
      console.log('❌ No asset found with exactly 54100.07 balance');
      console.log('   CORE:', coreBalance);
      console.log('   stCORE:', stCoreBalance);
      console.log('   lstBTC:', lstBTCBalance);
    }
    
  } catch (error) {
    console.error('❌ Error checking balances:', error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

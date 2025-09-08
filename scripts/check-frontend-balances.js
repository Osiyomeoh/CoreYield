const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log('🔍 FRONTEND BALANCE CHECKER SCRIPT');
  console.log('==================================');
  console.log('Deployer (Owner):', deployer.address);
  
  // Use the address you mentioned
  const userAddress = '0x00224492F572944500AB4eb91E413cfA34770c60';
  
  console.log('Checking balances for:', userAddress);
  console.log('');
  
  // Use the SAME contract addresses as the frontend
  const dualCORE_ADDRESS = '0xCf5Eb1CEcf54f792A89C81d3EF636AAc6f4F7B1A'; // dualCORE
  const stCORE_ADDRESS = '0x4D6B4EC6dD26aA2F65e825C9F4Be2F3980506Ba7'; // stCORE  
  const lstBTC_ADDRESS = '0x0165878A5942620D5F5D97D775426B7B14B73234'; // lstBTC
  
  try {
    // Check CORE (dualCORE) balance - using the frontend address
    console.log('--- CORE (dualCORE) Balance ---');
    console.log('Contract Address:', dualCORE_ADDRESS);
    const dualCORE = await ethers.getContractAt("MockDualCORE", dualCORE_ADDRESS);
    let balance = await dualCORE.balanceOf(userAddress);
    const coreBalance = ethers.formatEther(balance);
    console.log('CORE Balance:', coreBalance, 'CORE');
    console.log('Is this 54100.07?', coreBalance === '54100.0' || coreBalance === '54100.07');
    
    // Check stCORE balance - using the frontend address
    console.log('\n--- stCORE Balance ---');
    console.log('Contract Address:', stCORE_ADDRESS);
    const stCORE = await ethers.getContractAt("MockStCORE", stCORE_ADDRESS);
    balance = await stCORE.balanceOf(userAddress);
    const stCoreBalance = ethers.formatEther(balance);
    console.log('stCORE Balance:', stCoreBalance, 'stCORE');
    console.log('Is this 54100.07?', stCoreBalance === '54100.0' || stCoreBalance === '54100.07');
    
    // Check lstBTC balance - using the frontend address
    console.log('\n--- lstBTC Balance ---');
    console.log('Contract Address:', lstBTC_ADDRESS);
    const lstBTC = await ethers.getContractAt("MockLstBTC", lstBTC_ADDRESS);
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
      console.log('   CORE (dualCORE):', coreBalance);
      console.log('   stCORE:', stCoreBalance);
      console.log('   lstBTC:', lstBTCBalance);
      console.log('\n🔍 Looking for closest match...');
      const balances = [
        { name: 'CORE (dualCORE)', value: parseFloat(coreBalance) },
        { name: 'stCORE', value: parseFloat(stCoreBalance) },
        { name: 'lstBTC', value: parseFloat(lstBTCBalance) }
      ];
      const target = 54100.07;
      const closest = balances.reduce((prev, curr) => 
        Math.abs(curr.value - target) < Math.abs(prev.value - target) ? curr : prev
      );
      console.log(`   Closest match: ${closest.name} with ${closest.value}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking balances:', error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

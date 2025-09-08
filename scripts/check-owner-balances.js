const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log('🔍 OWNER BALANCE CHECKER SCRIPT');
  console.log('================================');
  console.log('Owner Address:', deployer.address);
  console.log('');
  
  // Use the frontend contract addresses
  const dualCORE_ADDRESS = '0xCf5Eb1CEcf54f792A89C81d3EF636AAc6f4F7B1A'; // dualCORE
  const stCORE_ADDRESS = '0x4D6B4EC6dD26aA2F65e825C9F4Be2F3980506Ba7'; // stCORE  
  const lstBTC_ADDRESS = '0x0165878A5942620D5F5D97D775426B7B14B73234'; // lstBTC
  
  try {
    // Check CORE (dualCORE) balance
    console.log('--- CORE (dualCORE) Balance ---');
    console.log('Contract Address:', dualCORE_ADDRESS);
    const dualCORE = await ethers.getContractAt("MockDualCORE", dualCORE_ADDRESS);
    let balance = await dualCORE.balanceOf(deployer.address);
    const coreBalance = ethers.formatEther(balance);
    console.log('CORE Balance:', coreBalance, 'CORE');
    console.log('Is this 54100.07?', coreBalance === '54100.0' || coreBalance === '54100.07');
    
    // Check stCORE balance
    console.log('\n--- stCORE Balance ---');
    console.log('Contract Address:', stCORE_ADDRESS);
    const stCORE = await ethers.getContractAt("MockStCORE", stCORE_ADDRESS);
    balance = await stCORE.balanceOf(deployer.address);
    const stCoreBalance = ethers.formatEther(balance);
    console.log('stCORE Balance:', stCoreBalance, 'stCORE');
    console.log('Is this 54100.07?', stCoreBalance === '54100.0' || stCoreBalance === '54100.07');
    
    // Check lstBTC balance
    console.log('\n--- lstBTC Balance ---');
    console.log('Contract Address:', lstBTC_ADDRESS);
    try {
      const lstBTC = await ethers.getContractAt("MockLstBTC", lstBTC_ADDRESS);
      balance = await lstBTC.balanceOf(deployer.address);
      const lstBTCBalance = ethers.formatUnits(balance, 8); // lstBTC has 8 decimals
      console.log('lstBTC Balance:', lstBTCBalance, 'lstBTC');
      console.log('Is this 54100.07?', lstBTCBalance === '54100.0' || lstBTCBalance === '54100.07');
    } catch (error) {
      console.log('❌ Error reading lstBTC balance:', error.message);
    }
    
    // Also check the original addresses we used in minting
    console.log('\n--- ORIGINAL MINTING ADDRESSES ---');
    console.log('Checking the addresses we used for minting...');
    
    // Check the address we used for minting (0x4D6B4EC6dD26aA2F65e825C9F4Be2F3980506Ba7)
    const originalAddress = '0x4D6B4EC6dD26aA2F65e825C9F4Be2F3980506Ba7';
    console.log('\n--- Checking Original Address ---');
    console.log('Address:', originalAddress);
    
    try {
      const originalContract = await ethers.getContractAt("MockDualCORE", originalAddress);
      balance = await originalContract.balanceOf(deployer.address);
      const originalBalance = ethers.formatEther(balance);
      console.log('Original Contract Balance:', originalBalance, 'CORE');
      console.log('Is this 54100.07?', originalBalance === '54100.0' || originalBalance === '54100.07');
    } catch (error) {
      console.log('❌ Error reading original contract:', error.message);
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('===========');
    const balances = [
      { name: 'CORE (dualCORE)', value: parseFloat(coreBalance) },
      { name: 'stCORE', value: parseFloat(stCoreBalance) }
    ];
    
    const target = 54100.07;
    const exactMatch = balances.find(b => b.value === target || b.value === 54100.0);
    
    if (exactMatch) {
      console.log(`✅ Found exact match: ${exactMatch.name} with ${exactMatch.value}`);
    } else {
      console.log('❌ No exact match found for 54100.07');
      console.log('   CORE (dualCORE):', coreBalance);
      console.log('   stCORE:', stCoreBalance);
      
      const closest = balances.reduce((prev, curr) => 
        Math.abs(curr.value - target) < Math.abs(prev.value - target) ? curr : prev
      );
      console.log(`   Closest match: ${closest.name} with ${closest.value}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking owner balances:', error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

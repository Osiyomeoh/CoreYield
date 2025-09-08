const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log('🪙 SIMPLE TOKEN MINTING TEST');
  console.log('============================');
  console.log('Deployer (Owner):', deployer.address);
  
  // Use the provided address
  const userAddress = '0x00224492F572944500AB4eb91E413cfA34770c60';
  const mintAmount = ethers.parseEther('10000');
  
  console.log('Target User:', userAddress);
  console.log('Mint Amount:', ethers.formatEther(mintAmount), 'tokens');
  console.log('');
  
  // Get contract instances
  const MockDualCORE = await ethers.getContractFactory("MockDualCORE");
  const dualCORE = await MockDualCORE.attach("0x4D6B4EC6dD26aA2F65e825C9F4Be2F3980506Ba7");
  
  try {
    // Check current balance
    let balance = await dualCORE.balanceOf(userAddress);
    console.log('Current Balance:', ethers.formatEther(balance), 'CORE');
    
    // Mint tokens
    console.log('\n--- Minting CORE tokens ---');
    const tx = await dualCORE.connect(deployer).mint(userAddress, mintAmount);
    console.log('Transaction Hash:', tx.hash);
    
    // Wait for confirmation
    await tx.wait();
    console.log('Transaction confirmed!');
    
    // Check new balance
    balance = await dualCORE.balanceOf(userAddress);
    console.log('New Balance:', ethers.formatEther(balance), 'CORE');
    
    console.log('\n🎉 TOKEN MINTING COMPLETED!');
    console.log(`✅ Minted ${ethers.formatEther(mintAmount)} CORE tokens to ${userAddress}`);
    
  } catch (error) {
    console.error('❌ Error minting tokens:', error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

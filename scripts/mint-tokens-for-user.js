const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log('🪙 TOKEN MINTING SCRIPT');
  console.log('========================');
  console.log('Deployer (Owner):', deployer.address);
  
  // Token addresses from the deployed contracts
  const TOKEN_ADDRESSES = {
    CORE: '0x4D6B4EC6dD26aA2F65e825C9F4Be2F3980506Ba7', // MockDualCORE
    stCORE: '0x4D6B4EC6dD26aA2F65e825C9F4Be2F3980506Ba7', // Same as CORE for stCORE
    lstBTC: '0x4D6B4EC6dD26aA2F65e825C9F4Be2F3980506Ba7'  // Same as CORE for lstBTC
  };
  
  // Get user address from command line or use a default
  const userAddress = process.argv[2] || '0xCE09931EeBd7d57c10BDcE6dBfA51a1139ec3663';
  const mintAmount = process.argv[3] || '1000'; // Default 1000 tokens
  
  console.log('Target User:', userAddress);
  console.log('Mint Amount:', mintAmount, 'tokens each');
  console.log('');
  
  // Create contract instances
  const coreContract = new ethers.Contract(TOKEN_ADDRESSES.CORE, [
    'function mint(address to, uint256 amount) external',
    'function balanceOf(address account) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function owner() view returns (address)'
  ], deployer);
  
  // Check if deployer is owner
  try {
    const owner = await coreContract.owner();
    console.log('Contract Owner:', owner);
    
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.log('❌ Deployer is not the owner of the token contract');
      console.log('   You need to use the owner account to mint tokens');
      return;
    }
    console.log('✅ Deployer is the owner, can mint tokens');
  } catch (error) {
    console.log('❌ Error checking ownership:', error.message);
    return;
  }
  
  // Get token decimals
  let decimals;
  try {
    decimals = await coreContract.decimals();
    console.log('Token Decimals:', decimals);
  } catch (error) {
    console.log('⚠️ Could not get decimals, using 18');
    decimals = 18;
  }
  
  const amountWei = ethers.parseUnits(mintAmount, decimals);
  console.log('Amount in Wei:', amountWei.toString());
  console.log('');
  
  // Check current balances
  console.log('📊 CURRENT BALANCES:');
  try {
    const coreBalance = await coreContract.balanceOf(userAddress);
    console.log('CORE Balance:', ethers.formatUnits(coreBalance, decimals));
  } catch (error) {
    console.log('❌ Error reading CORE balance:', error.message);
  }
  
  // Mint tokens
  console.log('🔄 MINTING TOKENS...');
  
  try {
    // Mint CORE tokens
    console.log('Minting CORE tokens...');
    const mintTx = await coreContract.mint(userAddress, amountWei);
    console.log('Transaction hash:', mintTx.hash);
    
    const receipt = await mintTx.wait();
    console.log('✅ CORE tokens minted successfully!');
    console.log('Gas used:', receipt.gasUsed.toString());
    
    // Check new balances
    console.log('');
    console.log('📊 NEW BALANCES:');
    const newCoreBalance = await coreContract.balanceOf(userAddress);
    console.log('CORE Balance:', ethers.formatUnits(newCoreBalance, decimals));
    
    console.log('');
    console.log('🎉 TOKEN MINTING COMPLETED!');
    console.log(`✅ Minted ${mintAmount} CORE tokens to ${userAddress}`);
    console.log('');
    console.log('💡 Note: CORE, stCORE, and lstBTC all use the same token contract');
    console.log('   in this test environment, so minting CORE gives you all three.');
    
  } catch (error) {
    console.error('❌ Minting failed:', error.message);
    
    if (error.message.includes('onlyOwner')) {
      console.log('');
      console.log('🔧 SOLUTION:');
      console.log('1. Make sure you are using the owner account');
      console.log('2. Check that the token contract address is correct');
      console.log('3. Verify the contract is deployed and accessible');
    }
  }
}

// Usage instructions
if (process.argv.length < 2) {
  console.log('🪙 TOKEN MINTING SCRIPT');
  console.log('========================');
  console.log('');
  console.log('Usage:');
  console.log('  npx hardhat run scripts/mint-tokens-for-user.js --network coreTestnet [userAddress] [amount]');
  console.log('');
  console.log('Examples:');
  console.log('  npx hardhat run scripts/mint-tokens-for-user.js --network coreTestnet');
  console.log('  npx hardhat run scripts/mint-tokens-for-user.js --network coreTestnet 0x1234...5678');
  console.log('  npx hardhat run scripts/mint-tokens-for-user.js --network coreTestnet 0x1234...5678 5000');
  console.log('');
  console.log('Parameters:');
  console.log('  userAddress: Address to mint tokens to (optional, defaults to deployer)');
  console.log('  amount: Amount of tokens to mint (optional, defaults to 1000)');
  console.log('');
  process.exit(0);
}

main().catch(console.error);

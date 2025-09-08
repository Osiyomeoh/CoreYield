const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log('🪙 COMPREHENSIVE TOKEN MINTING SCRIPT');
  console.log('=====================================');
  console.log('Deployer (Owner):', deployer.address);
  
  // Get user address from command line or use a default
  const userAddress = process.argv[2] || '0xCE09931EeBd7d57c10BDcE6dBfA51a1139ec3663';
  const mintAmount = process.argv[3] || '10000'; // Default 10000 tokens
  
  console.log('Target User:', userAddress);
  console.log('Mint Amount:', mintAmount, 'tokens each');
  console.log('');
  
  // Token contracts - using the same CORE token for all since they're all mock tokens
  const CORE_TOKEN = '0x4D6B4EC6dD26aA2F65e825C9F4Be2F3980506Ba7';
  
  const coreContract = new ethers.Contract(CORE_TOKEN, [
    'function mint(address to, uint256 amount) external',
    'function balanceOf(address account) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function owner() view returns (address)',
    'function name() view returns (string)',
    'function symbol() view returns (string)'
  ], deployer);
  
  // Check ownership
  try {
    const owner = await coreContract.owner();
    console.log('Contract Owner:', owner);
    
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.log('❌ Deployer is not the owner of the token contract');
      return;
    }
    console.log('✅ Deployer is the owner, can mint tokens');
  } catch (error) {
    console.log('❌ Error checking ownership:', error.message);
    return;
  }
  
  // Get token info
  const tokenName = await coreContract.name();
  const tokenSymbol = await coreContract.symbol();
  const decimals = await coreContract.decimals();
  
  console.log('Token Info:');
  console.log('  Name:', tokenName);
  console.log('  Symbol:', tokenSymbol);
  console.log('  Decimals:', decimals);
  console.log('');
  
  const amountWei = ethers.parseUnits(mintAmount, decimals);
  
  // Check current balance
  console.log('📊 CURRENT BALANCE:');
  const currentBalance = await coreContract.balanceOf(userAddress);
  console.log('Current Balance:', ethers.formatUnits(currentBalance, decimals), tokenSymbol);
  console.log('');
  
  // Mint tokens
  console.log('🔄 MINTING TOKENS...');
  
  try {
    const mintTx = await coreContract.mint(userAddress, amountWei);
    console.log('Transaction hash:', mintTx.hash);
    
    const receipt = await mintTx.wait();
    console.log('✅ Tokens minted successfully!');
    console.log('Gas used:', receipt.gasUsed.toString());
    
    // Check new balance
    console.log('');
    console.log('📊 NEW BALANCE:');
    const newBalance = await coreContract.balanceOf(userAddress);
    console.log('New Balance:', ethers.formatUnits(newBalance, decimals), tokenSymbol);
    
    console.log('');
    console.log('🎉 TOKEN MINTING COMPLETED!');
    console.log(`✅ Minted ${mintAmount} ${tokenSymbol} tokens to ${userAddress}`);
    console.log('');
    console.log('💡 Note: In this test environment, CORE, stCORE, and lstBTC all use the same token contract.');
    console.log('   Minting gives you tokens that can be used as any of these types.');
    console.log('');
    console.log('🔧 Next Steps:');
    console.log('1. Refresh your frontend to see the new balance');
    console.log('2. You can now stake, wrap, and trade with these tokens');
    console.log('3. Use the pools page to add liquidity or swap tokens');
    
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
  console.log('🪙 COMPREHENSIVE TOKEN MINTING SCRIPT');
  console.log('=====================================');
  console.log('');
  console.log('This script mints tokens to any user address using the owner account.');
  console.log('');
  console.log('Usage:');
  console.log('  npx hardhat run scripts/mint-all-tokens.js --network coreTestnet [userAddress] [amount]');
  console.log('');
  console.log('Examples:');
  console.log('  npx hardhat run scripts/mint-all-tokens.js --network coreTestnet');
  console.log('  npx hardhat run scripts/mint-all-tokens.js --network coreTestnet 0x1234...5678');
  console.log('  npx hardhat run scripts/mint-all-tokens.js --network coreTestnet 0x1234...5678 50000');
  console.log('');
  console.log('Parameters:');
  console.log('  userAddress: Address to mint tokens to (optional, defaults to deployer)');
  console.log('  amount: Amount of tokens to mint (optional, defaults to 10000)');
  console.log('');
  console.log('What this does:');
  console.log('  - Mints CORE tokens to the specified address');
  console.log('  - These tokens can be used as CORE, stCORE, or lstBTC in the frontend');
  console.log('  - Perfect for testing the application with fresh tokens');
  console.log('');
  process.exit(0);
}

main().catch(console.error);

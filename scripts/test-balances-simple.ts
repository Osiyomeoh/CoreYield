import { ethers } from 'hardhat'

async function main() {
  console.log('🔍 Testing PT and YT Token Balances...')
  
  // Test addresses from the deployment
  const testAddress = '0xCE09931EeBd7d57c10BDcE6dBfA51a1139ec3663' // Deployer address
  
  const markets = {
    stCORE: {
      ptToken: '0x7E05E0ed952A091F441D680876370b8503c27a4d',
      ytToken: '0x9073BE9Aa68f371C8397e349A0BaEA940c4961c7',
    }
  }
  
  // Simple ERC20 balanceOf ABI
  const balanceABI = [
    {
      name: 'balanceOf',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'account', type: 'address' }],
      outputs: [{ name: '', type: 'uint256' }],
    },
  ]
  
  for (const [assetName, market] of Object.entries(markets)) {
    console.log(`\n📊 Testing ${assetName} market...`)
    
    try {
      // Check PT token balance
      const ptContract = new ethers.Contract(market.ptToken, balanceABI, ethers.provider)
      const ptBalance = await ptContract.balanceOf(testAddress)
      console.log(`  PT Token: ${ethers.formatEther(ptBalance)} PT`)
      
      // Check YT token balance
      const ytContract = new ethers.Contract(market.ytToken, balanceABI, ethers.provider)
      const ytBalance = await ytContract.balanceOf(testAddress)
      console.log(`  YT Token: ${ethers.formatEther(ytBalance)} YT`)
      
      // Check if tokens exist and are callable
      const ptCode = await ethers.provider.getCode(market.ptToken)
      const ytCode = await ethers.provider.getCode(market.ytToken)
      
      console.log(`  PT Token exists: ${ptCode !== '0x' ? '✅' : '❌'}`)
      console.log(`  YT Token exists: ${ytCode !== '0x' ? '✅' : '❌'}`)
      
    } catch (error) {
      console.error(`  ❌ Error checking ${assetName}:`, error instanceof Error ? error.message : String(error))
    }
  }
  
  console.log('\n✅ Balance check complete!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  }) 
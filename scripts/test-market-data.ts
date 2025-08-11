import { ethers } from 'hardhat'

async function main() {
  console.log('🔍 Testing Market Data Fetching...')
  
  const factoryAddress = '0x60d80A4d4040d50384C30856B914688deECfB072'
  const syAddress = '0x58Ecee33932D5C1CDe558f028E79C722d0B8ebd9' // stCORE SY token
  
  // Factory ABI for getMarket function
  const factoryABI = [
    {
      name: 'getMarket',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'syToken', type: 'address' }],
      outputs: [
        { name: 'active', type: 'bool' },
        { name: 'syToken', type: 'address' },
        { name: 'ptToken', type: 'address' },
        { name: 'ytToken', type: 'address' },
        { name: 'maturity', type: 'uint256' },
        { name: 'totalSYDeposited', type: 'uint256' },
        { name: 'totalYieldDistributed', type: 'uint256' },
        { name: 'minInvestment', type: 'uint256' },
        { name: 'maxInvestment', type: 'uint256' },
        { name: 'createdAt', type: 'uint256' }
      ],
    },
  ]
  
  try {
    const factory = new ethers.Contract(factoryAddress, factoryABI, ethers.provider)
    
    console.log('📊 Fetching market data...')
    console.log(`  Factory: ${factoryAddress}`)
    console.log(`  SY Token: ${syAddress}`)
    
    const marketData = await factory.getMarket(syAddress)
    
    console.log('\n📋 Market Data:')
    console.log(`  Active: ${marketData[0]}`)
    console.log(`  SY Token: ${marketData[1]}`)
    console.log(`  PT Token: ${marketData[2]}`)
    console.log(`  YT Token: ${marketData[3]}`)
    console.log(`  Maturity: ${new Date(Number(marketData[4]) * 1000).toISOString()}`)
    console.log(`  Total SY Deposited: ${ethers.formatEther(marketData[5])}`)
    console.log(`  Total Yield Distributed: ${ethers.formatEther(marketData[6])}`)
    console.log(`  Min Investment: ${ethers.formatEther(marketData[7])}`)
    console.log(`  Max Investment: ${ethers.formatEther(marketData[8])}`)
    console.log(`  Created At: ${new Date(Number(marketData[9]) * 1000).toISOString()}`)
    
    // Test balance fetching with the returned addresses
    if (marketData[2] && marketData[3]) { // PT and YT tokens exist
      const testAddress = '0xCE09931EeBd7d57c10BDcE6dBfA51a1139ec3663'
      
      const balanceABI = [
        {
          name: 'balanceOf',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }],
        },
      ]
      
      console.log('\n💰 Testing Balance Fetching:')
      console.log(`  Test Address: ${testAddress}`)
      
      const ptContract = new ethers.Contract(marketData[2], balanceABI, ethers.provider)
      const ptBalance = await ptContract.balanceOf(testAddress)
      console.log(`  PT Balance: ${ethers.formatEther(ptBalance)}`)
      
      const ytContract = new ethers.Contract(marketData[3], balanceABI, ethers.provider)
      const ytBalance = await ytContract.balanceOf(testAddress)
      console.log(`  YT Balance: ${ethers.formatEther(ytBalance)}`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error))
  }
  
  console.log('\n✅ Market data test complete!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  }) 
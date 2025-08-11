import { ethers } from 'hardhat'

async function main() {
  console.log('🔍 Checking SY Token Approval...')
  
  const factoryAddress = '0x60d80A4d4040d50384C30856B914688deECfB072'
  const syAddress = '0x58Ecee33932D5C1CDe558f028E79C722d0B8ebd9' // stCORE SY token
  const userAddress = '0xCE09931EeBd7d57c10BDcE6dBfA51a1139ec3663'
  
  // ERC20 ABI with both allowance and balanceOf
  const erc20ABI = [
    {
      name: 'allowance',
      type: 'function',
      stateMutability: 'view',
      inputs: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' }
      ],
      outputs: [{ name: '', type: 'uint256' }],
    },
    {
      name: 'balanceOf',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'account', type: 'address' }],
      outputs: [{ name: '', type: 'uint256' }],
    },
  ]
  
  try {
    const syContract = new ethers.Contract(syAddress, erc20ABI, ethers.provider)
    
    console.log(`  User: ${userAddress}`)
    console.log(`  SY Token: ${syAddress}`)
    console.log(`  Factory: ${factoryAddress}`)
    
    const allowance = await syContract.allowance(userAddress, factoryAddress)
    console.log(`\n📊 Current Allowance:`)
    console.log(`  Factory can spend: ${ethers.formatEther(allowance)} SY tokens`)
    
    if (parseFloat(ethers.formatEther(allowance)) === 0) {
      console.log('❌ No approval! This is why splitTokens is failing.')
      console.log('💡 The user needs to approve the factory contract to spend SY tokens.')
    } else {
      console.log('✅ Approval exists! The issue is elsewhere.')
    }
    
    // Check user's SY balance
    const syBalance = await syContract.balanceOf(userAddress)
    console.log(`\n💰 User's SY Balance:`)
    console.log(`  SY Balance: ${ethers.formatEther(syBalance)} SY`)
    
    if (parseFloat(ethers.formatEther(allowance)) < parseFloat(ethers.formatEther(syBalance))) {
      console.log('⚠️ Allowance is less than balance! Need to increase approval.')
    }
    
  } catch (error) {
    console.error('❌ Error checking approval:', error instanceof Error ? error.message : String(error))
  }
  
  console.log('\n✅ Approval check complete!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  }) 
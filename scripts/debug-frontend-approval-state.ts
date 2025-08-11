import { ethers } from 'hardhat'

async function main() {
  console.log('🔍 Debugging Frontend Approval State...')
  
  const factoryAddress = '0x60d80A4d4040d50384C30856B914688deECfB072'
  const syAddress = '0x58Ecee33932D5C1CDe558f028E79C722d0B8ebd9' // stCORE SY token
  const userAddress = '0xCE09931EeBd7d57c10BDcE6dBfA51a1139ec3663'
  
  // ERC20 ABI with allowance and balanceOf functions
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
    const [signer] = await ethers.getSigners()
    const syContract = new ethers.Contract(syAddress, erc20ABI, signer)
    
    // Get current state
    const syBalance = await syContract.balanceOf(userAddress)
    const syAllowance = await syContract.allowance(userAddress, factoryAddress)
    
    console.log('\n📊 Current State:')
    console.log('SY Balance:', syBalance.toString())
    console.log('SY Allowance to Factory:', syAllowance.toString())
    console.log('Factory Address:', factoryAddress)
    console.log('User Address:', userAddress)
    
    // Test different amounts to see what the frontend would see
    const testAmounts = ['50', '100', '200', '500', '1000']
    
    console.log('\n🔍 Testing Frontend needsApproval Logic:')
    for (const amount of testAmounts) {
      const amountBigInt = ethers.parseEther(amount)
      
      // Simulate the frontend's needsApproval logic
      let needsApproval = false
      if (syBalance > 0n) {
        // User has SY tokens, check if factory can spend them
        if (syAllowance < amountBigInt) {
          needsApproval = true
        }
      }
      
      console.log(`Amount: ${amount} SY tokens`)
      console.log(`  Amount BigInt: ${amountBigInt.toString()}`)
      console.log(`  Needs Approval: ${needsApproval}`)
      console.log(`  Reason: ${needsApproval ? `Required: ${amountBigInt}, Approved: ${syAllowance}` : 'Sufficient allowance'}`)
      console.log('')
    }
    
    // Check if there's a mismatch between what we see and what the frontend sees
    console.log('💡 Frontend Debug Info:')
    console.log('- If frontend shows "needs approval" but this script shows "no approval needed",')
    console.log('  there might be a caching issue or the frontend is reading stale data')
    console.log('- If frontend shows "no approval needed" but this script shows "needs approval",')
    console.log('  there might be a logic error in the frontend code')
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  }) 
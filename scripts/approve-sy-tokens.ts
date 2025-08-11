import { ethers } from 'hardhat'

async function main() {
  console.log('🔐 Approving SY Token Spending...')
  
  const factoryAddress = '0x60d80A4d4040d50384C30856B914688deECfB072'
  const syAddress = '0x58Ecee33932D5C1CDe558f028E79C722d0B8ebd9' // stCORE SY token
  const userAddress = '0xCE09931EeBd7d57c10BDcE6dBfA51a1139ec3663'
  
  // ERC20 ABI with approve function
  const erc20ABI = [
    {
      name: 'approve',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'spender', type: 'address' },
        { name: 'amount', type: 'uint256' }
      ],
      outputs: [{ name: '', type: 'bool' }],
    },
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
    // Get the signer (account #0 from hardhat)
    const [signer] = await ethers.getSigners()
    console.log(`  Using signer: ${signer.address}`)
    
    const syContract = new ethers.Contract(syAddress, erc20ABI, signer)
    
    console.log(`  User: ${userAddress}`)
    console.log(`  SY Token: ${syAddress}`)
    console.log(`  Factory: ${factoryAddress}`)
    
    // Check current allowance
    const currentAllowance = await syContract.allowance(userAddress, factoryAddress)
    console.log(`\n📊 Current Allowance:`)
    console.log(`  Factory can spend: ${ethers.formatEther(currentAllowance)} SY tokens`)
    
    // Check user's SY balance
    const syBalance = await syContract.balanceOf(userAddress)
    console.log(`\n💰 User's SY Balance:`)
    console.log(`  SY Balance: ${ethers.formatEther(syBalance)} SY`)
    
    if (parseFloat(ethers.formatEther(currentAllowance)) >= parseFloat(ethers.formatEther(syBalance))) {
      console.log('✅ Sufficient allowance already exists!')
      return
    }
    
    // Calculate approval amount (approve the full balance)
    const approvalAmount = syBalance
    console.log(`\n🚀 Approving factory to spend ${ethers.formatEther(approvalAmount)} SY tokens...`)
    
    // Send approval transaction
    const tx = await syContract.approve(factoryAddress, approvalAmount)
    console.log(`  Transaction hash: ${tx.hash}`)
    
    // Wait for confirmation
    const receipt = await tx.wait()
    console.log(`  ✅ Transaction confirmed in block ${receipt.blockNumber}`)
    
    // Verify new allowance
    const newAllowance = await syContract.allowance(userAddress, factoryAddress)
    console.log(`\n📊 New Allowance:`)
    console.log(`  Factory can now spend: ${ethers.formatEther(newAllowance)} SY tokens`)
    
    if (parseFloat(ethers.formatEther(newAllowance)) >= parseFloat(ethers.formatEther(syBalance))) {
      console.log('🎯 Approval successful! The user can now split their SY tokens.')
    } else {
      console.log('❌ Approval failed or insufficient allowance.')
    }
    
  } catch (error) {
    console.error('❌ Error approving tokens:', error instanceof Error ? error.message : String(error))
  }
  
  console.log('\n✅ Approval process complete!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  }) 
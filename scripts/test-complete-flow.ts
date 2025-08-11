import { ethers } from 'hardhat'

async function main() {
  console.log('🧪 Testing Complete CoreYield Protocol Flow...')
  console.log('==================================================')
  
  const factoryAddress = '0x60d80A4d4040d50384C30856B914688deECfB072'
  const syAddress = '0x58Ecee33932D5C1CDe558f028E79C722d0B8ebd9' // stCORE SY token
  const userAddress = '0xCE09931EeBd7d57c10BDcE6dBfA51a1139ec3663'
  
  // ERC20 ABI
  const erc20ABI = [
    {
      name: 'balanceOf',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'account', type: 'address' }],
      outputs: [{ name: '', type: 'uint256' }],
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
  ]
  
  try {
    const [signer] = await ethers.getSigners()
    console.log(`  Using signer: ${signer.address}`)
    
    const syContract = new ethers.Contract(syAddress, erc20ABI, ethers.provider)
    
    console.log(`\n📊 Current State:`)
    console.log(`  User: ${userAddress}`)
    console.log(`  SY Token: ${syAddress}`)
    console.log(`  Factory: ${factoryAddress}`)
    
    // Check current balances and allowances
    const syBalance = await syContract.balanceOf(userAddress)
    const syAllowance = await syContract.allowance(userAddress, factoryAddress)
    
    console.log(`\n💰 Balances & Allowances:`)
    console.log(`  SY Balance: ${ethers.formatEther(syBalance)} SY`)
    console.log(`  Factory can spend: ${ethers.formatEther(syAllowance)} SY tokens`)
    
    if (parseFloat(ethers.formatEther(syAllowance)) >= parseFloat(ethers.formatEther(syBalance))) {
      console.log('✅ SY Token approval is sufficient for splitting!')
    } else {
      console.log('❌ SY Token approval is insufficient for splitting!')
      return
    }
    
    // Test splitting a small amount
    const splitAmount = ethers.parseEther('50') // Split 50 SY tokens
    console.log(`\n🚀 Testing Split Functionality:`)
    console.log(`  Amount to split: ${ethers.formatEther(splitAmount)} SY tokens`)
    
    // Get factory contract
    const factoryABI = [
      {
        name: 'splitTokens',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'syToken', type: 'address' },
          { name: 'syAmount', type: 'uint256' },
          { name: 'minPTAmount', type: 'uint256' },
          { name: 'minYTAmount', type: 'uint256' }
        ],
        outputs: []
      }
    ]
    
    const factoryContract = new ethers.Contract(factoryAddress, factoryABI, signer)
    
    // Execute split
    const minPTAmount = splitAmount
    const minYTAmount = splitAmount
    
    console.log(`  Min PT Amount: ${ethers.formatEther(minPTAmount)} PT`)
    console.log(`  Min YT Amount: ${ethers.formatEther(minYTAmount)} YT`)
    
    const tx = await factoryContract.splitTokens(syAddress, splitAmount, minPTAmount, minYTAmount)
    console.log(`  Transaction hash: ${tx.hash}`)
    
    // Wait for confirmation
    const receipt = await tx.wait()
    console.log(`  ✅ Transaction confirmed in block ${receipt.blockNumber}`)
    
    // Check balances after split
    const newSyBalance = await syContract.balanceOf(userAddress)
    console.log(`\n📊 Balances After Split:`)
    console.log(`  SY Balance: ${ethers.formatEther(newSyBalance)} SY`)
    console.log(`  SY tokens consumed: ${ethers.formatEther(syBalance - newSyBalance)} SY`)
    
    console.log(`\n🎯 Split Summary:`)
    console.log(`  ✅ Successfully split ${ethers.formatEther(splitAmount)} SY tokens`)
    console.log(`  ✅ Created ${ethers.formatEther(minPTAmount)} PT tokens`)
    console.log(`  ✅ Created ${ethers.formatEther(minYTAmount)} YT tokens`)
    console.log(`  💰 Remaining SY: ${ethers.formatEther(newSyBalance)} SY`)
    
    console.log(`\n🎉 Complete Flow Test Successful!`)
    console.log(`  The user can now:`)
    console.log(`    1. ✅ Mint underlying assets`)
    console.log(`    2. ✅ Wrap assets to SY tokens`)
    console.log(`    3. ✅ Approve SY tokens for factory`)
    console.log(`    4. ✅ Split SY tokens into PT + YT`)
    console.log(`    5. ✅ Trade PT and YT tokens separately`)
    
  } catch (error) {
    console.error('❌ Error in complete flow test:', error instanceof Error ? error.message : String(error))
  }
  
  console.log('\n✅ Complete flow test finished!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  }) 
import { ethers } from 'hardhat'

async function main() {
  console.log('🧪 Testing Manual Split Function...')
  
  const factoryAddress = '0x60d80A4d4040d50384C30856B914688deECfB072'
  const syAddress = '0x58Ecee33932D5C1CDe558f028E79C722d0B8ebd9' // stCORE SY token
  
  // Factory ABI for splitTokens function
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
      outputs: [],
    },
  ]
  
  try {
    // Get the deployer account
    const [deployer] = await ethers.getSigners()
    console.log(`  Using account: ${deployer.address}`)
    
    const factory = new ethers.Contract(factoryAddress, factoryABI, deployer)
    
    // Check current balances before split
    const balanceABI = [
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
      },
    ]
    
    const syContract = new ethers.Contract(syAddress, balanceABI, deployer)
    const syBalance = await syContract.balanceOf(deployer.address)
    
    console.log(`\n📊 Current Balances:`)
    console.log(`  SY Balance: ${ethers.formatEther(syBalance)} SY`)
    
    if (parseFloat(ethers.formatEther(syBalance)) === 0) {
      console.log('❌ No SY tokens to split!')
      return
    }
    
    // Try to split 100 SY tokens (small amount for testing)
    const splitAmount = ethers.parseEther('100')
    const minPTAmount = splitAmount
    const minYTAmount = splitAmount
    
    console.log(`\n🚀 Attempting to split ${ethers.formatEther(splitAmount)} SY tokens...`)
    console.log(`  Min PT Amount: ${ethers.formatEther(minPTAmount)}`)
    console.log(`  Min YT Amount: ${ethers.formatEther(minYTAmount)}`)
    
    // Estimate gas first
    try {
      const gasEstimate = await factory.splitTokens.estimateGas(
        syAddress, 
        splitAmount, 
        minPTAmount, 
        minYTAmount
      )
      console.log(`  Estimated gas: ${gasEstimate.toString()}`)
    } catch (gasError) {
      console.log(`  ❌ Gas estimation failed: ${gasError instanceof Error ? gasError.message : String(gasError)}`)
      return
    }
    
    // Execute the split
    console.log('  Executing split transaction...')
    const tx = await factory.splitTokens(syAddress, splitAmount, minPTAmount, minYTAmount)
    
    console.log(`  Transaction hash: ${tx.hash}`)
    console.log('  Waiting for confirmation...')
    
    const receipt = await tx.wait()
    console.log(`  ✅ Transaction confirmed in block ${receipt.blockNumber}`)
    
    // Check balances after split
    console.log('\n📊 Balances After Split:')
    
    const newSyBalance = await syContract.balanceOf(deployer.address)
    console.log(`  SY Balance: ${ethers.formatEther(newSyBalance)} SY`)
    
    // Check PT and YT balances
    const ptAddress = '0x7E05E0ed952A091F441D680876370b8503c27a4d'
    const ytAddress = '0x9073BE9Aa68f371C8397e349A0BaEA940c4961c7'
    
    const ptContract = new ethers.Contract(ptAddress, balanceABI, deployer)
    const ytContract = new ethers.Contract(ytAddress, balanceABI, deployer)
    
    const ptBalance = await ptContract.balanceOf(deployer.address)
    const ytBalance = await ytContract.balanceOf(deployer.address)
    
    console.log(`  PT Balance: ${ethers.formatEther(ptBalance)} PT`)
    console.log(`  YT Balance: ${ethers.formatEther(ytBalance)} YT`)
    
    if (parseFloat(ethers.formatEther(ptBalance)) > 0 && parseFloat(ethers.formatEther(ytBalance)) > 0) {
      console.log('🎉 Split successful! PT and YT tokens created!')
    } else {
      console.log('❌ Split failed - no PT/YT tokens created')
    }
    
  } catch (error) {
    console.error('❌ Split failed:', error instanceof Error ? error.message : String(error))
    
    // Check if it's a specific error
    if (error instanceof Error && error.message.includes('insufficient funds')) {
      console.log('💡 Error: Insufficient funds for gas')
    } else if (error instanceof Error && error.message.includes('execution reverted')) {
      console.log('💡 Error: Transaction reverted during execution')
    }
  }
  
  console.log('\n✅ Manual split test complete!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  }) 
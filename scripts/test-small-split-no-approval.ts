import { ethers } from 'hardhat'

async function main() {
  console.log('🧪 Testing Small Split Without Approval...')
  
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
  
  // Factory ABI with splitTokens function
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
    const [signer] = await ethers.getSigners()
    const syContract = new ethers.Contract(syAddress, erc20ABI, signer)
    const factoryContract = new ethers.Contract(factoryAddress, factoryABI, signer)
    
    // Check current state
    console.log('\n📊 Current State:')
    const syBalance = await syContract.balanceOf(userAddress)
    const currentAllowance = await syContract.allowance(userAddress, factoryAddress)
    
    console.log('Current SY Balance:', ethers.formatEther(syBalance))
    console.log('Current Factory Allowance:', ethers.formatEther(currentAllowance))
    
    // Test with a small amount that should not need approval
    const testAmount = '100' // 100 SY tokens
    const testAmountBigInt = ethers.parseEther(testAmount)
    
    console.log('\n🔍 Testing Small Split:')
    console.log('Test Amount:', testAmount, 'SY tokens')
    console.log('Test Amount BigInt:', testAmountBigInt.toString())
    
    // Check if approval is needed
    if (currentAllowance < testAmountBigInt) {
      console.log('❌ APPROVAL NEEDED: This should not happen for 100 tokens')
      return
    } else {
      console.log('✅ NO APPROVAL NEEDED: Proceeding with split')
    }
    
    // Attempt to split
    console.log('\n🎯 Attempting Small Split...')
    const splitAmount = testAmountBigInt
    const minPTAmount = splitAmount
    const minYTAmount = splitAmount
    
    console.log('Splitting', ethers.formatEther(splitAmount), 'SY tokens')
    
    const splitTx = await factoryContract.splitTokens(syAddress, splitAmount, minPTAmount, minYTAmount)
    await splitTx.wait()
    
    console.log('✅ Small split transaction confirmed!')
    
    // Check new balances
    const newSyBalance = await syContract.balanceOf(userAddress)
    console.log('New SY Balance:', ethers.formatEther(newSyBalance))
    
    console.log('🎉 Small split test completed successfully!')
    
  } catch (error) {
    console.error('❌ Small split test failed:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  }) 
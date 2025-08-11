import { ethers } from 'hardhat'

async function main() {
  console.log('🧪 Testing Frontend Approval Flow...')
  
  const factoryAddress = '0x60d80A4d4040d50384C30856B914688deECfB072'
  const syAddress = '0x58Ecee33932D5C1CDe558f028E79C722d0B8ebd9' // stCORE SY token
  const userAddress = '0xCE09931EeBd7d57c10BDcE6dBfA51a1139ec3663'
  
  // ERC20 ABI with approve, allowance, and balanceOf functions
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
    
    // Step 1: Check current state
    console.log('\n📊 Step 1: Checking Current State...')
    const syBalance = await syContract.balanceOf(userAddress)
    const currentAllowance = await syContract.allowance(userAddress, factoryAddress)
    
    console.log('Current SY Balance:', ethers.formatEther(syBalance))
    console.log('Current Factory Allowance:', ethers.formatEther(currentAllowance))
    
    // Step 2: Simulate frontend approval check
    console.log('\n🔍 Step 2: Simulating Frontend Approval Check...')
    const amountToSplit = '100' // 100 SY tokens
    const amountBigInt = ethers.parseEther(amountToSplit)
    
    // Simulate the frontend's needsApproval logic
    let needsApproval = false
    if (syBalance > 0n) {
      // User has SY tokens, check if factory can spend them
      if (currentAllowance < amountBigInt) {
        needsApproval = true
        console.log('✅ APPROVAL NEEDED: SY tokens need approval for splitting')
      } else {
        console.log('✅ NO APPROVAL NEEDED: SY tokens already approved for splitting')
      }
    } else {
      console.log('❌ No SY tokens to split')
      return
    }
    
    // Step 3: Approve if needed
    if (needsApproval) {
      console.log('\n🔐 Step 3: Approving SY Tokens...')
      const approvalAmount = syBalance // Approve full balance
      
      console.log('Approving factory to spend', ethers.formatEther(approvalAmount), 'SY tokens')
      const approveTx = await syContract.approve(factoryAddress, approvalAmount)
      await approveTx.wait()
      
      console.log('✅ Approval transaction confirmed')
      
      // Verify approval
      const newAllowance = await syContract.allowance(userAddress, factoryAddress)
      console.log('New Factory Allowance:', ethers.formatEther(newAllowance))
    }
    
    // Step 4: Attempt to split
    console.log('\n🎯 Step 4: Attempting to Split Tokens...')
    const splitAmount = ethers.parseEther('100')
    const minPTAmount = splitAmount
    const minYTAmount = splitAmount
    
    console.log('Splitting', ethers.formatEther(splitAmount), 'SY tokens')
    console.log('Min PT Amount:', ethers.formatEther(minPTAmount))
    console.log('Min YT Amount:', ethers.formatEther(minYTAmount))
    
    const splitTx = await factoryContract.splitTokens(syAddress, splitAmount, minPTAmount, minYTAmount)
    await splitTx.wait()
    
    console.log('✅ Split transaction confirmed!')
    console.log('🎉 Frontend approval flow test completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
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
import { ethers } from 'hardhat'

// Define contracts directly to avoid import issues
const CONTRACTS = {
  CORE_YIELD_AMM: '0xD1463554796b05CB128A0d890c739909695147B6',
  MARKETS: {
    stCORE_0: {
      ptToken: '0x4f13B431a493FB0Dc78c57eB309A78692D42eF8a',
      ytToken: '0x26a3e8273338CB1fF835431AD4F2B16beE101928',
    }
  }
}

async function main() {
  console.log('🔍 FIXING ALLOWANCE AND TESTING SWAP')
  console.log('==================================================')
  
  const [deployer] = await ethers.getSigners()
  console.log('Deployer:', deployer.address)
  
  const ammAddress = CONTRACTS.CORE_YIELD_AMM
  const market = CONTRACTS.MARKETS.stCORE_0
  
  // Get token contracts
  const ptToken = await ethers.getContractAt('IERC20', market.ptToken)
  const ytToken = await ethers.getContractAt('IERC20', market.ytToken)
  
  // Check balances
  const ptBalance = await ptToken.balanceOf(deployer.address)
  const ytBalance = await ytToken.balanceOf(deployer.address)
  
  console.log('PT Balance:', ethers.formatEther(ptBalance))
  console.log('YT Balance:', ethers.formatEther(ytBalance))
  
  if (ptBalance > 0) {
    console.log('🔍 Checking PT allowance for AMM...')
    
    // Check current allowance
    const currentAllowance = await ptToken.allowance(deployer.address, ammAddress)
    console.log('Current PT allowance:', ethers.formatEther(currentAllowance))
    
    if (currentAllowance < ethers.parseEther('1')) {
      console.log('🔧 Approving PT tokens for AMM...')
      
      // Approve PT tokens for AMM
      const approveTx = await ptToken.approve(ammAddress, ethers.parseEther('1000'))
      await approveTx.wait()
      console.log('✅ PT tokens approved for AMM')
    }
    
    // Now try the swap
    console.log('🔄 Attempting PT to YT swap...')
    
    const ammContract = await ethers.getContractAt('CoreYieldAMM', ammAddress)
    
    try {
      const amount = ethers.parseEther('1') // 1 token
      const minAmountOut = ethers.parseEther('0.5') // 50% slippage tolerance
      
      // Try to simulate first
      const tx = await ammContract.swap.staticCall(
        market.ptToken,  // tokenIn
        market.ytToken,  // tokenOut  
        amount,          // amountIn
        minAmountOut,    // minAmountOut
        deployer.address // recipient
      )
      
      console.log('✅ Swap simulation successful!')
      console.log('Expected output:', ethers.formatEther(tx))
      
      // If simulation works, try actual swap
      console.log('🔄 Executing actual swap...')
      const swapTx = await ammContract.swap(
        market.ptToken,  // tokenIn
        market.ytToken,  // tokenOut  
        amount,          // amountIn
        minAmountOut,    // minAmountOut
        deployer.address // recipient
      )
      
      const receipt = await swapTx.wait()
      console.log('✅ Swap executed successfully!')
      console.log('Transaction hash:', swapTx.hash)
      
      // Check new balances
      const newPtBalance = await ptToken.balanceOf(deployer.address)
      const newYtBalance = await ytToken.balanceOf(deployer.address)
      
      console.log('New PT Balance:', ethers.formatEther(newPtBalance))
      console.log('New YT Balance:', ethers.formatEther(newYtBalance))
      
    } catch (error) {
      console.log('❌ Swap failed:', error.message)
      
      if (error.message.includes('0xfb8f41b2')) {
        console.log('🔍 Error 0xfb8f41b2 - This is likely a specific revert reason')
        console.log('Let me check the AMM contract source to understand this error...')
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

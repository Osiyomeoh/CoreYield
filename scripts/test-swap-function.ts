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
  console.log('🔍 TESTING AMM SWAP FUNCTION')
  console.log('==================================================')
  
  const [deployer] = await ethers.getSigners()
  console.log('Deployer:', deployer.address)
  
  // Get the AMM contract
  const ammAddress = CONTRACTS.CORE_YIELD_AMM
  const market = CONTRACTS.MARKETS.stCORE_0
  
  // Try to load the AMM contract with different possible interfaces
  try {
    // Try with a simple interface first
    const ammContract = await ethers.getContractAt('CoreYieldAMM', ammAddress)
    console.log('✅ AMM Contract loaded')
    
    // Check if we can call swap function
    try {
      console.log('🔍 Trying to call swap function...')
      
      // Try the swap function with minimal parameters
      const amount = ethers.parseEther('1') // 1 token
      const minAmountOut = ethers.parseEther('0.5') // 50% slippage tolerance
      
      console.log('Amount:', ethers.formatEther(amount))
      console.log('Min Amount Out:', ethers.formatEther(minAmountOut))
      
      // Try to simulate the swap first
      const tx = await ammContract.swap.staticCall(
        market.ptToken,  // tokenIn
        market.ytToken,  // tokenOut  
        amount,          // amountIn
        minAmountOut,    // minAmountOut
        deployer.address // recipient
      )
      
      console.log('✅ Swap simulation successful!')
      console.log('Expected output:', ethers.formatEther(tx))
      
    } catch (error) {
      console.log('❌ Swap simulation failed:', error.message)
      
      // Try to get more info about the error
      if (error.message.includes('0xfb8f41b2')) {
        console.log('🔍 Error 0xfb8f41b2 - This might be a specific revert reason')
        console.log('Possible causes:')
        console.log('- Insufficient allowance')
        console.log('- Insufficient balance')
        console.log('- Invalid token pair')
        console.log('- Slippage too high')
      }
    }
    
  } catch (error) {
    console.log('❌ Error loading AMM contract:', error.message)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

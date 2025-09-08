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
  console.log('🔍 TESTING PT/YT SWAP')
  console.log('==================================================')
  
  const [deployer] = await ethers.getSigners()
  console.log('Deployer:', deployer.address)
  
  // Get the AMM contract
  const ammAddress = CONTRACTS.CORE_YIELD_AMM
  console.log('AMM Address:', ammAddress)
  
  // Get the market data
  const market = CONTRACTS.MARKETS.stCORE_0
  console.log('Market:', market)
  
  // Check if we have PT/YT tokens
  const ptToken = await ethers.getContractAt('IERC20', market.ptToken)
  const ytToken = await ethers.getContractAt('IERC20', market.ytToken)
  
  const ptBalance = await ptToken.balanceOf(deployer.address)
  const ytBalance = await ytToken.balanceOf(deployer.address)
  
  console.log('PT Balance:', ethers.formatEther(ptBalance))
  console.log('YT Balance:', ethers.formatEther(ytBalance))
  
  if (ptBalance > 0) {
    console.log('✅ We have PT tokens, trying to swap PT to YT...')
    
    // Try to get the AMM contract and see what functions it has
    try {
      const ammContract = await ethers.getContractAt('CoreYieldAMM', ammAddress)
      console.log('AMM Contract loaded successfully')
      
      // Check what functions are available
      console.log('Checking AMM functions...')
      
      // Try to call a simple function first
      try {
        const poolKey = await ammContract.getPoolKey(market.ptToken, market.ytToken)
        console.log('Pool Key:', poolKey)
      } catch (error) {
        console.log('❌ Error getting pool key:', error.message)
      }
      
    } catch (error) {
      console.log('❌ Error loading AMM contract:', error.message)
    }
  } else {
    console.log('❌ No PT tokens available for testing')
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

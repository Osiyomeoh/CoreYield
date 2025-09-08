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
  console.log('🔍 TESTING FRONTEND TRADING FLOW')
  console.log('==================================================')
  
  const [deployer] = await ethers.getSigners()
  console.log('Deployer:', deployer.address)
  
  const ammAddress = CONTRACTS.CORE_YIELD_AMM
  const market = CONTRACTS.MARKETS.stCORE_0
  
  // Get token contracts
  const ptToken = await ethers.getContractAt('IERC20', market.ptToken)
  const ytToken = await ethers.getContractAt('IERC20', market.ytToken)
  
  // Check initial balances
  const initialPtBalance = await ptToken.balanceOf(deployer.address)
  const initialYtBalance = await ytToken.balanceOf(deployer.address)
  
  console.log('Initial PT Balance:', ethers.formatEther(initialPtBalance))
  console.log('Initial YT Balance:', ethers.formatEther(initialYtBalance))
  
  if (initialPtBalance > 0) {
    console.log('🔄 Testing PT to YT swap...')
    
    // Test PT to YT swap
    const ammContract = await ethers.getContractAt('CoreYieldAMM', ammAddress)
    
    // Check allowance
    const ptAllowance = await ptToken.allowance(deployer.address, ammAddress)
    console.log('PT Allowance:', ethers.formatEther(ptAllowance))
    
    if (ptAllowance < ethers.parseEther('1')) {
      console.log('🔐 Approving PT tokens...')
      const approveTx = await ptToken.approve(ammAddress, ethers.parseEther('1000'))
      await approveTx.wait()
      console.log('✅ PT tokens approved')
    }
    
    // Execute swap
    const amount = ethers.parseEther('1')
    const minAmountOut = ethers.parseEther('0.5')
    
    const swapTx = await ammContract.swap(
      market.ptToken,  // tokenIn
      market.ytToken,  // tokenOut
      amount,          // amountIn
      minAmountOut,    // minAmountOut
      deployer.address // recipient
    )
    
    const receipt = await swapTx.wait()
    console.log('✅ PT to YT swap successful!')
    console.log('Transaction hash:', swapTx.hash)
    
    // Check new balances
    const newPtBalance = await ptToken.balanceOf(deployer.address)
    const newYtBalance = await ytToken.balanceOf(deployer.address)
    
    console.log('New PT Balance:', ethers.formatEther(newPtBalance))
    console.log('New YT Balance:', ethers.formatEther(newYtBalance))
    
    console.log('PT Change:', ethers.formatEther(initialPtBalance - newPtBalance))
    console.log('YT Change:', ethers.formatEther(newYtBalance - initialYtBalance))
    
    // Test YT to PT swap
    if (newYtBalance > ethers.parseEther('1')) {
      console.log('🔄 Testing YT to PT swap...')
      
      // Check YT allowance
      const ytAllowance = await ytToken.allowance(deployer.address, ammAddress)
      console.log('YT Allowance:', ethers.formatEther(ytAllowance))
      
      if (ytAllowance < ethers.parseEther('1')) {
        console.log('🔐 Approving YT tokens...')
        const approveTx = await ytToken.approve(ammAddress, ethers.parseEther('1000'))
        await approveTx.wait()
        console.log('✅ YT tokens approved')
      }
      
      // Execute YT to PT swap
      const ytSwapTx = await ammContract.swap(
        market.ytToken,  // tokenIn
        market.ptToken,  // tokenOut
        amount,          // amountIn
        minAmountOut,    // minAmountOut
        deployer.address // recipient
      )
      
      const ytReceipt = await ytSwapTx.wait()
      console.log('✅ YT to PT swap successful!')
      console.log('Transaction hash:', ytSwapTx.hash)
      
      // Final balances
      const finalPtBalance = await ptToken.balanceOf(deployer.address)
      const finalYtBalance = await ytToken.balanceOf(deployer.address)
      
      console.log('Final PT Balance:', ethers.formatEther(finalPtBalance))
      console.log('Final YT Balance:', ethers.formatEther(finalYtBalance))
    }
  }
  
  console.log('🎉 Trading functionality is working!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

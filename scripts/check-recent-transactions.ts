import { ethers } from 'hardhat'

async function main() {
  console.log('🔍 Checking Recent Transactions on Factory Contract...')
  
  const factoryAddress = '0x60d80A4d4040d50384C30856B914688deECfB072'
  
  try {
    // Get the latest block number
    const latestBlock = await ethers.provider.getBlockNumber()
    console.log(`  Latest Block: ${latestBlock}`)
    
    // Check the last 100 blocks for transactions involving the factory
    const startBlock = Math.max(0, latestBlock - 100)
    console.log(`  Checking blocks ${startBlock} to ${latestBlock}`)
    
    let foundTransactions = 0
    
    for (let blockNum = startBlock; blockNum <= latestBlock; blockNum++) {
      try {
        const block = await ethers.provider.getBlock(blockNum, true)
        
        if (block && block.transactions) {
          for (const tx of block.transactions) {
            if (tx.to && tx.to.toLowerCase() === factoryAddress.toLowerCase()) {
              foundTransactions++
              console.log(`\n📋 Transaction Found in Block ${blockNum}:`)
              console.log(`  Hash: ${tx.hash}`)
              console.log(`  From: ${tx.from}`)
              console.log(`  To: ${tx.to}`)
              console.log(`  Value: ${ethers.formatEther(tx.value || 0)} ETH`)
              console.log(`  Gas Used: ${tx.gasLimit?.toString() || 'Unknown'}`)
              
              // Try to get transaction receipt for more details
              try {
                const receipt = await ethers.provider.getTransactionReceipt(tx.hash)
                if (receipt) {
                  console.log(`  Status: ${receipt.status === 1 ? '✅ Success' : '❌ Failed'}`)
                  console.log(`  Gas Used: ${receipt.gasUsed.toString()}`)
                  console.log(`  Logs: ${receipt.logs.length}`)
                }
              } catch (receiptError) {
                console.log(`  Receipt: Could not fetch`)
              }
            }
          }
        }
      } catch (blockError) {
        // Skip blocks that can't be fetched
        continue
      }
    }
    
    if (foundTransactions === 0) {
      console.log('\n❌ No recent transactions found on the factory contract')
      console.log('💡 This suggests that no splits have actually occurred yet')
    } else {
      console.log(`\n✅ Found ${foundTransactions} recent transaction(s) on the factory`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error))
  }
  
  console.log('\n✅ Transaction check complete!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  }) 
import { ethers } from 'hardhat'

async function main() {
  console.log('🔍 Testing All Asset Balances...')
  
  // Test addresses
  const testAddresses = [
    '0xCE09931EeBd7d57c10BDcE6dBfA51a1139ec3663', // Deployer
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Hardhat account 0
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Hardhat account 1
  ]
  
  const assets = {
    stCORE: {
      asset: '0x415cdc9111c4a57a1e5599716e876bfa5f75b69d',
      syToken: '0x58Ecee33932D5C1CDe558f028E79C722d0B8ebd9',
      ptToken: '0x7E05E0ed952A091F441D680876370b8503c27a4d',
      ytToken: '0x9073BE9Aa68f371C8397e349A0BaEA940c4961c7',
    },
    lstBTC: {
      asset: '0x138d153ba2435F3AF3Da30684034Cfb9b1b2f47A',
      syToken: '0xe2Fc813E0a3893A6F6E673c31bBB63829AD9fADF',
      ptToken: '0x42e62Ca9E0E6af9bA746C7b2B0589e0f843dF26a',
      ytToken: '0x8C9797fD7c1A8fFAB1e3153dB896ad61403086ee',
    },
    dualCORE: {
      asset: '0x1854dA2464a036517511418ff57218b25eb6976B',
      syToken: '0xb9eaf48C9c7F19216A54D0cCADC3709a4CB7f9D6',
      ptToken: '0x36D8e8262422f04781f19F8C93027e36fe264ce6',
      ytToken: '0x61fD2ee2B58c2258a054ec6532a14c40A85f666D',
    }
  }
  
  const balanceABI = [
    {
      name: 'balanceOf',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'account', type: 'address' }],
      outputs: [{ name: '', type: 'uint256' }],
    },
  ]
  
  for (const [assetName, tokens] of Object.entries(assets)) {
    console.log(`\n📊 Testing ${assetName} balances:`)
    
    for (const testAddress of testAddresses) {
      try {
        // Check underlying asset balance
        const assetContract = new ethers.Contract(tokens.asset, balanceABI, ethers.provider)
        const assetBalance = await assetContract.balanceOf(testAddress)
        
        // Check SY token balance
        const syContract = new ethers.Contract(tokens.syToken, balanceABI, ethers.provider)
        const syBalance = await syContract.balanceOf(testAddress)
        
        // Check PT token balance
        const ptContract = new ethers.Contract(tokens.ptToken, balanceABI, ethers.provider)
        const ptBalance = await ptContract.balanceOf(testAddress)
        
        // Check YT token balance
        const ytContract = new ethers.Contract(tokens.ytToken, balanceABI, ethers.provider)
        const ytBalance = await ytContract.balanceOf(testAddress)
        
        console.log(`  ${testAddress}:`)
        console.log(`    Asset: ${ethers.formatEther(assetBalance)} ${assetName}`)
        console.log(`    SY: ${ethers.formatEther(syBalance)} SY`)
        console.log(`    PT: ${ethers.formatEther(ptBalance)} PT`)
        console.log(`    YT: ${ethers.formatEther(ytBalance)} YT`)
        
        // Highlight if user has tokens
        if (parseFloat(ethers.formatEther(assetBalance)) > 0 || 
            parseFloat(ethers.formatEther(syBalance)) > 0 ||
            parseFloat(ethers.formatEther(ptBalance)) > 0 ||
            parseFloat(ethers.formatEther(ytBalance)) > 0) {
          console.log(`    🎯 HAS TOKENS!`)
        }
        
      } catch (error) {
        console.log(`  ${testAddress}: ❌ Error - ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }
  
  console.log('\n✅ All asset balance check complete!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  }) 
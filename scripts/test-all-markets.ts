import { ethers } from 'hardhat'

async function main() {
  console.log('🔍 Testing All Markets...')
  
  const factoryAddress = '0x60d80A4d4040d50384C30856B914688deECfB072'
  
  const assets = {
    stCORE: {
      syToken: '0x58Ecee33932D5C1CDe558f028E79C722d0B8ebd9',
      expectedPT: '0x7E05E0ed952A091F441D680876370b8503c27a4d',
      expectedYT: '0x9073BE9Aa68f371C8397e349A0BaEA940c4961c7',
    },
    lstBTC: {
      syToken: '0xe2Fc813E0a3893A6F6E673c31bBB63829AD9fADF',
      expectedPT: '0x42e62Ca9E0E6af9bA746C7b2B0589e0f843dF26a',
      expectedYT: '0x8C9797fD7c1A8fFAB1e3153dB896ad61403086ee',
    },
    dualCORE: {
      syToken: '0xb9eaf48C9c7F19216A54D0cCADC3709a4CB7f9D6',
      expectedPT: '0x36D8e8262422f04781f19F8C93027e36fe264ce6',
      expectedYT: '0x61fD2ee2B58c2258a054ec6532a14c40A85f666D',
    }
  }
  
  const factoryABI = [
    {
      name: 'getMarket',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'syToken', type: 'address' }],
      outputs: [
        { name: 'active', type: 'bool' },
        { name: 'syToken', type: 'address' },
        { name: 'ptToken', type: 'address' },
        { name: 'ytToken', type: 'address' },
        { name: 'maturity', type: 'uint256' },
        { name: 'totalSYDeposited', type: 'uint256' },
        { name: 'totalYieldDistributed', type: 'uint256' },
        { name: 'minInvestment', type: 'uint256' },
        { name: 'maxInvestment', type: 'uint256' },
        { name: 'createdAt', type: 'uint256' }
      ],
    },
  ]
  
  const factoryContract = new ethers.Contract(factoryAddress, factoryABI, ethers.provider)
  
  for (const [assetName, tokens] of Object.entries(assets)) {
    console.log(`\n📊 Checking ${assetName} market...`)
    
    try {
      const marketData = await factoryContract.getMarket(tokens.syToken)
      
      if (marketData && marketData.active) {
        console.log(`  ✅ Market found!`)
        console.log(`    Active: ${marketData.active}`)
        console.log(`    SY Token: ${marketData.syToken}`)
        console.log(`    PT Token: ${marketData.ptToken}`)
        console.log(`    YT Token: ${marketData.ytToken}`)
        console.log(`    Maturity: ${new Date(Number(marketData.maturity) * 1000).toISOString()}`)
        
        // Check if addresses match expected
        const ptMatch = marketData.ptToken.toLowerCase() === tokens.expectedPT.toLowerCase()
        const ytMatch = marketData.ytToken.toLowerCase() === tokens.expectedYT.toLowerCase()
        
        if (ptMatch && ytMatch) {
          console.log(`  ✅ Addresses match: true`)
        } else {
          console.log(`  ❌ Addresses match: false`)
          if (!ptMatch) console.log(`  ❌ Expected PT: ${tokens.expectedPT}`)
          if (!ytMatch) console.log(`  ❌ Expected YT: ${tokens.expectedYT}`)
        }
      } else {
        console.log(`  ❌ No active market found`)
      }
      
    } catch (error) {
      console.log(`  ❌ Error checking market: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  
  console.log('\n✅ All markets check complete!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  }) 
import { ethers } from 'hardhat'

async function main() {
  console.log('🏭 Creating markets for all assets...')
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners()
  console.log('Deployer address:', deployer.address)
  
  // Contract addresses from your deployment
  const FACTORY_ADDRESS = '0x5fB9552177B6FE33ca4e6E55B2B1c9Dfc3BDbfD0'
  
  // Get the factory contract
  const factory = await ethers.getContractAt('CoreYieldFactory', FACTORY_ADDRESS)
  
  // Asset configurations
  const assets = [
    {
      name: 'stCORE',
      syToken: '0x7d33476ae3F000eD60178686d64583FC82CdF3d2',
    },
    {
      name: 'lstBTC', 
      syToken: '0x712D2147699aa2152EC69296f15b5f16bCD84D3B',
    },
    {
      name: 'dualCORE',
      syToken: '0xAB92A4b44f3b321c68Db3716ce546DC365D46838',
    }
  ]
  
  console.log('\n📋 Creating markets for assets:', assets.map(a => a.name).join(', '))
  
  for (const asset of assets) {
    try {
      console.log(`\n🔄 Creating market for ${asset.name}...`)
      
      const tx = await factory.createMarket(
        asset.syToken,                    // syToken address
        365 * 24 * 60 * 60,             // maturityDuration (1 year)
        `PT-${asset.name}`,              // ptName
        `PT-${asset.name}`,              // ptSymbol
        `YT-${asset.name}`,              // ytName
        `YT-${asset.name}`,              // ytSymbol
        {
          gasLimit: 3000000 // Increase gas limit for contract deployment
        }
      )
      
      console.log(`📤 Transaction sent: ${tx.hash}`)
      const receipt = await tx.wait()
      console.log(`✅ Market created for ${asset.name}! Block: ${receipt.blockNumber}`)
      
      // Get the market ID from the event
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = factory.interface.parseLog(log)
          return parsed.name === 'MarketCreated'
        } catch {
          return false
        }
      })
      
      if (event) {
        const parsed = factory.interface.parseLog(event)
        console.log(`📋 Market ID: ${parsed.args.marketId}`)
        console.log(`🔒 PT Token: ${parsed.args.ptToken}`)
        console.log(`🎲 YT Token: ${parsed.args.ytToken}`)
      }
      
    } catch (error) {
      console.error(`❌ Failed to create market for ${asset.name}:`, error)
    }
  }
  
  // Get all markets to verify
  console.log('\n📊 Fetching all created markets...')
  const allMarkets = await factory.getAllMarkets()
  console.log(`✅ Total markets created: ${allMarkets.length}`)
  
  for (let i = 0; i < allMarkets.length; i++) {
    const marketData = await factory.getMarket(allMarkets[i])
    console.log(`\n📋 Market ${i + 1}:`)
    console.log(`  ID: ${allMarkets[i]}`)
    console.log(`  SY Token: ${marketData.syToken}`)
    console.log(`  PT Token: ${marketData.ptToken}`)
    console.log(`  YT Token: ${marketData.ytToken}`)
    console.log(`  Active: ${marketData.active}`)
    console.log(`  Maturity: ${new Date(Number(marketData.maturity) * 1000).toLocaleDateString()}`)
  }
  
  console.log('\n🎉 Market creation complete!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
import { createPublicClient, http, formatUnits } from 'viem'
import { coreTestnet } from 'viem/chains'

// Contract addresses
const CONTRACTS = {
  CORE_STAKING: '0xE4d4bdb6BF9FA8b137340288d5d4e2fC07331d59',
  CORE_YIELD_ROUTER: '0xF1F1C951036D9cCD9297Da837201970eEc88495e',
  CORE_YIELD_AMM: '0x1234567890123456789012345678901234567890', // Replace with actual AMM address
  MARKETS: {
    stCORE_0: {
      syToken: '0xd77Ec1b359063e8aa0A0810F0F004e84B156300B',
      ptToken: '0x4f13B431a493FB0Dc78c57eB309A78692D42eF8a',
      ytToken: '0x26a3e8273338CB1fF835431AD4F2B16beE101928',
      underlying: '0x4D6B4EC6dD26aA2F65e825C9F4Be2F3980506Ba7',
      maturity: 1787139257
    },
    stCORE_1: {
      syToken: '0xdC4EE2200b0C305f723559101bC33ef80d6F9D16',
      ptToken: '0x0CcB786FcE2e0cB367b7CF1f8605BEDfe6102018',
      ytToken: '0x67153d28CC1f517Bf14be61ccB8c6f97e5BC5d9C',
      underlying: '0x4D6B4EC6dD26aA2F65e825C9F4Be2F3980506Ba7',
      maturity: 1787139257
    },
    lstBTC_0: {
      syToken: '0x2462695096d3578aBd371C704bd12c5BA7702F48',
      ptToken: '0xd840c9363f6A71E3cfBE6f043577736D7FDb3EEE',
      ytToken: '0xFC5CA3B14BdBcEda9F27b9253381805Bc2FBbDaE',
      underlying: '0xCf5Eb1CEcf54f792A89C81d3EF636AAc6f4F7B1A',
      maturity: 1787139257
    },
    lstBTC_1: {
      syToken: '0x379103dF58731cd59aa3448826C15FA27Ed80D9a',
      ptToken: '0xb522F59D354FC12D4584Ba47BF9224CC59A6BC21',
      ytToken: '0xe4838BA09645038130f63b602f003A34ccfF8f3f',
      underlying: '0xCf5Eb1CEcf54f792A89C81d3EF636AAc6f4F7B1A',
      maturity: 1787139257
    },
    lstBTC_2: {
      syToken: '0xF5E8A5101df703d0207bb134C9E76ca2033208D1',
      ptToken: '0xb3981A2aA51D3523799D49EAF562326ACEDBdA1c',
      ytToken: '0x570AA53C698f4baaE3dc34b0b6fD364518aa64b0',
      underlying: '0xCf5Eb1CEcf54f792A89C81d3EF636AAc6f4F7B1A',
      maturity: 1787139257
    },
    lstBTC_3: {
      syToken: '0x505e1f6ACaF6e7C1DBc973d989A82d8F9efea67B',
      ptToken: '0x3be44874bcFEdd6d2202f01A6948183e89BFe679',
      ytToken: '0x57D5fc391d83B492a9605b966698600Fa3A4E5B8',
      underlying: '0xCf5Eb1CEcf54f792A89C81d3EF636AAc6f4F7B1A',
      maturity: 1787139257
    },
    lstBTC_4: {
      syToken: '0x01ce3b0709C49f0c8FC84a50252F8A22e53d208e',
      ptToken: '0x5676e608Eb6350d90239c1032304C7EFd99dC3aC',
      ytToken: '0x7EfEcEDb940362E366E89b8cD13A1A3d6ab7BCEB',
      underlying: '0xCf5Eb1CEcf54f792A89C81d3EF636AAc6f4F7B1A',
      maturity: 1787139257
    }
  }
}

const USER_ADDRESS = '0xCE09931EeBd7d57c10BDcE6dBfA51a1139ec3663'

async function checkAllMarketBalances() {
  console.log('🔍 Checking balances for all markets...')
  console.log('👤 User Address:', USER_ADDRESS)
  console.log('')

  const publicClient = createPublicClient({
    chain: coreTestnet,
    transport: http('https://rpc.coredao.org')
  })

  const results: Record<string, any> = {}

  for (const [marketKey, market] of Object.entries(CONTRACTS.MARKETS)) {
    console.log(`\n📊 Checking ${marketKey}:`)
    console.log(`   SY Token: ${market.syToken}`)
    console.log(`   PT Token: ${market.ptToken}`)
    console.log(`   YT Token: ${market.ytToken}`)

    try {
      // Check SY balance
      const syBalance = await publicClient.readContract({
        address: market.syToken as `0x${string}`,
        abi: [{
          "inputs": [{"name": "account", "type": "address"}],
          "name": "balanceOf",
          "outputs": [{"name": "", "type": "uint256"}],
          "stateMutability": "view",
          "type": "function"
        }],
        functionName: 'balanceOf',
        args: [USER_ADDRESS as `0x${string}`]
      })

      // Check PT balance
      const ptBalance = await publicClient.readContract({
        address: market.ptToken as `0x${string}`,
        abi: [{
          "inputs": [{"name": "account", "type": "address"}],
          "name": "balanceOf",
          "outputs": [{"name": "", "type": "uint256"}],
          "stateMutability": "view",
          "type": "function"
        }],
        functionName: 'balanceOf',
        args: [USER_ADDRESS as `0x${string}`]
      })

      // Check YT balance
      const ytBalance = await publicClient.readContract({
        address: market.ytToken as `0x${string}`,
        abi: [{
          "inputs": [{"name": "account", "type": "address"}],
          "name": "balanceOf",
          "outputs": [{"name": "", "type": "uint256"}],
          "stateMutability": "view",
          "type": "function"
        }],
        functionName: 'balanceOf',
        args: [USER_ADDRESS as `0x${string}`]
      })

      const formattedBalances = {
        sy: formatUnits(syBalance as bigint, 18),
        pt: formatUnits(ptBalance as bigint, 18),
        yt: formatUnits(ytBalance as bigint, 18)
      }

      console.log(`   ✅ SY Balance: ${formattedBalances.sy}`)
      console.log(`   ✅ PT Balance: ${formattedBalances.pt}`)
      console.log(`   ✅ YT Balance: ${formattedBalances.yt}`)

      results[marketKey] = formattedBalances

    } catch (error) {
      console.log(`   ❌ Error reading ${marketKey}:`, error)
      results[marketKey] = { error: error.message }
    }
  }

  console.log('\n📋 SUMMARY:')
  console.log('============')
  
  Object.entries(results).forEach(([marketKey, balances]) => {
    if (balances.error) {
      console.log(`${marketKey}: ERROR - ${balances.error}`)
    } else {
      const hasBalance = parseFloat(balances.sy) > 0 || parseFloat(balances.pt) > 0 || parseFloat(balances.yt) > 0
      console.log(`${marketKey}: ${hasBalance ? '✅ HAS BALANCE' : '❌ NO BALANCE'}`)
      if (hasBalance) {
        console.log(`   SY: ${balances.sy}, PT: ${balances.pt}, YT: ${balances.yt}`)
      }
    }
  })

  return results
}

// Run the check
checkAllMarketBalances()
  .then(results => {
    console.log('\n🎯 Available markets with balances:')
    Object.entries(results).forEach(([key, balances]) => {
      if (!balances.error && (parseFloat(balances.sy) > 0 || parseFloat(balances.pt) > 0 || parseFloat(balances.yt) > 0)) {
        console.log(`   ${key}: PT=${balances.pt}, YT=${balances.yt}`)
      }
    })
  })
  .catch(error => {
    console.error('❌ Script failed:', error)
  })

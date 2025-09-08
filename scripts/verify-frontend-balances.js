const hre = require("hardhat");
const { ethers } = hre;

// Contract addresses (same as frontend)
const CONTRACTS = {
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

async function verifyRealBalances() {
  console.log('🔍 VERIFYING REAL BALANCES FROM BLOCKCHAIN')
  console.log('👤 User Address:', USER_ADDRESS)
  console.log('')

  const provider = ethers.provider;
  const erc20ABI = [
    {
      "inputs": [{"name": "account", "type": "address"}],
      "name": "balanceOf",
      "outputs": [{"name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  const realBalances = {};

  for (const [marketKey, market] of Object.entries(CONTRACTS.MARKETS)) {
    console.log(`📊 ${marketKey}:`);
    
    try {
      // Get PT balance
      const ptContract = new ethers.Contract(market.ptToken, erc20ABI, provider);
      const ptBalance = await ptContract.balanceOf(USER_ADDRESS);
      const ptFormatted = parseFloat(ethers.formatEther(ptBalance)).toFixed(2);

      // Get YT balance
      const ytContract = new ethers.Contract(market.ytToken, erc20ABI, provider);
      const ytBalance = await ytContract.balanceOf(USER_ADDRESS);
      const ytFormatted = parseFloat(ethers.formatEther(ytBalance)).toFixed(2);

      realBalances[marketKey] = {
        pt: ptFormatted,
        yt: ytFormatted
      };

      console.log(`   ✅ PT: ${ptFormatted}`);
      console.log(`   ✅ YT: ${ytFormatted}`);

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      realBalances[marketKey] = { error: error.message };
    }
  }

  console.log('\n📋 REAL BALANCES SUMMARY:');
  console.log('========================');
  
  Object.entries(realBalances).forEach(([marketKey, balances]) => {
    if (balances.error) {
      console.log(`${marketKey}: ERROR - ${balances.error}`);
    } else {
      console.log(`${marketKey}: PT=${balances.pt}, YT=${balances.yt}`);
    }
  });

  console.log('\n🎯 EXPECTED FRONTEND DISPLAY:');
  console.log('=============================');
  console.log('When trading stCORE_1: PT should show 122.70, YT should show 146.80');
  console.log('When trading stCORE_0: PT should show 730.70, YT should show 788.27');
  console.log('When trading lstBTC_0: PT should show 103.70, YT should show 114.40');
  console.log('When trading lstBTC_1: PT should show 323.20, YT should show 348.91');

  return realBalances;
}

// Run the verification
verifyRealBalances()
  .then(() => {
    console.log('\n✅ Real balance verification completed!');
    console.log('Now check if the frontend shows these exact values.');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });

# 🪙 Token Minting Guide

This guide explains how to mint test tokens for users in the CoreYield application.

## Overview

The CoreYield application uses mock tokens for testing. The mint functions are restricted to the contract owner only, but we've created scripts and a frontend interface to make it easy for users to get test tokens.

## Available Scripts

### 1. Basic Token Minting
```bash
npx hardhat run scripts/mint-tokens-for-user.js --network coreTestnet [userAddress] [amount]
```

### 2. Comprehensive Token Minting
```bash
npx hardhat run scripts/mint-all-tokens.js --network coreTestnet [userAddress] [amount]
```

## Examples

### Mint 10,000 tokens to your own address
```bash
npx hardhat run scripts/mint-all-tokens.js --network coreTestnet
```

### Mint 50,000 tokens to a specific address
```bash
npx hardhat run scripts/mint-all-tokens.js --network coreTestnet 0x1234...5678 50000
```

### Mint 5,000 tokens to a specific address
```bash
npx hardhat run scripts/mint-tokens-for-user.js --network coreTestnet 0x1234...5678 5000
```

## Frontend Interface

Users can also request tokens through the frontend:

1. **Connect your wallet** to the application
2. **Click "🪙 Request Test Tokens"** button
3. **Enter the amount** you want (default: 10,000)
4. **Copy the command** that appears
5. **Run the command** in your terminal
6. **Refresh the page** to see your new balance

## What You Get

When you mint tokens, you receive:
- **CORE tokens** that can be used as CORE, stCORE, or lstBTC
- **Full access** to all application features
- **Ability to stake, wrap, split, and trade** tokens
- **Access to liquidity pools** and AMM functionality

## Token Details

- **Contract**: MockDualCORE (0x4D6B4EC6dD26aA2F65e825C9F4Be2F3980506Ba7)
- **Name**: DualCORE Token
- **Symbol**: CORE
- **Decimals**: 18
- **Network**: Core Testnet

## Troubleshooting

### "onlyOwner" Error
If you get an "onlyOwner" error:
1. Make sure you're using the owner account
2. Check that the contract address is correct
3. Verify the contract is deployed and accessible

### Balance Not Updating
If your balance doesn't update after minting:
1. Wait a few seconds for the transaction to confirm
2. **Click the "🔄 Refresh Balances" button** (this is the most important step!)
3. If still not working, refresh the entire page

**Note**: The underlying token balances (CORE, stCORE, lstBTC) use `useBalance` hooks that have a 30-second refetch interval, so they won't update automatically after minting. You must click the "Refresh Balances" button to see your new tokens immediately.

### Script Not Found
If the script isn't found:
1. Make sure you're in the CoreYield project directory
2. Check that the script files exist in the `scripts/` folder
3. Verify you have the correct network configuration

## Security Notes

- These are **test tokens only** - they have no real value
- The minting is restricted to the contract owner for security
- In production, token minting would be handled differently
- Always verify you're on the testnet, not mainnet

## Support

If you encounter any issues:
1. Check the console logs for error messages
2. Verify your wallet is connected to Core Testnet
3. Ensure you have sufficient gas for transactions
4. Try refreshing the page and reconnecting your wallet

---

**Happy Testing! 🚀**

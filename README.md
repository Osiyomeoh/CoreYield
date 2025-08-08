# 🌟 CoreYield Protocol

**Next-Generation Yield Protocol for Core Ecosystem**

CoreYield Protocol is an innovative DeFi platform that tokenizes yield-bearing assets from the Core blockchain ecosystem, enabling users to trade future returns and optimize their yield strategies.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Setup Instructions](#setup-instructions)
- [Deployment Guide](#deployment-guide)
- [Testing](#testing)
- [Contributing](#contributing)
- [Security](#security)
- [Roadmap](#roadmap)
- [Support](#support)

## 📖 Overview

CoreYield Protocol revolutionizes yield farming by introducing **Standardized Yield (SY) tokens** that represent future returns on yield-bearing assets. Built specifically for the Core ecosystem, it enables users to:

- **Tokenize Future Returns**: Convert yield-bearing assets into tradeable SY tokens
- **Split Yield & Principal**: Separate principal and yield components for advanced strategies
- **Optimize Yield**: Access multiple yield sources through a unified interface
- **Risk Management**: Diversify yield exposure across different assets and timeframes

### **Core Ecosystem Integration**
- **stCORE**: Liquid staking tokens for Core blockchain (8.5% APY)
- **lstBTC**: Liquid staked Bitcoin tokens (4.2% APY)
- **Dual Staking**: Combined CORE + BTC staking strategies (12.1% APY)

## 🚀 Features

### **Core-Native Integration**
- **stCORE Support**: Liquid staking tokens for Core blockchain
- **lstBTC Integration**: Liquid staked Bitcoin tokens
- **Dual Staking**: Combined CORE + BTC staking strategies
- **Core Testnet2**: Full integration with Core's testnet infrastructure

### **SY Token System**
- **Standardized Yield Tokens**: Wrap yield-bearing assets into tradeable SY tokens
- **PT/YT Splitting**: Split SY tokens into Principal Tokens (PT) and Yield Tokens (YT)
- **Yield Optimization**: Advanced yield farming strategies
- **Risk Management**: Diversified yield exposure

### **Professional UI/UX**
- **Dark Theme**: Modern, professional interface
- **Mobile Responsive**: Works seamlessly on all devices
- **Real-time Data**: Live balance updates and yield calculations
- **Educational Component**: Built-in learning system for DeFi newcomers

### **Advanced Features**
- **Calculator Tools**: APY converter, yield calculator, compound effect simulator
- **Analytics Dashboard**: Portfolio performance and yield analysis
- **Info Bot**: AI-powered assistance for protocol questions
- **Whale Alerts**: Monitor large transactions and market movements

## 🏗️ Architecture

### **Smart Contracts**

#### **Mock Assets (Testing)**
- `MockStCORE.sol`: Staked CORE token with 8.5% APY
- `MockLstBTC.sol`: Liquid staked BTC with 4.2% APY  
- `MockDualCORE.sol`: Dual staking with 12.1% APY

#### **Core Protocol**
- `CoreYieldFactory.sol`: Main factory for market creation and management
- `StandardizedYieldToken.sol`: SY token implementation
- `CorePrincipalToken.sol`: Principal token (PT) implementation
- `CoreYieldToken.sol`: Yield token (YT) implementation

#### **Interfaces**
- `ICoreYieldFactory.sol`: Factory interface
- `IStandardizedYieldToken.sol`: SY token interface
- `IYieldToken.sol`: Yield token interface
- `IStakingToken.sol`: Staking token interface

### **Frontend Architecture**
- **React + TypeScript**: Modern, type-safe frontend
- **Wagmi + RainbowKit**: Web3 integration
- **Tailwind CSS**: Utility-first styling
- **Vite**: Fast development and building

## ⚡ Quick Start

Get CoreYield Protocol running in 5 minutes:

```bash
# 1. Clone and setup
git clone https://github.com/your-username/coreyield-protocol.git
cd coreyield-protocol
npm install

# 2. Deploy contracts
npx hardhat run scripts/deploy.ts --network core-testnet2

# 3. Start frontend
cd coreyield-frontend
npm install
npm run dev
```

Visit `http://localhost:3000` to start using CoreYield Protocol!

## 🛠️ Setup Instructions

### **Prerequisites**
- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher (or yarn)
- **Git**: For cloning the repository
- **Core Testnet2 RPC**: Access to Core blockchain testnet
- **MetaMask**: Web3 wallet for testing

### **System Requirements**
- **RAM**: Minimum 4GB, Recommended 8GB
- **Storage**: At least 2GB free space
- **Network**: Stable internet connection

### **Installation Steps**

#### **Step 1: Clone Repository**
```bash
git clone https://github.com/your-username/coreyield-protocol.git
cd coreyield-protocol
```

#### **Step 2: Install Dependencies**
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd coreyield-frontend
npm install
cd ..
```

#### **Step 3: Environment Configuration**
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

**Required Environment Variables:**
```env
# Core Testnet2 RPC URL
CORE_RPC_URL=https://rpc.test2.btcs.network

# Private key for deployment (optional for testing)
PRIVATE_KEY=your_private_key_here

# Etherscan API key for contract verification
ETHERSCAN_API_KEY=your_etherscan_key

# Alchemy API key (optional)
ALCHEMY_API_KEY=your_alchemy_key
```

#### **Step 4: Compile Smart Contracts**
```bash
npx hardhat compile
```

#### **Step 5: Run Tests (Optional)**
```bash
npx hardhat test
```

#### **Step 6: Deploy Contracts**
```bash
# Deploy to Core Testnet2
npx hardhat run scripts/deploy.ts --network core-testnet2

# Deploy to local network (for development)
npx hardhat run scripts/deploy.ts --network localhost
```

#### **Step 7: Start Frontend**
```bash
cd coreyield-frontend
npm run dev
```

The application will be available at `http://localhost:3000`

### **Verification**
After deployment, verify your contracts:
```bash
npx hardhat verify --network core-testnet2 CONTRACT_ADDRESS [constructor_args]
```

## 🧪 Testing

### **Smart Contract Testing**
```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/CoreYield.test.ts

# Run with coverage
npx hardhat coverage
```

### **Test Coverage Areas**
- ✅ **Contract Deployment**: All contracts deploy correctly
- ✅ **Token Minting**: Proper validation and error handling
- ✅ **Yield Calculation**: Accurate reward calculations
- ✅ **Market Creation**: Factory functionality
- ✅ **Error Handling**: Comprehensive input validation
- ✅ **Gas Optimization**: Efficient contract operations
- ✅ **Integration Tests**: End-to-end workflows

### **Frontend Testing**
```bash
cd coreyield-frontend
npm test
```

## 📊 Protocol Statistics

### **Current Metrics**
- **Total Markets**: 3 (stCORE, lstBTC, dualCORE)
- **Total Value Locked**: Dynamic based on user deposits
- **Average APY**: 8.2% across all assets
- **Active Users**: Real-time tracking

### **Asset Details**
| Asset | APY | Liquidity | Status |
|-------|-----|-----------|--------|
| stCORE | 8.5% | High | Active |
| lstBTC | 4.2% | Medium | Active |
| dualCORE | 12.1% | High | Active |

## 🔧 Development

### **Adding New Assets**
1. Create mock contract in `contracts/mocks/`
2. Add asset metadata in `contracts/addresses.ts`
3. Update frontend asset configuration
4. Add tests for new asset

### **Modifying Yield Logic**
1. Update reward calculation in mock contracts
2. Modify SY token yield distribution
3. Update frontend yield display
4. Test with various scenarios

### **UI/UX Improvements**
1. Modify components in `coreyield-frontend/src/components/`
2. Update styling in Tailwind classes
3. Test responsive design
4. Validate accessibility

## 🚀 Deployment Guide

### **Smart Contract Deployment**

#### **Pre-deployment Checklist**
- [ ] All tests passing (`npx hardhat test`)
- [ ] Contracts compiled successfully (`npx hardhat compile`)
- [ ] Environment variables configured
- [ ] Sufficient testnet tokens for gas fees
- [ ] Network configuration verified

#### **Deploy to Core Testnet2**
```bash
# Deploy all contracts
npx hardhat run scripts/deploy.ts --network core-testnet2

# Verify deployment
npx hardhat verify --network core-testnet2 CONTRACT_ADDRESS [args]
```

#### **Deploy to Core Mainnet**
```bash
# Deploy to mainnet (when ready)
npx hardhat run scripts/deploy.ts --network core-mainnet

# Verify on Core Explorer
npx hardhat verify --network core-mainnet CONTRACT_ADDRESS [args]
```

#### **Deployment Script Features**
- ✅ **Automated Deployment**: Deploys all contracts in sequence
- ✅ **Address Management**: Saves deployment addresses to files
- ✅ **Frontend Integration**: Updates frontend contract addresses
- ✅ **Verification Commands**: Ready-to-use verification commands
- ✅ **Deployment Summary**: Comprehensive deployment report

### **Frontend Deployment**

#### **Build for Production**
```bash
cd coreyield-frontend

# Install dependencies
npm install

# Build for production
npm run build

# Test production build
npm run preview
```

#### **Deploy to Vercel**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod

# Set environment variables in Vercel dashboard
```

#### **Deploy to Other Platforms**
```bash
# Deploy to Netlify
npm run build
# Upload dist/ folder to Netlify

# Deploy to GitHub Pages
npm run build
# Push to gh-pages branch
```

### **Environment Configuration**

#### **Production Environment Variables**
```env
# Core Mainnet RPC URL
VITE_CORE_RPC_URL=https://rpc.core.org

# Contract addresses (from deployment)
VITE_FACTORY_ADDRESS=0x...
VITE_STCORE_ADDRESS=0x...
VITE_LSTBTC_ADDRESS=0x...
VITE_DUALCORE_ADDRESS=0x...

# Analytics (optional)
VITE_ANALYTICS_ID=your_analytics_id
```

### **Post-Deployment Steps**
1. **Verify Contracts**: Run verification commands
2. **Update Documentation**: Update contract addresses
3. **Test Functionality**: Verify all features work
4. **Monitor Performance**: Set up monitoring and alerts
5. **User Onboarding**: Prepare user documentation

## 🔒 Security

### **Smart Contract Security**
- ✅ **Input Validation**: All user inputs validated
- ✅ **Access Control**: Proper ownership and role management
- ✅ **Reentrancy Protection**: Using OpenZeppelin's ReentrancyGuard
- ✅ **Overflow Protection**: Safe math operations
- ✅ **Error Handling**: Comprehensive error messages

### **Frontend Security**
- ✅ **Web3 Security**: Proper wallet connection handling
- ✅ **Input Sanitization**: All user inputs sanitized
- ✅ **Error Boundaries**: Graceful error handling
- ✅ **Type Safety**: Full TypeScript implementation

## 📈 Roadmap

### **Phase 1: Foundation** ✅
- [x] Core contract development
- [x] Mock asset implementation
- [x] Basic frontend
- [x] Testing suite
- [x] Error handling implementation
- [x] Documentation

### **Phase 2: Enhancement** 🚧
- [ ] Real asset integration with Core ecosystem
- [ ] Advanced yield strategies and optimization
- [ ] Governance token and DAO implementation
- [ ] Mobile app development
- [ ] Cross-chain yield opportunities
- [ ] Institutional features and compliance

### **Phase 3: Scale** 📋
- [ ] Multi-chain integration (Ethereum, Polygon, etc.)
- [ ] Advanced analytics and portfolio management
- [ ] Institutional-grade features
- [ ] Community governance and voting
- [ ] Yield farming incentives and rewards
- [ ] DeFi protocol partnerships

### **Phase 4: Ecosystem** 🌐
- [ ] Core ecosystem integration partnerships
- [ ] Developer SDK and API
- [ ] Third-party integrations
- [ ] Advanced risk management tools
- [ ] Insurance and protection mechanisms
- [ ] Global expansion and localization

## 🆘 Support

### **Getting Help**

#### **Documentation**
- [📖 User Guide](docs/user-guide.md) - How to use CoreYield Protocol
- [🔧 Developer Guide](docs/developer-guide.md) - Technical documentation
- [🔒 Security Guide](docs/security.md) - Security best practices
- [🧪 Testing Guide](docs/testing.md) - How to run and write tests

#### **Community Support**
- **Discord**: [Join our Discord](https://discord.gg/coreyield) for real-time help
- **Telegram**: [Telegram Group](https://t.me/coreyield) for community discussions
- **GitHub Issues**: [Report bugs](https://github.com/coreyield/coreyield-protocol/issues)
- **GitHub Discussions**: [Ask questions](https://github.com/coreyield/coreyield-protocol/discussions)

#### **Professional Support**
- **Email**: support@coreyield.protocol
- **Business Inquiries**: partnerships@coreyield.protocol
- **Security Issues**: security@coreyield.protocol

### **Troubleshooting**

#### **Common Issues**

**Contract Deployment Fails**
```bash
# Check network configuration
npx hardhat console --network core-testnet2

# Verify RPC URL
curl -X POST https://rpc.test2.btcs.network \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

**Frontend Connection Issues**
```bash
# Check if contracts are deployed
npx hardhat run scripts/check-deployment.ts

# Verify environment variables
echo $VITE_CORE_RPC_URL
echo $VITE_FACTORY_ADDRESS
```

**Test Failures**
```bash
# Run specific test file
npx hardhat test test/CoreYield.test.ts

# Run with verbose output
npx hardhat test --verbose

# Check gas usage
npx hardhat test --gas
```

### **Performance Optimization**

#### **Gas Optimization**
- Use batch operations when possible
- Optimize storage patterns
- Implement efficient algorithms
- Use events for off-chain data

#### **Frontend Optimization**
- Implement lazy loading
- Use React.memo for expensive components
- Optimize bundle size
- Implement caching strategies

## 🤝 Contributing

We welcome contributions from the community! CoreYield Protocol is an open-source project that thrives on collaboration.

### **Getting Started**

#### **Fork and Clone**
```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/your-username/coreyield-protocol.git
cd coreyield-protocol

# Add upstream remote
git remote add upstream https://github.com/original/coreyield-protocol.git
```

#### **Development Setup**
```bash
# Install dependencies
npm install

# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes
# Run tests
npx hardhat test

# Commit your changes
git commit -m "feat: add your feature description"
```

### **Development Workflow**

1. **Fork the Repository**: Create your own fork on GitHub
2. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Make Changes**: Implement your feature or fix
4. **Add Tests**: Ensure all tests pass
5. **Update Documentation**: Update README or docs if needed
6. **Commit Changes**: Use conventional commit messages
7. **Push to Fork**: `git push origin feature/amazing-feature`
8. **Create Pull Request**: Submit PR with detailed description

### **Code Standards**

#### **Smart Contracts (Solidity)**
- Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- Use OpenZeppelin contracts when possible
- Add comprehensive error handling
- Include NatSpec documentation
- Write unit tests for all functions

#### **Frontend (TypeScript/React)**
- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks
- Implement proper error boundaries
- Add loading states and user feedback

#### **Testing**
- Maintain >90% test coverage
- Test both success and failure scenarios
- Use descriptive test names
- Mock external dependencies

#### **Documentation**
- Update README for new features
- Add inline code comments
- Document API changes
- Include usage examples

### **Commit Message Convention**
```
type(scope): description

feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: add or update tests
chore: maintenance tasks
```

### **Pull Request Guidelines**

#### **Before Submitting**
- [ ] All tests pass
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Error handling implemented

#### **PR Description Template**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where needed
- [ ] I have made corresponding changes to documentation
```

### **Issue Reporting**

#### **Bug Reports**
```markdown
**Describe the bug**
Clear description of what the bug is

**To Reproduce**
Steps to reproduce the behavior

**Expected behavior**
What you expected to happen

**Screenshots**
If applicable, add screenshots

**Environment**
- OS: [e.g. macOS, Windows]
- Browser: [e.g. Chrome, Firefox]
- Version: [e.g. 1.0.0]

**Additional context**
Any other context about the problem
```

#### **Feature Requests**
```markdown
**Is your feature request related to a problem?**
Description of the problem

**Describe the solution you'd like**
Clear description of what you want

**Describe alternatives you've considered**
Alternative solutions

**Additional context**
Any other context or screenshots
```

### **Community Guidelines**
- Be respectful and inclusive
- Help others learn and grow
- Provide constructive feedback
- Follow the project's code of conduct
- Celebrate contributions and achievements

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌐 Links & Resources

### **Official Links**
- **🌐 Website**: [coreyield.protocol](https://coreyield.protocol)
- **📚 Documentation**: [docs.coreyield.protocol](https://docs.coreyield.protocol)
- **🔗 Core Explorer**: [scan.test2.btcs.network](https://scan.test2.btcs.network)

### **Community**
- **💬 Discord**: [discord.gg/coreyield](https://discord.gg/coreyield)
- **📱 Telegram**: [t.me/coreyield](https://t.me/coreyield)
- **🐦 Twitter**: [@CoreYield](https://twitter.com/CoreYield)
- **📖 Medium**: [medium.com/coreyield](https://medium.com/coreyield)

### **Development**
- **📦 GitHub**: [github.com/coreyield](https://github.com/coreyield)
- **🐛 Issues**: [github.com/coreyield/issues](https://github.com/coreyield/issues)
- **💡 Discussions**: [github.com/coreyield/discussions](https://github.com/coreyield/discussions)

### **Ecosystem**
- **🔗 Core Blockchain**: [core.org](https://core.org)
- **📊 Core Explorer**: [scan.core.org](https://scan.core.org)
- **💎 Core Documentation**: [docs.core.org](https://docs.core.org)

## 🙏 Acknowledgments

### **Core Ecosystem**
- **Core Blockchain Team**: For the amazing infrastructure and support
- **Core Community**: For feedback and testing
- **Core Ventures**: For ecosystem support

### **Open Source**
- **OpenZeppelin**: For secure contract libraries and best practices
- **Hardhat**: For excellent development tools and testing framework
- **RainbowKit**: For seamless Web3 integration
- **Wagmi**: For React hooks for Ethereum
- **Vite**: For fast development and building

### **Community Contributors**
- All contributors who have helped improve CoreYield Protocol
- Beta testers and early adopters
- Community moderators and ambassadors

---

**Built with ❤️ for the Core ecosystem**

*CoreYield Protocol - Tokenizing the future of yield farming*
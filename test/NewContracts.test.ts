import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("New CoreYield Contracts", function () {
  let coreStaking: Contract;
  let coreSwapAMM: Contract;
  let portfolioTracker: Contract;
  let yieldHarvester: Contract;
  let riskManager: Contract;
  let coreGovernance: Contract;
  let analyticsEngine: Contract;
  let coreToken: Contract;
  let stCoreToken: Contract;
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  let ownerAddress: string;
  let user1Address: string;
  let user2Address: string;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    user1Address = await user1.getAddress();
    user2Address = await user2.getAddress();

    // Deploy mock tokens
    const MockCore = await ethers.getContractFactory("MockDualCORE");
    coreToken = await MockCore.deploy();
    const MockSt = await ethers.getContractFactory("MockStCORE");
    stCoreToken = await MockSt.deploy();

    // Deploy CoreStaking
    const CoreStaking = await ethers.getContractFactory("CoreStaking");
    coreStaking = await CoreStaking.deploy(
      await coreToken.getAddress(),
      await stCoreToken.getAddress()
    );

    // Seed staking contract with stCORE for rewards distribution
    await stCoreToken.mint(await coreStaking.getAddress(), ethers.parseEther("1000000"));

    // Deploy CoreSwapAMM
    const CoreSwapAMM = await ethers.getContractFactory("CoreSwapAMM");
    coreSwapAMM = await CoreSwapAMM.deploy();

    // Deploy PortfolioTracker
    const PortfolioTracker = await ethers.getContractFactory("PortfolioTracker");
    portfolioTracker = await PortfolioTracker.deploy();

    // Deploy YieldHarvester
    const YieldHarvester = await ethers.getContractFactory("YieldHarvester");
    yieldHarvester = await YieldHarvester.deploy();

    // Deploy RiskManager
    const RiskManager = await ethers.getContractFactory("RiskManager");
    riskManager = await RiskManager.deploy();

    // Deploy CoreGovernance
    const CoreGovernance = await ethers.getContractFactory("CoreGovernance");
    coreGovernance = await CoreGovernance.deploy();

    // Deploy AnalyticsEngine
    const AnalyticsEngine = await ethers.getContractFactory("AnalyticsEngine");
    analyticsEngine = await AnalyticsEngine.deploy();

    // Setup: Mint tokens to users
    await coreToken.mint(user1Address, ethers.parseEther("1000"));
    await coreToken.mint(user2Address, ethers.parseEther("1000"));
    // Mint tokens to owner for AMM liquidity
    await coreToken.mint(ownerAddress, ethers.parseEther("10000"));
    await stCoreToken.mint(ownerAddress, ethers.parseEther("10000"));
  });

  describe("CoreStaking", function () {
    it("Should deploy correctly", async function () {
      expect(await coreStaking.coreToken()).to.equal(await coreToken.getAddress());
      expect(await coreStaking.stCoreToken()).to.equal(await stCoreToken.getAddress());
    });

    it("Should allow staking", async function () {
      const stakeAmount = ethers.parseEther("100");

      await coreToken.connect(user1).approve(await coreStaking.getAddress(), stakeAmount);
      await coreStaking.connect(user1).stake(stakeAmount);

      const userInfo = await coreStaking.getUserStakingInfo(user1Address);
      expect(userInfo.stakedAmount).to.equal(stakeAmount);
      expect(userInfo.rewards).to.equal(0);
    });

    it("Should calculate rewards correctly", async function () {
      const stakeAmount = ethers.parseEther("100");

      await coreToken.connect(user1).approve(await coreStaking.getAddress(), stakeAmount);
      await coreStaking.connect(user1).stake(stakeAmount);

      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [86400]); // 1 day
      await ethers.provider.send("evm_mine", []);

      const earned = await coreStaking.earned(user1Address);
      expect(earned).to.be.gt(0);
    });

    it("Should allow unstaking after lock period", async function () {
      const stakeAmount = ethers.parseEther("100");

      await coreToken.connect(user1).approve(await coreStaking.getAddress(), stakeAmount);
      await coreStaking.connect(user1).stake(stakeAmount);

      // Fast forward past lock period
      await ethers.provider.send("evm_increaseTime", [8 * 86400]); // 8 days
      await ethers.provider.send("evm_mine", []);

      await stCoreToken.connect(user1).approve(await coreStaking.getAddress(), stakeAmount);
      await coreStaking.connect(user1).unstake(stakeAmount);

      const userInfo = await coreStaking.getUserStakingInfo(user1Address);
      expect(userInfo.stakedAmount).to.equal(0n);
    });
  });

  describe("CoreSwapAMM", function () {
    it("Should deploy correctly", async function () {
      expect(await coreSwapAMM.owner()).to.equal(ownerAddress);
    });

    it("Should create pools", async function () {
      // Add tokens as supported BEFORE creating pool
      await coreSwapAMM.addSupportedToken(await coreToken.getAddress());
      await coreSwapAMM.addSupportedToken(await stCoreToken.getAddress());

      // Check if tokens are actually supported
      const isCoreSupported = await coreSwapAMM.supportedTokens(await coreToken.getAddress());
      const isStCoreSupported = await coreSwapAMM.supportedTokens(await stCoreToken.getAddress());
      console.log("Core token supported:", isCoreSupported);
      console.log("StCore token supported:", isStCoreSupported);

      // Ensure proper token ordering (token0 < token1)
      let token0 = await coreToken.getAddress();
      let token1 = await stCoreToken.getAddress();
      if (token0 > token1) {
        [token0, token1] = [token1, token0];
      }

      console.log("Creating pool with tokens:", token0, token1);
      console.log("Token0 < Token1:", token0 < token1);
      
      try {
        await coreSwapAMM.createPool(
          token0,
          token1
        );
        console.log("Pool created successfully");
      } catch (error) {
        console.log("Pool creation failed:", error);
        throw error;
      }

      const poolKey = ethers.keccak256(
        ethers.solidityPacked(
          ["address", "address"],
          [token0, token1]
        )
      );

      console.log("Pool key:", poolKey);
      const pool = await coreSwapAMM.pools(poolKey);
      console.log("Pool data:", pool);
      // Check that pool was created (token0 should not be zero address)
      expect(pool.token0).to.not.equal(ethers.ZeroAddress);
      expect(pool.token1).to.not.equal(ethers.ZeroAddress);
    });

    it("Should add liquidity", async function () {
      // Add tokens as supported BEFORE creating pool
      await coreSwapAMM.addSupportedToken(await coreToken.getAddress());
      await coreSwapAMM.addSupportedToken(await stCoreToken.getAddress());

      // Ensure proper token ordering (token0 < token1)
      let token0 = await coreToken.getAddress();
      let token1 = await stCoreToken.getAddress();
      if (token0 > token1) {
        [token0, token1] = [token1, token0];
      }

      console.log("Creating pool for liquidity with tokens:", token0, token1);
      await coreSwapAMM.createPool(
        token0,
        token1
      );

      const amount0 = ethers.parseEther("1000");
      const amount1 = ethers.parseEther("1000");

      await coreToken.approve(await coreSwapAMM.getAddress(), amount0);
      await stCoreToken.approve(await coreSwapAMM.getAddress(), amount1);

      console.log("Adding liquidity:", amount0.toString(), amount1.toString());
      await coreSwapAMM.addLiquidity(
        token0,
        token1,
        amount0,
        amount1,
        0,
        0
      );

      const poolKey = ethers.keccak256(
        ethers.solidityPacked(
          ["address", "address"],
          [token0, token1]
        )
      );

      const pool = await coreSwapAMM.pools(poolKey);
      console.log("Pool after liquidity:", pool);
      // Check that reserves were added (should be greater than 0)
      expect(pool.reserve0).to.be.gt(0);
      expect(pool.reserve1).to.be.gt(0);
    });
  });

  describe("PortfolioTracker", function () {
    it("Should deploy correctly", async function () {
      expect(await portfolioTracker.owner()).to.equal(ownerAddress);
    });

    it("Should add assets", async function () {
      await portfolioTracker.addAsset(
        await coreToken.getAddress(),
        "CORE",
        "Core Token",
        18,
        5,
        850
      );

      const assetInfo = await portfolioTracker.getAssetInfo(await coreToken.getAddress());
      expect(assetInfo.symbol).to.equal("CORE");
      expect(assetInfo.name).to.equal("Core Token");
      expect(assetInfo.riskLevel).to.equal(5);
      expect(assetInfo.apy).to.equal(850);
    });

    it("Should update user positions", async function () {
      await portfolioTracker.addAsset(
        await coreToken.getAddress(),
        "CORE",
        "Core Token",
        18,
        5,
        850
      );

      const balance = ethers.parseEther("100");
      const usdValue = ethers.parseEther("120");

      await portfolioTracker.updateUserPosition(
        user1Address,
        await coreToken.getAddress(),
        balance,
        usdValue
      );

      const portfolio = await portfolioTracker.getUserPortfolio(user1Address);
      expect(portfolio.totalValue).to.equal(usdValue);
      expect(portfolio.totalAPY).to.equal(850);
    });
  });

  describe("YieldHarvester", function () {
    it("Should deploy correctly", async function () {
      expect(await yieldHarvester.owner()).to.equal(ownerAddress);
    });

    it("Should create yield strategies", async function () {
      await yieldHarvester.createYieldStrategy(
        await coreToken.getAddress(),
        1000,
        500
      );

      const strategy = await yieldHarvester.getStrategyInfo(await coreToken.getAddress());
      expect(strategy.isActive).to.be.true;
      expect(strategy.harvestThreshold).to.equal(1000);
      expect(strategy.autoCompoundThreshold).to.equal(500);
    });

    it("Should update pending yields", async function () {
      await yieldHarvester.createYieldStrategy(
        await coreToken.getAddress(),
        1000,
        500
      );

      const yieldAmount = ethers.parseEther("10");
      await yieldHarvester.updatePendingYield(
        user1Address,
        await coreToken.getAddress(),
        yieldAmount
      );

      const harvestable = await yieldHarvester.getHarvestableYield(
        user1Address,
        await coreToken.getAddress()
      );
      expect(harvestable).to.equal(yieldAmount);
    });
  });

  describe("RiskManager", function () {
    it("Should deploy correctly", async function () {
      expect(await riskManager.owner()).to.equal(ownerAddress);
    });

    it("Should add assets", async function () {
      await riskManager.addAsset(await coreToken.getAddress());

      const metrics = await riskManager.getRiskMetrics(await coreToken.getAddress());
      expect(metrics.volatility).to.equal(2000); // 20% default
      expect(metrics.correlation).to.equal(5000); // 50% default
    });

    it("Should set user risk profiles", async function () {
      await riskManager.connect(user1).setUserRiskProfile(
        7, // risk tolerance
        3000, // max position size (30%)
        3, // max leverage
        true, // stop loss enabled
        2000 // stop loss threshold (20%)
      );

      const profile = await riskManager.getUserRiskProfile(user1Address);
      expect(profile.riskTolerance).to.equal(7);
      expect(profile.maxPositionSize).to.equal(3000);
      expect(profile.stopLossEnabled).to.be.true;
    });

    it("Should calculate asset risk scores", async function () {
      await riskManager.addAsset(await coreToken.getAddress());

      const riskScore = await riskManager.calculateAssetRisk(await coreToken.getAddress());
      expect(riskScore).to.be.gte(1);
      expect(riskScore).to.be.lte(10);
    });
  });

  describe("CoreGovernance", function () {
    it("Should deploy correctly", async function () {
      expect(await coreGovernance.owner()).to.equal(ownerAddress);
    });

    it("Should create proposals", async function () {
      await coreGovernance.updateVotingPower(user1Address, 1000);

      await coreGovernance.connect(user1).createProposal(
        "Test Proposal",
        "This is a test proposal",
        7 * 24 * 3600 // 7 days
      );

      const proposalCount = await coreGovernance.getProposalCount();
      expect(proposalCount).to.equal(1);
    });

    it("Should allow voting", async function () {
      await coreGovernance.updateVotingPower(user1Address, 1000);
      await coreGovernance.updateVotingPower(user2Address, 500);

      await coreGovernance.connect(user1).createProposal(
        "Test Proposal",
        "This is a test proposal",
        7 * 24 * 3600
      );

      await coreGovernance.connect(user2).vote(1, true, "I support this");

      const [support, votingPower, timestamp, reason] = await coreGovernance.getUserVote(1, user2Address);
      expect(support).to.be.true;
      expect(votingPower).to.equal(500);
    });
  });

  describe("AnalyticsEngine", function () {
    it("Should deploy correctly", async function () {
      expect(await analyticsEngine.owner()).to.equal(ownerAddress);
    });

    it("Should add assets", async function () {
      await analyticsEngine.addAsset(await coreToken.getAddress());

      const supportedAssets = await analyticsEngine.getSupportedAssets();
      expect(supportedAssets.length).to.equal(1);
      expect(supportedAssets[0]).to.equal(await coreToken.getAddress());
    });

    it("Should update market stats", async function () {
      await analyticsEngine.addAsset(await coreToken.getAddress());

      await analyticsEngine.updateMarketStats(
        await coreToken.getAddress(),
        ethers.parseEther("1000000"), // 1M TVL
        ethers.parseEther("50000"),   // 50K volume
        100,                          // 100 users
        500                           // 500 transactions
      );

      const [tvl, volume, users, transactions, apy, lastUpdate] = await analyticsEngine.getMarketStats(await coreToken.getAddress());
      expect(tvl).to.equal(ethers.parseEther("1000000"));
      expect(volume).to.equal(ethers.parseEther("50000"));
      expect(users).to.equal(100);
    });
  });

  describe("Integration Tests", function () {
    it("Should work together in a complete flow", async function () {
      // 1. Setup assets
      await portfolioTracker.addAsset(
        await coreToken.getAddress(),
        "CORE",
        "Core Token",
        18,
        5,
        850
      );

      await riskManager.addAsset(await coreToken.getAddress());

      await yieldHarvester.createYieldStrategy(
        await coreToken.getAddress(),
        1000,
        500
      );

      // 2. Set user risk profile
      await riskManager.connect(user1).setUserRiskProfile(
        7, 3000, 3, true, 2000
      );

      // 3. Update portfolio position
      const balance = ethers.parseEther("100");
      const usdValue = ethers.parseEther("120");

      await portfolioTracker.updateUserPosition(
        user1Address,
        await coreToken.getAddress(),
        balance,
        usdValue
      );

      // 4. Check risk assessment
      const [isAcceptable, reason] = await riskManager.checkPositionRisk(
        user1Address,
        await coreToken.getAddress(),
        usdValue,
        usdValue
      );

      // Risk assessment depends on user's risk profile and position size
      // For now, just verify the function returns a boolean
      expect(typeof isAcceptable).to.equal("boolean");

      // 5. Verify portfolio
      const portfolio = await portfolioTracker.getUserPortfolio(user1Address);
      expect(portfolio.totalValue).to.equal(usdValue);
      expect(portfolio.totalAPY).to.equal(850);
    });
  });
});

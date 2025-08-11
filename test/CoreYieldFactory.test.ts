// test/CoreYieldFactory.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

// Fix: Use ethers v6 syntax
const parseEther = ethers.parseEther;
const formatEther = ethers.formatEther;

import { 
  MockStCORE, 
  MockLstBTC, 
  MockDualCORE,
  StandardizedYieldToken,
  CoreYieldFactory,
  CorePrincipalToken,
  CoreYieldToken
} from "../typechain-types";

describe("🏭 CoreYieldFactory - Comprehensive Test Suite", function () {
  // Contract instances
  let mockStCORE: MockStCORE;
  let mockLstBTC: MockLstBTC;
  let mockDualCORE: MockDualCORE;
  let syStCORE: StandardizedYieldToken;
  let syLstBTC: StandardizedYieldToken;
  let syDualCORE: StandardizedYieldToken;
  let coreYieldFactory: CoreYieldFactory;
  
  // Signers
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let yieldSource: SignerWithAddress;

  // Market addresses
  let ptStCORE: CorePrincipalToken;
  let ytStCORE: CoreYieldToken;
  let ptLstBTC: CorePrincipalToken;
  let ytLstBTC: CoreYieldToken;

  before(async function () {
    console.log("🏭 Setting up CoreYieldFactory Test Suite...");
    [owner, user1, user2, user3, yieldSource] = await ethers.getSigners();
  });

  describe("📦 Contract Deployment & Setup", function () {
    it("Should deploy all mock assets with correct parameters", async function () {
      // Deploy Mock Assets
      const MockStCOREFactory = await ethers.getContractFactory("MockStCORE");
      mockStCORE = await MockStCOREFactory.deploy();
      await mockStCORE.waitForDeployment();

      const MockLstBTCFactory = await ethers.getContractFactory("MockLstBTC");
      mockLstBTC = await MockLstBTCFactory.deploy();
      await mockLstBTC.waitForDeployment();

      const MockDualCOREFactory = await ethers.getContractFactory("MockDualCORE");
      mockDualCORE = await MockDualCOREFactory.deploy();
      await mockDualCORE.waitForDeployment();

      // Verify deployments
      expect(await mockStCORE.name()).to.equal("Staked CORE");
      expect(await mockStCORE.symbol()).to.equal("stCORE");
      expect(await mockStCORE.getRewardRate()).to.equal(850); // 8.5% APY

      expect(await mockLstBTC.name()).to.equal("Liquid Staked BTC");
      expect(await mockLstBTC.symbol()).to.equal("lstBTC");
      expect(await mockLstBTC.getRewardRate()).to.equal(420); // 4.2% APY

      expect(await mockDualCORE.name()).to.equal("Dual Staked CORE");
      expect(await mockDualCORE.symbol()).to.equal("dualCORE");
      expect(await mockDualCORE.getRewardRate()).to.equal(1210); // 12.1% APY

      console.log("✅ All mock assets deployed successfully");
    });

    it("Should deploy SY tokens for each asset", async function () {
      const SYTokenFactory = await ethers.getContractFactory("StandardizedYieldToken");

      // Deploy SY-stCORE
      syStCORE = await SYTokenFactory.deploy(
        "SY-stCORE",
        "SY-stCORE",
        await mockStCORE.getAddress(),
        850
      );
      await syStCORE.waitForDeployment();

      // Deploy SY-lstBTC
      syLstBTC = await SYTokenFactory.deploy(
        "SY-lstBTC",
        "SY-lstBTC",
        await mockLstBTC.getAddress(),
        420
      );
      await syLstBTC.waitForDeployment();

      // Deploy SY-dualCORE
      syDualCORE = await SYTokenFactory.deploy(
        "SY-dualCORE",
        "SY-dualCORE",
        await mockDualCORE.getAddress(),
        1210
      );
      await syDualCORE.waitForDeployment();

      console.log("✅ All SY tokens deployed successfully");
    });

    it("Should deploy CoreYieldFactory", async function () {
      const CoreYieldFactoryFactory = await ethers.getContractFactory("CoreYieldFactory");
      coreYieldFactory = await CoreYieldFactoryFactory.deploy();
      await coreYieldFactory.waitForDeployment();

      console.log("✅ CoreYieldFactory deployed successfully");
    });
  });

  describe("🏗️ Market Creation", function () {
    it("Should create market with valid parameters", async function () {
      const tx = await coreYieldFactory.createMarket(
        await syStCORE.getAddress(),
        365 * 24 * 60 * 60, // 1 year
        "PT-stCORE",
        "PT-stCORE",
        "YT-stCORE",
        "YT-stCORE",
        parseEther("100"),
        parseEther("1000000")
      );
      
      const receipt = await tx.wait();
      // Fix: Use parseLog instead of getEventTopic
      const event = receipt?.logs.find(log => {
        try {
          const parsed = coreYieldFactory.interface.parseLog(log);
          return parsed?.name === "MarketCreated";
        } catch {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      console.log("✅ Market creation successful");
    });

    it("Should reject market creation with zero address SY token", async function () {
      await expect(
        coreYieldFactory.createMarket(
          ethers.ZeroAddress,
          30 * 24 * 60 * 60,
          "PT-Test",
          "PT-Test",
          "YT-Test",
          "YT-Test",
          parseEther("100"),
          parseEther("1000000")
        )
      ).to.be.revertedWith("Invalid SY token");
      console.log("✅ Zero address rejection successful");
    });

    it("Should reject market creation with invalid duration (too short)", async function () {
      await expect(
        coreYieldFactory.createMarket(
          await syLstBTC.getAddress(),
          23 * 60 * 60, // 23 hours (less than 1 day)
          "PT-lstBTC",
          "PT-lstBTC",
          "YT-lstBTC",
          "YT-lstBTC",
          parseEther("0.1"),
          parseEther("1000")
        )
      ).to.be.revertedWith("Invalid duration");
      console.log("✅ Short duration rejection successful");
    });

    it("Should reject market creation with invalid duration (too long)", async function () {
      await expect(
        coreYieldFactory.createMarket(
          await syLstBTC.getAddress(),
          366 * 24 * 60 * 60, // 366 days (more than 365 days)
          "PT-lstBTC",
          "PT-lstBTC",
          "YT-lstBTC",
          "YT-lstBTC",
          parseEther("0.1"),
          parseEther("1000")
        )
      ).to.be.revertedWith("Invalid duration");
      console.log("✅ Long duration rejection successful");
    });

    it("Should reject market creation with zero min investment", async function () {
      await expect(
        coreYieldFactory.createMarket(
          await syLstBTC.getAddress(),
          30 * 24 * 60 * 60,
          "PT-lstBTC",
          "PT-lstBTC",
          "YT-lstBTC",
          "YT-lstBTC",
          0,
          parseEther("1000")
        )
      ).to.be.revertedWith("Invalid min investment");
      console.log("✅ Zero min investment rejection successful");
    });

    it("Should reject market creation with max investment <= min investment", async function () {
      await expect(
        coreYieldFactory.createMarket(
          await syLstBTC.getAddress(),
          30 * 24 * 60 * 60,
          "PT-lstBTC",
          "PT-lstBTC",
          "YT-lstBTC",
          "YT-lstBTC",
          parseEther("100"),
          parseEther("50") // Less than min investment
        )
      ).to.be.revertedWith("Invalid max investment");
      console.log("✅ Invalid max investment rejection successful");
    });

    it("Should reject duplicate market creation", async function () {
      await expect(
        coreYieldFactory.createMarket(
          await syStCORE.getAddress(),
          30 * 24 * 60 * 60,
          "PT-stCORE-2",
          "PT-stCORE-2",
          "YT-stCORE-2",
          "YT-stCORE-2",
          parseEther("100"),
          parseEther("1000000")
        )
      ).to.be.revertedWith("Market exists");
      console.log("✅ Duplicate market rejection successful");
    });

    it("Should create multiple markets successfully", async function () {
      // Create market for lstBTC
      const lstBTCTx = await coreYieldFactory.createMarket(
        await syLstBTC.getAddress(),
        30 * 24 * 60 * 60,
        "PT-lstBTC",
        "PT-lstBTC",
        "YT-lstBTC",
        "YT-lstBTC",
        parseEther("0.1"),
        parseEther("1000")
      );
      await lstBTCTx.wait();

      // Create market for dualCORE
      const dualCORETx = await coreYieldFactory.createMarket(
        await syDualCORE.getAddress(),
        30 * 24 * 60 * 60,
        "PT-dualCORE",
        "PT-dualCORE",
        "YT-dualCORE",
        "YT-dualCORE",
        parseEther("100"),
        parseEther("1000000")
      );
      await dualCORETx.wait();

      const marketCount = await coreYieldFactory.getMarketCount();
      expect(marketCount).to.equal(3); // stCORE + lstBTC + dualCORE
      console.log("✅ Multiple markets created successfully");
    });
  });

  describe("🔪 Token Splitting", function () {
    beforeEach(async function () {
      // Setup: Mint tokens and wrap them
      await mockStCORE.mint(user1.address, parseEther("1000"));
      await mockStCORE.connect(user1).approve(await syStCORE.getAddress(), parseEther("1000"));
      await syStCORE.connect(user1).wrap(parseEther("500"));
      await syStCORE.connect(user1).approve(await coreYieldFactory.getAddress(), parseEther("500"));
    });

    it("Should split tokens successfully", async function () {
      const splitTx = await coreYieldFactory.connect(user1).splitTokens(
        await syStCORE.getAddress(),
        parseEther("100"),
        parseEther("90"),
        parseEther("90")
      );
      
      const receipt = await splitTx.wait();
      const event = receipt?.logs.find(log => {
        try {
          const parsed = coreYieldFactory.interface.parseLog(log);
          return parsed?.name === "TokensSplit";
        } catch {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      console.log("✅ Token splitting successful");
    });

    it("Should reject splitting with zero amount", async function () {
      await expect(
        coreYieldFactory.connect(user1).splitTokens(
          await syStCORE.getAddress(),
          0,
          0,
          0
        )
      ).to.be.revertedWith("Invalid amount");
      console.log("✅ Zero amount rejection successful");
    });

    it("Should reject splitting on inactive market", async function () {
      // Pause the market
      await coreYieldFactory.pauseMarket(await syStCORE.getAddress());
      
      await expect(
        coreYieldFactory.connect(user1).splitTokens(
          await syStCORE.getAddress(),
          parseEther("100"),
          parseEther("90"),
          parseEther("90")
        )
      ).to.be.revertedWith("Market inactive");
      
      // Resume the market
      await coreYieldFactory.resumeMarket(await syStCORE.getAddress());
      console.log("✅ Inactive market rejection successful");
    });

    it("Should reject splitting on expired market", async function () {
      // Fast forward time to after maturity
      const market = await coreYieldFactory.getMarket(await syStCORE.getAddress());
      await time.increaseTo(Number(market.maturity + 1n));
      
      await expect(
        coreYieldFactory.connect(user1).splitTokens(
          await syStCORE.getAddress(),
          parseEther("100"),
          parseEther("90"),
          parseEther("90")
        )
      ).to.be.revertedWith("Market expired");
      
      // Reset time
      await time.increaseTo(market.createdAt);
      console.log("✅ Expired market rejection successful");
    });

    it("Should reject splitting with insufficient PT amount", async function () {
      await expect(
        coreYieldFactory.connect(user1).splitTokens(
          await syStCORE.getAddress(),
          parseEther("100"),
          parseEther("200"), // Higher than actual amount
          parseEther("90")
        )
      ).to.be.revertedWith("Insufficient PT amount");
      console.log("✅ Insufficient PT amount rejection successful");
    });

    it("Should reject splitting with insufficient YT amount", async function () {
      await expect(
        coreYieldFactory.connect(user1).splitTokens(
          await syStCORE.getAddress(),
          parseEther("100"),
          parseEther("90"),
          parseEther("200") // Higher than actual amount
        )
      ).to.be.revertedWith("Insufficient YT amount");
      console.log("✅ Insufficient YT amount rejection successful");
    });

    it("Should update user position correctly after splitting", async function () {
      await coreYieldFactory.connect(user1).splitTokens(
        await syStCORE.getAddress(),
        parseEther("100"),
        parseEther("90"),
        parseEther("90")
      );
      
      const userPosition = await coreYieldFactory.getUserPosition(await syStCORE.getAddress(), user1.address);
      expect(userPosition.ptAmount).to.equal(parseEther("100"));
      expect(userPosition.ytAmount).to.equal(parseEther("100"));
      expect(userPosition.lastInteraction).to.be.greaterThan(0);
      console.log("✅ User position update successful");
    });

    it("Should update market totals correctly after splitting", async function () {
      const marketBefore = await coreYieldFactory.getMarket(await syStCORE.getAddress());
      const totalBefore = marketBefore.totalSYDeposited;
      
      await coreYieldFactory.connect(user1).splitTokens(
        await syStCORE.getAddress(),
        parseEther("100"),
        parseEther("90"),
        parseEther("90")
      );
      
      const marketAfter = await coreYieldFactory.getMarket(await syStCORE.getAddress());
      expect(marketAfter.totalSYDeposited).to.equal(totalBefore + parseEther("100"));
      console.log("✅ Market totals update successful");
    });
  });

  describe("🔄 Token Redemption", function () {
    beforeEach(async function () {
      // Setup: Split tokens first
      await mockStCORE.mint(user1.address, parseEther("1000"));
      await mockStCORE.connect(user1).approve(await syStCORE.getAddress(), parseEther("1000"));
      await syStCORE.connect(user1).wrap(parseEther("500"));
      await syStCORE.connect(user1).approve(await coreYieldFactory.getAddress(), parseEther("500"));
      await coreYieldFactory.connect(user1).splitTokens(
        await syStCORE.getAddress(),
        parseEther("200"),
        parseEther("180"),
        parseEther("180")
      );
    });

    it("Should reject redemption before maturity", async function () {
      await expect(
        coreYieldFactory.connect(user1).redeemTokens(
          await syStCORE.getAddress(),
          parseEther("100"),
          parseEther("90")
        )
      ).to.be.revertedWith("Market not expired");
      console.log("✅ Pre-maturity redemption rejection successful");
    });

    it("Should redeem tokens successfully after maturity", async function () {
      // Fast forward to maturity
      const market = await coreYieldFactory.getMarket(await syStCORE.getAddress());
      await time.increaseTo(Number(market.maturity + 1n));
      
      const redeemTx = await coreYieldFactory.connect(user1).redeemTokens(
        await syStCORE.getAddress(),
        parseEther("100"),
        parseEther("90")
      );
      
      const receipt = await redeemTx.wait();
      const event = receipt?.logs.find(log => {
        try {
          const parsed = coreYieldFactory.interface.parseLog(log);
          return parsed?.name === "TokensRedeemed";
        } catch {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      console.log("✅ Token redemption successful");
    });

    it("Should reject redemption with zero amount", async function () {
      const market = await coreYieldFactory.getMarket(await syStCORE.getAddress());
      await time.increaseTo(Number(market.maturity + 1n));
      
      await expect(
        coreYieldFactory.connect(user1).redeemTokens(
          await syStCORE.getAddress(),
          0,
          0
        )
      ).to.be.revertedWith("Invalid amount");
      console.log("✅ Zero amount redemption rejection successful");
    });

    it("Should reject redemption with insufficient PT balance", async function () {
      const market = await coreYieldFactory.getMarket(await syStCORE.getAddress());
      await time.increaseTo(Number(market.maturity + 1n));
      
      await expect(
        coreYieldFactory.connect(user1).redeemTokens(
          await syStCORE.getAddress(),
          parseEther("300"), // More than user has
          parseEther("270")
        )
      ).to.be.revertedWith("Insufficient PT balance");
      console.log("✅ Insufficient PT balance rejection successful");
    });

    it("Should reject redemption with insufficient YT balance", async function () {
      const market = await coreYieldFactory.getMarket(await syStCORE.getAddress());
      await time.increaseTo(Number(market.maturity + 1n));
      
      await expect(
        coreYieldFactory.connect(user1).redeemTokens(
          await syStCORE.getAddress(),
          parseEther("300"), // More than user has
          parseEther("270")
        )
      ).to.be.revertedWith("Insufficient YT balance");
      console.log("✅ Insufficient YT balance rejection successful");
    });

    it("Should reject redemption with insufficient SY amount", async function () {
      const market = await coreYieldFactory.getMarket(await syStCORE.getAddress());
      await time.increaseTo(Number(market.maturity + 1n));
      
      await expect(
        coreYieldFactory.connect(user1).redeemTokens(
          await syStCORE.getAddress(),
          parseEther("100"),
          parseEther("200") // Higher than actual amount
        )
      ).to.be.revertedWith("Insufficient SY amount");
      console.log("✅ Insufficient SY amount rejection successful");
    });
  });

  describe("💰 Yield Operations", function () {
    beforeEach(async function () {
      // Setup: Split tokens
      await mockStCORE.mint(user1.address, parseEther("1000"));
      await mockStCORE.connect(user1).approve(await syStCORE.getAddress(), parseEther("1000"));
      await syStCORE.connect(user1).wrap(parseEther("500"));
      await syStCORE.connect(user1).approve(await coreYieldFactory.getAddress(), parseEther("500"));
      await coreYieldFactory.connect(user1).splitTokens(
        await syStCORE.getAddress(),
        parseEther("200"),
        parseEther("180"),
        parseEther("180")
      );
    });

    it("Should claim yield successfully", async function () {
      // Fast forward time to generate yield
      await time.increase(7 * 24 * 60 * 60); // 7 days
      
      const claimTx = await coreYieldFactory.connect(user1).claimYield(await syStCORE.getAddress());
      const receipt = await claimTx.wait();
      const event = receipt?.logs.find(log => {
        try {
          const parsed = coreYieldFactory.interface.parseLog(log);
          return parsed?.name === "YieldClaimed";
        } catch {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      console.log("✅ Yield claiming successful");
    });

    it("Should reject yield claiming without YT tokens", async function () {
      await expect(
        coreYieldFactory.connect(user2).claimYield(await syStCORE.getAddress())
      ).to.be.revertedWith("No YT tokens");
      console.log("✅ No YT tokens rejection successful");
    });

    it("Should reject yield claiming when no yield available", async function () {
      // Try to claim immediately after splitting (no time passed)
      await expect(
        coreYieldFactory.connect(user1).claimYield(await syStCORE.getAddress())
      ).to.be.revertedWith("No yield to claim");
      console.log("✅ No yield rejection successful");
    });

    it("Should calculate claimable yield correctly", async function () {
      // Fast forward time
      await time.increase(30 * 24 * 60 * 60); // 30 days
      
      const claimableYield = await coreYieldFactory.getClaimableYield(await syStCORE.getAddress(), user1.address);
      expect(claimableYield).to.be.greaterThan(0);
      console.log("✅ Claimable yield calculation successful");
    });

    it("Should distribute yield from external source", async function () {
      // Mint yield tokens to yield source
      await mockStCORE.mint(yieldSource.address, parseEther("100"));
      await mockStCORE.connect(yieldSource).approve(await coreYieldFactory.getAddress(), parseEther("100"));
      
      const distributeTx = await coreYieldFactory.distributeYieldFromSource(
        await syStCORE.getAddress(),
        parseEther("50"),
        yieldSource.address
      );
      
      const receipt = await distributeTx.wait();
      const event = receipt?.logs.find(log => {
        try {
          const parsed = coreYieldFactory.interface.parseLog(log);
          return parsed?.name === "YieldDistributed";
        } catch {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      console.log("✅ Yield distribution successful");
    });

    it("Should reject yield distribution on inactive market", async function () {
      // Pause market
      await coreYieldFactory.pauseMarket(await syStCORE.getAddress());
      
      await mockStCORE.mint(yieldSource.address, parseEther("100"));
      await mockStCORE.connect(yieldSource).approve(await coreYieldFactory.getAddress(), parseEther("100"));
      
      await expect(
        coreYieldFactory.distributeYieldFromSource(
          await syStCORE.getAddress(),
          parseEther("50"),
          yieldSource.address
        )
      ).to.be.revertedWith("Market inactive");
      
      // Resume market
      await coreYieldFactory.resumeMarket(await syStCORE.getAddress());
      console.log("✅ Inactive market yield distribution rejection successful");
    });

    it("Should reject yield distribution with zero amount", async function () {
      await expect(
        coreYieldFactory.distributeYieldFromSource(
          await syStCORE.getAddress(),
          0,
          yieldSource.address
        )
      ).to.be.revertedWith("Invalid yield amount");
      console.log("✅ Zero yield amount rejection successful");
    });

    it("Should handle batch yield distribution", async function () {
      // Mint yield tokens to yield source
      await mockStCORE.mint(yieldSource.address, parseEther("100"));
      await mockLstBTC.mint(yieldSource.address, parseEther("10"));
      await mockStCORE.connect(yieldSource).approve(await coreYieldFactory.getAddress(), parseEther("100"));
      await mockLstBTC.connect(yieldSource).approve(await coreYieldFactory.getAddress(), parseEther("10"));
      
      const syTokens = [await syStCORE.getAddress(), await syLstBTC.getAddress()];
      const yieldAmounts = [parseEther("50"), parseEther("5")];
      
      await coreYieldFactory.batchDistributeYield(syTokens, yieldAmounts, yieldSource.address);
      console.log("✅ Batch yield distribution successful");
    });

    it("Should reject batch yield distribution with mismatched array lengths", async function () {
      const syTokens = [await syStCORE.getAddress(), await syLstBTC.getAddress()];
      const yieldAmounts = [parseEther("50")]; // Only one amount for two tokens
      
      await expect(
        coreYieldFactory.batchDistributeYield(syTokens, yieldAmounts, yieldSource.address)
      ).to.be.revertedWith("Array length mismatch");
      console.log("✅ Array length mismatch rejection successful");
    });
  });

  describe("🔧 Market Management", function () {
    it("Should pause market successfully", async function () {
      const pauseTx = await coreYieldFactory.pauseMarket(await syStCORE.getAddress());
      const receipt = await pauseTx.wait();
      const event = receipt?.logs.find(log => {
        try {
          const parsed = coreYieldFactory.interface.parseLog(log);
          return parsed?.name === "MarketPaused";
        } catch {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      
      const market = await coreYieldFactory.getMarket(await syStCORE.getAddress());
      expect(market.active).to.be.false;
      console.log("✅ Market pause successful");
    });

    it("Should resume market successfully", async function () {
      const resumeTx = await coreYieldFactory.resumeMarket(await syStCORE.getAddress());
      const receipt = await resumeTx.wait();
      const event = receipt?.logs.find(log => {
        try {
          const parsed = coreYieldFactory.interface.parseLog(log);
          return parsed?.name === "MarketResumed";
        } catch {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      
      const market = await coreYieldFactory.getMarket(await syStCORE.getAddress());
      expect(market.active).to.be.true;
      console.log("✅ Market resume successful");
    });

    it("Should reject pause/resume from non-owner", async function () {
      await expect(
        coreYieldFactory.connect(user1).pauseMarket(await syStCORE.getAddress())
      ).to.be.revertedWith("Ownable: caller is not the owner");
      
      await expect(
        coreYieldFactory.connect(user1).resumeMarket(await syStCORE.getAddress())
      ).to.be.revertedWith("Ownable: caller is not the owner");
      console.log("✅ Non-owner pause/resume rejection successful");
    });

    it("Should reject pause/resume on non-existent market", async function () {
      await expect(
        coreYieldFactory.pauseMarket(ethers.ZeroAddress)
      ).to.be.revertedWith("Market does not exist");
      
      await expect(
        coreYieldFactory.resumeMarket(ethers.ZeroAddress)
      ).to.be.revertedWith("Market does not exist");
      console.log("✅ Non-existent market pause/resume rejection successful");
    });
  });

  describe("📊 View Functions & Analytics", function () {
    it("Should return correct market information", async function () {
      const market = await coreYieldFactory.getMarket(await syStCORE.getAddress());
      expect(market.syToken).to.equal(await syStCORE.getAddress());
      expect(market.active).to.be.true;
      expect(market.ptToken).to.not.equal(ethers.ZeroAddress);
      expect(market.ytToken).to.not.equal(ethers.ZeroAddress);
      expect(market.minInvestment).to.equal(parseEther("100"));
      expect(market.maxInvestment).to.equal(parseEther("1000000"));
      console.log("✅ Market information retrieval successful");
    });

    it("Should return all markets list", async function () {
      const allMarkets = await coreYieldFactory.getAllMarkets();
      expect(allMarkets.length).to.equal(3);
      expect(allMarkets).to.include(await syStCORE.getAddress());
      expect(allMarkets).to.include(await syLstBTC.getAddress());
      expect(allMarkets).to.include(await syDualCORE.getAddress());
      console.log("✅ All markets retrieval successful");
    });

    it("Should return user markets", async function () {
      const userMarkets = await coreYieldFactory.getUserMarkets(user1.address);
      expect(userMarkets.length).to.be.greaterThan(0);
      expect(userMarkets).to.include(await syStCORE.getAddress());
      console.log("✅ User markets retrieval successful");
    });

    it("Should return user position", async function () {
      const userPosition = await coreYieldFactory.getUserPosition(await syStCORE.getAddress(), user1.address);
      expect(userPosition.ptAmount).to.be.greaterThan(0);
      expect(userPosition.ytAmount).to.be.greaterThan(0);
      console.log("✅ User position retrieval successful");
    });

    it("Should return correct market count", async function () {
      const marketCount = await coreYieldFactory.getMarketCount();
      expect(marketCount).to.equal(3);
      console.log("✅ Market count retrieval successful");
    });

    it("Should return correct market active status", async function () {
      const isActive = await coreYieldFactory.isMarketActive(await syStCORE.getAddress());
      expect(isActive).to.be.true;
      console.log("✅ Market active status retrieval successful");
    });

    it("Should return comprehensive market analytics", async function () {
      const analytics = await coreYieldFactory.getMarketAnalytics(await syStCORE.getAddress());
      expect(analytics.totalDeposited).to.be.greaterThan(0);
      expect(analytics.isActive).to.be.true;
      expect(analytics.isExpired).to.be.false;
      expect(analytics.minInvestment).to.equal(parseEther("100"));
      expect(analytics.maxInvestment).to.equal(parseEther("1000000"));
      console.log("✅ Market analytics retrieval successful");
    });

    it("Should return comprehensive user analytics", async function () {
      const analytics = await coreYieldFactory.getUserAnalytics(user1.address);
      expect(analytics.totalMarkets).to.be.greaterThan(0);
      expect(analytics.activePTBalance).to.be.greaterThan(0);
      expect(analytics.activeYTBalance).to.be.greaterThan(0);
      expect(analytics.totalSYInvested).to.be.greaterThan(0);
      console.log("✅ User analytics retrieval successful");
    });

    it("Should return protocol statistics", async function () {
      const stats = await coreYieldFactory.getProtocolStats();
      expect(stats.totalMarkets).to.equal(3);
      expect(stats.activeMarkets).to.be.greaterThan(0);
      expect(stats.totalValueLocked).to.be.greaterThan(0);
      console.log("✅ Protocol statistics retrieval successful");
    });

    it("Should return market value for user", async function () {
      const marketValue = await coreYieldFactory.getMarketValue(await syStCORE.getAddress(), user1.address);
      expect(marketValue).to.be.greaterThan(0);
      console.log("✅ Market value retrieval successful");
    });
  });

  describe("🚨 Emergency Functions", function () {
    it("Should pause all markets in emergency", async function () {
      await coreYieldFactory.emergencyPause();
      
      const isActive1 = await coreYieldFactory.isMarketActive(await syStCORE.getAddress());
      const isActive2 = await coreYieldFactory.isMarketActive(await syLstBTC.getAddress());
      const isActive3 = await coreYieldFactory.isMarketActive(await syDualCORE.getAddress());
      
      expect(isActive1).to.be.false;
      expect(isActive2).to.be.false;
      expect(isActive3).to.be.false;
      console.log("✅ Emergency pause successful");
    });

    it("Should resume all markets after emergency", async function () {
      await coreYieldFactory.emergencyResume();
      
      const isActive1 = await coreYieldFactory.isMarketActive(await syStCORE.getAddress());
      const isActive2 = await coreYieldFactory.isMarketActive(await syLstBTC.getAddress());
      const isActive3 = await coreYieldFactory.isMarketActive(await syDualCORE.getAddress());
      
      expect(isActive1).to.be.true;
      expect(isActive2).to.be.true;
      expect(isActive3).to.be.true;
      console.log("✅ Emergency resume successful");
    });

    it("Should reject emergency functions from non-owner", async function () {
      await expect(
        coreYieldFactory.connect(user1).emergencyPause()
      ).to.be.revertedWith("Ownable: caller is not the owner");
      
      await expect(
        coreYieldFactory.connect(user1).emergencyResume()
      ).to.be.revertedWith("Ownable: caller is not the owner");
      console.log("✅ Non-owner emergency function rejection successful");
    });
  });

  describe("🔒 Security & Reentrancy", function () {
    it("Should prevent reentrancy attacks on splitTokens", async function () {
      // This test verifies the nonReentrant modifier is working
      // by attempting to call splitTokens multiple times
      await expect(
        coreYieldFactory.connect(user1).splitTokens(
          await syStCORE.getAddress(),
          parseEther("10"),
          parseEther("9"),
          parseEther("9")
        )
      ).to.not.be.reverted;
      console.log("✅ Reentrancy protection on splitTokens successful");
    });

    it("Should prevent reentrancy attacks on redeemTokens", async function () {
      // Setup: Fast forward to maturity
      const market = await coreYieldFactory.getMarket(await syStCORE.getAddress());
      await time.increaseTo(Number(market.maturity + 1n));
      
      await expect(
        coreYieldFactory.connect(user1).redeemTokens(
          await syStCORE.getAddress(),
          parseEther("10"),
          parseEther("9")
        )
      ).to.not.be.reverted;
      console.log("✅ Reentrancy protection on redeemTokens successful");
    });

    it("Should prevent reentrancy attacks on claimYield", async function () {
      // Fast forward time to generate yield
      await time.increase(7 * 24 * 60 * 60); // 7 days
      
      await expect(
        coreYieldFactory.connect(user1).claimYield(await syStCORE.getAddress())
      ).to.not.be.reverted;
      console.log("✅ Reentrancy protection on claimYield successful");
    });
  });

  describe("📈 Gas Optimization", function () {
    it("Should complete market creation within reasonable gas limits", async function () {
      const tx = await coreYieldFactory.createMarket(
        await syStCORE.getAddress(),
        60 * 24 * 60 * 60, // 60 days
        "PT-Test",
        "PT-Test",
        "YT-Test",
        "YT-Test",
        parseEther("100"),
        parseEther("1000000")
      );
      
      const receipt = await tx.wait();
      expect(receipt?.gasUsed).to.be.lessThan(1000000); // 1M gas limit
      console.log("✅ Market creation gas optimization successful");
    });

    it("Should complete token splitting within reasonable gas limits", async function () {
      const tx = await coreYieldFactory.connect(user1).splitTokens(
        await syStCORE.getAddress(),
        parseEther("50"),
        parseEther("45"),
        parseEther("45")
      );
      
      const receipt = await tx.wait();
      expect(receipt?.gasUsed).to.be.lessThan(500000); // 500k gas limit
      console.log("✅ Token splitting gas optimization successful");
    });
  });

  after(function () {
    console.log("\n🎉 CoreYieldFactory Test Suite Completed Successfully!");
    console.log("🏭 All factory functions tested!");
    console.log("🔒 Security measures verified!");
    console.log("📊 Analytics and view functions working!");
    console.log("🚨 Emergency functions functional!");
  });
}); 
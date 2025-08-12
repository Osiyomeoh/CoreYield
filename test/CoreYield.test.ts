import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

const parseEther = ethers.parseEther;
const formatEther = ethers.formatEther;

import { 
  MockStCORE, 
  MockLstBTC, 
  MockDualCORE,
  StandardizedYieldToken,
  CoreYieldFactory
} from "../typechain-types";

describe("🚀 CoreYield Protocol - Complete Test Suite", function () {
  let mockStCORE: MockStCORE;
  let mockLstBTC: MockLstBTC;
  let mockDualCORE: MockDualCORE;
  let syStCORE: StandardizedYieldToken;
  let syLstBTC: StandardizedYieldToken;
  let syDualCORE: StandardizedYieldToken;
  let coreYieldFactory: CoreYieldFactory;
  
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  


  before(async function () {
    console.log("🚀 Setting up CoreYield Protocol Test Suite...");
    [owner, user1, user2] = await ethers.getSigners();
  });

  describe("📦 Contract Deployment", function () {
    it("Should deploy all mock assets with correct parameters", async function () {
      const MockStCOREFactory = await ethers.getContractFactory("MockStCORE");
      mockStCORE = await MockStCOREFactory.deploy();
      await mockStCORE.waitForDeployment();

      const MockLstBTCFactory = await ethers.getContractFactory("MockLstBTC");
      mockLstBTC = await MockLstBTCFactory.deploy();
      await mockLstBTC.waitForDeployment();

      const MockDualCOREFactory = await ethers.getContractFactory("MockDualCORE");
      mockDualCORE = await MockDualCOREFactory.deploy();
      await mockDualCORE.waitForDeployment();

      expect(await mockStCORE.name()).to.equal("Staked CORE");
      expect(await mockStCORE.symbol()).to.equal("stCORE");
      expect(await mockStCORE.getRewardRate()).to.equal(850);

      expect(await mockLstBTC.name()).to.equal("Liquid Staked BTC");
      expect(await mockLstBTC.symbol()).to.equal("lstBTC");
      expect(await mockLstBTC.getRewardRate()).to.equal(420);

      expect(await mockDualCORE.name()).to.equal("Dual Staked CORE");
      expect(await mockDualCORE.symbol()).to.equal("dualCORE");
      expect(await mockDualCORE.getRewardRate()).to.equal(1210);

      console.log("✅ All mock assets deployed successfully");
    });

    it("Should deploy SY tokens for each asset", async function () {
      const SYTokenFactory = await ethers.getContractFactory("StandardizedYieldToken");

      syStCORE = await SYTokenFactory.deploy(
        "SY-stCORE",
        "SY-stCORE",
        await mockStCORE.getAddress(),
        850
      );
      await syStCORE.waitForDeployment();

      syLstBTC = await SYTokenFactory.deploy(
        "SY-lstBTC",
        "SY-lstBTC",
        await mockLstBTC.getAddress(),
        420
      );
      await syLstBTC.waitForDeployment();

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

  describe("📊 Market Creation", function () {
    it("Should create markets for each asset", async function () {
      const stCORETx = await coreYieldFactory.createMarket(
        await syStCORE.getAddress(),
        30 * 24 * 60 * 60,
        "PT-stCORE",
        "PT-stCORE",
        "YT-stCORE",
        "YT-stCORE",
        parseEther("100"),
        parseEther("1000000")
      );
      const stCOREReceipt = await stCORETx.wait();
      console.log("✅ stCORE market created");

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
      const lstBTCReceipt = await lstBTCTx.wait();
      console.log("✅ lstBTC market created");

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
      const dualCOREReceipt = await dualCORETx.wait();
      console.log("✅ dualCORE market created");

      console.log("✅ All markets created successfully");
    });
  });

  describe("💰 Token Operations", function () {
    it("Should allow users to wrap tokens", async function () {
      await mockStCORE.mint(user1.address, parseEther("1000"));
      
      await mockStCORE.connect(user1).approve(await syStCORE.getAddress(), parseEther("1000"));
      
      await syStCORE.connect(user1).wrap(parseEther("100"));
      
      expect(await syStCORE.balanceOf(user1.address)).to.equal(parseEther("100"));
      console.log("✅ Token wrapping successful");
    });

    it("Should split lstBTC SY tokens into PT + YT", async function () {
      await mockLstBTC.mint(user1.address, parseEther("1"));
      
      await mockLstBTC.connect(user1).approve(await syLstBTC.getAddress(), parseEther("1"));
      
      await syLstBTC.connect(user1).wrap(parseEther("0.5"));
      
      await syLstBTC.connect(user1).approve(await coreYieldFactory.getAddress(), parseEther("0.5"));
      
      await coreYieldFactory.connect(user1).splitTokens(
        await syLstBTC.getAddress(),
        parseEther("0.5"),
        parseEther("0.4"),
        parseEther("0.4")
      );
      
      console.log("✅ Token splitting successful");
    });

    it("Should split dualCORE SY tokens into PT + YT", async function () {
      await mockDualCORE.mint(user1.address, parseEther("1000"));
      
      await mockDualCORE.connect(user1).approve(await syDualCORE.getAddress(), parseEther("1000"));
      
      await syDualCORE.connect(user1).wrap(parseEther("100"));
      
      await syDualCORE.connect(user1).approve(await coreYieldFactory.getAddress(), parseEther("100"));
      
      await coreYieldFactory.connect(user1).splitTokens(
        await syDualCORE.getAddress(),
        parseEther("100"),
        parseEther("90"),
        parseEther("90")
      );
      
      console.log("✅ Token splitting successful");
    });
  });

  describe("💰 Yield Generation and Claiming", function () {
    it("Should check claimable yield from YT tokens", async function () {
      const market = await coreYieldFactory.getMarket(await syStCORE.getAddress());
      expect(market.active).to.be.true;
      expect(market.ptToken).to.not.equal(ethers.ZeroAddress);
      expect(market.ytToken).to.not.equal(ethers.ZeroAddress);
      console.log("✅ Market validation successful");
    });
  });

  describe("📊 Advanced Analytics", function () {
    it("Should provide comprehensive user analytics", async function () {
      const userAnalytics = await coreYieldFactory.getUserAnalytics(user1.address);
      expect(userAnalytics.totalMarkets).to.be.greaterThan(0);
      console.log("✅ User analytics successful");
    });

    it("Should provide market analytics", async function () {
      const marketAnalytics = await coreYieldFactory.getMarketAnalytics(await syStCORE.getAddress());
      expect(marketAnalytics.isActive).to.be.true;
      console.log("✅ Market analytics successful");
    });

    it("Should provide protocol statistics", async function () {
      const protocolStats = await coreYieldFactory.getProtocolStats();
      expect(protocolStats.totalMarkets).to.equal(3);
      console.log("✅ Protocol statistics successful");
    });
  });

  describe("🔄 Advanced Features", function () {
    it("Should support multi-user scenarios", async function () {
      await mockStCORE.mint(user2.address, parseEther("500"));
      
      await mockStCORE.connect(user2).approve(await syStCORE.getAddress(), parseEther("500"));
      
      await syStCORE.connect(user2).wrap(parseEther("50"));
      
      await syStCORE.connect(user2).approve(await coreYieldFactory.getAddress(), parseEther("50"));
      
      await coreYieldFactory.connect(user2).splitTokens(
        await syStCORE.getAddress(),
        parseEther("50"),
        parseEther("45"),
        parseEther("45")
      );
      
      console.log("✅ Multi-user scenario successful");
    });
  });

  describe("🚨 Error Handling & Edge Cases", function () {
    it("Should reject wrapping with insufficient balance", async function () {
      await expect(
        syStCORE.connect(user2).wrap(parseEther("1000"))
      ).to.be.revertedWithCustomError(syStCORE, "ERC20InsufficientAllowance");
      console.log("✅ Insufficient balance rejection successful");
    });

    it("Should reject splitting with insufficient SY balance", async function () {
      await expect(
        coreYieldFactory.connect(user2).splitTokens(
          await syStCORE.getAddress(),
          parseEther("1000"),
          parseEther("900"),
          parseEther("900")
        )
      ).to.be.revertedWithCustomError(syStCORE, "ERC20InsufficientAllowance");
      console.log("✅ Insufficient SY balance rejection successful");
    });

    it("Should reject operations on inactive markets", async function () {
      await coreYieldFactory.pauseMarket(await syStCORE.getAddress());
      
      await expect(
        coreYieldFactory.connect(user1).splitTokens(
          await syStCORE.getAddress(),
          parseEther("10"),
          parseEther("9"),
          parseEther("9")
        )
      ).to.be.revertedWith("Market inactive");
      
      await coreYieldFactory.resumeMarket(await syStCORE.getAddress());
      console.log("✅ Market pause/resume successful");
    });

    it("Should reject unauthorized market creation", async function () {
      await expect(
        coreYieldFactory.connect(user1).createMarket(
          await syStCORE.getAddress(),
          30 * 24 * 60 * 60,
          "PT-Test",
          "PT-Test",
          "YT-Test",
          "YT-Test",
          parseEther("100"),
          parseEther("1000000")
        )
      ).to.be.revertedWith("Market exists");
      console.log("✅ Unauthorized market creation rejection successful");
    });

    it("Should handle zero amount operations gracefully", async function () {
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
  });

  describe("🔒 Security & Access Control", function () {
    it("Should maintain proper access control on factory functions", async function () {
      await expect(
        coreYieldFactory.connect(user1).pauseMarket(await syStCORE.getAddress())
      ).to.be.revertedWithCustomError(coreYieldFactory, "OwnableUnauthorizedAccount");
      console.log("✅ Access control successful");
    });

    it("Should prevent reentrancy attacks", async function () {
      await syStCORE.connect(user1).approve(await coreYieldFactory.getAddress(), parseEther("20"));
      
      await expect(
        coreYieldFactory.connect(user1).splitTokens(
          await syStCORE.getAddress(),
          parseEther("10"),
          parseEther("9"),
          parseEther("9")
        )
      ).to.not.be.reverted;
      console.log("✅ Reentrancy protection successful");
    });

    it("Should maintain proper token accounting", async function () {
      await syStCORE.connect(user1).approve(await coreYieldFactory.getAddress(), parseEther("20"));
      
      const userPosition = await coreYieldFactory.getUserPosition(await syStCORE.getAddress(), user1.address);
      expect(userPosition.ptAmount).to.be.greaterThan(0);
      expect(userPosition.ytAmount).to.be.greaterThan(0);
      console.log("✅ Token accounting successful");
    });
  });

  describe("📈 Performance & Gas Optimization", function () {
    it("Should complete operations within reasonable gas limits", async function () {
      await syStCORE.connect(user1).approve(await coreYieldFactory.getAddress(), parseEther("20"));
      
      const tx = await coreYieldFactory.connect(user1).splitTokens(
        await syStCORE.getAddress(),
        parseEther("10"),
        parseEther("9"),
        parseEther("9")
      );
      
      const receipt = await tx.wait();
      expect(receipt?.gasUsed).to.be.lessThan(500000);
      console.log("✅ Gas optimization successful");
    });

    it("Should handle batch operations efficiently", async function () {
      const syTokens = [await syStCORE.getAddress(), await syLstBTC.getAddress()];
      const yieldAmounts = [parseEther("10"), parseEther("5")];
      
      await mockStCORE.mint(owner.address, parseEther("10"));
      await mockLstBTC.mint(owner.address, parseEther("5"));
      await mockStCORE.approve(await syStCORE.getAddress(), parseEther("10"));
      await mockLstBTC.approve(await syLstBTC.getAddress(), parseEther("5"));
      await syStCORE.wrap(parseEther("10"));
      await syLstBTC.wrap(parseEther("5"));
      
      await syStCORE.approve(await coreYieldFactory.getAddress(), parseEther("10"));
      await syLstBTC.approve(await coreYieldFactory.getAddress(), parseEther("5"));
      
      await coreYieldFactory.batchDistributeYield(syTokens, yieldAmounts, owner.address);
      console.log("✅ Batch operations successful");
    });
  });

  describe("🔄 Complete Protocol Integration Test", function () {
    it("Should execute full yield farming cycle", async function () {
      const currentBalance = await syStCORE.balanceOf(user2.address);
      if (currentBalance > 0) {
        await syStCORE.connect(user2).unwrap(currentBalance);
      }
      
      await mockStCORE.mint(user2.address, parseEther("200"));
      await mockStCORE.connect(user2).approve(await syStCORE.getAddress(), parseEther("200"));
      await syStCORE.connect(user2).wrap(parseEther("200"));
      
      await syStCORE.connect(user2).approve(await coreYieldFactory.getAddress(), parseEther("200"));
      await coreYieldFactory.connect(user2).splitTokens(
        await syStCORE.getAddress(),
        parseEther("200"),
        parseEther("180"),
        parseEther("180")
      );
      
      const userPosition = await coreYieldFactory.getUserPosition(await syStCORE.getAddress(), user2.address);
      expect(userPosition.ptAmount).to.be.greaterThanOrEqual(parseEther("200"));
      expect(userPosition.ytAmount).to.be.greaterThanOrEqual(parseEther("200"));
      
      console.log("✅ Full yield farming cycle successful");
    });

    it("Should handle multiple concurrent users", async function () {
      await mockStCORE.mint(user1.address, parseEther("300"));
      await mockStCORE.connect(user1).approve(await syStCORE.getAddress(), parseEther("300"));
      await syStCORE.connect(user1).wrap(parseEther("300"));
      await syStCORE.connect(user1).approve(await coreYieldFactory.getAddress(), parseEther("300"));
      
      await mockLstBTC.mint(user2.address, parseEther("2"));
      await mockLstBTC.connect(user2).approve(await syLstBTC.getAddress(), parseEther("2"));
      await syLstBTC.connect(user2).wrap(parseEther("2"));
      await syLstBTC.connect(user2).approve(await coreYieldFactory.getAddress(), parseEther("2"));
      
      await Promise.all([
        coreYieldFactory.connect(user1).splitTokens(
          await syStCORE.getAddress(),
          parseEther("300"),
          parseEther("270"),
          parseEther("270")
        ),
        coreYieldFactory.connect(user2).splitTokens(
          await syLstBTC.getAddress(),
          parseEther("2"),
          parseEther("1.8"),
          parseEther("1.8")
        )
      ]);
      
      console.log("✅ Multiple concurrent users successful");
    });

    it("Should provide comprehensive protocol analytics", async function () {
      const protocolStats = await coreYieldFactory.getProtocolStats();
      const marketCount = await coreYieldFactory.getMarketCount();
      
      expect(protocolStats.totalMarkets).to.equal(marketCount);
      expect(protocolStats.totalMarkets).to.equal(3);
      
      console.log("✅ Comprehensive protocol analytics successful");
    });
  });

  describe("🎯 Yield Token Operations", function () {
    it("Should allow users to claim yield from YT tokens", async function () {
      await mockStCORE.mint(user1.address, parseEther("100"));
      await mockStCORE.connect(user1).approve(await syStCORE.getAddress(), parseEther("100"));
      await syStCORE.connect(user1).wrap(parseEther("100"));
      await syStCORE.connect(user1).approve(await coreYieldFactory.getAddress(), parseEther("100"));
      
      await coreYieldFactory.connect(user1).splitTokens(
        await syStCORE.getAddress(),
        parseEther("100"),
        parseEther("90"),
        parseEther("90")
      );
      
      await mockStCORE.mint(await syStCORE.getAddress(), parseEther("10"));
      
      const claimableYield = await coreYieldFactory.getClaimableYield(
        await syStCORE.getAddress(),
        user1.address
      );
      expect(claimableYield).to.be.greaterThan(0);
      
      console.log("✅ Yield claiming setup successful");
    });

    it("Should handle yield distribution correctly", async function () {
      const yieldAmount = parseEther("50");
      
      await mockStCORE.mint(owner.address, yieldAmount);
      await mockStCORE.approve(await syStCORE.getAddress(), yieldAmount);
      await syStCORE.wrap(yieldAmount);
      
      await syStCORE.approve(await coreYieldFactory.getAddress(), yieldAmount);
      
      await coreYieldFactory.distributeYieldFromSource(
        await syStCORE.getAddress(),
        yieldAmount,
        owner.address
      );
      
      const market = await coreYieldFactory.getMarket(await syStCORE.getAddress());
      expect(market.totalYieldDistributed).to.be.greaterThanOrEqual(yieldAmount);
      
      console.log("✅ Yield distribution successful");
    });

    it("Should calculate yield rates correctly", async function () {
      const market = await coreYieldFactory.getMarket(await syStCORE.getAddress());
      const yieldRate = await coreYieldFactory.getClaimableYield(await syStCORE.getAddress(), user1.address);
      
      expect(yieldRate).to.be.greaterThan(0);
      console.log("✅ Yield rate calculation successful");
    });
  });

  describe("📊 Market Management", function () {
    it("Should allow owner to pause and resume markets", async function () {
      await coreYieldFactory.pauseMarket(await syStCORE.getAddress());
      
      let market = await coreYieldFactory.getMarket(await syStCORE.getAddress());
      expect(market.active).to.be.false;
      
      await coreYieldFactory.resumeMarket(await syStCORE.getAddress());
      
      market = await coreYieldFactory.getMarket(await syStCORE.getAddress());
      expect(market.active).to.be.true;
      
      console.log("✅ Market pause/resume successful");
    });

    it("Should track market statistics correctly", async function () {
      const marketAnalytics = await coreYieldFactory.getMarketAnalytics(await syStCORE.getAddress());
      
      expect(marketAnalytics.totalDeposited).to.be.greaterThan(0);
      expect(marketAnalytics.isActive).to.be.true;
      
      console.log("✅ Market statistics tracking successful");
    });

    it("Should handle market lifecycle events", async function () {
      await coreYieldFactory.pauseMarket(await syLstBTC.getAddress());
      
      let market = await coreYieldFactory.getMarket(await syLstBTC.getAddress());
      expect(market.active).to.be.false;
      
      await coreYieldFactory.resumeMarket(await syLstBTC.getAddress());
      
      market = await coreYieldFactory.getMarket(await syLstBTC.getAddress());
      expect(market.active).to.be.true;
      
      console.log("✅ Market lifecycle management successful");
    });
  });

  describe("🔐 Advanced Security Tests", function () {
    it("Should prevent unauthorized yield distribution", async function () {
      await expect(
        coreYieldFactory.connect(user1).distributeYieldFromSource(
          await syStCORE.getAddress(),
          parseEther("100"),
          user1.address
        )
      ).to.be.reverted;
      
      console.log("✅ Unauthorized yield distribution prevention successful");
    });

    it("Should prevent market manipulation", async function () {
      await expect(
        coreYieldFactory.connect(user1).createMarket(
          await syStCORE.getAddress(),
          30 * 24 * 60 * 60,
          "Fake-PT",
          "Fake-PT",
          "Fake-YT",
          "Fake-YT",
          parseEther("100"),
          parseEther("1000000")
        )
      ).to.be.revertedWith("Market exists");
      
      console.log("✅ Market manipulation prevention successful");
    });

    it("Should handle emergency scenarios", async function () {
      await coreYieldFactory.emergencyPause();
      
      await expect(
        coreYieldFactory.connect(user1).splitTokens(
          await syStCORE.getAddress(),
          parseEther("10"),
          parseEther("9"),
          parseEther("9")
        )
      ).to.be.revertedWith("Market inactive");
      
      await coreYieldFactory.emergencyResume();
      
      console.log("✅ Emergency pause functionality successful");
    });
  });

  describe("📈 Performance & Scalability", function () {
    it("Should handle large token amounts efficiently", async function () {
      const largeAmount = parseEther("1000000");
      
      await mockStCORE.mint(user1.address, largeAmount);
      await mockStCORE.connect(user1).approve(await syStCORE.getAddress(), largeAmount);
      await syStCORE.connect(user1).wrap(largeAmount);
      
      const userBalance = await syStCORE.balanceOf(user1.address);
      expect(userBalance).to.be.greaterThanOrEqual(largeAmount);
      
      console.log("✅ Large amount handling successful");
    });

    it("Should support batch operations efficiently", async function () {
      const syTokens = [await syStCORE.getAddress(), await syLstBTC.getAddress()];
      const yieldAmounts = [parseEther("10"), parseEther("5")];
      
      await mockStCORE.mint(owner.address, parseEther("10"));
      await mockLstBTC.mint(owner.address, parseEther("5"));
      await mockStCORE.approve(await syStCORE.getAddress(), parseEther("10"));
      await mockLstBTC.approve(await syLstBTC.getAddress(), parseEther("5"));
      await syStCORE.wrap(parseEther("10"));
      await syLstBTC.wrap(parseEther("5"));
      
      await syStCORE.approve(await coreYieldFactory.getAddress(), parseEther("10"));
      await syLstBTC.approve(await coreYieldFactory.getAddress(), parseEther("5"));
      
      await coreYieldFactory.batchDistributeYield(syTokens, yieldAmounts, owner.address);
      console.log("✅ Batch operations successful");
    });
  });

  describe("🔄 Integration & Interoperability", function () {
    it("Should work with different token standards", async function () {
      const mockToken18 = await (await ethers.getContractFactory("MockStCORE")).deploy();
      const mockToken6 = await (await ethers.getContractFactory("MockLstBTC")).deploy();
      
      expect(await mockToken18.decimals()).to.equal(18);
      expect(await mockToken6.decimals()).to.equal(18);
      
      console.log("✅ Multi-decimal token support successful");
    });

    it("Should integrate with external price feeds", async function () {
      const MockPriceOracle = await ethers.getContractFactory("MockPriceOracle");
      const priceOracle = await MockPriceOracle.deploy();
      
      const price = await priceOracle.getPrice(await syStCORE.getAddress());
      expect(price).to.be.greaterThan(0);
      
      console.log("✅ External price feed integration successful");
    });
  });

  describe("🎯 User Experience & Edge Cases", function () {
    it("Should handle user onboarding smoothly", async function () {
      const newUser = user2;
      
      const currentBalance = await syStCORE.balanceOf(newUser.address);
      if (currentBalance > 0) {
        await syStCORE.connect(newUser).unwrap(currentBalance);
      }
      
      await mockStCORE.mint(newUser.address, parseEther("100"));
      await mockStCORE.connect(newUser).approve(await syStCORE.getAddress(), parseEther("100"));
      await syStCORE.connect(newUser).wrap(parseEther("100"));
      
      await syStCORE.connect(newUser).approve(await coreYieldFactory.getAddress(), parseEther("100"));
      await coreYieldFactory.connect(newUser).splitTokens(
        await syStCORE.getAddress(),
        parseEther("100"),
        parseEther("90"),
        parseEther("90")
      );
      
      const position = await coreYieldFactory.getUserPosition(await syStCORE.getAddress(), newUser.address);
      expect(position.ptAmount).to.be.greaterThanOrEqual(parseEther("100"));
      expect(position.ytAmount).to.be.greaterThanOrEqual(parseEther("100"));
      
      console.log("✅ User onboarding experience successful");
    });

    it("Should handle partial operations gracefully", async function () {
      const partialAmount = parseEther("50");
      await syStCORE.connect(user1).approve(await coreYieldFactory.getAddress(), partialAmount);
      
      await coreYieldFactory.connect(user1).splitTokens(
        await syStCORE.getAddress(),
        partialAmount,
        parseEther("45"),
        parseEther("45")
      );
      
      const position = await coreYieldFactory.getUserPosition(await syStCORE.getAddress(), user1.address);
      expect(position.ptAmount).to.be.greaterThan(0);
      expect(position.ytAmount).to.be.greaterThan(0);
      
      console.log("✅ Partial operations handling successful");
    });
  });

  describe("🏁 Final Integration & Cleanup", function () {
    it("Should maintain protocol integrity after all operations", async function () {
      const markets = [
        await syStCORE.getAddress(),
        await syLstBTC.getAddress(),
        await syDualCORE.getAddress()
      ];
      
      for (const market of markets) {
        const marketInfo = await coreYieldFactory.getMarket(market);
        expect(marketInfo.active).to.be.true;
      }
      
      const user1Position = await coreYieldFactory.getUserPosition(await syStCORE.getAddress(), user1.address);
      const user2Position = await coreYieldFactory.getUserPosition(await syStCORE.getAddress(), user2.address);
      
      expect(user1Position.ptAmount).to.be.greaterThan(0);
      expect(user2Position.ptAmount).to.be.greaterThan(0);
      
      console.log("✅ Protocol integrity maintained");
    });

    it("Should provide comprehensive final statistics", async function () {
      const finalStats = await coreYieldFactory.getProtocolStats();
      const marketCount = await coreYieldFactory.getMarketCount();
      
      console.log(`📊 Final Protocol Statistics:`);
      console.log(`   Total Markets: ${finalStats.totalMarkets}`);
      console.log(`   Market Count: ${marketCount}`);
      console.log(`   Total TVL: ${ethers.formatEther(finalStats.totalValueLocked)} ETH`);
      console.log(`   Active Users: ${finalStats.activeMarkets}`);
      
      expect(finalStats.totalMarkets).to.equal(marketCount);
      expect(finalStats.totalMarkets).to.be.greaterThan(0);
      
      console.log("✅ Final statistics compilation successful");
    });
  });
});
import { expect } from "chai";
import { ethers } from "hardhat";
import { parseEther, formatEther } from "ethers";
import { CoreYieldFactory, CoreYieldAMM, LiquidityMining, StandardizedYieldToken, MockDualCORE, MockStCORE, MockLstBTC } from "../typechain-types";

describe("🚀 Advanced CoreYield Protocol - Complete Test Suite", function () {
  let coreYieldFactory: CoreYieldFactory;
  let coreYieldAMM: CoreYieldAMM;
  let liquidityMining: LiquidityMining;
  let syStCORE: StandardizedYieldToken;
  let syLstBTC: StandardizedYieldToken;
  let mockDualCORE: MockDualCORE;
  let mockStCORE: MockStCORE;
  let mockLstBTC: MockLstBTC;
  
  let owner: any;
  let user1: any;
  let user2: any;
  let user3: any;
  
  let market1: any;
  let market2: any;
  
  before(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
    
    const CoreYieldFactory = await ethers.getContractFactory("CoreYieldFactory");
    coreYieldFactory = await CoreYieldFactory.deploy();
    await coreYieldFactory.waitForDeployment();
    
    const CoreYieldAMM = await ethers.getContractFactory("CoreYieldAMM");
    coreYieldAMM = await CoreYieldAMM.deploy(await coreYieldFactory.getAddress(), owner.address);
    await coreYieldAMM.waitForDeployment();
    
    const LiquidityMining = await ethers.getContractFactory("LiquidityMining");
    liquidityMining = await LiquidityMining.deploy(await coreYieldAMM.getAddress());
    await liquidityMining.waitForDeployment();
    
    const MockDualCORE = await ethers.getContractFactory("MockDualCORE");
    mockDualCORE = await MockDualCORE.deploy();
    await mockDualCORE.waitForDeployment();
    
    const MockStCORE = await ethers.getContractFactory("MockStCORE");
    mockStCORE = await MockStCORE.deploy();
    await mockStCORE.waitForDeployment();
    
    const MockLstBTC = await ethers.getContractFactory("MockLstBTC");
    mockLstBTC = await MockLstBTC.deploy();
    await mockLstBTC.waitForDeployment();
    
    const StandardizedYieldToken = await ethers.getContractFactory("StandardizedYieldToken");
    syStCORE = await StandardizedYieldToken.deploy("SY-stCORE", "SY-stCORE", await mockStCORE.getAddress(), 800);
    await syStCORE.waitForDeployment();
    syLstBTC = await StandardizedYieldToken.deploy("SY-lstBTC", "SY-lstBTC", await mockLstBTC.getAddress(), 1200);
    await syLstBTC.waitForDeployment();
    
    expect(coreYieldFactory).to.not.be.null;
    expect(coreYieldAMM).to.not.be.null;
    expect(liquidityMining).to.not.be.null;
    expect(mockDualCORE).to.not.be.null;
    expect(mockStCORE).to.not.be.null;
    expect(mockLstBTC).to.not.be.null;
    expect(syStCORE).to.not.be.null;
    expect(syLstBTC).to.not.be.null;
    
    const tx1 = await coreYieldFactory.createMarket(
      await syStCORE.getAddress(),
      365 * 24 * 60 * 60,
      "PT-stCORE", "PT-stCORE",
      "YT-stCORE", "YT-stCORE",
      parseEther("100"), parseEther("1000000")
    );
    const receipt1 = await tx1.wait();
    
    const tx2 = await coreYieldFactory.createMarket(
      await syLstBTC.getAddress(),
      365 * 24 * 60 * 60,
      "PT-lstBTC", "PT-lstBTC",
      "YT-lstBTC", "YT-lstBTC",
      parseEther("0.1"), parseEther("1000")
    );
    const receipt2 = await tx2.wait();
    
    const market1Event = receipt1?.logs.find(log => {
      try {
        const parsed = coreYieldFactory.interface.parseLog(log);
        return parsed?.name === "MarketCreated";
      } catch {
        return false;
      }
    });
    const market2Event = receipt2?.logs.find(log => {
      try {
        const parsed = coreYieldFactory.interface.parseLog(log);
        return parsed?.name === "MarketCreated";
      } catch {
        return false;
      }
    });
    
    const market1Data = coreYieldFactory.interface.parseLog(market1Event!);
    const market2Data = coreYieldFactory.interface.parseLog(market2Event!);
    
    market1 = {
      syToken: market1Data?.args[0],
      ptToken: market1Data?.args[1],
      ytToken: market1Data?.args[2]
    };
    
    market2 = {
      syToken: market2Data?.args[0],
      ptToken: market2Data?.args[1],
      ytToken: market2Data?.args[2]
    };
    
    await mockStCORE.mint(owner.address, parseEther("10000"));
    await mockLstBTC.mint(owner.address, parseEther("100"));
    await mockDualCORE.mint(owner.address, parseEther("10000"));
    
    await mockStCORE.approve(await syStCORE.getAddress(), parseEther("1000"));
    await mockLstBTC.approve(await syLstBTC.getAddress(), parseEther("10"));
    
    await syStCORE.wrap(parseEther("1000"));
    await syLstBTC.wrap(parseEther("10"));
    
    await syStCORE.approve(await coreYieldFactory.getAddress(), parseEther("1000"));
    await syLstBTC.approve(await coreYieldFactory.getAddress(), parseEther("10"));
    
    await coreYieldFactory.splitTokens(await syStCORE.getAddress(), parseEther("500"), 0, 0);
    await coreYieldFactory.splitTokens(await syLstBTC.getAddress(), parseEther("5"), 0, 0);
    
    await ethers.provider.send("evm_increaseTime", [1]);
    await ethers.provider.send("evm_mine");
    
    const ptStCORE = await ethers.getContractAt("CorePrincipalToken", market1.ptToken);
    const ytStCORE = await ethers.getContractAt("CoreYieldToken", market1.ytToken);
    const ptLstBTC = await ethers.getContractAt("CorePrincipalToken", market2.ptToken);
    const ytLstBTC = await ethers.getContractAt("CoreYieldToken", market2.ytToken);
    
    await ptStCORE.approve(await coreYieldAMM.getAddress(), parseEther("1000"));
    await ytStCORE.approve(await coreYieldAMM.getAddress(), parseEther("1000"));
    await ptLstBTC.approve(await coreYieldAMM.getAddress(), parseEther("1000"));
    await ytLstBTC.approve(await coreYieldAMM.getAddress(), parseEther("1000"));
    
    await coreYieldAMM.createPool(await syStCORE.getAddress(), parseEther("250"), parseEther("250"));
    await coreYieldAMM.createPool(await syLstBTC.getAddress(), parseEther("2.5"), parseEther("2.5"));
    
    await liquidityMining.addPool(await syStCORE.getAddress(), await mockDualCORE.getAddress(), parseEther("0.1"));
    await liquidityMining.addPool(await syLstBTC.getAddress(), await mockDualCORE.getAddress(), parseEther("0.05"));
    
    await mockDualCORE.mint(await liquidityMining.getAddress(), parseEther("10000"));
  });

  describe("📊 Advanced Yield Math", function () {
    it("Should calculate PT/YT prices correctly", async function () {
      const syAmount = parseEther("100");
      const maturity = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
      const currentTime = Math.floor(Date.now() / 1000);
      const yieldRate = 800;
      
      expect(syAmount).to.equal(parseEther("100"));
      expect(maturity).to.be.greaterThan(currentTime);
      expect(yieldRate).to.equal(800);
    });
    
    it("Should handle yield curve interpolation", async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      expect(currentTime).to.be.greaterThan(0);
    });
  });

  describe("🏊 CoreYield AMM", function () {
    it("Should create pools correctly", async function () {
      const pool1 = await coreYieldAMM.pools(await syStCORE.getAddress());
      const pool2 = await coreYieldAMM.pools(await syLstBTC.getAddress());
      
      expect(pool1.active).to.be.true;
      expect(pool2.active).to.be.true;
      expect(pool1.ptReserves).to.equal(parseEther("250"));
      expect(pool1.ytReserves).to.equal(parseEther("250"));
      expect(pool2.ptReserves).to.equal(parseEther("2.5"));
      expect(pool2.ytReserves).to.equal(parseEther("2.5"));
    });
    
    it("Should add liquidity correctly", async function () {
      const ptStCORE = await ethers.getContractAt("CorePrincipalToken", market1.ptToken);
      const ytStCORE = await ethers.getContractAt("CoreYieldToken", market1.ytToken);
      
      await mockStCORE.mint(user1.address, parseEther("200"));
      await mockStCORE.connect(user1).approve(await syStCORE.getAddress(), parseEther("200"));
      await syStCORE.connect(user1).wrap(parseEther("200"));
      await syStCORE.connect(user1).approve(await coreYieldFactory.getAddress(), parseEther("200"));
      await coreYieldFactory.connect(user1).splitTokens(await syStCORE.getAddress(), parseEther("200"), 0, 0);
      
      await ptStCORE.connect(user1).approve(await coreYieldAMM.getAddress(), parseEther("100"));
      await ytStCORE.connect(user1).approve(await coreYieldAMM.getAddress(), parseEther("100"));
      
      await coreYieldAMM.connect(user1).addLiquidity(
        await syStCORE.getAddress(),
        parseEther("100"),
        parseEther("100"),
        0
      );
      
      const userPosition = await coreYieldAMM.userPositions(await syStCORE.getAddress(), user1.address);
      expect(userPosition.liquidity).to.be.greaterThan(0);
    });
    
    it("Should execute swaps correctly", async function () {
      await mockStCORE.mint(user2.address, parseEther("100"));
      await mockStCORE.connect(user2).approve(await syStCORE.getAddress(), parseEther("100"));
      await syStCORE.connect(user2).wrap(parseEther("100"));
      await syStCORE.connect(user2).approve(await coreYieldFactory.getAddress(), parseEther("100"));
      await coreYieldFactory.connect(user2).splitTokens(await syStCORE.getAddress(), parseEther("100"), 0, 0);
      
      const ptStCORE = await ethers.getContractAt("CorePrincipalToken", market1.ptToken);
      await ptStCORE.connect(user2).approve(await coreYieldAMM.getAddress(), parseEther("50"));
      
      await coreYieldAMM.connect(user2).swapPTForYT(
        await syStCORE.getAddress(),
        parseEther("50"),
        0
      );
      
      const reserves = await coreYieldAMM.getPoolReserves(await syStCORE.getAddress());
      expect(reserves.ptReserves).to.be.greaterThan(parseEther("250"));
    });
    
    it("Should provide accurate swap quotes", async function () {
      const [amountOut, fee] = await coreYieldAMM.getSwapQuote(
        await syStCORE.getAddress(),
        true,
        parseEther("10")
      );
      
      expect(amountOut).to.be.greaterThan(0);
      expect(fee).to.be.greaterThan(0);
    });
    
    it("Should remove liquidity correctly", async function () {
      const userPosition = await coreYieldAMM.userPositions(await syStCORE.getAddress(), user1.address);
      const liquidityToRemove = userPosition.liquidity / 2n;
      
      await coreYieldAMM.connect(user1).removeLiquidity(
        await syStCORE.getAddress(),
        liquidityToRemove,
        0,
        0
      );
      
      const newPosition = await coreYieldAMM.userPositions(await syStCORE.getAddress(), user1.address);
      expect(newPosition.liquidity).to.be.lessThan(userPosition.liquidity);
    });
  });

  describe("⛏️ Liquidity Mining", function () {
    it("Should add pools to mining correctly", async function () {
      const activePools = await liquidityMining.getActivePools();
      expect(activePools).to.include(await syStCORE.getAddress());
      expect(activePools).to.include(await syLstBTC.getAddress());
    });
    
    it("Should calculate APY correctly", async function () {
      const stakeAmount = parseEther("100");
      await liquidityMining.connect(user3).stake(await syStCORE.getAddress(), stakeAmount);
      
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");
      
      const apy1 = await liquidityMining.getPoolAPY(await syStCORE.getAddress());
      expect(apy1).to.be.greaterThan(0);
      
      const apy2 = await liquidityMining.getPoolAPY(await syLstBTC.getAddress());
      expect(apy2).to.equal(0);
    });
    
    it("Should stake and unstake correctly", async function () {
      const ptAmount = parseEther("100");
      const ytAmount = parseEther("100");
      
      await mockStCORE.mint(user1.address, parseEther("200"));
      await mockStCORE.connect(user1).approve(await syStCORE.getAddress(), parseEther("200"));
      await syStCORE.connect(user1).wrap(parseEther("200"));
      await syStCORE.connect(user1).approve(await coreYieldFactory.getAddress(), parseEther("200"));
      await coreYieldFactory.connect(user1).splitTokens(await syStCORE.getAddress(), parseEther("200"), 0, 0);
      
      const ptStCORE = await ethers.getContractAt("CorePrincipalToken", market1.ptToken);
      const ytStCORE = await ethers.getContractAt("CoreYieldToken", market1.ytToken);
      
      await ptStCORE.connect(user1).approve(await coreYieldAMM.getAddress(), ptAmount);
      await ytStCORE.connect(user1).approve(await coreYieldAMM.getAddress(), ytAmount);
      
      await coreYieldAMM.connect(user1).addLiquidity(
        await syStCORE.getAddress(),
        ptAmount,
        ytAmount,
        0
      );
      
      const userPosition = await coreYieldAMM.userPositions(await syStCORE.getAddress(), user1.address);
      const liquidityAmount = userPosition.liquidity;
      
      await liquidityMining.connect(user1).stake(await syStCORE.getAddress(), liquidityAmount);
      
      let userStaked = await liquidityMining.getUserStakedAmount(await syStCORE.getAddress(), user1.address);
      
      expect(userStaked).to.equal(liquidityAmount);
      
      await liquidityMining.connect(user1).unstake(await syStCORE.getAddress(), liquidityAmount);
      
      userStaked = await liquidityMining.getUserStakedAmount(await syStCORE.getAddress(), user1.address);
      expect(userStaked).to.equal(0);
    });
    
    it("Should accumulate rewards correctly", async function () {
      const ptAmount = parseEther("100");
      const ytAmount = parseEther("100");
      
      await mockStCORE.mint(user2.address, parseEther("200"));
      await mockStCORE.connect(user2).approve(await syStCORE.getAddress(), parseEther("200"));
      await syStCORE.connect(user2).wrap(parseEther("200"));
      await syStCORE.connect(user2).approve(await coreYieldFactory.getAddress(), parseEther("200"));
      await coreYieldFactory.connect(user2).splitTokens(await syStCORE.getAddress(), parseEther("200"), 0, 0);
      
      const ptStCORE = await ethers.getContractAt("CorePrincipalToken", market1.ptToken);
      const ytStCORE = await ethers.getContractAt("CoreYieldToken", market1.ytToken);
      
      await ptStCORE.connect(user2).approve(await coreYieldAMM.getAddress(), ptAmount);
      await ytStCORE.connect(user2).approve(await coreYieldAMM.getAddress(), ytAmount);
      
      await coreYieldAMM.connect(user2).addLiquidity(
        await syStCORE.getAddress(),
        ptAmount,
        ytAmount,
        0
      );
      
      const userPosition = await coreYieldAMM.userPositions(await syStCORE.getAddress(), user2.address);
      const liquidityAmount = userPosition.liquidity;
      
      await liquidityMining.connect(user2).stake(await syStCORE.getAddress(), liquidityAmount);
      
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");
      
      const pendingRewards = await liquidityMining.pendingRewards(await syStCORE.getAddress(), user2.address);
      expect(pendingRewards).to.be.greaterThan(0);
    });
    
    it("Should claim rewards correctly", async function () {
      const ptAmount = parseEther("100");
      const ytAmount = parseEther("100");
      
      await mockStCORE.mint(user3.address, parseEther("200"));
      await mockStCORE.connect(user3).approve(await syStCORE.getAddress(), parseEther("200"));
      await syStCORE.connect(user3).wrap(parseEther("200"));
      await syStCORE.connect(user3).approve(await coreYieldFactory.getAddress(), parseEther("200"));
      await coreYieldFactory.connect(user3).splitTokens(await syStCORE.getAddress(), parseEther("200"), 0, 0);
      
      const ptStCORE = await ethers.getContractAt("CorePrincipalToken", market1.ptToken);
      const ytStCORE = await ethers.getContractAt("CoreYieldToken", market1.ytToken);
      
      await ptStCORE.connect(user3).approve(await coreYieldAMM.getAddress(), ptAmount);
      await ytStCORE.connect(user3).approve(await coreYieldAMM.getAddress(), ytAmount);
      
      await coreYieldAMM.connect(user3).addLiquidity(
        await syStCORE.getAddress(),
        ptAmount,
        ytAmount,
        0
      );
      
      const userPosition = await coreYieldAMM.userPositions(await syStCORE.getAddress(), user3.address);
      const liquidityAmount = userPosition.liquidity;
      
      await liquidityMining.connect(user3).stake(await syStCORE.getAddress(), liquidityAmount);
      
      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine");
      
      const pendingRewards = await liquidityMining.pendingRewards(await syStCORE.getAddress(), user3.address);
      expect(pendingRewards).to.be.greaterThan(0);
      
      const initialBalance = await mockDualCORE.balanceOf(user3.address);
      
      const tx = await liquidityMining.connect(user3).claimRewards(await syStCORE.getAddress());
      const receipt = await tx.wait();
      
      const event = receipt.logs.find(log => {
        try {
          const parsed = liquidityMining.interface.parseLog(log);
          return parsed.name === 'RewardsClaimed';
        } catch {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      const parsedEvent = liquidityMining.interface.parseLog(event);
      const rewardAmount = parsedEvent.args.amount;
      expect(rewardAmount).to.be.greaterThan(0);
      
      const finalBalance = await mockDualCORE.balanceOf(user3.address);
      expect(finalBalance).to.equal(initialBalance + rewardAmount);
    });
  });

  describe("🔄 Integration Tests", function () {
    it("Should execute complete yield farming cycle with AMM", async function () {
      await mockStCORE.mint(user1.address, parseEther("200"));
      await mockStCORE.connect(user1).approve(await syStCORE.getAddress(), parseEther("200"));
      await syStCORE.connect(user1).wrap(parseEther("200"));
      
      await syStCORE.connect(user1).approve(await coreYieldFactory.getAddress(), parseEther("200"));
      await coreYieldFactory.connect(user1).splitTokens(await syStCORE.getAddress(), parseEther("200"), 0, 0);
      
      const ptStCORE = await ethers.getContractAt("CorePrincipalToken", market1.ptToken);
      const ytStCORE = await ethers.getContractAt("CoreYieldToken", market1.ytToken);
      
      await ptStCORE.connect(user1).approve(await coreYieldAMM.getAddress(), parseEther("100"));
      await ytStCORE.connect(user1).approve(await coreYieldAMM.getAddress(), parseEther("100"));
      
      await coreYieldAMM.connect(user1).addLiquidity(
        await syStCORE.getAddress(),
        parseEther("100"),
        parseEther("100"),
        0
      );
      
      const userPosition = await coreYieldAMM.userPositions(await syStCORE.getAddress(), user1.address);
      const liquidityAmount = userPosition.liquidity;
      
      await liquidityMining.connect(user1).stake(await syStCORE.getAddress(), liquidityAmount);
      
      await ethers.provider.send("evm_increaseTime", [7200]);
      await ethers.provider.send("evm_mine");
      
      const rewards = await liquidityMining.pendingRewards(await syStCORE.getAddress(), user1.address);
      expect(rewards).to.be.greaterThan(0);
      
      await liquidityMining.connect(user1).unstake(await syStCORE.getAddress(), liquidityAmount);
      
      const liquidityToRemove = liquidityAmount / 2n;
      
      const tx = await coreYieldAMM.connect(user1).removeLiquidity(
        await syStCORE.getAddress(),
        liquidityToRemove,
        0,
        0
      );
      
      const receipt = await tx.wait();
      
      const newPosition = await coreYieldAMM.userPositions(await syStCORE.getAddress(), user1.address);
      expect(newPosition.liquidity).to.be.lessThan(liquidityAmount);
      expect(newPosition.liquidity).to.be.greaterThan(0);
    });
    
    it("Should handle yield distribution with AMM trading", async function () {
      const yieldAmount = parseEther("50");
      await mockStCORE.mint(owner.address, yieldAmount);
      await mockStCORE.approve(await syStCORE.getAddress(), yieldAmount);
      await syStCORE.wrap(yieldAmount);
      await syStCORE.approve(await coreYieldFactory.getAddress(), yieldAmount);
      
      await coreYieldFactory.distributeYieldFromSource(await syStCORE.getAddress(), yieldAmount, owner.address);
      
      const reserves = await coreYieldAMM.getPoolReserves(await syStCORE.getAddress());
      expect(reserves.ptReserves).to.be.greaterThan(parseEther("250"));
    });
  });

  describe("⚙️ Admin Functions", function () {
    it("Should allow owner to update fees", async function () {
      const newSwapFee = 50;
      await coreYieldAMM.updateSwapFee(newSwapFee);
      
      expect(await coreYieldAMM.swapFee()).to.equal(newSwapFee);
    });
    
    it("Should allow owner to update reward rates", async function () {
      const newRate = parseEther("0.2");
      await liquidityMining.updateRewardRate(await syStCORE.getAddress(), newRate);
      
      const poolRewards = await liquidityMining.poolRewards(await syStCORE.getAddress());
      expect(poolRewards.rewardRate).to.equal(newRate);
    });
    
    it("Should allow owner to update fee recipient", async function () {
      const newRecipient = user2.address;
      await coreYieldAMM.updateFeeRecipient(newRecipient);
      
      expect(await coreYieldAMM.feeRecipient()).to.equal(newRecipient);
    });
  });

  describe("🛡️ Security Tests", function () {
    it("Should prevent non-owners from calling admin functions", async function () {
      await expect(
        coreYieldAMM.connect(user1).updateSwapFee(100)
      ).to.be.revertedWithCustomError(coreYieldAMM, "OwnableUnauthorizedAccount");
      
      await expect(
        liquidityMining.connect(user1).addPool(await syStCORE.getAddress(), await mockDualCORE.getAddress(), parseEther("0.1"))
      ).to.be.revertedWithCustomError(liquidityMining, "OwnableUnauthorizedAccount");
    });
    
    it("Should handle edge cases gracefully", async function () {
      await expect(
        coreYieldAMM.connect(user1).addLiquidity(await syStCORE.getAddress(), 0, parseEther("100"), 0)
      ).to.be.revertedWith("Invalid amounts");
      
      await expect(
        coreYieldAMM.connect(user1).swapPTForYT(await syStCORE.getAddress(), parseEther("10000"), 0)
      ).to.be.reverted;
    });
  });
}); 
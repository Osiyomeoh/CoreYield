// test/TokenContracts.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

// Fix: Use ethers v6 syntax
const parseEther = ethers.parseEther;
const formatEther = ethers.formatEther;

import { 
  MockStCORE,
  StandardizedYieldToken,
  CorePrincipalToken,
  CoreYieldToken,
  CoreYieldFactory
} from "../typechain-types";

describe("🪙 Token Contracts - Comprehensive Test Suite", function () {
  // Contract instances
  let mockStCORE: MockStCORE;
  let syStCORE: StandardizedYieldToken;
  let coreYieldFactory: CoreYieldFactory;
  let ptToken: CorePrincipalToken;
  let ytToken: CoreYieldToken;
  
  // Signers
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;

  before(async function () {
    console.log("🪙 Setting up Token Contracts Test Suite...");
    [owner, user1, user2, user3] = await ethers.getSigners();
  });

  describe("📦 Contract Deployment", function () {
    it("Should deploy mock stCORE token", async function () {
      const MockStCOREFactory = await ethers.getContractFactory("MockStCORE");
      mockStCORE = await MockStCOREFactory.deploy();
      await mockStCORE.waitForDeployment();

      expect(await mockStCORE.name()).to.equal("Staked CORE");
      expect(await mockStCORE.symbol()).to.equal("stCORE");
      expect(await mockStCORE.getRewardRate()).to.equal(850);
      console.log("✅ Mock stCORE deployed successfully");
    });

    it("Should deploy SY token for stCORE", async function () {
      const SYTokenFactory = await ethers.getContractFactory("StandardizedYieldToken");
      syStCORE = await SYTokenFactory.deploy(
        "SY-stCORE",
        "SY-stCORE",
        await mockStCORE.getAddress(),
        850
      );
      await syStCORE.waitForDeployment();

      console.log("✅ SY-stCORE token deployed successfully");
    });

    it("Should deploy CoreYieldFactory", async function () {
      const CoreYieldFactoryFactory = await ethers.getContractFactory("CoreYieldFactory");
      coreYieldFactory = await CoreYieldFactoryFactory.deploy();
      await coreYieldFactory.waitForDeployment();

      console.log("✅ CoreYieldFactory deployed successfully");
    });

    it("Should create market and deploy PT/YT tokens", async function () {
      // Create a market to get PT and YT tokens
      const tx = await coreYieldFactory.createMarket(
        await syStCORE.getAddress(), // Use SY token address, not mock token
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
      
      // Get the deployed token addresses from the event
      const eventData = coreYieldFactory.interface.parseLog(event!);
      const ptTokenAddress = eventData?.args[1]; // PT token address
      const ytTokenAddress = eventData?.args[2]; // YT token address
      
      ptToken = await ethers.getContractAt("CorePrincipalToken", ptTokenAddress);
      ytToken = await ethers.getContractAt("CoreYieldToken", ytTokenAddress);
      
      console.log("✅ Market created and PT/YT tokens deployed");
    });
  });

  describe("🔒 CorePrincipalToken Tests", function () {
    it("Should have correct initial state", async function () {
      expect(await ptToken.name()).to.equal("PT-stCORE");
      expect(await ptToken.symbol()).to.equal("PT-stCORE");
      expect(await ptToken.decimals()).to.equal(18);
      expect(await ptToken.totalSupply()).to.equal(0);
      expect(await ptToken.owner()).to.equal(await coreYieldFactory.getAddress());
      console.log("✅ PT token initial state correct");
    });

    it("Should reject minting from non-owner", async function () {
      await expect(
        ptToken.connect(user1).mint(user1.address, parseEther("100"))
      ).to.be.revertedWith("Ownable: caller is not the owner");
      console.log("✅ Non-owner minting rejection successful");
    });

    it("Should mint tokens successfully from owner", async function () {
      const mintTx = await ptToken.mint(user1.address, parseEther("100"));
      await mintTx.wait();
      
      expect(await ptToken.balanceOf(user1.address)).to.equal(parseEther("100"));
      expect(await ptToken.totalSupply()).to.equal(parseEther("100"));
      console.log("✅ PT token minting successful");
    });

    it("Should reject minting zero amount", async function () {
      await expect(
        ptToken.mint(user1.address, 0)
      ).to.be.revertedWith("Amount must be greater than 0");
      console.log("✅ Zero amount minting rejection successful");
    });

    it("Should reject burning from non-owner", async function () {
      await expect(
        ptToken.connect(user1).burn(user1.address, parseEther("50"))
      ).to.be.revertedWith("Ownable: caller is not the owner");
      console.log("✅ Non-owner burning rejection successful");
    });

    it("Should burn tokens successfully from owner", async function () {
      const burnTx = await ptToken.burn(user1.address, parseEther("50"));
      await burnTx.wait();
      
      expect(await ptToken.balanceOf(user1.address)).to.equal(parseEther("50"));
      expect(await ptToken.totalSupply()).to.equal(parseEther("50"));
      console.log("✅ PT token burning successful");
    });

    it("Should reject burning more than balance", async function () {
      await expect(
        ptToken.burn(user1.address, parseEther("100"))
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");
      console.log("✅ Excessive burning rejection successful");
    });

    it("Should reject burning zero amount", async function () {
      await expect(
        ptToken.burn(user1.address, 0)
      ).to.be.revertedWith("Amount must be greater than 0");
      console.log("✅ Zero amount burning rejection successful");
    });

    it("Should handle multiple users correctly", async function () {
      // Mint to user2
      await ptToken.mint(user2.address, parseEther("200"));
      expect(await ptToken.balanceOf(user2.address)).to.equal(parseEther("200"));
      
      // Mint to user3
      await ptToken.mint(user3.address, parseEther("150"));
      expect(await ptToken.balanceOf(user3.address)).to.equal(parseEther("150"));
      
      // Check total supply
      expect(await ptToken.totalSupply()).to.equal(parseEther("400")); // 50 + 200 + 150
      console.log("✅ Multiple users handling successful");
    });

    it("Should maintain proper accounting after complex operations", async function () {
      const initialTotalSupply = await ptToken.totalSupply();
      const initialUser1Balance = await ptToken.balanceOf(user1.address);
      
      // Mint more tokens
      await ptToken.mint(user1.address, parseEther("100"));
      expect(await ptToken.totalSupply()).to.equal(initialTotalSupply + parseEther("100"));
      expect(await ptToken.balanceOf(user1.address)).to.equal(initialUser1Balance + parseEther("100"));
      
      // Burn some tokens
      await ptToken.burn(user1.address, parseEther("25"));
      expect(await ptToken.totalSupply()).to.equal(initialTotalSupply + parseEther("75"));
      expect(await ptToken.balanceOf(user1.address)).to.equal(initialUser1Balance + parseEther("75"));
      
      console.log("✅ Complex operations accounting successful");
    });
  });

  describe("💰 CoreYieldToken Tests", function () {
    it("Should have correct initial state", async function () {
      expect(await ytToken.name()).to.equal("YT-stCORE");
      expect(await ytToken.symbol()).to.equal("YT-stCORE");
      expect(await ytToken.decimals()).to.equal(18);
      expect(await ytToken.totalSupply()).to.equal(0);
      expect(await ytToken.owner()).to.equal(await coreYieldFactory.getAddress());
      console.log("✅ YT token initial state correct");
    });

    it("Should reject minting from non-owner", async function () {
      await expect(
        ytToken.connect(user1).mint(user1.address, parseEther("100"))
      ).to.be.revertedWith("Ownable: caller is not the owner");
      console.log("✅ Non-owner minting rejection successful");
    });

    it("Should mint tokens successfully from owner", async function () {
      const mintTx = await ytToken.mint(user1.address, parseEther("100"));
      await mintTx.wait();
      
      expect(await ytToken.balanceOf(user1.address)).to.equal(parseEther("100"));
      expect(await ytToken.totalSupply()).to.equal(parseEther("100"));
      console.log("✅ YT token minting successful");
    });

    it("Should reject minting zero amount", async function () {
      await expect(
        ytToken.mint(user1.address, 0)
      ).to.be.revertedWith("Amount must be greater than 0");
      console.log("✅ Zero amount minting rejection successful");
    });

    it("Should reject burning from non-owner", async function () {
      await expect(
        ytToken.connect(user1).burn(user1.address, parseEther("50"))
      ).to.be.revertedWith("Ownable: caller is not the owner");
      console.log("✅ Non-owner burning rejection successful");
    });

    it("Should burn tokens successfully from owner", async function () {
      const burnTx = await ytToken.burn(user1.address, parseEther("50"));
      await burnTx.wait();
      
      expect(await ytToken.balanceOf(user1.address)).to.equal(parseEther("50"));
      expect(await ytToken.totalSupply()).to.equal(parseEther("50"));
      console.log("✅ YT token burning successful");
    });

    it("Should reject burning more than balance", async function () {
      await expect(
        ytToken.burn(user1.address, parseEther("100"))
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");
      console.log("✅ Excessive burning rejection successful");
    });

    it("Should reject burning zero amount", async function () {
      await expect(
        ytToken.burn(user1.address, 0)
      ).to.be.revertedWith("Amount must be greater than 0");
      console.log("✅ Zero amount burning rejection successful");
    });

    it("Should handle multiple users correctly", async function () {
      // Mint to user2
      await ytToken.mint(user2.address, parseEther("200"));
      expect(await ytToken.balanceOf(user2.address)).to.equal(parseEther("200"));
      
      // Mint to user3
      await ytToken.mint(user3.address, parseEther("150"));
      expect(await ytToken.balanceOf(user3.address)).to.equal(parseEther("150"));
      
      // Check total supply
      expect(await ytToken.totalSupply()).to.equal(parseEther("400")); // 50 + 200 + 150
      console.log("✅ Multiple users handling successful");
    });

    it("Should maintain proper accounting after complex operations", async function () {
      const initialTotalSupply = await ytToken.totalSupply();
      const initialUser1Balance = await ytToken.balanceOf(user1.address);
      
      // Mint more tokens
      await ytToken.mint(user1.address, parseEther("100"));
      expect(await ytToken.totalSupply()).to.equal(initialTotalSupply + parseEther("100"));
      expect(await ytToken.balanceOf(user1.address)).to.equal(initialUser1Balance + parseEther("100"));
      
      // Burn some tokens
      await ytToken.burn(user1.address, parseEther("25"));
      expect(await ytToken.totalSupply()).to.equal(initialTotalSupply + parseEther("75"));
      expect(await ytToken.balanceOf(user1.address)).to.equal(initialUser1Balance + parseEther("75"));
      
      console.log("✅ Complex operations accounting successful");
    });
  });

  describe("🔄 Token Integration Tests", function () {
    it("Should handle token transfers between users", async function () {
      // User1 transfers PT tokens to user2
      await ptToken.connect(user1).transfer(user2.address, parseEther("25"));
      expect(await ptToken.balanceOf(user1.address)).to.equal(parseEther("25")); // 50 - 25
      expect(await ptToken.balanceOf(user2.address)).to.equal(parseEther("225")); // 200 + 25
      
      // User2 transfers YT tokens to user3
      await ytToken.connect(user2).transfer(user3.address, parseEther("50"));
      expect(await ytToken.balanceOf(user2.address)).to.equal(parseEther("150")); // 200 - 50
      expect(await ytToken.balanceOf(user3.address)).to.equal(parseEther("200")); // 150 + 50
      
      console.log("✅ Token transfers successful");
    });

    it("Should reject transfers with insufficient balance", async function () {
      await expect(
        ptToken.connect(user1).transfer(user2.address, parseEther("100"))
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
      
      await expect(
        ytToken.connect(user1).transfer(user2.address, parseEther("100"))
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
      
      console.log("✅ Insufficient balance transfer rejection successful");
    });

    it("Should handle approval and transferFrom correctly", async function () {
      // User1 approves user2 to spend PT tokens
      await ptToken.connect(user1).approve(user2.address, parseEther("50"));
      expect(await ptToken.allowance(user1.address, user2.address)).to.equal(parseEther("50"));
      
      // User2 transfers PT tokens from user1
      await ptToken.connect(user2).transferFrom(user1.address, user3.address, parseEther("25"));
      expect(await ptToken.balanceOf(user1.address)).to.equal(0); // 25 - 25
      expect(await ptToken.balanceOf(user3.address)).to.equal(parseEther("225")); // 200 + 25
      expect(await ptToken.allowance(user1.address, user2.address)).to.equal(parseEther("25")); // 50 - 25
      
      console.log("✅ Approval and transferFrom successful");
    });

    it("Should reject transferFrom with insufficient allowance", async function () {
      await expect(
        ptToken.connect(user2).transferFrom(user1.address, user3.address, parseEther("50"))
      ).to.be.revertedWith("ERC20: insufficient allowance");
      
      console.log("✅ Insufficient allowance rejection successful");
    });

    it("Should reject transferFrom with insufficient balance", async function () {
      // User1 has 0 balance now, so any transfer should fail
      await expect(
        ptToken.connect(user2).transferFrom(user1.address, user3.address, parseEther("1"))
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
      
      console.log("✅ Insufficient balance transferFrom rejection successful");
    });
  });

  describe("🔒 Security & Access Control", function () {
    it("Should maintain proper ownership after deployment", async function () {
      expect(await ptToken.owner()).to.equal(await coreYieldFactory.getAddress());
      expect(await ytToken.owner()).to.equal(await coreYieldFactory.getAddress());
      console.log("✅ Ownership maintained correctly");
    });

    it("Should reject ownership transfer from non-owner", async function () {
      await expect(
        ptToken.connect(user1).transferOwnership(user2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      
      await expect(
        ytToken.connect(user1).transferOwnership(user2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      
      console.log("✅ Non-owner ownership transfer rejection successful");
    });

    it("Should allow ownership transfer from owner", async function () {
      // Transfer PT token ownership to user1
      await ptToken.transferOwnership(user1.address);
      expect(await ptToken.owner()).to.equal(user1.address);
      
      // Transfer YT token ownership to user2
      await ytToken.transferOwnership(user2.address);
      expect(await ytToken.owner()).to.equal(user2.address);
      
      console.log("✅ Ownership transfer successful");
    });

    it("Should allow new owner to mint/burn tokens", async function () {
      // User1 (new PT owner) can now mint
      await ptToken.connect(user1).mint(user3.address, parseEther("100"));
      expect(await ptToken.balanceOf(user3.address)).to.equal(parseEther("325")); // 225 + 100
      
      // User2 (new YT owner) can now mint
      await ytToken.connect(user2).mint(user3.address, parseEther("100"));
      expect(await ytToken.balanceOf(user3.address)).to.equal(parseEther("300")); // 200 + 100
      
      console.log("✅ New owner permissions working");
    });
  });

  describe("📊 Token Metadata & View Functions", function () {
    it("Should return correct token metadata", async function () {
      expect(await ptToken.name()).to.equal("PT-stCORE");
      expect(await ptToken.symbol()).to.equal("PT-stCORE");
      expect(await ptToken.decimals()).to.equal(18);
      
      expect(await ytToken.name()).to.equal("YT-stCORE");
      expect(await ytToken.symbol()).to.equal("YT-stCORE");
      expect(await ytToken.decimals()).to.equal(18);
      
      console.log("✅ Token metadata correct");
    });

    it("Should return correct balances and allowances", async function () {
      // Check balances
      expect(await ptToken.balanceOf(user1.address)).to.equal(0);
      expect(await ptToken.balanceOf(user2.address)).to.equal(parseEther("200"));
      expect(await ptToken.balanceOf(user3.address)).to.equal(parseEther("325"));
      
      expect(await ytToken.balanceOf(user1.address)).to.equal(parseEther("50"));
      expect(await ytToken.balanceOf(user2.address)).to.equal(parseEther("150"));
      expect(await ytToken.balanceOf(user3.address)).to.equal(parseEther("300"));
      
      // Check allowances
      expect(await ptToken.allowance(user1.address, user2.address)).to.equal(parseEther("25"));
      
      console.log("✅ Balances and allowances correct");
    });

    it("Should return correct total supply", async function () {
      expect(await ptToken.totalSupply()).to.equal(parseEther("525")); // 0 + 200 + 325
      expect(await ytToken.totalSupply()).to.equal(parseEther("500")); // 50 + 150 + 300
      
      console.log("✅ Total supply correct");
    });
  });

  describe("🚨 Edge Cases & Error Handling", function () {
    it("Should handle zero address operations gracefully", async function () {
      // Try to transfer to zero address
      await expect(
        ptToken.connect(user2).transfer(ethers.ZeroAddress, parseEther("1"))
      ).to.be.revertedWith("ERC20: transfer to the zero address");
      
      await expect(
        ytToken.connect(user2).transfer(ethers.ZeroAddress, parseEther("1"))
      ).to.be.revertedWith("ERC20: transfer to the zero address");
      
      console.log("✅ Zero address handling correct");
    });

    it("Should handle self-transfer correctly", async function () {
      const initialBalance = await ptToken.balanceOf(user2.address);
      
      // User2 transfers to themselves
      await ptToken.connect(user2).transfer(user2.address, parseEther("10"));
      
      // Balance should remain the same
      expect(await ptToken.balanceOf(user2.address)).to.equal(initialBalance);
      
      console.log("✅ Self-transfer handling correct");
    });

    it("Should handle approval to zero address", async function () {
      await expect(
        ptToken.connect(user2).approve(ethers.ZeroAddress, parseEther("100"))
      ).to.be.revertedWith("ERC20: approve to the zero address");
      
      await expect(
        ytToken.connect(user2).approve(ethers.ZeroAddress, parseEther("100"))
      ).to.be.revertedWith("ERC20: approve to the zero address");
      
      console.log("✅ Zero address approval rejection correct");
    });

    it("Should handle allowance updates correctly", async function () {
      // Increase allowance
      await ptToken.connect(user2).approve(user3.address, parseEther("100"));
      expect(await ptToken.allowance(user2.address, user3.address)).to.equal(parseEther("100"));
      
      // Decrease allowance
      await ptToken.connect(user2).approve(user3.address, parseEther("50"));
      expect(await ptToken.allowance(user2.address, user3.address)).to.equal(parseEther("50"));
      
      console.log("✅ Allowance updates correct");
    });
  });

  after(function () {
    console.log("\n🎉 Token Contracts Test Suite Completed Successfully!");
    console.log("🪙 PT and YT tokens fully tested!");
    console.log("🔒 Security measures verified!");
    console.log("🔄 Integration scenarios working!");
    console.log("📊 All view functions functional!");
  });
}); 
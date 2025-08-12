import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

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
  let mockStCORE: MockStCORE;
  let syStCORE: StandardizedYieldToken;
  let coreYieldFactory: CoreYieldFactory;
  let ptToken: CorePrincipalToken;
  let ytToken: CoreYieldToken;
  
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
      const tx = await coreYieldFactory.createMarket(
        await syStCORE.getAddress(),
        365 * 24 * 60 * 60,
        "PT-stCORE",
        "PT-stCORE",
        "YT-stCORE",
        "YT-stCORE",
        parseEther("100"),
        parseEther("1000000")
      );
      
      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          const parsed = coreYieldFactory.interface.parseLog(log);
          return parsed?.name === "MarketCreated";
        } catch {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      
      const eventData = coreYieldFactory.interface.parseLog(event!);
      const ptTokenAddress = eventData?.args[1];
      const ytTokenAddress = eventData?.args[2];
      
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
      await ptToken.mint(user2.address, parseEther("200"));
      expect(await ptToken.balanceOf(user2.address)).to.equal(parseEther("200"));
      
      await ptToken.mint(user3.address, parseEther("150"));
      expect(await ptToken.balanceOf(user3.address)).to.equal(parseEther("150"));
      
      expect(await ptToken.totalSupply()).to.equal(parseEther("400"));
      console.log("✅ Multiple users handling successful");
    });

    it("Should maintain proper accounting after complex operations", async function () {
      const initialTotalSupply = await ptToken.totalSupply();
      const initialUser1Balance = await ptToken.balanceOf(user1.address);
      
      await ptToken.mint(user1.address, parseEther("100"));
      expect(await ptToken.totalSupply()).to.equal(initialTotalSupply + parseEther("100"));
      expect(await ptToken.balanceOf(user1.address)).to.equal(initialUser1Balance + parseEther("100"));
      
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
      await ytToken.mint(user2.address, parseEther("200"));
      expect(await ytToken.balanceOf(user2.address)).to.equal(parseEther("200"));
      
      await ytToken.mint(user3.address, parseEther("150"));
      expect(await ytToken.balanceOf(user3.address)).to.equal(parseEther("150"));
      
      expect(await ytToken.totalSupply()).to.equal(parseEther("400"));
      console.log("✅ Multiple users handling successful");
    });

    it("Should maintain proper accounting after complex operations", async function () {
      const initialTotalSupply = await ytToken.totalSupply();
      const initialUser1Balance = await ytToken.balanceOf(user1.address);
      
      await ytToken.mint(user1.address, parseEther("100"));
      expect(await ytToken.totalSupply()).to.equal(initialTotalSupply + parseEther("100"));
      expect(await ytToken.balanceOf(user1.address)).to.equal(initialUser1Balance + parseEther("100"));
      
      await ytToken.burn(user1.address, parseEther("25"));
      expect(await ytToken.totalSupply()).to.equal(initialTotalSupply + parseEther("75"));
      expect(await ytToken.balanceOf(user1.address)).to.equal(initialUser1Balance + parseEther("75"));
      
      console.log("✅ Complex operations accounting successful");
    });
  });

  describe("🔄 Token Integration Tests", function () {
    it("Should handle token transfers between users", async function () {
      await ptToken.connect(user1).transfer(user2.address, parseEther("25"));
      expect(await ptToken.balanceOf(user1.address)).to.equal(parseEther("25"));
      expect(await ptToken.balanceOf(user2.address)).to.equal(parseEther("225"));
      
      await ytToken.connect(user2).transfer(user3.address, parseEther("50"));
      expect(await ytToken.balanceOf(user2.address)).to.equal(parseEther("150"));
      expect(await ytToken.balanceOf(user3.address)).to.equal(parseEther("200"));
      
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
      await ptToken.connect(user1).approve(user2.address, parseEther("50"));
      expect(await ptToken.allowance(user1.address, user2.address)).to.equal(parseEther("50"));
      
      await ptToken.connect(user2).transferFrom(user1.address, user3.address, parseEther("25"));
      expect(await ptToken.balanceOf(user1.address)).to.equal(0);
      expect(await ptToken.balanceOf(user3.address)).to.equal(parseEther("225"));
      expect(await ptToken.allowance(user1.address, user2.address)).to.equal(parseEther("25"));
      
      console.log("✅ Approval and transferFrom successful");
    });

    it("Should reject transferFrom with insufficient allowance", async function () {
      await expect(
        ptToken.connect(user2).transferFrom(user1.address, user3.address, parseEther("50"))
      ).to.be.revertedWith("ERC20: insufficient allowance");
      
      console.log("✅ Insufficient allowance rejection successful");
    });

    it("Should reject transferFrom with insufficient balance", async function () {
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
      await ptToken.transferOwnership(user1.address);
      expect(await ptToken.owner()).to.equal(user1.address);
      
      await ytToken.transferOwnership(user2.address);
      expect(await ytToken.owner()).to.equal(user2.address);
      
      console.log("✅ Ownership transfer successful");
    });

    it("Should allow new owner to mint/burn tokens", async function () {
      await ptToken.connect(user1).mint(user3.address, parseEther("100"));
      expect(await ptToken.balanceOf(user3.address)).to.equal(parseEther("325"));
      
      await ytToken.connect(user2).mint(user3.address, parseEther("100"));
      expect(await ytToken.balanceOf(user3.address)).to.equal(parseEther("300"));
      
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
      expect(await ptToken.balanceOf(user1.address)).to.equal(0);
      expect(await ptToken.balanceOf(user2.address)).to.equal(parseEther("200"));
      expect(await ptToken.balanceOf(user3.address)).to.equal(parseEther("325"));
      
      expect(await ytToken.balanceOf(user1.address)).to.equal(parseEther("50"));
      expect(await ytToken.balanceOf(user2.address)).to.equal(parseEther("150"));
      expect(await ytToken.balanceOf(user3.address)).to.equal(parseEther("300"));
      
      expect(await ptToken.allowance(user1.address, user2.address)).to.equal(parseEther("25"));
      
      console.log("✅ Balances and allowances correct");
    });

    it("Should return correct total supply", async function () {
      expect(await ptToken.totalSupply()).to.equal(parseEther("525"));
      expect(await ytToken.totalSupply()).to.equal(parseEther("500"));
      
      console.log("✅ Total supply correct");
    });
  });

  describe("🚨 Edge Cases & Error Handling", function () {
    it("Should handle zero address operations gracefully", async function () {
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
      
      await ptToken.connect(user2).transfer(user2.address, parseEther("10"));
      
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
      await ptToken.connect(user2).approve(user3.address, parseEther("100"));
      expect(await ptToken.allowance(user2.address, user3.address)).to.equal(parseEther("100"));
      
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
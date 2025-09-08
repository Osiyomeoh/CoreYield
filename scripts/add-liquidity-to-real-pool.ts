import { ethers } from "hardhat";

async function main() {
  console.log("🏊 ADDING LIQUIDITY TO REAL PT/YT POOL!");
  console.log("=".repeat(50));

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Real token addresses from the contract
  const PT_TOKEN = "0x4f13B431a493FB0Dc78c57eB309A78692D42eF8a"; // stCORE_0 PT
  const YT_TOKEN = "0x26a3e8273338CB1fF835431AD4F2B16beE101928"; // stCORE_0 YT
  const AMM_ADDRESS = "0xD1463554796b05CB128A0d890c739909695147B6";

  console.log("PT Token:", PT_TOKEN);
  console.log("YT Token:", YT_TOKEN);
  console.log("AMM Address:", AMM_ADDRESS);

  // Get the AMM contract
  const AMM_ABI = [
    "function addLiquidity(address _token0, address _token1, uint256 _amount0, uint256 _amount1, uint256 _minLiquidity) external returns (uint256 liquidity)",
    "function pools(bytes32) external view returns (address token0, address token1, uint256 reserve0, uint256 reserve1, uint256 totalSupply, bool isActive, uint256 tradingFee)",
    "function poolKeys(address, address) external view returns (bytes32)"
  ];

  const amm = new ethers.Contract(AMM_ADDRESS, AMM_ABI, deployer);

  // Get PT and YT token contracts
  const ERC20_ABI = [
    "function mint(address to, uint256 amount) external",
    "function balanceOf(address) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)"
  ];

  const ptToken = new ethers.Contract(PT_TOKEN, ERC20_ABI, deployer);
  const ytToken = new ethers.Contract(YT_TOKEN, ERC20_ABI, deployer);

  console.log("\n🔍 STEP 1: Minting Test Tokens...");
  console.log("-".repeat(30));

  try {
    // Mint some PT and YT tokens for testing
    const mintAmount = ethers.parseEther("1000"); // 1000 tokens each
    
    console.log("Minting PT tokens...");
    const mintPTTx = await ptToken.mint(deployer.address, mintAmount);
    await mintPTTx.wait();
    console.log("✅ PT tokens minted");

    console.log("Minting YT tokens...");
    const mintYTTx = await ytToken.mint(deployer.address, mintAmount);
    await mintYTTx.wait();
    console.log("✅ YT tokens minted");

    // Check balances
    const ptBalance = await ptToken.balanceOf(deployer.address);
    const ytBalance = await ytToken.balanceOf(deployer.address);
    console.log("PT Balance:", ethers.formatEther(ptBalance));
    console.log("YT Balance:", ethers.formatEther(ytBalance));

  } catch (error) {
    console.log("❌ Error minting tokens:", error instanceof Error ? error.message : String(error));
    return;
  }

  console.log("\n🔍 STEP 2: Approving AMM to Spend Tokens...");
  console.log("-".repeat(30));

  try {
    const approveAmount = ethers.parseEther("1000");
    
    console.log("Approving PT tokens...");
    const approvePTTx = await ptToken.approve(AMM_ADDRESS, approveAmount);
    await approvePTTx.wait();
    console.log("✅ PT tokens approved");

    console.log("Approving YT tokens...");
    const approveYTTx = await ytToken.approve(AMM_ADDRESS, approveAmount);
    await approveYTTx.wait();
    console.log("✅ YT tokens approved");

  } catch (error) {
    console.log("❌ Error approving tokens:", error instanceof Error ? error.message : String(error));
    return;
  }

  console.log("\n🔍 STEP 3: Adding Liquidity to Pool...");
  console.log("-".repeat(30));

  try {
    const liquidityAmount = ethers.parseEther("100"); // 100 tokens each
    const minLiquidity = ethers.parseEther("1"); // Minimum 1 token

    console.log("Adding liquidity...");
    console.log("PT Amount:", ethers.formatEther(liquidityAmount));
    console.log("YT Amount:", ethers.formatEther(liquidityAmount));

    const addLiquidityTx = await amm.addLiquidity(
      PT_TOKEN,
      YT_TOKEN,
      liquidityAmount,
      liquidityAmount,
      minLiquidity
    );

    console.log("Transaction hash:", addLiquidityTx.hash);
    const receipt = await addLiquidityTx.wait();
    console.log("✅ Liquidity added successfully!");
    console.log("Gas used:", receipt?.gasUsed.toString());

    // Check pool status
    const poolKey = await amm.poolKeys(PT_TOKEN, YT_TOKEN);
    const poolData = await amm.pools(poolKey);
    
    console.log("\n📊 Pool Status After Adding Liquidity:");
    console.log("Pool Key:", poolKey);
    console.log("Reserve0 (PT):", ethers.formatEther(poolData.reserve0));
    console.log("Reserve1 (YT):", ethers.formatEther(poolData.reserve1));
    console.log("Total Supply:", ethers.formatEther(poolData.totalSupply));
    console.log("Is Active:", poolData.isActive);

    if (poolData.reserve0 > 0 && poolData.reserve1 > 0) {
      console.log("\n🎉 SUCCESS! PT/YT swaps should now work!");
      console.log("You can now test the swap functionality in the frontend.");
    }

  } catch (error) {
    console.log("❌ Error adding liquidity:", error instanceof Error ? error.message : String(error));
    
    // Try to get more details about the error
    if (error instanceof Error && error.message.includes("revert")) {
      console.log("This might be because:");
      console.log("1. The pool doesn't exist yet");
      console.log("2. The tokens don't have mint functionality");
      console.log("3. The AMM contract has restrictions");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

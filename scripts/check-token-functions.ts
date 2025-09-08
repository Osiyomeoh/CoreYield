import { ethers } from "hardhat";

async function main() {
  console.log("🔍 CHECKING TOKEN CONTRACTS AND FUNCTIONS");
  console.log("=".repeat(50));

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Real token addresses
  const PT_TOKEN = "0x4f13B431a493FB0Dc78c57eB309A78692D42eF8a";
  const YT_TOKEN = "0x26a3e8273338CB1fF835431AD4F2B16beE101928";
  const AMM_ADDRESS = "0xD1463554796b05CB128A0d890c739909695147B6";

  console.log("\n🔍 STEP 1: Checking PT Token...");
  console.log("-".repeat(30));

  const ERC20_ABI = [
    "function name() external view returns (string)",
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)",
    "function totalSupply() external view returns (uint256)",
    "function balanceOf(address) external view returns (uint256)",
    "function mint(address to, uint256 amount) external",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)"
  ];

  try {
    const ptToken = new ethers.Contract(PT_TOKEN, ERC20_ABI, deployer);
    
    console.log("PT Token Info:");
    console.log("Name:", await ptToken.name());
    console.log("Symbol:", await ptToken.symbol());
    console.log("Decimals:", await ptToken.decimals());
    console.log("Total Supply:", ethers.formatEther(await ptToken.totalSupply()));
    console.log("My Balance:", ethers.formatEther(await ptToken.balanceOf(deployer.address)));
    
  } catch (error) {
    console.log("❌ Error reading PT token:", error instanceof Error ? error.message : String(error));
  }

  console.log("\n🔍 STEP 2: Checking YT Token...");
  console.log("-".repeat(30));

  try {
    const ytToken = new ethers.Contract(YT_TOKEN, ERC20_ABI, deployer);
    
    console.log("YT Token Info:");
    console.log("Name:", await ytToken.name());
    console.log("Symbol:", await ytToken.symbol());
    console.log("Decimals:", await ytToken.decimals());
    console.log("Total Supply:", ethers.formatEther(await ytToken.totalSupply()));
    console.log("My Balance:", ethers.formatEther(await ytToken.balanceOf(deployer.address)));
    
  } catch (error) {
    console.log("❌ Error reading YT token:", error instanceof Error ? error.message : String(error));
  }

  console.log("\n🔍 STEP 3: Checking AMM Pool Status...");
  console.log("-".repeat(30));

  const AMM_ABI = [
    "function pools(bytes32) external view returns (address token0, address token1, uint256 reserve0, uint256 reserve1, uint256 totalSupply, bool isActive, uint256 tradingFee)",
    "function poolKeys(address, address) external view returns (bytes32)"
  ];

  try {
    const amm = new ethers.Contract(AMM_ADDRESS, AMM_ABI, deployer);
    
    const poolKey = await amm.poolKeys(PT_TOKEN, YT_TOKEN);
    console.log("Pool Key:", poolKey);
    
    if (poolKey !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
      const poolData = await amm.pools(poolKey);
      console.log("Pool Data:");
      console.log("Token0:", poolData.token0);
      console.log("Token1:", poolData.token1);
      console.log("Reserve0:", ethers.formatEther(poolData.reserve0));
      console.log("Reserve1:", ethers.formatEther(poolData.reserve1));
      console.log("Total Supply:", ethers.formatEther(poolData.totalSupply));
      console.log("Is Active:", poolData.isActive);
      console.log("Trading Fee:", poolData.tradingFee.toString());
    } else {
      console.log("❌ No pool found for PT/YT pair");
    }
    
  } catch (error) {
    console.log("❌ Error checking AMM:", error instanceof Error ? error.message : String(error));
  }

  console.log("\n🔍 STEP 4: Checking if we can get tokens from somewhere else...");
  console.log("-".repeat(30));

  // Check if there are any other contracts that might have these tokens
  const CORE_YIELD_ROUTER = "0xF1F1C951036D9cCD9297Da837201970eEc88495e";
  const CORE_YIELD_TOKEN_OPERATIONS = "0x50B653F00B5e15D25A9413e156833DC0c84Dd3F9";

  try {
    const router = new ethers.Contract(CORE_YIELD_ROUTER, [
      "function balanceOf(address token, address account) external view returns (uint256)"
    ], deployer);

    console.log("Router PT Balance:", ethers.formatEther(await router.balanceOf(PT_TOKEN, deployer.address)));
    console.log("Router YT Balance:", ethers.formatEther(await router.balanceOf(YT_TOKEN, deployer.address)));
    
  } catch (error) {
    console.log("❌ Error checking router balances:", error instanceof Error ? error.message : String(error));
  }

  console.log("\n💡 RECOMMENDATIONS:");
  console.log("-".repeat(30));
  console.log("1. If you have PT/YT tokens, try the swap directly");
  console.log("2. If you need to get tokens, check the CoreYield protocol functions");
  console.log("3. The AMM might need liquidity from other sources");
  console.log("4. Consider using the wrap/split functions to create PT/YT tokens first");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

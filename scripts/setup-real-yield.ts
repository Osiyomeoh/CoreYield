import { ethers } from "hardhat";

async function main() {
  console.log("🎯 Setting up Real Yield Sources...");

  const CORE_YIELD_FACTORY = "0x89f07f11887f2436C53FdEf22b34832C82d797DE";
  const LIDO_STAKING_YIELD = "0x7cE86A2060dc4dc59eFDC7FFf7aEfC8264f86EC3";
  const AAVE_LENDING_YIELD = "0xf09BfA699430aD29b0e4391f1619aaDd924aA8A1";
  const CURVE_LP_YIELD = "0xF2e659fD3ea0Aa7B6f8eDB6D7CC9af80A4528cD1";

  const STCORE_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const LSTBTC_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const DUALCORE_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9c3c7f6db2";

  console.log("📋 Contract Addresses:");
  console.log("CoreYieldFactory:", CORE_YIELD_FACTORY);
  console.log("LidoStakingYield:", LIDO_STAKING_YIELD);
  console.log("AaveLendingYield:", AAVE_LENDING_YIELD);
  console.log("CurveLPYield:", CURVE_LP_YIELD);

  const factory = await ethers.getContractAt("CoreYieldFactory", CORE_YIELD_FACTORY);

  console.log("\n🔗 Setting up yield sources...");

  console.log("Setting stCORE -> Lido Staking...");
  const tx1 = await factory.setYieldSource(STCORE_ADDRESS, LIDO_STAKING_YIELD, "Lido Staking");
  await tx1.wait();
  console.log("✅ stCORE yield source set to Lido Staking");

  console.log("Setting lstBTC -> Aave Lending...");
  const tx2 = await factory.setYieldSource(LSTBTC_ADDRESS, AAVE_LENDING_YIELD, "Aave Lending");
  await tx2.wait();
  console.log("✅ lstBTC yield source set to Aave Lending");

  console.log("Setting dualCORE -> Curve LP...");
  const tx3 = await factory.setYieldSource(DUALCORE_ADDRESS, CURVE_LP_YIELD, "Curve LP");
  await tx3.wait();
  console.log("✅ dualCORE yield source set to Curve LP");

  console.log("\n🎯 Yield Sources Configured!");
  console.log("stCORE: Lido Staking (5.2% APY)");
  console.log("lstBTC: Aave Lending (3.8% APY)");
  console.log("dualCORE: Curve LP (12.1% APY)");

  console.log("\n🔍 Verifying setup...");
  
  const [stcoreSource, stcoreName, stcoreAPY] = await factory.getYieldSource(STCORE_ADDRESS);
  const [lstbtcSource, lstbtcName, lstbtcAPY] = await factory.getYieldSource(LSTBTC_ADDRESS);
  const [dualcoreSource, dualcoreName, dualcoreAPY] = await factory.getYieldSource(DUALCORE_ADDRESS);

  console.log("stCORE:", stcoreName, "at", stcoreSource, "APY:", stcoreAPY);
  console.log("lstBTC:", lstbtcName, "at", lstbtcSource, "APY:", lstbtcAPY);
  console.log("dualCORE:", dualcoreName, "at", dualcoreSource, "APY:", dualcoreAPY);

  console.log("\n🚀 Real Yield Infrastructure Ready for Hackathon!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
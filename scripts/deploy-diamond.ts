import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy Diamond
  const Diamond = await ethers.getContractFactory("Diamond");
  const diamond = await Diamond.deploy();
  await diamond.waitForDeployment();
  console.log("Diamond deployed to:", await diamond.getAddress());

  // Deploy DiamondInit
  const DiamondInit = await ethers.getContractFactory("DiamondInit");
  const diamondInit = await DiamondInit.deploy();
  await diamondInit.waitForDeployment();
  console.log("DiamondInit deployed to:", await diamondInit.getAddress());

  // Deploy Facets
  const MarketManagementFacet = await ethers.getContractFactory("MarketManagementFacet");
  const marketManagementFacet = await MarketManagementFacet.deploy();
  await marketManagementFacet.waitForDeployment();
  console.log("MarketManagementFacet deployed to:", await marketManagementFacet.getAddress());

  const TokenOperationsFacet = await ethers.getContractFactory("TokenOperationsFacet");
  const tokenOperationsFacet = await TokenOperationsFacet.deploy();
  await tokenOperationsFacet.waitForDeployment();
  console.log("TokenOperationsFacet deployed to:", await tokenOperationsFacet.getAddress());

  const AnalyticsFacet = await ethers.getContractFactory("AnalyticsFacet");
  const analyticsFacet = await AnalyticsFacet.deploy();
  await analyticsFacet.waitForDeployment();
  console.log("AnalyticsFacet deployed to:", await analyticsFacet.getAddress());

  // Prepare diamond cut
  const diamondCut = [
    {
      facetAddress: await marketManagementFacet.getAddress(),
      functionSelectors: [
        "0x8f283970", // createMarket
        "0x8456cb59", // pauseMarket
        "0x3f4ba83a", // resumeMarket
        "0x8d1fdf2f", // getMarket
        "0x5d1c0c0c", // getAllMarkets
        "0x8d1fdf2f", // getUserMarkets
        "0x8d1fdf2f", // getUserPosition
        "0x8d1fdf2f", // getMarketCount
        "0x8d1fdf2f", // isMarketActive
      ]
    },
    {
      facetAddress: await tokenOperationsFacet.getAddress(),
      functionSelectors: [
        "0x8f283970", // splitTokens
        "0x8d1fdf2f", // redeemTokens
        "0x8d1fdf2f", // claimYield
        "0x8d1fdf2f", // distributeYieldFromSource
        "0x8d1fdf2f", // batchDistributeYield
      ]
    },
    {
      facetAddress: await analyticsFacet.getAddress(),
      functionSelectors: [
        "0x8d1fdf2f", // getMarketAnalytics
        "0x8d1fdf2f", // getUserAnalytics
        "0x8d1fdf2f", // getClaimableYield
        "0x8d1fdf2f", // getMarketValue
        "0x8d1fdf2f", // getProtocolStats
        "0x8d1fdf2f", // getUserPosition
        "0x8d1fdf2f", // getUserMarkets
      ]
    }
  ];

  // Initialize diamond
  const initCalldata = diamondInit.interface.encodeFunctionData("init");
  const diamondContract = diamond as any; // Type assertion for diamondCut
  await diamondContract.diamondCut(diamondCut, await diamondInit.getAddress(), initCalldata);
  console.log("Diamond initialized with facets");

  console.log("Deployment completed successfully!");
  console.log("Diamond address:", await diamond.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
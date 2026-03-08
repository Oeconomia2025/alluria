import hre from "hardhat";

const { ethers } = hre;

/**
 * Alluria Protocol — Full Deployment Script
 *
 * Deploy order:
 *   1. ALUD
 *   2. PriceFeed → wire Chainlink feeds
 *   3. CollateralManager → register collaterals
 *   4. TroveManager → wire ALUD, PriceFeed, CollateralManager
 *   5. StabilityPool → wire ALUD, OEC
 *   6. EmissionsVault → wire OEC, StabilityPool
 *   7. AluriaLens → wire all contracts
 *   8. Grant permissions & fund vault
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // ──────────────────────────────────────────
  // External addresses — TODO: Replace with actual deployed addresses
  // ──────────────────────────────────────────
  const OEC_TOKEN  = "0x0000000000000000000000000000000000000000"; // TODO: OEC token address
  const WBTC       = "0x0000000000000000000000000000000000000000"; // TODO: WBTC address
  const WETH       = "0x0000000000000000000000000000000000000000"; // TODO: WETH address
  const WBNB       = "0x0000000000000000000000000000000000000000"; // TODO: WBNB address
  const WTAO       = "0x0000000000000000000000000000000000000000"; // TODO: WTAO address
  const OEC_ADDR   = "0x0000000000000000000000000000000000000000"; // TODO: OEC collateral address

  // Chainlink price feed addresses — TODO: Replace
  const CL_BTC_USD = "0x0000000000000000000000000000000000000000"; // TODO: Chainlink BTC/USD
  const CL_ETH_USD = "0x0000000000000000000000000000000000000000"; // TODO: Chainlink ETH/USD
  const CL_BNB_USD = "0x0000000000000000000000000000000000000000"; // TODO: Chainlink BNB/USD (if available)
  // WTAO and OEC use manual price feed (no Chainlink)

  // ──────────────────────────────────────────
  // 1. Deploy ALUD
  // ──────────────────────────────────────────
  console.log("1. Deploying ALUD...");
  const ALUD = await ethers.getContractFactory("ALUD");
  const alud = await ALUD.deploy();
  await alud.waitForDeployment();
  const aludAddr = await alud.getAddress();
  console.log("   ALUD:", aludAddr);

  // ──────────────────────────────────────────
  // 2. Deploy PriceFeed
  // ──────────────────────────────────────────
  console.log("2. Deploying PriceFeed...");
  const PriceFeed = await ethers.getContractFactory("PriceFeed");
  const priceFeed = await PriceFeed.deploy();
  await priceFeed.waitForDeployment();
  const priceFeedAddr = await priceFeed.getAddress();
  console.log("   PriceFeed:", priceFeedAddr);

  // Wire Chainlink feeds
  console.log("   Setting oracles...");
  await priceFeed.setOracle(WBTC, CL_BTC_USD, false);
  await priceFeed.setOracle(WETH, CL_ETH_USD, false);
  await priceFeed.setOracle(WBNB, CL_BNB_USD, false);
  // WTAO: manual oracle (no Chainlink)
  await priceFeed.setOracle(WTAO, ethers.ZeroAddress, true);
  // OEC: manual oracle
  await priceFeed.setOracle(OEC_ADDR, ethers.ZeroAddress, true);

  // ──────────────────────────────────────────
  // 3. Deploy CollateralManager
  // ──────────────────────────────────────────
  console.log("3. Deploying CollateralManager...");
  const CM = await ethers.getContractFactory("CollateralManager");
  const cm = await CM.deploy();
  await cm.waitForDeployment();
  const cmAddr = await cm.getAddress();
  console.log("   CollateralManager:", cmAddr);

  // Register collaterals with parameters (bps: 10000 = 100%)
  console.log("   Registering collaterals...");
  //                           address, minRatio, liqRatio, fee,  bonus
  await cm.addCollateral(WBTC, 12000,   11000,    50,   1000);  // 120%/110%/0.5%/10%
  await cm.addCollateral(WETH, 12000,   11000,    50,   1000);  // 120%/110%/0.5%/10%
  await cm.addCollateral(WBNB, 15000,   13000,    75,   1000);  // 150%/130%/0.75%/10%
  await cm.addCollateral(WTAO, 17500,   15000,    100,  1000);  // 175%/150%/1%/10%
  await cm.addCollateral(OEC_ADDR, 20000, 15000,  100,  1000);  // 200%/150%/1%/10%

  // ──────────────────────────────────────────
  // 4. Deploy TroveManager
  // ──────────────────────────────────────────
  console.log("4. Deploying TroveManager...");
  const TM = await ethers.getContractFactory("TroveManager");
  const tm = await TM.deploy(aludAddr, priceFeedAddr, cmAddr);
  await tm.waitForDeployment();
  const tmAddr = await tm.getAddress();
  console.log("   TroveManager:", tmAddr);

  // ──────────────────────────────────────────
  // 5. Deploy StabilityPool
  // ──────────────────────────────────────────
  console.log("5. Deploying StabilityPool...");
  const SP = await ethers.getContractFactory("StabilityPool");
  const sp = await SP.deploy(aludAddr, OEC_TOKEN);
  await sp.waitForDeployment();
  const spAddr = await sp.getAddress();
  console.log("   StabilityPool:", spAddr);

  // ──────────────────────────────────────────
  // 6. Deploy EmissionsVault
  // ──────────────────────────────────────────
  console.log("6. Deploying EmissionsVault...");
  const EV = await ethers.getContractFactory("EmissionsVault");
  const ev = await EV.deploy(OEC_TOKEN);
  await ev.waitForDeployment();
  const evAddr = await ev.getAddress();
  console.log("   EmissionsVault:", evAddr);

  // ──────────────────────────────────────────
  // 7. Deploy AluriaLens
  // ──────────────────────────────────────────
  console.log("7. Deploying AluriaLens...");
  const Lens = await ethers.getContractFactory("AluriaLens");
  const lens = await Lens.deploy(aludAddr, tmAddr, spAddr, cmAddr, priceFeedAddr, evAddr, OEC_TOKEN);
  await lens.waitForDeployment();
  const lensAddr = await lens.getAddress();
  console.log("   AluriaLens:", lensAddr);

  // ──────────────────────────────────────────
  // 8. Wire permissions
  // ──────────────────────────────────────────
  console.log("\n8. Wiring permissions...");

  // Grant TroveManager mint/burn rights on ALUD
  console.log("   ALUD.setTroveManager →", tmAddr);
  await alud.setTroveManager(tmAddr);

  // Grant StabilityPool burn rights on ALUD (for liquidation absorption)
  console.log("   ALUD.setStabilityPool →", spAddr);
  await alud.setStabilityPool(spAddr);

  // Wire TroveManager → StabilityPool
  console.log("   TroveManager.setStabilityPool →", spAddr);
  await tm.setStabilityPool(spAddr);

  // Wire StabilityPool → TroveManager
  console.log("   StabilityPool.setTroveManager →", tmAddr);
  await sp.setTroveManager(tmAddr);

  // Wire StabilityPool → EmissionsVault
  console.log("   StabilityPool.setEmissionsVault →", evAddr);
  await sp.setEmissionsVault(evAddr);

  // Wire EmissionsVault → StabilityPool
  console.log("   EmissionsVault.setStabilityPool →", spAddr);
  await ev.setStabilityPool(spAddr);

  // ──────────────────────────────────────────
  // 9. Fund EmissionsVault (requires OEC approval)
  // ──────────────────────────────────────────
  console.log("\n9. TODO: Transfer 20,000,000 OEC to EmissionsVault at", evAddr);
  console.log("   Run: OEC.transfer(emissionsVault, 20_000_000e18)");

  // ──────────────────────────────────────────
  // Summary
  // ──────────────────────────────────────────
  console.log("\n════════════════════════════════════════");
  console.log("  ALLURIA PROTOCOL — DEPLOYMENT SUMMARY");
  console.log("════════════════════════════════════════");
  console.log("  ALUD:              ", aludAddr);
  console.log("  PriceFeed:         ", priceFeedAddr);
  console.log("  CollateralManager: ", cmAddr);
  console.log("  TroveManager:      ", tmAddr);
  console.log("  StabilityPool:     ", spAddr);
  console.log("  EmissionsVault:    ", evAddr);
  console.log("  AluriaLens:        ", lensAddr);
  console.log("════════════════════════════════════════");
  console.log("\n10. TODO: Verify all contracts on Etherscan");
  console.log("    npx hardhat verify --network sepolia <address> [constructor args]");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

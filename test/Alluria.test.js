import { expect } from "chai";
import hre from "hardhat";

// Helper: parse 18-decimal tokens
const e18 = (n) => {
  // Manual parseEther equivalent
  const str = String(n);
  const parts = str.split(".");
  const whole = parts[0];
  const frac = (parts[1] || "").padEnd(18, "0").slice(0, 18);
  return BigInt(whole) * BigInt(10 ** 18) + BigInt(frac);
};
// Helper: parse 8-decimal (Chainlink standard)
const e8  = (n) => BigInt(Math.round(n * 1e8));

describe("Alluria Protocol", function () {
  let ethersLib; // the ethers module itself
  let owner, alice, bob, liquidator;
  let alud, priceFeed, collateralManager, troveManager, stabilityPool, emissionsVault, lens;
  let wbtc, weth, oec;
  let wbtcFeed, wethFeed;
  let provider; // HardhatEthersProvider with send()
  let connection; // network connection for evm_ calls

  // Deploy everything before each test
  beforeEach(async function () {
    // Hardhat 3: ethers is on the network connection, not on hre
    connection = await hre.network.connect();
    const { ethers } = connection;
    ethersLib = ethers;
    provider = ethers.provider;

    [owner, alice, bob, liquidator] = await ethers.getSigners();

    // ── Mock tokens ──
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    wbtc = await MockERC20.deploy("Wrapped BTC", "WBTC", 8);
    weth = await MockERC20.deploy("Wrapped ETH", "WETH", 18);
    oec  = await MockERC20.deploy("OEC Token", "OEC", 18);

    // ── Mock Chainlink feeds ──
    const MockAgg = await ethers.getContractFactory("MockChainlinkAggregator");
    wbtcFeed = await MockAgg.deploy(e8(60000), 8);  // $60,000
    wethFeed = await MockAgg.deploy(e8(3000), 8);    // $3,000

    // ── Deploy ALUD ──
    const ALUD = await ethers.getContractFactory("ALUD");
    alud = await ALUD.deploy();

    // ── Deploy PriceFeed ──
    const PriceFeed = await ethers.getContractFactory("PriceFeed");
    priceFeed = await PriceFeed.deploy();
    await priceFeed.setOracle(await wbtc.getAddress(), await wbtcFeed.getAddress(), false);
    await priceFeed.setOracle(await weth.getAddress(), await wethFeed.getAddress(), false);
    // OEC uses manual price feed
    await priceFeed.setOracle(await oec.getAddress(), ethers.ZeroAddress, true);
    await priceFeed.setManualPrice(await oec.getAddress(), e18(5)); // $5

    // ── Deploy CollateralManager ──
    const CM = await ethers.getContractFactory("CollateralManager");
    collateralManager = await CM.deploy();
    // WBTC: 120% min, 110% liq, 0.5% fee, 10% bonus
    await collateralManager.addCollateral(await wbtc.getAddress(), 12000, 11000, 50, 1000);
    // WETH: 120% min, 110% liq, 0.5% fee, 10% bonus
    await collateralManager.addCollateral(await weth.getAddress(), 12000, 11000, 50, 1000);
    // OEC: 200% min, 150% liq, 1% fee, 10% bonus
    await collateralManager.addCollateral(await oec.getAddress(), 20000, 15000, 100, 1000);

    // ── Deploy TroveManager ──
    const TM = await ethers.getContractFactory("TroveManager");
    troveManager = await TM.deploy(
      await alud.getAddress(),
      await priceFeed.getAddress(),
      await collateralManager.getAddress()
    );

    // ── Deploy StabilityPool ──
    const SP = await ethers.getContractFactory("StabilityPool");
    stabilityPool = await SP.deploy(await alud.getAddress(), await oec.getAddress());
    await stabilityPool.setTroveManager(await troveManager.getAddress());

    // ── Deploy EmissionsVault ──
    const EV = await ethers.getContractFactory("EmissionsVault");
    emissionsVault = await EV.deploy(await oec.getAddress());
    await emissionsVault.setStabilityPool(await stabilityPool.getAddress());
    await stabilityPool.setEmissionsVault(await emissionsVault.getAddress());

    // ── Wire TroveManager ──
    await troveManager.setStabilityPool(await stabilityPool.getAddress());
    await alud.setTroveManager(await troveManager.getAddress());
    await alud.setStabilityPool(await stabilityPool.getAddress());

    // ── Deploy Lens ──
    const Lens = await ethers.getContractFactory("AluriaLens");
    lens = await Lens.deploy(
      await alud.getAddress(),
      await troveManager.getAddress(),
      await stabilityPool.getAddress(),
      await collateralManager.getAddress(),
      await priceFeed.getAddress(),
      await emissionsVault.getAddress(),
      await oec.getAddress()
    );

    // ── Fund test accounts ──
    await wbtc.mint(alice.address, BigInt(10) * BigInt(10 ** 8));  // 10 WBTC
    await weth.mint(alice.address, e18(100));                       // 100 WETH
    await oec.mint(alice.address, e18(1000000));                    // 1M OEC
    await wbtc.mint(bob.address, BigInt(10) * BigInt(10 ** 8));
    await weth.mint(bob.address, e18(100));

    // Fund EmissionsVault with OEC
    await oec.mint(await emissionsVault.getAddress(), e18(20000000)); // 20M OEC

    // Approve TroveManager
    const tmAddr = await troveManager.getAddress();
    await wbtc.connect(alice).approve(tmAddr, ethersLib.MaxUint256);
    await weth.connect(alice).approve(tmAddr, ethersLib.MaxUint256);
    await oec.connect(alice).approve(tmAddr, ethersLib.MaxUint256);
    await wbtc.connect(bob).approve(tmAddr, ethersLib.MaxUint256);
    await weth.connect(bob).approve(tmAddr, ethersLib.MaxUint256);
  });

  afterEach(async function () {
    if (connection) {
      await connection.close();
    }
  });

  // ================================================================
  //  ALUD
  // ================================================================
  describe("ALUD", function () {
    it("should only allow TroveManager to mint", async function () {
      await expect(alud.connect(alice).mint(alice.address, e18(100)))
        .to.be.revertedWithCustomError(alud, "NotAuthorized");
    });

    it("should only allow TroveManager to burn", async function () {
      await expect(alud.connect(alice).burn(alice.address, e18(100)))
        .to.be.revertedWithCustomError(alud, "NotAuthorized");
    });

    it("should pause/unpause transfers", async function () {
      await alud.pause();
      // Set owner as troveManager temporarily to test pause
      await alud.setTroveManager(owner.address);
      await expect(alud.mint(alice.address, e18(100))).to.be.revert(ethersLib);
      await alud.unpause();
      await alud.mint(alice.address, e18(100));
      expect(await alud.balanceOf(alice.address)).to.equal(e18(100));
      // Reset troveManager
      await alud.setTroveManager(await troveManager.getAddress());
    });
  });

  // ================================================================
  //  PriceFeed
  // ================================================================
  describe("PriceFeed", function () {
    it("should return Chainlink price normalized to 18 decimals", async function () {
      const price = await priceFeed.getPrice(await weth.getAddress());
      expect(price).to.equal(e18(3000));
    });

    it("should return manual price for OEC", async function () {
      const price = await priceFeed.getPrice(await oec.getAddress());
      expect(price).to.equal(e18(5));
    });

    it("should reject stale Chainlink prices", async function () {
      // Set updatedAt to 2 hours ago
      const twoHoursAgo = BigInt(Math.floor(Date.now() / 1000)) - BigInt(7200);
      await wethFeed.setUpdatedAt(twoHoursAgo);
      await expect(priceFeed.getPrice(await weth.getAddress()))
        .to.be.revertedWithCustomError(priceFeed, "StalePrice");
    });

    it("should reject stale manual prices", async function () {
      // Advance time by 2 hours
      await provider.send("evm_increaseTime", [7200]);
      await provider.send("evm_mine", []);
      await expect(priceFeed.getPrice(await oec.getAddress()))
        .to.be.revertedWithCustomError(priceFeed, "StalePrice");
    });

    it("should report staleness correctly", async function () {
      expect(await priceFeed.isPriceStale(await weth.getAddress())).to.be.false;
      const twoHoursAgo = BigInt(Math.floor(Date.now() / 1000)) - BigInt(7200);
      await wethFeed.setUpdatedAt(twoHoursAgo);
      expect(await priceFeed.isPriceStale(await weth.getAddress())).to.be.true;
    });
  });

  // ================================================================
  //  CollateralManager
  // ================================================================
  describe("CollateralManager", function () {
    it("should register collateral with correct params", async function () {
      const params = await collateralManager.getCollateralParams(await wbtc.getAddress());
      expect(params.minCollateralRatio).to.equal(12000n);
      expect(params.liquidationRatio).to.equal(11000n);
      expect(params.borrowingFee).to.equal(50n);
      expect(params.liquidationBonus).to.equal(1000n);
    });

    it("should prevent duplicate collateral registration", async function () {
      await expect(
        collateralManager.addCollateral(await wbtc.getAddress(), 12000, 11000, 50, 1000)
      ).to.be.revertedWithCustomError(collateralManager, "CollateralAlreadyExists");
    });

    it("should allow owner to update params", async function () {
      await collateralManager.updateCollateral(await wbtc.getAddress(), 13000, 11500, 75, 1000);
      const params = await collateralManager.getCollateralParams(await wbtc.getAddress());
      expect(params.minCollateralRatio).to.equal(13000n);
      expect(params.borrowingFee).to.equal(75n);
    });

    it("should pause/unpause specific collateral", async function () {
      await collateralManager.pauseCollateral(await wbtc.getAddress());
      expect(await collateralManager.isCollateralActive(await wbtc.getAddress())).to.be.false;
      await collateralManager.unpauseCollateral(await wbtc.getAddress());
      expect(await collateralManager.isCollateralActive(await wbtc.getAddress())).to.be.true;
    });

    it("should return all supported collaterals", async function () {
      const list = await collateralManager.getSupportedCollaterals();
      expect(list.length).to.equal(3);
    });
  });

  // ================================================================
  //  TroveManager — Open / Close / Modify
  // ================================================================
  describe("TroveManager — Trove Operations", function () {
    it("should open a trove with WETH", async function () {
      // Deposit 1 WETH ($3000) → borrow 1000 ALUD → ratio = 300%
      await troveManager.connect(alice).openTrove(await weth.getAddress(), e18(1), e18(1000));
      const trove = await troveManager.troves(alice.address, await weth.getAddress());
      expect(trove.exists).to.be.true;
      expect(trove.collateralAmount).to.equal(e18(1));
      // Debt = 1000 + 0.5% fee = 1005
      expect(trove.debt).to.equal(e18(1005));
      // Alice should have 1000 ALUD
      expect(await alud.balanceOf(alice.address)).to.equal(e18(1000));
    });

    it("should open a trove with WBTC (8 decimals)", async function () {
      // 0.1 WBTC = $6000 → borrow 2000 ALUD
      const btcAmount = BigInt(10000000); // 0.1 BTC (8 dec)
      await troveManager.connect(alice).openTrove(await wbtc.getAddress(), btcAmount, e18(2000));
      const trove = await troveManager.troves(alice.address, await wbtc.getAddress());
      expect(trove.exists).to.be.true;
    });

    it("should reject trove below minimum debt", async function () {
      await expect(
        troveManager.connect(alice).openTrove(await weth.getAddress(), e18(1), e18(50))
      ).to.be.revertedWithCustomError(troveManager, "BelowMinimumDebt");
    });

    it("should reject trove below minimum collateral value", async function () {
      // 0.01 WETH = $30 (below $200 minimum)
      const smallAmount = BigInt(10) ** BigInt(16); // 0.01 ETH
      await expect(
        troveManager.connect(alice).openTrove(await weth.getAddress(), smallAmount, e18(100))
      ).to.be.revertedWithCustomError(troveManager, "BelowMinimumCollateral");
    });

    it("should reject trove below minimum collateral ratio", async function () {
      // 1 WETH = $3000, try to borrow $2600 → ratio ≈ 115% < 120% min
      await expect(
        troveManager.connect(alice).openTrove(await weth.getAddress(), e18(1), e18(2600))
      ).to.be.revertedWithCustomError(troveManager, "BelowMinimumRatio");
    });

    it("should close a trove and return collateral", async function () {
      await troveManager.connect(alice).openTrove(await weth.getAddress(), e18(1), e18(1000));
      // Alice needs 1005 ALUD to repay (1000 + 0.5% fee)
      const debt = (await troveManager.troves(alice.address, await weth.getAddress())).debt;
      const aliceBalance = await alud.balanceOf(alice.address);
      if (debt > aliceBalance) {
        // Owner got the fee as ALUD, transfer it to alice
        await alud.connect(owner).transfer(alice.address, debt - aliceBalance);
      }
      await alud.connect(alice).approve(await troveManager.getAddress(), ethersLib.MaxUint256);
      await troveManager.connect(alice).closeTrove(await weth.getAddress());
      const trove = await troveManager.troves(alice.address, await weth.getAddress());
      expect(trove.exists).to.be.false;
    });

    it("should add collateral to existing trove", async function () {
      await troveManager.connect(alice).openTrove(await weth.getAddress(), e18(1), e18(1000));
      await troveManager.connect(alice).addCollateral(await weth.getAddress(), e18(1));
      const trove = await troveManager.troves(alice.address, await weth.getAddress());
      expect(trove.collateralAmount).to.equal(e18(2));
    });

    it("should remove collateral while staying above ratio", async function () {
      // 2 WETH = $6000, borrow 1000 → ratio = 600%
      await troveManager.connect(alice).openTrove(await weth.getAddress(), e18(2), e18(1000));
      const halfEth = BigInt(5) * BigInt(10) ** BigInt(17); // 0.5 ETH
      await troveManager.connect(alice).removeCollateral(await weth.getAddress(), halfEth);
      const trove = await troveManager.troves(alice.address, await weth.getAddress());
      const expectedCollateral = BigInt(15) * BigInt(10) ** BigInt(17); // 1.5 ETH
      expect(trove.collateralAmount).to.equal(expectedCollateral);
    });

    it("should reject removing collateral below min ratio", async function () {
      await troveManager.connect(alice).openTrove(await weth.getAddress(), e18(1), e18(1000));
      // Removing 0.6 WETH would leave 0.4 WETH ($1200) against ~1005 debt → ~119%
      const sixTenthsEth = BigInt(6) * BigInt(10) ** BigInt(17); // 0.6 ETH
      await expect(
        troveManager.connect(alice).removeCollateral(await weth.getAddress(), sixTenthsEth)
      ).to.be.revertedWithCustomError(troveManager, "BelowMinimumRatio");
    });

    it("should mint additional ALUD with fee", async function () {
      await troveManager.connect(alice).openTrove(await weth.getAddress(), e18(2), e18(1000));
      await troveManager.connect(alice).mintALUD(await weth.getAddress(), e18(500));
      const trove = await troveManager.troves(alice.address, await weth.getAddress());
      // Original debt: 1005, new: 500 + 2.5 fee = 502.5, total = 1507.5
      const expectedDebt = BigInt("1507500000000000000000"); // 1507.5e18
      expect(trove.debt).to.equal(expectedDebt);
      expect(await alud.balanceOf(alice.address)).to.equal(e18(1500));
    });

    it("should repay ALUD partially", async function () {
      await troveManager.connect(alice).openTrove(await weth.getAddress(), e18(2), e18(1000));
      await alud.connect(alice).approve(await troveManager.getAddress(), ethersLib.MaxUint256);
      await troveManager.connect(alice).repayALUD(await weth.getAddress(), e18(500));
      const trove = await troveManager.troves(alice.address, await weth.getAddress());
      expect(trove.debt).to.equal(e18(505)); // 1005 - 500 = 505
    });

    it("should repay ALUD fully", async function () {
      await troveManager.connect(alice).openTrove(await weth.getAddress(), e18(2), e18(1000));
      // Give alice the fee amount too
      const debt = (await troveManager.troves(alice.address, await weth.getAddress())).debt;
      await alud.connect(owner).transfer(alice.address, debt - e18(1000));
      await alud.connect(alice).approve(await troveManager.getAddress(), ethersLib.MaxUint256);
      await troveManager.connect(alice).repayALUD(await weth.getAddress(), debt);
      const trove = await troveManager.troves(alice.address, await weth.getAddress());
      expect(trove.debt).to.equal(0n);
    });

    it("should reject opening trove with paused collateral", async function () {
      await collateralManager.pauseCollateral(await weth.getAddress());
      await expect(
        troveManager.connect(alice).openTrove(await weth.getAddress(), e18(1), e18(1000))
      ).to.be.revertedWithCustomError(troveManager, "CollateralPaused");
    });
  });

  // ================================================================
  //  Liquidation
  // ================================================================
  describe("TroveManager — Liquidation", function () {
    beforeEach(async function () {
      // Alice opens trove: 1 WETH ($3000), borrow 2000 ALUD → ratio ~150%
      await troveManager.connect(alice).openTrove(await weth.getAddress(), e18(1), e18(2000));
      // Bob deposits 5000 ALUD in stability pool
      await troveManager.connect(bob).openTrove(await weth.getAddress(), e18(10), e18(5000));
      await alud.connect(bob).approve(await stabilityPool.getAddress(), ethersLib.MaxUint256);
      await stabilityPool.connect(bob).depositALUD(e18(5000));
    });

    it("should liquidate undercollateralized trove", async function () {
      // Drop WETH to $2000 → Alice ratio = (1*2000*10000)/(2010*1e18) ≈ 99.5% < 110%
      await wethFeed.setPrice(e8(2000));
      await troveManager.connect(liquidator).liquidate(alice.address, await weth.getAddress());
      const trove = await troveManager.troves(alice.address, await weth.getAddress());
      expect(trove.exists).to.be.false;
    });

    it("should reject liquidation of healthy trove", async function () {
      await expect(
        troveManager.connect(liquidator).liquidate(alice.address, await weth.getAddress())
      ).to.be.revertedWithCustomError(troveManager, "TroveHealthy");
    });

    it("should distribute collateral to stability pool on liquidation", async function () {
      await wethFeed.setPrice(e8(2000));
      const spAddr = await stabilityPool.getAddress();
      const balBefore = await weth.balanceOf(spAddr);
      await troveManager.connect(liquidator).liquidate(alice.address, await weth.getAddress());
      const balAfter = await weth.balanceOf(spAddr);
      expect(balAfter).to.be.gt(balBefore);
    });
  });

  // ================================================================
  //  Redemption
  // ================================================================
  describe("TroveManager — Redemption", function () {
    beforeEach(async function () {
      // Alice opens trove: 2 WETH, borrow 2000 ALUD
      await troveManager.connect(alice).openTrove(await weth.getAddress(), e18(2), e18(2000));
    });

    it("should redeem ALUD for collateral", async function () {
      await alud.connect(alice).approve(await troveManager.getAddress(), ethersLib.MaxUint256);
      const wethBefore = await weth.balanceOf(alice.address);
      await troveManager.connect(alice).redeemCollateral(
        await weth.getAddress(),
        e18(500),
        alice.address
      );
      const wethAfter = await weth.balanceOf(alice.address);
      expect(wethAfter).to.be.gt(wethBefore);
      // Trove debt should decrease
      const trove = await troveManager.troves(alice.address, await weth.getAddress());
      expect(trove.debt).to.be.lt(e18(2010)); // was 2010 (2000 + 0.5% fee)
    });
  });

  // ================================================================
  //  Stability Pool
  // ================================================================
  describe("StabilityPool", function () {
    it("should accept ALUD deposits", async function () {
      await troveManager.connect(alice).openTrove(await weth.getAddress(), e18(2), e18(1000));
      await alud.connect(alice).approve(await stabilityPool.getAddress(), ethersLib.MaxUint256);
      await stabilityPool.connect(alice).depositALUD(e18(500));
      expect(await stabilityPool.deposits(alice.address)).to.equal(e18(500));
      expect(await stabilityPool.totalDeposits()).to.equal(e18(500));
    });

    it("should withdraw ALUD", async function () {
      await troveManager.connect(alice).openTrove(await weth.getAddress(), e18(2), e18(1000));
      await alud.connect(alice).approve(await stabilityPool.getAddress(), ethersLib.MaxUint256);
      await stabilityPool.connect(alice).depositALUD(e18(500));
      await stabilityPool.connect(alice).withdrawALUD(e18(200));
      expect(await stabilityPool.deposits(alice.address)).to.equal(e18(300));
    });

    it("should reject withdrawal exceeding deposit", async function () {
      await troveManager.connect(alice).openTrove(await weth.getAddress(), e18(2), e18(1000));
      await alud.connect(alice).approve(await stabilityPool.getAddress(), ethersLib.MaxUint256);
      await stabilityPool.connect(alice).depositALUD(e18(500));
      await expect(
        stabilityPool.connect(alice).withdrawALUD(e18(600))
      ).to.be.revertedWithCustomError(stabilityPool, "InsufficientDeposit");
    });

    it("should track collateral gains after liquidation", async function () {
      // Alice borrows at thin ratio, Bob deposits in SP
      await troveManager.connect(alice).openTrove(await weth.getAddress(), e18(1), e18(2000));
      await troveManager.connect(bob).openTrove(await weth.getAddress(), e18(10), e18(5000));
      await alud.connect(bob).approve(await stabilityPool.getAddress(), ethersLib.MaxUint256);
      await stabilityPool.connect(bob).depositALUD(e18(5000));

      // Crash price → liquidate Alice
      await wethFeed.setPrice(e8(2000));
      await troveManager.connect(liquidator).liquidate(alice.address, await weth.getAddress());

      // Bob should have collateral gains
      const [tokens, amounts] = await stabilityPool.getDepositorGains(bob.address);
      expect(tokens.length).to.be.gt(0);
      // Bob should have some WETH gain
      const wethAddr = await weth.getAddress();
      const wethIdx = tokens.findIndex(t => t === wethAddr);
      // The gain should be > 0
      expect(amounts[wethIdx]).to.be.gt(0n);
    });
  });

  // ================================================================
  //  EmissionsVault
  // ================================================================
  describe("EmissionsVault", function () {
    it("should hold 20M OEC", async function () {
      const balance = await emissionsVault.getVaultBalance();
      expect(balance).to.equal(e18(20000000));
    });

    it("should release OEC to stability pool", async function () {
      await emissionsVault.release(e18(100000));
      const balance = await emissionsVault.getVaultBalance();
      expect(balance).to.equal(e18(20000000) - e18(100000));
      expect(await emissionsVault.getTotalReleased()).to.equal(e18(100000));
    });

    it("should enforce 7-day minimum interval", async function () {
      await emissionsVault.release(e18(100000));
      await expect(emissionsVault.release(e18(100000)))
        .to.be.revertedWithCustomError(emissionsVault, "ReleaseTooSoon");
    });

    it("should allow release after 7 days", async function () {
      await emissionsVault.release(e18(100000));
      // Advance 7 days
      await provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
      await provider.send("evm_mine", []);
      await emissionsVault.release(e18(100000));
      expect(await emissionsVault.getTotalReleased()).to.equal(e18(200000));
    });

    it("should enforce 500K OEC max per release", async function () {
      await expect(emissionsVault.release(e18(600000)))
        .to.be.revertedWithCustomError(emissionsVault, "ExceedsMaxRelease");
    });

    it("should reject unauthorized caller", async function () {
      await expect(emissionsVault.connect(alice).release(e18(100000)))
        .to.be.revert(ethersLib); // OwnableUnauthorizedAccount
    });

    it("should report next release time", async function () {
      await emissionsVault.release(e18(100000));
      const next = await emissionsVault.getNextReleaseTime();
      const last = await emissionsVault.getLastReleaseTime();
      expect(next).to.equal(last + BigInt(7 * 24 * 60 * 60));
    });
  });

  // ================================================================
  //  OEC Rewards Distribution
  // ================================================================
  describe("OEC Rewards via EmissionsVault", function () {
    it("should distribute OEC rewards to stability pool depositors", async function () {
      // Alice borrows and deposits in SP
      await troveManager.connect(alice).openTrove(await weth.getAddress(), e18(2), e18(1000));
      await alud.connect(alice).approve(await stabilityPool.getAddress(), ethersLib.MaxUint256);
      await stabilityPool.connect(alice).depositALUD(e18(1000));

      // Release OEC
      await emissionsVault.release(e18(100000));

      // Alice should have pending OEC rewards
      const pending = await stabilityPool.getDepositorOECRewards(alice.address);
      expect(pending).to.equal(e18(100000));
    });

    it("should allow claiming OEC rewards", async function () {
      await troveManager.connect(alice).openTrove(await weth.getAddress(), e18(2), e18(1000));
      await alud.connect(alice).approve(await stabilityPool.getAddress(), ethersLib.MaxUint256);
      await stabilityPool.connect(alice).depositALUD(e18(1000));

      await emissionsVault.release(e18(100000));

      const oecBefore = await oec.balanceOf(alice.address);
      await stabilityPool.connect(alice).claimOECRewards();
      const oecAfter = await oec.balanceOf(alice.address);
      expect(oecAfter - oecBefore).to.equal(e18(100000));
    });
  });

  // ================================================================
  //  Pause Functionality
  // ================================================================
  describe("Pause", function () {
    it("should pause TroveManager operations", async function () {
      await troveManager.pause();
      await expect(
        troveManager.connect(alice).openTrove(await weth.getAddress(), e18(1), e18(1000))
      ).to.be.revert(ethersLib);
    });

    it("should pause StabilityPool operations", async function () {
      await stabilityPool.pause();
      await expect(
        stabilityPool.connect(alice).depositALUD(e18(100))
      ).to.be.revert(ethersLib);
    });

    it("should pause EmissionsVault", async function () {
      await emissionsVault.pause();
      await expect(
        emissionsVault.release(e18(100000))
      ).to.be.revert(ethersLib);
    });

    it("should pause PriceFeed", async function () {
      await priceFeed.pause();
      await expect(
        priceFeed.getPrice(await weth.getAddress())
      ).to.be.revert(ethersLib);
    });
  });

  // ================================================================
  //  AluriaLens
  // ================================================================
  describe("AluriaLens", function () {
    it("should return system stats", async function () {
      await troveManager.connect(alice).openTrove(await weth.getAddress(), e18(2), e18(1000));
      const stats = await lens.getSystemStats();
      expect(stats.totalALUDSupply).to.be.gt(0n);
      expect(stats.totalCollateralValueUSD).to.be.gt(0n);
    });

    it("should return user troves", async function () {
      await troveManager.connect(alice).openTrove(await weth.getAddress(), e18(2), e18(1000));
      const troveInfos = await lens.getAllUserTroves(alice.address);
      expect(troveInfos.length).to.equal(1);
      expect(troveInfos[0].collateral).to.equal(await weth.getAddress());
    });

    it("should return collateral stats", async function () {
      await troveManager.connect(alice).openTrove(await weth.getAddress(), e18(2), e18(1000));
      const stats = await lens.getCollateralStats(await weth.getAddress());
      expect(stats.totalCollateral).to.equal(e18(2));
      expect(stats.totalDebt).to.be.gt(0n);
    });

    it("should return stability pool stats", async function () {
      const [deposits, oecBal, oecReleased] = await lens.getStabilityPoolStats();
      expect(deposits).to.equal(0n);
      expect(oecBal).to.equal(e18(20000000));
    });
  });
});

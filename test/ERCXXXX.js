const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("ERCXXXX", function () {
  let ercXXXX;
  let addr0;
  let addr1;
  let addr2;
  let addrs;
  let ercXXXXAddress;

  const percentClaimable = 60;
  const supply = 1000000;
  const gas = ethers.parseEther("0.001");

  beforeEach(async function () {
    [addr0, addr1, addr2, ...addrs] = await ethers.getSigners();
    const ERCXXXX = await ethers.getContractFactory("ERCXXXX");
    ercXXXX = await ERCXXXX.deploy("ERCXXXX", "ERCX", supply, percentClaimable);
    await ercXXXX.waitForDeployment();
    ercXXXXAddress = await ercXXXX.getAddress();
  });

  describe("Deployment", function () {
    it("Should set the right name", async function () {
      expect(await ercXXXX.name()).to.equal("ERCXXXX");
    });

    it("Should set the right symbol", async function () {
      expect(await ercXXXX.symbol()).to.equal("ERCX");
    });

    it("Should set the right total supply", async function () {
      expect(await ercXXXX.totalSupply()).to.equal(supply);
    });

    it("Should assign the total supply to the owner", async function () {
      expect(await ercXXXX.balanceOf(await ethers.provider.getSigner(0))).to.equal(supply);
    });
  });

  describe("Deposit", function () {
    it("Should deposit ETH to the contract", async function () {
      await addr0.sendTransaction({ to: ercXXXXAddress, value: 1000 });
      expect(await ethers.provider.getBalance(ercXXXXAddress)).to.equal(1000);
    });
  });

  describe("Snapshot", function () {
    it("Should not snapshot if 1000 blocks have not passed", async function () {
      await expect(ercXXXX.snapshot()).to.be.revertedWith("ERCXXXX: snapshot interval is too short");
    });

    it("Should snapshot if > 1000 blocks have passed", async function () {
      await network.provider.send("hardhat_mine", ["0x400"]);
      expect(await ercXXXX.snapshot()).to.emit(ercXXXX, "Snapshot");
    });
  });

  describe("Burn", function () {
    it("Should burn tokens", async function () {
      expect(await ercXXXX.redeemableOnBurn(10000)).to.equal(0);
      await ercXXXX.burn(10000);
      expect(await ercXXXX.balanceOf(await ethers.provider.getSigner(0))).to.equal(supply-10000);
    });

    it("Should burn tokens and receive ETH", async function () {
      await addr0.sendTransaction({ to: ercXXXXAddress, value: ethers.parseEther("1000") });
      expect(await ethers.provider.getBalance(ercXXXXAddress)).to.equal(ethers.parseEther("1000"));
      expect(await ercXXXX.redeemableOnBurn(10000)).to.equal(ethers.parseEther("1000")*BigInt(10000)*BigInt(100-percentClaimable)/BigInt(supply)/BigInt(100));
      const balanceBefore = await ethers.provider.getBalance(await ethers.provider.getSigner(0));
      await ercXXXX.burn(10000);
      const balanceAfter = await ethers.provider.getBalance(await ethers.provider.getSigner(0));
      expect(balanceAfter-balanceBefore).to.greaterThan(ethers.parseEther("1000")*BigInt(10000)*BigInt(100-percentClaimable)/BigInt(supply)/BigInt(100)-gas);
    });

    it("Should snapshot and burn tokens", async function () {
      await addr0.sendTransaction({ to: ercXXXXAddress, value: ethers.parseEther("1000") });
      await network.provider.send("hardhat_mine", ["0x400"]);
      await ercXXXX.snapshot();
      expect(await ercXXXX.redeemableOnBurn(10000)).to.equal(ethers.parseEther("1000")*BigInt(10000)*BigInt(100-percentClaimable)/BigInt(supply)/BigInt(100));
      const balanceBefore = await ethers.provider.getBalance(await ethers.provider.getSigner(0));
      await ercXXXX.burn(10000);
      const balanceAfter = await ethers.provider.getBalance(await ethers.provider.getSigner(0));
      expect(balanceAfter-balanceBefore).to.greaterThan(ethers.parseEther("1000")*BigInt(10000)*BigInt(100-percentClaimable)/BigInt(supply)/BigInt(100)-gas);
    });

    it("Should snapshot, deposit, and burn", async function () {
      await addr0.sendTransaction({ to: ercXXXXAddress, value: ethers.parseEther("1000") });
      await network.provider.send("hardhat_mine", ["0x400"]);
      await ercXXXX.snapshot();
      await addr0.sendTransaction({ to: ercXXXXAddress, value: ethers.parseEther("1000") });
      expect(await ercXXXX.redeemableOnBurn(10000)).to.equal(ethers.parseEther("2000")*BigInt(10000)*BigInt(100-percentClaimable)/BigInt(supply)/BigInt(100));
      const balanceBefore = await ethers.provider.getBalance(await ethers.provider.getSigner(0));
      await ercXXXX.burn(10000);
      const balanceAfter = await ethers.provider.getBalance(await ethers.provider.getSigner(0));
      expect(balanceAfter-balanceBefore).to.greaterThan(ethers.parseEther("2000")*BigInt(10000)*BigInt(100-percentClaimable)/BigInt(supply)/BigInt(100)-gas);
    });
  });

  describe("Claim", function () {
    it("Should not claim if no snapshot has been taken", async function () {
      await expect(ercXXXX.claim(1)).to.be.revertedWith("ERC20Snapshot: nonexistent id");
    });

    it("Should claim after snapshot", async function () {
      await addr0.sendTransaction({ to: ercXXXXAddress, value: ethers.parseEther("1000") });
      await network.provider.send("hardhat_mine", ["0x400"]);
      await ercXXXX.snapshot();
      expect(await ercXXXX.claimableRevenue(addr0, 1)).to.equal(ethers.parseEther("1000")*BigInt(percentClaimable)/BigInt(100));
      const balanceBefore = await ethers.provider.getBalance(await ethers.provider.getSigner(0));
      await ercXXXX.claim(1);
      const balanceAfter = await ethers.provider.getBalance(await ethers.provider.getSigner(0));
      expect(balanceAfter-balanceBefore).to.greaterThan(ethers.parseEther("1000")*BigInt(percentClaimable)/BigInt(100)-gas);
    });

    it("Should claim after snapshot and deposit", async function () {
      await addr0.sendTransaction({ to: ercXXXXAddress, value: ethers.parseEther("1000") });
      await network.provider.send("hardhat_mine", ["0x400"]);
      await ercXXXX.snapshot();
      await addr0.sendTransaction({ to: ercXXXXAddress, value: ethers.parseEther("1000") });
      expect(await ercXXXX.claimableRevenue(addr0, 1)).to.equal(ethers.parseEther("1000")*BigInt(percentClaimable)/BigInt(100));
      const balanceBefore = await ethers.provider.getBalance(await ethers.provider.getSigner(0));
      await ercXXXX.claim(1);
      const balanceAfter = await ethers.provider.getBalance(await ethers.provider.getSigner(0));
      expect(balanceAfter-balanceBefore).to.greaterThan(ethers.parseEther("1000")*BigInt(percentClaimable)/BigInt(100)-gas);
    });

    it("Should claim correctly after snapshot with two holders", async function () {
      await ercXXXX.transfer(addr1.address, 100000);
      await addr0.sendTransaction({ to: ercXXXXAddress, value: ethers.parseEther("1000") });
      await network.provider.send("hardhat_mine", ["0x400"]);
      await ercXXXX.snapshot();
      expect(await ercXXXX.claimableRevenue(addr0, 1)).to.equal(ethers.parseEther("1000")*BigInt(supply-100000)*BigInt(percentClaimable)/BigInt(100)/BigInt(supply));
      expect(await ercXXXX.claimableRevenue(addr1, 1)).to.equal(ethers.parseEther("1000")*BigInt(100000)*BigInt(percentClaimable)/BigInt(100)/BigInt(supply));
      const balanceBefore0 = await ethers.provider.getBalance(addr0.address);
      const balanceBefore1 = await ethers.provider.getBalance(addr1.address);
      await ercXXXX.claim(1);
      await ercXXXX.connect(addr1).claim(1);
      const balanceAfter0 = await ethers.provider.getBalance(addr0.address);
      const balanceAfter1 = await ethers.provider.getBalance(addr1.address);
      expect(balanceAfter0-balanceBefore0).to.greaterThan(ethers.parseEther("1000")*BigInt(supply-100000)*BigInt(percentClaimable)/BigInt(100)/BigInt(supply)-gas);
      expect(balanceAfter1-balanceBefore1).to.greaterThan(ethers.parseEther("1000")*BigInt(100000)*BigInt(percentClaimable)/BigInt(100)/BigInt(supply)-gas);
    });
  });
});

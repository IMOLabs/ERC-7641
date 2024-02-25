const { expect } = require("chai");

describe("ERCXXXX", function () {
  let ercXXXX;
  let addr0;
  let addr1;
  let addr2;
  let addrs;
  let ercXXXXAddress;

  beforeEach(async function () {
    [addr0, addr1, addr2, ...addrs] = await ethers.getSigners();
    const ERCXXXX = await ethers.getContractFactory("ERCXXXX");
    ercXXXX = await ERCXXXX.deploy("ERCXXXX", "ERCM", 1000000);
    await ercXXXX.waitForDeployment();
    ercXXXXAddress = await ercXXXX.getAddress();
  });

  describe("Deployment", function () {
    it("Should set the right name", async function () {
      expect(await ercXXXX.name()).to.equal("ERCXXXX");
    });

    it("Should set the right symbol", async function () {
      expect(await ercXXXX.symbol()).to.equal("ERCM");
    });

    it("Should set the right total supply", async function () {
      expect(await ercXXXX.totalSupply()).to.equal(1000000);
    });

    it("Should assign the total supply to the owner", async function () {
      expect(await ercXXXX.balanceOf(await ethers.provider.getSigner(0))).to.equal(1000000);
    });
  });

  describe("Deposit, snapshot, and claim", function () {
    it("Should deposit ETH and snapshot", async function () {
      // send 1 ETH to the contract using native receive function from addr1, expect event to be emitted
      await expect(addr1.sendTransaction({ to: ercXXXXAddress, value: ethers.parseEther("1.0") })).to.emit(ercXXXX, "Deposit").withArgs(1, ethers.parseEther("1.0"));
      // check balance of contract
      expect(await ethers.provider.getBalance(ercXXXXAddress)).to.equal(ethers.parseEther("1.0"));
      // check claimable of depositor
      expect(await ercXXXX.claimable(addr0, 1)).to.equal(ethers.parseEther("1.0"));
      // get current balance of addr0
      const balanceBefore = await ethers.provider.getBalance(addr0.address);
      // should be able to claim
      await ercXXXX.connect(addr0).claim(1);
      // check balance of contract
      expect(await ethers.provider.getBalance(ercXXXXAddress)).to.equal(0);
      // check balance of addr0 (minus gas fee from tx)
      const balanceAfter = await ethers.provider.getBalance(addr0.address);
      expect(balanceAfter).to.be.above(balanceBefore+ethers.parseEther("0.999"));
    });
    
    it("Should snapshot correctly when balance changes", async function () {
      // send 1 ETH to the contract using native receive function from addr1 twice
      await expect(addr1.sendTransaction({ to: ercXXXXAddress, value: ethers.parseEther("1.0") })).to.emit(ercXXXX, "Deposit").withArgs(1, ethers.parseEther("1.0"));
      // send 400000 ERCXXXX to addr2
      await ercXXXX.transfer(addr2.address, 400000);
      // send 1 ETH to the contract using native receive function from addr1, expect event to be emitted
      await expect(addr1.sendTransaction({ to: ercXXXXAddress, value: ethers.parseEther("1.0") })).to.emit(ercXXXX, "Deposit").withArgs(2, ethers.parseEther("1.0"));
      // check balance of contract
      expect(await ethers.provider.getBalance(ercXXXXAddress)).to.equal(ethers.parseEther("2.0"));
      // check claimable of addr0 and addr2
      expect(await ercXXXX.claimable(addr0, 2)).to.equal(ethers.parseEther("0.6"));
      expect(await ercXXXX.claimable(addr2, 2)).to.equal(ethers.parseEther("0.4"));
      // get current balance of addr0 and addr2
      const balanceBefore0 = await ethers.provider.getBalance(addr0.address);
      const balanceBefore2 = await ercXXXX.balanceOf(addr2.address);
      // should be able to claim
      await ercXXXX.connect(addr0).claim(1);
      await ercXXXX.connect(addr0).claim(2);
      await ercXXXX.connect(addr2).claim(2);
      // check balance of contract
      expect(await ethers.provider.getBalance(ercXXXXAddress)).to.equal(0);
      // check balance of addr0 (minus gas fee from tx)
      const balanceAfter0 = await ethers.provider.getBalance(addr0.address);
      expect(balanceAfter0).to.be.above(balanceBefore0+ethers.parseEther("1.599"));
      // check balance of addr2
      const balanceAfter2 = await ethers.provider.getBalance(addr2.address);
      expect(balanceAfter2).to.be.above(balanceBefore2+ethers.parseEther("0.399"));
    });

    it("Should not allow claiming of snapshot that doesn't exist", async function () {
      await expect(ercXXXX.connect(addr0).claim(1)).to.be.revertedWith("ERCXXXX: nonexistent id");
    });

    it("Should not allow claiming of snapshot that has already been claimed", async function () {
      // send 1 ETH to the contract using native receive function from addr1, expect event to be emitted
      await expect(addr1.sendTransaction({ to: ercXXXXAddress, value: ethers.parseEther("1.0") })).to.emit(ercXXXX, "Deposit").withArgs(1, ethers.parseEther("1.0"));
      // should be able to claim
      await ercXXXX.connect(addr0).claim(1);
      // should not be able to claim again
      await expect(ercXXXX.connect(addr0).claim(1)).to.be.revertedWith("ERCXXXX: already claimed");
    });

    it("Should not allow claiming of snapshot is claimable is 0", async function () {
      // send 1 ETH to the contract using native receive function from addr1, expect event to be emitted
      await expect(addr1.sendTransaction({ to: ercXXXXAddress, value: ethers.parseEther("1.0") })).to.emit(ercXXXX, "Deposit").withArgs(1, ethers.parseEther("1.0"));
      // should not be able to claim
      await expect(ercXXXX.connect(addr1).claim(1)).to.be.revertedWith("ERCXXXX: no ETH to claim");
    });
  });
});

const { expect } = require("chai");

describe("ERC20M", function () {
  let erc20m;
  let addr0;
  let addr1;
  let addr2;
  let addrs;
  let erc20mAddress;

  beforeEach(async function () {
    [addr0, addr1, addr2, ...addrs] = await ethers.getSigners();
    const ERC20M = await ethers.getContractFactory("ERC20M");
    erc20m = await ERC20M.deploy("ERC20M", "ERCM", 1000000, "ipfs://mock");
    await erc20m.waitForDeployment();
    erc20mAddress = await erc20m.getAddress();
  });

  describe("Deployment", function () {
    it("Should set the right name", async function () {
      expect(await erc20m.name()).to.equal("ERC20M");
    });

    it("Should set the right symbol", async function () {
      expect(await erc20m.symbol()).to.equal("ERCM");
    });

    it("Should set the right total supply", async function () {
      expect(await erc20m.totalSupply()).to.equal(1000000);
    });

    it("Should set the right modelId", async function () {
      // modelId is the keccak256 hash of the modelUri
      expect(await erc20m.modelId()).to.equal("0x1ef3c7282aaf71b1fe58e147f0f74c752821a405fccdddabee1f579a3c935348");
    });

    it("Should assign the total supply to the owner", async function () {
      expect(await erc20m.balanceOf(await ethers.provider.getSigner(0))).to.equal(1000000);
    });
  });

  describe("Deposit, snapshot, and claim", function () {
    it("Should deposit ETH and snapshot", async function () {
      // send 1 ETH to the contract using native receive function from addr1, expect event to be emitted
      await expect(addr1.sendTransaction({ to: erc20mAddress, value: ethers.parseEther("1.0") })).to.emit(erc20m, "Deposit").withArgs(1, ethers.parseEther("1.0"));
      // check balance of contract
      expect(await ethers.provider.getBalance(erc20mAddress)).to.equal(ethers.parseEther("1.0"));
      // check claimable of depositor
      expect(await erc20m.claimable(addr0, 1)).to.equal(ethers.parseEther("1.0"));
      // get current balance of addr0
      const balanceBefore = await ethers.provider.getBalance(addr0.address);
      // should be able to claim
      await erc20m.connect(addr0).claim(1);
      // check balance of contract
      expect(await ethers.provider.getBalance(erc20mAddress)).to.equal(0);
      // check balance of addr0 (minus gas fee from tx)
      const balanceAfter = await ethers.provider.getBalance(addr0.address);
      expect(balanceAfter).to.be.above(balanceBefore+ethers.parseEther("0.999"));
    });
    
    it("Should snapshot correctly when balance changes", async function () {
      // send 1 ETH to the contract using native receive function from addr1 twice
      await expect(addr1.sendTransaction({ to: erc20mAddress, value: ethers.parseEther("1.0") })).to.emit(erc20m, "Deposit").withArgs(1, ethers.parseEther("1.0"));
      // send 400000 ERC20M to addr2
      await erc20m.transfer(addr2.address, 400000);
      // send 1 ETH to the contract using native receive function from addr1, expect event to be emitted
      await expect(addr1.sendTransaction({ to: erc20mAddress, value: ethers.parseEther("1.0") })).to.emit(erc20m, "Deposit").withArgs(2, ethers.parseEther("1.0"));
      // check balance of contract
      expect(await ethers.provider.getBalance(erc20mAddress)).to.equal(ethers.parseEther("2.0"));
      // check claimable of addr0 and addr2
      expect(await erc20m.claimable(addr0, 2)).to.equal(ethers.parseEther("0.6"));
      expect(await erc20m.claimable(addr2, 2)).to.equal(ethers.parseEther("0.4"));
      // get current balance of addr0 and addr2
      const balanceBefore0 = await ethers.provider.getBalance(addr0.address);
      const balanceBefore2 = await erc20m.balanceOf(addr2.address);
      // should be able to claim
      await erc20m.connect(addr0).claim(1);
      await erc20m.connect(addr0).claim(2);
      await erc20m.connect(addr2).claim(2);
      // check balance of contract
      expect(await ethers.provider.getBalance(erc20mAddress)).to.equal(0);
      // check balance of addr0 (minus gas fee from tx)
      const balanceAfter0 = await ethers.provider.getBalance(addr0.address);
      expect(balanceAfter0).to.be.above(balanceBefore0+ethers.parseEther("1.599"));
      // check balance of addr2
      const balanceAfter2 = await ethers.provider.getBalance(addr2.address);
      expect(balanceAfter2).to.be.above(balanceBefore2+ethers.parseEther("0.399"));
    });

    it("Should not allow claiming of snapshot that doesn't exist", async function () {
      await expect(erc20m.connect(addr0).claim(1)).to.be.revertedWith("ERC20M: nonexistent id");
    });

    it("Should not allow claiming of snapshot that has already been claimed", async function () {
      // send 1 ETH to the contract using native receive function from addr1, expect event to be emitted
      await expect(addr1.sendTransaction({ to: erc20mAddress, value: ethers.parseEther("1.0") })).to.emit(erc20m, "Deposit").withArgs(1, ethers.parseEther("1.0"));
      // should be able to claim
      await erc20m.connect(addr0).claim(1);
      // should not be able to claim again
      await expect(erc20m.connect(addr0).claim(1)).to.be.revertedWith("ERC20M: already claimed");
    });

    it("Should not allow claiming of snapshot is claimable is 0", async function () {
      // send 1 ETH to the contract using native receive function from addr1, expect event to be emitted
      await expect(addr1.sendTransaction({ to: erc20mAddress, value: ethers.parseEther("1.0") })).to.emit(erc20m, "Deposit").withArgs(1, ethers.parseEther("1.0"));
      // should not be able to claim
      await expect(erc20m.connect(addr1).claim(1)).to.be.revertedWith("ERC20M: no ETH to claim");
    });
  });
});

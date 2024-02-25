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
    ercXXXX = await ERCXXXX.deploy("ERCXXXX", "ERCX", 1000000);
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
      expect(await ercXXXX.totalSupply()).to.equal(1000000);
    });

    it("Should assign the total supply to the owner", async function () {
      expect(await ercXXXX.balanceOf(await ethers.provider.getSigner(0))).to.equal(1000000);
    });
  });

  describe("Deposit, snapshot, and claim", function () {
  });
});

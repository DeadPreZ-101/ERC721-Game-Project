const { expectRevert } = require("@openzeppelin/test-helpers");
const BigNumber = require("bignumber.js");
const truffleAssert = require("truffle-assertions");
const ERC721Contract = artifacts.require("ERC721Contract");
const Monster = artifacts.require("Monster");
const mintAddress = "0x0000000000000000000000000000000000000000";

contract("ERC721Contract", (accounts) => {

  let instance;
  const [me, player1, player2] = [accounts[0], accounts[1], accounts[2]];
  before(async () => {
    instance = await ERC721Contract.deployed();
    for (let i = 0; i < 3; i++) {
      let tx = await instance.mint(me, i);
    }
  });

  it("Test: Check balanceOf() function", async () => {
    const initialTokenSupply = 3;
    let tx = await instance.balanceOf.call(me);
    assert(new BigNumber(tx).isEqualTo(new BigNumber(initialTokenSupply)), "Amount is not correct");
  });

  it("Test: Check ownerOf() function", async () => {
    const tokenId = 0;
    const addresExpected = me;
    const tx = await instance.ownerOf.call(tokenId);
    assert(tx === addresExpected, "Owner is not correct");
  });

  it("Test: Check getApproved() function", async () => {
    const tokenId = 0;
    //as no one has minted the tokens..so the addressb will be 0
    const addresExpected = "0x0000000000000000000000000000000000000000";
    let tx = await instance.getApproved.call(tokenId);
    assert(tx === addresExpected, "The ID of the approver is not right");
  });

  it("Test: Check transferFrom() function", async () => {
    const tokenId = 0;
    const meBalanceBefore = await instance.balanceOf.call(me);
    const receipt = await instance.transferFrom(me, player1, tokenId, {from:me});

    const [meBalance, player1Balance, owner] = await Promise.all([instance.balanceOf(me), instance.balanceOf(player1), instance.ownerOf(tokenId)]);

    assert(new BigNumber(meBalanceBefore).minus(new BigNumber(meBalance)).isEqualTo(new BigNumber(player1Balance)), "This is not right amount");
    assert(owner === player1, "This is not expected owner");

    //Emit Transfer
    truffleAssert.eventEmitted(receipt, "Transfer", (obj) => {
      return (obj._from === me && obj._to === player1 && new BigNumber(obj._tokenId).isEqualTo(new BigNumber(tokenId)));
    });
  });

  //check the call to ERC721Receiver contract is made or not

  it("Test: Check safetransferFrom() should transfer", async () => {
    const tokenId = 1;
    const meBalanceBefore = await instance.balanceOf.call(me);
    const receipt = await instance.transferFrom(me, player1, tokenId, {from:me});

    const [meBalance, player1Balance, owner] = await Promise.all([instance.balanceOf(me), instance.balanceOf(player1), instance.ownerOf(tokenId)]);

    assert(meBalance.toNumber() === 1, "This is not expected supply");
    assert(owner === player1, "This is not expected owner");

    //Emit Transfer
    truffleAssert.eventEmitted(receipt, "Transfer", (obj) => {
      return (obj._from === me && obj._to === player1 && new BigNumber(obj._tokenId).isEqualTo(new BigNumber(tokenId)));
    });
  });

  it("Test: Check transfer when apporved", async () => {
    const tokenId = 2;
    const player1BalanceBefore = await instance.balanceOf.call(player1);
    const receipt1 = await instance.approve(player1, tokenId, { from: me });

    const apporvedReceipt = await instance.getApproved(tokenId);
    const receipt2 = await instance.transferFrom(player1, player2, tokenId, {from:player1});

    const [meBalance, player1Balance, owner] = await Promise.all([instance.balanceOf(player1), instance.balanceOf(player2), instance.ownerOf(tokenId)]);

    assert(new BigNumber(player1BalanceBefore).minus(new BigNumber(meBalance)).isEqualTo(new BigNumber(player1Balance)), "This is not expected supply");
    assert(owner === player2, "This is not expected owner");

    truffleAssert.eventEmitted(receipt1, "Approval", (obj) => {
      return (obj._owner === me && obj._approved === player1 && new BigNumber(obj._tokenId).isEqualTo(new BigNumber(tokenId)));
    });
  });

  it("Test: Check setApprovalForAll() function", async () => {
    const receipt = await instance.setApprovalForAll(me, true, {from:player1});

    truffleAssert.eventEmitted(receipt, "ApprovalForAll", (obj) => {
      return (obj._owner === player1 && obj._operator === me && obj._approved === true);
    });

    const receipt2 = await instance.isApprovedForAll.call(player1, me);
    assert(receipt2 === true, "This is not expected apporved output");
  });
});

contract("Monster", (accounts) => {
  let monsterInstance;
  const [me, player1, player2] = [accounts[0], accounts[1], accounts[2]];

  //first monster ever
  const firstMonsterName = "Mugiwara";
  const firstMonsterLevel = new BigNumber(1);
  const firstMonsterAttackPower = new BigNumber(100);
  const firstMonsterDefencePower = new BigNumber(100);

  before(async () => {
    monsterInstance = await Monster.deployed();
  });

  it("Test: Check first Monster created", async () => {
    const tokenId = 0;
    const receipt = await monsterInstance.monster(tokenId);

    assert(receipt.name === firstMonsterName, "This is not expected Monster Name");
    assert(new BigNumber(receipt.level).isEqualTo(firstMonsterLevel), "This is not expected Monster Level");
    assert(new BigNumber(receipt.attackPower).isEqualTo(firstMonsterAttackPower), "This is not expected Monster Attack Power");
    assert(new BigNumber(receipt.defencePower).isEqualTo(firstMonsterDefencePower), "This is not expected Monster Defence Power");
  });

  it("Test: Check right owner", async () => {
    const tokenId = 0;
    const receipt = await monsterInstance.idToOwner(tokenId);
    assert(receipt === me);
  });

  it("Test: Check new monster creation", async () => {
    const name = "Chopper";
    const level = 1;
    const attackPower = 65;
    const defencePower = 99;
    const monsterId = 1;
    const monstReceipt = await monsterInstance.newMonster(name, level, attackPower, defencePower, {from: player1});

    const mintedTx = await monsterInstance.mint(player1, monsterId);

    truffleAssert.eventEmitted(mintedTx, "Transfer", (obj) => {
      return (obj._from === mintAddress && obj._to === player1 && new BigNumber(obj._tokenId).isEqualTo(new BigNumber(monsterId)));
    });

    assert(monstReceipt, name, level, attackPower, defencePower, "This is not expected info");

    const receipt = await monsterInstance.idToOwner(monsterId);

    assert(receipt === player1, "This is not expected owner");
  });

  it("Test: Check array of ID's", async () => {
    let receipt = await monsterInstance.getBeastsId.call();

    assert(new BigNumber(receipt[0]).isEqualTo(new BigNumber(0)), "This is not expected Id: 0");
    assert(new BigNumber(receipt[1]).isEqualTo(new BigNumber(1)), "This is not expected Id: 1");
  });

  it("Test: Check singleBeast using ID", async () => {
    const tokendId = 1;
    let receipt = await monsterInstance.getSingleBeast.call(tokendId);

    assert(receipt[0] === "Chopper", "The name does not match");
    assert(new BigNumber(receipt[1]).isEqualTo(new BigNumber(1)), "This is not expected Monster Level");
    assert(new BigNumber(receipt[2]).isEqualTo(new BigNumber(65)), "This is not expected Monster Attack Power");
    assert(new BigNumber(receipt[3]).isEqualTo(new BigNumber(99)), "This is not expected Monster Defence Power");
  });

  it("Test: Check the battleMonsters() function", async () => {

    const monster1 = 0;
    const monster2 = 1;
    const receipt = await monsterInstance.battleMonsters(monster1,monster2);

    const result = await monsterInstance.getSingleBeast.call(monster1);
    const result2 = await monsterInstance.getSingleBeast.call(monster2);
    //console.log(result, result2)

    assert(new BigNumber(result[1]).isEqualTo(new BigNumber(2)), "This is not expected Monster Level");
    assert(new BigNumber(result[2]).isEqualTo(new BigNumber(110)), "This is not expected Monster Attack Power");
    assert(new BigNumber(result[3]).isEqualTo(new BigNumber(100)), "This is not expected Monster Defence Power");

  })
});

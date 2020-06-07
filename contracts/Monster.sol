// SPDX-License-Identifier: MIT

pragma solidity >=0.5.0 <0.7.0;
import "./ERC721Contract.sol";


contract Monster is ERC721Contract {
    
    address me;
    uint256 monsterId;

    struct EachMonster {
        uint256 id;
        string name;
        uint level;
        uint256 attackPower;
        uint256 defencePower;
    }
    uint256[] Id;
    mapping(uint256 => EachMonster) public monster;
    mapping(uint256 => address) public idToOwner;

    constructor () public {
        me = msg.sender;
        EachMonster memory monst = EachMonster(monsterId, "Mugiwara", 1, 100, 100);
        monster[monsterId] = monst;
        Id.push(monsterId);
        mint(me, monsterId);
        idToOwner[monsterId] = me;
        monsterId++;
    }

    function newMonster(string calldata _name, uint256 _level, uint256 _attackPower, uint256 _defencePower) external {
        monster[monsterId] = EachMonster(monsterId, _name, _level, _attackPower, _defencePower);
        Id.push(monsterId);
        mint(msg.sender, monsterId);
        idToOwner[monsterId] = msg.sender;
        monsterId++;
    }

    function sendMonster(uint256 _tokenId, address _to) external {
        //check user is sending his own token
        address oldOwner = idToOwner[_tokenId];
        require(msg.sender == oldOwner, "Monster: Not Authorized to send.");
        _safeTransfer(oldOwner, _to, _tokenId, "");
        idToOwner[_tokenId] = _to;
    }

    function getBeastsId() public view returns (uint256[] memory) {
        return Id;
    }

    function getSingleBeast(uint256 _monsterId)
        public view returns (string memory, uint256, uint256, uint256)
    {
        return (monster[_monsterId].name, monster[_monsterId].level, monster[_monsterId].attackPower, monster[_monsterId].defencePower);
    }

    function battleMonsters(uint _monsterId, uint _targetId)  public {
        address player1 = idToOwner[_monsterId];
        address player2 = idToOwner[_targetId];
    
       require(player1 == msg.sender || player2 == msg.sender, "You are not the owner of this monster");

        EachMonster storage monster1 =  monster[_monsterId];
        EachMonster storage monster2 =  monster[_targetId];

        if(monster1.attackPower >= monster2.defencePower) {
            monster1.level += 1;
            monster1.attackPower += 10;
        } else {
            monster2.level += 1;
            monster2.defencePower += 10;
        }
    }
}
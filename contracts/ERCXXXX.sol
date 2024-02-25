// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import "./IERCXXXX.sol";

/** 
 * @dev An extension of the ERC20 standard that accepts ETH into the contract and adds a claim function to withdraw the ETH based on the token balance snapshotted at the time of the deposit. Should premint the total supply to the contract creator.
*/

// TODO: burning mechanism

contract ERCXXXX is ERC20Snapshot, IERCXXXX {

    /**
     * @dev mapping from snapshot id to the deposited ETH amount.
     */
    mapping (uint256 => uint256) private _depositAtSnapshot;
    /**
     * @dev mapping from snapshot id to address to a boolean indicating whether the address has claimed the ETH.
     */
    mapping (uint256 => mapping(address => bool)) private _claimedAtSnapshot;

    /**
     * @dev Constructor for the ERCXXXX contract, should premint the total supply to the contract creator.
     * @param name The name of the token
     * @param symbol The symbol of the token
     * @param supply The total supply of the token
     */
    constructor(string memory name, string memory symbol, uint256 supply) ERC20(name, symbol) {
        _mint(msg.sender, supply);
    }

    /**
     * @dev A function to calculate the amount of ETH claimable by a token holder at certain snapshot.
     * @param account The address of the token holder
     * @param snapshotId The snapshot id
     */
    function claimable(address account, uint256 snapshotId) public view virtual returns (uint256) {
        require(snapshotId > 0, "ERCXXXX: id is 0");
        require(snapshotId <= _getCurrentSnapshotId(), "ERCXXXX: nonexistent id");

        uint256 balance = balanceOfAt(account, snapshotId);
        uint256 totalSupply = totalSupplyAt(snapshotId);
        uint256 deposit = _depositAtSnapshot[snapshotId];
        if (deposit == 0) {
            return 0;
        }
        return balance * deposit / totalSupply;
    }

    /**
     * @dev A function for token holder to claim ETH based on the token balance at certain snapshot.
     * @param snapshotId The snapshot id
     */
    function claim(uint256 snapshotId) public virtual {
        uint256 claimableAmount = claimable(msg.sender, snapshotId);
        require(claimableAmount > 0, "ERCXXXX: no ETH to claim");

        require(!_claimedAtSnapshot[snapshotId][msg.sender], "ERCXXXX: already claimed");
        _claimedAtSnapshot[snapshotId][msg.sender] = true;
        
        (bool success, ) = msg.sender.call{value: claimableAmount}("");
        require(success, "ERCXXXX: claim failed");
    }
    
    /**
     * @dev A function to claim by a list of snapshot ids.
     * @param snapshotIds The list of snapshot ids
     */
    function claimBatch(uint256[] memory snapshotIds) public virtual {
        for (uint256 i = 0; i < snapshotIds.length; i++) {
            claim(snapshotIds[i]);
        }
    }

    /**
     * @dev A snapshot function that also records the deposited ETH amount at the time of the snapshot.
     */

    /**
     * @dev receive() function for the contract to accept ETH, should snapshot the token balance of the sender at the time of deposit.
     */
    receive() external payable virtual override {
        require(msg.value > 0, "ERCXXXX: no ETH to deposit");
        _snapshot(); // TODO: move snapshot to _beforeTokenTransfer
        _depositAtSnapshot[_getCurrentSnapshotId()] += msg.value;
        emit Deposit(_getCurrentSnapshotId(), msg.value);
    }
}
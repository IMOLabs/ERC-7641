// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import "./IERC20M.sol";

/** 
 * @dev An extension of the ERC20 standard that accepts ETH into the contract and adds a claim function to withdraw the ETH based on the token balance snapshotted at the time of the deposit. Should premint the total supply to the contract creator.
*/

contract ERC20M is ERC20Snapshot, IERC20M {
    /**
     * @dev immutable variable for a model id in string defined in the constructor
     */
    bytes32 public immutable modelId;

    /**
     * @dev mapping from snapshot id to the deposited ETH amount.
     */
    mapping (uint256 => uint256) private _depositAtSnapshot;
    /**
     * @dev mapping from snapshot id to address to a boolean indicating whether the address has claimed the ETH.
     */
    mapping (uint256 => mapping(address => bool)) private _claimedAtSnapshot;

    /**
     * @dev Constructor for the ERC20M contract, should premint the total supply to the contract creator.
     * @param name The name of the token
     * @param symbol The symbol of the token
     * @param supply The total supply of the token
     */
    constructor(string memory name, string memory symbol, uint256 supply, string memory modelUri) ERC20(name, symbol) {
        _mint(msg.sender, supply);
        modelId = keccak256(abi.encodePacked(modelUri));
    }

    /**
     * @dev A function to calculate the amount of ETH claimable by a token holder at certain snapshot.
     * @param account The address of the token holder
     * @param snapshotId The snapshot id
     */
    function claimable(address account, uint256 snapshotId) public view virtual returns (uint256) {
        require(snapshotId > 0, "ERC20M: id is 0");
        require(snapshotId <= _getCurrentSnapshotId(), "ERC20M: nonexistent id");

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
        require(claimableAmount > 0, "ERC20M: no ETH to claim");

        require(!_claimedAtSnapshot[snapshotId][msg.sender], "ERC20M: already claimed");
        _claimedAtSnapshot[snapshotId][msg.sender] = true;
        
        (bool success, ) = msg.sender.call{value: claimableAmount}("");
        require(success, "ERC20M: claim failed");
    }

    /**
     * @dev receive() function for the contract to accept ETH, should snapshot the token balance of the sender at the time of deposit.
     */
    receive() external payable virtual override {
        require(msg.value > 0, "ERC20M: no ETH to deposit");
        _snapshot();
        _depositAtSnapshot[_getCurrentSnapshotId()] += msg.value;
        emit Deposit(_getCurrentSnapshotId(), msg.value);
    }
}
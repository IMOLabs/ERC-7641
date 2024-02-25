// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @dev An interface for ERCXXXX, an extension of the ERC20 standard that accepts ETH into the contract and adds a claim function to withdraw the ETH based on the token balance.
 */
interface IERCXXXX is IERC20 {
    /**
     * @dev event for the deposit of ETH, recording snapshot ID and the amount of ETH deposited.
     */
    event Deposit(uint256 indexed snapshotId, uint256 amount);

    /**
     * @dev A function to calculate the amount of ETH claimable by a token holder at certain snapshot.
     * @param account The address of the token holder
     * @param snapshotId The snapshot id
     */
    function claimable(address account, uint256 snapshotId) external view returns (uint256);

    /**
     * @dev A function for token holder to claim ETH based on the token balance at certain snapshot.
     * @param snapshotId The snapshot id
     */
    function claim(uint256 snapshotId) external;

    /**
     * @dev receive() for the contract to accept ETH
     */
    receive() external payable;
}

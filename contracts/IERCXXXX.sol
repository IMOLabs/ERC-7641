// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @dev An interface for ERCXXXX, an extension of the ERC20 standard that accepts revenue tokens into the contract and adds a claim function to withdraw the revenue based on the token balance snapshotted. Only accepts ETH for the base interface.
 * TODO: refine this
 */
interface IERCXXXX is IERC20 {
    /**
     * @dev A function to calculate the amount of ETH claimable by a token holder at certain snapshot.
     * @param account The address of the token holder
     * @param snapshotId The snapshot id
     * @return The amount of revenue token claimable
     */
    function claimable(address account, uint256 snapshotId) external view returns (uint256);

    /**
     * @dev A function for token holder to claim ETH based on the token balance at certain snapshot.
     * @param snapshotId The snapshot id
     */
    function claim(uint256 snapshotId) external;

    /**
     * @dev A function to snapshot the token balance and the claimable revenue token balance
     * @return The snapshot id
     * @notice Should have `require` to avoid ddos attack
     */
    function snapshot() external returns (uint256);

    /**
     * @dev A function to burn tokens and redeem the corresponding amount of revenue token
     * @param amount The amount of token to burn
     */
    function burn(uint256 amount) external;
}

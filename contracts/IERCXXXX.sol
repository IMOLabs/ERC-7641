// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @dev An interface for ERCXXXX, an extension of the ERC20 standard that accepts revenue tokens into the contract and adds a claim function to withdraw the revenue based on the token balance snapshotted
 */
interface IERCXXXX is IERC20 {
    /**
     * @dev A function to calculate the amount of ETH claimable by a token holder at certain snapshot.
     * @param account The address of the token holder
     * @param snapshotId The snapshot id
     * @param token The address of the revenue token
     * @return The amount of revenue token claimable
     */
    function claimable(address account, uint256 snapshotId, address token) external view returns (uint256);

    /**
     * @dev A function for token holder to claim ETH based on the token balance at certain snapshot.
     * @param snapshotId The snapshot id
     */
    function claim(uint256 snapshotId) external;

    /**
     * @notice Should we enforce it in the interface?
     * @dev A function to claim by a list of snapshot ids.
     * @param snapshotIds The list of snapshot ids
     */
    // function claimBatch(uint256[] calldata snapshotIds) external;

    /**
     * @dev A function to add a revenue token address
     * @param token The address of the revenue token
     */
    function addRevenueToken(address token) external;

    /**
     * @notice Should we enforce it in the interface?
     * @dev A function to add multiple revenue token addresses
     * @param tokens The list of revenue token addresses
     */
    // function addRevenueTokens(address[] calldata tokens) external;

    /**
     * @dev A function to snapshot the token balance and the revenue token balance
     * @return The snapshot id
     * @notice Should have `require` to avoid ddos attack
     */
    function snapshot() external returns (uint256);
}

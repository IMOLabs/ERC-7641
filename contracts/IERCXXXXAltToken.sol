// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IERCXXXX.sol";

/**
 * @dev An optional extension of the ERCXXXX standard that accepts other ERC20 revenue tokens into the contract with corresponding claim function, and function to add accepted revenue tokens.
 * TODO: refine this
 */
interface IERCXXXXAltToken is IERCXXXX {
    /**
     * @dev A function to calculate the amount of ERC20 claimable by a token holder at certain snapshot.
     * @param account The address of the token holder
     * @param snapshotId The snapshot id
     * @param token The address of the revenue token
     * @return The amount of revenue token claimable
     */
    function claimableERC20(address account, uint256 snapshotId, address token) external view returns (uint256);

    /**
     * @dev A function to calculate the amount of ETH redeemable by a token holder upon burn
     * @param amount The amount of token to burn
     * @param token The address of the revenue token
     * @return The amount of revenue token redeemable
     */
    function redeemableERC20OnBurn(uint256 amount, address token) external view returns (uint256);

    /**
     * @dev A function to add a revenue token address
     * @param token The address of the revenue token
     */
    function addRevenueToken(address token) external;
}
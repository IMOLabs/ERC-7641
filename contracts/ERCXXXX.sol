// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IERCXXXX.sol";
import "./IERCXXXXAltToken.sol";

/** 
 * @dev An extension of the ERC20 standard that accepts revenue tokens into the contract and adds a claim function to withdraw the revenue based on the token balance snapshotted
*/
contract ERCXXXX is ERC20Snapshot, IERCXXXXAltToken {
    /**
     * @dev last snapshotted block
     */
    uint256 private _lastSnapshotBlock;

    /**
     * @dev percentage claimable
     */
    uint256 immutable public percentClaimable;

    /**
     * @dev list of revenue token addresses
     */
    address[] public revenueTokens;

    /**
     * @dev mapping from revenue token address to a boolean indicating whether the token is added.
     * @notice for ETH, the address is 0x
     */
    mapping (address => bool) private _revenueTokenAdded;

    /**
     * @dev mapping from snapshot id to the deposited revenue token amount(s).
     * @notice for ETH, the address is 0x
     */
    mapping (uint256 => mapping(address => uint256)) private _revenueAtSnapshot;

    /**
     * @dev mapping from revenue token address to pool balance for redemption upon burning
     * @notice for ETH, the address is 0x
     */
    mapping (address => uint256) private _burnPool;

    /**
     * @dev mapping from snapshot id to address to a boolean indicating whether the address has claimed the revenue.
     */
    mapping (uint256 => mapping(address => bool)) private _claimedAtSnapshot;

    /**
     * @dev Constructor for the ERCXXXX contract, premint the total supply to the contract creator.
     * @param name The name of the token
     * @param symbol The symbol of the token
     * @param supply The total supply of the token
     */
    constructor(string memory name, string memory symbol, uint256 supply, uint256 _percentClaimable) ERC20(name, symbol) {
        require(_percentClaimable <= 100, "ERCXXXX: percentage claimable should be less than 100");
        percentClaimable = _percentClaimable;
        _lastSnapshotBlock = block.number;
        _mint(msg.sender, supply);
    }

    /**
     * @dev A function to calculate the amount of ETH claimable by a token holder at certain snapshot.
     * @param account The address of the token holder
     * @param snapshotId The snapshot id
     * @return The amount of revenue token claimable
     */
    function claimable(address account, uint256 snapshotId) public view virtual override returns (uint256) {
        require(snapshotId > 0, "ERCXXXX: id is 0");
        require(snapshotId <= _getCurrentSnapshotId(), "ERCXXXX: nonexistent id");

        uint256 balance = balanceOfAt(account, snapshotId);
        uint256 totalSupply = totalSupplyAt(snapshotId);
        uint256 ethAmount = _revenueAtSnapshot[snapshotId][address(0)];
        return percentClaimable * balance * ethAmount / (100 * totalSupply);
    }

    /**
     * @dev A function to calculate the amount of ERC20 claimable by a token holder at certain snapshot.
     * @param account The address of the token holder
     * @param snapshotId The snapshot id
     * @param token The address of the revenue token, if it is ETH, the address is 0x
     * @return The amount of revenue token claimable
     */
    function claimableERC20(address account, uint256 snapshotId, address token) public view virtual returns (uint256) {
        require(snapshotId > 0, "ERCXXXX: id is 0");
        require(snapshotId <= _getCurrentSnapshotId(), "ERCXXXX: nonexistent id");

        uint256 balance = balanceOfAt(account, snapshotId);
        uint256 totalSupply = totalSupplyAt(snapshotId);
        uint256 tokenAmount = _revenueAtSnapshot[snapshotId][token];
        return percentClaimable * balance * tokenAmount / (100 * totalSupply);
    }

    /**
     * @dev A function for token holder to claim revenue token based on the token balance at certain snapshot.
     * @param snapshotId The snapshot id
     */
    function claim(uint256 snapshotId) public virtual {
        require(!_claimedAtSnapshot[snapshotId][msg.sender], "ERCXXXX: already claimed");
        for (uint256 i = 0; i < revenueTokens.length; i++) {
            uint256 claimableAmount = claimableERC20(msg.sender, snapshotId, revenueTokens[i]);
            if (claimableAmount > 0) {
                IERC20(revenueTokens[i]).transfer(msg.sender, claimableAmount);
            }
        }
        uint256 claimableETH = claimable(msg.sender, snapshotId);
        if (claimableETH > 0) {
            (bool success, ) = msg.sender.call{value: claimableETH}("");
            require(success, "ERCXXXX: ETH transfer failed");
        }
        
        _claimedAtSnapshot[snapshotId][msg.sender] = true;
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
     * @dev A function to add a revenue token address
     * @param token The address of the revenue token
     * @notice example requirement: only holder with over 10% of the total supply can add a revenue token
     */
    function addRevenueToken(address token) public virtual {
        require(balanceOf(msg.sender) > totalSupply() / 10, "ERCXXXX: insufficient balance");
        require(!_revenueTokenAdded[token], "ERCXXXX: token already added");
        revenueTokens.push(token);
        _revenueTokenAdded[token] = true;
    }

    /**
     * @dev A function to add multiple revenue token addresses
     * @param tokens The list of revenue token addresses
     */
    function addRevenueTokens(address[] memory tokens) public virtual {
        for (uint256 i = 0; i < tokens.length; i++) {
            addRevenueToken(tokens[i]);
        }
    }

    /**
     * @dev A snapshot function that also records the deposited ETH amount at the time of the snapshot.
     * @return The snapshot id
     * @notice example requirement: only 1000 blocks after the last snapshot
     */
    function snapshot() external virtual returns (uint256) {
        require(block.number - _lastSnapshotBlock > 1000, "ERCXXXX: snapshot interval is too short");
        uint256 snapshotId = _snapshot();
        for (uint256 i = 0; i < revenueTokens.length; i++) {
            _revenueAtSnapshot[snapshotId][revenueTokens[i]] = IERC20(revenueTokens[i]).balanceOf(address(this)) - _revenueAtSnapshot[snapshotId-1][revenueTokens[i]];
            _burnPool[revenueTokens[i]] += _revenueAtSnapshot[snapshotId][revenueTokens[i]] * (100 - percentClaimable) / 100;
        }
        _revenueAtSnapshot[snapshotId][address(0)] = address(this).balance - _revenueAtSnapshot[snapshotId-1][address(0)];
        _burnPool[address(0)] += _revenueAtSnapshot[snapshotId][address(0)] * (100 - percentClaimable) / 100;
        return snapshotId;
    }

    /**
     * @dev A function to burn tokens and redeem the corresponding amount of revenue token
     * @param amount The amount of token to burn
     */
    function burn(uint256 amount) public virtual override {
        _burn(msg.sender, amount);
        for (uint256 i = 0; i < revenueTokens.length; i++) {
            uint256 redeemAmount = _burnPool[revenueTokens[i]] * amount / totalSupply();
            _burnPool[revenueTokens[i]] -= redeemAmount;
            IERC20(revenueTokens[i]).transfer(msg.sender, redeemAmount);
        }
        uint256 redeemETH = _burnPool[address(0)] * amount / totalSupply();
        _burnPool[address(0)] -= redeemETH;
        (bool success, ) = msg.sender.call{value: redeemETH}("");
        require(success, "ERCXXXX: ETH transfer failed");
    }
    // ?: need public view function for redemption?

    receive() external payable {}
}
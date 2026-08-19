// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

//imports
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Staking is Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuard {
    //state variables
    IERC20 public stakingToken;

    struct Stake{
        uint256 stakedAmount;
        uint256 startTime;
        uint256 lastClaimed;
        bool active;
    }

    mapping (address => Stake[]) public userStakes;

    uint256 public period;
    uint256 public taxRate;
    uint256 public rewardsRate;
    address public devWallet;
    
    uint256 public totalTaxed;
    uint256 public totalStaked;
    uint256 public rewardsPool;

    //events
    event Deposited(address indexed user, uint256 indexed stakeIndex, uint256 amount);
    event ClaimedRewards(address indexed user, uint256 indexed stakeIndex, uint256 amount);
    event Withdrawal(address indexed user, uint256 indexed stakeIndex, uint256 amount);
    event WithdrawStuckTokens(address owner, uint256 amount);
    

    //disbale initializer
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    //initializer

    //core functions

    //getters and setters

    //authorize upgradeable
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

}
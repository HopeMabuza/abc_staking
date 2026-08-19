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

    struct stakeInfo {
        uint256 stakedAmount;
        uint256 startTime;
        uint256 lastClaimed;
        bool active;
    }

    struct Tier{
        uint256 lockDuration;
        uint256 dailyRate;
    }
    Tier public tier;
    
    mapping (address => stakeInfo[]) public userStakes;


    uint256 public period;//in seconds
    uint256 public taxRate;
    uint256 public denominator;
    address public devWallet;
    
    uint256 public totalTaxed;
    uint256 public totalStaked;
    uint256 public rewardsPool;

    //events
    event Stake(address indexed user, uint256 indexed stakeIndex, uint256 amount);
    event ClaimedRewards(address indexed user, uint256 indexed stakeIndex, uint256 amount);
    event Unstake(address indexed user, uint256 indexed stakeIndex, uint256 amount);
    

    //disbale initializer
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    //initializer
    function initialize(address _stakingToken, address _devWallet) public initializer{
        stakingToken = IERC20(_stakingToken);
        devWallet = _devWallet;
        period = 60;
        taxRate = 200;
        denominator = 10000;
        tier = Tier(600, 3000);

    }


    //core functions
    function stake(uint256 _amount) public {}

    function claimRewards(uint256 _stakeIndex) public {}

    function unstake(uint256 _stakeIndex) public {
        //apply transaction fee
    }

    //helper functions
    function calculateRewards(address _user, uint256 _stakeIndex) public view returns(uint256){}

    //admit functions
    function resetTier(uint256 _lockDuration, uint256 _percentageRate) external onlyOwner{
        tier = Tier(_lockDuration, _percentageRate);
    }

    function fundRewardPool(uint256 _amount) external onlyOwner{}

    function resetPeriod(uint256 _period) external onlyOwner {
        period = _period;
    }

    //authorize upgradeable
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

}
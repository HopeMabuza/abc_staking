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

    uint256 public minAmount;
    uint256 public period;//in seconds
    uint256 public taxRate;
    uint256 public denominator;
    address public devWallet;
    
    
    uint256 public totalTaxed;
    uint256 public totalStaked;
    uint256 public rewardPool;

    //events
    event Stake(address indexed user, uint256 indexed stakeIndex, uint256 amount);
    event ClaimedRewards(address indexed user, uint256 indexed stakeIndex, uint256 amount);
    event Unstake(address indexed user, uint256 indexed stakeIndex, uint256 amount);
    event WithdrawalTax(address indexed devWallet, uint256 indexed stakeIndex, uint256 amount);
    event FundRewardPool(address owner, uint256 amount);
    

    //disbale initializer
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    //initializer
    function initialize(address _stakingToken, address _devWallet, uint256 _minAmount) public initializer{
        __Ownable_init();
        __UUPSUpgradeable_init();
        stakingToken = IERC20(_stakingToken);
        devWallet = _devWallet;
        minAmount = _minAmount;
        period = 60; // 1 minute
        taxRate = 200; // 2%
        denominator = 10000; 
        tier = Tier(600, 3000); //10 miutes, 30%

    }


    //core functions
    function stake(uint256 _amount) public nonReentrant{
        require(_amount >= minAmount, "Amount less than minimum amount");

        stakingToken.transferFrom(msg.sender, address(this), _amount);

        userStakes[msg.sender].push(stakeInfo({
        stakedAmount: _amount,
        startTime: block.timestamp,
        lastClaimed: 0,
        active: true
        }));


        uint256 stakeIndex = userStakes[msg.sender].length - 1;
        totalStaked += _amount;

        emit Stake(msg.sender, stakeIndex, _amount);
    }

    function claimRewards(uint256 _stakeIndex) public nonReentrant{
        require(_stakeIndex < userStakes[msg.sender].length, "Stake does not exist");
        stakeInfo storage s = userStakes[msg.sender][_stakeIndex];
        require(s.active, "No active stake");

        uint256 rewards = calculateRewards(msg.sender, _stakeIndex);
        require(rewards > 0, "No rewards to claim");
        require(rewardPool >= rewards, "Insufficient reward pool");

        s.lastClaimed = block.timestamp;
        stakingToken.transfer(msg.sender, rewards);
        rewardPool -= rewards;

        emit ClaimedRewards(msg.sender, _stakeIndex, rewards);
    }

    function unstake(uint256 _stakeIndex) public nonReentrant{
        require(_stakeIndex < userStakes[msg.sender].length, "Stake does not exist");
        stakeInfo storage s = userStakes[msg.sender][_stakeIndex];
        require(s.active, "No active stake");

        uint256 stakeDuration = s.startTime + tier.lockDuration;
        require(block.timestamp >= stakeDuration, "Lock period not over");

        uint256 tax = (s.stakedAmount * taxRate) / denominator;
        stakingToken.transfer(devWallet, tax);
        totalTaxed += tax;
        emit WithdrawalTax(devWallet, _stakeIndex, tax);

        stakingToken.transfer(msg.sender, s.stakedAmount - tax);
        s.active = false;
        totalStaked -= s.stakedAmount;

        emit Unstake(msg.sender, _stakeIndex, s.stakedAmount - tax);
    }

    //helper functions
    function calculateRewards(address _user, uint256 _stakeIndex) public view returns(uint256){
        require(_stakeIndex < userStakes[_user].length, "Stake does not exist");
        stakeInfo memory s = userStakes[_user][_stakeIndex];
        require(s.active, "No active stake");

        uint256 from = s.lastClaimed == 0 ? s.startTime : s.lastClaimed;
        uint256 to = block.timestamp;

        uint256 duration = to > from ? to - from : 0;

        return (s.stakedAmount * tier.dailyRate * duration) / (denominator * period);
    }

    function getUserStakes(address _user) external view returns(stakeInfo[] memory){
        return userStakes[_user];
    }

    //admit functions
    function resetTier(uint256 _lockDuration, uint256 _percentageRate) external onlyOwner{
        tier = Tier(_lockDuration, _percentageRate);
    }

    function setMinAmount(uint256 _minAmount) external onlyOwner{
        minAmount = _minAmount;
    }

    function fundRewardPool(uint256 _amount) external onlyOwner{
        stakingToken.transferFrom(msg.sender, address(this), _amount);
        rewardPool += _amount;
        emit FundRewardPool(msg.sender, _amount);
    }

    function resetPeriod(uint256 _period) external onlyOwner {
        period = _period;
    }

    //authorize upgradeable
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

}
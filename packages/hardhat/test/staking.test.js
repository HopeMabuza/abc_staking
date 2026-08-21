const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Test Staking Contract", function (){
    let owner;
    let devWallet;
    let staker1;
    let staker2;
    let staking;
    let stakingToken;
    const REWARDS_POOL = ethers.parseUnits("20000", 18);
    const MIN_AMOUNT = ethers.parseUnits("10", 18);

    beforeEach(async function() {
        [owner, devWallet, staker1, staker2] = await ethers.getSigners();

        const StakingToken = await ethers.getContractFactory("CZT_TestToken");
        stakingToken = await StakingToken.deploy();
        await stakingToken.waitForDeployment();

        const Staking = await ethers.getContractFactory("Staking");
        staking = await upgrades.deployProxy(
            Staking, [await stakingToken.getAddress(), devWallet.address, MIN_AMOUNT],
            {kind: "uups", unsafeAllow: ["constructor"]}
        );
        await staking.waitForDeployment();

        await stakingToken.mint(owner.address, REWARDS_POOL);
        await stakingToken.approve(await staking.getAddress(), REWARDS_POOL);
        await staking.fundRewardPool(REWARDS_POOL);
    });

    //helpers
    async function mintTokens(user, amount) {
        await stakingToken.mint(user.address, amount);
    }

    async function increaseTime(seconds) {
        await ethers.provider.send("evm_increaseTime", [seconds]);
        await ethers.provider.send("evm_mine", []);
    }

    describe("Deployment", function(){
        it("Should set the correct owner", async function(){
            expect(await staking.owner()).to.equal(owner.address);
        });

        it("Should fund the staking contract with rewards", async function(){
            expect(await stakingToken.balanceOf(await staking.getAddress())).to.equal(REWARDS_POOL);
        });

        it("Should set the correct constant values", async function(){
            expect(await staking.minAmount()).to.equal(MIN_AMOUNT);
            expect(await staking.period()).to.equal(60);
            expect(await staking.taxRate()).to.equal(200);
            expect(await staking.denominator()).to.equal(10000);

        });

        it("Should set the correct tier", async function(){
            const tier = await staking.tier();
            expect(tier.lockDuration).to.equal(600n);
            expect(tier.dailyRate).to.equal(3000n);
        });

        it("Should revert when initialize() is called a second time", async function () {
            await expect(
                staking.initialize(await stakingToken.getAddress(), devWallet.address, MIN_AMOUNT)
            ).to.be.reverted;
        });
    });

    describe("Staking", function(){
        it("Should allow users to stake", async function(){
            const mintAmount = ethers.parseUnits("5000", 18);
            const stakeAmount = ethers.parseUnits("20", 18);

            await mintTokens(staker1, 5000);
            await stakingToken.connect(staker1).approve(await staking.getAddress(), stakeAmount);
            await staking.connect(staker1).stake(stakeAmount);

            expect(await staking.totalStaked()).to.equal(stakeAmount);
            expect(await stakingToken.balanceOf(staker1.address)).to.be.lessThan(mintAmount);
        });

        it("Should update userStake and mapping upon staking", async function(){
            const stakeAmount = ethers.parseUnits("20", 18);

            await mintTokens(staker1, 5000);
            await stakingToken.connect(staker1).approve(await staking.getAddress(), stakeAmount);
            await staking.connect(staker1).stake(stakeAmount)

            const stake = await staking.userStakes(staker1.address, 0);

            expect(stake.stakedAmount).to.equal(stakeAmount);
            expect(stake.active).to.be.true;
        });

        it("Should emit the correct event", async function(){
            const stakeAmount = ethers.parseUnits("20", 18);

            await mintTokens(staker1, 5000);
            await stakingToken.connect(staker1).approve(await staking.getAddress(), stakeAmount);

            await expect(staking.connect(staker1).stake(stakeAmount)).to.emit(staking, "Stake");
        });

        it("Should allow user have multiple stakes", async function(){
            const stakeAmount = ethers.parseUnits("20", 18);

            await mintTokens(staker1, 5000);
            await stakingToken.connect(staker1).approve(await staking.getAddress(), ethers.parseUnits("80", 18));
            await staking.connect(staker1).stake(stakeAmount);
            await staking.connect(staker1).stake(stakeAmount);
            await staking.connect(staker1).stake(stakeAmount);
            await staking.connect(staker1).stake(stakeAmount);

            const stakes = await staking.getUserStakes(staker1.address);
            expect(stakes.length).to.equal(4);
        });

        it("Should revert when the user stakes amount less than minimum amount", async function(){
            const stakeAmount = ethers.parseUnits("5", 18);

            await mintTokens(staker1, 5000);
             await stakingToken.connect(staker1).approve(await staking.getAddress(), stakeAmount);
            await expect(staking.connect(staker1).stake(stakeAmount)).to.be.revertedWith("Amount less than minimum amount");
        });
    });

    describe("Claim rewards", function(){
        const stakeAmount = ethers.parseUnits("20", 18);

        beforeEach(async function(){
            await mintTokens(staker1, ethers.parseUnits("5000", 18));
            await stakingToken.connect(staker1).approve(await staking.getAddress(), stakeAmount);
            await staking.connect(staker1).stake(stakeAmount);
        });

        it("Should accrue rewards after time passes", async function(){
            const balanceBefore = await stakingToken.balanceOf(staker1.address);
            await increaseTime(600);
            await staking.connect(staker1).claimRewards(0);
            const balanceAfter = await stakingToken.balanceOf(staker1.address);
            expect(balanceAfter).to.be.greaterThan(balanceBefore);
        });

        it("Should update lastClaimed after claiming", async function(){
            await increaseTime(600);
            await staking.connect(staker1).claimRewards(0);
            const stake = await staking.userStakes(staker1.address, 0);
            expect(stake.lastClaimed).to.be.greaterThan(0);
        });

        it("Should revert if stake index does not exist", async function(){
            await expect(staking.connect(staker1).claimRewards(99)).to.be.revertedWith("Stake does not exist");
        });

        it("Should revert if stake is not active", async function(){
            await increaseTime(600);
            await staking.connect(staker1).unstake(0);
            await expect(staking.connect(staker1).claimRewards(0)).to.be.revertedWith("No active stake");
        });
    });

    describe("Unstake", function(){

    });

    describe("Helpers", function(){

    });

    describe("Admin function", function(){

    });

    describe("Upgradeability (UUPS)", function(){

    });

})

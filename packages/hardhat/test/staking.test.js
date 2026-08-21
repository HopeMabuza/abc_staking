const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Test Staking Contract", function (){
    let owner;
    let devWallet;
    let staker1;
    let staker2;
    let staking;
    let stakingToken;
    const REWARDS_POOL = 20_000;
    const MIN_AMOUNT = 10;

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

    });

    describe("Claim rewards", function(){

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

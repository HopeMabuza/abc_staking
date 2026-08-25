const {ethers} = require("hardhat");

async function main(){
    const [deployer, user] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    console.log("Deployers address: ", deployerAddress);
    const userAddress = await user.getAddress();
    console.log("User address: ", userAddress);

    const stakingTokenAddress = process.env.TOKEN_ADDRESS;
    const stakingAddress = process.env.STAKING_ADDRESS;

    const stakingToken = await ethers.getContractAt("CZT_TestToken", stakingTokenAddress);
    const staking = await ethers.getContractAt("Staking", stakingAddress);

    // mint tokens to owner and fund rewards pool
    const rewardAmount = ethers.parseUnits("200000", 18);
    // console.log("Minting tokens to owner...");
    // await stakingToken.mint(deployerAddress, rewardAmount);
    console.log("Funding rewards pool...");
    await stakingToken.approve(stakingAddress, rewardAmount);
    await staking.fundRewardPool(rewardAmount);
    console.log("Reward pool: ", ethers.formatUnits(await staking.rewardPool(), 18));

    // mint tokens to user and stake
    const mintAmount = 100n;
    const stakeAmount = ethers.parseUnits("100", 18);
    console.log("Minting tokens to user...");
    await stakingToken.mint(userAddress, mintAmount);
    console.log("User balance: ", ethers.formatUnits(await stakingToken.balanceOf(userAddress), 18));
    console.log("Min amount: ", ethers.formatUnits(await staking.minAmount(), 18));
    console.log("User staking...");
    await stakingToken.connect(user).approve(stakingAddress, stakeAmount);
    await staking.connect(user).stake(stakeAmount);

    // check contract state
    console.log("Total staked: ", ethers.formatUnits(await staking.totalStaked(), 18));
    console.log("Total stakers: ", await staking.totalStakers());
    const userStakes = await staking.getUserStakes(userAddress);
    console.log("User total stakes: ", userStakes.length);
    console.log("User stake amount: ", ethers.formatUnits(userStakes[0].stakedAmount, 18));
    console.log("User stake active: ", userStakes[0].active);
}
main().catch(console.error)

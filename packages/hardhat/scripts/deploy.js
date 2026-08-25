const {ethers, upgrades} = require("hardhat");

async function main(){
    const [deployer, user] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    console.log("Deployers address: ", deployerAddress);

    const stakingToken = process.env.TOKEN_ADDRESS;
    const minimumAmount = ethers.parseUnits("10", 18);


    const Staking = await ethers.getContractFactory("Staking");
    const staking = await upgrades.deployProxy(Staking, [stakingToken, deployerAddress, minimumAmount],
        {kind: "uups"}
    );
    await staking.waitForDeployment();
    const stakingAddress = await staking.getAddress();
    console.log("Proxy address: ", stakingAddress);

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(stakingAddress);
    console.log("Implementaion address: ", implementationAddress);

}
main().catch(console.error)
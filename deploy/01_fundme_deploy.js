/**
 * @param "hre"
 */

const { network } = require("hardhat")
const { networkConfig } = require("../helper-hardhat-config")
require("dotenv").config()
const { verify } = require("../utils/verify")
const deployFun = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    // getNamedAccounts gets the namedAccounts variable configed in hardhat.config.ts file
    const { deployer } = await getNamedAccounts()
    const chainId = (await network.config.chainId) || 31337 // 31337 is the chainId for localhost
    log(networkConfig, chainId, deployer, network, "networkConfig")
    // get the price feed address across chainId
    let priceFeedAddress
    if (chainId === 31337) {
        // get price from deployed contract MockV3Aggregator
        const res = await deployments.get("MockV3Aggregator")
        priceFeedAddress = res.address
        log(
            `"get localhost price feed address successfully ! ${priceFeedAddress}`
        )
    } else {
        priceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }

    log("--------------------------------")
    log("Deploying FundMe contract...")
    const fundme = await deploy("FundMe", {
        from: deployer,
        args: [priceFeedAddress], // pass args to the constructor
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log(`FundMe contract deployed to ${fundme.address}`)
    // only verify non-hardhat
    if (
        chainId !== 31337 &&
        process.env.ETHERSCAN_API_KEY &&
        priceFeedAddress
    ) {
        await verify(fundme.address, [priceFeedAddress])
    }
    log("--------------------------------")
}

module.exports = deployFun
module.exports.tags = ["all", "fundme"]

/**
 * mock something when develop in localhost or hardhat
 * if contract is belong
 */
const { network } = require("hardhat")
const { DECIMALS, INIT_PRICE } = require("../helper-hardhat-config")
const mockFun = async ({ deployments, getNamedAccounts }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    // If we are on a local development network, we need deploy the mock contract
    if (chainId === 31337) {
        log("--------------------------------")
        log("detect mock, deploying mock contract !")
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INIT_PRICE], //  first is the decimals, second is the price feed
        })
        log("Mock contract deployed !")
        log("--------------------------------")
    }
}

module.exports = mockFun
module.exports.tags = ["all", "mock"]

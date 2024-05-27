/**
 * 为不同链上配置不同数据，key为chian id
 */
const networkConfig = {
    11155111: {
        name: "sepolia",
        ethUsdPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    },
    31337: {
        name: "hardhat",
        // ethUsdPriceFeed
    },
}

const DECIMALS = 8
const INIT_PRICE = 200000000000
const developmentChains = ["hardhat", "localhost"]
export { DECIMALS, INIT_PRICE, networkConfig, developmentChains }

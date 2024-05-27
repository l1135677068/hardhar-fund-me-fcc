const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { log } = require("console")

const sendValue = ethers.parseEther("1")
describe("FundMe Contract", async () => {
    let deployer, fundMe, mockV3aggregator
    beforeEach(async () => {
        // getNamedAccounts means get namedAccounts from hardhat.config.ts
        // getSigners means get a list of accounts in the node which is hardhat node here
        const accounts = await ethers.getSigners()
        // Because you are in hardhat node, every address is ok, but first address is the deploy address!
        deployer = accounts[0].address
        // execute the files under deploy foloder who has tags "all"
        await deployments.fixture(["all"])

        // get the fundme deployment transaction
        const fundMeDeployment = await deployments.get("FundMe")
        fundMe = await ethers.getContractAt(
            fundMeDeployment.abi,
            fundMeDeployment.address
        )

        const mockV3AggregatorDepolyments = await deployments.get(
            "MockV3Aggregator"
        )
        mockV3aggregator = await ethers.getContractAt(
            mockV3AggregatorDepolyments.abi,
            mockV3AggregatorDepolyments.address
        )
    })

    // test the constructor addrss
    describe("Constructor", async () => {
        it("sets the aggregator success", async () => {
            const response = await fundMe.getPriceFeedParam()
            assert.equal(response, mockV3aggregator.target)
        })
    })
    // test the fund func
    describe("fund", async () => {
        it("Fails when value is not enough", async () => {
            await expect(fundMe.fund()).to.be.revertedWith(
                "You need to spend more ETH!"
            )
        })
        it("update the addressToAmountFunded", async () => {
            await fundMe.fund({ value: sendValue })
            const response = await fundMe.getAddressToAmountAddress(deployer)
            assert.equal(response.toString(), sendValue.toString())
        })
        it("update the funders", async () => {
            await fundMe.fund({ value: sendValue })
            const response = await fundMe.getFunders(0)

            assert.equal(response.toString(), deployer)
        })
    })
    describe("withdraw", async () => {
        beforeEach(async () => {
            await fundMe.fund({ value: sendValue })
        })
        it("balance change", async () => {
            // arrange
            const startContractBalance = await ethers.provider.getBalance(
                fundMe.getAddress()
            )
            const startDeployBalance = await ethers.provider.getBalance(
                deployer
            )

            // act

            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait(1)

            const { gasUsed, gasPrice } = transactionReceipt
            const gasCost = gasUsed * gasPrice

            const endContractBalance = await ethers.provider.getBalance(
                fundMe.getAddress()
            )
            const endDeployBalance = await ethers.provider.getBalance(deployer)
            // assert
            // finally, the contract balance is 0
            assert.equal(endContractBalance.toString(), 0)

            assert.equal(
                (startContractBalance + startDeployBalance).toString(),
                (endDeployBalance + gasCost).toString()
            )
        })
        it("multi sender", async () => {
            const accounts = await ethers.getSigners()
            for (let i = 0; i < 7; i++) {
                // connect contract
                await fundMe.connect(accounts[i])
            }
            await fundMe.fund({ value: sendValue })
            // get money
            // arrange
            const startContractBalance = await ethers.provider.getBalance(
                fundMe.getAddress()
            )
            const startDeployBalance = await ethers.provider.getBalance(
                deployer
            )
            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait(1)

            const { gasUsed, gasPrice } = transactionReceipt
            const gasCost = gasUsed * gasPrice

            const endContractBalance = await ethers.provider.getBalance(
                fundMe.getAddress()
            )
            const endDeployBalance = await ethers.provider.getBalance(deployer)
            // assert
            // finally, the contract balance is 0
            assert.equal(endContractBalance.toString(), 0)

            assert.equal(
                (startContractBalance + startDeployBalance).toString(),
                (endDeployBalance + gasCost).toString()
            )
            // funders should be empty after withdraw func called
            await expect(fundMe.getFunders(0)).to.be.reverted
            // every address in addressToAmountFunded should be zero
            // other address call withdraw func will fail
            for (let i = 1; i < 7; i++) {
                await fundMe.connect(accounts[i])
                assert(fundMe.getAddressToAmountAddress(accounts[i].address), 0)
            }
        })
        it("only owner can withdraw", async () => {
            const accounts = await ethers.getSigners()
            const fundMeContract = await fundMe.connect(accounts[1])
            expect(fundMeContract.withdraw()).to.be.revertedWith(
                "FundeMe__NotOwner"
            )
        })
    })
})

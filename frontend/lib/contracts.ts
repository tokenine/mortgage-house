export const CONTRACTS = {
    mortgageBond: {
        address: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9" as const,
        abi: require("./abis/MortgageBond.json").abi,
    },
    mockToken: {
        address: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9" as const,
        abi: require("./abis/MockERC20.json").abi,
    },
}

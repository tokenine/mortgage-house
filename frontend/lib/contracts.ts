export const CONTRACTS = {
    mortgageBond: {
        address: "0x5F5d42A41E678701a241b5bb1944CF3919346445" as const,
        abi: require("./abis/MortgageBond.json").abi,
    },
    mockToken: {
        address: "0x19b4D862Df0b30691D61674847657c34a60cFEE8" as const,
        abi: require("./abis/MockERC20.json").abi,
    },
}

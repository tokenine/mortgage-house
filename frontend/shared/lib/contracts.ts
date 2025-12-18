/**
 * @deprecated This file is deprecated. Use lib/projects.ts instead.
 * Contract configurations are now sourced from data/projects.json via:
 * - getMortgageBondConfig(projectId)
 * - getPaymentTokenConfig(projectId)
 * 
 * This export is kept temporarily for legacy debug components only.
 * Do not use in production code.
 */
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

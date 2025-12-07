import { useReadContract, useAccount } from "wagmi"
import { CONTRACTS } from "@/lib/contracts"

export function useMortgageBond() {
    const { address } = useAccount()

    // 1. Global Stats
    const { data: issuer } = useReadContract({
        ...CONTRACTS.mortgageBond,
        functionName: "issuer",
    })

    const { data: fundingCap } = useReadContract({
        ...CONTRACTS.mortgageBond,
        functionName: "FUNDING_CAP",
    })

    const { data: totalRaised } = useReadContract({
        ...CONTRACTS.mortgageBond,
        functionName: "totalPrincipalRaised",
    })

    const { data: isFundingActive } = useReadContract({
        ...CONTRACTS.mortgageBond,
        functionName: "isFundingActive",
    })

    // 2. User Specific Stats
    const { data: investorInfo, refetch: refetchInvestor } = useReadContract({
        ...CONTRACTS.mortgageBond,
        functionName: "investors",
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        },
    })

    const { data: pendingRewards, refetch: refetchRewards } = useReadContract({
        ...CONTRACTS.mortgageBond,
        functionName: "getPendingRewards",
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        },
    })

    return {
        issuer,
        fundingCap,
        totalRaised,
        isFundingActive,
        investorInfo, // [shares, interestDebt, principalDebt]
        pendingRewards, // [interest, principal]
        refetchUserStats: () => {
            refetchInvestor()
            refetchRewards()
        }
    }
}

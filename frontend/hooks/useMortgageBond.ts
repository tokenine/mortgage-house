import { useReadContract, useAccount } from "wagmi"
import { getMortgageBondConfig } from "@/lib/projects"
import { useCurrentProject } from "@/contexts/ProjectContext"

export function useMortgageBond(projectId?: string) {
    const { address } = useAccount()
    const { projectId: contextProjectId } = useCurrentProject()
    
    // Use provided projectId or fallback to context
    const activeProjectId = projectId || contextProjectId
    
    // Get contract config from projects.json
    const contractConfig = activeProjectId ? getMortgageBondConfig(activeProjectId) : null

    // 1. Global Stats
    const { data: issuer } = useReadContract({
        address: contractConfig?.address,
        abi: contractConfig?.abi,
        functionName: "issuer",
        query: {
            enabled: !!contractConfig,
        },
    })

    const { data: fundingCap } = useReadContract({
        address: contractConfig?.address,
        abi: contractConfig?.abi,
        functionName: "FUNDING_CAP",
        query: {
            enabled: !!contractConfig,
        },
    })

    const { data: totalRaised } = useReadContract({
        address: contractConfig?.address,
        abi: contractConfig?.abi,
        functionName: "totalPrincipalRaised",
        query: {
            enabled: !!contractConfig,
        },
    })

    const { data: isFundingActive } = useReadContract({
        address: contractConfig?.address,
        abi: contractConfig?.abi,
        functionName: "isFundingActive",
        query: {
            enabled: !!contractConfig,
        },
    })

    // 2. User Specific Stats
    const { data: investorInfo, refetch: refetchInvestor } = useReadContract({
        address: contractConfig?.address,
        abi: contractConfig?.abi,
        functionName: "investors",
        args: address ? [address] : undefined,
        query: {
            enabled: !!address && !!contractConfig,
        },
    })

    const { data: pendingRewards, refetch: refetchRewards } = useReadContract({
        address: contractConfig?.address,
        abi: contractConfig?.abi,
        functionName: "getPendingRewards",
        args: address ? [address] : undefined,
        query: {
            enabled: !!address && !!contractConfig,
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

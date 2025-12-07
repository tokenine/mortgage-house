"use client"

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { formatUnits } from "viem"
import { CONTRACTS } from "@/lib/contracts"
import { useMortgageBond } from "@/hooks/useMortgageBond"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Wallet } from "lucide-react"

export function UserDashboard() {
    const { address } = useAccount()
    const { investorInfo, pendingRewards, refetchUserStats } = useMortgageBond()

    const { writeContract, data: txHash, isPending } = useWriteContract()
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

    if (isSuccess) {
        refetchUserStats()
    }

    if (!address) {
        return (
            <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                    Connect your wallet to view your portfolio
                </CardContent>
            </Card>
        )
    }

    // Parse Data
    // Cast to expected types
    const info = investorInfo as [bigint, bigint, bigint] | undefined
    const rewards = pendingRewards as [bigint, bigint] | undefined

    const shares = info ? Number(formatUnits(info[0], 6)) : 0
    const interest = rewards ? Number(formatUnits(rewards[0], 6)) : 0
    const principal = rewards ? Number(formatUnits(rewards[1], 6)) : 0
    const totalRewards = interest + principal

    const handleClaim = () => {
        writeContract({
            ...CONTRACTS.mortgageBond,
            functionName: "claimRewards",
            args: []
        })
    }

    const isLoading = isPending || isConfirming

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">My Bond Shares</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{shares.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                        Active holdings
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Unclaimed Rewards</CardTitle>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        className="h-4 w-4 text-muted-foreground"
                    >
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-500">
                        ${totalRewards.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {interest > 0 && <span>Interest: {interest.toFixed(2)} </span>}
                        {principal > 0 && <span>Principal: {principal.toFixed(2)}</span>}
                    </p>
                    {totalRewards > 0 && (
                        <Button size="sm" className="mt-2 w-full" onClick={handleClaim} disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Claim Now
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* 3rd Card could be Total Earnings or something else, skipping for now */}
        </div>
    )
}

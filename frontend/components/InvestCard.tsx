"use client"

import { useState, useEffect } from "react"
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { formatUnits, parseUnits } from "viem"
import { CONTRACTS } from "@/lib/contracts"
import { useMortgageBond } from "@/hooks/useMortgageBond"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

export function InvestCard() {
    const { address } = useAccount()
    const { fundingCap, totalRaised, isFundingActive, refetchUserStats } = useMortgageBond()
    const [amount, setAmount] = useState("")

    const { writeContract: writeApprove, data: approveTxHash, isPending: isApproving } = useWriteContract()
    const { writeContract: writeInvest, data: investTxHash, isPending: isInvesting } = useWriteContract()

    // Wait for Tx
    const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveTxHash })
    const { isLoading: isInvestConfirming, isSuccess: isInvestSuccess } = useWaitForTransactionReceipt({ hash: investTxHash })

    // Check Allowance
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        ...CONTRACTS.mockToken,
        functionName: "allowance",
        args: address ? [address, CONTRACTS.mortgageBond.address] : undefined,
        query: {
            enabled: !!address,
        }
    })

    useEffect(() => {
        if (isApproveSuccess) {
            refetchAllowance()
        }
    }, [isApproveSuccess, refetchAllowance])

    useEffect(() => {
        if (isInvestSuccess) {
            setAmount("")
            refetchUserStats()
        }
    }, [isInvestSuccess, refetchUserStats])

    // Calculations
    const cap = fundingCap ? Number(formatUnits(fundingCap, 6)) : 0
    const raised = totalRaised ? Number(formatUnits(totalRaised, 6)) : 0
    const progress = cap > 0 ? (raised / cap) * 100 : 0

    const investAmountObj = amount ? parseUnits(amount, 6) : BigInt(0)
    const currentAllowance = (allowance as bigint) ?? BigInt(0)
    const needsApproval = investAmountObj > currentAllowance

    const handleApprove = () => {
        writeApprove({
            ...CONTRACTS.mockToken,
            functionName: "approve",
            args: [CONTRACTS.mortgageBond.address, investAmountObj],
        })
    }

    const handleInvest = () => {
        writeInvest({
            ...CONTRACTS.mortgageBond,
            functionName: "invest",
            args: [investAmountObj],
        })
    }

    const isLoading = isApproving || isApproveConfirming || isInvesting || isInvestConfirming

    if (!isFundingActive) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Investment Closed</CardTitle>
                    <CardDescription>Funding round is no longer active.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Invest in Mortgage Bond</CardTitle>
                <CardDescription>Earn reliable yield backed by real estate.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Total Raised</span>
                        <span>{raised.toLocaleString()} / {cap.toLocaleString()} USDT</span>
                    </div>
                    <Progress value={progress} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="amount">Investment Amount (USDT)</Label>
                    <Input
                        id="amount"
                        type="number"
                        placeholder="1000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
            </CardContent>
            <CardFooter>
                {needsApproval ? (
                    <Button className="w-full" onClick={handleApprove} disabled={!amount || isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Approve USDT
                    </Button>
                ) : (
                    <Button className="w-full" onClick={handleInvest} disabled={!amount || isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Confirm Investment
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}

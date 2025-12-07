"use client"

import { useState, useEffect } from "react"
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseUnits } from "viem"
import { CONTRACTS } from "@/lib/contracts"
import { useMortgageBond } from "@/hooks/useMortgageBond"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ShieldAlert } from "lucide-react"

export function AdminPanel() {
    const { address } = useAccount()
    const { issuer, isFundingActive } = useMortgageBond()

    // State
    const [interestAmount, setInterestAmount] = useState("")
    const [principalAmount, setPrincipalAmount] = useState("")

    // Writes
    const { writeContract: writeApprove, data: approveTx, isPending: isApproving } = useWriteContract()
    const { writeContract: writeDistributeInt, data: intTx, isPending: isIntPending } = useWriteContract()
    const { writeContract: writeDistributePrin, data: prinTx, isPending: isPrinPending } = useWriteContract()
    const { writeContract: writeWithdraw, data: withTx, isPending: isWithPending } = useWriteContract()

    // Wait
    const { isSuccess: isApproveSuccess, isLoading: isApproveConfirming } = useWaitForTransactionReceipt({ hash: approveTx })
    const { isSuccess: isIntSuccess, isLoading: isIntConfirming } = useWaitForTransactionReceipt({ hash: intTx })
    const { isSuccess: isPrinSuccess, isLoading: isPrinConfirming } = useWaitForTransactionReceipt({ hash: prinTx })
    const { isSuccess: isWithSuccess, isLoading: isWithConfirming } = useWaitForTransactionReceipt({ hash: withTx })

    // Read Allowance
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        ...CONTRACTS.mockToken,
        functionName: "allowance",
        args: address ? [address, CONTRACTS.mortgageBond.address] : undefined,
    })

    // Effects
    useEffect(() => {
        if (isApproveSuccess) refetchAllowance()
    }, [isApproveSuccess, refetchAllowance])

    useEffect(() => {
        if (isIntSuccess) setInterestAmount("")
        if (isPrinSuccess) setPrincipalAmount("")
    }, [isIntSuccess, isPrinSuccess])

    if (!address || !issuer || address.toLowerCase() !== (issuer as string).toLowerCase()) {
        return null // Hidden for non-admins
    }

    const currentAllowance = (allowance as bigint) ?? BigInt(0)

    const handleDistribute = (type: "interest" | "principal") => {
        const valueStr = type === "interest" ? interestAmount : principalAmount
        if (!valueStr) return

        const valueRaw = parseUnits(valueStr, 6)

        // Check allowance
        // Note: The contract pulls a PRO-RATA amount (amountForInvestors), not the full totalDeclared if strictly following logic,
        // but it declares the total. 
        // Logic: amountForInvestors = (totalDeclared * totalPrincipalRaised) / CAP
        // Safe bet: Approve the full amount just in case, or calculate it. 
        // For simple UX, we approve the full amount declared.

        if (valueRaw > currentAllowance) {
            writeApprove({
                ...CONTRACTS.mockToken,
                functionName: "approve",
                args: [CONTRACTS.mortgageBond.address, valueRaw]
            })
            return
        }

        if (type === "interest") {
            writeDistributeInt({
                ...CONTRACTS.mortgageBond,
                functionName: "distributeInterest",
                args: [valueRaw]
            })
        } else {
            writeDistributePrin({
                ...CONTRACTS.mortgageBond,
                functionName: "distributePrincipalRepayment",
                args: [valueRaw]
            })
        }
    }

    const handleWithdraw = () => {
        writeWithdraw({
            ...CONTRACTS.mortgageBond,
            functionName: "withdrawPrincipal",
            args: []
        })
    }

    const isLoading = isApproving || isApproveConfirming || isIntPending || isIntConfirming || isPrinPending || isPrinConfirming || isWithPending || isWithConfirming

    return (
        <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-destructive" />
                    <CardTitle>Issuer Admin Panel</CardTitle>
                </div>
                <CardDescription>Manage bond lifecycle and repayments.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* INTEREST REPAYMENT */}
                <div className="grid gap-2">
                    <Label>Distribute Interest Payment (USDT)</Label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Amount"
                            type="number"
                            value={interestAmount}
                            onChange={e => setInterestAmount(e.target.value)}
                        />
                        <Button
                            variant="secondary"
                            onClick={() => handleDistribute("interest")}
                            disabled={isLoading || !interestAmount}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Distribute
                        </Button>
                    </div>
                </div>

                {/* PRINCIPAL REPAYMENT */}
                <div className="grid gap-2">
                    <Label>Distribute Principal Repayment (USDT)</Label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Amount"
                            type="number"
                            value={principalAmount}
                            onChange={e => setPrincipalAmount(e.target.value)}
                        />
                        <Button
                            variant="secondary"
                            onClick={() => handleDistribute("principal")}
                            disabled={isLoading || !principalAmount}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Repay
                        </Button>
                    </div>
                </div>

                <div className="border-t pt-4">
                    <h4 className="mb-2 text-sm font-medium">Lifecycle Actions</h4>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleWithdraw}
                        disabled={!isFundingActive || isLoading}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Withdraw Principal & Close Funding
                    </Button>
                    {!isFundingActive && <span className="ml-2 text-xs text-muted-foreground">Funding Closed</span>}
                </div>

            </CardContent>
        </Card>
    )
}

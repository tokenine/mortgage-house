"use client"

import { useState, useEffect } from "react"
import { useAccount, useReadContract, useWriteContract } from "wagmi"
import { formatUnits, parseUnits } from "viem"
import { CONTRACTS } from "@/lib/contracts"
import { useMortgageBond } from "@/hooks/useMortgageBond"
import { useTransactionWithToast } from "@/hooks/useTransactionState"
import { useFormValidation } from "@/hooks/useFormValidation"
import { validationRules } from "@/lib/validation"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { AnimatedCard } from "@/components/ui/animated-card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function InvestCard() {
    const { address } = useAccount()
    const { fundingCap, totalRaised, isFundingActive, refetchUserStats } = useMortgageBond()
    
    const form = useFormValidation({
        initialValues: { amount: "" },
        validationRules: {
            amount: {
                ...validationRules.required,
                ...validationRules.usdtAmount,
                custom: (value: string) => {
                    const num = parseFloat(value)
                    const cap = fundingCap ? Number(formatUnits(fundingCap, 6)) : 0
                    const raised = totalRaised ? Number(formatUnits(totalRaised, 6)) : 0
                    const remaining = cap - raised
                    
                    if (isNaN(num) || num <= 0) {
                        return "Must be a valid amount"
                    }
                    if (num > remaining) {
                        return `Amount exceeds remaining capacity: $${remaining.toLocaleString()}`
                    }
                    if (num > 1000000) {
                        return "Amount exceeds maximum limit"
                    }
                }
            }
        }
    })

    const { writeContract: writeApprove, data: approveTxHash, isPending: isApproving } = useWriteContract()
    const { writeContract: writeInvest, data: investTxHash, isPending: isInvesting } = useWriteContract()

    // Transaction states with toast notifications
    const approveState = useTransactionWithToast(
        approveTxHash,
        "Approving token transfer...",
        "Token approved successfully!"
    )
    const investState = useTransactionWithToast(
        investTxHash,
        "Processing investment...",
        "Investment successful!"
    )

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
        if (approveState.isSuccess) {
            refetchAllowance()
        }
    }, [approveState.isSuccess, refetchAllowance])

    useEffect(() => {
        if (investState.isSuccess) {
            setAmount("")
            refetchUserStats()
        }
    }, [investState.isSuccess, refetchUserStats])

    // Calculations
    const cap = fundingCap ? Number(formatUnits(fundingCap, 6)) : 0
    const raised = totalRaised ? Number(formatUnits(totalRaised, 6)) : 0
    const progress = cap > 0 ? (raised / cap) * 100 : 0

    const amount = form.fields.amount.value
    const investAmountObj = amount ? parseUnits(amount, 6) : BigInt(0)
    const currentAllowance = (allowance as bigint) ?? BigInt(0)
    const needsApproval = investAmountObj > currentAllowance

    const handleApprove = () => {
        form.validateField("amount")
        if (!form.isValid) {
            return
        }
        
        writeApprove({
            ...CONTRACTS.mockToken,
            functionName: "approve",
            args: [CONTRACTS.mortgageBond.address, investAmountObj],
        })
    }

    const handleInvest = () => {
        form.validateField("amount")
        if (!form.isValid) {
            return
        }
        
        writeInvest({
            ...CONTRACTS.mortgageBond,
            functionName: "invest",
            args: [investAmountObj],
        })
    }

    const isLoading = isApproving || approveState.isConfirming || isInvesting || investState.isConfirming

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
        <AnimatedCard className="w-full">
            <CardHeader>
                <CardTitle>Invest in Mortgage Bond</CardTitle>
                <CardDescription>Earn reliable yield backed by real estate.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {form.fields.amount.error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{form.fields.amount.error}</AlertDescription>
                    </Alert>
                )}
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
                        onChange={(e) => form.setValue("amount", e.target.value)}
                        disabled={isLoading}
                    />
                </div>
            </CardContent>
            <CardFooter>
                {needsApproval ? (
                    <AnimatedButton className="w-full" onClick={handleApprove} disabled={!amount || isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Approve USDT
                    </AnimatedButton>
                ) : (
                    <AnimatedButton className="w-full" onClick={handleInvest} disabled={!amount || isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Confirm Investment
                    </AnimatedButton>
                )}
            </CardFooter>
        </AnimatedCard>
    )
}

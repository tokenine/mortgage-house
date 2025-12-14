"use client"

import { useEffect, useCallback, useRef } from "react"
import { useAccount, useReadContract, useWriteContract } from "wagmi"
import { parseUnits } from "viem"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getMaxInvestableAmount, validationRules } from "@/lib/validation"
import { getMortgageBondConfig, getPaymentTokenConfig } from "@/lib/projects"
import { useTransactionWithToast } from "@/hooks/useTransactionState"
import { useFormValidation } from "@/hooks/useFormValidation"
import type { MortgageProject } from "@/types/project"

interface InvestmentFormProps {
  project: MortgageProject
  userBalance: bigint
  fundingCap: number
  totalRaised: number
  isFundingActive: boolean
  onInvestmentSuccess?: () => Promise<void>
}

export function InvestmentForm({
  project,
  userBalance,
  fundingCap,
  totalRaised,
  isFundingActive,
  onInvestmentSuccess,
}: InvestmentFormProps) {
  const { address } = useAccount()
  const decimals = project.onChain?.decimals ?? 6
  const hasCalledSuccess = useRef(false)
  
  // Get contract configs from project
  const projectId = typeof project.id === 'string' ? project.id : String(project.id)
  const mortgageBondConfig = getMortgageBondConfig(projectId)
  const paymentTokenConfig = getPaymentTokenConfig(projectId)

  const form = useFormValidation({
    initialValues: { amount: "" },
    validationRules: {
      amount: {
        ...validationRules.required,
        ...validationRules.usdtAmount,
        custom: (value: string) => {
          const num = parseFloat(value)
          const remaining = Math.max(fundingCap - totalRaised, 0)
          const balance = Number(userBalance) / 1e6

          if (isNaN(num) || num <= 0) return "Must be a valid amount"
          if (num > remaining) return `Amount exceeds remaining capacity: $${remaining.toLocaleString()}`
          if (num > balance) return "Insufficient wallet balance"
        },
      },
    },
  })

  const { writeContract: writeApprove, data: approveTxHash, isPending: isApproving } = useWriteContract()
  const { writeContract: writeInvest, data: investTxHash, isPending: isInvesting } = useWriteContract()

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

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: paymentTokenConfig.address,
    abi: paymentTokenConfig.abi,
    functionName: "allowance",
    args: address ? [address, mortgageBondConfig.address] : undefined,
    query: { enabled: !!address },
  })

  useEffect(() => {
    if (approveState.isSuccess) {
      refetchAllowance()
    }
  }, [approveState.isSuccess, refetchAllowance])

  // ✅ FIXED: Use ref to prevent infinite loop - only call once per success
  useEffect(() => {
    if (investState.isSuccess && !hasCalledSuccess.current) {
      hasCalledSuccess.current = true
      
      // Clear form
      form.setValue("amount", "")
      
      // Call parent callback without awaiting (fire and forget)
      if (onInvestmentSuccess) {
        onInvestmentSuccess().catch(err => {
          console.error("onInvestmentSuccess failed", err)
        })
      }
    }
  }, [investState.isSuccess]) // ✅ Only depend on investState.isSuccess

  // Reset the ref when investment state changes (allow next success call)
  useEffect(() => {
    if (!investState.isSuccess) {
      hasCalledSuccess.current = false
    }
  }, [investState.isSuccess])

  const amount = form.fields.amount.value
  const remaining = Math.max(fundingCap - totalRaised, 0)
  const maxAmount = getMaxInvestableAmount(fundingCap, totalRaised, userBalance)
  const investAmount = amount ? parseUnits(amount, decimals) : BigInt(0)
  const currentAllowance = (allowance as bigint) ?? BigInt(0)
  const needsApproval = investAmount > currentAllowance
  const isFunded = remaining <= 0
  const isLoading = isApproving || approveState.isConfirming || isInvesting || investState.isConfirming
  const txError = approveState.error || investState.error

  const handleMaxClick = () => {
    form.setValue("amount", maxAmount.toString())
  }

  const handleApprove = () => {
    const result = form.validateField("amount")
    if (!result.isValid) return

    writeApprove({
      address: paymentTokenConfig.address,
      abi: paymentTokenConfig.abi,
      functionName: "approve",
      args: [mortgageBondConfig.address, investAmount],
    })
  }

  const handleInvest = () => {
    const result = form.validateField("amount")
    if (!result.isValid) return

    writeInvest({
      address: mortgageBondConfig.address,
      abi: mortgageBondConfig.abi,
      functionName: "invest",
      args: [investAmount],
    })
  }

  if (!isFundingActive || isFunded) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Funding Closed</CardTitle>
          <CardDescription className="text-muted-foreground">
            This project is not accepting new investments at the moment.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Invest in This Property</CardTitle>
        <CardDescription className="text-muted-foreground">
          Minimum: 1 USDT • Remaining capacity: ${remaining.toLocaleString()} USDT
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {form.fields.amount.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{form.fields.amount.error}</AlertDescription>
          </Alert>
        )}

        {txError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{txError.message}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <label htmlFor="amount" className="text-sm font-medium text-foreground">
            Investment Amount (USDT)
          </label>
          <div className="flex gap-2">
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => form.setValue("amount", e.target.value)}
              disabled={isLoading}
              step="0.01"
              min="1"
              max={maxAmount}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleMaxClick}
              disabled={isLoading || maxAmount === 0}
            >
              Max
            </Button>
          </div>
          {amount && (
            <p className="text-xs text-muted-foreground">
              Available balance: ${(Number(userBalance) / 1e6).toFixed(2)} USDT
            </p>
          )}
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

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Coins, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { AdminOperations, AdminPanelReadState } from "@/specs/003-admin-blockchain-integration/contracts"

interface RepaymentPanelProps {
  selectedBondName: string
  investorCount: number
  operations: AdminOperations
  state: AdminPanelReadState
}

export function RepaymentPanel({
  selectedBondName,
  investorCount,
  operations,
  state,
}: RepaymentPanelProps) {
  const [interestAmount, setInterestAmount] = useState("")
  const [principalAmount, setPrincipalAmount] = useState("")

  const handleDistributeInterest = () => {
    const validation = operations.distributeInterest.validate({
      amount: interestAmount,
      type: "interest"
    })
    
    if (!validation.isValid) {
      toast.error(validation.error)
      return
    }
    
    operations.distributeInterest.execute(validation.amountInWei!)
  }

  const handleDistributePrincipal = () => {
    const validation = operations.distributePrincipal.validate({
      amount: principalAmount,
      type: "principal"
    })
    
    if (!validation.isValid) {
      toast.error(validation.error)
      return
    }
    
    operations.distributePrincipal.execute(validation.amountInWei!)
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          Distribute Payments
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Distribute interest and principal repayments to bondholders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Interest Distribution Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="interest-amount" className="text-foreground">
              Interest Amount (USDT)
            </Label>
            <Input
              id="interest-amount"
              type="number"
              placeholder="Enter interest amount..."
              value={interestAmount}
              onChange={(e) => setInterestAmount(e.target.value)}
              className="bg-muted border-border text-foreground"
              disabled={operations.distributeInterest.isProcessing}
            />
          </div>

          <Button
            onClick={handleDistributeInterest}
            disabled={!interestAmount || operations.distributeInterest.isProcessing || !operations.distributeInterest.canExecute}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {operations.distributeInterest.isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Distribute Interest
              </>
            )}
          </Button>
        </div>

        {/* Principal Repayment Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="principal-amount" className="text-foreground">
              Principal Repayment (USDT)
            </Label>
            <Input
              id="principal-amount"
              type="number"
              placeholder="Enter principal repayment amount..."
              value={principalAmount}
              onChange={(e) => setPrincipalAmount(e.target.value)}
              className="bg-muted border-border text-foreground"
              disabled={operations.distributePrincipal.isProcessing}
            />
          </div>

          <Button
            onClick={handleDistributePrincipal}
            disabled={!principalAmount || operations.distributePrincipal.isProcessing || !operations.distributePrincipal.canExecute}
            variant="outline" 
            className="w-full bg-transparent"
          >
            {operations.distributePrincipal.isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Coins className="mr-2 h-4 w-4" />
                Distribute Principal
              </>
            )}
          </Button>
        </div>

        {/* Info Section */}
        <div className="rounded-lg bg-muted p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Selected Bond: {selectedBondName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-muted-foreground">{investorCount} investors will receive pro-rata</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-info" />
            <span className="text-muted-foreground">USDT Allowance: {(Number(state.usdtAllowance) / 1e6).toFixed(2)} USDT</span>
          </div>
          {state.isLoading && (
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Loading contract state...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

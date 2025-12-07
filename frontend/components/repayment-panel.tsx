"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Coins, Send, CheckCircle2, AlertCircle } from "lucide-react"

interface RepaymentPanelProps {
  selectedBondName: string
  investorCount: number
  repaymentAmount: string
  onRepaymentAmountChange: (amount: string) => void
  onMintRepayment: () => void
  onDistributeInterest: () => void
}

export function RepaymentPanel({
  selectedBondName,
  investorCount,
  repaymentAmount,
  onRepaymentAmountChange,
  onMintRepayment,
  onDistributeInterest,
}: RepaymentPanelProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          Mint & Distribute Repayment
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Mint repayment tokens and distribute to bondholders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-foreground">
            Repayment Amount (USDT)
          </Label>
          <Input
            id="amount"
            type="number"
            placeholder="Enter amount..."
            value={repaymentAmount}
            onChange={(e) => onRepaymentAmountChange(e.target.value)}
            className="bg-muted border-border text-foreground"
          />
        </div>

        <div className="space-y-2">
          <Button
            onClick={onMintRepayment}
            disabled={!repaymentAmount}
            className="w-full bg-primary hover:bg-primary/90"
          >
            <Coins className="mr-2 h-4 w-4" />
            Mint Repayment Tokens
          </Button>

          <Button onClick={onDistributeInterest} variant="outline" className="w-full bg-transparent">
            <Send className="mr-2 h-4 w-4" />
            Distribute Interest
          </Button>
        </div>

        <div className="rounded-lg bg-muted p-3 space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Selected Bond: {selectedBondName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-muted-foreground">{investorCount} investors will receive pro-rata</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

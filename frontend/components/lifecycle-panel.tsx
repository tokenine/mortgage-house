"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lock, Loader2 } from "lucide-react"
import type { AdminOperations, AdminPanelReadState } from "@/specs/003-admin-blockchain-integration/contracts"

interface BondData {
  id: string
  name: string
  status: string
  nextPayment: string
}

interface LifecyclePanelProps {
  bonds: BondData[]
  operations: AdminOperations
  state: AdminPanelReadState
}

export function LifecyclePanel({ bonds, operations, state }: LifecyclePanelProps) {
  const handleWithdrawPrincipal = () => {
    operations.withdrawPrincipal.execute()
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          Bond Lifecycle Controls
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Manage bond funding and principal withdrawal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {bonds.map((bond) => (
            <div key={bond.id} className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{bond.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Status: {bond.status} • Next: {bond.nextPayment}
                  </p>
                </div>
                <Badge
                  variant={bond.status === "active" ? "default" : "secondary"}
                  className={
                    bond.status === "active" ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
                  }
                >
                  {bond.status}
                </Badge>
              </div>

              {bond.status === "funding" && (
                <Button
                  onClick={handleWithdrawPrincipal}
                  size="sm"
                  disabled={!operations.withdrawPrincipal.canExecute || operations.withdrawPrincipal.isProcessing}
                  className="w-full bg-primary hover:bg-primary/90"
                  title={operations.withdrawPrincipal.disabledReason}
                >
                  {operations.withdrawPrincipal.isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Withdrawing...
                    </>
                  ) : (
                    <>Close Funding & Release Principal</>
                  )}
                </Button>
              )}

              {bond.status === "active" && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full bg-transparent" 
                  disabled
                >
                  Bond Active - Repayments in Progress
                </Button>
              )}

              {!operations.withdrawPrincipal.canExecute && operations.withdrawPrincipal.disabledReason && (
                <p className="text-xs text-muted-foreground mt-1">
                  {operations.withdrawPrincipal.disabledReason}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* State Information */}
        <div className="rounded-lg bg-muted p-3 space-y-2">
          <div className="text-sm text-muted-foreground">
            <p>• Funding Status: {state.isFundingActive ? "Active" : "Closed"}</p>
            <p>• Total Shares: {state.totalShares.toString()}</p>
            <p>• Issuer: {state.issuerAddress}</p>
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

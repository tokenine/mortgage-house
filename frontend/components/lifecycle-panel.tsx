"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lock } from "lucide-react"

interface BondData {
  id: string
  name: string
  status: string
  nextPayment: string
}

interface LifecyclePanelProps {
  bonds: BondData[]
  onCloseFunding: (bondId: string) => void
}

export function LifecyclePanel({ bonds, onCloseFunding }: LifecyclePanelProps) {
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
                  onClick={() => onCloseFunding(bond.id)}
                  size="sm"
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Close Funding & Release Principal
                </Button>
              )}

              {bond.status === "active" && (
                <Button size="sm" variant="outline" className="w-full bg-transparent" disabled>
                  Bond Active - Repayments in Progress
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

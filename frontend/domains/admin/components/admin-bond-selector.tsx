"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface BondData {
  id: string
  name: string
  status: string
  principal: number
  outstanding: number
  nextPayment: string
  investors: number
}

interface AdminBondSelectorProps {
  bonds: BondData[]
  selectedBond: string
  onSelectBond: (bondId: string) => void
}

export function AdminBondSelector({ bonds, selectedBond, onSelectBond }: AdminBondSelectorProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {bonds.map((bond) => (
        <Card
          key={bond.id}
          className={`bg-card border-border cursor-pointer transition-all ${
            selectedBond === bond.id ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => onSelectBond(bond.id)}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-foreground">{bond.name}</CardTitle>
              <Badge
                variant={bond.status === "active" ? "default" : "secondary"}
                className={
                  bond.status === "active" ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
                }
              >
                {bond.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Principal:</span>
              <span className="font-medium text-foreground">${bond.principal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Outstanding:</span>
              <span className="font-medium text-foreground">${bond.outstanding.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Investors:</span>
              <span className="font-medium text-foreground">{bond.investors}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

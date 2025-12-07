"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { AdminBondSelector } from "./admin-bond-selector"
import { RepaymentPanel } from "./repayment-panel"
import { LifecyclePanel } from "./lifecycle-panel"

export function AdminContent() {
  const [selectedBond, setSelectedBond] = useState("bond-1")
  const [repaymentAmount, setRepaymentAmount] = useState("")

  const bonds = [
    {
      id: "bond-1",
      name: "Suburban House #A142",
      status: "active",
      principal: 100000,
      outstanding: 85000,
      nextPayment: "2025-01-15",
      investors: 50,
    },
    {
      id: "bond-2",
      name: "Downtown Condo #B89",
      status: "active",
      principal: 150000,
      outstanding: 120000,
      nextPayment: "2025-01-20",
      investors: 35,
    },
    {
      id: "bond-3",
      name: "Beach Villa #C203",
      status: "funding",
      principal: 200000,
      outstanding: 200000,
      nextPayment: "N/A",
      investors: 25,
    },
  ]

  const handleMintRepayment = () => {
    console.log(`Minting repayment of ${repaymentAmount} for ${selectedBond}`)
    alert(`Minted repayment tokens: ${repaymentAmount} USDT`)
    setRepaymentAmount("")
  }

  const handleDistributeInterest = () => {
    console.log(`Distributing interest for ${selectedBond}`)
    alert("Interest distributed to all bondholders!")
  }

  const handleCloseFunding = (bondId: string) => {
    console.log(`Closing funding for ${bondId}`)
    alert("Funding closed and principal released to borrower")
  }

  const selectedBondData = bonds.find((b) => b.id === selectedBond)

  return (
    <div className="space-y-6">
      <AdminBondSelector bonds={bonds} selectedBond={selectedBond} onSelectBond={setSelectedBond} />

      <div className="grid gap-6 md:grid-cols-2">
        <RepaymentPanel
          selectedBondName={selectedBondData?.name || ""}
          investorCount={selectedBondData?.investors || 0}
          repaymentAmount={repaymentAmount}
          onRepaymentAmountChange={setRepaymentAmount}
          onMintRepayment={handleMintRepayment}
          onDistributeInterest={handleDistributeInterest}
        />

        <LifecyclePanel bonds={bonds} onCloseFunding={handleCloseFunding} />
      </div>

      {/* Info Banner */}
      <Card className="bg-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">Admin Panel Access</p>
              <p className="text-sm text-muted-foreground">
                This panel is restricted to bond issuers and platform administrators. All actions are recorded on-chain
                and auditable. Ensure you have proper authorization before performing any administrative functions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { AdminBondSelector } from "./admin-bond-selector"
import { RepaymentPanel } from "./repayment-panel"
import { LifecyclePanel } from "./lifecycle-panel"
import { getAllProjects } from "@/lib/projects"

export function AdminContent() {
  const [selectedBond, setSelectedBond] = useState<string>("")
  const [repaymentAmount, setRepaymentAmount] = useState("")
  const [bonds, setBonds] = useState<any[]>([])

  // Load bonds from projects.json
  useEffect(() => {
    const projects = getAllProjects()
    const bondData = projects.map((project) => ({
      id: project.id,
      name: project.name,
      status: "active", // In real app, derive from contract state
      principal: project.loanAmount || 0,
      outstanding: project.loanAmount || 0, // In real app, fetch from contract
      nextPayment: "N/A", // In real app, calculate from contract
      investors: project.investors || 0,
    }))
    setBonds(bondData)
    if (bondData.length > 0 && !selectedBond) {
      setSelectedBond(bondData[0].id)
    }
  }, [])

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

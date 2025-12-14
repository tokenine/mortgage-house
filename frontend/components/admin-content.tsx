"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, AlertTriangle } from "lucide-react"
import { AdminBondSelector } from "./admin-bond-selector"
import { RepaymentPanel } from "./repayment-panel"
import { LifecyclePanel } from "./lifecycle-panel"
import { getAllProjects } from "@/lib/projects"
import { useAdminPanel } from "@/hooks/useAdminPanel"
import { useAccount } from "wagmi"

export function AdminContent() {
  const [selectedBond, setSelectedBond] = useState<string>("")
  const [bonds, setBonds] = useState<any[]>([])
  const { address } = useAccount()

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

  // Initialize admin panel hook for selected bond
  const adminPanel = useAdminPanel({ 
    projectId: selectedBond || "modern-apartment-austin", // Default to first project if not selected
    enableEventListeners: true 
  })

  const selectedBondData = bonds.find((b) => b.id === selectedBond)

  // Show access denied if not authorized
  if (!address || (adminPanel.state.isAuthorized === false && !adminPanel.state.isLoading)) {
    return (
      <div className="space-y-6">
        <AdminBondSelector bonds={bonds} selectedBond={selectedBond} onSelectBond={setSelectedBond} />
        
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">Access Denied</p>
                <p className="text-sm text-muted-foreground">
                  Connected wallet ({address}) does not match issuer address ({adminPanel.state.issuerAddress}).
                </p>
                <p className="text-sm text-muted-foreground">
                  Please connect with the correct issuer wallet to access admin functions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminBondSelector bonds={bonds} selectedBond={selectedBond} onSelectBond={setSelectedBond} />

      <div className="grid gap-6 md:grid-cols-2">
        <RepaymentPanel
          selectedBondName={selectedBondData?.name || ""}
          investorCount={selectedBondData?.investors || 0}
          operations={adminPanel.operations}
          state={adminPanel.state}
        />

        <LifecyclePanel 
          operations={adminPanel.operations}
          state={adminPanel.state}
          bonds={bonds.map(bond => ({
            ...bond,
            status: bond.id === selectedBond && adminPanel.state.isFundingActive ? "funding" : "active"
          }))}
        />
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

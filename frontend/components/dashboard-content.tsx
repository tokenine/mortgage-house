"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, DollarSign, Briefcase, Coins, AlertCircle, Loader2 } from "lucide-react"
import { StatsCard } from "./stats-card"
import { BondCard } from "./bond-card"
import { useMediaQuery } from "@/hooks/use-media-query"
import { usePortfolio } from "@/hooks/usePortfolio"
import { useAccount, useWriteContract } from "wagmi"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getMortgageBondConfig } from "@/lib/projects"
import { useTransactionWithToast } from "@/hooks/useTransactionState"

const ENABLE_CLAIM_REWARDS = process.env.NEXT_PUBLIC_ENABLE_CLAIM_REWARDS === 'true'

export function DashboardContent() {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const { address } = useAccount()
  const { portfolio, refetch } = usePortfolio()
  
  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isSuccess, isConfirming } = useTransactionWithToast(
    txHash,
    "Claiming rewards...",
    "Rewards claimed successfully!"
  )

  // Refetch portfolio after successful claim
  if (isSuccess) {
    refetch()
  }

  // Use real portfolio data
  const bonds = portfolio.investments.map(inv => ({
    id: inv.id || 0,
    name: inv.name || `Bond #${inv.projectId}`,
    image: inv.image || "/placeholder.svg",
    shares: Number(inv.shares) / 1e6, // Convert from smallest unit (6 decimals) to display value
    currentValue: inv.currentValue,
    yield: inv.yield,
    apy: inv.apy,
    projectId: inv.projectId,
  }))
    
  const totalInvested = bonds.reduce((sum, bond) => sum + (bond.currentValue || 0), 0)
  const totalYield = bonds.reduce((sum, bond) => sum + (bond.yield || 0), 0)

  const handleClaimRewards = () => {
    // For now, claim from the first project the user has invested in
    // In a real app, you might want to claim from all projects or let user select
    const firstInvestment = portfolio.investments[0]
    if (!firstInvestment) return

    const config = getMortgageBondConfig(firstInvestment.projectId)
    if (!config) return

    writeContract({
      address: config.address,
      abi: config.abi,
      functionName: "claimRewards",
      args: []
    })
  }

  const isLoading = isPending || isConfirming
  const canClaim = totalYield > 0 && !isLoading

  return (
    <div className="space-y-6">
      {portfolio.isRefreshing && (
        <p className="text-xs text-muted-foreground text-center">Refreshing portfolio…</p>
      )}
      {/* Stats Cards */}
      <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "md:grid-cols-3"}`}>
        <StatsCard
          title="Total Invested"
          value={`$${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          description={`Across ${bonds.length} properties`}
          icon={DollarSign}
        />

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unclaimed Yield</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">${totalYield.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {ENABLE_CLAIM_REWARDS ? (
                <Button 
                  size="sm" 
                  className="mt-2 bg-success hover:bg-success/90 text-success-foreground"
                  onClick={handleClaimRewards}
                  disabled={!canClaim}
                >
                  {isLoading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  <Coins className="mr-1 h-3 w-3" />
                  Claim Rewards
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  Claim rewards feature coming soon
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <StatsCard
          title="Active Bonds"
          value={bonds.length.toString()}
          description={`Avg APY: ${bonds.length > 0 ? (bonds.reduce((sum, b) => sum + (b.apy || 0), 0) / bonds.length).toFixed(1) : 0}%`}
          icon={Briefcase}
        />
      </div>

      {/* My Bonds Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">My Bonds</CardTitle>
          <CardDescription className="text-muted-foreground">Your current bond portfolio and earnings</CardDescription>
        </CardHeader>
        <CardContent>
          {portfolio.error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{portfolio.error}</AlertDescription>
            </Alert>
          )}

          {portfolio.isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          )}

          {!portfolio.isLoading && bonds.length === 0 && !address && (
            <div className="text-center py-12 text-muted-foreground">
              Connect your wallet to view your portfolio.
            </div>
          )}

          {!portfolio.isLoading && bonds.length === 0 && address && (
            <div className="text-center py-12 text-muted-foreground">
              You haven't invested in any properties yet.
            </div>
          )}

          {!portfolio.isLoading && bonds.length > 0 && (
            <div className="space-y-4">
              {bonds.map((bond) => (
                <BondCard key={bond.id} {...bond} onClaimSuccess={() => refetch()} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, DollarSign, Briefcase, Coins, AlertCircle } from "lucide-react"
import { StatsCard } from "./stats-card"
import { BondCard } from "./bond-card"
import { useMediaQuery } from "@/hooks/use-media-query"
import { usePortfolio } from "@/hooks/usePortfolio"
import { useAccount } from "wagmi"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function DashboardContent() {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const { address } = useAccount()
  const { portfolio } = usePortfolio()

  // Mock data for bonds that don't have investments yet
  const mockBonds = [
    {
      id: 1,
      name: "Suburban House #A142",
      shares: 50,
      currentValue: 5240,
      yield: 312,
      apy: 7.5,
      image: "/modern-suburban-house.png",
    },
    {
      id: 2,
      name: "Downtown Condo #B89",
      shares: 35,
      currentValue: 4120,
      yield: 178,
      apy: 6.8,
      image: "/downtown-condo-building.jpg",
    },
    {
      id: 3,
      name: "Beach Villa #C203",
      shares: 25,
      currentValue: 3140,
      yield: 95,
      apy: 8.2,
      image: "/tropical-beach-villa.png",
    },
  ]

  // Use real portfolio data if available, otherwise use mock data
  const bonds = portfolio.investments.length > 0 
    ? portfolio.investments.map(inv => ({
        id: inv.id || inv.projectId,
        name: inv.name || `Bond #${inv.projectId}`,
        image: inv.image || "/placeholder.svg",
        shares: Number(inv.shares),
        currentValue: inv.currentValue,
        yield: inv.yield,
        apy: inv.apy,
      }))
    : mockBonds
    
  const totalInvested = bonds.reduce((sum, bond) => sum + (bond.currentValue || 0), 0)
  const totalYield = bonds.reduce((sum, bond) => sum + (bond.yield || 0), 0)

  return (
    <div className="space-y-6">
      {portfolio.isRefreshing && (
        <p className="text-xs text-muted-foreground text-center">Refreshing portfolio…</p>
      )}
      {/* Stats Cards */}
      <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "md:grid-cols-3"}`}>
        <StatsCard
          title="Total Invested"
          value={`$${totalInvested.toLocaleString()}`}
          description={`Across ${bonds.length} properties`}
          icon={DollarSign}
        />

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unclaimed Yield</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">${totalYield.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Button size="sm" className="mt-2 bg-success hover:bg-success/90 text-success-foreground">
                <Coins className="mr-1 h-3 w-3" />
                Claim Rewards
              </Button>
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
                <BondCard key={bond.id} {...bond} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

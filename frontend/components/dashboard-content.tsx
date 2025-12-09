"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, DollarSign, Briefcase, Coins } from "lucide-react"
import { StatsCard } from "./stats-card"
import { BondCard } from "./bond-card"
import { useMediaQuery } from "@/hooks/use-media-query"

export function DashboardContent() {
  const isMobile = useMediaQuery("(max-width: 768px)")
  
  const myBonds = [
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

  const totalInvested = myBonds.reduce((sum, bond) => sum + bond.currentValue, 0)
  const totalYield = myBonds.reduce((sum, bond) => sum + bond.yield, 0)

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "md:grid-cols-3"}`}>
        <StatsCard
          title="Total Invested"
          value={`$${totalInvested.toLocaleString()}`}
          description={`Across ${myBonds.length} properties`}
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
          value={myBonds.length.toString()}
          description={`Avg APY: ${(myBonds.reduce((sum, b) => sum + b.apy, 0) / myBonds.length).toFixed(1)}%`}
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
          <div className="space-y-4">
            {myBonds.map((bond) => (
              <BondCard key={bond.id} {...bond} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

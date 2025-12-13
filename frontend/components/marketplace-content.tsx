"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PropertyCard } from "./property-card"
import { SellOrderCard } from "./sell-order-card"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorMessage } from "@/components/ui/error-message"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useProjects } from "@/hooks/useProjects"

export function MarketplaceContent() {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const { projects, loading, error, refetch } = useProjects()

  const secondaryMarket = [
    { id: 1, seller: "0x742d...5f8a", property: "Suburban House #A142", shares: 25, price: 2650, discount: -5 },
    { id: 2, seller: "0x8c3e...92b1", property: "Downtown Condo #B89", shares: 15, price: 1890, discount: 8 },
    { id: 3, seller: "0x1f9a...4d2c", property: "Beach Villa #C203", shares: 10, price: 1340, discount: 12 },
  ]

  return (
    <div className="space-y-8">
      {/* Primary Market */}
      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-foreground">Primary Market</h2>
          <p className="text-muted-foreground">Invest in new tokenized mortgage bonds</p>
        </div>

        {error && (
          <ErrorMessage
            message={error}
            onRetry={refetch}
          />
        )}

        {loading && !error && (
          <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"}`}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No projects available at this time.
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
          <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"}`}>
            {projects.map((property) => (
              <PropertyCard key={property.id} {...property} />
            ))}
          </div>
        )}
      </div>

      {/* Secondary Market */}
      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-foreground">Secondary Market</h2>
          <p className="text-muted-foreground">Trade bond shares with other investors</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Active Sell Orders</CardTitle>
            <CardDescription className="text-muted-foreground">Buy bond shares from other investors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {secondaryMarket.map((order) => (
                <SellOrderCard key={order.id} {...order} />
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full bg-transparent">
              Create Sell Order
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

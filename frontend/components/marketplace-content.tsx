"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PropertyCard } from "./property-card"
import { SellOrderCard } from "./sell-order-card"
import { useMediaQuery } from "@/hooks/use-media-query"

export function MarketplaceContent() {
  const isMobile = useMediaQuery("(max-width: 768px)")
  
  const primaryMarket = [
    {
      id: 1,
      name: "Modern Apartment Complex",
      location: "Austin, TX",
      apy: 8.5,
      fundingCap: 250000,
      raised: 175000,
      maturity: "24 months",
      investors: 42,
      image: "/modern-apartment-complex.png",
    },
    {
      id: 2,
      name: "Family Home Renovation",
      location: "Seattle, WA",
      apy: 7.2,
      fundingCap: 150000,
      raised: 98000,
      maturity: "18 months",
      investors: 28,
      image: "/family-home-renovation.jpg",
    },
    {
      id: 3,
      name: "Commercial Property",
      location: "Miami, FL",
      apy: 9.1,
      fundingCap: 500000,
      raised: 425000,
      maturity: "36 months",
      investors: 67,
      image: "/commercial-property-building.jpg",
    },
  ]

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

        <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"}`}>
          {primaryMarket.map((property) => (
            <PropertyCard key={property.id} {...property} />
          ))}
        </div>
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

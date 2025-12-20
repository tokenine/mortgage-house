import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, Calendar, MapPin } from "lucide-react"
import Link from "next/link"

interface PropertyCardProps {
  id: string
  name: string
  location: string
  apy: number
  fundingCap: number
  raised: number
  maturity: string
  investors: number
  image: string
}

export function PropertyCard({
  id,
  name,
  location,
  apy,
  fundingCap,
  raised,
  maturity,
  investors,
  image,
}: PropertyCardProps) {
  const fundingPercentage = fundingCap > 0 ? (raised / fundingCap) * 100 : 0

  return (
    <Card className="bg-card border-border overflow-hidden">
      <img src={image || "/placeholder.svg"} alt={name} className="h-48 w-full object-cover" />
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-foreground">{name}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {location}
            </CardDescription>
          </div>
          <Badge className="bg-success text-success-foreground">{apy}% APY</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-muted-foreground">Funding Progress</span>
            <span className="font-medium text-foreground">{fundingPercentage.toFixed(0)}%</span>
          </div>
          <Progress value={fundingPercentage} className="h-2" />
          <div className="mt-1 text-xs text-muted-foreground">
            ${raised.toLocaleString()} / ${fundingCap.toLocaleString()}
          </div>
        </div>

        <div className="flex justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            {investors} investors
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {maturity}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/mortgage/${id}`} className="w-full">
          <Button className="w-full bg-primary hover:bg-primary/90">
            <TrendingUp className="mr-2 h-4 w-4" />
            Invest Now
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

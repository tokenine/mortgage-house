import { Button } from "@/components/ui/button"
import { ArrowUpRight } from "lucide-react"

interface BondCardProps {
  id: number
  name: string
  shares: number
  currentValue: number
  yield: number
  apy: number
  image: string
}

export function BondCard({ name, shares, currentValue, yield: yieldValue, apy, image }: BondCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/50 p-4">
      <img src={image || "/placeholder.svg"} alt={name} className="h-16 w-16 rounded-lg object-cover" />
      <div className="flex-1 space-y-1">
        <h3 className="font-semibold text-foreground">{name}</h3>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{shares} shares</span>
          <span>•</span>
          <span className="text-primary">{apy}% APY</span>
        </div>
      </div>
      <div className="text-right space-y-1">
        <div className="text-lg font-semibold text-foreground">${currentValue.toLocaleString()}</div>
        <div className="text-sm text-success">+${yieldValue} earned</div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline">
          Sell
        </Button>
        <Button size="sm" className="bg-primary hover:bg-primary/90">
          Trade
          <ArrowUpRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

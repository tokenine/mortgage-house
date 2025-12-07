import { Button } from "@/components/ui/button"

interface SellOrderCardProps {
  id: number
  seller: string
  property: string
  shares: number
  price: number
  discount: number
}

export function SellOrderCard({ seller, property, shares, price, discount }: SellOrderCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
      <div className="space-y-1">
        <h3 className="font-semibold text-foreground">{property}</h3>
        <div className="flex gap-3 text-sm text-muted-foreground">
          <span>{shares} shares</span>
          <span>•</span>
          <span className="font-mono">{seller}</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-lg font-semibold text-foreground">${price.toLocaleString()}</div>
          <div className={`text-sm ${discount > 0 ? "text-success" : "text-destructive"}`}>
            {discount > 0 ? "+" : ""}
            {discount}% {discount > 0 ? "premium" : "discount"}
          </div>
        </div>
        <Button size="sm" className="bg-primary hover:bg-primary/90">
          Buy Now
        </Button>
      </div>
    </div>
  )
}

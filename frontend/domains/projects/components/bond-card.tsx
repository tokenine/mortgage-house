"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AnimatedButton } from "@/components/ui/animated-button"
import { AnimatedCard } from "@/components/ui/animated-card"
import { Eye } from "lucide-react"
import { OrderCreationModal } from "@/shared/ui/order-creation-modal"
import { ClaimButton } from "@/domains/investment"
import { useRouter } from "next/navigation"

interface BondCardProps {
  id: number
  name: string
  shares: number
  currentValue: number
  yield: number
  apy: number
  image: string
  projectId: string
  onClaimSuccess?: () => void
}

export function BondCard({ id, name, shares, currentValue, yield: yieldValue, apy, image, projectId, onClaimSuccess }: BondCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()

  const handleViewDetails = () => {
    router.push(`/bonds/${projectId}`)
  }

  return (
    <>
      <AnimatedCard interactive={true} className="flex items-center gap-4 p-4">
        <img src={image || "/placeholder.svg"} alt={name} className="h-16 w-16 rounded-lg object-cover" />
        <div className="flex-1 space-y-1">
          <h3 className="font-semibold text-foreground">{name}</h3>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{shares.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} shares</span>
            <span>•</span>
            <span className="text-primary">{apy}% APY</span>
          </div>
        </div>
        <div className="text-right space-y-1">
          <div className="text-lg font-semibold text-foreground">${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="text-sm text-success">+${yieldValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} earned</div>
        </div>
        <div className="flex gap-2">
          <ClaimButton 
            projectId={projectId} 
            yield={yieldValue} 
            onClaimSuccess={onClaimSuccess}
          />
          <Button size="sm" variant="outline" onClick={() => setIsModalOpen(true)}>
            Sell
          </Button>
          <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={handleViewDetails}>
            <Eye className="mr-1 h-3 w-3" />
            Details
          </Button>
        </div>
      </AnimatedCard>

      <OrderCreationModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={() => {
          setIsModalOpen(false)
          // Portfolio will auto-refresh
        }}
      />
    </>
  )
}

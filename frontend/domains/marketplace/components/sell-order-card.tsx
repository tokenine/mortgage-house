"use client"

import { useState, useEffect } from "react"
import { useAccount, useWriteContract, useReadContract } from "wagmi"
import { formatUnits } from "viem"
import { Button } from "@/components/ui/button"
import { getMortgageBondConfig, getPaymentTokenConfig } from '@/domains/projects/lib/projects'
import { useCurrentProject } from '@/domains/projects/contexts/ProjectContext'
import { useTransactionWithToast } from "@/shared/hooks/useTransactionState"
import { Loader2 } from "lucide-react"
import type { SellOrder } from '@/domains/marketplace/hooks/useMarketplace'

interface SellOrderCardProps {
  order: SellOrder
  propertyName?: string
  onSuccess: () => void
}

export function SellOrderCard({ order, propertyName = "Property", onSuccess }: SellOrderCardProps) {
  const { address } = useAccount()
  const { currentProject } = useCurrentProject()
  const [error, setError] = useState<string | null>(null)
  
  // Get contract configs from current project
  const mortgageBondConfig = currentProject ? getMortgageBondConfig(currentProject.id) : null
  const paymentTokenConfig = currentProject ? getPaymentTokenConfig(currentProject.id) : null
  
  const { writeContract: writeApprove, data: approveTx, isPending: isApproving } = useWriteContract()
  const { writeContract: writeBuy, data: buyTx, isPending: isBuying } = useWriteContract()

  const approveState = useTransactionWithToast(
    approveTx,
    "Approving token transfer...",
    "Token approved successfully!"
  )
  const buyState = useTransactionWithToast(
    buyTx,
    "Processing purchase...",
    "Purchase successful!"
  )

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: paymentTokenConfig?.address,
    abi: paymentTokenConfig?.abi,
    functionName: "allowance",
    args: address && mortgageBondConfig ? [address, mortgageBondConfig.address] : undefined,
    query: {
      enabled: !!address && !!paymentTokenConfig && !!mortgageBondConfig,
    },
  })

  useEffect(() => {
    if (approveState.isSuccess) refetchAllowance()
  }, [approveState.isSuccess, refetchAllowance])

  useEffect(() => {
    if (buyState.isSuccess) onSuccess()
  }, [buyState.isSuccess, onSuccess])

  const isOwner = address === order.seller
  const currentAllowance = (allowance as bigint) ?? BigInt(0)
  const needsApproval = order.price > currentAllowance

  const handleBuy = () => {
    setError(null)
    
    if (!paymentTokenConfig || !mortgageBondConfig) {
      setError("Project configuration missing")
      return
    }
    
    if (needsApproval) {
      writeApprove({
        address: paymentTokenConfig.address,
        abi: paymentTokenConfig.abi,
        functionName: "approve",
        args: [mortgageBondConfig.address, order.price]
      })
    } else {
      writeBuy({
        address: mortgageBondConfig.address,
        abi: mortgageBondConfig.abi,
        functionName: "buyShare",
        args: [BigInt(order.id)]
      })
    }
  }

  const isLoading = isApproving || approveState.isConfirming || isBuying || buyState.isConfirming
  const shares = formatUnits(order.shareAmount, 6)
  const price = formatUnits(order.price, 6)
  const sharePrice = Number(price) / Number(shares)

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
      <div className="space-y-1">
        <h3 className="font-semibold text-foreground">{propertyName}</h3>
        <div className="flex gap-3 text-sm text-muted-foreground">
          <span>{shares} shares</span>
          <span>•</span>
          <span className="font-mono">{order.seller.slice(0, 6)}...{order.seller.slice(-4)}</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-lg font-semibold text-foreground">${Number(price).toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">
            ${sharePrice.toFixed(2)}/share
          </div>
        </div>
        <Button 
          size="sm" 
          className="bg-primary hover:bg-primary/90"
          onClick={handleBuy}
          disabled={isOwner || isLoading || !address}
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {needsApproval && !isLoading ? "Approve" : "Buy Now"}
        </Button>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useAccount, useWriteContract, useReadContract } from "wagmi"
import { formatUnits } from "viem"
import { Button } from "@/components/ui/button"
import { CONTRACTS } from "@/lib/contracts"
import { useTransactionWithToast } from "@/hooks/useTransactionState"
import { Loader2 } from "lucide-react"
import type { SellOrder } from "@/hooks/useMarketplace"

interface SellOrderCardProps {
  order: SellOrder
  propertyName?: string
  onSuccess: () => void
}

export function SellOrderCard({ order, propertyName = "Property", onSuccess }: SellOrderCardProps) {
  const { address } = useAccount()
  const [error, setError] = useState<string | null>(null)
  
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
    ...CONTRACTS.mockToken,
    functionName: "allowance",
    args: address ? [address, CONTRACTS.mortgageBond.address] : undefined,
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
    
    if (needsApproval) {
      writeApprove({
        ...CONTRACTS.mockToken,
        functionName: "approve",
        args: [CONTRACTS.mortgageBond.address, order.price]
      })
    } else {
      writeBuy({
        ...CONTRACTS.mortgageBond,
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

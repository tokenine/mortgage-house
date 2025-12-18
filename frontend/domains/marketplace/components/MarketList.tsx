"use client"

import { useState, useEffect } from "react"
import { useAccount, useWriteContract, useReadContract } from "wagmi"
import { formatUnits } from "viem"
import { CONTRACTS } from '@/shared/lib/contracts'
import { useMarketplace, SellOrder } from '@/domains/marketplace/hooks/useMarketplace'
import { useTransactionWithToast } from "@/shared/hooks/useTransactionState"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useMediaQuery } from '@/shared/hooks/use-media-query'

export function MarketList() {
    const isMobile = useMediaQuery("(max-width: 768px)")
    const { activeOrders, refetchOrders } = useMarketplace()

    // Auto refresh every 10s or rely on manual interaction
    useEffect(() => {
        const interval = setInterval(refetchOrders, 5000)
        return () => clearInterval(interval)
    }, [refetchOrders])

    if (activeOrders.length === 0) {
        return (
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 text-center text-muted-foreground">
                No active sell orders found. Be the first to list!
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Active Orders</CardTitle>
            </CardHeader>
            <CardContent>
                {isMobile ? (
                    <div className="space-y-4">
                        {activeOrders.map((order) => (
                            <MobileOrderRow key={order.id} order={order} onSuccess={refetchOrders} />
                        ))}
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Seller</TableHead>
                                <TableHead>Amount (Shares)</TableHead>
                                <TableHead>Price (USDT)</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {activeOrders.map((order) => (
                                <OrderRow key={order.id} order={order} onSuccess={refetchOrders} />
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}

function OrderRow({ order, onSuccess }: { order: SellOrder, onSuccess: () => void }) {
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

    return (
        <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
                <div className="font-medium">Order #{order.id}</div>
                <div className="text-sm text-muted-foreground">
                    {formatUnits(order.shareAmount, 6)} shares • ${formatUnits(order.price, 6)}
                </div>
                <div className="text-xs text-muted-foreground">
                    Seller: {order.seller.slice(0, 6)}...{order.seller.slice(-4)}
                </div>
            </div>
            <Button 
                onClick={handleBuy} 
                disabled={isOwner || isLoading}
                size="sm"
            >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Buy
            </Button>
        </div>
    )
}

function MobileOrderRow({ order, onSuccess }: { order: SellOrder, onSuccess: () => void }) {
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

    return (
        <TableRow>
            <TableCell>#{order.id}</TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
                {order.seller.slice(0, 6)}...{order.seller.slice(-4)} {isOwner && "(You)"}
            </TableCell>
            <TableCell>{formatUnits(order.shareAmount, 6)}</TableCell>
            <TableCell>{formatUnits(order.price, 6)}</TableCell>
            <TableCell className="text-right">
                {!isOwner && (
                    <Button size="sm" onClick={handleBuy} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {needsApproval ? "Approve" : "Buy Now"}
                    </Button>
                )}
                {isOwner && (
                    <span className="text-xs text-muted-foreground">Cannot Buy Own</span>
                )}
            </TableCell>
        </TableRow>
    )
}

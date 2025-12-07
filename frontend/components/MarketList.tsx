"use client"

import { useState, useEffect } from "react"
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi"
import { formatUnits } from "viem"
import { CONTRACTS } from "@/lib/contracts"
import { useMarketplace, SellOrder } from "@/hooks/useMarketplace"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"

export function MarketList() {
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
            </CardContent>
        </Card>
    )
}

function OrderRow({ order, onSuccess }: { order: SellOrder, onSuccess: () => void }) {
    const { address } = useAccount()
    const { writeContract: writeApprove, data: approveTx, isPending: isApproving } = useWriteContract()
    const { writeContract: writeBuy, data: buyTx, isPending: isBuying } = useWriteContract()

    const { isSuccess: isApproveSuccess, isLoading: isApproveConfirming } = useWaitForTransactionReceipt({ hash: approveTx })
    const { isSuccess: isBuySuccess, isLoading: isBuyConfirming } = useWaitForTransactionReceipt({ hash: buyTx })

    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        ...CONTRACTS.mockToken,
        functionName: "allowance",
        args: address ? [address, CONTRACTS.mortgageBond.address] : undefined,
    })

    useEffect(() => {
        if (isApproveSuccess) refetchAllowance()
    }, [isApproveSuccess, refetchAllowance])

    useEffect(() => {
        if (isBuySuccess) onSuccess()
    }, [isBuySuccess, onSuccess])

    const isOwner = address === order.seller
    const currentAllowance = (allowance as bigint) ?? BigInt(0)
    const needsApproval = order.price > currentAllowance

    const handleBuy = () => {
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

    const isLoading = isApproving || isApproveConfirming || isBuying || isBuyConfirming

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

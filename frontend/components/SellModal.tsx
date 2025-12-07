"use client"

import { useState, useEffect } from "react"
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseUnits } from "viem"
import { CONTRACTS } from "@/lib/contracts"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus } from "lucide-react"

export function SellModal() {
    const [open, setOpen] = useState(false)
    const [shares, setShares] = useState("")
    const [price, setPrice] = useState("")

    const { writeContract, data: txHash, isPending } = useWriteContract()
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

    useEffect(() => {
        if (isSuccess) {
            setOpen(false)
            setShares("")
            setPrice("")
        }
    }, [isSuccess])

    const handleCreateOrder = () => {
        // Inputs in standard units (e.g. 100 shares, 100 USDT)
        // Contract expects 6 decimals for both (since MockUSDT is 6 decimals, and Shares are 1:1 with USDT invest)
        const sharesRaw = parseUnits(shares, 6)
        const priceRaw = parseUnits(price, 6)

        writeContract({
            ...CONTRACTS.mortgageBond,
            functionName: "createSellOrder",
            args: [sharesRaw, priceRaw]
        })
    }

    const isLoading = isPending || isConfirming

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Listing
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>List Shares for Sale</DialogTitle>
                    <DialogDescription>
                        Create a sell order on the marketplace.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="shares" className="text-right">
                            Shares
                        </Label>
                        <Input
                            id="shares"
                            type="number"
                            value={shares}
                            onChange={(e) => setShares(e.target.value)}
                            className="col-span-3"
                            placeholder="Amount to sell"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right">
                            Price (USDT)
                        </Label>
                        <Input
                            id="price"
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="col-span-3"
                            placeholder="Total asking price"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleCreateOrder} disabled={!shares || !price || isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Order
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

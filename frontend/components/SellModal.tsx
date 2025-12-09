"use client"

import { useState, useEffect } from "react"
import { useWriteContract } from "wagmi"
import { parseUnits, formatUnits } from "viem"
import { CONTRACTS } from "@/lib/contracts"
import { useTransactionWithToast } from "@/hooks/useTransactionState"
import { useMortgageBond } from "@/hooks/useMortgageBond"
import { useFormValidation } from "@/hooks/useFormValidation"
import { validationRules } from "@/lib/validation"

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
import { Loader2, Plus, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function SellModal() {
    const [open, setOpen] = useState(false)
    const { investorInfo } = useMortgageBond()
    
    const form = useFormValidation({
        initialValues: { shares: "", price: "" },
        validationRules: {
            shares: {
                ...validationRules.required,
                ...validationRules.sharesAmount,
                custom: (value: string) => {
                    const num = parseFloat(value)
                    const userShares = investorInfo ? Number(formatUnits(investorInfo[0], 6)) : 0
                    
                    if (isNaN(num) || num <= 0) {
                        return "Must be a valid number of shares"
                    }
                    if (num % 1 !== 0) {
                        return "Shares must be whole numbers"
                    }
                    if (num > userShares) {
                        return `You only have ${userShares} shares available`
                    }
                }
            },
            price: {
                ...validationRules.required,
                ...validationRules.usdtAmount,
            }
        }
    })
    
    const { writeContract, data: txHash, isPending } = useWriteContract()
    const { isSuccess, isConfirming } = useTransactionWithToast(
        txHash,
        "Creating sell order...",
        "Sell order created successfully!"
    )

    useEffect(() => {
        if (isSuccess) {
            setOpen(false)
            setShares("")
            setPrice("")
        }
    }, [isSuccess])

    const handleCreateOrder = () => {
        form.validateAll()
        
        if (!form.isValid) {
            return
        }

        const shares = form.fields.shares.value
        const price = form.fields.price.value

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
                {(form.fields.shares.error || form.fields.price.error) && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {form.fields.shares.error || form.fields.price.error}
                        </AlertDescription>
                    </Alert>
                )}
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="shares" className="text-right">
                            Shares
                        </Label>
                        <Input
                            id="shares"
                            type="number"
                            value={form.fields.shares.value}
                            onChange={(e) => form.setValue("shares", e.target.value)}
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
                            value={form.fields.price.value}
                            onChange={(e) => form.setValue("price", e.target.value)}
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

import { useReadContract, useReadContracts } from "wagmi"
import { CONTRACTS } from "@/lib/contracts"
import { formatUnits } from "viem"
import { useMarketplaceWebSocket } from "./useWebSocket"

export interface SellOrder {
    id: number
    seller: string
    shareAmount: bigint
    price: bigint
    isActive: boolean
}

export function useMarketplace() {
    const { lastMarketUpdate } = useMarketplaceWebSocket()
    const { data: nextOrderId } = useReadContract({
        ...CONTRACTS.mortgageBond,
        functionName: "nextOrderId",
    })

    // Construct calls for all potential orders
    // Using a limit or pagination would be better for prod, but loop is fine for MVP
    const maxId = nextOrderId ? Number(nextOrderId) : 1
    const contracts = []

    for (let i = 1; i < maxId; i++) {
        contracts.push({
            ...CONTRACTS.mortgageBond,
            functionName: "sellOrders",
            args: [BigInt(i)]
        })
    }

    const { data: ordersResult, refetch } = useReadContracts({
        contracts: contracts,
        query: {
            enabled: maxId > 1
        }
    })

    // Process results
    const activeOrders: SellOrder[] = []

    if (ordersResult) {
        ordersResult.forEach((res, index) => {
            if (res.status === "success" && res.result) {
                const [seller, shareAmount, price, isActive] = res.result as [string, bigint, bigint, boolean]
                if (isActive) {
                    activeOrders.push({
                        id: index + 1,
                        seller,
                        shareAmount,
                        price,
                        isActive
                    })
                }
            }
        })
    }

    return {
        activeOrders,
        refetchOrders: refetch,
        lastUpdate: lastMarketUpdate,
    }
}

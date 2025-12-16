import { useEffect } from "react"
import { useReadContract, useReadContracts, usePublicClient } from "wagmi"
import { CONTRACTS } from '@/shared/lib/contracts'

export interface SellOrder {
    id: number
    seller: string
    shareAmount: bigint
    price: bigint
    isActive: boolean
}

export function useMarketplace() {
    const publicClient = usePublicClient()
    
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

    // Listen to blockchain events for real-time updates
    useEffect(() => {
        if (!publicClient) return

        console.log("Setting up marketplace event listeners...")

        // Watch for ShareListed events (when new sell orders are created)
        const unwatchShareListed = publicClient.watchContractEvent({
            address: CONTRACTS.mortgageBond.address,
            abi: CONTRACTS.mortgageBond.abi,
            eventName: 'ShareListed',
            onLogs: (logs) => {
                console.log("ShareListed event detected:", logs)
                refetch() // Refresh orders when new order is created
            },
        })

        // Watch for SharePurchased events (when orders are filled)
        const unwatchSharePurchased = publicClient.watchContractEvent({
            address: CONTRACTS.mortgageBond.address,
            abi: CONTRACTS.mortgageBond.abi,
            eventName: 'SharePurchased',
            onLogs: (logs) => {
                console.log("SharePurchased event detected:", logs)
                refetch() // Refresh orders when order is filled
            },
        })

        // Watch for ShareCancelled events (when orders are cancelled)
        const unwatchShareCancelled = publicClient.watchContractEvent({
            address: CONTRACTS.mortgageBond.address,
            abi: CONTRACTS.mortgageBond.abi,
            eventName: 'ShareCancelled',
            onLogs: (logs) => {
                console.log("ShareCancelled event detected:", logs)
                refetch() // Refresh orders when order is cancelled
            },
        })

        // Cleanup function
        return () => {
            console.log("Cleaning up marketplace event listeners...")
            unwatchShareListed()
            unwatchSharePurchased()
            unwatchShareCancelled()
        }
    }, [publicClient, refetch])

    return {
        activeOrders,
        refetchOrders: refetch,
    }
}

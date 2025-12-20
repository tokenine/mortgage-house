import { useEffect, useMemo } from "react"
import { useReadContracts, usePublicClient } from "wagmi"
import { getAllProjects, getMortgageBondConfig } from '@/domains/projects/lib/projects'

export interface SellOrder {
    id: number
    projectId: string
    seller: string
    shareAmount: bigint
    price: bigint
    isActive: boolean
}

export function useMarketplace() {
    const publicClient = usePublicClient()
    const projects = useMemo(() => getAllProjects(), [])

    // 1. Fetch nextOrderId for all projects
    const nextOrderIdContracts = projects.map(project => {
        const config = getMortgageBondConfig(project.id)
        return {
            address: config.address,
            abi: config.abi as any,
            functionName: "nextOrderId",
        }
    })

    const { data: nextOrderIdsResult, refetch: refetchNextOrderIds } = useReadContracts({
        contracts: nextOrderIdContracts as any,
    })

    // 2. Construct calls for all potential orders across all projects
    const sellOrdersContracts = useMemo(() => {
        const contracts: any[] = []
        if (!nextOrderIdsResult) return contracts

        nextOrderIdsResult.forEach((res, projectIndex) => {
            if (res.status === "success" && res.result) {
                const nextOrderId = Number(res.result)
                const projectConfig = getMortgageBondConfig(projects[projectIndex].id)

                for (let i = 1; i < nextOrderId; i++) {
                    contracts.push({
                        ...projectConfig,
                        functionName: "sellOrders",
                        args: [BigInt(i)],
                        // Store project info in the contract object for easier processing later
                        projectId: projects[projectIndex].id
                    })
                }
            }
        })
        return contracts
    }, [nextOrderIdsResult, projects])

    const { data: ordersResult, refetch: refetchOrders } = useReadContracts({
        contracts: sellOrdersContracts.map(({ projectId, ...c }) => c), // Remove our custom projectId helper for wagmi
        query: {
            enabled: sellOrdersContracts.length > 0
        }
    })

    // Process results
    const activeOrders: SellOrder[] = useMemo(() => {
        const orders: SellOrder[] = []
        if (ordersResult && sellOrdersContracts.length === ordersResult.length) {
            ordersResult.forEach((res, index) => {
                if (res.status === "success" && res.result) {
                    const [seller, shareAmount, price, isActive] = res.result as [string, bigint, bigint, boolean]
                    if (isActive) {
                        orders.push({
                            id: Number(sellOrdersContracts[index].args[0]),
                            projectId: sellOrdersContracts[index].projectId,
                            seller,
                            shareAmount,
                            price,
                            isActive
                        })
                    }
                }
            })
        }
        return orders
    }, [ordersResult, sellOrdersContracts])

    const refetchAll = async () => {
        await refetchNextOrderIds()
        await refetchOrders()
    }

    // Listen to blockchain events for all projects
    useEffect(() => {
        if (!publicClient) return

        console.log("Setting up marketplace event listeners for all projects...")

        const unwatches: (() => void)[] = []

        projects.forEach(project => {
            const config = getMortgageBondConfig(project.id)

            // Watch for ShareListed events
            const unwatchShareListed = publicClient.watchContractEvent({
                address: config.address,
                abi: config.abi,
                eventName: 'ShareListed',
                onLogs: (logs) => {
                    console.log(`ShareListed event detected for ${project.id}:`, logs)
                    refetchAll()
                },
            })

            // Watch for SharePurchased events
            const unwatchSharePurchased = publicClient.watchContractEvent({
                address: config.address,
                abi: config.abi,
                eventName: 'SharePurchased',
                onLogs: (logs) => {
                    console.log(`SharePurchased event detected for ${project.id}:`, logs)
                    refetchAll()
                },
            })

            // Watch for ShareCancelled events
            const unwatchShareCancelled = publicClient.watchContractEvent({
                address: config.address,
                abi: config.abi,
                eventName: 'ShareCancelled',
                onLogs: (logs) => {
                    console.log(`ShareCancelled event detected for ${project.id}:`, logs)
                    refetchAll()
                },
            })

            unwatches.push(unwatchShareListed, unwatchSharePurchased, unwatchShareCancelled)
        })

        // Cleanup function
        return () => {
            console.log("Cleaning up marketplace event listeners...")
            unwatches.forEach(unwatch => unwatch())
        }
    }, [publicClient, projects])

    return {
        activeOrders,
        refetchOrders: refetchAll,
    }
}

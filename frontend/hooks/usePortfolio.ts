"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useAccount } from "wagmi"
import { useMortgageBond } from "./useMortgageBond"
import { getProject } from "@/lib/projects"
import { useCurrentProject } from "@/contexts/ProjectContext"

export interface Portfolio {
  totalInvested: bigint
  totalShares: bigint
  investments: Investment[]
  isLoading: boolean
  error: string | null
  isRefreshing?: boolean
}

export interface Investment {
  id?: number
  projectId: string
  name?: string
  shares: bigint
  currentValue: number
  yield: number
  apy: number
  image?: string
}

export function usePortfolio(projectId?: string) {
  const { address } = useAccount()
  const { projectId: contextProjectId } = useCurrentProject()
  
  // Use provided projectId or fallback to context
  const activeProjectId = projectId || contextProjectId || undefined
  
  const {
    fundingCap,
    totalRaised,
    isFundingActive,
    investorInfo,
    pendingRewards,
    refetchUserStats,
  } = useMortgageBond(activeProjectId)

  const [portfolio, setPortfolio] = useState<Portfolio>({
    totalInvested: BigInt(0),
    totalShares: BigInt(0),
    investments: [],
    isLoading: true,
    error: null,
    isRefreshing: false,
  })

  const fetchInProgress = useRef(false)

  // Fetch portfolio data from contract
  const fetchPortfolio = useCallback(async () => {
    // ✅ Prevent concurrent fetches
    if (fetchInProgress.current) return
    fetchInProgress.current = true

    try {
      setPortfolio((prev) => ({ ...prev, isLoading: true, error: null }))

      if (!address || !investorInfo) {
        setPortfolio((prev) => ({
          ...prev,
          isLoading: false,
          investments: [],
        }))
        fetchInProgress.current = false
        return
      }

      // investorInfo returns [shares, interestDebt, principalDebt]
      const shares = (investorInfo as [bigint, bigint, bigint])?.[0]

      // For now, we'll create a simplified portfolio view
      // In a production app, you'd fetch from a backend or contract events
      if (shares && shares > BigInt(0)) {
        const totalInvestedValue = Number(shares) // In real implementation, calculate based on price per share
        const rewardValue = (pendingRewards as [bigint, bigint])?.[0] || BigInt(0)
        
        // Get project metadata from projects.json
        let projectData
        try {
          projectData = activeProjectId ? getProject(activeProjectId) : null
        } catch (error) {
          console.error("Failed to load project metadata:", error)
        }
        
        const mockInvestment: Investment = {
          id: projectData?.id ? 1 : 1,
          projectId: activeProjectId || "unknown",
          name: projectData?.name || "Unknown Project",
          image: projectData?.image || "/placeholder.svg",
          shares: shares,
          currentValue: totalInvestedValue,
          yield: Number(rewardValue) / 1e18, // Interest rewards
          apy: projectData?.apy || 0,
        }

        setPortfolio((prev) => ({
          ...prev,
          totalShares: shares,
          totalInvested: shares,
          investments: [mockInvestment],
          isLoading: false,
        }))
      } else {
        setPortfolio((prev) => ({
          ...prev,
          totalShares: BigInt(0),
          totalInvested: BigInt(0),
          investments: [],
          isLoading: false,
        }))
      }
    } catch (err) {
      setPortfolio((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to load portfolio",
      }))
    } finally {
      fetchInProgress.current = false
    }
  }, [address, investorInfo, pendingRewards])

  // Initial fetch and refetch on data changes
  useEffect(() => {
    fetchPortfolio()
  }, [fetchPortfolio])

  // Listen for investment events and refetch
  const handleInvestmentSuccess = useCallback(async () => {
    // Indicate a short refresh cycle post-transaction
    setPortfolio((prev) => ({ ...prev, isRefreshing: true }))
    // Wait a moment for transaction to be confirmed
    await new Promise((resolve) => setTimeout(resolve, 2000))
    await refetchUserStats()
    await fetchPortfolio()
    setPortfolio((prev) => ({ ...prev, isRefreshing: false }))
  }, [refetchUserStats, fetchPortfolio])

  return {
    portfolio,
    refetch: fetchPortfolio,
    onInvestmentSuccess: handleInvestmentSuccess,
    address,
  }
}

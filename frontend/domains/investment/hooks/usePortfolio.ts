"use client"

import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { useAccount, useReadContracts } from "wagmi"
import { getAllProjects, getMortgageBondConfig } from '@/domains/projects/lib/projects'
import { useCurrentProject } from '@/domains/projects/contexts/ProjectContext'

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
  
  const [portfolio, setPortfolio] = useState<Portfolio>({
    totalInvested: BigInt(0),
    totalShares: BigInt(0),
    investments: [],
    isLoading: true,
    error: null,
    isRefreshing: false,
  })

  // Get all projects from projects.json
  const allProjects = useMemo(() => getAllProjects(), [])

  // Build contract calls for all projects
  const contracts = useMemo(() => {
    if (!address || allProjects.length === 0) return []
    
    return allProjects.flatMap((project) => {
      try {
        const config = getMortgageBondConfig(project.id)
        if (!config) return []
        
        return [
          {
            address: config.address,
            abi: config.abi,
            functionName: "investors",
            args: [address],
          },
          {
            address: config.address,
            abi: config.abi,
            functionName: "getPendingRewards",
            args: [address],
          },
        ]
      } catch (error) {
        console.warn(`Failed to get config for project ${project.id}:`, error)
        return []
      }
    })
  }, [address, allProjects])

  // Fetch all contract data using wagmi's useReadContracts
  const { data: contractData, isLoading: contractsLoading, refetch } = useReadContracts({
    contracts: contracts as any,
    query: {
      enabled: !!address && contracts.length > 0,
    },
  })

  // Process contract data and build portfolio
  useEffect(() => {
    if (!address) {
      setPortfolio({
        totalInvested: BigInt(0),
        totalShares: BigInt(0),
        investments: [],
        isLoading: false,
        error: null,
        isRefreshing: false,
      })
      return
    }

    if (contractsLoading) {
      setPortfolio((prev) => ({ ...prev, isLoading: true }))
      return
    }

    try {
      console.log('📊 Processing portfolio data...')
      console.log('Projects:', allProjects.length)
      console.log('Contracts configured:', contracts.length)
      console.log('Contract data received:', contractData?.length)
      
      const investments: Investment[] = []
      let totalShares = BigInt(0)
      let totalInvested = BigInt(0)

      // Process results for each project
      for (let i = 0; i < allProjects.length; i++) {
        const project = allProjects[i]
        const investorInfoIndex = i * 2
        const pendingRewardsIndex = i * 2 + 1
        
        const investorInfoResult = contractData?.[investorInfoIndex]
        const pendingRewardsResult = contractData?.[pendingRewardsIndex]
        
        console.log(`Project ${i} (${project.id}):`, {
          investorInfoStatus: investorInfoResult?.status,
          investorInfoResult: investorInfoResult,
          pendingRewardsStatus: pendingRewardsResult?.status,
        })
        
        if (!investorInfoResult || investorInfoResult.status !== 'success') {
          console.warn(`❌ No investor info for ${project.id}`)
          continue
        }
        
        const investorInfo = investorInfoResult.result as [bigint, bigint, bigint]
        const shares = investorInfo[0]
        
        console.log(`  Shares for ${project.id}:`, shares.toString())
        
        // Only include if user has shares
        if (shares && shares > BigInt(0)) {
          const pendingRewards = pendingRewardsResult?.status === 'success' 
            ? (pendingRewardsResult.result as [bigint, bigint]) 
            : [BigInt(0), BigInt(0)]
          
          const rewardValue = pendingRewards[0] || BigInt(0)
          
          totalShares += shares
          totalInvested += shares
          
          investments.push({
            id: i + 1,
            projectId: project.id,
            name: project.name,
            image: project.image,
            shares: shares,
            currentValue: Number(shares) / 1e6, // Convert from smallest unit (6 decimals) to display value
            yield: Number(rewardValue) / 1e6, // Assuming 6 decimals for USDT
            apy: project.apy,
          })
          
          console.log(`  ✅ Added investment for ${project.id}`)
        }
      }

      console.log('📈 Final portfolio:', {
        investments: investments.length,
        totalShares: totalShares.toString(),
      })

      setPortfolio({
        totalShares,
        totalInvested,
        investments,
        isLoading: false,
        error: null,
        isRefreshing: false,
      })
    } catch (err) {
      console.error('❌ Portfolio error:', err)
      setPortfolio((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to load portfolio",
      }))
    }
  }, [address, contractData, contractsLoading, allProjects, contracts])

  // Listen for investment events and refetch
  const handleInvestmentSuccess = useCallback(async () => {
    // Indicate a short refresh cycle post-transaction
    setPortfolio((prev) => ({ ...prev, isRefreshing: true }))
    // Wait a moment for transaction to be confirmed
    await new Promise((resolve) => setTimeout(resolve, 2000))
    await refetch()
    setPortfolio((prev) => ({ ...prev, isRefreshing: false }))
  }, [refetch])

  return {
    portfolio,
    refetch,
    onInvestmentSuccess: handleInvestmentSuccess,
    address,
  }
}

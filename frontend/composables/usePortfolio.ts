/**
 * Portfolio Composable
 * Portfolio-specific functionality built on top of useMortgageContract
 */

import { computed, ref, watch, type Ref } from 'vue'
import { useMortgageContract } from './useMortgageContract'
import { formatUSDT, parseUSDT, getStageName } from '~/utils/contract/constants'
import { FundingStage } from '~/utils/contract/constants'

export interface PortfolioInvestment {
  id: string
  contractAddress: string
  propertyValue: bigint
  loanAmount: bigint
  interestRate: bigint
  loanTerm: bigint
  fundingStage: FundingStage
  shares: bigint
  sharePercentage: number
  investedAmount: bigint
  entitledPrincipal: bigint
  entitledInterest: bigint
  withdrawablePrincipal: bigint
  withdrawableInterest: bigint
  createdAt: number
  lastUpdated: number
}

export interface PortfolioEarnings {
  totalEntitledPrincipal: bigint
  totalEntitledInterest: bigint
  totalWithdrawablePrincipal: bigint
  totalWithdrawableInterest: bigint
  totalWithdrawn: bigint
  earningsHistory: EarningsEvent[]
}

export interface EarningsEvent {
  id: string
  type: 'principal_deposited' | 'interest_deposited' | 'withdrawal'
  amount: bigint
  principalAmount?: bigint
  interestAmount?: bigint
  contractAddress: string
  timestamp: number
  transactionHash: string
}

export interface PortfolioSummary {
  totalInvested: bigint
  totalEntitledPrincipal: bigint
  totalEntitledInterest: bigint
  totalWithdrawable: bigint
  totalEarnings: bigint
  investmentCount: number
  activeInvestments: number
  totalReturn: number
  annualizedReturn: number
}

export function usePortfolio() {
  const mortgageContract = useMortgageContract({
    autoRefresh: true,
    refreshInterval: 5000 // 5 second refresh for portfolio
  })

  // Portfolio state
  const investments = ref<PortfolioInvestment[]>([])
  const earningsHistory = ref<EarningsEvent[]>([])
  const isLoadingPortfolio = ref(false)
  const lastPortfolioUpdate = ref(0)

  // Generate portfolio ID from contract address
  const getInvestmentId = (contractAddress: string): string => {
    return `investment_${contractAddress.slice(-8)}`
  }

  // Create portfolio investment from contract data
  const createPortfolioInvestment = (contractAddress: string): PortfolioInvestment => {
    const id = getInvestmentId(contractAddress)
    const shares = mortgageContract.investorShares.value
    const totalShares = mortgageContract.totalShares.value
    const investedAmount = shares // 1 USDT = 1 share assumption

    return {
      id,
      contractAddress,
      propertyValue: 0n, // Will be populated from contract details
      loanAmount: 0n, // Will be populated from contract details
      interestRate: 0n, // Will be populated from contract details
      loanTerm: 0n, // Will be populated from contract details
      fundingStage: mortgageContract.fundingStage.value as FundingStage,
      shares,
      sharePercentage: mortgageContract.userSharePercentage.value,
      investedAmount,
      entitledPrincipal: mortgageContract.entitledPrincipal.value,
      entitledInterest: mortgageContract.entitledInterest.value,
      withdrawablePrincipal: mortgageContract.withdrawablePrincipal.value,
      withdrawableInterest: mortgageContract.withdrawableInterest.value,
      createdAt: Date.now(), // Will be populated from contract creation
      lastUpdated: Date.now()
    }
  }

  // Calculate portfolio summary
  const portfolioSummary = computed((): PortfolioSummary => {
    if (investments.value.length === 0) {
      return {
        totalInvested: 0n,
        totalEntitledPrincipal: 0n,
        totalEntitledInterest: 0n,
        totalWithdrawable: 0n,
        totalEarnings: 0n,
        investmentCount: 0,
        activeInvestments: 0,
        totalReturn: 0,
        annualizedReturn: 0
      }
    }

    const totalInvested = investments.value.reduce((sum, inv) => sum + inv.investedAmount, 0n)
    const totalEntitledPrincipal = investments.value.reduce((sum, inv) => sum + inv.entitledPrincipal, 0n)
    const totalEntitledInterest = investments.value.reduce((sum, inv) => sum + inv.entitledInterest, 0n)
    const totalWithdrawable = investments.value.reduce((sum, inv) =>
      sum + inv.withdrawablePrincipal + inv.withdrawableInterest, 0n
    )
    const totalEarnings = totalEntitledPrincipal + totalEntitledInterest
    const activeInvestments = investments.value.filter(inv =>
      inv.fundingStage === FundingStage.ACTIVE || inv.fundingStage === FundingStage.REPAID
    ).length

    // Calculate returns
    const totalReturn = totalInvested > 0n
      ? Number((totalEarnings * 10000n) / totalInvested) / 100 // Basis points to percentage
      : 0

    // Simplified annualized return (would need more data for accurate calculation)
    const annualizedReturn = totalReturn // Placeholder - would use actual investment duration

    return {
      totalInvested,
      totalEntitledPrincipal,
      totalEntitledInterest,
      totalWithdrawable,
      totalEarnings,
      investmentCount: investments.value.length,
      activeInvestments,
      totalReturn,
      annualizedReturn
    }
  })

  // Portfolio earnings
  const portfolioEarnings = computed((): PortfolioEarnings => {
    const totalEntitledPrincipal = investments.value.reduce((sum, inv) => sum + inv.entitledPrincipal, 0n)
    const totalEntitledInterest = investments.value.reduce((sum, inv) => sum + inv.entitledInterest, 0n)
    const totalWithdrawablePrincipal = investments.value.reduce((sum, inv) => sum + inv.withdrawablePrincipal, 0n)
    const totalWithdrawableInterest = investments.value.reduce((sum, inv) => sum + inv.withdrawableInterest, 0n)
    const totalWithdrawn = totalEntitledPrincipal + totalEntitledInterest - totalWithdrawablePrincipal - totalWithdrawableInterest

    return {
      totalEntitledPrincipal,
      totalEntitledInterest,
      totalWithdrawablePrincipal,
      totalWithdrawableInterest,
      totalWithdrawn,
      earningsHistory: earningsHistory.value
    }
  })

  // Formatted portfolio data
  const formattedPortfolio = computed(() => ({
    ...portfolioSummary.value,
    formatted: {
      totalInvested: formatUSDT(portfolioSummary.value.totalInvested),
      totalEarnings: formatUSDT(portfolioSummary.value.totalEarnings),
      totalWithdrawable: formatUSDT(portfolioSummary.value.totalWithdrawable),
      totalEntitledPrincipal: formatUSDT(portfolioSummary.value.totalEntitledPrincipal),
      totalEntitledInterest: formatUSDT(portfolioSummary.value.totalEntitledInterest),
      totalReturn: `${portfolioSummary.value.totalReturn.toFixed(2)}%`,
      annualizedReturn: `${portfolioSummary.value.annualizedReturn.toFixed(2)}%`
    }
  }))

  // Update portfolio data
  const updatePortfolioData = async () => {
    if (!mortgageContract.address.value || mortgageContract.investorShares.value === 0n) {
      investments.value = []
      return
    }

    isLoadingPortfolio.value = true

    try {
      // Create or update current investment
      const currentInvestment = createPortfolioInvestment(mortgageContract.address.value!)

      // Update existing investment or add new one
      const existingIndex = investments.value.findIndex(
        inv => inv.contractAddress === currentInvestment.contractAddress
      )

      if (existingIndex >= 0) {
        investments.value[existingIndex] = {
          ...currentInvestment,
          lastUpdated: Date.now()
        }
      } else {
        investments.value.push(currentInvestment)
      }

      lastPortfolioUpdate.value = Date.now()
    } catch (error) {
      console.error('Error updating portfolio data:', error)
    } finally {
      isLoadingPortfolio.value = false
    }
  }

  // Add earnings event
  const addEarningsEvent = (event: EarningsEvent) => {
    earningsHistory.value.unshift(event) // Newest events first

    // Keep only last 100 events to prevent memory issues
    if (earningsHistory.value.length > 100) {
      earningsHistory.value = earningsHistory.value.slice(0, 100)
    }
  }

  // Setup real-time portfolio updates
  const setupPortfolioListeners = () => {
    // Listen for mortgage contract events that affect portfolio
    mortgageContract.setupEventListeners(
      (investor, amount, shares) => {
        // Investment event - update portfolio
        updatePortfolioData()

        addEarningsEvent({
          id: `invest_${Date.now()}`,
          type: 'principal_deposited',
          amount,
          contractAddress: mortgageContract.address.value || '',
          timestamp: Date.now(),
          transactionHash: '' // Will be populated from event
        })
      }
    )

    // Watch for changes in contract data
    watch([
      () => mortgageContract.entitledPrincipal.value,
      () => mortgageContract.entitledInterest.value,
      () => mortgageContract.withdrawablePrincipal.value,
      () => mortgageContract.withdrawableInterest.value,
      () => mortgageContract.fundingStage.value
    ], () => {
      updatePortfolioData()
    }, { deep: true })

    // Watch for connection changes
    watch([mortgageContract.isConnected, mortgageContract.address], () => {
      if (mortgageContract.isConnected.value && mortgageContract.address.value) {
        updatePortfolioData()
      }
    })
  }

  // Withdrawal functions
  const withdrawPortfolioPrincipal = async (amount: bigint): Promise<`0x${string}`> => {
    const txHash = await mortgageContract.withdrawPrincipal(amount)

    // Add earnings event
    addEarningsEvent({
      id: `withdraw_principal_${Date.now()}`,
      type: 'withdrawal',
      principalAmount: amount,
      amount,
      contractAddress: mortgageContract.address.value || '',
      timestamp: Date.now(),
      transactionHash: txHash
    })

    await updatePortfolioData()
    return txHash
  }

  const withdrawPortfolioInterest = async (amount: bigint): Promise<`0x${string}`> => {
    const txHash = await mortgageContract.withdrawInterest(amount)

    // Add earnings event
    addEarningsEvent({
      id: `withdraw_interest_${Date.now()}`,
      type: 'withdrawal',
      interestAmount: amount,
      amount,
      contractAddress: mortgageContract.address.value || '',
      timestamp: Date.now(),
      transactionHash: txHash
    })

    await updatePortfolioData()
    return txHash
  }

  const withdrawPortfolioPayout = async (principalAmount: bigint, interestAmount: bigint): Promise<`0x${string}`> => {
    const txHash = await mortgageContract.withdrawPayoutAmounts(principalAmount, interestAmount)

    // Add earnings event
    addEarningsEvent({
      id: `withdraw_combined_${Date.now()}`,
      type: 'withdrawal',
      principalAmount,
      interestAmount,
      amount: principalAmount + interestAmount,
      contractAddress: mortgageContract.address.value || '',
      timestamp: Date.now(),
      transactionHash: txHash
    })

    await updatePortfolioData()
    return txHash
  }

  // Initialize portfolio
  const initializePortfolio = () => {
    setupPortfolioListeners()
    if (mortgageContract.isConnected.value && mortgageContract.address.value) {
      updatePortfolioData()
    }
  }

  // Auto-initialize
  initializePortfolio()

  return {
    // State
    investments: computed(() => investments.value),
    earningsHistory: computed(() => earningsHistory.value),
    isLoadingPortfolio: computed(() => isLoadingPortfolio.value),
    lastPortfolioUpdate: computed(() => lastPortfolioUpdate.value),

    // Computed
    portfolioSummary,
    portfolioEarnings,
    formattedPortfolio,

    // Methods
    updatePortfolioData,
    addEarningsEvent,
    withdrawPortfolioPrincipal,
    withdrawPortfolioInterest,
    withdrawPortfolioPayout,
    initializePortfolio,

    // Utilities from mortgage contract
    ...mortgageContract,

    // Formatters
    formatAmount: formatUSDT,
    formatPercentage: (value: number): string => `${value.toFixed(2)}%`,
    getStageName,

    // Validation
    hasInvestments: computed(() => investments.value.length > 0),
    hasWithdrawableFunds: computed(() => portfolioEarnings.value.totalWithdrawablePrincipal > 0n ||
      portfolioEarnings.value.totalWithdrawableInterest > 0n),
    hasActiveInvestments: computed(() => portfolioSummary.value.activeInvestments > 0)
  }
}
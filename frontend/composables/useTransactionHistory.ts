/**
 * Transaction History Composable
 * Handles historical transaction tracking, performance metrics, and export functionality
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useAccount, useWatchContractEvent, useReadContract, type Address } from '@wagmi/vue'
import {
  zeroAddress,
  formatEther,
  type GetContractReturnType,
  type Abi
} from 'viem'
import {
  MORTGAGE_CONTRACT_ABI,
  ERC20_ABI,
  getMortgageContractAddress,
  getUSDTTokenAddress,
  formatUSDT,
  parseUSDT
} from '~/utils/contract/constants'
import {
  type Transaction,
  type TransactionType,
  type TransactionStatus,
  type TransactionFilter,
  type TransactionEvent,
  type PerformanceMetrics,
  type ContractPerformance,
  type TransactionUpdate,
  type GasCostData,
  EVENT_SIGNATURES,
  TransactionError,
  createTransactionId,
  formatTransactionType,
  getTransactionTypeIcon,
  getTransactionTypeColor
} from '~/types/transactions'

interface UseTransactionHistoryOptions {
  contractAddress?: Address
  autoRefresh?: boolean
  refreshInterval?: number
  enableRealTimeUpdates?: boolean
}

export function useTransactionHistory(options: UseTransactionHistoryOptions = {}) {
  const {
    contractAddress,
    autoRefresh = true,
    refreshInterval = 30000,
    enableRealTimeUpdates = true
  } = options

  // Wagmi hooks
  const { address, chainId, isConnected } = useAccount()

  // State
  const transactions = ref<Transaction[]>([])
  const filteredTransactions = ref<Transaction[]>([])
  const isLoading = ref(false)
  const isLoadingMore = ref(false)
  const error = ref<TransactionError | null>(null)
  const lastUpdate = ref(0)
  const totalTransactions = ref(0)

  // Pagination
  const currentPage = ref(1)
  const pageSize = ref(20)
  const totalPages = ref(0)

  // Filtering
  const activeFilter = ref<TransactionFilter>({})

  // Real-time updates
  const isWatchingEvents = ref(false)
  const eventCleanup: Array<() => void> = []

  // Performance metrics
  const performanceMetrics = ref<PerformanceMetrics | null>(null)

  // Computed
  const sortedTransactions = computed(() => {
    return [...filteredTransactions.value].sort((a, b) => b.timestamp - a.timestamp)
  })

  const recentTransactions = computed(() => {
    return sortedTransactions.value.slice(0, 10)
  })

  const hasTransactions = computed(() => {
    return transactions.value.length > 0
  })

  const totalAmount = computed(() => {
    return filteredTransactions.value.reduce((sum, tx) => sum + BigInt(tx.amount), 0n)
  })

  const totalGasCost = computed(() => {
    return filteredTransactions.value.reduce((sum, tx) => {
      if (tx.gasCost?.ethCost) {
        return sum + BigInt(Math.floor(parseFloat(tx.gasCost.ethCost) * 1e18))
      }
      return sum
    }, 0n)
  })

  // Transaction type breakdown
  const transactionBreakdown = computed(() => {
    const breakdown = transactions.value.reduce((acc, tx) => {
      acc[tx.type] = (acc[tx.type] || 0) + BigInt(tx.amount)
      return acc
    }, {} as Record<TransactionType, bigint>)

    return breakdown
  })

  // Methods
  const fetchTransactions = async (
    page: number = 1,
    filters?: TransactionFilter
  ): Promise<void> => {
    if (!isConnected.value || !address.value) return

    try {
      isLoading.value = true
      error.value = null

      const contractAddr = contractAddress || getMortgageContractAddress(chainId.value || 1)

      // For now, we'll use mock data. In production, this would call an API
      // that indexes blockchain events for the user's address
      const mockTransactions = await generateMockTransactions(address.value, contractAddr)

      // Apply filters
      let filtered = mockTransactions
      if (filters) {
        filtered = applyFilters(mockTransactions, filters)
      }

      // Pagination
      const startIndex = (page - 1) * pageSize.value
      const endIndex = startIndex + pageSize.value
      const paginated = filtered.slice(startIndex, endIndex)

      if (page === 1) {
        transactions.value = filtered
        filteredTransactions.value = paginated
      } else {
        // Load more functionality
        transactions.value = [...transactions.value, ...filtered]
        filteredTransactions.value = paginated
      }

      totalTransactions.value = filtered.length
      totalPages.value = Math.ceil(filtered.length / pageSize.value)
      currentPage.value = page
      lastUpdate.value = Date.now()

      // Calculate performance metrics
      await calculatePerformanceMetrics()

    } catch (err) {
      console.error('Failed to fetch transactions:', err)
      error.value = TransactionError.fromError(err as Error, 'FETCH_TRANSACTIONS')
    } finally {
      isLoading.value = false
    }
  }

  const loadMore = async (): Promise<void> => {
    if (isLoadingMore.value || currentPage.value >= totalPages.value) return

    try {
      isLoadingMore.value = true
      await fetchTransactions(currentPage.value + 1, activeFilter.value)
    } finally {
      isLoadingMore.value = false
    }
  }

  const applyFilters = (txList: Transaction[], filters: TransactionFilter): Transaction[] => {
    return txList.filter(tx => {
      // Type filter
      if (filters.types && filters.types.length > 0) {
        if (!filters.types.includes(tx.type)) return false
      }

      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(tx.status)) return false
      }

      // Date range filter
      if (filters.dateRange) {
        const txDate = new Date(tx.timestamp * 1000)
        if (filters.dateRange.start && txDate < filters.dateRange.start) return false
        if (filters.dateRange.end && txDate > filters.dateRange.end) return false
      }

      // Contract filter
      if (filters.contractAddresses && filters.contractAddresses.length > 0) {
        if (!filters.contractAddresses.includes(tx.contractAddress)) return false
      }

      // Amount range filter
      if (filters.amountRange) {
        const txAmount = BigInt(tx.amount)
        if (filters.amountRange.min && txAmount < parseUSDT(filters.amountRange.min)) return false
        if (filters.amountRange.max && txAmount > parseUSDT(filters.amountRange.max)) return false
      }

      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        const searchableFields = [
          tx.transactionHash.toLowerCase(),
          tx.contractAddress.toLowerCase(),
          tx.contractTitle?.toLowerCase() || '',
          formatTransactionType(tx.type).toLowerCase()
        ]

        if (!searchableFields.some(field => field.includes(query))) return false
      }

      return true
    })
  }

  const setFilter = (filter: TransactionFilter): void => {
    activeFilter.value = filter
    fetchTransactions(1, filter)
  }

  const clearFilter = (): void => {
    activeFilter.value = {}
    fetchTransactions(1)
  }

  const refreshTransactions = async (): Promise<void> => {
    await fetchTransactions(currentPage.value, activeFilter.value)
  }

  // Performance metrics calculation
  const calculatePerformanceMetrics = async (): Promise<void> => {
    if (!address.value) return

    try {
      const investments = transactions.value.filter(tx => tx.type === 'invest')
      const withdrawals = transactions.value.filter(tx =>
        tx.type.startsWith('withdraw')
      )

      const totalInvested = investments.reduce((sum, tx) => sum + BigInt(tx.amount), 0n)
      const totalWithdrawn = withdrawals.reduce((sum, tx) => sum + BigInt(tx.amount), 0n)

      // Group by contract
      const contractGroups = groupByContract(transactions.value)

      const contracts: ContractPerformance[] = Object.entries(contractGroups).map(([contractAddr, txs]) => ({
        contractAddress: contractAddr,
        contractTitle: txs[0]?.contractTitle,
        totalInvested: formatUSDT(txs.filter(tx => tx.type === 'invest').reduce((sum, tx) => sum + BigInt(tx.amount), 0n)),
        totalWithdrawn: formatUSDT(txs.filter(tx => tx.type.startsWith('withdraw')).reduce((sum, tx) => sum + BigInt(tx.amount), 0n)),
        currentEarnings: formatUSDT(calculateEarnings(txs)),
        shareCount: '0', // Would need to get from contract
        ownershipPercentage: 0, // Would need to calculate from contract state
        performanceScore: calculatePerformanceScore(txs),
        firstInvestmentDate: Math.min(...txs.filter(tx => tx.type === 'invest').map(tx => tx.timestamp)),
        lastActivityDate: Math.max(...txs.map(tx => tx.timestamp))
      }))

      const earnings = totalWithdrawn - totalInvested

      performanceMetrics.value = {
        totalInvested: formatUSDT(totalInvested),
        totalWithdrawn: formatUSDT(totalWithdrawn),
        totalEarnings: formatUSDT(earnings),
        currentPortfolioValue: formatUSDT(totalInvested + earnings),
        yearToDateReturns: formatUSDT(calculateYearToDateReturns(transactions.value)),
        totalReturnPercentage: totalInvested > 0n ? Number((earnings * 10000n) / totalInvested) / 100 : 0,
        investmentsByContract: contracts,
        earningsByType: {
          principal: formatUSDT(calculateEarningsByType(transactions.value, 'principal')),
          interest: formatUSDT(calculateEarningsByType(transactions.value, 'interest'))
        },
        averageHoldingPeriod: calculateAverageHoldingPeriod(transactions.value),
        totalTransactions: transactions.value.length,
        lastTransactionDate: Math.max(...transactions.value.map(tx => tx.timestamp))
      }

    } catch (err) {
      console.error('Failed to calculate performance metrics:', err)
    }
  }

  // Export functionality
  const exportTransactions = async (
    filters?: TransactionFilter,
    options: {
      format?: 'csv' | 'json'
      includeEvents?: boolean
      includeGasCosts?: boolean
    } = {}
  ): Promise<void> => {
    try {
      const dataToExport = filters ? applyFilters(transactions.value, filters) : transactions.value

      if (options.format === 'csv') {
        await exportToCSV(dataToExport, options)
      } else {
        await exportToJSON(dataToExport, options)
      }
    } catch (err) {
      console.error('Export failed:', err)
      throw TransactionError.fromError(err as Error, 'EXPORT_FAILED')
    }
  }

  const exportToCSV = async (txs: Transaction[], options: any): Promise<void> => {
    const headers = [
      'Date', 'Type', 'Amount (USDT)', 'Contract', 'Transaction Hash',
      'Status', 'Gas Cost (ETH)', 'Gas Cost (USD)', 'Confirmations'
    ]

    const csvContent = [
      headers.join(','),
      ...txs.map(tx => [
        new Date(tx.timestamp * 1000).toISOString(),
        formatTransactionType(tx.type),
        tx.amount,
        tx.contractAddress,
        tx.transactionHash,
        tx.status,
        tx.gasCost?.ethCost || '',
        tx.gasCost?.usdCost || '',
        tx.confirmations || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToJSON = async (txs: Transaction[], options: any): Promise<void> => {
    const exportData = {
      transactions: txs,
      performanceMetrics: performanceMetrics.value,
      generatedAt: new Date().toISOString(),
      filters: activeFilter.value,
      options
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Real-time event watching
  const setupEventWatchers = (): void => {
    if (!enableRealTimeUpdates || !address.value || isWatchingEvents.value) return

    const contractAddr = contractAddress || getMortgageContractAddress(chainId.value || 1)

    try {
      // Watch for investment events
      const unwatchInvested = useWatchContractEvent({
        address: contractAddr,
        abi: MORTGAGE_CONTRACT_ABI,
        eventName: 'Invested',
        args: { investor: address.value },
        onLogs: (logs) => handleInvestmentEvents(logs)
      })

      // Watch for withdrawal events
      const unwatchWithdrawn = useWatchContractEvent({
        address: contractAddr,
        abi: MORTGAGE_CONTRACT_ABI,
        eventName: 'PayoutWithdrawn',
        args: { to: address.value },
        onLogs: (logs) => handleWithdrawalEvents(logs)
      })

      // Watch for distribution events
      const unwatchPrincipalDeposited = useWatchContractEvent({
        address: contractAddr,
        abi: MORTGAGE_CONTRACT_ABI,
        eventName: 'PrincipalDeposited',
        onLogs: (logs) => handleDistributionEvents(logs, 'principal')
      })

      const unwatchInterestDeposited = useWatchContractEvent({
        address: contractAddr,
        abi: MORTGAGE_CONTRACT_ABI,
        eventName: 'InterestDeposited',
        onLogs: (logs) => handleDistributionEvents(logs, 'interest')
      })

      eventCleanup.push(
        unwatchInvested,
        unwatchWithdrawn,
        unwatchPrincipalDeposited,
        unwatchInterestDeposited
      )

      isWatchingEvents.value = true
      console.log('✅ Transaction event watchers setup complete')

    } catch (err) {
      console.error('❌ Failed to setup event watchers:', err)
    }
  }

  const removeEventWatchers = (): void => {
    eventCleanup.forEach(cleanup => cleanup())
    eventCleanup.length = 0
    isWatchingEvents.value = false
    console.log('✅ Transaction event watchers removed')
  }

  // Event handlers
  const handleInvestmentEvents = (logs: any[]): void => {
    logs.forEach(log => {
      const transaction: Transaction = {
        id: createTransactionId(log.transactionHash, log.logIndex),
        timestamp: Math.floor(Date.now() / 1000),
        type: 'invest',
        amount: formatUSDT(log.args.amount),
        contractAddress: log.address,
        transactionHash: log.transactionHash,
        blockNumber: Number(log.blockNumber),
        status: 'confirmed',
        relatedEvents: [{
          name: log.eventName,
          signature: log.topics[0],
          address: log.address,
          args: log.args,
          timestamp: Math.floor(Date.now() / 1000),
          blockNumber: Number(log.blockNumber),
          transactionHash: log.transactionHash,
          logIndex: log.logIndex
        }]
      }

      addTransaction(transaction)
    })
  }

  const handleWithdrawalEvents = (logs: any[]): void => {
    logs.forEach(log => {
      const principalAmount = BigInt(log.args.principalAmount || 0)
      const interestAmount = BigInt(log.args.interestAmount || 0)
      const totalAmount = principalAmount + interestAmount

      const transaction: Transaction = {
        id: createTransactionId(log.transactionHash, log.logIndex),
        timestamp: Math.floor(Date.now() / 1000),
        type: principalAmount > 0n && interestAmount > 0n ? 'withdraw_both' :
              principalAmount > 0n ? 'withdraw_principal' : 'withdraw_interest',
        amount: formatUSDT(totalAmount),
        contractAddress: log.address,
        transactionHash: log.transactionHash,
        blockNumber: Number(log.blockNumber),
        status: 'confirmed',
        relatedEvents: [{
          name: log.eventName,
          signature: log.topics[0],
          address: log.address,
          args: log.args,
          timestamp: Math.floor(Date.now() / 1000),
          blockNumber: Number(log.blockNumber),
          transactionHash: log.transactionHash,
          logIndex: log.logIndex
        }]
      }

      addTransaction(transaction)
    })
  }

  const handleDistributionEvents = (logs: any[], type: 'principal' | 'interest'): void => {
    logs.forEach(log => {
      const transaction: Transaction = {
        id: createTransactionId(log.transactionHash, log.logIndex),
        timestamp: Math.floor(Date.now() / 1000),
        type: type === 'principal' ? 'distribution_principal' : 'distribution_interest',
        amount: formatUSDT(log.args.amount),
        contractAddress: log.address,
        transactionHash: log.transactionHash,
        blockNumber: Number(log.blockNumber),
        status: 'confirmed',
        relatedEvents: [{
          name: log.eventName,
          signature: log.topics[0],
          address: log.address,
          args: log.args,
          timestamp: Math.floor(Date.now() / 1000),
          blockNumber: Number(log.blockNumber),
          transactionHash: log.transactionHash,
          logIndex: log.logIndex
        }]
      }

      addTransaction(transaction)
    })
  }

  const addTransaction = (transaction: Transaction): void => {
    // Avoid duplicates
    const existingIndex = transactions.value.findIndex(tx => tx.id === transaction.id)
    if (existingIndex >= 0) {
      // Update existing transaction
      transactions.value[existingIndex] = transaction
    } else {
      // Add new transaction
      transactions.value.unshift(transaction)
      lastUpdate.value = Date.now()
    }

    // Reapply filters
    filteredTransactions.value = applyFilters(transactions.value, activeFilter.value)

    // Recalculate performance metrics
    calculatePerformanceMetrics()
  }

  // Helper functions
  const groupByContract = (txs: Transaction[]): Record<string, Transaction[]> => {
    return txs.reduce((groups, tx) => {
      if (!groups[tx.contractAddress]) {
        groups[tx.contractAddress] = []
      }
      groups[tx.contractAddress].push(tx)
      return groups
    }, {} as Record<string, Transaction[]>)
  }

  const calculateEarnings = (txs: Transaction[]): bigint => {
    const investments = txs.filter(tx => tx.type === 'invest').reduce((sum, tx) => sum + BigInt(tx.amount), 0n)
    const withdrawals = txs.filter(tx => tx.type.startsWith('withdraw')).reduce((sum, tx) => sum + BigInt(tx.amount), 0n)
    return withdrawals - investments
  }

  const calculatePerformanceScore = (txs: Transaction[]): number => {
    // Simple scoring algorithm based on returns and activity
    const earnings = calculateEarnings(txs)
    const investments = txs.filter(tx => tx.type === 'invest').reduce((sum, tx) => sum + BigInt(tx.amount), 0n)

    if (investments === 0n) return 0

    const returnPercentage = Number((earnings * 10000n) / investments) / 100
    const activityScore = Math.min(txs.length * 2, 50) // Up to 50 points for activity
    const returnScore = Math.max(Math.min(returnPercentage * 5, 50), -50) // -50 to 50 points for returns

    return Math.max(0, Math.min(100, 50 + activityScore + returnScore))
  }

  const calculateYearToDateReturns = (txs: Transaction[]): bigint => {
    const currentYear = new Date().getFullYear()
    const ytdTxs = txs.filter(tx => new Date(tx.timestamp * 1000).getFullYear() === currentYear)

    const investments = ytdTxs.filter(tx => tx.type === 'invest').reduce((sum, tx) => sum + BigInt(tx.amount), 0n)
    const withdrawals = ytdTxs.filter(tx => tx.type.startsWith('withdraw')).reduce((sum, tx) => sum + BigInt(tx.amount), 0n)

    return withdrawals - investments
  }

  const calculateEarningsByType = (txs: Transaction[], type: 'principal' | 'interest'): bigint => {
    return txs
      .filter(tx => {
        if (type === 'principal') {
          return tx.type === 'withdraw_principal' || tx.type === 'distribution_principal'
        } else {
          return tx.type === 'withdraw_interest' || tx.type === 'distribution_interest'
        }
      })
      .reduce((sum, tx) => sum + BigInt(tx.amount), 0n)
  }

  const calculateAverageHoldingPeriod = (txs: Transaction[]): number => {
    const investmentWithdrawalPairs: Array<{ investment: Transaction; withdrawal: Transaction }> = []

    // Simple pairing logic - in production this would be more sophisticated
    txs.forEach(tx => {
      if (tx.type === 'invest') {
        const withdrawal = txs.find(w =>
          w.type.startsWith('withdraw') &&
          w.contractAddress === tx.contractAddress &&
          w.timestamp > tx.timestamp
        )

        if (withdrawal) {
          investmentWithdrawalPairs.push({ investment: tx, withdrawal })
        }
      }
    })

    if (investmentWithdrawalPairs.length === 0) return 0

    const totalDays = investmentWithdrawalPairs.reduce((sum, pair) => {
      const days = (pair.withdrawal.timestamp - pair.investment.timestamp) / (60 * 60 * 24)
      return sum + days
    }, 0)

    return Math.round(totalDays / investmentWithdrawalPairs.length)
  }

  // Mock data generation for development
  const generateMockTransactions = async (userAddress: Address, contractAddr: Address): Promise<Transaction[]> => {
    const mockTransactions: Transaction[] = []
    const now = Math.floor(Date.now() / 1000)

    // Generate some mock transactions
    for (let i = 0; i < 15; i++) {
      const timestamp = now - (i * 86400 * 7) // Weekly intervals
      const isInvestment = i % 3 === 0

      const transaction: Transaction = {
        id: `0x${Math.random().toString(16).slice(2, 66)}-${i}`,
        timestamp,
        type: isInvestment ? 'invest' : (i % 2 === 0 ? 'withdraw_principal' : 'withdraw_interest'),
        amount: formatUSDT(BigInt(Math.floor(Math.random() * 1000000) + 100000) * 1000000n),
        contractAddress: contractAddr,
        contractTitle: `Mortgage Contract ${(i % 3) + 1}`,
        transactionHash: `0x${Math.random().toString(16).slice(2, 66)}`,
        blockNumber: Math.floor(Math.random() * 19000000) + 17000000,
        gasUsed: `${Math.floor(Math.random() * 100000) + 50000}`,
        gasCost: {
          ethCost: (Math.random() * 0.01 + 0.001).toFixed(6),
          usdCost: (Math.random() * 20 + 2).toFixed(2)
        },
        status: 'confirmed',
        confirmations: Math.floor(Math.random() * 1000) + 100,
        networkId: 1,
        relatedEvents: []
      }

      mockTransactions.push(transaction)
    }

    return mockTransactions
  }

  // Auto-refresh
  let refreshInterval: NodeJS.Timeout | null = null

  const startAutoRefresh = (): void => {
    if (autoRefresh && !refreshInterval) {
      refreshInterval = setInterval(() => {
        refreshTransactions()
      }, refreshInterval)
    }
  }

  const stopAutoRefresh = (): void => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
  }

  // Watch for connection and address changes
  watch([isConnected, address], async ([connected, addr]) => {
    if (connected && addr) {
      await fetchTransactions()
      setupEventWatchers()
      startAutoRefresh()
    } else {
      stopAutoRefresh()
      removeEventWatchers()
      transactions.value = []
      filteredTransactions.value = []
      performanceMetrics.value = null
    }
  })

  // Lifecycle
  onMounted(async () => {
    if (isConnected.value && address.value) {
      await fetchTransactions()
      setupEventWatchers()
      startAutoRefresh()
    }
  })

  onUnmounted(() => {
    stopAutoRefresh()
    removeEventWatchers()
  })

  return {
    // State
    transactions,
    filteredTransactions,
    sortedTransactions,
    recentTransactions,
    isLoading,
    isLoadingMore,
    error,
    lastUpdate,
    currentPage,
    totalPages,
    totalTransactions,
    activeFilter,
    isWatchingEvents,
    performanceMetrics,

    // Computed
    hasTransactions,
    totalAmount,
    totalGasCost,
    transactionBreakdown,

    // Methods
    fetchTransactions,
    loadMore,
    setFilter,
    clearFilter,
    refreshTransactions,
    exportTransactions,
    calculatePerformanceMetrics,
    setupEventWatchers,
    removeEventWatchers,

    // Utilities
    formatTransactionType,
    getTransactionTypeIcon,
    getTransactionTypeColor
  }
}
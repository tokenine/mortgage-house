/**
 * Operational Metrics Composable
 * Epic 5.4 - Operational Metrics and Monitoring
 */

import { computed, ref, watch, type Ref } from 'vue'
import { formatUSDT, parseUSDT } from '~/utils/contract/constants'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, type UseReadContractReturnType } from '@wagmi/vue'
import { StructuredMortgageError, MortgageError, MortgageErrorSeverity, type MortgageErrorContext } from '~/types/errors'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { useGasOptimization } from '~/composables/useGasOptimization'
import { MORTGAGE_CONTRACT_ABI, getMortgageContractAddress } from '~/utils/contract/constants'

// ========================================
  // EPIC 5.4 OPERATIONAL METRICS TYPES
  // ========================================

  interface PortfolioMetrics {
    totalFunded: string
    totalInvestors: number
    activeContracts: number
    totalPrincipalRepaid: string
    totalInterestPaid: string
    totalValueLocked: string
    averageROI: string
    portfolioHealth: 'excellent' | 'good' | 'fair' | 'poor'
    lastUpdated: Date
  }

  interface ContractAnalytics {
    address: string
    propertyName: string
    stage: number
    stageName: string
    fundingProgress: number
    investorCount: number
    averageInvestment: string
    totalDistributed: string
    repaymentRate: number
    timeToCompletion: number
    efficiencyScore: number
    performanceMetrics: PerformanceMetrics
    complianceMetrics: ComplianceMetrics
    riskScore: number
    createdAt: Date
    lastActivity: Date
  }

  interface PerformanceMetrics {
    totalInvested: string
    totalDistributed: string
    investmentRate: string
    distributionRate: string
    efficiencyScore: number
    fundingDuration: number
    activeDuration: number
  }

  interface ComplianceMetrics {
    regulatoryFlags: string[]
    riskScore: number
    complianceScore: number
    auditScore: number
    isCompliant: boolean
    lastAuditDate: Date
  }

  interface TimelineEvent {
    timestamp: number
    event: string
    amount: string
    type: 'creation' | 'funding' | 'withdrawal' | 'repayment' | 'distribution' | 'stage_change'
    blockNumber: number
  }

  interface AlertSettings {
    fundingThresholds: {
      low: number
      high: number
    }
    repaymentThresholds: {
      late: number
      overdue: number
    }
    riskThresholds: {
      moderate: number
      high: number
      critical: number
    }
    enableNotifications: boolean
    emailAlerts: boolean
    smsAlerts: boolean
  }

  interface OperationalAlert {
    id: string
    contractAddress: string
    type: 'info' | 'warning' | 'error' | 'success'
    severity: 'low' | 'medium' | 'high' | 'critical'
    title: string
    message: string
    timestamp: Date
    dismissed: boolean
    requiresAction: boolean
    actions?: Array<{
      label: string
      action: () => void
      variant: 'primary' | 'secondary' | 'danger'
    }>
  }

  interface ReportFilters {
    dateRange: {
      start: Date
      end: Date
    }
    contractAddresses: string[]
    stages: number[]
    investorAddresses: string[]
    includeInactive: boolean
    format: 'csv' | 'json' | 'pdf'
  }

  interface MetricsCalculationStatus {
    status: 'idle' | 'calculating' | 'fetching' | 'success' | 'error'
    message?: string
    error?: string
    calculationType?: 'portfolio' | 'contract' | 'performance' | 'compliance'
    timestamp?: Date
  }

export function useOperationalMetrics() {
  // ========================================
  // CORE COMPOSABLE INTEGRATION
  // ========================================

  const { address, isConnected, chainId } = useAccount()
  const { handleError } = useErrorHandler()
  const { getGasEstimate } = useGasOptimization()

  // ========================================
  // METRICS STATE MANAGEMENT
  // ========================================

  const portfolioMetrics = ref<PortfolioMetrics | null>(null)
  const contractAnalytics = ref<ContractAnalytics[]>([])
  const activeAlerts = ref<OperationalAlert[]>([])
  const dismissedAlerts = ref<OperationalAlert[]>([])
  const timelineEvents = ref<TimelineEvent[]>([])

  const metricsStatus = ref<MetricsCalculationStatus>({ status: 'idle' })
  const alertSettings = ref<AlertSettings>({
    fundingThresholds: { low: 10, high: 90 },
    repaymentThresholds: { late: 7, overdue: 14 },
    riskThresholds: { moderate: 50, high: 75, critical: 90 },
    enableNotifications: true,
    emailAlerts: true,
    smsAlerts: false
  })

  const reportFilters = ref<ReportFilters>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date()
    },
    contractAddresses: [],
    stages: [],
    investorAddresses: [],
    includeInactive: false,
    format: 'csv'
  })

  // ========================================
  // METRICS CALCULATION FUNCTIONS
  // ========================================

  /**
   * Calculate comprehensive portfolio metrics
   */
  const calculatePortfolioMetrics = async (contractAddresses: string[] = []): Promise<PortfolioMetrics> => {
    try {
      metricsStatus.value = {
        status: 'calculating',
        message: 'Calculating portfolio-wide metrics...',
        calculationType: 'portfolio',
        timestamp: new Date()
      }

      // If no contracts provided, get all deployed contracts
      const contracts = contractAddresses.length > 0 ? contractAddresses : await getAllDeployedContracts()

      let totalFunded = 0n
      let totalInvestors = 0
      let activeContracts = 0
      let totalPrincipalRepaid = 0n
      let totalInterestPaid = 0n
      let totalValueLocked = 0n
      let totalROI = 0
      let contractCount = 0

      // Aggregate metrics across all contracts
      for (const contractAddress of contracts) {
        try {
          const metrics = await getContractMetrics(contractAddress as `0x${string}`)

          totalFunded += parseUSDT(metrics.totalFunded)
          totalInvestors += metrics.totalInvestors
          activeContracts += metrics.activeContracts
          totalPrincipalRepaid += parseUSDT(metrics.totalPrincipalRepaid)
          totalInterestPaid += parseUSDT(metrics.totalInterestPaid)
          totalValueLocked += parseUSDT(metrics.totalValueLocked)
          totalROI += metrics.averageROI
          contractCount++

        } catch (error) {
          console.warn(`Failed to fetch metrics for contract ${contractAddress}:`, error)
          continue
        }
      }

      // Calculate portfolio health
      const portfolioHealth = calculatePortfolioHealth({
        totalFunded,
        totalPrincipalRepaid,
        totalInterestPaid,
        activeContracts,
        contractCount
      })

      // Calculate average ROI
      const averageROI = contractCount > 0 ? totalROI / contractCount : 0

      const portfolioMetricsData: PortfolioMetrics = {
        totalFunded: formatUSDT(totalFunded),
        totalInvestors,
        activeContracts,
        totalPrincipalRepaid: formatUSDT(totalPrincipalRepaid),
        totalInterestPaid: formatUSDT(totalInterestPaid),
        totalValueLocked: formatUSDT(totalValueLocked),
        averageROI: averageROI.toFixed(2) + '%',
        portfolioHealth,
        lastUpdated: new Date()
      }

      portfolioMetrics.value = portfolioMetricsData

      metricsStatus.value = {
        status: 'success',
        message: 'Portfolio metrics calculated successfully',
        calculationType: 'portfolio',
        timestamp: new Date()
      }

      return portfolioMetricsData

    } catch (error) {
      metricsStatus.value = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to calculate portfolio metrics',
        calculationType: 'portfolio',
        timestamp: new Date()
      }

      const mortgageError = MortgageError.fromError(error, {
        action: 'calculate_portfolio_metrics',
        contractAddresses
      })
      handleError(mortgageError)
      throw mortgageError
    }
  }

  /**
   * Get detailed contract analytics
   */
  const getContractAnalytics = async (contractAddress: `0x${string}`): Promise<ContractAnalytics> => {
    try {
      metricsStatus.value = {
        status: 'fetching',
        message: 'Fetching contract analytics...',
        calculationType: 'contract',
        timestamp: new Date()
      }

      // Get basic contract info
      const basicInfo = await getBasicContractInfo(contractAddress)
      const contractMetrics = await getContractMetrics(contractAddress)
      const performanceMetrics = await getPerformanceMetrics(contractAddress)
      const complianceMetrics = await getComplianceMetrics(contractAddress)
      const timeline = await getContractTimeline(contractAddress)

      const analytics: ContractAnalytics = {
        address: contractAddress,
        propertyName: basicInfo.propertyName,
        stage: basicInfo.stage,
        stageName: basicInfo.stageName,
        fundingProgress: contractMetrics.fundingProgress,
        investorCount: contractMetrics.investorCount,
        averageInvestment: contractMetrics.averageInvestment,
        totalDistributed: contractMetrics.totalDistributed,
        repaymentRate: contractMetrics.repaymentRate,
        timeToCompletion: contractMetrics.timeToCompletion,
        efficiencyScore: performanceMetrics.efficiencyScore,
        performanceMetrics,
        complianceMetrics,
        riskScore: complianceMetrics.riskScore,
        createdAt: basicInfo.createdAt,
        lastActivity: new Date(Math.max(...timeline.map(e => e.timestamp)))
      }

      metricsStatus.value = {
        status: 'success',
        message: 'Contract analytics fetched successfully',
        calculationType: 'contract',
        timestamp: new Date()
      }

      return analytics

    } catch (error) {
      metricsStatus.value = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to fetch contract analytics',
        calculationType: 'contract',
        timestamp: new Date()
      }

      const mortgageError = MortgageError.fromError(error, {
        action: 'get_contract_analytics',
        contractAddress
      })
      handleError(mortgageError)
      throw mortgageError
    }
  }

  /**
   * Get portfolio-wide analytics for multiple contracts
   */
  const getPortfolioAnalytics = async (contractAddresses: string[] = []): Promise<ContractAnalytics[]> => {
    try {
      const contracts = contractAddresses.length > 0 ? contractAddresses : await getAllDeployedContracts()

      const analyticsPromises = contracts.map(async (address) => {
        try {
          return await getContractAnalytics(address as `0x${string}`)
        } catch (error) {
          console.warn(`Failed to get analytics for contract ${address}:`, error)
          return null
        }
      })

      const results = await Promise.all(analyticsPromises)
      const validAnalytics = results.filter((analytics): analytics is ContractAnalytics => analytics !== null)

      contractAnalytics.value = validAnalytics
      return validAnalytics

    } catch (error) {
      const mortgageError = MortgageError.fromError(error, {
        action: 'get_portfolio_analytics',
        contractAddresses
      })
      handleError(mortgageError)
      throw mortgageError
    }
  }

  // ========================================
  // SMART CONTRACT INTERACTION FUNCTIONS
  // ========================================

  /**
   * Get contract metrics from smart contract
   */
  const getContractMetrics = async (contractAddress: `0x${string}`) => {
    const result = await useReadContract({
      address: contractAddress,
      abi: MORTGAGE_CONTRACT_ABI,
      functionName: 'getContractAnalytics'
    })

    return {
      fundingProgress: Number(result.data?.[0] || 0) / 100, // Convert from basis points
      investorCount: Number(result.data?.[1] || 0),
      averageInvestment: formatUSDT(result.data?.[2] || 0n),
      totalDistributed: formatUSDT(result.data?.[3] || 0n),
      repaymentRate: Number(result.data?.[4] || 0) / 100, // Convert from basis points
      timeToCompletion: Number(result.data?.[5] || 0)
    }
  }

  /**
   * Get performance metrics from smart contract
   */
  const getPerformanceMetrics = async (contractAddress: `0x${string}`): Promise<PerformanceMetrics> => {
    const result = await useReadContract({
      address: contractAddress,
      abi: MORTGAGE_CONTRACT_ABI,
      functionName: 'getPerformanceMetrics'
    })

    return {
      totalInvested: formatUSDT(result.data?.[0] || 0n),
      totalDistributed: formatUSDT(result.data?.[1] || 0n),
      investmentRate: formatUSDT(result.data?.[2] || 0n),
      distributionRate: formatUSDT(result.data?.[3] || 0n),
      efficiencyScore: Number(result.data?.[4] || 0) / 100, // Convert from basis points
      fundingDuration: 0, // Would calculate from stage timestamps
      activeDuration: 0  // Would calculate from stage timestamps
    }
  }

  /**
   * Get compliance metrics from smart contract
   */
  const getComplianceMetrics = async (contractAddress: `0x${string}`): Promise<ComplianceMetrics> => {
    const result = await useReadContract({
      address: contractAddress,
      abi: MORTGAGE_CONTRACT_ABI,
      functionName: 'getComplianceMetrics'
    })

    const riskScore = Number(result.data?.[1] || 0) / 100
    const complianceScore = Number(result.data?.[2] || 0) / 100

    return {
      regulatoryFlags: result.data?.[0] || [],
      riskScore,
      complianceScore,
      auditScore: Number(result.data?.[3] || 0) / 100,
      isCompliant: complianceScore >= 90,
      lastAuditDate: new Date() // Would fetch from actual audit data
    }
  }

  /**
   * Get contract timeline from smart contract
   */
  const getContractTimeline = async (contractAddress: `0x${string}`): Promise<TimelineEvent[]> => {
    const result = await useReadContract({
      address: contractAddress,
      abi: MORTGAGE_CONTRACT_ABI,
      functionName: 'getEventTimeline'
    })

    const timestamps = result.data?.[0] || []
    const events = result.data?.[1] || []
    const amounts = result.data?.[2] || []

    return timestamps.map((timestamp: bigint, index: number) => ({
      timestamp: Number(timestamp) * 1000, // Convert to milliseconds
      event: events[index] || '',
      amount: formatUSDT(amounts[index] || 0n),
      type: determineEventType(events[index] || ''),
      blockNumber: 0 // Would fetch from actual block data
    }))
  }

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  /**
   * Get all deployed contracts (would integrate with deployment tracking)
   */
  const getAllDeployedContracts = async (): Promise<string[]> => {
    // In a full implementation, this would query the deployment tracking system
    // For now, return empty array or use mock data
    return []
  }

  /**
   * Get basic contract information
   */
  const getBasicContractInfo = async (contractAddress: `0x${string}`) => {
    // This would fetch basic contract details
    return {
      propertyName: 'Mock Property',
      stage: 1,
      stageName: 'FUNDING',
      createdAt: new Date()
    }
  }

  /**
   * Calculate portfolio health score
   */
  const calculatePortfolioHealth = (metrics: {
    totalFunded: bigint
    totalPrincipalRepaid: bigint
    totalInterestPaid: bigint
    activeContracts: number
    contractCount: number
  }): 'excellent' | 'good' | 'fair' | 'poor' => {
    const repaymentRate = metrics.totalFunded > 0
      ? Number((metrics.totalPrincipalRepaid * 10000n) / metrics.totalFunded) / 100
      : 0

    if (repaymentRate >= 90) return 'excellent'
    if (repaymentRate >= 75) return 'good'
    if (repaymentRate >= 50) return 'fair'
    return 'poor'
  }

  /**
   * Determine event type from event description
   */
  const determineEventType = (event: string): TimelineEvent['type'] => {
    if (event.includes('Created')) return 'creation'
    if (event.includes('Funding')) return 'funding'
    if (event.includes('Withdraw')) return 'withdrawal'
    if (event.includes('Repayment') || event.includes('Deposit')) return 'repayment'
    if (event.includes('Distribute')) return 'distribution'
    return 'stage_change'
  }

  // ========================================
  // COMPOSED STATE AND COMPUTED PROPERTIES
  // ========================================

  const isCalculatingMetrics = computed(() =>
    metricsStatus.value.status === 'calculating' || metricsStatus.value.status === 'fetching'
  )

  const hasActiveAlerts = computed(() => activeAlerts.value.some(alert => !alert.dismissed))

  const portfolioHealthStatus = computed(() => {
    const health = portfolioMetrics.value?.portfolioHealth || 'fair'
    const statusMap = {
      excellent: { color: 'green', icon: '🟢', text: 'Excellent' },
      good: { color: 'blue', icon: '🔵', text: 'Good' },
      fair: { color: 'yellow', icon: '🟡', text: 'Fair' },
      poor: { color: 'red', icon: '🔴', text: 'Poor' }
    }
    return statusMap[health]
  })

  // ========================================
  // RETURN API
  // ========================================

  return {
    // State
    portfolioMetrics: computed(() => portfolioMetrics.value),
    contractAnalytics: computed(() => contractAnalytics.value),
    activeAlerts: computed(() => activeAlerts.value),
    dismissedAlerts: computed(() => dismissedAlerts.value),
    timelineEvents: computed(() => timelineEvents.value),
    metricsStatus: computed(() => metricsStatus.value),
    alertSettings: computed(() => alertSettings.value),
    reportFilters: computed(() => reportFilters.value),

    // Computed
    isCalculatingMetrics,
    hasActiveAlerts,
    portfolioHealthStatus,

    // Methods
    calculatePortfolioMetrics,
    getContractAnalytics,
    getPortfolioAnalytics,
    getContractMetrics,
    getPerformanceMetrics,
    getComplianceMetrics,
    getContractTimeline,

    // Alert management
    addAlert: (alert: OperationalAlert) => activeAlerts.value.push(alert),
    dismissAlert: (alertId: string) => {
      const alert = activeAlerts.value.find(a => a.id === alertId)
      if (alert) {
        alert.dismissed = true
        dismissedAlerts.value.push(alert)
      }
    },
    clearDismissedAlerts: () => dismissedAlerts.value = [],

    // Settings management
    updateAlertSettings: (settings: Partial<AlertSettings>) => {
      alertSettings.value = { ...alertSettings.value, ...settings }
    },
    updateReportFilters: (filters: Partial<ReportFilters>) => {
      reportFilters.value = { ...reportFilters.value, ...filters }
    },

    // Reset functions
    resetMetrics: () => {
      portfolioMetrics.value = null
      contractAnalytics.value = []
      timelineEvents.value = []
      metricsStatus.value = { status: 'idle' }
    }
  }
}
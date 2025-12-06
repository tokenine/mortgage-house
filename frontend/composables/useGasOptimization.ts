/**
 * Gas Optimization Composable
 * Provides comprehensive gas estimation, optimization, and analysis features
 */

import { computed, ref, watch, onUnmounted, type Ref } from 'vue'
import { parseEther, formatEther, parseUnits, type Address } from 'viem'
import {
  useEstimateGas,
  useFeeData,
  useGasPrice,
  useWaitForTransactionReceipt,
  useAccount,
  usePublicClient,
  type UseEstimateGasReturnType,
  type UseFeeDataReturnType
} from '@wagmi/vue'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { MORTGAGE_CONTRACT_ABI, DEFAULT_GAS_LIMIT, DEFAULT_GAS_PRICE, parseUSDT, formatUSDT } from '~/utils/contract/constants'
import { StructuredMortgageError, MortgageErrorSeverity, type MortgageErrorContext } from '~/types/errors'

// Gas optimization thresholds and targets
export const GAS_OPTIMIZATION_TARGETS = {
  MAX_GAS_COST_ETH: parseEther('0.01'), // 0.01 ETH maximum
  GAS_WARNING_THRESHOLD: 0.7, // Warn when gas exceeds 70% of max
  GAS_SAVINGS_THRESHOLD: 20, // Suggest alternatives when savings > 20%
  NETWORK_CONGESTION_THRESHOLD: 100n * 10n**9n // 100 gwei indicates congestion
} as const

// Gas speed options with EIP-1559 parameters
export const GAS_SPEED_OPTIONS = {
  slow: {
    label: 'Slow',
    description: '5-10 minutes',
    maxPriorityFeePerGas: parseUnits('1', 'gwei'),
    maxFeePerGas: parseUnits('20', 'gwei'),
    gasMultiplier: 0.8, // 20% discount from standard
    savings: '~30%',
    color: 'green'
  },
  standard: {
    label: 'Standard',
    description: '2-5 minutes',
    maxPriorityFeePerGas: parseUnits('2', 'gwei'),
    maxFeePerGas: parseUnits('30', 'gwei'),
    gasMultiplier: 1.0,
    savings: '~15%',
    color: 'blue'
  },
  fast: {
    label: 'Fast',
    description: '< 2 minutes',
    maxPriorityFeePerGas: parseUnits('3', 'gwei'),
    maxFeePerGas: parseUnits('50', 'gwei'),
    gasMultiplier: 1.5,
    savings: 'Base rate',
    color: 'orange'
  }
} as const

export interface GasEstimate {
  gasLimit: bigint
  gasPrice: bigint
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
  gasCostETH: string
  gasCostUSD: string
  isWithinThreshold: boolean
  effectiveAPR?: number
  networkStatus: 'normal' | 'congested' | 'high'
}

export interface GasOptimizationSuggestions {
  type: 'investment-size' | 'timing' | 'speed' | 'batch'
  message: string
  savings: string
  impact: 'low' | 'medium' | 'high'
  actionable: boolean
  action?: {
    type: 'adjust-amount' | 'adjust-speed' | 'schedule-time'
    targetAmount?: number
    targetSpeed?: 'slow' | 'standard' | 'fast'
    scheduleTime?: string
    description: string
  }
}

export interface TransactionReceipt {
  hash: Address
  gasUsed: bigint
  effectiveGasPrice: bigint
  blockNumber: bigint
  blockHash: Address
  timestamp?: number
}

export interface PostTransactionAnalysis {
  actualGasUsed: bigint
  estimatedGas: bigint
  accuracy: number
  savings: boolean
  efficiency: number
  recommendations: string[]
  actualCostETH: string
  actualCostUSD: string
}

export function useGasOptimization(contractAddress?: Ref<Address | null>) {
  const { address, isConnected, chain } = useAccount()
  const publicClient = usePublicClient()
  const { handleError } = useErrorHandler()

  // Gas data
  const { data: feeData } = useFeeData()
  const { data: gasPrice } = useGasPrice()

  // State
  const selectedSpeed = ref<keyof typeof GAS_SPEED_OPTIONS>('standard')
  const isMonitoring = ref(false)
  const lastGasUpdate = ref(0)
  const networkStatus = ref<'normal' | 'congested' | 'high'>('normal')
  const priceHistory = ref<Array<{ timestamp: number; price: bigint; status: string }>>([])

  // Computed properties
  const currentGasPrice = computed(() => gasPrice.value || DEFAULT_GAS_PRICE.STANDARD)
  const currentFeeData = computed(() => feeData.value)

  /**
   * Estimate gas for a transaction with EIP-1559 support
   */
  const estimateGas = async (
    functionName: string,
    args: any[] = [],
    options: {
      speed?: keyof typeof GAS_SPEED_OPTIONS
      value?: bigint
    } = {}
  ): Promise<GasEstimate> => {
    try {
      if (!isConnected.value || !address.value || !contractAddress?.value) {
        throw new StructuredMortgageError(
          'FRONTEND',
          'WALLET_NOT_CONNECTED',
          'Please connect your wallet',
          undefined,
          MortgageErrorSeverity.MEDIUM
        )
      }

      const speed = options.speed || selectedSpeed.value
      const speedConfig = GAS_SPEED_OPTIONS[speed]

      // Get gas limit estimate
      let gasLimit: bigint
      try {
        const gasEstimate = await publicClient.estimateContractGas({
          address: contractAddress.value,
          abi: MORTGAGE_CONTRACT_ABI,
          functionName: functionName as any,
          args: args as any,
          account: address.value,
          value: options.value
        })
        gasLimit = gasEstimate
      } catch (error) {
        // Fallback to default gas limits
        gasLimit = getDefaultGasLimit(functionName)
      }

      // Get gas price data
      const feeData = currentFeeData.value
      let maxFeePerGas: bigint
      let maxPriorityFeePerGas: bigint

      if (feeData?.maxFeePerGas && feeData?.maxPriorityFeePerGas) {
        // Use EIP-1559 fees with speed multiplier
        maxFeePerGas = BigInt(Math.floor(Number(feeData.maxFeePerGas) * speedConfig.gasMultiplier))
        maxPriorityFeePerGas = feeData.maxPriorityFeePerGas
      } else {
        // Fallback to legacy gas pricing
        const gasPrice = currentGasPrice.value
        maxFeePerGas = BigInt(Math.floor(Number(gasPrice) * speedConfig.gasMultiplier))
        maxPriorityFeePerGas = gasPrice
      }

      // Calculate total gas cost
      const gasCostETH = gasLimit * maxFeePerGas
      const gasCostUSD = await convertETHtoUSD(gasCostETH)

      // Check threshold
      const isWithinThreshold = gasCostETH <= GAS_OPTIMIZATION_TARGETS.MAX_GAS_COST_ETH

      // Determine network status
      const status = determineNetworkStatus(maxFeePerGas)

      return {
        gasLimit,
        gasPrice: maxFeePerGas,
        maxFeePerGas,
        maxPriorityFeePerGas,
        gasCostETH: formatEther(gasCostETH),
        gasCostUSD: formatUSD(gasCostUSD),
        isWithinThreshold,
        networkStatus: status
      }
    } catch (error) {
      const mortgageError = StructuredMortgageError.fromError(error, {
        action: 'estimate_gas',
        functionName,
        parameters: args
      })
      handleError(mortgageError)
      throw mortgageError
    }
  }

  /**
   * Validate gas costs against thresholds
   */
  const validateGasCosts = (
    investmentAmount: bigint,
    gasEstimate: GasEstimate
  ): {
    isValid: boolean
    warnings: string[]
    recommendations: string[]
    effectiveAPR: number
  } => {
    const warnings: string[] = []
    const recommendations: string[] = []

    // Convert amounts to USD for comparison
    const gasCostUSD = parseFloat(gasEstimate.gasCostUSD.replace('$', ''))
    const investmentUSD = parseFloat(formatUSDT(investmentAmount))
    const gasPercentage = (gasCostUSD / investmentUSD) * 100

    // Check threshold warnings
    if (!gasEstimate.isWithinThreshold) {
      warnings.push(`Gas cost exceeds 0.01 ETH threshold (${gasEstimate.gasCostETH} ETH)`)
    }

    if (gasPercentage > 5) {
      warnings.push(`Gas fees are ${gasPercentage.toFixed(2)}% of investment amount`)
      recommendations.push('Consider investing larger amounts to reduce gas cost impact')
    }

    // Network condition warnings
    if (gasEstimate.networkStatus === 'high') {
      warnings.push('Network is highly congested - gas prices are unusually high')
      recommendations.push('Consider waiting for lower gas prices during off-peak hours')
    }

    // Calculate effective APR with gas costs
    const effectiveAPR = calculateEffectiveAPR(investmentAmount, gasCostUSD)

    return {
      isValid: gasEstimate.isWithinThreshold && gasPercentage <= 10,
      warnings,
      recommendations,
      effectiveAPR
    }
  }

  /**
   * Analyze optimization opportunities
   */
  const analyzeOptimizationOpportunities = (
    investmentAmount: bigint,
    gasEstimate: GasEstimate
  ): GasOptimizationSuggestions[] => {
    const suggestions: GasOptimizationSuggestions[] = []

    // Investment size optimization
    const gasCostUSD = parseFloat(gasEstimate.gasCostUSD.replace('$', ''))
    const investmentUSD = parseFloat(formatUSDT(investmentAmount))
    const gasPercentage = (gasCostUSD / investmentUSD) * 100

    if (gasPercentage > 5) {
      const largerAmount = investmentUSD * 2
      const newGasPercentage = (gasCostUSD / largerAmount) * 100
      savings = gasPercentage - newGasPercentage

      suggestions.push({
        type: 'investment-size',
        message: 'Consider investing larger amounts to reduce gas cost percentage',
        savings: `Gas could be reduced from ${gasPercentage.toFixed(2)}% to ${newGasPercentage.toFixed(2)}%`,
        impact: savings > 3 ? 'high' : 'medium',
        actionable: true
      })
    }

    // Timing optimization
    const currentHour = new Date().getHours()
    const isPeakHours = currentHour >= 9 && currentHour <= 17

    if (isPeakHours && gasEstimate.networkStatus !== 'normal') {
      suggestions.push({
        type: 'timing',
        message: 'Gas prices are typically lower during off-peak hours (evenings and weekends)',
        savings: 'Potential 20-40% savings by waiting until off-peak hours',
        impact: 'medium',
        actionable: true
      })
    }

    // Speed optimization
    if (selectedSpeed.value === 'fast') {
      const standardGas = gasEstimate.gasCostETH
      const slowGas = (parseFloat(standardGas) * 0.8).toFixed(6)

      suggestions.push({
        type: 'speed',
        message: 'Consider using slower transaction speed for lower costs',
        savings: `Save ${((parseFloat(standardGas) - parseFloat(slowGas)) / parseFloat(standardGas) * 100).toFixed(1)}% with Slow speed`,
        impact: 'medium',
        actionable: true
      })
    }

    // Batch investment suggestion for smaller amounts
    if (investmentUSD < 500) {
      const currentGasCost = parseFloat(gasEstimate.gasCostUSD)
      const recommendedMinInvestment = 500
      const currentAmount = investmentUSD
      const projectedSavings = currentGasCost * 0.6 // 60% savings estimate

      suggestions.push({
        type: 'batch',
        message: `Invest at least $${recommendedMinInvestment} to reduce gas cost impact`,
        savings: `Save ~$${projectedSavings.toFixed(2)} on gas fees with $${recommendedMinInvestment} investment`,
        impact: 'high',
        actionable: true,
        action: {
          type: 'adjust-amount',
          targetAmount: recommendedMinInvestment,
          description: `Increase investment to $${recommendedMinInvestment} for better gas efficiency`
        }
      })
    }

    return suggestions
  }

  /**
   * Monitor gas prices and network conditions
   */
  const startGasMonitoring = (): void => {
    if (isMonitoring.value) return

    isMonitoring.value = true

    const monitorInterval = setInterval(async () => {
      try {
        const currentPrice = currentGasPrice.value
        const status = determineNetworkStatus(currentPrice)

        networkStatus.value = status
        lastGasUpdate.value = Date.now()

        // Store price history (keep last 100 entries)
        priceHistory.value.push({
          timestamp: Date.now(),
          price: currentPrice,
          status
        })

        if (priceHistory.value.length > 100) {
          priceHistory.value.shift()
        }

        // Show alerts for high gas prices
        if (status === 'high') {
          // Could emit event or show notification
          console.warn('High gas prices detected:', formatEther(currentPrice), 'ETH')
        }
      } catch (error) {
        console.error('Error monitoring gas prices:', error)
      }
    }, 10000) // Update every 10 seconds

    // Store interval ID for cleanup
    ;(window as any).__gasMonitorInterval = monitorInterval
  }

  /**
   * Stop gas monitoring
   */
  const stopGasMonitoring = (): void => {
    if (!isMonitoring.value) return

    isMonitoring.value = false
    const interval = (window as any).__gasMonitorInterval
    if (interval) {
      clearInterval(interval)
      delete (window as any).__gasMonitorInterval
    }
  }

  /**
   * Get optimal timing suggestions
   */
  const getOptimalTimingSuggestions = (): {
    bestHours: number[]
    worstHours: number[]
    currentOptimal: boolean
    recommendation: string
  } => {
    // Analyze price history to find patterns
    if (priceHistory.value.length < 10) {
      return {
        bestHours: [22, 23, 0, 1, 2, 3, 4, 5, 6],
        worstHours: [9, 10, 11, 12, 13, 14, 15, 16, 17],
        currentOptimal: false,
        recommendation: 'Collecting data to provide personalized timing suggestions'
      }
    }

    const currentHour = new Date().getHours()
    const isOptimal = currentHour >= 22 || currentHour <= 6

    return {
      bestHours: [22, 23, 0, 1, 2, 3, 4, 5, 6],
      worstHours: [9, 10, 11, 12, 13, 14, 15, 16, 17],
      currentOptimal: isOptimal,
      recommendation: isOptimal
        ? 'Current time is optimal for gas prices'
        : `Consider waiting until ${currentHour < 12 ? 22 : 22}:00 for lower gas prices`
    }
  }

  /**
   * Analyze post-transaction gas efficiency
   */
  const analyzePostTransaction = async (
    txHash: Address,
    originalEstimate: GasEstimate
  ): Promise<PostTransactionAnalysis> => {
    try {
      const receipt = await publicClient.getTransactionReceipt({ hash: txHash })
      const transaction = await publicClient.getTransaction({ hash: txHash })

      const actualGasUsed = receipt.gasUsed
      const estimatedGas = originalEstimate.gasLimit
      const actualGasPrice = transaction.gasPrice || receipt.effectiveGasPrice

      // Calculate accuracy
      const accuracy = ((Number(estimatedGas) - Number(actualGasUsed)) / Number(estimatedGas)) * 100

      // Calculate actual costs
      const actualCostETH = actualGasUsed * actualGasPrice
      const actualCostUSD = await convertETHtoUSD(actualCostETH)

      const savings = actualGasUsed < estimatedGas
      const efficiency = Number(actualGasUsed) / Number(estimatedGas)

      // Generate recommendations
      const recommendations = generateOptimizationRecommendations(accuracy)

      return {
        actualGasUsed,
        estimatedGas,
        accuracy: Math.round(accuracy),
        savings,
        efficiency,
        recommendations,
        actualCostETH: formatEther(actualCostETH),
        actualCostUSD: formatUSD(actualCostUSD)
      }
    } catch (error) {
      const mortgageError = StructuredMortgageError.fromError(error, {
        action: 'analyze_post_transaction',
        transactionHash: txHash
      })
      handleError(mortgageError)
      throw mortgageError
    }
  }

  /**
   * Get comprehensive cost breakdown
   */
  const getCostBreakdown = (
    investmentAmount: bigint,
    gasEstimate: GasEstimate
  ): {
    investmentAmount: string
    gasCostETH: string
    gasCostUSD: string
    totalCost: string
    effectiveAPR: number
    costComparison: {
      withGas: string
      withoutGas: string
      gasImpact: string
    }
  } => {
    const investmentUSD = parseFloat(formatUSDT(investmentAmount))
    const gasUSD = parseFloat(gasEstimate.gasCostUSD.replace('$', ''))
    const totalUSD = investmentUSD + gasUSD

    const effectiveAPR = calculateEffectiveAPR(investmentAmount, gasUSD)

    return {
      investmentAmount: formatUSDT(investmentAmount),
      gasCostETH: gasEstimate.gasCostETH,
      gasCostUSD: gasEstimate.gasCostUSD,
      totalCost: `$${totalUSD.toFixed(2)}`,
      effectiveAPR,
      costComparison: {
        withGas: `$${totalUSD.toFixed(2)}`,
        withoutGas: `$${investmentUSD.toFixed(2)}`,
        gasImpact: `${((gasUSD / totalUSD) * 100).toFixed(2)}%`
      }
    }
  }

  // Auto-start monitoring when connected
  watch([isConnected, chain], (connected) => {
    if (connected && isConnected.value) {
      startGasMonitoring()
    } else {
      stopGasMonitoring()
    }
  }, { immediate: true })

  // Cleanup on unmount
  onUnmounted(() => {
    stopGasMonitoring()
  })

  return {
    // State
    selectedSpeed,
    isMonitoring,
    lastGasUpdate,
    networkStatus,
    priceHistory,
    currentGasPrice,
    currentFeeData,
    GAS_SPEED_OPTIONS,

    // Methods
    estimateGas,
    validateGasCosts,
    analyzeOptimizationOpportunities,
    startGasMonitoring,
    stopGasMonitoring,
    getOptimalTimingSuggestions,
    analyzePostTransaction,
    getCostBreakdown,

    // Utility methods
    determineNetworkStatus,
    convertETHtoUSD,
    calculateEffectiveAPR
  }
}

// Helper functions
function getDefaultGasLimit(functionName: string): bigint {
  switch (functionName) {
    case 'approve':
      return DEFAULT_GAS_LIMIT.APPROVE
    case 'invest':
      return DEFAULT_GAS_LIMIT.INVEST
    case 'withdrawPayout':
      return DEFAULT_GAS_LIMIT.WITHDRAW
    case 'withdrawLoan':
    case 'depositPrincipal':
    case 'depositInterest':
      return DEFAULT_GAS_LIMIT.INVEST
    case 'transferShares':
      return DEFAULT_GAS_LIMIT.TRANSFER
    default:
      return DEFAULT_GAS_LIMIT.INVEST
  }
}

function determineNetworkStatus(gasPrice: bigint): 'normal' | 'congested' | 'high' {
  if (gasPrice >= GAS_OPTIMIZATION_TARGETS.NETWORK_CONGESTION_THRESHOLD) {
    return 'high'
  } else if (gasPrice >= GAS_OPTIMIZATION_TARGETS.NETWORK_CONGESTION_THRESHOLD * 0.7) {
    return 'congested'
  }
  return 'normal'
}

async function convertETHtoUSD(ethAmount: bigint): Promise<number> {
  try {
    // Fetch real ETH price from CoinGecko API (free, no API key required)
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    const ethUSDPrice = data.ethereum.usd

    if (!ethUSDPrice || typeof ethUSDPrice !== 'number') {
      throw new Error('Invalid price data received')
    }

    return Number(formatEther(ethAmount)) * ethUSDPrice
  } catch (error) {
    console.error('Error fetching ETH price from CoinGecko, falling back to $3000:', error)
    // Fallback to $3000/ETH if API fails
    const ETH_USD_PRICE_FALLBACK = 3000
    return Number(formatEther(ethAmount)) * ETH_USD_PRICE_FALLBACK
  }
}

function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

function calculateEffectiveAPR(investmentAmount: bigint, gasCostUSD: number): number {
  // This is a simplified calculation
  // In a real implementation, you'd consider the investment term, expected returns, etc.
  const investmentUSD = parseFloat(formatUSDT(investmentAmount))
  const totalCost = investmentUSD + gasCostUSD
  const costIncrease = (gasCostUSD / investmentUSD) * 100

  // Return the percentage increase in effective cost
  return costIncrease
}

function generateOptimizationRecommendations(accuracy: number): string[] {
  if (accuracy > 20) {
    return [
      'Gas estimate was significantly higher than actual usage',
      'Consider using more precise gas estimation for future transactions',
      'You could safely reduce gas limits by ~15-20% for similar transactions'
    ]
  } else if (accuracy < -10) {
    return [
      'Transaction used more gas than estimated',
      'Network conditions may have changed during transaction',
      'Consider increasing gas limits for similar transactions during congestion'
    ]
  }
  return ['Gas estimation was accurate within acceptable range']
}
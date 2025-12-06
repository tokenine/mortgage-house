import { describe, it, expect, vi, beforeEach } from 'vitest'
import { computed, ref } from 'vue'
import { useGasOptimization } from '~/composables/useGasOptimization'
import { parseEther, formatUnits } from 'viem'
import { DEFAULT_GAS_LIMIT, DEFAULT_GAS_PRICE } from '~/utils/contract/constants'

// Mock wagmi hooks
vi.mock('@wagmi/vue', () => ({
  useEstimateGas: () => ({
    data: ref(null),
    error: ref(null),
    isPending: ref(false)
  }),
  useFeeData: () => ({
    data: ref({
      maxFeePerGas: parseUnits('30', 'gwei'),
      maxPriorityFeePerGas: parseUnits('2', 'gwei'),
      gasPrice: parseUnits('30', 'gwei')
    }),
    error: ref(null),
    isPending: ref(false)
  }),
  useGasPrice: () => ({
    data: ref(parseUnits('30', 'gwei')),
    error: ref(null),
    isPending: ref(false)
  }),
  useWaitForTransactionReceipt: () => ({
    data: ref(null),
    error: ref(null),
    isPending: ref(false)
  }),
  useAccount: () => ({
    address: ref('0x1234567890123456789012345678901234567890'),
    isConnected: ref(true),
    chain: ref({ id: 1, name: 'Ethereum' })
  }),
  usePublicClient: () => ({
    estimateContractGas: vi.fn(),
    getTransactionReceipt: vi.fn(),
    getTransaction: vi.fn()
  })
}))

// Mock error handler
vi.mock('~/composables/useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleError: vi.fn()
  })
}))

describe('useGasOptimization', () => {
  let mockContractAddress: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockContractAddress = computed(() => '0x9876543210987654321098765432109876543210')
  })

  describe('Gas Estimation', () => {
    it('should estimate gas for investment transaction', async () => {
      const { estimateGas } = useGasOptimization(mockContractAddress)

      // Mock the public client estimate
      const mockPublicClient = {
        estimateContractGas: vi.fn().mockResolvedValue(200000n)
      }

      const result = await estimateGas('invest', [parseEther('100')])

      expect(result).toBeDefined()
      expect(result.gasLimit).toBe(200000n)
      expect(result.gasCostETH).toBeDefined()
      expect(result.gasCostUSD).toBeDefined()
      expect(result.isWithinThreshold).toBeDefined()
      expect(result.networkStatus).toBeDefined()
    })

    it('should fallback to default gas limits on estimation error', async () => {
      const { estimateGas } = useGasOptimization(mockContractAddress)

      // Mock estimation failure
      const mockPublicClient = {
        estimateContractGas: vi.fn().mockRejectedValue(new Error('Estimation failed'))
      }

      const result = await estimateGas('invest', [parseEther('100')])

      expect(result.gasLimit).toBe(DEFAULT_GAS_LIMIT.INVEST)
    })

    it('should use different gas limits for different functions', async () => {
      const { estimateGas } = useGasOptimization(mockContractAddress)

      // Mock estimation failure to test fallbacks
      const mockPublicClient = {
        estimateContractGas: vi.fn().mockRejectedValue(new Error('Estimation failed'))
      }

      const investResult = await estimateGas('invest', [])
      const approveResult = await estimateGas('approve', [])
      const withdrawResult = await estimateGas('withdrawPayout', [])

      expect(investResult.gasLimit).toBe(DEFAULT_GAS_LIMIT.INVEST)
      expect(approveResult.gasLimit).toBe(DEFAULT_GAS_LIMIT.APPROVE)
      expect(withdrawResult.gasLimit).toBe(DEFAULT_GAS_LIMIT.WITHDRAW)
    })
  })

  describe('Gas Speed Options', () => {
    it('should provide speed options with EIP-1559 parameters', async () => {
      const { estimateGas, GAS_SPEED_OPTIONS } = useGasOptimization(mockContractAddress)

      // Test slow speed
      const slowResult = await estimateGas('invest', [], { speed: 'slow' })
      expect(slowResult.maxFeePerGas).toBeDefined()
      expect(slowResult.maxPriorityFeePerGas).toBeDefined()

      // Test standard speed
      const standardResult = await estimateGas('invest', [], { speed: 'standard' })
      expect(standardResult.maxFeePerGas).toBeDefined()
      expect(standardResult.maxPriorityFeePerGas).toBeDefined()

      // Test fast speed
      const fastResult = await estimateGas('invest', [], { speed: 'fast' })
      expect(fastResult.maxFeePerGas).toBeDefined()
      expect(fastResult.maxPriorityFeePerGas).toBeDefined()

      // Verify speed options structure
      expect(GAS_SPEED_OPTIONS.value).toHaveProperty('slow')
      expect(GAS_SPEED_OPTIONS.value).toHaveProperty('standard')
      expect(GAS_SPEED_OPTIONS.value).toHaveProperty('fast')
    })

    it('should apply correct multipliers for different speeds', async () => {
      const { estimateGas } = useGasOptimization(mockContractAddress)

      const mockPublicClient = {
        estimateContractGas: vi.fn().mockResolvedValue(200000n)
      }

      const slowResult = await estimateGas('invest', [], { speed: 'slow' })
      const standardResult = await estimateGas('invest', [], { speed: 'standard' })
      const fastResult = await estimateGas('invest', [], { speed: 'fast' })

      // Fast should be more expensive than standard
      expect(fastResult.gasCostETH).toBeGreaterThan(standardResult.gasCostETH)
      // Slow should be cheaper than standard
      expect(parseFloat(slowResult.gasCostETH)).toBeLessThan(parseFloat(standardResult.gasCostETH))
    })
  })

  describe('Gas Validation', () => {
    it('should validate gas costs against thresholds', () => {
      const { validateGasCosts } = useGasOptimization(mockContractAddress)

      // Test with valid gas cost
      const lowGasCost = {
        gasLimit: 200000n,
        gasPrice: parseUnits('10', 'gwei'),
        gasCostETH: '0.002',
        gasCostUSD: '$6.00',
        isWithinThreshold: true,
        networkStatus: 'normal' as const
      }

      const validation = validateGasCosts(parseEther('1000'), lowGasCost)
      expect(validation.isValid).toBe(true)
      expect(validation.warnings).toHaveLength(0)

      // Test with high gas cost
      const highGasCost = {
        gasLimit: 300000n,
        gasPrice: parseUnits('100', 'gwei'),
        gasCostETH: '0.03',
        gasCostUSD: '$90.00',
        isWithinThreshold: false,
        networkStatus: 'high' as const
      }

      const highValidation = validateGasCosts(parseEther('100'), highGasCost)
      expect(highValidation.isValid).toBe(false)
      expect(highValidation.warnings.length).toBeGreaterThan(0)
      expect(highValidation.recommendations.length).toBeGreaterThan(0)
    })

    it('should calculate effective APR correctly', () => {
      const { validateGasCosts } = useGasOptimization(mockContractAddress)

      const gasCost = {
        gasLimit: 200000n,
        gasPrice: parseUnits('30', 'gwei'),
        gasCostETH: '0.006',
        gasCostUSD: '$18.00',
        isWithinThreshold: true,
        networkStatus: 'normal' as const
      }

      const validation = validateGasCosts(parseEther('1000'), gasCost)
      expect(validation.effectiveAPR).toBeGreaterThan(0)
      expect(typeof validation.effectiveAPR).toBe('number')
    })
  })

  describe('Optimization Analysis', () => {
    it('should provide optimization suggestions', () => {
      const { analyzeOptimizationOpportunities } = useGasOptimization(mockContractAddress)

      // Test with small investment (should suggest larger amounts)
      const smallInvestment = parseEther('50')
      const highGasCost = {
        gasLimit: 200000n,
        gasPrice: parseUnits('50', 'gwei'),
        gasCostETH: '0.01',
        gasCostUSD: '$30.00',
        isWithinThreshold: true,
        networkStatus: 'high' as const
      }

      const suggestions = analyzeOptimizationOpportunities(smallInvestment, highGasCost)
      expect(suggestions.length).toBeGreaterThan(0)

      // Should suggest investment-size optimization
      const investmentSuggestion = suggestions.find(s => s.type === 'investment-size')
      expect(investmentSuggestion).toBeDefined()
      expect(investmentSuggestion?.impact).toBe('high')
    })

    it('should suggest timing optimizations during peak hours', () => {
      const { analyzeOptimizationOpportunities } = useGasOptimization(mockContractAddress)

      // Mock peak hours (9 AM - 5 PM)
      const originalHour = new Date().getHours()
      vi.spyOn(Date.prototype, 'getHours').mockReturnValue(14) // 2 PM

      const investment = parseEther('500')
      const gasEstimate = {
        gasLimit: 200000n,
        gasPrice: parseUnits('40', 'gwei'),
        gasCostETH: '0.008',
        gasCostUSD: '$24.00',
        isWithinThreshold: true,
        networkStatus: 'congested' as const
      }

      const suggestions = analyzeOptimizationOpportunities(investment, gasEstimate)
      const timingSuggestion = suggestions.find(s => s.type === 'timing')
      expect(timingSuggestion).toBeDefined()

      // Restore original hour
      vi.spyOn(Date.prototype, 'getHours').mockRestore()
    })
  })

  describe('Network Monitoring', () => {
    it('should detect network congestion correctly', () => {
      const { determineNetworkStatus } = useGasOptimization(mockContractAddress)

      const normalGasPrice = parseUnits('20', 'gwei')
      const congestedGasPrice = parseUnits('80', 'gwei')
      const highGasPrice = parseUnits('150', 'gwei')

      expect(determineNetworkStatus(normalGasPrice)).toBe('normal')
      expect(determineNetworkStatus(congestedGasPrice)).toBe('congested')
      expect(determineNetworkStatus(highGasPrice)).toBe('high')
    })
  })

  describe('Post-Transaction Analysis', () => {
    it('should analyze gas efficiency after transaction', async () => {
      const { analyzePostTransaction } = useGasOptimization(mockContractAddress)

      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      const originalEstimate = {
        gasLimit: 250000n,
        gasPrice: parseUnits('30', 'gwei'),
        gasCostETH: '0.0075',
        gasCostUSD: '$22.50',
        isWithinThreshold: true,
        networkStatus: 'normal' as const
      }

      // Mock transaction receipt and transaction
      const mockReceipt = {
        gasUsed: 200000n,
        effectiveGasPrice: parseUnits('28', 'gwei'),
        blockNumber: 12345n,
        blockHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      }

      const mockTransaction = {
        gasPrice: parseUnits('28', 'gwei')
      }

      const mockPublicClient = {
        getTransactionReceipt: vi.fn().mockResolvedValue(mockReceipt),
        getTransaction: vi.fn().mockResolvedValue(mockTransaction)
      }

      const analysis = await analyzePostTransaction(txHash, originalEstimate)

      expect(analysis.actualGasUsed).toBe(200000n)
      expect(analysis.estimatedGas).toBe(250000n)
      expect(analysis.savings).toBe(true) // Used less than estimated
      expect(analysis.efficiency).toBe(0.8) // 200k/250k
      expect(analysis.accuracy).toBe(20) // (250k-200k)/250k * 100
      expect(analysis.recommendations).toBeDefined()
    })

    it('should provide recommendations based on accuracy', async () => {
      const { analyzePostTransaction } = useGasOptimization(mockContractAddress)

      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      const overestimatedEstimate = {
        gasLimit: 500000n,
        gasPrice: parseUnits('30', 'gwei'),
        gasCostETH: '0.015',
        gasCostUSD: '$45.00',
        isWithinThreshold: true,
        networkStatus: 'normal' as const
      }

      // Mock receipt with much lower gas usage
      const mockReceipt = {
        gasUsed: 200000n,
        effectiveGasPrice: parseUnits('28', 'gwei'),
        blockNumber: 12345n,
        blockHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      }

      const mockTransaction = {
        gasPrice: parseUnits('28', 'gwei')
      }

      const mockPublicClient = {
        getTransactionReceipt: vi.fn().mockResolvedValue(mockReceipt),
        getTransaction: vi.fn().mockResolvedValue(mockTransaction)
      }

      const analysis = await analyzePostTransaction(txHash, overestimatedEstimate)

      expect(analysis.accuracy).toBeGreaterThan(20)
      expect(analysis.recommendations.some(r =>
        r.includes('significantly higher') || r.includes('reduce gas limits')
      )).toBe(true)
    })
  })

  describe('Cost Breakdown', () => {
    it('should provide comprehensive cost breakdown', () => {
      const { getCostBreakdown } = useGasOptimization(mockContractAddress)

      const investmentAmount = parseEther('1000')
      const gasEstimate = {
        gasLimit: 200000n,
        gasPrice: parseUnits('30', 'gwei'),
        gasCostETH: '0.006',
        gasCostUSD: '$18.00',
        isWithinThreshold: true,
        networkStatus: 'normal' as const
      }

      const breakdown = getCostBreakdown(investmentAmount, gasEstimate)

      expect(breakdown.investmentAmount).toBeDefined()
      expect(breakdown.gasCostETH).toBe(gasEstimate.gasCostETH)
      expect(breakdown.gasCostUSD).toBe(gasEstimate.gasCostUSD)
      expect(breakdown.totalCost).toBeDefined()
      expect(breakdown.effectiveAPR).toBeDefined()
      expect(breakdown.costComparison).toBeDefined()
      expect(breakdown.costComparison.withGas).toBeDefined()
      expect(breakdown.costComparison.withoutGas).toBeDefined()
      expect(breakdown.costComparison.gasImpact).toBeDefined()
    })
  })

  describe('Optimal Timing', () => {
    it('should provide timing suggestions', () => {
      const { getOptimalTimingSuggestions } = useGasOptimization(mockContractAddress)

      const suggestions = getOptimalTimingSuggestions()

      expect(suggestions.bestHours).toBeDefined()
      expect(suggestions.worstHours).toBeDefined()
      expect(suggestions.currentOptimal).toBeDefined()
      expect(suggestions.recommendation).toBeDefined()

      // Should suggest off-peak hours
      expect(suggestions.bestHours).toContain(22)
      expect(suggestions.bestHours).toContain(23)
      expect(suggestions.worstHours).toContain(9)
      expect(suggestions.worstHours).toContain(14)
    })
  })
})
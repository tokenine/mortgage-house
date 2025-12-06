/**
 * Mortgage Contract Composable
 * Entity-based composable for interacting with mortgage smart contracts
 */

import { computed, ref, watch, type Ref } from 'vue'
import { parseEther, formatEther, zeroAddress } from 'viem'
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
  useBalance,
  useWatchContractEvent,
  type UseReadContractReturnType,
  type UseWriteContractReturnType
} from '@wagmi/vue'
import { StructuredMortgageError, MortgageError, MortgageErrorHandler, MortgageErrorSeverity, type MortgageErrorContext } from '~/types/errors'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { useGasOptimization } from '~/composables/useGasOptimization'
import { useRealtimeSync } from '~/composables/useRealtimeSync'
import { useRealtimeStore } from '~/stores/realtime'
import {
  MORTGAGE_CONTRACT_ABI,
  ERC20_ABI,
  MORTGAGE_CONFIG,
  getMortgageContractAddress,
  getUSDTTokenAddress,
  isSupportedChain,
  formatUSDT,
  parseUSDT,
  validateInvestmentAmount,
  calculateShares,
  calculateEntitlements,
  getStageName,
  canInvest,
  canWithdraw,
  DEFAULT_GAS_LIMIT,
  DEFAULT_GAS_PRICE
} from '~/utils/contract/constants'

interface InvestmentDetails {
  amount: bigint
  shares: bigint
  timestamp: number
}

interface MortgageDetails {
  propertyValue: bigint
  loanAmount: bigint
  interestRate: bigint
  loanTerm: bigint
  fundingTarget: bigint
  fundingDeadline: bigint
}

// Epic 5.1 Deployment Interface Types
interface MortgageDeploymentParams {
  borrower: string
  loanAmount: string
  usdtToken: string
  interestRate: string
  loanTerm: string
  propertyDescription: string
}

interface DeployedContract {
  address: string
  borrower: string
  loanAmount: string
  usdtToken: string
  interestRate: string
  loanTerm: string
  propertyDescription: string
  deployedAt: number
  txHash: string
}

interface DeploymentStatus {
  status: 'idle' | 'validating' | 'estimating' | 'deploying' | 'success' | 'error'
  message?: string
  error?: string
  txHash?: string
  contractAddress?: string
}

interface DeploymentValidationError {
  field: keyof MortgageDeploymentParams
  message: string
  severity: 'error' | 'warning'
}

interface DeploymentGasEstimate {
  gasLimit: bigint
  gasPrice: bigint
  ethCost: string
  usdCost: string
  networkStatus: 'normal' | 'congested' | 'high'
  isWithinThreshold: boolean
}

// Epic 5.2 Loan Operations Types
interface LoanOperationParams {
  amount: string
  contractAddress: string
  borrower?: string
  notes?: string
}

interface LoanOperationStatus {
  status: 'idle' | 'validating' | 'estimating' | 'processing' | 'success' | 'error'
  message?: string
  error?: string
  txHash?: string
  operation?: 'withdrawal' | 'principal' | 'interest'
}

interface RepaymentSchedule {
  paymentDate: number
  principalAmount: string
  interestAmount: string
  totalAmount: string
  status: 'pending' | 'paid' | 'overdue'
}

interface LoanOperationResult {
  txHash: string
  amount: string
  timestamp: number
  perShareDistribution?: string
  affectedInvestors: number
  totalDistributed: string
}

// Epic 5.3 Stage Management Types
interface StageTransition {
  from: number
  to: number
  changedBy: string
  reason: string
  timestamp: number
  blockNumber: number
}

interface StageHistory {
  stage: number
  enteredAt: number
  duration: number // seconds spent in this stage
  reason: string
  changedBy: string
}

interface StageManagementStatus {
  status: 'idle' | 'validating' | 'estimating' | 'processing' | 'success' | 'error'
  message?: string
  error?: string
  txHash?: string
  operation?: 'set_stage' | 'start_funding' | 'transition'
}

interface AvailableTransition {
  stage: number
  stageName: string
  reason: string
  isAllowed: boolean
}

interface StageManagementParams {
  contractAddress: string
  newStage: number
  reason: string
  confirmation?: boolean
}

interface UseMortgageContractOptions {
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useMortgageContract(options: UseMortgageContractOptions = {}) {
  const { autoRefresh = true, refreshInterval = 10000 } = options

  // Wagmi hooks
  const { address, isConnected, chain, chainId } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  const { writeContractAsync, isPending: isWritePending, error: writeError } = useWriteContract()

  // Error handling
  const { handleError } = useErrorHandler()

  // Event cleanup function
  let eventCleanup: (() => void) | undefined

  // Gas optimization
  const contractAddressRef = computed(() => contractAddress.value)
  const {
    selectedSpeed,
    isMonitoring,
    networkStatus,
    estimateGas: estimateGasCost,
    validateGasCosts,
    analyzeOptimizationOpportunities,
    getOptimalTimingSuggestions,
    analyzePostTransaction,
    getCostBreakdown,
    GAS_SPEED_OPTIONS
  } = useGasOptimization(contractAddressRef)

  // State
  const isRefreshing = ref(false)
  const lastRefreshTime = ref(0)
  const selectedContractAddress = ref<`0x${string}` | null>(null)
  const refreshIntervalId = ref<NodeJS.Timeout | null>(null)

  // Epic 5.1 Deployment State
  const deploymentStatus = ref<DeploymentStatus>({ status: 'idle' })
  const deploymentForm = ref<MortgageDeploymentParams>({
    borrower: '',
    loanAmount: '',
    usdtToken: '',
    interestRate: '',
    loanTerm: '',
    propertyDescription: ''
  })
  const deployedContracts = ref<DeployedContract[]>([])
  const deploymentValidationErrors = ref<DeploymentValidationError[]>([])
  const deploymentGasEstimate = ref<DeploymentGasEstimate | null>(null)

  // Epic 5.2 Loan Operations State
  const loanOperationStatus = ref<LoanOperationStatus>({ status: 'idle' })
  const repaymentSchedule = ref<RepaymentSchedule[]>([])
  const recentLoanOperations = ref<LoanOperationResult[]>([])
  const loanOperationForm = ref<LoanOperationParams>({
    amount: '',
    contractAddress: '',
    borrower: '',
    notes: ''
  })

  // Epic 5.3 Stage Management State
  const stageManagementStatus = ref<StageManagementStatus>({ status: 'idle' })
  const stageHistory = ref<StageHistory[]>([])
  const availableTransitions = ref<AvailableTransition[]>([])
  const stageTransitions = ref<StageTransition[]>([])
  const stageManagementForm = ref<StageManagementParams>({
    contractAddress: '',
    newStage: 0,
    reason: '',
    confirmation: false
  })

  // Contract addresses
  const contractAddress = computed(() => {
    if (selectedContractAddress.value) return selectedContractAddress.value
    if (!chainId.value) return null
    return getMortgageContractAddress(chainId.value)
  })

  const usdtAddress = computed(() => {
    if (!chainId.value) return null
    return getUSDTTokenAddress(chainId.value)
  })

  // USDT balance
  const { data: usdtBalance, error: balanceError, refetch: refetchBalance } = useBalance({
    address: address.value,
    token: usdtAddress.value,
    query: {
      enabled: computed(() => !!address.value && !!usdtAddress.value)
    }
  })

  // Contract read calls - individual calls for now
  const { data: fundingStage, refetch: refetchFundingStage } = useReadContract({
    address: contractAddress.value!,
    abi: MORTGAGE_CONTRACT_ABI,
    functionName: 'stage',
    query: { enabled: computed(() => !!contractAddress.value) }
  })

  const { data: totalInvested, refetch: refetchTotalInvested } = useReadContract({
    address: contractAddress.value!,
    abi: MORTGAGE_CONTRACT_ABI,
    functionName: 'totalFunded',
    query: { enabled: computed(() => !!contractAddress.value) }
  })

  const { data: totalShares, refetch: refetchTotalShares } = useReadContract({
    address: contractAddress.value!,
    abi: MORTGAGE_CONTRACT_ABI,
    functionName: 'totalShares',
    query: { enabled: computed(() => !!contractAddress.value) }
  })

  const { data: investorCount, refetch: refetchInvestorCount } = useReadContract({
    address: contractAddress.value!,
    abi: MORTGAGE_CONTRACT_ABI,
    functionName: 'investorCount',
    query: { enabled: computed(() => !!contractAddress.value) }
  })

  const { data: repaidPrincipal, refetch: refetchRepaidPrincipal } = useReadContract({
    address: contractAddress.value!,
    abi: MORTGAGE_CONTRACT_ABI,
    functionName: 'repaidPrincipal',
    query: { enabled: computed(() => !!contractAddress.value) }
  })

  const { data: repaidInterest, refetch: refetchRepaidInterest } = useReadContract({
    address: contractAddress.value!,
    abi: MORTGAGE_CONTRACT_ABI,
    functionName: 'repaidInterest',
    query: { enabled: computed(() => !!contractAddress.value) }
  })

  // Distribution tracking for Epic 4.1
  const { data: principalRepaid, refetch: refetchPrincipalRepaid } = useReadContract({
    address: contractAddress.value!,
    abi: MORTGAGE_CONTRACT_ABI,
    functionName: 'principalRepaid',
    query: { enabled: computed(() => !!contractAddress.value) }
  })

  const { data: interestPaid, refetch: refetchInterestPaid } = useReadContract({
    address: contractAddress.value!,
    abi: MORTGAGE_CONTRACT_ABI,
    functionName: 'interestPaid',
    query: { enabled: computed(() => !!contractAddress.value) }
  })

  // Investor position data - individual calls
  const { data: investorShares, refetch: refetchInvestorShares } = useReadContract({
    address: contractAddress.value!,
    abi: MORTGAGE_CONTRACT_ABI,
    functionName: 'shares',
    args: address.value ? [address.value] : [zeroAddress],
    query: { enabled: computed(() => !!contractAddress.value && !!address.value) }
  })

  const { data: entitledPrincipal, refetch: refetchEntitledPrincipal } = useReadContract({
    address: contractAddress.value!,
    abi: MORTGAGE_CONTRACT_ABI,
    functionName: 'getEntitledPrincipal',
    args: address.value ? [address.value] : [zeroAddress],
    query: { enabled: computed(() => !!contractAddress.value && !!address.value) }
  })

  const { data: entitledInterest, refetch: refetchEntitledInterest } = useReadContract({
    address: contractAddress.value!,
    abi: MORTGAGE_CONTRACT_ABI,
    functionName: 'getEntitledInterest',
    args: address.value ? [address.value] : [zeroAddress],
    query: { enabled: computed(() => !!contractAddress.value && !!address.value) }
  })

  const { data: withdrawablePrincipal, refetch: refetchWithdrawablePrincipal } = useReadContract({
    address: contractAddress.value!,
    abi: MORTGAGE_CONTRACT_ABI,
    functionName: 'getWithdrawablePrincipal',
    args: address.value ? [address.value] : [zeroAddress],
    query: { enabled: computed(() => !!contractAddress.value && !!address.value) }
  })

  const { data: withdrawableInterest, refetch: refetchWithdrawableInterest } = useReadContract({
    address: contractAddress.value!,
    abi: MORTGAGE_CONTRACT_ABI,
    functionName: 'getWithdrawableInterest',
    args: address.value ? [address.value] : [zeroAddress],
    query: { enabled: computed(() => !!contractAddress.value && !!address.value) }
  })

  // USDT allowance
  const { data: usdtAllowance, refetch: refetchAllowance } = useReadContract({
    address: usdtAddress.value!,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address.value ? [address.value, contractAddress.value!] : [zeroAddress, zeroAddress],
    query: {
      enabled: computed(() => !!address.value && !!usdtAddress.value && !!contractAddress.value)
    }
  })

  // Epic 5.2 Loan Operations Read Calls
  const { data: loanWithdrawn, refetch: refetchLoanWithdrawn } = useReadContract({
    address: contractAddress.value!,
    abi: MORTGAGE_CONTRACT_ABI,
    functionName: 'loanWithdrawn',
    query: { enabled: computed(() => !!contractAddress.value) }
  })

  const { data: totalRepaid, refetch: refetchTotalRepaid } = useReadContract({
    address: contractAddress.value!,
    abi: MORTGAGE_CONTRACT_ABI,
    functionName: 'totalRepaid',
    query: { enabled: computed(() => !!contractAddress.value) }
  })

  const { data: borrower, refetch: refetchBorrower } = useReadContract({
    address: contractAddress.value!,
    abi: MORTGAGE_CONTRACT_ABI,
    functionName: 'borrower',
    query: { enabled: computed(() => !!contractAddress.value) }
  })

  const { data: isLoanFullyRepaid, refetch: refetchIsLoanFullyRepaid } = useReadContract({
    address: contractAddress.value!,
    abi: MORTGAGE_CONTRACT_ABI,
    functionName: 'isLoanFullyRepaid',
    query: { enabled: computed(() => !!contractAddress.value) }
  })

  const { data: remainingPrincipal, refetch: refetchRemainingPrincipal } = useReadContract({
    address: contractAddress.value!,
    abi: MORTGAGE_CONTRACT_ABI,
    functionName: 'getRemainingPrincipal',
    query: { enabled: computed(() => !!contractAddress.value) }
  })

  const { data: availableForWithdrawal, refetch: refetchAvailableForWithdrawal } = useReadContract({
    address: contractAddress.value!,
    abi: MORTGAGE_CONTRACT_ABI,
    functionName: 'getAvailableForWithdrawal',
    query: { enabled: computed(() => !!contractAddress.value) }
  })

  // Epic 5.3 Stage Management Read Calls
  const { data: lastStageChangedBy, refetch: refetchLastStageChangedBy } = useReadContract({
    address: contractAddress.value!,
    abi: MORTGAGE_CONTRACT_ABI,
    functionName: 'lastStageChangedBy',
    query: { enabled: computed(() => !!contractAddress.value) }
  })

  const { data: lastStageChangeTime, refetch: refetchLastStageChangeTime } = useReadContract({
    address: contractAddress.value!,
    abi: MORTGAGE_CONTRACT_ABI,
    functionName: 'lastStageChangeTime',
    query: { enabled: computed(() => !!contractAddress.value) }
  })

  const { data: stageTimestamps, refetch: refetchStageTimestamps } = useReadContract({
    address: contractAddress.value!,
    abi: MORTGAGE_CONTRACT_ABI,
    functionName: 'stageTimestamps',
    args: [0], // We'll need to call this for each stage
    query: { enabled: computed(() => !!contractAddress.value) }
  })

  const { data: stageReasons, refetch: refetchStageReasons } = useReadContract({
    address: contractAddress.value!,
    abi: MORTGAGE_CONTRACT_ABI,
    functionName: 'stageReasons',
    args: [0], // We'll need to call this for each stage
    query: { enabled: computed(() => !!contractAddress.value) }
  })

  const { data: availableStageTransitions, refetch: refetchAvailableStageTransitions } = useReadContract({
    address: contractAddress.value!,
    abi: MORTGAGE_CONTRACT_ABI,
    functionName: 'getAvailableTransitions',
    query: { enabled: computed(() => !!contractAddress.value) }
  })

  // Computed properties
  const isValidChain = computed(() => isSupportedChain(chainId.value || 1))

  // Extract data from individual calls
  const fundingStageValue = computed(() => fundingStage.value as number || 0)
  const totalInvestedValue = computed(() => totalInvested.value as bigint || 0n)
  const totalSharesValue = computed(() => totalShares.value as bigint || 0n)
  const investorCountValue = computed(() => investorCount.value as number || 0)
  const repaidPrincipalValue = computed(() => repaidPrincipal.value as bigint || 0n)
  const repaidInterestValue = computed(() => repaidInterest.value as bigint || 0n)

  // Distribution tracking values for Epic 4.1
  const principalRepaidValue = computed(() => principalRepaid.value as bigint || 0n)
  const interestPaidValue = computed(() => interestPaid.value as bigint || 0n)

  const investorSharesValue = computed(() => investorShares.value as bigint || 0n)
  const entitledPrincipalValue = computed(() => entitledPrincipal.value as bigint || 0n)
  const entitledInterestValue = computed(() => entitledInterest.value as bigint || 0n)
  const withdrawablePrincipalValue = computed(() => withdrawablePrincipal.value as bigint || 0n)
  const withdrawableInterestValue = computed(() => withdrawableInterest.value as bigint || 0n)

  // Epic 5.2 Loan Operations values
  const loanWithdrawnValue = computed(() => loanWithdrawn.value as bigint || 0n)
  const totalRepaidValue = computed(() => totalRepaid.value as bigint || 0n)
  const borrowerValue = computed(() => borrower.value as string || '')
  const isLoanFullyRepaidValue = computed(() => isLoanFullyRepaid.value as boolean || false)
  const remainingPrincipalValue = computed(() => remainingPrincipal.value as bigint || 0n)
  const availableForWithdrawalValue = computed(() => availableForWithdrawal.value as bigint || 0n)

  // Epic 5.3 Stage Management values
  const lastStageChangedByValue = computed(() => lastStageChangedBy.value as string || '')
  const lastStageChangeTimeValue = computed(() => lastStageChangeTime.value as bigint || 0n)
  const stageTimestampsValue = computed(() => stageTimestamps.value as bigint || 0n)
  const stageReasonsValue = computed(() => stageReasons.value as string || '')
  const availableStageTransitionsValue = computed(() => availableStageTransitions.value as number[] || [])

  // Formatted values
  const formattedTotalInvested = computed(() => formatUSDT(totalInvestedValue.value))
  const formattedUsdtBalance = computed(() => formatUSDT(usdtBalance.value?.value || 0n))
  const formattedUsdtAllowance = computed(() => formatUSDT(usdtAllowance.value || 0n))

  const fundingProgress = computed(() => {
    if (!totalInvestedValue.value || totalInvestedValue.value === 0n) return 0
    // Use hardcoded target for now, should get from contract
    const target = parseUSDT('100000') // 100k USDT target
    return Number((totalInvestedValue.value * 10000n) / target) / 100
  })

  const userSharePercentage = computed(() => {
    if (!investorSharesValue.value || !totalSharesValue.value || totalSharesValue.value === 0n) return 0
    return Number((investorSharesValue.value * 10000n) / totalSharesValue.value) / 100
  })

  // Combined error state
  const combinedError = computed(() => {
    if (writeError.value) return writeError.value
    if (balanceError.value) return balanceError.value
    return null
  })

  // Utility methods
  const ensureValidChain = async (): Promise<void> => {
    if (!isValidChain.value) {
      const error = new StructuredMortgageError(
        'NETWORK',
        'WRONG_NETWORK',
        'Please switch to a supported network',
        undefined,
        MortgageErrorSeverity.MEDIUM,
        { currentChain: chainId.value }
      )
      throw error
    }
  }

  const ensureConnected = async (): Promise<void> => {
    if (!isConnected.value || !address.value) {
      const error = new StructuredMortgageError(
        'FRONTEND',
        'WALLET_NOT_CONNECTED',
        'Please connect your wallet',
        undefined,
        MortgageErrorSeverity.MEDIUM
      )
      throw error
    }
  }

  const switchToSupportedChain = async (): Promise<void> => {
    try {
      if (!isValidChain.value && chainId.value) {
        await switchChainAsync({ chainId: 1 }) // Switch to Ethereum Mainnet
      }
    } catch (error) {
      throw MortgageError.fromError(error, { action: 'switch_chain' })
    }
  }

  // Contract functions
  const approveUSDT = async (amount: bigint): Promise<`0x${string}`> => {
    try {
      await ensureConnected()
      await ensureValidChain()

      const context: MortgageErrorContext = {
        contractAddress: usdtAddress.value!,
        functionName: 'approve',
        amount: amount.toString(),
        userAddress: address.value!,
        chainId: chainId.value
      }

      const txHash = await writeContractAsync({
        address: usdtAddress.value!,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [contractAddress.value!, amount]
      })

      // Refetch allowance after approval
      await refetchAllowance()

      return txHash
    } catch (error) {
      const mortgageError = MortgageError.fromError(error, {
        action: 'approve_usdt',
        contractAddress: usdtAddress.value!,
        functionName: 'approve',
        amount: amount.toString()
      })
      handleError(mortgageError)
      throw mortgageError
    }
  }

  const invest = async (amount: bigint): Promise<`0x${string}`> => {
    try {
      await ensureConnected()
      await ensureValidChain()

      // Validate investment amount
      const validation = validateInvestmentAmount(amount)
      if (!validation.valid) {
        throw new StructuredMortgageError(
          'FRONTEND',
          'VALIDATION_ERROR',
          validation.error!,
          undefined,
          MortgageErrorSeverity.MEDIUM,
          { amount: amount.toString() }
        )
      }

      // Check USDT balance
      if (usdtBalance.value?.value && usdtBalance.value.value < amount) {
        throw new StructuredMortgageError(
          'CONTRACT',
          'INSUFFICIENT_FUNDS',
          'Insufficient USDT balance',
          undefined,
          MortgageErrorSeverity.HIGH,
          {
            balance: usdtBalance.value.value.toString(),
            required: amount.toString()
          }
        )
      }

      // Check USDT allowance
      if (usdtAllowance.value && usdtAllowance.value < amount) {
        // Auto-approve if allowance is insufficient
        await approveUSDT(amount)
      }

      const context: MortgageErrorContext = {
        contractAddress: contractAddress.value!,
        functionName: 'invest',
        amount: amount.toString(),
        userAddress: address.value!,
        chainId: chainId.value
      }

      const txHash = await writeContractAsync({
        address: contractAddress.value!,
        abi: MORTGAGE_CONTRACT_ABI,
        functionName: 'invest',
        args: [amount]
      })

      // Refresh data after investment
      await refreshData()

      return txHash
    } catch (error) {
      const mortgageError = MortgageError.fromError(error, {
        action: 'invest',
        contractAddress: contractAddress.value!,
        functionName: 'invest',
        amount: amount.toString()
      })
      handleError(mortgageError)
      throw mortgageError
    }
  }

  const withdrawPayout = async (options: { principal?: boolean; interest?: boolean } = {}): Promise<`0x${string}`> => {
    try {
      await ensureConnected()
      await ensureValidChain()

      // Check if user has anything to withdraw
      if (withdrawablePrincipalValue.value === 0n && withdrawableInterestValue.value === 0n) {
        throw new StructuredMortgageError(
          'CONTRACT',
          'INSUFFICIENT_SHARES',
          'No funds available for withdrawal',
          undefined,
          MortgageErrorSeverity.MEDIUM,
          { action: 'withdraw_payout' }
        )
      }

      const txHash = await writeContractAsync({
        address: contractAddress.value!,
        abi: MORTGAGE_CONTRACT_ABI,
        functionName: 'withdrawPayout',
        args: [options.principal || false, options.interest || false]
      })

      // Refresh data after withdrawal
      await refreshData()

      return txHash
    } catch (error) {
      const mortgageError = MortgageError.fromError(error, {
        action: 'withdraw_payout',
        contractAddress: contractAddress.value!,
        functionName: 'withdrawPayout',
        parameters: options
      })
      handleError(mortgageError)
      throw mortgageError
    }
  }

  // Enhanced withdrawal functions for Epic 4.1
  const withdrawPrincipal = async (amount: bigint): Promise<`0x${string}`> => {
    try {
      await ensureConnected()
      await ensureValidChain()

      // Validate withdrawal amount
      if (amount <= 0n) {
        throw new StructuredMortgageError(
          'FRONTEND',
          'VALIDATION_ERROR',
          'Withdrawal amount must be greater than zero',
          undefined,
          MortgageErrorSeverity.MEDIUM,
          { amount: amount.toString() }
        )
      }

      // Check if user has enough withdrawable principal
      if (withdrawablePrincipalValue.value < amount) {
        throw new StructuredMortgageError(
          'CONTRACT',
          'INSUFFICIENT_FUNDS',
          'Insufficient withdrawable principal amount',
          undefined,
          MortgageErrorSeverity.HIGH,
          {
            requested: amount.toString(),
            available: withdrawablePrincipalValue.value.toString()
          }
        )
      }

      const txHash = await writeContractAsync({
        address: contractAddress.value!,
        abi: MORTGAGE_CONTRACT_ABI,
        functionName: 'withdrawPrincipal',
        args: [amount]
      })

      // Refresh data after withdrawal
      await refreshData()

      return txHash
    } catch (error) {
      const mortgageError = MortgageError.fromError(error, {
        action: 'withdraw_principal',
        contractAddress: contractAddress.value!,
        functionName: 'withdrawPrincipal',
        amount: amount.toString()
      })
      handleError(mortgageError)
      throw mortgageError
    }
  }

  const withdrawInterest = async (amount: bigint): Promise<`0x${string}`> => {
    try {
      await ensureConnected()
      await ensureValidChain()

      // Validate withdrawal amount
      if (amount <= 0n) {
        throw new StructuredMortgageError(
          'FRONTEND',
          'VALIDATION_ERROR',
          'Withdrawal amount must be greater than zero',
          undefined,
          MortgageErrorSeverity.MEDIUM,
          { amount: amount.toString() }
        )
      }

      // Check if user has enough withdrawable interest
      if (withdrawableInterestValue.value < amount) {
        throw new StructuredMortgageError(
          'CONTRACT',
          'INSUFFICIENT_FUNDS',
          'Insufficient withdrawable interest amount',
          undefined,
          MortgageErrorSeverity.HIGH,
          {
            requested: amount.toString(),
            available: withdrawableInterestValue.value.toString()
          }
        )
      }

      const txHash = await writeContractAsync({
        address: contractAddress.value!,
        abi: MORTGAGE_CONTRACT_ABI,
        functionName: 'withdrawInterest',
        args: [amount]
      })

      // Refresh data after withdrawal
      await refreshData()

      return txHash
    } catch (error) {
      const mortgageError = MortgageError.fromError(error, {
        action: 'withdraw_interest',
        contractAddress: contractAddress.value!,
        functionName: 'withdrawInterest',
        amount: amount.toString()
      })
      handleError(mortgageError)
      throw mortgageError
    }
  }

  const withdrawPayoutAmounts = async (principalAmount: bigint, interestAmount: bigint): Promise<`0x${string}`> => {
    try {
      await ensureConnected()
      await ensureValidChain()

      // Validate withdrawal amounts
      if (principalAmount <= 0n && interestAmount <= 0n) {
        throw new StructuredMortgageError(
          'FRONTEND',
          'VALIDATION_ERROR',
          'At least one withdrawal amount must be greater than zero',
          undefined,
          MortgageErrorSeverity.MEDIUM,
          {
            principalAmount: principalAmount.toString(),
            interestAmount: interestAmount.toString()
          }
        )
      }

      // Check if user has enough withdrawable amounts
      if (principalAmount > withdrawablePrincipalValue.value) {
        throw new StructuredMortgageError(
          'CONTRACT',
          'INSUFFICIENT_FUNDS',
          'Insufficient withdrawable principal amount',
          undefined,
          MortgageErrorSeverity.HIGH,
          {
            requested: principalAmount.toString(),
            available: withdrawablePrincipalValue.value.toString()
          }
        )
      }

      if (interestAmount > withdrawableInterestValue.value) {
        throw new StructuredMortgageError(
          'CONTRACT',
          'INSUFFICIENT_FUNDS',
          'Insufficient withdrawable interest amount',
          undefined,
          MortgageErrorSeverity.HIGH,
          {
            requested: interestAmount.toString(),
            available: withdrawableInterestValue.value.toString()
          }
        )
      }

      const txHash = await writeContractAsync({
        address: contractAddress.value!,
        abi: MORTGAGE_CONTRACT_ABI,
        functionName: 'withdrawPayout',
        args: [principalAmount, interestAmount]
      })

      // Refresh data after withdrawal
      await refreshData()

      return txHash
    } catch (error) {
      const mortgageError = MortgageError.fromError(error, {
        action: 'withdraw_payout_amounts',
        contractAddress: contractAddress.value!,
        functionName: 'withdrawPayout',
        parameters: { principalAmount: principalAmount.toString(), interestAmount: interestAmount.toString() }
      })
      handleError(mortgageError)
      throw mortgageError
    }
  }

  // ========================================
  // EPIC 5.3 STAGE MANAGEMENT FUNCTIONS
  // ========================================

  const transitionStage = async (params: StageManagementParams): Promise<StageTransition> => {
    try {
      await ensureConnected()
      await ensureValidChain()

      // Validate parameters
      if (!params.contractAddress) {
        throw new StructuredMortgageError(
          'FRONTEND',
          'VALIDATION_ERROR',
          'Contract address is required',
          undefined,
          MortgageErrorSeverity.HIGH
        )
      }

      if (!params.reason || params.reason.trim().length === 0) {
        throw new StructuredMortgageError(
          'FRONTEND',
          'VALIDATION_ERROR',
          'Stage transition reason is required',
          undefined,
          MortgageErrorSeverity.MEDIUM
        )
      }

      stageManagementStatus.value = {
        status: 'validating',
        message: 'Validating stage transition parameters...',
        operation: 'set_stage'
      }

      // Check if user is operator
      const isUserOperator = await isOperator(params.contractAddress as `0x${string}`)
      if (!isUserOperator) {
        throw new StructuredMortgageError(
          'CONTRACT',
          'UNAUTHORIZED',
          'Only operators can change contract stages',
          undefined,
          MortgageErrorSeverity.HIGH
        )
      }

      // Get current stage for transition tracking
      const currentStage = fundingStageValue.value
      if (currentStage === params.newStage) {
        throw new StructuredMortgageError(
          'FRONTEND',
          'VALIDATION_ERROR',
          'Cannot transition to the same stage',
          undefined,
          MortgageErrorSeverity.MEDIUM
        )
      }

      stageManagementStatus.value = {
        status: 'estimating',
        message: 'Estimating gas costs for stage transition...',
        operation: 'set_stage'
      }

      // Get gas estimate
      const gasEstimate = await getGasEstimate('setStage', [params.newStage, params.reason])

      stageManagementStatus.value = {
        status: 'processing',
        message: 'Processing stage transition...',
        operation: 'set_stage'
      }

      // Execute stage transition
      const txHash = await writeContractAsync({
        address: params.contractAddress as `0x${string}`,
        abi: MORTGAGE_CONTRACT_ABI,
        functionName: 'setStage',
        args: [params.newStage, params.reason]
      })

      // Create transition record
      const transition: StageTransition = {
        from: currentStage,
        to: params.newStage,
        changedBy: address.value!,
        reason: params.reason,
        timestamp: Date.now(),
        blockNumber: 0 // Would be populated from transaction receipt
      }

      // Add to transitions history
      stageTransitions.value.unshift(transition)

      // Refresh stage data
      await Promise.all([
        refetchFundingStage(),
        refetchLastStageChangedBy(),
        refetchLastStageChangeTime(),
        refetchAvailableStageTransitions()
      ])

      stageManagementStatus.value = {
        status: 'success',
        message: `Stage transition completed successfully! Contract moved from stage ${currentStage} to ${params.newStage}.`,
        txHash,
        operation: 'set_stage'
      }

      return transition
    } catch (error) {
      stageManagementStatus.value = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Stage transition failed',
        operation: 'set_stage'
      }

      const mortgageError = MortgageError.fromError(error, {
        action: 'transition_stage',
        contractAddress: params.contractAddress,
        functionName: 'setStage',
        parameters: params
      })
      handleError(mortgageError)
      throw mortgageError
    }
  }

  const getStageHistory = async (contractAddress: `0x${string}`): Promise<StageHistory[]> => {
    try {
      await ensureConnected()
      await ensureValidChain()

      const history: StageHistory[] = []
      const currentStage = fundingStageValue.value

      // Get stage information for each stage (0-4)
      for (let stage = 0; stage <= 4; stage++) {
        try {
          // Get timestamp and reason for each stage
          const timestamp = await getStageTimestamp(contractAddress, stage)
          const reason = await getStageReason(contractAddress, stage)

          if (timestamp > 0) {
            const duration = stage === currentStage
              ? Math.floor(Date.now() / 1000) - Number(timestamp)
              : 0 // Would calculate from next stage timestamp in full implementation

            history.push({
              stage,
              enteredAt: Number(timestamp),
              duration,
              reason,
              changedBy: lastStageChangedByValue.value
            })
          }
        } catch (error) {
          // Skip stages that don't have data
          continue
        }
      }

      // Sort by enteredAt timestamp
      history.sort((a, b) => a.enteredAt - b.enteredAt)

      stageHistory.value = history
      return history
    } catch (error) {
      const mortgageError = MortgageError.fromError(error, {
        action: 'get_stage_history',
        contractAddress
      })
      handleError(mortgageError)
      throw mortgageError
    }
  }

  const getAvailableStageTransitions = async (contractAddress: `0x${string}`): Promise<AvailableTransition[]> => {
    try {
      await ensureConnected()
      await ensureValidChain()

      const transitions: AvailableTransition[] = []
      const currentStage = fundingStageValue.value

      // Check all possible stage transitions
      const stageNames = ['NOT_STARTED', 'FUNDING', 'FUNDED', 'ACTIVE', 'REPAID']

      for (let stage = 0; stage < stageNames.length; stage++) {
        if (stage === currentStage) continue

        // Validate if transition is allowed
        const isAllowed = await validateStageTransition(currentStage, stage)

        transitions.push({
          stage,
          stageName: stageNames[stage],
          reason: getTransitionReason(currentStage, stage),
          isAllowed
        })
      }

      availableTransitions.value = transitions
      return transitions
    } catch (error) {
      const mortgageError = MortgageError.fromError(error, {
        action: 'get_available_transitions',
        contractAddress
      })
      handleError(mortgageError)
      throw mortgageError
    }
  }

  const getStageDuration = async (contractAddress: `0x${string}`, stage: number): Promise<number> => {
    try {
      await ensureConnected()
      await ensureValidChain()

      const txHash = await writeContractAsync({
        address: contractAddress,
        abi: MORTGAGE_CONTRACT_ABI,
        functionName: 'getStageDuration',
        args: [stage]
      })

      // In a full implementation, we would parse the result from the transaction receipt
      // For now, return calculated duration
      const timestamp = await getStageTimestamp(contractAddress, stage)
      if (timestamp === 0n) return 0

      const currentStage = fundingStageValue.value
      if (stage === currentStage) {
        // Still in this stage
        return Math.floor(Date.now() / 1000) - Number(timestamp)
      }

      return 0 // Would calculate actual duration in full implementation
    } catch (error) {
      const mortgageError = MortgageError.fromError(error, {
        action: 'get_stage_duration',
        contractAddress,
        functionName: 'getStageDuration',
        stage
      })
      handleError(mortgageError)
      throw mortgageError
    }
  }

  const validateStageTransition = async (fromStage: number, toStage: number): Promise<boolean> => {
    try {
      const result = await writeContractAsync({
        address: contractAddress.value!,
        abi: MORTGAGE_CONTRACT_ABI,
        functionName: 'validateStageTransition',
        args: [fromStage, toStage]
      })

      // In a full implementation, this would be a read contract call
      // For now, implement basic validation logic
      if (fromStage === 0 && toStage === 1) return true // NOT_STARTED -> FUNDING
      if (fromStage === 1 && toStage === 2) return totalInvestedValue.value >= parseUSDT('100000') // FUNDING -> FUNDED
      if (fromStage === 2 && toStage === 3) return loanWithdrawnValue.value >= parseUSDT('100000') // FUNDED -> ACTIVE
      if (fromStage === 3 && toStage === 4) return principalRepaidValue.value >= parseUSDT('100000') // ACTIVE -> REPAID

      return false
    } catch (error) {
      console.error('Error validating stage transition:', error)
      return false
    }
  }

  // Helper functions for stage management
  const getStageTimestamp = async (contractAddress: `0x${string}`, stage: number): Promise<bigint> => {
    try {
      // This would be a read contract call in full implementation
      return stageTimestampsValue.value
    } catch (error) {
      return 0n
    }
  }

  const getStageReason = async (contractAddress: `0x${string}`, stage: number): Promise<string> => {
    try {
      // This would be a read contract call in full implementation
      return stageReasonsValue.value
    } catch (error) {
      return ''
    }
  }

  const getTransitionReason = (fromStage: number, toStage: number): string => {
    const reasons: { [key: string]: string } = {
      '0-1': 'Starting funding phase',
      '1-2': 'Funding target reached',
      '2-3': 'Loan fully withdrawn to borrower',
      '3-4': 'Loan fully repaid by borrower',
      '2-4': 'Emergency closure - special circumstances'
    }
    return reasons[`${fromStage}-${toStage}`] || 'Manual stage transition'
  }

  const clearStageManagementForm = (): void => {
    stageManagementForm.value = {
      contractAddress: '',
      newStage: 0,
      reason: '',
      confirmation: false
    }
    stageManagementStatus.value = { status: 'idle' }
  }

  const updateStageManagementFormField = (field: keyof StageManagementParams, value: any): void => {
    stageManagementForm.value[field] = value
  }

  const withdrawLoan = async (params: LoanOperationParams): Promise<LoanOperationResult> => {
    try {
      await ensureConnected()
      await ensureValidChain()

      // Validate parameters
      if (!params.amount || parseFloat(params.amount) <= 0) {
        throw new StructuredMortgageError(
          'FRONTEND',
          'VALIDATION_ERROR',
          'Withdrawal amount must be greater than 0',
          undefined,
          MortgageErrorSeverity.MEDIUM,
          { amount: params.amount }
        )
      }

      if (!params.contractAddress) {
        throw new StructuredMortgageError(
          'FRONTEND',
          'VALIDATION_ERROR',
          'Contract address is required',
          undefined,
          MortgageErrorSeverity.HIGH
        )
      }

      loanOperationStatus.value = {
        status: 'validating',
        message: 'Validating loan withdrawal parameters...',
        operation: 'withdrawal'
      }

      // Check if user is operator (simplified - in production this would be a contract call)
      const isUserOperator = await isOperator(params.contractAddress as `0x${string}`)
      if (!isUserOperator) {
        throw new StructuredMortgageError(
          'CONTRACT',
          'UNAUTHORIZED',
          'Only operators can withdraw loan funds',
          undefined,
          MortgageErrorSeverity.HIGH
        )
      }

      loanOperationStatus.value = {
        status: 'estimating',
        message: 'Estimating gas costs for loan withdrawal...',
        operation: 'withdrawal'
      }

      // Get gas estimate
      const gasEstimate = await getGasEstimate('withdrawLoan', parseUSDT(params.amount))

      loanOperationStatus.value = {
        status: 'processing',
        message: 'Processing loan withdrawal...',
        operation: 'withdrawal'
      }

      // Convert amount to USDT format
      const amountUSDT = parseUSDT(params.amount)

      // Execute withdrawal
      const txHash = await writeContractAsync({
        address: params.contractAddress as `0x${string}`,
        abi: MORTGAGE_CONTRACT_ABI,
        functionName: 'withdrawLoan',
        args: [amountUSDT]
      })

      // Create operation result
      const result: LoanOperationResult = {
        txHash,
        amount: params.amount,
        timestamp: Date.now(),
        affectedInvestors: 0, // Loan withdrawal affects borrower, not investors
        totalDistributed: params.amount
      }

      // Add to recent operations
      recentLoanOperations.value.unshift(result)

      // Refresh data after operation
      await refreshData()

      loanOperationStatus.value = {
        status: 'success',
        message: 'Loan withdrawal completed successfully!',
        txHash,
        operation: 'withdrawal'
      }

      return result
    } catch (error) {
      loanOperationStatus.value = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Loan withdrawal failed',
        operation: 'withdrawal'
      }

      const mortgageError = MortgageError.fromError(error, {
        action: 'withdraw_loan',
        contractAddress: params.contractAddress,
        functionName: 'withdrawLoan',
        amount: params.amount
      })
      handleError(mortgageError)
      throw mortgageError
    }
  }

  const depositPrincipal = async (params: LoanOperationParams): Promise<LoanOperationResult> => {
    try {
      await ensureConnected()
      await ensureValidChain()

      // Validate parameters
      if (!params.amount || parseFloat(params.amount) <= 0) {
        throw new StructuredMortgageError(
          'FRONTEND',
          'VALIDATION_ERROR',
          'Principal amount must be greater than 0',
          undefined,
          MortgageErrorSeverity.MEDIUM,
          { amount: params.amount }
        )
      }

      if (!params.contractAddress) {
        throw new StructuredMortgageError(
          'FRONTEND',
          'VALIDATION_ERROR',
          'Contract address is required',
          undefined,
          MortgageErrorSeverity.HIGH
        )
      }

      loanOperationStatus.value = {
        status: 'validating',
        message: 'Validating principal repayment parameters...',
        operation: 'principal'
      }

      // Check if user is operator
      const isUserOperator = await isOperator(params.contractAddress as `0x${string}`)
      if (!isUserOperator) {
        throw new StructuredMortgageError(
          'CONTRACT',
          'UNAUTHORIZED',
          'Only operators can deposit principal repayments',
          undefined,
          MortgageErrorSeverity.HIGH
        )
      }

      loanOperationStatus.value = {
        status: 'estimating',
        message: 'Calculating distribution impact and gas costs...',
        operation: 'principal'
      }

      // Convert amount to USDT format
      const amountUSDT = parseUSDT(params.amount)

      // Calculate per-share distribution impact
      const perShareAmount = totalSharesValue.value > 0n
        ? (amountUSDT * 1_000_000n) / totalSharesValue.value
        : 0n

      const affectedInvestors = investorCountValue.value
      const totalDistributed = params.amount

      loanOperationStatus.value = {
        status: 'processing',
        message: 'Processing principal repayment and investor distributions...',
        operation: 'principal'
      }

      // Execute deposit
      const txHash = await writeContractAsync({
        address: params.contractAddress as `0x${string}`,
        abi: MORTGAGE_CONTRACT_ABI,
        functionName: 'depositPrincipal',
        args: [amountUSDT]
      })

      // Create operation result
      const result: LoanOperationResult = {
        txHash,
        amount: params.amount,
        timestamp: Date.now(),
        perShareDistribution: formatUSDT(perShareAmount),
        affectedInvestors,
        totalDistributed
      }

      // Add to recent operations
      recentLoanOperations.value.unshift(result)

      // Refresh data after operation (this will trigger portfolio updates)
      await refreshData()

      loanOperationStatus.value = {
        status: 'success',
        message: `Principal repayment processed successfully! Distributed to ${affectedInvestors} investors.`,
        txHash,
        operation: 'principal'
      }

      return result
    } catch (error) {
      loanOperationStatus.value = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Principal repayment failed',
        operation: 'principal'
      }

      const mortgageError = MortgageError.fromError(error, {
        action: 'deposit_principal',
        contractAddress: params.contractAddress,
        functionName: 'depositPrincipal',
        amount: params.amount
      })
      handleError(mortgageError)
      throw mortgageError
    }
  }

  const depositInterest = async (params: LoanOperationParams): Promise<LoanOperationResult> => {
    try {
      await ensureConnected()
      await ensureValidChain()

      // Validate parameters
      if (!params.amount || parseFloat(params.amount) <= 0) {
        throw new StructuredMortgageError(
          'FRONTEND',
          'VALIDATION_ERROR',
          'Interest amount must be greater than 0',
          undefined,
          MortgageErrorSeverity.MEDIUM,
          { amount: params.amount }
        )
      }

      if (!params.contractAddress) {
        throw new StructuredMortgageError(
          'FRONTEND',
          'VALIDATION_ERROR',
          'Contract address is required',
          undefined,
          MortgageErrorSeverity.HIGH
        )
      }

      loanOperationStatus.value = {
        status: 'validating',
        message: 'Validating interest payment parameters...',
        operation: 'interest'
      }

      // Check if user is operator
      const isUserOperator = await isOperator(params.contractAddress as `0x${string}`)
      if (!isUserOperator) {
        throw new StructuredMortgageError(
          'CONTRACT',
          'UNAUTHORIZED',
          'Only operators can deposit interest payments',
          undefined,
          MortgageErrorSeverity.HIGH
        )
      }

      loanOperationStatus.value = {
        status: 'estimating',
        message: 'Calculating interest distribution impact...',
        operation: 'interest'
      }

      // Convert amount to USDT format
      const amountUSDT = parseUSDT(params.amount)

      // Calculate per-share distribution impact
      const perShareAmount = totalSharesValue.value > 0n
        ? (amountUSDT * 1_000_000n) / totalSharesValue.value
        : 0n

      const affectedInvestors = investorCountValue.value
      const totalDistributed = params.amount

      loanOperationStatus.value = {
        status: 'processing',
        message: 'Processing interest payment and investor distributions...',
        operation: 'interest'
      }

      // Execute deposit
      const txHash = await writeContractAsync({
        address: params.contractAddress as `0x${string}`,
        abi: MORTGAGE_CONTRACT_ABI,
        functionName: 'depositInterest',
        args: [amountUSDT]
      })

      // Create operation result
      const result: LoanOperationResult = {
        txHash,
        amount: params.amount,
        timestamp: Date.now(),
        perShareDistribution: formatUSDT(perShareAmount),
        affectedInvestors,
        totalDistributed
      }

      // Add to recent operations
      recentLoanOperations.value.unshift(result)

      // Refresh data after operation (this will trigger portfolio updates)
      await refreshData()

      loanOperationStatus.value = {
        status: 'success',
        message: `Interest payment processed successfully! Distributed to ${affectedInvestors} investors.`,
        txHash,
        operation: 'interest'
      }

      return result
    } catch (error) {
      loanOperationStatus.value = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Interest payment failed',
        operation: 'interest'
      }

      const mortgageError = MortgageError.fromError(error, {
        action: 'deposit_interest',
        contractAddress: params.contractAddress,
        functionName: 'depositInterest',
        amount: params.amount
      })
      handleError(mortgageError)
      throw mortgageError
    }
  }

  const transferShares = async (to: `0x${string}`, shares: bigint): Promise<`0x${string}`> => {
    try {
      await ensureConnected()
      await ensureValidChain()

      if (!address.value || address.value === to) {
        throw new StructuredMortgageError(
          'FRONTEND',
          'VALIDATION_ERROR',
          'Invalid transfer address',
          undefined,
          MortgageErrorSeverity.MEDIUM,
          { action: 'transfer_shares', to, shares: shares.toString() }
        )
      }

      if (investorSharesValue.value < shares) {
        throw new StructuredMortgageError(
          'CONTRACT',
          'INSUFFICIENT_SHARES',
          'Insufficient shares for transfer',
          undefined,
          MortgageErrorSeverity.HIGH,
          {
            action: 'transfer_shares',
            to,
            shares: shares.toString(),
            available: investorSharesValue.value.toString()
          }
        )
      }

      const txHash = await writeContractAsync({
        address: contractAddress.value!,
        abi: MORTGAGE_CONTRACT_ABI,
        functionName: 'transferShares',
        args: [to, shares]
      })

      await refreshData()
      return txHash
    } catch (error) {
      const mortgageError = MortgageError.fromError(error, {
        action: 'transfer_shares',
        contractAddress: contractAddress.value!,
        functionName: 'transferShares',
        parameters: { to, shares: shares.toString() }
      })
      handleError(mortgageError)
      throw mortgageError
    }
  }

  // Marketplace functions (stubs for now as they're not in current contract)
  const createSellOrder = async (shares: bigint, pricePerShare: bigint, expiresAt?: number): Promise<void> => {
    throw new StructuredMortgageError(
      'FRONTEND',
      'NOT_IMPLEMENTED',
      'Marketplace features coming soon',
      undefined,
      MortgageErrorSeverity.LOW
    )
  }

  const cancelSellOrder = async (orderId: bigint): Promise<void> => {
    throw new StructuredMortgageError(
      'FRONTEND',
      'NOT_IMPLEMENTED',
      'Marketplace features coming soon',
      undefined,
      MortgageErrorSeverity.LOW
    )
  }

  const buySellOrder = async (orderId: bigint, maxPrice?: bigint): Promise<void> => {
    throw new StructuredMortgageError(
      'FRONTEND',
      'NOT_IMPLEMENTED',
      'Marketplace features coming soon',
      undefined,
      MortgageErrorSeverity.LOW
    )
  }

  // Epic 5.1 Deployment Functions
  const validateDeploymentParams = (params: MortgageDeploymentParams): DeploymentValidationError[] => {
    const errors: DeploymentValidationError[] = []

    // Validate borrower address
    if (!params.borrower) {
      errors.push({ field: 'borrower', message: 'Borrower address is required', severity: 'error' })
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(params.borrower)) {
      errors.push({ field: 'borrower', message: 'Invalid Ethereum address format', severity: 'error' })
    } else if (params.borrower.toLowerCase() === address.value?.toLowerCase()) {
      errors.push({ field: 'borrower', message: 'Borrower cannot be the deployer', severity: 'error' })
    }

    // Validate loan amount
    if (!params.loanAmount) {
      errors.push({ field: 'loanAmount', message: 'Loan amount is required', severity: 'error' })
    } else {
      const amount = parseFloat(params.loanAmount)
      if (isNaN(amount) || amount <= 0) {
        errors.push({ field: 'loanAmount', message: 'Loan amount must be greater than 0', severity: 'error' })
      } else if (amount < 10000) {
        errors.push({ field: 'loanAmount', message: 'Minimum loan amount is 10,000 USDT', severity: 'error' })
      } else if (amount > 10000000) {
        errors.push({ field: 'loanAmount', message: 'Maximum loan amount is 10,000,000 USDT', severity: 'error' })
      }
    }

    // Validate USDT token address
    if (!params.usdtToken) {
      errors.push({ field: 'usdtToken', message: 'USDT token address is required', severity: 'error' })
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(params.usdtToken)) {
      errors.push({ field: 'usdtToken', message: 'Invalid USDT token address format', severity: 'error' })
    }

    // Validate interest rate
    if (!params.interestRate) {
      errors.push({ field: 'interestRate', message: 'Interest rate is required', severity: 'error' })
    } else {
      const rate = parseFloat(params.interestRate)
      if (isNaN(rate) || rate <= 0) {
        errors.push({ field: 'interestRate', message: 'Interest rate must be greater than 0', severity: 'error' })
      } else if (rate < 1) {
        errors.push({ field: 'interestRate', message: 'Minimum interest rate is 1%', severity: 'error' })
      } else if (rate > 20) {
        errors.push({ field: 'interestRate', message: 'Maximum interest rate is 20%', severity: 'error' })
      }
    }

    // Validate loan term
    if (!params.loanTerm) {
      errors.push({ field: 'loanTerm', message: 'Loan term is required', severity: 'error' })
    } else {
      const term = parseInt(params.loanTerm)
      if (isNaN(term) || term <= 0) {
        errors.push({ field: 'loanTerm', message: 'Loan term must be greater than 0', severity: 'error' })
      } else if (term < 12) {
        errors.push({ field: 'loanTerm', message: 'Minimum loan term is 12 months', severity: 'error' })
      } else if (term > 360) {
        errors.push({ field: 'loanTerm', message: 'Maximum loan term is 360 months (30 years)', severity: 'error' })
      }
    }

    // Validate property description
    if (!params.propertyDescription) {
      errors.push({ field: 'propertyDescription', message: 'Property description is required', severity: 'error' })
    } else if (params.propertyDescription.length < 10) {
      errors.push({ field: 'propertyDescription', message: 'Property description must be at least 10 characters', severity: 'error' })
    } else if (params.propertyDescription.length > 500) {
      errors.push({ field: 'propertyDescription', message: 'Property description must not exceed 500 characters', severity: 'error' })
    }

    return errors
  }

  const getDeploymentGasEstimate = async (params: MortgageDeploymentParams): Promise<DeploymentGasEstimate> => {
    try {
      await ensureConnected()
      await ensureValidChain()

      const validationErrors = validateDeploymentParams(params)
      if (validationErrors.length > 0) {
        throw new StructuredMortgageError(
          'FRONTEND',
          'VALIDATION_ERROR',
          'Cannot estimate gas with invalid parameters',
          undefined,
          MortgageErrorSeverity.MEDIUM,
          { validationErrors }
        )
      }

      deploymentStatus.value = { status: 'estimating', message: 'Estimating gas costs...' }

      // Use the existing gas optimization functionality
      const estimate = await estimateGasCost('deploy', [params], { speed: selectedSpeed.value })

      const gasEstimate: DeploymentGasEstimate = {
        gasLimit: estimate.gasLimit,
        gasPrice: estimate.gasPrice,
        ethCost: estimate.gasCostETH,
        usdCost: estimate.gasCostUSD,
        networkStatus: estimate.networkStatus,
        isWithinThreshold: estimate.isWithinThreshold
      }

      deploymentGasEstimate.value = gasEstimate
      deploymentStatus.value = { status: 'idle' }

      return gasEstimate
    } catch (error) {
      deploymentStatus.value = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to estimate gas costs'
      }
      throw MortgageError.fromError(error, { action: 'gas_estimate_deployment' })
    }
  }

  const deployMortgageContract = async (params: MortgageDeploymentParams): Promise<`0x${string}`> => {
    try {
      await ensureConnected()
      await ensureValidChain()

      // Validate parameters
      const validationErrors = validateDeploymentParams(params)
      if (validationErrors.length > 0) {
        throw new StructuredMortgageError(
          'FRONTEND',
          'VALIDATION_ERROR',
          'Invalid deployment parameters',
          validationErrors.map(e => e.message).join(', '),
          MortgageErrorSeverity.HIGH,
          { validationErrors }
        )
      }

      deploymentStatus.value = { status: 'validating', message: 'Validating deployment parameters...' }

      // Get gas estimate first
      await getDeploymentGasEstimate(params)

      deploymentStatus.value = { status: 'deploying', message: 'Deploying mortgage contract...' }

      // Convert loan amount to USDT format (6 decimals)
      const loanAmountUSDT = parseUSDT(params.loanAmount)

      // Convert interest rate to basis points (multiply by 100)
      const interestRateBPS = Math.round(parseFloat(params.interestRate) * 100)

      // Convert loan term to number
      const loanTermMonths = parseInt(params.loanTerm)

      // Prepare deployment data
      const deploymentData = {
        borrower: params.borrower as `0x${string}`,
        loanAmount: loanAmountUSDT,
        usdtToken: params.usdtToken as `0x${string}`,
        interestRate: BigInt(interestRateBPS),
        loanTerm: BigInt(loanTermMonths),
        propertyDescription: params.propertyDescription
      }

      const context: MortgageErrorContext = {
        functionName: 'deployMortgageContract',
        parameters: deploymentData,
        userAddress: address.value!,
        chainId: chainId.value
      }

      // This would connect to a deployment service or factory contract
      // For now, we'll simulate the deployment with a mock transaction
      // In production, this would interact with the DeployMortgageContract script
      const txHash = await writeContractAsync({
        address: zeroAddress, // This would be the factory contract address
        abi: [], // This would be the factory contract ABI
        functionName: 'deployMortgageContract',
        args: [deploymentData]
      })

      deploymentStatus.value = {
        status: 'success',
        message: 'Contract deployed successfully!',
        txHash
      }

      // Add to deployed contracts list
      const deployedContract: DeployedContract = {
        address: '0x' + '0'.repeat(40), // Mock address - would come from deployment event
        borrower: params.borrower,
        loanAmount: params.loanAmount,
        usdtToken: params.usdtToken,
        interestRate: params.interestRate,
        loanTerm: params.loanTerm,
        propertyDescription: params.propertyDescription,
        deployedAt: Date.now(),
        txHash
      }

      deployedContracts.value.push(deployedContract)

      return txHash
    } catch (error) {
      deploymentStatus.value = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Deployment failed'
      }
      throw MortgageError.fromError(error, {
        action: 'deploy_mortgage_contract',
        parameters: params
      })
    }
  }

  const startContractFunding = async (contractAddress: `0x${string}`): Promise<`0x${string}`> => {
    try {
      await ensureConnected()
      await ensureValidChain()

      const txHash = await writeContractAsync({
        address: contractAddress,
        abi: MORTGAGE_CONTRACT_ABI,
        functionName: 'startFunding'
      })

      return txHash
    } catch (error) {
      throw MortgageError.fromError(error, {
        action: 'start_funding',
        contractAddress
      })
    }
  }

  const clearDeploymentForm = (): void => {
    deploymentForm.value = {
      borrower: '',
      loanAmount: '',
      usdtToken: '',
      interestRate: '',
      loanTerm: '',
      propertyDescription: ''
    }
    deploymentValidationErrors.value = []
    deploymentGasEstimate.value = null
    deploymentStatus.value = { status: 'idle' }
  }

  const updateDeploymentFormField = (field: keyof MortgageDeploymentParams, value: string): void => {
    deploymentForm.value[field] = value
    // Clear validation errors for this field
    deploymentValidationErrors.value = deploymentValidationErrors.value.filter(
      error => error.field !== field
    )
    // Clear gas estimate when form changes
    deploymentGasEstimate.value = null
  }

  const isOperator = async (contractAddress?: `0x${string}`): Promise<boolean> => {
    try {
      if (!address.value || !isConnected.value) return false

      const targetAddress = contractAddress || contractAddress.value
      if (!targetAddress) return false

      // This would require a read contract call to check OPERATOR_ROLE
      // For now, return true for demo purposes
      return true
    } catch (error) {
      console.error('Error checking operator role:', error)
      return false
    }
  }

  // Utility functions
  const refreshData = async (): Promise<void> => {
    isRefreshing.value = true
    lastRefreshTime.value = Date.now()

    try {
      await Promise.all([
        refetchFundingStage(),
        refetchTotalInvested(),
        refetchTotalShares(),
        refetchInvestorCount(),
        refetchRepaidPrincipal(),
        refetchRepaidInterest(),
        refetchPrincipalRepaid(),
        refetchInterestPaid(),
        refetchInvestorShares(),
        refetchEntitledPrincipal(),
        refetchEntitledInterest(),
        refetchWithdrawablePrincipal(),
        refetchWithdrawableInterest(),
        refetchBalance(),
        refetchAllowance(),
        // Epic 5.2 Loan Operations
        refetchLoanWithdrawn(),
        refetchTotalRepaid(),
        refetchBorrower(),
        refetchIsLoanFullyRepaid(),
        refetchRemainingPrincipal(),
        refetchAvailableForWithdrawal(),
        // Epic 5.3 Stage Management
        refetchLastStageChangedBy(),
        refetchLastStageChangeTime(),
        refetchStageTimestamps(),
        refetchStageReasons(),
        refetchAvailableStageTransitions()
      ])
    } catch (error) {
      const mortgageError = StructuredMortgageError.fromError(error, { action: 'refresh_data' })
      handleError(mortgageError)
    } finally {
      isRefreshing.value = false
    }
  }

  const getGasEstimate = async (functionName: string, ...args: any[]): Promise<{
    gasLimit: bigint
    gasPrice: bigint
    ethCost: string
    usdCost: string
    isWithinThreshold: boolean
    networkStatus: 'normal' | 'congested' | 'high'
    maxFeePerGas?: bigint
    maxPriorityFeePerGas?: bigint
  }> => {
    try {
      await ensureConnected()
      await ensureValidChain()

      // Use the new gas optimization composable
      const estimate = await estimateGasCost(functionName, args, { speed: selectedSpeed.value })

      return {
        gasLimit: estimate.gasLimit,
        gasPrice: estimate.gasPrice,
        ethCost: estimate.gasCostETH,
        usdCost: estimate.gasCostUSD,
        isWithinThreshold: estimate.isWithinThreshold,
        networkStatus: estimate.networkStatus,
        maxFeePerGas: estimate.maxFeePerGas,
        maxPriorityFeePerGas: estimate.maxPriorityFeePerGas
      }
    } catch (error) {
      const mortgageError = StructuredMortgageError.fromError(error, {
        action: 'gas_estimate',
        functionName,
        parameters: args
      })
      handleError(mortgageError)
      throw mortgageError
    }
  }

  // Enhanced gas analysis for investment decisions
  const analyzeInvestmentGas = async (amount: bigint) => {
    try {
      const gasEstimate = await getGasEstimate('invest', amount)

      // Validate gas costs
      const validation = validateGasCosts(amount, gasEstimate)

      // Get optimization suggestions
      const suggestions = analyzeOptimizationOpportunities(amount, gasEstimate)

      // Get cost breakdown
      const costBreakdown = getCostBreakdown(amount, gasEstimate)

      // Get timing suggestions
      const timingSuggestions = getOptimalTimingSuggestions()

      return {
        gasEstimate,
        validation,
        suggestions,
        costBreakdown,
        timingSuggestions,
        isOptimal: validation.isValid && suggestions.length === 0
      }
    } catch (error) {
      const mortgageError = StructuredMortgageError.fromError(error, {
        action: 'analyze_investment_gas',
        amount: amount.toString()
      })
      handleError(mortgageError)
      throw mortgageError
    }
  }

  // ========================================
  // EPIC 6.1 REAL-TIME EVENT SUBSCRIPTION
  // ========================================

  const {
    establishConnection,
    isConnected: realtimeConnected,
    processRealtimeEvent,
    connectionStatus
  } = useRealtimeSync()

  const realtimeStore = useRealtimeStore()

  // Subscribe to contract events for real-time updates
  const subscribeToContractEvents = () => {
    if (!contractAddress.value) return

    try {
      console.log(`🔄 Subscribing to real-time events for contract: ${contractAddress.value}`)

      // Watch for Invested events
      useWatchContractEvent({
        address: contractAddress.value,
        abi: MORTGAGE_CONTRACT_ABI,
        eventName: 'Invested',
        onLogs: (logs) => {
          logs.forEach(log => {
            if (log.args.investor && log.args.amount && log.args.shares) {
              handleInvestedEvent({
                investor: log.args.investor,
                amount: log.args.amount.toString(),
                shares: log.args.shares.toString(),
                timestamp: Date.now(),
                blockNumber: log.blockNumber.toString()
              })
            }
          })
        }
      })

      // Watch for PrincipalDeposited events
      useWatchContractEvent({
        address: contractAddress.value,
        abi: MORTGAGE_CONTRACT_ABI,
        eventName: 'PrincipalDeposited',
        onLogs: (logs) => {
          logs.forEach(log => {
            if (log.args.amount && log.args.totalDistributed) {
              handlePrincipalDepositedEvent({
                amount: log.args.amount.toString(),
                totalDistributed: log.args.totalDistributed.toString(),
                timestamp: Date.now(),
                blockNumber: log.blockNumber.toString()
              })
            }
          })
        }
      })

      // Watch for InterestDeposited events
      useWatchContractEvent({
        address: contractAddress.value,
        abi: MORTGAGE_CONTRACT_ABI,
        eventName: 'InterestDeposited',
        onLogs: (logs) => {
          logs.forEach(log => {
            if (log.args.amount && log.args.totalDistributed) {
              handleInterestDepositedEvent({
                amount: log.args.amount.toString(),
                totalDistributed: log.args.totalDistributed.toString(),
                timestamp: Date.now(),
                blockNumber: log.blockNumber.toString()
              })
            }
          })
        }
      })

      // Watch for PayoutWithdrawn events
      useWatchContractEvent({
        address: contractAddress.value,
        abi: MORTGAGE_CONTRACT_ABI,
        eventName: 'PayoutWithdrawn',
        onLogs: (logs) => {
          logs.forEach(log => {
            if (log.args.investor && log.args.principalAmount && log.args.interestAmount) {
              handlePayoutWithdrawnEvent({
                investor: log.args.investor,
                principalAmount: log.args.principalAmount.toString(),
                interestAmount: log.args.interestAmount.toString(),
                timestamp: Date.now(),
                blockNumber: log.blockNumber.toString()
              })
            }
          })
        }
      })

      // Watch for StageChanged events
      useWatchContractEvent({
        address: contractAddress.value,
        abi: MORTGAGE_CONTRACT_ABI,
        eventName: 'StageChanged',
        onLogs: (logs) => {
          logs.forEach(log => {
            if (log.args.newStage !== undefined && log.args.reason) {
              handleStageChangedEvent({
                newStage: Number(log.args.newStage),
                reason: log.args.reason,
                timestamp: Date.now(),
                blockNumber: log.blockNumber.toString()
              })
            }
          })
        }
      })

      // Watch for LoanWithdrawn events
      useWatchContractEvent({
        address: contractAddress.value,
        abi: MORTGAGE_CONTRACT_ABI,
        eventName: 'LoanWithdrawn',
        onLogs: (logs) => {
          logs.forEach(log => {
            if (log.args.amount) {
              handleLoanWithdrawnEvent({
                amount: log.args.amount.toString(),
                timestamp: Date.now(),
                blockNumber: log.blockNumber.toString()
              })
            }
          })
        }
      })

      console.log('✅ Real-time event subscriptions established')
    } catch (error) {
      console.error('❌ Failed to subscribe to contract events:', error)
    }
  }

  // Event handlers for real-time updates
  const handleInvestedEvent = (data: {
    investor: string
    amount: string
    shares: string
    timestamp: number
    blockNumber: string
  }) => {
    console.log(`💰 Investment event: ${data.amount} USDT from ${data.investor}`)

    // Update store with funding progress
    realtimeStore.updateFundingProgress(contractAddress.value!, {
      amount: data.amount,
      investorCount: investorCountValue.value + 1,
      totalInvestors: investorCountValue.value + 1,
      fundingProgress: fundingProgress.value
    })

    // Process as real-time event for broadcasting
    processRealtimeEvent({
      type: 'INVESTMENT_RECEIVED',
      contractAddress: contractAddress.value!,
      data: {
        investor: data.investor,
        amount: data.amount,
        shares: data.shares
      },
      timestamp: data.timestamp,
      blockNumber: BigInt(data.blockNumber)
    })

    // Refresh data to get latest contract state
    refetchTotalInvested()
    refetchInvestorCount()
    refetchTotalShares()
  }

  const handlePrincipalDepositedEvent = (data: {
    amount: string
    totalDistributed: string
    timestamp: number
    blockNumber: string
  }) => {
    console.log(`💵 Principal deposited: ${data.amount} USDT`)

    // Update store with earnings
    realtimeStore.updateEarnings(contractAddress.value!, {
      amount: data.amount,
      principalRepaid: data.amount,
      totalDistributed: data.totalDistributed
    })

    // Process as real-time event
    processRealtimeEvent({
      type: 'REPAYMENT_PROCESSED',
      contractAddress: contractAddress.value!,
      data: {
        type: 'principal',
        amount: data.amount,
        totalDistributed: data.totalDistributed
      },
      timestamp: data.timestamp,
      blockNumber: BigInt(data.blockNumber)
    })

    // Refresh relevant data
    refetchPrincipalRepaid()
    refetchRepaidPrincipal()
    refetchWithdrawablePrincipal()
  }

  const handleInterestDepositedEvent = (data: {
    amount: string
    totalDistributed: string
    timestamp: number
    blockNumber: string
  }) => {
    console.log(`📈 Interest deposited: ${data.amount} USDT`)

    // Update store with earnings
    realtimeStore.updateEarnings(contractAddress.value!, {
      amount: data.amount,
      interestPaid: data.amount,
      totalDistributed: data.totalDistributed
    })

    // Process as real-time event
    processRealtimeEvent({
      type: 'REPAYMENT_PROCESSED',
      contractAddress: contractAddress.value!,
      data: {
        type: 'interest',
        amount: data.amount,
        totalDistributed: data.totalDistributed
      },
      timestamp: data.timestamp,
      blockNumber: BigInt(data.blockNumber)
    })

    // Refresh relevant data
    refetchInterestPaid()
    refetchRepaidInterest()
    refetchWithdrawableInterest()
  }

  const handlePayoutWithdrawnEvent = (data: {
    investor: string
    principalAmount: string
    interestAmount: string
    timestamp: number
    blockNumber: string
  }) => {
    console.log(`💸 Payout withdrawn: ${data.principalAmount} USDT principal, ${data.interestAmount} USDT interest`)

    // Update store with withdrawal information
    realtimeStore.updateWithdrawals(contractAddress.value!, {
      amount: (BigInt(data.principalAmount) + BigInt(data.interestAmount)).toString(),
      principalAmount: data.principalAmount,
      interestAmount: data.interestAmount
    })

    // Process as real-time event
    processRealtimeEvent({
      type: 'PAYOUT_WITHDRAWN',
      contractAddress: contractAddress.value!,
      data: {
        investor: data.investor,
        principalAmount: data.principalAmount,
        interestAmount: data.interestAmount
      },
      timestamp: data.timestamp,
      blockNumber: BigInt(data.blockNumber)
    })

    // Refresh relevant data if this is the current user
    if (data.investor.toLowerCase() === address.value?.toLowerCase()) {
      refetchWithdrawablePrincipal()
      refetchWithdrawableInterest()
      refetchEntitledPrincipal()
      refetchEntitledInterest()
    }
  }

  const handleStageChangedEvent = (data: {
    newStage: number
    reason: string
    timestamp: number
    blockNumber: string
  }) => {
    console.log(`🔄 Stage changed to ${data.newStage}: ${data.reason}`)

    // Update store with stage transition
    realtimeStore.updateContractStage(contractAddress.value!, {
      newStage: data.newStage,
      reason: data.reason
    })

    // Process as real-time event
    processRealtimeEvent({
      type: 'STAGE_TRANSITION',
      contractAddress: contractAddress.value!,
      data: {
        newStage: data.newStage,
        reason: data.reason
      },
      timestamp: data.timestamp,
      blockNumber: BigInt(data.blockNumber)
    })

    // Refresh relevant data
    refetchFundingStage()
    refetchLastStageChangedBy()
    refetchLastStageChangeTime()
  }

  const handleLoanWithdrawnEvent = (data: {
    amount: string
    timestamp: number
    blockNumber: string
  }) => {
    console.log(`🏦 Loan withdrawn: ${data.amount} USDT`)

    // Process as real-time event
    processRealtimeEvent({
      type: 'LOAN_WITHDRAWN',
      contractAddress: contractAddress.value!,
      data: {
        amount: data.amount
      },
      timestamp: data.timestamp,
      blockNumber: BigInt(data.blockNumber)
    })

    // Refresh relevant data
    refetchLoanWithdrawn()
  }

  // Process contract logs for real-time updates
  const processContractLogs = (logs: any[]) => {
    logs.forEach(log => {
      try {
        // Parse log based on event signature
        if (log.eventName === 'Invested') {
          handleInvestedEvent({
            investor: log.args.investor,
            amount: log.args.amount.toString(),
            shares: log.args.shares.toString(),
            timestamp: Date.now(),
            blockNumber: log.blockNumber.toString()
          })
        } else if (log.eventName === 'PrincipalDeposited') {
          handlePrincipalDepositedEvent({
            amount: log.args.amount.toString(),
            totalDistributed: log.args.totalDistributed.toString(),
            timestamp: Date.now(),
            blockNumber: log.blockNumber.toString()
          })
        } else if (log.eventName === 'InterestDeposited') {
          handleInterestDepositedEvent({
            amount: log.args.amount.toString(),
            totalDistributed: log.args.totalDistributed.toString(),
            timestamp: Date.now(),
            blockNumber: log.blockNumber.toString()
          })
        } else if (log.eventName === 'PayoutWithdrawn') {
          handlePayoutWithdrawnEvent({
            investor: log.args.investor,
            principalAmount: log.args.principalAmount.toString(),
            interestAmount: log.args.interestAmount.toString(),
            timestamp: Date.now(),
            blockNumber: log.blockNumber.toString()
          })
        } else if (log.eventName === 'StageChanged') {
          handleStageChangedEvent({
            newStage: Number(log.args.newStage),
            reason: log.args.reason,
            timestamp: Date.now(),
            blockNumber: log.blockNumber.toString()
          })
        } else if (log.eventName === 'LoanWithdrawn') {
          handleLoanWithdrawnEvent({
            amount: log.args.amount.toString(),
            timestamp: Date.now(),
            blockNumber: log.blockNumber.toString()
          })
        }
      } catch (error) {
        console.error('Error processing contract log:', error)
      }
    })
  }

  // Initialize real-time subscriptions when connected
  watch([contractAddress, isConnected], async ([newContractAddress, newIsConnected]) => {
    if (newIsConnected && newContractAddress) {
      console.log('🔄 Initializing real-time subscriptions...')

      // Establish WebSocket connection
      await establishConnection()

      // Set up event subscriptions
      subscribeToContractEvents()

      // Add contract to portfolio tracking
      realtimeStore.addContractToPortfolio(newContractAddress, {
        stage: fundingStageValue.value,
        stageName: getStageName(fundingStageValue.value),
        totalFunded: totalInvestedValue.value.toString(),
        totalInvestors: investorCountValue.value,
        investorCount: investorCountValue.value,
        fundingProgress: fundingProgress.value,
        principalRepaid: principalRepaidValue.value.toString(),
        interestPaid: interestPaidValue.value.toString(),
        totalDistributed: (principalRepaidValue.value + interestPaidValue.value).toString(),
        withdrawablePrincipal: withdrawablePrincipalValue.value.toString(),
        withdrawableInterest: withdrawableInterestValue.value.toString(),
        lastUpdated: Date.now(),
        lastBlockNumber: '0',
        isUpdating: false,
        hasPendingUpdates: false
      })
    }
  }, { immediate: true })

  // Auto-refresh setup
  if (autoRefresh) {
    watch([isConnected, chainId], () => {
      if (isConnected.value) {
        refreshData()
      }
    }, { immediate: true })
  }

  return {
    // State
    isLoading: computed(() => isRefreshing.value || isWritePending.value),
    isRefreshing: computed(() => isRefreshing.value),
    lastRefreshTime: computed(() => lastRefreshTime.value),
    error: computed(() => combinedError.value),
    writeError: computed(() => writeError.value),

    // Connection state
    isConnected: computed(() => isConnected.value),
    address: computed(() => address.value),
    isValidChain: computed(() => isValidChain.value),
    chain: computed(() => chain.value),

    // Contract addresses
    contractAddress: computed(() => contractAddress.value),
    usdtAddress: computed(() => usdtAddress.value),

    // Read contract data
    totalInvested: computed(() => totalInvestedValue.value),
    fundingStage: computed(() => fundingStageValue.value),
    totalShares: computed(() => totalSharesValue.value),
    investorShares: computed(() => investorSharesValue.value),
    investorCount: computed(() => investorCountValue.value),
    repaidPrincipal: computed(() => repaidPrincipalValue.value),
    repaidInterest: computed(() => repaidInterestValue.value),

    // Distribution tracking for Epic 4.1
    principalRepaid: computed(() => principalRepaidValue.value),
    interestPaid: computed(() => interestPaidValue.value),

    usdtBalance: computed(() => usdtBalance.value?.value || 0n),
    usdtAllowance: computed(() => usdtAllowance.value || 0n),
    entitledPrincipal: computed(() => entitledPrincipalValue.value),
    entitledInterest: computed(() => entitledInterestValue.value),
    withdrawablePrincipal: computed(() => withdrawablePrincipalValue.value),
    withdrawableInterest: computed(() => withdrawableInterestValue.value),

    // Computed properties
    formattedTotalInvested,
    formattedUsdtBalance,
    formattedUsdtAllowance,
    fundingProgress,
    userSharePercentage,

    // Gas Optimization State
    selectedSpeed: computed(() => selectedSpeed.value),
    isMonitoring: computed(() => isMonitoring.value),
    networkStatus: computed(() => networkStatus.value),
    GAS_SPEED_OPTIONS: computed(() => GAS_SPEED_OPTIONS),

    // Epic 5.1 Deployment State
    deploymentStatus: computed(() => deploymentStatus.value),
    deploymentForm: computed(() => deploymentForm.value),
    deployedContracts: computed(() => deployedContracts.value),
    deploymentValidationErrors: computed(() => deploymentValidationErrors.value),
    deploymentGasEstimate: computed(() => deploymentGasEstimate.value),

    // Epic 5.2 Loan Operations State
    loanOperationStatus: computed(() => loanOperationStatus.value),
    isProcessingLoanOperation: computed(() => loanOperationStatus.value.status !== 'idle' && loanOperationStatus.value.status !== 'success' && loanOperationStatus.value.status !== 'error'),
    operationSuccessMessage: computed(() => loanOperationStatus.value.status === 'success' ? loanOperationStatus.value.message : ''),
    loanOperationForm: computed(() => loanOperationForm.value),
    repaymentSchedule: computed(() => repaymentSchedule.value),
    recentLoanOperations: computed(() => recentLoanOperations.value),
    loanWithdrawn: computed(() => loanWithdrawnValue.value),
    totalRepaid: computed(() => totalRepaidValue.value),
    remainingPrincipal: computed(() => remainingPrincipalValue.value),
    isLoanFullyRepaid: computed(() => isLoanFullyRepaidValue.value),
    availableForWithdrawal: computed(() => availableForWithdrawalValue.value),

    // Epic 5.3 Stage Management State
    stageManagementStatus: computed(() => stageManagementStatus.value),
    isProcessingStageOperation: computed(() => stageManagementStatus.value.status !== 'idle' && stageManagementStatus.value.status !== 'success' && stageManagementStatus.value.status !== 'error'),
    stageOperationSuccessMessage: computed(() => stageManagementStatus.value.status === 'success' ? stageManagementStatus.value.message : ''),
    stageHistory: computed(() => stageHistory.value),
    availableTransitions: computed(() => availableTransitions.value),
    stageTransitions: computed(() => stageTransitions.value),
    stageManagementForm: computed(() => stageManagementForm.value),
    lastStageChangedBy: computed(() => lastStageChangedByValue.value),
    lastStageChangeTime: computed(() => lastStageChangeTimeValue.value),
    canTransitionStage: computed(() => availableTransitions.value.some(t => t.isAllowed)),

    // Core Contract Functions
    invest,
    withdrawPayout,
    withdrawPayoutAmounts,
    withdrawPrincipal,
    withdrawInterest,
    transferShares,
    approveUSDT,

    // Epic 5.1 Deployment Functions
    deployMortgageContract,
    startContractFunding,
    validateDeploymentParams,
    getDeploymentGasEstimate,
    clearDeploymentForm,
    updateDeploymentFormField,
    isOperator,

    // Epic 5.2 Loan Operations Functions
    withdrawLoan,
    depositPrincipal,
    depositInterest,
    resetLoanOperationStatus: () => {
      loanOperationStatus.value = { status: 'idle' }
    },

    // Epic 5.3 Stage Management Functions
    transitionStage,
    getStageHistory,
    getAvailableStageTransitions,
    getStageDuration,
    validateStageTransition,
    clearStageManagementForm,
    updateStageManagementFormField,
    resetStageManagementStatus: () => {
      stageManagementStatus.value = { status: 'idle' }
    },

    // Marketplace Functions (not implemented)
    createSellOrder,
    cancelSellOrder,
    buySellOrder,

    // Utility Functions
    refreshData,
    getGasEstimate,
    analyzeInvestmentGas,
    switchToSupportedChain,
    ensureValidChain,
    ensureConnected,

    // Gas Analysis Functions
    validateGasCosts,
    analyzeOptimizationOpportunities,
    getOptimalTimingSuggestions,
    analyzePostTransaction,
    getCostBreakdown,

    // Format Functions
    formatAmount: (amount: bigint, decimals: number = MORTGAGE_CONFIG.DECIMALS): string => formatUSDT(amount),
    formatPercentage: (value: number): string => `${value.toFixed(2)}%`,
    formatDate: (timestamp: number): string => new Date(timestamp * 1000).toLocaleDateString(),

    // Event Management
    setupEventListeners: (onInvested?: (investor: string, amount: bigint, shares: bigint) => void): void => {
      try {
        const contractAddress = getMortgageContractAddress()

        // Watch for Invested events
        const { unwatch } = useWatchContractEvent({
          address: contractAddress,
          abi: MORTGAGE_CONTRACT_ABI,
          eventName: 'Invested',
          onLogs: (logs) => {
            logs.forEach(log => {
              if (log.args.investor && log.args.amount && log.args.shares) {
                onInvested?.(log.args.investor, log.args.amount, log.args.shares)
              }
            })
          },
          onError: (error) => {
            console.error('Error watching Invested events:', error)
          }
        })

        // Store unwatch function for cleanup
        eventCleanup = () => {
          unwatch?.()
        }

        console.log('✅ Event listeners setup complete')
        if (onInvested) {
          console.log('✅ Investment event handler registered')
        }
      } catch (error) {
        console.error('❌ Failed to setup event listeners:', error)
      }
    },
    removeEventListeners: (): void => {
      if (eventCleanup) {
        eventCleanup()
        eventCleanup = undefined
        console.log('✅ Event listeners removed')
      }
    },

    // Event emitter for manual event triggering (for testing or WebSocket updates)
    on: (event: string, callback: (...args: any[]) => void) => {
      // This would integrate with a proper event system
      console.log(`Event listener for ${event} registered`)
    },

    // Helper to format block explorer URL
    getBlockExplorerUrl: (txHash: `0x${string}`): string => {
      return `https://etherscan.io/tx/${txHash}`
    },

    // Epic 6.1 Real-time Synchronization
    realtimeConnected: computed(() => realtimeConnected.value),
    connectionStatus: computed(() => connectionStatus.value),
    establishConnection,
    subscribeToContractEvents,
    processContractLogs,
    realtimeStore
  }
}
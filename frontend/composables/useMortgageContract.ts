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

  const withdrawLoan = async (amount: bigint): Promise<`0x${string}`> => {
    try {
      await ensureConnected()
      await ensureValidChain()

      // TODO: Check if user is operator
      // This would require a contract call to check operator role

      const txHash = await writeContractAsync({
        address: contractAddress.value!,
        abi: MORTGAGE_CONTRACT_ABI,
        functionName: 'withdrawLoan',
        args: [amount]
      })

      await refreshData()
      return txHash
    } catch (error) {
      const mortgageError = MortgageError.fromError(error, {
        action: 'withdraw_loan',
        contractAddress: contractAddress.value!,
        functionName: 'withdrawLoan',
        amount: amount.toString()
      })
      handleError(mortgageError)
      throw mortgageError
    }
  }

  const depositPrincipal = async (amount: bigint): Promise<`0x${string}`> => {
    try {
      await ensureConnected()
      await ensureValidChain()

      const txHash = await writeContractAsync({
        address: contractAddress.value!,
        abi: MORTGAGE_CONTRACT_ABI,
        functionName: 'depositPrincipal',
        args: [amount]
      })

      await refreshData()
      return txHash
    } catch (error) {
      const mortgageError = MortgageError.fromError(error, {
        action: 'deposit_principal',
        contractAddress: contractAddress.value!,
        functionName: 'depositPrincipal',
        amount: amount.toString()
      })
      handleError(mortgageError)
      throw mortgageError
    }
  }

  const depositInterest = async (amount: bigint): Promise<`0x${string}`> => {
    try {
      await ensureConnected()
      await ensureValidChain()

      const txHash = await writeContractAsync({
        address: contractAddress.value!,
        abi: MORTGAGE_CONTRACT_ABI,
        functionName: 'depositInterest',
        args: [amount]
      })

      await refreshData()
      return txHash
    } catch (error) {
      const mortgageError = MortgageError.fromError(error, {
        action: 'deposit_interest',
        contractAddress: contractAddress.value!,
        functionName: 'depositInterest',
        amount: amount.toString()
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
        refetchAllowance()
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

    // Core Contract Functions
    invest,
    withdrawPayout,
    withdrawPayoutAmounts,
    withdrawPrincipal,
    withdrawInterest,
    withdrawLoan,
    depositPrincipal,
    depositInterest,
    transferShares,
    approveUSDT,

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
    }
  }
}
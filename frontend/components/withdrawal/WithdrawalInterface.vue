<template>
  <div class="withdrawal-interface space-y-6">
    <!-- Withdrawal Overview -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Withdraw Funds
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <!-- Withdrawable Principal -->
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-blue-600 dark:text-blue-400">Withdrawable Principal</p>
              <p class="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {{ formatAmount(withdrawablePrincipal) }} USDT
              </p>
            </div>
            <div class="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Withdrawable Interest -->
        <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-green-600 dark:text-green-400">Withdrawable Interest</p>
              <p class="text-2xl font-bold text-green-900 dark:text-green-100">
                {{ formatAmount(withdrawableInterest) }} USDT
              </p>
            </div>
            <div class="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Withdrawal Options -->
      <div class="space-y-4">
        <div class="flex flex-wrap gap-3">
          <UButton
            :disabled="withdrawablePrincipal === 0n || isLoading"
            @click="handleQuickWithdrawal('principal')"
            :loading="isWithdrawing"
            icon="i-heroicons-arrow-down-tray"
            variant="outline"
            size="sm"
            class="border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            Withdraw Principal
          </UButton>

          <UButton
            :disabled="withdrawableInterest === 0n || isLoading"
            @click="handleQuickWithdrawal('interest')"
            :loading="isWithdrawing"
            icon="i-heroicons-arrow-down-tray"
            variant="outline"
            size="sm"
            class="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
          >
            Withdraw Interest
          </UButton>

          <UButton
            :disabled="(withdrawablePrincipal === 0n && withdrawableInterest === 0n) || isLoading"
            @click="handleQuickWithdrawal('both')"
            :loading="isWithdrawing"
            icon="i-heroicons-arrow-down-tray"
            variant="solid"
            size="sm"
            class="bg-indigo-600 hover:bg-indigo-700"
          >
            Withdraw Both
          </UButton>
        </div>
      </div>

      <!-- Custom Withdrawal Form -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Custom Withdrawal
        </h3>

        <WithdrawalForm
          :withdrawable-principal="withdrawablePrincipal"
          :withdrawable-interest="withdrawableInterest"
          :is-loading="isLoading"
          :gas-estimate="gasEstimate"
          @withdraw="handleWithdrawal"
          @estimate-gas="handleGasEstimate"
        />
      </div>

      <!-- Recent Withdrawal History -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Recent Withdrawals
        </h3>

        <WithdrawalHistory
          :withdrawals="recentWithdrawals"
          :is-loading="isLoadingHistory"
          @view-details="handleViewDetails"
        />
      </div>
    </div>

    <!-- Withdrawal Confirmation Modal -->
    <WithdrawalConfirmation
      :is-open="showConfirmation"
      :withdrawal-details="pendingWithdrawal"
      :gas-estimate="gasEstimate"
      @confirm="handleConfirmWithdrawal"
      @cancel="handleCancelWithdrawal"
    />

    <!-- Withdrawal Status Modal -->
    <WithdrawalStatus
      :is-open="showStatus"
      :transaction-hash="currentTransactionHash"
      :withdrawal-type="currentWithdrawalType"
      :amount="currentAmount"
      @close="handleCloseStatus"
    />

    <!-- Transaction Details Modal -->
    <WithdrawalDetails
      :is-open="showDetails"
      :withdrawal="selectedWithdrawal"
      @close="handleCloseDetails"
    />

    <!-- Batch Withdrawal Interface -->
    <BatchWithdrawal
      v-if="hasMultipleInvestments"
      :investments="userInvestments"
      :is-loading="isLoading"
      @withdraw-batch="handleBatchWithdrawal"
      @estimate-gas="handleBatchGasEstimate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { zeroAddress } from 'viem'
import { useMortgageContract } from '~/composables/useMortgageContract'
import { useErrorHandler } from '~/composables/useErrorHandler'

// Component imports
import WithdrawalForm from './WithdrawalForm.vue'
import WithdrawalConfirmation from './WithdrawalConfirmation.vue'
import WithdrawalStatus from './WithdrawalStatus.vue'
import WithdrawalHistory from './WithdrawalHistory.vue'
import WithdrawalDetails from './WithdrawalDetails.vue'
import BatchWithdrawal from './BatchWithdrawal.vue'

// Props
interface Props {
  contractAddress?: string
  autoRefresh?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoRefresh: true
})

// Emits
const emit = defineEmits<{
  withdrawalComplete: [hash: string, type: string, amount: bigint]
  withdrawalError: [error: Error]
}>()

// Composables
const {
  isLoading,
  withdrawablePrincipal,
  withdrawableInterest,
  withdrawPrincipal,
  withdrawInterest,
  withdrawPayoutAmounts,
  withdrawPayout,
  formatAmount,
  refreshData
} = useMortgageContract({
  autoRefresh: props.autoRefresh,
  ...(props.contractAddress ? { contractAddress: props.contractAddress as `0x${string}` } : {})
})

const { handleError } = useErrorHandler()

// State
const showConfirmation = ref(false)
const showStatus = ref(false)
const showDetails = ref(false)
const isWithdrawing = ref(false)
const isEstimatingGas = ref(false)
const isLoadingHistory = ref(false)

// Withdrawal state
const pendingWithdrawal = ref<{
  type: 'principal' | 'interest' | 'both' | 'custom'
  principalAmount?: bigint
  interestAmount?: bigint
  timestamp?: number
} | null>(null)

const currentTransactionHash = ref<`0x${string}` | null>(null)
const currentWithdrawalType = ref<'principal' | 'interest' | 'both' | 'custom'>('principal')
const currentAmount = ref(0n)

const gasEstimate = ref<{
  gasLimit: bigint
  gasPrice: bigint
  ethCost: string
  usdCost: string
  isWithinThreshold: boolean
  networkStatus: 'normal' | 'congested' | 'high'
} | null>(null)

// Mock data for demonstration
const recentWithdrawals = ref<any[]>([])
const userInvestments = ref<any[]>([])
const hasMultipleInvestments = computed(() => userInvestments.value.length > 1)

const selectedWithdrawal = ref<any>(null)

// Computed
const totalWithdrawable = computed(() => withdrawablePrincipal.value + withdrawableInterest.value)

// Methods
const handleQuickWithdrawal = async (type: 'principal' | 'interest' | 'both') => {
  try {
    isWithdrawing.value = true

    let txHash: `0x${string}`

    switch (type) {
      case 'principal':
        txHash = await withdrawPayout({ principal: true, interest: false })
        break
      case 'interest':
        txHash = await withdrawPayout({ principal: false, interest: true })
        break
      case 'both':
        txHash = await withdrawPayout({ principal: true, interest: true })
        break
    }

    // Show success status
    currentTransactionHash.value = txHash
    currentWithdrawalType.value = type
    currentAmount.value = type === 'principal'
      ? withdrawablePrincipal.value
      : type === 'interest'
        ? withdrawableInterest.value
        : totalWithdrawable.value

    showStatus.value = true

    // Emit success event
    emit('withdrawalComplete', txHash, type, currentAmount.value)

    // Refresh data
    await refreshData()

  } catch (error) {
    handleError(error as Error)
    emit('withdrawalError', error as Error)
  } finally {
    isWithdrawing.value = false
  }
}

const handleWithdrawal = async (withdrawal: {
  principalAmount: bigint
  interestAmount: bigint
  type: 'custom'
}) => {
  try {
    isWithdrawing.value = true

    const txHash = await withdrawPayoutAmounts(withdrawal.principalAmount, withdrawal.interestAmount)

    // Show success status
    currentTransactionHash.value = txHash
    currentWithdrawalType.value = withdrawal.type
    currentAmount.value = withdrawal.principalAmount + withdrawal.interestAmount

    showStatus.value = true

    // Emit success event
    emit('withdrawalComplete', txHash, 'custom', withdrawal.principalAmount + withdrawal.interestAmount)

    // Refresh data
    await refreshData()

  } catch (error) {
    handleError(error as Error)
    emit('withdrawalError', error as Error)
  } finally {
    isWithdrawing.value = false
  }
}

const handleGasEstimate = async (withdrawal: {
  principalAmount: bigint
  interestAmount: bigint
  type: 'custom'
}) => {
  try {
    isEstimatingGas.value = true

    // Get gas estimate for custom withdrawal
    const estimate = await getGasEstimate('withdrawPayoutAmounts', [withdrawal.principalAmount, withdrawal.interestAmount])

    gasEstimate.value = estimate

  } catch (error) {
    handleError(error as Error)
    gasEstimate.value = null
  } finally {
    isEstimatingGas.value = false
  }
}

const handleConfirmWithdrawal = () => {
  showConfirmation.value = false
  // Handle confirmed withdrawal
}

const handleCancelWithdrawal = () => {
  showConfirmation.value = false
  pendingWithdrawal.value = null
  gasEstimate.value = null
}

const handleCloseStatus = () => {
  showStatus.value = false
  currentTransactionHash.value = null
}

const handleViewDetails = (withdrawal: any) => {
  selectedWithdrawal.value = withdrawal
  showDetails.value = true
}

const handleCloseDetails = () => {
  showDetails.value = false
  selectedWithdrawal.value = null
}

const handleBatchWithdrawal = async (withdrawals: any[]) => {
  try {
    isWithdrawing.value = true

    // Process batch withdrawals
    const results = await Promise.all(
      withdrawals.map(async (withdrawal) => {
        let txHash: `0x${string}`

        if (withdrawal.principalAmount > 0n) {
          txHash = await withdrawPrincipal(withdrawal.principalAmount)
        }

        if (withdrawal.interestAmount > 0n) {
          txHash = await withdrawInterest(withdrawal.interestAmount)
        }

        return {
          contract: withdrawal.contractAddress,
          hash: txHash,
          principalAmount: withdrawal.principalAmount,
          interestAmount: withdrawal.interestAmount
        }
      })
    )

    // Show batch completion status
    console.log('Batch withdrawal completed:', results)

    // Refresh data
    await refreshData()

  } catch (error) {
    handleError(error as Error)
    emit('withdrawalError', error as Error)
  } finally {
    isWithdrawing.value = false
  }
}

const handleBatchGasEstimate = async (withdrawals: any[]) => {
  // Handle batch gas estimation
  console.log('Estimating gas for batch withdrawals:', withdrawals)
}

const getGasEstimate = async (functionName: string, args: any[]): Promise<any> => {
  // Mock gas estimation for now
  return {
    gasLimit: 50000n,
    gasPrice: 2000000000n,
    ethCost: '0.0001',
    usdCost: '0.20',
    isWithinThreshold: true,
    networkStatus: 'normal'
  }
}

// Lifecycle
onMounted(async () => {
  await refreshData()

  // Load mock data
  recentWithdrawals.value = [
    {
      id: '1',
      type: 'principal',
      amount: 1000000n,
      timestamp: Date.now() - 3600000,
      transactionHash: '0x123...abc',
      status: 'completed'
    }
  ]

  userInvestments.value = [
    {
      contractAddress: '0x123...abc',
      withdrawablePrincipal: 5000000n,
      withdrawableInterest: 1000000n,
      contractName: 'Mortgage Contract 1'
    },
    {
      contractAddress: '0x456...def',
      withdrawablePrincipal: 3000000n,
      withdrawableInterest: 500000n,
      contractName: 'Mortgage Contract 2'
    }
  ]
})

onUnmounted(() => {
  // Cleanup
})
</script>
<template>
  <div class="batch-withdrawal space-y-6">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Batch Withdrawal
        </h3>
        <UBadge
          :variant="isExpanded ? 'solid' : 'subtle'"
          class="capitalize"
        >
          {{ investments.length }} Contracts
        </UBadge>
      </div>

      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Withdraw available funds from multiple mortgage contracts in a single operation.
      </p>

      <!-- Expand/Collapse Button -->
      <UButton
        :icon="isExpanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
        variant="outline"
        @click="isExpanded = !isExpanded"
        class="w-full"
      >
        {{ isExpanded ? 'Hide' : 'Show' }} Contract Details
      </UButton>
    </div>

    <!-- Contract Details (Expanded) -->
    <div v-if="isExpanded" class="space-y-4">
      <div
        v-for="investment in investments"
        :key="investment.contractAddress"
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
      >
        <div class="flex items-center justify-between mb-3">
          <div>
            <h4 class="font-medium text-gray-900 dark:text-white">
              {{ investment.contractName }}
            </h4>
            <div class="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>{{ formatAddress(investment.contractAddress) }}</span>
              <UButton
                variant="ghost"
                size="2xs"
                icon="i-heroicons-clipboard-document"
                @click="copyAddress(investment.contractAddress)"
              />
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm font-medium text-gray-900 dark:text-white">
              {{ formatAmount(investment.withdrawablePrincipal + investment.withdrawableInterest) }} USDT
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              Available
            </div>
          </div>
        </div>

        <!-- Withdrawal Options -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Principal
            </label>
            <div class="flex items-center space-x-2">
              <UCheckbox
                :model-value="getWithdrawalSelection(investment.contractAddress, 'principal')"
                :disabled="investment.withdrawablePrincipal === 0n"
                @update:model-value="setWithdrawalSelection(investment.contractAddress, 'principal', $event)"
              />
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {{ formatAmount(investment.withdrawablePrincipal) }} USDT
              </span>
            </div>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Interest
            </label>
            <div class="flex items-center space-x-2">
              <UCheckbox
                :model-value="getWithdrawalSelection(investment.contractAddress, 'interest')"
                :disabled="investment.withdrawableInterest === 0n"
                @update:model-value="setWithdrawalSelection(investment.contractAddress, 'interest', $event)"
              />
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {{ formatAmount(investment.withdrawableInterest) }} USDT
              </span>
            </div>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Total
            </label>
            <div class="text-sm font-medium text-green-600 dark:text-green-400">
              {{ formatAmount(getContractTotal(investment)) }} USDT
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Batch Summary -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h4 class="font-medium text-gray-900 dark:text-white mb-4">Batch Summary</h4>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-blue-600 dark:text-blue-400">Selected Contracts</p>
              <p class="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {{ selectedContractsCount }}
              </p>
            </div>
            <div class="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
              <Icon name="i-heroicons-building-office" class="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-purple-600 dark:text-purple-400">Principal Amount</p>
              <p class="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {{ formatAmount(batchTotalPrincipal) }}
              </p>
            </div>
            <div class="w-10 h-10 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
              <Icon name="i-heroicons-banknotes" class="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-green-600 dark:text-green-400">Interest Amount</p>
              <p class="text-2xl font-bold text-green-900 dark:text-green-100">
                {{ formatAmount(batchTotalInterest) }}
              </p>
            </div>
            <div class="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
              <Icon name="i-heroicons-currency-dollar" class="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      <!-- Total Amount -->
      <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
        <div class="flex justify-between items-center">
          <span class="font-medium text-gray-900 dark:text-white">Total Withdrawal Amount:</span>
          <span class="text-2xl font-bold text-green-600 dark:text-green-400">
            {{ formatAmount(batchTotalAmount) }} USDT
          </span>
        </div>
      </div>

      <!-- Gas Estimate -->
      <div v-if="batchGasEstimate" class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-4">
        <div class="flex items-center justify-between mb-2">
          <h5 class="font-medium text-yellow-900 dark:text-yellow-100">Estimated Gas Costs</h5>
          <UButton
            variant="ghost"
            size="xs"
            @click="refreshBatchGasEstimate"
            :loading="isEstimatingGas"
          >
            Refresh
          </UButton>
        </div>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-yellow-700 dark:text-yellow-300">Total Gas:</span>
            <span class="ml-2 font-medium text-yellow-900 dark:text-yellow-100">
              {{ batchGasEstimate.ethCost }} ETH
            </span>
          </div>
          <div>
            <span class="text-yellow-700 dark:text-yellow-300">USD Cost:</span>
            <span class="ml-2 font-medium text-yellow-900 dark:text-yellow-100">
              ${{ batchGasEstimate.usdCost }}
            </span>
          </div>
          <div>
            <span class="text-yellow-700 dark:text-yellow-300">Est. Time:</span>
            <span class="ml-2 font-medium text-yellow-900 dark:text-yellow-100">
              {{ Math.ceil(batchGasEstimate.estimatedTime / 60) }} min
            </span>
          </div>
          <div>
            <span class="text-yellow-700 dark:text-yellow-300">Network:</span>
            <span class="ml-2 font-medium capitalize" :class="getNetworkStatusColor()">
              {{ batchGasEstimate.networkStatus }}
            </span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex space-x-4">
        <UButton
          :disabled="selectedContractsCount === 0 || isLoading"
          :loading="isLoading"
          @click="handleBatchWithdrawal"
          class="flex-1"
          size="lg"
        >
          Withdraw from {{ selectedContractsCount }} Contract{{ selectedContractsCount !== 1 ? 's' : '' }}
        </UButton>

        <UButton
          variant="outline"
          @click="selectAllContracts"
          :disabled="isLoading"
        >
          Select All
        </UButton>

        <UButton
          variant="outline"
          @click="clearSelection"
          :disabled="isLoading"
        >
          Clear
        </UButton>
      </div>
    </div>

    <!-- Batch Status Modal -->
    <BatchWithdrawalStatus
      :is-open="showBatchStatus"
      :withdrawal-results="batchWithdrawalResults"
      :is-processing="isProcessingBatch"
      @close="showBatchStatus = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useClipboard } from '#imports'
import { formatUSDT } from '~/utils/contract/constants'

// Props
interface Investment {
  contractAddress: string
  contractName: string
  withdrawablePrincipal: bigint
  withdrawableInterest: bigint
}

interface Props {
  investments: Investment[]
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

// Emits
const emit = defineEmits<{
  withdrawBatch: [withdrawals: Investment[]]
  estimateGas: [withdrawals: Investment[]]
}>()

// Composables
const { copy: copyToClipboard } = useClipboard()

// State
const isExpanded = ref(false)
const isProcessingBatch = ref(false)
const isEstimatingGas = ref(false)
const showBatchStatus = ref(false)

const withdrawalSelections = ref<Record<string, { principal: boolean; interest: boolean }>>({})
const batchWithdrawalResults = ref<any[]>([])
const batchGasEstimate = ref<{
  ethCost: string
  usdCost: string
  estimatedTime: number
  networkStatus: 'normal' | 'congested' | 'high'
} | null>(null)

// Computed
const selectedContractsCount = computed(() => {
  return Object.values(withdrawalSelections.value).filter(selections =>
    selections.principal || selections.interest
  ).length
})

const batchTotalPrincipal = computed(() => {
  return props.investments.reduce((total, investment) => {
    const selections = withdrawalSelections.value[investment.contractAddress]
    if (selections?.principal) {
      return total + investment.withdrawablePrincipal
    }
    return total
  }, 0n)
})

const batchTotalInterest = computed(() => {
  return props.investments.reduce((total, investment) => {
    const selections = withdrawalSelections.value[investment.contractAddress]
    if (selections?.interest) {
      return total + investment.withdrawableInterest
    }
    return total
  }, 0n)
})

const batchTotalAmount = computed(() => {
  return batchTotalPrincipal.value + batchTotalInterest.value
})

const selectedWithdrawals = computed(() => {
  return props.investments.filter(investment => {
    const selections = withdrawalSelections.value[investment.contractAddress]
    return selections && (selections.principal || selections.interest)
  })
})

// Methods
const formatAmount = (amount: bigint): string => {
  return formatUSDT(amount)
}

const formatAddress = (address: string): string => {
  if (!address) return '0x000...000'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const getWithdrawalSelection = (contractAddress: string, type: 'principal' | 'interest'): boolean => {
  return withdrawalSelections.value[contractAddress]?.[type] || false
}

const setWithdrawalSelection = (contractAddress: string, type: 'principal' | 'interest', value: boolean) => {
  if (!withdrawalSelections.value[contractAddress]) {
    withdrawalSelections.value[contractAddress] = { principal: false, interest: false }
  }
  withdrawalSelections.value[contractAddress][type] = value
}

const getContractTotal = (investment: Investment): bigint => {
  const selections = withdrawalSelections.value[investment.contractAddress]
  let total = 0n
  if (selections?.principal) total += investment.withdrawablePrincipal
  if (selections?.interest) total += investment.withdrawableInterest
  return total
}

const copyAddress = async (address: string) => {
  try {
    await copyToClipboard(address)
    // Show success notification
  } catch (error) {
    console.error('Failed to copy address:', error)
  }
}

const selectAllContracts = () => {
  props.investments.forEach(investment => {
    const hasPrincipal = investment.withdrawablePrincipal > 0n
    const hasInterest = investment.withdrawableInterest > 0n

    if (hasPrincipal || hasInterest) {
      setWithdrawalSelection(investment.contractAddress, 'principal', hasPrincipal)
      setWithdrawalSelection(investment.contractAddress, 'interest', hasInterest)
    }
  })
}

const clearSelection = () => {
  withdrawalSelections.value = {}
}

const getNetworkStatusColor = (): string => {
  if (!batchGasEstimate.value) return 'text-gray-500'

  switch (batchGasEstimate.value.networkStatus) {
    case 'normal':
      return 'text-green-600 dark:text-green-400'
    case 'congested':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'high':
      return 'text-red-600 dark:text-red-400'
    default:
      return 'text-gray-500'
  }
}

const refreshBatchGasEstimate = async () => {
  if (selectedWithdrawals.value.length === 0) return

  isEstimatingGas.value = true

  try {
    // Mock gas estimation for batch withdrawal
    const baseGas = selectedWithdrawals.value.length * 50000n
    const estimatedTime = selectedWithdrawals.value.length * 30 // 30 seconds per withdrawal

    batchGasEstimate.value = {
      ethCost: formatUSDT(baseGas),
      usdCost: (Number(baseGas) / 1e18 * 2000).toFixed(2), // Mock ETH price
      estimatedTime,
      networkStatus: 'normal'
    }

    emit('estimateGas', selectedWithdrawals.value)
  } catch (error) {
    console.error('Failed to estimate batch gas:', error)
    batchGasEstimate.value = null
  } finally {
    isEstimatingGas.value = false
  }
}

const handleBatchWithdrawal = async () => {
  if (selectedWithdrawals.value.length === 0) return

  isProcessingBatch.value = true
  showBatchStatus.value = true

  try {
    // Process batch withdrawal
    emit('withdrawBatch', selectedWithdrawals.value)

    // Mock results for demonstration
    const results = selectedWithdrawals.value.map((withdrawal, index) => ({
      contract: withdrawal.contractAddress,
      principalAmount: withdrawalSelections.value[withdrawal.contractAddress]?.principal
        ? withdrawal.withdrawablePrincipal
        : 0n,
      interestAmount: withdrawalSelections.value[withdrawal.contractAddress]?.interest
        ? withdrawal.withdrawableInterest
        : 0n,
      status: 'pending',
      transactionHash: null
    }))

    batchWithdrawalResults.value = results

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Update results with success
    batchWithdrawalResults.value = results.map(result => ({
      ...result,
      status: 'completed',
      transactionHash: `0x${Math.random().toString(16).slice(2, 66)}` // Mock hash
    }))

  } catch (error) {
    console.error('Batch withdrawal failed:', error)
    batchWithdrawalResults.value = []
  } finally {
    isProcessingBatch.value = false
  }
}

// Watch for selection changes to update gas estimate
watch(selectedWithdrawals, () => {
  if (selectedWithdrawals.value.length > 0) {
    refreshBatchGasEstimate()
  } else {
    batchGasEstimate.value = null
  }
}, { deep: true })

// Initialize with some default selections if none exist
watch(() => props.investments, (newInvestments) => {
  if (newInvestments.length > 0 && Object.keys(withdrawalSelections.value).length === 0) {
    // Auto-select contracts that have withdrawable amounts
    newInvestments.forEach(investment => {
      if (investment.withdrawablePrincipal > 0n || investment.withdrawableInterest > 0n) {
        setWithdrawalSelection(
          investment.contractAddress,
          'principal',
          investment.withdrawablePrincipal > 0n
        )
        setWithdrawalSelection(
          investment.contractAddress,
          'interest',
          investment.withdrawableInterest > 0n
        )
      }
    })
  }
}, { immediate: true })
</script>
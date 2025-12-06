<template>
  <UModal
    v-model="isOpen"
    :ui="{
      width: 'sm:max-w-2xl',
      padding: 'p-0'
    }"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg">
      <!-- Header -->
      <div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Batch Withdrawal Status
          </h3>
          <UButton
            variant="ghost"
            icon="i-heroicons-x-mark"
            @click="handleClose"
            :disabled="isProcessing"
          />
        </div>
      </div>

      <!-- Body -->
      <div class="px-6 py-6 space-y-6">
        <!-- Progress Overview -->
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <h4 class="font-medium text-blue-900 dark:text-blue-100">Overall Progress</h4>
            <span class="text-sm font-medium text-blue-700 dark:text-blue-300">
              {{ completedWithdrawals }} / {{ withdrawalResults.length }} Completed
            </span>
          </div>
          <div class="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
            <div
              class="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${progressPercentage}%` }"
            ></div>
          </div>
          <div class="mt-2 text-xs text-blue-700 dark:text-blue-300">
            {{ progressPercentage }}% Complete
          </div>
        </div>

        <!-- Processing Status -->
        <div v-if="isProcessing" class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div class="flex items-center space-x-3">
            <Icon name="i-heroicons-cog" class="w-6 h-6 text-yellow-500 animate-spin" />
            <div>
              <h4 class="font-medium text-yellow-800 dark:text-yellow-200">Processing Withdrawals</h4>
              <p class="text-sm text-yellow-700 dark:text-yellow-300">
                Please wait while we process your batch withdrawal. Do not close this window.
              </p>
            </div>
          </div>
        </div>

        <!-- Summary Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
            <Icon name="i-heroicons-check-circle" class="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <div class="text-2xl font-bold text-green-900 dark:text-green-100">
              {{ completedWithdrawals }}
            </div>
            <div class="text-sm text-green-700 dark:text-green-300">Completed</div>
          </div>

          <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
            <Icon name="i-heroicons-clock" class="w-8 h-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
            <div class="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
              {{ pendingWithdrawals }}
            </div>
            <div class="text-sm text-yellow-700 dark:text-yellow-300">Pending</div>
          </div>

          <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
            <Icon name="i-heroicons-currency-dollar" class="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
            <div class="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {{ formatAmount(totalWithdrawnAmount) }}
            </div>
            <div class="text-sm text-purple-700 dark:text-purple-300">Total Withdrawn</div>
          </div>
        </div>

        <!-- Individual Withdrawal Results -->
        <div class="space-y-4">
          <h4 class="font-medium text-gray-900 dark:text-white">Withdrawal Details</h4>

          <div class="space-y-3 max-h-96 overflow-y-auto">
            <div
              v-for="(result, index) in withdrawalResults"
              :key="index"
              class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1 space-y-2">
                  <!-- Contract Info -->
                  <div class="flex items-center space-x-2">
                    <span class="font-medium text-gray-900 dark:text-white">
                      Contract {{ index + 1 }}
                    </span>
                    <UBadge
                      :variant="getStatusVariant(result.status)"
                      size="xs"
                      :class="getStatusColor(result.status)"
                    >
                      {{ getStatusText(result.status) }}
                    </UBadge>
                  </div>

                  <!-- Address -->
                  <div class="text-sm text-gray-600 dark:text-gray-400">
                    {{ formatAddress(result.contract) }}
                  </div>

                  <!-- Amounts -->
                  <div class="flex space-x-4 text-sm">
                    <div v-if="result.principalAmount > 0n">
                      <span class="text-gray-500 dark:text-gray-400">Principal:</span>
                      <span class="ml-1 font-medium text-gray-900 dark:text-white">
                        {{ formatAmount(result.principalAmount) }} USDT
                      </span>
                    </div>
                    <div v-if="result.interestAmount > 0n">
                      <span class="text-gray-500 dark:text-gray-400">Interest:</span>
                      <span class="ml-1 font-medium text-gray-900 dark:text-white">
                        {{ formatAmount(result.interestAmount) }} USDT
                      </span>
                    </div>
                  </div>

                  <!-- Transaction Hash -->
                  <div v-if="result.transactionHash" class="flex items-center space-x-2 text-xs">
                    <Icon name="i-heroicons-link" class="w-3 h-3 text-gray-400" />
                    <span class="font-mono text-gray-600 dark:text-gray-400">
                      {{ formatHash(result.transactionHash) }}
                    </span>
                    <UButton
                      as="a"
                      :href="getExplorerUrl(result.transactionHash)"
                      target="_blank"
                      variant="ghost"
                      size="2xs"
                      icon="i-heroicons-arrow-top-right-on-square"
                      class="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    />
                  </div>

                  <!-- Error Message -->
                  <div v-if="result.error" class="text-xs text-red-600 dark:text-red-400">
                    <Icon name="i-heroicons-exclamation-triangle" class="w-3 h-3 inline mr-1" />
                    {{ result.error }}
                  </div>
                </div>

                <!-- Status Icon -->
                <div class="ml-4">
                  <Icon
                    :name="getStatusIcon(result.status)"
                    class="w-6 h-6"
                    :class="getStatusIconColor(result.status)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Completion Summary -->
        <div v-if="!isProcessing && allCompleted" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div class="flex items-center space-x-3">
            <Icon name="i-heroicons-check-circle" class="w-6 h-6 text-green-600 dark:text-green-400" />
            <div>
              <h4 class="font-medium text-green-800 dark:text-green-200">Batch Withdrawal Complete!</h4>
              <p class="text-sm text-green-700 dark:text-green-300">
                Successfully withdrew {{ formatAmount(totalWithdrawnAmount) }} USDT from {{ completedWithdrawals }} contracts.
              </p>
            </div>
          </div>
        </div>

        <!-- Error Summary -->
        <div v-if="hasErrors" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div class="flex items-center space-x-3">
            <Icon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-red-600 dark:text-red-400" />
            <div>
              <h4 class="font-medium text-red-800 dark:text-red-200">Some Withdrawals Failed</h4>
              <p class="text-sm text-red-700 dark:text-red-300">
                {{ failedWithdrawals }} of {{ withdrawalResults.length }} withdrawals failed. Please check the details above.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <div class="flex space-x-3">
          <UButton
            variant="outline"
            @click="exportResults"
            icon="i-heroicons-arrow-down-tray"
            :disabled="withdrawalResults.length === 0"
          >
            Export Results
          </UButton>

          <UButton
            v-if="hasErrors"
            @click="retryFailedWithdrawals"
            :loading="isRetrying"
            variant="outline"
            icon="i-heroicons-arrow-path"
          >
            Retry Failed ({{ failedWithdrawals }})
          </UButton>

          <UButton
            @click="handleClose"
            :disabled="isProcessing"
            class="flex-1"
          >
            {{ isProcessing ? 'Processing...' : 'Close' }}
          </UButton>
        </div>
      </div>
    </div>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatUSDT } from '~/utils/contract/constants'

// Props
interface WithdrawalResult {
  contract: string
  principalAmount: bigint
  interestAmount: bigint
  status: 'pending' | 'processing' | 'completed' | 'failed'
  transactionHash?: string | null
  error?: string
}

interface Props {
  isOpen: boolean
  withdrawalResults: WithdrawalResult[]
  isProcessing: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  retry: [failedResults: WithdrawalResult[]]
}>()

// State
const isRetrying = ref(false)

// Computed
const isOpen = computed({
  get: () => props.isOpen,
  set: (value) => {
    if (!value && !props.isProcessing) {
      emit('close')
    }
  }
})

const completedWithdrawals = computed(() => {
  return props.withdrawalResults.filter(result => result.status === 'completed').length
})

const pendingWithdrawals = computed(() => {
  return props.withdrawalResults.filter(result => result.status === 'pending' || result.status === 'processing').length
})

const failedWithdrawals = computed(() => {
  return props.withdrawalResults.filter(result => result.status === 'failed').length
})

const totalWithdrawnAmount = computed(() => {
  return props.withdrawalResults
    .filter(result => result.status === 'completed')
    .reduce((total, result) => total + result.principalAmount + result.interestAmount, 0n)
})

const progressPercentage = computed(() => {
  if (props.withdrawalResults.length === 0) return 0
  return Math.round((completedWithdrawals.value / props.withdrawalResults.length) * 100)
})

const allCompleted = computed(() => {
  return props.withdrawalResults.length > 0 && props.withdrawalResults.every(result =>
    result.status === 'completed' || result.status === 'failed'
  )
})

const hasErrors = computed(() => {
  return failedWithdrawals.value > 0
})

// Methods
const formatAmount = (amount: bigint): string => {
  return formatUSDT(amount)
}

const formatAddress = (address: string): string => {
  if (!address) return '0x000...000'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const formatHash = (hash: string): string => {
  if (!hash) return '0x000...000'
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`
}

const getExplorerUrl = (hash: string): string => {
  return `https://etherscan.io/tx/${hash}`
}

const getStatusVariant = (status: string): 'solid' | 'soft' | 'subtle' => {
  switch (status) {
    case 'completed':
      return 'solid'
    case 'processing':
      return 'soft'
    case 'pending':
      return 'subtle'
    case 'failed':
      return 'subtle'
    default:
      return 'subtle'
  }
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'bg-green-500 text-white'
    case 'processing':
      return 'bg-blue-500 text-white'
    case 'pending':
      return 'bg-yellow-500 text-white'
    case 'failed':
      return 'bg-red-500 text-white'
    default:
      return 'bg-gray-500 text-white'
  }
}

const getStatusText = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'Completed'
    case 'processing':
      return 'Processing'
    case 'pending':
      return 'Pending'
    case 'failed':
      return 'Failed'
    default:
      return 'Unknown'
  }
}

const getStatusIcon = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'i-heroicons-check-circle'
    case 'processing':
      return 'i-heroicons-cog'
    case 'pending':
      return 'i-heroicons-clock'
    case 'failed':
      return 'i-heroicons-x-circle'
    default:
      return 'i-heroicons-question-mark-circle'
  }
}

const getStatusIconColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'text-green-600 dark:text-green-400'
    case 'processing':
      return 'text-blue-600 dark:text-blue-400 animate-spin'
    case 'pending':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'failed':
      return 'text-red-600 dark:text-red-400'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
}

const exportResults = () => {
  const exportData = {
    batchId: Date.now(),
    timestamp: new Date().toISOString(),
    totalWithdrawals: props.withdrawalResults.length,
    completedWithdrawals: completedWithdrawals.value,
    failedWithdrawals: failedWithdrawals.value,
    totalAmount: formatAmount(totalWithdrawnAmount.value),
    withdrawalResults: props.withdrawalResults.map(result => ({
      contract: result.contract,
      principalAmount: formatAmount(result.principalAmount),
      interestAmount: formatAmount(result.interestAmount),
      status: result.status,
      transactionHash: result.transactionHash,
      error: result.error
    }))
  }

  const dataStr = JSON.stringify(exportData, null, 2)
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)

  const exportFileDefaultName = `batch-withdrawal-${Date.now()}.json`

  const linkElement = document.createElement('a')
  linkElement.setAttribute('href', dataUri)
  linkElement.setAttribute('download', exportFileDefaultName)
  linkElement.click()
}

const retryFailedWithdrawals = async () => {
  const failedResults = props.withdrawalResults.filter(result => result.status === 'failed')

  if (failedResults.length === 0) return

  isRetrying.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate retry
    emit('retry', failedResults)
  } catch (error) {
    console.error('Failed to retry withdrawals:', error)
  } finally {
    isRetrying.value = false
  }
}

const handleClose = () => {
  if (!props.isProcessing) {
    emit('close')
  }
}
</script>
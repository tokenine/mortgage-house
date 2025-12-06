<template>
  <UModal
    v-model="isOpen"
    :ui="{
      width: 'sm:max-w-md',
      padding: 'p-0'
    }"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg">
      <!-- Header -->
      <div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Withdrawal Status
          </h3>
          <UButton
            variant="ghost"
            icon="i-heroicons-x-mark"
            @click="handleClose"
          />
        </div>
      </div>

      <!-- Body -->
      <div class="px-6 py-6 space-y-4">
        <!-- Success Animation -->
        <div class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
            <Icon name="i-heroicons-check-circle" class="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Withdrawal Successful!
          </h4>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Your withdrawal has been processed successfully.
          </p>
        </div>

        <!-- Transaction Details -->
        <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
          <h5 class="font-medium text-gray-900 dark:text-white">Transaction Details</h5>

          <div class="flex justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Amount:</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ formatAmount(amount) }} USDT
            </span>
          </div>

          <div class="flex justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Type:</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white capitalize">
              {{ formatWithdrawalType(withdrawalType) }}
            </span>
          </div>

          <div v-if="timestamp" class="flex justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Time:</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ formatTimestamp(timestamp) }}
            </span>
          </div>
        </div>

        <!-- Transaction Hash -->
        <div v-if="transactionHash" class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <h5 class="font-medium text-blue-900 dark:text-blue-100">Transaction Hash</h5>
            <UButton
              variant="ghost"
              size="xs"
              icon="i-heroicons-clipboard-document"
              @click="copyTransactionHash"
            />
          </div>
          <div class="flex items-center space-x-2">
            <div class="flex-1 bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-800 rounded px-3 py-2">
              <span class="text-sm font-mono text-blue-900 dark:text-blue-100">
                {{ formatHash(transactionHash) }}
              </span>
            </div>
            <UButton
              as="a"
              :href="getExplorerUrl(transactionHash)"
              target="_blank"
              variant="ghost"
              size="xs"
              icon="i-heroicons-arrow-top-right-on-square"
              class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View
            </UButton>
          </div>
        </div>

        <!-- Confirmation Count -->
        <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <div class="flex items-center space-x-2">
            <Icon name="i-heroicons-cog" class="w-5 h-5 text-yellow-500 animate-spin" />
            <span class="text-sm text-yellow-800 dark:text-yellow-200">
              Waiting for confirmations...
            </span>
          </div>
          <div class="mt-2">
            <div class="flex justify-between text-xs text-yellow-700 dark:text-yellow-300 mb-1">
              <span>Confirmations: {{ confirmations }}/12</span>
              <span>{{ confirmationsPercentage }}%</span>
            </div>
            <div class="w-full bg-yellow-200 dark:bg-yellow-800 rounded-full h-2">
              <div
                class="bg-yellow-600 dark:bg-yellow-400 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${confirmationsPercentage}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Next Steps -->
        <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <h5 class="font-medium text-gray-900 dark:text-white mb-2">Next Steps</h5>
          <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li class="flex items-start">
              <Icon name="i-heroicons-check" class="w-4 h-4 text-green-500 mr-2 mt-0.5" />
              Funds will appear in your wallet shortly
            </li>
            <li class="flex items-start">
              <Icon name="i-heroicons-check" class="w-4 h-4 text-green-500 mr-2 mt-0.5" />
              Your portfolio will be updated automatically
            </li>
            <li class="flex items-start">
              <Icon name="i-heroicons-check" class="w-4 h-4 text-green-500 mr-2 mt-0.5" />
              You can track the transaction on the blockchain
            </li>
          </ul>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex space-x-3">
        <UButton
          variant="outline"
          @click="handleViewDetails"
          class="flex-1"
        >
          View Details
        </UButton>

        <UButton
          @click="handleClose"
          class="flex-1"
        >
          Done
        </UButton>
      </div>
    </div>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useClipboard } from '#imports'
import { formatUSDT } from '~/utils/contract/constants'

// Props
interface Props {
  isOpen: boolean
  transactionHash?: string | null
  withdrawalType?: 'principal' | 'interest' | 'both' | 'custom'
  amount?: bigint
  timestamp?: number
}

const props = withDefaults(defineProps<Props>(), {
  transactionHash: null,
  withdrawalType: 'principal',
  amount: 0n,
  timestamp: undefined
})

// Emits
const emit = defineEmits<{
  close: []
  viewDetails: [hash: string]
}>()

// Composables
const { copy: copyToClipboard } = useClipboard()

// State
const confirmations = ref(0)
const maxConfirmations = 12
let confirmationInterval: NodeJS.Timeout | null = null

// Computed
const isOpen = computed({
  get: () => props.isOpen,
  set: (value) => {
    if (!value) {
      emit('close')
    }
  }
})

const confirmationsPercentage = computed(() => {
  return Math.round((confirmations.value / maxConfirmations) * 100)
})

// Methods
const formatAmount = (amount: bigint): string => {
  return formatUSDT(amount)
}

const formatWithdrawalType = (type: string): string => {
  switch (type) {
    case 'principal':
      return 'Principal Withdrawal'
    case 'interest':
      return 'Interest Withdrawal'
    case 'both':
      return 'Principal + Interest Withdrawal'
    case 'custom':
      return 'Custom Withdrawal'
    default:
      return 'Withdrawal'
  }
}

const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString()
}

const formatHash = (hash: string): string => {
  if (!hash) return '0x000...000'
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`
}

const getExplorerUrl = (hash: string): string => {
  // This should be configurable based on the network
  return `https://etherscan.io/tx/${hash}`
}

const copyTransactionHash = async () => {
  try {
    if (props.transactionHash) {
      await copyToClipboard(props.transactionHash)
      // Show success notification
    }
  } catch (error) {
    console.error('Failed to copy transaction hash:', error)
  }
}

const simulateConfirmations = () => {
  confirmationInterval = setInterval(() => {
    if (confirmations.value < maxConfirmations) {
      confirmations.value++
    } else {
      if (confirmationInterval) {
        clearInterval(confirmationInterval)
        confirmationInterval = null
      }
    }
  }, 2000) // Simulate confirmation every 2 seconds
}

const handleClose = () => {
  emit('close')
}

const handleViewDetails = () => {
  if (props.transactionHash) {
    emit('viewDetails', props.transactionHash)
  }
}

// Lifecycle
onMounted(() => {
  if (props.transactionHash) {
    simulateConfirmations()
  }
})

onUnmounted(() => {
  if (confirmationInterval) {
    clearInterval(confirmationInterval)
  }
})

// Watch for transaction hash changes
watch(() => props.transactionHash, (newHash) => {
  if (newHash) {
    confirmations.value = 0
    simulateConfirmations()
  }
})
</script>
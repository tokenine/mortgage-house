<template>
  <div class="transaction-row hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
    <div class="px-6 py-4">
      <div class="flex items-center justify-between">
        <!-- Left side: Type, Amount, Date -->
        <div class="flex items-center space-x-4 flex-1">
          <!-- Transaction Type Icon -->
          <div class="flex-shrink-0">
            <div class="w-10 h-10 rounded-full flex items-center justify-center" :class="getTransactionTypeBgColor()">
              <Icon
                :name="getTransactionTypeIcon(transaction.type)"
                class="w-5 h-5"
                :class="getTransactionTypeColor(transaction.type)"
              />
            </div>
          </div>

          <!-- Transaction Details -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2">
              <h4 class="text-sm font-medium text-gray-900 dark:text-white truncate">
                {{ formatTransactionType(transaction.type) }}
              </h4>
              <UBadge
                :variant="getStatusVariant(transaction.status)"
                size="xs"
                :class="getStatusColor(transaction.status)"
              >
                {{ getStatusText(transaction.status) }}
              </UBadge>
            </div>

            <div class="flex items-center space-x-4 mt-1">
              <!-- Amount -->
              <div class="text-sm">
                <span :class="getAmountColorClass()">
                  {{ formatAmount(transaction.amount) }} USDT
                </span>
              </div>

              <!-- Date -->
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatDate(transaction.timestamp) }}
              </div>

              <!-- Contract -->
              <div class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                {{ transaction.contractTitle || formatAddress(transaction.contractAddress) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Right side: Actions -->
        <div class="flex items-center space-x-2 flex-shrink-0">
          <!-- Gas Cost -->
          <div v-if="transaction.gasCost" class="text-right text-xs">
            <div class="text-gray-500 dark:text-gray-400">
              Gas: {{ transaction.gasCost.ethCost }} ETH
            </div>
            <div class="text-gray-400 dark:text-gray-500">
              ${{ transaction.gasCost.usdCost }}
            </div>
          </div>

          <!-- Confirmations -->
          <div v-if="transaction.status === 'confirmed'" class="text-right text-xs">
            <div class="text-green-600 dark:text-green-400">
              {{ formatConfirmations(transaction.confirmations || 0) }}
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center space-x-1">
            <UButton
              variant="ghost"
              size="xs"
              icon="i-heroicons-eye"
              @click="$emit('view-details', transaction)"
            />

            <UButton
              as="a"
              :href="getExplorerUrl(transaction.transactionHash)"
              target="_blank"
              variant="ghost"
              size="xs"
              icon="i-heroicons-arrow-top-right-on-square"
              @click="$emit('view-on-explorer', transaction)"
            />
          </div>
        </div>
      </div>

      <!-- Additional Details (expandable) -->
      <div v-if="showDetails" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <!-- Transaction Hash -->
          <div>
            <span class="text-gray-500 dark:text-gray-400">Transaction Hash:</span>
            <div class="flex items-center space-x-2 mt-1">
              <code class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-mono text-gray-800 dark:text-gray-200">
                {{ transaction.transactionHash }}
              </code>
              <UButton
                variant="ghost"
                size="2xs"
                icon="i-heroicons-clipboard-document"
                @click="copyTransactionHash"
              />
            </div>
          </div>

          <!-- Block Number -->
          <div>
            <span class="text-gray-500 dark:text-gray-400">Block Number:</span>
            <div class="font-medium text-gray-900 dark:text-white">
              {{ transaction.blockNumber.toLocaleString() }}
            </div>
          </div>

          <!-- Contract Address -->
          <div>
            <span class="text-gray-500 dark:text-gray-400">Contract Address:</span>
            <div class="flex items-center space-x-2 mt-1">
              <code class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-mono text-gray-800 dark:text-gray-200">
                {{ transaction.contractAddress }}
              </code>
              <UButton
                variant="ghost"
                size="2xs"
                icon="i-heroicons-clipboard-document"
                @click="copyContractAddress"
              />
            </div>
          </div>

          <!-- Gas Information -->
          <div v-if="transaction.gasCost">
            <span class="text-gray-500 dark:text-gray-400">Gas Information:</span>
            <div class="space-y-1">
              <div class="flex justify-between">
                <span>Gas Used:</span>
                <span class="font-medium">{{ transaction.gasUsed || 'N/A' }}</span>
              </div>
              <div class="flex justify-between">
                <span>Gas Cost:</span>
                <span class="font-medium">{{ transaction.gasCost.ethCost }} ETH (${{ transaction.gasCost.usdCost }})</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Related Events -->
        <div v-if="transaction.relatedEvents && transaction.relatedEvents.length > 0" class="mt-4">
          <span class="text-gray-500 dark:text-gray-400 text-sm">Related Events:</span>
          <div class="mt-2 space-y-2">
            <div
              v-for="(event, index) in transaction.relatedEvents"
              :key="index"
              class="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded p-3 text-sm"
            >
              <div class="flex justify-between items-start">
                <div>
                  <span class="font-medium text-gray-900 dark:text-white">{{ event.name }}</span>
                  <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {{ formatEventArgs(event.args) }}
                  </div>
                </div>
                <UBadge size="xs" variant="subtle">
                  {{ formatTimestamp(event.timestamp) }}
                </UBadge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Expand/Collapse Button -->
    <div class="px-6 pb-2">
      <UButton
        variant="ghost"
        size="xs"
        :icon="showDetails ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
        @click="showDetails = !showDetails"
        class="w-full justify-center"
      >
        {{ showDetails ? 'Hide' : 'Show' }} Details
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useClipboard } from '@vueuse/core'
import { formatUSDT } from '~/utils/contract/constants'
import {
  type Transaction,
  formatTransactionType,
  getTransactionTypeIcon,
  getTransactionTypeColor,
  getTransactionTypeBgColor,
  getStatusColor,
  getStatusBgColor
} from '~/types/transactions'

// Props
interface Props {
  transaction: Transaction
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  viewDetails: [transaction: Transaction]
  viewOnExplorer: [transaction: Transaction]
}>()

// Composables
const { copy: copyToClipboard } = useClipboard()

// State
const showDetails = ref(false)

// Methods
const formatAmount = (amount: string): string => {
  return amount // Already formatted in the transaction type
}

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}

const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString()
}

const formatAddress = (address: string): string => {
  if (!address) return '0x000...000'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const formatConfirmations = (confirmations: number): string => {
  if (confirmations >= 1000) return `${(confirmations / 1000).toFixed(1)}k+`
  if (confirmations >= 100) return `${(confirmations / 100).toFixed(1)}00+`
  return `${confirmations}+`
}

const formatEventArgs = (args: Record<string, any>): string => {
  return Object.entries(args)
    .filter(([key]) => key !== 'event' && key !== 'args')
    .map(([key, value]) => {
      if (typeof value === 'bigint') return formatUSDT(value)
      if (typeof value === 'object' && value !== null) return JSON.stringify(value)
      if (typeof value === 'string' && value.length > 10) {
        return `${value.slice(0, 6)}...${value.slice(-4)}`
      }
      return String(value)
    })
    .join(', ')
}

const getAmountColorClass = (): string => {
  if (props.transaction.type === 'invest') {
    return 'text-green-600 dark:text-green-400 font-medium'
  } else if (props.transaction.type.startsWith('withdraw')) {
    return 'text-blue-600 dark:text-blue-400 font-medium'
  } else {
    return 'text-gray-900 dark:text-white font-medium'
  }
}

const getTransactionTypeBgColor = (): string => {
  if (props.transaction.type === 'invest') {
    return 'bg-green-100 dark:bg-green-900/20'
  } else if (props.transaction.type.startsWith('withdraw')) {
    return 'bg-blue-100 dark:bg-blue-900/20'
  } else {
    return 'bg-gray-100 dark:bg-gray-700'
  }
}

const getStatusVariant = (status: string): 'solid' | 'soft' | 'subtle' => {
  switch (status) {
    case 'confirmed':
      return 'solid'
    case 'pending':
      return 'soft'
    case 'failed':
      return 'subtle'
    default:
      return 'soft'
  }
}

const getStatusText = (status: string): string => {
  switch (status) {
    case 'confirmed':
      return 'Confirmed'
    case 'pending':
      return 'Pending'
    case 'failed':
      return 'Failed'
    default:
      return 'Unknown'
  }
}

const getExplorerUrl = (hash: string): string => {
  return `https://etherscan.io/tx/${hash}`
}

const copyTransactionHash = async () => {
  try {
    await copyToClipboard(props.transaction.transactionHash)
    // Show success notification
  } catch (error) {
    console.error('Failed to copy transaction hash:', error)
  }
}

const copyContractAddress = async () => {
  try {
    await copyToClipboard(props.transaction.contractAddress)
    // Show success notification
  } catch (error) {
    console.error('Failed to copy contract address:', error)
  }
}
</script>

<style scoped>
.transaction-row {
  @apply transition-all duration-200;
}

.transaction-row:hover {
  @apply shadow-sm;
}
</style>
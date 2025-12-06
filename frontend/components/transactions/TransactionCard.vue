<template>
  <div class="transaction-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
    <!-- Card Header -->
    <div class="flex items-center justify-between mb-3">
      <!-- Transaction Type -->
      <div class="flex items-center space-x-2">
        <div class="w-8 h-8 rounded-full flex items-center justify-center" :class="getTransactionTypeBgColor()">
          <Icon
            :name="getTransactionTypeIcon(transaction.type)"
            class="w-4 h-4"
            :class="getTransactionTypeColor(transaction.type)"
          />
        </div>
        <UBadge
          :variant="getStatusVariant(transaction.status)"
          size="xs"
          :class="getStatusColor(transaction.status)"
        >
          {{ getStatusText(transaction.status) }}
        </UBadge>
      </div>

      <!-- Actions -->
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

    <!-- Transaction Details -->
    <div class="space-y-2">
      <!-- Type and Amount -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 dark:text-white">
          {{ formatTransactionType(transaction.type) }}
        </h4>
        <p class="text-lg font-bold" :class="getAmountColorClass()">
          {{ formatAmount(transaction.amount) }} USDT
        </p>
      </div>

      <!-- Metadata -->
      <div class="space-y-1 text-xs text-gray-500 dark:text-gray-400">
        <div class="flex items-center justify-between">
          <span>Date:</span>
          <span>{{ formatDate(transaction.timestamp) }}</span>
        </div>

        <div class="flex items-center justify-between">
          <span>Contract:</span>
          <span class="truncate max-w-[120px]" :title="transaction.contractTitle || transaction.contractAddress">
            {{ transaction.contractTitle || formatAddress(transaction.contractAddress) }}
          </span>
        </div>

        <div v-if="transaction.gasCost" class="flex items-center justify-between">
          <span>Gas:</span>
          <span>{{ transaction.gasCost.ethCost }} ETH</span>
        </div>

        <div v-if="transaction.status === 'confirmed'" class="flex items-center justify-between">
          <span>Confirmations:</span>
          <span class="text-green-600 dark:text-green-400">
            {{ formatConfirmations(transaction.confirmations || 0) }}
          </span>
        </div>
      </div>

      <!-- Transaction Hash Preview -->
      <div class="pt-2 border-t border-gray-100 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500 dark:text-gray-400">Hash:</span>
          <div class="flex items-center space-x-1">
            <code class="text-xs font-mono text-gray-600 dark:text-gray-400">
              {{ formatHash(transaction.transactionHash) }}
            </code>
            <UButton
              variant="ghost"
              size="2xs"
              icon="i-heroicons-clipboard-document"
              @click="copyTransactionHash"
            />
          </div>
        </div>
      </div>

      <!-- Related Events Preview -->
      <div v-if="transaction.relatedEvents && transaction.relatedEvents.length > 0" class="pt-2 border-t border-gray-100 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500 dark:text-gray-400">Events:</span>
          <UBadge size="2xs" variant="subtle">
            {{ transaction.relatedEvents.length }}
          </UBadge>
        </div>
        <div class="mt-1 max-h-16 overflow-y-auto">
          <div
            v-for="(event, index) in transaction.relatedEvents.slice(0, 2)"
            :key="index"
            class="text-xs bg-gray-50 dark:bg-gray-700/50 rounded px-2 py-1 mb-1"
          >
            <span class="font-medium text-gray-700 dark:text-gray-300">{{ event.name }}</span>
          </div>
          <div v-if="transaction.relatedEvents.length > 2" class="text-xs text-gray-500 dark:text-gray-400 text-center">
            +{{ transaction.relatedEvents.length - 2 }} more
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useClipboard } from '#imports'
import {
  type Transaction,
  formatTransactionType,
  getTransactionTypeIcon,
  getTransactionTypeColor,
  getStatusColor
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

const formatAddress = (address: string): string => {
  if (!address) return '0x000...000'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const formatHash = (hash: string): string => {
  if (!hash) return '0x000...000'
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`
}

const formatConfirmations = (confirmations: number): string => {
  if (confirmations >= 1000) return `${(confirmations / 1000).toFixed(1)}k+`
  if (confirmations >= 100) return `${(confirmations / 100).toFixed(1)}00+`
  return `${confirmations}+`
}

const getAmountColorClass = (): string => {
  if (props.transaction.type === 'invest') {
    return 'text-green-600 dark:text-green-400'
  } else if (props.transaction.type.startsWith('withdraw')) {
    return 'text-blue-600 dark:text-blue-400'
  } else {
    return 'text-gray-900 dark:text-white'
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
</script>

<style scoped>
.transaction-card {
  @apply transition-all duration-200 hover:scale-[1.02];
}
</style>
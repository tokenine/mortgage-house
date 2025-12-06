<template>
  <div class="withdrawal-history space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h4 class="font-medium text-gray-900 dark:text-white">
        Recent Withdrawals
      </h4>
      <UButton
        variant="ghost"
        size="xs"
        icon="i-heroicons-arrow-path"
        @click="refreshHistory"
        :loading="isLoading"
      >
        Refresh
      </UButton>
    </div>

    <!-- Withdrawal List -->
    <div v-if="isLoading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 animate-pulse">
        <div class="flex justify-between items-center">
          <div class="space-y-2">
            <div class="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
          </div>
          <div class="h-6 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="withdrawals.length === 0" class="text-center py-8">
      <div class="inline-flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
        <Icon name="i-heroicons-inbox" class="w-6 h-6 text-gray-400" />
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        No withdrawal history available
      </p>
    </div>

    <!-- Withdrawal Items -->
    <div v-else class="space-y-3">
      <div
        v-for="withdrawal in withdrawals"
        :key="withdrawal.id"
        class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
        @click="$emit('view-details', withdrawal)"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1 space-y-1">
            <!-- Amount and Type -->
            <div class="flex items-center space-x-2">
              <span class="font-medium text-gray-900 dark:text-white">
                {{ formatAmount(withdrawal.amount) }} USDT
              </span>
              <UBadge
                :variant="getWithdrawalTypeBadgeVariant(withdrawal.type)"
                size="xs"
                class="capitalize"
              >
                {{ withdrawal.type }}
              </UBadge>
            </div>

            <!-- Timestamp -->
            <div class="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
              <Icon name="i-heroicons-clock" class="w-3 h-3" />
              <span>{{ formatTimestamp(withdrawal.timestamp) }}</span>
            </div>

            <!-- Transaction Hash -->
            <div v-if="withdrawal.transactionHash" class="flex items-center space-x-1 text-xs">
              <Icon name="i-heroicons-link" class="w-3 h-3 text-gray-400" />
              <span class="font-mono text-gray-600 dark:text-gray-400">
                {{ formatHash(withdrawal.transactionHash) }}
              </span>
              <UButton
                as="a"
                :href="getExplorerUrl(withdrawal.transactionHash)"
                target="_blank"
                variant="ghost"
                size="xs"
                icon="i-heroicons-arrow-top-right-on-square"
                class="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                @click.stop
              />
            </div>
          </div>

          <!-- Status and Actions -->
          <div class="flex flex-col items-end space-y-2">
            <!-- Status -->
            <div class="flex items-center space-x-1">
              <div
                class="w-2 h-2 rounded-full"
                :class="getStatusColor(withdrawal.status)"
              ></div>
              <span class="text-xs font-medium" :class="getStatusTextColor(withdrawal.status)">
                {{ getStatusText(withdrawal.status) }}
              </span>
            </div>

            <!-- View Details Button -->
            <UButton
              variant="ghost"
              size="xs"
              icon="i-heroicons-eye"
              @click.stop="$emit('view-details', withdrawal)"
            >
              Details
            </UButton>
          </div>
        </div>

        <!-- Gas Information -->
        <div v-if="withdrawal.gasCost" class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-600">
          <div class="flex justify-between text-xs">
            <span class="text-gray-500 dark:text-gray-400">Gas Cost:</span>
            <span class="text-gray-600 dark:text-gray-300">
              {{ withdrawal.gasCost.ethCost }} ETH (${{ withdrawal.gasCost.usdCost }})
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Load More -->
    <div v-if="hasMoreWithdrawals" class="text-center pt-4">
      <UButton
        variant="outline"
        size="sm"
        @click="loadMore"
        :loading="isLoadingMore"
      >
        Load More
      </UButton>
    </div>

    <!-- View All History -->
    <div class="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
      <UButton
        variant="ghost"
        size="sm"
        icon="i-heroicons-arrow-right"
        trailing
        @click="$emit('view-all-history')"
      >
        View Complete History
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatUSDT } from '~/utils/contract/constants'

// Props
interface WithdrawalRecord {
  id: string
  type: 'principal' | 'interest' | 'both' | 'custom'
  amount: bigint
  timestamp: number
  transactionHash?: string
  status: 'pending' | 'confirmed' | 'failed'
  gasCost?: {
    ethCost: string
    usdCost: string
  }
}

interface Props {
  withdrawals: WithdrawalRecord[]
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

// Emits
const emit = defineEmits<{
  viewDetails: [withdrawal: WithdrawalRecord]
  viewAllHistory: []
}>()

// State
const isLoadingMore = ref(false)
const hasMoreWithdrawals = ref(true) // Mock state - should come from API

// Methods
const formatAmount = (amount: bigint): string => {
  return formatUSDT(amount)
}

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

  return date.toLocaleDateString()
}

const formatHash = (hash: string): string => {
  if (!hash) return '0x000...000'
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`
}

const getExplorerUrl = (hash: string): string => {
  // This should be configurable based on the network
  return `https://etherscan.io/tx/${hash}`
}

const getWithdrawalTypeBadgeVariant = (type: string): 'solid' | 'soft' => {
  switch (type) {
    case 'principal':
      return 'solid'
    case 'interest':
      return 'soft'
    case 'both':
      return 'solid'
    case 'custom':
      return 'soft'
    default:
      return 'soft'
  }
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-400'
    case 'confirmed':
      return 'bg-green-400'
    case 'failed':
      return 'bg-red-400'
    default:
      return 'bg-gray-400'
  }
}

const getStatusTextColor = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'confirmed':
      return 'text-green-600 dark:text-green-400'
    case 'failed':
      return 'text-red-600 dark:text-red-400'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
}

const getStatusText = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'Pending'
    case 'confirmed':
      return 'Confirmed'
    case 'failed':
      return 'Failed'
    default:
      return 'Unknown'
  }
}

const refreshHistory = async () => {
  // Emit event or call parent method to refresh
  console.log('Refreshing withdrawal history...')
}

const loadMore = async () => {
  isLoadingMore.value = true

  try {
    // Simulate loading more withdrawals
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Update hasMoreWithdrawals state
    hasMoreWithdrawals.value = false
  } catch (error) {
    console.error('Failed to load more withdrawals:', error)
  } finally {
    isLoadingMore.value = false
  }
}
</script>
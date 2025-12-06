<template>
  <div class="transaction-history">
    <div class="history-header mb-4">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        Transaction History
      </h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        Your recent earnings and withdrawals
      </p>
    </div>

    <!-- Filter Tabs -->
    <div class="filter-tabs flex space-x-1 mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
      <button
        v-for="tab in filterTabs"
        :key="tab.key"
        @click="activeFilter = tab.key"
        :class="[
          'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200',
          activeFilter === tab.key
            ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Transaction List -->
    <div class="transactions-container">
      <div v-if="filteredTransactions.length === 0" class="empty-state text-center py-8">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No transactions</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ getEmptyStateMessage() }}
        </p>
      </div>

      <div v-else class="transactions-list space-y-2">
        <div
          v-for="transaction in paginatedTransactions"
          :key="transaction.id"
          class="transaction-item bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
        >
          <div class="flex items-center justify-between">
            <!-- Transaction Details -->
            <div class="transaction-details flex-1">
              <div class="flex items-center space-x-3">
                <!-- Transaction Icon -->
                <div :class="getTransactionIconClass(transaction.type)">
                  <component :is="getTransactionIcon(transaction.type)" class="w-5 h-5" />
                </div>

                <!-- Transaction Info -->
                <div>
                  <div class="flex items-center space-x-2">
                    <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ getTransactionTitle(transaction) }}
                    </h4>
                    <span :class="getTransactionTypeBadgeClass(transaction.type)">
                      {{ getTransactionTypeLabel(transaction.type) }}
                    </span>
                  </div>

                  <div class="flex items-center space-x-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>{{ formatDate(transaction.timestamp) }}</span>
                    <span>{{ formatTime(transaction.timestamp) }}</span>
                    <a
                      :href="getExplorerUrl(transaction.transactionHash)"
                      target="_blank"
                      class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View on Etherscan
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <!-- Transaction Amount -->
            <div class="transaction-amount text-right">
              <div class="text-lg font-semibold" :class="getAmountColorClass(transaction.type)">
                {{ getTransactionAmount(transaction) }}
              </div>

              <!-- Breakdown for combined transactions -->
              <div v-if="transaction.type === 'withdrawal' && transaction.principalAmount && transaction.interestAmount" class="text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-1">
                <div>P: {{ formatUSDT(transaction.principalAmount) }}</div>
                <div>I: {{ formatUSDT(transaction.interestAmount) }}</div>
              </div>
            </div>
          </div>

          <!-- Transaction Status -->
          <div v-if="transaction.status" class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div class="flex items-center space-x-2">
              <div :class="getStatusIconClass(transaction.status)">
                <component :is="getStatusIcon(transaction.status)" class="w-4 h-4" />
              </div>
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {{ getStatusText(transaction.status) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="filteredTransactions.length > itemsPerPage" class="pagination mt-6">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            Showing {{ startIndex + 1 }} to {{ Math.min(endIndex, filteredTransactions.length) }} of {{ filteredTransactions.length }} transactions
          </div>

          <div class="flex space-x-2">
            <button
              @click="previousPage"
              :disabled="currentPage === 1"
              class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Previous
            </button>

            <button
              @click="nextPage"
              :disabled="currentPage === totalPages"
              class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Load More Button (Alternative to pagination) -->
    <div v-if="showLoadMore && filteredTransactions.length > itemsPerPage" class="load-more mt-4 text-center">
      <button
        @click="loadMore"
        class="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
      >
        Load More Transactions
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatUSDT } from '~/utils/contract/constants'
import type { EarningsEvent } from '~/composables/usePortfolio'

interface Props {
  transactions: EarningsEvent[]
}

const props = defineProps<Props>()

// State
const activeFilter = ref('all')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const showLoadMore = ref(false)

// Filter tabs
const filterTabs = [
  { key: 'all', label: 'All' },
  { key: 'earnings', label: 'Earnings' },
  { key: 'withdrawals', label: 'Withdrawals' }
]

// Computed properties
const filteredTransactions = computed(() => {
  let filtered = props.transactions

  switch (activeFilter.value) {
    case 'earnings':
      filtered = filtered.filter(tx => tx.type === 'principal_deposited' || tx.type === 'interest_deposited')
      break
    case 'withdrawals':
      filtered = filtered.filter(tx => tx.type === 'withdrawal')
      break
  }

  return filtered.sort((a, b) => b.timestamp - a.timestamp)
})

const totalPages = computed(() => {
  return Math.ceil(filteredTransactions.value.length / itemsPerPage.value)
})

const startIndex = computed(() => {
  return (currentPage.value - 1) * itemsPerPage.value
})

const endIndex = computed(() => {
  return startIndex.value + itemsPerPage.value
})

const paginatedTransactions = computed(() => {
  if (showLoadMore.value) {
    return filteredTransactions.value.slice(0, currentPage.value * itemsPerPage.value)
  }
  return filteredTransactions.value.slice(startIndex.value, endIndex.value)
})

// Methods
const getEmptyStateMessage = (): string => {
  switch (activeFilter.value) {
    case 'earnings':
      return 'No earnings transactions yet'
    case 'withdrawals':
      return 'No withdrawals made yet'
    default:
      return 'No transaction history available'
  }
}

const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'principal_deposited':
      return 'svg' // Would return actual icon component
    case 'interest_deposited':
      return 'svg'
    case 'withdrawal':
      return 'svg'
    default:
      return 'svg'
  }
}

const getTransactionIconClass = (type: string): string => {
  switch (type) {
    case 'principal_deposited':
      return 'w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400'
    case 'interest_deposited':
      return 'w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-400'
    case 'withdrawal':
      return 'w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400'
    default:
      return 'w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400'
  }
}

const getTransactionTitle = (transaction: EarningsEvent): string => {
  switch (transaction.type) {
    case 'principal_deposited':
      return 'Principal Repayment Received'
    case 'interest_deposited':
      return 'Interest Payment Received'
    case 'withdrawal':
      return 'Funds Withdrawn'
    default:
      return 'Transaction'
  }
}

const getTransactionTypeLabel = (type: string): string => {
  switch (type) {
    case 'principal_deposited':
      return 'Principal'
    case 'interest_deposited':
      return 'Interest'
    case 'withdrawal':
      return 'Withdrawal'
    default:
      return 'Other'
  }
}

const getTransactionTypeBadgeClass = (type: string): string => {
  switch (type) {
    case 'principal_deposited':
      return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'interest_deposited':
      return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'withdrawal':
      return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    default:
      return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }
}

const getTransactionAmount = (transaction: EarningsEvent): string => {
  return formatUSDT(transaction.amount)
}

const getAmountColorClass = (type: string): string => {
  switch (type) {
    case 'principal_deposited':
    case 'interest_deposited':
      return 'text-green-600 dark:text-green-400'
    case 'withdrawal':
      return 'text-purple-600 dark:text-purple-400'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
}

const getStatusIcon = (status: string) => {
  return 'svg' // Would return actual status icon component
}

const getStatusIconClass = (status: string): string => {
  switch (status) {
    case 'success':
      return 'w-4 h-4 text-green-500'
    case 'pending':
      return 'w-4 h-4 text-yellow-500'
    case 'failed':
      return 'w-4 h-4 text-red-500'
    default:
      return 'w-4 h-4 text-gray-500'
  }
}

const getStatusText = (status: string): string => {
  switch (status) {
    case 'success':
      return 'Completed'
    case 'pending':
      return 'Processing'
    case 'failed':
      return 'Failed'
    default:
      return 'Unknown'
  }
}

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString()
}

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const getExplorerUrl = (txHash: string): string => {
  return `https://etherscan.io/tx/${txHash}`
}

// Pagination methods
const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const loadMore = () => {
  currentPage.value++
}
</script>

<style scoped>
.transaction-history {
  @apply space-y-4;
}

.filter-tabs {
  @apply flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1;
}

.transactions-container {
  @apply bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700;
}

.transactions-list {
  @apply divide-y divide-gray-200 dark:divide-gray-700;
}

.transaction-item {
  @apply transition-all duration-200;
}

.transaction-item:hover {
  @apply bg-gray-50 dark:bg-gray-750;
}

.pagination {
  @apply px-4 py-3 border-t border-gray-200 dark:border-gray-700;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .transaction-item {
    @apply px-3 py-3;
  }

  .filter-tabs {
    @apply flex-col space-x-0 space-y-1;
  }
}

/* Loading states */
.transaction-item.loading {
  @apply opacity-50 pointer-events-none;
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .filter-tabs {
    @apply bg-gray-700;
  }
}
</style>
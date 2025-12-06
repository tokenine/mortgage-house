<template>
  <div class="transaction-history space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Transaction History
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Complete history of all your investment activities
        </p>
      </div>

      <div class="flex items-center space-x-3">
        <!-- Export Button -->
        <UDropdown :items="exportMenuItems">
          <UButton
            variant="outline"
            icon="i-heroicons-arrow-down-tray"
            :loading="isExporting"
          >
            Export
          </UButton>
        </UDropdown>

        <!-- Refresh Button -->
        <UButton
          variant="ghost"
          icon="i-heroicons-arrow-path"
          :loading="isLoading"
          @click="refreshTransactions"
        >
          Refresh
        </UButton>
      </div>
    </div>

    <!-- Performance Metrics Overview -->
    <PerformanceMetrics
      v-if="performanceMetrics"
      :metrics="performanceMetrics"
      :transaction-breakdown="transactionBreakdown"
    />

    <!-- Filters -->
    <TransactionFilter
      :active-filter="activeFilter"
      :transaction-types="availableTransactionTypes"
      @filter-change="handleFilterChange"
      @clear-filter="handleClearFilter"
    />

    <!-- Transaction List -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <!-- List Header -->
      <div class="border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div class="flex items-center justify-between">
          <h4 class="font-medium text-gray-900 dark:text-white">
            Transactions
            <span class="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
              ({{ totalTransactions }} total)
            </span>
          </h4>

          <!-- View Toggle -->
          <div class="flex items-center space-x-2">
            <UButton
              :variant="viewMode === 'list' ? 'solid' : 'ghost'"
              size="xs"
              icon="i-heroicons-list-bullet"
              @click="viewMode = 'list'"
            >
              List
            </UButton>
            <UButton
              :variant="viewMode === 'card' ? 'solid' : 'ghost'"
              size="xs"
              icon="i-heroicons-squares-2x2"
              @click="viewMode = 'card'"
            >
              Cards
            </UButton>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading && sortedTransactions.length === 0" class="p-8 text-center">
        <div class="flex flex-col items-center space-y-4">
          <Icon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 animate-spin" />
          <div>
            <p class="text-gray-900 dark:text-white font-medium">Loading transactions</p>
            <p class="text-gray-500 dark:text-gray-400 text-sm">Please wait while we fetch your transaction history</p>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!hasTransactions" class="p-8 text-center">
        <div class="flex flex-col items-center space-y-4">
          <Icon name="i-heroicons-inbox" class="w-12 h-12 text-gray-400" />
          <div>
            <h3 class="text-gray-900 dark:text-white font-medium text-lg">No transactions found</h3>
            <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {{ activeFilter && Object.keys(activeFilter).length > 0
                ? 'No transactions match your current filters'
                : 'You haven\'t made any transactions yet'
              }}
            </p>
          </div>

          <!-- Clear filters button if filters are active -->
          <UButton
            v-if="activeFilter && Object.keys(activeFilter).length > 0"
            variant="outline"
            @click="handleClearFilter"
          >
            Clear Filters
          </UButton>
        </div>
      </div>

      <!-- Transaction List View -->
      <div v-else-if="viewMode === 'list'" class="divide-y divide-gray-200 dark:divide-gray-700">
        <TransactionRow
          v-for="transaction in sortedTransactions"
          :key="transaction.id"
          :transaction="transaction"
          @view-details="handleViewDetails"
          @view-on-explorer="handleViewOnExplorer"
        />

        <!-- Load More -->
        <div v-if="hasMoreTransactions" class="p-4 text-center border-t border-gray-200 dark:border-gray-700">
          <UButton
            variant="outline"
            :loading="isLoadingMore"
            @click="loadMore"
          >
            Load More Transactions
          </UButton>
        </div>
      </div>

      <!-- Transaction Card View -->
      <div v-else class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <TransactionCard
          v-for="transaction in sortedTransactions"
          :key="transaction.id"
          :transaction="transaction"
          @view-details="handleViewDetails"
          @view-on-explorer="handleViewOnExplorer"
        />

        <!-- Load More -->
        <div v-if="hasMoreTransactions" class="md:col-span-2 p-4 text-center">
          <UButton
            variant="outline"
            :loading="isLoadingMore"
            @click="loadMore"
          >
            Load More Transactions
          </UButton>
        </div>
      </div>
    </div>

    <!-- Transaction Details Modal -->
    <TransactionDetail
      :is-open="showDetails"
      :transaction="selectedTransaction"
      @close="handleCloseDetails"
    />

    <!-- Export Status Modal -->
    <UAlert
      v-if="exportStatus.show"
      :color="exportStatus.success ? 'green' : 'red'"
      :title="exportStatus.success ? 'Export Successful' : 'Export Failed'"
      :description="exportStatus.message"
      class="fixed bottom-4 right-4 z-50 max-w-sm"
      closable
      @close="exportStatus.show = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTransactionHistory } from '~/composables/useTransactionHistory'
import type { Transaction, TransactionFilter, TransactionType } from '~/types/transactions'

// Component imports
import PerformanceMetrics from './PerformanceMetrics.vue'
import TransactionFilter from './TransactionFilter.vue'
import TransactionRow from './TransactionRow.vue'
import TransactionCard from './TransactionCard.vue'
import TransactionDetail from './TransactionDetail.vue'

// Props
interface Props {
  contractAddress?: string
  autoRefresh?: boolean
  initialFilter?: TransactionFilter
}

const props = withDefaults(defineProps<Props>(), {
  autoRefresh: true,
  initialFilter: () => ({})
})

// Composables
const {
  transactions,
  filteredTransactions,
  sortedTransactions,
  recentTransactions,
  isLoading,
  isLoadingMore,
  error,
  lastUpdate,
  currentPage,
  totalPages,
  totalTransactions,
  activeFilter,
  isWatchingEvents,
  performanceMetrics,
  hasTransactions,
  totalAmount,
  totalGasCost,
  transactionBreakdown,
  fetchTransactions,
  loadMore,
  setFilter,
  clearFilter,
  refreshTransactions,
  exportTransactions
} = useTransactionHistory({
  contractAddress: props.contractAddress as `0x${string}`,
  autoRefresh: props.autoRefresh,
  enableRealTimeUpdates: true
})

// State
const viewMode = ref<'list' | 'card'>('list')
const showDetails = ref(false)
const selectedTransaction = ref<Transaction | null>(null)
const isExporting = ref(false)
const exportStatus = ref<{
  show: boolean
  success: boolean
  message: string
}>({
  show: false,
  success: false,
  message: ''
})

// Computed
const availableTransactionTypes = computed(() => {
  const types = new Set<TransactionType>()
  transactions.value.forEach(tx => types.add(tx.type))
  return Array.from(types)
})

const hasMoreTransactions = computed(() => {
  return currentPage.value < totalPages.value
})

const exportMenuItems = computed(() => [
  [{
    label: 'Export as CSV',
    icon: 'i-heroicons-document-text',
    click: () => handleExport('csv')
  }],
  [{
    label: 'Export as JSON',
    icon: 'i-heroicons-code-bracket',
    click: () => handleExport('json')
  }],
  [{
    label: 'Export with Filters',
    icon: 'i-heroicons-funnel',
    disabled: Object.keys(activeFilter.value).length === 0,
    click: () => handleExport('csv', true)
  }]
])

// Methods
const handleFilterChange = (filter: TransactionFilter) => {
  setFilter(filter)
}

const handleClearFilter = () => {
  clearFilter()
}

const handleViewDetails = (transaction: Transaction) => {
  selectedTransaction.value = transaction
  showDetails.value = true
}

const handleCloseDetails = () => {
  showDetails.value = false
  selectedTransaction.value = null
}

const handleViewOnExplorer = (transaction: Transaction) => {
  const url = `https://etherscan.io/tx/${transaction.transactionHash}`
  window.open(url, '_blank')
}

const handleExport = async (format: 'csv' | 'json', useFilters = false) => {
  try {
    isExporting.value = true

    const options = {
      includeEvents: true,
      includeGasCosts: true,
      format
    }

    await exportTransactions(useFilters ? activeFilter.value : undefined, options)

    exportStatus.value = {
      show: true,
      success: true,
      message: `Successfully exported ${format.toUpperCase()} file`
    }

  } catch (error) {
    console.error('Export failed:', error)
    exportStatus.value = {
      show: true,
      success: false,
      message: 'Failed to export transactions. Please try again.'
    }
  } finally {
    isExporting.value = false

    // Hide export status after 3 seconds
    setTimeout(() => {
      exportStatus.value.show = false
    }, 3000)
  }
}

// Initialize with initial filter
watch(() => props.initialFilter, (newFilter) => {
  if (newFilter && Object.keys(newFilter).length > 0) {
    setFilter(newFilter)
  }
}, { immediate: true })

// Error handling
watch(error, (newError) => {
  if (newError) {
    console.error('Transaction history error:', newError)
    // In a real app, you'd show a user-friendly error notification
  }
})
</script>

<style scoped>
.transaction-history {
  @apply max-w-6xl mx-auto;
}

/* Custom scrollbar for better UX */
.transaction-history ::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.transaction-history ::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-800;
}

.transaction-history ::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-600 rounded-full;
}

.transaction-history ::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400 dark:bg-gray-500;
}
</style>
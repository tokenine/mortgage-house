<template>
  <div class="transaction-feed">
    <div class="flex justify-between items-center mb-4">
      <h4 class="text-lg font-bold text-gray-900">{{ title }}</h4>
      <div class="flex items-center space-x-4">
        <span v-if="totalTransactions > 0" class="text-sm text-gray-600">
          {{ totalTransactions }} total transactions
        </span>
        <button
          v-if="isLive"
          class="flex items-center text-sm text-blue-600 hover:text-blue-800"
          @click="$emit('refresh')"
        >
          <svg
            class="animate-spin w-4 h-4 mr-1"
            :class="{ 'animate-pulse': isUpdating }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ isUpdating ? 'Updating...' : 'Live' }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isUpdating && transactions.length === 0" class="flex justify-center py-8">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading transactions...</p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredTransactions.length === 0" class="text-center py-8">
      <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <p class="text-gray-500">{{ emptyMessage }}</p>
    </div>

    <!-- Transaction List -->
    <div v-else class="space-y-3">
      <div
        v-for="transaction in paginatedTransactions"
        :key="transaction.id"
        class="group relative bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
        :class="{
          'border-blue-200 bg-blue-50': isHighlightNew && transaction.isNew,
          'opacity-75': isLoading
        }"
      >
        <!-- Transaction Header -->
        <div class="flex justify-between items-start mb-3">
          <div class="flex items-center space-x-3">
            <!-- Transaction Type Icon -->
            <div class="w-10 h-10 rounded-full flex items-center justify-center" :class="getTransactionIconClass(transaction.type)">
              <component :is="getTransactionIcon(transaction.type)" class="w-5 h-5" />
            </div>

            <!-- Investor Info -->
            <div>
              <div class="flex items-center space-x-2">
                <span class="font-medium text-gray-900">
                  {{ getTransactionTitle(transaction) }}
                </span>
                <span
                  v-if="transaction.isNew"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                >
                  New
                </span>
              </div>
              <div class="flex items-center space-x-4 mt-1">
                <span class="text-sm text-gray-600">
                  {{ maskAddress(transaction.investor || transaction.from) }}
                </span>
                <span class="text-sm text-gray-500">
                  {{ formatTimestamp(transaction.timestamp) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Transaction Amount -->
          <div class="text-right">
            <div class="text-lg font-semibold text-gray-900">
              {{ formatAmount(transaction.amount) }} {{ transaction.token || 'USDT' }}
            </div>
            <div v-if="transaction.shares" class="text-sm text-gray-600">
              {{ formatAmount(transaction.shares) }} shares
            </div>
          </div>
        </div>

        <!-- Transaction Details -->
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-6 text-sm">
            <!-- Transaction Status -->
            <div class="flex items-center">
              <div
                class="w-2 h-2 rounded-full mr-2"
                :class="getTransactionStatusClass(transaction.status)"
              ></div>
              <span class="text-gray-600">{{ getTransactionStatus(transaction.status) }}</span>
            </div>

            <!-- Additional Details -->
            <div v-if="transaction.to" class="text-gray-600">
              To: {{ maskAddress(transaction.to) }}
            </div>
            <div v-if="transaction.stage !== undefined" class="text-gray-600">
              Stage: {{ getStageName(transaction.stage) }}
            </div>
          </div>

          <!-- Block Explorer Link -->
          <div class="flex items-center space-x-3">
            <a
              v-if="transaction.txHash"
              :href="getBlockExplorerUrl(transaction.txHash)"
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center group/link"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
              <span class="group-hover/link:underline">Explorer</span>
            </a>

            <!-- Action Buttons -->
            <button
              v-if="onTransactionAction"
              @click="$emit('transaction-action', transaction)"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Highlight for new transactions -->
        <div
          v-if="isHighlightNew && transaction.isNew"
          class="absolute top-0 right-0 -mt-1 -mr-1"
        >
          <div class="relative">
            <div class="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></div>
            <div class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination Controls -->
    <div v-if="totalPages > 1" class="flex justify-center items-center space-x-4 mt-6 pt-6 border-t border-gray-200">
      <button
        @click="previousPage"
        :disabled="currentPage === 1"
        class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>

      <span class="text-sm text-gray-700">
        Page {{ currentPage }} of {{ totalPages }}
      </span>

      <button
        @click="nextPage"
        :disabled="currentPage === totalPages"
        class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>

    <!-- Load More Button (Alternative to Pagination) -->
    <div v-if="hasMore && !usePagination" class="text-center mt-6 pt-6 border-t border-gray-200">
      <button
        @click="loadMore"
        :disabled="isLoadingMore"
        class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span v-if="isLoadingMore">Loading...</span>
        <span v-else>Load More Transactions</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

// Transaction Types
export interface Transaction {
  id: string
  type: 'Invested' | 'Withdrawal' | 'Transfer' | 'StageChanged' | 'Deposit' | 'LoanWithdrawal'
  investor?: string
  from?: string
  to?: string
  amount: bigint
  shares?: bigint
  timestamp: number
  txHash?: string
  status?: 'pending' | 'confirmed' | 'failed'
  stage?: number
  token?: string
  isNew?: boolean
  data?: any
}

// Props
interface Props {
  transactions: Transaction[]
  isLoading?: boolean
  isUpdating?: boolean
  isLive?: boolean
  title?: string
  emptyMessage?: string
  itemsPerPage?: number
  usePagination?: boolean
  isHighlightNew?: boolean
  onTransactionAction?: (transaction: Transaction) => void
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  isUpdating: false,
  isLive: true,
  title: 'Transaction History',
  emptyMessage: 'No transactions yet',
  itemsPerPage: 20,
  usePagination: false,
  isHighlightNew: true
})

// Emits
const emit = defineEmits<{
  'transaction-action': [transaction: Transaction]
  'refresh': []
}>()

// Local state
const currentPage = ref(1)
const isLoadingMore = ref(false)

// Computed properties
const totalTransactions = computed(() => props.transactions.length)

const filteredTransactions = computed(() => {
  return props.transactions.slice().sort((a, b) => b.timestamp - a.timestamp)
})

const totalPages = computed(() => {
  return Math.ceil(filteredTransactions.value.length / props.itemsPerPage)
})

const paginatedTransactions = computed(() => {
  if (!props.usePagination) {
    return filteredTransactions.value
  }

  const start = (currentPage.value - 1) * props.itemsPerPage
  const end = start + props.itemsPerPage
  return filteredTransactions.value.slice(start, end)
})

const hasMore = computed(() => {
  return !props.usePagination && filteredTransactions.value.length > props.itemsPerPage
})

// Methods
const maskAddress = (address: string): string => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const formatAmount = (amount: bigint): string => {
  // This should be imported from utils, but for now using basic formatting
  return (Number(amount) / 1e6).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const formatTimestamp = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  return `${days} day${days > 1 ? 's' : ''} ago`
}

const getTransactionTitle = (transaction: Transaction): string => {
  const titles = {
    Invested: 'Investment',
    Withdrawal: 'Withdrawal',
    Transfer: 'Transfer',
    StageChanged: 'Stage Change',
    Deposit: 'Deposit',
    LoanWithdrawal: 'Loan Withdrawal'
  }
  return titles[transaction.type] || transaction.type
}

const getTransactionIcon = (type: string) => {
  const icons = {
    Invested: 'InvestmentIcon',
    Withdrawal: 'WithdrawalIcon',
    Transfer: 'TransferIcon',
    StageChanged: 'StageIcon',
    Deposit: 'DepositIcon',
    LoanWithdrawal: 'LoanIcon'
  }
  return icons[type] || 'DefaultIcon'
}

const getTransactionIconClass = (type: string): string => {
  const classes = {
    Invested: 'bg-green-100 text-green-600',
    Withdrawal: 'bg-blue-100 text-blue-600',
    Transfer: 'bg-purple-100 text-purple-600',
    StageChanged: 'bg-yellow-100 text-yellow-600',
    Deposit: 'bg-indigo-100 text-indigo-600',
    LoanWithdrawal: 'bg-red-100 text-red-600'
  }
  return classes[type] || 'bg-gray-100 text-gray-600'
}

const getTransactionStatus = (status?: string): string => {
  const statuses = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    failed: 'Failed'
  }
  return statuses[status as keyof typeof statuses] || 'Unknown'
}

const getTransactionStatusClass = (status?: string): string => {
  const classes = {
    pending: 'bg-yellow-400',
    confirmed: 'bg-green-400',
    failed: 'bg-red-400'
  }
  return classes[status as keyof typeof classes] || 'bg-gray-400'
}

const getStageName = (stage: number): string => {
  const stages = ['Not Started', 'Funding', 'Funded', 'Active', 'Repaid']
  return stages[stage] || 'Unknown'
}

const getBlockExplorerUrl = (txHash: string): string => {
  return `https://etherscan.io/tx/${txHash}`
}

// Pagination controls
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
  // This would emit an event to parent to load more transactions
  isLoadingMore.value = true
  setTimeout(() => {
    isLoadingMore.value = false
  }, 1000)
}

// Icon components (simplified for now)
const InvestmentIcon = () => '💰'
const WithdrawalIcon = () => '💸'
const TransferIcon = () => '🔄'
const StageIcon = () => '📊'
const DepositIcon = () => '📥'
const LoanIcon = () => '🏦'
const DefaultIcon = () => '📄'
</script>

<style scoped>
.transaction-feed {
  @apply space-y-4;
}

@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

.animate-ping {
  animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
}
</style>
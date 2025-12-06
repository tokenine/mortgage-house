<template>
  <div class="performance-metrics space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Portfolio Performance
      </h3>
      <div class="text-sm text-gray-500 dark:text-gray-400">
        Last updated: {{ formatDate(lastUpdate) }}
      </div>
    </div>

    <!-- Key Metrics Grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <!-- Total Invested -->
      <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-blue-600 dark:text-blue-400">Total Invested</p>
            <p class="text-xl font-bold text-blue-900 dark:text-blue-100">
              {{ formatAmount(metrics.totalInvested) }} USDT
            </p>
          </div>
          <div class="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
            <Icon name="i-heroicons-arrow-up-circle" class="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      <!-- Total Withdrawn -->
      <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-green-600 dark:text-green-400">Total Withdrawn</p>
            <p class="text-xl font-bold text-green-900 dark:text-green-100">
              {{ formatAmount(metrics.totalWithdrawn) }} USDT
            </p>
          </div>
          <div class="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
            <Icon name="i-heroicons-arrow-down-circle" class="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>

      <!-- Total Earnings -->
      <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-purple-600 dark:text-purple-400">Total Earnings</p>
            <p class="text-xl font-bold" :class="getEarningsColorClass()">
              {{ formatAmount(metrics.totalEarnings) }} USDT
            </p>
          </div>
          <div class="w-10 h-10 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
            <Icon name="i-heroicons-currency-dollar" class="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

      <!-- Return Percentage -->
      <div class="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-indigo-600 dark:text-indigo-400">Return %</p>
            <p class="text-xl font-bold" :class="getReturnColorClass()">
              {{ formatPercentage(metrics.totalReturnPercentage) }}%
            </p>
          </div>
          <div class="w-10 h-10 bg-indigo-100 dark:bg-indigo-800 rounded-full flex items-center justify-center">
            <Icon name="i-heroicons-chart-line" class="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Breakdown -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Contract Performance -->
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 class="font-medium text-gray-900 dark:text-white mb-3">Contract Performance</h4>
        <div class="space-y-3 max-h-64 overflow-y-auto">
          <div
            v-for="contract in metrics.investmentsByContract"
            :key="contract.contractAddress"
            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                {{ contract.contractTitle || formatAddress(contract.contractAddress) }}
              </p>
              <div class="flex items-center space-x-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                <span>Invested: {{ formatAmount(contract.totalInvested) }}</span>
                <span>Earnings: {{ formatAmount(contract.currentEarnings) }}</span>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <div class="text-right">
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ contract.performanceScore }}/100
                </p>
                <div class="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                  <div
                    class="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full"
                    :style="{ width: `${contract.performanceScore}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Earnings Breakdown -->
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 class="font-medium text-gray-900 dark:text-white mb-3">Earnings Breakdown</h4>
        <div class="space-y-4">
          <!-- Principal Earnings -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Principal Returns</span>
              <span class="text-sm font-bold text-blue-600 dark:text-blue-400">
                {{ formatAmount(metrics.earningsByType.principal) }} USDT
              </span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div
                class="bg-blue-500 h-2 rounded-full"
                :style="{ width: `${getPrincipalPercentage()}%` }"
              ></div>
            </div>
          </div>

          <!-- Interest Earnings -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Interest Returns</span>
              <span class="text-sm font-bold text-green-600 dark:text-green-400">
                {{ formatAmount(metrics.earningsByType.interest) }} USDT
              </span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div
                class="bg-green-500 h-2 rounded-full"
                :style="{ width: `${getInterestPercentage()}%` }"
              ></div>
            </div>
          </div>

          <!-- Summary Stats -->
          <div class="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">YTD Returns</p>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ formatAmount(metrics.yearToDateReturns) }} USDT
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Avg. Holding Period</p>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ metrics.averageHoldingPeriod }} days
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Total Transactions</p>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ metrics.totalTransactions }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Portfolio Value</p>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ formatAmount(metrics.currentPortfolioValue) }} USDT
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Transaction Type Breakdown -->
    <div v-if="Object.keys(transactionBreakdown).length > 0" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <h4 class="font-medium text-gray-900 dark:text-white mb-3">Transaction Volume by Type</h4>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          v-for="(amount, type) in transactionBreakdown"
          :key="type"
          class="text-center"
        >
          <div class="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center" :class="getTransactionTypeBgColor(type)">
            <Icon
              :name="getTransactionTypeIcon(type)"
              class="w-6 h-6"
              :class="getTransactionTypeColor(type)"
            />
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {{ formatTransactionType(type) }}
          </p>
          <p class="text-sm font-medium text-gray-900 dark:text-white">
            {{ formatAmount(amount) }} USDT
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  type PerformanceMetrics,
  formatTransactionType,
  getTransactionTypeIcon,
  getTransactionTypeColor,
  getTransactionTypeBgColor
} from '~/types/transactions'

// Props
interface Props {
  metrics: PerformanceMetrics
  transactionBreakdown: Record<string, bigint>
  lastUpdate?: number
}

const props = withDefaults(defineProps<Props>(), {
  lastUpdate: Date.now()
})

// Methods
const formatAmount = (amount: string): string => {
  const num = parseFloat(amount)
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(2)}K`
  }
  return num.toFixed(2)
}

const formatPercentage = (percentage: number): string => {
  return percentage.toFixed(2)
}

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString()
}

const formatAddress = (address: string): string => {
  if (!address) return '0x000...000'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const getEarningsColorClass = (): string => {
  const earnings = parseFloat(props.metrics.totalEarnings)
  if (earnings > 0) return 'text-green-600 dark:text-green-400'
  if (earnings < 0) return 'text-red-600 dark:text-red-400'
  return 'text-gray-600 dark:text-gray-400'
}

const getReturnColorClass = (): string => {
  const percentage = props.metrics.totalReturnPercentage
  if (percentage > 0) return 'text-green-600 dark:text-green-400'
  if (percentage < 0) return 'text-red-600 dark:text-red-400'
  return 'text-gray-600 dark:text-gray-400'
}

const getPrincipalPercentage = (): number => {
  const principal = parseFloat(props.metrics.earningsByType.principal)
  const interest = parseFloat(props.metrics.earningsByType.interest)
  const total = principal + interest

  if (total === 0) return 0
  return (principal / total) * 100
}

const getInterestPercentage = (): number => {
  const principal = parseFloat(props.metrics.earningsByType.principal)
  const interest = parseFloat(props.metrics.earningsByType.interest)
  const total = principal + interest

  if (total === 0) return 0
  return (interest / total) * 100
}

const getTransactionTypeBgColor = (type: string): string => {
  if (type === 'invest') {
    return 'bg-green-100 dark:bg-green-900/20'
  } else if (type.startsWith('withdraw')) {
    return 'bg-blue-100 dark:bg-blue-900/20'
  } else if (type.includes('repayment') || type.includes('distribution')) {
    return 'bg-yellow-100 dark:bg-yellow-900/20'
  } else {
    return 'bg-gray-100 dark:bg-gray-700'
  }
}
</script>

<style scoped>
.performance-metrics {
  @apply space-y-6;
}

/* Custom scrollbar for contract list */
.performance-metrics ::-webkit-scrollbar {
  width: 4px;
}

.performance-metrics ::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-800;
}

.performance-metrics ::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-600 rounded-full;
}

.performance-metrics ::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400 dark:bg-gray-500;
}
</style>
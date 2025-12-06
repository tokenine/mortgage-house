<template>
  <div class="portfolio-overview">
    <div class="overview-header">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
        Portfolio Overview
      </h2>
      <div class="last-update text-sm text-gray-500 dark:text-gray-400">
        Last updated: {{ formatUpdateTime(lastUpdate) }}
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="summary-cards grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Total Invested Card -->
      <div class="summary-card bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Invested</p>
            <p class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ formattedPortfolio.formatted.totalInvested }}
            </p>
          </div>
        </div>
      </div>

      <!-- Total Earnings Card -->
      <div class="summary-card bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Earnings</p>
            <p class="text-lg font-semibold text-green-600 dark:text-green-400">
              {{ formattedPortfolio.formatted.totalEarnings }}
            </p>
          </div>
        </div>
      </div>

      <!-- Withdrawable Funds Card -->
      <div class="summary-card bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Withdrawable</p>
            <p class="text-lg font-semibold text-purple-600 dark:text-purple-400">
              {{ formattedPortfolio.formatted.totalWithdrawable }}
            </p>
          </div>
        </div>
      </div>

      <!-- Total Return Card -->
      <div class="summary-card bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Return</p>
            <p class="text-lg font-semibold" :class="returnColorClass">
              {{ formattedPortfolio.formatted.totalReturn }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Detailed Breakdown -->
    <div class="detailed-breakdown grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <!-- Earnings Breakdown -->
      <div class="breakdown-section bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Earnings Breakdown
        </h3>
        <div class="space-y-3">
          <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
            <span class="text-sm text-gray-600 dark:text-gray-400">Principal Repayments</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ formattedPortfolio.formatted.totalEntitledPrincipal }}
            </span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
            <span class="text-sm text-gray-600 dark:text-gray-400">Interest Payments</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ formattedPortfolio.formatted.totalEntitledInterest }}
            </span>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="text-sm text-gray-600 dark:text-gray-400">Total Withdrawn</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ formatUSDT(portfolioEarnings.totalWithdrawn) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Investment Statistics -->
      <div class="breakdown-section bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Investment Statistics
        </h3>
        <div class="space-y-3">
          <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
            <span class="text-sm text-gray-600 dark:text-gray-400">Active Investments</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ portfolioSummary.activeInvestments }} / {{ portfolioSummary.investmentCount }}
            </span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
            <span class="text-sm text-gray-600 dark:text-gray-400">Annualized Return</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ formattedPortfolio.formatted.annualizedReturn }}
            </span>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="text-sm text-gray-600 dark:text-gray-400">Portfolio Status</span>
            <span class="text-sm font-medium" :class="statusColorClass">
              {{ portfolioStatus }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatUSDT } from '~/utils/contract/constants'
import type { PortfolioSummary, PortfolioEarnings } from '~/composables/usePortfolio'

interface Props {
  portfolioSummary: PortfolioSummary
  formattedPortfolio: any
  lastUpdate: number
}

const props = defineProps<Props>()

// Computed properties
const returnColorClass = computed(() => {
  const returnPercentage = props.portfolioSummary.totalReturn
  if (returnPercentage > 0) return 'text-green-600 dark:text-green-400'
  if (returnPercentage < 0) return 'text-red-600 dark:text-red-400'
  return 'text-gray-600 dark:text-gray-400'
})

const statusColorClass = computed(() => {
  if (props.portfolioSummary.activeInvestments > 0) {
    return 'text-green-600 dark:text-green-400'
  }
  return 'text-gray-600 dark:text-gray-400'
})

const portfolioStatus = computed(() => {
  if (props.portfolioSummary.activeInvestments > 0) {
    return 'Active'
  }
  return 'No Active Investments'
})

// Utility functions
const formatUpdateTime = (timestamp: number): string => {
  if (!timestamp) return 'Never'

  const now = Date.now()
  const diff = now - timestamp

  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return new Date(timestamp).toLocaleDateString()
}
</script>

<style scoped>
.portfolio-overview {
  @apply space-y-6;
}

.overview-header {
  @apply flex justify-between items-center;
}

.summary-cards {
  @apply grid-flow-row-dense;
}

.summary-card {
  @apply transition-all duration-200 hover:shadow-lg;
}

.breakdown-section {
  @apply transition-all duration-200 hover:shadow-lg;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .detailed-breakdown {
    @apply grid-cols-1;
  }
}

@media (max-width: 640px) {
  .summary-cards {
    @apply grid-cols-1;
  }
}

/* Animation for new data */
@keyframes pulse-once {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.summary-card.updating {
  animation: pulse-once 1s ease-in-out;
}
</style>
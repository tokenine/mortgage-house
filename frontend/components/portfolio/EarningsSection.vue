<template>
  <div class="earnings-section">
    <div class="section-header mb-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        Earnings Overview
      </h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        Track your principal repayments and interest earnings
      </p>
    </div>

    <!-- Earnings Summary Cards -->
    <div class="earnings-cards grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <!-- Principal Card -->
      <div class="earnings-card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center mb-2">
              <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h4 class="text-sm font-medium text-blue-800 dark:text-blue-200">Principal Earnings</h4>
            </div>
            <p class="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {{ formattedPortfolio.formatted.totalEntitledPrincipal }}
            </p>
            <p class="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Withdrawable: {{ formatUSDT(portfolioEarnings.totalWithdrawablePrincipal) }}
            </p>
          </div>

          <!-- Progress indicator -->
          <div class="text-right">
            <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {{ principalReturnPercentage.toFixed(1) }}%
            </div>
            <div class="text-xs text-blue-700 dark:text-blue-300">
              of invested
            </div>
          </div>
        </div>

        <!-- Withdrawal Button -->
        <button
          v-if="portfolioEarnings.totalWithdrawablePrincipal > 0n"
          @click="$emit('withdraw-principal', portfolioEarnings.totalWithdrawablePrincipal)"
          class="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Withdraw Principal
        </button>
      </div>

      <!-- Interest Card -->
      <div class="earnings-card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center mb-2">
              <svg class="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 class="text-sm font-medium text-green-800 dark:text-green-200">Interest Earnings</h4>
            </div>
            <p class="text-2xl font-bold text-green-900 dark:text-green-100">
              {{ formattedPortfolio.formatted.totalEntitledInterest }}
            </p>
            <p class="text-sm text-green-700 dark:text-green-300 mt-1">
              Withdrawable: {{ formatUSDT(portfolioEarnings.totalWithdrawableInterest) }}
            </p>
          </div>

          <!-- Interest Rate -->
          <div class="text-right">
            <div class="text-2xl font-bold text-green-600 dark:text-green-400">
              {{ estimatedAPY.toFixed(1) }}%
            </div>
            <div class="text-xs text-green-700 dark:text-green-300">
              est. APY
            </div>
          </div>
        </div>

        <!-- Withdrawal Button -->
        <button
          v-if="portfolioEarnings.totalWithdrawableInterest > 0n"
          @click="$emit('withdraw-interest', portfolioEarnings.totalWithdrawableInterest)"
          class="mt-4 w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Withdraw Interest
        </button>
      </div>
    </div>

    <!-- Earnings Chart -->
    <div class="chart-section bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">
        Earnings Trend
      </h4>

      <!-- Simple chart visualization -->
      <div class="chart-container">
        <div v-if="hasEarningsHistory" class="earnings-chart">
          <!-- Chart would go here - using simple visualization for now -->
          <div class="flex items-end justify-between h-32 px-2">
            <div
              v-for="(data, index) in chartData"
              :key="index"
              class="flex-1 mx-1 bg-blue-200 dark:bg-blue-700 rounded-t"
              :style="{ height: `${data.percentage}%` }"
              :title="`${formatUSDT(data.amount)} - ${data.date}`"
            >
              <div class="text-xs text-center pt-1 text-blue-800 dark:text-blue-200 font-medium">
                {{ data.percentage }}%
              </div>
            </div>
          </div>

          <!-- Chart Labels -->
          <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2 px-2">
            <span>Oldest</span>
            <span>Most Recent</span>
          </div>
        </div>

        <div v-else class="no-chart-data text-center py-8">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            No earnings history yet
          </p>
        </div>
      </div>
    </div>

    <!-- Combined Actions -->
    <div v-if="hasWithdrawableFunds" class="combined-actions mt-6">
      <div class="bg-amber-50 dark:bg-amber-900 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
        <div class="flex items-center">
          <svg class="w-5 h-5 text-amber-600 dark:text-amber-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div class="flex-1">
            <p class="text-sm font-medium text-amber-800 dark:text-amber-200">
              Funds Available for Withdrawal
            </p>
            <p class="text-xs text-amber-700 dark:text-amber-300 mt-1">
              {{ formatUSDT(portfolioEarnings.totalWithdrawablePrincipal + portfolioEarnings.totalWithdrawableInterest) }} total
            </p>
          </div>

          <button
            @click="$emit('withdraw-both', portfolioEarnings.totalWithdrawablePrincipal, portfolioEarnings.totalWithdrawableInterest)"
            class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            Withdraw All
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatUSDT } from '~/utils/contract/constants'
import type { PortfolioEarnings, EarningsEvent } from '~/composables/usePortfolio'

interface Props {
  portfolioEarnings: PortfolioEarnings
  formattedPortfolio: any
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'withdraw-principal': [amount: bigint]
  'withdraw-interest': [amount: bigint]
  'withdraw-both': [principalAmount: bigint, interestAmount: bigint]
}>()

// Computed properties
const principalReturnPercentage = computed(() => {
  // Simplified calculation - would use actual investment amounts
  const totalEarnings = props.portfolioEarnings.totalEntitledPrincipal
  if (totalEarnings === 0n) return 0
  return Math.min(Number(totalEarnings / 1000000n) * 10, 100) // Simplified percentage
})

const estimatedAPY = computed(() => {
  // Simplified APY calculation - would use actual loan terms and timing
  const totalEarnings = props.portfolioEarnings.totalEntitledInterest
  if (totalEarnings === 0n) return 0
  return Math.min(Number(totalEarnings / 1000000n) * 5, 20) // Simplified APY
})

const hasEarningsHistory = computed(() => {
  return props.portfolioEarnings.earningsHistory.length > 0
})

const hasWithdrawableFunds = computed(() => {
  return props.portfolioEarnings.totalWithdrawablePrincipal > 0n ||
         props.portfolioEarnings.totalWithdrawableInterest > 0n
})

const chartData = computed(() => {
  const history = props.portfolioEarnings.earningsHistory
  if (history.length === 0) return []

  // Simplified chart data - group by day and calculate totals
  const dailyTotals: Record<string, bigint> = {}

  history.forEach(event => {
    const date = new Date(event.timestamp).toLocaleDateString()
    dailyTotals[date] = (dailyTotals[date] || 0n) + event.amount
  })

  const entries = Object.entries(dailyTotals)
    .slice(-7) // Last 7 days
    .map(([date, amount]) => ({
      date,
      amount,
      percentage: Math.min(Number(amount / 1000000n) * 2, 100) // Simplified percentage
    }))

  return entries
})
</script>

<style scoped>
.earnings-section {
  @apply space-y-6;
}

.earnings-cards {
  @apply grid-cols-1 md:grid-cols-2;
}

.earnings-card {
  @apply transition-all duration-200 hover:shadow-lg;
}

.chart-section {
  @apply transition-all duration-200;
}

.earnings-chart {
  @apply space-y-2;
}

.chart-container {
  @apply relative;
}

.combined-actions {
  @apply transition-all duration-200;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .earnings-cards {
    @apply grid-cols-1;
  }
}

/* Animation for new earnings */
@keyframes earnings-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
}

.earnings-card.new-earnings {
  animation: earnings-pulse 2s ease-in-out;
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .earnings-card {
    @apply border border-gray-700;
  }
}
</style>
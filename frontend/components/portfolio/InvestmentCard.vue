<template>
  <div class="investment-card-content p-6">
    <!-- Card Header -->
    <div class="card-header flex justify-between items-start mb-4">
      <div class="investment-info">
        <div class="contract-address text-xs text-gray-500 dark:text-gray-400 font-mono mb-1">
          {{ formatAddress(investment.contractAddress) }}
        </div>
        <h4 class="text-lg font-medium text-gray-900 dark:text-white">
          Mortgage Investment #{{ investment.id.split('_')[1] }}
        </h4>
      </div>

      <!-- Status Badge -->
      <div class="status-badge">
        <span :class="getStatusBadgeClass(investment.fundingStage)">
          {{ getStageName(investment.fundingStage) }}
        </span>
      </div>
    </div>

    <!-- Investment Metrics -->
    <div class="metrics-grid grid grid-cols-2 gap-4 mb-4">
      <!-- Amount Invested -->
      <div class="metric">
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Invested</p>
        <p class="text-sm font-semibold text-gray-900 dark:text-white">
          {{ formatUSDT(investment.investedAmount) }}
        </p>
      </div>

      <!-- Share Percentage -->
      <div class="metric">
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Ownership</p>
        <p class="text-sm font-semibold text-gray-900 dark:text-white">
          {{ investment.sharePercentage.toFixed(2) }}%
        </p>
      </div>

      <!-- Total Earnings -->
      <div class="metric">
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Earnings</p>
        <p class="text-sm font-semibold text-green-600 dark:text-green-400">
          {{ formatUSDT(investment.entitledPrincipal + investment.entitledInterest) }}
        </p>
      </div>

      <!-- Withdrawable -->
      <div class="metric">
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Withdrawable</p>
        <p class="text-sm font-semibold text-purple-600 dark:text-purple-400">
          {{ formatUSDT(investment.withdrawablePrincipal + investment.withdrawableInterest) }}
        </p>
      </div>
    </div>

    <!-- Earnings Breakdown -->
    <div class="earnings-breakdown mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div class="flex justify-between items-center text-sm">
        <span class="text-gray-600 dark:text-gray-400">Principal:</span>
        <span class="font-medium text-gray-900 dark:text-white">
          {{ formatUSDT(investment.entitledPrincipal) }}
        </span>
      </div>
      <div class="flex justify-between items-center text-sm mt-1">
        <span class="text-gray-600 dark:text-gray-400">Interest:</span>
        <span class="font-medium text-gray-900 dark:text-white">
          {{ formatUSDT(investment.entitledInterest) }}
        </span>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="card-actions flex gap-2">
      <button
        @click="$emit('details', investment)"
        class="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
      >
        View Details
      </button>

      <button
        v-if="hasWithdrawableFunds(investment)"
        @click="showWithdrawalOptions"
        class="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
      >
        Withdraw
      </button>
    </div>

    <!-- Progress Indicator -->
    <div v-if="showProgress" class="progress-section mt-4">
      <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
        <span>Return Progress</span>
        <span>{{ calculateReturnPercentage(investment).toFixed(1) }}%</span>
      </div>
      <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
        <div
          class="bg-green-600 h-2 rounded-full transition-all duration-500"
          :style="{ width: `${Math.min(calculateReturnPercentage(investment), 100)}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatUSDT, getStageName, FundingStage } from '~/utils/contract/constants'
import type { PortfolioInvestment } from '~/composables/usePortfolio'

interface Props {
  investment: PortfolioInvestment
}

const props = defineProps<Props>()
const emit = defineEmits<{
  details: [investment: PortfolioInvestment]
  withdrawal: [investment: PortfolioInvestment, type: 'principal' | 'interest' | 'both']
}>()

// Computed properties
const showProgress = computed(() => {
  return props.investment.investedAmount > 0n && (
    props.investment.entitledPrincipal > 0n ||
    props.investment.entitledInterest > 0n
  )
})

// Methods
const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const getStatusBadgeClass = (stage: FundingStage): string => {
  switch (stage) {
    case FundingStage.FUNDING:
      return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case FundingStage.FUNDED:
      return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case FundingStage.ACTIVE:
      return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case FundingStage.REPAID:
      return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    default:
      return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }
}

const hasWithdrawableFunds = (investment: PortfolioInvestment): boolean => {
  return investment.withdrawablePrincipal > 0n || investment.withdrawableInterest > 0n
}

const calculateReturnPercentage = (investment: PortfolioInvestment): number => {
  if (investment.investedAmount === 0n) return 0

  const totalEarnings = investment.entitledPrincipal + investment.entitledInterest
  return Number((totalEarnings * 10000n) / investment.investedAmount) / 100 // Basis points to percentage
}

const showWithdrawalOptions = () => {
  emit('withdrawal', props.investment, 'both')
}
</script>

<style scoped>
.investment-card-content {
  @apply relative;
}

.card-header {
  @apply flex justify-between items-start;
}

.status-badge {
  @apply flex-shrink-0 ml-4;
}

.metrics-grid {
  @apply grid-cols-2 gap-3;
}

.metric {
  @apply flex flex-col;
}

.card-actions {
  @apply flex gap-2 mt-4;
}

.progress-section {
  @apply mt-4;
}

/* Hover effects */
.investment-card-content:hover .metric p {
  @apply transition-colors duration-200;
}

/* Animation for new earnings */
@keyframes earnings-highlight {
  0% { background-color: rgba(34, 197, 94, 0.1); }
  100% { background-color: transparent; }
}

.earnings-breakdown.new-earnings {
  animation: earnings-highlight 3s ease-out;
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .investment-card-content {
    @apply bg-gray-800 border-gray-700;
  }
}

/* Responsive design */
@media (max-width: 640px) {
  .metrics-grid {
    @apply grid-cols-1 gap-2;
  }

  .card-actions {
    @apply flex-col;
  }
}
</style>
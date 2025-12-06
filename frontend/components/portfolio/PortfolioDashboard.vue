<template>
  <div class="portfolio-dashboard">
    <!-- Header -->
    <div class="portfolio-header">
      <div class="header-content">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Investment Portfolio
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Track your mortgage investments and earnings
        </p>
      </div>

      <!-- Connection Status -->
      <div class="connection-status">
        <div v-if="!isConnected" class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg">
          <p class="font-medium">Connect Wallet</p>
          <p class="text-sm">Please connect your wallet to view your portfolio</p>
        </div>

        <div v-else-if="isLoadingPortfolio" class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-lg flex items-center">
          <svg class="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading portfolio data...
        </div>

        <div v-else-if="!hasInvestments" class="bg-gray-100 border border-gray-400 text-gray-700 px-4 py-3 rounded-lg">
          <p class="font-medium">No Investments</p>
          <p class="text-sm">You haven't made any investments yet</p>
        </div>
      </div>
    </div>

    <!-- Portfolio Overview -->
    <PortfolioOverview
      v-if="hasInvestments"
      :portfolio-summary="portfolioSummary"
      :formatted-portfolio="formattedPortfolio"
      :last-update="lastPortfolioUpdate"
    />

    <!-- Main Content Grid -->
    <div v-if="hasInvestments" class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
      <!-- Left Column: Investments & Earnings -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Investments List -->
        <InvestmentList :investments="investments" />

        <!-- Earnings Section -->
        <EarningsSection
          :portfolio-earnings="portfolioEarnings"
          :formatted-portfolio="formattedPortfolio"
        />
      </div>

      <!-- Right Column: Withdrawal & History -->
      <div class="space-y-6">
        <!-- Withdrawal Interface -->
        <WithdrawalInterface
          v-if="hasWithdrawableFunds"
          :auto-refresh="true"
          @withdrawal-complete="handleWithdrawalComplete"
          @withdrawal-error="handleWithdrawalError"
        />

        <!-- Transaction History -->
        <TransactionHistory :transactions="earningsHistory" />
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="isConnected && !hasInvestments && !isLoadingPortfolio" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No investments yet</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Get started by investing in your first mortgage contract
      </p>
      <div class="mt-6">
        <NuxtLink
          to="/invest"
          class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Start Investing
        </NuxtLink>
      </div>
    </div>

    <!-- Error Display -->
    <ErrorAlert
      v-if="error"
      :error="error"
      @dismiss="handleErrorDismiss"
    />
  </div>
</template>

<script setup lang="ts">
import { usePortfolio } from '~/composables/usePortfolio'
import type { EarningsEvent } from '~/composables/usePortfolio'

// Portfolio data
const {
  investments,
  earningsHistory,
  portfolioSummary,
  portfolioEarnings,
  formattedPortfolio,
  isLoadingPortfolio,
  lastPortfolioUpdate,
  isConnected,
  isLoading,
  error,
  hasInvestments,
  hasWithdrawableFunds,
  withdrawPortfolioPrincipal,
  withdrawPortfolioInterest,
  withdrawPortfolioPayout
} = usePortfolio()

// Withdrawal handlers
const handleWithdrawalComplete = (hash: string, type: string, amount: bigint) => {
  // Show success notification
  console.log('Withdrawal completed:', { hash, type, amount })
  // The portfolio will automatically update via the usePortfolio composable
}

const handleWithdrawalError = (error: Error) => {
  // Show error notification - error is already handled by withdrawal components
  console.error('Withdrawal failed:', error)
}

const handleErrorDismiss = () => {
  // Error is handled by composable, just dismiss display
}
</script>

<style scoped>
.portfolio-dashboard {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8;
}

.portfolio-header {
  @apply flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4;
}

.connection-status {
  @apply flex-shrink-0;
}

/* Animations for real-time updates */
@keyframes highlight-new {
  0% { background-color: rgb(251 191 36); opacity: 0.3; }
  100% { background-color: transparent; opacity: 0; }
}

.portfolio-updated {
  animation: highlight-new 2s ease-out;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .portfolio-header {
    @apply flex-col items-start;
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .portfolio-dashboard {
    @apply bg-gray-900;
  }
}
</style>
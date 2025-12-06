<template>
  <div class="investment-list">
    <div class="list-header flex justify-between items-center mb-4">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        Your Investments
      </h3>
      <div class="investment-count text-sm text-gray-500 dark:text-gray-400">
        {{ investments.length }} investment{{ investments.length !== 1 ? 's' : '' }}
      </div>
    </div>

    <div class="investments-space">
      <!-- Investment Cards -->
      <div
        v-for="investment in investments"
        :key="investment.id"
        class="investment-card bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow duration-200"
      >
        <InvestmentCard :investment="investment" @details="showInvestmentDetails" />
      </div>

      <!-- Empty State -->
      <div v-if="investments.length === 0" class="text-center py-8">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No investments</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          You haven't invested in any mortgage contracts yet
        </p>
      </div>
    </div>

    <!-- Investment Details Modal -->
    <InvestmentDetailsModal
      v-if="selectedInvestment"
      :investment="selectedInvestment"
      @close="closeInvestmentDetails"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { PortfolioInvestment } from '~/composables/usePortfolio'
import InvestmentCard from './InvestmentCard.vue'
import InvestmentDetailsModal from './InvestmentDetailsModal.vue'

interface Props {
  investments: PortfolioInvestment[]
}

defineProps<Props>()

// Modal state
const selectedInvestment = ref<PortfolioInvestment | null>(null)

// Methods
const showInvestmentDetails = (investment: PortfolioInvestment) => {
  selectedInvestment.value = investment
}

const closeInvestmentDetails = () => {
  selectedInvestment.value = null
}
</script>

<style scoped>
.investment-list {
  @apply space-y-4;
}

.investments-space {
  @apply space-y-4;
}

.investment-card {
  @apply transition-all duration-200;
}

.investment-card:hover {
  @apply transform scale-[1.02];
}

/* Responsive grid for multiple investments */
@media (min-width: 768px) {
  .investments-space {
    @apply grid grid-cols-1 gap-4;
  }
}

@media (min-width: 1024px) {
  .investments-space {
    @apply grid-cols-2 gap-4;
  }
}
</style>
<template>
  <div v-if="investment" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="$emit('close')"></div>

      <!-- Modal panel -->
      <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
        <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <!-- Header -->
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  Investment Details
                </h3>
                <button
                  @click="$emit('close')"
                  class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                >
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <!-- Investment Info -->
              <div class="space-y-4">
                <!-- Contract Address -->
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div class="text-sm text-gray-600 dark:text-gray-400">Contract Address</div>
                  <div class="font-mono text-sm text-gray-900 dark:text-white mt-1">
                    {{ investment.contractAddress }}
                  </div>
                </div>

                <!-- Investment Metrics Grid -->
                <div class="grid grid-cols-2 gap-4">
                  <div class="bg-blue-50 dark:bg-blue-900 rounded-lg p-3">
                    <div class="text-sm text-blue-600 dark:text-blue-400">Invested Amount</div>
                    <div class="text-lg font-bold text-blue-900 dark:text-blue-100">
                      {{ formatUSDT(investment.investedAmount) }}
                    </div>
                  </div>

                  <div class="bg-green-50 dark:bg-green-900 rounded-lg p-3">
                    <div class="text-sm text-green-600 dark:text-green-400">Total Earnings</div>
                    <div class="text-lg font-bold text-green-900 dark:text-green-100">
                      {{ formatUSDT(investment.entitledPrincipal + investment.entitledInterest) }}
                    </div>
                  </div>

                  <div class="bg-purple-50 dark:bg-purple-900 rounded-lg p-3">
                    <div class="text-sm text-purple-600 dark:text-purple-400">Withdrawable</div>
                    <div class="text-lg font-bold text-purple-900 dark:text-purple-100">
                      {{ formatUSDT(investment.withdrawablePrincipal + investment.withdrawableInterest) }}
                    </div>
                  </div>

                  <div class="bg-amber-50 dark:bg-amber-900 rounded-lg p-3">
                    <div class="text-sm text-amber-600 dark:text-amber-400">Ownership</div>
                    <div class="text-lg font-bold text-amber-900 dark:text-amber-100">
                      {{ investment.sharePercentage.toFixed(2) }}%
                    </div>
                  </div>
                </div>

                <!-- Earnings Breakdown -->
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Earnings Breakdown</h4>
                  <div class="space-y-2">
                    <div class="flex justify-between">
                      <span class="text-sm text-gray-600 dark:text-gray-400">Principal Earned</span>
                      <span class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ formatUSDT(investment.entitledPrincipal) }}
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-sm text-gray-600 dark:text-gray-400">Interest Earned</span>
                      <span class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ formatUSDT(investment.entitledInterest) }}
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-sm text-gray-600 dark:text-gray-400">Principal Withdrawn</span>
                      <span class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ formatUSDT(investment.investedAmount - investment.withdrawablePrincipal) }}
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-sm text-gray-600 dark:text-gray-400">Interest Withdrawn</span>
                      <span class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ formatUSDT(investment.entitledInterest - investment.withdrawableInterest) }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Status Info -->
                <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Status</div>
                    <div class="font-medium text-gray-900 dark:text-white">
                      {{ getStageName(investment.fundingStage) }}
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm text-gray-600 dark:text-gray-400">Last Updated</div>
                    <div class="font-medium text-gray-900 dark:text-white">
                      {{ formatDate(investment.lastUpdated) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            @click="$emit('close')"
            type="button"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatUSDT, getStageName } from '~/utils/contract/constants'
import type { PortfolioInvestment } from '~/composables/usePortfolio'

interface Props {
  investment: PortfolioInvestment | null
}

defineProps<Props>()
defineEmits<{
  close: []
}>()

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString()
}
</script>

<style scoped>
/* Modal backdrop blur effect */
.fixed.inset-0 {
  backdrop-filter: blur(4px);
}

/* Modal animation */
@keyframes modal-slide-in {
  from {
    opacity: 0;
    transform: translate(0, -20px);
  }
  to {
    opacity: 1;
    transform: translate(0, 0);
  }
}

.inline-block.align-bottom {
  animation: modal-slide-in 0.3s ease-out;
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .bg-gray-50 {
    @apply bg-gray-700;
  }
}
</style>
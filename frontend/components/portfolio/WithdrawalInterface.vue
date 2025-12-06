<template>
  <div class="withdrawal-interface">
    <div class="interface-header mb-4">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        Withdraw Funds
      </h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        Withdraw your available earnings
      </p>
    </div>

    <!-- Available Funds Display -->
    <div class="available-funds bg-blue-50 dark:bg-blue-900 rounded-lg p-4 mb-4">
      <div class="space-y-2">
        <div class="flex justify-between items-center">
          <span class="text-sm font-medium text-blue-800 dark:text-blue-200">Available Principal</span>
          <span class="text-sm font-bold text-blue-900 dark:text-blue-100">
            {{ formatUSDT(withdrawablePrincipal) }}
          </span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-sm font-medium text-blue-800 dark:text-blue-200">Available Interest</span>
          <span class="text-sm font-bold text-blue-900 dark:text-blue-100">
            {{ formatUSDT(withdrawableInterest) }}
          </span>
        </div>
        <div class="flex justify-between items-center pt-2 border-t border-blue-200 dark:border-blue-700">
          <span class="text-sm font-bold text-blue-800 dark:text-blue-200">Total Available</span>
          <span class="text-lg font-bold text-blue-900 dark:text-blue-100">
            {{ formatUSDT(withdrawablePrincipal + withdrawableInterest) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Quick Withdrawal Options -->
    <div class="quick-actions grid grid-cols-2 gap-2 mb-4">
      <button
        v-if="withdrawablePrincipal > 0n"
        @click="quickWithdrawPrincipal"
        :disabled="isLoading"
        class="quick-action-btn px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <svg class="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
        </svg>
        Principal
      </button>

      <button
        v-if="withdrawableInterest > 0n"
        @click="quickWithdrawInterest"
        :disabled="isLoading"
        class="quick-action-btn px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        <svg class="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
        Interest
      </button>

      <button
        v-if="hasBothFunds"
        @click="quickWithdrawAll"
        :disabled="isLoading"
        class="quick-action-btn col-span-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
      >
        <svg class="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Withdraw All
      </button>
    </div>

    <!-- Custom Withdrawal Form -->
    <div class="custom-withdrawal">
      <button
        @click="toggleCustomForm"
        class="custom-form-toggle w-full px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <span class="flex items-center justify-between">
          Custom Withdrawal Amount
          <svg
            :class="{ 'rotate-180': showCustomForm }"
            class="w-4 h-4 transition-transform duration-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      <div v-if="showCustomForm" class="custom-form mt-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <form @submit.prevent="handleCustomWithdrawal" class="space-y-4">
          <!-- Principal Amount -->
          <div v-if="withdrawablePrincipal > 0n">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Principal Amount (USDT)
            </label>
            <input
              v-model="customPrincipalAmount"
              type="number"
              step="0.01"
              min="0"
              :max="formatUSDT(withdrawablePrincipal)"
              placeholder="0.00"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            />
            <div class="flex justify-between mt-1">
              <span class="text-xs text-gray-500">Available: {{ formatUSDT(withdrawablePrincipal) }}</span>
              <button
                type="button"
                @click="customPrincipalAmount = formatUSDT(withdrawablePrincipal)"
                class="text-xs text-blue-600 hover:text-blue-700"
              >
                Max
              </button>
            </div>
          </div>

          <!-- Interest Amount -->
          <div v-if="withdrawableInterest > 0n">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Interest Amount (USDT)
            </label>
            <input
              v-model="customInterestAmount"
              type="number"
              step="0.01"
              min="0"
              :max="formatUSDT(withdrawableInterest)"
              placeholder="0.00"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            />
            <div class="flex justify-between mt-1">
              <span class="text-xs text-gray-500">Available: {{ formatUSDT(withdrawableInterest) }}</span>
              <button
                type="button"
                @click="customInterestAmount = formatUSDT(withdrawableInterest)"
                class="text-xs text-green-600 hover:text-green-700"
              >
                Max
              </button>
            </div>
          </div>

          <!-- Transaction Summary -->
          <div v-if="totalCustomAmount > 0" class="transaction-summary bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-600">
            <div class="space-y-1 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Principal:</span>
                <span class="font-medium">{{ customPrincipalAmount || '0.00' }} USDT</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Interest:</span>
                <span class="font-medium">{{ customInterestAmount || '0.00' }} USDT</span>
              </div>
              <div class="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                <span class="font-bold text-gray-900 dark:text-white">Total:</span>
                <span class="font-bold text-gray-900 dark:text-white">{{ totalCustomAmount }} USDT</span>
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isLoading || !isValidCustomAmount"
            class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <span v-if="isLoading" class="flex items-center justify-center">
              <svg class="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
            <span v-else>Withdraw Funds</span>
          </button>
        </form>
      </div>
    </div>

    <!-- Transaction History Preview -->
    <div v-if="recentTransactions.length > 0" class="recent-transactions mt-4">
      <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recent Withdrawals</h4>
      <div class="space-y-2">
        <div
          v-for="tx in recentTransactions.slice(0, 3)"
          :key="tx.id"
          class="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded"
        >
          <div class="flex items-center">
            <div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span class="text-gray-900 dark:text-white">{{ formatUSDT(tx.amount) }}</span>
          </div>
          <div class="text-gray-500 dark:text-gray-400">
            {{ formatTimeAgo(tx.timestamp) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatUSDT, parseUSDT } from '~/utils/contract/constants'
import type { EarningsEvent } from '~/composables/usePortfolio'

interface Props {
  withdrawablePrincipal: bigint
  withdrawableInterest: bigint
  isLoading: boolean
  recentTransactions?: EarningsEvent[]
}

const props = withDefaults(defineProps<Props>(), {
  recentTransactions: () => []
})

const emit = defineEmits<{
  'withdraw-principal': [amount: bigint]
  'withdraw-interest': [amount: bigint]
  'withdraw-both': [principalAmount: bigint, interestAmount: bigint]
}>()

// Form state
const showCustomForm = ref(false)
const customPrincipalAmount = ref('')
const customInterestAmount = ref('')

// Computed properties
const hasBothFunds = computed(() => props.withdrawablePrincipal > 0n && props.withdrawableInterest > 0n)

const totalCustomAmount = computed(() => {
  const principal = customPrincipalAmount.value ? parseFloat(customPrincipalAmount.value) : 0
  const interest = customInterestAmount.value ? parseFloat(customInterestAmount.value) : 0
  return (principal + interest).toFixed(2)
})

const isValidCustomAmount = computed(() => {
  const principal = customPrincipalAmount.value ? parseFloat(customPrincipalAmount.value) : 0
  const interest = customInterestAmount.value ? parseFloat(customInterestAmount.value) : 0

  if (principal < 0 || interest < 0) return false
  if (principal * 1000000 > props.withdrawablePrincipal) return false
  if (interest * 1000000 > props.withdrawableInterest) return false
  return principal > 0 || interest > 0
})

// Methods
const toggleCustomForm = () => {
  showCustomForm.value = !showCustomForm.value
}

const quickWithdrawPrincipal = () => {
  if (props.withdrawablePrincipal > 0n) {
    emit('withdraw-principal', props.withdrawablePrincipal)
  }
}

const quickWithdrawInterest = () => {
  if (props.withdrawableInterest > 0n) {
    emit('withdraw-interest', props.withdrawableInterest)
  }
}

const quickWithdrawAll = () => {
  if (props.withdrawablePrincipal > 0n || props.withdrawableInterest > 0n) {
    emit('withdraw-both', props.withdrawablePrincipal, props.withdrawableInterest)
  }
}

const handleCustomWithdrawal = () => {
  if (!isValidCustomAmount.value) return

  const principalAmount = customPrincipalAmount.value ? parseUSDT(customPrincipalAmount.value) : 0n
  const interestAmount = customInterestAmount.value ? parseUSDT(customInterestAmount.value) : 0n

  if (principalAmount > 0n && interestAmount > 0n) {
    emit('withdraw-both', principalAmount, interestAmount)
  } else if (principalAmount > 0n) {
    emit('withdraw-principal', principalAmount)
  } else if (interestAmount > 0n) {
    emit('withdraw-interest', interestAmount)
  }

  // Reset form
  customPrincipalAmount.value = ''
  customInterestAmount.value = ''
  showCustomForm.value = false
}

const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp

  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return new Date(timestamp).toLocaleDateString()
}
</script>

<style scoped>
.withdrawal-interface {
  @apply space-y-4;
}

.quick-action-btn {
  @apply flex items-center justify-center;
}

.custom-form-toggle {
  @apply flex items-center justify-between;
}

.custom-form {
  @apply space-y-4;
}

.recent-transactions {
  @apply border-t border-gray-200 dark:border-gray-700 pt-4;
}

/* Loading states */
.custom-form input:disabled {
  @apply bg-gray-100 dark:bg-gray-600 cursor-not-allowed;
}

/* Focus states */
.custom-form input:focus {
  @apply outline-none ring-2 ring-blue-500 border-transparent;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .quick-actions {
    @apply grid-cols-1;
  }
}
</style>
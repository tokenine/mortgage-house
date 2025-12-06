<template>
  <div class="investment-display">
    <!-- Funding Progress Section -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Investment Opportunity</h2>

      <!-- Progress Bar -->
      <div class="mb-4">
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm font-medium text-gray-700">Funding Progress</span>
          <span class="text-sm font-medium text-gray-900">{{ fundingProgress.toFixed(1) }}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-3">
          <div
            class="bg-blue-600 h-3 rounded-full transition-all duration-300"
            :style="{ width: `${fundingProgress}%` }"
          ></div>
        </div>
        <div class="flex justify-between mt-2">
          <span class="text-sm text-gray-600">
            {{ formattedTotalInvested }} USDT
          </span>
          <span class="text-sm text-gray-600">
            of {{ formattedFundingTarget }} USDT
          </span>
        </div>
      </div>

      <!-- Contract Statistics -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-gray-50 rounded p-3">
          <div class="text-xs text-gray-500 uppercase tracking-wider">Investors</div>
          <div class="text-lg font-semibold text-gray-900">{{ investorCount }}</div>
        </div>
        <div class="bg-gray-50 rounded p-3">
          <div class="text-xs text-gray-500 uppercase tracking-wider">Remaining</div>
          <div class="text-lg font-semibold text-gray-900">{{ formattedRemaining }} USDT</div>
        </div>
        <div class="bg-gray-50 rounded p-3">
          <div class="text-xs text-gray-500 uppercase tracking-wider">Stage</div>
          <div class="text-lg font-semibold text-gray-900">{{ stageName }}</div>
        </div>
        <div class="bg-gray-50 rounded p-3">
          <div class="text-xs text-gray-500 uppercase tracking-wider">Min Investment</div>
          <div class="text-lg font-semibold text-gray-900">1 USDT</div>
        </div>
      </div>
    </div>

    <!-- Investment Form -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h3 class="text-xl font-bold text-gray-900 mb-4">Invest Now</h3>

      <!-- Your Position (if already invested) -->
      <div v-if="hasInvested" class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div class="flex items-center mb-2">
          <svg class="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          <span class="font-semibold text-blue-900">Your Investment</span>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <div class="text-sm text-blue-700">Shares Owned</div>
            <div class="text-lg font-semibold text-blue-900">{{ formattedUserShares }} USDT</div>
          </div>
          <div>
            <div class="text-sm text-blue-700">Ownership</div>
            <div class="text-lg font-semibold text-blue-900">{{ userSharePercentage.toFixed(2) }}%</div>
          </div>
        </div>
      </div>

      <!-- Investment Input -->
      <form @submit.prevent="handleInvest" class="space-y-4">
        <div>
          <label for="amount" class="block text-sm font-medium text-gray-700 mb-2">
            Investment Amount (USDT)
          </label>
          <div class="relative">
            <input
              id="amount"
              v-model="investmentAmount"
              type="number"
              step="0.01"
              min="1"
              :max="maxInvestment"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 pr-20"
              placeholder="Enter USDT amount"
              :disabled="!canInvest"
              @input="validateAmount"
            />
            <span class="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
              USDT
            </span>
          </div>

          <!-- Investment Validation Messages -->
          <div v-if="validationMessage" class="mt-1 text-sm" :class="validationClass">
            {{ validationMessage }}
          </div>

          <!-- Real-time Calculation -->
          <div v-if="amount > 0 && isValidAmount" class="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <div class="text-sm text-green-700">
              <div class="flex justify-between mb-1">
                <span>Shares you'll receive:</span>
                <span class="font-semibold">{{ formattedInvestmentAmount }} USDT</span>
              </div>
              <div class="flex justify-between mb-1">
                <span>Current ownership:</span>
                <span class="font-semibold">{{ userSharePercentage.toFixed(2) }}%</span>
              </div>
              <div class="flex justify-between">
                <span>Ownership after investment:</span>
                <span class="font-semibold">{{ projectedOwnership.toFixed(2) }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Enhanced Gas Analysis -->
        <GasAnalysis
          v-if="gasAnalysis && isValidAmount"
          :investment-amount="amount"
          :gas-estimate="gasAnalysis.gasEstimate"
          :suggestions="gasAnalysis.suggestions"
          :timing-suggestions="gasAnalysis.timingSuggestions"
          :cost-breakdown="gasAnalysis.costBreakdown"
          @speed-changed="handleSpeedChange"
          @suggestion-applied="handleSuggestionApplied"
          class="mb-4"
        />

        <!-- Gas Alerts -->
        <GasAlert
          v-if="gasAnalysis && isValidAmount"
          :gas-estimate="gasAnalysis.gasEstimate"
          :current-gas-price="currentGasPrice"
          :network-status="gasAnalysis.gasEstimate.networkStatus"
          :show-tips="!gasAnalysis.isOptimal"
          @wait-for-lower-gas="handleWaitForLowerGas"
          @use-slower-speed="handleUseSlowerSpeed"
          @proceed-anyway="handleProceedAnyway"
          class="mb-4"
        />

        <!-- Balance Display -->
        <div v-if="isConnected" class="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div class="flex justify-between items-center">
            <span class="text-sm text-blue-700">Available USDT Balance:</span>
            <span class="font-semibold text-blue-900">{{ formattedUsdtBalance }} USDT</span>
          </div>
        </div>

        <!-- Investment Button -->
        <button
          type="submit"
          :disabled="!canSubmitInvestment"
          class="w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg v-if="isPending" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
          </svg>
          {{ isPending ? 'Investing...' : `Invest ${formattedInvestmentAmount} USDT` }}
        </button>
      </form>
    </div>

    <!-- Transaction Success Modal -->
    <div v-if="showSuccessModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3 text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg class="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
          </div>
          <h3 class="text-lg leading-6 font-medium text-gray-900">Investment Successful!</h3>
          <div class="mt-2 px-7 py-3">
            <p class="text-sm text-gray-500">
              You have successfully invested {{ formattedInvestmentAmount }} USDT and received {{ formattedInvestmentAmount }} shares.
            </p>
            <div class="mt-4 text-left">
              <div class="flex justify-between mb-2">
                <span class="text-sm font-medium text-gray-700">Transaction:</span>
                <a
                  :href="blockExplorerUrl"
                  target="_blank"
                  class="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  View on Explorer
                </a>
              </div>
              <div class="flex justify-between">
                <span class="text-sm font-medium text-gray-700">Your Ownership:</span>
                <span class="text-sm font-semibold text-gray-900">{{ userSharePercentage.toFixed(2) }}%</span>
              </div>
            </div>
          </div>
          <div class="items-center px-4 py-3">
            <button
              @click="showSuccessModal = false"
              class="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Post-Transaction Analysis -->
    <div v-if="showPostTransactionAnalysis && postTransactionData" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-10 mx-auto p-5 max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div class="mt-3">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl leading-6 font-medium text-gray-900">Transaction Analysis</h3>
            <button
              @click="showPostTransactionAnalysis = false"
              class="text-gray-400 hover:text-gray-600"
            >
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </button>
          </div>

          <PostTransactionAnalysis
            :analysis="postTransactionData"
            :transaction-hash="lastTransactionHash"
            @view-on-etherscan="handleViewOnEtherscan"
            @make-another-investment="handleMakeAnotherInvestment"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useMortgageContract } from '~/composables/useMortgageContract'
import { useReadContract } from '@wagmi/vue'
import { MORTGAGE_CONTRACT_ABI } from '~/utils/contract/constants'
import { parseUSDT, formatUSDT } from '~/utils/contract/constants'
import GasAnalysis from '~/components/GasAnalysis.vue'
import GasAlert from '~/components/GasAlert.vue'
import PostTransactionAnalysis from '~/components/PostTransactionAnalysis.vue'
import type { GasOptimizationSuggestions } from '~/composables/useGasOptimization'

// Composable
const {
  isConnected,
  totalInvested,
  totalShares,
  investorShares,
  investorCount,
  fundingStage,
  usdtBalance,
  usdtAllowance,
  invest,
  isPending,
  error,
  refreshData,
  formatAmount,
  formatPercentage,
  getGasEstimate,
  analyzeInvestmentGas,
  selectedSpeed,
  networkStatus,
  analyzePostTransaction
} = useMortgageContract()

// Local state
const investmentAmount = ref<string>('')
const gasAnalysis = ref<any>(null)
const showSuccessModal = ref(false)
const lastTransactionHash = ref<string>('')
const showPostTransactionAnalysis = ref(false)
const postTransactionData = ref<any>(null)

// Computed properties
const amount = computed(() => {
  return investmentAmount.value ? parseUSDT(investmentAmount.value) : 0n
})

const formattedInvestmentAmount = computed(() => {
  return investmentAmount.value ? parseFloat(investmentAmount.value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) : '0.00'
})

const formattedTotalInvested = computed(() => {
  return formatUSDT(totalInvested.value)
})

const formattedFundingTarget = computed(() => {
  const target = loanAmount.value || 100000n * 10n**6n
  return formatUSDT(target)
})

const formattedRemaining = computed(() => {
  const target = loanAmount.value || 100000n * 10n**6n
  const remaining = target - totalInvested.value
  return formatUSDT(remaining)
})

const formattedUsdtBalance = computed(() => {
  return formatUSDT(usdtBalance.value)
})

const formattedUserShares = computed(() => {
  return formatUSDT(investorShares.value)
})

const userSharePercentage = computed(() => {
  if (!totalShares.value || totalShares.value === 0n) return 0
  return Number((investorShares.value * 10000n) / totalShares.value) / 100
})

const hasInvested = computed(() => {
  return investorShares.value > 0n
})

// Get loan amount from contract
const { data: loanAmount } = useReadContract({
  address: contractAddress.value,
  abi: MORTGAGE_CONTRACT_ABI,
  functionName: 'loanAmount'
})

const fundingProgress = computed(() => {
  if (!totalInvested.value) return 0
  const target = loanAmount.value || 100000n * 10n**6n // fallback to 100k USDT if not loaded
  return Number((totalInvested.value * 100n) / target)
})

const stageName = computed(() => {
  const stages = ['Not Started', 'Funding', 'Funded', 'Active', 'Repaid']
  return stages[fundingStage.value] || 'Unknown'
})

const maxInvestment = computed(() => {
  const target = loanAmount.value || 100000n * 10n**6n
  const remaining = target - totalInvested.value
  return Number(remaining) / Number(10n**6n)
})

const canInvest = computed(() => {
  return isConnected.value && fundingStage.value === 1 // FUNDING stage
})

const projectedOwnership = computed(() => {
  if (!amount.value) return userSharePercentage.value

  const newTotalShares = totalShares.value + amount.value
  const newUserShares = investorShares.value + amount.value

  return Number((newUserShares * 10000n) / newTotalShares) / 100
})

// Validation
const isValidAmount = computed(() => {
  const num = parseFloat(investmentAmount.value)
  return !isNaN(num) && num >= 1 && num <= maxInvestment.value
})

const validationMessage = computed(() => {
  const num = parseFloat(investmentAmount.value)

  if (!investmentAmount.value) return ''
  if (isNaN(num)) return 'Please enter a valid number'
  if (num < 1) return 'Minimum investment is 1 USDT'
  if (num > maxInvestment.value) return 'Exceeds available funding capacity'
  if (usdtBalance.value && amount.value > usdtBalance.value) return 'Insufficient USDT balance'

  return ''
})

const validationClass = computed(() => {
  if (!validationMessage.value) return ''
  return validationMessage.value.includes('exceeds') || validationMessage.value.includes('Insufficient')
    ? 'text-red-600'
    : 'text-blue-600'
})

const canSubmitInvestment = computed(() => {
  return isValidAmount.value &&
         isConnected.value &&
         !isPending.value &&
         amount.value > 0 &&
         (!usdtBalance.value || amount.value <= usdtBalance.value)
})

const blockExplorerUrl = computed(() => {
  if (!lastTransactionHash.value) return '#'
  return `https://etherscan.io/tx/${lastTransactionHash.value}`
})

const currentGasPrice = computed(() => {
  // This would come from the gas optimization composable
  // For now, return a placeholder
  return null
})

// Methods
const validateAmount = () => {
  // Additional client-side validation if needed
  if (isValidAmount.value && amount.value > 0) {
    updateGasEstimate()
  } else {
    gasEstimate.value = null
  }
}

const updateGasEstimate = async () => {
  try {
    gasAnalysis.value = await analyzeInvestmentGas(amount.value)
  } catch (err) {
    console.error('Failed to get gas analysis:', err)
    gasAnalysis.value = null
  }
}

const handleInvest = async () => {
  if (!isValidAmount.value || !amount.value) return

  try {
    const txHash = await invest(amount.value)
    lastTransactionHash.value = txHash

    // Perform post-transaction analysis
    if (gasAnalysis.value?.gasEstimate) {
      try {
        postTransactionData.value = await analyzePostTransaction(txHash, gasAnalysis.value.gasEstimate)
        showPostTransactionAnalysis.value = true
      } catch (analysisError) {
        console.error('Post-transaction analysis failed:', analysisError)
      }
    }

    // Reset form
    investmentAmount.value = ''
    gasAnalysis.value = null

    // Show success modal
    showSuccessModal.value = true

    // Refresh data
    await refreshData()
  } catch (err) {
    console.error('Investment failed:', err)
    // Error is already handled by the composable
  }
}

// Gas optimization event handlers
const handleSpeedChange = (speed: string) => {
  // Update gas estimate with new speed
  if (amount.value > 0) {
    updateGasEstimate()
  }
}

const handleSuggestionApplied = (suggestion: GasOptimizationSuggestions) => {
  // Handle different suggestion types
  switch (suggestion.type) {
    case 'speed':
      // Would apply speed change
      break
    case 'investment-size':
      // Would suggest a different investment amount
      break
    case 'timing':
      // Would show timing recommendations
      break
    case 'batch':
      // Would show batch investment options
      break
  }
}

const handleWaitForLowerGas = () => {
  // Implementation for waiting notification
  console.log('User chose to wait for lower gas prices')
}

const handleUseSlowerSpeed = () => {
  // Change to slower speed
  handleSpeedChange('slow')
}

const handleProceedAnyway = () => {
  // Continue with current gas prices
  console.log('User chose to proceed with current gas prices')
}

const handleViewOnEtherscan = () => {
  if (lastTransactionHash.value) {
    window.open(blockExplorerUrl.value, '_blank')
  }
}

const handleMakeAnotherInvestment = () => {
  showPostTransactionAnalysis.value = false
  showSuccessModal.value = false
  // Reset form for new investment
  investmentAmount.value = ''
  gasAnalysis.value = null
}

// Watchers
watch(investmentAmount, validateAmount)

// Lifecycle
onMounted(() => {
  refreshData()
})
</script>
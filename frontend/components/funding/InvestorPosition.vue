<template>
  <div class="investor-position">
    <!-- Only show if investor has shares -->
    <div v-if="hasPosition" class="bg-white rounded-lg shadow-md p-6 mb-6">
      <div class="flex justify-between items-center mb-6">
        <h4 class="text-lg font-bold text-gray-900">Your Position</h4>
        <div class="flex items-center">
          <div
            class="w-2 h-2 rounded-full mr-2"
            :class="isPositionLocked ? 'bg-yellow-400' : 'bg-green-400'"
          ></div>
          <span class="text-sm text-gray-600">
            {{ isPositionLocked ? 'Position Locked' : 'Active' }}
          </span>
        </div>
      </div>

      <!-- Position Overview -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-blue-600 font-medium">Shares Owned</span>
            <svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
            </svg>
          </div>
          <div class="text-xl font-bold text-blue-900">{{ formattedShares }}</div>
          <div class="text-xs text-blue-600 mt-1">USDT worth of shares</div>
        </div>

        <div class="bg-green-50 rounded-lg p-4 border border-green-100">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-green-600 font-medium">Ownership</span>
            <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="text-xl font-bold text-green-900">{{ ownershipPercentage }}%</div>
          <div class="text-xs text-green-600 mt-1">of total shares</div>
        </div>

        <div class="bg-purple-50 rounded-lg p-4 border border-purple-100">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-purple-600 font-medium">Projected Returns</span>
            <svg class="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="text-xl font-bold text-purple-900">{{ formattedProjectedReturns }}</div>
          <div class="text-xs text-purple-600 mt-1">est. annual return</div>
        </div>

        <div class="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-yellow-600 font-medium">Investment Date</span>
            <svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="text-xl font-bold text-yellow-900">{{ investmentDate }}</div>
          <div class="text-xs text-yellow-600 mt-1">days ago</div>
        </div>
      </div>

      <!-- Position Lock Status -->
      <div v-if="isPositionLocked" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div class="flex items-start">
          <svg class="w-5 h-5 text-yellow-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
          </svg>
          <div class="flex-1">
            <h5 class="font-semibold text-yellow-800 mb-1">Position Locked</h5>
            <p class="text-sm text-yellow-700 leading-relaxed">
              Your investment is locked for the {{ lockDuration }} {{ lockType }}.
              Returns will be available upon loan repayment.
            </p>
            <div class="mt-2 flex items-center text-sm text-yellow-600">
              <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
              </svg>
              <span>Expected unlock: {{ expectedUnlockDate }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Detailed Breakdown -->
      <div class="border-t border-gray-200 pt-4">
        <div class="flex justify-between items-center mb-4">
          <h5 class="text-sm font-semibold text-gray-900">Investment Breakdown</h5>
          <button
            @click="showBreakdown = !showBreakdown"
            class="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
          >
            {{ showBreakdown ? 'Hide' : 'Show' }} Details
            <svg
              class="w-4 h-4 ml-1 transform transition-transform"
              :class="{ 'rotate-180': showBreakdown }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
        </div>

        <div v-if="showBreakdown" class="space-y-3">
          <!-- Principal -->
          <div class="flex justify-between items-center py-2 border-b border-gray-100">
            <span class="text-sm text-gray-600">Principal Invested</span>
            <span class="text-sm font-medium text-gray-900">{{ formattedPrincipal }}</span>
          </div>

          <!-- Interest Earned -->
          <div class="flex justify-between items-center py-2 border-b border-gray-100">
            <span class="text-sm text-gray-600">Interest Earned to Date</span>
            <span class="text-sm font-medium text-green-600">{{ formattedInterestEarned }}</span>
          </div>

          <!-- Current Value -->
          <div class="flex justify-between items-center py-2 border-b border-gray-100">
            <span class="text-sm text-gray-600">Current Value</span>
            <span class="text-sm font-medium text-gray-900">{{ formattedCurrentValue }}</span>
          </div>

          <!-- Performance -->
          <div class="flex justify-between items-center py-2">
            <span class="text-sm text-gray-600">Performance</span>
            <span
              class="text-sm font-medium"
              :class="performanceClass"
            >
              {{ performanceText }}
            </span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="mt-6 flex space-x-3">
        <button
          v-if="canWithdraw"
          @click="$emit('withdraw')"
          class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
        >
          Withdraw Returns
        </button>

        <button
          v-if="canTransfer"
          @click="$emit('transfer')"
          class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          Transfer Shares
        </button>

        <button
          @click="$emit('details')"
          class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
        >
          View Details
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-white rounded-lg shadow-md p-6 mb-6">
      <div class="text-center py-8">
        <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
        </svg>
        <h5 class="text-lg font-medium text-gray-900 mb-2">No Investment Position</h5>
        <p class="text-gray-600 mb-4">You haven't invested in this mortgage yet.</p>
        <button
          @click="$emit('invest')"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          Invest Now
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMortgageContract } from '~/composables/useMortgageContract'
import { formatUSDT } from '~/utils/contract/constants'

// Props
interface Props {
  investmentDate?: Date
  projectedReturnRate?: number
  lockDuration?: number
  lockType?: string
  canWithdraw?: boolean
  canTransfer?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  projectedReturnRate: 5, // 5% annual return
  lockDuration: 365,
  lockType: 'days',
  canWithdraw: false,
  canTransfer: false
})

// Composable
const {
  isConnected,
  investorShares,
  totalShares,
  fundingStage
} = useMortgageContract()

// Local state
const showBreakdown = ref(false)

// Computed properties
const hasPosition = computed(() => {
  return isConnected.value && investorShares.value > 0n
})

const formattedShares = computed(() => {
  return formatUSDT(investorShares.value)
})

const ownershipPercentage = computed(() => {
  if (!totalShares.value || totalShares.value === 0n) return 0
  return Number((investorShares.value * 10000n) / totalShares.value) / 100
})

const formattedProjectedReturns = computed(() => {
  if (!investorShares.value) return '0.00'
  const annualReturn = (investorShares.value * BigInt(Math.floor(props.projectedReturnRate * 100))) / 10000n
  return formatUSDT(annualReturn)
})

const isPositionLocked = computed(() => {
  return fundingStage.value > 1 // Lock after FUNDING stage
})

const investmentDate = computed(() => {
  // For demo purposes, show days since investment
  return props.investmentDate
    ? Math.floor((Date.now() - props.investmentDate.getTime()) / (1000 * 60 * 60 * 24))
    : 30
})

const expectedUnlockDate = computed(() => {
  // For demo purposes, calculate when position might unlock
  const unlockDate = new Date()
  unlockDate.setDate(unlockDate.getDate() + props.lockDuration)
  return unlockDate.toLocaleDateString()
})

// Additional calculated values
const formattedPrincipal = computed(() => {
  return formatUSDT(investorShares.value)
})

const formattedInterestEarned = computed(() => {
  // Simulate some interest earned (would come from actual contract data)
  const daysSinceInvestment = investmentDate.value
  const dailyRate = props.projectedReturnRate / 365
  const earnedAmount = Number(investorShares.value) / 1e6 * (dailyRate / 100) * daysSinceInvestment
  return earnedAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
})

const formattedCurrentValue = computed(() => {
  const principal = Number(investorShares.value) / 1e6
  const interest = parseFloat(formattedInterestEarned.value.replace(/,/g, ''))
  return (principal + interest).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
})

const performanceClass = computed(() => {
  const performance = parseFloat(formattedInterestEarned.value.replace(/,/g, ''))
  return performance > 0 ? 'text-green-600' : performance < 0 ? 'text-red-600' : 'text-gray-600'
})

const performanceText = computed(() => {
  const performance = parseFloat(formattedInterestEarned.value.replace(/,/g, ''))
  if (performance > 0) return `+${formattedInterestEarned.value} (+${((performance / Number(investorShares.value) * 1e6) * 100).toFixed(2)}%)`
  if (performance < 0) return `${formattedInterestEarned.value} (${((performance / Number(investorShares.value) * 1e6) * 100).toFixed(2)}%)`
  return 'No change'
})

// Emits
const emit = defineEmits<{
  'withdraw': []
  'transfer': []
  'details': []
  'invest': []
}>()
</script>

<style scoped>
.investor-position {
  @apply space-y-4;
}
</style>
<template>
  <div class="gas-analysis">
    <!-- Gas Cost Breakdown -->
    <UCard class="mb-4">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Transaction Cost Analysis</h3>
          <UBadge
            :color="networkStatusColor"
            :label="networkStatusLabel"
            variant="soft"
          />
        </div>
      </template>

      <div class="space-y-4">
        <!-- Investment Amount -->
        <div class="flex justify-between items-center py-2 border-b">
          <span class="text-gray-600">Investment Amount:</span>
          <span class="font-medium">{{ formatUSDT(investmentAmount) }}</span>
        </div>

        <!-- Gas Cost -->
        <div class="flex justify-between items-center py-2 border-b">
          <span class="text-gray-600">Estimated Gas Cost:</span>
          <div class="text-right">
            <span class="font-medium">{{ gasEstimate?.gasCostETH }} ETH</span>
            <div class="text-sm text-gray-500">{{ gasEstimate?.gasCostUSD }}</div>
          </div>
        </div>

        <!-- Network Status Alert -->
        <UAlert
          v-if="gasEstimate && !gasEstimate.isWithinThreshold"
          icon="i-heroicons-exclamation-triangle"
          color="amber"
          title="High Gas Costs"
          description="Gas costs are unusually high. Consider waiting or investing larger amounts."
          class="mb-4"
        />

        <!-- Transaction Speed Options -->
        <div>
          <h4 class="text-md font-medium mb-3">Transaction Speed</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div
              v-for="(option, key) in gasSpeedOptions"
              :key="key"
              :class="[
                'border rounded-lg p-3 cursor-pointer transition-all',
                selectedSpeed === key
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              ]"
              @click="selectSpeed(key)"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium">{{ option.label }}</span>
                <URadio
                  v-model="selectedSpeed"
                  :value="key"
                  name="speed"
                />
              </div>
              <div class="text-sm text-gray-600">{{ option.description }}</div>
              <div class="text-sm text-green-600 mt-1">Savings: {{ option.savings }}</div>
            </div>
          </div>
        </div>

        <!-- Total Cost -->
        <div class="bg-gray-50 rounded-lg p-4 mt-4">
          <div class="flex justify-between items-center">
            <span class="text-lg font-medium">Total Transaction Cost:</span>
            <span class="text-lg font-bold text-primary-600">
              {{ totalCost }}
            </span>
          </div>
          <div class="text-sm text-gray-600 mt-1">
            Gas represents {{ costBreakdown?.costComparison.gasImpact }} of total cost
          </div>
        </div>
      </div>
    </UCard>

    <!-- Gas Optimization Suggestions -->
    <UCard
      v-if="suggestions && suggestions.length > 0"
      class="mb-4"
    >
      <template #header>
        <h3 class="text-lg font-semibold">Gas Optimization Suggestions</h3>
      </template>

      <div class="space-y-3">
        <div
          v-for="(suggestion, index) in suggestions"
          :key="index"
          class="flex items-start space-x-3 p-3 border rounded-lg"
          :class="getSuggestionStyle(suggestion.impact)"
        >
          <UIcon
            :name="getSuggestionIcon(suggestion.impact)"
            class="mt-0.5"
          />
          <div class="flex-1">
            <div class="font-medium">{{ suggestion.message }}</div>
            <div class="text-sm text-gray-600 mt-1">
              Potential savings: {{ suggestion.savings }}
            </div>
          </div>
          <UButton
            v-if="suggestion.actionable"
            size="xs"
            variant="soft"
            @click="applySuggestion(suggestion)"
          >
            Apply
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Timing Suggestions -->
    <UCard v-if="timingSuggestions">
      <template #header>
        <h3 class="text-lg font-semibold">Optimal Timing</h3>
      </template>

      <div class="space-y-3">
        <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div>
            <div class="font-medium">Current Time Status</div>
            <div class="text-sm text-gray-600">{{ timingSuggestions.recommendation }}</div>
          </div>
          <div
            :class="[
              'w-3 h-3 rounded-full',
              timingSuggestions.currentOptimal ? 'bg-green-500' : 'bg-amber-500'
            ]"
          />
        </div>

        <div>
          <div class="font-medium mb-2">Best Hours for Low Gas:</div>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="hour in timingSuggestions.bestHours"
              :key="hour"
              :label="`${hour}:00`"
              color="green"
              variant="soft"
            />
          </div>
        </div>

        <div>
          <div class="font-medium mb-2">High Gas Hours:</div>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="hour in timingSuggestions.worstHours"
              :key="hour"
              :label="`${hour}:00`"
              color="red"
              variant="soft"
            />
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { GasEstimate, GasOptimizationSuggestions } from '~/composables/useGasOptimization'
import { formatUSDT } from '~/utils/contract/constants'

interface Props {
  investmentAmount: bigint
  gasEstimate?: GasEstimate
  suggestions?: GasOptimizationSuggestions[]
  timingSuggestions?: {
    bestHours: number[]
    worstHours: number[]
    currentOptimal: boolean
    recommendation: string
  }
  costBreakdown?: {
    investmentAmount: string
    gasCostETH: string
    gasCostUSD: string
    totalCost: string
    effectiveAPR: number
    costComparison: {
      withGas: string
      withoutGas: string
      gasImpact: string
    }
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'speed-changed': [speed: keyof typeof import('~/composables/useGasOptimization').GAS_SPEED_OPTIONS]
  'suggestion-applied': [suggestion: GasOptimizationSuggestions]
}>()

// Local state
const selectedSpeed = ref<keyof typeof import('~/composables/useGasOptimization').GAS_SPEED_OPTIONS>('standard')
const gasSpeedOptions = ref(import('~/composables/useGasOptimization').GAS_SPEED_OPTIONS)

// Computed properties
const networkStatusColor = computed(() => {
  switch (props.gasEstimate?.networkStatus) {
    case 'normal':
      return 'green'
    case 'congested':
      return 'amber'
    case 'high':
      return 'red'
    default:
      return 'gray'
  }
})

const networkStatusLabel = computed(() => {
  switch (props.gasEstimate?.networkStatus) {
    case 'normal':
      return 'Normal'
    case 'congested':
      return 'Congested'
    case 'high':
      return 'High Congestion'
    default:
      return 'Unknown'
  }
})

const totalCost = computed(() => {
  if (!props.costBreakdown) return '---'
  return props.costBreakdown.totalCost
})

// Methods
const selectSpeed = (speed: keyof typeof import('~/composables/useGasOptimization').GAS_SPEED_OPTIONS) => {
  selectedSpeed.value = speed
  emit('speed-changed', speed)
}

const applySuggestion = (suggestion: GasOptimizationSuggestions) => {
  emit('suggestion-applied', suggestion)
}

const getSuggestionStyle = (impact: 'low' | 'medium' | 'high') => {
  switch (impact) {
    case 'high':
      return 'bg-red-50 border-red-200'
    case 'medium':
      return 'bg-amber-50 border-amber-200'
    case 'low':
      return 'bg-blue-50 border-blue-200'
    default:
      return 'bg-gray-50 border-gray-200'
  }
}

const getSuggestionIcon = (impact: 'low' | 'medium' | 'high') => {
  switch (impact) {
    case 'high':
      return 'i-heroicons-exclamation-triangle'
    case 'medium':
      return 'i-heroicons-information-circle'
    case 'low':
      return 'i-heroicons-light-bulb'
    default:
      return 'i-heroicons-information-circle'
  }
}

// Watch for changes
watch(() => props.gasEstimate, (newEstimate) => {
  if (newEstimate) {
    // Could trigger gas monitoring or other reactions
    console.log('Gas estimate updated:', newEstimate)
  }
}, { deep: true })
</script>

<style scoped>
.gas-analysis {
  /* Component styles */
}
</style>
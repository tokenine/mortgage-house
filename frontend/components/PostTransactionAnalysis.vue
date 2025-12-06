<template>
  <UCard class="gas-efficiency-report">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Transaction Completed</h3>
        <UBadge
          :color="efficiencyColor"
          :label="efficiencyLabel"
          variant="soft"
        />
      </div>
    </template>

    <div class="space-y-4">
      <!-- Gas Usage Summary -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-gray-50 rounded-lg p-4">
          <div class="text-sm text-gray-600 mb-1">Gas Used</div>
          <div class="text-xl font-bold">{{ formatNumber(analysis.actualGasUsed) }}</div>
          <div class="text-sm text-gray-500">Actual gas consumption</div>
        </div>

        <div class="bg-gray-50 rounded-lg p-4">
          <div class="text-sm text-gray-600 mb-1">Estimated Gas</div>
          <div class="text-xl font-bold">{{ formatNumber(analysis.estimatedGas) }}</div>
          <div class="text-sm text-gray-500">Original estimate</div>
        </div>
      </div>

      <!-- Cost Comparison -->
      <div class="border-t pt-4">
        <h4 class="font-medium mb-3">Cost Analysis</h4>
        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Estimated Cost:</span>
            <span class="font-medium">{{ estimatedCostDisplay }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Actual Cost:</span>
            <span class="font-medium">{{ actualCostDisplay }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Accuracy:</span>
            <span :class="accuracyColor">{{ analysis.accuracy }}%</span>
          </div>
        </div>
      </div>

      <!-- Efficiency Metrics -->
      <div class="border-t pt-4">
        <h4 class="font-medium mb-3">Efficiency Metrics</h4>
        <div class="space-y-3">
          <div>
            <div class="flex justify-between items-center mb-1">
              <span class="text-sm text-gray-600">Gas Efficiency</span>
              <span class="text-sm font-medium">{{ Math.round(analysis.efficiency * 100) }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                :class="[
                  'h-2 rounded-full transition-all',
                  efficiencyBarColor
                ]"
                :style="{ width: `${Math.round(analysis.efficiency * 100)}%` }"
              />
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <UIcon
              :name="analysis.savings ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
              :class="analysis.savings ? 'text-green-500' : 'text-red-500'"
            />
            <span class="text-sm">
              {{ analysis.savings ? 'Gas saved compared to estimate' : 'Used more gas than estimated' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Savings Highlight -->
      <div
        v-if="analysis.savings"
        class="bg-green-50 border border-green-200 rounded-lg p-4"
      >
        <div class="flex items-center space-x-3">
          <UIcon name="i-heroicons-piggy-bank" class="text-green-600 text-xl" />
          <div>
            <div class="font-medium text-green-900">Gas Savings Achieved!</div>
            <div class="text-sm text-green-700">
              You saved {{ savedAmountDisplay }} on gas fees through optimization
            </div>
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div
        v-if="analysis.recommendations && analysis.recommendations.length > 0"
        class="border-t pt-4"
      >
        <h4 class="font-medium mb-3">Recommendations for Future Transactions</h4>
        <div class="space-y-2">
          <div
            v-for="(recommendation, index) in analysis.recommendations"
            :key="index"
            class="flex items-start space-x-2 p-2 bg-blue-50 rounded"
          >
            <UIcon name="i-heroicons-light-bulb" class="text-blue-500 mt-0.5" />
            <span class="text-sm text-gray-700">{{ recommendation }}</span>
          </div>
        </div>
      </div>

      <!-- Transaction Details -->
      <UCollapsible>
        <template #default="{ open }">
          <UButton
            variant="ghost"
            color="gray"
            size="sm"
            class="w-full justify-between"
          >
            <span>Technical Details</span>
            <UIcon
              :name="open ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
              class="w-4 h-4"
            />
          </UButton>
        </template>
        <template #content>
          <div class="mt-4 space-y-2 text-sm bg-gray-50 rounded-lg p-4">
            <div class="grid grid-cols-2 gap-2">
              <span class="text-gray-600">Actual Gas Used:</span>
              <span class="font-mono">{{ formatNumber(analysis.actualGasUsed) }}</span>

              <span class="text-gray-600">Estimated Gas:</span>
              <span class="font-mono">{{ formatNumber(analysis.estimatedGas) }}</span>

              <span class="text-gray-600">Efficiency Rate:</span>
              <span class="font-mono">{{ analysis.efficiency.toFixed(3) }}</span>

              <span class="text-gray-600">Accuracy:</span>
              <span class="font-mono">{{ analysis.accuracy }}%</span>
            </div>
          </div>
        </template>
      </UCollapsible>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-2 pt-4 border-t">
        <UButton
          variant="soft"
          color="primary"
          @click="$emit('view-on-etherscan')"
        >
          <UIcon name="i-heroicons-arrow-top-right-on-square" class="mr-2" />
          View on Etherscan
        </UButton>
        <UButton
          variant="soft"
          @click="$emit('make-another-investment')"
        >
          Make Another Investment
        </UButton>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PostTransactionAnalysis as PostTransactionAnalysisType } from '~/composables/useGasOptimization'

interface Props {
  analysis: PostTransactionAnalysisType
  transactionHash?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'view-on-etherscan': []
  'make-another-investment': []
}>()

// Computed properties
const efficiencyColor = computed(() => {
  const efficiency = props.analysis.efficiency
  if (efficiency >= 0.9) return 'green'
  if (efficiency >= 0.7) return 'blue'
  if (efficiency >= 0.5) return 'amber'
  return 'red'
})

const efficiencyLabel = computed(() => {
  const efficiency = props.analysis.efficiency
  if (efficiency >= 0.9) return 'Excellent'
  if (efficiency >= 0.7) return 'Good'
  if (efficiency >= 0.5) return 'Fair'
  return 'Poor'
})

const efficiencyBarColor = computed(() => {
  const efficiency = props.analysis.efficiency
  if (efficiency >= 0.9) return 'bg-green-500'
  if (efficiency >= 0.7) return 'bg-blue-500'
  if (efficiency >= 0.5) return 'bg-amber-500'
  return 'bg-red-500'
})

const accuracyColor = computed(() => {
  const accuracy = Math.abs(props.analysis.accuracy)
  if (accuracy <= 10) return 'text-green-600'
  if (accuracy <= 20) return 'text-blue-600'
  if (accuracy <= 30) return 'text-amber-600'
  return 'text-red-600'
})

const estimatedCostDisplay = computed(() => {
  const ethCost = parseFloat(props.analysis.actualCostETH) / props.analysis.efficiency
  const usdCost = parseFloat(props.analysis.actualCostUSD.replace('$', '')) / props.analysis.efficiency
  return `${ethCost.toFixed(6)} ETH ($${usdCost.toFixed(2)})`
})

const actualCostDisplay = computed(() => {
  return `${props.analysis.actualCostETH} ETH (${props.analysis.actualCostUSD})`
})

const savedAmountDisplay = computed(() => {
  if (!props.analysis.savings) return '$0.00'

  const actualUSD = parseFloat(props.analysis.actualCostUSD.replace('$', ''))
  const estimatedUSD = actualUSD / props.analysis.efficiency
  const saved = estimatedUSD - actualUSD

  return `$${saved.toFixed(2)}`
})

// Methods
const formatNumber = (num: bigint): string => {
  return Number(num).toLocaleString()
}
</script>

<style scoped>
.gas-efficiency-report {
  /* Component specific styles */
}
</style>
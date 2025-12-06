<template>
  <div>
    <!-- High Gas Price Alert -->
    <UAlert
      v-if="showHighGasAlert"
      icon="i-heroicons-exclamation-triangle"
      color="red"
      :title="alertTitle"
      :description="alertDescription"
      :actions="alertActions"
      class="mb-4"
      :close-button="false"
    />

    <!-- Gas Price Monitoring Status -->
    <UAlert
      v-if="showMonitoringStatus"
      icon="i-heroicons-signal"
      :color="monitoringColor"
      :title="monitoringTitle"
      :description="monitoringDescription"
      class="mb-4"
    >
      <template #description>
        <div class="flex items-center space-x-2">
          <span>{{ monitoringDescription }}</span>
          <div class="flex items-center space-x-1">
            <div
              v-for="i in 3"
              :key="i"
              :class="[
                'w-2 h-2 rounded-full',
                i <= signalStrength ? 'bg-green-500' : 'bg-gray-300'
              ]"
            />
          </div>
        </div>
      </template>
    </UAlert>

    <!-- Gas Price Drop Alert -->
    <UAlert
      v-if="showPriceDropAlert"
      icon="i-heroicons-arrow-trending-down"
      color="green"
      title="Good News! Gas Prices Have Dropped"
      :description="priceDropDescription"
      :actions="priceDropActions"
      class="mb-4"
    />

    <!-- Network Congestion Warning -->
    <UCard
      v-if="networkStatus === 'congested' || networkStatus === 'high'"
      class="mb-4 border-amber-200"
    >
      <template #header>
        <div class="flex items-center space-x-2">
          <UIcon
            :name="networkStatus === 'high' ? 'i-heroicons-exclamation-triangle' : 'i-heroicons-exclamation-circle'"
            :class="networkStatus === 'high' ? 'text-red-500' : 'text-amber-500'"
          />
          <span class="font-medium">
            {{ networkStatus === 'high' ? 'High Network Congestion' : 'Network Congestion Detected' }}
          </span>
        </div>
      </template>

      <div class="space-y-3">
        <p class="text-gray-600">
          {{ networkStatus === 'high'
            ? 'The network is experiencing high congestion. Gas prices are unusually expensive.'
            : 'The network is showing signs of congestion. Consider waiting for better conditions.' }}
        </p>

        <div class="bg-gray-50 rounded-lg p-3">
          <div class="text-sm font-medium mb-1">Current Conditions:</div>
          <div class="text-sm text-gray-600">
            Gas Price: {{ currentGasPrice ? formatEther(currentGasPrice) : '---' }} ETH
            <span v-if="estimatedWaitTime" class="ml-2">
              • Estimated wait: {{ estimatedWaitTime }}
            </span>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-2">
          <UButton
            variant="soft"
            color="green"
            @click="$emit('wait-for-lower-gas')"
          >
            Wait for Lower Gas
          </UButton>
          <UButton
            variant="soft"
            @click="$emit('use-slower-speed')"
          >
            Use Slower Speed
          </UButton>
          <UButton
            variant="soft"
            color="amber"
            @click="$emit('proceed-anyway')"
          >
            Proceed Anyway
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Gas Optimization Tips -->
    <UCard v-if="showOptimizationTips" class="border-blue-200">
      <template #header>
        <div class="flex items-center space-x-2">
          <UIcon name="i-heroicons-light-bulb" class="text-blue-500" />
          <span class="font-medium">Gas Optimization Tips</span>
        </div>
      </template>

      <div class="space-y-2">
        <div class="flex items-start space-x-2">
          <UIcon name="i-heroicons-check-circle" class="text-green-500 mt-0.5" />
          <div class="text-sm">
            <strong>Timing is key:</strong> Gas prices are typically lower during evenings and weekends
          </div>
        </div>
        <div class="flex items-start space-x-2">
          <UIcon name="i-heroicons-check-circle" class="text-green-500 mt-0.5" />
          <div class="text-sm">
            <strong>Batch transactions:</strong> Combine multiple investments to save on gas fees
          </div>
        </div>
        <div class="flex items-start space-x-2">
          <UIcon name="i-heroicons-check-circle" class="text-green-500 mt-0.5" />
          <div class="text-sm">
            <strong>Choose slower speed:</strong> Save up to 30% on gas costs with slower transactions
          </div>
        </div>
        <div class="flex items-start space-x-2">
          <UIcon name="i-heroicons-check-circle" class="text-green-500 mt-0.5" />
          <div class="text-sm">
            <strong>Monitor prices:</strong> Set up alerts for when gas prices drop below your threshold
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { formatEther } from 'viem'
import type { GasEstimate } from '~/composables/useGasOptimization'

interface Props {
  gasEstimate?: GasEstimate
  currentGasPrice?: bigint
  networkStatus?: 'normal' | 'congested' | 'high'
  showTips?: boolean
  priceThreshold?: number // USD threshold for alerts
}

const props = withDefaults(defineProps<Props>(), {
  showTips: true,
  priceThreshold: 10 // $10 USD default threshold
})

const emit = defineEmits<{
  'wait-for-lower-gas': []
  'use-slower-speed': []
  'proceed-anyway': []
  'set-alert-threshold': [threshold: number]
}>()

// State
const showHighGasAlert = ref(false)
const showPriceDropAlert = ref(false)
const lastGasPrice = ref<bigint | null>(null)
const priceHistory = ref<Array<{ price: bigint; timestamp: number }>>([])
const alertDismissed = ref(false)

// Computed properties
const currentGasCostUSD = computed(() => {
  if (!props.currentGasPrice) return 0
  // Assuming 3000 USD/ETH for conversion
  return Number(formatEther(props.currentGasPrice)) * 3000
})

const showHighGasAlert = computed(() => {
  return !alertDismissed.value &&
         currentGasCostUSD.value > props.priceThreshold &&
         props.networkStatus === 'high'
})

const showMonitoringStatus = computed(() => {
  return props.currentGasPrice !== undefined
})

const showOptimizationTips = computed(() => {
  return props.showTips && props.networkStatus !== 'normal'
})

const signalStrength = computed(() => {
  if (!props.currentGasPrice) return 0

  const price = Number(formatEther(props.currentGasPrice))
  if (price < 0.00002) return 3 // Low gas
  if (price < 0.00003) return 2 // Medium gas
  return 1 // High gas
})

const monitoringColor = computed(() => {
  switch (props.networkStatus) {
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

const monitoringTitle = computed(() => {
  switch (props.networkStatus) {
    case 'normal':
      return 'Network Conditions Normal'
    case 'congested':
      return 'Moderate Network Activity'
    case 'high':
      return 'High Network Activity'
    default:
      return 'Monitoring Network'
  }
})

const monitoringDescription = computed(() => {
  if (!props.currentGasPrice) return 'Connecting to network...'

  const price = formatEther(props.currentGasPrice)
  return `Current gas: ${price} ETH (${currentGasCostUSD.value.toFixed(2)} USD)`
})

const alertTitle = computed(() => {
  const cost = currentGasCostUSD.value.toFixed(2)
  return `High Gas Prices Detected ($${cost}/transaction)`
})

const alertDescription = computed(() => {
  return `Current gas prices are unusually high. Consider waiting for better conditions or using a slower transaction speed to save up to 30%.`
})

const priceDropDescription = computed(() => {
  if (!lastGasPrice.value) return 'Gas prices have dropped!'

  const oldPrice = Number(formatEther(lastGasPrice.value))
  const newPrice = Number(formatEther(props.currentGasPrice || 0n))
  const savings = ((oldPrice - newPrice) / oldPrice * 100).toFixed(1)

  return `Great timing! Gas prices have dropped by ${savings}% compared to recent levels.`
})

const estimatedWaitTime = computed(() => {
  switch (props.networkStatus) {
    case 'high':
      return '5-10 minutes for standard speed'
    case 'congested':
      return '2-5 minutes for standard speed'
    default:
      return ''
  }
})

const alertActions = computed(() => [
  {
    label: 'Wait for Lower Gas',
    color: 'green' as const,
    click: () => emit('wait-for-lower-gas')
  },
  {
    label: 'Use Slower Speed',
    click: () => emit('use-slower-speed')
  },
  {
    label: 'Dismiss',
    variant: 'ghost' as const,
    click: () => alertDismissed.value = true
  }
])

const priceDropActions = computed(() => [
  {
    label: 'Invest Now',
    color: 'green' as const,
    click: () => emit('proceed-anyway')
  },
  {
    label: 'Set Alert',
    click: () => emit('set-alert-threshold', props.priceThreshold)
  }
])

// Methods
const checkForPriceDrop = () => {
  if (!props.currentGasPrice || !lastGasPrice.value) return

  const currentPrice = Number(props.currentGasPrice)
  const lastPrice = Number(lastGasPrice.value)
  const dropPercentage = ((lastPrice - currentPrice) / lastPrice) * 100

  if (dropPercentage > 15) { // 15% drop threshold
    showPriceDropAlert.value = true
  }
}

const updatePriceHistory = () => {
  if (!props.currentGasPrice) return

  priceHistory.value.push({
    price: props.currentGasPrice,
    timestamp: Date.now()
  })

  // Keep only last 50 entries
  if (priceHistory.value.length > 50) {
    priceHistory.value.shift()
  }

  lastGasPrice.value = props.currentGasPrice
}

// Watchers
watch(() => props.currentGasPrice, (newPrice, oldPrice) => {
  if (newPrice && oldPrice) {
    updatePriceHistory()
    checkForPriceDrop()
  }
}, { immediate: true })

// Lifecycle
onMounted(() => {
  // Initial setup
  if (props.currentGasPrice) {
    lastGasPrice.value = props.currentGasPrice
    updatePriceHistory()
  }
})

onUnmounted(() => {
  // Cleanup if needed
})
</script>
<template>
  <div class="withdrawal-form space-y-4">
    <!-- Principal Amount Input -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Principal Amount
      </label>
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span class="text-gray-500 dark:text-gray-400 sm:text-sm">$</span>
        </div>
        <UInput
          v-model.number="principalAmount"
          type="number"
          step="0.01"
          min="0"
          :max="formatAmount(withdrawablePrincipal)"
          :disabled="isLoading || withdrawablePrincipal === 0n"
          placeholder="0.00"
          class="pl-8"
          @input="validatePrincipalAmount"
        >
          <template #trailing>
            <span class="text-gray-500 dark:text-gray-400">USDT</span>
          </template>
        </UInput>
      </div>
      <div class="flex justify-between mt-1">
        <span class="text-xs text-gray-500 dark:text-gray-400">
          Available: {{ formatAmount(withdrawablePrincipal) }} USDT
        </span>
        <UButton
          v-if="withdrawablePrincipal > 0n"
          variant="ghost"
          size="xs"
          @click="setMaxPrincipal"
        >
          Max
        </UButton>
      </div>
      <p v-if="principalError" class="text-sm text-red-600 dark:text-red-400 mt-1">
        {{ principalError }}
      </p>
    </div>

    <!-- Interest Amount Input -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Interest Amount
      </label>
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span class="text-gray-500 dark:text-gray-400 sm:text-sm">$</span>
        </div>
        <UInput
          v-model.number="interestAmount"
          type="number"
          step="0.01"
          min="0"
          :max="formatAmount(withdrawableInterest)"
          :disabled="isLoading || withdrawableInterest === 0n"
          placeholder="0.00"
          class="pl-8"
          @input="validateInterestAmount"
        >
          <template #trailing>
            <span class="text-gray-500 dark:text-gray-400">USDT</span>
          </template>
        </UInput>
      </div>
      <div class="flex justify-between mt-1">
        <span class="text-xs text-gray-500 dark:text-gray-400">
          Available: {{ formatAmount(withdrawableInterest) }} USDT
        </span>
        <UButton
          v-if="withdrawableInterest > 0n"
          variant="ghost"
          size="xs"
          @click="setMaxInterest"
        >
          Max
        </UButton>
      </div>
      <p v-if="interestError" class="text-sm text-red-600 dark:text-red-400 mt-1">
        {{ interestError }}
      </p>
    </div>

    <!-- Withdrawal Summary -->
    <div v-if="totalAmount > 0" class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
      <h4 class="font-medium text-gray-900 dark:text-white">Withdrawal Summary</h4>
      <div class="flex justify-between text-sm">
        <span class="text-gray-600 dark:text-gray-400">Principal:</span>
        <span class="font-medium">{{ formatAmount(parseUSDT(principalAmount.toString())) }} USDT</span>
      </div>
      <div class="flex justify-between text-sm">
        <span class="text-gray-600 dark:text-gray-400">Interest:</span>
        <span class="font-medium">{{ formatAmount(parseUSDT(interestAmount.toString())) }} USDT</span>
      </div>
      <div class="border-t border-gray-200 dark:border-gray-600 pt-2 flex justify-between font-medium">
        <span>Total:</span>
        <span>{{ formatAmount(parseUSDT(totalAmount.toString())) }} USDT</span>
      </div>
    </div>

    <!-- Gas Estimate Display -->
    <div v-if="gasEstimate" class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <Icon name="i-heroicons-gas-station" class="w-4 h-4 text-blue-500" />
          <span class="text-sm font-medium text-blue-900 dark:text-blue-100">Gas Estimate</span>
        </div>
        <UButton
          variant="ghost"
          size="xs"
          @click="$emit('estimate-gas', { principalAmount: parseUSDT(principalAmount.toString()), interestAmount: parseUSDT(interestAmount.toString()), type: 'custom' })"
          :loading="isEstimatingGas"
        >
          Refresh
        </UButton>
      </div>
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-blue-700 dark:text-blue-300">Gas Cost:</span>
          <span class="ml-2 font-medium text-blue-900 dark:text-blue-100">
            {{ gasEstimate.ethCost }} ETH (≈ ${{ gasEstimate.usdCost }})
          </span>
        </div>
        <div>
          <span class="text-blue-700 dark:text-blue-300">Network:</span>
          <span class="ml-2 font-medium text-blue-900 dark:text-blue-100 capitalize">
            {{ gasEstimate.networkStatus }}
          </span>
        </div>
      </div>
      <div v-if="!gasEstimate.isWithinThreshold" class="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded p-2 text-xs text-yellow-800 dark:text-yellow-200">
        ⚠️ Gas costs are higher than normal. Consider waiting for network congestion to clear.
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex space-x-3 pt-4">
      <UButton
        :disabled="!isValidWithdrawal || isLoading"
        :loading="isLoading"
        @click="handleWithdrawal"
        class="flex-1"
        size="lg"
      >
        Withdraw {{ formatAmount(parseUSDT(totalAmount.toString())) }} USDT
      </UButton>

      <UButton
        variant="outline"
        @click="resetForm"
        :disabled="isLoading"
      >
        Reset
      </UButton>
    </div>

    <!-- Transaction Simulation (if available) -->
    <div v-if="simulation" class="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-sm">
      <div class="flex items-center space-x-2 mb-2">
        <Icon name="i-heroicons-cpu-chip" class="w-4 h-4 text-gray-500" />
        <span class="font-medium text-gray-700 dark:text-gray-300">Transaction Simulation</span>
      </div>
      <div class="space-y-1 text-gray-600 dark:text-gray-400">
        <div>Gas Limit: {{ simulation.gasLimit }}</div>
        <div>Gas Price: {{ simulation.gasPrice }} Gwei</div>
        <div>Estimated Time: {{ simulation.estimatedTime }}s</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { formatUSDT, parseUSDT } from '~/utils/contract/constants'

// Props
interface Props {
  withdrawablePrincipal: bigint
  withdrawableInterest: bigint
  isLoading?: boolean
  gasEstimate?: {
    gasLimit: bigint
    gasPrice: bigint
    ethCost: string
    usdCost: string
    isWithinThreshold: boolean
    networkStatus: 'normal' | 'congested' | 'high'
  } | null
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  gasEstimate: null
})

// Emits
const emit = defineEmits<{
  withdraw: [withdrawal: { principalAmount: bigint; interestAmount: bigint; type: 'custom' }]
  estimateGas: [withdrawal: { principalAmount: bigint; interestAmount: bigint; type: 'custom' }]
}>()

// State
const principalAmount = ref(0)
const interestAmount = ref(0)
const principalError = ref('')
const interestError = ref('')
const isEstimatingGas = ref(false)
const simulation = ref<{
  gasLimit: number
  gasPrice: number
  estimatedTime: number
} | null>(null)

// Computed
const totalAmount = computed(() => principalAmount.value + interestAmount.value)

const isValidWithdrawal = computed(() => {
  return (
    totalAmount.value > 0 &&
    !principalError.value &&
    !interestError.value &&
    parseUSDT(principalAmount.toString()) <= props.withdrawablePrincipal &&
    parseUSDT(interestAmount.toString()) <= props.withdrawableInterest
  )
})

// Methods
const validatePrincipalAmount = () => {
  const amount = parseUSDT(principalAmount.toString())

  if (amount > props.withdrawablePrincipal) {
    principalError.value = `Amount exceeds available principal (${formatUSDT(props.withdrawablePrincipal)} USDT)`
  } else if (amount < 0) {
    principalError.value = 'Amount cannot be negative'
  } else {
    principalError.value = ''
  }
}

const validateInterestAmount = () => {
  const amount = parseUSDT(interestAmount.toString())

  if (amount > props.withdrawableInterest) {
    interestError.value = `Amount exceeds available interest (${formatUSDT(props.withdrawableInterest)} USDT)`
  } else if (amount < 0) {
    interestError.value = 'Amount cannot be negative'
  } else {
    interestError.value = ''
  }
}

const setMaxPrincipal = () => {
  principalAmount.value = Number(formatUSDT(props.withdrawablePrincipal))
  validatePrincipalAmount()
}

const setMaxInterest = () => {
  interestAmount.value = Number(formatUSDT(props.withdrawableInterest))
  validateInterestAmount()
}

const resetForm = () => {
  principalAmount.value = 0
  interestAmount.value = 0
  principalError.value = ''
  interestError.value = ''
  simulation.value = null
}

const handleWithdrawal = () => {
  if (!isValidWithdrawal.value) return

  emit('withdraw', {
    principalAmount: parseUSDT(principalAmount.toString()),
    interestAmount: parseUSDT(interestAmount.toString()),
    type: 'custom'
  })
}

const formatAmount = (amount: bigint): string => {
  return formatUSDT(amount)
}

const parseUSDTAmount = (amount: string | number): bigint => {
  return parseUSDT(amount.toString())
}

// Watch for amount changes to trigger gas estimation
watch([principalAmount, interestAmount], () => {
  if (totalAmount.value > 0 && !props.gasEstimate) {
    // Auto-estimate gas when user enters amounts
    emit('estimateGas', {
      principalAmount: parseUSDT(principalAmount.toString()),
      interestAmount: parseUSDT(interestAmount.toString()),
      type: 'custom'
    })
  }
})

// Watch for gas estimate changes to show simulation
watch(() => props.gasEstimate, (newEstimate) => {
  if (newEstimate) {
    // Simulate transaction details
    simulation.value = {
      gasLimit: Number(newEstimate.gasLimit),
      gasPrice: Number(newEstimate.gasPrice) / 1e9, // Convert to Gwei
      estimatedTime: Math.floor(Number(newEstimate.gasLimit) / 100000) // Rough estimate
    }
  }
})
</script>
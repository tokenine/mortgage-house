<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-8">Web3 Integration Test</h1>

      <!-- Connection Status -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Connection Status</h2>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="font-medium">Connected:</span>
            <span :class="isConnected ? 'text-green-600' : 'text-red-600'">
              {{ isConnected ? 'Yes' : 'No' }}
            </span>
          </div>
          <div>
            <span class="font-medium">Address:</span>
            <span class="font-mono text-sm">{{ address || 'Not connected' }}</span>
          </div>
          <div>
            <span class="font-medium">Chain ID:</span>
            <span>{{ chainId || 'Unknown' }}</span>
          </div>
          <div>
            <span class="font-medium">Supported Chain:</span>
            <span :class="isValidChain ? 'text-green-600' : 'text-red-600'">
              {{ isValidChain ? 'Yes' : 'No' }}
            </span>
          </div>
        </div>

        <div class="mt-4 flex gap-2">
          <UButton
            v-if="!isConnected"
            @click="connect"
            :loading="isConnecting"
            color="primary"
          >
            Connect Wallet
          </UButton>
          <UButton
            v-if="isConnected"
            @click="disconnect"
            color="red"
            variant="outline"
          >
            Disconnect
          </UButton>
          <UButton
            v-if="!isValidChain"
            @click="switchToSupportedChain"
            color="yellow"
            variant="outline"
          >
            Switch Network
          </UButton>
        </div>
      </div>

      <!-- Contract Interaction -->
      <div v-if="isConnected" class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Contract Interaction</h2>

        <div class="grid grid-cols-2 gap-4 mb-6">
          <div>
            <span class="font-medium">USDT Balance:</span>
            <span>{{ formattedUsdtBalance }}</span>
          </div>
          <div>
            <span class="font-medium">USDT Allowance:</span>
            <span>{{ formattedUsdtAllowance }}</span>
          </div>
          <div>
            <span class="font-medium">Total Invested:</span>
            <span>{{ formattedTotalInvested }}</span>
          </div>
          <div>
            <span class="font-medium">Investor Shares:</span>
            <span>{{ investorShares.toString() }}</span>
          </div>
        </div>

        <!-- Investment Form -->
        <div class="border-t pt-4">
          <h3 class="font-medium mb-2">Test Investment</h3>
          <div class="flex gap-2 items-end">
            <UFormGroup class="flex-1" label="USDT Amount">
              <UInput
                v-model="investmentAmount"
                type="number"
                placeholder="Enter amount in USDT"
                min="1"
              />
            </UFormGroup>
            <UButton
              @click="handleInvest"
              :loading="isLoading"
              color="primary"
            >
              Test Invest
            </UButton>
          </div>
        </div>
      </div>

      <!-- Error Display -->
      <ErrorAlert
        v-if="error"
        :error="error"
        @close="clearError"
      />

      <!-- Success Messages -->
      <div v-if="successMessage" class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <p class="text-green-800">{{ successMessage }}</p>
      </div>

      <!-- Debug Info -->
      <div class="bg-gray-100 rounded-lg p-4">
        <h3 class="font-medium mb-2">Debug Info</h3>
        <pre class="text-xs overflow-auto max-h-64">{{ JSON.stringify(debugInfo, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { parseUSDT } from '~/utils/contract/constants'
import { useErrorHandler } from '~/composables/useErrorHandler'

// Use composables
const mortgageContract = useMortgageContract()
const { handleError, clearError } = useErrorHandler()

// Form state
const investmentAmount = ref('10')
const successMessage = ref('')

// Computed properties from mortgage composable
const {
  isConnected,
  address,
  chainId,
  isValidChain,
  isLoading,
  isConnecting,
  formattedUsdtBalance,
  formattedUsdtAllowance,
  formattedTotalInvested,
  investorShares,
  error,
  connect,
  disconnect,
  switchToSupportedChain,
  invest
} = mortgageContract

// Debug info
const debugInfo = computed(() => ({
  isConnected: isConnected.value,
  address: address.value,
  chainId: chainId.value,
  isValidChain: isValidChain.value,
  isLoading: isLoading.value,
  usdtBalance: formattedUsdtBalance.value,
  totalInvested: formattedTotalInvested.value,
  investorShares: investorShares.value?.toString(),
  error: error.value
}))

// Methods
const handleInvest = async () => {
  try {
    successMessage.value = ''

    const amount = parseUSDT(investmentAmount.value)
    if (amount <= 0n) {
      throw new Error('Invalid investment amount')
    }

    const txHash = await invest(amount)
    successMessage.value = `Investment successful! Transaction: ${txHash}`
  } catch (error) {
    handleError(error)
  }
}

// Lifecycle
onMounted(() => {
  console.log('Web3 Test page mounted')
})
</script>
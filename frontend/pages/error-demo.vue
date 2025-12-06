<template>
  <div class="container mx-auto p-6 max-w-4xl">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-4">Structured Error Handling Demo</h1>
      <p class="text-gray-600">Demonstration of the comprehensive error handling system for Mortgage House</p>
    </div>

    <!-- Error Handler Demo -->
    <div class="mb-8">
      <UCard class="p-6">
        <h2 class="text-xl font-semibold mb-4">Error Handler Demo</h2>

        <div class="space-y-4 mb-6">
          <UFormGroup label="Error Type" description="Select an error type to simulate">
            <USelect
              v-model="selectedErrorType"
              :options="errorTypes"
              placeholder="Choose an error type"
            />
          </UFormGroup>

          <UFormGroup label="Custom Message" description="Optional custom error message">
            <UInput
              v-model="customMessage"
              placeholder="Enter custom error message"
            />
          </UFormGroup>

          <div class="flex gap-2">
            <UButton
              @click="triggerError"
              color="red"
              :loading="isTriggering"
            >
              Trigger Error
            </UButton>

            <UButton
              @click="clearErrors"
              color="gray"
              variant="outline"
            >
              Clear Errors
            </UButton>
          </div>
        </div>

        <!-- Current Error Display -->
        <ErrorAlert
          v-if="currentError"
          :error="currentError"
          :dismissible="true"
          @close="clearCurrentError"
        />

        <!-- Error Stats -->
        <div v-if="errorCount > 0" class="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 class="font-semibold mb-2">Error Statistics</h3>
          <div class="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span class="font-medium">Total Errors:</span>
              <span class="ml-2">{{ errorCount }}</span>
            </div>
            <div>
              <span class="font-medium">Critical Errors:</span>
              <span class="ml-2 text-red-600">{{ criticalErrors.length }}</span>
            </div>
            <div>
              <span class="font-medium">Retryable Errors:</span>
              <span class="ml-2 text-yellow-600">{{ retryableErrors.length }}</span>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Validation Demo -->
    <div class="mb-8">
      <UCard class="p-6">
        <h2 class="text-xl font-semibold mb-4">Validation Demo</h2>

        <div class="space-y-4">
          <UFormGroup label="Investment Amount" :error="validationErrors.amount?.message">
            <UInput
              v-model="investmentAmount"
              type="number"
              placeholder="Enter investment amount (USDT)"
              @blur="validateInvestment"
            />
          </UFormGroup>

          <UFormGroup label="Wallet Address" :error="validationErrors.wallet?.message">
            <UInput
              v-model="walletAddress"
              placeholder="0x..."
              @blur="validateWallet"
            />
          </UFormGroup>

          <UButton
            @click="validateForm"
            color="blue"
            :loading="isValidating"
          >
            Validate Form
          </UButton>
        </div>

        <!-- Validation Results -->
        <div v-if="Object.keys(validationErrors).length > 0" class="mt-6">
          <h3 class="font-semibold mb-2 text-red-600">Validation Errors</h3>
          <div class="space-y-2">
            <div
              v-for="(error, field) in validationErrors"
              :key="field"
              class="p-3 bg-red-50 border border-red-200 rounded text-sm"
            >
              <span class="font-medium">{{ field }}:</span>
              <span class="ml-2">{{ error.message }}</span>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Network Status Demo -->
    <div class="mb-8">
      <UCard class="p-6">
        <h2 class="text-xl font-semibold mb-4">Network Status</h2>

        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="p-4 bg-gray-50 rounded">
            <div class="text-sm font-medium">Connection Status</div>
            <div class="text-lg font-bold" :class="isOnline ? 'text-green-600' : 'text-red-600'">
              {{ isOnline ? 'Online' : 'Offline' }}
            </div>
          </div>

          <div class="p-4 bg-gray-50 rounded">
            <div class="text-sm font-medium">Pending Requests</div>
            <div class="text-lg font-bold">{{ hasPendingRequests ? 'Yes' : 'No' }}</div>
          </div>
        </div>

        <div class="flex gap-2">
          <UButton
            @click="testConnection"
            color="blue"
            :loading="isTestingConnection"
            size="sm"
          >
            Test Connection
          </UButton>

          <UButton
            @click="simulateNetworkError"
            color="orange"
            size="sm"
          >
            Simulate Network Error
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- Recent Errors -->
    <div v-if="recentErrors.length > 0">
      <UCard class="p-6">
        <h2 class="text-xl font-semibold mb-4">Recent Errors</h2>

        <div class="space-y-2">
          <div
            v-for="(error, index) in recentErrors"
            :key="`${error.id}-${index}`"
            class="p-3 border rounded-lg"
            :class="getBorderClass(error)"
          >
            <div class="flex justify-between items-start">
              <div>
                <div class="font-medium">{{ error.mortgageError.type }}</div>
                <div class="text-sm text-gray-600">{{ error.mortgageError.message }}</div>
                <div class="text-xs text-gray-500 mt-1">
                  {{ new Date(error.timestamp).toLocaleString() }}
                </div>
              </div>
              <UBadge
                :label="error.mortgageError.scope"
                :color="getBadgeColor(error.mortgageError.scope)"
                size="sm"
              />
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Error Log Export -->
    <UCard class="p-6">
      <h2 class="text-xl font-semibold mb-4">Error Management</h2>

      <div class="flex gap-2">
        <UButton
          @click="exportErrors"
          color="gray"
          size="sm"
        >
          Export Error Log
        </UButton>

        <UButton
          @click="showErrorStats"
          color="blue"
          size="sm"
        >
          Show Analytics
        </UButton>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { ValidationErrorHandler, INVESTMENT_VALIDATION_RULES } from '~/utils/validation'
import { NetworkErrorHandler } from '~/utils/networkErrorHandler'
import { errorLogger } from '~/utils/errorLogger'

// Initialize error handler
const {
  errors,
  currentError,
  errorCount,
  recentErrors,
  criticalErrors,
  retryableErrors,
  handleError,
  clearError,
  clearAllErrors,
  getErrorStats,
  exportErrorLog
} = useErrorHandler({
  maxErrors: 100,
  enableAnalytics: true
})

// Network status
const {
  isOnline,
  hasPendingRequests,
  testConnectivity
} = NetworkErrorHandler.getInstance().getNetworkStatus()

// Demo state
const selectedErrorType = ref('')
const customMessage = ref('')
const investmentAmount = ref('')
const walletAddress = ref('')
const validationErrors = ref<Record<string, any>>({})
const isTriggering = ref(false)
const isValidating = ref(false)
const isTestingConnection = ref(false)

// Error type options
const errorTypes = [
  { label: 'Wallet Not Connected', value: 'WALLET_NOT_CONNECTED' },
  { label: 'Wrong Network', value: 'WRONG_NETWORK' },
  { label: 'Insufficient Funds', value: 'INSUFFICIENT_FUNDS' },
  { label: 'Insufficient Allowance', value: 'INSUFFICIENT_ALLOWANCE' },
  { label: 'Network Error', value: 'NETWORK_CONNECTION_ERROR' },
  { label: 'Transaction Failed', value: 'TRANSACTION_FAILED' },
  { label: 'Invalid Input', value: 'INVALID_INPUT' },
  { label: 'Contract Error', value: 'CONTRACT_ERROR' }
]

// Computed properties
const clearCurrentError = () => {
  clearError()
}

const clearErrors = () => {
  clearAllErrors()
}

// Methods
const triggerError = () => {
  isTriggering.value = true

  const errorType = selectedErrorType.value || 'NETWORK_ERROR'
  const message = customMessage.value || 'This is a demo error message'

  const mockError = {
    scope: getErrorScope(errorType),
    type: errorType,
    message,
    code: 'DEMO_' + Date.now(),
    severity: getErrorSeverity(errorType)
  }

  handleError(mockError)

  setTimeout(() => {
    isTriggering.value = false
  }, 1000)
}

const validateInvestment = () => {
  const result = ValidationErrorHandler.validateInvestmentAmount(
    investmentAmount.value,
    10000 // Mock available balance
  )

  if (!result.isValid) {
    validationErrors.value.amount = result
    handleError(result.error!)
  } else {
    delete validationErrors.value.amount
  }
}

const validateWallet = () => {
  const result = ValidationErrorHandler.validateWalletAddress(walletAddress.value)

  if (!result.isValid) {
    validationErrors.value.wallet = result
    handleError(result.error!)
  } else {
    delete validationErrors.value.wallet
  }
}

const validateForm = async () => {
  isValidating.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 500)) // Simulate async validation

    validateInvestment()
    validateWallet()
  } finally {
    isValidating.value = false
  }
}

const testConnection = async () => {
  isTestingConnection.value = true

  try {
    const isOnline = await testConnectivity()
    console.log('Connection test result:', isOnline)
  } catch (error) {
    handleError(error)
  } finally {
    isTestingConnection.value = false
  }
}

const simulateNetworkError = () => {
  const networkError = new Error('Simulated network error')
  handleError(networkError)
}

const exportErrors = () => {
  const log = exportErrorLog()
  const blob = new Blob([log], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `mortgage-error-log-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const showErrorStats = () => {
  const stats = getErrorStats()
  console.table(stats)
}

const getErrorScope = (type: string): any => {
  if (type.includes('WALLET') || type.includes('NETWORK')) return 'FRONTEND'
  if (type.includes('CONTRACT')) return 'CONTRACT'
  return 'FRONTEND'
}

const getErrorSeverity = (type: string): any => {
  if (type.includes('FUNDS') || type.includes('FAILED')) return 'high'
  if (type.includes('NETWORK')) return 'medium'
  return 'low'
}

const getBorderClass = (error: any) => {
  if (error.mortgageError.severity === 'critical' || error.mortgageError.severity === 'high') {
    return 'border-red-200 bg-red-50'
  }
  if (error.mortgageError.severity === 'medium') {
    return 'border-yellow-200 bg-yellow-50'
  }
  return 'border-blue-200 bg-blue-50'
}

const getBadgeColor = (scope: string): string => {
  switch (scope) {
    case 'CONTRACT': return 'red'
    case 'FRONTEND': return 'blue'
    case 'NETWORK': return 'yellow'
    default: return 'gray'
  }
}

// Initialize with a welcome message
onMounted(() => {
  console.log('Error Handling Demo loaded successfully!')
  console.log('Available error types:', errorTypes.map(e => e.value))
})
</script>

<style scoped>
.container {
  min-height: 100vh;
}
</style>
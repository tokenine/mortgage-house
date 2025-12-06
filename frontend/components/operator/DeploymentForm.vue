<template>
  <div class="deployment-form">
    <!-- Form Header -->
    <div class="form-header">
      <h2 class="text-2xl font-bold text-gray-900">Deploy New Mortgage Contract</h2>
      <p class="mt-2 text-sm text-gray-600">
        Create a new mortgage investment contract with specified parameters
      </p>
    </div>

    <!-- Validation Summary -->
    <div v-if="validationErrors.length > 0" class="validation-summary mb-6">
      <div class="rounded-md bg-red-50 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">
              Please fix the following errors:
            </h3>
            <div class="mt-2 text-sm text-red-700">
              <ul class="list-disc list-inside space-y-1">
                <li v-for="error in validationErrors" :key="error.field">
                  {{ error.message }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Deployment Form -->
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Borrower Information -->
      <div class="form-section">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Borrower Information</h3>

        <div class="form-field">
          <label for="borrower" class="block text-sm font-medium text-gray-700">
            Borrower Wallet Address *
          </label>
          <input
            id="borrower"
            v-model="form.borrower"
            type="text"
            placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            :class="{ 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500': getFieldError('borrower') }"
            @blur="validateField('borrower')"
          />
          <p class="mt-2 text-sm text-gray-500">
            Enter the borrower's Ethereum wallet address
          </p>
          <p v-if="getFieldError('borrower')" class="mt-2 text-sm text-red-600">
            {{ getFieldError('borrower') }}
          </p>
        </div>
      </div>

      <!-- Loan Details -->
      <div class="form-section">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Loan Details</h3>

        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div class="form-field">
            <label for="loanAmount" class="block text-sm font-medium text-gray-700">
              Loan Amount (USDT) *
            </label>
            <input
              id="loanAmount"
              v-model="form.loanAmount"
              type="text"
              placeholder="100000"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              :class="{ 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500': getFieldError('loanAmount') }"
              @blur="validateField('loanAmount')"
            />
            <p class="mt-2 text-sm text-gray-500">
              Minimum: 10,000 USDT, Maximum: 10,000,000 USDT
            </p>
            <p v-if="getFieldError('loanAmount')" class="mt-2 text-sm text-red-600">
              {{ getFieldError('loanAmount') }}
            </p>
          </div>

          <div class="form-field">
            <label for="usdtToken" class="block text-sm font-medium text-gray-700">
              USDT Token Address *
            </label>
            <input
              id="usdtToken"
              v-model="form.usdtToken"
              type="text"
              placeholder="0xdAC17F958D2ee523a2206206994597C13D831ec7"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              :class="{ 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500': getFieldError('usdtToken') }"
              @blur="validateField('usdtToken')"
            />
            <p class="mt-2 text-sm text-gray-500">
              USDT token contract address on current network
            </p>
            <p v-if="getFieldError('usdtToken')" class="mt-2 text-sm text-red-600">
              {{ getFieldError('usdtToken') }}
            </p>
          </div>

          <div class="form-field">
            <label for="interestRate" class="block text-sm font-medium text-gray-700">
              Annual Interest Rate (%) *
            </label>
            <input
              id="interestRate"
              v-model="form.interestRate"
              type="text"
              placeholder="7.5"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              :class="{ 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500': getFieldError('interestRate') }"
              @blur="validateField('interestRate')"
            />
            <p class="mt-2 text-sm text-gray-500">
              Annual interest rate (1% - 20%)
            </p>
            <p v-if="getFieldError('interestRate')" class="mt-2 text-sm text-red-600">
              {{ getFieldError('interestRate') }}
            </p>
          </div>

          <div class="form-field">
            <label for="loanTerm" class="block text-sm font-medium text-gray-700">
              Loan Term (months) *
            </label>
            <input
              id="loanTerm"
              v-model="form.loanTerm"
              type="text"
              placeholder="360"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              :class="{ 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500': getFieldError('loanTerm') }"
              @blur="validateField('loanTerm')"
            />
            <p class="mt-2 text-sm text-gray-500">
              Loan duration in months (12 - 360 months)
            </p>
            <p v-if="getFieldError('loanTerm')" class="mt-2 text-sm text-red-600">
              {{ getFieldError('loanTerm') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Property Information -->
      <div class="form-section">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Property Information</h3>

        <div class="form-field">
          <label for="propertyDescription" class="block text-sm font-medium text-gray-700">
            Property Description *
          </label>
          <textarea
            id="propertyDescription"
            v-model="form.propertyDescription"
            rows="4"
            placeholder="Modern 3-bedroom house in downtown area with 2 bathrooms, garage, and garden..."
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            :class="{ 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500': getFieldError('propertyDescription') }"
            @blur="validateField('propertyDescription')"
          ></textarea>
          <p class="mt-2 text-sm text-gray-500">
            Detailed description of the property securing this mortgage (10-500 characters)
          </p>
          <p v-if="getFieldError('propertyDescription')" class="mt-2 text-sm text-red-600">
            {{ getFieldError('propertyDescription') }}
          </p>
        </div>
      </div>

      <!-- Gas Estimation -->
      <div v-if="gasEstimate" class="gas-estimate">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Estimated Gas Costs</h3>
        <div class="rounded-md bg-blue-50 p-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm font-medium text-blue-900">Gas Limit:</p>
              <p class="text-sm text-blue-700">{{ formatNumber(gasEstimate.gasLimit) }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-blue-900">Gas Price:</p>
              <p class="text-sm text-blue-700">{{ formatGwei(gasEstimate.gasPrice) }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-blue-900">ETH Cost:</p>
              <p class="text-sm text-blue-700">{{ gasEstimate.ethCost }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-blue-900">USD Cost:</p>
              <p class="text-sm text-blue-700">${{ gasEstimate.usdCost }}</p>
            </div>
          </div>
          <div class="mt-3">
            <p class="text-sm text-blue-800">
              Network Status: <span class="font-medium">{{ gasEstimate.networkStatus }}</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <div class="flex justify-between">
          <button
            type="button"
            @click="clearForm"
            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Clear Form
          </button>

          <div class="flex space-x-3">
            <button
              type="button"
              @click="estimateGas"
              :disabled="!canEstimateGas || isEstimatingGas"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg v-if="isEstimatingGas" class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isEstimatingGas ? 'Estimating...' : 'Estimate Gas' }}
            </button>

            <button
              type="submit"
              :disabled="!canDeploy || isDeploying"
              class="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg v-if="isDeploying" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isDeploying ? 'Deploying...' : 'Deploy Contract' }}
            </button>
          </div>
        </div>
      </div>
    </form>

    <!-- Deployment Status -->
    <div v-if="deploymentStatus.status !== 'idle'" class="deployment-status mt-6">
      <DeploymentStatus :status="deploymentStatus" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useMortgageContract } from '~/composables/useMortgageContract'
import DeploymentStatus from './DeploymentStatus.vue'

// Props
interface Props {
  initialData?: {
    borrower?: string
    loanAmount?: string
    usdtToken?: string
    interestRate?: string
    loanTerm?: string
    propertyDescription?: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  initialData: () => ({})
})

// Emits
const emit = defineEmits<{
  deployed: [contractAddress: string, txHash: string]
  error: [error: Error]
}>()

// Composable
const {
  deploymentStatus,
  deploymentForm,
  deploymentValidationErrors,
  deploymentGasEstimate,
  validateDeploymentParams,
  getDeploymentGasEstimate,
  deployMortgageContract,
  clearDeploymentForm,
  updateDeploymentFormField
} = useMortgageContract()

// Local state
const isEstimatingGas = ref(false)
const isDeploying = ref(false)

// Form data
const form = reactive({
  borrower: props.initialData.borrower || '',
  loanAmount: props.initialData.loanAmount || '',
  usdtToken: props.initialData.usdtToken || '',
  interestRate: props.initialData.interestRate || '',
  loanTerm: props.initialData.loanTerm || '',
  propertyDescription: props.initialData.propertyDescription || ''
})

// Watch for changes and sync with composable
watch(form, (newForm) => {
  Object.entries(newForm).forEach(([key, value]) => {
    updateDeploymentFormField(key as keyof typeof form, value)
  })
}, { deep: true })

// Computed properties
const validationErrors = computed(() => deploymentValidationErrors.value)

const canEstimateGas = computed(() => {
  return form.borrower && form.loanAmount && form.usdtToken &&
         form.interestRate && form.loanTerm && form.propertyDescription &&
         validationErrors.value.length === 0
})

const canDeploy = computed(() => {
  return canEstimateGas.value && deploymentGasEstimate.value !== null
})

// Methods
const validateField = (field: keyof typeof form) => {
  const errors = validateDeploymentParams(form)
  const fieldErrors = errors.filter(error => error.field === field)
  return fieldErrors.length > 0 ? fieldErrors[0].message : null
}

const getFieldError = (field: keyof typeof form) => {
  const error = validationErrors.value.find(error => error.field === field)
  return error?.message
}

const estimateGas = async () => {
  if (!canEstimateGas.value) return

  try {
    isEstimatingGas.value = true
    await getDeploymentGasEstimate(form)
  } catch (error) {
    console.error('Gas estimation failed:', error)
    emit('error', error as Error)
  } finally {
    isEstimatingGas.value = false
  }
}

const handleSubmit = async () => {
  if (!canDeploy.value) return

  try {
    isDeploying.value = true
    const txHash = await deployMortgageContract(form)

    // Get contract address from deployment status or event
    const contractAddress = deploymentStatus.value.contractAddress || ''

    emit('deployed', contractAddress, txHash)
  } catch (error) {
    console.error('Deployment failed:', error)
    emit('error', error as Error)
  } finally {
    isDeploying.value = false
  }
}

const clearForm = () => {
  Object.keys(form).forEach(key => {
    form[key as keyof typeof form] = ''
  })
  clearDeploymentForm()
}

// Utility functions
const formatNumber = (num: bigint | number): string => {
  return Number(num).toLocaleString()
}

const formatGwei = (wei: bigint): string => {
  const gwei = Number(wei) / 1e9
  return `${gwei.toFixed(2)} Gwei`
}
</script>

<style scoped>
.deployment-form {
  @apply max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-200;
}

.form-section {
  @apply border-b border-gray-200 pb-6 last:border-b-0;
}

.form-field {
  @apply space-y-2;
}

.form-actions {
  @apply pt-6 border-t border-gray-200;
}

.validation-summary {
  @apply border border-red-200 rounded-lg;
}

.gas-estimate {
  @apply border border-blue-200 rounded-lg;
}
</style>
<template>
  <div class="deployment-status">
    <div
      :class="statusClasses"
      class="rounded-md p-4"
    >
      <div class="flex">
        <div class="flex-shrink-0">
          <!-- Status Icon -->
          <svg
            v-if="status.status === 'validating'"
            class="animate-spin h-5 w-5 text-blue-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>

          <svg
            v-else-if="status.status === 'estimating'"
            class="animate-spin h-5 w-5 text-yellow-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>

          <svg
            v-else-if="status.status === 'deploying'"
            class="animate-spin h-5 w-5 text-blue-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>

          <svg
            v-else-if="status.status === 'success'"
            class="h-5 w-5 text-green-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>

          <svg
            v-else-if="status.status === 'error'"
            class="h-5 w-5 text-red-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>

          <div v-else class="h-5 w-5 rounded-full bg-gray-300"></div>
        </div>

        <div class="ml-3 flex-1">
          <!-- Status Title -->
          <h3 class="text-sm font-medium" :class="titleClasses">
            {{ statusTitle }}
          </h3>

          <!-- Status Message -->
          <p v-if="status.message" class="mt-1 text-sm" :class="messageClasses">
            {{ status.message }}
          </p>

          <!-- Error Details -->
          <div v-if="status.status === 'error' && status.error" class="mt-3">
            <details class="text-sm">
              <summary class="cursor-pointer font-medium" :class="messageClasses">
                View Error Details
              </summary>
              <pre class="mt-2 whitespace-pre-wrap text-xs" :class="messageClasses">{{ status.error }}</pre>
            </details>
          </div>

          <!-- Transaction Details -->
          <div v-if="status.txHash" class="mt-3">
            <div class="text-sm space-y-1">
              <div>
                <span class="font-medium" :class="messageClasses">Transaction Hash:</span>
                <a
                  :href="`https://etherscan.io/tx/${status.txHash}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="ml-2 text-blue-600 hover:text-blue-800 underline"
                >
                  {{ formatTxHash(status.txHash) }}
                </a>
              </div>

              <div v-if="status.contractAddress">
                <span class="font-medium" :class="messageClasses">Contract Address:</span>
                <a
                  :href="`https://etherscan.io/address/${status.contractAddress}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="ml-2 text-blue-600 hover:text-blue-800 underline"
                >
                  {{ formatAddress(status.contractAddress) }}
                </a>
              </div>
            </div>
          </div>

          <!-- Success Actions -->
          <div v-if="status.status === 'success'" class="mt-4 flex space-x-3">
            <button
              @click="copyTxHash"
              class="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Copy Tx Hash
            </button>

            <button
              v-if="status.contractAddress"
              @click="copyContractAddress"
              class="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Copy Address
            </button>

            <a
              v-if="status.contractAddress"
              :href="`/operator/contracts/${status.contractAddress}`"
              class="inline-flex items-center px-3 py-1 border border-blue-300 rounded-md text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
            >
              View Contract
            </a>
          </div>

          <!-- Progress Indicator for Loading States -->
          <div v-if="isLoadingState" class="mt-3">
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="h-2 rounded-full transition-all duration-300"
                :class="progressBarClass"
                :style="{ width: progressWidth + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Close Button -->
        <div v-if="status.status === 'success' || status.status === 'error'" class="ml-4 flex-shrink-0">
          <button
            @click="$emit('close')"
            class="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface DeploymentStatus {
  status: 'idle' | 'validating' | 'estimating' | 'deploying' | 'success' | 'error'
  message?: string
  error?: string
  txHash?: string
  contractAddress?: string
}

interface Props {
  status: DeploymentStatus
}

defineProps<Props>()

defineEmits<{
  close: []
}>()

// Computed properties
const statusTitle = computed(() => {
  switch (props.status.status) {
    case 'validating':
      return 'Validating Parameters'
    case 'estimating':
      return 'Estimating Gas Costs'
    case 'deploying':
      return 'Deploying Contract'
    case 'success':
      return 'Deployment Successful'
    case 'error':
      return 'Deployment Failed'
    default:
      return 'Ready'
  }
})

const statusClasses = computed(() => {
  switch (props.status.status) {
    case 'validating':
      return 'bg-blue-50 border border-blue-200'
    case 'estimating':
      return 'bg-yellow-50 border border-yellow-200'
    case 'deploying':
      return 'bg-blue-50 border border-blue-200'
    case 'success':
      return 'bg-green-50 border border-green-200'
    case 'error':
      return 'bg-red-50 border border-red-200'
    default:
      return 'bg-gray-50 border border-gray-200'
  }
})

const titleClasses = computed(() => {
  switch (props.status.status) {
    case 'validating':
    case 'deploying':
      return 'text-blue-800'
    case 'estimating':
      return 'text-yellow-800'
    case 'success':
      return 'text-green-800'
    case 'error':
      return 'text-red-800'
    default:
      return 'text-gray-800'
  }
})

const messageClasses = computed(() => {
  switch (props.status.status) {
    case 'validating':
    case 'deploying':
      return 'text-blue-700'
    case 'estimating':
      return 'text-yellow-700'
    case 'success':
      return 'text-green-700'
    case 'error':
      return 'text-red-700'
    default:
      return 'text-gray-700'
  }
})

const progressBarClass = computed(() => {
  switch (props.status.status) {
    case 'validating':
      return 'bg-blue-600'
    case 'estimating':
      return 'bg-yellow-600'
    case 'deploying':
      return 'bg-blue-600'
    default:
      return 'bg-gray-600'
  }
})

const progressWidth = computed(() => {
  switch (props.status.status) {
    case 'validating':
      return 25
    case 'estimating':
      return 50
    case 'deploying':
      return 75
    case 'success':
      return 100
    case 'error':
      return 0
    default:
      return 0
  }
})

const isLoadingState = computed(() => {
  return ['validating', 'estimating', 'deploying'].includes(props.status.status)
})

// Methods
const formatTxHash = (hash: string): string => {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`
}

const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text)
    // You could show a toast notification here
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
  }
}

const copyTxHash = (): void => {
  if (props.status.txHash) {
    copyToClipboard(props.status.txHash)
  }
}

const copyContractAddress = (): void => {
  if (props.status.contractAddress) {
    copyToClipboard(props.status.contractAddress)
  }
}
</script>

<style scoped>
.deployment-status {
  @apply w-full;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
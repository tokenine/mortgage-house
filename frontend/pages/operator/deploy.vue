<template>
  <div class="deploy-page">
    <!-- Header -->
    <div class="page-header">
      <div class="flex items-center">
        <NuxtLink
          to="/operator"
          class="mr-4 p-2 text-gray-400 hover:text-gray-600"
        >
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </NuxtLink>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Deploy New Contract</h1>
          <p class="mt-1 text-sm text-gray-600">
            Create a new mortgage investment opportunity with specified parameters
          </p>
        </div>
      </div>
    </div>

    <!-- Connection Status -->
    <div v-if="!isConnected" class="connection-status">
      <div class="rounded-md bg-yellow-50 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-yellow-800">Wallet Not Connected</h3>
            <div class="mt-2 text-sm text-yellow-700">
              <p>Please connect your wallet to deploy mortgage contracts.</p>
            </div>
            <div class="mt-4">
              <div class="flex">
                <button
                  @click="connectWallet"
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Connect Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Network Status -->
    <div v-else-if="!isValidChain" class="network-status">
      <div class="rounded-md bg-red-50 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Wrong Network</h3>
            <div class="mt-2 text-sm text-red-700">
              <p>Please switch to Ethereum Mainnet to deploy contracts.</p>
            </div>
            <div class="mt-4">
              <div class="flex">
                <button
                  @click="switchNetwork"
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-800 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Switch Network
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="deploy-content">
      <!-- Progress Steps -->
      <div class="progress-steps">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div :class="getStepClass(1)" class="step">
              <span class="step-number">1</span>
            </div>
            <span class="ml-3 text-sm font-medium">Configure Parameters</span>
          </div>

          <div class="flex items-center">
            <div :class="getStepClass(2)" class="step">
              <span class="step-number">2</span>
            </div>
            <span class="ml-3 text-sm font-medium">Estimate Gas</span>
          </div>

          <div class="flex items-center">
            <div :class="getStepClass(3)" class="step">
              <span class="step-number">3</span>
            </div>
            <span class="ml-3 text-sm font-medium">Deploy Contract</span>
          </div>
        </div>

        <div class="mt-4">
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: progressPercentage + '%' }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Deployment Form -->
      <div class="deployment-form-container">
        <DeploymentForm
          :initial-data="initialFormData"
          @deployed="handleDeploymentSuccess"
          @error="handleDeploymentError"
        />
      </div>

      <!-- Recent Deployments -->
      <div v-if="recentDeployments.length > 0" class="recent-deployments">
        <h2 class="text-lg font-medium text-gray-900 mb-4">Recent Deployments</h2>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ContractCard
            v-for="contract in recentDeployments"
            :key="contract.address"
            :contract="contract"
            @view-details="viewContractDetails"
            @start-funding="startContractFunding"
            @refresh="refreshData"
          />
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="success-modal">
      <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" @click="closeSuccessModal">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" @click.stop>
          <div class="mt-3 text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 class="text-lg leading-6 font-medium text-gray-900 mt-4">Contract Deployed Successfully!</h3>
            <div class="mt-2 px-7 py-3">
              <p class="text-sm text-gray-500">
                Your mortgage contract has been deployed and is ready for funding.
              </p>
            </div>
            <div class="mt-4 bg-gray-50 p-4 rounded-md">
              <div class="text-sm space-y-2">
                <div>
                  <span class="font-medium">Contract Address:</span>
                  <a
                    :href="`https://etherscan.io/address/${deploymentResult?.contractAddress}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    {{ formatAddress(deploymentResult?.contractAddress) }}
                  </a>
                </div>
                <div>
                  <span class="font-medium">Transaction:</span>
                  <a
                    :href="`https://etherscan.io/tx/${deploymentResult?.txHash}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    {{ formatTxHash(deploymentResult?.txHash) }}
                  </a>
                </div>
              </div>
            </div>
            <div class="items-center px-4 py-3">
              <button
                @click="closeSuccessModal"
                class="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMortgageContract } from '~/composables/useMortgageContract'
import DeploymentForm from '~/components/operator/DeploymentForm.vue'
import ContractCard from '~/components/operator/ContractCard.vue'

const router = useRouter()

// Composable
const {
  isConnected,
  isValidChain,
  deployedContracts,
  deploymentStatus,
  switchToSupportedChain,
  ensureConnected,
  refreshData,
  startContractFunding
} = useMortgageContract()

// Local state
const currentStep = ref(1)
const showSuccessModal = ref(false)
const deploymentResult = ref<{
  contractAddress: string
  txHash: string
} | null>(null)

// Mock initial form data (could come from URL params or previous session)
const initialFormData = ref({
  usdtToken: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // Mainnet USDT
  interestRate: '7.5',
  loanTerm: '360'
})

// Computed properties
const progressPercentage = computed(() => {
  switch (deploymentStatus.value.status) {
    case 'idle':
    case 'validating':
      return 33
    case 'estimating':
      return 66
    case 'deploying':
      return 90
    case 'success':
      return 100
    case 'error':
      return 33
    default:
      return 33
  }
})

const recentDeployments = computed(() => {
  return deployedContracts.value
    .slice()
    .sort((a, b) => b.deployedAt - a.deployedAt)
    .slice(0, 3)
})

// Methods
const getStepClass = (step: number) => {
  const baseClass = 'step'
  const statusClass = step <= currentStep.value ? 'active' : 'inactive'
  return `${baseClass} ${statusClass}`
}

const connectWallet = async () => {
  try {
    await ensureConnected()
  } catch (error) {
    console.error('Failed to connect wallet:', error)
  }
}

const switchNetwork = async () => {
  try {
    await switchToSupportedChain()
  } catch (error) {
    console.error('Failed to switch network:', error)
  }
}

const handleDeploymentSuccess = (contractAddress: string, txHash: string) => {
  deploymentResult.value = { contractAddress, txHash }
  showSuccessModal.value = true
  currentStep.value = 3

  // Refresh contracts list
  refreshData()
}

const handleDeploymentError = (error: Error) => {
  console.error('Deployment failed:', error)
  // Error handling is done in the component
}

const closeSuccessModal = () => {
  showSuccessModal.value = false
  router.push('/operator/contracts')
}

const viewContractDetails = (contractAddress: string) => {
  router.push(`/operator/contracts/${contractAddress}`)
}

const formatAddress = (address?: string): string => {
  if (!address) return 'N/A'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const formatTxHash = (hash?: string): string => {
  if (!hash) return 'N/A'
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`
}

// Watch deployment status to update current step
watch(deploymentStatus, (newStatus) => {
  switch (newStatus.status) {
    case 'idle':
      currentStep.value = 1
      break
    case 'validating':
      currentStep.value = 1
      break
    case 'estimating':
      currentStep.value = 2
      break
    case 'deploying':
      currentStep.value = 3
      break
    case 'success':
      currentStep.value = 3
      break
    case 'error':
      currentStep.value = 1
      break
  }
}, { immediate: true })

// Lifecycle
onMounted(async () => {
  if (isConnected.value && isValidChain.value) {
    await refreshData()
  }
})

// Page metadata
definePageMeta({
  title: 'Deploy New Contract',
  description: 'Create a new mortgage investment opportunity'
})
</script>

<style scoped>
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

.deploy-page {
  @apply space-y-6 p-6;
}

.page-header {
  @apply pb-6 border-b border-gray-200;
}

.connection-status,
.network-status {
  @apply mb-6;
}

.deploy-content {
  @apply space-y-6;
}

.progress-steps {
  @apply bg-white p-6 rounded-lg shadow-sm border border-gray-200;
}

.step {
  @apply flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium;
}

.step.active {
  @apply bg-blue-600 border-blue-600 text-white;
}

.step.inactive {
  @apply bg-white border-gray-300 text-gray-500;
}

.deployment-form-container {
  @apply bg-white rounded-lg shadow-sm border border-gray-200;
}

.recent-deployments {
  @apply bg-white p-6 rounded-lg shadow-sm border border-gray-200;
}

.success-modal {
  @apply fixed z-50 inset-0 overflow-y-auto;
}
</style>
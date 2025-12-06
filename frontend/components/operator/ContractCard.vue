<template>
  <div class="contract-card">
    <!-- Card Header -->
    <div class="card-header">
      <div class="flex justify-between items-start">
        <div class="contract-info">
          <h3 class="contract-title">
            {{ formatAddress(contract.address) }}
          </h3>
          <p class="contract-stage" :class="stageClass">
            {{ getStageName(contract.currentStage) }}
          </p>
        </div>
        <div class="contract-actions">
          <button
            @click="$emit('refresh')"
            class="p-1 text-gray-400 hover:text-gray-600"
            title="Refresh contract data"
          >
            <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Card Body -->
    <div class="card-body">
      <!-- Property Info -->
      <div class="property-section">
        <h4 class="section-title">Property</h4>
        <p class="property-description">
          {{ truncateText(contract.propertyDescription, 100) }}
        </p>
      </div>

      <!-- Loan Details -->
      <div class="loan-details">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="detail-label">Loan Amount</p>
            <p class="detail-value">${{ formatNumber(parseFloat(contract.loanAmount) || 0) }}</p>
          </div>
          <div>
            <p class="detail-label">Interest Rate</p>
            <p class="detail-value">{{ contract.interestRate }}%</p>
          </div>
          <div>
            <p class="detail-label">Term</p>
            <p class="detail-value">{{ contract.loanTerm }} months</p>
          </div>
          <div>
            <p class="detail-label">Borrower</p>
            <p class="detail-value">{{ formatAddress(contract.borrower) }}</p>
          </div>
        </div>
      </div>

      <!-- Funding Progress (if in funding stage) -->
      <div v-if="showFundingProgress" class="funding-progress">
        <div class="flex justify-between items-center mb-2">
          <h4 class="section-title">Funding Progress</h4>
          <span class="progress-percentage">{{ fundingProgressPercentage }}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div
            class="funding-progress-bar"
            :style="{ width: fundingProgressPercentage + '%' }"
          ></div>
        </div>
        <div class="flex justify-between items-center mt-2 text-xs text-gray-600">
          <span>${{ formatNumber(totalFunded) }} raised</span>
          <span>${{ formatNumber(targetAmount) }} goal</span>
        </div>
        <div class="flex justify-between items-center mt-2 text-xs text-gray-600">
          <span>{{ contract.investorCount || 0 }} investors</span>
          <span>{{ getRemainingDays() }} days left</span>
        </div>
      </div>

      <!-- Investment Metrics -->
      <div v-if="contract.currentStage === 'FUNDED' || contract.currentStage === 'ACTIVE'" class="investment-metrics">
        <h4 class="section-title">Investment Overview</h4>
        <div class="metrics-grid">
          <div class="metric-item">
            <p class="metric-value">${{ formatNumber(totalInvested) }}</p>
            <p class="metric-label">Total Invested</p>
          </div>
          <div class="metric-item">
            <p class="metric-value">{{ contract.investorCount || 0 }}</p>
            <p class="metric-label">Investors</p>
          </div>
          <div class="metric-item">
            <p class="metric-value">${{ formatNumber(totalRepaid) }}</p>
            <p class="metric-label">Total Repaid</p>
          </div>
        </div>
      </div>

      <!-- Repayment Status -->
      <div v-if="contract.currentStage === 'ACTIVE'" class="repayment-status">
        <h4 class="section-title">Repayment Status</h4>
        <div class="repayment-metrics">
          <div class="repayment-item">
            <span class="repayment-label">Principal Repaid:</span>
            <span class="repayment-value">${{ formatNumber(principalRepaid) }} / ${{ formatNumber(parseFloat(contract.loanAmount) || 0) }}</span>
          </div>
          <div class="repayment-item">
            <span class="repayment-label">Interest Paid:</span>
            <span class="repayment-value">${{ formatNumber(interestPaid) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Card Footer -->
    <div class="card-footer">
      <div class="flex justify-between items-center">
        <div class="deployment-info">
          <p class="text-xs text-gray-500">
            Deployed {{ formatRelativeTime(contract.deployedAt) }}
          </p>
          <a
            :href="`https://etherscan.io/tx/${contract.txHash}`"
            target="_blank"
            rel="noopener noreferrer"
            class="text-xs text-blue-600 hover:text-blue-800"
          >
            View transaction
          </a>
        </div>

        <div class="action-buttons">
          <button
            @click="viewDetails"
            class="btn-primary"
          >
            View Details
          </button>

          <button
            v-if="canStartFunding"
            @click="startFunding"
            class="btn-secondary"
          >
            Start Funding
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface ContractData {
  address: string
  borrower: string
  loanAmount: string
  usdtToken: string
  interestRate: string
  loanTerm: string
  propertyDescription: string
  deployedAt: number
  txHash: string
  currentStage?: string
  totalFunded?: string
  investorCount?: number
  principalRepaid?: string
  interestPaid?: string
}

interface Props {
  contract: ContractData
}

const props = defineProps<Props>()

defineEmits<{
  viewDetails: [contractAddress: string]
  startFunding: [contractAddress: string]
  refresh: []
}>()

// Computed properties
const stageClass = computed(() => {
  const stage = props.contract.currentStage
  switch (stage) {
    case 'NOT_STARTED':
      return 'stage-not-started'
    case 'FUNDING':
      return 'stage-funding'
    case 'FUNDED':
      return 'stage-funded'
    case 'ACTIVE':
      return 'stage-active'
    case 'REPAID':
      return 'stage-repaid'
    default:
      return 'stage-unknown'
  }
})

const showFundingProgress = computed(() => {
  return props.contract.currentStage === 'FUNDING'
})

const totalInvested = computed(() => {
  return parseFloat(props.contract.totalFunded || '0') || 0
})

const targetAmount = computed(() => {
  return parseFloat(props.contract.loanAmount) || 0
})

const fundingProgressPercentage = computed(() => {
  if (targetAmount.value === 0) return 0
  return Math.min(Math.round((totalInvested.value / targetAmount.value) * 100), 100)
})

const canStartFunding = computed(() => {
  return props.contract.currentStage === 'NOT_STARTED'
})

const totalRepaid = computed(() => {
  const principal = parseFloat(props.contract.principalRepaid || '0') || 0
  const interest = parseFloat(props.contract.interestPaid || '0') || 0
  return principal + interest
})

const principalRepaid = computed(() => {
  return parseFloat(props.contract.principalRepaid || '0') || 0
})

const interestPaid = computed(() => {
  return parseFloat(props.contract.interestPaid || '0') || 0
})

// Methods
const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const formatNumber = (num: number): string => {
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`

  const date = new Date(timestamp)
  return date.toLocaleDateString()
}

const getStageName = (stage?: string): string => {
  switch (stage) {
    case 'NOT_STARTED':
      return 'Not Started'
    case 'FUNDING':
      return 'Funding'
    case 'FUNDED':
      return 'Funded'
    case 'ACTIVE':
      return 'Active'
    case 'REPAID':
      return 'Repaid'
    default:
      return 'Unknown'
  }
}

const getRemainingDays = (): string => {
  // This would calculate based on funding deadline
  // For now, return a mock value
  return '30'
}

const viewDetails = (): void => {
  emit('viewDetails', props.contract.address)
}

const startFunding = (): void => {
  emit('startFunding', props.contract.address)
}
</script>

<style scoped>
.contract-card {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200;
}

.card-header {
  @apply p-4 pb-3;
}

.card-body {
  @apply px-4 pb-3;
}

.card-footer {
  @apply px-4 py-3 bg-gray-50 border-t border-gray-200;
}

.contract-info {
  @apply flex-1;
}

.contract-title {
  @apply text-lg font-medium text-gray-900 font-mono text-sm;
}

.contract-stage {
  @apply text-xs font-medium px-2 py-1 rounded-full mt-1 inline-block;
}

.stage-not-started {
  @apply bg-gray-100 text-gray-800;
}

.stage-funding {
  @apply bg-blue-100 text-blue-800;
}

.stage-funded {
  @apply bg-green-100 text-green-800;
}

.stage-active {
  @apply bg-purple-100 text-purple-800;
}

.stage-repaid {
  @apply bg-yellow-100 text-yellow-800;
}

.stage-unknown {
  @apply bg-gray-100 text-gray-800;
}

.contract-actions {
  @apply flex space-x-1;
}

.property-section {
  @apply mb-4;
}

.section-title {
  @apply text-sm font-medium text-gray-900 mb-2;
}

.property-description {
  @apply text-sm text-gray-600;
}

.loan-details {
  @apply mb-4;
}

.detail-label {
  @apply text-xs text-gray-500 mb-1;
}

.detail-value {
  @apply text-sm font-medium text-gray-900;
}

.funding-progress {
  @apply mb-4 p-3 bg-blue-50 rounded-md;
}

.progress-percentage {
  @apply text-sm font-medium text-blue-900;
}

.funding-progress-bar {
  @apply bg-blue-600 h-2 rounded-full transition-all duration-300;
}

.investment-metrics {
  @apply mb-4;
}

.metrics-grid {
  @apply grid grid-cols-3 gap-2;
}

.metric-item {
  @apply text-center;
}

.metric-value {
  @apply text-sm font-medium text-gray-900;
}

.metric-label {
  @apply text-xs text-gray-500;
}

.repayment-status {
  @apply mb-4 p-3 bg-purple-50 rounded-md;
}

.repayment-metrics {
  @apply space-y-1;
}

.repayment-item {
  @apply flex justify-between text-xs;
}

.repayment-label {
  @apply text-gray-600;
}

.repayment-value {
  @apply font-medium text-gray-900;
}

.deployment-info {
  @apply text-left;
}

.action-buttons {
  @apply flex space-x-2;
}

.btn-primary {
  @apply inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}

.btn-secondary {
  @apply inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}
</style>
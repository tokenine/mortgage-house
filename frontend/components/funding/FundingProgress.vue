<template>
  <div class="funding-progress">
    <!-- Real-time Connection Status -->
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center">
        <div
          class="w-2 h-2 rounded-full mr-2"
          :class="isConnectedRealtime ? 'bg-green-500' : 'bg-gray-400'"
        ></div>
        <span class="text-sm text-gray-600">
          {{ isConnectedRealtime ? 'Live updates active' : 'Real-time disconnected' }}
        </span>
      </div>
      <div v-if="isConnecting" class="text-sm text-blue-600">
        Connecting...
      </div>
    </div>

    <!-- Progress Bar Section -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-gray-900">Funding Progress</h3>
        <span class="progress-percentage text-2xl font-bold text-blue-600">
          {{ fundingProgress.toFixed(1) }}%
        </span>
      </div>

      <!-- Progress Bar with Milestones -->
      <div class="mb-4">
        <div class="relative">
          <!-- Main progress bar -->
          <div class="w-full bg-gray-200 rounded-full h-4">
            <div
              class="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500 ease-out"
              :style="{ width: `${Math.min(fundingProgress, 100)}%` }"
            ></div>
          </div>

          <!-- Milestone markers -->
          <div class="flex justify-between mt-2">
            <div
              v-for="milestone in milestones"
              :key="milestone.percentage"
              class="funding-milestone text-center"
              :class="{ 'milestone-active': fundingProgress >= milestone.percentage }"
            >
              <div class="text-xs font-medium" :class="milestoneClass(milestone.percentage)">
                {{ milestone.percentage }}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Funding Details -->
      <div class="flex justify-between items-center mb-4">
        <span class="text-lg font-semibold text-gray-900">
          {{ formattedTotalInvested }} USDT
        </span>
        <span class="text-lg font-semibold text-gray-900">
          of {{ formattedFundingTarget }} USDT
        </span>
      </div>

      <!-- Time Estimate -->
      <div v-if="!isFullyFunded && estimatedCompletion" class="time-estimate text-sm text-gray-600">
        Estimated completion: {{ estimatedCompletion }}
      </div>
    </div>

    <!-- Stage Transition Manager -->
    <StageTransitionManager
      :funding-progress="fundingProgress"
      :total-invested="totalInvested"
      :show-history-button="true"
    />

    <!-- Investor Position -->
    <InvestorPosition
      :can-withdraw="fundingStage > 2"
      :can-transfer="fundingStage === 1"
      @withdraw="handleWithdraw"
      @transfer="handleTransfer"
      @details="handleDetails"
      @invest="handleInvest"
    />

    <!-- Transaction Feed -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <TransactionFeed
        :transactions="transactionFeedData"
        :is-loading="isUpdating && transactions.length === 0"
        :is-updating="isUpdating"
        :is-live="isConnectedRealtime"
        title="Recent Investments"
        empty-message="No investments yet. Be the first to invest!"
        :items-per-page="20"
        :is-highlight-new="true"
        @refresh="refreshData"
      />
    </div>

    <!-- Notification Manager -->
    <NotificationManager
      ref="notificationManager"
      :max-notifications="5"
      :show-settings-button="true"
      :show-counter="true"
      :enable-sound="false"
      :enable-desktop="false"
    />

    <!-- Funding Complete Notification -->
    <div v-if="isFullyFunded" class="funding-complete-notification fixed top-4 right-4 max-w-sm bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 z-50">
      <div class="flex items-center">
        <svg class="w-6 h-6 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
        <div>
          <h5 class="font-semibold text-green-900">Funding Complete!</h5>
          <p class="text-sm text-green-700">
            The mortgage has been fully funded and will transition to active status.
          </p>
        </div>
      </div>
    </div>

    <!-- Stage Transition Notification -->
    <div v-if="stageChanged" class="fixed top-4 right-4 max-w-sm bg-blue-50 border border-blue-200 rounded-lg shadow-lg p-4 z-50">
      <div class="flex items-center">
        <svg class="w-6 h-6 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
        </svg>
        <div>
          <h5 class="font-semibold text-blue-900">Stage Changed</h5>
          <p class="text-sm text-blue-700">
            Mortgage is now {{ stageName }}. Investment functionality is {{ canInvest ? 'available' : 'disabled' }}.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch, readonly } from 'vue'
import { useMortgageContract } from '~/composables/useMortgageContract'
import { useReadContract } from '@wagmi/vue'
import { useRealTimeEvents } from '~/composables/useRealTimeEvents'
import { MORTGAGE_CONTRACT_ABI } from '~/utils/contract/constants'
import InvestorPosition from './InvestorPosition.vue'
import TransactionFeed from './TransactionFeed.vue'
import StageTransitionManager from './StageTransitionManager.vue'
import NotificationManager from './NotificationManager.vue'
import { formatUSDT, parseUSDT, getStageName } from '~/utils/contract/constants'
import { perf, debounce, throttle, BatchProcessor, Cache } from '~/utils/performance'

// Types
interface Transaction {
  id: string
  investor: string
  amount: bigint
  shares: bigint
  timestamp: number
  txHash: string
}

interface Milestone {
  percentage: number
  label: string
  color: string
}

// Props
interface Props {
  contractAddress?: string
  autoRefresh?: boolean
  initialTransactions?: Transaction[]
}

const props = withDefaults(defineProps<Props>(), {
  autoRefresh: true
})

// Composables
const {
  isConnected,
  totalInvested,
  totalShares,
  investorShares,
  investorCount,
  fundingStage,
  usdtBalance,
  formatAmount,
  formatPercentage,
  refreshData,
  getBlockExplorerUrl,
  contractAddress
} = useMortgageContract()

// Real-time events (conditionally initialized to avoid test issues)
const realTimeEvents = ref(null)
const isConnectedRealtime = ref(false)
const isConnecting = ref(false)

// Only initialize real-time events in non-test environment
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
  try {
    const realTime = useRealTimeEvents({
      autoConnect: true,
      pollingInterval: 5000,
      enableWebSocket: false
    })

    isConnectedRealtime.value = realTime.isConnectedRealtime.value
    isConnecting.value = realTime.isConnecting.value
    realTimeEvents.value = realTime
  } catch (error) {
    console.warn('Real-time events initialization failed:', error)
  }
}

// Local state
const transactions = ref<Transaction[]>(props.initialTransactions || [])
const isUpdating = ref(false)
const displayedCount = ref(20)
const stageChanged = ref(false)
const lastKnownStage = ref(0)
const refreshInterval = ref<NodeJS.Timeout | null>(null)
const notificationManager = ref()

// Get loan amount from contract
const { data: loanAmount } = useReadContract({
  address: contractAddress.value,
  abi: MORTGAGE_CONTRACT_ABI,
  functionName: 'loanAmount'
})

// Configuration - use readonly to prevent reactivity issues
const FUNDING_TARGET = computed(() => loanAmount.value || 100000n * 10n**6n) // 100k USDT fallback
const MILESTONES: Milestone[] = [
  { percentage: 25, label: 'Quarter', color: 'yellow' },
  { percentage: 50, label: 'Halfway', color: 'blue' },
  { percentage: 75, label: 'Mostly', color: 'purple' },
  { percentage: 100, label: 'Complete', color: 'green' }
]

// Computed properties (Performance optimized)
const fundingProgress = computed(() => {
  return optimizedFundingProgress.value
})

const isFullyFunded = computed(() => fundingProgress.value >= 100)

const formattedTotalInvested = computed(() => formatUSDT(totalInvested.value))

const formattedFundingTarget = computed(() => formatUSDT(FUNDING_TARGET.value))

const formattedInvestorShares = computed(() => formatUSDT(investorShares.value))

const userSharePercentage = computed(() => {
  if (!totalShares.value || totalShares.value === 0n) return 0
  return Number((investorShares.value * 10000n) / totalShares.value) / 100
})

const projectedReturns = computed(() => {
  // Simple projection: 5% annual return, prorated for demo
  if (!investorShares.value) return '0.00'
  const annualReturn = (investorShares.value * 5n) / 100n
  return formatUSDT(annualReturn)
})

const isPositionLocked = computed(() => {
  return fundingStage.value > 1 // Lock after FUNDING stage
})

const stageName = computed(() => getStageName(fundingStage.value))

const canInvest = computed(() => {
  return fundingStage.value === 1 // Only in FUNDING stage
})

const milestones = computed(() => MILESTONES)

const filteredTransactions = computed(() => {
  return transactions.value
    .slice()
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, displayedCount.value)
})

const displayedTransactions = computed(() => {
  return filteredTransactions.value
})

const hasMoreTransactions = computed(() => {
  return transactions.value.length > displayedCount.value
})

// Computed property for TransactionFeed component
const transactionFeedData = computed(() => {
  return transactions.value.map(tx => ({
    id: tx.id,
    type: 'Invested' as const,
    investor: tx.investor,
    amount: tx.amount,
    shares: tx.shares,
    timestamp: tx.timestamp,
    txHash: tx.txHash,
    status: 'confirmed' as const, // Default to confirmed for demo
    token: 'USDT',
    isNew: Date.now() - tx.timestamp < 30000 // Mark as new if less than 30 seconds old
  }))
})

// Calculate estimated completion based on recent funding velocity - simplified
const estimatedCompletion = computed(() => {
  if (isFullyFunded.value || transactions.value.length < 2) return 'Estimating...'

  // Simple estimate based on average of last few transactions
  const recentCount = Math.min(5, transactions.value.length)
  const recentTransactions = transactions.value.slice(-recentCount)

  if (recentTransactions.length < 2) return 'Estimating...'

  const timeSpan = recentTransactions[recentTransactions.length - 1].timestamp - recentTransactions[0].timestamp
  const totalAmount = recentTransactions.reduce((sum, tx) => sum + tx.amount, 0n)

  if (timeSpan <= 0 || totalAmount === 0n) return 'Estimating...'

  const velocity = Number(totalAmount) / (timeSpan / 1000) // USDT per second
  const remaining = FUNDING_TARGET - totalInvested.value

  if (velocity <= 0) return 'Estimating...'

  const estimatedSeconds = Number(remaining) / velocity

  if (estimatedSeconds < 60) return 'Less than a minute'
  if (estimatedSeconds < 3600) return `${Math.floor(estimatedSeconds / 60)} minutes`
  if (estimatedSeconds < 86400) return `${Math.floor(estimatedSeconds / 3600)} hours`
  return `${Math.floor(estimatedSeconds / 86400)} days`
})

// Methods
const maskAddress = (address: string): string => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const formatTimestamp = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  return `${days} day${days > 1 ? 's' : ''} ago`
}

const milestoneClass = (percentage: number): string => {
  if (fundingProgress.value >= percentage) {
    return 'text-green-600 font-bold'
  }
  return 'text-gray-500'
}

const showMoreTransactions = () => {
  displayedCount.value += 20
}

// Investor Position Event Handlers
const handleWithdraw = () => {
  console.log('Withdraw requested')
  // Implementation for withdrawal logic would go here
}

const handleTransfer = () => {
  console.log('Transfer requested')
  // Implementation for transfer logic would go here
}

const handleDetails = () => {
  console.log('Details requested')
  // Implementation for showing detailed position information
}

const handleInvest = () => {
  console.log('Invest requested')
  // Implementation for showing investment form
}

// Event handlers (Performance optimized)
const handleInvestmentEvent = throttle((event: { investor: string; amount: bigint; shares: bigint }) => {
  // Only use performance monitoring in development
  const timer = process.env.NODE_ENV === 'development' ? perf.startTimer('handleInvestmentEvent') : () => {}

  try {
    const transaction: Transaction = {
      id: `${event.investor}-${Date.now()}`,
      investor: event.investor,
      amount: event.amount,
      shares: event.shares,
      timestamp: Date.now(),
      txHash: `0x${Math.random().toString(16).substr(2, 8)}...`
    }

    // Use batch processor for high-frequency updates
    transactionBatchProcessor.add({
      type: 'add',
      data: transaction
    })

    // Show notification about new investment
    if (notificationManager.value) {
      notificationManager.value.showInvestmentNotification(
        event.investor,
        event.amount,
        event.shares,
        transaction.txHash
      )
    }

    // Debounced refresh for performance
    debouncedRefresh()
  } finally {
    timer()
  }
}, 100) // Throttle to max 10 events per second

// Optimized computed properties with caching
const optimizedFundingProgress = computed(() => {
  const cacheKey = 'funding-progress'

  let progress = computedCache.get(cacheKey)
  if (progress) return progress

  if (!totalInvested.value) return 0
  progress = Number((totalInvested.value * 100n) / FUNDING_TARGET)

  computedCache.set(cacheKey, progress, 5000) // Cache for 5 seconds
  return progress
})

const handleStageChangeEvent = (oldStage: number, newStage: number) => {
  if (oldStage !== newStage) {
    stageChanged.value = true
    lastKnownStage.value = oldStage

    // Show stage change notification
    if (notificationManager.value) {
      const stageNames = ['Not Started', 'Funding', 'Funded', 'Active', 'Repaid']
      const description = `The mortgage has transitioned from ${stageNames[oldStage]} to ${stageNames[newStage]}.`

      notificationManager.value.showStageChangeNotification(
        oldStage,
        newStage,
        description
      )

      // Show funding complete notification if moving to Funded stage
      if (newStage === 2) {
        notificationManager.value.showFundingCompleteNotification(
          totalInvested.value,
          investorCount.value
        )
      }
    }

    // Hide notification after 5 seconds
    setTimeout(() => {
      stageChanged.value = false
    }, 5000)

    refreshData()
  }
}

// Performance-optimized refresh function
const debouncedRefresh = debounce(() => {
  // Only use performance monitoring in development
  const timer = process.env.NODE_ENV === 'development' ? perf.startTimer('refresh') : () => {}

  try {
    if (!isUpdating.value) {
      refreshData()
    }
  } finally {
    timer()
  }
}, 500)

// Batch processor for transaction updates
const transactionBatchProcessor = new BatchProcessor((batch) => {
  // Only use performance monitoring in development
  const timer = process.env.NODE_ENV === 'development' ? perf.startTimer('processBatch') : () => {}

  try {
    // Process transaction batch
    batch.forEach(item => {
      if (item.type === 'add') {
        transactions.value.unshift(item.data)
      }
    })

    // Limit transactions to prevent memory issues
    if (transactions.value.length > 1000) {
      transactions.value = transactions.value.slice(0, 1000)
    }

    console.log(`Processed batch of ${batch.length} transactions`)
  } finally {
    timer()
  }
}, { batchSize: 10, flushDelay: process.env.NODE_ENV === 'test' ? 0 : 100 })

// Cache for computed values
const computedCache = new Cache<string, any>(100, 10000)

// Performance monitoring
const perfMonitor = perf.performanceMonitor

// Watchers - simplified to avoid recursion
watch(fundingStage, (newStage, oldStage) => {
  if (oldStage !== undefined && newStage !== oldStage) {
    handleStageChangeEvent(oldStage, newStage)
  }
})

// Lifecycle
onMounted(async () => {
  try {
    // Subscribe to real-time events if available
    let unsubscribe = null
    if (realTimeEvents.value) {
      unsubscribe = realTimeEvents.value.subscribeToEvents((event) => {
        // Handle real-time events
        if (event.type === 'Invested') {
          handleInvestmentEvent({
            investor: event.data.investor,
            amount: event.data.amount,
            shares: event.data.shares
          })
        } else if (event.type === 'StageChanged') {
          handleStageChangeEvent(event.data.oldStage, event.data.newStage)
        }

        // Set updating state for visual feedback
        isUpdating.value = true
        setTimeout(() => {
          isUpdating.value = false
        }, 1000)
      })
    }

    // Load initial data
    await refreshData()

    // Mock some initial transactions for demo if none provided
    if (transactions.value.length === 0 && !props.initialTransactions) {
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          investor: '0x1234567890123456789012345678901234567890',
          amount: 5000n * 10n**6n,
          shares: 5000n * 10n**6n,
          timestamp: Date.now() - 300000, // 5 minutes ago
          txHash: '0xabc123...'
        },
        {
          id: '2',
          investor: '0x2345678901234567890123456789012345678901',
          amount: 3000n * 10n**6n,
          shares: 3000n * 10n**6n,
          timestamp: Date.now() - 600000, // 10 minutes ago
          txHash: '0xdef456...'
        },
        {
          id: '3',
          investor: '0x3456789012345678901234567890123456789012',
          amount: 2000n * 10n**6n,
          shares: 2000n * 10n**6n,
          timestamp: Date.now() - 900000, // 15 minutes ago
          txHash: '0xghi789...'
        }
      ]
      transactions.value = mockTransactions
    }

    // Set up auto-refresh if enabled (as fallback)
    if (props.autoRefresh) {
      refreshInterval.value = setInterval(() => {
        debouncedRefresh()
      }, 30000) // Refresh every 30 seconds
    }

    // Store unsubscribe for cleanup
    if (unsubscribe) {
      onUnmounted(() => {
        unsubscribe()
      })
    }
  } catch (error) {
    console.error('Failed to initialize FundingProgress:', error)
  }
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }

  // Performance cleanup
  transactionBatchProcessor.clear()
  computedCache.clear()
  perfMonitor.clear()

  // Log performance metrics in development
  if (process.env.NODE_ENV === 'development') {
    const stats = perfMonitor.getAllStats()
    console.log('Performance Stats:', stats)
  }
})

// Expose methods for testing
defineExpose({
  handleInvestmentEvent,
  estimatedCompletion,
  transactions: readonly(transactions),
  isUpdating: readonly(isUpdating),
  transactionBatchProcessor,
  flushTransactions: () => transactionBatchProcessor.flush()
})
</script>

<style scoped>
.funding-progress {
  @apply space-y-6;
}

.milestone-active {
  @apply text-green-600 font-bold;
}

.transaction-item {
  @apply transition-all duration-200;
}

.transaction-item:hover {
  @apply shadow-md;
}

.explorer-link {
  @apply inline-flex items-center space-x-1;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.funding-complete-notification,
.stage-notification {
  animation: fadeIn 0.3s ease-out;
}
</style>
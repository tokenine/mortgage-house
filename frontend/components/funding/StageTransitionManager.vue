<template>
  <div class="stage-transition-manager">
    <!-- Current Stage Display -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <div class="flex justify-between items-center mb-4">
        <h4 class="text-lg font-bold text-gray-900">Mortgage Stage</h4>
        <div class="flex items-center">
          <div
            class="w-2 h-2 rounded-full mr-2 animate-pulse"
            :class="getStageStatusColor(currentStage)"
          ></div>
          <span class="text-sm font-medium" :class="getStageStatusTextColor(currentStage)">
            {{ getStageStatus(currentStage) }}
          </span>
        </div>
      </div>

      <!-- Stage Progress Bar -->
      <div class="mb-6">
        <div class="relative">
          <!-- Stage Line -->
          <div class="flex justify-between relative">
            <div class="absolute top-5 left-0 right-0 h-0.5 bg-gray-200"></div>

            <!-- Stage Steps -->
            <div
              v-for="(stage, index) in stages"
              :key="stage.id"
              class="relative z-10 flex flex-col items-center"
            >
              <!-- Stage Node -->
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300"
                :class="getStageNodeClass(stage.id)"
              >
                <component :is="stage.icon" class="w-5 h-5" />
              </div>

              <!-- Stage Label -->
              <div class="text-center">
                <div class="text-sm font-medium" :class="getStageTextColor(stage.id)">
                  {{ stage.name }}
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  {{ stage.description }}
                </div>
              </div>

              <!-- Stage Completion Time (if completed) -->
              <div v-if="isStageCompleted(stage.id)" class="text-xs text-gray-400 mt-1">
                {{ getStageCompletionTime(stage.id) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Current Stage Details -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h5 class="font-semibold text-gray-900 mb-2">{{ currentStageData?.name }}</h5>
        <p class="text-sm text-gray-600 mb-4">{{ currentStageData?.description }}</p>

        <!-- Stage-Specific Information -->
        <div v-if="currentStage === 1" class="space-y-3">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Funding Progress:</span>
            <span class="font-medium">{{ fundingProgress.toFixed(1) }}%</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Minimum Investment:</span>
            <span class="font-medium">1 USDT</span>
          </div>
        </div>

        <div v-else-if="currentStage === 2" class="space-y-3">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Total Funded:</span>
            <span class="font-medium text-green-600">{{ formattedTotalInvested }} USDT</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Next Stage:</span>
            <span class="font-medium">Active</span>
          </div>
        </div>

        <div v-else-if="currentStage === 3" class="space-y-3">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Loan Status:</span>
            <span class="font-medium text-blue-600">Active</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Expected Repayment:</span>
            <span class="font-medium">{{ expectedRepaymentDate }}</span>
          </div>
        </div>

        <div v-else-if="currentStage === 4" class="space-y-3">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Status:</span>
            <span class="font-medium text-green-600">Completed</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Final Repayment:</span>
            <span class="font-medium">{{ finalRepaymentDate }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Stage Transition Notifications -->
    <div
      v-if="showStageTransition"
      class="fixed top-4 right-4 max-w-sm z-50 animate-slide-in"
    >
      <div
        class="rounded-lg shadow-lg p-4 border"
        :class="getTransitionNotificationClass()"
      >
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <div
              class="w-6 h-6 rounded-full flex items-center justify-center"
              :class="getTransitionIconClass()"
            >
              <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.586 7.293 6.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L10.586 11.414l-2.293 2.293a1 1 0 101.414 1.414l2.293-2.293 2.293 2.293a1 1 0 001.414-1.414l-2.293-2.293z" clip-rule="evenodd"/>
              </svg>
            </div>
          </div>
          <div class="ml-3 flex-1">
            <h3 class="text-sm font-medium" :class="getTransitionTitleClass()">
              Stage Changed to {{ transitionData?.newStageData?.name }}
            </h3>
            <p class="text-sm mt-1" :class="getTransitionTextClass()">
              {{ getTransitionMessage() }}
            </p>
            <div class="mt-2 flex justify-between text-xs">
              <span>{{ getTransitionTimestamp() }}</span>
              <button
                @click="showStageTransition = false"
                class="text-current hover:underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Critical Stage Change Modal -->
    <div
      v-if="showCriticalTransition"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    >
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3 text-center">
          <div
            class="mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4"
            :class="getCriticalTransitionIconBg()"
          >
            <component :is="transitionData?.newStageData?.icon" class="w-6 h-6 text-white" />
          </div>
          <h3 class="text-lg leading-6 font-medium text-gray-900">
            Critical Stage Transition
          </h3>
          <div class="mt-2 px-7 py-3">
            <p class="text-sm text-gray-500">
              {{ transitionData?.newStageData?.description }}
            </p>
            <div class="mt-4 p-3 bg-gray-50 rounded-md text-left">
              <div class="text-sm font-medium text-gray-900 mb-1">What this means:</div>
              <ul class="text-sm text-gray-600 space-y-1">
                <li v-for="impact in getStageImpacts()" :key="impact">
                  {{ impact }}
                </li>
              </ul>
            </div>
          </div>
          <div class="items-center px-4 py-3">
            <button
              @click="showCriticalTransition = false"
              class="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Stage History Timeline -->
    <div v-if="showStageHistory && stageHistory.length > 0" class="bg-white rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h4 class="text-lg font-bold text-gray-900">Stage History</h4>
        <button
          @click="showStageHistory = false"
          class="text-gray-400 hover:text-gray-600"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="space-y-4">
        <div
          v-for="(historyItem, index) in stageHistory"
          :key="index"
          class="flex items-start space-x-3"
        >
          <div class="flex-shrink-0 mt-1">
            <div
              class="w-2 h-2 rounded-full"
              :class="getStageStatusColor(historyItem.stage)"
            ></div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium text-gray-900">
                {{ getStageName(historyItem.stage) }}
              </p>
              <p class="text-xs text-gray-500">
                {{ formatHistoryTimestamp(historyItem.timestamp) }}
              </p>
            </div>
            <p class="text-sm text-gray-600 mt-1">
              {{ historyItem.description }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useMortgageContract } from '~/composables/useMortgageContract'

// Types
interface StageData {
  id: number
  name: string
  description: string
  icon: string
  color: string
}

interface StageHistory {
  stage: number
  timestamp: number
  description: string
}

interface StageTransition {
  oldStage: number
  newStage: number
  oldStageData: StageData
  newStageData: StageData
  timestamp: number
  description: string
}

// Props
interface Props {
  fundingProgress?: number
  totalInvested?: bigint
  showHistoryButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  fundingProgress: 0,
  totalInvested: 0n,
  showHistoryButton: true
})

// Composable
const { fundingStage, totalInvested } = useMortgageContract()

// Local state
const showStageTransition = ref(false)
const showCriticalTransition = ref(false)
const showStageHistory = ref(false)
const transitionData = ref<StageTransition | null>(null)
const stageHistory = ref<StageHistory[]>([])
const lastKnownStage = ref(0)

// Stage definitions
const stages = computed<StageData[]>(() => [
  {
    id: 0,
    name: 'Not Started',
    description: 'Mortgage has not been initiated yet',
    icon: 'StageIcon',
    color: 'gray'
  },
  {
    id: 1,
    name: 'Funding',
    description: 'Investors can contribute funds to the mortgage',
    icon: 'FundingIcon',
    color: 'blue'
  },
  {
    id: 2,
    name: 'Funded',
    description: 'Target funding amount has been reached',
    icon: 'FundedIcon',
    color: 'green'
  },
  {
    id: 3,
    name: 'Active',
    description: 'Mortgage is active and loan has been issued',
    icon: 'ActiveIcon',
    color: 'purple'
  },
  {
    id: 4,
    name: 'Repaid',
    description: 'Mortgage has been fully repaid with interest',
    icon: 'RepaidIcon',
    color: 'yellow'
  }
])

// Computed properties
const currentStage = computed(() => fundingStage.value)

const currentStageData = computed(() => {
  return stages.value.find(stage => stage.id === currentStage.value)
})

const isStageCompleted = (stageId: number) => {
  return currentStage.value > stageId
}

// Date calculations
const expectedRepaymentDate = computed(() => {
  const date = new Date()
  date.setFullYear(date.getFullYear() + 2) // 2-year mortgage
  return date.toLocaleDateString()
})

const finalRepaymentDate = computed(() => {
  const date = new Date()
  date.setFullYear(date.getFullYear() + 2) // Same as expected for now
  return date.toLocaleDateString()
})

const formattedTotalInvested = computed(() => {
  return (Number(totalInvested.value) / 1e6).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
})

// Stage helper functions
const getStageName = (stageId: number): string => {
  const stage = stages.value.find(s => s.id === stageId)
  return stage?.name || 'Unknown'
}

const getStageStatusColor = (stageId: number): string => {
  const stage = stages.value.find(s => s.id === stageId)
  return stage ? 'bg-gray-400' : 'bg-gray-400'
}

const getStageStatusTextColor = (stageId: number): string => {
  return 'text-gray-600'
}

const getStageNodeClass = (stageId: number): string => {
  const stage = stages.value.find(s => s.id === stageId)
  if (!stage) return 'bg-gray-100 text-gray-400'

  if (currentStage.value > stageId) {
    return 'bg-green-100 text-green-600'
  } else if (currentStage.value === stageId) {
    return 'bg-blue-500 text-white ring-4 ring-blue-200'
  } else {
    return 'bg-gray-100 text-gray-400'
  }
}

const getStageTextColor = (stageId: number): string => {
  if (currentStage.value > stageId) {
    return 'text-green-600'
  } else if (currentStage.value === stageId) {
    return 'text-blue-600 font-bold'
  } else {
    return 'text-gray-500'
  }
}

const getStageStatus = (stageId: number): string => {
  if (currentStage.value > stageId) return 'Completed'
  if (currentStage.value === stageId) return 'Active'
  return 'Pending'
}

const getStageCompletionTime = (stageId: number): string => {
  // For demo purposes, return hardcoded completion times
  const completionTimes = {
    0: 'Never started',
    1: 'Funding complete',
    2: '30 days ago',
    3: '2 months ago',
    4: 'Recently'
  }
  return completionTimes[stageId as keyof typeof completionTimes] || ''
}

const getTransitionNotificationClass = (): string => {
  if (!transitionData.value) return ''

  const stage = stages.value.find(s => s.id === transitionData.value.newStage)
  return stage ? `bg-${stage.color}-50 border-${stage.color}-200` : 'bg-gray-50 border-gray-200'
}

const getTransitionIconClass = (): string => {
  if (!transitionData.value) return 'bg-blue-500'

  const stage = stages.value.find(s => s.id === transitionData.value.newStage)
  return stage ? `bg-${stage.color}-500` : 'bg-gray-500'
}

const getTransitionTitleClass = (): string => {
  if (!transitionData.value) return 'text-gray-900'

  const stage = stages.value.find(s => s.id === transitionData.value.newStage)
  return stage ? `text-${stage.color}-900` : 'text-gray-900'
}

const getTransitionTextClass = (): string => {
  if (!transitionData.value) return 'text-gray-600'

  const stage = stages.value.find(s => s.id === transitionData.value.newStage)
  return stage ? `text-${stage.color}-600` : 'text-gray-600'
}

const getTransitionMessage = (): string => {
  if (!transitionData.value) return ''
  return transitionData.value.description || 'Stage transition completed'
}

const getTransitionTimestamp = (): string => {
  if (!transitionData.value) return ''
  return new Date(transitionData.value.timestamp).toLocaleTimeString()
}

const getCriticalTransitionIconBg = (): string => {
  if (!transitionData.value) return 'bg-blue-500'

  const stage = stages.value.find(s => s.id === transitionData.value.newStage)
  return stage ? `bg-${stage.color}-500` : 'bg-blue-500'
}

const getStageImpacts = (): string[] => {
  if (!transitionData.value) return []

  const impacts = {
    1: ['Investors can now contribute funds', 'Funding progress tracking is active', 'Minimum investment is 1 USDT'],
    2: ['Funding target has been reached', 'Loan will be issued to borrower', 'Investment positions are locked'],
    3: ['Mortgage loan is now active', 'Interest accrual has begun', 'No more investments accepted'],
    4: ['All principal and interest has been repaid', 'Investors have received their returns', 'Mortgage contract is complete']
  }

  return impacts[transitionData.value.newStage as keyof typeof impacts] || []
}

const formatHistoryTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString()
}

const handleStageTransition = (oldStage: number, newStage: number, description?: string) => {
  if (oldStage === newStage) return

  const oldStageData = stages.value.find(s => s.id === oldStage)
  const newStageData = stages.value.find(s => s.id === newStage)

  if (!oldStageData || !newStageData) return

  transitionData.value = {
    oldStage,
    newStage,
    oldStageData,
    newStageData,
    timestamp: Date.now(),
    description: description || `Transitioned from ${oldStageData.name} to ${newStageData.name}`
  }

  // Add to history
  stageHistory.value.unshift({
    stage: newStage,
    timestamp: Date.now(),
    description: description || `Moved to ${newStageData.name} stage`
  })

  // Show transition notification
  showStageTransition.value = true

  // Show critical transition for important stages
  if (newStage === 2 || newStage === 4) {
    setTimeout(() => {
      showCriticalTransition.value = true
    }, 1000)
  }

  // Auto-hide transition notification after 5 seconds
  setTimeout(() => {
    showStageTransition.value = false
  }, 5000)

  lastKnownStage.value = newStage
}

// Watch for stage changes
watch(fundingStage, (newStage, oldStage) => {
  if (oldStage !== undefined && newStage !== oldStage && newStage !== lastKnownStage.value) {
    handleStageTransition(oldStage, newStage)
  }
})

// Icon components (simplified for now)
const StageIcon = () => '🔴'
const FundingIcon = () => '💰'
const FundedIcon = () => '✅'
const ActiveIcon = () => '🏦'
const RepaidIcon = () => '🎉'

// Expose methods for external use
defineExpose({
  handleStageTransition,
  showHistory: () => { showStageHistory.value = true },
  hideHistory: () => { showStageHistory.value = false }
})
</script>

<style scoped>
.stage-transition-manager {
  @apply space-y-6;
}

@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}
</style>
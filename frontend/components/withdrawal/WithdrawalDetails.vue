<template>
  <UModal
    v-model="isOpen"
    :ui="{
      width: 'sm:max-w-lg',
      padding: 'p-0'
    }"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg">
      <!-- Header -->
      <div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Withdrawal Details
          </h3>
          <UButton
            variant="ghost"
            icon="i-heroicons-x-mark"
            @click="handleClose"
          />
        </div>
      </div>

      <!-- Body -->
      <div v-if="withdrawal" class="px-6 py-6 space-y-6">
        <!-- Status Badge -->
        <div class="flex items-center justify-center">
          <UBadge
            :variant="getStatusVariant(withdrawal.status)"
            size="lg"
            :class="[
              'px-4 py-2',
              getStatusTextColor(withdrawal.status)
            ]"
          >
            <Icon
              :name="getStatusIcon(withdrawal.status)"
              class="w-4 h-4 mr-2"
            />
            {{ getStatusText(withdrawal.status) }}
          </UBadge>
        </div>

        <!-- Withdrawal Summary -->
        <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
          <h4 class="font-medium text-gray-900 dark:text-white">Withdrawal Summary</h4>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <div>
                <span class="text-sm text-gray-600 dark:text-gray-400">Type:</span>
                <span class="ml-2 font-medium text-gray-900 dark:text-white capitalize">
                  {{ withdrawal.type }}
                </span>
              </div>
              <div>
                <span class="text-sm text-gray-600 dark:text-gray-400">Amount:</span>
                <span class="ml-2 font-bold text-lg text-green-600 dark:text-green-400">
                  {{ formatAmount(withdrawal.amount) }} USDT
                </span>
              </div>
            </div>

            <div class="space-y-2">
              <div>
                <span class="text-sm text-gray-600 dark:text-gray-400">Date:</span>
                <div class="font-medium text-gray-900 dark:text-white">
                  {{ formatFullDate(withdrawal.timestamp) }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatTimeAgo(withdrawal.timestamp) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Transaction Information -->
        <div v-if="withdrawal.transactionHash" class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-3">
          <h4 class="font-medium text-blue-900 dark:text-blue-100">Transaction Information</h4>

          <!-- Transaction Hash -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-blue-700 dark:text-blue-300">Transaction Hash:</span>
              <div class="flex space-x-1">
                <UButton
                  variant="ghost"
                  size="xs"
                  icon="i-heroicons-clipboard-document"
                  @click="copyTransactionHash"
                />
                <UButton
                  as="a"
                  :href="getExplorerUrl(withdrawal.transactionHash)"
                  target="_blank"
                  variant="ghost"
                  size="xs"
                  icon="i-heroicons-arrow-top-right-on-square"
                />
              </div>
            </div>
            <div class="bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-800 rounded px-3 py-2">
              <span class="text-sm font-mono text-blue-900 dark:text-blue-100">
                {{ withdrawal.transactionHash }}
              </span>
            </div>
          </div>

          <!-- Block Information -->
          <div v-if="withdrawal.blockNumber" class="grid grid-cols-2 gap-4">
            <div>
              <span class="text-sm text-blue-700 dark:text-blue-300">Block Number:</span>
              <div class="font-medium text-blue-900 dark:text-blue-100">
                {{ withdrawal.blockNumber.toLocaleString() }}
              </div>
            </div>
            <div>
              <span class="text-sm text-blue-700 dark:text-blue-300">Confirmations:</span>
              <div class="font-medium text-blue-900 dark:text-blue-100">
                {{ withdrawal.confirmations || 12 }}
              </div>
            </div>
          </div>
        </div>

        <!-- Gas Information -->
        <div v-if="withdrawal.gasCost" class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 space-y-3">
          <h4 class="font-medium text-purple-900 dark:text-purple-100">Gas Information</h4>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="text-sm text-purple-700 dark:text-purple-300">Gas Used:</span>
              <div class="font-medium text-purple-900 dark:text-purple-100">
                {{ formatNumber(withdrawal.gasUsed || 0) }}
              </div>
            </div>
            <div>
              <span class="text-sm text-purple-700 dark:text-purple-300">Gas Price:</span>
              <div class="font-medium text-purple-900 dark:text-purple-100">
                {{ formatGwei(withdrawal.gasPrice || 0) }}
              </div>
            </div>
            <div>
              <span class="text-sm text-purple-700 dark:text-purple-300">Gas Cost (ETH):</span>
              <div class="font-medium text-purple-900 dark:text-purple-100">
                {{ withdrawal.gasCost.ethCost }} ETH
              </div>
            </div>
            <div>
              <span class="text-sm text-purple-700 dark:text-purple-300">Gas Cost (USD):</span>
              <div class="font-medium text-purple-900 dark:text-purple-100">
                ${{ withdrawal.gasCost.usdCost }}
              </div>
            </div>
          </div>
        </div>

        <!-- Contract Information -->
        <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
          <h4 class="font-medium text-gray-900 dark:text-white">Contract Information</h4>

          <div>
            <span class="text-sm text-gray-600 dark:text-gray-400">Contract Address:</span>
            <div class="flex items-center space-x-2 mt-1">
              <div class="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2">
                <span class="text-sm font-mono text-gray-900 dark:text-white">
                  {{ formatAddress(withdrawal.contractAddress) }}
                </span>
              </div>
              <UButton
                variant="ghost"
                size="xs"
                icon="i-heroicons-clipboard-document"
                @click="copyContractAddress"
              />
            </div>
          </div>

          <div>
            <span class="text-sm text-gray-600 dark:text-gray-400">Your Address:</span>
            <div class="flex items-center space-x-2 mt-1">
              <div class="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2">
                <span class="text-sm font-mono text-gray-900 dark:text-white">
                  {{ formatAddress(withdrawal.userAddress) }}
                </span>
              </div>
              <UButton
                variant="ghost"
                size="xs"
                icon="i-heroicons-clipboard-document"
                @click="copyUserAddress"
              />
            </div>
          </div>
        </div>

        <!-- Additional Events -->
        <div v-if="withdrawal.events && withdrawal.events.length > 0" class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 space-y-3">
          <h4 class="font-medium text-green-900 dark:text-green-100">Related Events</h4>

          <div class="space-y-2">
            <div
              v-for="(event, index) in withdrawal.events"
              :key="index"
              class="bg-white dark:bg-gray-700 border border-green-200 dark:border-green-800 rounded p-3"
            >
              <div class="flex justify-between items-start">
                <div>
                  <span class="text-sm font-medium text-green-900 dark:text-green-100">
                    {{ event.name }}
                  </span>
                  <div v-if="event.args" class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {{ formatEventArgs(event.args) }}
                  </div>
                </div>
                <span class="text-xs text-green-700 dark:text-green-300">
                  {{ formatTimestamp(event.timestamp) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <div class="flex space-x-3">
          <UButton
            variant="outline"
            @click="exportDetails"
            icon="i-heroicons-arrow-down-tray"
            class="flex-1"
          >
            Export Details
          </UButton>

          <UButton
            @click="handleClose"
            class="flex-1"
          >
            Close
          </UButton>
        </div>
      </div>
    </div>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useClipboard } from '#imports'
import { formatUSDT } from '~/utils/contract/constants'

// Props
interface WithdrawalDetail {
  id: string
  type: 'principal' | 'interest' | 'both' | 'custom'
  amount: bigint
  timestamp: number
  transactionHash?: string
  blockNumber?: number
  confirmations?: number
  status: 'pending' | 'confirmed' | 'failed'
  gasCost?: {
    ethCost: string
    usdCost: string
  }
  gasUsed?: number
  gasPrice?: number
  contractAddress?: string
  userAddress?: string
  events?: Array<{
    name: string
    args?: Record<string, any>
    timestamp: number
  }>
}

interface Props {
  isOpen: boolean
  withdrawal?: WithdrawalDetail | null
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
}>()

// Composables
const { copy: copyToClipboard } = useClipboard()

// Computed
const isOpen = computed({
  get: () => props.isOpen,
  set: (value) => {
    if (!value) {
      emit('close')
    }
  }
})

// Methods
const formatAmount = (amount: bigint): string => {
  return formatUSDT(amount)
}

const formatFullDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString()
}

const formatTimeAgo = (timestamp: number): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}

const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString()
}

const formatAddress = (address?: string): string => {
  if (!address) return '0x000...000'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const formatNumber = (num: number): string => {
  return num.toLocaleString()
}

const formatGwei = (wei: number): string => {
  return (wei / 1e9).toFixed(2) + ' Gwei'
}

const formatEventArgs = (args: Record<string, any>): string => {
  return Object.entries(args)
    .map(([key, value]) => `${key}: ${formatValue(value)}`)
    .join(', ')
}

const formatValue = (value: any): string => {
  if (typeof value === 'bigint') return formatUSDT(value)
  if (typeof value === 'object' && value !== null) return JSON.stringify(value)
  return String(value)
}

const getStatusVariant = (status: string): 'solid' | 'soft' | 'subtle' => {
  switch (status) {
    case 'confirmed':
      return 'solid'
    case 'pending':
      return 'soft'
    case 'failed':
      return 'subtle'
    default:
      return 'soft'
  }
}

const getStatusTextColor = (status: string): string => {
  switch (status) {
    case 'confirmed':
      return 'bg-green-500 text-white'
    case 'pending':
      return 'bg-yellow-500 text-white'
    case 'failed':
      return 'bg-red-500 text-white'
    default:
      return 'bg-gray-500 text-white'
  }
}

const getStatusIcon = (status: string): string => {
  switch (status) {
    case 'confirmed':
      return 'i-heroicons-check-circle'
    case 'pending':
      return 'i-heroicons-clock'
    case 'failed':
      return 'i-heroicons-x-circle'
    default:
      return 'i-heroicons-question-mark-circle'
  }
}

const getStatusText = (status: string): string => {
  switch (status) {
    case 'confirmed':
      return 'Confirmed'
    case 'pending':
      return 'Pending'
    case 'failed':
      return 'Failed'
    default:
      return 'Unknown'
  }
}

const getExplorerUrl = (hash: string): string => {
  // This should be configurable based on the network
  return `https://etherscan.io/tx/${hash}`
}

const copyTransactionHash = async () => {
  try {
    if (props.withdrawal?.transactionHash) {
      await copyToClipboard(props.withdrawal.transactionHash)
      // Show success notification
    }
  } catch (error) {
    console.error('Failed to copy transaction hash:', error)
  }
}

const copyContractAddress = async () => {
  try {
    if (props.withdrawal?.contractAddress) {
      await copyToClipboard(props.withdrawal.contractAddress)
      // Show success notification
    }
  } catch (error) {
    console.error('Failed to copy contract address:', error)
  }
}

const copyUserAddress = async () => {
  try {
    if (props.withdrawal?.userAddress) {
      await copyToClipboard(props.withdrawal.userAddress)
      // Show success notification
    }
  } catch (error) {
    console.error('Failed to copy user address:', error)
  }
}

const exportDetails = () => {
  if (!props.withdrawal) return

  const exportData = {
    withdrawalId: props.withdrawal.id,
    type: props.withdrawal.type,
    amount: formatAmount(props.withdrawal.amount),
    timestamp: formatFullDate(props.withdrawal.timestamp),
    transactionHash: props.withdrawal.transactionHash,
    blockNumber: props.withdrawal.blockNumber,
    confirmations: props.withdrawal.confirmations,
    status: props.withdrawal.status,
    gasCost: props.withdrawal.gasCost,
    contractAddress: props.withdrawal.contractAddress,
    userAddress: props.withdrawal.userAddress,
    events: props.withdrawal.events
  }

  const dataStr = JSON.stringify(exportData, null, 2)
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)

  const exportFileDefaultName = `withdrawal-${props.withdrawal.id}-${new Date().toISOString()}.json`

  const linkElement = document.createElement('a')
  linkElement.setAttribute('href', dataUri)
  linkElement.setAttribute('download', exportFileDefaultName)
  linkElement.click()
}

const handleClose = () => {
  emit('close')
}
</script>
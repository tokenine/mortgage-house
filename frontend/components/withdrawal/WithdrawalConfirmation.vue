<template>
  <UModal
    v-model="isOpen"
    :ui="{
      width: 'sm:max-w-md',
      padding: 'p-0'
    }"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg">
      <!-- Header -->
      <div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Confirm Withdrawal
          </h3>
          <UButton
            variant="ghost"
            icon="i-heroicons-x-mark"
            @click="handleCancel"
          />
        </div>
      </div>

      <!-- Body -->
      <div class="px-6 py-4 space-y-4">
        <!-- Warning Message -->
        <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div class="flex">
            <Icon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-yellow-400 mt-0.5 mr-3" />
            <div>
              <h4 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">Important</h4>
              <p class="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                This withdrawal will transfer funds to your wallet address. Please verify all details before proceeding.
              </p>
            </div>
          </div>
        </div>

        <!-- Withdrawal Details -->
        <div class="space-y-3">
          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
            <h4 class="font-medium text-gray-900 dark:text-white">Withdrawal Details</h4>

            <div v-if="withdrawalDetails?.principalAmount > 0n" class="flex justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Principal:</span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {{ formatAmount(withdrawalDetails.principalAmount) }} USDT
              </span>
            </div>

            <div v-if="withdrawalDetails?.interestAmount > 0n" class="flex justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Interest:</span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {{ formatAmount(withdrawalDetails.interestAmount) }} USDT
              </span>
            </div>

            <div class="border-t border-gray-200 dark:border-gray-600 pt-2 flex justify-between">
              <span class="font-medium text-gray-900 dark:text-white">Total:</span>
              <span class="font-bold text-lg text-green-600 dark:text-green-400">
                {{ formatAmount(totalAmount) }} USDT
              </span>
            </div>
          </div>

          <!-- Transaction Information -->
          <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-3">
            <h4 class="font-medium text-blue-900 dark:text-blue-100">Transaction Information</h4>

            <div v-if="gasEstimate" class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-blue-700 dark:text-blue-300">Gas Cost:</span>
                <span class="font-medium text-blue-900 dark:text-blue-100">
                  {{ gasEstimate.ethCost }} ETH
                </span>
              </div>

              <div class="flex justify-between text-sm">
                <span class="text-blue-700 dark:text-blue-300">USD Cost:</span>
                <span class="font-medium text-blue-900 dark:text-blue-100">
                  ${{ gasEstimate.usdCost }}
                </span>
              </div>

              <div class="flex justify-between text-sm">
                <span class="text-blue-700 dark:text-blue-300">Gas Limit:</span>
                <span class="font-medium text-blue-900 dark:text-blue-100">
                  {{ formatNumber(gasEstimate.gasLimit) }}
                </span>
              </div>

              <div class="flex justify-between text-sm">
                <span class="text-blue-700 dark:text-blue-300">Network Status:</span>
                <span class="font-medium capitalize" :class="getNetworkStatusColor()">
                  {{ gasEstimate.networkStatus }}
                </span>
              </div>

              <div v-if="!gasEstimate.isWithinThreshold" class="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded p-2 text-xs text-yellow-800 dark:text-yellow-200">
                ⚠️ Gas costs are higher than normal. You may want to wait for lower network congestion.
              </div>
            </div>
          </div>

          <!-- Recipient Address -->
          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h4 class="font-medium text-gray-900 dark:text-white mb-2">Recipient Address</h4>
            <div class="flex items-center space-x-2">
              <div class="flex-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2">
                <span class="text-sm font-mono text-gray-900 dark:text-white">
                  {{ formatAddress(userAddress) }}
                </span>
              </div>
              <UButton
                variant="ghost"
                size="xs"
                icon="i-heroicons-clipboard-document"
                @click="copyAddress"
              />
            </div>
          </div>

          <!-- Contract Information -->
          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h4 class="font-medium text-gray-900 dark:text-white mb-2">Contract Address</h4>
            <div class="flex items-center space-x-2">
              <div class="flex-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2">
                <span class="text-sm font-mono text-gray-900 dark:text-white">
                  {{ formatAddress(contractAddress) }}
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
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex space-x-3">
        <UButton
          variant="outline"
          @click="handleCancel"
          class="flex-1"
        >
          Cancel
        </UButton>

        <UButton
          @click="handleConfirm"
          :loading="isConfirming"
          class="flex-1"
        >
          Confirm Withdrawal
        </UButton>
      </div>
    </div>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAccount, useClipboard } from '#imports'
import { formatUSDT } from '~/utils/contract/constants'

// Props
interface Props {
  isOpen: boolean
  withdrawalDetails?: {
    type: 'principal' | 'interest' | 'both' | 'custom'
    principalAmount?: bigint
    interestAmount?: bigint
    timestamp?: number
  } | null
  gasEstimate?: {
    gasLimit: bigint
    gasPrice: bigint
    ethCost: string
    usdCost: string
    isWithinThreshold: boolean
    networkStatus: 'normal' | 'congested' | 'high'
  } | null
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

// Composables
const { address: userAddress } = useAccount()
const { copy: copyToClipboard } = useClipboard()

// State
const isConfirming = ref(false)

// Computed
const isOpen = computed({
  get: () => props.isOpen,
  set: (value) => {
    if (!value) {
      emit('cancel')
    }
  }
})

const totalAmount = computed(() => {
  if (!props.withdrawalDetails) return 0n
  return (props.withdrawalDetails.principalAmount || 0n) + (props.withdrawalDetails.interestAmount || 0n)
})

const contractAddress = ref('0x123...abc') // This should come from parent

// Methods
const formatAmount = (amount: bigint): string => {
  return formatUSDT(amount)
}

const formatNumber = (num: bigint): string => {
  return Number(num).toLocaleString()
}

const formatAddress = (address: string): string => {
  if (!address) return '0x000...000'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const getNetworkStatusColor = (): string => {
  if (!props.gasEstimate) return 'text-gray-500'

  switch (props.gasEstimate.networkStatus) {
    case 'normal':
      return 'text-green-600 dark:text-green-400'
    case 'congested':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'high':
      return 'text-red-600 dark:text-red-400'
    default:
      return 'text-gray-500'
  }
}

const copyAddress = async () => {
  try {
    if (userAddress.value) {
      await copyToClipboard(userAddress.value)
      // Show success notification
    }
  } catch (error) {
    console.error('Failed to copy address:', error)
  }
}

const copyContractAddress = async () => {
  try {
    if (contractAddress.value) {
      await copyToClipboard(contractAddress.value)
      // Show success notification
    }
  } catch (error) {
    console.error('Failed to copy contract address:', error)
  }
}

const handleConfirm = async () => {
  isConfirming.value = true

  try {
    emit('confirm')
  } catch (error) {
    console.error('Confirmation failed:', error)
  } finally {
    isConfirming.value = false
  }
}

const handleCancel = () => {
  emit('cancel')
}
</script>
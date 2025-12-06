<template>
  <div class="notification-manager">
    <!-- Notification Container -->
    <Teleport to="body">
      <div class="fixed top-4 right-4 z-50 space-y-4 max-w-md">
        <!-- Notifications -->
        <div
          v-for="notification in activeNotifications"
          :key="notification.id"
          class="notification animate-slide-in"
          :class="getNotificationClasses(notification.type)"
        >
          <div class="flex items-start">
            <!-- Icon -->
            <div class="flex-shrink-0">
              <div
                class="w-6 h-6 rounded-full flex items-center justify-center"
                :class="getNotificationIconClasses(notification.type)"
              >
                <component :is="getNotificationIcon(notification.type)" class="w-3 h-3 text-white" />
              </div>
            </div>

            <!-- Content -->
            <div class="ml-3 flex-1">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-medium" :class="getNotificationTitleClasses(notification.type)">
                  {{ notification.title }}
                </h3>
                <button
                  @click="dismissNotification(notification.id)"
                  class="ml-4 text-current hover:opacity-70"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <p class="text-sm mt-1" :class="getNotificationTextClasses(notification.type)">
                {{ notification.message }}
              </p>

              <!-- Additional Details -->
              <div v-if="notification.details" class="mt-2">
                <div class="text-xs" :class="getNotificationTextClasses(notification.type)">
                  <div v-if="notification.details.amount" class="mb-1">
                    Amount: {{ formatAmount(notification.details.amount) }} {{ notification.details.token || 'USDT' }}
                  </div>
                  <div v-if="notification.details.address" class="mb-1">
                    From: {{ maskAddress(notification.details.address) }}
                  </div>
                  <div v-if="notification.details.txHash" class="mb-1">
                    Tx: <a
                      :href="getBlockExplorerUrl(notification.details.txHash)"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="hover:underline"
                    >
                      {{ shortTxHash(notification.details.txHash) }}
                    </a>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div v-if="notification.actions" class="mt-3 flex space-x-2">
                <button
                  v-for="action in notification.actions"
                  :key="action.id"
                  @click="action.handler"
                  class="text-xs px-2 py-1 rounded border transition-colors"
                  :class="getActionButtonClasses(notification.type)"
                >
                  {{ action.label }}
                </button>
              </div>

              <!-- Timestamp -->
              <div class="mt-2 text-xs opacity-75">
                {{ formatTimestamp(notification.timestamp) }}
              </div>
            </div>
          </div>

          <!-- Progress Bar (if applicable) -->
          <div v-if="notification.progress" class="mt-3">
            <div class="w-full bg-gray-200 rounded-full h-1">
              <div
                class="bg-current h-1 rounded-full transition-all duration-300"
                :style="{ width: `${notification.progress}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Notification Counter (for when multiple are active) -->
        <div
          v-if="showCounter && activeNotifications.length > 1"
          class="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm text-center"
        >
          {{ activeNotifications.length }} notifications
          <button
            @click="showNotificationPanel = true"
            class="ml-2 text-blue-300 hover:text-blue-200"
          >
            View all
          </button>
        </div>
      </div>

      <!-- Notification History Panel -->
      <div
        v-if="showNotificationPanel"
        class="fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 overflow-hidden animate-slide-in-right"
      >
        <div class="flex flex-col h-full">
          <!-- Header -->
          <div class="bg-gray-800 text-white p-4">
            <div class="flex justify-between items-center">
              <h3 class="font-semibold">Notifications</h3>
              <button
                @click="showNotificationPanel = false"
                class="text-gray-300 hover:text-white"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Notification List -->
          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            <div
              v-for="notification in notificationHistory"
              :key="notification.id"
              class="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              :class="getNotificationPanelClasses(notification.type)"
            >
              <div class="flex items-start">
                <div
                  class="w-4 h-4 rounded-full flex items-center justify-center mt-0.5 mr-2"
                  :class="getNotificationIconClasses(notification.type)"
                >
                  <component :is="getNotificationIcon(notification.type)" class="w-2 h-2 text-white" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-start">
                    <h4 class="text-sm font-medium truncate">{{ notification.title }}</h4>
                    <span class="text-xs text-gray-500">{{ formatTimestamp(notification.timestamp) }}</span>
                  </div>
                  <p class="text-xs text-gray-600 mt-1">{{ notification.message }}</p>
                </div>
              </div>
            </div>

            <div v-if="notificationHistory.length === 0" class="text-center py-8 text-gray-500">
              <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              <p>No notifications yet</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="border-t p-4">
            <button
              @click="clearAllNotifications"
              class="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Clear All Notifications
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Notification Settings Button -->
    <button
      v-if="showSettingsButton"
      @click="showNotificationPanel = true"
      class="fixed bottom-4 right-4 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition-colors"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
      </svg>
      <span v-if="unreadCount > 0" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { formatUSDT } from '~/utils/contract/constants'

// Types
export interface NotificationAction {
  id: string
  label: string
  handler: () => void
}

export interface NotificationDetails {
  amount?: bigint
  token?: string
  address?: string
  txHash?: string
  [key: string]: any
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: number
  autoDismiss?: boolean
  duration?: number
  details?: NotificationDetails
  actions?: NotificationAction[]
  progress?: number
  read?: boolean
}

// Props
interface Props {
  maxNotifications?: number
  showSettingsButton?: boolean
  showCounter?: boolean
  enableSound?: boolean
  enableDesktop?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  maxNotifications: 5,
  showSettingsButton: true,
  showCounter: true,
  enableSound: false,
  enableDesktop: false
})

// Local state
const notifications = ref<Notification[]>([])
const showNotificationPanel = ref(false)
const notificationIdCounter = ref(0)

// Computed properties
const activeNotifications = computed(() => {
  return notifications.value
    .filter(n => !n.read)
    .slice(0, props.maxNotifications)
})

const notificationHistory = computed(() => {
  return notifications.value.slice().reverse()
})

const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.read).length
})

// Methods
const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): string => {
  const id = `notif-${notificationIdCounter.value++}`
  const fullNotification: Notification = {
    ...notification,
    id,
    timestamp: Date.now(),
    read: false
  }

  notifications.value.unshift(fullNotification)

  // Auto dismiss if enabled
  if (notification.autoDismiss !== false) {
    const duration = notification.duration || (notification.type === 'success' ? 5000 : 7000)
    setTimeout(() => {
      dismissNotification(id)
    }, duration)
  }

  // Play sound if enabled
  if (props.enableSound) {
    playNotificationSound(notification.type)
  }

  // Show desktop notification if enabled and permission granted
  if (props.enableDesktop && 'Notification' in window && Notification.permission === 'granted') {
    showDesktopNotification(fullNotification)
  }

  return id
}

const dismissNotification = (id: string) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index !== -1) {
    notifications.value[index].read = true
  }
}

const markAsRead = (id: string) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index !== -1) {
    notifications.value[index].read = true
  }
}

const markAllAsRead = () => {
  notifications.value.forEach(n => n.read = true)
}

const clearAllNotifications = () => {
  notifications.value = []
  showNotificationPanel.value = false
}

// Specialized notification methods
const showSuccessNotification = (title: string, message: string, options?: Partial<Omit<Notification, 'type' | 'id' | 'timestamp' | 'read'>>) => {
  return addNotification({
    type: 'success',
    title,
    message,
    ...options
  })
}

const showErrorNotification = (title: string, message: string, options?: Partial<Omit<Notification, 'type' | 'id' | 'timestamp' | 'read'>>) => {
  return addNotification({
    type: 'error',
    title,
    message,
    autoDismiss: false,
    ...options
  })
}

const showWarningNotification = (title: string, message: string, options?: Partial<Omit<Notification, 'type' | 'id' | 'timestamp' | 'read'>>) => {
  return addNotification({
    type: 'warning',
    title,
    message,
    ...options
  })
}

const showInfoNotification = (title: string, message: string, options?: Partial<Omit<Notification, 'type' | 'id' | 'timestamp' | 'read'>>) => {
  return addNotification({
    type: 'info',
    title,
    message,
    ...options
  })
}

// Predefined notification templates
const showFundingCompleteNotification = (totalFunded: bigint, investorCount: number) => {
  return addNotification({
    type: 'success',
    title: 'Funding Complete! 🎉',
    message: `The mortgage has been fully funded with ${formatUSDT(totalFunded)} from ${investorCount} investors.`,
    details: {
      amount: totalFunded,
      token: 'USDT'
    },
    autoDismiss: false,
    actions: [
      {
        id: 'view-details',
        label: 'View Details',
        handler: () => {
          console.log('View funding details')
        }
      }
    ]
  })
}

const showStageChangeNotification = (oldStage: number, newStage: number, description: string) => {
  const stageNames = ['Not Started', 'Funding', 'Funded', 'Active', 'Repaid']
  return addNotification({
    type: 'info',
    title: 'Stage Changed',
    message: `Mortgage has moved from ${stageNames[oldStage]} to ${stageNames[newStage]}`,
    details: { description },
    actions: [
      {
        id: 'learn-more',
        label: 'Learn More',
        handler: () => {
          console.log('Learn more about stage change')
        }
      }
    ]
  })
}

const showInvestmentNotification = (investor: string, amount: bigint, shares: bigint, txHash: string) => {
  return addNotification({
    type: 'success',
    title: 'New Investment',
    message: `An investment of ${formatUSDT(amount)} has been received.`,
    details: {
      amount,
      token: 'USDT',
      address: investor,
      txHash
    }
  })
}

const showWithdrawalNotification = (investor: string, amount: bigint, txHash: string) => {
  return addNotification({
    type: 'info',
    title: 'Withdrawal Processed',
    message: `A withdrawal of ${formatUSDT(amount)} has been processed.`,
    details: {
      amount,
      token: 'USDT',
      address: investor,
      txHash
    }
  })
}

// Helper functions
const getNotificationClasses = (type: string): string => {
  const baseClasses = 'p-4 rounded-lg shadow-lg border-2'
  const typeClasses = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }
  return `${baseClasses} ${typeClasses[type as keyof typeof typeClasses] || typeClasses.info}`
}

const getNotificationIconClasses = (type: string): string => {
  const iconClasses = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  }
  return iconClasses[type as keyof typeof iconClasses] || iconClasses.info
}

const getNotificationIcon = (type: string) => {
  const icons = {
    success: 'SuccessIcon',
    error: 'ErrorIcon',
    warning: 'WarningIcon',
    info: 'InfoIcon'
  }
  return icons[type as keyof typeof icons] || icons.info
}

const getNotificationTitleClasses = (type: string): string => {
  const titleClasses = {
    success: 'text-green-900',
    error: 'text-red-900',
    warning: 'text-yellow-900',
    info: 'text-blue-900'
  }
  return titleClasses[type as keyof typeof titleClasses] || titleClasses.info
}

const getNotificationTextClasses = (type: string): string => {
  const textClasses = {
    success: 'text-green-700',
    error: 'text-red-700',
    warning: 'text-yellow-700',
    info: 'text-blue-700'
  }
  return textClasses[type as keyof typeof textClasses] || textClasses.info
}

const getActionButtonClasses = (type: string): string => {
  const actionClasses = {
    success: 'border-green-300 text-green-700 hover:bg-green-100',
    error: 'border-red-300 text-red-700 hover:bg-red-100',
    warning: 'border-yellow-300 text-yellow-700 hover:bg-yellow-100',
    info: 'border-blue-300 text-blue-700 hover:bg-blue-100'
  }
  return actionClasses[type as keyof typeof actionClasses] || actionClasses.info
}

const getNotificationPanelClasses = (type: string): string => {
  const panelClasses = {
    success: 'border-green-200',
    error: 'border-red-200',
    warning: 'border-yellow-200',
    info: 'border-blue-200'
  }
  return panelClasses[type as keyof typeof panelClasses] || panelClasses.info
}

const formatAmount = (amount: bigint): string => {
  return formatUSDT(amount)
}

const maskAddress = (address: string): string => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const shortTxHash = (txHash: string): string => {
  if (!txHash) return ''
  return `${txHash.slice(0, 8)}...${txHash.slice(-6)}`
}

const getBlockExplorerUrl = (txHash: string): string => {
  return `https://etherscan.io/tx/${txHash}`
}

const formatTimestamp = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

const playNotificationSound = (type: string) => {
  if (typeof Audio !== 'undefined') {
    try {
      // Create a simple notification sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Different tones for different notification types
      const frequencies = {
        success: 800,
        error: 400,
        warning: 600,
        info: 700
      }

      oscillator.frequency.value = frequencies[type as keyof typeof frequencies] || 700
      oscillator.type = 'sine'
      gainNode.gain.value = 0.1

      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (error) {
      console.warn('Could not play notification sound:', error)
    }
  }
}

const showDesktopNotification = (notification: Notification) => {
  try {
    new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      tag: notification.id
    })
  } catch (error) {
    console.warn('Could not show desktop notification:', error)
  }
}

// Request desktop notification permission
const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false

  if (Notification.permission === 'granted') return true
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

// Icon components
const SuccessIcon = () => '✓'
const ErrorIcon = () => '✕'
const WarningIcon = () => '!'
const InfoIcon = () => 'i'

// Lifecycle
onMounted(() => {
  // Request desktop notification permission if enabled
  if (props.enableDesktop) {
    requestNotificationPermission()
  }
})

// Expose methods for external use
defineExpose({
  addNotification,
  dismissNotification,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
  showSuccessNotification,
  showErrorNotification,
  showWarningNotification,
  showInfoNotification,
  showFundingCompleteNotification,
  showStageChangeNotification,
  showInvestmentNotification,
  showWithdrawalNotification
})
</script>

<style scoped>
.notification-manager {
  @apply space-y-4;
}

.notification {
  transform: translateX(100%);
  opacity: 0;
  animation: slideIn 0.3s ease-out forwards;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in-right {
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
</style>
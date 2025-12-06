<template>
  <div class="connection-status" :class="statusClasses">
    <!-- Status Indicator -->
    <div class="status-indicator">
      <div class="status-icon" :class="iconClass">
        <Icon v-if="connectionStatus === 'connected'" name="i-heroicons-check-circle" />
        <Icon v-else-if="connectionStatus === 'disconnected'" name="i-heroicons-x-circle" />
        <Icon v-else-if="connectionStatus === 'reconnecting'" name="i-heroicons-arrow-path" class="animate-spin" />
        <Icon v-else name="i-heroicons-exclamation-triangle" />
      </div>

      <div class="status-text">
        <span class="status-label">{{ statusText }}</span>
        <span v-if="showLastSync" class="last-sync">
          {{ formatLastSync }}
        </span>
      </div>
    </div>

    <!-- Reconnection Progress -->
    <div v-if="connectionStatus === 'reconnecting'" class="reconnect-status">
      <UProgress
        :value="reconnectProgress"
        :max="100"
        class="reconnect-progress"
        size="xs"
      />
      <span class="reconnect-text">
        Reconnecting... ({{ reconnectAttempts }}/{{ maxReconnectAttempts }})
      </span>
    </div>

    <!-- Error Message -->
    <div v-if="connectionStatus === 'error'" class="error-status">
      <UAlert
        color="red"
        variant="soft"
        :title="errorMessage"
        :description="errorDescription"
        class="error-alert"
      />
      <UButton
        size="xs"
        variant="outline"
        @click="manualReconnect"
      >
        Retry Connection
      </UButton>
    </div>

    <!-- Connection Quality Indicator -->
    <div v-if="showQuality && connectionQuality" class="quality-indicator">
      <div class="quality-bar" :class="qualityClass">
        <div class="quality-fill" :style="{ width: qualityPercentage }"></div>
      </div>
      <span class="quality-text">{{ qualityText }}</span>
    </div>

    <!-- Detailed Status (on hover/click) -->
    <UPopover v-if="showDetails" :popper="{ placement: 'bottom-end' }">
      <UButton variant="ghost" size="xs" class="details-button">
        <Icon name="i-heroicons-information-circle" />
      </UButton>

      <template #panel>
        <div class="connection-details">
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value" :class="statusClasses">{{ statusText }}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">Connected:</span>
            <span class="detail-value">{{ connectionStatus === 'connected' ? 'Yes' : 'No' }}</span>
          </div>

          <div v-if="lastSyncTime" class="detail-row">
            <span class="detail-label">Last Sync:</span>
            <span class="detail-value">{{ formatDetailedTime(lastSyncTime) }}</span>
          </div>

          <div v-if="reconnectAttempts > 0" class="detail-row">
            <span class="detail-label">Reconnect Attempts:</span>
            <span class="detail-value">{{ reconnectAttempts }}</span>
          </div>

          <div v-if="connectionQuality" class="detail-row">
            <span class="detail-label">Connection Quality:</span>
            <span class="detail-value" :class="qualityClass">{{ qualityText }}</span>
          </div>

          <div v-if="uptime > 0" class="detail-row">
            <span class="detail-label">Uptime:</span>
            <span class="detail-value">{{ formatUptime(uptime) }}</span>
          </div>

          <div v-if="eventsProcessed > 0" class="detail-row">
            <span class="detail-label">Events Processed:</span>
            <span class="detail-value">{{ eventsProcessed.toLocaleString() }}</span>
          </div>

          <div v-if="averageLatency > 0" class="detail-row">
            <span class="detail-label">Average Latency:</span>
            <span class="detail-value">{{ Math.round(averageLatency) }}ms</span>
          </div>

          <div class="detail-actions">
            <UButton size="xs" variant="outline" @click="manualReconnect">
              <Icon name="i-heroicons-arrow-path" class="mr-1" />
              Reconnect
            </UButton>

            <UButton size="xs" variant="ghost" @click="showDebugInfo = !showDebugInfo">
              <Icon name="i-heroicons-bug-ant" class="mr-1" />
              Debug
            </UButton>
          </div>

          <div v-if="showDebugInfo" class="debug-info">
            <h4 class="debug-title">Debug Information</h4>
            <pre class="debug-data">{{ JSON.stringify(debugInfo, null, 2) }}</pre>
          </div>
        </div>
      </template>
    </UPopover>

    <!-- Mobile Indicator (compact) -->
    <div v-if="isMobile" class="mobile-indicator">
      <div class="mobile-dot" :class="mobileDotClass"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRealtimeSync } from '~/composables/useRealtimeSync'

// Props
interface Props {
  showLastSync?: boolean
  showQuality?: boolean
  showDetails?: boolean
  compact?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

const props = withDefaults(defineProps<Props>(), {
  showLastSync: true,
  showQuality: false,
  showDetails: false,
  compact: false,
  position: 'top-right'
})

// Composables
const {
  connectionStatus,
  lastSyncTime,
  isConnected,
  syncMetrics,
  connectionQuality,
  establishConnection
} = useRealtimeSync()

// State
const showDebugInfo = ref(false)
const isMobile = ref(false)
const maxReconnectAttempts = ref(10)

// Check mobile screen size
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

// Computed properties
const statusClasses = computed(() => ({
  'connected': connectionStatus.value === 'connected',
  'disconnected': connectionStatus.value === 'disconnected',
  'reconnecting': connectionStatus.value === 'reconnecting',
  'error': connectionStatus.value === 'error',
  'compact': props.compact
}))

const iconClass = computed(() => ({
  'text-green-500': connectionStatus.value === 'connected',
  'text-red-500': connectionStatus.value === 'disconnected',
  'text-yellow-500': connectionStatus.value === 'reconnecting',
  'text-orange-500': connectionStatus.value === 'error'
}))

const statusText = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': return 'Live'
    case 'disconnected': return 'Offline'
    case 'reconnecting': return 'Reconnecting'
    case 'error': return 'Connection Error'
    default: return 'Unknown'
  }
})

const formatLastSync = computed(() => {
  if (!lastSyncTime.value) return 'Never'

  const now = Date.now()
  const diff = now - lastSyncTime.value

  if (diff < 5000) return 'Just now'
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return new Date(lastSyncTime.value).toLocaleDateString()
})

const formatDetailedTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString()
}

const formatUptime = (ms: number) => {
  if (ms < 60000) return `${Math.floor(ms / 1000)}s`
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m`
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h`
  return `${Math.floor(ms / 86400000)}d`
}

const errorMessage = computed(() => {
  if (connectionStatus.value !== 'error') return ''
  return 'Connection lost'
})

const errorDescription = computed(() => {
  if (connectionStatus.value !== 'error') return ''
  return 'Unable to connect to real-time updates. Some features may not be available.'
})

const reconnectProgress = computed(() => {
  // Simulate progress based on reconnection attempts
  if (connectionStatus.value !== 'reconnecting') return 0
  return Math.min((syncMetrics.value.eventsProcessed / 10) * 100, 90) // Max 90% until connected
})

const reconnectAttempts = computed(() => {
  return syncMetrics.value.eventsProcessed % 10 // Mock calculation
})

const qualityClass = computed(() => {
  if (!connectionQuality.value) return ''
  return `quality-${connectionQuality.value.quality}`
})

const qualityPercentage = computed(() => {
  if (!connectionQuality.value) return '0%'
  const qualityMap = {
    excellent: '100%',
    good: '75%',
    fair: '50%',
    poor: '25%'
  }
  return qualityMap[connectionQuality.value.quality as keyof typeof qualityMap] || '0%'
})

const qualityText = computed(() => {
  if (!connectionQuality.value) return 'Unknown'
  return connectionQuality.value.quality.charAt(0).toUpperCase() + connectionQuality.value.quality.slice(1)
})

const uptime = computed(() => {
  return connectionQuality.value?.uptime || 0
})

const eventsProcessed = computed(() => {
  return syncMetrics.value.eventsProcessed
})

const averageLatency = computed(() => {
  return syncMetrics.value.averageLatency
})

const debugInfo = computed(() => ({
  connectionStatus: connectionStatus.value,
  lastSyncTime: lastSyncTime.value,
  syncMetrics: syncMetrics.value,
  connectionQuality: connectionQuality.value,
  isMobile: isMobile.value,
  userAgent: navigator.userAgent,
  timestamp: Date.now()
}))

const mobileDotClass = computed(() => ({
  'bg-green-500': connectionStatus.value === 'connected',
  'bg-red-500': connectionStatus.value === 'disconnected' || connectionStatus.value === 'error',
  'bg-yellow-500': connectionStatus.value === 'reconnecting'
}))

// Methods
const manualReconnect = async () => {
  try {
    await establishConnection()
  } catch (error) {
    console.error('Manual reconnection failed:', error)
  }
}

// Lifecycle
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.connection-status {
  @apply flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all duration-200;
}

.connection-status.compact {
  @apply p-1 gap-1;
}

.connection-status.connected {
  @apply border-green-200 dark:border-green-800;
}

.connection-status.disconnected {
  @apply border-red-200 dark:border-red-800;
}

.connection-status.reconnecting {
  @apply border-yellow-200 dark:border-yellow-800;
}

.connection-status.error {
  @apply border-orange-200 dark:border-orange-800;
}

.status-indicator {
  @apply flex items-center gap-2;
}

.status-icon {
  @apply w-4 h-4 flex-shrink-0;
}

.status-text {
  @apply flex flex-col text-xs;
}

.status-label {
  @apply font-medium text-gray-900 dark:text-white;
}

.last-sync {
  @apply text-gray-500 dark:text-gray-400;
}

.reconnect-status {
  @apply flex flex-col gap-1 min-w-0;
}

.reconnect-progress {
  @apply w-full;
}

.reconnect-text {
  @apply text-xs text-gray-600 dark:text-gray-400 truncate;
}

.error-status {
  @apply flex flex-col gap-2 min-w-0;
}

.error-alert {
  @apply text-xs;
}

.quality-indicator {
  @apply flex items-center gap-2;
}

.quality-bar {
  @apply w-2 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden;
}

.quality-fill {
  @apply h-full transition-all duration-300;
}

.quality-excellent .quality-fill {
  @apply bg-green-500;
}

.quality-good .quality-fill {
  @apply bg-blue-500;
}

.quality-fair .quality-fill {
  @apply bg-yellow-500;
}

.quality-poor .quality-fill {
  @apply bg-red-500;
}

.quality-text {
  @apply text-xs font-medium capitalize;
}

.details-button {
  @apply ml-1;
}

.connection-details {
  @apply p-4 min-w-80 space-y-3;
}

.detail-row {
  @apply flex justify-between items-center text-sm;
}

.detail-label {
  @apply font-medium text-gray-600 dark:text-gray-400;
}

.detail-value {
  @apply text-gray-900 dark:text-white font-mono;
}

.detail-actions {
  @apply flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700;
}

.debug-info {
  @apply mt-3 pt-3 border-t border-gray-200 dark:border-gray-700;
}

.debug-title {
  @apply text-sm font-medium text-gray-900 dark:text-white mb-2;
}

.debug-data {
  @apply text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto text-gray-700 dark:text-gray-300;
}

.mobile-indicator {
  @apply relative;
}

.mobile-dot {
  @apply w-2 h-2 rounded-full;
}

/* Positioning classes */
.connection-status[data-position="top-left"] {
  @apply fixed top-4 left-4 z-50;
}

.connection-status[data-position="top-right"] {
  @apply fixed top-4 right-4 z-50;
}

.connection-status[data-position="bottom-left"] {
  @apply fixed bottom-4 left-4 z-50;
}

.connection-status[data-position="bottom-right"] {
  @apply fixed bottom-4 right-4 z-50;
}

/* Animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.reconnecting .status-icon {
  animation: pulse 2s infinite;
}
</style>
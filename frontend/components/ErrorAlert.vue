<template>
  <div
    v-if="error"
    class="error-alert"
    :class="[
      `error-${error.scope.toLowerCase()}`,
      `error-${error.severity}`,
      { 'error-dismissible': dismissible }
    ]"
    role="alert"
    aria-live="polite"
  >
    <div class="error-container">
      <!-- Error Icon -->
      <div class="error-icon">
        <Icon
          :name="iconName"
          :class="['icon', `icon-${error.severity}`]"
        />
      </div>

      <!-- Error Content -->
      <div class="error-content">
        <div class="error-header">
          <h3 class="error-title">{{ errorTitle }}</h3>
          <UBadge
            v-if="error.scope"
            :label="error.scope"
            :color="scopeColor"
            size="xs"
            variant="subtle"
          />
        </div>

        <p class="error-message">{{ error.message }}</p>

        <!-- Error Details (expandable) -->
        <div v-if="showDetails && error.context" class="error-details">
          <UButton
            variant="ghost"
            size="xs"
            icon="heroicons:chevron-right"
            :class="{ 'rotated': detailsExpanded }"
            @click="detailsExpanded = !detailsExpanded"
          >
            Technical Details
          </UButton>

          <div v-show="detailsExpanded" class="details-content">
            <pre>{{ JSON.stringify(error.context, null, 2) }}</pre>
            <div v-if="error.code" class="error-code">
              <strong>Error Code:</strong> {{ error.code }}
            </div>
          </div>
        </div>

        <!-- Recovery Actions -->
        <div v-if="recoveryActions.length > 0" class="error-actions">
          <UButton
            v-for="action in recoveryActions"
            :key="action.label"
            :variant="action.primary ? 'solid' : 'outline'"
            :color="actionColor"
            size="sm"
            :loading="actionLoading === action.label"
            :disabled="actionLoading !== null"
            @click="handleAction(action)"
          >
            {{ action.label }}
          </UButton>
        </div>

        <!-- Support Links -->
        <div class="error-support">
          <span class="support-text">Need more help?</span>
          <ULink
            to="/support"
            class="support-link"
            @click="$emit('support-click')"
          >
            Contact Support
          </ULink>
          <span class="support-separator">•</span>
          <UButton
            variant="ghost"
            size="xs"
            @click="copyErrorDetails"
          >
            Copy Details
          </UButton>
        </div>
      </div>

      <!-- Close Button -->
      <UButton
        v-if="dismissible"
        icon="heroicons:x-mark"
        variant="ghost"
        size="sm"
        color="gray"
        class="error-close"
        :aria-label="'Dismiss error'"
        @click="$emit('close')"
        @keydown.esc="$emit('close')"
      />
    </div>

    <!-- Progress Bar for auto-dismiss -->
    <div
      v-if="autoDismiss && dismissible"
      class="error-progress"
      :style="{ width: `${progressWidth}%` }"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import type { MortgageError, RecoveryAction } from '~/composables/useErrorHandler'

interface Props {
  error: MortgageError | null
  dismissible?: boolean
  autoDismiss?: boolean
  autoDismissDelay?: number
  showDetails?: boolean
  maxWidth?: string
}

const props = withDefaults(defineProps<Props>(), {
  dismissible: true,
  autoDismiss: false,
  autoDismissDelay: 10000,
  showDetails: false,
  maxWidth: '600px'
})

const emit = defineEmits<{
  close: []
  'support-click': []
  'action-click': [action: RecoveryAction]
}>()

const detailsExpanded = ref(false)
const actionLoading = ref<string | null>(null)
const progressWidth = ref(100)
let progressInterval: NodeJS.Timeout | null = null

// Computed properties
const errorTitle = computed(() => {
  if (!props.error) return ''

  const titles: Record<string, string> = {
    [FRONTEND_ERROR_TYPES.WALLET_NOT_CONNECTED]: 'Wallet Required',
    [FRONTEND_ERROR_TYPES.WRONG_NETWORK]: 'Wrong Network',
    [FRONTEND_ERROR_TYPES.TRANSACTION_REJECTED]: 'Transaction Cancelled',
    [CONTRACT_ERROR_TYPES.INSUFFICIENT_FUNDS]: 'Insufficient Funds',
    [CONTRACT_ERROR_TYPES.INSUFFICIENT_ALLOWANCE]: 'Approval Required',
    [CONTRACT_ERROR_TYPES.UNAUTHORIZED]: 'Access Denied',
    [NETWORK_ERROR_TYPES.NETWORK_CONNECTION_ERROR]: 'Connection Error',
    [NETWORK_ERROR_TYPES.RPC_TIMEOUT]: 'Request Timeout',
    [NETWORK_ERROR_TYPES.RATE_LIMIT_EXCEEDED]: 'Rate Limited'
  }

  return titles[props.error.type] || 'Error'
})

const iconName = computed(() => {
  if (!props.error) return 'heroicons:exclamation-triangle'

  const icons: Record<string, string> = {
    low: 'heroicons:information-circle',
    medium: 'heroicons:exclamation-triangle',
    high: 'heroicons:exclamation-circle',
    critical: 'heroicons:x-circle'
  }

  return icons[props.error.severity] || 'heroicons:exclamation-triangle'
})

const scopeColor = computed(() => {
  if (!props.error) return 'gray'

  const colors: Record<string, string> = {
    CONTRACT: 'red',
    FRONTEND: 'blue',
    NETWORK: 'yellow'
  }

  return colors[props.error.scope] || 'gray'
})

const actionColor = computed(() => {
  if (!props.error) return 'primary'

  const colors: Record<string, string> = {
    CONTRACT: 'red',
    FRONTEND: 'blue',
    NETWORK: 'yellow'
  }

  return colors[props.error.scope] || 'primary'
})

const recoveryActions = computed((): RecoveryAction[] => {
  if (!props.error) return []

  // Get recovery actions from useErrorHandler
  const { getRecoveryActions } = useErrorHandler()
  return getRecoveryActions(props.error)
})

// Auto-dismiss functionality
onMounted(() => {
  if (props.autoDismiss && props.autoDismissDelay > 0) {
    const decrement = 100 / (props.autoDismissDelay / 100)
    progressInterval = setInterval(() => {
      progressWidth.value = Math.max(0, progressWidth.value - decrement)
      if (progressWidth.value <= 0) {
        emit('close')
      }
    }, 100)
  }
})

onUnmounted(() => {
  if (progressInterval) {
    clearInterval(progressInterval)
  }
})

// Methods
const handleAction = async (action: RecoveryAction): Promise<void> => {
  actionLoading.value = action.label

  try {
    await action.handler()
    emit('action-click', action)
  } catch (error) {
    console.error('Error action failed:', error)
  } finally {
    actionLoading.value = null
  }
}

const copyErrorDetails = async (): Promise<void> => {
  if (!props.error) return

  try {
    const details = JSON.stringify(props.error.toJSON(), null, 2)
    await navigator.clipboard.writeText(details)

    // Show success feedback
    // This could use a toast notification
    console.log('Error details copied to clipboard')
  } catch (error) {
    console.error('Failed to copy error details:', error)
  }
}

// Import error types (these would be imported from the types file)
const FRONTEND_ERROR_TYPES = {
  WALLET_NOT_CONNECTED: 'WALLET_NOT_CONNECTED',
  WRONG_NETWORK: 'WRONG_NETWORK',
  TRANSACTION_REJECTED: 'TRANSACTION_REJECTED'
}

const CONTRACT_ERROR_TYPES = {
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  INSUFFICIENT_ALLOWANCE: 'INSUFFICIENT_ALLOWANCE',
  UNAUTHORIZED: 'UNAUTHORIZED'
}

const NETWORK_ERROR_TYPES = {
  NETWORK_CONNECTION_ERROR: 'NETWORK_CONNECTION_ERROR',
  RPC_TIMEOUT: 'RPC_TIMEOUT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
}
</script>

<style scoped>
.error-alert {
  @apply relative rounded-lg border p-4 mb-4;
  max-width: v-bind(maxWidth);
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);
}

.error-alert.error-contract {
  @apply border-red-200 bg-red-50/90;
}

.error-alert.error-frontend {
  @apply border-blue-200 bg-blue-50/90;
}

.error-alert.error-network {
  @apply border-yellow-200 bg-yellow-50/90;
}

.error-alert.error-low {
  @apply border-blue-200 bg-blue-50/90;
}

.error-alert.error-medium {
  @apply border-yellow-200 bg-yellow-50/90;
}

.error-alert.error-high {
  @apply border-orange-200 bg-orange-50/90;
}

.error-alert.error-critical {
  @apply border-red-200 bg-red-50/90;
}

.error-container {
  @apply flex items-start gap-3;
}

.error-icon {
  @apply flex-shrink-0 mt-0.5;
}

.icon {
  @apply h-5 w-5;
}

.icon-low {
  @apply text-blue-500;
}

.icon-medium {
  @apply text-yellow-500;
}

.icon-high {
  @apply text-orange-500;
}

.icon-critical {
  @apply text-red-500;
}

.error-content {
  @apply flex-1 min-w-0;
}

.error-header {
  @apply flex items-center gap-2 mb-1;
}

.error-title {
  @apply text-sm font-semibold text-gray-900;
}

.error-message {
  @apply text-sm text-gray-700 mb-3;
}

.error-details {
  @apply mb-3;
}

.details-content {
  @apply mt-2 p-3 bg-gray-50 rounded text-xs font-mono overflow-auto;
  max-height: 200px;
}

.error-code {
  @apply mt-2 text-xs text-gray-600;
}

.error-actions {
  @apply flex flex-wrap gap-2 mb-3;
}

.error-support {
  @apply flex items-center gap-2 text-xs text-gray-600;
}

.support-link {
  @apply text-blue-600 hover:text-blue-800 underline;
}

.support-separator {
  @apply text-gray-400;
}

.error-close {
  @apply flex-shrink-0 ml-2;
}

.error-dismissible {
  @apply pr-12;
}

.error-progress {
  @apply absolute bottom-0 left-0 h-1 bg-red-500 rounded-b-lg transition-all duration-100;
}

/* Animations */
.error-alert {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.error-close:hover {
  animation: rotate 0.2s ease-in-out;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(90deg);
  }
}

.rotated {
  transform: rotate(90deg);
  transition: transform 0.2s ease;
}

/* Focus management */
.error-alert:focus-within {
  @apply ring-2 ring-offset-2 ring-blue-500 rounded-lg;
}

/* Responsive design */
@media (max-width: 640px) {
  .error-container {
    @apply flex-col;
  }

  .error-icon {
    @apply self-start;
  }

  .error-actions {
    @apply flex-col;
  }

  .error-actions button {
    @apply w-full;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .error-alert {
    @apply border-2;
  }

  .error-message {
    @apply text-gray-900;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .error-alert,
  .error-close,
  .rotated {
    animation: none;
    transition: none;
  }
}
</style>
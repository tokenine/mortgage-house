/**
 * useErrorHandler Composable
 * Provides reactive error handling with state management and recovery actions
 */

import { ref, computed, readonly } from 'vue'
import type { MortgageError, MortgageErrorContext, ErrorScope, ErrorType } from '~/types/errors'
import { MortgageErrorHandler, MortgageErrorSeverity, NETWORK_ERROR_TYPES, FRONTEND_ERROR_TYPES, CONTRACT_ERROR_TYPES } from '~/types/errors'

export interface RecoveryAction {
  label: string
  primary: boolean
  handler: () => void | Promise<void>
}

export interface ErrorHandlerOptions {
  maxErrors?: number
  enableAnalytics?: boolean
  debounceMs?: number
}

export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const {
    maxErrors = 50,
    enableAnalytics = true,
    debounceMs = 300
  } = options

  // Reactive state
  const errors = ref<MortgageError[]>([])
  const currentError = ref<MortgageError | null>(null)
  const isLoading = ref(false)
  const retryCount = ref(0)
  const lastErrorTime = ref(0)

  // Debounced error handling
  let errorTimeout: NodeJS.Timeout | null = null

  // Computed properties
  const hasErrors = computed(() => errors.value.length > 0)
  const hasCurrentError = computed(() => currentError.value !== null)
  const errorCount = computed(() => errors.value.length)
  const recentErrors = computed(() =>
    errors.value.slice(-5).reverse() // Last 5 errors, newest first
  )
  const errorsByScope = computed(() => {
    const grouped: Record<ErrorScope, MortgageError[]> = {
      CONTRACT: [],
      FRONTEND: [],
      NETWORK: []
    }

    errors.value.forEach(error => {
      grouped[error.scope].push(error)
    })

    return grouped
  })

  const criticalErrors = computed(() =>
    errors.value.filter(error => error.severity === MortgageErrorSeverity.CRITICAL)
  )

  const retryableErrors = computed(() =>
    errors.value.filter(error => {
      const errorInstance = error as any
      return errorInstance.shouldRetry && errorInstance.shouldRetry()
    })
  )

  /**
   * Handle and process errors
   */
  const handleError = (error: any, context?: MortgageErrorContext): MortgageError => {
    let mortgageError: MortgageError

    if (error && typeof error === 'object' && 'scope' in error && 'type' in error && 'message' in error) {
      // Already a structured error
      mortgageError = error as MortgageError
    } else {
      // Convert to structured error
      mortgageError = MortgageErrorHandler.fromContractError(
        error?.message || error?.toString() || 'Unknown error',
        error?.code?.toString(),
        context || {}
      ) as any
    }

    // Debounce error handling to prevent spam
    if (errorTimeout) {
      clearTimeout(errorTimeout)
    }

    errorTimeout = setTimeout(() => {
      // Add error to list
      errors.value.push(mortgageError)

      // Maintain max error limit
      if (errors.value.length > maxErrors) {
        errors.value = errors.value.slice(-maxErrors)
      }

      // Set as current error
      currentError.value = mortgageError

      // Update timing
      lastErrorTime.value = Date.now()

      // Log for debugging
      MortgageErrorHandler.log(mortgageError, {
        totalErrors: errors.value.length,
        hasCurrentError: !!currentError.value
      })

      // Track analytics if enabled
      if (enableAnalytics) {
        trackError(mortgageError)
      }

      // Auto-clear non-critical errors after 10 seconds
      if (mortgageError.severity !== MortgageErrorSeverity.CRITICAL) {
        setTimeout(() => {
          if (currentError.value === mortgageError) {
            clearError()
          }
        }, 10000)
      }
    }, debounceMs)

    return mortgageError
  }

  /**
   * Clear current error
   */
  const clearError = (): void => {
    currentError.value = null
  }

  /**
   * Clear all errors
   */
  const clearAllErrors = (): void => {
    errors.value = []
    currentError.value = null
    retryCount.value = 0
  }

  /**
   * Clear errors by scope
   */
  const clearErrorsByScope = (scope: ErrorScope): void => {
    errors.value = errors.value.filter(error => error.scope !== scope)
    if (currentError.value?.scope === scope) {
      currentError.value = null
    }
  }

  /**
   * Get recovery actions for an error
   */
  const getRecoveryActions = (error: MortgageError): RecoveryAction[] => {
    const actions: RecoveryAction[] = []

    switch (error.type) {
      case FRONTEND_ERROR_TYPES.WALLET_NOT_CONNECTED:
        actions.push({
          label: 'Connect Wallet',
          primary: true,
          handler: async () => {
            // This would be implemented with actual wallet connection logic
            clearError()
          }
        })
        break

      case FRONTEND_ERROR_TYPES.WRONG_NETWORK:
        actions.push({
          label: 'Switch Network',
          primary: true,
          handler: async () => {
            // This would be implemented with actual network switching logic
            clearError()
          }
        })
        actions.push({
          label: 'Network Guide',
          primary: false,
          handler: () => {
            // Navigate to network guide
            window.open('/network-guide', '_blank')
          }
        })
        break

      case CONTRACT_ERROR_TYPES.INSUFFICIENT_FUNDS:
        actions.push({
          label: 'Buy USDT',
          primary: true,
          handler: () => {
            // Navigate to USDT purchase
            window.open('/buy-usdt', '_blank')
          }
        })
        actions.push({
          label: 'Check Balance',
          primary: false,
          handler: () => {
            // Navigate to balance page
            window.open('/balance', '_blank')
          }
        })
        break

      case CONTRACT_ERROR_TYPES.INSUFFICIENT_ALLOWANCE:
        actions.push({
          label: 'Approve USDT',
          primary: true,
          handler: () => {
            // This would trigger the approval flow
            clearError()
          }
        })
        break

      case NETWORK_ERROR_TYPES.NETWORK_CONNECTION_ERROR:
      case NETWORK_ERROR_TYPES.RPC_TIMEOUT:
        actions.push({
          label: 'Retry',
          primary: true,
          handler: async () => {
            retryCount.value++
            clearError()
            // This would retry the last failed action
          }
        })
        actions.push({
          label: 'Check Connection',
          primary: false,
          handler: () => {
            // Test network connection
            testNetworkConnection()
          }
        })
        break

      case NETWORK_ERROR_TYPES.RATE_LIMIT_EXCEEDED:
        actions.push({
          label: 'Try Again',
          primary: true,
          handler: async () => {
            // Wait for rate limit to reset
            await new Promise(resolve => setTimeout(resolve, 5000))
            clearError()
          }
        })
        break
    }

    // Always add support contact option
    if (error.severity === MortgageErrorSeverity.HIGH || error.severity === MortgageErrorSeverity.CRITICAL) {
      actions.push({
        label: 'Contact Support',
        primary: false,
        handler: () => {
          window.open('/support', '_blank')
        }
      })
    }

    // Add dismiss option for non-critical errors
    if (error.severity !== MortgageErrorSeverity.CRITICAL) {
      actions.push({
        label: 'Dismiss',
        primary: false,
        handler: clearError
      })
    }

    return actions
  }

  /**
   * Test network connection
   */
  const testNetworkConnection = async (): Promise<boolean> => {
    isLoading.value = true
    try {
      const response = await fetch('https://api.example.com/health', {
        method: 'HEAD',
        cache: 'no-cache'
      })
      return response.ok
    } catch {
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Retry last failed action
   */
  const retryLastAction = async (): Promise<boolean> => {
    if (retryableErrors.value.length === 0) {
      return false
    }

    const lastRetryableError = retryableErrors.value[retryableErrors.value.length - 1]
    retryCount.value++

    try {
      clearError()
      // This would implement actual retry logic
      return true
    } catch (error) {
      handleError(error)
      return false
    }
  }

  /**
   * Track error analytics
   */
  const trackError = (error: MortgageError): void => {
    try {
      // Send to analytics service
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'mortgage_error', {
          error_scope: error.scope,
          error_type: error.type,
          error_code: error.code || 'undefined',
          error_severity: error.severity
        })
      }

      // Send to custom analytics endpoint
      fetch('/api/analytics/error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: error.toJSON(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: Date.now()
        })
      }).catch(() => {
        // Silently fail analytics to avoid error loops
      })
    } catch {
      // Silently fail analytics
    }
  }

  /**
   * Get error statistics
   */
  const getErrorStats = () => {
    const stats = {
      total: errors.value.length,
      byScope: {
        CONTRACT: 0,
        FRONTEND: 0,
        NETWORK: 0
      },
      bySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      byType: {} as Record<string, number>
    }

    errors.value.forEach(error => {
      stats.byScope[error.scope]++
      stats.bySeverity[error.severity]++
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1
    })

    return stats
  }

  /**
   * Export error log for support
   */
  const exportErrorLog = (): string => {
    const log = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errors: errors.value.map(error => error.toJSON()),
      stats: getErrorStats()
    }

    return JSON.stringify(log, null, 2)
  }

  return {
    // State (readonly)
    errors: readonly(errors),
    currentError: readonly(currentError),
    isLoading: readonly(isLoading),
    retryCount: readonly(retryCount),
    lastErrorTime: readonly(lastErrorTime),

    // Computed
    hasErrors,
    hasCurrentError,
    errorCount,
    recentErrors,
    errorsByScope,
    criticalErrors,
    retryableErrors,

    // Methods
    handleError,
    clearError,
    clearAllErrors,
    clearErrorsByScope,
    getRecoveryActions,
    retryLastAction,
    testNetworkConnection,
    getErrorStats,
    exportErrorLog
  }
}

// Global type declarations
declare global {
  interface Window {
    gtag?: (command: string, action: string, options: Record<string, any>) => void
  }
}
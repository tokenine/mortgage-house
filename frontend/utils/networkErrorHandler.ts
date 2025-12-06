/**
 * Network Error Handler
 * Provides comprehensive network error handling with retry mechanisms
 */

import type { MortgageError, MortgageErrorContext } from '~/types/errors'
import { StructuredMortgageError, MortgageErrorSeverity, NETWORK_ERROR_TYPES } from '~/types/errors'

export interface NetworkRetryOptions {
  maxRetries?: number
  retryDelay?: number
  exponentialBackoff?: boolean
  maxDelay?: number
  retryCondition?: (error: any) => boolean
}

export interface NetworkRequestConfig {
  timeout?: number
  retries?: NetworkRetryOptions
  priority?: 'low' | 'medium' | 'high'
  cacheable?: boolean
}

export interface QueuedRequest {
  id: string
  execute: () => Promise<any>
  resolve: (value: any) => void
  reject: (error: any) => void
  retries: number
  lastAttempt: number
  config: NetworkRequestConfig
}

/**
 * Network Error Handler Class
 */
export class NetworkErrorHandler {
  private static instance: NetworkErrorHandler
  private requestQueue: QueuedRequest[] = []
  private activeRequests: Map<string, QueuedRequest> = new Map()
  private isOnline = navigator.onLine
  private retryQueue: QueuedRequest[] = []

  private constructor() {
    this.setupEventListeners()
  }

  static getInstance(): NetworkErrorHandler {
    if (!NetworkErrorHandler.instance) {
      NetworkErrorHandler.instance = new NetworkErrorHandler()
    }
    return NetworkErrorHandler.instance
  }

  /**
   * Setup event listeners for network status changes
   */
  private setupEventListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this))
      window.addEventListener('offline', this.handleOffline.bind(this))
    }
  }

  /**
   * Handle network coming back online
   */
  private handleOnline(): void {
    this.isOnline = true
    console.log('Network connection restored')
    this.processRetryQueue()
  }

  /**
   * Handle network going offline
   */
  private handleOffline(): void {
    this.isOnline = false
    console.log('Network connection lost')
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(error: any): boolean {
    // Network-related errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return true
    }

    if (error.name === 'NetworkError') {
      return true
    }

    // HTTP status codes that are retryable
    if (error.status) {
      const retryableStatusCodes = [408, 429, 500, 502, 503, 504]
      return retryableStatusCodes.includes(error.status)
    }

    // RPC/Web3 errors
    if (error.code === -32603 || error.code === -32000) {
      return true
    }

    // Timeout errors
    if (error.message?.includes('timeout') || error.message?.includes('TIMEOUT')) {
      return true
    }

    return false
  }

  /**
   * Create network error from generic error
   */
  static createNetworkError(error: any, context: MortgageErrorContext = {}): MortgageError {
    if (error.status === 408) {
      return new StructuredMortgageError(
        'NETWORK',
        NETWORK_ERROR_TYPES.RPC_TIMEOUT,
        'Request timed out. Please try again.',
        error.code?.toString(),
        MortgageErrorSeverity.MEDIUM,
        context
      )
    }

    if (error.status === 429) {
      return new StructuredMortgageError(
        'NETWORK',
        NETWORK_ERROR_TYPES.RATE_LIMIT_EXCEEDED,
        'Too many requests. Please wait before trying again.',
        error.code?.toString(),
        MortgageErrorSeverity.MEDIUM,
        context
      )
    }

    if (error.status === 500 || error.status === 502 || error.status === 503 || error.status === 504) {
      return new StructuredMortgageError(
        'NETWORK',
        NETWORK_ERROR_TYPES.NODE_UNAVAILABLE,
        'Service temporarily unavailable. Please try again later.',
        error.code?.toString(),
        MortgageErrorSeverity.HIGH,
        context
      )
    }

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new StructuredMortgageError(
        'NETWORK',
        NETWORK_ERROR_TYPES.NETWORK_CONNECTION_ERROR,
        'Network connection error. Please check your internet connection.',
        error.code?.toString(),
        MortgageErrorSeverity.HIGH,
        context
      )
    }

    if (error.message?.includes('timeout')) {
      return new StructuredMortgageError(
        'NETWORK',
        NETWORK_ERROR_TYPES.RPC_TIMEOUT,
        'Request timed out. Please check your connection and try again.',
        error.code?.toString(),
        MortgageErrorSeverity.MEDIUM,
        context
      )
    }

    // Default network error
    return new StructuredMortgageError(
      'NETWORK',
      NETWORK_ERROR_TYPES.NETWORK_ERROR,
      'Network error occurred. Please try again.',
      error.code?.toString(),
      MortgageErrorSeverity.MEDIUM,
      context
    )
  }

  /**
   * Execute request with retry logic
   */
  static async executeWithRetry<T>(
    requestFn: () => Promise<T>,
    options: NetworkRetryOptions = {},
    context: MortgageErrorContext = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      exponentialBackoff = true,
      maxDelay = 30000,
      retryCondition = NetworkErrorHandler.isRetryableError
    } = options

    let lastError: any

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await requestFn()
        return result
      } catch (error: any) {
        lastError = error

        // Check if we should retry
        if (attempt === maxRetries || !retryCondition(error)) {
          throw NetworkErrorHandler.createNetworkError(error, {
            ...context,
            attempt: attempt + 1,
            maxRetries
          })
        }

        // Calculate delay for next attempt
        let delay = retryDelay
        if (exponentialBackoff) {
          delay = Math.min(retryDelay * Math.pow(2, attempt), maxDelay)
        }

        // Add jitter to prevent thundering herd
        delay = delay + Math.random() * 1000

        console.warn(`Request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms:`, error.message)

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    // This should never be reached, but TypeScript needs it
    throw NetworkErrorHandler.createNetworkError(lastError, context)
  }

  /**
   * Create fetch wrapper with retry logic
   */
  static createFetchWithRetry(defaultOptions: NetworkRequestConfig = {}) {
    return async (url: string, options: RequestInit = {}, retryOptions?: NetworkRetryOptions): Promise<Response> => {
      const config = { ...defaultOptions, ...retryOptions }

      const requestFn = async (): Promise<Response> => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000)

        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            const error = new Error(response.statusText) as any
            error.status = response.status
            error.response = response
            throw error
          }

          return response
        } catch (error: any) {
          clearTimeout(timeoutId)
          throw error
        }
      }

      return NetworkErrorHandler.executeWithRetry(requestFn, config.retries, { url, method: options.method })
    }
  }

  /**
   * Queue request for later execution
   */
  queueRequest<T>(
    id: string,
    executeFn: () => Promise<T>,
    config: NetworkRequestConfig = {}
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: QueuedRequest = {
        id,
        execute: executeFn,
        resolve,
        reject,
        retries: 0,
        lastAttempt: Date.now(),
        config
      }

      // If online, try to execute immediately
      if (this.isOnline && config.priority !== 'low') {
        this.executeRequest(request)
      } else {
        this.requestQueue.push(request)
      }
    })
  }

  /**
   * Execute a queued request
   */
  private async executeRequest(request: QueuedRequest): Promise<void> {
    this.activeRequests.set(request.id, request)

    try {
      const result = await request.execute()
      request.resolve(result)
    } catch (error: any) {
      // Check if we should retry
      if (NetworkErrorHandler.isRetryableError(error) && request.retries < (request.config.retries?.maxRetries || 3)) {
        request.retries++
        request.lastAttempt = Date.now()

        // Calculate retry delay
        const retryDelay = request.config.retries?.retryDelay || 1000
        const delay = request.config.retries?.exponentialBackoff
          ? retryDelay * Math.pow(2, request.retries - 1)
          : retryDelay

        setTimeout(() => {
          this.retryQueue.push(request)
        }, delay)
      } else {
        request.reject(NetworkErrorHandler.createNetworkError(error))
      }
    } finally {
      this.activeRequests.delete(request.id)
    }
  }

  /**
   * Process retry queue
   */
  private async processRetryQueue(): Promise<void> {
    while (this.retryQueue.length > 0 && this.isOnline) {
      const request = this.retryQueue.shift()!
      await this.executeRequest(request)
    }

    // Process regular queue
    while (this.requestQueue.length > 0 && this.isOnline) {
      const request = this.requestQueue.shift()!
      await this.executeRequest(request)
    }
  }

  /**
   * Cancel a queued request
   */
  cancelRequest(id: string): boolean {
    // Remove from regular queue
    const regularIndex = this.requestQueue.findIndex(req => req.id === id)
    if (regularIndex !== -1) {
      const request = this.requestQueue.splice(regularIndex, 1)[0]
      request.reject(new Error('Request cancelled'))
      return true
    }

    // Remove from retry queue
    const retryIndex = this.retryQueue.findIndex(req => req.id === id)
    if (retryIndex !== -1) {
      const request = this.retryQueue.splice(retryIndex, 1)[0]
      request.reject(new Error('Request cancelled'))
      return true
    }

    // Check if it's currently executing
    const activeRequest = this.activeRequests.get(id)
    if (activeRequest) {
      activeRequest.reject(new Error('Request cancelled'))
      this.activeRequests.delete(id)
      return true
    }

    return false
  }

  /**
   * Get network status
   */
  getNetworkStatus(): {
    isOnline: boolean
    queueLength: number
    activeRequests: number
    retryQueueLength: number
  } {
    return {
      isOnline: this.isOnline,
      queueLength: this.requestQueue.length,
      activeRequests: this.activeRequests.size,
      retryQueueLength: this.retryQueue.length
    }
  }

  /**
   * Clear all queues
   */
  clearQueues(): void {
    // Reject all queued requests
    [...this.requestQueue, ...this.retryQueue].forEach(request => {
      request.reject(new Error('Request queue cleared'))
    })

    this.requestQueue = []
    this.retryQueue = []
  }

  /**
   * Test network connectivity
   */
  static async testConnectivity(url = 'https://api.example.com/health'): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Get network quality metrics
   */
  static async getNetworkMetrics(): Promise<{
    latency: number
    speed: number
    reliability: number
  }> {
    const startTime = Date.now()

    try {
      const response = await fetch('https://api.example.com/metrics', {
        method: 'GET',
        cache: 'no-cache'
      })

      const latency = Date.now() - startTime
      const speed = response.ok ? 1000 / latency : 0
      const reliability = response.ok ? 1 : 0

      return { latency, speed, reliability }
    } catch {
      return {
        latency: 10000,
        speed: 0,
        reliability: 0
      }
    }
  }
}

/**
 * Default fetch instance with retry logic
 */
export const fetchWithRetry = NetworkErrorHandler.createFetchWithRetry({
  timeout: 30000,
  retries: {
    maxRetries: 3,
    retryDelay: 1000,
    exponentialBackoff: true,
    maxDelay: 10000
  }
})

/**
 * Utility function for retrying async operations
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: NetworkRetryOptions = {},
  context?: MortgageErrorContext
): Promise<T> {
  return NetworkErrorHandler.executeWithRetry(fn, options, context)
}

/**
 * Network status composable
 */
export function useNetworkStatus() {
  const handler = NetworkErrorHandler.getInstance()

  const networkStatus = computed(() => handler.getNetworkStatus())

  const isOnline = computed(() => networkStatus.value.isOnline)
  const hasPendingRequests = computed(() =>
    networkStatus.value.queueLength > 0 ||
    networkStatus.value.retryQueueLength > 0 ||
    networkStatus.value.activeRequests > 0
  )

  const testConnectivity = () => NetworkErrorHandler.testConnectivity()
  const getMetrics = () => NetworkErrorHandler.getNetworkMetrics()

  return {
    networkStatus,
    isOnline,
    hasPendingRequests,
    testConnectivity,
    getMetrics
  }
}
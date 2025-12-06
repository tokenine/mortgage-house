/**
 * Error Logging and Analytics Service
 * Provides comprehensive error logging with analytics tracking
 */

import type { MortgageError, MortgageErrorContext } from '~/types/errors'

export interface ErrorLog {
  id: string
  timestamp: string
  error: {
    name?: string
    message: string
    stack?: string
    code?: string
  }
  mortgageError: MortgageError
  context: MortgageErrorContext
  userAgent: string
  url: string
  sessionId: string
  userId?: string
  deviceId: string
  platform: string
  networkInfo: {
    isOnline: boolean
    connectionType?: string
    effectiveType?: string
  }
  performance: {
    memory?: any
    timing?: any
  }
  customData?: Record<string, any>
}

export interface ErrorAnalytics {
  totalErrors: number
  errorsByScope: Record<string, number>
  errorsByType: Record<string, number>
  errorsBySeverity: Record<string, number>
  recentErrors: ErrorLog[]
  errorRate: number
  topErrors: Array<{
    type: string
    count: number
    percentage: number
  }>
}

export interface LoggerConfig {
  enableConsoleLogging: boolean
  enableRemoteLogging: boolean
  enableAnalytics: boolean
  maxLogSize: number
  remoteEndpoint: string
  batchSize: number
  flushInterval: number
  sampleRate: number
}

/**
 * Error Logger Class
 */
export class ErrorLogger {
  private static instance: ErrorLogger
  private logs: ErrorLog[] = []
  private config: LoggerConfig
  private sessionId: string
  private deviceId: string
  private flushTimer: NodeJS.Timeout | null = null

  private constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      enableConsoleLogging: true,
      enableRemoteLogging: process.env.NODE_ENV === 'production',
      enableAnalytics: true,
      maxLogSize: 1000,
      remoteEndpoint: '/api/errors',
      batchSize: 10,
      flushInterval: 30000,
      sampleRate: 1.0,
      ...config
    }

    this.sessionId = this.generateSessionId()
    this.deviceId = this.getOrCreateDeviceId()

    if (typeof window !== 'undefined') {
      this.setupErrorHandlers()
      this.startFlushTimer()
    }
  }

  static getInstance(config?: Partial<LoggerConfig>): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger(config)
    }
    return ErrorLogger.instance
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get or create device ID
   */
  private getOrCreateDeviceId(): string {
    if (typeof window === 'undefined') return 'server'

    let deviceId = localStorage.getItem('mortgage_device_id')
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('mortgage_device_id', deviceId)
    }
    return deviceId
  }

  /**
   * Setup global error handlers
   */
  private setupErrorHandlers(): void {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.logError(event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    })

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(event.reason, {
        promise: true
      })
      event.preventDefault()
    })
  }

  /**
   * Start automatic flush timer
   */
  private startFlushTimer(): void {
    if (this.config.enableRemoteLogging && this.config.flushInterval > 0) {
      this.flushTimer = setInterval(() => {
        this.flushLogs()
      }, this.config.flushInterval)
    }
  }

  /**
   * Log an error with full context
   */
  logError(
    error: any,
    mortgageError?: MortgageError,
    context: MortgageErrorContext = {},
    customData?: Record<string, any>
  ): void {
    // Sample errors if sample rate is less than 1
    if (Math.random() > this.config.sampleRate) {
      return
    }

    const structuredError = mortgageError || this.createStructuredError(error, context)

    const log: ErrorLog = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      error: {
        name: error?.name,
        message: error?.message || error?.toString() || 'Unknown error',
        stack: error?.stack,
        code: error?.code?.toString()
      },
      mortgageError: structuredError,
      context: {
        ...context,
        timestamp: Date.now()
      },
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.sessionId,
      userId: this.getUserId(),
      deviceId: this.deviceId,
      platform: this.getPlatform(),
      networkInfo: this.getNetworkInfo(),
      performance: this.getPerformanceInfo(),
      customData
    }

    // Add to local logs
    this.logs.push(log)

    // Maintain max log size
    if (this.logs.length > this.config.maxLogSize) {
      this.logs = this.logs.slice(-this.config.maxLogSize)
    }

    // Console logging
    if (this.config.enableConsoleLogging) {
      this.consoleLog(log)
    }

    // Analytics tracking
    if (this.config.enableAnalytics) {
      this.trackAnalytics(log)
    }

    // Remote logging (batched)
    if (this.config.enableRemoteLogging) {
      if (this.logs.length >= this.config.batchSize) {
        this.flushLogs()
      }
    }
  }

  /**
   * Create structured error from generic error
   */
  private createStructuredError(error: any, context: MortgageErrorContext): MortgageError {
    // If it already has the required structure, use it
    if (error && typeof error === 'object' && 'scope' in error && 'type' in error && 'message' in error) {
      return error as MortgageError
    }

    // Create a basic structured error
    return {
      scope: 'FRONTEND',
      type: 'UNKNOWN_ERROR',
      message: error?.message || error?.toString() || 'Unknown error occurred',
      code: error?.code?.toString()
    }
  }

  /**
   * Generate log ID
   */
  private generateLogId(): string {
    return `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
  }

  /**
   * Get user ID (if available)
   */
  private getUserId(): string | undefined {
    // This would integrate with your auth system
    return localStorage.getItem('user_id') || undefined
  }

  /**
   * Get platform information
   */
  private getPlatform(): string {
    const userAgent = navigator.userAgent

    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      return 'iOS'
    }
    if (userAgent.includes('Android')) {
      return 'Android'
    }
    if (userAgent.includes('Mac')) {
      return 'macOS'
    }
    if (userAgent.includes('Windows')) {
      return 'Windows'
    }
    if (userAgent.includes('Linux')) {
      return 'Linux'
    }

    return 'Unknown'
  }

  /**
   * Get network information
   */
  private getNetworkInfo() {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

    return {
      isOnline: navigator.onLine,
      connectionType: connection?.type,
      effectiveType: connection?.effectiveType
    }
  }

  /**
   * Get performance information
   */
  private getPerformanceInfo() {
    if (typeof performance === 'undefined') return {}

    const memory = (performance as any).memory
    const timing = performance.timing

    return {
      memory: memory ? {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      } : undefined,
      timing: timing ? {
        loadTime: timing.loadEventEnd - timing.navigationStart,
        domReady: timing.domContentLoadedEventEnd - timing.navigationStart
      } : undefined
    }
  }

  /**
   * Console logging with formatting
   */
  private consoleLog(log: ErrorLog): void {
    const style = 'color: #ff4757; font-weight: bold; font-size: 12px;'

    console.group(`%c🚨 Mortgage Error: ${log.mortgageError.type}`, style)
    console.error('Error:', log.error)
    console.log('Structured Error:', log.mortgageError)
    console.log('Context:', log.context)
    console.log('Session:', log.sessionId)
    console.log('Device:', log.deviceId)
    if (log.customData) {
      console.log('Custom Data:', log.customData)
    }
    console.groupEnd()
  }

  /**
   * Track analytics for errors
   */
  private trackAnalytics(log: ErrorLog): void {
    try {
      // Google Analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'mortgage_error', {
          error_scope: log.mortgageError.scope,
          error_type: log.mortgageError.type,
          error_severity: (log.mortgageError as any).severity || 'unknown',
          session_id: log.sessionId,
          custom_map: { custom_parameter_1: log.deviceId }
        })
      }

      // Custom analytics endpoint
      this.sendToAnalytics({
        event: 'mortgage_error',
        properties: {
          error_scope: log.mortgageError.scope,
          error_type: log.mortgageError.type,
          error_code: log.mortgageError.code,
          timestamp: log.timestamp,
          session_id: log.sessionId,
          device_id: log.deviceId,
          platform: log.platform,
          url: log.url
        }
      })
    } catch (error) {
      // Silently fail analytics to avoid error loops
      console.warn('Analytics tracking failed:', error)
    }
  }

  /**
   * Send data to analytics endpoint
   */
  private async sendToAnalytics(data: any): Promise<void> {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Flush logs to remote server
   */
  private async flushLogs(): Promise<void> {
    if (!this.config.enableRemoteLogging || this.logs.length === 0) {
      return
    }

    const logsToSend = this.logs.splice(0, this.config.batchSize)

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          logs: logsToSend,
          sessionId: this.sessionId,
          deviceId: this.deviceId,
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      // If remote logging fails, add logs back to the array
      this.logs.unshift(...logsToSend)
      console.warn('Failed to flush error logs:', error)
    }
  }

  /**
   * Get error analytics
   */
  getAnalytics(): ErrorAnalytics {
    const totalErrors = this.logs.length

    const errorsByScope: Record<string, number> = {}
    const errorsByType: Record<string, number> = {}
    const errorsBySeverity: Record<string, number> = {}

    this.logs.forEach(log => {
      const scope = log.mortgageError.scope
      const type = log.mortgageError.type
      const severity = (log.mortgageError as any).severity || 'unknown'

      errorsByScope[scope] = (errorsByScope[scope] || 0) + 1
      errorsByType[type] = (errorsByType[type] || 0) + 1
      errorsBySeverity[severity] = (errorsBySeverity[severity] || 0) + 1
    })

    // Calculate top errors
    const errorEntries = Object.entries(errorsByType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([type, count]) => ({
        type,
        count,
        percentage: totalErrors > 0 ? (count / totalErrors) * 100 : 0
      }))

    return {
      totalErrors,
      errorsByScope,
      errorsByType,
      errorsBySeverity,
      recentErrors: this.logs.slice(-10),
      errorRate: 0, // Would be calculated based on session time
      topErrors: errorEntries
    }
  }

  /**
   * Export logs
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = [
        'timestamp',
        'error_type',
        'error_scope',
        'error_message',
        'error_code',
        'session_id',
        'device_id',
        'platform',
        'url'
      ]

      const csvData = this.logs.map(log => [
        log.timestamp,
        log.mortgageError.type,
        log.mortgageError.scope,
        log.mortgageError.message,
        log.mortgageError.code || '',
        log.sessionId,
        log.deviceId,
        log.platform,
        log.url
      ])

      return [headers, ...csvData].map(row => row.join(',')).join('\n')
    }

    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      sessionId: this.sessionId,
      deviceId: this.deviceId,
      totalLogs: this.logs.length,
      logs: this.logs
    }, null, 2)
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = []
  }

  /**
   * Get logs
   */
  getLogs(limit?: number): ErrorLog[] {
    return limit ? this.logs.slice(-limit) : this.logs
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig }

    // Restart flush timer if interval changed
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.startFlushTimer()
    }
  }

  /**
   * Destroy logger (cleanup)
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }

    // Flush any remaining logs
    this.flushLogs()
  }
}

/**
 * Global error logger instance
 */
export const errorLogger = ErrorLogger.getInstance()

/**
 * Utility function to log errors
 */
export function logError(
  error: any,
  mortgageError?: MortgageError,
  context?: MortgageErrorContext,
  customData?: Record<string, any>
): void {
  errorLogger.logError(error, mortgageError, context, customData)
}
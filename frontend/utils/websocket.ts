/**
 * WebSocket Utility
 * Epic 6.1 - Real-time Contract State Synchronization
 */

export interface WebSocketConfig {
  url: string
  reconnectInterval: number
  maxReconnectAttempts: number
  connectionTimeout: number
  pingInterval: number
  eventBufferSize: number
}

export interface WebSocketMessage {
  type: string
  data?: any
  id?: string
  timestamp?: number
}

export interface WebSocketStatus {
  connected: boolean
  connecting: boolean
  reconnecting: boolean
  error: string | null
  lastConnectTime: number
  reconnectAttempts: number
}

export class WebSocketManager {
  private ws: WebSocket | null = null
  private config: WebSocketConfig
  private status: WebSocketStatus
  private messageQueue: WebSocketMessage[] = []
  private eventListeners: Map<string, Function[]> = new Map()
  private reconnectTimer: NodeJS.Timeout | null = null
  private pingTimer: NodeJS.Timeout | null = null
  private connectionTimer: NodeJS.Timeout | null = null

  constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = {
      url: process.env.NODE_ENV === 'production'
        ? 'wss://api.mortgage-house.com/ws'
        : 'ws://localhost:3001/ws',
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
      connectionTimeout: 10000,
      pingInterval: 30000,
      eventBufferSize: 1000,
      ...config
    }

    this.status = {
      connected: false,
      connecting: false,
      reconnecting: false,
      error: null,
      lastConnectTime: 0,
      reconnectAttempts: 0
    }
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      this.status.connecting = true
      this.status.error = null

      try {
        this.ws = new WebSocket(this.config.url)

        // Set up connection timeout
        this.connectionTimer = setTimeout(() => {
          this.handleConnectionTimeout()
          reject(new Error('Connection timeout'))
        }, this.config.connectionTimeout)

        this.ws.onopen = (event) => {
          this.handleOpen(event)
          resolve()
        }

        this.ws.onclose = (event) => {
          this.handleClose(event)
        }

        this.ws.onerror = (event) => {
          this.handleError(event)
          reject(new Error('WebSocket connection error'))
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event)
        }

      } catch (error) {
        this.status.connecting = false
        this.status.error = error instanceof Error ? error.message : 'Unknown connection error'
        reject(error)
      }
    })
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.clearTimers()

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }

    this.status.connected = false
    this.status.connecting = false
    this.status.reconnecting = false
  }

  /**
   * Send message to WebSocket server
   */
  send(message: WebSocketMessage): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // Queue message for when connection is restored
      this.messageQueue.push(message)
      return false
    }

    try {
      const messageWithTimestamp = {
        ...message,
        id: message.id || this.generateMessageId(),
        timestamp: message.timestamp || Date.now()
      }

      this.ws.send(JSON.stringify(messageWithTimestamp))
      return true
    } catch (error) {
      console.error('Failed to send WebSocket message:', error)
      this.status.error = error instanceof Error ? error.message : 'Send error'
      return false
    }
  }

  /**
   * Add event listener
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  /**
   * Get current connection status
   */
  getStatus(): WebSocketStatus {
    return { ...this.status }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.status.connected && this.ws?.readyState === WebSocket.OPEN
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(event: Event): void {
    this.clearTimers()

    this.status.connected = true
    this.status.connecting = false
    this.status.reconnecting = false
    this.status.error = null
    this.status.lastConnectTime = Date.now()
    this.status.reconnectAttempts = 0

    // Send queued messages
    this.flushMessageQueue()

    // Start ping timer
    this.startPingTimer()

    // Emit connect event
    this.emit('connect', event)

    console.log('WebSocket connected to:', this.config.url)
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    this.clearTimers()

    const wasConnected = this.status.connected
    this.status.connected = false
    this.status.connecting = false

    if (this.status.reconnecting) {
      this.handleReconnectFailure()
    } else if (wasConnected) {
      this.emit('disconnect', event)
      this.initiateReconnection()
    }

    console.log('WebSocket disconnected:', event.code, event.reason)
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    this.status.error = 'WebSocket connection error'

    this.emit('error', event)

    console.error('WebSocket error:', event)
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)

      // Handle ping/pong
      if (message.type === 'pong') {
        this.emit('pong', message)
        return
      }

      // Emit message event
      this.emit('message', message)

      // Emit specific event type
      if (message.type) {
        this.emit(message.type, message.data || message)
      }

    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
      this.status.error = 'Message parsing error'
      this.emit('parseError', { event, error })
    }
  }

  /**
   * Handle connection timeout
   */
  private handleConnectionTimeout(): void {
    this.status.connecting = false
    this.status.error = 'Connection timeout'

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.initiateReconnection()
  }

  /**
   * Initiate reconnection process
   */
  private initiateReconnection(): void {
    if (this.status.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.status.error = 'Maximum reconnection attempts reached'
      this.emit('maxReconnectAttemptsReached')
      return
    }

    this.status.reconnecting = true
    this.status.reconnectAttempts++

    const delay = this.calculateReconnectDelay()

    this.reconnectTimer = setTimeout(() => {
      console.log(`WebSocket reconnection attempt ${this.status.reconnectAttempts}/${this.config.maxReconnectAttempts}`)
      this.connect().catch((error) => {
        console.error('Reconnection failed:', error)
      })
    }, delay)
  }

  /**
   * Handle reconnection failure
   */
  private handleReconnectFailure(): void {
    if (this.status.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.status.reconnecting = false
      this.status.error = 'Failed to reconnect after maximum attempts'
      this.emit('reconnectFailed')
    }
  }

  /**
   * Calculate reconnection delay with exponential backoff
   */
  private calculateReconnectDelay(): number {
    const baseDelay = this.config.reconnectInterval
    const exponentialDelay = baseDelay * Math.pow(2, this.status.reconnectAttempts - 1)
    const maxDelay = 30000 // 30 seconds max
    return Math.min(exponentialDelay, maxDelay)
  }

  /**
   * Start ping timer for connection health
   */
  private startPingTimer(): void {
    this.pingTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping' })
      } else {
        this.clearTimers()
      }
    }, this.config.pingInterval)
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.pingTimer) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }

    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer)
      this.connectionTimer = null
    }
  }

  /**
   * Flush queued messages
   */
  private flushMessageQueue(): void {
    const queue = [...this.messageQueue]
    this.messageQueue = []

    queue.forEach(message => {
      this.send(message)
    })
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error)
        }
      })
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get connection quality metrics
   */
  getConnectionQuality(): {
    quality: 'excellent' | 'good' | 'fair' | 'poor'
    uptime: number
    reconnects: number
  } {
    const uptime = this.status.lastConnectTime > 0 ? Date.now() - this.status.lastConnectTime : 0
    const reconnects = this.status.reconnectAttempts

    let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent'

    if (!this.status.connected) {
      quality = 'poor'
    } else if (reconnects > 5) {
      quality = 'fair'
    } else if (reconnects > 2) {
      quality = 'good'
    }

    return { quality, uptime, reconnects }
  }
}

/**
 * Create global WebSocket manager instance
 */
export let globalWebSocketManager: WebSocketManager | null = null

export const createWebSocketManager = (config?: Partial<WebSocketConfig>): WebSocketManager => {
  if (globalWebSocketManager) {
    globalWebSocketManager.disconnect()
  }

  globalWebSocketManager = new WebSocketManager(config)
  return globalWebSocketManager
}

export const getWebSocketManager = (): WebSocketManager => {
  if (!globalWebSocketManager) {
    return createWebSocketManager()
  }
  return globalWebSocketManager
}

/**
 * WebSocket connection factory for different environments
 */
export const createWebSocketConnection = (purpose: 'realtime' | 'notifications' | 'events' = 'realtime') => {
  const configs = {
    realtime: {
      url: process.env.NODE_ENV === 'production'
        ? 'wss://api.mortgage-house.com/ws/realtime'
        : 'ws://localhost:3001/ws/realtime',
      reconnectInterval: 3000,
      maxReconnectAttempts: 10
    },
    notifications: {
      url: process.env.NODE_ENV === 'production'
        ? 'wss://api.mortgage-house.com/ws/notifications'
        : 'ws://localhost:3001/ws/notifications',
      reconnectInterval: 5000,
      maxReconnectAttempts: 5
    },
    events: {
      url: process.env.NODE_ENV === 'production'
        ? 'wss://api.mortgage-house.com/ws/events'
        : 'ws://localhost:3001/ws/events',
      reconnectInterval: 2000,
      maxReconnectAttempts: 15
    }
  }

  return new WebSocketManager(configs[purpose])
}

/**
 * Vue composable for WebSocket management
 */
export function useWebSocketConnection(config?: Partial<WebSocketConfig>) {
  const wsManager = new WebSocketManager(config)
  const status = ref(wsManager.getStatus())

  // Update status reactively
  const updateStatus = () => {
    status.value = wsManager.getStatus()
  }

  // Set up status listeners
  wsManager.on('connect', updateStatus)
  wsManager.on('disconnect', updateStatus)
  wsManager.on('error', updateStatus)

  // Cleanup on unmount
  onUnmounted(() => {
    wsManager.off('connect', updateStatus)
    wsManager.off('disconnect', updateStatus)
    wsManager.off('error', updateStatus)
    wsManager.disconnect()
  })

  return {
    // Reactive state
    status: readonly(status),
    isConnected: computed(() => status.value.connected),
    isConnecting: computed(() => status.value.connecting),
    isReconnecting: computed(() => status.value.reconnecting),
    error: computed(() => status.value.error),
    reconnectAttempts: computed(() => status.value.reconnectAttempts),

    // Methods
    connect: () => wsManager.connect(),
    disconnect: () => wsManager.disconnect(),
    send: (message: WebSocketMessage) => wsManager.send(message),
    on: (event: string, callback: Function) => wsManager.on(event, callback),
    off: (event: string, callback: Function) => wsManager.off(event, callback),
    getConnectionQuality: () => wsManager.getConnectionQuality()
  }
}
/**
 * Real-time Synchronization Composable
 * Epic 6.1 - Real-time Contract State Synchronization
 */

import { ref, readonly, onUnmounted, nextTick, type Ref } from 'vue'
import { useWebSocket, type UseWebSocketReturn } from '@vueuse/core'
import { useAccount, usePublicClient } from '@wagmi/vue'
import { StructuredMortgageError, MortgageError, MortgageErrorSeverity } from '~/types/errors'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { useRealtimeStore } from '~/stores/realtime'
import { MORTGAGE_CONTRACT_ABI } from '~/utils/contract/constants'

// ========================================
  // REAL-TIME SYNC TYPES
  // ========================================

  export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'error'

  export interface RealtimeEvent {
    id: string
    type: string
    contractAddress: string
    blockNumber: bigint
    timestamp: number
    data: any
    source: 'blockchain' | 'websocket'
  }

  export interface PendingUpdate {
    id: string
    contractAddress: string
    type: string
    changes: Record<string, any>
    timestamp: number
    timeout: number
    expectedBlock?: bigint
  }

  export interface ConfirmedUpdate {
    id: string
    contractAddress: string
    type: string
    changes: Record<string, any>
    confirmedAt: bigint
    timestamp: number
  }

  export interface SyncError {
    id: string
    type: 'connection' | 'event_processing' | 'optimistic_update' | 'rollback'
    message: string
    timestamp: number
    contractAddress?: string
    retryable: boolean
    context?: any
  }

  export interface SyncMetrics {
    eventsProcessed: number
    updatesApplied: number
    rollbacksTriggered: number
    averageLatency: number
    lastEventTime: number
    connectionUptime: number
  }

  // ========================================
  // WEBSOCKET CONFIGURATION
  // ========================================

  const WS_CONFIG = {
    URL: process.env.NODE_ENV === 'production'
      ? 'wss://api.mortgage-house.com/ws'
      : 'ws://localhost:3001/ws',
    RECONNECT_INTERVAL: 3000, // 3 seconds
    MAX_RECONNECT_ATTEMPTS: 10,
    CONNECTION_TIMEOUT: 10000, // 10 seconds
    PING_INTERVAL: 30000, // 30 seconds
    EVENT_BUFFER_SIZE: 1000
  }

  // ========================================
  // REAL-TIME SYNC COMPOSABLE
  // ========================================

  export function useRealtimeSync() {
    // Dependencies
    const { address } = useAccount()
    const { handleError } = useErrorHandler()
    const publicClient = usePublicClient()
    const realtimeStore = useRealtimeStore()

    // State
    const connectionStatus = ref<ConnectionStatus>('disconnected')
    const lastSyncTime = ref<number>(0)
    const syncErrors = ref<SyncError[]>([])
    const syncMetrics = ref<SyncMetrics>({
      eventsProcessed: 0,
      updatesApplied: 0,
      rollbacksTriggered: 0,
      averageLatency: 0,
      lastEventTime: 0,
      connectionUptime: 0
    })

    // WebSocket connection
    let wsConnection: UseWebSocketReturn<any> | null = null
    let reconnectTimer: NodeJS.Timeout | null = null
    let reconnectAttempts = 0
    let pingTimer: NodeJS.Timeout | null = null
    let connectionStartTime = 0
    let eventBuffer: RealtimeEvent[] = []

    // Event listeners for blockchain events
    const eventUnsubscribers = new Map<string, () => void>()

    // ========================================
    // CONNECTION MANAGEMENT
    // ========================================

    /**
     * Establish WebSocket connection for real-time updates
     */
    const establishConnection = async (): Promise<boolean> => {
      try {
        if (connectionStatus.value === 'connected') {
          return true
        }

        connectionStatus.value = 'reconnecting'
        connectionStartTime = Date.now()

        // Initialize WebSocket connection
        wsConnection = useWebSocket(WS_CONFIG.URL, {
          autoReconnect: false, // We handle reconnection manually
          heartbeat: {
            message: JSON.stringify({ type: 'ping' }),
            interval: WS_CONFIG.PING_INTERVAL
          },
          onMessage: handleWebSocketMessage,
          onOpen: handleConnectionOpen,
          onClose: handleConnectionClose,
          onError: handleConnectionError
        })

        // Set connection timeout
        setTimeout(() => {
          if (connectionStatus.value === 'reconnecting') {
            handleConnectionTimeout()
          }
        }, WS_CONFIG.CONNECTION_TIMEOUT)

        return true

      } catch (error) {
        handleConnectionError(error)
        return false
      }
    }

    /**
     * Handle WebSocket connection open
     */
    const handleConnectionOpen = () => {
      connectionStatus.value = 'connected'
      reconnectAttempts = 0
      connectionStartTime = Date.now()

      updateLastSyncTime()
      clearSyncError('connection')

      // Start ping timer for connection monitoring
      startPingTimer()

      // Subscribe to blockchain events
      subscribeToBlockchainEvents()

      // Request initial sync
      requestInitialSync()

      console.log('Real-time sync connection established')
    }

    /**
     * Handle WebSocket connection close
     */
    const handleConnectionClose = (event: CloseEvent) => {
      connectionStatus.value = 'disconnected'
      stopPingTimer()

      addSyncError({
        type: 'connection',
        message: `Connection closed: ${event.reason || 'Unknown reason'} (${event.code})`,
        retryable: true,
        context: { code: event.code, reason: event.reason }
      })

      // Start reconnection process
      if (reconnectAttempts < WS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
        initiateReconnection()
      }
    }

    /**
     * Handle WebSocket connection error
     */
    const handleConnectionError = (error: any) => {
      connectionStatus.value = 'error'

      addSyncError({
        type: 'connection',
        message: `Connection error: ${error?.message || 'Unknown error'}`,
        retryable: true,
        context: { error }
      })

      console.error('WebSocket connection error:', error)
    }

    /**
     * Handle connection timeout
     */
    const handleConnectionTimeout = () => {
      if (connectionStatus.value === 'reconnecting') {
        connectionStatus.value = 'error'

        addSyncError({
          type: 'connection',
          message: 'Connection timeout - failed to establish connection within time limit',
          retryable: true
        })

        initiateReconnection()
      }
    }

    /**
     * Initiate reconnection with exponential backoff
     */
    const initiateReconnection = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }

      const backoffDelay = Math.min(
        WS_CONFIG.RECONNECT_INTERVAL * Math.pow(2, reconnectAttempts),
        30000 // Max 30 seconds
      )

      reconnectAttempts++

      reconnectTimer = setTimeout(async () => {
        console.log(`Attempting reconnection (${reconnectAttempts}/${WS_CONFIG.MAX_RECONNECT_ATTEMPTS})`)
        await establishConnection()
      }, backoffDelay)
    }

    /**
     * Start ping timer for connection monitoring
     */
    const startPingTimer = () => {
      if (pingTimer) {
        clearInterval(pingTimer)
      }

      pingTimer = setInterval(() => {
        if (wsConnection?.status === 'OPEN') {
          wsConnection.send(JSON.stringify({ type: 'ping' }))
        }
      }, WS_CONFIG.PING_INTERVAL)
    }

    /**
     * Stop ping timer
     */
    const stopPingTimer = () => {
      if (pingTimer) {
        clearInterval(pingTimer)
        pingTimer = null
      }
    }

    // ========================================
    // EVENT PROCESSING
    // ========================================

    /**
     * Handle WebSocket messages
     */
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data)

        switch (message.type) {
          case 'pong':
            // Handle pong response
            updateLastSyncTime()
            break

          case 'contract_event':
            handleContractEvent(message.data)
            break

          case 'sync_response':
            handleSyncResponse(message.data)
            break

          case 'error':
            handleServerError(message.data)
            break

          default:
            console.warn('Unknown message type:', message.type)
        }

      } catch (error) {
        addSyncError({
          type: 'event_processing',
          message: `Failed to process message: ${error?.message || 'Unknown error'}`,
          retryable: false,
          context: { event: event.data }
        })
      }
    }

    /**
     * Handle contract events from WebSocket
     */
    const handleContractEvent = (eventData: any) => {
      const realtimeEvent: RealtimeEvent = {
        id: generateEventId(),
        type: eventData.type,
        contractAddress: eventData.contractAddress,
        blockNumber: BigInt(eventData.blockNumber || 0),
        timestamp: Date.now(),
        data: eventData,
        source: 'websocket'
      }

      processRealtimeEvent(realtimeEvent)
    }

    /**
     * Process real-time events and update state
     */
    const processRealtimeEvent = (event: RealtimeEvent) => {
      try {
        const startTime = Date.now()

        // Add to event buffer
        eventBuffer.push(event)
        if (eventBuffer.length > WS_CONFIG.EVENT_BUFFER_SIZE) {
          eventBuffer = eventBuffer.slice(-WS_CONFIG.EVENT_BUFFER_SIZE)
        }

        // Process based on event type
        switch (event.type) {
          case 'CONTRACT_STATE_CHANGE':
            updateContractState(event)
            break

          case 'INVESTMENT_RECEIVED':
            updateFundingProgress(event)
            triggerPortfolioRefresh(event.data.investorAddress)
            break

          case 'REPAYMENT_PROCESSED':
            updateEarningsCalculations(event)
            refreshWithdrawableAmounts(event.contractAddress)
            break

          case 'STAGE_TRANSITION':
            updateContractStage(event)
            refreshAllContractViews(event.contractAddress)
            break

          case 'PAYOUT_WITHDRAWN':
            handleWithdrawalEvent(event)
            break

          default:
            console.warn('Unknown event type:', event.type)
        }

        // Update metrics
        const latency = Date.now() - startTime
        updateSyncMetrics({ latency })
        syncMetrics.value.eventsProcessed++

      } catch (error) {
        addSyncError({
          type: 'event_processing',
          message: `Failed to process event ${event.type}: ${error?.message || 'Unknown error'}`,
          retryable: false,
          context: { event }
        })
      }
    }

    /**
     * Subscribe to blockchain events using Viem
     */
    const subscribeToBlockchainEvents = () => {
      // Note: In a full implementation, this would subscribe to specific contracts
      // based on user's portfolio or watched contracts

      // For now, we'll set up the structure for event subscription
      console.log('Subscribing to blockchain events for real-time sync')
    }

    /**
     * Subscribe to events for a specific contract
     */
    const subscribeToContractEvents = (contractAddress: string) => {
      // Unsubscribe from existing events for this contract
      if (eventUnsubscribers.has(contractAddress)) {
        eventUnsubscribers.get(contractAddress)?.()
        eventUnsubscribers.delete(contractAddress)
      }

      try {
        const unwatch = publicClient.watchEvent({
          address: contractAddress as `0x${string}`,
          abi: MORTGAGE_CONTRACT_ABI,
          eventName: '*', // All events
          onLogs: (logs) => {
            processBlockchainLogs(logs)
          },
          onError: (error) => {
            addSyncError({
              type: 'event_processing',
              message: `Blockchain event subscription error: ${error.message}`,
              contractAddress,
              retryable: true,
              context: { error }
            })
          }
        })

        eventUnsubscribers.set(contractAddress, unwatch)

      } catch (error) {
        addSyncError({
          type: 'event_processing',
          message: `Failed to subscribe to contract events: ${error?.message || 'Unknown error'}`,
          contractAddress,
          retryable: true,
          context: { error }
        })
      }
    }

    /**
     * Process blockchain event logs
     */
    const processBlockchainLogs = (logs: any[]) => {
      logs.forEach(log => {
        const eventData = parseEventLog(log)

        const realtimeEvent: RealtimeEvent = {
          id: generateEventId(),
          type: mapEventToRealtimeType(log.eventName),
          contractAddress: log.address,
          blockNumber: log.blockNumber,
          timestamp: Date.now(),
          data: eventData,
          source: 'blockchain'
        }

        processRealtimeEvent(realtimeEvent)

        // Broadcast to other connected users
        broadcastEventUpdate(eventData)
      })
    }

    /**
     * Parse event log data
     */
    const parseEventLog = (log: any) => {
      // Extract relevant data from event log
      return {
        eventName: log.eventName,
        args: log.args,
        blockNumber: log.blockNumber.toString(),
        transactionHash: log.transactionHash,
        address: log.address
      }
    }

    /**
     * Map blockchain event names to real-time event types
     */
    const mapEventToRealtimeType = (eventName: string): string => {
      const eventMapping: Record<string, string> = {
        'Invested': 'INVESTMENT_RECEIVED',
        'PrincipalDeposited': 'REPAYMENT_PROCESSED',
        'InterestDeposited': 'REPAYMENT_PROCESSED',
        'PayoutWithdrawn': 'PAYOUT_WITHDRAWN',
        'StageChanged': 'STAGE_TRANSITION',
        'LoanWithdrawn': 'CONTRACT_STATE_CHANGE'
      }

      return eventMapping[eventName] || 'CONTRACT_STATE_CHANGE'
    }

    // ========================================
    // STATE UPDATE FUNCTIONS
    // ========================================

    /**
     * Update contract state in store
     */
    const updateContractState = (event: RealtimeEvent) => {
      realtimeStore.updateContractState(event.contractAddress, event.data.changes)
    }

    /**
     * Update funding progress
     */
    const updateFundingProgress = (event: RealtimeEvent) => {
      realtimeStore.updateFundingProgress(event.contractAddress, event.data)
    }

    /**
     * Update earnings calculations
     */
    const updateEarningsCalculations = (event: RealtimeEvent) => {
      realtimeStore.updateEarnings(event.contractAddress, event.data)
    }

    /**
     * Update contract stage
     */
    const updateContractStage = (event: RealtimeEvent) => {
      realtimeStore.updateContractStage(event.contractAddress, event.data)
    }

    /**
     * Handle withdrawal events
     */
    const handleWithdrawalEvent = (event: RealtimeEvent) => {
      realtimeStore.updateWithdrawals(event.contractAddress, event.data)
    }

    /**
     * Trigger portfolio refresh for investor
     */
    const triggerPortfolioRefresh = (investorAddress: string) => {
      if (address.value?.toLowerCase() === investorAddress.toLowerCase()) {
        // Refresh current user's portfolio
        realtimeStore.refreshPortfolio()
      }
    }

    /**
     * Refresh withdrawable amounts for contract
     */
    const refreshWithdrawableAmounts = (contractAddress: string) => {
      realtimeStore.refreshWithdrawableAmounts(contractAddress)
    }

    /**
     * Refresh all contract views
     */
    const refreshAllContractViews = (contractAddress: string) => {
      realtimeStore.refreshContract(contractAddress)
    }

    // ========================================
    // SYNC REQUESTS AND RESPONSES
    // ========================================

    /**
     * Request initial sync data
     */
    const requestInitialSync = () => {
      if (wsConnection?.status === 'OPEN') {
        wsConnection.send(JSON.stringify({
          type: 'sync_request',
          data: {
            userAddress: address.value,
            timestamp: Date.now()
          }
        }))
      }
    }

    /**
     * Handle sync response from server
     */
    const handleSyncResponse = (data: any) => {
      // Update store with initial sync data
      realtimeStore.loadSyncData(data)
      updateLastSyncTime()
    }

    /**
     * Handle server errors
     */
    const handleServerError = (data: any) => {
      addSyncError({
        type: 'connection',
        message: `Server error: ${data.message || 'Unknown server error'}`,
        retryable: data.retryable || false,
        context: { data }
      })
    }

    /**
     * Broadcast event update to other users
     */
    const broadcastEventUpdate = (eventData: any) => {
      if (wsConnection?.status === 'OPEN') {
        wsConnection.send(JSON.stringify({
          type: 'event_broadcast',
          data: eventData
        }))
      }
    }

    // ========================================
    // OPTIMISTIC UPDATES
    // ========================================

    /**
     * Apply optimistic update for immediate UI feedback
     */
    const applyOptimisticUpdate = (
      contractAddress: string,
      changes: Record<string, any>,
      expectedBlock?: bigint
    ): string => {
      const updateId = generateEventId()

      const pendingUpdate: PendingUpdate = {
        id: updateId,
        contractAddress,
        type: 'optimistic',
        changes,
        timestamp: Date.now(),
        timeout: 30000, // 30 seconds
        expectedBlock
      }

      // Apply to store immediately
      realtimeStore.applyOptimisticUpdate(contractAddress, pendingUpdate)

      // Set timeout for rollback
      setTimeout(() => {
        realtimeStore.rollbackUpdate(contractAddress, updateId)
      }, pendingUpdate.timeout)

      syncMetrics.value.updatesApplied++
      return updateId
    }

    /**
     * Confirm optimistic update
     */
    const confirmOptimisticUpdate = (contractAddress: string, updateId: string, blockNumber: bigint) => {
      realtimeStore.confirmUpdate(contractAddress, updateId, blockNumber)
    }

    // ========================================
    // METRICS AND MONITORING
    // ========================================

    /**
     * Update sync metrics
     */
    const updateSyncMetrics = (updates: Partial<SyncMetrics>) => {
      Object.assign(syncMetrics.value, updates)

      if (updates.latency) {
        // Update average latency
        const totalLatency = syncMetrics.value.averageLatency * (syncMetrics.value.eventsProcessed - 1) + updates.latency
        syncMetrics.value.averageLatency = totalLatency / syncMetrics.value.eventsProcessed
      }
    }

    /**
     * Get connection quality metrics
     */
    const getConnectionQuality = () => {
      const uptime = connectionStartTime > 0 ? Date.now() - connectionStartTime : 0
      const errorRate = syncErrors.value.length / Math.max(1, syncMetrics.value.eventsProcessed)
      const avgLatency = syncMetrics.value.averageLatency

      let quality = 'excellent'
      if (errorRate > 0.1 || avgLatency > 2000) quality = 'poor'
      else if (errorRate > 0.05 || avgLatency > 1000) quality = 'fair'
      else if (errorRate > 0.01 || avgLatency > 500) quality = 'good'

      return { quality, uptime, errorRate, avgLatency }
    }

    // ========================================
    // ERROR HANDLING
    // ========================================

    /**
     * Add sync error
     */
    const addSyncError = (error: Omit<SyncError, 'id' | 'timestamp'>) => {
      const syncError: SyncError = {
        id: generateEventId(),
        timestamp: Date.now(),
        ...error
      }

      syncErrors.value.push(syncError)

      // Keep only last 100 errors
      if (syncErrors.value.length > 100) {
        syncErrors.value = syncErrors.value.slice(-100)
      }

      // Handle error if needed
      if (error.type === 'connection' && error.retryable) {
        // Connection errors are handled by reconnection logic
        return
      }

      // Log other errors for monitoring
      console.error('Real-time sync error:', syncError)
    }

    /**
     * Clear specific sync error
     */
    const clearSyncError = (type: string, contractAddress?: string) => {
      syncErrors.value = syncErrors.value.filter(error =>
        !(error.type === type && (!contractAddress || error.contractAddress === contractAddress))
      )
    }

    /**
     * Clear all sync errors
     */
    const clearAllSyncErrors = () => {
      syncErrors.value = []
    }

    // ========================================
    // UTILITY FUNCTIONS
    // ========================================

    /**
     * Generate unique event ID
     */
    const generateEventId = (): string => {
      return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * Update last sync time
     */
    const updateLastSyncTime = () => {
      lastSyncTime.value = Date.now()
      syncMetrics.value.lastEventTime = lastSyncTime.value
    }

    /**
     * Check if connection is healthy
     */
    const isConnectionHealthy = (): boolean => {
      return connectionStatus.value === 'connected' &&
             (Date.now() - lastSyncTime.value) < 60000 // Last sync within 1 minute
    }

    // ========================================
    // CLEANUP
    // ========================================

    /**
     * Cleanup resources on unmount
     */
    const cleanup = () => {
      // Clear timers
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }
      if (pingTimer) {
        clearInterval(pingTimer)
      }

      // Unsubscribe from all blockchain events
      eventUnsubscribers.forEach(unsubscribe => unsubscribe())
      eventUnsubscribers.clear()

      // Close WebSocket connection
      if (wsConnection) {
        wsConnection.close()
      }
    }

    // Auto cleanup on unmount
    onUnmounted(cleanup)

    // ========================================
    // RETURN API
    // ========================================

    return {
      // State
      connectionStatus: readonly(connectionStatus),
      lastSyncTime: readonly(lastSyncTime),
      syncErrors: readonly(syncErrors),
      syncMetrics: readonly(syncMetrics),

      // Computed
      isConnected: computed(() => connectionStatus.value === 'connected'),
      isHealthy: computed(() => isConnectionHealthy()),
      connectionQuality: computed(() => getConnectionQuality()),

      // Connection management
      establishConnection,
      disconnect: () => {
        if (wsConnection) {
          wsConnection.close()
        }
      },

      // Event subscription
      subscribeToContractEvents,

      // Optimistic updates
      applyOptimisticUpdate,
      confirmOptimisticUpdate,

      // Error handling
      clearSyncError,
      clearAllSyncErrors,

      // Utilities
      requestInitialSync,
      broadcastEventUpdate
    }
  }
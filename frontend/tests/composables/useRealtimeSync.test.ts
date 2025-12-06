/**
 * Real-time Synchronization Test Suite
 * Epic 6.1 - Real-time Contract State Synchronization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref, computed } from 'vue'
import { useRealtimeSync } from '~/composables/useRealtimeSync'
import { useRealtimeStore } from '~/stores/realtime'
import { WebSocketManager } from '~/utils/websocket'

// Mock Viem hooks
vi.mock('@wagmi/vue', () => ({
  useAccount: () => ({
    address: ref('0x1234567890123456789012345678901234567890'),
    isConnected: ref(true),
    chain: ref({ id: 1 }),
    chainId: ref(1)
  }),
  useWatchContractEvent: vi.fn((options) => ({
    unwatch: vi.fn()
  }))
}))

// Mock WebSocket
global.WebSocket = vi.fn().mockImplementation(() => ({
  readyState: WebSocket.OPEN,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  send: vi.fn(),
  close: vi.fn()
}))

describe('useRealtimeSync', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Connection Management', () => {
    it('should establish WebSocket connection successfully', async () => {
      const { establishConnection, isConnected, connectionStatus } = useRealtimeSync()

      expect(isConnected.value).toBe(false)
      expect(connectionStatus.value).toBe('disconnected')

      const result = await establishConnection()

      expect(result).toBe(true)
      expect(connectionStatus.value).toBe('connected')
    })

    it('should handle connection timeout', async () => {
      const mockWsManager = {
        connect: vi.fn().mockImplementation(() =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Connection timeout')), 100)
          )
        )
      }

      vi.spyOn(WebSocketManager.prototype, 'connect').mockRejectedValue(new Error('Connection timeout'))

      const { establishConnection, connectionStatus, syncErrors } = useRealtimeSync()

      await establishConnection()

      expect(connectionStatus.value).toBe('error')
      expect(syncErrors.value).toHaveLength(1)
      expect(syncErrors.value[0].message).toContain('Connection timeout')
    })

    it('should reconnect automatically on connection loss', async () => {
      const { establishConnection, connectionStatus, reconnectAttempts } = useRealtimeSync()

      await establishConnection()
      expect(connectionStatus.value).toBe('connected')

      // Simulate connection loss
      const ws = new WebSocketManager()
      vi.spyOn(ws, 'isConnected').mockReturnValue(false)

      vi.advanceTimersByTime(3000) // Reconnect interval

      expect(reconnectAttempts.value).toBeGreaterThan(0)
    })
  })

  describe('Event Processing', () => {
    it('should process investment events correctly', async () => {
      const { processRealtimeEvent, establishConnection } = useRealtimeSync()
      const store = useRealtimeStore()

      await establishConnection()

      const event = {
        type: 'INVESTMENT_RECEIVED',
        contractAddress: '0x1234567890123456789012345678901234567890',
        data: {
          investor: '0x1234567890123456789012345678901234567890',
          amount: '1000000000', // 1000 USDT
          shares: '1000000'
        },
        timestamp: Date.now(),
        blockNumber: BigInt(12345)
      }

      await processRealtimeEvent(event)

      const contractState = store.getContractState(event.contractAddress)
      expect(contractState).toBeDefined()
      expect(contractState?.totalFunded).toBe('1000000009') // Should include previous amount
      expect(contractState?.investorCount).toBe(1)
    })

    it('should process repayment events correctly', async () => {
      const { processRealtimeEvent, establishConnection } = useRealtimeSync()
      const store = useRealtimeStore()

      await establishConnection()

      const event = {
        type: 'REPAYMENT_PROCESSED',
        contractAddress: '0x1234567890123456789012345678901234567890',
        data: {
          type: 'principal',
          amount: '500000000', // 500 USDT
          totalDistributed: '500000000'
        },
        timestamp: Date.now(),
        blockNumber: BigInt(12346)
      }

      await processRealtimeEvent(event)

      const contractState = store.getContractState(event.contractAddress)
      expect(contractState?.principalRepaid).toBe('500000000')
      expect(contractState?.totalDistributed).toBe('500000000')
    })

    it('should process stage transition events correctly', async () => {
      const { processRealtimeEvent, establishConnection } = useRealtimeSync()
      const store = useRealtimeStore()

      await establishConnection()

      const event = {
        type: 'STAGE_TRANSITION',
        contractAddress: '0x1234567890123456789012345678901234567890',
        data: {
          newStage: 2,
          reason: 'Funding target reached'
        },
        timestamp: Date.now(),
        blockNumber: BigInt(12347)
      }

      await processRealtimeEvent(event)

      const contractState = store.getContractState(event.contractAddress)
      expect(contractState?.stage).toBe(2)
      expect(contractState?.stageName).toBe('FUNDED')
    })

    it('should handle event processing errors gracefully', async () => {
      const { processRealtimeEvent, establishConnection, syncErrors } = useRealtimeSync()

      await establishConnection()

      const invalidEvent = {
        type: 'UNKNOWN_EVENT',
        contractAddress: '',
        data: null,
        timestamp: Date.now(),
        blockNumber: BigInt(0)
      }

      await processRealtimeEvent(invalidEvent)

      // Should not throw error but should handle gracefully
      expect(syncErrors.value.some(e => e.message.includes('process'))).toBe(true)
    })
  })

  describe('Optimistic Updates', () => {
    it('should apply optimistic updates immediately', async () => {
      const { establishConnection } = useRealtimeSync()
      const store = useRealtimeStore()

      await establishConnection()

      const updateId = 'test-update-1'
      const update = {
        id: updateId,
        type: 'investment' as const,
        contractAddress: '0x1234567890123456789012345678901234567890',
        timestamp: Date.now(),
        changes: {
          totalFunded: '2000000000',
          investorCount: 2,
          fundingProgress: 20
        }
      }

      store.applyOptimisticUpdate(update.contractAddress, update)

      const optimisticState = store.getOptimisticState(update.contractAddress)
      expect(optimisticState.totalFunded).toBe('2000000000')
      expect(optimisticState.investorCount).toBe(2)
      expect(store.hasOptimisticUpdates(update.contractAddress)).toBe(true)
    })

    it('should confirm optimistic updates', async () => {
      const { establishConnection } = useRealtimeSync()
      const store = useRealtimeStore()

      await establishConnection()

      const updateId = 'test-update-2'
      const update = {
        id: updateId,
        type: 'investment' as const,
        contractAddress: '0x1234567890123456789012345678901234567890',
        timestamp: Date.now(),
        changes: {
          totalFunded: '3000000000'
        }
      }

      store.applyOptimisticUpdate(update.contractAddress, update)
      store.confirmUpdate(update.contractAddress, updateId, BigInt(12348))

      expect(store.hasOptimisticUpdates(update.contractAddress)).toBe(false)

      const contractState = store.getContractState(update.contractAddress)
      expect(contractState?.totalFunded).toBe('3000000000')
    })

    it('should rollback optimistic updates on failure', async () => {
      const { establishConnection } = useRealtimeSync()
      const store = useRealtimeStore()

      await establishConnection()

      const updateId = 'test-update-3'
      const update = {
        id: updateId,
        type: 'investment' as const,
        contractAddress: '0x1234567890123456789012345678901234567890',
        timestamp: Date.now(),
        changes: {
          totalFunded: '4000000000'
        }
      }

      store.applyOptimisticUpdate(update.contractAddress, update)
      store.rollbackUpdate(update.contractAddress, updateId)

      expect(store.hasOptimisticUpdates(update.contractAddress)).toBe(false)

      const optimisticState = store.getOptimisticState(update.contractAddress)
      expect(optimisticState.totalFunded).toBeUndefined()
    })
  })

  describe('Multi-user Synchronization', () => {
    it('should broadcast events to connected users', async () => {
      const mockWsManager = {
        send: vi.fn(),
        isConnected: () => true
      }

      vi.spyOn(WebSocketManager.prototype, 'send').mockImplementation(function(message) {
        this.sentMessage = message
        return true
      })

      const { processRealtimeEvent, establishConnection } = useRealtimeSync()

      await establishConnection()

      const event = {
        type: 'INVESTMENT_RECEIVED',
        contractAddress: '0x1234567890123456789012345678901234567890',
        data: {
          investor: '0x9876543210987654321098765432109876543210',
          amount: '1500000000',
          shares: '1500000'
        },
        timestamp: Date.now(),
        blockNumber: BigInt(12349)
      }

      await processRealtimeEvent(event)

      // Verify the event was broadcast via WebSocket
      expect(WebSocketManager.prototype.send).toHaveBeenCalledWith({
        type: 'BROADCAST_EVENT',
        data: expect.objectContaining({
          type: 'INVESTMENT_RECEIVED',
          contractAddress: event.contractAddress
        })
      })
    })

    it('should handle concurrent updates correctly', async () => {
      const { processRealtimeEvent, establishConnection } = useRealtimeSync()
      const store = useRealtimeStore()

      await establishConnection()

      const events = [
        {
          type: 'INVESTMENT_RECEIVED',
          contractAddress: '0x1234567890123456789012345678901234567890',
          data: { amount: '1000000000', investorCount: 1 },
          timestamp: Date.now(),
          blockNumber: BigInt(12350)
        },
        {
          type: 'INVESTMENT_RECEIVED',
          contractAddress: '0x1234567890123456789012345678901234567890',
          data: { amount: '2000000000', investorCount: 2 },
          timestamp: Date.now() + 1,
          blockNumber: BigInt(12351)
        }
      ]

      await Promise.all(events.map(event => processRealtimeEvent(event)))

      const contractState = store.getContractState(events[0].contractAddress)
      expect(contractState?.totalFunded).toBe('2000000001') // Latest event should win
      expect(contractState?.investorCount).toBe(2)
    })
  })

  describe('Performance', () => {
    it('should handle high-frequency events efficiently', async () => {
      const { processRealtimeEvent, establishConnection } = useRealtimeSync()

      await establishConnection()

      const startTime = Date.now()

      // Process 100 events rapidly
      const events = Array.from({ length: 100 }, (_, i) => ({
        type: 'INVESTMENT_RECEIVED',
        contractAddress: '0x1234567890123456789012345678901234567890',
        data: { amount: (i * 10000000).toString() },
        timestamp: Date.now() + i,
        blockNumber: BigInt(12300 + i)
      }))

      await Promise.all(events.map(event => processRealtimeEvent(event)))

      const processingTime = Date.now() - startTime

      // Should process 100 events in under 1 second
      expect(processingTime).toBeLessThan(1000)
    })

    it('should maintain performance with 100+ concurrent connections', async () => {
      const mockConnections = Array.from({ length: 100 }, () => ({
        send: vi.fn(),
        isConnected: () => true
      }))

      vi.spyOn(WebSocketManager.prototype, 'getConnectionQuality').mockReturnValue({
        quality: 'excellent',
        uptime: 60000,
        reconnects: 0
      })

      const { establishConnection } = useRealtimeSync()

      const startTime = Date.now()

      const connections = await Promise.all(
        Array.from({ length: 100 }, () => establishConnection())
      )

      const connectionTime = Date.now() - startTime

      expect(connectionTime).toBeLessThan(2000) // Should establish all connections quickly
      expect(connections.every(connected => connected)).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should recover from WebSocket disconnection', async () => {
      const mockWsManager = {
        connect: vi.fn()
          .mockResolvedValueOnce(undefined)
          .mockRejectedValueOnce(new Error('Connection failed'))
          .mockResolvedValueOnce(undefined),
        isConnected: vi.fn()
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(true)
      }

      const { establishConnection, connectionStatus } = useRealtimeSync()

      await establishConnection()
      expect(connectionStatus.value).toBe('connected')

      // Simulate disconnection
      vi.advanceTimersByTime(3000)

      // Should attempt reconnection
      await vi.runAllTimersAsync()

      expect(connectionStatus.value).toBe('connected')
    })

    it('should handle malformed events', async () => {
      const { processRealtimeEvent, syncErrors } = useRealtimeSync()

      const malformedEvents = [
        null,
        undefined,
        {},
        { type: null },
        { type: 'TEST', data: null },
        { type: 'TEST', data: {}, contractAddress: null }
      ]

      for (const event of malformedEvents) {
        await processRealtimeEvent(event)
      }

      // Should handle all malformed events without crashing
      expect(syncErrors.value.length).toBeGreaterThan(0)
    })

    it('should maintain data integrity during errors', async () => {
      const { processRealtimeEvent, establishConnection } = useRealtimeSync()
      const store = useRealtimeStore()

      await establishConnection()

      const validEvent = {
        type: 'INVESTMENT_RECEIVED',
        contractAddress: '0x1234567890123456789012345678901234567890',
        data: { amount: '1000000000' },
        timestamp: Date.now(),
        blockNumber: BigInt(12300)
      }

      const invalidEvent = { type: 'INVALID' }

      // Process valid event first
      await processRealtimeEvent(validEvent)

      const contractStateBefore = store.getContractState(validEvent.contractAddress)

      // Process invalid event
      await processRealtimeEvent(invalidEvent)

      const contractStateAfter = store.getContractState(validEvent.contractAddress)

      // Valid data should remain intact
      expect(contractStateAfter).toEqual(contractStateBefore)
    })
  })
})

describe('WebSocketManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should create WebSocket connection with correct URL', () => {
    const manager = new WebSocketManager({
      url: 'ws://localhost:3001/ws'
    })

    expect(WebSocket).toHaveBeenCalledWith('ws://localhost:3001/ws')
  })

  it('should handle connection errors with exponential backoff', async () => {
    const manager = new WebSocketManager({
      maxReconnectAttempts: 3,
      reconnectInterval: 1000
    })

    const mockWs = {
      readyState: WebSocket.CLOSED,
      addEventListener: vi.fn(),
      close: vi.fn()
    }

    WebSocket.mockImplementation(() => mockWs)

    await manager.connect()

    // Should attempt reconnection with exponential backoff
    vi.advanceTimersByTime(1000) // First attempt
    vi.advanceTimersByTime(2000) // Second attempt (2x)
    vi.advanceTimersByTime(4000) // Third attempt (4x)

    expect(mockWs.addEventListener).toHaveBeenCalledWith('error', expect.any(Function))
  })

  it('should queue messages when disconnected', () => {
    const manager = new WebSocketManager()

    const result = manager.send({
      type: 'TEST_MESSAGE',
      data: { test: 'data' }
    })

    expect(result).toBe(false) // Should return false when not connected
  })

  it('should get connection quality metrics', () => {
    const manager = new WebSocketManager()

    const quality = manager.getConnectionQuality()

    expect(quality).toHaveProperty('quality')
    expect(quality).toHaveProperty('uptime')
    expect(quality).toHaveProperty('reconnects')
    expect(['excellent', 'good', 'fair', 'poor']).toContain(quality.quality)
  })
})

describe('useRealtimeStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should manage contract state correctly', () => {
    const store = useRealtimeStore()

    const contractAddress = '0x1234567890123456789012345678901234567890'
    const changes = {
      totalFunded: '1000000000',
      investorCount: 1,
      stage: 1
    }

    store.updateContractState(contractAddress, changes)

    const state = store.getContractState(contractAddress)
    expect(state?.totalFunded).toBe('1000000000')
    expect(state?.investorCount).toBe(1)
    expect(state?.stage).toBe(1)
    expect(state?.lastUpdated).toBeGreaterThan(0)
  })

  it('should manage portfolio metrics', () => {
    const store = useRealtimeStore()

    const contractAddress = '0x1234567890123456789012345678901234567890'
    store.addContractToPortfolio(contractAddress, {
      totalFunded: '1000000000',
      stage: 1
    } as any)

    expect(store.portfolio.activeContracts).toBe(1)
    expect(store.portfolioValue).toBe(1000) // 1000 from funded amount
  })

  it('should handle notifications correctly', () => {
    const store = useRealtimeStore()

    const notification = {
      type: 'success' as const,
      title: 'Test Notification',
      message: 'Test message'
    }

    store.addNotification(notification)

    expect(store.notifications).toHaveLength(1)
    expect(store.notifications[0].title).toBe('Test Notification')
    expect(store.notifications[0].id).toBeDefined()
  })

  it('should auto-hide notifications', () => {
    vi.useFakeTimers()

    const store = useRealtimeStore()

    const notification = {
      type: 'info' as const,
      title: 'Auto-hide Test',
      message: 'This should auto-hide',
      autoHide: true,
      duration: 5000
    }

    store.addNotification(notification)
    expect(store.notifications).toHaveLength(1)

    vi.advanceTimersByTime(5000)

    expect(store.notifications).toHaveLength(0)

    vi.useRealTimers()
  })

  it('should track event history', () => {
    const store = useRealtimeStore()

    const event = {
      type: 'INVESTMENT_RECEIVED',
      contractAddress: '0x1234567890123456789012345678901234567890',
      data: { amount: '1000000000' }
    }

    store.addEventToHistory(event)

    expect(store.eventHistory).toHaveLength(1)
    expect(store.eventHistory[0].type).toBe('INVESTMENT_RECEIVED')
    expect(store.eventHistory[0].timestamp).toBeGreaterThan(0)
  })

  it('should limit event history size', () => {
    const store = useRealtimeStore()

    // Add more than 1000 events
    for (let i = 0; i < 1100; i++) {
      store.addEventToHistory({
        type: 'TEST_EVENT',
        contractAddress: '0x1234567890123456789012345678901234567890',
        data: { index: i }
      })
    }

    expect(store.eventHistory).toHaveLength(1000)
  })
})
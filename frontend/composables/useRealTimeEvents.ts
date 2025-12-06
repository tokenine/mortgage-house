/**
 * Real-time Events Composable
 * Handles real-time event listening for mortgage contract events
 */

import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useWatchContractEvent, useWaitForTransactionReceipt } from '@wagmi/vue'
import { MORTGAGE_CONTRACT_ABI } from '~/utils/contract/constants'
import { useMortgageContract } from './useMortgageContract'

// Event types
export interface MortgageEvent {
  type: 'Invested' | 'StageChanged' | 'Withdrawal' | 'LoanWithdrawal' | 'Deposit' | 'Transfer'
  timestamp: number
  data: any
  txHash?: string
}

export interface RealTimeEventOptions {
  autoConnect?: boolean
  pollingInterval?: number
  maxRetries?: number
  enableWebSocket?: boolean
}

export function useRealTimeEvents(options: RealTimeEventOptions = {}) {
  const {
    autoConnect = true,
    pollingInterval = 5000, // 5 seconds
    maxRetries = 3,
    enableWebSocket = false
  } = options

  // Composables
  const { contractAddress, isConnected, refreshData } = useMortgageContract()

  // State
  const isConnectedRealtime = ref(false)
  const isConnecting = ref(false)
  const lastEvent = ref<MortgageEvent | null>(null)
  const eventHistory = ref<MortgageEvent[]>([])
  const retryCount = ref(0)
  const lastPollTime = ref(0)
  const pollingIntervalId = ref<NodeJS.Timeout | null>(null)

  // Computed
  const hasEvents = computed(() => eventHistory.value.length > 0)
  const recentEvents = computed(() =>
    eventHistory.value.slice().sort((a, b) => b.timestamp - a.timestamp).slice(0, 50)
  )

  // Event handlers
  const handleInvestedEvent = (data: any) => {
    const event: MortgageEvent = {
      type: 'Invested',
      timestamp: Date.now(),
      data: {
        investor: data.args.investor,
        amount: data.args.amount,
        shares: data.args.shares,
        totalFunded: data.args.totalFunded
      },
      txHash: data.transactionHash
    }

    addEvent(event)

    // Trigger optimistic updates
    refreshData()
  }

  const handleStageChangedEvent = (data: any) => {
    const event: MortgageEvent = {
      type: 'StageChanged',
      timestamp: Date.now(),
      data: {
        oldStage: data.args.oldStage,
        newStage: data.args.newStage,
        actor: data.args.actor
      },
      txHash: data.transactionHash
    }

    addEvent(event)
    refreshData()
  }

  const handleWithdrawalEvent = (data: any) => {
    const event: MortgageEvent = {
      type: 'Withdrawal',
      timestamp: Date.now(),
      data: {
        investor: data.args.investor,
        principal: data.args.principal,
        interest: data.args.interest,
        totalAmount: data.args.totalAmount
      },
      txHash: data.transactionHash
    }

    addEvent(event)
    refreshData()
  }

  const handleLoanWithdrawalEvent = (data: any) => {
    const event: MortgageEvent = {
      type: 'LoanWithdrawal',
      timestamp: Date.now(),
      data: {
        amount: data.args.amount,
        withdrawnBy: data.args.operator
      },
      txHash: data.transactionHash
    }

    addEvent(event)
    refreshData()
  }

  const handleDepositEvent = (data: any) => {
    const event: MortgageEvent = {
      type: 'Deposit',
      timestamp: Date.now(),
      data: {
        type: data.args.isPrincipal ? 'Principal' : 'Interest',
        amount: data.args.amount,
        depositedBy: data.args.operator
      },
      txHash: data.transactionHash
    }

    addEvent(event)
    refreshData()
  }

  const handleTransferEvent = (data: any) => {
    const event: MortgageEvent = {
      type: 'Transfer',
      timestamp: Date.now(),
      data: {
        from: data.args.from,
        to: data.args.to,
        shares: data.args.shares
      },
      txHash: data.transactionHash
    }

    addEvent(event)
    refreshData()
  }

  // Event management
  const addEvent = (event: MortgageEvent) => {
    eventHistory.value.unshift(event)
    lastEvent.value = event

    // Keep only last 1000 events in memory
    if (eventHistory.value.length > 1000) {
      eventHistory.value = eventHistory.value.slice(0, 1000)
    }
  }

  // Setup contract event listeners
  const setupContractListeners = () => {
    if (!isConnected.value || !contractAddress.value) {
      return false
    }

    try {
      // Listen for investment events
      useWatchContractEvent({
        address: contractAddress.value,
        abi: MORTGAGE_CONTRACT_ABI,
        eventName: 'Invested',
        listener: handleInvestedEvent
      })

      // Listen for stage change events
      useWatchContractEvent({
        address: contractAddress.value,
        abi: MORTGAGE_CONTRACT_ABI,
        eventName: 'StageChanged',
        listener: handleStageChangedEvent
      })

      // Listen for withdrawal events
      useWatchContractEvent({
        address: contractAddress.value,
        abi: MORTGAGE_CONTRACT_ABI,
        eventName: 'WithdrawalExecuted',
        listener: handleWithdrawalEvent
      })

      // Listen for loan withdrawal events
      useWatchContractEvent({
        address: contractAddress.value,
        abi: MORTGAGE_CONTRACT_ABI,
        eventName: 'LoanWithdrawal',
        listener: handleLoanWithdrawalEvent
      })

      // Listen for deposit events
      useWatchContractEvent({
        address: contractAddress.value,
        abi: MORTGAGE_CONTRACT_ABI,
        eventName: 'PrincipalDeposited',
        listener: handleDepositEvent
      })

      useWatchContractEvent({
        address: contractAddress.value,
        abi: MORTGAGE_CONTRACT_ABI,
        eventName: 'InterestDeposited',
        listener: handleDepositEvent
      })

      // Listen for transfer events
      useWatchContractEvent({
        address: contractAddress.value,
        abi: MORTGAGE_CONTRACT_ABI,
        eventName: 'SharesTransferred',
        listener: handleTransferEvent
      })

      isConnectedRealtime.value = true
      isConnecting.value = false
      retryCount.value = 0

      return true
    } catch (error) {
      console.error('Failed to setup contract event listeners:', error)
      isConnecting.value = false
      return false
    }
  }

  // Fallback polling mechanism
  const startPolling = () => {
    if (pollingIntervalId.value) {
      clearInterval(pollingIntervalId.value)
    }

    pollingIntervalId.value = setInterval(async () => {
      if (!isConnected.value) return

      const now = Date.now()

      // Only poll if it's been longer than the interval since last poll
      if (now - lastPollTime.value >= pollingInterval) {
        lastPollTime.value = now

        try {
          await refreshData()
        } catch (error) {
          console.error('Polling error:', error)
          retryCount.value++

          if (retryCount.value >= maxRetries) {
            stopPolling()
            isConnectedRealtime.value = false
          }
        }
      }
    }, pollingInterval)
  }

  const stopPolling = () => {
    if (pollingIntervalId.value) {
      clearInterval(pollingIntervalId.value)
      pollingIntervalId.value = null
    }
  }

  // WebSocket connection (placeholder for future WebSocket implementation)
  const connectWebSocket = async () => {
    if (!enableWebSocket) {
      return false
    }

    // Future WebSocket implementation would go here
    console.log('WebSocket connection not yet implemented')
    return false
  }

  const disconnectWebSocket = () => {
    // Future WebSocket disconnect logic
    console.log('WebSocket disconnect not yet implemented')
  }

  // Main connection method
  const connect = async () => {
    if (isConnecting.value || isConnectedRealtime.value) {
      return
    }

    isConnecting.value = true

    try {
      // Try to setup contract event listeners first
      const listenersSetup = setupContractListeners()

      if (listenersSetup) {
        // Start polling as a fallback mechanism
        startPolling()

        // Try WebSocket if enabled
        if (enableWebSocket) {
          await connectWebSocket()
        }

        return true
      } else {
        // Fallback to polling only
        startPolling()
        return false
      }
    } catch (error) {
      console.error('Failed to connect to real-time events:', error)
      isConnecting.value = false

      // Try to start polling as a last resort
      startPolling()
      return false
    }
  }

  const disconnect = () => {
    stopPolling()
    disconnectWebSocket()
    isConnectedRealtime.value = false
    isConnecting.value = false
  }

  // Event filtering
  const getEventsByType = (type: MortgageEvent['type']) => {
    return eventHistory.value.filter(event => event.type === type)
  }

  const getRecentInvestmentEvents = (limit = 10) => {
    return getEventsByType('Invested')
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  const getEventsForAddress = (address: string) => {
    return eventHistory.value.filter(event => {
      switch (event.type) {
        case 'Invested':
          return event.data.investor.toLowerCase() === address.toLowerCase()
        case 'Withdrawal':
          return event.data.investor.toLowerCase() === address.toLowerCase()
        case 'Transfer':
          return event.data.from.toLowerCase() === address.toLowerCase() ||
                 event.data.to.toLowerCase() === address.toLowerCase()
        default:
          return false
      }
    })
  }

  // Event subscription
  const subscribeToEvents = (callback: (event: MortgageEvent) => void) => {
    const handler = (event: MortgageEvent) => {
      callback(event)
    }

    // This would integrate with an event emitter system
    // For now, we'll store the handler for future implementation
    console.log('Event subscription handler registered')

    return () => {
      console.log('Event subscription handler removed')
    }
  }

  // Lifecycle
  onMounted(() => {
    if (autoConnect && isConnected.value) {
      connect()
    }
  })

  onUnmounted(() => {
    disconnect()
  })

  // Auto-reconnect when connection status changes
  const unwatchConnection = watch(isConnected, (newValue) => {
    if (newValue && autoConnect && !isConnectedRealtime.value) {
      connect()
    } else if (!newValue) {
      disconnect()
    }
  })

  return {
    // Connection state
    isConnectedRealtime: computed(() => isConnectedRealtime.value),
    isConnecting: computed(() => isConnecting.value),
    retryCount: computed(() => retryCount.value),

    // Event data
    lastEvent: computed(() => lastEvent.value),
    eventHistory: computed(() => eventHistory.value),
    hasEvents,
    recentEvents,

    // Methods
    connect,
    disconnect,
    refreshData,

    // Event accessors
    getEventsByType,
    getRecentInvestmentEvents,
    getEventsForAddress,
    subscribeToEvents,

    // Utility methods
    clearHistory: () => {
      eventHistory.value = []
      lastEvent.value = null
    }
  }
}
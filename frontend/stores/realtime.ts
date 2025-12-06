/**
 * Real-time State Store
 * Epic 6.1 - Real-time Contract State Synchronization
 */

import { defineStore } from 'pinia'
import type { PendingUpdate, ConfirmedUpdate } from '~/composables/useRealtimeSync'
import { getStageName } from '~/utils/stages'

export interface ContractState {
  stage: number
  stageName: string
  totalFunded: string
  totalInvestors: number
  investorCount: number
  fundingProgress: number
  principalRepaid: string
  interestPaid: string
  totalDistributed: string
  withdrawablePrincipal: string
  withdrawableInterest: string
  lastUpdated: number
  lastBlockNumber: string
  isUpdating: boolean
  hasPendingUpdates: boolean
}

export interface PortfolioState {
  totalInvested: string
  totalEarnings: string
  totalValue: string
  activeContracts: number
  contracts: Map<string, ContractState>
  lastRefreshed: number
  isRefreshing: boolean
}

export interface RealtimeNotification {
  id: string
  type: 'success' | 'info' | 'warning' | 'error'
  title: string
  message: string
  contractAddress?: string
  timestamp: number
  autoHide?: boolean
  duration?: number
  actions?: Array<{
    label: string
    action: () => void
    variant: 'primary' | 'secondary'
  }>
}

export const useRealtimeStore = defineStore('realtime', {
  state: () => ({
    // Optimistic update management
    pendingUpdates: new Map<string, PendingUpdate>(),
    confirmedUpdates: new Map<string, ConfirmedUpdate>(),
    optimisticState: new Map<string, Partial<ContractState>>(),

    // Block tracking
    lastBlockNumber: 0n,

    // Contract state cache
    contractStates: new Map<string, ContractState>(),

    // Portfolio state
    portfolio: {
      totalInvested: '0',
      totalEarnings: '0',
      totalValue: '0',
      activeContracts: 0,
      contracts: new Map<string, ContractState>(),
      lastRefreshed: 0,
      isRefreshing: false
    } as PortfolioState,

    // Real-time notifications
    notifications: [] as RealtimeNotification[],

    // Sync state
    syncInProgress: false,
    lastSyncTime: 0,

    // Event history
    eventHistory: [] as Array<{
      id: string
      type: string
      contractAddress: string
      timestamp: number
      data: any
    }>
  }),

  getters: {
    /**
     * Get contract state by address
     */
    getContractState: (state) => {
      return (contractAddress: string): ContractState | undefined => {
        return state.contractStates.get(contractAddress.toLowerCase())
      }
    },

    /**
     * Get all contracts with pending updates
     */
    contractsWithPendingUpdates: (state) => {
      return Array.from(state.pendingUpdates.keys()).map(address => ({
        address,
        update: state.pendingUpdates.get(address)
      }))
    },

    /**
     * Get portfolio value
     */
    portfolioValue: (state) => {
      return parseFloat(state.portfolio.totalInvested) + parseFloat(state.portfolio.totalEarnings)
    },

    /**
     * Get unread notifications
     */
    unreadNotifications: (state) => {
      return state.notifications.filter(notification => !notification.autoHide)
    },

    /**
     * Get recent events for a contract
     */
    getContractEvents: (state) => {
      return (contractAddress: string, limit = 10) => {
        return state.eventHistory
          .filter(event => event.contractAddress.toLowerCase() === contractAddress.toLowerCase())
          .slice(-limit)
          .reverse()
      }
    },

    /**
     * Get optimistic state for a contract
     */
    getOptimisticState: (state) => {
      return (contractAddress: string): Partial<ContractState> => {
        const baseState = state.contractStates.get(contractAddress.toLowerCase()) || {}
        const optimisticChanges = state.optimisticState.get(contractAddress.toLowerCase()) || {}

        return { ...baseState, ...optimisticChanges }
      }
    },

    /**
     * Check if contract has optimistic updates
     */
    hasOptimisticUpdates: (state) => {
      return (contractAddress: string): boolean => {
        return state.pendingUpdates.has(contractAddress.toLowerCase())
      }
    }
  },

  actions: {
    /**
     * Apply optimistic update to contract state
     */
    applyOptimisticUpdate(contractAddress: string, update: PendingUpdate) {
      const address = contractAddress.toLowerCase()

      // Apply changes to optimistic state
      const currentState = this.optimisticState.get(address) || {}
      const newState = { ...currentState, ...update.changes, hasPendingUpdates: true, isUpdating: true }

      this.optimisticState.set(address, newState)
      this.pendingUpdates.set(address, update)

      console.log(`Applied optimistic update for contract ${address}:`, update.changes)
    },

    /**
     * Confirm optimistic update
     */
    confirmUpdate(contractAddress: string, updateId: string, blockNumber: bigint) {
      const address = contractAddress.toLowerCase()
      const pendingUpdate = this.pendingUpdates.get(address)

      if (pendingUpdate && pendingUpdate.id === updateId) {
        // Move from pending to confirmed
        this.confirmedUpdates.set(address, {
          ...pendingUpdate,
          confirmedAt: blockNumber,
          timestamp: Date.now()
        })

        // Apply confirmed changes to actual state
        this.updateContractState(address, pendingUpdate.changes, blockNumber.toString())

        // Clear optimistic state and pending update
        this.optimisticState.delete(address)
        this.pendingUpdates.delete(address)

        // Update last block number
        this.lastBlockNumber = blockNumber

        console.log(`Confirmed optimistic update for contract ${address} at block ${blockNumber}`)
      }
    },

    /**
     * Rollback optimistic update
     */
    rollbackUpdate(contractAddress: string, updateId: string) {
      const address = contractAddress.toLowerCase()
      const pendingUpdate = this.pendingUpdates.get(address)

      if (pendingUpdate && pendingUpdate.id === updateId) {
        // Revert optimistic changes
        this.optimisticState.delete(address)
        this.pendingUpdates.delete(address)

        // Add notification about rollback
        this.addNotification({
          type: 'warning',
          title: 'Transaction Failed',
          message: 'The transaction could not be confirmed and has been rolled back.',
          contractAddress: address
        })

        console.warn(`Rolled back optimistic update for contract ${address}`)
      }
    },

    /**
     * Update contract state
     */
    updateContractState(contractAddress: string, changes: Partial<ContractState>, blockNumber?: string) {
      const address = contractAddress.toLowerCase()
      const currentState = this.contractStates.get(address) || {
        stage: 0,
        stageName: 'NOT_STARTED',
        totalFunded: '0',
        totalInvestors: 0,
        investorCount: 0,
        fundingProgress: 0,
        principalRepaid: '0',
        interestPaid: '0',
        totalDistributed: '0',
        withdrawablePrincipal: '0',
        withdrawableInterest: '0',
        lastUpdated: 0,
        lastBlockNumber: '0',
        isUpdating: false,
        hasPendingUpdates: false
      }

      // Update state with changes
      const updatedState: ContractState = {
        ...currentState,
        ...changes,
        lastUpdated: Date.now(),
        lastBlockNumber: blockNumber || currentState.lastBlockNumber,
        stageName: changes.stage !== undefined ? getStageName(changes.stage) : currentState.stageName
      }

      this.contractStates.set(address, updatedState)

      // Update portfolio if this is a tracked contract
      if (this.portfolio.contracts.has(address)) {
        this.portfolio.contracts.set(address, updatedState)
        this.updatePortfolioMetrics()
      }

      console.log(`Updated contract state for ${address}:`, changes)
    },

    /**
     * Update funding progress
     */
    updateFundingProgress(contractAddress: string, data: any) {
      const address = contractAddress.toLowerCase()

      this.updateContractState(address, {
        totalFunded: data.totalFunded || data.amount || '0',
        totalInvestors: data.investorCount || data.totalInvestors || 0,
        investorCount: data.investorCount || 0,
        fundingProgress: data.fundingProgress || 0
      })

      // Add notification
      this.addNotification({
        type: 'success',
        title: 'Investment Received',
        message: `New investment of ${data.amount || '0'} USDT received`,
        contractAddress: address,
        autoHide: true,
        duration: 5000
      })

      // Add to event history
      this.addEventToHistory({
        type: 'INVESTMENT_RECEIVED',
        contractAddress: address,
        data
      })
    },

    /**
     * Update earnings for a contract
     */
    updateEarnings(contractAddress: string, data: any) {
      const address = contractAddress.toLowerCase()

      this.updateContractState(address, {
        principalRepaid: data.principalRepaid || '0',
        interestPaid: data.interestPaid || '0',
        totalDistributed: data.totalDistributed || '0'
      })

      // Add notification
      this.addNotification({
        type: 'info',
        title: 'Earnings Update',
        message: `Principal repayment: ${data.amount || '0'} USDT processed`,
        contractAddress: address,
        autoHide: true,
        duration: 5000
      })

      // Add to event history
      this.addEventToHistory({
        type: 'REPAYMENT_PROCESSED',
        contractAddress: address,
        data
      })
    },

    /**
     * Update contract stage
     */
    updateContractStage(contractAddress: string, data: any) {
      const address = contractAddress.toLowerCase()

      this.updateContractState(address, {
        stage: data.newStage,
        stageName: getStageName(data.newStage)
      })

      // Add notification
      this.addNotification({
        type: 'info',
        title: 'Stage Changed',
        message: `Contract moved to ${getStageName(data.newStage)} stage`,
        contractAddress: address,
        autoHide: true,
        duration: 5000
      })

      // Add to event history
      this.addEventToHistory({
        type: 'STAGE_TRANSITION',
        contractAddress: address,
        data
      })
    },

    /**
     * Update withdrawal information
     */
    updateWithdrawals(contractAddress: string, data: any) {
      const address = contractAddress.toLowerCase()

      this.updateContractState(address, {
        withdrawablePrincipal: data.withdrawablePrincipal || '0',
        withdrawableInterest: data.withdrawableInterest || '0'
      })

      // Add notification
      this.addNotification({
        type: 'success',
        title: 'Withdrawal Processed',
        message: `Withdrawal of ${data.amount || '0'} USDT completed`,
        contractAddress: address,
        autoHide: true,
        duration: 5000
      })

      // Add to event history
      this.addEventToHistory({
        type: 'PAYOUT_WITHDRAWN',
        contractAddress: address,
        data
      })
    },

    /**
     * Refresh withdrawable amounts for a contract
     */
    refreshWithdrawableAmounts(contractAddress: string) {
      const address = contractAddress.toLowerCase()
      const currentState = this.contractStates.get(address)

      if (currentState) {
        // Mark as updating to show loading state
        this.updateContractState(address, { isUpdating: true })

        // In a full implementation, this would fetch fresh data from the contract
        // For now, just clear the updating flag after a short delay
        setTimeout(() => {
          this.updateContractState(address, { isUpdating: false })
        }, 1000)
      }
    },

    /**
     * Refresh entire contract
     */
    refreshContract(contractAddress: string) {
      const address = contractAddress.toLowerCase()

      // Mark as updating
      const currentState = this.contractStates.get(address)
      if (currentState) {
        this.updateContractState(address, { isUpdating: true })
      }

      // In a full implementation, this would fetch all fresh data from the contract
      setTimeout(() => {
        if (currentState) {
          this.updateContractState(address, { isUpdating: false })
        }
      }, 1000)
    },

    /**
     * Refresh portfolio data
     */
    refreshPortfolio() {
      this.portfolio.isRefreshing = true

      // In a full implementation, this would fetch fresh portfolio data
      setTimeout(() => {
        this.updatePortfolioMetrics()
        this.portfolio.isRefreshing = false
        this.portfolio.lastRefreshed = Date.now()
      }, 1000)
    },

    /**
     * Update portfolio metrics
     */
    updatePortfolioMetrics() {
      let totalInvested = 0
      let totalEarnings = 0
      let activeContracts = 0

      this.portfolio.contracts.forEach((contract) => {
        totalInvested += parseFloat(contract.totalFunded)
        totalEarnings += parseFloat(contract.totalDistributed)
        if (contract.stage >= 1 && contract.stage <= 3) { // FUNDING to ACTIVE
          activeContracts++
        }
      })

      this.portfolio.totalInvested = totalInvested.toString()
      this.portfolio.totalEarnings = totalEarnings.toString()
      this.portfolio.totalValue = (totalInvested + totalEarnings).toString()
      this.portfolio.activeContracts = activeContracts
    },

    /**
     * Load initial sync data
     */
    loadSyncData(data: any) {
      if (data.contracts) {
        data.contracts.forEach((contractData: any) => {
          this.updateContractState(contractData.address, contractData.state, contractData.blockNumber)
        })
      }

      if (data.portfolio) {
        this.portfolio = { ...this.portfolio, ...data.portfolio }
      }

      this.lastSyncTime = Date.now()
      this.syncInProgress = false

      console.log('Loaded sync data:', data)
    },

    /**
     * Add notification
     */
    addNotification(notification: Omit<RealtimeNotification, 'id' | 'timestamp'>) {
      const fullNotification: RealtimeNotification = {
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        ...notification
      }

      this.notifications.unshift(fullNotification)

      // Keep only last 100 notifications
      if (this.notifications.length > 100) {
        this.notifications = this.notifications.slice(0, 100)
      }

      // Auto-hide if specified
      if (notification.autoHide) {
        setTimeout(() => {
          this.removeNotification(fullNotification.id)
        }, notification.duration || 5000)
      }
    },

    /**
     * Remove notification
     */
    removeNotification(notificationId: string) {
      const index = this.notifications.findIndex(n => n.id === notificationId)
      if (index > -1) {
        this.notifications.splice(index, 1)
      }
    },

    /**
     * Clear all notifications
     */
    clearNotifications() {
      this.notifications = []
    },

    /**
     * Add event to history
     */
    addEventToHistory(event: {
      type: string
      contractAddress: string
      data: any
    }) {
      const historyEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...event,
        timestamp: Date.now()
      }

      this.eventHistory.unshift(historyEvent)

      // Keep only last 1000 events
      if (this.eventHistory.length > 1000) {
        this.eventHistory = this.eventHistory.slice(0, 1000)
      }
    },

    /**
     * Clear event history
     */
    clearEventHistory() {
      this.eventHistory = []
    },

    /**
     * Add contract to portfolio tracking
     */
    addContractToPortfolio(contractAddress: string, initialState: Partial<ContractState> = {}) {
      const address = contractAddress.toLowerCase()
      const fullState: ContractState = {
        stage: 0,
        stageName: 'NOT_STARTED',
        totalFunded: '0',
        totalInvestors: 0,
        investorCount: 0,
        fundingProgress: 0,
        principalRepaid: '0',
        interestPaid: '0',
        totalDistributed: '0',
        withdrawablePrincipal: '0',
        withdrawableInterest: '0',
        lastUpdated: 0,
        lastBlockNumber: '0',
        isUpdating: false,
        hasPendingUpdates: false,
        ...initialState
      }

      this.contractStates.set(address, fullState)
      this.portfolio.contracts.set(address, fullState)
      this.updatePortfolioMetrics()
    },

    /**
     * Remove contract from portfolio tracking
     */
    removeContractFromPortfolio(contractAddress: string) {
      const address = contractAddress.toLowerCase()

      this.contractStates.delete(address)
      this.portfolio.contracts.delete(address)
      this.optimisticState.delete(address)
      this.pendingUpdates.delete(address)
      this.confirmedUpdates.delete(address)

      this.updatePortfolioMetrics()
    },

    /**
     * Reset all state
     */
    resetState() {
      this.pendingUpdates.clear()
      this.confirmedUpdates.clear()
      this.optimisticState.clear()
      this.contractStates.clear()
      this.portfolio.contracts.clear()
      this.notifications = []
      this.eventHistory = []
      this.lastBlockNumber = 0n
      this.syncInProgress = false
      this.lastSyncTime = 0

      this.updatePortfolioMetrics()
    }
  }
})
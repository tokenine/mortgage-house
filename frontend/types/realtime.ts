/**
 * Real-time synchronization types
 * Epic 6.1 - Real-time Contract State Synchronization
 */

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'error'

export interface RealtimeEvent {
  id: string
  type: string
  contractAddress: string
  blockNumber: bigint
  timestamp: number
  data: any
  source: 'blockchain' | 'websocket'
  transactionHash?: string
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
  errorCount: number
}

export interface WebSocketConfig {
  URL: string
  RECONNECT_INTERVAL: number
  MAX_RECONNECT_ATTEMPTS: number
  CONNECTION_TIMEOUT: number
  PING_INTERVAL: number
  EVENT_BUFFER_SIZE: number
}

export interface ConnectionQuality {
  quality: 'excellent' | 'good' | 'fair' | 'poor'
  uptime: number
  errorRate: number
  avgLatency: number
}

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
// Transaction types for mortgage investment tracking

export interface Transaction {
  id: string
  timestamp: number
  type: TransactionType
  amount: string // USDT amount as string with proper formatting
  contractAddress: string
  contractTitle?: string
  transactionHash: string
  blockNumber: number
  gasUsed?: string
  gasCost?: {
    ethCost: string
    usdCost: string
  }
  status: TransactionStatus
  relatedEvents: TransactionEvent[]
  confirmations?: number
  networkId?: number
}

export type TransactionType =
  | 'invest'
  | 'withdraw_principal'
  | 'withdraw_interest'
  | 'withdraw_both'
  | 'repayment_principal'
  | 'repayment_interest'
  | 'distribution_principal'
  | 'distribution_interest'
  | 'approval'
  | 'transfer'

export type TransactionStatus = 'pending' | 'confirmed' | 'failed'

export interface TransactionEvent {
  name: string
  signature: string
  address: string
  args: Record<string, any>
  timestamp: number
  blockNumber: number
  transactionHash: string
  logIndex: number
}

export interface PerformanceMetrics {
  totalInvested: string
  totalWithdrawn: string
  totalEarnings: string
  currentPortfolioValue: string
  yearToDateReturns: string
  totalReturnPercentage: number
  investmentsByContract: ContractPerformance[]
  earningsByType: {
    principal: string
    interest: string
  }
  averageHoldingPeriod: number // in days
  totalTransactions: number
  lastTransactionDate?: number
}

export interface ContractPerformance {
  contractAddress: string
  contractTitle?: string
  totalInvested: string
  totalWithdrawn: string
  currentEarnings: string
  shareCount: string
  ownershipPercentage: number
  performanceScore: number // 0-100
  firstInvestmentDate: number
  lastActivityDate: number
}

export interface TransactionFilter {
  types?: TransactionType[]
  dateRange?: {
    start: Date
    end: Date
  }
  contractAddresses?: string[]
  status?: TransactionStatus[]
  amountRange?: {
    min: string
    max: string
  }
  searchQuery?: string
}

export interface TransactionExportOptions {
  format: 'csv' | 'json' | 'excel'
  includeEvents: boolean
  includeGasCosts: boolean
  includeContractDetails: boolean
  dateFormat: 'iso' | 'readable' | 'timestamp'
}

export interface ExportData {
  transactions: Transaction[]
  performanceMetrics: PerformanceMetrics
  generatedAt: string
  filters?: TransactionFilter
  options: TransactionExportOptions
}

// Event signatures for smart contract events
export const EVENT_SIGNATURES = {
  // Investment events
  INVESTED: 'Invested(address,uint256,uint256)',

  // Withdrawal events
  PAYOUT_WITHDRAWN: 'PayoutWithdrawn(address,uint256,uint256)',
  WITHDRAWN: 'Withdrawn(address,uint256,uint256)',

  // Distribution events
  PRINCIPAL_DEPOSITED: 'PrincipalDeposited(address,uint256,uint256,uint256)',
  INTEREST_DEPOSITED: 'InterestDeposited(address,uint256,uint256,uint256)',

  // Stage events
  STAGE_CHANGED: 'StageChanged(uint8,uint8)',

  // ERC20 events
  TRANSFER: 'Transfer(address,address,uint256)',
  APPROVAL: 'Approval(address,address,uint256)'
} as const

// Gas cost tracking
export interface GasCostData {
  gasLimit: bigint
  gasUsed?: bigint
  gasPrice: bigint
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
  ethCost: string
  usdCost: string
  networkStatus: 'normal' | 'congested' | 'high'
  timestamp: number
}

// Pagination for large datasets
export interface TransactionPagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

// Real-time update events
export interface TransactionUpdate {
  type: 'new' | 'status' | 'confirmations'
  transaction: Transaction
  previousStatus?: TransactionStatus
  confirmations?: number
}

// Error types for transaction processing
export class TransactionError extends Error {
  public readonly code: string
  public readonly transactionHash?: string
  public readonly context?: Record<string, any>

  constructor(message: string, code: string, transactionHash?: string, context?: Record<string, any>) {
    super(message)
    this.name = 'TransactionError'
    this.code = code
    this.transactionHash = transactionHash
    this.context = context
  }
}

// Utility types for handling bigints in serialization
export type SerializableTransaction = Omit<Transaction, 'amount'> & {
  amount: string
  gasUsed?: string
  gasCost?: {
    ethCost: string
    usdCost: string
  }
}

// Helper functions
export const createTransactionId = (hash: string, logIndex?: number): string => {
  return `${hash}${logIndex !== undefined ? `-${logIndex}` : ''}`
}

export const formatTransactionType = (type: TransactionType): string => {
  const typeMap: Record<TransactionType, string> = {
    invest: 'Investment',
    withdraw_principal: 'Principal Withdrawal',
    withdraw_interest: 'Interest Withdrawal',
    withdraw_both: 'Combined Withdrawal',
    repayment_principal: 'Principal Repayment',
    repayment_interest: 'Interest Repayment',
    distribution_principal: 'Principal Distribution',
    distribution_interest: 'Interest Distribution',
    approval: 'Token Approval',
    transfer: 'Token Transfer'
  }

  return typeMap[type] || type
}

export const getTransactionTypeIcon = (type: TransactionType): string => {
  const iconMap: Partial<Record<TransactionType, string>> = {
    invest: 'i-heroicons-arrow-up-circle',
    withdraw_principal: 'i-heroicons-arrow-down-circle',
    withdraw_interest: 'i-heroicons-arrow-down-circle',
    withdraw_both: 'i-heroicons-arrow-down-circle',
    repayment_principal: 'i-heroicons-banknotes',
    repayment_interest: 'i-heroicons-currency-dollar',
    distribution_principal: 'i-heroicons-squares-plus',
    distribution_interest: 'i-heroicons-squares-plus',
    approval: 'i-heroicons-check-badge',
    transfer: 'i-heroicons-arrows-right-left'
  }

  return iconMap[type] || 'i-heroicons-document-text'
}

export const getTransactionTypeColor = (type: TransactionType): string => {
  const colorMap: Partial<Record<TransactionType, string>> = {
    invest: 'text-green-600 dark:text-green-400',
    withdraw_principal: 'text-blue-600 dark:text-blue-400',
    withdraw_interest: 'text-purple-600 dark:text-purple-400',
    withdraw_both: 'text-indigo-600 dark:text-indigo-400',
    repayment_principal: 'text-yellow-600 dark:text-yellow-400',
    repayment_interest: 'text-orange-600 dark:text-orange-400',
    distribution_principal: 'text-teal-600 dark:text-teal-400',
    distribution_interest: 'text-cyan-600 dark:text-cyan-400',
    approval: 'text-gray-600 dark:text-gray-400',
    transfer: 'text-pink-600 dark:text-pink-400'
  }

  return colorMap[type] || 'text-gray-600 dark:text-gray-400'
}

export const getStatusColor = (status: TransactionStatus): string => {
  const colorMap: Record<TransactionStatus, string> = {
    pending: 'text-yellow-600 dark:text-yellow-400',
    confirmed: 'text-green-600 dark:text-green-400',
    failed: 'text-red-600 dark:text-red-400'
  }

  return colorMap[status]
}

export const getStatusBgColor = (status: TransactionStatus): string => {
  const colorMap: Record<TransactionStatus, string> = {
    pending: 'bg-yellow-100 dark:bg-yellow-900/20',
    confirmed: 'bg-green-100 dark:bg-green-900/20',
    failed: 'bg-red-100 dark:bg-red-900/20'
  }

  return colorMap[status]
}
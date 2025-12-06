/**
 * Audit Trail Type Definitions
 * Epic 6.2 - Comprehensive Audit Trail and Logging System
 */

// Core audit entry structure
export interface AuditEntry {
  id: string
  timestamp: number
  blockNumber: bigint
  transactionHash: string
  eventType: AuditEventType
  actor: string
  contractAddress: string
  data: Record<string, any>
  preState?: Record<string, any>
  postState?: Record<string, any>
  verificationHash: string
  isVerified: boolean
  complianceImpact: ComplianceImpact
  metadata: AuditMetadata
}

export interface AuditMetadata {
  source: 'contract_event' | 'transaction' | 'operational_log' | 'system_event'
  networkId: number
  gasUsed?: bigint
  gasPrice?: bigint
  fee?: string
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  deviceFingerprint?: string
  geographicLocation?: string
  riskScore?: number
  flaggedForReview?: boolean
  reviewReason?: string
}

// Event types for comprehensive audit coverage
export type AuditEventType =
  // Investment Events
  | 'INVESTMENT_INITIATED'
  | 'INVESTMENT_CONFIRMED'
  | 'INVESTMENT_FAILED'
  | 'INVESTMENT_ROLLBACK'
  // Withdrawal Events
  | 'WITHDRAWAL_INITIATED'
  | 'WITHDRAWAL_CONFIRMED'
  | 'WITHDRAWAL_FAILED'
  | 'WITHDRAWAL_ROLLBACK'
  // Contract Events
  | 'CONTRACT_DEPLOYED'
  | 'CONTRACT_UPGRADED'
  | 'CONTRACT_PAUSED'
  | 'CONTRACT_RESUMED'
  // Stage Events
  | 'STAGE_TRANSITION'
  | 'FUNDING_STARTED'
  | 'FUNDING_COMPLETED'
  | 'LOAN_ACTIVATED'
  | 'LOAN_REPAID'
  // Operator Events
  | 'OPERATOR_LOGIN'
  | 'OPERATOR_ACTION'
  | 'OPERATOR_OVERRIDE'
  | 'PRIVILEGE_ESCALATION'
  // Repayment Events
  | 'PRINCIPAL_DEPOSITED'
  | 'INTEREST_DEPOSITED'
  | 'DISTRIBUTION_PROCESSED'
  | 'TAX_WITHHELD'
  // System Events
  | 'SYSTEM_BACKUP'
  | 'SYSTEM_MAINTENANCE'
  | 'DATA_EXPORT'
  | 'REPORT_GENERATED'
  // Security Events
  | 'SECURITY_BREACH'
  | 'UNAUTHORIZED_ACCESS'
  | 'SUSPICIOUS_ACTIVITY'
  | 'BRUTE_FORCE_BLOCKED'
  // Compliance Events
  | 'KYC_VERIFICATION'
  | 'AML_CHECK'
  | 'REGULATORY_REPORTING'
  | 'AUDIT_VERIFICATION'
  // Error Events
  | 'ERROR_OCCURRED'
  | 'ERROR_RECOVERED'
  | 'ERROR_LOGGED'
  | 'ERROR_ESCALATED'

export interface ComplianceImpact {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  regulations: string[]
  reportable: boolean
  requiresReview: boolean
  autoFlag: boolean
  riskFactors: string[]
}

// Audit filtering and search
export interface AuditFilters {
  dateRange?: {
    start: Date
    end: Date
  }
  eventTypes?: AuditEventType[]
  actors?: string[]
  contracts?: string[]
  transactionHashes?: string[]
  complianceImpact?: ComplianceImpact['level'][]
  isVerified?: boolean
  flaggedForReview?: boolean
  amountRange?: {
    min: bigint
    max: bigint
  }
  riskScoreRange?: {
    min: number
    max: number
  }
  search?: string
  source?: AuditMetadata['source'][]
  networkId?: number[]
}

export interface Pagination {
  offset: number
  limit: number
  sortBy?: keyof AuditEntry
  sortOrder?: 'asc' | 'desc'
}

export interface AuditQuery {
  filters: AuditFilters
  pagination: Pagination
  totalCount: number
  executionTime: number
}

// Transaction context for detailed analysis
export interface TransactionContext {
  transaction: TransactionDetails
  relatedEvents: AuditEntry[]
  stateChanges: StateChange[]
  verificationLinks: VerificationLink[]
  complianceAnalysis: ComplianceAnalysis
  networkContext: NetworkContext
}

export interface TransactionDetails {
  hash: string
  blockNumber: bigint
  blockHash: string
  transactionIndex: number
  from: string
  to?: string
  value: bigint
  gasUsed: bigint
  gasPrice: bigint
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
  input: string
  nonce: bigint
  timestamp: number
  status: 'success' | 'failed' | 'pending'
  confirmations: number
  replacedBy?: string
  replaced?: string
}

export interface StateChange {
  field: string
  oldValue: any
  newValue: any
  changeType: 'increment' | 'decrement' | 'set' | 'array_add' | 'array_remove'
  impact: 'low' | 'medium' | 'high'
  verified: boolean
}

export interface VerificationLink {
  type: 'blockchain_explorer' | 'block_scanner' | 'ipfs_hash' | 'arweave_tx'
  url: string
  label: string
  description?: string
  isActive: boolean
}

export interface ComplianceAnalysis {
  violations: ComplianceViolation[]
  recommendations: ComplianceRecommendation[]
  flags: ComplianceFlag[]
  score: number
  lastAnalyzed: number
}

export interface ComplianceViolation {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  regulation: string
  timestamp: number
  resolved: boolean
  resolution?: string
}

export interface ComplianceRecommendation {
  id: string
  category: string
  priority: 'low' | 'medium' | 'high'
  title: string
  description: string
  actionItems: string[]
  estimatedImpact: string
}

export interface ComplianceFlag {
  id: string
  type: 'suspicious_pattern' | 'unusual_activity' | 'high_risk' | 'manual_review'
  severity: 'low' | 'medium' | 'high'
  description: string
  autoGenerated: boolean
  reviewed: boolean
  reviewer?: string
}

export interface NetworkContext {
  networkId: number
  networkName: string
  blockTimestamp: number
  difficulty?: bigint
  baseFeePerGas?: bigint
  gasLimit: bigint
  miner?: string
  uncles?: string[]
}

// Data integrity verification
export interface VerificationResult {
  valid: boolean
  reason?: string
  transaction?: TransactionDetails
  receipt?: any
  stateChanges?: StateChangeResult
  hashIntegrity?: HashIntegrityResult
  verificationTimestamp: number
  verificationDuration: number
  confidence: number
}

export interface StateChangeResult {
  valid: boolean
  verifiedChanges: number
  totalChanges: number
  inconsistencies: string[]
  merkleProof?: string
}

export interface HashIntegrityResult {
  valid: boolean
  calculatedHash: string
  storedHash: string
  algorithm: string
  salt: string
}

export interface BatchVerificationResult {
  total: number
  valid: number
  invalid: number
  results: (VerificationResult | null)[]
  verificationDate: string
  verificationDuration: number
  overallConfidence: number
}

export interface AuditProof {
  entriesHash: string
  merkleRoot: string
  merkleDepth: number
  timestamp: number
  verifier: string
  algorithm: string
  salt: string
  signatures: Signature[]
}

export interface Signature {
  signer: string
  signature: string
  timestamp: number
  algorithm: string
}

// Compliance reporting
export interface ComplianceReportConfig {
  reportType: ReportType
  format: ExportFormat
  period: ReportPeriod
  filters: AuditFilters
  includeDetails: boolean
  includeVerification: boolean
  customFields?: string[]
}

export type ReportType =
  | 'KYC_AML'
  | 'TRANSACTION_MONITORING'
  | 'INVESTOR_REPORTING'
  | 'TAX_REPORTING'
  | 'REGULATORY_FILING'
  | 'INTERNAL_AUDIT'
  | 'SECURITY_AUDIT'
  | 'CUSTOM'

export type ExportFormat =
  | 'CSV'
  | 'JSON'
  | 'PDF'
  | 'XML'
  | 'EXCEL'
  | 'PARQUET'

export interface ReportPeriod {
  startDate: Date
  endDate: Date
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'
}

export interface ComplianceReport {
  id: string
  reportType: ReportType
  period: ReportPeriod
  data: ReportData
  metadata: ReportMetadata
  attachments?: ReportAttachment[]
}

export interface ReportData {
  summary: ReportSummary
  details: any[]
  analytics: ReportAnalytics
  insights: ReportInsight[]
  recommendations: ComplianceRecommendation[]
  violations: ComplianceViolation[]
  charts?: ChartData[]
}

export interface ReportSummary {
  totalRecords: number
  totalAmount: string
  uniqueActors: number
  uniqueContracts: number
  eventBreakdown: Record<AuditEventType, number>
  riskDistribution: Record<string, number>
  complianceScore: number
  flaggedActivities: number
  resolvedIssues: number
  pendingIssues: number
}

export interface ReportAnalytics {
  trends: TrendData[]
  patterns: PatternData[]
  anomalies: AnomalyData[]
  riskMetrics: RiskMetrics
  performanceMetrics: PerformanceMetrics
}

export interface TrendData {
  metric: string
  period: string
  values: number[]
  change: number
  changePercent: number
  significance: 'low' | 'medium' | 'high'
}

export interface PatternData {
  pattern: string
  frequency: number
  confidence: number
  description: string
  examples: string[]
}

export interface AnomalyData {
  anomaly: string
  severity: 'low' | 'medium' | 'high'
  description: string
  affectedRecords: number
  recommendedAction: string
}

export interface RiskMetrics {
  overallRiskScore: number
  riskCategories: Record<string, number>
  highRiskTransactions: number
  riskTrend: 'improving' | 'stable' | 'deteriorating'
  riskFactors: string[]
}

export interface PerformanceMetrics {
  averageProcessingTime: number
  peakProcessingTime: number
  errorRate: number
  throughput: number
  availability: number
  responseTime: number
}

export interface ReportInsight {
  id: string
  category: string
  priority: 'low' | 'medium' | 'high'
  title: string
  description: string
  impact: string
  actionRequired: boolean
  dueDate?: Date
  assignee?: string
}

export interface ReportMetadata {
  reportId: string
  generatedAt: string
  generatedBy: string
  dataSource: string
  version: string
  format: ExportFormat
  size: number
  checksum: string
  classification: 'public' | 'internal' | 'confidential' | 'restricted'
  retentionPeriod: number
  archived: boolean
  tags: string[]
}

export interface ReportAttachment {
  id: string
  name: string
  type: string
  size: number
  url: string
  description?: string
  checksum: string
  encrypted: boolean
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap'
  title: string
  data: any[]
  config: ChartConfig
}

export interface ChartConfig {
  xAxis?: AxisConfig
  yAxis?: AxisConfig
  colors?: string[]
  legend?: LegendConfig
  tooltip?: TooltipConfig
  interactive?: boolean
  downloadable?: boolean
}

export interface AxisConfig {
  label: string
  type: 'linear' | 'logarithmic' | 'categorical' | 'time'
  min?: number
  max?: number
  format?: string
}

export interface LegendConfig {
  show: boolean
  position: 'top' | 'bottom' | 'left' | 'right'
  format?: string
}

export interface TooltipConfig {
  show: boolean
  format?: string
  fields?: string[]
}

// Audit trail statistics and metrics
export interface AuditStatistics {
  totalEntries: number
  verifiedEntries: number
  unverifiedEntries: number
  flaggedEntries: number
  averageRiskScore: number
  highRiskEntries: number
  complianceScore: number
  dataIntegrityScore: number
  verificationScore: number
  lastUpdated: number
  period: ReportPeriod
}

export interface AuditMetrics {
  volume: VolumeMetrics
  performance: PerformanceMetrics
  compliance: ComplianceMetrics
  security: SecurityMetrics
  quality: QualityMetrics
}

export interface VolumeMetrics {
  totalEvents: number
  eventsPerDay: number
  peakEvents: number
  averageEventsPerHour: number
  uniqueUsers: number
  uniqueContracts: number
  transactionVolume: string
}

export interface ComplianceMetrics {
  complianceScore: number
  violations: number
  resolvedViolations: number
  pendingReviews: number
  flaggedActivities: number
  reportGenerationRate: number
  regulatoryFilings: number
  auditSuccessRate: number
}

export interface SecurityMetrics {
  securityIncidents: number
  blockedAttempts: number
  suspiciousActivities: number
  verifiedEntries: number
  dataIntegrityScore: number
  encryptionStatus: 'active' | 'inactive' | 'partial'
  accessViolations: number
  authenticationFailures: number
}

export interface QualityMetrics {
  dataAccuracy: number
  completenessScore: number
  consistencyScore: number
  timelinessScore: number
  verificationScore: number
  errorRate: number
  missingDataPoints: number
  duplicateEntries: number
}

// Export and integration interfaces
export interface ExportOptions {
  format: ExportFormat
  includeHeaders: boolean
  includeMetadata: boolean
  compress: boolean
  encrypt: boolean
  watermark?: string
  customTemplate?: string
}

export interface ExportResult {
  success: boolean
  fileId: string
  filename: string
  size: number
  format: ExportFormat
  downloadUrl: string
  expiresAt: Date
  checksum: string
}

// API response interfaces
export interface AuditApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    hasNext: boolean
    hasPrev: boolean
  }
  metadata?: {
    requestId: string
    timestamp: number
    processingTime: number
    cacheHit: boolean
  }
}

// WebSocket event types for real-time audit updates
export interface AuditWebSocketEvent {
  type: 'AUDIT_ENTRY_CREATED' | 'AUDIT_ENTRY_UPDATED' | 'VERIFICATION_COMPLETED' | 'REPORT_GENERATED'
  data: any
  timestamp: number
  requestId?: string
}

// Error handling for audit system
export interface AuditError {
  code: string
  message: string
  details?: any
  timestamp: number
  requestId?: string
  retryable: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
}
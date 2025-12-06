/**
 * Audit Filtering and Search Utilities
 * Epic 6.2 - Comprehensive Audit Trail and Logging System
 * Provides advanced filtering, search, and analysis capabilities for audit data
 */

import type {
  AuditEntry,
  AuditFilters,
  AuditEventType,
  ComplianceImpact
} from '~/types/audit'

export class AuditFilterManager {
  private predefinedFilters: Map<string, AuditFilters> = new Map()
  private searchIndex: SearchIndex = new SearchIndex()

  constructor() {
    this.initializePredefinedFilters()
  }

  /**
   * Apply advanced filters to audit data
   */
  applyFilters(data: AuditEntry[], filters: AuditFilters): FilteredResult {
    const startTime = Date.now()
    let filteredData = [...data]
    const appliedFilters: string[] = []

    // Date range filter
    if (filters.dateRange) {
      filteredData = this.applyDateRangeFilter(filteredData, filters.dateRange)
      appliedFilters.push('date_range')
    }

    // Event types filter
    if (filters.eventTypes && filters.eventTypes.length > 0) {
      filteredData = this.applyEventTypesFilter(filteredData, filters.eventTypes)
      appliedFilters.push('event_types')
    }

    // Actors filter
    if (filters.actors && filters.actors.length > 0) {
      filteredData = this.applyActorsFilter(filteredData, filters.actors)
      appliedFilters.push('actors')
    }

    // Contracts filter
    if (filters.contracts && filters.contracts.length > 0) {
      filteredData = this.applyContractsFilter(filteredData, filters.contracts)
      appliedFilters.push('contracts')
    }

    // Transaction hashes filter
    if (filters.transactionHashes && filters.transactionHashes.length > 0) {
      filteredData = this.applyTransactionHashesFilter(filteredData, filters.transactionHashes)
      appliedFilters.push('transaction_hashes')
    }

    // Compliance impact filter
    if (filters.complianceImpact && filters.complianceImpact.length > 0) {
      filteredData = this.applyComplianceImpactFilter(filteredData, filters.complianceImpact)
      appliedFilters.push('compliance_impact')
    }

    // Verification status filter
    if (filters.isVerified !== undefined) {
      filteredData = this.applyVerificationStatusFilter(filteredData, filters.isVerified)
      appliedFilters.push('verification_status')
    }

    // Flagged for review filter
    if (filters.flaggedForReview !== undefined) {
      filteredData = this.applyFlaggedForReviewFilter(filteredData, filters.flaggedForReview)
      appliedFilters.push('flagged_for_review')
    }

    // Amount range filter
    if (filters.amountRange) {
      filteredData = this.applyAmountRangeFilter(filteredData, filters.amountRange)
      appliedFilters.push('amount_range')
    }

    // Risk score range filter
    if (filters.riskScoreRange) {
      filteredData = this.applyRiskScoreRangeFilter(filteredData, filters.riskScoreRange)
      appliedFilters.push('risk_score_range')
    }

    // Source filter
    if (filters.source && filters.source.length > 0) {
      filteredData = this.applySourceFilter(filteredData, filters.source)
      appliedFilters.push('source')
    }

    // Network filter
    if (filters.networkId && filters.networkId.length > 0) {
      filteredData = this.applyNetworkFilter(filteredData, filters.networkId)
      appliedFilters.push('network')
    }

    // Text search filter
    if (filters.search) {
      filteredData = this.applyTextSearchFilter(filteredData, filters.search)
      appliedFilters.push('text_search')
    }

    const executionTime = Date.now() - startTime

    return {
      data: filteredData,
      totalCount: filteredData.length,
      originalCount: data.length,
      appliedFilters,
      executionTime,
      filterSummary: this.generateFilterSummary(filters)
    }
  }

  /**
   * Create saved filter preset
   */
  saveFilterPreset(name: string, filters: AuditFilters): void {
    this.predefinedFilters.set(name, { ...filters })
  }

  /**
   * Load filter preset
   */
  loadFilterPreset(name: string): AuditFilters | null {
    return this.predefinedFilters.get(name) || null
  }

  /**
   * Get all saved filter presets
   */
  getFilterPresets(): Array<{ name: string; filters: AuditFilters }> {
    return Array.from(this.predefinedFilters.entries()).map(([name, filters]) => ({
      name,
      filters: { ...filters }
    }))
  }

  /**
   * Delete filter preset
   */
  deleteFilterPreset(name: string): boolean {
    return this.predefinedFilters.delete(name)
  }

  /**
   * Get suggested filters based on data analysis
   */
  getSuggestedFilters(data: AuditEntry[]): SuggestedFilter[] {
    const suggestions: SuggestedFilter[] = []

    // Suggest date range filters
    const dateRange = this.analyzeDateDistribution(data)
    if (dateRange.suggestion) {
      suggestions.push(dateRange.suggestion)
    }

    // Suggest high-risk filters
    const highRisk = this.analyzeRiskDistribution(data)
    if (highRisk.suggestion) {
      suggestions.push(highRisk.suggestion)
    }

    // Suggest verification status filters
    const verificationStatus = this.analyzeVerificationStatus(data)
    if (verificationStatus.suggestion) {
      suggestions.push(verificationStatus.suggestion)
    }

    // Suggest compliance impact filters
    const complianceImpact = this.analyzeComplianceImpact(data)
    if (complianceImpact.suggestion) {
      suggestions.push(complianceImpact.suggestion)
    }

    return suggestions
  }

  /**
   * Validate filter configuration
   */
  validateFilters(filters: AuditFilters): FilterValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate date range
    if (filters.dateRange) {
      if (filters.dateRange.start >= filters.dateRange.end) {
        errors.push('Start date must be before end date')
      }

      const daysDiff = (filters.dateRange.end.getTime() - filters.dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
      if (daysDiff > 365) {
        warnings.push('Filtering more than 1 year may impact performance')
      }
    }

    // Validate amount range
    if (filters.amountRange) {
      if (filters.amountRange.min >= filters.amountRange.max) {
        errors.push('Minimum amount must be less than maximum amount')
      }
    }

    // Validate risk score range
    if (filters.riskScoreRange) {
      if (filters.riskScoreRange.min < 0 || filters.riskScoreRange.max > 1) {
        errors.push('Risk score must be between 0 and 1')
      }
      if (filters.riskScoreRange.min >= filters.riskScoreRange.max) {
        errors.push('Minimum risk score must be less than maximum risk score')
      }
    }

    // Check for conflicting filters
    const hasVerificationFilter = filters.isVerified !== undefined
    const hasFlaggedFilter = filters.flaggedForReview !== undefined
    if (hasVerificationFilter && hasFlaggedFilter) {
      warnings.push('Verification status and flagged status filters may conflict')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Build search index for efficient text search
   */
  buildSearchIndex(data: AuditEntry[]): void {
    this.searchIndex.buildIndex(data)
  }

  /**
   * Search audit data using full-text search
   */
  searchData(data: AuditEntry[], query: string, options?: SearchOptions): SearchResult {
    return this.searchIndex.search(query, options)
  }

  // Private filter implementation methods

  private applyDateRangeFilter(data: AuditEntry[], dateRange: { start: Date; end: Date }): AuditEntry[] {
    const startTime = dateRange.start.getTime()
    const endTime = dateRange.end.getTime()

    return data.filter(entry =>
      entry.timestamp >= startTime && entry.timestamp <= endTime
    )
  }

  private applyEventTypesFilter(data: AuditEntry[], eventTypes: AuditEventType[]): AuditEntry[] {
    return data.filter(entry => eventTypes.includes(entry.eventType))
  }

  private applyActorsFilter(data: AuditEntry[], actors: string[]): AuditEntry[] {
    const lowerCaseActors = actors.map(actor => actor.toLowerCase())
    return data.filter(entry =>
      lowerCaseActors.includes(entry.actor.toLowerCase())
    )
  }

  private applyContractsFilter(data: AuditEntry[], contracts: string[]): AuditEntry[] {
    const lowerCaseContracts = contracts.map(contract => contract.toLowerCase())
    return data.filter(entry =>
      lowerCaseContracts.includes(entry.contractAddress.toLowerCase())
    )
  }

  private applyTransactionHashesFilter(data: AuditEntry[], hashes: string[]): AuditEntry[] {
    const lowerCaseHashes = hashes.map(hash => hash.toLowerCase())
    return data.filter(entry =>
      lowerCaseHashes.includes(entry.transactionHash.toLowerCase())
    )
  }

  private applyComplianceImpactFilter(
    data: AuditEntry[],
    impactLevels: ComplianceImpact['level'][]
  ): AuditEntry[] {
    return data.filter(entry =>
      impactLevels.includes(entry.complianceImpact.level)
    )
  }

  private applyVerificationStatusFilter(data: AuditEntry[], isVerified: boolean): AuditEntry[] {
    return data.filter(entry => entry.isVerified === isVerified)
  }

  private applyFlaggedForReviewFilter(data: AuditEntry[], flagged: boolean): AuditEntry[] {
    return data.filter(entry => entry.metadata.flaggedForReview === flagged)
  }

  private applyAmountRangeFilter(data: AuditEntry[], range: { min: bigint; max: bigint }): AuditEntry[] {
    return data.filter(entry => {
      const amount = BigInt(entry.data.amount || '0')
      return amount >= range.min && amount <= range.max
    })
  }

  private applyRiskScoreRangeFilter(
    data: AuditEntry[],
    range: { min: number; max: number }
  ): AuditEntry[] {
    return data.filter(entry => {
      const riskScore = entry.metadata.riskScore || 0
      return riskScore >= range.min && riskScore <= range.max
    })
  }

  private applySourceFilter(data: AuditEntry[], sources: AuditMetadata['source'][]): AuditEntry[] {
    return data.filter(entry => sources.includes(entry.metadata.source))
  }

  private applyNetworkFilter(data: AuditEntry[], networkIds: number[]): AuditEntry[] {
    return data.filter(entry => networkIds.includes(entry.metadata.networkId))
  }

  private applyTextSearchFilter(data: AuditEntry[], query: string): AuditEntry[] {
    const searchResult = this.searchIndex.search(query)
    const matchedIds = new Set(searchResult.hits.map(hit => hit.id))
    return data.filter(entry => matchedIds.has(entry.id))
  }

  private generateFilterSummary(filters: AuditFilters): string {
    const parts: string[] = []

    if (filters.dateRange) {
      parts.push(`Date: ${filters.dateRange.start.toLocaleDateString()} - ${filters.dateRange.end.toLocaleDateString()}`)
    }

    if (filters.eventTypes && filters.eventTypes.length > 0) {
      parts.push(`Events: ${filters.eventTypes.length}`)
    }

    if (filters.actors && filters.actors.length > 0) {
      parts.push(`Actors: ${filters.actors.length}`)
    }

    if (filters.contracts && filters.contracts.length > 0) {
      parts.push(`Contracts: ${filters.contracts.length}`)
    }

    if (filters.search) {
      parts.push(`Search: "${filters.search}"`)
    }

    return parts.length > 0 ? parts.join(' | ') : 'All data'
  }

  // Analysis methods for suggestions

  private analyzeDateDistribution(data: AuditEntry[]): {
    suggestion?: SuggestedFilter
    stats: any
  } {
    if (data.length === 0) {
      return { stats: {} }
    }

    const timestamps = data.map(entry => entry.timestamp)
    const minTime = Math.min(...timestamps)
    const maxTime = Math.max(...timestamps)
    const timeSpan = maxTime - minTime
    const daysSpan = timeSpan / (1000 * 60 * 60 * 24)

    if (daysSpan > 30) {
      // Suggest last 30 days
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
      return {
        suggestion: {
          name: 'Last 30 Days',
          description: 'Show data from the last 30 days for recent activity analysis',
          filters: {
            dateRange: {
              start: new Date(thirtyDaysAgo),
              end: new Date()
            }
          },
          estimatedResults: data.filter(entry => entry.timestamp >= thirtyDaysAgo).length,
          confidence: 0.8
        },
        stats: { daysSpan, totalEntries: data.length }
      }
    }

    return { stats: { daysSpan, totalEntries: data.length } }
  }

  private analyzeRiskDistribution(data: AuditEntry[]): {
    suggestion?: SuggestedFilter
    stats: any
  } {
    const highRiskEntries = data.filter(entry =>
      entry.metadata.riskScore && entry.metadata.riskScore > 0.7
    )

    if (highRiskEntries.length > 0) {
      return {
        suggestion: {
          name: 'High Risk Activities',
          description: 'Show only high-risk activities that may require attention',
          filters: {
            riskScoreRange: { min: 0.7, max: 1.0 },
            flaggedForReview: true
          },
          estimatedResults: highRiskEntries.length,
          confidence: 0.9
        },
        stats: {
          highRiskCount: highRiskEntries.length,
          highRiskPercentage: (highRiskEntries.length / data.length) * 100
        }
      }
    }

    return { stats: { highRiskCount: 0 } }
  }

  private analyzeVerificationStatus(data: AuditEntry[]): {
    suggestion?: SuggestedFilter
    stats: any
  } {
    const unverifiedEntries = data.filter(entry => !entry.isVerified)

    if (unverifiedEntries.length > 0) {
      return {
        suggestion: {
          name: 'Unverified Entries',
          description: 'Show audit entries that have not been cryptographically verified',
          filters: {
            isVerified: false
          },
          estimatedResults: unverifiedEntries.length,
          confidence: 0.95
        },
        stats: {
          unverifiedCount: unverifiedEntries.length,
          unverifiedPercentage: (unverifiedEntries.length / data.length) * 100
        }
      }
    }

    return { stats: { unverifiedCount: 0 } }
  }

  private analyzeComplianceImpact(data: AuditEntry[]): {
    suggestion?: SuggestedFilter
    stats: any
  } {
    const highImpactEntries = data.filter(entry =>
      ['HIGH', 'CRITICAL'].includes(entry.complianceImpact.level)
    )

    if (highImpactEntries.length > 0) {
      return {
        suggestion: {
          name: 'High Compliance Impact',
          description: 'Show entries with high or critical compliance impact',
          filters: {
            complianceImpact: ['HIGH', 'CRITICAL']
          },
          estimatedResults: highImpactEntries.length,
          confidence: 0.9
        },
        stats: {
          highImpactCount: highImpactEntries.length,
          highImpactPercentage: (highImpactEntries.length / data.length) * 100
        }
      }
    }

    return { stats: { highImpactCount: 0 } }
  }

  private initializePredefinedFilters(): void {
    // Common predefined filters
    this.predefinedFilters.set('last_24_hours', {
      dateRange: {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date()
      }
    })

    this.predefinedFilters.set('last_7_days', {
      dateRange: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date()
      }
    })

    this.predefinedFilters.set('last_30_days', {
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      }
    })

    this.predefinedFilters.set('high_risk', {
      riskScoreRange: { min: 0.7, max: 1.0 },
      flaggedForReview: true
    })

    this.predefinedFilters.set('unverified', {
      isVerified: false
    })

    this.predefinedFilters.set('compliance_critical', {
      complianceImpact: ['CRITICAL']
    })

    this.predefinedFilters.set('investment_activities', {
      eventTypes: ['INVESTMENT_INITIATED', 'INVESTMENT_CONFIRMED', 'INVESTMENT_FAILED']
    })

    this.predefinedFilters.set('withdrawal_activities', {
      eventTypes: ['WITHDRAWAL_INITIATED', 'WITHDRAWAL_CONFIRMED', 'WITHDRAWAL_FAILED']
    })

    this.predefinedFilters.set('operator_actions', {
      eventTypes: ['OPERATOR_LOGIN', 'OPERATOR_ACTION', 'OPERATOR_OVERRIDE']
    })
  }
}

// Search index implementation
class SearchIndex {
  private index: Map<string, Set<string>> = new Map()
  private documents: Map<string, AuditEntry> = new Map()

  buildIndex(data: AuditEntry[]): void {
    this.index.clear()
    this.documents.clear()

    data.forEach(entry => {
      this.documents.set(entry.id, entry)
      this.indexDocument(entry)
    })
  }

  search(query: string, options?: SearchOptions): SearchResult {
    const startTime = Date.now()
    const normalizedQuery = query.toLowerCase().trim()
    const terms = normalizedQuery.split(/\s+/).filter(term => term.length > 0)

    if (terms.length === 0) {
      return {
        query,
        hits: [],
        totalHits: 0,
        executionTime: Date.now() - startTime
      }
    }

    const matchingDocs = new Map<string, number>()

    // Find documents matching all terms
    for (const term of terms) {
      const termDocs = this.index.get(term) || new Set()

      if (matchingDocs.size === 0) {
        termDocs.forEach(docId => matchingDocs.set(docId, 1))
      } else {
        for (const [docId, score] of matchingDocs.entries()) {
          if (!termDocs.has(docId)) {
            matchingDocs.delete(docId)
          } else {
            matchingDocs.set(docId, score + 1)
          }
        }
      }
    }

    // Convert to hits and sort by relevance
    const hits: SearchHit[] = Array.from(matchingDocs.entries())
      .map(([id, score]) => {
        const doc = this.documents.get(id)
        return {
          id,
          score: score / terms.length, // Normalized score
          document: doc!,
          highlights: this.generateHighlights(doc!, terms)
        }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, options?.limit || 100)

    return {
      query,
      hits,
      totalHits: hits.length,
      executionTime: Date.now() - startTime
    }
  }

  private indexDocument(entry: AuditEntry): void {
    const fields = [
      entry.eventType,
      entry.actor,
      entry.contractAddress,
      entry.transactionHash,
      JSON.stringify(entry.data),
      entry.complianceImpact.level,
      entry.metadata.source
    ]

    fields.forEach(field => {
      const terms = this.tokenize(field.toLowerCase())
      terms.forEach(term => {
        if (!this.index.has(term)) {
          this.index.set(term, new Set())
        }
        this.index.get(term)!.add(entry.id)
      })
    })
  }

  private tokenize(text: string): string[] {
    // Simple tokenization - split on non-alphanumeric characters
    return text.split(/[^a-z0-9]+/).filter(term => term.length > 2)
  }

  private generateHighlights(entry: AuditEntry, terms: string[]): string[] {
    const highlights: string[] = []
    const text = JSON.stringify(entry).toLowerCase()

    terms.forEach(term => {
      const index = text.indexOf(term)
      if (index !== -1) {
        const start = Math.max(0, index - 20)
        const end = Math.min(text.length, index + term.length + 20)
        const snippet = text.substring(start, end)
        highlights.push(`...${snippet}...`)
      }
    })

    return highlights.slice(0, 3) // Limit to 3 highlights
  }
}

// Supporting interfaces

export interface FilteredResult {
  data: AuditEntry[]
  totalCount: number
  originalCount: number
  appliedFilters: string[]
  executionTime: number
  filterSummary: string
}

export interface SuggestedFilter {
  name: string
  description: string
  filters: AuditFilters
  estimatedResults: number
  confidence: number
}

export interface FilterValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface SearchOptions {
  limit?: number
  fields?: string[]
  fuzzy?: boolean
}

export interface SearchResult {
  query: string
  hits: SearchHit[]
  totalHits: number
  executionTime: number
}

export interface SearchHit {
  id: string
  score: number
  document: AuditEntry
  highlights: string[]
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

/**
 * Factory function to create AuditFilterManager
 */
export function createAuditFilterManager(): AuditFilterManager {
  return new AuditFilterManager()
}
/**
 * Audit Trail Store
 * Epic 6.2 - Comprehensive Audit Trail and Logging System
 * Pinia store for managing audit trail state and operations
 */

import { defineStore } from 'pinia'
import type {
  AuditEntry,
  ComplianceReport,
  AuditStatistics,
  VerificationResult,
  BatchVerificationResult,
  ExportJob,
  FilterPreset,
  AuditAlert
} from '~/types/audit'

export const useAuditStore = defineStore('audit', {
  state: () => ({
    // Audit entries cache
    auditEntries: [] as AuditEntry[],
    auditEntriesMap: new Map<string, AuditEntry>(),

    // Statistics and metrics
    statistics: null as AuditStatistics | null,
    lastStatisticsUpdate: 0,

    // Verification results cache
    verificationResults: new Map<string, VerificationResult>(),
    batchVerifications: [] as BatchVerificationResult[],

    // Compliance reports
    reports: [] as ComplianceReport[],
    reportsMap: new Map<string, ComplianceReport>(),

    // Export jobs
    exportJobs: [] as ExportJob[],

    // Filter presets
    filterPresets: new Map<string, FilterPreset>(),

    // Search index
    searchIndex: null as any,
    searchIndexBuilt: false,

    // Real-time updates
    realTimeUpdates: [] as AuditEntry[],
    lastRealTimeUpdate: 0,

    // Alerts and notifications
    alerts: [] as AuditAlert[],

    // Cache management
    cacheExpiry: 24 * 60 * 60 * 1000, // 24 hours
    lastCacheUpdate: 0,

    // Settings and preferences
    settings: {
      autoRefresh: true,
      refreshInterval: 30000, // 30 seconds
      maxCacheSize: 10000,
      enableRealTime: true,
      verificationAutoRun: false,
      exportCompression: true,
      notificationsEnabled: true
    },

    // Performance metrics
    performanceMetrics: {
      totalQueries: 0,
      averageQueryTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
      lastUpdated: Date.now()
    }
  }),

  getters: {
    // Get audit entry by ID
    getAuditEntryById: (state) => (id: string): AuditEntry | undefined => {
      return state.auditEntriesMap.get(id)
    },

    // Get audit entries by transaction hash
    getAuditEntriesByTransaction: (state) => (txHash: string): AuditEntry[] => {
      return state.auditEntries.filter(entry => entry.transactionHash === txHash)
    },

    // Get audit entries by actor
    getAuditEntriesByActor: (state) => (actor: string): AuditEntry[] => {
      return state.auditEntries.filter(entry => entry.actor.toLowerCase() === actor.toLowerCase())
    },

    // Get audit entries by contract
    getAuditEntriesByContract: (state) => (contractAddress: string): AuditEntry[] => {
      return state.auditEntries.filter(entry =>
        entry.contractAddress.toLowerCase() === contractAddress.toLowerCase()
      )
    },

    // Get unverified entries
    unverifiedEntries: (state): AuditEntry[] => {
      return state.auditEntries.filter(entry => !entry.isVerified)
    },

    // Get high-risk entries
    highRiskEntries: (state): AuditEntry[] => {
      return state.auditEntries.filter(entry =>
        entry.complianceImpact.level === 'HIGH' || entry.complianceImpact.level === 'CRITICAL'
      )
    },

    // Get flagged entries
    flaggedEntries: (state): AuditEntry[] => {
      return state.auditEntries.filter(entry => entry.metadata.flaggedForReview)
    },

    // Get recent entries (last 24 hours)
    recentEntries: (state): AuditEntry[] => {
      const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000)
      return state.auditEntries.filter(entry => entry.timestamp >= twentyFourHoursAgo)
    },

    // Get entries by event type
    getEntriesByEventType: (state) => (eventType: string): AuditEntry[] => {
      return state.auditEntries.filter(entry => entry.eventType === eventType)
    },

    // Get compliance report by ID
    getReportById: (state) => (id: string): ComplianceReport | undefined => {
      return state.reportsMap.get(id)
    },

    // Get reports by type
    getReportsByType: (state) => (reportType: string): ComplianceReport[] => {
      return state.reports.filter(report => report.reportType === reportType)
    },

    // Get export job by ID
    getExportJobById: (state) => (id: string): ExportJob | undefined => {
      return state.exportJobs.find(job => job.id === id)
    },

    // Get active export jobs
    activeExportJobs: (state): ExportJob[] => {
      return state.exportJobs.filter(job => job.status === 'processing')
    },

    // Get verification result by entry ID
    getVerificationResult: (state) => (entryId: string): VerificationResult | undefined => {
      return state.verificationResults.get(entryId)
    },

    // Get unread alerts
    unreadAlerts: (state): AuditAlert[] => {
      return state.alerts.filter(alert => !alert.read)
    },

    // Get critical alerts
    criticalAlerts: (state): AuditAlert[] => {
      return state.alerts.filter(alert => alert.severity === 'critical')
    },

    // Check if cache is expired
    isCacheExpired: (state): boolean => {
      return Date.now() - state.lastCacheUpdate > state.cacheExpiry
    },

    // Get cache statistics
    cacheStats: (state) => ({
      totalEntries: state.auditEntries.length,
      mapSize: state.auditEntriesMap.size,
      reportsCount: state.reports.length,
      verificationResultsCount: state.verificationResults.size,
      exportJobsCount: state.exportJobs.length,
      alertsCount: state.alerts.length
    }),

    // Get performance statistics
    performanceStats: (state) => ({
      ...state.performanceMetrics,
      cacheHitRate: state.performanceMetrics.cacheHitRate,
      averageQueryTime: state.performanceMetrics.averageQueryTime,
      totalQueries: state.performanceMetrics.totalQueries
    })
  },

  actions: {
    // Audit Entry Management

    /**
     * Add audit entry to store
     */
    addAuditEntry(entry: AuditEntry): void {
      // Remove existing entry with same ID if it exists
      if (this.auditEntriesMap.has(entry.id)) {
        this.removeAuditEntry(entry.id)
      }

      // Add to array and map
      this.auditEntries.push(entry)
      this.auditEntriesMap.set(entry.id, entry)

      // Update search index if built
      if (this.searchIndexBuilt && this.searchIndex) {
        this.searchIndex.addDocument(entry)
      }

      // Update statistics
      this.updateStatistics()
    },

    /**
     * Add multiple audit entries
     */
    addAuditEntries(entries: AuditEntry[]): void {
      entries.forEach(entry => this.addAuditEntry(entry))
    },

    /**
     * Remove audit entry by ID
     */
    removeAuditEntry(id: string): void {
      const entry = this.auditEntriesMap.get(id)
      if (entry) {
        const index = this.auditEntries.findIndex(e => e.id === id)
        if (index !== -1) {
          this.auditEntries.splice(index, 1)
        }
        this.auditEntriesMap.delete(id)

        // Update search index if built
        if (this.searchIndexBuilt && this.searchIndex) {
          this.searchIndex.removeDocument(id)
        }
      }
    },

    /**
     * Update audit entry
     */
    updateAuditEntry(id: string, updates: Partial<AuditEntry>): void {
      const entry = this.auditEntriesMap.get(id)
      if (entry) {
        const updatedEntry = { ...entry, ...updates }
        const index = this.auditEntries.findIndex(e => e.id === id)
        if (index !== -1) {
          this.auditEntries[index] = updatedEntry
        }
        this.auditEntriesMap.set(id, updatedEntry)
      }
    },

    /**
     * Clear all audit entries
     */
    clearAuditEntries(): void {
      this.auditEntries = []
      this.auditEntriesMap.clear()
      this.searchIndex = null
      this.searchIndexBuilt = false
      this.updateStatistics()
    },

    // Verification Management

    /**
     * Add verification result
     */
    addVerificationResult(entryId: string, result: VerificationResult): void {
      this.verificationResults.set(entryId, result)

      // Update the corresponding audit entry
      if (result.valid) {
        this.updateAuditEntry(entryId, { isVerified: true })
      }
    },

    /**
     * Add batch verification result
     */
    addBatchVerificationResult(result: BatchVerificationResult): void {
      this.batchVerifications.push(result)

      // Update individual verification results
      if (result.results) {
        result.results.forEach((verificationResult, index) => {
          if (verificationResult && this.auditEntries[index]) {
            this.addVerificationResult(this.auditEntries[index].id, verificationResult)
          }
        })
      }
    },

    /**
     * Clear verification results
     */
    clearVerificationResults(): void {
      this.verificationResults.clear()
      this.batchVerifications = []
    },

    // Report Management

    /**
     * Add compliance report
     */
    addReport(report: ComplianceReport): void {
      // Remove existing report with same ID if it exists
      if (this.reportsMap.has(report.id)) {
        const index = this.reports.findIndex(r => r.id === report.id)
        if (index !== -1) {
          this.reports.splice(index, 1)
        }
      }

      this.reports.push(report)
      this.reportsMap.set(report.id, report)
    },

    /**
     * Remove report by ID
     */
    removeReport(id: string): void {
      const index = this.reports.findIndex(report => report.id === id)
      if (index !== -1) {
        this.reports.splice(index, 1)
      }
      this.reportsMap.delete(id)
    },

    /**
     * Clear all reports
     */
    clearReports(): void {
      this.reports = []
      this.reportsMap.clear()
    },

    // Export Job Management

    /**
     * Add export job
     */
    addExportJob(job: ExportJob): void {
      this.exportJobs.push(job)
    },

    /**
     * Update export job
     */
    updateExportJob(id: string, updates: Partial<ExportJob>): void {
      const job = this.getExportJobById(id)
      if (job) {
        Object.assign(job, updates)
      }
    },

    /**
     * Remove export job by ID
     */
    removeExportJob(id: string): void {
      const index = this.exportJobs.findIndex(job => job.id === id)
      if (index !== -1) {
        this.exportJobs.splice(index, 1)
      }
    },

    /**
     * Clean up completed export jobs
     */
    cleanupExportJobs(olderThanHours: number = 24): number {
      const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000)
      const initialLength = this.exportJobs.length

      this.exportJobs = this.exportJobs.filter(job =>
        (job.status === 'completed' || job.status === 'failed') &&
        new Date(job.createdAt).getTime() >= cutoffTime
      )

      return initialLength - this.exportJobs.length
    },

    // Filter Preset Management

    /**
     * Save filter preset
     */
    saveFilterPreset(name: string, preset: FilterPreset): void {
      this.filterPresets.set(name, preset)
    },

    /**
     * Load filter preset
     */
    loadFilterPreset(name: string): FilterPreset | undefined {
      return this.filterPresets.get(name)
    },

    /**
     * Delete filter preset
     */
    deleteFilterPreset(name: string): boolean {
      return this.filterPresets.delete(name)
    },

    /**
     * Get all filter presets
     */
    getAllFilterPresets(): Array<{ name: string; preset: FilterPreset }> {
      return Array.from(this.filterPresets.entries()).map(([name, preset]) => ({
        name,
        preset: { ...preset }
      }))
    },

    // Search Index Management

    /**
     * Build search index
     */
    buildSearchIndex(): void {
      try {
        // In a real implementation, use a proper search index library
        // For now, create a simple in-memory index
        this.searchIndex = {
          documents: new Map(this.auditEntries.map(entry => [entry.id, entry])),
          search: (query: string) => {
            const results: Array<{ id: string; score: number }> = []
            const lowercaseQuery = query.toLowerCase()

            this.auditEntries.forEach(entry => {
              let score = 0
              const searchText = `${entry.eventType} ${entry.actor} ${entry.transactionHash} ${JSON.stringify(entry.data)}`.toLowerCase()

              if (searchText.includes(lowercaseQuery)) {
                score += 1
              }

              if (score > 0) {
                results.push({ id: entry.id, score })
              }
            })

            return results.sort((a, b) => b.score - a.score)
          },
          addDocument: (entry: AuditEntry) => {
            this.searchIndex!.documents.set(entry.id, entry)
          },
          removeDocument: (id: string) => {
            this.searchIndex!.documents.delete(id)
          }
        }

        this.searchIndexBuilt = true
      } catch (error) {
        console.error('Error building search index:', error)
      }
    },

    /**
     * Search audit entries
     */
    searchAuditEntries(query: string): AuditEntry[] {
      if (!this.searchIndexBuilt || !this.searchIndex) {
        return []
      }

      const results = this.searchIndex.search(query)
      return results.map(result => this.auditEntriesMap.get(result.id)).filter(Boolean) as AuditEntry[]
    },

    // Alert Management

    /**
     * Add alert
     */
    addAlert(alert: Omit<AuditAlert, 'id' | 'timestamp'>): void {
      const newAlert: AuditAlert = {
        ...alert,
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      }

      this.alerts.unshift(newAlert)

      // Keep only last 1000 alerts
      if (this.alerts.length > 1000) {
        this.alerts = this.alerts.slice(0, 1000)
      }
    },

    /**
     * Mark alert as read
     */
    markAlertAsRead(id: string): void {
      const alert = this.alerts.find(a => a.id === id)
      if (alert) {
        alert.read = true
      }
    },

    /**
     * Mark all alerts as read
     */
    markAllAlertsAsRead(): void {
      this.alerts.forEach(alert => {
        alert.read = true
      })
    },

    /**
     * Remove alert
     */
    removeAlert(id: string): void {
      const index = this.alerts.findIndex(alert => alert.id === id)
      if (index !== -1) {
        this.alerts.splice(index, 1)
      }
    },

    /**
     * Clear all alerts
     */
    clearAlerts(): void {
      this.alerts = []
    },

    // Real-time Updates

    /**
     * Add real-time update
     */
    addRealTimeUpdate(entry: AuditEntry): void {
      this.realTimeUpdates.unshift(entry)
      this.lastRealTimeUpdate = Date.now()

      // Keep only last 100 real-time updates
      if (this.realTimeUpdates.length > 100) {
        this.realTimeUpdates = this.realTimeUpdates.slice(0, 100)
      }

      // Add to main audit entries if auto-refresh is enabled
      if (this.settings.autoRefresh) {
        this.addAuditEntry(entry)
      }
    },

    /**
     * Clear real-time updates
     */
    clearRealTimeUpdates(): void {
      this.realTimeUpdates = []
    },

    // Statistics and Metrics

    /**
     * Update statistics
     */
    updateStatistics(): void {
      try {
        const verifiedCount = this.auditEntries.filter(e => e.isVerified).length
        const flaggedCount = this.auditEntries.filter(e => e.metadata.flaggedForReview).length
        const highRiskCount = this.auditEntries.filter(e =>
          e.complianceImpact.level === 'HIGH' || e.complianceImpact.level === 'CRITICAL'
        ).length

        this.statistics = {
          totalEntries: this.auditEntries.length,
          verifiedEntries: verifiedCount,
          unverifiedEntries: this.auditEntries.length - verifiedCount,
          flaggedEntries: flaggedCount,
          averageRiskScore: 0.3, // Placeholder - calculate from actual data
          highRiskEntries: highRiskCount,
          complianceScore: 0.85, // Placeholder - calculate from actual data
          dataIntegrityScore: verifiedCount / this.auditEntries.length,
          verificationScore: verifiedCount / this.auditEntries.length,
          lastUpdated: Date.now(),
          period: {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: new Date(),
            type: 'monthly'
          }
        }

        this.lastStatisticsUpdate = Date.now()
      } catch (error) {
        console.error('Error updating statistics:', error)
      }
    },

    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(queryTime: number, cacheHit: boolean, error: boolean): void {
      this.performanceMetrics.totalQueries++

      // Update average query time
      this.performanceMetrics.averageQueryTime =
        (this.performanceMetrics.averageQueryTime * (this.performanceMetrics.totalQueries - 1) + queryTime) /
        this.performanceMetrics.totalQueries

      // Update cache hit rate
      const totalQueries = this.performanceMetrics.totalQueries
      const hits = cacheHit ? 1 : 0
      this.performanceMetrics.cacheHitRate =
        ((this.performanceMetrics.cacheHitRate * (totalQueries - 1)) + hits) / totalQueries

      // Update error rate
      this.performanceMetrics.errorRate =
        ((this.performanceMetrics.errorRate * (totalQueries - 1)) + (error ? 1 : 0)) / totalQueries

      this.performanceMetrics.lastUpdated = Date.now()
    },

    // Settings Management

    /**
     * Update settings
     */
    updateSettings(newSettings: Partial<typeof this.settings>): void {
      Object.assign(this.settings, newSettings)
    },

    /**
     * Reset settings to defaults
     */
    resetSettings(): void {
      this.settings = {
        autoRefresh: true,
        refreshInterval: 30000,
        maxCacheSize: 10000,
        enableRealTime: true,
        verificationAutoRun: false,
        exportCompression: true,
        notificationsEnabled: true
      }
    },

    // Cache Management

    /**
     * Clear cache
     */
    clearCache(): void {
      this.auditEntries = []
      this.auditEntriesMap.clear()
      this.verificationResults.clear()
      this.reports = []
      this.reportsMap.clear()
      this.searchIndex = null
      this.searchIndexBuilt = false
      this.lastCacheUpdate = 0
    },

    /**
     * Refresh cache
     */
    async refreshCache(): Promise<void> {
      this.clearCache()
      // In a real implementation, fetch fresh data from API
      this.lastCacheUpdate = Date.now()
    },

    /**
     * Check if cache needs refresh
     */
    needsCacheRefresh(): boolean {
      return this.isCacheExpired || this.auditEntries.length === 0
    }
  }
})
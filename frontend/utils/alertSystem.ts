/**
 * Alert System Utility
 * Epic 5.4 - Real-time Monitoring and Alerts
 */

import type { OperationalAlert, AlertSettings } from '~/composables/useOperationalMetrics'

export class AlertSystem {
  private alerts: Map<string, OperationalAlert> = new Map()
  private listeners: Array<(alert: OperationalAlert) => void> = []
  private monitoringInterval: NodeJS.Timeout | null = null
  private thresholds: AlertSettings

  constructor(initialThresholds: AlertSettings) {
    this.thresholds = { ...initialThresholds }
    this.startMonitoring()
  }

  /**
   * Start monitoring for alert conditions
   */
  startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
    }

    // Check alert conditions every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.checkAlertConditions()
    }, 30000)
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
  }

  /**
   * Check for alert conditions across all contracts
   */
  private async checkAlertConditions(): Promise<void> {
    try {
      // In a full implementation, this would:
      // 1. Query all active contracts
      // 2. Check funding progress against thresholds
      // 3. Check repayment schedules
      // 4. Monitor risk scores
      // 5. Check for unusual activity patterns

      // For now, implement basic alert condition checks
      await this.checkFundingAlerts()
      await this.checkRepaymentAlerts()
      await this.checkRiskAlerts()
      await this.checkPerformanceAlerts()

    } catch (error) {
      console.error('Error checking alert conditions:', error)
    }
  }

  /**
   * Check funding-related alerts
   */
  private async checkFundingAlerts(): Promise<void> {
    // Implementation would check:
    // - Low funding progress
    // - Funding approaching deadline
    // - Large single investments
    // - Rapid funding changes

    // Mock alert for demonstration
    const mockFundingAlert: OperationalAlert = {
      id: this.generateAlertId(),
      contractAddress: '0x1234567890123456789012345678901234567890',
      type: 'info',
      severity: 'medium',
      title: 'Funding Progress Alert',
      message: 'Contract funding is at 45% with 7 days remaining',
      timestamp: new Date(),
      dismissed: false,
      requiresAction: false,
      actions: [
        {
          label: 'View Contract',
          action: () => console.log('Navigate to contract'),
          variant: 'primary'
        }
      ]
    }

    // Only trigger if condition is met (in real implementation)
    // this.triggerAlert(mockFundingAlert)
  }

  /**
   * Check repayment-related alerts
   */
  private async checkRepaymentAlerts(): Promise<void> {
    // Implementation would check:
    // - Overdue payments
    // - Late repayments
    // - Payment schedule deviations
    // - Insufficient funds for distributions

    const mockRepaymentAlert: OperationalAlert = {
      id: this.generateAlertId(),
      contractAddress: '0x1234567890123456789012345678901234567890',
      type: 'warning',
      severity: 'high',
      title: 'Payment Overdue',
      message: 'Monthly payment is 3 days overdue for contract #123',
      timestamp: new Date(),
      dismissed: false,
      requiresAction: true,
      actions: [
        {
          label: 'Contact Borrower',
          action: () => console.log('Open borrower contact'),
          variant: 'primary'
        },
        {
          label: 'Grant Extension',
          action: () => console.log('Open extension dialog'),
          variant: 'secondary'
        },
        {
          label: 'Send Reminder',
          action: () => console.log('Send payment reminder'),
          variant: 'primary'
        }
      ]
    }

    // this.triggerAlert(mockRepaymentAlert)
  }

  /**
   * Check risk-related alerts
   */
  private async checkRiskAlerts(): Promise<void> {
    // Implementation would check:
    // - High concentration of investors
    // - Unusual payment patterns
    // - Market risk indicators
    // - Compliance issues

    const mockRiskAlert: OperationalAlert = {
      id: this.generateAlertId(),
      contractAddress: '0x1234567890123456789012345678901234567890',
      type: 'error',
      severity: 'critical',
      title: 'High Risk Detected',
      message: 'Contract risk score has increased to 85% due to concentration risk',
      timestamp: new Date(),
      dismissed: false,
      requiresAction: true,
      actions: [
        {
          label: 'Review Risk Factors',
          action: () => console.log('Open risk analysis'),
          variant: 'primary'
        },
        {
          label: 'Notify Compliance',
          action: () => console.log('Send compliance notification'),
          variant: 'danger'
        }
      ]
    }

    // this.triggerAlert(mockRiskAlert)
  }

  /**
   * Check performance-related alerts
   */
  private async checkPerformanceAlerts(): Promise<void> {
    // Implementation would check:
    // - Poor investment rates
    // - Low distribution efficiency
    // - Gas usage anomalies
    // - Network congestion impacts

    const mockPerformanceAlert: OperationalAlert = {
      id: this.generateAlertId(),
      contractAddress: '0x1234567890123456789012345678901234567890',
      type: 'warning',
      severity: 'low',
      title: 'Performance Degradation',
      message: 'Contract efficiency has dropped by 15% in the last week',
      timestamp: new Date(),
      dismissed: false,
      requiresAction: false
    }

    // this.triggerAlert(mockPerformanceAlert)
  }

  /**
   * Trigger an alert
   */
  triggerAlert(alert: OperationalAlert): void {
    // Add to alerts map
    this.alerts.set(alert.id, alert)

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(alert)
      } catch (error) {
        console.error('Error in alert listener:', error)
      }
    })

    // Send notifications if enabled
    if (this.thresholds.enableNotifications) {
      this.sendNotifications(alert)
    }

    // Log alert for audit trail
    this.logAlert(alert)
  }

  /**
   * Add alert listener
   */
  addAlertListener(listener: (alert: OperationalAlert) => void): void {
    this.listeners.push(listener)
  }

  /**
   * Remove alert listener
   */
  removeAlertListener(listener: (alert: OperationalAlert) => void): void {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): OperationalAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.dismissed)
  }

  /**
   * Get dismissed alerts
   */
  getDismissedAlerts(): OperationalAlert[] {
    return Array.from(this.alerts.values()).filter(alert => alert.dismissed)
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): OperationalAlert[] {
    return Array.from(this.alerts.values())
  }

  /**
   * Dismiss an alert
   */
  dismissAlert(alertId: string): void {
    const alert = this.alerts.get(alertId)
    if (alert) {
      alert.dismissed = true
      this.alerts.set(alertId, alert)
    }
  }

  /**
   * Clear all dismissed alerts
   */
  clearDismissedAlerts(): void {
    const activeAlerts = this.getActiveAlerts()
    this.alerts.clear()
    activeAlerts.forEach(alert => {
      this.alerts.set(alert.id, alert)
    })
  }

  /**
   * Update alert thresholds
   */
  updateThresholds(newThresholds: Partial<AlertSettings>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds }
  }

  /**
   * Get current thresholds
   */
  getThresholds(): AlertSettings {
    return { ...this.thresholds }
  }

  /**
   * Send notifications for an alert
   */
  private async sendNotifications(alert: OperationalAlert): Promise<void> {
    try {
      // Email notifications
      if (this.thresholds.emailAlerts && alert.severity !== 'low') {
        await this.sendEmailNotification(alert)
      }

      // SMS notifications
      if (this.thresholds.smsAlerts && (alert.severity === 'high' || alert.severity === 'critical')) {
        await this.sendSMSNotification(alert)
      }

    } catch (error) {
      console.error('Error sending notifications:', error)
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(alert: OperationalAlert): Promise<void> {
    // Implementation would integrate with email service
    console.log('Email notification sent for alert:', alert.title)
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(alert: OperationalAlert): Promise<void> {
    // Implementation would integrate with SMS service
    console.log('SMS notification sent for alert:', alert.title)
  }

  /**
   * Log alert for audit trail
   */
  private async logAlert(alert: OperationalAlert): Promise<void> {
    // Implementation would store alert in database
    console.log('Alert logged:', {
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      timestamp: alert.timestamp,
      contractAddress: alert.contractAddress
    })
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get alert statistics
   */
  getAlertStats(): {
    total: number
    active: number
    dismissed: number
    byType: Record<string, number>
    bySeverity: Record<string, number>
  } {
    const alerts = this.getAllAlerts()
    const activeAlerts = this.getActiveAlerts()
    const dismissedAlerts = this.getDismissedAlerts()

    const byType: Record<string, number> = {}
    const bySeverity: Record<string, number> = {}

    alerts.forEach(alert => {
      byType[alert.type] = (byType[alert.type] || 0) + 1
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1
    })

    return {
      total: alerts.length,
      active: activeAlerts.length,
      dismissed: dismissedAlerts.length,
      byType,
      bySeverity
    }
  }

  /**
   * Check if contract has active alerts
   */
  hasContractAlerts(contractAddress: string): boolean {
    return this.getActiveAlerts().some(alert => alert.contractAddress === contractAddress)
  }

  /**
   * Get alerts for specific contract
   */
  getContractAlerts(contractAddress: string): OperationalAlert[] {
    return this.getActiveAlerts().filter(alert => alert.contractAddress === contractAddress)
  }

  /**
   * Clear all alerts for a contract
   */
  clearContractAlerts(contractAddress: string): void {
    const otherAlerts = this.getActiveAlerts().filter(alert => alert.contractAddress !== contractAddress)
    this.alerts.clear()
    otherAlerts.forEach(alert => {
      this.alerts.set(alert.id, alert)
    })
  }

  /**
   * Export alerts for reporting
   */
  exportAlerts(format: 'json' | 'csv' = 'json'): string {
    const alerts = this.getAllAlerts().map(alert => ({
      id: alert.id,
      contractAddress: alert.contractAddress,
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      timestamp: alert.timestamp.toISOString(),
      dismissed: alert.dismissed,
      requiresAction: alert.requiresAction
    }))

    if (format === 'json') {
      return JSON.stringify(alerts, null, 2)
    } else {
      // CSV format
      const headers = ['ID', 'Contract Address', 'Type', 'Severity', 'Title', 'Message', 'Timestamp', 'Dismissed', 'Requires Action']
      const rows = alerts.map(alert => [
        alert.id,
        alert.contractAddress,
        alert.type,
        alert.severity,
        alert.title,
        alert.message,
        alert.timestamp,
        alert.dismissed.toString(),
        alert.requiresAction.toString()
      ])

      return [headers, ...rows].map(row => row.join(',')).join('\n')
    }
  }

  /**
   * Destroy alert system and cleanup
   */
  destroy(): void {
    this.stopMonitoring()
    this.alerts.clear()
    this.listeners = []
  }
}

/**
 * Default alert thresholds
 */
export const getDefaultAlertThresholds = (): AlertSettings => ({
  fundingThresholds: {
    low: 10,    // Alert if funding < 10%
    high: 90    // Alert if funding > 90% (near completion)
  },
  repaymentThresholds: {
    late: 7,    // Alert if payment is 7+ days late
    overdue: 14 // Alert if payment is 14+ days late
  },
  riskThresholds: {
    moderate: 50, // Alert if risk score >= 50%
    high: 75,     // Alert if risk score >= 75%
    critical: 90  // Alert if risk score >= 90%
  },
  enableNotifications: true,
  emailAlerts: true,
  smsAlerts: false
})

/**
 * Create global alert system instance
 */
export let globalAlertSystem: AlertSystem | null = null

export const initializeAlertSystem = (thresholds?: Partial<AlertSettings>): AlertSystem => {
  if (globalAlertSystem) {
    globalAlertSystem.destroy()
  }

  const defaultThresholds = getDefaultAlertThresholds()
  const finalThresholds = thresholds ? { ...defaultThresholds, ...thresholds } : defaultThresholds

  globalAlertSystem = new AlertSystem(finalThresholds)
  return globalAlertSystem
}

export const getAlertSystem = (): AlertSystem => {
  if (!globalAlertSystem) {
    return initializeAlertSystem()
  }
  return globalAlertSystem
}
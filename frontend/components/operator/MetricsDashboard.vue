<template>
  <div class="metrics-dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <div class="header-content">
        <h1 class="dashboard-title">Operational Metrics Dashboard</h1>
        <p class="dashboard-subtitle">Real-time monitoring and analytics for your mortgage portfolio</p>
      </div>
      <div class="header-actions">
        <UButton
          icon="i-heroicons-arrow-path"
          variant="outline"
          :loading="isCalculatingMetrics"
          @click="refreshMetrics"
        >
          Refresh
        </UButton>
        <UButton
          icon="i-heroicons-document-arrow-down"
          @click="showReportDialog = true"
        >
          Generate Report
        </UButton>
      </div>
    </div>

    <!-- Alerts Panel -->
    <div v-if="hasActiveAlerts" class="alerts-section">
      <AlertsPanel
        :alerts="activeAlerts"
        @dismiss="dismissAlert"
        @view-details="viewAlertDetails"
      />
    </div>

    <!-- Portfolio Overview Cards -->
    <div class="portfolio-overview">
      <h2 class="section-title">Portfolio Overview</h2>
      <div class="metrics-grid">
        <MetricsCard
          v-for="metric in portfolioMetricsCards"
          :key="metric.key"
          :title="metric.title"
          :value="metric.value"
          :change="metric.change"
          :icon="metric.icon"
          :color="metric.color"
          :loading="isCalculatingMetrics"
        />
      </div>
    </div>

    <!-- Charts Section -->
    <div class="charts-section">
      <div class="charts-grid">
        <!-- Portfolio Performance Chart -->
        <div class="chart-container">
          <h3 class="chart-title">Portfolio Performance</h3>
          <PortfolioPerformanceChart
            :data="chartData.portfolioPerformance"
            :loading="isCalculatingMetrics"
          />
        </div>

        <!-- Risk Distribution Chart -->
        <div class="chart-container">
          <h3 class="chart-title">Risk Distribution</h3>
          <RiskDistributionChart
            :data="chartData.riskDistribution"
            :loading="isCalculatingMetrics"
          />
        </div>

        <!-- Stage Progress Chart -->
        <div class="chart-container">
          <h3 class="chart-title">Contract Stage Progress</h3>
          <StageProgressChart
            :data="chartData.stageProgress"
            :loading="isCalculatingMetrics"
          />
        </div>

        <!-- Investment Trends Chart -->
        <div class="chart-container">
          <h3 class="chart-title">Investment Trends</h3>
          <InvestmentTrendsChart
            :data="chartData.investmentTrends"
            :loading="isCalculatingMetrics"
          />
        </div>
      </div>
    </div>

    <!-- Contract Analytics Table -->
    <div class="contract-analytics">
      <div class="section-header">
        <h2 class="section-title">Contract Analytics</h2>
        <div class="section-actions">
          <USelectMenu
            v-model="stageFilter"
            :options="stageOptions"
            placeholder="Filter by stage"
            class="stage-filter"
          />
          <UInput
            v-model="searchQuery"
            placeholder="Search contracts..."
            icon="i-heroicons-magnifying-glass"
            class="search-input"
          />
        </div>
      </div>

      <ContractAnalyticsTable
        :contracts="filteredContracts"
        :loading="isCalculatingMetrics"
        @view-details="viewContractDetails"
        @export-data="exportContractData"
      />
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <h2 class="section-title">Quick Actions</h2>
      <div class="actions-grid">
        <QuickActionCard
          v-for="action in quickActions"
          :key="action.key"
          :title="action.title"
          :description="action.description"
          :icon="action.icon"
          :color="action.color"
          @click="action.handler"
        />
      </div>
    </div>

    <!-- Report Generation Dialog -->
    <UModal v-model="showReportDialog" :ui="{ width: 'sm:max-w-2xl' }">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Generate Operational Report</h3>
        </template>

        <div class="report-form">
          <UFormGroup label="Report Type" required>
            <USelectMenu
              v-model="reportConfig.title"
              :options="reportTypeOptions"
              placeholder="Select report type"
            />
          </UFormGroup>

          <UFormGroup label="Date Range">
            <VDatePicker
              v-model="reportDateRange"
              :range="true"
              :max-date="new Date()"
              mode="date"
            />
          </UFormGroup>

          <UFormGroup label="Format">
            <URadioGroup
              v-model="reportConfig.format"
              :options="formatOptions"
            />
          </UFormGroup>

          <UFormGroup label="Include Charts">
            <UToggle v-model="reportConfig.includeCharts" />
          </UFormGroup>

          <UFormGroup label="Include Timeline">
            <UToggle v-model="reportConfig.includeTimeline" />
          </UFormGroup>

          <UFormGroup label="Include Raw Data">
            <UToggle v-model="reportConfig.includeRawData" />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="dialog-actions">
            <UButton variant="outline" @click="showReportDialog = false">
              Cancel
            </UButton>
            <UButton
              :loading="isGeneratingReport"
              icon="i-heroicons-document-arrow-down"
              @click="generateReport"
            >
              Generate Report
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Contract Details Modal -->
    <UModal v-model="showContractDetails" :ui="{ width: 'sm:max-w-4xl' }">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Contract Details</h3>
        </template>

        <ContractDetails
          v-if="selectedContract"
          :contract="selectedContract"
          @close="showContractDetails = false"
        />

        <template #footer>
          <UButton @click="showContractDetails = false">
            Close
          </UButton>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useOperationalMetrics } from '~/composables/useOperationalMetrics'
import { getAlertSystem } from '~/utils/alertSystem'
import type { OperationalAlert, ContractAnalytics, ReportConfig } from '~/composables/useOperationalMetrics'

// Composables
const {
  portfolioMetrics,
  contractAnalytics,
  activeAlerts,
  metricsStatus,
  isCalculatingMetrics,
  calculatePortfolioMetrics,
  getPortfolioAnalytics,
  dismissAlert
} = useOperationalMetrics()

// Alert System
const alertSystem = getAlertSystem()

// Reactive state
const showReportDialog = ref(false)
const showContractDetails = ref(false)
const selectedContract = ref<ContractAnalytics | null>(null)
const stageFilter = ref('all')
const searchQuery = ref('')
const isGeneratingReport = ref(false)

// Report configuration
const reportConfig = ref<ReportConfig>({
  title: '',
  includeCharts: true,
  includeTimeline: false,
  includeRawData: false,
  format: 'pdf'
})

const reportDateRange = ref<[Date, Date]>([
  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  new Date()
])

// Options
const reportTypeOptions = [
  { label: 'Portfolio Summary', value: 'Portfolio Summary Report' },
  { label: 'Detailed Analysis', value: 'Detailed Contract Analysis' },
  { label: 'Compliance Report', value: 'Compliance and Risk Report' },
  { label: 'Investor Report', value: 'Investment Performance Report' }
]

const formatOptions = [
  { label: 'PDF', value: 'pdf' },
  { label: 'CSV', value: 'csv' },
  { label: 'JSON', value: 'json' }
]

const stageOptions = [
  { label: 'All Stages', value: 'all' },
  { label: 'Not Started', value: 0 },
  { label: 'Funding', value: 1 },
  { label: 'Funded', value: 2 },
  { label: 'Active', value: 3 },
  { label: 'Repaid', value: 4 }
]

// Quick actions
const quickActions = [
  {
    key: 'new-contract',
    title: 'Deploy New Contract',
    description: 'Create and deploy a new mortgage contract',
    icon: 'i-heroicons-plus-circle',
    color: 'blue',
    handler: () => navigateTo('/operator/deploy')
  },
  {
    key: 'manage-stages',
    title: 'Manage Stages',
    description: 'Control contract stage transitions',
    icon: 'i-heroicons-arrow-path',
    color: 'green',
    handler: () => navigateTo('/operator/stage-management')
  },
  {
    key: 'loan-operations',
    title: 'Loan Operations',
    description: 'Manage loan withdrawals and repayments',
    icon: 'i-heroicons-banknotes',
    color: 'yellow',
    handler: () => navigateTo('/operator/loan-operations')
  },
  {
    key: 'alerts',
    title: 'Alert Settings',
    description: 'Configure monitoring and alerts',
    icon: 'i-heroicons-bell',
    color: 'red',
    handler: () => navigateTo('/operator/alerts')
  }
]

// Computed properties
const hasActiveAlerts = computed(() => activeAlerts.value.length > 0)

const portfolioMetricsCards = computed(() => {
  const metrics = portfolioMetrics.value
  if (!metrics) return []

  return [
    {
      key: 'total-funded',
      title: 'Total Funded',
      value: metrics.totalFunded,
      change: null,
      icon: 'i-heroicons-banknotes',
      color: 'blue'
    },
    {
      key: 'active-contracts',
      title: 'Active Contracts',
      value: metrics.activeContracts.toString(),
      change: null,
      icon: 'i-heroicons-building-office',
      color: 'green'
    },
    {
      key: 'total-investors',
      title: 'Total Investors',
      value: metrics.totalInvestors.toString(),
      change: null,
      icon: 'i-heroicons-users',
      color: 'purple'
    },
    {
      key: 'portfolio-health',
      title: 'Portfolio Health',
      value: metrics.portfolioHealth.toUpperCase(),
      change: null,
      icon: 'i-heroicons-heart',
      color: getHealthColor(metrics.portfolioHealth)
    }
  ]
})

const chartData = computed(() => {
  const contracts = contractAnalytics.value

  return {
    portfolioPerformance: {
      totalValue: contracts.reduce((sum, c) => sum + parseFloat(c.totalDistributed.replace(/[^0-9.-]/g, '')), 0),
      contractsByStage: getContractsByStage(contracts),
      riskDistribution: getRiskDistribution(contracts),
      performanceMetrics: contracts.map(c => ({
        name: c.propertyName,
        efficiency: c.efficiencyScore,
        risk: c.riskScore
      }))
    },
    riskDistribution: getRiskDistribution(contracts),
    stageProgress: getContractsByStage(contracts),
    investmentTrends: contracts.map(c => ({
      contract: c.propertyName,
      invested: parseFloat(c.averageInvestment.replace(/[^0-9.-]/g, '')),
      distributed: parseFloat(c.totalDistributed.replace(/[^0-9.-]/g, '')),
      roi: c.efficiencyScore
    }))
  }
})

const filteredContracts = computed(() => {
  let contracts = contractAnalytics.value

  // Filter by stage
  if (stageFilter.value !== 'all') {
    contracts = contracts.filter(contract => contract.stage === stageFilter.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    contracts = contracts.filter(contract =>
      contract.propertyName.toLowerCase().includes(query) ||
      contract.address.toLowerCase().includes(query)
    )
  }

  return contracts
})

// Methods
const refreshMetrics = async () => {
  try {
    await Promise.all([
      calculatePortfolioMetrics(),
      getPortfolioAnalytics()
    ])
  } catch (error) {
    console.error('Failed to refresh metrics:', error)
  }
}

const dismissAlert = (alertId: string) => {
  alertSystem.dismissAlert(alertId)
}

const viewAlertDetails = (alert: OperationalAlert) => {
  // Navigate to alert details or show more information
  console.log('View alert details:', alert)
}

const viewContractDetails = (contract: ContractAnalytics) => {
  selectedContract.value = contract
  showContractDetails.value = true
}

const exportContractData = (contracts: ContractAnalytics[]) => {
  // Export contract data to CSV or other format
  const data = contracts.map(contract => ({
    Address: contract.address,
    Property: contract.propertyName,
    Stage: contract.stageName,
    'Funding Progress': `${contract.fundingProgress}%`,
    Investors: contract.investorCount,
    'Average Investment': contract.averageInvestment,
    'Total Distributed': contract.totalDistributed,
    'Risk Score': contract.riskScore,
    'Efficiency Score': contract.efficiencyScore
  }))

  const csv = [
    Object.keys(data[0]).join(','),
    ...data.map(row => Object.values(row).join(','))
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `contract-analytics-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const generateReport = async () => {
  isGeneratingReport.value = true

  try {
    // This would integrate with the report generator utility
    console.log('Generating report with config:', reportConfig.value)
    console.log('Date range:', reportDateRange.value)

    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Show success message
    useToast().add({
      title: 'Report Generated',
      description: 'Your operational report has been generated successfully.',
      color: 'green'
    })

    showReportDialog.value = false
  } catch (error) {
    console.error('Failed to generate report:', error)
    useToast().add({
      title: 'Report Generation Failed',
      description: 'There was an error generating your report. Please try again.',
      color: 'red'
    })
  } finally {
    isGeneratingReport.value = false
  }
}

// Helper functions
const getHealthColor = (health: string): string => {
  switch (health) {
    case 'excellent': return 'green'
    case 'good': return 'blue'
    case 'fair': return 'yellow'
    case 'poor': return 'red'
    default: return 'gray'
  }
}

const getContractsByStage = (contracts: ContractAnalytics[]) => {
  return contracts.reduce((acc, contract) => {
    const stage = contract.stageName
    acc[stage] = (acc[stage] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}

const getRiskDistribution = (contracts: ContractAnalytics[]) => {
  return contracts.reduce((acc, contract) => {
    if (contract.riskScore < 30) acc.low = (acc.low || 0) + 1
    else if (contract.riskScore < 70) acc.moderate = (acc.moderate || 0) + 1
    else acc.high = (acc.high || 0) + 1
    return acc
  }, { low: 0, moderate: 0, high: 0 })
}

// Lifecycle
onMounted(async () => {
  // Set up alert listener
  alertSystem.addAlertListener((alert) => {
    useToast().add({
      title: alert.title,
      description: alert.message,
      color: alert.type === 'error' ? 'red' : alert.type === 'warning' ? 'yellow' : 'blue',
      timeout: 5000
    })
  })

  // Load initial data
  await refreshMetrics()
})

onUnmounted(() => {
  alertSystem.removeAlertListener(() => {})
})

// Watch for changes in filters
watch([stageFilter, searchQuery], () => {
  // Filters are reactive, no additional action needed
})
</script>

<style scoped>
.metrics-dashboard {
  @apply space-y-6 p-6;
}

.dashboard-header {
  @apply flex justify-between items-start;
}

.header-content {
  @apply flex-1;
}

.dashboard-title {
  @apply text-2xl font-bold text-gray-900 dark:text-white mb-2;
}

.dashboard-subtitle {
  @apply text-gray-600 dark:text-gray-400;
}

.header-actions {
  @apply flex gap-3;
}

.alerts-section {
  @apply mb-6;
}

.portfolio-overview {
  @apply space-y-4;
}

.section-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-4;
}

.metrics-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.charts-section {
  @apply space-y-4;
}

.charts-grid {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
}

.chart-container {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow p-6;
}

.chart-title {
  @apply text-lg font-medium text-gray-900 dark:text-white mb-4;
}

.contract-analytics {
  @apply space-y-4;
}

.section-header {
  @apply flex justify-between items-center;
}

.section-actions {
  @apply flex gap-3;
}

.stage-filter {
  @apply w-48;
}

.search-input {
  @apply w-64;
}

.quick-actions {
  @apply space-y-4;
}

.actions-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.report-form {
  @apply space-y-4;
}

.dialog-actions {
  @apply flex justify-end gap-3;
}
</style>
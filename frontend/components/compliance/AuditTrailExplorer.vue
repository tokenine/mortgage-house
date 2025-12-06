<!--
  Audit Trail Explorer Component
  Epic 6.2 - Comprehensive Audit Trail and Logging System
  Main interface for exploring and analyzing audit trail data
-->

<template>
  <div class="audit-trail-explorer">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Audit Trail Explorer</h1>
      <p class="text-gray-600">Comprehensive audit trail analysis and compliance reporting</p>
    </div>

    <!-- Statistics Overview -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Total Entries"
        :value="statistics?.totalEntries || 0"
        icon="document-text"
        color="blue"
        :loading="isLoading"
      />
      <StatCard
        title="Verified Entries"
        :value="statistics?.verifiedEntries || 0"
        icon="check-circle"
        color="green"
        :loading="isLoading"
      />
      <StatCard
        title="Flagged Activities"
        :value="statistics?.flaggedEntries || 0"
        icon="exclamation-triangle"
        color="yellow"
        :loading="isLoading"
      />
      <StatCard
        title="Compliance Score"
        :value="formatPercentage(statistics?.complianceScore || 0)"
        icon="shield-check"
        color="purple"
        :loading="isLoading"
      />
    </div>

    <!-- Filters Panel -->
    <UCard class="mb-6">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Filters & Search</h3>
          <div class="flex items-center space-x-2">
            <UButton
              variant="outline"
              size="sm"
              @click="showFilters = !showFilters"
            >
              <UIcon name="filter" class="mr-2" />
              {{ showFilters ? 'Hide' : 'Show' }} Filters
            </UButton>
            <UButton
              variant="outline"
              size="sm"
              @click="exportAuditData"
              :loading="isExporting"
              :disabled="auditData.length === 0"
            >
              <UIcon name="download" class="mr-2" />
              Export
            </UButton>
          </div>
        </div>
      </template>

      <!-- Search Bar -->
      <div class="mb-4">
        <UInput
          v-model="searchQuery"
          placeholder="Search audit trail..."
          icon="search"
          size="lg"
          @input="debouncedSearch"
        />
      </div>

      <!-- Advanced Filters -->
      <div v-show="showFilters" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Date Range Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <div class="flex space-x-2">
              <UInput
                v-model="filters.dateRange.start"
                type="date"
                placeholder="Start Date"
              />
              <UInput
                v-model="filters.dateRange.end"
                type="date"
                placeholder="End Date"
              />
            </div>
          </div>

          <!-- Event Types Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Event Types</label>
            <USelectMenu
              v-model="filters.eventTypes"
              :options="eventTypes"
              multiple
              placeholder="Select event types"
              searchable
            />
          </div>

          <!-- Compliance Impact Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Compliance Impact</label>
            <USelectMenu
              v-model="filters.complianceImpact"
              :options="complianceLevels"
              multiple
              placeholder="Select impact levels"
            />
          </div>

          <!-- Verification Status Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Verification Status</label>
            <USelectMenu
              v-model="filters.isVerified"
              :options="verificationOptions"
              placeholder="Select status"
            />
          </div>

          <!-- Actors Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Actors</label>
            <UInput
              v-model="actorsInput"
              placeholder="Enter addresses (comma separated)"
              @blur="updateActorsFilter"
            />
          </div>

          <!-- Contracts Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Contracts</label>
            <UInput
              v-model="contractsInput"
              placeholder="Enter addresses (comma separated)"
              @blur="updateContractsFilter"
            />
          </div>
        </div>

        <!-- Filter Actions -->
        <div class="flex items-center justify-between pt-4 border-t">
          <div class="text-sm text-gray-600">
            {{ hasActiveFilters ? `${totalCount} filtered results` : `${totalCount} total entries` }}
          </div>
          <div class="flex items-center space-x-2">
            <UButton
              variant="outline"
              size="sm"
              @click="clearFilters"
              :disabled="!hasActiveFilters"
            >
              Clear Filters
            </UButton>
            <UButton
              size="sm"
              @click="applyFilters"
            >
              Apply Filters
            </UButton>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Quick Actions -->
    <div class="flex flex-wrap gap-2 mb-6">
      <UButton
        variant="outline"
        size="sm"
        @click="loadFilterPreset('last_24_hours')"
      >
        Last 24 Hours
      </UButton>
      <UButton
        variant="outline"
        size="sm"
        @click="loadFilterPreset('last_7_days')"
      >
        Last 7 Days
      </UButton>
      <UButton
        variant="outline"
        size="sm"
        @click="loadFilterPreset('high_risk')"
      >
        High Risk
      </UButton>
      <UButton
        variant="outline"
        size="sm"
        @click="loadFilterPreset('unverified')"
      >
        Unverified
      </UButton>
      <UButton
        variant="outline"
        size="sm"
        @click="generateComplianceReport"
      >
        <UIcon name="document-text" class="mr-2" />
        Compliance Report
      </UButton>
      <UButton
        variant="outline"
        size="sm"
        @click="verifyAuditIntegrity"
        :loading="isVerifying"
      >
        <UIcon name="shield-check" class="mr-2" />
        Verify Integrity
      </UButton>
    </div>

    <!-- Audit Data Table -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Audit Entries</h3>
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-600">
              Showing {{ auditData.length }} of {{ totalCount }} entries
            </span>
            <USelectMenu
              v-model="pageSize"
              :options="[25, 50, 100, 200]"
              @change="handlePageSizeChange"
            />
          </div>
        </div>
      </template>

      <AuditDataTable
        :data="auditData"
        :loading="isLoading"
        @row-click="showAuditDetails"
      />

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="mt-4">
        <UPagination
          v-model="currentPage"
          :page-count="totalPages"
          :total="totalCount"
          :per-page="pageSize"
          @update:model-value="handlePageChange"
        />
      </div>
    </UCard>

    <!-- Transaction Details Modal -->
    <TransactionDetailsModal
      v-model="showDetailsModal"
      :transaction="selectedTransaction"
      :context="transactionContext"
    />

    <!-- Verification Results Modal -->
    <VerificationResultsModal
      v-model="showVerificationModal"
      :results="verificationResults"
    />

    <!-- Compliance Report Modal -->
    <ComplianceReportModal
      v-model="showReportModal"
      :report="complianceReport"
    />

    <!-- Export Progress Modal -->
    <UProgressModal
      v-model="showExportModal"
      title="Exporting Audit Data"
      :progress="exportProgress"
      :status="exportStatus"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { debounce } from 'lodash-es'
import { useAuditTrail } from '~/composables/useAuditTrail'
import { useAuditStore } from '~/stores/audit'
import { createAuditVerifier } from '~/utils/auditVerification'
import { createComplianceReporter } from '~/utils/complianceReporting'
import { createAuditFilterManager } from '~/utils/auditFilters'
import type {
  AuditEntry,
  TransactionContext,
  ComplianceReport,
  VerificationResult,
  BatchVerificationResult
} from '~/types/audit'

// Components
import StatCard from '~/components/common/StatCard.vue'
import AuditDataTable from './AuditDataTable.vue'
import TransactionDetailsModal from './TransactionDetailsModal.vue'
import VerificationResultsModal from './VerificationResultsModal.vue'
import ComplianceReportModal from './ComplianceReportModal.vue'

// State
const {
  auditData,
  filters,
  isLoading,
  totalCount,
  currentPage,
  pageSize,
  searchQuery,
  statistics,
  fetchAuditData,
  getTransactionContext,
  generateComplianceReport: generateReport,
  exportAuditData: exportData,
  applyFilters: applyAuditFilters,
  clearFilters: clearAuditFilters,
  handlePageChange: handlePageChange,
  handlePageSizeChange: handlePageSizeChange
} = useAuditTrail()

const auditStore = useAuditStore()
const filterManager = createAuditFilterManager()
const verifier = createAuditVerifier()
const complianceReporter = createComplianceReporter()

// UI State
const showFilters = ref(false)
const showDetailsModal = ref(false)
const showVerificationModal = ref(false)
const showReportModal = ref(false)
const showExportModal = ref(false)

// Data
const selectedTransaction = ref<AuditEntry | null>(null)
const transactionContext = ref<TransactionContext | null>(null)
const verificationResults = ref<BatchVerificationResult | null>(null)
const complianceReport = ref<ComplianceReport | null>(null)

// Loading states
const isExporting = ref(false)
const isVerifying = ref(false)
const exportProgress = ref(0)
const exportStatus = ref('preparing')

// Filter inputs
const actorsInput = ref('')
const contractsInput = ref('')

// Computed
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value))
const hasActiveFilters = computed(() => Object.keys(filters.value).length > 0)

// Options
const eventTypes = [
  { label: 'Investment Events', value: ['INVESTMENT_INITIATED', 'INVESTMENT_CONFIRMED', 'INVESTMENT_FAILED'] },
  { label: 'Withdrawal Events', value: ['WITHDRAWAL_INITIATED', 'WITHDRAWAL_CONFIRMED', 'WITHDRAWAL_FAILED'] },
  { label: 'Contract Events', value: ['CONTRACT_DEPLOYED', 'CONTRACT_UPGRADED'] },
  { label: 'Stage Events', value: ['STAGE_TRANSITION', 'FUNDING_STARTED'] },
  { label: 'Operator Events', value: ['OPERATOR_LOGIN', 'OPERATOR_ACTION'] },
  { label: 'Repayment Events', value: ['PRINCIPAL_DEPOSITED', 'INTEREST_DEPOSITED'] },
  { label: 'System Events', value: ['SYSTEM_BACKUP', 'SYSTEM_MAINTENANCE'] }
]

const complianceLevels = [
  { label: 'Critical', value: 'CRITICAL' },
  { label: 'High', value: 'HIGH' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Low', value: 'LOW' }
]

const verificationOptions = [
  { label: 'All', value: undefined },
  { label: 'Verified', value: true },
  { label: 'Unverified', value: false }
]

// Methods
const debouncedSearch = debounce(() => {
  fetchAuditData()
}, 500)

const updateActorsFilter = () => {
  if (actorsInput.value.trim()) {
    filters.value.actors = actorsInput.value.split(',').map(a => a.trim()).filter(a => a)
  } else {
    filters.value.actors = undefined
  }
}

const updateContractsFilter = () => {
  if (contractsInput.value.trim()) {
    filters.value.contracts = contractsInput.value.split(',').map(c => c.trim()).filter(c => c)
  } else {
    filters.value.contracts = undefined
  }
}

const applyFilters = () => {
  applyAuditFilters()
}

const clearFilters = () => {
  clearAuditFilters()
  actorsInput.value = ''
  contractsInput.value = ''
}

const loadFilterPreset = (presetName: string) => {
  const preset = filterManager.loadFilterPreset(presetName)
  if (preset) {
    Object.assign(filters.value, preset)
    applyFilters()
  }
}

const showAuditDetails = async (auditEntry: AuditEntry) => {
  try {
    selectedTransaction.value = auditEntry
    transactionContext.value = await getTransactionContext(auditEntry.transactionHash)
    showDetailsModal.value = true
  } catch (error) {
    console.error('Error fetching transaction context:', error)
  }
}

const generateComplianceReport = async () => {
  try {
    const reportConfig = {
      reportType: 'TRANSACTION_MONITORING' as const,
      format: 'PDF' as const,
      period: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        type: 'monthly' as const
      },
      filters: filters.value,
      includeDetails: true,
      includeVerification: true
    }

    const report = await generateReport(reportConfig)
    complianceReport.value = report
    showReportModal.value = true
  } catch (error) {
    console.error('Error generating compliance report:', error)
  }
}

const verifyAuditIntegrity = async () => {
  try {
    isVerifying.value = true
    const results = await verifier.verifyAuditBatch(auditData.value)
    verificationResults.value = results
    showVerificationModal.value = true
  } catch (error) {
    console.error('Error verifying audit integrity:', error)
  } finally {
    isVerifying.value = false
  }
}

const exportAuditData = async () => {
  try {
    isExporting.value = true
    showExportModal.value = true
    exportStatus.value = 'preparing'
    exportProgress.value = 10

    const result = await exportData({
      format: 'CSV',
      includeHeaders: true,
      includeMetadata: true,
      compress: false
    })

    exportProgress.value = 100
    exportStatus.value = 'completed'

    // Trigger download
    const link = document.createElement('a')
    link.href = result.downloadUrl
    link.download = result.filename
    link.click()

    // Close modal after a delay
    setTimeout(() => {
      showExportModal.value = false
      exportProgress.value = 0
      exportStatus.value = 'preparing'
    }, 2000)
  } catch (error) {
    exportStatus.value = 'error'
    console.error('Error exporting audit data:', error)
  } finally {
    isExporting.value = false
  }
}

const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`
}

// Lifecycle
onMounted(() => {
  fetchAuditData()
})

// Watchers
watch([currentPage, pageSize], () => {
  fetchAuditData()
}, { immediate: true })

watch(filters, () => {
  currentPage.value = 1
  fetchAuditData()
}, { deep: true })
</script>

<style scoped>
.audit-trail-explorer {
  @apply space-y-6;
}
</style>
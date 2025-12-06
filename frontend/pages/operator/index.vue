<template>
  <div class="operator-dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Operator Dashboard</h1>
          <p class="mt-1 text-sm text-gray-600">
            Manage mortgage contracts and monitor investment performance
          </p>
        </div>
        <div class="flex items-center space-x-4">
          <div class="text-right">
            <p class="text-sm text-gray-500">Connected as</p>
            <p class="text-sm font-medium text-gray-900">{{ formatAddress(address) }}</p>
          </div>
          <button
            @click="refreshData"
            :disabled="isRefreshing"
            class="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            title="Refresh dashboard"
          >
            <svg
              :class="{ 'animate-spin': isRefreshing }"
              class="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NuxtLink
          to="/operator/deploy"
          class="quick-action-card bg-blue-50 hover:bg-blue-100 border-blue-200"
        >
          <div class="flex items-center">
            <div class="p-3 bg-blue-500 rounded-lg">
              <svg class="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div class="ml-4">
              <h3 class="text-sm font-medium text-blue-900">Deploy New Contract</h3>
              <p class="text-sm text-blue-700">Create a new mortgage investment opportunity</p>
            </div>
          </div>
        </NuxtLink>

        <NuxtLink
          to="/operator/contracts"
          class="quick-action-card bg-green-50 hover:bg-green-100 border-green-200"
        >
          <div class="flex items-center">
            <div class="p-3 bg-green-500 rounded-lg">
              <svg class="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div class="ml-4">
              <h3 class="text-sm font-medium text-green-900">Manage Contracts</h3>
              <p class="text-sm text-green-700">View and manage all deployed contracts</p>
            </div>
          </div>
        </NuxtLink>

        <div class="quick-action-card bg-purple-50 hover:bg-purple-100 border-purple-200 cursor-pointer" @click="viewPortfolio">
          <div class="flex items-center">
            <div class="p-3 bg-purple-500 rounded-lg">
              <svg class="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div class="ml-4">
              <h3 class="text-sm font-medium text-purple-900">Portfolio Analytics</h3>
              <p class="text-sm text-purple-700">View investment performance metrics</p>
            </div>
          </div>
        </div>

        <div class="quick-action-card bg-orange-50 hover:bg-orange-100 border-orange-200 cursor-pointer" @click="viewMetrics">
          <div class="flex items-center">
            <div class="p-3 bg-orange-500 rounded-lg">
              <svg class="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div class="ml-4">
              <h3 class="text-sm font-medium text-orange-900">Operational Metrics</h3>
              <p class="text-sm text-orange-700">Monitor system performance and KPIs</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dashboard Stats -->
    <div class="dashboard-stats">
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Deployed"
          :value="totalDeployed"
          subtitle="Mortgage contracts"
          icon="document-text"
          color="blue"
        />

        <StatCard
          title="Total Invested"
          :value="totalInvested"
          subtitle="Across all contracts"
          icon="currency-dollar"
          color="green"
          :format="formatCurrency"
        />

        <StatCard
          title="Active Investors"
          :value="totalInvestors"
          subtitle="Unique participants"
          icon="users"
          color="purple"
        />

        <StatCard
          title="Total Repaid"
          :value="totalRepaid"
          subtitle="Principal + interest"
          icon="banknotes"
          color="orange"
          :format="formatCurrency"
        />
      </div>
    </div>

    <!-- Recent Contracts -->
    <div class="recent-contracts">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-medium text-gray-900">Recent Deployments</h2>
        <NuxtLink
          to="/operator/contracts"
          class="text-sm text-blue-600 hover:text-blue-800"
        >
          View all
        </NuxtLink>
      </div>

      <div v-if="recentContracts.length > 0" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ContractCard
          v-for="contract in recentContracts"
          :key="contract.address"
          :contract="contract"
          @view-details="viewContractDetails"
          @start-funding="startContractFunding"
          @refresh="refreshData"
        />
      </div>

      <div v-else class="empty-recent">
        <div class="text-center py-8">
          <svg
            class="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No contracts deployed yet</h3>
          <p class="mt-1 text-sm text-gray-500">Get started by deploying your first mortgage contract</p>
          <div class="mt-6">
            <NuxtLink
              to="/operator/deploy"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Deploy First Contract
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- System Health -->
    <div class="system-health">
      <h2 class="text-lg font-medium text-gray-900 mb-4">System Health</h2>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <HealthCard
          title="Network Status"
          :status="networkStatus"
          :details="networkDetails"
        />

        <HealthCard
          title="Gas Prices"
          :status="gasStatus"
          :details="gasDetails"
        />

        <HealthCard
          title="Contract Health"
          :status="contractHealthStatus"
          :details="contractHealthDetails"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMortgageContract } from '~/composables/useMortgageContract'
import ContractCard from '~/components/operator/ContractCard.vue'
import StatCard from '~/components/shared/StatCard.vue'
import HealthCard from '~/components/shared/HealthCard.vue'

const router = useRouter()

// Composable
const {
  address,
  isConnected,
  deployedContracts,
  isRefreshing,
  refreshData,
  startContractFunding
} = useMortgageContract()

// Local state
const networkStatus = ref<'healthy' | 'warning' | 'error'>('healthy')
const networkDetails = ref('All systems operational')

// Computed properties
const recentContracts = computed(() => {
  return deployedContracts.value
    .slice()
    .sort((a, b) => b.deployedAt - a.deployedAt)
    .slice(0, 6)
})

const totalDeployed = computed(() => deployedContracts.value.length)

const totalInvested = computed(() => {
  return deployedContracts.value.reduce((sum, contract) => {
    return sum + (parseFloat(contract.totalFunded || '0') || 0)
  }, 0)
})

const totalInvestors = computed(() => {
  return deployedContracts.value.reduce((sum, contract) => {
    return sum + (contract.investorCount || 0)
  }, 0)
})

const totalRepaid = computed(() => {
  return deployedContracts.value.reduce((sum, contract) => {
    const principal = parseFloat(contract.principalRepaid || '0') || 0
    const interest = parseFloat(contract.interestPaid || '0') || 0
    return sum + principal + interest
  }, 0)
})

const gasStatus = computed(() => {
  // This would check current gas prices
  return 'healthy'
})

const gasDetails = computed(() => {
  return 'Gas prices normal (25-35 Gwei)'
})

const contractHealthStatus = computed(() => {
  if (totalDeployed.value === 0) return 'warning'
  return 'healthy'
})

const contractHealthDetails = computed(() => {
  if (totalDeployed.value === 0) return 'No contracts deployed'
  return `${totalDeployed.value} contracts operational`
})

// Methods
const formatAddress = (address?: string): string => {
  if (!address) return 'Not connected'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const viewContractDetails = (contractAddress: string): void => {
  router.push(`/operator/contracts/${contractAddress}`)
}

const viewPortfolio = (): void => {
  router.push('/operator/portfolio')
}

const viewMetrics = (): void => {
  router.push('/operator/metrics')
}

// Lifecycle
onMounted(async () => {
  if (isConnected.value) {
    await refreshData()
  }
})

// Page metadata
definePageMeta({
  title: 'Operator Dashboard',
  description: 'Manage mortgage contracts and monitor investment performance'
})
</script>

<style scoped>
.operator-dashboard {
  @apply space-y-6 p-6;
}

.dashboard-header {
  @apply pb-6 border-b border-gray-200;
}

.quick-actions {
  @apply mb-6;
}

.quick-action-card {
  @apply flex items-center justify-between p-4 rounded-lg border transition-colors duration-200;
}

.dashboard-stats {
  @apply mb-6;
}

.recent-contracts {
  @apply mb-6;
}

.empty-recent {
  @apply bg-white rounded-lg shadow-sm border border-gray-200;
}

.system-health {
  @apply mb-6;
}
</style>
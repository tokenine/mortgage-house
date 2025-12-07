<template>
  <div class="contracts-page">
    <!-- Header -->
    <div class="page-header">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <NuxtLink
            to="/operator"
            class="mr-4 p-2 text-gray-400 hover:text-gray-600"
          >
            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </NuxtLink>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Contract Management</h1>
            <p class="mt-1 text-sm text-gray-600">
              View and manage all deployed mortgage contracts
            </p>
          </div>
        </div>
        <NuxtLink
          to="/operator/deploy"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <svg class="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Deploy New Contract
        </NuxtLink>
      </div>
    </div>

    <!-- Stats Overview -->
    <div class="stats-overview">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Contracts"
          :value="totalContracts"
          subtitle="Deployed contracts"
          icon="document-text"
          color="blue"
        />

        <StatCard
          title="Active Funding"
          :value="fundingContracts"
          subtitle="Currently funding"
          icon="currency-dollar"
          color="green"
        />

        <StatCard
          title="Total Invested"
          :value="totalInvested"
          subtitle="Across all contracts"
          icon="banknotes"
          color="purple"
          :format="formatCurrency"
        />

        <StatCard
          title="Total Investors"
          :value="totalInvestors"
          subtitle="Unique participants"
          icon="users"
          color="orange"
        />
      </div>
    </div>

    <!-- Contract List -->
    <div class="contracts-list">
      <ContractList
        :contracts="deployedContracts"
        @view-details="viewContractDetails"
        @start-funding="startContractFunding"
        @refresh="refreshContracts"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMortgageContract } from '~/composables/useMortgageContract'
import ContractList from '~/components/operator/ContractList.vue'
import StatCard from '~/components/shared/StatCard.vue'

const router = useRouter()

// Composable
const {
  deployedContracts,
  refreshData,
  startContractFunding
} = useMortgageContract()

// Computed properties
const totalContracts = computed(() => deployedContracts.value.length)

const fundingContracts = computed(() => {
  return deployedContracts.value.filter(contract => contract.currentStage === 'FUNDING').length
})

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

// Methods
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

const refreshContracts = async (): Promise<void> => {
  try {
    await refreshData()
  } catch (error) {
    console.error('Failed to refresh contracts:', error)
  }
}

// Lifecycle
onMounted(async () => {
  await refreshContracts()
})

// Page metadata
definePageMeta({
  title: 'Contract Management',
  description: 'View and manage all deployed mortgage contracts'
})
</script>

<style scoped>
.contracts-page {
  @apply space-y-6 p-6;
}

.page-header {
  @apply pb-6 border-b border-gray-200;
}

.stats-overview {
  @apply mb-6;
}

.contracts-list {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 p-6;
}
</style>
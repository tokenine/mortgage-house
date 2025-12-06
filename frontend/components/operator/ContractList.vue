<template>
  <div class="contract-list">
    <!-- Header -->
    <div class="contract-list-header">
      <h2 class="text-xl font-semibold text-gray-900">Deployed Contracts</h2>
      <p class="mt-1 text-sm text-gray-600">
        Manage and monitor all mortgage contracts you've deployed
      </p>
    </div>

    <!-- Search and Filter -->
    <div class="search-filter-section">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by borrower, address, or property description..."
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div class="flex gap-2">
          <select
            v-model="statusFilter"
            class="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">All Status</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="FUNDING">Funding</option>
            <option value="FUNDED">Funded</option>
            <option value="ACTIVE">Active</option>
            <option value="REPAID">Repaid</option>
          </select>

          <select
            v-model="sortBy"
            class="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="deployedAt_desc">Recently Deployed</option>
            <option value="deployedAt_asc">Oldest Deployed</option>
            <option value="loanAmount_desc">Highest Loan</option>
            <option value="loanAmount_asc">Lowest Loan</option>
            <option value="interestRate_asc">Lowest Rate</option>
            <option value="interestRate_desc">Highest Rate</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Contract Cards -->
    <div v-if="filteredContracts.length > 0" class="contract-grid">
      <ContractCard
        v-for="contract in filteredContracts"
        :key="contract.address"
        :contract="contract"
        @view-details="viewContractDetails"
        @start-funding="startFunding"
        @refresh="refreshContract"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="text-center">
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
        <h3 class="mt-2 text-sm font-medium text-gray-900">No contracts found</h3>
        <p class="mt-1 text-sm text-gray-500">
          {{ searchQuery || statusFilter ? 'Try adjusting your search or filters' : 'Get started by deploying your first mortgage contract' }}
        </p>
        <div class="mt-6">
          <NuxtLink
            to="/operator/deploy"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg class="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            Deploy New Contract
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <nav class="flex items-center justify-between">
        <div class="flex-1 flex justify-between sm:hidden">
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            @click="currentPage++"
            :disabled="currentPage === totalPages"
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>

        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              Showing
              <span class="font-medium">{{ (currentPage - 1) * itemsPerPage + 1 }}</span>
              to
              <span class="font-medium">{{ Math.min(currentPage * itemsPerPage, filteredContracts.length) }}</span>
              of
              <span class="font-medium">{{ filteredContracts.length }}</span>
              results
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                @click="currentPage--"
                :disabled="currentPage === 1"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <span class="sr-only">Previous</span>
                <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </button>

              <template v-for="page in visiblePages" :key="page">
                <button
                  v-if="page !== '...'"
                  @click="currentPage = page"
                  :class="[
                    'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                    currentPage === page
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  ]"
                >
                  {{ page }}
                </button>
                <span
                  v-else
                  class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                >
                  ...
                </span>
              </template>

              <button
                @click="currentPage++"
                :disabled="currentPage === totalPages"
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <span class="sr-only">Next</span>
                <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMortgageContract } from '~/composables/useMortgageContract'
import ContractCard from './ContractCard.vue'

interface Props {
  contracts?: Array<{
    address: string
    borrower: string
    loanAmount: string
    usdtToken: string
    interestRate: string
    loanTerm: string
    propertyDescription: string
    deployedAt: number
    txHash: string
    currentStage?: string
    totalFunded?: string
    investorCount?: number
  }>
}

const props = withDefaults(defineProps<Props>(), {
  contracts: () => []
})

const router = useRouter()

// Composable
const { deployedContracts, refreshData, startContractFunding } = useMortgageContract()

// Local state
const searchQuery = ref('')
const statusFilter = ref('')
const sortBy = ref('deployedAt_desc')
const currentPage = ref(1)
const itemsPerPage = ref(12)

// Use props.contracts if provided, otherwise use composable data
const allContracts = computed(() => props.contracts.length > 0 ? props.contracts : deployedContracts.value)

// Computed properties
const filteredContracts = computed(() => {
  let contracts = [...allContracts.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    contracts = contracts.filter(contract =>
      contract.borrower.toLowerCase().includes(query) ||
      contract.address.toLowerCase().includes(query) ||
      contract.propertyDescription.toLowerCase().includes(query) ||
      contract.loanAmount.includes(query)
    )
  }

  // Status filter
  if (statusFilter.value) {
    contracts = contracts.filter(contract =>
      contract.currentStage === statusFilter.value
    )
  }

  // Sort
  const [field, direction] = sortBy.value.split('_')
  contracts.sort((a, b) => {
    let aVal, bVal

    switch (field) {
      case 'deployedAt':
        aVal = a.deployedAt
        bVal = b.deployedAt
        break
      case 'loanAmount':
        aVal = parseFloat(a.loanAmount) || 0
        bVal = parseFloat(b.loanAmount) || 0
        break
      case 'interestRate':
        aVal = parseFloat(a.interestRate) || 0
        bVal = parseFloat(b.interestRate) || 0
        break
      default:
        return 0
    }

    if (aVal < bVal) return direction === 'asc' ? -1 : 1
    if (aVal > bVal) return direction === 'asc' ? 1 : -1
    return 0
  })

  return contracts
})

const paginatedContracts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredContracts.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredContracts.value.length / itemsPerPage.value)
})

const visiblePages = computed(() => {
  const pages = []
  const current = currentPage.value
  const total = totalPages.value

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 3) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 2) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    }
  }

  return pages
})

// Watch for filter changes and reset pagination
watch([searchQuery, statusFilter, sortBy], () => {
  currentPage.value = 1
})

// Methods
const viewContractDetails = (contractAddress: string) => {
  router.push(`/operator/contracts/${contractAddress}`)
}

const startFunding = async (contractAddress: string) => {
  try {
    await startContractFunding(contractAddress as `0x${string}`)
    await refreshData()
  } catch (error) {
    console.error('Failed to start funding:', error)
  }
}

const refreshContract = async () => {
  try {
    await refreshData()
  } catch (error) {
    console.error('Failed to refresh contracts:', error)
  }
}
</script>

<style scoped>
.contract-list {
  @apply space-y-6;
}

.contract-list-header {
  @apply pb-4 border-b border-gray-200;
}

.search-filter-section {
  @apply pb-4;
}

.contract-grid {
  @apply grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3;
}

.empty-state {
  @apply py-12;
}

.pagination {
  @apply pt-4 border-t border-gray-200;
}
</style>
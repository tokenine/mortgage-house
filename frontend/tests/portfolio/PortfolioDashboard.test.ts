import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import PortfolioDashboard from '~/components/portfolio/PortfolioDashboard.vue'

// Mock the usePortfolio composable
const mockUsePortfolio = {
  investments: ref([]),
  earningsHistory: ref([]),
  portfolioSummary: ref({
    totalInvested: 0n,
    totalEntitledPrincipal: 0n,
    totalEntitledInterest: 0n,
    totalWithdrawable: 0n,
    totalEarnings: 0n,
    investmentCount: 0,
    activeInvestments: 0,
    totalReturn: 0,
    annualizedReturn: 0
  }),
  portfolioEarnings: ref({
    totalEntitledPrincipal: 0n,
    totalEntitledInterest: 0n,
    totalWithdrawablePrincipal: 0n,
    totalWithdrawableInterest: 0n,
    totalWithdrawn: 0n,
    earningsHistory: []
  }),
  formattedPortfolio: ref({
    formatted: {
      totalInvested: '0.00',
      totalEarnings: '0.00',
      totalWithdrawable: '0.00',
      totalEntitledPrincipal: '0.00',
      totalEntitledInterest: '0.00',
      totalReturn: '0.00%',
      annualizedReturn: '0.00%'
    }
  }),
  isLoadingPortfolio: ref(false),
  lastPortfolioUpdate: ref(0),
  isConnected: ref(false),
  isLoading: ref(false),
  error: ref(null),
  hasInvestments: ref(false),
  hasWithdrawableFunds: ref(false),
  withdrawPortfolioPrincipal: vi.fn(),
  withdrawPortfolioInterest: vi.fn(),
  withdrawPortfolioPayout: vi.fn()
}

vi.mock('~/composables/usePortfolio', () => ({
  usePortfolio: () => mockUsePortfolio
}))

describe('PortfolioDashboard', () => {
  let wrapper: any

  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = mount(PortfolioDashboard, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          PortfolioOverview: true,
          InvestmentList: true,
          EarningsSection: true,
          WithdrawalInterface: true,
          TransactionHistory: true,
          ErrorAlert: true
        }
      }
    })
  })

  describe('When wallet is not connected', () => {
    beforeEach(() => {
      mockUsePortfolio.isConnected.value = false
      mockUsePortfolio.hasInvestments.value = false
      wrapper = mount(PortfolioDashboard, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            PortfolioOverview: true,
            InvestmentList: true,
            EarningsSection: true,
            WithdrawalInterface: true,
            TransactionHistory: true,
            ErrorAlert: true
          }
        }
      })
    })

    it('should show connect wallet message', () => {
      expect(wrapper.text()).toContain('Connect Wallet')
      expect(wrapper.text()).toContain('Please connect your wallet to view your portfolio')
    })

    it('should not show portfolio components', () => {
      expect(wrapper.findComponent({ name: 'PortfolioOverview' }).exists()).toBe(false)
      expect(wrapper.findComponent({ name: 'InvestmentList' }).exists()).toBe(false)
    })
  })

  describe('When portfolio is loading', () => {
    beforeEach(() => {
      mockUsePortfolio.isConnected.value = true
      mockUsePortfolio.isLoadingPortfolio.value = true
      wrapper = mount(PortfolioDashboard, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            PortfolioOverview: true,
            InvestmentList: true,
            EarningsSection: true,
            WithdrawalInterface: true,
            TransactionHistory: true,
            ErrorAlert: true
          }
        }
      })
    })

    it('should show loading message', () => {
      expect(wrapper.text()).toContain('Loading portfolio data...')
    })

    it('should show loading spinner', () => {
      expect(wrapper.find('.animate-spin').exists()).toBe(true)
    })
  })

  describe('When user has no investments', () => {
    beforeEach(() => {
      mockUsePortfolio.isConnected.value = true
      mockUsePortfolio.isLoadingPortfolio.value = false
      mockUsePortfolio.hasInvestments.value = false
      wrapper = mount(PortfolioDashboard, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            PortfolioOverview: true,
            InvestmentList: true,
            EarningsSection: true,
            WithdrawalInterface: true,
            TransactionHistory: true,
            ErrorAlert: true
          }
        }
      })
    })

    it('should show no investments message', () => {
      expect(wrapper.text()).toContain('No investments yet')
      expect(wrapper.text()).toContain("You haven't made any investments yet")
    })

    it('should show start investing button', () => {
      const investButton = wrapper.find('a[href="/invest"]')
      expect(investButton.exists()).toBe(true)
      expect(investButton.text()).toContain('Start Investing')
    })
  })

  describe('When user has investments', () => {
    beforeEach(() => {
      mockUsePortfolio.isConnected.value = true
      mockUsePortfolio.isLoadingPortfolio.value = false
      mockUsePortfolio.hasInvestments.value = true
      mockUsePortfolio.investments.value = [
        {
          id: 'investment_1',
          contractAddress: '0x1234567890123456789012345678901234567890',
          propertyValue: 150000000000n,
          loanAmount: 100000000000n,
          interestRate: 500n,
          loanTerm: 31536000000n,
          fundingStage: 3,
          shares: 1000000n,
          sharePercentage: 10,
          investedAmount: 1000000n,
          entitledPrincipal: 50000n,
          entitledInterest: 25000n,
          withdrawablePrincipal: 30000n,
          withdrawableInterest: 20000n,
          createdAt: Date.now(),
          lastUpdated: Date.now()
        }
      ]
      mockUsePortfolio.portfolioSummary.value = {
        totalInvested: 1000000n,
        totalEntitledPrincipal: 50000n,
        totalEntitledInterest: 25000n,
        totalWithdrawable: 50000n,
        totalEarnings: 75000n,
        investmentCount: 1,
        activeInvestments: 1,
        totalReturn: 7.5,
        annualizedReturn: 7.5
      }
      wrapper = mount(PortfolioDashboard, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            PortfolioOverview: true,
            InvestmentList: true,
            EarningsSection: true,
            WithdrawalInterface: true,
            TransactionHistory: true,
            ErrorAlert: true
          }
        }
      })
    })

    it('should show portfolio header', () => {
      expect(wrapper.text()).toContain('Investment Portfolio')
      expect(wrapper.text()).toContain('Track your mortgage investments and earnings')
    })

    it('should render portfolio components', () => {
      expect(wrapper.findComponent({ name: 'PortfolioOverview' }).exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'InvestmentList' }).exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'EarningsSection' }).exists()).toBe(true)
    })

    it('should render withdrawal interface when funds are available', () => {
      mockUsePortfolio.hasWithdrawableFunds.value = true
      wrapper = mount(PortfolioDashboard, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            PortfolioOverview: true,
            InvestmentList: true,
            EarningsSection: true,
            WithdrawalInterface: true,
            TransactionHistory: true,
            ErrorAlert: true
          }
        }
      })
      expect(wrapper.findComponent({ name: 'WithdrawalInterface' }).exists()).toBe(true)
    })
  })

  describe('Withdrawal handlers', () => {
    beforeEach(() => {
      mockUsePortfolio.isConnected.value = true
      mockUsePortfolio.hasInvestments.value = true
      mockUsePortfolio.hasWithdrawableFunds.value = true
      wrapper = mount(PortfolioDashboard, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            PortfolioOverview: true,
            InvestmentList: true,
            EarningsSection: true,
            WithdrawalInterface: {
              template: '<div><button @click="$emit(\'withdraw-principal\', 1000)">Withdraw Principal</button><button @click="$emit(\'withdraw-interest\', 500)">Withdraw Interest</button><button @click="$emit(\'withdraw-both\', 800, 200)">Withdraw Both</button></div>'
            },
            TransactionHistory: true,
            ErrorAlert: true
          }
        }
      })
    })

    it('should handle principal withdrawal', async () => {
      await wrapper.findComponent({ name: 'WithdrawalInterface' }).vm.$emit('withdraw-principal', 1000n)
      expect(mockUsePortfolio.withdrawPortfolioPrincipal).toHaveBeenCalledWith(1000n)
    })

    it('should handle interest withdrawal', async () => {
      await wrapper.findComponent({ name: 'WithdrawalInterface' }).vm.$emit('withdraw-interest', 500n)
      expect(mockUsePortfolio.withdrawPortfolioInterest).toHaveBeenCalledWith(500n)
    })

    it('should handle combined withdrawal', async () => {
      await wrapper.findComponent({ name: 'WithdrawalInterface' }).vm.$emit('withdraw-both', 800n, 200n)
      expect(mockUsePortfolio.withdrawPortfolioPayout).toHaveBeenCalledWith(800n, 200n)
    })
  })

  describe('Error handling', () => {
    beforeEach(() => {
      mockUsePortfolio.isConnected.value = true
      mockUsePortfolio.error.value = new Error('Test error message')
      wrapper = mount(PortfolioDashboard, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            PortfolioOverview: true,
            InvestmentList: true,
            EarningsSection: true,
            WithdrawalInterface: true,
            TransactionHistory: true,
            ErrorAlert: true
          }
        }
      })
    })

    it('should display error when present', () => {
      expect(wrapper.findComponent({ name: 'ErrorAlert' }).exists()).toBe(true)
    })
  })
})
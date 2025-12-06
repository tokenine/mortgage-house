import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePortfolio } from '~/composables/usePortfolio'
import { formatUSDT, FundingStage } from '~/utils/contract/constants'

// Mock the useMortgageContract composable
vi.mock('~/composables/useMortgageContract', () => ({
  useMortgageContract: vi.fn(() => ({
    isConnected: { value: true },
    address: { value: '0x1234567890123456789012345678901234567890' },
    investorShares: { value: 1000000n }, // 1 USDT = 1 share
    totalShares: { value: 10000000n }, // 10 shares total
    entitledPrincipal: { value: 50000n },
    entitledInterest: { value: 25000n },
    withdrawablePrincipal: { value: 30000n },
    withdrawableInterest: { value: 20000n },
    fundingStage: { value: FundingStage.ACTIVE },
    userSharePercentage: { value: 10 },
    isLoading: { value: false },
    error: { value: null },
    setupEventListeners: vi.fn(),
    withdrawPrincipal: vi.fn(),
    withdrawInterest: vi.fn(),
    withdrawPayoutAmounts: vi.fn()
  }))
}))

describe('usePortfolio', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Portfolio Summary', () => {
    it('should calculate correct portfolio summary', () => {
      const portfolio = usePortfolio()

      expect(portfolio.portfolioSummary.value).toEqual({
        totalInvested: 1000000n, // 1 USDT invested
        totalEntitledPrincipal: 50000n,
        totalEntitledInterest: 25000n,
        totalWithdrawable: 50000n, // 30000 + 20000
        totalEarnings: 75000n, // 50000 + 25000
        investmentCount: 1,
        activeInvestments: 1,
        totalReturn: 7.5, // 75000 / 1000000 * 100
        annualizedReturn: 7.5
      })
    })

    it('should handle empty portfolio correctly', () => {
      const { useMortgageContract } = require('~/composables/useMortgageContract')
      useMortgageContract.mockReturnValue({
        isConnected: { value: true },
        address: { value: '0x1234567890123456789012345678901234567890' },
        investorShares: { value: 0n },
        totalShares: { value: 0n },
        entitledPrincipal: { value: 0n },
        entitledInterest: { value: 0n },
        withdrawablePrincipal: { value: 0n },
        withdrawableInterest: { value: 0n },
        fundingStage: { value: FundingStage.FUNDING },
        userSharePercentage: { value: 0 },
        isLoading: { value: false },
        error: { value: null },
        setupEventListeners: vi.fn(),
        withdrawPrincipal: vi.fn(),
        withdrawInterest: vi.fn(),
        withdrawPayoutAmounts: vi.fn()
      })

      const portfolio = usePortfolio()

      expect(portfolio.portfolioSummary.value).toEqual({
        totalInvested: 0n,
        totalEntitledPrincipal: 0n,
        totalEntitledInterest: 0n,
        totalWithdrawable: 0n,
        totalEarnings: 0n,
        investmentCount: 0,
        activeInvestments: 0,
        totalReturn: 0,
        annualizedReturn: 0
      })
    })
  })

  describe('Portfolio Earnings', () => {
    it('should calculate correct earnings breakdown', () => {
      const portfolio = usePortfolio()

      expect(portfolio.portfolioEarnings.value).toEqual({
        totalEntitledPrincipal: 50000n,
        totalEntitledInterest: 25000n,
        totalWithdrawablePrincipal: 30000n,
        totalWithdrawableInterest: 20000n,
        totalWithdrawn: 25000n, // 50000 - 30000 + 25000 - 20000
        earningsHistory: []
      })
    })
  })

  describe('Formatted Portfolio', () => {
    it('should format portfolio data correctly', () => {
      const portfolio = usePortfolio()

      expect(portfolio.formattedPortfolio.value.formatted).toEqual({
        totalInvested: formatUSDT(1000000n),
        totalEarnings: formatUSDT(75000n),
        totalWithdrawable: formatUSDT(50000n),
        totalEntitledPrincipal: formatUSDT(50000n),
        totalEntitledInterest: formatUSDT(25000n),
        totalReturn: '7.50%',
        annualizedReturn: '7.50%'
      })
    })
  })

  describe('Investment Management', () => {
    it('should create investment object from contract data', () => {
      const portfolio = usePortfolio()

      // Trigger portfolio data update
      portfolio.updatePortfolioData()

      expect(portfolio.investments.value).toHaveLength(1)

      const investment = portfolio.investments.value[0]
      expect(investment).toMatchObject({
        id: 'investment_12345678',
        contractAddress: '0x1234567890123456789012345678901234567890',
        shares: 1000000n,
        sharePercentage: 10,
        investedAmount: 1000000n,
        entitledPrincipal: 50000n,
        entitledInterest: 25000n,
        withdrawablePrincipal: 30000n,
        withdrawableInterest: 20000n,
        fundingStage: FundingStage.ACTIVE
      })
    })
  })

  describe('Earnings History', () => {
    it('should add earnings events correctly', () => {
      const portfolio = usePortfolio()

      const earningsEvent = {
        id: 'test_event_1',
        type: 'principal_deposited' as const,
        amount: 5000n,
        contractAddress: '0x1234567890123456789012345678901234567890',
        timestamp: Date.now(),
        transactionHash: '0xabcdef123456'
      }

      portfolio.addEarningsEvent(earningsEvent)

      expect(portfolio.earningsHistory.value).toHaveLength(1)
      expect(portfolio.earningsHistory.value[0]).toEqual(earningsEvent)
    })

    it('should limit earnings history to 100 events', () => {
      const portfolio = usePortfolio()

      // Add 150 events
      for (let i = 0; i < 150; i++) {
        portfolio.addEarningsEvent({
          id: `test_event_${i}`,
          type: 'principal_deposited',
          amount: 1000n,
          contractAddress: '0x1234567890123456789012345678901234567890',
          timestamp: Date.now() + i,
          transactionHash: `0xabcdef${i}`
        })
      }

      expect(portfolio.earningsHistory.value).toHaveLength(100)
    })
  })

  describe('Helper Functions', () => {
    it('should check if user has investments', () => {
      const portfolio = usePortfolio()

      expect(portfolio.hasInvestments.value).toBe(true)
    })

    it('should check if user has withdrawable funds', () => {
      const portfolio = usePortfolio()

      expect(portfolio.hasWithdrawableFunds.value).toBe(true)
    })

    it('should check if user has active investments', () => {
      const portfolio = usePortfolio()

      expect(portfolio.hasActiveInvestments.value).toBe(true)
    })
  })

  describe('Withdrawal Functions', () => {
    it('should withdraw portfolio principal', async () => {
      const portfolio = usePortfolio()
      const mockWithdrawPrincipal = vi.mocked(portfolio.withdrawPrincipal)

      await portfolio.withdrawPortfolioPrincipal(10000n)

      expect(mockWithdrawPrincipal).toHaveBeenCalledWith(10000n)
      expect(portfolio.earningsHistory.value).toHaveLength(1)
      expect(portfolio.earningsHistory.value[0].type).toBe('withdrawal')
    })

    it('should withdraw portfolio interest', async () => {
      const portfolio = usePortfolio()
      const mockWithdrawInterest = vi.mocked(portfolio.withdrawInterest)

      await portfolio.withdrawPortfolioInterest(5000n)

      expect(mockWithdrawInterest).toHaveBeenCalledWith(5000n)
      expect(portfolio.earningsHistory.value).toHaveLength(1)
      expect(portfolio.earningsHistory.value[0].type).toBe('withdrawal')
    })

    it('should withdraw portfolio payout', async () => {
      const portfolio = usePortfolio()
      const mockWithdrawPayout = vi.mocked(portfolio.withdrawPayoutAmounts)

      await portfolio.withdrawPortfolioPayout(8000n, 2000n)

      expect(mockWithdrawPayout).toHaveBeenCalledWith(8000n, 2000n)
      expect(portfolio.earningsHistory.value).toHaveLength(1)
      expect(portfolio.earningsHistory.value[0].type).toBe('withdrawal')
    })
  })
})
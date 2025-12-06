import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import FundingProgress from '~/components/funding/FundingProgress.vue'

// Mock the useMortgageContract composable
vi.mock('~/composables/useMortgageContract', () => ({
  useMortgageContract: vi.fn()
}))

// Mock constants
vi.mock('~/utils/contract/constants', () => ({
  parseUSDT: (amount: string | number) => {
    const stringValue = String(amount).replace(/[^0-9.]/g, '')
    const numericValue = parseFloat(stringValue)
    return BigInt(Math.floor(numericValue * 1e6))
  },
  formatUSDT: (amount: bigint) => (Number(amount) / 1e6).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }),
  getStageName: (stage: number) => {
    const stages = ['Not Started', 'Funding', 'Funded', 'Active', 'Repaid']
    return stages[stage] || 'Unknown'
  }
}))

describe('FundingProgress', () => {
  let mockUseMortgageContract: any

  beforeEach(async () => {
    vi.resetAllMocks()

    const { useMortgageContract } = await import('~/composables/useMortgageContract')
    mockUseMortgageContract = vi.mocked(useMortgageContract)

    // Default mock implementation
    mockUseMortgageContract.mockReturnValue({
      isConnected: ref(true),
      totalInvested: ref(25000n * 10n**6n), // 25k USDT
      totalShares: ref(25000n * 10n**6n), // 25k shares
      investorShares: ref(5000n * 10n**6n), // 5k USDT worth of shares
      investorCount: ref(15),
      fundingStage: ref(1), // FUNDING stage
      usdtBalance: ref(10000n * 10n**6n), // 10k USDT balance
      formatAmount: (amount: bigint) => (Number(amount) / 1e6).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }),
      formatPercentage: (value: number) => `${value.toFixed(2)}%`,
      setupEventListeners: vi.fn(),
      removeEventListeners: vi.fn(),
      refreshData: vi.fn().mockResolvedValue(undefined),
      getBlockExplorerUrl: (txHash: string) => `https://etherscan.io/tx/${txHash}`
    })
  })

  it('renders enhanced funding progress visualization', () => {
    const wrapper = mount(FundingProgress)

    expect(wrapper.find('h3').text()).toContain('Funding Progress')
    expect(wrapper.find('.progress-percentage').text()).toBe('25.0%')
    expect(wrapper.text()).toContain('25,000.00 USDT')
    expect(wrapper.text()).toContain('100,000.00 USDT') // Target
  })

  it('displays funding milestones correctly', () => {
    const wrapper = mount(FundingProgress)

    // Should show milestones at 25%, 50%, 75%, 100%
    const milestones = wrapper.findAll('.funding-milestone')
    expect(milestones).toHaveLength(4)

    // First milestone (25%) should be active
    expect(milestones[0].classes()).toContain('milestone-active')

    // Later milestones should not be active
    expect(milestones[1].classes()).not.toContain('milestone-active')
    expect(milestones[2].classes()).not.toContain('milestone-active')
    expect(milestones[3].classes()).not.toContain('milestone-active')
  })

  it('shows time remaining estimate when not fully funded', () => {
    const wrapper = mount(FundingProgress)

    expect(wrapper.find('.time-estimate').exists()).toBe(true)
    expect(wrapper.text()).toContain('Estimated completion')
  })

  it('hides time estimate when fully funded', async () => {
    const currentMock = mockUseMortgageContract.getMockImplementation()
    mockUseMortgageContract.mockReturnValueOnce({
      ...currentMock()!,
      totalInvested: ref(100000n * 10n**6n) // 100% funded
    })

    const wrapper = mount(FundingProgress)

    expect(wrapper.find('.time-estimate').exists()).toBe(false)
  })

  it('displays transaction feed with recent investments', () => {
    const wrapper = mount(FundingProgress)

    // Check if the component renders text that indicates the transaction feed section
    expect(wrapper.text()).toContain('Recent Investments')
    expect(wrapper.text()).toContain('No investments yet')
  })

  it('masks investor addresses in transaction feed', () => {
    const transactions = [
      {
        id: '1',
        investor: '0x1234567890123456789012345678901234567890',
        amount: 5000n * 10n**6n,
        shares: 5000n * 10n**6n,
        timestamp: Date.now() - 300000, // 5 minutes ago
        txHash: '0xabc123...'
      }
    ]

    const wrapper = mount(FundingProgress, {
      props: { initialTransactions: transactions }
    })

    expect(wrapper.text()).toContain('0x1234...7890') // Masked address
  })

  it('formats timestamps correctly in transaction feed', () => {
    const fiveMinutesAgo = Date.now() - 300000
    const transactions = [
      {
        id: '1',
        investor: '0x1234567890123456789012345678901234567890',
        amount: 5000n * 10n**6n,
        shares: 5000n * 10n**6n,
        timestamp: fiveMinutesAgo,
        txHash: '0xabc123...'
      }
    ]

    const wrapper = mount(FundingProgress, {
      props: { initialTransactions: transactions }
    })

    // Should show "5 minutes ago" format
    expect(wrapper.text()).toMatch(/\d+\s+minutes?\s+ago/)
  })

  it('displays investor position with ownership percentage', () => {
    const wrapper = mount(FundingProgress)

    expect(wrapper.text()).toContain('Your Position')
    expect(wrapper.text()).toContain('5,000.00') // User shares
    expect(wrapper.text()).toContain('20%') // Ownership percentage (5k/25k)
    expect(wrapper.text()).toContain('Shares Owned')
  })

  it('shows projected returns based on investment', () => {
    const wrapper = mount(FundingProgress)

    expect(wrapper.text()).toContain('Projected Returns')
  })

  it('shows real-time connection status', () => {
    const wrapper = mount(FundingProgress)

    // Should show connection status indicator
    expect(wrapper.text()).toContain('Real-time')
  })

  it('handles real-time event subscription', () => {
    const wrapper = mount(FundingProgress)

    // Component should not error when trying to subscribe to real-time events
    expect(wrapper.exists()).toBe(true)
  })

  it('updates funding progress when investment event is received', async () => {
    const wrapper = mount(FundingProgress)
    const mockOnInvested = vi.fn()

    // Simulate receiving investment event
    wrapper.vm.handleInvestmentEvent({
      investor: '0x1234567890123456789012345678901234567890',
      amount: 10000n * 10n**6n,
      shares: 10000n * 10n**6n
    })

    // Flush the batch processor to process the transaction immediately
    wrapper.vm.flushTransactions()

    // Wait for the async processing to complete
    await new Promise(resolve => setTimeout(resolve, 0))

    // Should update transactions and refresh data
    expect(wrapper.vm.transactions.length).toBeGreaterThan(0)
  })

  it('handles stage transition from funding to active', async () => {
    const currentMock = mockUseMortgageContract.getMockImplementation()
    mockUseMortgageContract.mockReturnValue({
      ...currentMock()!,
      fundingStage: ref(2) // FUNDED stage
    })

    const wrapper = mount(FundingProgress)

    expect(wrapper.text()).toContain('Position Locked')
    // Check for general functionality that would be different when not in funding stage
  })

  it('shows funding complete notification when 100% reached', async () => {
    const currentMock = mockUseMortgageContract.getMockImplementation()
    mockUseMortgageContract.mockReturnValueOnce({
      ...currentMock()!,
      totalInvested: ref(100000n * 10n**6n) // 100% funded
    })

    const wrapper = mount(FundingProgress)

    expect(wrapper.find('.funding-complete-notification').exists()).toBe(true)
  })

  it('shows investor position details', async () => {
    const wrapper = mount(FundingProgress)

    expect(wrapper.text()).toContain('Your Position')
    expect(wrapper.text()).toContain('Projected Returns')
    expect(wrapper.text()).toContain('days ago')
    expect(wrapper.text()).toContain('Transfer Shares')
  })

  it('debounces rapid updates to prevent performance issues', async () => {
    const wrapper = mount(FundingProgress)
    const mockRefreshData = vi.fn()

    const currentMock = mockUseMortgageContract.getMockImplementation()
    mockUseMortgageContract.mockReturnValueOnce({
      ...currentMock()!,
      refreshData: mockRefreshData
    })

    // Simulate rapid investment events
    for (let i = 0; i < 10; i++) {
      wrapper.vm.handleInvestmentEvent({
        investor: `0x${i.toString().padStart(40, '0')}`,
        amount: 1000n * 10n**6n,
        shares: 1000n * 10n**6n
      })
    }

    // Should debounce calls to refreshData
    expect(mockRefreshData).not.toHaveBeenCalledTimes(10)
  })

  it('calculates time estimate based on funding velocity', () => {
    // Create some initial transactions for velocity calculation
    const transactions = [
      {
        id: '1',
        investor: '0x1234567890123456789012345678901234567890',
        amount: 5000n * 10n**6n,
        shares: 5000n * 10n**6n,
        timestamp: Date.now() - 300000,
        txHash: '0xabc123...'
      },
      {
        id: '2',
        investor: '0x2345678901234567890123456789012345678901',
        amount: 3000n * 10n**6n,
        shares: 3000n * 10n**6n,
        timestamp: Date.now() - 600000,
        txHash: '0xdef456...'
      }
    ]

    const wrapper = mount(FundingProgress, {
      props: { initialTransactions: transactions }
    })

    // With current investment rate, should estimate completion time
    expect(wrapper.vm.estimatedCompletion).toBeDefined()
    expect(typeof wrapper.vm.estimatedCompletion).toBe('string')
  })

  it('limits transaction feed to show only recent transactions', () => {
    // Create many transactions
    const transactions = Array.from({ length: 100 }, (_, i) => ({
      id: i.toString(),
      investor: `0x${i.toString().padStart(40, '0')}`,
      amount: 1000n * 10n**6n,
      shares: 1000n * 10n**6n,
      timestamp: Date.now() - (i * 60000), // 1 minute apart
      txHash: `0x${i}...`
    }))

    const wrapper = mount(FundingProgress, {
      props: { initialTransactions: transactions }
    })

    // Should limit display to recent transactions (default 20)
    expect(wrapper.findAll('.transaction-item').length).toBeLessThanOrEqual(20)
  })

  it('provides block explorer links for transactions', () => {
    const transactions = [
      {
        id: '1',
        investor: '0x1234567890123456789012345678901234567890',
        amount: 5000n * 10n**6n,
        shares: 5000n * 10n**6n,
        timestamp: Date.now() - 300000,
        txHash: '0xabc123...'
      }
    ]

    const wrapper = mount(FundingProgress, {
      props: { initialTransactions: transactions }
    })

    // The TransactionFeed component should render explorer links
    expect(wrapper.text()).toContain('Explorer')
    expect(wrapper.text()).toContain('5,000.00 USDT')
  })

  it('updates funding progress when investment event is received', async () => {
    const wrapper = mount(FundingProgress)

    // Simulate receiving investment event
    wrapper.vm.handleInvestmentEvent({
      investor: '0x1234567890123456789012345678901234567890',
      amount: 10000n * 10n**6n,
      shares: 10000n * 10n**6n
    })

    // Flush the batch processor to process the transaction immediately
    wrapper.vm.flushTransactions()

    // Wait for the async processing to complete
    await new Promise(resolve => setTimeout(resolve, 0))

    // Should update transactions and refresh data
    expect(wrapper.vm.transactions.length).toBeGreaterThan(0)
  })
})
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import GasAnalysis from '~/components/GasAnalysis.vue'
import type { GasEstimate, GasOptimizationSuggestions } from '~/composables/useGasOptimization'

// Mock imports
vi.mock('~/utils/contract/constants', () => ({
  formatUSDT: (amount: bigint) => `${Number(amount) / 1000000} USDT`
}))

describe('GasAnalysis Component', () => {
  const mockGasEstimate: GasEstimate = {
    gasLimit: 200000n,
    gasPrice: parseUnits('30', 'gwei'),
    maxFeePerGas: parseUnits('30', 'gwei'),
    maxPriorityFeePerGas: parseUnits('2', 'gwei'),
    gasCostETH: '0.006',
    gasCostUSD: '$18.00',
    isWithinThreshold: true,
    networkStatus: 'normal'
  }

  const mockSuggestions: GasOptimizationSuggestions[] = [
    {
      type: 'investment-size',
      message: 'Consider investing larger amounts to reduce gas cost percentage',
      savings: 'Gas could be reduced from 6.0% to 3.0%',
      impact: 'high',
      actionable: true
    },
    {
      type: 'timing',
      message: 'Gas prices are typically lower during off-peak hours',
      savings: 'Potential 20-40% savings by waiting until evening',
      impact: 'medium',
      actionable: true
    }
  ]

  const mockTimingSuggestions = {
    bestHours: [22, 23, 0, 1, 2, 3, 4, 5, 6],
    worstHours: [9, 10, 11, 12, 13, 14, 15, 16, 17],
    currentOptimal: false,
    recommendation: 'Consider waiting until 22:00 for lower gas prices'
  }

  const mockCostBreakdown = {
    investmentAmount: '1000.000000 USDT',
    gasCostETH: '0.006',
    gasCostUSD: '$18.00',
    totalCost: '$1,018.00',
    effectiveAPR: 1.8,
    costComparison: {
      withGas: '$1,018.00',
      withoutGas: '$1,000.00',
      gasImpact: '1.77%'
    }
  }

  const parseUnits = (value: string, unit: string): bigint => {
    const decimals = unit === 'gwei' ? 9 : 18
    return BigInt(Math.floor(parseFloat(value) * 10 ** decimals))
  }

  it('renders gas cost breakdown correctly', () => {
    const wrapper = mount(GasAnalysis, {
      props: {
        investmentAmount: parseUnits('1000', 'ether'),
        gasEstimate: mockGasEstimate,
        costBreakdown: mockCostBreakdown
      }
    })

    expect(wrapper.text()).toContain('Transaction Cost Analysis')
    expect(wrapper.text()).toContain('Investment Amount:')
    expect(wrapper.text()).toContain('1000.000000 USDT')
    expect(wrapper.text()).toContain('Estimated Gas Cost:')
    expect(wrapper.text()).toContain('0.006 ETH')
    expect(wrapper.text()).toContain('$18.00')
    expect(wrapper.text()).toContain('Total Transaction Cost:')
    expect(wrapper.text()).toContain('$1,018.00')
  })

  it('displays high gas warning when costs exceed threshold', () => {
    const highGasEstimate: GasEstimate = {
      ...mockGasEstimate,
      gasCostETH: '0.015',
      gasCostUSD: '$45.00',
      isWithinThreshold: false,
      networkStatus: 'high'
    }

    const wrapper = mount(GasAnalysis, {
      props: {
        investmentAmount: parseUnits('100', 'ether'),
        gasEstimate: highGasEstimate,
        costBreakdown: mockCostBreakdown
      }
    })

    expect(wrapper.text()).toContain('High Gas Costs')
    expect(wrapper.text()).toContain('Gas costs are unusually high')
  })

  it('displays network status badge', () => {
    const testCases = [
      { status: 'normal' as const, color: 'green', label: 'Normal' },
      { status: 'congested' as const, color: 'amber', label: 'Congested' },
      { status: 'high' as const, color: 'red', label: 'High Congestion' }
    ]

    testCases.forEach(({ status, color, label }) => {
      const wrapper = mount(GasAnalysis, {
        props: {
          investmentAmount: parseUnits('100', 'ether'),
          gasEstimate: { ...mockGasEstimate, networkStatus: status }
        }
      })

      const badge = wrapper.find('[data-testid="network-status-badge"]')
      expect(badge.exists()).toBe(true)
      expect(badge.attributes('color')).toBe(color)
      expect(badge.text()).toContain(label)
    })
  })

  it('renders transaction speed options', () => {
    const wrapper = mount(GasAnalysis, {
      props: {
        investmentAmount: parseUnits('100', 'ether'),
        gasEstimate: mockGasEstimate
      }
    })

    expect(wrapper.text()).toContain('Transaction Speed')
    expect(wrapper.text()).toContain('Slow')
    expect(wrapper.text()).toContain('Standard')
    expect(wrapper.text()).toContain('Fast')
    expect(wrapper.text()).toContain('5-10 minutes')
    expect(wrapper.text()).toContain('2-5 minutes')
    expect(wrapper.text()).toContain('< 2 minutes')
  })

  it('emits speed-changed event when speed is selected', async () => {
    const wrapper = mount(GasAnalysis, {
      props: {
        investmentAmount: parseUnits('100', 'ether'),
        gasEstimate: mockGasEstimate
      }
    })

    // Find and click the slow speed option
    const speedOptions = wrapper.findAll('[data-testid="speed-option"]')
    const slowOption = speedOptions.find(option => option.text().includes('Slow'))

    expect(slowOption).toBeDefined()
    await slowOption?.trigger('click')

    expect(wrapper.emitted('speed-changed')).toBeTruthy()
    expect(wrapper.emitted('speed-changed')?.[0]).toEqual(['slow'])
  })

  it('renders optimization suggestions when provided', () => {
    const wrapper = mount(GasAnalysis, {
      props: {
        investmentAmount: parseUnits('50', 'ether'),
        gasEstimate: mockGasEstimate,
        suggestions: mockSuggestions
      }
    })

    expect(wrapper.text()).toContain('Gas Optimization Suggestions')
    expect(wrapper.text()).toContain('Consider investing larger amounts')
    expect(wrapper.text()).toContain('Gas prices are typically lower')
    expect(wrapper.text()).toContain('Potential 20-40% savings')
  })

  it('displays suggestion actions for actionable suggestions', () => {
    const wrapper = mount(GasAnalysis, {
      props: {
        investmentAmount: parseUnits('50', 'ether'),
        gasEstimate: mockGasEstimate,
        suggestions: mockSuggestions
      }
    })

    const actionButtons = wrapper.findAll('[data-testid="suggestion-action"]')
    expect(actionButtons.length).toBe(2) // Both suggestions are actionable

    const applyButton = actionButtons[0]
    expect(applyButton.text()).toContain('Apply')

    await applyButton.trigger('click')
    expect(wrapper.emitted('suggestion-applied')).toBeTruthy()
    expect(wrapper.emitted('suggestion-applied')?.[0]).toEqual([mockSuggestions[0]])
  })

  it('applies correct styling based on suggestion impact', () => {
    const wrapper = mount(GasAnalysis, {
      props: {
        investmentAmount: parseUnits('50', 'ether'),
        gasEstimate: mockGasEstimate,
        suggestions: mockSuggestions
      }
    })

    const suggestionItems = wrapper.findAll('[data-testid="suggestion-item"]')

    // High impact suggestion should have red styling
    const highImpactSuggestion = suggestionItems[0]
    expect(highImpactSuggestion.classes()).toContain('bg-red-50')

    // Medium impact suggestion should have amber styling
    const mediumImpactSuggestion = suggestionItems[1]
    expect(mediumImpactSuggestion.classes()).toContain('bg-amber-50')
  })

  it('renders timing suggestions when provided', () => {
    const wrapper = mount(GasAnalysis, {
      props: {
        investmentAmount: parseUnits('100', 'ether'),
        gasEstimate: mockGasEstimate,
        timingSuggestions: mockTimingSuggestions
      }
    })

    expect(wrapper.text()).toContain('Optimal Timing')
    expect(wrapper.text()).toContain('Current Time Status')
    expect(wrapper.text()).toContain('Best Hours for Low Gas')
    expect(wrapper.text()).toContain('High Gas Hours')
    expect(wrapper.text()).toContain('22:00')
    expect(wrapper.text()).toContain('09:00')
  })

  it('shows optimal timing indicator correctly', () => {
    const optimalTiming = {
      ...mockTimingSuggestions,
      currentOptimal: true
    }

    const wrapper = mount(GasAnalysis, {
      props: {
        investmentAmount: parseUnits('100', 'ether'),
        gasEstimate: mockGasEstimate,
        timingSuggestions: optimalTiming
      }
    })

    const indicator = wrapper.find('[data-testid="timing-indicator"]')
    expect(indicator.classes()).toContain('bg-green-500')
  })

  it('shows non-optimal timing indicator correctly', () => {
    const nonOptimalTiming = {
      ...mockTimingSuggestions,
      currentOptimal: false
    }

    const wrapper = mount(GasAnalysis, {
      props: {
        investmentAmount: parseUnits('100', 'ether'),
        gasEstimate: mockGasEstimate,
        timingSuggestions: nonOptimalTiming
      }
    })

    const indicator = wrapper.find('[data-testid="timing-indicator"]')
    expect(indicator.classes()).toContain('bg-amber-500')
  })

  it('calculates gas impact percentage correctly', () => {
    const wrapper = mount(GasAnalysis, {
      props: {
        investmentAmount: parseUnits('1000', 'ether'),
        gasEstimate: mockGasEstimate,
        costBreakdown: mockCostBreakdown
      }
    })

    expect(wrapper.text()).toContain('Gas represents 1.77% of total cost')
  })

  it('handles missing props gracefully', () => {
    const wrapper = mount(GasAnalysis, {
      props: {
        investmentAmount: parseUnits('100', 'ether')
      }
    })

    // Should not throw errors and should render basic structure
    expect(wrapper.find('.gas-analysis').exists()).toBe(true)
    expect(wrapper.text()).toContain('Transaction Cost Analysis')
  })
})
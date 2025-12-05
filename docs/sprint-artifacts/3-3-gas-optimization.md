# Story 3.3: Implement Gas Optimization for Investment Operations

Status: ready-for-dev

## Story

As an investor,
I want investment transactions to cost minimal gas fees,
So that small investments remain economically viable and accessible.

## Acceptance Criteria

1. **Gas Estimate Display**: Gas estimate displayed before transaction confirmation with both ETH and USD equivalent
2. **Cost Threshold Validation**: Transaction cost is less than 0.01 ETH for typical investment amounts with clear validation
3. **Gas Optimization Opportunities**: Gas optimization opportunities are explained to users with potential savings
4. **Network Congestion Handling**: Users are notified of higher gas costs during network congestion with waiting options
5. **Alternative Transaction Speeds**: Alternative transaction speeds presented with cost trade-offs (slow, standard, fast)
6. **Optimal Timing Suggestions**: Platform suggests optimal timing for gas cost savings with historical gas data
7. **Post-Transaction Verification**: Actual gas used displayed and compared to estimate with savings highlighted
8. **Total Cost Transparency**: Total cost (investment amount + gas) clearly shown with breakdown

## Tasks / Subtasks

- [ ] Implement gas estimation and display (AC: 1)
  - [ ] Add gas estimation functionality to useMortgageContract composable
  - [ ] Display gas cost in ETH and USD equivalent using real-time conversion rates
  - [ ] Show gas estimate prominently in investment interface
  - [ ] Update gas estimate dynamically based on network conditions
- [ ] Create cost threshold validation (AC: 2)
  - [ ] Validate that investment gas costs remain under 0.01 ETH target
  - [ ] Show warnings if gas costs exceed expected thresholds
  - [ ] Prevent investment suggestions for amounts where gas makes them uneconomical
  - [ ] Calculate effective cost including gas fees for investment decisions
- [ ] Implement gas optimization analysis (AC: 3)
  - [ ] Analyze investment function for gas optimization opportunities
  - [ ] Provide user-friendly explanations of gas optimization techniques
  - [ ] Show potential gas savings for different investment patterns
  - [ ] Suggest batch investment options for multiple transactions
- [ ] Add network congestion awareness (AC: 4)
  - [ ] Monitor network gas prices and detect congestion periods
  - [ ] Notify users when gas prices are unusually high
  - [ ] Provide option to wait for lower gas prices with time estimates
  - [ ] Show historical gas price patterns for planning
- [ ] Create transaction speed options (AC: 5)
  - [ ] Implement EIP-1559 transaction parameters for dynamic gas pricing
  - [ ] Offer slow, standard, and fast transaction speed options
  - [ ] Display cost differences between speed options clearly
  - [ ] Allow users to select preferred gas strategy
- [ ] Add optimal timing suggestions (AC: 6)
  - [ ] Analyze historical gas price data for optimal investment times
  - [ ] Suggest off-peak hours for lower gas costs
  - [ ] Show gas price trends and predictions
  - [ ] Provide gas price alerts when prices drop below threshold
- [ ] Implement post-transaction verification (AC: 7)
  - [ ] Display actual gas used after transaction completion
  - [ ] Compare actual vs estimated gas costs with accuracy percentage
  - [ ] Highlight gas savings when optimization techniques work
  - [ ) Show gas efficiency metrics and improvement suggestions
- [ ] Create total cost transparency (AC: 8)
  - [ ] Display comprehensive cost breakdown (investment + gas fees)
  - [ ] Show effective annual percentage rate (APR) including gas costs
  - [ ] Provide cost comparisons across different investment amounts
  - [ ) Include tax implications and optimization suggestions

## Dev Notes

### Architecture Compliance
- **Gas Optimization Target**: <0.01 ETH per operation [Source: docs/architecture.md#Core Architectural Decisions]
- **Performance Requirements**: Real-time updates with <1 second latency [Source: NFR2]
- **Error Handling**: Follow structured MortgageError type for gas-related errors [Source: docs/architecture.md#Error Message Format]
- **Frontend Pattern**: Use Entity-Based Composable pattern [Source: docs/architecture.md#Entity-Based Composable]

### Smart Contract Gas Optimization
**Investment Function Optimization:**
```solidity
function invest(uint256 amount) external nonReentrant onlyRole(INVESTOR_ROLE) {
    // Gas optimization: Use packed structs for investor data
    // Batch storage updates where possible
    // Minimize external calls and complex calculations

    // Optimized validation (fewer require statements)
    if (amount < MIN_INVESTMENT) revert InsufficientInvestment();
    if (amount > getRemainingFunding()) revert ExceedsFundingCapacity();

    // Atomic operations to minimize gas
    uint256 shares = calculateShares(amount); // Inline calculation
    uint256 newShares = _shares[msg.sender] + shares;
    uint256 newTotalShares = _totalShares + shares;
    uint256 newTotalFunded = _totalFunded + amount;

    // Batch state updates
    _shares[msg.sender] = newShares;
    _totalShares = newTotalShares;
    _totalFunded = newTotalFunded;

    // Optimized token transfer
    _transferUSDT(msg.sender, address(this), amount);

    emit Invested(msg.sender, amount, shares);
}
```

### Gas Estimation Implementation
**Frontend Gas Analysis:**
```typescript
// Gas estimation using useMortgageContract composable
const estimateInvestmentGas = async (amount: bigint) => {
  try {
    // Get gas estimate for investment transaction
    const gasEstimate = await contract.estimateGas.invest(amount);

    // Get current gas price
    const gasPrice = await contract.provider.getGasPrice();

    // Calculate total gas cost in ETH
    const gasCostETH = gasEstimate * gasPrice;

    // Convert to USD (using real-time rates)
    const gasCostUSD = await convertETHtoUSD(gasCostETH);

    // Validate against 0.01 ETH threshold
    const isWithinThreshold = gasCostETH < parseEther('0.01');

    return {
      gasLimit: gasEstimate,
      gasPrice: gasPrice,
      gasCostETH: formatEther(gasCostETH),
      gasCostUSD: formatUSD(gasCostUSD),
      isWithinThreshold,
      effectiveAPR: calculateEffectiveAPR(amount, gasCostETH)
    };
  } catch (error) {
    handleError(error);
    return null;
  }
};
```

### Dynamic Gas Pricing Strategy
**EIP-1559 Implementation:**
```typescript
// Transaction speed options with EIP-1559
const gasSpeedOptions = {
  slow: {
    maxPriorityFeePerGas: parseUnits('1', 'gwei'),
    maxFeePerGas: parseUnits('20', 'gwei'),
    estimatedTime: '5-10 minutes',
    savings: '~30%'
  },
  standard: {
    maxPriorityFeePerGas: parseUnits('2', 'gwei'),
    maxFeePerGas: parseUnits('30', 'gwei'),
    estimatedTime: '2-5 minutes',
    savings: '~15%'
  },
  fast: {
    maxPriorityFeePerGas: parseUnits('3', 'gwei'),
    maxFeePerGas: parseUnits('50', 'gwei'),
    estimatedTime: '< 2 minutes',
    savings: 'Base rate'
  }
};

// Adaptive gas pricing based on network conditions
const getOptimalGasPrice = async (urgency = 'standard') => {
  const baseFee = await provider.getFeeData();
  const networkLoad = await analyzeNetworkLoad();

  if (networkLoad < 0.5 && urgency === 'standard') {
    return {
      ...gasSpeedOptions.slow,
      reason: 'Network is clear - using slow option'
    };
  }

  return gasSpeedOptions[urgency];
};
```

### Gas Cost Transparency Interface
**Investment Cost Breakdown:**
```vue
<template>
  <div class="gas-analysis">
    <div class="cost-estimate">
      <h4>Transaction Cost Analysis</h4>
      <div class="cost-breakdown">
        <div class="cost-item">
          <span>Investment Amount:</span>
          <span>{{ formatCurrency(investmentAmount) }}</span>
        </div>
        <div class="cost-item">
          <span>Estimated Gas Cost:</span>
          <span>{{ gasData.gasCostETH }} ETH ({{ gasData.gasCostUSD }})</span>
        </div>
        <div class="cost-item total">
          <span>Total Cost:</span>
          <span>{{ formatTotalCost() }}</span>
        </div>
      </div>
    </div>

    <div class="gas-efficiency" v-if="!gasData.isWithinThreshold">
      <UAlert
        icon="i-heroicons-exclamation-triangle"
        color="amber"
        title="High Gas Costs"
        description="Gas costs are unusually high. Consider waiting or investing larger amounts."
      />
    </div>

    <div class="gas-options">
      <h5>Transaction Speed Options</h5>
      <URadioGroup v-model="selectedSpeed" :options="gasSpeedOptions" />
    </div>
  </div>
</template>
```

### Network Congestion Handling
**Gas Price Monitoring:**
```typescript
// Real-time gas price monitoring and alerts
const monitorGasPrices = () => {
  const [gasPrice, setGasPrice] = useState<bigint>();
  const [networkStatus, setNetworkStatus] = useState<'normal' | 'congested' | 'high'>('normal');

  useEffect(() => {
    const interval = setInterval(async () => {
      const currentGasPrice = await provider.getGasPrice();
      const networkLoad = await calculateNetworkLoad(currentGasPrice);

      setGasPrice(currentGasPrice);
      setNetworkStatus(networkLoad);

      // Show alerts for unusual conditions
      if (networkLoad === 'high') {
        showHighGasPriceAlert();
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return { gasPrice, networkStatus };
};
```

### Optimization Suggestions Engine
**Smart Gas Recommendations:**
```typescript
// Gas optimization analysis and suggestions
const analyzeOptimizationOpportunities = (investmentAmount: bigint, gasData: GasData) => {
  const suggestions = [];

  // Suggest larger investments if gas percentage is high
  const gasPercentage = (gasData.gasCostUSD / parseFloat(formatUSD(investmentAmount))) * 100;
  if (gasPercentage > 5) {
    suggestions.push({
      type: 'investment-size',
      message: 'Consider investing larger amounts to reduce gas cost percentage',
      savings: `Gas could be reduced to ${gasPercentage * 0.5}% with double the investment`
    });
  }

  // Suggest off-peak timing
  const currentHour = new Date().getHours();
  if (currentHour >= 9 && currentHour <= 17) {
    suggestions.push({
      type: 'timing',
      message: 'Gas prices are typically lower during off-peak hours',
      savings: 'Potential 20-40% savings by waiting until evening'
    });
  }

  return suggestions;
};
```

### Post-Transaction Analysis
**Gas Efficiency Reporting:**
```typescript
// Analyze actual vs estimated gas usage
const analyzeGasEfficiency = (receipt: TransactionReceipt, estimate: GasEstimate) => {
  const actualGasUsed = receipt.gasUsed;
  const estimatedGas = estimate.gasLimit;
  const accuracy = ((estimatedGas - actualGasUsed) / estimatedGas) * 100;

  return {
    actualGasUsed,
    estimatedGas,
    accuracy: Math.round(accuracy),
    savings: actualGasUsed < estimatedGas,
    efficiency: actualGasUsed / estimatedGas,
    recommendations: generateOptimizationRecommendations(accuracy)
  };
};

// Generate improvement suggestions based on performance
const generateOptimizationRecommendations = (accuracy: number) => {
  if (accuracy > 20) {
    return [
      'Gas estimate was significantly higher than actual usage',
      'Consider more precise gas estimation for future transactions'
    ];
  } else if (accuracy < -10) {
    return [
      'Transaction used more gas than estimated',
      'Network conditions changed during transaction'
    ];
  }
  return ['Gas estimation was accurate within acceptable range'];
};
```

### User Experience Optimization
- **Zero Knowledge Required**: Gas concepts explained in simple terms
- **Cost Transparency**: All costs clearly displayed before confirmation
- **Speed Options**: Clear trade-offs between cost and transaction speed
- **Smart Suggestions**: AI-powered recommendations for optimal timing
- **Real-time Feedback**: Instant gas price updates and network status

### Technical Integration Points
- **Epic 1**: Smart contract optimization for gas-efficient investment function
- **Epic 2**: Gas cost display in useMortgageContract composable and error handling
- **Story 3.1**: Direct integration with investment transaction flow
- **Story 3.2**: Gas cost considerations for real-time updates during high activity

### Gas Optimization Techniques
**Smart Contract Optimizations:**
- **Storage Packing**: Use packed structs for efficient storage usage
- **Batch Operations**: Combine multiple state updates in single transactions
- **Inline Functions**: Reduce external function call overhead
- **Efficient Loops**: Optimize iteration patterns and early exits
- **Event Optimization**: Use indexed parameters efficiently

**Frontend Optimizations:**
- **Batch Transactions**: Combine multiple operations where possible
- **Smart Scheduling**: Time transactions for optimal gas prices
- **Caching**: Cache gas estimates and network conditions
- **Prediction**: Use machine learning for gas price prediction

### Performance Requirements
- **Gas Target**: <0.01 ETH per typical investment transaction
- **Response Time**: Gas estimates calculated within 1 second
- **Accuracy**: Gas estimates within ±20% of actual usage
- **Update Frequency**: Gas price updates every 10 seconds

### Security Considerations
- **Gas Griefing Protection**: Prevent malicious gas price manipulation
- **Transaction Verification**: Validate all gas-related calculations
- **Replay Attack Prevention**: Ensure unique gas parameters per transaction
- **User Protection**: Warn about unusually high gas costs

### Project Context Reference

**Architecture Alignment:**
- Gas Optimization Target: <0.01 ETH per operation [Source: docs/architecture.md#Core Architectural Decisions]
- Performance Requirements: Real-time updates and responsive interface [Source: NFR2]
- Error Handling: Structured error format for gas-related issues [Source: docs/architecture.md#Error Message Format]
- Usability: Zero blockchain knowledge required with clear explanations [Source: NFR5]

**Epic Integration:**
- Critical for making fractional investments economically viable
- Enhances user experience by removing uncertainty around transaction costs
- Foundation for competitive platform positioning with low-cost investing
- Essential for user adoption and retention strategies

**Development Path:**
- Depends on Story 3.1: Investment function provides transactions to optimize
- Depends on Epic 2: Frontend infrastructure for gas cost display
- Enables competitive advantage with transparent pricing
- Supports Epic 4: Efficient portfolio management transactions

### References

- [Architecture: Gas Optimization Requirements](docs/architecture.md#Core Architectural Decisions)
- [Architecture: Performance Requirements](docs/architecture.md#Non-Functional Requirements)
- [Previous Story: 3.1 Investment Function](3-1-investment-function.md)
- [Previous Story: 3.2 Funding Progress](3-2-funding-progress.md)
- [EIP-1559 Ethereum Improvement Proposal](https://eips.ethereum.org/EIPS/eip-1559)
- [Ethereum Gas Tracking APIs](https://docs.etherscan.io/api/GasTracker)

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20251101)

### Debug Log References

### Completion Notes List

### File List
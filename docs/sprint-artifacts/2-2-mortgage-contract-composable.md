# Story 2.2: Implement useMortgageContract Composable with Complete API

Status: ready-for-dev

## Story

As a frontend developer,
I want to create a centralized composable for all contract interactions,
So that the frontend can consistently interact with mortgage smart contracts across all components.

## Acceptance Criteria

1. **Entity-Based Composable**: Implements `composables/useMortgageContract.ts` as the single source of truth for contract logic following AI-Agent Conflict Prevention pattern
2. **Reactive State Management**: Provides reactive state for `contract`, `stage`, `stats`, and `investorPosition` with automatic updates
3. **Complete Function API**: Implements all contract functions: `invest()`, `withdrawPayout()`, `withdrawLoan()`, `depositPrincipal()`, `depositInterest()`, `transferShares()`
4. **Marketplace Functions**: Includes marketplace functions: `createSellOrder()`, `cancelSellOrder()`, `buySellOrder()` for future trading features
5. **Structured Error Handling**: Exposes `lastError` reactive state following the structured MortgageError type from Architecture
6. **Real-time Event Listening**: Handles real-time event listening for contract state updates with automatic UI synchronization
7. **Type Safety**: Uses Viem for type-safe contract interactions with auto-generated ABIs
8. **Gas Estimation**: Provides gas estimates before transaction execution with user confirmation

## Tasks / Subtasks

- [ ] Set up composable foundation (AC: 1)
  - [ ] Create `composables/useMortgageContract.ts` file
  - [ ] Import Viem and Web3 dependencies
  - [ ] Set up basic composable structure with reactive state
  - [ ] Configure contract instance creation
- [ ] Implement reactive state management (AC: 2)
  - [ ] Create `contract` reactive ref for contract instance
  - [ ] Create `stage` reactive ref for contract stage tracking
  - [ ] Create `stats` reactive ref for contract statistics
  - [ ] Create `investorPosition` reactive ref for user position
  - [ ] Set up automatic state synchronization
- [ ] Implement core contract functions (AC: 3)
  - [ ] Create `invest()` function with USDT amount parameter
  - [ ] Create `withdrawPayout()` function for investor withdrawals
  - [ ] Create `withdrawLoan()` function for operator loan withdrawal
  - [ ] Create `depositPrincipal()` function for principal repayments
  - [ ] Create `depositInterest()` function for interest payments
  - [ ] Create `transferShares()` function for share transfers
- [ ] Implement marketplace functions (AC: 4)
  - [ ] Create `createSellOrder()` function for sell order creation
  - [ ] Create `cancelSellOrder()` function for order cancellation
  - [ ] Create `buySellOrder()` function for order fulfillment
  - [ ] Ensure marketplace functions align with Epic 3 trading patterns
- [ ] Implement structured error handling (AC: 5)
  - [ ] Create `lastError` reactive ref with MortgageError type
  - [ ] Implement error classification (CONTRACT, FRONTEND, NETWORK)
  - [ ] Add error translation from technical to user-friendly messages
  - [ ] Create error recovery mechanisms
- [ ] Set up real-time event listening (AC: 6)
  - [ ] Implement event listeners for all contract events
  - [ ] Create automatic state updates on event emission
  - [ ] Set up WebSocket or polling for real-time updates
  - [ ] Handle connection management and reconnection
- [ ] Implement type safety with Viem (AC: 7)
  - [ ] Import contract ABI from Foundry compilation
  - [ ] Create type-safe contract function wrappers
  - [ ] Implement type-safe event parsing
  - [ ] Set up TypeScript interfaces for all data structures
- [ ] Add gas estimation functionality (AC: 8)
  - [ ] Implement gas estimation for all contract functions
  - [ ] Create user-friendly gas cost display (ETH and USD)
  - [ ] Add transaction confirmation prompts
  - [ ] Implement gas optimization suggestions

## Dev Notes

### Architecture Compliance
- **Entity-Based Composable**: Must follow AI-Agent Conflict Prevention pattern exactly - single `useMortgageContract.ts` file
- **Required API Shape**: Must implement exact API shape specified in Architecture "Entity-Based Composable"
- **Error Handling**: Must follow structured MortgageError type from Architecture "Error Message Format"
- **Event Integration**: Must handle all events from Story 1.3 for real-time updates

### Required API Shape (From Architecture)
```typescript
const {
  contract,           // Contract instance
  stage,             // Current contract stage
  stats,             // Contract statistics (totalFunded, repaidPrincipal, etc.)
  investorPosition,  // User's investment position
  invest,            // Investment function
  withdrawPayout,    // Withdrawal function
  withdrawLoan,      // Operator loan withdrawal
  depositPrincipal,  // Principal repayment
  depositInterest,   // Interest repayment
  refreshState,      // Manual state refresh
  createSellOrder,   // Marketplace sell order
  cancelSellOrder,   // Cancel sell order
  buySellOrder,      // Buy from marketplace
  transferShares,    // Transfer shares
  lastError,         // Structured error state
} = useMortgageContract();
```

### MortgageError Type (From Architecture)
```typescript
type MortgageError = {
  scope: 'CONTRACT' | 'FRONTEND' | 'NETWORK';
  type: string;     // e.g., 'INVALID_STAGE', 'UNAUTHORIZED', 'INSUFFICIENT_SHARES'
  code?: string;    // optional: 'ERR_001', RPC codes, etc.
  message: string;  // human-readable explanation
}
```

### Reactive State Structure
```typescript
interface ContractStats {
  totalFunded: bigint;
  repaidPrincipal: bigint;
  repaidInterest: bigint;
  totalShares: bigint;
  investorCount: number;
  stage: ContractStage;
}

interface InvestorPosition {
  shares: bigint;
  entitledPrincipal: bigint;
  entitledInterest: bigint;
  withdrawablePrincipal: bigint;
  withdrawableInterest: bigint;
  ownershipPercentage: number;
}

interface ContractState {
  contract: Contract | null;
  stage: ContractStage;
  stats: ContractStats;
  investorPosition: InvestorPosition;
  lastError: MortgageError | null;
  isConnected: boolean;
  isConnecting: boolean;
}
```

### Contract Function Implementation
**Investment Functions:**
```typescript
const invest = async (amount: bigint) => {
  try {
    lastError.value = null;

    // Estimate gas
    const gasEstimate = await contract.estimateGas.invest(amount);

    // Execute transaction
    const tx = await contract.invest(amount);

    // Wait for confirmation
    const receipt = await tx.wait();

    // Refresh state
    await refreshState();

    return receipt;
  } catch (error) {
    handleError(error);
  }
};
```

**Operator Functions:**
```typescript
const withdrawLoan = async (amount: bigint) => {
  try {
    lastError.value = null;

    const gasEstimate = await contract.estimateGas.withdrawLoan(amount);
    const tx = await contract.withdrawLoan(amount);
    const receipt = await tx.wait();

    await refreshState();
    return receipt;
  } catch (error) {
    handleError(error);
  }
};
```

### Event Listening Implementation
**Event Listeners Setup:**
```typescript
const setupEventListeners = () => {
  if (!contract.value) return;

  // Investment events
  contract.on('Invested', (investor, amount, shares) => {
    refreshState();
  });

  // Loan events
  contract.on('LoanWithdrawn', (borrower, amount) => {
    refreshState();
  });

  // Repayment events
  contract.on('PrincipalDeposited', (from, amount) => {
    refreshState();
  });

  contract.on('InterestDeposited', (from, amount) => {
    refreshState();
  });

  // Withdrawal events
  contract.on('PayoutWithdrawn', (investor, principalAmount, interestAmount) => {
    refreshState();
  });

  // Stage change events
  contract.on('StageChanged', (oldStage, newStage, actor) => {
    stage.value = newStage;
    refreshState();
  });
};
```

### Error Handling Implementation
**Error Classification:**
```typescript
const handleError = (error: any) => {
  if (error.code === 'CALL_EXCEPTION') {
    lastError.value = {
      scope: 'CONTRACT',
      type: 'CONTRACT_EXECUTION_ERROR',
      code: error.code,
      message: translateContractError(error)
    };
  } else if (error.code === 'NETWORK_ERROR') {
    lastError.value = {
      scope: 'NETWORK',
      type: 'NETWORK_CONNECTION_ERROR',
      code: error.code,
      message: 'Network connection error. Please check your internet connection.'
    };
  } else {
    lastError.value = {
      scope: 'FRONTEND',
      type: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred. Please try again.'
    };
  }
};
```

### State Synchronization
**Refresh State Function:**
```typescript
const refreshState = async () => {
  if (!contract.value || !walletAddress.value) return;

  try {
    // Get contract stage
    stage.value = await contract.value.stage();

    // Get contract statistics
    stats.value = {
      totalFunded: await contract.value.totalFunded(),
      repaidPrincipal: await contract.value.repaidPrincipal(),
      repaidInterest: await contract.value.repaidInterest(),
      totalShares: await contract.value.totalShares(),
      investorCount: await contract.value.investorCount(),
      stage: stage.value
    };

    // Get investor position
    investorPosition.value = {
      shares: await contract.value.shares(walletAddress.value),
      entitledPrincipal: await contract.value.getEntitledPrincipal(walletAddress.value),
      entitledInterest: await contract.value.getEntitledInterest(walletAddress.value),
      withdrawablePrincipal: await contract.value.getWithdrawablePrincipal(walletAddress.value),
      withdrawableInterest: await contract.value.getWithdrawableInterest(walletAddress.value),
      ownershipPercentage: calculateOwnershipPercentage()
    };

    lastError.value = null;
  } catch (error) {
    handleError(error);
  }
};
```

### Gas Estimation and User Experience
**Gas Estimate Display:**
```typescript
const getGasEstimate = async (functionName: string, ...args: any[]) => {
  try {
    const gasEstimate = await contract.value.estimateGas[functionName](...args);
    const gasPrice = await contract.value.provider.getGasPrice();
    const ethCost = gasEstimate * gasPrice;

    return {
      gasLimit: gasEstimate,
      gasPrice: gasPrice,
      ethCost: formatEther(ethCost),
      usdCost: await convertToUSD(ethCost)
    };
  } catch (error) {
    handleError(error);
    return null;
  }
};
```

### Integration with Previous Stories
- **Story 2.1**: Nuxt Web3 Modal provides wallet connection infrastructure
- **Story 1.3**: Event system provides real-time update capabilities
- **Story 1.2**: AccessControl ensures proper permission handling
- **Story 1.1**: Foundry project provides contract ABI for type safety

### Type Safety Requirements
- **Contract Types**: Auto-generated from contract ABI
- **Event Types**: Typed event parsing and handling
- **Function Types**: Type-safe parameter and return types
- **State Types**: Comprehensive TypeScript interfaces

### Performance Optimization
- **Lazy Loading**: Load contract data only when needed
- **Caching**: Cache contract state to reduce RPC calls
- **Batching**: Batch multiple state updates
- **Debouncing**: Debounce state refresh calls

### Testing Requirements
- **Unit Tests**: Test individual composable functions
- **Integration Tests**: Test contract interaction flows
- **Mock Testing**: Mock contract calls for isolated testing
- **Error Tests**: Test error handling scenarios

### Future Enhancement Points
- **Multi-Contract Support**: Prepare for multiple mortgage contracts
- **Offline Support**: Cache state for offline functionality
- **Performance Monitoring**: Add performance metrics
- **Analytics Integration**: Track user interaction patterns

### Project Context Reference

**Architecture Alignment:**
- Entity-Based Composable: Single useMortgageContract file [Source: docs/architecture.md#Entity-Based Composable]
- Error Handling: Structured MortgageError type [Source: docs/architecture.md#Error Message Format]
- Event Integration: Handle all required events [Source: docs/architecture.md#Required Event Names]

**Epic Integration:**
- Foundation for Epic 2: User Authentication & Wallet Integration
- Enables Epic 3: Investment flow frontend interactions
- Supports Epic 4: Portfolio management functionality
- Critical for Epic 5: Operator control interface

**Development Path:**
- Depends on Story 2.1: Web3 Modal integration
- Enables Story 2.3: Structured error handling
- Foundation for Epic 3: Real-time investment flows
- Enables Epic 4: Portfolio dashboard functionality

### References

- [Architecture: Entity-Based Composable](docs/architecture.md#Entity-Based Composable)
- [Architecture: Error Message Format](docs/architecture.md#Error Message Format)
- [Architecture: Frontend Architecture](docs/architecture.md#Frontend Architecture)
- [Previous Story: 2.1 Nuxt Web3 Setup](2-1-nuxt-web3-setup.md)
- [Epic 1 Events: Event System](1-3-event-system.md)
- [Viem Documentation](https://viem.sh)
- [Nuxt 3 Composables Documentation](https://nuxt.com/docs/guide/directory-structure/composables)

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20251101)

### Debug Log References

### Completion Notes List

### File List
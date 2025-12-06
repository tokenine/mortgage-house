# Story 3.2: Create Real-time Funding Progress Visualization

Status: complete

## Story

As an investor,
I want to see real-time funding progress and participate in active investment opportunities,
So that I can make informed decisions about mortgage contract participation.

## Acceptance Criteria

1. **Funding Progress Bar**: Prominent progress bar showing current funding vs target amount with percentage completion
2. **Real-time Updates**: Real-time updates when other investors make investments without page refresh
3. **Transaction Feed**: List of recent investment transactions with timestamps, investor addresses (masked), and amounts
4. **Investor Position Display**: Shows investor's position relative to other investors (ownership percentage, total shares)
5. **Stage Transition Handling**: Contract automatically transitions to ACTIVE stage when 100% funding is achieved
6. **Investment Notifications**: Investors receive notifications when funding is complete and loan is being withdrawn
7. **Position Locking**: All investors see their positions locked for active mortgage period after funding complete
8. **High Performance**: UI remains responsive during high activity periods with multiple simultaneous investors

## Tasks / Subtasks

- [x] Create funding progress visualization component (AC: 1)
  - [x] Implement progress bar component showing percentage of total funded amount
  - [x] Add visual indicators for funding milestones (25%, 50%, 75%, 100%)
  - [x] Display funding target amount and current funded amount
  - [x] Add time-remaining estimates based on recent funding velocity
- [x] Implement real-time event listeners (AC: 2)
  - [x] Use useMortgageContract composable to listen for `Invested` events
  - [x] Create WebSocket or polling mechanism for instant updates
  - [x] Implement optimistic updates for immediate feedback with transaction confirmation
  - [x] Handle race conditions and conflicting updates with authoritative on-chain data
- [x] Create transaction history feed (AC: 3)
  - [x] Display chronological list of recent investment transactions
  - [x] Show transaction timestamp, masked investor address, and USDT amount
  - [x] Provide block explorer links for transaction verification
  - [x] Implement pagination for high-volume transaction histories
- [x] Implement investor position display (AC: 4)
  - [x] Show current investor's shares and ownership percentage
  - [x] Display relative position compared to other investors
  - [x] Calculate and display projected returns based on investment
  - [x] Update position immediately when investment completes
- [x] Create stage transition logic (AC: 5)
  - [x] Monitor contract stage changes from FUNDING to ACTIVE
  - [x] Update UI to reflect new stage when 100% funding achieved
  - [x] Show stage transition notifications with appropriate messaging
  - [x] Disable investment functionality when contract moves to ACTIVE stage
- [x] Implement notification system (AC: 6, 7)
  - [x] Create notification component for important funding events
  - [x] Send notifications when funding reaches 100% completion
  - [x] Notify investors when loan withdrawal process begins
  - [x] Show position lock status and explain what it means for investors
- [x] Optimize performance for high activity (AC: 8)
  - [x] Implement efficient rendering for frequent updates
  - [x] Use debouncing or throttling for rapid successive updates
  - [x] Create loading states during high-frequency updates
  - [x] Test performance with simulated high investment activity

## Dev Notes

### Architecture Compliance
- **Real-time Updates**: Leverage established event system from Epic 1 [Source: docs/architecture.md#Required Event Names]
- **Frontend Pattern**: Use Entity-Based Composable pattern [Source: docs/architecture.md#Entity-Based Composable]
- **Performance Requirements**: Page load times <3 seconds, real-time updates <1 second latency [Source: NFR2]
- **Error Handling**: Follow structured MortgageError type [Source: docs/architecture.md#Error Message Format]

### Real-time Update Implementation
**Event-Driven Architecture:**
```typescript
// Use useMortgageContract composable for event listeners
const {
  contract,
  stats, // totalFunded, totalShares, current stage
  investorPosition, // shares, ownership percentage
} = useMortgageContract();

// Real-time investment event listening
useEffect(() => {
  if (!contract) return;

  contract.on('Invested', (investor, amount, shares) => {
    // Update funding progress immediately
    updateFundingProgress();
    // Add to transaction feed
    addInvestmentTransaction({ investor, amount, shares, timestamp: Date.now() });
    // Show notification if it's the current user
    if (isCurrentUser(investor)) {
      showInvestmentSuccessNotification(amount, shares);
    }
  });

  contract.on('StageChanged', (oldStage, newStage, actor) => {
    if (newStage === Stage.ACTIVE) {
      showFundingCompleteNotification();
      updateUIForActiveStage();
    }
  });
}, [contract]);
```

### Funding Progress Visualization
**Progress Bar Component:**
```vue
<template>
  <div class="funding-progress">
    <div class="progress-header">
      <h3>Funding Progress</h3>
      <span class="percentage">{{ fundingPercentage }}%</span>
    </div>

    <UProgress
      :value="fundingPercentage"
      :max="100"
      color="primary"
      size="lg"
      class="progress-bar"
    />

    <div class="progress-details">
      <span class="funded">{{ formatCurrency(stats.totalFunded) }}</span>
      <span class="target">of {{ formatCurrency(loanAmount) }}</span>
    </div>

    <div class="time-estimate" v-if="!isFullyFunded">
      Estimated completion: {{ estimatedCompletion }}
    </div>
  </div>
</template>
```

### Transaction Feed Implementation
**Recent Investment Transactions:**
```vue
<template>
  <div class="transaction-feed">
    <h4>Recent Investments</h4>
    <div class="transaction-list">
      <div
        v-for="transaction in recentTransactions"
        :key="transaction.id"
        class="transaction-item"
      >
        <div class="transaction-header">
          <span class="investor">{{ maskAddress(transaction.investor) }}</span>
          <span class="time">{{ formatTime(transaction.timestamp) }}</span>
        </div>
        <div class="transaction-details">
          <span class="amount">{{ formatCurrency(transaction.amount) }}</span>
          <span class="shares">{{ transaction.shares }} shares</span>
        </div>
        <a
          :href="getExplorerLink(transaction.txHash)"
          target="_blank"
          class="explorer-link"
        >
          View on Explorer
        </a>
      </div>
    </div>
  </div>
</template>
```

### Performance Optimization
**Efficient Update Patterns:**
```typescript
// Debounce rapid updates to prevent performance issues
const debouncedUpdateProgress = useCallback(
  debounce(() => {
    updateFundingProgress();
    refreshInvestorPosition();
  }, 100),
  []
);

// Use React.memo for expensive components
const TransactionItem = React.memo(({ transaction }) => {
  return <div>{/* transaction rendering */}</div>;
});

// Batch updates for better performance
const updateStateBatch = useCallback((updates) => {
  startTransition(() => {
    setFundingProgress(updates.progress);
    setTransactionList(updates.transactions);
    setInvestorStats(updates.position);
  });
}, []);
```

### Stage Management Integration
**Contract Stage Handling:**
```typescript
// Stage enum from smart contract
enum Stage {
  FUNDING = 0,
  ACTIVE = 1,
  CLOSED = 2
}

// UI state management for stages
const stageConfig = {
  [Stage.FUNDING]: {
    allowInvestment: true,
    showProgress: true,
    message: 'Investment period active'
  },
  [Stage.ACTIVE]: {
    allowInvestment: false,
    showProgress: true,
    message: 'Funding complete - Mortgage active'
  },
  [Stage.CLOSED]: {
    allowInvestment: false,
    showProgress: true,
    message: 'Mortgage completed'
  }
};
```

### Notification System
**Investment Notifications:**
```vue
<template>
  <UNotifications>
    <UNotification
      v-if="fundingComplete"
      title="Funding Complete!"
      description="The mortgage has been fully funded and the loan withdrawal process has begun."
      icon="i-heroicons-check-circle"
      color="green"
    />

    <UNotification
      v-if="userInvestmentSuccess"
      title="Investment Successful"
      :description="`You invested ${formatCurrency(lastInvestmentAmount)} and received ${lastInvestmentShares} shares.`"
      icon="i-heroicons-banknotes"
      color="blue"
    />
  </UNotifications>
</template>
```

### High Activity Performance
**Scalability Considerations:**
- **Virtual Scrolling**: For transaction feeds with many entries
- **Pagination**: Limit displayed transactions to maintain performance
- **Caching**: Cache calculated values like ownership percentages
- **Lazy Loading**: Load older transactions on demand
- **WebSocket Optimization**: Efficient event filtering and batching

### User Experience Requirements
- **Zero Blockchain Knowledge**: Interface must be intuitive for non-crypto users
- **Instant Feedback**: Real-time updates create engaging investment experience
- **Clear Information**: All data presented in user-friendly currency and percentages
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Technical Integration Points
- **Epic 1**: Uses `Invested` events and stage management from smart contracts
- **Epic 2**: Depends on useMortgageContract composable and error handling
- **Story 3.1**: Integration with investment function for immediate feedback
- **Story 3.3**: Gas cost considerations during high activity periods

### Previous Story Intelligence
- **Epic 1**: Event system and smart contract foundation complete
- **Epic 2**: Frontend infrastructure and error handling ready
- **Story 3.1**: Investment function provides events to listen for
- **Architecture**: Real-time requirements and performance targets established

### Future Epic Dependencies
- **Epic 4**: Investment data for portfolio dashboard and earnings tracking
- **Epic 5**: Funding progress for operator dashboard and contract management
- **Epic 6**: Real-time monitoring and audit trail foundation

### Testing Requirements
- **Performance Testing**: Test with simulated high-frequency investments
- **Event Testing**: Verify real-time updates work correctly under load
- **UI Testing**: Test progress bar accuracy and transaction feed functionality
- **Cross-browser Testing**: Ensure consistent real-time behavior across browsers

### Security Considerations
- **Address Masking**: Hide full investor addresses for privacy
- **Data Validation**: Validate all real-time data against on-chain state
- **Replay Attack Prevention**: Prevent duplicate transaction processing
- **Rate Limiting**: Prevent UI flooding during extreme activity

### Project Context Reference

**Architecture Alignment:**
- Real-time Requirements: <1 second latency for updates [Source: NFR2]
- Event System: Leverages established `Invested` event pattern [Source: docs/architecture.md#Required Event Names]
- Performance Targets: 3-second page loads, responsive during high activity [Source: NFR2]
- Frontend Architecture: Uses established composables and error handling [Source: docs/architecture.md#Frontend Architecture]

**Epic Integration:**
- Enhances investment experience from Story 3.1 with real-time feedback
- Creates engaging user experience driving platform adoption
- Foundation for community investment activity and social proof
- Critical for investor confidence and platform transparency

**Development Path:**
- Depends on Story 3.1: Investment function provides events to visualize
- Depends on Epic 2: Frontend infrastructure and error handling
- Enables Epic 4: Investment data for portfolio management
- Supports Epic 5: Operator visibility into funding progress

### References

- [Architecture: Performance Requirements](docs/architecture.md#Non-Functional Requirements)
- [Architecture: Required Event Names](docs/architecture.md#Required Event Names)
- [Previous Story: 3.1 Investment Function](3-1-investment-function.md)
- [Previous Epic: Epic 2 Frontend Foundation](2-2-mortgage-contract-composable.md)
- [Epic 3 Details: Investment Flow](docs/epics.md#Epic-3-Mortgage-Contract-Investment-Flow)

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20251101)

### Debug Log References

### Completion Notes List

### File List
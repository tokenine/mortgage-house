# Story 4.3: Implement Instant Withdrawal Processing

Status: ready-for-dev

## Story

As an investor,
I want to withdraw my entitled earnings instantly with one click,
So that I can access my money immediately without delays or manual processes.

## Acceptance Criteria

### AC1: Withdrawal Interface Design
**Given** I have withdrawable amounts in my mortgage investments
**When** I view my portfolio or individual investment
**Then** I see clear "Withdraw" buttons with amounts for principal and interest separately
**And** I can choose to withdraw principal only, interest only, or both
**And** I see the transaction details and gas cost before confirmation
**And** I receive a one-click withdrawal experience with minimal confirmation steps

### AC2: Smart Contract Withdrawal Function
**Given** I confirm a withdrawal
**When** the transaction is processed
**Then** the smart contract calculates my exact withdrawable amounts
**And** the `withdraw()` function transfers entitled amounts to my wallet immediately
**And** the contract emits `PayoutWithdrawn` event with principal and interest amounts
**And** my withdrawable balances are updated to reflect the withdrawal
**And** I receive instant confirmation with transaction link

### AC3: Multi-Contract Withdrawal Support
**Given** I have multiple investments with withdrawable amounts
**When** I want to withdraw from multiple contracts
**Then** I can process withdrawals individually or in batch where supported
**And** each withdrawal is processed atomically to prevent race conditions
**And** I can see the status of each withdrawal in real-time
**And** my portfolio updates immediately to reflect new balances

### AC4: Error Handling and Validation
**Given** I attempt to withdraw more than my entitled amounts
**When** the transaction is processed
**Then** the contract rejects the withdrawal with a clear error message
**And** the frontend displays user-friendly error explanation
**And** my withdrawable amounts remain unchanged
**And** I receive guidance on correct withdrawal amounts

### AC5: Gas Optimization
**Given** withdrawal transactions are processed
**When** I review the transaction costs
**Then** gas usage remains under 0.01 ETH for typical withdrawals
**And** gas estimates are provided before transaction confirmation
**And** the platform suggests optimal timing for gas cost savings
**And** actual gas usage is compared to estimates for transparency

### AC6: Real-Time State Updates
**Given** a withdrawal is completed successfully
**When** I view my portfolio or investment details
**Then** all displayed values update automatically within 3 seconds
**And** withdrawable amounts reflect the completed withdrawal
**And** portfolio metrics update to show new balances
**And** transaction history includes the completed withdrawal

## Tasks / Subtasks

- [ ] Task 1: Implement Smart Contract Withdrawal Function (AC: 2, 4, 5)
  - [ ] Subtask 1.1: Create withdraw() function in MortgageContract
  - [ ] Subtask 1.2: Add withdrawable amount validation logic
  - [ ] Subtask 1.3: Implement PayoutWithdrawn event emission
  - [ ] Subtask 1.4: Add ReentrancyGuard protection
  - [ ] Subtask 1.5: Create comprehensive Foundry tests

- [ ] Task 2: Extend useMortgageContract Composable (AC: 1, 2, 3, 6)
  - [ ] Subtask 2.1: Add withdraw() function to composable
  - [ ] Subtask 2.2: Implement withdrawal amount calculations
  - [ ] Subtask 2.3: Add batch withdrawal support
  - [ ] Subtask 2.4: Implement real-time state updates after withdrawal
  - [ ] Subtask 2.5: Add withdrawal history tracking

- [ ] Task 3: Create Withdrawal Interface Components (AC: 1, 3, 4, 6)
  - [ ] Subtask 3.1: Build WithdrawalForm component
  - [ ] Subtask 3.2: Create WithdrawalConfirmation modal
  - [ ] Subtask 3.3: Implement BatchWithdrawal interface
  - [ ] Subtask 3.4: Add WithdrawalStatus component
  - [ ] Subtask 3.5: Create WithdrawalHistory display

- [ ] Task 4: Integration with Portfolio Dashboard (AC: 1, 3, 6)
  - [ ] Subtask 4.1: Integrate withdrawal buttons in PortfolioDashboard
  - [ ] Subtask 4.2: Connect withdrawal interface with InvestmentCard
  - [ ] Subtask 4.3: Add withdrawal availability indicators
  - [ ] Subtask 4.4: Implement real-time portfolio updates
  - [ ] Subtask 4.5: Add withdrawal success/error notifications

- [ ] Task 5: Testing and Validation (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Subtask 5.1: Unit test withdrawal functionality
  - [ ] Subtask 5.2: Integration test contract-frontend interaction
  - [ ] Subtask 5.3: E2E test withdrawal user flows
  - [ ] Subtask 5.4: Performance test gas optimization
  - [ ] Subtask 5.5: Test error handling and validation

## Dev Notes

### Critical Integration Requirements

**SMART CONTRACT DEVELOPMENT:**
- MUST extend MortgageContract.sol with withdrawal function based on Epic 4.1 pro-rata calculations [Source: 4-1-pro-rata-distribution.md]
- MUST use established event naming patterns from architecture [Source: docs/architecture.md#AI-Agent-Conflict-Prevention-&-Development-Conventions]
- MUST implement ReentrancyGuard protection on all withdrawal functions
- MUST validate withdrawable amounts against user's entitled but not withdrawn amounts

**FRONTEND DEVELOPMENT:**
- MUST extend useMortgageContract composable from Epic 2 & 4.1 [Source: 2-2-mortgage-contract-composable.md, 4-1-pro-rata-distribution.md]
- MUST integrate with portfolio dashboard from Epic 4.2 [Source: 4-2-portfolio-dashboard.md]
- MUST use structured error handling system from Epic 2 [Source: 2-3-structured-error-handling.md]
- MUST follow established Vue 3 Composition API patterns [Source: docs/architecture.md#Frontend-Architecture]

**GAS OPTIMIZATION REQUIREMENTS:**
- MUST achieve <0.01 ETH per withdrawal operation
- MUST provide gas estimates before transaction confirmation
- MUST use efficient storage patterns for withdrawable amount tracking
- MUST implement batch withdrawal support where beneficial

### Smart Contract Implementation Details

**Core Withdrawal Function:**
```solidity
function withdraw(bool withdrawPrincipal, bool withdrawInterest) external nonReentrant {
    // Calculate withdrawable amounts
    // Validate amounts > 0
    // Update state to prevent double withdrawal
    // Transfer tokens to investor
    // Emit PayoutWithdrawn event
}
```

**State Management:**
- Track `withdrawnPrincipal[user]` and `withdrawnInterest[user]`
- Use entitled amounts from pro-rata distribution calculations
- Implement withdrawal history tracking for audit trail

**Event Emission:**
```solidity
event PayoutWithdrawn(
    address indexed investor,
    uint256 principalAmount,
    uint256 interestAmount,
    uint256 timestamp
);
```

### Frontend Component Architecture

**Component Hierarchy:**
```vue
<WithdrawalInterface>
  <WithdrawalOptions :available="withdrawableAmounts" />
  <WithdrawalConfirmation :transaction="withdrawalDetails" />
  <BatchWithdrawal :investments="multiContractWithdrawals" />
  <WithdrawalStatus :transactions="withdrawalHistory" />
</WithdrawalInterface>
```

**State Management Pattern:**
```typescript
// Extend useMortgageContract composable
const withdrawal = computed(() => ({
  withdrawablePrincipal: calculateWithdrawablePrincipal(),
  withdrawableInterest: calculateWithdrawableInterest(),
  isWithdrawing: isWithdrawingState.value,
  withdrawalHistory: withdrawalHistory.value
}))

const { withdraw, withdrawBatch, getWithdrawalHistory } = useMortgageContract()
```

### Integration Points

**With Epic 4.1 (Pro-rata Distribution):**
- Use entitled principal/interest calculations for withdrawal amounts
- Leverage distribution event listeners for real-time updates
- Maintain precision arithmetic from distribution calculations

**With Epic 4.2 (Portfolio Dashboard):**
- Integrate withdrawal buttons in portfolio components
- Update portfolio state after successful withdrawals
- Use portfolio error handling patterns for withdrawal failures

**With Epic 2 (Web3 Integration):**
- Extend useMortgageContract composable with withdrawal functions
- Use structured error handling for withdrawal failures
- Apply gas optimization patterns from investment operations

### Testing Strategy

**Smart Contract Tests:**
- Test withdrawal calculation accuracy
- Validate reentrancy protection
- Test boundary conditions (zero amounts, excess withdrawals)
- Verify event emission completeness
- Gas optimization testing

**Frontend Tests:**
- Component interaction testing
- Real-time state update validation
- Error handling and user feedback
- Batch withdrawal functionality
- Integration with portfolio dashboard

### Security Considerations

**Reentrancy Protection:**
- Use OpenZeppelin ReentrancyGuard on withdrawal functions
- Update state before external token transfers
- Implement withdrawal amount validation

**Access Control:**
- Validate investor permissions for withdrawals
- Prevent unauthorized withdrawals from other accounts
- Ensure proper role-based access control

**Input Validation:**
- Validate withdrawal amounts against available balances
- Prevent negative or zero amount withdrawals
- Check contract stage before allowing withdrawals

### Performance Requirements

**Transaction Processing:**
- Withdrawal transactions must complete in <30 seconds
- Gas usage must remain under 0.01 ETH target
- Real-time state updates within 3 seconds

**User Experience:**
- One-click withdrawal for available amounts
- Clear transaction progress indicators
- Immediate feedback on withdrawal status

### File Structure Requirements

```
/contracts/src/
  - MortgageContract.sol (extend with withdrawal functions)

/frontend/components/withdrawal/ (new directory)
  - WithdrawalInterface.vue (main container)
  - WithdrawalForm.vue (withdrawal input form)
  - WithdrawalConfirmation.vue (transaction confirmation)
  - BatchWithdrawal.vue (multi-contract withdrawals)
  - WithdrawalStatus.vue (status tracking)
  - WithdrawalHistory.vue (historical display)

/frontend/composables/
  - useMortgageContract.ts (extend with withdrawal functions)
  - useWithdrawal.ts (withdrawal-specific composable)

/frontend/utils/withdrawal/ (new directory)
  - withdrawalCalculations.ts (amount calculations)
  - withdrawalValidation.ts (input validation)
  - gasEstimation.ts (gas cost calculations)
```

### References

- [Epic 4 Details: Withdrawal Management](docs/epics.md#Epic-4-Investor-Portfolio-and-Withdrawal-Management)
- [Architecture: Smart Contract Patterns](docs/architecture.md#Smart-Contract-Architecture)
- [Epic 4.1: Pro-rata Distribution](4-1-pro-rata-distribution.md)
- [Epic 4.2: Portfolio Dashboard](4-2-portfolio-dashboard.md)
- [Epic 2: Web3 Integration](2-1-nuxt-web3-setup.md, 2-2-mortgage-contract-composable.md)
- [Architecture: Development Conventions](docs/architecture.md#AI-Agent-Conflict-Prevention-&-Development-Conventions)

## Dev Agent Record

### Context Reference
<!-- Implementation context will be tracked here -->

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20251101)

### Debug Log References

### Completion Notes List

### File List
# Story 5.2: Implement Loan Withdrawal and Repayment Processing

**Status:** ready-for-dev
**Epic:** 5 - Master Wallet Operator Controls
**Created:** 2025-12-06
**Author:** Scrum Master (Bob)

---

## 🎯 Story Foundation

As a master wallet operator,
I want to withdraw funded loan amounts and process borrower repayments,
So that I can manage the complete mortgage lifecycle and ensure investor distributions.

## ✅ Acceptance Criteria

### AC1: Loan Withdrawal Processing
**Given** a mortgage contract has completed funding
**When** I access the operator controls for that contract
**Then** I see "Withdraw Loan" option with the total funded amount available
**And** I can initiate loan withdrawal to the borrower's wallet address
**And** I see real-time status updates during the withdrawal process
**And** the contract emits `LoanWithdrawn` event with withdrawal details

### AC2: Principal Repayment Processing
**Given** the borrower makes a principal repayment
**When** I process the repayment in the operator dashboard
**Then** I can input the principal repayment amount with validation
**And** the `depositPrincipal()` function updates the contract state and calculates pro-rata distributions
**And** all investors' entitled principal amounts are updated automatically
**And** the contract emits `PrincipalDeposited` event with total amount and per-investor allocations

### AC3: Interest Repayment Processing
**Given** the borrower makes an interest payment
**When** I process the interest payment
**Then** I can input the interest amount with proper validation
**And** the `depositInterest()` function updates contract state and calculates investor entitlements
**And** all investors' withdrawable interest amounts are updated immediately
**And** the contract emits `InterestDeposited` event with distribution breakdown
**And** I can see the updated repayment schedule and remaining obligations

### AC4: Real-time Processing Updates
**Given** I am processing any loan operation
**When** the transaction is confirmed on-chain
**Then** all investor portfolios update automatically with new withdrawable amounts
**And** I can see the immediate impact on investor earnings in real-time
**And** transaction history is updated with complete operation details
**And** contract stage transitions appropriately based on repayment status

---

## 🏗️ Developer Context Section

### 🔴 CRITICAL: Do Not Violate These Constraints

**SMART CONTRACT DEVELOPMENT:**
- MUST extend existing MortgageContract.sol with new loan operation functions [Source: 1-2-mortgage-contract-core.md]
- MUST use existing OPERATOR_ROLE pattern for function restrictions [Source: 1-2-mortgage-contract-core.md]
- MUST integrate with pro-rata distribution system from Epic 4.1 [Source: 4-1-pro-rata-distribution.md]
- MUST emit events following established naming conventions [Source: 1-3-event-system.md]

**FRONTEND INTEGRATION:**
- MUST extend existing useMortgageContract composable with loan operation functions [Source: 2-2-mortgage-contract-composable.md]
- MUST use structured error handling system from Epic 2 [Source: 2-3-structured-error-handling.md]
- MUST maintain real-time state synchronization from Epic 3 [Source: 3-2-funding-progress.md]
- MUST integrate with portfolio dashboard from Epic 4.2 [Source: 4-2-portfolio-dashboard.md]

### 📊 Technical Requirements

**Smart Contract Functions to Implement/Extend:**

```solidity
// Extend MortgageContract.sol with loan operation functions

function withdrawLoan(address borrower, uint256 amount)
    external onlyOperator nonReentrant {
    require(stage == Stage.FUNDING_COMPLETE, "Loan already withdrawn");
    require(amount <= totalFunded, "Insufficient funded amount");

    totalFunded -= amount;
    loanWithdrawn += amount;

    emit LoanWithdrawn(borrower, amount);
    emit StageChanged(uint8(Stage.FUNDING_COMPLETE), uint8(Stage.ACTIVE), msg.sender);
}

function depositPrincipal(uint256 amount)
    external onlyOperator nonReentrant {
    require(stage == Stage.ACTIVE, "Contract not active");
    require(amount > 0, "Amount must be greater than 0");

    principalRepaid += amount;
    uint256 perShareAmount = (amount * 1e18) / totalShares;

    emit PrincipalDeposited(msg.sender, amount, principalRepaid, perShareAmount);
}

function depositInterest(uint256 amount)
    external onlyOperator nonReentrant {
    require(stage == Stage.ACTIVE, "Contract not active");
    require(amount > 0, "Amount must be greater than 0");

    interestPaid += amount;
    uint256 perShareAmount = (amount * 1e18) / totalShares;

    emit InterestDeposited(msg.sender, amount, interestPaid, perShareAmount);
}
```

**Additional State Variables Needed:**
```solidity
uint256 public loanWithdrawn;
uint256 public principalRepaid;
uint256 public interestPaid;
address public borrower;
```

**Required Event Emissions:**
```solidity
event LoanWithdrawn(address indexed borrower, uint256 amount);
event PrincipalDeposited(address indexed from, uint256 amount, uint256 totalPrincipal, uint256 perShareAmount);
event InterestDeposited(address indexed from, uint256 amount, uint256 totalInterest, uint256 perShareAmount);
```

**Frontend Loan Operations Interface:**

```typescript
// Extend useMortgageContract.ts with loan operation functions
const withdrawLoan = async (contractAddress: string, borrower: string, amount: bigint) => {
    // Validate loan withdrawal conditions
    // Execute withdrawLoan function with OPERATOR_ROLE
    // Handle real-time state updates
    // Update portfolio dashboards automatically
}

const depositPrincipal = async (contractAddress: string, amount: bigint) => {
    // Validate principal repayment amount
    // Calculate and display per-share impact
    // Execute depositPrincipal function
    // Trigger portfolio updates for all investors
}

const depositInterest = async (contractAddress: string, amount: bigint) => {
    // Validate interest repayment amount
    // Calculate distribution impact
    // Execute depositInterest function
    // Update withdrawable amounts across all portfolios
}

// New reactive state for loan operations
const loanOperationStatus = ref<LoanOperationStatus>('idle')
const repaymentSchedule = ref<RepaymentSchedule[]>([])
```

### 🎨 Architecture Compliance

**File Structure Requirements:**
```
/contracts/src/MortgageContract.sol (extend existing)
  - Add withdrawLoan(), depositPrincipal(), depositInterest() functions
  - Add loan withdrawal and repayment state variables
  - Maintain existing AccessControl and event patterns

/contracts/test/LoanOperations.t.sol (new)
  - Test loan withdrawal functionality
  - Test principal repayment processing
  - Test interest repayment processing
  - Test pro-rata distribution calculations

/frontend/components/operator/ (new)
  - LoanWithdrawalForm.vue - loan withdrawal interface
  - PrincipalRepaymentForm.vue - principal repayment processing
  - InterestRepaymentForm.vue - interest repayment processing
  - RepaymentSchedule.vue - loan payment schedule display

/frontend/composables/useMortgageContract.ts (extend existing)
  - Add loan operation functions and reactive state
  - Integrate with existing error handling patterns
  - Maintain real-time synchronization with portfolio system

/frontend/pages/operator/ (extend existing)
  - contract-detail.vue - comprehensive contract management
  - loan-operations.vue - centralized loan operations interface
```

**Naming Conventions:**
- Functions: camelCase with clear purpose (`withdrawLoan`, `depositPrincipal`, `depositInterest`)
- Events: Past tense with indexed parameters (`LoanWithdrawn`, `PrincipalDeposited`, `InterestDeposited`)
- Variables: descriptive with clear ownership (`loanWithdrawn`, `principalRepaid`, `interestPaid`)
- Components: PascalClear with specific purpose (`LoanWithdrawalForm`, `RepaymentSchedule`)

**Gas Optimization Requirements:**
- Target <0.01 ETH per operation [Source: docs/architecture.md#Core Architectural Decisions]
- Use efficient arithmetic for pro-rata calculations
- Minimize storage operations in distribution calculations
- Batch updates where possible for multiple investors

### 📚 Library & Framework Requirements

**Smart Contract Libraries:**
- OpenZeppelin v5+ AccessControl (already integrated) [Source: 1-2-mortgage-contract-core.md]
- Existing MortgageContract foundation with all patterns from Epic 1
- Pro-rata distribution patterns from Epic 4.1

**Frontend Libraries:**
- Viem for contract interactions (already integrated) [Source: 2-2-mortgage-contract-composable.md]
- Nuxt 3 composables pattern (already established)
- Real-time state management patterns from Epic 3

**Mathematical Libraries:**
- Fixed-point arithmetic for precise pro-rata calculations
- Overflow protection for large number operations
- Percentage calculations for distribution accuracy

### 🧪 Testing Requirements

**Smart Contract Tests Must Include:**
1. **Loan Withdrawal Validation**
   - Test loan withdrawal only allowed in correct stage
   - Test operator role restrictions enforced
   - Test amount validation and state updates
   - Test event emission accuracy

2. **Principal Repayment Processing**
   - Test pro-rata distribution calculations accuracy
   - Test investor entitlement updates
   - Test event emission with per-share amounts
   - Test cumulative repayment tracking

3. **Interest Repayment Processing**
   - Test separate interest tracking from principal
   - Test distribution calculation accuracy
   - Test withdrawable amount updates
   - Test payment schedule updates

4. **Integration with Portfolio System**
   - Test portfolio updates triggered by loan operations
   - Test real-time state synchronization
   - Test withdrawable amount calculations

**Frontend Tests Must Include:**
1. **Loan Operation Forms**
   - Test form validation for all input types
   - Test real-time calculation previews
   - Test error handling and user feedback
   - Test transaction status tracking

2. **Real-time Updates**
   - Test portfolio dashboard updates after loan operations
   - Test investor notification systems
   - Test transaction history integration
   - Test stage transition handling

### 🔍 Previous Story Intelligence

**Epic 4 Learnings (Portfolio Management):**
- Pro-rata distribution calculation patterns [Source: 4-1-pro-rata-distribution.md]
- Real-time portfolio update mechanisms [Source: 4-2-portfolio-dashboard.md]
- Withdrawal processing and state management [Source: 4-3-withdrawal-processing.md]
- Transaction tracking and audit trails [Source: 4-4-transaction-tracking.md]

**Epic 3 Learnings (Investment Flow):**
- Real-time event monitoring and state updates [Source: 3-2-funding-progress.md]
- Gas optimization for transaction operations [Source: 3-3-gas-optimization.md]
- Form validation and user interaction patterns [Source: 3-1-investment-function.md]

**Epic 2 Learnings (Web3 Integration):**
- useMortgageContract composable extension patterns [Source: 2-2-mortgage-contract-composable.md]
- Structured error handling for complex operations [Source: 2-3-structured-error-handling.md]
- Transaction status tracking and user feedback [Source: 2-1-nuxt-web3-setup.md]

**Epic 1 Learnings (Smart Contract Foundation):**
- OPERATOR_ROLE access control patterns [Source: 1-2-mortgage-contract-core.md]
- Event emission and audit trail requirements [Source: 1-3-event-system.md]
- Comprehensive testing strategies [Source: 1-4-foundry-test-suite.md]

### 📋 Git Intelligence Summary

**Recent Commit Patterns:**
- Loan operations follow validate → execute → emit event → update state pattern
- Frontend forms provide real-time calculation previews
- Real-time updates triggered through event listening
- Error handling provides specific recovery guidance

**File Creation Patterns:**
- New operator components follow established naming conventions
- Composable extensions maintain existing API consistency
- Test files cover complete operation flows and edge cases
- Integration with existing portfolio system for complete user experience

### 🌐 Latest Technical Information

**Pro-rata Distribution Integration:**
- Use existing distribution calculation patterns from Epic 4.1
- Maintain 99.9% calculation accuracy requirement
- Separate principal and interest tracking for accounting clarity
- Real-time portfolio updates for all affected investors

**Real-time State Management:**
- Extend existing event listening patterns from Epic 3
- Trigger portfolio updates automatically on loan operations
- Maintain <1 second latency for state synchronization
- Handle concurrent operations safely

**Operator Interface Patterns:**
- Follow established dashboard patterns from Epic 4.2
- Use role-based access control consistent with other operator functions
- Provide comprehensive operation history and audit trails
- Maintain responsive design for mobile operator access

### 📖 Project Context Reference

**Architecture Alignment:**
- **Smart Contract Operations**: Extend existing AccessControl and event patterns [Source: docs/architecture.md#Smart Contract Architecture]
- **Frontend Architecture**: Use established composable and error handling patterns [Source: docs/architecture.md#Frontend Architecture]
- **Real-time Updates**: Maintain existing synchronization patterns [Source: docs/architecture.md#Real-time Requirements]
- **Mathematical Accuracy**: Preserve 99.9% calculation requirements [Source: docs/architecture.md#Non-Functional Requirements]

**Epic Integration:**
- **Foundation**: Builds on Epic 1 AccessControl and Epic 4.1 pro-rata distributions
- **Enables**: Epic 5.3 stage management system with loan lifecycle tracking
- **Supports**: Epic 5.4 operational metrics with loan operation data
- **Critical for**: Complete mortgage lifecycle management and investor experience

**Business Value:**
- **Complete Lifecycle**: Enables full mortgage loan management from funding to repayment
- **Investor Transparency**: Real-time portfolio updates build trust and satisfaction
- **Operational Efficiency**: Streamlined loan processing reduces administrative overhead
- **Financial Accuracy**: Precise pro-rata calculations ensure fair investor distributions

**Loan Operation Workflow:**
- **Loan Withdrawal**: Operator transfers funded amount to borrower after funding complete
- **Principal Repayment**: Borrower repayments distributed pro-rata to all investors
- **Interest Repayment**: Separate interest tracking and distribution for tax efficiency
- **Real-time Updates**: All operations trigger immediate portfolio updates across platform

### 🔗 References

- [Architecture: Smart Contract Operations](docs/architecture.md#Smart Contract Architecture)
- [Epic 1: Access Control Foundation](1-2-mortgage-contract-core.md)
- [Epic 4.1: Pro-rata Distribution System](4-1-pro-rata-distribution.md)
- [Epic 4.2: Portfolio Dashboard](4-2-portfolio-dashboard.md)
- [Epic 3.2: Real-time Updates](3-2-funding-progress.md)

---

## 🎯 Dev Agent Execution Instructions

### Step 1: Extend Smart Contract
1. **Add loan operation functions** to MortgageContract.sol
2. **Implement withdrawLoan()** with stage validation and OPERATOR_ROLE restriction
3. **Implement depositPrincipal()** with pro-rata distribution calculations
4. **Implement depositInterest()** with separate interest tracking
5. **Add required state variables** for loan lifecycle tracking

### Step 2: Integrate with Distribution System
1. **Use existing pro-rata calculation** patterns from Epic 4.1
2. **Maintain 99.9% accuracy** for all distribution calculations
3. **Separate principal and interest** tracking for accounting clarity
4. **Update withdrawable amounts** automatically for all investors

### Step 3: Create Frontend Interface
1. **Create loan operation components** in /frontend/components/operator/
2. **Extend useMortgageContract composable** with loan operation functions
3. **Implement real-time state updates** triggered by loan operations
4. **Add comprehensive form validation** and error handling

### Step 4: Real-time Integration
1. **Trigger portfolio updates** automatically on loan operations
2. **Update withdrawable amounts** across all investor portfolios
3. **Maintain <1 second latency** for state synchronization
4. **Handle concurrent operations** safely without conflicts

### Step 5: Comprehensive Testing
1. **Smart contract tests** for loan operations and distribution accuracy
2. **Frontend tests** for form validation and real-time updates
3. **Integration tests** for complete loan lifecycle
4. **Mathematical accuracy tests** for pro-rata calculations

### ✅ Success Criteria
- [ ] All loan operation functions implemented with proper access control
- [ ] Pro-rata distribution calculations maintain 99.9% accuracy
- [ ] Real-time portfolio updates work automatically
- [ ] Loan withdrawal and repayment processing tested end-to-end
- [ ] Error handling comprehensive and user-friendly
- [ ] Gas optimization targets met for all operations
- [ ] Integration with existing portfolio system seamless

---

## 🚨 Critical Warning: Do Not Skip These Requirements

1. **MUST integrate with pro-rata distribution system** from Epic 4.1
2. **MUST maintain OPERATOR_ROLE access control** from Epic 1
3. **MUST trigger real-time portfolio updates** for all investors
4. **MUST separate principal and interest tracking** accurately
5. **MUST emit proper events** for complete audit trail
6. **MUST maintain 99.9% calculation accuracy** throughout
7. **MUST include comprehensive testing** for all loan operations

---

## Dev Agent Record

### Context Reference
<!-- Implementation context will be tracked here -->

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250901)

### Debug Log References

### Completion Notes List
- Complete loan operations story ready for development
- Integrated with existing distribution and portfolio systems
- All technical constraints and patterns identified

### File List (Expected)
- `/contracts/src/MortgageContract.sol` (extend existing)
- `/contracts/test/LoanOperations.t.sol` (new)
- `/frontend/components/operator/LoanWithdrawalForm.vue` (new)
- `/frontend/components/operator/PrincipalRepaymentForm.vue` (new)
- `/frontend/components/operator/InterestRepaymentForm.vue` (new)
- `/frontend/composables/useMortgageContract.ts` (extend existing)
- Test coverage reports and integration verification

**Status:** ready-for-dev
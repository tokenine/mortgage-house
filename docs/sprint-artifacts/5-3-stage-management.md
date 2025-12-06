# Story 5.3: Create Contract Stage Management System

**Status:** ready-for-dev
**Epic:** 5 - Master Wallet Operator Controls
**Created:** 2025-12-06
**Author:** Scrum Master (Bob)

---

## 🎯 Story Foundation

As a master wallet operator,
I want to manage contract stage transitions (Funding → Active → Closed),
So that I can control the mortgage lifecycle and ensure proper state management.

## ✅ Acceptance Criteria

### AC1: Stage Visualization and Controls
**Given** I am managing a mortgage contract
**When** I access the stage management controls
**Then** I can see the current contract stage: FUNDING, ACTIVE, or CLOSED
**And** I understand what operations are available in each stage
**And** I can initiate stage transitions with proper validation and confirmations
**And** I see a clear timeline of stage changes with reasons and timestamps

### AC2: Active Stage Transition
**Given** funding is complete and I want to activate the contract
**When** I initiate the transition to ACTIVE stage
**Then** the contract validates that full funding has been achieved
**And** the `setStage(ACTIVE)` function is called with OPERATOR_ROLE validation
**And** the contract emits `StageChanged` event with old and new stages
**And** investor operations transition from funding to monitoring mode
**And** loan withdrawal becomes available for the borrower

### AC3: Closed Stage Transition
**Given** the mortgage is fully repaid or closed
**When** I transition to CLOSED stage
**Then** the contract validates that all investor distributions are complete
**And** the contract prevents further investments or operations
**And** final accounting and audit trails are generated automatically
**And** all stakeholders are notified of the contract completion
**And** contract is marked as historical in portfolio views

### AC4: Real-time Stage Synchronization
**Given** any contract stage change occurs
**When** the transition is confirmed on-chain
**Then** all investor interfaces update immediately to reflect new stage
**And** available operations update based on stage permissions
**And** portfolio dashboards show accurate contract status
**And** notifications are sent to affected stakeholders
**And** historical tracking records complete stage lifecycle

---

## 🏗️ Developer Context Section

### 🔴 CRITICAL: Do Not Violate These Constraints

**SMART CONTRACT DEVELOPMENT:**
- MUST extend existing MortgageContract.sol with stage management system [Source: 1-2-mortgage-contract-core.md]
- MUST use existing OPERATOR_ROLE pattern for stage transition permissions [Source: 1-2-mortgage-contract-core.md]
- MUST integrate with loan operations from Epic 5.2 [Source: 5-2-loan-operations.md]
- MUST emit events following established naming conventions [Source: 1-3-event-system.md]

**FRONTEND INTEGRATION:**
- MUST extend existing useMortgageContract composable with stage management [Source: 2-2-mortgage-contract-composable.md]
- MUST use structured error handling system from Epic 2 [Source: 2-3-structured-error-handling.md]
- MUST maintain real-time state synchronization from Epic 3 [Source: 3-2-funding-progress.md]
- MUST integrate with portfolio dashboard from Epic 4.2 [Source: 4-2-portfolio-dashboard.md]

### 📊 Technical Requirements

**Smart Contract Stage System Implementation:**

```solidity
// Add stage enum and management to MortgageContract.sol
enum Stage {
    FUNDING,
    ACTIVE,
    CLOSED
}

Stage public currentStage;
mapping(Stage => uint256) public stageTimestamps;
mapping(Stage => string) public stageReasons;

function setStage(Stage newStage, string calldata reason)
    external onlyOperator nonReentrant {
    require(newStage != currentStage, "Already in this stage");
    require(validateStageTransition(currentStage, newStage), "Invalid stage transition");

    Stage oldStage = currentStage;
    currentStage = newStage;
    stageTimestamps[newStage] = block.timestamp;
    stageReasons[newStage] = reason;

    emit StageChanged(uint8(oldStage), uint8(newStage), msg.sender, reason);
}

function validateStageTransition(Stage from, Stage to) internal view returns (bool) {
    if (from == Stage.FUNDING && to == Stage.ACTIVE) {
        return totalFunded >= targetAmount;
    }
    if (from == Stage.ACTIVE && to == Stage.CLOSED) {
        return principalRepaid >= targetAmount; // All principal repaid
    }
    return false;
}

modifier onlyInStage(Stage requiredStage) {
    require(currentStage == requiredStage, "Invalid contract stage");
    _;
}

modifier stageTransitionAllowed(Stage newStage) {
    require(validateStageTransition(currentStage, newStage), "Invalid stage transition");
    _;
}
```

**Stage-Based Function Restrictions:**
```solidity
function invest(uint256 amount)
    external
    onlyInStage(Stage.FUNDING)
    nonReentrant {
    // Existing investment logic
}

function withdrawLoan(address borrower, uint256 amount)
    external
    onlyOperator
    onlyInStage(Stage.FUNDING_COMPLETE)
    stageTransitionAllowed(Stage.ACTIVE)
    nonReentrant {
    // Existing loan withdrawal logic
}

function depositPrincipal(uint256 amount)
    external
    onlyOperator
    onlyInStage(Stage.ACTIVE)
    nonReentrant {
    // Existing principal repayment logic
}
```

**Required Event Emission:**
```solidity
event StageChanged(
    uint8 indexed oldStage,
    uint8 indexed newStage,
    address indexed changedBy,
    string reason
);
```

**Frontend Stage Management Interface:**

```typescript
// Extend useMortgageContract.ts with stage management
const transitionStage = async (contractAddress: string, newStage: Stage, reason: string) => {
    // Validate stage transition permissions
    // Check stage transition rules
    // Execute setStage function with OPERATOR_ROLE
    // Handle real-time state updates
    // Trigger interface updates for all users
}

const getStageHistory = async (contractAddress: string) => {
    // Retrieve complete stage change history
    // Include timestamps and reasons
    // Calculate duration in each stage
    // Provide visual timeline data
}

// New reactive state for stage management
const currentStage = ref<Stage>(Stage.FUNDING)
const stageHistory = ref<StageHistory[]>([])
const availableTransitions = ref<Stage[]>([])

// Computed properties for stage-based permissions
const canInvest = computed(() => currentStage.value === Stage.FUNDING)
const canWithdrawLoan = computed(() => currentStage.value === Stage.FUNDING && totalFunded.value >= targetAmount.value)
const canProcessRepayments = computed(() => currentStage.value === Stage.ACTIVE)
const isContractClosed = computed(() => currentStage.value === Stage.CLOSED)
```

### 🎨 Architecture Compliance

**File Structure Requirements:**
```
/contracts/src/MortgageContract.sol (extend existing)
  - Add Stage enum and stage management system
  - Implement setStage() function with validation
  - Add stage-based function modifiers
  - Maintain existing AccessControl and event patterns

/contracts/test/StageManagement.t.sol (new)
  - Test stage transition validation rules
  - Test stage-based function restrictions
  - Test event emission and history tracking
  - Test edge cases and invalid transitions

/frontend/components/operator/ (new)
  - StageManagementPanel.vue - current stage and transition controls
  - StageTimeline.vue - visual stage history display
  - StageTransitionForm.vue - stage change initiation form

/frontend/components/common/ (extend existing)
  - ContractStatus.vue - stage-based contract status display
  - StageBadge.vue - visual stage indicator

/frontend/composables/useMortgageContract.ts (extend existing)
  - Add stage management functions and reactive state
  - Integrate with existing error handling patterns
  - Maintain real-time synchronization with portfolio system

/frontend/utils/stages.ts (new)
  - Stage enumeration and validation utilities
  - Stage transition rules and permissions
  - Stage history formatting functions
```

**Naming Conventions:**
- Functions: camelCase with clear purpose (`setStage`, `validateStageTransition`, `transitionStage`)
- Events: Past tense with indexed parameters (`StageChanged`)
- Variables: descriptive with clear ownership (`currentStage`, `stageHistory`, `stageTimestamps`)
- Components: PascalCase with specific purpose (`StageManagementPanel`, `StageTimeline`)

**Gas Optimization Requirements:**
- Target <0.01 ETH per stage transition [Source: docs/architecture.md#Core Architectural Decisions]
- Use efficient storage for stage history tracking
- Minimize gas costs for stage validation checks
- Batch stage updates where multiple contracts need stage changes

### 📚 Library & Framework Requirements

**Smart Contract Libraries:**
- OpenZeppelin v5+ AccessControl (already integrated) [Source: 1-2-mortgage-contract-core.md]
- Existing MortgageContract foundation with all patterns from Epic 1
- Stage management patterns building on existing contract structure

**Frontend Libraries:**
- Viem for contract interactions (already integrated) [Source: 2-2-mortgage-contract-composable.md]
- Nuxt 3 composables pattern (already established)
- Real-time state management patterns from Epic 3

**State Management:**
- Reactive stage state with automatic updates
- Stage history tracking with timeline visualization
- Permission-based UI updates based on current stage

### 🧪 Testing Requirements

**Smart Contract Tests Must Include:**
1. **Stage Transition Validation**
   - Test all valid stage transitions work correctly
   - Test invalid transitions are rejected with clear errors
   - Test stage transition rules enforced properly
   - Test operator role restrictions for stage changes

2. **Stage-Based Function Restrictions**
   - Test functions only work in allowed stages
   - Test modifiers properly restrict access
   - Test stage changes affect function availability
   - Test edge cases and boundary conditions

3. **Event Emission and History**
   - Test StageChanged events emitted correctly
   - Test stage history tracking accuracy
   - Test timestamp and reason storage
   - Test event parameter accuracy

**Frontend Tests Must Include:**
1. **Stage Management Interface**
   - Test stage status display accuracy
   - Test stage transition form validation
   - Test available transition options based on current stage
   - Test error handling for invalid transitions

2. **Real-time Updates**
   - Test interface updates on stage changes
   - Test portfolio dashboard stage status updates
   - Test notification systems for stage changes
   - Test concurrent user synchronization

### 🔍 Previous Story Intelligence

**Epic 5.2 Learnings (Loan Operations):**
- Integration points between stage transitions and loan operations [Source: 5-2-loan-operations.md]
- Operator role patterns for sensitive operations [Source: 5-2-loan-operations.md]
- Real-time update mechanisms for contract state changes [Source: 5-2-loan-operations.md]

**Epic 4 Learnings (Portfolio Management):**
- Real-time portfolio update patterns [Source: 4-2-portfolio-dashboard.md]
- Transaction tracking for audit trails [Source: 4-4-transaction-tracking.md]
- State synchronization across multiple users [Source: 4-1-pro-rata-distribution.md]

**Epic 3 Learnings (Investment Flow):**
- Real-time event monitoring and state updates [Source: 3-2-funding-progress.md]
- Stage-based UI updates and user experience [Source: 3-1-investment-function.md]
- Gas optimization for transaction operations [Source: 3-3-gas-optimization.md]

**Epic 1 Learnings (Smart Contract Foundation):**
- AccessControl pattern for operator permissions [Source: 1-2-mortgage-contract-core.md]
- Event emission and audit trail requirements [Source: 1-3-event-system.md]
- Comprehensive testing strategies [Source: 1-4-foundry-test-suite.md]

### 📋 Git Intelligence Summary

**Recent Commit Patterns:**
- Stage management follows validate → transition → emit event → update UI pattern
- Real-time updates triggered through stage change events
- Permission-based UI updates based on current contract stage
- Comprehensive error handling for invalid transitions

**File Creation Patterns:**
- New stage management components follow established naming conventions
- Composable extensions maintain existing API consistency
- Test files cover complete stage lifecycle and edge cases
- Integration with existing portfolio and loan operation systems

### 🌐 Latest Technical Information

**Stage Transition Logic:**
- FUNDING → ACTIVE: Only when total funded amount meets target
- ACTIVE → CLOSED: Only when all principal repayments complete
- Stage transitions are irreversible and logged for audit
- Each stage has specific allowed operations and restrictions

**Real-time State Management:**
- Extend existing event listening patterns from Epic 3
- Trigger UI updates automatically on stage changes
- Maintain <1 second latency for stage synchronization
- Handle concurrent stage changes safely

**Permission-based UI:**
- Follow established dashboard patterns from Epic 4.2
- Use role-based access control consistent with other operator functions
- Provide clear visual indicators of current contract stage
- Maintain responsive design for mobile operator access

### 📖 Project Context Reference

**Architecture Alignment:**
- **Smart Contract State Management**: Extend existing AccessControl patterns [Source: docs/architecture.md#Smart Contract Architecture]
- **Frontend State Management**: Use established composable and reactive patterns [Source: docs/architecture.md#Frontend Architecture]
- **Real-time Updates**: Maintain existing synchronization patterns [Source: docs/architecture.md#Real-time Requirements]
- **Access Control**: Preserve role-based permissions from Epic 1 [Source: docs/architecture.md#Access Control Pattern]

**Epic Integration:**
- **Foundation**: Builds on Epic 1 AccessControl and Epic 5.2 loan operations
- **Enables**: Epic 5.4 operational metrics with stage-based data
- **Supports**: Complete mortgage lifecycle management
- **Critical for**: Proper contract state management and user experience

**Business Value:**
- **Lifecycle Management**: Clear, auditable contract lifecycle progression
- **Operational Control**: Operators have precise control over contract states
- **User Experience**: Clear stage progression helps users understand contract status
- **Compliance**: Complete audit trail of all stage changes with reasons

**Stage Management Workflow:**
- **FUNDING Stage**: Investors can contribute funds until target reached
- **ACTIVE Stage**: Loan withdrawn, repayments processed, investors earn returns
- **CLOSED Stage**: All repayments complete, contract finalized, audit trail complete

### 🔗 References

- [Architecture: Smart Contract State Management](docs/architecture.md#Smart Contract Architecture)
- [Epic 1: Access Control Foundation](1-2-mortgage-contract-core.md)
- [Epic 5.2: Loan Operations](5-2-loan-operations.md)
- [Epic 4.2: Portfolio Dashboard](4-2-portfolio-dashboard.md)
- [Epic 3.2: Real-time Updates](3-2-funding-progress.md)

---

## 🎯 Dev Agent Execution Instructions

### Step 1: Implement Stage System
1. **Add Stage enum** to MortgageContract.sol
2. **Implement setStage() function** with OPERATOR_ROLE restriction
3. **Add stage validation logic** for transition rules
4. **Create stage-based modifiers** for function restrictions
5. **Add stage history tracking** with timestamps and reasons

### Step 2: Update Existing Functions
1. **Add stage restrictions** to existing contract functions
2. **Integrate stage transitions** with loan operations from Epic 5.2
3. **Update investment logic** to respect FUNDING stage restrictions
4. **Modify withdrawal logic** to work with ACTIVE stage requirements

### Step 3: Create Frontend Interface
1. **Create stage management components** in /frontend/components/operator/
2. **Extend useMortgageContract composable** with stage management functions
3. **Implement real-time stage updates** triggered by contract events
4. **Add comprehensive form validation** for stage transitions

### Step 4: Integration and Updates
1. **Update portfolio dashboard** to show contract stages accurately
2. **Trigger automatic UI updates** on stage changes
3. **Maintain stage-based permission** controls throughout interface
4. **Provide clear visual indicators** of current contract stage

### Step 5: Comprehensive Testing
1. **Smart contract tests** for stage transitions and restrictions
2. **Frontend tests** for stage management interface
3. **Integration tests** for complete stage lifecycle
4. **Real-time update tests** for synchronization across users

### ✅ Success Criteria
- [ ] Stage enum and management system implemented correctly
- [ ] All stage transitions work with proper validation
- [ ] Stage-based function restrictions enforced properly
- [ ] Real-time stage updates work across all interfaces
- [ ] Stage history tracking complete and accurate
- [ ] Error handling comprehensive for invalid transitions
- [ ] Integration with existing loan and portfolio systems seamless

---

## 🚨 Critical Warning: Do Not Skip These Requirements

1. **MUST integrate with loan operations** from Epic 5.2
2. **MUST maintain OPERATOR_ROLE access control** from Epic 1
3. **MUST trigger real-time updates** across all user interfaces
4. **MUST enforce stage-based function restrictions** properly
5. **MUST emit proper StageChanged events** for audit trail
6. **MUST maintain stage history** with timestamps and reasons
7. **MUST include comprehensive testing** for all stage transitions

---

## Dev Agent Record

### Context Reference
<!-- Implementation context will be tracked here -->

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250901)

### Debug Log References

### Completion Notes List
- Complete stage management story ready for development
- Integrated with existing loan operation and portfolio systems
- All technical constraints and patterns identified

### File List (Expected)
- `/contracts/src/MortgageContract.sol` (extend existing)
- `/contracts/test/StageManagement.t.sol` (new)
- `/frontend/components/operator/StageManagementPanel.vue` (new)
- `/frontend/components/operator/StageTimeline.vue` (new)
- `/frontend/components/common/ContractStatus.vue` (new)
- `/frontend/composables/useMortgageContract.ts` (extend existing)
- `/frontend/utils/stages.ts` (new)
- Test coverage reports and integration verification

**Status:** ready-for-dev
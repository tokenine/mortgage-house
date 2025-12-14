# Tasks: Admin Panel Real Blockchain Integration

**Feature Branch**: `003-admin-blockchain-integration`  
**Input**: Design documents from `/specs/003-admin-blockchain-integration/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and contract interface verification

- [ ] T001 Verify MortgageContract.sol contains distributeInterest, distributePrincipalRepayment, withdrawPrincipal functions in contracts/src/MortgageContract.sol
- [ ] T002 Verify contract addresses and ABIs configured in frontend/data/projects.json for target project
- [ ] T003 Verify USDT token address configured in frontend/data/projects.json for target project
- [ ] T004 [P] Verify existing helper functions getMortgageBondConfig and getPaymentTokenConfig in frontend/lib/projects.ts
- [ ] T005 [P] Verify existing useTransactionWithToast hook in frontend/hooks/useTransactionState.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core TypeScript contracts and shared utilities that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Review TypeScript interface contracts in frontend/specs/003-admin-blockchain-integration/contracts/useAdminPanel.interface.ts
- [ ] T007 [P] Review shared types and enums in frontend/specs/003-admin-blockchain-integration/contracts/types.ts
- [ ] T008 [P] Review operation interfaces in frontend/specs/003-admin-blockchain-integration/contracts/operations.ts
- [ ] T009 [P] Review event handler interfaces in frontend/specs/003-admin-blockchain-integration/contracts/events.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Interest Distribution with Real Blockchain Transaction (Priority: P1) 🎯 MVP

**Goal**: Enable mortgage operators to distribute interest payments through actual smart contract transactions with automatic allowance handling

**Independent Test**: Connect as issuer wallet, enter interest amount, approve USDT if needed, execute distributeInterest transaction, verify InterestDistributed event and investor balances updated on-chain

### Implementation for User Story 1

- [ ] T010 [P] [US1] Create useAdminPanel hook skeleton with TypeScript interface imports in frontend/hooks/useAdminPanel.ts
- [ ] T011 [P] [US1] Implement contract configuration retrieval using getMortgageBondConfig and getPaymentTokenConfig in frontend/hooks/useAdminPanel.ts
- [ ] T012 [US1] Implement batch contract state reads using useReadContracts for issuer, isFundingActive, totalShares in frontend/hooks/useAdminPanel.ts
- [ ] T013 [US1] Implement USDT allowance read using useReadContract for allowance(issuer, mortgageContract) in frontend/hooks/useAdminPanel.ts
- [ ] T014 [US1] Implement access control check by comparing connected wallet with contract issuer address in frontend/hooks/useAdminPanel.ts
- [ ] T015 [US1] Implement approve operation using useWriteContract with useTransactionWithToast wrapper in frontend/hooks/useAdminPanel.ts
- [ ] T016 [US1] Implement distributeInterest operation using useWriteContract with useTransactionWithToast wrapper in frontend/hooks/useAdminPanel.ts
- [ ] T017 [US1] Implement automatic two-step approval flow (approve → distribute) when allowance insufficient in frontend/hooks/useAdminPanel.ts
- [ ] T018 [US1] Implement input validation function for distribution amounts (non-empty, numeric, positive) in frontend/hooks/useAdminPanel.ts
- [ ] T019 [US1] Implement InterestDistributed event listener using useWatchContractEvent with automatic state refetch in frontend/hooks/useAdminPanel.ts
- [ ] T020 [US1] Implement hook return object matching UseAdminPanelReturn interface with all operations and state in frontend/hooks/useAdminPanel.ts
- [ ] T021 [US1] Modify AdminContent component to integrate useAdminPanel hook with selectedBond state in frontend/components/admin-content.tsx
- [ ] T022 [US1] Add access control UI showing access denied message for non-issuer wallets in frontend/components/admin-content.tsx
- [ ] T023 [US1] Modify RepaymentPanel component to accept operations and state props from useAdminPanel in frontend/components/repayment-panel.tsx
- [ ] T024 [US1] Replace mock handleDistributeInterest with real operations.distributeInterest.execute call in frontend/components/repayment-panel.tsx
- [ ] T025 [US1] Add input validation using operations.distributeInterest.validate before transaction submission in frontend/components/repayment-panel.tsx
- [ ] T026 [US1] Add loading states and disabled button logic based on operations.distributeInterest.isProcessing in frontend/components/repayment-panel.tsx
- [ ] T027 [US1] Remove all console.log and alert calls for user feedback in frontend/components/repayment-panel.tsx
- [ ] T028 [US1] Add transaction state indicators showing pending/confirming/success states in frontend/components/repayment-panel.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional - interest distribution works end-to-end with real blockchain transactions

---

## Phase 4: User Story 2 - Principal Repayment Distribution (Priority: P2)

**Goal**: Enable principal repayment distribution through real blockchain transactions following same pattern as interest distribution

**Independent Test**: Enter principal repayment amount, approve tokens if needed, execute distributePrincipalRepayment transaction, verify investors' withdrawable principal increases via contract state

### Implementation for User Story 2

- [ ] T029 [P] [US2] Implement distributePrincipalRepayment operation using useWriteContract with useTransactionWithToast in frontend/hooks/useAdminPanel.ts
- [ ] T030 [P] [US2] Implement automatic approval flow for principal repayment (same pattern as interest) in frontend/hooks/useAdminPanel.ts
- [ ] T031 [P] [US2] Implement PrincipalRepaymentDistributed event listener using useWatchContractEvent in frontend/hooks/useAdminPanel.ts
- [ ] T032 [P] [US2] Add validation function for principal repayment amounts (reuse interest validation logic) in frontend/hooks/useAdminPanel.ts
- [ ] T033 [US2] Add principal repayment UI section in RepaymentPanel component in frontend/components/repayment-panel.tsx
- [ ] T034 [US2] Replace mock handleDistributePrincipal with real operations.distributePrincipalRepayment.execute call in frontend/components/repayment-panel.tsx
- [ ] T035 [US2] Add input validation and transaction state handling for principal repayment in frontend/components/repayment-panel.tsx
- [ ] T036 [US2] Add error handling for contract revert scenarios (insufficient balance, invalid state) in frontend/components/repayment-panel.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - both interest and principal distributions functional

---

## Phase 5: User Story 3 - Loan Principal Withdrawal (Priority: P2)

**Goal**: Enable one-time withdrawal of total funded principal to borrower wallet via real blockchain transaction

**Independent Test**: Verify funding phase is active, execute withdrawPrincipal transaction as issuer, confirm total funded amount transferred and funding phase closed via contract state

### Implementation for User Story 3

- [ ] T037 [P] [US3] Implement withdrawPrincipal operation using useWriteContract with useTransactionWithToast in frontend/hooks/useAdminPanel.ts
- [ ] T038 [P] [US3] Implement canExecute logic checking isFundingActive for withdraw operation in frontend/hooks/useAdminPanel.ts
- [ ] T039 [P] [US3] Implement PrincipalWithdrawn event listener using useWatchContractEvent in frontend/hooks/useAdminPanel.ts
- [ ] T040 [US3] Modify LifecyclePanel component to accept operations and state props from useAdminPanel in frontend/components/lifecycle-panel.tsx
- [ ] T041 [US3] Replace mock handleWithdrawPrincipal with real operations.withdrawPrincipal.execute call in frontend/components/lifecycle-panel.tsx
- [ ] T042 [US3] Add disabled button state when isFundingActive is false with explanatory tooltip in frontend/components/lifecycle-panel.tsx
- [ ] T043 [US3] Add loading state and transaction hash link to block explorer during withdrawal in frontend/components/lifecycle-panel.tsx
- [ ] T044 [US3] Add confirmation dialog before executing withdrawal (prevents accidental clicks) in frontend/components/lifecycle-panel.tsx

**Checkpoint**: All user stories 1, 2, and 3 should now be independently functional - full admin operation suite available

---

## Phase 6: User Story 4 - Real-time Contract State Synchronization (Priority: P3)

**Goal**: Enable automatic UI updates when on-chain events are detected without manual page refresh

**Independent Test**: Monitor contract events (ShareListed, InvestmentMade, InterestDistributed) and verify UI automatically updates when events detected within 3 seconds

### Implementation for User Story 4

- [ ] T045 [P] [US4] Implement useWatchContractEvent for ShareListed event with state refetch in frontend/hooks/useAdminPanel.ts
- [ ] T046 [P] [US4] Implement useWatchContractEvent for InvestmentMade event with state refetch in frontend/hooks/useAdminPanel.ts
- [ ] T047 [P] [US4] Add event logging to browser console for debugging event detection in frontend/hooks/useAdminPanel.ts
- [ ] T048 [P] [US4] Implement debounced refetch to prevent excessive RPC calls on rapid events in frontend/hooks/useAdminPanel.ts
- [ ] T049 [US4] Add refetch control method to hook return for manual force-refresh in frontend/hooks/useAdminPanel.ts
- [ ] T050 [US4] Add real-time update indicator in UI showing last update timestamp in frontend/components/admin-content.tsx
- [ ] T051 [US4] Add offline indicator when event listeners cannot connect to RPC in frontend/components/admin-content.tsx
- [ ] T052 [US4] Verify event listener cleanup on component unmount (check for memory leaks) in frontend/hooks/useAdminPanel.ts

**Checkpoint**: All user stories should now be independently functional with real-time synchronization

---

## Phase 7: Integration Testing & Polish

**Purpose**: Comprehensive testing and cross-cutting improvements

- [ ] T053 [P] Create integration test file with test setup utilities in frontend/__tests__/integration/admin-panel.test.ts
- [ ] T054 [P] Write test case: Interest distribution without approval when allowance sufficient in frontend/__tests__/integration/admin-panel.test.ts
- [ ] T055 [P] Write test case: Two-step approval flow when allowance insufficient in frontend/__tests__/integration/admin-panel.test.ts
- [ ] T056 [P] Write test case: Error handling when user rejects transaction in MetaMask in frontend/__tests__/integration/admin-panel.test.ts
- [ ] T057 [P] Write test case: Access denied for non-issuer wallet in frontend/__tests__/integration/admin-panel.test.ts
- [ ] T058 [P] Write test case: Real-time UI update when event detected in frontend/__tests__/integration/admin-panel.test.ts
- [ ] T059 [P] Write test case: Principal withdrawal disabling when funding closed in frontend/__tests__/integration/admin-panel.test.ts
- [ ] T060 Run integration tests and verify all test cases pass
- [ ] T061 Manual testing: Execute interest distribution on testnet with real MetaMask wallet
- [ ] T062 Manual testing: Execute principal repayment distribution on testnet
- [ ] T063 Manual testing: Execute principal withdrawal on testnet
- [ ] T064 Manual testing: Test access control with non-issuer wallet
- [ ] T065 Manual testing: Verify real-time updates by triggering events from another session
- [ ] T066 Code review: Verify zero console.log or alert calls for user feedback in all components
- [ ] T067 Code review: Verify all data comes from contract reads (no hardcoded values)
- [ ] T068 Code review: Verify all operations use real Wagmi hooks (no mock implementations)
- [ ] T069 Performance check: Verify transaction completion within 30 seconds (excluding user confirmation time)
- [ ] T070 Performance check: Verify UI updates within 3 seconds of event detection
- [ ] T071 Memory check: Verify no memory leaks after 10+ navigation cycles using browser dev tools
- [ ] T072 Run quickstart.md verification checklist for constitution compliance

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) - This is the MVP
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) - Can proceed in parallel with US1 if staffed, or after US1 completion
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2) - Can proceed in parallel with US1/US2 if staffed, or after US2 completion
- **User Story 4 (Phase 6)**: Depends on Foundational (Phase 2) - Can proceed in parallel with other stories if staffed
- **Integration Testing (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Reuses patterns from US1 but independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Independent from US1/US2, different component
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Enhances all stories but not blocking

### Within Each User Story

**User Story 1**:
- T010-T011: Hook setup (can run in parallel)
- T012-T014: Contract reads (sequential - each builds on config)
- T015-T017: Write operations (sequential - approval before distribute)
- T018-T020: Validation and events (can run in parallel with writes)
- T021-T023: Component integration (sequential - admin-content before repayment-panel)
- T024-T028: UI updates (sequential - replace handlers then add states)

**User Story 2**:
- T029-T032: Hook operations (all can run in parallel - similar to US1 pattern)
- T033-T036: UI updates (sequential - add section then connect handlers)

**User Story 3**:
- T037-T039: Hook operations (all can run in parallel)
- T040-T044: UI updates (sequential - integrate then add states)

**User Story 4**:
- T045-T048: Event listeners (all can run in parallel)
- T049-T052: UI indicators (sequential - add controls then indicators)

### Parallel Opportunities

#### Phase 1 (Setup)
- T004 and T005 can run in parallel (different files)

#### Phase 2 (Foundational)
- T007, T008, T009 can run in parallel (review different contract files)

#### Phase 3 (User Story 1)
- T010 and T011 can run in parallel (different parts of hook)
- T018, T019, T020 can run in parallel after T017 completes

#### Phase 4 (User Story 2)
- T029, T030, T031, T032 can all run in parallel (similar patterns, different operations)

#### Phase 5 (User Story 3)
- T037, T038, T039 can all run in parallel

#### Phase 6 (User Story 4)
- T045, T046, T047, T048 can all run in parallel

#### Phase 7 (Testing)
- T053-T059 can all run in parallel (writing different test cases)
- T061-T065 manual tests can run sequentially but same session
- T066-T068 code reviews can run in parallel

#### Across User Stories (After Foundational Phase)
- If team has multiple developers:
  - Developer 1: User Story 1 (T010-T028)
  - Developer 2: User Story 2 (T029-T036)
  - Developer 3: User Story 3 (T037-T044)
  - Developer 4: User Story 4 (T045-T052)

---

## Parallel Execution Examples

### Example 1: Foundational Phase (Phase 2)
```bash
# Three developers can review contracts in parallel
Developer A: Review useAdminPanel.interface.ts (T006)
Developer B: Review types.ts and operations.ts (T007, T008)
Developer C: Review events.ts and index.ts (T009)
# All complete in ~10 minutes instead of 30 minutes sequential
```

### Example 2: User Story 1 Hook Operations (Phase 3)
```bash
# After T017 completes, three parallel tasks:
Developer A: Implement validation function (T018)
Developer B: Implement event listener (T019)
Developer C: Finalize hook return object (T020)
# All complete in ~15 minutes instead of 45 minutes sequential
```

### Example 3: Entire User Story Phase (After Foundational)
```bash
# Four developers working in parallel on different stories:
Developer A: Implement User Story 1 - Interest Distribution (T010-T028)
Developer B: Implement User Story 2 - Principal Repayment (T029-T036)
Developer C: Implement User Story 3 - Principal Withdrawal (T037-T044)
Developer D: Implement User Story 4 - Real-time Sync (T045-T052)
# All stories complete in ~4 hours instead of 10+ hours sequential
```

### Example 4: Integration Testing (Phase 7)
```bash
# Test writing can be parallelized:
Developer A: Write interest distribution tests (T054, T055)
Developer B: Write error handling tests (T056, T057)
Developer C: Write real-time and withdrawal tests (T058, T059)
# All test cases written in ~20 minutes instead of 60 minutes sequential
```

---

## Task Summary

**Total Tasks**: 72 tasks across 7 phases

**Task Distribution by User Story**:
- Setup (Phase 1): 5 tasks
- Foundational (Phase 2): 4 tasks
- User Story 1 (P1 - MVP): 19 tasks
- User Story 2 (P2): 8 tasks
- User Story 3 (P2): 8 tasks
- User Story 4 (P3): 8 tasks
- Integration Testing & Polish (Phase 7): 20 tasks

**Parallel Tasks Identified**: 28 tasks marked with [P] can run in parallel

**Estimated Timeline**:
- Sequential execution: ~12-14 hours
- With parallelization (4 developers): ~6-8 hours
- MVP only (User Story 1): ~4-6 hours

**MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1) = 28 tasks, deliverable as standalone increment

**Independent Test Criteria Met**: Each user story phase includes clear test scenarios and acceptance criteria from spec.md

**Format Validation**: ✅ All tasks follow checklist format (checkbox, ID, labels, file paths)

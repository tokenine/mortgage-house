# Tasks: Unified Marketplace Order Modal

**Input**: Design documents from `/specs/001-marketplace-order-modal/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/  
**Branch**: `001-marketplace-order-modal`

**Organization**: Tasks are grouped by user story to enable independent implementation and testing. Each story is independently testable and can be worked in parallel.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and test infrastructure

- [x] T001 Create `frontend/components/order-creation-modal.tsx` file with component skeleton
- [x] T002 Create `frontend/types/marketplace.ts` with OrderMode type definition
- [x] T003 [P] Create test directory `frontend/components/__tests__/order-creation-modal.test.tsx`
- [x] T004 [P] Create integration test file `frontend/__tests__/integration/marketplace-orders.test.tsx`

**Checkpoint**: File structure ready for implementation

---

## Phase 2: Foundational (Shared Modal Infrastructure)

**Purpose**: Core modal component that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 [P] Write failing test: Modal opens when open prop is true (T003)
- [x] T006 [P] Write failing test: Modal closes on escape key (T003)
- [x] T007 [P] Write failing test: Dialog and Tabs components render correctly (T003)
- [x] T008 Implement Dialog wrapper from @radix-ui/react-dialog with proper structure
- [x] T009 Implement Tabs component with "Sell Order" and "Buy Order" trigger buttons
- [x] T010 Implement DialogHeader with title and description (dynamic based on mode)
- [x] T011 Implement DialogFooter wrapper for buttons
- [x] T012 Add controlled mode state using useState<OrderMode>
- [x] T013 Test Phase 2: Verify modal structure, open/close, and tab switching work

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create Sell Order from Marketplace (Priority: P1)

**Goal**: Enable investors to list bond shares for sale on the secondary marketplace

**Independent Test**: Modal can create sell orders that appear in the marketplace active orders list

### Tests for User Story 1 (Test-First)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T014 [P] [US1] Write failing test: Sell form has shares and price input fields (T003)
- [x] T015 [P] [US1] Write failing test: Share balance displays correctly in sell mode (T003)
- [x] T016 [P] [US1] Write failing test: Validation rejects shares > available balance (T003)
- [x] T017 [P] [US1] Write failing test: Validation rejects fractional shares (T003)
- [x] T018 [P] [US1] Write failing test: Submit button disabled with validation errors (T003)
- [x] T019 [P] [US1] Write failing integration test: Sell order created successfully (T004)

### Implementation for User Story 1

- [x] T020 [P] [US1] Implement share balance display hook integration in component (uses useMortgageBond)
- [x] T021 [P] [US1] Implement useFormValidation hook for sell mode form state
- [x] T022 [P] [US1] Create getValidationRules helper function with sell-specific rules
- [x] T023 [US1] Render form fields for shares and price in sell TabsContent (depends on T020, T021, T022)
- [x] T024 [US1] Add Labels for accessibility (shares and price fields)
- [x] T025 [US1] Implement validation error display using Alert component
- [x] T026 [US1] Add form reset useEffect to clear fields in sell mode
- [x] T027 [US1] Write and verify tests pass: Form validation (T014-T018)
- [x] T028 [P] [US1] Implement useReadContract for USDT balance (needed for allowance check)
- [x] T029 [P] [US1] Implement useReadContract for current token allowance
- [x] T030 [US1] Implement writeApprove using useWriteContract for token approval
- [x] T031 [US1] Implement writeOrder using useWriteContract for createSellOrder
- [x] T032 [US1] Implement useTransactionWithToast for approval state tracking
- [x] T033 [US1] Implement useTransactionWithToast for order creation state tracking
- [x] T034 [US1] Implement handleCreateOrder function with approval flow logic (depends on T030-T033)
- [x] T035 [US1] Add useEffect to refetch allowance after approval success (depends on T032)
- [x] T036 [US1] Add useEffect to close modal and call onSuccess after order creation (depends on T033)
- [x] T037 [US1] Connect submit button to handleCreateOrder function
- [x] T038 [US1] Implement loading state: Disable button during transactions, show spinner
- [x] T039 [US1] Implement error handling: Display transaction errors clearly to user
- [x] T040 [US1] Write and verify integration test passes: Full sell order creation flow (T019)
- [ ] T041 [US1] Manual testing: Create sell order with MetaMask, verify appears in marketplace list

**Checkpoint**: User Story 1 (Sell Order) is fully functional and testable independently

---

## Phase 4: User Story 2 - Unified Order Creation Interface (Priority: P1)

**Goal**: Provide clear visual separation and mode switching for both sell and buy order creation

**Independent Test**: Users can switch between sell and buy modes, see correct balance for each mode

### Tests for User Story 2 (Test-First)

- [x] T042 [P] [US2] Write failing test: Switching to buy mode updates description text (T003)
- [x] T043 [P] [US2] Write failing test: Balance display changes based on mode (shares vs USDT) (T003)
- [x] T044 [P] [US2] Write failing test: Form fields reset when switching modes (T003)
- [x] T045 [P] [US2] Write failing test: Submit button text changes per mode (T003)

### Implementation for User Story 2

- [x] T046 [P] [US2] Update DialogDescription to show mode-specific text (sell vs buy)
- [x] T047 [P] [US2] Implement BalanceDisplay component to show highlighted balance per mode
- [x] T048 [US2] Add useEffect to reset form when mode changes (depends on T046, T047)
- [x] T049 [US2] Update submit button text: "Create Sell Order" vs "Create Buy Order" (depends on T048)
- [x] T050 [US2] Update submit button text: "Approve Tokens" when approval needed (depends on T048)
- [x] T051 [US2] Add visual styling to highlight active mode tab
- [x] T052 [US2] Write and verify tests pass: Mode switching behavior (T042-T045)
- [x] T053 [US2] Manual testing: Switch modes, verify description and balance updates

**Checkpoint**: User Story 2 (Unified Interface) completes P1 MVP. Both US1 and US2 working independently.

---

## Phase 5: User Story 3 - Create Buy Order from Marketplace (Priority: P2)

**Goal**: Enable investors to create buy orders at desired price points for price discovery

**Independent Test**: Modal can create buy orders with USDT balance validation

### Tests for User Story 3 (Test-First)

- [x] T054 [P] [US3] Write failing test: Buy form has shares and price input fields (T003)
- [x] T055 [P] [US3] Write failing test: USDT balance displays correctly in buy mode (T003)
- [x] T056 [P] [US3] Write failing test: Validation rejects price > available USDT (T003)
- [x] T057 [P] [US3] Write failing test: Validation allows any positive shares (no max) (T003)
- [x] T058 [P] [US3] Write failing integration test: Buy order created successfully (T004)

### Implementation for User Story 3

- [x] T059 [P] [US3] Create buy mode form in TabsContent[value="buy"]
- [x] T060 [P] [US3] Implement USDT balance display for buy mode (reuse existing balance query from T028)
- [x] T061 [US3] Add shares and price input fields for buy mode (depends on T059, T060)
- [x] T062 [US3] Add Labels for buy mode fields (accessibility)
- [x] T063 [US3] Extend getValidationRules with buy-specific validation (price ≤ USDT balance)
- [x] T064 [US3] Add buy mode validation error display using Alert component
- [x] T065 [US3] Add form reset useEffect for buy mode
- [x] T066 [US3] Write and verify tests pass: Buy form validation (T054-T057)
- [ ] T067 [US3] Implement writeOrder for createBuyOrder function call (conditional on mode)
- [ ] T068 [US3] Handle approval flow for buy orders (same approval pattern as sell)
- [ ] T069 [US3] Update handleCreateOrder to call createBuyOrder when mode === 'buy' (depends on T067, T068)
- [ ] T070 [US3] Write and verify integration test passes: Buy order creation (T058)
- [ ] T071 [US3] Manual testing: Create buy order with MetaMask, verify order approval and creation (when contract ready)

**Checkpoint**: User Story 3 (Buy Orders) complete. All three user stories working independently.

---

## Phase 6: User Story 4 - Order Validation and Error Handling (Priority: P1)

**Goal**: Prevent failed transactions and provide clear, actionable error messages

**Independent Test**: All validation rules from spec work correctly, errors display clearly

### Tests for User Story 4 (Test-First)

- [x] T072 [P] [US4] Write failing test: Zero shares shows error (T003)
- [x] T073 [P] [US4] Write failing test: Negative price shows error (T003)
- [x] T074 [P] [US4] Write failing test: Empty required fields disable submit button (T003)
- [x] T075 [P] [US4] Write failing test: Real-time validation error feedback (T003)
- [x] T076 [P] [US4] Write failing test: Network error handling displays friendly message (T004)
- [x] T077 [P] [US4] Write failing test: Wallet disconnection handled gracefully (T004)

### Implementation for User Story 4

- [x] T078 [P] [US4] Extend validation: Reject zero and negative numbers for shares
- [x] T079 [P] [US4] Extend validation: Reject zero and negative numbers for price
- [x] T080 [US4] Add real-time validation feedback as user types (on change events)
- [x] T081 [US4] Implement submit button disabled state when form invalid (depends on T078-T080)
- [x] T082 [US4] Add error boundary for component-level errors
- [x] T083 [US4] Implement network error handling: Show friendly message if wallet disconnects
- [x] T084 [US4] Implement transaction rejection handling: "Approval cancelled" message
- [x] T085 [US4] Implement contract state error handling: "Try again later" message for paused contracts
- [x] T086 [US4] Add error toast notifications with specific error details
- [x] T087 [US4] Preserve form data on non-validation errors for retry (depends on T086)
- [x] T088 [US4] Write and verify tests pass: All validation and error scenarios (T072-T077)

**Checkpoint**: All user stories (1-4) complete with robust error handling. Feature ready for integration testing.

---

## Phase 7: Integration with Marketplace Page (Cross-Story)

**Purpose**: Connect OrderCreationModal to marketplace-content.tsx and verify order list updates

- [x] T089 [P] Update `frontend/components/marketplace-content.tsx` to import OrderCreationModal
- [x] T090 [P] Add state for modal open/close in marketplace-content.tsx
- [x] T091 Add "Create Order" button in Secondary Market section (replaces old SellModal trigger)
- [x] T092 Connect button to modal state management (depends on T089, T090)
- [x] T093 Pass `onSuccess={refetchOrders}` callback to OrderCreationModal
- [ ] T094 Verify event listeners auto-refresh order list (useMarketplace hook handles this)
- [ ] T095 Manual testing: Create order from marketplace page, verify it appears in list
- [ ] T096 Manual testing: Multiple users' orders show in list correctly

**Checkpoint**: Modal fully integrated into marketplace page

---

## Phase 8: Mobile Responsiveness (Priority: P2)

**Purpose**: Ensure modal works on mobile devices (320px+)

- [x] T097 [P] Test modal on 320px viewport (iPhone SE)
- [x] T098 [P] Test modal on 375px viewport (iPhone 12)
- [x] T099 [P] Test modal on 768px viewport (iPad)
- [x] T100 Adjust DialogContent width for mobile: `sm:max-w-[425px] md:max-w-[600px]`
- [x] T101 Verify touch targets are 44px minimum (buttons, tabs, inputs)
- [x] T102 Test tab switching with touch (no hover states)
- [x] T103 Test form input with mobile keyboard (auto-focus, scrolling)
- [x] T104 Verify balance display fits on small screens
- [ ] T105 Manual testing: Full workflow on actual mobile device

**Checkpoint**: Modal fully responsive on mobile and tablet

---

## Phase 9: Accessibility (Priority: P2)

**Purpose**: Ensure WCAG 2.1 AA compliance and keyboard-only usability

### Tests for Accessibility

- [x] T106 [P] Write failing test: Keyboard navigation (Tab, Shift+Tab) works (T003)
- [x] T107 [P] Write failing test: Escape key closes modal (T003)
- [x] T108 [P] Write failing test: Arrow keys switch tabs (T003)
- [x] T109 [P] Write failing test: Form labels properly associated with inputs (T003)
- [x] T110 [P] Write failing test: Error messages announced via aria-live (T003)

### Implementation for Accessibility

- [x] T111 [P] Add proper form labels (htmlFor attribute) to all inputs
- [x] T112 [P] Add aria-live="polite" to Alert component for error announcements
- [x] T113 [P] Add aria-label to icon-only buttons
- [x] T114 [US1] Test keyboard navigation: Tab through all fields in sell mode
- [x] T115 [US2] Test keyboard navigation: Tab through all fields in buy mode
- [x] T116 [US3] Test tab switching with Arrow Left/Right keys
- [ ] T117 Verify focus management: First input auto-focused on modal open
- [ ] T118 Verify focus trap: Cannot tab outside modal
- [ ] T119 Verify focus returns to trigger button on modal close
- [x] T120 Check color contrast (WCAG AA): Minimum 4.5:1 for text
- [ ] T121 Test with screen reader (NVDA or VoiceOver): Read dialog, tabs, errors
- [x] T122 Write and verify accessibility tests pass (T106-T110)

**Checkpoint**: Modal meets WCAG 2.1 AA compliance

---

## Phase 10: Performance Optimization (Priority: P2)

**Purpose**: Ensure fast, responsive UI interactions

- [x] T123 [P] Implement useMemo for validation rules to prevent recalculation
- [x] T124 [P] Verify balance queries use React Query caching (wagmi default)
- [x] T125 [P] Verify allowance refetch only happens after approval success
- [x] T126 Measure modal render time: Should be <200ms
- [x] T127 Measure mode switch time: Should be <200ms
- [x] T128 Measure validation feedback: Should be <500ms
- [x] T129 Verify no unnecessary re-renders using React DevTools Profiler
- [ ] T130 Add performance benchmarks to documentation
- [ ] T131 Manual testing: Modal performance on slow 3G network

**Checkpoint**: Performance meets all success criteria

---

## Phase 11: Documentation & Examples (Priority: P2)

**Purpose**: Ensure developers can use and maintain component

- [x] T132 Add JSDoc comments to component props and methods
- [x] T133 Add inline comments explaining complex validation logic
- [ ] T134 Document component usage with example in quickstart.md
- [x] T135 Document error handling patterns for developers
- [ ] T136 Add troubleshooting guide for common issues
- [x] T137 Update type definitions with descriptions

**Checkpoint**: Documentation complete

---

## Phase 12: Code Quality & Testing (Priority: P1)

**Purpose**: Achieve >80% code coverage and pass all linting

### Final Testing

- [x] T138 [P] Run all unit tests: All should pass
- [x] T139 [P] Run integration tests: All should pass
- [x] T140 [P] Generate code coverage report: Should be >80%
- [x] T141 Run ESLint: All issues resolved
- [x] T142 Run Prettier: Code formatted consistently
- [x] T143 Run TypeScript strict mode: No type errors
- [x] T144 Run component tests with RTL: All scenarios covered (T014-T077)

### Acceptance Testing

- [x] T145 Test acceptance scenario 1: Create sell order, verify in list
- [ ] T146 Test acceptance scenario 2: Create sell order with insufficient shares
- [ ] T147 Test acceptance scenario 3: Switch modes, form resets
- [ ] T148 Test acceptance scenario 4: Approve tokens, then create order
- [ ] T149 Test acceptance scenario 5: Network error during transaction
- [ ] T150 Test all 20+ acceptance scenarios from spec.md

**Checkpoint**: All tests passing, code quality verified

---

## Phase 13: Final Validation & Cleanup

**Purpose**: Ensure feature meets all specification requirements

- [x] T151 [P] Verify all 23 functional requirements (FR-001 to FR-023) implemented
- [x] T152 [P] Verify all 10 success criteria met (SC-001 to SC-010)
- [x] T153 [P] Verify all 4 user stories testable independently
- [ ] T154 [P] Run quickstart.md checklist: All items complete
- [x] T155 Code cleanup: Remove debug logs, unused code
- [x] T156 Documentation review: Ensure all docs up to date
- [ ] T157 Create PR description with summary of changes
- [ ] T158 Final manual testing: Complete workflow on fresh setup
- [ ] T159 Review for constitution compliance (all 6 principles)

**Checkpoint**: Ready for code review and merge

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) 
    ↓
Phase 2 (Foundation - BLOCKS all user stories)
    ↓
Phase 3 (US1 - Sell Orders) ────┐
                                 ├─→ Phase 7 (Integration)
Phase 4 (US2 - Unified UI) ──────┤
                                 ├─→ Phase 12 (QA Testing)
Phase 5 (US3 - Buy Orders) ──────┤
                                 ├─→ Phase 13 (Final Validation)
Phase 6 (US4 - Validation) ──────┘

Phase 8 (Mobile) - Can run parallel with US implementation
Phase 9 (Accessibility) - Can run parallel with US implementation
Phase 10 (Performance) - Can run parallel with US implementation
Phase 11 (Documentation) - Can run parallel with US implementation
```

### Parallel Opportunities

**Phase 1 (Setup)**:
- T001-T004: All can run in parallel (different files)

**Phase 2 (Foundation)**:
- T005-T007: All test tasks can run in parallel
- After T008-T011 complete: T012-T013 can run

**Phase 3-6 (User Stories)**:
- Different user stories can be worked on in parallel by different team members
- Within each story: Tests (marked [P]) can run in parallel, then implementation sequentially
- Stories 3-6 can start after Phase 2 completes (no dependencies)

**Phase 8-11 (Parallel Work)**:
- Can run in parallel with Phase 3-6 user story implementation
- Teams can work on mobile, accessibility, performance while others do core implementation

### Recommended Execution Path (Single Developer)

1. Phase 1: Setup (0.5 hours)
2. Phase 2: Foundation (2 hours)
3. Phase 3: US1 - Sell Orders (4 hours) - **DELIVERS SELLABLE MVP**
4. Phase 4: US2 - Unified UI (1 hour)
5. Phase 5: US3 - Buy Orders (2 hours)
6. Phase 6: US4 - Validation (2 hours)
7. Phase 7: Integration (1 hour)
8. Phase 8-11: Polish (3 hours)
9. Phase 12-13: Final QA (2 hours)

**Total Estimated Effort**: 18 hours for complete feature

### Recommended Execution Path (Parallel Team)

**Day 1 (Setup + Foundation)**:
- Developer A: Phase 1-2 (Full stack: setup + foundation)

**Day 2 (User Stories - Parallel)**:
- Developer A: Phase 3 (US1 - Sell Orders)
- Developer B: Phase 5 (US3 - Buy Orders, after Phase 2 done)
- Developer C: Phase 8-9 (Mobile + Accessibility)

**Day 3 (Completion)**:
- Developer A: Phase 4-6 (US2, US4, remaining gaps)
- Developer B: Phase 7 (Integration)
- Developer C: Phase 10-11 (Performance, documentation)
- All: Phase 12-13 (Final QA and validation)

**Parallel Total Effort**: ~5-6 hours per developer, 2-3 day timeline

---

## Test-First Development Reminder

⚠️ **CRITICAL**: For all user story tests marked in phases 3-6:

1. **Write test FIRST** - Test should FAIL before implementation
2. **Implement minimum code** - Just enough to make test pass
3. **Refactor** - Improve code quality while keeping tests passing
4. **Verify** - Run tests again to confirm they pass

This ensures:
- Tests are actually testing something (they would have failed)
- Code matches requirements (tests define requirements)
- Refactoring doesn't break functionality (tests catch regressions)

---

## Success Criteria

✅ All phases complete  
✅ All tests passing (>80% coverage)  
✅ All 23 functional requirements implemented  
✅ All 10 success criteria met  
✅ All 4 user stories independently testable  
✅ Code review approved  
✅ Documentation complete  
✅ Manual testing verified on desktop, mobile, accessibility  

**When all checkboxes are complete, feature is ready for merge to main branch.**

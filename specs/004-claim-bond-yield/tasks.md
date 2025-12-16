---
description: "Task list for Claim Bond Yield Button feature"
---

# Tasks: Claim Bond Yield Button

**Input**: Design documents from `/specs/004-claim-bond-yield/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: NOT requested in feature specification; E2E tests are optional but recommended post-implementation to validate claim flow.

**Organization**: Tasks are grouped by user story (US1, US2, US3) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

**Web app**: `frontend/components/`, `frontend/hooks/`, `frontend/lib/`, `tests/integration/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify foundation is in place for Claim feature

- [ ] T001 Verify `useTransactionWithToast` hook is available in `frontend/hooks/useTransactionState.ts`
- [ ] T002 Verify `getMortgageBondConfig(projectId)` exports from `frontend/lib/projects.ts` with contract address and ABI

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 [P] Add claim state type to `frontend/types/` (or ensure TypeScript types for `ClaimStatus: 'pending' | 'confirming' | 'success' | 'error'`)
- [ ] T004 [P] Ensure `usePortfolio` hook in `frontend/hooks/usePortfolio.ts` supports `refetch()` method for targeted refresh post-claim

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Claim yield from a specific bond (Priority: P1) 🎯 MVP

**Goal**: Add a working Claim button on each bond card that submits a transaction to claim that bond's yield.

**Independent Test**: Fund yield on-chain for a single project; click Claim on its card; verify tx submitted, pending state visible, then success/error shown.

### Implementation for User Story 1

- [ ] T005 [P] [US1] Create `ClaimButton` sub-component in `frontend/components/claim-button.tsx` with enable/disable state and tooltip logic
- [ ] T006 [P] [US1] Implement Claim button UI in `frontend/components/bond-card.tsx` alongside Sell button, passing `projectId`, `yield`, and `address` props
- [ ] T007 [US1] Wire `ClaimButton` to `useWriteContract` hook with per-project contract address from `getMortgageBondConfig(projectId)` in `frontend/components/claim-button.tsx`
- [ ] T008 [US1] Integrate `useWaitForTransactionReceipt` to confirm transaction and trigger success toast in `frontend/components/claim-button.tsx`
- [ ] T009 [US1] Add button enable/disable logic: disabled when `yield <= 0`, wallet disconnected, or wrong network in `frontend/components/claim-button.tsx`
- [ ] T010 [US1] Add loading spinner during pending/confirming states in `frontend/components/claim-button.tsx`

**Checkpoint**: User Story 1 fully functional and testable independently

---

## Phase 4: User Story 2 - Error handling and resilience (Priority: P2)

**Goal**: Handle claim failures gracefully with clear messaging and safe retry.

**Independent Test**: Trigger a revert or user rejection; verify error toast shown, button re-enabled, and no stale state persists.

### Implementation for User Story 2

- [ ] T011 [P] [US2] Add error state and messaging in `ClaimButton` component; display toast on revert/rejection in `frontend/components/claim-button.tsx`
- [ ] T012 [US2] Add network mismatch detection and prompt user to switch chain in `frontend/components/claim-button.tsx` (e.g., using `useChainId` or similar)
- [ ] T013 [US2] Ensure button is re-enabled after error so user can retry in `frontend/components/claim-button.tsx`
- [ ] T014 [US2] Log errors for transparency (no console.log; use structured logging if available) in `frontend/components/claim-button.tsx`

**Checkpoint**: User Stories 1 AND 2 both work independently; errors handled

---

## Phase 5: User Story 3 - Portfolio refresh after claim (Priority: P3)

**Goal**: Auto-refresh portfolio data post-claim so bond yield and totals update without manual reload.

**Independent Test**: After successful claim, verify bond's yield becomes 0 and dashboard totals reflect new state within 5s.

### Implementation for User Story 3

- [ ] T015 [P] [US3] Call `refetch()` from `usePortfolio` hook after successful claim confirmation in `frontend/components/claim-button.tsx`
- [ ] T016 [US3] Ensure `usePortfolio` refetch updates only the affected bond's yield without full page reload (check implementation in `frontend/hooks/usePortfolio.ts`)
- [ ] T017 [US3] Verify dashboard totals (`totalInvested`, `totalYield`, avg APY) recalculate automatically post-refetch in `frontend/components/dashboard-content.tsx`

**Checkpoint**: All user stories (1, 2, 3) fully functional and independently testable

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements, tests, and hardening

- [ ] T018 [P] Add E2E test for full claim flow in `tests/integration/claim-bond-yield.spec.ts` (write failing test first per TDD, then verify implementation)
- [ ] T019 [P] Add unit test for `ClaimButton` state transitions (pending → confirming → success/error) if component is extracted
- [ ] T020 Verify gas costs and transaction timing align with success criteria (SC-001: <2 min end-to-end, SC-003: <5s refresh)
- [ ] T021 Code review: ensure no console logs or alerts; all feedback via real tx feedback + toast notifications (Principle VII compliance)
- [ ] T022 Update `frontend/README.md` or dev docs with Claim feature walkthrough (optional but recommended)
- [ ] T023 [P] Test on testnet with multiple projects to validate per-project routing works correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - verify immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phases 3-5)**: All depend on Foundational completion
  - Can proceed in parallel or sequentially (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational - No dependencies on other stories
- **US2 (P2)**: Can start after US1 (error handling builds on core claim) or in parallel
- **US3 (P3)**: Can start after US1 (refresh needs working claim) or in parallel if `usePortfolio` refetch is already available

### Within Each User Story

- User Story 1: Create component → wire to contract → confirm tx → add UI states
- User Story 2: Error handling built into ClaimButton (same component as US1)
- User Story 3: Refetch integration (same component, call refetch post-confirm)

### Parallel Opportunities

All Setup tasks marked [P] can run in parallel.
All Foundational tasks marked [P] can run in parallel (within Phase 2).
Once Foundational completes, all three user stories can start in parallel.
Within Phase 6, all tasks marked [P] (tests, gas validation, docs) can run in parallel.

---

## Parallel Example: User Story 1

```bash
# Assuming foundational is complete:
# Developer A: work on T005 (ClaimButton component skeleton)
# Developer B: work on T006 (integration in bond-card)
# (In practice, single developer likely; shown for illustration)

# T007-T010 depend on T005 completion
```

## MVP Scope

**Minimum Viable Product**: User Stories 1 + 2
- User can claim yield from a bond card end-to-end with clear feedback.
- Errors are handled and user can retry.
- **Not included in MVP**: Auto-refresh (US3) can be deferred or added post-launch.

## Implementation Strategy

1. **TDD first**: Write failing E2E test for claim flow (T018) before implementation begins
2. **Incremental delivery**: Complete US1 → Test → Deploy; then US2 → Test → Deploy; then US3 → Test → Deploy
3. **Constitution compliance**: Every task must adhere to Principle VII (real blockchain integration, no mocks)
4. **Review gates**: Before merging, verify no console logs, all tx/UI feedback is real, and tests pass

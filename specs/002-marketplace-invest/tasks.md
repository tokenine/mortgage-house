# Tasks: Marketplace Investment Flow

**Input**: Design documents from `/specs/002-marketplace-invest/`
**Prerequisites**: plan.md (completed), spec.md (completed)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure - no user story work begins until complete

- [ ] T001 Create TypeScript interface for MortgageProject type in frontend/types/project.ts
- [ ] T002 Create JSON data file structure in frontend/data/projects.json with 3-5 sample projects
- [ ] T003 [P] Create Skeleton component with shimmer effect in frontend/components/ui/skeleton.tsx
- [ ] T004 [P] Create ErrorMessage component with recovery actions in frontend/components/ui/error-message.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 2: User Story 1 - Browse Marketplace Properties (Priority: P1) 🎯 MVP

**Goal**: Users can browse all available mortgage projects on the marketplace page

**Independent Test**: Navigate to /marketplace and verify all projects from JSON are displayed as cards with preview details

### Implementation for User Story 1

- [ ] T005 [P] [US1] Create useProjects hook to load JSON data in frontend/hooks/useProjects.ts
- [ ] T006 [US1] Update MarketplaceContent component to use useProjects hook instead of hardcoded data in frontend/components/marketplace-content.tsx
- [ ] T007 [US1] Add skeleton loading state to marketplace grid in frontend/components/marketplace-content.tsx
- [ ] T008 [US1] Add error handling with ErrorMessage component for JSON load failures in frontend/components/marketplace-content.tsx
- [ ] T009 [P] [US1] Modify PropertyCard to include Next.js Link to /mortgage/[id] in frontend/components/property-card.tsx
- [ ] T010 [US1] Test marketplace page displays all projects from JSON correctly
- [ ] T011 [US1] Test skeleton loading state appears during data fetch
- [ ] T012 [US1] Test error message displays when JSON fails to load

**Checkpoint**: User Story 1 complete - marketplace browsing fully functional

---

## Phase 3: User Story 2 - View Property Details (Priority: P1)

**Goal**: Users can click "Invest Now" and view comprehensive mortgage project details

**Independent Test**: Click "Invest Now" on a marketplace card and verify all project details are displayed correctly on the detail page

### Implementation for User Story 2

- [ ] T013 [P] [US2] Create dynamic route page in frontend/app/mortgage/[id]/page.tsx
- [ ] T014 [P] [US2] Create PropertyDetail component with full property info display in frontend/components/property-detail.tsx
- [ ] T015 [US2] Implement project data fetching by ID from JSON in frontend/app/mortgage/[id]/page.tsx
- [ ] T016 [US2] Add responsive layout for mobile/desktop to PropertyDetail component in frontend/components/property-detail.tsx
- [ ] T017 [US2] Add skeleton loader for property detail page load state in frontend/components/property-detail.tsx
- [ ] T018 [US2] Display property images, funding progress, terms, and risk metrics in frontend/components/property-detail.tsx
- [ ] T019 [US2] Implement 404 handling for invalid property IDs in frontend/app/mortgage/[id]/page.tsx
- [ ] T020 [US2] Test navigation from marketplace to detail page works correctly
- [ ] T021 [US2] Test correct project loads by ID
- [ ] T022 [US2] Test 404 handling for invalid IDs
- [ ] T023 [US2] Test responsive design on mobile devices

**Checkpoint**: User Stories 1 AND 2 complete - browsing and detail viewing fully functional

---

## Phase 4: User Story 3 - Submit Investment (Priority: P1)

**Goal**: Users can enter investment amount and submit transaction through wallet

**Independent Test**: Enter a valid investment amount, click invest, and verify successful transaction processing

### Implementation for User Story 3

- [ ] T024 [P] [US3] Create validation utility functions for investment amounts in frontend/lib/validation.ts
- [ ] T025 [P] [US3] Create InvestmentForm component with input and validation in frontend/components/investment-form.tsx
- [ ] T026 [P] [US3] Create useInvestment hook for transaction logic in frontend/hooks/useInvestment.ts
- [ ] T027 [US3] Integrate InvestmentForm with PropertyDetail component in frontend/components/property-detail.tsx
- [ ] T028 [US3] Implement form validation (minimum 1 USDT, max = remaining funding) in frontend/components/investment-form.tsx
- [ ] T029 [US3] Wire up investment form to smart contract invest() function in frontend/hooks/useInvestment.ts
- [ ] T030 [US3] Add wallet connection error handling with user-friendly messages in frontend/hooks/useInvestment.ts
- [ ] T031 [US3] Add transaction pending states with loading indicators in frontend/components/investment-form.tsx
- [ ] T032 [US3] Implement transaction confirmation handling in frontend/hooks/useInvestment.ts
- [ ] T033 [US3] Add redirect to home page after successful investment in frontend/components/investment-form.tsx
- [ ] T034 [US3] Implement transaction error handling with retry option in frontend/hooks/useInvestment.ts
- [ ] T035 [US3] Display success/error toasts for transaction results in frontend/components/investment-form.tsx
- [ ] T036 [US3] Test validation with various amounts (valid, too low, too high)
- [ ] T037 [US3] Test wallet prompts appear on submit
- [ ] T038 [US3] Test error handling for insufficient funds
- [ ] T039 [US3] Test transaction pending states display correctly
- [ ] T040 [US3] Test successful investment flow end-to-end
- [ ] T041 [US3] Test all error scenarios (wallet connection, insufficient funds, transaction rejected, network error)

**Checkpoint**: User Stories 1, 2, AND 3 complete - full investment flow functional

---

## Phase 5: User Story 4 - Portfolio Update (Priority: P2)

**Goal**: Users see new investment reflected in portfolio immediately after successful transaction

**Independent Test**: Make an investment and verify the portfolio section updates with the new investment details

### Implementation for User Story 4

- [ ] T042 [P] [US4] Create usePortfolio hook for portfolio data management in frontend/hooks/usePortfolio.ts
- [ ] T043 [US4] Update DashboardContent component to use real-time portfolio data in frontend/components/dashboard-content.tsx
- [ ] T044 [US4] Implement contract event listening for investment confirmations in frontend/hooks/usePortfolio.ts
- [ ] T045 [US4] Add portfolio refetch after transaction success in frontend/hooks/usePortfolio.ts
- [ ] T046 [US4] Display updated investment in portfolio list in frontend/components/dashboard-content.tsx
- [ ] T047 [US4] Add loading state during portfolio refresh in frontend/components/dashboard-content.tsx
- [ ] T048 [US4] Test investment appears in portfolio after completion
- [ ] T049 [US4] Test portfolio persistence on page refresh
- [ ] T050 [US4] Test loading states during portfolio updates
- [ ] T051 [US4] Test correct amounts and details display in portfolio

**Checkpoint**: All user stories complete - full feature functional

---

## Phase 6: Polish & Edge Cases

**Purpose**: Handle all edge cases and final refinements

### Edge Case Handling

- [ ] T052 [P] Handle investment exceeding remaining funding - auto-adjust to max available in frontend/lib/validation.ts
- [ ] T053 [P] Handle invalid investment amount - clear input and show error in frontend/components/investment-form.tsx
- [ ] T054 [P] Handle JSON load failure - retry button with error message in frontend/components/marketplace-content.tsx
- [ ] T055 [P] Handle corrupted JSON data - support contact message in frontend/hooks/useProjects.ts
- [ ] T056 [P] Handle wallet connection lost during investment - reconnect prompt in frontend/hooks/useInvestment.ts
- [ ] T057 [P] Handle network interruption - transaction status check in frontend/hooks/useInvestment.ts
- [ ] T058 [P] Handle project fully funded while viewing - disable invest button in frontend/components/investment-form.tsx

### Polish Items

- [ ] T059 [P] Add smooth page transitions between marketplace and detail pages
- [ ] T060 [P] Improve mobile touch targets for all interactive elements
- [ ] T061 [P] Optimize image loading with Next.js Image component
- [ ] T062 [P] Add ARIA labels for accessibility
- [ ] T063 [P] Ensure keyboard navigation works throughout the flow
- [ ] T064 Test each edge case scenario works correctly
- [ ] T065 Test accessibility with screen reader
- [ ] T066 Test keyboard navigation functionality

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **User Story 1 (Phase 2)**: Depends on Setup completion
- **User Story 2 (Phase 3)**: Depends on Setup completion (can run parallel to US1 if desired)
- **User Story 3 (Phase 4)**: Depends on Setup and US2 completion (needs PropertyDetail component)
- **User Story 4 (Phase 5)**: Depends on Setup and US3 completion (needs investment transaction)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Setup - No dependencies on other stories (can run parallel to US1)
- **User Story 3 (P1)**: Depends on US2 (needs PropertyDetail component to integrate InvestmentForm)
- **User Story 4 (P2)**: Depends on US3 (needs investment transaction to trigger portfolio update)

### Within Each User Story

- Tasks marked [P] can run in parallel (different files, no dependencies)
- Implementation tasks before testing tasks
- Core components before integration
- Story complete before moving to next priority

### Parallel Opportunities Per User Story

**User Story 1 Parallel Tasks**:
```bash
# Can run simultaneously:
T005 (useProjects hook)
T009 (PropertyCard link modification)
```

**User Story 2 Parallel Tasks**:
```bash
# Can run simultaneously:
T013 (dynamic route page)
T014 (PropertyDetail component)
```

**User Story 3 Parallel Tasks**:
```bash
# Can run simultaneously:
T024 (validation utils)
T025 (InvestmentForm component)
T026 (useInvestment hook)
```

**User Story 4 Parallel Tasks**:
```bash
# Can run simultaneously:
T042 (usePortfolio hook - can start while US3 is in progress)
```

**Phase 6 (Polish) Parallel Tasks**:
```bash
# All edge case handlers and polish items can run in parallel:
T052-T063
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)
If implementing minimum viable product first:
1. Complete Phase 1 (Setup)
2. Complete Phase 2 (User Story 1)
3. Deploy and validate marketplace browsing works

### Incremental Delivery (Story by Story)
Recommended approach for feature development:
1. Complete Phase 1 (Setup) 
2. Complete Phase 2 (User Story 1) → Deploy
3. Complete Phase 3 (User Story 2) → Deploy
4. Complete Phase 4 (User Story 3) → Deploy
5. Complete Phase 5 (User Story 4) → Deploy
6. Complete Phase 6 (Polish) → Final deploy

### Full Feature (All Stories)
For complete feature release:
1. Complete all phases sequentially
2. Run comprehensive end-to-end testing
3. Deploy complete feature

---

## Success Metrics Validation

After implementation, verify these success criteria from spec.md:

- [ ] **SC-001**: Users can browse all available projects on marketplace page within 2 seconds of page load
- [ ] **SC-002**: 95% of users successfully navigate from marketplace to property details without errors
- [ ] **SC-003**: Users can complete investment submission in under 3 minutes from property detail page
- [ ] **SC-004**: 90% of investment transactions are processed successfully on first attempt
- [ ] **SC-005**: Portfolio updates reflect new investments within 5 seconds of transaction confirmation
- [ ] **SC-006**: System handles 50 concurrent users browsing marketplace without performance degradation
- [ ] **SC-007**: Error states are properly displayed with clear recovery instructions for all failure scenarios
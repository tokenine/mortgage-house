# Tasks: Frontend Refactor Structure

**Input**: Design documents from `/specs/001-frontend-refactor-structure/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests requested via clarification (Option A full gate). Include tasks for lint, typecheck/build, unit/integration, Playwright e2e.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize supporting tooling and guardrails to enable safe refactor

- [ ] T001 Create migration folder `frontend/migrations/` for mapping and codemods
- [ ] T002 [P] Add Vitest config `frontend/vitest.config.ts` (standard Testing Library setup)
- [ ] T003 Add `vitest` script and devDeps in `frontend/package.json` ("vitest": "vitest run")
- [ ] T004 [P] Add ESLint rule `no-restricted-imports` to block legacy deep paths in `frontend/.eslintrc.*`
- [ ] T005 [P] Update TS alias rules in `frontend/tsconfig.json` (add `@domains/*`, `@shared/*` while preserving `@/*`)
- [ ] T006 Add old→new path mapping file `frontend/migrations/frontend-path-mapping.csv`
- [ ] T007 [P] Add codemod script `frontend/migrations/codemod-rewrite-imports.ts`
- [ ] T008 Document conventions in `specs/001-frontend-refactor-structure/quickstart.md` (confirm alias/barrel usage)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish new structure, barrels, compatibility layers; MUST be complete before stories

- [ ] T009 Create `frontend/domains/` root with subfolders: `admin/`, `investment/`, `marketplace/`, `projects/`
- [ ] T010 [P] Create shared folders `frontend/shared/ui/`, `frontend/shared/hooks/`, `frontend/shared/lib/`
- [ ] T011 [P] Create compatibility barrels `frontend/compat/components/index.ts`, `frontend/compat/hooks/index.ts`, `frontend/compat/lib/index.ts`
- [ ] T012 [P] Add domain barrels `frontend/domains/admin/index.ts`
- [ ] T013 [P] Add domain barrels `frontend/domains/investment/index.ts`
- [ ] T014 [P] Add domain barrels `frontend/domains/marketplace/index.ts`
- [ ] T015 [P] Add domain barrels `frontend/domains/projects/index.ts`
- [ ] T016 Configure lint rules to restrict cross-domain deep imports (barrel-only) in `frontend/.eslintrc.*`
- [ ] T017 [P] Ensure `frontend/next.config.mjs` supports TS path aliases (if needed, via `experimental.tsconfigPaths: true`)
- [ ] T018 Create mapping entries in `frontend/migrations/frontend-path-mapping.csv` for all moved files
- [ ] T019 [P] Update `verify-admin-panel.js` to use new import paths if applicable
- [ ] T020 Ensure Playwright base URL env for gate runs (set `BASE_URL` or document in `quickstart.md`)

**Checkpoint**: Foundation ready — domain folders, barrels, alias rules, mapping, and compatibility layers in place.

---

## Phase 3: User Story 1 - Preserve User-Facing Behavior (Priority: P1) 🎯 MVP

**Goal**: Preserve 100% visible behavior across core journeys (browse, invest, withdraw, admin)

**Independent Test**: Full post-refactor gate passes: lint, typecheck/build, unit/integration, Playwright e2e, Next build (docs-equivalent)

### Tests for User Story 1

- [ ] T021 [P] [US1] Run lint in `frontend/` and fix errors (structural import issues)
- [ ] T022 [P] [US1] Run typecheck/build `pnpm next build` in `frontend/`
- [ ] T023 [P] [US1] Run unit/integration `pnpm vitest run` in `frontend/`
- [ ] T024 [P] [US1] Run Playwright e2e in `tests/` (all specs)

### Implementation for User Story 1 (Move with mapping + compatibility)

- [ ] T025 [P] [US1] Move admin components to `frontend/domains/admin/components/`:
  - AdminPanel.tsx
  - admin-bond-selector.tsx
  - admin-content.tsx
  - lifecycle-panel.tsx
  - repayment-panel.tsx
- [ ] T026 [P] [US1] Move admin hook to `frontend/domains/admin/hooks/useAdminPanel.ts`
- [ ] T027 [P] [US1] Move marketplace components to `frontend/domains/marketplace/components/`:
  - MarketList.tsx
  - marketplace-content.tsx
  - sell-order-card.tsx
  - SellModal.tsx
- [ ] T028 [P] [US1] Move marketplace hook to `frontend/domains/marketplace/hooks/useMarketplace.ts`
- [ ] T029 [P] [US1] Move investment components to `frontend/domains/investment/components/`:
  - InvestCard.tsx
  - investment-form.tsx
  - claim-button.tsx
- [ ] T030 [P] [US1] Move investment hooks to `frontend/domains/investment/hooks/`:
  - useInvestment.ts
  - usePortfolio.ts
- [ ] T031 [P] [US1] Move projects components to `frontend/domains/projects/components/`:
  - property-card.tsx
  - property-detail.tsx
  - bond-card.tsx
- [ ] T032 [P] [US1] Move projects domain data/lib to `frontend/domains/projects/`:
  - data/projects.json → `frontend/domains/projects/data/projects.json`
  - lib/projects.ts → `frontend/domains/projects/lib/projects.ts`
  - contexts/ProjectContext.tsx → `frontend/domains/projects/contexts/ProjectContext.tsx`
  - hooks/useProjects.ts → `frontend/domains/projects/hooks/useProjects.ts`
- [ ] T033 [P] [US1] Move shared UI primitives to `frontend/shared/ui/`:
  - components/ui/* (entire folder)
  - theme-provider.tsx
  - error-boundary.tsx
  - order-creation-error-boundary.tsx
  - dashboard-layout.tsx
  - dashboard-content.tsx
  - stats-card.tsx
  - WalletConnect.tsx
  - Web3Provider.tsx
  - UserDashboard.tsx
- [ ] T034 [P] [US1] Move shared hooks to `frontend/shared/hooks/`:
  - use-media-query.ts
  - use-mobile.ts
  - use-toast.ts
  - useWebSocket.ts
- [ ] T035 [P] [US1] Move shared lib to `frontend/shared/lib/`:
  - animations.ts
  - utils.ts
  - validation.ts
  - wagmi-config.ts
- [ ] T036 [P] [US1] Assign domain lib locations:
  - order-validation.ts → `frontend/domains/marketplace/lib/order-validation.ts`
  - contracts.ts → `frontend/shared/lib/contracts.ts` (shared)
  - abis/ → `frontend/shared/lib/abis/`
- [ ] T037 [US1] Create/Update barrels with named exports in each new folder (`index.ts`) and re-point imports via `@domains/*` or `@shared/*`
- [ ] T038 [US1] Update mapping `frontend/migrations/frontend-path-mapping.csv` with all moves (old path,new path)
- [ ] T039 [US1] Run codemod `frontend/migrations/codemod-rewrite-imports.ts` to rewrite imports per mapping
- [ ] T040 [US1] Update any route-owned imports under `frontend/app/` to new barrels (ensure no route changes)
- [ ] T041 [US1] Validate `frontend/__tests__/integration/admin-panel.test.ts` imports and fix to new paths
- [ ] T042 [US1] Validate `frontend/__tests__/integration/marketplace-orders.test.tsx` imports and fix to new paths
- [ ] T043 [US1] Re-run full gate (lint, build, vitest, e2e) and record results in PR description

**Checkpoint**: User Story 1 passes full gate and core journeys remain unchanged.

---

## Phase 4: User Story 2 - Developer-Friendly Module Layout (Priority: P2)

**Goal**: Developers can quickly locate components/hooks/utilities by domain with clean aliasing

**Independent Test**: Developer can find any artifact via documented rules and path aliases; imports resolve without churn

### Implementation for User Story 2

- [ ] T044 [P] [US2] Document grouping rules in `specs/001-frontend-refactor-structure/quickstart.md` (domain vs shared)
- [ ] T045 [P] [US2] Add examples of correct imports in `frontend/README.md` (if missing) using `@domains/*` and `@shared/*`
- [ ] T046 [US2] Enforce alias-only cross-domain imports via ESLint (`no-restricted-imports`) in `frontend/.eslintrc.*`
- [ ] T047 [US2] Add `import/no-cycle` rule to prevent cycles between domains in `frontend/.eslintrc.*`
- [ ] T048 [US2] Add CI check step for lint/type/vitest in pipeline (document in `quickstart.md`)
- [ ] T049 [US2] Ensure barrels expose stable contracts (explicit named exports; deprecate deep files)
- [ ] T050 [US2] Verify `frontend/tsconfig.json` path mappings for new barrels (`@domains/*`, `@shared/*`, `@/*`) are correct
- [ ] T051 [US2] Spot-check discoverability: locate 5 artifacts within ≤2 minutes and record in PR

**Checkpoint**: Developers navigate easily; imports resolve consistently through barrels and aliases.

---

## Phase 5: User Story 3 - Migration Safety Net (Priority: P3)

**Goal**: Provide mapping and guardrails to prevent regressions during transition

**Independent Test**: Deprecated paths are flagged by CI; mapping resolves all legacy references deterministically

### Implementation for User Story 3

- [ ] T052 [P] [US3] Maintain compatibility barrels in `frontend/compat/*` that re-export new paths
- [ ] T053 [US3] Add ESLint rule to forbid legacy paths after migration window (toggleable via config)
- [ ] T054 [US3] Ensure mapping coverage = 100% of moved files in `frontend/migrations/frontend-path-mapping.csv`
- [ ] T055 [US3] Add a script to detect legacy imports `frontend/migrations/find-legacy-imports.ts`
- [ ] T056 [US3] Add CI step to run legacy import detection (fail on hits)
- [ ] T057 [US3] Update Playwright tests for any UI path changes (should be none; verify stability)

**Checkpoint**: Legacy references are either re-exported temporarily or blocked; mapping fully covers moved artifacts.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements and documentation updates

- [ ] T058 [P] Update `docs/DEVELOPMENT-SETUP.md` with alias/barrel rules and gate commands
- [ ] T059 [P] Update `frontend/README.md` with new structure overview and examples
- [ ] T060 Code cleanup: remove obsolete imports, delete unused legacy files after guardrails active
- [ ] T061 Security hardening: ensure Wagmi event watchers and write flows unchanged (manual review in `frontend/shared/lib/wagmi-config.ts` and hooks)
- [ ] T062 Performance check: compare Next build timing and key e2e timings pre/post-refactor; log in PR
- [ ] T063 Run quickstart validation per `specs/001-frontend-refactor-structure/quickstart.md`
 - [ ] T064 [P] Accessibility checks on shared UI: verify roles/labels/focus/keyboard across moved components
 - [ ] T065 [P] Document a11y verification outcomes in PR (components checked, findings, fixes)

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): No dependencies — start immediately
- Foundational (Phase 2): Depends on Setup completion — BLOCKS all user stories
- User Stories (Phase 3+): All depend on Foundational phase completion
- Polish (Final Phase): Depends on desired user stories being complete

### User Story Dependencies

- User Story 1 (P1): Starts after Foundational — no dependency on other stories
- User Story 2 (P2): Starts after Foundational — independent; relies on barrels/aliases
- User Story 3 (P3): Starts after Foundational — independent; relies on mapping + ESLint rules

### Within Each User Story

- Tests MUST be run after implementation; gate fails on any hit
- Models (here: barrels/aliases) before import rewrites
- Core implementation before compatibility removal
- Story complete before next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- Foundational tasks marked [P] can run in parallel
- Once Foundational completes, all user stories can proceed in parallel
- Tests for a story marked [P] can run in parallel
- Move operations across different folders can run in parallel (ensure no file conflicts)

---

## Parallel Example: User Story 1

```bash
# In parallel after Foundational:
# - Run gate commands
# - Move domain-specific files and update barrels

# Gate runs
cd frontend && pnpm lint & pnpm next build & pnpm vitest run & wait
cd ../tests && pnpm test

# Move files (different folders)
# investment components
mv frontend/components/investment-form.tsx frontend/domains/investment/components/
mv frontend/components/InvestCard.tsx frontend/domains/investment/components/

# marketplace components
mv frontend/components/MarketList.tsx frontend/domains/marketplace/components/
mv frontend/components/SellModal.tsx frontend/domains/marketplace/components/
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (preserve behavior)
4. STOP and VALIDATE: run full gate; confirm zero regressions
5. Commit and open PR with mapping and results

### Incremental Delivery

1. Setup + Foundational → ready
2. Add User Story 1 → test independently → merge (MVP)
3. Add User Story 2 → enforce developer structure → merge
4. Add User Story 3 → guardrails + mapping 100% → merge

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. After Foundational:
   - Dev A: User Story 1 (admin/investment moves)
   - Dev B: User Story 2 (lint/alias/CI enforcement)
   - Dev C: User Story 3 (compat barrels, mapping coverage, detection script)
3. Stories integrate independently

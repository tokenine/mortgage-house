# Implementation Plan: Frontend Refactor Structure

**Branch**: `001-frontend-refactor-structure` | **Date**: 2025-12-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-frontend-refactor-structure/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Refactor the `frontend/` codebase into a sensible, domain-first grouping and naming scheme while preserving 100% user-facing behavior. Produce old-to-new import mapping, enforce updated path aliases, and run the full post-refactor gate (lint, typecheck via build, unit/integration, Playwright e2e, and Next build — docs-equivalent) to guarantee no regressions.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.x (Next.js 16, React 19), Node >=18 (local v20.14.0)  
**Primary Dependencies**: Next.js 16 (app router), Wagmi 3 + Viem 2, @tanstack/react-query 5, Tailwind CSS 4, Radix UI, class-variance-authority/clsx, Zod 3  
**Storage**: N/A (frontend-only; consumes on-chain data via Wagmi/Viem)  
**Testing**: ESLint; typecheck via `next build`; unit/integration currently mixed (Vitest + Jest style mocks) → standardize on Vitest + Testing Library; e2e via Playwright (`tests/` workspace). Use `next build` as the docs-equivalent (no Storybook present).  
**Target Platform**: Web (Next.js app router)  
**Project Type**: Web application (frontend monorepo package + separate Playwright workspace)  
**Performance Goals**: Preserve current UX performance; no new perf targets requested (treat as no-regression baseline).  
**Constraints**: Zero functional regressions; maintain real blockchain integration (no runtime mocks); full post-refactor gate: lint + typecheck + unit/integration + Playwright e2e + docs/Storybook-equivalent build.  
**Scale/Scope**: Structural refactor of `frontend/` (components, hooks, contexts, data/lib) plus import mapping; no backend/API changes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Security-First: Frontend keeps real Wagmi/Viem integration; runtime code must not introduce mocks or bypass on-chain reads. PASS (scope is structural; guard by preserving hooks/contracts and validating via e2e/Playwright + Wagmi-dependent tests).
- Test-First Development: Existing tests must continue to run; any new/adjusted modules require failing Vitest specs before fixes. PASS with condition to standardize test runner and add missing coverage for moved boundaries.
- Transparency & Auditability: Preserve event/listen surfaces and UI status; ensure renamed files still emit/consume the same data. PASS contingent on mapping and regression suite.
- User Story Independence: Stories are independent (behavior preservation, developer navigation, migration safety). PASS.
- Gas Optimization: Not directly impacted; no changes to contract calls beyond imports. PASS (no scope change).
- Real Blockchain Integration: Maintain real Wagmi reads/writes and event watchers; no mock fallbacks in production code. PASS (verify via integration/e2e).

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
```text
frontend/
├── app/                   # Next app router routes/pages
├── components/            # Shared UI components (will be regrouped by domain)
├── contexts/              # React contexts (will align to domain slices)
├── data/                  # Data fixtures/config
├── hooks/                 # Shared hooks (incl. Wagmi/viem integration)
├── lib/                   # Utilities (contracts config, helpers)
├── styles/                # Global and Tailwind styles
├── types/                 # Shared TypeScript types
├── public/                # Static assets
├── __tests__/integration/ # RTL/Vitest/Jest tests (needs runner alignment)
└── next.config.mjs, tsconfig.json, components.json

tests/
├── *.spec.ts              # Playwright e2e suite
└── playwright.config.ts
```

**Structure Decision**: Web application with domain-first regrouping inside `frontend/` (investment, admin, shared primitives) plus dedicated Playwright workspace in `/tests`. No backend packages involved.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

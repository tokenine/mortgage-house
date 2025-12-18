# Research: Frontend Refactor Structure

## Decision: Standardize on Vitest + Testing Library for unit/integration
- **Rationale**: Current `frontend/__tests__/integration` mixes Jest-style mocks and Vitest; Vitest already used alongside Testing Library and aligns with ESM + Vite-compatible tooling. Consolidating removes dual configs and ensures consistent watch/debug experience.
- **Alternatives considered**:
  - Keep Jest for some tests: rejected (duplicate configs, slower in ESM/Next 16 context).
  - Add both Jest and Vitest runners: rejected (more maintenance, higher flake risk).

## Decision: Docs/Storybook build handling
- **Rationale**: No `.storybook` present. To satisfy the "docs/Storybook build" gate, run `pnpm --filter frontend next build` as the doc-equivalent build (includes typecheck and route tree). Add Storybook only if future UI documentation is required.
- **Alternatives considered**:
  - Introduce Storybook now: heavier setup and maintenance for a structural refactor; not needed to validate this change.
  - Skip docs build entirely: rejected; Next build provides the required safety net.

## Decision: Domain-first grouping and import contracts
- **Rationale**: Adopt domain slices (e.g., `frontend/domains/investment`, `frontend/domains/admin`) with shared primitives in `frontend/shared`. Each domain exports via an `index.ts` barrel to define its public surface, minimizing cross-domain imports and preventing deep relative paths. Maintain `@/*` alias at repo root to reference domain barrels.
- **Alternatives considered**:
  - Pure technical layering (`components/`, `hooks/`, `utils/`): harder to reason about feature ownership, encourages cross-cutting coupling.
  - Keep current flat structure: fails the navigability goal and increases import churn.

## Decision: Old-to-new path mapping and enforcement
- **Rationale**: Produce a mapping table (CSV/MD) for every moved file and run a codemod to rewrite imports. Enforce with ESLint `no-restricted-imports` to block legacy paths during transition. This reduces missed references and guarantees regressions are caught by lint/type.
- **Alternatives considered**:
  - Manual find/replace only: error-prone for large refactors.
  - Rely solely on TypeScript errors: slower feedback and may miss runtime assets.

## Decision: Performance target handling
- **Rationale**: No explicit perf targets provided; treat performance as "no regression" relative to pre-refactor baselines. Use Next build and Playwright timings to watch for abnormal slowdowns after the reorg.
- **Alternatives considered**:
  - Introduce new perf budgets now: out of scope for structural rename and lacks baseline metrics.

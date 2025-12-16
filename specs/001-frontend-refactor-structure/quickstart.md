# Quickstart: Frontend Refactor Structure

## Setup

1) Install frontend deps:
```bash
cd frontend
pnpm install
```

2) Install Playwright test deps:
```bash
cd ../tests
pnpm install
pnpm install:browsers
```

## Post-refactor validation gate (Option A)

Run from repo root after the refactor:
```bash
cd frontend
pnpm next build                # Typecheck + route/doc-equivalent build (primary validation)
pnpm vitest run                # Unit/integration tests
cd ../tests
pnpm test                      # Playwright e2e (full user journey validation)
```

## Module Organization & Discovery

### Domain-First Grouping

Artifacts are organized by **business domain**, not file type:

```
frontend/
├── domains/
│   ├── admin/           → Admin panel, lifecycle, bond management
│   ├── investment/      → Investment cards, claim flows, portfolio
│   ├── marketplace/     → Order creation, buy/sell flows, listings
│   └── projects/        → Property cards, project data, bond details
├── shared/
│   ├── ui/              → Reusable UI primitives (buttons, dialogs, etc.)
│   ├── hooks/           → Cross-domain hooks (useFormValidation, etc.)
│   └── lib/             → Web3 config, validation, utilities, ABIs
```

### Path Aliases & Import Rules

**✅ Correct imports (using barrels)**:
```typescript
// Import from domain barrel (GOOD)
import { AdminPanel, useAdminPanel } from '@/domains/admin'
import { InvestCard, usePortfolio } from '@/domains/investment'

// Import from shared barrel (GOOD)
import { Button, Card } from '@/shared/ui'
import { useFormValidation } from '@/shared/hooks'
import { wagmiConfig } from '@/shared/lib'

// Legacy UI path alias (for backward compatibility)
import { Dialog } from '@/components/ui/dialog'
```

**❌ Incorrect imports (deep paths)**:
```typescript
// DO NOT import directly from subfolders
import { AdminPanel } from '@/domains/admin/components/AdminPanel'  // ❌ Use barrel instead
import { Button } from '@/shared/ui/ui/button'                       // ❌ Use barrel instead
import { useFormValidation } from '@/shared/hooks/useFormValidation' // ❌ Use barrel instead
```

### Locating Artifacts (≤2 min discovery)

1. **Need a component?** → Check `frontend/domains/{domain}/components/` + barrel export
2. **Need a hook?** → Check `frontend/domains/{domain}/hooks/` or `frontend/shared/hooks/`
3. **Need utilities?** → Check `frontend/shared/lib/` (wagmi-config, validation, contracts, etc.)
4. **Need UI primitives?** → Import from `@/shared/ui` barrel (Button, Card, Dialog, etc.)
5. **Need type definitions?** → Check `frontend/types/` or domain-specific `.ts` files

## Barrel Exports (Public Contracts)

Each domain/shared folder exposes a **barrel export** (`index.ts`) that defines the **public API**:

```typescript
// @/domains/admin/index.ts - public contract
export * from './components/AdminPanel'
export * from './components/admin-content'
export * from './hooks/useAdminPanel'
```

✅ **Always import from barrels** — they're the stable contracts for each module.

## ESLint Enforcement

Import rules are enforced via ESLint (`frontend/.eslintrc.json`):

- **no-restricted-imports**: Blocks deep imports from domains/shared (requires barrel usage)
- **import/no-cycle**: Prevents circular dependencies between modules
- Override in tests: `**/*.test.ts`, `**/*.spec.ts` files can import directly

**Run ESLint**:
```bash
cd frontend
pnpm lint              # Will error on rule violations
```

## CI Check Steps

Add to your CI pipeline (GitHub Actions / other):

```yaml
- name: Lint
  run: cd frontend && pnpm lint
  
- name: Typecheck & Build
  run: cd frontend && pnpm next build
  
- name: Unit/Integration Tests
  run: cd frontend && pnpm vitest run
  
- name: Playwright E2E
  run: cd tests && pnpm test
```

## Migration Safety

- Apply the old→new import mapping codemod before committing:
  ```bash
  cd frontend
  node migrations/codemod-rewrite-imports.js
  ```
- ESLint `no-restricted-imports` rule automatically flags any legacy deep imports
- Compatibility barrels in `frontend/compat/` temporarily re-export from new locations (for gradual migration)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **"Cannot find module @/domains/..."** | Ensure file exports from domain barrel (index.ts) and tsconfig paths are correct |
| **"ESLint error: import must use barrel"** | Change `@/domains/{domain}/components/File` → `@/domains/{domain}` |
| **"Vitest not found"** | Run `pnpm install` to ensure vitest is installed with `pnpm vitest run` script |
| **Playwright BASE_URL incorrect** | Set `BASE_URL=http://localhost:3000` if not running on default port |

# Frontend Architecture & Module Organization - Addition to DEVELOPMENT-SETUP.md

As of December 16, 2025, the frontend has been refactored to use a **domain-first** structure for improved modularity and developer experience.

## Module Organization

```
frontend/
├── domains/               # Business domain-specific code
│   ├── admin/            # Admin panel functions
│   ├── investment/       # Investment & portfolio features
│   ├── marketplace/      # Buy/sell order flows
│   └── projects/         # Property & project details
├── shared/               # Cross-domain resources
│   ├── ui/              # Reusable UI primitives
│   ├── hooks/           # Shared hooks (form, web3, etc.)
│   └── lib/             # Utilities, Web3 config, validation
└── app/                 # Next.js routes & pages
```

## Path Aliases & Imports

All imports use **path aliases** (no relative paths):

```typescript
// ✅ Import from domain barrel
import { AdminPanel, useAdminPanel } from '@/domains/admin'

// ✅ Import from shared barrel  
import { Button } from '@/shared/ui'
import { useFormValidation } from '@/shared/hooks'

// ❌ DO NOT use deep paths or relative imports
// import { AdminPanel } from '@/domains/admin/components/AdminPanel'  // Wrong!
// import { Button } from '../shared/ui/ui/button'                     // Wrong!
```

## ESLint Rules

Import rules are enforced via ESLint:

- **Barrel-only imports** — Prevents deep imports from domains/shared (use `@/domains/{domain}`, `@/shared/*`)
- **No circular imports** — Prevents dependencies between domains
- **Test override** — Tests can import directly from files

**Run linter**:
```bash
cd frontend
pnpm lint
```

## Full Validation Gate

Run this before committing to ensure refactor integrity:

```bash
cd frontend
pnpm next build      # TypeScript check + compile
pnpm check:legacy    # Detect any old import paths
cd ../tests
pnpm test           # E2E validation
```

## Quick Development Checks

```bash
cd frontend

# Check for legacy imports
pnpm check:legacy

# Full validation (lint, build, legacy check, vitest)
pnpm check:all

# Development server
pnpm next dev
```

## Migration Notes

The refactor maintains **100% backward compatibility**:
- All routes unchanged
- All functionality preserved
- Build configuration updated to support new paths
- Old path aliases still work via compatibility layer

## Related Documentation

For detailed information, see:
- [Frontend README](../frontend/README.md) — Architecture guide with file structure
- [Quickstart](../specs/001-frontend-refactor-structure/quickstart.md) — Setup & troubleshooting
- [Specification](../specs/001-frontend-refactor-structure/spec.md) — Feature requirements

---

**Last Updated:** December 16, 2025 (Refactor complete)

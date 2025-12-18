# Frontend Architecture & Developer Guide

This frontend is a **domain-first** Next.js 16 application built with React 19, TypeScript, Wagmi (Web3), and TailwindCSS. The architecture prioritizes **discoverability**, **modularity**, and **real blockchain integration**.

## 🏗️ Project Structure

```
frontend/
├── app/                         # Next.js App Router (routes & pages)
│   ├── page.tsx                # Home / dashboard
│   ├── admin/page.tsx          # Admin panel route
│   ├── marketplace/page.tsx    # Marketplace route
│   ├── bonds/[id]/page.tsx     # Bond detail page
│   ├── mortgage/[id]/page.tsx  # Mortgage detail page
│   ├── api/                     # API routes
│   └── layout.tsx              # Root layout with providers
│
├── domains/                     # Business domains (core application logic)
│   ├── admin/                  # Admin panel domain
│   │   ├── components/         # Admin UI components
│   │   │   ├── AdminPanel.tsx
│   │   │   ├── admin-content.tsx
│   │   │   ├── admin-bond-selector.tsx
│   │   │   ├── lifecycle-panel.tsx
│   │   │   └── repayment-panel.tsx
│   │   ├── hooks/             # Admin-specific hooks
│   │   │   └── useAdminPanel.ts
│   │   └── index.ts           # Barrel export (public API)
│   │
│   ├── investment/             # Investment domain
│   │   ├── components/
│   │   │   ├── InvestCard.tsx
│   │   │   ├── investment-form.tsx
│   │   │   └── claim-button.tsx
│   │   ├── hooks/
│   │   │   ├── useInvestment.ts
│   │   │   └── usePortfolio.ts
│   │   └── index.ts
│   │
│   ├── marketplace/            # Marketplace domain
│   │   ├── components/
│   │   │   ├── MarketList.tsx
│   │   │   ├── marketplace-content.tsx
│   │   │   ├── SellModal.tsx
│   │   │   └── sell-order-card.tsx
│   │   ├── hooks/
│   │   │   └── useMarketplace.ts
│   │   ├── lib/
│   │   │   └── order-validation.ts
│   │   └── index.ts
│   │
│   └── projects/               # Projects/property domain
│       ├── components/
│       │   ├── property-card.tsx
│       │   ├── property-detail.tsx
│       │   └── bond-card.tsx
│       ├── hooks/
│       │   └── useProjects.ts
│       ├── contexts/
│       │   └── ProjectContext.tsx
│       ├── lib/
│       │   └── projects.ts
│       ├── data/
│       │   └── projects.json
│       └── index.ts
│
├── shared/                      # Shared, cross-domain resources
│   ├── ui/                      # Reusable UI component library
│   │   ├── ui/                 # Radix UI / Base primitives
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── animated-button.tsx
│   │   │   └── ... (40+ UI components)
│   │   ├── theme-provider.tsx
│   │   ├── dashboard-layout.tsx
│   │   ├── dashboard-content.tsx
│   │   ├── error-boundary.tsx
│   │   ├── WalletConnect.tsx
│   │   ├── Web3Provider.tsx
│   │   ├── order-creation-modal.tsx
│   │   └── index.ts            # Barrel export
│   │
│   ├── hooks/                   # Cross-domain hooks
│   │   ├── use-media-query.ts
│   │   ├── use-mobile.ts
│   │   ├── use-toast.ts
│   │   ├── useWebSocket.ts
│   │   ├── useFormValidation.ts
│   │   ├── useMortgageBond.ts
│   │   ├── useTransactionState.ts
│   │   └── index.ts            # Barrel export
│   │
│   └── lib/                     # Shared utilities & configuration
│       ├── wagmi-config.ts      # Web3 provider setup
│       ├── contracts.ts         # Contract ABIs & addresses
│       ├── validation.ts        # Form/data validation
│       ├── utils.ts             # Helper functions
│       ├── animations.ts        # Reusable animations
│       ├── abis/               # Smart contract ABIs
│       │   ├── MortgageBond.json
│       │   └── MockERC20.json
│       └── index.ts            # Barrel export
│
├── migrations/                  # Refactoring tools (not part of runtime)
│   ├── frontend-path-mapping.csv      # Old → new path mapping
│   ├── codemod-rewrite-imports.js     # Import rewriting script
│   └── find-legacy-imports.ts         # Legacy path detection
│
├── __tests__/                   # Test suites
│   └── integration/
│       ├── admin-panel.test.ts
│       └── marketplace-orders.test.tsx
│
├── types/                       # Global TypeScript definitions
├── styles/                      # Global CSS & Tailwind
├── public/                      # Static assets
├── compat/                      # Backward-compatibility barrels (gradual migration)
│
├── .eslintrc.json              # ESLint rules (import enforcement)
├── tsconfig.json               # TypeScript config with path aliases
├── vitest.config.ts            # Vitest configuration
├── next.config.mjs             # Next.js configuration
└── package.json                # Dependencies & scripts
```

## 📍 Path Aliases

All imports use **`@`-prefixed aliases** (not relative paths):

```typescript
// ✅ Domain barrel import
import { AdminPanel, useAdminPanel } from '@/domains/admin'

// ✅ Shared barrel import
import { Button } from '@/shared/ui'
import { useFormValidation } from '@/shared/hooks'
import { wagmiConfig } from '@/shared/lib'

// ✅ Legacy UI path (backward compatible)
import { Dialog } from '@/components/ui/dialog'

// ❌ AVOID: Deep domain imports
import { AdminPanel } from '@/domains/admin/components/AdminPanel'

// ❌ AVOID: Relative paths across domains
import { useAdminPanel } from '../../domains/admin/hooks/useAdminPanel'
```

### Path Alias Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@domains/*": ["./domains/*"],
      "@shared/*": ["./shared/*"],
      "@/components/ui/*": ["./shared/ui/ui/*"]
    }
  }
}
```

## 🎯 Module Boundaries & Contracts

Each **domain** and **shared module** exposes a **barrel export** (`index.ts`) as its public API:

### Admin Domain
```typescript
// @/domains/admin/index.ts
export * from './components/AdminPanel'
export * from './components/admin-content'
export * from './hooks/useAdminPanel'
```

**Usage**:
```typescript
import { AdminPanel, useAdminPanel } from '@/domains/admin'
```

### Investment Domain
```typescript
// @/domains/investment/index.ts
export * from './components/InvestCard'
export * from './hooks/usePortfolio'
```

### Marketplace Domain
```typescript
// @/domains/marketplace/index.ts
export * from './components/MarketList'
export * from './hooks/useMarketplace'
export * from './lib/order-validation'
```

### Shared UI Module
```typescript
// @/shared/ui/index.ts
export * from './UserDashboard'
export * from './WalletConnect'
// + exports for 40+ UI primitives via Radix UI
```

## 🛣️ Key Routes & Domain Usage

| Route | Domain | Description |
|-------|--------|-------------|
| `/` | shared/investment | Dashboard with portfolio overview |
| `/admin` | admin | Admin panel for lifecycle & distribution |
| `/marketplace` | marketplace | Buy/sell orders for mortgage bonds |
| `/bonds/[id]` | projects/investment | Bond detail & claim flow |
| `/mortgage/[id]` | projects | Property & mortgage details |

## 🔧 Development Workflow

### Adding a New Component

1. **Determine the domain** — Is it admin, investment, marketplace, or projects?
2. **Create in domain folder** — `frontend/domains/{domain}/components/ComponentName.tsx`
3. **Export from barrel** — Add to `frontend/domains/{domain}/index.ts`:
   ```typescript
   export * from './components/ComponentName'
   ```
4. **Import in routes/other components** using barrel:
   ```typescript
   import { ComponentName } from '@/domains/{domain}'
   ```

### Adding a New Hook

1. **Determine scope** — Domain-specific or cross-domain (shared)?
2. **Create file** — `frontend/domains/{domain}/hooks/useHookName.ts` or `frontend/shared/hooks/useHookName.ts`
3. **Export from barrel** — Add to domain or shared `index.ts`
4. **Use in components**:
   ```typescript
   import { useHookName } from '@/domains/{domain}'
   // or
   import { useHookName } from '@/shared/hooks'
   ```

### Adding a Shared Utility

1. **Create in `frontend/shared/lib/`** — `utilityName.ts`
2. **Export from `frontend/shared/lib/index.ts`**
3. **Import**:
   ```typescript
   import { utility } from '@/shared/lib'
   ```

## 📋 ESLint & Code Quality

**Import rules** are enforced via ESLint (`frontend/.eslintrc.json`):

- ✅ **Required**: Import from barrels only (`@/domains/{domain}`, `@/shared/*`)
- ✅ **Required**: No circular imports between domains (`import/no-cycle` rule)
- ❌ **Blocked**: Deep imports (e.g., `@/domains/{domain}/components/File`)
- ❌ **Blocked**: Relative path imports across domains

**Run ESLint**:
```bash
cd frontend
pnpm lint  # Detects import violations
```

## 🧪 Testing

### Unit & Integration Tests

Located in `frontend/__tests__/integration/`:
```bash
cd frontend
pnpm vitest run
```

Tests can import directly from files (ESLint no-restricted-imports is disabled for `*.test.ts`/`*.spec.tsx`).

### End-to-End Tests (Playwright)

Located in `tests/`:
```bash
cd tests
pnpm test  # Runs Playwright E2E suite
```

Validates full user journeys across all routes.

## 🔗 Web3 Integration

**All blockchain interaction uses real contract addresses and ABIs** (no mocks in production):

- **Config**: `frontend/shared/lib/wagmi-config.ts` — Wagmi setup with real network
- **Contracts**: `frontend/shared/lib/contracts.ts` — Contract ABIs & addresses
- **ABIs**: `frontend/shared/lib/abis/` — Smart contract JSON ABIs
- **Hooks**: Domain-specific hooks use Wagmi's `useReadContract`, `useWriteContract`, etc.

Example:
```typescript
import { wagmiConfig, getMortgageBondConfig } from '@/shared/lib'
import { useReadContract } from 'wagmi'

export function useBondBalance(bondId: string) {
  const config = getMortgageBondConfig()
  return useReadContract({
    ...config,
    functionName: 'balanceOf',
    args: [account?.address]
  })
}
```

## 🚀 Build & Deployment

### Development
```bash
cd frontend
pnpm next dev  # Runs on http://localhost:3000
```

### Production Build
```bash
cd frontend
pnpm next build
pnpm next start
```

### Build Validation Gate
Ensures refactor maintains 100% behavior parity:
```bash
cd frontend
pnpm next build     # Typecheck + compile all routes
pnpm vitest run     # Unit/integration tests
cd ../tests
pnpm test           # Playwright E2E validation
```

## 📚 Additional Resources

- [Quickstart Guide](../specs/001-frontend-refactor-structure/quickstart.md) — Setup, gates, troubleshooting
- [Specification](../specs/001-frontend-refactor-structure/spec.md) — Feature requirements & success criteria
- [Constitution](../.specify/constitution.md) — Project principles (real blockchain, test-first, etc.)
- [Next.js Docs](https://nextjs.org/docs) — App Router, API routes, deployment
- [Wagmi Docs](https://wagmi.sh) — Web3 hooks & contract interaction

---

**Last Updated**: 2025-12-16 (Refactor complete — Phase 3: User Story 1 ✅)

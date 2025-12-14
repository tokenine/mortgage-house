# API Contracts Overview

This directory contains TypeScript interface definitions that serve as API contracts for the Admin Panel blockchain integration feature.

## Purpose

These interfaces define:
1. **Input/Output types** for the `useAdminPanel` custom hook
2. **State shapes** for component props and internal state
3. **Transaction operation signatures** for write functions
4. **Event payload structures** for contract event listeners

## Files

- `useAdminPanel.interface.ts` - Main hook interface and return type
- `types.ts` - Shared types and enums
- `events.ts` - Contract event interfaces
- `operations.ts` - Transaction operation input/output types

## Usage in Implementation

```typescript
// In useAdminPanel.ts implementation:
import { UseAdminPanelReturn, AdminPanelConfig } from "./contracts/useAdminPanel.interface"

export function useAdminPanel(config: AdminPanelConfig): UseAdminPanelReturn {
  // Implementation matches interface contract
}

// In components:
import { UseAdminPanelReturn } from "@/hooks/contracts/useAdminPanel.interface"

const adminPanel: UseAdminPanelReturn = useAdminPanel({ projectId })
```

## Contract-First Development

Following the specification's emphasis on explicit contracts, these interfaces are written **before** implementation to:
- Define clear boundaries between hook and components
- Enable parallel development (components can be built against interface while hook is implemented)
- Facilitate testing with mock implementations
- Document expected behavior and constraints

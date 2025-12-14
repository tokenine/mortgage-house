# Implementation Plan: Admin Panel Real Blockchain Integration

**Branch**: `003-admin-blockchain-integration` | **Date**: 2025-12-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-admin-blockchain-integration/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Replace mock alert-based admin panel operations with real blockchain interactions using Wagmi hooks for distributing interest, distributing principal repayment, and withdrawing principal. This involves migrating from console.log/alert patterns to useWriteContract/useReadContract patterns with proper transaction state management, allowance checking, and event-driven UI updates.

## Technical Context

**Language/Version**: TypeScript 5 (Next.js 16.0.7, React 19.2.0)  
**Primary Dependencies**: Wagmi 3.1.0, Viem 2.41.2, Sonner 1.7.4, React Hook Form 7.60.0  
**Storage**: On-chain smart contract state (MortgageContract.sol), configuration in projects.json  
**Testing**: Integration tests for Web3 wallet interactions and transaction flows  
**Target Platform**: Web (Next.js frontend connecting to EVM blockchain via RPC)  
**Project Type**: Web application (frontend/ directory with backend smart contracts)  
**Performance Goals**: Transaction confirmation within 30 seconds, UI updates within 3 seconds of on-chain events, sub-second response for contract reads  
**Constraints**: Single transaction queue per user, requires MetaMask/Web3 wallet, dependent on RPC endpoint reliability  
**Scale/Scope**: Admin panel for mortgage operators managing 2-10 active bonds, 10-100 investors per bond, 1-5 admin operations per day

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Security-First ✅ PASS
- No smart contract changes required (using existing MortgageContract.sol functions)
- Frontend validates inputs before transaction submission (positive numbers, numeric format)
- Access control enforced by checking connected wallet matches on-chain issuer address
- Allowance checking prevents unauthorized token transfers
- No new attack vectors introduced (replacing mock code with real blockchain calls)

### II. Test-First Development ✅ PASS
- Integration tests required for Web3 wallet interactions and transaction flows
- User acceptance tests will match specification scenarios (4 user stories with explicit acceptance criteria)
- Test-first approach: Write tests for allowance checking, transaction states, event listeners before implementation

### III. Transparency & Auditability ✅ PASS
- All operations call existing smart contract functions that emit events (InterestDistributed, PrincipalRepaymentDistributed, PrincipalWithdrawn)
- Transaction states (pending, confirming, success, error) displayed to user via toast notifications
- Contract state automatically refetched when events detected
- Real-time visibility into transaction confirmation status

### IV. User Story Independence ✅ PASS
- 4 independent user stories with priorities (P1, P2, P2, P3)
- Each story has explicit acceptance scenarios and can be tested independently
- P1 (Interest Distribution) deliverable as MVP
- Stories organized by distribution operations that can be developed in parallel

### V. Gas Optimization ✅ PASS
- No smart contract changes (no gas optimization needed in contracts)
- Frontend batches multiple contract reads using useReadContracts for efficiency
- Uses existing contract functions already optimized in previous epics
- Event listeners prevent unnecessary polling/refetching

### VI. Simplicity & Clarity ✅ PASS
- Clear migration from mock patterns (alert/console.log) to real blockchain interactions
- Reuses existing hooks (useTransactionWithToast) and helpers (getMortgageBondConfig, getPaymentTokenConfig)
- Follows established patterns from working pages (Dashboard, Marketplace)
- Explicit naming for all operations (distributeInterest, distributePrincipalRepayment, withdrawPrincipal)

### VII. Real Blockchain Integration ✅ PASS - PRIMARY FOCUS
- **This feature directly implements Constitution Principle VII**
- Replaces all mock alert() and console.log() with real Wagmi hooks
- All data fetched from smart contracts (useReadContract/useReadContracts)
- All state changes via useWriteContract with transaction confirmation
- ERC20 allowance checking and approval flow implemented
- Event listeners for real-time UI updates (useWatchContractEvent)
- Transaction states reflected in UI via toast notifications

**OVERALL: ✅ ALL GATES PASS - No violations, no complexity tracking needed**

---

## Post-Design Re-evaluation (Phase 1 Complete)

### Design Artifacts Generated
- ✅ `research.md`: 10 research decisions documented with rationale and alternatives
- ✅ `data-model.md`: 5 entities defined with relationships, validation, state transitions
- ✅ `contracts/`: TypeScript interfaces for hook API (5 files, ~400 LOC)
- ✅ `quickstart.md`: 7-step implementation guide with test-first approach

### Constitution Compliance Verified

#### I. Security-First ✅ MAINTAINED
- Design includes client-side validation as UX layer, contract validation as security boundary
- Access control pattern defined (read issuer from contract, compare with connected wallet)
- Error handling strategy documented for transaction reverts and wallet rejections

#### II. Test-First Development ✅ MAINTAINED
- Quickstart guide emphasizes writing tests before implementation
- Test cases defined for all user stories before code exists
- Integration test structure documented in Step 7

#### III. Transparency & Auditability ✅ MAINTAINED
- Event flow diagrams show clear audit trail (user action → transaction → event → UI update)
- All state derived from on-chain sources, no hidden frontend state
- Transaction lifecycle fully visible to users via toast notifications

#### IV. User Story Independence ✅ MAINTAINED
- Data model supports independent implementation of each operation
- Hook interface designed for gradual rollout (can implement operations one at a time)
- No hard dependencies between user stories

#### V. Gas Optimization ✅ MAINTAINED
- Batch read pattern documented in research.md and data-model.md
- Event-driven updates more efficient than polling (documented in research task 3)
- No contract changes means no new gas costs introduced

#### VI. Simplicity & Clarity ✅ MAINTAINED
- Hook encapsulates complexity, components stay thin
- TypeScript interfaces provide clear contracts
- Reuses existing patterns (useTransactionWithToast, config helpers)
- Quickstart guide uses concrete examples, avoids abstraction

#### VII. Real Blockchain Integration ✅ FULLY IMPLEMENTED IN DESIGN
- **Research.md resolves all "how to do real blockchain" questions**
- **Data-model.md defines state as on-chain entities (not mock data)**
- **Contracts/ interfaces enforce real Wagmi types (Address, Hash, bigint)**
- **Quickstart.md explicitly contrasts MOCK vs REAL patterns**
- Design eliminates all paths to mock implementations

### New Risks Identified in Design
None - all anticipated risks documented in research.md with mitigations

### Complexity Changes
No increase - design actually simplifies by:
- Centralizing all admin logic in single hook
- Reusing existing transaction state management
- Following established patterns from other pages

**POST-DESIGN VERDICT: ✅ ALL CONSTITUTION GATES STILL PASS**

Ready to proceed to implementation (Phase 2: Tasks generation via `/speckit.tasks` command).

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
contracts/
├── src/
│   └── MortgageContract.sol    # Existing contract (no changes)
└── test/
    └── MortgageContract.t.sol  # Existing tests (no changes)

frontend/
├── app/
│   └── admin/
│       └── page.tsx            # Admin page wrapper (existing)
├── components/
│   ├── admin-content.tsx       # MODIFIED: Remove mock handlers, integrate hook
│   ├── repayment-panel.tsx     # MODIFIED: Connect to real transactions
│   └── lifecycle-panel.tsx     # MODIFIED: Connect to real transactions
├── hooks/
│   ├── useAdminPanel.ts        # NEW: Admin panel blockchain operations hook
│   ├── useTransactionState.ts  # Existing (reuse)
│   └── useMortgageBond.ts      # Existing (reference for patterns)
├── lib/
│   ├── projects.ts             # Existing helpers (getMortgageBondConfig, getPaymentTokenConfig)
│   └── abis/
│       ├── MortgageBond.json   # Existing ABI
│       └── MockERC20.json      # Existing ABI
└── __tests__/
    └── integration/
        └── admin-panel.test.ts # NEW: Integration tests for admin operations
```

**Structure Decision**: Web application structure (Option 2). This feature modifies frontend components and adds a new custom hook for admin panel blockchain operations. The existing smart contracts (contracts/) are already deployed and contain the required functions (distributeInterest, distributePrincipalRepayment, withdrawPrincipal). No backend API changes needed - all state management happens on-chain.

## Complexity Tracking

> **No violations detected - this section intentionally left empty**

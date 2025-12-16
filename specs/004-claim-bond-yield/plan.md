# Implementation Plan: Claim Bond Yield Button

**Branch**: `[004-claim-bond-yield]` | **Date**: 2025-12-15 | **Spec**: [specs/004-claim-bond-yield/spec.md](specs/004-claim-bond-yield/spec.md)
**Input**: Feature specification from `/specs/004-claim-bond-yield/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add a per-card Claim button beside Sell in the bond cards on the dashboard. Each Claim triggers a real on-chain `claimRewards` for the specific project’s contract address, with pending → confirming → success/error UI feedback, and targeted portfolio refresh post-confirmation.

## Technical Context

**Language/Version**: TypeScript (Next.js 14), Solidity (Foundry)  
**Primary Dependencies**: Next.js, Wagmi v2 (`useWriteContract`, `useWaitForTransactionReceipt`, `useWatchContractEvent`), Viem, shadcn/ui  
**Storage**: N/A (on-chain state via contract reads)  
**Testing**: Playwright for frontend E2E; Foundry for contract tests  
**Target Platform**: Web (desktop/mobile)  
**Project Type**: web (frontend + contracts)  
**Performance Goals**: UI feedback within <500ms for pending state; refresh within 5s post-confirmation  
**Constraints**: No mock blockchain interactions; adhere to Security-First and Transparency principles  
**Scale/Scope**: Single feature affecting `frontend/components/bond-card.tsx` and portfolio hooks

## Constitution Check

- Security-First: No privileged ops; claim limited to investor function. Input validated and network checked.
- Test-First: Add failing E2E test in `tests/realtime-events.spec.ts` or new spec to validate claim flow; add Foundry test if contract changes are needed (not expected).
- Transparency & Auditability: Emit/observe contract events; surface pending/confirming/success/error states.
- User Story Independence: Per-card claim is independently testable and deployable.
- Gas Optimization: No additional storage writes; minimal transaction overhead.
- Simplicity & Clarity: Straightforward per-project address routing; clear button states.
- Real Blockchain Integration: Use Wagmi read/write/confirm; no console-log stand-ins.

Gate result: PASS

## Project Structure

### Documentation (this feature)

```text
specs/004-claim-bond-yield/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
frontend/
├── components/
│   ├── bond-card.tsx        # Add Claim button & logic
│   └── stats-card.tsx
├── hooks/
│   ├── usePortfolio.ts      # Ensure refetch supports per-project updates
│   └── useTransactionState.ts
├── lib/
│   └── projects.ts          # getMortgageBondConfig(projectId)
└── __tests__/integration/   # Add/extend E2E tests

contracts/
└── src/                     # No change expected for claimRewards
```

**Structure Decision**: Web application feature touching frontend components and hooks; contracts remain unchanged.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | — | — |

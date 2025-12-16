# Research: Claim Bond Yield Button

**Date**: 2025-12-15
**Feature**: specs/004-claim-bond-yield/spec.md

## Decisions

- Decision: Per-project contract address routing for `claimRewards`
- Rationale: Simpler, auditable, aligns with Principle VII and existing `getMortgageBondConfig(projectId)` usage.
- Alternatives considered: Shared router contract; backend proxy — rejected due to added complexity and reduced transparency.

- Decision: Use Wagmi `useWriteContract` + `useWaitForTransactionReceipt` and `useTransactionWithToast`
- Rationale: Matches existing hooks and Principle VII requirements for real integration and UI feedback.
- Alternatives considered: Direct Viem calls, custom provider handling — rejected to stay consistent with project patterns.

## Open Questions

- None (clarifications resolved).

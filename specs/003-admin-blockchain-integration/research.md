# Research: Admin Panel Real Blockchain Integration

**Feature**: 003-admin-blockchain-integration  
**Date**: 2025-12-14  
**Phase**: 0 - Outline & Research

## Overview

This document captures research findings for replacing mock admin panel operations with real blockchain integration using Wagmi hooks. All NEEDS CLARIFICATION items from Technical Context have been resolved through codebase analysis and existing pattern discovery.

---

## Research Tasks Completed

### 1. Wagmi Hook Patterns for Admin Operations

**Question**: How should admin panel operations (distributeInterest, distributePrincipalRepayment, withdrawPrincipal) be implemented using Wagmi hooks?

**Decision**: Use `useWriteContract` for write operations with `useWaitForTransactionReceipt` for confirmation tracking, wrapped in existing `useTransactionWithToast` helper.

**Rationale**:
- Existing codebase already uses this pattern successfully in other features
- `useTransactionWithToast` provides standardized transaction state management with toast notifications
- Pattern matches Wagmi v3 best practices for transaction lifecycle management
- Separation of concerns: `useWriteContract` handles transaction submission, `useWaitForTransactionReceipt` handles confirmation, `useTransactionWithToast` handles UI feedback

**Alternatives Considered**:
- **Deprecated `usePrepareContractWrite` + `useContractWrite`**: Wagmi v2 pattern, removed in v3
- **Manual state management**: Would duplicate logic already in `useTransactionWithToast`
- **Direct viem client calls**: More verbose, loses React state management benefits

**Code Pattern**:
```typescript
const { writeContract, data: txHash, isPending } = useWriteContract()
const txState = useTransactionWithToast(
  txHash,
  "Processing transaction...",
  "Transaction confirmed!"
)

const handleOperation = () => {
  writeContract({
    address: contractConfig.address,
    abi: contractConfig.abi,
    functionName: "distributeInterest",
    args: [amountInWei]
  })
}
```

---

### 2. ERC20 Allowance Management Pattern

**Question**: How should USDT allowance checking and approval be implemented before distribution operations?

**Decision**: Use `useReadContract` to check current allowance, conditionally trigger `approve` transaction before distribution if allowance is insufficient.

**Rationale**:
- ERC20 standard requires `approve` before `transferFrom` (which smart contract uses for distributions)
- Allowance should be checked on-demand when user attempts distribution to avoid stale data
- Two-step transaction flow: (1) approve if needed, (2) distribute after approval confirms
- Frontend must refetch allowance after approval completes to enable immediate distribution

**Alternatives Considered**:
- **Infinite approval**: Security risk, users should approve specific amounts
- **Pre-check on mount**: Allowance could change before user acts, creates race conditions
- **Batch approve+distribute**: Not supported by standard ERC20 pattern

**Code Pattern**:
```typescript
const { data: allowance } = useReadContract({
  ...paymentTokenConfig,
  functionName: "allowance",
  args: [address, mortgageBondAddress],
  query: { enabled: !!address }
})

const needsApproval = allowance < distributionAmount

// If needsApproval:
writeContract({
  ...paymentTokenConfig,
  functionName: "approve",
  args: [mortgageBondAddress, distributionAmount]
})

// After approval confirms, refetch allowance, then:
writeContract({
  ...mortgageBondConfig,
  functionName: "distributeInterest",
  args: [distributionAmount]
})
```

---

### 3. Real-time Event Listening for State Updates

**Question**: How should the admin panel automatically update when on-chain events occur?

**Decision**: Use `useWatchContractEvent` from Wagmi to listen for contract events (InterestDistributed, PrincipalRepaymentDistributed, PrincipalWithdrawn), then trigger refetch of contract state.

**Rationale**:
- Event-driven updates provide sub-3-second UI refresh without manual page reload
- More efficient than polling - only refetches when actual state changes occur
- Wagmi's `useWatchContractEvent` handles WebSocket connection management automatically
- Matches pattern used in Dashboard and Marketplace pages

**Alternatives Considered**:
- **Polling with setInterval**: Inefficient, creates unnecessary RPC requests, slower than events
- **Manual refetch on transaction success**: Misses updates from other users/sessions
- **No real-time updates**: Violates user story 4 requirements

**Code Pattern**:
```typescript
const { refetch: refetchContractState } = useReadContracts({
  contracts: [
    { ...mortgageBondConfig, functionName: "issuer" },
    { ...mortgageBondConfig, functionName: "isFundingActive" },
    // ... other reads
  ]
})

useWatchContractEvent({
  ...mortgageBondConfig,
  eventName: "InterestDistributed",
  onLogs: () => {
    refetchContractState()
  }
})

useWatchContractEvent({
  ...mortgageBondConfig,
  eventName: "PrincipalRepaymentDistributed",
  onLogs: () => {
    refetchContractState()
  }
})

// ... similar for other events
```

---

### 4. Input Validation and Amount Parsing

**Question**: How should USDT amounts be validated and converted between user input and BigInt for contract calls?

**Decision**: Use Viem's `parseUnits` with 6 decimals (USDT standard) for conversion, implement client-side validation with React Hook Form and Zod schema.

**Rationale**:
- USDT uses 6 decimals (not 18 like ETH), must be handled correctly
- Client-side validation prevents unnecessary transaction attempts
- Viem's `parseUnits` handles decimal conversion safely, avoiding floating point errors
- Zod schema provides type-safe validation matching functional requirements (FR-017)

**Alternatives Considered**:
- **Manual string multiplication**: Error-prone, reinvents wheel
- **No client-side validation**: Wastes gas on failed transactions, poor UX
- **Server-side validation only**: No server in this architecture, all validation must be client-side

**Code Pattern**:
```typescript
import { parseUnits } from "viem"

// Validation schema
const distributionSchema = z.object({
  amount: z.string()
    .min(1, "Amount required")
    .refine(val => !isNaN(Number(val)) && Number(val) > 0, "Must be positive number")
})

// Conversion for contract call
const amountInWei = parseUnits(inputValue, 6) // 6 decimals for USDT

// Display formatting (if needed)
const displayAmount = formatUnits(amountInWei, 6)
```

---

### 5. Issuer Access Control Pattern

**Question**: How should the admin panel verify that the connected wallet is authorized (matches contract issuer)?

**Decision**: Use `useReadContract` to fetch `issuer()` from contract, compare with connected wallet address, conditionally render admin controls.

**Rationale**:
- On-chain issuer address is source of truth for access control
- Frontend check provides immediate UX feedback (no need to attempt transaction to discover access denial)
- Smart contract enforces access control as final security boundary
- Follows principle of client-side validation for UX, contract validation for security

**Alternatives Considered**:
- **Hardcoded issuer address**: Inflexible, doesn't work across multiple bonds/projects
- **Attempt transaction and handle revert**: Poor UX, wastes user's time clicking "reject" in wallet
- **Backend API for authorization**: No backend in this architecture, creates unnecessary complexity

**Code Pattern**:
```typescript
const { data: issuerAddress } = useReadContract({
  ...mortgageBondConfig,
  functionName: "issuer"
})

const { address: connectedAddress } = useAccount()

const isAuthorized = issuerAddress?.toLowerCase() === connectedAddress?.toLowerCase()

if (!isAuthorized) {
  return <div>Access denied. Connect with issuer wallet.</div>
}

// Render admin controls
```

---

### 6. Transaction State Management Strategy

**Question**: What states should be tracked and displayed to users during transaction lifecycle?

**Decision**: Track 5 states: idle, pending (submitted to wallet), confirming (sent to blockchain), success (mined), error (rejected/reverted). Display via Sonner toast notifications.

**Rationale**:
- Matches transaction lifecycle stages from Wagmi hooks
- `isPending` = user submitted but wallet confirmation pending
- `isConfirming` = transaction sent to blockchain, awaiting block inclusion
- `isSuccess` = transaction mined and confirmed
- `error` = user rejected in wallet OR transaction reverted on-chain
- Toast notifications provide non-blocking feedback matching existing app patterns

**Alternatives Considered**:
- **Only success/error states**: Users left wondering during 10-30 second confirmation period
- **Modal dialogs**: Blocking UI, poor UX for background-capable operations
- **Inline status text**: Hard to notice, inconsistent with rest of app

**Code Pattern**:
```typescript
const { writeContract, data: txHash, isPending } = useWriteContract()
const { isConfirming, isSuccess, error } = useTransactionWithToast(
  txHash,
  "Submitting transaction...",  // Pending message
  "Transaction confirmed!"       // Success message
)

// Toast library automatically shows:
// - Loading toast when isPending/isConfirming
// - Success toast when isSuccess
// - Error toast when error
```

---

### 7. Contract Configuration Management

**Question**: How should contract addresses and ABIs be retrieved for multi-project support?

**Decision**: Use existing `getMortgageBondConfig(projectId)` and `getPaymentTokenConfig(projectId)` helpers that read from `projects.json`.

**Rationale**:
- Pattern already established in `usePortfolio.ts` and `useMortgageBond.ts`
- Supports multiple bonds/projects from single configuration file
- Type-safe return values with address, chainId, ABI, decimals
- Configuration validated on read (throws error if missing required fields)

**Alternatives Considered**:
- **Hardcoded addresses**: Inflexible, requires code changes for new projects
- **Environment variables**: Less flexible than JSON config, harder to manage multiple projects
- **Smart contract registry**: Over-engineering for MVP scope

**Code Pattern**:
```typescript
import { getMortgageBondConfig, getPaymentTokenConfig } from "@/lib/projects"

// In hook or component:
const mortgageBondConfig = getMortgageBondConfig(activeProjectId)
// Returns: { address: "0x...", chainId: 7117, abi: [...] }

const paymentTokenConfig = getPaymentTokenConfig(activeProjectId)
// Returns: { address: "0x...", chainId: 7117, decimals: 6, abi: [...] }
```

---

### 8. Error Handling and User-Friendly Messages

**Question**: How should transaction errors and reverts be handled and displayed to users?

**Decision**: Parse error objects from Wagmi, extract revert reasons when available, map common errors to user-friendly messages in toast notifications.

**Rationale**:
- Raw error messages from blockchain are cryptic for users
- Wagmi provides structured error objects with revert data
- Common errors should have preset friendly messages (insufficient balance, funding already closed, etc.)
- Unexpected errors should show generic message with option to view details

**Alternatives Considered**:
- **Show raw error messages**: Poor UX, confuses non-technical users
- **Generic "transaction failed" only**: Not helpful for user to diagnose issue
- **Error codes with lookup table**: Over-engineering for current scope

**Code Pattern**:
```typescript
const errorMessages: Record<string, string> = {
  "Funding already closed": "Cannot withdraw principal - funding phase has already ended",
  "Insufficient balance": "Your USDT balance is too low for this operation",
  "User rejected": "Transaction was cancelled in your wallet"
}

if (error) {
  const friendlyMessage = errorMessages[error.message] || 
    `Transaction failed: ${error.message.slice(0, 100)}`
  
  toast.error(friendlyMessage)
}
```

---

### 9. Performance Optimization: Batch Reads

**Question**: How should multiple contract state reads be optimized to reduce RPC calls?

**Decision**: Use `useReadContracts` (plural) to batch multiple read operations into single RPC call.

**Rationale**:
- Admin panel needs multiple state values (issuer, isFundingActive, allowance, total shares, etc.)
- `useReadContracts` batches requests via multicall contract (when available) or parallel requests
- Reduces latency and RPC endpoint load
- Matches functional requirement FR-020 (batch multiple contract reads)

**Alternatives Considered**:
- **Multiple `useReadContract` calls**: Creates serial or parallel requests, slower than batch
- **Manual multicall contract usage**: Wagmi handles this automatically
- **Cache-only strategy**: Needs initial fetch, batching still optimal

**Code Pattern**:
```typescript
const { data: contractState, refetch } = useReadContracts({
  contracts: [
    { ...mortgageBondConfig, functionName: "issuer" },
    { ...mortgageBondConfig, functionName: "isFundingActive" },
    { ...mortgageBondConfig, functionName: "totalShares" },
    { ...paymentTokenConfig, functionName: "allowance", args: [address, mortgageBondConfig.address] }
  ],
  query: { enabled: !!address }
})

const [issuer, isFundingActive, totalShares, allowance] = contractState?.map(r => r.result) || []
```

---

### 10. Component Cleanup and Memory Leak Prevention

**Question**: How should event listeners and subscriptions be cleaned up when component unmounts?

**Decision**: Wagmi hooks handle cleanup automatically, but custom effects should use cleanup functions to unsubscribe from watchers.

**Rationale**:
- Wagmi's `useWatchContractEvent` automatically cleans up WebSocket connections on unmount
- React useEffect cleanup functions prevent memory leaks
- Functional requirement FR-015 mandates cleanup to prevent memory leaks

**Alternatives Considered**:
- **Manual cleanup tracking**: Error-prone, easy to miss
- **No cleanup**: Causes memory leaks, violates requirements
- **Global singleton listeners**: Doesn't scale, hard to manage lifecycle

**Code Pattern**:
```typescript
// Wagmi hooks auto-cleanup (no manual action needed)
useWatchContractEvent({
  ...config,
  eventName: "InterestDistributed",
  onLogs: handleUpdate
})
// ☝️ Automatically unsubscribes on unmount

// Custom effects need cleanup:
useEffect(() => {
  const timer = setInterval(checkStatus, 5000)
  return () => clearInterval(timer) // Cleanup function
}, [])
```

---

## Summary of Technology Choices

| Technology | Purpose | Decision Rationale |
|------------|---------|-------------------|
| **Wagmi 3.1.0** | React hooks for Ethereum | Industry standard, type-safe, well-maintained |
| **Viem 2.41.2** | Ethereum utilities | Modern replacement for ethers.js, better TypeScript support |
| **Sonner** | Toast notifications | Already in project, non-blocking UI feedback |
| **useTransactionWithToast** | Transaction state wrapper | Existing project pattern, standardizes UX |
| **React Hook Form + Zod** | Input validation | Type-safe validation, already in project |
| **projects.json** | Contract configuration | Existing multi-project config system |
| **useReadContracts** | Batch state reads | Performance optimization for multiple reads |
| **useWatchContractEvent** | Real-time updates | Event-driven state sync, more efficient than polling |

---

## Integration Points with Existing Code

### Existing Hooks to Reuse
- `useTransactionState.ts` / `useTransactionWithToast` - Transaction lifecycle management
- `useMortgageBond.ts` - Reference pattern for contract reads
- `usePortfolio.ts` - Reference pattern for multi-contract reads

### Existing Utilities to Reuse
- `lib/projects.ts` - `getMortgageBondConfig()`, `getPaymentTokenConfig()`
- `lib/abis/MortgageBond.json` - Contract ABI
- `lib/abis/MockERC20.json` - ERC20 token ABI

### Components to Modify
- `admin-content.tsx` - Replace mock handlers with hook calls
- `repayment-panel.tsx` - Connect to real distribution functions
- `lifecycle-panel.tsx` - Connect to withdrawPrincipal function

### New Code to Create
- `hooks/useAdminPanel.ts` - Encapsulates all admin panel blockchain operations
- `__tests__/integration/admin-panel.test.ts` - Integration tests for admin operations

---

## Risk Mitigation

### Risk: User rejects transaction in MetaMask
**Mitigation**: Handle rejection gracefully, return UI to idle state, show user-friendly error toast

### Risk: Transaction reverts due to contract state
**Mitigation**: Client-side validation (check isFundingActive before withdraw, check allowance before distribute), clear error messages when revert occurs

### Risk: RPC connection slow or unavailable
**Mitigation**: Loading states during reads, timeout handling, user option to retry

### Risk: Event listener misses events
**Mitigation**: Events also trigger UI update on transaction success (dual-trigger pattern), users can manually refresh

### Risk: Allowance race condition
**Mitigation**: Disable distribution button while approval is pending, refetch allowance after approval confirms

---

## Next Phase

All NEEDS CLARIFICATION items resolved. Ready to proceed to **Phase 1: Design & Contracts**.

Phase 1 will produce:
- `data-model.md` - Entity relationships and state model
- `contracts/` - API contracts (TypeScript types for hook interfaces)
- `quickstart.md` - Developer guide for implementing the feature

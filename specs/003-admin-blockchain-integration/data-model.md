# Data Model: Admin Panel Real Blockchain Integration

**Feature**: 003-admin-blockchain-integration  
**Date**: 2025-12-14  
**Phase**: 1 - Design & Contracts

## Overview

This document defines the entities, state model, and data relationships for the admin panel blockchain integration. Since this feature operates primarily with on-chain state through smart contracts, the "data model" describes contract state entities, frontend state management, and transaction lifecycle entities.

---

## Entity Definitions

### 1. AdminPanelState

**Description**: Frontend state encapsulating all admin panel data and operations.

**Source**: Combination of on-chain contract reads and derived frontend state.

**Fields**:

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `issuerAddress` | `Address` | Contract read: `issuer()` | Address authorized to perform admin operations |
| `isAuthorized` | `boolean` | Derived | Whether connected wallet matches issuer |
| `isFundingActive` | `boolean` | Contract read: `isFundingActive()` | Whether funding phase is open |
| `totalShares` | `bigint` | Contract read: `totalShares()` | Total investment shares issued |
| `usdtAllowance` | `bigint` | Token read: `allowance(issuer, contract)` | Current USDT approval amount |
| `activeProjectId` | `string` | Frontend state | Currently selected bond/project ID |

**Relationships**:
- Related to `TransactionState` (multiple admin operations can be pending)
- Related to `ContractConfig` (provides addresses and ABIs for reads/writes)

**Validation Rules**:
- `issuerAddress` must be valid Ethereum address (0x-prefixed, 40 hex chars)
- `isAuthorized` derived as `issuerAddress.toLowerCase() === connectedAddress.toLowerCase()`
- `isFundingActive` boolean from contract (no frontend validation needed)
- `totalShares` and `usdtAllowance` must be non-negative bigints

**State Transitions**:
- Initial: All fields undefined/null until first contract read completes
- Connected: Fields populated from contract reads when wallet connects and project selected
- Disconnected: Fields cleared when wallet disconnects
- Updated: Fields refetch when contract events detected (InterestDistributed, etc.)

---

### 2. TransactionState

**Description**: Lifecycle state for each admin transaction (approve, distributeInterest, distributePrincipalRepayment, withdrawPrincipal).

**Source**: Wagmi hooks (`useWriteContract`, `useWaitForTransactionReceipt`).

**Fields**:

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `txHash` | `Hash \| undefined` | `useWriteContract().data` | Transaction hash after submission |
| `isPending` | `boolean` | `useWriteContract().isPending` | Transaction submitted to wallet, awaiting user confirmation |
| `isConfirming` | `boolean` | `useWaitForTransactionReceipt().isLoading` | Transaction sent to blockchain, awaiting block inclusion |
| `isSuccess` | `boolean` | `useWaitForTransactionReceipt().isSuccess` | Transaction mined and confirmed |
| `error` | `Error \| null` | `useWriteContract().error` or receipt error | Error from wallet rejection or transaction revert |

**Relationships**:
- Each admin operation (approve, distribute, withdraw) has its own `TransactionState` instance
- Related to `ToastNotification` (state changes trigger toast updates)

**Validation Rules**:
- Only one state flag (isPending, isConfirming, isSuccess) should be true at a time
- `error` is mutually exclusive with `isSuccess`
- `txHash` required for isConfirming/isSuccess states

**State Transitions**:
```
idle (no txHash)
  ↓ user clicks button
isPending (txHash defined, awaiting wallet confirmation)
  ↓ user confirms in MetaMask
isConfirming (transaction sent to blockchain)
  ↓ transaction mined
isSuccess (confirmed) OR error (reverted)
  ↓ after UI feedback
idle (reset for next operation)
```

---

### 3. DistributionOperation

**Description**: User input and validation state for interest/principal distribution operations.

**Source**: Frontend form state (React Hook Form).

**Fields**:

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `amount` | `string` | Required, numeric, positive | User input amount (in USDT display units) |
| `amountInWei` | `bigint` | Derived: `parseUnits(amount, 6)` | Amount converted to token base units |
| `needsApproval` | `boolean` | Derived: `amountInWei > usdtAllowance` | Whether approval transaction required before distribution |
| `operationType` | `"interest" \| "principal"` | Required | Type of distribution operation |

**Relationships**:
- Related to `AdminPanelState` (reads `usdtAllowance` for approval check)
- Related to `TransactionState` (submitting distribution creates transaction)

**Validation Rules**:
- `amount` must be non-empty string
- `amount` must parse to valid number greater than 0
- `amountInWei` must fit in uint256 (max ~1.15e77)
- `needsApproval` recalculated whenever `amount` or `usdtAllowance` changes

**State Transitions**:
- Empty: Initial state, form fields blank
- Entered: User typed amount, validation runs
- Valid: Amount passes validation, submit button enabled
- Submitting: Transaction initiated, form disabled
- Completed: Transaction confirmed, form reset to Empty

---

### 4. ContractConfig

**Description**: Configuration for interacting with specific smart contract.

**Source**: `projects.json` configuration file, accessed via helper functions.

**Fields**:

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `address` | `Address` | `getMortgageBondConfig(id).address` | Contract deployment address |
| `chainId` | `number` | `getMortgageBondConfig(id).chainId` | Network chain ID (e.g., 7117) |
| `abi` | `Abi` | `getMortgageBondConfig(id).abi` | Contract ABI from JSON import |
| `decimals` | `number` | `getPaymentTokenConfig(id).decimals` | Token decimals (6 for USDT) |

**Relationships**:
- Used by all `useReadContract` and `useWriteContract` calls
- One config per project/bond (selected via `activeProjectId`)

**Validation Rules**:
- `address` must be valid Ethereum address
- `chainId` must match network user is connected to
- `abi` must be valid JSON ABI array
- Helper functions throw error if config incomplete

**Immutability**:
- Configuration is static per project, loaded from JSON at build time
- No runtime modification of config values

---

### 5. EventLog

**Description**: On-chain event data triggering UI updates.

**Source**: `useWatchContractEvent` listeners.

**Fields**:

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `eventName` | `string` | Event signature | Name of emitted event |
| `args` | `object` | Event parameters | Decoded event arguments |
| `blockNumber` | `bigint` | Block metadata | Block where event was emitted |
| `transactionHash` | `Hash` | Transaction metadata | Transaction that emitted event |

**Relationships**:
- Triggers refetch of `AdminPanelState` contract reads
- Confirms completion of `TransactionState` operations

**Event Types Monitored**:
- `InterestDistributed(uint256 totalAmount, uint256 timestamp)`
- `PrincipalRepaymentDistributed(uint256 totalAmount, uint256 timestamp)`
- `PrincipalWithdrawn(address issuer, uint256 amount, uint256 timestamp)`

**Handling Pattern**:
```typescript
useWatchContractEvent({
  ...contractConfig,
  eventName: "InterestDistributed",
  onLogs: (logs) => {
    // Logs contain: args, blockNumber, transactionHash
    refetchContractState() // Trigger state update
  }
})
```

---

## Data Flow Diagrams

### Read Flow: Loading Admin Panel State

```
User connects wallet
  ↓
Frontend reads activeProjectId
  ↓
getMortgageBondConfig(projectId) → ContractConfig
  ↓
useReadContracts({
  issuer(),
  isFundingActive(),
  totalShares()
}) → BatchRead RPC call
  ↓
useReadContract(allowance(issuer, contract)) → Token RPC call
  ↓
Combine results → AdminPanelState
  ↓
Render UI with contract data
```

### Write Flow: Distribute Interest (No Approval Needed)

```
User enters amount
  ↓
Frontend validates input → DistributionOperation
  ↓
Check: amountInWei <= usdtAllowance?
  ↓ YES (no approval needed)
User clicks "Distribute Interest"
  ↓
writeContract({
  functionName: "distributeInterest",
  args: [amountInWei]
}) → TransactionState (isPending)
  ↓
User confirms in MetaMask
  ↓
Transaction sent → TransactionState (isConfirming)
  ↓
Transaction mined → TransactionState (isSuccess)
  ↓
Event: InterestDistributed emitted
  ↓
useWatchContractEvent detects event
  ↓
refetchContractState() → Updated AdminPanelState
  ↓
Toast: "Interest distributed!"
```

### Write Flow: Distribute Interest (Approval Required)

```
User enters amount
  ↓
Frontend validates input → DistributionOperation
  ↓
Check: amountInWei > usdtAllowance?
  ↓ YES (approval needed)
User clicks "Distribute Interest"
  ↓
writeContract({
  functionName: "approve",
  args: [mortgageBondAddress, amountInWei]
}) → TransactionState (isPending)
  ↓
User confirms approval in MetaMask
  ↓
Approval transaction mined → TransactionState (isSuccess)
  ↓
refetch allowance → Updated AdminPanelState.usdtAllowance
  ↓
Check: amountInWei <= NEW usdtAllowance?
  ↓ YES (now approved)
writeContract({
  functionName: "distributeInterest",
  args: [amountInWei]
}) → New TransactionState (isPending)
  ↓
[... rest same as no-approval flow]
```

### Write Flow: Withdraw Principal

```
User clicks "Withdraw Principal & Close Funding"
  ↓
Frontend checks: isFundingActive == true?
  ↓ YES (funding still open)
writeContract({
  functionName: "withdrawPrincipal"
}) → TransactionState (isPending)
  ↓
User confirms in MetaMask
  ↓
Transaction mined → TransactionState (isSuccess)
  ↓
Event: PrincipalWithdrawn emitted
  ↓
useWatchContractEvent detects event
  ↓
refetchContractState() → isFundingActive = false
  ↓
UI: Button now disabled (funding closed)
  ↓
Toast: "Principal withdrawn and funding closed!"
```

---

## State Management Architecture

### Hook Responsibility: useAdminPanel

**Purpose**: Encapsulate all admin panel blockchain operations in single custom hook.

**Exposes**:
```typescript
{
  // Read state
  issuerAddress: Address | undefined
  isAuthorized: boolean
  isFundingActive: boolean
  totalShares: bigint
  usdtAllowance: bigint
  isLoading: boolean
  
  // Write operations
  approveUSDT: (amount: bigint) => void
  distributeInterest: (amount: bigint) => void
  distributePrincipalRepayment: (amount: bigint) => void
  withdrawPrincipal: () => void
  
  // Transaction states
  approvalState: TransactionState
  interestState: TransactionState
  principalRepaymentState: TransactionState
  withdrawState: TransactionState
  
  // Refetch trigger
  refetch: () => void
}
```

**Internal Implementation**:
- Uses `useReadContracts` for batched state reads
- Uses `useReadContract` for USDT allowance
- Uses `useWriteContract` for each write operation
- Uses `useTransactionWithToast` for each transaction state
- Uses `useWatchContractEvent` for real-time event updates
- Manages all state coordination internally

**Benefits**:
- Components stay thin, just call hook methods
- All blockchain logic centralized and testable
- Consistent transaction state management
- Easy to mock for testing

---

## Error States and Edge Cases

### Error State: Unauthorized Access

**Condition**: `connectedAddress !== issuerAddress`

**Data State**:
```typescript
{
  issuerAddress: "0xABC...",
  isAuthorized: false,
  // Other fields loaded but operations disabled
}
```

**UI Behavior**: Show "Access denied" message, hide operation buttons

---

### Error State: Network Mismatch

**Condition**: User connected to wrong network (chainId doesn't match config)

**Data State**:
```typescript
{
  // Contract reads will fail
  error: "Chain mismatch: expected 7117, connected to 1"
}
```

**UI Behavior**: Show "Switch to correct network" prompt

---

### Error State: Insufficient Allowance (Automatic Approval)

**Condition**: `amountInWei > usdtAllowance`

**Data State**:
```typescript
{
  amount: "1000",
  amountInWei: 1000000000n,
  usdtAllowance: 500000000n,
  needsApproval: true
}
```

**UI Behavior**: Show "Approve USDT" step before "Distribute" step, guide user through two-transaction flow

---

### Error State: Funding Already Closed

**Condition**: `isFundingActive === false` when attempting withdrawPrincipal

**Data State**:
```typescript
{
  isFundingActive: false
}
```

**UI Behavior**: Disable "Withdraw Principal" button, show tooltip "Funding already closed"

---

### Error State: Transaction Rejected

**Condition**: User clicks "Reject" in MetaMask

**Data State**:
```typescript
{
  txHash: undefined,
  isPending: false,
  error: Error("User rejected transaction")
}
```

**UI Behavior**: Toast error "Transaction cancelled", return UI to idle state

---

### Error State: Transaction Reverted

**Condition**: Contract revert (e.g., insufficient balance, access control)

**Data State**:
```typescript
{
  txHash: "0xDEF...",
  isSuccess: false,
  error: Error("Execution reverted: Insufficient USDT balance")
}
```

**UI Behavior**: Toast error with user-friendly message parsed from revert reason

---

## Persistence and Caching

### On-Chain Persistence
- All critical state (issuer, funding status, shares, distributions) stored in smart contract
- Permanent, immutable record on blockchain
- No frontend persistence needed for financial data

### Frontend Cache (React Query via Wagmi)
- Contract reads cached for short duration (default: staleTime)
- Automatic refetch on window focus, network reconnect
- Manual refetch triggered by events or user action
- Cache invalidated when wallet changes or project switches

### No Local Storage
- No admin panel state persisted to localStorage
- All state derived fresh from blockchain on mount
- Ensures UI always reflects true on-chain state

---

## Data Validation Summary

| Entity | Client-Side Validation | Contract Validation |
|--------|----------------------|-------------------|
| **DistributionOperation** | Amount > 0, numeric format | Access control (onlyIssuer), sufficient balance, contract state |
| **AdminPanelState** | Address format, authorization check | Issuer address immutable, funding state transitions enforced |
| **TransactionState** | None (state machine managed by Wagmi) | All state changes validated by EVM |
| **ContractConfig** | Complete config required (throws if missing) | N/A (config is input to contract calls) |

**Defense in Depth**:
- Client-side validation provides immediate UX feedback
- Contract validation is ultimate security boundary
- Impossible to bypass contract rules via frontend manipulation

---

## Next Steps

Phase 1 design complete. Proceed to:
1. Generate `contracts/` directory with TypeScript interface definitions
2. Generate `quickstart.md` developer guide
3. Update agent context with new patterns
4. Re-evaluate Constitution Check

# Quickstart: Admin Panel Real Blockchain Integration

**Feature**: 003-admin-blockchain-integration  
**Audience**: Developers implementing this feature  
**Time to Implement**: ~4-6 hours (P1 only), ~8-10 hours (all user stories)

## Overview

This guide walks through implementing real blockchain integration for the admin panel by:
1. Creating `useAdminPanel` custom hook for blockchain operations
2. Replacing mock handlers in components with real hook calls
3. Adding integration tests for transaction flows
4. Verifying constitution compliance

---

## Prerequisites

- ✅ Smart contracts deployed with `distributeInterest`, `distributePrincipalRepayment`, `withdrawPrincipal` functions
- ✅ Contract addresses configured in `frontend/data/projects.json`
- ✅ Wagmi 3.1.0+ and Viem 2.41.2+ installed
- ✅ MetaMask or Web3 wallet installed for testing
- ✅ Test USDT tokens in issuer wallet

---

## Implementation Steps

### Step 1: Create useAdminPanel Hook (90 min)

**File**: `frontend/hooks/useAdminPanel.ts`

**What to build**:
- Import Wagmi hooks: `useReadContracts`, `useReadContract`, `useWriteContract`, `useWaitForTransactionReceipt`, `useWatchContractEvent`
- Import helpers: `getMortgageBondConfig`, `getPaymentTokenConfig`
- Import existing: `useTransactionWithToast` from `./useTransactionState`

**Pattern to follow**:
```typescript
import { useReadContracts, useWriteContract, useWatchContractEvent } from "wagmi"
import { parseUnits } from "viem"
import { getMortgageBondConfig, getPaymentTokenConfig } from "@/lib/projects"
import { useTransactionWithToast } from "./useTransactionState"

export function useAdminPanel(projectId: string) {
  // 1. Get contract configs
  const mortgageBondConfig = getMortgageBondConfig(projectId)
  const paymentTokenConfig = getPaymentTokenConfig(projectId)
  
  // 2. Batch read contract state
  const { data: contractState, refetch } = useReadContracts({
    contracts: [
      { ...mortgageBondConfig, functionName: "issuer" },
      { ...mortgageBondConfig, functionName: "isFundingActive" },
      { ...mortgageBondConfig, functionName: "totalShares" },
    ]
  })
  
  // 3. Read USDT allowance
  const { data: allowance } = useReadContract({
    ...paymentTokenConfig,
    functionName: "allowance",
    args: [address, mortgageBondConfig.address]
  })
  
  // 4. Write operations
  const { writeContract: writeApprove, data: approveTx } = useWriteContract()
  const approveState = useTransactionWithToast(approveTx, "Approving USDT...", "USDT approved!")
  
  const { writeContract: writeDistributeInt, data: intTx } = useWriteContract()
  const intState = useTransactionWithToast(intTx, "Distributing interest...", "Interest distributed!")
  
  // 5. Event listeners
  useWatchContractEvent({
    ...mortgageBondConfig,
    eventName: "InterestDistributed",
    onLogs: () => refetch()
  })
  
  // 6. Return interface matching contracts/useAdminPanel.interface.ts
  return {
    state: {
      issuerAddress: contractState?.[0].result,
      isFundingActive: contractState?.[1].result,
      totalShares: contractState?.[2].result,
      usdtAllowance: allowance,
      // ... derived state
    },
    operations: {
      approve: {
        execute: (amount: bigint) => writeApprove({
          ...paymentTokenConfig,
          functionName: "approve",
          args: [mortgageBondConfig.address, amount]
        }),
        state: approveState,
        // ... other operation fields
      },
      // ... other operations
    },
    refetch,
    // ... other return fields
  }
}
```

**Test-first approach**:
```typescript
// __tests__/integration/useAdminPanel.test.ts
describe("useAdminPanel", () => {
  it("should fetch contract state when connected", async () => {
    const { result } = renderHook(() => useAdminPanel("test-project"))
    await waitFor(() => expect(result.current.state.issuerAddress).toBeDefined())
  })
  
  it("should detect unauthorized access", async () => {
    // Connect with non-issuer wallet
    const { result } = renderHook(() => useAdminPanel("test-project"))
    await waitFor(() => expect(result.current.state.isAuthorized).toBe(false))
  })
})
```

**Success criteria**:
- ✅ Hook compiles with no TypeScript errors
- ✅ Hook returns interface matching `contracts/useAdminPanel.interface.ts`
- ✅ Tests pass (write failing tests first!)

---

### Step 2: Integrate Hook into Admin Components (60 min)

**Files to modify**:
- `frontend/components/admin-content.tsx`
- `frontend/components/repayment-panel.tsx`
- `frontend/components/lifecycle-panel.tsx`

**Before (MOCK - DO NOT USE)**:
```tsx
// admin-content.tsx
const handleDistributeInterest = () => {
  console.log("Distributing interest")
  alert("Interest distributed!") // ❌ FAKE
}
```

**After (REAL - USE THIS)**:
```tsx
// admin-content.tsx
"use client"

import { useAdminPanel } from "@/hooks/useAdminPanel"

export function AdminContent() {
  const [selectedBond, setSelectedBond] = useState<string>("")
  const adminPanel = useAdminPanel(selectedBond)
  
  // Authorization check
  if (!adminPanel.state.isAuthorized) {
    return <AccessDenied issuer={adminPanel.state.issuerAddress} />
  }
  
  return (
    <div>
      <RepaymentPanel
        operations={adminPanel.operations}
        state={adminPanel.state}
      />
      <LifecyclePanel
        operations={adminPanel.operations}
        state={adminPanel.state}
      />
    </div>
  )
}
```

```tsx
// repayment-panel.tsx
interface RepaymentPanelProps {
  operations: AdminOperations
  state: AdminPanelReadState
}

export function RepaymentPanel({ operations, state }: RepaymentPanelProps) {
  const [amount, setAmount] = useState("")
  
  const handleDistribute = () => {
    const validation = operations.distributeInterest.validate({
      amount,
      type: DistributionType.Interest
    })
    
    if (!validation.isValid) {
      toast.error(validation.error)
      return
    }
    
    // Hook handles approval automatically if needed
    operations.distributeInterest.execute(validation.amountInWei!)
  }
  
  return (
    <Card>
      <Input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Enter amount"
      />
      <Button
        onClick={handleDistribute}
        disabled={!operations.distributeInterest.canExecute || operations.distributeInterest.isProcessing}
      >
        {operations.distributeInterest.isProcessing ? "Processing..." : "Distribute Interest"}
      </Button>
    </Card>
  )
}
```

**Remove these completely**:
- ❌ `console.log()` statements for user feedback
- ❌ `alert()` calls
- ❌ Mock state like `outstanding: project.loanAmount` (use real contract state)

**Success criteria**:
- ✅ No `alert()` or `console.log()` in components for user feedback
- ✅ All data comes from `adminPanel.state` (no hardcoded values)
- ✅ All operations call `adminPanel.operations.*` (no mock handlers)
- ✅ Loading states shown during transactions

---

### Step 3: Add Allowance Approval Flow (45 min)

**Where**: Inside `useAdminPanel` hook

**Pattern**:
```typescript
const distributeInterest = useCallback((amount: bigint) => {
  // Check if approval needed
  if (amount > (allowance || 0n)) {
    // Step 1: Approve
    writeApprove({
      ...paymentTokenConfig,
      functionName: "approve",
      args: [mortgageBondConfig.address, amount]
    })
    
    // Wait for approval to complete, then Step 2: Distribute
    // This is handled by watching approveState.isSuccess
  } else {
    // Approval sufficient, go straight to distribute
    writeDistributeInt({
      ...mortgageBondConfig,
      functionName: "distributeInterest",
      args: [amount]
    })
  }
}, [allowance, writeApprove, writeDistributeInt])

// Watch for approval success to trigger distribution
useEffect(() => {
  if (approveState.isSuccess && pendingDistributionAmount) {
    // Refetch allowance
    refetchAllowance()
    
    // Now execute distribution
    writeDistributeInt({
      ...mortgageBondConfig,
      functionName: "distributeInterest",
      args: [pendingDistributionAmount]
    })
    
    setPendingDistributionAmount(null)
  }
}, [approveState.isSuccess])
```

**User experience**:
1. User enters 1000 USDT, current allowance is 500 USDT
2. User clicks "Distribute Interest"
3. Toast: "Approving USDT..."
4. MetaMask popup: Approve 1000 USDT
5. User confirms
6. Toast: "USDT approved!"
7. Automatically: Second transaction submitted
8. Toast: "Distributing interest..."
9. MetaMask popup: Distribute interest
10. User confirms
11. Toast: "Interest distributed!"

**Success criteria**:
- ✅ Two-step flow works seamlessly (approval → distribution)
- ✅ If allowance sufficient, skips approval step
- ✅ Clear toast messages at each step

---

### Step 4: Add Event Listeners (30 min)

**Where**: Inside `useAdminPanel` hook

**Pattern**:
```typescript
// Listen to all admin events
useWatchContractEvent({
  ...mortgageBondConfig,
  eventName: "InterestDistributed",
  onLogs: (logs) => {
    console.info("InterestDistributed event detected:", logs)
    refetch() // Refetch contract state
  }
})

useWatchContractEvent({
  ...mortgageBondConfig,
  eventName: "PrincipalRepaymentDistributed",
  onLogs: () => refetch()
})

useWatchContractEvent({
  ...mortgageBondConfig,
  eventName: "PrincipalWithdrawn",
  onLogs: () => refetch()
})

// Cleanup handled automatically by Wagmi
```

**Test**:
1. Open admin panel in browser
2. Execute interest distribution from another tab/session
3. Verify admin panel updates automatically within 3 seconds
4. Check browser console for event detection logs

**Success criteria**:
- ✅ UI updates automatically when events detected
- ✅ No manual page refresh needed
- ✅ No memory leaks (check with browser dev tools after 10+ navigations)

---

### Step 5: Add Input Validation (30 min)

**Where**: Inside `useAdminPanel` operations

**Pattern**:
```typescript
const validateDistribution = (input: DistributionInput): DistributionValidation => {
  // Check non-empty
  if (!input.amount || input.amount.trim() === "") {
    return { isValid: false, error: "Amount is required" }
  }
  
  // Check numeric
  const numValue = Number(input.amount)
  if (isNaN(numValue)) {
    return { isValid: false, error: "Amount must be a valid number" }
  }
  
  // Check positive
  if (numValue <= 0) {
    return { isValid: false, error: "Amount must be greater than zero" }
  }
  
  // Convert to wei
  const amountInWei = parseUnits(input.amount, paymentTokenConfig.decimals)
  
  // Check approval needed
  const needsApproval = amountInWei > (allowance || 0n)
  
  return {
    isValid: true,
    amountInWei,
    needsApproval
  }
}

// Expose in operations
distributeInterest: {
  validate: validateDistribution,
  // ... other fields
}
```

**UI usage**:
```tsx
const handleSubmit = () => {
  const validation = operations.distributeInterest.validate({ amount, type })
  
  if (!validation.isValid) {
    toast.error(validation.error)
    return
  }
  
  if (validation.needsApproval) {
    toast.info("Approval required first")
  }
  
  operations.distributeInterest.execute(validation.amountInWei!)
}
```

**Success criteria**:
- ✅ Empty input shows error
- ✅ Non-numeric input shows error
- ✅ Negative/zero shows error
- ✅ Valid input passes through

---

### Step 6: Add Access Control Check (20 min)

**Where**: Inside `useAdminPanel` hook and component

**Pattern**:
```typescript
// In hook
const { address: connectedAddress } = useAccount()
const issuerAddress = contractState?.[0].result // from issuer() read

const isAuthorized = useMemo(() => {
  if (!connectedAddress || !issuerAddress) return false
  return connectedAddress.toLowerCase() === issuerAddress.toLowerCase()
}, [connectedAddress, issuerAddress])

// Return in state
state: {
  issuerAddress,
  isAuthorized,
  // ...
}
```

```tsx
// In component
if (!adminPanel.state.isAuthorized) {
  return (
    <Card>
      <AlertCircle />
      <div>
        <h3>Access Denied</h3>
        <p>Connected wallet does not match issuer address.</p>
        <p>Expected: {adminPanel.state.issuerAddress}</p>
        <p>Connected: {connectedAddress}</p>
      </div>
    </Card>
  )
}

// Only show admin controls if authorized
return <AdminControls />
```

**Test**:
1. Connect with issuer wallet → controls visible
2. Disconnect and connect with different wallet → access denied message
3. Switch back to issuer wallet → controls visible again

**Success criteria**:
- ✅ Non-issuer wallets see access denied message
- ✅ Issuer wallet sees admin controls
- ✅ Message updates immediately when wallet changes

---

### Step 7: Integration Testing (60 min)

**File**: `frontend/__tests__/integration/admin-panel.test.ts`

**Test cases** (write these BEFORE implementing):

```typescript
describe("Admin Panel Integration", () => {
  describe("Interest Distribution", () => {
    it("should distribute interest without approval if allowance sufficient", async () => {
      // Setup: Issuer wallet with 1000 USDT allowance
      // Action: Distribute 500 USDT interest
      // Assert: Single transaction, InterestDistributed event, toast success
    })
    
    it("should require approval before distribution if allowance insufficient", async () => {
      // Setup: Issuer wallet with 100 USDT allowance
      // Action: Distribute 500 USDT interest
      // Assert: Two transactions (approve then distribute), toast for each
    })
    
    it("should show error toast when user rejects transaction", async () => {
      // Setup: Mock MetaMask rejection
      // Action: Attempt distribution
      // Assert: Error toast shown, UI returns to idle state
    })
  })
  
  describe("Access Control", () => {
    it("should deny access to non-issuer wallet", async () => {
      // Setup: Connect with random wallet
      // Assert: Access denied message shown, operations disabled
    })
  })
  
  describe("Real-time Updates", () => {
    it("should update UI when InterestDistributed event detected", async () => {
      // Setup: Admin panel open
      // Action: Trigger distribution from another session
      // Assert: UI updates within 3 seconds
    })
  })
})
```

**Run tests**:
```bash
cd frontend
npm test -- admin-panel.test.ts
```

**Success criteria**:
- ✅ All test cases pass
- ✅ Tests use real contract calls (not mocks)
- ✅ Coverage for happy path and error scenarios

---

## Verification Checklist

Before marking feature complete, verify:

### Functional Requirements (from spec.md)
- [ ] FR-001: All contract state fetched via useReadContract/useReadContracts ✓
- [ ] FR-002: distributeInterest executed via useWriteContract with confirmation ✓
- [ ] FR-003: distributePrincipalRepayment executed with confirmation ✓
- [ ] FR-004: withdrawPrincipal executed with confirmation ✓
- [ ] FR-005: USDT allowance checked, approve triggered if needed ✓
- [ ] FR-006: Transaction states displayed via toast notifications ✓
- [ ] FR-007: Duplicate submissions prevented while pending ✓
- [ ] FR-008: Connected wallet verified against contract issuer ✓
- [ ] FR-009: Events listened, data refetched on detection ✓
- [ ] FR-010: getMortgageBondConfig used for contract address/ABI ✓
- [ ] FR-011: getPaymentTokenConfig used for USDT token ✓
- [ ] FR-012: parseUnits used with 6 decimals for USDT ✓
- [ ] FR-013: Loading indicators shown during confirmation ✓
- [ ] FR-014: Withdraw principal disabled when funding closed ✓
- [ ] FR-015: Event listeners cleaned up on unmount ✓
- [ ] FR-016: NO alert(), console.log(), or mock success messages ✓
- [ ] FR-017: Client-side input validation (positive, numeric) ✓
- [ ] FR-018: Transaction errors parsed, user-friendly messages shown ✓
- [ ] FR-019: Allowance refetched after approval completes ✓
- [ ] FR-020: Multiple reads batched with useReadContracts ✓

### Success Criteria (from spec.md)
- [ ] SC-001: Distribution completes in <30 seconds (excluding user time) ✓
- [ ] SC-002: Allowance handled correctly 100% of attempts ✓
- [ ] SC-003: All transaction states communicated within 1 second ✓
- [ ] SC-004: Contract state updates within 3 seconds of event ✓
- [ ] SC-005: Zero mock alerts/console.logs for user feedback ✓
- [ ] SC-006: Access denied to non-issuers 100% of time ✓
- [ ] SC-007: Rejections handled gracefully 100% of cases ✓
- [ ] SC-008: Gas estimation succeeds for all operations ✓
- [ ] SC-009: Event listeners cleaned up (no memory leaks) ✓
- [ ] SC-010: All interactions use real Wagmi hooks ✓

### Constitution Compliance
- [ ] No smart contract changes (Principle I: Security) ✓
- [ ] Tests written first (Principle II: Test-First) ✓
- [ ] All operations emit events (Principle III: Transparency) ✓
- [ ] User stories independent and prioritized (Principle IV) ✓
- [ ] Batch reads for efficiency (Principle V: Gas Optimization) ✓
- [ ] Clear naming, reuses existing patterns (Principle VI: Simplicity) ✓
- [ ] **Zero mock implementations (Principle VII: Real Blockchain)** ✓

---

## Troubleshooting

### Issue: "Contract read fails with undefined"
**Solution**: Check that `projectId` is valid and contract address exists in `projects.json`

### Issue: "Approval transaction not triggering distribution"
**Solution**: Ensure you refetch allowance after approval confirms, then check `allowance >= amount` before distributing

### Issue: "Events not detected"
**Solution**: Verify RPC endpoint supports WebSocket connections, check browser console for connection errors

### Issue: "TypeScript errors on hook return type"
**Solution**: Ensure return object matches `UseAdminPanelReturn` interface from `contracts/useAdminPanel.interface.ts`

---

## Next Steps After Implementation

1. **Manual Testing**: Connect with MetaMask, execute all operations on testnet
2. **Code Review**: Verify constitution compliance, check for mock patterns
3. **Documentation**: Update README with new admin panel capabilities
4. **Deploy**: Merge to main branch after all checks pass

## Time Estimates by User Story

| Story | Priority | Estimated Time | Steps Covered |
|-------|----------|---------------|---------------|
| Interest Distribution | P1 | 3-4 hours | Steps 1-6 |
| Principal Repayment | P2 | 1 hour | Reuse patterns from P1 |
| Principal Withdrawal | P2 | 1 hour | Simpler (no approval needed) |
| Real-time Sync | P3 | 30 min | Step 4 |
| **Total** | | **5.5-6.5 hours** | + 1.5 hours testing |

---

**Happy building! 🚀**

Remember: Write tests first, implement to pass tests, refactor for clarity. The constitution is your guide.

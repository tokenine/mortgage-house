# Real Blockchain Integration Requirements

## Overview
This document outlines how to implement **REAL** blockchain-connected functionality across all pages in the Mortgage House application, based on the patterns used in working pages (Dashboard, Marketplace).

---

## ✅ REAL vs ❌ MOCK Comparison

### ❌ MOCK Pattern (Current Admin Page - DO NOT USE)
```tsx
// admin-content.tsx - FAKE
const handleDistributeInterest = () => {
  console.log(`Distributing interest for ${selectedBond}`)
  alert("Interest distributed to all bondholders!") // ❌ Just shows alert
}
```

### ✅ REAL Pattern (Target - USE THIS)
```tsx
// AdminPanel.tsx - REAL
const { writeContract: writeDistributeInt, data: intTx, isPending: isIntPending } = useWriteContract()
const intState = useTransactionWithToast(intTx, "Distributing interest...", "Interest distributed!")

const handleDistribute = () => {
  writeDistributeInt({
    ...CONTRACTS.mortgageBond,
    functionName: "distributeInterest",
    args: [valueRaw]
  })
}
```

---

## 📋 Core Architecture Patterns

### 1. Custom Hooks for Data Fetching (READ operations)

#### Pattern: Use Wagmi's `useReadContract` / `useReadContracts`

**Example: Portfolio Hook**
```tsx
// hooks/usePortfolio.ts
import { useReadContracts } from "wagmi"
import { getMortgageBondConfig } from "@/lib/projects"

const contracts = useMemo(() => {
  if (!address || allProjects.length === 0) return []
  
  return allProjects.flatMap((project) => {
    const config = getMortgageBondConfig(project.id)
    return [
      {
        address: config.address,
        abi: config.abi,
        functionName: "investors",
        args: [address],
      },
      {
        address: config.address,
        abi: config.abi,
        functionName: "getPendingRewards",
        args: [address],
      },
    ]
  })
}, [address, allProjects])

const { data: contractData, isLoading, refetch } = useReadContracts({
  contracts: contracts as any,
  query: { enabled: !!address && contracts.length > 0 },
})
```

**Key Points:**
- ✅ Use `useReadContracts` for batch reads (more efficient)
- ✅ Use `useMemo` to prevent unnecessary re-renders
- ✅ Handle loading states properly
- ✅ Provide `refetch` function for manual updates

---

### 2. Transaction Handling (WRITE operations)

#### Pattern: Use Wagmi's `useWriteContract` + Custom Toast Hook

**Example: Investment Form**
```tsx
// components/investment-form.tsx
import { useWriteContract } from "wagmi"
import { useTransactionWithToast } from "@/hooks/useTransactionState"

const { writeContract: writeApprove, data: approveTxHash, isPending: isApproving } = useWriteContract()
const { writeContract: writeInvest, data: investTxHash, isPending: isInvesting } = useWriteContract()

const approveState = useTransactionWithToast(
  approveTxHash,
  "Approving token transfer...",
  "Token approved successfully!"
)

const investState = useTransactionWithToast(
  investTxHash,
  "Processing investment...",
  "Investment successful!"
)

const handleInvest = () => {
  writeInvest({
    address: mortgageBondConfig.address,
    abi: mortgageBondConfig.abi,
    functionName: "invest",
    args: [investAmount],
  })
}
```

**Key Points:**
- ✅ Use `useWriteContract` for each write operation
- ✅ Use `useTransactionWithToast` to track transaction state & show toasts
- ✅ Wait for real transaction confirmation (via `useWaitForTransactionReceipt`)
- ✅ Handle pending, confirming, success, and error states

---

### 3. Real-time Event Listening

#### Pattern: Use Wagmi's `usePublicClient` + `watchContractEvent`

**Example: Marketplace Hook**
```tsx
// hooks/useMarketplace.ts
import { usePublicClient } from "wagmi"

useEffect(() => {
  if (!publicClient) return

  const unwatchShareListed = publicClient.watchContractEvent({
    address: CONTRACTS.mortgageBond.address,
    abi: CONTRACTS.mortgageBond.abi,
    eventName: 'ShareListed',
    onLogs: (logs) => {
      console.log("ShareListed event detected:", logs)
      refetch() // Auto-refresh data
    },
  })

  return () => {
    unwatchShareListed() // Cleanup
  }
}, [publicClient, refetch])
```

**Key Points:**
- ✅ Watch for smart contract events in real-time
- ✅ Auto-refetch data when events occur
- ✅ Clean up listeners on unmount
- ✅ Multiple events can be watched simultaneously

---

### 4. Project Configuration Management

#### Pattern: Store contract addresses in `projects.json` + helper functions

**Example: Project Config**
```json
// data/projects.json
{
  "projects": [
    {
      "id": "modern-apartment-austin",
      "name": "Modern Apartment Complex",
      "onChain": {
        "mortgageBondAddress": "0x5F5d42A41E678701a241b5bb1944CF3919346445",
        "paymentTokenAddress": "0x19b4D862Df0b30691D61674847657c34a60cFEE8",
        "chainId": 7117,
        "decimals": 6
      }
    }
  ]
}
```

```tsx
// lib/projects.ts
export function getMortgageBondConfig(projectId: string) {
  const project = getAllProjects().find(p => p.id === projectId)
  if (!project?.onChain) throw new Error(`No onChain config for ${projectId}`)
  
  return {
    address: project.onChain.mortgageBondAddress as `0x${string}`,
    abi: MORTGAGE_BOND_ABI,
  }
}
```

**Key Points:**
- ✅ Store contract addresses per project in JSON
- ✅ Use helper functions to get contract configs
- ✅ Type-safe with proper `0x${string}` casting
- ✅ Support multiple projects/bonds

---

## 🎯 Page-Specific Requirements

### 1. Dashboard Page (`/dashboard`)
**Status:** ✅ REAL - Already implemented correctly

**Features:**
- ✅ Real portfolio data from `usePortfolio` hook
- ✅ Fetches investor shares from smart contract
- ✅ Calculates pending rewards on-chain
- ✅ Displays total invested, yields, active bonds

**Hook:** `usePortfolio()`

---

### 2. Marketplace Page (`/marketplace`)
**Status:** ✅ REAL - Already implemented correctly

**Features:**
- ✅ Real primary market projects from `useProjects` hook
- ✅ Real secondary market orders from `useMarketplace` hook
- ✅ Live event listening for order updates
- ✅ Real investment functionality

**Hooks:** `useProjects()`, `useMarketplace()`

---

### 3. Admin Page (`/admin`) ⚠️
**Status:** ❌ MOCK - NEEDS REPLACEMENT

**Current Issues:**
- ❌ Uses `admin-content.tsx` with fake alerts
- ❌ `handleDistributeInterest()` just shows alert
- ❌ `handleMintRepayment()` just shows alert
- ❌ `handleCloseFunding()` just shows alert
- ❌ No wagmi integration

**Required Changes:**

#### 3.1 Create Admin Hook (`hooks/useAdminPanel.ts`)
```tsx
import { useAccount, useReadContract, useWriteContract } from "wagmi"
import { useTransactionWithToast } from "@/hooks/useTransactionState"
import { getMortgageBondConfig, getPaymentTokenConfig } from "@/lib/projects"

export function useAdminPanel(projectId: string) {
  const { address } = useAccount()
  const mortgageConfig = getMortgageBondConfig(projectId)
  const tokenConfig = getPaymentTokenConfig(projectId)

  // Read contract state
  const { data: issuer } = useReadContract({
    ...mortgageConfig,
    functionName: "issuer",
  })

  const { data: isFundingActive } = useReadContract({
    ...mortgageConfig,
    functionName: "isFundingActive",
  })

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    ...tokenConfig,
    functionName: "allowance",
    args: address ? [address, mortgageConfig.address] : undefined,
  })

  // Write operations
  const { writeContract: writeApprove, data: approveTx, isPending: isApproving } = useWriteContract()
  const { writeContract: writeDistributeInt, data: intTx, isPending: isIntPending } = useWriteContract()
  const { writeContract: writeDistributePrin, data: prinTx, isPending: isPrinPending } = useWriteContract()
  const { writeContract: writeWithdraw, data: withTx, isPending: isWithPending } = useWriteContract()

  // Transaction states
  const approveState = useTransactionWithToast(approveTx, "Approving tokens...")
  const intState = useTransactionWithToast(intTx, "Distributing interest...", "Interest distributed!")
  const prinState = useTransactionWithToast(prinTx, "Distributing principal...", "Principal distributed!")
  const withState = useTransactionWithToast(withTx, "Withdrawing principal...", "Principal withdrawn!")

  return {
    // State
    issuer,
    isFundingActive,
    allowance,
    isAdmin: address && issuer && address.toLowerCase() === issuer.toLowerCase(),
    
    // Actions
    approveTokens: (amount: bigint) => writeApprove({
      ...tokenConfig,
      functionName: "approve",
      args: [mortgageConfig.address, amount]
    }),
    distributeInterest: (amount: bigint) => writeDistributeInt({
      ...mortgageConfig,
      functionName: "distributeInterest",
      args: [amount]
    }),
    distributePrincipal: (amount: bigint) => writeDistributePrin({
      ...mortgageConfig,
      functionName: "distributePrincipalRepayment",
      args: [amount]
    }),
    withdrawPrincipal: () => writeWithdraw({
      ...mortgageConfig,
      functionName: "withdrawPrincipal",
      args: []
    }),
    
    // States
    states: { approveState, intState, prinState, withState },
    refetchAllowance,
  }
}
```

#### 3.2 Replace `admin-content.tsx` with Real Component
```tsx
// components/admin-content-real.tsx
"use client"

import { useState } from "react"
import { parseUnits } from "viem"
import { useAdminPanel } from "@/hooks/useAdminPanel"
import { getAllProjects } from "@/lib/projects"
import { AdminBondSelector } from "./admin-bond-selector"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

export function AdminContentReal() {
  const projects = getAllProjects()
  const [selectedBondId, setSelectedBondId] = useState(projects[0]?.id || "")
  const [interestAmount, setInterestAmount] = useState("")
  const [principalAmount, setPrincipalAmount] = useState("")
  
  const {
    isAdmin,
    isFundingActive,
    allowance,
    approveTokens,
    distributeInterest,
    distributePrincipal,
    withdrawPrincipal,
    states,
    refetchAllowance,
  } = useAdminPanel(selectedBondId)

  if (!isAdmin) {
    return <div className="text-center py-12">Access denied. Admin only.</div>
  }

  const handleDistributeInterest = () => {
    if (!interestAmount) return
    const amount = parseUnits(interestAmount, 6)
    
    // Check allowance
    if (amount > (allowance as bigint || BigInt(0))) {
      approveTokens(amount)
      return
    }
    
    distributeInterest(amount)
  }

  const isLoading = states.approveState.isConfirming || 
                    states.intState.isConfirming || 
                    states.prinState.isConfirming || 
                    states.withState.isConfirming

  return (
    <div className="space-y-6">
      <AdminBondSelector 
        bonds={projects.map(p => ({
          id: p.id,
          name: p.name,
          status: "active",
          principal: p.loanAmount,
          outstanding: p.loanAmount,
          nextPayment: "N/A",
          investors: p.investors,
        }))}
        selectedBond={selectedBondId}
        onSelectBond={setSelectedBondId}
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          {/* Interest Distribution */}
          <div className="grid gap-2">
            <Label>Distribute Interest (USDT)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={interestAmount}
                onChange={e => setInterestAmount(e.target.value)}
                placeholder="Amount"
              />
              <Button onClick={handleDistributeInterest} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Distribute
              </Button>
            </div>
          </div>

          {/* Principal Distribution */}
          <div className="grid gap-2">
            <Label>Distribute Principal (USDT)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={principalAmount}
                onChange={e => setPrincipalAmount(e.target.value)}
                placeholder="Amount"
              />
              <Button onClick={() => {/* Similar logic */}} disabled={isLoading}>
                Repay
              </Button>
            </div>
          </div>

          {/* Withdraw Principal */}
          <Button 
            onClick={withdrawPrincipal} 
            disabled={!isFundingActive || isLoading}
            variant="destructive"
          >
            Withdraw & Close Funding
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

#### 3.3 Update Admin Page
```tsx
// app/admin/page.tsx
import { AdminContentReal } from "@/components/admin-content-real"

export default function AdminPage() {
  return (
    <DashboardLayout>
      <AdminContentReal />
    </DashboardLayout>
  )
}
```

---

## 🔧 Implementation Checklist

### For Each New Feature/Page:

- [ ] **Step 1: Create Custom Hook** (if needed)
  - [ ] Use `useReadContract` / `useReadContracts` for reads
  - [ ] Use `useWriteContract` for writes
  - [ ] Use `useTransactionWithToast` for transaction tracking
  - [ ] Return data, loading states, actions, and refetch functions

- [ ] **Step 2: Create/Update Component**
  - [ ] Import and use the custom hook
  - [ ] Handle loading states (show skeletons)
  - [ ] Handle error states (show error messages)
  - [ ] Handle empty states (show "no data" messages)
  - [ ] Disable buttons during transactions
  - [ ] Show transaction feedback (toasts)

- [ ] **Step 3: Add Real-time Updates** (if applicable)
  - [ ] Use `usePublicClient` to get client
  - [ ] Use `watchContractEvent` for relevant events
  - [ ] Call `refetch()` when events are detected
  - [ ] Clean up listeners in useEffect return

- [ ] **Step 4: Test Thoroughly**
  - [ ] Test with wallet connected/disconnected
  - [ ] Test all transaction flows (approve → action)
  - [ ] Test error handling (rejected transactions)
  - [ ] Test loading states
  - [ ] Test real-time event updates

---

## 🚫 Anti-Patterns to AVOID

### ❌ DO NOT:
1. Use `alert()` or `console.log()` for user feedback
2. Show success messages before transaction confirms
3. Use static data when contract data is available
4. Skip allowance checks for ERC20 transfers
5. Forget to clean up event listeners
6. Call `refetch()` in infinite loops
7. Ignore loading/error states
8. Make multiple sequential reads (use `useReadContracts` for batching)

### ✅ DO:
1. Use `toast` from Sonner for notifications
2. Wait for `useWaitForTransactionReceipt` confirmation
3. Always fetch from smart contract when possible
4. Check and approve allowance before transfers
5. Return cleanup functions from useEffect
6. Use refs to prevent duplicate success callbacks
7. Show proper loading skeletons
8. Batch multiple reads together

---

## 📊 Data Flow Summary

```
User Action (Button Click)
    ↓
Component calls hook function
    ↓
Hook calls useWriteContract
    ↓
Wagmi sends transaction to wallet
    ↓
User confirms in MetaMask
    ↓
Transaction sent to blockchain
    ↓
useWaitForTransactionReceipt waits for confirmation
    ↓
useTransactionWithToast shows success toast
    ↓
Hook's success callback triggers
    ↓
refetch() called to update data
    ↓
Component re-renders with new data
```

---

## 🎯 Priority Implementation Order

1. **High Priority:** Admin Panel (current mock)
2. **Medium Priority:** Claim Rewards functionality (partially mocked)
3. **Low Priority:** Enhanced analytics/metrics (can start with mocks, enhance later)

---

## 📝 SpecKit Integration Notes

When creating specs for new features, always specify:

1. **Data Source:** "Fetch from smart contract using `useReadContract`"
2. **Action Type:** "Write transaction using `useWriteContract`"
3. **Transaction Flow:** "Check allowance → Approve (if needed) → Execute action"
4. **UI States:** "Loading → Confirming → Success/Error"
5. **Real-time Updates:** "Listen to [EventName] event and refetch data"

This ensures all new features follow the real blockchain integration pattern.

---

## 🔗 Reference Files

Working Examples:
- `/frontend/hooks/usePortfolio.ts` - Multi-contract reads
- `/frontend/hooks/useMarketplace.ts` - Event listening
- `/frontend/components/investment-form.tsx` - ERC20 approve + action flow
- `/frontend/hooks/useTransactionState.ts` - Transaction tracking

Mock Examples (DO NOT COPY):
- `/frontend/components/admin-content.tsx` - Fake alerts
- Any file with `alert()` or `console.log()` for user feedback

---

**Last Updated:** December 14, 2025
**Status:** Living Document - Update as patterns evolve

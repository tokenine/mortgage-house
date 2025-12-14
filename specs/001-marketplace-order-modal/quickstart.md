# Quick Start: Unified Marketplace Order Modal

**Feature**: 001-marketplace-order-modal  
**Audience**: Developers implementing this feature  
**Prerequisites**: Familiarity with React, TypeScript, wagmi, and existing codebase patterns

## Overview

This feature adds a unified modal component to the marketplace page that enables users to create both sell orders and buy orders. The modal uses a tabbed interface to switch between modes and leverages existing hooks and patterns from the codebase.

## Implementation Checklist

### Phase 1: Component Structure ✅ (P1)

- [ ] Create `frontend/components/order-creation-modal.tsx`
- [ ] Set up Dialog from @radix-ui/react-dialog
- [ ] Add Tabs component for Sell/Buy mode switching
- [ ] Implement controlled mode state (`useState<OrderMode>`)
- [ ] Add DialogHeader with title and description
- [ ] Test modal open/close and tab switching

**Acceptance**: Modal opens, tabs switch, escape key closes modal

---

### Phase 2: Form Setup ✅ (P1)

- [ ] Initialize useFormValidation hook with OrderFormValues type
- [ ] Create shares and price input fields
- [ ] Add Labels for accessibility
- [ ] Implement form reset on mode change (useEffect)
- [ ] Test form input and clearing

**Acceptance**: Can enter values, form clears when switching modes

---

### Phase 3: Balance Display ✅ (P1)

- [ ] Import useMortgageBond hook for share balance
- [ ] Add useReadContract for USDT balance
- [ ] Format balances using formatUnits from viem
- [ ] Display appropriate balance based on mode (shares for sell, USDT for buy)
- [ ] Add visual highlighting for active balance
- [ ] Test balance updates on wallet changes

**Acceptance**: Correct balance shown per mode, updates when wallet changes

---

### Phase 4: Validation Rules ✅ (P1)

- [ ] Create getValidationRules helper function
- [ ] Implement sell mode validation (shares ≤ balance, whole numbers)
- [ ] Implement buy mode validation (price ≤ USDT balance)
- [ ] Add custom validation messages
- [ ] Display validation errors using Alert component
- [ ] Test all validation scenarios from spec

**Acceptance**: All validation rules from spec.md working, clear error messages

---

### Phase 5: Transaction Flow - Approval ✅ (P1)

- [ ] Add useReadContract for allowance checking
- [ ] Implement writeApprove using useWriteContract
- [ ] Add useTransactionWithToast for approval state
- [ ] Check allowance in handleCreateOrder
- [ ] Request approval if insufficient
- [ ] Refetch allowance after approval success
- [ ] Test approval flow with insufficient allowance

**Acceptance**: Approval requested when needed, success triggers order creation

---

### Phase 6: Transaction Flow - Order Creation ✅ (P1)

- [ ] Implement writeOrder using useWriteContract
- [ ] Add useTransactionWithToast for order creation state
- [ ] Call createSellOrder for sell mode
- [ ] Call createBuyOrder for buy mode (when available)
- [ ] Parse shares and price to BigInt with 6 decimals
- [ ] Test sell order creation end-to-end
- [ ] Test buy order creation (mock if contract not ready)

**Acceptance**: Orders created successfully, appear in marketplace list

---

### Phase 7: Success Handling ✅ (P1)

- [ ] Implement useEffect for orderState.isSuccess
- [ ] Close modal on success
- [ ] Call onSuccess callback (for parent refresh)
- [ ] Show success toast notification
- [ ] Verify order list auto-updates via event listener
- [ ] Test complete flow from open to success

**Acceptance**: Modal closes, success notification shows, order appears in list

---

### Phase 8: Loading States ✅ (P1)

- [ ] Combine all loading states (isApproving, isConfirming, etc.)
- [ ] Disable submit button when loading
- [ ] Show spinner in button during pending states
- [ ] Update button text based on state (Approve vs Create Order)
- [ ] Test loading states with slow network

**Acceptance**: Clear loading indicators, button disabled during transactions

---

### Phase 9: Integration with Marketplace ✅ (P1)

- [ ] Update marketplace-content.tsx to use OrderCreationModal
- [ ] Replace existing SellModal button/integration
- [ ] Pass onSuccess callback for order list refresh
- [ ] Test modal triggers from marketplace page
- [ ] Verify order list updates after creation

**Acceptance**: Modal accessible from marketplace, integrates seamlessly

---

### Phase 10: Mobile Responsiveness (P2)

- [ ] Test modal on mobile viewport (320px+)
- [ ] Ensure touch targets are 44px minimum
- [ ] Verify tab switching works on touch
- [ ] Test form input on mobile keyboards
- [ ] Adjust DialogContent width for mobile
- [ ] Test modal on tablet (768px)

**Acceptance**: Modal fully functional on mobile and tablet

---

### Phase 11: Error Handling (P1)

- [ ] Test transaction rejection (user clicks Reject)
- [ ] Test network errors (disconnect wallet mid-flow)
- [ ] Test contract errors (paused contract)
- [ ] Verify error messages are user-friendly
- [ ] Test retry flow after errors
- [ ] Ensure form data preserved on non-validation errors

**Acceptance**: All error scenarios handled gracefully

---

### Phase 12: Accessibility (P2)

- [ ] Test keyboard navigation (Tab, Shift+Tab, Enter, Escape)
- [ ] Verify screen reader announcements (NVDA/VoiceOver)
- [ ] Check focus management (trap, return)
- [ ] Ensure all inputs have labels
- [ ] Test error announcements (aria-live)
- [ ] Verify color contrast (WCAG AA)

**Acceptance**: WCAG 2.1 AA compliance, keyboard-only usable

---

### Phase 13: Testing (P1)

- [ ] Write component tests (modal behavior, mode switching)
- [ ] Write validation tests (all rules from spec)
- [ ] Write transaction flow tests (approval → order creation)
- [ ] Write integration tests (mock wallet, full flow)
- [ ] Test edge cases from spec.md
- [ ] Achieve >80% code coverage

**Acceptance**: All tests pass, acceptance scenarios covered

---

## File Structure

```
frontend/
├── components/
│   ├── order-creation-modal.tsx        # NEW - Main component
│   └── marketplace-content.tsx         # UPDATE - Integration point
├── hooks/
│   ├── useMortgageBond.ts             # EXISTING - Use for share balance
│   ├── useFormValidation.ts           # EXISTING - Use for form state
│   └── useTransactionWithToast.ts     # EXISTING - Use for tx state
├── lib/
│   ├── contracts.ts                   # EXISTING - Contract ABIs
│   └── validation.ts                  # EXISTING - Validation rules
└── types/
    └── marketplace.ts                 # UPDATE - Add OrderMode type
```

## Code Templates

### Basic Component Structure

```typescript
"use client"

import { useState, useEffect } from "react"
import { useAccount, useReadContract, useWriteContract } from "wagmi"
import { parseUnits, formatUnits } from "viem"
import { CONTRACTS } from "@/lib/contracts"
import { useMortgageBond } from "@/hooks/useMortgageBond"
import { useFormValidation } from "@/hooks/useFormValidation"
import { useTransactionWithToast } from "@/hooks/useTransactionState"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"

type OrderMode = 'sell' | 'buy'

interface OrderFormValues {
  shares: string
  price: string
}

interface OrderCreationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function OrderCreationModal({ open, onOpenChange, onSuccess }: OrderCreationModalProps) {
  const [mode, setMode] = useState<OrderMode>('sell')
  const { address } = useAccount()
  const { investorInfo } = useMortgageBond()
  
  // TODO: Implement component logic
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Order</DialogTitle>
          <DialogDescription>
            {mode === 'sell' 
              ? 'List your bond shares for sale'
              : 'Create a buy order at your desired price'
            }
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={mode} onValueChange={(val) => setMode(val as OrderMode)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sell">Sell Order</TabsTrigger>
            <TabsTrigger value="buy">Buy Order</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sell">
            {/* Sell form */}
          </TabsContent>
          
          <TabsContent value="buy">
            {/* Buy form */}
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          {/* Submit button */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### Validation Rules Template

```typescript
function getValidationRules(mode: OrderMode, availableShares: string, availableUSDT: string) {
  return {
    shares: {
      required: true,
      custom: (value: string) => {
        const num = parseFloat(value)
        const userShares = parseFloat(availableShares)
        
        if (isNaN(num) || num <= 0) {
          return "Must be a valid number of shares"
        }
        if (num % 1 !== 0) {
          return "Shares must be whole numbers"
        }
        if (mode === 'sell' && num > userShares) {
          return `You only have ${userShares} shares available`
        }
      }
    },
    price: {
      required: true,
      custom: (value: string) => {
        const num = parseFloat(value)
        const userUSDT = parseFloat(availableUSDT)
        
        if (isNaN(num) || num <= 0) {
          return "Price must be greater than 0"
        }
        if (mode === 'buy' && num > userUSDT) {
          return `Insufficient USDT balance (have ${userUSDT}, need ${num})`
        }
      }
    }
  }
}
```

### Transaction Handler Template

```typescript
const handleCreateOrder = () => {
  // Validate
  if (!form.validateAll()) return
  
  const sharesRaw = parseUnits(form.fields.shares.value, 6)
  const priceRaw = parseUnits(form.fields.price.value, 6)
  
  // Check allowance
  const currentAllowance = (allowance as bigint) ?? BigInt(0)
  const needsApproval = priceRaw > currentAllowance
  
  if (needsApproval) {
    writeApprove({
      ...CONTRACTS.mockToken,
      functionName: 'approve',
      args: [CONTRACTS.mortgageBond.address, priceRaw]
    })
    return
  }
  
  // Create order
  const functionName = mode === 'sell' ? 'createSellOrder' : 'createBuyOrder'
  writeOrder({
    ...CONTRACTS.mortgageBond,
    functionName,
    args: [sharesRaw, priceRaw]
  })
}
```

## Testing Guide

### Component Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { OrderCreationModal } from './order-creation-modal'

describe('OrderCreationModal', () => {
  it('opens when open prop is true', () => {
    render(<OrderCreationModal open={true} onOpenChange={jest.fn()} />)
    expect(screen.getByText('Create Order')).toBeInTheDocument()
  })
  
  it('switches between sell and buy modes', () => {
    render(<OrderCreationModal open={true} onOpenChange={jest.fn()} />)
    
    fireEvent.click(screen.getByText('Buy Order'))
    expect(screen.getByText(/buy order at your desired price/i)).toBeInTheDocument()
    
    fireEvent.click(screen.getByText('Sell Order'))
    expect(screen.getByText(/list your bond shares for sale/i)).toBeInTheDocument()
  })
  
  it('validates shares input for sell mode', () => {
    render(<OrderCreationModal open={true} onOpenChange={jest.fn()} />)
    
    const sharesInput = screen.getByLabelText(/shares/i)
    fireEvent.change(sharesInput, { target: { value: '50.5' } })
    fireEvent.click(screen.getByText(/create sell order/i))
    
    expect(screen.getByText(/shares must be whole numbers/i)).toBeInTheDocument()
  })
})
```

## Common Pitfalls

### ❌ Don't Forget Form Reset

```typescript
// WRONG - Form retains values when switching modes
<Tabs value={mode} onValueChange={setMode}>

// RIGHT - Clear form on mode change
useEffect(() => {
  form.reset()
}, [mode])
```

### ❌ Don't Use parseFloat for BigInt Conversion

```typescript
// WRONG - Loses precision
const sharesRaw = BigInt(parseFloat(shares) * 1000000)

// RIGHT - Use parseUnits from viem
const sharesRaw = parseUnits(shares, 6)
```

### ❌ Don't Skip Allowance Check

```typescript
// WRONG - Always approves
writeApprove(...)
writeOrder(...)

// RIGHT - Only approve if needed
if (priceRaw > currentAllowance) {
  writeApprove(...)
  return // Wait for approval before creating order
}
writeOrder(...)
```

### ❌ Don't Hardcode Validation in JSX

```typescript
// WRONG - Duplicated logic
<Alert>
  {shares > 100 && "Too many shares"}
</Alert>

// RIGHT - Use validation hook
<Alert>
  {form.fields.shares.error}
</Alert>
```

## Resources

- [Radix UI Dialog Docs](https://www.radix-ui.com/primitives/docs/components/dialog)
- [Radix UI Tabs Docs](https://www.radix-ui.com/primitives/docs/components/tabs)
- [Wagmi useWriteContract](https://wagmi.sh/react/api/hooks/useWriteContract)
- [Viem parseUnits](https://viem.sh/docs/utilities/parseUnits.html)
- [Feature Spec](./spec.md)
- [Data Model](./data-model.md)
- [Component Interface](./contracts/order-creation-modal.md)

## Support

- Review existing SellModal.tsx for reference implementation
- Check marketplace-content.tsx for integration patterns
- See useFormValidation hook for validation examples
- Refer to useTransactionWithToast for transaction handling

## Success Criteria

✅ Modal opens and closes correctly  
✅ Tab switching works (Sell ↔ Buy)  
✅ Form validates according to mode  
✅ Approval flow works when needed  
✅ Orders created successfully  
✅ Success notification shows  
✅ Order list refreshes automatically  
✅ Mobile responsive  
✅ Keyboard accessible  
✅ All tests passing  

**When all checkboxes are complete, feature is ready for code review.**

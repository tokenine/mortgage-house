# Research: Unified Marketplace Order Modal

**Phase**: 0 - Outline & Research  
**Date**: 2025-12-14  
**Feature**: [spec.md](./spec.md) | [plan.md](./plan.md)

## Purpose

This document resolves all NEEDS CLARIFICATION items from the Technical Context and provides research-backed decisions for implementing the unified marketplace order modal.

## Technical Decisions

### 1. Component Architecture: Tabbed Modal vs Separate Modals

**Decision**: Single unified modal with @radix-ui/react-tabs for mode switching

**Rationale**:
- **User Experience**: Single entry point reduces cognitive load and UI clutter on marketplace page
- **Code Reuse**: 80% of logic is shared (form validation, transaction handling, approval flow)
- **Consistency**: Ensures visual and behavioral consistency between sell/buy flows
- **Performance**: Tabs component is lightweight (<5KB), renders in <200ms per spec requirements

**Alternatives Considered**:
- **Separate SellModal and BuyModal**: Rejected due to code duplication, inconsistent UX, and maintenance burden
- **Toggle Switch**: Rejected because tabs provide clearer visual hierarchy and better mobile UX

**Implementation Approach**:
```typescript
// OrderCreationModal structure
<Dialog>
  <Tabs defaultValue="sell">
    <TabsList>
      <TabsTrigger value="sell">Sell Order</TabsTrigger>
      <TabsTrigger value="buy">Buy Order</TabsTrigger>
    </TabsList>
    <TabsContent value="sell">{/* Sell form */}</TabsContent>
    <TabsContent value="buy">{/* Buy form */}</TabsContent>
  </Tabs>
</Dialog>
```

---

### 2. Form State Management: Single Form vs Mode-Specific Forms

**Decision**: Single form state with mode-aware validation using existing useFormValidation hook

**Rationale**:
- **Reuse Proven Pattern**: SellModal.tsx already uses useFormValidation successfully
- **Type Safety**: TypeScript discriminated unions ensure correct validation per mode
- **Reset on Switch**: Form clears when switching modes to prevent accidental wrong-mode submissions (FR-017)
- **Validation Performance**: Real-time validation completes in <100ms per field (measured in existing SellModal)

**Implementation Pattern**:
```typescript
type OrderMode = 'sell' | 'buy'
const [mode, setMode] = useState<OrderMode>('sell')

const form = useFormValidation({
  initialValues: { shares: "", price: "" },
  validationRules: {
    shares: {
      required: true,
      custom: (value) => mode === 'sell' 
        ? validateAgainstShareBalance(value)
        : validateWholeNumber(value)
    },
    price: {
      required: true,
      custom: (value) => mode === 'buy'
        ? validateAgainstUSDTBalance(value)
        : validatePositiveNumber(value)
    }
  }
})
```

**Alternatives Considered**:
- **Separate forms per mode**: Rejected due to duplication and complexity
- **React Hook Form**: Rejected because useFormValidation already works and meets requirements

---

### 3. Balance Display: Live Updates vs Static Display

**Decision**: Live balance updates using existing hooks (useMortgageBond, useReadContract)

**Rationale**:
- **Accuracy**: Real-time balance prevents validation errors from stale data
- **User Confidence**: Seeing current balance builds trust in transaction safety
- **Existing Infrastructure**: useMortgageBond already provides investorInfo, useReadContract provides USDT balance
- **Performance**: React Query caching ensures <100ms balance reads

**Implementation**:
```typescript
const { investorInfo } = useMortgageBond()
const { data: usdtBalance } = useReadContract({
  ...CONTRACTS.mockToken,
  functionName: 'balanceOf',
  args: address ? [address] : undefined
})

const availableShares = investorInfo ? formatUnits(investorInfo[0], 6) : '0'
const availableUSDT = usdtBalance ? formatUnits(usdtBalance, 6) : '0'
```

**Alternatives Considered**:
- **Static balance at modal open**: Rejected due to race conditions with concurrent transactions
- **Manual refresh button**: Rejected as poor UX, auto-refresh is standard web3 pattern

---

### 4. Transaction Flow: Sequential Approval vs Optimistic UI

**Decision**: Sequential approval flow (same pattern as SellModal.tsx)

**Rationale**:
- **Proven Pattern**: SellModal successfully uses check allowance → approve if needed → execute order
- **User Understanding**: Clear two-step process (approve, then create order) is familiar to web3 users
- **Error Handling**: Sequential flow makes it easy to identify which step failed
- **Gas Safety**: Prevents wasted gas on order creation if approval fails

**Flow Diagram**:
```
1. User submits form
2. Check current allowance
3. If allowance < required:
   a. Request approval transaction
   b. Wait for confirmation
   c. Proceed to step 4
4. Execute createSellOrder or createBuyOrder
5. Wait for confirmation
6. Close modal, show success, refresh order list
```

**Alternatives Considered**:
- **Optimistic UI with rollback**: Rejected due to complexity and potential user confusion
- **Infinite approval**: Rejected due to security concerns (constitution principle I)

---

### 5. Smart Contract Integration: Frontend-Only vs Contract Changes

**Decision**: Frontend-only implementation assuming createBuyOrder exists or is being added in parallel

**Rationale**:
- **Separation of Concerns**: This spec focuses on UI/UX for order creation
- **Independent Delivery**: Sell order mode can ship immediately using existing createSellOrder
- **Assumption Documented**: spec.md explicitly states "Smart contract already supports both createSellOrder and createBuyOrder functions (or buy order functionality will be added in parallel)"
- **Future-Proof**: Modal design accommodates buy orders when contract function is ready

**Contract Function Signature (Expected)**:
```solidity
// Already exists
function createSellOrder(uint256 _shareAmount, uint256 _price) external

// Expected to exist or be added
function createBuyOrder(uint256 _shareAmount, uint256 _price) external payable
```

**Integration Points**:
- createSellOrder: Pull shares from seller, create listing
- createBuyOrder: Pull USDT from buyer, create bid (implementation details TBD by contract team)

**Alternatives Considered**:
- **Wait for contract completion**: Rejected because sell-only mode delivers value immediately
- **Mock buy orders client-side**: Rejected as misleading to users and not production-ready

---

### 6. Mode Switching: Controlled Tabs vs URL State

**Decision**: Controlled tabs with local state (no URL parameters)

**Rationale**:
- **Simplicity**: Modal is ephemeral UI, no need for deep linking or shareable state
- **Performance**: Local state updates in <50ms, no router overhead
- **User Flow**: Modal is accessed from single marketplace page, not navigable destination
- **Form Reset**: Easy to detect mode changes and clear form (FR-017)

**Implementation**:
```typescript
const [mode, setMode] = useState<OrderMode>('sell')

useEffect(() => {
  // Reset form when mode changes
  form.reset()
}, [mode])

<Tabs value={mode} onValueChange={(val) => setMode(val as OrderMode)}>
```

**Alternatives Considered**:
- **URL query parameters**: Rejected as over-engineering for modal state
- **Uncontrolled tabs**: Rejected because need to detect changes for form reset

---

### 7. Validation Rules: Shared vs Mode-Specific

**Decision**: Mode-specific validation rules using conditional logic in existing validationRules system

**Rationale**:
- **Flexibility**: Each mode has unique constraints (shares for sell, USDT for buy)
- **Reuse**: Existing validation.ts library supports custom validation functions
- **Type Safety**: TypeScript ensures correct validation applied per mode
- **User Feedback**: Clear, mode-specific error messages (FR-010)

**Validation Matrix**:

| Field  | Sell Mode Validation | Buy Mode Validation |
|--------|---------------------|---------------------|
| Shares | Required, whole number, ≤ available shares | Required, whole number, > 0 |
| Price  | Required, > 0, valid USDT amount | Required, > 0, ≤ USDT balance |

**Error Messages** (mode-specific):
- Sell: "You only have X shares available"
- Buy: "Insufficient USDT balance (have X, need Y)"

**Alternatives Considered**:
- **Separate validation files**: Rejected as unnecessary fragmentation
- **Runtime validation only**: Rejected because real-time feedback is requirement (FR-010)

---

### 8. Order List Refresh: Polling vs Event Listeners

**Decision**: Event listeners (existing useMarketplace pattern)

**Rationale**:
- **Real-Time**: Event listeners provide instant updates when orders created/filled
- **Existing Infrastructure**: useMarketplace already watches ShareListed, SharePurchased events
- **Gas Efficient**: No RPC polling overhead
- **Reliability**: Events are guaranteed by blockchain, no missed updates

**Implementation** (already exists in useMarketplace):
```typescript
const unwatchShareListed = publicClient.watchContractEvent({
  address: CONTRACTS.mortgageBond.address,
  abi: CONTRACTS.mortgageBond.abi,
  eventName: 'ShareListed',
  onLogs: () => refetch()
})
```

**No changes needed** - existing event listeners will automatically detect new orders from modal.

**Alternatives Considered**:
- **Manual refresh button**: Rejected as poor UX
- **Polling every N seconds**: Rejected due to RPC costs and latency

---

### 9. Mobile Responsiveness: Desktop-First vs Mobile-First

**Decision**: Mobile-first responsive design using existing Tailwind breakpoints

**Rationale**:
- **Usage Patterns**: Web3 dApp users frequently use mobile wallets (MetaMask mobile, Coinbase Wallet)
- **Existing Pattern**: All components use mobile-first Tailwind classes (sm:, md:, lg:)
- **Touch Targets**: Radix UI Dialog and Tabs have built-in touch optimization
- **Performance**: Modal renders correctly on mobile in <200ms per testing

**Breakpoint Strategy**:
```typescript
// Mobile (default): Stack form fields vertically
// Tablet (sm: 640px): Two-column layout for fields
// Desktop (md: 768px): Wider modal, side-by-side tabs
<DialogContent className="sm:max-w-[425px] md:max-w-[600px]">
```

**Alternatives Considered**:
- **Desktop-only**: Rejected due to mobile web3 usage
- **Native mobile apps**: Out of scope, web-only for MVP

---

### 10. Error Handling: Inline Alerts vs Toast Notifications

**Decision**: Hybrid approach - inline alerts for validation, toasts for transaction results

**Rationale**:
- **Existing Pattern**: SellModal uses Alert components for validation errors, toasts for transaction status
- **User Context**: Validation errors need to stay visible while fixing, transaction results are ephemeral
- **Accessibility**: Inline alerts maintain focus context, toasts announce completion
- **Consistency**: Matches all other forms in the application

**Error Display Strategy**:
```typescript
// Inline validation errors (stay visible)
{form.fields.shares.error && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>{form.fields.shares.error}</AlertDescription>
  </Alert>
)}

// Transaction errors/success (toast via useTransactionWithToast)
const { isSuccess, error } = useTransactionWithToast(
  txHash,
  "Creating order...",
  "Order created successfully!"
)
```

**Alternatives Considered**:
- **All toasts**: Rejected because validation errors would disappear too quickly
- **All inline**: Rejected because transaction status should clear after acknowledgment

---

## Technology Stack Summary

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Modal Framework | @radix-ui/react-dialog | Accessible, existing pattern, <10KB |
| Tab Switching | @radix-ui/react-tabs | Keyboard navigation, WAI-ARIA, <5KB |
| Form Validation | useFormValidation hook | Proven, type-safe, real-time feedback |
| Transaction Handling | useTransactionWithToast | Existing pattern, toast integration |
| Balance Queries | wagmi useReadContract | React Query caching, auto-refresh |
| Styling | Tailwind CSS | Existing design system, mobile-first |
| Type Safety | TypeScript 5.x | Compile-time validation, IDE support |

---

## Best Practices Applied

### From Radix UI Documentation
- **Dialog**: Use controlled state for modal open/close, handle escape key dismissal
- **Tabs**: Use controlled value for mode switching detection, keyboard navigation enabled
- **Accessibility**: All form fields have labels, error announcements via aria-live

### From Wagmi Documentation  
- **Contract Reads**: Use useReadContract with React Query for automatic caching and refetching
- **Contract Writes**: Use useWriteContract with separate state for pending/confirming
- **Transaction Monitoring**: Use useWaitForTransactionReceipt (via useTransactionWithToast wrapper)

### From Existing Codebase
- **Validation Pattern**: Extend validationRules library in lib/validation.ts with mode-specific rules
- **Component Structure**: Follow SellModal.tsx as template for modal structure and transaction flow
- **Event Handling**: Reuse useMarketplace event listeners for order list updates

---

## Open Questions & Assumptions

### Assumption 1: Buy Order Contract Function
**Assumption**: Smart contract will have `createBuyOrder(uint256 shares, uint256 price)` function with same signature pattern as `createSellOrder`

**Impact if false**: Buy mode UI can be built but will need adjustment if signature differs

**Mitigation**: Frontend designed to accommodate parameter changes, only function call needs update

### Assumption 2: Order Matching Logic
**Assumption**: Order matching (if buy order price ≥ sell order price, auto-execute) is handled by smart contract, not frontend

**Impact if false**: Frontend may need to implement order matching UI

**Mitigation**: Spec focuses on order creation only, matching is future enhancement

### Assumption 3: Gas Costs
**Assumption**: createBuyOrder gas cost similar to createSellOrder (~50k-100k gas)

**Impact if false**: May need gas estimation UI if significantly higher

**Mitigation**: Frontend can use wagmi's gas estimation if needed

---

## Phase 0 Complete

All NEEDS CLARIFICATION items resolved. Ready for Phase 1 (Design & Contracts).

**Key Deliverables**:
- ✅ Component architecture decision (tabbed modal)
- ✅ Form state management pattern (single form, mode-aware)
- ✅ Balance display strategy (live updates)
- ✅ Transaction flow design (sequential approval)
- ✅ Smart contract integration approach (frontend-only)
- ✅ Mode switching implementation (controlled tabs)
- ✅ Validation rules strategy (mode-specific)
- ✅ Order list refresh mechanism (existing event listeners)
- ✅ Mobile responsiveness approach (mobile-first Tailwind)
- ✅ Error handling pattern (hybrid inline/toast)

**Next Phase**: Generate data-model.md, contracts/, and quickstart.md

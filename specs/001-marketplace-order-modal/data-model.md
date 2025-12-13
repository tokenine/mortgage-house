# Data Model: Unified Marketplace Order Modal

**Phase**: 1 - Design & Contracts  
**Date**: 2025-12-14  
**Feature**: [spec.md](./spec.md) | [plan.md](./plan.md) | [research.md](./research.md)

## Purpose

This document defines the data entities, types, and state structures for the unified marketplace order modal feature.

## Entities

### 1. OrderMode

**Description**: Discriminated union type representing which order creation mode is active

**Fields**:
- `type`: `'sell' | 'buy'` - The active mode

**Validation Rules**:
- Must be one of two allowed values
- Cannot be null or undefined

**State Transitions**:
```
'sell' <-> 'buy' (bidirectional, triggered by tab click)
```

**Usage**:
```typescript
type OrderMode = 'sell' | 'buy'
const [mode, setMode] = useState<OrderMode>('sell')
```

---

### 2. OrderFormValues

**Description**: Form data for order creation, shared across both modes

**Fields**:
- `shares`: `string` - Number of shares to sell/buy (stored as string for input handling)
- `price`: `string` - Total price in USDT (stored as string for input handling)

**Validation Rules**:

| Field  | Required | Type    | Constraints |
|--------|----------|---------|-------------|
| shares | Yes      | Numeric string | Whole number, > 0, mode-specific max |
| price  | Yes      | Numeric string | Positive decimal, mode-specific max |

**Mode-Specific Constraints**:
- **Sell Mode**:
  - `shares`: ≤ user's available share balance
  - `price`: Any positive value
- **Buy Mode**:
  - `shares`: Any positive whole number
  - `price`: ≤ user's USDT balance

**Derived Values**:
- `pricePerShare`: `number` = `parseFloat(price) / parseFloat(shares)`

**Usage**:
```typescript
interface OrderFormValues {
  shares: string
  price: string
}

const form = useFormValidation<OrderFormValues>({
  initialValues: { shares: "", price: "" },
  validationRules: { /* see Validation Rules below */ }
})
```

---

### 3. UserBalanceState

**Description**: Real-time user holdings displayed in the modal

**Fields**:
- `shareBalance`: `bigint` - User's bond share balance (from contract)
- `usdtBalance`: `bigint` - User's USDT token balance (from contract)
- `availableShares`: `string` - Formatted share balance for display
- `availableUSDT`: `string` - Formatted USDT balance for display

**Data Sources**:
```typescript
// Share balance from MortgageBond contract
const { investorInfo } = useMortgageBond()
const shareBalance = investorInfo ? investorInfo[0] : BigInt(0)
const availableShares = formatUnits(shareBalance, 6)

// USDT balance from MockToken contract
const { data: usdtBalance } = useReadContract({
  ...CONTRACTS.mockToken,
  functionName: 'balanceOf',
  args: [userAddress]
})
const availableUSDT = formatUnits(usdtBalance ?? BigInt(0), 6)
```

**Update Frequency**: Real-time via React Query (auto-refetch on block changes)

---

### 4. TransactionState

**Description**: State of ongoing blockchain transaction

**States**:
1. `idle` - No transaction in progress
2. `checkingAllowance` - Reading current token approval
3. `needsApproval` - Insufficient allowance detected
4. `approvePending` - Approval transaction submitted, awaiting wallet confirmation
5. `approveConfirming` - Approval confirmed by wallet, awaiting block confirmation
6. `approveSuccess` - Approval confirmed on-chain
7. `orderPending` - Order creation transaction submitted, awaiting wallet confirmation
8. `orderConfirming` - Order confirmed by wallet, awaiting block confirmation
9. `orderSuccess` - Order creation confirmed on-chain
10. `error` - Transaction failed at any step

**State Transitions**:
```
idle -> checkingAllowance
  -> (if sufficient) -> orderPending -> orderConfirming -> orderSuccess
  -> (if insufficient) -> needsApproval -> approvePending -> approveConfirming 
     -> approveSuccess -> orderPending -> orderConfirming -> orderSuccess
  -> (any failure) -> error
```

**Implementation**:
```typescript
const { writeContract: writeApprove, data: approveTx, isPending: isApproving } = useWriteContract()
const { writeContract: writeOrder, data: orderTx, isPending: isOrderPending } = useWriteContract()

const approveState = useTransactionWithToast(approveTx, "Approving tokens...")
const orderState = useTransactionWithToast(orderTx, "Creating order...", "Order created!")

const isLoading = isApproving || approveState.isConfirming || isOrderPending || orderState.isConfirming
```

---

### 5. ValidationState

**Description**: Real-time form validation results

**Fields**:
- `shares.error`: `string | undefined` - Error message for shares field
- `price.error`: `string | undefined` - Error message for price field
- `isValid`: `boolean` - Overall form validity
- `touched.shares`: `boolean` - Has shares field been interacted with
- `touched.price`: `boolean` - Has price field been interacted with

**Validation Rules** (from lib/validation.ts):

**Sell Mode**:
```typescript
{
  shares: {
    required: true,
    custom: (value: string) => {
      const num = parseFloat(value)
      const userShares = Number(availableShares)
      
      if (isNaN(num) || num <= 0) return "Must be a valid number of shares"
      if (num % 1 !== 0) return "Shares must be whole numbers"
      if (num > userShares) return `You only have ${userShares} shares available`
    }
  },
  price: {
    required: true,
    custom: (value: string) => {
      const num = parseFloat(value)
      if (isNaN(num) || num <= 0) return "Price must be greater than 0"
    }
  }
}
```

**Buy Mode**:
```typescript
{
  shares: {
    required: true,
    custom: (value: string) => {
      const num = parseFloat(value)
      if (isNaN(num) || num <= 0) return "Must be a valid number of shares"
      if (num % 1 !== 0) return "Shares must be whole numbers"
    }
  },
  price: {
    required: true,
    custom: (value: string) => {
      const num = parseFloat(value)
      const userUSDT = Number(availableUSDT)
      
      if (isNaN(num) || num <= 0) return "Price must be greater than 0"
      if (num > userUSDT) return `Insufficient USDT balance (have ${userUSDT}, need ${num})`
    }
  }
}
```

---

### 6. Order (existing, from useMarketplace)

**Description**: Marketplace order data structure (already defined, included for reference)

**Fields**:
- `id`: `number` - Unique order identifier
- `seller`: `string` - Ethereum address of seller
- `shareAmount`: `bigint` - Number of shares in order (6 decimals)
- `price`: `bigint` - Total price in USDT (6 decimals)
- `isActive`: `boolean` - Whether order is still open

**Type Definition**:
```typescript
export interface SellOrder {
  id: number
  seller: string
  shareAmount: bigint
  price: bigint
  isActive: boolean
}
```

**Note**: Buy order type will be similar structure when contract support is added.

---

## Component State Structure

### OrderCreationModal Component

```typescript
interface OrderCreationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void // Callback to refresh order lists
}

interface OrderCreationModalState {
  // Mode management
  mode: OrderMode
  
  // Form state (managed by useFormValidation)
  form: {
    fields: {
      shares: { value: string, error?: string }
      price: { value: string, error?: string }
    }
    isValid: boolean
    setValue: (field: 'shares' | 'price', value: string) => void
    validateAll: () => boolean
    reset: () => void
  }
  
  // Balance state (from hooks)
  balances: {
    shareBalance: bigint
    usdtBalance: bigint
    availableShares: string
    availableUSDT: string
  }
  
  // Transaction state (from wagmi hooks)
  transaction: {
    isApproving: boolean
    isApproveConfirming: boolean
    isApproveSuccess: boolean
    isOrderPending: boolean
    isOrderConfirming: boolean
    isOrderSuccess: boolean
    error?: Error
  }
  
  // Allowance state
  allowance: {
    current: bigint
    required: bigint
    needsApproval: boolean
  }
}
```

---

## Data Flow Diagrams

### 1. Form Submission Flow

```
User enters values
  ↓
Real-time validation (on change)
  ↓
User clicks "Create Order"
  ↓
Validate all fields
  ↓
(if invalid) → Show errors, stop
  ↓
(if valid) → Check allowance
  ↓
(if insufficient) → Request approval → Wait → Recheck
  ↓
(if sufficient) → Execute order creation
  ↓
Wait for confirmation
  ↓
Show success toast
  ↓
Close modal
  ↓
Refresh order list (via event listener)
```

### 2. Balance Update Flow

```
Component mounts
  ↓
Subscribe to balance queries (wagmi)
  ↓
Display initial balances
  ↓
User switches mode
  ↓
Highlight relevant balance (shares for sell, USDT for buy)
  ↓
User completes transaction
  ↓
React Query auto-refetches balances
  ↓
UI updates with new values
```

### 3. Mode Switching Flow

```
User clicks tab (Sell ↔ Buy)
  ↓
Update mode state
  ↓
useEffect detects mode change
  ↓
Reset form values to empty
  ↓
Clear validation errors
  ↓
Update highlighted balance display
  ↓
Update button text ("Create Sell Order" vs "Create Buy Order")
```

---

## Type Definitions (TypeScript)

```typescript
// types/marketplace.ts

export type OrderMode = 'sell' | 'buy'

export interface OrderFormValues {
  shares: string
  price: string
}

export interface UserBalances {
  shareBalance: bigint
  usdtBalance: bigint
  availableShares: string
  availableUSDT: string
}

export interface OrderCreationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export interface AllowanceState {
  current: bigint
  required: bigint
  needsApproval: boolean
}

// Existing type from useMarketplace (reference)
export interface SellOrder {
  id: number
  seller: string
  shareAmount: bigint
  price: bigint
  isActive: boolean
}

// Future: Buy order type when contract support added
export interface BuyOrder {
  id: number
  buyer: string
  shareAmount: bigint
  price: bigint
  isActive: boolean
}
```

---

## Smart Contract Data Structures (Reference)

### From MortgageContract.sol

```solidity
struct SellOrder {
    address seller;
    uint256 shareAmount;  // 6 decimals (matches USDT)
    uint256 price;        // 6 decimals (USDT)
    bool isActive;
}

mapping(uint256 => SellOrder) public sellOrders;
uint256 public nextOrderId;
```

**Expected (for buy orders)**:
```solidity
struct BuyOrder {
    address buyer;
    uint256 shareAmount;
    uint256 price;
    bool isActive;
}

mapping(uint256 => BuyOrder) public buyOrders;
uint256 public nextBuyOrderId;
```

---

## Validation Summary Table

| Field  | Sell Mode | Buy Mode | Error Message |
|--------|-----------|----------|---------------|
| shares | Required, whole number, > 0, ≤ balance | Required, whole number, > 0 | "Must be a valid number of shares" |
| shares | | | "Shares must be whole numbers" |
| shares | ≤ available shares | N/A | "You only have X shares available" |
| price  | Required, > 0 | Required, > 0, ≤ USDT balance | "Price must be greater than 0" |
| price  | N/A | ≤ USDT balance | "Insufficient USDT balance (have X, need Y)" |

---

## Phase 1 Partial Complete

Data model defined for all entities and state structures. Ready for contracts/ and quickstart.md generation.

**Key Deliverables**:
- ✅ OrderMode type definition
- ✅ OrderFormValues interface
- ✅ UserBalanceState structure
- ✅ TransactionState lifecycle
- ✅ ValidationState rules
- ✅ Component state architecture
- ✅ Data flow diagrams
- ✅ TypeScript type definitions
- ✅ Validation rules matrix

**Next**: Generate contracts/ directory with component interface specifications

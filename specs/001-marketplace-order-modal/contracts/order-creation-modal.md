# Component Interface: OrderCreationModal

**Type**: React Component  
**Location**: `frontend/components/order-creation-modal.tsx`  
**Purpose**: Unified modal for creating sell and buy orders on marketplace

## Public Interface

### Props

```typescript
interface OrderCreationModalProps {
  /**
   * Controls modal visibility
   * @required
   */
  open: boolean
  
  /**
   * Callback when modal open state changes
   * @param open - New open state
   * @required
   */
  onOpenChange: (open: boolean) => void
  
  /**
   * Optional callback invoked after successful order creation
   * Use this to refresh order lists or update parent state
   * @optional
   */
  onSuccess?: () => void
}
```

### Usage Example

```typescript
import { OrderCreationModal } from '@/components/order-creation-modal'
import { useState } from 'react'

function MarketplaceContent() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { refetchOrders } = useMarketplace()
  
  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>
        Create Order
      </Button>
      
      <OrderCreationModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={refetchOrders}
      />
    </>
  )
}
```

---

## Internal Structure

### Component Tree

```
OrderCreationModal
├── Dialog (from @radix-ui/react-dialog)
│   ├── DialogContent
│   │   ├── DialogHeader
│   │   │   ├── DialogTitle
│   │   │   └── DialogDescription
│   │   ├── Tabs (from @radix-ui/react-tabs)
│   │   │   ├── TabsList
│   │   │   │   ├── TabsTrigger[value="sell"]
│   │   │   │   └── TabsTrigger[value="buy"]
│   │   │   ├── TabsContent[value="sell"]
│   │   │   │   └── OrderForm (sell mode)
│   │   │   └── TabsContent[value="buy"]
│   │   │       └── OrderForm (buy mode)
│   │   └── DialogFooter
│   │       ├── BalanceDisplay
│   │       └── SubmitButton
```

### Sub-Components

#### OrderForm (Internal)

```typescript
interface OrderFormProps {
  mode: 'sell' | 'buy'
  form: ReturnType<typeof useFormValidation<OrderFormValues>>
  balances: UserBalances
}

// Renders:
// - Shares input field
// - Price input field
// - Per-share price calculation display
// - Validation error alerts
```

#### BalanceDisplay (Internal)

```typescript
interface BalanceDisplayProps {
  mode: 'sell' | 'buy'
  availableShares: string
  availableUSDT: string
}

// Shows highlighted balance based on mode:
// - Sell mode: "Available: X shares"
// - Buy mode: "Available: Y USDT"
```

#### SubmitButton (Internal)

```typescript
interface SubmitButtonProps {
  mode: 'sell' | 'buy'
  isLoading: boolean
  isValid: boolean
  needsApproval: boolean
  onClick: () => void
}

// Button text variations:
// - "Approve Tokens" (if needsApproval)
// - "Create Sell Order" (sell mode, ready)
// - "Create Buy Order" (buy mode, ready)
// - Loading spinner when pending
```

---

## Hook Dependencies

### Required Hooks

```typescript
// From wagmi
import { useAccount, useReadContract, useWriteContract } from 'wagmi'

// From project hooks
import { useMortgageBond } from '@/hooks/useMortgageBond'
import { useFormValidation } from '@/hooks/useFormValidation'
import { useTransactionWithToast } from '@/hooks/useTransactionState'
```

### Hook Usage

```typescript
// Get user address
const { address } = useAccount()

// Get share balance
const { investorInfo } = useMortgageBond()

// Get USDT balance
const { data: usdtBalance } = useReadContract({
  ...CONTRACTS.mockToken,
  functionName: 'balanceOf',
  args: address ? [address] : undefined
})

// Get current allowance
const { data: allowance, refetch: refetchAllowance } = useReadContract({
  ...CONTRACTS.mockToken,
  functionName: 'allowance',
  args: address ? [address, CONTRACTS.mortgageBond.address] : undefined
})

// Write functions
const { writeContract: writeApprove, data: approveTx, isPending: isApproving } = useWriteContract()
const { writeContract: writeOrder, data: orderTx, isPending: isOrderPending } = useWriteContract()

// Transaction state management
const approveState = useTransactionWithToast(approveTx, "Approving tokens...")
const orderState = useTransactionWithToast(orderTx, "Creating order...", "Order created!")
```

---

## State Management

### Component State

```typescript
const [mode, setMode] = useState<OrderMode>('sell')

const form = useFormValidation<OrderFormValues>({
  initialValues: { shares: "", price: "" },
  validationRules: getValidationRules(mode, availableShares, availableUSDT)
})
```

### Effects

```typescript
// Reset form when mode changes
useEffect(() => {
  form.reset()
}, [mode])

// Refetch allowance after approval
useEffect(() => {
  if (approveState.isSuccess) {
    refetchAllowance()
  }
}, [approveState.isSuccess])

// Close modal and trigger success callback
useEffect(() => {
  if (orderState.isSuccess) {
    onOpenChange(false)
    onSuccess?.()
  }
}, [orderState.isSuccess])
```

---

## Methods

### handleCreateOrder

```typescript
/**
 * Handles order creation with automatic approval flow
 * 
 * Flow:
 * 1. Validate form
 * 2. Check token allowance
 * 3. If insufficient, request approval
 * 4. If sufficient, execute order creation
 */
const handleCreateOrder = () => {
  // Validate form
  if (!form.validateAll()) return
  
  const sharesRaw = parseUnits(form.fields.shares.value, 6)
  const priceRaw = parseUnits(form.fields.price.value, 6)
  
  // Check allowance
  const currentAllowance = (allowance as bigint) ?? BigInt(0)
  const needsApproval = priceRaw > currentAllowance
  
  if (needsApproval) {
    // Request approval
    writeApprove({
      ...CONTRACTS.mockToken,
      functionName: 'approve',
      args: [CONTRACTS.mortgageBond.address, priceRaw]
    })
    return
  }
  
  // Execute order creation
  const functionName = mode === 'sell' ? 'createSellOrder' : 'createBuyOrder'
  writeOrder({
    ...CONTRACTS.mortgageBond,
    functionName,
    args: [sharesRaw, priceRaw]
  })
}
```

### getValidationRules (helper)

```typescript
/**
 * Returns mode-specific validation rules
 * @param mode - Current order mode
 * @param availableShares - User's share balance (formatted)
 * @param availableUSDT - User's USDT balance (formatted)
 */
function getValidationRules(
  mode: OrderMode,
  availableShares: string,
  availableUSDT: string
) {
  return {
    shares: {
      required: true,
      custom: (value: string) => {
        const num = parseFloat(value)
        if (isNaN(num) || num <= 0) return "Must be a valid number of shares"
        if (num % 1 !== 0) return "Shares must be whole numbers"
        
        if (mode === 'sell') {
          const maxShares = parseFloat(availableShares)
          if (num > maxShares) return `You only have ${maxShares} shares available`
        }
      }
    },
    price: {
      required: true,
      custom: (value: string) => {
        const num = parseFloat(value)
        if (isNaN(num) || num <= 0) return "Price must be greater than 0"
        
        if (mode === 'buy') {
          const maxUSDT = parseFloat(availableUSDT)
          if (num > maxUSDT) return `Insufficient USDT balance (have ${maxUSDT}, need ${num})`
        }
      }
    }
  }
}
```

---

## Events Emitted

### onOpenChange

```typescript
/**
 * Emitted when modal open state changes
 * @param open - New open state (true/false)
 * 
 * Triggers:
 * - User clicks close button
 * - User presses Escape key
 * - User clicks backdrop
 * - Successful order creation
 */
onOpenChange(false)
```

### onSuccess (optional)

```typescript
/**
 * Emitted after successful order creation
 * 
 * Triggers:
 * - Order creation transaction confirmed on-chain
 * 
 * Use case:
 * - Refresh order lists in parent component
 * - Update analytics/metrics
 */
onSuccess?.()
```

---

## Accessibility

### Keyboard Navigation

- **Tab**: Navigate between fields and buttons
- **Shift+Tab**: Navigate backwards
- **Enter**: Submit form (when focused on input)
- **Escape**: Close modal
- **Arrow Left/Right**: Switch between tabs (Sell/Buy)

### Screen Reader Support

```typescript
// Dialog announcements
<DialogTitle>Create Order</DialogTitle>
<DialogDescription>
  {mode === 'sell' 
    ? 'List your bond shares for sale on the marketplace'
    : 'Create a buy order for bond shares at your desired price'
  }
</DialogDescription>

// Form labels
<Label htmlFor="shares">Number of Shares</Label>
<Label htmlFor="price">Total Price (USDT)</Label>

// Error announcements (via Alert)
<Alert variant="destructive" role="alert" aria-live="polite">
  <AlertDescription>{errorMessage}</AlertDescription>
</Alert>
```

### Focus Management

- Modal auto-focuses first input on open
- Focus returns to trigger button on close
- Focus trap within modal (can't tab out)

---

## Performance Considerations

### Rendering Optimization

```typescript
// Memoize validation rules to prevent recalculation
const validationRules = useMemo(
  () => getValidationRules(mode, availableShares, availableUSDT),
  [mode, availableShares, availableUSDT]
)

// Debounce real-time validation (if needed)
const debouncedValidation = useMemo(
  () => debounce(form.validateAll, 300),
  [form]
)
```

### Data Fetching

- Balance queries use React Query caching (wagmi default)
- Allowance refetch only after approval success
- No polling - relies on block updates and event listeners

---

## Error Handling

### Validation Errors (Inline)

```typescript
{form.fields.shares.error && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>{form.fields.shares.error}</AlertDescription>
  </Alert>
)}
```

### Transaction Errors (Toast)

```typescript
// Handled automatically by useTransactionWithToast
// Displays toast notification with error message
// User can retry by clicking button again
```

### Network Errors

```typescript
// Balance queries return undefined on error
// UI shows "0" as fallback
// User sees wallet connection prompt if disconnected
```

---

## Testing Interface

### Test IDs

```typescript
<Dialog data-testid="order-creation-modal">
  <Tabs data-testid="order-mode-tabs">
    <TabsTrigger data-testid="sell-mode-tab" value="sell">
    <TabsTrigger data-testid="buy-mode-tab" value="buy">
  </Tabs>
  
  <Input data-testid="shares-input" />
  <Input data-testid="price-input" />
  <Button data-testid="submit-button" />
</Dialog>
```

### Mock Requirements

```typescript
// For testing, mock these hooks:
jest.mock('wagmi', () => ({
  useAccount: () => ({ address: '0x123...' }),
  useReadContract: () => ({ data: BigInt(1000000000) }), // 1000 USDT
  useWriteContract: () => ({ writeContract: jest.fn(), isPending: false })
}))

jest.mock('@/hooks/useMortgageBond', () => ({
  useMortgageBond: () => ({
    investorInfo: [BigInt(100000000), ...] // 100 shares
  })
}))
```

---

## Dependencies

### External

- `@radix-ui/react-dialog` - Modal framework
- `@radix-ui/react-tabs` - Tab switching
- `wagmi` - Ethereum interaction
- `viem` - Ethereum utilities (parseUnits, formatUnits)

### Internal

- `@/components/ui/*` - Shadcn UI components
- `@/hooks/useMortgageBond` - Bond contract state
- `@/hooks/useFormValidation` - Form management
- `@/hooks/useTransactionWithToast` - Transaction handling
- `@/lib/contracts` - Contract ABIs and addresses
- `@/lib/validation` - Validation rules library

---

## Version

**API Version**: 1.0.0  
**Stability**: Stable  
**Breaking Changes**: None expected (initial release)

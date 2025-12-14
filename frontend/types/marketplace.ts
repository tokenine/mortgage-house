/**
 * Marketplace types for order creation modal
 */

/**
 * Discriminated union type representing which order creation mode is active
 */
export type OrderMode = 'sell' | 'buy'

/**
 * Form data for order creation, shared across both modes
 */
export interface OrderFormValues {
  shares: string  // Number of shares to sell/buy (stored as string for input handling)
  price: string   // Total price in USDT (stored as string for input handling)
}

/**
 * User balance state displayed in the modal
 */
export interface UserBalanceState {
  shareBalance: bigint              // User's bond share balance (from contract)
  usdtBalance: bigint               // User's USDT token balance (from contract)
  availableShares: string           // Formatted share balance for display
  availableUSDT: string             // Formatted USDT balance for display
}

/**
 * Transaction state of ongoing blockchain transaction
 */
export interface TransactionState {
  isApproving: boolean              // Approval transaction submitted
  isApproveConfirming: boolean      // Approval confirmed by wallet, awaiting block
  isApproveSuccess: boolean         // Approval confirmed on-chain
  isOrderPending: boolean           // Order creation submitted
  isOrderConfirming: boolean        // Order confirmed by wallet, awaiting block
  isOrderSuccess: boolean           // Order creation confirmed on-chain
  error?: Error                     // Transaction error if any
}

/**
 * Validation state for real-time form validation
 */
export interface ValidationState {
  shares: {
    error?: string
  }
  price: {
    error?: string
  }
  isValid: boolean
  touched: {
    shares: boolean
    price: boolean
  }
}

/**
 * Marketplace order (existing structure, included for reference)
 */
export interface SellOrder {
  id: number
  seller: string
  shareAmount: bigint
  price: bigint
  isActive: boolean
}

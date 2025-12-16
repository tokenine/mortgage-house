/**
 * Validation rules for order creation modal
 * 
 * Provides mode-specific validation rules for sell and buy orders.
 * Rules are dynamically generated based on user balances and selected mode.
 * 
 * Error messages are user-friendly and actionable.
 * 
 * @module lib/order-validation
 */

import { ValidationRule } from '@/shared/lib/validation'
import { OrderMode } from '@/types/marketplace'

export interface GetValidationRulesOptions {
  mode: OrderMode
  availableShares: string
  availableUSDT: string
}

/**
 * Get validation rules based on the current order mode
 * 
 * Sell Mode Validation:
 * - shares: Required, whole number, > 0, ≤ user's available shares
 * - price: Required, positive decimal
 * 
 * Buy Mode Validation:
 * - shares: Required, whole number, > 0 (no maximum)
 * - price: Required, positive decimal, ≤ user's USDT balance
 * 
 * @param options - Configuration with mode and available balances
 * @returns Object with validation rules for shares and price fields
 * 
 * @example
 * ```tsx
 * const rules = getValidationRules({
 *   mode: 'sell',
 *   availableShares: '100.5',
 *   availableUSDT: '5000'
 * })
 * ```
 */
export function getValidationRules({
  mode,
  availableShares,
  availableUSDT,
}: GetValidationRulesOptions) {
  const baseSharesRules: ValidationRule<string> = {
    required: true,
    custom: (value: string) => {
      if (!value) return 'Shares is required'
      
      const num = parseFloat(value)
      if (isNaN(num)) return 'Must be a valid number'
      if (num <= 0) return 'Shares must be greater than 0'
      if (num % 1 !== 0) return 'Shares must be whole numbers'
      
      return undefined
    },
  }

  const basePriceRules: ValidationRule<string> = {
    required: true,
    custom: (value: string) => {
      if (!value) return 'Price is required'
      
      const num = parseFloat(value)
      if (isNaN(num)) return 'Must be a valid number'
      if (num <= 0) return 'Price must be greater than 0'
      
      return undefined
    },
  }

  if (mode === 'sell') {
    return {
      shares: {
        ...baseSharesRules,
        custom: (value: string) => {
          // Run base validation first
          const baseError = baseSharesRules.custom?.(value)
          if (baseError) return baseError
          
          const num = parseFloat(value)
          const userShares = parseFloat(availableShares)
          
          if (num > userShares) {
            return `You only have ${availableShares} shares available`
          }
          
          return undefined
        },
      },
      price: basePriceRules,
    }
  }

  // Buy mode
  return {
    shares: baseSharesRules,
    price: {
      ...basePriceRules,
      custom: (value: string) => {
        // Run base validation first
        const baseError = basePriceRules.custom?.(value)
        if (baseError) return baseError
        
        const num = parseFloat(value)
        const userUSDT = parseFloat(availableUSDT)
        
        if (num > userUSDT) {
          return `Insufficient USDT. You have ${availableUSDT} USDT`
        }
        
        return undefined
      },
    },
  }
}
